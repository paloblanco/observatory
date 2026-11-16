// BLOCKO3D 0.1.0-alpha: every global the engine gives a game, for editor autocomplete and hover help.
// Made by the b3d command from the API reference (b3d api). Don't edit: b3d new, unpack and serve rewrite it.
// Arguments are typed `any`; the descriptions say what each one is. Angles are in turns.

// ---- Maps
/** Draw map m with its current position and angle. */
declare function map(m: any): any;
/** Also draw the back of every face. Use it for maps with see-through tiles (palt): through a block's holes you then see the inside of its far side, as with a cage or a window frame, instead of straight through it. */
declare function map(m: any, on: any): any;
/** Create an empty map of w × h × d blocks. Returns its index. */
declare function map_new(w: any, h: any, d: any, origin?: any): any;
/** A new map with its own copy of map m's blocks, origin, position and angle. Returns its index. Draw a house five times as five copies, and each can move or change on its own. */
declare function map_copy(m: any): any;
/** Put cart map m's blocks back the way the cart has them: undo digging, crumbling, opened doors. Only the blocks: its position, angle and origin stay as they are. map_reload() does every cart map. Only cart maps (the ones from the Map tab) can be reloaded; copies and map_new maps are left alone (a scene comes back fresh with scene_load). */
declare function map_reload(m: any): any;
/** Fill a box of map m's grid with tile t: every cell from corner (x0, y0, z0) to corner (x1, y1, z1), both included, in either order. t = 0 carves the box out. Cells past the map's edge are skipped. Build a level in a few lines: map_new(40, 10, 40) for the space, then a map_box for each floor, wall and platform. */
declare function map_box(m: any, x0: any, y0: any, z0: any, x1: any, y1: any, z1: any, t: any): any;
/** Copy map src's solid blocks into map dst, with src's block (0, 0, 0) landing on dst's block (x, y, z). Empty blocks in src leave dst as it was; blocks past dst's edge are cut off. For scenery that never moves: one big map is one mesh and one collision check. */
declare function map_stamp(src: any, dst: any, x: any, y: any, z: any): any;
/** Put the map's origin at this world position. */
declare function map_set_pos(m: any, xyz: any): any;
/** Rotate the map around its origin. Angles are in turns. */
declare function map_set_angle(m: any, pitch_yaw_roll: any): any;
/** Move the pivot. The map stays where it is on screen. */
declare function map_set_origin(m: any, xyz: any): any;
/** Tile index at a grid cell of map m (0 outside the map). */
declare function mget(m: any, x: any, y: any, z: any): any;
/** Set a grid cell of map m to tile t. */
declare function mset(m: any, x: any, y: any, z: any, t: any): any;
/** Look up the world point (x, y, z) in map m. Returns [t, xi, yi, zi]. */
declare function mgetw(m: any, x: any, y: any, z: any): any;
/** Sphere query. Returns [t, xi, yi, zi, nx, ny, nz, d]: the deepest block hit, plus the world-space direction (nx, ny, nz) and distance d to push the sphere out. t is 0 when nothing is hit. */
declare function mgetw(m: any, x: any, y: any, z: any, r: any): any;
/** Collision in one call: pushes a sphere of radius r at x, y, z out of the solid blocks of map maps (a number, or a list like [0, 1, 2]), a few times over so corners work. Returns [x, y, z, nx, ny, nz, ground]: the new position; the overall direction it was pushed (all 0 if it touched nothing; ny > 0.5 means standing on something, ny < -0.5 a ceiling, a sideways push a wall); and the number of the map it stands on, or -1. Works on moved and turned maps. A walker: let [x, y, z, nx, ny, nz, g] = mpush([0, 1], px, py, pz, 0.4); px = x; py = y; pz = z; if (g >= 0 && vy < 0) vy = 0. */
declare function mpush(maps: any, x: any, y: any, z: any, r: any): any;
/** Set the block of map m at a world point. */
declare function msetw(m: any, x: any, y: any, z: any, t: any): any;
/** Where a point in map m's own grid is in the world right now, as [x, y, z], using the map's position, origin and angle. Handy for anything attached to a moving or turned map: a flag on a tilting maze, a car on a spinning arm, a camera riding along. */
declare function mtow(m: any, x: any, y: any, z: any): any;
/** The other way: where a world point is in map m's own grid, as [x, y, z]. Not rounded to a cell (mgetw does that). Keep something's position in a platform's grid and convert back each frame to ride it. */
declare function wtom(m: any, x: any, y: any, z: any): any;
/** The first block of map m along a ray from (ox, oy, oz) in direction (dx, dy, dz), within maxd (default 100). Returns [t, xi, yi, zi, nx, ny, nz, d]: the tile, its grid cell, the face it hit as a grid direction (n), and the distance d along the ray. t is 0 when nothing is hit. Works on moved and rotated maps. Use it with mouse_ray() to click on blocks, or for line of sight. */
declare function mray(m: any, ox: any, oy: any, oz: any, dx: any, dy: any, dz: any, maxd?: any): any;

