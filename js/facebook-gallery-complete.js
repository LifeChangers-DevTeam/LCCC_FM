/**
 * GALLERY LIGHTBOX - Enhanced with Video Support
 * Simplified lightbox for gallery page with video playback
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

    // Mouse drag (only for images, not videos)
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
    
    // Stop any playing videos
    const videoEl = document.getElementById('lightboxVideo');
    if (videoEl) {
      videoEl.pause();
      videoEl.remove();
    }
  }

  showImage(index) {
    if (index < 0 || index >= this.images.length) return;

    const item = this.images[index];
    
    // Clear previous content
    this.imageWrapper.innerHTML = '';
    
    if (item.type === 'video') {
      // Create video element
      const video = document.createElement('video');
      video.id = 'lightboxVideo';
      video.className = 'lightbox-video';
      video.controls = true;
      video.autoplay = true;
      video.src = item.url;
      this.imageWrapper.appendChild(video);
    } else {
      // Create image element
      const img = document.createElement('img');
      img.id = 'lightboxImage';
      img.className = 'lightbox-image';
      img.src = item.url;
      img.alt = item.name;
      this.imageWrapper.appendChild(img);
      this.lightboxImage = img;
    }

    if (this.lightboxTitle) this.lightboxTitle.textContent = item.name;
    if (this.lightboxDescription) this.lightboxDescription.textContent = item.description;
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
    if (this.zoomLevel < this.maxZoom && this.lightboxImage) {
      this.zoomLevel += this.zoomStep;
      this.applyZoom();
    }
  }

  zoomOut() {
    if (this.zoomLevel > this.minZoom && this.lightboxImage) {
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

/**
 * FACEBOOK GALLERY MANAGER - Enhanced Edition
 * Features: Videos, Photos, Filtering, Likes, Downloads
 */

class FacebookGalleryManager {
  constructor() {
    const runtimeConfig = window.__FACEBOOK_CONFIG__ || {};
    const runtimeToken = runtimeConfig.token;
    const runtimePageId = runtimeConfig.pageId;
    const hasRuntimeToken = runtimeToken && !runtimeToken.includes('__');
    const hasRuntimePageId = runtimePageId && !runtimePageId.includes('__');

    this.config = {
      pageId: hasRuntimePageId ? runtimePageId : '156055814564596',
      accessToken: hasRuntimeToken
        ? runtimeToken
        : 'EAANSQY7LuZAgBRIQB6dxZCYWbpHh3NeUkP83zjt0ITZB8UqF6HgI6IDE2AcZCFUJXsodhfVZCe8ERXqKWlZC9fWEA0Ha4DxqNh3PLIjGhQ1oMhDp6MdWAWhzfYTCXyGJRBOivcwfTC7PoXsGr3cTk2b95zBINld63nF1PITGpObQJcDl25mB7keRVIk7ZACyQ373dAEPZCHM1ZBXc3muR1Q6pg7WS9cQHYWGDEvg1hb7eHbzECjFXkwmvOdZB3nZB5fpTQqteNi4ywEi5BA7TloAHLu',
      postsLimit: 20, // Increased to get more content
      refreshInterval: 350000,
      
      // Keywords for carousel filtering
      carouselKeywords: ['scripture', 'notice', 'event', 'announcement', 'important', 'alert'],
    };

    this.posts = [];
    this.filteredPosts = [];
    this.currentFilter = 'all';
    this.galleryGrid = document.getElementById('galleryGrid');
    this.loadingState = document.getElementById('loadingState');
    this.emptyState = document.getElementById('emptyState');
    this.errorState = document.getElementById('errorState');
    this.errorMessage = document.getElementById('errorMessage');

    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadPosts();
    
    setInterval(() => {
      this.loadPosts(true);
    }, this.config.refreshInterval);
  }

  attachEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFilter = e.currentTarget.dataset.filter;
        this.filterPosts();
      });
    });

    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
      this.loadPosts();
    });
  }

  async loadPosts(silent = false) {
    if (!silent) {
      this.showLoading();
    }

    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn?.classList.add('spinning');

    try {
      if (!this.canUseFunctionFallback() && !this.canUseClientFallback()) {
        console.warn('⚠️ Facebook credentials not configured. Using demo data.');
        this.loadDemoData();
        return;
      }

      console.log('[Facebook] 🔍 Fetching posts and media...');

      // Fetch posts AND photos
      const [postsData, photosData] = await Promise.all([
        this.fetchPosts(),
        this.fetchPhotos()
      ]);

      // Combine and deduplicate
      const allItems = [...postsData, ...photosData];
      const uniqueItems = this.deduplicateItems(allItems);

      if (uniqueItems.length === 0) {
        this.showEmpty();
        return;
      }

      this.posts = uniqueItems.sort((a, b) => b.date - a.date);
      console.log('[Facebook] ✅ Successfully processed', this.posts.length, 'items');

      this.filterPosts();
      this.showGallery();
      
      // Update carousel if on index page
      this.updateCarousel();

    } catch (error) {
      console.error('[Facebook] ❌ Error:', error);
      let userMessage = this.getHelpfulErrorMessage(error);
      this.showError(userMessage);
      
      setTimeout(() => {
        this.loadDemoData();
      }, 3000);
      
    } finally {
      refreshBtn?.classList.remove('spinning');
    }
  }

  async fetchPosts() {
    const functionResult = await this.fetchPostsFromFunction();
    if (functionResult) {
      return functionResult;
    }

    if (!this.canUseClientFallback()) {
      throw new Error('Facebook feed is unavailable: Netlify function and client token are both unavailable.');
    }

    const fields = 'id,message,full_picture,created_time,permalink_url,attachments{media,type,subattachments,description,url},story';
    const url = `https://graph.facebook.com/v19.0/${this.config.pageId}/feed?fields=${fields}&limit=${this.config.postsLimit}&access_token=${this.config.accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(`${data.error.message} (Code: ${data.error.code})`);
    }

    return (data.data || []).map(post => this.processPost(post));
  }

  async fetchPhotos() {
    const functionResult = await this.fetchPhotosFromFunction();
    if (functionResult) {
      return functionResult;
    }

    if (!this.canUseClientFallback()) {
      return [];
    }

    const fields = 'id,created_time,name,picture,images,permalink_url,album';
    const url = `https://graph.facebook.com/v19.0/${this.config.pageId}/photos/uploaded?fields=${fields}&limit=50&access_token=${this.config.accessToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.warn('[Facebook] Photo fetch error:', data.error.message);
        return [];
      }

      return (data.data || []).map(photo => ({
        id: photo.id,
        message: photo.name || 'Photo from our page',
        image: photo.images?.[0]?.source || photo.picture,
        date: new Date(photo.created_time),
        link: photo.permalink_url || `https://facebook.com/${photo.id}`,
        hasImage: true,
        hasVideo: false,
        type: 'photo',
        source: 'photos'
      }));
    } catch (error) {
      console.warn('[Facebook] Photos not accessible:', error);
      return [];
    }
  }

  canUseFunctionFallback() {
    return true;
  }

  canUseClientFallback() {
    return !!(this.config.pageId && this.config.accessToken);
  }

  async fetchPostsFromFunction() {
    try {
      const response = await fetch(`/.netlify/functions/facebook-api?endpoint=feed&limit=${this.config.postsLimit}`);
      if (!response.ok) {
        console.warn('[Facebook] Netlify function feed request failed with status:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.error) {
        console.warn('[Facebook] Netlify function feed error:', data.error.message || data.error);
        return null;
      }

      return (data.data || []).map(post => this.processPost(post));
    } catch (error) {
      console.warn('[Facebook] Netlify function feed unavailable:', error);
      return null;
    }
  }

  async fetchPhotosFromFunction() {
    try {
      const response = await fetch('/.netlify/functions/facebook-api?endpoint=photos&limit=50');
      if (!response.ok) {
        console.warn('[Facebook] Netlify function photos request failed with status:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.error) {
        console.warn('[Facebook] Netlify function photos error:', data.error.message || data.error);
        return null;
      }

      return (data.data || []).map(photo => ({
        id: photo.id,
        message: photo.name || 'Photo from our page',
        image: photo.images?.[0]?.source || photo.picture,
        date: new Date(photo.created_time),
        link: photo.permalink_url || `https://facebook.com/${photo.id}`,
        hasImage: true,
        hasVideo: false,
        type: 'photo',
        source: 'photos'
      }));
    } catch (error) {
      console.warn('[Facebook] Netlify function photos unavailable:', error);
      return null;
    }
  }

  processPost(post) {
    const attachments = post.attachments?.data || [];
    const mediaAttachment = attachments.find(a => a.media);
    
    let hasVideo = false;
    let videoUrl = null;
    let imageUrl = post.full_picture;

    if (mediaAttachment && mediaAttachment.media) {
      const media = mediaAttachment.media;
      
      if (media.source && mediaAttachment.type === 'video_inline') {
        hasVideo = true;
        videoUrl = media.source;
      } else if (media.image) {
        imageUrl = media.image.src;
      }
    }

    return {
      id: post.id,
      message: post.message || post.story || 'Post from our page',
      image: imageUrl,
      video: videoUrl,
      date: new Date(post.created_time),
      link: post.permalink_url || `https://facebook.com/${post.id}`,
      hasImage: !!imageUrl,
      hasVideo: hasVideo,
      type: hasVideo ? 'video' : 'photo',
      source: 'posts'
    };
  }

  deduplicateItems(items) {
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  filterPosts() {
    const now = new Date();
    
    switch (this.currentFilter) {
      case 'recent':
        // Last 30 days
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 15);
        this.filteredPosts = this.posts.filter(post => post.date >= monthAgo);
        break;
      
      case 'photos':
        // Only items with images (no videos)
        this.filteredPosts = this.posts.filter(post => post.hasImage && !post.hasVideo);
        break;
      
      case 'videos':
        // Only videos
        this.filteredPosts = this.posts.filter(post => post.hasVideo);
        break;
      
      case 'all':
      default:
        this.filteredPosts = [...this.posts];
        break;
    }

    this.renderGallery();
  }

  getCarouselPosts() {
    // Get posts with carousel keywords
    return this.posts
      .filter(post => {
        const text = (post.message || '').toLowerCase();
        return this.config.carouselKeywords.some(keyword => text.includes(keyword));
      })
      .slice(0, 5); // Max 5 posts
  }

  updateCarousel() {
    // Check if we're on index page
    const carouselSlide = document.querySelector('.slide');
    if (!carouselSlide) return;

    const carouselPosts = this.getCarouselPosts();
    if (carouselPosts.length === 0) return;

    console.log('[Carousel] Updating with', carouselPosts.length, 'posts');
    
    // Clear existing items
    carouselSlide.innerHTML = '';

    // Add new items
    carouselPosts.forEach(post => {
      const item = document.createElement('div');
      item.className = 'item';
      item.style.backgroundImage = `url(${post.image || 'resources/background.png'})`;
      
      const title = this.extractTitle(post.message);
      const description = this.truncateText(post.message, 100);
      
      item.innerHTML = `
        <div class="content">
          <div class="name">${title}</div>
          <div class="des">${description}</div>
          <button class="view-btn" onclick="window.open('${post.link}', '_blank')">See More</button>
        </div>
      `;
      
      carouselSlide.appendChild(item);
    });

    // Reinitialize carousel if Carousel class exists
    if (typeof Carousel !== 'undefined' && window.carousel) {
      window.carousel.reset();
    }
  }

  extractTitle(text) {
    // Try to extract title from first line or first sentence
    const firstLine = text.split('\n')[0];
    const firstSentence = firstLine.split('.')[0];
    return this.truncateText(firstSentence || firstLine || 'Update', 40);
  }

  renderGallery() {
    if (this.filteredPosts.length === 0) {
      this.showEmpty();
      return;
    }

    this.galleryGrid.innerHTML = '';

    this.filteredPosts.forEach((post, index) => {
      const item = this.createGalleryItem(post, index);
      this.galleryGrid.appendChild(item);
    });
  }

  createGalleryItem(post, index) {
    const item = document.createElement('div');
    item.className = `gallery-item ${!post.hasImage && !post.hasVideo ? 'no-image' : ''}`;
    item.dataset.index = index;

    const formattedDate = this.formatDate(post.date);
    const truncatedMessage = this.truncateText(post.message, 150);

    item.innerHTML = `
      ${post.hasVideo ? `
        <div class="gallery-item-video-preview">
          <video class="gallery-item-video" src="${post.video}" muted loop onmouseenter="this.play()" onmouseleave="this.pause()"></video>
          <div class="video-overlay">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>
      ` : post.hasImage ? `
        <img src="${post.image}" alt="Post image" class="gallery-item-image" loading="lazy" onerror="this.style.display='none'">
      ` : ''}
      
      <div class="gallery-item-content">
        <div class="gallery-item-date">
          <i class="fa-solid fa-calendar"></i>
          ${formattedDate}
        </div>
        <p class="gallery-item-description">${truncatedMessage}</p>
      </div>

      <div class="gallery-item-footer">
        <div class="gallery-item-actions">
          <button class="action-btn view-btn">
            <i class="fa-solid fa-expand"></i>
            ${post.hasVideo ? 'Watch' : 'View'}
          </button>
          <button class="action-btn like-btn" title="Like on Facebook">
            <i class="fa-solid fa-heart"></i>
          </button>
          ${post.hasImage && !post.hasVideo ? `
            <button class="action-btn download-btn" title="Download image">
              <i class="fa-solid fa-download"></i>
            </button>
          ` : ''}
        </div>
        <a href="${post.link}" target="_blank" rel="noopener noreferrer" class="fb-link" title="View on Facebook">
          <i class="fa-brands fa-facebook"></i>
        </a>
      </div>
    `;

    // Attach event listeners
    const viewBtn = item.querySelector('.view-btn');
    const likeBtn = item.querySelector('.like-btn');
    const downloadBtn = item.querySelector('.download-btn');
    const videoEl = item.querySelector('.gallery-item-video');

    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openInLightbox(index);
      });
    }

    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.likePost(post);
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadImage(post);
      });
    }

    if (videoEl) {
      videoEl.addEventListener('click', () => {
        this.openInLightbox(index);
      });
    }

    return item;
  }

  openInLightbox(index) {
    if (typeof GalleryLightbox === 'undefined') {
      console.error('GalleryLightbox not found');
      window.open(this.filteredPosts[index].link, '_blank');
      return;
    }

    const items = this.filteredPosts
      .filter(post => post.hasImage || post.hasVideo)
      .map(post => ({
        url: post.hasVideo ? post.video : post.image,
        name: this.formatDate(post.date),
        description: post.message,
        type: post.hasVideo ? 'video' : 'image'
      }));

    const itemIndex = items.findIndex((item, i) => {
      const originalPost = this.filteredPosts.filter(p => p.hasImage || p.hasVideo)[i];
      return originalPost === this.filteredPosts[index];
    });

    if (itemIndex === -1) return;

    if (!window.galleryLightbox) {
      window.galleryLightbox = new GalleryLightbox(items);
    } else {
      window.galleryLightbox.updateImages(items);
    }

    window.galleryLightbox.open(itemIndex);
  }

  likePost(post) {
    // Open post in new tab (Facebook doesn't allow programmatic likes)
    window.open(post.link, '_blank');
  }

  async downloadImage(post) {
    if (!post.image) return;

    try {
      const response = await fetch(post.image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `lccc-${post.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('[Download] Image downloaded successfully');
    } catch (error) {
      console.error('[Download] Failed:', error);
      // Fallback: open in new tab
      window.open(post.image, '_blank');
    }
  }

  formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substr(0, maxLength) + '...';
  }

  getHelpfulErrorMessage(error) {
    const errorStr = error.message.toLowerCase();

    if (errorStr.includes('190') || errorStr.includes('invalid') || errorStr.includes('expired')) {
      return `<strong>Access Token Issue</strong><br>Your token has expired. Please generate a new one.`;
    }

    if (errorStr.includes('100')) {
      return `<strong>Permission Issue</strong><br>Check your page permissions and token.`;
    }

    return `<strong>Error Loading Posts</strong><br>${error.message}`;
  }

  loadDemoData() {
    this.posts = [
      {
        id: 'demo1',
        message: 'IMPORTANT NOTICE: Scripture Reading Week - Join us for daily scripture meditation. Deep dive into the Word every evening at 6 PM.',
        image: 'resources/WordinTheLot0.1.jpg',
        date: new Date('2026-01-15'),
        link: 'https://facebook.com/100079670415708',
        hasImage: true,
        hasVideo: false,
        type: 'photo'
      },
      {
        id: 'demo2',
        message: 'WEEKLY EVENT: Prayer Meeting - Every Tuesday and Thursday. Your breakthrough is coming!',
        image: 'resources/WeeklyPrayers.jpg',
        date: new Date('2026-01-12'),
        link: 'https://facebook.com/100079670415708',
        hasImage: true,
        hasVideo: false,
        type: 'photo'
      },
      {
        id: 'demo3',
        message: 'Sunday Sermon Notes Available - Download your sermon notes and stay blessed throughout the week.',
        image: 'resources/Sermon.jpg',
        date: new Date('2026-01-10'),
        link: 'https://facebook.com/100079670415708',
        hasImage: true,
        hasVideo: false,
        type: 'photo'
      },
      {
        id: 'demo4',
        message: 'ANNOUNCEMENT: 2026 Blessings - A blessed and prosperous year to all our listeners!',
        image: 'resources/NewYearBlessings.jpg',
        date: new Date('2026-01-01'),
        link: 'https://facebook.com/100079670415708',
        hasImage: true,
        hasVideo: false,
        type: 'photo'
      },
      {
        id: 'demo5',
        message: 'THEME OF THE YEAR: "It is YOUR Year!" - Walk in victory, dominion, and divine breakthrough.',
        image: 'resources/2026.jpg',
        date: new Date('2025-12-31'),
        link: 'https://facebook.com/100079670415708',
        hasImage: true,
        hasVideo: false,
        type: 'photo'
      }
    ];

    this.filterPosts();
    this.showGallery();
    this.updateCarousel();
    console.log('[Facebook] 📦 Demo data loaded');
  }

  showLoading() {
    this.loadingState.style.display = 'block';
    this.galleryGrid.style.display = 'none';
    this.emptyState.style.display = 'none';
    this.errorState.style.display = 'none';
  }

  showGallery() {
    this.loadingState.style.display = 'none';
    this.galleryGrid.style.display = 'grid';
    this.emptyState.style.display = 'none';
    this.errorState.style.display = 'none';
  }

  showEmpty() {
    this.loadingState.style.display = 'none';
    this.galleryGrid.style.display = 'none';
    this.emptyState.style.display = 'block';
    this.errorState.style.display = 'none';
  }

  showError(message) {
    this.loadingState.style.display = 'none';
    this.galleryGrid.style.display = 'none';
    this.emptyState.style.display = 'none';
    this.errorState.style.display = 'block';
    this.errorMessage.innerHTML = message;
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.galleryManager = new FacebookGalleryManager();
  console.log('✨ Enhanced Facebook Gallery initialized');
});
