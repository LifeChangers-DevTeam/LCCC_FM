📡 Life Changers Family Radio (LcccFm)

A Progressive Web App for livestream audio & YouTube church services — built for speed, reliability, and ministry impact.

🌟 Overview

Life Changers Family Radio is a web-based audio streaming platform designed for Life Changers Church.
Built as a PWA (Progressive Web App), the platform supports:

🎧 Live Shoutcast Radio Streaming

▶️ Automatic Latest YouTube Service Feed (excludes Shorts)

📱 Installable App Experience (Android, iOS, Desktop)

📶 Offline Mode with Fallback Audio

🖼️ Dynamic Program Carousel

⚡ Optimized Cache Strategy via Service Worker

🔐 Security-Hardened Netlify Deployment with CSP

The site is lightweight, mobile-first, and tailored for congregants who want consistent access to teachings, worship, and programs.

🚀 Tech Stack
Layer	Technology
Frontend	HTML5, CSS3, JavaScript (Vanilla)
Hosting	Netlify
Streaming	Shoutcast v2
YouTube Integration	YouTube Data API v3
Caching	Service Worker (PWA)
Images/Static	Netlify Static CDN
🏗️ Project Structure
/
├── index.html
├── service-worker.js
├── manifest.json
├── netlify.toml
├── main_css.css
└── /resources
      ├── background.jpg
      ├── 40days.jpg
      ├── offline-audio.mp3
      └── icons/

📱 PWA Features
✔ Installable

Users can install the radio as an app on phones and desktops.

✔ Offline Support

The service worker provides:

Cached homepage

Cached CSS and assets

Offline audio fallback if stream is unavailable

✔ Update Notifications

The app prompts users when a new version is available via:

postMessage() from the service worker

Update button that triggers skipWaiting()

🔗 Live Deployment

Netlify URL:
👉 Add link here after deployment

Production Branch:
main

🎥 YouTube Service Feed

The app pulls the latest full teaching/services only, excluding Shorts, using:

type=video

videoDuration=long

order=date

maxResults=1

A fallback video is used if no results are returned.

🎶 Shoutcast Stream

The stream player loads the live broadcast from your Shoutcast v2 server.
If a listener goes offline, playback switches to offline-audio.mp3.

🔧 Development Setup

Clone the repo:

git clone https://github.com/Bul1dozer/LcccFm.git
cd LcccFm


No build tools required — everything runs static.

Serve locally (optional):

npx serve

🧪 Testing PWA Locally

Chrome:

Inspect → Application → Service Workers → Check “Update on Reload”

Safari (iOS/macOS):

Developer Menu → Service Workers → Clear & Reload

🔐 Security

This project includes:

Strict Content Security Policy (CSP)

No caching of service-worker.js

No inline eval

No external scripts except YouTube & CDNJS

Disabled geolocation, camera, microphone permissions

These rules are managed in netlify.toml.

🛠️ Future Enhancements

🔎 Searchable sermon archive

📜 Playlist queue for the radio

🔔 Push notifications for new broadcasts

📡 Multi-station support

🌍 Multi-language UI (EN / PT / FR / SP)

🎙 Live metadata pulled from Shoutcast XML

🧠 Server-side church assistant with hybrid retrieval

🌐 Approved live-source layer for official church links

🙏 Direct prayer-request submission workflow

🗂 Knowledge and content studio workflows for maintainers

📘 Operations guide: `Documentation/CHATBOT_CONTENT_PRAYER_GUIDE.md`

🤝 Contributing

We welcome contributions from the Life Changers Tech Team.

To contribute:

Fork the repo

Create a branch

Commit and push changes

Submit a pull request

📄 License

MIT License – Free for church and community use.

🙌 Developed By

Life Changers Family Church Tech Department
Lead Developer: Liam (“Bul1dozer”)

“Transforming lives through Jesus.”
