# 🎉 Gallery Enhancement - Complete Feature Guide

## ✨ What's New

Your gallery now has **MASSIVE upgrades**:

### 1. 🎬 **Video Support**
- Play Facebook videos directly in gallery
- Video preview with play button overlay
- Full-screen video playback in lightbox
- Hover to preview videos

### 2. 📸 **Photo Album Integration**
- Fetches ALL photos from your page (not just post attachments)
- Grabs high-resolution images
- Combines posts AND photos into one gallery

### 3. 🎯 **Smart Filtering That Actually Works**
- **All Posts** - Everything (posts, photos, videos)
- **Recent** - Last 30 days only
- **Photos** - Images only (no videos)
- **Videos** - Videos only (NEW!)

### 4. ❤️ **Like & Download**
- **Like Button** - Opens post on Facebook to like it
- **Download Button** - Downloads images directly to your device
- Beautiful hover effects

### 5. 🎪 **Carousel Integration**
- Homepage carousel automatically updates from Facebook
- Shows only posts with keywords: scripture, notice, event, announcement
- Max 5 most recent relevant posts
- Auto-refreshes with your gallery

## 📋 Files Updated

### New Files:
1. **`facebook-gallery-complete.js`** - Enhanced with all features
2. **`carousel-facebook.js`** - Carousel integration (NEW!)
3. **`gallery.css`** - Updated with video & button styles

### Updated Files:
1. **`gallery.html`** - Added "Videos" filter button

## 🚀 Installation

### Step 1: Upload New Files

Upload to your server:
```
/js/facebook-gallery-complete.js    ← Replace existing
/js/carousel-facebook.js             ← NEW file
/css/gallery.css                     ← Replace existing
/gallery.html                        ← Replace existing
```

### Step 2: Update index.html (For Carousel Integration)

Add this script BEFORE the closing `</body>` tag:

```html
<!-- Carousel Facebook Integration -->
<script src="js/carousel-facebook.js"></script>
</body>
</html>
```

Insert it after your existing carousel scripts.

### Step 3: Configure Access Token

In **BOTH** files, update the access token:

**File: `js/facebook-gallery-complete.js`** (line ~311)
```javascript
accessToken: 'YOUR_ACTUAL_TOKEN_HERE',
```

**File: `js/carousel-facebook.js`** (line ~11)
```javascript
accessToken: 'YOUR_ACTUAL_TOKEN_HERE', // Same token
```

### Step 4: Clear Cache & Test

1. Clear browser cache: `Ctrl + Shift + Delete`
2. Hard refresh: `Ctrl + F5`
3. Visit gallery page
4. Visit homepage (carousel should update)

## 🎯 New Features Explained

### Video Support

**How It Works:**
- Videos show with play icon overlay
- Hover over video to preview
- Click to play full-screen in lightbox
- Lightbox has video controls (play, pause, volume, fullscreen)

**In Code:**
```javascript
// Automatically detects videos
if (post.attachments.type === 'video_inline') {
  hasVideo = true;
  videoUrl = media.source;
}
```

### Photo Album Fetching

**What Changed:**
- **Before:** Only grabbed images from posts
- **Now:** Fetches from `/photos/uploaded` endpoint too
- Gets ALL photos uploaded to your page
- Higher resolution images

**API Call:**
```javascript
https://graph.facebook.com/v19.0/YOUR_PAGE/photos/uploaded
```

### Smart Filtering

**How Each Filter Works:**

**All Posts:**
```javascript
// Shows everything - posts, photos, videos
this.filteredPosts = [...this.posts];
```

**Recent (Last 30 Days):**
```javascript
const monthAgo = new Date();
monthAgo.setDate(monthAgo.getDate() - 30);
this.filteredPosts = this.posts.filter(post => post.date >= monthAgo);
```

**Photos Only:**
```javascript
// Images but NOT videos
this.filteredPosts = this.posts.filter(post => 
  post.hasImage && !post.hasVideo
);
```

**Videos Only:**
```javascript
// Only video posts
this.filteredPosts = this.posts.filter(post => post.hasVideo);
```

### Like & Download

**Like Button:**
- Opens Facebook post in new tab
- User can like directly on Facebook
- Can't programmatically like (Facebook restriction)

**Download Button:**
```javascript
async downloadImage(post) {
  const response = await fetch(post.image);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `lccc-${post.id}.jpg`;
  link.click();
}
```

### Carousel Integration

**Keywords Filter:**
The carousel shows posts containing these words:
- scripture
- notice
- event
- announcement
- important
- alert
- coming
- join

**Example:**
```
Post: "IMPORTANT NOTICE: Prayer meeting this Friday!"
✅ Contains "important" and "notice" → Shows in carousel

Post: "Beautiful sunset photo"
❌ No keywords → Not shown in carousel
```

**How to Add More Keywords:**

In `carousel-facebook.js`, line 13:
```javascript
keywords: [
  'scripture', 'notice', 'event', 'announcement', 
  'important', 'alert', 'coming', 'join',
  'special', 'reminder', 'urgent'  // Add your own!
]
```

## 🎨 UI Changes

### Gallery Item Layout

**Before:**
```
[Image]
[Description]
[View Button] [Facebook Link]
```

**Now:**
```
[Image/Video]
[Description]
[View] [Like] [Download] [Facebook Link]
```

### Video Item Example

