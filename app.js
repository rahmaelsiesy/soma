/* ============================================================
   NEURO-ATLAS — app.js
   Calm ADHD Quest Board — full application logic
   ============================================================ */

// ---- Constants ----
const ACTIVE_TRACKS = ['dlpfc', 'package', 'bd2', 'dg'];
const INACTIVE_TRACKS = ['fic', 'eef2', 'network', 'cursor', 'learning', 'career'];
const TRACK_COLORS = {
  dlpfc: '#c49a6c', package: '#7db88a', bd2: '#b07da8', dg: '#6ba3b5',
  fic: '#c49a6c', eef2: '#9a9a6c', network: '#9ca3af', cursor: '#6ba3b5',
  learning: '#8b8b96', career: '#9ca3af'
};
const TRACK_LABELS = {
  dlpfc: 'DLPFC AD Project', package: 'txomics Package', bd2: 'BD2 ACC', dg: 'DG Neurogenesis',
  fic: 'RUSH FIC AD', eef2: 'EEF2 Methods', network: 'Network & ML', cursor: 'Cursor Plan',
  learning: 'Learning Plan', career: 'Career Path'
};
const TYPE_COLORS = {
  code: '#7db88a', figure: '#b07da8', writing: '#c49a6c', lab: '#6ba3b5', wetlab: '#6ba3b5',
  career: '#9ca3af', paper: '#c49a6c', learning: '#8b8b96'
};
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const STORAGE_KEY = 'questboard_v3';

// ---- State ----
let state = loadState();
let timerInterval = null;
let timerRemaining = 0;
let timerTotal = 0;
let timerRunning = false;
let timerStepId = null;
let timerMilestoneId = null;
let timerIsWarmup = false;
let pendingNavHash = null;

// ---- State helpers ----
function defaultState() {
  return {
    steps: {},
    milestones: {},
    focusLog: [],
    weeklyPlan: { weekOf: null, blocks: {}, approved: false, focusProjects: [] },
    ideas: [],
    points: 0,
    streak: { current: 0, lastDate: null },
    dueDates: {},
    settings: { blocksPerDay: { min: 2, max: 4 }, blockDurationMin: 90, warmupDurationMin: 25, weeklyGoal: 10 },
    protocolChecks: {},
    lastAction: null
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const d = defaultState();
      return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) }, streak: { ...d.streak, ...(s.streak || {}) }, weeklyPlan: { ...d.weeklyPlan, ...(s.weeklyPlan || {}) } };
    }
  } catch (e) { console.warn('State load error', e); }
  return defaultState();
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { console.warn('State save error', e); }
}

function getStepState(stepId) {
  if (!state.steps[stepId]) state.steps[stepId] = { status: 'pending', blocksCompleted: 0, notes: '', checklist: {} };
  return state.steps[stepId];
}

function getMilestoneState(msId) {
  if (!state.milestones[msId]) state.milestones[msId] = { status: 'pending', notes: '' };
  return state.milestones[msId];
}

// ---- Date helpers ----
function todayStr() { return new Date().toISOString().slice(0, 10); }
function dayOfWeek() { return new Date().getDay(); } // 0=Sun
function formatDate(d) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}
function getWeekStart(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}
function isWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

// ---- Data helpers ----
function getAllSteps(milestoneId) {
  for (const track of Object.keys(QUEST_DATA)) {
    for (const ms of QUEST_DATA[track]) {
      if (ms.id === milestoneId) return ms.steps || [];
    }
  }
  return [];
}

function getMilestone(milestoneId) {
  for (const track of Object.keys(QUEST_DATA)) {
    for (const ms of QUEST_DATA[track]) {
      if (ms.id === milestoneId) return ms;
    }
  }
  return null;
}

function getTrackForMilestone(milestoneId) {
  for (const track of Object.keys(QUEST_DATA)) {
    for (const ms of QUEST_DATA[track]) {
      if (ms.id === milestoneId) return track;
    }
  }
  return null;
}

function getCurrentMilestone(trackId) {
  const milestones = QUEST_DATA[trackId] || [];
  for (const ms of milestones) {
    const msState = getMilestoneState(ms.id);
    if (msState.status !== 'done') return ms;
  }
  return milestones[milestones.length - 1] || null;
}

function getActiveStep(milestoneId) {
  const steps = getAllSteps(milestoneId);
  for (const step of steps) {
    const ss = getStepState(step.id);
    if (ss.status !== 'done') return step;
  }
  return null;
}

function getBlocksForStep(stepId) {
  return state.focusLog.filter(l => l.stepId === stepId).length;
}

function getBlocksForMilestone(milestoneId) {
  const steps = getAllSteps(milestoneId);
  return steps.reduce((sum, s) => sum + getBlocksForStep(s.id), 0);
}

function getTotalBlocksForMilestone(milestoneId) {
  const steps = getAllSteps(milestoneId);
  return steps.reduce((sum, s) => sum + (s.estimated_blocks || 1), 0);
}

function getMilestoneStepProgress(milestoneId) {
  const steps = getAllSteps(milestoneId);
  const done = steps.filter(s => getStepState(s.id).status === 'done').length;
  return `${done}/${steps.length}`;
}

function getTodayBlocks() {
  const today = todayStr();
  return state.focusLog.filter(l => l.date === today);
}

