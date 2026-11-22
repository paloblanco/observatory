// Star Observatory
// Lumi explores a little observatory floating among the stars. 20 stars are
// scattered over the islands: touch one and it follows her; bring them to the
// Star Well in the middle of the plaza. Bring all 20 to finish.
//
// Controls: arrows / WASD / d-pad / stick walk; up is away from the camera (north). X or O
// spins: Lumi twirls in place, breaking any chest next to her. Keep holding it after the spin
// to run (RUN times as fast). There's no jump button:
// walking into a 1-block step climbs it, so stairs just work. Lumi never climbs onto
// metal or lamps, so rails keep her on the bridges.
// The camera sits behind and a little above Lumi, looking north and down, and the world
// rolls away toward the horizon (cam_set_curve). Standing still, you can look around with
// the mouse (click the game first; Esc frees it), the right stick, or a finger drag; the
// world unrolls while you look. Walking eases the camera back.
//
// map 0: the observatory and the islands around it (128 x 64 x 128), maps/0-observatory.txt
// map 1: the library's south wall and roof. Like the props below, but it fades out completely
//   when it's between the camera and Lumi (so you can see her inside the library).
// maps 2-9: props the scene places: 2 tower, 3 gazebo, 4 shrine, 5-7 trees (small, medium,
//   tall), 8 giant mushroom, 9 giant mushroom with a lantern. When one of them is between the
//   camera and Lumi, it turns 70% see-through.
// scene 0: maps 0 and 1 (named "world" and "library roof"), every prop, and markers: vox 3 a
//   star; vox 4 an empty chest, 5 a chest with a star inside, 6 a chest with a key inside.
//   Move, add or remove props, stars and chests in the Scene tab; the game counts whatever is
//   there (the goal is every star, loose or in a chest). In the game every chest looks like vox 4.
// vox: 0 Lumi standing, 1-2 Lumi walking (left foot, right foot), 3 star, 4 chest, 5-6 chest
//   markers (a mark on top, for the Scene tab), 7 key,
//   8-10 Lumo (standing, step L, step R): each hero is 3 models in a row, see HEROES; 11 trophy,
//   12 Star Diamond, 13 flower (sprinkled at random on grass), 14 rock (scene markers: place them
//   in the Scene tab), 15 Starry (scene markers; the marker's yaw picks its line in STARRY_LINES)
// map 10: a star door. Place it in the Scene tab and name the placement "star door N": it opens
//   once N stars are in the Star Well (add a letter for a second door with the same N: "star door 5 b").
// sounds: 0 footstep, 1 jump (unused), 2 land, 3 chime, 4 fall, 5 start, 6 pickup, 7 deliver,
//   14 win, 15 spin, 16 chest breaks, 17 key, 18 star door opens, 19 flower rustle, 20 rock
//   flung, 21 rock breaks, 22 Starry blip; 8-13 the song (Music patterns 0-1)

const R = 0.35                       // Lumi's collision sphere
const SPAWN = [63.5, 17 + R, 17.5]   // on the little landing islet, looking north at the observatory
const WELL = [63.5, 17, 63.5]        // the Star Well, middle of the plaza
const TRAIL = 9                      // frames of Lumi's path between each star following her
const CAM_DIST = 6.5, CAM_PITCH = 0.14// the camera: how far behind Lumi, and how steeply it looks down (turns)
const CURVE = 0.012                  // how fast the world rolls away ahead (0 = flat)
const BACK = 60                      // frames the camera takes to ease back when Lumi walks (60 = one second)
// The heroes to choose from: a name and the first of their 3 vox models (standing, left step,
// right step, in that order). Add a hero by adding 3 models in a row and a line here.
const HEROES = [{ name: 'Lumi', vox: 0 }, { name: 'Lumo', vox: 8 }]
const WELL_NEED = 70                 // stars in the Star Well that bring the final stair
const FINAL_TIME = 60                // frames the final stair takes to appear (time stands still meanwhile)
const FINAL_SIZE = [26, 38, 37]      // the final stair map's size, to pick sparkle spots on it
const DOOR_TIME = 60                 // frames a star door takes to fade away (time stands still meanwhile)
const SPIN = 26, SPIN_REST = 10      // frames a spin lasts, and the pause before the next one
const SPIN_REACH = 1.45              // how close a chest has to be (center to center) to break
const FULL_TILT = 0.5                // an analog stick at this tilt or more walks at full speed
const STEP = 12                      // frames per step (two steps, left and right, make one walk cycle)
// walk dust: white puffs (DUST_COLORED = false), or bits in the colors of the tile Lumi walks
// on (true), from the DUST table (by tile number, see tiles/). Either way only tiles listed in
// the table make dust.
const DUST_COLORED = false
const DUST = {
  1: [3, 11, 27], 2: [4, 20, 22], 3: [5, 21, 13], 4: [6, 7, 13], 5: [7, 6, 15], 6: [13, 29, 1],
  7: [4, 9, 20], 8: [12, 28, 7], 9: [10, 9, 23], 10: [8, 24, 2], 11: [11, 27, 3], 12: [4, 20],
  14: [9, 10, 4], 15: [4, 20, 8], 16: [10, 28, 1], 17: [5, 21], 18: [12, 7], 19: [11, 14, 10, 27],
  20: [7, 15, 22], 21: [8, 7, 24], 22: [7, 15], 23: [3, 19, 27],
}
const TURN_EASE = 0.4                // how much of the way to her new direction she turns each frame (~4 frames to settle)
const RUN = 1.5                      // running speed (and step rate) compared with walking
const LEAN = 1.5, LEAN_MAX = 0.045   // lean into turns: roll per turn of turning per frame, and the most (turns)
const FLOWERS = 160                  // how many flowers to sprinkle over the grass
const FLOWER_COLORS = [14, 8, 10, 7, 13, 12]   // petal colors (the model's petals are color 14)
const DRAW_NEAR = 30                 // flowers and rocks further than this from Lumi aren't drawn
// What the Starries say. A Starry marker's yaw (in the Scene tab) picks its line here: yaw 0 says
// the first, yaw 1 the second, and so on. Words wrap to fit the box.
const STARRY_LINES = [
  "Welcome, star-keeper! The stars fell all over the islands. Bring them home to the Star Well!",
  "Every star you bring makes the Star Well glow. With 70 stars, something wonderful appears!",
  "Star doors open when the Star Well holds enough stars. Keep collecting!",
  "This castle is a maze! Climb the walls and look for stars up high.",
  "There's a grotto under the big island. Follow the stairs all the way down!",
  "The sky tower is very tall, but every step is small. You can do it!",
  "Shh! This is the star library. Every book here is about a different star.",
  "The big mushrooms make a staircase. Walk right up them!",
  "Press X to spin! Chests pop open, rocks go flying, and flowers twirl.",
]
const STARRY_COLORS = [10, 14, 12, 11, 9, 13]   // each Starry's color, by its line number
const TALK_NEAR = 1.5, TALK_FAR = 3  // a Starry starts talking within TALK_NEAR, and stops past TALK_FAR
const SKID = 18                      // frames a skid to a stop lasts (cosmetic: a lean forward and a puff of dust)
const SKID_LEAN = 0.06               // how far she tips forward when she skids (turns; more when running)
const NO_CLIMB = [17, 13]            // tiles Lumi never steps up onto: metal (rails, lamp posts) and lamps
const FADE = 0.7, ROOF_FADE = 1      // how see-through a prop gets when it hides Lumi; the library roof and wall vanish