// ---- Scenes
/** Builds scene n and returns { maps, named, things }. maps: the numbers of fresh map copies, already placed, in the Scene tab's order; draw them and collide with them (mpush(s.maps, ...)). named: { name: map number } for the placements you named. things: [[v, x, y, z, yaw], ...] for the vox markers. The copies come from the maps as the cart has them, so loading a level again gives it back undamaged. Loading a scene throws away the copies the previous scene_load made (using one of those numbers is an error), and a reload reuses the same numbers. */
declare function scene_load(n: any): any;

// ---- Vox models
/** Draw model n with its pivot at (x, y, z). */
declare function vox(n: any, x: any, y: any, z: any): any;
/** Rotated, in turns, in the same order as maps (yaw, then pitch, then roll). The model's front is +z. */
declare function vox(n: any, x: any, y: any, z: any, pitch: any, yaw: any, roll: any): any;
/** Scaled evenly by s. */
declare function vox(n: any, x: any, y: any, z: any, pitch: any, yaw: any, roll: any, s: any): any;
/** Scaled separately along the model's own axes (squash and stretch). */
declare function vox(n: any, x: any, y: any, z: any, pitch: any, yaw: any, roll: any, sx: any, sy: any, sz: any): any;

// ---- Primitives
/** Axis-aligned cube centered on (x, y, z). size defaults to 1, c to 7. */
declare function cube(x: any, y: any, z: any, size?: any, c?: any): any;
/** Low-poly sphere. r defaults to 0.5. */
declare function sphere(x: any, y: any, z: any, r?: any, c?: any): any;
/** A 1-pixel line in 3D. */
declare function line3(x1: any, y1: any, z1: any, x2: any, y2: any, z2: any, c?: any): any;

// ---- Palette
/** Global array of 32 colors (0xRRGGBB), defaulting to the PICO-8 extended palette. Change entries any time: palette[28] = 0x1478d4. */
declare var palette: any;
/** For draws after this call, color a is drawn as color b. */
declare function pal(a: any, b: any): any;
/** Reset all remaps and transparency. */
declare function pal(): any;
/** Make color i transparent for following draws (on defaults to true). */
declare function palt(i: any, on?: any): any;
/** Set the background color. */
declare function bg(c: any): any;
/** Dither: the 3D draws after this have the fraction n of their pixels (0 none, 0.5 every other one, 1 all) drawn in color c instead, in a fixed checker-like pattern. pal() remaps apply to c. Outlines stay. For flashes (fillp(0.5, 7) on a hit), fading things in or out, or a shadow: draw a map again with fillp(0.5, 0) and it comes out half darkened. fillp() turns it off. */
declare function fillp(n: any, c: any): any;
/** See-through: the fraction n of the pixels isn't drawn at all, so what's behind shows through. For ghosts, water, a hero seen through a wall, or fading something away (n from 0 to 1). A see-through draw gets no outline while it's on. */
declare function fillp(n: any, n_: any): any;
/** A two-color sky: color sky overhead, dithering down to color horizon at the horizon (and below it). It follows the camera, so it stays put when the view tilts. With fog in the horizon color, the land fades into the sky: bg(12, 6) fog(6, 6, 22). bg(c) goes back to one color. */
declare function bg(sky: any, horizon: any): any;

