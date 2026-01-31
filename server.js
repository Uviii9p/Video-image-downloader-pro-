const express = require('express');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const path = require('path');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, 'public')));

// Explicitly serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================================
// HELPER FUNCTIONS
// =====================================

function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    return true;
  } catch (error) {
    return false;
  }
}

function getFileName(urlString) {
  try {
    const url = new URL(urlString);
    let name = path.basename(url.pathname);
    if (!name || name === '/') {
      name = `download_${Date.now()}`;
    }
    return name;
  } catch (error) {
    return `download_${Date.now()}`;
  }
}

function isYouTubeUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be');
  } catch (error) {
    return false;
  }
}

function isInstagramUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.includes('instagram.com');
  } catch (error) {
    return false;
  }
}

function getYtDlpCommand() {
  // Check environment variable first
  if (process.env.YT_DLP_PATH) return process.env.YT_DLP_PATH;

  try {
    // Check if yt-dlp is in system PATH
    execSync('yt-dlp --version', { stdio: 'ignore' });
    return 'yt-dlp';
  } catch (e) {
    // Check for local file in project root
    const localExe = path.join(__dirname, 'yt-dlp.exe');
    if (fs.existsSync(localExe)) return localExe;

    const localBin = path.join(__dirname, 'yt-dlp');
    if (fs.existsSync(localBin)) return localBin;

    return 'yt-dlp'; // Final fallback, hoping it works
  }
}

// =====================================
// ROUTES
// =====================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/info', async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).json({ error: 'URL is required' });

  try {
    const ytDlp = getYtDlpCommand();
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    const cleanUrl = fileUrl.split('?')[0];

    // Fast path for YouTube
    if (isYouTubeUrl(fileUrl)) {
      let videoId = '';
      if (fileUrl.includes('youtu.be/')) videoId = fileUrl.split('youtu.be/')[1].split('/')[0];
      else if (fileUrl.includes('v=')) videoId = fileUrl.split('v=')[1].split('&')[0];
      if (videoId) {
        return res.json({
          title: "YouTube Video",
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          type: 'youtube',
          videoId: videoId
        });
      }
    }

    // Comprehensive info fetch
    let info;
    try {
      const infoStdout = execSync(`"${ytDlp}" -j --no-playlist --no-warnings --user-agent "${ua}" "${cleanUrl}"`, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 15000 }).toString();
      info = JSON.parse(infoStdout);
    } catch (e) {
      if (isInstagramUrl(cleanUrl)) return res.json({ title: "Instagram Post", type: 'instagram' });
      return res.status(400).json({ error: 'Failed to fetch media info' });
    }

    res.json({
      title: info.title || "Untitled Media",
      thumbnail: info.thumbnail || (info.thumbnails && info.thumbnails.length > 0 ? info.thumbnails[0].url : null),
      type: info.url ? 'video' : 'photo',
      duration: info.duration_string || null,
      streamUrl: info.url || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Info error' });
  }
});

// ROBUST STREAMING PROXY
app.get('/api/stream', async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).send('URL required');

  const ytDlp = getYtDlpCommand();
  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  console.log(`🎥 Streaming Request: ${fileUrl}`);

  res.setHeader('Content-Type', 'video/mp4');

  const args = [
    '--user-agent', ua,
    '--no-playlist',
    '--no-part',
    '--buffer-size', '1M',
    '-f', 'best',
    '-o', '-',
    fileUrl
  ];

  const proc = spawn(ytDlp, args);
  proc.stdout.pipe(res);

  req.on('close', () => {
    console.log('🛑 Stream connection closed');
    proc.kill();
  });

  proc.stderr.on('data', (data) => {
    if (data.toString().includes('ERROR')) console.error(`❌ Stream Error: ${data}`);
  });
});