function getWeekBlocks(weekStart) {
  const ws = weekStart || getWeekStart(todayStr());
  const start = new Date(ws + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return state.focusLog.filter(l => {
    const d = new Date(l.date + 'T00:00:00');
    return d >= start && d < end;
  });
}

function getNextQueuedTask() {
  const focusProjects = state.weeklyPlan.focusProjects || [];
  const tracks = focusProjects.length > 0 ? focusProjects.filter(t => ACTIVE_TRACKS.includes(t)) : ACTIVE_TRACKS;
  for (const track of tracks) {
    const ms = getCurrentMilestone(track);
    if (!ms) continue;
    const step = getActiveStep(ms.id);
    if (step) return { track, milestone: ms, step };
  }
  return null;
}

// ---- Streak ----
function updateStreak() {
  const today = todayStr();
  if (!isWeekday(today)) return; // weekends don't affect streak
  const todayBlocks = getTodayBlocks().filter(l => !l.warmup);
  if (todayBlocks.length >= state.settings.blocksPerDay.min) {
    if (state.streak.lastDate === today) return;
    // Check if last streak date is previous weekday
    const d = new Date(today + 'T00:00:00');
    let prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    while (prev.getDay() === 0 || prev.getDay() === 6) prev.setDate(prev.getDate() - 1);
    const prevStr = prev.toISOString().slice(0, 10);
    if (state.streak.lastDate === prevStr || state.streak.current === 0) {
      state.streak.current++;
    } else {
      state.streak.current = 1;
    }
    state.streak.lastDate = today;
    saveState();
  }
}

// ---- Points ----
function awardPoints(isWarmup) {
  const todayBlocks = getTodayBlocks();
  const fullBlocksToday = todayBlocks.filter(l => !l.warmup).length;
  let pts = isWarmup ? 3 : 10;
  if (!isWarmup && fullBlocksToday > 2 && fullBlocksToday <= 4) pts += 5; // bonus for 3rd/4th
  state.points += pts;
  saveState();
  return pts;
}

// ---- Confetti ----
function showConfetti() {
  const container = document.getElementById('confettiContainer');
  container.innerHTML = '';
  const colors = ['#c49a6c', '#7db88a', '#b07da8', '#6ba3b5', '#d4a44c'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ''; }, 3000);
}

// ---- Router ----
function navigate(hash) {
  if (timerRunning && !hash.startsWith('#focus')) {
    pendingNavHash = hash;
    const mins = Math.ceil(timerRemaining / 60);
    document.getElementById('antiSwitchMsg').textContent = `You have ${mins} min left. Navigate away?`;
    document.getElementById('antiSwitchModal').classList.add('open');
    return;
  }
  window.location.hash = hash;
}

function handleRoute() {
  const hash = window.location.hash || '#home';
  const parts = hash.slice(1).split('/');
  const route = parts[0];

  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.nav === route || (route === 'path' && n.dataset.nav === 'projects') || (route === 'track' && n.dataset.nav === 'projects'));
  });

  switch (route) {
    case 'home': case '':
      renderHome();
      document.getElementById('view-home').classList.add('active');
      break;
    case 'projects':
      renderProjects();
      document.getElementById('view-projects').classList.add('active');
      break;
    case 'track':
      renderTrack(parts[1]);
      document.getElementById('view-track').classList.add('active');
      break;
    case 'path':
      renderPath(parts[1], parts[2]);
      document.getElementById('view-path').classList.add('active');
      break;
    case 'focus':
      renderFocus(parts[1], parts[2]);
      document.getElementById('view-focus').classList.add('active');
      break;
    case 'schedule':
      renderSchedule();
      document.getElementById('view-schedule').classList.add('active');
      break;
    case 'ideas':
      renderIdeas();
      document.getElementById('view-ideas').classList.add('active');
      break;
    case 'settings':
      renderSettings();
      document.getElementById('view-settings').classList.add('active');
      break;
    default:
      renderHome();
      document.getElementById('view-home').classList.add('active');
  }
}

// ---- SVG Icons (inline) ----
const ICONS = {
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M9 18l6-6-6-6"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
};

