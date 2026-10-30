# soma 🧬

## Live Site
**[Open Quest Board →](https://rahmaelsiesy.github.io/soma/)**

## Pages
| Page | Description |
|---|---|
| [index.html](https://rahmaelsiesy.github.io/soma/) | Main quest board — 7 tracks, 57+ milestones |
| [detail.html](https://rahmaelsiesy.github.io/soma/detail.html) | Candy Land step path per milestone |
| [focus.html](https://rahmaelsiesy.github.io/soma/focus.html) | 90-min focus session tracker |
| [schedule.html](https://rahmaelsiesy.github.io/soma/schedule.html) | Weekly planning + block chart |
| [tracker.html](https://rahmaelsiesy.github.io/soma/tracker.html) | Sample pipeline tracker |
| [misc.html](https://rahmaelsiesy.github.io/soma/misc.html) | Misc tasks + delegated work |
| [help.html](https://rahmaelsiesy.github.io/soma/help.html) | How to use guide |


## Weekly Review
Every Monday at 9am PDT, a GitHub Action creates a new Issue with a weekly reflection + planning template. 

## Daily Snapshots
Every day at 6am PDT, a commit is made to `snapshots/` as an audit trail.  
Export your board state from the Quest Board → paste into that day's snapshot file.

## Product build
The app code is shared; everything personal lives in `SOMA_PROFILE` in `data.js`.
`node tools/build-edition.mjs` builds the sellable starter edition from `editions/starter/`
into `dist/starter/` (plus a zip) and the website (landing page + app) into `dist/starter-site/`,
without any personal data. Seller details and licensing live in `editions/starter/edition.json`.
See `product/LAUNCH-CHECKLIST.md` and `product/STRATEGY.md`.

How to use the app: `guide.html` (also under More → Guide & docs).

Quick add: press **N** or tap **+** anywhere to add tasks, milestones, projects, ideas or admin items.
