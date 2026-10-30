# Soma: turning it into a product

*Written 2026-10-29. Market facts come from web research done the same day. A few vendor sites couldn't be opened directly, so check competitor prices on their own pages before quoting them publicly. Sources are at the end.*

---

## The short version

1. **What you have is worth selling.** Soma is a calm ADHD focus planner with a combination nobody else bundles: no account, data that never leaves the device, 90-minute focus blocks, a weekly block budget that rolls over, a guided Sunday review, real-life rewards, and AI planning through the user's *own* chatbot.
2. **Sell it as a hosted web app on your own domain. Don't sell it as a GitHub repo, and don't build a desktop app yet.** Buyers open a link, install it to their dock or home screen in one click, and get updates automatically. Hosting costs $0.
3. **Use freemium plus a one-time Pro price.** Launch at **$29**, then go to **$39**. Later, add **$9–15 template packs** (start with a PhD/thesis pack built from your own roadmap). Only charge a subscription for something that costs you money to run, like sync.
4. **Sell through a merchant of record** (Polar or Lemon Squeezy, about 5% + 50¢), so you never deal with sales tax or VAT yourself.
5. **Marketing is the ongoing job.** Short videos showing the brain dump and focus block, affiliate deals with ADHD and academic coaches, free-tool SEO pages, and a Product Hunt / Show HN launch. Plan on 3–5 hours a week. The income is "low-maintenance", not passive.
6. **This branch already does most of the product prep** (section 1). What's left before launch is in section 8.

---

## 1. What's in the repo, and what was in the way

**Strengths a buyer will feel:**
- A polished, calm design with 9 accessible themes.
- A 90-minute focus timer that survives tab switches and page reloads.
- Weekly block planning with automatic rollover of unfinished blocks.
- Points, streaks and a rewards menu.
- A board-game "path" view of each project.
- An Eisenhower-style triage with lead-time warnings.
- A Sunday review wizard and a "plan my week with AI" prompt.
- JSON export and import.
- It already installs as a PWA, and there's no backend to pay for or secure.

**What stopped it from being sellable, and what this branch did about it:**

| Problem found | Status |
|---|---|
| Your personal PhD projects, docs, lab protocol and GitHub repo were hardcoded in `app.js`. A buyer would open *your* DLPFC project. | **Fixed.** Everything personal now lives in `SOMA_PROFILE` in `data.js`. `app.js` is generic, and your live site behaves exactly as before. |
| Adding a task meant Projects → project → milestone → path → form. New milestones and steps used browser `prompt()` pop-ups. | **Fixed.** **Quick Add** (the + button or the **N** key on every screen): add tasks, milestones, projects, ideas or admin items. Pasting a list makes one task per line. Optional shortcuts: `#project ~2 ! @fri`. Every add can be undone. |
| A project with no milestones couldn't take tasks without first learning the hierarchy. | **Fixed.** Quick Add creates a "Tasks" milestone automatically, and a new project rolls straight into "add its first tasks". |
| "Promote to step" on Ideas didn't create anything. It only set a flag. | **Fixed.** It now opens Quick Add prefilled and marks the idea promoted once the task exists. |
| Renaming only worked by double-clicking, which nothing on screen hints at. The milestone description used a `prompt()`. | **Fixed.** Edit buttons on project and milestone pages, an Edit-milestone dialog (name, description, due date), and a title field in the step drawer. |
| Custom projects showed gray in the week bar, focus view, timer pill and charts. Fourteen places ignored their color. | **Fixed.** |
| Opening the Focus tab (or the timer pill) during a block on any step except the next queued one silently **stopped the timer**. | **Fixed** (reproduced first). |
| The AI planning prompt printed "undefined" for admin tasks and included finished ones. | **Fixed.** |
| The "Approve plan" button had no styling. Long project names overlapped the progress counter. | **Fixed.** |
| Data lives only in localStorage, so a cleared browser or Safari's 7-day eviction wipes it. This is the #1 predicted support ticket. | **Mitigated.** The app asks the browser for persistent storage, and Home shows a weekly "Back up now" reminder once there's real data. |
| The manifest's app icons never existed (`*.png` was gitignored), and there was no offline support. | **Fixed.** New icon set, plus a network-first service worker (product build only). |
| No way to produce a clean product copy. | **Fixed.** `node tools/build-edition.mjs` builds `dist/starter/` and a zip containing a guided "Start here" tour and two example projects. The build stops if any personal marker leaks in. |

