(() => {
  if (!window.fetch || !window.AbortController) return;

  const builds = ['universal', 'arm64-v8a', 'armeabi-v7a'];

  function readRelease(release, project) {
    const tag = release.tag_name;
    const version = typeof tag === 'string' && project.tagPattern.exec(tag)?.[1];
    if (!version || release.draft || release.prerelease || !Array.isArray(release.assets)) return;

    const base = 'https://github.com/yashoncode/' + project.repo + '/releases';
    const notes = base + '/tag/' + tag;
    if (release.html_url !== undefined && release.html_url !== notes) return;

    const assets = {};
    for (const build of builds) {
      const name = project.app + '_' + version + '_' + build + '.apk';
      const matches = release.assets.filter(asset => asset?.name === name);
      if (matches.length !== 1) return;

      const asset = matches[0];
      const url = base + '/download/' + tag + '/' + name;
      const hash = typeof asset.digest === 'string' && /^sha256:([0-9a-f]{64})$/i.exec(asset.digest)?.[1];
      if (asset.browser_download_url !== url || !hash ||
          !Number.isSafeInteger(asset.size) || asset.size <= 0 ||
          (asset.state !== undefined && asset.state !== 'uploaded')) return;

      assets[build] = { name, url, hash, size: (asset.size / 1e6).toFixed(1) + ' MB' };
    }
    return { version: 'v' + version, notes, assets };
  }

  async function refresh(platform, project) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch('https://api.github.com/repos/yashoncode/' + project.repo + '/releases/latest', {
        signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'error'
      });
      if (!response.ok) return;
      const release = readRelease(await response.json(), project);
      if (!release) return;

      // All three files have been checked. Update every copy in the same render.
      for (const area of document.querySelectorAll('[data-platform="' + platform + '"]')) {
        for (const link of area.querySelectorAll('[data-apk]')) link.href = release.assets[link.dataset.apk].url;
        for (const link of area.querySelectorAll('[data-notes]')) link.href = release.notes;
        for (const el of area.querySelectorAll('[data-version]')) el.textContent = release.version;
        for (const el of area.querySelectorAll('[data-size]')) el.textContent = release.assets[el.dataset.size].size;
        for (const el of area.querySelectorAll('[data-filename]')) el.textContent = release.assets[el.dataset.filename].name;
        for (const el of area.querySelectorAll('[data-sha256]')) el.textContent = release.assets[el.dataset.sha256].hash;
      }
    } catch {
      // Leave the verified HTML in place if the release API is unavailable.
    } finally {
      clearTimeout(timeout);
    }
  }

  refresh('phone', { repo: 'meetube', app: 'MeeTube', tagPattern: /^v(\d+\.\d+\.\d+)$/ });
  refresh('tv', { repo: 'meetube-tv', app: 'MeeTubeTV', tagPattern: /^tv-v(\d+\.\d+\.\d+)$/ });
})();
