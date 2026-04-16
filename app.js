/* ============================================================
   SOMA — app.js
   Calm ADHD focus tracker
   Features: F1 step edit/reorder, F2 editable names+tags,
             F3 urgency flags, F4 backward scheduling,
             F5 admin tab, F6 prep/batch system
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
    lastAction: null,
    // Feature 1: custom steps per milestone
    customSteps: {},
    // Feature 2: track name/tag overrides
    trackOverrides: {},
    // Feature 3: urgency flags
    urgency: {},
    // Feature 5: admin tasks
    adminTasks: [],
    // Feature 6: prep batches
    prepBatches: [],
    // Feature 9: rewards
    rewards: { tiers: {}, claimedHistory: [] },
    // Feature 11: weekly reviews
    weeklyReviews: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const d = defaultState();
      return {
        ...d, ...s,
        settings: { ...d.settings, ...(s.settings || {}) },
        streak: { ...d.streak, ...(s.streak || {}) },
        weeklyPlan: { ...d.weeklyPlan, ...(s.weeklyPlan || {}) },
        customSteps: s.customSteps || {},
        trackOverrides: s.trackOverrides || {},
        urgency: s.urgency || {},
        adminTasks: s.adminTasks || [],
        prepBatches: s.prepBatches || [],
        rewards: s.rewards || { tiers: {}, claimedHistory: [] },
        weeklyReviews: s.weeklyReviews || []
      };
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
function dayOfWeek() { return new Date().getDay(); }
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
function weeksUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diff = (target - now) / (1000 * 60 * 60 * 24 * 7);
  return Math.max(0, diff);
}

// ---- Data helpers ----
// Feature 1: merged steps (base + custom)
function getAllSteps(milestoneId) {
  let baseSteps = [];
  for (const track of Object.keys(QUEST_DATA)) {
    for (const ms of QUEST_DATA[track]) {
      if (ms.id === milestoneId) { baseSteps = ms.steps || []; break; }
    }
    if (baseSteps.length) break;
  }
  const custom = state.customSteps[milestoneId] || [];
  return [...baseSteps, ...custom];
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

function getRemainingBlocksForMilestone(milestoneId) {
  const steps = getAllSteps(milestoneId);
  return steps.reduce((sum, s) => {
    const ss = getStepState(s.id);
    if (ss.status === 'done') return sum;
    const est = s.estimated_blocks || 1;
    const done = ss.blocksCompleted || 0;
    return sum + Math.max(0, est - done);
  }, 0);
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

// Feature 2: get effective track label
function getTrackLabel(trackId) {
  const override = state.trackOverrides[trackId];
  if (override && override.label) return override.label;
  return TRACK_LABELS[trackId] || trackId;
}

// Feature 3: get urgency for item
function getUrgency(itemId) {
  return state.urgency[itemId] || null;
}

// ---- Streak ----
function updateStreak() {
  const today = todayStr();
  if (!isWeekday(today)) return;
  const todayBlocks = getTodayBlocks().filter(l => !l.warmup);
  if (todayBlocks.length >= state.settings.blocksPerDay.min) {
    if (state.streak.lastDate === today) return;
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
  if (!isWarmup && fullBlocksToday > 2 && fullBlocksToday <= 4) pts += 5;
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

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  document.querySelectorAll('.nav-item').forEach(n => {
    const active =
      n.dataset.nav === route ||
      (route === 'path' && n.dataset.nav === 'projects') ||
      (route === 'track' && n.dataset.nav === 'projects');
    n.classList.toggle('active', active);
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
    case 'admin':
      renderAdmin();
      document.getElementById('view-admin').classList.add('active');
      break;
    case 'prep':
      renderPrep();
      document.getElementById('view-prep').classList.add('active');
      break;
    case 'rewards':
      renderRewards();
      document.getElementById('view-rewards').classList.add('active');
      break;
    case 'progress':
      renderProgress();
      document.getElementById('view-progress').classList.add('active');
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
  xSm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
};

// ---- RENDER: Home ----
function renderHome() {
  // Feature 11: Check for Sunday weekly review
  checkSundayReview();

  const el = document.getElementById('view-home');
  const now = new Date();
  const dateStr = formatDate(now);
  const todayB = getTodayBlocks();
  const fullToday = todayB.filter(l => !l.warmup).length;
  const maxToday = state.settings.blocksPerDay.max;
  const weekStart = getWeekStart(todayStr());
  const weekB = getWeekBlocks(weekStart);
  const weeklyGoal = state.settings.weeklyGoal || 10;
  const next = getNextQueuedTask();
  const allDoneToday = fullToday >= maxToday;

  let html = '';

  html += `<div class="greeting-bar">
    <div class="greeting-date">${dateStr}</div>
    <div class="points-badge">${state.points} pts</div>
  </div>`;

  // Feature 11: Review done badge
  if (dayOfWeek() === 0 && isReviewDoneThisWeek()) {
    html += `<div class="review-done-badge">Review done this week</div>`;
  }

  if (dayOfWeek() === 0 && !state.weeklyPlan.approved) {
    html += `<div class="sunday-prompt">Ready to plan next week? It takes 5 minutes. <a href="#schedule" style="color:var(--text-primary);text-decoration:underline;cursor:pointer;">Plan now</a></div>`;
  }

  const hasPlan = state.weeklyPlan.approved && state.weeklyPlan.focusProjects && state.weeklyPlan.focusProjects.length > 0;
  if (!hasPlan && dayOfWeek() !== 0) {
    html += `<div class="no-plan-msg">No weekly plan yet. <a onclick="navigate('#schedule')">Pick your focus for the week</a></div>`;
  }

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

  html += `<div class="block-section">
    <div class="block-section-label">This week</div>
    <div class="block-circles">`;
  const totalCircles = Math.max(weeklyGoal, weekB.length);
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

  if (state.lastAction) {
    html += `<div class="where-was-i">Last: ${state.lastAction}</div>`;
  }
  if (state.streak.current > 0) {
    html += `<div class="streak-line">${state.streak.current}-day streak</div>`;
  }

  // Feature 9: Reward unlocked banner
  const newlyEarned = getNewlyEarnedRewards();
  if (newlyEarned.length > 0) {
    html += `<div class="reward-unlocked-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
      Reward unlocked: ${escapeHtml(newlyEarned[0].label)}
    </div>`;
  }

  // Feature 9: Next reward card
  const nextReward = getNextPointReward();
  if (nextReward) {
    const pct = Math.min(100, Math.round((state.points / nextReward.threshold) * 100));
    const chosen = (state.rewards.tiers[nextReward.id] || {}).text || nextReward.defaultReward;
    html += `<div class="next-reward-card" onclick="navigate('#rewards')">
      <div>
        <div class="next-reward-label">Next reward</div>
        <div class="next-reward-text">${escapeHtml(chosen)}</div>
      </div>
      <div class="next-reward-progress">${state.points}/${nextReward.threshold} pts</div>
    </div>`;
  }

  el.innerHTML = html;
}

// ---- RENDER: Projects ----
function renderProjects() {
  const el = document.getElementById('view-projects');
  let html = '<div class="section-title">Projects</div>';

  for (const track of ACTIVE_TRACKS) {
    const ms = getCurrentMilestone(track);
    const color = TRACK_COLORS[track];
    const label = getTrackLabel(track); // Feature 2
    const msTitle = ms ? ms.title : 'Complete';
    const progress = ms ? getMilestoneStepProgress(ms.id) : '--';
    html += `<div class="project-card" onclick="navigate('#track/${track}')">
      <span class="dot" style="background:${color}"></span>
      <span class="proj-name proj-name-editable" data-track="${track}" ondblclick="startEditProjectName(event,'${track}')">${escapeHtml(label)}</span>
      <span class="proj-milestone">${escapeHtml(msTitle)}</span>
      <span class="proj-progress">${progress}</span>
    </div>`;
  }

  html += `<div class="archive-toggle" id="archiveToggle" onclick="toggleArchive()">
    ${ICONS.chevronRight}
    <span>${INACTIVE_TRACKS.length} archived projects</span>
  </div>`;
  html += `<div class="archive-list" id="archiveList" style="display:none;">`;
  for (const track of INACTIVE_TRACKS) {
    const ms = getCurrentMilestone(track);
    const color = TRACK_COLORS[track];
    const label = getTrackLabel(track);
    const msTitle = ms ? ms.title : 'Complete';
    html += `<div class="project-card" onclick="navigate('#track/${track}')">
      <span class="dot" style="background:${color}"></span>
      <span class="proj-name">${escapeHtml(label)}</span>
      <span class="proj-milestone">${escapeHtml(msTitle)}</span>
    </div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
}

function toggleArchive() {
  const list = document.getElementById('archiveList');
  const toggle = document.getElementById('archiveToggle');
  const open = list.style.display === 'none';
  list.style.display = open ? 'block' : 'none';
  toggle.classList.toggle('open', open);
}

// Feature 2: inline edit project name
function startEditProjectName(evt, trackId) {
  evt.stopPropagation();
  const span = evt.currentTarget;
  const currentLabel = getTrackLabel(trackId);
  span.innerHTML = `<input class="proj-name-input" type="text" value="${escapeHtml(currentLabel)}" id="projNameInput_${trackId}">`;
  const input = span.querySelector('input');
  input.focus();
  input.select();
  function finish() {
    const val = (input.value || '').trim();
    if (val) {
      if (!state.trackOverrides[trackId]) state.trackOverrides[trackId] = {};
      state.trackOverrides[trackId].label = val;
      saveState();
    }
    renderProjects();
  }
  input.addEventListener('blur', finish);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.removeEventListener('blur', finish); renderProjects(); }
  });
}

// ---- RENDER: Track ----
function renderTrack(trackId) {
  const el = document.getElementById('view-track');
  const milestones = QUEST_DATA[trackId] || [];
  const color = TRACK_COLORS[trackId];
  const label = getTrackLabel(trackId); // Feature 2
  const override = state.trackOverrides[trackId] || {};
  const tags = override.tags || [];

  // Tags HTML
  let tagsHtml = `<div class="track-tags" id="trackTags_${trackId}">`;
  for (let i = 0; i < tags.length; i++) {
    tagsHtml += `<span class="tag-badge">${escapeHtml(tags[i])}<button class="tag-remove" onclick="removeTag('${trackId}',${i})" title="Remove tag">${ICONS.xSm}</button></span>`;
  }
  tagsHtml += `<button class="tag-add-btn" onclick="showTagInput('${trackId}')">+ tag</button>`;
  tagsHtml += `</div>`;

  let html = `<div class="track-header">
    <button class="back-btn" onclick="navigate('#projects')">${ICONS.arrowLeft}</button>
    <div class="track-header-info">
      <div class="track-title"><span class="dot" style="background:${color}"></span> <span ondblclick="startEditTrackName(event,'${trackId}')" class="proj-name-editable" style="font-size:inherit;font-weight:inherit;">${escapeHtml(label)}</span></div>
      ${tagsHtml}
    </div>
  </div>`;

  const weeklyGoal = state.settings.weeklyGoal || 10;

  for (const ms of milestones) {
    const msState = getMilestoneState(ms.id);
    const progress = getMilestoneStepProgress(ms.id);
    const blocksLogged = getBlocksForMilestone(ms.id);
    const totalBlocks = getTotalBlocksForMilestone(ms.id);
    const statusClass = msState.status === 'done' ? ' status-done' : '';
    const urgLevel = getUrgency(ms.id);
    const urgDot = urgLevel ? `<span class="urgency-dot ${urgLevel}"></span>` : '';

    // Feature 4: due date and pace
    const dueDate = state.dueDates[ms.id] || '';
    let paceHtml = '';
    if (dueDate) {
      const weeks = weeksUntil(dueDate);
      const remaining = getRemainingBlocksForMilestone(ms.id);
      if (weeks > 0) {
        const pace = (remaining / weeks).toFixed(1);
        const paceNum = parseFloat(pace);
        let paceClass = 'ms-pace-ok';
        if (paceNum > weeklyGoal * 2) paceClass = 'ms-pace-crit';
        else if (paceNum > weeklyGoal) paceClass = 'ms-pace-warn';
        paceHtml = `<span class="ms-pace-label ${paceClass}" title="${remaining} blocks remaining, ${weeks.toFixed(1)} weeks">~${pace} blocks/week needed</span>`;
      } else if (weeks === 0) {
        paceHtml = `<span class="ms-pace-label ms-pace-crit">Due today or overdue</span>`;
      }
    }

    html += `<div class="milestone-card${statusClass}" onclick="navigate('#path/${trackId}/${ms.id}')">
      <span class="dot" style="background:${color};width:6px;height:6px;"></span>
      <div style="flex:1;min-width:0;">
        <div class="ms-name">${urgDot}${escapeHtml(ms.title)}</div>
        <div class="ms-due-wrap" onclick="event.stopPropagation()">
          <input type="date" class="ms-due-date-input" data-ms="${ms.id}"
            value="${dueDate}"
            title="Set due date for this milestone">
          ${paceHtml}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="urgency-btn" onclick="event.stopPropagation();cycleUrgency('${ms.id}','track','${trackId}')" title="Set urgency">
          ${urgLevel === 'critical' ? '<span style="color:#b07070;font-size:11px;">critical</span>' : urgLevel === 'important' ? '<span style="color:var(--c-dlpfc);font-size:11px;">important</span>' : '<span style="font-size:11px;">flag</span>'}
        </button>
        <span class="ms-progress">${blocksLogged}/${totalBlocks} blocks</span>
      </div>
    </div>`;
  }

  el.innerHTML = html;

  // Feature 4: due date listeners
  el.querySelectorAll('.ms-due-date-input').forEach(input => {
    input.addEventListener('change', () => {
      const msId = input.dataset.ms;
      if (input.value) state.dueDates[msId] = input.value;
      else delete state.dueDates[msId];
      saveState();
      renderTrack(trackId);
    });
  });
}

// Feature 2: inline track name edit from track view
function startEditTrackName(evt, trackId) {
  evt.stopPropagation();
  const span = evt.currentTarget;
  const currentLabel = getTrackLabel(trackId);
  span.innerHTML = `<input class="proj-name-input" type="text" value="${escapeHtml(currentLabel)}" style="font-size:inherit;font-weight:inherit;">`;
  const input = span.querySelector('input');
  input.focus(); input.select();
  function finish() {
    const val = (input.value || '').trim();
    if (val) {
      if (!state.trackOverrides[trackId]) state.trackOverrides[trackId] = {};
      state.trackOverrides[trackId].label = val;
      saveState();
    }
    renderTrack(trackId);
  }
  input.addEventListener('blur', finish);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.removeEventListener('blur', finish); renderTrack(trackId); }
  });
}

// Feature 2: tags
function showTagInput(trackId) {
  const tagsDiv = document.getElementById(`trackTags_${trackId}`);
  if (!tagsDiv) return;
  // Replace add button with input
  const addBtn = tagsDiv.querySelector('.tag-add-btn');
  if (!addBtn) return;
  const inputEl = document.createElement('input');
  inputEl.className = 'tag-input';
  inputEl.placeholder = 'tag1, tag2';
  inputEl.setAttribute('autofocus', '');
  addBtn.replaceWith(inputEl);
  inputEl.focus();
  function commit() {
    const val = inputEl.value.trim();
    if (val) {
      const newTags = val.split(',').map(t => t.trim()).filter(Boolean);
      if (!state.trackOverrides[trackId]) state.trackOverrides[trackId] = {};
      const existing = state.trackOverrides[trackId].tags || [];
      state.trackOverrides[trackId].tags = [...existing, ...newTags];
      saveState();
    }
    renderTrack(trackId);
  }
  inputEl.addEventListener('blur', commit);
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); inputEl.blur(); }
    if (e.key === 'Escape') { inputEl.removeEventListener('blur', commit); renderTrack(trackId); }
  });
}

function removeTag(trackId, idx) {
  if (!state.trackOverrides[trackId]) return;
  const tags = state.trackOverrides[trackId].tags || [];
  tags.splice(idx, 1);
  state.trackOverrides[trackId].tags = tags;
  saveState();
  renderTrack(trackId);
}

// Feature 3: cycle urgency
function cycleUrgency(itemId, context, trackId) {
  const current = state.urgency[itemId] || null;
  const next = current === null ? 'important' : current === 'important' ? 'critical' : null;
  if (next === null) delete state.urgency[itemId];
  else state.urgency[itemId] = next;
  saveState();
  if (context === 'track') renderTrack(trackId);
  else if (context === 'path') {
    // re-render path – get current path params from hash
    const parts = window.location.hash.slice(1).split('/');
    if (parts[0] === 'path') renderPath(parts[1], parts[2]);
  } else if (context === 'drawer') {
    // refresh urgency UI in drawer only
    renderUrgencyInDrawer(itemId);
  }
}

// ---- RENDER: Path (board game) ----
function renderPath(trackId, milestoneId) {
  const el = document.getElementById('view-path');
  const ms = getMilestone(milestoneId);
  if (!ms) { el.innerHTML = '<p>Milestone not found.</p>'; return; }
  const track = trackId || getTrackForMilestone(milestoneId);
  const color = TRACK_COLORS[track];
  const baseSteps = ms.steps || [];
  const customSteps = state.customSteps[milestoneId] || [];
  const steps = [...baseSteps, ...customSteps];
  const blocksLogged = getBlocksForMilestone(milestoneId);
  const totalBlocks = getTotalBlocksForMilestone(milestoneId);

  let html = `<div class="path-header">
    <button class="back-btn" onclick="navigate('#track/${track}')">${ICONS.arrowLeft}</button>
    <div class="path-title"><span class="dot" style="background:${color}"></span> ${escapeHtml(ms.title)}</div>
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
    const isCustom = !!step.isCustom;

    // Feature 3: urgency indicator
    const urgLevel = getUrgency(step.id);
    const urgDot = urgLevel ? `<span class="urgency-dot ${urgLevel}" style="margin-right:4px;"></span>` : '';

    // Due date indicator
    let dueIndicator = '';
    if (state.dueDates[step.id]) {
      const dueDate = new Date(state.dueDates[step.id] + 'T00:00:00');
      const daysLeft = Math.ceil((dueDate - new Date()) / 86400000);
      if (daysLeft < 3) dueIndicator = ' due-urgent';
      else if (daysLeft < 14) dueIndicator = ' due-soon';
    }

    // Feature 1: reorder buttons (only for custom steps or if reordering enabled)
    const canMoveUp = idx > 0;
    const canMoveDown = idx < steps.length - 1;
    const reorderHtml = `<div class="step-reorder">
      <button class="step-reorder-btn" title="Move up" onclick="event.stopPropagation();moveStep('${milestoneId}','${step.id}','up')">${ICONS.arrowUp}</button>
      <button class="step-reorder-btn" title="Move down" onclick="event.stopPropagation();moveStep('${milestoneId}','${step.id}','down')">${ICONS.arrowDown}</button>
    </div>`;

    html += `<div class="path-node">
      <div class="path-step ${side} ${statusClass}${dueIndicator}" style="--step-accent:${color}" data-stepid="${step.id}" data-msid="${milestoneId}" data-track="${track}">
        ${isActive ? `<div class="game-piece" style="background:${color}"></div>` : ''}
        <div class="step-num">Step ${idx + 1}${isCustom ? ' (custom)' : ''}</div>
        <div class="step-title-text" onclick="openStepDrawer('${step.id}','${milestoneId}','${track}')">${urgDot}<span class="step-title-label">${escapeHtml(step.title)}</span></div>
        <div class="step-meta" onclick="openStepDrawer('${step.id}','${milestoneId}','${track}')">
          ${typeBadge}
          <div class="step-block-dots">`;
    for (let b = 0; b < estBlocks; b++) {
      html += `<div class="step-block-dot${b < completed ? ' filled' : ''}"></div>`;
    }
    html += `</div>
          ${ss.status === 'done' ? `<span class="done-check">${ICONS.check}</span>` : ''}
        </div>
        ${reorderHtml}
      </div>`;
    if (idx < steps.length - 1) html += `<div class="path-connector"></div>`;
    html += `</div>`;
  });

  // Feature 1: Add step button
  html += `<div class="path-connector"></div>
    <div style="display:flex;justify-content:${steps.length % 2 === 0 ? 'flex-start' : 'flex-end'};">
      <button class="add-step-btn" onclick="showAddStepForm('${milestoneId}','${track}')">
        ${ICONS.plus} Add custom step
      </button>
    </div>`;

  if (ms.gate) {
    html += `<div class="path-connector"></div>
    <div class="gate-card">
      <h4>${escapeHtml(ms.gate.title)}</h4>`;
    for (const item of ms.gate.items) {
      html += `<div class="gate-item">${escapeHtml(item)}</div>`;
    }
    html += `</div>`;
  }

  if (ms.reward) {
    html += `<div class="path-connector"></div>
    <div class="reward-card">
      <div class="reward-text">${escapeHtml(ms.reward)}</div>
    </div>`;
  }

  html += `</div>`; // winding-path
  el.innerHTML = html;

  // Feature 1: inline title editing — click step title label to edit
  el.querySelectorAll('.path-step').forEach(stepEl => {
    const stepId = stepEl.dataset.stepid;
    const msId = stepEl.dataset.msid;
    const trackId2 = stepEl.dataset.track;
    const label = stepEl.querySelector('.step-title-label');
    if (!label) return;
    // Only allow inline edit for custom steps or base steps
    label.style.cursor = 'text';
    label.addEventListener('click', e => {
      e.stopPropagation();
      startInlineStepEdit(stepId, msId, trackId2, label);
    });
  });
}

// Feature 1: inline edit step title
function startInlineStepEdit(stepId, milestoneId, trackId, labelEl) {
  const current = labelEl.textContent;
  const isCustom = (state.customSteps[milestoneId] || []).find(s => s.id === stepId);
  if (!isCustom) {
    // For base steps, just open drawer — don't allow title edit of base data
    return;
  }
  const input = document.createElement('input');
  input.className = 'step-title-editable';
  input.value = current;
  labelEl.replaceWith(input);
  input.focus(); input.select();
  function commit() {
    const val = input.value.trim();
    if (val && isCustom) {
      isCustom.title = val;
      saveState();
    }
    renderPath(trackId, milestoneId);
  }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.removeEventListener('blur', commit); renderPath(trackId, milestoneId); }
  });
}

// Feature 1: move step up/down
function moveStep(milestoneId, stepId, direction) {
  // Determine if this is a custom step
  const custom = state.customSteps[milestoneId] || [];
  const ms = getMilestone(milestoneId);
  const baseSteps = ms ? (ms.steps || []) : [];
  const allSteps = [...baseSteps, ...custom];
  const idx = allSteps.findIndex(s => s.id === stepId);
  if (idx < 0) return;

  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= allSteps.length) return;

  // Swap in allSteps — but we need to handle base vs custom boundary
  // Strategy: flatten into one merged order array stored in customSteps for this milestone
  // We'll store a merged order by creating a full custom override if needed
  const swapped = [...allSteps];
  [swapped[idx], swapped[newIdx]] = [swapped[newIdx], swapped[idx]];

  // Store reordered custom as full list (mark base steps included)
  state.customSteps[milestoneId] = swapped.map(s => {
    if (custom.find(c => c.id === s.id)) return s; // already custom
    return { ...s, _base: true }; // mark as base step copy
  });
  saveState();

  // Re-render
  const parts = window.location.hash.slice(1).split('/');
  renderPath(parts[1], parts[2]);
}

// Feature 1: add custom step form
function showAddStepForm(milestoneId, trackId) {
  // Show a simple prompt-style inline form
  const el = document.getElementById('view-path');
  const existing = el.querySelector('.add-step-form');
  if (existing) { existing.remove(); return; }

  const form = document.createElement('div');
  form.className = 'add-step-form card';
  form.style.cssText = 'margin-top:12px;padding:14px;display:flex;flex-direction:column;gap:10px;max-width:320px;';
  form.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:var(--text-primary);">Add custom step</div>
    <input class="idea-input" id="newStepTitle" placeholder="Step title" style="background:var(--bg);">
    <input class="idea-input" id="newStepBlocks" type="number" placeholder="Estimated blocks (default 1)" min="1" max="20" style="background:var(--bg);">
    <div style="display:flex;gap:8px;">
      <button class="btn btn-outline" style="flex:1;" onclick="submitAddStep('${milestoneId}','${trackId}')">Add</button>
      <button class="btn btn-ghost" onclick="this.closest('.add-step-form').remove()">Cancel</button>
    </div>`;
  el.querySelector('.winding-path').appendChild(form);
  form.querySelector('#newStepTitle').focus();
}

function submitAddStep(milestoneId, trackId) {
  const titleInput = document.getElementById('newStepTitle');
  const blocksInput = document.getElementById('newStepBlocks');
  const title = (titleInput ? titleInput.value : '').trim();
  if (!title) return;
  const estimated_blocks = parseInt(blocksInput ? blocksInput.value : '1') || 1;
  const newStep = {
    id: 'custom-' + milestoneId + '-' + Date.now(),
    title,
    estimated_blocks,
    type: null,
    desc: '',
    isCustom: true
  };
  if (!state.customSteps[milestoneId]) state.customSteps[milestoneId] = [];
  state.customSteps[milestoneId].push(newStep);
  saveState();
  renderPath(trackId, milestoneId);
}

// ---- Step Drawer ----
function openStepDrawer(stepId, milestoneId, track) {
  const ms = getMilestone(milestoneId);
  if (!ms) return;
  // Search in merged steps
  const allSteps = getAllSteps(milestoneId);
  const step = allSteps.find(s => s.id === stepId);
  if (!step) return;
  const ss = getStepState(stepId);
  const color = TRACK_COLORS[track];
  const urgLevel = getUrgency(stepId);

  let html = `<button class="drawer-close" onclick="closeDrawer()">${ICONS.x}</button>
    <h3>${escapeHtml(step.title)}</h3>
    <div class="drawer-desc">${escapeHtml(step.desc || '')}</div>`;

  html += `<button class="btn btn-primary" style="background:${color};width:100%;margin-bottom:16px;" onclick="closeDrawer();navigate('#focus/${milestoneId}/${stepId}')">
    ${ICONS.play} Start Focus
  </button>`;

  // Feature 3: Urgency picker
  html += `<div class="drawer-section-title">Urgency</div>
    <div class="urgency-picker">
      <button class="urgency-option ${!urgLevel ? 'active-none' : ''}" onclick="setUrgencyFromDrawer('${stepId}','${milestoneId}','${track}',null)">None</button>
      <button class="urgency-option ${urgLevel === 'important' ? 'active-important' : ''}" onclick="setUrgencyFromDrawer('${stepId}','${milestoneId}','${track}','important')"><span class="urgency-dot important"></span> Important</button>
      <button class="urgency-option ${urgLevel === 'critical' ? 'active-critical' : ''}" onclick="setUrgencyFromDrawer('${stepId}','${milestoneId}','${track}','critical')"><span class="urgency-dot critical"></span> Critical</button>
    </div>`;

  if (step.checklist && step.checklist.length > 0) {
    html += `<div class="drawer-section-title">Checklist</div><div class="drawer-checklist">`;
    step.checklist.forEach((item, i) => {
      const checked = ss.checklist && ss.checklist[i] ? 'checked' : '';
      html += `<label><input type="checkbox" class="drawer-cb" data-step="${stepId}" data-idx="${i}" ${checked}><span>${escapeHtml(item)}</span></label>`;
    });
    html += `</div>`;
  }

  html += `<div class="drawer-section-title">Notes</div>
    <textarea class="drawer-notes" id="drawerNotes" placeholder="Your notes...">${escapeHtml(ss.notes || '')}</textarea>`;

  html += `<div class="drawer-section-title">Due date</div>
    <input type="date" class="drawer-due-date" id="drawerDue" value="${state.dueDates[stepId] || ''}">`;

  if (ss.status !== 'done') {
    html += `<button class="btn btn-outline" style="width:100%;margin-top:16px;" onclick="markStepDone('${stepId}','${milestoneId}')">Mark as done</button>`;
  }

  // Feature 1: delete custom step option
  const isCustomStep = (state.customSteps[milestoneId] || []).some(s => s.id === stepId);
  if (isCustomStep) {
    html += `<button class="btn btn-danger" style="width:100%;margin-top:8px;" onclick="deleteCustomStep('${stepId}','${milestoneId}','${track}')">Delete custom step</button>`;
  }

  const drawer = document.getElementById('drawer');
  drawer.innerHTML = html;
  document.getElementById('drawerOverlay').classList.add('open');

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

// Feature 3: set urgency from drawer
function setUrgencyFromDrawer(stepId, milestoneId, track, level) {
  if (level === null) delete state.urgency[stepId];
  else state.urgency[stepId] = level;
  saveState();
  openStepDrawer(stepId, milestoneId, track);
}

// Feature 3: render urgency in drawer (partial update)
function renderUrgencyInDrawer(itemId) {
  const picker = document.querySelector('.urgency-picker');
  if (!picker) return;
  const urgLevel = getUrgency(itemId);
  picker.querySelectorAll('.urgency-option').forEach((btn, i) => {
    btn.className = 'urgency-option';
    if (i === 0 && !urgLevel) btn.classList.add('active-none');
    if (i === 1 && urgLevel === 'important') btn.classList.add('active-important');
    if (i === 2 && urgLevel === 'critical') btn.classList.add('active-critical');
  });
}

function closeDrawer() {
  document.getElementById('drawerOverlay').classList.remove('open');
}

function markStepDone(stepId, milestoneId) {
  const ss = getStepState(stepId);
  ss.status = 'done';
  const steps = getAllSteps(milestoneId);
  const allDone = steps.every(s => getStepState(s.id).status === 'done');
  if (allDone) {
    getMilestoneState(milestoneId).status = 'done';
    showConfetti();
  }
  const track = getTrackForMilestone(milestoneId);
  const ms = getMilestone(milestoneId);
  state.lastAction = `${getTrackLabel(track)} → ${ms ? ms.title : ''} → done`;
  saveState();
  closeDrawer();
  handleRoute();
}

// Feature 1: delete custom step
function deleteCustomStep(stepId, milestoneId, trackId) {
  if (!state.customSteps[milestoneId]) return;
  state.customSteps[milestoneId] = state.customSteps[milestoneId].filter(s => s.id !== stepId);
  saveState();
  closeDrawer();
  renderPath(trackId, milestoneId);
}

// ---- RENDER: Focus ----
function renderFocus(milestoneId, stepId) {
  const el = document.getElementById('view-focus');

  if (!milestoneId || !stepId) {
    const next = getNextQueuedTask();
    if (next) { milestoneId = next.milestone.id; stepId = next.step.id; }
    else { el.innerHTML = '<div class="focus-view"><p style="color:var(--text-muted)">No task queued. Pick a project first.</p></div>'; return; }
  }

  const ms = getMilestone(milestoneId);
  const allSteps = getAllSteps(milestoneId);
  const step = ms ? allSteps.find(s => s.id === stepId) : null;
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
    <div class="focus-breadcrumb">${escapeHtml(getTrackLabel(track))} → ${escapeHtml(ms.title)}</div>
    <div class="focus-step-title">${escapeHtml(step.title)}</div>

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
  const logEntry = {
    date: todayStr(),
    stepId: timerStepId,
    milestoneId: timerMilestoneId,
    blocks: 1,
    warmup: timerIsWarmup,
    timestamp: Date.now()
  };
  state.focusLog.push(logEntry);

  const ss = getStepState(timerStepId);
  ss.blocksCompleted = (ss.blocksCompleted || 0) + 1;
  if (ss.status !== 'done') ss.status = 'active';

  const pts = awardPoints(timerIsWarmup);
  updateStreak();

  const track = getTrackForMilestone(timerMilestoneId);
  const ms = getMilestone(timerMilestoneId);
  const allSteps = getAllSteps(timerMilestoneId);
  const step = allSteps.find(s => s.id === timerStepId);
  state.lastAction = `${getTrackLabel(track)} → ${ms ? ms.title : ''} → ${step ? step.title : ''}`;
  saveState();

  showPointsPopup(pts);

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
  const thisWeekStart = getWeekStart(todayStr());
  const weekBlocks = getWeekBlocks(thisWeekStart);
  const fullBlocks = weekBlocks.filter(l => !l.warmup);
  const weeklyGoal = state.settings.weeklyGoal || 10;
  const totalHours = Math.round(fullBlocks.length * state.settings.blockDurationMin / 60 * 10) / 10;

  const d = new Date(thisWeekStart + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  const prevWeekStart = d.toISOString().slice(0, 10);
  const lastWeekBlocks = getWeekBlocks(prevWeekStart);
  const lastWeekFull = lastWeekBlocks.filter(l => !l.warmup);

  let html = `<div class="review-summary">This week: ${fullBlocks.length} / ${weeklyGoal} blocks completed</div>`;

  const breakdown = {};
  for (const log of weekBlocks) {
    const track = getTrackForMilestone(log.milestoneId) || 'unknown';
    breakdown[track] = (breakdown[track] || 0) + 1;
  }
  if (Object.keys(breakdown).length > 0) {
    html += `<div class="review-breakdown">`;
    for (const [track, count] of Object.entries(breakdown)) {
      const color = TRACK_COLORS[track] || '#5a5a66';
      html += `<div class="review-breakdown-item"><span class="dot" style="background:${color}"></span> ${escapeHtml(getTrackLabel(track))}: ${count} blocks</div>`;
    }
    html += `</div>`;
  }

  if (totalHours > 0) {
    html += `<div class="morale-msg">You've spent ${totalHours} hours in deep focus this week. That's meaningful progress.</div>`;
  }

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
    const label = getTrackLabel(track);
    const selected = fps.includes(track);
    const ms = getCurrentMilestone(track);
    const msTitle = ms ? ms.title : 'Complete';
    html += `<div class="focus-proj-toggle${selected ? ' selected' : ''}" data-track="${track}" style="${selected ? `border-color:${color}` : ''}">
      <span class="dot" style="background:${color}"></span>
      <span class="fp-name">${escapeHtml(label)}</span>
      <span style="font-size:11px;color:var(--text-muted);flex:1;text-align:right;">${escapeHtml(msTitle)}</span>
    </div>`;
  }
  html += `</div>`;

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

  // Feature 3: gather tasks sorted by urgency
  const taskQueue = [];
  for (const track of focusProjects) {
    const ms = getCurrentMilestone(track);
    if (!ms) continue;
    const steps = getAllSteps(ms.id);
    for (const step of steps) {
      const ss = getStepState(step.id);
      if (ss.status === 'done') continue;
      const remaining = Math.max(0, (step.estimated_blocks || 1) - (ss.blocksCompleted || 0));
      const urgLevel = getUrgency(step.id) || getUrgency(ms.id);
      for (let i = 0; i < remaining; i++) {
        taskQueue.push({ track, milestoneId: ms.id, stepId: step.id, stepTitle: step.title, urgLevel: urgLevel || null });
      }
    }
  }

  // Sort by urgency: critical first, important second, null last
  taskQueue.sort((a, b) => {
    const order = { critical: 0, important: 1, null: 2 };
    return (order[a.urgLevel] ?? 2) - (order[b.urgLevel] ?? 2);
  });

  let html = `<div class="plan-grid">`;
  let taskIdx = 0;
  for (let d = 0; d < 5; d++) {
    html += `<div class="plan-day"><div class="plan-day-name">${DAYS[d]}</div>`;
    for (let b = 0; b < hardPerDay && b < blocksPerDay; b++) {
      if (taskIdx < taskQueue.length) {
        const t = taskQueue[taskIdx];
        const color = TRACK_COLORS[t.track];
        const shortTitle = t.stepTitle.length > 20 ? t.stepTitle.slice(0, 18) + '..' : t.stepTitle;
        const urgClass = t.urgLevel ? ` urgency-${t.urgLevel}` : '';
        html += `<div class="plan-slot${urgClass}"><span class="dot" style="background:${color}"></span>${escapeHtml(shortTitle)}</div>`;
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
  const idea = state.ideas.find(i => i.id === ideaId);
  if (idea) { idea.promoted = true; saveState(); renderIdeas(); }
}

// ---- RENDER: Admin (Feature 5) ----
function renderAdmin() {
  const el = document.getElementById('view-admin');
  const today = todayStr();

  // Split tasks
  const allTasks = state.adminTasks || [];
  const completedToday = allTasks.filter(t => t.completedDate === today);
  const todayTasks = allTasks.filter(t => t.createdAt && t.createdAt.startsWith(today));
  const uncompletedOlder = allTasks.filter(t => !t.completedDate && (!t.createdAt || !t.createdAt.startsWith(today)));

  const capCount = completedToday.length;
  const capReached = capCount >= 2;

  let html = `<div class="section-title">Admin Tasks</div>`;

  // Cap bar
  html += `<div class="admin-cap-bar">
    <span class="admin-cap-count">Completed today: <strong>${capCount}/2</strong></span>
    ${capReached ? '<span class="admin-cap-reached">Admin cap reached. Focus on deep work.</span>' : ''}
  </div>`;

  // Input
  html += `<div class="admin-input-wrap">
    <input class="admin-input" id="adminInput" placeholder="Email, form, meeting..." onkeydown="if(event.key==='Enter')addAdminTask()">
    <button class="btn btn-outline" onclick="addAdminTask()">Add</button>
  </div>`;

  // Today section
  if (todayTasks.length > 0) {
    html += `<div class="admin-section-label">Today</div>`;
    for (const task of todayTasks) {
      const isCompleted = !!task.completedDate;
      html += renderAdminTaskCard(task, isCompleted);
    }
  }

  // Older uncompleted
  if (uncompletedOlder.length > 0) {
    html += `<div class="admin-section-label" style="margin-top:16px;">Older — uncompleted</div>`;
    for (const task of uncompletedOlder) {
      html += renderAdminTaskCard(task, false);
    }
  }

  if (allTasks.length === 0) {
    html += `<div style="font-size:13px;color:var(--text-muted);padding:24px 0;text-align:center;">No admin tasks. Keep it minimal.</div>`;
  }

  el.innerHTML = html;

  // Attach checkbox listeners
  el.querySelectorAll('.admin-task-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const taskId = cb.dataset.id;
      const task = state.adminTasks.find(t => t.id === taskId);
      if (!task) return;
      if (cb.checked) {
        task.completedDate = today;
      } else {
        task.completedDate = null;
      }
      saveState();
      renderAdmin();
    });
  });
}

function renderAdminTaskCard(task, isCompleted) {
  return `<div class="admin-task-card${isCompleted ? ' completed' : ''}">
    <input type="checkbox" class="admin-task-cb" data-id="${task.id}" ${isCompleted ? 'checked' : ''}>
    <span class="admin-task-text">${escapeHtml(task.text)}</span>
    <button class="admin-task-delete" onclick="deleteAdminTask('${task.id}')" title="Delete">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
    </button>
  </div>`;
}

function addAdminTask() {
  const input = document.getElementById('adminInput');
  const text = (input.value || '').trim();
  if (!text) return;
  if (!state.adminTasks) state.adminTasks = [];
  state.adminTasks.push({
    id: 'admin-' + Date.now(),
    text,
    createdAt: new Date().toISOString().slice(0, 10),
    completedDate: null
  });
  saveState();
  input.value = '';
  renderAdmin();
}

function deleteAdminTask(taskId) {
  state.adminTasks = (state.adminTasks || []).filter(t => t.id !== taskId);
  saveState();
  renderAdmin();
}

// ---- RENDER: Prep (Feature 6) ----
function renderPrep() {
  const el = document.getElementById('view-prep');
  const batches = state.prepBatches || [];

  let html = `<div class="section-title">Sample Prep</div>`;

  // New batch form
  html += `<div class="prep-batch-new">
    <h4>Start new batch</h4>
    <input class="prep-input" id="prepBatchName" placeholder="Sample name / ID (e.g. Batch-04)">
    <input type="date" class="prep-date-input" id="prepBatchDate" title="Start date">
    <select class="prep-select" id="prepBatchProject">
      <option value="">Link to project (optional)</option>
      ${ACTIVE_TRACKS.map(t => `<option value="${t}">${escapeHtml(getTrackLabel(t))}</option>`).join('')}
    </select>
    <button class="btn btn-outline" onclick="startNewBatch()" style="flex:0 0 auto;">Start</button>
  </div>`;

  // Active batches
  if (batches.length > 0) {
    html += `<div style="margin-bottom:24px;">`;
    for (const batch of batches) {
      html += renderBatchCard(batch);
    }
    html += `</div>`;
  }

  // Protocol template (reference)
  html += `<div class="prep-template-header">Protocol Template (reference)</div>`;
  if (typeof PROTOCOL_PHASES !== 'undefined') {
    for (const phase of PROTOCOL_PHASES) {
      html += `<div class="prep-phase">
        <div class="prep-phase-name">
          ${escapeHtml(phase.name)}
          <span class="prep-phase-day">Day ${phase.protocol_day}</span>
          ${phase.can_stop ? `<span class="prep-phase-stop">Stop ok</span>` : ''}
        </div>`;
      for (const step of phase.steps) {
        html += `<div class="prep-step">
          <div class="prep-step-info">
            <div class="prep-step-name">${escapeHtml(step.name)}</div>
            ${step.note ? `<div class="prep-step-note">${escapeHtml(step.note)}</div>` : ''}
          </div>
        </div>`;
      }
      html += `</div>`;
    }
  }

  el.innerHTML = html;

  // Attach batch toggle listeners
  el.querySelectorAll('.batch-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.batch-card');
      card.classList.toggle('open');
    });
  });

  // Attach batch checklist listeners
  el.querySelectorAll('.prep-step-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const batchId = cb.dataset.batch;
      const stepId = cb.dataset.step;
      const batch = (state.prepBatches || []).find(b => b.id === batchId);
      if (!batch) return;
      if (!batch.checks) batch.checks = {};
      batch.checks[stepId] = cb.checked;
      saveState();
      // Update progress bar only
      updateBatchProgress(batchId);
    });
  });
}

function renderBatchCard(batch) {
  const totalSteps = typeof PROTOCOL_PHASES !== 'undefined'
    ? PROTOCOL_PHASES.reduce((sum, ph) => sum + ph.steps.length, 0) : 0;
  const completedSteps = Object.values(batch.checks || {}).filter(Boolean).length;
  const pct = totalSteps > 0 ? Math.round(completedSteps / totalSteps * 100) : 0;
  const linkedLabel = batch.linkedProject ? getTrackLabel(batch.linkedProject) : null;

  let html = `<div class="batch-card" id="batch-${batch.id}">
    <div class="batch-card-header">
      <div>
        <div class="batch-name">${escapeHtml(batch.name)}</div>
        <div class="batch-meta">Started ${batch.startDate || 'unknown'}${linkedLabel ? ` · ${escapeHtml(linkedLabel)}` : ''} · ${pct}% complete</div>
      </div>
      <span class="batch-chevron">${ICONS.chevronRight}</span>
    </div>
    <div class="batch-body">
      <div class="batch-progress-bar">
        <div class="batch-progress-fill" id="batch-prog-${batch.id}" style="width:${pct}%"></div>
      </div>`;

  // Checklist per phase
  if (typeof PROTOCOL_PHASES !== 'undefined') {
    for (const phase of PROTOCOL_PHASES) {
      html += `<div style="margin-bottom:12px;">
        <div class="prep-phase-name" style="margin-bottom:4px;">${escapeHtml(phase.name)}</div>`;
      for (const step of phase.steps) {
        const checked = batch.checks && batch.checks[step.id] ? 'checked' : '';
        html += `<div class="prep-step">
          <input type="checkbox" class="prep-step-cb" data-batch="${batch.id}" data-step="${step.id}" ${checked}>
          <div class="prep-step-info">
            <div class="prep-step-name" style="${checked ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${escapeHtml(step.name)}</div>
            ${step.note ? `<div class="prep-step-note">${escapeHtml(step.note)}</div>` : ''}
          </div>
        </div>`;
      }
      html += `</div>`;
    }
  }

  html += `<button class="btn btn-danger" style="margin-top:8px;font-size:12px;" onclick="deleteBatch('${batch.id}')">Remove batch</button>`;
  html += `</div></div>`;
  return html;
}

function updateBatchProgress(batchId) {
  const batch = (state.prepBatches || []).find(b => b.id === batchId);
  if (!batch) return;
  const totalSteps = typeof PROTOCOL_PHASES !== 'undefined'
    ? PROTOCOL_PHASES.reduce((sum, ph) => sum + ph.steps.length, 0) : 0;
  const completedSteps = Object.values(batch.checks || {}).filter(Boolean).length;
  const pct = totalSteps > 0 ? Math.round(completedSteps / totalSteps * 100) : 0;
  const bar = document.getElementById(`batch-prog-${batchId}`);
  if (bar) bar.style.width = pct + '%';
  const metaEl = document.querySelector(`#batch-${batchId} .batch-meta`);
  if (metaEl) {
    metaEl.textContent = metaEl.textContent.replace(/\d+% complete/, `${pct}% complete`);
  }
}

function startNewBatch() {
  const name = (document.getElementById('prepBatchName')?.value || '').trim();
  if (!name) { document.getElementById('prepBatchName')?.focus(); return; }
  const startDate = document.getElementById('prepBatchDate')?.value || todayStr();
  const linkedProject = document.getElementById('prepBatchProject')?.value || null;

  const batch = {
    id: 'batch-' + Date.now(),
    name,
    startDate,
    checks: {},
    linkedProject: linkedProject || null
  };
  if (!state.prepBatches) state.prepBatches = [];
  state.prepBatches.push(batch);
  saveState();
  renderPrep();
}

function deleteBatch(batchId) {
  state.prepBatches = (state.prepBatches || []).filter(b => b.id !== batchId);
  saveState();
  renderPrep();
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
      <div class="setting-row">
        <span class="setting-label">Custom steps</span>
        <span style="font-size:13px;color:var(--text-primary)">${Object.values(state.customSteps || {}).reduce((s,a)=>s+a.length,0)}</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">Admin tasks</span>
        <span style="font-size:13px;color:var(--text-primary)">${(state.adminTasks || []).length}</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">Prep batches</span>
        <span style="font-size:13px;color:var(--text-primary)">${(state.prepBatches || []).length}</span>
      </div>
    </div>

    <div class="settings-group">
      <h4>Export / Import</h4>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--sp-3);">Export your data as JSON to back up or move to another device. Import a previously exported file to restore.</p>
      <div class="data-actions-row">
        <button class="btn-data" onclick="exportData()">Export JSON</button>
        <button class="btn-data" id="copyDataBtn" onclick="copyDataToClipboard()">Copy JSON</button>
        <button class="btn-data" onclick="importData()">Import JSON</button>
      </div>
      <input type="file" class="import-file-input" id="importFileInput" accept=".json" onchange="handleImportFile(this)">
    </div>

    <div class="settings-group">
      <button class="btn btn-outline" style="width:100%;" onclick="resetAllData()">Reset all data</button>
    </div>`;

  el.innerHTML = html;

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

// ================================================================
// FEATURE 9: REWARD TIER SYSTEM
// ================================================================

const REWARD_TIERS_POINT = [
  { id: 'pts_50',  threshold: 50,  label: '50 pts',  defaultReward: 'Guilt-free scroll break (30 min)' },
  { id: 'pts_100', threshold: 100, label: '100 pts', defaultReward: 'Fancy coffee or boba run' },
  { id: 'pts_200', threshold: 200, label: '200 pts', defaultReward: 'Watch a full movie uninterrupted' },
  { id: 'pts_350', threshold: 350, label: '350 pts', defaultReward: 'Afternoon completely off' },
  { id: 'pts_500', threshold: 500, label: '500 pts', defaultReward: 'Something you\'ve been wanting (~$30)' },
];

const REWARD_TIERS_STREAK = [
  { id: 'str_5',  threshold: 5,  label: '5-day streak',  defaultReward: 'Friday afternoon off' },
  { id: 'str_10', threshold: 10, label: '10-day streak', defaultReward: 'Day trip or concert' },
  { id: 'str_20', threshold: 20, label: '20-day streak', defaultReward: 'Something meaningful — bigger treat' },
];

const REWARD_SUGGESTIONS = [
  { group: 'Rest', options: ['Sleep in — no alarm', 'Long hot shower with music', 'Guilt-free nap', 'Lie on the floor and do nothing for 20 min'] },
  { group: 'Entertainment', options: ['YouTube deep dive — 1 hour', 'Watch a comfort show episode', 'Start that show you\'ve been saving', 'Full movie night'] },
  { group: 'Movement', options: ['Walk with no destination', 'Sit outside with coffee', 'Beach/park visit', 'Stretch session with music'] },
  { group: 'Social', options: ['Call a friend', 'Plan a hangout — actual fun', 'Cook something with someone'] },
  { group: 'Creative', options: ['Draw or doodle — no pressure', 'Read fiction (not papers)', 'Explore a new cafe', 'Reorganize your desk'] },
];

function getNextPointReward() {
  const pts = state.points;
  for (const tier of REWARD_TIERS_POINT) {
    const tierState = state.rewards.tiers[tier.id];
    if (!tierState || !tierState.claimed) {
      if (pts < tier.threshold) return tier;
    }
  }
  return null;
}

function getNewlyEarnedRewards() {
  const earned = [];
  for (const tier of REWARD_TIERS_POINT) {
    const tierState = state.rewards.tiers[tier.id] || {};
    if (state.points >= tier.threshold && !tierState.claimed && !tierState.notified) {
      earned.push(tier);
    }
  }
  for (const tier of REWARD_TIERS_STREAK) {
    const tierState = state.rewards.tiers[tier.id] || {};
    if (state.streak.current >= tier.threshold && !tierState.claimed && !tierState.notified) {
      earned.push(tier);
    }
  }
  return earned;
}

function isRewardEarned(tier, isStreak) {
  if (isStreak) return state.streak.current >= tier.threshold;
  return state.points >= tier.threshold;
}

function renderRewardsDropdown(tierId, defaultReward) {
  let opts = `<option value="">Pick a reward idea...</option>`;
  for (const group of REWARD_SUGGESTIONS) {
    opts += `<optgroup label="${escapeHtml(group.group)}">`;
    for (const opt of group.options) {
      opts += `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`;
    }
    opts += `</optgroup>`;
  }
  return `<select onchange="rewardDropdownChange('${tierId}', this.value)">${opts}</select>`;
}

function rewardDropdownChange(tierId, value) {
  if (!value) return;
  if (!state.rewards.tiers[tierId]) state.rewards.tiers[tierId] = { text: '', claimed: false };
  state.rewards.tiers[tierId].text = value;
  saveState();
  const input = document.getElementById('reward-input-' + tierId);
  if (input) input.value = value;
}

function rewardCustomInput(tierId, value) {
  if (!state.rewards.tiers[tierId]) state.rewards.tiers[tierId] = { text: '', claimed: false };
  state.rewards.tiers[tierId].text = value;
  saveState();
}

function claimReward(tierId) {
  if (!state.rewards.tiers[tierId]) state.rewards.tiers[tierId] = { text: '', claimed: false };
  const tierState = state.rewards.tiers[tierId];
  tierState.claimed = true;
  tierState.notified = true;
  state.rewards.claimedHistory.push({ tierId, claimedAt: Date.now(), text: tierState.text });
  saveState();
  renderRewards();
}

function renderRewards() {
  const el = document.getElementById('view-rewards');
  let html = `<div class="section-title">Rewards</div>
    <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--sp-5);">Set a reward for each milestone. Claim it when you get there.</p>`;

  // Point-based tiers
  html += `<div class="rewards-section-label">Points earned</div>`;
  for (const tier of REWARD_TIERS_POINT) {
    html += renderRewardCard(tier, false);
  }

  // Streak-based tiers
  html += `<div class="rewards-section-label">Streak</div>`;
  for (const tier of REWARD_TIERS_STREAK) {
    html += renderRewardCard(tier, true);
  }

  el.innerHTML = html;
}

function renderRewardCard(tier, isStreak) {
  const earned = isRewardEarned(tier, isStreak);
  const tierState = state.rewards.tiers[tier.id] || {};
  const claimed = tierState.claimed || false;
  const chosenText = tierState.text || '';
  const current = isStreak ? state.streak.current : state.points;
  const pct = Math.min(100, Math.round((current / tier.threshold) * 100));

  let statusClass = 'locked';
  let statusText = 'Locked';
  if (claimed) { statusClass = 'claimed'; statusText = 'Claimed'; }
  else if (earned) { statusClass = 'earned'; statusText = 'Earned'; }

  let cardClass = 'reward-card';
  if (earned && !claimed) cardClass += ' earned';
  if (claimed) cardClass += ' claimed';

  let html = `<div class="${cardClass}">
    <div class="reward-card-header">
      <span class="reward-threshold">${escapeHtml(tier.label)}</span>
      <span class="reward-status-badge ${statusClass}">${statusText}</span>
    </div>
    <div class="reward-progress-bar">
      <div class="reward-progress-fill${pct >= 100 ? ' full' : ''}" style="width:${pct}%"></div>
    </div>
    <div class="reward-progress-label">${current} / ${tier.threshold} ${isStreak ? 'days' : 'pts'}</div>`;

  if (!claimed) {
    if (chosenText) {
      html += `<div class="reward-chosen-text">${escapeHtml(chosenText)}</div>`;
    }
    html += `<div class="reward-picker">
      ${renderRewardsDropdown(tier.id, tier.defaultReward)}
      <input class="reward-custom-input" id="reward-input-${tier.id}" type="text" placeholder="or type your own..." value="${escapeHtml(chosenText)}" oninput="rewardCustomInput('${tier.id}', this.value)">
    </div>`;
    if (earned) {
      html += `<div style="margin-top:12px;">
        <button class="reward-claim-btn" onclick="claimReward('${tier.id}')">Mark as claimed</button>
      </div>`;
    }
  } else {
    const displayText = chosenText || tier.defaultReward;
    html += `<div class="reward-chosen-text">${escapeHtml(displayText)}</div>
      <div class="reward-claimed-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M20 6L9 17l-5-5"/></svg>
        Claimed
      </div>`;
  }

  html += `</div>`;
  return html;
}

// ================================================================
// FEATURE 10: PROGRESS CHARTS
// ================================================================

// Track chart instances so we can destroy before re-render
let _chartWeekly = null;
let _chartProject = null;

function renderProgress() {
  const el = document.getElementById('view-progress');

  const allFull = state.focusLog.filter(l => !l.warmup);
  const totalBlocks = allFull.length;
  const blockMin = state.settings.blockDurationMin || 90;
  const totalHours = Math.round(totalBlocks * blockMin / 60 * 10) / 10;
  const streak = state.streak.current;
  const pts = state.points;

  let html = `<div class="section-title">Progress</div>
    <div class="progress-stats-grid">
      <div class="progress-stat-card">
        <div class="progress-stat-value">${totalHours}</div>
        <div class="progress-stat-label">Total hours</div>
      </div>
      <div class="progress-stat-card">
        <div class="progress-stat-value">${totalBlocks}</div>
        <div class="progress-stat-label">Total blocks</div>
      </div>
      <div class="progress-stat-card">
        <div class="progress-stat-value">${streak}</div>
        <div class="progress-stat-label">Day streak</div>
      </div>
      <div class="progress-stat-card">
        <div class="progress-stat-value">${pts}</div>
        <div class="progress-stat-label">Points</div>
      </div>
    </div>
    <div class="chart-card">
      <div class="chart-card-title">Weekly focus hours — last 12 weeks</div>
      <div class="chart-canvas-wrap" style="height:200px;">
        <canvas id="chartWeekly"></canvas>
      </div>
    </div>
    <div class="chart-card">
      <div class="chart-card-title">Blocks by project (all time)</div>
      <div class="chart-canvas-wrap" style="height:180px;">
        <canvas id="chartProject"></canvas>
      </div>
    </div>`;

  el.innerHTML = html;

  // Destroy old charts before creating new ones
  if (_chartWeekly) { _chartWeekly.destroy(); _chartWeekly = null; }
  if (_chartProject) { _chartProject.destroy(); _chartProject = null; }

  // Build weekly data
  const today = new Date();
  const weekLabels = [];
  const weekHours = [];
  for (let w = 11; w >= 0; w--) {
    const d = new Date(today);
    d.setDate(d.getDate() - (w * 7));
    const ws = getWeekStart(d.toISOString().slice(0, 10));
    const blocks = getWeekBlocks(ws).filter(l => !l.warmup);
    const hrs = Math.round(blocks.length * blockMin / 60 * 10) / 10;
    const label = new Date(ws + 'T00:00:00');
    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    weekLabels.push(mon[label.getMonth()] + ' ' + label.getDate());
    weekHours.push(hrs);
  }

  const ctxW = document.getElementById('chartWeekly');
  if (ctxW && typeof Chart !== 'undefined') {
    _chartWeekly = new Chart(ctxW, {
      type: 'line',
      data: {
        labels: weekLabels,
        datasets: [{
          data: weekHours,
          borderColor: '#7db88a',
          backgroundColor: 'rgba(125,184,138,0.08)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#7db88a',
          fill: true,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#2a2a32' }, ticks: { color: '#8b8b96', font: { size: 10, family: 'Inter' }, maxRotation: 45 } },
          y: { grid: { color: '#2a2a32' }, ticks: { color: '#8b8b96', font: { size: 10, family: 'Inter' } }, beginAtZero: true }
        }
      }
    });
  }

  // Build project breakdown data
  const projectBlocks = {};
  for (const log of state.focusLog.filter(l => !l.warmup)) {
    const track = getTrackForMilestone(log.milestoneId);
    if (track) projectBlocks[track] = (projectBlocks[track] || 0) + 1;
  }

  const projLabels = [];
  const projData = [];
  const projColors = [];
  for (const track of [...ACTIVE_TRACKS, ...INACTIVE_TRACKS]) {
    if (projectBlocks[track]) {
      projLabels.push(getTrackLabel(track));
      projData.push(projectBlocks[track]);
      projColors.push(TRACK_COLORS[track] || '#5a5a66');
    }
  }

  const ctxP = document.getElementById('chartProject');
  if (ctxP && typeof Chart !== 'undefined') {
    _chartProject = new Chart(ctxP, {
      type: 'bar',
      data: {
        labels: projLabels,
        datasets: [{
          data: projData,
          backgroundColor: projColors,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#2a2a32' }, ticks: { color: '#8b8b96', font: { size: 10, family: 'Inter' } }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: '#8b8b96', font: { size: 10, family: 'Inter' } } }
        }
      }
    });
  }
}

// ================================================================
// FEATURE 11: SUNDAY WEEKLY REVIEW
// ================================================================

function isReviewDoneThisWeek() {
  const ws = getWeekStart(todayStr());
  return (state.weeklyReviews || []).some(r => r.weekOf === ws);
}

function checkSundayReview() {
  if (dayOfWeek() !== 0) return;
  if (isReviewDoneThisWeek()) return;
  // Show the review modal
  openWeeklyReview();
}

function openWeeklyReview() {
  renderWeeklyReviewStep(1);
  document.getElementById('weeklyReviewModal').classList.add('open');
}

function closeWeeklyReview() {
  document.getElementById('weeklyReviewModal').classList.remove('open');
}

function renderWeeklyReviewStep(step) {
  const box = document.getElementById('weeklyReviewBox');

  // Compute last week stats
  const now = new Date();
  const thisWeekStart = getWeekStart(todayStr());
  const d = new Date(thisWeekStart + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  const lastWeekStart = d.toISOString().slice(0, 10);
  const lastWeekBlocks = getWeekBlocks(lastWeekStart);
  const lastFull = lastWeekBlocks.filter(l => !l.warmup);
  const lastProjects = [...new Set(lastFull.map(l => getTrackForMilestone(l.milestoneId)).filter(Boolean))];

  const dots = `<div class="review-step-indicator">
    <div class="review-step-dot${step === 1 ? ' active' : step > 1 ? ' done' : ''}"></div>
    <div class="review-step-dot${step === 2 ? ' active' : step > 2 ? ' done' : ''}"></div>
    <div class="review-step-dot${step === 3 ? ' active' : ''}"></div>
  </div>`;

  let html = dots;

  if (step === 1) {
    html += `<div class="review-title">Weekly Reflect</div>
      <div class="review-subtitle">How did last week go?</div>
      <div class="review-stats-row">
        <div class="review-stat">
          <div class="review-stat-val">${lastFull.length}</div>
          <div class="review-stat-lbl">Blocks done</div>
        </div>
        <div class="review-stat">
          <div class="review-stat-val">${lastProjects.length}</div>
          <div class="review-stat-lbl">Projects</div>
        </div>
        <div class="review-stat">
          <div class="review-stat-val">${state.streak.current}</div>
          <div class="review-stat-lbl">Streak</div>
        </div>
      </div>
      <label class="review-label">What went well?</label>
      <textarea class="review-textarea" id="reviewWentWell" placeholder="Anything you completed, maintained, or felt good about..."></textarea>
      <label class="review-label">What was hard?</label>
      <textarea class="review-textarea" id="reviewWasHard" placeholder="Any obstacles, distractions, or things that felt heavy..."></textarea>
      <div class="review-actions">
        <button class="review-skip" onclick="closeWeeklyReview()">Skip for now</button>
        <button class="btn btn-primary" onclick="reviewStep2()">Continue</button>
      </div>`;

  } else if (step === 2) {
    const fps = state.weeklyPlan.focusProjects || [];
    let projectPicker = '';
    for (const track of ACTIVE_TRACKS) {
      const color = TRACK_COLORS[track];
      const label = getTrackLabel(track);
      const selected = fps.includes(track);
      projectPicker += `<div class="focus-proj-toggle${selected ? ' selected' : ''}" data-track="${track}" style="${selected ? 'border-color:' + color : ''}" onclick="reviewToggleProject('${track}', this)">
        <span class="dot" style="background:${color}"></span>
        <span class="fp-name">${escapeHtml(label)}</span>
      </div>`;
    }
    html += `<div class="review-title">Plan This Week</div>
      <div class="review-subtitle">Which projects will you focus on?</div>
      <div class="focus-picker" style="margin-bottom:0;">${projectPicker}</div>
      <div class="review-actions">
        <button class="review-skip" onclick="closeWeeklyReview()">Skip for now</button>
        <button class="btn btn-primary" onclick="reviewStep3()">Done</button>
      </div>`;

  } else if (step === 3) {
    html += `<div class="review-done-card">
      <div class="review-done-pts">+15 pts</div>
      <div class="review-done-msg">Review complete. You showed up for yourself this week.</div>
      <button class="btn btn-primary" onclick="closeWeeklyReview()">Back to home</button>
    </div>`;
  }

  box.innerHTML = html;
}

function reviewStep2() {
  const wentWell = document.getElementById('reviewWentWell')?.value || '';
  const wasHard = document.getElementById('reviewWasHard')?.value || '';
  // Store for later save
  document.getElementById('weeklyReviewBox').dataset.wentWell = wentWell;
  document.getElementById('weeklyReviewBox').dataset.wasHard = wasHard;
  renderWeeklyReviewStep(2);
}

function reviewToggleProject(track, el) {
  let fps = state.weeklyPlan.focusProjects || [];
  if (fps.includes(track)) {
    fps = fps.filter(t => t !== track);
    el.classList.remove('selected');
    el.style.borderColor = '';
  } else {
    fps.push(track);
    el.classList.add('selected');
    el.style.borderColor = TRACK_COLORS[track] || '';
  }
  state.weeklyPlan.focusProjects = fps;
  saveState();
}

function reviewStep3() {
  const box = document.getElementById('weeklyReviewBox');
  const wentWell = box.dataset.wentWell || '';
  const wasHard = box.dataset.wasHard || '';
  const focusProjects = state.weeklyPlan.focusProjects || [];
  const ws = getWeekStart(todayStr());

  if (!state.weeklyReviews) state.weeklyReviews = [];
  state.weeklyReviews.push({
    weekOf: ws,
    wentWell,
    wasHard,
    focusProjects: [...focusProjects],
    completedAt: Date.now(),
    pointsAwarded: 15
  });
  state.points += 15;
  saveState();
  showConfetti();
  renderWeeklyReviewStep(3);
}

// ================================================================
// FEATURE 12: EXPORT / IMPORT
// ================================================================

function exportData() {
  const json = JSON.stringify(state, null, 2);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `soma-data-${today}.json`;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function copyDataToClipboard() {
  const json = JSON.stringify(state, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    const btn = document.getElementById('copyDataBtn');
    if (btn) {
      btn.textContent = 'Copied!';
      btn.classList.add('success');
      setTimeout(() => { btn.textContent = 'Copy JSON'; btn.classList.remove('success'); }, 2000);
    }
  }).catch(() => {
    alert('Copy failed. Try exporting instead.');
  });
}

function importData() {
  document.getElementById('importFileInput').click();
}

function handleImportFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid format');
      if (!confirm('Replace all current data with the imported file?')) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      state = loadState();
      handleRoute();
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// ---- Utility ----
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
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
    saveState();
  }
})();

// Init
handleRoute();
