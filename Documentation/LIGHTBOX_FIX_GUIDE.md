# 🔧 Quick Fix: Lightbox Not Opening

## The Problem
Error: `GalleryLightbox is not defined`

This happens when scripts load in the wrong order.

## ✅ The Solution (3 Steps)

### Step 1: Fix Script Loading Order

In your `gallery.html`, find the script tags at the bottom (around line 172-174):

**WRONG ORDER:**
```html
<!-- ❌ DON'T DO THIS -->
<script src="js/facebook-gallery.js"></script>
<script src="js/gallery-lightbox.js"></script>
```

**CORRECT ORDER:**
```html
<!-- ✅ DO THIS -->
<script src="js/gallery-lightbox.js"></script>  <!-- Load FIRST -->
<script src="js/facebook-gallery.js"></script>  <!-- Load SECOND -->
```

**Why?** `facebook-gallery.js` uses the `GalleryLightbox` class, so `gallery-lightbox.js` must load first!

### Step 2: Clear Browser Cache

After fixing the order:
1. Hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
2. Or clear cache: `Ctrl + Shift + Delete`

### Step 3: Test

1. Open your gallery page
2. Click on any image
3. Lightbox should open! 🎉

## 🧪 Verify It's Fixed

### Test 1: Check Browser Console
Open browser console (F12) and look for:
```
✨ Facebook Gallery initialized
```

If you see `GalleryLightbox is not defined`, the scripts are still in wrong order.

### Test 2: Use Test Page

Upload `test-scripts.html` to your server and visit it:
```
https://your-site.com/test-scripts.html
```

It will show:
- ✅ All tests passing = Everything works
- ❌ Any failures = Check the error messages

### Test 3: Quick Console Check

Open console on gallery page and type:
```javascript
typeof GalleryLightbox
```

Should return: `"function"` ✅  
If returns: `"undefined"` ❌ - Script not loading

## 🔍 Still Not Working?

### Check 1: Files Uploaded?
Make sure both files are on your server:
- ✅ `/js/gallery-lightbox.js`
- ✅ `/js/facebook-gallery.js`

### Check 2: File Paths Correct?
In `gallery.html`, check the script paths:
```html
<script src="js/gallery-lightbox.js"></script>
```

If your JS files are in a different folder, update the path:
```html
<script src="/path/to/js/gallery-lightbox.js"></script>
```

### Check 3: Network Tab
1. Open DevTools (F12)
2. Go to "Network" tab
3. Refresh page
4. Look for `gallery-lightbox.js`
   - ✅ Status 200 = File loaded
   - ❌ Status 404 = File not found (check path)

### Check 4: Console Errors
Look for errors like:
- `404 Not Found` = File path is wrong
- `SyntaxError` = File is corrupted
- `CORS error` = Server configuration issue

## 📋 Complete HTML Script Section

Your script section should look exactly like this:

```html
  <!-- Bootstrap Icons (for social icons) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">

  <!-- Scripts - ORDER MATTERS! -->
  <script src="js/gallery-lightbox.js"></script>      <!-- 1. Load lightbox class first -->
  <script src="js/facebook-gallery.js"></script>     <!-- 2. Then load gallery manager -->
  <script>
    document.getElementById("year").textContent = new Date().getFullYear();
  </script>

</body>
</html>
```

## 🎯 Why This Happened

JavaScript loads scripts **in order**. When you had:

```
1. facebook-gallery.js loads
2. Tries to use GalleryLightbox class
3. ❌ GalleryLightbox doesn't exist yet!
4. gallery-lightbox.js loads (too late)
```

With the correct order:

```
1. gallery-lightbox.js loads
2. ✅ GalleryLightbox class defined
3. facebook-gallery.js loads
4. ✅ Can use GalleryLightbox class
```

## 🚀 After Fixing

Once fixed, you should be able to:
1. ✅ Click any gallery image
2. ✅ Lightbox opens full-screen
3. ✅ Navigate with arrow buttons or keyboard
4. ✅ Zoom in/out with controls
5. ✅ Close with X button or ESC key

## 📞 Still Having Issues?

Run this diagnostic in your console:

```javascript
// Paste this entire block into browser console
console.log('=== GALLERY DIAGNOSTICS ===');
console.log('GalleryLightbox:', typeof GalleryLightbox);
console.log('FacebookGalleryManager:', typeof FacebookGalleryManager);
console.log('galleryManager instance:', window.galleryManager ? '✅' : '❌');
console.log('galleryLightbox instance:', window.galleryLightbox ? '✅' : '❌');
console.log('lightbox element:', document.getElementById('lightbox') ? '✅' : '❌');
console.log('=========================');
```

Expected output:
```
=== GALLERY DIAGNOSTICS ===
GalleryLightbox: function ✅
FacebookGalleryManager: function ✅
galleryManager instance: ✅
galleryLightbox instance: ❌ (normal until first image clicked)
lightbox element: ✅
=========================
```

If any show `undefined` or `❌`, there's still an issue.

## 🎉 Success!

Once everything works:
- Images open in beautiful full-screen lightbox
- Smooth zoom and pan
- Keyboard navigation
- Mobile swipe support
- Professional gallery experience

Enjoy your working gallery! 🚀
