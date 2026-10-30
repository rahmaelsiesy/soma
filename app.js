/* ============================================================
   SOMA — app.js
   Calm ADHD focus tracker
   Features: F1 step edit/reorder, F2 editable names+tags,
             F3 urgency flags, F4 backward scheduling,
             F5 admin tab, F6 prep/batch system
   ============================================================ */

// ---- Profile ----
// Everything personal to one install (which projects ship active, their
// labels/colors, docs, sync target, AI prompt persona) lives in
// SOMA_PROFILE, declared by data.js. app.js stays generic: swap data.js
// for editions/starter/data.js and the same code becomes the product build.
const PROFILE = (typeof SOMA_PROFILE === 'object' && SOMA_PROFILE) || {};

// ---- Constants ----
// Defaults: tracks that start active unless the user has archived them via
// state.trackOverrides[trackId].active. See isTrackActive / getActiveTrackIds.
// With no profile list, every QUEST_DATA track starts active.
const ACTIVE_TRACKS_DEFAULT = PROFILE.activeTracks
  || ((typeof QUEST_DATA === 'object' && QUEST_DATA) ? Object.keys(QUEST_DATA) : []);
const ARCHIVED_TRACKS_DEFAULT = PROFILE.archivedTracks || [];

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
// Feature 7: pure ordering overlay — an id array expressing desired order,
// never a content snapshot, so reordering can never desync from live data.
// Ids not present in `order` (e.g. an item added since the order was last
// saved) are appended at the end in their natural order.
function applyOrderOverlay(list, order) {
  if (!order || !order.length) return list;
  const byId = new Map(list.map(item => [item.id, item]));
  const ordered = [];
  const seen = new Set();
  for (const id of order) {
    if (byId.has(id) && !seen.has(id)) { ordered.push(byId.get(id)); seen.add(id); }
  }
  for (const item of list) {
    if (!seen.has(item.id)) { ordered.push(item); seen.add(item.id); }
  }
  return ordered;
}
// Feature 7: milestone/step overlays — title/desc/estimate/archived layered
// on top of the base object, mirroring getTrackColor/getTrackDescription's
// existing override-wins pattern. data.js is never mutated.
function applyMilestoneOverlay(ms) {
  const ov = state.milestoneOverrides && state.milestoneOverrides[ms.id];
  if (!ov) return ms;
  return {
    ...ms,
    title: (typeof ov.title === 'string' && ov.title) ? ov.title : ms.title,
    desc: typeof ov.desc === 'string' ? ov.desc : ms.desc,
    archived: !!ov.archived
  };
}
function applyStepOverlay(step) {
  const ov = state.stepOverrides && state.stepOverrides[step.id];
  if (!ov) return step;
  return {
    ...step,
    title: (typeof ov.title === 'string' && ov.title) ? ov.title : step.title,
    desc: typeof ov.desc === 'string' ? ov.desc : step.desc,
    estimated_blocks: (typeof ov.estimated_blocks === 'number' && ov.estimated_blocks > 0) ? ov.estimated_blocks : step.estimated_blocks,
    archived: !!ov.archived
  };
}
// Raw milestone list for a track: base (QUEST_DATA) + extraMilestones (new
// milestones added to a base track) or a custom project's own milestones —
// ordered and overlaid, but NOT filtered by archived (used by the archived
// reveal list; getMilestonesForTrack below is the filtered, everyday read).
function getMilestonesForTrackRaw(trackId) {
  let base;
  if (QUEST_DATA && QUEST_DATA[trackId]) {
    const extra = (state.extraMilestones && state.extraMilestones[trackId]) || [];
    base = [...QUEST_DATA[trackId], ...extra];
  } else {
    const cp = getCustomProject(trackId);
    base = (cp && Array.isArray(cp.milestones)) ? cp.milestones : [];
  }
  const ordered = applyOrderOverlay(base, state.milestoneOrder && state.milestoneOrder[trackId]);
  return ordered.map(applyMilestoneOverlay);
}
function getMilestonesForTrack(trackId) {
  return getMilestonesForTrackRaw(trackId).filter(ms => !ms.archived);
}
function getArchivedMilestonesForTrack(trackId) {
  return getMilestonesForTrackRaw(trackId).filter(ms => ms.archived);
}
// Palette for custom projects — muted pastel-earth swatches that match the
// Soma theme tokens. First entry is the default accent.
// Expanded project-tag palette. 16 hand-picked hues chosen to:
//  (1) stay AA-readable as text and as pill backgrounds against both dark
//      (#141418-ish) and light (#f4f1ec-ish) theme backgrounds;
//  (2) cover warm + cool + neutral families so two adjacent projects never
//      look identical;
//  (3) include the 6 original muted tones at the top so existing projects
//      keep their saved color after this migration.
const CUSTOM_PROJECT_PALETTE = [
  // Row 1 — original muted set (kept for back-compat with existing projects)
  '#c8a07a', '#7db88a', '#b07da8', '#6ba3b5', '#c49a6c', '#9a9a6c',
  // Row 2 — warm
  '#e07a5f', '#e6b422', '#d98c3f', '#b84a62',
  // Row 3 — cool
  '#4f8fc0', '#5c8a7a', '#8e7cc3', '#3f6b8b',
  // Row 4 — fresh + neutral
  '#a3c586', '#8a8a94'
];
function getTrackColor(trackId) {
  const override = state.projectOverrides && state.projectOverrides[trackId];
  if (override && override.color) return override.color;
  const cp = getCustomProject(trackId);
  if (cp && cp.color) return cp.color;
  return TRACK_COLORS[trackId] || 'var(--text-muted)';
}
// Chart.js paints on canvas and can't resolve CSS variables, so charts
// need a literal hex even when the track has no explicit color.
function getTrackHexColor(trackId) {
  const c = getTrackColor(trackId);
  return c.startsWith('#') ? c : '#5a5a66';
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
// Per-track base colors and labels come from the profile (see data.js).
// Always read colors through getTrackColor() so user edits and custom
// projects win over these defaults.
const TRACK_COLORS = PROFILE.trackColors || {};
const TRACK_LABELS = PROFILE.trackLabels || {};
const TYPE_COLORS = {
  code: '#7db88a', figure: '#b07da8', writing: '#c49a6c', lab: '#6ba3b5', wetlab: '#6ba3b5',
  career: '#9ca3af', paper: '#c49a6c', learning: '#8b8b96', qc: '#d4a44c'
};
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const STORAGE_KEY = 'questboard_v3';
// Lab sample-prep batches (protocol_data.js) are a profile opt-in feature.
const LAB_PREP_ENABLED = !!PROFILE.labPrep;

// ── GITHUB SYNC ──────────────────────────────────────────────────────────────
// State is pushed to state.json in the repo 4 seconds after any change.
// Token is stored in localStorage only — never committed to the repo.
// Only enabled when the profile names a repo; product builds leave it off.
const GITHUB_SYNC_ENABLED = !!(PROFILE.githubSync && PROFILE.githubSync.repo);
const GITHUB_TOKEN_KEY = 'soma_github_pat';
const GITHUB_REPO_ID   = GITHUB_SYNC_ENABLED ? PROFILE.githubSync.repo : '';
const GITHUB_STATE_FILE = (PROFILE.githubSync && PROFILE.githubSync.file) || 'state.json';
let _ghPushTimer  = null;
let _ghSyncStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'error'

function getGithubToken() {
  if (!GITHUB_SYNC_ENABLED) return '';
  return localStorage.getItem(GITHUB_TOKEN_KEY) || '';
}
function saveGithubToken(token)  { localStorage.setItem(GITHUB_TOKEN_KEY, token.trim()); }

function scheduleGithubPush() {
  if (!getGithubToken()) return;
  clearTimeout(_ghPushTimer);
  _ghPushTimer = setTimeout(pushStateToGitHub, 4000);
}

async function pushStateToGitHub() {
  const token = getGithubToken();
  if (!token) return;
  _ghSyncStatus = 'syncing';
  updateSyncBadge();
  try {
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    let sha = null;
    const existing = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_ID}/contents/${GITHUB_STATE_FILE}`,
      { headers }
    );
    if (existing.ok) { sha = (await existing.json()).sha; }
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(state, null, 2))));
    const body = { message: `state: ${new Date().toISOString().slice(0,16)} auto-sync`, content };
    if (sha) body.sha = sha;
    const resp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_ID}/contents/${GITHUB_STATE_FILE}`,
      { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    _ghSyncStatus = resp.ok ? 'synced' : 'error';
  } catch (e) {
    _ghSyncStatus = 'error';
    console.warn('GitHub sync error:', e);
  }
  updateSyncBadge();
}

async function pullStateFromGitHub() {
  const token = getGithubToken();
  if (!token) return;
  try {
    const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3.raw' };
    const resp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_ID}/contents/${GITHUB_STATE_FILE}`,
      { headers }
    );
    if (!resp.ok) return;
    const remote = await resp.json();
    if (typeof remote === 'object' && remote !== null) {
      Object.assign(state, remote);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
    }
  } catch(e) { console.warn('GitHub pull error:', e); }
}

function updateSyncBadge() {
  const badge = document.getElementById('githubSyncBadge');
  if (!badge) return;
  const labels = { idle: '○ Not synced', syncing: '↻ Syncing…', synced: '✓ Synced to GitHub', error: '✗ Sync error' };
  const colors = { idle: 'var(--text-muted)', syncing: 'var(--c-dg)', synced: 'var(--c-package)', error: '#b07070' };
  badge.textContent = labels[_ghSyncStatus] || '';
  badge.style.color  = colors[_ghSyncStatus] || 'var(--text-muted)';
}
// ── END GITHUB SYNC ───────────────────────────────────────────────────────────


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
// Feature 18: "Just 5 minutes" — a tiny, low-stakes start that can roll
// straight into a full block or warm-up. Not logged as a block itself.
let timerIsStarter = false;
const STARTER_MIN = 5;
// Feature 18: the "5 minutes left" nudge fires once per block.
let timerWarned = false;
let pendingNavHash = null;
// Feature 8: transient (un-persisted) selection state for Home's manual
// "log a block" picker — mirrors the timer globals' pattern of living
// outside `state` since it's pure UI selection, not saved data.
let homeLogTrackId = null;
let homeLogStepId = null;
// Phase 1a (ADHD overhaul): wall-clock based timing so the timer keeps
// running accurately even when the tab is backgrounded, the page is
// re-rendered, or the focus view is navigated away from.
// `timerEndTime` is the Date.now() at which the block will hit zero.
// When paused, we stash how much time was left in `timerRemainingMs`.
let timerEndTime = 0;
let timerRemainingMs = 0;

function computeTimerRemaining() {
  if (timerRunning && timerEndTime) {
    return Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
  }
  if (timerRemainingMs) {
    return Math.max(0, Math.ceil(timerRemainingMs / 1000));
  }
  return timerRemaining;
}

function saveTimerToStorage() {
  // Persist enough to survive a page reload mid-block.
  try {
    const snap = {
      running: timerRunning,
      endTime: timerEndTime,
      remainingMs: timerRemainingMs,
      total: timerTotal,
      stepId: timerStepId,
      msId: timerMilestoneId,
      warmup: timerIsWarmup,
      starter: timerIsStarter,
      warned: timerWarned,
    };
    localStorage.setItem('soma_timer', JSON.stringify(snap));
  } catch (e) { /* ignore quota */ }
}

function loadTimerFromStorage() {
  try {
    const raw = localStorage.getItem('soma_timer');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s || !s.stepId || !s.msId) return;
    timerStepId = s.stepId;
    timerMilestoneId = s.msId;
    timerIsWarmup = !!s.warmup;
    timerIsStarter = !!s.starter;
    timerWarned = !!s.warned;
    timerTotal = s.total || 0;
    if (s.running && s.endTime && s.endTime > Date.now()) {
      // Block is still in-flight — resume it.
      timerEndTime = s.endTime;
      timerRunning = true;
      timerRemaining = computeTimerRemaining();
      timerRemainingMs = 0;
      // Restart the tick.
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(timerTick, 1000);
    } else if (!s.running && s.remainingMs > 0) {
      // Was paused — keep the remaining time.
      timerRunning = false;
      timerEndTime = 0;
      timerRemainingMs = s.remainingMs;
      timerRemaining = computeTimerRemaining();
    } else {
      // Block expired while away — clear the stored timer so we don't auto-resume.
      localStorage.removeItem('soma_timer');
    }
  } catch (e) { /* ignore */ }
}

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
  { id: 'remote-lime',       label: 'Remote Lime',      top: '#eaf5c1', bot: '#f4f1ec' },
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
  if (!THEMES.find(t => t.id === stored)) {
    // First launch: follow the computer's light/dark setting.
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'catppuccin-mocha' : 'rose-pine-dawn';
  }
  return stored;
}

// Apply saved theme immediately
applyTheme(getTheme());

// ---- State helpers ----
// Task 12: some profiles ship tracks that are already finished (e.g. a
// completed retrospective). PROFILE.seedDone lists their step/milestone ids;
// they're marked done once, guarded by PROFILE.seedDone.flag on state.
function applySeedDone(s) {
  const seed = PROFILE.seedDone;
  if (!seed || !seed.flag || s[seed.flag]) return;
  s.steps = s.steps || {};
  for (const id of (seed.steps || [])) {
    if (!s.steps[id] || s.steps[id].status !== 'done') {
      s.steps[id] = { status: 'done', blocksCompleted: 1, notes: '', checklist: {} };
    }
  }
  s.milestones = s.milestones || {};
  for (const id of (seed.milestones || [])) {
    if (!s.milestones[id] || s.milestones[id].status !== 'done') {
      s.milestones[id] = { status: 'done', notes: '' };
    }
  }
  s[seed.flag] = true;
}

function defaultState() {
  const fresh = {
    steps: {},
    milestones: {},
    focusLog: [],
    weeklyPlan: { weekOf: null, blocks: {}, approved: false, focusProjects: [], perProjectBlocks: {}, rollover: {}, history: [], weekGoal: null },
    ideas: [],
    points: 0,
    streak: { current: 0, lastDate: null, best: 0, restWeek: null },
    dueDates: {},
    settings: { blocksPerDay: { min: 2, max: 4 }, blockDurationMin: 90, warmupDurationMin: 25, weeklyGoal: 10, blockEndSound: true },
    protocolChecks: {},
    lastAction: null,
    // Feature 1: custom steps per milestone
    customSteps: {},
    // Feature 2: track name/tag overrides
    trackOverrides: {},
    // Feature 7: milestone/step overlays — non-destructive edits layered on
    // top of data.js, mirroring the existing projectOverrides pattern.
    milestoneOverrides: {},
    stepOverrides: {},
    extraMilestones: {},
    stepOrder: {},
    milestoneOrder: {},
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
    qcChecks: {},
    // Feature 14: steps picked for Today, keyed by stepId → { milestoneId, date }
    todayPicks: {}
  };
  applySeedDone(fresh);
  return fresh;
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
      // Feature 7 migration: moveStep() used to freeze base steps into
      // customSteps as `{..., _base:true}` snapshots to represent a new
      // order — which silently stopped tracking data.js if a base step's
      // title/desc/estimate ever changed afterward (see CHANGES history).
      // Replace any such snapshots with a pure stepOrder id-array (derived
      // from the frozen order, so existing custom orderings are preserved)
      // and drop the frozen copies — getAllSteps() reads live base data
      // again from here on.
      const stepOrder = s.stepOrder || {};
      for (const msId of Object.keys(customSteps)) {
        const arr = customSteps[msId];
        if (!arr.some(st => st && st._base)) continue;
        if (!stepOrder[msId]) stepOrder[msId] = arr.map(st => st.id);
        customSteps[msId] = arr.filter(st => !st._base);
      }
      // Task 12 migration: mark the profile's already-finished tracks done.
      // Only runs once — guarded by a version flag on state.
      applySeedDone(s);
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
        // Feature 7: additive migration for the milestone/step overlay system.
        milestoneOverrides: s.milestoneOverrides || {},
        stepOverrides: s.stepOverrides || {},
        extraMilestones: s.extraMilestones || {},
        stepOrder: stepOrder,
        milestoneOrder: s.milestoneOrder || {},
        urgency: s.urgency || {},
        adminTasks: s.adminTasks || [],
        prepBatches: s.prepBatches || [],
        rewards: s.rewards || { tiers: {}, claimedHistory: [] },
        weeklyReviews: s.weeklyReviews || [],
        qcChecks: s.qcChecks || {},
        todayPicks: s.todayPicks || {}
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
  scheduleGithubPush();
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
// Bug fix (found while building Feature 8's day strip): toISOString()
// converts to UTC, so this returned tomorrow's date for the entire evening
// in any timezone behind UTC (e.g. 11pm Pacific = 6am UTC the next day) —
// every block logged that late was silently filed under the wrong day.
// Use local calendar-date components instead, matching what formatDate()
// (the greeting bar) already correctly shows.
function localDateStr(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function todayStr() { return localDateStr(new Date()); }
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
  return localDateStr(mon);
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
// Feature 7: raw merged steps (base + custom), ordered and overlaid, but NOT
// filtered by archived — used by the archived reveal list. getAllSteps below
// is the filtered, everyday read every existing call site already expects.
function getAllStepsRaw(milestoneId) {
  // Defense-in-depth: any lingering `_base` snapshot from the pre-Feature-7
  // moveStep() (should already be migrated away in loadState) is dropped
  // here too, so a frozen copy can never shadow live base data again.
  const custom = (state.customSteps[milestoneId] || []).filter(s => !s._base);
  let baseSteps = [];
  // Round 5: walk built-in tracks, tracks' extra milestones, AND custom projects.
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
  if (!found && state.extraMilestones) {
    for (const track of Object.keys(state.extraMilestones)) {
      if (walk(state.extraMilestones[track])) { found = true; break; }
    }
  }
  if (!found && state.customProjects) {
    for (const track of Object.keys(state.customProjects)) {
      if (walk((state.customProjects[track] || {}).milestones)) break;
    }
  }
  let out = [...baseSteps, ...custom];
  // Always dedupe by id, preserving first occurrence.
  const seen = new Set();
  out = out.filter(s => {
    if (!s || !s.id) return false;
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
  out = applyOrderOverlay(out, state.stepOrder && state.stepOrder[milestoneId]);
  return out.map(applyStepOverlay);
}
function getAllSteps(milestoneId) {
  return getAllStepsRaw(milestoneId).filter(s => !s.archived);
}
function getArchivedSteps(milestoneId) {
  return getAllStepsRaw(milestoneId).filter(s => s.archived);
}

function getMilestone(milestoneId) {
  for (const track of Object.keys(QUEST_DATA)) {
    for (const ms of QUEST_DATA[track]) {
      if (ms.id === milestoneId) return applyMilestoneOverlay(ms);
    }
  }
  // Feature 7: look in milestones added to a base track.
  if (state.extraMilestones) {
    for (const track of Object.keys(state.extraMilestones)) {
      for (const ms of state.extraMilestones[track]) {
        if (ms.id === milestoneId) return applyMilestoneOverlay(ms);
      }
    }
  }
  // Round 5: look in custom projects.
  if (state.customProjects) {
    for (const track of Object.keys(state.customProjects)) {
      const list = (state.customProjects[track] || {}).milestones || [];
      for (const ms of list) {
        if (ms.id === milestoneId) return applyMilestoneOverlay(ms);
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
  // Feature 7: look in milestones added to a base track.
  if (state.extraMilestones) {
    for (const track of Object.keys(state.extraMilestones)) {
      for (const ms of state.extraMilestones[track]) {
        if (ms.id === milestoneId) return track;
      }
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
// Phase 1b: also return milestone counts so the projects card can show
// the accurate "tasks across the whole project" number.
function getTrackProgressSummary(trackId) {
  const milestones = getMilestonesForTrack(trackId);
  let stepsDone = 0, stepsTotal = 0, blocksDone = 0, blocksTotal = 0;
  let qcDone = 0, qcTotal = 0;
  let msDone = 0;
  let blocksLogged = 0; // Feature 6: real, uncapped block count (see below).
  for (const ms of milestones) {
    const steps = getAllSteps(ms.id);
    const qcItems = getQcItems(ms.id);
    stepsTotal += steps.length;
    qcTotal += qcItems.length;
    stepsDone += steps.filter(s => getStepState(s.id).status === 'done').length;
    qcDone += qcItems.filter(it => isQcChecked(ms.id, it.index)).length;
    blocksTotal += getTotalBlocksForMilestone(ms.id);
    blocksDone += (getTotalBlocksForMilestone(ms.id) - getRemainingBlocksForMilestone(ms.id));
    // getBlocksForMilestone() sums real logged blocks with no per-step cap,
    // unlike blocksDone above (which is derived from "remaining", and a
    // step's remaining floors at 0 once done or over-estimate — silently
    // capping its contribution at that step's own estimate either way).
    blocksLogged += getBlocksForMilestone(ms.id);
    if (getMilestoneState(ms.id).status === 'done') msDone++;
  }
  // Combined task count = steps + QC (so the denominator matches the
  // total number of clickable things across the project).
  return {
    stepsDone: stepsDone + qcDone,
    stepsTotal: stepsTotal + qcTotal,
    stepOnlyDone: stepsDone,
    stepOnlyTotal: stepsTotal,
    qcDone, qcTotal,
    blocksDone, blocksTotal, blocksLogged,
    msDone,
    msTotal: milestones.length,
  };
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
// Priority: projectOverrides.label → trackOverrides.label (legacy) → customProjects.label
// → TRACK_LABELS → CATEGORY_META (data.js) → raw id.
function getTrackLabel(trackId) {
  const po = state.projectOverrides && state.projectOverrides[trackId];
  if (po && po.label) return po.label;
  const override = state.trackOverrides && state.trackOverrides[trackId];
  if (override && override.label) return override.label;
  const cp = getCustomProject(trackId);
  if (cp && cp.label) return cp.label;
  if (TRACK_LABELS[trackId]) return TRACK_LABELS[trackId];
  const meta = (typeof CATEGORY_META === 'object' && CATEGORY_META) ? CATEGORY_META[trackId] : null;
  return (meta && meta.label) || trackId;
}

// Feature 3: get urgency for item
function getUrgency(itemId) {
  return state.urgency[itemId] || null;
}

// ---- Streak ----
// Forgiving by design: weekends never count against you, and one missed
// weekday per week is a free rest day that keeps the streak going. The
// best streak is remembered, so streak rewards stay earned once reached.

// Weekdays strictly between two YYYY-MM-DD dates.
function workdaysBetween(fromStr, toStr) {
  if (!fromStr || fromStr >= toStr) return 0;
  const d = new Date(fromStr + 'T00:00:00');
  const end = new Date(toStr + 'T00:00:00');
  let n = 0;
  d.setDate(d.getDate() + 1);
  while (d < end) {
    if (d.getDay() !== 0 && d.getDay() !== 6) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

function restDayAvailable(today) {
  return state.streak.restWeek !== getWeekStart(today);
}

function updateStreak() {
  const today = todayStr();
  if (!isWeekday(today)) return;
  const todayBlocks = getTodayBlocks().filter(l => !l.warmup);
  if (todayBlocks.length < state.settings.blocksPerDay.min) return;
  if (state.streak.lastDate === today) return;
  const missed = workdaysBetween(state.streak.lastDate, today);
  if (state.streak.current === 0 || missed === 0) {
    state.streak.current++;
  } else if (missed === 1 && restDayAvailable(today)) {
    state.streak.current++;
    state.streak.restWeek = getWeekStart(today);
  } else {
    state.streak.current = 1;
  }
  state.streak.lastDate = today;
  state.streak.best = Math.max(state.streak.best || 0, state.streak.current);
  saveState();
}

// The streak as it stands today (state.streak.current only updates when a
// block is logged, so a long gap would otherwise keep showing an old run).
// Today itself isn't over, so it never counts as missed.
function getCurrentStreak() {
  const { current, lastDate } = state.streak;
  if (!current || !lastDate) return 0;
  const missed = workdaysBetween(lastDate, todayStr());
  if (missed === 0 || (missed === 1 && restDayAvailable(todayStr()))) return current;
  return 0;
}

function getBestStreak() {
  return Math.max(state.streak.best || 0, state.streak.current || 0);
}

function daysShownUpThisMonth() {
  const prefix = todayStr().slice(0, 7);
  return new Set(state.focusLog.filter(l => l.date && l.date.startsWith(prefix)).map(l => l.date)).size;
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
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
    path: 'projects', track: 'projects', prep: 'projects', blocks: 'projects',
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
      if (LAB_PREP_ENABLED && hash.indexOf('template=prep') !== -1) {
        openPrepDrawer();
      }
      break;
    case 'track':
      renderTrack(parts[1]);
      document.getElementById('view-track').classList.add('active');
      break;
    case 'board':
      renderBoard(parts[1]);
      document.getElementById('view-board').classList.add('active');
      break;
    case 'path':
      renderPath(parts[1], parts[2]);
      document.getElementById('view-path').classList.add('active');
      break;
    case 'blocks':
      renderBlockLog(parts[1], parts[2]);
      document.getElementById('view-blocklog').classList.add('active');
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
    { hash: '#docs', label: 'Guide & docs', desc: 'How to use Soma, and reference docs' },
    { hash: '#settings', label: 'Settings', desc: 'Themes, blocks, preferences' }
  ].filter(it => it.hash !== '#docs' || DOCS.length);
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
  dot: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><circle cx="12" cy="12" r="5"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M5 3v18"/><path d="M5 4h13l-3 4 3 4H5"/></svg>'
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
  if (!hasFeature('weeklyPlan')) {
    return placement === 'top' ? proLockedCard('weeklyPlan', 'Split your weekly block goal across projects, and roll unfinished blocks into next week automatically.') : '';
  }

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
      <span class="week-plan-label" title="${escapeHtml(label)}">${escapeHtml(label)}${carriedBadge}</span>
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
  html += `<button class="btn btn-primary week-plan-approve-btn" onclick="approveWeekPlan()">${approveLabel}</button>`;
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

// Feature 8: manual "log a block" control — project picker (defaulting to
// this week's focus projects) + step picker scoped to that project's current
// milestone, showing every non-done step rather than just the one the app
// would auto-pick (real work often runs several steps in parallel, not
// strictly sequentially) + an optional note + a direct "mark done" action.
// Replaces the old auto-queued planned-blocks checklist as Home's primary
// action; a secondary link still reaches the Focus timer for whoever wants
// the Pomodoro flow, carrying the exact project/step chosen here.
function buildHomeLogStepOptions(trackId, preferredStepId) {
  if (!trackId) return { html: '<option value="">No active projects</option>', msId: null, selectedId: null };
  const ms = getCurrentMilestone(trackId);
  const steps = ms ? getAllSteps(ms.id).filter(s => getStepState(s.id).status !== 'done') : [];
  if (!steps.length) return { html: '<option value="">No open steps</option>', msId: ms ? ms.id : null, selectedId: null };
  const selectedId = (preferredStepId && steps.some(s => s.id === preferredStepId)) ? preferredStepId : steps[0].id;
  const html = steps.map(s => `<option value="${s.id}"${s.id === selectedId ? ' selected' : ''}>${escapeHtml(s.title)}</option>`).join('');
  return { html, msId: ms.id, selectedId };
}

function renderHomeLogControl() {
  const activeTracks = getActiveTrackIds();
  if (activeTracks.length === 0) {
    return `<div class="card home-log-card">
      <div class="home-log-title">Log a block</div>
      <div class="done-msg" style="background:rgba(255,255,255,0.03);border-color:var(--border);">No active projects. Check your <a onclick="navigate('#projects')" style="color:var(--text-primary);text-decoration:underline;cursor:pointer;">projects</a>.</div>
    </div>`;
  }
  if (!homeLogTrackId || !activeTracks.includes(homeLogTrackId)) {
    const focusProjects = (state.weeklyPlan.focusProjects || []).filter(t => activeTracks.includes(t));
    homeLogTrackId = focusProjects[0] || activeTracks[0];
    homeLogStepId = null;
  }
  const trackOptsHtml = activeTracks.map(t =>
    `<option value="${t}"${t === homeLogTrackId ? ' selected' : ''}>${escapeHtml(getTrackLabel(t))}</option>`
  ).join('');
  const stepOpts = buildHomeLogStepOptions(homeLogTrackId, homeLogStepId);
  homeLogStepId = stepOpts.selectedId;

  return `<div class="card home-log-card">
    <div class="home-log-title">Log a block</div>
    <div class="home-log-row">
      <select class="idea-input home-log-select" id="homeLogTrackSelect" onchange="onHomeLogProjectChange(this)">${trackOptsHtml}</select>
      <select class="idea-input home-log-select" id="homeLogStepSelect" data-msid="${stepOpts.msId || ''}" onchange="onHomeLogStepChange(this)">${stepOpts.html}</select>
    </div>
    <input type="text" class="idea-input home-log-note" id="homeLogNote" placeholder="Where did you leave off? (optional)">
    <div class="home-log-actions">
      <button class="btn btn-primary home-log-submit" onclick="logBlockManually()">Mark block done</button>
      <a class="home-log-timer-link" onclick="startFocusFromHomeLog()">or start a focus timer instead</a>
    </div>
  </div>`;
}

function onHomeLogProjectChange(selectEl) {
  homeLogTrackId = selectEl.value;
  const stepSelect = document.getElementById('homeLogStepSelect');
  if (!stepSelect) return;
  const opts = buildHomeLogStepOptions(homeLogTrackId, null);
  stepSelect.innerHTML = opts.html;
  stepSelect.dataset.msid = opts.msId || '';
  homeLogStepId = opts.selectedId;
}

function onHomeLogStepChange(selectEl) {
  homeLogStepId = selectEl.value || null;
}

function logBlockManually() {
  const stepSelect = document.getElementById('homeLogStepSelect');
  const noteEl = document.getElementById('homeLogNote');
  const stepId = stepSelect ? stepSelect.value : '';
  const milestoneId = stepSelect ? stepSelect.dataset.msid : '';
  if (!stepId || !milestoneId) return;
  homeLogStepId = stepId;
  const note = noteEl ? noteEl.value.trim() : '';
  completeBlock({ stepId, milestoneId, note, warmup: false });
  if (note) setResumeNote(stepId, note);
  renderHome();
}

function startFocusFromHomeLog() {
  const stepSelect = document.getElementById('homeLogStepSelect');
  if (!stepSelect || !stepSelect.value || !stepSelect.dataset.msid) return;
  navigate(`#focus/${stepSelect.dataset.msid}/${stepSelect.value}`);
}

// Feature 8: Mon-Sun "did I show up" strip — a calmer, less number-heavy
// everyday read than the old auto-queued checklist. The block-circles above
// (per-project color, still shown in the promoted weekly bar section) and
// the weekly bar together still carry the finer-grained detail; this strip
// is specifically the fast glance.
function renderHomeDayStrip(weekStart) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = todayStr();
  let html = `<div class="block-section">
    <div class="block-section-label">This week at a glance</div>
    <div class="day-strip">`;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + i);
    const dStr = localDateStr(d);
    const hasBlock = state.focusLog.some(l => l.date === dStr);
    const isToday = dStr === today;
    html += `<div class="day-strip-cell${isToday ? ' today' : ''}${hasBlock ? ' logged' : ''}">
      <span class="day-strip-label">${dayLabels[i]}</span>
      <span class="day-strip-mark" aria-hidden="true">${hasBlock ? ICONS.check : ''}</span>
    </div>`;
  }
  html += `</div></div>`;
  return html;
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
  const allDoneToday = fullToday >= maxToday;

  let html = '';

  html += `<div class="greeting-bar">
    <div class="greeting-date">${dateStr}</div>
    <div class="points-badge">${state.points} pts</div>
  </div>`;

  const backupHtml = renderBackupReminder();
  html += backupHtml || renderInstallPrompt();

  // Feature 11: Review done badge
  if (dayOfWeek() === 0 && isReviewDoneThisWeek()) {
    html += `<div class="review-done-badge">Review done this week</div>`;
  }

  if (dayOfWeek() === 0 && !state.weeklyPlan.approved) {
    html += `<div class="sunday-prompt">Ready to plan next week? It takes 5 minutes. <a href="#schedule" style="color:var(--text-primary);text-decoration:underline;cursor:pointer;">Plan now</a></div>`;
  }

  html += `<div class="home-layout"><div class="home-primary">`;

  // Feature 14: what to do today comes first.
  html += renderTodayCard();

  // Feature 8: weekly bar promoted to the top as the primary, central
  // element — a segmented slice per project, sized by blocks completed
  // this week, plus a "you are here" pace marker (same visual language as
  // the board-game token) so the bar reads as progress *and* pace at a
  // glance: fill past the dot means ahead of pace, short of it means behind.
  const weekByProject = {};
  for (const log of weekB) {
    const t = getTrackForMilestone(log.milestoneId);
    if (t) weekByProject[t] = (weekByProject[t] || 0) + 1;
  }
  const weekPct = weeklyGoal > 0 ? Math.round((weekB.length / weeklyGoal) * 100) : 0;
  let weekSegsHtml = '';
  for (const [t, count] of Object.entries(weekByProject)) {
    const segWidth = weeklyGoal > 0 ? (count / weeklyGoal) * 100 : 0;
    weekSegsHtml += `<div class="week-progress-seg" style="width:${segWidth}%;background:${getTrackColor(t)}" title="${escapeHtml(getTrackLabel(t))}: ${count}"></div>`;
  }
  // Work-week (Mon-Fri) pace target: Sunday counts as "day 5 elapsed" (end
  // of the previous work-week's pace) same as Saturday, so the dot only
  // resets to the start once Monday actually arrives.
  const dow = dayOfWeek();
  const paceDayIndex = dow === 0 ? 5 : Math.min(dow, 5);
  const pacePct = (paceDayIndex / 5) * 100;

  html += `<div class="block-section">
    <div class="block-section-label">This week</div>
    <div class="week-progress-track">
      <div class="week-progress-bar">${weekSegsHtml}</div>
      <div class="week-pace-dot" style="left:${pacePct}%" title="Today's pace target"></div>
    </div>
    <div class="week-progress-text${weekPct > 100 ? ' over-goal' : ''}">${weekB.length} / ${weeklyGoal} blocks · ${weekPct}%</div>
    <div class="block-circles">`;
  const totalCircles = Math.max(weeklyGoal, weekB.length);
  for (let i = 0; i < totalCircles; i++) {
    if (i < weekB.length) {
      if (i >= weeklyGoal) {
        html += `<div class="block-circle bonus"></div>`;
      } else {
        const log = weekB[i];
        const color = getTrackColor(getTrackForMilestone(log.milestoneId));
        html += `<div class="block-circle filled" style="background:${color}"></div>`;
      }
    } else if (i < weeklyGoal) {
      html += `<div class="block-circle"></div>`;
    }
  }
  html += `</div></div>`;

  if (allDoneToday) {
    html += `<div class="done-msg">You've done enough today. Rest is productive too.</div>`;
  }

  // Feature 8: manual, lower-friction block logging — the new primary
  // action, replacing the old auto-picked "Start next block" timer button.
  html += renderHomeLogControl();

  // Feature 8: Mon-Sun day-preview strip replaces the old planned-blocks
  // checklist as the everyday read.
  html += renderHomeDayStrip(weekStart);

  html += `</div>`; // /home-primary

  html += `<div class="home-secondary">`;

  // Round 4: weekly plan panel with per-project block sliders. Round 5
  // Task 6: when approved for this week, the expanded panel returns ''
  // from the top placement, and renders a collapsed one-line summary at
  // the bottom placement.
  html += renderWeeklyPlanPanel({ placement: 'top' });
  html += renderWeeklyPlanPanel({ placement: 'bottom' });

  // Feature 9: Next reward card
  const nextReward = getNextPointReward();
  if (nextReward) {
    const chosen = (state.rewards.tiers[nextReward.id] || {}).text || nextReward.defaultReward;
    html += `<div class="next-reward-card" role="button" tabindex="0" onclick="navigate('#rewards')">
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

  html += `</div>`; // /home-secondary
  html += `</div>`; // /home-layout

  if (state.lastAction) {
    html += `<div class="where-was-i">Last: ${state.lastAction}</div>`;
  }
  // Forgiving streak line: never a "0-day streak", just what went well.
  const streakNow = getCurrentStreak();
  const monthDays = daysShownUpThisMonth();
  const streakBits = [];
  if (streakNow > 0) streakBits.push(`${streakNow}-day streak`);
  if (monthDays > 0) streakBits.push(`${monthDays} day${monthDays === 1 ? '' : 's'} of focus this month`);
  if (!streakNow && getBestStreak() > 1) streakBits.push(`Welcome back. Your best run is ${getBestStreak()} days`);
  if (streakBits.length) {
    html += `<div class="streak-line">${streakBits.join(' · ')}</div>`;
  }

  // Feature 9: Reward unlocked banner
  const newlyEarned = getNewlyEarnedRewards();
  if (newlyEarned.length > 0) {
    html += `<div class="reward-unlocked-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
      Reward unlocked: ${escapeHtml(newlyEarned[0].label)}
    </div>`;
  }

  el.innerHTML = html;

  // Round 3 Task 5: plan-week '?' help popover.
  wirePlanWeekHelp();
}

// ---- RENDER: Projects ----
function renderProjects() {
  const el = document.getElementById('view-projects');
  let html = '<div class="section-title">Projects</div>';

  // Round 5 Task 3b: + New project card.
  html += `<div class="project-new-card" role="button" tabindex="0" onclick="openCreateProjectModal()">
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
    // Phase 1b: counter now shows tasks across the WHOLE project (not
    // just the current milestone). Tooltip breaks it down by milestones
    // / steps / QC so the user can see what the denominator means.
    const sum = getTrackProgressSummary(track);
    const msLabel = sum.msTotal > 0
      ? `${sum.msDone} / ${sum.msTotal} milestones`
      : '—';
    const tooltipParts = [
      `${sum.msDone}/${sum.msTotal} milestones`,
      `${sum.stepOnlyDone}/${sum.stepOnlyTotal} steps`,
    ];
    if (sum.qcTotal > 0) tooltipParts.push(`${sum.qcDone}/${sum.qcTotal} QC checks`);
    if (sum.blocksTotal > 0) tooltipParts.push(`${sum.blocksLogged}/${sum.blocksTotal} blocks`);
    const tooltip = tooltipParts.join(' · ');
    // Feature 6: headline = milestones reached (a stable count a bad time
    // estimate can't throw off); bar fill = blocks banked vs. estimated,
    // uncapped, so it moves with every logged block instead of only when
    // a step gets marked fully done.
    const blocksPct = sum.blocksTotal > 0
      ? Math.round((sum.blocksLogged / sum.blocksTotal) * 100)
      : 0;
    const overGoal = blocksPct > 100;
    const barWidth = Math.min(100, blocksPct);
    html += `<div class="project-card" role="button" tabindex="0" style="--card-accent:${color}" onclick="navigate('#track/${track}')" title="${escapeHtml(tooltip)}">
      <span class="dot" style="background:${color}"></span>
      <span class="proj-name proj-name-editable" data-track="${track}" ondblclick="startEditProjectName(event,'${track}')">${escapeHtml(label)}</span>
      <span class="proj-milestone">${escapeHtml(msTitle)}</span>
      <span class="proj-progress">${msLabel}</span>
      <div class="proj-progress-bar"><div class="proj-progress-bar-fill${overGoal ? ' over-goal' : ''}" style="width:${barWidth}%; background:${color}"></div></div>
      <button class="proj-edit-btn" data-edit-track="${track}" title="Edit project" aria-label="Edit project">Edit</button>
      <button class="proj-archive-btn" data-archive-track="${track}" title="Move this project to the archive" aria-label="Archive project">Archive</button>
    </div>`;
  }

  // Task 2: Templates section (Sample Prep as template).
  if (LAB_PREP_ENABLED) {
    html += `<div class="section-title section-title-sub" style="margin-top:2rem;">Templates</div>`;
    html += `<div class="template-card" role="button" tabindex="0" onclick="openPrepDrawer()">
      <span class="dot" style="background:#6ba3b5"></span>
      <div class="template-card-main">
        <div class="template-card-title">Sample prep batch</div>
        <div class="template-card-desc">Run the RNA-seq / library prep protocol checklist</div>
      </div>
      <span class="template-card-cta">Start ›</span>
    </div>`;
  }

  if (archivedTracks.length) html += `<div class="archive-toggle" id="archiveToggle" onclick="toggleArchive()">
    ${ICONS.chevronRight}
    <span>${archivedTracks.length} archived project${archivedTracks.length === 1 ? '' : 's'}</span>
  </div>`;
  html += `<div class="archive-list" id="archiveList" style="display:none;">`;
  for (const track of archivedTracks) {
    const ms = getCurrentMilestone(track);
    const color = getTrackColor(track);
    const label = getTrackLabel(track);
    const msTitle = ms ? ms.title : 'Complete';
    const sum = getTrackProgressSummary(track);
    const stepsLabel = sum.stepsTotal > 0 ? `${sum.stepsDone} / ${sum.stepsTotal} tasks` : '—';
    const isCustom = isCustomProject(track);
    const restoreBtn = isCustom
      ? `<button class="proj-archive-btn proj-restore-btn" data-restore-custom="${track}" title="Restore this custom project" aria-label="Restore project">Restore</button>`
      : `<button class="proj-archive-btn proj-activate-btn" data-activate-track="${track}" title="Move this project back into active rotation" aria-label="Activate project">Activate</button>`;
    html += `<div class="project-card project-card-archived" role="button" tabindex="0" style="--card-accent:${color}" onclick="navigate('#track/${track}')">
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
  handleRoute();
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
    if (mode === 'create' && !canCreateProjects()) { _closeProjectModal(); showUpgrade('unlimitedProjects'); return; }
    if (mode === 'create') {
      _createCustomProject({label: name, description: desc, icon: selIcon, color: selColor});
    } else {
      _saveProjectEdits(trackId, {label: name, description: desc, icon: selIcon, color: selColor});
    }
    _closeProjectModal();
    // Re-render whichever view opened the modal (Projects or a project's page).
    handleRoute();
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

// Unique id for user-created items. Date.now() alone collides when several
// items are created in the same millisecond (Quick Add's multi-line paste),
// and getAllSteps() silently dedupes colliding ids away.
let _idSeq = 0;
function makeId(prefix) {
  return prefix + Date.now().toString(36) + (_idSeq++).toString(36);
}

// First palette color no active project is using yet, so new projects
// don't all come out the same shade.
function nextProjectColor() {
  const used = new Set(getActiveTrackIds().map(t => String(getTrackColor(t)).toLowerCase()));
  return CUSTOM_PROJECT_PALETTE.find(c => !used.has(c.toLowerCase())) || CUSTOM_PROJECT_PALETTE[0];
}

// Returns the new project's id. Caller saves.
function createProject({label, description, icon, color}) {
  if (!state.customProjects) state.customProjects = {};
  const id = makeId('custom_');
  state.customProjects[id] = {
    id,
    label,
    description: description || '',
    icon: icon || 'target',
    color: color || nextProjectColor(),
    archived: false,
    milestones: []
  };
  // Mark active in overrides so it appears in active list.
  if (!state.trackOverrides[id]) state.trackOverrides[id] = {};
  state.trackOverrides[id].active = true;
  return id;
}

function _createCustomProject(fields) {
  createProject(fields);
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

// Round 5 Task 3b + Feature 7: add a milestone to any track — a custom
// project's own milestones array, or state.extraMilestones for a base
// (QUEST_DATA) track, so data.js never needs hand-editing to grow.
// Returns the new milestone's id. Caller saves.
function createMilestone(trackId, title) {
  const ms = { id: '', title, category: 'custom', estimated_blocks: 0, steps: [] };
  if (isCustomProject(trackId)) {
    ms.id = makeId('cms_');
    state.customProjects[trackId].milestones = state.customProjects[trackId].milestones || [];
    state.customProjects[trackId].milestones.push(ms);
  } else {
    ms.id = makeId('xms_');
    if (!state.extraMilestones) state.extraMilestones = {};
    if (!state.extraMilestones[trackId]) state.extraMilestones[trackId] = [];
    state.extraMilestones[trackId].push(ms);
  }
  return ms.id;
}

// Add a step to any milestone. Inside a custom project the step goes
// straight into that milestone (Round 5 Task 3b); everywhere else it's a
// Feature 1 custom step layered on via state.customSteps. Returns the new
// step's id, or null if the milestone doesn't exist. Caller saves.
function createStep(trackId, milestoneId, { title, estimated_blocks, urgency, due } = {}) {
  const blocks = Math.min(20, Math.max(1, parseInt(estimated_blocks, 10) || 1));
  let stepId;
  if (isCustomProject(trackId)) {
    const ms = (state.customProjects[trackId].milestones || []).find(m => m.id === milestoneId);
    if (!ms) return null;
    stepId = makeId('cstep_');
    ms.steps = ms.steps || [];
    ms.steps.push({ id: stepId, title, type: 'custom', desc: '', estimated_blocks: blocks });
  } else {
    if (!getMilestone(milestoneId)) return null;
    stepId = makeId('custom-' + milestoneId + '-');
    if (!state.customSteps[milestoneId]) state.customSteps[milestoneId] = [];
    state.customSteps[milestoneId].push({ id: stepId, title, estimated_blocks: blocks, type: null, desc: '', isCustom: true });
  }
  if (urgency) state.urgency[stepId] = urgency;
  if (due) state.dueDates[stepId] = due;
  // A finished milestone that just gained an open step isn't finished.
  const msState = getMilestoneState(milestoneId);
  if (msState.status === 'done') msState.status = 'pending';
  return stepId;
}

function addCustomMilestone(trackId) {
  openQuickAdd({ kind: 'milestone', trackId });
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
    <div class="header-actions">
      <button class="btn btn-outline btn-sm" onclick="navigate('#board/${trackId}')">Board</button>
      <button class="btn btn-outline btn-sm" onclick="openEditProjectModal('${trackId}')">Edit</button>
      <button class="btn btn-outline btn-sm" onclick="openQuickAdd({ kind: 'task', trackId: '${trackId}' })">${ICONS.plus} Add tasks</button>
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
        paceHtml = dueDate < todayStr()
          ? `<span class="ms-pace-label ms-pace-slipped">Slipped — pick a new date</span>`
          : `<span class="ms-pace-label ms-pace-crit">Due today</span>`;
      }
    }

    const iconSvg = getMilestoneIcon(ms);
    const trophyBadge = msState.status === 'done' ? `<span class="candy-trophy" aria-hidden="true">${MILESTONE_ICONS.trophy}</span>` : '';

    const msReorderHtml = `<div class="step-reorder">
      <button class="step-reorder-btn" title="Move up" onclick="event.stopPropagation();moveMilestone('${trackId}','${ms.id}','up')">${ICONS.arrowUp}</button>
      <button class="step-reorder-btn" title="Move down" onclick="event.stopPropagation();moveMilestone('${trackId}','${ms.id}','down')">${ICONS.arrowDown}</button>
      <button class="step-reorder-btn" title="Archive milestone" onclick="archiveMilestone(event,'${ms.id}','${trackId}')">${ICONS.trash}</button>
    </div>`;
    const descHtml = ms.desc
      ? `<div class="candy-desc" onclick="event.stopPropagation()" ondblclick="editMilestoneDesc(event,'${ms.id}','${trackId}')" title="Double-click to edit description">${escapeHtml(ms.desc)}</div>`
      : `<div class="candy-desc candy-desc-empty" onclick="event.stopPropagation();editMilestoneDesc(event,'${ms.id}','${trackId}')">+ add description</div>`;

    html += `<div class="candy-row candy-row--${side}">
      <div class="candy-node ${variantClass}" role="button" tabindex="0" data-msid="${ms.id}" onclick="navigate('#path/${trackId}/${ms.id}')" style="--node-accent:${color}">
        <span class="milestone-flag-badge" aria-hidden="true" title="Milestone checkpoint">${MILESTONE_ICONS.flag}</span>
        <div class="candy-icon" aria-hidden="true">${iconSvg}</div>
        <div class="candy-body">
          <div class="candy-title">${urgDot}<span class="candy-title-text proj-name-editable" onclick="event.stopPropagation()" ondblclick="startEditMilestoneTitle(event,'${ms.id}','${trackId}')" title="Double-click to rename">${escapeHtml(ms.title)}</span></div>
          <div class="candy-sub">${stepsDone}/${totalSteps} steps · ${blocksLogged}/${totalBlocks} blocks</div>
          ${descHtml}
          <div class="candy-due-row" onclick="event.stopPropagation()">
            <input type="date" class="ms-due-date-input candy-due-input" data-ms="${ms.id}" value="${dueDate}" title="Set due date for this milestone">
            ${paceHtml}
          </div>
        </div>
        <button class="candy-urgency" onclick="event.stopPropagation();cycleUrgency('${ms.id}','track','${trackId}')" title="Set urgency">
          ${urgLevel === 'critical' ? '<span class="u-critical">critical</span>' : urgLevel === 'important' ? '<span class="u-important">important</span>' : '<span class="u-flag">flag</span>'}
        </button>
        ${msReorderHtml}
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

  // Round 5 Task 3b + Feature 7: + Add milestone button on every track, not
  // just custom projects — appends to extraMilestones for base tracks.
  html += `<div class="candy-row candy-row--left">
    <button class="candy-add-milestone" onclick="addCustomMilestone('${trackId}')" aria-label="Add milestone">+ Add milestone</button>
  </div>`;

  html += `</div>`; // /candy-path

  // Feature 7: archived milestones — same reveal pattern as the Projects
  // tab's archived projects list.
  const archivedMs = getArchivedMilestonesForTrack(trackId);
  if (archivedMs.length) {
    html += `<div class="archive-toggle" id="msArchiveToggle" onclick="toggleMsArchive()">
      ${ICONS.chevronRight}
      <span>${archivedMs.length} archived milestone${archivedMs.length === 1 ? '' : 's'}</span>
    </div>
    <div class="archive-list" id="msArchiveList" style="display:none;">`;
    archivedMs.forEach(ms => {
      html += `<div class="candy-row candy-row--left">
        <div class="candy-node candy-node--archived" style="--node-accent:${color}">
          <div class="candy-icon" aria-hidden="true">${getMilestoneIcon(ms)}</div>
          <div class="candy-body">
            <div class="candy-title"><span class="candy-title-text">${escapeHtml(ms.title)}</span></div>
          </div>
          <button class="proj-archive-btn proj-activate-btn" onclick="event.stopPropagation();unarchiveMilestone('${ms.id}','${trackId}')">Restore</button>
        </div>
      </div>`;
    });
    html += `</div>`;
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
  // Phase 1c: explicit clear before re-render to avoid any chance of
  // stale DOM mixing with new content if a previous render was aborted.
  el.innerHTML = '';
  const ms = getMilestone(milestoneId);
  if (!ms) { el.innerHTML = '<p>Milestone not found.</p>'; return; }
  const track = trackId || getTrackForMilestone(milestoneId);
  const color = getTrackColor(track);
  // Phase 1c: dedupe steps by id (defense-in-depth — getAllSteps already
  // dedupes, but guard against future regression).
  const steps = (() => {
    const raw = getAllSteps(milestoneId);
    const seen = new Set();
    return raw.filter(s => {
      if (!s || !s.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  })();
  const blocksLogged = getBlocksForMilestone(milestoneId);
  const totalBlocks = getTotalBlocksForMilestone(milestoneId);
  const qcCount = getQcItems(milestoneId).length;

  // Phase 1c + 1e: single, clear summary line at the top — no more
  // duplicated "blocks logged" + per-step dots stacked visually. The
  // per-step dots below carry the same information and the summary
  // here is a single concise read.
  let html = `<div class="path-header">
    <button class="back-btn" onclick="navigate('#track/${track}')">${ICONS.arrowLeft}</button>
    <div class="path-title"><span class="dot" style="background:${color}"></span> ${escapeHtml(ms.title)}</div>
    <div class="header-actions">
      <button class="btn btn-outline btn-sm" onclick="openMilestoneModal('${milestoneId}','${track}')">Edit</button>
    </div>
  </div>
  <div class="path-progress-text">${steps.length} step${steps.length === 1 ? '' : 's'} · ${blocksLogged} / ${totalBlocks} blocks${qcCount ? ` · ${qcCount} QC check${qcCount === 1 ? '' : 's'}` : ''}</div>
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
          <div class="candy-title" role="button" tabindex="0" onclick="openStepDrawer('${milestoneId}','${step.id}')">${urgDot}<span class="step-title-label">${escapeHtml(step.title)}</span></div>
          <div class="candy-step-meta" onclick="openStepDrawer('${milestoneId}','${step.id}')">
            ${typeBadge}
            <div class="step-block-dots" onclick="event.stopPropagation();navigate('#blocks/${milestoneId}/${step.id}')" title="View block history">${dotsHtml}</div>
            ${stepCheckHtml(milestoneId, step.id, ss.status === 'done')}
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
      <button class="add-step-btn" onclick="openQuickAdd({ kind: 'task', trackId: '${track}', milestoneId: '${milestoneId}' })">
        ${ICONS.plus} Add steps
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

  // Feature 7: archived steps — same reveal pattern as the Projects tab's
  // archived projects list.
  const archivedSteps = getArchivedSteps(milestoneId);
  if (archivedSteps.length) {
    html += `<div class="path-connector"></div>
    <div class="archive-toggle" id="stepArchiveToggle" onclick="toggleStepArchive()">
      ${ICONS.chevronRight}
      <span>${archivedSteps.length} archived step${archivedSteps.length === 1 ? '' : 's'}</span>
    </div>
    <div class="archive-list" id="stepArchiveList" style="display:none;">`;
    archivedSteps.forEach(s => {
      html += `<div class="candy-row candy-row--left">
        <div class="candy-node candy-node--step candy-node--archived" style="--node-accent:${color}">
          <div class="candy-icon" aria-hidden="true">${getStepIcon(s)}</div>
          <div class="candy-body">
            <div class="candy-title"><span class="step-title-label">${escapeHtml(s.title)}</span></div>
          </div>
          <button class="proj-archive-btn proj-activate-btn" onclick="event.stopPropagation();unarchiveStep('${s.id}','${milestoneId}','${track}')">Restore</button>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  html += `</div>`; // winding-path
  el.innerHTML = html;

  // Feature 1 + Feature 7: inline title editing. Custom steps: single click
  // (existing behavior, unchanged — the title has no competing click action).
  // Base steps: double-click, so the existing single-click-opens-drawer
  // behavior is completely unaffected — same "dblclick to rename" gesture
  // already used for project/track names elsewhere in the app.
  el.querySelectorAll('.candy-node--step[data-stepid]').forEach(stepEl => {
    if (stepEl.dataset.qc === '1') return; // QC steps: no inline edit
    const stepId = stepEl.dataset.stepid;
    const msId = stepEl.dataset.msid;
    const trackId2 = stepEl.dataset.track;
    const label = stepEl.querySelector('.step-title-label');
    if (!label) return;
    const custom = (state.customSteps[msId] || []).find(s => s.id === stepId && !s._base);
    label.style.cursor = 'text';
    if (custom) {
      label.addEventListener('click', e => {
        e.stopPropagation();
        startInlineStepEdit(stepId, msId, trackId2, label);
      });
    } else {
      label.title = 'Double-click to rename';
      // Stop the single click too (not just dblclick) — otherwise the first
      // click of a real double-click bubbles to the node's onclick and opens
      // the drawer before the rename input ever appears. The rest of the
      // step node (icon, meta row, dots) still opens the drawer as before.
      label.addEventListener('click', e => e.stopPropagation());
      label.addEventListener('dblclick', e => {
        e.stopPropagation();
        startInlineStepEdit(stepId, msId, trackId2, label);
      });
    }
  });

  // Task 10: bind QC checkboxes.
  el.querySelectorAll('.qc-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      setQcChecked(cb.dataset.msid, parseInt(cb.dataset.qcindex, 10), cb.checked);
      renderPath(trackId, milestoneId);
    });
  });
}

// Feature 6: block-level history — one node per logged 90-min block for a
// single step, so effort past the original estimate stays visible instead
// of disappearing once the step's dot row fills up. Read-only; starting a
// new block hands off to the existing Focus timer rather than
// re-implementing logging here.
function renderBlockLog(milestoneId, stepId) {
  const el = document.getElementById('view-blocklog');
  const ms = getMilestone(milestoneId);
  const allSteps = ms ? getAllSteps(milestoneId) : [];
  const step = allSteps.find(s => s.id === stepId);
  if (!ms || !step) { el.innerHTML = '<p>Step not found.</p>'; return; }

  const track = getTrackForMilestone(milestoneId);
  const color = getTrackColor(track);
  const ss = getStepState(stepId);
  const estBlocks = step.estimated_blocks || 1;
  const blocks = state.focusLog
    .filter(l => l.stepId === stepId)
    .slice()
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const shortDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${mon[d.getMonth()]} ${d.getDate()}`;
  };

  let html = `<div class="path-header">
    <button class="back-btn" onclick="navigate('#path/${track}/${milestoneId}')">${ICONS.arrowLeft}</button>
    <div class="path-title"><span class="dot" style="background:${color}"></span> ${escapeHtml(step.title)}</div>
  </div>
  <div class="path-progress-text">${blocks.length} block${blocks.length === 1 ? '' : 's'} logged${estBlocks ? ` · ~${estBlocks} estimated` : ''}</div>
  <div class="winding-path candy-path" style="--track-accent:${color}">`;

  blocks.forEach((log, i) => {
    const isBonus = i >= estBlocks;
    const side = i % 2 === 0 ? 'left' : 'right';
    const isLast = i === blocks.length - 1;
    const trophyBadge = (isLast && ss.status === 'done') ? `<span class="candy-trophy" aria-hidden="true">${MILESTONE_ICONS.trophy}</span>` : '';
    html += `<div class="candy-row candy-row--${side}">
      <div class="candy-node candy-node--step candy-node--done${isBonus ? ' candy-node--bonus' : ''}" style="--node-accent:${color}">
        <div class="candy-icon" aria-hidden="true">${ICONS.check}</div>
        <div class="candy-body">
          <div class="candy-step-num">Block ${i + 1}${isBonus ? ' · bonus' : ''}</div>
          <div class="candy-title"><span class="step-title-label">${shortDate(log.date)}${log.warmup ? ' · warm-up' : ''}</span></div>
          ${log.note ? `<div class="candy-sub">${escapeHtml(log.note)}</div>` : ''}
        </div>
        ${trophyBadge}
      </div>
    </div>`;
    if (i < blocks.length - 1) {
      html += `<div class="candy-path-connector candy-path-connector--done" aria-hidden="true"></div>`;
    }
  });

  if (ss.status !== 'done') {
    if (blocks.length) {
      const nextSide = blocks.length % 2 === 0 ? 'left' : 'right';
      html += `<div class="candy-path-connector" aria-hidden="true"></div>
      <div class="candy-row candy-row--${nextSide}">
        <div class="candy-node candy-node--step candy-node--next" style="--node-accent:${color}" onclick="navigate('#focus/${milestoneId}/${stepId}')">
          <div class="candy-icon" aria-hidden="true">${ICONS.play}</div>
          <div class="candy-body">
            <div class="candy-step-num">Next</div>
            <div class="candy-title"><span class="step-title-label">Start next block</span></div>
          </div>
        </div>
      </div>`;
    } else {
      html += `<div class="done-msg" style="background:rgba(255,255,255,0.03);border-color:var(--border);">No blocks logged yet. <a onclick="navigate('#focus/${milestoneId}/${stepId}')" style="color:var(--text-primary);text-decoration:underline;cursor:pointer;">Start the first one</a>.</div>`;
    }
  }

  html += `</div>`; // winding-path
  el.innerHTML = html;
}

// Feature 1 + Feature 7: inline edit step title. Custom steps (tracked in
// state.customSteps) mutate their own object directly, same as always; base
// steps (and steps living inside a custom project's own milestone) now go
// through stepOverrides instead, so data.js stays untouched either way.
function startInlineStepEdit(stepId, milestoneId, trackId, labelEl) {
  const current = labelEl.textContent;
  const custom = (state.customSteps[milestoneId] || []).find(s => s.id === stepId);
  const input = document.createElement('input');
  input.className = 'step-title-editable';
  input.value = current;
  labelEl.replaceWith(input);
  input.focus(); input.select();
  function commit() {
    const val = input.value.trim();
    if (val) {
      if (custom) {
        custom.title = val;
      } else {
        if (!state.stepOverrides) state.stepOverrides = {};
        if (!state.stepOverrides[stepId]) state.stepOverrides[stepId] = {};
        state.stepOverrides[stepId].title = val;
      }
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

// Feature 7: move step up/down — a pure order-array overlay (state.stepOrder),
// never a content snapshot, so reordering can no longer desync a milestone's
// base steps from data.js (the old bug: moveStep froze base steps into
// customSteps as `{..., _base:true}` copies the moment anything was reordered).
function moveStep(milestoneId, stepId, direction) {
  const steps = getAllSteps(milestoneId);
  const idx = steps.findIndex(s => s.id === stepId);
  if (idx < 0) return;

  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= steps.length) return;

  const swapped = [...steps];
  [swapped[idx], swapped[newIdx]] = [swapped[newIdx], swapped[idx]];

  if (!state.stepOrder) state.stepOrder = {};
  state.stepOrder[milestoneId] = swapped.map(s => s.id);
  saveState();

  // Re-render
  const parts = window.location.hash.slice(1).split('/');
  renderPath(parts[1], parts[2]);
}

// Feature 7: move milestone up/down within its track — same pure
// order-array approach as moveStep, and the first reorder capability
// milestones have had (there was no moveMilestone before this).
function moveMilestone(trackId, milestoneId, direction) {
  const milestones = getMilestonesForTrack(trackId);
  const idx = milestones.findIndex(m => m.id === milestoneId);
  if (idx < 0) return;

  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= milestones.length) return;

  const swapped = [...milestones];
  [swapped[idx], swapped[newIdx]] = [swapped[newIdx], swapped[idx]];

  if (!state.milestoneOrder) state.milestoneOrder = {};
  state.milestoneOrder[trackId] = swapped.map(m => m.id);
  saveState();
  renderTrack(trackId);
}

// Feature 7: archive/restore a single milestone — same reversible pattern
// as archiving a whole project, scoped to one milestone via milestoneOverrides
// so nothing tied to already-logged history ever disappears.
function archiveMilestone(evt, milestoneId, trackId) {
  if (evt) evt.stopPropagation();
  if (!state.milestoneOverrides) state.milestoneOverrides = {};
  if (!state.milestoneOverrides[milestoneId]) state.milestoneOverrides[milestoneId] = {};
  state.milestoneOverrides[milestoneId].archived = true;
  saveState();
  renderTrack(trackId);
}
function unarchiveMilestone(milestoneId, trackId) {
  if (state.milestoneOverrides && state.milestoneOverrides[milestoneId]) {
    state.milestoneOverrides[milestoneId].archived = false;
  }
  saveState();
  renderTrack(trackId);
}
function toggleMsArchive() {
  const list = document.getElementById('msArchiveList');
  const toggle = document.getElementById('msArchiveToggle');
  if (!list || !toggle) return;
  const open = list.style.display === 'none';
  list.style.display = open ? 'block' : 'none';
  toggle.classList.toggle('open', open);
}

// Feature 7: edit a milestone's description via the same prompt()-based
// pattern already used for adding milestones/steps — desc is a rarely-
// touched field, so a lightweight prompt matches existing convention rather
// than a new modal.
function editMilestoneDesc(evt, milestoneId, trackId) {
  if (evt) evt.stopPropagation();
  openMilestoneModal(milestoneId, trackId);
}

// Edit a milestone's title, description and due date in one place —
// same overlay writes as the inline editors (milestoneOverrides /
// dueDates), styled like the project modal.
function openMilestoneModal(milestoneId, trackId) {
  const ms = getMilestone(milestoneId);
  if (!ms) return;
  _closeProjectModal();
  const overlay = document.createElement('div');
  overlay.id = 'projectModalOverlay';
  overlay.className = 'project-modal-overlay';
  overlay.innerHTML = `
    <div class="project-modal" role="dialog" aria-label="Edit milestone">
      <div class="project-modal-title">Edit milestone</div>
      <label class="project-modal-field">
        <span>Name</span>
        <input type="text" id="msModalTitle" value="${escapeHtml(ms.title)}" maxlength="80">
      </label>
      <label class="project-modal-field">
        <span>Description</span>
        <textarea id="msModalDesc" rows="3" placeholder="What does done look like?" maxlength="400">${escapeHtml(ms.desc || '')}</textarea>
      </label>
      <label class="project-modal-field">
        <span>Due date</span>
        <input type="date" class="drawer-due-date" id="msModalDue" value="${state.dueDates[milestoneId] || ''}">
      </label>
      <div class="project-modal-actions">
        <button type="button" class="btn btn-outline" id="msModalCancel">Cancel</button>
        <button type="button" class="btn btn-primary" id="msModalSave">Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#msModalCancel').addEventListener('click', _closeProjectModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) _closeProjectModal(); });
  overlay.querySelector('#msModalSave').addEventListener('click', () => {
    const title = overlay.querySelector('#msModalTitle').value.trim();
    if (!title) { overlay.querySelector('#msModalTitle').focus(); return; }
    if (!state.milestoneOverrides) state.milestoneOverrides = {};
    if (!state.milestoneOverrides[milestoneId]) state.milestoneOverrides[milestoneId] = {};
    state.milestoneOverrides[milestoneId].title = title;
    state.milestoneOverrides[milestoneId].desc = overlay.querySelector('#msModalDesc').value.trim();
    const due = overlay.querySelector('#msModalDue').value;
    if (due) state.dueDates[milestoneId] = due;
    else delete state.dueDates[milestoneId];
    saveState();
    _closeProjectModal();
    handleRoute();
  });
  setTimeout(() => overlay.querySelector('#msModalTitle').focus(), 50);
}

// Feature 2 + Feature 7: inline milestone name edit from the Track view —
// byte-for-byte the same interaction as startEditTrackName/startEditProjectName,
// writing to milestoneOverrides instead so data.js stays untouched.
function startEditMilestoneTitle(evt, milestoneId, trackId) {
  evt.stopPropagation();
  const span = evt.currentTarget;
  const ms = getMilestone(milestoneId);
  const current = ms ? ms.title : '';
  span.innerHTML = `<input class="proj-name-input" type="text" value="${escapeHtml(current)}" style="font-size:inherit;font-weight:inherit;">`;
  const input = span.querySelector('input');
  input.focus(); input.select();
  function finish() {
    const val = (input.value || '').trim();
    if (val) {
      if (!state.milestoneOverrides) state.milestoneOverrides = {};
      if (!state.milestoneOverrides[milestoneId]) state.milestoneOverrides[milestoneId] = {};
      state.milestoneOverrides[milestoneId].title = val;
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

// Feature 7: archive/restore a single step — mirrors archiveMilestone.
// Base steps can never be hard-deleted (only custom, history-free steps
// can); archive is the general mechanism for hiding any step without
// losing its logged block history.
function archiveStepFromDrawer(stepId, milestoneId, trackId) {
  if (!state.stepOverrides) state.stepOverrides = {};
  if (!state.stepOverrides[stepId]) state.stepOverrides[stepId] = {};
  state.stepOverrides[stepId].archived = true;
  saveState();
  closeDrawer();
  renderPath(trackId, milestoneId);
}
function unarchiveStep(stepId, milestoneId, trackId) {
  if (state.stepOverrides && state.stepOverrides[stepId]) {
    state.stepOverrides[stepId].archived = false;
  }
  saveState();
  renderPath(trackId, milestoneId);
}
function toggleStepArchive() {
  const list = document.getElementById('stepArchiveList');
  const toggle = document.getElementById('stepArchiveToggle');
  if (!list || !toggle) return;
  const open = list.style.display === 'none';
  list.style.display = open ? 'block' : 'none';
  toggle.classList.toggle('open', open);
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
  const color = getTrackColor(track);
  const urgLevel = getUrgency(stepId);

  let html = `<button class="drawer-close" onclick="closeDrawer()">${ICONS.x}</button>
    <h3>${escapeHtml(step.title)}</h3>`;

  html += `<button class="btn btn-primary" style="background:${color};width:100%;margin-bottom:8px;" onclick="closeDrawer();navigate('#focus/${milestoneId}/${stepId}')">
    ${ICONS.play} Start Focus
  </button>`;
  // Feature 14 + 15: plan it for today, or split it into smaller steps.
  const picked = isPickedForToday(stepId);
  html += `<div class="drawer-quick-actions">
    <button class="btn btn-outline" onclick="startFocus('${milestoneId}','${stepId}','starter',true)" title="Can't get started? Just do 5 minutes.">Just ${STARTER_MIN} min</button>
    <button class="btn btn-outline" onclick="toggleTodayPick('${milestoneId}','${stepId}');openStepDrawer('${milestoneId}','${stepId}')">${picked ? 'Remove from Today' : 'Add to Today'}</button>
    <button class="btn btn-outline" onclick="breakDownWithAI('${milestoneId}','${stepId}')">Break it down with AI</button>
  </div>`;
  // Feature 18: the note left at the end of the last block.
  html += `<div class="drawer-section-title">Pick up here</div>
    <input type="text" class="drawer-title-input" id="drawerResume" maxlength="200" placeholder="Where you left off, so restarting is easy" value="${escapeHtml(getResumeNote(stepId))}">`;

  // Feature 7: title, description and estimated blocks are editable for
  // every step (base or custom), overlay-backed.
  html += `<div class="drawer-section-title">Title</div>
    <input type="text" class="drawer-title-input" id="drawerStepTitle" maxlength="120" value="${escapeHtml(step.title)}">`;
  html += `<div class="drawer-section-title">Description</div>
    <textarea class="drawer-notes" id="drawerStepDesc" placeholder="What this step involves...">${escapeHtml(step.desc || '')}</textarea>`;
  html += `<div class="drawer-section-title">Estimated blocks</div>
    <input type="number" class="drawer-due-date" id="drawerStepEst" min="1" max="20" style="width:80px;" value="${step.estimated_blocks || 1}">`;

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
    <input type="date" class="drawer-due-date" id="drawerDue" value="${state.dueDates[stepId] || ''}">
    <div class="due-quick">
      ${[['today', 'Today'], ['tomorrow', 'Tomorrow'], ['nextweek', 'Next week'], ['clear', 'No date']].map(([w, l]) =>
        `<button type="button" class="qa-chip" onclick="rescheduleStep('${stepId}','${w}');openStepDrawer('${milestoneId}','${stepId}')">${l}</button>`).join('')}
    </div>`;

  if (ss.status !== 'done') {
    html += `<button class="btn btn-outline" style="width:100%;margin-top:16px;" onclick="markStepDone('${stepId}','${milestoneId}')">Mark as done</button>`;
  }

  // Feature 7: archive is the general "hide without losing history"
  // mechanism, available for every step (base or custom).
  html += `<button class="btn btn-outline" style="width:100%;margin-top:8px;" onclick="archiveStepFromDrawer('${stepId}','${milestoneId}','${track}')">Archive step</button>`;

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
  // Feature 7: description + estimated blocks — custom steps mutate their
  // own object directly (same convention as the title); base steps (and
  // steps living inside a custom project's milestone) go through
  // stepOverrides instead.
  const resumeEl = document.getElementById('drawerResume');
  if (resumeEl) resumeEl.addEventListener('change', () => setResumeNote(stepId, resumeEl.value));
  const titleEl = document.getElementById('drawerStepTitle');
  if (titleEl) {
    titleEl.addEventListener('change', () => {
      const val = titleEl.value.trim();
      if (!val) { titleEl.value = step.title; return; }
      const customStep = (state.customSteps[milestoneId] || []).find(s => s.id === stepId);
      if (customStep) {
        customStep.title = val;
      } else {
        if (!state.stepOverrides) state.stepOverrides = {};
        if (!state.stepOverrides[stepId]) state.stepOverrides[stepId] = {};
        state.stepOverrides[stepId].title = val;
      }
      saveState();
      drawer.querySelector('h3').textContent = val;
      refreshCurrentView();
    });
  }
  const descEl = document.getElementById('drawerStepDesc');
  if (descEl) {
    descEl.addEventListener('input', () => {
      const customStep = (state.customSteps[milestoneId] || []).find(s => s.id === stepId);
      if (customStep) {
        customStep.desc = descEl.value;
      } else {
        if (!state.stepOverrides) state.stepOverrides = {};
        if (!state.stepOverrides[stepId]) state.stepOverrides[stepId] = {};
        state.stepOverrides[stepId].desc = descEl.value;
      }
      saveState();
    });
  }
  const estEl = document.getElementById('drawerStepEst');
  if (estEl) {
    estEl.addEventListener('change', () => {
      const val = Math.max(1, parseInt(estEl.value, 10) || 1);
      const customStep = (state.customSteps[milestoneId] || []).find(s => s.id === stepId);
      if (customStep) {
        customStep.estimated_blocks = val;
      } else {
        if (!state.stepOverrides) state.stepOverrides = {};
        if (!state.stepOverrides[stepId]) state.stepOverrides[stepId] = {};
        state.stepOverrides[stepId].estimated_blocks = val;
      }
      saveState();
      // The Path view's per-step dot count depends on this — refresh it
      // live underneath the drawer instead of leaving it stale until the
      // next visit (unlike Notes/Due date, which aren't shown outside the drawer).
      renderPath(track, milestoneId);
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

// Mark a step done or not done. Finishing the last open step completes
// the milestone (with confetti); reopening a step reopens its milestone.
// Caller saves.
function setStepDone(stepId, milestoneId, done) {
  const ss = getStepState(stepId);
  const msState = getMilestoneState(milestoneId);
  if (done) {
    ss.status = 'done';
    ss.doneDate = todayStr();
    const allDone = getAllSteps(milestoneId).every(s => getStepState(s.id).status === 'done');
    if (allDone && msState.status !== 'done') {
      msState.status = 'done';
      showConfetti();
    }
    const track = getTrackForMilestone(milestoneId);
    const ms = getMilestone(milestoneId);
    state.lastAction = `${getTrackLabel(track)} → ${ms ? ms.title : ''} → done`;
  } else {
    ss.status = (ss.blocksCompleted || 0) > 0 ? 'active' : 'pending';
    delete ss.doneDate;
    if (msState.status === 'done') msState.status = 'pending';
  }
}

function markStepDone(stepId, milestoneId) {
  setStepDone(stepId, milestoneId, true);
  saveState();
  closeDrawer();
  handleRoute();
}

// onToggle: optional JS to run instead of toggleStepDone (e.g. to also
// refresh a drawer).
function stepCheckHtml(milestoneId, stepId, done, onToggle) {
  const action = onToggle || `toggleStepDone('${milestoneId}','${stepId}')`;
  return `<button type="button" class="step-check${done ? ' done' : ''}" role="checkbox" aria-checked="${done}"
    aria-label="${done ? 'Mark not done' : 'Mark done'}" title="${done ? 'Mark not done' : 'Mark done'}"
    onclick="event.stopPropagation();${action}">${ICONS.check}</button>`;
}

// The round check on step cards and Today rows: flips done ↔ not done in
// place, without opening the drawer.
function toggleStepDone(milestoneId, stepId) {
  setStepDone(stepId, milestoneId, getStepState(stepId).status !== 'done');
  saveState();
  refreshCurrentView();
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
    // A block in progress (running or paused) wins over the queue, so the
    // Focus tab and the timer pill return to it instead of the step-change
    // reset below silently stopping it.
    const next = getNextQueuedTask();
    if (timerStepId && timerMilestoneId && (timerRunning || timerRemainingMs)) {
      milestoneId = timerMilestoneId; stepId = timerStepId;
    } else if (next) { milestoneId = next.milestone.id; stepId = next.step.id; }
    else { el.innerHTML = '<div class="focus-view"><p style="color:var(--text-muted)">No task queued. Pick a project first.</p></div>'; return; }
  }

  const ms = getMilestone(milestoneId);
  const allSteps = getAllSteps(milestoneId);
  const step = ms ? allSteps.find(s => s.id === stepId) : null;
  if (!ms || !step) { el.innerHTML = '<div class="focus-view"><p style="color:var(--text-muted)">Task not found.</p></div>'; return; }

  const track = getTrackForMilestone(milestoneId);
  const color = getTrackColor(track);
  const blocksOnStep = getBlocksForStep(stepId);
  const estBlocks = step.estimated_blocks || null;
  const todayFull = getTodayBlocks().filter(l => !l.warmup).length;
  const maxToday = state.settings.blocksPerDay.max;
  const tooMany = todayFull >= maxToday;

  // Phase 1a: if a different step is loaded, fully reset; otherwise
  // preserve the running timer across navigation.
  const stepChanged = timerStepId && timerStepId !== stepId;
  timerStepId = stepId;
  timerMilestoneId = milestoneId;

  const duration = timerDurationMin();
  if (stepChanged && timerRunning) {
    // Switching tasks mid-block: stop the current timer cleanly.
    clearInterval(timerInterval);
    timerRunning = false;
    timerEndTime = 0;
    timerRemainingMs = 0;
  }
  if (!timerRunning && !timerRemainingMs) {
    timerTotal = duration * 60;
    timerRemaining = timerTotal;
    timerEndTime = 0;
    timerWarned = false;
  } else {
    // Recompute remaining from wall clock so the display is accurate
    // after a re-render (the timer was never actually paused).
    timerRemaining = computeTimerRemaining();
  }

  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  // Task 6: split layout — timer on left, workflow chart on right.
  let html = `<div class="focus-view focus-view-split">
    <div class="focus-main">
      <div class="focus-breadcrumb">${escapeHtml(getTrackLabel(track))} → ${escapeHtml(ms.title)} → ${escapeHtml(step.title)}</div>
      <div class="focus-step-title">${escapeHtml(step.title)}</div>
      ${step.desc ? `<div class="focus-step-desc">${escapeHtml(String(step.desc).length > 140 ? String(step.desc).slice(0, 140).trim() + '…' : step.desc)}</div>` : ''}
      ${getResumeNote(stepId) ? `<div class="resume-note" role="note">
        <span class="resume-note-label">Pick up here</span>
        <span class="resume-note-text">${escapeHtml(getResumeNote(stepId))}</span>
        <button type="button" class="resume-note-clear" aria-label="Clear note" title="Clear note" onclick="setResumeNote('${stepId}','');renderFocus('${milestoneId}','${stepId}')">${ICONS.xSm}</button>
      </div>` : ''}

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
        <button class="${timerMode() === 'full' ? 'active' : ''}" onclick="setTimerMode('full')">Full (${state.settings.blockDurationMin}m)</button>
        <button class="${timerMode() === 'warmup' ? 'active' : ''}" onclick="setTimerMode('warmup')">Warm-up (${state.settings.warmupDurationMin}m)</button>
        <button class="${timerMode() === 'starter' ? 'active' : ''}" onclick="setTimerMode('starter')" title="Can't get started? Just do 5 minutes.">Just ${STARTER_MIN} min</button>
      </div>

      <div class="focus-controls">
        <button class="btn btn-primary" style="background:${color};padding:8px 24px;" id="timerStartBtn" onclick="toggleTimer()">${timerRunning ? 'Pause' : 'Start'}</button>
        <button class="btn btn-outline" onclick="resetTimer()">Reset</button>
      </div>`;

  if (tooMany) {
    html += `<div class="focus-done-msg">You've done great today. Rest is productive too.</div>`;
  }

  html += `</div>`; // /focus-main

  // Right-hand workflow panel — the same Candy Land visual as the Path
  // view (Phase 2a), single-column since this panel is fixed-width
  // rather than full-page. Read-only reference: clicking opens the step
  // drawer, same as before; no reorder/rename/add-step controls here.
  html += `<aside class="focus-workflow" aria-label="Milestone workflow">
    <div class="focus-workflow-header">
      <div class="focus-workflow-title">${escapeHtml(ms.title)}</div>
      <div class="focus-workflow-sub">${allSteps.length} step${allSteps.length === 1 ? '' : 's'}</div>
    </div>
    <div class="winding-path candy-path focus-workflow-candy" style="--track-accent:${color}">`;
  allSteps.forEach((s, i) => {
    const ss = getStepState(s.id);
    const isCurrent = s.id === stepId;
    const estBlocks = s.estimated_blocks || 1;
    const completed = getBlocksForStep(s.id);
    let variantClass = '';
    if (ss.status === 'done') variantClass = 'candy-node--done';
    else if (isCurrent) variantClass = 'candy-node--active';
    else if (ss.status === 'locked') variantClass = 'candy-node--locked';
    const iconSvg = getStepIcon(s);
    let dotsHtml = '';
    for (let b = 0; b < estBlocks; b++) {
      dotsHtml += `<span class="step-block-dot${b < completed ? ' filled' : ''}"></span>`;
    }
    const trophyBadge = ss.status === 'done' ? `<span class="candy-trophy" aria-hidden="true">${MILESTONE_ICONS.trophy}</span>` : '';
    html += `<div class="candy-row candy-row--left">
      <div class="candy-node candy-node--step ${variantClass}" style="--node-accent:${color}" data-stepid="${s.id}" data-msid="${milestoneId}">
        ${isCurrent ? `<div class="game-piece" style="background:${color}"></div>` : ''}
        <div class="candy-icon" aria-hidden="true">${iconSvg}</div>
        <div class="candy-body">
          <div class="candy-step-num">Step ${i + 1}</div>
          <div class="candy-title"><span class="step-title-label">${escapeHtml(s.title)}</span></div>
          <div class="candy-step-meta">
            <div class="step-block-dots" onclick="event.stopPropagation();navigate('#blocks/${milestoneId}/${s.id}')" title="View block history">${dotsHtml}</div>
            ${ss.status === 'done' ? `<span class="done-check">${ICONS.check}</span>` : ''}
          </div>
        </div>
        ${trophyBadge}
      </div>
    </div>`;
    if (i < allSteps.length - 1) {
      html += `<div class="candy-path-connector${ss.status === 'done' ? ' candy-path-connector--done' : ''}" aria-hidden="true"></div>`;
    }
  });
  // Include QC tasks in the workflow panel (read-only, same as before).
  const qcItems = getQcItems(milestoneId);
  if (qcItems.length) {
    html += `<div class="path-connector"></div>`;
    html += `<div class="fw-qc-label">Quality checks</div>`;
    qcItems.forEach((qc, i) => {
      const checked = isQcChecked(milestoneId, qc.index);
      const trophyQc = checked ? `<span class="candy-trophy" aria-hidden="true">${MILESTONE_ICONS.trophy}</span>` : '';
      html += `<div class="candy-row candy-row--left">
        <div class="candy-node candy-node--step candy-node--qc${checked ? ' candy-node--done' : ''}" data-qc="1" data-msid="${milestoneId}" data-qcindex="${qc.index}">
          <div class="candy-icon" aria-hidden="true">${MILESTONE_ICONS.shield}</div>
          <div class="candy-body">
            <div class="candy-step-num">QC</div>
            <div class="candy-title"><span class="step-title-label">${escapeHtml(qc.label)}</span></div>
          </div>
          ${trophyQc}
        </div>
      </div>${i < qcItems.length - 1 ? '<div class="candy-path-connector" aria-hidden="true"></div>' : ''}`;
    });
  }
  html += `</div></aside>`; // /focus-workflow-candy /focus-workflow
  html += `</div>`; // /focus-view
  el.innerHTML = html;

  // Round 2 Task C: workflow step click opens the step drawer.
  // User can then press Start Focus from the drawer to switch.
  el.querySelectorAll('.focus-workflow-candy .candy-node--step[data-stepid]').forEach(stepEl => {
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

function timerMode() {
  return timerIsStarter ? 'starter' : timerIsWarmup ? 'warmup' : 'full';
}

function timerDurationMin() {
  if (timerIsStarter) return STARTER_MIN;
  return timerIsWarmup ? state.settings.warmupDurationMin : state.settings.blockDurationMin;
}

// mode: 'full' | 'warmup' | 'starter' (true/false still mean warm-up/full
// for older callers).
function setTimerMode(mode) {
  if (timerRunning) return;
  if (mode === true) mode = 'warmup';
  if (mode === false) mode = 'full';
  timerIsWarmup = mode === 'warmup';
  timerIsStarter = mode === 'starter';
  timerTotal = timerDurationMin() * 60;
  timerRemaining = timerTotal;
  timerRemainingMs = 0;
  timerEndTime = 0;
  timerWarned = false;
  saveTimerToStorage();
  const display = document.getElementById('timerDisplay');
  if (display) display.textContent = formatTime(timerRemaining);
  updateTimerRing();
  const order = ['full', 'warmup', 'starter'];
  document.querySelectorAll('.focus-toggle button').forEach((btn, i) => {
    btn.classList.toggle('active', order[i] === mode);
  });
}

// Open the focus view on a step in a given mode, optionally starting
// right away (used by "Just 5 min" buttons outside the focus view).
function startFocus(milestoneId, stepId, mode, autostart) {
  if (timerRunning && (timerStepId !== stepId)) return navigate(`#focus/${milestoneId}/${stepId}`);
  closeDrawer();
  if (!timerRunning) {
    timerStepId = stepId;
    timerMilestoneId = milestoneId;
    timerRemainingMs = 0;
    setTimerMode(mode || 'full');
  }
  navigate(`#focus/${milestoneId}/${stepId}`);
  if (autostart && !timerRunning) setTimeout(() => { if (!timerRunning) toggleTimer(); }, 0);
}

function toggleTimer() {
  if (timerRunning) {
    // Pause — stash how much time is left as ms so we can resume later.
    timerRemainingMs = Math.max(0, timerEndTime - Date.now());
    timerEndTime = 0;
    clearInterval(timerInterval);
    timerRunning = false;
    const btn = document.getElementById('timerStartBtn');
    if (btn) btn.textContent = 'Start';
  } else {
    // Start (or resume from paused state).
    const remainSec = timerRemainingMs > 0
      ? Math.ceil(timerRemainingMs / 1000)
      : (timerRemaining > 0 ? timerRemaining : timerTotal);
    timerEndTime = Date.now() + remainSec * 1000;
    timerRemainingMs = 0;
    timerRemaining = remainSec;
    timerRunning = true;
    const btn = document.getElementById('timerStartBtn');
    if (btn) btn.textContent = 'Pause';
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(timerTick, 1000);
    // Feature 16: browsers only allow sound / permission prompts from a
    // click, so get both ready now for the end-of-block alert.
    unlockAudio();
    maybeAskNotificationPermission();
    if (getBreak()) cancelBreak();
  }
  saveTimerToStorage();
  updateTimerPill();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerEndTime = 0;
  timerRemainingMs = 0;
  timerWarned = false;
  timerTotal = timerDurationMin() * 60;
  timerRemaining = timerTotal;
  saveTimerToStorage();
  const display = document.getElementById('timerDisplay');
  if (display) display.textContent = formatTime(timerRemaining);
  updateTimerRing();
  const btn = document.getElementById('timerStartBtn');
  if (btn) btn.textContent = 'Start';
  updateTimerPill();
}

function timerTick() {
  // Phase 1a: recompute from wall clock so backgrounded tabs (which
  // throttle setInterval) and re-renders don't lose time.
  timerRemaining = computeTimerRemaining();
  if (!timerWarned && !timerIsStarter && timerTotal >= 15 * 60 && timerRemaining > 0 && timerRemaining <= 5 * 60) {
    timerWarned = true;
    saveTimerToStorage();
    warnBlockEnding();
  }
  if (timerRemaining <= 0) {
    timerRemaining = 0;
    clearInterval(timerInterval);
    timerRunning = false;
    timerEndTime = 0;
    timerRemainingMs = 0;
    saveTimerToStorage();
    if (timerIsStarter) {
      finishStarter();
    } else {
      completeBlock();
      notifyBlockEnd(timerIsWarmup);
    }
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
    // Feature 18: between blocks, the pill counts down an active break.
    const brk = getBreak();
    if (brk && brk.endTime > Date.now()) {
      const left = Math.ceil((brk.endTime - Date.now()) / 1000);
      pill.hidden = false;
      pill.href = `#focus/${brk.milestoneId}/${brk.stepId}`;
      const timeEl = document.getElementById('timerPillTime');
      const labelEl = document.getElementById('timerPillLabel');
      if (timeEl) timeEl.textContent = formatTime(left);
      if (labelEl) labelEl.textContent = 'Break';
      document.title = `Break ${formatTime(left)}`;
      return;
    }
    pill.hidden = true;
    document.title = BASE_TITLE;
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
  // Countdown in the tab title, visible from any other tab.
  document.title = `${formatTime(timerRemaining)} · ${label}`;
  const track = getTrackForMilestone(timerMilestoneId);
  const color = track ? getTrackColor(track) : null;
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

// Feature 8: accepts optional explicit {stepId, milestoneId, warmup, note}
// so a block can be logged manually (Home's "log a block" control) through
// the exact same points/streak logic as a timer completion, just without
// running the 90-minute timer. Falls back to the timer's own module-level
// globals when called with no args, so the existing timer-completion call
// site (timerTick, below) is unchanged.
function completeBlock(opts) {
  opts = opts || {};
  const stepId = opts.stepId || timerStepId;
  const milestoneId = opts.milestoneId || timerMilestoneId;
  const warmup = typeof opts.warmup === 'boolean' ? opts.warmup : timerIsWarmup;
  const note = typeof opts.note === 'string' ? opts.note.trim() : '';

  // Phase 1a: clear persistent timer so a refresh doesn't try to resume
  // a finished block. Harmless no-op for a manually-logged block.
  try { localStorage.removeItem('soma_timer'); } catch (e) {}
  const logEntry = {
    date: todayStr(),
    stepId,
    milestoneId,
    blocks: 1,
    warmup,
    timestamp: Date.now(),
    note
  };
  state.focusLog.push(logEntry);

  const ss = getStepState(stepId);
  ss.blocksCompleted = (ss.blocksCompleted || 0) + 1;
  if (ss.status !== 'done') ss.status = 'active';

  const pts = awardPoints(warmup);
  updateStreak();

  const track = getTrackForMilestone(milestoneId);
  const ms = getMilestone(milestoneId);
  const allSteps = getAllSteps(milestoneId);
  const step = allSteps.find(s => s.id === stepId);
  state.lastAction = `${getTrackLabel(track)} → ${ms ? ms.title : ''} → ${step ? step.title : ''}`;
  saveState();

  showPointsPopup(pts);

  const hash = window.location.hash;
  if (hash.startsWith('#focus')) {
    renderFocus(timerMilestoneId, timerStepId);
  }
}

// ---- Feature 16: block-end alerts ----
// A soft chime (Web Audio, so no sound file to ship), a system
// notification when Soma isn't the visible tab, and a break nudge.
const BASE_TITLE = document.title;
const NOTIFY_ASKED_KEY = 'soma_notify_asked';
let _audioCtx = null;

function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!_audioCtx) _audioCtx = new AC();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
  } catch (e) { /* no audio */ }
}

// Default: three rising sine notes (E5, A5, E6), each fading out over ~1s.
const CHIME_DONE = [[659.25, 0], [880, 0.18], [1318.5, 0.36]];
// A single soft note for heads-ups (5 minutes left, break over).
const CHIME_SOFT = [[880, 0]];

function playChime(notes) {
  unlockAudio();
  const ctx = _audioCtx;
  if (!ctx) return;
  const now = ctx.currentTime;
  (notes || CHIME_DONE).forEach(([freq, at]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(0.18, now + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 1.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + at);
    osc.stop(now + at + 1.3);
  });
}

// Ask once, on the first Start, instead of on page load.
function maybeAskNotificationPermission() {
  try {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    if (localStorage.getItem(NOTIFY_ASKED_KEY)) return;
    localStorage.setItem(NOTIFY_ASKED_KEY, '1');
    Notification.requestPermission().catch(() => {});
  } catch (e) { /* unsupported */ }
}

function showSystemNotification(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body, icon: 'icon-192.png', tag: 'soma-block' };
    try {
      new Notification(title, opts);
    } catch (e) {
      // Android Chrome only allows notifications through a service worker.
      if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(r => r && r.showNotification(title, opts));
    }
  } catch (e) { /* unsupported */ }
}

function notifyBlockEnd(warmup) {
  const breakMin = warmup ? 5 : 15;
  const step = getAllSteps(timerMilestoneId).find(s => s.id === timerStepId);
  const title = warmup ? 'Warm-up done' : 'Focus block done';
  if (state.settings.blockEndSound !== false) playChime();
  if (document.visibilityState !== 'visible') {
    showSystemNotification(title, `${step ? step.title + ': ' : ''}nice work. Take a ${breakMin}-minute break — stand up, stretch, drink some water.`);
  }
  openBlockDonePanel({ title, breakMin, milestoneId: timerMilestoneId, stepId: timerStepId });
}

// ---- Feature 18: smoother starts, stops and restarts ----

// 5 minutes before the end: a soft heads-up to wrap up and leave a note.
function warnBlockEnding() {
  if (state.settings.blockEndSound !== false) playChime(CHIME_SOFT);
  const msg = '5 minutes left. Start wrapping up, and think about where you’ll pick up next time.';
  if (document.visibilityState !== 'visible') showSystemNotification('5 minutes left', msg);
  qaToast(msg);
}

// "Just 5 minutes" finished: celebrate starting, then offer to keep going
// with the 5 minutes already counted.
function finishStarter() {
  timerIsStarter = false;
  if (state.settings.blockEndSound !== false) playChime();
  state.points += 1;
  saveState();
  showPointsPopup(1);
  if (document.visibilityState !== 'visible') {
    showSystemNotification('You started!', 'That was the hardest part. Keep going?');
  }
  const overlay = openSmallModal('starterDoneOverlay', `
    <div class="project-modal-title">You started — that’s the hardest part</div>
    <p class="modal-copy">Keep the momentum? The 5 minutes you just did count toward the block.</p>
    <div class="project-modal-actions">
      <button type="button" class="btn btn-outline" data-act="stop">Stop here</button>
      <button type="button" class="btn btn-outline" data-act="warmup">Keep going (${state.settings.warmupDurationMin}m)</button>
      <button type="button" class="btn btn-primary" data-act="full">Keep going (${state.settings.blockDurationMin}m)</button>
    </div>`);
  overlay.addEventListener('click', (e) => {
    const act = e.target.dataset && e.target.dataset.act;
    if (!act) return;
    overlay.remove();
    if (act === 'stop') {
      setTimerMode('full');
      refreshFocusIfOpen();
      return;
    }
    continueAfterStarter(act);
  });
}

function continueAfterStarter(mode) {
  setTimerMode(mode);
  // Credit the starter minutes: the new block begins part-way through.
  const left = Math.max(60, timerTotal - STARTER_MIN * 60);
  timerRemaining = left;
  timerRemainingMs = left * 1000;
  toggleTimer();
  refreshFocusIfOpen();
}

function refreshFocusIfOpen() {
  if ((window.location.hash || '').startsWith('#focus')) renderFocus(timerMilestoneId, timerStepId);
}

// A dismissable dialog in the project-modal style. Returns the overlay.
function openSmallModal(id, innerHtml) {
  const old = document.getElementById(id);
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'project-modal-overlay small-modal-overlay';
  overlay.innerHTML = `<div class="project-modal" role="dialog" aria-modal="true">${innerHtml}</div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  const first = overlay.querySelector('textarea, input, .btn-primary');
  if (first) setTimeout(() => first.focus(), 30);
  return overlay;
}

// After a block: one line on where you left off (shown next time you open
// the step), then an optional break timer.
function openBlockDonePanel({ title, breakMin, milestoneId, stepId }) {
  const step = getAllSteps(milestoneId).find(s => s.id === stepId);
  const current = (getStepState(stepId).resumeNote || {}).text || '';
  const overlay = openSmallModal('blockDoneOverlay', `
    <div class="project-modal-title">${escapeHtml(title)} 🎉</div>
    ${step ? `<p class="modal-copy">Nice work on <strong>${escapeHtml(step.title)}</strong>.</p>` : ''}
    <label class="project-modal-field">
      <span>Where did you leave off?</span>
      <textarea id="resumeNoteInput" rows="2" maxlength="200" placeholder="e.g. Fix the labels on figure 2">${escapeHtml(current)}</textarea>
    </label>
    <p class="modal-hint">You’ll see this next time you open the task, so restarting is easy.</p>
    <div class="project-modal-actions">
      <button type="button" class="btn btn-outline" data-act="done">Done</button>
      <button type="button" class="btn btn-primary" data-act="break">Start ${breakMin}-min break</button>
    </div>`);
  overlay.addEventListener('click', (e) => {
    const act = e.target.dataset && e.target.dataset.act;
    if (!act) return;
    setResumeNote(stepId, overlay.querySelector('#resumeNoteInput').value);
    overlay.remove();
    refreshCurrentView();
    if (act === 'break') startBreak(breakMin, milestoneId, stepId);
  });
  overlay.querySelector('#resumeNoteInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); overlay.querySelector('[data-act="break"]').click(); }
  });
}

function setResumeNote(stepId, text) {
  const ss = getStepState(stepId);
  const clean = String(text || '').trim();
  if (clean) ss.resumeNote = { text: clean, date: todayStr() };
  else delete ss.resumeNote;
  saveState();
}

function getResumeNote(stepId) {
  const ss = state.steps[stepId];
  return ss && ss.resumeNote ? ss.resumeNote.text : '';
}

// Break timer: counts down in the timer pill and tab title, then nudges
// back to the same task. Starting a new block cancels it.
const BREAK_KEY = 'soma_break';
let _breakInterval = null;

function getBreak() {
  try { return JSON.parse(localStorage.getItem(BREAK_KEY) || 'null'); } catch (e) { return null; }
}

function startBreak(minutes, milestoneId, stepId) {
  try { localStorage.setItem(BREAK_KEY, JSON.stringify({ endTime: Date.now() + minutes * 60000, milestoneId, stepId })); } catch (e) { /* ignore */ }
  runBreakTicker();
}

function cancelBreak() {
  try { localStorage.removeItem(BREAK_KEY); } catch (e) { /* ignore */ }
  if (_breakInterval) clearInterval(_breakInterval);
  _breakInterval = null;
  updateTimerPill();
}

function runBreakTicker() {
  if (_breakInterval) clearInterval(_breakInterval);
  const tick = () => {
    const b = getBreak();
    if (!b) { cancelBreak(); return; }
    if (Date.now() >= b.endTime) {
      cancelBreak();
      if (state.settings.blockEndSound !== false) playChime(CHIME_SOFT);
      const msg = 'Break’s over. Ready for the next block?';
      if (document.visibilityState !== 'visible') showSystemNotification('Break’s over', msg);
      qaToast(msg, { view: `#focus/${b.milestoneId}/${b.stepId}`, viewLabel: 'Start' });
      return;
    }
    updateTimerPill();
  };
  tick();
  if (getBreak()) _breakInterval = setInterval(tick, 1000);
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
  const prevWeekStart = localDateStr(d);
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
      const color = getTrackColor(track);
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
    const color = getTrackColor(track);
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
        ${idea.promoted ? '<span class="badge">promoted</span>' : `<button class="idea-promote" onclick="promoteIdea('${idea.id}')">Make it a task</button>`}
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

// Opens Quick Add prefilled with the idea; it's only marked promoted once
// a task actually gets created from it.
function promoteIdea(ideaId) {
  const idea = state.ideas.find(i => i.id === ideaId);
  if (!idea) return;
  openQuickAdd({
    kind: 'task',
    text: idea.text,
    onAdded: () => {
      const current = state.ideas.find(i => i.id === ideaId);
      if (current) current.promoted = true;
    }
  });
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
    createdAt: localDateStr(new Date()),
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

  const intro = PROFILE.aiPromptIntro
    || 'You are helping someone prioritize their week. They have ADHD and get overwhelmed seeing everything at once — keep your advice concrete, calm, and focused on "what to do next" rather than listing everything.';
  let prompt = `${intro}\n\n`;
  prompt += `Today: ${formatDate(now)}\n`;
  prompt += `Weekly goal: ${s.weeklyGoal || 10} focus blocks (${s.blockDurationMin || 90} min each), max ${s.blocksPerDay?.max || 4}/day, weekends off\n`;
  prompt += `This week so far: ${weekBlocks.length} blocks completed\n`;
  prompt += `Points: ${state.points} | Streak: ${getCurrentStreak()} days\n\n`;

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
  const lwStr = localDateStr(lastWeekStart);
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
  const pendingAdmin = (state.adminTasks || []).filter(t => !t.completedDate);
  if (pendingAdmin.length > 0) {
    prompt += `--- ADMIN TASKS (misc, max 2/day) ---\n`;
    pendingAdmin.slice(0, 5).forEach(t => {
      prompt += `  - ${t.text}\n`;
    });
    prompt += `\n`;
  }

  // Prep batches in progress
  const activeBatches = (state.prepBatches || []).filter(b => !b.steps.every(s => s.done));
  if (LAB_PREP_ENABLED && activeBatches.length > 0) {
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

// Clipboard write with the old execCommand fallback (file:// pages and
// some browsers refuse navigator.clipboard). Resolves true on success.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(textarea);
    return ok;
  }
}

async function copyWeeklyPrompt() {
  if (!hasFeature('aiPlanner')) return showUpgrade('aiPlanner');
  const ok = await copyText(generateWeeklyPrompt());
  const btn = document.getElementById('planWeekBtn');
  if (!btn) return;
  const orig = btn.innerHTML;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg> ${ok ? 'Copied — paste into any AI chat' : 'Copy failed — try again'}`;
  btn.classList.add('copied');
  setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 3000);
}

// Feature 15: "Break it down with AI". Copies a prompt asking the user's
// own AI chat to split a step into small actions, then opens Quick Add on
// the same milestone; pasting the reply adds one step per line, placed
// right after the original. Nothing is sent anywhere by Soma itself.
function generateBreakdownPrompt(milestoneId, stepId) {
  const step = getAllSteps(milestoneId).find(s => s.id === stepId);
  const ms = getMilestone(milestoneId);
  const track = getTrackForMilestone(milestoneId);
  const lines = [
    'Break this task into 3–7 small, concrete next actions. Each one should take 15–45 minutes and start with a verb.',
    'Reply with one action per line and nothing else: no numbering, headings or commentary.',
    '',
    `Task: ${step ? step.title : ''}`,
    `Project: ${getTrackLabel(track)}${ms ? ' › ' + ms.title : ''}`
  ];
  if (step && step.desc) lines.push(`Details: ${step.desc}`);
  return lines.join('\n');
}

async function breakDownWithAI(milestoneId, stepId) {
  if (!hasFeature('aiPlanner')) { closeDrawer(); return showUpgrade('aiPlanner'); }
  const ok = await copyText(generateBreakdownPrompt(milestoneId, stepId));
  closeDrawer();
  openQuickAdd({
    kind: 'task',
    trackId: getTrackForMilestone(milestoneId),
    milestoneId,
    insertAfter: stepId,
    note: ok
      ? 'Prompt copied. Paste it into ChatGPT, Claude or any AI chat, then paste the reply here. Each line becomes a step.'
      : 'Couldn’t copy automatically. Ask your AI chat to break the task into small steps, one per line, then paste the reply here.'
  });
}

// ---- RENDER: Docs ----
// Reference docs are profile data (see SOMA_PROFILE.docs in data.js); each
// entry is { id, title, desc, file, tags: [trackId…], icon: DOC_ICONS key }.
const DOCS = Array.isArray(PROFILE.docs) ? PROFILE.docs : [];

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

  if (!DOCS.length) {
    el.innerHTML = `<div class="section-title">Reference Docs</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);">No reference docs yet.</p>`;
    return;
  }

  // One filter per project that at least one doc is tagged with, in the
  // same order projects appear everywhere else.
  const taggedTracks = new Set(DOCS.flatMap(d => d.tags || []));
  const filterTracks = getAllTrackIds().filter(t => taggedTracks.has(t));

  let html = `<div class="section-title">Reference Docs</div>
    <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-5);">
      Key documents from your planning sessions. Tap to open.
    </p>
    <div class="docs-filter" id="docsFilter">
      <button class="doc-filter-btn active" data-filter="all">All</button>
      ${filterTracks.map(t => `<button class="doc-filter-btn" data-filter="${t}" style="--fc:${getTrackColor(t)}">${escapeHtml(getTrackLabel(t).split(' ')[0])}</button>`).join('')}
    </div>
    <div class="docs-grid" id="docsGrid">`;

  DOCS.forEach(doc => {
    doc.tags = doc.tags || [];
    const tagBadges = doc.tags.map(t => {
      const color = getTrackColor(t);
      const label = getTrackLabel(t);
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

  const guide = DOCS.find(d => d.id === 'guide');
  let html = `<div class="section-title">Settings</div>
    ${guide ? `<a class="settings-guide-link" href="${guide.file}" target="_blank" rel="noopener">New here, or stuck? Read <strong>How to use Soma</strong> →</a>` : ''}

    <div class="settings-group">
      <h4>Theme</h4>
      <div class="theme-picker">
        ${THEMES.map(t => {
          const locked = !hasFeature('themes') && !FREE_THEMES.includes(t.id);
          return `
          <div class="theme-swatch ${t.id === currentTheme ? 'active' : ''}${locked ? ' theme-locked' : ''}" onclick="${locked ? "showUpgrade('themes')" : `applyTheme('${t.id}'); renderSettings();`}" title="${t.label}${locked ? ' (Pro)' : ''}">
            <div class="swatch-inner">
              <div class="swatch-top" style="background:${t.top}"></div>
              <div class="swatch-bot" style="background:${t.bot}"></div>
            </div>
            <span class="swatch-label">${t.label}${locked ? ' <span class="pro-badge">Pro</span>' : ''}</span>
          </div>
        `;
        }).join('')}
      </div>
    </div>

    ${renderProSettings()}

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
      <div class="setting-row">
        <label class="setting-label" for="settingChime">Chime when a block ends</label>
        <input type="checkbox" id="settingChime" ${s.blockEndSound !== false ? 'checked' : ''}>
      </div>
      <div class="setting-row">
        <span class="setting-label">Notify me when a block ends</span>
        ${notificationSettingHtml()}
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
        <span style="font-size:13px;color:var(--text-primary)">${getCurrentStreak()} days (best ${getBestStreak()})</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">Custom steps</span>
        <span style="font-size:13px;color:var(--text-primary)">${Object.values(state.customSteps || {}).reduce((s,a)=>s+a.length,0)}</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">Admin tasks</span>
        <span style="font-size:13px;color:var(--text-primary)">${(state.adminTasks || []).length}</span>
      </div>
      ${LAB_PREP_ENABLED ? `<div class="setting-row">
        <span class="setting-label">Prep batches</span>
        <span style="font-size:13px;color:var(--text-primary)">${(state.prepBatches || []).length}</span>
      </div>` : ''}
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

    ${GITHUB_SYNC_ENABLED ? `<div class="settings-group">
      <h4>GitHub Sync</h4>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--sp-3);">Your progress auto-syncs to <code style="font-size:11px;background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">state.json</code> in your repo 4 seconds after any change. Paste a classic GitHub PAT with <code style="font-size:11px;background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">repo</code> scope.</p>
      <div class="setting-row" style="gap:8px;">
        <input class="setting-input" type="password" id="githubTokenInput"
          placeholder="ghp_…" value="${getGithubToken()}"
          style="flex:1;font-family:monospace;font-size:12px;letter-spacing:0.5px;">
        <button class="btn btn-outline" style="white-space:nowrap;"
          onclick="saveGithubToken(document.getElementById('githubTokenInput').value); renderSettings(); scheduleGithubPush();">
          Save token
        </button>
      </div>
      <div class="setting-row" style="margin-top:var(--sp-2);">
        <span class="setting-label">Status</span>
        <span id="githubSyncBadge" style="font-size:12px;"></span>
      </div>
      <div style="display:flex;gap:8px;margin-top:var(--sp-3);">
        <button class="btn btn-outline" style="font-size:12px;" onclick="pushStateToGitHub()">Push now</button>
        <button class="btn btn-outline" style="font-size:12px;"
          onclick="pullStateFromGitHub().then(()=>{ handleRoute(); renderSettings(); })">
          Pull from GitHub
        </button>
      </div>
    </div>` : ''}

    <div class="settings-group">
      <button class="btn btn-outline" style="width:100%;" onclick="resetAllData()">Reset all data</button>
    </div>`;

  el.innerHTML = html;

  ['settingBlockDur', 'settingWarmupDur', 'settingMinBlocks', 'settingMaxBlocks', 'settingWeeklyGoal', 'settingChime'].forEach(id => {
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
  const chime = document.getElementById('settingChime');
  if (chime) state.settings.blockEndSound = chime.checked;
  saveState();
}

function notificationSettingHtml() {
  if (!('Notification' in window)) return `<span class="setting-note">Not supported in this browser</span>`;
  if (Notification.permission === 'granted') return `<span class="setting-note">On</span>`;
  if (Notification.permission === 'denied') return `<span class="setting-note">Blocked — allow it in your browser's site settings</span>`;
  return `<button class="btn btn-outline btn-sm" onclick="Notification.requestPermission().then(renderSettings).catch(() => {})">Turn on</button>`;
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
    if (getBestStreak() >= tier.threshold && !tierState.claimed && !tierState.notified) {
      earned.push(tier);
    }
  }
  return earned;
}

function isRewardEarned(tier, isStreak) {
  // Best, not current: a reward reached stays earned after a break.
  if (isStreak) return getBestStreak() >= tier.threshold;
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
  if (!hasFeature('rewards')) {
    el.innerHTML = `<div class="section-title">Rewards</div>` + proLockedCard('rewards', 'Pick real treats for each points tier and streak, and claim them as you earn them. Your points keep counting on the free plan.');
    return;
  }
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
  const current = isStreak ? getBestStreak() : state.points;
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
  const streak = getCurrentStreak();
  const pts = state.points;

  let html = `<div class="section-title">Progress</div>
    ${renderBoardLinks()}
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
    ${hasFeature('progressCharts') ? `<div class="chart-card">
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
    </div>` : proLockedCard('progressCharts', 'See your focus hours week by week and where your blocks went, project by project.')}`;

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
    const ws = getWeekStart(localDateStr(d));
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
      projColors.push(getTrackHexColor(track));
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
  const lastWeekStart = localDateStr(d);
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
          <div class="review-stat-val">${getCurrentStreak()}</div>
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
      const color = getTrackColor(track);
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
    el.style.borderColor = getTrackColor(track);
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
// FEATURE 14: TODAY
// ================================================================
// A short list of what to work on today, across every project. Picks
// carry over until they're done, so nothing silently falls off, and
// finished picks stay (struck through) for the rest of the day. Steps due
// within a week show underneath; with nothing picked, the card suggests
// each project's next open step.

const TODAY_SOFT_CAP = 3;
const DUE_SOON_DAYS = 7;

// Read-only status lookup: getStepState() would create an entry for every
// step these lists scan.
function stepStatus(stepId) {
  return (state.steps[stepId] && state.steps[stepId].status) || 'pending';
}

function isPickedForToday(stepId) {
  return !!(state.todayPicks && state.todayPicks[stepId]);
}

function setTodayPick(stepId, milestoneId, picked) {
  if (!state.todayPicks) state.todayPicks = {};
  if (picked) state.todayPicks[stepId] = { milestoneId, date: todayStr() };
  else delete state.todayPicks[stepId];
}

function toggleTodayPick(milestoneId, stepId) {
  setTodayPick(stepId, milestoneId, !isPickedForToday(stepId));
  saveState();
  refreshCurrentView();
}

// when: 'today' | 'tomorrow' | 'nextweek' (next Monday) | 'clear'
function rescheduleStep(stepId, when) {
  const d = new Date(todayStr() + 'T00:00:00');
  if (when === 'tomorrow') d.setDate(d.getDate() + 1);
  if (when === 'nextweek') d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
  if (when === 'clear') delete state.dueDates[stepId];
  else state.dueDates[stepId] = localDateStr(d);
  saveState();
  refreshCurrentView();
}

// Picks worth showing: open ones (including those carried over from
// earlier days) and ones finished today. Picks whose step was finished on
// an earlier day, archived or deleted are dropped.
function getTodayItems() {
  const today = todayStr();
  const items = [];
  let pruned = false;
  for (const [stepId, pick] of Object.entries(state.todayPicks || {})) {
    const step = getAllSteps(pick.milestoneId).find(s => s.id === stepId);
    const ss = state.steps[stepId] || {};
    if (!step || (ss.status === 'done' && ss.doneDate !== today)) {
      delete state.todayPicks[stepId];
      pruned = true;
      continue;
    }
    items.push({ step, milestoneId: pick.milestoneId, trackId: getTrackForMilestone(pick.milestoneId), done: ss.status === 'done', date: pick.date });
  }
  if (pruned) saveState();
  items.sort((a, b) => (a.done - b.done) || a.date.localeCompare(b.date));
  return items;
}

// Open steps on active projects due within DUE_SOON_DAYS (or overdue).
function getDueSoonItems(excludeIds) {
  const limit = new Date(todayStr() + 'T00:00:00');
  limit.setDate(limit.getDate() + DUE_SOON_DAYS);
  const limitStr = localDateStr(limit);
  const out = [];
  for (const trackId of getActiveTrackIds()) {
    for (const ms of getMilestonesForTrack(trackId)) {
      for (const step of getAllSteps(ms.id)) {
        const due = state.dueDates[step.id];
        if (!due || due > limitStr || excludeIds.has(step.id) || stepStatus(step.id) === 'done') continue;
        out.push({ step, milestoneId: ms.id, trackId, due });
      }
    }
  }
  return out.sort((a, b) => a.due.localeCompare(b.due));
}

// Each project's next open step, this week's focus projects first.
function getTodaySuggestions(excludeIds) {
  const active = getActiveTrackIds();
  const focus = (state.weeklyPlan.focusProjects || []).filter(t => active.includes(t));
  const out = [];
  for (const trackId of [...focus, ...active.filter(t => !focus.includes(t))]) {
    const ms = getCurrentMilestone(trackId);
    if (!ms) continue;
    const step = getAllSteps(ms.id).find(s => stepStatus(s.id) !== 'done' && !excludeIds.has(s.id));
    if (step) out.push({ step, milestoneId: ms.id, trackId });
    if (out.length >= TODAY_SOFT_CAP) break;
  }
  return out;
}

// "Slipped", not "overdue": dates move, and a past date is a cue to pick
// a new one, not a failure.
function formatDueLabel(due) {
  const days = Math.round((new Date(due + 'T00:00:00') - new Date(todayStr() + 'T00:00:00')) / 86400000);
  if (days < 0) return { text: days === -1 ? 'Slipped since yesterday' : `Slipped ${-days} days`, cls: 'slipped' };
  if (days === 0) return { text: 'Due today', cls: 'today' };
  if (days === 1) return { text: 'Due tomorrow', cls: 'soon' };
  return { text: 'Due ' + qaFormatDue(due), cls: '' };
}

function todayRowHtml({ step, milestoneId, trackId }, picked) {
  const done = stepStatus(step.id) === 'done';
  const ms = getMilestone(milestoneId);
  const due = state.dueDates[step.id];
  const dueInfo = due && !done ? formatDueLabel(due) : null;
  // The date comes before the milestone so it survives truncation.
  const meta = `<span class="today-proj" style="--pc:${getTrackColor(trackId)}">${escapeHtml(getTrackLabel(trackId))}</span>`
    + (dueInfo ? ` · <span class="today-due ${dueInfo.cls}">${dueInfo.text}</span>` : '')
    + (ms ? ` · ${escapeHtml(ms.title)}` : '');
  let actions;
  if (picked) {
    actions = (done ? '' : `<button type="button" class="today-act" title="Start focus" aria-label="Start focus" onclick="navigate('#focus/${milestoneId}/${step.id}')">${ICONS.play}</button>`)
      + `<button type="button" class="today-act" title="Remove from Today" aria-label="Remove from Today" onclick="toggleTodayPick('${milestoneId}','${step.id}')">${ICONS.xSm}</button>`;
  } else {
    actions = `<button type="button" class="today-act today-pick" title="Add to Today" onclick="toggleTodayPick('${milestoneId}','${step.id}')">${ICONS.plus}<span>Today</span></button>`;
  }
  // One tap to give a slipped date a new home.
  if (dueInfo && dueInfo.cls === 'slipped') {
    actions += `<button type="button" class="today-act" title="Move to tomorrow" onclick="rescheduleStep('${step.id}','tomorrow')">Tomorrow</button>`
      + `<button type="button" class="today-act" title="Move to next Monday" onclick="rescheduleStep('${step.id}','nextweek')">Next week</button>`;
  }
  const next = getResumeNote(step.id);
  return `<li class="today-row${done ? ' done' : ''}" style="--node-accent:${getTrackColor(trackId)}">
    ${stepCheckHtml(milestoneId, step.id, done)}
    <div class="today-main" role="button" tabindex="0" onclick="openStepDrawer('${milestoneId}','${step.id}')">
      <div class="today-title">${escapeHtml(step.title)}</div>
      <div class="today-meta">${meta}</div>
      ${next && !done ? `<div class="today-next">Next: ${escapeHtml(next.replace(/^next\s*[:\-–]\s*/i, ''))}</div>` : ''}
    </div>
    <div class="today-actions">${actions}</div>
  </li>`;
}

function renderTodayCard() {
  const items = getTodayItems();
  const open = items.filter(i => !i.done);
  const pickedIds = new Set(items.map(i => i.step.id));
  const due = getDueSoonItems(pickedIds);

  let html = `<section class="card today-card" aria-labelledby="todayTitle">
    <div class="today-head">
      <h2 class="today-heading" id="todayTitle">Today</h2>
      ${items.length ? `<span class="today-count">${items.length - open.length} of ${items.length} done</span>` : ''}
      <button type="button" class="btn btn-ghost btn-sm today-add-btn" onclick="openQuickAdd({ kind: 'task', today: true })">${ICONS.plus} Add</button>
    </div>`;
  if (items.length) {
    html += `<ul class="today-list">${items.map(i => todayRowHtml(i, true)).join('')}</ul>`;
    if (open.length > TODAY_SOFT_CAP) {
      html += `<p class="today-hint">That's a full day. ${TODAY_SOFT_CAP} things finished beats ${open.length} things started.</p>`;
    } else if (!open.length) {
      html += `<p class="today-hint">All done for today. Rest is productive too.</p>`;
    }
  } else {
    const suggestions = getTodaySuggestions(new Set(due.map(d => d.step.id)));
    html += `<p class="today-empty">Pick up to ${TODAY_SOFT_CAP} things to do today.${suggestions.length ? ' Some ideas:' : ''}</p>`;
    if (suggestions.length) html += `<ul class="today-list">${suggestions.map(i => todayRowHtml(i, false)).join('')}</ul>`;
  }
  if (due.length) {
    html += `<div class="today-sub">Due soon</div><ul class="today-list">${due.slice(0, 5).map(i => todayRowHtml(i, false)).join('')}</ul>`;
    if (due.length > 5) html += `<p class="today-hint">+ ${due.length - 5} more due in the next ${DUE_SOON_DAYS} days</p>`;
  }
  html += `</section>`;
  return html;
}

// ================================================================
// FEATURE 17: BOARD
// ================================================================
// A Candy Land–style board for one project: a winding road from Start to
// Finish where every space is a milestone. Each space is filled with
// small squares, one per focus block the milestone is estimated to take
// (grouped by step), that fill in as blocks are logged. The game piece
// sits on the first unfinished milestone. Tapping a space opens a drawer
// with that milestone's steps.

const BOARD_TRACK_KEY = 'soma_board_track';
const BOARD_MAX_SQUARES = 48;
// Candy colors cycled along the road (cherry, orange, lemon, mint,
// blueberry, grape, bubblegum). Spaces mix them into the theme surface,
// so the board stays readable on light and dark themes alike.
const BOARD_CANDY = ['#e8647c', '#f0a830', '#e2b93b', '#5fb98a', '#4fa3d9', '#9b7fd4', '#ef8fb4'];
let _boardTrack = null;
let _boardCols = 0;
let _boardObserver = null;

function boardColumns() {
  const main = document.getElementById('mainContent');
  const w = main ? main.clientWidth : window.innerWidth;
  return w >= 900 ? 4 : w >= 600 ? 3 : 2;
}

function boardDefaultTrack() {
  const active = getActiveTrackIds();
  let remembered = null;
  try { remembered = localStorage.getItem(BOARD_TRACK_KEY); } catch (e) { /* ignore */ }
  const focus = (state.weeklyPlan.focusProjects || [])[0];
  return [remembered, focus, active[0]].find(t => t && active.includes(t)) || null;
}

// One group per step (plus one per QC check), each with its block squares.
// A finished step counts as fully filled even if fewer blocks were logged;
// blocks logged beyond the estimate show as gold "extra" squares.
function milestoneBlockGroups(milestoneId) {
  const groups = getAllSteps(milestoneId).map(step => {
    const est = step.estimated_blocks || 1;
    const logged = getBlocksForStep(step.id);
    const done = stepStatus(step.id) === 'done';
    return { step, label: step.title, est, filled: done ? est : Math.min(logged, est), extra: Math.max(0, logged - est), done };
  });
  getQcItems(milestoneId).forEach(qc => {
    const checked = isQcChecked(milestoneId, qc.index);
    groups.push({ label: 'QC: ' + qc.label, est: 1, filled: checked ? 1 : 0, extra: 0, done: checked });
  });
  return groups;
}

function blockSquaresHtml(groups, cap) {
  let shown = 0;
  let hidden = 0;
  const parts = [];
  for (const g of groups) {
    const squares = [];
    const count = g.est + g.extra;
    for (let i = 0; i < count; i++) {
      if (cap && shown >= cap) { hidden++; continue; }
      const cls = i < g.filled ? ' f' : i >= g.est ? ' x' : '';
      squares.push(`<span class="bb${cls}"></span>`);
      shown++;
    }
    if (squares.length) parts.push(`<span class="board-group" title="${escapeHtml(g.label)}: ${g.filled}/${g.est} block${g.est === 1 ? '' : 's'}${g.extra ? ` (+${g.extra} extra)` : ''}">${squares.join('')}</span>`);
  }
  if (hidden) parts.push(`<span class="board-more">+${hidden}</span>`);
  return parts.join('');
}

function renderBoard(trackId) {
  const el = document.getElementById('view-board');
  if (!trackId || !getAllTrackIds().includes(trackId)) trackId = boardDefaultTrack();
  _boardTrack = trackId;
  if (!trackId) {
    el.innerHTML = `<div class="section-title">Board</div>
      <p class="today-empty">No active projects yet. Add one with the + button and its board appears here.</p>`;
    return;
  }
  try { localStorage.setItem(BOARD_TRACK_KEY, trackId); } catch (e) { /* ignore */ }

  const milestones = getMilestonesForTrack(trackId);
  const color = getTrackColor(trackId);
  const curIdx = milestones.findIndex(m => getMilestoneState(m.id).status !== 'done');
  const allDone = milestones.length > 0 && curIdx === -1;
  const sum = getTrackProgressSummary(trackId);

  const options = getActiveTrackIds();
  if (!options.includes(trackId)) options.push(trackId);
  let html = `<div class="board-header">
      <div class="section-title">Board</div>
      <select class="idea-input board-project-select" aria-label="Project" onchange="navigate('#board/' + this.value)">
        ${options.map(t => `<option value="${t}"${t === trackId ? ' selected' : ''}>${escapeHtml(getTrackLabel(t))}</option>`).join('')}
      </select>
      <button class="btn btn-outline btn-sm" onclick="navigate('#track/${trackId}')">Manage milestones</button>
    </div>`;

  if (!milestones.length) {
    el.innerHTML = html + `<p class="today-empty">This project has no milestones yet.</p>
      <button class="btn btn-primary" onclick="openQuickAdd({ kind: 'milestone', trackId: '${trackId}' })">${ICONS.plus} Add milestones</button>`;
    return;
  }

  const where = allDone
    ? 'You reached the finish!'
    : `You're on milestone ${curIdx + 1} of ${milestones.length}`;
  const pct = sum.blocksTotal ? Math.round((sum.blocksDone / sum.blocksTotal) * 100) : 0;
  html += `<div class="board-summary"><strong>${where}</strong> · ${sum.blocksDone} / ${sum.blocksTotal} blocks · ${pct}%</div>
    <div class="board-legend" aria-hidden="true" style="--candy:${color}">
      <span><span class="bb f"></span> block done</span>
      <span><span class="bb"></span> to do</span>
      <span><span class="bb x"></span> extra</span>
    </div>`;

  // Spaces snake back and forth: even rows run left → right, odd rows
  // right → left, so each row's last space sits above the next row's first.
  const cols = boardColumns();
  _boardCols = cols;
  const items = [{ kind: 'start' }, ...milestones.map((ms, i) => ({ kind: 'ms', ms, i })), { kind: 'finish' }];
  const reached = allDone ? items.length - 1 : curIdx + 1;
  const cell = (order) => {
    const row = Math.floor(order / cols);
    const pos = order % cols;
    return `grid-row:${row + 1};grid-column:${(row % 2 === 0 ? pos : cols - 1 - pos) + 1}`;
  };

  let spaces = '';
  items.forEach((it, order) => {
    if (it.kind === 'start') {
      spaces += `<div class="board-space board-end" data-board-order="${order}" style="${cell(order)}">
        <span class="board-end-icon" aria-hidden="true">${MILESTONE_ICONS.flag}</span><span class="board-end-label">Start</span>
      </div>`;
      return;
    }
    if (it.kind === 'finish') {
      spaces += `<div class="board-space board-end board-finish${allDone ? ' reached' : ''}" data-board-order="${order}" style="${cell(order)}">
        <span class="board-end-icon" aria-hidden="true">${MILESTONE_ICONS.trophy}</span><span class="board-end-label">${allDone ? 'Finished!' : 'Finish'}</span>
        ${allDone ? `<span class="board-token" style="background:${color}" aria-hidden="true"></span>` : ''}
      </div>`;
      return;
    }
    const { ms, i } = it;
    const done = getMilestoneState(ms.id).status === 'done';
    const current = i === curIdx;
    const groups = milestoneBlockGroups(ms.id);
    const est = groups.reduce((a, g) => a + g.est, 0);
    const filled = groups.reduce((a, g) => a + g.filled, 0);
    const due = state.dueDates[ms.id];
    const status = done ? 'done' : current ? 'current' : 'upcoming';
    const label = `Milestone ${i + 1} of ${milestones.length}: ${ms.title}. ${filled} of ${est} blocks.${done ? ' Done.' : current ? ' You are here.' : ''}`;
    spaces += `<div class="board-space board-ms ${status}" role="button" tabindex="0" data-board-order="${order}"
        style="${cell(order)};--candy:${BOARD_CANDY[i % BOARD_CANDY.length]}" aria-label="${escapeHtml(label)}"
        onclick="openBoardSpace('${trackId}','${ms.id}')">
      <div class="board-space-top">
        <span class="board-space-num">${i + 1}</span>
        ${done ? `<span class="board-space-badge">${ICONS.check}</span>` : current ? `<span class="board-here">You are here</span>` : ''}
      </div>
      <div class="board-space-title">${escapeHtml(ms.title)}</div>
      <div class="board-blocks" aria-hidden="true">${blockSquaresHtml(groups, BOARD_MAX_SQUARES)}</div>
      <div class="board-space-meta">${filled}/${est} blocks${due && !done ? ` · due ${escapeHtml(qaFormatDue(due))}` : ''}</div>
      ${current ? `<span class="board-token" style="background:${color}" aria-hidden="true"></span>` : ''}
    </div>`;
  });

  html += `<div class="board-wrap">
    <div class="board-grid" id="boardGrid" data-reached="${reached}" style="grid-template-columns:repeat(${cols}, minmax(0, 1fr));--road-trail:${color}">
      <svg class="board-road-svg" id="boardRoad" aria-hidden="true"></svg>
      ${spaces}
    </div>
  </div>`;
  el.innerHTML = html;
  // Free plan: show the real board, softened, under an unlock card.
  if (!hasFeature('board')) {
    const wrap = el.querySelector('.board-wrap');
    wrap.classList.add('pro-preview');
    wrap.insertAdjacentHTML('beforeend', proLockedCard('board', 'Watch each project as a road from Start to Finish: every milestone is a space, and its squares fill in as you do focus blocks.'));
  }

  // The road is drawn from the spaces' real positions, once they're laid
  // out, and redrawn whenever the board changes size.
  requestAnimationFrame(drawBoardRoad);
  if (_boardObserver) _boardObserver.disconnect();
  if (window.ResizeObserver) {
    _boardObserver = new ResizeObserver(() => drawBoardRoad());
    _boardObserver.observe(document.getElementById('boardGrid'));
  }
}

function drawBoardRoad() {
  const grid = document.getElementById('boardGrid');
  const svg = document.getElementById('boardRoad');
  if (!grid || !svg) return;
  const box = grid.getBoundingClientRect();
  if (!box.width) return;
  const pts = [...grid.querySelectorAll('[data-board-order]')]
    .sort((a, b) => a.dataset.boardOrder - b.dataset.boardOrder)
    .map(s => {
      const r = s.getBoundingClientRect();
      return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
    });
  const path = (list) => list.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const reached = Number(grid.dataset.reached || 0);
  svg.setAttribute('viewBox', `0 0 ${box.width.toFixed(1)} ${box.height.toFixed(1)}`);
  svg.setAttribute('width', box.width);
  svg.setAttribute('height', box.height);
  svg.innerHTML = `<path class="board-road" d="${path(pts)}"/>`
    + (reached > 0 ? `<path class="board-trail" d="${path(pts.slice(0, reached + 1))}"/>` : '')
    + `<path class="board-road-dash" d="${path(pts)}"/>`;
}

window.addEventListener('resize', () => {
  const view = document.getElementById('view-board');
  if (!view || !view.classList.contains('active')) return;
  if (boardColumns() !== _boardCols) renderBoard(_boardTrack);
});

// The drawer for one space: progress, the next block, and every step.
function openBoardSpace(trackId, milestoneId) {
  if (!hasFeature('board')) return showUpgrade('board');
  const ms = getMilestone(milestoneId);
  if (!ms) return;
  const milestones = getMilestonesForTrack(trackId);
  const idx = milestones.findIndex(m => m.id === milestoneId);
  const color = getTrackColor(trackId);
  const steps = getAllSteps(milestoneId);
  const groups = milestoneBlockGroups(milestoneId);
  const est = groups.reduce((a, g) => a + g.est, 0);
  const filled = groups.reduce((a, g) => a + g.filled, 0);
  const stepsDone = steps.filter(s => stepStatus(s.id) === 'done').length;
  const next = getActiveStep(milestoneId);

  let html = `<button class="drawer-close" onclick="closeDrawer()" aria-label="Close">${ICONS.x}</button>
    <h3>${escapeHtml(ms.title)}</h3>
    <div class="board-drawer-sub">Milestone ${idx + 1} of ${milestones.length} · ${stepsDone}/${steps.length} steps · ${filled}/${est} blocks</div>
    ${ms.desc ? `<p class="board-drawer-desc">${escapeHtml(ms.desc)}</p>` : ''}
    <div class="drawer-quick-actions">
      ${next ? `<button class="btn btn-primary" style="background:${color}" onclick="closeDrawer();navigate('#focus/${milestoneId}/${next.id}')">${ICONS.play} Start next block</button>` : ''}
      <button class="btn btn-outline" onclick="closeDrawer();navigate('#path/${trackId}/${milestoneId}')">Open milestone</button>
    </div>
    <div class="drawer-section-title">Steps</div>
    <ul class="board-step-list" style="--node-accent:${color};--candy:${color}">`;
  groups.forEach(g => {
    if (!g.step) {
      html += `<li class="board-step${g.done ? ' done' : ''}"><span class="board-step-qc">QC</span>
        <div class="board-step-main"><div class="board-step-title">${escapeHtml(g.label.replace(/^QC: /, ''))}</div>
        <div class="board-blocks">${blockSquaresHtml([g])}</div></div></li>`;
      return;
    }
    const s = g.step;
    html += `<li class="board-step${g.done ? ' done' : ''}">
      ${stepCheckHtml(milestoneId, s.id, g.done, `toggleBoardStep('${trackId}','${milestoneId}','${s.id}')`)}
      <div class="board-step-main" role="button" tabindex="0" onclick="openStepDrawer('${milestoneId}','${s.id}')">
        <div class="board-step-title">${escapeHtml(s.title)}</div>
        <div class="board-blocks">${blockSquaresHtml([g])}</div>
      </div>
      ${g.done ? '' : `<button type="button" class="today-act" title="Start focus" aria-label="Start focus" onclick="closeDrawer();navigate('#focus/${milestoneId}/${s.id}')">${ICONS.play}</button>`}
    </li>`;
  });
  html += `</ul>
    <button class="btn btn-outline btn-sm" style="margin-top:var(--sp-3)" onclick="closeDrawer();openQuickAdd({ kind: 'task', trackId: '${trackId}', milestoneId: '${milestoneId}' })">${ICONS.plus} Add steps</button>`;

  const drawer = document.getElementById('drawer');
  drawer.setAttribute('data-drawer-kind', 'board');
  drawer.innerHTML = html;
  document.getElementById('drawerOverlay').classList.add('open');
}

// Ticking a step inside the board drawer updates the board behind it and
// the drawer itself.
function toggleBoardStep(trackId, milestoneId, stepId) {
  toggleStepDone(milestoneId, stepId);
  openBoardSpace(trackId, milestoneId);
}

// Progress view: one link per active project's board.
function renderBoardLinks() {
  const tracks = getActiveTrackIds();
  if (!tracks.length) return '';
  return `<div class="board-links"><span class="board-links-label">Boards</span>
    ${tracks.map(t => {
      const s = getTrackProgressSummary(t);
      return `<button class="board-link" style="--pc:${getTrackColor(t)}" onclick="navigate('#board/${t}')">
        <span class="dot" style="background:${getTrackColor(t)}"></span>${escapeHtml(getTrackLabel(t))}<span class="board-link-count">${s.msDone}/${s.msTotal}</span>
      </button>`;
    }).join('')}
  </div>`;
}

// ================================================================
// FEATURE 19: INSTALL PROMPT
// ================================================================
// Installed web apps open in their own window and keep their data more
// reliably (Safari's 7-day storage cleanup skips Home Screen apps). From
// the second day of use, Home suggests installing; "Not now" hides it
// for 30 days.
const INSTALL_DISMISS_KEY = 'soma_install_dismissed';
const VISITS_KEY = 'soma_visit_days';
let _installEvent = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _installEvent = e;
  if ((window.location.hash || '#home').startsWith('#home')) renderHome();
});
window.addEventListener('appinstalled', () => {
  _installEvent = null;
  try { localStorage.setItem(INSTALL_DISMISS_KEY, 'installed'); } catch (e) { /* ignore */ }
});

// Counts distinct days the app was opened.
function countVisitDay() {
  try {
    const v = JSON.parse(localStorage.getItem(VISITS_KEY) || '{"days":0,"last":null}');
    if (v.last !== todayStr()) {
      v.days++;
      v.last = todayStr();
      localStorage.setItem(VISITS_KEY, JSON.stringify(v));
    }
    return v.days;
  } catch (e) { return 0; }
}

function isInstalledApp() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
}

// Browsers without an install event need instructions instead of a button.
function manualInstallHint() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'Tap the Share button, then “Add to Home Screen”.';
  if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua)) return 'In Safari’s menu bar, choose File → Add to Dock.';
  return null;
}

