(function(){
  const resultsList = document.getElementById('resultsList');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!resultsList) return;

  // fetch voting results from localStorage (set by admin)
  const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
  const votes = JSON.parse(localStorage.getItem('votes') || '{}');

  // color palette for candidate dots
  const colors = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  // render results
  function renderResults(){
    resultsList.innerHTML = '';

    if (candidates.length === 0){
      resultsList.innerHTML = '<p style="color:#6b7280">No candidates available.</p>';
      return;
    }

    const total = candidates.reduce((sum, c) => sum + (votes[c] || 0), 0);

    candidates.forEach((candidate, idx) => {
      const voteCount = votes[candidate] || 0;
      const percent = total ? Math.round((voteCount / total) * 100) : 0;
      const color = colors[idx % colors.length];

      const row = document.createElement('div');
      row.className = 'result-row';
      row.innerHTML = `
        <div class="dot" style="background:${color}"></div>
        <div class="content">
          <p class="label">${escapeHtml(candidate)}</p>
          <div class="bar-bg">
            <div class="bar" style="width:${percent}%;background:linear-gradient(90deg,${color},${adjustBrightness(color, 1.2)})"></div>
          </div>
        </div>
        <div class="result-meta">${percent}%</div>
      `;
      resultsList.appendChild(row);
    });
  }

  // logout
  logoutBtn?.addEventListener('click', () => {
    window.location.href = 'login.html';
  });

  // helper: escape HTML
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#39;"
    }[m]));
  }

  // helper: adjust color brightness
  function adjustBrightness(hex, factor){
    const num = parseInt(hex.replace('#',''), 16);
    const r = Math.min(255, Math.round((num >> 16) * factor));
    const g = Math.min(255, Math.round(((num >> 8) & 0x00FF) * factor));
    const b = Math.min(255, Math.round((num & 0x0000FF) * factor));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // initial render
  renderResults();

  // auto-refresh every 2 seconds
  setInterval(renderResults, 2000);
})();