// ---- RENDER: Home ----
function renderHome() {
  const el = document.getElementById('view-home');
  const now = new Date();
  const dateStr = formatDate(now);
  const todayB = getTodayBlocks();
  const fullToday = todayB.filter(l => !l.warmup).length;
  const maxToday = state.settings.blocksPerDay.max;
  const weekStart = getWeekStart(todayStr());
  const weekB = getWeekBlocks(weekStart);
  const fullWeek = weekB.filter(l => !l.warmup).length;
  const weeklyGoal = state.settings.weeklyGoal || 10;
  const next = getNextQueuedTask();
  const allDoneToday = fullToday >= maxToday;

  let html = '';

  // Greeting
  html += `<div class="greeting-bar">
    <div class="greeting-date">${dateStr}</div>
    <div class="points-badge">${state.points} pts</div>
  </div>`;

  // Sunday prompt
  if (dayOfWeek() === 0 && !state.weeklyPlan.approved) {
    html += `<div class="sunday-prompt">Ready to plan next week? It takes 5 minutes. <a href="#schedule" style="color:var(--text-primary);text-decoration:underline;cursor:pointer;">Plan now</a></div>`;
  }

  // No plan nudge
  const hasPlan = state.weeklyPlan.approved && state.weeklyPlan.focusProjects && state.weeklyPlan.focusProjects.length > 0;
  if (!hasPlan && dayOfWeek() !== 0) {
    html += `<div class="no-plan-msg">No weekly plan yet. <a onclick="navigate('#schedule')">Pick your focus for the week</a></div>`;
  }

  // Start next block button
  if (allDoneToday) {
    html += `<div class="done-msg">You've done enough today. Rest is productive too.</div>`;
  } else if (next) {
    const color = TRACK_COLORS[next.track];
    const label = next.step.title.length > 50 ? next.step.title.slice(0, 47) + '...' : next.step.title;
    html += `<button class="start-block-btn" style="background:${color}" onclick="navigate('#focus/${next.milestone.id}/${next.step.id}')">
      <span class="btn-label-sm">Start next block</span>
      <span>${label}</span>
    </button>`;
  } else {
    html += `<div class="done-msg" style="background:rgba(255,255,255,0.03);border-color:var(--border);">No active tasks queued. Check your <a onclick="navigate('#projects')" style="color:var(--text-primary);text-decoration:underline;cursor:pointer;">projects</a>.</div>`;
  }

  // Today's blocks
  html += `<div class="block-section">
    <div class="block-section-label">Today</div>
    <div class="block-circles">`;
  for (let i = 0; i < maxToday; i++) {
    if (i < todayB.length) {
      const log = todayB[i];
      const color = TRACK_COLORS[getTrackForMilestone(log.milestoneId)] || '#5a5a66';
      html += `<div class="block-circle filled" style="background:${color}"></div>`;
    } else {
      html += `<div class="block-circle"></div>`;
    }
  }
  html += `</div></div>`;

  // Weekly blocks — circles
  html += `<div class="block-section">
    <div class="block-section-label">This week</div>
    <div class="block-circles">`;
  const totalCircles = Math.max(weeklyGoal, fullWeek);
  for (let i = 0; i < totalCircles; i++) {
    if (i < weekB.length) {
      if (i >= weeklyGoal) {
        html += `<div class="block-circle bonus"></div>`;
      } else {
        const log = weekB[i];
        const color = TRACK_COLORS[getTrackForMilestone(log.milestoneId)] || '#5a5a66';
        html += `<div class="block-circle filled" style="background:${color}"></div>`;
      }
    } else if (i < weeklyGoal) {
      html += `<div class="block-circle"></div>`;
    }
  }
  html += `</div></div>`;

  // Where was I
  if (state.lastAction) {
    html += `<div class="where-was-i">Last: ${state.lastAction}</div>`;
  }

  // Streak
  if (state.streak.current > 0) {
    html += `<div class="streak-line">${state.streak.current}-day streak</div>`;
  }

  el.innerHTML = html;
}

