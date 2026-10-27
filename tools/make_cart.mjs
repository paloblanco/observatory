// Builds observatory.b3d.json from scratch: tiles, the 64x64x64 map, Lumi's vox models,
// sounds and the song, with the game code from tools/game.js.
//   node tools/make_cart.mjs
// This was the starting point. Once you edit the cart in the blocky3D IDE, the saved
// .b3d.json is the real source; running this again would overwrite those edits.
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('./', import.meta.url);
const root = new URL('../', import.meta.url);

// ------------------------------------------------------------------ helpers
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const R = rng(2026);
const pick = (a) => a[Math.floor(R() * a.length)];
const face = (fn) => { const px = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) px.push(fn(r, c)); return px; };
const tile = (top, side = top, bottom = side) => ({ top: face(top), side: face(side), bottom: face(bottom) });
const b64 = (bytes) => Buffer.from(bytes).toString('base64');

// ------------------------------------------------------------------ tiles (palette indices)
// 0 black 1 navy 2 plum 3 dk green 4 brown 5 dk grey 6 lt grey 7 white 8 red 9 orange 10 yellow
// 11 green 12 sky blue 13 lavender 14 pink 15 peach 16-31 the extra PICO-8 colors
const T = {};
const tiles = [null];
function add(name, t) { T[name] = tiles.length; tiles.push(t); }

const dirt = () => pick([4, 4, 4, 20, 20, 22]);
add('grass', tile(() => pick([3, 11, 11, 27, 27, 27]), (r) => (r < 2 || (r === 2 && R() < 0.5) ? pick([27, 3]) : dirt()), dirt));
add('dirt', tile(dirt));
add('rock', tile(() => pick([5, 5, 21, 21, 13, 17])));
add('path', tile((r, c) => ((r % 4 === 3) || ((c + (Math.floor(r / 4) % 2) * 4) % 8 === 7) ? 13 : pick([6, 6, 6, 7]))));
add('marble', tile((r, c) => ((r + c * 2) % 9 === 0 ? 6 : 7), (r, c) => (r === 0 || r === 7 ? 6 : (r + c) % 7 === 0 ? 6 : 7)));
const brick = (r, c) => (r % 4 === 3 || (c + (Math.floor(r / 4) % 2) * 4) % 8 === 7 ? 1 : pick([13, 13, 13, 29]));
add('brick', tile(brick, brick, () => 1));
add('planks', tile((r, c) => (r % 3 === 2 ? 20 : c === (r < 3 ? 2 : 6) ? 20 : pick([4, 4, 9]))));
add('water', tile((r, c) => ((r * 3 + c * 5) % 7 === 0 ? 7 : pick([12, 12, 28]))));
add('gold', tile((r, c) => ((r + c) % 5 === 0 ? 7 : pick([10, 10, 9, 23]))));
add('roof', tile((r, c) => (r % 2 === 1 ? 24 : (c + r) % 4 === 0 ? 2 : 8)));
add('leaves', tile(() => pick([11, 27, 27, 3, 26])));
add('trunk', tile((r, c) => ((r === 0 || r === 7 || c === 0 || c === 7) ? 4 : (Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5)) | 0) % 2 ? 9 : 4), (r, c) => (c % 3 === 0 ? 20 : 4)));
add('lamp', tile((r, c) => (r === 0 || r === 7 || c === 0 || c === 7 ? 9 : 10), (r, c) => (c === 0 || c === 7 || r === 7 ? 17 : r < 3 ? 7 : 10)));
add('brass', tile((r, c) => (c === 0 || r === 0 ? 10 : pick([9, 9, 25, 4]))));
add('books', tile((r, c) => (r % 3 === 2 ? 20 : c === (r < 3 ? 2 : 6) ? 20 : 4), (r, c) => (r === 0 || r === 4 ? 20 : [8, 12, 11, 10, 14, 13, 9, 28][c])));
const star = (r, c) => {
  const s = [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 1, 0, 0, 1, 0, 0], [0, 1, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0]];
  return s[r][c] ? 10 : (r + c) % 2 ? 28 : 1;
};
add('startile', tile(star, (r) => (r === 0 ? 10 : r < 4 ? 28 : 1), () => 1));
add('metal', tile((r, c) => (c === 0 || c === 7 ? 0 : pick([5, 5, 21])), (r, c) => (c === 0 || c === 7 ? 0 : pick([5, 5, 21]))));
add('glass', tile((r, c) => (r === 0 || c === 0 ? 7 : r === c ? 7 : 12), (r, c) => (r === 0 || r === 7 || c === 0 || c === 7 ? 17 : r === c || r === c + 1 ? 7 : 12)));
add('flowers', tile((r, c) => ((r * 5 + c * 3) % 11 === 0 ? pick([14, 8, 10, 7]) : pick([3, 11, 27, 27])), (r) => (r < 2 ? 27 : 4), dirt));
add('moon', tile((r, c) => ((r - 2) ** 2 + (c - 5) ** 2 < 3 || (r - 6) ** 2 + (c - 2) ** 2 < 2 ? 22 : pick([7, 15, 15, 6])), () => pick([15, 6, 22, 15])));

