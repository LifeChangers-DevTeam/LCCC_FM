# 📘 Facebook Gallery Setup Guide

## 🎯 Overview

This gallery automatically fetches posts (with images and descriptions) from your Facebook Page and displays them in a beautiful masonry layout. Posts can be viewed in a full-screen lightbox with zoom and navigation controls.

## 🔑 Getting Your Facebook Access Token

To fetch real posts from your Facebook page, you need to set up Facebook Graph API access.

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Business"** as the app type
4. Fill in:
   - **App Name:** "LCCC Gallery" (or any name)
   - **App Contact Email:** Your email
5. Click **"Create App"**

### Step 2: Get Your Page Access Token

1. In your app dashboard, go to **Tools** → **Graph API Explorer**
2. Select your app from the dropdown
3. Click **"Generate Access Token"**
4. Grant permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_read_user_content`
5. Copy the **Access Token** that appears

### Step 3: Get a Long-Lived Token (Recommended)

Short-lived tokens expire in 1-2 hours. Convert to long-lived (60 days):

1. Go to [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
2. Paste your token
3. Click **"Extend Access Token"**
4. Copy the new long-lived token

### Step 4: Get a Page Access Token (Never Expires)

For a token that never expires:

1. Use Graph API Explorer
2. Select your Page from **"User or Page"** dropdown
3. Grant permissions
4. Copy the **Page Access Token**
5. Use [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) to verify it says **"Never expires"**

## 🔧 Configure Your Gallery

### 1. Open `js/facebook-gallery.js`

Find this section at the top:

```javascript
this.config = {
  pageId: '100079670415708', // ✅ Already set to your page
  accessToken: 'YOUR_FACEBOOK_ACCESS_TOKEN_HERE', // ⚠️ REPLACE THIS
  postsLimit: 50,
  refreshInterval: 300000, // 5 minutes
};
```

### 2. Replace the Access Token

```javascript
accessToken: 'EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Your actual token
```

### 3. (Optional) Adjust Settings

```javascript
postsLimit: 100, // Fetch more posts
refreshInterval: 600000, // Refresh every 10 minutes
```

## 📂 File Structure

```
your-project/
├── gallery.html                    ← Gallery page
├── css/
│   ├── main_css.css               ← Core styles
│   ├── gallery.css                ← Gallery-specific styles
│   └── carousel-lightbox.css      ← Lightbox styles
├── js/
│   ├── facebook-gallery.js        ← Facebook API integration
│   └── gallery-lightbox.js        ← Lightbox functionality
└── resources/
    └── (your images)
```

## 🎨 Features

### ✨ Automatic Updates
- Fetches latest posts from Facebook
- Auto-refreshes every 5 minutes
- Manual refresh button available

### 🖼️ Beautiful Display
- Masonry grid layout
- Glassmorphism design
- Smooth animations
- Responsive on all devices

### 🔍 Lightbox Viewer
- Full-screen image viewing
- Zoom in/out (0.5× to 3×)
- Pan zoomed images
- Keyboard navigation
- Touch swipe on mobile

### 🎯 Filtering
- **All Posts** - Show everything
- **Recent** - Last 7 days only
- **Photos Only** - Posts with images

## 🚀 Testing

### Demo Mode (No API Token Required)

If you haven't set up the Facebook token yet, the gallery will automatically use demo data from your local images. This is perfect for:
- Testing the layout
- Previewing the design
- Development without API setup

### Live Mode (With Facebook API)

Once you add your access token, the gallery will:
1. Fetch real posts from your Facebook page
2. Display images and descriptions
3. Auto-refresh for new content
4. Link back to Facebook posts

## 🛠️ Customization

### Change Colors

Edit `css/gallery.css`:

```css
/* Primary gradient */
background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 50%, #0a1628 100%);

/* Accent color */
background: linear-gradient(135deg, #860b46, #d91a72);
```

### Adjust Grid Layout

```css
/* In css/gallery.css */
.gallery-grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* Change 300px */
  gap: 1.5rem; /* Change spacing */
}
```

### Change Refresh Interval

```javascript
// In js/facebook-gallery.js
refreshInterval: 300000, // 5 minutes = 300000ms
```

## 📱 Responsive Breakpoints

- **Desktop:** 3-4 columns
- **Tablet:** 2-3 columns
- **Mobile:** 1 column
- Fully responsive images
- Touch-optimized controls

## 🔒 Security Best Practices

### ⚠️ Never Commit Access Tokens to Git

```bash
# Add to .gitignore
js/facebook-gallery.js
```

### ✅ Better: Use Environment Variables

For production, store token securely:

```javascript
// Load from environment or config
this.config = {
  accessToken: process.env.FB_ACCESS_TOKEN || 'YOUR_TOKEN_HERE',
};
```

### 🔐 Server-Side Proxy (Recommended for Production)

Instead of exposing your token in client-side code, create a server endpoint:

```javascript
// Your server (Node.js example)
app.get('/api/facebook-posts', async (req, res) => {
  const token = process.env.FB_ACCESS_TOKEN; // Secure!
  const response = await fetch(`https://graph.facebook.com/...?access_token=${token}`);
  const data = await response.json();
  res.json(data);
});

// In facebook-gallery.js
const response = await fetch('/api/facebook-posts'); // No token in client
```

## 🐛 Troubleshooting

### Problem: "Unable to load posts"

**Solutions:**
1. Check your access token is valid
2. Verify page ID is correct
3. Check browser console for errors
4. Test token in [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

### Problem: Token expired

**Solution:** Generate a new long-lived or page token (see Step 3 above)

### Problem: No images showing

**Possible causes:**
- Posts don't have images attached
- Privacy settings prevent image access
- Use "Photos Only" filter to see only image posts

### Problem: CORS errors

**Solution:** For production, use server-side proxy (see Security section)

## 📊 Facebook Graph API Fields

The gallery fetches these fields:

```javascript
fields = 'id,message,full_picture,created_time,permalink_url,attachments{media,type,url}'
```

**What each field does:**
- `id` - Unique post identifier
- `message` - Post text/description
- `full_picture` - Main image URL
- `created_time` - When post was created
- `permalink_url` - Link to Facebook post
- `attachments` - Additional media/images

## 🎯 Going Live

### Checklist

- [ ] Facebook App created
- [ ] Access token obtained (long-lived or page token)
- [ ] Token added to `facebook-gallery.js`
- [ ] Tested in browser
- [ ] Images loading correctly
- [ ] Lightbox working
- [ ] Filters functioning
- [ ] Mobile responsive
- [ ] Auto-refresh working

### Performance Tips

1. **Limit posts:** Don't fetch 1000s of posts at once
2. **Cache images:** Consider lazy loading
3. **Optimize images:** Facebook handles this automatically
4. **Monitor API limits:** Facebook has rate limits

## 🔗 Useful Links

- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api/)
- [Access Token Tool](https://developers.facebook.com/tools/accesstoken/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)

## 💡 Advanced Features (Optional)

### Add Video Support

Modify the API query to include videos:

```javascript
fields: 'id,message,full_picture,created_time,permalink_url,attachments{media,type,url,video_id}'
```

### Add Reactions Count

```javascript
fields: '...,reactions.summary(true)'
```

### Filter by Date Range

```javascript
const url = `...&since=2026-01-01&until=2026-12-31`;
```

## 🎉 You're All Set!

Your Facebook gallery is now ready to automatically display your latest posts. Enjoy! 🚀

---

**Need Help?** Check the browser console for detailed error messages, or refer to Facebook's Graph API documentation.
