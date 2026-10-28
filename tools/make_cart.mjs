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

add('cap', tile((r, c) => ((r * 3 + c * 5) % 7 === 1 ? 7 : 8), (r, c) => (r < 3 ? ((c * 3 + r) % 5 === 0 ? 7 : 8) : 24), () => 15));
add('stem', tile(() => pick([7, 15, 15]), (r, c) => (c % 3 === 1 ? 15 : 7)));
add('hedge', tile(() => pick([3, 3, 27, 19]), (r, c) => ((r + c) % 3 === 0 ? 19 : pick([3, 27]))));

// ------------------------------------------------------------------ the map, 128 x 64 x 128
const W = 128, H = 64, D = 128;
const map = new Uint8Array(W * H * D);
const set = (x, y, z, t) => { if (x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D) map[x + W * (y + H * z)] = t; };
const get = (x, y, z) => (x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D ? map[x + W * (y + H * z)] : 0);
const TOP = 16;                       // the main island's top layer; you walk at y = 17
const CX = 63.5, CZ = 63.5;           // the middle of the main island (and the Star Well)
const MAIN = 34;                      // the main island's radius
const rad = (x, z, cx = CX, cz = CZ) => Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
const noise2 = (x, z) => Math.sin(x * 0.7 + z * 0.3) + Math.sin(z * 0.9 - x * 0.4) * 0.7;

// calls fn(x, z, distance) for every column within r of (cx, cz)
function each(cx, cz, r, fn) {
  for (let z = Math.max(0, Math.floor(cz - r - 1)); z <= Math.min(D - 1, Math.ceil(cz + r + 1)); z++)
    for (let x = Math.max(0, Math.floor(cx - r - 1)); x <= Math.min(W - 1, Math.ceil(cx + r + 1)); x++) {
      const d = rad(x, z, cx, cz);
      if (d < r) fn(x, z, d);
    }
}

// a floating island: a top layer, dirt under it, a rocky cone tapering down
function island(cx, cz, r, top, depth = r * 0.45, topTile = T.grass) {
  each(cx, cz, r + 1, (x, z, d) => {
    const edge = r + noise2(x, z) * 0.6;
    if (d > edge) return;
    const under = Math.max(1, Math.floor((edge - d) / edge * depth + noise2(z, x) * 1.2));
    for (let y = top - under; y < top; y++) set(x, y, z, topTile === T.grass && y >= top - 2 ? T.dirt : T.rock);
    set(x, top, z, topTile);
  });
}

// a 3-wide plank bridge from (x0, z0) to (x1, z1) at height y, with rail posts where it's over the void
function bridge(x0, z0, x1, z1, y) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len * 3);
  const sx = -(z1 - z0) / len, sz = (x1 - x0) / len;
  const deck = new Set(), posts = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n;
    for (let s = -1.4; s <= 1.41; s += 0.35) {
      const bx = Math.floor(x + sx * s), bz = Math.floor(z + sz * s);
      set(bx, y, bz, T.planks); deck.add(bx + ',' + bz);
    }
    if (i % 9 === 0) for (const s of [-2.1, 2.1]) posts.push([Math.floor(x + sx * s), Math.floor(z + sz * s)]);
  }
  for (const [x, z] of posts) if (!deck.has(x + ',' + z) && !get(x, y, z)) { set(x, y, z, T.planks); set(x, y + 1, z, T.planks); }
}

// floating 2x2 stepping stones from the edge of one platform to the edge of another.
// Each stone is at most 1 block higher than the last and close enough to jump to.
function stones(c1, r1, y1, c2, r2, y2) {
  const dx = c2[0] - c1[0], dz = c2[1] - c1[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
  const a = [c1[0] + ux * (r1 - 0.5), c1[1] + uz * (r1 - 0.5)], b = [c2[0] - ux * (r2 - 0.5), c2[1] - uz * (r2 - 0.5)];
  const h = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(Math.ceil(h / 3.2), Math.abs(y2 - y1));
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1), x = Math.round(a[0] + (b[0] - a[0]) * t - 1), z = Math.round(a[1] + (b[1] - a[1]) * t - 1);
    const y = y1 + Math.round((y2 - y1) * t);
    for (let ez = 0; ez < 2; ez++) for (let ex = 0; ex < 2; ex++) { set(x + ex, y, z + ez, T.moon); set(x + ex, y - 1, z + ez, T.rock); }
  }
}

