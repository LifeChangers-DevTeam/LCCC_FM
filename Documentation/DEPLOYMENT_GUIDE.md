# Deployment & Operations Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment

#### Code Preparation
- [ ] All changes committed to Git
- [ ] Code reviewed and tested
- [ ] Service worker version incremented
- [ ] No console errors or warnings
- [ ] All TODOs removed or documented

#### Configuration
- [ ] Facebook access token updated and tested
- [ ] YouTube API key configured (if using)
- [ ] Stream URL verified and working
- [ ] Social media links updated
- [ ] Contact information current

#### Assets
- [ ] All PWA icons created (8 sizes)
- [ ] Images optimized (< 500KB each)
- [ ] Bookstore logo uploaded
- [ ] Namibia flag SVG included
- [ ] Favicon in place

#### Testing
- [ ] Radio stream plays
- [ ] Gallery loads from Facebook
- [ ] Videos load from YouTube
- [ ] Carousel updates from Facebook
- [ ] All filters work (All, Recent, Photos, Videos)
- [ ] Like and download buttons functional
- [ ] Lightbox opens and closes
- [ ] Mobile responsive
- [ ] PWA install prompt appears
- [ ] Offline mode works

#### Security
- [ ] HTTPS configured
- [ ] CSP headers in netlify.toml
- [ ] No secrets in code
- [ ] Access tokens rotated
- [ ] Security headers tested

### Deployment Steps

#### Option 1: Netlify (Automatic)

**Initial Setup:**
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Initialize site
netlify init

# 4. Deploy to production
netlify deploy --prod
```

**Subsequent Deploys:**
```bash
git add .
git commit -m "Your changes"
git push origin main
# Netlify auto-deploys!
```

#### Option 2: Manual FTP

**Files to Upload:**
```
/
├── index.html
├── gallery.html
├── offline.html
├── manifest.json
├── service-worker.js
├── netlify.toml (for reference)
├── css/
│   ├── main_css.css
│   ├── gallery.css
│   └── carousel-lightbox.css
├── js/
│   ├── facebook-gallery-complete.js
│   ├── carousel-facebook.js
│   ├── youtube.js
│   └── (all other JS files)
└── resources/
    ├── icon-*.png (all icons)
    ├── namibia-flag.svg
    ├── lccc-store-logo.svg
    └── (all images)
```

**FTP Steps:**
1. Connect via FTP client (FileZilla, etc.)
2. Upload all files maintaining directory structure
3. Set permissions (755 for directories, 644 for files)
4. Verify manifest.json is accessible
5. Test service worker registration

### Post-Deployment

#### Immediate Verification
- [ ] Visit production URL
- [ ] Check HTTPS is working
- [ ] Test radio stream
- [ ] Test gallery loading
- [ ] Test video loading
- [ ] Try PWA install
- [ ] Test on mobile device

#### Monitoring
- [ ] Check Netlify deploy logs
- [ ] Monitor error logs
- [ ] Review analytics
- [ ] Test from different locations
- [ ] Verify caching headers

---

## 🔄 Update Procedures

### Routine Updates

#### Content Updates (No Code Changes)

**Facebook Posts:**
- Post normally to Facebook
- Gallery auto-updates within 5 minutes
- No deployment needed

**YouTube Videos:**
- Upload to YouTube channel
- Use keywords: "service", "sermon", "worship"
- Video auto-loads within 2 minutes
- No deployment needed

#### Minor Code Updates

**Process:**
```bash
# 1. Make changes
# 2. Test locally
# 3. Increment SW version if needed
const CACHE_VERSION = 'v3.0.1'; // v3.0.0 → v3.0.1

# 4. Commit and push
git add .
git commit -m "Minor update: description"
git push origin main

# 5. Verify deployment
# Check Netlify dashboard
```

#### Major Updates

**Process:**
1. Create feature branch:
```bash
git checkout -b feature-name
```

2. Make changes and test

3. Increment major version:
```javascript
const CACHE_VERSION = 'v4.0.0'; // Major change
```

4. Create pull request

5. Review and merge:
```bash
git checkout main
git merge feature-name
git push origin main
```

6. Monitor deployment

7. Announce to users

---

## 🔧 Configuration Management

### Environment Variables

**Netlify Dashboard:**
1. Go to Site settings
2. Environment variables
3. Add/edit:
   ```
   YOUTUBE_API_KEY=your_key_here
   FACEBOOK_PAGE_ID=100079670415708
   NODE_ENV=production
   ```

**Important:** Never commit these to Git!

### Access Token Rotation

**Facebook Token (Quarterly):**
1. Generate new token at [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Update in two files:
   - `js/facebook-gallery-complete.js`
   - `js/carousel-facebook.js`
3. Test gallery loading
4. Deploy
5. Document expiration date

**YouTube API Key (Annual):**
1. Review usage in [Google Cloud Console](https://console.cloud.google.com/)
2. Rotate if needed
3. Update in `js/youtube.js`
4. Test video loading
5. Deploy

### Stream Configuration

**Updating Stream URL:**

1. Edit `index.html`:
```html
<div class="cc_player" data-username="new-username"></div>
```

2. Or update stream server:
   - Contact ShoutCheap support
   - Get new stream URL
   - Update player code

3. Test thoroughly

4. Deploy

---

## 📊 Monitoring & Analytics

### Daily Checks

**Morning Routine:**
1. Check stream is live:
   ```bash
   curl -I https://broadcast.shoutcheap.com:8000/stream
   ```

2. Verify site is up:
   ```bash
   curl -I https://your-site.com
   ```

3. Check error logs (Netlify dashboard)

4. Review yesterday's analytics

**Evening Routine:**
1. Check uptime report
2. Review any user reports
3. Verify backups

### Weekly Reports

**Metrics to Track:**
- Unique visitors
- Page views
- Radio listening time
- Gallery engagement
- PWA installs
- Bounce rate
- Load times

**Tools:**
- Google Analytics
- Netlify Analytics
- Search Console

### Monthly Reviews

**Performance:**
- Run Lighthouse audit
- Check Core Web Vitals
- Review load times
- Optimize if needed

**Content:**
- Most viewed pages
- Popular gallery items
- Top videos
- User behavior

**Technical:**
- Service worker hit rate
- Cache performance
- Error rates
- API usage

---

## 🔄 Backup & Recovery

### Automated Backups

**Git Repository:**
- Automatic version control
- Full history preserved
- Easy rollback

**Netlify:**
- Automatic deploy snapshots
- One-click rollback
- 30-day history

### Manual Backups

**Weekly Backup Script:**
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="backups/$DATE"

mkdir -p $BACKUP_DIR

# Copy critical files
cp -r css $BACKUP_DIR/
cp -r js $BACKUP_DIR/
cp -r resources $BACKUP_DIR/
cp *.html $BACKUP_DIR/
cp manifest.json $BACKUP_DIR/
cp service-worker.js $BACKUP_DIR/

# Compress
tar -czf "backup-$DATE.tar.gz" $BACKUP_DIR

echo "Backup created: backup-$DATE.tar.gz"
```

