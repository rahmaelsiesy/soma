// ============================================================
// SOMA — STARTER EDITION DATA
// Ships with the product build (tools/build-edition.mjs swaps this
// in for the root data.js). A short guided tour project plus two
// example projects that show how projects → milestones → steps fit
// together. Buyers archive or edit them; nothing here is required.
//
// Step ids must stay stable once released: saved progress is keyed
// by id in the buyer's browser.
// ============================================================

const QUEST_DATA = {

  start: [
    {
      id: "start-tour", icon: "target",
      title: "Get set up (about 20 minutes)",
      desc: "A short guided tour. Open each step, try the thing, then press Mark as done.",
      category: "start",
      steps: [
        { id: "start-1", title: "Add your first tasks with +",
          desc: "Press N on your keyboard (or tap the + button) from any screen. Type a task and press Enter. Paste a whole list to add one task per line — great for a brain dump.",
          checklist: [
            "Added one task with the + button",
            "Pasted a list of 3 or more tasks at once",
            "Tried a shortcut: ~2 (blocks), ! (important), @fri (due date)"
          ],
          estimated_blocks: 1 },
        { id: "start-2", title: "Try a 25-minute warm-up block",
          desc: "Starting is the hardest part, so begin small. Open a task, press Start Focus, pick Warm-up and press Start. You can leave the page — the timer keeps going.",
          checklist: ["Started a warm-up block", "Saw the timer pill follow you to another page"],
          estimated_blocks: 1 },
        { id: "start-3", title: "Plan this week's focus blocks",
          desc: "On Home, the This week panel splits your weekly block goal across projects. Use + and − per project, then press Approve plan. Unfinished blocks roll over to next week automatically.",
          checklist: ["Set a weekly goal you can actually hit", "Gave blocks to 1–2 projects", "Approved the plan"],
          estimated_blocks: 1 },
        { id: "start-4", title: "Choose your rewards",
          desc: "Every finished block earns points. Open More → Rewards and pick real treats for each point tier — small, guilt-free, and actually motivating to you.",
          checklist: ["Picked a reward for the first tier"],
          estimated_blocks: 1 },
        { id: "start-5", title: "Make it yours",
          desc: "Open More → Settings. Pick a theme, and change block length if 90 minutes is too long (many people start at 45 or 60).",
          checklist: ["Picked a theme", "Set a block length that feels doable"],
          estimated_blocks: 1 },
        { id: "start-6", title: "Keep your data safe",
          desc: "Your plans are stored privately in this browser — no account, nothing sent to a server. That also means clearing your browser data erases them. Install Soma as an app (your browser's Install / Add to Home Screen option) and use Settings → Export JSON for a backup file now and then.",
          checklist: ["Installed Soma as an app", "Exported a backup file"],
          estimated_blocks: 1 },
        { id: "start-7", title: "Archive this tour",
          desc: "You're set. Go to Projects and press Archive on this project to clear it away. You can bring it back from the archived list any time.",
          estimated_blocks: 1 },
      ],
      reward: "🎉 You're set up. Everything else is one block at a time."
    },
  ],

  example_launch: [
    {
      id: "launch-validate", icon: "rings",
      title: "Check the idea is worth it",
      desc: "Before building anything, make sure real people want it.",
      category: "example_launch",
      steps: [
        { id: "launch-v1", title: "Write a one-paragraph pitch", type: "writing",
          desc: "Who is it for, what problem does it solve, and why now? Keep it under 100 words.",
          estimated_blocks: 1 },
        { id: "launch-v2", title: "Talk to 5 people who have the problem",
          desc: "Ask about the last time they hit the problem, not whether they'd buy. Write down their exact words.",
          checklist: ["Person 1", "Person 2", "Person 3", "Person 4", "Person 5"],
          estimated_blocks: 3 },
        { id: "launch-v3", title: "Decide: go, change, or stop", type: "writing",
          desc: "Reread your notes. Pick one, write down why, and move on — stopping is a valid result.",
          estimated_blocks: 1 },
      ],
      reward: "🧭 Decision made. That's the part most people skip."
    },
    {
      id: "launch-build", icon: "code",
      title: "Ship the first version",
      desc: "The smallest thing that solves the problem for one real person.",
      category: "example_launch",
      steps: [
        { id: "launch-b1", title: "List the three must-have features", type: "writing",
          desc: "Everything else goes on a later list. If it's not needed for the first user, it waits.",
          estimated_blocks: 1 },
        { id: "launch-b2", title: "Build the smallest useful version", type: "code",
          desc: "Timebox it. Done and shown beats perfect and hidden.",
          estimated_blocks: 4 },
        { id: "launch-b3", title: "Show it to 3 people and watch them use it",
          desc: "Don't explain it first. Note where they get stuck.",
          estimated_blocks: 2 },
      ],
      reward: "🚀 It's real now."
    },
  ],

  example_learning: [
    {
      id: "learn-basics", icon: "book",
      title: "Get through the basics",
      desc: "Pick one resource and finish it before collecting more.",
      category: "example_learning",
      steps: [
        { id: "learn-1", title: "Choose one course or book", type: "learning",
          desc: "Just one. Write down why you chose it so you don't keep second-guessing.",
          estimated_blocks: 1 },
        { id: "learn-2", title: "Finish the first module", type: "learning",
          desc: "Take notes in your own words. Questions go in Ideas so they don't derail the block.",
          estimated_blocks: 2 },
        { id: "learn-3", title: "Build a tiny practice project", type: "code",
          desc: "Use what you learned on something small you actually care about.",
          estimated_blocks: 3 },
      ],
      reward: "📚 Foundations done."
    },
  ],
};

// ---- PROFILE ----
// See the root data.js for what each field does. The starter edition
// ships no lab template, no GitHub sync and no reference docs.
const SOMA_PROFILE = {
  activeTracks: ['start', 'example_launch', 'example_learning'],
  archivedTracks: [],
  trackColors: { start: '#e07a5f', example_launch: '#4f8fc0', example_learning: '#a3c586' },
  trackLabels: {
    start: 'Start here',
    example_launch: 'Example: Launch a side project',
    example_learning: 'Example: Learn a new skill'
  },
  labPrep: false,
  docs: [],
  // Register sw.js so the hosted app keeps working offline.
  offline: true
};
