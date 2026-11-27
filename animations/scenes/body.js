// Corpo libero: piegamenti, plank, dip, trazioni. Codice MIT, animazioni CC BY-SA 4.0.
import { V, PALETTE, BODY, torso, leg, arm, tube, box, deg, lerp, scene, rep, hold, SIDES, pad } from '../lib/kit.js';

const LINE = BODY.thigh + BODY.shin + 0.45; // caviglia → spalla con il corpo dritto

/** Corpo dritto appoggiato sulle punte: angolo del corpo dato dall'altezza delle spalle. */
function straightBody(ankle, shoulderY) {
  const g = Math.asin((shoulderY - ankle.y) / LINE);
  const dir = V(Math.cos(g), Math.sin(g), 0);
  const pelvis = ankle.clone().addScaledVector(dir, BODY.thigh + BODY.shin - 0.01);
  const lean = -(90 - (g * 180) / Math.PI);
  return { pelvis, lean, dir };
}

function toesDown(j, ankle, z) {
  for (const [s, zz] of SIDES) {
    leg(j, s, ankle.clone().setZ(zz * z), V(-0.25, -1, 0), V(0, -1, 0), V(-1, 0.25, 0));
  }
}

const pushup = scene({
  id: 'piegamenti',
  phases: [
    { name: 'in alto', dur: 0.4, from: 0, to: 0, active: 0.3 },
    { name: 'giu', dur: 1.8, from: 0, to: 1, active: 0.7 },
    { name: 'in basso', dur: 0.15, from: 1, to: 1, active: 0.8 },
    { name: 'su', dur: 1.0, from: 1, to: 0, active: 1 },
  ],
  view: [22, 14, 4.2],
  target: V(-0.1, 0.35, 0),
  build({ man }) {
    const A = V(-0.95, 0.16, 0);
    const top = straightBody(A, 0.62);
    const handX = A.x + LINE * Math.cos(Math.asin((0.62 - A.y) / LINE));
    let j;
    return {
      pose(k, act) {
        const b = straightBody(A, lerp(0.62, 0.24, k));
        j = torso(b.pelvis, b.lean, { headTilt: 0 });
        toesDown(j, A, 0.1);
        for (const [s, z] of SIDES) {
          const w = V(handX + 0.02, 0.08, z * 0.3);
          arm(j, s, w, w.clone().add(V(0.08, -0.04, 0)), V(-0.6, 0.4, z));
        }
        man.update(j, { back: act, upperArm: act * 0.6, core: 0.3 });
      },
      markers: () => [
        { n: 1, at: j.handL.clone().add(V(0.06, 0.08, 0.14)) },
        { n: 2, at: j.pelvis.clone().add(V(0, 0.2, 0.2)) },
      ],
    };
    void top;
  },
});

const plank = scene({
  id: 'plank',
  phases: [
    { name: 'a terra', dur: 0.5, from: 0, to: 0, active: 0.1 },
    { name: 'solleva', dur: 0.8, from: 0, to: 1, active: 0.8 },
    { name: 'tieni', dur: 2.6, from: 1, to: 1, active: 1 },
    { name: 'scendi', dur: 0.8, from: 1, to: 0, active: 0.5 },
  ],
  view: [22, 14, 4.0],
  target: V(-0.15, 0.3, 0),
  build({ man }) {
    const A = V(-0.98, 0.16, 0);
    const line = straightBody(A, 0.4);
    const sx = A.x + LINE * Math.cos(Math.asin((0.4 - A.y) / LINE));
    let j;
    return {
      still: 1,
      pose(k, act) {
        const sh = V(sx, 0.4, 0);
        const pel = V(line.pelvis.x, lerp(0.15, line.pelvis.y, k), 0);
        const d = sh.clone().sub(pel);
        const lean = (Math.atan2(-d.x, d.y) * 180) / Math.PI;
        j = torso(pel, lean, { headTilt: 0, shoulderAt: Math.min(0.45, d.length()) });
        toesDown(j, A, 0.1);
        for (const [s, z] of SIDES) {
          const el = V(sx + 0.02, 0.08, z * 0.2);
          j['elbow' + s] = el;
          j['wrist' + s] = el.clone().add(V(0.26, -0.02, -z * 0.05));
          j['hand' + s] = j['wrist' + s].clone().add(V(0.07, 0, -z * 0.02));
        }
        const breathe = k > 0.99 ? 0 : 0;
        man.update(j, { core: act, glutes: act * 0.5, thigh: act * 0.3 + breathe });
      },
      markers: () => [
        { n: 1, at: j.elbowL.clone().add(V(0, 0.1, 0.16)) },
        { n: 2, at: j.toeL.clone().add(V(-0.05, 0.1, 0.16)) },
      ],
    };
  },
});

