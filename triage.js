// ============================================================
// TRIAGE SYSTEM — Flow-Based Block Tracking + Lead Times
// Loaded on all pages after app.js + data.js
// ============================================================

// ---- COGNITIVE TYPE MAPPING ----
// Derived from step.type — keeps data.js untouched
const COGNITIVE_TYPE_MAP = {
  'code':       'deep',
  'figure':     'deep',
  'writing':    'deep',
  'validation': 'deep',
  'learning':   'medium',
  'wetlab':     'lab',
  'setup':      'medium',
  'career':     'medium',
  'admin':      'admin',
};
const COGNITIVE_TYPE_EMOJI = {
  'deep':      '🔴',
  'medium':    '🟡',
  'admin':     '🟢',
  'lab':       '🔵',
  'delegated': '⬜',
};
const COGNITIVE_TYPE_LABEL = {
  'deep':      'Deep Work',
  'medium':    'Medium',
  'admin':     'Admin',
  'lab':       'Bench',
  'delegated': 'Delegated',
};
function getStepCognitiveType(step) {
  if (step.cognitive_type) return step.cognitive_type;
  return COGNITIVE_TYPE_MAP[step.type] || 'deep';
}

// ---- DEFAULT COMPUTE LEAD HOURS ----
// Derived from step titles — keeps data.js untouched
const STEP_LEAD_HOURS_DEFAULT = {
  // Flagship: decoding
  'f-decoding-1': 4, 'f-decoding-2': 8, 'f-decoding-3': 4, 'f-decoding-4': 4,
  // Flagship: segmentation
  'f-seg-3': 12,
  // Flagship: cell typing
  'f-ct-1': 24, 'f-ct-2': 8, 'f-ct-3': 8,
  // Flagship: DEG
  'f-deg-1': 12, 'f-deg-2': 6, 'f-deg-3': 8,
  // Flagship: spatial
  'f-sd-1': 16, 'f-sd-2': 12,
  // Methods: EEF2
  'm-eef2-2': 6, 'm-eef2-5': 72,
  // Methods: DAPI
  'm-dapi-4': 72,
  // Methods: assortativity
  'm-ass-1': 8, 'm-ass-3': 6, 'm-ass-5': 72,
  // Methods: CONCORD SAE
  'm-conc-1': 24, 'm-conc-2': 18,
  // Network: SIR
  'n-sir-2': 16, 'n-sir-5': 72,
  // Network: motif
  'n-mot-2': 12,
  // Network: VEN IF validation
  'n-ven-3': 72,
  // Package: pipeline steps
  'pkg-de-3': 8,
  // Learning: toy decoder
  'l-sf-2': 12,
};

// Title-based fallback (for steps not in ID map)
function inferLeadHrsFromTitle(title) {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes('decoder') || t.includes('decoding') || t.includes('decode')) return 24;
  if (t.includes('slurm') || t.includes('hpc') || t.includes('snakemake')) return 8;
  if (t.includes('if staining') || t.includes('immunofluorescence') || t.includes('if validation')) return 72;
  if (t.includes('imaging') && (t.includes('auto') || t.includes('seqfish'))) return 12;
  return null;
}

function getStepLeadHrs(step) {
  const saved = getStepTriageData(step.milestoneId || '', step.id);
  if (saved.compute_lead_hrs) return saved.compute_lead_hrs;
  return STEP_LEAD_HOURS_DEFAULT[step.id] ?? inferLeadHrsFromTitle(step.title) ?? null;
}

// ---- TRIAGE STATE ----
function getTriageState() {
  try { return JSON.parse(localStorage.getItem('triage_state_v1') || '{}'); } catch(e) { return {}; }
}
function saveTriageState(s) {
  try { localStorage.setItem('triage_state_v1', JSON.stringify(s)); } catch(e) {}
}
function getStepTriageData(milestoneId, stepId) {
  const s = getTriageState();
  return (s[milestoneId] && s[milestoneId][stepId]) ? s[milestoneId][stepId] : {};
}
function saveStepTriageData(milestoneId, stepId, data) {
  const s = getTriageState();
  if (!s[milestoneId]) s[milestoneId] = {};
  s[milestoneId][stepId] = { ...s[milestoneId][stepId], ...data };
  saveTriageState(s);
}
function getMilestoneTriageData(milestoneId) {
  const s = getTriageState();
  return s['__milestone__' + milestoneId] || { phd_critical: true };
}
function saveMilestoneTriageData(milestoneId, data) {
  const s = getTriageState();
  s['__milestone__' + milestoneId] = { ...getMilestoneTriageData(milestoneId), ...data };
  saveTriageState(s);
}

