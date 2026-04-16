// ============================================================
// RAHMA'S PHD QUEST BOARD — APP LOGIC v2
// localStorage-backed, XP system, card routing, custom projects
// ============================================================

// ---- STATE ----
let state = {};
let currentMilestoneId = null;

// ---- LOCALSTORAGE STATE (GitHub Pages compatible) ----
function loadState() {
  try {
    const saved = localStorage.getItem('questboard_state_v2');
    state = saved ? JSON.parse(saved) : {};
  } catch(e) { state = {}; }
}

function saveState() {
  try {
    localStorage.setItem('questboard_state_v2', JSON.stringify(state));
  } catch(e) {}
}

function getMilestoneState(id) {
  return state[id] || { status: 'pending', notes: '' };
}

function setMilestoneState(id, updates) {
  state[id] = { ...getMilestoneState(id), ...updates };
  saveState();
}

// ---- STEP STATE (nested under milestone state) ----
function getStepState(milestoneId, stepId) {
  const ms = state[milestoneId] || {};
  const steps = ms.steps || {};
  return steps[stepId] || { status: 'locked', checklist: {}, sessions: 0 };
}

function setStepState(milestoneId, stepId, updates) {
  if (!state[milestoneId]) state[milestoneId] = { status: 'pending', notes: '' };
  if (!state[milestoneId].steps) state[milestoneId].steps = {};
  state[milestoneId].steps[stepId] = {
    ...getStepState(milestoneId, stepId),
    ...updates
  };
  saveState();
}

// ---- XP CALCULATION ----
function calculateTotalXP() {
  let xp = 0;
  TRACK_ORDER.forEach(trackId => {
    (QUEST_DATA[trackId] || []).forEach(m => {
      (m.steps || []).forEach(step => {
        if (getStepState(m.id, step.id).status === 'done') xp += (step.xp || 0);
      });
    });
  });
  // Also count custom projects
  loadCustomProjects().forEach(proj => {
    (proj.milestones || []).forEach(m => {
      (m.steps || []).forEach(step => {
        if (getStepState(m.id, step.id).status === 'done') xp += (step.xp || 0);
      });
    });
  });
  return xp;
}

function getCurrentLevel(xp) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xp_required) level = l;
  }
  return level;
}

function getNextLevel(xp) {
  return LEVELS.find(l => l.xp_required > xp) || null;
}

function updateTrackProgressBars() {
  TRACK_ORDER.forEach(trackId => {
    const milestones = QUEST_DATA[trackId] || [];
    if (!milestones.length) return;
    const bar = document.getElementById('track-prog-' + trackId);
    if (!bar) return;
    const done = milestones.filter(m => getMilestoneState(m.id).status === 'done').length;
    const pct = Math.round((done / milestones.length) * 100);
    bar.style.width = pct + '%';
    // Update color based on track
    const colors = {
      dlpfc: 'var(--c-dlpfc)', fic: 'var(--c-fic)', bd2: 'var(--c-bd2)',
      dg: 'var(--c-dg)', eef2: 'var(--c-eef2)', package: 'var(--c-package)',
      cursor: 'var(--c-dg)', network: '#9ca3af', learning: 'var(--c-learning)',
      career: 'var(--c-career)'
    };
    bar.style.background = colors[trackId] || 'var(--c-flagship)';
  });
}

function updateXPBar() {
  // XP bar removed from header — just track XP internally
  const xp = calculateTotalXP();
  const current = getCurrentLevel(xp);
  // Store for other uses (future: could surface somewhere)
  window._currentXP = xp;
  window._currentLevel = current;
}

// ---- COUNTDOWN (kept for data, no longer rendered in header) ----
function updateCountdown() {
  const target = new Date('2026-11-01T00:00:00');
  const now = new Date();
  const diff = target - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  window._defenseCountdown = days; // available for other uses
}

// ---- RENDER BOARD ----
// Track order: 4 required papers first, then optional/tools
const TRACK_ORDER = ['dlpfc', 'fic', 'bd2', 'dg', 'eef2', 'package', 'cursor', 'network', 'learning', 'career'];

// Active view shows ONLY these tracks (user's current focus).
// dlpfc = DLPFC data acquisition, package = txomics, cursor = txomics implementation on DLPFC
// These run in parallel: finish a txomics module → implement in dlpfc via cursor track.
const ACTIVE_FOCUS_TRACKS = ['dlpfc', 'package', 'cursor'];

// ---- VIEW MODE ----
// 'active' = default: tracks with in-progress milestones float to top, empty tracks collapsed
// 'all'    = show every track in standard order
let currentView = 'active';

