// Esercizi ai cavi. Codice MIT, animazioni CC BY-SA 4.0.
import {
  V, PALETTE, torso, leg, pad, tube, box, deg, lerp,
  rep, scene, tower, cable, pulley, standLegs, forearm, hold, SIDES, BODY,
} from '../lib/kit.js';

const UP = V(0, 1, 0);

const seatedRow = scene({
  id: 'pulley',
  phases: rep({ up: 1.0, hold: 0.45, down: 2.2 }),
  view: [32, 14, 4.6],
  target: V(0.4, 0.6, 0),
  build({ add, man }) {
    const P = V(0, 0.44, 0);
    add(pad(V(-0.1, 0.27, 0), V(1, 0, 0), UP, [0.9, 0.09, 0.34]));
    add(box(V(0.25, 0.1, 0), [1.6, 0.12, 0.2], PALETTE.frameDark));
    add(pad(V(0.82, 0.3, 0), V(0.25, 1, 0), V(-1, 0.25, 0), [0.34, 0.05, 0.46], 0x3a3f45));
    const tw = tower(add, 1.25, 0, 1.9);
    const pl = V(1.02, 0.36, 0);
    pulley(add, pl);
    const c1 = cable(add), c2 = cable(add);
    const handle = add(tube(V(0, 0, -0.07), V(0, 0, 0.07), 0.018, PALETTE.steel));
    let j;
    return {
      pose(k, act) {
        j = torso(P, lerp(-6, 6, k));
        for (const [s, z] of SIDES) {
          leg(j, s, V(0.74, 0.33, z * 0.13), V(0.25, 1, 0), V(0.2, 1, z * 0.2), V(1, -0.25, 0));
        }
        const a = j.shoulderL.clone().setZ(0).add(V(0.56, -0.16, 0));
        const b = P.clone().add(V(0.24, 0.24, 0));
        const p = a.lerp(b, k);
        for (const [s, z] of SIDES) hold(j, s, p.clone().setZ(z * 0.06), V(-1, -0.3, z * 0.6));
        handle.position.copy(p);
        c1(p, pl);
        c2(pl.clone().add(V(0.1, 0, 0)), V(1.25, tw.top + 0.1 + 0.3 * k, 0));
        tw.move(0.3 * k);
        man.update(j, { back: act, upperArm: act * 0.45 });
      },
      markers: () => [
        { n: 1, at: j.toeL.clone().add(V(0.1, 0.05, 0.15)) },
        { n: 2, at: j.chest.clone().add(V(0.05, 0.15, 0.25)) },
        { n: 3, at: j.handL.clone().add(V(0.05, 0.12, 0.1)) },
      ],
    };
  },
});

const pushdown = scene({
  id: 'pushdown',
  phases: rep({ up: 0.9, hold: 0.4, down: 2.0 }),
  view: [40, 8, 4.6],
  target: V(0.2, 1.1, 0),
  build({ add, man }) {
    const tw = tower(add, 0.62, 0, 2.2);
    const pl = V(0.45, 2.08, 0);
    pulley(add, pl);
    add(tube(V(0.62, 2.12, 0), V(0.45, 2.12, 0), 0.03));
    const c = cable(add);
    const bar = add(tube(V(0, 0, -0.24), V(0, 0, 0.24), 0.016, PALETTE.steel));
    let j;
    return {
      pose(k, act) {
        j = torso(V(-0.04, 0.93, 0), -8);
        standLegs(j, 0, 0.12);
        for (const [s, z] of SIDES) {
          const el = j['shoulder' + s].clone().add(V(0.05, -0.295, z * 0.01));
          forearm(j, s, el, lerp(96, 12, k));
        }
        const p = j.handL.clone().setZ(0);
        bar.position.copy(p);
        c(p, pl);
        tw.move(0.3 * k);
        man.update(j, { upperArm: act });
      },
      markers: () => [
        { n: 1, at: pl.clone().add(V(-0.1, 0.05, 0.15)) },
        { n: 2, at: j.toeL.clone().add(V(0.05, 0.05, 0.15)) },
        { n: 3, at: j.elbowL.clone().add(V(-0.05, 0, 0.14)) },
      ],
    };
  },
});

