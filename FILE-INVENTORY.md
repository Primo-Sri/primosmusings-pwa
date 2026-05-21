# Primosmusings PWA — File Inventory

## Live App

| URL | Purpose |
|---|---|
| https://primos-apps.web.app | Primary live URL |
| https://primosmusings.web.app | Old project — no longer the active deployment |

---

## Local Project Directory

**Path:** `C:\Users\padik\Claude\Podcast\primosmusings-pwa\`

| File | Purpose | Last Modified |
|---|---|---|
| `index.html` | Entire app — all HTML, CSS, and JavaScript in one file | May 2026 |
| `sw.js` | Service worker — caching strategy, push notifications | May 2026 |
| `manifest.json` | PWA manifest — app name, icons, shortcuts, theme color | — |
| `firebase.json` | Firebase Hosting config — deploy target, cache headers for sw.js | — |
| `.firebaserc` | Firebase project binding — links to `primosmusings-b47f7` | — |
| `logo.jpg` | Podcast logo image used in header | — |
| `icon-192.png` | App icon 192×192 (Android home screen, notification badge) | — |
| `icon-512.png` | App icon 512×512 (splash screen, install prompt) | — |
| `apple-touch-icon.png` | iOS home screen icon | — |
| `index-redirect.html` | Redirect page (legacy, not part of main app) | — |
| `github-upload.html` | GitHub upload utility page (excluded from Firebase deploy) | — |
| `CHANGELOG.md` | Change history for this project | May 2026 |
| `FILE-INVENTORY.md` | This file | May 2026 |

---

## Firebase Project

| Property | Value |
|---|---|
| Project ID | `primos-apps` |
| Hosting target | `primos-apps` |
| Public directory | `.` (root of project folder) |
| Firebase Console | https://console.firebase.google.com/project/primos-apps |

**Deploy command:**
```
firebase deploy --only hosting
```
Run from: `C:\Users\padik\Claude\Podcast\primosmusings-pwa\`

**Files excluded from deploy** (defined in `firebase.json`):
- `firebase.json`
- All dotfiles (`.*`)
- `github-upload.html`

---

## Git Repository

| Property | Value |
|---|---|
| GitHub repo | https://github.com/Primo-Sri/primosmusings-pwa |
| Default branch | `main` |
| Local branch | `master` (tracks `origin/main`) |
| Last synced | May 2026 |

**Local path:** `C:\Users\padik\Claude\Podcast\primosmusings-pwa\`

**Standard workflow (from PC):**
1. Make changes to files locally
2. `git add <filename>`
3. `git commit -m "description"`
4. `git push origin master:main`
5. `firebase deploy --only hosting`

---

## Mobile Management (Pending Setup)

**Goal:** Edit and deploy the app from a phone, no PC required.

**Status:** GitHub Mobile is ready to use for browsing and editing files. Auto-deploy to Firebase is not yet configured — changes committed from mobile do not go live until `firebase deploy` is run manually on the PC.

### What works today on mobile

- Browse all files in the repo via the GitHub app
- Edit files and commit directly from the phone
- Changes appear on GitHub immediately

**GitHub Mobile app:**
- iPhone: App Store → "GitHub"
- Android: Play Store → "GitHub"
- Sign in as `Primo-Sri`

### Pending: GitHub Actions auto-deploy

Once set up, every commit pushed to GitHub (including from mobile) will automatically deploy to Firebase — no terminal needed.

**One-time setup steps (do from PC when ready):**

1. Run this command in the project folder to get a Firebase deploy token:
   ```
   firebase login:ci
   ```
   It opens a browser, you log in, and it prints a long token string. Copy it.

2. Go to: https://github.com/Primo-Sri/primosmusings-pwa/settings/secrets/actions
   - Click **New repository secret**
   - Name: `FIREBASE_TOKEN`
   - Value: paste the token from step 1
   - Click **Add secret**

3. Ask Claude Code to create `.github/workflows/deploy.yml` — this is the file that triggers the auto-deploy on every push to `main`.

4. Commit and push the workflow file. From that point on, any commit to `main` (including edits made on GitHub Mobile) will automatically deploy to Firebase within ~2 minutes.

---

## Claude Code Skill

**Skill name:** `podcast-update`

**Skill location:**
```
C:\Users\padik\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\
  03a0a14a-df8e-4cbe-acdd-3f92018bde00\
  93f6d0b8-a9e9-4675-a497-4db2cf046767\
  skills\podcast-update\SKILL.md
```

| File | Purpose |
|---|---|
| `SKILL.md` | Skill instructions — workflow, file paths, edge cases |
| `evals/evals.json` | Three test cases for validating the skill |

**What the skill automates after every new episode:**
1. Bumps `CACHE_NAME` version in `sw.js`
2. Updates episode count in all three locations in `index.html`
3. Appends guest episode data (if applicable)
4. Reminds to run Firebase deploy

---

## Related External Services

| Service | URL / ID | Purpose |
|---|---|---|
| Spotify Podcast | https://open.spotify.com/show/primosmusings | Primary episode platform |
| Amazon Music | `26244d08-ef1b-430e-8e03-38f33efb7adb` | Secondary episode platform |
| Blogger RSS | Referenced in `enrichGuestsFromRSS()` | Auto-enriches guest episode data |
| Firebase Hosting | `primos-apps` | App deployment |

---

## Key Sections Inside `index.html`

| What | Where to find it |
|---|---|
| Episode count | Search for `stat-number` — appears in 3 spots (lines ~728, ~834, ~851) |
| GUESTS array | Line 1304 — `const GUESTS = [` |
| Service worker registration | Near end of file — search `serviceWorker` |
| Help / FAQ tab HTML | `id="page-help"` section |
| `toggleFaq()` function | Search `toggleFaq` |
| `switchTab()` function | Search `function switchTab` |
| `enrichGuestsFromRSS()` | Search `enrichGuestsFromRSS` |
| Nav bar buttons | Search `class="nav-btn"` |
