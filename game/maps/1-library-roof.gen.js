// Builds map 1: the star library's south wall and roof. The scene places it at [83, 17, 56], so
// block (x, y, z) here is (83 + x, 17 + y, 56 + z) in the observatory. It's a map of its own so the
// game can stop drawing it while Lumi is inside the library, where the fixed camera would
// otherwise look at the wall instead of her. It still blocks her, drawn or not.
const PLANKS = 7, GLASS = 18, ROOF = 10, LAMP = 13;

export default (map) => {
  // the south wall: x 1-12 (the library's x 84-95), z 1, four blocks high, with windows
  for (let x = 1; x <= 12; x++) for (let y = 0; y <= 3; y++) {
    const window = x !== 1 && x !== 12 && (x - 1) % 3 === 2 && (y === 1 || y === 2);
    map.set(x, y, 1, window ? GLASS : PLANKS);
  }
  // the roof: rings stepping in, one block higher each time, then a lantern on top
  for (let s = 0; s < 7; s++) for (let z = s; z <= 15 - s; z++) for (let x = s; x <= 13 - s; x++) {
    const edge = x === s || x === 13 - s || z === s || z === 15 - s;
    if (edge || s === 6) map.set(x, 4 + s, z, ROOF);
  }
  map.set(6, 11, 7, LAMP);
};
