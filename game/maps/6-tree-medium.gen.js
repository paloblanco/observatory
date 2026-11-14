// Map 6: a medium tree (a trunk 5 blocks tall and a round crown). The trunk is at (3, 0, 3) and the
// map's origin is the middle of its bottom, so the scene places a tree by where its trunk stands.
import tree from './tree.js';
export default (map) => tree(map, 5, 5 * 7);