// ------------------------------------------------------------------ the map, 64 x 64 x 64
const W = 64, H = 64, D = 64;
const map = new Uint8Array(W * H * D);
const set = (x, y, z, t) => { if (x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D) map[x + W * (y + H * z)] = t; };
const get = (x, y, z) => (x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D ? map[x + W * (y + H * z)] : 0);
const TOP = 10;                       // the island's top layer; you walk at y = 11
const CX = 31.5, CZ = 35.5;           // the middle of the island (and the Star Well)
const rad = (x, z, cx = CX, cz = CZ) => Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
const noise2 = (x, z) => Math.sin(x * 0.7 + z * 0.3) + Math.sin(z * 0.9 - x * 0.4) * 0.7;

// a floating island: grass on top, dirt under it, a rocky cone tapering down
function island(cx, cz, r, top, depth) {
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz), edge = r + noise2(x, z) * 0.6;
    if (d > edge) continue;
    const under = Math.max(1, Math.floor((edge - d) / edge * depth + noise2(z, x) * 1.2));
    for (let y = top - under; y < top; y++) set(x, y, z, y >= top - 2 ? T.dirt : T.rock);
    set(x, top, z, T.grass);
  }
}

island(CX, CZ, 25, TOP, 10);          // the observatory island
island(31.5, 4.5, 4.2, TOP, 5);       // the landing islet to the south, where Lumi starts

// paths: a ring, four spokes, and the south spoke runs on over the bridge
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const r = rad(x, z);
  const ring = r >= 12 && r < 14.2;
  const spoke = r < 24 && (Math.abs(x + 0.5 - CX) < 1.6 || Math.abs(z + 0.5 - CZ) < 1.6);
  if ((ring || spoke) && get(x, TOP, z) === T.grass) set(x, TOP, z, T.path);
  if (get(x, TOP, z) === T.grass && R() < 0.06) set(x, TOP, z, T.flowers);
}
// the bridge from the islet to the island, with rail posts
for (let z = 7; z <= 12; z++) for (let x = 30; x <= 32; x++) {
  set(x, TOP, z, T.planks);
  if ((x === 30 || x === 32) && z % 2 === 1) set(x, TOP + 1, z, T.planks);
}
// a star pad where Lumi lands
for (let z = 2; z <= 6; z++) for (let x = 29; x <= 33; x++) if (rad(x, z, 31.5, 4.5) < 2.6) set(x, TOP, z, T.startile);

// the central plaza and the Star Well
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const r = rad(x, z);
  if (r < 7) set(x, TOP, z, T.marble);
  if (r < 5) set(x, TOP + 1, z, r < 3.6 ? T.startile : T.marble);   // the dais, one step up
  if (r < 2.1) { set(x, TOP + 1, z, 0); set(x, TOP, z, T.gold); }   // the well's golden basin
}

// lamp posts around the ring
for (let i = 0; i < 12; i++) {
  const a = (i + 0.5) / 12 * Math.PI * 2;
  const x = Math.floor(CX + Math.sin(a) * 15), z = Math.floor(CZ + Math.cos(a) * 15);
  for (let y = TOP + 1; y <= TOP + 3; y++) set(x, y, z, T.metal);
  set(x, TOP + 4, z, T.lamp);
}

