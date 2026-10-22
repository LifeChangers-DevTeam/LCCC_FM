# Life Changers Family Radio (LCCC FM)

**Version:** 3.0.0  
**Status:** Production  
**Platform:** Progressive Web App (PWA)  
**Organization:** Life Changing Christian Church, Windhoek, Namibia

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Quick Start](#quick-start)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Usage Guide](#usage-guide)
7. [Maintenance](#maintenance)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)
10. [Documentation Index](#documentation-index)

---

## 🎯 Overview

LCCC FM is a Progressive Web App delivering 24/7 Christian radio broadcasting, live sermons, gospel music, and community updates to listeners worldwide.

### Key Features
- 🎵 24/7 Live Radio Streaming
- 📺 YouTube Video Integration
- 📸 Facebook Gallery with Videos
- 📱 Install as Mobile/Desktop App
- 🔄 Offline Support
- 🔔 Push Notifications

---

## ✨ Features

### Radio Player
- Live 24/7 broadcast
- Real-time song info
- Social sharing
- Auto-reconnect

### Video Broadcasts
- Latest sermons from YouTube
- Auto-load service videos
- Full player controls

### Gallery
- Facebook posts & photos
- Video playback
- Filter: All, Recent, Photos, Videos
- Like & download images
- Lightbox viewer

### PWA Capabilities
- Install on any device
- Works offline
- App shortcuts
- Background sync

---

## 🚀 Quick Start

### For Users

**Install the App:**
1. Visit https://your-site.netlify.app
2. Click "Install" when prompted
3. Enjoy app-like experience!

### For Developers

**Deploy to Netlify:**
```bash
git clone https://github.com/your-org/lccc-radio.git
cd lccc-radio
netlify init
netlify deploy --prod
```

---

## 📦 Installation

See [`INSTALLATION.md`](INSTALLATION.md) for detailed instructions.

### Quick Deploy

1. Fork repository
2. Connect to Netlify
3. Set environment variables
4. Deploy!

---

## ⚙️ Configuration

### Required Setup

**1. Facebook Access Token**
- File: `js/facebook-gallery-complete.js`
- Get from: [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- Also update: `js/carousel-facebook.js`

**2. YouTube API Key (Optional)**
- File: `js/youtube.js`
- Get from: [Google Cloud Console](https://console.cloud.google.com/)

See [`CONFIGURATION.md`](CONFIGURATION.md) for details.

---

## 📖 Usage Guide

### End Users

**Listening to Radio:**
1. Open app
2. Player auto-starts
3. Share songs via social buttons

**Browsing Gallery:**
1. Navigate to Gallery
2. Use filters (All, Recent, Photos, Videos)
3. Click images for full view
4. Download or like posts

**Installing as App:**
- **Android:** Menu → Install app
- **iOS:** Share → Add to Home Screen
- **Desktop:** Install icon in address bar

### Administrators

**Updating Content:**
- Post to Facebook (gallery auto-updates)
- Upload to YouTube (videos auto-load)
- Push code changes (Netlify auto-deploys)

See [`USER_GUIDE.md`](USER_GUIDE.md) and [`ADMIN_GUIDE.md`](ADMIN_GUIDE.md) for complete guides.

---

## 🔧 Maintenance

### Regular Tasks

**Daily:**
- Monitor stream uptime
- Check error logs

**Weekly:**
- Review analytics
- Test functionality

**Monthly:**
- Update dependencies
- Review security

**Quarterly:**
- Refresh Facebook token
- Update service worker version

See [`MAINTENANCE.md`](MAINTENANCE.md) for full schedule.

---

## 🔒 Security

### Implemented Measures
✅ HTTPS enforced (HSTS)  
✅ Content Security Policy (CSP)  
✅ XSS protection  
✅ Clickjacking prevention  
✅ CORS configuration  
✅ Secure headers  

### Best Practices
- Never commit secrets
- Rotate tokens quarterly
- Monitor logs
- Keep dependencies updated

See [`SECURITY.md`](SECURITY.md) for details.

---

## 🐛 Troubleshooting

### Common Issues

**Radio Won't Play:**
- Check internet connection
- Verify stream URL
- Clear browser cache

**Gallery Not Loading:**
- Verify Facebook token
- Check API rate limits
- Review console errors

**App Won't Install:**
- Ensure HTTPS enabled
- Check manifest.json
- Verify service worker

See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) for solutions.

---

## 📚 Documentation Index

### Core Documentation
- [`README.md`](README.md) - This file
- [`INSTALLATION.md`](INSTALLATION.md) - Setup instructions
- [`CONFIGURATION.md`](CONFIGURATION.md) - Configuration guide
- [`USER_GUIDE.md`](USER_GUIDE.md) - End user manual
- [`ADMIN_GUIDE.md`](ADMIN_GUIDE.md) - Administrator manual

### Technical Documentation
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - System architecture
- [`API_REFERENCE.md`](API_REFERENCE.md) - API documentation
- [`SERVICE_WORKER.md`](SERVICE_WORKER.md) - PWA implementation
- [`SECURITY.md`](SECURITY.md) - Security practices

### Operational Documentation
- [`MAINTENANCE.md`](MAINTENANCE.md) - Maintenance schedule
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - Deploy procedures
- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) - Problem solving
- [`CHANGELOG.md`](CHANGELOG.md) - Version history

### Development
- [`CONTRIBUTING.md`](CONTRIBUTING.md) - Contribution guidelines
- [`CODE_STYLE.md`](CODE_STYLE.md) - Coding standards
- [`TESTING.md`](TESTING.md) - Testing procedures

---

## 🏗️ Project Structure

```
lccc-radio/
├── index.html              # Main radio page
├── gallery.html            # Social media gallery
├── offline.html            # Offline fallback
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker
├── netlify.toml           # Netlify config
├── css/
│   ├── main_css.css       # Main styles
│   ├── gallery.css        # Gallery styles
│   └── carousel-lightbox.css
├── js/
│   ├── facebook-gallery-complete.js
│   ├── carousel-facebook.js
│   ├── youtube.js
│   └── ...
├── resources/
│   ├── icons/             # PWA icons
│   ├── images/            # Images
│   └── ...
└── docs/                  # Documentation
    ├── README.md
    ├── INSTALLATION.md
    └── ...
```

---

## 📞 Support

**Technical Support:**
- Email: tech@lccc.org
- GitHub: [Create Issue](https://github.com/your-org/lccc-radio/issues)

**General Inquiries:**
- Email: info@lccc.org
- Phone: +264 61 123 4567
- Website: https://lccc.org

---

## 📄 License

© 2026 Life Changing Christian Church. All rights reserved.

Proprietary software. Unauthorized use prohibited.

---

## 🎯 Quick Links

- [🚀 Deploy Now](https://app.netlify.com/start)
- [📖 Full Documentation](docs/)
- [🐛 Report Issue](https://github.com/your-org/lccc-radio/issues)
- [💬 Get Support](mailto:tech@lccc.org)

---

**Last Updated:** January 2026  
**Maintained By:** LCCC Tech Team  
**Version:** 3.0.0
