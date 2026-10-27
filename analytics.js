/* Primosmusings usage analytics — Google Analytics 4, via gtag.js.
   Free tier only. This file is the one place the measurement ID lives.

   The Firebase web config in this repo (index.html, daily/index.html) has
   no measurementId. Paste the ID from the primosmusings-b47f7 Firebase
   project on the line below. It looks like G-1A2BCD3EFG.

   Leave the placeholder and nothing is loaded or sent. Playback, the
   episode pages, and the in-app Firestore play count all keep working.
*/
const GA_MEASUREMENT_ID = 'G-C7JG53MTFV';

(function () {
  function measurementId() {
    return String(GA_MEASUREMENT_ID || '').trim().toUpperCase();
  }

  // G-XXXXXXXXXX (and any all-X placeholder) is not a real ID.
  function analyticsEnabled() {
    const id = measurementId();
    return /^G-[A-Z0-9]{4,}$/.test(id) && !/^G-X+$/.test(id);
  }

  function clip(value) {
    const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    return text.length > 100 ? text.slice(0, 100) : text;
  }

  function idFromMedia(url) {
    const s = String(url || '');
    const anchor = s.match(/\/podcast\/play\/(\d+)/);
    if (anchor) return anchor[1];
    const spotify = s.match(/(?:episode[:/])([A-Za-z0-9]{10,})/);
    return spotify ? spotify[1] : '';
  }

  function idFromPage(url) {
    const slug = String(url || '').match(/\/episodes\/([^/?#]+)\.html/);
    return slug ? slug[1] : '';
  }

  // GA4 parameter values are capped at 100 characters. Anchor audio
  // addresses are much longer, so keep the stable play id instead.
  function shortenUrl(url) {
    const raw = String(url || '');
    const anchor = raw.match(/\/podcast\/play\/(\d+)/);
    if (anchor) return 'https://anchor.fm/s/d9746d30/podcast/play/' + anchor[1];
    try {
      const u = new URL(raw, location.href);
      if (u.hostname === 'open.spotify.com') {
        const ep = u.pathname.match(/\/episode\/([A-Za-z0-9]+)/);
        if (ep) return 'https://open.spotify.com/episode/' + ep[1];
      }
      if (u.origin === location.origin) return u.pathname + u.search;
    } catch (e) { /* keep the raw value and clip it below */ }
    return raw;
  }

  function cleanParams(params) {
    const out = {};
    if (!params) return out;
    Object.keys(params).forEach((key) => {
      let value = params[key];
      if (value == null) return;
      value = String(value).trim();
      if (!value) return;
      if (key === 'episode_url' || key === 'link_url' || key === 'embed_url') value = shortenUrl(value);
      value = clip(value);
      if (value) out[key] = value;
    });
    if (out.episode_url && !out.episode_id) {
      const id = idFromMedia(out.episode_url) || idFromPage(out.episode_url);
      if (id) out.episode_id = clip(id);
    }
    return out;
  }

  function track(name, params) {
    if (!analyticsEnabled() || typeof window.gtag !== 'function') return;
    window.gtag('event', name, cleanParams(params));
  }

  // Always defined, so the app can call it whether or not an ID is set.
  window.pmTrack = function (name, params) {
    try { track(name, params); } catch (e) { /* analytics must never break the page */ }
  };

  function platformName(hostname) {
    const host = String(hostname || '').toLowerCase().replace(/^www\./, '');
    if (host === 'spotify.com' || host.endsWith('.spotify.com')) return 'Spotify';
    if (host === 'podcasts.apple.com' || host === 'itunes.apple.com' || host.endsWith('.podcasts.apple.com')) return 'Apple Podcasts';
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'music.youtube.com' || host.endsWith('.youtube.com')) return 'YouTube';
    if (host === 'music.amazon.com' || host.endsWith('.music.amazon.com')) return 'Amazon Music';
    if (host === 'iheart.com' || host.endsWith('.iheart.com')) return 'iHeart';
    if (host === 'pca.st' || host === 'pocketcasts.com' || host.endsWith('.pocketcasts.com')) return 'Pocket Casts';
    if (host === 'overcast.fm' || host.endsWith('.overcast.fm')) return 'Overcast';
    if (host === 'castbox.fm' || host.endsWith('.castbox.fm')) return 'Castbox';
    if (host === 'tunein.com' || host.endsWith('.tunein.com')) return 'TuneIn';
    if (host === 'podcasts.google.com') return 'Google Podcasts';
    return '';
  }

  function canonicalUrl() {
    const link = document.querySelector('link[rel="canonical"]');
    return (link && link.href) || location.href;
  }

  function titleForAudio(audio) {
    const listen = audio.closest && audio.closest('.listen');
    if (listen) {
      const near = listen.querySelector('.listen-title');
      if (near && near.textContent.trim()) return near.textContent.trim();
    }
    const h1 = document.querySelector('h1');
    if (h1 && h1.textContent.trim()) return h1.textContent.trim();
    return document.title.replace(/\s*\|\s*Primosmusings\s*$/i, '').trim();
  }

  function titleForSpotifyId(id) {
    try {
      if (!id || typeof loadedEpisodes === 'undefined' || !loadedEpisodes) return '';
      const match = loadedEpisodes.find((ep) => ep && String(ep.link || '').indexOf(id) !== -1);
      return match && match.title ? match.title : '';
    } catch (e) {
      return '';
    }
  }

  function bindAudioPlays() {
    // `play` does not bubble. Capture still sees <audio> on the episode
    // pages and the newsletter page. The app's mini player is a bare
    // Audio() object, so index.html reports that play from logPlay instead.
    document.addEventListener('play', (event) => {
      const audio = event.target;
      if (!audio || audio.tagName !== 'AUDIO') return;
      if (audio.getAttribute('data-pm-play') === '1') return;
      audio.setAttribute('data-pm-play', '1');
      const src = audio.currentSrc || audio.getAttribute('src') || '';
      const page = canonicalUrl();
      track('episode_play', {
        episode_title: titleForAudio(audio),
        episode_id: idFromMedia(src) || idFromPage(page),
        episode_url: page,
        play_source: 'page_audio'
      });
    }, true);
  }

  function bindOutboundClicks() {
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || (event.button && event.button !== 0)) return;
      const el = event.target;
      const link = el && el.closest ? el.closest('a[href]') : null;
      if (!link) return;
      let url;
      try { url = new URL(link.href, location.href); } catch (e) { return; }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      if (url.origin === location.origin) return;
      const platform = platformName(url.hostname);
      if (!platform) return;
      track('outbound_click', {
        platform: platform,
        link_url: url.href,
        link_text: link.textContent || ''
      });
    });
  }

  // Plain Spotify embeds (the Listen tab show player) post playback_started
  // and playback_update to the parent. playback_update also fires on pause
  // and seek, so a play is only the moment playback actually starts.
  const sawPlaybackStarted = new WeakMap();
  const playingNow = new WeakMap();
  const recentEmbedPlays = new Map();

  function recordEmbedPlay(uri) {
    const id = idFromMedia(uri);
    if (!id) return;
    const now = Date.now();
    if (now - (recentEmbedPlays.get(id) || 0) < 2000) return;
    recentEmbedPlays.set(id, now);
    track('episode_play', {
      episode_title: titleForSpotifyId(id),
      episode_id: id,
      episode_url: 'https://open.spotify.com/episode/' + id,
      play_source: 'spotify_embed'
    });
  }

  function fromOurEmbed(source) {
    if (!source) return false;
    const frames = document.querySelectorAll('iframe');
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow !== source) continue;
      return (frames[i].getAttribute('src') || '').indexOf('open.spotify.com/embed/') !== -1;
    }
    return false;
  }

  function bindSpotifyEmbed() {
    const clicked = new WeakSet();
    // A click inside the cross-origin embed focuses it and blurs the page.
    // That is the interaction we can see without the Spotify iFrame API
    // replacing the player. One event per embed per page view.
    window.addEventListener('blur', () => {
      try {
        const frame = document.activeElement;
        if (!frame || frame.tagName !== 'IFRAME' || clicked.has(frame)) return;
        const src = frame.getAttribute('src') || '';
        if (src.indexOf('open.spotify.com/embed/') === -1) return;
        clicked.add(frame);
        track('spotify_embed_interaction', { embed_url: src.split('?')[0] });
      } catch (e) { /* analytics must never break the page */ }
    });

    window.addEventListener('message', (event) => {
      try {
        if (event.origin !== 'https://open.spotify.com' || !fromOurEmbed(event.source)) return;
        let data = event.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (e) { return; }
        }
        if (!data || typeof data !== 'object' || !data.type) return;
        const payload = data.payload && typeof data.payload === 'object' ? data.payload : {};
        const uri = payload.playingURI || payload.uri || '';

        if (data.type === 'playback_started') {
          sawPlaybackStarted.set(event.source, true);
          playingNow.set(event.source, true);
          recordEmbedPlay(uri);
          return;
        }
        if (data.type !== 'playback_update') return;
        const playing = payload.isPaused === false;
        const wasPlaying = playingNow.get(event.source) === true;
        playingNow.set(event.source, playing);
        // Once playback_started is arriving, trust that. The update event
        // also fires for pause, seek, and (on some embeds) every second.
        if (sawPlaybackStarted.get(event.source)) return;
        if (playing && !wasPlaying) recordEmbedPlay(uri);
      } catch (e) { /* analytics must never break the page */ }
    });
  }

  function loadGtag(id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // page_view for this document, including each /episodes/ page.
    window.gtag('config', id, { send_page_view: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  try {
    if (!analyticsEnabled()) return;
    loadGtag(measurementId());
    bindAudioPlays();
    bindOutboundClicks();
    bindSpotifyEmbed();
  } catch (e) { /* analytics must never break the page */ }
})();
