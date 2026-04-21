/* ============================================================
   SOMA — app.js
   Calm ADHD focus tracker
   Features: F1 step edit/reorder, F2 editable names+tags,
             F3 urgency flags, F4 backward scheduling,
             F5 admin tab, F6 prep/batch system
   ============================================================ */

// ---- Constants ----
// Defaults: tracks that start active unless the user has archived them via
// state.trackOverrides[trackId].active. See isTrackActive / getActiveTrackIds.
const ACTIVE_TRACKS_DEFAULT = ['dlpfc', 'package', 'bd2', 'dg'];
const ARCHIVED_TRACKS_DEFAULT = ['fic', 'eef2', 'network', 'cursor', 'learning', 'career', 'concord_sae', 'assortativity', 'dementia_review'];

function isTrackActive(trackId) {
  const override = (state && state.trackOverrides) ? state.trackOverrides[trackId] : null;
  if (override && typeof override.active === 'boolean') return override.active;
  // Round 5: custom projects are active by default unless archived or
  // explicitly flipped inactive via trackOverrides.
  if (state && state.customProjects && state.customProjects[trackId]) {
    return !state.customProjects[trackId].archived;
  }
  return ACTIVE_TRACKS_DEFAULT.includes(trackId);
}
function getAllTrackIds() {
  // Stable ordering: defaults first (in their declared order), then any extra
  // tracks present in QUEST_DATA, then custom projects.
  const ordered = [...ACTIVE_TRACKS_DEFAULT, ...ARCHIVED_TRACKS_DEFAULT];
  const seen = new Set(ordered);
  if (typeof QUEST_DATA === 'object' && QUEST_DATA) {
    for (const k of Object.keys(QUEST_DATA)) {
      if (!seen.has(k)) { ordered.push(k); seen.add(k); }
    }
  }
  // Round 5: include custom projects.
  if (state && state.customProjects) {
    for (const k of Object.keys(state.customProjects)) {
      if (!seen.has(k)) { ordered.push(k); seen.add(k); }
    }
  }
  return ordered;
}
function getActiveTrackIds() { return getAllTrackIds().filter(isTrackActive); }
function getArchivedTrackIds() { return getAllTrackIds().filter(t => !isTrackActive(t)); }

// Round 5: custom project support — a project is "custom" when its id
// lives in state.customProjects. Built-in projects live in QUEST_DATA.
function isCustomProject(trackId) {
  return !!(state.customProjects && state.customProjects[trackId]);
}
function getCustomProject(trackId) {
  return (state.customProjects && state.customProjects[trackId]) || null;
}
function getMilestonesForTrack(trackId) {
  if (QUEST_DATA && QUEST_DATA[trackId]) return QUEST_DATA[trackId];
  const cp = getCustomProject(trackId);
  return (cp && Array.isArray(cp.milestones)) ? cp.milestones : [];
}
// Palette for custom projects — muted pastel-earth swatches that match the
// Soma theme tokens. First entry is the default accent.
const CUSTOM_PROJECT_PALETTE = ['#c8a07a', '#7db88a', '#b07da8', '#6ba3b5', '#c49a6c', '#9a9a6c'];
function getTrackColor(trackId) {
  const override = state.projectOverrides && state.projectOverrides[trackId];
  if (override && override.color) return override.color;
  const cp = getCustomProject(trackId);
  if (cp && cp.color) return cp.color;
  return TRACK_COLORS[trackId] || 'var(--text-muted)';
}
function getTrackDescription(trackId) {
  const override = state.projectOverrides && state.projectOverrides[trackId];
  if (override && typeof override.description === 'string') return override.description;
  const cp = getCustomProject(trackId);
  if (cp && typeof cp.description === 'string') return cp.description;
  return '';
}
function getTrackIconKey(trackId) {
  const override = state.projectOverrides && state.projectOverrides[trackId];
  if (override && override.icon && MILESTONE_ICONS[override.icon]) return override.icon;
  const cp = getCustomProject(trackId);
  if (cp && cp.icon && MILESTONE_ICONS[cp.icon]) return cp.icon;
  return 'code';
}
function getTrackIcon(trackId) {
  return MILESTONE_ICONS[getTrackIconKey(trackId)] || MILESTONE_ICONS.dot;
}
const TRACK_COLORS = {
  dlpfc: '#c49a6c', package: '#7db88a', bd2: '#b07da8', dg: '#6ba3b5',
  fic: '#c49a6c', eef2: '#9a9a6c', network: '#9ca3af', cursor: '#6ba3b5',
  learning: '#8b8b96', career: '#9ca3af',
  concord_sae: '#b07da8', assortativity: '#9a9a6c', dementia_review: '#8b8b96'
};
const TRACK_LABELS = {
  dlpfc: 'DLPFC AD Project', package: 'txomics Package', bd2: 'BD2 ACC', dg: 'DG Neurogenesis',
  fic: 'RUSH FIC AD', eef2: 'EEF2 Methods', network: 'Network & ML', cursor: 'Cursor Plan',
  learning: 'Learning Plan', career: 'Career Path',
  concord_sae: 'CONCORD SAE', assortativity: 'Tissue Assortativity', dementia_review: 'Dementia Review'
};
const TYPE_COLORS = {
  code: '#7db88a', figure: '#b07da8', writing: '#c49a6c', lab: '#6ba3b5', wetlab: '#6ba3b5',
  career: '#9ca3af', paper: '#c49a6c', learning: '#8b8b96', qc: '#d4a44c'
};
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const STORAGE_KEY = 'questboard_v3';

// ---- State ----
// Round 5: declare `state` before invoking loadState() — loadState assigns
// to the outer binding so rollover helpers can read it via the closure.
let state;
state = loadState();
let timerInterval = null;
let timerRemaining = 0;
let timerTotal = 0;
let timerRunning = false;
let timerStepId = null;
let timerMilestoneId = null;
let timerIsWarmup = false;
let pendingNavHash = null;

// ---- Theme system ----
// Round 5 Task 13: 8 popular, designer-tested palettes. Default is rose-pine-dawn.
const THEMES = [
  { id: 'tokyo-night',       label: 'Tokyo Night',      top: '#24283b', bot: '#1a1b26' },
  { id: 'catppuccin-mocha',  label: 'Catppuccin Mocha', top: '#313244', bot: '#1e1e2e' },
  { id: 'nord',              label: 'Nord',             top: '#3b4252', bot: '#2e3440' },
  { id: 'gruvbox-dark',      label: 'Gruvbox Dark',     top: '#32302f', bot: '#282828' },
  { id: 'catppuccin-latte',  label: 'Catppuccin Latte', top: '#e6e9ef', bot: '#eff1f5' },
  { id: 'solarized-light',   label: 'Solarized Light',  top: '#eee8d5', bot: '#fdf6e3' },
  { id: 'rose-pine-dawn',    label: 'Rosé Pine Dawn',   top: '#fffaf3', bot: '#faf4ed' },
  { id: 'gruvbox-light',     label: 'Gruvbox Light',    top: '#f2e5bc', bot: '#fbf1c7' },
];

// Map legacy theme ids to the closest new palette.
const LEGACY_THEME_MAP = {
  midnight: 'tokyo-night',
  ocean:    'nord',
  forest:   'catppuccin-mocha',
  dusk:     'gruvbox-dark',
  sand:     'gruvbox-light',
  fog:      'rose-pine-dawn'
};

function applyTheme(themeId) {
  // Migrate legacy ids.
  if (LEGACY_THEME_MAP[themeId]) themeId = LEGACY_THEME_MAP[themeId];
  if (!THEMES.find(t => t.id === themeId)) themeId = 'rose-pine-dawn';
  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem('soma_theme', themeId);
  // Update PWA theme-color meta tag
  const meta = document.querySelector('meta[name="theme-color"]');
  const t = THEMES.find(t => t.id === themeId);
  if (meta && t) meta.setAttribute('content', t.bot);
}

function getTheme() {
  let stored = localStorage.getItem('soma_theme');
  if (LEGACY_THEME_MAP[stored]) {
    stored = LEGACY_THEME_MAP[stored];
    localStorage.setItem('soma_theme', stored);
  }
  if (!THEMES.find(t => t.id === stored)) return 'rose-pine-dawn';
  return stored;
}

// Apply saved theme immediately
applyTheme(getTheme());

