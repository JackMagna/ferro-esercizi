// Pezzi comuni per le scene: attrezzi (bilanciere, manubri, panca, cavi), seduta da macchina,
// posizioni del corpo e una funzione per definire una scena in poche righe. Codice MIT.
import * as THREE from 'three';
import {
  V, PALETTE, BODY, timeline, mannequin, torso, leg, arm, pad, tube, setTube, box, disc, weightStack, deg, lerp,
} from './engine.js';

export { V, PALETTE, BODY, torso, leg, arm, pad, tube, setTube, box, disc, weightStack, deg, lerp };

/** Ripetizione standard: fermo, concentrica, fermo, eccentrica (secondi). */
export function rep({ start = 0.4, up = 1.0, hold = 0.4, down = 2.4, act = [0.25, 1, 0.9, 0.6] } = {}) {
  return [
    { name: 'partenza', dur: start, from: 0, to: 0, active: act[0] },
    { name: 'su', dur: up, from: 0, to: 1, active: act[1] },
    { name: 'tieni', dur: hold, from: 1, to: 1, active: act[2] },
    { name: 'giu', dur: down, from: 1, to: 0, active: act[3] },
  ];
}

/** Scena: az gradi dal fianco sinistro (+z) verso il davanti (+x), el gradi in alto, dist metri. */
export function scene({ id, phases, view: [az, el, dist], target, build }) {
  const tl = timeline(phases);
  const a = deg(az), e = deg(el);
  return {
    id,
    duration: tl.total,
    target,
    camera: target.clone().add(V(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(dist)),
    build(st) {
      const man = mannequin();
      st.scene.add(man.group);
      const g = new THREE.Group();
      st.scene.add(g);
      const add = (...o) => { g.add(...o); return o[0]; };
      const s = build({ add, man });
      return {
        update(t) { const x = tl.at(t); s.pose(x.v, x.active); return x; },
        markers() { s.pose(s.still ?? 0, 0.25); return s.markers ? s.markers() : []; },
      };
    },
  };
}

// ---------- attrezzi ----------

const Z = V(0, 0, 1);

/** Gruppo costruito lungo z, orientato lungo axis. */
export function orient(obj, axis) {
  obj.quaternion.setFromUnitVectors(Z, axis.clone().normalize());
  return obj;
}

export function barbell({ half = 1.0, plateR = 0.225, plates = 1, grip = 0.62, pad: foam = false } = {}) {
  const b = new THREE.Group();
  b.add(tube(V(0, 0, -half), V(0, 0, half), 0.014, PALETTE.steel));
  for (const s of [1, -1]) {
    b.add(tube(V(0, 0, s * (half - 0.42)), V(0, 0, s * half), 0.025, PALETTE.steel));
    b.add(disc(V(0, 0, s * (half - 0.43)), Z, 0.04, 0.03, PALETTE.steel));
    for (let i = 0; i < plates; i++) b.add(disc(V(0, 0, s * (half - 0.36 + i * 0.05)), Z, plateR - i * 0.04, 0.045));
  }
  if (foam) b.add(tube(V(0, 0, -0.22), V(0, 0, 0.22), 0.045, PALETTE.pad));
  void grip;
  return b;
}

export function dumbbell(r = 0.075) {
  const d = new THREE.Group();
  d.add(tube(V(0, 0, -0.09), V(0, 0, 0.09), 0.016, PALETTE.steel));
  for (const s of [1, -1]) d.add(disc(V(0, 0, s * 0.12), Z, r, 0.06));
  return d;
}

/** Panca orizzontale lungo x (da x0 a x1), piano a quota y. */
export function bench(add, x0, x1, y = 0.45, z = 0, width = 0.3) {
  add(pad(V((x0 + x1) / 2, y - 0.04, z), V(1, 0, 0), V(0, 1, 0), [x1 - x0, 0.08, width]));
  for (const x of [x0 + 0.1, x1 - 0.1]) add(tube(V(x, 0.03, z), V(x, y - 0.08, z), 0.03));
  add(box(V((x0 + x1) / 2, 0.03, z), [x1 - x0 - 0.1, 0.05, 0.12], PALETTE.frameDark));
}

/** Seduta da macchina: cuscino sotto il bacino e schienale con l'inclinazione del busto. */
export function seat(add, pelvis, lean = 5, { back = true, backLen = 0.62, seatLen = 0.46, column = true } = {}) {
  add(pad(V(pelvis.x + 0.08, pelvis.y - 0.17, pelvis.z), V(1, 0, 0), V(0, 1, 0), [seatLen, 0.09, 0.44]));
  const t = torso(pelvis, lean);
  if (back) {
    add(pad(pelvis.clone().addScaledVector(t.up, 0.34).addScaledVector(t.front, -0.19), t.up, t.front, [backLen, 0.09, 0.42]));
    add(tube(V(pelvis.x - 0.22, 0.05, 0), pelvis.clone().addScaledVector(t.up, 0.25).addScaledVector(t.front, -0.25), 0.035));
  }
  if (column) add(tube(V(pelvis.x + 0.05, 0.05, 0), V(pelvis.x + 0.05, pelvis.y - 0.21, 0), 0.045));
  add(box(V(pelvis.x, 0.03, 0), [0.9, 0.05, 0.5], PALETTE.frameDark));
}

/** Torre con pacco pesi e carrucola in alto; move(dy) solleva le piastre. */
export function tower(add, x, z = 0, h = 2.2, { rot = 0 } = {}) {
  const g = new THREE.Group();
  const st = weightStack(V(0, 0.08, 0), 12);
  g.add(st.group);
  for (const dz of [0.2, -0.2]) g.add(tube(V(0, 0.04, dz), V(0, h, dz), 0.032));
  g.add(box(V(0, h, 0), [0.32, 0.06, 0.5]));
  g.add(box(V(0, 0.03, 0), [0.45, 0.05, 0.6], PALETTE.frameDark));
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  add(g);
  return { move: (dy) => st.move(dy, 5), top: st.top };
}

/** Cavo sottile tra due punti, da aggiornare a ogni fotogramma. */
export function cable(add) {
  const m = tube(V(), V(0, 1, 0), 0.006, 0x111111);
  add(m);
  return (a, b) => setTube(m, a, b);
}

export function pulley(add, at, axis = Z) {
  add(disc(at, axis, 0.055, 0.03, PALETTE.steel));
}

/** Maniglia dritta corta (tubo) centrata in p, lungo axis. */
export function grip(add, len = 0.12, r = 0.017) {
  const m = tube(V(0, -len / 2, 0), V(0, len / 2, 0), r, PALETTE.steel);
  add(m);
  return (p, axis = V(0, 1, 0)) => setTube(m, p.clone().addScaledVector(axis.clone().normalize(), -len / 2), p.clone().addScaledVector(axis.clone().normalize(), len / 2));
}

/** Leva della macchina: tubo da un perno a un punto che si muove. */
export function lever(add, r = 0.025, color = PALETTE.frame) {
  const m = tube(V(), V(0, 1, 0), r, color);
  add(m);
  return (a, b) => setTube(m, a, b);
}

// ---------- posizioni ----------

export const SIDES = [['L', 1], ['R', -1]];

/** Piedi a terra davanti alla seduta. */
export function seatedLegs(j, ax = 0.46, width = 0.16, ay = 0.09) {
  for (const [s, z] of SIDES) leg(j, s, V(ax, ay, z * width), V(1, 0, 0), V(1, 0.5, 0));
}

/** In piedi: caviglie in x, larghezza, punte aperte di splay gradi. */
export function standLegs(j, ax = 0, width = 0.13, splay = 8, pole = V(1, 0.15, 0)) {
  for (const [s, z] of SIDES) {
    const a = deg(splay) * z;
    leg(j, s, V(ax, 0.09, z * width), V(Math.cos(a), 0, Math.sin(a)), pole.clone().add(V(0, 0, z * 0.15)));
  }
}

/** Avambraccio con il gomito fermo: angolo phi in gradi dal basso (0) verso l'avanti, nel piano x-y. */
export function forearm(j, s, elbow, phi, up = V(0, 1, 0)) {
  const a = deg(phi);
  const down = up.clone().multiplyScalar(-1);
  const fwd = V(up.y, -up.x, 0);
  const dir = down.multiplyScalar(Math.cos(a)).addScaledVector(fwd, Math.sin(a)).normalize();
  j['elbow' + s] = elbow.clone();
  j['wrist' + s] = elbow.clone().addScaledVector(dir, BODY.forearm);
  j['hand' + s] = j['wrist' + s].clone().addScaledVector(dir, 0.07);
  return dir;
}

/** Mano chiusa su un'impugnatura in p: il polso sta a 0,06 m da p verso la spalla. */
export function hold(j, s, p, pole, back = 0.06) {
  const sh = j['shoulder' + s];
  const dir = p.clone().sub(sh).normalize();
  const wrist = p.clone().addScaledVector(dir, -back);
  arm(j, s, wrist, p.clone().addScaledVector(dir, 0.05), pole);
}

/** Sposta un cuscino creato con pad(): nuovo centro, asse lungo e normale. */
export function placePad(m, center, dir, n) {
  const d = dir.clone().normalize();
  const nn = n.clone().normalize();
  const side = nn.clone().cross(d).normalize();
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(nn, d, side));
  m.position.copy(center);
}
