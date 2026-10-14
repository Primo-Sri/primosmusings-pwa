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
    const img = (block.match(/<itunes:image[^>]*href="([^"]+)"/i) || [])[1] || `${SITE}/icon-512.png`;
    items.push({ title, description, link, guid, pubDate, duration, audio, img });
  }
  return items;
}

function episodeHtml(ep, slug) {
  const plain = stripHtml(ep.description) || ep.title;
  const descMeta = escapeHtml(plain.slice(0, 160));
  const titleEsc = escapeHtml(ep.title);
  const canonical = `${SITE}/episodes/${slug}.html`;
  const pubIso = ep.pubDate ? new Date(ep.pubDate).toISOString() : '';
  const listenSpotify = ep.link || SPOTIFY_SHOW;
  const bodyDesc = ep.description && /<[a-z][\s\S]*>/i.test(ep.description)
    ? ep.description
    : `<p>${escapeHtml(plain)}</p>`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: ep.title,
    description: plain,
    datePublished: pubIso || undefined,
    url: canonical,
    image: ep.img,
    duration: ep.duration || undefined,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'PrimosMusings',
      url: SITE + '/',
    },
    associatedMedia: ep.audio
      ? { '@type': 'MediaObject', contentUrl: ep.audio }
      : undefined,
  };

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
  .brand{font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#888;margin-bottom:12px}
  .brand a{color:#1A73E8;text-decoration:none}
  h1{font-size:1.45rem;margin:0 0 8px;line-height:1.25}
  .meta{color:#888;font-size:.85rem;margin-bottom:20px}
  .desc{background:#141414;border:1px solid #282828;border-radius:12px;padding:16px;margin:20px 0}
  .desc p{margin:0 0 10px}
  .cta{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0}
  .btn{display:inline-block;padding:12px 18px;border-radius:24px;font-weight:700;text-decoration:none;font-size:.9rem}
  .btn-spotify{background:#1DB954;color:#000}
  .btn-apple{background:#fc3c44;color:#fff}
  .btn-home{background:#1e1e1e;color:#fff;border:1px solid #333}
  footer{margin-top:40px;font-size:.75rem;color:#666}
</style>
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
</head>
<body>
  <main class="wrap">
    <div class="brand"><a href="/">Primosmusings</a> / <a href="/episodes/">Episodes</a></div>
    <h1>${titleEsc}</h1>
    <div class="meta">${escapeHtml(ep.pubDate || '')}${ep.duration ? ' · ' + escapeHtml(ep.duration) : ''}</div>
    <div class="cta">
      <a class="btn btn-spotify" href="${escapeHtml(listenSpotify)}" rel="noopener">Listen on Spotify</a>
      <a class="btn btn-apple" href="${APPLE}" rel="noopener">Apple Podcasts</a>
      <a class="btn btn-home" href="/">Open app</a>
    </div>
    <div class="desc">${bodyDesc}</div>
    <p><a href="/episodes/">← All episodes</a></p>
    <footer>Primosmusings — global sports podcast by Sridhar Srinivasan (Primo). SEO landing page; audio hosted on podcast platforms.</footer>
  </main>
</body>
</html>
`;
}

function indexHtml(rows) {
  const list = rows
    .map(
      (r) =>
        `<li><a href="/episodes/${r.slug}.html">${escapeHtml(r.title)}</a><span class="d">${escapeHtml(r.pubDate || '')}</span></li>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>All Episodes | Primosmusings</title>
<meta name="description" content="Browse Primosmusings sports podcast episodes — NFL, tennis, golf, cricket, NBA, soccer, F1 and more.">
<link rel="canonical" href="${SITE}/episodes/">
<meta property="og:title" content="All Episodes | Primosmusings">
<meta property="og:url" content="${SITE}/episodes/">
<meta property="og:image" content="${SITE}/icon-512.png">
<link rel="icon" href="/icon-192.png">
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#0a0a0a;color:#f0f0f0}
  a{color:#4d9ef7}
  .wrap{max-width:800px;margin:0 auto;padding:24px 16px 64px}
  h1{font-size:1.5rem}
  ul{list-style:none;padding:0;margin:0}
  li{padding:12px 0;border-bottom:1px solid #222;display:flex;flex-direction:column;gap:4px}
  .d{color:#888;font-size:.75rem}
  .brand{font-size:.75rem;color:#888;margin-bottom:12px}
</style>
</head>
<body>
  <main class="wrap">
    <div class="brand"><a href="/">← Primosmusings app</a></div>
    <h1>All episodes (${rows.length})</h1>
    <p>Crawlable episode pages for search. Tap any title for show notes + listen links.</p>
    <ul>
${list}
    </ul>
  </main>
</body>
</html>
`;
}

async function main() {
  console.log('Fetching RSS…');
  const res = await fetch(RSS_URL);
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text();
  const items = parseItems(xml);
  console.log(`Parsed ${items.length} episodes`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  const used = new Set();
  const rows = [];
  for (const ep of items) {
    let slug = slugify(ep.title, ep.guid);
    let n = 2;
    while (used.has(slug)) {
      slug = `${slugify(ep.title, ep.guid)}-${n++}`;
    }
    used.add(slug);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), episodeHtml(ep, slug), 'utf8');
    rows.push({
      slug,
      title: ep.title,
      pubDate: ep.pubDate,
      lastmod: ep.pubDate
        ? new Date(ep.pubDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml(rows), 'utf8');

  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    `  <url>\n    <loc>${SITE}/episodes/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`,
    ...rows.map(
      (r) =>
        `  <url>\n    <loc>${SITE}/episodes/${r.slug}.html</loc>\n    <lastmod>${r.lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

  console.log(`Wrote ${rows.length} episode pages + index → ${OUT_DIR}`);
  console.log(`Updated sitemap.xml (${rows.length + 2} URLs)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
