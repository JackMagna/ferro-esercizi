// Leg extension, macchina generica. Codice MIT, animazione CC BY-SA 4.0.
import { V, PALETTE, timeline, mannequin, torso, arm, pad, tube, box, disc, weightStack, deg, lerp, BODY } from '../lib/engine.js';
import * as THREE from 'three';

// k: 0 = gambe piegate (stinco verticale), 1 = quasi distese (non bloccate).
const tl = timeline([
  { name: 'partenza', dur: 0.4, from: 0, to: 0, active: 0.2 },
  { name: 'distendi', dur: 1.0, from: 0, to: 1, active: 1 },
  { name: 'tieni', dur: 0.6, from: 1, to: 1, active: 1 },
  { name: 'scendi', dur: 2.4, from: 1, to: 0, active: 0.6 },
]);
const ANG = [-4, 78]; // stinco: gradi in avanti dalla verticale
const PAD_AT = 0.385; // cuscinetto appena sopra la caviglia

export default {
  id: 'leg-extension',
  duration: tl.total,
  camera: V(2.3, 1.45, 3.7),
  target: V(0.2, 0.62, 0),
  build({ scene }) {
    const pelvis = V(0, 0.62, 0);
    const knee0 = V(BODY.thigh - 0.01, 0.6, 0);
    const g = new THREE.Group();
    // Seduta, schienale, telaio.
    g.add(pad(V(0.13, 0.48, 0), V(1, 0, 0), V(0, 1, 0), [0.5, 0.1, 0.44]));
    const back = torso(pelvis, 8);
    g.add(pad(pelvis.clone().addScaledVector(back.up, 0.33).addScaledVector(back.front, -0.19), back.up, back.front, [0.62, 0.1, 0.42]));
    g.add(box(V(0.05, 0.04, 0), [1.1, 0.06, 0.5], PALETTE.frameDark));
    g.add(tube(V(0.1, 0.06, 0), V(0.1, 0.42, 0), 0.05));
    g.add(tube(V(-0.25, 0.06, 0), V(-0.25, 0.9, 0), 0.04));
    // Maniglie.
    for (const z of [0.3, -0.3]) {
      g.add(tube(V(-0.05, 0.5, z), V(0.2, 0.5, z), 0.018, PALETTE.steel));
      g.add(tube(V(0.12, 0.08, z), V(0.12, 0.5, z), 0.022));
    }
    // Perno con il bollino colorato sul lato.
    g.add(tube(V(knee0.x, 0.06, 0.32), V(knee0.x, knee0.y, 0.32), 0.035));
    g.add(disc(knee0.clone().setZ(0.34), V(0, 0, 1), 0.05, 0.03, PALETTE.marker));
    // Pacco pesi dietro lo schienale.
    const stack = weightStack(V(-0.62, 0.08, 0), 12, [0.24, 0.045, 0.16]);
    for (const z of [0.12, -0.12]) g.add(tube(V(-0.62, 0.04, z), V(-0.62, 1.3, z), 0.025));
    g.add(box(V(-0.62, 1.32, 0), [0.3, 0.05, 0.3]));
    scene.add(g, stack.group);

    // Leva: ruota attorno al perno.
    const lever = new THREE.Group();
    lever.position.copy(knee0);
    lever.add(tube(V(0, 0, 0.32), V(0, -PAD_AT, 0.32), 0.028));
    lever.add(tube(V(0.09, -PAD_AT, -0.24), V(0.09, -PAD_AT, 0.32), 0.022, PALETTE.steel));
    lever.add(tube(V(0.09, -PAD_AT, -0.22), V(0.09, -PAD_AT, 0.22), 0.055, PALETTE.pad));
    scene.add(lever);

    const man = mannequin();
    scene.add(man.group);
    let joints = null;

    function pose(k, active) {
      const a = deg(lerp(ANG[0], ANG[1], k));
      const shin = V(Math.sin(a), -Math.cos(a), 0);
      const fwd = V(Math.cos(a), Math.sin(a), 0);
      const j = torso(pelvis, 8);
      for (const [s, z] of [['L', 1], ['R', -1]]) {
        const knee = knee0.clone().setZ(z * 0.1);
        j['knee' + s] = knee;
        const ankle = knee.clone().addScaledVector(shin, BODY.shin);
        j['ankle' + s] = ankle;
        j['heel' + s] = ankle.clone().addScaledVector(fwd, -0.05).addScaledVector(shin, 0.05);
        j['toe' + s] = ankle.clone().addScaledVector(fwd, 0.15).addScaledVector(shin, 0.07);
        const wrist = V(0.08, 0.53, z * 0.3);
        arm(j, s, wrist, wrist.clone().add(V(0.1, 0, 0)), V(-0.2, -1, z * 0.6));
      }
      lever.rotation.z = a;
      stack.move(0.32 * k, 5);
      man.update(j, { thigh: active, shin: 0 });
      joints = j;
    }

    return {
      update(t) { const s = tl.at(t); pose(s.v, s.active); return s; },
      markers() {
        pose(0, 0.2);
        return [
          { n: 1, at: knee0.clone().add(V(-0.02, 0.17, 0.36)) },
          { n: 2, at: joints.ankleL.clone().add(V(0.17, 0.02, 0.2)) },
          { n: 4, at: V(0.2, 0.57, 0.34) },
        ];
      },
    };
  },
};
