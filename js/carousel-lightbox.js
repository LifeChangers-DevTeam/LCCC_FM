/**
 * GLASSMORPHISM CAROUSEL & LIGHTBOX
 * Smooth, elegant image display system
 */

class Carousel {
  constructor() {
    this.items = document.querySelectorAll('.item');
    this.currentIndex = 0;
    this.prevBtn = document.querySelector('.button .prev');
    this.nextBtn = document.querySelector('.button .next');
    this.slideTitle = document.getElementById('slideTitle');
    this.slideMessage = document.getElementById('slideMessage');
    this.autoSlideInterval = null;
    this.autoSlideDelay = 7000; // 7 seconds

    this.init();
  }

  init() {
    if (this.items.length > 0) {
      this.showSlide(0);
      this.attachEvents();
      this.startAutoSlide();
    }
  }

  attachEvents() {
    // Navigation buttons
    this.nextBtn?.addEventListener('click', () => {
      this.next();
      this.resetAutoSlide();
    });
    
    this.prevBtn?.addEventListener('click', () => {
      this.prev();
      this.resetAutoSlide();
    });

    // Click on active slide or "See More" button opens lightbox
    this.items.forEach((item, index) => {
      const viewBtn = item.querySelector('.view-btn');

      // Click on slide (when active)
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-btn')) {
          return; // Let button handler take over
        }
        if (item.classList.contains('active')) {
          this.openLightbox(index);
        }
      });

      // Click on "See More" button
      viewBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openLightbox(index);
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (window.lightbox?.lightbox?.classList.contains('active')) {
        return; // Don't interfere with lightbox
      }
      
      if (e.key === 'ArrowLeft') {
        this.prev();
        this.resetAutoSlide();
      } else if (e.key === 'ArrowRight') {
        this.next();
        this.resetAutoSlide();
      }
    });
  }

  showSlide(index) {
    this.items.forEach(item => item.classList.remove('active'));
    this.items[index].classList.add('active');
    this.currentIndex = index;
    this.updateCaption(index);
  }

  updateCaption(index) {
    const item = this.items[index];
    const name = item.querySelector('.name')?.textContent || '';
    const description = item.querySelector('.des')?.textContent || '';

    if (this.slideTitle) this.slideTitle.textContent = name;
    if (this.slideMessage) this.slideMessage.textContent = description;
  }

  next() {
    const newIndex = (this.currentIndex + 1) % this.items.length;
    this.showSlide(newIndex);
  }

  prev() {
    const newIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
    this.showSlide(newIndex);
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.next();
    }, this.autoSlideDelay);
  }

  resetAutoSlide() {
    clearInterval(this.autoSlideInterval);
    this.startAutoSlide();
  }

  stopAutoSlide() {
    clearInterval(this.autoSlideInterval);
  }

  openLightbox(index) {
    if (window.lightbox) {
      this.stopAutoSlide();
      window.lightbox.open(index);
    }
  }

  getCurrentIndex() {
    return this.currentIndex;
  }
}

class Lightbox {
  constructor(carousel) {
    this.carousel = carousel;
    this.lightbox = document.getElementById('lightbox');
    this.lightboxImage = document.getElementById('lightboxImage');
    this.lightboxTitle = document.getElementById('lightboxTitle');
    this.lightboxDescription = document.getElementById('lightboxDescription');
    this.lightboxCounter = document.getElementById('lightboxCounter');
    this.closeBtn = document.querySelector('.lightbox-close');
    this.prevBtn = document.querySelector('.lightbox-prev');
    this.nextBtn = document.querySelector('.lightbox-next');
    this.overlay = document.querySelector('.lightbox-overlay');
    this.imageWrapper = document.querySelector('.lightbox-image-wrapper');

    // Zoom controls
    this.zoomInBtn = document.querySelector('.zoom-in');
    this.zoomOutBtn = document.querySelector('.zoom-out');
    this.zoomResetBtn = document.querySelector('.zoom-reset');

    // State
    this.currentIndex = 0;
    this.zoomLevel = 1;
    this.minZoom = 0.5;
    this.maxZoom = 3;
    this.zoomStep = 0.25;

    // Dragging state
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.translateX = 0;
    this.translateY = 0;

    // Touch state
    this.touchStartX = 0;
    this.touchStartY = 0;

    // Extract images from carousel
    this.images = this.extractImages();

    this.init();
  }