// ---- State helpers ----
function defaultState() {
  // Task 12: seed dementia_review as done — it's a completed retrospective track.
  const demSteps = {};
  for (const id of ['dem-ad','dem-ftd-als','dem-lewy-vasc','dem-prion-cte','dem-molecular','dem-convergence']) {
    demSteps[id] = { status: 'done', blocksCompleted: 1, notes: '', checklist: {} };
  }
  return {
    steps: { ...demSteps },
    milestones: { 'dem-review-1': { status: 'done', notes: '' } },
    _demReviewSeeded: true,
    focusLog: [],
    weeklyPlan: { weekOf: null, blocks: {}, approved: false, focusProjects: [], perProjectBlocks: {}, rollover: {}, history: [], weekGoal: null },
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
    // Round 5: custom user-created projects and per-project metadata overrides.
    customProjects: {},
    projectOverrides: {},
    // Feature 3: urgency flags
    urgency: {},
    // Feature 5: admin tasks
    adminTasks: [],
    // Feature 6: prep batches
    prepBatches: [],
    // Feature 9: rewards
    rewards: { tiers: {}, claimedHistory: [] },
    // Feature 11: weekly reviews
    weeklyReviews: [],
    // Task 10: QC gate item checks, keyed by `${milestoneId}.${gateIndex}`
    qcChecks: {}
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const d = defaultState();
      // Task 4 migration: de-dup customSteps that were corrupted by the old
      // moveStep() which wrote both _base copies AND user-added steps.
      // If a customSteps array has any _base entries, dedupe by id.
      // Round 2 Task A: also drop customSteps for milestones that no longer
      // exist in QUEST_DATA at all (fully orphaned), and drop _base entries
      // whose underlying base step id no longer exists.
      const allMilestoneIds = new Set();
      const baseIdsByMs = {};
      if (typeof QUEST_DATA === 'object' && QUEST_DATA) {
        for (const track of Object.keys(QUEST_DATA)) {
          for (const ms of (QUEST_DATA[track] || [])) {
            allMilestoneIds.add(ms.id);
            baseIdsByMs[ms.id] = new Set((ms.steps || []).map(st => st.id));
          }
        }
      }
      const customSteps = s.customSteps || {};
      for (const msId of Object.keys(customSteps)) {
        if (!allMilestoneIds.has(msId)) {
          // Milestone no longer exists — drop the entire entry.
          delete customSteps[msId];
          continue;
        }
        const arr = customSteps[msId];
        if (!Array.isArray(arr)) { delete customSteps[msId]; continue; }
        const validBaseIds = baseIdsByMs[msId] || new Set();
        const seen = new Set();
        const cleaned = [];
        for (const step of arr) {
          if (!step || !step.id) continue;
          if (seen.has(step.id)) continue;
          // Drop orphan _base entries whose underlying base step is gone.
          if (step._base && !validBaseIds.has(step.id)) continue;
          seen.add(step.id);
          cleaned.push(step);
        }
        customSteps[msId] = cleaned;
      }
      // Task 12 migration: dementia_review is a completed retrospective track.
      // Pre-mark its step statuses as done so the progress bars reflect reality.
      // Only runs once — guarded by a version flag on state.
      const demStepIds = ['dem-ad','dem-ftd-als','dem-lewy-vasc','dem-prion-cte','dem-molecular','dem-convergence'];
      if (!s._demReviewSeeded) {
        s.steps = s.steps || {};
        for (const id of demStepIds) {
          if (!s.steps[id] || s.steps[id].status !== 'done') {
            s.steps[id] = { status: 'done', blocksCompleted: 1, notes: '', checklist: {} };
          }
        }
        s.milestones = s.milestones || {};
        if (!s.milestones['dem-review-1'] || s.milestones['dem-review-1'].status !== 'done') {
          s.milestones['dem-review-1'] = { status: 'done', notes: '' };
        }
        s._demReviewSeeded = true;
      }
      const merged = {
        ...d, ...s,
        settings: { ...d.settings, ...(s.settings || {}) },
        streak: { ...d.streak, ...(s.streak || {}) },
        weeklyPlan: {
          ...d.weeklyPlan,
          ...(s.weeklyPlan || {}),
          perProjectBlocks: (s.weeklyPlan && s.weeklyPlan.perProjectBlocks) || {},
          // Round 5 Task 4: additive migration for rollover + history.
          rollover: (s.weeklyPlan && s.weeklyPlan.rollover) || {},
          history: (s.weeklyPlan && Array.isArray(s.weeklyPlan.history)) ? s.weeklyPlan.history : [],
          // Round 5 Task 8: per-week goal override. null → fall back to settings.weeklyGoal.
          weekGoal: (s.weeklyPlan && typeof s.weeklyPlan.weekGoal === 'number') ? s.weeklyPlan.weekGoal : null
        },
        customSteps: customSteps,
        trackOverrides: s.trackOverrides || {},
        // Round 5 Task 4: additive migration for customProjects + projectOverrides.
        customProjects: s.customProjects || {},
        projectOverrides: s.projectOverrides || {},
        urgency: s.urgency || {},
        adminTasks: s.adminTasks || [],
        prepBatches: s.prepBatches || [],
        rewards: s.rewards || { tiers: {}, claimedHistory: [] },
        weeklyReviews: s.weeklyReviews || [],
        qcChecks: s.qcChecks || {}
      };
      // Round 5: let state be visible before running rollover so helpers
      // that read `state` (like computeCompletedByTrack) resolve correctly.
      state = merged;
      try { maybeRolloverWeeklyPlan(); } catch (e) { console.warn('Rollover error', e); }
      return state;
    }
  } catch (e) { console.warn('State load error', e); }
  const fresh = defaultState();
  state = fresh;
  try { maybeRolloverWeeklyPlan(); } catch (e) { console.warn('Rollover error', e); }
  return state;
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
// Round 2 Task A: self-healing — always dedupe by id and drop orphan _base
// entries whose underlying base step no longer exists in QUEST_DATA.
function getAllSteps(milestoneId) {
  const custom = state.customSteps[milestoneId] || [];
  let baseSteps = [];
  // Round 5: walk built-in tracks AND custom projects.
  const walk = (msList) => {
    for (const ms of (msList || [])) {
      if (ms.id === milestoneId) { baseSteps = ms.steps || []; return true; }
    }
    return false;
  };
  let found = false;
  for (const track of Object.keys(QUEST_DATA)) {
    if (walk(QUEST_DATA[track])) { found = true; break; }
  }
  if (!found && state.customProjects) {
    for (const track of Object.keys(state.customProjects)) {
      if (walk((state.customProjects[track] || {}).milestones)) break;
    }
  }
  let out;
  if (custom.some(s => s && s._base)) {
    // custom is a full override; keep it but drop any _base entries
    // that no longer correspond to a real base step.
    const baseIds = new Set(baseSteps.map(s => s.id));
    out = custom.filter(s => !s._base || baseIds.has(s.id));
  } else {
    out = [...baseSteps, ...custom];
  }
  // Always dedupe by id, preserving first occurrence.
  const seen = new Set();
  return out.filter(s => {
    if (!s || !s.id) return false;
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

function getMilestone(milestoneId) {
  for (const track of Object.keys(QUEST_DATA)) {
    for (const ms of QUEST_DATA[track]) {
      if (ms.id === milestoneId) return ms;
    }
  }
  // Round 5: look in custom projects.
  if (state.customProjects) {
    for (const track of Object.keys(state.customProjects)) {
      const list = (state.customProjects[track] || {}).milestones || [];
      for (const ms of list) {
        if (ms.id === milestoneId) return ms;
      }
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
  // Round 5: look in custom projects.
  if (state.customProjects) {
    for (const track of Object.keys(state.customProjects)) {
      const list = (state.customProjects[track] || {}).milestones || [];
      for (const ms of list) {
        if (ms.id === milestoneId) return track;
      }
    }
  }
  return null;
}

function getCurrentMilestone(trackId) {
  const milestones = getMilestonesForTrack(trackId);
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

// Task 10: QC gate item count (1 block each, checkbox-trackable)
function getQcItems(milestoneId) {
  const ms = getMilestone(milestoneId);
  if (!ms || !ms.gate || !Array.isArray(ms.gate.items)) return [];
  return ms.gate.items.map((label, i) => ({
    id: `${milestoneId}-qc-${i}`,
    milestoneId,
    index: i,
    label,
    estimated_blocks: 1,
    type: 'qc'
  }));
}

function isQcChecked(milestoneId, index) {
  return !!(state.qcChecks && state.qcChecks[`${milestoneId}.${index}`]);
}

function setQcChecked(milestoneId, index, val) {
  if (!state.qcChecks) state.qcChecks = {};
  const key = `${milestoneId}.${index}`;
  if (val) state.qcChecks[key] = true;
  else delete state.qcChecks[key];
  saveState();
}

function getQcProgress(milestoneId) {
  const items = getQcItems(milestoneId);
  const done = items.filter(it => isQcChecked(milestoneId, it.index)).length;
  return { done, total: items.length };
}

// Task 10: include QC items so totals stay accurate.
function getTotalBlocksForMilestone(milestoneId) {
  const steps = getAllSteps(milestoneId);
  const stepBlocks = steps.reduce((sum, s) => sum + (s.estimated_blocks || 1), 0);
  const qc = getQcItems(milestoneId).length; // 1 block each
  return stepBlocks + qc;
}

function getRemainingBlocksForMilestone(milestoneId) {
  const steps = getAllSteps(milestoneId);
  const stepRem = steps.reduce((sum, s) => {
    const ss = getStepState(s.id);
    if (ss.status === 'done') return sum;
    const est = s.estimated_blocks || 1;
    const done = ss.blocksCompleted || 0;
    return sum + Math.max(0, est - done);
  }, 0);
  const qc = getQcItems(milestoneId);
  const qcRem = qc.filter(it => !isQcChecked(milestoneId, it.index)).length;
  return stepRem + qcRem;
}

function getMilestoneStepProgress(milestoneId) {
  const steps = getAllSteps(milestoneId);
  const qc = getQcItems(milestoneId);
  const total = steps.length + qc.length;
  if (total === 0) return '—';
  const stepsDone = steps.filter(s => getStepState(s.id).status === 'done').length;
  const qcDone = qc.filter(it => isQcChecked(milestoneId, it.index)).length;
  return `${stepsDone + qcDone}/${total}`;
}

// Task 3: aggregate progress across ALL milestones of a track.
function getTrackProgressSummary(trackId) {
  const milestones = getMilestonesForTrack(trackId);
  let stepsDone = 0, stepsTotal = 0, blocksDone = 0, blocksTotal = 0;
  for (const ms of milestones) {
    const steps = getAllSteps(ms.id);
    const qcItems = getQcItems(ms.id);
    stepsTotal += steps.length + qcItems.length;
    stepsDone += steps.filter(s => getStepState(s.id).status === 'done').length;
    stepsDone += qcItems.filter(it => isQcChecked(ms.id, it.index)).length;
    blocksTotal += getTotalBlocksForMilestone(ms.id);
    blocksDone += (getTotalBlocksForMilestone(ms.id) - getRemainingBlocksForMilestone(ms.id));
  }
  return { stepsDone, stepsTotal, blocksDone, blocksTotal };
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

// Round 5 Task 1: weekly rollover helpers.
// computeCompletedByTrack returns { trackId: count } of non-warmup blocks logged
// during the given week, grouped by the milestone’s track.
function computeCompletedByTrack(weekStart) {
  const out = {};
  const blocks = getWeekBlocks(weekStart);
  for (const log of blocks) {
    if (log.warmup) continue;
    const track = getTrackForMilestone(log.milestoneId);
    if (!track) continue;
    out[track] = (out[track] || 0) + 1;
  }
  return out;
}
// computeUnfinishedBlocks returns { trackId: max(0, allocated - completed) } for
// every known track (built-in + custom). Only positive counts are kept.
function computeUnfinishedBlocks(weekStart) {
  const perProject = (state.weeklyPlan && state.weeklyPlan.perProjectBlocks) || {};
  const completed = computeCompletedByTrack(weekStart);
  const out = {};
  for (const t of getAllTrackIds()) {
    const allocated = perProject[t] || 0;
    const done = completed[t] || 0;
    const unfinished = Math.max(0, allocated - done);
    if (unfinished > 0) out[t] = unfinished;
  }
  return out;
}
// Monday-morning reset. Archives the outgoing week into weeklyPlan.history
// and pre-applies unfinished blocks to the new week as rollover. Idempotent.
function maybeRolloverWeeklyPlan() {
  const wp = state.weeklyPlan;
  if (!wp) return;
  const thisMonday = getWeekStart(todayStr());
  if (!wp.weekOf) {
    wp.weekOf = thisMonday;
    wp.rollover = wp.rollover || {};
    wp.history = wp.history || [];
    saveState();
    return;
  }
  if (wp.weekOf === thisMonday) return;

  // New week detected — archive outgoing week to history.
  const outgoingWeek = wp.weekOf;
  const unfinished = computeUnfinishedBlocks(outgoingWeek);
  const outgoingCompleted = computeCompletedByTrack(outgoingWeek);
  const outgoingHistory = {
    weekOf: outgoingWeek,
    goal: (state.settings && state.settings.weeklyGoal) || 10,
    allocated: Object.values(wp.perProjectBlocks || {}).reduce((a, b) => a + b, 0),
    completed: Object.values(outgoingCompleted).reduce((a, b) => a + b, 0),
    perProject: {}
  };
  for (const t of getAllTrackIds()) {
    outgoingHistory.perProject[t] = {
      allocated: (wp.perProjectBlocks || {})[t] || 0,
      completed: outgoingCompleted[t] || 0
    };
  }
  wp.history = wp.history || [];
  wp.history.push(outgoingHistory);
  if (wp.history.length > 26) wp.history = wp.history.slice(-26);

  // Set up the new week with rollover as starting allocation.
  wp.weekOf = thisMonday;
  wp.perProjectBlocks = { ...unfinished };
  wp.rollover = { ...unfinished };
  wp.approved = false;
  wp.blocks = {};
  wp.focusProjects = Object.keys(unfinished).filter(t => unfinished[t] > 0);
  // Round 5 Task 8: clear per-week goal on rollover so next week falls back
  // to the settings.weeklyGoal default.
  wp.weekGoal = null;

  saveState();
}

// Round 5 Task 8: effective weekly goal — a per-week override (wp.weekGoal)
// takes precedence over settings.weeklyGoal.
function getEffectiveWeeklyGoal() {
  const wp = state.weeklyPlan || {};
  if (typeof wp.weekGoal === 'number' && wp.weekGoal > 0) return wp.weekGoal;
  return (state.settings && state.settings.weeklyGoal) || 10;
}

function getNextQueuedTask() {
  const focusProjects = state.weeklyPlan.focusProjects || [];
  const activeIds = getActiveTrackIds();
  const tracks = focusProjects.length > 0 ? focusProjects.filter(t => activeIds.includes(t)) : activeIds;
  for (const track of tracks) {
    const ms = getCurrentMilestone(track);
    if (!ms) continue;
    const step = getActiveStep(ms.id);
    if (step) return { track, milestone: ms, step };
  }
  return null;
}

// Feature 2 + Round 5: effective track label.
// Priority: projectOverrides.label → trackOverrides.label (legacy) → customProjects.label → TRACK_LABELS.
function getTrackLabel(trackId) {
  const po = state.projectOverrides && state.projectOverrides[trackId];
  if (po && po.label) return po.label;
  const override = state.trackOverrides && state.trackOverrides[trackId];
  if (override && override.label) return override.label;
  const cp = getCustomProject(trackId);
  if (cp && cp.label) return cp.label;
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
// Task 5: timer persists across navigation — no more anti-switch modal.
function navigate(hash) {
  window.location.hash = hash;
}

function handleRoute() {
  const hash = window.location.hash || '#home';
  const parts = hash.slice(1).split('/');
  const route = parts[0];

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  // Map secondary routes back onto primary nav items for highlight.
  const navMap = {
    path: 'projects', track: 'projects', prep: 'projects',
    schedule: 'progress', rewards: 'progress',
    ideas: 'more', admin: 'more', docs: 'more', settings: 'more'
  };
  document.querySelectorAll('.nav-item').forEach(n => {
    const target = navMap[route] || route;
    n.classList.toggle('active', n.dataset.nav === target);
  });

  switch (route) {
    case 'home': case '':
      renderHome();
      document.getElementById('view-home').classList.add('active');
      break;
    case 'projects':
      renderProjects();
      document.getElementById('view-projects').classList.add('active');
      // Task 2: if ?template=prep, auto-open prep drawer.
      if (hash.indexOf('template=prep') !== -1) {
        openPrepDrawer();
      }
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
      // Task 2: redirect standalone #prep to Projects with drawer open.
      window.location.hash = '#projects?template=prep';
      return;
    case 'rewards':
      renderRewards();
      document.getElementById('view-rewards').classList.add('active');
      break;
    case 'progress':
      renderProgress();
      document.getElementById('view-progress').classList.add('active');
      break;
    case 'docs':
      renderDocs();
      document.getElementById('view-docs').classList.add('active');
      break;
    case 'settings':
      renderSettings();
      document.getElementById('view-settings').classList.add('active');
      break;
    case 'more':
      // Task 1: More opens an overflow drawer; fall back view = Home.
      renderHome();
      document.getElementById('view-home').classList.add('active');
      openMoreDrawer();
      break;
    default:
      renderHome();
      document.getElementById('view-home').classList.add('active');
  }

  // Update timer pill visibility after every route change (Task 5).
  updateTimerPill();
}

// Task 1: More drawer — overflow for Ideas, Admin, Docs, Rewards, Schedule, Settings.
function openMoreDrawer() {
  const overlay = document.getElementById('drawerOverlay');
  const drawer = document.getElementById('drawer');
  const items = [
    { hash: '#schedule', label: 'Schedule', desc: 'Weekly plan and blocks' },
    { hash: '#rewards', label: 'Rewards', desc: 'Claim milestone rewards' },
    { hash: '#ideas', label: 'Ideas', desc: 'Capture and triage ideas' },
    { hash: '#admin', label: 'Admin', desc: 'Admin tasks and inbox' },
    { hash: '#docs', label: 'Docs', desc: 'Reference and help' },
    { hash: '#settings', label: 'Settings', desc: 'Themes, blocks, preferences' }
  ];
  drawer.innerHTML = `
    <div class="drawer-header">
      <h2>More</h2>
      <button class="btn btn-ghost" id="closeMore" aria-label="Close">×</button>
    </div>
    <div class="drawer-body">
      <div class="more-list">
        ${items.map(it => `
          <a class="more-row" href="${it.hash}" data-more-link>
            <div class="more-row-main">
              <div class="more-row-label">${it.label}</div>
              <div class="more-row-desc">${it.desc}</div>
            </div>
            <span class="more-row-caret">${ICONS ? (ICONS.chevronRight || '›') : '›'}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;
  overlay.classList.add('open');
  document.getElementById('closeMore').onclick = closeDrawer;
  drawer.querySelectorAll('[data-more-link]').forEach(a => {
    a.addEventListener('click', () => { closeDrawer(); });
  });
}

function closeDrawer() {
  const overlay = document.getElementById('drawerOverlay');
  overlay.classList.remove('open');
  const drawer = document.getElementById('drawer');
  if (drawer) drawer.removeAttribute('data-drawer-kind');
  // If we closed the More drawer while route=#more, snap back to Home.
  if ((window.location.hash || '').startsWith('#more')) {
    window.location.hash = '#home';
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

// ============================================================
// Round 2 Task D/E — Candy Land icon set for milestones and steps.
// All icons inherit color via currentColor so they match the theme.
// ============================================================
const MILESTONE_ICONS = {
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>',
  hexagon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><circle cx="12" cy="12" r="2.2"/></svg>',
  cluster: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><circle cx="7" cy="8" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="17" cy="15" r="2"/><circle cx="8" cy="16" r="2"/><path d="M9 8l5.5-.5M8 16l8-.5M7.5 10l.5 4M16 9l1 4.5"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v16M15 6v16"/></svg>',
  bar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M4 20V9M10 20V4M16 20v-8M22 20H2"/></svg>',
  rings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M20 4c-6 0-11 4-13 10l-2 6 6-2c6-2 10-7 10-13z"/><path d="M5 19l7-7"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M9 4c-3 0-4 1.5-4 4v2c0 1-1 2-2 2 1 0 2 1 2 2v2c0 2.5 1 4 4 4"/><path d="M15 4c3 0 4 1.5 4 4v2c0 1 1 2 2 2-1 0-2 1-2 2v2c0 2.5-1 4-4 4"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/><path d="M7.5 14h9"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5z"/><path d="M18 3v16"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M8 4h8v4a4 4 0 11-8 0V4z"/><path d="M5 4H3a3 3 0 003 3M19 4h2a3 3 0 01-3 3"/><path d="M10 12v3l-1 3h6l-1-3v-3"/></svg>',
  dot: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><circle cx="12" cy="12" r="5"/></svg>'
};

function getMilestoneIconKey(milestone) {
  if (!milestone) return 'dot';
  if (milestone.icon && MILESTONE_ICONS[milestone.icon]) return milestone.icon;
  const hay = `${milestone.id || ''} ${milestone.title || ''} ${milestone.category || ''}`.toLowerCase();
  if (/segment/.test(hay)) return 'hexagon';
  if (/decod|\bqc\b|quality/.test(hay)) return 'target';
  if (/cell type|typing|celltyp|cluster/.test(hay)) return 'cluster';
  if (/spatial|domain|banksy|region|lamin/.test(hay)) return 'map';
  if (/deg|differential|pathway|analysis|stat/.test(hay)) return 'bar';
  if (/niche|interaction|neighborhood|\blr\b|cell-?cell|ven/.test(hay)) return 'rings';
  if (/writ|manuscript|paper|draft|review/.test(hay)) return 'pen';
  if (/package|repo|setup|pipeline|cursor|packet|code/.test(hay)) return 'code';
  if (/gate|shield|checks?/.test(hay)) return 'shield';
  if (/wet|flask|prep|rna-?seq|library/.test(hay)) return 'flask';
  if (/read|literature|learn/.test(hay)) return 'book';
  if (/defense|career|thesis/.test(hay)) return 'trophy';
  return 'dot';
}

function getMilestoneIcon(milestone) {
  return MILESTONE_ICONS[getMilestoneIconKey(milestone)] || MILESTONE_ICONS.dot;
}

function getStepIconKey(step) {
  if (!step) return 'dot';
  const t = (step.type || '').toLowerCase();
  if (t === 'code') return 'code';
  if (t === 'wet' || t === 'wetlab' || t === 'lab') return 'flask';
  if (t === 'reading' || t === 'learning') return 'book';
  if (t === 'writing' || t === 'paper') return 'pen';
  if (t === 'figure') return 'bar';
  if (t === 'analysis') return 'bar';
  if (t === 'qc') return 'shield';
  if (t === 'career') return 'trophy';
  return 'dot';
}
function getStepIcon(step) {
  return MILESTONE_ICONS[getStepIconKey(step)] || MILESTONE_ICONS.dot;
}

// Round 4: Weekly plan panel shown on Home. Lets the user allocate 90-min
// blocks per active project for the current week using simple +/- steppers.
// Totals show live; remainder is visible. Clicking 'Edit full week' navigates
// to the Schedule page for the day-by-day view.
// Round 5: Monday-Friday short date range, e.g. "Apr 21 – Apr 25". Omits year.
function formatWeekRange(mondayStr) {
  if (!mondayStr) return '';
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const m = new Date(mondayStr + 'T00:00:00');
  const f = new Date(m);
  f.setDate(m.getDate() + 4);
  return `${mon[m.getMonth()]} ${m.getDate()} – ${mon[f.getMonth()]} ${f.getDate()}`;
}

// Round 5 Tasks 6/7/8/9: the week-plan panel has two modes.
// EXPANDED (not yet approved, or explicitly re-opened): full stepper UI.
// COLLAPSED (approved AND for current week): one-line summary at bottom.
// The panel also shows the Mon–Fri date range, an inline goal editor, and
// a Sunday rollover preview (above the panel) when applicable.
// Mode is controlled by `state.weeklyPlan._panelExpanded` (transient, per-session
// hint) OR falls back to `!approved`.
function isWeekPlanApprovedForThisWeek() {
  const wp = state.weeklyPlan || {};
  const thisMonday = getWeekStart(todayStr());
  return !!wp.approved && wp.weekOf === thisMonday;
}
function isWeekPlanExpanded() {
  const wp = state.weeklyPlan || {};
  if (wp._panelExpanded === true) return true;
  if (wp._panelExpanded === false) return false;
  // Default: expanded when not yet approved for this week.
  return !isWeekPlanApprovedForThisWeek();
}

function renderWeeklyPlanPanel(opts) {
  opts = opts || {};
  const placement = opts.placement || 'top'; // 'top' or 'bottom'
  const activeIds = getActiveTrackIds();
  if (activeIds.length === 0) return '';

  const weeklyGoal = getEffectiveWeeklyGoal();
  const perProject = state.weeklyPlan.perProjectBlocks || {};
  const rollover = state.weeklyPlan.rollover || {};
  const weekStart = getWeekStart(todayStr());
  const weekB = getWeekBlocks(weekStart);
  const weekRange = formatWeekRange(state.weeklyPlan.weekOf || weekStart);

  // Completed blocks this week, broken down by track.
  const doneByTrack = {};
  for (const log of weekB) {
    if (log.warmup) continue;
    const track = getTrackForMilestone(log.milestoneId);
    if (!track) continue;
    doneByTrack[track] = (doneByTrack[track] || 0) + 1;
  }

  // Sum allocated blocks across projects.
  let allocated = 0;
  for (const t of activeIds) allocated += (perProject[t] || 0);

  const remaining = Math.max(0, weeklyGoal - allocated);
  const overLimit = allocated > weeklyGoal;
  const expanded = isWeekPlanExpanded();
  const approvedThisWeek = isWeekPlanApprovedForThisWeek();

  // COLLAPSED variant: render only at bottom placement; skip top placement.
  if (!expanded && approvedThisWeek) {
    if (placement !== 'bottom') return '';
    const parts = activeIds
      .filter(t => (perProject[t] || 0) > 0)
      .map(t => `${perProject[t]} ${escapeHtml(getTrackLabel(t))}`);
    const summary = parts.length > 0 ? parts.join(' · ') : 'no blocks assigned';
    return `<section class="week-plan-panel week-plan-panel-collapsed" aria-label="Weekly plan summary">
      <div class="week-plan-collapsed-row">
        <span class="week-plan-collapsed-label">This week</span>
        <span class="week-plan-collapsed-range">${escapeHtml(weekRange)}</span>
        <span class="week-plan-collapsed-total">${allocated} blocks</span>
        <span class="week-plan-collapsed-sep">·</span>
        <span class="week-plan-collapsed-breakdown">${summary}</span>
        <button class="week-plan-collapsed-edit" onclick="expandWeekPlan()">Edit ›</button>
      </div>
    </section>`;
  }

  // EXPANDED variant: only render at top placement.
  if (placement !== 'top') return '';

  let html = '';

  // Round 5 Task 1: Sunday preview — show what will roll over to next Monday.
  if (dayOfWeek() === 0) {
    const preview = computeUnfinishedBlocks(weekStart);
    const entries = Object.keys(preview)
      .filter(t => preview[t] > 0)
      .map(t => `${preview[t]} from ${getTrackLabel(t)}`);
    if (entries.length > 0) {
      const joined = entries.length === 1
        ? entries[0]
        : entries.slice(0, -1).join(', ') + ' and ' + entries.slice(-1);
      html += `<div class="sunday-rollover-preview" role="note">
        <span class="sunday-rollover-preview-label">Next Monday</span>
        <span class="sunday-rollover-preview-text">${escapeHtml(joined)} will be pre-assigned for you.</span>
      </div>`;
    }
  }

  // Round 5 Task 7: allocation-state wording.
  // allocated < goal → "N left to assign"
  // allocated === goal → "ready to approve"
  // allocated > goal → "N over goal"
  let subText;
  if (overLimit) subText = `${allocated - weeklyGoal} over goal`;
  else if (allocated === weeklyGoal) subText = 'ready to approve';
  else subText = `${remaining} left to assign`;

  // Round 5 Task 9: goal is shown as a clickable inline editor.
  const goalEditor = `<button class="week-plan-goal-btn" type="button" onclick="startEditWeekGoal(event)" title="Change this week’s goal">${weeklyGoal}</button>`;

  html += `<section class="week-plan-panel" aria-label="Weekly plan">
    <div class="week-plan-header">
      <div class="week-plan-title-group">
        <div class="week-plan-title-line">
          <span class="week-plan-title">This week</span>
          <span class="week-plan-range">${escapeHtml(weekRange)}</span>
        </div>
        <div class="week-plan-sub"><span class="week-plan-alloc">${allocated}</span> / ${goalEditor} blocks allocated · ${escapeHtml(subText)}</div>
      </div>
      <a class="week-plan-edit-link" onclick="navigate('#schedule')">Edit full week ›</a>
    </div>
    <div class="week-plan-rows">`;

  for (const track of activeIds) {
    const color = getTrackColor(track);
    const label = getTrackLabel(track);
    const planned = perProject[track] || 0;
    const done = doneByTrack[track] || 0;
    const pct = planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : 0;
    const carried = rollover[track] || 0;
    const carriedBadge = carried > 0
      ? ` <span class="week-plan-rollover" title="Carried from last week">+${carried} carried</span>`
      : '';
    html += `<div class="week-plan-row" data-track="${track}">
      <span class="week-plan-dot" style="background:${color}"></span>
      <span class="week-plan-label">${escapeHtml(label)}${carriedBadge}</span>
      <div class="week-plan-stepper" role="group" aria-label="${escapeHtml(label)} blocks per week">
        <button class="week-plan-step-btn" aria-label="Decrease" onclick="adjustProjectBlocks('${track}', -1)">−</button>
        <span class="week-plan-count"><span class="week-plan-done">${done}</span><span class="week-plan-sep"> / </span><span class="week-plan-planned">${planned}</span></span>
        <button class="week-plan-step-btn" aria-label="Increase" onclick="adjustProjectBlocks('${track}', 1)">+</button>
      </div>
      <div class="week-plan-bar" aria-hidden="true"><div class="week-plan-bar-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  }

  html += `</div>`;

  // Action row: Approve (Task 6), plus quick-balance helper when there's room.
  html += `<div class="week-plan-actions">`;
  if (remaining > 0 && activeIds.length > 0) {
    html += `<button class="week-plan-autofill" onclick="autoFillWeeklyPlan()">Split remaining evenly</button>`;
  }
  const approveLabel = approvedThisWeek ? 'Re-approve and collapse' : 'Approve plan';
  html += `<button class="week-plan-approve-btn" onclick="approveWeekPlan()">${approveLabel}</button>`;
  html += `</div>`;

  if (overLimit) {
    html += `<div class="week-plan-hint week-plan-hint-warn">You’ve allocated more than this week’s goal of ${weeklyGoal} blocks. Adjust above, or change the goal.</div>`;
  }

  html += `</section>`;
  return html;
}

// Round 5 Task 6: approve the plan → collapses the panel.
function approveWeekPlan() {
  state.weeklyPlan.approved = true;
  state.weeklyPlan._panelExpanded = false;
  saveState();
  renderHome();
}
// Re-open the expanded panel from the collapsed summary.
function expandWeekPlan() {
  state.weeklyPlan._panelExpanded = true;
  saveState();
  renderHome();
}
// Round 5 Task 8: inline edit of this week’s goal. Integer 1–40.
function startEditWeekGoal(evt) {
  if (evt) evt.stopPropagation();
  const btn = evt && evt.currentTarget;
  if (!btn) return;
  const current = getEffectiveWeeklyGoal();
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.max = '40';
  input.value = String(current);
  input.className = 'week-plan-goal-input';
  btn.replaceWith(input);
  input.focus();
  input.select();
  function commit() {
    const raw = parseInt(input.value, 10);
    if (!isNaN(raw) && raw >= 1 && raw <= 40) {
      state.weeklyPlan.weekGoal = raw;
      saveState();
    }
    renderHome();
  }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.removeEventListener('blur', commit); renderHome(); }
  });
}

function adjustProjectBlocks(trackId, delta) {
  if (!state.weeklyPlan.perProjectBlocks) state.weeklyPlan.perProjectBlocks = {};
  const cur = state.weeklyPlan.perProjectBlocks[trackId] || 0;
  const next = Math.max(0, Math.min(40, cur + delta));
  state.weeklyPlan.perProjectBlocks[trackId] = next;

  // Keep focusProjects in sync: any track with > 0 allocation is a focus project.
  const fps = [];
  for (const t of getActiveTrackIds()) {
    if ((state.weeklyPlan.perProjectBlocks[t] || 0) > 0) fps.push(t);
  }
  state.weeklyPlan.focusProjects = fps;

  saveState();
  renderHome();
}

function autoFillWeeklyPlan() {
  const activeIds = getActiveTrackIds();
  if (activeIds.length === 0) return;
  const weeklyGoal = getEffectiveWeeklyGoal();
  const per = state.weeklyPlan.perProjectBlocks || {};
  let allocated = 0;
  for (const t of activeIds) allocated += (per[t] || 0);
  let remaining = Math.max(0, weeklyGoal - allocated);
  if (remaining === 0) return;

  // Distribute remaining round-robin across projects with the lowest current allocation.
  // This feels fair without wiping existing choices.
  const sorted = [...activeIds].sort((a, b) => (per[a] || 0) - (per[b] || 0));
  let i = 0;
  while (remaining > 0) {
    const t = sorted[i % sorted.length];
    per[t] = (per[t] || 0) + 1;
    remaining--;
    i++;
  }
  state.weeklyPlan.perProjectBlocks = per;

  // Sync focusProjects.
  const fps = [];
  for (const t of activeIds) {
    if ((per[t] || 0) > 0) fps.push(t);
  }
  state.weeklyPlan.focusProjects = fps;

  saveState();
  renderHome();
}

// Task 7 + Round 2 Task B: today's planned blocks as a milestone-level
// checklist. Each row shows the milestone title as the primary label and
// the next substep (first non-done step) as a secondary line with its own
// Start Focus shortcut.
// Round 5 Task 12: today's target blocks — the number of 90-min commitments
// for today. Prefer an explicit plan grid slot count, else spread the weekly
// goal across Mon–Fri, with a lower weekend target.
function getTodayTarget() {
  const wp = state.weeklyPlan || {};
  const goal = getEffectiveWeeklyGoal();
  const dow = dayOfWeek();
  if (dow === 0 || dow === 6) {
    return (state.settings.blocksPerDay && state.settings.blocksPerDay.min) || 2;
  }
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayKeys[dow];
  const todayBlocks = wp.blocks && wp.blocks[todayKey];
  if (Array.isArray(todayBlocks) && todayBlocks.length > 0) return todayBlocks.length;
  const minPerDay = (state.settings.blocksPerDay && state.settings.blocksPerDay.min) || 2;
  return Math.max(minPerDay, Math.ceil(goal / 5));
}

// Round 5 Task 12: one row per 90-min block committed to today. Each substep
// that needs multiple blocks repeats across rows (one row per block). Capped
// at getTodayTarget(). Replaces the Round 3 Task 2 multi-dot block-row view.
function renderPlannedBlocksChecklist() {
  const target = getTodayTarget();
  const todayBlocksLogged = getTodayBlocks().filter(l => !l.warmup).length;
  const completedToday = Math.min(target, todayBlocksLogged);

  // Build the row queue — one entry per block-commitment for today.
  // Source substeps from the focus projects' current milestones, honoring the
  // weekly plan's per-project allocations when set.
  const rows = [];
  const perProject = (state.weeklyPlan && state.weeklyPlan.perProjectBlocks) || {};
  const focusProjects = state.weeklyPlan.focusProjects || [];
  const tracks = focusProjects.length > 0
    ? focusProjects.filter(t => isTrackActive(t))
    : getActiveTrackIds();

  for (const track of tracks) {
    if (rows.length >= target) break;
    const ms = getCurrentMilestone(track);
    if (!ms) continue;
    const steps = getAllSteps(ms.id);
    for (const step of steps) {
      if (rows.length >= target) break;
      const ss = getStepState(step.id);
      if (ss.status === 'done') continue;
      const est = step.estimated_blocks || 1;
      const remaining = Math.max(0, est - (ss.blocksCompleted || 0));
      for (let i = 0; i < remaining && rows.length < target; i++) {
        rows.push({
          track,
          milestone: ms,
          step,
          ss,
          blockIndex: (ss.blocksCompleted || 0) + i, // 0-based block # for this step
          totalBlocks: est
        });
      }
    }
  }

  let html = `<div class="planned-blocks">
    <div class="planned-blocks-header">
      <div class="planned-blocks-title">Today’s planned blocks</div>
      <div class="planned-blocks-count">${completedToday} / ${target} completed today</div>
    </div>`;

  // Round 5 Task 12E: after today's target is met, show the calm done state.
  if (todayBlocksLogged >= target && target > 0) {
    html += `<div class="planned-blocks-done">
      <div class="planned-blocks-done-title">You’ve completed today’s ${target} block${target === 1 ? '' : 's'}.</div>
      <div class="planned-blocks-done-sub">Rest is productive too.</div>
      <button class="btn btn-outline planned-blocks-done-btn" onclick="navigate('#schedule')">View tomorrow’s plan ›</button>
    </div>`;
    html += `</div>`;
    return html;
  }

  if (rows.length === 0) {
    html += `<div class="planned-blocks-empty">No queued milestones. <a onclick="navigate('#projects')">Pick a project</a>.</div>`;
    html += `</div>`;
    return html;
  }

  const blockMin = state.settings.blockDurationMin || 90;
  html += `<ul class="planned-list">`;
  for (const p of rows) {
    const color = getTrackColor(p.track);
    const label = getTrackLabel(p.track);
    const msTitle = p.milestone.title;
    const step = p.step;
    const blockNo = p.blockIndex + 1;
    const totalBlocks = p.totalBlocks;
    const metaBlockLabel = totalBlocks > 1
      ? `${blockMin}-min block · ${blockNo} of ${totalBlocks} for this substep`
      : `${blockMin}-min block`;

    // Round 5.1: show only 'N-min block · Project' on Home. Specifics
    // (milestone title, substep title, checklist) are visible after clicking
    // into the focus view. Keeps Home low-cognitive-load.
    html += `<li class="planned-row planned-row-today planned-row-calm">
      <span class="planned-row-colordot" style="background:${color}" aria-hidden="true"></span>
      <div class="planned-row-main">
        <div class="planned-row-title-calm">${blockMin} min block</div>
        <div class="planned-row-meta"><span class="planned-row-track" style="color:${color}">${escapeHtml(label)}</span></div>
      </div>
      <div class="planned-row-actions">
        <button class="planned-row-details" data-details-step="${step.id}" data-details-ms="${p.milestone.id}">Details ›</button>
        <button class="planned-row-go" onclick="navigate('#focus/${p.milestone.id}/${step.id}')">Start Focus</button>
      </div>
    </li>`;
  }
  html += `</ul>`;
  html += `</div>`;
  return html;
}

// Round 3 Task 2: block-dot click on Home planned rows.
// Clicking an empty dot logs one block (increments blocksCompleted).
// Clicking a filled dot un-logs it. Does NOT mark the step done.
function handleBlockDotClick(stepId, milestoneId, dotIndex, est) {
  const ss = getStepState(stepId);
  const done = ss.blocksCompleted || 0;
  const idx = Number(dotIndex);
  const max = Number(est) || (getStepFromIds(milestoneId, stepId)?.estimated_blocks || 3);
  // Filled (idx < done) → unlog to exactly idx blocks; Empty → log up to idx+1 blocks.
  let newCount;
  if (idx < done) {
    newCount = idx; // un-fill this dot and any after it
  } else {
    newCount = Math.min(max, idx + 1);
  }
  ss.blocksCompleted = newCount;
  if (newCount > 0 && ss.status === 'pending') ss.status = 'active';
  if (newCount === 0 && ss.status === 'active') ss.status = 'pending';
  saveState();
  renderHome();
}

// Helper: locate a step object inside QUEST_DATA from milestone id + step id.
function getStepFromIds(milestoneId, stepId) {
  for (const track of Object.keys(QUEST_DATA)) {
    for (const ms of QUEST_DATA[track]) {
      if (ms.id !== milestoneId) continue;
      for (const s of (ms.steps || [])) {
        if (s.id === stepId) return s;
      }
    }
  }
  // Round 5: look in custom projects.
  if (state.customProjects) {
    for (const track of Object.keys(state.customProjects)) {
      const list = (state.customProjects[track] || {}).milestones || [];
      for (const ms of list) {
        if (ms.id !== milestoneId) continue;
        for (const s of (ms.steps || [])) {
          if (s.id === stepId) return s;
        }
      }
    }
  }
  return null;
}

// Round 3 Task 5: wire up the Plan-week '?' popover.
// Open on click of '?'; close on outside click or Esc. Does not trigger the main button.
function wirePlanWeekHelp() {
  const help = document.getElementById('planWeekHelp');
  const pop = document.getElementById('planWeekPopover');
  if (!help || !pop) return;

  const close = () => {
    pop.hidden = true;
    help.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick, true);
    document.removeEventListener('keydown', onKey);
  };
  const open = () => {
    pop.hidden = false;
    help.setAttribute('aria-expanded', 'true');
    // Defer binding so the opening click doesn't immediately close it.
    setTimeout(() => {
      document.addEventListener('click', onDocClick, true);
      document.addEventListener('keydown', onKey);
    }, 0);
  };
  function onDocClick(e) {
    if (pop.contains(e.target) || help.contains(e.target)) return;
    close();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  help.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (pop.hidden) open(); else close();
  });
}

// Task 2: Prep drawer — reuse the prep view inside the overlay.
function openPrepDrawer() {
  const overlay = document.getElementById('drawerOverlay');
  const drawer = document.getElementById('drawer');
  drawer.innerHTML = `
    <div class="drawer-header">
      <h2>Sample prep batch</h2>
      <button class="btn btn-ghost" id="closePrep" aria-label="Close">×</button>
    </div>
    <div class="drawer-body" id="prepDrawerBody"></div>
  `;
  overlay.classList.add('open');
  // Render prep content into the drawer body by temporarily swapping view id.
  renderPrepInto(document.getElementById('prepDrawerBody'));
  document.getElementById('closePrep').onclick = closeDrawer;
}

// Render the full prep UI into any container (used by drawer).
function renderPrepInto(container) {
  const originalEl = document.getElementById('view-prep');
  // Give our target element the id expected by renderPrep(), swap back after.
  const prevId = container.id;
  if (originalEl && originalEl !== container) originalEl.id = 'view-prep-orig';
  container.id = 'view-prep';
  renderPrep();
  container.id = prevId;
  if (originalEl && originalEl !== container) originalEl.id = 'view-prep';
}

// ---- RENDER: Home ----
function renderHome() {
  // Round 5 Task 1: catch any week boundary crossed since load without reload.
  maybeRolloverWeeklyPlan();

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

  // Round 4: The weekly plan panel below replaces the old 'No weekly plan yet' nudge.

  if (allDoneToday) {
    html += `<div class="done-msg">You've done enough today. Rest is productive too.</div>`;
  } else if (next) {
    const color = TRACK_COLORS[next.track];
    // Round 2 Task B: hero shows substep (primary) + milestone context (secondary).
    const substepTxt = next.step.title;
    const contextTxt = `${next.milestone.title} · ${getTrackLabel(next.track)}`;
    // Round 3 Task 2: block-dots under substep title on the hero button.
    const heroEst = next.step.estimated_blocks || 3;
    const heroSs = getStepState(next.step.id);
    const heroDone = Math.min(heroEst, heroSs.blocksCompleted || 0);
    let heroDots = '';
    for (let i = 0; i < heroEst; i++) {
      const filled = i < heroDone;
      const current = (i === heroDone);
      heroDots += `<span class="step-block-dot${filled ? ' filled' : ''}${current ? ' current' : ''}" aria-hidden="true"></span>`;
    }
    // Round 5.1: calm hero — no substep text, no context. Just the action +
    // project dot so Home carries zero decision-making surface.
    const blockMin = state.settings.blockDurationMin || 90;
    const trackLabel = getTrackLabel(next.track);
    html += `<button class="start-block-btn start-block-btn-v2 start-block-btn-calm" style="background:${color}" onclick="navigate('#focus/${next.milestone.id}/${next.step.id}')">
      <span class="btn-label-sm">Start next block</span>
      <span class="start-block-calm-main">
        <span class="start-block-calm-dot" style="background:${color}" aria-hidden="true"></span>
        <span class="start-block-calm-text">${blockMin} min block · ${escapeHtml(trackLabel)}</span>
      </span>
    </button>`;
  } else {
    html += `<div class="done-msg" style="background:rgba(255,255,255,0.03);border-color:var(--border);">No active tasks queued. Check your <a onclick="navigate('#projects')" style="color:var(--text-primary);text-decoration:underline;cursor:pointer;">projects</a>.</div>`;
  }

  // Round 4: weekly plan panel with per-project block sliders.
  // Round 5 Task 6: when approved for this week, the expanded panel
  // returns '' from the top placement, and renders a collapsed one-line
  // summary at the bottom placement (below today's planned blocks).
  html += renderWeeklyPlanPanel({ placement: 'top' });

  // Task 7: planned blocks checklist (replaces today block-circles).
  html += renderPlannedBlocksChecklist();

  // Round 5 Task 6: collapsed summary placement (bottom, de-emphasized).
  html += renderWeeklyPlanPanel({ placement: 'bottom' });

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

  // Plan My Week button (Round 3 Task 5: wrap with ? info icon + popover).
  html += `<div class="plan-week-wrap">
    <button class="plan-week-btn" id="planWeekBtn" onclick="copyWeeklyPrompt()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      Plan my week with AI
    </button>
    <button class="plan-week-help" id="planWeekHelp" type="button" aria-label="How this works" aria-haspopup="dialog" aria-expanded="false">?</button>
    <div class="plan-week-popover" id="planWeekPopover" role="dialog" aria-label="How Plan my week with AI works" hidden>
      <ol>
        <li>Tap this button — we copy an AI prompt to your clipboard with your active projects, block capacity, and deadlines.</li>
        <li>Paste into ChatGPT, Claude, or Perplexity.</li>
        <li>The AI returns a suggested weekly plan.</li>
        <li>Skim the plan; pick the blocks that feel right and add them to today's queue.</li>
      </ol>
    </div>
  </div>`;

  el.innerHTML = html;

  // Round 3 Task 2: bind block-dot buttons on planned rows.
  el.querySelectorAll('.block-dot-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleBlockDotClick(btn.dataset.stepid, btn.dataset.msid, btn.dataset.dotIndex, btn.dataset.est);
    });
  });

  // Round 3 Task 5: plan-week '?' help popover.
  wirePlanWeekHelp();

  // Round 2 Task B: Details → open step drawer.
  el.querySelectorAll('.planned-row-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openStepDrawer(btn.dataset.detailsMs, btn.dataset.detailsStep);
    });
  });
}

// ---- RENDER: Projects ----
function renderProjects() {
  const el = document.getElementById('view-projects');
  let html = '<div class="section-title">Projects</div>';

  // Round 5 Task 3b: + New project card.
  html += `<div class="project-new-card" onclick="openCreateProjectModal()">
    <span class="project-new-plus" aria-hidden="true">+</span>
    <span class="project-new-label">New project</span>
  </div>`;

  const activeTracks = getActiveTrackIds();
  const archivedTracks = getArchivedTrackIds();

  for (const track of activeTracks) {
    const ms = getCurrentMilestone(track);
    const color = getTrackColor(track);
    const label = getTrackLabel(track); // Feature 2
    const msTitle = ms ? ms.title : 'Complete';
    // Task 3: summed progress across ALL milestones of this track.
    const sum = getTrackProgressSummary(track);
    const stepsLabel = sum.stepsTotal > 0
      ? `${sum.stepsDone} / ${sum.stepsTotal} steps`
      : '—';
    const blocksLabel = sum.blocksTotal > 0
      ? `${sum.blocksDone} / ${sum.blocksTotal} blocks`
      : '';
    const pct = sum.blocksTotal > 0 ? Math.round((sum.blocksDone / sum.blocksTotal) * 100) : 0;
    html += `<div class="project-card" onclick="navigate('#track/${track}')">
      <span class="dot" style="background:${color}"></span>
      <span class="proj-name proj-name-editable" data-track="${track}" ondblclick="startEditProjectName(event,'${track}')">${escapeHtml(label)}</span>
      <span class="proj-milestone">${escapeHtml(msTitle)}</span>
      <span class="proj-progress">${stepsLabel}${blocksLabel ? ` · ${blocksLabel}` : ''}</span>
      <div class="proj-progress-bar"><div class="proj-progress-bar-fill" style="width:${pct}%; background:${color}"></div></div>
      <button class="proj-edit-btn" data-edit-track="${track}" title="Edit project" aria-label="Edit project">Edit</button>
      <button class="proj-archive-btn" data-archive-track="${track}" title="Move this project to the archive" aria-label="Archive project">Archive</button>
    </div>`;
  }

  // Task 2: Templates section (Sample Prep as template).
  html += `<div class="section-title section-title-sub" style="margin-top:2rem;">Templates</div>`;
  html += `<div class="template-card" onclick="openPrepDrawer()">
    <span class="dot" style="background:#6ba3b5"></span>
    <div class="template-card-main">
      <div class="template-card-title">Sample prep batch</div>
      <div class="template-card-desc">Run the RNA-seq / library prep protocol checklist</div>
    </div>
    <span class="template-card-cta">Start ›</span>
  </div>`;

  html += `<div class="archive-toggle" id="archiveToggle" onclick="toggleArchive()">
    ${ICONS.chevronRight}
    <span>${archivedTracks.length} archived projects</span>
  </div>`;
  html += `<div class="archive-list" id="archiveList" style="display:none;">`;
  for (const track of archivedTracks) {
    const ms = getCurrentMilestone(track);
    const color = getTrackColor(track);
    const label = getTrackLabel(track);
    const msTitle = ms ? ms.title : 'Complete';
    const sum = getTrackProgressSummary(track);
    const stepsLabel = sum.stepsTotal > 0 ? `${sum.stepsDone} / ${sum.stepsTotal} steps` : '—';
    const isCustom = isCustomProject(track);
    const restoreBtn = isCustom
      ? `<button class="proj-archive-btn proj-restore-btn" data-restore-custom="${track}" title="Restore this custom project" aria-label="Restore project">Restore</button>`
      : `<button class="proj-archive-btn proj-activate-btn" data-activate-track="${track}" title="Move this project back into active rotation" aria-label="Activate project">Activate</button>`;
    html += `<div class="project-card project-card-archived" onclick="navigate('#track/${track}')">
      <span class="dot" style="background:${color}"></span>
      <span class="proj-name">${escapeHtml(label)}</span>
      <span class="proj-milestone">${escapeHtml(msTitle)}</span>
      <span class="proj-progress">${stepsLabel}</span>
      ${restoreBtn}
    </div>`;
  }
  html += `</div>`;

  el.innerHTML = html;

  // Archive / Activate toggles (Round 3 Task 1).
  el.querySelectorAll('[data-archive-track]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setTrackActive(btn.dataset.archiveTrack, false);
    });
  });
  el.querySelectorAll('[data-activate-track]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setTrackActive(btn.dataset.activateTrack, true);
    });
  });
  el.querySelectorAll('[data-edit-track]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditProjectModal(btn.dataset.editTrack);
    });
  });
  el.querySelectorAll('[data-restore-custom]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      restoreCustomProject(btn.dataset.restoreCustom);
    });
  });
}

