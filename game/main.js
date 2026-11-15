// Star Observatory
// Lumi explores a little observatory floating among the stars. 20 stars are
// scattered over the islands: touch one and it follows her; bring them to the
// Star Well in the middle of the plaza. Bring all 20 to finish.
//
// Controls: arrows / WASD / d-pad / stick walk; up is away from the camera (north). X or O
// spins: Lumi twirls in place, breaking any chest next to her. There's no jump button:
// walking into a 1-block step climbs it, so stairs just work. Lumi never climbs onto
// metal or lamps, so rails keep her on the bridges.
// The camera sits behind and a little above Lumi, looking north and down, and the world
// rolls away toward the horizon (cam_set_curve). Standing still, you can look around with
// the mouse (click the game first; Esc frees it), the right stick, or a finger drag; the
// world unrolls while you look. Walking eases the camera back.
//
// map 0: the observatory and the islands around it (128 x 64 x 128), built by maps/0-observatory.gen.js
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
//   markers (a mark on top, for the Scene tab), 7 key, 8 Lumi's spin smear (swapped in mid-spin)
// sounds: 0 footstep, 1 jump (unused), 2 land, 3 chime, 4 fall, 5 start, 6 pickup, 7 deliver,
//   14 win, 15 spin, 16 chest breaks, 17 key; 8-13 the song (Music patterns 0-1)

const R = 0.35                       // Lumi's collision sphere
const SPAWN = [63.5, 17 + R, 17.5]   // on the little landing islet, looking north at the observatory
const WELL = [63.5, 17, 63.5]        // the Star Well, middle of the plaza
const TRAIL = 9                      // frames of Lumi's path between each star following her
const CAM_DIST = 6.5, CAM_PITCH = 0.14// the camera: how far behind Lumi, and how steeply it looks down (turns)
const CURVE = 0.012                  // how fast the world rolls away ahead (0 = flat)
const BACK = 60                      // frames the camera takes to ease back when Lumi walks (60 = one second)
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
const NO_CLIMB = [17, 13]            // tiles Lumi never steps up onto: metal (rails, lamp posts) and lamps
const FADE = 0.7, ROOF_FADE = 1      // how see-through a prop gets when it hides Lumi; the library roof and wall vanish

let px, py, pz, vx = 0, vy = 0, vz = 0
let grounded = false, lift = 0, safe
let facing = 0, walk = 0, stepT = -1
let cam = null                       // where the camera looks, easing after Lumi
let camYaw = 0, camPitch = CAM_PITCH // the way the camera looks: north and down, unless you're looking around
let camK = CURVE, looking = false    // the roll (0 while looking around), and whether you are
let back = null                      // { yaw, pitch, k, t }: the camera easing back to its default view
let title = true, flash = 0, nearWell = false
let M, ROOF                          // the observatory and the library roof (copies made by scene_load)
let props = []                       // { m, corner, fade, most }: every map in the scene but the world
let close = []                       // the props close to Lumi this frame
let stars = []                       // { x, y, z, state: 'free' | 'carried' | 'flying' | 'home', t }
let carried = []                     // the stars following Lumi, in the order she found them
let home = 0, goal = 0               // stars in the well, and how many there are
let path = []                        // Lumi's recent positions, newest first, for the stars to follow
let ticks = 0, won = false, wonT = 0, best = null
let spinT = 0, spinRest = 0, spunOnce = false   // the spin: frames left, frames until the next, and whether she has spun yet
let chests = []                      // { x, y, z, has: null | 'star' | 'key', broken }
let keys = [], keyCount = 0          // keys lying out ({ x, y, z, pop }), and keys Lumi has
let bits = []                        // flying bits: { x, y, z, vx, vy, vz, c, s, life }

function _init() {
  touch_set_mode(1)                  // on touch screens: an analog circle instead of the d-pad
  bg(17, 1)                          // a night sky: deep blue overhead, lighter at the horizon
  mouse_set_mode(2)                  // the mouse looks around, once captured by a click
  let s = scene_load(0)
  M = s.named.world; ROOF = s.named['library roof']
  props = s.maps.filter((m) => m != M).map((m) => ({ m, corner: mtow(m, 0, 0, 0), fade: 0, most: m == ROOF ? ROOF_FADE : FADE }))
  stars = s.things.filter(([v]) => v == 3).map(([v, x, y, z]) => ({ x, y, z, state: 'free', t: 0, pop: 0 }))
  chests = s.things.filter(([v]) => v >= 4 && v <= 6)
    .map(([v, x, y, z]) => ({ x, y, z, has: [null, 'star', 'key'][v - 4], broken: false }))
  goal = stars.length + chests.filter((c) => c.has == 'star').length
  spinT = 0; spinRest = 0; spunOnce = false; keys = []; keyCount = 0; bits = []
  carried = []; home = 0; path = []
  ticks = 0; won = false; wonT = 0
  let d = load()
  best = d ? d.best : null
  ;[px, py, pz] = SPAWN
  safe = [...SPAWN]
  cam = null; camYaw = 0; camPitch = CAM_PITCH; camK = CURVE; looking = false; back = null
  music(0, 2000)
}

