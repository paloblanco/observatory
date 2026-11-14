// Map 5: a small tree (a trunk 4 blocks tall and a round crown). The trunk is at (3, 0, 3) and the
// map's origin is the middle of its bottom, so the scene places a tree by where its trunk stands.
import tree from './tree.js';
export default (map) => tree(map, 4, 4 * 7);
