/* ThemeFlow Minecraft Character Studio (Three.js r128 + shared TFExport).
   Poses are pure functions of time, so the MP4 export renders exactly the same motion as the preview. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const msg = t => { $('#msg').textContent = t; };
  const download = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  // ---------- scene ----------
  const cv = $('#cv');
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor($('#bg').value);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
  cam.position.set(0, 18, 80);
  cam.lookAt(0, 16, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 0.7);
  sun.position.set(30, 60, 40);
  scene.add(sun);
  const root = new THREE.Group();
  scene.add(root);

  // ---------- skin texture (64×64, Minecraft UV layout) ----------
  const skinCv = document.createElement('canvas');
  skinCv.width = skinCv.height = 64;
  const sk = skinCv.getContext('2d');
  const tex = new THREE.CanvasTexture(skinCv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5 });

  function defaultSkin() {
    sk.clearRect(0, 0, 64, 64);
    const fill = (x, y, w, h, c) => { sk.fillStyle = c; sk.fillRect(x, y, w, h); };
    fill(0, 0, 32, 16, '#d9a066');
    fill(0, 0, 32, 8, '#4a2f1a');
    fill(16, 16, 24, 16, '#1ea3c4');
    fill(40, 16, 16, 16, '#1ea3c4');
    fill(32, 48, 16, 16, '#1ea3c4');
    fill(0, 16, 16, 16, '#2b3a8f');
    fill(16, 48, 16, 16, '#2b3a8f');
    tex.needsUpdate = true;
  }

  function applySkin(img) {
    sk.clearRect(0, 0, 64, 64);
    sk.drawImage(img, 0, 0);
    if (img.height === 32) { // legacy 64×32 skin: reuse the right limbs for the left side
      sk.drawImage(img, 0, 16, 16, 16, 16, 48, 16, 16);
      sk.drawImage(img, 40, 16, 16, 16, 32, 48, 16, 16);
    }
    tex.needsUpdate = true;
  }

  // Map a box onto the Minecraft skin layout: right, front, left, back sides, then top and bottom.
  function uvBox(w, h, d, u, v, grow = 0) {
    const g = new THREE.BoxGeometry(w + grow, h + grow, d + grow);
    const uv = g.attributes.uv;
    const faces = [ // BoxGeometry order: +x, -x, +y, -y, +z, -z
      [u + d + w, v + d, d, h], [u, v + d, d, h], [u + d, v, w, d],
      [u + d + w, v, w, d], [u + d, v + d, w, h], [u + 2 * d + w, v + d, w, h],
    ];
    faces.forEach(([fu, fv, fw, fh], f) => {
      const u0 = fu / 64, u1 = (fu + fw) / 64, v0 = 1 - (fv + fh) / 64, v1 = 1 - fv / 64;
      [[u0, v1], [u1, v1], [u0, v0], [u1, v0]].forEach(([a, b], i) => uv.setXY(f * 4 + i, a, b));
    });
    uv.needsUpdate = true;
    return new THREE.Mesh(g, mat);
  }

  // ---------- rig (1 unit = 1 Minecraft pixel; the figure is 32 units tall) ----------
  let rig = null, slim = false, yaw = 0, sizeK = 1;
  function buildRig() {
    if (rig) {
      root.remove(rig.g);
      rig.g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
    const aw = slim ? 3 : 4;
    const pair = (w, h, d, u, v, ou, ov) => [uvBox(w, h, d, u, v), uvBox(w, h, d, ou, ov, 1)];
    const limb = (w, h, d, u, v, ou, ov, px) => {
      const pv = new THREE.Group();
      pv.position.set(px, 24, 0); // shoulder or hip
      pair(w, h, d, u, v, ou, ov).forEach(m => { m.position.y = -h / 2; pv.add(m); });
      return pv;
    };
    const g = new THREE.Group(), body = new THREE.Group();
    const torso = new THREE.Group(); torso.position.y = 18;
    pair(8, 12, 4, 16, 16, 16, 32).forEach(m => torso.add(m));
    const head = new THREE.Group(); head.position.y = 28;
    pair(8, 8, 8, 0, 0, 32, 0).forEach(m => head.add(m));
    const ra = limb(aw, 12, 4, 40, 16, 40, 32, -(4 + aw / 2));
    const la = limb(aw, 12, 4, 32, 48, 48, 48, 4 + aw / 2);
    const rl = limb(4, 12, 4, 0, 16, 0, 32, -2);
    const ll = limb(4, 12, 4, 16, 48, 0, 48, 2);
    rl.position.y = ll.position.y = 12; // legs hang from the hips
    body.add(torso, head, ra, la);
    g.add(body, rl, ll);
    root.add(g);
    rig = { g, body, ra, la, rl, ll };
  }

  // ---------- animations: each is a pure function of loop phase, so preview and export match ----------
  const S = Math.sin;
  const ANIMS = {
    Idle:    { L: 2.4, f: (u, p) => ({ ra: [S(p) * 0.04, 0, -0.05], la: [-S(p) * 0.04, 0, 0.05], y: S(p) * 0.15 }) },
    Walk:    { L: 1.0, f: (u, p) => ({ ra: [S(p) * 0.9, 0, 0], la: [-S(p) * 0.9, 0, 0], rl: [-S(p) * 0.9, 0, 0], ll: [S(p) * 0.9, 0, 0], y: Math.abs(S(p)) * 0.4 }) },
    Run:     { L: 0.6, f: (u, p) => ({ ra: [S(p) * 1.5, 0, 0], la: [-S(p) * 1.5, 0, 0], rl: [-S(p) * 1.3, 0, 0], ll: [S(p) * 1.3, 0, 0], y: Math.abs(S(p)), lean: 0.2 }) },
    Jump:    { L: 1.4, f: u => ({ ra: [-2.7, 0, 0], la: [-2.7, 0, 0], rl: [-0.6, 0, 0], ll: [-0.6, 0, 0], y: Math.sin(u * Math.PI) * 12 }) },
    Punch:   { L: 1.2, f: u => { const k = Math.sin(clamp((u - 0.15) / 0.35, 0, 1) * Math.PI); return { ra: [-1.7 * k - 0.2, 0, 0], la: [0.3, 0, 0.1], yaw: -0.5 * k }; } },
    Dance:   { L: 1.6, f: (u, p) => ({ ra: [-1.8 + S(p) * 0.8, 0, 0], la: [-1.8 - S(p) * 0.8, 0, 0], rl: [0, 0, 0.1 * S(p)], ll: [0, 0, -0.1 * S(p)], yaw: S(p) * 0.4, y: Math.abs(S(p)) * 1.2 }) },
    Victory: { L: 1.4, f: (u, p) => ({ ra: [-3.0, 0, -0.15], la: [-3.0, 0, 0.15], y: Math.abs(S(p)) * 2.5 }) },
    Sit:     { L: 2.0, f: (u, p) => ({ ra: [-0.8, 0, -0.1], la: [-0.8, 0, 0.1], rl: [-1.57, 0, 0], ll: [-1.57, 0, 0], lean: 0.05 + 0.02 * S(p) }) },
  };

  let anim = 'Idle', speed = 1, playing = true, clock = 0;
  const setRot = (o, r) => { const v = r || [0, 0, 0]; o.rotation.set(v[0], v[1], v[2]); };
  function pose(t) {
    if (!rig) return;
    const a = ANIMS[anim], tt = t * speed;
    const u = (((tt % a.L) + a.L) % a.L) / a.L, o = a.f(u, u * Math.PI * 2);
    setRot(rig.ra, o.ra); setRot(rig.la, o.la); setRot(rig.rl, o.rl); setRot(rig.ll, o.ll);
    rig.body.rotation.set(o.lean || 0, o.yaw || 0, 0);
    rig.g.position.y = o.y || 0;
    root.rotation.y = yaw;
    root.scale.setScalar(sizeK);
  }

  // ---------- loop ----------
  let W0 = 0, H0 = 0, last = performance.now();
  function resize() {
    const w = cv.clientWidth, h = cv.clientHeight;
    if (w && h && (w !== W0 || h !== H0)) {
      W0 = w; H0 = h;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
  }
  function loop(now) {
    if (playing) clock += Math.min(0.05, (now - last) / 1000);
    last = now;
    resize();
    pose(clock);
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }

  // ---------- controls ----------
  $('#skin').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== 'image/png' || f.size > 300e3) return msg('Please choose a PNG under 300 KB.');
    const img = new Image();
    img.onload = () => {
      if (img.width !== 64 || (img.height !== 64 && img.height !== 32)) return msg('Skin must be 64×64 or 64×32 pixels.');
      applySkin(img);
      msg('Skin applied.');
    };
    img.onerror = () => msg('Could not read that file.');
    img.src = URL.createObjectURL(f);
  };
  $('#reset').onclick = () => { defaultSkin(); msg('Default skin restored.'); };
  $('#models').onclick = e => {
    const b = e.target.closest('[data-model]');
    if (!b) return;
    slim = b.dataset.model === 'slim';
    $$('#models button').forEach(x => x.classList.toggle('on', x === b));
    buildRig();
  };
  $('#anims').innerHTML = Object.keys(ANIMS).map(n => `<button data-a="${n}" class="${n === anim ? 'on' : ''}">${n}</button>`).join('');
  $('#anims').onclick = e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    anim = b.dataset.a;
    clock = 0;
    $$('#anims button').forEach(x => x.classList.toggle('on', x === b));
  };
  $('#spd').oninput = e => { speed = +e.target.value; $('[data-o=spd]').textContent = speed.toFixed(2); };
  $('#size').oninput = e => { sizeK = +e.target.value; $('[data-o=size]').textContent = sizeK.toFixed(2); };
  $('#bg').oninput = e => renderer.setClearColor(e.target.value);
  $('#play').onclick = () => { playing = !playing; $('#play').textContent = playing ? 'Pause' : 'Play'; };

  let dragX = null;
  cv.onpointerdown = e => { dragX = e.clientX; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (dragX !== null) { yaw += (e.clientX - dragX) * 0.01; dragX = e.clientX; } };
  cv.onpointerup = cv.onpointercancel = () => { dragX = null; };

  $('#png').onclick = () => cv.toBlob(b => download(b, `minecraft-${anim.toLowerCase()}.png`), 'image/png');

  $('#mp4').onclick = async () => {
    if (!TFExport.canMp4()) return msg('MP4 export needs a browser with WebCodecs (Chrome or Edge).');
    const W = 1280, H = 720, fps = 30, dur = 5;
    const xr = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, preserveDrawingBuffer: true });
    xr.setSize(W, H, false);
    xr.setClearColor($('#bg').value);
    const xc = new THREE.PerspectiveCamera(35, W / H, 0.1, 500);
    xc.position.set(0, 18, 80);
    xc.lookAt(0, 16, 0);
    $('#mp4').disabled = true;
    msg('Rendering…');
    try {
      const blob = await TFExport.run({
        format: 'mp4', W, H, fps, dur,
        draw: (t, ctx) => { pose(t); xr.render(scene, xc); ctx.drawImage(xr.domElement, 0, 0, W, H); },
        onProgress: p => msg(`Rendering… ${Math.round(p * 100)}%`),
      });
      download(blob, `minecraft-${anim.toLowerCase()}.mp4`);
      msg('Export complete.');
    } catch (err) {
      msg(err.message || 'Export failed.');
    } finally {
      xr.dispose();
      $('#mp4').disabled = false;
    }
  };

  defaultSkin();
  buildRig();
  requestAnimationFrame(loop);
})();
