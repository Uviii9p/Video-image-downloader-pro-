# Video Image Downloader Pro 🚀

A premium, full-stack universal media downloader. Download videos, audio, and images from YouTube, Instagram, TikTok, and Facebook with a stunning, modern interface.

![Video Image Downloader Pro](bh.png)

## ✨ Features

### Core Features
- **Smart URL Detection** - Auto-detects platform (YouTube, Instagram, TikTok, Facebook)
- **Video Analysis** - Fetches title, thumbnail, duration, and available formats/qualities
- **Multi-Format Download** - MP4 (video), MP3 (audio extraction)
- **Quality Selection** - Choose from 360p, 480p, 720p, 1080p, or Best
- **Preview Player** - Watch/listen before downloading

### Advanced Features
- 📋 **Batch Download** - Analyze and download multiple URLs at once
- 📜 **Download History** - Saves last 10 downloads (localStorage)
- 📋 **Copy Download Link** - Share direct download links
- 🖱️ **Drag & Drop** - Drop URLs directly into the input
- 📱 **QR Code Generator** - Generate QR codes for sharing links
- 🌗 **Dark/Light Mode** - Toggle between themes
- 🔔 **Toast Notifications** - Beautiful status messages
- ⌨️ **Keyboard Shortcuts** - Paste to auto-focus, Escape to close modals

### Design
- 🎨 Modern SaaS glassmorphism design
- 🌈 Purple→blue animated gradient background
- ✨ Micro-animations and hover effects
- 📱 Fully responsive (mobile + desktop)
- 🔤 Premium typography (Inter + Outfit from Google Fonts)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| Backend | Node.js + Express |
| Media Engine | yt-dlp |
| Audio | FFmpeg |
| Icons | Lucide Icons |
| QR Code | qrcode.js |
| Deployment | Vercel + Render/Railway |

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed and in PATH
- [FFmpeg](https://ffmpeg.org/) (optional, for audio extraction)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/video-image-downloader-pro.git
cd video-image-downloader-pro

# Install dependencies
npm install

# Start the server
npm run dev
```

The app will be running at `http://localhost:4000`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `YT_DLP_PATH` | Path to yt-dlp binary | Auto-detected |

## 📡 API Endpoints

### POST `/api/analyze`
Analyze a media URL and return metadata.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": "3:32",
  "platform": "youtube",
  "type": "video",
  "formats": [
    { "quality": "1080p", "format": "mp4", "size": "120MB" },
    { "quality": "720p", "format": "mp4", "size": "60MB" }
  ],
  "audioAvailable": true
}
```

### POST `/api/download`
Download media in specified format and quality.

### POST `/api/batch-analyze`
Analyze multiple URLs at once (max 10).

### GET `/api/health`
Check server status and dependencies.

### GET `/api/stream`
Stream media through proxy.

## 📦 Deployment

### Vercel (Frontend + API)
```bash
vercel --prod
```

### Render / Railway (Backend)
Set the start command to `npm start` and configure environment variables.

## ⚖️ Legal

This tool is provided **for educational use only**. Users are responsible for ensuring their usage complies with applicable laws and platform terms of service.

## 👨‍💻 Author

**Sujal Rathod** - [GitHub](https://github.com/Uviii9p)

## 📄 License

MIT License