// north: the telescope tower, with a stair spiralling up the outside
const TX = 31.5, TZ = 51.5, TOWER = 4.5, STAIR = 7, STEPS = 16, DECK = TOP + 1 + STEPS;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const r = rad(x, z, TX, TZ);
  if (r < TOWER) {
    for (let y = TOP + 1; y < DECK; y++) set(x, y, z, (y - TOP) % 5 === 0 && r > TOWER - 1 ? T.glass : T.brick);
    set(x, DECK, z, r > TOWER - 1 ? T.marble : T.planks);
  } else if (r < STAIR) {
    // angle 0 points south (toward the plaza) and climbs counter-clockwise seen from above
    const a = ((Math.atan2(-(x + 0.5 - TX), -(z + 0.5 - TZ)) / (Math.PI * 2)) + 1) % 1;
    const h = TOP + 1 + Math.floor(a * STEPS);
    for (let y = TOP + 1; y <= h; y++) set(x, y, z, y === h ? T.marble : T.brick);
  }
}
// the telescope on the deck, a brass tube tilted at the sky
for (let i = 0; i < 8; i++) {
  const y = DECK + 1 + Math.floor(i * 0.8), z = Math.floor(TZ - 1 + i * 0.6);
  for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) set(31 + dx, y + dy, z, i === 7 ? T.glass : T.brass);
}
set(31, DECK + 1, 50, T.metal); set(32, DECK + 1, 50, T.metal);   // its stand

// east: the star library, a little house with a door facing the plaza
const LX0 = 44, LX1 = 54, LZ0 = 30, LZ1 = 41;
for (let z = LZ0; z <= LZ1; z++) for (let x = LX0; x <= LX1; x++) {
  set(x, TOP, z, T.planks);
  const wall = x === LX0 || x === LX1 || z === LZ0 || z === LZ1;
  const door = x === LX0 && z >= 35 && z <= 36;
  for (let y = TOP + 1; y <= TOP + 4; y++) {
    if (wall && !(door && y <= TOP + 2)) {
      const window = !(x === LX0 || x === LX1) && (x - LX0) % 3 === 2 && (y === TOP + 2 || y === TOP + 3);
      set(x, y, z, window ? T.glass : T.planks);
    }
  }
  // bookshelves along the inside of the back walls, a reading table in the middle
  const inner = x === LX1 - 1 || z === LZ0 + 1 || z === LZ1 - 1;
  if (!wall && inner && !(x <= LX0 + 2)) for (let y = TOP + 1; y <= TOP + 2; y++) set(x, y, z, T.books);
  if (x >= 48 && x <= 49 && z >= 35 && z <= 36) set(x, TOP + 1, z, T.planks);
}
for (let s = 0; s < 5; s++) for (let z = LZ0 - 1 + s; z <= LZ1 + 1 - s; z++) for (let x = LX0 - 1 + s; x <= LX1 + 1 - s; x++) {
  const edge = x === LX0 - 1 + s || x === LX1 + 1 - s || z === LZ0 - 1 + s || z === LZ1 + 1 - s;
  if (edge || s === 4) set(x, TOP + 5 + s, z, T.roof);
}
set(Math.floor((LX0 + LX1) / 2), TOP + 10, Math.floor((LZ0 + LZ1) / 2), T.lamp);   // a lantern on the roof

// west: the garden, a pond and some trees
const PX = 14.5, PZ = 36.5;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const r = rad(x, z, PX, PZ);
  if (r < 4.6) { set(x, TOP, z, 0); set(x, TOP - 1, z, T.water); }
  else if (r < 5.4 && get(x, TOP, z)) set(x, TOP, z, T.path);
}
for (let x = 13; x <= 15; x++) set(x, TOP, 36, T.planks);   // a little stepping plank across
function tree(x, z, h) {
  for (let y = TOP + 1; y < TOP + 1 + h; y++) set(x, y, z, T.trunk);
  const cy = TOP + h;
  for (let dz = -3; dz <= 3; dz++) for (let dy = -2; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    if (Math.hypot(dx, dy * 1.2, dz) < 2.9 + R() * 0.4 && !get(x + dx, cy + dy, z + dz)) set(x + dx, cy + dy, z + dz, T.leaves);
  }
}
tree(10, 27, 5); tree(19, 45, 4); tree(9, 44, 6); tree(21, 26, 4); tree(45, 21, 5); tree(52, 48, 4);

// floating stepping stones from the tower deck up to the moon platform
const stones = 9, moon = [10.5, DECK + 9, 52.5];
for (let i = 0; i < stones; i++) {
  const t = (i + 1) / (stones + 1);
  const x = Math.round(25 + (moon[0] + 4 - 25) * t + Math.sin(i * 1.7) * 1.5);
  const z = Math.round(TZ + Math.sin(t * Math.PI) * 6);
  const y = DECK + Math.round(t * (moon[1] - DECK));
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) { set(x + dx, y, z + dz, T.moon); set(x + dx, y - 1, z + dz, T.rock); }
}
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const r = rad(x, z, moon[0], moon[2]);
  if (r < 5.3) {
    set(x, moon[1], z, T.moon);
    for (let y = moon[1] - Math.max(1, Math.floor((5.3 - r) * 1.2)); y < moon[1]; y++) set(x, y, z, T.rock);
  }
}
set(10, moon[1] + 1, 52, T.lamp);     // a lantern on the moon, for now

