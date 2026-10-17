# Primosmusings PWA — Changelog

All notable changes to the app are recorded here. Most recent first.

---

## v50 — 2026-10-17
- **New: Primos Daily Bite** at `/daily/`, the morning newsletter. Today's issue is on top and past issues are listed by month, each with its own shareable link and a player for that day's News Bites episode (matched by publish date)
- **Admin: Daily Bite section.** Pick the image, type a one-line headline, Publish. It's live instantly, with no deploy. The image is shrunk automatically, admin asks before replacing an existing date, and Recent issues has View and Remove
- **App:** a "Primos Daily Bite" card on the Home tab (latest date + headline, hidden until the first issue) and a Daily Bite item at the top of More
- **Firestore rules:** `dailyBites` and `dailyBiteImages`, which anyone can read and only the signed-in admin can write
- **Service worker fix:** folder pages like `/daily/` and `/episodes/` now always load fresh. Before this, they were cached until the next app version
- **Sitemap:** `/daily/` added (takes effect on the next nightly SEO run)

## Nightly SEO refresh — 2026-10-16
- **New GitHub job** (`.github/workflows/daily-seo-refresh.yml`) rebuilds the `/episodes/` pages every night at ~10 PM Eastern. If any page changed, it commits the pages to `master` and deploys. Otherwise it does nothing. It has a manual "Run workflow" button
- Checks that `sitemap.xml`, `robots.txt`, the Google check file and the episodes index exist before it commits or deploys
- Generator script: refuses to rebuild if the feed returns fewer episodes than we have pages (stops a feed glitch wiping the archive); 30-second feed timeout; exits cleanly on errors (fixes a Node crash on Windows)
- Brought the pages generated and deployed by hand on Oct 15 into git (Oct 14 News Bites, renamed Week 5 recap), so a normal push no longer removes them
- WORKFLOW.md: the SEO section is now "automatic, nothing to do"; push commands no longer include `episodes/` or `sitemap.xml`

## v49 — 2026-10-13
- Updated all-time plays total to 10,677 (manual figure)

## SEO pages + docs — 2026-10-13
- **Fixed "Listen on Spotify" on all 743 episode pages.** They linked to podcasters.spotify.com, which sends listeners to a creator login page. The generator now uses a real open.spotify.com link when there is one, otherwise a Spotify search for the episode title (same rule the app uses)
- WORKFLOW.md: added the "Refresh the SEO Pages" step for every new episode, and added `episodes/` + `sitemap.xml` to the push commands
- FILE-INVENTORY.md: listed the SEO files (`episodes/`, generator script, sitemap, robots.txt, Search Console check file)
- Confirmed the generator is repeatable: a rerun with no new episodes changes nothing in git

## v48 — 2026-10-13
- Added a crawlable "Episode archive" link block at the bottom of the Home tab, pointing to /episodes/ so search engines can discover every episode page
- SEO head tags (description, canonical, Open Graph, Twitter card, PodcastSeries JSON-LD) now ship with this release

## v47 — 2026-09-14
- Updated all-time plays total to 8,969 (weekly manual figure)

## admin — 2026-09-07
- Added a "↻ Refresh" button on admin.html's Tag a Guest section
- Pulls episodes live from the RSS feed on demand, instead of waiting for the main app to refresh the Firestore cache
- Fixes the "new episode doesn't show up in admin" issue right after publishing

## v46 — 2026-09-06
- Updated all-time plays total to 8,826 (weekly manual figure)

## v45 — 2026-06-17
- Updated all-time plays total to 8,491 (weekly manual figure)
- Trending label now reads "plays & downloads" to match how Sri tracks the number
- Added ENHANCEMENTS.md — backlog of parked ideas (batch episode tagging, Home tab shelves)

## v44 — 2026-06-17
- **Admin: tag multiple guests on one episode** — each episode now shows removable guest chips instead of one text field
- Type a name and hit "Add guest" (or Enter) to add another guest to the same episode
- Header badge shows "✓ 3 guests" when an episode has more than one
- Main app already supported multiple guest tags per episode — this closes the gap on the admin side

## v43 — 2026-06-17
- **Trending section on Home tab** — visible to all users
  - All-time total plays badge (manual figure, update via `MANUAL_TOTAL_PLAYS` in index.html — Sri updates weekly)
  - Live Top 5 most-played episodes pulled from in-app playStats, tap to play
- Same play data now powers both the public Trending section and the admin Top Played view

## v42 — 2026-06-17
- **In-app play analytics** — every play in the app is counted per episode in Firestore (playStats collection)
- Admin page shows "Top Played" — top 10 episodes by in-app plays with play count and last-played date
- Firestore rules updated for the playStats collection (needs manual rules deploy)

