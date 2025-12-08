(function () {
  const positions = ['PRESIDENT', 'VICE PRESIDENT', 'SECRETARY', 'TRESURER', 'AUDITOR'];
  const logoutBtn = document.getElementById('logoutBtn');
  const navButtons = document.querySelectorAll('nav button[data-view]');
  const actionButtons = document.querySelectorAll('.action-card[data-go]');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const candidateForm = document.getElementById('candidateForm');
  const candidateName = document.getElementById('candidateName');
  const candidateList = document.getElementById('candidateList');
  const positionLabel = document.getElementById('positionLabel');
  const candidateCount = document.getElementById('candidateCount');

  // Votes & UI elements
  const startBtn = document.getElementById('startVoting');
  const endBtn = document.getElementById('endVoting');
  const voteForSelect = document.getElementById('voteFor');
  const castVoteBtn = document.getElementById('castVote');
  const monitorList = document.getElementById('monitorList');
  const exportBtn = document.getElementById('exportVotes');
  const clearVotesBtn = document.getElementById('clearVotes');
  const scheduleForm = document.getElementById('scheduleForm');
  const startAtInput = document.getElementById('startAt');
  const endAtInput = document.getElementById('endAt');
  const scheduleMsg = document.getElementById('scheduleMsg');

  let currentPosition = 0;

  // --- Storage helpers ---
  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Sync candidates from candidates.html list (distributed round-robin)
  function syncCandidatesFromList() {
    const all = readJSON('candidates', []);
    if (!all.length) return; // no candidates yet

    // Normalize
    const normalized = all.map(c => {
      if (typeof c === 'string') return c.trim();
      if (c && typeof c === 'object' && c.name) return String(c.name).trim();
      return String(c || '').trim();
    }).filter(Boolean);

    if (!normalized.length) return;

    // Distribute round-robin across positions
    const buckets = positions.map(() => []);
    normalized.forEach((name, i) => {
      buckets[i % buckets.length].push(name);
    });

    // Save to candidatesByPosition
    const byPos = {};
    positions.forEach((_, i) => {
      byPos[i] = buckets[i];
    });
    writeJSON('candidatesByPosition', byPos);
  }

  // Candidates stored as positions map (posIndex -> [names])
  function getCandidatesByPosition(pos) {
    const all = readJSON('candidatesByPosition', {});
    return all[pos] || [];
  }
  function saveCandidatesByPosition(pos, candidates) {
    const all = readJSON('candidatesByPosition', {});
    all[pos] = candidates;
    writeJSON('candidatesByPosition', all);
    updateCandidateCount();
    populateSimulateList();
  }

  // Users
  function getUsers() {
    return readJSON('users', []);
  }
  function saveUsers(users) {
    writeJSON('users', users);
  }

  // Votes list
  function getVotesList() {
    return readJSON('votesList', []);
  }
  function pushVote(voteObj) {
    const list = getVotesList();
    list.push(voteObj);
    writeJSON('votesList', list);
  }
  function clearVotes() {
    writeJSON('votesList', []);
  }

  // Voting schedule / status
  function getSchedule() {
    return readJSON('votingSchedule', null);
  }
  function saveSchedule(schedule) {
    writeJSON('votingSchedule', schedule);
  }
  function getVotingStatus() {
    return localStorage.getItem('votingStatus') || 'not_started';
  }
  function setVotingStatus(s) {
    localStorage.setItem('votingStatus', s);
    updateVotingButtons();
  }

  // --- UI rendering ---
  function updateCandidateCount() {
    let total = 0;
    positions.forEach((_, i) => total += getCandidatesByPosition(i).length);
    candidateCount.textContent = total;
  }

  function loadCandidates(pos) {
    const candidates = getCandidatesByPosition(pos);
    candidateList.innerHTML = '';
    positionLabel.textContent = `${positions[pos]} Candidates`;

    if (!candidates.length) {
      const empty = document.createElement('li');
      empty.textContent = 'No candidates added yet';
      empty.style.cssText = 'color: var(--muted); text-align: center; padding: 20px;';
      candidateList.appendChild(empty);
      return;
    }

    candidates.forEach((name, i) => {
      const li = document.createElement('li');
      li.className = 'candidate-item';
      li.innerHTML = `
        <span>${escapeHtml(name)}</span>
        <div>
          <button type="button" class="btn-remove" data-index="${i}">Remove</button>
        </div>
      `;
      li.querySelector('.btn-remove').addEventListener('click', () => {
        candidates.splice(i, 1);
        saveCandidatesByPosition(pos, candidates);
        loadCandidates(pos);
      });
      candidateList.appendChild(li);
    });
  }

  function renderUsers() {
    const usersList = document.getElementById('usersList');
    const users = getUsers();
    usersList.innerHTML = '';
    if (!users.length) {
      usersList.textContent = 'No users';
      return;
    }
    users.forEach((u, i) => {
      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `<span>${escapeHtml(u.name)} — ${escapeHtml(u.email)}</span>
                       <div><button class="btn-remove-user" data-index="${i}">Remove</button></div>`;
      div.querySelector('.btn-remove-user').addEventListener('click', () => {
        users.splice(i, 1);
        saveUsers(users);
        renderUsers();
      });
      usersList.appendChild(div);
    });
  }

  function updateVotingButtons() {
    const status = getVotingStatus();
    startBtn.disabled = status === 'started';
    endBtn.disabled = status !== 'started';
    document.getElementById('votingStatus').textContent = status === 'started' ? 'Started' : status === 'ended' ? 'Ended' : 'Not started';

    // schedule summary
    const sched = getSchedule();
    if (sched && sched.start && sched.end) {
      scheduleMsg.textContent = `${new Date(sched.start).toLocaleString()} → ${new Date(sched.end).toLocaleString()}`;
    } else {
      scheduleMsg.textContent = 'Not set';
    }
  }

  function populateSimulateList() {
    voteForSelect.innerHTML = '';
    // collect all candidates with position label
    positions.forEach((pos, idx) => {
      const list = getCandidatesByPosition(idx);
      list.forEach(name => {
        const opt = document.createElement('option');
        opt.value = `${idx}::${name}`;
        opt.textContent = `${pos} — ${name}`;
        voteForSelect.appendChild(opt);
      });
    });
    // if empty show placeholder
    if (!voteForSelect.children.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No candidates available (add candidates first)';
      voteForSelect.appendChild(opt);
      castVoteBtn.disabled = true;
    } else {
      castVoteBtn.disabled = false;
    }
  }

  function renderMonitor() {
    monitorList.innerHTML = '';
    const votes = getVotesList();
    if (!votes.length) {
      monitorList.innerHTML = '<div class="muted">No votes yet</div>';
      return;
    }

    // Aggregate counts per position->candidate
    const agg = {};
    positions.forEach((pos, idx) => agg[idx] = {});
    votes.forEach(v => {
      // v.votes expected shape: { president: 'Name', vicepresident: 'Name', ... } or stored with keys as position indices
      // support both shapes
      positions.forEach((pos, idx) => {
        const key = v.votes ? Object.keys(v.votes)[idx] : null;
        let name = null;
        if (v.votes && Object.values(v.votes)[idx]) {
          name = Object.values(v.votes)[idx];
        } else if (v[idx]) {
          name = v[idx];
        } else if (v.votes && v.votes[pos.toLowerCase().replace(/\s+/g,'')]) {
          name = v.votes[pos.toLowerCase().replace(/\s+/g,'')];
        }
        if (!name) return;
        agg[idx][name] = (agg[idx][name] || 0) + 1;
      });
    });

    // render summary
    positions.forEach((pos, idx) => {
      const container = document.createElement('div');
      container.className = 'monitor-section';
      const title = document.createElement('h4');
      title.textContent = `${pos}`;
      container.appendChild(title);

      const list = document.createElement('ul');
      list.className = 'list';
      const entries = Object.entries(agg[idx]).sort((a,b)=>b[1]-a[1]);
      if (!entries.length) {
        const li = document.createElement('li');
        li.textContent = 'No votes';
        li.style.color = 'var(--muted)';
        list.appendChild(li);
      } else {
        entries.forEach(([name, count]) => {
          const li = document.createElement('li');
          li.className = 'candidate-item';
          li.innerHTML = `<span>${escapeHtml(name)}</span><strong>${count}</strong>`;
          list.appendChild(li);
        });
      }
      container.appendChild(list);
      monitorList.appendChild(container);
    });

    // show total votes count
    const totalDiv = document.createElement('div');
    totalDiv.style.marginTop = '12px';
    totalDiv.innerHTML = `<strong>Total ballots cast:</strong> ${votes.length}`;
    monitorList.appendChild(totalDiv);
  }

  function exportVotes() {
    const data = getVotesList();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `votes_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Event handlers ---
  tabButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPosition = i;
      loadCandidates(i);
    });
  });

  if (candidateForm) {
    candidateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (candidateName.value || '').trim();
      if (!name) { alert('Please enter a candidate name'); return; }
      const candidates = getCandidatesByPosition(currentPosition);
      if (candidates.some(c => c.toLowerCase() === name.toLowerCase())) {
        alert('This candidate already exists for this position'); candidateName.value=''; return;
      }
      candidates.push(name);
      saveCandidatesByPosition(currentPosition, candidates);
      candidateName.value = '';
      loadCandidates(currentPosition);
    });
  }

  // Users
  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('userName').value || '').trim();
      const email = (document.getElementById('userEmail').value || '').trim();
      if (!name || !email) return alert('Provide name and email');
      const users = getUsers();
      users.push({ name, email });
      saveUsers(users);
      renderUsers();
      userForm.reset();
    });
  }

  // Schedule
  if (scheduleForm) {
    scheduleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const start = startAtInput.value ? new Date(startAtInput.value).toISOString() : null;
      const end = endAtInput.value ? new Date(endAtInput.value).toISOString() : null;
      if (!start || !end || new Date(start) >= new Date(end)) {
        return alert('Please set a valid start and end datetime');
      }
      saveSchedule({ start, end });
      scheduleMsg.textContent = `${new Date(start).toLocaleString()} → ${new Date(end).toLocaleString()}`;
      alert('Schedule saved');
    });
  }

  // Start / End voting
  if (startBtn) startBtn.addEventListener('click', () => {
    setVotingStatus('started');
    alert('Voting started');
  });
  if (endBtn) endBtn.addEventListener('click', () => {
    setVotingStatus('ended');
    alert('Voting ended');
  });

  // Simulate vote (cast single ballot)
  if (castVoteBtn) {
    castVoteBtn.addEventListener('click', () => {
      const val = voteForSelect.value;
      if (!val) return alert('No candidate selected');
      // val format: "posIdx::name"
      const [posIdxStr, name] = val.split('::');
      const posIdx = Number(posIdxStr);
      // create a ballot: choose random for other positions
      const ballot = {};
      positions.forEach((_, idx) => {
        const list = getCandidatesByPosition(idx);
        ballot[positions[idx].toLowerCase().replace(/\s+/g,'')] = list.length ? (idx === posIdx ? name : list[Math.floor(Math.random()*list.length)]) : null;
      });
      const voteObj = { votes: ballot, timestamp: Date.now(), simulated: true };
      pushVote(voteObj);
      renderMonitor();
      alert('Simulated vote cast');
    });
  }

  // Export / Clear
  if (exportBtn) exportBtn.addEventListener('click', exportVotes);
  if (clearVotesBtn) clearVotesBtn.addEventListener('click', () => {
    if (!confirm('Clear all stored votes?')) return;
    clearVotes();
    renderMonitor();
  });

  // Helper
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  // Init
  function init() {
    // Sync candidates from candidates.html list first
    syncCandidatesFromList();

    loadCandidates(0);
    updateCandidateCount();
    renderUsers();
    populateSimulateList();
    renderMonitor();
    updateVotingButtons();
    
    // handle view switching
    const switchView = (viewName) => {
      const allViews = document.querySelectorAll('.view');
      const targetView = document.getElementById(viewName);
      allViews.forEach(v => v.classList.remove('active'));
      if (targetView) targetView.classList.add('active');
      navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));
    };
    navButtons.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    actionButtons.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.go)));

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminSession');
        window.location.href = 'adminLogin.html'
      });
    };
  }

  init();
})();