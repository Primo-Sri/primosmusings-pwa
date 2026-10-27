# Primosmusings

How episodes, newsletters, and polls get published is in [WORKFLOW.md](WORKFLOW.md). This page is how to see how many people use the website and play episodes here. Spotify for Creators still has the all-platform play total. These numbers sit next to that. They are only the Primosmusings site and the installed app.

## Usage analytics

Nothing is sent yet. The Firebase web app config in this repo has no measurement ID, so `analytics.js` ships with a placeholder and stays quiet until you paste a real one.

### 1. Turn on Google Analytics and get the measurement ID

Google Analytics 4 is free. You do not need a paid plan or a billing account.

1. Open the Firebase project **primosmusings-b47f7**: [Project settings → Integrations](https://console.firebase.google.com/project/primosmusings-b47f7/settings/integrations).
2. On the **Google Analytics** card, choose **Enable** (or **Link**). Sign in with the Google account that should own the numbers. Create a new property named Primosmusings, or link one you already have. Stay on the free property. Do not pick Analytics 360.
3. Copy the **measurement ID**. It looks like `G-1A2BCD3EFG`. Either place works:
   - Firebase → Project settings → General → Your apps → the web app → the config includes `measurementId`.
   - [Google Analytics](https://analytics.google.com/) → Admin → Data streams → the web stream → **Measurement ID** at the top right.

### 2. Paste the ID

Open `analytics.js`. The only line to change is the one marked at the top:

```javascript
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';
```

Replace `G-XXXXXXXXXX` with your ID, quotes included. Do not put the ID anywhere else. Episode pages, the newsletter page, and the app all read this file.

Leave the placeholder alone and the site keeps working exactly as it does now. No call is made to Google.

### 3. Deploy

From this folder, publish only this site's hosting:

```bash
firebase deploy --only hosting --project primosmusings-b47f7
```

That updates the **primosmusings** Hosting site (https://primosmusings.web.app). It does not deploy Firestore rules, and it does not touch any other Firebase project.

A push to `master` also deploys hosting, which is the usual path. Use the command above when you want to publish just this change.

### 4. Where to read the numbers

Open the property you linked in [Google Analytics](https://analytics.google.com/).

- **Realtime** (Reports → Realtime): open the site and play an episode. Within a minute you show up as an active user. The event list on that page shows each event below as it happens. Click `episode_play` to see the episode title, id, and where it was played.
- **Events** (Reports → Engagement → Events): the same events added up over days. `page_view` is a visit. `episode_play` is someone starting an episode on the site.
- The same property is what Firebase shows under **Analytics**, once the link from step 1 is done.

Event parameters (the episode title, for example) show on the Realtime hit right away. To break the longer Events report down by episode, add a custom dimension: Admin → Custom definitions → Create custom dimension → Scope **Event** → Event parameter `episode_title`. Do the same for `episode_id` and `play_source` if you want those as columns.

### Events

| Event | When it fires | Parameters |
|---|---|---|
| `page_view` | A visit to the app, an `/episodes/` page, `/daily/`, or `/nfl/` | page address (added by GA4) |
| `episode_play` | A new episode starts in the app player, the first play of the audio on an episode or newsletter page, or Spotify reports that playback started inside the embed | `episode_title`, `episode_id`, `episode_url`, `play_source` (`app`, `page_audio`, or `spotify_embed`) |
| `spotify_embed_interaction` | A click inside the Spotify player on the Listen tab (one per visit) | `embed_url` |
| `outbound_click` | A click that leaves for a listening app: Spotify, Apple Podcasts, YouTube, Amazon Music, iHeart, Pocket Casts, and the other podcast apps linked from the site | `platform`, `link_url`, `link_text` |

`play_source=app` matches the play that already increments the Home tab's list. Pausing and pressing play on the same episode is not a second play. A play inside the Spotify embed is counted only when the embed reports playback (`playback_started`, or a `playback_update` that goes from paused to playing). The click event is separate, because a tap on that player is not always a play.

The admin page is not tracked.
