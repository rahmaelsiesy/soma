# ADHD Overhaul — Phase 1 done · Phases 2-3 queued

Branch: `adhd-overhaul`. Not yet merged to `main`. Review locally before
pushing to GitHub Pages.

## Phase 1 (Complete) — bugs + ADHD wins

### 1a · Timer no longer pauses on navigation
**Files:** `app.js`
- Switched from naive `timerRemaining--` to **wall-clock timing**: when
  the timer starts, we stash `timerEndTime = Date.now() + duration` and
  recompute remaining as `timerEndTime - Date.now()` on every tick and
  every re-render of the focus view.
- This fixes the real underlying bug: Chrome throttles `setInterval` on
  backgrounded tabs (sometimes to once per minute), which made the timer
  appear to pause. With wall-clock timing the displayed time is always
  correct when you return.
- Bonus: timer state is persisted to `localStorage` under `soma_timer`.
  If you reload the page mid-block, the timer picks up where it left off.
  If the block expired while you were away, it's cleared (no fake resume).
- Pause/Resume still work via the Start/Pause button — pausing stashes
  the remaining ms; resuming starts a fresh `timerEndTime` from now.

**Test:** Start a block, switch tabs for 2+ minutes, come back. The
display should reflect the actual elapsed time, not be stuck. Refresh
the page mid-block — the block should resume.

### 1b · Project card counter now shows whole-project tasks
**Files:** `app.js` (`getTrackProgressSummary` + `renderProjects`)
- `getTrackProgressSummary` now returns: `{stepsDone, stepsTotal,
  stepOnlyDone, stepOnlyTotal, qcDone, qcTotal, blocksDone, blocksTotal,
  msDone, msTotal}`.
- Project card shows **"X / Y tasks · M / N milestones"** with a hover
  tooltip that breaks down steps and QC checks separately.
- Progress bar width now tracks task completion (not blocks) so the bar
  matches the number you're reading.
- Archived project cards also updated to say "tasks" instead of "steps".

**Test:** Open Projects view. Each card should show two numbers that
clearly correspond to the project's task list — hover for breakdown.

### 1c · Path view duplicate-blocks defensive fix
**Files:** `app.js` (`renderPath`)
- Explicit `el.innerHTML = ''` at the start of `renderPath` to guard
  against any partial-render mixing.
- Steps array double-deduped by id (`getAllSteps` already dedupes; this
  is defense-in-depth).
- The path header summary was collapsed from a separate "X / Y blocks
  logged" row into one concise line: **"5 steps · 0 / 12 blocks · 4 QC
  checks"** so the count isn't visually duplicated by the per-step
  block dots underneath.

**Open question:** I wasn't able to reproduce the visual duplication
from code review alone. If you still see duplicated blocks on
`/#path/dlpfc/f-decoding` after this commit, please take a screenshot
of the rendered page so I can pinpoint which element is doubling.
The most likely remaining cause would be in `style.css` (a CSS rule
duplicating a row) or a transient state from `localStorage` —
`localStorage.removeItem('soma_state')` in DevTools would rule the
latter out.

### 1d · Theme contrast pass
**Files:** `style.css`
- Default `:root` (dark base): bumped `--text-muted` from `#5a5a66`
  (~3.8:1, sub-AA) to `#8d8d99` (~5.5:1, passes AA). Also bumped
  `--text-secondary` from `#8b8b96` to `#a3a3ad` for comfort.
- `rose-pine-dawn` (light): bumped `--text-muted` from `#9893a5`
  (~3.3:1, sub-AA — the comment even admitted it was "decorative only"
  but the code used it for actual text) to `#6e6981` (~5.0:1, passes AA).
- Other themes (tokyo-night, catppuccin-mocha, nord, gruvbox-dark,
  catppuccin-latte, solarized-light, gruvbox-light, remote-lime) were
  already at AA per the inline comments — no change.

### 1e · Progress block visuals upgraded
**Files:** `style.css`
- Pending dots: bigger (10×10 vs 6×6), rounded squares instead of pin
  dots, visible muted border so you can count remaining work at a glance.
