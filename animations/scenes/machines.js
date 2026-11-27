// Macchine con seduta, leve e pacco pesi. Codice MIT, animazioni CC BY-SA 4.0.
import {
  V, PALETTE, BODY, torso, leg, arm, pad, tube, box, disc, deg, lerp,
  rep, scene, seat, tower, lever, grip, seatedLegs, standLegs, forearm, hold, placePad, SIDES, weightStack,
} from '../lib/kit.js';

const P = V(0, 0.6, 0); // bacino da seduti
const UP = V(0, 1, 0);

/** Spinta o tirata con due maniglie: mano tra a(k=0) e b(k=1), leve da un perno. */
function handles(add, pivot, { axis = UP } = {}) {
  const lv = { L: lever(add, 0.028), R: lever(add, 0.028) };
  const gr = { L: grip(add), R: grip(add) };
  return (s, z, p) => {
    gr[s](p, axis);
    lv[s](pivot(z), p.clone().addScaledVector(axis, 0.07));
  };
}

const chestPress = scene({
  id: 'chest-press',
  phases: rep({ up: 1.0, hold: 0.3, down: 2.4 }),
  view: [52, 12, 4.3],
  target: V(0.2, 0.9, 0),
  build({ add, man }) {
    const LEAN = 10;
    seat(add, P, LEAN);
    for (const z of [0.46, -0.46]) add(tube(V(-0.25, 0.05, z), V(-0.25, 1.05, z), 0.04));
    const st = tower(add, -0.75, 0, 1.6);
    const h = handles(add, (z) => V(-0.25, 1.0, z * 0.46));
    let j;
    return {
      pose(k, act) {
        j = torso(P, LEAN);
        seatedLegs(j);
        for (const [s, z] of SIDES) {
          const p = j['shoulder' + s].clone().add(V(lerp(0.3, 0.6, k), -0.1, z * lerp(0.09, 0.05, k)));
          hold(j, s, p, V(-0.3, -1, z * 0.8));
          h(s, z, p);
        }
        st.move(0.25 * k);
        man.update(j, { back: act, upperArm: act * 0.6 });
      },
      markers: () => [
        { n: 1, at: j.shoulderL.clone().add(V(0.34, 0.02, 0.24)) },
        { n: 3, at: j.ankleL.clone().add(V(0.05, 0.1, 0.12)) },
      ],
    };
  },
});

const shoulderPress = scene({
  id: 'shoulder-press-macchina',
  phases: rep({ up: 1.0, hold: 0.3, down: 2.3 }),
  view: [45, 10, 4.5],
  target: V(0.05, 1.05, 0),
  build({ add, man }) {
    const LEAN = 6;
    seat(add, P, LEAN, { backLen: 0.8 });
    for (const z of [0.36, -0.36]) add(tube(V(-0.45, 0.05, z), V(-0.45, 1.05, z), 0.04));
    const st = tower(add, -0.85, 0, 1.6);
    const h = handles(add, (z) => V(-0.45, 1.02, z * 0.36), { axis: V(1, 0, 0) });
    let j;
    return {
      pose(k, act) {
        j = torso(P, LEAN);
        seatedLegs(j);
        for (const [s, z] of SIDES) {
          const p = j['shoulder' + s].clone().add(V(lerp(0.08, 0.04, k), lerp(0.13, 0.57, k), z * lerp(0.13, 0.06, k)));
          hold(j, s, p, V(0.2, -1, z * 1));
          h(s, z, p);
        }
        st.move(0.3 * k);
        man.update(j, { upperArm: act, back: act * 0.5 });
      },
      markers: () => [
        { n: 1, at: j.shoulderL.clone().add(V(0.1, 0.2, 0.25)) },
        { n: 2, at: j.head.clone().add(V(-0.12, 0, 0.15)) },
      ],
    };
  },
});

