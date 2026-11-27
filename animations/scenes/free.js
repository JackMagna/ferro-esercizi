// Bilanciere e manubri. Codice MIT, animazioni CC BY-SA 4.0.
import {
  V, PALETTE, BODY, torso, leg, arm, pad, tube, box, deg, lerp,
  rep, scene, seat, bench, barbell, dumbbell, orient, standLegs, seatedLegs, forearm, hold, SIDES,
} from '../lib/kit.js';

const UP = V(0, 1, 0);
const X = V(1, 0, 0);
const Zv = V(0, 0, 1);

/** Prima giù poi su (squat, stacco rumeno, panca): v=1 in basso. */
const downUp = ({ start = 0.4, down = 2.0, bottom = 0.2, up = 1.1 } = {}) => [
  { name: 'partenza', dur: start, from: 0, to: 0, active: 0.3 },
  { name: 'giu', dur: down, from: 0, to: 1, active: 0.65 },
  { name: 'in basso', dur: bottom, from: 1, to: 1, active: 0.8 },
  { name: 'su', dur: up, from: 1, to: 0, active: 1 },
];

/** Squat con bilanciere sulla schiena: il bacino si sposta per tenere la barra sopra barX. */
function backSquat(k, { barX, lean, y, ankleX, width, splay }) {
  const l = lerp(lean[0], lean[1], k);
  const a = deg(l);
  const up = V(-Math.sin(a), Math.cos(a), 0), front = V(Math.cos(a), Math.sin(a), 0);
  const px = barX - 0.47 * up.x + 0.13 * front.x;
  const j = torso(V(px, lerp(y[0], y[1], k), 0), l, { headTilt: lerp(0, -18, k) });
  standLegs(j, ankleX, width, splay, V(1, 0.1, 0));
  const bar = j.pelvis.clone().addScaledVector(j.up, 0.47).addScaledVector(j.front, -0.13);
  for (const [s, z] of SIDES) hold(j, s, bar.clone().add(V(0, 0, z * 0.34)), V(-0.6, -1, z * 0.3));
  return { j, bar };
}

const squat = scene({
  id: 'squat-bilanciere',
  phases: downUp(),
  view: [38, 10, 4.8],
  target: V(0, 0.95, 0),
  build({ add, man }) {
    for (const z of [0.62, -0.62]) {
      add(tube(V(-0.6, 0.04, z), V(-0.6, 1.85, z), 0.035));
      add(tube(V(-0.6, 1.3, z), V(-0.5, 1.3, z), 0.02, PALETTE.steel));
      add(tube(V(-0.62, 0.8, z), V(0.35, 0.8, z), 0.025, PALETTE.marker));
      add(tube(V(0.35, 0.04, z), V(0.35, 0.8, z), 0.03));
    }
    const bb = add(barbell({ plates: 2 }));
    let j;
    return {
      pose(k, act) {
        const r = backSquat(k, { barX: 0.04, lean: [-8, -45], y: [0.92, 0.5], ankleX: 0, width: 0.17, splay: 15 });
        j = r.j;
        bb.position.copy(r.bar);
        man.update(j, { thigh: act, glutes: act * 0.9 });
      },
      markers: () => [
        { n: 1, at: V(0.2, 0.88, 0.66) },
        { n: 2, at: j.neck.clone().add(V(-0.12, 0.05, 0.12)) },
        { n: 3, at: j.handL.clone().add(V(0, 0.12, 0.06)) },
        { n: 4, at: j.toeL.clone().add(V(0.08, 0.05, 0.12)) },
      ],
    };
  },
});