## v41 — 2026-06-17
- Search results now play episodes in the in-app player instead of opening a generic Spotify page
- Applies to episode results, guest episode results, and transcript results
- Episodes not found in the feed still fall back to a Spotify link

## v40 — 2026-06-17
- Listen tab "By Sport" view now sorts episodes by actual air date (matched from the RSS feed), newest first
- Episode cards show the full air date instead of just the year when available

## v39 — 2026-06-17
- Follow button now adapts on narrow screens (installed app): icon-only circle so it never gets squeezed

## v38 — 2026-06-17
- Added "Follow" button (Spotify green) to the mini player — drives Spotify follows while users listen in-app

## v37 — 2026-06-17
- **Native audio player** — episodes now play directly in the app from the podcast feed's own audio files (same files Spotify plays)
- Works for ALL episodes, not just ones with Spotify episode links
- Player bar: play/pause, ±15s skip, scrubber, episode title, close button
- Lock-screen / notification controls on phones via Media Session API
- Audio keeps playing while browsing other tabs
- Replaces the v36 Spotify embed approach (which only covered a handful of episodes)

## v36 — 2026-06-17
- **New: In-app mini player** — tapping Play on an episode with a Spotify episode link now opens an embedded player above the nav bar; audio plays inside the app while browsing other tabs
- Episodes without a direct Spotify episode URL still open Spotify search as before
- Close button (✕) dismisses the player and stops playback

## v35 — 2026-06-17
- Guest list now sorted by most recent episode year (most recently active guest first)
- Top Guests podium still ranked by total appearances

## v34 — 2026-06-17
- Moved platform note ("Episode links open in Spotify…") to top of guest list
- Note includes a tap-through link to the Listen tab for other platforms

## v33 — 2026-06-17
- Added platform note at bottom of Guests tab pointing users to Listen tab for non-Spotify platforms

## v32 — 2026-06-17
- Sport filter pills now wrap to multiple rows instead of horizontal scroll (better mobile UX)

## v31 — 2026-06-17
- Restored sport filter pills on Guests tab (All · NFL · F1 · Golf · Tennis · etc.)
- Guests ranked by appearances; tap a pill to filter by sport

## v30 — 2026-06-16
- **New: Primo tab (⭐)** — dedicated host profile with stats, bio, sport chips, and all 6 platform links
- **Blog moved to More** — Blog is now a menu item under More, alongside About Me and Podcast Links
- Guests tab redesigned with sport sections grouped by category

## v29 — 2026-06-16
- Added David Janson as new guest (F1 expert)
- Added to GUESTS array with F1 sport category and datalist dropdown in admin.html

## v28 — 2026-06-15
- Smarter service worker updates:
  - Silent auto-activate on fresh app open (no banner)
  - "New version available" banner shown only during active sessions
  - Update check triggered when user returns to the app (visibilitychange)
  - Update check interval reduced from 30 min to 10 min

## v27 — 2026-06-15
- Added "New version available" banner with Refresh button
- Users mid-session see the banner; tapping Refresh activates the new version instantly

## v26 — 2026-06-15
- Admin portal RSS feed switched to Cloudflare Worker proxy (all episodes now load)

## v25 — 2026-06-15
- Main app RSS feed switched to Cloudflare Worker (primosmusings-rss.primosmusings.workers.dev)
- All 647+ episodes now load reliably — no more third-party CORS proxy dependency

## v24 — 2026-06-14
- Fixed episode links: broken `podcasters.spotify.com` URLs now fall back to Spotify search
- Added `spotifyLink()` helper used across episode cards, guest links, and search results

## v23 — 2026-06-14
- Added more CORS proxies to restore full episode list after rss2json 10-item cap
- Direct RSS fetch now tried first; rss2json is last resort only

## v22 — 2026-06-14
- Fixed episode count toggling to "10+" — now only updates count display when 15+ episodes load
- Fixed episode list showing only 10 — CORS proxies now tried before rss2json

## Earlier
- Phase 3: Transcript search — SRT upload in admin.html, Firestore word-index search in main app
- Guest name dropdown (datalist) added to admin.html to prevent name mismatches
- WORKFLOW.md created — step-by-step guide for publishing new episodes
- Firebase Auth added to admin.html (replaced hardcoded password)
- Cloudflare Worker set up as permanent CORS proxy for RSS feed

---

## How versions work
Each deploy bumps the service worker cache version (`sw.js`). Users automatically receive the update on their next app open or when they return to the app.
