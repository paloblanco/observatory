# Star Observatory

A little BLOCKO3D game: Lumi the star-keeper explores an observatory floating among the stars. 20 stars are scattered over the islands. Touch one and it follows her; bring them to the Star Well in the middle of the plaza. Bring all 20 to finish, and try to beat your best time.

**Play it:** open `index.html` from a web host (GitHub Pages serves this repo's root), or run `python -m http.server` here and open http://localhost:8000.

## Controls

- Arrows, WASD, d-pad or stick: walk (up is away from the camera: north, unless you've been looking around)
- X or O: spin. Lumi twirls in a ring of sparkles and breaks any chest next to her.
- Standing still: look around with the mouse (click the game first; Esc frees it), the right stick, or a finger drag. Walking eases the camera back over a second, and Lumi walks relative to the camera as it turns.
- Enter: pause

There's no jumping: Lumi climbs 1-block steps by walking into them, and every star can be reached on foot. The camera sits behind and above her, looking north and down, and the world rolls away toward the horizon; it flattens out while you look around.

## What's in the game

- **Map 0**, 128×64×128: the main island in the middle, with a plaza and the Star Well, a telescope tower (north), the star library (east), and a garden pond and trees (west). Around it:
  - **Landing islet** (south), where Lumi starts, joined by a bridge.
  - **Moon** (northwest, high up), by a walkway that climbs from the top of the tower. The tower's stair runs along its south face.
  - **Lake island** (west), a little higher, by a walkway from the garden: a lake that spills off the edge and a gazebo.
  - **Mushroom island** (northeast), by bridge: giant mushrooms in a ring, each cap a step above the last.
  - **Hedge maze island** (southeast), by bridge.
  - **Hidden shrine** (far southwest), by a long walkway from the landing islet.
  - Bridges and walkways have metal rails, which Lumi never climbs, so she can't walk off them.
  - Little floating rocks for scenery.
- **Map 1**: the library's south wall and roof. It works like the props below, but fades out completely when it's between the camera and Lumi, so you can see her inside the library.
- **Maps 2-9, props**: 2 the tower (with its stair and telescope), 3 the gazebo, 4 the shrine, 5-7 trees (small, medium, tall), 8 a giant mushroom, 9 a giant mushroom with a lantern. The scene places them: 12 trees and 7 mushrooms. When a prop is between the camera and Lumi, it fades to 70% see-through. Props draw the backs of their faces too, so the effect still shows when the camera is inside one. The maze, the fountain and other low things stay in map 0 and never fade.
- Every map is built by a script in `game/maps/` (`N-name.gen.js`; the trees and mushrooms share `tree.js` and `mushroom.js`). Change the level there.
- **Scene 0**: the world, the library roof, every prop, and one star marker (vox 3) for each star. Move, add or remove props and stars in the IDE's **Scene** tab; the game picks up whatever is there.
- **Chests**: solid like a block until Lumi spins next to one. Some are empty; some hold a star or a key. In the Scene tab, chest markers are vox 4 (empty), 5 (a star inside) and 6 (a key inside); in the game they all look the same. Keys are counted on screen but don't open anything yet.
- **Vox 0-2**: Lumi standing and two walking steps. **Vox 3**: a star. **Vox 4**: a chest (5 and 6 are the marked chest markers). **Vox 7**: a key. **Vox 8**: Lumi's spin smear frame.
- **Sounds**: 0 footstep, 1 jump, 2 land, 3 chime, 4 fall, 5 start, 6 pickup, 7 deliver, 14 win, 15 spin, 16 chest breaks, 17 key. 8-13 and Music 0-1 are a gentle looping song.

Where the stars are (two of them inside chests: by the start and in the east field): the landing islet, the garden plank, inside the library, the tower deck, behind the tower, the west trees, the east and south fields, the moon, the moon walkway, the gazebo, the waterfall, the lake walkway, the middle and far corner of the hedge maze, inside the shrine, the shrine walkway, the mushroom field, and two mushroom tops.

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

**Editing in the IDE:** open `observatory.b3d.json`, edit, **Save** over it, then run `b3d unpack observatory.b3d.json game/` so `game/` catches up, and `b3d export game/ --out .`. If you change the maps in the IDE, `pack` will say the map scripts no longer match: delete the `.gen.js` files to keep your IDE edits from then on.

Commit and push; GitHub Pages picks it up.
