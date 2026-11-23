(() => {
  const viewer = document.querySelector('.screenshot-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;

  const links = Array.from(document.querySelectorAll('.screenshot'));
  const title = viewer.querySelector('h3');
  const image = viewer.querySelector('.viewer-image');
  const position = viewer.querySelector('.viewer-position');
  let current = 0;

  function show(index) {
    current = (index + links.length) % links.length;
    const link = links[current];
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    title.textContent = link.querySelector('span').textContent;
    position.textContent = (current + 1) + ' of ' + links.length;
  }

  links.forEach((link, index) => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      show(index);
      viewer.showModal();
    });
  });
  viewer.querySelector('[data-previous]').addEventListener('click', () => show(current - 1));
  viewer.querySelector('[data-next]').addEventListener('click', () => show(current + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(current + (event.key === 'ArrowLeft' ? -1 : 1));
  });
})();