const rowMachine = scene({
  id: 'row-macchina',
  phases: rep({ up: 1.0, hold: 0.45, down: 2.2 }),
  view: [38, 14, 4.4],
  target: V(0.25, 0.9, 0),
  build({ add, man }) {
    const LEAN = -6;
    seat(add, P, LEAN, { back: false });
    const t = torso(P, LEAN);
    add(pad(t.chest.clone().addScaledVector(t.front, 0.2).add(V(0, -0.08, 0)), UP, V(-1, 0, 0), [0.45, 0.1, 0.36]));
    add(tube(V(0.45, 0.05, 0), V(0.38, 0.85, 0), 0.04));
    for (const z of [0.36, -0.36]) add(tube(V(0.8, 0.05, z), V(0.8, 0.5, z), 0.04));
    const st = tower(add, 1.15, 0, 1.4);
    const h = handles(add, (z) => V(0.8, 0.45, z * 0.36));
    let j;
    return {
      pose(k, act) {
        j = torso(P, LEAN);
        seatedLegs(j, 0.42);
        for (const [s, z] of SIDES) {
          const p = j['shoulder' + s].clone().add(V(lerp(0.6, 0.2, k), -0.06, z * 0.03));
          hold(j, s, p, V(-1, -0.4, z * 0.5));
          h(s, z, p);
        }
        st.move(0.25 * k);
        man.update(j, { back: act, upperArm: act * 0.4 });
      },
      markers: () => [
        { n: 1, at: j.chest.clone().add(V(0.22, 0.1, 0.25)) },
        { n: 2, at: j.handL.clone().add(V(0.05, 0.1, 0.12)) },
        { n: 3, at: j.toeL.clone().add(V(0.05, 0.08, 0.12)) },
      ],
    };
  },
});

/** Braccia in un arco orizzontale (pectoral e reverse fly): theta 0 = di lato, 90 = davanti. */
function flyScene(id, { from, to, chestPad, lean, act }) {
  return scene({
    id,
    phases: rep({ up: 1.0, hold: 0.45, down: 2.3 }),
    view: [62, 22, 4.3],
    target: V(0.15, 1.0, 0),
    build({ add, man }) {
      seat(add, P, lean, { back: !chestPad, backLen: 0.8 });
      const t = torso(P, lean);
      if (chestPad) {
        add(pad(t.chest.clone().addScaledVector(t.front, 0.2).add(V(0, -0.05, 0)), UP, V(-1, 0, 0), [0.55, 0.1, 0.36]));
        add(tube(V(0.45, 0.05, 0), V(0.38, 0.8, 0), 0.04));
      }
      const top = t.shoulderL.y + 0.5;
      add(tube(V(-0.35, 0.05, 0), V(-0.35, top + 0.1, 0), 0.045));
      add(tube(V(-0.35, top + 0.1, 0), V(t.shoulderL.x, top + 0.1, 0), 0.04));
      const st = tower(add, -0.8, 0, 1.6);
      const h = handles(add, (z) => V(t.shoulderL.x, top + 0.08, z * 0.2));
      let j;
      return {
        pose(k, a) {
          j = torso(P, lean);
          seatedLegs(j);
          const th = deg(lerp(from, to, k));
          for (const [s, z] of SIDES) {
            const p = j['shoulder' + s].clone().add(V(0.55 * Math.sin(th), -0.03, z * 0.55 * Math.cos(th)));
            hold(j, s, p, V(-0.3, -1, z * 0.3));
            h(s, z, p);
          }
          st.move(0.25 * k);
          man.update(j, act(a));
        },
        markers: () => [
          { n: 1, at: j.elbowL.clone().add(V(0, -0.08, 0.12)) },
          { n: 2, at: j.handL.clone().add(V(0, 0.12, 0.08)) },
          { n: 3, at: chestPad ? j.chest.clone().add(V(0.22, 0.12, 0.22)) : j.chest.clone().add(V(-0.15, 0.1, 0.25)) },
        ],
      };
    },
  });
}

const pectoral = flyScene('pectoral-machine', { from: 10, to: 103, chestPad: false, lean: 6, act: (a) => ({ back: a, upperArm: a * 0.4 }) });
const reverseFly = flyScene('reverse-fly-macchina', { from: 100, to: 2, chestPad: true, lean: -6, act: (a) => ({ upperArm: a, back: a * 0.7 }) });