// ---- DAILY BLOCK STATE ----
// { date, completed_blocks, carried_in, carried_out, completed_types[], flex_used }
function getTodayBlockState() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const s = JSON.parse(localStorage.getItem('block_state_v1') || '{}');
    if (s.date === today) return s;
  } catch(e) {}
  // New day — carry forward from yesterday
  return initTodayBlockState();
}
function initTodayBlockState() {
  const today = new Date().toISOString().split('T')[0];
  const yest = getYesterdayBlockState();
  const deficit = Math.max(0, (yest.target_blocks || 3) - (yest.completed_blocks || 0));
  // Cap carry-in: use flex buffer first
  const flexLeft = Math.max(0, 2 - (yest.flex_used || 0));
  const absorbed = Math.min(deficit, flexLeft);
  const carriedIn = deficit - absorbed;
  const state = {
    date: today,
    completed_blocks: 0,
    carried_in: Math.min(carriedIn, 1), // max 1 carry-in per day
    carried_out: 0,
    target_blocks: 3,
    is_lab_day: false,
    flex_used: 0,
    completed_step_ids: [],
  };
  saveBlockState(state);
  return state;
}
function getYesterdayBlockState() {
  try {
    const all = JSON.parse(localStorage.getItem('block_history_v1') || '[]');
    return all[all.length - 1] || {};
  } catch(e) { return {}; }
}
function saveBlockState(s) {
  try { localStorage.setItem('block_state_v1', JSON.stringify(s)); } catch(e) {}
}
function archiveTodayBlock(state) {
  try {
    const hist = JSON.parse(localStorage.getItem('block_history_v1') || '[]');
    const existing = hist.findIndex(h => h.date === state.date);
    if (existing >= 0) hist[existing] = state; else hist.push(state);
    // Keep 90 days
    if (hist.length > 90) hist.splice(0, hist.length - 90);
    localStorage.setItem('block_history_v1', JSON.stringify(hist));
  } catch(e) {}
}
function getBlockHistory(days) {
  try {
    const hist = JSON.parse(localStorage.getItem('block_history_v1') || '[]');
    return hist.slice(-days);
  } catch(e) { return []; }
}
function completeBlock(stepId, milestoneId, cogType) {
  const s = getTodayBlockState();
  if (!s.completed_step_ids) s.completed_step_ids = [];
  if (!s.completed_step_ids.includes(stepId)) {
    s.completed_blocks = (s.completed_blocks || 0) + 1;
    s.completed_step_ids.push(stepId);
  }
  saveBlockState(s);
  archiveTodayBlock(s);
  return s;
}

// Block threshold evaluation
function getBlockThreshold(completed, target) {
  target = target || 3;
  if (completed === 0) return { label: 'Rest day', emoji: '', color: 'gray', level: 0 };
  if (completed === 1) return { label: 'Carry 1 forward', emoji: '', color: 'gray', level: 1 };
  if (completed >= target && completed < target + 1) return { label: 'Solid day ✓', emoji: '✓', color: 'green', level: 2 };
  if (completed === target + 1) return { label: 'Great day ★', emoji: '★', color: 'gold', level: 3 };
  if (completed >= target + 2) return { label: 'Beast mode 🔥', emoji: '🔥', color: 'fire', level: 4 };
  // below minimum
  return { label: 'Keep going', emoji: '', color: 'gray', level: 1 };
}
function getBlockThresholdAfterBlock(nCompleted, target) {
  if (nCompleted >= 2 && nCompleted < target) return { label: 'Solid day ✓ — you hit your minimum!', color: 'green' };
  if (nCompleted === target) return { label: 'Great day ★', color: 'gold' };
  if (nCompleted > target) return { label: 'Beast mode 🔥', color: 'fire', confetti: true };
  return null;
}

// Weekly flex buffer (2 per week, resets Sunday)
function getWeeklyFlex() {
  const sunday = getMostRecentSunday();
  try {
    const f = JSON.parse(localStorage.getItem('weekly_flex_v1') || '{}');
    if (f.week === sunday) return f;
  } catch(e) {}
  const fresh = { week: sunday, total: 2, used: 0 };
  localStorage.setItem('weekly_flex_v1', JSON.stringify(fresh));
  return fresh;
}
function getMostRecentSunday() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}
function useFlex() {
  const f = getWeeklyFlex();
  if (f.used < f.total) { f.used++; localStorage.setItem('weekly_flex_v1', JSON.stringify(f)); }
  return f;
}

