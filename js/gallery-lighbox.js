/**
 * GALLERY LIGHTBOX
 * Simplified lightbox for gallery page
 */

class GalleryLightbox {
  constructor(images = []) {
    this.images = images;
    this.currentIndex = 0;
    this.zoomLevel = 1;
    this.minZoom = 0.5;
    this.maxZoom = 3;
    this.zoomStep = 0.25;

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.translateX = 0;
    this.translateY = 0;

    this.touchStartX = 0;
    this.touchStartY = 0;

    this.lightbox = document.getElementById('lightbox');
    this.lightboxImage = document.getElementById('lightboxImage');
    this.lightboxTitle = document.getElementById('lightboxTitle');
    this.lightboxDescription = document.getElementById('lightboxDescription');
    this.lightboxCounter = document.getElementById('lightboxCounter');
    this.imageWrapper = document.querySelector('.lightbox-image-wrapper');

    this.init();
  }

  init() {
    this.attachEvents();
  }

  attachEvents() {
    // Close handlers
    document.querySelector('.lightbox-close')?.addEventListener('click', () => this.close());
    document.querySelector('.lightbox-overlay')?.addEventListener('click', () => this.close());

    // Navigation
    document.querySelector('.lightbox-prev')?.addEventListener('click', () => this.prev());
    document.querySelector('.lightbox-next')?.addEventListener('click', () => this.next());

    // Zoom controls
    document.querySelector('.zoom-in')?.addEventListener('click', () => this.zoomIn());
    document.querySelector('.zoom-out')?.addEventListener('click', () => this.zoomOut());
    document.querySelector('.zoom-reset')?.addEventListener('click', () => this.resetZoom());

    // Keyboard
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Mouse drag
    this.lightboxImage?.addEventListener('mousedown', (e) => this.startDrag(e));
    this.lightboxImage?.addEventListener('mousemove', (e) => this.drag(e));
    this.lightboxImage?.addEventListener('mouseup', () => this.endDrag());
    this.lightboxImage?.addEventListener('mouseleave', () => this.endDrag());

    // Touch drag
    this.lightboxImage?.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    this.lightboxImage?.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.lightboxImage?.addEventListener('touchend', () => this.handleTouchEnd());

    // Swipe navigation
    this.imageWrapper?.addEventListener('touchstart', (e) => this.handleSwipeStart(e), { passive: true });
    this.imageWrapper?.addEventListener('touchend', (e) => this.handleSwipeEnd(e), { passive: true });
  }

  updateImages(images) {
    this.images = images;
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

  handleTouchStart(e) {
    if (this.zoomLevel <= 1 || e.touches.length !== 1) return;
    this.isDragging = true;
    this.startX = e.touches[0].clientX - this.translateX;
    this.startY = e.touches[0].clientY - this.translateY;
  }

  handleTouchMove(e) {
    if (!this.isDragging || this.zoomLevel <= 1 || e.touches.length !== 1) return;
    e.preventDefault();
    this.translateX = e.touches[0].clientX - this.startX;
    this.translateY = e.touches[0].clientY - this.startY;
    this.applyZoom();
  }

  handleTouchEnd() {
    this.isDragging = false;
  }

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

    if (Math.abs(diffX) > 50 && diffY < 100) {
      if (diffX > 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }
}
