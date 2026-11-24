(() => {
  if (!window.fetch || !window.AbortController) return;

  const interval = 5 * 60 * 1000;
  const counters = document.querySelectorAll('[data-stars]');
  const tallyLink = document.querySelector('.stars-link');
  const heading = document.querySelector('[data-stars-heading]');
  const downloads = document.querySelector('[data-apk-downloads]');

  function validCount(count) {
    return Number.isSafeInteger(count) && count >= 0;
  }

  function validPair(phone, tv) {
    return validCount(phone) && validCount(tv) && validCount(phone + tv);
  }

  function displayStars(snapshot) {
    const counts = { phone: snapshot.phone, tv: snapshot.tv, total: snapshot.phone + snapshot.tv };
    for (const counter of counters) {
      const value = counts[counter.dataset.stars];
      counter.textContent = value.toLocaleString();
      counter.title = value.toLocaleString() + ' GitHub stars · Last checked ' + new Date(snapshot.checkedAt).toLocaleString();
      counter.hidden = false;
    }
    heading.textContent = 'Combined GitHub stars';
    const fact = tallyLink.closest('.fact-stars');
    if (fact) fact.hidden = false;
    tallyLink.hidden = false;
  }

  function displayDownloads({phone, tv, checkedAt}) {
    downloads.textContent = (phone + tv).toLocaleString();
    downloads.title = 'Last checked ' + new Date(checkedAt).toLocaleString();
    downloads.parentElement.hidden = false;
  }

  async function countStars(repo, get) {
    const {data} = await get(repo);
    return data.stargazers_count;
  }

  async function countDownloads(repo, get) {
    const perPage = 100;
    let total = 0;
    for (let page = 1; ; page++) {
      const {data, headers} = await get(repo + '/releases?per_page=' + perPage + '&page=' + page);
      if (!Array.isArray(data)) throw new Error('Invalid release list');
      for (const release of data) {
        if (release.draft || release.published_at === null) continue;
        if (!Array.isArray(release.assets)) throw new Error('Invalid release assets');
        for (const asset of release.assets) {
          if (typeof asset.name !== 'string') throw new Error('Missing asset name');
          if (!asset.name.toLowerCase().endsWith('.apk')) continue;
          if (!validCount(asset.download_count)) throw new Error('Invalid APK download count');
          total += asset.download_count;
        }
      }

      const links = headers.get('link');
      const hasNext = links ? links.includes('rel="next"') : data.length === perPage;
      if (!hasNext) return total;
    }
  }

  // Each stat has its own last complete pair, in-flight requests and retry deadline.
  function pollPair(key, countFor, display) {
    let nextRefresh = 0;
    let snapshot = null;
    let timer;
    let pending = false;

    try {
      const saved = JSON.parse(sessionStorage.getItem(key));
      if (Number.isFinite(saved?.nextRefresh)) nextRefresh = saved.nextRefresh;
      const pair = saved?.snapshot;
      if (pair && validPair(pair.phone, pair.tv) && Number.isFinite(pair.checkedAt)) {
        snapshot = pair;
        display(snapshot);
      }
    } catch { /* Storage is optional on local files and private tabs. */ }

    async function get(path) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch('https://api.github.com/repos/yashoncode/' + path, {
          credentials: 'omit', cache: 'no-cache', signal: controller.signal
        });
        if (!response.ok) {
          if (response.status === 429 || response.status === 403) {
            const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
            const wait = Number(response.headers.get('retry-after')) * 1000;
            if (Number.isFinite(reset)) nextRefresh = Math.max(nextRefresh, reset);
            if (Number.isFinite(wait)) nextRefresh = Math.max(nextRefresh, Date.now() + wait);
          }
          throw new Error('GitHub request failed: ' + response.status);
        }
        return {data: await response.json(), headers: response.headers};
      } finally {
        clearTimeout(timeout);
      }
    }

    function schedule() {
      clearTimeout(timer);
      if (!document.hidden && !pending) timer = setTimeout(refresh, Math.max(0, nextRefresh - Date.now()));
    }
    async function refresh() {
      if (document.hidden || pending) return;
      pending = true;
      nextRefresh = Date.now() + interval;
      try {
        const [phone, tv] = await Promise.all(['meetube', 'meetube-tv'].map(repo =>
          countFor(repo, get).catch(() => null)
        ));
        if (validPair(phone, tv)) {
          snapshot = {phone, tv, checkedAt: Date.now()};
          display(snapshot);
        }
      } finally {
        pending = false;
        try { sessionStorage.setItem(key, JSON.stringify({nextRefresh, snapshot})); } catch { /* Memory is sufficient. */ }
        schedule();
      }
    }
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('pageshow', schedule);
    schedule();
  }

  if (counters.length) pollPair('meetube.github-stars.pair.v2', countStars, displayStars);
  if (downloads) pollPair('meetube.apk-downloads.pair.v1', countDownloads, displayDownloads);
})();
