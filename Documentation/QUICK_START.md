# 🚀 Facebook Gallery - Quick Start

## ⚡ 3-Minute Setup

### 1️⃣ Get Your Facebook Page ID
You already have it: `100079670415708` ✅

### 2️⃣ Get Your Access Token

**Fastest Way:**
1. Go to: https://developers.facebook.com/tools/explorer/
2. Click "Generate Access Token"
3. Grant permissions: `pages_read_engagement`
4. Copy the token

### 3️⃣ Configure Gallery

Open `js/facebook-gallery.js` and replace line 15:

```javascript
accessToken: 'YOUR_FACEBOOK_ACCESS_TOKEN_HERE',
```

With your actual token:

```javascript
accessToken: 'EAABxxxxxxxxxxxxxxx',
```

### 4️⃣ Upload & Test

Upload these files to your server:
- `gallery.html`
- `css/gallery.css`
- `js/facebook-gallery.js`
- `js/gallery-lightbox.js`

Visit: `yoursite.com/gallery.html`

## ✅ What You Get

✨ **Auto-fetches** posts from your Facebook page
📸 **Displays** images + descriptions in beautiful grid
🔄 **Auto-refreshes** every 5 minutes
🖼️ **Lightbox** viewer with zoom/pan
📱 **Fully responsive** on all devices
🎨 **Glassmorphism** design matching your site

## 🎯 Features

- **All Posts** - Everything from your page
- **Recent** - Last 7 days only
- **Photos Only** - Image posts only
- **Refresh Button** - Manual update
- **Click to View** - Full-screen lightbox
- **Zoom In/Out** - Up to 3× zoom
- **Keyboard Controls** - Arrow keys, ESC, +/-

## 🔧 Without Facebook Token (Demo Mode)

Can't get token right now? No problem!

The gallery will automatically show **demo posts** using images from your `resources/` folder. Perfect for:
- Testing the design
- Preview before going live
- Development without API

## 📞 Need Help?

See full setup guide: `FACEBOOK_SETUP_GUIDE.md`

---

**That's it!** Your Facebook gallery is ready to go 🎉