function setView(view) {
  currentView = view;
  // Sync header-tab buttons
  document.querySelectorAll('.view-btn, .header-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  renderAllTracks();
}

function getTrackPriority(trackId) {
  // Returns sort weight for a track in 'active' view:
  // 0 = has in-progress milestones (float to top)
  // 1 = has at least one pending but none in-progress
  // 2 = all done or empty
  const milestones = QUEST_DATA[trackId] || [];
  const hasInProgress = milestones.some(m => getMilestoneState(m.id).status === 'inprogress');
  if (hasInProgress) return 0;
  const hasAnyActive = milestones.some(m => getMilestoneState(m.id).status !== 'done');
  if (hasAnyActive) return 1;
  return 2;
}

function getActiveTrackOrder() {
  // Sort tracks: in-progress first, then pending, then complete
  // Within each group, preserve the original logical order
  return [...TRACK_ORDER].sort((a, b) => getTrackPriority(a) - getTrackPriority(b));
}

function getAccentColor(category) {
  const map = {
    // Required papers
    dlpfc:    'var(--c-dlpfc)',
    fic:      'var(--c-fic)',
    bd2:      'var(--c-bd2)',
    dg:       'var(--c-dg)',
    // Optional / tools
    eef2:     'var(--c-eef2)',
    package:  'var(--c-package)',
    cursor:   'var(--c-dg)',
    network:  '#9ca3af',
    learning: 'var(--c-learning)',
    career:   'var(--c-career)',
    // Legacy aliases
    flagship: 'var(--c-dlpfc)',
    methods:  'var(--c-eef2)',
  };
  return map[category] || 'var(--c-dlpfc)';
}

function getStatusIcon(status) {
  if (status === 'done') return { icon: '✓', cls: 'status-icon-done' };
  if (status === 'inprogress') return { icon: '→', cls: 'status-icon-inprogress' };
  return { icon: '○', cls: 'status-icon-pending' };
}

function getMilestoneXP(m) {
  if (!m.steps) return 0;
  return m.steps.reduce((sum, s) => sum + (s.xp || 0), 0);
}

function renderTrack(trackId, milestones, isCustom = false) {
  const container = document.getElementById('track-' + trackId);
  if (!container) return;
  container.innerHTML = '';

  milestones.forEach((m, idx) => {
    const ms = getMilestoneState(m.id);
    const accent = getAccentColor(m.category || trackId);
    const { icon, cls } = getStatusIcon(ms.status);
    const totalXP = getMilestoneXP(m);

    const card = document.createElement('div');
    card.className = 'milestone-card';
    card.setAttribute('data-id', m.id);
    card.setAttribute('data-status', ms.status);
    card.style.setProperty('--card-accent', accent);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', m.title);

    card.innerHTML = `
      <div class="card-status-icon ${cls}">${icon}</div>
      <button class="card-gear" title="Quick edit" aria-label="Quick edit">⚙</button>
      <div class="card-emoji">${m.emoji || '📌'}</div>
      <div class="card-title">${m.title}</div>
      <div class="card-priority">${m.priority || ''}</div>
      ${totalXP ? `<div class="card-xp-badge">+${totalXP} XP</div>` : ''}
    `;

    // Card body click → detail page
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-gear')) {
        e.stopPropagation();
        openModal(m.id);
        return;
      }
      window.location.href = `detail.html?id=${encodeURIComponent(m.id)}`;
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        window.location.href = `detail.html?id=${encodeURIComponent(m.id)}`;
      }
    });

    // Gear button
    const gearBtn = card.querySelector('.card-gear');
    gearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(m.id);
    });

    container.appendChild(card);

    if (idx < milestones.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'connector';
      conn.setAttribute('aria-hidden', 'true');
      conn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.35"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      container.appendChild(conn);
    }
  });

  renderTrackProgress(trackId, milestones);
}

function renderTrackProgress(trackId, milestones) {
  const ringEl = document.querySelector(`[data-track-id="${trackId}"]`);
  if (!ringEl) return;
  const total = milestones.length;
  const done = milestones.filter(m => getMilestoneState(m.id).status === 'done').length;
  const pct = Math.round((done / total) * 100);
  const accent = getAccentColor(milestones[0]?.category || trackId);
  ringEl.innerHTML = `
    <div class="track-prog-badge">
      <div class="track-prog-bar">
        <div class="track-prog-fill" style="width:${pct}%; background:${accent};"></div>
      </div>
      <span>${done}/${total}</span>
    </div>
  `;
}

function sortMilestonesBySequence(milestones) {
  // Sort by priority label (P0 first, then P1, P2..., then unlabeled)
  const priorityOrder = p => {
    if (!p) return 999;
    const m = p.match(/P(\d+)/i);
    return m ? parseInt(m[1]) : 500;
  };
  return [...milestones].sort((a, b) =>
    priorityOrder(a.priority) - priorityOrder(b.priority)
  );
}