// ---- Outlines
/** Draws after this get an outline in color c (a palette index; pal() remaps apply), inner edges included. */
declare function outline(c: any): any;
/** Only the outer outline: a line where each map or vox model meets the background or another draw, none inside it (no corner or step lines, no line where one part overlaps another). Good for round voxel shapes. Primitives are always drawn this way. */
declare function outline(c: any, on: any): any;
/** No outline for draws after this. */
declare function outline(): any;

// ---- Repeat
/** The draws after this are also drawn x, y and z blocks away, n times each way (default 1, at most 3). An axis of -1 or 0 doesn't repeat. repeat(32, -1, 32) draws each thing 9 times (3 × 3); every repeating axis multiplies the draws by 2n + 1, so keep n small with many draws. Copies are the same map or model drawn again, so mset changes show on all of them, and a map's copies are outlined as one surface: no lines where they meet. */
declare function repeat(x: any, y: any, z: any, n?: any): any;
/** No repeating for draws after this. */
declare function repeat(): any;

// ---- Fog
/** Draws after this fade into color c (a palette index; pal() remaps apply, as with bg) with their distance from the camera: untouched up to near blocks away (default 8), solid c from far (default 24), and dithered in between, more and more pixels taking color c. Fogged pixels get no outline. Set bg to the same color, or use bg(sky, c), so the sky and the fog meet. */
declare function fog(c: any, near?: any, far?: any): any;
/** No fog for draws after this. */
declare function fog(): any;

// ---- Sound
/** Play sound n on a free channel (or the one that has played longest).
 * sfx(-1) / sfx(-1, ch): Stop all sounds / stop channel ch. */
declare function sfx(n: any): any;
/** Play sound n on channel ch (0-3), replacing what was playing there.
 * sfx(-1) / sfx(-1, ch): Stop all sounds / stop channel ch.
 * sfx(-2, ch): Let a looping sound on channel ch finish instead of looping again. */
declare function sfx(n: any, ch: any): any;
/** Play only some notes: start at note offset, play length notes. */
declare function sfx(n: any, ch: any, offset: any, length: any): any;
/** Play a sound string copied from the Sfx tab, without using a slot. */
declare function sfx(str: any): any;

// ---- Music
/** Play the song from pattern n. If the player hasn't pressed a key or clicked yet, it starts as soon as they do. */
declare function music(n: any): any;
/** Fade in over fade milliseconds. */
declare function music(n: any, fade: any): any;
/** Stop the music, optionally fading out over fade milliseconds. */
declare function music(n: any, fade?: any): any;

// ---- Save data
/** Store any JSON value: a number, string, array or object (up to 64 KB). save(null) deletes it. */
declare function save(value: any): any;
/** The value saved last time, or null if there is none. */
declare function load(): any;

