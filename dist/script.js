// =========================================
// VIDEO IMAGE DOWNLOADER PRO - FRONTEND JS
// =========================================

(() => {
  'use strict';

  // ---- API Base ----
  const API_BASE = (window.location.protocol === 'file:')
    ? 'http://localhost:4000'
    : window.location.origin;

  // ---- DOM Elements ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Nav
  const themeToggle = $('#themeToggle');
  const batchModeToggle = $('#batchModeToggle');
  const historyNavBtn = $('#historyNavBtn');

  // Input
  const urlInput = $('#urlInput');
  const pasteBtn = $('#pasteBtn');
  const clearInputBtn = $('#clearInputBtn');
  const analyzeBtn = $('#analyzeBtn');
  const dropZone = $('#dropZone');
  const dropHint = $('#dropHint');
  const detectedPlatform = $('#detectedPlatform');
  const platformName = $('#platformName');

  // Loader
  const loaderSection = $('#loaderSection');
  const loaderText = $('#loaderText');
  const loaderProgress = $('#loaderProgress');

  // Results
  const resultsSection = $('#resultsSection');
  const previewThumbnail = $('#previewThumbnail');
  const previewTitle = $('#previewTitle');
  const previewUploader = $('#previewUploader');
  const previewDescription = $('#previewDescription');
  const badgePlatform = $('#badgePlatform');
  const badgeDuration = $('#badgeDuration');
  const badgeType = $('#badgeType');
  const formatSelect = $('#formatSelect');
  const qualitySelect = $('#qualitySelect');
  const downloadBtn = $('#downloadBtn');
  const closeResultsBtn = $('#closeResultsBtn');
  const qrCodeBtn = $('#qrCodeBtn');
  const copyLinkBtn = $('#copyLinkBtn');
  const playPreviewBtn = $('#playPreviewBtn');

  // Download Progress
  const downloadProgress = $('#downloadProgress');
  const progressText = $('#progressText');
  const progressPercent = $('#progressPercent');
  const progressFill = $('#progressFill');

  // QR Modal
  const qrModal = $('#qrModal');
  const qrCanvas = $('#qrCanvas');
  const closeQrBtn = $('#closeQrBtn');

  // Batch
  const batchSection = $('#batchSection');
  const batchUrls = $('#batchUrls');
  const batchAnalyzeBtn = $('#batchAnalyzeBtn');
  const batchResults = $('#batchResults');
  const closeBatchBtn = $('#closeBatchBtn');

  // History
  const historySection = $('#historySection');
  const historyList = $('#historyList');
  const clearHistoryBtn = $('#clearHistoryBtn');
  const closeHistoryBtn = $('#closeHistoryBtn');

  // Player Modal
  const playerModal = $('#playerModal');
  const modalVideo = $('#modalVideo');
  const modalImage = $('#modalImage');
  const youtubeEmbed = $('#youtubeEmbed');
  const closePlayerModal = $('#closePlayerModal');
  const fullscreenPlayerBtn = $('#fullscreenPlayerBtn');

  // Legal
  const legalModal = $('#legalModal');
  const legalTitle = $('#legalTitle');
  const legalBody = $('#legalBody');
  const closeLegalModal = $('#closeLegalModal');

  // Toast
  const toastContainer = $('#toastContainer');

  // ---- State ----
  let currentMediaData = null;
  let currentUrl = '';

  // ---- Platform Detection ----
  const PLATFORMS = {
    youtube: { name: 'YouTube', color: '#ff0000', icon: 'play-circle' },
    instagram: { name: 'Instagram', color: '#e4405f', icon: 'instagram' },
    tiktok: { name: 'TikTok', color: '#00f2ea', icon: 'music' },
    facebook: { name: 'Facebook', color: '#1877f2', icon: 'facebook' },
    twitter: { name: 'Twitter/X', color: '#1da1f2', icon: 'twitter' },
    reddit: { name: 'Reddit', color: '#ff4500', icon: 'message-circle' },
    vimeo: { name: 'Vimeo', color: '#1ab7ea', icon: 'video' },
    terabox: { name: 'TeraPlay', color: '#00d084', icon: 'play' },
    direct: { name: 'Direct Link', color: '#8b5cf6', icon: 'link' },
    unknown: { name: 'Unknown', color: '#6b7280', icon: 'help-circle' }
  };

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

  function isValidUrl(str) {
    try {
      const url = new URL(str);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  // ---- Toast Notifications ----
  function showToast(message, type = 'info', duration = 4000) {
    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      info: 'info',
      warning: 'alert-triangle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${icons[type]}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    if (window.lucide) lucide.createIcons({ nodes: [toast] });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ---- Theme Toggle ----
  function initTheme() {
    const savedTheme = localStorage.getItem('vdl_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('vdl_theme', next);
    lucide.createIcons();
    showToast(`Switched to ${next} mode`, 'info', 2000);
  });

  // ---- Tab Switching ----
  const tabBtns = $$('.tab-btn');
  const heroTitle = $('.hero-title');
  const heroSubtitle = $('.hero-subtitle');
  const heroBadgeLabel = $('.hero-badge span');
  const teraplayLive = $('#teraplay-live');
  const teraLiveIframe = $('#teraLiveIframe');
  let autoAnalyzeTimeout = null;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update UI active state
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update Hero Text
      if (tab === 'terabox') {
        heroTitle.innerHTML = 'TeraPlay<br><span class="gradient-text">Stream & Download</span>';
        heroSubtitle.textContent = 'Enter any TeraBox or TeraPlay shared link to stream and download files instantly at full speed.';
        heroBadgeLabel.textContent = 'Premium Cloud Player';
        urlInput.placeholder = 'Paste TeraPlay or TeraBox link here...';
        
        // Only show TeraPlay platform tag
        $$('.platform-tag').forEach(tag => {
          tag.style.display = tag.dataset.platform === 'terabox' ? 'flex' : 'none';
        });

        // Show exclusive player area
        teraplayLive.classList.remove('hidden');
        document.body.classList.add('theater-mode');
        
        // Show default website if input is empty
        if (!urlInput.value.trim()) {
          teraLiveIframe.src = 'https://teraplay.in/';
          teraLiveIframe.dataset.lastUrl = 'home';
        }
        
        lucide.createIcons();
      } else {
        heroTitle.innerHTML = 'Video Image<br><span class="gradient-text">Downloader Pro</span>';
        heroSubtitle.textContent = 'Download videos, audio & images from YouTube, Instagram, TikTok & Facebook in any quality.';
        heroBadgeLabel.textContent = 'AI-Powered Media Detection';
        urlInput.placeholder = 'Paste video link here...';
        
        // Show all social media tags except Terabox
        $$('.platform-tag').forEach(tag => {
          tag.style.display = tag.dataset.platform === 'terabox' ? 'none' : 'flex';
        });

        // Hide exclusive player area
        teraplayLive.classList.add('hidden');
        document.body.classList.remove('theater-mode');
        teraLiveIframe.src = '';
      }
      
      // Reset detection
      urlInput.dispatchEvent(new Event('input'));
      lucide.createIcons();
    });
  });

  // Ensure initial view is correct
  const initialTab = $('.tab-btn.active');
  if (initialTab && initialTab.dataset.tab === 'social') {
    $$('.platform-tag').forEach(tag => {
      if (tag.dataset.platform === 'terabox') tag.style.display = 'none';
    });
  }

  // ---- URL Input Events ----
  urlInput.addEventListener('input', () => {
    const value = urlInput.value.trim();
    clearInputBtn.classList.toggle('hidden', !value);
    
    if (value && isValidUrl(value)) {
      const platform = detectPlatform(value);
      const pInfo = PLATFORMS[platform];
      platformName.textContent = pInfo.name;
      detectedPlatform.classList.remove('hidden');

      // TeraPlay Live logic (Exclusive to the tab and platform)
      const currentTab = $('.tab-btn.active').dataset.tab;
      if (platform === 'terabox' && currentTab === 'terabox') {
        teraplayLive.classList.remove('hidden');
        if (teraLiveIframe.dataset.lastUrl !== value) {
          teraLiveIframe.src = `https://teraplay.in/?url=${encodeURIComponent(value)}`;
          teraLiveIframe.dataset.lastUrl = value;
          
          // Auto-trigger analysis for seamless download
          if (autoAnalyzeTimeout) clearTimeout(autoAnalyzeTimeout);
          autoAnalyzeTimeout = setTimeout(() => {
            if (urlInput.value.trim() === value) {
              analyzeUrl(); // Direct call to analysis logic
            }
          }, 1000); // 1s auto-detect
        }
      } else {
        // Only hide if we aren't in the Terabox tab
        if (currentTab !== 'terabox') {
          teraplayLive.classList.add('hidden');
        }
        
        // Always reset to home if not a terabox link while in terabox tab
        if (platform !== 'terabox' && currentTab === 'terabox') {
           teraLiveIframe.src = 'https://teraplay.in/';
           teraLiveIframe.dataset.lastUrl = 'home';
        }
      }

      // Highlight matching platform tag
      $$('.platform-tag').forEach(tag => {
        tag.classList.toggle('active', tag.dataset.platform === platform);
      });
    } else {
      detectedPlatform.classList.add('hidden');
      $$('.platform-tag').forEach(tag => tag.classList.remove('active'));
    }
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text;
        urlInput.dispatchEvent(new Event('input'));
        showToast('URL pasted from clipboard', 'success', 2000);
      }
    } catch {
      showToast('Could not access clipboard', 'warning', 3000);
    }
  });

  clearInputBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlInput.dispatchEvent(new Event('input'));
    hideResults();
    urlInput.focus();
  });

  // ---- Drag & Drop ----
  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
      dropHint.classList.remove('hidden');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
      dropHint.classList.add('hidden');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (text && isValidUrl(text.trim())) {
      urlInput.value = text.trim();
      urlInput.dispatchEvent(new Event('input'));
      showToast('URL dropped successfully!', 'success', 2000);
    } else {
      showToast('Please drop a valid URL', 'warning', 3000);
    }
  });

  // ---- Analyze Media ----
  function showLoader(text = 'Analyzing media...') {
    loaderText.textContent = text;
    loaderProgress.style.width = '0%';
    loaderSection.classList.remove('hidden');
    
    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      loaderProgress.style.width = progress + '%';
      if (progress >= 90) clearInterval(interval);
    }, 300);

    return () => {
      clearInterval(interval);
      loaderProgress.style.width = '100%';
      setTimeout(() => loaderSection.classList.add('hidden'), 300);
    };
  }

  function hideResults() {
    resultsSection.classList.add('hidden');
    currentMediaData = null;
  }

  async function analyzeUrl() {
    const url = urlInput.value.trim();
    if (!url) return showToast('Please paste a URL first', 'warning');
    if (!isValidUrl(url)) return showToast('Invalid URL format', 'error');

    currentUrl = url;
    hideResults();
    const stopLoader = showLoader('Detecting media...');

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      stopLoader();

      if (!response.ok) {
        const errorMsg = data.error || 'Analysis failed';
        if (errorMsg.includes('private')) {
          showToast('🔒 This content is private', 'error');
        } else if (errorMsg.includes('unsupported') || errorMsg.includes('Unsupported')) {
          showToast('⚠️ Unsupported platform', 'warning');
        } else {
          showToast(errorMsg, 'error');
        }
        return;
      }

      currentMediaData = data;
      displayResults(data);
      showToast('Media detected successfully!', 'success', 2500);

      // Auto-scroll to download section for TeraPlay Theater Mode
      const currentTab = $('.tab-btn.active').dataset.tab;
      if (currentTab === 'terabox') {
        setTimeout(() => {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 800);
      }

    } catch (error) {
      stopLoader();
      console.error('Analysis error:', error);
      showToast('Failed to connect to server. Please try again.', 'error');
    }
  }

  function displayResults(data) {
    // Thumbnail - use proxied version for Instagram/Social media to avoid blocks
    const thumbUrl = data.proxiedThumbnail || data.thumbnail;
    if (thumbUrl) {
      previewThumbnail.src = thumbUrl;
      previewThumbnail.style.display = 'block';
    } else {
      previewThumbnail.style.display = 'none';
    }

    // Title
    previewTitle.textContent = data.title || 'Untitled Media';

    // Uploader
    if (data.uploader) {
      previewUploader.textContent = data.uploader;
      previewUploader.classList.remove('hidden');
    } else {
      previewUploader.classList.add('hidden');
    }

    // Description
    if (data.description) {
      previewDescription.textContent = data.description;
      previewDescription.classList.remove('hidden');
    } else {
      previewDescription.classList.add('hidden');
    }

    // Badges
    const platform = PLATFORMS[data.platform] || PLATFORMS.direct;
    badgePlatform.textContent = platform.name;
    badgePlatform.classList.remove('hidden');

    if (data.duration) {
      badgeDuration.textContent = data.duration;
      badgeDuration.classList.remove('hidden');
    } else {
      badgeDuration.classList.add('hidden');
    }

    badgeType.textContent = data.type?.toUpperCase() || 'MEDIA';
    badgeType.classList.remove('hidden');

    // Format selector
    formatSelect.innerHTML = '';
    if (data.type === 'video' || data.type === 'youtube') {
      formatSelect.innerHTML += '<option value="mp4">MP4 (Video)</option>';
    }
    if (data.audioAvailable || data.type === 'video' || data.type === 'youtube') {
      formatSelect.innerHTML += '<option value="mp3">MP3 (Audio Only)</option>';
    }
    if (data.type === 'image') {
      formatSelect.innerHTML += '<option value="image">Image</option>';
    }
    if (formatSelect.options.length === 0) {
      formatSelect.innerHTML = '<option value="mp4">MP4 (Video)</option>';
    }

    // Quality selector
    populateQuality(data.formats || []);

    // Show results
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    lucide.createIcons();
  }

  function populateQuality(formats) {
    qualitySelect.innerHTML = '<option value="best">Best Available</option>';
    const seen = new Set();
    for (const f of formats) {
      const q = f.quality;
      if (q && q !== 'Best' && !seen.has(q)) {
        seen.add(q);
        const sizeInfo = f.size ? ` (≈ ${f.size})` : '';
        qualitySelect.innerHTML += `<option value="${q}">${q}${sizeInfo}</option>`;
      }
    }
  }

  analyzeBtn.addEventListener('click', analyzeUrl);

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') analyzeUrl();
  });

  // ---- Download ----
  downloadBtn.addEventListener('click', async () => {
    const url = currentUrl || urlInput.value.trim();
    if (!url) return showToast('No URL to download', 'warning');

    const format = formatSelect.value;
    const quality = qualitySelect.value;

    // Show progress
    downloadProgress.classList.remove('hidden');
    downloadBtn.disabled = true;
    downloadBtn.querySelector('span').textContent = 'Downloading...';

    // Simulate download progress animation
    progressFill.style.width = '0%';
    progressText.textContent = 'Preparing download...';
    progressPercent.textContent = '0%';

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 10;
      if (prog > 95) prog = 95;
      progressFill.style.width = prog + '%';
      progressPercent.textContent = Math.round(prog) + '%';
      if (prog > 20) progressText.textContent = 'Downloading media...';
      if (prog > 60) progressText.textContent = 'Almost there...';
    }, 500);

    try {
      // Trigger download via GET endpoint (browser handles the file stream)
      const downloadUrl = `${API_BASE}/download?url=${encodeURIComponent(url)}&quality=${quality}&format=${format}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save to history
      addToHistory(url, currentMediaData?.title, currentMediaData?.platform, format, quality);

      // Finish progress after delay
      setTimeout(() => {
        clearInterval(interval);
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';
        progressText.textContent = 'Download started!';
        showToast('🎉 Download started in your browser!', 'success');

        setTimeout(() => {
          downloadProgress.classList.add('hidden');
          downloadBtn.disabled = false;
          downloadBtn.querySelector('span').textContent = 'Download Now';
        }, 2000);
      }, 2500);

    } catch (error) {
      clearInterval(interval);
      downloadProgress.classList.add('hidden');
      downloadBtn.disabled = false;
      downloadBtn.querySelector('span').textContent = 'Download Now';
      showToast('Download failed. Please try again.', 'error');
    }
  });

  // ---- Close Results ----
  closeResultsBtn.addEventListener('click', hideResults);

  // ---- Copy Link ----
  copyLinkBtn.addEventListener('click', () => {
    const url = currentUrl || urlInput.value.trim();
    if (!url) return showToast('No URL to copy', 'warning');

    const format = formatSelect.value;
    const quality = qualitySelect.value;
    const downloadUrl = `${API_BASE}/download?url=${encodeURIComponent(url)}&quality=${quality}&format=${format}`;

    navigator.clipboard.writeText(downloadUrl).then(() => {
      showToast('Download link copied!', 'success', 2500);
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  });

  // ---- QR Code ----
  qrCodeBtn.addEventListener('click', () => {
    const url = currentUrl || urlInput.value.trim();
    if (!url) return showToast('No URL for QR code', 'warning');

    if (typeof QRCode !== 'undefined') {
      // Clear previous QR code
      qrCanvas.innerHTML = '';
      
      try {
        new QRCode(qrCanvas, {
          text: url,
          width: 200,
          height: 200,
          colorDark: '#1a1033',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
        qrModal.classList.remove('hidden');
      } catch (error) {
        showToast('Failed to generate QR code', 'error');
      }
    } else {
      showToast('QR code library not loaded', 'warning');
    }
  });

  closeQrBtn.addEventListener('click', () => qrModal.classList.add('hidden'));
  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) qrModal.classList.add('hidden');
  });

  // ---- Play Preview ----
  playPreviewBtn.addEventListener('click', () => {
    const url = currentUrl || urlInput.value.trim();
    if (!url) return;

    const platform = detectPlatform(url);

    // Hide everything first
    modalVideo.classList.add('hidden');
    modalImage.classList.add('hidden');
    youtubeEmbed.classList.add('hidden');

    if (platform === 'youtube' && currentMediaData?.videoId) {
      youtubeEmbed.src = `https://www.youtube.com/embed/${currentMediaData.videoId}?autoplay=1&rel=0&modestbranding=1`;
      youtubeEmbed.classList.remove('hidden');
      modalVideo.pause();
      modalVideo.src = '';
    } else if (platform === 'terabox') {
      // Use TeraPlay as the official player for TeraBox content in modal
      const teraUrl = currentUrl || urlInput.value.trim();
      youtubeEmbed.src = `https://teraplay.in/?url=${encodeURIComponent(teraUrl)}`;
      youtubeEmbed.classList.remove('hidden');
      modalVideo.pause();
      modalVideo.src = '';
    } else if (currentMediaData?.type === 'image') {
      const thumb = currentMediaData.proxiedThumbnail || currentMediaData.thumbnail;
      modalImage.src = thumb;
      modalImage.classList.remove('hidden');
      modalVideo.pause();
      modalVideo.src = '';
    } else {
      // Use scraped video URL if available (faster/direct), otherwise server proxy
      let streamUrl = currentMediaData?.scrapedVideoUrl || `${API_BASE}/api/stream?url=${encodeURIComponent(url)}`;
      
      // If it's a relative path starting with /api, prefix with API_BASE
      if (streamUrl && typeof streamUrl === 'string' && streamUrl.startsWith('/api/')) {
        streamUrl = `${API_BASE}${streamUrl}`;
      }
      
      console.log('🎥 Playing stream:', streamUrl);
      modalVideo.src = streamUrl;
      modalVideo.classList.remove('hidden');
      modalVideo.load();
      modalVideo.play().catch(e => console.warn('Autoplay blocked:', e));
    }

    playerModal.classList.remove('hidden');
    lucide.createIcons();
  });

  closePlayerModal.addEventListener('click', () => {
    playerModal.classList.add('hidden');
    modalVideo.pause();
    modalVideo.src = '';
    modalImage.src = '';
    youtubeEmbed.src = '';
    youtubeEmbed.classList.add('hidden');
  });

  fullscreenPlayerBtn.addEventListener('click', () => {
    if (!youtubeEmbed.classList.contains('hidden')) {
      youtubeEmbed.requestFullscreen?.();
    } else {
      modalVideo.requestFullscreen?.();
    }
  });

  playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) {
      closePlayerModal.click();
    }
  });

  // ---- Batch Mode ----
  let batchVisible = false;

  batchModeToggle.addEventListener('click', () => {
    batchVisible = !batchVisible;
    batchSection.classList.toggle('hidden', !batchVisible);
    historySection.classList.add('hidden');
    if (batchVisible) batchUrls.focus();
  });

  closeBatchBtn.addEventListener('click', () => {
    batchVisible = false;
    batchSection.classList.add('hidden');
  });

  batchAnalyzeBtn.addEventListener('click', async () => {
    const text = batchUrls.value.trim();
    if (!text) return showToast('Paste URLs first', 'warning');

    const urls = text.split('\n').map(u => u.trim()).filter(u => u && isValidUrl(u));
    if (urls.length === 0) return showToast('No valid URLs found', 'error');
    if (urls.length > 10) return showToast('Maximum 10 URLs at a time', 'warning');

    batchResults.innerHTML = '';
    showToast(`Analyzing ${urls.length} URLs...`, 'info');

    try {
      const response = await fetch(`${API_BASE}/api/batch-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });

      const data = await response.json();

      if (data.results) {
        data.results.forEach((item, i) => {
          const el = document.createElement('div');
          el.className = 'batch-item';
          el.style.animationDelay = `${i * 0.1}s`;

          if (item.success) {
            el.innerHTML = `
              <div class="batch-item-info">
                ${item.thumbnail ? `<img src="${item.thumbnail}" class="batch-item-thumb" alt="">` : ''}
                <span class="batch-item-title">${item.title || 'Media'}</span>
              </div>
              <div class="batch-item-actions">
                <span class="batch-item-status success">Ready</span>
                <button class="icon-btn batch-download-btn" data-url="${item.url}" title="Download">
                  <i data-lucide="download"></i>
                </button>
              </div>
            `;
          } else {
            el.innerHTML = `
              <div class="batch-item-info">
                <span class="batch-item-title">${item.url}</span>
              </div>
              <span class="batch-item-status error">${item.error || 'Failed'}</span>
            `;
          }

          batchResults.appendChild(el);
        });

        lucide.createIcons();

        // Add click handlers for batch download buttons
        batchResults.querySelectorAll('.batch-download-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const url = btn.dataset.url;
            const downloadUrl = `${API_BASE}/download?url=${encodeURIComponent(url)}&quality=best&format=mp4`;
            window.open(downloadUrl, '_blank');
            addToHistory(url, null, detectPlatform(url), 'mp4', 'best');
            showToast('Download started!', 'success', 2000);
          });
        });

        showToast(`Analysis complete! ${data.results.filter(r => r.success).length}/${data.results.length} ready`, 'success');
      }

    } catch (error) {
      showToast('Batch analysis failed', 'error');
    }
  });

  // ---- Download History ----
  function addToHistory(url, title, platform, format, quality) {
    const history = JSON.parse(localStorage.getItem('vdl_history') || '[]');
    
    // Don't add duplicates
    if (history.length > 0 && history[0].url === url) return;
    
    history.unshift({
      url,
      title: title || 'Unknown',
      platform: platform || 'direct',
      format: format || 'mp4',
      quality: quality || 'best',
      timestamp: new Date().toISOString(),
      id: Date.now()
    });

    // Keep last 10
    localStorage.setItem('vdl_history', JSON.stringify(history.slice(0, 10)));
  }

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem('vdl_history') || '[]');

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          <i data-lucide="inbox"></i>
          <p>No downloads yet</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    historyList.innerHTML = history.map(item => {
      const pInfo = PLATFORMS[item.platform] || PLATFORMS.direct;
      const time = new Date(item.timestamp).toLocaleString();
      return `
        <div class="history-item">
          <div class="history-item-content">
            <div class="history-item-url" title="${item.url}">${item.title || item.url}</div>
            <div class="history-item-meta">
              <span>${pInfo.name}</span>
              <span>•</span>
              <span>${item.format?.toUpperCase() || 'MP4'}</span>
              <span>•</span>
              <span>${time}</span>
            </div>
          </div>
          <div class="history-item-actions">
            <button class="history-action-btn" data-action="copy" data-url="${item.url}" title="Copy URL">
              <i data-lucide="copy"></i>
            </button>
            <button class="history-action-btn" data-action="reuse" data-url="${item.url}" title="Use this URL">
              <i data-lucide="redo"></i>
            </button>
            <button class="history-action-btn" data-action="download" data-url="${item.url}" title="Download again">
              <i data-lucide="download"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();

    // Event delegation for history actions
    historyList.querySelectorAll('.history-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const url = btn.dataset.url;

        if (action === 'copy') {
          navigator.clipboard.writeText(url).then(() => showToast('URL copied!', 'success', 2000));
        } else if (action === 'reuse') {
          urlInput.value = url;
          urlInput.dispatchEvent(new Event('input'));
          historySection.classList.add('hidden');
          showToast('URL loaded', 'info', 2000);
        } else if (action === 'download') {
          window.open(`${API_BASE}/download?url=${encodeURIComponent(url)}&quality=best&format=mp4`, '_blank');
          showToast('Download started!', 'success', 2000);
        }
      });
    });
  }

  historyNavBtn.addEventListener('click', () => {
    const isVisible = !historySection.classList.contains('hidden');
    historySection.classList.toggle('hidden');
    batchSection.classList.add('hidden');
    batchVisible = false;
    if (!isVisible) renderHistory();
  });

  closeHistoryBtn.addEventListener('click', () => {
    historySection.classList.add('hidden');
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all download history?')) {
      localStorage.removeItem('vdl_history');
      renderHistory();
      showToast('History cleared', 'info', 2000);
    }
  });

  // ---- Legal Modals ----
  const LEGAL_CONTENT = {
    disclaimer: {
      title: '⚖️ Disclaimer',
      body: `
        <h4>Educational Use Only</h4>
        <p>Video Image Downloader Pro is provided strictly for educational and personal use. This tool is intended to help users learn about web technologies, streaming protocols, and media processing.</p>
        <h4>User Responsibility</h4>
        <p>Users are solely responsible for ensuring that their use of this tool complies with applicable laws, regulations, and the terms of service of the platforms from which they download content.</p>
        <h4>Copyright</h4>
        <p>Downloading copyrighted material without permission from the copyright holder may violate copyright laws. We do not encourage or condone the downloading of copyrighted content without proper authorization.</p>
        <h4>No Warranty</h4>
        <p>This software is provided "as is" without warranty of any kind. The developers are not responsible for any damages or legal issues arising from the use of this tool.</p>
      `
    },
    privacy: {
      title: '🔒 Privacy Policy',
      body: `
        <h4>Data Collection</h4>
        <p>Video Image Downloader Pro does not collect, store, or transmit any personal data. All operations are performed locally or through direct API calls to media platforms.</p>
        <h4>Local Storage</h4>
        <p>Your download history and preferences are stored locally in your browser using localStorage. This data never leaves your device and can be cleared at any time.</p>
        <h4>Third-Party Services</h4>
        <p>This application interacts with third-party media platforms (YouTube, Instagram, TikTok, Facebook) through their public APIs. Please refer to their respective privacy policies for information about how they handle your data.</p>
        <h4>Cookies</h4>
        <p>This application does not use cookies for tracking purposes.</p>
      `
    },
    terms: {
      title: '📋 Terms of Service',
      body: `
        <h4>Acceptance of Terms</h4>
        <p>By using Video Image Downloader Pro, you agree to these terms of service. If you do not agree with any part of these terms, please do not use this application.</p>
        <h4>Permitted Use</h4>
        <p>This tool is intended for downloading content that you have the right to download, such as your own content, content in the public domain, or content with appropriate licensing.</p>
        <h4>Prohibited Activities</h4>
        <p>You may not use this tool to: download copyrighted content without permission, violate the terms of service of any platform, engage in any illegal activity, or distribute downloaded content without proper authorization.</p>
        <h4>Limitation of Liability</h4>
        <p>The developers of Video Image Downloader Pro shall not be held liable for any claim, damages, or other liability arising from the use of this tool.</p>
      `
    }
  };

  $('#disclaimerLink')?.addEventListener('click', (e) => { e.preventDefault(); showLegal('disclaimer'); });
  $('#privacyLink')?.addEventListener('click', (e) => { e.preventDefault(); showLegal('privacy'); });
  $('#termsLink')?.addEventListener('click', (e) => { e.preventDefault(); showLegal('terms'); });

  function showLegal(type) {
    const content = LEGAL_CONTENT[type];
    if (!content) return;
    legalTitle.innerHTML = `<i data-lucide="shield"></i> ${content.title}`;
    legalBody.innerHTML = content.body;
    legalModal.classList.remove('hidden');
    lucide.createIcons();
  }

  closeLegalModal.addEventListener('click', () => legalModal.classList.add('hidden'));
  legalModal.addEventListener('click', (e) => {
    if (e.target === legalModal) legalModal.classList.add('hidden');
  });

  // ---- Keyboard Shortcuts ----
  document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
      qrModal.classList.add('hidden');
      playerModal.classList.add('hidden');
      legalModal.classList.add('hidden');
      modalVideo.pause();
      modalVideo.src = '';
      youtubeEmbed.src = '';
    }

    // Ctrl+V auto-focus input
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && document.activeElement !== urlInput && document.activeElement !== batchUrls) {
      urlInput.focus();
    }
  });

  // ---- Format Change Handler ----
  formatSelect.addEventListener('change', () => {
    const format = formatSelect.value;
    if (format === 'mp3') {
      qualitySelect.innerHTML = '<option value="best">Best Quality</option>';
      qualitySelect.disabled = true;
    } else {
      qualitySelect.disabled = false;
      if (currentMediaData) {
        populateQuality(currentMediaData.formats || []);
      }
    }
  });

  // ---- Initialize ----
  initTheme();
  urlInput.focus();

  // Auto-analyze on paste
  urlInput.addEventListener('paste', () => {
    setTimeout(() => {
      const val = urlInput.value.trim();
      if (val && isValidUrl(val)) {
        setTimeout(analyzeUrl, 300);
      }
    }, 100);
  });

})();
