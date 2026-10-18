import * as THREE from 'three';
import { toon, part } from './avatar.js';

const FONT = "Sora, Inter, 'Segoe UI', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace";

/* ---------------- canvas helpers ---------------- */
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function canvasTex(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const redraw = (t = 0) => { draw(ctx, w, h, t); tex.needsUpdate = true; };
  redraw(0);
  return { canvas, ctx, tex, redraw };
}
function label(text, { size = 64, color = '#fff', bg = null, border = null, pad = 28, weight = 700, scale = 0.011, glow = null, font = FONT } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `${weight} ${size}px ${font}`;
  const tw = Math.ceil(ctx.measureText(text).width);
  c.width = tw + pad * 2; c.height = Math.ceil(size * 1.7);
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  if (bg) { ctx.fillStyle = bg; rr(ctx, 4, 4, c.width - 8, c.height - 8, (c.height - 8) / 2); ctx.fill(); }
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 4; rr(ctx, 4, 4, c.width - 8, c.height - 8, (c.height - 8) / 2); ctx.stroke(); }
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 24; }
  ctx.fillStyle = color;
  ctx.fillText(text, c.width / 2, c.height / 2 + size * 0.04);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  sp.scale.set(c.width * scale, c.height * scale, 1);
  return sp;
}
function screenMesh(tex, w, h) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  return m;
}
function framedScreen(tex, w, h, { frame = 0x1c1440, glow = 0x7c3aed } = {}) {
  const g = new THREE.Group();
  const back = part(new THREE.BoxGeometry(w + 0.28, h + 0.28, 0.16), toon(frame), { outline: 0.02, parent: g });
  back.position.z = -0.09;
  const scr = screenMesh(tex, w, h);
  g.add(scr);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.36, h + 0.36, 0.06), new THREE.MeshBasicMaterial({ color: glow, toneMapped: false }));
  edge.position.z = -0.2;
  g.add(edge);
  return g;
}

/* ---------------- sky / backdrop ---------------- */
export function buildSky(scene) {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(450, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x070419) }, mid: { value: new THREE.Color(0x261257) }, low: { value: new THREE.Color(0x8a2f86) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(low, mid, smoothstep(-0.75, 0.05, h)); c = mix(c, top, smoothstep(0.25, 0.9, h)); gl_FragColor = vec4(c,1.); }',
    })
  );
  sky.renderOrder = -10;
  scene.add(sky);

  const starGeo = new THREE.BufferGeometry();
  const n = 1400, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
    const R = 400;
    pos[i * 3] = Math.cos(a) * r * R; pos[i * 3 + 1] = Math.abs(u) * R * 0.95 + 15; pos[i * 3 + 2] = Math.sin(a) * r * R;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2.1, sizeAttenuation: false, transparent: true, opacity: 0.85, fog: false, depthWrite: false }));
  scene.add(stars);

  // nebula blobs (parallax group)
  const bg = new THREE.Group();
  const mkBlob = (hex, sc, x, y, z, op) => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, hex + 'cc'); gr.addColorStop(1, hex + '00');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: op, fog: false }));
    s.scale.set(sc, sc, 1); s.position.set(x, y, z);
    bg.add(s);
  };
  [['#7c3aed', 150, 20, 30, -160, 0.5], ['#f472b6', 120, 100, 10, -170, 0.38], ['#22d3ee', 110, 180, 40, -190, 0.3], ['#7c3aed', 160, 260, 20, -170, 0.45], ['#f472b6', 130, 360, 35, -180, 0.34], ['#22d3ee', 120, -60, 25, -170, 0.3]].forEach((b) => mkBlob(...b));

  // distant floating islands
  const far = new THREE.Group();
  const rockM = toon(0x3a2a7a);
  const topM = toon(0x5b4bd0);
  for (let i = 0; i < 16; i++) {
    const g = new THREE.Group();
    const r = 2 + Math.random() * 3.2;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, 0.5, 9), topM);
    const under = new THREE.Mesh(new THREE.ConeGeometry(r * 0.9, r * 1.3, 9), rockM);
    under.rotation.x = Math.PI; under.position.y = -0.25 - r * 0.65;
    g.add(top, under);
    g.position.set(i * 14 - 20 + Math.random() * 8, 4 + Math.random() * 16, -26 - Math.random() * 36);
    g.userData.bob = Math.random() * 6;
    far.add(g);
  }
  scene.add(bg, far);
  return {
    update(t, camPos) {
      sky.position.copy(camPos); stars.position.copy(camPos);
      bg.position.set(camPos.x * 0.92, camPos.y * 0.9, camPos.z);
      far.position.x = camPos.x * 0.35; far.position.y = camPos.y * 0.5;
      far.children.forEach((g) => { g.position.y += Math.sin(t * 0.5 + g.userData.bob) * 0.002; g.rotation.y = t * 0.04 + g.userData.bob; });
    },
  };
}

