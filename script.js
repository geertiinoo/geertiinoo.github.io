/* ─────────────────────────────────────────────────────────────
   Gertino — portfolio
   Données : chaîne YouTube (API YouTube Data v3), lue en direct
   depuis le navigateur. Réglages dans config.js.
   ───────────────────────────────────────────────────────────── */
(() => {
  const CFG = window.SITE_CONFIG || {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const esc = (str = '') => String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const pad = (n) => String(n).padStart(2, '0');
  const timecode = (seconds) => {
    const s = Math.max(0, seconds);
    const f = Math.floor((s % 1) * 24);
    const t = Math.floor(s);
    return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}:${pad(f)}`;
  };
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
  };

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ── Amorce de film (une fois par session) ───────────────── */
  const leader = $('#leader');
  if (leader && document.body.classList.contains('has-leader')) {
    if (reduceMotion || store.get('leaderSeen')) {
      document.body.classList.remove('has-leader');
    } else {
      store.set('leaderSeen', '1');
      document.documentElement.style.overflow = 'hidden';
      const num = $('#leaderNum');
      let n = 3;
      const finish = () => {
        clearInterval(timer);
        leader.classList.add('is-done');
        document.dispatchEvent(new Event('leaderdone'));
        document.documentElement.style.overflow = '';
        setTimeout(() => document.body.classList.remove('has-leader'), 700);
      };
      const timer = setInterval(() => {
        n -= 1;
        if (n <= 0) finish(); else num.textContent = n;
      }, 800);
      leader.addEventListener('click', finish, { once: true });
    }
  }

  /* ── Timecodes (horloge REC + TC lié au défilement) ──────── */
  const clocks = $$('[data-tc="clock"]');
  const scrollTc = $('#scrollTc');
  const start = performance.now();
  let lastFrame = -1;
  const tick = (now) => {
    const secs = (now - start) / 1000;
    const frame = Math.floor(secs * 24);
    if (frame !== lastFrame) {
      lastFrame = frame;
      const tc = timecode(secs);
      clocks.forEach((el) => { el.textContent = tc; });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  /* ── Défilement fluide (moteur maison, souris/pavé uniquement) ── */
  const root = document.documentElement;
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const smooth = (() => {
    let current = scrollY; let target = scrollY; let running = false; let tween = null;
    const maxY = () => root.scrollHeight - innerHeight;
    const clamp = (v) => Math.min(maxY(), Math.max(0, v));
    const step = () => {
      if (tween) {
        const k = Math.min(1, (performance.now() - tween.t0) / tween.dur);
        const e = 1 - Math.pow(1 - k, 4); // easeOutQuart
        current = tween.from + (tween.to - tween.from) * e;
        target = current;
        if (k >= 1) tween = null;
      } else {
        current += (target - current) * 0.1;
        if (Math.abs(target - current) < 0.4) current = target;
      }
      scrollTo(0, current);
      if (tween || current !== target) requestAnimationFrame(step); else running = false;
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(step); } };
    const locked = () => root.style.overflow === 'hidden';
    if (!isTouch && !reduceMotion) {
      addEventListener('wheel', (e) => {
        if (e.ctrlKey || locked() || e.defaultPrevented) return;
        if (e.target.closest?.('.menu-panel, .modal, textarea, select, [data-native-scroll]')) return;
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // défilement horizontal (bande de film)
        e.preventDefault();
        tween = null;
        if (!running) current = scrollY;
        const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1;
        target = clamp(target + e.deltaY * unit);
        kick();
      }, { passive: false });
      // clavier, barre de défilement, recherche… : on se resynchronise
      addEventListener('scroll', () => { if (!running) { current = scrollY; target = scrollY; } }, { passive: true });
    }
    return {
      to(y, dur) {
        y = clamp(y);
        if (reduceMotion) { scrollTo(0, y); return; }
        const d = dur ?? Math.min(1600, 700 + Math.abs(y - scrollY) * 0.25);
        current = scrollY;
        tween = { from: scrollY, to: y, t0: performance.now(), dur: d };
        kick();
      },
    };
  })();

  // Ancres internes (#contact…) avec la même glisse
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    const y = a.getAttribute('href') === '#top' || a.getAttribute('href') === '#main' ? 0 : el.getBoundingClientRect().top + scrollY - 80;
    smooth.to(y);
    history.replaceState(null, '', a.getAttribute('href'));
  });

  /* ── Effets liés au défilement (une seule boucle par image) ── */
  const toTop = $('#toTop');
  const logoRuler = $('.logo-ruler');
  const sizeRuler = () => { if (logoRuler) logoRuler.style.setProperty('--rw', `${logoRuler.offsetWidth - 2}px`); };
  sizeRuler(); addEventListener('resize', sizeRuler); document.fonts?.ready.then(sizeRuler);
  const backFloat = $('.back-float');
  const playhead = $('#playhead');
  const timeline = $('#timeline');
  const header = $('#siteHeader');
  const heroContent = $('.hero-content');
  const heroMedia = $('.hero-media');
  let tlTop = 0; let tlH = 0; let tlW = 0;
  const measure = () => {
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      tlTop = r.top + scrollY; tlH = r.height; tlW = r.width;
    }
  };
  let lastY = scrollY; let ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    if (scrollTc) scrollTc.textContent = timecode((max > 0 ? y / max : 0) * 180); // page = bobine de 3 min
    if (logoRuler) logoRuler.style.setProperty('--sp', (max > 0 ? y / max : 0).toFixed(4));
    toTop?.classList.toggle('is-visible', y > innerHeight * 0.8);
    backFloat?.classList.toggle('is-visible', y > innerHeight * 0.5);
    if (header && !root.style.overflow) {
      if (y > lastY + 4 && y > 160) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 160) header.classList.remove('is-hidden');
    }
    lastY = y;
    if (heroContent && y < innerHeight * 1.2 && !reduceMotion) {
      const k = y / innerHeight;
      heroContent.style.transform = `translate3d(0, ${y * 0.32}px, 0)`;
      heroContent.style.opacity = String(Math.max(0, 1 - k * 1.25));
      if (heroMedia) heroMedia.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(${1 + k * 0.06})`;
    }
    if (playhead && tlW) {
      const prog = (y + innerHeight * 0.8 - tlTop) / (tlH + innerHeight * 0.3);
      playhead.style.transform = `translate3d(${Math.min(1, Math.max(0, prog)) * tlW}px, 0, 0)`;
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  addEventListener('load', () => { measure(); onScroll(); });
  measure(); frame();

  /* ── Menu plein écran ────────────────────────────────────── */
  const menuBtn = $('#menuBtn');
  const menuPanel = $('#menuPanel');
  const setMenu = (open) => {
    menuPanel.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.menu-btn-label', menuBtn).textContent = open ? 'Fermer' : 'Menu';
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  menuBtn?.addEventListener('click', () => setMenu(menuPanel.hidden));
  $$('a', menuPanel || document.createElement('div')).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ── Apparitions au scroll ───────────────────────────────── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('.display').forEach((h) => $$('.line', h).forEach((l, i) => l.style.setProperty('--i', i)));
  $$('.service-list .service, .timeline-steps .step, .facts > div').forEach((el, i, all) => {
    el.style.setProperty('--d', `${(i % (all.length > 5 ? 5 : all.length)) * 70}ms`);
  });
  const observeReveals = (scope = document) => $$('.reveal:not(.is-visible)', scope).forEach((el) => io.observe(el));
  if (document.body.classList.contains('has-leader')) {
    document.addEventListener('leaderdone', () => setTimeout(() => observeReveals(), 250), { once: true });
  } else observeReveals();

  /* ── Données : vidéos YouTube ────────────────────────────── */
  async function fetchAllVideos() {
    if (Array.isArray(CFG.previewVideos)) return CFG.previewVideos;
    const cacheKey = `videos:${CFG.uploadsPlaylistId}`;
    const cached = store.get(cacheKey);
    if (cached) {
      try {
        const { at, items } = JSON.parse(cached);
        if (Date.now() - at < (CFG.cacheMinutes ?? 30) * 60000 && items?.length) return items;
      } catch { /* cache illisible : on recharge */ }
    }

    const items = [];
    let pageToken = '';
    do {
      const url = 'https://www.googleapis.com/youtube/v3/playlistItems'
        + `?part=snippet&maxResults=50&playlistId=${encodeURIComponent(CFG.uploadsPlaylistId)}`
        + `&pageToken=${pageToken}&key=${encodeURIComponent(CFG.youtubeApiKey)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`YouTube API : HTTP ${res.status}`);
      const data = await res.json();
      (data.items || []).forEach(({ snippet: s }) => {
        const id = s?.resourceId?.videoId;
        if (!id || s.title === 'Private video' || s.title === 'Deleted video') return;
        const th = s.thumbnails || {};
        items.push({
          id,
          title: s.title,
          published: s.publishedAt,
          thumb: (th.maxres || th.standard || th.high || th.medium || th.default || {}).url,
        });
      });
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    items.sort((a, b) => new Date(b.published) - new Date(a.published));
    store.set(cacheKey, JSON.stringify({ at: Date.now(), items }));
    return items;
  }

  const slateHTML = (v, i) => `
        <div class="slate" aria-hidden="true">
          <div class="slate-bar"></div>
          <div class="slate-grid mono">
            <span>Prod.<b>Gertino</b></span><span>Prise<b>${pad(i + 1)}</b></span><span>Date<b>${esc((v.published || '').slice(0, 10))}</b></span>
          </div>
        </div>`;
  const frameInner = (v, i) => `
      <div class="frame-media">
        ${v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="${i < 4 ? 'eager' : 'lazy'}" draggable="false">` : slateHTML(v, i)}
        <span class="frame-label mono">Prise ${pad(i + 1)}</span>
        <span class="play" aria-hidden="true"></span>
      </div>
      <div class="frame-meta"><h3 class="frame-title">${esc(v.title)}</h3></div>`;
  const frameHTML = (v, i) => (CFG.preview
    ? `<a class="frame" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}" target="_blank" rel="noopener" draggable="false" aria-label="Voir sur YouTube : ${esc(v.title)}">${frameInner(v, i)}</a>`
    : `<button type="button" class="frame" data-id="${esc(v.id)}" data-title="${esc(v.title)}" aria-label="Lire la vidéo : ${esc(v.title)}">${frameInner(v, i)}</button>`);

  const strip = $('#filmstrip');
  const grid = $('#reelGrid');

  function renderStrip(videos) {
    const limit = Number(CFG.homeLimit) || 8;
    strip.innerHTML = videos.slice(0, limit).map(frameHTML).join('') + `
      <a href="portfolio.html" class="frame frame--more">
        <span class="mono">${videos.length} prises</span>
        <strong>Portfolio<br>complet →</strong>
      </a>`;
  }

  function renderGrid(videos) {
    const count = $('#reelCount');
    if (count) count.textContent = videos.length;
    const draw = (list) => {
      grid.innerHTML = list.length
        ? list.map((v) => frameHTML(v, videos.indexOf(v))).join('')
        : '<p class="grid-status mono">Aucune vidéo ne correspond à cette recherche.</p>';
    };
    draw(videos);
    $('#searchInput')?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      draw(q ? videos.filter((v) => v.title.toLowerCase().includes(q)) : videos);
    });
  }

  function fillFacts(videos) {
    const count = $('#factCount');
    const latest = $('#factLatest');
    if (count) count.textContent = videos.length;
    if (latest && videos[0]) latest.textContent = videos[0].title;
  }

  /* ── Vidéo de fond du hero (fichier local, muette, en boucle) ── */
  const heroVideo = $('#heroVideo');
  if (heroVideo) {
    if (reduceMotion) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
    else heroVideo.play().catch(() => { /* le poster reste affiché */ });
  }

  /* ── Vidéo de présentation (lecteur maison) ─────────────── */
  const intro = $('#introPlayer');
  if (intro && window.GPlayer) window.GPlayer.html5(intro);

  async function loadVideos() {
    const targets = [strip, grid].filter(Boolean);
    try {
      let videos = await fetchAllVideos();
      const hidden = new Set(CFG.hiddenVideoIds || []);
      videos = videos.filter((v) => !hidden.has(v.id));
      if (!videos.length) throw new Error('Aucune vidéo trouvée');

      if (strip) renderStrip(videos);
      if (grid) renderGrid(videos);
      fillFacts(videos);
    } catch (err) {
      targets.forEach((t) => {
        t.innerHTML = '<p class="grid-status mono">Impossible de charger les vidéos pour le moment. Réessayez plus tard.</p>';
      });
      console.error('Erreur de chargement des vidéos :', err);
    }
  }
  loadVideos();

  /* ── Bande de film : glisser + flèches ───────────────────── */
  if (strip) {
    const step = () => (strip.querySelector('.frame')?.offsetWidth || 400) + 14;
    $('#stripPrev')?.addEventListener('click', () => strip.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('#stripNext')?.addEventListener('click', () => strip.scrollBy({ left: step(), behavior: 'smooth' }));

    let down = false; let moved = false; let x0 = 0; let s0 = 0;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; x0 = e.clientX; s0 = strip.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 6) { moved = true; strip.classList.add('is-dragging'); }
      if (moved) strip.scrollLeft = s0 - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      setTimeout(() => strip.classList.remove('is-dragging'), 0);
    });
    strip.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  }

  /* ── Lecteur (modale) ────────────────────────────────────── */
  const modal = $('#modal');
  const player = $('#modalPlayer');
  let lastFocus = null;

  let modalCtrl = null;
  function openModal(id, title) {
    lastFocus = document.activeElement;
    player.innerHTML = '<div class="modal-stage"></div>';
    modalCtrl = window.GPlayer.youtube($('.modal-stage', player), id, { autoplay: true });
    $('#modalTitle').textContent = title;
    $('#modalYt').href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    $('.modal-close', modal).focus();
  }
  function closeModal() {
    modalCtrl?.destroy();
    modalCtrl = null;
    modal.hidden = true;
    player.innerHTML = '';
    document.documentElement.style.overflow = '';
    lastFocus?.focus();
  }

  document.addEventListener('click', (e) => {
    const frame = e.target.closest('button.frame');
    if (frame) openModal(frame.dataset.id, frame.dataset.title);
    if (e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal && !modal.hidden) closeModal();
    else if (menuPanel && !menuPanel.hidden) setMenu(false);
  });

  /* ── Formulaire de contact (sans serveur) ────────────────── */
  const form = $('#contactForm');
  if (form) {
    let via = 'email';
    $$('button[type="submit"]', form).forEach((b) => b.addEventListener('click', () => { via = b.dataset.via; }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      const err = $('#formError');
      if (!d.message?.trim()) { err.hidden = false; $('#fMsg').focus(); return; }
      err.hidden = true;
      const name = [d.prenom, d.nom].filter(Boolean).join(' ').trim();
      const body = `Bonjour Gertino,\n\nType de projet : ${d.type}\n\n${d.message.trim()}\n\n${name ? `— ${name}` : ''}`;
      const url = via === 'whatsapp'
        ? `https://wa.me/261389574357?text=${encodeURIComponent(body)}`
        : `https://mail.google.com/mail/?view=cm&fs=1&to=gertinobemahefa@gmail.com&su=${encodeURIComponent(`Projet vidéo — ${d.type}`)}&body=${encodeURIComponent(body)}`;
      const out = $('#formResult');
      out.innerHTML = `Message prêt : <a href="${url}" target="_blank" rel="noopener">${via === 'whatsapp' ? 'ouvrir WhatsApp' : 'ouvrir Gmail'} →</a>`;
      out.hidden = false;
      try { window.open(url, '_blank', 'noopener'); } catch { /* le lien reste affiché */ }
    });
  }
})();
