document.addEventListener('DOMContentLoaded', () => {
  const goBackBtn = document.getElementById('goBackBtn');
  
  if (goBackBtn) {
    goBackBtn.addEventListener('click', () => {
      window.location.href = 'frontpage.html';
    });
  }
});

document.getElementById('viewResultsBtn').addEventListener('click', function(){
  // Navigate to result page
  window.location.href = 'result.html';
});