// ---- RENDER: Projects ----
function renderProjects() {
  const el = document.getElementById('view-projects');
  let html = '<div class="section-title">Projects</div>';

  // Active
  for (const track of ACTIVE_TRACKS) {
    const ms = getCurrentMilestone(track);
    const color = TRACK_COLORS[track];
    const label = TRACK_LABELS[track];
    const msTitle = ms ? ms.title : 'Complete';
    const progress = ms ? getMilestoneStepProgress(ms.id) : '--';
    html += `<div class="project-card" onclick="navigate('#track/${track}')">
      <span class="dot" style="background:${color}"></span>
      <span class="proj-name">${label}</span>
      <span class="proj-milestone">${msTitle}</span>
      <span class="proj-progress">${progress}</span>
    </div>`;
  }

  // Archive toggle
  html += `<div class="archive-toggle" id="archiveToggle" onclick="toggleArchive()">
    ${ICONS.chevronRight}
    <span>${INACTIVE_TRACKS.length} archived projects</span>
  </div>`;
  html += `<div class="archive-list" id="archiveList" style="display:none;">`;
  for (const track of INACTIVE_TRACKS) {
    const ms = getCurrentMilestone(track);
    const color = TRACK_COLORS[track];
    const label = TRACK_LABELS[track];
    const msTitle = ms ? ms.title : 'Complete';
    html += `<div class="project-card" onclick="navigate('#track/${track}')">
      <span class="dot" style="background:${color}"></span>
      <span class="proj-name">${label}</span>
      <span class="proj-milestone">${msTitle}</span>
    </div>`;
  }
  html += `</div>`;

  // Protocol timeline
  if (typeof PROTOCOL_PHASES !== 'undefined') {
    html += `<div class="protocol-section">
      <div class="protocol-title">Protocol Timeline (parallel)</div>`;
    for (const phase of PROTOCOL_PHASES) {
      html += `<div class="protocol-phase">
        <div class="protocol-phase-name">${phase.name}</div>`;
      for (const step of phase.steps) {
        const checked = state.protocolChecks && state.protocolChecks[step.id] ? 'checked' : '';
        html += `<div class="protocol-step">
          <input type="checkbox" class="proto-cb" data-proto-id="${step.id}" ${checked}>
          <span>${step.name}</span>
        </div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
  }

  el.innerHTML = html;

  // Protocol checkbox listeners
  el.querySelectorAll('.proto-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (!state.protocolChecks) state.protocolChecks = {};
      state.protocolChecks[cb.dataset.protoId] = cb.checked;
      saveState();
    });
  });
}

function toggleArchive() {
  const list = document.getElementById('archiveList');
  const toggle = document.getElementById('archiveToggle');
  const open = list.style.display === 'none';
  list.style.display = open ? 'block' : 'none';
  toggle.classList.toggle('open', open);
}

// ---- RENDER: Track ----
function renderTrack(trackId) {
  const el = document.getElementById('view-track');
  const milestones = QUEST_DATA[trackId] || [];
  const color = TRACK_COLORS[trackId];
  const label = TRACK_LABELS[trackId];

  let html = `<div class="track-header">
    <button class="back-btn" onclick="navigate('#projects')">${ICONS.arrowLeft}</button>
    <div class="track-title"><span class="dot" style="background:${color}"></span> ${label}</div>
  </div>`;

  for (const ms of milestones) {
    const msState = getMilestoneState(ms.id);
    const progress = getMilestoneStepProgress(ms.id);
    const blocksLogged = getBlocksForMilestone(ms.id);
    const totalBlocks = getTotalBlocksForMilestone(ms.id);
    const statusClass = msState.status === 'done' ? ' status-done' : '';
    html += `<div class="milestone-card${statusClass}" onclick="navigate('#path/${trackId}/${ms.id}')">
      <span class="dot" style="background:${color};width:6px;height:6px;"></span>
      <span class="ms-name">${ms.title}</span>
      <span class="ms-progress">${blocksLogged}/${totalBlocks} blocks</span>
    </div>`;
  }

  el.innerHTML = html;
}

// ---- RENDER: Path (board game) ----
function renderPath(trackId, milestoneId) {
  const el = document.getElementById('view-path');
  const ms = getMilestone(milestoneId);
  if (!ms) { el.innerHTML = '<p>Milestone not found.</p>'; return; }
  const track = trackId || getTrackForMilestone(milestoneId);
  const color = TRACK_COLORS[track];
  const steps = ms.steps || [];
  const blocksLogged = getBlocksForMilestone(milestoneId);
  const totalBlocks = getTotalBlocksForMilestone(milestoneId);

  let html = `<div class="path-header">
    <button class="back-btn" onclick="navigate('#track/${track}')">${ICONS.arrowLeft}</button>
    <div class="path-title"><span class="dot" style="background:${color}"></span> ${ms.title}</div>
  </div>
  <div class="path-progress-text">${blocksLogged} / ${totalBlocks} blocks logged</div>
  <div class="winding-path">`;

  const activeStep = getActiveStep(milestoneId);

  steps.forEach((step, idx) => {
    const ss = getStepState(step.id);
    const side = idx % 2 === 0 ? 'left' : 'right';
    const estBlocks = step.estimated_blocks || 1;
    const completed = getBlocksForStep(step.id);
    const isActive = activeStep && activeStep.id === step.id;
    const statusClass = ss.status === 'done' ? 'status-done' : (isActive ? 'status-active' : (ss.status === 'locked' ? 'status-locked' : ''));
    const typeBadge = step.type ? `<span class="badge badge-type" style="color:${TYPE_COLORS[step.type] || '#8b8b96'}">${step.type}</span>` : '';

    // Due date indicator
    let dueIndicator = '';
    if (state.dueDates[step.id]) {
      const dueDate = new Date(state.dueDates[step.id] + 'T00:00:00');
      const daysLeft = Math.ceil((dueDate - new Date()) / 86400000);
      if (daysLeft < 3) dueIndicator = ' due-urgent';
      else if (daysLeft < 14) dueIndicator = ' due-soon';
    }

    html += `<div class="path-node">
      <div class="path-step ${side} ${statusClass}${dueIndicator}" style="--step-accent:${color}" onclick="openStepDrawer('${step.id}','${milestoneId}','${track}')">
        ${isActive ? `<div class="game-piece" style="background:${color}"></div>` : ''}
        <div class="step-num">Step ${idx + 1}</div>
        <div class="step-title-text">${step.title}</div>
        <div class="step-meta">
          ${typeBadge}
          <div class="step-block-dots">`;
    for (let b = 0; b < estBlocks; b++) {
      html += `<div class="step-block-dot${b < completed ? ' filled' : ''}"></div>`;
    }
    html += `</div>
          ${ss.status === 'done' ? `<span class="done-check">${ICONS.check}</span>` : ''}
        </div>
      </div>`;
    if (idx < steps.length - 1) html += `<div class="path-connector"></div>`;
    html += `</div>`;
  });

  // Gate card
  if (ms.gate) {
    html += `<div class="path-connector"></div>
    <div class="gate-card">
      <h4>${ms.gate.title}</h4>`;
    for (const item of ms.gate.items) {
      html += `<div class="gate-item">${item}</div>`;
    }
    html += `</div>`;
  }

  // Reward card
  if (ms.reward) {
    html += `<div class="path-connector"></div>
    <div class="reward-card">
      <div class="reward-text">${ms.reward}</div>
    </div>`;
  }

  html += `</div>`; // winding-path
  el.innerHTML = html;
}

// ---- Step Drawer ----
function openStepDrawer(stepId, milestoneId, track) {
  const ms = getMilestone(milestoneId);
  if (!ms) return;
  const step = (ms.steps || []).find(s => s.id === stepId);
  if (!step) return;
  const ss = getStepState(stepId);
  const color = TRACK_COLORS[track];

  let html = `<button class="drawer-close" onclick="closeDrawer()">${ICONS.x}</button>
    <h3>${step.title}</h3>
    <div class="drawer-desc">${step.desc || ''}</div>`;

  // Focus button
  html += `<button class="btn btn-primary" style="background:${color};width:100%;margin-bottom:16px;" onclick="closeDrawer();navigate('#focus/${milestoneId}/${stepId}')">
    ${ICONS.play} Start Focus
  </button>`;

  // Checklist
  if (step.checklist && step.checklist.length > 0) {
    html += `<div class="drawer-section-title">Checklist</div><div class="drawer-checklist">`;
    step.checklist.forEach((item, i) => {
      const checked = ss.checklist && ss.checklist[i] ? 'checked' : '';
      html += `<label><input type="checkbox" class="drawer-cb" data-step="${stepId}" data-idx="${i}" ${checked}><span>${item}</span></label>`;
    });
    html += `</div>`;
  }

  // Notes
  html += `<div class="drawer-section-title">Notes</div>
    <textarea class="drawer-notes" id="drawerNotes" placeholder="Your notes...">${ss.notes || ''}</textarea>`;

  // Due date
  html += `<div class="drawer-section-title">Due date</div>
    <input type="date" class="drawer-due-date" id="drawerDue" value="${state.dueDates[stepId] || ''}">`;

  // Mark done
  if (ss.status !== 'done') {
    html += `<button class="btn btn-outline" style="width:100%;margin-top:16px;" onclick="markStepDone('${stepId}','${milestoneId}')">Mark as done</button>`;
  }

  const drawer = document.getElementById('drawer');
  drawer.innerHTML = html;
  document.getElementById('drawerOverlay').classList.add('open');

  // Listeners
  drawer.querySelectorAll('.drawer-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const sid = cb.dataset.step;
      const idx = parseInt(cb.dataset.idx);
      const s = getStepState(sid);
      if (!s.checklist) s.checklist = {};
      s.checklist[idx] = cb.checked;
      saveState();
    });
  });
  const notesEl = document.getElementById('drawerNotes');
  if (notesEl) {
    notesEl.addEventListener('input', () => {
      getStepState(stepId).notes = notesEl.value;
      saveState();
    });
  }
  const dueEl = document.getElementById('drawerDue');
  if (dueEl) {
    dueEl.addEventListener('change', () => {
      if (dueEl.value) state.dueDates[stepId] = dueEl.value;
      else delete state.dueDates[stepId];
      saveState();
    });
  }
}

function closeDrawer() {
  document.getElementById('drawerOverlay').classList.remove('open');
}

function markStepDone(stepId, milestoneId) {
  const ss = getStepState(stepId);
  ss.status = 'done';
  // Check if all steps done → milestone done
  const steps = getAllSteps(milestoneId);
  const allDone = steps.every(s => getStepState(s.id).status === 'done');
  if (allDone) {
    getMilestoneState(milestoneId).status = 'done';
    showConfetti();
  }
  const track = getTrackForMilestone(milestoneId);
  const ms = getMilestone(milestoneId);
  state.lastAction = `${TRACK_LABELS[track]} → ${ms ? ms.title : ''} → done`;
  saveState();
  closeDrawer();
  handleRoute();
}

// ---- RENDER: Focus ----
function renderFocus(milestoneId, stepId) {
  const el = document.getElementById('view-focus');

  // If no params, get next queued
  if (!milestoneId || !stepId) {
    const next = getNextQueuedTask();
    if (next) { milestoneId = next.milestone.id; stepId = next.step.id; }
    else { el.innerHTML = '<div class="focus-view"><p style="color:var(--text-muted)">No task queued. Pick a project first.</p></div>'; return; }
  }

  const ms = getMilestone(milestoneId);
  const step = ms ? (ms.steps || []).find(s => s.id === stepId) : null;
  if (!ms || !step) { el.innerHTML = '<div class="focus-view"><p style="color:var(--text-muted)">Task not found.</p></div>'; return; }

  const track = getTrackForMilestone(milestoneId);
  const color = TRACK_COLORS[track];
  const blocksOnStep = getBlocksForStep(stepId);
  const estBlocks = step.estimated_blocks || null;
  const todayFull = getTodayBlocks().filter(l => !l.warmup).length;
  const maxToday = state.settings.blocksPerDay.max;
  const tooMany = todayFull >= maxToday;

  timerStepId = stepId;
  timerMilestoneId = milestoneId;

  const isWarmup = timerIsWarmup;
  const duration = isWarmup ? state.settings.warmupDurationMin : state.settings.blockDurationMin;
  if (!timerRunning) {
    timerTotal = duration * 60;
    timerRemaining = timerTotal;
  }

  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  let html = `<div class="focus-view">
    <div class="focus-breadcrumb">${TRACK_LABELS[track]} → ${ms.title}</div>
    <div class="focus-step-title">${step.title}</div>

    <div class="timer-ring">
      <svg viewBox="0 0 180 180">
        <circle class="ring-bg" cx="90" cy="90" r="${radius}"/>
        <circle class="ring-fill" id="timerRing" cx="90" cy="90" r="${radius}"
          stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="0"/>
      </svg>
      <div class="timer-time" id="timerDisplay">${formatTime(timerRemaining)}</div>
    </div>

    <div class="focus-block-info" id="focusBlockInfo">Block ${blocksOnStep + 1}${estBlocks ? ` of ~${estBlocks}` : ''}</div>

    <div class="focus-toggle">
      <button class="${!timerIsWarmup ? 'active' : ''}" onclick="setTimerMode(false)">Full (${state.settings.blockDurationMin}m)</button>
      <button class="${timerIsWarmup ? 'active' : ''}" onclick="setTimerMode(true)">Warm-up (${state.settings.warmupDurationMin}m)</button>
    </div>

    <div class="focus-controls">
      <button class="btn btn-primary" style="background:${color};padding:8px 24px;" id="timerStartBtn" onclick="toggleTimer()">${timerRunning ? 'Pause' : 'Start'}</button>
      <button class="btn btn-outline" onclick="resetTimer()">Reset</button>
    </div>`;

  if (tooMany) {
    html += `<div class="focus-done-msg">You've done great today. Rest is productive too.</div>`;
  }

  html += `</div>`;
  el.innerHTML = html;

  // Update ring position if timer is mid-run
  updateTimerRing();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function setTimerMode(warmup) {
  if (timerRunning) return;
  timerIsWarmup = warmup;
  const duration = warmup ? state.settings.warmupDurationMin : state.settings.blockDurationMin;
  timerTotal = duration * 60;
  timerRemaining = timerTotal;
  const display = document.getElementById('timerDisplay');
  if (display) display.textContent = formatTime(timerRemaining);
  updateTimerRing();
  // Update toggle buttons
  document.querySelectorAll('.focus-toggle button').forEach((btn, i) => {
    btn.classList.toggle('active', i === (warmup ? 1 : 0));
  });
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    const btn = document.getElementById('timerStartBtn');
    if (btn) btn.textContent = 'Start';
  } else {
    timerRunning = true;
    const btn = document.getElementById('timerStartBtn');
    if (btn) btn.textContent = 'Pause';
    timerInterval = setInterval(timerTick, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  const duration = timerIsWarmup ? state.settings.warmupDurationMin : state.settings.blockDurationMin;
  timerTotal = duration * 60;
  timerRemaining = timerTotal;
  const display = document.getElementById('timerDisplay');
  if (display) display.textContent = formatTime(timerRemaining);
  updateTimerRing();
  const btn = document.getElementById('timerStartBtn');
  if (btn) btn.textContent = 'Start';
}

function timerTick() {
  timerRemaining--;
  if (timerRemaining <= 0) {
    timerRemaining = 0;
    clearInterval(timerInterval);
    timerRunning = false;
    completeBlock();
  }
  const display = document.getElementById('timerDisplay');
  if (display) display.textContent = formatTime(timerRemaining);
  updateTimerRing();
}

function updateTimerRing() {
  const ring = document.getElementById('timerRing');
  if (!ring) return;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = timerTotal > 0 ? (timerTotal - timerRemaining) / timerTotal : 0;
  ring.setAttribute('stroke-dashoffset', circumference * (1 - progress));
}

function completeBlock() {
  // Log the block
  const logEntry = {
    date: todayStr(),
    stepId: timerStepId,
    milestoneId: timerMilestoneId,
    blocks: 1,
    warmup: timerIsWarmup,
    timestamp: Date.now()
  };
  state.focusLog.push(logEntry);

  // Update step state
  const ss = getStepState(timerStepId);
  ss.blocksCompleted = (ss.blocksCompleted || 0) + 1;
  if (ss.status !== 'done') ss.status = 'active';

  // Check if step is "done" based on blocks
  const ms = getMilestone(timerMilestoneId);
  const step = ms ? (ms.steps || []).find(s => s.id === timerStepId) : null;
  if (step && step.estimated_blocks && ss.blocksCompleted >= step.estimated_blocks) {
    // Don't auto-complete, but mark as ready
  }

  // Award points
  const pts = awardPoints(timerIsWarmup);

  // Update streak
  updateStreak();

  // Last action
  const track = getTrackForMilestone(timerMilestoneId);
  state.lastAction = `${TRACK_LABELS[track]} → ${ms ? ms.title : ''} → ${step ? step.title : ''}`;
  saveState();

  // Show points popup
  showPointsPopup(pts);

  // Re-render focus
  const hash = window.location.hash;
  if (hash.startsWith('#focus')) {
    renderFocus(timerMilestoneId, timerStepId);
  }
}

function showPointsPopup(pts) {
  const popup = document.createElement('div');
  popup.className = 'points-popup';
  const todayFull = getTodayBlocks().filter(l => !l.warmup).length;
  const isBonus = todayFull > 2;
  popup.textContent = isBonus ? `+${pts} pts (bonus)` : `+${pts} pts`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2200);
}

// ---- RENDER: Schedule ----
function renderSchedule() {
  const el = document.getElementById('view-schedule');
  const currentTab = el.dataset.tab || 'plan';

  let html = `<div class="section-title">Schedule</div>
    <div class="schedule-tabs">
      <div class="schedule-tab${currentTab === 'plan' ? ' active' : ''}" onclick="switchScheduleTab('plan')">Plan</div>
      <div class="schedule-tab${currentTab === 'review' ? ' active' : ''}" onclick="switchScheduleTab('review')">Review</div>
    </div>`;

  if (currentTab === 'review') {
    html += renderScheduleReview();
  } else {
    html += renderSchedulePlan();
  }

  el.innerHTML = html;
  el.dataset.tab = currentTab;

  // Add listeners for focus project toggles
  el.querySelectorAll('.focus-proj-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const track = toggle.dataset.track;
      let fps = state.weeklyPlan.focusProjects || [];
      if (fps.includes(track)) {
        fps = fps.filter(t => t !== track);
      } else {
        fps.push(track);
      }
      state.weeklyPlan.focusProjects = fps;
      saveState();
      renderSchedule();
    });
  });
}