function tree(x, z, h, top = TOP) {
  for (let y = top + 1; y < top + 1 + h; y++) set(x, y, z, T.trunk);
  const cy = top + h;
  for (let dz = -3; dz <= 3; dz++) for (let dy = -2; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    if (Math.hypot(dx, dy * 1.2, dz) < 2.9 + R() * 0.4 && !get(x + dx, cy + dy, z + dz)) set(x + dx, cy + dy, z + dz, T.leaves);
  }
}
function lamp(x, z, top) { for (let y = top + 1; y <= top + 3; y++) set(x, y, z, T.metal); set(x, top + 4, z, T.lamp); }

// ---------------- the main island
island(CX, CZ, MAIN, TOP);

// paths: a ring and four spokes
each(CX, CZ, MAIN + 1, (x, z, r) => {
  const ring = r >= 16 && r < 18.6;
  const spoke = r < MAIN - 1 && (Math.abs(x + 0.5 - CX) < 1.6 || Math.abs(z + 0.5 - CZ) < 1.6);
  if ((ring || spoke) && get(x, TOP, z) === T.grass) set(x, TOP, z, T.path);
  if (get(x, TOP, z) === T.grass && R() < 0.06) set(x, TOP, z, T.flowers);
});

// the central plaza and the Star Well
each(CX, CZ, 9, (x, z, r) => {
  set(x, TOP, z, T.marble);
  if (r < 6) set(x, TOP + 1, z, r < 4.5 ? T.startile : T.marble);   // the dais, one step up
  if (r < 2.5) { set(x, TOP + 1, z, 0); set(x, TOP, z, T.gold); }   // the well's golden basin
});

// lamp posts around the ring
for (let i = 0; i < 16; i++) {
  const a = (i + 0.5) / 16 * Math.PI * 2;
  lamp(Math.floor(CX + Math.sin(a) * 20.5), Math.floor(CZ + Math.cos(a) * 20.5), TOP);
}

// north: the telescope tower, with a stair spiralling up the outside
const TX = 63.5, TZ = 87.5, TOWER = 5.5, STAIR = 9, STEPS = 20, DECK = TOP + 1 + STEPS;
each(TX, TZ, STAIR, (x, z, r) => {
  if (r < TOWER) {
    for (let y = TOP + 1; y < DECK; y++) set(x, y, z, (y - TOP) % 5 === 0 && r > TOWER - 1 ? T.glass : T.brick);
    set(x, DECK, z, r > TOWER - 1 ? T.marble : T.planks);
  } else {
    // angle 0 points south (toward the plaza) and climbs counter-clockwise seen from above
    const a = ((Math.atan2(-(x + 0.5 - TX), -(z + 0.5 - TZ)) / (Math.PI * 2)) + 1) % 1;
    const h = TOP + 1 + Math.floor(a * STEPS);
    for (let y = TOP + 1; y <= h; y++) set(x, y, z, y === h ? T.marble : T.brick);
  }
});
// the telescope on the deck, a brass tube tilted at the sky
for (let i = 0; i < 10; i++) {
  const y = DECK + 1 + Math.floor(i * 0.8), z = Math.floor(TZ - 2 + i * 0.6);
  for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) set(63 + dx, y + dy, z, i === 9 ? T.glass : T.brass);
}
set(63, DECK + 1, TZ - 2.5, T.metal); set(64, DECK + 1, TZ - 2.5, T.metal);   // its stand

// east: the star library, a little house with a door facing the plaza
const LX0 = 84, LX1 = 95, LZ0 = 57, LZ1 = 70;
for (let z = LZ0; z <= LZ1; z++) for (let x = LX0; x <= LX1; x++) {
  set(x, TOP, z, T.planks);
  const wall = x === LX0 || x === LX1 || z === LZ0 || z === LZ1;
  const door = x === LX0 && z >= 63 && z <= 64;
  for (let y = TOP + 1; y <= TOP + 4; y++) {
    if (wall && !(door && y <= TOP + 2)) {
      const window = !(x === LX0 || x === LX1) && (x - LX0) % 3 === 2 && (y === TOP + 2 || y === TOP + 3);
      set(x, y, z, window ? T.glass : T.planks);
    }
  }
  // bookshelves along the inside of the back walls, a reading table in the middle
  const inner = x === LX1 - 1 || z === LZ0 + 1 || z === LZ1 - 1;
  if (!wall && inner && !(x <= LX0 + 2)) for (let y = TOP + 1; y <= TOP + 2; y++) set(x, y, z, T.books);
  if (x >= 89 && x <= 90 && z >= 63 && z <= 64) set(x, TOP + 1, z, T.planks);
}
for (let s = 0; s < 7; s++) for (let z = LZ0 - 1 + s; z <= LZ1 + 1 - s; z++) for (let x = LX0 - 1 + s; x <= LX1 + 1 - s; x++) {
  const edge = x === LX0 - 1 + s || x === LX1 + 1 - s || z === LZ0 - 1 + s || z === LZ1 + 1 - s;
  if (edge || s === 6) set(x, TOP + 5 + s, z, T.roof);
}
set(Math.floor((LX0 + LX1) / 2), TOP + 12, Math.floor((LZ0 + LZ1) / 2), T.lamp);   // a lantern on the roof