// ------------------------------------------------------------------ vox models (8x8x8, value = color + 1)
function model(name, fill, pivot = [4, 0, 4]) {
  const v = new Uint8Array(512);
  fill((x, y, z, c) => { if (x >= 0 && x < 8 && y >= 0 && y < 8 && z >= 0 && z < 8) v[x + 8 * (y + 8 * z)] = c + 1; });
  return { name, pivot, data: b64(v) };
}

// Lumi: a little star-keeper with orange pigtails, a violet dress with a star on it,
// and a star clip in her hair. Front is +z. step: 0 standing, 1 left foot forward, 2 right foot forward
const SKIN = 15, HAIR = 9, DRESS = 2, DRESS2 = 13, SHOE = 18, STAR = 10, EYE = 0, CHEEK = 14;
function lumi(step) {
  return (v) => {
    const lf = step === 1 ? 1 : step === 2 ? -1 : 0;   // left foot forward/back
    // feet and legs
    for (const [x0, off] of [[2, lf], [4, -lf]]) for (let x = x0; x < x0 + 2; x++) {
      v(x, 0, 3 + off, SHOE); v(x, 0, 4 + off, SHOE);
    }
    // skirt (wide at the hem), with a star on the front
    for (let z = 2; z <= 5; z++) for (let x = 1; x <= 6; x++) if (!((x === 1 || x === 6) && (z === 2 || z === 5))) v(x, 1, z, DRESS2);
    for (let z = 2; z <= 5; z++) for (let x = 2; x <= 5; x++) v(x, 2, z, DRESS);
    v(3, 2, 5, STAR); v(4, 2, 5, STAR); v(3, 1, 5, STAR); v(4, 1, 5, STAR);
    // body and arms (arms swing opposite to the feet)
    for (let z = 3; z <= 4; z++) for (let x = 2; x <= 5; x++) v(x, 3, z, DRESS);
    v(1, 3, 3, DRESS); v(1, 3, 4, DRESS); v(6, 3, 3, DRESS); v(6, 3, 4, DRESS);
    v(1, 2, 4 - lf, SKIN); v(6, 2, 4 + lf, SKIN);
    // head: rows y 4-7, face on the front (z = 5)
    for (let z = 2; z <= 5; z++) for (let x = 2; x <= 5; x++) v(x, 4, z, z === 5 ? SKIN : HAIR);
    for (let y = 5; y <= 6; y++) for (let z = 1; z <= 5; z++) for (let x = 1; x <= 6; x++) v(x, y, z, HAIR);
    for (let z = 1; z <= 5; z++) for (let x = 2; x <= 5; x++) v(x, 7, z, HAIR);
    v(2, 5, 5, EYE); v(3, 5, 5, SKIN); v(4, 5, 5, SKIN); v(5, 5, 5, EYE);
    v(2, 4, 5, CHEEK); v(5, 4, 5, CHEEK); v(3, 4, 5, SKIN); v(4, 4, 5, SKIN);
    // pigtails
    for (const x of [0, 7]) { v(x, 5, 2, HAIR); v(x, 4, 2, HAIR); v(x, 3, 2, HAIR); v(x, 5, 3, HAIR); }
    v(5, 7, 4, STAR);                                   // star hair clip
  };
}

// a chunky five-point star, standing up and facing +z, pivot in its middle
const starModel = model('star', (v) => {
  const rows = [
    '...##...',
    '...##...',
    '..####..',
    '########',
    '.######.',
    '..####..',
    '.##..##.',
    '##....##',
  ];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (rows[r][c] === '#')
    for (let z = 3; z <= 4; z++) v(c, 7 - r, z, (r === 3 && (c === 0 || c === 7)) || r === 0 ? 23 : 10);
  for (let r = 2; r <= 5; r++) for (let c = 3; c <= 4; c++) { v(c, 7 - r, 2, 10); v(c, 7 - r, 5, 10); }
}, [4, 4, 4]);

const vox = [model('lumi', lumi(0)), model('lumi step L', lumi(1)), model('lumi step R', lumi(2)), starModel];

