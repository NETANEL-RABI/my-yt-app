document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    console.log('מבצע חיפוש עבור:', query);
    // בשלב הבא נחבר לכאן את הקריאה ל-YouTube API
  }
});
