// Motore delle animazioni di ferro-esercizi: manichino neutro, cinematica inversa
// a due ossa, aiuti per costruire macchine generiche con forme semplici.
// Codice MIT (vedi LICENSE-CODE). Nessun modello o immagine esterni.
import * as THREE from 'three';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const deg = (d) => (d * Math.PI) / 180;

/** Colori in linea con il tema Grafite di Ferro. */
export const PALETTE = {
  background: 0x2a2e33,
  floor: 0x3a3f45,
  body: 0xd8cdbd,
  active: 0xf0c33c,
  frame: 0x6a7079,
  frameDark: 0x4a4f56,
  pad: 0x2e3238,
  plate: 0x24272b,
  steel: 0x9aa0a6,
  marker: 0xf0c33c,
};

/** Fasi della ripetizione: [{ dur, from, to, active }] → valore 0..1 e intensità del muscolo. */
export function timeline(phases) {
  const total = phases.reduce((s, p) => s + p.dur, 0);
  return {
    total,
    at(t) {
      let x = ((t % total) + total) % total;
      for (const p of phases) {
        if (x <= p.dur) {
          const k = p.dur ? ease(x / p.dur) : 1;
          return { v: lerp(p.from, p.to, k), active: p.active ?? 0, phase: p.name };
        }
        x -= p.dur;
      }
      const last = phases[phases.length - 1];
      return { v: last.to, active: last.active ?? 0, phase: last.name };
    },
  };
}

/** Ginocchio o gomito: A radice, C estremità, l1 e l2 lunghezze, pole direzione verso cui piegare. */
export function ik(A, C, l1, l2, pole) {
  const AC = C.clone().sub(A);
  let d = AC.length();
  const dir = AC.clone().normalize();
  d = clamp(d, Math.abs(l1 - l2) + 1e-4, (l1 + l2) * 0.9995);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  return A.clone().add(dir.multiplyScalar(a)).add(perp.multiplyScalar(h));
}

/** Misure del manichino (metri, persona di circa 1,75 m). */
export const BODY = {
  thigh: 0.44, shin: 0.43, upperArm: 0.3, forearm: 0.27,
  hipHalf: 0.095, shoulderHalf: 0.19, torso: 0.5,
};

const UP = V(0, 1, 0);
const tmpQ = new THREE.Quaternion();