function renderAllTracks() {
  const board = document.querySelector('.board-container');
  if (_depArrowSVG) { _depArrowSVG.remove(); _depArrowSVG = null; }

  // Move add-project button to end so focus tracks don't appear after it
  const addSection = document.querySelector('.add-project-section');
  if (addSection) board.appendChild(addSection);

  if (currentView === 'active') {
    // Active view: show ONLY the 3 focus tracks, fully hide the rest
    TRACK_ORDER.forEach(trackId => {
      const section = document.querySelector(`.track[data-track="${trackId}"]`);
      if (!section) return;
      if (ACTIVE_FOCUS_TRACKS.includes(trackId)) {
        section.classList.remove('track-collapsed');
        section.style.display = '';
        // Insert before add-project button to maintain correct order
        board.insertBefore(section, addSection || null);
        renderTrack(trackId, sortMilestonesBySequence(QUEST_DATA[trackId] || []));
      } else {
        section.classList.add('track-collapsed');
        section.style.display = 'none';
      }
    });
  } else {
    // All view: show everything in standard order
    TRACK_ORDER.forEach(trackId => {
      const milestones = QUEST_DATA[trackId];
      if (!milestones) return;
      const section = document.querySelector(`.track[data-track="${trackId}"]`);
      if (!section) return;
      section.classList.remove('track-collapsed');
      section.style.display = '';
      board.insertBefore(section, addSection || null);
      renderTrack(trackId, sortMilestonesBySequence(milestones));
    });
    // Dependency arrows in all view (subtle, optional)
    scheduleDepArrows();
  }

  renderCustomProjects();
  updateGlobalStats();
  updateXPBar();
  updateTrackProgressBars();
  updateTrackToTrackArrows();

  // Draw intra-track dependency arrows after DOM settles (needs layout complete)
  setTimeout(drawIntraTrackArrows, 120);
}

function updateGlobalStats() {
  let done = 0, inprog = 0, pending = 0;
  TRACK_ORDER.forEach(trackId => {
    (QUEST_DATA[trackId] || []).forEach(m => {
      const s = getMilestoneState(m.id).status;
      if (s === 'done') done++;
      else if (s === 'inprogress') inprog++;
      else pending++;
    });
  });
  const doneEl = document.getElementById('totalDone');
  const ipEl   = document.getElementById('totalInProgress');
  const remEl  = document.getElementById('totalRemaining');
  if (doneEl) doneEl.textContent = done;
  if (ipEl)   ipEl.textContent   = inprog;
  if (remEl)  remEl.textContent  = pending;
  return done;
}

// ---- CUSTOM PROJECTS ----
function loadCustomProjects() {
  try { return JSON.parse(localStorage.getItem('customProjects') || '[]'); } catch(e) { return []; }
}

function saveCustomProject(proj) {
  const projs = loadCustomProjects();
  projs.push(proj);
  localStorage.setItem('customProjects', JSON.stringify(projs));
}

function renderCustomProjects() {
  const board = document.querySelector('.board-container');
  if (!board) return;
  // Remove old custom tracks
  board.querySelectorAll('.track[data-custom]').forEach(el => el.remove());

  const projs = loadCustomProjects();
  projs.forEach(proj => {
    // Add section if not present
    if (!document.getElementById('track-' + proj.id)) {
      const arrowDiv = document.createElement('div');
      arrowDiv.className = 'track-to-track-arrow';
      arrowDiv.setAttribute('aria-hidden', 'true');
      arrowDiv.innerHTML = `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v24M5 20l7 8 7-8"/></svg>`;
      board.insertBefore(arrowDiv, document.querySelector('.add-project-section'));

      const section = document.createElement('section');
      section.className = 'track';
      section.setAttribute('data-track', proj.id);
      section.setAttribute('data-custom', '1');
      section.innerHTML = `
        <div class="track-header">
          <div class="track-icon">${proj.emoji || '🔬'}</div>
          <div>
            <h2 class="track-title">${proj.name}</h2>
            <p class="track-desc">${proj.desc || ''}</p>
          </div>
          <div class="track-progress-ring" data-track-id="${proj.id}"></div>
        </div>
        <div class="board-row" id="track-${proj.id}"></div>
      `;
      board.insertBefore(section, document.querySelector('.add-project-section'));
    }
    renderTrack(proj.id, proj.milestones || []);
  });
}

// PRESET TEMPLATES for Add Project
const PROJECT_TEMPLATES = [
  {
    name: 'DG Neurogenesis',
    emoji: '🧬',
    desc: 'Dentate gyrus neurogenesis study milestones',
    milestones: [
      { id: 'dg-m1', title: 'DG Data QC', emoji: '🔬', priority: 'P0', category: 'custom', steps: [], xp: 20 },
      { id: 'dg-m2', title: 'Cell Typing (DG)', emoji: '🧩', priority: 'P1', category: 'custom', steps: [], xp: 25 },
      { id: 'dg-m3', title: 'Neurogenesis Analysis', emoji: '📊', priority: 'P2', category: 'custom', steps: [], xp: 30 },
      { id: 'dg-m4', title: 'DG Manuscript', emoji: '✍️', priority: 'P3', category: 'custom', steps: [], xp: 15 },
    ]
  },
  {
    name: 'ACC Bipolar',
    emoji: '🧠',
    desc: 'Anterior cingulate cortex Bipolar disorder analysis',
    milestones: [
      { id: 'acc-m1', title: 'ACC Sample QC', emoji: '🔬', priority: 'P0', category: 'custom', steps: [], xp: 20 },
      { id: 'acc-m2', title: 'BD vs Control Analysis', emoji: '📡', priority: 'P1', category: 'custom', steps: [], xp: 30 },
      { id: 'acc-m3', title: 'Spatial ACC Domains', emoji: '🗺️', priority: 'P2', category: 'custom', steps: [], xp: 25 },
      { id: 'acc-m4', title: 'ACC Paper Draft', emoji: '✍️', priority: 'P3', category: 'custom', steps: [], xp: 15 },
    ]
  },
];

