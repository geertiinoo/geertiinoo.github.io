/* ─────────────────────────────────────────────────────────────
   Lecteur vidéo Gertino — même habillage pour :
   • une vidéo locale (<video>)          → GPlayer.html5(container)
   • une vidéo YouTube (API IFrame)      → GPlayer.youtube(container, id)
   ───────────────────────────────────────────────────────────── */
(() => {
  const pad = (n) => String(n).padStart(2, '0');
  const mmss = (s) => `${pad(Math.floor((s || 0) / 60))}:${pad(Math.floor((s || 0) % 60))}`;
  const tc = (s) => {
    const t = Math.floor(s || 0);
    return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}:${pad(Math.floor(((s || 0) % 1) * 24))}`;
  };

  const ICONS = {
    play: '<svg class="i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>',
    pause: '<svg class="i-pause" viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/><text x="12" y="16.5" text-anchor="middle">10</text></svg>',
    vol: '<svg class="i-vol" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    muted: '<svg class="i-muted" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    fs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  };

  /* Habillage commun (HUD, gros bouton, barre de contrôle) */
  function chrome(pl, label) {
    pl.classList.add('player', 'is-paused');
    pl.insertAdjacentHTML('beforeend', `
      <span class="vf-corner vf-tl"></span><span class="vf-corner vf-tr"></span>
      <span class="vf-corner vf-bl"></span><span class="vf-corner vf-br"></span>
      <div class="p-hud mono" aria-hidden="true">
        <span class="p-rec"><span class="rec-dot"></span> Rec</span>
        <span class="p-tc" data-p="tc">00:00:00:00</span>
      </div>
      <button type="button" class="player-start" aria-label="${label}">
        <span class="p-big" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>
      </button>
      <div class="p-controls">
        <div class="p-progress" data-p="progress" role="slider" tabindex="0" aria-label="Position dans la vidéo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="p-track"><div class="p-buffer" data-p="buffer"></div><div class="p-fill" data-p="fill"></div></div>
          <div class="p-thumb" data-p="thumb"></div>
          <div class="p-preview mono" data-p="hover">00:00</div>
        </div>
        <div class="p-row">
          <button type="button" class="p-btn" data-p="play" aria-label="Lecture">${ICONS.play}${ICONS.pause}</button>
          <button type="button" class="p-btn" data-p="back" aria-label="Reculer de 10 secondes">${ICONS.back}</button>
          <span class="p-time mono"><span data-p="cur">00:00</span> <span class="dim">/ <span data-p="dur">00:00</span></span></span>
          <span class="p-spacer"></span>
          <button type="button" class="p-btn" data-p="mute" aria-label="Couper le son">${ICONS.vol}${ICONS.muted}</button>
          <input type="range" class="p-volume" data-p="volume" min="0" max="1" step="0.05" value="1" aria-label="Volume">
          <button type="button" class="p-btn" data-p="fs" aria-label="Plein écran">${ICONS.fs}</button>
        </div>
      </div>`);
  }

  /* Branche les contrôles sur un « moteur » (adapter) */
  function bind(pl, a) {
    const one = (n) => pl.querySelector(`[data-p="${n}"]`);
    const prog = one('progress');
    const volume = one('volume');
    let idleTimer;
    let dead = false;

    const render = () => {
      const d = a.duration();
      const t = a.time();
      const p = d ? Math.min(1, t / d) : 0;
      one('fill').style.width = `${p * 100}%`;
      one('thumb').style.left = `${p * 100}%`;
      one('cur').textContent = mmss(t);
      one('dur').textContent = mmss(d);
      one('tc').textContent = tc(t);
      one('buffer').style.width = `${a.buffered() * 100}%`;
      prog.setAttribute('aria-valuenow', Math.round(p * 100));
    };
    const sync = () => {
      const paused = a.paused();
      pl.classList.toggle('is-paused', paused);
      if (!paused) pl.classList.add('is-started');
      one('play').setAttribute('aria-label', paused ? 'Lecture' : 'Pause');
      const m = a.muted() || a.volume() === 0;
      pl.classList.toggle('is-muted', m);
      volume.value = m ? 0 : a.volume();
      volume.style.setProperty('--v', `${volume.value * 100}%`);
      one('mute').setAttribute('aria-label', m ? 'Remettre le son' : 'Couper le son');
      render();
    };
    const wake = () => {
      pl.classList.remove('is-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => pl.classList.add('is-idle'), 2500);
    };
    const toggle = () => { if (a.paused()) a.play(); else a.pause(); wake(); };

    a.onChange(sync);
    const loop = () => { if (dead) return; if (!a.paused()) render(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);

    pl.querySelector('.player-start').addEventListener('click', () => { a.play(); wake(); });
    pl.querySelector('.p-shield, video')?.addEventListener('click', toggle);
    one('play').addEventListener('click', toggle);
    one('back').addEventListener('click', () => { a.seek(Math.max(0, a.time() - 10)); render(); });
    one('mute').addEventListener('click', () => {
      const m = !(a.muted() || a.volume() === 0);
      if (!m && a.volume() === 0) a.setVolume(1);
      a.setMuted(m); sync();
    });
    volume.addEventListener('input', () => {
      const val = Number(volume.value);
      a.setVolume(val); a.setMuted(val === 0); sync();
    });
    one('fs').addEventListener('click', () => {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (pl.requestFullscreen) pl.requestFullscreen().catch(() => a.nativeFullscreen?.());
        else a.nativeFullscreen?.();
      } catch { /* plein écran indisponible */ }
    });

    const seekAt = (x) => {
      const r = prog.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (x - r.left) / r.width));
      if (a.duration()) a.seek(p * a.duration());
      render();
    };
    prog.addEventListener('pointerdown', (e) => { prog.classList.add('is-drag'); prog.setPointerCapture(e.pointerId); seekAt(e.clientX); });
    prog.addEventListener('pointermove', (e) => {
      const r = prog.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const hv = one('hover');
      hv.style.left = `${p * 100}%`;
      hv.textContent = mmss(p * a.duration());
      if (prog.classList.contains('is-drag')) seekAt(e.clientX);
    });
    const end = () => prog.classList.remove('is-drag');
    prog.addEventListener('pointerup', end);
    prog.addEventListener('pointercancel', end);
    prog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { a.seek(Math.min(a.duration(), a.time() + 5)); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { a.seek(Math.max(0, a.time() - 5)); e.preventDefault(); }
      render();
    });

    pl.addEventListener('pointermove', wake);
    pl.addEventListener('keydown', (e) => {
      wake();
      if (e.target.matches('input')) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
      if (e.key === 'm') one('mute').click();
      if (e.key === 'f') one('fs').click();
    });
    sync();
    return { destroy() { dead = true; clearTimeout(idleTimer); a.destroy?.(); }, play: () => a.play() };
  }

  /* Moteur : vidéo locale */
  function html5(pl) {
    const v = pl.querySelector('video');
    chrome(pl, 'Lire la vidéo');
    const subs = [];
    const fire = () => subs.forEach((f) => f());
    ['play', 'pause', 'ended', 'volumechange', 'loadedmetadata', 'progress', 'seeked'].forEach((ev) => v.addEventListener(ev, fire));
    v.addEventListener('ended', () => { v.currentTime = 0; pl.classList.remove('is-started'); });
    return bind(pl, {
      play: () => v.play().catch(() => {}),
      pause: () => v.pause(),
      paused: () => v.paused,
      time: () => v.currentTime,
      duration: () => (isFinite(v.duration) ? v.duration : 0),
      seek: (s) => { v.currentTime = s; },
      volume: () => v.volume,
      setVolume: (x) => { v.volume = x; },
      muted: () => v.muted,
      setMuted: (m) => { v.muted = m; },
      buffered: () => (v.buffered.length && v.duration ? v.buffered.end(v.buffered.length - 1) / v.duration : 0),
      onChange: (f) => subs.push(f),
      nativeFullscreen: () => v.webkitEnterFullscreen?.(),
    });
  }

  /* Moteur : YouTube (API IFrame, contrôles YouTube masqués) */
  let apiReady;
  const loadApi = () => apiReady || (apiReady = new Promise((resolve) => {
    if (window.YT?.Player) { resolve(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }));

  function youtube(pl, videoId, { autoplay = true } = {}) {
    pl.classList.add('player--yt');
    pl.innerHTML = '<div class="p-yt"><div></div></div><div class="p-shield"></div>';
    chrome(pl, 'Lire la vidéo');
    const target = pl.querySelector('.p-yt > div');
    const subs = [];
    const fire = () => subs.forEach((f) => f());
    let yt = null;
    let state = -1;
    let vol = 1;
    let muted = false;

    const a = {
      play: () => yt?.playVideo(),
      pause: () => yt?.pauseVideo(),
      paused: () => state !== 1 && state !== 3,
      time: () => yt?.getCurrentTime?.() || 0,
      duration: () => yt?.getDuration?.() || 0,
      seek: (s) => yt?.seekTo(s, true),
      volume: () => vol,
      setVolume: (x) => { vol = x; yt?.setVolume(Math.round(x * 100)); },
      muted: () => muted,
      setMuted: (m) => { muted = m; if (m) yt?.mute(); else yt?.unMute(); },
      buffered: () => yt?.getVideoLoadedFraction?.() || 0,
      onChange: (f) => subs.push(f),
      destroy: () => { try { yt?.destroy(); } catch { /* déjà détruit */ } },
    };
    const ctrl = bind(pl, a);

    loadApi().then(() => {
      // eslint-disable-next-line no-undef
      yt = new YT.Player(target, {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0, controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3,
          playsinline: 1, disablekb: 1, fs: 0, cc_load_policy: 0,
        },
        events: {
          onReady: () => {
            vol = yt.getVolume() / 100; muted = yt.isMuted();
            if (autoplay) yt.playVideo();
            fire();
          },
          onStateChange: (e) => {
            state = e.data;
            if (state === 1) { try { yt.unloadModule('captions'); yt.unloadModule('cc'); } catch { /* pas de sous-titres */ } }
            if (state === 0) { yt.seekTo(0, true); yt.pauseVideo(); pl.classList.remove('is-started'); }
            fire();
          },
        },
      });
    });
    return ctrl;
  }

  window.GPlayer = { html5, youtube };
})();