function material(color, rough = 0.65, metal = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

/**
 * Manichino: segmenti tronco-conici tra le articolazioni, sfere alle giunture.
 * update(j, act) riceve le posizioni delle articolazioni e l'intensità dei gruppi muscolari.
 */
export function mannequin() {
  const group = new THREE.Group();
  const mats = {};
  const matFor = (area) => {
    if (!mats[area]) mats[area] = material(PALETTE.body, 0.55);
    return mats[area];
  };
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true);
  const sph = new THREE.SphereGeometry(1, 24, 16);

  const limbs = [];
  const limb = (a, b, ra, rb, area) => {
    const geo = new THREE.CylinderGeometry(rb, ra, 1, 20, 1, true);
    const m = new THREE.Mesh(geo, matFor(area));
    const ja = new THREE.Mesh(sph, matFor(area));
    ja.scale.setScalar(ra);
    const jb = new THREE.Mesh(sph, matFor(area));
    jb.scale.setScalar(rb);
    for (const o of [m, ja, jb]) { o.castShadow = true; group.add(o); }
    limbs.push({ a, b, m, ja, jb });
  };
  for (const s of ['L', 'R']) {
    limb('hip' + s, 'knee' + s, 0.075, 0.052, 'thigh');
    limb('knee' + s, 'ankle' + s, 0.05, 0.036, 'shin');
    limb('heel' + s, 'toe' + s, 0.036, 0.03, 'foot');
    limb('shoulder' + s, 'elbow' + s, 0.048, 0.038, 'upperArm');
    limb('elbow' + s, 'wrist' + s, 0.036, 0.028, 'forearm');
    limb('wrist' + s, 'hand' + s, 0.03, 0.034, 'hand');
  }
  limb('neck', 'neckTop', 0.045, 0.042, 'neck');

  const blobs = [];
  const blob = (area, at, size) => {
    const m = new THREE.Mesh(sph, matFor(area));
    m.castShadow = true;
    group.add(m);
    blobs.push({ m, at, size });
  };
  blob('glutes', 0.02, [0.12, 0.13, 0.18]);
  blob('core', 0.38, [0.115, 0.21, 0.16]);
  blob('back', 0.74, [0.125, 0.2, 0.2]);
  const head = new THREE.Mesh(sph, matFor('head'));
  head.castShadow = true;
  group.add(head);
  void cyl;

  function place(m, a, b) {
    const d = b.clone().sub(a);
    const len = d.length();
    m.position.copy(a).addScaledVector(d, 0.5);
    tmpQ.setFromUnitVectors(UP, d.normalize());
    m.quaternion.copy(tmpQ);
    m.scale.set(1, len, 1);
  }

  function update(j, act = {}) {
    for (const [area, mat] of Object.entries(mats)) {
      const k = clamp(act[area] ?? 0);
      mat.color.setHex(PALETTE.body).lerp(new THREE.Color(PALETTE.active), k * 0.85);
      mat.emissive.setHex(PALETTE.active).multiplyScalar(k * 0.12);
    }
    for (const l of limbs) {
      place(l.m, j[l.a], j[l.b]);
      l.ja.position.copy(j[l.a]);
      l.jb.position.copy(j[l.b]);
    }
    // Tronco orientato da bacino a petto, con il fronte nella direzione j.front.
    const up = j.chest.clone().sub(j.pelvis).normalize();
    const side = V(0, 0, 1);
    const front = up.clone().cross(side).normalize();
    const basis = new THREE.Matrix4().makeBasis(front, up, side);
    for (const b of blobs) {
      b.m.position.copy(j.pelvis).lerp(j.chest, b.at).addScaledVector(front, b.at > 0.5 ? -0.005 : 0);
      b.m.quaternion.setFromRotationMatrix(basis);
      b.m.scale.set(...b.size);
    }
    const hup = j.head.clone().sub(j.neck).normalize();
    const hfront = hup.clone().cross(side).normalize();
    head.position.copy(j.head);
    head.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(hfront, hup, side));
    head.scale.set(0.1, 0.12, 0.092);
  }

  return { group, update };
}

/** Articolazioni simmetriche del tronco: bacino, inclinazione del busto (gradi dalla verticale, + indietro). */
export function torso(pelvis, leanBack, opts = {}) {
  const a = deg(leanBack);
  const up = V(-Math.sin(a), Math.cos(a), 0);
  const front = V(Math.cos(a), Math.sin(a), 0);
  const chest = pelvis.clone().addScaledVector(up, BODY.torso);
  const neck = chest.clone().addScaledVector(up, 0.03);
  const chin = deg(opts.headTilt ?? 0);
  const hdir = up.clone().applyAxisAngle(V(0, 0, 1), -chin);
  const neckTop = neck.clone().addScaledVector(hdir, 0.07);
  const head = neckTop.clone().addScaledVector(hdir, 0.1).addScaledVector(front, 0.015);
  const sh = pelvis.clone().addScaledVector(up, opts.shoulderAt ?? 0.45).addScaledVector(front, -0.01);
  const j = { pelvis, chest, neck, neckTop, head, up, front };
  for (const [s, z] of [['L', 1], ['R', -1]]) {
    j['hip' + s] = pelvis.clone().add(V(0, 0, z * BODY.hipHalf));
    j['shoulder' + s] = sh.clone().add(V(0, opts.shrug ?? 0, z * BODY.shoulderHalf));
  }
  return j;
}

/** Gamba completa con IK: caviglia, direzione del piede (punta), verso del ginocchio. */
export function leg(j, s, ankle, toeDir, pole, soleDir) {
  j['knee' + s] = ik(j['hip' + s], ankle, BODY.thigh, BODY.shin, pole);
  j['ankle' + s] = ankle;
  const t = toeDir.clone().normalize();
  const down = soleDir ? soleDir.clone().normalize() : V(0, -1, 0);
  j['heel' + s] = ankle.clone().addScaledVector(t, -0.05).addScaledVector(down, 0.05);
  j['toe' + s] = ankle.clone().addScaledVector(t, 0.16).addScaledVector(down, 0.055);
}

