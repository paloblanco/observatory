// Builds map 0, the observatory (128 x 64 x 128), each time the game is packed.
// The game has a fixed camera looking north and no jumping, so:
//   - everything is reached on foot: Lumi climbs 1-block steps on her own, but never 2;
//   - the tower stair runs along the tower's south face, where the camera can see it;
//   - bridges have metal rails (Lumi never steps up onto metal), so she can't walk off them.
// Tile numbers are the files in tiles/.

const T = {
  grass: 1, dirt: 2, rock: 3, path: 4, marble: 5, brick: 6, planks: 7, water: 8, gold: 9, roof: 10,
  leaves: 11, trunk: 12, lamp: 13, brass: 14, books: 15, startile: 16, metal: 17, glass: 18,
  flowers: 19, moon: 20, cap: 21, stem: 22, hedge: 23,
};

export const TOP = 16;                       // the main island's top layer; Lumi walks at y = 17
export const CX = 63.5, CZ = 63.5;           // the middle of the main island (and the Star Well)
const MAIN = 34;                             // the main island's radius

export default (map) => {
  const { w: W, h: H, d: D } = map;
  const set = (x, y, z, t) => map.set(Math.floor(x), y, Math.floor(z), t);
  const get = (x, y, z) => {
    x = Math.floor(x); z = Math.floor(z);
    return x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D ? map.get(x, y, z) : 0;
  };
  let seed = 2026;
  const R = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
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

  // A 3-wide walkway from (x0, z0) at height y0 to (x1, z1) at height y1. It climbs in 1-block steps,
  // and has a metal rail on each side wherever there's nothing under the side (over the void).
  function bridge(x0, z0, y0, x1, z1, y1, tile = T.planks) {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len * 4);
    const sx = -(z1 - z0) / len, sz = (x1 - x0) / len;
    const deck = new Map(), side = new Map();
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y = y0 + Math.round((y1 - y0) * t);
      for (let s = -1.4; s <= 1.41; s += 0.35) {
        const k = Math.floor(x + sx * s) + ',' + Math.floor(z + sz * s);
        if (!deck.has(k) || deck.get(k) < y) deck.set(k, y);
      }
      for (const s of [-2.1, 2.1]) {
        const k = Math.floor(x + sx * s) + ',' + Math.floor(z + sz * s);
        if (!side.has(k) || side.get(k) < y) side.set(k, y);
      }
    }
    for (const [k, y] of deck) { const [x, z] = k.split(',').map(Number); set(x, y, z, tile); set(x, y + 1, z, 0); set(x, y + 2, z, 0); }
    for (const [k, y] of side) {
      if (deck.has(k)) continue;
      const [x, z] = k.split(',').map(Number);
      if (get(x, y, z) || get(x, y - 1, z)) continue;     // land under it: no rail needed
      set(x, y, z, tile); set(x, y + 1, z, T.metal);
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
    const x = Math.floor(CX + Math.sin(a) * 20.5), z = Math.floor(CZ + Math.cos(a) * 20.5);
    if (x >= 60 && x <= 78 && z >= 77 && z <= 83) continue;    // that one would stand on the tower stair
    lamp(x, z, TOP);
  }

  // north: the telescope tower. Its stair climbs along the south face, from east to west, then
  // turns north onto the deck, so the whole climb faces the camera.
  const TX = 63.5, TZ = 87.5, TOWER = 5.5, STEPS = 12, DECK = TOP + 1 + STEPS;
  each(TX, TZ, TOWER, (x, z, r) => {
    for (let y = TOP + 1; y < DECK; y++) set(x, y, z, (y - TOP) % 4 === 0 && r > TOWER - 1 ? T.glass : T.brick);
    set(x, DECK, z, r > TOWER - 1 ? T.marble : T.planks);
  });
  for (let k = 1; k <= STEPS; k++) {
    const x = 76 - k, top = TOP + k;               // step 1 at x = 75, y 17; step 12 at x = 64, y 28
    for (const z of [80, 81]) {
      for (let y = TOP + 1; y <= top; y++) set(x, y, z, y === top ? T.marble : T.brick);
      for (let y = top + 1; y <= top + 3; y++) set(x, y, z, 0);   // headroom
    }
    set(x, top, 79, T.brick); set(x, top + 1, 79, T.metal);           // a rail on the open side
    for (let y = TOP + 1; y < top; y++) set(x, y, 79, T.brick);
  }
  for (const z of [80, 81]) for (let x = 62; x <= 63; x++) for (let y = TOP + 1; y <= DECK - 1; y++) set(x, y, z, y === DECK - 1 ? T.marble : T.brick);   // the landing
  // a rail round the deck's edge, open where the stair and the moon walk meet it
  each(TX, TZ, TOWER, (x, z, r) => {
    if (r <= TOWER - 1) return;
    const open = (x >= 61 && x <= 64 && z <= 83) || (x <= 59 && z >= 87 && z <= 92);
    if (!open) set(x, DECK + 1, z, T.metal);
  });
  // the telescope on the deck, a brass tube tilted at the sky
  for (let i = 0; i < 9; i++) {
    const y = DECK + 1 + Math.floor(i * 0.8), z = TZ - 1 + i * 0.6;
    for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) set(63 + dx, y + dy, z, i === 8 ? T.glass : T.brass);
  }

  // east: the star library, a little house with a door facing the plaza
  const LX0 = 84, LX1 = 95, LZ0 = 57, LZ1 = 70;
  for (let z = LZ0; z <= LZ1; z++) for (let x = LX0; x <= LX1; x++) {
    set(x, TOP, z, T.planks);
    const wall = x === LX0 || x === LX1 || z === LZ1;    // the south wall is in map 1
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
  // (the library's roof is map 1, so the game can hide it while Lumi is inside)

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
  bridge(64, LAND[1] + LAND_R - 2, TOP, 64, CZ - MAIN + 2, TOP);

  // ---------------- northwest, up high: the moon, by a walkway climbing from the tower deck
  const MOON = [30.5, 104.5], MOON_R = 6, MOON_Y = DECK + 10;
  island(MOON[0], MOON[1], MOON_R, MOON_Y, 4, T.moon);
  bridge(59.5, 89.5, DECK, MOON[0] + 4.5, MOON[1] - 3, MOON_Y, T.moon);
  lamp(30, 104, MOON_Y);

  // ---------------- west: the lake island, a little higher, by a walkway from the garden
  const LAKE = [16.5, 40.5], LAKE_R = 10, LAKE_Y = TOP + 3;
  island(LAKE[0], LAKE[1], LAKE_R, LAKE_Y);
  each(14.5, 38.5, 4.5, (x, z) => { set(x, LAKE_Y, z, 0); set(x, LAKE_Y - 1, z, T.water); });
  for (let z = 37; z <= 39; z++) for (let x = 7; x <= 10; x++) { set(x, LAKE_Y, z, 0); set(x, LAKE_Y - 1, z, T.water); }   // the lake runs to the edge...
  for (let z = 37; z <= 39; z++) for (let y = LAKE_Y - 10; y < LAKE_Y - 1; y++) set(6, y, z, T.water);  // ...and spills off it
  bridge(36, 50, TOP, 24.5, 45, LAKE_Y);
  for (let z = 44; z <= 48; z++) for (let x = 19; x <= 23; x++) {        // a gazebo
    set(x, LAKE_Y, z, T.marble);
    if ((x === 19 || x === 23) && (z === 44 || z === 48)) for (let y = LAKE_Y + 1; y <= LAKE_Y + 3; y++) set(x, y, z, T.marble);
    set(x, LAKE_Y + 4, z, T.roof);
  }
  set(21, LAKE_Y + 5, 46, T.lamp);
  tree(13, 47, 5, LAKE_Y); tree(22, 34, 4, LAKE_Y);

  // ---------------- northeast: the mushroom island, by bridge. Giant mushrooms climb in a ring,
  // each cap one block above the last and touching it, so Lumi can walk up them.
  const SHROOM = [104.5, 100.5], SHROOM_R = 11;
  island(SHROOM[0], SHROOM[1], SHROOM_R, TOP);
  { const dx = SHROOM[0] - CX, dz = SHROOM[1] - CZ, l = Math.hypot(dx, dz);
    bridge(CX + dx / l * (MAIN - 2), CZ + dz / l * (MAIN - 2), TOP, SHROOM[0] - dx / l * (SHROOM_R - 2), SHROOM[1] - dz / l * (SHROOM_R - 2), TOP); }
  for (let i = 0; i < 7; i++) {
    const a = 3.6 + i * 0.82, cx = SHROOM[0] + Math.cos(a) * 5.5, cz = SHROOM[1] + Math.sin(a) * 5.5, cap = TOP + 1 + i;
    for (let y = TOP + 1; y < cap; y++) set(cx, y, cz, T.stem);
    each(cx, cz, 2.9, (x, z) => { if (!get(x, cap, z)) set(x, cap, z, T.cap); });
    if (i === 6) set(cx, cap + 1, cz, T.lamp);
  }
  for (let i = 0; i < 14; i++) {   // little mushrooms in the grass
    const a = R() * Math.PI * 2, d = 7.5 + R() * 2, x = Math.floor(SHROOM[0] + Math.cos(a) * d), z = Math.floor(SHROOM[1] + Math.sin(a) * d);
    if (get(x, TOP, z) === T.grass && !get(x, TOP + 1, z)) set(x, TOP + 1, z, T.cap);
  }

  // ---------------- southeast: the hedge maze island, by bridge
  const MAZE = [102.5, 28.5], MAZE_R = 13;
  island(MAZE[0], MAZE[1], MAZE_R, TOP);
  { const dx = MAZE[0] - CX, dz = MAZE[1] - CZ, l = Math.hypot(dx, dz);
    bridge(CX + dx / l * (MAIN - 2), CZ + dz / l * (MAIN - 2), TOP, MAZE[0] - dx / l * (MAZE_R - 2), MAZE[1] - dz / l * (MAZE_R - 2), TOP); }
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
      if (wi && !wj && i > 0 && i < size - 1 && open.has([ci - 1, cj, ci, cj].join())) wall = false;
      if (wj && !wi && j > 0 && j < size - 1 && open.has([ci, cj - 1, ci, cj].join())) wall = false;
      if (i === 0 && (j === size - 2 || j === size - 3)) wall = false;                                // the entrance, toward the bridge
      const x = X0 + i, z = Z0 + j;
      set(x, TOP, z, T.path);
      if (wall) { set(x, TOP + 1, z, T.hedge); set(x, TOP + 2, z, T.hedge); }
    }
    for (let z = Z0 + 1; z <= Z0 + 2; z++) for (let x = X0 + size - 3; x <= X0 + size - 2; x++) set(x, TOP, z, T.startile);   // the far corner
    set(X0 + size - 2, TOP + 1, Z0 + 1, T.lamp);
  }

  // ---------------- far southwest: the hidden shrine, by a long walkway from the landing islet
  const SHRINE = [20.5, 14.5], SHRINE_R = 5, SHRINE_Y = TOP + 4;
  island(SHRINE[0], SHRINE[1], SHRINE_R, SHRINE_Y, 5);
  bridge(LAND[0] - LAND_R + 2, LAND[1] - 0.5, TOP, SHRINE[0] + SHRINE_R - 2, SHRINE[1] + 0.5, SHRINE_Y);
  each(SHRINE[0], SHRINE[1], 3, (x, z) => set(x, SHRINE_Y, z, T.startile));
  for (const [x, z] of [[18, 12], [22, 12], [18, 16], [22, 16]]) for (let y = SHRINE_Y + 1; y <= SHRINE_Y + 3; y++) set(x, y, z, T.marble);
  for (let z = 12; z <= 16; z++) for (let x = 18; x <= 22; x++) set(x, SHRINE_Y + 4, z, T.marble);
  set(20, SHRINE_Y + 5, 14, T.lamp);

  // ---------------- little floating rocks, just scenery
  for (const [x, z, y, r] of [[112, 62, 30, 3], [10, 80, 24, 2.5], [45, 118, 34, 3], [40, 8, 8, 2.5], [120, 120, 40, 2.5], [84, 117, 14, 2], [118, 8, 36, 2], [6, 120, 10, 2.5]])
    island(x, z, r, y, r * 1.2, T.rock);
};
