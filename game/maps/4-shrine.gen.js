// Map 4: the shrine: four marble pillars under a marble roof, with a lantern. Its floor is part
// of map 0. Block (0, 0, 0) is the bottom of the near-left pillar.
export default (map) => {
  for (let z = 0; z <= 4; z++) for (let x = 0; x <= 4; x++) {
    if ((x === 0 || x === 4) && (z === 0 || z === 4)) for (let y = 0; y <= 2; y++) map.set(x, y, z, 5);
    map.set(x, 3, z, 5);
  }
  map.set(2, 4, 2, 13);
};
