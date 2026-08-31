const API_KEY = 'AIzaSyBSFaBPrBxBXgOpLxRr6nCP9YRcYv6fB9o';

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const voiceSearchBtn = document.getElementById('voiceSearchBtn');
  const videoGrid = document.getElementById('videoGrid');
  const sectionTitle = document.getElementById('sectionTitle');
  const loadingIndicator = document.getElementById('loadingIndicator');

  // רכיבי התחברות
  const authBtn = document.getElementById('authBtn');
  const authModal = document.getElementById('authModal');
  const closeAuthModal = document.getElementById('closeAuthModal');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const usernameInput = document.getElementById('usernameInput');
  const userGreeting = document.getElementById('userGreeting');

  // רכיבי ניווט
  const navHome = document.getElementById('navHome');
  const navShorts = document.getElementById('navShorts');
  const navHistory = document.getElementById('navHistory');
  const navWatchLater = document.getElementById('navWatchLater');

  // נגן פנימי ושיתוף
  const videoModal = document.getElementById('videoModal');
  const youtubeIframe = document.getElementById('youtubeIframe');
  const closeVideoModal = document.getElementById('closeVideoModal');
  const shareBtn = document.getElementById('shareBtn');

  // מצב לילה וסינון
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleIcon = themeToggleBtn.querySelector('.material-icons');
  const filterChips = document.querySelector('.filter-chips');

  // משתני ניהול גלילה אינסופית
  let nextPageToken = '';
  let currentQuery = 'טכנולוגיה ומחשבים';
  let isFetching = false;
  let isShortsMode = false;
  let currentPlayingVideoId = '';

  initUser();
  initTheme();
  fetchVideos(currentQuery);

  // --- חיפוש קולי (Voice Search) ---
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';

    voiceSearchBtn.addEventListener('click', () => {
      recognition.start();
      voiceSearchBtn.classList.add('listening');
    });

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      searchInput.value = transcript;
      fetchVideos(transcript);
      voiceSearchBtn.classList.remove('listening');
    };

    recognition.onerror = () => voiceSearchBtn.classList.remove('listening');
    recognition.onend = () => voiceSearchBtn.classList.remove('listening');
  } else {
    voiceSearchBtn.style.display = 'none';
  }

  // --- גלילה אינסופית (Infinite Scroll) ---
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      if (!isFetching && nextPageToken) {
        fetchMoreVideos();
      }
    }
  });

  // --- ניווט וסינון ---
  navHome.addEventListener('click', () => { setTab(navHome); isShortsMode = false; fetchVideos('טכנולוגיה ומחשבים'); });
  navShorts.addEventListener('click', () => { setTab(navShorts); isShortsMode = true; fetchShorts(); });
  navHistory.addEventListener('click', () => { setTab(navHistory); nextPageToken = ''; displayList('watchHistory', 'היסטוריית צפייה'); });
  navWatchLater.addEventListener('click', () => { setTab(navWatchLater); nextPageToken = ''; displayList('watchLater', 'צפייה מאוחרת'); });

  searchBtn.addEventListener('click', () => { isShortsMode = false; fetchVideos(searchInput.value); });
  searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { isShortsMode = false; fetchVideos(searchInput.value); } });

  filterChips.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      isShortsMode = false;
      fetchVideos(e.target.dataset.query);
    }
  });

  // --- טעינת סרטונים מה-API ---
  async function fetchVideos(query) {
    if (!query || !query.trim()) return;
    currentQuery = query;
    nextPageToken = '';
    sectionTitle.textContent = `תוצאות עבור: ${query}`;
    videoGrid.classList.remove('shorts-mode');
    videoGrid.innerHTML = '';

    await loadVideoData(false);
  }

  async function fetchShorts() {
    currentQuery = 'shorts';
    nextPageToken = '';
    sectionTitle.textContent = 'סרטוני Shorts';
    videoGrid.classList.add('shorts-mode');
    videoGrid.innerHTML = '';

    await loadVideoData(true);
  }

  async function fetchMoreVideos() {
    if (!nextPageToken) return;
    await loadVideoData(isShortsMode, true);
  }

  async function loadVideoData(shorts = false, append = false) {
    isFetching = true;
    loadingIndicator.style.display = 'block';

    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(currentQuery)}&type=video&key=${API_KEY}`;
    if (shorts) url += '&videoDuration=short';
    if (nextPageToken) url += `&pageToken=${nextPageToken}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) {
        nextPageToken = data.nextPageToken || '';
        renderVideos(data.items, append);
      }
    } catch (err) {
      console.error(err);
    } finally {
      isFetching = false;
      loadingIndicator.style.display = 'none';
    }
  }

  function renderVideos(videos, append = false) {
    if (!append) videoGrid.innerHTML = '';

    videos.forEach((item) => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumbnail = item.snippet.thumbnails.medium.url;
      const isInWatchLater = checkItemExists('watchLater', videoId);

      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="thumbnail-container">
          <img class="thumbnail" src="${thumbnail}" alt="${title}">
          <i class="material-icons watch-later-icon" data-videoid="${videoId}" data-title="${title}" data-thumbnail="${thumbnail}">
            ${isInWatchLater ? 'star' : 'star_border'}
          </i>
        </div>
        <div class="video-info"><div class="video-title">${title}</div></div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('watch-later-icon')) return;
        saveToList('watchHistory', { videoId, title, thumbnail });
        openEmbeddedPlayer(videoId);
      });

      card.querySelector('.watch-later-icon').addEventListener('click', toggleWatchLater);
      videoGrid.appendChild(card);
    });
  }

  // --- נגן ושיתוף ---
  function openEmbeddedPlayer(videoId) {
    currentPlayingVideoId = videoId;
    youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    videoModal.style.display = 'flex';
  }

  shareBtn.addEventListener('click', () => {
    if (currentPlayingVideoId) {
      const link = `https://www.youtube.com/watch?v=${currentPlayingVideoId}`;
      navigator.clipboard.writeText(link);
      alert('הקישור הועתק ללוח!');
    }
  });

  closeVideoModal.addEventListener('click', () => {
    videoModal.style.display = 'none';
    youtubeIframe.src = '';
  });

  // --- מצב לילה ---
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', !isDark);
    document.body.classList.toggle('light-mode', isDark);
    themeToggleIcon.textContent = isDark ? 'dark_mode' : 'light_mode';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  });

  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(`${savedTheme}-mode`);
    themeToggleIcon.textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';
  }

  // --- ניהול רשימות ומצב משתמש ---
  function saveToList(listName, video) {
    let list = JSON.parse(localStorage.getItem(listName)) || [];
    list = [video, ...list.filter(item => item.videoId !== video.videoId)];
    localStorage.setItem(listName, JSON.stringify(list));
  }

  function checkItemExists(listName, videoId) {
    const list = JSON.parse(localStorage.getItem(listName)) || [];
    return list.some(item => item.videoId === videoId);
  }

  function toggleWatchLater(e) {
    e.stopPropagation();
    const data = e.target.dataset;
    const isAdded = e.target.textContent === 'star';

    if (isAdded) {
      removeFromList('watchLater', data.videoid);
      e.target.textContent = 'star_border';
    } else {
      saveToList('watchLater', { videoId: data.videoid, title: data.title, thumbnail: data.thumbnail });
      e.target.textContent = 'star';
    }
  }

  function removeFromList(listName, videoId) {
    let list = JSON.parse(localStorage.getItem(listName)) || [];
    list = list.filter(item => item.videoId !== videoId);
    localStorage.setItem(listName, JSON.stringify(list));
  }

  function displayList(listName, title) {
    sectionTitle.textContent = title;
    videoGrid.classList.remove('shorts-mode');
    const list = JSON.parse(localStorage.getItem(listName)) || [];
    
    if (list.length === 0) {
      videoGrid.innerHTML = `<p>אין עדיין סרטונים ברשימה הזו.</p>`;
      return;
    }

    const items = list.map(item => ({
      id: { videoId: item.videoId },
      snippet: { title: item.title, thumbnails: { medium: { url: item.thumbnail } } }
    }));

    renderVideos(items);
  }

  function initUser() {
    const user = localStorage.getItem('currentUser');
    if (user) {
      userGreeting.textContent = `שלום, ${user}`;
      authBtn.textContent = 'התנתק';
    }
  }

  authBtn.addEventListener('click', () => {
    if (localStorage.getItem('currentUser')) {
      localStorage.removeItem('currentUser');
      userGreeting.textContent = '';
      authBtn.textContent = 'התחברות';
    } else {
      authModal.style.display = 'flex';
    }
  });

  closeAuthModal.addEventListener('click', () => authModal.style.display = 'none');

  loginSubmitBtn.addEventListener('click', () => {
    const val = usernameInput.value.trim();
    if (val) {
      localStorage.setItem('currentUser', val);
      initUser();
      authModal.style.display = 'none';
    }
  });

  function setTab(activeBtn) {
    document.querySelectorAll('.category-bar button').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
  }
});