// ---- Camera
/** Camera position. */
declare function cam_set_pos(xyz: any): any;
/** The world point the camera faces. */
declare function cam_set_lookat(xyz: any): any;
/** Put the camera dist away from target, looking at it. yaw and pitch are the way the camera looks (as in dir3), so a negative pitch looks down from above: cam_orbit(player, yaw, -0.1, 8) is a chase or orbit camera in one line. target is [x, y, z] or an object with x, y, z. */
declare function cam_orbit(target: any, yaw: any, pitch: any, dist: any): any;
/** Field of view in turns, across the longer side of the view (on the full square screen, both ways). Default 0.25 (90°). */
declare function cam_set_fov(f: any): any;
/** Orthographic view: w blocks across the longer side of the view at any distance, so nothing shrinks far away (on the full screen a block is 256 / w pixels: cam_set_ortho(32) makes a block 8 pixels, one texel per pixel). The camera is placed as usual with cam_set_pos and cam_set_lookat (or cam_orbit), which set the direction it looks; things behind it aren't drawn, so moving it into a building cuts away the walls in front. Isometric: cam_set_ortho(20) then cam_orbit(player, 0.125, -0.098, 60). mouse_ray works as usual (all rays point the same way). The two-color sky shows one blend for the whole view. cam_set_ortho(0): back to perspective, with the fov as set. */
declare function cam_set_ortho(w: any): any;
/** Bend the picture: each point moves along push by k × d², d its distance from the camera's target measured along along. Only the picture bends: collision, mget, mray and positions stay flat, so game code doesn't change (mouse_ray clicks are only right near the target). along: 'view' (the default: the camera's forward direction across the ground) or 'side' (its sideways direction), a world axis 'x', 'y' or 'z', or two axes like 'xz'. One direction bends like a cylinder, two like a sphere. push: 'down' (the default), 'away' (from the camera, across the ground), or '+x', '-x', '+y', '-y', '+z', '-z'. A negative k bends the other way. cam_set_curve(0): flat again (the default). */
declare function cam_set_curve(k: any, along?: any, push?: any): any;
/** Only draw inside this rectangle of the screen, corners included: 3D, text and rectangles. clip() draws everywhere again. Each clip() starts a new 3D view, centered in its rectangle, with its own camera: the camera, fov and bg as set by the time the next clip() or the end of _draw comes. So clip(0, 0, 127, 255), set a camera, draw; clip(128, 0, 255, 255), set another, draw again: split screen. A view drawn later sits on top of earlier ones (a minimap, a mirror). mouse_ray() uses the view under the cursor. */
declare function clip(x0: any, y0: any, x1: any, y1: any): any;

// ---- Text, rectangles, input and time
/** Draw text on top of the 3D view, at screen pixels (0-255). Each character is a 7 × 10 cell (upper and lower case). c is the color (default 7). oc adds an outline in that color; leave it off, or pass -1, for none. sx and sy scale the text by whole numbers (sy defaults to sx); the outline scales with it. A line of n characters is n × 7 × sx pixels wide (textw). Returns the x just past the text. */
declare function print(str: any, x: any, y: any, c?: any, oc?: any, sx?: any, sy?: any): any;
/** print, centered across the screen, or across the clip area when clip is on (so each half of a split screen centers on its own). */
declare function printc(str: any, y: any, c?: any, oc?: any, sx?: any, sy?: any): any;
/** How wide print(str) is, in pixels, at scale sx (the longest line). For right-aligning: print(s, 252 - textw(s), 4). */
declare function textw(str: any, sx?: any): any;
/** Outline of a rectangle on the same layer as print, corners included. */
declare function rect(x0: any, y0: any, x1: any, y1: any, c?: any): any;
/** Filled rectangle, corners included. Text and rectangles are drawn in the order you call them, on top of the 3D view. */
declare function rectfill(x0: any, y0: any, x1: any, y1: any, c?: any): any;
/** Write a line to the IDE console, for debugging. */
declare function printh(...args: any[]): any;
/** Is button i held by player p (0-3, default 0)? Buttons: 0 left, 1 right, 2 up, 3 down, 4 O, 5 X. */
declare function btn(i: any, p?: any): any;
/** Was button i pressed by player p this update? */
declare function btnp(i: any, p?: any): any;
/** Stick i (0 left, 1 right) of player p as [x, y], each -1 to 1; right and down are positive. A small dead zone reads as exactly 0. When the left stick is centered, stick(0) follows the d-pad or arrow keys instead, so analog movement also works on a keyboard. */
declare function stick(i: any, p?: any): any;
/** Which control phones and tablets show on the left: 0 d-pad (the default), 1 analog circle (touch anywhere in it: direction and distance from the middle go to stick(0), and pushing past halfway also presses the arrow buttons), 2 left and right only (side-scrollers), 3 up and down only. While the game is paused the d-pad always shows; Restart goes back to the d-pad. Keyboards and gamepads are unaffected. */
declare function touch_set_mode(n: any): any;
/** Seconds since the game started. */
declare function time(): any;
/** Seconds since the game started. */
declare function t(): any;
/** For the next n updates, run fn instead of _update (or nothing, without fn). _draw keeps running, so the picture holds still: hit-stun on a big hit, a beat before a death. fn can draw an effect, like shaking the camera. Time keeps going. Calling freeze again replaces the current one; freeze(0) ends it. */
declare function freeze(n: any, fn: any): any;

