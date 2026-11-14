// Star Observatory
// Lumi explores a little observatory floating among the stars. 20 stars are
// scattered over the islands: touch one and it follows her; bring them to the
// Star Well in the middle of the plaza. Bring all 20 to finish.
//
// Controls: arrows / WASD / d-pad / stick walk; up is north. There's no jump button:
// walking into a 1-block step climbs it, so stairs just work. Lumi never climbs onto
// metal or lamps, so rails keep her on the bridges.
// The camera sits behind and a little above Lumi, looking north and down, and the world
// rolls away toward the horizon (cam_set_curve). Standing still, you can look around with
// the mouse (click the game first; Esc frees it), the right stick, or a finger drag; the
// world unrolls while you look. Walking snaps the camera back.
//
// map 0: the observatory and the islands around it (128 x 64 x 128), built by maps/0-observatory.gen.js
// map 1: the library's south wall and roof. Like the props below, but it fades out completely
//   when it's between the camera and Lumi (so you can see her inside the library).
// maps 2-9: props the scene places: 2 tower, 3 gazebo, 4 shrine, 5-7 trees (small, medium,
//   tall), 8 giant mushroom, 9 giant mushroom with a lantern. When one of them is between the
//   camera and Lumi, it turns 70% see-through.
// scene 0: maps 0 and 1 (named "world" and "library roof"), every prop, and a star marker
//   (vox 3) for each star to find. Move, add or remove props and stars in the Scene tab; the
//   game counts whatever is there.
// vox: 0 Lumi standing, 1-2 Lumi walking (left foot, right foot), 3 star
// sounds: 0 footstep, 1 jump (unused), 2 land, 3 chime, 4 fall, 5 start, 6 pickup, 7 deliver,
//   14 win; 8-13 the song (Music patterns 0-1)

const R = 0.35                       // Lumi's collision sphere
const SPAWN = [63.5, 17 + R, 17.5]   // on the little landing islet, looking north at the observatory
const WELL = [63.5, 17, 63.5]        // the Star Well, middle of the plaza
const TRAIL = 9                      // frames of Lumi's path between each star following her
const CAM_DIST = 6.5, CAM_PITCH = 0.14// the camera: how far behind Lumi, and how steeply it looks down (turns)
const CURVE = 0.012                  // how fast the world rolls away ahead (0 = flat)
const NO_CLIMB = [17, 13]            // tiles Lumi never steps up onto: metal (rails, lamp posts) and lamps
const FADE = 0.7, ROOF_FADE = 1      // how see-through a prop gets when it hides Lumi; the library roof and wall vanish

let px, py, pz, vx = 0, vy = 0, vz = 0
let grounded = false, lift = 0, safe
let facing = 0, walk = 0, stepT = 0
let cam = null                       // where the camera looks, easing after Lumi
let camYaw = 0, camPitch = CAM_PITCH // the way the camera looks: north and down, unless you're looking around
let camK = CURVE, looking = false    // the roll (0 while looking around), and whether you are
let title = true, flash = 0, nearWell = false
let M, ROOF                          // the observatory and the library roof (copies made by scene_load)
let props = []                       // { m, corner, fade, most }: every map in the scene but the world
let close = []                       // the props close to Lumi this frame
let stars = []                       // { x, y, z, state: 'free' | 'carried' | 'flying' | 'home', t }
let carried = []                     // the stars following Lumi, in the order she found them
let home = 0, goal = 0               // stars in the well, and how many there are
let path = []                        // Lumi's recent positions, newest first, for the stars to follow
let ticks = 0, won = false, wonT = 0, best = null

function _init() {
  touch_set_mode(1)                  // on touch screens: an analog circle instead of the d-pad
  bg(17, 1)                          // a night sky: deep blue overhead, lighter at the horizon
  mouse_set_mode(2)                  // the mouse looks around, once captured by a click
  let s = scene_load(0)
  M = s.named.world; ROOF = s.named['library roof']
  props = s.maps.filter((m) => m != M).map((m) => ({ m, corner: mtow(m, 0, 0, 0), fade: 0, most: m == ROOF ? ROOF_FADE : FADE }))
  stars = s.things.filter(([v]) => v == 3).map(([v, x, y, z]) => ({ x, y, z, state: 'free', t: 0 }))
  goal = stars.length
  carried = []; home = 0; path = []
  ticks = 0; won = false; wonT = 0
  let d = load()
  best = d ? d.best : null
  ;[px, py, pz] = SPAWN
  safe = [...SPAWN]
  cam = null; camYaw = 0; camPitch = CAM_PITCH; camK = CURVE; looking = false
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

  // walking: the camera looks north (+z), so up is +z and right on screen is -x
  let [sx, sy] = stick(0)
  let ax = -sx * 0.085, az = -sy * 0.085
  vx = lerp(vx, ax, 0.3); vz = lerp(vz, az, 0.3)
  let moving = abs(ax) + abs(az) > 0.01
  if (moving) { facing = yaw_to(ax, az); walk++ } else walk = 0

  // looking around: only while standing still. Walking snaps the camera back, roll and all.
  let [mx, my] = mouse_delta(), [rx, ry] = stick(1)
  let turn = mx * 0.0012 + rx * 0.012, tilt = my * 0.0012 + ry * 0.008
  if (moving) { looking = false; camYaw = 0; camPitch = CAM_PITCH; camK = CURVE }
  else if (turn || tilt) { looking = true; camYaw -= turn; camPitch = mid(0, camPitch + tilt, 0.22) }
  if (looking) camK = lerp(camK, 0, 0.08)      // unroll gently while looking

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

  // footsteps
  if (grounded && moving) { if (--stepT <= 0) { sfx(0, 2); stepT = 15 } } else stepT = 0

  // fell off the edge: back to the last safe spot
  if (py < -8) { ;[px, py, pz] = safe; vx = vy = vz = 0; flash = 20; sfx(4, 1) }

  if (!won) ticks++
  if (won) wonT++

  // Lumi's path, for the stars following her
  path.unshift([px, py - R + lift, pz])
  if (path.length > TRAIL * (goal + 1)) path.pop()

  // touching a star: it starts following her
  for (let st of stars) {
    if (st.state == 'free' && dist([px, pz], [st.x, st.z]) < 1.1 && abs(py - st.y) < 1.8) {
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
    if (st.state == 'free') {
      p = [st.x, st.y + sin(time() + st.x) * 0.12, st.z]
      if (!title) line3(st.x, st.y - 0.6, st.z, st.x, st.y + 7, st.z, 10)
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

  // Lumi
  if (!title) {
    let frame = !grounded ? 1 : walk == 0 ? 0 : [1, 0, 2, 0][flr(walk / 8) % 4]
    vox(frame, px, py - R + lift, pz, 0, facing, 0, 1.4)
  }
  outline()

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