function renderInstallPrompt() {
  if (!location.protocol.startsWith('http') || isInstalledApp()) return '';
  let dismissed = null;
  try { dismissed = localStorage.getItem(INSTALL_DISMISS_KEY); } catch (e) { return ''; }
  if (dismissed === 'installed' || (dismissed && daysSince(dismissed) < 30)) return '';
  if (countVisitDay() < 2) return '';
  const hint = _installEvent ? null : manualInstallHint();
  if (!_installEvent && !hint) return '';
  return `<div class="backup-reminder install-prompt" role="status">
    <span>Install Soma as an app: it opens in its own window and keeps your plans safer.${hint ? ' ' + hint : ''}</span>
    <span class="backup-reminder-actions">
      ${_installEvent ? '<button class="btn btn-outline btn-sm" onclick="installApp()">Install</button>' : ''}
      <button class="btn btn-ghost btn-sm" onclick="dismissInstallPrompt()">Not now</button>
    </span>
  </div>`;
}

async function installApp() {
  if (!_installEvent) return;
  _installEvent.prompt();
  try {
    const choice = await _installEvent.userChoice;
    if (choice && choice.outcome === 'accepted') localStorage.setItem(INSTALL_DISMISS_KEY, 'installed');
  } catch (e) { /* ignore */ }
  _installEvent = null;
  renderHome();
}