function switchScheduleTab(tab) {
  const el = document.getElementById('view-schedule');
  el.dataset.tab = tab;
  renderSchedule();
}

function renderScheduleReview() {
  // Show this week's data (more useful in practice)
  const thisWeekStart = getWeekStart(todayStr());
  const weekBlocks = getWeekBlocks(thisWeekStart);
  const fullBlocks = weekBlocks.filter(l => !l.warmup);
  const weeklyGoal = state.settings.weeklyGoal || 10;
  const totalHours = Math.round(fullBlocks.length * state.settings.blockDurationMin / 60 * 10) / 10;

  // Also check last week
  const d = new Date(thisWeekStart + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  const prevWeekStart = d.toISOString().slice(0, 10);
  const lastWeekBlocks = getWeekBlocks(prevWeekStart);
  const lastWeekFull = lastWeekBlocks.filter(l => !l.warmup);

  let html = `<div class="review-summary">This week: ${fullBlocks.length} / ${weeklyGoal} blocks completed</div>`;

  // Per-project breakdown
  const breakdown = {};
  for (const log of weekBlocks) {
    const track = getTrackForMilestone(log.milestoneId) || 'unknown';
    breakdown[track] = (breakdown[track] || 0) + 1;
  }
  if (Object.keys(breakdown).length > 0) {
    html += `<div class="review-breakdown">`;
    for (const [track, count] of Object.entries(breakdown)) {
      const color = TRACK_COLORS[track] || '#5a5a66';
      html += `<div class="review-breakdown-item"><span class="dot" style="background:${color}"></span> ${TRACK_LABELS[track] || track}: ${count} blocks</div>`;
    }
    html += `</div>`;
  }

  // Morale
  if (totalHours > 0) {
    html += `<div class="morale-msg">You've spent ${totalHours} hours in deep focus this week. That's meaningful progress.</div>`;
  }

  // Last week summary
  if (lastWeekFull.length > 0) {
    html += `<div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);">
      <div class="review-summary" style="font-size:13px;color:var(--text-muted);">Last week: ${lastWeekFull.length} / ${weeklyGoal} blocks</div>
    </div>`;
  }

  return html;
}

function renderSchedulePlan() {
  const fps = state.weeklyPlan.focusProjects || [];
  const weeklyGoal = state.settings.weeklyGoal || 10;

  let html = `<div class="focus-picker">
    <h4>Which projects will you focus on this week?</h4>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Pick 1–2 to reduce context switching. Only selected projects appear in your daily queue.</p>`;

  for (const track of ACTIVE_TRACKS) {
    const color = TRACK_COLORS[track];
    const label = TRACK_LABELS[track];
    const selected = fps.includes(track);
    const ms = getCurrentMilestone(track);
    const msTitle = ms ? ms.title : 'Complete';
    html += `<div class="focus-proj-toggle${selected ? ' selected' : ''}" data-track="${track}" style="${selected ? `border-color:${color}` : ''}">
      <span class="dot" style="background:${color}"></span>
      <span class="fp-name">${label}</span>
      <span style="font-size:11px;color:var(--text-muted);flex:1;text-align:right;">${msTitle}</span>
    </div>`;
  }
  html += `</div>`;

  // Plan grid
  if (fps.length > 0) {
    html += generatePlanGrid(fps, weeklyGoal);
    if (!state.weeklyPlan.approved) {
      html += `<button class="btn btn-primary approve-plan-btn" style="width:100%;" onclick="approvePlan()">Approve plan</button>`;
    } else {
      html += `<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:8px;">Plan approved for this week</div>`;
    }
  } else {
    html += `<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:24px;">Select at least one project to generate a plan.</div>`;
  }

  return html;
}

function generatePlanGrid(focusProjects, weeklyGoal) {
  const blocksPerDay = Math.floor(weeklyGoal / 5);
  const flexTotal = Math.max(0, Math.floor(weeklyGoal * 0.2));
  const hardBlocks = weeklyGoal - flexTotal;
  const hardPerDay = Math.ceil(hardBlocks / 5);
  const flexPerDay = Math.ceil(flexTotal / 5);

  // Gather steps from focus projects
  const taskQueue = [];
  for (const track of focusProjects) {
    const ms = getCurrentMilestone(track);
    if (!ms) continue;
    const steps = ms.steps || [];
    for (const step of steps) {
      const ss = getStepState(step.id);
      if (ss.status === 'done') continue;
      const remaining = Math.max(0, (step.estimated_blocks || 1) - (ss.blocksCompleted || 0));
      for (let i = 0; i < remaining; i++) {
        taskQueue.push({ track, milestoneId: ms.id, stepId: step.id, stepTitle: step.title });
      }
    }
  }

  let html = `<div class="plan-grid">`;
  let taskIdx = 0;
  for (let d = 0; d < 5; d++) {
    html += `<div class="plan-day"><div class="plan-day-name">${DAYS[d]}</div>`;
    for (let b = 0; b < hardPerDay && b < blocksPerDay; b++) {
      if (taskIdx < taskQueue.length) {
        const t = taskQueue[taskIdx];
        const color = TRACK_COLORS[t.track];
        const shortTitle = t.stepTitle.length > 20 ? t.stepTitle.slice(0, 18) + '..' : t.stepTitle;
        html += `<div class="plan-slot"><span class="dot" style="background:${color}"></span>${shortTitle}</div>`;
        taskIdx++;
      }
    }
    if (d < 5 && flexPerDay > 0 && d < flexTotal) {
      html += `<div class="plan-slot flex-slot">flex</div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

function approvePlan() {
  state.weeklyPlan.approved = true;
  state.weeklyPlan.weekOf = getWeekStart(todayStr());
  saveState();
  renderSchedule();
}

// ---- RENDER: Ideas ----
function renderIdeas() {
  const el = document.getElementById('view-ideas');
  let html = `<div class="section-title">Ideas</div>
    <div class="idea-input-wrap">
      <input class="idea-input" id="ideaInput" placeholder="What's on your mind?" onkeydown="if(event.key==='Enter')addIdea()">
      <button class="btn btn-outline" onclick="addIdea()">Add</button>
    </div>
    <div id="ideaList">`;

  const ideas = (state.ideas || []).slice().sort((a, b) => b.createdAt - a.createdAt);
  for (const idea of ideas) {
    html += `<div class="idea-card">
      <div class="idea-text">${escapeHtml(idea.text)}</div>
      <div class="idea-meta">
        <span class="idea-time">${timeAgo(idea.createdAt)}</span>
        ${idea.promoted ? '<span class="badge">promoted</span>' : `<button class="idea-promote" onclick="promoteIdea('${idea.id}')">Promote to step</button>`}
      </div>
    </div>`;
  }

  html += `</div>`;
  el.innerHTML = html;
}

function addIdea() {
  const input = document.getElementById('ideaInput');
  const text = (input.value || '').trim();
  if (!text) return;
  state.ideas.push({ id: 'idea-' + Date.now(), text, createdAt: Date.now(), promoted: false });
  saveState();
  input.value = '';
  renderIdeas();
}

function promoteIdea(ideaId) {
  // Simple promotion — just mark as promoted
  const idea = state.ideas.find(i => i.id === ideaId);
  if (idea) { idea.promoted = true; saveState(); renderIdeas(); }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- RENDER: Settings ----
function renderSettings() {
  const el = document.getElementById('view-settings');
  const s = state.settings;

  let html = `<div class="section-title">Settings</div>

    <div class="settings-group">
      <h4>Focus blocks</h4>
      <div class="setting-row">
        <span class="setting-label">Full block duration (min)</span>
        <input class="setting-input" type="number" id="settingBlockDur" value="${s.blockDurationMin}" min="15" max="180">
      </div>
      <div class="setting-row">
        <span class="setting-label">Warm-up duration (min)</span>
        <input class="setting-input" type="number" id="settingWarmupDur" value="${s.warmupDurationMin}" min="5" max="60">
      </div>
      <div class="setting-row">
        <span class="setting-label">Min blocks per day</span>
        <input class="setting-input" type="number" id="settingMinBlocks" value="${s.blocksPerDay.min}" min="1" max="6">
      </div>
      <div class="setting-row">
        <span class="setting-label">Max blocks per day</span>
        <input class="setting-input" type="number" id="settingMaxBlocks" value="${s.blocksPerDay.max}" min="1" max="8">
      </div>
      <div class="setting-row">
        <span class="setting-label">Weekly goal (blocks)</span>
        <input class="setting-input" type="number" id="settingWeeklyGoal" value="${s.weeklyGoal || 10}" min="1" max="30">
      </div>
    </div>

    <div class="settings-group">
      <h4>Data</h4>
      <div class="setting-row">
        <span class="setting-label">Total points earned</span>
        <span style="font-size:13px;color:var(--text-primary)">${state.points}</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">Total blocks logged</span>
        <span style="font-size:13px;color:var(--text-primary)">${state.focusLog.length}</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">Current streak</span>
        <span style="font-size:13px;color:var(--text-primary)">${state.streak.current} days</span>
      </div>
    </div>

    <div class="settings-group">
      <button class="btn btn-outline" style="width:100%;" onclick="resetAllData()">Reset all data</button>
    </div>`;

  el.innerHTML = html;

  // Save on change
  ['settingBlockDur', 'settingWarmupDur', 'settingMinBlocks', 'settingMaxBlocks', 'settingWeeklyGoal'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('change', saveSettings);
  });
}

function saveSettings() {
  state.settings.blockDurationMin = parseInt(document.getElementById('settingBlockDur')?.value) || 90;
  state.settings.warmupDurationMin = parseInt(document.getElementById('settingWarmupDur')?.value) || 25;
  state.settings.blocksPerDay.min = parseInt(document.getElementById('settingMinBlocks')?.value) || 2;
  state.settings.blocksPerDay.max = parseInt(document.getElementById('settingMaxBlocks')?.value) || 4;
  state.settings.weeklyGoal = parseInt(document.getElementById('settingWeeklyGoal')?.value) || 10;
  saveState();
}

function resetAllData() {
  if (confirm('Reset all progress? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    handleRoute();
  }
}

// ---- Navigation events ----
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const nav = item.dataset.nav;
    if (nav) navigate('#' + nav);
  });
});

// Anti-switch modal
document.getElementById('modalStay').addEventListener('click', () => {
  document.getElementById('antiSwitchModal').classList.remove('open');
  pendingNavHash = null;
});
document.getElementById('modalLeave').addEventListener('click', () => {
  document.getElementById('antiSwitchModal').classList.remove('open');
  clearInterval(timerInterval);
  timerRunning = false;
  if (pendingNavHash) {
    window.location.hash = pendingNavHash;
    pendingNavHash = null;
  }
});

// Drawer close on overlay click
document.getElementById('drawerOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('drawerOverlay')) closeDrawer();
});

// Hash change
window.addEventListener('hashchange', handleRoute);

// Weekly plan auto-reset check
(function checkWeeklyPlanReset() {
  const currentWeek = getWeekStart(todayStr());
  if (state.weeklyPlan.weekOf && state.weeklyPlan.weekOf !== currentWeek) {
    state.weeklyPlan.approved = false;
    state.weeklyPlan.blocks = {};
    // Keep focusProjects so user remembers their choices
    saveState();
  }
})();

// Init
handleRoute();
