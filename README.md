# Star Observatory

A little blocky3D game: Lumi the star-keeper explores an observatory floating among the stars. The plan is for her to find 20 stars and bring them to the Star Well in the middle of the plaza. Right now she can walk, jump, climb stairs and look around.

**Play it:** open `index.html` from a web host (GitHub Pages serves this repo's root), or run `python -m http.server` here and open http://localhost:8000.

## Controls

- Arrows, WASD, d-pad or stick: walk (relative to the camera)
- X: jump
- Mouse (click the game first; Esc frees it), right stick, or drag on a touch screen: turn the camera
- Enter: pause

## What's in the cart

- **Map 0**, 64×64×64: the floating island with a plaza and the Star Well in the middle, a telescope tower with a spiral stair (north), the star library (east), a garden pond and trees (west), a bridge to the landing islet where Lumi starts (south), and floating stepping stones from the tower top up to a moon platform.
- **Vox 0-2**: Lumi standing and two walking steps. **Vox 3**: a star (the big one spins over the Star Well).
- **Sfx 0-5**: footstep, jump, land, chime, fall, start. **Sfx 8-13 + Music 0-1**: a gentle looping song.

## Files

| File | What it is |
| --- | --- |
| `observatory.b3d.json` | The cart. Open it in the [blocky3D IDE](https://paloblanco.github.io/demo_blocky_3d/) with **Open**. |
| `index.html`, `star-observatory.js`, `manifest.webmanifest`, `sw.js`, `icon-*.png` | The exported game, exactly what the IDE's **Export** makes. |
| `tools/make_cart.mjs`, `tools/game.js` | The script that generated the starting cart (tiles, map, models, sounds) and its code. |
| `tools/export.mjs` | Exports the cart to the files above without the IDE. |

## Making changes

1. Open `observatory.b3d.json` in the IDE, edit, and **Save** over it.
2. **Export** and unzip into this folder (replacing the old files), or run `node tools/export.mjs path/to/demo_blocky_3d`.
3. Commit and push; GitHub Pages picks it up.

Once you edit in the IDE, the saved cart is the source. Running `tools/make_cart.mjs` again would rebuild the starting cart and overwrite those edits.
