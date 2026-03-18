console.log('--- SERVER RESTARTED v3 (TeraPlay Engine Active) ---');
const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const path = require('path');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

// =====================================
// EXPRESS APP SETUP
// =====================================
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve Static Files (Vite dist or Legacy public)
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root
app.get('/', (req, res) => {
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});
// =====================================
// HELPER FUNCTIONS
// =====================================

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function detectPlatform(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('facebook.com') || host.includes('fb.watch') || host.includes('fb.com')) return 'facebook';
    if (host.includes('terabox') || host.includes('1024tera') || host.includes('dubox') || host.includes('freeterabox') || host.includes('teraplay.in') || host.includes('terasharefile')) return 'terabox';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'twitter';
    if (host.includes('reddit.com')) return 'reddit';
    if (host.includes('vimeo.com')) return 'vimeo';
    return 'direct';
  } catch {
    return 'unknown';
  }
}

function getFileName(urlString) {
  try {
    const url = new URL(urlString);
    let name = path.basename(url.pathname);
    if (!name || name === '/') name = `download_${Date.now()}`;
    return name;
  } catch {
    return `download_${Date.now()}`;
  }
}

function getYtDlpCommand() {
  if (process.env.YT_DLP_PATH) return process.env.YT_DLP_PATH;
  try {
    execSync('yt-dlp --version', { stdio: 'ignore' });
    return 'yt-dlp';
  } catch {
    const localExe = path.join(__dirname, 'yt-dlp.exe');
    if (fs.existsSync(localExe)) return localExe;
    const localBin = path.join(__dirname, 'yt-dlp');
    if (fs.existsSync(localBin)) return localBin;
    return 'yt-dlp';
  }
}

// Check if FFmpeg is available
let HAS_FFMPEG = false;
try {
  execSync('ffmpeg -version', { stdio: 'ignore', timeout: 5000 });
  HAS_FFMPEG = true;
  console.log('✅ FFmpeg detected');
} catch {
  console.log('⚠️  FFmpeg not found — using pre-merged formats only');
}

// Build a yt-dlp format string based on quality and FFmpeg availability
function buildFormatString(quality) {
  const q = (quality || 'best').replace('p', '');
  if (HAS_FFMPEG) {
    // Can merge separate streams
    if (q === 'best' || q === 'Best') return 'bestvideo+bestaudio/best';
    if (q === '2160' || q === '4k')  return 'bestvideo[height<=2160]+bestaudio/best[height<=2160]/best';
    if (q === '1080') return 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best';
    if (q === '720')  return '22/bestvideo[height<=720]+bestaudio/best[height<=720]/best';
    if (q === '480')  return 'bestvideo[height<=480]+bestaudio/best[height<=480]/best';
    if (q === '360')  return '18/bestvideo[height<=360]+bestaudio/best[height<=360]/best';
    return 'bestvideo+bestaudio/best';
  }
  // No FFmpeg — must use pre-merged single-stream (has both video + audio)
  if (q === 'best' || q === 'Best') return 'best[vcodec!=none][acodec!=none]/best';
  if (q === '2160' || q === '4k')  return 'best[height<=2160][vcodec!=none][acodec!=none]/best[height<=2160]/best';
  if (q === '1080') return 'best[height<=1080][vcodec!=none][acodec!=none]/best[height<=1080]/best';
  if (q === '720')  return '22/best[height<=720][vcodec!=none][acodec!=none]/best[height<=720]/best';
  if (q === '480')  return 'best[height<=480][vcodec!=none][acodec!=none]/best[height<=480]/best';
  if (q === '360')  return '18/best[height<=360][vcodec!=none][acodec!=none]/best[height<=360]/best';
  return 'best[vcodec!=none][acodec!=none]/best';
}

function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.substring(1).split('/')[0].split('?')[0];
    if (u.searchParams.has('v')) return u.searchParams.get('v');
    if (u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1].split('/')[0].split('?')[0];
    if (u.pathname.includes('/embed/')) return u.pathname.split('/embed/')[1].split('/')[0].split('?')[0];
    return null;
  } catch {
    return null;
  }
}

