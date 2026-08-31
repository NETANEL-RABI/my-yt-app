const API_KEY = 'AIzaSyBSFaBPrBxBXgOpLxRr6nCP9YRcYv6fB9o';

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const videoGrid = document.getElementById('videoGrid');
  const sectionTitle = document.getElementById('sectionTitle');

  // רכיבי התחברות
  const authBtn = document.getElementById('authBtn');
  const authModal = document.getElementById('authModal');
  const closeModal = document.getElementById('closeModal');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const usernameInput = document.getElementById('usernameInput');
  const userGreeting = document.getElementById('userGreeting');

  // רכיבי ניווט
  const navHome = document.getElementById('navHome');
  const navShorts = document.getElementById('navShorts');
  const navHistory = document.getElementById('navHistory');

  initUser();

  // אירועי ניווט
  navHome.addEventListener('click', () => { setTab(navHome); fetchVideos('חדשות טכנולוגיה'); });
  navShorts.addEventListener('click', () => { setTab(navShorts); fetchShorts(); });
  navHistory.addEventListener('click', () => { setTab(navHistory); displayHistory(); });

  searchBtn.addEventListener('click', () => fetchVideos(searchInput.value));
  searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchVideos(searchInput.value); });

  // טעינת ראשונית
  fetchVideos('שירים מומלצים');

  // פונקציות חיפוש וטעינה
  async function fetchVideos(query) {
    if (!query.trim()) return;
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

      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <img class="thumbnail" src="${thumbnail}" alt="${title}">
        <div class="video-info"><div class="video-title">${title}</div></div>
      `;

      card.addEventListener('click', () => {
        saveToHistory({ videoId, title, thumbnail });
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
      });

      videoGrid.appendChild(card);
    });
  }

  // ניהול היסטוריה
  function saveToHistory(video) {
    let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    history = [video, ...history.filter(item => item.videoId !== video.videoId)];
    localStorage.setItem('watchHistory', JSON.stringify(history));
  }

  function displayHistory() {
    sectionTitle.textContent = 'היסטוריית צפייה';
    videoGrid.classList.remove('shorts-mode');
    const history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    
    if (history.length === 0) {
      videoGrid.innerHTML = '<p>אין עדיין סרטונים בהיסטוריה.</p>';
      return;
    }

    const items = history.map(item => ({
      id: { videoId: item.videoId },
      snippet: { title: item.title, thumbnails: { medium: { url: item.thumbnail } } }
    }));

    renderVideos(items);
  }

  // ניהול משתמשים
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

  closeModal.addEventListener('click', () => authModal.style.display = 'none');

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
