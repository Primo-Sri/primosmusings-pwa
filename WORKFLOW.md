# Primosmusings — Episode Publishing Workflow

> **SEO episode pages update themselves every night.** You don't do anything for them.
> See **SEO Pages — Automatic, Nothing To Do** near the bottom.
>
> **Daily Bite newsletter:** publish it from your phone in admin.html. See **Daily Bite — Publish the Morning Newsletter**.

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

## Daily Bite — Publish the Morning Newsletter

Your Primos Daily Bite lives at **primosmusings.web.app/daily/**. Today's issue is at the top,
past issues are listed by month below it, and every issue has its own link to share.

Every morning:
1. **Save the image from Grok.** Phone: press and hold the image → Save to Photos. PC: download it.
2. Open **primosmusings.web.app/admin.html** and sign in.
3. In **Daily Bite**: tap **Choose image** → pick it → type the **one-line headline** → check the
   date (it's already set to today) → tap **Publish**.
4. Tap **View it →** to see it live.

That's it. It goes live the moment you tap Publish. No push, no deploy, no Claude needed.

Good to know:
- **The headline matters.** Google can't read the words inside an image. The headline is what it reads.
- **The episode links itself.** Each issue gets a player for that day's News Bites, found by publish date. If the newsletter goes up before the episode, the player appears on its own once the episode is in the feed.
- **Publishing the same date again** asks before replacing the old one.
- **Made a mistake?** Under **Recent issues** in admin, tap **Remove**. It can't be undone.
- The image is shrunk automatically (admin shows the before and after size) so it loads fast.
- The app's Home tab shows a Daily Bite card with the latest headline, and **More → Daily Bite** opens the page.

---

## SEO Pages — Automatic, Nothing To Do

Every episode has its own page at `primosmusings.web.app/episodes/`, so Google can find it.
**A GitHub job rebuilds those pages every night at about 10 PM Eastern** (9 PM after the clocks
change on Nov 1). It is the file `.github/workflows/daily-seo-refresh.yml`.

Each night it:
1. Reads the podcast feed and rebuilds every episode page
2. Does nothing if no episode page changed (no commit, no deploy)
3. If there are new episodes: checks that `sitemap.xml`, `robots.txt`, the Google check file and the episodes index are all still there, commits the new pages to `master`, and deploys

**Do not run `node scripts/generate-episodes.mjs` or `firebase deploy` by hand.** Deploying from
your folder puts pages on the live site that git doesn't have, and the next normal push removes
them. That already happened once (Oct 15). Let the job do it.

Good to know:
- A new episode appears in `/episodes/` the night it is published, not instantly.
- Need it sooner? GitHub → Actions → **Daily SEO episode pages** → **Run workflow**. Or ask Claude to trigger it.
- If a run fails, GitHub emails you and the log is in the Actions tab. A failed run never deploys.
- The script refuses to rebuild if the feed returns fewer episodes than we already have pages for. That stops a feed glitch from wiping the archive. If episodes were really removed, run it with `ALLOW_SHRINK=1`.
- Because the job commits to `master`, Claude pulls before pushing app changes.
- When you edit an episode title on Spotify, its page address changes and the old address stops working.
- Once in a while, open Google Search Console and resubmit `sitemap.xml` so Google rereads it sooner.

---

## Quick Reference

| What changed | Files to update | Also do |
|---|---|---|
| Any new episode (SEO pages) | Nothing — built automatically every night (~10 PM ET) | Don't run the generator or `firebase deploy` by hand |
| Daily Bite newsletter | Nothing — publish in admin.html → Daily Bite | Live instantly at /daily/ |
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