// ------------------------------------------------------------------ sounds
// a note is [pitch, wave, vol, fx]; pitch 33 = A 440, 36 = C5. waves: 0 tri 1 tilted saw 2 saw
// 3 square 4 pulse 5 organ 6 noise 7 phaser. fx: 0 none 1 slide 2 vibrato 3 drop 4 fade in 5 fade out
const hx = (n, w) => n.toString(16).padStart(w, '0');
function sound(speed, notes, loop = [0, 0]) {
  let s = hx(speed, 2) + hx(loop[0], 2) + hx(loop[1], 2);
  for (let i = 0; i < 32; i++) { const [p, w, v, f] = notes[i] || [0, 0, 0, 0]; s += hx(p, 2) + hx(w, 1) + hx(v, 1) + hx(f, 1); }
  return s;
}
const sfx = [];
sfx[0] = sound(2, [[26, 6, 2, 5], [20, 6, 1, 5]]);                                   // footstep
sfx[1] = sound(2, [[26, 3, 3, 0], [29, 3, 3, 0], [32, 3, 3, 0], [35, 3, 2, 0], [38, 3, 1, 5]]); // jump
sfx[2] = sound(2, [[14, 6, 3, 0], [10, 6, 2, 5]]);                                   // land
sfx[3] = sound(4, [[48, 0, 4, 0], [52, 0, 4, 0], [55, 0, 4, 0], [60, 0, 4, 0], [60, 0, 2, 5], [55, 0, 2, 0], [60, 0, 1, 5]]); // chime
sfx[4] = sound(3, [[40, 0, 4, 0], [36, 0, 4, 1], [31, 0, 4, 1], [26, 0, 3, 1], [21, 0, 2, 5]]); // fall
sfx[5] = sound(4, [[36, 0, 5, 0], [40, 0, 5, 0], [43, 0, 5, 0], [48, 0, 5, 0], [48, 0, 3, 5]]); // start

// the song: a gentle C major pentatonic lullaby. Each pattern is 32 slots at speed 18.
function melody(ns) {   // ns: 32 pitches or null; a note is struck, then rings for one slot
  const out = [];
  for (let i = 0; i < 32; i++) {
    if (ns[i] != null) out.push([ns[i], 0, 4, 0]);
    else if (i > 0 && ns[i - 1] != null) out.push([ns[i - 1], 0, 2, 5]);
    else out.push([0, 0, 0, 0]);
  }
  return out;
}
function bass(roots) {  // 4 roots, 8 slots each
  const out = [];
  for (const r of roots) for (let i = 0; i < 8; i++) out.push(i < 6 ? [r, 0, i < 1 ? 4 : i < 4 ? 3 : 2, i === 5 ? 5 : 0] : [0, 0, 0, 0]);
  return out;
}
function twinkle(chords) { // 4 chords of 3 pitches, sparkles every other slot
  const out = [];
  for (const ch of chords) for (let i = 0; i < 8; i++) out.push(i % 2 === 0 ? [ch[(i / 2) % 3], 0, 1, 5] : [0, 0, 0, 0]);
  return out;
}
const _ = null;
const C5 = 36, D5 = 38, E5 = 40, G5 = 43, A5 = 45, C6 = 48;
sfx[8] = sound(18, melody([E5, _, G5, _, A5, _, G5, _, E5, _, D5, _, C5, _, _, _, D5, _, E5, _, G5, _, E5, _, D5, _, _, _, _, _, _, _]));
sfx[9] = sound(18, bass([12, 9, 5, 7]));
sfx[10] = sound(18, twinkle([[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]));
sfx[11] = sound(18, melody([G5, _, A5, _, C6, _, A5, _, G5, _, E5, _, D5, _, _, _, E5, _, D5, _, C5, _, D5, _, C5, _, _, _, _, _, _, _]));
sfx[12] = sound(18, bass([5, 7, 9, 12]));
sfx[13] = sound(18, twinkle([[53, 57, 60], [55, 59, 62], [57, 60, 64], [60, 64, 67]]));
for (let i = 0; i < 14; i++) if (!sfx[i]) sfx[i] = null;
const music = ['108090a40', '20b0c0d40'];   // pattern 0: loop start; pattern 1: loop back

// ------------------------------------------------------------------ the cart
const cart = {
  version: 1,
  name: 'star observatory',
  code: readFileSync(new URL('game.js', here), 'utf8'),
  tiles,
  maps: [{ name: 'observatory', w: W, h: H, d: D, origin: [0, 0, 0], data: b64(map) }],
  vox,
  sfx,
  music,
};
writeFileSync(new URL('observatory.b3d.json', root), JSON.stringify(cart) + '\n');
console.log('observatory.b3d.json:', tiles.length - 1, 'tiles,', map.filter((t) => t).length, 'blocks, deck at y', DECK, ', moon at y', moon[1]);
