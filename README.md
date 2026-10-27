# Primosmusings

How episodes, newsletters, and polls get published is in [WORKFLOW.md](WORKFLOW.md). This page is how to see how many people use the website and play episodes here. Spotify for Creators still has the all-platform play total. These numbers sit next to that. They are only the Primosmusings site and the installed app.

## Usage analytics

It's on. The measurement ID **G-C7JG53MTFV** (Firebase project primosmusings-b47f7) is set at the top of `analytics.js`. That's the only place it lives. Episode pages, the newsletter pages and the app all read that one file.

To switch analytics off, put the placeholder `G-XXXXXXXXXX` back on that line. Nothing is sent to Google then, and the site works exactly the same.

### Deploying

Merging to `master` deploys automatically (GitHub Actions). **Don't run `firebase deploy` by hand.** The nightly SEO job also commits and deploys, and a hand deploy from a local folder can put pages live that git doesn't have (that happened on Oct 15). See WORKFLOW.md.

### Where to read the numbers

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