/** Braccia appoggiate su un cuscino inclinato (Scott): curl o tricipiti. */
function scottScene(id, { armDown, from, to, act }) {
  return scene({
    id,
    phases: rep({ up: 0.9, hold: 0.45, down: 2.2 }),
    view: [30, 14, 3.9],
    target: V(0.2, 0.95, 0),
    build({ add, man }) {
      const LEAN = -14;
      seat(add, P, LEAN, { back: false });
      const t = torso(P, LEAN);
      const a = deg(armDown);
      const ua = V(Math.cos(a), -Math.sin(a), 0);
      const n = V(-Math.sin(a), -Math.cos(a), 0);
      const mid = t.shoulderL.clone().setZ(0).addScaledVector(ua, 0.17).addScaledVector(n, 0.09);
      add(pad(mid, ua, n.clone().multiplyScalar(-1), [0.42, 0.1, 0.62]));
      add(tube(V(mid.x + 0.1, 0.05, 0), mid.clone().addScaledVector(n, 0.05), 0.045));
      const st = tower(add, 0.95, 0, 1.4);
      const lv = { L: lever(add, 0.025), R: lever(add, 0.025) };
      const bar = tube(V(0, 0, -0.3), V(0, 0, 0.3), 0.017, PALETTE.steel);
      add(bar);
      let j;
      return {
        pose(k, ac) {
          j = torso(P, LEAN);
          seatedLegs(j, 0.42);
          for (const [s, z] of SIDES) {
            const el = j['shoulder' + s].clone().addScaledVector(ua, BODY.upperArm).add(V(0, 0, z * 0.02));
            forearm(j, s, el, lerp(from, to, k));
            lv[s](el.clone().setZ(z * 0.33), j['hand' + s].clone().setZ(z * 0.33));
          }
          bar.position.copy(j.handL).setZ(0);
          st.move(0.25 * k);
          man.update(j, act(ac));
        },
        markers: () => [
          { n: 1, at: j.elbowL.clone().add(V(0, -0.06, 0.18)) },
          { n: 2, at: j.chest.clone().add(V(0.05, 0.12, 0.25)) },
          { n: 3, at: j.handL.clone().add(V(0.05, 0.08, 0.15)) },
        ],
      };
    },
  });
}

const curlMachine = scottScene('curl-macchina', { armDown: 42, from: 52, to: 165, act: (a) => ({ upperArm: a, forearm: a * 0.4 }) });
const tricepsMachine = scottScene('tricipiti-macchina', { armDown: 28, from: 172, to: 68, act: (a) => ({ upperArm: a }) });

const crunch = scene({
  id: 'crunch-macchina',
  phases: rep({ up: 1.0, hold: 0.5, down: 2.0 }),
  view: [42, 12, 4.1],
  target: V(0.1, 0.95, 0),
  build({ add, man }) {
    seat(add, P, 8, { back: false });
    const back = add(pad(V(), UP, V(1, 0, 0), [0.62, 0.09, 0.42]));
    const lumbar = add(pad(V(), V(0, 0, 1), UP, [0.4, 0.09, 0.12]));
    add(tube(V(-0.3, 0.05, 0), V(-0.3, 0.55, 0), 0.045));
    const st = tower(add, -0.8, 0, 1.5);
    const arms = { L: lever(add, 0.025), R: lever(add, 0.025) };
    let j;
    return {
      pose(k, act) {
        const lean = lerp(8, -30, k);
        j = torso(P, lean, { headTilt: lerp(0, 18, k) });
        seatedLegs(j);
        placePad(back, P.clone().addScaledVector(j.up, 0.38).addScaledVector(j.front, -0.19), j.up, j.front);
        placePad(lumbar, P.clone().addScaledVector(j.up, 0.12).addScaledVector(j.front, -0.17), V(0, 0, 1), j.front);
        for (const [s, z] of SIDES) {
          const p = j['shoulder' + s].clone().addScaledVector(j.front, 0.13).addScaledVector(j.up, 0.08).add(V(0, 0, z * 0.05));
          hold(j, s, p, j.front.clone().multiplyScalar(0.3).add(V(0, -1, z * 0.6)));
          arms[s](P.clone().addScaledVector(j.front, -0.28).add(V(0, 0, z * 0.3)), p.clone().setZ(z * 0.3));
        }
        st.move(0.22 * k);
        man.update(j, { core: act, back: act * 0.3 });
      },
      markers: () => [
        { n: 1, at: j.pelvis.clone().add(V(-0.25, 0.1, 0.25)) },
        { n: 2, at: j.handL.clone().add(V(0.05, 0.1, 0.12)) },
        { n: 3, at: j.toeL.clone().add(V(0.05, 0.08, 0.12)) },
      ],
    };
  },
});