app.get('/download', async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).json({ error: 'URL is required' });

  const ytDlp = getYtDlpCommand();
  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  console.log(`📥 Request: ${fileUrl}`);

  // Step 1: Handle YouTube
  if (isYouTubeUrl(fileUrl)) {
    try {
      const requestedQuality = req.query.quality || '720';
      const ytDlp = getYtDlpCommand();
      let format = "22/18/best";
      if (requestedQuality === '1080') format = "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best";
      else if (requestedQuality === '720') format = "22/bestvideo[height<=720]+bestaudio/best[height<=720]/best";
      else if (requestedQuality === '480') format = "bestvideo[height<=480]+bestaudio/best[height<=480]/best";
      else if (requestedQuality === '360') format = "18/bestvideo[height<=360]+bestaudio/best[height<=360]/best";
      else if (requestedQuality === 'best') format = "bestvideo+bestaudio/best";

      console.log(`🎥 YouTube download: ${format}`);
      const infoJson = execSync(`"${ytDlp}" -j -f "${format}" "${fileUrl}"`).toString();
      const info = JSON.parse(infoJson);
      const filename = `${(info.title || 'video').replace(/[\\/*?:"<>|]/g, "")}.${info.ext}`;

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

      const proc = spawn(ytDlp, ['-f', format, '--no-playlist', '--no-part', '--buffer-size', '1M', '-o', '-', fileUrl]);
      proc.stdout.pipe(res);
      req.on('close', () => proc.kill());
    } catch (e) {
      console.error(`❌ YT Download Error: ${e.message}`);
      if (!res.headersSent) res.status(500).json({ error: 'Download failed' });
    }
    return;
  }

  // Step 2: Handle Instagram
  if (isInstagramUrl(fileUrl)) {
    const ytDlp = getYtDlpCommand();
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const cleanUrl = fileUrl.split('?')[0];

    try {
      console.log(`📥 IG Request: ${fileUrl}`);
      let info;
      try {
        const infoStdout = execSync(`"${ytDlp}" -j --no-playlist --user-agent "${ua}" "${cleanUrl}"`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
        info = JSON.parse(infoStdout);
      } catch (e) {
        console.warn(`⚠️ yt-dlp info failed for IG: ${cleanUrl}`);
      }

      if (info && (info.url || (info.formats && info.formats.length > 0))) {
        const filename = info.title ? `${info.title.replace(/[\\/*?:"<>|]/g, "").substring(0, 50)}.mp4` : `insta_video_${Date.now()}.mp4`;
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        const proc = spawn(ytDlp, ['--user-agent', ua, '--no-playlist', '--no-part', '-f', 'best', '-o', '-', cleanUrl]);
        proc.stdout.pipe(res);
        req.on('close', () => proc.kill());
        return;
      } else {
        // Photo scrape fallback
        console.log("🔍 Falling back to scraping for IG photo...");
        https.get(cleanUrl, { headers: { 'User-Agent': ua, 'Accept-Language': 'en-US,en;q=0.9' } }, (pageRes) => {
          let body = '';
          pageRes.on('data', c => body += c);
          pageRes.on('end', () => {
            const match = body.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i);
            const imageUrl = match ? match[1].replace(/&amp;/g, '&') : null;
            if (imageUrl) {
              console.log(`🖼️ Found image fallback: ${imageUrl}`);
              res.setHeader('Content-Type', 'image/jpeg');
              res.setHeader('Content-Disposition', `attachment; filename="insta_image_${Date.now()}.jpg"`);
              https.get(imageUrl, imgR => {
                imgR.pipe(res);
              }).on('error', (e) => {
                if (!res.headersSent) res.status(500).json({ error: 'Failed to pipe image' });
              });
            } else {
              if (!res.headersSent) res.status(404).json({ error: 'Media not found. It might be a private post.' });
            }
          });
        }).on('error', (e) => {
          if (!res.headersSent) res.status(500).json({ error: 'Connection failed' });
        });
      }
    } catch (e) {
      console.error(`❌ Total IG Error: ${e.message}`);
      if (!res.headersSent) res.status(500).json({ error: 'Critical error processing Instagram link' });
    }
    return;
  }

  // Step 3: Direct Download
  if (!isValidUrl(fileUrl)) return res.status(400).json({ error: 'Invalid URL' });
  const fileName = getFileName(fileUrl);
  const proto = fileUrl.startsWith('https') ? https : http;
  proto.get(fileUrl, (r) => {
    res.setHeader('Content-Type', r.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    r.pipe(res);
  }).on('error', (err) => {
    console.error(`❌ HTTP Download Error: ${err.message}`);
    if (!res.headersSent) res.status(500).json({ error: 'Direct download failed' });
  });
});

// =====================================
// SERVER INITIALIZATION
// =====================================

function startServer(p) {
  app.listen(p, () => {
    console.log(`🚀 Server running → http://localhost:${p}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${p} busy, jumping to ${p + 1}...`);
      startServer(p + 1);
    } else {
      console.error(err);
    }
  });
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = app;