let px, py, pz, vx = 0, vy = 0, vz = 0
let grounded = false, lift = 0, safe
let facing = 0, walk = 0, stepT = -1
let look = 0, lean = 0               // the way her model faces (easing toward facing), and her lean into turns (roll, in turns)
let movedFor = 0, skidT = -1, skidRun = false   // frames she's been moving; frames since a skid to a stop (-1: none)
let running = false, spinHeld = false   // running: the action button held on from a spin
let cam = null                       // where the camera looks, easing after Lumi
let camYaw = 0, camPitch = CAM_PITCH // the way the camera looks: north and down, unless you're looking around
let camK = CURVE, looking = false    // the roll (0 while looking around), and whether you are
let back = null                      // { yaw, pitch, k, t }: the camera easing back to its default view
let title = true, flash = 0, nearWell = false
let choosing = false                 // the character select screen, between the title and the game
let hero = 0, slide = 0              // the chosen hero (index into HEROES), and the carousel easing toward it
let M, ROOF                          // the observatory and the library roof (copies made by scene_load)
let doors = []                       // { m, need, state: 'shut' | 'opening' | 'open', t, at }: the star doors
let props = []                       // { m, corner, fade, most }: every map in the scene but the world
let close = []                       // the props close to Lumi this frame
let stars = []                       // { x, y, z, state: 'free' | 'carried' | 'flying' | 'home', t }
let carried = []                     // the stars following Lumi, in the order she found them
let home = 0, goal = 0               // stars in the well, and how many there are
let path = []                        // Lumi's recent positions, newest first, for the stars to follow
let ticks = 0, won = false, wonT = 0, best = null, best100 = null   // won: false, 'trophy' or 'diamond'
let finalState = 'hidden', finalT = 0   // the final stair: 'hidden', 'appearing', 'shown'
let trophy = null, diamond = null    // { x, y, z, got } from the scene's markers (vox 11 and 12)
let mFade = 0                        // the main island goes see-through while Lumi is under it
let spinT = 0, spinRest = 0, spunOnce = false   // the spin: frames left, frames until the next, and whether she has spun yet
let chests = []                      // { x, y, z, has: null | 'star' | 'key', broken }
let flowers = []                     // { x, y, z, c, yaw, shake, spin }: sprinkled on grass at random each game
let rocks = []                       // { x, y, z, yaw, flying, vx, vy, vz, tumble }: from the scene's rock markers (vox 14)
let starries = []                    // { x, y, z, line, face, spin }: from the scene's Starry markers (vox 15)
let talker = null, talkT = 0         // the Starry talking to Lumi, and frames since it started
let keys = [], keyCount = 0          // keys lying out ({ x, y, z, pop }), and keys Lumi has
let bits = []                        // flying bits: { x, y, z, vx, vy, vz, c, s, life }

function _init() {
  touch_set_mode(1)                  // on touch screens: an analog circle instead of the d-pad
  bg(17, 1)                          // a night sky: deep blue overhead, lighter at the horizon
  mouse_set_mode(2)                  // the mouse looks around, once captured by a click
  let s = scene_load(0)
  M = s.named.world; ROOF = s.named['library roof']
  // star doors: placements named "star door N" open once N stars are in the Star Well
  // star doors: placements named "star door N" open once N stars are in the Star Well. Placements
  // whose name starts with "final" (the final stair, the 100-star door) stay hidden until WELL_NEED.
  doors = Object.entries(s.named).filter(([n]) => /star door \d+/.test(n))
    .map(([n, m]) => ({ m, need: +n.match(/star door (\d+)/)[1], state: 'shut', t: 0, at: mtow(m, 2.5, 2, 0.5), final: n.startsWith('final') }))
  let FIN = s.named['final stair']
  props = s.maps.filter((m) => m != M && !doors.some((d) => d.m == m))
    .map((m) => ({ m, corner: mtow(m, 0, 0, 0), fade: 0, most: m == ROOF ? ROOF_FADE : FADE, final: m == FIN }))
  let mark = (v) => s.things.filter((t) => t[0] == v).map(([v, x, y, z]) => ({ x, y, z, got: false }))[0] || null
  trophy = mark(11); diamond = mark(12)
  finalState = 'hidden'; finalT = 0; mFade = 0
  stars = s.things.filter(([v]) => v == 3).map(([v, x, y, z]) => ({ x, y, z, state: 'free', t: 0, pop: 0 }))
  chests = s.things.filter(([v]) => v >= 4 && v <= 6)
    .map(([v, x, y, z]) => ({ x, y, z, has: [null, 'star', 'key'][v - 4], broken: false }))
  goal = stars.length + chests.filter((c) => c.has == 'star').length
  spinT = 0; spinRest = 0; spunOnce = false; keys = []; keyCount = 0; bits = []
  starries = s.things.filter(([v]) => v == 15).map(([v, x, y, z, yaw]) => ({ x, y, z, line: max(0, Math.round(yaw)), face: 0, spin: 0 }))
  talker = null; talkT = 0
  rocks = s.things.filter(([v]) => v == 14).map(([v, x, y, z, yaw]) => ({ x, y, z, yaw, flying: false, vx: 0, vy: 0, vz: 0, tumble: 0 }))
  sprinkleFlowers()
  carried = []; home = 0; path = []
  ticks = 0; won = false; wonT = 0
  let d = load()
  best = d ? d.best : null
  best100 = d ? d.best100 : null
  hero = d && d.hero < HEROES.length ? d.hero : 0      // the last hero chosen
  slide = hero; choosing = false
  ;[px, py, pz] = SPAWN
  safe = [...SPAWN]
  look = 0; lean = 0; running = false; spinHeld = false; movedFor = 0; skidT = -1
  cam = null; camYaw = 0; camPitch = CAM_PITCH; camK = CURVE; looking = false; back = null
  music(0, 2000)
}

// the maps Lumi can bump into right now: the world, the props near her, and doors still standing
function solid_maps() { return [M, ...close.map((p) => p.m), ...doors.filter((d) => d.state != 'open' && there(d)).map((d) => d.m)] }

// is this prop or door in the world yet? (the final ones only once the final stair is shown)
function there(p) { return !p.final || finalState == 'shown' }