// ---- Mouse and touch
/** 0 off (the default; mouse and touch are ignored). 1 click: the cursor stays free, for pointing and clicking. 2 capture: the mouse is hidden and locked to the game, for mouse-look; it locks on the first click on the game (that click is not reported). Esc or switching away releases it and pauses the game; Resume captures it again. */
declare function mouse_set_mode(m: any): any;
/** Cursor position as [x, y] in screen pixels, like print and rect (0-255 on the screen; it can go past that when the cursor is off the screen). Doesn't change while captured. */
declare function mouse_pos(): any;
/** How far the mouse moved since the last update, as [dx, dy] in pixels; right and down are positive. Works in both modes; use it for mouse-look in mode 2, where it only counts once the mouse is captured (or a finger drags on a touch screen), so moving the mouse to the game to click doesn't turn the view. */
declare function mouse_delta(): any;
/** Wheel scroll since the last update, in notches (about 1 per click of the wheel); down is positive. */
declare function mouse_wheel(): any;
/** Is the mouse captured right now (mode 2)? Handy for showing "click to play". */
declare function mouse_locked(): any;
/** The line from the camera through the cursor, as [ox, oy, oz, dx, dy, dz] (a start point and a direction of length 1), using the camera as last set. In mode 2 it goes through the middle of the screen, like a crosshair. Pass it to mray() to find the block under the cursor. */
declare function mouse_ray(): any;

// ---- Math
/** Standard sine and cosine of an angle in turns. */
declare function sin(a: any): any;
/** Standard sine and cosine of an angle in turns. */
declare function cos(a: any): any;
/** Angle of a vector, in turns (0 to 1). For which way something faces in 3D, yaw_to is easier. */
declare function atan2(dx: any, dy: any): any;
/** Distance between two points: arrays ([x, y] or [x, y, z]) or objects with x, y and maybe z. Along the ground in 3D: dist([a.x, a.z], [b.x, b.z]). */
declare function dist(a: any, b: any): any;
/** The direction [x, y, z] (length 1) for a yaw and pitch: yaw 0 looks along +z and turns toward +x, positive pitch looks up. Walking forward: let [fx, , fz] = dir3(yaw); x += fx * speed; z += fz * speed. */
declare function dir3(yaw: any, pitch?: any): any;
/** The yaw that faces along (dx, dz): what to give vox so a model faces the way it moves, or the angle toward a target. */
declare function yaw_to(dx: any, dz: any): any;
/** The value t of the way from a to b (t from 0 to 1). Works on numbers and on arrays, element by element: lerp(camPos, target, 0.1) eases a position. Easing each update: x = lerp(x, goal, 0.1). Not for angles (it would go the long way round): use a += angdiff(a, b) * t. */
declare function lerp(a: any, b: any, t: any): any;
/** The shortest turn from angle a to angle b, between -0.5 and 0.5. Turning smoothly toward a target: yaw += angdiff(yaw, want) * 0.1. */
declare function angdiff(a: any, b: any): any;
/** Random number from 0 up to n (default 1). rnd(array) picks an element. */
declare function rnd(n?: any): any;
/** Seed rnd: after srand(n), rnd gives the same numbers every run (handy for levels made from a seed). srand() goes back to unseeded. Restart unseeds. */
declare function srand(n: any): any;
/** The usual helpers. */
declare function flr(...args: any[]): any;
/** The usual helpers. */
declare function ceil(...args: any[]): any;
/** The usual helpers. */
declare function abs(...args: any[]): any;
/** The usual helpers. */
declare function sqrt(...args: any[]): any;
/** The usual helpers. */
declare function min(...args: any[]): any;
/** The usual helpers. */
declare function max(...args: any[]): any;
/** The usual helpers. */
declare function sgn(...args: any[]): any;
/** The usual helpers. */
declare function mid(a: any, b: any, c: any): any;

// ---- Conventions

// ---- Limits