const smithSquat = scene({
  id: 'squat-multipower',
  phases: downUp(),
  view: [38, 10, 4.8],
  target: V(0, 0.95, 0),
  build({ add, man }) {
    for (const z of [0.62, -0.62]) {
      add(tube(V(-0.02, 0.04, z), V(-0.02, 2.1, z), 0.03, PALETTE.steel));
      add(tube(V(-0.3, 0.04, z), V(-0.3, 2.15, z), 0.04));
      add(box(V(-0.02, 0.86, z), [0.08, 0.05, 0.08], PALETTE.marker));
    }
    add(tube(V(-0.3, 2.15, 0.62), V(-0.3, 2.15, -0.62), 0.04));
    add(box(V(-0.1, 0.03, 0), [1.0, 0.05, 1.5], PALETTE.frameDark));
    const bb = add(barbell({ plates: 1 }));
    const sl = { L: add(box(V(), [0.07, 0.12, 0.07], PALETTE.frame)), R: add(box(V(), [0.07, 0.12, 0.07], PALETTE.frame)) };
    let j;
    return {
      pose(k, act) {
        const r = backSquat(k, { barX: -0.02, lean: [-4, -24], y: [0.92, 0.55], ankleX: 0.15, width: 0.17, splay: 12 });
        j = r.j;
        bb.position.copy(r.bar);
        sl.L.position.copy(r.bar).setZ(0.62);
        sl.R.position.copy(r.bar).setZ(-0.62);
        man.update(j, { thigh: act, glutes: act * 0.8 });
      },
      markers: () => [
        { n: 1, at: V(0.1, 0.92, 0.7) },
        { n: 2, at: j.neck.clone().add(V(-0.12, 0.05, 0.12)) },
        { n: 3, at: j.toeL.clone().add(V(0.08, 0.05, 0.12)) },
      ],
    };
  },
});

const deadlift = scene({
  id: 'stacco',
  phases: [
    { name: 'pronto', dur: 0.5, from: 0, to: 0, active: 0.4 },
    { name: 'tira', dur: 1.3, from: 0, to: 1, active: 1 },
    { name: 'in piedi', dur: 0.4, from: 1, to: 1, active: 0.5 },
    { name: 'giu', dur: 1.7, from: 1, to: 0, active: 0.6 },
  ],
  view: [35, 8, 4.6],
  target: V(0.0, 0.75, 0),
  build({ add, man }) {
    const bb = add(barbell({ plates: 2 }));
    let j;
    return {
      pose(k, act) {
        const h = Math.min(1, Math.max(0, (k - 0.2) / 0.8));
        j = torso(V(lerp(-0.28, -0.03, h), lerp(0.6, 0.94, k), 0), lerp(-58, 0, h), { headTilt: lerp(-25, 0, h) });
        standLegs(j, -0.04, 0.12, 6, V(1, 0.2, 0));
        const sh = j.shoulderL.y;
        const bar = V(0.06 + 0.03 * h, Math.max(0.225, sh - 0.63), 0);
        for (const [s, z] of SIDES) hold(j, s, bar.clone().add(V(0, 0, z * 0.25)), V(-1, 0, z * 0.2));
        bb.position.copy(bar);
        man.update(j, { glutes: act, thigh: act * 0.8, core: act * 0.6 });
      },
      markers: () => [
        { n: 1, at: j.toeL.clone().add(V(0.1, 0.02, 0.15)) },
        { n: 2, at: j.handL.clone().add(V(0.02, 0.1, 0.1)) },
        { n: 3, at: j.chest.clone().add(V(0.05, 0.15, 0.24)) },
        { n: 4, at: j.elbowL.clone().add(V(0.0, 0, 0.14)) },
      ],
    };
  },
});