function tile(x, y, z) {
  for (let m of solid_maps()) { let t = mgetw(m, x, y, z)[0]; if (t) return t }
  return 0
}
function solid(x, y, z) { return tile(x, y, z) > 0 }

function _update() {
  if (flash > 0) flash--
  if (title) {
    if (btnp(4) || btnp(5)) { title = false; choosing = true; sfx(6) }
    return
  }
  if (choosing) {                    // left / right turns the carousel, either button starts
    if (btnp(0)) { hero = (hero + HEROES.length - 1) % HEROES.length; sfx(0) }
    if (btnp(1)) { hero = (hero + 1) % HEROES.length; sfx(0) }
    if (btnp(4) || btnp(5)) { choosing = false; sfx(5); keep() }
    return
  }

  // the props near enough to touch (measured from each map's corner; the tower is the biggest, 21 blocks)
  close = props.filter((p) => there(p) && dist([px, pz], [p.corner[0], p.corner[2]]) < 60)

  // walking, relative to the way the camera faces: normally north (+z), so up is +z and
  // right on screen is -x; while the camera eases back after looking around, it turns with it
  // An analog stick reaches full speed at half tilt (FULL_TILT), so a thumb on a phone's circle
  // doesn't have to reach the rim; less than that walks slower. Digital input is always full.
  let [sx, sy] = stick(0), push = sqrt(sx * sx + sy * sy)
  if (push > 0) { let k = min(push / FULL_TILT, 1) / push; sx *= k; sy *= k }
  let [fx, , fz] = dir3(camYaw)
  let speed = 0.085 * (running ? RUN : 1)
  let ax = (fx * -sy - fz * sx) * speed, az = (fz * -sy + fx * sx) * speed
  vx = lerp(vx, ax, 0.3); vz = lerp(vz, az, 0.3)
  let pace = min(push / FULL_TILT, 1)          // 1 at full speed
  let moving = abs(ax) + abs(az) > 0.01
  if (moving) { facing = yaw_to(ax, az); walk += max(pace, 0.4) * (running ? RUN : 1) } else walk = 0   // slower walking, slower steps

  // her model turns toward the way she's going over a few frames instead of snapping (a d-pad
  // jumps 90 degrees at once), and leans into the turn while she's walking or running
  let before = look
  look += angdiff(look, facing) * TURN_EASE
  let turning = angdiff(before, look)          // turns this frame; + is toward her left

  // stopping short after walking a bit: she skids (just for show: her movement is unchanged)
  if (moving) movedFor++
  else {
    if (movedFor > 10 && grounded && spinT == 0) skid()
    movedFor = 0
  }
  if (skidT >= 0 && ++skidT > SKID) skidT = -1
  lean = lerp(lean, moving ? mid(-LEAN_MAX, -turning * LEAN * (running ? 1.3 : 1), LEAN_MAX) : 0, 0.3)

  // looking around: only while standing still. Walking eases the camera back to its default
  // view, roll and all, over one second (BACK frames).
  let [mx, my] = mouse_delta(), [rx, ry] = stick(1)
  let turn = mx * 0.0012 + rx * 0.012, tilt = my * 0.0012 + ry * 0.008
  if (moving && looking) { looking = false; back = { yaw: camYaw, pitch: camPitch, k: camK, t: 0 } }
  else if (!moving && (turn || tilt)) { looking = true; back = null; camYaw -= turn; camPitch = mid(0, camPitch + tilt, 0.22) }
  if (looking) camK = lerp(camK, 0, 0.08)      // unroll gently while looking
  if (back) {
    let f = min(++back.t / BACK, 1)
    f = f * f * (3 - 2 * f)                   // ease in and out
    camYaw = lerp(back.yaw, back.yaw + angdiff(back.yaw, 0), f)
    camPitch = lerp(back.pitch, CAM_PITCH, f)
    camK = lerp(back.k, CURVE, f)
    if (back.t >= BACK) { back = null; camYaw = 0 }
  }

  vy = max(vy - 0.012, -0.5)
  px += vx; py += vy; pz += vz

  // climb 1-block steps: if the block just ahead at foot height is solid and the one
  // above it is free, pop up a block (drawn smoothly with `lift`)
  if (grounded && moving) {
    let m = sqrt(ax * ax + az * az), hx = px + ax / m * (R + 0.15), hz = pz + az / m * (R + 0.15)
    let fy = py - R + 0.5
    let t = tile(hx, fy, hz)
    if (t && !NO_CLIMB.includes(t) && !solid(hx, fy + 1, hz) && !solid(px, fy + 1.5, pz)) { py += 1; lift -= 1 }
  }
  lift *= 0.7

  // collision: push out of the map, and learn whether we're standing on it
  let was = grounded, fall = vy
  let [x, y, z, nx, ny, nz, ground] = mpush(solid_maps(), px, py, pz, R)
  px = x; py = y; pz = z
  grounded = ground >= 0
  if (grounded && vy < 0) vy = 0
  if (ny < -0.5 && vy > 0) vy = 0                // bumped a ceiling
  if (grounded && !was && fall < -0.15) sfx(2, 1)
  if (grounded) safe = [px, py + 0.3, pz]

  pushChests()

  // spinning: X or O. Lumi can still walk while she spins.
  if (spinRest > 0) spinRest--
  if (spinT > 0 && --spinT == 0) spinRest = SPIN_REST
  // running: keep holding the button after a spin and she runs once the spin is over
  if (!(btn(4) || btn(5))) spinHeld = false
  if ((btnp(4) || btnp(5)) && spinT == 0 && spinRest == 0) {
    spinT = SPIN; spunOnce = true; spinHeld = true; sfx(15, 1)
    for (let i = 0; i < 28; i++) {    // a burst of white flecks flung out as the spin starts
      let a = i / 28 + rnd(0.02), sp = 0.2 + rnd(0.1)
      bits.push({ x: px + sin(a) * 0.3, y: py - R + 0.3 + rnd(0.7), z: pz + cos(a) * 0.3,
        vx: sin(a) * sp, vy: rnd(0.04) - 0.01, vz: cos(a) * sp, c: 7, s: 0.16 + rnd(0.08), life: 12 + flr(rnd(6)), g: 0, drag: 0.82 })
    }
  }
  running = spinHeld && spinT == 0
  if (spinT > 0) {
    for (let c of chests) {
      if (!c.broken && dist([px, pz], [c.x, c.z]) < SPIN_REACH + 0.5 && abs(py - R - c.y) < 1.5) breakChest(c)
    }
    for (let k of rocks) {
      if (!k.flying && dist([px, pz], [k.x, k.z]) < SPIN_REACH + 0.3 && abs(py - R - k.y) < 1.2) launchRock(k)
    }
    for (let st of starries) {                  // Starries twirl along too
      if (st.spin == 0 && dist([px, pz], [st.x, st.z]) < SPIN_REACH + 0.5 && abs(py - R - st.y) < 2) {
        st.spin = spinT; sparkle(st.x, st.y + 1.1, st.z, 8)
      }
    }
    for (let f of flowers) {                    // flowers caught in the spin twirl with her
      if (f.spin == 0 && dist([px, pz], [f.x, f.z]) < SPIN_REACH + 0.5 && abs(py - R - f.y) < 1.2) {
        f.spin = spinT; petals(f, 10, 0.07)
      }
    }
    if (spinT % 2 == 0) {            // a trail of sparkles flung off the spin
      let a = rnd(1)
      bits.push({ x: px + sin(a) * 0.7, y: py - R + 0.4 + rnd(0.8), z: pz + cos(a) * 0.7,
        vx: sin(a) * 0.04, vy: 0.02, vz: cos(a) * 0.04, c: rnd([10, 7, 12, 23]), s: 0.12, life: 24, g: 0 })
    }
  }

  updateBits()
  updateFlowers(moving)
  updateRocks()
  updateStarries()

  // keys: pop out of a chest, then Lumi picks them up by touching them
  for (let k of keys) if (k.pop > 0) k.pop--
  keys = keys.filter((k) => {
    if (k.pop == 0 && dist([px, pz], [k.x, k.z]) < 1 && abs(py - R - k.y) < 1.5) { keyCount++; sfx(17, 3); return false }
    return true
  })

  // footsteps
  if (grounded && moving) {          // one footstep per step, with a little dust kicked up behind her
    let n = flr(walk / STEP)
    if (n != stepT) { sfx(0, 2); stepT = n; kickDust() }
  } else stepT = -1

  // fell off the edge: back to the last safe spot
  if (py < -8) { ;[px, py, pz] = safe; vx = vy = vz = 0; flash = 20; sfx(4, 1) }

  if (won != 'diamond') ticks++
  if (won) wonT++

  // Lumi's path, for the stars following her
  path.unshift([px, py - R + lift, pz])
  if (path.length > TRAIL * (goal + 1)) path.pop()

  // touching a star: it starts following her
  for (let st of stars) {
    if (st.pop > 0) st.pop--
    if (st.state == 'free' && st.pop == 0 && dist([px, pz], [st.x, st.z]) < 1.1 && abs(py - st.y) < 1.8) {
      st.state = 'carried'; carried.push(st); sfx(6, 3)
    }
  }

  // star doors: once enough stars are in the well, a door opens as Lumi comes near
  // the trophy and the diamond, on the final platform
  if (finalState == 'shown') {
    if (trophy && !trophy.got && dist([px, py - R, pz], [trophy.x, trophy.y, trophy.z]) < 1.4) { trophy.got = true; win('trophy') }
    if (diamond && !diamond.got && dist([px, py - R, pz], [diamond.x, diamond.y, diamond.z]) < 1.6) { diamond.got = true; win('diamond') }
  }

  // under the main island, it turns see-through so Lumi can be seen
  let under = py < 12 && dist([px, pz], [WELL[0], WELL[2]]) < 37
  mFade = lerp(mFade, under ? 0.85 : 0, 0.12)

  for (let d of doors) {
    if (!there(d)) continue
    if (d.state == 'shut' && home >= d.need && dist([px, py, pz], d.at) < 4.5) openDoor(d)
  }

  // at the Star Well: every star she carries flies in, one after another
  let d = dist([px, 0, pz], [WELL[0], 0, WELL[2]])
  let near = d < 4 && abs(py - WELL[1]) < 2
  if (near && !nearWell && carried.length == 0 && !won) sfx(3, 3)
  nearWell = near
  if (near && carried.length) {
    carried.forEach((st, i) => {
      st.state = 'flying'; st.t = -i * 12
      st.from = trailSpot(i)
    })
    carried = []
  }
  for (let st of stars) {
    if (st.state != 'flying') continue
    if (++st.t >= 40) {
      st.state = 'home'; home++; sfx(7, 3)
      if (home == WELL_NEED) appearFinal()
    }
  }
}