function dismissInstallPrompt() {
  try { localStorage.setItem(INSTALL_DISMISS_KEY, todayStr()); } catch (e) { /* ignore */ }
  renderHome();
}

// ================================================================
// FEATURE 20: SOMA PRO (license key)
// ================================================================
// Product builds can reserve some features for paying customers. The
// edition's edition.json (copied into SOMA_PROFILE.edition by
// tools/build-edition.mjs) names the license provider, its IDs, and which
// features are Pro. With no licensing config, or one still holding
// YOUR-… placeholders, everything is unlocked (the personal site, and
// test builds). Core features (Quick Add, Today, the timer, export) are
// never gated.
//
// The check runs in the browser against the provider's public license
// endpoint, and the result is cached so Soma keeps working offline. It
// keeps honest people honest; it is not DRM.
const EDITION = PROFILE.edition || {};
const LICENSING = EDITION.licensing || null;
const LICENSE_STORE_KEY = 'soma_license';
const LICENSE_RECHECK_DAYS = 14;
const FREE_THEMES = ['rose-pine-dawn', 'catppuccin-mocha'];
const PRO_FEATURES = {
  unlimitedProjects: 'Unlimited projects',
  board: 'The Board',
  weeklyPlan: 'Weekly block planning',
  rewards: 'Rewards',
  aiPlanner: 'AI planning helpers',
  themes: 'All 9 themes',
  progressCharts: 'Progress charts'
};

