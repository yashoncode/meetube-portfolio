(() => {
  const counters = document.querySelectorAll('[data-stars]');
  if (!counters.length || !window.fetch || !window.AbortController) return;

  const tallyLink = document.querySelector('.stars-link');
  const heading = document.querySelector('[data-stars-heading]');
  const key = 'meetube.github-stars.pair.v2';
  const interval = 5 * 60 * 1000;
  let nextRefresh = 0;
  let snapshot = null;
  let timer;
  let pending = false;

  function validCount(count) {
    return Number.isSafeInteger(count) && count >= 0;
  }
  function display() {
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

  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (Number.isFinite(saved?.nextRefresh)) nextRefresh = saved.nextRefresh;
    const pair = saved?.snapshot;
    if (validCount(pair?.phone) && validCount(pair?.tv) && Number.isFinite(pair.checkedAt)) {
      snapshot = pair;
      display();
    }
  } catch { /* Storage is optional on local files and private tabs. */ }

  async function countFor(repo, signal) {
    const response = await fetch('https://api.github.com/repos/yashoncode/' + repo, {credentials:'omit', signal});
    if (!response.ok) {
      if (response.status === 429 || response.status === 403) {
        const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
        const wait = Number(response.headers.get('retry-after')) * 1000;
        if (Number.isFinite(reset)) nextRefresh = Math.max(nextRefresh, reset);
        if (Number.isFinite(wait)) nextRefresh = Math.max(nextRefresh, Date.now() + wait);
      }
      return null;
    }
    const data = await response.json();
    return validCount(data.stargazers_count) ? data.stargazers_count : null;
  }

  function schedule() {
    clearTimeout(timer);
    if (!document.hidden && !pending) timer = setTimeout(refresh, Math.max(0, nextRefresh - Date.now()));
  }
  async function refresh() {
    if (document.hidden || pending) return;
    pending = true;
    nextRefresh = Date.now() + interval;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const [phone, tv] = await Promise.all(['meetube', 'meetube-tv'].map(repo =>
        countFor(repo, controller.signal).catch(() => null)
      ));
      if (validCount(phone) && validCount(tv)) {
        snapshot = {phone, tv, checkedAt: Date.now()};
        display();
      }
    } finally {
      clearTimeout(timeout);
      pending = false;
      try { sessionStorage.setItem(key, JSON.stringify({nextRefresh, snapshot})); } catch { /* Memory is sufficient. */ }
      schedule();
    }
  }
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('pageshow', schedule);
  schedule();
})();
