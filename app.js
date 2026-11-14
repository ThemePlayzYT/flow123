/* ThemeFlow: library, live canvas animation engine, studio, exports, projects (vanilla JS) */
(() => {
  'use strict';

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOut = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const bounceOut = x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); return `rgb(${[n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f)).join(',')})`; };
  const rnd = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = v => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { toast('Browser storage is full or blocked'); } };
  let tt;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 2400); }

  // ---------- template library ----------
  const T = (id, title, cat, kind, text, c1, c2, gl, prem, dur, views, date, font = 'Impact') =>
    ({ id, title, cat, kind, text, c1, c2, gl, prem, dur, views, date, font });
  const TPL = [
    T('a01', '3D Text Reveal', 'Text', 'slam', 'THEME PLAYZ', '#ffffff', '#7c3aed', 20, 0, 6, 9200, '2026-03-01'),
    T('a02', 'Cinematic Title', 'Text', 'fade', 'CINEMATIC', '#f5f5f5', '#38bdf8', 10, 1, 8, 7400, '2026-02-10', 'Georgia'),
    T('a03', 'Glitch Text', 'Text', 'glitch', 'GLITCH', '#22d3ee', '#f472b6', 0, 0, 4, 6100, '2026-01-15'),
    T('a04', 'Neon Text', 'Text', 'neon', 'NEON NIGHT', '#fde68a', '#ec4899', 40, 1, 5, 8800, '2026-03-05'),
    T('a05', 'Fire Text', 'Effects', 'fire', 'ON FIRE', '#fde047', '#dc2626', 0, 0, 5, 8100, '2026-02-01'),
    T('a06', 'Lightning Text', 'Effects', 'glitch', 'ZAP!', '#e0f2fe', '#3b82f6', 30, 1, 4, 5200, '2025-12-10'),
    T('a07', 'Wave Text', 'Text', 'wave', 'SUBSCRIBE NOW', '#ffffff', '#a855f7', 15, 0, 4, 6800, '2026-02-22'),
    T('a08', 'Typing Animation', 'Text', 'type', 'Welcome to my channel', '#ffffff', '#38bdf8', 0, 0, 6, 4300, '2026-03-11', 'Courier New'),
    T('a09', 'Exploding Text', 'Effects', 'burst', 'BOOM', '#fef3c7', '#f97316', 35, 1, 4, 7000, '2026-01-01'),
    T('a10', '3D Rotating Text', 'Text', 'spin', 'ROTATE', '#ffffff', '#818cf8', 20, 0, 4, 3900, '2025-11-20'),
    T('a11', 'Bounce Pop-up', 'Text', 'bounce', 'POP!', '#ffffff', '#22c55e', 10, 0, 3, 5600, '2026-02-28'),
    T('a12', 'Subscribe Button', 'Creator', 'bounce', 'SUBSCRIBE', '#ffffff', '#ef4444', 20, 0, 3, 12300, '2026-03-08'),
    T('a13', 'Like Animation', 'Creator', 'burst', 'LIKE 👍', '#ffffff', '#3b82f6', 15, 0, 3, 6400, '2026-02-04'),
    T('a14', 'Bell Notification', 'Creator', 'spin', '🔔 NEW VIDEO', '#ffffff', '#facc15', 20, 1, 4, 3300, '2025-11-01'),
    T('a15', 'YouTube Intro', 'Creator', 'slam', 'CHANNEL NAME', '#ffffff', '#7c3aed', 30, 1, 8, 10400, '2026-01-20'),
    T('a16', 'Name Reveal', 'Creator', 'fade', 'YOUR NAME', '#ffffff', '#14b8a6', 10, 1, 6, 2900, '2026-03-15', 'Georgia'),
    T('a17', 'Gaming Intro Text', 'Effects', 'neon', 'LEVEL UP', '#a7f3d0', '#06b6d4', 40, 1, 5, 9500, '2026-01-18'),
    T('a18', 'Smoke Dissolve', 'Effects', 'fade', 'SMOKE', '#e5e7eb', '#9ca3af', 25, 0, 6, 2100, '2025-10-15'),
    T('a19', 'Particle Burst', 'Effects', 'burst', 'PARTICLES', '#ffffff', '#c084fc', 25, 1, 5, 4800, '2026-01-30'),
    T('a20', 'Logo Reveal', 'Creator', 'slam', 'LOGO', '#ffffff', '#fbbf24', 30, 0, 5, 3600, '2026-01-26'),
    T('a21', 'Lower Third', 'Text', 'fade', 'Jane Doe · Gamer', '#ffffff', '#38bdf8', 0, 0, 5, 2800, '2026-02-09', 'Trebuchet MS'),
    T('a22', 'Minecraft Block Logo', 'Effects', 'block', 'MINECRAFT', '#a3ff4d', '#2f8f12', 0, 1, 4, 11000, '2026-11-14', 'Arial Black'),
    T('a23', 'Shine Sweep Title', 'Text', 'shine', 'PREMIUM', '#ffffff', '#38bdf8', 20, 1, 5, 7600, '2026-11-10'),
    T('a24', 'Drop Letters', 'Text', 'drop', 'SUBSCRIBE', '#ffffff', '#ef4444', 15, 0, 4, 5400, '2026-10-28'),
  ];
  const tplOf = id => TPL.find(t => t.id === id);
  const KINDS = [['slam', 'Slam in'], ['fade', 'Fade & rise'], ['type', 'Typewriter'], ['glitch', 'Glitch'], ['neon', 'Neon pulse'],
    ['fire', 'Fire flicker'], ['wave', 'Wave'], ['spin', '3D spin'], ['burst', 'Burst'], ['bounce', 'Bounce']];
  const FONTS = ['Impact', 'Arial Black', 'Georgia', 'Courier New', 'Trebuchet MS', 'Verdana'].map(f => [f, f]);
  const DEF = { text: '', font: 'Impact', weight: '900', size: 170, c1: '#ffffff', c2: '#7c3aed', grad: 1, ow: 0, oc: '#000000', sh: 0, gl: 0,
    al: 'center', ls: 0, x: 50, y: 50, sc: 1, rot: 0, op: 100, spd: 1, dur: 6, kind: 'slam', fx: 0, fxAmt: 50, shake: 0,
    bgType: 'grad', bg: '#07050f', bg2: '#1c0f33', tv: 1, bv: 1 };
  const stateFrom = t => ({ ...DEF, text: t.text, font: t.font, c1: t.c1, c2: t.c2, gl: t.gl, dur: t.dur, kind: t.kind,
    size: t.kind === 'type' ? 90 : t.kind === 'block' ? 230 : 170, ow: t.kind === 'block' ? 6 : 0, fx: (['burst', 'fire'].includes(t.kind) || /Smoke|Particle/.test(t.title)) ? 1 : 0 });

  // ---------- studio control definitions ----------
  const TRK = [['tv', 'Text layer'], ['bv', 'Background'], ['fx', 'Particles']];
  const UI = {
    text: [
      ['text', 'Text', 'area'], ['font', 'Font', 'sel', FONTS],
      ['weight', 'Weight', 'sel', [['400', 'Regular'], ['700', 'Bold'], ['900', 'Black']]],
      ['c1', 'Color', 'color'], ['grad', 'Use gradient', 'check'], ['c2', 'Gradient end', 'color'],
      ['ow', 'Outline width', 'range', 0, 20], ['oc', 'Outline color', 'color'],
      ['sh', 'Shadow', 'range', 0, 60], ['gl', 'Glow', 'range', 0, 120],
      ['al', 'Alignment', 'sel', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']]],
    ],
    bg: [
      ['bgType', 'Background', 'sel', [['grad', 'Gradient'], ['solid', 'Solid color'], ['image', 'Custom image'], ['none', 'Transparent (preview)']]],
      ['bg', 'Color / start', 'color'], ['bg2', 'Gradient end', 'color'],
    ],
    fx: [['fx', 'Particles', 'check'], ['fxAmt', 'Particle amount', 'range', 0, 100], ['shake', 'Screen shake', 'range', 0, 40]],
    layers: [['tv', 'Text layer', 'check'], ['bv', 'Background layer', 'check'], ['fx', 'Particle layer', 'check']],
    props: [
      ['kind', 'Animation', 'sel', KINDS], ['x', 'Position X', 'range', 0, 100], ['y', 'Position Y', 'range', 0, 100],
      ['sc', 'Scale', 'range', 0.1, 3], ['rot', 'Rotation', 'range', -180, 180], ['op', 'Opacity', 'range', 0, 100],
      ['size', 'Font size', 'range', 40, 400], ['ls', 'Spacing', 'range', -20, 60],
      ['spd', 'Speed', 'range', 0.1, 3], ['dur', 'Duration (s)', 'range', 1, 15],
    ],
  };
  const ctrl = ([p, lab, type, a, b]) => {
    if (type === 'area') return `<label class="f">${lab}<textarea data-prop="${p}" rows="2"></textarea></label>`;
    if (type === 'sel') return `<label class="f">${lab}<select data-prop="${p}">${a.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>`;
    if (type === 'check') return `<label class="f ck"><input type="checkbox" data-prop="${p}">${lab}</label>`;
    if (type === 'color') return `<label class="f">${lab}<input type="color" data-prop="${p}"></label>`;
    return `<label class="f">${lab}<output data-out="${p}"></output><input type="range" data-prop="${p}" min="${a}" max="${b}" step="any"></label>`;
  };

  // ---------- rendering engine (shared by cards, editor preview and exports) ----------
  function paintBg(ctx, W, H, s, img) {
    if (!s.bv || s.bgType === 'none') return;
    if (s.bgType === 'image' && img && img.complete && img.naturalWidth) {
      const r = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * r, h = img.naturalHeight * r;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      return;
    }
    if (s.bgType === 'solid') ctx.fillStyle = s.bg;
    else { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, s.bg); g.addColorStop(1, s.bg2); ctx.fillStyle = g; }
    ctx.fillRect(0, 0, W, H);
  }

  function particles(ctx, W, H, T, s, I) {
    const n = Math.round(s.fxAmt * 0.8), R = Math.min(W, H) * 0.55;
    ctx.fillStyle = s.c2;
    for (let i = 0; i < n; i++) {
      const life = (T * (0.15 + rnd(i + 500) * 0.35) + rnd(i + 900)) % 1;
      const ang = rnd(i) * Math.PI * 2, d = life * R * I;
      ctx.globalAlpha = (1 - life) * 0.9;
      ctx.beginPath();
      ctx.arc(W / 2 + Math.cos(ang) * d, H / 2 + Math.sin(ang) * d - life * H * 0.08, (1 + rnd(i + 200) * 3) * W / 1280, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame(ctx, W, H, t, s, img) {
    const k = s.kind, S = W / 1920, T = t * s.spd, I = easeOut(T / 0.9);
    const seed = Math.floor(T * 12), glitch = k === 'glitch' && rnd(seed) > 0.62;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    paintBg(ctx, W, H, s, img);
    if (s.fx) particles(ctx, W, H, T, s, k === 'burst' ? I : 1);

    let x = W * s.x / 100, y = H * s.y / 100, sc = s.sc, sx = 1, a = s.tv ? s.op / 100 : 0;
    if (k === 'slam') { sc *= 1 + 2 * (1 - I); a *= I; }
    else if (k === 'fade') { a *= I; y += (1 - I) * 200 * S; }
    else if (k === 'spin') sx = Math.cos(T * 2.2);
    else if (k === 'bounce') { y -= Math.abs(Math.sin(T * 3.8)) * H * 0.12 * Math.exp(-T * 0.35); sc *= 0.6 + 0.4 * I; }
    else if (k === 'burst') { sc *= 0.2 + 0.8 * I; a *= I; }
    if (glitch) x += (rnd(seed + 7) - 0.5) * W * 0.03;
    if (s.shake) { const m = s.shake * S; x += Math.sin(T * 47) * m; y += Math.cos(T * 53) * m; }

    const str = k === 'type'
      ? s.text.slice(0, Math.floor(clamp(T / (s.dur * 0.6), 0, 1) * s.text.length)) + (Math.floor(T * 2) % 2 ? '' : '|')
      : s.text;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.rot * Math.PI / 180);
    ctx.scale(sc * sx || 0.001, sc);
    ctx.globalAlpha = clamp(a, 0, 1);
    drawText(ctx, str, S, s, k, T, glitch);
    ctx.restore();
  }

  function drawText(ctx, str, S, s, k, T, glitch) {
    const px = s.size * S, lines = str.split('\n'), lh = px * 1.1, top = -(lines.length - 1) * lh / 2;
    ctx.font = `${s.weight} ${px}px ${s.font}`;
    ctx.letterSpacing = (s.ls * S) + 'px';
    ctx.textBaseline = 'middle';
    ctx.textAlign = ['wave', 'block', 'drop', 'shine'].includes(k) ? 'center' : s.al;

    const g = ctx.createLinearGradient(0, top - lh / 2, 0, -top + lh / 2);
    if (k === 'fire') { g.addColorStop(0, '#fef9c3'); g.addColorStop(0.45, '#fb923c'); g.addColorStop(1, '#b91c1c'); }
    else { g.addColorStop(0, s.c1); g.addColorStop(1, s.grad ? s.c2 : s.c1); }
    ctx.fillStyle = g;

    const glow = s.gl || (k === 'neon' || k === 'fire' ? 40 : 0);
    if (glow) {
      ctx.shadowColor = k === 'fire' ? '#f97316' : s.c2;
      ctx.shadowBlur = glow * S + (k === 'neon' ? 12 + 12 * Math.sin(T * 9) : 0);
    } else if (s.sh) {
      ctx.shadowColor = 'rgba(0,0,0,.75)';
      ctx.shadowBlur = s.sh * S;
      ctx.shadowOffsetY = s.sh * S * 0.4;
    }
    if (s.ow > 0) { ctx.lineWidth = s.ow * S * 2; ctx.strokeStyle = s.oc; ctx.lineJoin = 'round'; }

    lines.forEach((ln, i) => {
      const y = top + i * lh;
      if (glitch) {
        ctx.fillStyle = '#ff2d6f'; ctx.fillText(ln, -10 * S, y);
        ctx.fillStyle = '#22d3ee'; ctx.fillText(ln, 10 * S, y);
        ctx.fillStyle = g;
      }
      if (['block', 'drop', 'shine'].includes(k)) return drawFancy(ctx, ln, y, px, S, s, k, T, g);
      if (k === 'wave') {
        let cx = -ctx.measureText(ln).width / 2;
        [...ln].forEach((ch, j) => {
          const cw = ctx.measureText(ch).width, yy = y + Math.sin(T * 4 + j * 0.5) * px * 0.12;
          if (s.ow > 0) ctx.strokeText(ch, cx + cw / 2, yy);
          ctx.fillText(ch, cx + cw / 2, yy);
          cx += cw;
        });
      } else {
        if (s.ow > 0) ctx.strokeText(ln, 0, y);
        ctx.fillText(ln, 0, y);
      }
    });
  }

  // Per-letter effects: extruded 3D letters that bounce in (block/drop) and a light sweep across the glyphs (block/shine)
  function drawFancy(ctx, ln, y, px, S, s, k, T, g) {
    const chars = [...ln], w = chars.map(c => ctx.measureText(c).width), total = w.reduce((a, b) => a + b, 0);
    const cen = [], dys = [], depth = Math.max(2, px * 0.07), dark = shade(s.c2, 0.45), drop = k === 'drop';
    let acc = -total / 2;
    w.forEach(cw => { cen.push(acc + cw / 2); acc += cw; });
    chars.forEach((ch, j) => {
      const p = k === 'shine' ? 1 : clamp((T - j * (drop ? 0.08 : 0.06)) / (drop ? 0.7 : 0.6), 0, 1);
      dys[j] = p <= 0 ? null : -(1 - bounceOut(p)) * px * (drop ? 1.4 : 0.9);
      if (dys[j] === null) return;
      const x = cen[j], dy = dys[j] + y;
      ctx.fillStyle = dark;
      for (let d = depth; d >= 1; d--) ctx.fillText(ch, x + d, dy + d);
      if (s.ow > 0) ctx.strokeText(ch, x, dy);
      ctx.fillStyle = g;
      ctx.fillText(ch, x, dy);
    });
    if (k === 'block' || k === 'shine') {
      const bx = total * ((T * 0.5) % 2.4 - 0.7);
      const sg = ctx.createLinearGradient(bx - total * 0.12, 0, bx + total * 0.12, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      chars.forEach((ch, j) => { if (dys[j] !== null) ctx.fillText(ch, cen[j], dys[j] + y); });
    }
  }

  // ---------- library state, cards and lazy thumbnails ----------
  const F = { q: '', cat: 'All', prem: '', sort: 'trending', fav: false };
  const favs = () => load('tf.favs', []);
  const ageDays = t => Math.max(0, (Date.now() - Date.parse(t.date)) / 864e5);
  const trend = t => t.views / (1 + ageDays(t) / 60);
  const KEY = { trending: trend, popular: t => t.views, latest: t => Date.parse(t.date) };
  const visible = new Set();
  const io = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))), { rootMargin: '150px' });
  function observeAll() { io.disconnect(); visible.clear(); $$('.thumb-cv').forEach(c => io.observe(c)); }

  function card(t) {
    const el = document.createElement('article');
    el.className = 'card';
    el.dataset.id = t.id;
    el.innerHTML = `<div class="thumb"><canvas class="thumb-cv" width="480" height="270"></canvas>
      <span class="tag ${t.prem ? 'prem' : 'free'}">${t.prem ? 'Premium' : 'Free'}</span></div>
      <div class="meta"><h3>${esc(t.title)}</h3><p>${t.cat} · ${t.dur}s · 1080p</p></div>
      <div class="acts"><button data-act="edit">Customize</button><button data-act="dl">Download</button>
      <button data-act="fav" class="${favs().includes(t.id) ? 'on' : ''}" aria-label="Favorite">♥</button></div>`;
    const cv = $('canvas', el);
    cv._ctx = cv.getContext('2d');
    cv._s = stateFrom(t);
    cv._ph = (t.views % 97) / 97 * t.dur;
    return el;
  }

  function renderHome() {
    const ROWS = [['Trending Animations', 'All', trend], ['Popular Text Animations', 'Text', t => t.views],
      ['Cinematic & Effects', 'Effects', t => t.views], ['Latest Animations', 'All', t => Date.parse(t.date)],
      ['Creator Essentials', 'Creator', t => t.views]];
    $('#rows').innerHTML = ROWS.map(([title, cat], i) => `<div class="row"><div class="row-h"><h2>${title}</h2>
      <button class="link" data-go="library" data-cat="${cat}">View all →</button></div><div class="grid" id="row${i}"></div></div>`).join('');
    ROWS.forEach(([, cat, key], i) => {
      TPL.filter(t => cat === 'All' || t.cat === cat).sort((a, b) => key(b) - key(a)).slice(0, 4)
        .forEach(t => $('#row' + i).appendChild(card(t)));
    });
    observeAll();
  }

  function syncChips() {
    $$('#cats button[data-cat]').forEach(b => b.classList.toggle('on', b.dataset.cat === F.cat));
    $('#favOnly').classList.toggle('on', F.fav);
  }

  function renderLibrary() {
    const grid = $('#grid'), key = KEY[F.sort];
    const list = TPL.filter(t => (!F.q || (t.title + ' ' + t.text).toLowerCase().includes(F.q))
      && (F.cat === 'All' || t.cat === F.cat)
      && (!F.prem || (F.prem === 'Premium') === !!t.prem)
      && (!F.fav || favs().includes(t.id)))
      .sort((a, b) => key(b) - key(a));
    grid.innerHTML = '';
    if (!list.length) grid.innerHTML = '<p class="muted">No animations match these filters yet.</p>';
    list.forEach(t => grid.appendChild(card(t)));
    observeAll();
  }

  const PLANS = [
    { name: 'Free', price: '$0', note: 'Get started', f: ['Free animations', 'Basic text customization', 'Standard exports'] },
    { name: 'Creator', price: '$9/mo', note: 'For regular uploaders', f: ['Premium animations (planned)', 'Advanced text controls', 'More export options'] },
    { name: 'Pro', price: '$19/mo', note: 'For studios', f: ['All premium animations (planned)', 'Advanced effects (planned)', 'High-quality exports'] },
  ];
  function renderPlans() {
    $('#plans').innerHTML = PLANS.map((p, i) => `<div class="card plan"><h3>${p.name}</h3>
      <p class="price">${p.price}<small> ${p.note}</small></p><ul>${p.f.map(f => `<li>${f}</li>`).join('')}</ul>
      <button class="btn ghost" disabled>${i ? 'Coming soon' : 'Current plan'}</button></div>`).join('');
  }

  // ---------- projects ----------
  function renderProjects() {
    const list = load('tf.projects', []);
    $('#plist').innerHTML = list.length ? list.map(p => `<div class="item"><div><b>${esc(p.name)}</b>
      <p class="muted">${esc(tplOf(p.tid)?.title || 'Animation')} · updated ${new Date(p.updated).toLocaleDateString()}</p></div>
      <div class="btns"><button data-pact="open" data-id="${p.id}">Open</button><button data-pact="rename" data-id="${p.id}">Rename</button>
      <button data-pact="dup" data-id="${p.id}">Duplicate</button><button data-pact="del" data-id="${p.id}">Delete</button></div></div>`).join('')
      : '<p class="muted">No saved projects yet. Open an animation and press “Save project”.</p>';
    $('#recent').innerHTML = load('tf.recent', []).map(tplOf).filter(Boolean)
      .map(t => `<button data-open="${t.id}">${esc(t.title)}</button>`).join('') || '<span class="muted">Nothing yet.</span>';
    const dl = load('tf.dl', []);
    $('#dls').innerHTML = dl.length ? dl.map(d => `<div class="item"><span>${esc(d.name)}</span><span class="muted">${new Date(d.at).toLocaleString()}</span></div>`).join('')
      : '<p class="muted">Exports you render will appear here.</p>';
  }

  function saveProject() {
    if (!S) return;
    const list = load('tf.projects', []);
    const existing = curPid && list.find(x => x.id === curPid);
    if (existing) { existing.state = { ...S }; existing.updated = Date.now(); store('tf.projects', list); return toast('Project saved'); }
    const name = prompt('Name this project', tplOf(curTid).title);
    if (!name || !name.trim()) return;
    curPid = Date.now().toString(36);
    list.unshift({ id: curPid, name: name.trim().slice(0, 60), tid: curTid, state: { ...S }, updated: Date.now() });
    store('tf.projects', list);
    toast('Project saved');
  }

  function recent(id) { const r = load('tf.recent', []).filter(x => x !== id); r.unshift(id); store('tf.recent', r.slice(0, 8)); }

  // ---------- editor ----------
  let S = null, IMG = null, PT = 0, playing = true, last = 0, curTid = null, curPid = null, exporting = false, pctx, hx;

  function setVal(el) { const v = S[el.dataset.prop]; if (el.type === 'checkbox') el.checked = !!v; else el.value = v; }
  function syncUI() {
    $$('[data-prop]').forEach(setVal);
    $$('[data-out]').forEach(o => { o.textContent = fmt(S[o.dataset.out]); });
  }

  function openEditor(tid, state, pid) {
    const t = tplOf(tid);
    if (!t) return;
    curTid = tid; curPid = pid || null;
    S = { ...DEF, ...(state || stateFrom(t)) };
    PT = 0; playing = true;
    syncUI(); recent(tid); go('editor');
  }

  function onProp(e) {
    const el = e.target;
    if (el.id === 'bgFile') return loadBg(el.files[0]);
    const p = el.dataset && el.dataset.prop;
    if (!p || !S) return;
    S[p] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.type === 'range' ? +el.value : el.value;
    $$(`[data-prop="${p}"]`).forEach(o => { if (o !== el) setVal(o); });
    const out = $(`[data-out="${p}"]`);
    if (out) out.textContent = fmt(S[p]);
  }

  function loadBg(file) {
    if (!file) return;
    if (!/^image\//.test(file.type) || file.size > 8e6) return toast('Choose an image file under 8 MB');
    IMG = new Image();
    IMG.src = URL.createObjectURL(file);
    S.bgType = 'image';
    syncUI();
  }

  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (S && $('#editor').classList.contains('active')) {
      if (playing) { PT += dt; if (PT >= S.dur) PT = 0; }
      frame(pctx, 1280, 720, PT, S, IMG);
      $('#scrub').value = PT / S.dur * 1000;
      $('#clock').textContent = `${PT.toFixed(1)}s / ${S.dur}s`;
      $('#ph').style.left = (PT / S.dur * 100) + '%';
      $('#play').textContent = playing ? 'Pause' : 'Play';
      $('#stage').classList.toggle('checker', S.bgType === 'none');
      $$('.track').forEach((el, i) => el.classList.toggle('off', !S[TRK[i][0]]));
    }
    requestAnimationFrame(tick);
  }

  // ---------- export (real encoding through MediaRecorder; PNG via toBlob) ----------
  function mimeFor(f) {
    if (!window.MediaRecorder) return null;
    const list = f === 'mp4' ? ['video/mp4'] : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    return list.find(m => MediaRecorder.isTypeSupported(m)) || null;
  }

  function openExport() {
    if (!S) return;
    const opts = [['mp4', 'MP4 (smooth, frame-accurate)'], ['webm', 'WebM (real-time, may stutter)'], ['png', 'PNG frame']]
      .filter(([f]) => f === 'png' || (f === 'mp4' ? TFExport.canMp4() : mimeFor(f)));
    $('#exFmt').innerHTML = opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    $('#exNote').textContent = 'MP4 renders every frame at its exact time, so nothing is dropped or repeated. WebM is real-time and may stutter. PNG saves the frame at the playhead. Transparent backgrounds are PNG only.';
    $('#exMsg').textContent = '';
    $('#exBar').style.width = '0%';
    $('#exLink').hidden = true;
    $('#exModal').classList.add('on');
  }

  function done(blob, name) {
    exporting = false;
    $('#exGo').disabled = false;
    if (!blob) return toast('Render failed, please try again');
    const a = $('#exLink');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.textContent = `Download ${name} (${(blob.size / 1048576).toFixed(2)} MB)`;
    a.hidden = false;
    $('#exBar').style.width = '100%';
    $('#exMsg').textContent = 'Render complete.';
    a.click();
    const dl = load('tf.dl', []);
    dl.unshift({ name, at: Date.now() });
    store('tf.dl', dl.slice(0, 30));
  }

  async function startExport() {
    if (exporting || !S) return;
    const f = $('#exFmt').value;
    const [W, H] = $('#exRes').value.split('x').map(Number);
    const fps = +$('#exFps').value;
    const base = ($('#exName').value.trim() || 'themeflow').replace(/[^\w-]+/g, '_');
    const snap = { ...S }, img = IMG, now = PT;
    exporting = true;
    $('#exGo').disabled = true;
    $('#exLink').hidden = true;
    $('#exBar').style.width = '0%';
    const onProgress = p => {
      $('#exBar').style.width = Math.round(p * 100) + '%';
      $('#exMsg').textContent = `Rendering… ${Math.round(p * 100)}%`;
    };
    try {
      if (f === 'png') {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        frame(c.getContext('2d'), W, H, now, snap, img);
        return c.toBlob(b => done(b, `${base}.png`), 'image/png');
      }
      const blob = await TFExport.run({ format: f, W, H, fps, dur: snap.dur, draw: (t, ctx) => frame(ctx, W, H, t, snap, img), onProgress });
      done(blob, `${base}.${f}`);
    } catch (err) {
      exporting = false;
      $('#exGo').disabled = false;
      $('#exMsg').textContent = '';
      toast(err.message || 'Export failed');
    }
  }

  // ---------- thumbnails and hero ----------
  function renderThumbs() {
    const now = performance.now() / 1000;
    visible.forEach(c => frame(c._ctx, 480, 270, (now + c._ph) % c._s.dur, c._s, null));
    requestAnimationFrame(renderThumbs);
  }

  const dots = Array.from({ length: 70 }, (_, i) => ({ x: rnd(i), y: rnd(i + 50), v: 0.2 + rnd(i + 90) * 0.8, r: 1 + rnd(i + 7) * 2.2 }));
  function heroFrame() {
    const c = $('#heroFx');
    if ($('#home').classList.contains('active')) {
      if (c.width !== c.clientWidth) { c.width = c.clientWidth; c.height = c.clientHeight; }
      hx.clearRect(0, 0, c.width, c.height);
      hx.fillStyle = 'rgba(196,181,253,.7)';
      for (const d of dots) {
        d.y -= d.v * 0.0012; if (d.y < 0) d.y = 1;
        hx.beginPath(); hx.arc(d.x * c.width, d.y * c.height, d.r, 0, Math.PI * 2); hx.fill();
      }
    }
    requestAnimationFrame(heroFrame);
  }

  // ---------- navigation ----------
  function go(view, cat) {
    if (!$('#' + view)) return;
    if (cat) F.cat = cat;
    $$('.view').forEach(v => v.classList.toggle('active', v.id === view));
    $$('.nav [data-go]').forEach(a => a.classList.toggle('on', a.dataset.go === view));
    if (view === 'home') renderHome();
    if (view === 'library') { syncChips(); renderLibrary(); }
    if (view === 'projects') renderProjects();
    if (view === 'pricing') renderPlans();
    observeAll();
    if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
    window.scrollTo(0, 0);
  }

  // ---------- event wiring ----------
  function bind() {
    document.addEventListener('input', onProp);
    document.addEventListener('change', onProp);

    document.addEventListener('click', e => {
      const g = e.target.closest('[data-go]');
      if (g) return go(g.dataset.go, g.dataset.cat);
      const act = e.target.closest('[data-act]');
      if (act) {
        const id = act.closest('[data-id]').dataset.id;
        if (act.dataset.act === 'edit') openEditor(id);
        if (act.dataset.act === 'dl') { openEditor(id); openExport(); }
        if (act.dataset.act === 'fav') {
          const f = favs(), i = f.indexOf(id);
          i < 0 ? f.push(id) : f.splice(i, 1);
          store('tf.favs', f);
          act.classList.toggle('on', i < 0);
          if (F.fav) renderLibrary();
        }
        return;
      }
      const pa = e.target.closest('[data-pact]');
      if (pa) {
        const list = load('tf.projects', []), id = pa.dataset.id, p = list.find(x => x.id === id);
        if (!p) return;
        const what = pa.dataset.pact;
        if (what === 'open') openEditor(p.tid, p.state, p.id);
        if (what === 'rename') {
          const n = prompt('Rename project', p.name);
          if (n && n.trim()) { p.name = n.trim().slice(0, 60); store('tf.projects', list); renderProjects(); }
        }
        if (what === 'dup') {
          list.unshift({ ...p, id: Date.now().toString(36), name: p.name + ' (copy)', updated: Date.now() });
          store('tf.projects', list); renderProjects();
        }
        if (what === 'del' && confirm('Delete this project?')) { store('tf.projects', list.filter(x => x.id !== id)); renderProjects(); }
        return;
      }
      const op = e.target.closest('[data-open]');
      if (op) openEditor(op.dataset.open);
    });

    $('#q').oninput = e => { F.q = e.target.value.trim().toLowerCase(); renderLibrary(); };
    $('#sort').onchange = e => { F.sort = e.target.value; renderLibrary(); };
    $('#prem').onchange = e => { F.prem = e.target.value; renderLibrary(); };
    $('#cats').onclick = e => {
      const b = e.target.closest('button[data-cat]');
      if (!b) return;
      F.cat = b.dataset.cat; syncChips(); renderLibrary();
    };
    $('#favOnly').onclick = () => { F.fav = !F.fav; syncChips(); renderLibrary(); };

    $$('.tabs button').forEach(b => b.addEventListener('click', () => {
      $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
      $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + b.dataset.tab));
    }));
    $('#play').onclick = () => { playing = !playing; };
    $('#restart').onclick = () => { PT = 0; playing = true; };
    $('#scrub').oninput = e => { PT = (+e.target.value / 1000) * S.dur; playing = false; };
    $('#zoom').oninput = e => document.documentElement.style.setProperty('--z', e.target.value);
    $('#fs').onclick = () => $('#stage').requestFullscreen?.();
    $('#save').onclick = saveProject;
    $('#exp').onclick = openExport;
    $('#exGo').onclick = startExport;
    $('#exClose').onclick = () => $('#exModal').classList.remove('on');
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && S && $('#editor').classList.contains('active') && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) {
        e.preventDefault();
        playing = !playing;
      }
    });
    window.addEventListener('hashchange', () => {
      const v = location.hash.slice(1);
      if (['home', 'library', 'projects', 'pricing'].includes(v)) go(v);
    });
  }

  // ---------- init ----------
  function init() {
    $('#p-text').innerHTML = UI.text.map(ctrl).join('');
    $('#p-bg').innerHTML = UI.bg.map(ctrl).join('') + '<label class="f">Custom image (not saved with projects)<input type="file" id="bgFile" accept="image/*"></label>';
    $('#p-fx').innerHTML = UI.fx.map(ctrl).join('');
    $('#p-layers').innerHTML = UI.layers.map(ctrl).join('');
    $('#props').innerHTML = UI.props.map(ctrl).join('');
    $('#tracks').insertAdjacentHTML('afterbegin', TRK.map(([, l]) => `<div class="track"><i>${l}</i></div>`).join(''));
    $('#cats').innerHTML = ['All', 'Text', 'Effects', 'Creator'].map(c => `<button data-cat="${c}">${c}</button>`).join('')
      + '<button id="favOnly">♥ Favorites</button>';
    pctx = $('#pv').getContext('2d');
    hx = $('#heroFx').getContext('2d');
    bind();

    const start = location.hash.slice(1);
    go(['library', 'projects', 'pricing'].includes(start) ? start : 'home');
    setTimeout(() => $('#splash').classList.add('gone'), 700);
    requestAnimationFrame(tick);
    requestAnimationFrame(renderThumbs);
    requestAnimationFrame(heroFrame);
  }

  init();
})();