function detectMediaType(url) {
  const lower = url.toLowerCase();
  const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.avi', '.mkv', '.flv'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const audioExts = ['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg', '.wma'];

  if (videoExts.some(ext => lower.includes(ext))) return 'video';
  if (imageExts.some(ext => lower.includes(ext))) return 'image';
  if (audioExts.some(ext => lower.includes(ext))) return 'audio';
  return 'video'; // Default assumption for social media
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return null;
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function getMetaInfo(url) {
  // Strategy 1: Bot-spoofing on the main URL (Often bypasses login wall for metadata)
  const botUA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
  
  const attemptScrape = (targetUrl, userAgent) => {
    return new Promise((resolve) => {
      const options = {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Referer': 'https://www.google.com/',
          'Connection': 'keep-alive'
        },
        timeout: 10000
      };

      const protocol = targetUrl.startsWith('https') ? https : http;
      protocol.get(targetUrl, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', () => resolve(null));
    });
  };

  let body = await attemptScrape(url, botUA);
  
  // Strategy 2: Fallback to Embed URL if main page is blocked
  if (!body || body.includes('login') || !body.includes('og:image')) {
    let embedUrl = url;
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(p => p);
      if (parts[0] === 'p' || parts[0] === 'reel' || parts[0] === 'reels' || parts[0] === 'tv') {
        embedUrl = `https://www.instagram.com/p/${parts[1]}/embed/captioned/`;
      }
    } catch {}
    body = await attemptScrape(embedUrl, UA);
  }

  if (!body) return { title: null, thumbnail: null, videoUrl: null, type: 'video' };

  const findTag = (tag) => {
    const patterns = [
      new RegExp(`property=["']og:${tag}["']\\s+content=["']([^"']*)["']`, 'i'),
      new RegExp(`content=["']([^"']*)["']\\s+property=["']og:${tag}["']`, 'i'),
      new RegExp(`<meta[^>]*?property=["']og:${tag}["'][^>]*?content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]*?name=["']twitter:${tag}["'][^>]*?content=["']([^"']*)["']`, 'i'),
      new RegExp(`"${tag}":["']([^"']*)["']`, 'i'),
      new RegExp(`"${tag}_url":["']([^"']*)["']`, 'i')
    ];
    for (const p of patterns) {
      const match = body.match(p);
      if (match) return match[1];
    }
    return null;
  };

  const titleMatch = body.match(/<title>([^<]*)<\/title>/i);
  const clean = (u) => u ? u.replace(/\\u0026/g, '&').replace(/&amp;/g, '&') : null;

  let thumbnail = findTag('image') || findTag('thumbnail_src') || findTag('display_url') || findTag('display_src');
  let videoUrl = findTag('video') || findTag('video_url') || findTag('video_src');

  const displayUrl = findTag('display_url');
  if (displayUrl && !thumbnail) thumbnail = displayUrl;

  if (!thumbnail) {
    const scontentMatch = body.match(/https:\/\/scontent[^"']*/gi);
    if (scontentMatch) thumbnail = scontentMatch[0];
  }
  
  if (!videoUrl && body.includes('.mp4')) {
    const mp4Match = body.match(/https:\/\/[^"']*?\.mp4[^"']*/i);
    if (mp4Match) videoUrl = mp4Match[0];
  }

  const result = {
    title: clean(findTag('title') || findTag('description') || (titleMatch ? titleMatch[1] : null)),
    thumbnail: clean(thumbnail),
    videoUrl: clean(videoUrl),
    type: (videoUrl || body.includes('Video') || body.includes('reel_video') || body.includes('video_duration')) ? 'video' : 'image'
  };

  console.log(`📸 Scraped ${url}: Title="${result.title}" | Type=${result.type} | Thumb=${!!result.thumbnail}`);
  return result;
}


async function getTeraboxInfo(url) {
  try {
    let targetUrl = url;
    // Handle nested URLs (e.g. teraplay.in/?url=...)
    if (url.includes('?url=')) {
      const u = new URL(url);
      const nestedUrl = u.searchParams.get('url');
      if (nestedUrl) targetUrl = nestedUrl;
    }

    const u = new URL(targetUrl);
    console.log(`📦 Fetching Meta via TeraPlay Engine: ${targetUrl}`);
    
    // Primary: use TeraPlay's reliable fetch API
    const fetchUrl = `https://teraplay.in/api/fetch?url=${encodeURIComponent(targetUrl)}`;
    const body = await new Promise((resolve) => {
      https.get(fetchUrl, { headers: { 'User-Agent': UA } }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      }).on('error', () => resolve(null));
    });

    if (body) {
      try {
        const json = JSON.parse(body);
        if (json && !json.error && (json.dlink || json.videoUrl)) {
          return {
            title: json.server_filename || json.title || 'TeraPlay File',
            thumbnail: json.thumbnail || (json.thumbs ? (json.thumbs.url3 || json.thumbs.url1) : 'https://www.terabox.com/static/images/logo/logo-blue.png'),
            videoUrl: json.dlink || json.videoUrl,
            size: json.size ? parseInt(json.size) : null,
            type: (json.category === '1' || (json.server_filename && json.server_filename.match(/\.(mp4|mkv|mov|avi)$/i))) ? 'video' : 'image',
            platform: 'terabox'
          };
        }
      } catch (e) {
        console.warn('⚠️ TeraPlay API parse error');
      }
    }

    // Fallback: Our original direct scraper
    let surl = u.pathname.split('/').pop();
    if (surl.startsWith('1')) surl = surl.substring(1);
    const apiURL = `https://www.terabox.app/share/list?surl=${surl}&root=1`;
    
    const fallbackBody = await new Promise((resolve) => {
      const options = {
        headers: {
          'User-Agent': UA,
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.terabox.app/',
        },
        timeout: 10000
      };
      https.get(apiURL, options, (res) => {
        let resData = '';
        res.on('data', c => resData += c);
        res.on('end', () => resolve(resData));
      }).on('error', () => resolve(null));
    });

    if (fallbackBody) {
      try {
        const fbJson = JSON.parse(fallbackBody);
        if (fbJson.errno === 0 && fbJson.list && fbJson.list.length > 0) {
          const file = fbJson.list[0];
          return {
            title: file.server_filename || 'Terabox File',
            thumbnail: file.thumbs?.url3 || file.thumbs?.url1 || 'https://www.terabox.com/static/images/logo/logo-blue.png',
            videoUrl: file.dlink,
            size: parseInt(file.size),
            type: (file.category === '1' || file.server_filename.match(/\.(mp4|mkv|mov|avi)$/i)) ? 'video' : 'image',
            platform: 'terabox'
          };
        }
      } catch (e) {}
    }
    
    return null;
  } catch (e) {
    console.error(`❌ Terabox Error: ${e.message}`);
    return null;
  }
}

// Minimal yt-dlp info as fallback
function getMinimalInfo(url) {
  const ytDlp = getYtDlpCommand();
  try {
    const title = execSync(`"${ytDlp}" --get-title --no-playlist --user-agent "${UA}" "${url}"`, { timeout: 10000 }).toString().trim();
    const thumb = execSync(`"${ytDlp}" --get-thumbnail --no-playlist --user-agent "${UA}" "${url}"`, { timeout: 10000 }).toString().trim();
    return { title, thumbnail: thumb };
  } catch (e) {
    console.warn(`⚠️ Minimal info error: ${e.message}`);
    return null;
  }
}

// =====================================
// API: ANALYZE URL
// =====================================

app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  if (!isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL format' });

  const platform = detectPlatform(url);
  const ytDlp = getYtDlpCommand();

  console.log(`🔍 Analyzing: ${url} (Platform: ${platform})`);

  try {
    // Quick path for YouTube - instant thumbnail
    if (platform === 'youtube') {
      const videoId = extractYouTubeId(url);
      if (!videoId) return res.status(400).json({ error: 'Could not extract YouTube video ID' });

      // Try to get full info via yt-dlp
      let fullInfo = null;
      try {
        const infoStdout = execSync(
          `"${ytDlp}" -j --no-playlist --no-warnings --user-agent "${UA}" "${url}"`,
          { stdio: ['pipe', 'pipe', 'ignore'], timeout: 20000 }
        ).toString();
        fullInfo = JSON.parse(infoStdout);
      } catch (e) {
        console.warn('yt-dlp info failed for YouTube, using fallback');
      }

      const formats = [];
      if (fullInfo && fullInfo.formats) {
        const seen = new Set();
        for (const f of fullInfo.formats) {
          if (f.vcodec && f.vcodec !== 'none' && f.height) {
            const key = `${f.height}p`;
            if (!seen.has(key)) {
              seen.add(key);
              formats.push({
                quality: key,
                format: f.ext || 'mp4',
                size: formatSize(f.filesize || f.filesize_approx),
                height: f.height,
                formatId: f.format_id
              });
            }
          }
        }
        formats.sort((a, b) => (b.height || 0) - (a.height || 0));
      }

      // Add default formats if yt-dlp didn't return any
      if (formats.length === 0) {
        formats.push(
          { quality: '2160p', format: 'mp4', size: null },
          { quality: '1080p', format: 'mp4', size: null },
          { quality: '720p', format: 'mp4', size: null },
          { quality: '480p', format: 'mp4', size: null },
          { quality: '360p', format: 'mp4', size: null }
        );
      }

      return res.json({
        title: fullInfo?.title || 'YouTube Video',
        thumbnail: fullInfo?.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: fullInfo?.duration_string || formatDuration(fullInfo?.duration) || null,
        platform: 'youtube',
        type: 'video',
        videoId,
        formats,
        audioAvailable: true,
        description: fullInfo?.description?.substring(0, 200) || null,
        uploader: fullInfo?.uploader || fullInfo?.channel || null,
        viewCount: fullInfo?.view_count || null
      });
    }

    // For other platforms, use yt-dlp
    const cleanUrl = url.split('?')[0];

    // Specialized handler for Terabox
    if (platform === 'terabox') {
      const teraInfo = await getTeraboxInfo(url);
      if (teraInfo) {
        return res.json({
          title: teraInfo.title,
          thumbnail: teraInfo.thumbnail,
          proxiedThumbnail: `/api/proxy-image?url=${encodeURIComponent(teraInfo.thumbnail)}`,
          duration: null,
          platform: 'terabox',
          type: teraInfo.type,
          formats: [
            { quality: 'Original (DLink)', format: 'direct', size: formatSize(teraInfo.size) }
          ],
          audioAvailable: teraInfo.type === 'video',
          scrapedVideoUrl: teraInfo.videoUrl // Pass direct dlink
        });
      }
    }

    let info;
    try {
      const infoStdout = execSync(
        `"${ytDlp}" -j --no-playlist --no-warnings --user-agent "${UA}" "${url}"`,
        { stdio: ['pipe', 'pipe', 'ignore'], timeout: 25000 }
      ).toString();
      info = JSON.parse(infoStdout);
    } catch (e) {
      // Fallback for platforms where yt-dlp might not work perfectly
      if (platform === 'instagram' || platform === 'facebook') {
        let meta = await getMetaInfo(url);
        
        // If scrape failed, try minimal yt-dlp
        if (!meta.thumbnail) {
          console.log(`🔍 Scraping failed for ${platform}, trying minimal yt-dlp fallback...`);
          const minimal = getMinimalInfo(url);
          if (minimal) meta = minimal;
        }

        const proxiedThumbnail = meta.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(meta.thumbnail)}` : null;
        const proxiedVideoUrl = meta.videoUrl ? `/api/proxy-video?url=${encodeURIComponent(meta.videoUrl)}` : null;
        
        const formats = [];
        if (meta.type === 'image') {
          formats.push({ quality: 'Original Image', format: 'jpg', size: null });
        } else {
          formats.push({ quality: 'Best', format: 'mp4', size: null });
        }

        return res.json({
          title: meta.title || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Post`,
          platform,
          type: meta.type || detectMediaType(url),
          thumbnail: meta.thumbnail,
          proxiedThumbnail: proxiedThumbnail,
          scrapedVideoUrl: proxiedVideoUrl || meta.videoUrl, // Use proxied video URL
          duration: null,
          formats,
          audioAvailable: meta.type === 'video'
        });
      }

      if (platform === 'tiktok') {
        const meta = await getMetaInfo(url);
        const proxiedThumbnail = meta.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(meta.thumbnail)}` : null;
        
        return res.json({
          title: meta.title || 'TikTok Video',
          platform: 'tiktok',
          type: 'video',
          thumbnail: meta.thumbnail,
          proxiedThumbnail: proxiedThumbnail,
          duration: null,
          formats: [
            { quality: 'Best', format: 'mp4', size: null }
          ],
          audioAvailable: true
        });
      }

      return res.status(400).json({
        error: 'Failed to analyze media. The link might be private or unsupported.',
        platform
      });
    }

    // Build formats array 
    const formats = [];
    if (info.formats) {
      const seen = new Set();
      for (const f of info.formats) {
        if (f.vcodec && f.vcodec !== 'none' && f.height) {
          const key = `${f.height}p`;
          if (!seen.has(key)) {
            seen.add(key);
            formats.push({
              quality: key,
              format: f.ext || 'mp4',
              size: formatSize(f.filesize || f.filesize_approx),
              height: f.height
            });
          }
        }
      }
      formats.sort((a, b) => (b.height || 0) - (a.height || 0));
    }

    if (formats.length === 0) {
      formats.push({ quality: 'Best', format: info.ext || 'mp4', size: formatSize(info.filesize || info.filesize_approx) });
    }

    const thumbnail = info.thumbnail || (info.thumbnails?.length > 0 ? info.thumbnails[info.thumbnails.length - 1].url : null);
    const proxiedThumbnail = (platform === 'instagram' || platform === 'facebook') && thumbnail 
      ? `/api/proxy-image?url=${encodeURIComponent(thumbnail)}` 
      : null;

    res.json({
      title: info.title || 'Untitled Media',
      thumbnail: thumbnail,
      proxiedThumbnail: proxiedThumbnail,
      duration: info.duration_string || formatDuration(info.duration) || null,
      platform,
      type: info.vcodec && info.vcodec !== 'none' ? 'video' : (info.acodec && info.acodec !== 'none' ? 'audio' : detectMediaType(url)),
      formats,
      audioAvailable: !!(info.acodec && info.acodec !== 'none'),
      description: info.description?.substring(0, 200) || null,
      uploader: info.uploader || info.channel || null,
      viewCount: info.view_count || null
    });

  } catch (error) {
    console.error(`❌ Analysis error: ${error.message}`);
    res.status(500).json({ error: 'Server error during analysis' });
  }
});

// Legacy GET support for /api/info
app.get('/api/info', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  // Forward to POST handler
  req.body = { url };
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);
  
  // Re-use the analyze logic
  const platform = detectPlatform(url);
  const ytDlp = getYtDlpCommand();

  try {
    if (platform === 'youtube') {
      const videoId = extractYouTubeId(url);
      return originalJson({
        title: 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        type: 'youtube',
        videoId,
        platform: 'youtube'
      });
    }

    const infoStdout = execSync(
      `"${ytDlp}" -j --no-playlist --no-warnings --user-agent "${UA}" "${url}"`,
      { stdio: ['pipe', 'pipe', 'ignore'], timeout: 20000 }
    ).toString();
    const info = JSON.parse(infoStdout);

    originalJson({
      title: info.title || 'Untitled Media',
      thumbnail: info.thumbnail || (info.thumbnails?.length > 0 ? info.thumbnails[0].url : null),
      type: info.vcodec && info.vcodec !== 'none' ? 'video' : 'photo',
      duration: info.duration_string || null,
      platform
    });
  } catch {
    if (platform === 'instagram') return originalJson({ title: 'Instagram Post', type: 'instagram', platform: 'instagram' });
    originalStatus(400).json({ error: 'Failed to fetch media info' });
  }
});

// =====================================
// NEW: PLAYLIST ENDPOINT
// =====================================
app.post('/api/playlist', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL' });

  try {
    const cmd = getYtDlpCommand();
    const args = [
      '--flat-playlist',
      '--dump-single-json',
      '--no-check-certificates',
      url
    ];

    const child = spawn(cmd, args);
    let output = '';
    child.stdout.on('data', d => output += d);
    child.on('close', (code) => {
      if (code !== 0) return res.status(500).json({ error: 'Failed to fetch playlist' });
      try {
        const json = JSON.parse(output);
        const videos = (json.entries || []).map(v => ({
           id: v.id,
           title: v.title,
           url: `https://www.youtube.com/watch?v=${v.id}`,
           duration: v.duration,
           thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`
        }));
        res.json({
          title: json.title || 'Playlist',
          author: json.uploader || 'Various Artists',
          total: videos.length,
          videos
        });
      } catch (e) {
        res.status(500).json({ error: 'Parsing error' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================
// NEW: AI FEATURES (MOCK LOGIC)
// =====================================
app.post('/api/ai/analyze', async (req, res) => {
  const { url, type } = req.body;
  // Deep AI Analysis Simulation
  const tags = ["#trending", "#viral", "#tech", "#pro", "#media"];
  const summary = "This video provides a comprehensive overview of modern digital media trends, emphasizing high-quality production and user engagement metrics in a globalized tech ecosystem.";
  const captions = [
    { time: "0:01", text: "Welcome to the future of media." },
    { time: "0:05", text: "Today we explore high-fidelity downloading." }
  ];

  setTimeout(() => {
    res.json({ tags, summary, captions });
  }, 1500);
});

// =====================================
// ENDPOINTS
// =====================================

app.post('/api/download', async (req, res) => {
  const { url, format: requestedFormat, quality: requestedQuality } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  if (!isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL' });

  const platform = detectPlatform(url);
  const ytDlp = getYtDlpCommand();
  const wantAudio = requestedFormat === 'mp3' || requestedFormat === 'audio';
  const wantImage = requestedFormat === 'jpg' || requestedFormat === 'image' || requestedFormat === 'png';

  console.log(`📥 Download: ${url} | Quality: ${requestedQuality} | Format: ${requestedFormat}`);

  // Image Download logic
  if (wantImage) {
    try {
      let imageUrl = url;
      if (platform === 'instagram' || platform === 'facebook') {
        const meta = await getMetaInfo(url);
        if (meta.thumbnail) imageUrl = meta.thumbnail;
      }
      
      const filename = `image_${Date.now()}.jpg`;
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const proto = imageUrl.startsWith('https') ? https : http;
      proto.get(imageUrl, { headers: { 'User-Agent': UA } }, (imgRes) => {
        if (imgRes.statusCode >= 300 && imgRes.statusCode < 400 && imgRes.headers.location) {
          return proto.get(imgRes.headers.location, { headers: { 'User-Agent': UA } }, (res2) => {
            res2.pipe(res);
          });
        }
        imgRes.pipe(res);
      }).on('error', (e) => {
        if (!res.headersSent) res.status(500).json({ error: 'Image download failed' });
      });
      return;
    } catch (e) {
      console.error('Image download error:', e.message);
    }
  }

  try {
    // Audio extraction
    if (wantAudio) {
      const filename = `audio_${Date.now()}.mp3`;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const args = [
        '--user-agent', UA,
        '--no-playlist',
        '--no-part',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', '-',
        url
      ];

      const proc = spawn(ytDlp, args);
      proc.stdout.pipe(res);
      req.on('close', () => proc.kill());
      proc.stderr.on('data', (d) => {
        const msg = d.toString();
        if (msg.includes('ERROR')) console.error(`❌ Audio Error: ${msg}`);
      });
      proc.on('error', () => {
        if (!res.headersSent) res.status(500).json({ error: 'Audio extraction failed' });
      });
      return;
    }

    // Video download
    const formatStr = buildFormatString(requestedQuality);

    // Get filename
    let filename = `video_${Date.now()}.mp4`;
    try {
      const infoJson = execSync(
        `"${ytDlp}" -j -f "${formatStr}" --no-playlist --user-agent "${UA}" "${url}"`,
        { stdio: ['pipe', 'pipe', 'ignore'], timeout: 15000 }
      ).toString();
      const info = JSON.parse(infoJson);
      filename = `${(info.title || 'video').replace(/[\\/*?:"<>|]/g, '').substring(0, 100)}.${info.ext || 'mp4'}`;
    } catch {
      // Use default filename
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    const args = [
      '-f', formatStr,
      '--user-agent', UA,
      '--no-playlist',
      '--no-part',
      '--buffer-size', '1M',
      '-o', '-',
      url
    ];

    const proc = spawn(ytDlp, args);
    proc.stdout.pipe(res);
    req.on('close', () => proc.kill());
    proc.stderr.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('ERROR')) console.error(`❌ Download Error: ${msg}`);
    });
    proc.on('error', () => {
      if (!res.headersSent) res.status(500).json({ error: 'Download failed' });
    });

  } catch (error) {
    console.error(`❌ Download error: ${error.message}`);
    if (!res.headersSent) res.status(500).json({ error: 'Download failed, please try again' });
  }
});

// Legacy GET download endpoint
app.get('/download', async (req, res) => {
  const url = req.query.url;
  const quality = req.query.quality || 'best';
  const format = req.query.format || 'mp4';
  
  if (!url || url === 'undefined') {
    console.error('❌ GET Download: Missing or undefined URL');
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  
  // Forward to body for shared logic potentially
  req.body = { url, quality, format };
  
  const platform = detectPlatform(url);
  const ytDlp = getYtDlpCommand();
  const wantAudio = format === 'mp3' || format === 'audio';
  const wantImage = format === 'jpg' || format === 'image' || format === 'png';

  console.log(`📥 GET Download Request: ${url.substring(0, 50)}...`);
  console.log(`   Quality: ${quality} | Format: ${format} | Platform: ${platform}`);

  // Image Download logic for GET
  if (wantImage) {
    try {
      let imageUrl = url;
      if (platform === 'instagram' || platform === 'facebook' || platform === 'terabox') {
        console.log(`   Scraping meta for image: ${platform}`);
        const meta = platform === 'terabox' ? await getTeraboxInfo(url) : await getMetaInfo(url);
        if (meta && meta.thumbnail) imageUrl = meta.thumbnail;
      }
      
      console.log(`   Streaming image from: ${imageUrl.substring(0, 50)}...`);
      const filename = `image_${Date.now()}.jpg`;
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const proto = imageUrl.startsWith('https') ? https : http;
      proto.get(imageUrl, { headers: { 'User-Agent': UA } }, (imgRes) => {
        if (imgRes.statusCode >= 300 && imgRes.statusCode < 400 && imgRes.headers.location) {
          console.log(`   Following redirect for image...`);
          return proto.get(imgRes.headers.location, { headers: { 'User-Agent': UA } }, (res2) => { res2.pipe(res); });
        }
        imgRes.pipe(res);
      }).on('error', (err) => { 
        console.error(`   Image pipe error: ${err.message}`);
        if (!res.headersSent) res.status(500).send('Image download failed'); 
      });
      return;
    } catch (e) {
      console.error(`   Image handler error: ${e.message}`);
    }
  }

  try {
    if (wantAudio) {
      console.log(`   Starting audio extraction for: ${platform}`);
      const filename = `audio_${Date.now()}.mp3`;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      const proc = spawn(ytDlp, ['--user-agent', UA, '--no-playlist', '--no-part', '-x', '--audio-format', 'mp3', '-o', '-', url]);
      proc.stdout.pipe(res);
      req.on('close', () => proc.kill());
      return;
    }

    const formatStr = buildFormatString(quality);
    console.log(`   Using yt-dlp format: ${formatStr}`);

    let filename = `video_${Date.now()}.mp4`;
    try {
      console.log(`   Fetching filename via yt-dlp...`);
      const infoJson = execSync(
        `"${ytDlp}" -j -f "${formatStr}" --no-playlist --user-agent "${UA}" "${url}"`,
        { stdio: ['pipe', 'pipe', 'ignore'], timeout: 15000 }
      ).toString();
      const info = JSON.parse(infoJson);
      filename = `${(info.title || 'video').replace(/[\\/*?:"<>|]/g, '').substring(0, 100)}.${info.ext || 'mp4'}`;
      console.log(`   Confirmed filename: ${filename}`);
    } catch (err) {
      console.log(`   yt-dlp filename extract failed (${err.message}), using fallback logic`);
      // Fallback for Terabox/Instagram if yt-dlp fails
      if (platform === 'terabox' || platform === 'instagram') {
        const meta = platform === 'terabox' ? await getTeraboxInfo(url) : await getMetaInfo(url);
        if (meta && (meta.videoUrl || meta.video)) {
          const directUrl = meta.videoUrl || meta.video;
          console.log(`   Using direct video URL from scraper: ${directUrl.substring(0, 50)}...`);
          res.setHeader('Content-Disposition', `attachment; filename="${(meta.title || 'video').replace(/[^a-zA-Z0-9]/g, '_')}.mp4"`);
          const proto = directUrl.startsWith('https') ? https : http;
          return proto.get(directUrl, { headers: { 'User-Agent': UA, 'Referer': 'https://www.terabox.com/' } }, (v) => v.pipe(res));
        }
      }
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    console.log(`   Spawning yt-dlp download process...`);
    const args = [
      '-f', formatStr,
      '--user-agent', UA,
      '--no-playlist',
      '--no-part',
      '--no-check-certificates',
      '--buffer-size', '1M',
      '-o', '-',
      url
    ];
    
    const proc = spawn(ytDlp, args);
    proc.stdout.pipe(res);
    
    let errorLog = '';
    proc.stderr.on('data', (d) => {
      const msg = d.toString();
      errorLog += msg;
      if (msg.includes('ERROR')) console.error(`❌ yt-dlp Error: ${msg}`);
    });

    proc.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ yt-dlp process exited with code ${code}`);
        console.error(`   Error details: ${errorLog}`);
        if (!res.headersSent) res.status(500).json({ error: 'Download engine failed' });
      } else {
        console.log(`✅ Download process completed successfully (code ${code})`);
      }
    });

    req.on('close', () => {
      if (proc.exitCode === null) {
        console.log('   Client closed connection, killing process.');
        proc.kill();
      }
    });

  } catch (error) {
    console.error(`❌ GET Download fatal error: ${error.message}`);
    if (!res.headersSent) res.status(500).json({ error: 'Download failed' });
  }
});

// =====================================
// API: STREAM PROXY
// =====================================

app.get('/api/stream', async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).send('URL required');

  const ytDlp = getYtDlpCommand();
  const platform = detectPlatform(fileUrl);
  console.log(`🎥 Streaming Request: ${fileUrl} (Platform: ${platform})`);

  res.setHeader('Content-Type', 'video/mp4');

  const args = [
    '--user-agent', UA,
    '--no-playlist',
    '--no-part',
    '--no-check-certificates',
    '--buffer-size', '1M',
    '-f', buildFormatString('best'),
    '-o', '-',
    fileUrl
  ];

  console.log(`   Running: ${ytDlp} ${args.join(' ')}`);

  const proc = spawn(ytDlp, args);
  proc.stdout.pipe(res);
  
  proc.stderr.on('data', (d) => {
    const msg = d.toString();
    if (msg.includes('ERROR')) console.error(`❌ Stream Error: ${msg}`);
  });

  proc.on('close', (code) => {
    console.log(`🎥 Stream process closed with code ${code}`);
  });

  req.on('close', () => {
    if (proc.exitCode === null) {
      proc.kill();
      console.log('🛑 Stream killed by client');
    }
  });
});

// =====================================
// API: VIDEO PROXY (For signed CDN links)
// =====================================

app.get('/api/proxy-video', (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send('URL required');

  console.log(`🎥 Proxying video: ${videoUrl.substring(0, 50)}...`);

  const options = {
    headers: { 
      'User-Agent': UA,
      'Referer': 'https://www.instagram.com/'
    }
  };

  const proto = videoUrl.startsWith('https') ? https : http;
  proto.get(videoUrl, options, (vidRes) => {
    if (vidRes.statusCode >= 300 && vidRes.statusCode < 400 && vidRes.headers.location) {
      return proto.get(vidRes.headers.location, options, (res2) => {
        res.setHeader('Content-Type', 'video/mp4');
        res2.pipe(res);
      });
    }
    
    res.setHeader('Content-Type', 'video/mp4');
    vidRes.pipe(res);
  }).on('error', () => res.status(500).send('Video proxy error'));
});

// =====================================
// API: IMAGE PROXY (Fixes hotlinking)
// =====================================

app.get('/api/proxy-image', (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('URL required');

  console.log(`🖼️ Proxying image: ${imageUrl.substring(0, 50)}...`);

  const options = {
    headers: { 
      'User-Agent': UA, 
      'Referer': 'https://www.instagram.com/',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  };

  const proto = imageUrl.startsWith('https') ? https : http;
  proto.get(imageUrl, options, (imgRes) => {
    // Recursively follow redirects for image/media
    if (imgRes.statusCode >= 300 && imgRes.statusCode < 400 && imgRes.headers.location) {
      console.log(`🔗 Redirecting proxy to: ${imgRes.headers.location}`);
      return proto.get(imgRes.headers.location, options, (res2) => {
        res.setHeader('Content-Type', res2.headers['content-type'] || 'image/jpeg');
        res2.pipe(res);
      }).on('error', () => res.status(500).send('Proxy error'));
    }

    if (imgRes.statusCode !== 200) {
      console.error(`❌ Proxy image failed: ${imgRes.statusCode}`);
      return res.status(imgRes.statusCode).send('Image fetch failed');
    }
    
    res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    imgRes.pipe(res);
  }).on('error', (e) => {
    console.error(`❌ Proxy error: ${e.message}`);
    res.status(500).send('Proxy failure');
  });
});

// =====================================
// API: BATCH ANALYZE
// =====================================

app.post('/api/batch-analyze', async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'URLs array is required' });
  }

  if (urls.length > 10) {
    return res.status(400).json({ error: 'Maximum 10 URLs at a time' });
  }

  const results = [];
  const ytDlp = getYtDlpCommand();

  for (const url of urls) {
    if (!isValidUrl(url)) {
      results.push({ url, error: 'Invalid URL', success: false });
      continue;
    }

    const platform = detectPlatform(url);

    try {
      if (platform === 'youtube') {
        const videoId = extractYouTubeId(url);
        results.push({
          url,
          success: true,
          title: 'YouTube Video',
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          platform: 'youtube',
          type: 'video',
          videoId
        });
        continue;
      }

      const infoStdout = execSync(
        `"${ytDlp}" -j --no-playlist --no-warnings --user-agent "${UA}" "${url}"`,
        { stdio: ['pipe', 'pipe', 'ignore'], timeout: 15000 }
      ).toString();
      const info = JSON.parse(infoStdout);

      results.push({
        url,
        success: true,
        title: info.title || 'Untitled',
        thumbnail: info.thumbnail || null,
        platform,
        type: info.vcodec && info.vcodec !== 'none' ? 'video' : 'other',
        duration: info.duration_string || null
      });
    } catch {
      results.push({ url, success: false, error: 'Failed to analyze', platform });
    }
  }

  res.json({ results });
});

// =====================================
// HEALTH CHECK
// =====================================

app.get('/api/health', (req, res) => {
  const ytDlp = getYtDlpCommand();
  let ytDlpVersion = null;
  try {
    ytDlpVersion = execSync(`"${ytDlp}" --version`, { timeout: 5000 }).toString().trim();
  } catch {}

  let ffmpegAvailable = false;
  try {
    execSync('ffmpeg -version', { stdio: 'ignore', timeout: 5000 });
    ffmpegAvailable = true;
  } catch {}

  res.json({
    status: 'ok',
    ytDlp: ytDlpVersion ? `available (${ytDlpVersion})` : 'not found',
    ffmpeg: ffmpegAvailable ? 'available' : 'not found',
    timestamp: new Date().toISOString()
  });
});

// =====================================
// SERVER INITIALIZATION
// =====================================

function startServer(p) {
  app.listen(p, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║   🚀 Video Image Downloader Pro v2.0    ║');
    console.log(`  ║   → http://localhost:${p}                ║`);
    console.log('  ║   Ready to download!                    ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${p} busy, trying ${p + 1}...`);
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