// ---- ADD PROJECT MODAL ----
function openAddProjectModal() {
  const overlay = document.getElementById('addProjectOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAddProjectModal() {
  const overlay = document.getElementById('addProjectOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function initAddProjectModal() {
  const addBtn = document.getElementById('addProjectBtn');
  if (addBtn) addBtn.addEventListener('click', openAddProjectModal);

  const overlay = document.getElementById('addProjectOverlay');
  if (!overlay) return;

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeAddProjectModal();
  });

  // Template chips
  overlay.querySelectorAll('.template-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      overlay.querySelectorAll('.template-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      const tpl = PROJECT_TEMPLATES.find(t => t.name === chip.dataset.template);
      if (tpl) {
        const nameInput = overlay.querySelector('#projName');
        const descInput = overlay.querySelector('#projDesc');
        const emojiInput = overlay.querySelector('#projEmoji');
        if (nameInput && !nameInput.value) nameInput.value = tpl.name;
        if (descInput && !descInput.value) descInput.value = tpl.desc;
        if (emojiInput && !emojiInput.value) emojiInput.value = tpl.emoji;
      }
    });
  });

  const cancelBtn = overlay.querySelector('#cancelAddProject');
  if (cancelBtn) cancelBtn.addEventListener('click', closeAddProjectModal);

  const createBtn = overlay.querySelector('#createAddProject');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const name  = (overlay.querySelector('#projName')?.value || '').trim();
      const desc  = (overlay.querySelector('#projDesc')?.value || '').trim();
      const emoji = (overlay.querySelector('#projEmoji')?.value || '🔬').trim();
      if (!name) { overlay.querySelector('#projName')?.focus(); return; }

      const selectedChip = overlay.querySelector('.template-chip.selected');
      const tpl = selectedChip
        ? PROJECT_TEMPLATES.find(t => t.name === selectedChip.dataset.template)
        : null;

      const projId = 'custom-' + Date.now();
      const proj = {
        id: projId,
        name,
        desc,
        emoji,
        milestones: tpl ? tpl.milestones.map(m => ({...m, id: m.id + '-' + projId})) : [],
      };
      saveCustomProject(proj);
      renderCustomProjects();
      closeAddProjectModal();

      // Reset form
      overlay.querySelector('#projName').value = '';
      overlay.querySelector('#projDesc').value = '';
      overlay.querySelector('#projEmoji').value = '';
      overlay.querySelectorAll('.template-chip').forEach(c => c.classList.remove('selected'));
    });
  }
}

// ---- MODAL (quick-edit, from gear icon) ----
function getAllMilestones() {
  const all = {};
  TRACK_ORDER.forEach(trackId => {
    (QUEST_DATA[trackId] || []).forEach(m => { all[m.id] = m; });
  });
  loadCustomProjects().forEach(proj => {
    (proj.milestones || []).forEach(m => { all[m.id] = m; });
  });
  return all;
}

function openModal(milestoneId) {
  const allMilestones = getAllMilestones();
  const m = allMilestones[milestoneId];
  if (!m) return;

  currentMilestoneId = milestoneId;
  const ms = getMilestoneState(milestoneId);
  const accent = getAccentColor(m.category);
  const catMeta = CATEGORY_META[m.category] || { emoji: m.emoji || '📌', label: m.category || 'Custom' };

  document.querySelector('.modal-overlay').style.setProperty('--card-accent', accent);
  document.getElementById('modalBadge').textContent = `${catMeta.emoji} ${catMeta.label}`;
  document.getElementById('modalBadge').style.setProperty('--card-accent', accent);
  document.getElementById('modalTitle').textContent = `${m.emoji || ''} ${m.title}`;
  document.getElementById('modalDesc').textContent = m.desc || '';
  document.getElementById('modalNotes').value = ms.notes || '';

  const metaEl = document.getElementById('modalMeta');
  if (m.details && m.details.length) {
    metaEl.innerHTML = m.details.map(d =>
      `<div class="modal-meta-item"><span class="modal-meta-bullet">◆</span><span>${d}</span></div>`
    ).join('');
    metaEl.style.display = '';
  } else {
    metaEl.style.display = 'none';
  }

  const btns = document.getElementById('statusButtons');
  const statuses = [
    { val: 'pending',    label: '○ Not started', cls: 'active-pending' },
    { val: 'inprogress', label: '→ In progress',  cls: 'active-inprogress' },
    { val: 'done',       label: '✓ Done!',         cls: 'active-done' },
  ];
  btns.innerHTML = statuses.map(s => `
    <button class="status-btn ${ms.status === s.val ? s.cls : ''}" data-status="${s.val}">${s.label}</button>
  `).join('');

  btns.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btns.querySelectorAll('.status-btn').forEach(b => b.className = 'status-btn');
      const newStatus = btn.getAttribute('data-status');
      const matchCls = statuses.find(s => s.val === newStatus)?.cls || '';
      btn.classList.add(matchCls);
    });
  });

  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Populate due date if set
  const dueDateEl = document.getElementById('modalDueDate');
  if (dueDateEl) dueDateEl.value = ms.dueDate || '';
  const maxTimeEl = document.getElementById('modalMaxTime');
  if (maxTimeEl) maxTimeEl.value = ms.maxTime != null ? ms.maxTime : '';

  setTimeout(() => document.getElementById('modalNotes').focus(), 200);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
  currentMilestoneId = null;
}