/** Abductor e adductor: cosce che ruotano in orizzontale. */
function abdScene(id, { from, to, outside, act }) {
  return scene({
    id,
    phases: rep({ up: 1.0, hold: 0.45, down: 2.2 }),
    view: [80, 32, 4.0],
    target: V(0.25, 0.55, 0),
    build({ add, man }) {
      const LEAN = 14;
      seat(add, P, LEAN);
      const st = tower(add, -0.8, 0, 1.4);
      const pads = { L: add(pad(V(), UP, V(1, 0, 0), [0.22, 0.09, 0.09])), R: add(pad(V(), UP, V(1, 0, 0), [0.22, 0.09, 0.09])) };
      const pedals = { L: add(box(V(), [0.26, 0.03, 0.1], PALETTE.frame)), R: add(box(V(), [0.26, 0.03, 0.1], PALETTE.frame)) };
      const arms = { L: lever(add, 0.03), R: lever(add, 0.03) };
      let j;
      return {
        pose(k, ac) {
          j = torso(P, LEAN);
          const f = deg(lerp(from, to, k));
          for (const [s, z] of SIDES) {
            const dir = V(Math.cos(f), -0.04, z * Math.sin(f)).normalize();
            const knee = j['hip' + s].clone().addScaledVector(dir, BODY.thigh);
            const ankle = knee.clone().add(V(0.03, -0.425, z * 0.01));
            const t = V(Math.cos(f), 0, z * Math.sin(f));
            j['knee' + s] = knee;
            j['ankle' + s] = ankle;
            j['heel' + s] = ankle.clone().addScaledVector(t, -0.05).add(V(0, -0.05, 0));
            j['toe' + s] = ankle.clone().addScaledVector(t, 0.16).add(V(0, -0.055, 0));
            const side = V(-Math.sin(f), 0, z * Math.cos(f)).multiplyScalar(outside ? 0.1 : -0.1);
            const padAt = knee.clone().add(side).add(V(-0.04, 0, 0));
            placePad(pads[s], padAt, UP, side);
            pedals[s].position.copy(ankle.clone().addScaledVector(t, 0.05).add(V(0, -0.09, 0)));
            pedals[s].rotation.y = -z * f;
            arms[s](V(0.2, 0.33, z * 0.04), padAt.clone().add(V(0, -0.12, 0)));
            const w = V(0.12, 0.5, z * 0.3);
            arm(j, s, w, w.clone().add(V(0.1, 0, 0)), V(-0.2, -1, z * 0.6));
          }
          st.move(0.22 * k);
          man.update(j, act(ac));
        },
        markers: () => [
          { n: 1, at: j.toeL.clone().add(V(0.05, 0.02, 0.15)) },
          { n: 2, at: j.kneeL.clone().add(V(0, 0.12, 0.16)) },
          { n: 3, at: j.handL.clone().add(V(0.05, 0.1, 0.1)) },
        ],
      };
    },
  });
}

const abductor = abdScene('abductor', { from: 4, to: 36, outside: true, act: (a) => ({ glutes: a, thigh: a * 0.35 }) });
const adductor = abdScene('adductor', { from: 40, to: 5, outside: false, act: (a) => ({ thigh: a }) });

