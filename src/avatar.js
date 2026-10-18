import * as THREE from 'three';

/* ---------- shared toon material (used by the world props) ---------- */
const ramp = (() => {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 1;
  const g = c.getContext('2d');
  ['#6b6585', '#a39db8', '#dcd7ea', '#ffffff'].forEach((col, i) => { g.fillStyle = col; g.fillRect(i, 0, 1, 1); });
  const t = new THREE.CanvasTexture(c);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
})();
export const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra });
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x150b2b, side: THREE.BackSide });

export function part(geo, mat, o = {}) {
  const { pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1], outline = 0.05, parent } = o;
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...scl);
  if (outline) {
    const ol = new THREE.Mesh(geo, outlineMat);
    ol.scale.setScalar(1 + outline);
    ol.userData.outline = true;
    m.add(ol);
  }
  m.castShadow = true;
  if (parent) parent.add(m);
  return m;
}

/* ---------- soft "animated-film" materials for the avatar ---------- */
const unitSphere = new THREE.SphereGeometry(1, 48, 32);
const soft = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.62, metalness: 0, ...o });
const skinMat = (color) => soft(color, { roughness: 0.55, sheen: 0.8, sheenColor: new THREE.Color(0xffc3b8), sheenRoughness: 0.5, clearcoat: 0.08, clearcoatRoughness: 0.5 });

function E(mat, pos, scl, parent, rot = [0, 0, 0]) {
  const m = new THREE.Mesh(unitSphere, mat);
  m.position.set(...pos); m.scale.set(...scl); m.rotation.set(...rot);
  m.castShadow = true;
  parent.add(m);
  return m;
}
function C(geo, mat, pos, parent, rot = [0, 0, 0], scl = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...scl);
  m.castShadow = true;
  parent.add(m);
  return m;
}

/* tapered tube along a Catmull-Rom path (hair strands, brows, lashes) */
function strand(points, r0, r1, mat, { segs = 40, radial = 10, ease = 0.8, wide = 1, side = null } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5);
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [], nor = [], idx = [];
  const sideV = side ? new THREE.Vector3(...side) : null;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPoint(t);
    const r = r0 + (r1 - r0) * Math.pow(t, ease);
    let N = frames.normals[i], B = frames.binormals[i];
    if (sideV) {
      const T = curve.getTangent(t);
      let w = sideV.clone().sub(T.clone().multiplyScalar(sideV.dot(T)));
      if (w.length() < 0.25) w = new THREE.Vector3(0, 1, 0).sub(T.clone().multiplyScalar(T.y));
      w.normalize();
      N = w; B = new THREE.Vector3().crossVectors(T, w).normalize();
    }
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const n = N.clone().multiplyScalar(Math.cos(a)).add(B.clone().multiplyScalar(Math.sin(a)));
      const wv = sideV ? Math.pow(Math.max(0.0001, Math.cos(a) ** 2 * wide * wide + Math.sin(a) ** 2), 0.5) : 1;
      const k = sideV ? (Math.abs(Math.cos(a)) * (wide - 1) + 1) : 1;
      pos.push(p.x + N.x * Math.cos(a) * r * (sideV ? wide : 1) + B.x * Math.sin(a) * r, p.y + N.y * Math.cos(a) * r * (sideV ? wide : 1) + B.y * Math.sin(a) * r, p.z + N.z * Math.cos(a) * r * (sideV ? wide : 1) + B.z * Math.sin(a) * r);
      // ellipse normal ~ (cos/wide, sin)
      const nn = N.clone().multiplyScalar(Math.cos(a) / (sideV ? wide : 1)).add(B.clone().multiplyScalar(Math.sin(a))).normalize();
      nor.push(nn.x, nn.y, nn.z);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  return m;
}

