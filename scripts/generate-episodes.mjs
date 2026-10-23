/**
 * generate-episodes.mjs
 * Additive SEO: builds crawlable /episodes/*.html + updates sitemap.xml from RSS.
 * Does not delete existing app files (only regenerates files inside episodes/).
 *
 * Usage: node scripts/generate-episodes.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'episodes');
const RSS_URL = 'https://anchor.fm/s/d9746d30/podcast/rss';
const SITE = 'https://primosmusings.web.app';
const SPOTIFY_SHOW = 'https://open.spotify.com/show/0rN6FI7HAsjcm7Y19FMo0J';
const APPLE = 'https://podcasts.apple.com/us/podcast/primosmusings/id1672851730';
const APPLE_LOOKUP = 'https://itunes.apple.com/lookup?id=1672851730&entity=podcastEpisode&limit=200';
const SUBSTACK = 'https://primosmusings.substack.com';
const OG_IMAGE = `${SITE}/og-image-1200x630.jpg`;
const HOST = "Sridhar 'Primo' Srinivasan";

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(title, guid) {
  let base = String(title || 'episode')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  if (!base) base = 'episode';
  const short = String(guid || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-8)
    .toLowerCase();
  return short ? `${base}-${short}` : base;
}

function cdataOrText(block, tag) {
  const cdata = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
  if (cdata) return cdata[1];
  const plain = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return plain ? plain[1] : '';
}

function parseItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const title = cdataOrText(block, 'title').trim();
    const description = cdataOrText(block, 'description');
    const link = cdataOrText(block, 'link').trim();
    const guid = (cdataOrText(block, 'guid') || link || title).trim();
    const pubDate = cdataOrText(block, 'pubDate').trim();
    const duration = (block.match(/<itunes:duration>([^<]*)<\/itunes:duration>/i) || [])[1] || '';
    const enc = block.match(/<enclosure[^>]*url="([^"]+)"/i);
    const audio = enc ? enc[1] : '';
    const audioType = (block.match(/<enclosure[^>]*type="([^"]+)"/i) || [])[1] || '';
    const img = (block.match(/<itunes:image[^>]*href="([^"]+)"/i) || [])[1] || OG_IMAGE;
    // The feed's real episode ID, for matching Apple links. The feed writes
    // <guid isPermaLink="false">, which cdataOrText can't read, so `guid` above has always
    // fallen back to the link. Leave `guid` as is: the page addresses are built from it.
    const feedGuid = ((block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i) || [])[1] || '')
      .replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    // Show notes: the longest of the description, <itunes:summary> and <content:encoded>.
    // The description itself is kept as is (it still feeds the meta description).
    const notes = [description, cdataOrText(block, 'itunes:summary'), cdataOrText(block, 'content:encoded')]
      .reduce((best, s) => (stripHtml(s).length > stripHtml(best).length ? s : best), '');
    items.push({ title, description, notes, link, guid, feedGuid, pubDate, duration, audio, audioType, img });
  }
  return items;
}

// Episode links on Apple Podcasts, keyed by the feed's <guid>. Apple returns the newest
// 200 episodes; older ones use the show link. Never fails the build.
async function fetchAppleLinks() {
  const links = new Map();
  try {
    const res = await fetch(APPLE_LOOKUP, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    for (const r of data.results || []) {
      if (r.wrapperType === 'podcastEpisode' && r.episodeGuid &&
          /^https:\/\/podcasts\.apple\.com\//.test(r.trackViewUrl || '')) {
        links.set(r.episodeGuid, r.trackViewUrl.replace(/[?&]uo=\d+$/, ''));  // drop Apple's tracking tag
      }
    }
    console.log(`Apple episode links: ${links.size}`);
  } catch (e) {
    console.log(`Apple episode links unavailable (${e.message}); every page uses the show link.`);
  }
  return links;
}

// Matches the app's names: News Bites, NFL Preview, NFL Recap; everything else is Sports.
function categoryOf(title) {
  const t = String(title || '');
  if (/news\s*bites/i.test(t)) return 'Primos News Bites';
  if (/\bnfl\b/i.test(t) && /preview/i.test(t)) return 'NFL Preview';
  if (/\bnfl\b/i.test(t) && /recap/i.test(t)) return 'NFL Recap';
  return 'Sports';
}

function categoryHub(category) {
  if (category === 'Primos News Bites') return '/daily/';
  if (category === 'NFL Preview' || category === 'NFL Recap') return '/nfl/';
  return '';
}

// "00:12:37" / "12:37" / "757" → seconds
function durationSeconds(d) {
  const s = String(d || '').trim();
  if (!s) return 0;
  if (/^\d+$/.test(s)) return Number(s);
  const parts = s.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  return parts.reduce((total, p) => total * 60 + p, 0);
}

// ISO 8601 for schema.org: 757 seconds → "PT12M37S"
function isoDuration(d) {
  const secs = durationSeconds(d);
  if (!secs) return undefined;
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  return 'PT' + (h ? h + 'H' : '') + (m ? m + 'M' : '') + (s ? s + 'S' : '');
}

function minutesOf(d) {
  const secs = durationSeconds(d);
  return secs ? Math.max(1, Math.round(secs / 60)) : 0;
}

// Publish date as people read it, in Eastern time (when the show is published).
function readableDate(pubDate) {
  const t = Date.parse(pubDate);
  if (isNaN(t)) return '';
  return new Date(t).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' });
}

function encodingFormat(type, url) {
  if (/m4a|mp4|aac/i.test(type) || /\.m4a(\?|$)/i.test(url)) return 'audio/mp4';
  return 'audio/mpeg';
}

// Makes bare links in the show notes clickable, without touching existing <a> links.
function linkify(notes) {
  const URL_RE = /\bhttps?:\/\/[^\s<>"']+/g;
  const wrap = (url) => {
    const trimmed = url.replace(/[.,;:!?)\]]+$/, '');
    return `<a href="${trimmed}" rel="noopener">${trimmed}</a>${url.slice(trimmed.length)}`;
  };
  if (!/<[a-z][\s\S]*>/i.test(notes)) {
    return `<p>${escapeHtml(stripHtml(notes)).replace(URL_RE, wrap)}</p>`;
  }
  let insideLink = false;
  return notes.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith('<')) {
      if (/^<a[\s>]/i.test(part)) insideLink = true;
      if (/^<\/a>/i.test(part)) insideLink = false;
      return part;
    }
    return insideLink ? part : part.replace(URL_RE, wrap);
  }).join('');
}

// "an" before 8, 11, 18 and 80–89 ("an 8-minute"), "a" otherwise.
function articleFor(minutes) {
  return minutes === 8 || minutes === 11 || minutes === 18 || (minutes >= 80 && minutes < 90) ? 'an' : 'a';
}

function aboutSentence(ep, category, date, minutes) {
  const kind = { 'Primos News Bites': 'Primos News Bites episode', 'NFL Preview': 'NFL Preview', 'NFL Recap': 'NFL Recap', Sports: 'sports episode' }[category];
  const lead = minutes
    ? `${articleFor(minutes)} ${minutes}-minute ${kind}`
    : `${/^[aeiou]|^NFL/i.test(kind) ? 'an' : 'a'} ${kind}`;
  return `“${ep.title}” is ${lead} from Primosmusings${date ? `, published ${date}` : ''}, hosted by ${HOST}.`;
}

// JSON-LD inside <script>: escape "<" so a title can never close the tag early.
function jsonLd(data) {
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}\n</script>`;
}

function episodeHtml(ep, slug, ctx) {
  const plain = stripHtml(ep.description) || ep.title;
  const descMeta = escapeHtml(plain.slice(0, 160));
  const titleEsc = escapeHtml(ep.title);
  const canonical = `${SITE}/episodes/${slug}.html`;
  const pubIso = ep.pubDate ? new Date(ep.pubDate).toISOString() : '';
  // podcasters.spotify.com links send listeners to a creator login page, so only
  // trust real open.spotify.com links. Otherwise search by title (same rule as the app).
  const listenSpotify = /^https:\/\/open\.spotify\.com\//.test(ep.link)
    ? ep.link
    : ep.title
      ? `https://open.spotify.com/search/${encodeURIComponent(ep.title)}`
      : SPOTIFY_SHOW;
  const category = ep.category;
  const hub = categoryHub(category);
  const date = readableDate(ep.pubDate);
  const minutes = minutesOf(ep.duration);
  const duration = isoDuration(ep.duration);
  const notesHtml = linkify(ep.notes || ep.description || ep.title);
  const meta = [date, minutes ? `${minutes} min` : '', category].filter(Boolean).join(' · ');
  const relatedHeading = `More ${category === 'Sports' ? 'sports' : category} episodes`;

  const episodeLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: ep.title,
    description: plain,
    datePublished: pubIso || undefined,
    url: canonical,
    image: ep.img,
    duration,
    timeRequired: duration,
    genre: category,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'PrimosMusings',
      url: SITE + '/',
      webFeed: RSS_URL,
    },
    associatedMedia: ep.audio
      ? { '@type': 'MediaObject', contentUrl: ep.audio, encodingFormat: encodingFormat(ep.audioType, ep.audio) }
      : undefined,
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Episodes', item: SITE + '/episodes/' },
      { '@type': 'ListItem', position: 3, name: ep.title, item: canonical },
    ],
  };

  const pageLink = (row, label, cls) => row
    ? `<a class="${cls}" href="/episodes/${row.slug}.html"><span>${label}</span>${escapeHtml(row.title)}</a>`
    : '';
  const related = ctx.related.length
    ? `<section class="related">
      <h2>${escapeHtml(relatedHeading)}</h2>
      <ul>
${ctx.related.map((r) => `        <li><a href="/episodes/${r.slug}.html">${escapeHtml(r.title)}</a><span class="d">${escapeHtml(readableDate(r.pubDate))}</span></li>`).join('\n')}
      </ul>
    </section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titleEsc} | Primosmusings</title>
<meta name="description" content="${descMeta}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Primosmusings">
<meta property="og:title" content="${titleEsc}">
<meta property="og:description" content="${descMeta}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${escapeHtml(ep.img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${titleEsc}">
<meta name="twitter:description" content="${descMeta}">
<meta name="twitter:image" content="${escapeHtml(ep.img)}">
<link rel="icon" href="/icon-192.png">
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#0a0a0a;color:#f0f0f0;line-height:1.5}
  a{color:#4d9ef7}
  .wrap{max-width:720px;margin:0 auto;padding:24px 16px 64px}
  .crumbs{font-size:.75rem;color:#888;margin-bottom:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .crumbs a{color:#4d9ef7;text-decoration:none}
  h1{font-size:1.45rem;margin:0 0 8px;line-height:1.25}
  .cat{display:inline-block;font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#e8aa30;text-decoration:none;margin-bottom:6px}
  .meta{color:#888;font-size:.85rem;margin-bottom:20px}
  .cta{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0 10px}
  .btn{display:inline-block;padding:12px 18px;border-radius:24px;font-weight:700;text-decoration:none;font-size:.9rem}
  .btn-spotify{background:#1DB954;color:#000}
  .btn-apple{background:#fc3c44;color:#fff}
  .btn-home{background:#1e1e1e;color:#fff;border:1px solid #333}
  .links{font-size:.85rem;margin:0 0 20px}
  audio{display:block;width:100%;margin:0 0 20px}
  .desc{background:#141414;border:1px solid #282828;border-radius:12px;padding:16px;margin:20px 0;overflow-wrap:anywhere}
  .desc p{margin:0 0 10px}
  .about{color:#bbb;font-size:.9rem}
  .pager{display:flex;gap:10px;margin:28px 0}
  .pager a{flex:1;background:#141414;border:1px solid #282828;border-radius:12px;padding:12px;text-decoration:none;color:#f0f0f0;font-size:.85rem}
  .pager a span{display:block;color:#4d9ef7;font-size:.75rem;font-weight:700;margin-bottom:4px}
  .pager .next{text-align:right}
  .related h2{font-size:1rem;margin:28px 0 8px}
  .related ul{list-style:none;padding:0;margin:0}
  .related li{padding:10px 0;border-bottom:1px solid #222;display:flex;flex-direction:column;gap:2px}
  .d{color:#888;font-size:.75rem}
  footer{margin-top:40px;font-size:.75rem;color:#888}
</style>
${jsonLd(episodeLd)}
${jsonLd(breadcrumbLd)}
</head>
<body>
  <main class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/episodes/">Episodes</a> › <span aria-current="page">${titleEsc}</span></nav>
    <h1>${titleEsc}</h1>
    ${hub ? `<a class="cat" href="${hub}">${escapeHtml(category)}</a>` : `<span class="cat">${escapeHtml(category)}</span>`}
    <div class="meta">${escapeHtml(meta)}</div>
    <div class="cta">
      <a class="btn btn-spotify" href="${escapeHtml(listenSpotify)}" rel="noopener">Listen on Spotify</a>
      <a class="btn btn-apple" href="${escapeHtml(ep.appleUrl || APPLE)}" rel="noopener">Apple Podcasts</a>
      <a class="btn btn-home" href="/">Open app</a>
    </div>
    <p class="links"><a href="${SPOTIFY_SHOW}" rel="noopener">Show on Spotify</a> · <a href="${SUBSTACK}" rel="noopener">Read more on Substack</a></p>
    ${ep.audio ? `<audio controls preload="none" src="${escapeHtml(ep.audio)}">Your browser can't play this audio. <a href="${escapeHtml(listenSpotify)}" rel="noopener">Listen on Spotify</a>.</audio>` : ''}
    <div class="desc">${notesHtml}</div>
    <p class="about"><strong>About this episode:</strong> ${escapeHtml(aboutSentence(ep, category, date, minutes))}</p>
    <nav class="pager" aria-label="Previous and next episodes">
      ${pageLink(ctx.prev, '← Previous episode', 'prev')}
      ${pageLink(ctx.next, 'Next episode →', 'next')}
    </nav>
    ${related}
    <p><a href="/episodes/">← All episodes</a></p>
    <footer>Primosmusings — global sports podcast by Sridhar Srinivasan (Primo). Listen on <a href="${SPOTIFY_SHOW}" rel="noopener">Spotify</a>, <a href="${APPLE}" rel="noopener">Apple Podcasts</a>, or in the <a href="/">Primosmusings app</a>. Read more on <a href="${SUBSTACK}" rel="noopener">Substack</a>.</footer>
  </main>
</body>
</html>
`;
}

function indexHtml(rows) {
  const description = 'Every episode of Primosmusings, the global sports podcast by Sridhar Srinivasan (Primo): daily Primos News Bites, NFL previews and recaps, tennis, golf, cricket, F1 and more.';
  const list = rows
    .map(
      (r) =>
        `<li><a href="/episodes/${r.slug}.html">${escapeHtml(r.title)}</a><span class="d"><span class="c">${escapeHtml(r.category)}</span> · ${escapeHtml(readableDate(r.pubDate))}</span></li>`
    )
    .join('\n');
  const pageLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All Episodes | Primosmusings',
    url: `${SITE}/episodes/`,
    description,
    isPartOf: { '@type': 'PodcastSeries', name: 'PrimosMusings', url: SITE + '/', webFeed: RSS_URL },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: Math.min(50, rows.length),
      itemListElement: rows.slice(0, 50).map((r, i) => ({
        '@type': 'ListItem', position: i + 1, url: `${SITE}/episodes/${r.slug}.html`, name: r.title,
      })),
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Episodes', item: `${SITE}/episodes/` },
      ],
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>All Episodes | Primosmusings</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${SITE}/episodes/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Primosmusings">
<meta property="og:title" content="All Episodes | Primosmusings">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${SITE}/episodes/">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="All Episodes | Primosmusings">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<link rel="icon" href="/icon-192.png">
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#0a0a0a;color:#f0f0f0}
  a{color:#4d9ef7}
  .wrap{max-width:800px;margin:0 auto;padding:24px 16px 64px}
  h1{font-size:1.5rem}
  ul{list-style:none;padding:0;margin:0}
  li{padding:12px 0;border-bottom:1px solid #222;display:flex;flex-direction:column;gap:4px}
  .d{color:#888;font-size:.75rem}
  .c{color:#e8aa30;font-weight:700}
  .crumbs{font-size:.75rem;color:#888;margin-bottom:12px}
  .crumbs a{text-decoration:none}
  .hubs{font-size:.9rem}
</style>
${jsonLd(pageLd)}
</head>
<body>
  <main class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span aria-current="page">Episodes</span></nav>
    <h1>All episodes (${rows.length})</h1>
    <p>${escapeHtml(description)} Tap any title for the show notes and a player.</p>
    <p class="hubs">Newsletters: <a href="/daily/">Primos News Bites</a> · <a href="/nfl/">NFL Recap &amp; Preview</a></p>
    <ul>
${list}
    </ul>
  </main>
</body>
</html>
`;
}

// Up to 5 other episodes in the same category, closest in time to this one, newest first.
function relatedRows(rows, i) {
  return rows
    .map((r, j) => ({ r, j }))
    .filter(({ r, j }) => j !== i && r.category === rows[i].category)
    .sort((a, b) => Math.abs(a.j - i) - Math.abs(b.j - i))
    .slice(0, 5)
    .sort((a, b) => a.j - b.j)
    .map(({ r }) => r);
}

async function main() {
  console.log('Fetching RSS…');
  const res = await fetch(RSS_URL, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text();
  const items = parseItems(xml);
  console.log(`Parsed ${items.length} episodes`);

  // Safety check for unattended runs: this script deletes every page before rebuilding.
  // If the feed comes back empty or short (outage, blocked request, error page),
  // stop now instead of wiping the archive. ALLOW_SHRINK=1 overrides it on purpose.
  const existingPages = fs.existsSync(OUT_DIR)
    ? fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.html') && f !== 'index.html').length
    : 0;
  if (items.length === 0 || (items.length < existingPages && !process.env.ALLOW_SHRINK)) {
    throw new Error(
      `Refusing to rebuild: the feed has ${items.length} episodes but ${existingPages} pages already exist. ` +
        `If episodes were really removed, rerun with ALLOW_SHRINK=1.`
    );
  }

  const appleLinks = await fetchAppleLinks();

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  // Pass 1: every episode's address (slug logic unchanged), so pages can link to each other.
  const used = new Set();
  const rows = [];
  for (const ep of items) {
    let slug = slugify(ep.title, ep.guid);
    let n = 2;
    while (used.has(slug)) {
      slug = `${slugify(ep.title, ep.guid)}-${n++}`;
    }
    used.add(slug);
    ep.category = categoryOf(ep.title);
    ep.appleUrl = appleLinks.get(ep.feedGuid) || APPLE;
    rows.push({
      slug,
      title: ep.title,
      pubDate: ep.pubDate,
      category: ep.category,
      lastmod: ep.pubDate
        ? new Date(ep.pubDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
  }

  // Pass 2: write the pages. Items are newest first, so "previous" is the next one in the list.
  items.forEach((ep, i) => {
    const ctx = { prev: rows[i + 1] || null, next: rows[i - 1] || null, related: relatedRows(rows, i) };
    fs.writeFileSync(path.join(OUT_DIR, `${rows[i].slug}.html`), episodeHtml(ep, rows[i].slug, ctx), 'utf8');
  });

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml(rows), 'utf8');

  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    `  <url>\n    <loc>${SITE}/episodes/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`,
    `  <url>\n    <loc>${SITE}/daily/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    `  <url>\n    <loc>${SITE}/nfl/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ...rows.map(
      (r) =>
        `  <url>\n    <loc>${SITE}/episodes/${r.slug}.html</loc>\n    <lastmod>${r.lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

  console.log(`Wrote ${rows.length} episode pages + index → ${OUT_DIR}`);
  console.log(`Updated sitemap.xml (${rows.length + 4} URLs)`);
}

main().catch((e) => {
  console.error(e);
  // exitCode (not process.exit) lets open network connections close first;
  // calling process.exit right after fetch crashes Node on Windows.
  process.exitCode = 1;
});
