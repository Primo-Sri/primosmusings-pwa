# Primosmusings PWA — File Inventory

## Live App

| URL | Purpose |
|---|---|
| https://primosmusings.web.app | Primary live URL |
| https://primosmusings-b47f7.web.app | Firebase default URL (same app) |

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
| Project ID | `primosmusings-b47f7` |
| Hosting target | `primosmusings` |
| Public directory | `.` (root of project folder) |
| Firebase Console | https://console.firebase.google.com/project/primosmusings-b47f7 |

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

The `.git` folder exists locally at `C:\Users\padik\Claude\Podcast\primosmusings-pwa\.git` but the repository has **no configured remote** — it is not connected to GitHub or any other remote host. Git is initialized but commits have not been made and no `origin` remote exists.

**To connect to GitHub in the future:**
1. Create a new repository on GitHub (e.g., `Primo-Sri/primosmusings-pwa`)
2. Run:
   ```
   git remote add origin https://github.com/Primo-Sri/primosmusings-pwa.git
   git branch -M main
   git push -u origin main
   ```

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
| Firebase Hosting | `primosmusings-b47f7` | App deployment |

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