/* iris + highlight texture */
function irisTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const R = 118;
  const rg = g.createRadialGradient(128, 128, 10, 128, 128, R);
  rg.addColorStop(0, '#1b0f0a'); rg.addColorStop(0.28, '#2a170e'); rg.addColorStop(0.34, '#8a5530'); rg.addColorStop(0.7, '#5b3320'); rg.addColorStop(0.93, '#2f180f'); rg.addColorStop(1, '#170b07');
  g.fillStyle = rg; g.beginPath(); g.arc(128, 128, R, 0, 7); g.fill();
  g.globalAlpha = 0.18; g.strokeStyle = '#e3a76f'; g.lineWidth = 3;
  for (let i = 0; i < 28; i++) { const a = (i / 28) * 6.283; g.beginPath(); g.moveTo(128 + Math.cos(a) * 44, 128 + Math.sin(a) * 44); g.lineTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); g.stroke(); }
  g.globalAlpha = 1;
  const h1 = g.createRadialGradient(92, 86, 2, 92, 86, 30); h1.addColorStop(0, '#fff'); h1.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = h1; g.beginPath(); g.arc(92, 86, 30, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(92, 86, 17, 0, 7); g.fill();
  g.globalAlpha = 0.85; g.beginPath(); g.arc(166, 172, 9, 0, 7); g.fill(); g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function blushTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,105,120,.55)'); rg.addColorStop(1, 'rgba(255,105,120,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createAvatar() {
  const root = new THREE.Group();
  const rig = {};

  const skin = skinMat(0xfbe0c9);
  const skinDeep = skinMat(0xefc8a8);
  const lipM = soft(0xd4707e, { roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const jacketM = soft(0x7c3aed, { roughness: 0.55, sheen: 0.7, sheenColor: new THREE.Color(0xc4b5fd), sheenRoughness: 0.5 });
  const jacketDark = soft(0x5b21b6, { roughness: 0.6 });
  const mintM = soft(0x5eead4, { roughness: 0.4, emissive: 0x1a6b5f, emissiveIntensity: 0.55 });
  const pantsM = soft(0x17142a, { roughness: 0.7, sheen: 0.4, sheenColor: new THREE.Color(0x4a3f8a) });
  const whiteM = soft(0xf4f0ff, { roughness: 0.5 });
  const soleM = soft(0xf472b6, { roughness: 0.5 });
  function strandTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) { const x = Math.random() * 256, w = 0.6 + Math.random() * 1.8, v = 90 + Math.random() * 110 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, w, 256); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
const hairBump = strandTexture();
const hairM = soft(0x1b1322, { roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.4, sheen: 0.9, sheenColor: new THREE.Color(0x7c6be0), sheenRoughness: 0.35, bumpMap: hairBump, bumpScale: 1.6 });
  const browM = soft(0x2a1a1c, { roughness: 0.5 });
  const lashM = new THREE.MeshBasicMaterial({ color: 0x140a0e });

  /* ---- hips + legs ---- */
  const hips = new THREE.Group();
  hips.position.y = 1.12;
  root.add(hips);
  rig.hips = hips;

  const mkLeg = (sx) => {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.15, 0, 0);
    hips.add(leg);
    C(new THREE.CapsuleGeometry(0.135, 0.68, 8, 20), pantsM, [0, -0.5, 0], leg);
    C(new THREE.BoxGeometry(0.026, 0.6, 0.2), mintM, [sx * 0.133, -0.48, 0], leg);
    C(new THREE.TorusGeometry(0.14, 0.035, 8, 22), mintM, [0, -0.88, 0], leg, [Math.PI / 2, 0, 0]);
    const shoe = new THREE.Group();
    shoe.position.set(0, -1.01, 0.06);
    leg.add(shoe);
    E(whiteM, [0, 0.02, 0.03], [0.165, 0.105, 0.265], shoe);
    E(soleM, [0, -0.07, 0.03], [0.175, 0.04, 0.28], shoe);
    E(mintM, [0, 0.03, 0.15], [0.09, 0.05, 0.1], shoe);
    return leg;
  };
  rig.legL = mkLeg(1);
  rig.legR = mkLeg(-1);

  /* ---- torso ---- */
  const torso = new THREE.Group();
  torso.position.y = 0.42;
  hips.add(torso);
  rig.torso = torso;
  C(new THREE.CapsuleGeometry(0.235, 0.34, 10, 24), jacketM, [0, 0.06, 0], torso, [0, 0, 0], [1.3, 1, 0.9]);
  C(new THREE.CylinderGeometry(0.27, 0.285, 0.09, 28), whiteM, [0, -0.3, 0], torso, [0, 0, 0], [1.28, 1, 0.9]);
  C(new THREE.TorusGeometry(0.265, 0.03, 8, 32), mintM, [0, -0.2, 0], torso, [Math.PI / 2, 0, 0], [1.3, 0.9, 1]);
  C(new THREE.TorusGeometry(0.15, 0.05, 10, 28), jacketDark, [0, 0.47, 0.0], torso, [Math.PI / 2, 0, 0], [1.1, 0.95, 1]);
  C(new THREE.BoxGeometry(0.024, 0.55, 0.016), mintM, [0, 0.07, 0.212], torso);
  C(new THREE.BoxGeometry(0.16, 0.028, 0.016), mintM, [0.15, 0.2, 0.2], torso, [0, 0.35, 0]);
  C(new THREE.BoxGeometry(0.11, 0.028, 0.016), mintM, [0.13, 0.14, 0.205], torso, [0, 0.35, 0]);
  rig.star = C(new THREE.OctahedronGeometry(0.045), new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 1.2 }), [-0.14, 0.2, 0.215], torso);

  /* ---- neck + headphones around neck ---- */
  C(new THREE.CylinderGeometry(0.085, 0.1, 0.34, 20), skinDeep, [0, 0.62, 0.0], torso);
  const hp = new THREE.Group(); torso.add(hp);
  C(new THREE.TorusGeometry(0.205, 0.032, 10, 36), soft(0x1c1530), [0, 0.5, 0.01], hp, [Math.PI / 2 - 0.25, 0, 0]);
  [-1, 1].forEach((sx) => {
    C(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 22), soft(0x1c1530), [sx * 0.17, 0.33, 0.2], hp, [Math.PI / 2 - 0.2, 0, sx * 0.25]);
    C(new THREE.CylinderGeometry(0.048, 0.048, 0.07, 22), mintM, [sx * 0.17, 0.33, 0.21], hp, [Math.PI / 2 - 0.2, 0, sx * 0.25]);
  });

  /* ---- arms (shoulder -> elbow -> wrist) ---- */
  const mkArm = (sx) => {
    const sh = new THREE.Group();
    sh.position.set(sx * 0.38, 0.4, 0);
    torso.add(sh);
    E(jacketM, [0, 0, 0], [0.13, 0.13, 0.13], sh);
    C(new THREE.CapsuleGeometry(0.095, 0.3, 8, 16), jacketM, [0, -0.22, 0], sh);
    const el = new THREE.Group(); el.position.set(0, -0.42, 0); sh.add(el);
    C(new THREE.CapsuleGeometry(0.1, 0.26, 8, 16), jacketM, [0, -0.18, 0], el);
    C(new THREE.TorusGeometry(0.1, 0.034, 8, 22), mintM, [0, -0.38, 0], el, [Math.PI / 2, 0, 0]);
    const hand = new THREE.Group(); hand.position.set(0, -0.47, 0); el.add(hand);
    E(skin, [0, -0.04, 0], [0.075, 0.095, 0.05], hand);
    E(skin, [sx * 0.07, -0.0, 0.015], [0.03, 0.05, 0.03], hand, [0, 0, -sx * 0.5]);
    sh.rotation.z = -sx * 0.07;
    return { sh, el };
  };
  const aL = mkArm(1), aR = mkArm(-1);
  rig.armL = aL.sh; rig.elL = aL.el; rig.armR = aR.sh; rig.elR = aR.el;

  /* ---- head ---- */
  const head = new THREE.Group();
  head.position.set(0, 1.28, 0.0);
  hips.add(head);
  rig.head = head;
  head.scale.setScalar(1.1);
  const R = 0.37;
  const HX = 0.92, HY = 1.03, HZ = 0.94;
  E(skin, [0, 0, 0], [R * HX, R * HY, R * HZ], head);
  E(skin, [0, -0.25, 0.04], [0.2, 0.19, 0.19], head);       // chin / jaw
  [-1, 1].forEach((sx) => E(skinDeep, [sx * 0.335, -0.02, -0.02], [0.05, 0.075, 0.035], head, [0, 0, sx * 0.2])); // ears
  const fz = (x, y) => HZ * Math.sqrt(Math.max(0.0001, R * R - (x / HX) ** 2 - (y / HY) ** 2));

  const face = new THREE.Group(); head.add(face);
  const irisTex = irisTexture();
  const blushTex = blushTexture();
  const eyes = new THREE.Group(); face.add(eyes);
  rig.eyes = eyes;
  [-1, 1].forEach((sx) => {
    const ex = sx * 0.138, ey = 0.0;
    const eg = new THREE.Group();
    eg.position.set(ex, ey, fz(ex, ey) - 0.004);
    eg.rotation.y = sx * 0.42;
    eyes.add(eg);
    E(soft(0xf8f1ee, { roughness: 0.25, clearcoat: 0.6 }), [0, 0, 0], [0.066, 0.078, 0.03], eg);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.056, 40), new THREE.MeshBasicMaterial({ map: irisTex, transparent: true }));
    iris.scale.set(1, 1.08, 1);
    iris.position.set(-sx * 0.004, -0.004, 0.0295);
    eg.add(iris);
    const lash = strand([[-sx * 0.066, 0.004, 0.02], [-sx * 0.042, 0.052, 0.027], [-sx * 0.004, 0.08, 0.03], [sx * 0.04, 0.07, 0.027], [sx * 0.07, 0.035, 0.02], [sx * 0.098, 0.044, 0.01]], 0.0065, 0.0022, lashM, { segs: 20, radial: 6 });
    eg.add(lash);
    const lower = strand([[-sx * 0.05, -0.062, 0.025], [0, -0.082, 0.03], [sx * 0.05, -0.06, 0.024]], 0.0028, 0.0018, new THREE.MeshBasicMaterial({ color: 0x4a2a2c, transparent: true, opacity: 0.55 }), { segs: 10, radial: 5 });
    eg.add(lower);
    // brow (face space)
    const bx = ex, by = 0.145;
    const brow = strand([[bx - sx * 0.07, by - 0.012, fz(bx - sx * 0.07, by) + 0.003], [bx - sx * 0.02, by + 0.02, fz(bx - sx * 0.02, by + 0.02) + 0.004], [bx + sx * 0.04, by + 0.018, fz(bx + sx * 0.04, by + 0.018) + 0.003], [bx + sx * 0.085, by - 0.018, fz(bx + sx * 0.085, by - 0.018) + 0.002]], 0.0105, 0.005, browM, { segs: 18, radial: 6 });
    face.add(brow);
    const blush = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshBasicMaterial({ map: blushTex, transparent: true, depthWrite: false }));
    const kx = sx * 0.2, ky = -0.1;
    blush.position.set(kx, ky, fz(kx, ky) + 0.004);
    blush.rotation.y = sx * 0.62;
    face.add(blush);
  });
  // nose
  E(skin, [0, -0.078, fz(0, -0.078) + 0.018], [0.036, 0.03, 0.032], face);
  [-1, 1].forEach((sx) => E(skinDeep, [sx * 0.02, -0.098, fz(0, -0.098) + 0.006], [0.012, 0.008, 0.01], face));
  // mouth: open smile with teeth
  const my = -0.185;
  E(soft(0x5a1d2b, { roughness: 0.5 }), [0, my - 0.012, fz(0, my - 0.012) + 0.002], [0.05, 0.022, 0.018], face, [0, 0, 0]);
  E(soft(0xfaf6f2, { roughness: 0.3 }), [0, my + 0.001, fz(0, my) + 0.008], [0.04, 0.009, 0.01], face);
  const sm = strand([[-0.088, my + 0.03, fz(-0.088, my + 0.03) + 0.004], [-0.05, my + 0.002, fz(-0.05, my) + 0.008], [0, my - 0.006, fz(0, my) + 0.01], [0.05, my + 0.002, fz(0.05, my) + 0.008], [0.09, my + 0.032, fz(0.09, my + 0.032) + 0.004]], 0.0055, 0.0035, lipM, { segs: 18, radial: 6 });
  face.add(sm);
  E(lipM, [0, my - 0.04, fz(0, my - 0.04) + 0.004], [0.05, 0.014, 0.016], face);

  /* ---- hair: smooth swept locks (flat, glossy, overlapping) ---- */
  const hairBack = new THREE.Group();
  hairBack.position.set(0, 0, 0);
  head.add(hairBack);
  rig.hairBack = hairBack;
  rig.locks = [];
  const hairMD = hairM.clone(); hairMD.side = THREE.DoubleSide;
  function lockMesh(pts, w0, w1, th, { segs = 56, radial = 14, ease = 0.9, tip = 0.35 } = {}) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5);
    const pos = [], nor = [], idx = [], uvs = [];
    const Z = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, p = curve.getPoint(t), T = curve.getTangent(t).normalize();
      let W = new THREE.Vector3().crossVectors(T, Z);
      if (W.length() < 0.2) W = new THREE.Vector3(1, 0, 0);
      W.normalize();
      const N = new THREE.Vector3().crossVectors(W, T).normalize();
      const taper = t > 1 - tip ? Math.pow(Math.max(0.02, (1 - t) / tip), 0.7) : 1;
      const w = (w0 + (w1 - w0) * Math.pow(t, ease)) * taper, h = th * (0.6 + 0.4 * taper);
      for (let j = 0; j <= radial; j++) {
        const a = (j / radial) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        pos.push(p.x + W.x * c * w + N.x * s * h, p.y + W.y * c * w + N.y * s * h, p.z + W.z * c * w + N.z * s * h);
        const nn = W.clone().multiplyScalar(c / Math.max(w, 1e-4)).add(N.clone().multiplyScalar(s / h)).normalize();
        nor.push(nn.x, nn.y, nn.z);
        uvs.push((j / radial) * 3, t * 2.2);
      }
    }
    for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, hairMD); m.castShadow = true;
    return m;
  }

  // scalp cap + volume
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 30, 0, Math.PI * 2, 0, Math.PI * 0.375), hairMD);
  cap.scale.set(0.4 * HX * 1.04, 0.4 * HY * 1.03, 0.4 * HZ * 1.07);
  cap.position.set(0, 0.0, -0.025);
  cap.rotation.x = -0.2;
  cap.castShadow = true;
  head.add(cap);
  E(hairMD, [0, -0.2, -0.13], [0.38, 0.6, 0.27], hairBack);
  // side volume behind ears
  [-1, 1].forEach((sx) => E(hairMD, [sx * 0.3, -0.05, -0.04], [0.1, 0.28, 0.22], head));

  // back locks: long, wavy, layered (two rows for depth)
  {
    const NB = 15;
    for (let i = 0; i < NB; i++) {
      const row = i % 2;
      const x = -0.33 + (0.66 * i) / (NB - 1);
      const ph = i * 1.37, L = 1.0 + ((i * 7) % 5) * 0.08, pts = [];
      for (let k = 0; k <= 12; k++) {
        const u = k / 12;
        pts.push([x * (1 + u * 0.28) + Math.sin(u * 8 + ph) * 0.06 * u + (x > 0 ? 1 : -1) * 0.04 * u * u, 0.22 - u * (L + 0.2), -0.19 - row * 0.05 - 0.05 * Math.abs(x) - 0.03 * u + Math.cos(u * 6 + ph) * 0.04 * u]);
      }
      hairBack.add(lockMesh(pts, 0.08 + row * 0.01, 0.06, 0.055, { tip: 0.3 }));
    }
  }
  // front side-swept locks that frame the face and fall over the shoulders in soft waves
  [-1, 1].forEach((sx) => {
    const lock = new THREE.Group();
    head.add(lock);
    for (let i = 0; i < 4; i++) {
      const o = i * 0.026, d = i * 0.011, wv = i * 0.9;
      const pts = [
        [-sx * 0.012, 0.362 - d, 0.258],
        [sx * (0.13 + o), 0.335 - d, 0.248 - d],
        [sx * (0.25 + o), 0.265 - d, 0.2],
        [sx * (0.33 + o * 0.6), 0.15, 0.14],
        [sx * (0.375 + o * 0.5), -0.04, 0.1],
        [sx * (0.39 + o * 0.5), -0.22, 0.17 + i * 0.012],
        [sx * (0.34 + o * 0.4) - sx * 0.03 * Math.sin(wv), -0.48, 0.26 + i * 0.01],
        [sx * (0.37 + o * 0.3) + sx * 0.04 * Math.sin(wv + 1.2), -0.74, 0.3],
        [sx * (0.3 + o * 0.3) - sx * 0.05 * Math.sin(wv + 2.4), -1.0, 0.3],
        [sx * (0.36 + o * 0.3) + sx * 0.06 * Math.sin(wv + 3.6), -1.24, 0.285],
      ];
      lock.add(lockMesh(pts, 0.068 - i * 0.006, 0.055, 0.038, { tip: 0.32 }));
    }
    rig.locks.push(lock);
  });
  // glossy highlights
  const hl = soft(0x7f6ee0, { roughness: 0.3, transparent: true, opacity: 0.3 });
  head.add(strand([[-0.13, 0.37, 0.15], [-0.08, 0.41, 0.03], [-0.08, 0.39, -0.14]], 0.012, 0.006, hl, { segs: 14, radial: 5 }));
  head.add(strand([[0.14, 0.36, 0.15], [0.14, 0.4, 0.03], [0.14, 0.38, -0.14]], 0.012, 0.006, hl, { segs: 14, radial: 5 }));

  // satin bow clip
  const bow = new THREE.Group();
  bow.position.set(-0.19, 0.31, 0.2);
  bow.rotation.set(0.35, 0.5, 0.55);
  head.add(bow);
  const satin = soft(0x8b5cf6, { roughness: 0.3, sheen: 1, sheenColor: new THREE.Color(0xe9d5ff), clearcoat: 0.5 });
  [-1, 1].forEach((s) => {
    E(satin, [s * 0.1, 0, 0], [0.105, 0.075, 0.035], bow, [0, 0, s * 0.18]);
    E(jacketDark, [s * 0.095, 0, 0.012], [0.06, 0.04, 0.012], bow, [0, 0, s * 0.18]);
  });
  E(satin, [0, 0, 0.012], [0.04, 0.045, 0.04], bow);
  [-1, 1].forEach((s) => E(satin, [s * 0.04, -0.07, -0.005], [0.022, 0.075, 0.012], bow, [0, 0, s * 0.35]));

  /* ---- animation ---- */
  const state = { phase: 0, blink: 0, nextBlink: 2, t: 0 };
  const hipsBase = hips.position.y;

  function update(dt, o) {
    const { walk = 0, wave = 0, lookX = 0, lookY = 0, speed = 1, calm = false } = o;
    state.t += dt;
    const t = state.t;
    state.phase += dt * (6 + speed * 4) * (walk > 0.05 ? 1 : 0);
    const k = calm ? 0.4 : 1;
    const s = Math.sin(state.phase);
    rig.legL.rotation.x = s * 0.7 * walk * k;
    rig.legR.rotation.x = -s * 0.7 * walk * k;
    rig.armR.rotation.x = s * 0.6 * walk * k;
    rig.armR.rotation.z = 0.08 + Math.sin(t * 1.6) * 0.015;
    rig.elR.rotation.x = -0.12 - Math.max(0, -s) * 0.3 * walk;
    const w = wave;
    rig.armL.rotation.x = (-s * 0.6 * walk * k) * (1 - w);
    rig.armL.rotation.z = THREE.MathUtils.lerp(-0.07 + Math.sin(t * 1.7 + 1) * 0.015, 2.55, w);
    rig.elL.rotation.z = THREE.MathUtils.lerp(0, -0.35 + Math.sin(t * 9) * 0.55, w);
    rig.elL.rotation.x = THREE.MathUtils.lerp(-0.12 - Math.max(0, s) * 0.3 * walk, 0, w);
    hips.position.y = hipsBase + Math.abs(s) * 0.06 * walk * k + Math.sin(t * 2.2) * 0.008 * (1 - walk);
    torso.rotation.y = s * 0.1 * walk * k;
    torso.scale.y = 1 + Math.sin(t * 2.2) * 0.01;
    head.rotation.y += (lookX * 0.5 - head.rotation.y) * Math.min(1, dt * 6);
    head.rotation.x += (-lookY * 0.25 - head.rotation.x) * Math.min(1, dt * 6);
    head.rotation.z = Math.sin(t * 1.1) * 0.02 + w * 0.07;
    hairBack.rotation.x = -0.04 - walk * 0.14 * k + Math.sin(t * 1.4) * 0.02 + Math.abs(s) * 0.025 * walk;
    rig.locks.forEach((l, i) => { l.rotation.z = (i ? 1 : -1) * (0.015 + walk * 0.08 * Math.sin(state.phase + i)) + Math.sin(t * 1.3 + i) * 0.012; l.rotation.x = -walk * 0.07; });
    state.nextBlink -= dt;
    if (state.nextBlink <= 0) { state.blink = 0.14; state.nextBlink = 1.8 + Math.random() * 3; }
    if (state.blink > 0) state.blink -= dt;
    const b = state.blink > 0 ? 0.08 : 1;
    eyes.scale.y += (b - eyes.scale.y) * Math.min(1, dt * 30);
    rig.star.rotation.y = t * 2;
    rig.star.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
  }

  return { root, rig, update, head };
}
