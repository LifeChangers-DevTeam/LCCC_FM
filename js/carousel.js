/* js/carousel.js
   Stacked cards: clicks / next bring back card to front with a subtle transform
*/
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.program-carousel');
    if (!wrapper) return;
    const cards = Array.from(wrapper.querySelectorAll('.card'));
    const nextBtn = wrapper.querySelector('.carousel-btn.next');
    const prevBtn = wrapper.querySelector('.carousel-btn.prev');
    let current = 0;

    function layout() {
      cards.forEach((c, i) => {
        const pos = (i - current + cards.length) % cards.length;
        // stack styling: translate + scale
        const z = cards.length - pos;
        c.style.zIndex = z;
        c.style.transform = `translateX(${pos * 8}px) translateY(${pos * 6}px) scale(${1 - pos * 0.03})`;
        c.style.opacity = pos > 2 ? 0.4 : 1;
        c.classList.toggle('active', pos === 0);
      });
    }

    nextBtn?.addEventListener('click', () => { current = (current + 1) % cards.length; layout(); });
    prevBtn?.addEventListener('click', () => { current = (current - 1 + cards.length) % cards.length; layout(); });

    cards.forEach((c, i) => {
      c.addEventListener('click', () => {
        // bring clicked card to front
        current = i;
        layout();
      });
    });

    // initial layout
    layout();
  });
})();