const rdl = scene({
  id: 'stacco-rumeno',
  phases: downUp({ down: 2.1, up: 1.2 }),
  view: [35, 8, 4.6],
  target: V(0.0, 0.85, 0),
  build({ add, man }) {
    const bb = add(barbell({ plates: 1 }));
    let j;
    return {
      pose(k, act) {
        j = torso(V(lerp(-0.01, -0.25, k), lerp(0.92, 0.87, k), 0), lerp(-3, -72, k), { headTilt: lerp(5, -30, k) });
        standLegs(j, 0.0, 0.11, 4, V(1, 0.05, 0));
        const sh = j.shoulderL;
        const bar = V(sh.x + lerp(0.12, 0.03, k), sh.y - 0.61, 0);
        for (const [s, z] of SIDES) hold(j, s, bar.clone().add(V(0, 0, z * 0.22)), V(-1, 0, z * 0.2));
        bb.position.copy(bar);
        man.update(j, { thigh: act, glutes: act * 0.9 });
      },
      markers: () => [
        { n: 1, at: j.handL.clone().add(V(0.05, 0.1, 0.1)) },
        { n: 2, at: j.kneeL.clone().add(V(0.08, 0, 0.14)) },
        { n: 3, at: j.shoulderL.clone().add(V(0, 0.12, 0.12)) },
      ],
    };
  },
});

const bentRow = scene({
  id: 'rematore-bilanciere',
  phases: rep({ up: 0.9, hold: 0.4, down: 2.0 }),
  view: [32, 8, 4.5],
  target: V(0.0, 0.8, 0),
  build({ add, man }) {
    const bb = add(barbell({ plates: 1 }));
    let j;
    return {
      pose(k, act) {
        j = torso(V(-0.2, 0.84, 0), -52, { headTilt: -30 });
        standLegs(j, 0.03, 0.13, 6, V(1, 0.2, 0));
        const hang = j.shoulderL.clone().setZ(0).add(V(0.02, -0.6, 0));
        const navel = j.pelvis.clone().addScaledVector(j.up, 0.22).addScaledVector(j.front, 0.16);
        const bar = hang.lerp(navel, k);
        for (const [s, z] of SIDES) hold(j, s, bar.clone().add(V(0, 0, z * 0.26)), V(-0.6, 0.6, z * 0.5));
        bb.position.copy(bar);
        man.update(j, { back: act, upperArm: act * 0.5 });
      },
      markers: () => [
        { n: 1, at: j.handL.clone().add(V(0.05, -0.05, 0.12)) },
        { n: 2, at: j.pelvis.clone().add(V(-0.12, 0.12, 0.2)) },
        { n: 3, at: j.chest.clone().add(V(0.05, 0.16, 0.24)) },
      ],
    };
  },
});

/** Curl in piedi: gomiti fermi, avambracci che salgono. */
function curlScene(id, dumbbells) {
  return scene({
    id,
    phases: rep({ up: 0.9, hold: 0.4, down: 2.1 }),
    view: [40, 6, 4.0],
    target: V(0.05, 1.05, 0),
    build({ add, man }) {
      const props = dumbbells
        ? { L: add(dumbbell(0.06)), R: add(dumbbell(0.06)) }
        : { bar: add(barbell({ half: 0.65, plateR: 0.13, plates: 1 })) };
      let j;
      return {
        pose(k, act) {
          j = torso(V(-0.02, 0.93, 0), 0);
          standLegs(j, 0, 0.12);
          for (const [s, z] of SIDES) {
            const el = j['shoulder' + s].clone().add(V(0.04, -0.297, z * 0.015));
            forearm(j, s, el, lerp(12, 138, k));
            if (dumbbells) props[s].position.copy(j['hand' + s]);
          }
          if (!dumbbells) props.bar.position.copy(j.handL).setZ(0);
          man.update(j, { upperArm: act, forearm: act * 0.4 });
        },
        markers: () => [
          { n: 1, at: j.handL.clone().add(V(0.08, 0.02, 0.12)) },
          { n: 2, at: j.elbowL.clone().add(V(-0.06, 0, 0.14)) },
          ...(dumbbells ? [{ n: 3, at: j.shoulderL.clone().add(V(0, 0.1, 0.12)) }] : []),
        ],
      };
    },
  });
}

const curlBar = curlScene('curl-bilanciere', false);
const curlDb = curlScene('curl-manubri', true);

