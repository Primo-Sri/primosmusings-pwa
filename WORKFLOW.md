# Primosmusings — Episode Publishing Workflow

---

## Scenario A: New Episode with a NEW Guest

Use this when you publish an episode featuring someone who has never been on the show before.

---

### Step 1 — Publish on Spotify for Podcasters

Record and publish the episode as you normally do. Nothing changes here.

---

### Step 2 — Open Claude Code and update the episode count

Tell Claude something like:

> "New episode 649, solo" or "New episode 649 with a new guest, just need the count updated."

Claude will:
- Update the episode count in `index.html`
- Bump the cache version in `sw.js`

---

### Step 3 — Push to GitHub

```
git add index.html sw.js
git commit -m "Episode 649"
git push origin master
```

Auto-deploys in about 1 minute.

---

### Step 4 — Tag the episode in admin.html

1. Open **primosmusings.web.app/admin.html** on your phone
2. Sign in
3. Find the new episode → tap to expand
4. Type the guest's name in the field (free text — new guest, so no dropdown match yet)
5. Tap **Save** → ✓ Saved!

The guest will now appear automatically in the main app's Guests tab on the next load.
Their card will show their name and this episode. No code needed.

---

### Step 5 — Tell Claude about the new guest (when ready)

When you want the guest fully set up with sports categories and proper filtering, just say:

> "New guest: Joshua Smith, plays NFL. Add him properly."

Claude will add them to the `GUESTS` array in `index.html` and to the dropdown in `admin.html`.
Until then, the tag alone is enough for them to show up in the app.

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

| What changed | Files to update | Also do |
|---|---|---|
| New guest | `index.html` (count) · `sw.js` | Tag in admin.html — guest appears automatically |
| Returning guest | `index.html` (count) · `sw.js` | Tag in admin.html to add the new episode |
| Solo episode | `index.html` (count) · `sw.js` | Nothing — no tagging needed |
| Add full guest profile later | `index.html` (GUESTS array) · `admin.html` (datalist) · `sw.js` | Tell Claude: "New guest: Name, Sport" |

---

## Important Notes

- **Guest name must match exactly** between `index.html` and what you type/select in `admin.html`.
  The dropdown keeps this safe — always pick from the list for existing guests.
- **Firestore tags are the source of truth for new episodes** — once tagged, the main app reads
  them from Firestore automatically on every load. No redeploy needed just to show new tags.
- **Never push to GitHub without asking Claude to bump the SW cache version** (`sw.js`).
  If you forget, some users will see stale content until their browser refreshes on its own.
- **Admin page URL:** primosmusings.web.app/admin.html (bookmark this on your phone)