// How far round the spin has turned, f from 0 to 1: fast at the start (1.7 times the average
// rate), slowing to 0.3 times it by the end. The hero turns 2 x this, the sparkle ring 1.2 x this.
function spinTurn(f) { return 0.3 * f + 0.7 * (1 - (1 - f) * (1 - f)) }

// How far the spin's sparkle stars are from Lumi, f from 0 (spin starts) to 1 (ends): they burst
// out, overshoot a little and settle (ease-out-back), hold there, then zip back in, faster and faster.
function sparkleRadius(f) {
  const RMAX = 1.5, OUT = 0.4, IN = 0.72
  if (f < OUT) {
    let t = f / OUT - 1, c = 2.2
    return RMAX * (1 + (c + 1) * t * t * t + c * t * t)
  }
  if (f < IN) return RMAX
  let t = (f - IN) / (1 - IN)
  return RMAX * (1 - t * t * t)
}

// A skid: she tips forward and a puff of dust flies up in front of her feet.
function skid() {
  skidT = 0; skidRun = running
  let [fx, , fz] = dir3(look), n = running ? 9 : 6
  for (let i = 0; i < n; i++) {
    let side = rnd(0.6) - 0.3, sp = 0.03 + rnd(0.04)
    bits.push({ x: px + fx * 0.45 - fz * side, y: py - R + 0.05, z: pz + fz * 0.45 + fx * side,
      vx: fx * sp + rnd(0.02) - 0.01, vy: 0.03 + rnd(0.04), vz: fz * sp + rnd(0.02) - 0.01,
      c: 7, s: 0.12 + rnd(0.08), life: 16 + flr(rnd(8)), g: 0.004, drag: 0.9 })
  }
}

// The tile under Lumi's feet (0 if none), from the world and the props near her.
function ground() { return tile(px, py - R - 0.3, pz) }

// A few bits of whatever she's walking on, kicked up and back from her heel.
function kickDust() {
  let cols = DUST[ground()]
  if (!cols) return
  if (!DUST_COLORED) cols = [7]
  let [bx, , bz] = dir3(facing)
  for (let i = 0; i < 4; i++) {
    bits.push({ x: px - bx * 0.2 + rnd(0.3) - 0.15, y: py - R + 0.05, z: pz - bz * 0.2 + rnd(0.3) - 0.15,
      vx: -bx * (0.02 + rnd(0.02)) + rnd(0.02) - 0.01, vy: 0.04 + rnd(0.04), vz: -bz * (0.02 + rnd(0.02)) + rnd(0.02) - 0.01,
      c: rnd(cols), s: 0.13 + rnd(0.08), life: 20 + flr(rnd(10)), g: 0.006 })
  }
}

// How far below Lumi's feet the floor is (for her shadow), looking down in the world and nearby props.
// (Lumi's, by default; or any point's, like a flying rock's)
function floorBelow(x = px, y = py, z = pz) {
  let best = 40
  for (let m of [M, ...close.map((p) => p.m)]) {
    let h = mray(m, x, y, z, 0, -1, 0, 40)
    if (h[0]) best = min(best, h[7])
  }
  return best
}

