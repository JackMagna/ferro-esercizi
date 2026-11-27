// Tutte le scene, per id (uguale a quello della scheda in guides/it). Codice MIT.
import legPress from './leg-press.js';
import legPressCalf from './leg-press-polpacci.js';
import latMachine from './lat-machine.js';
import legExtension from './leg-extension.js';
import machines from './machines.js';
import cables from './cables.js';
import free from './free.js';
import body from './body.js';

const all = [legPress, legPressCalf, latMachine, legExtension, ...machines, ...cables, ...free, ...body];
export default Object.fromEntries(all.map((s) => [s.id, s]));
