/**
 * FACEBOOK GALLERY COMPLETE - Enhanced with Environment Variables
 * Combined lightbox + gallery with video support
 * Version: 2.0.0 - Secure with env vars
 */

// ===================================
// GALLERY LIGHTBOX CLASS
// ===================================
class GalleryLightbox {
  constructor() {
    this.currentIndex = 0;
    this.items = [];
    this.isOpen = false;
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this.init();
  }

  init() {
    this.createLightbox();
    this.attachEventListeners();
  }

  createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'gallery-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close">
          <i class="bi bi-x-lg"></i>
        </button>
        <button class="lightbox-prev" aria-label="Previous">
          <i class="bi bi-chevron-left"></i>
        </button>
        <button class="lightbox-next" aria-label="Next">
          <i class="bi bi-chevron-right"></i>
        </button>
        <div class="lightbox-media-container">
          <img class="lightbox-image" alt="">
          <video class="lightbox-video" controls style="display: none;"></video>
        </div>
        <div class="lightbox-info">
          <p class="lightbox-caption"></p>
          <div class="lightbox-date"></div>
        </div>
        <div class="lightbox-controls">
          <button class="zoom-out" aria-label="Zoom out">
            <i class="bi bi-dash-circle"></i>
          </button>
          <span class="zoom-level">100%</span>
          <button class="zoom-in" aria-label="Zoom in">
            <i class="bi bi-plus-circle"></i>
          </button>
          <button class="zoom-reset" aria-label="Reset zoom">
            <i class="bi bi-arrow-counterclockwise"></i>
          </button>
        </div>
        <div class="lightbox-counter">
          <span class="current">1</span> / <span class="total">1</span>
        </div>
      </div>
    `;

    document.body.appendChild(lightbox);
    this.lightbox = lightbox;
    this.overlay = lightbox.querySelector('.lightbox-overlay');
    this.content = lightbox.querySelector('.lightbox-content');
    this.image = lightbox.querySelector('.lightbox-image');
    this.video = lightbox.querySelector('.lightbox-video');
    this.caption = lightbox.querySelector('.lightbox-caption');
    this.dateEl = lightbox.querySelector('.lightbox-date');
    this.counter = lightbox.querySelector('.lightbox-counter');
  }

  attachEventListeners() {
    // Close buttons
    this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', () => this.close());

    // Navigation
    this.lightbox.querySelector('.lightbox-prev').addEventListener('click', () => this.prev());
    this.lightbox.querySelector('.lightbox-next').addEventListener('click', () => this.next());

    // Zoom controls
    this.lightbox.querySelector('.zoom-in').addEventListener('click', () => this.zoom(0.2));
    this.lightbox.querySelector('.zoom-out').addEventListener('click', () => this.zoom(-0.2));
    this.lightbox.querySelector('.zoom-reset').addEventListener('click', () => this.resetZoom());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      
      switch(e.key) {
        case 'Escape': this.close(); break;
        case 'ArrowLeft': this.prev(); break;
        case 'ArrowRight': this.next(); break;
        case '+': this.zoom(0.2); break;
        case '-': this.zoom(-0.2); break;
        case '0': this.resetZoom(); break;
      }
    });

    // Touch/Mouse dragging for pan
    this.image.addEventListener('mousedown', (e) => this.startDrag(e));
    this.image.addEventListener('touchstart', (e) => this.startDrag(e));
    
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('touchmove', (e) => this.drag(e));
    
    document.addEventListener('mouseup', () => this.endDrag());
    document.addEventListener('touchend', () => this.endDrag());

    // Mouse wheel zoom
    this.image.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.zoom(delta);
    });

    // Touch pinch zoom
    let initialDistance = 0;
    this.image.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
    });

    this.image.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const newDistance = this.getDistance(e.touches[0], e.touches[1]);
        const delta = (newDistance - initialDistance) * 0.01;
        this.zoom(delta);
        initialDistance = newDistance;
      }
    });
  }

  open(items, index = 0) {
    this.items = items;
    this.currentIndex = index;
    this.isOpen = true;
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.showItem(index);
  }

  close() {
    this.isOpen = false;
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
    this.resetZoom();
    
    // Pause video if playing
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
  }

  showItem(index) {
    const item = this.items[index];
    if (!item) return;

    this.resetZoom();

    // Show image or video
    if (item.hasVideo && item.video) {
      this.image.style.display = 'none';
      this.video.style.display = 'block';
      this.video.src = item.video;
      this.video.load();
    } else {
      this.image.style.display = 'block';
      this.video.style.display = 'none';
      this.image.src = item.image;
    }

    this.caption.textContent = item.description || '';
    this.dateEl.textContent = item.dateFormatted || '';
    
    // Update counter
    this.counter.querySelector('.current').textContent = index + 1;
    this.counter.querySelector('.total').textContent = this.items.length;

    // Update navigation button states
    this.updateNavigationButtons();
  }

  updateNavigationButtons() {
    const prevBtn = this.lightbox.querySelector('.lightbox-prev');
    const nextBtn = this.lightbox.querySelector('.lightbox-next');

    prevBtn.style.opacity = this.currentIndex === 0 ? '0.3' : '1';
    prevBtn.style.cursor = this.currentIndex === 0 ? 'not-allowed' : 'pointer';
    
    nextBtn.style.opacity = this.currentIndex === this.items.length - 1 ? '0.3' : '1';
    nextBtn.style.cursor = this.currentIndex === this.items.length - 1 ? 'not-allowed' : 'pointer';
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.showItem(this.currentIndex);
    }
  }

  next() {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
      this.showItem(this.currentIndex);
    }
  }

  zoom(delta) {
    const newZoom = Math.min(Math.max(0.5, this.zoomLevel + delta), 3);
    this.zoomLevel = newZoom;
    this.updateTransform();
    
    // Update zoom level display
    const zoomDisplay = this.lightbox.querySelector('.zoom-level');
    zoomDisplay.textContent = Math.round(newZoom * 100) + '%';
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
    
    const zoomDisplay = this.lightbox.querySelector('.zoom-level');
    zoomDisplay.textContent = '100%';
  }

  updateTransform() {
    this.image.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
  }

  startDrag(e) {
    if (this.zoomLevel <= 1) return;
    
    this.isDragging = true;
    const point = e.touches ? e.touches[0] : e;
    this.startX = point.clientX - this.panX;
    this.startY = point.clientY - this.panY;
    this.image.style.cursor = 'grabbing';
  }

  drag(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    this.panX = point.clientX - this.startX;
    this.panY = point.clientY - this.startY;
    this.updateTransform();
  }

  endDrag() {
    this.isDragging = false;
    this.image.style.cursor = this.zoomLevel > 1 ? 'grab' : 'default';
  }

  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// ===================================
// FACEBOOK GALLERY MANAGER
// ===================================
class FacebookGalleryManager {
  constructor() {
    // Check if token is a placeholder (not replaced by Netlify)
    const tokenFromEnv = window.__FACEBOOK_CONFIG__?.token;
    const isPlaceholder = !tokenFromEnv || tokenFromEnv.includes('__');
    
    this.config = {
      // Get from environment variables or Netlify Function
      accessToken: isPlaceholder ? null : tokenFromEnv,
      pageId: window.__FACEBOOK_CONFIG__?.pageId || '156055814564596',
      
      // Use Netlify Function if no token or token is placeholder
      useNetlifyFunction: isPlaceholder,
      
      apiVersion: 'v19.0',
      postsLimit: 100,
      photosLimit: 50,
      refreshInterval: 300000, // 5 minutes
      cacheKey: 'lccc-facebook-posts',
      cacheDuration: 600000 // 10 minutes
    };

    this.posts = [];
    this.filteredPosts = [];
    this.currentFilter = 'all';
    this.isLoading = false;
    this.lightbox = null;

    console.log('[Facebook Gallery] Initializing with config:', {
      hasToken: !!this.config.accessToken,
      useFunction: this.config.useNetlifyFunction,
      pageId: this.config.pageId
    });

    this.init();
  }

  async init() {
    // Initialize lightbox
    this.lightbox = new GalleryLightbox();

    // Load posts
    await this.loadPosts();

    // Setup filter buttons
    this.setupFilters();

    // Auto-refresh
    setInterval(() => {
      if (!document.hidden) {
        this.loadPosts(true);
      }
    }, this.config.refreshInterval);

    // Refresh when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isLoading) {
        this.loadPosts(true);
      }
    });
  }

  async loadPosts(silent = false) {
    if (this.isLoading) return;

    this.isLoading = true;

    if (!silent) {
      this.showLoading();
    }

    try {
      // Try cache first
      const cached = this.getCachedPosts();
      if (cached && !silent) {
        console.log('[Facebook Gallery] Using cached posts');
        this.posts = cached;
        this.applyFilter(this.currentFilter);
        this.isLoading = false;
        return;
      }

      console.log('[Facebook Gallery] Fetching from Facebook...');

      // Fetch posts and photos
      const [feedPosts, photoAlbums] = await Promise.all([
        this.fetchFeed(),
        this.fetchPhotos()
      ]);

      // Combine and deduplicate
      const combined = [...feedPosts, ...photoAlbums];
      const uniquePosts = this.deduplicatePosts(combined);

      // Sort by date
      uniquePosts.sort((a, b) => b.date - a.date);

      this.posts = uniquePosts;
      this.setCachedPosts(uniquePosts);
      this.applyFilter(this.currentFilter);

      console.log(`[Facebook Gallery] ✅ Successfully processed ${uniquePosts.length} posts`);

    } catch (error) {
      console.error('[Facebook Gallery] ❌ Error loading posts:', error);
      
      // Try cached version on error
      const cached = this.getCachedPosts();
      if (cached) {
        console.log('[Facebook Gallery] Using cached posts after error');
        this.posts = cached;
        this.applyFilter(this.currentFilter);
      } else {
        this.showError(error.message);
      }
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  async fetchFeed() {
    try {
      let data;

      if (this.config.useNetlifyFunction) {
        // Use Netlify Function (most secure)
        const response = await fetch(`/.netlify/functions/facebook-api?endpoint=feed&limit=${this.config.postsLimit}`);
        data = await response.json();
      } else {
        // Use direct API call
        const fields = 'id,message,full_picture,created_time,permalink_url,attachments{media,type,subattachments,description,url},story';
        const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.pageId}/feed?fields=${fields}&limit=${this.config.postsLimit}&access_token=${this.config.accessToken}`;
        
