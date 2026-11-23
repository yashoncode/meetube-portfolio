(() => {
  const root = document.documentElement;
  const studio = document.querySelector('.showcase');
  const artwork = studio.querySelector('.artwork');
  const toggle = studio.querySelector('.motion-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let paused = false;

  function centerArtwork() {
    artwork.style.removeProperty('--drift-x');
    artwork.style.removeProperty('--drift-y');
  }

  function updateMotion() {
    const playing = !paused && !reduced.matches;
    root.classList.toggle('motion-enabled', playing);
    toggle.hidden = reduced.matches;
    toggle.dataset.paused = String(paused);
    toggle.setAttribute('aria-label', paused ? 'Play animations' : 'Pause animations');
    toggle.title = toggle.getAttribute('aria-label');
    if (!playing) centerArtwork();
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    updateMotion();
  });
  reduced.addEventListener('change', updateMotion);
  studio.addEventListener('pointermove', event => {
    if (!finePointer.matches || !root.classList.contains('motion-enabled')) return;
    const bounds = studio.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8;
    artwork.style.setProperty('--drift-x', x.toFixed(1) + 'px');
    artwork.style.setProperty('--drift-y', y.toFixed(1) + 'px');
  });
  studio.addEventListener('pointerleave', centerArtwork);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.classList.toggle('offscreen', !entry.isIntersecting);
    });
    observer.observe(studio);
    document.querySelectorAll('.miniature').forEach(element => observer.observe(element));
  }
  updateMotion();
})();