function setTrackActive(trackId, active) {
  if (!state.trackOverrides[trackId]) state.trackOverrides[trackId] = {};
  state.trackOverrides[trackId].active = !!active;
  // Round 5: also mirror the archived flag on custom projects.
  if (isCustomProject(trackId)) {
    state.customProjects[trackId].archived = !active;
  }
  saveState();
  renderProjects();
}

// Round 5 Task 3b: restore an archived custom project.
function restoreCustomProject(trackId) {
  if (!isCustomProject(trackId)) return;
  state.customProjects[trackId].archived = false;
  if (!state.trackOverrides[trackId]) state.trackOverrides[trackId] = {};
  state.trackOverrides[trackId].active = true;
  saveState();
  renderProjects();
}

// Round 5 Task 3b: project create/edit modal.
const PROJECT_ICON_CHOICES = ['target', 'hexagon', 'cluster', 'map', 'bar', 'rings', 'pen', 'code', 'shield', 'flask', 'book', 'trophy'];

function _closeProjectModal() {
  const overlay = document.getElementById('projectModalOverlay');
  if (overlay) overlay.remove();
}

function _openProjectModal(titleText, {label, description, iconKey, color, mode, trackId}) {
  _closeProjectModal();
  const iconsHtml = PROJECT_ICON_CHOICES.map(k => `
    <button type="button" class="icon-grid-cell ${k === iconKey ? 'icon-grid-cell-selected' : ''}" data-icon="${k}" aria-label="${k}">${MILESTONE_ICONS[k]}</button>
  `).join('');
  const swatchHtml = CUSTOM_PROJECT_PALETTE.map(c => `
    <button type="button" class="color-swatch ${c.toLowerCase() === (color || '').toLowerCase() ? 'color-swatch-selected' : ''}" data-color="${c}" style="background:${c}" aria-label="Color ${c}"></button>
  `).join('');

  const modeClass = mode === 'create' ? 'project-create-modal' : 'project-edit-modal';
  const saveLabel = mode === 'create' ? 'Create project' : 'Save';

  // Archive action — only for existing projects (edit mode).
  let archiveBtn = '';
  if (mode === 'edit' && trackId) {
    archiveBtn = `<button type="button" class="btn btn-outline project-modal-archive" data-archive-id="${trackId}">Archive project</button>`;
  }

  const overlay = document.createElement('div');
  overlay.id = 'projectModalOverlay';
  overlay.className = 'project-modal-overlay';
  overlay.innerHTML = `
    <div class="project-modal ${modeClass}" role="dialog" aria-label="${escapeHtml(titleText)}">
      <div class="project-modal-title">${escapeHtml(titleText)}</div>
      <label class="project-modal-field">
        <span>Name</span>
        <input type="text" id="projectModalName" value="${escapeHtml(label || '')}" maxlength="60" placeholder="Short name">
      </label>
      <label class="project-modal-field">
        <span>Description</span>
        <textarea id="projectModalDesc" rows="2" placeholder="What is this project for?" maxlength="240">${escapeHtml(description || '')}</textarea>
      </label>
      <div class="project-modal-field">
        <span>Icon</span>
        <div class="icon-grid" id="projectModalIcons">${iconsHtml}</div>
      </div>
      <div class="project-modal-field">
        <span>Color</span>
        <div class="color-swatches" id="projectModalColors">${swatchHtml}</div>
      </div>
      <div class="project-modal-actions">
        ${archiveBtn}
        <button type="button" class="btn btn-outline" id="projectModalCancel">Cancel</button>
        <button type="button" class="btn btn-primary" id="projectModalSave">${saveLabel}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Selection state
  let selIcon = iconKey;
  let selColor = color;

  overlay.querySelectorAll('.icon-grid-cell').forEach(btn => {
    btn.addEventListener('click', () => {
      selIcon = btn.dataset.icon;
      overlay.querySelectorAll('.icon-grid-cell').forEach(b => b.classList.remove('icon-grid-cell-selected'));
      btn.classList.add('icon-grid-cell-selected');
    });
  });
  overlay.querySelectorAll('.color-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      selColor = btn.dataset.color;
      overlay.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('color-swatch-selected'));
      btn.classList.add('color-swatch-selected');
    });
  });

  overlay.querySelector('#projectModalCancel').addEventListener('click', _closeProjectModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) _closeProjectModal(); });

  if (archiveBtn) {
    overlay.querySelector('.project-modal-archive').addEventListener('click', () => {
      _closeProjectModal();
      setTrackActive(trackId, false);
    });
  }

  overlay.querySelector('#projectModalSave').addEventListener('click', () => {
    const name = (document.getElementById('projectModalName').value || '').trim();
    if (!name) {
      document.getElementById('projectModalName').focus();
      return;
    }
    const desc = (document.getElementById('projectModalDesc').value || '').trim();
    if (mode === 'create') {
      _createCustomProject({label: name, description: desc, icon: selIcon, color: selColor});
    } else {
      _saveProjectEdits(trackId, {label: name, description: desc, icon: selIcon, color: selColor});
    }
    _closeProjectModal();
    renderProjects();
  });

  setTimeout(() => {
    const nameEl = document.getElementById('projectModalName');
    if (nameEl) nameEl.focus();
  }, 50);
}

function openCreateProjectModal() {
  _openProjectModal('New project', {
    label: '',
    description: '',
    iconKey: 'target',
    color: CUSTOM_PROJECT_PALETTE[0],
    mode: 'create'
  });
}

function openEditProjectModal(trackId) {
  _openProjectModal('Edit project', {
    label: getTrackLabel(trackId),
    description: getTrackDescription(trackId),
    iconKey: getTrackIconKey(trackId),
    color: getTrackColor(trackId),
    mode: 'edit',
    trackId
  });
}

function _createCustomProject({label, description, icon, color}) {
  if (!state.customProjects) state.customProjects = {};
  const id = 'custom_' + Date.now().toString(36);
  state.customProjects[id] = {
    id,
    label,
    description: description || '',
    icon: icon || 'target',
    color: color || CUSTOM_PROJECT_PALETTE[0],
    archived: false,
    milestones: []
  };
  // Mark active in overrides so it appears in active list.
  if (!state.trackOverrides[id]) state.trackOverrides[id] = {};
  state.trackOverrides[id].active = true;
  saveState();
}

function _saveProjectEdits(trackId, {label, description, icon, color}) {
  if (isCustomProject(trackId)) {
    // Custom — edit the canonical record.
    const cp = state.customProjects[trackId];
    cp.label = label;
    cp.description = description;
    cp.icon = icon;
    cp.color = color;
  } else {
    // Built-in — write to projectOverrides.
    if (!state.projectOverrides) state.projectOverrides = {};
    if (!state.projectOverrides[trackId]) state.projectOverrides[trackId] = {};
    state.projectOverrides[trackId].label = label;
    state.projectOverrides[trackId].description = description;
    state.projectOverrides[trackId].icon = icon;
    state.projectOverrides[trackId].color = color;
    // Also keep existing trackOverrides.label in sync so legacy reads still work.
    if (!state.trackOverrides[trackId]) state.trackOverrides[trackId] = {};
    state.trackOverrides[trackId].label = label;
  }
  saveState();
}

// Round 5 Task 3b: add milestone to a custom project.
function addCustomMilestone(trackId) {
  if (!isCustomProject(trackId)) return;
  const title = (prompt('Milestone title') || '').trim();
  if (!title) return;
  const id = 'cms_' + Date.now().toString(36);
  const ms = {
    id,
    title,
    category: 'custom',
    estimated_blocks: 0,
    steps: []
  };
  state.customProjects[trackId].milestones = state.customProjects[trackId].milestones || [];
  state.customProjects[trackId].milestones.push(ms);
  saveState();
  renderTrack(trackId);
}

// Round 5 Task 3b: add step to a milestone inside a custom project.
function addCustomStepToMilestone(trackId, milestoneId) {
  if (!isCustomProject(trackId)) return;
  const title = (prompt('Step title') || '').trim();
  if (!title) return;
  const blocksStr = prompt('Estimated blocks (90 min each)', '1');
  const estimated_blocks = Math.max(1, parseInt(blocksStr || '1') || 1);
  const cp = state.customProjects[trackId];
  const ms = (cp.milestones || []).find(m => m.id === milestoneId);
  if (!ms) return;
  ms.steps = ms.steps || [];
  const step = {
    id: 'cstep_' + Date.now().toString(36),
    title,
    type: 'custom',
    desc: '',
    estimated_blocks
  };
  ms.steps.push(step);
  saveState();
  renderPath(trackId, milestoneId);
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
  const milestones = getMilestonesForTrack(trackId);
  const color = getTrackColor(trackId);
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

  // Round 2 Task D: Candy Land layout — zig-zag candy nodes, one per milestone.
  html += `<div class="candy-path" data-track="${trackId}" style="--track-accent:${color}">`;

  milestones.forEach((ms, idx) => {
    const msState = getMilestoneState(ms.id);
    const allStepsList = getAllSteps(ms.id);
    const qcList = getQcItems(ms.id);
    const totalSteps = allStepsList.length + qcList.length;
    const stepsDone = allStepsList.filter(s => getStepState(s.id).status === 'done').length
      + qcList.filter(it => isQcChecked(ms.id, it.index)).length;
    const blocksLogged = getBlocksForMilestone(ms.id);
    const totalBlocks = getTotalBlocksForMilestone(ms.id);
    const urgLevel = getUrgency(ms.id);
    const urgDot = urgLevel ? `<span class="urgency-dot ${urgLevel}"></span>` : '';
    const side = idx % 2 === 0 ? 'left' : 'right';

    let variantClass = '';
    if (msState.status === 'done') variantClass = 'candy-node--done';
    else if (msState.status === 'locked') variantClass = 'candy-node--locked';
    else if (msState.status === 'active' || stepsDone > 0) variantClass = 'candy-node--active';

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
        paceHtml = `<span class="ms-pace-label ${paceClass}" title="${remaining} blocks remaining, ${weeks.toFixed(1)} weeks">~${pace} blocks/week</span>`;
      } else if (weeks === 0) {
        paceHtml = `<span class="ms-pace-label ms-pace-crit">Due today or overdue</span>`;
      }
    }

    const iconSvg = getMilestoneIcon(ms);
    const trophyBadge = msState.status === 'done' ? `<span class="candy-trophy" aria-hidden="true">${MILESTONE_ICONS.trophy}</span>` : '';

    html += `<div class="candy-row candy-row--${side}">
      <div class="candy-node ${variantClass}" data-msid="${ms.id}" onclick="navigate('#path/${trackId}/${ms.id}')" style="--node-accent:${color}">
        <div class="candy-icon" aria-hidden="true">${iconSvg}</div>
        <div class="candy-body">
          <div class="candy-title">${urgDot}<span class="candy-title-text">${escapeHtml(ms.title)}</span></div>
          <div class="candy-sub">${stepsDone}/${totalSteps} steps · ${blocksLogged}/${totalBlocks} blocks</div>
          <div class="candy-due-row" onclick="event.stopPropagation()">
            <input type="date" class="ms-due-date-input candy-due-input" data-ms="${ms.id}" value="${dueDate}" title="Set due date for this milestone">
            ${paceHtml}
          </div>
        </div>
        <button class="candy-urgency" onclick="event.stopPropagation();cycleUrgency('${ms.id}','track','${trackId}')" title="Set urgency">
          ${urgLevel === 'critical' ? '<span class="u-critical">critical</span>' : urgLevel === 'important' ? '<span class="u-important">important</span>' : '<span class="u-flag">flag</span>'}
        </button>
        ${trophyBadge}
      </div>
    </div>`;

    if (idx < milestones.length - 1) {
      const nextSide = (idx + 1) % 2 === 0 ? 'left' : 'right';
      const nextMs = milestones[idx + 1];
      const nextLocked = getMilestoneState(nextMs.id).status === 'locked';
      const thisDone = msState.status === 'done';
      let connClass = 'candy-path-connector';
      if (thisDone) connClass += ' candy-path-connector--done';
      else if (nextLocked) connClass += ' candy-path-connector--locked';
      html += `<div class="${connClass} candy-conn-${side}-to-${nextSide}" aria-hidden="true"></div>`;
    }
  });

  // Round 5 Task 3b: + Add milestone button for custom projects.
  if (isCustomProject(trackId)) {
    html += `<div class="candy-row candy-row--left">
      <button class="candy-add-milestone" onclick="addCustomMilestone('${trackId}')" aria-label="Add milestone">+ Add milestone</button>
    </div>`;
  }

  html += `</div>`; // /candy-path

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
  // Round 2 Task A/E: always go through getAllSteps so rendering is self-healing.
  const steps = getAllSteps(milestoneId);
  const blocksLogged = getBlocksForMilestone(milestoneId);
  const totalBlocks = getTotalBlocksForMilestone(milestoneId);

  let html = `<div class="path-header">
    <button class="back-btn" onclick="navigate('#track/${track}')">${ICONS.arrowLeft}</button>
    <div class="path-title"><span class="dot" style="background:${color}"></span> ${escapeHtml(ms.title)}</div>
  </div>
  <div class="path-progress-text">${blocksLogged} / ${totalBlocks} blocks logged</div>
  <div class="winding-path candy-path" style="--track-accent:${color}">`;

  const activeStep = getActiveStep(milestoneId);

  steps.forEach((step, idx) => {
    const ss = getStepState(step.id);
    const side = idx % 2 === 0 ? 'left' : 'right';
    const estBlocks = step.estimated_blocks || 1;
    const completed = getBlocksForStep(step.id);
    const isActive = activeStep && activeStep.id === step.id;
    let variantClass = '';
    if (ss.status === 'done') variantClass = 'candy-node--done';
    else if (isActive) variantClass = 'candy-node--active';
    else if (ss.status === 'locked') variantClass = 'candy-node--locked';
    const typeBadge = step.type ? `<span class="badge badge-type" style="color:${TYPE_COLORS[step.type] || 'var(--text-muted)'}">${step.type}</span>` : '';
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

    const reorderHtml = `<div class="step-reorder">
      <button class="step-reorder-btn" title="Move up" onclick="event.stopPropagation();moveStep('${milestoneId}','${step.id}','up')">${ICONS.arrowUp}</button>
      <button class="step-reorder-btn" title="Move down" onclick="event.stopPropagation();moveStep('${milestoneId}','${step.id}','down')">${ICONS.arrowDown}</button>
    </div>`;

    let dotsHtml = '';
    for (let b = 0; b < estBlocks; b++) {
      dotsHtml += `<span class="step-block-dot${b < completed ? ' filled' : ''}"></span>`;
    }

    const trophyBadge = ss.status === 'done' ? `<span class="candy-trophy" aria-hidden="true">${MILESTONE_ICONS.trophy}</span>` : '';
    const iconSvg = getStepIcon(step);

    html += `<div class="candy-row candy-row--${side}">
      <div class="candy-node candy-node--step ${variantClass}${dueIndicator}" style="--node-accent:${color}" data-stepid="${step.id}" data-msid="${milestoneId}" data-track="${track}">
        ${isActive ? `<div class="game-piece" style="background:${color}"></div>` : ''}
        <div class="candy-icon" aria-hidden="true">${iconSvg}</div>
        <div class="candy-body">
          <div class="candy-step-num">Step ${idx + 1}${isCustom ? ' · custom' : ''}</div>
          <div class="candy-title" onclick="openStepDrawer('${milestoneId}','${step.id}')">${urgDot}<span class="step-title-label">${escapeHtml(step.title)}</span></div>
          <div class="candy-step-meta" onclick="openStepDrawer('${milestoneId}','${step.id}')">
            ${typeBadge}
            <div class="step-block-dots">${dotsHtml}</div>
            ${ss.status === 'done' ? `<span class="done-check">${ICONS.check}</span>` : ''}
          </div>
        </div>
        ${reorderHtml}
        ${trophyBadge}
      </div>
    </div>`;
    if (idx < steps.length - 1) {
      const nextSide = (idx + 1) % 2 === 0 ? 'left' : 'right';
      const nextStep = steps[idx + 1];
      const nextLocked = getStepState(nextStep.id).status === 'locked';
      const thisDone = ss.status === 'done';
      let connClass = 'candy-path-connector';
      if (thisDone) connClass += ' candy-path-connector--done';
      else if (nextLocked) connClass += ' candy-path-connector--locked';
      html += `<div class="${connClass} candy-conn-${side}-to-${nextSide}" aria-hidden="true"></div>`;
    }
  });

  // Feature 1: Add step button
  html += `<div class="path-connector"></div>
    <div style="display:flex;justify-content:${steps.length % 2 === 0 ? 'flex-start' : 'flex-end'};">
      <button class="add-step-btn" onclick="showAddStepForm('${milestoneId}','${track}')">
        ${ICONS.plus} Add custom step
      </button>
    </div>`;

  // Task 10: render each gate item as a time-tracked QC task with checkbox.
  if (ms.gate) {
    const qcItems = getQcItems(milestoneId);
    const allChecked = qcItems.length > 0 && qcItems.every(it => isQcChecked(milestoneId, it.index));
    html += `<div class="path-connector"></div>`;
    if (allChecked) {
      html += `<div class="gate-card gate-passed">
        <h4>${escapeHtml(ms.gate.title)} — Gate passed ✓</h4>
      </div>`;
    } else {
      html += `<div class="qc-section">
        <div class="qc-section-head">
          <span class="qc-section-title">${escapeHtml(ms.gate.title)}</span>
          <span class="qc-section-count">${qcItems.filter(it => isQcChecked(milestoneId, it.index)).length} / ${qcItems.length} checks</span>
        </div>`;
      qcItems.forEach((qc, i) => {
        const side = (steps.length + i) % 2 === 0 ? 'left' : 'right';
        const checked = isQcChecked(milestoneId, qc.index);
        const trophyQc = checked ? `<span class="candy-trophy" aria-hidden="true">${MILESTONE_ICONS.trophy}</span>` : '';
        html += `<div class="candy-row candy-row--${side}">
          <div class="candy-node candy-node--step candy-node--qc${checked ? ' candy-node--done' : ''}" data-qc="1" data-msid="${milestoneId}" data-qcindex="${qc.index}">
            <div class="candy-icon" aria-hidden="true">${MILESTONE_ICONS.shield}</div>
            <div class="candy-body">
              <div class="candy-step-num">QC ${i + 1}</div>
              <div class="candy-title"><span class="step-title-label">${escapeHtml(qc.label)}</span></div>
              <div class="candy-step-meta">
                <span class="badge badge-type" style="color:${TYPE_COLORS.qc || 'var(--c-gold, var(--text-secondary))'}">qc</span>
                <label class="qc-check"><input type="checkbox" class="qc-cb" data-msid="${milestoneId}" data-qcindex="${qc.index}" ${checked ? 'checked' : ''}> <span>Mark checked</span></label>
                ${checked ? `<span class="done-check">${ICONS.check}</span>` : ''}
              </div>
            </div>
            ${trophyQc}
          </div>
        </div>${i < qcItems.length - 1 ? '<div class="candy-path-connector" aria-hidden="true"></div>' : ''}`;
      });
      html += `</div>`;
    }
  }

  if (ms.reward) {
    html += `<div class="path-connector"></div>
    <div class="reward-card">
      <div class="reward-text">${escapeHtml(ms.reward)}</div>
    </div>`;
  }

  html += `</div>`; // winding-path
  el.innerHTML = html;

  // Feature 1: inline title editing — click step title label to edit.
  // Note: only custom steps are editable inline; base steps open drawer via step-title-text onclick.
  el.querySelectorAll('.candy-node--step[data-stepid]').forEach(stepEl => {
    if (stepEl.dataset.qc === '1') return; // QC steps: no inline edit
    const stepId = stepEl.dataset.stepid;
    const msId = stepEl.dataset.msid;
    const trackId2 = stepEl.dataset.track;
    const label = stepEl.querySelector('.step-title-label');
    if (!label) return;
    const custom = (state.customSteps[msId] || []).find(s => s.id === stepId && !s._base);
    if (!custom) return;
    label.style.cursor = 'text';
    label.addEventListener('click', e => {
      e.stopPropagation();
      startInlineStepEdit(stepId, msId, trackId2, label);
    });
  });

  // Task 10: bind QC checkboxes.
  el.querySelectorAll('.qc-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      setQcChecked(cb.dataset.msid, parseInt(cb.dataset.qcindex, 10), cb.checked);
      renderPath(trackId, milestoneId);
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
  // Round 5 Task 3b: inside a custom project, write the step directly into
  // the milestone on state.customProjects so it becomes a first-class step.
  if (isCustomProject(trackId)) {
    const cp = state.customProjects[trackId];
    const ms = (cp.milestones || []).find(m => m.id === milestoneId);
    if (ms) {
      ms.steps = ms.steps || [];
      ms.steps.push({
        id: 'cstep_' + Date.now().toString(36),
        title,
        type: 'custom',
        desc: '',
        estimated_blocks
      });
      saveState();
      renderPath(trackId, milestoneId);
      return;
    }
  }
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
// Round 2 Task C: primary signature is (milestoneId, stepId).
// A legacy shim swaps arg order if an old caller still passes (stepId, milestoneId, track).
function openStepDrawer(milestoneId, stepId) {
  // Legacy-shim detection: if the first arg doesn't resolve to a milestone
  // but the second arg does, swap them.
  if (milestoneId && stepId && !getMilestone(milestoneId) && getMilestone(stepId)) {
    const tmp = milestoneId; milestoneId = stepId; stepId = tmp;
  }
  const ms = getMilestone(milestoneId);
  if (!ms) return;
  // Search in merged steps
  const allSteps = getAllSteps(milestoneId);
  const step = allSteps.find(s => s.id === stepId);
  if (!step) return;
  const ss = getStepState(stepId);
  const track = getTrackForMilestone(milestoneId);
  const color = TRACK_COLORS[track] || 'var(--c-dlpfc)';
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

  // Feature 1: delete custom step option. Round 5 Task 3b: also recognize
  // user-created steps inside a custom project's milestone.
  const isCustomStep = (state.customSteps[milestoneId] || []).some(s => s.id === stepId)
    || (isCustomProject(track) && stepId && stepId.startsWith('cstep_'));
  if (isCustomStep) {
    html += `<button class="btn btn-danger" style="width:100%;margin-top:8px;" onclick="deleteCustomStep('${stepId}','${milestoneId}','${track}')">Delete custom step</button>`;
  }

  const drawer = document.getElementById('drawer');
  drawer.setAttribute('data-drawer-kind', 'step');
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
  openStepDrawer(milestoneId, stepId);
}

// Round 2 Task C: expose on window for cross-render callsites.
window.openStepDrawer = openStepDrawer;

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

// (closeDrawer defined earlier — Task 1 version handles the More drawer too.)

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

// Feature 1: delete custom step. Round 5 Task 3b: also handles steps living
// inside a custom project's milestone.
function deleteCustomStep(stepId, milestoneId, trackId) {
  let removed = false;
  if (state.customSteps[milestoneId]) {
    const before = state.customSteps[milestoneId].length;
    state.customSteps[milestoneId] = state.customSteps[milestoneId].filter(s => s.id !== stepId);
    if (state.customSteps[milestoneId].length !== before) removed = true;
  }
  if (!removed && isCustomProject(trackId)) {
    const cp = state.customProjects[trackId];
    const ms = (cp.milestones || []).find(m => m.id === milestoneId);
    if (ms && Array.isArray(ms.steps)) {
      const before = ms.steps.length;
      ms.steps = ms.steps.filter(s => s.id !== stepId);
      if (ms.steps.length !== before) removed = true;
    }
  }
  if (!removed) return;
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

  // Task 6: split layout — timer on left, workflow chart on right.
  let html = `<div class="focus-view focus-view-split">
    <div class="focus-main">
      <div class="focus-breadcrumb">${escapeHtml(getTrackLabel(track))} → ${escapeHtml(ms.title)} → ${escapeHtml(step.title)}</div>
      <div class="focus-step-title">${escapeHtml(step.title)}</div>
      ${step.desc ? `<div class="focus-step-desc">${escapeHtml(String(step.desc).length > 140 ? String(step.desc).slice(0, 140).trim() + '…' : step.desc)}</div>` : ''}

      <div class="timer-ring">
        <svg viewBox="0 0 180 180">
          <circle class="ring-bg" cx="90" cy="90" r="${radius}"/>
          <circle class="ring-fill" id="timerRing" cx="90" cy="90" r="${radius}"
            stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="0"/>
        </svg>
        <div class="timer-time" id="timerDisplay">${formatTime(timerRemaining)}</div>
      </div>

      <div class="focus-block-info" id="focusBlockInfo">Block ${blocksOnStep + 1}${estBlocks ? ` of ~${estBlocks}` : ''}</div>
      ${(() => {
        // Round 3 Task 3: block-dots on Focus. Keep text above; dots under; caption if >3.
        const est = step.estimated_blocks || 3;
        const doneF = Math.min(est, blocksOnStep);
        let out = '<div class="focus-block-dots" aria-label="' + doneF + ' of ' + est + ' blocks complete">';
        for (let i = 0; i < est; i++) {
          const filled = i < doneF;
          const current = i === doneF;
          out += '<span class="step-block-dot' + (filled ? ' filled' : '') + (current ? ' current' : '') + '" aria-hidden="true"></span>';
        }
        out += '</div>';
        if (est > 3) {
          out += '<div class="focus-block-caption">Block ' + (doneF + 1) + ' of ' + est + '</div>';
        }
        return out;
      })()}

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

  html += `</div>`; // /focus-main

  // Right-hand workflow panel — compressed step list for this milestone.
  html += `<aside class="focus-workflow" aria-label="Milestone workflow">
    <div class="focus-workflow-header">
      <div class="focus-workflow-title">${escapeHtml(ms.title)}</div>
      <div class="focus-workflow-sub">${allSteps.length} step${allSteps.length === 1 ? '' : 's'}</div>
    </div>
    <div class="focus-workflow-list">`;
  allSteps.forEach((s, i) => {
    const ss = getStepState(s.id);
    const statusClass = ss.status === 'done' ? 'done' : (ss.status === 'active' ? 'active' : 'pending');
    const isCurrent = s.id === stepId;
    const est = s.estimated_blocks || 1;
    const doneBlocks = ss.blocksCompleted || 0;
    const checklist = s.checklist || [];
    const checkedCount = checklist.filter((_, j) => (ss.checklist || {})[j]).length;
    let dotsHtml = '';
    for (let b = 0; b < est; b++) {
      dotsHtml += `<span class="step-block-dot${b < doneBlocks ? ' filled' : ''}" style="${b < doneBlocks ? `background:${color};` : ''}"></span>`;
    }
    html += `<div class="focus-workflow-step ${statusClass}${isCurrent ? ' current' : ''}" data-stepid="${s.id}" data-msid="${milestoneId}" data-track="${track}">
      <div class="fw-step-head">
        <span class="fw-step-num" style="background:${color}22;color:${color}">${i + 1}</span>
        <span class="fw-step-title">${escapeHtml(s.title)}</span>
      </div>
      <div class="fw-step-dots">${dotsHtml}</div>
      ${checklist.length ? `<div class="fw-step-meta">${checkedCount}/${checklist.length} checks</div>` : ''}
    </div>`;
  });
  // Include QC tasks in the workflow panel (Task 10 preview)
  const qcItems = getQcItems(milestoneId);
  if (qcItems.length) {
    html += `<div class="fw-qc-label">Quality Checks</div>`;
    qcItems.forEach((qc, i) => {
      const checked = isQcChecked(milestoneId, qc.index);
      html += `<div class="focus-workflow-step qc ${checked ? 'done' : 'pending'}" data-qc="1" data-msid="${milestoneId}" data-qcindex="${qc.index}">
        <div class="fw-step-head">
          <span class="fw-step-num qc-num">QC</span>
          <span class="fw-step-title">${escapeHtml(qc.label)}</span>
        </div>
      </div>`;
    });
  }
  html += `</div></aside>`; // /focus-workflow
  html += `</div>`; // /focus-view
  el.innerHTML = html;

  // Round 2 Task C: workflow step click opens the step drawer.
  // User can then press Start Focus from the drawer to switch.
  el.querySelectorAll('.focus-workflow-step[data-stepid]').forEach(stepEl => {
    stepEl.addEventListener('click', () => {
      const sid = stepEl.dataset.stepid;
      const mid = stepEl.dataset.msid;
      openStepDrawer(mid, sid);
    });
  });

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
  updateTimerPill();
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
  updateTimerPill();
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
  updateTimerPill();
}