```html
<div class="gallery-item">
  <div class="gallery-item-video-preview">
    <video src="video.mp4" muted loop></video>
    <div class="video-overlay">
      <i class="fa-play"></i>
    </div>
  </div>
  <div class="gallery-item-content">
    <div class="gallery-item-date">January 15, 2026</div>
    <p class="gallery-item-description">Watch our latest sermon...</p>
  </div>
  <div class="gallery-item-footer">
    <div class="gallery-item-actions">
      <button class="action-btn view-btn">Watch</button>
      <button class="action-btn like-btn">♥</button>
    </div>
    <a href="..." class="fb-link">f</a>
  </div>
</div>
```

## 🔧 Customization

### Change Carousel Max Posts

In `carousel-facebook.js`:
```javascript
maxPosts: 5,  // Change to 3, 7, 10, etc.
```

### Change "Recent" Filter Duration

In `facebook-gallery-complete.js` (line ~420):
```javascript
// Change from 30 days to 7 days
monthAgo.setDate(monthAgo.getDate() - 7);
```

### Disable Download Button

In `facebook-gallery-complete.js`, remove this section (line ~576):
```javascript
${post.hasImage && !post.hasVideo ? `
  <button class="action-btn download-btn">
    <i class="fa-solid fa-download"></i>
  </button>
` : ''}
```

### Change Button Colors

In `gallery.css`:
```css
.like-btn:hover {
  background: rgba(220, 53, 69, 0.3);  /* Change red color */
}

.download-btn:hover {
  background: rgba(40, 167, 69, 0.3);  /* Change green color */
}
```

## 📊 Performance Notes

### API Calls

**Gallery Page:**
- 2 API calls on load:
  1. `/feed` - Gets posts
  2. `/photos/uploaded` - Gets photos
- Auto-refresh every 5 minutes

**Index Page (Carousel):**
- 1 API call on load: `/feed`
- Filters client-side for keywords
- No auto-refresh (loads once per session)

### Caching

Posts are cached in memory:
- Gallery: Refreshes every 5 min
- Carousel: Loads once on page load
- Service Worker caches API responses for offline

## 🐛 Troubleshooting

### Videos Don't Play

**Check:**
1. Facebook allows video download? (some don't)
2. CORS issues? (check console)
3. Browser supports format?

**Fix:**
Add in Netlify headers:
```toml
media-src 'self' https://video.*.fbcdn.net;
```

### Download Doesn't Work

**Issue:** CORS blocking image download

**Fix 1:** Try right-click → Save Image As

**Fix 2:** Add proxy:
```javascript
const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(post.image)}`;
```

### Carousel Not Updating

**Check:**
1. Is `carousel-facebook.js` loaded?
2. Is token configured in BOTH files?
3. Are posts matching keywords?

**Debug:**
```javascript
// Console:
console.log(window.carousel);
```

### Filter Buttons Don't Work

**Check:**
1. JavaScript console for errors
2. Buttons have correct `data-filter` attribute
3. Event listeners attached

## 🎉 Feature Showcase

### Gallery Page Features

✅ **Video playback** - Click to watch in full-screen  
✅ **Photo downloads** - One-click download  
✅ **Like posts** - Opens on Facebook  
✅ **Smart filters** - All, Recent, Photos, Videos  
✅ **High-res images** - From photo albums  
✅ **Auto-refresh** - Every 5 minutes  
✅ **Mobile optimized** - Swipe, pinch, zoom  

### Homepage Carousel Features

✅ **Auto-updates** from Facebook  
✅ **Keyword filtering** - Only relevant posts  
✅ **Max 5 posts** - Keeps it fresh  
✅ **Click to view** - Opens on Facebook  
✅ **Fallback images** - If API fails  

## 📱 Mobile Experience

### Gallery
- Swipe to navigate in lightbox
- Tap to play videos
- Long-press to download images
- Responsive grid layout

### Carousel
- Touch-friendly slides
- Auto-play support
- Smooth transitions

## 🚀 Going Live

### Pre-Launch Checklist

- [ ] Access token configured in both files
- [ ] Files uploaded to server
- [ ] Carousel script added to index.html
- [ ] Test all filters (All, Recent, Photos, Videos)
- [ ] Test video playback
- [ ] Test download button
- [ ] Test like button
- [ ] Check carousel on homepage
- [ ] Test on mobile device
- [ ] Clear service worker cache
- [ ] Hard refresh browser

### Expected Results

**Gallery Page:**
- Multiple post types (images, videos, text-only)
- Filter buttons change content immediately
- Videos have play icon overlay
- Action buttons appear on all items
- Download works for images
- Like opens Facebook

**Homepage:**
- Carousel shows 5 relevant posts
- Images from Facebook posts
- "See More" opens Facebook post
- Auto-cycles through slides

## 💡 Tips & Best Practices

### For Best Results

1. **Post with Keywords:** Use "NOTICE", "EVENT", "ANNOUNCEMENT" in posts you want in carousel

2. **Add High-Quality Images:** Upload directly to Facebook Photos for best quality

3. **Tag Videos Properly:** Facebook video posts work best with native uploads

4. **Refresh Token:** Tokens expire - refresh every 60 days

5. **Monitor API Limits:** Facebook has rate limits - don't refresh too often

### Content Strategy

**For Carousel:**
- Post weekly announcements
- Use clear titles with keywords
- Include eye-catching images
- Keep text concise

**For Gallery:**
- Mix content types (photos, videos, text)
- Post regularly (daily/weekly)
- Use hashtags for organization
- Engage with comments

## 🎊 You're All Set!

Your gallery is now a **powerhouse** with:
- ✅ Video support
- ✅ Photo albums
- ✅ Smart filtering
- ✅ Like & download
- ✅ Carousel integration

Everything works together beautifully! 🚀

Questions? Check the console logs or refer back to this guide.

**Enjoy your enhanced gallery!** 🎉