// Flowers: sprinkled at random on grass (tile 1) all over, wherever there's room above.
function sprinkleFlowers() {
  flowers = []
  let maps = [M, ...props.filter((p) => !p.final).map((p) => p.m)]
  for (let tries = 0; tries < FLOWERS * 8 && flowers.length < FLOWERS; tries++) {
    let x = flr(rnd(140)) - 6 + 0.5, z = flr(rnd(140)) - 6 + 0.5, best = null
    for (let m of maps) {                      // the highest floor in this column, over every map
      let h = mray(m, x, 70, z, 0, -1, 0, 120)
      if (h[0] && (!best || h[7] < best[7])) best = h
    }
    if (!best || best[0] != 1) continue        // grass only
    let y = 70 - best[7]
    if (dist([x, z], [WELL[0], WELL[2]]) < 9) continue
    flowers.push({ x: x + rnd(0.5) - 0.25, y, z: z + rnd(0.5) - 0.25, c: rnd(FLOWER_COLORS), yaw: rnd(1), shake: 0, spin: 0 })
  }
}

// a few petals (and a leaf or two) flung from a flower
function petals(f, n, sp) {
  for (let i = 0; i < n; i++) {
    let a = rnd(1)
    bits.push({ x: f.x, y: f.y + 0.35, z: f.z, vx: sin(a) * sp * rnd(1), vy: 0.04 + rnd(0.05), vz: cos(a) * sp * rnd(1),
      c: i % 3 ? f.c : 11, s: 0.07 + rnd(0.05), life: 20 + flr(rnd(12)), g: 0.006 })
  }
}

// Walking or running through a flower shakes it and knocks off a petal or two; spinning
// next to one sets it twirling along with her.
function updateFlowers(moving) {
  for (let f of flowers) {
    if (f.shake > 0) f.shake--
    if (f.spin > 0) {
      f.spin--; f.yaw += 0.09 * (f.spin / SPIN + 0.2)
      if (f.spin % 4 == 0) petals(f, 1, 0.05)
    }
    if (moving && grounded && f.shake == 0 && abs(px - f.x) < 0.55 && abs(pz - f.z) < 0.55 && abs(py - R - f.y) < 0.6) {
      f.shake = 18; petals(f, 3, 0.03)
      if (rnd(1) < 0.5) sfx(19, 3)
    }
  }
}

// Starries: they float in place, turn to look at Lumi when she's near, twirl in her spin,
// and talk when she comes close: their words appear a letter a frame.
function updateStarries() {
  for (let st of starries) {
    let d = dist([px, pz], [st.x, st.z])
    if (st.spin > 0) {
      st.spin--; st.face += 0.09 * (st.spin / SPIN + 0.2)
      if (st.spin % 4 == 0) sparkle(st.x, st.y + 1.1, st.z, 1)
    } else if (d < 5 && abs(py - R - st.y) < 3) {
      st.face += angdiff(st.face, yaw_to(px - st.x, pz - st.z)) * 0.15
    }
  }
  if (talker && (dist([px, pz], [talker.x, talker.z]) > TALK_FAR || abs(py - R - talker.y) > 3)) talker = null
  let near = starries.filter((st) => dist([px, pz], [st.x, st.z]) < TALK_NEAR && abs(py - R - st.y) < 2)
    .sort((a, b) => dist([px, pz], [a.x, a.z]) - dist([px, pz], [b.x, b.z]))[0]
  if (near && near != talker) { talker = near; talkT = 0 }
  if (talker) {                      // a letter a frame; the blip every 6 frames
    talkT++
    let text = STARRY_LINES[talker.line] || ''
    if (talkT <= text.length && talkT % 6 == 0 && text[talkT - 1] != ' ') sfx(22, 3)
  }
}

// a little burst of star-colored sparkles
function sparkle(x, y, z, n) {
  for (let i = 0; i < n; i++) {
    let a = rnd(1)
    bits.push({ x, y, z, vx: sin(a) * 0.04, vy: 0.01 + rnd(0.04), vz: cos(a) * 0.04,
      c: rnd([10, 23, 7, 12]), s: 0.08 + rnd(0.06), life: 20 + flr(rnd(10)), g: 0 })
  }
}

// words wrapped into lines of at most w characters
function wrap(text, w) {
  let lines = [''], words = text.split(' ')
  for (let wd of words) {
    let cur = lines[lines.length - 1]
    if (cur.length && cur.length + 1 + wd.length > w) lines.push(wd)
    else lines[lines.length - 1] = cur.length ? cur + ' ' + wd : wd
  }
  return lines
}

// A rock in a spin's reach bounces away from Lumi; it breaks where it lands.
function launchRock(k) {
  let dx = k.x - px, dz = k.z - pz, d = sqrt(dx * dx + dz * dz)
  if (d < 0.05) { ;[dx, , dz] = dir3(look); d = 1 }
  k.flying = true; k.vx = dx / d * 0.11; k.vz = dz / d * 0.11; k.vy = 0.2; k.ground = k.y
  sfx(20, 2)
}

function updateRocks() {
  rocks = rocks.filter((k) => {
    if (!k.flying) return true
    k.x += k.vx; k.y += k.vy; k.z += k.vz; k.vy -= 0.014; k.tumble += 0.06
    if (k.y < -40) return false                       // off the edge of the world
    if (k.vy < 0 && solid(k.x, k.y, k.z)) {          // hit the ground: crumble
      let top = flr(k.y) + 1
      for (let i = 0; i < 14; i++) {
        let a = rnd(1), sp = 0.03 + rnd(0.05)
        bits.push({ x: k.x, y: top + 0.1, z: k.z, vx: sin(a) * sp, vy: 0.05 + rnd(0.08), vz: cos(a) * sp,
          c: rnd([5, 6, 13, 21, 22]), s: 0.1 + rnd(0.1), life: 22 + flr(rnd(12)), g: 0.012 })
      }
      for (let i = 0; i < 4; i++) bits.push({ x: k.x, y: top + 0.2, z: k.z, vx: rnd(0.03) - 0.015, vy: 0.02,
        vz: rnd(0.03) - 0.015, c: 6, s: 0.3, life: 18, g: 0 })     // a puff of dust
      sfx(21, 2)
      return false
    }
    return true
  })
}

// flying bits: wood from chests, sparkles, dust
function updateBits() {
  for (let b of bits) {
    b.x += b.vx; b.y += b.vy; b.z += b.vz; b.vy -= b.g; b.life--
    if (b.drag) { b.vx *= b.drag; b.vy *= b.drag; b.vz *= b.drag }
  }
  bits = bits.filter((b) => b.life > 0)
}