const facePull = scene({
  id: 'face-pull',
  phases: rep({ up: 1.0, hold: 0.45, down: 2.0 }),
  view: [35, 12, 4.7],
  target: V(0.35, 1.2, 0),
  build({ add, man }) {
    const tw = tower(add, 1.05, 0, 2.2);
    const pl = V(0.9, 1.62, 0);
    pulley(add, pl);
    add(tube(V(1.05, 1.62, 0), V(0.9, 1.62, 0), 0.03));
    const cl = cable(add), cr = cable(add), cm = cable(add);
    let j;
    return {
      pose(k, act) {
        j = torso(V(-0.02, 0.93, 0), 6);
        standLegs(j, 0, 0.14);
        for (const [s, z] of SIDES) {
          const sh = j['shoulder' + s];
          const p = sh.clone().add(V(lerp(0.52, 0.06, k), lerp(0.06, 0.16, k), z * lerp(-0.13, 0.13, k)));
          hold(j, s, p, V(-0.2, lerp(-0.3, 0.6, k), z));
        }
        const knot = j.handL.clone().lerp(j.handR, 0.5).add(V(0.16, 0, 0));
        cl(j.handL, knot);
        cr(j.handR, knot);
        cm(knot, pl);
        tw.move(0.25 * k);
        man.update(j, { back: act, upperArm: act * 0.6 });
      },
      markers: () => [
        { n: 1, at: pl.clone().add(V(0, 0.12, 0.15)) },
        { n: 2, at: j.handL.clone().add(V(0, 0.12, 0.08)) },
        { n: 3, at: j.toeL.clone().add(V(0.05, 0.05, 0.15)) },
      ],
    };
  },
});

const crossover = scene({
  id: 'croci-cavi',
  phases: rep({ up: 1.0, hold: 0.45, down: 2.2 }),
  view: [78, 14, 5.0],
  target: V(0.1, 1.15, 0),
  build({ add, man }) {
    const towers = {};
    const pls = {};
    for (const [s, z] of SIDES) {
      towers[s] = tower(add, -0.2, z * 1.05, 2.2);
      pls[s] = V(-0.1, 1.95, z * 0.92);
      pulley(add, pls[s], V(1, 0, 0));
    }
    const cs = { L: cable(add), R: cable(add) };
    let j;
    return {
      pose(k, act) {
        j = torso(V(0.02, 0.9, 0), -15);
        leg(j, 'L', V(0.28, 0.09, 0.12), V(1, 0, 0.1), V(1, 0.2, 0.1));
        leg(j, 'R', V(-0.3, 0.12, -0.12), V(1, -0.4, -0.1), V(1, 0.1, -0.1));
        const th = deg(lerp(12, 100, k));
        for (const [s, z] of SIDES) {
          const p = j['shoulder' + s].clone().add(V(0.55 * Math.sin(th), lerp(0.06, -0.2, k), z * 0.55 * Math.cos(th)));
          hold(j, s, p, V(-0.6, 0.3, z * 0.6));
          cs[s](j['hand' + s], pls[s]);
          towers[s].move(0.2 * k);
        }
        man.update(j, { back: act, upperArm: act * 0.3 });
      },
      markers: () => [
        { n: 1, at: pls.L.clone().add(V(0.1, 0.1, -0.1)) },
        { n: 2, at: j.toeL.clone().add(V(0.08, 0.05, 0.1)) },
        { n: 3, at: j.chest.clone().add(V(0.2, 0.1, 0.0)) },
      ],
    };
  },
});

export default [seatedRow, pushdown, facePull, crossover];
void BODY; void box;