const lateral = scene({
  id: 'alzate-laterali',
  phases: rep({ up: 1.0, hold: 0.35, down: 2.2 }),
  view: [72, 10, 4.3],
  target: V(0, 1.1, 0),
  build({ add, man }) {
    const d = { L: add(dumbbell(0.055)), R: add(dumbbell(0.055)) };
    let j;
    return {
      pose(k, act) {
        j = torso(V(-0.02, 0.93, 0), 0);
        standLegs(j, 0, 0.15);
        const a = deg(lerp(10, 86, k));
        for (const [s, z] of SIDES) {
          const dir = V(Math.sin(a) * 0.25, -Math.cos(a), z * Math.sin(a)).normalize();
          const p = j['shoulder' + s].clone().addScaledVector(dir, 0.6);
          hold(j, s, p, V(-0.4, 0.7, z * 0.2));
          orient(d[s], X).position.copy(j['hand' + s]);
        }
        man.update(j, { upperArm: act, back: act * 0.3 });
      },
      markers: () => [
        { n: 1, at: j.handL.clone().add(V(0.1, 0, 0.1)) },
        { n: 2, at: j.toeL.clone().add(V(0.08, 0.05, 0.12)) },
        { n: 3, at: j.shoulderL.clone().add(V(0, 0.12, 0.12)) },
      ],
    };
  },
});

const ohp = scene({
  id: 'lento-avanti',
  phases: rep({ up: 1.0, hold: 0.35, down: 2.0 }),
  view: [40, 8, 4.8],
  target: V(0, 1.25, 0),
  build({ add, man }) {
    const bb = add(barbell({ plates: 1 }));
    let j;
    return {
      pose(k, act) {
        j = torso(V(-0.02, 0.93, 0), 0, { headTilt: k < 0.5 ? -k * 16 : -(1 - k) * 16 });
        standLegs(j, 0, 0.12);
        const sh = j.shoulderL.clone().setZ(0);
        const bar = sh.clone().add(V(0.14, 0.03, 0)).lerp(sh.clone().add(V(0.0, 0.6, 0)), k);
        for (const [s, z] of SIDES) hold(j, s, bar.clone().add(V(0, 0, z * 0.27)), V(0.4, -1, z * 0.6));
        bb.position.copy(bar);
        man.update(j, { upperArm: act, back: act * 0.5 });
      },
      markers: () => [
        { n: 1, at: j.handL.clone().add(V(0.05, 0.12, 0.08)) },
        { n: 2, at: j.toeL.clone().add(V(0.08, 0.05, 0.12)) },
        { n: 3, at: j.chest.clone().add(V(0.2, 0.05, 0.12)) },
      ],
    };
  },
});

const seatedDbPress = scene({
  id: 'lento-manubri',
  phases: rep({ up: 1.0, hold: 0.3, down: 2.1 }),
  view: [50, 8, 4.4],
  target: V(0.05, 1.05, 0),
  build({ add, man }) {
    const P = V(0, 0.6, 0);
    seat(add, P, 5, { backLen: 0.85, column: true });
    const d = { L: add(dumbbell(0.065)), R: add(dumbbell(0.065)) };
    let j;
    return {
      pose(k, act) {
        j = torso(P, 5);
        seatedLegs(j, 0.46, 0.2);
        for (const [s, z] of SIDES) {
          const p = j['shoulder' + s].clone().add(V(lerp(0.05, 0.03, k), lerp(0.13, 0.6, k), z * lerp(0.13, 0.04, k)));
          hold(j, s, p, V(0.2, -1, z));
          orient(d[s], Zv).position.copy(j['hand' + s]);
        }
        man.update(j, { upperArm: act, back: act * 0.4 });
      },
      markers: () => [
        { n: 1, at: j.head.clone().add(V(-0.2, 0.05, 0.15)) },
        { n: 2, at: j.handL.clone().add(V(0.05, 0.12, 0.1)) },
        { n: 3, at: j.toeL.clone().add(V(0.08, 0.05, 0.12)) },
      ],
    };
  },
});