// Task 5: top-right persistent timer pill (visible whenever timer is running).
function updateTimerPill() {
  const pill = document.getElementById('timerPill');
  if (!pill) return;
  if (!timerRunning || !timerStepId || !timerMilestoneId) {
    pill.hidden = true;
    return;
  }
  pill.hidden = false;
  const allSteps = getAllSteps(timerMilestoneId);
  const step = allSteps.find(s => s.id === timerStepId);
  const label = step ? step.title : 'Focus';
  pill.href = `#focus/${timerMilestoneId}/${timerStepId}`;
  const timeEl = document.getElementById('timerPillTime');
  const labelEl = document.getElementById('timerPillLabel');
  if (timeEl) timeEl.textContent = formatTime(timerRemaining);
  if (labelEl) labelEl.textContent = label;
  const track = getTrackForMilestone(timerMilestoneId);
  const color = track ? TRACK_COLORS[track] : null;
  if (color) pill.style.setProperty('--pill-color', color);
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

  for (const track of getActiveTrackIds()) {
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
  // Round 4: respect per-project block allocations when set.
  const perProject = (state.weeklyPlan && state.weeklyPlan.perProjectBlocks) || {};
  const hasPerProject = focusProjects.some(t => (perProject[t] || 0) > 0);
  const effectiveGoal = hasPerProject
    ? focusProjects.reduce((sum, t) => sum + (perProject[t] || 0), 0)
    : weeklyGoal;
  const blocksPerDay = Math.max(1, Math.ceil(effectiveGoal / 5));
  const flexTotal = hasPerProject ? 0 : Math.max(0, Math.floor(weeklyGoal * 0.2));
  const hardBlocks = effectiveGoal - flexTotal;
  const hardPerDay = Math.ceil(hardBlocks / 5);
  const flexPerDay = Math.ceil(flexTotal / 5);

  // Feature 3: gather tasks sorted by urgency. Cap per-project contribution
  // when perProjectBlocks is set so each project only fills its allocation.
  const taskQueue = [];
  for (const track of focusProjects) {
    const cap = hasPerProject ? (perProject[track] || 0) : Infinity;
    if (cap <= 0) continue;
    let addedForTrack = 0;
    const ms = getCurrentMilestone(track);
    if (!ms) continue;
    const steps = getAllSteps(ms.id);
    for (const step of steps) {
      if (addedForTrack >= cap) break;
      const ss = getStepState(step.id);
      if (ss.status === 'done') continue;
      const remaining = Math.max(0, (step.estimated_blocks || 1) - (ss.blocksCompleted || 0));
      const urgLevel = getUrgency(step.id) || getUrgency(ms.id);
      for (let i = 0; i < remaining && addedForTrack < cap; i++) {
        taskQueue.push({ track, milestoneId: ms.id, stepId: step.id, stepTitle: step.title, urgLevel: urgLevel || null });
        addedForTrack++;
      }
    }
  }

  // Sort by urgency: critical first, important second, null last
  taskQueue.sort((a, b) => {
    const order = { critical: 0, important: 1, null: 2 };
    return (order[a.urgLevel] ?? 2) - (order[b.urgLevel] ?? 2);
  });

  // Round 5 Task 10: simplified slot copy — uniform "90 min focus block" per
  // slot, small project dot. Click navigates to Focus for that step.
  const blockMin = state.settings.blockDurationMin || 90;
  let html = `<div class="plan-grid">`;
  let taskIdx = 0;
  for (let d = 0; d < 5; d++) {
    html += `<div class="plan-day"><div class="plan-day-name">${DAYS[d]}</div>`;
    for (let b = 0; b < hardPerDay && b < blocksPerDay; b++) {
      if (taskIdx < taskQueue.length) {
        const t = taskQueue[taskIdx];
        const color = getTrackColor(t.track);
        const urgClass = t.urgLevel ? ` urgency-${t.urgLevel}` : '';
        html += `<div class="plan-slot plan-slot-simple${urgClass}" onclick="navigate('#focus/${t.milestoneId}/${t.stepId}')" title="${escapeHtml(t.stepTitle)}"><span class="dot" style="background:${color}"></span><span class="plan-slot-label">${blockMin} min focus block</span></div>`;
        taskIdx++;
      }
    }
    if (d < 5 && flexPerDay > 0 && d < flexTotal) {
      html += `<div class="plan-slot plan-slot-simple flex-slot">flex</div>`;
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
      ${getActiveTrackIds().map(t => `<option value="${t}">${escapeHtml(getTrackLabel(t))}</option>`).join('')}
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

// ---- Plan My Week: AI Prompt Builder ----
function generateWeeklyPrompt() {
  const now = new Date();
  const weekStart = getWeekStart(todayStr());
  const weekBlocks = getWeekBlocks(weekStart);
  const todayBlocks = getTodayBlocks();
  const s = state.settings;

  let prompt = `You are helping a PhD student (computational biology, 5th year, Caltech) prioritize their week. They have ADHD and get overwhelmed seeing everything at once — keep your advice concrete, calm, and focused on "what to do next" rather than listing everything.\n\n`;
  prompt += `Today: ${formatDate(now)}\n`;
  prompt += `Weekly goal: ${s.weeklyGoal || 10} focus blocks (${s.blockDurationMin || 90} min each), max ${s.blocksPerDay?.max || 4}/day, weekends off\n`;
  prompt += `This week so far: ${weekBlocks.length} blocks completed\n`;
  prompt += `Points: ${state.points} | Streak: ${state.streak.current} days\n\n`;

  // Current weekly plan
  const fp = state.weeklyPlan.focusProjects || [];
  if (fp.length > 0) {
    prompt += `Current week focus: ${fp.map(t => getTrackLabel(t)).join(', ')}\n\n`;
  } else {
    prompt += `No weekly focus set yet.\n\n`;
  }

  // Project status
  prompt += `--- ACTIVE PROJECTS ---\n\n`;
  for (const track of getActiveTrackIds()) {
    const label = getTrackLabel(track);
    const milestones = getMilestonesForTrack(track);
    const current = getCurrentMilestone(track);
    const urg = current ? (getUrgency(current.id) || 'none') : 'none';
    const dueDate = current ? (state.dueDates[current.id] || 'no due date') : '';

    prompt += `## ${label}\n`;

    // Show all milestones with status
    for (const ms of milestones) {
      const msState = getMilestoneState(ms.id);
      const steps = getAllSteps(ms.id);
      const doneSteps = steps.filter(st => getStepState(st.id).status === 'done').length;
      const remaining = getRemainingBlocksForMilestone(ms.id);
      const isCurrent = current && ms.id === current.id;
      const marker = msState.status === 'done' ? '[DONE]' : isCurrent ? '[CURRENT]' : '[UPCOMING]';
      const msUrg = getUrgency(ms.id);
      const urgStr = msUrg ? ` (urgency: ${msUrg})` : '';
      const due = state.dueDates[ms.id] ? ` — due ${state.dueDates[ms.id]}` : '';
      prompt += `  ${marker} ${ms.title} — ${doneSteps}/${steps.length} steps done, ~${remaining} blocks remaining${urgStr}${due}\n`;

      // For current milestone, list active steps
      if (isCurrent) {
        for (const step of steps) {
          const ss = getStepState(step.id);
          if (ss.status === 'done') continue;
          const blocks = getBlocksForStep(step.id);
          const est = step.estimated_blocks || 1;
          prompt += `    - ${step.title} (${blocks}/${est} blocks)\n`;
        }
      }
    }
    prompt += `\n`;
  }

  // Last week's focus log summary
  const lastWeekStart = new Date(weekStart + 'T00:00:00');
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lwStr = lastWeekStart.toISOString().split('T')[0];
  const lastWeekBlocks = getWeekBlocks(lwStr);
  if (lastWeekBlocks.length > 0) {
    prompt += `--- LAST WEEK ---\n`;
    prompt += `Completed ${lastWeekBlocks.length} blocks. Breakdown by project:\n`;
    const byTrack = {};
    lastWeekBlocks.forEach(l => {
      const t = getTrackForMilestone(l.milestoneId) || 'unknown';
      byTrack[t] = (byTrack[t] || 0) + 1;
    });
    for (const [t, count] of Object.entries(byTrack)) {
      prompt += `  ${getTrackLabel(t)}: ${count} blocks\n`;
    }
    prompt += `\n`;
  }

  // This week's blocks by project
  if (weekBlocks.length > 0) {
    prompt += `--- THIS WEEK SO FAR ---\n`;
    const byTrack = {};
    weekBlocks.forEach(l => {
      const t = getTrackForMilestone(l.milestoneId) || 'unknown';
      byTrack[t] = (byTrack[t] || 0) + 1;
    });
    for (const [t, count] of Object.entries(byTrack)) {
      prompt += `  ${getTrackLabel(t)}: ${count} blocks\n`;
    }
    prompt += `\n`;
  }

  // Admin tasks
  const pendingAdmin = (state.adminTasks || []).filter(t => !t.done);
  if (pendingAdmin.length > 0) {
    prompt += `--- ADMIN TASKS (misc, max 2/day) ---\n`;
    pendingAdmin.slice(0, 5).forEach(t => {
      prompt += `  - ${t.title}\n`;
    });
    prompt += `\n`;
  }

  // Prep batches in progress
  const activeBatches = (state.prepBatches || []).filter(b => !b.steps.every(s => s.done));
  if (activeBatches.length > 0) {
    prompt += `--- SAMPLE PREP IN PROGRESS ---\n`;
    activeBatches.forEach(b => {
      const done = b.steps.filter(s => s.done).length;
      prompt += `  ${b.label}: ${done}/${b.steps.length} steps done\n`;
    });
    prompt += `\n`;
  }

  prompt += `--- YOUR TASK ---\n`;
  prompt += `Based on all the above, help me plan this week. Tell me:\n`;
  prompt += `1. Which 1-2 projects to focus on and why\n`;
  prompt += `2. A suggested daily breakdown (Mon-Fri, 2 blocks/day)\n`;
  prompt += `3. What to deprioritize or let go of this week\n`;
  prompt += `4. Any risks (approaching deadlines, stalled milestones)\n\n`;
  prompt += `Keep it brief and calming. Don't overwhelm me with options.`;

  return prompt;
}

async function copyWeeklyPrompt() {
  const prompt = generateWeeklyPrompt();
  try {
    await navigator.clipboard.writeText(prompt);
    const btn = document.getElementById('planWeekBtn');
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg> Copied — paste into any AI chat`;
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 3000);
  } catch (e) {
    // Fallback: open in modal
    const textarea = document.createElement('textarea');
    textarea.value = prompt;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    const btn = document.getElementById('planWeekBtn');
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg> Copied`;
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 3000);
  }
}

// ---- RENDER: Docs ----
const DOCS = [
  {
    id: 'master-strategy',
    title: 'Master Analysis Strategy',
    desc: 'Comprehensive methods and hypotheses for the seqFISH spatial transcriptomics pipeline across DLPFC, FIC, and DG regions.',
    file: 'docs/master_analysis_strategy.md',
    tags: ['dlpfc', 'bd2', 'dg', 'package'],
    icon: 'strategy'
  },
  {
    id: 'cursor-plan',
    title: 'Cursor Coding Plan',
    desc: 'Architect-reviewed, subagent-decomposed implementation plan for spatialpy. Phases P0 through P9 with acceptance criteria.',
    file: 'docs/cursor_plan_improved.md',
    tags: ['package', 'dlpfc'],
    icon: 'code'
  },
  {
    id: 'paper-prioritization',
    title: 'Paper Prioritization',
    desc: 'Framework for evaluating and prioritizing the portfolio of potential papers from seqFISH AD/FTD data.',
    file: 'docs/paper_prioritization.md',
    tags: ['dlpfc', 'bd2', 'dg'],
    icon: 'papers'
  },
  {
    id: 'gene-modules',
    title: 'Gene Modules',
    desc: 'Complete gene module reference for the 1,205-gene seqFISH probeset. Marker panels, cell typing modules, and pathway signatures.',
    file: 'docs/gene_modules.md',
    tags: ['dlpfc', 'bd2', 'dg', 'package'],
    icon: 'dna'
  },
  {
    id: 'robustness',
    title: 'Robustness & Validation',
    desc: 'Testing and wet lab validation guide. Statistical robustness gates, sensitivity analyses, and IF validation protocols.',
    file: 'docs/robustness_and_validation.md',
    tags: ['dlpfc', 'bd2', 'dg'],
    icon: 'check'
  },
  {
    id: 'singularity',
    title: 'Singularity Recommendation',
    desc: 'Technical recommendation for containerization of the txomics pipeline on HPC clusters.',
    file: 'docs/singularity_recommendation.md',
    tags: ['package'],
    icon: 'server'
  },
  {
    id: 'paper-plans',
    title: 'Paper Plans',
    desc: 'Detailed paper outlines and figure plans for all publications.',
    file: 'docs/paper_plans.pdf',
    tags: ['dlpfc', 'bd2', 'dg'],
    icon: 'papers'
  },
  {
    id: 'sample-processing',
    title: 'Sample Processing Protocol',
    desc: 'RNA Guide ASY-053.02-2 — wet lab sample processing protocol for seqFISH experiments.',
    file: 'docs/Sample_Processing_for_RNA_Guide_ASY-053.02-2.pdf',
    tags: ['dlpfc', 'bd2', 'dg'],
    icon: 'lab'
  }
];

const DOC_ICONS = {
  strategy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  papers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></svg>',
  dna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="M17 6l-2.5 2.5"/><path d="M14 8.5l-2.5 2.5"/><path d="M7 18l2.5-2.5"/><path d="M3.5 14.5l2.5-2.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></svg>',
  lab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M9 3h6M12 3v7l-5 8h10l-5-8V3"/></svg>'
};

function renderDocs() {
  const el = document.getElementById('view-docs');
  let activeFilter = null;

  let html = `<div class="section-title">Reference Docs</div>
    <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-5);">
      Key documents from your research planning sessions. Tap to open.
    </p>
    <div class="docs-filter" id="docsFilter">
      <button class="doc-filter-btn active" data-filter="all">All</button>
      <button class="doc-filter-btn" data-filter="dlpfc" style="--fc:var(--c-dlpfc)">DLPFC</button>
      <button class="doc-filter-btn" data-filter="package" style="--fc:var(--c-package)">txomics</button>
      <button class="doc-filter-btn" data-filter="bd2" style="--fc:var(--c-bd2)">BD2</button>
      <button class="doc-filter-btn" data-filter="dg" style="--fc:var(--c-dg)">DG</button>
    </div>
    <div class="docs-grid" id="docsGrid">`;

  DOCS.forEach(doc => {
    const tagBadges = doc.tags.map(t => {
      const color = TRACK_COLORS[t] || 'var(--text-muted)';
      const label = TRACK_LABELS[t] || t;
      return `<span class="doc-tag" style="color:${color};border-color:${color}30">${label.split(' ')[0]}</span>`;
    }).join('');
    const isPdf = doc.file.endsWith('.pdf');
    html += `
      <a class="doc-card" href="${doc.file}" target="_blank" rel="noopener" data-tags="${doc.tags.join(',')}"> 
        <div class="doc-card-icon">${DOC_ICONS[doc.icon] || ''}</div>
        <div class="doc-card-body">
          <div class="doc-card-title">${doc.title}${isPdf ? ' <span class="doc-type-badge">PDF</span>' : ''}</div>
          <div class="doc-card-desc">${doc.desc}</div>
          <div class="doc-card-tags">${tagBadges}</div>
        </div>
      </a>`;
  });

  html += `</div>`;
  el.innerHTML = html;

  // Filter logic
  el.querySelectorAll('.doc-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.doc-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      el.querySelectorAll('.doc-card').forEach(card => {
        if (filter === 'all') {
          card.style.display = '';
        } else {
          card.style.display = card.dataset.tags.includes(filter) ? '' : 'none';
        }
      });
    });
  });
}

