// הדבק את ה-API Key שלך במקום המחרוזת שלמטה
const API_KEY = 'AIzaSyBSFaBPrBxBXgOpLxRr6nCP9YRcYv6fB9o';

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.items) {
        displayResults(data.items);
      } else {
        console.error('שגיאה בתשובה מהשרת:', data);
      }
    } catch (error) {
      console.error('שגיאה בטעינת הנתונים:', error);
    }
  }

  function displayResults(videos) {
    const videoGrid = document.getElementById('videoGrid');
    videoGrid.innerHTML = '';

    videos.forEach((item) => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumbnail = item.snippet.thumbnails.medium.url;

      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <img class="thumbnail" src="${thumbnail}" alt="${title}">
        <div class="video-info">
          <div class="video-title">${title}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
      });

      videoGrid.appendChild(card);
    });
  }
});
