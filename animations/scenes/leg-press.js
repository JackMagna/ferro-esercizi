// Leg press a 45 gradi, macchina generica. Codice MIT, animazione CC BY-SA 4.0.
import {
  V, PALETTE, BODY, timeline, mannequin, torso, leg, arm, pad, tube, box, disc, deg,
} from '../lib/engine.js';
import * as THREE from 'three';

const rail = deg(45);
const r = V(Math.cos(rail), Math.sin(rail), 0); // direzione del carrello
const u = V(-Math.sin(rail), Math.cos(rail), 0); // in alto sulla pedana
const BACK = 60; // schienale: 60 gradi dalla verticale (30 dall'orizzontale)

// d = distanza anca-caviglia: 0,60 in basso (ginocchia a circa 90 gradi), 0,84 in alto (non bloccate).
const tl = timeline([
  { name: 'basso', dur: 0.4, from: 0, to: 0, active: 0.35 },
  { name: 'spingi', dur: 1.0, from: 0, to: 1, active: 1 },
  { name: 'alto', dur: 0.35, from: 1, to: 1, active: 0.45 },
  { name: 'scendi', dur: 2.5, from: 1, to: 0, active: 0.7 },
]);
const D0 = 0.6, D1 = 0.84, SOLE = 0.085;

export default {
  id: 'leg-press',
  duration: tl.total,
  camera: V(0.25, 1.5, 4.6),
  target: V(0.28, 0.7, 0),
  build({ scene }) {
    const pelvis = V(0, 0.55, 0);
    const base = torso(pelvis, BACK, { headTilt: -25, shoulderAt: 0.44 });
    const n = base.front; // verso il davanti del busto
    const g = new THREE.Group();

    // Telaio a terra e montanti.
    g.add(box(V(0.55, 0.05, 0), [2.6, 0.08, 0.5], PALETTE.frameDark));
    // Schienale e seduta.
    const td = base.up;
    g.add(pad(pelvis.clone().addScaledVector(td, 0.34).addScaledVector(n, -0.18), td, n, [0.78, 0.1, 0.5]));
    const sd = V(Math.cos(deg(12)), Math.sin(deg(12)), 0);
    const sn = V(-sd.y, sd.x, 0);
    g.add(pad(pelvis.clone().addScaledVector(sd, 0.06).addScaledVector(sn, -0.17), sd, sn, [0.38, 0.1, 0.48]));
    g.add(tube(V(-0.05, 0.08, 0), pelvis.clone().addScaledVector(sn, -0.2), 0.05, PALETTE.frame));
    g.add(tube(V(-0.45, 0.08, 0), pelvis.clone().addScaledVector(td, 0.5).addScaledVector(n, -0.2), 0.04, PALETTE.frame));
    // Maniglie accanto al bacino.
    for (const z of [0.33, -0.33]) {
      g.add(tube(V(0.02, 0.62, z), V(0.24, 0.62, z), 0.018, PALETTE.steel));
      g.add(tube(V(0.12, 0.1, z), V(0.12, 0.62, z), 0.025, PALETTE.frame));
    }
    // Binari a 45 gradi.
    const hip = base.hipL.clone().setZ(0);
    const railStart = hip.clone().addScaledVector(r, 0.25).addScaledVector(u, -0.42);
    const railEnd = hip.clone().addScaledVector(r, 1.3).addScaledVector(u, -0.42);
    for (const z of [0.22, -0.22]) {
      g.add(tube(railStart.clone().setZ(z), railEnd.clone().setZ(z), 0.035, PALETTE.frame));
      g.add(tube(V(railEnd.x, 0.08, z), railEnd.clone().setZ(z), 0.045, PALETTE.frame));
      g.add(tube(V(railStart.x + 0.05, 0.08, z), railStart.clone().setZ(z).addScaledVector(r, 0.05), 0.04, PALETTE.frame));
    }
    // Fermi di sicurezza.
    for (const z of [0.3, -0.3]) {
      const s = hip.clone().addScaledVector(r, D0 + SOLE - 0.05).addScaledVector(u, -0.42).setZ(z);
      g.add(box(s, [0.06, 0.06, 0.06], PALETTE.marker));
    }
    scene.add(g);

    // Carrello con pedana e piastre.
    const sled = new THREE.Group();
    // coordinate locali: x lungo il binario (r), y in alto sulla pedana (u)
    sled.add(pad(V(0.03, 0.07, 0), V(0, 1, 0), V(-1, 0, 0), [0.62, 0.05, 0.78], 0x2a2d31));
    sled.add(box(V(0.2, -0.2, 0), [0.34, 0.12, 0.56], PALETTE.frame));
    sled.add(box(V(0.1, -0.05, 0), [0.1, 0.4, 0.5], PALETTE.frame));
    for (const z of [1, -1]) {
      sled.add(tube(V(0.32, -0.36, z * 0.28), V(0.32, -0.36, z * 0.56), 0.03, PALETTE.steel));
      sled.add(disc(V(0.32, -0.36, z * 0.38), V(0, 0, 1), 0.17, 0.04));
      sled.add(disc(V(0.32, -0.36, z * 0.43), V(0, 0, 1), 0.17, 0.04));
      sled.add(disc(V(0.32, -0.36, z * 0.48), V(0, 0, 1), 0.12, 0.03));
    }
    // Il gruppo del carrello ha l'asse x lungo r e y lungo u.
    sled.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, V(0, 0, 1)));
    scene.add(sled);

    const man = mannequin();
    scene.add(man.group);

    let joints = null;
    function pose(d, active) {
      const j = torso(pelvis, BACK, { headTilt: -25, shoulderAt: 0.44 });
      for (const [s, z] of [['L', 1], ['R', -1]]) {
        const hipS = j['hip' + s];
        const ankle = hipS.clone().addScaledVector(r, d).add(V(0, 0, z * 0.05)).addScaledVector(u, 0.02);
        leg(j, s, ankle, u, u.clone().add(V(0, 0, z * 0.25)), r);
        const wrist = V(0.1, 0.64, z * 0.33);
        arm(j, s, wrist, wrist.clone().add(V(0.1, 0, 0)), V(-0.3, -1, z * 0.8));
      }
      // carrello: la suola è a SOLE oltre la caviglia lungo r
      const sole = hip.clone().addScaledVector(r, d + SOLE);
      sled.position.copy(sole);
      man.update(j, { thigh: active, glutes: active * 0.8 });
      joints = j;
    }

    return {
      update(t) {
        const s = tl.at(t);
        pose(D0 + (D1 - D0) * s.v, s.active);
        return s;
      },
      /** Numeri dei passi di «setup» sul disegno della posizione iniziale. */
      markers() {
        pose(D0, 0.35);
        return [
          { n: 1, at: joints.kneeL.clone().add(V(0, 0.06, 0.1)) },
          { n: 2, at: joints.toeL.clone().add(V(0.05, 0.06, 0.12)) },
          { n: 3, at: joints.pelvis.clone().add(V(-0.12, -0.12, 0.26)) },
          { n: 4, at: hip.clone().addScaledVector(r, D0 + SOLE - 0.05).addScaledVector(u, -0.42).setZ(0.33) },
        ];
      },
    };
  },
};

void BODY;