// ---- RENDER: Settings ----
function renderSettings() {
  const el = document.getElementById('view-settings');
  const s = state.settings;

  const currentTheme = getTheme();

  let html = `<div class="section-title">Settings</div>

    <div class="settings-group">
      <h4>Theme</h4>
      <div class="theme-picker">
        ${THEMES.map(t => `
          <div class="theme-swatch ${t.id === currentTheme ? 'active' : ''}" onclick="applyTheme('${t.id}'); renderSettings();" title="${t.label}">
            <div class="swatch-inner">
              <div class="swatch-top" style="background:${t.top}"></div>
              <div class="swatch-bot" style="background:${t.bot}"></div>
            </div>
            <span class="swatch-label">${t.label}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="settings-group" style="margin-top:var(--sp-6);">
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

// Round 5 Task 2: last 8 weeks + current week as bars with goal-relative labels.
function renderWeeklyGoalTracker() {
  const wp = state.weeklyPlan || {};
  const history = Array.isArray(wp.history) ? wp.history.slice(-8) : [];

  // Current week (in-progress) row — derived live.
  const thisMonday = getWeekStart(todayStr());
  const currentCompleted = computeCompletedByTrack(thisMonday);
  const currentGoal = getEffectiveWeeklyGoal();
  const currentAllocated = Object.values(wp.perProjectBlocks || {}).reduce((a, b) => a + b, 0);
  const currentCompletedTotal = Object.values(currentCompleted).reduce((a, b) => a + b, 0);
  const current = {
    weekOf: thisMonday,
    goal: currentGoal,
    allocated: currentAllocated,
    completed: currentCompletedTotal,
    inProgress: true
  };

  if (history.length === 0 && current.completed === 0 && current.allocated === 0) {
    return `<div class="chart-card weekly-tracker weekly-tracker-empty">
      <div class="chart-card-title">Weekly goal tracker</div>
      <div class="weekly-tracker-empty-text">Weekly stats appear here once you complete your first week.</div>
    </div>`;
  }

  // Running average across completed history weeks (exclude in-progress current).
  let avgLabel = '';
  if (history.length > 0) {
    const sum = history.reduce((a, h) => a + (h.completed || 0), 0);
    const avg = Math.round((sum / history.length) * 10) / 10;
    avgLabel = `Last ${history.length} week${history.length === 1 ? '' : 's'}: avg ${avg} blocks / week`;
  }

  const rows = [...history, current];
  let rowsHtml = '';
  for (const w of rows) {
    const goal = w.goal || 10;
    const completed = w.completed || 0;
    const pct = goal > 0 ? Math.min(100, Math.round((completed / goal) * 100)) : 0;
    const diff = completed - goal;

    let label, labelClass;
    if (w.inProgress) {
      label = 'in progress';
      labelClass = 'weekly-tracker-label-progress';
    } else if (diff < 0) {
      label = `${-diff} under goal`;
      labelClass = 'weekly-tracker-label-under';
    } else if (diff > 0) {
      label = `${diff} over goal`;
      labelClass = 'weekly-tracker-label-over';
    } else {
      label = 'on goal';
      labelClass = 'weekly-tracker-label-on';
    }

    // Format week label as "Apr 14" (Monday of that week).
    const d = new Date(w.weekOf + 'T00:00:00');
    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const weekLabel = mon[d.getMonth()] + ' ' + d.getDate() + (w.inProgress ? ' · this week' : '');

    const barClass = w.inProgress ? 'weekly-tracker-bar-fill weekly-tracker-bar-current' : 'weekly-tracker-bar-fill';
    rowsHtml += `<div class="weekly-tracker-row">
      <div class="weekly-tracker-week">${weekLabel}</div>
      <div class="weekly-tracker-bar"><div class="${barClass}" style="width:${pct}%"></div></div>
      <div class="weekly-tracker-count">${completed} / ${goal} blocks</div>
      <div class="weekly-tracker-label ${labelClass}">${label}</div>
    </div>`;
  }

  return `<div class="chart-card weekly-tracker">
    <div class="chart-card-title">Weekly goal tracker</div>
    ${avgLabel ? `<div class="weekly-tracker-avg">${avgLabel}</div>` : ''}
    <div class="weekly-tracker-rows">${rowsHtml}</div>
  </div>`;
}

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
    ${renderWeeklyGoalTracker()}
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
  for (const track of getAllTrackIds()) {
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
    for (const track of getActiveTrackIds()) {
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

// Task 5: anti-switch modal retired — timer now persists across routes.
// (Legacy stay/leave handlers removed; modal element is hidden in index.html.)

// Drawer close on overlay click
document.getElementById('drawerOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('drawerOverlay')) closeDrawer();
});

// Round 2 Task C: Esc key closes any open drawer.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Esc') {
    const overlay = document.getElementById('drawerOverlay');
    if (overlay && overlay.classList.contains('open')) {
      closeDrawer();
    }
  }
});

// Hash change
window.addEventListener('hashchange', handleRoute);

// Round 5: Weekly plan rollover runs inside loadState(). This hook remains
// as a safety net to catch the (rare) case where the module was imported
// before midnight but rendering happens after the week boundary.
(function () {
  try { maybeRolloverWeeklyPlan(); } catch (e) { console.warn('Rollover error', e); }
})();

// Init
handleRoute();
updateTimerPill();