const legCurlSeated = scene({
  id: 'leg-curl-seduto',
  phases: rep({ up: 1.0, hold: 0.45, down: 2.3 }),
  view: [32, 16, 3.9],
  target: V(0.3, 0.6, 0),
  build({ add, man }) {
    const pelvis = V(0, 0.62, 0);
    const knee0 = V(BODY.thigh - 0.01, 0.6, 0);
    seat(add, pelvis, 10);
    add(tube(V(knee0.x, 0.06, 0.32), V(knee0.x, knee0.y, 0.32), 0.035));
    add(disc(knee0.clone().setZ(0.34), V(0, 0, 1), 0.05, 0.03, PALETTE.marker));
    add(tube(V(0.28, 0.76, -0.24), V(0.28, 0.76, 0.24), 0.05, PALETTE.pad));
    add(tube(V(0.28, 0.76, 0.24), V(0.28, 0.76, 0.32), 0.022));
    add(tube(V(0.28, 0.76, 0.32), V(knee0.x, knee0.y, 0.32), 0.022));
    const st = tower(add, -0.75, 0, 1.4);
    const rod = lever(add, 0.028);
    const roll = add(tube(V(0, 0, -0.22), V(0, 0, 0.22), 0.05, PALETTE.pad));
    let j;
    const PAD = 0.39;
    return {
      pose(k, act) {
        const a = deg(lerp(80, -8, k));
        const shin = V(Math.sin(a), -Math.cos(a), 0);
        const fwd = V(Math.cos(a), Math.sin(a), 0);
        j = torso(pelvis, 10);
        for (const [s, z] of SIDES) {
          const knee = knee0.clone().setZ(z * 0.1);
          const ankle = knee.clone().addScaledVector(shin, BODY.shin);
          j['knee' + s] = knee;
          j['ankle' + s] = ankle;
          j['heel' + s] = ankle.clone().addScaledVector(fwd, -0.05).addScaledVector(shin, 0.05);
          j['toe' + s] = ankle.clone().addScaledVector(fwd, 0.15).addScaledVector(shin, 0.07);
          const w = V(0.08, 0.53, z * 0.3);
          arm(j, s, w, w.clone().add(V(0.1, 0, 0)), V(-0.2, -1, z * 0.6));
        }
        const pc = knee0.clone().addScaledVector(shin, PAD).addScaledVector(fwd, -0.085);
        roll.position.copy(pc);
        rod(knee0.clone().setZ(0.32), pc.clone().setZ(0.32));
        st.move(0.28 * k);
        man.update(j, { thigh: act });
      },
      markers: () => [
        { n: 1, at: knee0.clone().add(V(-0.02, 0.2, 0.38)) },
        { n: 2, at: j.ankleL.clone().add(V(-0.06, -0.1, 0.24)) },
        { n: 3, at: V(0.28, 0.9, 0.3) },
      ],
    };
  },
});

const calfSeated = scene({
  id: 'polpacci-seduto',
  phases: [
    { name: 'giu', dur: 0.4, from: 0, to: 0, active: 0.3 },
    { name: 'su', dur: 0.8, from: 0, to: 1, active: 1 },
    { name: 'tieni', dur: 1.0, from: 1, to: 1, active: 1 },
    { name: 'scendi', dur: 1.8, from: 1, to: 0, active: 0.6 },
  ],
  view: [28, 12, 3.6],
  target: V(0.3, 0.55, 0),
  build({ add, man }) {
    const pelvis = V(0, 0.62, 0);
    seat(add, pelvis, 0, { back: false });
    add(box(V(0.56, 0.1, 0), [0.22, 0.14, 0.5], PALETTE.frame));
    add(tube(V(0.85, 0.05, 0), V(0.85, 0.85, 0), 0.045));
    const thighPad = add(pad(V(), V(0, 0, 1), UP, [0.46, 0.09, 0.14]));
    const arm1 = lever(add, 0.03);
    let j;
    return {
      pose(k, act) {
        j = torso(pelvis, 0);
        const b = deg(lerp(-18, 30, k));
        const f = V(Math.cos(b), -Math.sin(b), 0);
        const pu = V(Math.sin(b), Math.cos(b), 0);
        for (const [s, z] of SIDES) {
          const ball = V(0.56, 0.175, z * 0.13);
          const ankle = ball.clone().addScaledVector(f, -0.15).addScaledVector(pu, 0.06);
          leg(j, s, ankle, f, V(0.6, 1, z * 0.2), pu.clone().multiplyScalar(-1));
          const w = V(0.32, 0.66, z * 0.28);
          arm(j, s, w, w.clone().add(V(0.1, 0, 0)), V(-0.2, -1, z * 0.6));
        }
        const pc = j.kneeL.clone().setZ(0).add(V(-0.08, 0.1, 0));
        placePad(thighPad, pc, V(0, 0, 1), UP);
        arm1(V(0.85, 0.75, 0), pc.clone().add(V(0, 0.05, 0)));
        man.update(j, { shin: act });
      },
      markers: () => [
        { n: 1, at: V(0.6, 0.22, 0.32) },
        { n: 2, at: j.kneeL.clone().add(V(-0.08, 0.22, 0.25)) },
        { n: 3, at: V(0.85, 0.85, 0.12) },
      ],
    };
  },
});