function saveModal() {
  if (!currentMilestoneId) return;
  const activeBtnEl = document.querySelector('#statusButtons .status-btn.active-done') ||
                      document.querySelector('#statusButtons .status-btn.active-inprogress') ||
                      document.querySelector('#statusButtons .status-btn.active-pending');
  const newStatus = activeBtnEl?.getAttribute('data-status') || 'pending';
  const oldStatus = getMilestoneState(currentMilestoneId).status;
  const notes = document.getElementById('modalNotes').value;

  setMilestoneState(currentMilestoneId, { status: newStatus, notes });
  renderAllTracks();
  updateXPBar();

  if (newStatus === 'done' && oldStatus !== 'done') triggerConfetti();
  closeModal();
}

// ---- CONFETTI ----
function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Pastel Studio palette — matches new track colors
  const colors = ['#f4a26d','#a78bfa','#f78ca0','#7ec8a0','#5bc4d6','#a3d977','#fbd26a','#f9a8d4','#ffffff'];
  const particles = Array.from({length: 120}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 7 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: Math.random() * 4 + 2,
    drift: (Math.random() - 0.5) * 2,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.2,
    isRect: Math.random() > 0.5,
    opacity: 1
  }));

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      if (p.y < canvas.height + 20) alive = true;
      p.y += p.speed; p.x += p.drift; p.rotation += p.rotSpeed;
      p.opacity = Math.max(0, 1 - (p.y / canvas.height) * 0.5);
      ctx.save(); ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.fillStyle = p.color;
      if (p.isRect) ctx.fillRect(-p.r, -p.r/2, p.r*2, p.r);
      else { ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    });
    frame++;
    if (alive && frame < 180) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

// ---- THEME TOGGLE ----
function initTheme() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = localStorage.getItem('theme') || 'light';
  root.setAttribute('data-theme', theme);
  updateToggleIcon(toggle, theme);
  toggle?.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateToggleIcon(toggle, theme);
  });
}