// A star door opening: time stops for a second (freeze) while the door fades away in a shower
// of rising yellow sparkles; then it's gone for good.
function openDoor(d) {
  d.state = 'opening'; d.t = 0; sfx(18, 3)
  freeze(DOOR_TIME, () => {
    d.t++
    for (let i = 0; i < 4; i++) {
      let [x, y, z] = mtow(d.m, rnd(5), rnd(5), rnd(1))
      bits.push({ x, y, z, vx: rnd(0.04) - 0.02, vy: 0.02 + rnd(0.04), vz: rnd(0.04) - 0.02,
        c: rnd([10, 10, 9, 23, 7]), s: 0.1 + rnd(0.1), life: 25 + flr(rnd(15)), g: -0.001 })
    }
    updateBits()
    if (d.t >= DOOR_TIME) d.state = 'open'
  })
}

// Chests are solid, like a block: push Lumi out sideways (she can't climb onto one).
function pushChests() {
  let w = 0.5 + R
  for (let c of chests) {
    if (c.broken || py - R > c.y + 0.9 || py + R < c.y) continue
    let dx = px - c.x, dz = pz - c.z, ex = w - abs(dx), ez = w - abs(dz)
    if (ex > 0 && ez > 0) {
      if (ex < ez) { px = c.x + sgn(dx) * w; vx = 0 } else { pz = c.z + sgn(dz) * w; vz = 0 }
    }
  }
}

// A chest breaks into flying planks; what was inside pops out.
function breakChest(c) {
  c.broken = true; sfx(16, 2)
  for (let i = 0; i < 16; i++) {
    let a = rnd(1), sp = 0.04 + rnd(0.06)
    bits.push({ x: c.x + rnd(0.8) - 0.4, y: c.y + rnd(0.8), z: c.z + rnd(0.8) - 0.4,
      vx: sin(a) * sp, vy: 0.08 + rnd(0.1), vz: cos(a) * sp, c: rnd([4, 4, 20, 9, 10]), s: 0.15 + rnd(0.15), life: 40, g: 0.012 })
  }
  for (let i = 0; i < 6; i++) bits.push({ x: c.x, y: c.y + 0.4, z: c.z, vx: rnd(0.04) - 0.02, vy: 0.03,
    vz: rnd(0.04) - 0.02, c: 7, s: 0.35, life: 20, g: 0 })      // a puff of dust
  if (c.has == 'star') stars.push({ x: c.x, y: c.y + 0.7, z: c.z, state: 'free', t: 0, pop: 30 })
  if (c.has == 'key') keys.push({ x: c.x, y: c.y, z: c.z, pop: 30 })
}

// save the best times (to the trophy, and to the diamond) and the hero last chosen
function keep() { save({ best: best, best100: best100, hero: hero }) }

// kind: 'trophy' (the end of the game) or 'diamond' (all 100 stars: the special ending)
function win(kind) {
  won = kind; wonT = 0; sfx(14, 3)
  let s = ticks / 60
  if (kind == 'trophy' && (best == null || s < best)) best = s
  if (kind == 'diamond' && (best100 == null || s < best100)) best100 = s
  keep()
}

// WELL_NEED stars in the well: the final stair fades in over a second while time stands still,
// sparkles drifting down onto it (the star door's vanishing, backwards)
function appearFinal() {
  finalState = 'appearing'; finalT = 0; sfx(18, 3)
  let fp = props.find((p) => p.final)
  freeze(FINAL_TIME, () => {
    finalT++
    for (let i = 0; fp && i < 6; i++) {
      for (let tries = 0; tries < 12; tries++) {           // a random block of the stair
        let x = flr(rnd(FINAL_SIZE[0])), y = flr(rnd(FINAL_SIZE[1])), z = flr(rnd(FINAL_SIZE[2]))
        if (!mget(fp.m, x, y, z)) continue
        let [wx, wy, wz] = mtow(fp.m, x + rnd(1), y + 1, z + rnd(1))
        bits.push({ x: wx, y: wy + 1.5 + rnd(1.5), z: wz, vx: 0, vy: -0.05 - rnd(0.03), vz: 0,
          c: rnd([10, 10, 9, 23, 7]), s: 0.1 + rnd(0.1), life: 30 + flr(rnd(10)), g: 0 })
        break
      }
    }
    updateBits()
    if (finalT >= FINAL_TIME) finalState = 'shown'
  })
}

// where the i-th following star is: on Lumi's path, a little behind her and above the ground
function trailSpot(i) {
  let p = path[min(path.length - 1, (i + 1) * TRAIL)] || [px, py, pz]
  return [p[0], p[1] + 1.2 + sin(time() * 1.5 + i * 0.3) * 0.15, p[2]]
}

// the stars in the well circle the big star; the k-th of n
function ringSpot(k, n) {
  let a = k / max(n, 1) + time() * 0.05
  return [WELL[0] + sin(a) * 2.6, WELL[1] + 3 + cos(time() * 0.4 + k) * 0.3, WELL[2] + cos(a) * 2.6]
}

// Any prop between the camera and Lumi fades to 70% see-through, the library roof and wall to
// nothing (and back when she's clear of it).
// Two lines of sight, from her feet and from her head, so half-hidden counts too. They run a few
// blocks past the camera, so a prop the camera is inside (like the hollow library roof) counts.
function seeThrough() {
  let [dx, dy, dz] = dir3(camYaw, -camPitch)
  let c = [cam[0] - dx * CAM_DIST, cam[1] - dy * CAM_DIST, cam[2] - dz * CAM_DIST]
  for (let p of props) {
    let hit = false
    if (there(p) && dist([px, pz], [p.corner[0], p.corner[2]]) < 60) {
      for (let h of [0.3, 1.3]) {
        let o = [px, py - R + lift + h, pz], v = [c[0] - o[0], c[1] - o[1], c[2] - o[2]], len = dist(o, c)
        if (mray(p.m, ...o, ...v, len + 3)[0]) hit = true    // a little past the camera: inside a prop counts too
      }
    }
    p.fade = lerp(p.fade, hit ? p.most : 0, 0.15)
  }
}

// The character select screen: the heroes stand on big stars in a row, the chosen one in front,
// walking in place; the others stand further back, dimmed. The row slides when you choose.
function drawSelect() {
  slide = lerp(slide, hero, 0.2)
  const C = [63.5, 60, 40]                     // high in the sky, away from the world
  cam_set_curve(0)
  cam_set_pos([C[0], C[1] + 1.8, C[2] - 4.6])
  cam_set_lookat([C[0], C[1] + 1.1, C[2]])
  outline(0)
  for (let i = 0; i < HEROES.length; i++) {
    let k = i - slide, near = max(0, 1 - abs(k))
    let x = C[0] - k * 3.6, z = C[2] + abs(k) * 2.4, y = C[1] + sin(time() * 0.8 + i) * 0.05
    outline(9, false)
    vox(3, x, y - 0.2, z, 0.25, time() * 0.1, 0, 2.1)       // a big star to stand on, lying flat
    outline(0)
    if (near < 0.5) fillp(0.5, 1)                            // the heroes not chosen, dimmed
    let frame = near > 0.5 ? [1, 0, 2, 0][flr(time() * 60 / (STEP / 2)) % 4] : 0
    vox(HEROES[i].vox + frame, x, y + 0.15, z, 0, 0.5 + sin(time() * 0.5 + i) * 0.06, 0, 1.6 + near * 0.4)
    fillp()
  }
  outline()
  printc('Choose your star-keeper', 22, 10, 1)
  printc(HEROES[hero].name, 200, 7, 1, 2)
  if (HEROES.length > 1) {
    let w = sin(time() * 2) * 2
    print('<', 14 - w, 112, 7, 1, 2); print('>', 230 + w, 112, 7, 1, 2)
  }
  if (time() % 1 < 0.6) printc('Press X to begin', 232, 12, 1)
}