  extractImages() {
    const items = document.querySelectorAll('.item');
    return Array.from(items).map(item => {
      const bgImage = item.style.backgroundImage;
      const url = bgImage.slice(4, -1).replace(/["']/g, '');
      const name = item.querySelector('.name')?.textContent || '';
      const description = item.querySelector('.des')?.textContent || '';

      return { url, name, description };
    });
  }

  init() {
    this.attachEvents();
  }

  attachEvents() {
    // Close handlers
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());

    // Navigation
    this.prevBtn?.addEventListener('click', () => this.prev());
    this.nextBtn?.addEventListener('click', () => this.next());

    // Zoom controls
    this.zoomInBtn?.addEventListener('click', () => this.zoomIn());
    this.zoomOutBtn?.addEventListener('click', () => this.zoomOut());
    this.zoomResetBtn?.addEventListener('click', () => this.resetZoom());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Mouse drag (when zoomed)
    this.lightboxImage?.addEventListener('mousedown', (e) => this.startDrag(e));
    this.lightboxImage?.addEventListener('mousemove', (e) => this.drag(e));
    this.lightboxImage?.addEventListener('mouseup', () => this.endDrag());
    this.lightboxImage?.addEventListener('mouseleave', () => this.endDrag());

    // Touch drag (when zoomed)
    this.lightboxImage?.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    this.lightboxImage?.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.lightboxImage?.addEventListener('touchend', () => this.handleTouchEnd());

    // Swipe navigation (when not zoomed)
    this.imageWrapper?.addEventListener('touchstart', (e) => this.handleSwipeStart(e), { passive: true });
    this.imageWrapper?.addEventListener('touchend', (e) => this.handleSwipeEnd(e), { passive: true });
  }

  open(index = 0) {
    this.currentIndex = index;
    this.showImage(index);
    this.lightbox?.classList.add('active');
    document.body.classList.add('lightbox-open');
  }

  close() {
    this.lightbox?.classList.remove('active');
    document.body.classList.remove('lightbox-open');
    this.resetZoom();
    
    // Restart carousel auto-slide
    if (this.carousel) {
      setTimeout(() => {
        this.carousel.startAutoSlide();
      }, 300);
    }
  }

  showImage(index) {
    if (index < 0 || index >= this.images.length) return;

    const image = this.images[index];
    this.lightboxImage.src = image.url;
    this.lightboxImage.alt = image.name;

    if (this.lightboxTitle) this.lightboxTitle.textContent = image.name;
    if (this.lightboxDescription) this.lightboxDescription.textContent = image.description;
    if (this.lightboxCounter) {
      this.lightboxCounter.textContent = `${index + 1} / ${this.images.length}`;
    }

    this.currentIndex = index;
    this.resetZoom();
  }

  next() {
    const newIndex = (this.currentIndex + 1) % this.images.length;
    this.showImage(newIndex);
  }

  prev() {
    const newIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.showImage(newIndex);
  }

  handleKeyboard(e) {
    if (!this.lightbox?.classList.contains('active')) return;

    switch(e.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.prev();
        break;
      case 'ArrowRight':
        this.next();
        break;
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
      case '_':
        this.zoomOut();
        break;
      case '0':
        this.resetZoom();
        break;
    }
  }

  // Zoom functionality
  zoomIn() {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel += this.zoomStep;
      this.applyZoom();
    }
  }

  zoomOut() {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel -= this.zoomStep;
      this.applyZoom();
    }
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.applyZoom();
    this.lightboxImage?.classList.remove('zoomed');
    if (this.imageWrapper) {
      this.imageWrapper.style.overflow = 'hidden';
    }
  }

  applyZoom() {
    if (this.lightboxImage) {
      this.lightboxImage.style.transform =
        `scale(${this.zoomLevel}) translate(${this.translateX}px, ${this.translateY}px)`;

      if (this.zoomLevel > 1) {
        this.lightboxImage.classList.add('zoomed');
        if (this.imageWrapper) {
          this.imageWrapper.style.overflow = 'auto';
        }
      } else {
        this.lightboxImage.classList.remove('zoomed');
        if (this.imageWrapper) {
          this.imageWrapper.style.overflow = 'hidden';
        }
      }
    }
  }

  // Drag functionality (for zoomed images)
  startDrag(e) {
    if (this.zoomLevel <= 1) return;

    this.isDragging = true;
    this.startX = e.clientX - this.translateX;
    this.startY = e.clientY - this.translateY;
    this.lightboxImage?.classList.add('dragging');
  }

  drag(e) {
    if (!this.isDragging || this.zoomLevel <= 1) return;

    e.preventDefault();
    this.translateX = e.clientX - this.startX;
    this.translateY = e.clientY - this.startY;
    this.applyZoom();
  }

  endDrag() {
    this.isDragging = false;
    this.lightboxImage?.classList.remove('dragging');
  }

  // Touch drag (for zoomed images)
  handleTouchStart(e) {
    if (this.zoomLevel <= 1 || e.touches.length !== 1) return;

    this.isDragging = true;
    this.startX = e.touches[0].clientX - this.translateX;
    this.startY = e.touches[0].clientY - this.translateY;
  }

  handleTouchMove(e) {
    if (!this.isDragging || this.zoomLevel <= 1 || e.touches.length !== 1) return;

    e.preventDefault(); // Prevent scrolling while dragging
    this.translateX = e.touches[0].clientX - this.startX;
    this.translateY = e.touches[0].clientY - this.startY;
    this.applyZoom();
  }

  handleTouchEnd() {
    this.isDragging = false;
  }

  // Swipe navigation (for non-zoomed images)
  handleSwipeStart(e) {
    if (this.zoomLevel > 1) return;

    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  handleSwipeEnd(e) {
    if (this.zoomLevel > 1) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = this.touchStartX - touchEndX;
    const diffY = Math.abs(this.touchStartY - touchEndY);

    // Horizontal swipe with minimal vertical movement
    if (Math.abs(diffX) > 50 && diffY < 100) {
      if (diffX > 0) {
        this.next(); // Swipe left = next
      } else {
        this.prev(); // Swipe right = previous
      }
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  if (window.homeContentLoader) {
    try {
      await window.homeContentLoader;
    } catch (error) {
      console.error('[Carousel] Content loader failed:', error);
    }
  }

  const carousel = new Carousel();
  const lightbox = new Lightbox(carousel);

  // Make available globally for cross-component access
  window.carousel = carousel;
  window.lightbox = lightbox;

  console.log('✨ Glassmorphism Carousel & Lightbox initialized');
});
