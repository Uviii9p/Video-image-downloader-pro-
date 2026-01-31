// =====================================
// GLOBAL STATE
// =====================================
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const streamBtn = document.getElementById('streamBtn');
const playBtn = document.getElementById('playBtn');
const refreshBtn = document.getElementById('refreshBtn');
const historyBtn = document.getElementById('historyBtn');
const statusMessage = document.getElementById('statusMessage');

// Preview Elements
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const videoPreview = document.getElementById('videoPreview');
const fullscreenPreviewBtn = document.getElementById('fullscreenPreviewBtn');
const closePreviewBtn = document.getElementById('closePreviewBtn');

// Modals
const videoModal = document.getElementById('videoModal');
const modalVideo = document.getElementById('modalVideo');
const closeModal = document.getElementById('closeModal');
const fullscreenVideoBtn = document.getElementById('fullscreenVideoBtn');

const streamModal = document.getElementById('streamModal');
const youtubePlayer = document.getElementById('youtubePlayer');
const closeStreamModal = document.getElementById('closeStreamModal');
const fullscreenStreamBtn = document.getElementById('fullscreenStreamBtn');

const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.getElementById('closeHistoryModal');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const qualitySelect = document.getElementById('qualitySelect');

let currentVideoUrl = null;
let currentStreamType = null;

// API base: when the page is opened via file://, the origin is not the server.
// In that case, assume a local server is running on port 4000.
const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:4000' : window.location.origin;

// =====================================
// HELPER FUNCTIONS
// =====================================

function showMessage(text, type) {
  statusMessage.className = 'message ' + type;
  statusMessage.textContent = text;
  statusMessage.classList.remove('hidden');
  if (type === 'success') setTimeout(hideMessage, 5000);
}

function hideMessage() {
  statusMessage.classList.add('hidden');
}

function hideAllPreviews() {
  imagePreview.classList.add('hidden');
  videoPreview.classList.add('hidden');
  fullscreenPreviewBtn.classList.add('hidden');
  previewContainer.classList.add('hidden');
  hidePlayButton();
  hideStreamButton();
}

function showPlayButton() { playBtn.classList.remove('hidden'); }
function hidePlayButton() { playBtn.classList.add('hidden'); }
function showStreamButton() { streamBtn.classList.remove('hidden'); }
function hideStreamButton() { streamBtn.classList.add('hidden'); }

function addToHistory(url) {
  const history = JSON.parse(localStorage.getItem('download_history') || '[]');
  if (history.length > 0 && history[0].url === url) return;
  history.unshift({ url, timestamp: new Date().toLocaleString(), id: Date.now() });
  localStorage.setItem('download_history', JSON.stringify(history.slice(0, 50)));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('download_history') || '[]');
  if (history.length === 0) {
    historyList.innerHTML = `<div class="history-item-empty">No download history yet</div>`;
    clearHistoryBtn.classList.add('hidden');
    return;
  }
  clearHistoryBtn.classList.remove('hidden');
  historyList.innerHTML = history.map(item => `
    <div class="history-item glass-card">
      <div class="history-item-content">
        <div class="history-item-url" title="${item.url}">${item.url}</div>
        <div class="history-item-meta">${item.timestamp}</div>
      </div>
      <div class="history-item-actions">
        <button class="history-action-btn" onclick="copyToClipboard('${item.url}')"><i data-lucide="copy"></i></button>
        <button class="history-action-btn" onclick="quickLoad('${item.url}')"><i data-lucide="external-link"></i></button>
      </div>
    </div>
  `).join('');
  if (window.lucide) window.lucide.createIcons();
}

window.copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => alert('URL copied!'));
};

window.quickLoad = (url) => {
  urlInput.value = url;
  urlInput.dispatchEvent(new Event('input')); // Trigger analysis
  historyModal.classList.add('hidden');
};