        const response = await fetch(url);
        data = await response.json();
      }

      if (data.error) {
        throw new Error(data.error.message || 'Facebook API error');
      }

      return (data.data || []).map(post => this.processPost(post));
    } catch (error) {
      console.error('[Facebook Gallery] Feed fetch error:', error);
      return [];
    }
  }

  async fetchPhotos() {
    try {
      let data;

      if (this.config.useNetlifyFunction) {
        // Use Netlify Function
        const response = await fetch(`/.netlify/functions/facebook-api?endpoint=photos&limit=${this.config.photosLimit}`);
        data = await response.json();
      } else {
        // Use direct API call
        const fields = 'id,created_time,name,picture,images,permalink_url,album';
        const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.pageId}/photos/uploaded?fields=${fields}&limit=${this.config.photosLimit}&access_token=${this.config.accessToken}`;
        
        const response = await fetch(url);
        data = await response.json();
      }

      if (data.error) {
        console.warn('[Facebook Gallery] Photos fetch error:', data.error.message);
        return [];
      }

      return (data.data || []).map(photo => this.processPhoto(photo));
    } catch (error) {
      console.warn('[Facebook Gallery] Photos fetch failed:', error);
      return [];
    }
  }

  processPost(post) {
    const attachments = post.attachments?.data?.[0];
    const media = attachments?.media;
    const subattachments = attachments?.subattachments?.data || [];

    let hasImage = false;
    let hasVideo = false;
    let imageUrl = null;
    let videoUrl = null;

    // Check for video
    if (attachments?.type === 'video_inline' && media?.source) {
      hasVideo = true;
      videoUrl = media.source;
      imageUrl = media.image?.src || post.full_picture;
    }
    // Check for images
    else if (media?.image?.src) {
      hasImage = true;
      imageUrl = media.image.src;
    }
    // Fallback to full_picture
    else if (post.full_picture) {
      hasImage = true;
      imageUrl = post.full_picture;
    }

    const description = post.message || post.story || attachments?.description || '';
    const date = new Date(post.created_time);

    return {
      id: post.id,
      description: description,
      image: imageUrl,
      video: videoUrl,
      hasImage: hasImage,
      hasVideo: hasVideo,
      date: date,
      dateFormatted: this.formatDate(date),
      url: post.permalink_url,
      type: 'post'
    };
  }

  processPhoto(photo) {
    const highestRes = photo.images?.[0];
    
    return {
      id: photo.id,
      description: photo.name || '',
      image: highestRes?.source || photo.picture,
      video: null,
      hasImage: true,
      hasVideo: false,
      date: new Date(photo.created_time),
      dateFormatted: this.formatDate(new Date(photo.created_time)),
      url: photo.permalink_url,
      type: 'photo'
    };
  }

  deduplicatePosts(posts) {
    const seen = new Set();
    return posts.filter(post => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }

  formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  setupFilters() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        
        // Update active state
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Apply filter
        this.applyFilter(filter);
      });
    });
  }

  applyFilter(filter) {
    this.currentFilter = filter;

    switch (filter) {
      case 'recent':
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        this.filteredPosts = this.posts.filter(post => post.date >= monthAgo);
        break;
      
      case 'photos':
        this.filteredPosts = this.posts.filter(post => post.hasImage && !post.hasVideo);
        break;
      
      case 'videos':
        this.filteredPosts = this.posts.filter(post => post.hasVideo);
        break;
      
      case 'all':
      default:
        this.filteredPosts = [...this.posts];
        break;
    }

    this.renderGallery();
  }

  renderGallery() {
    const container = document.getElementById('galleryGrid');
    if (!container) return;

    if (this.filteredPosts.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="bi bi-images" style="font-size: 4rem; opacity: 0.3;"></i>
          <p>No posts found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredPosts.map((post, index) => `
      <div class="gallery-item" data-index="${index}">
        ${post.hasVideo ? `
          <div class="video-preview">
            <img src="${post.image}" alt="${post.description}" loading="lazy">
            <div class="play-overlay">
              <i class="bi bi-play-circle-fill"></i>
            </div>
          </div>
        ` : `
          <img src="${post.image}" alt="${post.description}" loading="lazy">
        `}
        <div class="gallery-item-content">
          <div class="gallery-item-date">${post.dateFormatted}</div>
          <p class="gallery-item-description">${this.truncate(post.description, 100)}</p>
        </div>
        <div class="gallery-item-footer">
          <div class="gallery-item-actions">
            <button class="view-btn" data-index="${index}">
              ${post.hasVideo ? '<i class="bi bi-play-circle"></i> Watch' : '<i class="bi bi-eye"></i> View'}
            </button>
            <button class="like-btn" onclick="window.open('${post.url}', '_blank')">
              <i class="bi bi-heart"></i>
            </button>
            ${!post.hasVideo ? `
              <button class="download-btn" data-image="${post.image}">
                <i class="bi bi-download"></i>
              </button>
            ` : ''}
          </div>
          <a href="${post.url}" target="_blank" class="fb-link">
            <i class="bi bi-facebook"></i> View on Facebook
          </a>
        </div>
      </div>
    `).join('');

    this.attachGalleryListeners();
  }

  attachGalleryListeners() {
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.lightbox.open(this.filteredPosts, index);
      });
    });

    // Gallery items (click anywhere)
    document.querySelectorAll('.gallery-item img, .gallery-item .video-preview').forEach((el) => {
      el.addEventListener('click', (e) => {
        const item = e.currentTarget.closest('.gallery-item');
        const index = parseInt(item.dataset.index);
        this.lightbox.open(this.filteredPosts, index);
      });
    });

    // Download buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const imageUrl = e.currentTarget.dataset.image;
        await this.downloadImage(imageUrl);
      });
    });
  }

  async downloadImage(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `lccc-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('[Download] Failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  }

  truncate(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  getCachedPosts() {
    try {
      const cached = localStorage.getItem(this.config.cacheKey);
      if (!cached) return null;

      const { posts, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < this.config.cacheDuration) {
        // Restore dates
        return posts.map(post => ({
          ...post,
          date: new Date(post.date)
        }));
      }

      localStorage.removeItem(this.config.cacheKey);
      return null;
    } catch (error) {
      console.warn('[Cache] Read failed:', error);
      return null;
    }
  }

  setCachedPosts(posts) {
    try {
      const data = {
        posts,
        timestamp: Date.now()
      };
      localStorage.setItem(this.config.cacheKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[Cache] Write failed:', error);
    }
  }

  showLoading() {
    const container = document.getElementById('galleryGrid');
    if (container) {
      container.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading posts...</p>
        </div>
      `;
    }
  }

  hideLoading() {
    // Loading state will be replaced by content
  }

  showError(message) {
    const container = document.getElementById('galleryGrid');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: #ff4c4c;"></i>
          <p>Failed to load posts</p>
          <small>${message}</small>
          <button onclick="window.galleryManager.loadPosts()" 
                  style="margin-top: 1rem; padding: 10px 20px; background: #860b46; color: white; border: none; border-radius: 8px; cursor: pointer;">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Initialize gallery when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.galleryManager = new FacebookGalleryManager();
  });
} else {
  window.galleryManager = new FacebookGalleryManager();
}

console.log('[Facebook Gallery] Module loaded');
