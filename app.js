const API_KEY = 'AIzaSyBSFaBPrBxBXgOpLxRr6nCP9YRcYv6fB9o';

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const videoGrid = document.getElementById('videoGrid');
  const sectionTitle = document.getElementById('sectionTitle');

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

  // רכיבי נגן פנימי
  const videoModal = document.getElementById('videoModal');
  const youtubeIframe = document.getElementById('youtubeIframe');
  const closeVideoModal = document.getElementById('closeVideoModal');

  // רכיבי מצב לילה
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleIcon = themeToggleBtn.querySelector('.material-icons');

  // רכיבי סינון תגיות
  const filterChips = document.querySelector('.filter-chips');

  // פונקציות טעינה ראשוניות
  initUser();
  initTheme();
  fetchVideos('שירים מומלצים'); // ברירת מחדל

  // --- אירועי ניווט ---
  navHome.addEventListener('click', () => { setTab(navHome); fetchVideos('שירים מומלצים'); });
  navShorts.addEventListener('click', () => { setTab(navShorts); fetchShorts(); });
  navHistory.addEventListener('click', () => { setTab(navHistory); displayList('watchHistory', 'היסטוריית צפייה'); });
  navWatchLater.addEventListener('click', () => { setTab(navWatchLater); displayList('watchLater', 'צפייה מאוחרת'); });

  searchBtn.addEventListener('click', () => fetchVideos(searchInput.value));
  searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchVideos(searchInput.value); });

  // --- אירועי סינון קטגוריות (תגיות) ---
  filterChips.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      fetchVideos(e.target.dataset.query);
    }
  });

  // --- אירועי מצב לילה (Dark Mode) ---
  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-mode')) {
      document.body.classList.replace('dark-mode', 'light-mode');
      themeToggleIcon.textContent = 'dark_mode';
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.replace('light-mode', 'dark-mode');
      themeToggleIcon.textContent = 'light_mode';
      localStorage.setItem('theme', 'dark');
    }
  });

  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(`${savedTheme}-mode`);
    themeToggleIcon.textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';
  }

  // --- אירועי נגן וידאו פנימי ---
  closeVideoModal.addEventListener('click', () => {
    videoModal.style.display = 'none';
    youtubeIframe.src = ''; // עצירת הסרטון בעת הסגירה
  });

  window.addEventListener('click', (e) => {
    if (e.target === videoModal) closeVideoModal.click();
  });

  // --- פונקציות ליבה ---
  async function fetchVideos(query) {
    if (!query || !query.trim()) return;
    sectionTitle.textContent = `תוצאות עבור: ${query}`;
    videoGrid.classList.remove('shorts-mode');
    
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`);
      const data = await res.json();
      if (data.items) renderVideos(data.items);
    } catch (err) { console.error(err); }
  }

  async function fetchShorts() {
    sectionTitle.textContent = 'סרטוני Shorts';
    videoGrid.classList.add('shorts-mode');

    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=shorts&type=video&videoDuration=short&key=${API_KEY}`);
      const data = await res.json();
      if (data.items) renderVideos(data.items);
    } catch (err) { console.error(err); }
  }

  function renderVideos(videos) {
    videoGrid.innerHTML = '';
    videos.forEach((item) => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumbnail = item.snippet.thumbnails.medium.url;

      const isShorts = videoGrid.classList.contains('shorts-mode');
      const isInWatchLater = checkItemExists('watchLater', videoId);

      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="thumbnail-container">
          <img class="thumbnail" src="${thumbnail}" alt="${title}">
          <i class="material-icons watch-later-icon" data-videoid="${videoId}" data-title="${title}" data-thumbnail="${thumbnail}">
            ${isInWatchLater ? 'star' : 'star_border'}
          </h3>
        </div>
        <div class="video-info"><div class="video-title">${title}</div></div>
      `;

      // אירועי לחיצה
      card.addEventListener('click', (e) => {
        // מניעת הפעלת הנגן אם המשתמש לחץ על כפתור הלייק בלבד
        if (e.target.classList.contains('watch-later-icon')) return;

        saveToList('watchHistory', { videoId, title, thumbnail });
        openEmbeddedPlayer(videoId);
      });

      // אירוע לחיצה על לייק/מועדפים
      card.querySelector('.watch-later-icon').addEventListener('click', toggleWatchLater);

      videoGrid.appendChild(card);
    });
  }

  function openEmbeddedPlayer(videoId) {
    youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    videoModal.style.display = 'flex';
  }

  // --- ניהול רשימות (היסטוריה, מועדפים, צפייה מאוחרת) ---
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
    e.stopPropagation(); // מניעת הפעלת הנגן
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

  // --- ניהול משתמשים (הרשמה) ---
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
