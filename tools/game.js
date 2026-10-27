// Star Observatory
// Lumi explores a little observatory floating among the stars. One day she'll
// carry 20 stars back to the Star Well in the middle; for now she can walk, jump
// and look around.
//
// Controls: arrows / WASD / d-pad / stick move (relative to the camera), X jumps.
// Turn the camera with the mouse (click the game first; Esc frees it), the right
// stick, or by dragging on a touch screen. Leave it alone and it swings round
// behind Lumi. Walking into a 1-block step climbs it, so stairs just work.
//
// map 0: the observatory (64 x 64 x 64)
// vox: 0 Lumi standing, 1-2 Lumi walking (left foot, right foot), 3 star
// sounds: 0 footstep, 1 jump, 2 land, 3 chime, 4 fall, 5 start; 8-13 the song (Music patterns 0-1)

const R = 0.35                       // Lumi's collision sphere
const SPAWN = [31.5, 11 + R, 4.5]    // on the little landing islet, looking north at the observatory
const WELL = [31.5, 11, 35.5]        // the Star Well, middle of the plaza
const GOAL = 20                      // stars to find (not in the game yet)

let px, py, pz, vx = 0, vy = 0, vz = 0
let grounded = false, lift = 0, safe
let facing = 0, walk = 0, stepT = 0
let camYaw = 0, camPitch = 0.1, idle = 0
let title = true, flash = 0, nearWell = false
let stars = 0                        // stars brought to the well so far
let sky = []                         // background stars: direction and color

function _init() {
  touch_set_mode(1)                  // on touch screens: an analog circle instead of the d-pad
  bg(17)                             // deep night blue
  mouse_set_mode(2)
  ;[px, py, pz] = SPAWN
  safe = [...SPAWN]
  sky = []
  for (let i = 0; i < 90; i++) {
    let yaw = rnd(1), pitch = rnd(0.5) - 0.12
    sky.push([dir3(yaw, pitch), [7, 7, 10, 12, 15][flr(rnd(5))], rnd(1)])
  }
  music(0, 2000)
}

function solid(x, y, z) { return mgetw(0, x, y, z)[0] > 0 }

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
  let [x, y, z, nx, ny, nz, ground] = mpush(0, px, py, pz, R)
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

  // a chime when Lumi steps up to the Star Well
  let d = dist([px, 0, pz], [WELL[0], 0, WELL[2]])
  let near = d < 3.2 && abs(py - WELL[1]) < 2
  if (near && !nearWell) sfx(3, 3)
  nearWell = near
}

function _draw() {
  // camera: behind and above Lumi, pulled in if the observatory is in the way
  let t, yaw, pitch, d
  if (title) {
    t = [31.5, 16, 35.5]; yaw = time() * 0.02; pitch = -0.08; d = 34
  } else {
    t = [px, py + 0.8 + lift, pz]; yaw = camYaw; pitch = -camPitch; d = 4.5
    let [fx, fy, fz] = dir3(yaw, pitch)
    let h = mray(0, ...t, -fx, -fy, -fz, d)
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
  map(0)
  pal()

  // the big star turning over the Star Well
  outline(9, false)
  vox(3, WELL[0], WELL[1] + 3 + sin(time() * 0.5) * 0.25, WELL[2], 0, time() * 0.15, 0, 3)
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
    printc('Help Lumi find 20 stars', 150, 12, 1)
    if (time() % 1 < 0.6) printc('Press X to start', 200, 7, 1)
    return
  }

  print('Stars ' + stars + '/' + GOAL, 4, 4, 10, 1)
  if (nearWell) printc('The Star Well awaits!', 228, 10, 1)
  if (!mouse_locked() && time() < 20) printc('Click or drag to turn the camera', 244, 7, 1)
}