const legCurlLying = scene({
  id: 'leg-curl-sdraiato',
  phases: rep({ up: 1.0, hold: 0.45, down: 2.3 }),
  view: [22, 24, 4.4],
  target: V(0.1, 0.65, 0),
  build({ add, man }) {
    const pelvis = V(-0.02, 0.73, 0);
    add(pad(V(0.32, 0.56, 0), V(1, 0, 0), UP, [1.35, 0.1, 0.36]));
    for (const x of [-0.25, 0.85]) add(tube(V(x, 0.05, 0), V(x, 0.5, 0), 0.045));
    add(box(V(0.3, 0.03, 0), [1.4, 0.05, 0.4], PALETTE.frameDark));
    const kneeX = pelvis.x - BODY.thigh;
    add(tube(V(kneeX, 0.06, 0.32), V(kneeX, 0.72, 0.32), 0.035));
    add(disc(V(kneeX, 0.72, 0.34), V(0, 0, 1), 0.05, 0.03, PALETTE.marker));
    for (const z of [0.27, -0.27]) add(tube(V(0.78, 0.5, z), V(0.78, 0.6, z), 0.02, PALETTE.steel));
    const st = tower(add, -0.95, 0, 1.2);
    const rod = lever(add, 0.028);
    const roll = add(tube(V(0, 0, -0.22), V(0, 0, 0.22), 0.05, PALETTE.pad));
    let j;
    return {
      pose(k, act) {
        j = torso(pelvis, -90);
        const psi = deg(lerp(6, 112, k));
        const dir = V(-Math.cos(psi), Math.sin(psi), 0);
        const n = V(Math.sin(psi), Math.cos(psi), 0);
        for (const [s, z] of SIDES) {
          const knee = V(kneeX, pelvis.y - 0.02, z * 0.1);
          const ankle = knee.clone().addScaledVector(dir, BODY.shin);
          j['knee' + s] = knee;
          j['ankle' + s] = ankle;
          j['heel' + s] = ankle.clone().addScaledVector(n, 0.05).addScaledVector(dir, 0.04);
          j['toe' + s] = ankle.clone().addScaledVector(n, -0.15).addScaledVector(dir, 0.06);
          hold(j, s, V(0.78, 0.61, z * 0.27), V(0.2, -1, z * 0.6));
        }
        const pc = V(kneeX, pelvis.y - 0.02, 0).addScaledVector(dir, 0.37).addScaledVector(n, 0.09);
        roll.position.copy(pc);
        rod(V(kneeX, 0.72, 0.32), pc.clone().setZ(0.32));
        st.move(0.28 * k);
        man.update(j, { thigh: act, glutes: act * 0.3 });
      },
      markers: () => [
        { n: 1, at: V(kneeX, 0.88, 0.36) },
        { n: 2, at: j.heelL.clone().add(V(-0.05, 0.14, 0.24)) },
        { n: 3, at: j.handL.clone().add(V(0.05, 0.12, 0.1)) },
      ],
    };
  },
});

