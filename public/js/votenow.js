(function () {
  const ballot = document.getElementById('ballot');
  const positions = ['PRESIDENT', 'VICE PRESIDENT', 'SECRETARY', 'TRESURER', 'AUDITOR'];
  // input name keys (used in form & storage). keep them single-word keys.
  const positionNames = ['president', 'vicepresident', 'secretary', 'tresurer', 'auditor'];
  let currentSection = 0;
  let isTransitioning = false;

  // Get candidates from localStorage (set from candidates.html)
  function getCandidatesByPosition(pos) {
    const all = JSON.parse(localStorage.getItem('candidates') || '[]');
    
    // Distribute candidates round-robin across positions (same as candidates.html)
    const buckets = positions.map(() => []);
    
    const normalizedCandidates = all.map(c => {
      if (typeof c === 'string') return c.trim();
      if (c && typeof c === 'object' && c.name) return String(c.name).trim();
      return String(c || '').trim();
    }).filter(Boolean);

    normalizedCandidates.forEach((name, i) => {
      buckets[i % buckets.length].push(name);
    });

    return buckets[pos] || [];
  }

  // Get initial from name
  function getInitial(name) {
    return (name || '').trim().charAt(0).toUpperCase() || '?';
  }

  // Escape HTML
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Render sections with candidates
  function renderBallot() {
    ballot.innerHTML = '';
    
    positions.forEach((position, posIndex) => {
      const candidates = getCandidatesByPosition(posIndex);
      const fieldName = positionNames[posIndex];

      const section = document.createElement('section');
      section.className = posIndex === 0 ? 'section' : 'section hidden';
      section.id = `section-${posIndex}`;
      section.dataset.index = posIndex;

      let html = `
        <div class="chip">${position}</div>
        <div class="candidates">
      `;

      if (candidates.length === 0) {
        html += '<p style="text-align: center; color: var(--muted); grid-column: 1/-1; padding: 40px 20px;">No candidates available for this position</p>';
      } else {
        candidates.forEach((name, i) => {
          const initial = getInitial(name);
          html += `
            <label class="card">
              <input type="radio" name="${fieldName}" value="${escapeHtml(name)}" required>
              <div>
                <div class="avatar">${escapeHtml(initial)}</div>
                <p class="name">${escapeHtml(name)}</p>
              </div>
              <div class="radio-wrap">
                <input type="radio" disabled>
              </div>
            </label>
          `;
        });
      }

      html += `
        </div>
        <div class="controls">
          <div>
            <button type="button" class="btn" data-action="prev" ${posIndex === 0 ? 'disabled' : ''}>← PREVIOUS</button>
          </div>
          <div>
            <button type="button" class="btn primary" data-action="next" ${posIndex === positions.length - 1 ? 'style="display: none;"' : ''}>NEXT →</button>
            <button type="submit" class="btn primary" ${posIndex === positions.length - 1 ? '' : 'style="display: none;"'}>SUBMIT VOTE</button>
          </div>
        </div>
      `;

      section.innerHTML = html;
      ballot.appendChild(section);
    });

    // Re-attach event listeners
    attachEventListeners();
  }

  function attachEventListeners() {
    // Handle button clicks
    document.querySelectorAll('button[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const action = button.dataset.action;
        if (action === 'prev' && currentSection > 0) {
          switchSection(currentSection - 1, 'prev');
        } else if (action === 'next' && currentSection < positions.length - 1) {
          switchSection(currentSection + 1, 'next');
        }
      });
    });

    // Handle form submission
    ballot.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate all sections
      let allValid = true;
      document.querySelectorAll('.section').forEach(section => {
        const inputs = section.querySelectorAll('input[type="radio"]');
        const isChecked = Array.from(inputs).some(input => input.checked);
        if (!isChecked) {
          allValid = false;
        }
      });

      if (!allValid) {
        alert('Please select a candidate for each position');
        return;
      }

      // Get form data
      const formData = new FormData(ballot);
      const votes = {};
      
      positionNames.forEach(name => {
        votes[name] = formData.get(name);
      });

      // Store votes
      const submitBtn = ballot.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      setTimeout(() => {
        localStorage.setItem('votes', JSON.stringify(votes));
        window.location.href = 'votesubmit.html';
      }, 800);
    });

    // Add card selection animations
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('change', function(e) {
        if (e.target.type === 'radio') {
          const cardDiv = this.closest('label');
          cardDiv.style.animation = 'none';
          setTimeout(() => {
            cardDiv.style.animation = 'cardPulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
          }, 10);
        }
      });
    });
  }

  function switchSection(newIndex, direction = 'next') {
    if (isTransitioning || newIndex < 0 || newIndex >= positions.length) return;
    
    isTransitioning = true;
    const sections = Array.from(document.querySelectorAll('.section'));
    const currentSectionEl = sections[currentSection];
    const newSectionEl = sections[newIndex];

    // Validate current section
    const inputs = currentSectionEl.querySelectorAll('input[type="radio"]');
    const isChecked = Array.from(inputs).some(input => input.checked);
    
    if (newIndex > currentSection && !isChecked) {
      isTransitioning = false;
      alert('Please select a candidate before proceeding');
      return;
    }

    // Add exit animation
    if (direction === 'next') {
      currentSectionEl.classList.add('exit-left');
      newSectionEl.classList.add('enter-right');
    } else {
      currentSectionEl.classList.add('exit-right');
      newSectionEl.classList.add('enter-left');
    }

    // Show new section
    currentSectionEl.classList.add('hidden');
    newSectionEl.classList.remove('hidden');

    setTimeout(() => {
      currentSectionEl.classList.remove('exit-left', 'exit-right');
      newSectionEl.classList.remove('enter-left', 'enter-right');
      isTransitioning = false;
    }, 600);

    currentSection = newIndex;
  }

  // Initialize ballot
  renderBallot();
})();