/** Sdraiati sulla panca (piana o inclinata): bacino, inclinazione, cosa si spinge. */
function pressScene(id, { incline, dumbbells, act }) {
  return scene({
    id,
    phases: incline || dumbbells ? downUp({ down: 2.0, up: 1.0, bottom: 0.15 }) : downUp({ down: 2.0, up: 1.0, bottom: 0.15 }),
    view: [30, 22, 4.6],
    target: V(-0.1, 0.75, 0),
    build({ add, man }) {
      const lean = incline ? 57 : 90;
      const P = incline ? V(0, 0.6, 0) : V(0.15, 0.58, 0);
      if (incline) {
        seat(add, P, lean, { backLen: 0.9 });
      } else {
        bench(add, -0.9, 0.42, 0.46);
        for (const z of [0.55, -0.55]) {
          add(tube(V(-0.62, 0.04, z), V(-0.62, 1.15, z), 0.035));
          add(tube(V(-0.62, 1.1, z), V(-0.52, 1.1, z), 0.02, PALETTE.steel));
        }
      }
      const props = dumbbells ? { L: add(dumbbell(0.07)), R: add(dumbbell(0.07)) } : { bar: add(barbell({ plates: 1 })) };
      let j;
      return {
        pose(k, a) {
          j = torso(P, lean);
          if (incline) seatedLegs(j, 0.5, 0.2);
          else for (const [s, z] of SIDES) leg(j, s, V(0.66, 0.09, z * 0.25), V(1, 0, z * 0.2), V(0.2, 1, z * 0.25));
          for (const [s, z] of SIDES) {
            const sh = j['shoulder' + s];
            let p;
            if (dumbbells) {
              const top = sh.clone().addScaledVector(j.front, 0.58).add(V(0, 0, -z * 0.06));
              const bottom = sh.clone().addScaledVector(j.front, 0.13).addScaledVector(j.up, -0.04).add(V(0, 0, z * 0.13));
              p = top.lerp(bottom, k);
            } else {
              const top = sh.clone().setZ(z * 0.36).addScaledVector(j.front, 0.6).add(V(0.02, 0, 0));
              const bottom = j.pelvis.clone().addScaledVector(j.up, 0.3).addScaledVector(j.front, 0.18).setZ(z * 0.36);
              p = top.lerp(bottom, k);
            }
            hold(j, s, p, V(0.3, -1, z * 0.8).addScaledVector(j.up, 0.3));
            if (dumbbells) orient(props[s], Zv).position.copy(j['hand' + s]);
          }
          if (!dumbbells) props.bar.position.copy(j.handL).setZ(0);
          man.update(j, act(a));
        },
        markers: () => incline
          ? [
            { n: 1, at: j.chest.clone().add(V(-0.15, -0.1, 0.25)) },
            { n: 2, at: j.handL.clone().add(V(0.05, 0.1, 0.1)) },
            { n: 3, at: j.toeL.clone().add(V(0.08, 0.05, 0.12)) },
          ]
          : dumbbells
            ? [
              { n: 1, at: j.kneeL.clone().add(V(0, 0.1, 0.12)) },
              { n: 2, at: j.chest.clone().add(V(0.08, -0.12, 0.25)) },
              { n: 3, at: j.handL.clone().add(V(0.05, 0.12, 0.08)) },
            ]
            : [
              { n: 1, at: j.head.clone().add(V(0, 0.15, 0.12)) },
              { n: 2, at: j.chest.clone().add(V(0.08, -0.12, 0.25)) },
              { n: 3, at: j.handL.clone().add(V(0.05, 0.12, 0.08)) },
              { n: 4, at: V(-0.55, 1.2, 0.6) },
            ],
      };
    },
  });
}