function tile(x, y, z) {
  for (let m of [M, ...close.map((p) => p.m)]) { let t = mgetw(m, x, y, z)[0]; if (t) return t }
  return 0
}
function solid(x, y, z) { return tile(x, y, z) > 0 }

function _update() {
  if (flash > 0) flash--
  if (title) {
    if (btnp(4) || btnp(5)) { title = false; sfx(5) }
    return
  }

  // the props near enough to touch (measured from each map's corner; the tower is the biggest, 21 blocks)
  close = props.filter((p) => dist([px, pz], [p.corner[0], p.corner[2]]) < 26)

  // walking, relative to the way the camera faces: normally north (+z), so up is +z and
  // right on screen is -x; while the camera eases back after looking around, it turns with it
  // An analog stick reaches full speed at half tilt (FULL_TILT), so a thumb on a phone's circle
  // doesn't have to reach the rim; less than that walks slower. Digital input is always full.
  let [sx, sy] = stick(0), push = sqrt(sx * sx + sy * sy)
  if (push > 0) { let k = min(push / FULL_TILT, 1) / push; sx *= k; sy *= k }
  let [fx, , fz] = dir3(camYaw)
  let ax = (fx * -sy - fz * sx) * 0.085, az = (fz * -sy + fx * sx) * 0.085
  vx = lerp(vx, ax, 0.3); vz = lerp(vz, az, 0.3)
  let pace = min(push / FULL_TILT, 1)          // 1 at full speed
  let moving = abs(ax) + abs(az) > 0.01
  if (moving) { facing = yaw_to(ax, az); walk += max(pace, 0.4) } else walk = 0   // slower walking, slower steps

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
  let [x, y, z, nx, ny, nz, ground] = mpush([M, ...close.map((p) => p.m)], px, py, pz, R)
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
  if ((btnp(4) || btnp(5)) && spinT == 0 && spinRest == 0) {
    spinT = SPIN; spunOnce = true; sfx(15, 1)
    for (let i = 0; i < 14; i++) {    // a burst of white flecks flung out as the spin starts
      let a = i / 14 + rnd(0.04), sp = 0.13 + rnd(0.07)
      bits.push({ x: px + sin(a) * 0.3, y: py - R + 0.3 + rnd(0.7), z: pz + cos(a) * 0.3,
        vx: sin(a) * sp, vy: rnd(0.04) - 0.01, vz: cos(a) * sp, c: 7, s: 0.16 + rnd(0.08), life: 12 + flr(rnd(6)), g: 0, drag: 0.82 })
    }
  }
  if (spinT > 0) {
    for (let c of chests) {
      if (!c.broken && dist([px, pz], [c.x, c.z]) < SPIN_REACH + 0.5 && abs(py - R - c.y) < 1.5) breakChest(c)
    }
    if (spinT % 2 == 0) {            // a trail of sparkles flung off the spin
      let a = rnd(1)
      bits.push({ x: px + sin(a) * 0.7, y: py - R + 0.4 + rnd(0.8), z: pz + cos(a) * 0.7,
        vx: sin(a) * 0.04, vy: 0.02, vz: cos(a) * 0.04, c: rnd([10, 7, 12, 23]), s: 0.12, life: 24, g: 0 })
    }
  }

  // flying bits: wood from chests and sparkles
  for (let b of bits) {
    b.x += b.vx; b.y += b.vy; b.z += b.vz; b.vy -= b.g; b.life--
    if (b.drag) { b.vx *= b.drag; b.vy *= b.drag; b.vz *= b.drag }
  }
  bits = bits.filter((b) => b.life > 0)

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

  if (!won) ticks++
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
      if (home == goal) win()
    }
  }
}

// How far round the spin has turned, f from 0 to 1: fast at the start (1.4 times the average
// rate), slowing to 0.6 times it by the end. Lumi turns 2 x this, the sparkle ring 1.2 x this.
function spinTurn(f) { return 0.6 * f + 0.4 * (1 - (1 - f) * (1 - f)) }

