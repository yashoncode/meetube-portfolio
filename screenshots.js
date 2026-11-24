(() => {
  const viewer = document.querySelector('.screenshot-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;

  const links = Array.from(document.querySelectorAll('.screenshot'));
  const title = viewer.querySelector('h3');
  let image = viewer.querySelector('.viewer-image');
  const position = viewer.querySelector('.viewer-position');
  let current = 0;
  let swipeStart = null;

  function show(index) {
    const step = index - current;
    current = (index + links.length) % links.length;
    const link = links[current];
    // A fresh image restarts the arrival even for consecutive steps in the same direction.
    const nextImage = new Image();
    nextImage.className = 'viewer-image';
    nextImage.src = link.href;
    nextImage.alt = link.querySelector('img').alt;
    if (viewer.open) nextImage.dataset.direction = step > 0 ? 'next' : 'previous';
    image.replaceWith(nextImage);
    image = nextImage;
    swipeStart = null;
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

  viewer.addEventListener('pointerdown', event => {
    swipeStart = null;
    if (event.target !== image || event.pointerType === 'mouse' || !event.isPrimary) return;
    if (window.visualViewport?.scale > 1) return;
    swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  viewer.addEventListener('pointercancel', () => { swipeStart = null; });
  viewer.addEventListener('pointerup', event => {
    if (!swipeStart || event.pointerId !== swipeStart.id) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      show(current + (dx < 0 ? 1 : -1));
    }
  });
})();