/** Braccio con IK fino al polso; la mano prosegue verso grip. */
export function arm(j, s, wrist, grip, pole) {
  j['elbow' + s] = ik(j['shoulder' + s], wrist, BODY.upperArm, BODY.forearm, pole);
  j['wrist' + s] = wrist;
  const d = grip.clone().sub(wrist).normalize();
  j['hand' + s] = wrist.clone().addScaledVector(d, 0.07);
}

// ---------- forme per le macchine ----------

export function mesh(geo, color, opts = {}) {
  const m = new THREE.Mesh(geo, material(color, opts.rough ?? 0.6, opts.metal ?? 0.1));
  m.castShadow = opts.shadow !== false;
  m.receiveShadow = true;
  return m;
}

/** Parallelepipedo arrotondato orientato: centro, asse lungo (dir), normale (n), misure. */
export function pad(center, dir, n, [len, thick, width], color = PALETTE.pad) {
  const geo = new THREE.CapsuleGeometry(thick / 2, Math.max(0.001, len - thick), 6, 12);
  const m = mesh(geo, color, { rough: 0.8 });
  const d = dir.clone().normalize();
  const nn = n.clone().normalize();
  const side = nn.clone().cross(d).normalize();
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(nn, d, side));
  m.scale.set(1, 1, width / thick);
  m.position.copy(center);
  return m;
}

/** Tubo tra due punti. */
export function tube(a, b, r = 0.025, color = PALETTE.frame) {
  const d = b.clone().sub(a);
  const m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 16), color, { rough: 0.45, metal: 0.4 });
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  return m;
}

/** Aggiorna un tubo creato con tube() perché vada da a a b. */
export function setTube(m, a, b) {
  const d = b.clone().sub(a);
  const len = d.length();
  const h = m.geometry.parameters.height;
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  m.scale.set(1, len / h, 1);
}

export function box(center, [x, y, z], color = PALETTE.frame, rotZ = 0) {
  const m = mesh(new THREE.BoxGeometry(x, y, z), color, { rough: 0.5, metal: 0.25 });
  m.position.copy(center);
  m.rotation.z = rotZ;
  return m;
}

/** Disco (piastra o puleggia) con asse lungo axis. */
export function disc(center, axis, r, thick, color = PALETTE.plate) {
  const m = mesh(new THREE.CylinderGeometry(r, r, thick, 40), color, { rough: 0.5, metal: 0.3 });
  m.position.copy(center);
  m.quaternion.setFromUnitVectors(UP, axis.clone().normalize());
  return m;
}

/** Pacco pesi: piastre impilate; move(dy, n) solleva le prime n dall'alto. */
export function weightStack(base, count = 12, size = [0.26, 0.045, 0.16], gap = 0.008) {
  const g = new THREE.Group();
  const plates = [];
  for (let i = 0; i < count; i++) {
    const p = box(V(0, i * (size[1] + gap) + size[1] / 2, 0), size, i % 2 ? 0x1b1d20 : PALETTE.plate);
    g.add(p);
    plates.push({ p, y: p.position.y });
  }
  const top = count * (size[1] + gap);
  g.position.copy(base);
  return {
    group: g,
    top,
    move(dy, n = 5) {
      plates.forEach((pl, i) => { pl.p.position.y = pl.y + (i >= count - n ? dy : 0); });
    },
  };
}

// ---------- scena e resa ----------

export function stage(canvas, { width, height, camera: cam, target }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.background);
  scene.fog = new THREE.Fog(PALETTE.background, 6, 11);

  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 50);
  camera.position.copy(cam);
  camera.lookAt(target);

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x30343a, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2.5, 5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -3; key.shadow.camera.right = 3;
  key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
  key.shadow.radius = 4;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbcd4ff, 0.7);
  rim.position.set(-3, 2.5, -3);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4, 64),
    new THREE.MeshStandardMaterial({ color: PALETTE.floor, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  return {
    scene, camera, renderer,
    render: () => renderer.render(scene, camera),
    /** Coordinate in pixel di un punto 3D (per i numeri sul disegno della posizione). */
    project(p) {
      const v = p.clone().project(camera);
      return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
    },
  };
}
