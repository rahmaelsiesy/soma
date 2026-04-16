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

function updateXPBar() {
  const xpBarFill = document.getElementById('xpBarFill');
  const levelBadge = document.getElementById('levelBadge');
  const xpLabel = document.getElementById('xpLabel');
  if (!xpBarFill || !levelBadge || !xpLabel) return;

  const xp = calculateTotalXP();
  const current = getCurrentLevel(xp);
  const next = getNextLevel(xp);
  const pct = next
    ? Math.round(((xp - current.xp_required) / (next.xp_required - current.xp_required)) * 100)
    : 100;

  levelBadge.textContent = `${current.emoji} Lv.${current.level} ${current.name}`;
  xpBarFill.style.width = pct + '%';
  xpLabel.textContent = next ? `${xp} / ${next.xp_required} XP` : `${xp} XP — MAX`;
}

// ---- COUNTDOWN ----
function updateCountdown() {
  const el = document.getElementById('countdownNum');
  if (!el) return;
  const target = new Date('2026-11-01T00:00:00');
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) { el.textContent = '🎓 Done!'; return; }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  el.textContent = months > 0 ? `${months}mo ${remDays}d` : `${days}d`;
}

// ---- RENDER BOARD ----
const TRACK_ORDER = ['flagship', 'methods', 'network', 'package', 'cursor', 'learning', 'career'];

function getAccentColor(category) {
  const map = {
    flagship: 'var(--c-flagship)',
    methods:  'var(--c-methods)',
    network:  'var(--c-network)',
    package:  'var(--c-package)',
    cursor:   'var(--c-cursor)',
    learning: 'var(--c-learning)',
    career:   'var(--c-career)',
  };
  return map[category] || 'var(--c-flagship)';
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

function renderAllTracks() {
  TRACK_ORDER.forEach(trackId => {
    const milestones = QUEST_DATA[trackId];
    if (milestones) renderTrack(trackId, milestones);
  });
  // Render custom projects
  renderCustomProjects();
  updateGlobalStats();
  updateXPBar();
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

  const colors = ['#f97316','#8b5cf6','#06b6d4','#10b981','#3b82f6','#f59e0b','#ec4899','#ffffff'];
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
  let theme = localStorage.getItem('theme') || 'dark';
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
function insertTrackArrows() {
  const board = document.querySelector('.board-container');
  if (!board) return;
  const tracks = board.querySelectorAll('section.track:not([data-custom])');
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

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTheme();
  initModalEvents();
  renderAllTracks();
  insertTrackArrows();
  updateCountdown();
  updateXPBar();
  setInterval(updateCountdown, 60000);
  initAddProjectModal();
});

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