// ---- DAILY PRIORITIES (today's queue) ----
function getDailyPriorities() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const saved = JSON.parse(localStorage.getItem('daily_priorities') || 'null');
    if (saved && saved.date === today) return saved.items || [];
    return [];
  } catch(e) { return []; }
}
function saveDailyPriorities(items) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('daily_priorities', JSON.stringify({ date: today, items }));
}

// ---- WEEKLY SCHEDULE STATE ----
function getWeekSchedule() {
  const sunday = getMostRecentSunday();
  try {
    const s = JSON.parse(localStorage.getItem('week_schedule_v1') || '{}');
    if (s.week === sunday) return s;
  } catch(e) {}
  return { week: sunday, days: {}, planned_blocks: 14, lab_days: [] };
}
function saveWeekSchedule(s) {
  try { localStorage.setItem('week_schedule_v1', JSON.stringify(s)); } catch(e) {}
}
function getWeekDays() {
  const sunday = getMostRecentSunday();
  const days = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(sunday);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days; // Mon–Sun
}

// ---- Q1/Q3 ITEM COLLECTION ----
function getStepQuadrant(milestoneId, stepId, stepObj) {
  const triage = getStepTriageData(milestoneId, stepId);
  const phd = triage.phd_critical !== undefined ? triage.phd_critical
    : (stepObj && stepObj.phd_critical !== undefined ? stepObj.phd_critical : true);
  const hasDue = !!(triage.due_date || (stepObj && stepObj.due_date));
  if (phd && hasDue) return 'Q1';
  if (!phd && hasDue) return 'Q2';
  if (phd && !hasDue) return 'Q3';
  return 'Q4';
}
function getMilestoneQuadrant(milestoneId) {
  const triage = getMilestoneTriageData(milestoneId);
  const phd = triage.phd_critical !== undefined ? triage.phd_critical : true;
  const hasDue = !!triage.due_date;
  if (phd && hasDue) return 'Q1';
  if (!phd && hasDue) return 'Q2';
  if (phd && !hasDue) return 'Q3';
  return 'Q4';
}
function getAllQ1Items() {
  const items = [];
  if (typeof TRACK_ORDER === 'undefined' || typeof QUEST_DATA === 'undefined') return items;
  TRACK_ORDER.forEach(trackId => {
    (QUEST_DATA[trackId] || []).forEach(m => {
      (m.steps || []).forEach(step => {
        const ss = typeof getStepState === 'function' ? getStepState(m.id, step.id) : {};
        if (ss.status === 'done') return;
        if (getStepQuadrant(m.id, step.id, step) === 'Q1') items.push({ step, milestone: m, trackId });
      });
    });
  });
  return items;
}
function getAllQ3Items() {
  const items = [];
  if (typeof TRACK_ORDER === 'undefined' || typeof QUEST_DATA === 'undefined') return items;
  TRACK_ORDER.forEach(trackId => {
    (QUEST_DATA[trackId] || []).forEach(m => {
      (m.steps || []).forEach(step => {
        const ss = typeof getStepState === 'function' ? getStepState(m.id, step.id) : {};
        if (ss.status === 'done') return;
        if (getStepQuadrant(m.id, step.id, step) === 'Q3') items.push({ step, milestone: m, trackId });
      });
    });
  });
  return items;
}

// Get all undone steps as blocks (sorted Q1 first, then by cognitive type)
function getAllBlockItems() {
  const q1 = getAllQ1Items().map(i => ({ ...i, quadrant: 'Q1', cogType: getStepCognitiveType(i.step) }));
  const q3 = getAllQ3Items().map(i => ({ ...i, quadrant: 'Q3', cogType: getStepCognitiveType(i.step) }));
  // Deep first, then medium, then lab
  const order = ['deep', 'medium', 'lab', 'admin'];
  const sort = items => items.sort((a, b) => order.indexOf(a.cogType) - order.indexOf(b.cogType));
  return [...sort(q1), ...sort(q3)];
}