/* ---------------- islands ---------------- */
function island(r = 5.6) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.97, 0.7, 56), toon(0x4a3fb5));
  top.position.y = -0.35; top.receiveShadow = true;
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.78, 0.72, 56), toon(0x6454d8));
  plaza.position.y = -0.345; plaza.receiveShadow = true;
  const under = new THREE.Mesh(new THREE.ConeGeometry(r * 0.97, r * 1.25, 11), toon(0x2c2163));
  under.rotation.x = Math.PI; under.position.y = -0.7 - r * 0.625;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.99, 0.07, 8, 80), new THREE.MeshBasicMaterial({ color: 0x5eead4, toneMapped: false }));
  rim.rotation.x = Math.PI / 2; rim.position.y = -0.02;
  g.add(top, plaza, under, rim);
  // floating pebbles
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.3), toon(0x3b2d82));
    const a = Math.random() * Math.PI * 2, d = r * (0.85 + Math.random() * 0.3);
    p.position.set(Math.cos(a) * d, -1.2 - Math.random() * 2, Math.sin(a) * d);
    p.userData.f = Math.random() * 6;
    g.add(p);
  }
  g.userData.pebbles = g.children.filter((c) => c.userData.f !== undefined);
  return g;
}
function tree(color = 0xf472b6, h = 1.6) {
  const g = new THREE.Group();
  part(new THREE.CylinderGeometry(0.1, 0.14, h * 0.4, 8), toon(0x4b2d6a), { pos: [0, h * 0.2, 0], parent: g, outline: 0.06 });
  [[0.62, 0.55], [0.46, 0.95], [0.3, 1.3]].forEach(([r, y], i) => {
    part(new THREE.ConeGeometry(r, h * 0.55, 9), toon(color), { pos: [0, h * (0.35 + i * 0.28) + 0.2, 0], parent: g, outline: 0.06 });
  });
  return g;
}
function lamp(color = 0x5eead4) {
  const g = new THREE.Group();
  part(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 8), toon(0x2a2050), { pos: [0, 0.7, 0], parent: g, outline: 0 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  bulb.position.y = 1.5; g.add(bulb);
  return g;
}

/* generic info screen */
function infoScreen(title, sub, col, lines, w = 3.4) {
  const t = canvasTex(768, 480, (c, cw, ch) => {
    const gr = c.createLinearGradient(0, 0, cw, ch); gr.addColorStop(0, '#1c1442'); gr.addColorStop(1, '#0d0a24');
    c.fillStyle = gr; c.fillRect(0, 0, cw, ch);
    c.fillStyle = col; c.fillRect(0, 0, 14, ch);
    c.globalAlpha = 0.18; c.beginPath(); c.arc(cw - 60, 60, 140, 0, 7); c.fill(); c.globalAlpha = 1;
    c.fillStyle = '#fff'; c.font = `800 ${title.length > 12 ? 58 : 76}px ${FONT}`; c.fillText(title, 48, 130);
    c.fillStyle = col; c.font = `700 32px ${FONT}`; c.fillText(sub, 50, 184);
    lines.forEach((l, i) => { c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, 44, 224 + i * 76, cw - 88, 58, 29); c.fill(); c.fillStyle = '#e9e4ff'; c.font = `500 28px ${FONT}`; c.fillText(l, 70, 262 + i * 76); });
  });
  return framedScreen(t.tex, w, w * 0.625, { frame: 0x241a52, glow: new THREE.Color(col).getHex() });
}

