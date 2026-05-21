# Primosmusings PWA — Changelog

---

## Roadmap

### Phase 1 — Auto-deploy from GitHub *(next up)*
Set up GitHub Actions so any push to `main` automatically deploys to Firebase.
No terminal needed — works from phone, Claude Code, anywhere.
See setup steps in `FILE-INVENTORY.md` under "Mobile Management".

### Phase 2 — Mobile guest tagging *(future)*
A lightweight admin page that:
- Reads the RSS feed and lists recent episodes
- You tap an episode → select a guest → save
- Writes to Firestore
- PWA reads guest data from Firestore instead of the hardcoded `GUESTS` array

This removes the need for Claude Code for routine episode-to-guest tagging.
The full workflow becomes: publish on Spotify → open admin on phone → tag guest → done.

**Why Firestore?** The `GUESTS` array is currently baked into `index.html` — every
update requires editing code and deploying. Firestore moves that data out of the
code so it can be updated from a simple form without touching the app itself.

---

## Session: May 2026

---

### 1. Guest Episode Data Sync (`index.html`)

The `GUESTS` array was out of date compared to the published episode list. The following episodes were added:

| Guest | Episodes Added |
|---|---|
| Amit Duvedi | NFL Musings – Dec 31 (2025), 2025 Patriots Season Preview |
| Joshua Kean | 2025 College Football Championship Preview (Spotify), 2025 CFP Championship Game Preview (Amazon Music), 2024 CFP Final Four Preview, 2024 College Football Playoffs Preview |
| Christopher Rogers | 2024 Copa America / UEFA QF-SF Predictions, 2024 Copa America / UEFA Cup Preview |
| Mel Simon | 400 Miles Done, Update from Ohio, Wyoming Here We Come, Mel Update – Journey Across America, Mel in Montana, Mel Checks In from Fort Collins, Gratitude and Appreciation |
| Aneesh Sridhar | Celtics Win Championship (2024), 2024 Patriots / AFC East Preview |
| Dr Satish Narayanan | Formula 1 – 2025 Season Preview |

---

### 2. Service Worker Rewrite (`sw.js`)

**Cache version bumped:** `primosmusings-v5` → `primosmusings-v6`

Bumping the cache version forces all devices (Android, iOS, Edge, Chrome) to discard the old cached version and download fresh content on next load. Any time new content is deployed, this number must be incremented.

**New: Network-first with 4-second timeout**

Added a `networkFirst(request, timeoutMs)` function. For the HTML page and manifest, the service worker now:
1. Tries to fetch fresh from the network
2. If the network doesn't respond within 4 seconds, falls back to the cached version
3. On success, caches the fresh response for future offline use

This prevents the app from hanging indefinitely on slow mobile connections while still ensuring users normally see the latest content.

**Strategy per resource type:**
- `index.html` and `manifest.json` — network-first with 4s timeout
- Images and icons — cache-first (they don't change between versions)
- Cross-origin requests (Spotify, RSS, Blogger) — always network, never cached

**Firebase hosting header:** `sw.js` is served with `Cache-Control: no-cache` so browsers always fetch the latest service worker file.

---

### 3. Auto-reload on SW Update (`index.html`)

Added two mechanisms so users automatically get fresh content after a deploy, without manually clearing cache:

**Periodic update check:** Every 30 minutes while the app is open, it calls `reg.update()` to check if a new service worker is available.

**Auto-reload on takeover:** When a new service worker activates and takes control, the `controllerchange` event fires and triggers `window.location.reload()`. A `refreshing` guard prevents infinite loops.

```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    setInterval(() => reg.update(), 30 * 60 * 1000);
  });
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
}
```

---

### 4. Help / FAQ Tab (`index.html`)

Added a sixth navigation tab — **Help (❓)** — with step-by-step cache-clearing instructions for every major platform, plus general app FAQs. The tab uses an accordion layout (click to expand/collapse each card).

**Cards included:**
- Why the app sometimes shows old content (explains caching)
- Microsoft Edge (desktop) — Settings → Privacy → Clear browsing data
- Google Chrome (desktop) — Settings → Privacy → Clear browsing data
- Android Chrome — Settings → Site settings → primosmusings.web.app → Clear & reset
- iPhone / iPad Safari — Settings → Safari → Clear History and Website Data
- Mac Safari — Safari menu → Clear History
- Firefox (desktop) — Settings → Privacy → Clear Data
- App shortcuts reference (navigate directly to Episodes or Picks)
- General FAQ (episodes not loading, guest list, contact form)

**New CSS classes:** `.faq-card`, `.faq-header`, `.faq-body`, `.faq-steps`, `.faq-note`, `.kbd`, `.platform-badge-lg`

**New JS function:** `toggleFaq(id)` — toggles the `.open` class on a `.faq-card` to show/hide the body.

---

### 5. podcast-update Skill (Claude Code)

Created a reusable Claude Code skill that automates all post-episode publishing tasks. After invoking it (e.g., "new episode 628, solo" or "ep 629 just dropped with Mel Simon"), it:

1. Reads current state from `sw.js` and `index.html` silently
2. Asks only what it doesn't know (episode number, guest name, Spotify link)
3. Bumps the SW cache version by 1
4. Updates the episode count in all three locations in `index.html`
5. Appends to an existing guest entry or creates a new one
6. Reminds you to run `firebase deploy --only hosting`

**Skill location:** `...\skills\podcast-update\SKILL.md` (Claude Code skills plugin)

**Trigger phrases:** "new episode", "just published", "bump the cache", "podcast update", "ep [number]", "episode [number] is live"

---

## Deploy command

After any of these changes, deploy with:

```
firebase deploy --only hosting
```

Run this from `C:\Users\padik\Claude\Podcast\primosmusings-pwa\`.
