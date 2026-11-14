// Map 2: the telescope tower, its stair and the telescope. The scene places this map's block
// (0, 0, 0) at the observatory's (57, 17, 78), so this script works in observatory coordinates
// and subtracts that. The stair climbs the south face from east to west, then turns north
// onto the deck, so the whole climb faces the camera.
const BRICK = 6, MARBLE = 5, PLANKS = 7, GLASS = 18, METAL = 17, BRASS = 14;
const OX = 57, OY = 17, OZ = 78;
const TOP = 16, TX = 63.5, TZ = 87.5, TOWER = 5.5, STEPS = 12, DECK = TOP + 1 + STEPS;

export default (map) => {
  const set = (x, y, z, t) => map.set(Math.floor(x) - OX, y - OY, Math.floor(z) - OZ, t);
  const each = (fn) => {
    for (let z = 81; z <= 94; z++) for (let x = 57; x <= 70; x++) {
      const r = Math.hypot(x + 0.5 - TX, z + 0.5 - TZ);
      if (r < TOWER) fn(x, z, r);
    }
  };
  each((x, z, r) => {
    for (let y = TOP + 1; y < DECK; y++) set(x, y, z, (y - TOP) % 4 === 0 && r > TOWER - 1 ? GLASS : BRICK);
    set(x, DECK, z, r > TOWER - 1 ? MARBLE : PLANKS);
  });
  for (let k = 1; k <= STEPS; k++) {
    const x = 76 - k, top = TOP + k;               // step 1 at x = 75, y 17; step 12 at x = 64, y 28
    for (const z of [80, 81]) for (let y = TOP + 1; y <= top; y++) set(x, y, z, y === top ? MARBLE : BRICK);
    for (let y = TOP + 1; y <= top; y++) set(x, y, 79, BRICK);
    set(x, top + 1, 79, METAL);                     // a rail on the open side
  }
  for (const z of [80, 81]) for (let x = 62; x <= 63; x++) for (let y = TOP + 1; y <= DECK - 1; y++) set(x, y, z, y === DECK - 1 ? MARBLE : BRICK);   // the landing
  // a rail round the deck's edge, open where the stair and the moon walk meet it
  each((x, z, r) => {
    if (r <= TOWER - 1) return;
    const open = (x >= 61 && x <= 64 && z <= 83) || (x <= 59 && z >= 87 && z <= 92);
    if (!open) set(x, DECK + 1, z, METAL);
  });
  // the telescope, a brass tube tilted at the sky
  for (let i = 0; i < 9; i++) {
    const y = DECK + 1 + Math.floor(i * 0.8), z = TZ - 1 + i * 0.6;
    for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) set(63 + dx, y + dy, z, i === 8 ? GLASS : BRASS);
  }
};