// Licensing is on once the provider's own IDs are filled in (fields for
// the other provider are ignored).
function licensingActive() {
  if (!LICENSING || !LICENSING.provider) return false;
  const ids = LICENSING.provider === 'lemonsqueezy' ? [LICENSING.storeId] : [LICENSING.organizationId];
  return ids.every(v => v && !String(v).includes('YOUR-'));
}

function getLicense() {
  try { return JSON.parse(localStorage.getItem(LICENSE_STORE_KEY) || 'null'); } catch (e) { return null; }
}

function isPro() {
  if (!licensingActive()) return true;
  const lic = getLicense();
  return !!(lic && lic.valid);
}

// Is this feature available to the current user?
function hasFeature(feature) {
  if (!licensingActive() || !(LICENSING.proFeatures || []).includes(feature)) return true;
  return isPro();
}

function freeProjectLimit() {
  return (LICENSING && LICENSING.freeProjectLimit) || 3;
}

// Custom projects count toward the free limit; built-in examples don't.
function canCreateProjects(n = 1) {
  if (hasFeature('unlimitedProjects')) return true;
  const own = Object.values(state.customProjects || {}).filter(p => !p.archived).length;
  return own + n <= freeProjectLimit();
}

// Ask the provider whether a key is valid. Resolves { valid, reason };
// rejects on network trouble (so callers can keep a cached result).
async function checkLicenseKey(key) {
  if (LICENSING.provider === 'lemonsqueezy') {
    const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ license_key: key }).toString()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok && res.status >= 500) throw new Error('HTTP ' + res.status);
    const meta = data.meta || {};
    const status = data.license_key && data.license_key.status;
    if (!data.valid) return { valid: false, reason: 'That key wasn’t recognised.' };
    // A key from any other Lemon Squeezy store or product must not unlock Soma.
    if (String(meta.store_id) !== String(LICENSING.storeId)
      || (LICENSING.productId && String(meta.product_id) !== String(LICENSING.productId))) {
      return { valid: false, reason: 'That key is for a different product.' };
    }
    if (status === 'expired' || status === 'disabled') return { valid: false, reason: `This key is ${status}.` };
    return { valid: true };
  }
  // Polar (default): the customer-portal endpoint is meant for public clients.
  const base = LICENSING.apiBase || 'https://api.polar.sh';
  const res = await fetch(`${base}/v1/customer-portal/license-keys/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ key, organization_id: LICENSING.organizationId })
  });
  if (res.status === 404 || res.status === 422 || res.status === 400) return { valid: false, reason: 'That key wasn’t recognised.' };
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (data.status && data.status !== 'granted') return { valid: false, reason: `This key has been ${data.status}.` };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false, reason: 'This key has expired.' };
  return { valid: true };
}

async function activateLicense(key) {
  const clean = String(key || '').trim();
  if (!clean) return { valid: false, reason: 'Paste the license key from your purchase email.' };
  let result;
  try {
    result = await checkLicenseKey(clean);
  } catch (e) {
    return { valid: false, reason: 'Couldn’t reach the license server. Check your connection and try again.' };
  }
  if (result.valid) {
    try { localStorage.setItem(LICENSE_STORE_KEY, JSON.stringify({ key: clean, valid: true, checkedAt: todayStr() })); } catch (e) { /* ignore */ }
  }
  return result;
}

function removeLicense() {
  if (!confirm('Remove the Pro license from this device? You can paste the key again any time.')) return;
  try { localStorage.removeItem(LICENSE_STORE_KEY); } catch (e) { /* ignore */ }
  refreshCurrentView();
}

// Every couple of weeks, quietly re-check a stored key. Only a definite
// "no" from the provider locks Pro again; being offline never does.
async function recheckLicenseIfDue() {
  if (!licensingActive() || !navigator.onLine) return;
  const lic = getLicense();
  if (!lic || !lic.valid || daysSince(lic.checkedAt) < LICENSE_RECHECK_DAYS) return;
  try {
    const result = await checkLicenseKey(lic.key);
    if (result.valid) {
      lic.checkedAt = todayStr();
      localStorage.setItem(LICENSE_STORE_KEY, JSON.stringify(lic));
    } else {
      localStorage.setItem(LICENSE_STORE_KEY, JSON.stringify({ ...lic, valid: false, reason: result.reason }));
      qaToast('Your Soma Pro license is no longer active. ' + result.reason);
      refreshCurrentView();
    }
  } catch (e) { /* offline or provider down: keep the cached result */ }
}

// The upgrade dialog, shown when a Pro feature is used on the free plan.
function showUpgrade(feature) {
  const label = PRO_FEATURES[feature] || 'This';
  const list = (LICENSING.proFeatures || []).map(f => `<li>${escapeHtml(f === 'unlimitedProjects' ? `More than ${freeProjectLimit()} projects` : PRO_FEATURES[f] || f)}</li>`).join('');
  const overlay = openSmallModal('upgradeOverlay', `
    <div class="project-modal-title">Unlock ${escapeHtml(EDITION.productName || 'Soma')} Pro</div>
    <p class="modal-copy">${escapeHtml(feature === 'unlimitedProjects' ? `The free plan includes ${freeProjectLimit()} projects of your own.` : `${label} is part of Pro.`)}
      Pay once and keep it, including every 1.x update. No subscription.</p>
    <ul class="pro-list">${list}</ul>
    <label class="project-modal-field">
      <span>Already bought it? Paste your license key</span>
      <input type="text" id="licenseKeyInput" autocomplete="off" spellcheck="false" placeholder="License key from your purchase email">
    </label>
    <div class="license-msg" id="licenseMsg" role="status"></div>
    <div class="project-modal-actions">
      <button type="button" class="btn btn-outline" data-act="activate">Activate</button>
      ${EDITION.buyUrl ? `<a class="btn btn-primary" href="${escapeHtml(EDITION.buyUrl)}" target="_blank" rel="noopener">Get Pro${EDITION.priceLabel ? ' — ' + escapeHtml(EDITION.priceLabel) : ''}</a>` : ''}
    </div>`);
  const input = overlay.querySelector('#licenseKeyInput');
  const msg = overlay.querySelector('#licenseMsg');
  const activate = async () => {
    msg.textContent = 'Checking…';
    const result = await activateLicense(input.value);
    if (result.valid) {
      overlay.remove();
      qaToast('Soma Pro unlocked. Thank you for supporting it!');
      refreshCurrentView();
    } else {
      msg.textContent = result.reason;
    }
  };
  overlay.querySelector('[data-act="activate"]').addEventListener('click', activate);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); activate(); } });
  setTimeout(() => input.focus(), 30);
}

// Gate helper for buttons: runs `fn` if the feature is available,
// otherwise shows the upgrade dialog.
function withFeature(feature, fn) {
  if (hasFeature(feature)) return fn();
  showUpgrade(feature);
}

// A locked placeholder card for whole views or panels.
function proLockedCard(feature, blurb) {
  return `<div class="pro-locked" role="note">
    <div class="pro-locked-title">${escapeHtml(PRO_FEATURES[feature] || 'Pro feature')} <span class="pro-badge">Pro</span></div>
    <p class="pro-locked-copy">${escapeHtml(blurb)}</p>
    <button class="btn btn-primary btn-sm" onclick="showUpgrade('${feature}')">Unlock Pro</button>
  </div>`;
}

function renderProSettings() {
  if (!licensingActive()) return '';
  const lic = getLicense();
  if (isPro()) {
    const tail = lic && lic.key ? lic.key.slice(-4) : '';
    return `<div class="settings-group">
      <h4>${escapeHtml(EDITION.productName || 'Soma')} Pro</h4>
      <div class="setting-row"><span class="setting-label">Status</span><span class="setting-note">Active${tail ? ` · key ending ${escapeHtml(tail)}` : ''}</span></div>
      <button class="btn btn-ghost btn-sm" onclick="removeLicense()">Remove license from this device</button>
    </div>`;
  }
  return `<div class="settings-group">
    <h4>${escapeHtml(EDITION.productName || 'Soma')} Pro</h4>
    <p class="setting-note" style="text-align:left;margin-bottom:var(--sp-3)">You're on the free plan.${lic && lic.reason ? ' ' + escapeHtml(lic.reason) : ''}</p>
    <button class="btn btn-primary btn-sm" onclick="showUpgrade('board')">Unlock Pro or enter a key</button>
  </div>`;
}

// ================================================================
// FEATURE 13: QUICK ADD
// ================================================================
// One capture box for tasks, milestones, projects, ideas and admin,
// reachable from every view via the + button or the N key, so adding
// work never means drilling Projects → project → milestone first.
// Pasting several lines adds one item per line (brain dump). Optional
// per-line shortcuts: #project  ~3 (blocks)  ! / !! (urgency)  @fri (due).
// Every add can be undone from the toast.

const QA_KINDS = [
  { id: 'task',      label: 'Task',      noun: 'task',       placeholder: 'What needs doing? Paste a list to add several at once.' },
  { id: 'milestone', label: 'Milestone', noun: 'milestone',  placeholder: 'A checkpoint, e.g. "Finish first draft"' },
  { id: 'project',   label: 'Project',   noun: 'project',    placeholder: 'Project name' },
  { id: 'idea',      label: 'Idea',      noun: 'idea',       placeholder: 'Park a thought for later' },
  { id: 'admin',     label: 'Admin',     noun: 'admin task', placeholder: 'Email, form, errand…' }
];
const QA_NEW = '__new__';
const QA_LAST_KEY = 'soma_quickadd_last';
let qa = null; // selection state while the Quick Add modal is open

function qaCount(n, noun) { return `${n} ${noun}${n === 1 ? '' : 's'}`; }

// Where the user is decides the default destination.
function qaRouteContext() {
  const parts = (window.location.hash || '').slice(1).split('/');
  switch (parts[0]) {
    case 'track': return { trackId: parts[1] };
    case 'path': return { trackId: parts[1], milestoneId: parts[2] };
    case 'blocks': return { trackId: getTrackForMilestone(parts[1]), milestoneId: parts[1] };
    case 'focus': {
      const msId = parts[1] || timerMilestoneId;
      return msId ? { trackId: getTrackForMilestone(msId), milestoneId: msId } : {};
    }
    default: return {};
  }
}

// First milestone that isn't done yet — where new tasks land by default.
// null when there are none open (Quick Add then makes a fresh one).
function qaDefaultMilestone(trackId) {
  const ms = getMilestonesForTrack(trackId).find(m => getMilestoneState(m.id).status !== 'done');
  return ms ? ms.id : null;
}

function qaNormalize(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

// "#thesis" → the active project whose id or label, or any word of the
// label, starts with "thesis".
function qaMatchProject(token) {
  const tok = qaNormalize(token);
  if (!tok) return null;
  const tracks = getActiveTrackIds();
  return tracks.find(t => qaNormalize(t) === tok || qaNormalize(getTrackLabel(t)) === tok)
    || tracks.find(t => qaNormalize(getTrackLabel(t)).startsWith(tok)
      || getTrackLabel(t).split(/\s+/).some(w => qaNormalize(w).startsWith(tok)))
    || null;
}

function qaValidDate(y, mo, da) {
  const d = new Date(y, mo - 1, da);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
  return localDateStr(d);
}

// "today", "tomorrow", "nextweek", "fri", "2026-11-03", "11/3" → YYYY-MM-DD (or null).
// Weekdays mean the next one, counting today.
function qaParseDate(token) {
  const t = String(token).toLowerCase();
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (t === 'today' || t === 'tod') return localDateStr(d);
  if (t === 'tomorrow' || t === 'tom' || t === 'tmr') { d.setDate(d.getDate() + 1); return localDateStr(d); }
  // Next Monday, same as the "Next week" reschedule button.
  if (t === 'nextweek' || t === 'next-week' || t === 'nw') { d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7)); return localDateStr(d); }
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const wd = t.length >= 3 ? weekdays.findIndex(w => w.startsWith(t)) : -1;
  if (wd >= 0) { d.setDate(d.getDate() + ((wd - d.getDay() + 7) % 7)); return localDateStr(d); }
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return qaValidDate(+m[1], +m[2], +m[3]);
  m = t.match(/^(\d{1,2})[\/.](\d{1,2})$/);
  if (m) {
    const thisYear = qaValidDate(d.getFullYear(), +m[1], +m[2]);
    if (thisYear && thisYear < localDateStr(d)) return qaValidDate(d.getFullYear() + 1, +m[1], +m[2]);
    return thisYear;
  }
  return null;
}

// Strip list bullets/checkboxes from pasted lists, then pull out inline
// shortcuts. Tokens that don't resolve (e.g. "#12" when no project
// matches) stay in the title untouched.
function qaParseLine(line) {
  const out = { title: '', trackId: null, blocks: null, urgency: null, due: null };
  let text = ' ' + line.replace(/^\s*(?:(?:[-*•–]|\d+[.)])\s+)?(?:\[[ xX]?\]\s*)?/, '') + ' ';
  text = text.replace(/\s~(\d{1,2})(?=\s)/, (m, n) => {
    out.blocks = Math.min(20, Math.max(1, +n));
    return ' ';
  });
  text = text.replace(/\s(!!|!(?:critical|crit|high|urgent)|!(?:important|imp)?)(?=\s)/i, (m, tok) => {
    out.urgency = (tok === '!!' || /crit|high|urgent/i.test(tok)) ? 'critical' : 'important';
    return ' ';
  });
  text = text.replace(/\s@([\w\/.-]+)(?=\s)/, (m, tok) => {
    const due = qaParseDate(tok);
    if (!due) return m;
    out.due = due;
    return ' ';
  });
  text = text.replace(/\s#([\w-]+)(?=\s)/, (m, tok) => {
    const t = qaMatchProject(tok);
    if (!t) return m;
    out.trackId = t;
    return ' ';
  });
  out.title = text.replace(/\s+/g, ' ').trim();
  return out;
}

function qaFormatDue(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function qaLines() {
  const el = document.getElementById('qaText');
  return (el ? el.value : '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

// opts: { kind, trackId, milestoneId, text, onAdded, note,
//         today (pick new tasks for Today), insertAfter (stepId to place
//         new tasks right after, in the same milestone) }
function openQuickAdd(opts = {}) {
  const returnFocus = document.activeElement;
  closeQuickAdd();
  const ctx = qaRouteContext();
  const active = getActiveTrackIds();
  const explicit = opts.trackId || ctx.trackId;
  // An archived project can still be the target when the user is looking
  // right at it; it's just not offered otherwise.
  const extraTrack = explicit && !active.includes(explicit) && getAllTrackIds().includes(explicit) ? explicit : null;
  let remembered = null;
  try { remembered = localStorage.getItem(QA_LAST_KEY); } catch (e) { /* ignore */ }
  const trackId = [explicit, remembered, (state.weeklyPlan.focusProjects || [])[0], active[0]]
    .find(t => t && (active.includes(t) || t === extraTrack)) || QA_NEW;
  let milestoneId = opts.milestoneId || (ctx.trackId === trackId ? ctx.milestoneId : null);
  if (!milestoneId || trackId === QA_NEW || getTrackForMilestone(milestoneId) !== trackId) {
    milestoneId = trackId === QA_NEW ? null : qaDefaultMilestone(trackId);
  }

  qa = {
    kind: opts.kind || (timerRunning ? 'idea' : 'task'),
    trackId,
    milestoneId: milestoneId || QA_NEW,
    extraTrack,
    blocks: 1,
    urgency: null,
    due: '',
    newProjectName: '',
    newMilestoneName: '',
    note: opts.note || (opts.today ? 'These go on today’s list.' : ''),
    today: !!opts.today,
    insertAfter: opts.insertAfter || null,
    onAdded: opts.onAdded || null,
    returnFocus
  };

  const overlay = document.createElement('div');
  overlay.id = 'qaOverlay';
  overlay.className = 'project-modal-overlay qa-overlay';
  overlay.innerHTML = `
    <div class="project-modal qa-modal" role="dialog" aria-modal="true" aria-labelledby="qaTitle">
      <div class="qa-head">
        <div class="project-modal-title" id="qaTitle">Quick add</div>
        <button type="button" class="btn btn-ghost qa-close" id="qaClose" aria-label="Close">${ICONS.x}</button>
      </div>
      <div class="qa-kinds" role="radiogroup" aria-label="What are you adding?">
        ${QA_KINDS.map(k => `<button type="button" class="qa-kind" role="radio" data-kind="${k.id}">${k.label}</button>`).join('')}
      </div>
      <div class="qa-note" id="qaNote" hidden></div>
      <textarea id="qaText" class="qa-text" rows="2" aria-label="Title"></textarea>
      <div id="qaFields"></div>
      <div id="qaPreview" class="qa-preview" aria-live="polite"></div>
      <div class="qa-foot">
        <span class="qa-hint"><kbd>Enter</kbd> add · <kbd>Shift</kbd>+<kbd>Enter</kbd> new line · <kbd>Esc</kbd> close</span>
        <button type="button" class="btn btn-primary" id="qaSubmit">Add</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const text = overlay.querySelector('#qaText');
  if (opts.text) text.value = opts.text;

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeQuickAdd(); });
  // Esc closes only this modal, not a drawer underneath it.
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') { e.stopPropagation(); closeQuickAdd(); }
  });
  overlay.querySelector('#qaClose').addEventListener('click', closeQuickAdd);
  overlay.querySelector('#qaSubmit').addEventListener('click', qaSubmit);
  overlay.querySelectorAll('.qa-kind').forEach(btn => {
    btn.addEventListener('click', () => {
      qa.kind = btn.dataset.kind;
      qa.note = '';
      qaRender();
      text.focus();
    });
  });
  text.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); qaSubmit(); }
  });
  text.addEventListener('input', () => { qaAutoGrow(text); qaRenderPreview(); });

  // Fields are re-rendered on every project/kind change, so listen once
  // on the container instead of rebinding each time.
  const fields = overlay.querySelector('#qaFields');
  fields.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'qaProject') {
      qa.trackId = t.value;
      qa.milestoneId = t.value === QA_NEW ? QA_NEW : (qaDefaultMilestone(t.value) || QA_NEW);
      qaRender();
    } else if (t.id === 'qaMilestone') {
      qa.milestoneId = t.value;
      qaRender();
    } else if (t.id === 'qaDue') {
      qa.due = t.value;
      qaRenderPreview();
    }
  });
  fields.addEventListener('input', (e) => {
    if (e.target.id === 'qaNewProject') qa.newProjectName = e.target.value;
    if (e.target.id === 'qaNewMilestone') qa.newMilestoneName = e.target.value;
  });
  fields.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input[type="text"]')) { e.preventDefault(); qaSubmit(); }
  });
  fields.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (step) {
      qa.blocks = Math.min(20, Math.max(1, qa.blocks + parseInt(step.dataset.step, 10)));
      const val = document.getElementById('qaBlocksVal');
      if (val) val.textContent = qa.blocks;
      qaRenderPreview();
      return;
    }
    const chip = e.target.closest('[data-urgency]');
    if (chip) {
      qa.urgency = chip.dataset.urgency || null;
      fields.querySelectorAll('[data-urgency]').forEach(c => c.classList.toggle('active', c === chip));
      qaRenderPreview();
    }
  });

  qaRender();
  qaAutoGrow(text);
  setTimeout(() => { text.focus(); text.setSelectionRange(text.value.length, text.value.length); }, 30);
}