// west: the garden, a pond and some trees
const PX = 40.5, PZ = 63.5;
each(PX, PZ, 7, (x, z, r) => {
  if (r < 6) { set(x, TOP, z, 0); set(x, TOP - 1, z, T.water); }
  else if (get(x, TOP, z)) set(x, TOP, z, T.path);
});
for (let x = 35; x <= 45; x++) set(x, TOP, 63, T.planks);   // a little plank walk across
for (const [x, z, h] of [[36, 52, 5], [46, 77, 4], [35, 74, 6], [47, 50, 4], [34, 59, 5], [45, 40, 5], [84, 42, 4], [88, 82, 5], [78, 92, 4], [42, 88, 5]]) tree(x, z, h);

// ---------------- south: the landing islet, where Lumi starts, and its bridge
const LAND = [63.5, 17.5], LAND_R = 6;
island(LAND[0], LAND[1], LAND_R, TOP, 6);
each(LAND[0], LAND[1], 3, (x, z) => set(x, TOP, z, T.startile));
bridge(64, LAND[1] + LAND_R - 1, 64, CZ - MAIN + 1.5, TOP);

// ---------------- northwest, up high: the moon, by stepping stones from the tower deck
const MOON = [30.5, 104.5], MOON_R = 6, MOON_Y = DECK + 10;
island(MOON[0], MOON[1], MOON_R, MOON_Y, 4, T.moon);
stones([TX, TZ], TOWER, DECK, MOON, MOON_R, MOON_Y);
lamp(30, 104, MOON_Y);

// ---------------- west: the lake island, a little higher, by stepping stones from the garden
const LAKE = [16.5, 40.5], LAKE_R = 10, LAKE_Y = TOP + 3;
island(LAKE[0], LAKE[1], LAKE_R, LAKE_Y);
stones([CX, CZ], MAIN, TOP, LAKE, LAKE_R, LAKE_Y);
each(14.5, 38.5, 4.5, (x, z) => { set(x, LAKE_Y, z, 0); set(x, LAKE_Y - 1, z, T.water); });
for (let z = 37; z <= 39; z++) for (let x = 7; x <= 10; x++) set(x, LAKE_Y - 1, z, T.water);   // the lake runs to the edge...
for (let z = 37; z <= 39; z++) for (let y = LAKE_Y - 10; y < LAKE_Y - 1; y++) set(6, y, z, T.water);  // ...and spills off it
for (let z = 44; z <= 48; z++) for (let x = 19; x <= 23; x++) {        // a gazebo
  set(x, LAKE_Y, z, T.marble);
  if ((x === 19 || x === 23) && (z === 44 || z === 48)) for (let y = LAKE_Y + 1; y <= LAKE_Y + 3; y++) set(x, y, z, T.marble);
  set(x, LAKE_Y + 4, z, T.roof);
}
set(21, LAKE_Y + 5, 46, T.lamp);
tree(13, 47, 5, LAKE_Y); tree(22, 34, 4, LAKE_Y);

// ---------------- northeast: the mushroom island, by bridge. Giant mushrooms climb in a ring.
const SHROOM = [104.5, 100.5], SHROOM_R = 11;
island(SHROOM[0], SHROOM[1], SHROOM_R, TOP);
{ const dx = SHROOM[0] - CX, dz = SHROOM[1] - CZ, l = Math.hypot(dx, dz);
  bridge(CX + dx / l * (MAIN - 2), CZ + dz / l * (MAIN - 2), SHROOM[0] - dx / l * (SHROOM_R - 2), SHROOM[1] - dz / l * (SHROOM_R - 2), TOP); }