// How far the spin's sparkle stars are from Lumi, f from 0 (spin starts) to 1 (ends): they burst
// out, overshoot a little and settle (ease-out-back), hold there, then zip back in, faster and faster.
function sparkleRadius(f) {
  const RMAX = 1.25, OUT = 0.2, IN = 0.72
  if (f < OUT) {
    let t = f / OUT - 1, c = 2.2
    return RMAX * (1 + (c + 1) * t * t * t + c * t * t)
  }
  if (f < IN) return RMAX
  let t = (f - IN) / (1 - IN)
  return RMAX * (1 - t * t * t)
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
function floorBelow() {
  let best = 40
  for (let m of [M, ...close.map((p) => p.m)]) {
    let h = mray(m, px, py, pz, 0, -1, 0, 40)
    if (h[0]) best = min(best, h[7])
  }
  return best
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

function win() {
  won = true; wonT = 0; sfx(14, 3)
  let s = ticks / 60
  if (best == null || s < best) { best = s; save({ best: best }) }
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
    if (dist([px, pz], [p.corner[0], p.corner[2]]) < 30) {
      for (let h of [0.3, 1.3]) {
        let o = [px, py - R + lift + h, pz], v = [c[0] - o[0], c[1] - o[1], c[2] - o[2]], len = dist(o, c)
        if (mray(p.m, ...o, ...v, len + 3)[0]) hit = true    // a little past the camera: inside a prop counts too
      }
    }
    p.fade = lerp(p.fade, hit ? p.most : 0, 0.15)
  }
}

function fmt(s) { return flr(s / 60) + ':' + ('0' + flr(s % 60)).slice(-2) }

function _draw() {
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
  map(M)
  for (let p of props) {
    if (title) p.fade = 0
    if (p.fade > 0.98) continue      // faded out completely
    if (p.fade > 0.02) fillp(p.fade, -1)
    map(p.m, true)                   // backs too, so a prop the camera is inside still shows (see-through)
    fillp()
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
  for (let k of keys) {
    let f = k.pop > 0 ? 1 - k.pop / 30 : 1
    let y = k.y + 0.4 + (k.pop > 0 ? sin(f * 0.5) * 1.3 : 0.6 + sin(time() * 2) * 0.1)
    vox(7, k.x, y, k.z, 0, time() * 0.5, 0, 0.7 * f)
  }

  // Lumi: spinning, she turns twice round and squashes a little; a ring of sparkles circles her
  if (!title) {
    let frame = !grounded ? 1 : walk == 0 ? 0 : [1, 0, 2, 0][flr(walk / (STEP / 2)) % 4]
    let yaw = facing, sq = 1, bob = 0
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
      yaw = facing + spinTurn(f) * 2; sq = 1 - sin(f * 0.5) * 0.15
      frame = (spinT >> 1) % 2 && spinT > 2 && f > 0.08 ? 8 : 0   // the smear frame, on and off every 2 frames
    }
    let wide = 1.4 / sqrt(sq)                   // keep her volume: taller is thinner
    // her shadow: the same model squashed flat and drawn all black, on the floor below her
    let below = floorBelow()
    if (below < 40) {
      outline()
      for (let i = 0; i < 32; i++) pal(i, 0)
      vox(frame, px, py - below + 0.03, pz, 0, yaw, 0, wide * 1.05, 0.01, wide * 1.05)
      pal(); outline(0)
    }
    vox(frame, px, py - R + lift + bob, pz, 0, yaw, 0, wide, 1.4 * sq, wide)
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
    printc('Help Lumi find ' + goal + ' stars', 150, 12, 1)
    if (best != null) printc('Best ' + fmt(best), 168, 10, 1)
    if (time() % 1 < 0.6) printc('Press X to start', 200, 7, 1)
    return
  }

  print('Stars ' + home + '/' + goal, 4, 4, 10, 1)
  if (carried.length) print('Carrying ' + carried.length, 4, 16, 7, 1)
  if (keyCount) print('Keys ' + keyCount, 4, carried.length ? 28 : 16, 23, 1)
  let chestNear = chests.some((c) => !c.broken && dist([px, pz], [c.x, c.z]) < 3)
  if (chestNear && !spunOnce) printc('Press X to spin!', 214, 10, 1)
  print(fmt(ticks / 60), 252 - textw(fmt(ticks / 60)), 4, 7, 1)
  if (!mouse_locked() && !looking && time() < 25) printc('Stand still, drag to look around', 244, 7, 1)
  if (nearWell && !won && !stars.some((st) => st.state == 'flying')) printc('Bring stars to the Star Well!', 228, 10, 1)
  if (won && wonT < 600) {
    rectfill(28, 92, 227, 156, 1); rect(28, 92, 227, 156, 10)
    printc('All ' + goal + ' stars!', 100, 10, 1, 2)
    printc('The observatory shines again', 124, 7, 1)
    printc(best == ticks / 60 ? 'New best time! ' + fmt(best) : 'Time ' + fmt(ticks / 60) + '  Best ' + fmt(best), 140, 12, 1)
  }
}
