// Shared by the tree maps: a trunk h blocks tall at (3, 0, 3) and a crown of leaves around its top.
// seed picks the leaves' raggedness, so each tree map looks a little different.
const TRUNK = 12, LEAVES = 11;
export default (map, h, seed) => {
  const R = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < h; y++) map.set(3, y, 3, TRUNK);
  const cy = h - 1;
  for (let dz = -3; dz <= 3; dz++) for (let dy = -2; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    if (Math.hypot(dx, dy * 1.2, dz) < 2.9 + R() * 0.4 && !map.get(3 + dx, cy + dy, 3 + dz)) map.set(3 + dx, cy + dy, 3 + dz, LEAVES);
  }
};
