(function () {
  const candidatesRaw = JSON.parse(localStorage.getItem('candidates') || '[]');
  const positions = ['PRESIDENT', 'VICE PRESIDENT', 'SECRETARY', 'TRESURER', 'AUDITOR'];
  
  const tabs = Array.from(document.querySelectorAll('.tabs .tab'));
  const positionTitle = document.getElementById('positionTitle');
  const positionCount = document.getElementById('positionCount');
  const stage = document.getElementById('stageCards');
  const sidePrev = document.getElementById('sidePrev');
  const sideNext = document.getElementById('sideNext');
  const dotContainer = document.getElementById('dotContainer');
  const menuBtn = document.getElementById('menuBtn');
  const menuDropdown = document.getElementById('menuDropdown');
  const logoutBtn = document.getElementById('logoutBtn');

  // Distribute candidates round-robin across positions
  const buckets = positions.map(() => []);
  const normalizedCandidates = candidatesRaw.map(c => {
    if (typeof c === 'string') return c.trim();
    if (c && typeof c === 'object' && c.name) return String(c.name).trim();
    return String(c || '').trim();
  }).filter(Boolean);

  normalizedCandidates.forEach((name, i) => {
    buckets[i % buckets.length].push(name);
  });

  let currentTab = 0;
  let currentCarousel = 0;
  let isAnimating = false;
  let direction = 'right';

  // Normalize name to initial
  function getInitial(name) {
    return (name || '').trim().charAt(0).toUpperCase() || '?';
  }

  // Render carousel with animations
  function renderCarousel() {
    if (isAnimating) return;
    isAnimating = true;

    const position = currentTab;
    const items = buckets[position] || [];

    stage.innerHTML = '';
    dotContainer.innerHTML = '';

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:40px; text-align:center; color:var(--muted); grid-column:1/-1;';
      empty.textContent = 'No candidates available';
      stage.appendChild(empty);
      isAnimating = false;
      return;
    }

    // Create cards
    items.forEach((name, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      
      const offset = (i - currentCarousel + items.length) % items.length;
      
      if (offset === 0) {
        card.classList.add('center');
      } else if (offset === 1) {
        card.classList.add('next');
      } else if (offset === items.length - 1) {
        card.classList.add('prev');
      }

      const initial = getInitial(name);
      
      card.innerHTML = `
        <div class="avatar">
          <div class="avatar-initial">${escapeHtml(initial)}</div>
        </div>
        <p class="name">${escapeHtml(name)}</p>
        <p class="position">${positions[position]}</p>
      `;
      
      stage.appendChild(card);
    });

    // Create dots
    items.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === currentCarousel ? ' active' : '');
      dot.addEventListener('click', () => {
        if (!isAnimating) {
          direction = i > currentCarousel ? 'right' : 'left';
          currentCarousel = i;
          renderCarousel();
        }
      });
      dotContainer.appendChild(dot);
    });

    // Update button states
    sidePrev.disabled = items.length <= 1;
    sideNext.disabled = items.length <= 1;
    positionCount.textContent = `${items.length} candidate${items.length !== 1 ? 's' : ''}`;

    // Animation complete after 700ms
    setTimeout(() => {
      isAnimating = false;
    }, 700);
  }

  // Tab click handler
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      if (!isAnimating) {
        currentTab = i;
        currentCarousel = 0;
        direction = 'right';
        
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        positionTitle.textContent = positions[i];
        renderCarousel();
      }
    });
  });

  // Arrow handlers
  const getItems = () => buckets[currentTab] || [];

  sidePrev.addEventListener('click', () => {
    if (!isAnimating) {
      const items = getItems();
      if (items.length > 0) {
        direction = 'left';
        currentCarousel = (currentCarousel - 1 + items.length) % items.length;
        renderCarousel();
      }
    }
  });

  sideNext.addEventListener('click', () => {
    if (!isAnimating) {
      const items = getItems();
      if (items.length > 0) {
        direction = 'right';
        currentCarousel = (currentCarousel + 1) % items.length;
        renderCarousel();
      }
    }
  });

  // Menu handlers
  menuBtn.addEventListener('click', () => {
    menuDropdown.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-wrapper')) {
      menuDropdown.classList.remove('active');
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('userSession');
    window.location.href = 'Login.html';
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Init
  renderCarousel();
})();