const hackSquat = scene({
  id: 'hack-squat',
  phases: [
    { name: 'in alto', dur: 0.4, from: 0, to: 0, active: 0.3 },
    { name: 'scendi', dur: 2.2, from: 0, to: 1, active: 0.7 },
    { name: 'in basso', dur: 0.2, from: 1, to: 1, active: 0.8 },
    { name: 'spingi', dur: 1.1, from: 1, to: 0, active: 1 },
  ],
  view: [30, 12, 4.5],
  target: V(0.15, 0.9, 0),
  build({ add, man }) {
    const LEAN = 40;
    const t0 = torso(V(), LEAN);
    const up = t0.up, front = t0.front;
    const P1 = V(0.04, 0.95, 0);
    const plate = V(0.42, 0.1, 0);
    add(pad(plate.clone().add(V(0.02, 0.0, 0)), V(Math.cos(deg(20)), Math.sin(deg(20)), 0), V(-Math.sin(deg(20)), Math.cos(deg(20)), 0), [0.5, 0.06, 0.7], 0x3a3f45));
    add(box(V(0.3, 0.03, 0), [1.6, 0.05, 0.7], PALETTE.frameDark));
    const railA = P1.clone().addScaledVector(up, -0.75).addScaledVector(front, -0.22);
    const railB = P1.clone().addScaledVector(up, 1.0).addScaledVector(front, -0.22);
    for (const z of [0.25, -0.25]) {
      add(tube(railA.clone().setZ(z), railB.clone().setZ(z), 0.035));
      add(tube(V(railB.x, 0.05, z), railB.clone().setZ(z), 0.045));
    }
    const back = add(pad(V(), up, front, [0.7, 0.09, 0.42]));
    const sp = { L: add(pad(V(), front, up, [0.22, 0.09, 0.12])), R: add(pad(V(), front, up, [0.22, 0.09, 0.12])) };
    let j;
    return {
      pose(k, act) {
        const pel = P1.clone().addScaledVector(up, -0.38 * k);
        j = torso(pel, LEAN, { headTilt: -10 });
        for (const [s, z] of SIDES) {
          const ankle = plate.clone().add(V(-0.02, 0.1, z * 0.15));
          const a = deg(z * 12);
          leg(j, s, ankle, V(Math.cos(a), 0.35, Math.sin(a)), V(1, 0.6, z * 0.25));
          const shp = j['shoulder' + s].clone().addScaledVector(up, 0.09).addScaledVector(front, -0.01);
          placePad(sp[s], shp, front, up);
          hold(j, s, j['shoulder' + s].clone().addScaledVector(up, 0.1).addScaledVector(front, 0.16).add(V(0, 0, z * 0.1)), V(0, -1, z * 0.8));
        }
        placePad(back, pel.clone().addScaledVector(up, 0.32).addScaledVector(front, -0.19), up, front);
        man.update(j, { thigh: act, glutes: act * 0.8 });
      },
      markers: () => [
        { n: 1, at: j.shoulderL.clone().add(V(0.05, 0.2, 0.2)) },
        { n: 2, at: j.toeL.clone().add(V(0.05, 0.1, 0.14)) },
        { n: 3, at: j.kneeL.clone().add(V(0.05, 0.1, 0.15)) },
      ],
    };
  },
});

const calfStanding = scene({
  id: 'polpacci-in-piedi',
  phases: [
    { name: 'giu', dur: 0.4, from: 0, to: 0, active: 0.3 },
    { name: 'su', dur: 0.8, from: 0, to: 1, active: 1 },
    { name: 'tieni', dur: 1.0, from: 1, to: 1, active: 1 },
    { name: 'scendi', dur: 1.8, from: 1, to: 0, active: 0.6 },
  ],
  view: [35, 8, 4.6],
  target: V(0.0, 1.05, 0),
  build({ add, man }) {
    add(box(V(0.14, 0.06, 0), [0.26, 0.12, 0.6], PALETTE.frame));
    add(box(V(-0.2, 0.03, 0), [1.0, 0.05, 0.7], PALETTE.frameDark));
    const tw = tower(add, -0.6, 0, 2.2);
    const sp = { L: add(pad(V(), V(1, 0, 0), UP, [0.26, 0.09, 0.13])), R: add(pad(V(), V(1, 0, 0), UP, [0.26, 0.09, 0.13])) };
    const arms = { L: lever(add, 0.03), R: lever(add, 0.03) };
    let j;
    return {
      pose(k, act) {
        const b = deg(lerp(-20, 30, k));
        const f = V(Math.cos(b), -Math.sin(b), 0);
        const pu = V(Math.sin(b), Math.cos(b), 0);
        const ankle0 = V(0.2, 0.125, 0).addScaledVector(f, -0.15).addScaledVector(pu, 0.06);
        j = torso(V(ankle0.x - 0.04, ankle0.y + 0.85, 0), 0);
        for (const [s, z] of SIDES) {
          const ball = V(0.2, 0.125, z * 0.12);
          const ankle = ball.clone().addScaledVector(f, -0.15).addScaledVector(pu, 0.06);
          leg(j, s, ankle, f, V(1, 0.1, z * 0.2), pu.clone().multiplyScalar(-1));
          const top = j['shoulder' + s].clone().add(V(0, 0.08, z * 0.02));
          placePad(sp[s], top, V(1, 0, 0), UP);
          arms[s](V(-0.6, 2.0, z * 0.2), top.clone().add(V(-0.12, 0.02, 0)));
          hold(j, s, top.clone().add(V(0.16, 0.0, z * 0.05)), V(0.2, -1, z * 0.8));
        }
        tw.move(0.15 * k);
        man.update(j, { shin: act });
      },
      markers: () => [
        { n: 1, at: j.shoulderL.clone().add(V(0, 0.2, 0.18)) },
        { n: 2, at: V(0.25, 0.2, 0.3) },
        { n: 3, at: j.chest.clone().add(V(0.15, -0.05, 0.22)) },
      ],
    };
  },
});

