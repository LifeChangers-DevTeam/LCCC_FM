# PWA Installation & Setup Guide

## 📱 Progressive Web App Features

Your LCCC FM site is now a **Progressive Web App (PWA)**, which means:

✅ **Install like a native app** on any device  
✅ **Works offline** with cached content  
✅ **Faster loading** with service worker  
✅ **Push notifications** for updates  
✅ **App shortcuts** for quick access  
✅ **Automatic updates** in background  

---

## 🚀 How to Install

### Android (Chrome)

1. **Visit the website** on Chrome browser
2. Look for the **"Add LCCC FM to Home Screen"** banner at the bottom
3. Tap **"Install"** or **"Add"**
4. The app will be added to your home screen
5. Open it like any other app!

**Alternative method:**
1. Tap menu (⋮) in top-right
2. Select **"Install app"** or **"Add to Home screen"**
3. Confirm

### iOS (Safari)

1. **Visit the website** in Safari
2. Tap the **Share button** (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Name the app: "LCCC FM"
5. Tap **"Add"**

**Note:** iOS requires Safari browser for PWA installation.

### Desktop (Windows/Mac/Linux)

**Chrome/Edge:**
1. Visit the website
2. Look for **install icon** (⊕) in address bar
3. Click it
4. Click **"Install"**
5. App opens in its own window

**Alternative:**
1. Click menu (⋮)
2. Select **"Install LCCC FM..."**
3. Confirm installation

---

## 📁 Files Included

### Core PWA Files

1. **manifest.json** - App configuration
2. **service-worker.js** - Offline & caching logic
3. **offline.html** - Offline fallback page
4. **netlify.toml** - Server configuration

### Icons Required

Create these icon sizes and place in `/resources/`:

```
icon-72x72.png
icon-96x96.png
icon-128x128.png
icon-144x144.png
icon-152x152.png
icon-192x192.png
icon-384x384.png
icon-512x512.png
```

**How to Create Icons:**

**Option 1: Online Tool**
- Use [RealFaviconGenerator.net](https://realfavicongenerator.net/)
- Upload your logo
- Download all sizes

**Option 2: Image Editor**
- Open logo in Photoshop/GIMP
- Resize to each dimension
- Export as PNG with transparency

---

## ⚙️ Configuration

### 1. Update manifest.json

**Basic Info:**
```json
{
  "name": "Your Full App Name",
  "short_name": "Short Name",
  "theme_color": "#860b46",
  "background_color": "#0a1628"
}
```

**Change these to match your branding!**

### 2. Update Service Worker Version

When you make changes, increment version in `service-worker.js`:

```javascript
const CACHE_VERSION = 'v3.0.1'; // Increment this
```

This forces users to download new version.

### 3. Configure Netlify Headers

The `netlify.toml` file includes:
- Security headers (HSTS, CSP, XSS protection)
- Caching rules
- Service worker configuration

**Important:** Service worker must NEVER be cached:
```toml
[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "no-store, no-cache"
```

---

## ✅ Testing Your PWA

### Chrome DevTools

1. Open DevTools (F12)
2. Go to **Application** tab
3. Check sections:
   - **Manifest:** Should show your app info
   - **Service Workers:** Should show registered worker
   - **Cache Storage:** Should show cached files

### Lighthouse Audit

1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Select **"Progressive Web App"**
4. Click **"Generate report"**

**Target Scores:**
- PWA: 100/100
- Performance: 90+
- Accessibility: 90+
- Best Practices: 95+

### Manual Testing

**Test Install:**
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] Icon shows on home screen
- [ ] Opens in standalone mode

**Test Offline:**
- [ ] Install app
- [ ] Turn off internet
- [ ] Open app
- [ ] Offline page shows
- [ ] Cached content accessible

**Test Updates:**
- [ ] Change a file
- [ ] Increment SW version
- [ ] Deploy
- [ ] App auto-updates

---

## 🔧 Maintenance

### Updating the Service Worker

**When to update:**
- Added new files
- Changed HTML/CSS/JS
- Fixed bugs
- Added features

**How to update:**
1. Edit files as needed
2. Open `service-worker.js`
3. Change version:
   ```javascript
   const CACHE_VERSION = 'v3.0.2'; // Increment
   ```
4. Update `APP_SHELL` array if needed:
   ```javascript
   const APP_SHELL = [
     '/',
     '/index.html',
     '/new-page.html', // Add new pages
     // ...
   ];
   ```
5. Deploy

### Clearing User Caches

If users have issues:

**Option 1: Update SW version** (recommended)
- Increment `CACHE_VERSION`
- Users auto-update on next visit

**Option 2: Clear via DevTools**
- Application tab
- Clear storage
- Reload

**Option 3: Add clear cache button**
```javascript
// In your app
function clearCache() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
    
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
      }
    });
    
    location.reload();
  }
}
```

---

## 🎨 Customizing the PWA

### Change App Colors

**manifest.json:**
```json
{
  "theme_color": "#your-color",
  "background_color": "#your-background"
}
```

**Effect:**
- Theme color: Address bar color (mobile)
- Background color: Splash screen color

### Add App Shortcuts

**manifest.json:**
```json
{
  "shortcuts": [
    {
      "name": "Your Shortcut",
      "url": "/your-page.html",
      "icons": [...]
    }
  ]
}
```

Users can right-click app icon to see shortcuts.

### Custom Splash Screen

The splash screen uses:
- App icon (largest)
- App name
- Background color

No code needed - auto-generated!

---

## 📱 Platform-Specific Features

### Android

**Add to homescreen banner:**
- Appears after 30s if criteria met
- Can be triggered manually
- Shows app icon and name

**Install criteria:**
- HTTPS
- Valid manifest
- Service worker registered
- User visited 2+ times

### iOS

**Add to home screen:**
- Manual only (no banner)
- Uses Safari's "Add to Home Screen"
- Limited PWA features

**Limitations:**
- No push notifications
- No background sync
- Limited storage

### Desktop

**Install prompt:**
- Appears in address bar
- Can install via menu
- Opens in app window

**Features:**
- Window controls
- App switcher integration
- File handler registration

---

## 🔔 Push Notifications (Future)

The service worker is ready for push notifications!

**To implement:**

1. Get VAPID keys:
```bash
npx web-push generate-vapid-keys
```

2. Subscribe users:
```javascript
navigator.serviceWorker.ready.then(registration => {
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_PUBLIC_KEY'
  });
});
```

3. Send from server:
```javascript
webpush.sendNotification(subscription, payload);
```

**Use cases:**
- New sermon uploaded
- Live broadcast starting
- Important announcements
- Gallery updates

---

## 🐛 Troubleshooting

### PWA Won't Install

**Check:**
- [ ] HTTPS enabled
- [ ] manifest.json accessible
- [ ] All icons exist
- [ ] Service worker registered
- [ ] No console errors

**Test:**
```
https://your-site.com/manifest.json
https://your-site.com/service-worker.js
https://your-site.com/resources/icon-192x192.png
```

All should return 200 OK.

### Service Worker Not Updating

**Solutions:**
1. Increment `CACHE_VERSION`
2. Clear browser cache
3. Unregister service worker:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
```
4. Hard refresh (Ctrl+F5)

### Offline Page Not Showing

**Check:**
1. `offline.html` exists
2. Added to `APP_SHELL` array
3. Service worker registered
4. Try with DevTools → Network → Offline

### Icons Not Showing

**Check:**
1. All sizes created
2. Correct file paths in manifest
3. PNG format with transparency
4. Proper dimensions (exact pixel sizes)

---

## 📊 Analytics

Track PWA metrics:

**Using Google Analytics:**
```javascript
// Track installs
window.addEventListener('beforeinstallprompt', (e) => {
  ga('send', 'event', 'PWA', 'install-prompt-shown');
});

// Track offline usage
window.addEventListener('online', () => {
  ga('send', 'event', 'PWA', 'online');
});

window.addEventListener('offline', () => {
  ga('send', 'event', 'PWA', 'offline');
});
```

**Metrics to track:**
- Install rate
- Offline usage
- Service worker updates
- Cache hits/misses
- Performance metrics

---

## 🎯 Best Practices

1. **Always increment SW version** when deploying
2. **Test on real devices** not just desktop
3. **Keep manifest updated** with correct info
4. **Monitor cache size** - don't cache too much
5. **Provide offline experience** for key features
6. **Update regularly** - at least quarterly
7. **Test install flow** on all platforms

---

## 📚 Resources

**Official Docs:**
- [web.dev/progressive-web-apps](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

**Tools:**
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Workbox](https://developers.google.com/web/tools/workbox) (advanced SW)
- [PWA Builder](https://www.pwabuilder.com/)

**Testing:**
- [PWA Test](https://www.pwatest.com/)
- [Manifest Validator](https://manifest-validator.appspot.com/)

---

## ✅ Pre-Launch Checklist

- [ ] All icons created (8 sizes)
- [ ] manifest.json configured
- [ ] Service worker registered
- [ ] HTTPS enabled
- [ ] Lighthouse audit passed
- [ ] Tested on Android
- [ ] Tested on iOS
- [ ] Tested on Desktop
- [ ] Offline functionality works
- [ ] Install prompt appears
- [ ] App shortcuts work
- [ ] Theme colors correct
- [ ] No console errors

---

**Your PWA is ready to launch!** 🚀

Users can now install LCCC FM like a native app on any device!