// Get today's queue from daily priorities, falling back to top Q1+Q3 items
function getTodayQueue() {
  const saved = getDailyPriorities();
  if (saved.length > 0) return saved;
  // Auto-build from top items
  const items = getAllBlockItems().filter(i => i.cogType === 'deep' || i.cogType === 'medium');
  return items.slice(0, 4).map(i => ({
    stepId: i.step.id,
    milestoneId: i.milestone.id,
    title: i.step.title,
    cogType: i.cogType,
    quadrant: i.quadrant,
  }));
}

// ---- LEAD TIME WARNINGS ----
function getLeadTimeWarning(triageData) {
  if (!triageData || !triageData.compute_lead_hrs || !triageData.due_date) return null;
  const now = Date.now();
  const due = new Date(triageData.due_date).getTime() + 86400000;
  const leadMs = triageData.compute_lead_hrs * 3600 * 1000;
  const startBy = due - leadMs;
  const warnWindow = startBy - 24 * 3600 * 1000;
  const startByFmt = new Date(startBy).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const dueFmt = new Date(triageData.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (now >= startBy) {
    return { level: 'red', message: `Last chance to start — due ${dueFmt}, needs ${triageData.compute_lead_hrs}h compute/wet-lab.` };
  }
  if (now >= warnWindow) {
    return { level: 'yellow', message: `Needs ${triageData.compute_lead_hrs}h to run. Start by ${startByFmt} to finish by ${dueFmt}.` };
  }
  return null;
}

// Get all active lead time warnings across all steps
function getAllLeadTimeWarnings() {
  const warnings = [];
  if (typeof TRACK_ORDER === 'undefined' || typeof QUEST_DATA === 'undefined') return warnings;
  TRACK_ORDER.forEach(trackId => {
    (QUEST_DATA[trackId] || []).forEach(m => {
      (m.steps || []).forEach(step => {
        const ss = typeof getStepState === 'function' ? getStepState(m.id, step.id) : {};
        if (ss.status === 'done') return;
        const triage = getStepTriageData(m.id, step.id);
        const leadHrs = triage.compute_lead_hrs ?? STEP_LEAD_HOURS_DEFAULT[step.id] ?? inferLeadHrsFromTitle(step.title) ?? null;
        const dueDate = triage.due_date || step.due_date;
        if (!leadHrs || !dueDate) return;
        const warn = getLeadTimeWarning({ compute_lead_hrs: leadHrs, due_date: dueDate });
        if (warn) warnings.push({ step, milestone: m, warn, leadHrs });
      });
    });
  });
  return warnings;
}

// ---- INDEX PAGE TRIAGE UI ----
function updateTriageStatusBadge() {
  const badge = document.getElementById('triageStatusBadge');
  if (!badge) return;
  const today = getTodayBlockState();
  const completed = today.completed_blocks || 0;
  const thresh = getBlockThreshold(completed, today.target_blocks || 3);
  if (thresh.level >= 2) {
    badge.className = 'triage-status-badge triage-ok';
    badge.textContent = thresh.emoji + ' ' + thresh.label;
  } else if (completed > 0) {
    badge.className = 'triage-status-badge triage-some';
    badge.textContent = `⚡ ${completed} block${completed > 1 ? 's' : ''} done`;
  } else {
    const q1 = getAllQ1Items();
    badge.className = q1.length ? 'triage-status-badge triage-full' : 'triage-status-badge triage-ok';
    badge.textContent = q1.length ? `🔴 ${q1.length} urgent` : '✓ On track';
  }
}

function renderUrgentStrip() {
  const strip = document.getElementById('urgentStrip');
  const itemsDiv = document.getElementById('urgentStripItems');
  if (!strip || !itemsDiv) return;
  const daily = getDailyPriorities();
  if (!daily.length) { strip.style.display = 'none'; return; }
  strip.style.display = '';
  itemsDiv.innerHTML = daily.map(item => `
    <a href="focus.html?stepId=${encodeURIComponent(item.stepId)}&milestoneId=${encodeURIComponent(item.milestoneId)}"
       class="urgent-strip-item">
      <span class="urgent-item-dot" style="background:var(--cog-${item.cogType || 'deep'})"></span>
      <span class="urgent-item-text">${item.title}</span>
      <span class="urgent-item-arrow">→</span>
    </a>
  `).join('');
}

function renderLeadTimeWarnings() {
  const banner = document.getElementById('leadTimeWarning');
  if (!banner) return;
  const warnings = getAllLeadTimeWarnings();
  if (!warnings.length) { banner.style.display = 'none'; return; }
  banner.style.display = '';
  const topWarn = warnings.find(w => w.warn.level === 'red') || warnings[0];
  banner.className = 'lead-time-banner ' + (topWarn.warn.level === 'red' ? 'banner-red' : 'banner-yellow');
  banner.innerHTML = `
    ${topWarn.warn.level === 'red' ? '🚨' : '⚠️'}
    <strong>${topWarn.step.title}</strong> — ${topWarn.warn.message}
    <a href="focus.html?stepId=${encodeURIComponent(topWarn.step.id)}&milestoneId=${encodeURIComponent(topWarn.milestone.id)}" style="margin-left:8px;color:inherit;font-weight:700;text-decoration:underline">Start now →</a>
    ${warnings.length > 1 ? `<span style="opacity:0.7;margin-left:8px">+${warnings.length - 1} more</span>` : ''}
  `;
}

// ---- DAILY TRIAGE MODAL ----
function initTriageModal() {
  const btn = document.getElementById('dailyTriageBtn');
  const overlay = document.getElementById('triageModalOverlay');
  if (!btn || !overlay) return;
  btn.addEventListener('click', openTriageModal);
  document.getElementById('closeTriageModal')?.addEventListener('click', closeTriageModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeTriageModal(); });
}

