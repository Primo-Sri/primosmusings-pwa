# Primosmusings — Episode Publishing Workflow

---

## Scenario A: New Episode with a NEW Guest

Use this when you publish an episode featuring someone who has never been on the show before.

---

### Step 1 — Publish on Spotify for Podcasters

Record and publish the episode as you normally do. Nothing changes here.

---

### Step 2 — Open Claude Code and update the app

Tell Claude something like:

> "New episode 649 with Joshua Smith. Here's the Spotify link: https://open.spotify.com/episode/..."

Claude will do the following — confirm each one before it pushes:

**In `index.html`:**
- Add the new guest to the `GUESTS` array (name, initials, sport, first episode)
- Update the episode count in all three places

**In `admin.html`:**
- Add the new guest's name to the `<datalist id="guest-names">` block
  (This is what makes their name appear in the dropdown on the admin page)

**In `sw.js`:**
- Bump the cache version number by 1

---

### Step 3 — Push to GitHub

```
git add index.html admin.html sw.js
git commit -m "Add [Guest Name] — episode [number]"
git push origin master
```

GitHub Actions auto-deploys to Firebase in about 1 minute. Check the Actions tab at:
https://github.com/Primo-Sri/primosmusings-pwa/actions

---

### Step 4 — Tag the episode in admin.html

Once the deploy is live:

1. Open **primosmusings.web.app/admin.html** on your phone
2. Sign in with your Firebase credentials
3. Find the new episode in the list (it'll be near the top — most recent first)
4. Tap the episode card to expand it
5. Tap the guest name field → your new guest appears in the dropdown
6. Select their name → tap **Save**
7. You'll see: ✓ Saved! Guest tagged successfully.

---

### Step 5 — Verify

Reload **primosmusings.web.app** and go to the **Guests** tab.
You should see the new guest card with their episode listed.
The "Guests" and "Guest Episodes" stat counts should both go up.

---

## Scenario B: New Episode with a RETURNING Guest

Use this when a guest has been on the show before and already exists in the app.

---

### Step 1 — Publish on Spotify for Podcasters

Same as always.

---

### Step 2 — Open Claude Code and update the app

Tell Claude something like:

> "New episode 650 with Amit Duvedi. Here's the Spotify link: ..."

Claude will:

**In `index.html`:**
- Add the new episode to that guest's existing entry in the `GUESTS` array
- Update the episode count

**In `sw.js`:**
- Bump the cache version

No changes needed to `admin.html` — the guest name is already in the dropdown.

---

### Step 3 — Push to GitHub

```
git add index.html sw.js
git commit -m "Add episode [number] — [Guest Name]"
git push origin master
```

---

### Step 4 — Tag in admin.html (optional but recommended)

Even for returning guests, tagging the new episode ensures the main app picks it up
automatically on load — without waiting for you to manually update the code every time.

1. Open **admin.html** on your phone
2. Sign in
3. Find the episode → select the guest from the dropdown → Save

---

### Step 5 — Verify

Reload the main app and check the Guests tab. The returning guest's episode count should go up by 1.

---

## Scenario C: Solo Episode (no guest)

No app changes needed. Just publish on Spotify for Podcasters and tell Claude to bump the episode count:

> "Solo episode 651 just dropped."

Claude will update the count and bump the cache. Push to deploy.

---

## Quick Reference

| What changed | Files to update |
|---|---|
| New guest added | `index.html` (GUESTS array + count) · `admin.html` (datalist) · `sw.js` (cache bump) |
| Returning guest, new episode | `index.html` (episode added + count) · `sw.js` (cache bump) |
| Solo episode | `index.html` (count only) · `sw.js` (cache bump) |

---

## Important Notes

- **Guest name must match exactly** between `index.html` and what you type/select in `admin.html`.
  The dropdown keeps this safe — always pick from the list for existing guests.
- **Firestore tags are the source of truth for new episodes** — once tagged, the main app reads
  them from Firestore automatically on every load. No redeploy needed just to show new tags.
- **Never push to GitHub without asking Claude to bump the SW cache version** (`sw.js`).
  If you forget, some users will see stale content until their browser refreshes on its own.
- **Admin page URL:** primosmusings.web.app/admin.html (bookmark this on your phone)
