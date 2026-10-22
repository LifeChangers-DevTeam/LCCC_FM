/**
 * FACEBOOK CAROUSEL INTEGRATION - Enhanced with Environment Variables
 * Loads Facebook posts into homepage carousel with keyword filtering
 * Version: 2.0.0 - Secure with env vars
 */

class FacebookCarousel {
  constructor() {
    this.config = {
      // Get from environment variables or Netlify Function
      accessToken: window.__FACEBOOK_CONFIG__?.token || null,
      pageId: window.__FACEBOOK_CONFIG__?.pageId || '156055814564596',
      
      // Use Netlify Function if no token
      useNetlifyFunction: !window.__FACEBOOK_CONFIG__?.token,
      
      apiVersion: 'v19.0',
      maxPosts: 5,
      
      // Keywords to filter relevant posts
      keywords: [
        'scripture', 'notice', 'event', 'announcement', 
        'important', 'alert', 'coming', 'join', 'service',
        'prayer', 'worship', 'broadcast', 'live'
      ],
      
      cacheKey: 'lccc-carousel-posts',
      cacheDuration: 600000 // 10 minutes
    };

    console.log('[Carousel] Initializing with config:', {
      hasToken: !!this.config.accessToken,
      useFunction: this.config.useNetlifyFunction,
      pageId: this.config.pageId
    });

    this.init();
  }

  async init() {
    try {
      await this.loadPosts();
    } catch (error) {
      console.error('[Carousel] Initialization failed:', error);
      this.loadDefaultSlides();
    }
  }

  async loadPosts() {
    try {
      // Try cache first
      const cached = this.getCachedPosts();
      if (cached) {
        console.log('[Carousel] Using cached posts');
        this.updateCarousel(cached);
        return;
      }

      console.log('[Carousel] Fetching from Facebook...');

      let data;

      if (this.config.useNetlifyFunction) {
        // Use Netlify Function (most secure)
        const response = await fetch(`/.netlify/functions/facebook-api?endpoint=feed&limit=50`);
        data = await response.json();
      } else {
        // Use direct API call
        const fields = 'id,message,full_picture,created_time,permalink_url';
        const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.pageId}/feed?fields=${fields}&limit=50&access_token=${this.config.accessToken}`;
        
        const response = await fetch(url);
        data = await response.json();
      }

      if (data.error) {
        throw new Error(data.error.message || 'Facebook API error');
      }

      // Filter relevant posts by keywords
      const relevantPosts = (data.data || [])
        .filter(post => {
          const message = (post.message || '').toLowerCase();
          return this.config.keywords.some(keyword => message.includes(keyword));
        })
        .slice(0, this.config.maxPosts);

      if (relevantPosts.length === 0) {
        console.log('[Carousel] No relevant posts found, using defaults');
        this.loadDefaultSlides();
        return;
      }

      console.log(`[Carousel] ✅ Found ${relevantPosts.length} relevant posts`);

      // Process posts
      const carouselItems = relevantPosts.map(post => this.processPost(post));
      
      // Cache
      this.setCachedPosts(carouselItems);
      
      // Update carousel
      this.updateCarousel(carouselItems);

    } catch (error) {
      console.error('[Carousel] Error loading posts:', error);
      
      // Try cache on error
      const cached = this.getCachedPosts();
      if (cached) {
        console.log('[Carousel] Using cached posts after error');
        this.updateCarousel(cached);
      } else {
        this.loadDefaultSlides();
      }
    }
  }

  processPost(post) {
    const message = post.message || '';
    
    // Extract title (first line or sentence)
    const titleMatch = message.match(/^[^\n\.]+/);
    const title = titleMatch ? titleMatch[0].trim() : 'Latest Update';
    
    // Extract description (truncate)
    const description = message.length > 100 
      ? message.substring(0, 100) + '...' 
      : message;

    return {
      title: this.truncate(title, 50),
      description: this.truncate(description, 100),
      image: post.full_picture || 'resources/default-slide.jpg',
      link: post.permalink_url,
      date: new Date(post.created_time)
    };
  }

  updateCarousel(items) {
    const carousel = document.querySelector('.carousel-items');
    if (!carousel) {
      console.warn('[Carousel] Carousel container not found');
      return;
    }

    // Clear existing items (keep default ones if needed)
    const existingItems = carousel.querySelectorAll('.carousel-item[data-fb="true"]');
    existingItems.forEach(item => item.remove());

    // Add new items
    items.forEach((item, index) => {
      const slide = this.createSlide(item, index);
      carousel.appendChild(slide);
    });

    console.log(`[Carousel] Updated with ${items.length} slides`);

    // Re-initialize carousel if needed
    if (window.carouselManager && window.carouselManager.init) {
      window.carouselManager.init();
    }
  }

  createSlide(item, index) {
    const div = document.createElement('div');
    div.className = 'carousel-item';
    div.setAttribute('data-fb', 'true');
    div.setAttribute('data-index', index);
    
    div.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="carousel-caption">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <a href="${item.link}" target="_blank" class="carousel-link">
          Read More <i class="bi bi-arrow-right"></i>
        </a>
      </div>
    `;

    return div;
  }

  loadDefaultSlides() {
    console.log('[Carousel] Loading default slides');
    
    const defaultItems = [
      {
        title: 'How to Fight & Win Spiritual Battles',
        description: 'Visit our online store to purchase your e-book or Liberty Bookstore to purchase a hardcopy book.',
        image: 'resources/Publication2.jpg',
        link: '/'
      },
      {
        title: 'Weekly Word',
        description: 'A word a day keeps the devil away and leads to spiritual growth.',
        image: 'resources/WeekWord.jpg',
        link: '/'
      },
      {
        title: 'Prepare to Meet Your Maker',
        description: 'If you would like to accept Jesus as your Lord and Savior you can pray this simple prayer: “Almighty Father, I come to you in Jesus name, confessing my sins, renouncing the devil, and his ways, and accepting Jesus Christ your Son to be my Lord and Saviour. I believe with all my heart that Jesus died for my sins and was raised from the dead and now confess Him as my Lord and Saviour. I believe that I am now born again. Amen!”.',
        image: 'resources/SalvationSeries.jpg',
        link: '/'
      }
    ];

    this.updateCarousel(defaultItems);
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
        return posts.map(post => ({
          ...post,
          date: new Date(post.date)
        }));
      }

      localStorage.removeItem(this.config.cacheKey);
      return null;
    } catch (error) {
      console.warn('[Carousel Cache] Read failed:', error);
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
      console.warn('[Carousel Cache] Write failed:', error);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.facebookCarousel = new FacebookCarousel();
  });
} else {
  window.facebookCarousel = new FacebookCarousel();
}

console.log('[Carousel] Module loaded');