for (let i = 0; i < 7; i++) {
  const a = 3.6 + i * 0.82, cx = SHROOM[0] + Math.cos(a) * 5.5, cz = SHROOM[1] + Math.sin(a) * 5.5, cap = TOP + 2 + i;
  for (let y = TOP + 1; y < cap; y++) set(Math.floor(cx), y, Math.floor(cz), T.stem);
  each(cx, cz, 2.4, (x, z) => { if (!get(x, cap, z)) set(x, cap, z, T.cap); });
  if (i === 6) set(Math.floor(cx), cap + 1, Math.floor(cz), T.lamp);
}
for (let i = 0; i < 14; i++) {   // little mushrooms in the grass
  const a = R() * Math.PI * 2, d = 7.5 + R() * 2, x = Math.floor(SHROOM[0] + Math.cos(a) * d), z = Math.floor(SHROOM[1] + Math.sin(a) * d);
  if (get(x, TOP, z) === T.grass && !get(x, TOP + 1, z)) set(x, TOP + 1, z, T.cap);
}

// ---------------- southeast: the hedge maze island, by bridge
const MAZE = [102.5, 28.5], MAZE_R = 13;
island(MAZE[0], MAZE[1], MAZE_R, TOP);
{ const dx = MAZE[0] - CX, dz = MAZE[1] - CZ, l = Math.hypot(dx, dz);
  bridge(CX + dx / l * (MAIN - 2), CZ + dz / l * (MAIN - 2), MAZE[0] - dx / l * (MAZE_R - 2), MAZE[1] - dz / l * (MAZE_R - 2), TOP); }
{
  const N = 5, CELL = 3, X0 = 95, Z0 = 21;           // 5x5 cells, 2-wide paths, hedges 2 high
  const open = new Set(), seen = new Set(['0,0']), stack = [[0, 0]];
  while (stack.length) {
    const [cx, cz] = stack[stack.length - 1];
    const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [cx + a, cz + b])
      .filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !seen.has(a + ',' + b));
    if (!next.length) { stack.pop(); continue; }
    const [nx, nz] = next[Math.floor(R() * next.length)];
    open.add([cx, cz, nx, nz].join()); open.add([nx, nz, cx, cz].join()); seen.add(nx + ',' + nz); stack.push([nx, nz]);
  }
  const size = N * CELL + 1;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const ci = Math.floor(i / CELL), cj = Math.floor(j / CELL), wi = i % CELL === 0, wj = j % CELL === 0;
    let wall = wi || wj;
    if (wi && !wj && i > 0 && i < size - 1 && open.has([ci - 1, cj, ci, cj].join())) wall = false;   // gap to the west neighbor
    if (wj && !wi && j > 0 && j < size - 1 && open.has([ci, cj - 1, ci, cj].join())) wall = false;   // gap to the north neighbor
    if (i === 0 && (j === size - 2 || j === size - 3)) wall = false;                                // the entrance, toward the bridge
    const x = X0 + i, z = Z0 + j;
    set(x, TOP, z, T.path);
    if (wall) { set(x, TOP + 1, z, T.hedge); set(x, TOP + 2, z, T.hedge); }
  }
  for (let z = Z0 + 1; z <= Z0 + 2; z++) for (let x = X0 + size - 3; x <= X0 + size - 2; x++) set(x, TOP, z, T.startile);   // the far corner
  set(X0 + size - 2, TOP + 1, Z0 + 1, T.lamp);
}

// ---------------- far southwest: the hidden shrine, a long hop of stones from the landing islet
const SHRINE = [20.5, 14.5], SHRINE_R = 5, SHRINE_Y = TOP + 4;
island(SHRINE[0], SHRINE[1], SHRINE_R, SHRINE_Y, 5);
stones(LAND, LAND_R, TOP, SHRINE, SHRINE_R, SHRINE_Y);
each(SHRINE[0], SHRINE[1], 3, (x, z) => set(x, SHRINE_Y, z, T.startile));
for (const [x, z] of [[18, 12], [22, 12], [18, 16], [22, 16]]) for (let y = SHRINE_Y + 1; y <= SHRINE_Y + 3; y++) set(x, y, z, T.marble);
for (let z = 12; z <= 16; z++) for (let x = 18; x <= 22; x++) set(x, SHRINE_Y + 4, z, T.marble);
set(20, SHRINE_Y + 5, 14, T.lamp);

// ---------------- little floating rocks, just scenery
for (const [x, z, y, r] of [[112, 62, 30, 3], [10, 80, 24, 2.5], [45, 118, 34, 3], [40, 8, 8, 2.5], [120, 120, 40, 2.5], [84, 117, 14, 2], [118, 8, 36, 2], [6, 120, 10, 2.5]])
  island(x, z, r, y, r * 1.2, T.rock);

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
console.log('observatory.b3d.json:', tiles.length - 1, 'tiles,', map.filter((t) => t).length, 'blocks, deck at y', DECK, ', moon at y', MOON_Y);