function openTriageModal() {
  const overlay = document.getElementById('triageModalOverlay');
  if (!overlay) return;
  const q1Items = getAllQ1Items();
  const q3Items = getAllQ3Items().slice(0, 12);
  const allItems = [...q1Items, ...q3Items];
  const daily = getDailyPriorities();
  const dailySet = new Set(daily.map(d => d.stepId));
  const listDiv = document.getElementById('triageQ1List');
  const capNote = document.getElementById('triageCapNote');
  const today = getTodayBlockState();
  const completed = today.completed_blocks || 0;
  const target = today.target_blocks || 3;

  capNote.textContent = `${completed}/${target} blocks done today. Queue up your next blocks below.`;
  capNote.className = 'triage-daily-cap-note ' + (completed >= target ? 'cap-full' : completed > 0 ? 'cap-some' : 'cap-ok');

  if (!allItems.length) {
    listDiv.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:24px">No active tasks found — you're clear!</div>`;
  } else {
    listDiv.innerHTML = allItems.map(({ step, milestone }) => {
      const q = getStepQuadrant(milestone.id, step.id, step);
      const cog = getStepCognitiveType(step);
      const isSelected = dailySet.has(step.id);
      return `
        <div class="triage-item ${isSelected ? 'triage-item-selected' : ''}"
             data-step-id="${step.id}" data-milestone-id="${milestone.id}"
             data-cog-type="${cog}"
             data-title="${step.title.replace(/"/g, '&quot;')}">
          <div class="triage-item-left">
            <div class="triage-item-q ${q === 'Q1' ? 'q1-badge' : 'q3-badge'}">${q}</div>
            <div class="cog-badge" style="background:var(--cog-${cog})" title="${COGNITIVE_TYPE_LABEL[cog]}">${COGNITIVE_TYPE_EMOJI[cog]}</div>
            <div>
              <div class="triage-item-title">${step.title}</div>
              <div class="triage-item-sub">${milestone.emoji || ''} ${milestone.title} · ${COGNITIVE_TYPE_LABEL[cog]}</div>
            </div>
          </div>
          <div class="triage-item-check">${isSelected ? '✓' : '+'}</div>
        </div>
      `;
    }).join('');
    listDiv.querySelectorAll('.triage-item').forEach(item => {
      item.addEventListener('click', () => toggleDailyPriority(item));
    });
  }
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTriageModal() {
  const overlay = document.getElementById('triageModalOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  updateTriageStatusBadge();
  renderUrgentStrip();
}

function toggleDailyPriority(itemEl) {
  const stepId = itemEl.dataset.stepId;
  const milestoneId = itemEl.dataset.milestoneId;
  const title = itemEl.dataset.title;
  const cogType = itemEl.dataset.cogType;
  const daily = getDailyPriorities();
  const existingIdx = daily.findIndex(d => d.stepId === stepId);
  if (existingIdx >= 0) {
    daily.splice(existingIdx, 1);
    itemEl.classList.remove('triage-item-selected');
    itemEl.querySelector('.triage-item-check').textContent = '+';
  } else {
    daily.push({ stepId, milestoneId, title, cogType });
    itemEl.classList.add('triage-item-selected');
    itemEl.querySelector('.triage-item-check').textContent = '✓';
  }
  saveDailyPriorities(daily);
  const capNote = document.getElementById('triageCapNote');
  if (capNote) {
    const today = getTodayBlockState();
    capNote.textContent = `${daily.length} blocks queued for today.`;
  }
}

function updateCapNote(count) {
  const capNote = document.getElementById('triageCapNote');
  if (!capNote) return;
  capNote.textContent = `${count} blocks queued.${count >= 4 ? ' That\'s a full day — protect the list.' : ''}`;
}

// Cap warning (kept for backward compat, gentler now)
let _capWarningCallback = null;
function showDailyCapWarning(onConfirm) {
  _capWarningCallback = onConfirm;
  const el = document.getElementById('triageCapWarning');
  if (el) { el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center'; }
}
function initCapWarning() {
  const el = document.getElementById('triageCapWarning');
  if (!el) return;
  document.getElementById('capWarnCancel')?.addEventListener('click', () => {
    el.style.display = 'none'; _capWarningCallback = null;
  });
  document.getElementById('capWarnConfirm')?.addEventListener('click', () => {
    el.style.display = 'none';
    if (_capWarningCallback) _capWarningCallback();
    _capWarningCallback = null;
  });
}

// ---- MILESTONE TRIAGE FIELDS (modal hook) ----
function initModalTriageFields() {
  const origSave = window.saveModal;
  if (origSave && typeof origSave === 'function') {
    window.saveModal = function() {
      const mid = window.currentMilestoneId;
      if (mid) {
        const phd = document.getElementById('modalPhdCritical')?.checked ?? true;
        const due = document.getElementById('modalDueDate')?.value || null;
        const lead = parseFloat(document.getElementById('modalComputeLead')?.value) || null;
        saveMilestoneTriageData(mid, { phd_critical: phd, due_date: due, compute_lead_hrs: lead });
      }
      origSave();
    };
  }
  const origOpen = window.openModal;
  if (origOpen && typeof origOpen === 'function') {
    window.openModal = function(milestoneId) {
      origOpen(milestoneId);
      setTimeout(() => {
        const triage = getMilestoneTriageData(milestoneId);
        const phd = document.getElementById('modalPhdCritical');
        const due = document.getElementById('modalDueDate');
        const lead = document.getElementById('modalComputeLead');
        if (phd) phd.checked = triage.phd_critical !== undefined ? triage.phd_critical : true;
        if (due) due.value = triage.due_date || '';
        if (lead) lead.value = triage.compute_lead_hrs || '';
      }, 50);
    };
  }
}

// ---- MISC TASKS ----
function getMiscTasks() {
  try { return JSON.parse(localStorage.getItem('misc_tasks_v1') || '[]'); } catch(e) { return []; }
}
function saveMiscTasks(tasks) {
  localStorage.setItem('misc_tasks_v1', JSON.stringify(tasks));
}
function addMiscTask(task) {
  const tasks = getMiscTasks();
  tasks.push({ id: 'misc-' + Date.now(), ...task, created: new Date().toISOString() });
  saveMiscTasks(tasks);
  return tasks;
}
function deleteMiscTask(id) {
  const tasks = getMiscTasks().filter(t => t.id !== id);
  saveMiscTasks(tasks);
  return tasks;
}
function updateMiscTaskStatus(id, status) {
  const tasks = getMiscTasks().map(t => t.id === id ? { ...t, status } : t);
  saveMiscTasks(tasks);
  return tasks;
}
function getMiscTaskQuadrant(task) {
  return task.due_date ? 'Q2' : 'Q4';
}

// ---- INDEX PAGE INIT ----
document.addEventListener('DOMContentLoaded', () => {
  updateTriageStatusBadge();
  renderUrgentStrip();
  renderLeadTimeWarnings();
  initTriageModal();
  initCapWarning();
  initModalTriageFields();

  // Monday weekly review reminder
  const now = new Date();
  if (now.getDay() === 1) {
    const lastWeeklyCheck = localStorage.getItem('weekly_review_shown');
    const today = now.toISOString().split('T')[0];
    if (lastWeeklyCheck !== today) {
      localStorage.setItem('weekly_review_shown', today);
      setTimeout(() => {
        const toast = document.createElement('div');
        toast.className = 'xp-toast weekly-review-toast';
        toast.innerHTML = `<span>📋 Weekly planning: set up your block queue for the week. <a href="schedule.html" style="color:#a78bfa">Open Schedule →</a></span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 7000);
      }, 3000);
    }
  }
});