const dip = scene({
  id: 'dip',
  phases: [
    { name: 'in alto', dur: 0.4, from: 0, to: 0, active: 0.3 },
    { name: 'giu', dur: 1.8, from: 0, to: 1, active: 0.7 },
    { name: 'in basso', dur: 0.15, from: 1, to: 1, active: 0.8 },
    { name: 'su', dur: 1.0, from: 1, to: 0, active: 1 },
  ],
  view: [40, 6, 5.0],
  target: V(0, 1.15, 0),
  build({ add, man }) {
    for (const z of [0.27, -0.27]) {
      add(tube(V(-0.45, 1.15, z), V(0.45, 1.15, z), 0.025, PALETTE.steel));
      for (const x of [-0.4, 0.4]) add(tube(V(x, 0.04, z), V(x, 1.15, z), 0.04));
    }
    add(box(V(0, 0.03, 0), [1.0, 0.05, 0.8], PALETTE.frameDark));
    let j;
    return {
      pose(k, act) {
        const lean = lerp(-8, -16, k);
        const a = deg(lean);
        const up = V(-Math.sin(a), Math.cos(a), 0);
        const shY = lerp(1.74, 1.42, k);
        const shX = lerp(0.0, -0.06, k);
        const pelvis = V(shX, shY, 0).addScaledVector(up, -0.45);
        j = torso(pelvis, lean);
        for (const [s, z] of SIDES) {
          leg(j, s, pelvis.clone().add(V(-0.32, -0.72, z * 0.05)), V(0.3, -1, 0), V(1, -0.3, z * 0.1));
          hold(j, s, V(0.02, 1.2, z * 0.27), V(-1, 0.1, z * 0.15), 0.05);
        }
        man.update(j, { upperArm: act, back: act * 0.6 });
      },
      markers: () => [
        { n: 1, at: j.handL.clone().add(V(0.12, 0.05, 0.1)) },
        { n: 2, at: j.shoulderL.clone().add(V(0, 0.15, 0.12)) },
      ],
    };
  },
});

const pullup = scene({
  id: 'trazioni',
  phases: rep({ start: 0.5, up: 1.1, hold: 0.35, down: 2.0 }),
  view: [42, 4, 6.0],
  target: V(0, 1.5, 0),
  build({ add, man }) {
    const BAR = 2.3;
    add(tube(V(0, BAR, -0.75), V(0, BAR, 0.75), 0.018, PALETTE.steel));
    for (const z of [0.75, -0.75]) add(tube(V(0, 0.04, z), V(0, BAR + 0.05, z), 0.04));
    add(box(V(0, 0.03, 0), [0.6, 0.05, 1.7], PALETTE.frameDark));
    let j;
    return {
      pose(k, act) {
        const lean = lerp(4, 14, k);
        const a = deg(lean);
        const up = V(-Math.sin(a), Math.cos(a), 0);
        const shY = lerp(BAR - 0.56, BAR - 0.13, k);
        const pelvis = V(lerp(-0.04, -0.12, k), shY, 0).addScaledVector(up, -0.45);
        j = torso(pelvis, lean, { headTilt: lerp(-5, -12, k) });
        for (const [s, z] of SIDES) {
          leg(j, s, pelvis.clone().add(V(-0.2, -0.78, z * 0.06)), V(0.4, -1, 0), V(1, -0.2, z * 0.1));
          hold(j, s, V(0, BAR, z * 0.42), V(0, -1, z * 1.2), 0.05);
        }
        man.update(j, { back: act, upperArm: act * 0.5 });
      },
      markers: () => [
        { n: 1, at: j.handL.clone().add(V(0.1, 0.12, 0.1)) },
        { n: 2, at: j.pelvis.clone().add(V(0.12, 0, 0.22)) },
      ],
    };
  },
});

export default [pushup, plank, dip, pullup];
void pad; void hold;