**Worth knowing:**
- **Your repo is public.** Anyone can see `docs/` (paper plans, analysis strategy, protocol PDF), `state.json` and the code. Before selling, put the product in a **private** repo. Your personal site can stay where it is.
- `focus.html`, `detail.html`, `schedule.html`, `misc.html` and `tracker.html` are older "Quest Board" pages. Nothing in the current app links to them, and five of the six already throw errors on load (unchanged by this branch). Delete them, or rebuild the sample tracker inside the app if you still use it.
- None of the 28 auto-generated weekly-review GitHub issues has a comment. The in-app Sunday review is the version that gets used, so the GitHub Action can go.

---

## 2. The market

**Who it's for**
- About **15.5 million US adults (6%)** had a current ADHD diagnosis in 2023, and about half were diagnosed as adults (CDC).
- Worldwide, about 140 million adults have persistent ADHD.
- Productivity-app market estimates range from **$12B to $35B** (2025, depending on definition).

**The mood: people are tired of subscriptions**
- 55% of Americans say they plan to cut subscriptions in 2026.
- One-time and lifetime pricing grew from 6.4% to 10.3% of app monetization between 2023 and 2025.
- Recent price hikes people noticed:
  - Todoist monthly plan: up ~40%.
  - TickTick: $35.99 → $49.99/yr.
  - Structured lifetime: $29.99 → $99.99.
  - Forest moved from a one-time purchase to a subscription.
  - Akiflow dropped its long-term plan.

**The competition (condensed; full tables are in the research notes)**

| Type | Examples and price | Their weak spot (from reviews) |
|---|---|---|
| ADHD planners | Tiimo (~$42–54/yr), Llama Life ($39/yr), Structured ($29.99/yr, $99.99 lifetime), Amazing Marvin (~$96/yr), Inflow (~$100/yr) | Overwhelming setup (Marvin); billing traps such as surprise annual charges and refused refunds (Inflow, Finch, Motion) |
| Gamified | Habitica ($48/yr), Forest (now a subscription) | Punishing mechanics: losing HP, dead trees, streak shame |
| Mainstream | Todoist ($60/yr), TickTick ($49.99/yr), Things 3 ($49.99 Mac, Apple only), Sunsama (~$200+/yr), Motion (~$230+/yr) | Price creep, clutter, privacy worries |
| Focus / body-doubling | Focusmate ($96/yr, camera required), Flow Club ($400/yr) | Camera anxiety, cost |
| Free / open source | Super Productivity, Goblin Tools | Cluttered, or a single-trick tool |
| **Indie offline web planners (closest to Soma)** | Anchor ($14.99 pay-what-you-want), DayChunk ($9.99) | Thin feature sets, and they share the same data-loss warning |
| Notion ADHD templates | $9–25 single tools, $29–49 full "ADHD OS" systems; top Gumroad listings show 300–600 sales | Need Notion; can't run a timer or nudge you |
| PhD / thesis | Notion and Etsy thesis templates at $1–20; no dedicated PhD planner app found | A gap, though a small one |

