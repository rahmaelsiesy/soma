# Launch checklist

Everything needed to go from this repo to a live, sellable Soma. Work top to bottom; each step says where to click or what to edit. You don't need to write any code.

---

## 1. Set up your store (about 30 minutes)

You need a payment platform that handles sales tax for you and issues license keys. **Polar** is the recommended one (5% + 50¢ per sale). Lemon Squeezy also works.

**Polar**
- [ ] Create an account at polar.sh and set up your organization (your shop).
- [ ] Create a product named "Soma Pro" with a **one-time price** (the plan suggests $29 at launch, then $39).
- [ ] Add a **License Keys** benefit to the product. No expiry. An activation limit is optional; leave it off to start.
- [ ] Optional: add a **File downloads** benefit with `dist/soma-starter.zip` as a bonus offline copy.
- [ ] Copy your **Organization ID** from your organization settings.
- [ ] Copy the product's **checkout link**.

**Or Lemon Squeezy**
- [ ] Create a store and a product with **license keys** turned on.
- [ ] Note your **store ID** and **product ID**, and copy the checkout link.

## 2. Fill in your details (10 minutes)

Open `editions/starter/edition.json` and replace every `YOUR-…` value:

| Field | What to put |
|---|---|
| `productName` | The name buyers see (Soma, or a new name) |
| `sellerName` | Your name or studio name, used in the license and footer |
| `supportEmail` | Where buyers write to you |
| `siteUrl` | Your domain, e.g. `https://somaplanner.com` |
| `appUrl` | The same domain plus `/app/` |
| `buyUrl` | The checkout link from step 1 |
| `priceLabel` | The price as shown, e.g. `$39` |
| `refundPolicy` | One sentence; match what your platform allows |
| `founderNote` | A sentence or two in your own voice for the landing page |
| `licensing.provider` | `polar` or `lemonsqueezy` |
| `licensing.organizationId` | Polar: your organization ID |
| `licensing.storeId`, `licensing.productId` | Lemon Squeezy: your IDs (and set `provider` to `lemonsqueezy`) |

**Decide what's free and what's Pro.** These are the two settings:

- `licensing.freeProjectLimit` (default 3)
- `licensing.proFeatures`, which can include any of: `unlimitedProjects`, `board`, `weeklyPlan`, `rewards`, `aiPlanner`, `themes`, `progressCharts`

Quick Add, Today, the focus timer, notes, backups and export are always free. If you change the list, update the pricing table in `editions/starter/site/index.html` to match.

Only public values go in this file; it ships inside the app. Never put API keys or passwords in it.

## 3. Build (1 minute)

```
node tools/build-edition.mjs
```

- [ ] It should finish **without** a "Not ready to sell yet" list.
- [ ] `dist/starter-site/` is the website: the landing page, with the app at `/app/`.
- [ ] `dist/soma-starter.zip` is the optional offline copy for buyers.

## 4. Test a real purchase (20 minutes): don't skip this

The license check was built and tested against simulated responses, because Polar's and Lemon Squeezy's servers weren't reachable from the environment it was written in. Test it once for real before launch:

- [ ] **Polar:** use Polar's sandbox first. Set `licensing.apiBase` to `https://sandbox-api.polar.sh` and use your sandbox organization ID, then rebuild. **Lemon Squeezy:** use its test mode.
- [ ] Open the built app (step 5, or any static host), buy Pro with a test card, then paste the key from the email into the app (any Pro feature → "Already bought it?").
- [ ] Check that the Board, themes and so on unlock, and that a made-up key is rejected.
- [ ] If activation says "Couldn't reach the license server" on a working connection, the provider may be blocking browser requests. Tell Claude and it can add a tiny relay (a free Cloudflare Worker).
- [ ] Switch `apiBase` back to `https://api.polar.sh` with your live organization ID, and rebuild.

## 5. Put it online (20 minutes)

- [ ] Buy a domain. **Pick it once and keep it**: each buyer's data is tied to the domain, so moving domains later empties everyone's app.
- [ ] Create a free Cloudflare Pages project (or Netlify), choose **upload**, and drag in the `dist/starter-site` folder.
- [ ] Connect your domain in the host's settings.
- [ ] Visit the site on your phone and computer. Try the free app, install it, and make sure "Try it free" and "Get Pro" go to the right places.

To publish an update later: change the code, run the build again, and upload the new `dist/starter-site` folder. Buyers get it automatically.

## 6. Housekeeping

- [ ] **Make this repository private.** It currently shows your research docs, `state.json` and these business plans to anyone. Free GitHub Pages doesn't work on private repos, so either upgrade to GitHub Pro or host your personal site on Cloudflare Pages too (free, works with private repos). Web app code is always readable in a browser, so this protects your private files rather than the code itself.
- [ ] **Legal:** have a professional look over `editions/starter/LICENSE.txt`, `editions/starter/site/privacy.html` and your refund policy. They're sensible templates, not legal advice. Your payment platform handles sales tax and the EU 14-day withdrawal rules as merchant of record.
- [ ] **Optional, for the privacy promise:** serve the font and chart library from your own site instead of Google Fonts and jsDelivr.
- [ ] **Optional:** delete the old Quest Board pages (`focus.html`, `detail.html`, `schedule.html`, `misc.html`, `tracker.html`, `help.html`) and the weekly-review GitHub Action from your personal site.

## 7. Launch

Follow the 8-week plan in `product/STRATEGY.md` (section 6):

1. Closed beta.
2. Soft launch to your email list.
3. Product Hunt and Show HN.
4. Affiliates.

The free plan is your demo: link people straight to `/app/`.