const bench1 = pressScene('panca-piana', { incline: false, dumbbells: false, act: (a) => ({ back: a, upperArm: a * 0.5 }) });
const bench2 = pressScene('panca-manubri', { incline: false, dumbbells: true, act: (a) => ({ back: a, upperArm: a * 0.4 }) });
const bench3 = pressScene('panca-inclinata-manubri', { incline: true, dumbbells: true, act: (a) => ({ back: a, upperArm: a * 0.5 }) });

const hipThrust = scene({
  id: 'hip-thrust',
  phases: rep({ up: 1.0, hold: 0.5, down: 2.0 }),
  view: [28, 12, 4.2],
  target: V(0.05, 0.45, 0),
  build({ add, man }) {
    const S = V(-0.36, 0.52, 0);
    add(pad(V(-0.52, 0.4, 0), Zv, UP, [1.2, 0.09, 0.36]));
    for (const z of [0.45, -0.45]) add(tube(V(-0.52, 0.03, z), V(-0.52, 0.36, z), 0.035));
    const bb = add(barbell({ plates: 1, pad: true }));
    let j;
    return {
      pose(k, act) {
        const l = lerp(52, 88, k);
        const a = deg(l);
        const up = V(-Math.sin(a), Math.cos(a), 0);
        const P = S.clone().addScaledVector(up, -0.45);
        j = torso(P, l, { headTilt: lerp(40, 70, k) });
        for (const [s, z] of SIDES) leg(j, s, V(0.52, 0.09, z * 0.15), V(1, 0, 0), V(0.3, 1, z * 0.15));
        const bar = P.clone().addScaledVector(j.front, 0.17);
        for (const [s, z] of SIDES) hold(j, s, bar.clone().add(V(0, 0, z * 0.42)), V(0, 0.3, z));
        bb.position.copy(bar);
        man.update(j, { glutes: act, thigh: act * 0.4 });
      },
      markers: () => [
        { n: 1, at: S.clone().add(V(-0.1, 0.1, 0.3)) },
        { n: 2, at: j.pelvis.clone().add(V(0.1, 0.25, 0.25)) },
        { n: 3, at: j.toeL.clone().add(V(0.08, 0.05, 0.12)) },
      ],
    };
  },
});

const goblet = scene({
  id: 'goblet-squat',
  phases: downUp(),
  view: [38, 10, 4.4],
  target: V(0, 0.85, 0),
  build({ add, man }) {
    const d = add(dumbbell(0.075));
    let j;
    return {
      pose(k, act) {
        const l = lerp(-4, -28, k);
        const a = deg(l);
        const up = V(-Math.sin(a), Math.cos(a), 0);
        j = torso(V(0.03 - 0.45 * up.x, lerp(0.93, 0.47, k), 0), l, { headTilt: lerp(0, -15, k) });
        standLegs(j, 0, 0.2, 22, V(1, 0.1, 0));
        const db = j.chest.clone().addScaledVector(j.front, 0.17).addScaledVector(j.up, -0.12);
        for (const [s, z] of SIDES) hold(j, s, db.clone().addScaledVector(j.up, 0.1).add(V(0, 0, z * 0.05)), V(0.2, -1, z * 0.4));
        orient(d, j.up).position.copy(db);
        man.update(j, { thigh: act, glutes: act * 0.8 });
      },
      markers: () => [
        { n: 1, at: j.handL.clone().add(V(0.12, 0.05, 0.12)) },
        { n: 2, at: j.toeL.clone().add(V(0.08, 0.05, 0.12)) },
      ],
    };
  },
});