function updateToggleIcon(toggle, theme) {
  if (!toggle) return;
  toggle.innerHTML = theme === 'dark'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

// ---- MODAL CLOSE ----
function initModalEvents() {
  const closeBtn = document.getElementById('modalClose');
  const saveBtn  = document.getElementById('modalSave');
  const overlay  = document.getElementById('modalOverlay');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (saveBtn)  saveBtn.addEventListener('click', saveModal);
  if (overlay) {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ---- INSERT TRACK-TO-TRACK ARROWS ----
// Only shown in 'all' view; removed/hidden in active view (only 3 tracks visible)
function insertTrackArrows() {
  // Handled dynamically in renderAllTracks — nothing to do at init time
  // (old static insertion removed to avoid orphaned arrows in active view)
}

function updateTrackToTrackArrows() {
  const board = document.querySelector('.board-container');
  if (!board) return;
  // Remove all existing track-to-track arrows first
  board.querySelectorAll('.track-to-track-arrow').forEach(el => el.remove());
  // Only draw in 'all' view
  if (currentView !== 'all') return;
  const tracks = Array.from(board.querySelectorAll('section.track:not(.track-collapsed):not([data-custom])'));
  tracks.forEach((track, i) => {
    if (i < tracks.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'track-to-track-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.innerHTML = `<svg width="20" height="28" viewBox="0 0 20 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 2v20M4 16l6 8 6-8"/></svg>`;
      track.after(arrow);
    }
  });
}

// ---- DEPENDENCY ARROWS (SVG overlay, All Projects view only) ----

// Build a lookup: milestoneId → {element, accent color}
function buildMilestoneCardMap() {
  const map = {};
  // Gather all tracked milestones
  TRACK_ORDER.forEach(trackId => {
    (QUEST_DATA[trackId] || []).forEach(m => {
      const el = document.querySelector(`[data-id="${m.id}"]`);
      if (el) map[m.id] = { el, color: resolveCSSVar(getAccentColor(m.category || trackId)) };
    });
  });
  return map;
}

// Resolve a CSS variable like 'var(--c-flagship)' to a hex color
function resolveCSSVar(val) {
  if (!val || !val.startsWith('var(')) return val || '#a78bfa';
  const name = val.slice(4, -1).trim();
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#a78bfa';
}

// Collect all depends_on edges across all tracks
function collectDependencyEdges() {
  const edges = [];
  TRACK_ORDER.forEach(trackId => {
    (QUEST_DATA[trackId] || []).forEach(m => {
      if (!m.depends_on || !m.depends_on.length) return;
      m.depends_on.forEach(depId => {
        // Only show cross-track deps (same-track are already sequential)
        const depTrack = findTrackForMilestone(depId);
        if (depTrack && depTrack !== trackId) {
          edges.push({ from: depId, to: m.id, fromTrack: depTrack, toTrack: trackId });
        }
      });
    });
  });
  return edges;
}

function findTrackForMilestone(milestoneId) {
  for (const trackId of TRACK_ORDER) {
    if ((QUEST_DATA[trackId] || []).some(m => m.id === milestoneId)) return trackId;
  }
  return null;
}

function getCardCenter(el, boardEl) {
  // Use the same board-relative helper as intra-track arrows
  const p = cardPosRelativeToBoard(el, boardEl);
  return {
    x:      p.cx,
    y:      p.cy,
    bottom: p.bottom,
    top:    p.top,
    left:   p.left,
    right:  p.right,
  };
}

let _depArrowSVG = null;

function drawDependencyArrows() {
  const board = document.querySelector('.board-container');
  if (!board) return;

  // Remove old overlay
  if (_depArrowSVG) { _depArrowSVG.remove(); _depArrowSVG = null; }

  // Only show in 'all' view
  if (currentView !== 'all') return;

  const edges = collectDependencyEdges();
  if (!edges.length) return;

  const cardMap = buildMilestoneCardMap();
  const boardH = board.scrollHeight;
  const boardW = board.offsetWidth;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'dep-arrows-overlay');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width',  boardW);
  svg.setAttribute('height', boardH);
  svg.style.cssText = `position:absolute;top:0;left:0;width:${boardW}px;height:${boardH}px;pointer-events:none;z-index:5;overflow:visible;`;

  // Add arrowhead defs (one per unique color)
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const usedColors = new Set();

  edges.forEach(edge => {
    const fromInfo = cardMap[edge.from];
    const toInfo   = cardMap[edge.to];
    if (!fromInfo || !toInfo) return;
    usedColors.add(fromInfo.color);
  });

  usedColors.forEach(color => {
    const safeId = 'arr-' + color.replace(/[^a-zA-Z0-9]/g, '');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', safeId);
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '7');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', 'M0,0 L0,6 L8,3 z');
    arrow.setAttribute('fill', color);
    arrow.setAttribute('opacity', '0.55');
    marker.appendChild(arrow);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);

  edges.forEach(edge => {
    const fromInfo = cardMap[edge.from];
    const toInfo   = cardMap[edge.to];
    if (!fromInfo || !toInfo) return;

    const from = getCardCenter(fromInfo.el, board);
    const to   = getCardCenter(toInfo.el,   board);
    const color = fromInfo.color;
    const safeId = 'arr-' + color.replace(/[^a-zA-Z0-9]/g, '');

    // Route: exit bottom of source card, enter top of target card
    // Use cubic bezier with vertical control points
    const x1 = from.x, y1 = from.bottom - 4;
    const x2 = to.x,   y2 = to.top + 4;
    const cp1y = y1 + Math.abs(y2 - y1) * 0.45;
    const cp2y = y2 - Math.abs(y2 - y1) * 0.45;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${x1} ${y1} C ${x1} ${cp1y}, ${x2} ${cp2y}, ${x2} ${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-dasharray', '5 4');
    path.setAttribute('opacity', '0.45');
    path.setAttribute('marker-end', `url(#${safeId})`);
    // Tooltip on hover
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    const fromM = Object.values(QUEST_DATA).flat().find(m => m.id === edge.from);
    const toM   = Object.values(QUEST_DATA).flat().find(m => m.id === edge.to);
    title.textContent = `${fromM?.title || edge.from}  →  ${toM?.title || edge.to}`;
    path.appendChild(title);
    svg.appendChild(path);
  });

  // Make board relatively positioned so SVG overlay aligns
  if (getComputedStyle(board).position === 'static') board.style.position = 'relative';
  board.appendChild(svg);
  _depArrowSVG = svg;
}

// Redraw after render + on resize
function scheduleDepArrows() {
  // Small delay to let DOM settle after render
  clearTimeout(scheduleDepArrows._t);
  scheduleDepArrows._t = setTimeout(drawDependencyArrows, 120);
}

// ---- INTRA-TRACK DEPENDENCY ARROWS ----
// Draws SVG arrows between milestone cards to show the pathway/sequence.
// Same-row (adjacent) cards already have inline .connector arrows — we only draw
// cross-row arrows here (row-wrap transitions), using bezier curves.
// Positions are computed relative to the board-container element (not viewport).
let _intraArrowSVG = null;

function cardPosRelativeToBoard(el, boardEl) {
  // Returns element rect relative to boardEl's top-left, accounting for scroll.
  const er = el.getBoundingClientRect();
  const br = boardEl.getBoundingClientRect();
  // scrollLeft/Top of the board itself (usually 0 since board doesn't scroll)
  return {
    left:   er.left   - br.left,
    top:    er.top    - br.top  + boardEl.scrollTop,
    right:  er.right  - br.left,
    bottom: er.bottom - br.top  + boardEl.scrollTop,
    width:  er.width,
    height: er.height,
    cx:     er.left   - br.left + er.width  / 2,
    cy:     er.top    - br.top  + boardEl.scrollTop + er.height / 2,
  };
}

function drawIntraTrackArrows() {
  if (_intraArrowSVG) { _intraArrowSVG.remove(); _intraArrowSVG = null; }

  const board = document.querySelector('.board-container');
  if (!board) return;

  // Ensure board is positioned so the absolute SVG overlay aligns
  if (getComputedStyle(board).position === 'static') board.style.position = 'relative';

  const boardH = board.scrollHeight;
  const boardW = board.offsetWidth;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'intra-arrows-overlay');
  svg.setAttribute('aria-hidden', 'true');
  // Size to full board scroll height so arrows below fold are drawn correctly
  svg.style.cssText = `position:absolute;top:0;left:0;width:${boardW}px;height:${boardH}px;pointer-events:none;z-index:6;overflow:visible;`;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const markerColors = new Set();

  const visibleTracks = currentView === 'active' ? ACTIVE_FOCUS_TRACKS : TRACK_ORDER;
  const edges = []; // { fromEl, toEl, color }

  visibleTracks.forEach(trackId => {
    const milestones = QUEST_DATA[trackId] || [];
    if (!milestones.length) return;
    const color = resolveCSSVar(getAccentColor(trackId));
    markerColors.add(color);

    milestones.forEach((m, i) => {
      const toEl = document.querySelector(`[data-id="${m.id}"]`);
      if (!toEl) return;

      if (m.depends_on && m.depends_on.length) {
        // Explicit cross-row deps within same track
        m.depends_on.forEach(depId => {
          if (milestones.some(x => x.id === depId)) {
            const fromEl = document.querySelector(`[data-id="${depId}"]`);
            if (fromEl) edges.push({ fromEl, toEl, color });
          }
        });
      } else if (i > 0) {
        // Sequential: previous milestone in track
        const fromEl = document.querySelector(`[data-id="${milestones[i-1].id}"]`);
        if (fromEl) edges.push({ fromEl, toEl, color });
      }
    });
  });

  if (!edges.length) { board.appendChild(svg); _intraArrowSVG = svg; return; }

  // Build arrowhead markers
  markerColors.forEach(color => {
    const safeId = 'ia-' + color.replace(/[^a-zA-Z0-9]/g, '');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', safeId);
    marker.setAttribute('markerWidth', '8'); marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '7'); marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', 'M0,0 L0,6 L8,3 z');
    arrow.setAttribute('fill', color); arrow.setAttribute('opacity', '0.75');
    marker.appendChild(arrow); defs.appendChild(marker);
  });
  svg.appendChild(defs);

  edges.forEach(({ fromEl, toEl, color }) => {
    const fr = cardPosRelativeToBoard(fromEl, board);
    const tr = cardPosRelativeToBoard(toEl,   board);

    const safeId = 'ia-' + color.replace(/[^a-zA-Z0-9]/g, '');

    // Determine if cards are on the same visual row:
    // same row = their vertical centers are within one card-height of each other
    // AND toEl is to the right of fromEl
    const cardH = fr.height;
    const sameRow = Math.abs(fr.cy - tr.cy) < cardH * 0.6 && tr.left > fr.left;

    if (sameRow) {
      // Same row: the inline .connector arrow already handles this visually.
      // Skip to avoid double arrows.
      return;
    }

    // Cross-row: curved bezier from bottom-center of fromEl to top-center of toEl
    const x1 = fr.cx;
    const y1 = fr.bottom + 3;
    const x2 = tr.cx;
    const y2 = tr.top - 3;

    // Vertical distance for control points
    const dy = Math.abs(y2 - y1);
    const cp1y = y1 + dy * 0.4;
    const cp2y = y2 - dy * 0.4;

    // Horizontal shift: if going to a different column, add horizontal offset
    // to make the curve arc gracefully instead of going straight down
    const dx = x2 - x1;
    const cp1x = x1 + dx * 0.1;
    const cp2x = x2 - dx * 0.1;

    const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-dasharray', '6 3');
    path.setAttribute('opacity', '0.55');
    path.setAttribute('marker-end', `url(#${safeId})`);
    svg.appendChild(path);
  });

  board.appendChild(svg);
  _intraArrowSVG = svg;
}

// ---- AUTO-SEQUENCE: get next task by pipeline order ----
// Returns the first milestone/step that should be worked on next,
// based on sequence (not manual selection). Urgency flag overrides.
function getAutoNextItems(limit = 5) {
  const results = [];
  // First: any item with urgency flag (due date in past or today, or manually flagged)
  const today = new Date().toISOString().split('T')[0];

  TRACK_ORDER.forEach(trackId => {
    const milestones = QUEST_DATA[trackId] || [];
    milestones.forEach(m => {
      const ms = getMilestoneState(m.id);
      if (ms.status === 'done') return;
      const dueDate = ms.dueDate || null;
      const urgent = dueDate && dueDate <= today;
      if (urgent) results.push({ milestone: m, trackId, urgent: true, dueDate });
    });
  });

  // Then: first non-done milestone in each ACTIVE_FOCUS_TRACKS (by sequence)
  ACTIVE_FOCUS_TRACKS.forEach(trackId => {
    const milestones = QUEST_DATA[trackId] || [];
    for (const m of milestones) {
      const ms = getMilestoneState(m.id);
      if (ms.status !== 'done' && !results.find(r => r.milestone.id === m.id)) {
        results.push({ milestone: m, trackId, urgent: false });
        break; // Only the next one per track
      }
    }
  });

  return results.slice(0, limit);
}

// ---- DUE DATE SUPPORT ----
// Due date is stored in milestone state: state[milestoneId].dueDate = 'YYYY-MM-DD'
// Accessed via getMilestoneState / setMilestoneState (already supports arbitrary fields)
function setMilestoneDueDate(milestoneId, dateStr) {
  setMilestoneState(milestoneId, { dueDate: dateStr || null });
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTheme();
  initModalEvents();
  initDueDateModal();
  renderAllTracks();
  insertTrackArrows();
  updateCountdown();
  updateXPBar();
  setInterval(updateCountdown, 60000);
  initAddProjectModal();
  scheduleDepArrows();
  window.addEventListener('resize', () => {
    scheduleDepArrows();
    setTimeout(drawIntraTrackArrows, 100);
  });
});