function fmt(s) { return flr(s / 60) + ':' + ('0' + flr(s % 60)).slice(-2) }

function _draw() {
  if (choosing) return drawSelect()
  // the camera: fixed, always looking north and down at Lumi, easing after her. On the title
  // card it looks down at the whole observatory, flat. In play the world rolls away ahead.
  if (title) {
    cam_set_curve(0)
    cam_orbit([63.5, 22, 63.5], time() * 0.015, -0.11, 76)
  } else {
    let t = [px, py + 0.6 + lift, pz]
    cam = cam ? lerp(cam, t, 0.15) : t
    cam_set_curve(camK)
    cam_orbit(cam, camYaw, -camPitch, CAM_DIST)
    seeThrough()
  }

  outline(0)
  if (flash > 0) for (let i = 0; i < 32; i++) pal(i, 7)
  if (mFade > 0.02) fillp(mFade, -1)
  map(M)
  fillp()
  let appear = 1 - finalT / FINAL_TIME     // how see-through the final things still are while appearing
  for (let p of props) {
    if (title) p.fade = 0
    if (p.final && finalState == 'hidden') continue
    if (p.fade > 0.98) continue      // faded out completely
    if (p.final && finalState == 'appearing') fillp(appear, -1)
    else if (p.fade > 0.02) fillp(p.fade, -1)
    map(p.m, true)                   // backs too, so a prop the camera is inside still shows (see-through)
    fillp()
  }
  for (let d of doors) {
    if (d.state == 'open' || (d.final && finalState == 'hidden')) continue
    if (d.state == 'opening') fillp(min(1, d.t / DOOR_TIME), -1)
    else if (d.final && finalState == 'appearing') fillp(appear, -1)
    map(d.m)
    fillp()
  }
  // the trophy and the diamond, turning slowly over the final platform
  if (finalState != 'hidden') {
    if (finalState == 'appearing') fillp(appear, -1)
    outline(9, false)
    if (trophy && !trophy.got) vox(11, trophy.x, trophy.y + 0.2 + sin(time() * 0.7) * 0.15, trophy.z, 0, time() * 0.3, 0, 1.8)
    outline(12, false)
    if (diamond && !diamond.got) vox(12, diamond.x, diamond.y + 1.3 + sin(time() * 0.6) * 0.2, diamond.z, 0, time() * 0.4, 0, 2.2)
    outline(0); fillp()
  }
  pal()

  // the big star turning over the Star Well; it grows as the stars come home
  outline(9, false)
  let big = 2 + home / max(goal, 1) * 1.2 + (won ? sin(time() * 2) * 0.2 : 0)
  vox(3, WELL[0], WELL[1] + 3 + sin(time() * 0.5) * 0.25, WELL[2], 0, time() * 0.15, 0, big)

  // the stars: waiting (with a beam of light so they can be seen from far away),
  // following Lumi, flying to the well, or circling it
  let k = 0
  for (let st of stars) {
    let p, s = 0.7
    if (st.state == 'free' && st.pop > 0) {      // just out of a chest: it pops up and grows
      let f = 1 - st.pop / 30
      p = [st.x, st.y - 0.5 + sin(f * 0.5) * 1.3, st.z]; s = 0.7 * f
    } else if (st.state == 'free') {
      p = [st.x, st.y + sin(time() + st.x) * 0.12, st.z]
      if (!title && st.pop == 0) line3(st.x, st.y - 0.6, st.z, st.x, st.y + 7, st.z, 10)
    } else if (st.state == 'carried') {
      p = trailSpot(carried.indexOf(st)); s = 0.5
    } else if (st.state == 'flying') {
      let f = mid(0, st.t / 40, 1), to = ringSpot(k, goal)
      p = lerp(st.from, to, f); p[1] += sin(f * 0.5) * 3; s = 0.5
    } else {
      p = ringSpot(k++, goal); s = 0.5
    }
    if (st.state == 'flying') k++
    vox(3, p[0], p[1], p[2], 0, time() * 0.4, 0, s)
  }
  outline(0)

  // chests, and keys waiting to be picked up
  for (let c of chests) if (!c.broken) vox(4, c.x, c.y, c.z)

  // Starries, floating and bobbing, each in its own color
  if (!title) {
    for (let st of starries) {
      if (abs(st.x - px) > DRAW_NEAR || abs(st.z - pz) > DRAW_NEAR) continue
      let hop = st.spin > 0 ? sin((1 - st.spin / SPIN) * 0.5) * 0.7 : 0   // a little bounce while it twirls
      pal(10, STARRY_COLORS[st.line % STARRY_COLORS.length])
      outline(7, false)                     // a white outline so they stand out
      vox(15, st.x, st.y + 1.1 + hop + sin(time() * 0.7 + st.x) * 0.12, st.z, 0, st.face, 0, 0.8)
      outline(0)
      pal()
    }
  }

  // flowers (shaking when walked through, twirling in a spin) and rocks (tumbling when flung)
  if (!title) {
    for (let f of flowers) {
      if (abs(f.x - px) > DRAW_NEAR || abs(f.z - pz) > DRAW_NEAR) continue
      let roll = f.shake > 0 ? sin(f.shake * 0.11) * 0.06 * f.shake / 18 : 0
      pal(14, f.c)
      vox(13, f.x, f.y, f.z, 0, f.yaw, roll)
      pal()
    }
    for (let k of rocks) {
      if (abs(k.x - px) > DRAW_NEAR || abs(k.z - pz) > DRAW_NEAR) continue
      vox(14, k.x, k.y, k.z, k.tumble, k.yaw + k.tumble * 0.5, 0)
      if (k.flying) {                          // a flat black shadow on the floor below a flying rock
        let below = floorBelow(k.x, k.y + 0.25, k.z)
        if (below < 40) {
          outline()
          for (let i = 0; i < 32; i++) pal(i, 0)
          vox(14, k.x, k.y + 0.25 - below + 0.03, k.z, 0, k.yaw + k.tumble * 0.5, 0, 1, 0.01, 1)
          pal(); outline(0)
        }
      }
    }
  }
  for (let k of keys) {
    let f = k.pop > 0 ? 1 - k.pop / 30 : 1
    let y = k.y + 0.4 + (k.pop > 0 ? sin(f * 0.5) * 1.3 : 0.6 + sin(time() * 2) * 0.1)
    vox(7, k.x, y, k.z, 0, time() * 0.5, 0, 0.7 * f)
  }

  // the hero (Lumi or Lumo): spinning, she turns twice round and squashes a little; a ring of sparkles circles her
  if (!title) {
    let frame = !grounded ? 1 : walk == 0 ? 0 : [1, 0, 2, 0][flr(walk / (STEP / 2)) % 4]
    let yaw = look, sq = 1, bob = 0
    if (walk > 0 && grounded) {
      // walking: her shoulders twist with each stride, and each step is a little hop: squashed as
      // the foot lands, then springing up tall through the middle of the step (not a sine)
      let u = (walk % STEP) / STEP              // 0 at a foot landing, to 1 just before the next
      let side = flr(walk / STEP) % 2 ? -1 : 1 // which foot is forward
      yaw += side * 0.035 * (1 - (2 * u - 1) ** 2)   // twist out and back once per step
      let hop = 4 * u * (1 - u)                 // a parabola: 0 at landing, 1 mid-step
      sq = 1 + 0.07 * hop - 0.14 * Math.exp(-u * 9)  // stretch mid-step, quick squash on landing
      bob = 0.06 * hop
    }
    if (spinT > 0) {
      let f = 1 - spinT / SPIN
      yaw = look + spinTurn(f) * 2; sq = 1 - sin(f * 0.5) * 0.15
      frame = 0
    }
    let wide = 1.4 / sqrt(sq)                   // keep her volume: taller is thinner
    // her shadow: the same model squashed flat and drawn all black, on the floor below her
    let below = floorBelow()
    if (below < 40) {
      outline()
      for (let i = 0; i < 32; i++) pal(i, 0)
      vox(HEROES[hero].vox + frame, px, py - below + 0.03, pz, 0, yaw, 0, wide * 1.05, 0.01, wide * 1.05)
      pal(); outline(0)
    }
    // a skid: tip forward quickly (over 4 frames), then ease back upright (pitch: - leans forward)
    let tip = skidT >= 0 && spinT == 0 ? -SKID_LEAN * (skidRun ? 1.4 : 1) * sin(min(1, skidT / 4) * 0.25) * (1 - skidT / SKID) : 0
    vox(HEROES[hero].vox + frame, px, py - R + lift + bob, pz, tip, yaw, spinT > 0 ? 0 : lean, wide, 1.4 * sq, wide)
    if (spinT > 0) {
      // five sparkle stars circle her the way she turns, a bit slower than she does (fast enough
      // and they'd seem to turn backwards, like wagon wheels on film)
      let f = 1 - spinT / SPIN, r = sparkleRadius(f)
      outline(9, false)
      for (let i = 0; i < 5; i++) {
        let a = i / 5 + spinTurn(f) * 1.2
        vox(3, px + sin(a) * r, py - R + lift + 0.5 + sin(a * 2 + f) * 0.2, pz + cos(a) * r, 0, a, 0, 0.36 * min(1, r / 0.6 + 0.2))
      }
      outline(0)
    }
  }
  outline()

  // flying bits
  for (let b of bits) cube(b.x, b.y, b.z, b.s * min(1, b.life / 10), b.c)

  if (title) {
    printc('Star', 54, 10, 1, 3)
    printc('Observatory', 86, 7, 1, 2)
    printc('Light the Star Well with ' + WELL_NEED + ' stars', 150, 12, 1)
    if (best != null) printc('Best ' + fmt(best) + (best100 != null ? '   All stars ' + fmt(best100) : ''), 168, 10, 1)
    if (time() % 1 < 0.6) printc('Press X to start', 200, 7, 1)
    return
  }

  print('Stars ' + home + '/' + (home < WELL_NEED ? WELL_NEED : goal), 4, 4, 10, 1)
  if (carried.length) print('Carrying ' + carried.length, 4, 16, 7, 1)
  if (keyCount) print('Keys ' + keyCount, 4, carried.length ? 28 : 16, 23, 1)
  let chestNear = chests.some((c) => !c.broken && dist([px, pz], [c.x, c.z]) < 3)
  if (chestNear && !spunOnce && !talker) printc('Press X to spin!', 214, 10, 1)
  for (let d of doors) {
    if (talker) break
    if (d.state == 'shut' && home < d.need && dist([px, py, pz], d.at) < 4.5)
      printc('Star door: ' + d.need + ' stars needed (' + home + '/' + d.need + ')', 200, 10, 1)
  }
  print(fmt(ticks / 60), 252 - textw(fmt(ticks / 60)), 4, 7, 1)
  if (!mouse_locked() && !looking && time() < 25 && !talker) printc('Stand still, drag to look around', 244, 7, 1)
  if (talker) {                      // a Starry's words, a letter a frame
    let c = STARRY_COLORS[talker.line % STARRY_COLORS.length], text = STARRY_LINES[talker.line] || ''
    let lines = wrap(text, 32), n = talkT, y0 = 236 - lines.length * 11 - 8
    rectfill(10, y0, 245, 238, 1); rect(10, y0, 245, 238, c)
    rectfill(16, y0 - 6, 16 + textw('Starry') + 5, y0 + 4, 1); rect(16, y0 - 6, 16 + textw('Starry') + 5, y0 + 4, c)
    print('Starry', 19, y0 - 4, c)
    for (let i = 0; i < lines.length && n > 0; i++) {
      print(lines[i].slice(0, n), 16, y0 + 8 + i * 11, 7)
      n -= lines[i].length + 1
    }
  }
  if (nearWell && !won && !talker && !stars.some((st) => st.state == 'flying')) printc('Bring stars to the Star Well!', 228, 10, 1)
  if (won == 'trophy' && wonT < 600) {
    rectfill(28, 92, 227, 156, 1); rect(28, 92, 227, 156, 10)
    printc('You did it!', 100, 10, 1, 2)
    printc('The Star Well shines again', 124, 7, 1)
    printc(best == ticks / 60 ? 'New best time! ' + fmt(best) : 'Time ' + fmt(ticks / 60) + '  Best ' + fmt(best), 140, 12, 1)
  }
  if (won == 'diamond' && wonT < 900) {
    rectfill(18, 76, 237, 180, 1); rect(18, 76, 237, 180, 12); rect(20, 78, 235, 178, 10)
    printc('All ' + goal + ' stars!', 86, 10, 1, 2)
    printc('You found the Star Diamond!', 112, 12, 1)
    printc('Every star is home, and the', 130, 7, 1)
    printc('observatory will never be dark.', 142, 7, 1)
    printc('Thank you for playing!', 160, 10, 1)
  }
}
