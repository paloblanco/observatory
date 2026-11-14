// Shared by the mushroom maps: a stem 6 blocks tall at (3, y, 3) and a round cap on top (y 6).
// The origin is the cap's middle, so the scene places a mushroom by where its cap is; the stem
// just runs down into the ground for the low ones.
const CAP = 21, STEM = 22, LAMP = 13;
export default (map, lantern) => {
  for (let y = 0; y < 6; y++) map.set(3, y, 3, STEM);
  for (let z = 0; z < 7; z++) for (let x = 0; x < 7; x++) if (Math.hypot(x - 3, z - 3) < 2.9) map.set(x, 6, z, CAP);
  if (lantern) map.set(3, 7, 3, LAMP);
};