**Gaps Soma fits:**
1. **Pay once, with no billing traps.** "ADHD tax" is already a mainstream phrase, and surprise subscriptions hit forgetful users hardest.
2. **Private by design.** There's no account and no server, so there's nothing to leak. Many mental-health apps fail privacy reviews.
3. **Calm but complete.** It goes deeper than single-trick tools but is less overwhelming than Marvin or TickTick, because the defaults (90-minute blocks, a weekly budget, a Sunday review) do the setup.
4. **Gentle gamification.** Rewards you choose, with no punishment. *Recommended next step: make streaks forgiving* (count total days, don't reset to zero).
5. **AI planning without an AI paywall.** It uses the chatbot the buyer already has, so their data isn't sent anywhere by you.
6. **A researcher's story.** "Built by a neuroscience PhD student to finish a dissertation" is credible and memorable. Lead-time warnings and thesis milestones don't exist elsewhere.

**Honest read:** no single Soma feature is unique. The **combination** is, and so is the story behind it. The closest indie competitors sell for $10–15, so Soma has to *look* clearly richer in the first 30 seconds. That's why the free demo and the "Start here" tour matter.

---

## 3. How to make money from it

### Recommended model: free core, one-time Pro, add-on packs

| Tier | Price | What's in it | Why |
|---|---|---|---|
| **Free** | $0, forever | Quick Add, focus timer, Ideas, up to 3 active projects, export/import | Anyone can try it with no signup. That's what Show HN, Product Hunt and SEO need. Never limit export: trust is the product. |
| **Soma Pro** | **$29 launch → $39** one-time | Unlimited projects, weekly planning and rollover, rewards, Sunday review, AI planner, progress charts, all themes, free 1.x updates | Less than one year of Todoist or TickTick, and yours to keep. It matches the Things 3 / Notion ADHD OS price range. |
| **Template packs** | $9–15 each | Prebuilt projects, milestones and steps: **PhD / Thesis roadmap** (from your own `data.js`, with names removed), Job search, Freelance client pipeline, Semester planner, Launch a product | These are templates in the literal sense: little work per pack, and they reach buyers who search for "thesis planner". |
| **Bundle** | $59 | Pro plus every pack | Raises the average order |
| **Lab / classroom license** | ~$149 for 10 seats | Pro for a lab or a cohort | PIs, writing centers and grad wellness offices have budgets. You already speak their language. |
| **Soma Sync** (later, optional) | ~$3/mo or $24/yr | Encrypted sync across devices | The only piece that costs you money to run, so it's the only fair subscription |

Lower-priced entry products:
- **A Notion version of the weekly block planner**, $9–12 on the Notion Marketplace or Gumroad. It mostly works as a funnel to the app.
- **A free "90-minute block method" PDF** in exchange for an email address. It builds your launch list.

Gating features in a static app only stops honest people, and that's fine. Price fairly, make buying easy, and don't spend time on DRM.

### Illustrative numbers (assumptions, not a forecast)

After merchant-of-record fees (~5% + 50¢), a $39 sale nets about **$36**, and a $29 sale about **$27**. Hosting is $0 and the domain about $12/yr.

| Pro sales per month | Monthly net (Pro only) |
|---|---|
| 10 | ~$300 |
| 25 | ~$900 |
| 100 | ~$3,600 |

Packs and bundles add on top of this. Many indie launches sell very little after the launch spike, so expect the low end until a channel (video, SEO or affiliates) is running steadily.

---

## 4. GitHub, a download, or a hosted app?

### Recommendation

**A hosted, installable web app (PWA) on your own domain, unlocked with a license key from a merchant of record.** Give buyers the downloadable zip as a bonus "offline copy". Add a free Microsoft Store listing later via PWABuilder. Skip Mac and iOS native apps for now.

### Comparison

| | Buyer experience | Your cost / effort | Updates | Piracy |
|---|---|---|---|---|
| **Sell GitHub repo access** | Needs a GitHub account and comfort with git. Fine for developers, wrong for ADHD buyers. | Low | `git pull` | Anyone can repost it |
| **Host on GitHub Pages** | Fine | $0 | Instant | Public repo means a free copy |
| **Downloadable zip only** | "Unzip and double-click": confusing, no install or offline mode from a file, quirks in some browsers | Very low | Manual re-download | Total |
| **Desktop app (Electron/Tauri)** | Familiar installer, but Windows "unknown publisher" warnings are still possible | **$99/yr Apple + ~$120/yr Windows signing**, plus notarization and per-OS builds | You build an auto-updater | Same as the web: the same JS ships inside |
| **App stores** | Most trusted | Review friction, 15% cut; iOS rejects thin web wrappers | Store-managed | Low |
| **Hosted PWA (recommended)** | Open a link, click Install, done. Works on Mac, Windows, ChromeOS, Android and iPhone. | **$0 hosting** (Cloudflare Pages or Netlify), ~$12/yr domain | **Instant for everyone** | Moderate, which is acceptable |

### Why not each alternative

- **GitHub is a developer storefront, and its rules forbid this use.**
  - GitHub's own Pages docs say Pages may not be used as free hosting for an online business or a commercial SaaS.
  - Your buyers are tired, overwhelmed people, not developers. "Create a GitHub account and accept a repo invite" is exactly the kind of friction that makes ADHD buyers abandon a purchase.
  - A public repo also means a free copy for anyone who looks.
- **A desktop app costs real money every year and buys you almost nothing.**
  - Soma is already an installable PWA: it gets its own window, dock icon and offline mode.
  - Wrapping it in Electron or Tauri adds roughly $220/yr in signing costs, notarization, an updater and separate builds per operating system.
  - You'd get no protection gain: the same JavaScript ships inside.
  - Revisit only if you need something a browser can't do, such as menu-bar timers or OS focus modes.
- **A zip alone gives the worst experience.**
  - Browsers don't allow install or offline mode for files opened from disk.
  - Every update means re-downloading.
  - Keep the zip as a bonus for people who want a local copy, but don't make it the main product.

### Why hosted wins

- Zero running cost.
- One codebase, with updates that reach everyone instantly.
- A frictionless free trial.
- A privacy promise you can keep: there's still no server that stores their data.

### The honest downsides, and how to handle them

| Risk | What to do |
|---|---|
| **Data loss** (cleared browser, Safari's 7-day rule for sites that aren't installed) | Already done: persistent-storage request and weekly backup reminder. Next: an "Install the app" prompt (installed apps are exempt from Safari's rule) and automatic backup to a file the user picks (Chromium's File System Access API). |
| **Saved data is tied to the domain** | Choose the domain once and never change it. Moving domains empties everyone's app. |
| **Piracy** | Accept it. Check the license once, cache the result, recheck occasionally, and never break offline use. |
| **No cross-device sync** | Export and import today. Paid encrypted sync later, if people ask for it. |

---

## 5. Where to sell it

| Platform | Fees | Handles sales tax / VAT? | License keys | Use it for |
|---|---|---|---|---|
| **Polar** | 5% + 50¢ (+1.5% non-US cards) | Yes (merchant of record) | Yes, with a validate endpoint documented as safe to call from a browser, so no server is needed | **Soma Pro (recommended)** |
| Lemon Squeezy | 5% + 50¢ | Yes | Yes, client-callable | A good alternative with built-in affiliates. It's mid-migration to Stripe, so keep customer emails exportable. |
| Gumroad | 10% + 50¢ (30% on its Discover marketplace) | Yes | Yes, but likely needs a tiny server proxy | Templates and packs: marketplace traffic and built-in affiliates |
| Notion Marketplace | 8% + 40¢ | Yes | n/a | The Notion version of the planner |
| Etsy | ~10% all-in + ads | Partly | No | Printable or Sheets planners only |
| Microsoft Store | $0 to list; 0% with your own checkout | n/a | Your key | A later, free extra shop window via PWABuilder |

**Start simple:** one storefront (Polar) for Pro and the packs, plus a landing page on your domain. Add Gumroad or Notion only when you make the template versions.

---

## 6. How to market it

**Positioning line:** *Soma is a calm focus planner for ADHD brains. One thing at a time. No account, no subscription, and your plans never leave your device.*

**Wording rule:** say "ADHD-friendly" or "built for ADHD brains". Never say it treats or improves ADHD. The FTC has acted against unsupported focus claims, and the license file already includes a not-a-medical-device line.

**Channels, best return first:**

1. **Short-form video** (TikTok, Reels, Shorts), 3 a week for 8–12 weeks. Three formats:
   - "Brain dump → planned week in 30 seconds": paste a messy list into Quick Add.
   - "Do a 90-minute block with me": body-doubling content, and the timer is on screen.
   - "How I plan a dissertation with ADHD": your story, using the Thesis pack.

   ADHD audiences are wary of hype, so show the tool working rather than making claims.
2. **Affiliates.** ADHD coaches, academic and dissertation coaches, and PhD YouTubers. Give them free Pro and 30–40% commission. Tiimo already runs a coach program like this. Once it's set up, it's the most passive channel.
3. **The free tier as SEO.** Landing pages for "90-minute focus timer", "ADHD weekly planner" and "brain dump to task list". Each one lands on the live free app.
4. **Your academic network.** Grad school wellness offices, writing centers, dissertation boot camps, lab group chats, conferences. Offer the lab license.
5. **Launch spikes.**
   - Product Hunt (prep for 2 weeks; never ask for upvotes).
   - Show HN (works because there's no signup).
   - r/SideProject.
6. **An email list from day one.** Use the free PDF or the Thesis-roadmap preview as the sign-up offer. Launch to this list first.

**Communities that ban self-promotion:**
- **r/ADHD** (rule 8), **r/PhD**, and r/AutisticWithADHD, which gives permanent bans.
- On these, only answer questions helpfully and let people find you through your profile.

**8-week launch plan:**

| Week | Do |
|---|---|
| 1–2 | Private product repo, domain, Cloudflare Pages deploy, license unlock, landing page, privacy and refund pages, fill in the README/LICENSE placeholders |
| 2–4 | Closed beta with 20–30 people (ADHD friends, labmates). Collect 5 testimonials and fix the top 3 complaints. Start posting videos. |
| 5 | Soft launch to your list at $29 |
| 6 | Product Hunt plus Show HN |
| 7–8 | Affiliate outreach; release the Thesis pack |
| After that | 3–5 hours a week of content, support and one small update a month. Raise to $39 once you have reviews. |

---

## 7. How passive will it really be?

- **Support:** expect "I lost my data" and "I lost my key" tickets. The backup reminder reduces the first; keys can be looked up in Polar's dashboard.
- **Refunds:** reports say 2–5% is typical (unverified). EU buyers get a 14-day withdrawal right, and the merchant of record handles the paperwork.
- **Sales come in spikes.** Without a channel that keeps running (video, SEO or affiliates), sales fade within weeks of a launch. Plan for steady, small effort, not zero.

---

## 8. What to build next

**Before launch (P0)**
- [x] **License unlock and free-tier limit.** Done: Polar or Lemon Squeezy keys are checked in the browser and cached (works offline, re-checked every 2 weeks). The Pro features and free project limit are set in `editions/starter/edition.json`. Export is never gated. **Test once with a real key before launch** (see `LAUNCH-CHECKLIST.md`).
- [ ] **Make the repo private** and deploy `dist/starter-site/` (landing page plus app at `/app/`) to your domain. Steps in `LAUNCH-CHECKLIST.md`.
- [x] **Landing page.** Done: `editions/starter/site/` has the hero, how it works, real screenshots, the privacy promise, founder note, Free vs Pro pricing, FAQ and a privacy page. Still worth adding: a short screen-recording video of Quick Add and a focus block.
- [x] **"Install the app" prompt.** Done: from the second day of use, an Install button (Chrome, Edge, Android) or instructions (iPhone, Mac Safari); "Not now" hides it for 30 days.
- [x] **Forgiving streaks.** Done: one missed weekday a week is a free rest day, the best streak is remembered, and streak rewards stay earned.
- [ ] Fill in `editions/starter/edition.json` (one file now feeds the README, LICENSE, landing page and licensing; the build lists anything missing). Have the license, privacy page and refund policy looked over; these are templates, not legal advice.
- [ ] Delete the broken legacy pages and the unused weekly-review Action.

**Soon after (P1)**
- [x] **Today list** on Home (pick up to 3, carry-over, due soon, suggestions), **tick-off checks** on task cards, **block-end alerts** (chime, notification, tab-title countdown, break nudge), **Break it down with AI**, and a **Candy Land progress board** per project (milestones as spaces filled with focus-block squares). Done.
- [ ] **AI plan paste-back** (your issue #2): the AI replies in a small JSON format, and Soma previews and applies it to the week.
- [ ] **Pack import.** Buyers who already have Soma load a pack file that adds projects, so packs sell without a new build.
- [ ] **Thesis pack:** copy `editions/starter`, then turn your `data.js` roadmap into generic, renamed milestones.
- [ ] **Auto-backup to a file** (Chromium) and a "share my week" image for social posts.

**Later (P2)**
- [ ] Optional encrypted sync subscription.
- [ ] Microsoft Store via PWABuilder; Android via a Trusted Web Activity.

---

## 9. How the code is organized now

- **`data.js`** holds your projects (`QUEST_DATA`) plus `SOMA_PROFILE`: active and archived projects, labels, colors, docs, GitHub sync, AI persona and the lab-prep template. Edit your own setup here.
- **`editions/starter/`** is the product's data file plus the buyer README and LICENSE. To make a new edition or pack, copy this folder and edit its `data.js`. Keep ids stable once released, because saved progress is keyed by id.
- **`editions/starter/edition.json`** holds your seller details, price and licensing (provider, IDs, free project limit, Pro features). **`editions/starter/site/`** is the landing page.
- **`node tools/build-edition.mjs [edition]`** builds `dist/<edition>/`, `dist/soma-<edition>.zip` and `dist/<edition>-site/` (the website, with the app at `/app/`). It fills in your details, never copies your docs, protocol, legacy pages, `state.json` or snapshots, stops if a personal marker appears, and lists any `YOUR-…` values still to fill. To publish, drag `dist/starter-site/` into Cloudflare Pages or Netlify.
- **`product/LAUNCH-CHECKLIST.md`** walks through store setup, testing a real purchase, deploying and launch.
- **`sw.js`** provides offline support. It's only switched on for editions whose profile sets `offline: true`, so your GitHub Pages site is unchanged.

---

## Sources

**Market and users**
- [CDC: adult ADHD prevalence, 2023](https://www.cdc.gov/mmwr/volumes/73/wr/mm7340a1.htm)
- [Song et al.: global adult ADHD](https://pmc.ncbi.nlm.nih.gov/articles/PMC7916320/)
- [Research and Markets: productivity apps](https://www.researchandmarkets.com/reports/6260384/productivity-apps-market-share-analysis)
- [NerdWallet via WLOX: subscription cutting, 2026](https://www.wlox.com/2026/04/07/more-than-half-americans-plan-cut-subscriptions-2026-survey-finds/)
- [Adapty via Airbridge: lifetime pricing share](https://www.airbridge.io/en/blog/should-you-offer-a-lifetime-subscription)
- [ADDA: the "ADHD tax"](https://add.org/adhd-tax/)
- [Mozilla: mental-health app privacy](https://www.mozillafoundation.org/en/blog/shady-mental-health-apps-inch-toward-privacy-and-security-improvements-but-many-still-siphon-personal-data/)

**Competitor pricing**
- [Todoist price change](https://www.todoist.com/help/articles/todoist-pro-plan-pricing-update-bxBvHZuJZ)
- [TickTick pricing](https://vyneron.com/en/blog/ticktick-pricing-2026)
- [Structured lifetime price](https://www.tiltaken.com/articles/structured-app-lifetime-price)
- [Forest petition](https://www.change.org/p/forest-respect-pro-users-and-restore-the-features-we-already-paid-for)
- [Llama Life (App Store)](https://apps.apple.com/us/app/adhd-organizer-llama-life/id6454469750)
- [Lunatask pricing](https://lunatask.app/pricing)
- [Things 3 pricing](https://toolradar.com/tools/things-3/pricing)
- [Inflow reviews (Trustpilot)](https://uk.trustpilot.com/review/getinflow.io?page=5)
- [Anchor (Payhip)](https://payhip.com/b/3h7rc)
- [DayChunk (Gumroad)](https://onionwave7.gumroad.com/l/daychunk)
- [Notion ADHD template sales example](https://notionforadhd.gumroad.com/l/gyouo)
- [Tiimo coach program](https://www.tiimoapp.com/partnerships/coaches)

**Distribution and platforms**
- [GitHub Pages limits and prohibited uses](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [WebKit: Safari storage eviction](https://webkit.org/tracking-prevention/)
- [Apple Developer Program](https://developer.apple.com/programs/enroll/)
- [Azure Artifact Signing pricing](https://learn.microsoft.com/en-us/azure/trusted-signing/how-to-change-sku)
- [Microsoft Store fees](https://www.techradar.com/pro/microsoft-just-dropped-its-store-fees-for-windows-developers)
- [Apple guideline 4.2](https://developer.apple.com/app-store/review/guidelines/)

**Storefronts**
- [Polar fees](https://polar.sh/docs/merchant-of-record/fees)
- [Polar license validation](https://polar.sh/docs/api-reference/customer-portal/license-keys/validate)
- [Lemon Squeezy fees](https://docs.lemonsqueezy.com/help/getting-started/fees)
- [Lemon Squeezy 2026 update](https://www.lemonsqueezy.com/blog/2026-update)
- [Gumroad pricing](https://gumroad.com/pricing)
- [Notion Marketplace](https://www.notion.com/help/selling-on-marketplace)

**Marketing**
- [Product Hunt launch guide](https://help.producthunt.com/en/articles/17350772-launch-guide)
- [Show HN rules](https://news.ycombinator.com/showhn.html)
- [FTC action on focus and brain-training claims](https://medcitynews.com/2015/01/ftc-goes-brain-training-kids-business-health-benefits-marketing-pitch/)
- [EU 14-day withdrawal right](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083-20220528)
