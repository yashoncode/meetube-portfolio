(() => {
  const key = 'meetube.landing.theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  const chromeColor = document.querySelector('meta[name="theme-color"]');
  let choice = null;
  let toggle;
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'dark' || saved === 'light') choice = saved;
  } catch { /* A blocked store still allows a theme for this visit. */ }

  function apply() {
    const dark = choice ? choice === 'dark' : system.matches;
    root.dataset.theme = dark ? 'dark' : 'light';
    if (chromeColor) chromeColor.content = dark ? '#17181a' : '#ffffff';
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    }
  }

  apply();
  if (system.addEventListener) system.addEventListener('change', apply);
  else system.addListener(apply);
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    choice = ['dark', 'light'].includes(event.newValue) ? event.newValue : null;
    apply();
  });
  document.addEventListener('DOMContentLoaded', () => {
    toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      choice = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply();
      try { localStorage.setItem(key, choice); } catch { /* Keep the in-memory choice. */ }
    });
    apply();
    toggle.hidden = false;
  });
})();