/* ---------------- world ---------------- */
export function buildWorld(scene, anchors, curve, opts = {}) {
  const lowPower = !!opts.lowPower;
  const chapters = [];
  const updaters = [];

  anchors.forEach((a, i) => {
    const g = new THREE.Group();
    g.position.copy(a);
    scene.add(g);
    const isl = island(5.6);
    g.add(isl);
    chapters.push({ g, isl, sg: i % 2 === 0 ? 1 : -1 });
  });

  chapters[9].sg = 1; chapters[10].sg = -1; // keep prop mirroring as designed

  /* path tiles between islands */
  const tiles = [];
  const tileGeo = new THREE.BoxGeometry(0.95, 0.18, 0.95);
  const SAMPLES = 400;
  for (let k = 0; k <= SAMPLES; k++) {
    const p = curve.getPoint(k / SAMPLES);
    const nearest = Math.min(...anchors.map((a) => Math.hypot(a.x - p.x, a.z - p.z)));
    if (nearest > 5.1 && k % 2 === 0) tiles.push(p);
  }
  const tileMesh = new THREE.InstancedMesh(tileGeo, toon(0x7c6cf0), tiles.length);
  const dummy = new THREE.Object3D();
  tiles.forEach((p, i) => {
    dummy.position.set(p.x, p.y - 0.1, p.z); dummy.rotation.y = Math.sin(i * 1.7) * 0.2; dummy.scale.setScalar(0.88 + Math.sin(i * 3.1) * 0.08);
    dummy.updateMatrix(); tileMesh.setMatrixAt(i, dummy.matrix);
  });
  tileMesh.castShadow = false; tileMesh.receiveShadow = true;
  scene.add(tileMesh);
  const trail = new THREE.Mesh(new THREE.TubeGeometry(curve, 400, 0.035, 6, false), new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.55, toneMapped: false }));
  trail.position.y = -0.02;
  scene.add(trail);

  /* fireflies */
  const FF = lowPower ? 90 : 220;
  const ffGeo = new THREE.BufferGeometry();
  const ffPos = new Float32Array(FF * 3), ffSeed = [];
  const x0 = Math.min(...anchors.map((a) => a.x)) - 10, x1 = Math.max(...anchors.map((a) => a.x)) + 12;
  for (let i = 0; i < FF; i++) {
    ffPos[i * 3] = x0 + Math.random() * (x1 - x0);
    ffPos[i * 3 + 1] = Math.random() * 20;
    ffPos[i * 3 + 2] = -8 + Math.random() * 14;
    ffSeed.push(Math.random() * 100);
  }
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  const ff = new THREE.Points(ffGeo, new THREE.PointsMaterial({ color: 0xfde68a, size: 3.5, sizeAttenuation: false, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(ff);
  const ffBase = ffPos.slice();
  updaters.push((t) => {
    const p = ffGeo.attributes.position.array;
    for (let i = 0; i < FF; i++) {
      p[i * 3] = ffBase[i * 3] + Math.sin(t * 0.3 + ffSeed[i]) * 1.4;
      p[i * 3 + 1] = ffBase[i * 3 + 1] + Math.sin(t * 0.5 + ffSeed[i] * 2) * 0.9;
    }
    ffGeo.attributes.position.needsUpdate = true;
  });

  const add = (i, obj, x, y, z, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; chapters[i].g.add(obj); return obj; };

  /* ===== 0 · Hello ===== */
  {
    const sg = chapters[0].sg;
    const desk = new THREE.Group();
    part(new THREE.BoxGeometry(3.2, 0.14, 1.4), toon(0x4b3a9a), { pos: [0, 1.0, 0], parent: desk, outline: 0.03 });
    [[-1.4, -0.55], [1.4, -0.55], [-1.4, 0.55], [1.4, 0.55]].forEach(([x, z]) => part(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8), toon(0x2a2050), { pos: [x, 0.5, z], parent: desk, outline: 0 }));
    // laptop
    const code = canvasTex(1024, 640, (c, w, h) => {
      c.fillStyle = '#0d0a22'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#1b1540'; c.fillRect(0, 0, w, 54);
      ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(34 + i * 34, 27, 9, 0, 7); c.fill(); });
      c.fillStyle = '#9d8fd6'; c.font = `500 24px ${MONO}`; c.fillText('Nishi.java', 150, 34);
      const L = [
        [['@SpringBootApplication', '#f9a8d4']],
        [['public class ', '#c4b5fd'], ['Nishi ', '#5eead4'], ['{', '#fff']],
        [['  String ', '#c4b5fd'], ['role', '#fff'], [' = ', '#9d8fd6'], ['"Senior Associate @ BNY"', '#fde68a'], [';', '#fff']],
        [['  List', '#5eead4'], ['<String> ', '#fff'], ['builds', '#fff'], [' = ', '#9d8fd6'], ['List.of(', '#fff']],
        [['    "pipelines", "AI agents",', '#fde68a']],
        [['    "Inkyora", "DAuth"', '#fde68a'], [');', '#fff']],
        [['', '#fff']],
        [['  void ', '#c4b5fd'], ['ship', '#93c5fd'], ['() {', '#fff']],
        [['    coffee', '#fff'], ['.refill', '#93c5fd'], ['();', '#fff']],
        [['    deploy', '#93c5fd'], ['(', '#fff'], ['"with joy"', '#fde68a'], [');', '#fff']],
        [['  }', '#fff']],
        [['}', '#fff']],
      ];
      c.font = `500 31px ${MONO}`;
      L.forEach((segs, li) => { let x = 36; segs.forEach(([txt, col]) => { c.fillStyle = col; c.fillText(txt, x, 112 + li * 43); x += c.measureText(txt).width; }); });
    });
    const lap = new THREE.Group();
    part(new THREE.BoxGeometry(1.5, 0.06, 1.0), toon(0xb8b2d6), { pos: [0, 0, 0], parent: lap, outline: 0.03 });
    const scr = framedScreen(code.tex, 1.5, 0.94, { frame: 0xb8b2d6, glow: 0x5eead4 });
    scr.position.set(0, 0.55, -0.45); scr.rotation.x = -0.12; scr.scale.setScalar(1);
    lap.add(scr);
    lap.position.set(0.2, 1.1, 0);
    desk.add(lap);
    // mug
    part(new THREE.CylinderGeometry(0.13, 0.11, 0.24, 14), toon(0xf472b6), { pos: [-1.1, 1.19, 0.2], parent: desk, outline: 0.06 });
    const hello = label('Hello, World.', { size: 84, color: '#fff', glow: '#a78bfa', scale: 0.0105 });
    hello.position.set(0.3, 3.6, 0); desk.add(hello);
    add(0, desk, sg * 3.7, 0, -1.8, -sg * 0.28);
    add(0, tree(0x5eead4, 2.2), sg * 6.4, 0, -2.2);
    add(0, tree(0xf472b6, 1.7), sg * 6.9, 0, 0.4);
    add(0, lamp(0xfde68a), sg * 1.9, 0, -2.4);
    updaters.push((t) => { hello.position.y = 3.6 + Math.sin(t * 1.4) * 0.08; });
  }

  /* ===== 1 · Origins (NIT Trichy) ===== */
  {
    const sg = chapters[1].sg;
    const gate = new THREE.Group();
    const stone = toon(0xd9cfff), dark = toon(0x2f2468);
    [-1.7, 1.7].forEach((x) => { part(new THREE.BoxGeometry(0.6, 3.4, 0.6), stone, { pos: [x, 1.7, 0], parent: gate, outline: 0.03 }); part(new THREE.BoxGeometry(0.8, 0.25, 0.8), dark, { pos: [x, 3.5, 0], parent: gate, outline: 0.03 }); });
    part(new THREE.BoxGeometry(4.4, 0.5, 0.7), stone, { pos: [0, 3.65, 0], parent: gate, outline: 0.03 });
    part(new THREE.BoxGeometry(2.6, 0.5, 0.5), dark, { pos: [0, 4.15, 0], parent: gate, outline: 0.03 });
    const sign = label('NIT TRICHY · 2019–23', { size: 52, color: '#fff', bg: '#7c3aed', scale: 0.0105 });
    sign.position.set(0, 3.65, 0.45); gate.add(sign);
    const sub = label('B.Tech · Mechanical Engineering', { size: 40, color: '#5eead4', glow: '#5eead4', scale: 0.0105 });
    sub.position.set(0, 5.0, 0.2); gate.add(sub);
    add(1, gate, sg * 3.4, 0, -2.6);
    // floating project cards
    const cards = new THREE.Group();
    const defs = [['CodeChef NITT', '#7c3aed'], ['Toastmasters', '#f472b6'], ["GSoC '21", '#22d3ee'], ['Alumni Cell', '#34d399']];
    defs.forEach(([name, col], i) => {
      const t = canvasTex(512, 320, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, col); gr.addColorStop(1, '#1b1240');
        c.fillStyle = gr; rr(c, 0, 0, w, h, 36); c.fill();
        c.fillStyle = 'rgba(255,255,255,.18)'; rr(c, 28, 28, 120, 14, 7); c.fill(); rr(c, 28, 54, 70, 14, 7); c.fill();
        c.fillStyle = '#fff'; c.font = `800 58px ${FONT}`; c.fillText(name, 28, h - 70);
        c.font = `500 30px ${FONT}`; c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(['Outreach & Media Lead', 'Public Speaker', 'Participant', 'Coordinator'][i], 28, h - 28);
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.06), new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
      m.userData.a = (i / defs.length) * Math.PI * 2;
      cards.add(m);
    });
    add(1, cards, -sg * 0.2, 3.2, -0.6);
    add(1, tree(0x34d399, 2.0), sg * 7, 0, 0.6);
    add(1, tree(0xf472b6, 1.5), sg * 6.4, 0, -3.8);
    add(1, tree(0x5eead4, 1.7), -sg * 4.4, 0, -3.8);
    updaters.push((t) => {
      cards.children.forEach((m) => {
        const a = m.userData.a + t * 0.35;
        m.position.set(Math.cos(a) * 3.6 * -sg * -1, Math.sin(a * 1.0) * 0.5, Math.sin(a) * 1.7 - 1.0);
        m.rotation.y = -Math.sin(a) * 0.25;
      });
    });
  }

  /* ===== 4,5,6 · Internships (one island each) ===== */
  {
    const defs = [
      ['Encome', 'SDE Intern', 'Oct 2021 – Feb 2022', 'React · ChartJS · Trading UI', '#22d3ee'],
      ['Goldman Sachs', 'Summer Analyst', 'Jun – Aug 2022', 'PySpark · Databricks · Risk', '#f472b6'],
      ['FrontPage', 'SDE Intern', 'Feb – Jun 2023', 'React · Node · TypeScript · GPT', '#a78bfa'],
    ];
    const boards = [];
    defs.forEach(([name, role, dates, tech, col], i) => {
      const k = 4 + i;
      const t = canvasTex(768, 480, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1c1442'); gr.addColorStop(1, '#0d0a24');
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
        c.fillStyle = col; c.fillRect(0, 0, 14, h);
        c.fillStyle = col; c.globalAlpha = 0.18; c.beginPath(); c.arc(w - 60, 60, 140, 0, 7); c.fill(); c.globalAlpha = 1;
        c.fillStyle = '#fff'; c.font = `800 ${name.length > 9 ? 70 : 86}px ${FONT}`; c.fillText(name, 48, 150);
        c.fillStyle = col; c.font = `700 40px ${FONT}`; c.fillText(role, 50, 220);
        c.fillStyle = '#b6add9'; c.font = `500 34px ${FONT}`; c.fillText(dates, 50, 275);
        c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, 44, 340, w - 88, 70, 35); c.fill();
        c.fillStyle = '#e9e4ff'; c.font = `500 30px ${MONO}`; c.fillText(tech, 74, 386);
      });
      const b = framedScreen(t.tex, 3.6, 2.25, { frame: 0x241a52, glow: new THREE.Color(col).getHex() });
      b.position.set(3.4, 3.6, -2.6);
      b.userData.base = 3.6; b.userData.i = i;
      chapters[k].g.add(b);
      part(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 8), toon(0x2a2050), { pos: [3.4, 1.2, -2.8], parent: chapters[k].g, outline: 0 });
      part(new THREE.CylinderGeometry(0.9, 1.0, 0.16, 24), toon(0x3b2f86), { pos: [3.4, 0.06, -2.7], parent: chapters[k].g, outline: 0.03 });
      add(k, tree([0x5eead4, 0xf472b6, 0x34d399][i], 2.0), 6.6, 0, -1.0);
      add(k, lamp([0xf472b6, 0x5eead4, 0xfde68a][i]), -2.6, 0, -2.4);
      boards.push(b);
    });
    updaters.push((t) => boards.forEach((b) => { b.position.y = b.userData.base + Math.sin(t * 1.1 + b.userData.i * 1.7) * 0.1; b.rotation.y = -0.18 + Math.sin(t * 0.6 + b.userData.i) * 0.04; }));
  }

  /* ===== 3 · BNY ===== */
  {
    const sg = chapters[7].sg; // -1 → props to the left
    const winTex = (() => {
      const c = document.createElement('canvas'); c.width = 128; c.height = 256;
      const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 128, 256);
      const cols = ['#fde68a', '#67e8f9', '#f9a8d4', '#fff'];
      for (let y = 8; y < 250; y += 16) for (let x = 8; x < 120; x += 16) { if (Math.random() > 0.42) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(x, y, 9, 9); } }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    })();
    const city = new THREE.Group();
    [[-6.6, 6.5, 1.5], [-5.0, 8.8, 1.7], [-3.2, 7.2, 1.6], [-1.6, 5.4, 1.3], [-7.6, 4.6, 1.3], [0.0, 6.4, 1.4]].forEach(([x, h, w], i) => {
      const m = new THREE.MeshToonMaterial({ color: 0x1e1750, gradientMap: toon(0).gradientMap, emissive: 0xffffff, emissiveMap: winTex.clone(), emissiveIntensity: 0.9 });
      m.emissiveMap.repeat.set(w / 1.6, h / 2.6); m.emissiveMap.needsUpdate = true;
      const b = part(new THREE.BoxGeometry(w, h, w), m, { pos: [x * -sg * -1, h / 2, -5.4 - (i % 2) * 1.4], parent: city, outline: 0.012 });
      part(new THREE.BoxGeometry(w * 0.9, 0.14, w * 0.9), toon(0x7c3aed), { pos: [0, h / 2 + 0.07, 0], parent: b, outline: 0 });
    });
    add(7, city, 0, 0, 0);
    const bnySign = label('BNY · Trade Data Intelligence', { size: 50, color: '#fff', bg: '#5b21b6', scale: 0.0105 });
    bnySign.position.set(-3.6 * -sg * -1 + 0.2, 9.6, -5); city.add(bnySign);
    // data pipeline
    const pipe = new THREE.Group();
    const glass = toon(0x8be9d9, { transparent: true, opacity: 0.35 });
    const stages = [[-5.2, 'S3'], [-2.8, 'ETL'], [-0.4, 'SQL DW']];
    stages.forEach(([x, name], i) => {
      if (i === 0) part(new THREE.CylinderGeometry(0.62, 0.62, 1.1, 20), toon(0xf59e0b), { pos: [x, 0.55, 0], parent: pipe });
      if (i === 1) part(new THREE.BoxGeometry(1.2, 1.2, 1.2), toon(0x7c3aed), { pos: [x, 0.6, 0], parent: pipe });
      if (i === 2) { for (let k = 0; k < 3; k++) part(new THREE.CylinderGeometry(0.62, 0.62, 0.34, 20), toon(k % 2 ? 0x34d399 : 0x22d3ee), { pos: [x, 0.2 + k * 0.4, 0], parent: pipe }); }
      const l = label(name, { size: 40, color: '#fff', bg: 'rgba(20,10,50,.75)', scale: 0.0095 }); l.position.set(x, 1.9, 0); pipe.add(l);
    });
    [[-4.1, 1.7], [-1.6, 1.7]].forEach(([x, len]) => { const p = part(new THREE.CylinderGeometry(0.2, 0.2, len, 14), glass, { pos: [x, 0.6, 0], rot: [0, 0, Math.PI / 2], parent: pipe, outline: 0 }); });
    const PN = 36, pp = new Float32Array(PN * 3);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xfde68a, size: 7, sizeAttenuation: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pipe.add(pts);
    add(7, pipe, -sg * 0 + 0.0, 0, -1.8 + 0.2);
    pipe.position.x = (sg === -1 ? -0.4 : 0.4);
    updaters.push((t) => {
      for (let i = 0; i < PN; i++) {
        const u = ((i / PN) + t * 0.12) % 1;
        pp[i * 3] = -5.2 + u * 4.8; pp[i * 3 + 1] = 0.6 + Math.sin(u * 40 + i) * 0.05; pp[i * 3 + 2] = Math.sin(i * 12.3) * 0.1;
      }
      pg.attributes.position.needsUpdate = true;
    });
    add(7, tree(0xf472b6, 1.6), -sg * 5.8, 0, 1.0);
  }

  /* ===== 4 · Skills orbit ===== */
  const orbit = [];
  {
    const sg = chapters[9].sg;
    const tags = [
      ['Java', '#f59e0b'], ['Spring Boot', '#34d399'], ['Python', '#60a5fa'], ['PySpark', '#fb923c'], ['Node.js', '#4ade80'], ['React', '#22d3ee'], ['TypeScript', '#60a5fa'],
      ['Svelte', '#fb7185'], ['Prisma', '#a78bfa'], ['MySQL', '#38bdf8'], ['PostgreSQL', '#818cf8'], ['MongoDB', '#34d399'], ['AWS S3', '#fbbf24'], ['GitLab CI/CD', '#f472b6'], ['AI Agents', '#e879f9'],
    ];
    const grp = new THREE.Group();
    tags.forEach(([name, col], i) => {
      const s = label(name, { size: 46, color: '#fff', bg: 'rgba(18,10,48,.82)', border: col, scale: 0.0105 });
      s.userData.a = (i / tags.length) * Math.PI * 2;
      grp.add(s); orbit.push(s);
    });
    add(9, grp, sg * 1.1, 0, -1.0);
    chapters[9].orbit = grp;
    // central pedestal glow ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.05, 8, 64), new THREE.MeshBasicMaterial({ color: 0xa78bfa, toneMapped: false }));
    ring.rotation.x = Math.PI / 2; add(9, ring, sg * 0, 0.02, 0);
    add(9, tree(0x5eead4, 2.2), -sg * 5.4, 0, -2.0);
    add(9, lamp(0xf472b6), sg * 5.4, 0, 1.6);
    updaters.push((t) => {
      orbit.forEach((s) => {
        const a = s.userData.a + t * 0.22;
        s.position.set(Math.cos(a) * 4.3, 2.3 + Math.sin(a) * 1.45 + Math.sin(a * 3) * 0.12, Math.sin(a) * 2.2);
      });
    });
  }

  /* ===== 5 · Projects (Inkyora) ===== */
  let inkyora;
  {
    const sg = chapters[10].sg;
    const PROMPT = 'A fox lantern-keeper in a snowy village, Ghibli style';
    inkyora = canvasTex(1280, 800, (c, w, h, t) => {
      const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#120d2e'); gr.addColorStop(1, '#2a1760');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      // header
      const wg = c.createLinearGradient(40, 0, 260, 0); wg.addColorStop(0, '#c4b5fd'); wg.addColorStop(1, '#f9a8d4');
      c.fillStyle = wg; c.font = `800 52px ${FONT}`; c.fillText('inkyora', 50, 86);
      c.fillStyle = 'rgba(255,255,255,.1)'; ['Create', 'Projects', 'Credits'].forEach((s, i) => { rr(c, 780 + i * 150, 46, 138, 52, 26); c.fill(); });
      c.fillStyle = '#d8d0ff'; c.font = `600 24px ${FONT}`; ['Create', 'Projects', 'Credits'].forEach((s, i) => c.fillText(s, 806 + i * 150 + (s === 'Projects' ? -4 : s === 'Credits' ? 2 : 6), 80));
      const tt = t % 12;
      // prompt box
      c.fillStyle = 'rgba(255,255,255,.07)'; rr(c, 50, 150, 560, 250, 30); c.fill();
      c.strokeStyle = 'rgba(167,139,250,.6)'; c.lineWidth = 3; rr(c, 50, 150, 560, 250, 30); c.stroke();
      c.fillStyle = '#8b83b8'; c.font = `600 24px ${FONT}`; c.fillText('YOUR PROMPT', 84, 202);
      const n = Math.min(PROMPT.length, Math.floor(tt * 11));
      c.fillStyle = '#fff'; c.font = `500 34px ${FONT}`;
      const shown = PROMPT.slice(0, n);
      const words = shown.split(' '); let line = '', y = 262;
      words.forEach((wd) => { const test = line + wd + ' '; if (c.measureText(test).width > 490) { c.fillText(line, 84, y); line = wd + ' '; y += 46; } else line = test; });
      c.fillText(line + (Math.floor(t * 2) % 2 ? '|' : ''), 84, y);
      // generate button
      const done = tt > 5.2;
      const bg2 = c.createLinearGradient(50, 0, 360, 0); bg2.addColorStop(0, '#7c3aed'); bg2.addColorStop(1, '#ec4899');
      c.fillStyle = bg2; rr(c, 50, 430, 330, 78, 39); c.fill();
      c.fillStyle = '#fff'; c.font = `700 30px ${FONT}`; c.fillText(tt > 4.2 ? (done ? 'Storyboard ready ✓' : 'Generating…') : 'Generate storyboard', 84, 480);
      // style chips
      ['Motion', 'Cinematic'].forEach((s, i) => { c.fillStyle = i === (tt > 8 ? 1 : 0) ? 'rgba(94,234,212,.25)' : 'rgba(255,255,255,.08)'; rr(c, 410 + i * 110 + (i ? 20 : 0), 440, i ? 190 : 140, 58, 29); c.fill(); c.fillStyle = '#e9e4ff'; c.font = `600 24px ${FONT}`; c.fillText(s, 432 + i * 110 + (i ? 20 : 0), 477); });
      // storyboard frames
      const cols = [['#38bdf8', '#6366f1'], ['#f472b6', '#f59e0b'], ['#34d399', '#22d3ee']];
      for (let i = 0; i < 3; i++) {
        const x = 660 + (i % 2) * 290, yy = 150 + Math.floor(i / 2) * 180;
        const appear = Math.max(0, Math.min(1, (tt - 5.2 - i * 0.5) * 2));
        c.globalAlpha = 0.15 + 0.85 * appear;
        const fg = c.createLinearGradient(x, yy, x + 260, yy + 160); fg.addColorStop(0, cols[i][0]); fg.addColorStop(1, cols[i][1]);
        c.fillStyle = fg; rr(c, x, yy, 260, 160, 24); c.fill();
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(x, yy + 160); c.lineTo(x + 70, yy + 90); c.lineTo(x + 120, yy + 130); c.lineTo(x + 170, yy + 70); c.lineTo(x + 260, yy + 160); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,.9)'; c.font = `700 22px ${FONT}`; c.fillText('Scene ' + (i + 1), x + 16, yy + 34);
        c.globalAlpha = 1;
      }
      // approve + progress
      if (tt > 7) {
        c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, 660, 540, 550, 18, 9); c.fill();
        const pr = Math.min(1, (tt - 7.2) / 3.5);
        const pg2 = c.createLinearGradient(660, 0, 1210, 0); pg2.addColorStop(0, '#5eead4'); pg2.addColorStop(1, '#a78bfa');
        c.fillStyle = pg2; rr(c, 660, 540, Math.max(18, 550 * pr), 18, 9); c.fill();
        c.fillStyle = '#d8d0ff'; c.font = `600 26px ${FONT}`; c.fillText(pr >= 1 ? 'Reel ready · 0:24 · download' : 'Animating approved frames… ' + Math.round(pr * 100) + '%', 660, 600);
      }
      // footer
      c.fillStyle = 'rgba(255,255,255,.06)'; rr(c, 50, 640, 1180, 110, 30); c.fill();
      c.fillStyle = '#bdb2f0'; c.font = `500 28px ${FONT}`; c.fillText('One prompt  →  storyboard  →  approve  →  finished reel', 90, 706);
    });
    const big = framedScreen(inkyora.tex, 5.2, 3.25, { frame: 0x1a1240, glow: 0xa78bfa });
    add(10, big, sg * 2.6 * -1 + 0.0, 3.55, -2.6, -sg * 0.0);
    big.rotation.y = -sg * -0.14;
    // stand
    part(new THREE.CylinderGeometry(0.1, 0.14, 1.9, 10), toon(0x2a2050), { pos: [big.position.x, 0.95, -2.8], parent: chapters[10].g, outline: 0 });
    part(new THREE.CylinderGeometry(0.9, 1.0, 0.16, 24), toon(0x3b2f86), { pos: [big.position.x, 0.06, -2.7], parent: chapters[10].g, outline: 0.03 });
    const live = label('live · inkyora.com', { size: 44, color: '#0b0620', bg: '#5eead4', scale: 0.0105 });
    live.position.set(big.position.x, 5.9, -2.4); chapters[10].g.add(live);
    // small repo cubes
    const rep = new THREE.Group();
    [['hexgrid-react', '#f472b6'], ['collab editor', '#22d3ee'], ['handy-links', '#fbbf24']].forEach(([n, col], i) => {
      const l = label(n, { size: 38, color: '#fff', bg: 'rgba(18,10,48,.85)', border: col, scale: 0.0095 }); l.position.set(i * 0.0, i * 0.9, 0); rep.add(l);
    });
    add(10, rep, sg * -3.9 * -1, 1.2, 1.0);
    rep.position.x = -sg * -4.2 * -1;
    rep.position.x = sg === -1 ? 2.4 : -2.4;
    add(10, tree(0xf472b6, 1.9), -sg * -5.8, 0, -3.0);
    add(10, lamp(0x5eead4), sg * -5.2 * -1, 0, 2.0);
  }

  /* ===== 6 · Projects (DAuth & friends) ===== */
  {
    
    const dauth = canvasTex(1024, 640, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1c1442'); gr.addColorStop(1, '#0d0a24');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = '#7c3aed'; c.globalAlpha = 0.2; c.beginPath(); c.arc(w - 120, 100, 220, 0, 7); c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#fff'; c.font = `800 64px ${FONT}`; c.fillText('DAuth', 60, 110);
      c.fillStyle = '#5eead4'; c.font = `600 28px ${FONT}`; c.fillText('one login for the whole campus', 62, 156);
      c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, 60, 210, 440, 66, 18); c.fill(); rr(c, 60, 296, 440, 66, 18); c.fill();
      c.fillStyle = '#9d8fd6'; c.font = `500 26px ${FONT}`; c.fillText('roll number', 84, 252); c.fillText('••••••••', 84, 338);
      const g2 = c.createLinearGradient(60, 0, 500, 0); g2.addColorStop(0, '#7c3aed'); g2.addColorStop(1, '#ec4899');
      c.fillStyle = g2; rr(c, 60, 394, 440, 70, 35); c.fill();
      c.fillStyle = '#fff'; c.font = `700 28px ${FONT}`; c.fillText('Sign in securely', 150, 440);
      c.fillStyle = 'rgba(255,255,255,.07)'; rr(c, 560, 190, 410, 330, 30); c.fill();
      c.fillStyle = '#f472b6'; c.font = `800 86px ${FONT}`; c.fillText('30,000+', 590, 320);
      c.fillStyle = '#d8d0ff'; c.font = `500 28px ${FONT}`; c.fillText('students signing in', 592, 366);
      c.fillStyle = '#8b83b8'; c.font = `500 24px ${MONO}`; c.fillText('Svelte · TS · Node · Express', 592, 430); c.fillText('MySQL · Prisma', 592, 466);
      c.fillStyle = 'rgba(255,255,255,.06)'; rr(c, 60, 540, 904, 56, 28); c.fill();
      c.fillStyle = '#bdb2f0'; c.font = `500 24px ${FONT}`; c.fillText('auth.delta.nitt.edu · NIT Trichy’s campus login', 90, 577);
    });
    const big = framedScreen(dauth.tex, 4.6, 2.875, { frame: 0x1a1240, glow: 0x7c3aed });
    add(2, big, 3.2, 3.7, -2.8, -0.15); big.scale.setScalar(1.15);
    part(new THREE.CylinderGeometry(0.1, 0.14, 1.9, 10), toon(0x2a2050), { pos: [3.2, 0.95, -3.0], parent: chapters[2].g, outline: 0 });
    part(new THREE.CylinderGeometry(0.9, 1.0, 0.16, 24), toon(0x3b2f86), { pos: [3.2, 0.06, -2.9], parent: chapters[2].g, outline: 0.03 });
    // lock
    const lock = new THREE.Group();
    part(new THREE.BoxGeometry(0.7, 0.55, 0.3), toon(0xfbbf24), { pos: [0, 0, 0], parent: lock, outline: 0.04 });
    part(new THREE.TorusGeometry(0.22, 0.06, 8, 20, Math.PI), toon(0xcfc6ff), { pos: [0, 0.27, 0], parent: lock, outline: 0 });
    add(2, lock, 6.2, 1.9, -0.6);
    const mini = (title, sub, col, lines) => {
      const t = canvasTex(640, 400, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, col); gr.addColorStop(1, '#150c38');
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
        c.fillStyle = '#fff'; c.font = `800 52px ${FONT}`; c.fillText(title, 36, 90);
        c.fillStyle = 'rgba(255,255,255,.9)'; c.font = `600 28px ${FONT}`; c.fillText(sub, 38, 138);
        c.fillStyle = 'rgba(255,255,255,.14)';
        lines.forEach((l, i) => { rr(c, 36, 190 + i * 62, 568, 48, 24); c.fill(); });
        c.fillStyle = '#fff'; c.font = `500 24px ${FONT}`;
        lines.forEach((l, i) => c.fillText(l, 56, 223 + i * 62));
      });
      return framedScreen(t.tex, 2.3, 1.44, { frame: 0x1c1440, glow: new THREE.Color(col).getHex() });
    };
    const s1 = add(3, mini("Pragyan '22", 'auth · registration · events', '#f472b6', ['6,000+ attendees', 'Pragyan CMS modules', 'Event management']), 3.6, 4.6, -3.2, -0.15);
    const s2 = add(3, mini("Synergy '23", 'official fest platform', '#22d3ee', ['500+ participants', 'Node · Express · Postgres', 'Admin operations']), 6.4, 3.0, -2.2, -0.1);
    const s3 = add(3, mini('WhatsApp Web clone', 'realtime messaging', '#34d399', ['React · Redux · WebSockets', 'Message search', 'Chat archival']), 3.4, 2.2, -0.6, -0.1);
    updaters.push((t) => {
      lock.rotation.y = Math.sin(t * 1.2) * 0.5; lock.position.y = 1.9 + Math.sin(t * 1.5) * 0.1;
      s1.position.y = 4.6 + Math.sin(t * 1.1) * 0.12; s2.position.y = 3.0 + Math.sin(t * 1.3 + 1) * 0.12; s3.position.y = 2.4 + Math.sin(t * 1.2 + 2) * 0.1;
    });
    add(2, tree(0x34d399, 1.8), 7.4, 0, -0.5);
  }

  /* ===== 7 · Contact portal ===== */
  let portalMat;
  {
    const sg = chapters[11].sg;
    portalMat = new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide,
      uniforms: { t: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform float t; varying vec2 vUv;
        void main(){ vec2 p = vUv - .5; float r = length(p)*2.; float a = atan(p.y,p.x);
          float s = sin(a*5. + r*14. - t*2.2)*.5+.5; float s2 = sin(a*3. - r*9. + t*1.6)*.5+.5;
          vec3 c = mix(vec3(.49,.23,.93), vec3(.37,.92,.83), s); c = mix(c, vec3(.96,.45,.71), s2*.55);
          float alpha = smoothstep(1., .82, r) * (.55 + .45*(1.-r)); gl_FragColor = vec4(c*(.7+.6*(1.-r)), alpha); }`,
    });
    const portal = new THREE.Group();
    const ringM = new THREE.MeshBasicMaterial({ color: 0xf9a8d4, toneMapped: false });
    portal.add(new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.14, 12, 64), ringM));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.1, 64), portalMat); disc.position.z = 0.0; portal.add(disc);
    const lab = label("Let's build something.", { size: 64, color: '#fff', glow: '#f472b6', scale: 0.0105 });
    lab.position.set(0, 3.5, 0); portal.add(lab);
    add(11, portal, sg * 3.6, 2.9, -2.4, -sg * -0.18);
    portal.userData.p = true;
    part(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 20), toon(0x3b2f86), { pos: [sg * 3.6, 0.2, -2.4], parent: chapters[11].g, outline: 0.03 });
    add(11, tree(0xf472b6, 2.0), -sg * 5.7, 0, -2.2);
    add(11, tree(0x5eead4, 1.6), -sg * 6.2, 0, 1.2);
    chapters[11].portal = portal;
    updaters.push((t) => { portalMat.uniforms.t.value = t; portal.rotation.z = t * 0.12; lab.position.y = 3.5 + Math.sin(t * 1.5) * 0.08; });
  }

  /* ===== 8 · BNY part 2: backup + Digital Engineer agent ===== */
  {
    const g = chapters[8].g;
    // S3 bucket stack with restore ring
    const bucket = new THREE.Group();
    [0, 1, 2].forEach((k) => part(new THREE.CylinderGeometry(0.75, 0.75, 0.4, 24), toon([0xf59e0b, 0xfbbf24, 0xf59e0b][k]), { pos: [0, 0.2 + k * 0.45, 0], parent: bucket }));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.06, 8, 48, Math.PI * 1.6), new THREE.MeshBasicMaterial({ color: 0x5eead4, toneMapped: false }));
    ring.position.y = 0.9; bucket.add(ring);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 10), new THREE.MeshBasicMaterial({ color: 0x5eead4, toneMapped: false }));
    cone.position.set(1.3, 0.9, 0); ring.add(cone);
    const bl = label('S3 · point-in-time restore', { size: 40, color: '#fff', bg: 'rgba(20,10,50,.8)', scale: 0.0095 }); bl.position.set(0, 2.6, 0); bucket.add(bl);
    add(8, bucket, 5.2, 0, -1.2);
    // agent robot
    const bot = new THREE.Group();
    part(new THREE.CapsuleGeometry(0.45, 0.6, 8, 18), toon(0xe9e4ff), { pos: [0, 1.0, 0], parent: bot, outline: 0.04 });
    part(new THREE.SphereGeometry(0.5, 24, 18), toon(0xf4f0ff), { pos: [0, 2.0, 0], scl: [1.1, 0.9, 0.95], parent: bot, outline: 0.04 });
    part(new THREE.BoxGeometry(0.7, 0.26, 0.1), toon(0x1c1440), { pos: [0, 2.02, 0.47], parent: bot, outline: 0 });
    [-0.16, 0.16].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0x5eead4, toneMapped: false })); e.position.set(x, 2.02, 0.53); bot.add(e); });
    part(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), toon(0xcfc6ff), { pos: [0, 2.65, 0], parent: bot, outline: 0 });
    { const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf472b6, toneMapped: false })); tip.position.set(0, 2.86, 0); bot.add(tip); }
    const mr = label('merge request ✓', { size: 38, color: '#0b0620', bg: '#5eead4', scale: 0.0095 }); mr.position.set(0, 3.6, 0); bot.add(mr);
    add(8, bot, 2.4, 0.1, -2.2, -0.2);
    add(8, tree(0x5eead4, 2.0), 8.2, 0, 0.5);
    add(8, lamp(0xf472b6), -2.6, 0, -2.4);
    updaters.push((t) => { ring.rotation.z = t * 0.9; bot.position.y = 0.1 + Math.sin(t * 1.6) * 0.1; mr.position.y = 3.6 + Math.sin(t * 2) * 0.06; });
  }

  /* ===== 12 · Delta Force, 13 · Virtuera, 14 · Side builds ===== */
  {
    const stand = (k, scr, x, y, z, base = y) => {
      scr.position.set(x, y, z); scr.userData.base = base; scr.rotation.y = -0.18; chapters[k].g.add(scr);
      part(new THREE.CylinderGeometry(0.07, 0.07, y - 1.0, 8), toon(0x2a2050), { pos: [x, (y - 1.0) / 2, z - 0.2], parent: chapters[k].g, outline: 0 });
      part(new THREE.CylinderGeometry(0.9, 1.0, 0.16, 24), toon(0x3b2f86), { pos: [x, 0.06, z - 0.1], parent: chapters[k].g, outline: 0.03 });
      return scr;
    };
    const floaters = [];
    // Delta Force
    const d = stand(12, infoScreen('Delta Force', 'NIT Trichy programming club', '#a78bfa', ['Software Developer', 'Apr 2021 – Apr 2023', 'Campus + fest web apps']), 3.4, 3.6, -2.6);
    floaters.push(d);
    const tri = label('Δ', { size: 190, color: '#fff', glow: '#a78bfa', weight: 800, scale: 0.0125 });
    tri.position.set(3.4, 6.1, -2.6); chapters[12].g.add(tri); floaters.push(tri); tri.userData.base = 6.1;
    add(12, tree(0xf472b6, 2.0), 6.8, 0, -0.6);
    add(12, lamp(0x5eead4), -2.6, 0, -2.4);
    // Virtuera
    const v = stand(13, infoScreen('Virtuera', 'The Virtual Placement Cell', '#34d399', ['Back-end Web Developer Intern', 'Jan – Apr 2021 · Remote', 'MongoDB · Node · Express']), 3.4, 3.6, -2.6);
    floaters.push(v);
    const db = new THREE.Group();
    [0, 1, 2].forEach((k) => part(new THREE.CylinderGeometry(0.7, 0.7, 0.36, 22), toon(k % 2 ? 0x34d399 : 0x22d3ee), { pos: [0, 0.18 + k * 0.4, 0], parent: db }));
    add(13, db, 6.4, 0, -0.8);
    add(13, tree(0x5eead4, 1.9), 7.6, 0, 1.4);
    add(13, lamp(0xfde68a), -2.6, 0, -2.4);
    // Side builds
    const e1 = stand(14, infoScreen('Collab editor', 'React · Redux · Socket.io', '#22d3ee', ['Markdown docs', 'Live collaborative editing', 'Search filters'], 3.2), 2.8, 4.4, -3.4);
    const e2 = stand(14, infoScreen('File manager', 'Node · Express · MongoDB', '#f472b6', ['Upload & download', 'Share, move, search', 'Per-user accounts'], 3.0), 6.2, 3.0, -1.4, 3.0);
    e1.userData.base = 4.4; floaters.push(e1, e2);
    add(14, tree(0x34d399, 1.8), 8.0, 0, 1.2);
    updaters.push((t) => floaters.forEach((f, i) => { f.position.y = f.userData.base + Math.sin(t * 1.1 + i * 1.7) * 0.1; }));
  }

  /* island pebble bob + inkyora redraw */
  let inkT = 0, inkAcc = 0;
  return {
    chapters,
    update(t, dt, sCur) {
      updaters.forEach((u) => u(t, dt));
      chapters.forEach((c) => c.isl.userData.pebbles.forEach((p) => { p.position.y += Math.sin(t * 0.8 + p.userData.f) * 0.003; p.rotation.y += dt * 0.2; }));
      // redraw Inkyora screen only when near
      if (Math.abs(sCur - (opts.inkSlot ?? 10)) < 1.2) {
        inkAcc += dt; inkT += dt;
        if (inkAcc > 1 / 12) { inkAcc = 0; inkyora.redraw(inkT); }
      }
    },
  };
}
