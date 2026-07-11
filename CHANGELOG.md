# Primosmusings PWA — Changelog

All notable changes to the app are recorded here. Most recent first.

---

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