### Disaster Recovery

**Site Down:**
1. Check Netlify status page
2. Review deploy logs
3. Check DNS settings
4. Rollback to last working deploy if needed:
```bash
netlify rollback
```

**Corrupted Deploy:**
1. Find last good deploy in Netlify
2. Click "Publish deploy"
3. Or redeploy from Git:
```bash
git log  # Find good commit
git reset --hard <commit-hash>
git push origin main --force
```

**Data Loss:**
1. Restore from Git
2. Or restore from backup:
```bash
tar -xzf backup-DATE.tar.gz
# Copy files back
```

---

## 🔔 Incident Response

### Severity Levels

**P0 - Critical (Fix Immediately)**
- Site completely down
- Radio stream not working
- Security breach

**P1 - High (Fix within 4 hours)**
- Gallery not loading
- Videos not playing
- PWA install broken

**P2 - Medium (Fix within 24 hours)**
- Individual features broken
- Performance issues
- Minor bugs

**P3 - Low (Fix within 1 week)**
- Cosmetic issues
- Enhancement requests
- Non-critical bugs

### Response Protocol

**Step 1: Assess**
- Confirm the issue
- Determine severity
- Check affected users

**Step 2: Notify**
- Alert team
- Post status (if major)
- Document timeline

**Step 3: Fix**
- Identify root cause
- Implement fix
- Test thoroughly
- Deploy

**Step 4: Verify**
- Confirm fix works
- Monitor for recurrence
- Update documentation

**Step 5: Post-Mortem**
- Document incident
- Identify prevention
- Update procedures
- Share learnings

---

## 📝 Change Log Management

### Version Numbering

**Format:** MAJOR.MINOR.PATCH (e.g., 3.2.1)

**MAJOR (X.0.0):**
- Breaking changes
- Major redesign
- New core features

**MINOR (0.X.0):**
- New features
- Non-breaking changes
- Enhancements

**PATCH (0.0.X):**
- Bug fixes
- Minor tweaks
- Security patches

### Documenting Changes

**CHANGELOG.md:**
```markdown
## [3.0.1] - 2026-01-25

### Added
- Download button for images
- Video filter option

### Changed
- Improved gallery performance
- Updated Facebook API

### Fixed
- Lightbox zoom issue
- Mobile responsiveness

### Security
- Updated CSP headers
- Rotated access tokens
```

---

## 🎯 Performance Optimization

### Regular Optimization

**Monthly Tasks:**
1. Run Lighthouse audit
2. Optimize images (compress further)
3. Review and remove unused code
4. Update dependencies
5. Check bundle sizes

**Tools:**
```bash
# Check bundle sizes
du -sh js/*.js css/*.css

# Optimize images
# Use TinyPNG or similar

# Minify if needed
npx terser input.js -o output.js
npx csso input.css -o output.css
```

### Performance Targets

**Lighthouse Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+
- PWA: 100

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

---

## ✅ Pre-Release Checklist

Before any major release:

### Code Quality
- [ ] No console errors
- [ ] No console warnings
- [ ] Code commented
- [ ] Functions documented
- [ ] No debug code

### Functionality
- [ ] All features tested
- [ ] Cross-browser tested
- [ ] Mobile tested
- [ ] Offline mode verified
- [ ] PWA install works

### Performance
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] Code minified
- [ ] Caching configured

### Security
- [ ] Tokens rotated
- [ ] HTTPS verified
- [ ] Headers configured
- [ ] No vulnerabilities

### Documentation
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Inline comments added
- [ ] User guide current

### Communication
- [ ] Team notified
- [ ] Users informed (if major)
- [ ] Support prepared
- [ ] Rollback plan ready

---

## 📞 Support Contacts

**Emergency Contacts:**
- Tech Lead: +264 61 XXX XXXX
- Server Admin: admin@lccc.org
- Netlify Support: [support.netlify.com](https://support.netlify.com)

**Service Providers:**
- **Hosting:** Netlify (support.netlify.com)
- **Stream:** ShoutCheap (support@shoutcheap.com)
- **Domain:** (your registrar)
- **CDN:** Cloudflare (support if applicable)

---

**Last Updated:** January 2026  
**Next Review:** April 2026  
**Maintained By:** LCCC Tech Team
