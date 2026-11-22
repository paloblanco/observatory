# Star Observatory

A little BLOCKO3D game: Lumi the star-keeper explores an observatory floating among the stars. 100 stars are hidden over the islands, some inside chests. Touch one and it follows her; bring them to the Star Well in the middle of the plaza. Star doors open as the well fills. With 70 stars in the well, a stair appears up to a platform high above the plaza: grab the trophy to finish. Behind a 100-star door up there waits the Star Diamond, for the special ending.

**Play it:** open `index.html` from a web host (GitHub Pages serves this repo's root), or run `python -m http.server` here and open http://localhost:8000.

## Controls

- Arrows, WASD, d-pad or stick: walk (up is away from the camera: north, unless you've been looking around)
- X or O: spin. Lumi twirls in a ring of sparkles and breaks any chest next to her.
- Keep holding X or O after a spin to run: 1.5 times as fast (`RUN` in `main.js`).
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
- **Maps 11-16, the outer islands**, each behind a star door on its bridge:
  - 11 **east island** and 12 the **castle** on it (`star door 20`): a courtyard maze, a wall walkway, a keep with a room inside, a flying stair up to the keep roof, and a turret.
  - 13 **west island** and 14 the **undercroft** (`star door 30`): a stair from the island down under the main island, a walkway, and a grotto with crystals and a pool hanging beneath it. The main island turns see-through while Lumi is under it. A short rail on the main island's west edge stops anyone dropping onto the stair without going through the door.
  - 15 **north island** and 16 the **sky tower** (`star door 50`): a stair spiralling 40 steps round a pillar to a ring high in the sky.
- **Map 17, the final stair** (placement `final stair`): a spiral round the Star Well up to a platform 30 blocks above the plaza, with the trophy, and a bridge to the diamond room. It's hidden until 70 stars are in the well (`WELL_NEED` in `main.js`); then it fades in over a second while time stands still. Placements whose names start with `final` (it, and `final star door 100`) stay hidden until then.
- **The endings**: the trophy (vox 11) ends the game with your time; the Star Diamond (vox 12), behind the 100-star door, is the special ending for all 100 stars. Both best times are saved.
- Every map is a text file in `game/maps/` (`N-name.txt`): a legend of tiles, then one floor plan per layer from the bottom up. Edit them in the IDE's Map tab, or as text.
- **Scene 0**: the world, the library roof, every prop, and one star marker (vox 3) for each star. Move, add or remove props and stars in the IDE's **Scene** tab; the game picks up whatever is there.
- **Chests**: solid like a block until Lumi spins next to one. Some are empty; some hold a star or a key. In the Scene tab, chest markers are vox 4 (empty), 5 (a star inside) and 6 (a key inside); in the game they all look the same. Keys are counted on screen but don't open anything yet.
- **Star doors** (map 10): a marble frame around a star panel. Place one in the Scene tab and name the placement `star door N`: once N stars are in the Star Well, it fades away in a shower of yellow sparkles as Lumi comes near (time stands still for a second). Before that it blocks the way and says how many stars it needs. The doors: `star door 5` across the shrine walkway, `star door 10` at the top of the tower stair (in front of the deck and the moon walkway), 20, 30 and 50 on the outer islands' bridges, and `final star door 100` in front of the diamond room. The name only needs to contain `star door N`. For a second door with the same number, add a letter: `star door 5 b`.
- **Flowers and rocks**, half a block tall, and Lumi walks right through both. 160 flowers (vox 13) are sprinkled on grass at random each game, in six petal colors (`FLOWERS`, `FLOWER_COLORS` in `main.js`): walk or run through one and it shakes off a petal or two; spin next to one and it twirls with her, throwing more. Rocks (vox 14) are scene markers, 30 so far, so place them in the Scene tab: spin next to one and it bounces away from Lumi, with a shadow under it while it flies, and breaks where it lands (or falls off the edge of the world).
- **Starries** (vox 15): little talking stars, placed as markers in the Scene tab (9 so far). They float in place, turn to look at Lumi when she's near, twirl and bounce when she spins next to them, and talk when she comes within 1.5 blocks: their words appear in a box at the bottom of the screen, a letter a frame, and go away once she's more than 3 blocks off (`TALK_NEAR`, `TALK_FAR`). **What each one says**: the lines are in `STARRY_LINES` at the top of `main.js`, and a Starry marker's **yaw** picks its line (yaw 0 says the first line, yaw 1 the second...). Each Starry's color comes from its line number (`STARRY_COLORS`). To add one: add a line to the list, then place a vox 15 marker and set its yaw to that line's number.
- **Heroes**: after the title, a character select screen: left / right to choose, X or O to begin. The choice is remembered. Each hero is three vox models in a row (standing, left step, right step), listed in `HEROES` at the top of `main.js`.
- **Vox 0-2**: Lumi standing and two walking steps. **Vox 8-10**: Lumo, her brother, the same way. **Vox 3**: a star. **Vox 4**: a chest (5 and 6 are the marked chest markers). **Vox 7**: a key. **Vox 11**: the trophy. **Vox 12**: the Star Diamond. **Vox 13**: a flower. **Vox 14**: a rock. **Vox 15**: a Starry.
- **Sounds**: 0 footstep, 1 jump, 2 land, 3 chime, 4 fall, 5 start, 6 pickup, 7 deliver, 14 win, 15 spin, 16 chest breaks, 17 key, 18 star door opens, 19 flower rustle, 20 rock flung, 21 rock breaks, 22 Starry blip. 8-13 and Music 0-1 are a gentle looping song.

Where the stars are: 100 in all, 14 of them in chests. Each area has enough to open the next door: 35 out in the open, 6 behind the 5-star door, 9 behind the 10, 16 in the castle, 17 in the west island and undercroft, and 17 on the north island and sky tower. Every one can be reached on foot (checked by walking the routes the stars sit on). Move them in the Scene tab as you like.

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

**Editing in the IDE** (maps, tiles, models, sounds, the Scene tab). The cart holds everything, so always start from a fresh one:

1. `git pull`, then `b3d pack game/ --out observatory.b3d.json` so the cart has the latest of everything.
2. Open `observatory.b3d.json` in the IDE, edit, and **Save** over it.
3. `b3d unpack observatory.b3d.json game/`.
4. `git diff --stat`: only what you meant to change should show (say `game/maps/` and `game/scenes.json`). If anything else changed, `git checkout -- <those files>` puts it back.
5. `b3d export game/ --out .`, then commit and push.

**Working on maps together.** The maps are text, so git merges two people's edits as long as they don't touch the same rows of the same layer. Still, pull before editing a map, push soon after, and say which maps you changed.

Commit and push; GitHub Pages picks it up.
