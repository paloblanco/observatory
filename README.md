# Star Observatory

A little BLOCKO3D game: Lumi the star-keeper explores an observatory floating among the stars. 20 stars are scattered over the islands. Touch one and it follows her; bring them to the Star Well in the middle of the plaza. Bring all 20 to finish, and try to beat your best time.

**Play it:** open `index.html` from a web host (GitHub Pages serves this repo's root), or run `python -m http.server` here and open http://localhost:8000.

## Controls

- Arrows, WASD, d-pad or stick: walk (relative to the camera)
- X: jump
- Mouse (click the game first; Esc frees it), right stick, or drag on a touch screen: turn the camera
- Enter: pause

## What's in the game

- **Map 0**, 128×64×128: the main island in the middle, with a plaza and the Star Well, a telescope tower with a spiral stair (north), the star library (east), and a garden pond and trees (west). Around it:
  - **Landing islet** (south), where Lumi starts, joined by a bridge.
  - **Moon** (northwest, high up), by floating stepping stones from the top of the tower.
  - **Lake island** (west), a little higher, by stepping stones from the garden: a lake that spills off the edge and a gazebo.
  - **Mushroom island** (northeast), by bridge: giant mushrooms to climb in a ring.
  - **Hedge maze island** (southeast), by bridge.
  - **Hidden shrine** (far southwest), a long hop of stones from the landing islet.
  - Little floating rocks for scenery.
- **Scene 0**: map 0 plus one star marker (vox 3) for each star. Move, add or remove stars in the IDE's **Scene** tab; the game counts whatever markers are there.
- **Vox 0-2**: Lumi standing and two walking steps. **Vox 3**: a star.
- **Sounds**: 0 footstep, 1 jump, 2 land, 3 chime, 4 fall, 5 start, 6 pickup, 7 deliver, 14 win. 8-13 and Music 0-1 are a gentle looping song.

Where the stars are: the landing islet, the garden plank, inside the library, the tower deck, behind the tower, the west trees, the east and south fields, the moon, one of the moon's stepping stones, the gazebo, the waterfall, one of the lake's stepping stones, the middle and far corner of the hedge maze, inside the shrine, one of the shrine's stepping stones, the mushroom field, and two mushroom tops.

## Files

| File | What it is |
| --- | --- |
| `game/` | **The source**: the game as a BLOCKO3D project folder (`main.js`, `tiles/`, `vox/`, `sfx/`, `music.txt`, `maps/`, `scenes.json`). |
| `observatory.b3d.json` | The same game as a cart, for the [BLOCKO3D IDE](https://paloblanco.github.io/blocko3d/) (**Open**). |
| `index.html`, `star-observatory.js`, `manifest.webmanifest`, `sw.js`, `icon-*.png` | The exported game that GitHub Pages serves. |

## Making changes

You need the `b3d` command: `npm install -g github:paloblanco/blocko3d` (see its `MAKING_GAMES.md`).

**Editing the files:**

```
b3d check game/                                  # after every change
b3d shot game/ --frames 120 --input "x@1, up:10-120" --out shot.png
b3d pack game/ --out observatory.b3d.json        # the cart, for the IDE
b3d export game/ --out .                         # the playable site
```

**Editing in the IDE:** open `observatory.b3d.json`, edit, **Save** over it, then run `b3d unpack observatory.b3d.json game/` so `game/` catches up, and `b3d export game/ --out .`.

Commit and push; GitHub Pages picks it up.