function isYouTubeUrl(url) {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function isInstagramUrl(url) {
  return url.includes('instagram.com');
}

function isVideoUrl(url) {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
}

function getYouTubeThumbnail(url) {
  let videoId = '';
  if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
  else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
}

// =====================================
// EVENT LISTENERS
// =====================================

function analyzeUrl(url) {
  if (!url) return hideAllPreviews();
  try { new URL(url); } catch (e) { return hideAllPreviews(); }

  showMessage('🔍 Analyzing Media...', 'info');

  // Instant Placeholder for YT
  if (isYouTubeUrl(url)) {
    const thumb = getYouTubeThumbnail(url);
    if (thumb) {
      imagePreview.src = thumb;
      imagePreview.classList.remove('hidden');
      previewContainer.classList.remove('hidden');
    }
  }

  fetch(`${API_BASE}/api/info?url=${encodeURIComponent(url)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);

      // UI Update
      if (data.type === 'youtube') {
        currentStreamType = 'youtube';
        showStreamButton();
        hidePlayButton();
        imagePreview.src = data.thumbnail;
        imagePreview.classList.remove('hidden');
        videoPreview.classList.add('hidden');
      } else if (data.type === 'video' || isInstagramUrl(url)) {
        currentVideoUrl = url;
        showPlayButton();
        hideStreamButton();
        if (data.thumbnail) {
          imagePreview.src = data.thumbnail;
          imagePreview.classList.remove('hidden');
        }
      }

      previewContainer.classList.remove('hidden');
      fullscreenPreviewBtn.classList.remove('hidden');
      hideMessage();
    })
    .catch(err => {
      console.error(err);
      hideMessage();
      if (isInstagramUrl(url)) showMessage('📸 Instagram link ready for download.', 'info');
    });
}

urlInput.addEventListener('input', function () {
  const url = urlInput.value.trim();
  analyzeUrl(url);
});

// STREAMING ACTIONS
playBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!url) return;

  showMessage('📽️ Preparing Instant Stream...', 'info');

  // Use the Secure Stream Proxy
  const streamProxy = `${API_BASE}/api/stream?url=${encodeURIComponent(url)}`;
  modalVideo.src = streamProxy;
  videoModal.classList.remove('hidden');

  modalVideo.play().then(() => {
    hideMessage();
  }).catch(e => {
    console.warn("Direct stream failed, trying raw URL if applicable");
    if (currentVideoUrl) {
      modalVideo.src = currentVideoUrl;
      modalVideo.play().then(() => hideMessage());
    } else {
      showMessage('Error starting stream. Link may be protected.', 'error');
    }
  });
});

streamBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  let videoId = '';

  // Robust YT ID Extraction
  try {
    const urlObj = new URL(url);
    if (url.includes('youtu.be/')) videoId = urlObj.pathname.substring(1).split('?')[0];
    else if (url.includes('v=')) videoId = urlObj.searchParams.get('v');
    else if (url.includes('shorts/')) videoId = urlObj.pathname.split('shorts/')[1].split('?')[0];
  } catch (e) {
    // Fallback if URL object fails
    if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
  }

  if (videoId) {
    showMessage('📡 Initializing Live Stream...', 'info');
    youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    youtubePlayer.classList.remove('hidden');
    streamModal.classList.remove('hidden');

    // Force a minor delay to ensure DOM is ready then hide message
    setTimeout(hideMessage, 1500);
  } else {
    showMessage('Could not extract Video ID', 'error');
  }
});

downloadBtn.addEventListener('click', function () {
  const url = urlInput.value.trim();
  if (!url) return showMessage('Please paste a URL first.', 'error');

  showMessage('⚡ Processing download...', 'info');
  downloadBtn.disabled = true;
  downloadBtn.querySelector('span').textContent = 'Downloading...';

  const downloadUrl = `${API_BASE}/download?url=${encodeURIComponent(url)}&quality=${qualitySelect.value}`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  addToHistory(url);

  setTimeout(() => {
    downloadBtn.disabled = false;
    downloadBtn.querySelector('span').textContent = 'Download Media';
    showMessage('🎉 Download process started!', 'success');
  }, 2000);
});

closeModal.addEventListener('click', () => {
  videoModal.classList.add('hidden');
  modalVideo.pause();
  modalVideo.src = '';
  modalVideo.load();
});

closeStreamModal.addEventListener('click', () => {
  streamModal.classList.add('hidden');
  youtubePlayer.src = '';
  youtubePlayer.classList.add('hidden'); // Fix: Hide iframe on close
});

refreshBtn.addEventListener('click', () => {
  urlInput.value = '';
  hideAllPreviews();
  hideMessage();
  urlInput.focus();
});

closePreviewBtn.addEventListener('click', () => {
  urlInput.value = '';
  hideAllPreviews();
});

function toggleFullscreen(element) {
  if (!document.fullscreenElement) element.requestFullscreen();
  else document.exitFullscreen();
}

fullscreenPreviewBtn.addEventListener('click', () => {
  if (!imagePreview.classList.contains('hidden')) toggleFullscreen(imagePreview);
  else if (!videoPreview.classList.contains('hidden')) toggleFullscreen(videoPreview);
});

fullscreenVideoBtn.addEventListener('click', () => toggleFullscreen(modalVideo));
fullscreenStreamBtn.addEventListener('click', () => toggleFullscreen(youtubePlayer));

// =====================================
// HISTORY MODAL EVENTS
// =====================================

historyBtn.addEventListener('click', () => {
  renderHistory();
  historyModal.classList.remove('hidden');
});

closeHistoryModal.addEventListener('click', () => historyModal.classList.add('hidden'));

clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Clear history?')) {
    localStorage.removeItem('download_history');
    renderHistory();
  }
});