function closeQuickAdd() {
  const overlay = document.getElementById('qaOverlay');
  if (overlay) overlay.remove();
  if (qa && qa.returnFocus && document.contains(qa.returnFocus)) {
    try { qa.returnFocus.focus(); } catch (e) { /* ignore */ }
  }
  qa = null;
}

function qaAutoGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 240) + 'px';
}

function qaRender() {
  const overlay = document.getElementById('qaOverlay');
  if (!overlay || !qa) return;
  const kind = QA_KINDS.find(k => k.id === qa.kind);
  overlay.querySelectorAll('.qa-kind').forEach(btn => {
    const on = btn.dataset.kind === qa.kind;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  overlay.querySelector('#qaText').placeholder = kind.placeholder;
  const note = overlay.querySelector('#qaNote');
  note.hidden = !qa.note;
  note.textContent = qa.note;
  overlay.querySelector('#qaFields').innerHTML = qaFieldsHtml();
  qaRenderPreview();
}

function qaProjectSelectHtml() {
  const tracks = getActiveTrackIds();
  if (qa.extraTrack) tracks.push(qa.extraTrack);
  const opts = tracks.map(t =>
    `<option value="${t}"${t === qa.trackId ? ' selected' : ''}>${escapeHtml(getTrackLabel(t))}${isTrackActive(t) ? '' : ' (archived)'}</option>`
  ).join('');
  return `<label class="qa-field"><span>Project</span>
    <select id="qaProject" class="idea-input">${opts}<option value="${QA_NEW}"${qa.trackId === QA_NEW ? ' selected' : ''}>+ New project…</option></select>
  </label>`;
}

function qaMilestoneSelectHtml() {
  let opts = '';
  if (qa.trackId !== QA_NEW) {
    opts = getMilestonesForTrack(qa.trackId).map(m => {
      const done = getMilestoneState(m.id).status === 'done';
      return `<option value="${m.id}"${m.id === qa.milestoneId ? ' selected' : ''}>${escapeHtml(m.title)}${done ? ' ✓' : ''}</option>`;
    }).join('');
  }
  return `<label class="qa-field"><span>Milestone</span>
    <select id="qaMilestone" class="idea-input">${opts}<option value="${QA_NEW}"${qa.milestoneId === QA_NEW ? ' selected' : ''}>+ New milestone…</option></select>
  </label>`;
}

function qaFieldsHtml() {
  const k = qa.kind;
  if (k === 'idea') {
    return `<p class="qa-help">${timerRunning
      ? 'Parked in Ideas, so you can get straight back to your block.'
      : 'Saved to Ideas. Turn it into a task whenever you’re ready.'}</p>`;
  }
  if (k === 'admin') return `<p class="qa-help">Small chores live in Admin, capped at 2 a day so they don’t eat your focus time.</p>`;
  if (k === 'project') return `<p class="qa-help">One project per line. Add one and you can give it tasks straight away.</p>`;

  const dueField = `<label class="qa-field"><span>Due</span><input type="date" id="qaDue" class="drawer-due-date" value="${qa.due || ''}"></label>`;
  let html = `<div class="qa-row">${qaProjectSelectHtml()}${k === 'task' ? qaMilestoneSelectHtml() : dueField}</div>`;
  if (qa.trackId === QA_NEW) {
    html += `<label class="qa-field qa-field-wide"><span>New project name</span>
      <input type="text" id="qaNewProject" class="idea-input" maxlength="60" value="${escapeHtml(qa.newProjectName)}" placeholder="e.g. Side business">
    </label>`;
  }
  if (k !== 'task') return html;

  if (qa.milestoneId === QA_NEW) {
    html += `<label class="qa-field qa-field-wide"><span>New milestone name</span>
      <input type="text" id="qaNewMilestone" class="idea-input" maxlength="80" value="${escapeHtml(qa.newMilestoneName)}" placeholder="Tasks">
    </label>`;
  }
  const mins = state.settings.blockDurationMin || 90;
  const urgencyChips = [[null, 'None'], ['important', 'Important'], ['critical', 'Critical']].map(([v, l]) =>
    `<button type="button" class="qa-chip${qa.urgency === v ? ' active' : ''}" data-urgency="${v || ''}">${v ? `<span class="urgency-dot ${v}"></span>` : ''}${l}</button>`
  ).join('');
  html += `<div class="qa-row">
      <div class="qa-field qa-field-fit"><span>Focus blocks</span>
        <div class="qa-stepper" title="${mins} min each">
          <button type="button" class="qa-step" data-step="-1" aria-label="Fewer blocks">−</button>
          <span class="qa-step-val" id="qaBlocksVal">${qa.blocks}</span>
          <button type="button" class="qa-step" data-step="1" aria-label="More blocks">+</button>
        </div>
      </div>
      <div class="qa-field qa-field-fit"><span>Urgency</span><div class="qa-chips">${urgencyChips}</div></div>
      ${dueField}
    </div>
    <div class="qa-tips">Per-line shortcuts: <code>#project</code> <code>~2</code> blocks <code>!</code> important <code>!!</code> critical <code>@fri</code> due</div>`;
  return html;
}

function qaRenderPreview() {
  const el = document.getElementById('qaPreview');
  const submit = document.getElementById('qaSubmit');
  if (!el || !submit || !qa) return;
  const kind = QA_KINDS.find(k => k.id === qa.kind);
  const lines = qaLines();
  submit.textContent = lines.length > 1 ? `Add ${qaCount(lines.length, kind.noun)}` : `Add ${kind.noun}`;
  if (qa.kind !== 'task') {
    el.innerHTML = lines.length > 1 ? `<div class="qa-preview-count">${qaCount(lines.length, kind.noun)}, one per line</div>` : '';
    return;
  }
  // Only worth showing once it says something the fields don't: several
  // lines, or a line using shortcuts.
  const parsed = lines.map(qaParseLine).filter(p => p.title);
  if (!(parsed.length > 1 || parsed.some(p => p.trackId || p.blocks || p.urgency || p.due))) {
    el.innerHTML = '';
    return;
  }
  const rows = parsed.slice(0, 8).map(p => {
    const bits = [];
    if (p.trackId) bits.push(`<span class="qa-pv-proj" style="--pv:${getTrackColor(p.trackId)}">${escapeHtml(getTrackLabel(p.trackId))}</span>`);
    const blocks = p.blocks || qa.blocks;
    bits.push(qaCount(blocks, 'block'));
    const urg = p.urgency || qa.urgency;
    if (urg) bits.push(`<span class="urgency-dot ${urg}"></span>${urg}`);
    const due = p.due || qa.due;
    if (due) bits.push('due ' + escapeHtml(qaFormatDue(due)));
    return `<li><span class="qa-pv-title">${escapeHtml(p.title)}</span><span class="qa-pv-meta">${bits.join(' · ')}</span></li>`;
  }).join('');
  const more = parsed.length > 8 ? `<li class="qa-pv-more">+ ${parsed.length - 8} more</li>` : '';
  el.innerHTML = `<ul class="qa-preview-list">${rows}${more}</ul>`;
}

// Applies the add to `state` (unsaved). Returns
// { message, view, trackId, continueWith } or null when nothing was added
// or a required field is missing — qaSubmit rolls state back on null.
function qaApply(lines) {
  const kind = qa.kind;
  if (kind === 'idea') {
    lines.forEach(text => state.ideas.push({ id: makeId('idea-'), text, createdAt: Date.now(), promoted: false }));
    return { message: `${qaCount(lines.length, 'idea')} parked in Ideas`, view: '#ideas' };
  }
  if (kind === 'admin') {
    if (!state.adminTasks) state.adminTasks = [];
    lines.forEach(text => state.adminTasks.push({ id: makeId('admin-'), text, createdAt: localDateStr(new Date()), completedDate: null }));
    return { message: `${qaCount(lines.length, 'admin task')} added`, view: '#admin' };
  }
  if (kind === 'project') {
    if (!canCreateProjects(lines.length)) { showUpgrade('unlimitedProjects'); return null; }
    const ids = lines.map(label => createProject({ label: label.slice(0, 60) }));
    const one = ids.length === 1;
    return {
      message: one ? `Created ${getTrackLabel(ids[0])}` : `Created ${qaCount(ids.length, 'project')}`,
      view: one ? `#track/${ids[0]}` : '#projects',
      trackId: one ? ids[0] : null,
      continueWith: one ? ids[0] : null
    };
  }

  // Tasks and milestones both need a project.
  let trackId = qa.trackId;
  if (trackId === QA_NEW) {
    const name = qa.newProjectName.trim();
    if (!name) {
      const input = document.getElementById('qaNewProject');
      if (input) input.focus();
      return null;
    }
    if (!canCreateProjects()) { showUpgrade('unlimitedProjects'); return null; }
    trackId = createProject({ label: name });
  }

  if (kind === 'milestone') {
    lines.forEach(title => {
      const id = createMilestone(trackId, title);
      if (qa.due) state.dueDates[id] = qa.due;
    });
    return { message: `${qaCount(lines.length, 'milestone')} added to ${getTrackLabel(trackId)}`, view: `#track/${trackId}`, trackId };
  }

  let milestoneId = qa.trackId === trackId ? qa.milestoneId : QA_NEW;
  if (milestoneId === QA_NEW) milestoneId = createMilestone(trackId, qa.newMilestoneName.trim() || 'Tasks');
  // Lines tagged with another #project go to that project's open
  // milestone, created on first use.
  const otherTargets = {};
  const placed = new Map(); // "track/milestone" → new step ids
  for (const line of lines) {
    const p = qaParseLine(line);
    if (!p.title) continue;
    let t = trackId;
    let m = milestoneId;
    if (p.trackId && p.trackId !== trackId) {
      t = p.trackId;
      m = otherTargets[t] || (otherTargets[t] = qaDefaultMilestone(t) || createMilestone(t, 'Tasks'));
    }
    const stepId = createStep(t, m, {
      title: p.title,
      estimated_blocks: p.blocks || qa.blocks,
      urgency: p.urgency || qa.urgency,
      due: p.due || qa.due
    });
    if (!stepId) continue;
    if (!placed.has(t + '/' + m)) placed.set(t + '/' + m, []);
    placed.get(t + '/' + m).push(stepId);
    if (qa.today) setTodayPick(stepId, m, true);
  }
  const total = [...placed.values()].reduce((a, ids) => a + ids.length, 0);
  if (!total) return null;
  // Break-it-down: the new steps follow the step they came from.
  const sameMs = placed.get(trackId + '/' + milestoneId);
  if (qa.insertAfter && sameMs) placeStepsAfter(milestoneId, qa.insertAfter, sameMs);
  const [firstKey] = placed.keys();
  const [ft, fm] = firstKey.split('/');
  const msTitle = (getMilestone(fm) || {}).title || '';
  const message = placed.size === 1
    ? `Added ${qaCount(total, 'task')} to ${getTrackLabel(ft)} › ${msTitle}`
    : `Added ${qaCount(total, 'task')} across ${placed.size} milestones`;
  return { message, view: `#path/${ft}/${fm}`, trackId };
}

// Move `ids` to sit right after `anchorId` in a milestone's step order
// (a pure stepOrder overlay, like moveStep).
function placeStepsAfter(milestoneId, anchorId, ids) {
  const order = getAllStepsRaw(milestoneId).map(s => s.id).filter(id => !ids.includes(id));
  const at = order.indexOf(anchorId);
  if (at < 0) return;
  order.splice(at + 1, 0, ...ids);
  if (!state.stepOrder) state.stepOrder = {};
  state.stepOrder[milestoneId] = order;
}

// Re-render whatever is on screen so new items show up. The focus view is
// left alone: re-rendering it can re-pick the queued step mid-block.
function refreshCurrentView() {
  if ((window.location.hash || '').startsWith('#focus')) return;
  handleRoute();
}

function qaSubmit() {
  if (!qa) return;
  const lines = qaLines();
  if (!lines.length) { document.getElementById('qaText').focus(); return; }
  const snapshot = JSON.stringify(state);
  let result = null;
  try {
    result = qaApply(lines);
  } catch (e) {
    console.warn('Quick add failed', e);
  }
  if (!result) { state = JSON.parse(snapshot); return; }
  if (qa.onAdded) { qa.onAdded(); qa.onAdded = null; }
  saveState();
  if (result.trackId) {
    try { localStorage.setItem(QA_LAST_KEY, result.trackId); } catch (e) { /* ignore */ }
  }

  qaToast(result.message, { view: result.view, snapshot });
  if (result.continueWith) {
    // A brand-new project is empty; roll straight into adding its tasks.
    Object.assign(qa, {
      kind: 'task', trackId: result.continueWith, milestoneId: QA_NEW,
      newMilestoneName: '', note: `${getTrackLabel(result.continueWith)} is ready. What are its first tasks?`
    });
    const text = document.getElementById('qaText');
    text.value = '';
    qaAutoGrow(text);
    qaRender();
    text.focus();
    refreshCurrentView();
    return;
  }
  closeQuickAdd();
  refreshCurrentView();
}

function qaToast(message, { view, snapshot, viewLabel } = {}) {
  document.querySelectorAll('.qa-toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'qa-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<span class="qa-toast-msg">${escapeHtml(message)}</span>
    ${view ? `<button type="button" class="qa-toast-btn" data-act="view">${escapeHtml(viewLabel || 'View')}</button>` : ''}
    ${snapshot ? '<button type="button" class="qa-toast-btn" data-act="undo">Undo</button>' : ''}`;
  document.body.appendChild(toast);
  const timer = setTimeout(() => toast.remove(), 7000);
  toast.addEventListener('click', (e) => {
    const act = e.target.dataset && e.target.dataset.act;
    if (!act) return;
    clearTimeout(timer);
    toast.remove();
    if (act === 'view') {
      closeQuickAdd();
      navigate(view);
    } else if (act === 'undo') {
      closeQuickAdd();
      state = JSON.parse(snapshot);
      saveState();
      refreshCurrentView();
      qaToast('Undone');
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'n' && e.key !== 'N') return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
  if (document.getElementById('qaOverlay') || document.getElementById('projectModalOverlay') || document.querySelector('.small-modal-overlay')) return;
  const t = e.target;
  if (t && t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
  e.preventDefault();
  openQuickAdd();
});

// ================================================================
// FEATURE 12: EXPORT / IMPORT
// ================================================================

// Everything lives in this browser's localStorage, which a cleared cache
// (or Safari's 7-day eviction for sites not added to the Home Screen) can
// wipe. Ask the browser to keep it, and nudge for a backup file weekly.
const BACKUP_KEY = 'soma_last_backup';
const BACKUP_SNOOZE_KEY = 'soma_backup_snooze';
const BACKUP_INTERVAL_DAYS = 7;

function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); }).catch(() => {});
    }
  } catch (e) { /* unsupported */ }
}

function hasUserData() {
  return state.focusLog.length > 0
    || Object.keys(state.customProjects || {}).length > 0
    || Object.values(state.customSteps || {}).some(a => a.length > 0)
    || Object.entries(state.steps || {}).some(([id, s]) =>
      s.status === 'done' && !((PROFILE.seedDone && PROFILE.seedDone.steps) || []).includes(id));
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return (new Date(todayStr() + 'T00:00:00') - new Date(dateStr + 'T00:00:00')) / 86400000;
}

function isBackupDue() {
  if (getGithubToken() || !hasUserData()) return false;
  let last = null, snooze = null;
  try { last = localStorage.getItem(BACKUP_KEY); snooze = localStorage.getItem(BACKUP_SNOOZE_KEY); } catch (e) { return false; }
  return daysSince(last) >= BACKUP_INTERVAL_DAYS && daysSince(snooze) >= BACKUP_INTERVAL_DAYS;
}

function renderBackupReminder() {
  if (!isBackupDue()) return '';
  return `<div class="backup-reminder" role="status">
    <span>Your plans live only in this browser. Save a backup file so clearing your browser can't erase them.</span>
    <span class="backup-reminder-actions">
      <button class="btn btn-outline btn-sm" onclick="exportData(); renderHome();">Back up now</button>
      <button class="btn btn-ghost btn-sm" onclick="snoozeBackupReminder()">Later</button>
    </span>
  </div>`;
}

function snoozeBackupReminder() {
  try { localStorage.setItem(BACKUP_SNOOZE_KEY, todayStr()); } catch (e) { /* ignore */ }
  renderHome();
}

function exportData() {
  try { localStorage.setItem(BACKUP_KEY, todayStr()); } catch (e) { /* ignore */ }
  const json = JSON.stringify(state, null, 2);
  const today = localDateStr(new Date());
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

// Round 2 Task C: Esc key closes any open drawer. Modals sit above the
// drawer, so they close first (even before focus has moved into them).
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Esc') {
    const small = document.querySelector('.small-modal-overlay');
    if (small) { small.remove(); return; }
    if (document.getElementById('qaOverlay')) { closeQuickAdd(); return; }
    if (document.getElementById('projectModalOverlay')) { _closeProjectModal(); return; }
    const overlay = document.getElementById('drawerOverlay');
    if (overlay && overlay.classList.contains('open')) {
      closeDrawer();
    }
  }
});

// Clickable cards are divs with role="button"; make Enter and Space work
// on them like a real button when they have keyboard focus.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const t = e.target;
  if (!t || t.getAttribute('role') !== 'button' || /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
  e.preventDefault();
  t.click();
});

// Hash change
window.addEventListener('hashchange', handleRoute);

// Feature 13: Quick add button (the N shortcut is bound with the feature).
const quickAddFab = document.getElementById('quickAddFab');
if (quickAddFab) quickAddFab.addEventListener('click', () => openQuickAdd());

// Round 5: Weekly plan rollover runs inside loadState(). This hook remains
// as a safety net to catch the (rare) case where the module was imported
// before midnight but rendering happens after the week boundary.
(function () {
  try { maybeRolloverWeeklyPlan(); } catch (e) { console.warn('Rollover error', e); }
})();

// Phase 1a: restore any in-flight timer block before the first render so
// the timer pill / focus view show the correct elapsed time immediately.
loadTimerFromStorage();
if (getBreak()) runBreakTicker();
requestPersistentStorage();
recheckLicenseIfDue();
// Product builds work offline once loaded (sw.js). Service workers need
// http(s), so this is skipped when index.html is opened from disk.
if (PROFILE.offline && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(e => console.warn('Offline support unavailable', e));
}

// Init
handleRoute();
updateTimerPill();
// Pull latest state from GitHub on startup (merges remote → local, then re-renders)
if (getGithubToken()) {
  pullStateFromGitHub().then(() => { handleRoute(); updateSyncBadge(); });
}
