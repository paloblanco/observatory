// Star Observatory
// Lumi explores a little observatory floating among the stars. 20 stars are
// scattered over the islands: touch one and it follows her; bring them to the
// Star Well in the middle of the plaza. Bring all 20 to finish.
//
// Controls: arrows / WASD / d-pad / stick move (relative to the camera), X jumps.
// Turn the camera with the mouse (click the game first; Esc frees it), the right
// stick, or by dragging on a touch screen. Leave it alone and it swings round
// behind Lumi. Walking into a 1-block step climbs it, so stairs just work.
//
// map 0: the observatory and the islands around it (128 x 64 x 128)
// scene 0: map 0 plus a star marker (vox 3) for each star to find. Move, add or
//   remove stars in the Scene tab; the game counts whatever markers are there.
// vox: 0 Lumi standing, 1-2 Lumi walking (left foot, right foot), 3 star
// sounds: 0 footstep, 1 jump, 2 land, 3 chime, 4 fall, 5 start, 6 pickup, 7 deliver,
//   14 win; 8-13 the song (Music patterns 0-1)

const R = 0.35                       // Lumi's collision sphere
const SPAWN = [63.5, 17 + R, 17.5]   // on the little landing islet, looking north at the observatory
const WELL = [63.5, 17, 63.5]        // the Star Well, middle of the plaza
const TRAIL = 9                      // frames of Lumi's path between each star following her

let px, py, pz, vx = 0, vy = 0, vz = 0
let grounded = false, lift = 0, safe
let facing = 0, walk = 0, stepT = 0
let camYaw = 0, camPitch = 0.1, idle = 0
let title = true, flash = 0, nearWell = false
let M                                // the observatory map (a copy made by scene_load)
let stars = []                       // { x, y, z, state: 'free' | 'carried' | 'flying' | 'home', t }
let carried = []                     // the stars following Lumi, in the order she found them
let home = 0, goal = 0               // stars in the well, and how many there are
let path = []                        // Lumi's recent positions, newest first, for the stars to follow
let ticks = 0, won = false, wonT = 0, best = null
let sky = []                         // background stars: direction and color

function _init() {
  touch_set_mode(1)                  // on touch screens: an analog circle instead of the d-pad
  bg(17)                             // deep night blue
  mouse_set_mode(2)
  let s = scene_load(0)
  M = s.maps[0]
  stars = s.things.filter(([v]) => v == 3).map(([v, x, y, z]) => ({ x, y, z, state: 'free', t: 0 }))
  goal = stars.length
  carried = []; home = 0; path = []
  ticks = 0; won = false; wonT = 0
  let d = load()
  best = d ? d.best : null
  ;[px, py, pz] = SPAWN
  safe = [...SPAWN]
  sky = []
  for (let i = 0; i < 90; i++) {
    let yaw = rnd(1), pitch = rnd(0.5) - 0.12
    sky.push([dir3(yaw, pitch), [7, 7, 10, 12, 15][flr(rnd(5))], rnd(1)])
  }
  music(0, 2000)
}

function solid(x, y, z) { return mgetw(M, x, y, z)[0] > 0 }

function _update() {
  if (flash > 0) flash--
  if (title) {
    if (btnp(4) || btnp(5)) { title = false; sfx(5) }
    return
  }

  // the camera: mouse (once captured) or a finger, the right stick; else swing in behind
  let [mx, my] = mouse_delta(), [rx, ry] = stick(1)
  let look = mx * 0.0012 + rx * 0.012, tilt = my * 0.0012 + ry * 0.008
  camYaw -= look
  camPitch = mid(0.0, camPitch + tilt, 0.22)
  idle = look || tilt ? 0 : idle + 1

  // walking, relative to where the camera looks
  let [sx, sy] = stick(0)
  let [fx, , fz] = dir3(camYaw)
  let ax = (fx * -sy - fz * sx) * 0.085, az = (fz * -sy + fx * sx) * 0.085
  vx = lerp(vx, ax, 0.3); vz = lerp(vz, az, 0.3)
  let moving = abs(ax) + abs(az) > 0.01
  if (moving) {
    facing = yaw_to(ax, az); walk++
    if (idle > 60) camYaw += angdiff(camYaw, facing) * 0.02
  } else walk = 0

  if (btnp(5) && grounded) { vy = 0.22; sfx(1, 1) }
  vy = max(vy - 0.012, -0.5)
  px += vx; py += vy; pz += vz

  // climb 1-block steps: if the block just ahead at foot height is solid and the one
  // above it is free, pop up a block (drawn smoothly with `lift`)
  if (grounded && moving) {
    let m = sqrt(ax * ax + az * az), hx = px + ax / m * (R + 0.15), hz = pz + az / m * (R + 0.15)
    let fy = py - R + 0.5
    if (solid(hx, fy, hz) && !solid(hx, fy + 1, hz) && !solid(px, fy + 1.5, pz)) { py += 1; lift -= 1 }
  }
  lift *= 0.7

  // collision: push out of the map, and learn whether we're standing on it
  let was = grounded, fall = vy
  let [x, y, z, nx, ny, nz, ground] = mpush(M, px, py, pz, R)
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

function fmt(s) { return flr(s / 60) + ':' + ('0' + flr(s % 60)).slice(-2) }

function _draw() {
  // camera: behind and above Lumi, pulled in if the observatory is in the way
  let t, yaw, pitch, d
  if (title) {
    t = [63.5, 22, 63.5]; yaw = time() * 0.015; pitch = -0.11; d = 76
  } else {
    t = [px, py + 0.8 + lift, pz]; yaw = camYaw; pitch = -camPitch; d = 4.5
    let [fx, fy, fz] = dir3(yaw, pitch)
    let h = mray(M, ...t, -fx, -fy, -fz, d)
    if (h[0]) d = max(1, h[7] - 0.3)
  }
  cam_orbit(t, yaw, pitch, d)

  // background stars, far away in every direction, so they never get closer
  let [fx, fy, fz] = dir3(yaw, pitch)
  let cx = t[0] - fx * d, cy = t[1] - fy * d, cz = t[2] - fz * d
  for (let s of sky) {
    let [dir, c, ph] = s
    if (sin(time() * 0.3 + ph) > 0.85) continue    // twinkle
    cube(cx + dir[0] * 300, cy + dir[1] * 300, cz + dir[2] * 300, 1.6, c)
  }

  outline(0)
  if (flash > 0) for (let i = 0; i < 32; i++) pal(i, 7)
  map(M)
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
  if (nearWell && !won && !stars.some((st) => st.state == 'flying')) printc('Bring stars to the Star Well!', 228, 10, 1)
  if (!mouse_locked() && time() < 20) printc('Click or drag to turn the camera', 244, 7, 1)
  if (won && wonT < 600) {
    rectfill(28, 92, 227, 156, 1); rect(28, 92, 227, 156, 10)
    printc('All ' + goal + ' stars!', 100, 10, 1, 2)
    printc('The observatory shines again', 124, 7, 1)
    printc(best == ticks / 60 ? 'New best time! ' + fmt(best) : 'Time ' + fmt(ticks / 60) + '  Best ' + fmt(best), 140, 12, 1)
  }
}