const lunge = scene({
  id: 'affondi',
  phases: [
    { name: 'in piedi', dur: 0.4, from: 0, to: 0, active: 0.2 },
    { name: 'passo', dur: 0.6, from: 0, to: 1, active: 0.4 },
    { name: 'giu', dur: 1.3, from: 1, to: 2, active: 0.7 },
    { name: 'in basso', dur: 0.2, from: 2, to: 2, active: 0.8 },
    { name: 'spingi', dur: 0.9, from: 2, to: 1, active: 1 },
    { name: 'indietro', dur: 0.6, from: 1, to: 0, active: 0.4 },
  ],
  view: [30, 8, 4.6],
  target: V(0.25, 0.85, 0),
  build({ add, man }) {
    const d = { L: add(dumbbell(0.065)), R: add(dumbbell(0.065)) };
    let j;
    return {
      pose(v, act) {
        const s1 = Math.min(1, v), s2 = Math.max(0, v - 1);
        j = torso(V(0.3 * s1 - 0.02, 0.93 - 0.05 * s1 - 0.35 * s2, 0), 0, { headTilt: 0 });
        const lift = v < 1 ? 0.1 * Math.sin(Math.PI * s1) : 0;
        leg(j, 'L', V(0.64 * s1, 0.09 + lift, 0.11), V(1, 0, 0.05), V(1, 0.2, 0.1));
        const b = deg(48 * s2);
        const f = V(Math.cos(b), -Math.sin(b), 0);
        const pu = V(Math.sin(b), Math.cos(b), 0);
        const ankle = V(0.13, 0.035, -0.11).addScaledVector(f, -0.15).addScaledVector(pu, 0.06);
        leg(j, 'R', ankle, f, V(1, -0.4, -0.1), pu.clone().multiplyScalar(-1));
        for (const [s, z] of SIDES) {
          const w = j['shoulder' + s].clone().add(V(0.02, -0.55, z * 0.05));
          arm(j, s, w, w.clone().add(V(0, -0.1, 0)), V(-1, 0, 0));
          orient(d[s], X).position.copy(j['hand' + s]);
        }
        man.update(j, { thigh: act, glutes: act * 0.8 });
      },
      markers: () => [
        { n: 1, at: j.handL.clone().add(V(0.08, 0, 0.14)) },
        { n: 2, at: j.chest.clone().add(V(0.15, 0.05, 0.22)) },
      ],
    };
  },
});

const dbRow = scene({
  id: 'rematore-manubrio',
  phases: rep({ up: 0.9, hold: 0.4, down: 2.0 }),
  view: [142, 14, 4.4],
  target: V(0.05, 0.75, 0),
  build({ add, man }) {
    bench(add, -0.7, 0.62, 0.46, 0.1, 0.32);
    const d = add(dumbbell(0.07));
    let j;
    return {
      pose(k, act) {
        j = torso(V(-0.12, 0.94, 0), -82, { headTilt: -5 });
        leg(j, 'L', V(-0.55, 0.53, 0.1), V(-1, -0.25, 0), V(0.3, -1, 0), V(0, -1, 0));
        leg(j, 'R', V(-0.3, 0.09, -0.32), V(1, 0, -0.2), V(1, 0.2, -0.3));
        const wl = V(j.shoulderL.x + 0.02, 0.53, 0.16);
        arm(j, 'L', wl, wl.clone().add(V(0.1, -0.02, 0)), V(-1, 0, 0.2));
        const shR = j.shoulderR;
        const hang = shR.clone().add(V(0.02, -0.56, -0.03));
        const top = shR.clone().add(V(-0.26, -0.17, -0.06));
        const w = hang.lerp(top, k);
        arm(j, 'R', w, w.clone().add(V(0, -0.1, 0)), V(-0.4, 1, -0.3));
        orient(d, X).position.copy(j.handR);
        man.update(j, { back: act, upperArm: act * 0.5 });
      },
      markers: () => [
        { n: 1, at: j.handL.clone().add(V(0.12, 0.05, 0)) },
        { n: 2, at: j.chest.clone().add(V(0, 0.16, -0.15)) },
        { n: 3, at: j.handR.clone().add(V(0.1, -0.05, -0.12)) },
      ],
    };
  },
});

export default [squat, smithSquat, deadlift, rdl, bentRow, curlBar, curlDb, lateral, ohp, seatedDbPress,
  bench1, bench2, bench3, hipThrust, goblet, lunge, dbRow];
void BODY; void box;
