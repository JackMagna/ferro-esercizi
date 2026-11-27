// Lat machine (presa larga), macchina generica. Codice MIT, animazione CC BY-SA 4.0.
import { V, PALETTE, timeline, mannequin, torso, leg, arm, pad, tube, box, disc, weightStack, setTube, lerp } from '../lib/engine.js';
import * as THREE from 'three';

const tl = timeline([
  { name: 'braccia distese', dur: 0.5, from: 0, to: 0, active: 0.2 },
  { name: 'tira', dur: 1.0, from: 0, to: 1, active: 1 },
  { name: 'tieni', dur: 0.45, from: 1, to: 1, active: 1 },
  { name: 'torna su', dur: 2.3, from: 1, to: 0, active: 0.55 },
]);
const GRIP = 0.42; // metà larghezza della presa
const LEAN = [10, 18]; // busto indietro: in alto, in basso
const STACK_X = 0.72;

export default {
  id: 'lat-machine',
  duration: tl.total,
  camera: V(-1.5, 1.7, 4.6),
  target: V(0.2, 1.18, 0),
  build({ scene }) {
    const pelvis = V(0, 0.56, 0);
    const g = new THREE.Group();
    // Seduta e colonna.
    g.add(pad(V(0.04, 0.44, 0), V(1, 0, 0), V(0, 1, 0), [0.42, 0.09, 0.42]));
    g.add(tube(V(0.05, 0.05, 0), V(0.05, 0.4, 0), 0.045));
    g.add(box(V(0.38, 0.04, 0), [1.0, 0.06, 0.12], PALETTE.frameDark));
    // Rulli sopra le cosce.
    g.add(tube(V(0.33, 0.72, -0.27), V(0.33, 0.72, 0.27), 0.055, PALETTE.pad));
    g.add(tube(V(0.33, 0.72, 0), V(0.55, 0.72, 0), 0.025));
    // Torre con pacco pesi davanti.
    for (const z of [0.2, -0.2]) g.add(tube(V(STACK_X, 0.04, z), V(STACK_X, 2.36, z), 0.035));
    g.add(box(V(STACK_X, 0.04, 0), [0.4, 0.06, 0.6], PALETTE.frameDark));
    g.add(tube(V(STACK_X, 2.36, 0), V(-0.02, 2.36, 0), 0.04));
    g.add(tube(V(0.55, 0.72, 0), V(STACK_X, 0.72, 0), 0.03));
    const pTop = V(0.0, 2.3, 0);
    const pFront = V(STACK_X, 2.3, 0);
    g.add(disc(pTop, V(0, 0, 1), 0.06, 0.03, PALETTE.steel));
    g.add(disc(pFront, V(0, 0, 1), 0.06, 0.03, PALETTE.steel));
    scene.add(g);
    const stack = weightStack(V(STACK_X, 0.08, 0), 12);
    scene.add(stack.group);
    const rod = tube(V(STACK_X, 0.6, 0), V(STACK_X, 2.24, 0), 0.008, PALETTE.steel);
    scene.add(rod);
    const cableA = tube(V(), V(0, 1, 0), 0.007, 0x111111);
    const cableB = tube(V(), V(0, 1, 0), 0.007, 0x111111);
    scene.add(cableA, cableB);

    // Barra: tubo dritto con estremità piegate.
    const bar = new THREE.Group();
    bar.add(tube(V(0, 0, -0.38), V(0, 0, 0.38), 0.016, PALETTE.steel));
    for (const z of [1, -1]) bar.add(tube(V(0, 0, z * 0.38), V(0, -0.1, z * 0.6), 0.016, PALETTE.steel));
    scene.add(bar);

    const man = mannequin();
    scene.add(man.group);

    let top = null, bottom = null, joints = null;
    const barFor = (k) => {
      const j = torso(pelvis, lerp(LEAN[0], LEAN[1], k), { headTilt: lerp(-4, 6, k), shrug: lerp(0.03, -0.01, k) });
      if (k === 0) {
        const sh = j.shoulderL;
        return { j, p: V(sh.x + 0.06, sh.y + 0.5 + 0.06, 0) };
      }
      return { j, p: j.chest.clone().addScaledVector(j.front, 0.15).addScaledVector(j.up, -0.06).add(V(0, 0.04, 0)) };
    };
    top = barFor(0).p;
    bottom = barFor(1).p;

    function pose(k, active) {
      const { j } = barFor(k);
      const p = top.clone().lerp(bottom, k);
      bar.position.copy(p);
      for (const [s, z] of [['L', 1], ['R', -1]]) {
        const grip = p.clone().add(V(0, -0.075 - 0.03 * k, z * (GRIP + 0.02 * k)));
        const wrist = p.clone().add(V(-0.02, -0.07, z * GRIP));
        arm(j, s, wrist, grip.clone().add(V(0, 0.1, 0)), V(-0.5, -1, z * 1.2));
        const ankle = V(0.48, 0.1, z * 0.15);
        leg(j, s, ankle, V(1, 0, 0), V(1, 0.4, 0));
      }
      const travel = top.y - p.y;
      stack.move(travel, 5);
      setTube(cableA, p, pTop);
      setTube(cableB, pFront, V(STACK_X, stack.top + 0.08 + travel, 0));
      rod.position.y = 0.6 + (2.24 - 0.6) / 2 + travel * 0;
      man.update(j, { back: active, upperArm: active * 0.55, forearm: active * 0.3 });
      joints = j;
    }

    return {
      update(t) { const s = tl.at(t); pose(s.v, s.active); return s; },
      markers() {
        pose(0, 0.2);
        return [
          { n: 1, at: V(0.33, 0.8, 0.3) },
          { n: 2, at: top.clone().add(V(0, 0.08, GRIP + 0.06)) },
          { n: 3, at: joints.chest.clone().add(V(0.18, -0.05, 0.22)) },
        ];
      },
    };
  },
};