const hyperext = scene({
  id: 'iperestensioni',
  phases: [
    { name: 'in linea', dur: 0.4, from: 1, to: 1, active: 0.5 },
    { name: 'scendi', dur: 2.0, from: 1, to: 0, active: 0.5 },
    { name: 'in basso', dur: 0.2, from: 0, to: 0, active: 0.3 },
    { name: 'risali', dur: 1.2, from: 0, to: 1, active: 1 },
  ],
  view: [25, 10, 4.3],
  target: V(0.05, 0.8, 0),
  build({ add, man }) {
    const ld = V(Math.SQRT1_2, Math.SQRT1_2, 0);
    const ant = V(Math.SQRT1_2, -Math.SQRT1_2, 0);
    const ank = V(-0.55, 0.26, 0);
    const pelvis = ank.clone().addScaledVector(ld, 0.85);
    add(pad(ank.clone().addScaledVector(ld, 0.68).addScaledVector(ant, 0.13), ld, ant.clone().multiplyScalar(-1), [0.42, 0.1, 0.4]));
    add(tube(ank.clone().addScaledVector(ant, -0.08).setZ(-0.2), ank.clone().addScaledVector(ant, -0.08).setZ(0.2), 0.045, PALETTE.pad));
    add(box(ank.clone().addScaledVector(ant, 0.07).addScaledVector(ld, -0.06), [0.24, 0.03, 0.4], PALETTE.frame, deg(-45)));
    add(tube(V(-0.6, 0.05, 0), ank.clone().addScaledVector(ld, 0.7).addScaledVector(ant, 0.2), 0.05));
    add(box(V(-0.2, 0.03, 0), [1.2, 0.05, 0.5], PALETTE.frameDark));
    let j;
    return {
      still: 1,
      pose(k, act) {
        j = torso(pelvis, lerp(-150, -45, k), { headTilt: lerp(-10, 0, k) });
        for (const [s, z] of SIDES) {
          leg(j, s, ank.clone().setZ(z * 0.1), ant, ant.clone().add(V(0, 0, 0)), ld.clone().multiplyScalar(-1));
          const w = j.chest.clone().addScaledVector(j.front, 0.14).addScaledVector(j.up, -0.06).add(V(0, 0, -z * 0.09));
          arm(j, s, w, w.clone().add(V(0, 0, -z * 0.1)), j.front.clone().multiplyScalar(0.4).add(V(0, 0, z)).addScaledVector(j.up, -0.4));
        }
        man.update(j, { glutes: act, core: act * 0.7 });
      },
      markers: () => [
        { n: 1, at: j.pelvis.clone().addScaledVector(ant, 0.22).add(V(0, 0, 0.25)) },
        { n: 2, at: j.heelL.clone().add(V(-0.12, 0.05, 0.2)) },
      ],
    };
  },
});

export default [chestPress, shoulderPress, rowMachine, pectoral, reverseFly, curlMachine, tricepsMachine, crunch,
  abductor, adductor, legCurlSeated, calfSeated, legCurlLying, hackSquat, calfStanding, hyperext];
void torso; void standLegs; void weightStack;