// ---- DUE DATE EDIT MODAL ----
// Lightweight: triggered from quick-edit modal's due-date field
function initDueDateModal() {
  // Due date field already exists in modal HTML (#modalDueDate)
  // On modal save, persist due date alongside status
  // Patch saveModal to also save due date
  const origSaveModal = window.saveModal || saveModal;
  window.saveModal = function() {
    if (!currentMilestoneId) return;
    const activeBtnEl = document.querySelector('#statusButtons .status-btn.active-done') ||
                        document.querySelector('#statusButtons .status-btn.active-inprogress') ||
                        document.querySelector('#statusButtons .status-btn.active-pending');
    const newStatus = activeBtnEl?.getAttribute('data-status') || 'pending';
    const oldStatus = getMilestoneState(currentMilestoneId).status;
    const notes = document.getElementById('modalNotes').value;
    const dueDateEl = document.getElementById('modalDueDate');
    const dueDate = dueDateEl ? (dueDateEl.value || null) : null;
    const maxTimeEl = document.getElementById('modalMaxTime');
    const maxTime = maxTimeEl ? (maxTimeEl.value ? parseInt(maxTimeEl.value) : null) : null;

    setMilestoneState(currentMilestoneId, { status: newStatus, notes, dueDate, maxTime });
    renderAllTracks();
    updateXPBar();
    if (newStatus === 'done' && oldStatus !== 'done') triggerConfetti();
    closeModal();
  };
}

// ---- FOCUS MODE LAUNCHER (used by header button) ----
function openFocusMode() {
  // Try to find best step: Q1 deep first, then Q3 deep
  // Falls back to triage.js functions if available
  if (typeof getTodayQueue === 'function') {
    const queue = getTodayQueue();
    const today = typeof getTodayBlockState === 'function' ? getTodayBlockState() : {};
    const doneIds = new Set(today.completed_step_ids || []);
    const next = queue.find(q => !doneIds.has(q.stepId));
    if (next) {
      window.location.href = `focus.html?stepId=${encodeURIComponent(next.stepId)}&milestoneId=${encodeURIComponent(next.milestoneId)}`;
      return;
    }
  }
  // Fallback: open focus with no step pre-loaded
  window.location.href = 'focus.html';
}
window.openFocusMode = openFocusMode;

// ---- BLOCK STATE HELPERS (used before triage.js loads) ----
function getTodayBlocksDone() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const s = JSON.parse(localStorage.getItem('block_state_v1') || '{}');
    if (s.date === today) return s.completed_blocks || 0;
  } catch(e) {}
  return 0;
}
window.getTodayBlocksDone = getTodayBlocksDone;
