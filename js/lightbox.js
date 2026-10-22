/* js/lightbox.js
   Advanced lightbox: arrows, keyboard, swipe, accessibility, preload
*/
(function () {
  const LB = {
    el: null,
    image: null,
    caption: null,
    openBtn: null,
    closeBtn: null,
    prevBtn: null,
    nextBtn: null,
    items: [],
    current: 0,
    isOpen: false,
    touchStartX: 0,
    touchEndX: 0,
  };

  function query() {
    LB.el = document.getElementById('lightbox');
    LB.image = document.getElementById('lightboxImage');
    LB.caption = document.getElementById('lightboxCaption');
    LB.openBtn = document.getElementById('openLightbox');
    LB.closeBtn = document.getElementById('closeLightbox');
    LB.prevBtn = document.getElementById('lightboxPrev');
    LB.nextBtn = document.getElementById('lightboxNext');
    LB.items = Array.from(document.querySelectorAll('.program-carousel .card img, .event-card img'));
  }

  function show(index) {
    if (!LB.el) return;
    LB.current = index >= LB.items.length ? 0 : (index < 0 ? LB.items.length - 1 : index);
    const src = LB.items[LB.current].getAttribute('src');
    const alt = LB.items[LB.current].getAttribute('alt') || '';
    // set loading state
    LB.el.classList.add('loading');
    LB.image.setAttribute('alt', alt);
    LB.caption.textContent = alt;

    // Preload
    const img = new Image();
    img.onload = () => {
      LB.image.src = src;
      LB.el.classList.remove('loading');
    };
    img.src = src;

    // show
    LB.el.style.display = 'flex';
    LB.el.setAttribute('aria-hidden', 'false');
    LB.el.querySelector('.lightbox-stage').focus();
    document.body.style.overflow = 'hidden';
    LB.isOpen = true;
  }

  function hide() {
    LB.el.style.display = 'none';
    LB.el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    LB.isOpen = false;
  }

  function next() { show(LB.current + 1); }
  function prev() { show(LB.current - 1); }

  function onKey(e) {
    if (!LB.isOpen) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  }

  function onTouchStart(e) {
    LB.touchStartX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
  }

  function onTouchEnd(e) {
    LB.touchEndX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : e.clientX;
    const diff = LB.touchStartX - LB.touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
  }

  function bind() {
    if (!LB.openBtn) return;
    // open from main event/thumbs
    LB.items.forEach((imgEl, idx) => {
      imgEl.closest('a')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        show(idx);
      });
      imgEl.addEventListener('click', () => show(idx));
    });

    LB.openBtn?.addEventListener('click', (ev) => {
      ev.preventDefault();
      // open first item (or current)
      show(0);
    });

    LB.closeBtn?.addEventListener('click', hide);
    LB.prevBtn?.addEventListener('click', prev);
    LB.nextBtn?.addEventListener('click', next);

    LB.el?.addEventListener('click', (e) => {
      if (e.target === LB.el) hide(); // background click
    });

    document.addEventListener('keydown', onKey);
    LB.el?.addEventListener('touchstart', onTouchStart, { passive: true });
    LB.el?.addEventListener('touchend', onTouchEnd, { passive: true });
    LB.el?.addEventListener('mousedown', onTouchStart);
    LB.el?.addEventListener('mouseup', onTouchEnd);
  }

  function init() {
    query();
    bind();
  }

  // init after DOM loaded
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