- Filled dots: pick up the **track accent color** (via the `--node-accent`
  / `--track-accent` CSS vars that are already set on the candy nodes
  and candy-path container), with a subtle outer glow so completion
  feels visible.
- "Current" dot: pulses + has a ring animation in the track color. So
  when you're mid-task, the block you're currently filling visually
  breathes. (CSS `@keyframes blockPulse` + `.step-block-dot.current`.)

**Test:** Open any project → milestone path. Pending blocks should be
clearly visible; completed blocks should be in the project color;
the in-progress block should pulse softly.

---

## Phase 2 (Next session)

### 2a · Workflow chart on right of timer
The right-hand panel already exists (`focus.html`'s split layout is in
`app.js` ~line 2840 onward as `.focus-workflow`). It currently shows a
**compressed step list** for the milestone. The full upgrade is to
replace it with the **same zig-zag candy-path chart** shown on the
project tracker page, so what you see while focusing matches what you
see when planning. The data is already there — it's a render swap.

### 2b · Today's work blocks on Home with checkboxes
Good news: `renderPlannedBlocksChecklist()` already exists in `app.js`
(~line 1336) and is rendered into Home at line 1620. Phase 2b is just
verifying it has the checkbox affordance and the checkbox actually marks
the block as complete (vs starting the timer for it). May need minor UX
polish.

---

## Phase 3 (Bigger restructure — own session)

### 3a · Sample prep template → contextual drawer
- Remove the dedicated Prep tab entirely.
- Add an "Open prep protocol" button on the relevant project's wetlab /
  sample-handling steps (e.g. `dlpfc-dg-1`, `dlpfc-dg-3` in `data.js`).
- The drawer reuses `openPrepDrawer()` which already exists.

### 3b · Consolidate 10 tabs → 5
Target nav: **Home · Projects · Schedule · Progress · Settings**.
- Prep → folded into project tasks (3a).
- Ideas → Home quick-capture box.
- Admin · Rewards · Docs → Settings sub-sections.
- `index.html` sidebar/bottom-bar markup and `app.js` `handleRoute` +
  `openMoreDrawer` are the places to edit.

### 3c · Project structure reorg — spinouts as milestones
You picked "milestones inside active projects." Plan from the markdown
of paper plans + reviews:
- EEF2, Tissue Assortativity → milestones inside DLPFC AD Project
  (under category `dlpfc` in `data.js`; current `eef2` category goes
  away or merges in).
- SIR Epidemic, CONCORD SAE → milestones inside DLPFC (the `network`
  category currently buckets these; they move into `dlpfc`).
- VEN/FTD → milestone inside FIC (or rolls into DLPFC if you decide to
  collapse FIC into DLPFC).
- Spatial PageRank, Temporal Graph Networks, Network Motifs → stay
  archived (post-graduation papers).
- Cursor Plan (P0-P8), Learning Plan, Career Path categories: I'd
  suggest moving Cursor under Settings/Docs, Learning under a
  collapsible "Reading list" on Home, and Career into Settings as well.

### 3d · Rewrite generic task descriptions
The descriptions in `data.js` for many milestones (e.g. several `pkg-*`,
`c-p*`, `l-*` steps) are short and generic. A pass over each to make
them concrete + actionable will pay back many times over in reduced
"what was I supposed to do?" decision fatigue.

### 3e · QC checks as standalone checkbox tasks
Partly done already — `getQcItems` exists and renders QC items as
candy-nodes on the path view. Phase 3e is the **time tracking** piece:
allow logging blocks against a QC check (since they take real time
when conditions fail) and including them in the daily block plan.

---

## Sequencing recommendation

I'd suggest reviewing Phase 1 changes on a local server first:

```bash
cd ~/path/to/soma
git checkout adhd-overhaul
python3 -m http.server 8000
# open http://localhost:8000 and click around
```

Once Phase 1 feels right, merge to `main` (and Pages will redeploy
automatically). Then we tackle Phase 2 (small, focused) in a new
session, and Phase 3 (the big restructure) in the session after that.
