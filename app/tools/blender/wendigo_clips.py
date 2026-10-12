# Wendigo · Clips für das Hirschding (Skelett des Stags + Kiefer + Geweihknochen). Wird von wendigo_tiere_bau.py per exec geladen.
# Eigener kleiner FK/IK-Löser in Weltachsen (wie tools/kreaturen_rig.mjs, aber für Blender-Posenknochen): Knochen drehen sich um ihren Kopfpunkt,
# Zwei-Glied-IK für Läufe, Gangplaner mit Standfuß-Fixierung (Abspieltempo = Wegtempo, kein Gleiten). Clipnamen und Meta wie kreaturen.js erwartet:
# stehen, gehen, lauern, sturm, flucht, zurueck, packen, aufstieg, schrei – dazu neu: beobachten, fressen, uebergang.
FPS = 30
PI = math.pi
def _clamp(v, a, b): return max(a, min(b, v))
def _sm(k): k = _clamp(k, 0, 1); return k * k * (3 - 2 * k)
def _lerp(a, b, k): return a + (b - a) * k
def _frac(x): return x - math.floor(x)
EX, EY, EZ = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
FWD = Vector((0, -1, 0))   # vorn = −Y im Blender-Rahmen

class PRig:
  def __init__(self, arm):
    self.arm = arm; B = arm.data.bones; self.names = []
    done = set()
    def add(b):
      if b.name in done: return
      if b.parent: add(b.parent)
      done.add(b.name); self.names.append(b.name)
    for b in B: add(b)
    self.par = {b.name: (b.parent.name if b.parent else None) for b in B}
    M = arm.matrix_world
    self.rest = {b.name: M @ b.matrix_local for b in B}
    self.head0 = {b.name: M @ b.head_local for b in B}
    self.q = {n: Quaternion() for n in self.names}; self.loc = {n: Vector() for n in self.names}; self.scl = {n: Vector((1, 1, 1)) for n in self.names}
    self.key = {}
    for n in self.names:
      for k in ('root', 'STAG_', 'Pelvis', 'Spine', 'Spine1', 'Neck', 'Neck1', 'Neck2', 'Head', 'Jaw', 'Tail', 'Tail1', 'Tail2', 'AntlerL', 'AntlerR'):
        if n == k or n.endswith('-' + k): self.key.setdefault(k, n)
      for s_, sd in (('L', 'L'), ('R', 'R')):
        for k, nm in (('Clavicle', 'clav'), ('UpperArm', 'ua'), ('Forearm', 'fa'), ('Hand', 'ha'), ('Finger0', 'fi'), ('Thigh', 'th'), ('Calf', 'ca'), ('HorseLink', 'hl'), ('Foot', 'fo')):
          if n.endswith('-' + sd + '-' + k): self.key[nm + sd] = n
    for n in self.names:
      if n.endswith('_') and self.par[n] == self.key.get('root'): self.key['STAG_'] = n
    self.fk(); self.restW = {n: self.W[n].copy() for n in self.names}
    self.restQ = {n: self.W[n].to_quaternion() for n in self.names}
  def K(self, k): return self.key[k]
  def fk(self):
    W = {}
    for n in self.names:
      p = self.par[n]
      Rl = (self.rest[p].inverted() @ self.rest[n]) if p else self.rest[n]
      Wp = W[p] if p else Matrix.Identity(4)
      W[n] = Wp @ Rl @ Matrix.LocRotScale(self.loc[n], self.q[n], self.scl[n])
    self.W = W
  def reset(self):
    for n in self.names: self.q[n] = Quaternion(); self.loc[n] = Vector(); self.scl[n] = Vector((1, 1, 1))
    self.fk()
  def pos(self, k): return self.W[self.key.get(k, k)].translation.copy()
  def _frame(self, n):
    p = self.par[n]; Rl = (self.rest[p].inverted() @ self.rest[n]) if p else self.rest[n]; Wp = self.W[p] if p else Matrix.Identity(4); return Wp @ Rl
  def set_wq(self, k, qw):
    n = self.key.get(k, k); F = self._frame(n); self.q[n] = F.to_quaternion().inverted() @ qw; self.fk()
  def wq(self, k): return self.W[self.key.get(k, k)].to_quaternion()
  def set_pos(self, k, pw):
    n = self.key.get(k, k); F = self._frame(n); self.loc[n] = F.to_3x3().inverted() @ (Vector(pw) - F.translation); self.fk()
  def turn(self, k, axis, ang):
    if not ang: return
    self.set_wq(k, Quaternion(axis, ang) @ self.wq(k))
  def tip(self, k, child):
    if isinstance(child, str): return self.pos(child)
    if isinstance(child, Vector): return child
    n = self.key.get(k, k); return self.W[n] @ (self.rest[n].inverted() @ Vector(child[1]))  # ('rest', Punkt)
  def aim(self, k, child, target):
    P = self.pos(k); C = self.tip(k, child); a = C - P; t = Vector(target) - P
    if a.length < 1e-9 or t.length < 1e-9: return
    self.set_wq(k, a.rotation_difference(t) @ self.wq(k))
  def aim_dir(self, k, child, d): self.aim(k, child, self.pos(k) + Vector(d).normalized())
  def ik2(self, a, b, c, target, pole):
    P = self.pos(a); la = (self.pos(b) - P).length; lb = (self.pos(c) - self.pos(b)).length
    T = Vector(target) - P; d = _clamp(T.length, abs(la - lb) + 1e-4, (la + lb) * .9995); u = T.normalized()
    cosA = _clamp((la * la + d * d - lb * lb) / (2 * la * d), -1, 1); sinA = math.sqrt(1 - cosA * cosA)
    v = Vector(pole) - u * Vector(pole).dot(u)
    if v.length < 1e-8: v = Vector((0, -1, 0)) - u * u.y
    v.normalize(); K = P + u * (la * cosA) + v * (la * sinA)
    self.aim(a, b, K); self.aim(b, c, P + u * d)
  def key_frame(self, frame):
    pb = self.arm.pose.bones
    for n in self.names:
      b = pb[n]; b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = self.q[n]; b.keyframe_insert('rotation_quaternion', frame=frame)
      if (self.scl[n] - Vector((1, 1, 1))).length > 1e-6 or n.endswith(('AntlerL', 'AntlerR')): b.scale = self.scl[n]; b.keyframe_insert('scale', frame=frame)
      if self.loc[n].length > 1e-9 or n in (self.key.get('STAG_'), self.key.get('root')): b.location = self.loc[n]; b.keyframe_insert('location', frame=frame)

# ---------------------------------------------------------------- Gangplaner (aus kreaturen_rig.mjs): Fußziel je Bein relativ zur Wurzel, Zeit t, Zyklus T, Wegtempo v
def foot(leg, t, T, v, hitch=False):
  p = _frac(t / T + leg['off']); ds = leg['duty'] * T; tau = p * T; L = v * ds; out = dict(x=leg['x'], y=leg.get('y0', 0), z=0., c=0, lift=0., s=0.)
  if tau < ds: out['z'] = leg['z'] + L / 2 - v * tau; out['c'] = 1; out['s'] = tau / ds; return out
  q = (tau - ds) / (T - ds); D = v * T
  if hitch:
    if q < .4: w = .5 * _sm(q / .4); out['lift'] = math.sin(PI * q / .4)
    elif q < .55: w = .5; out['c'] = 1
    else: w = .5 + .5 * _sm((q - .55) / .45); out['lift'] = .8 * math.sin(PI * (q - .55) / .45)
  else: w = _sm(q); out['lift'] = math.sin(PI * q) ** .8
  out['z'] = leg['z'] - L / 2 + D * w - v * (tau - ds); out['y'] += out['lift'] * leg.get('lift', .1); return out

class HD:
  """Haltungen des Hirschdings (Rahmen: Spieleinheiten wie JS: +z vorn, hier auf −Y abgebildet)."""
  def __init__(self, R):
    self.R = R; r = R
    self.hip0 = r.pos('Pelvis'); self.f0 = {s: r.pos('fo' + s) for s in 'LR'}; self.hl0 = {s: r.pos('hl' + s) for s in 'LR'}
    self.toe_dz = self.f0['L'].z; self.hl_off = {s: self.hl0[s] - self.f0[s] for s in 'LR'}
    self.fi0 = {s: r.pos('fi' + s) for s in 'LR'}; self.ha0 = {s: r.pos('ha' + s) for s in 'LR'}; self.ha_off = {s: self.ha0[s] - self.fi0[s] for s in 'LR'}
    self.L1 = (r.pos('caL') - r.pos('thL')).length; self.L2 = (r.pos('hlL') - r.pos('caL')).length
    self.A1 = (r.pos('faL') - r.pos('uaL')).length; self.A2 = (r.pos('haL') - r.pos('faL')).length
    self.neck_len = (r.pos('Head') - r.pos('Neck1')).length
  def hind(self, s, F, ma=1.0, yaw=0.):
    """Hinterlauf: Fesselpunkt F (Welt) → Sprunggelenk = F + Ruhe-Versatz·(ma in y); Knie nach vorn."""
    R = self.R; off = self.hl_off[s].copy(); off.y *= ma
    Hk = F + off
    R.ik2('th' + s, 'ca' + s, 'hl' + s, Hk, FWD * 1.0 + EZ * .2); R.aim('hl' + s, 'fo' + s, F)
  def front(self, s, F, ma=1.0):
    R = self.R; off = self.ha_off[s].copy(); off.y *= ma
    Hd = F + off
    R.ik2('ua' + s, 'fa' + s, 'ha' + s, Hd, -FWD * 1.0 + EZ * .2); R.aim('ha' + s, 'fi' + s, F)
  def arm_hang(self, s, sw=0., out=.1, fw=.12, el=0.):
    R = self.R; sg = 1 if s == 'L' else -1
    R.aim_dir('ua' + s, 'fa' + s, Vector((sg * out, FWD.y * (fw + sw), -1)))
    R.aim_dir('fa' + s, 'ha' + s, Vector((sg * out * .5, FWD.y * (fw + .28 + sw * 1.3 + el), -1)))
    R.aim_dir('ha' + s, 'fi' + s, Vector((0, FWD.y * (fw + .12 + sw * 1.5), -1)))
  def pose(self, o):
    """o: hx, hy (Höhe über Boden, None = aus Beinlänge), hz (vor), th (Rumpfneigung), roll, yaw, bend, nf, nu, hp, hyaw, hr, jaw, tail, legs{L:(x,z,lift,ma), R:…}"""
    R = self.R; R.reset(); g = lambda k, d=0.: o.get(k, d)
    H = g('h', None)
    if H is None: H = self.f0['L'].z + self.hl_off['L'].z + (self.L1 + self.L2) * .93
    R.set_pos('STAG_', Vector((g('hx'), self.hip0.y - g('hz'), H)))
    R.turn('STAG_', EX, -g('th', 1.12)); R.turn('STAG_', EY, g('roll')); R.turn('STAG_', EZ, g('yaw'))
    b = g('bend', .12); R.turn('Spine', EX, -b * .6 - g('b1')); R.turn('Spine1', EX, -b - g('b2'))
    c = R.pos('Neck1'); fwd = Quaternion(EZ, g('yaw') * .4 + g('hyaw') * .5) @ FWD
    R.ik2('Neck1', 'Neck2', 'Head', c + fwd * g('nf', .42) + EZ * g('nu', .3), EZ + Vector((0, .3, 0)))
    qe = Euler((g('hp'), g('hr'), g('hyaw')), 'XYZ').to_quaternion()
    R.set_wq('Head', qe @ R.restQ[R.key['Head']])
    if 'Jaw' in R.key: R.set_wq('Jaw', Quaternion(EX, g('jaw', .03)) @ R.wq('Head'))
    if 'Tail' in R.key: R.turn('Tail', EX, g('tail', .3))
    legs = g('legs', {})
    for s in 'LR':
      x, f, lift, ma = legs.get(s, (.13 if s == 'L' else -.13, 0., 0., 1.))
      F = Vector((x, self.hip0.y - g('hz') - f, self.f0[s].z + lift))
      self.hind(s, F, ma)
      R.set_wq('fo' + s, Quaternion(EX, -.5 * (lift / .12) if lift > 0 else 0.) @ R.restQ[R.key['fo' + s]])
    arms = g('arms', None)
    for s in 'LR':
      if arms is None: self.arm_hang(s)
      else: self.arm_hang(s, **arms.get(s, {}))
    return R

# ---------------------------------------------------------------- Clips
def clip_defs():
  D = {}
  def stehen(R, H, t, T):
    k = math.sin(t / 8 * 2 * PI); tw = 1 if 2.3 < t < 3.6 else 0
    H.pose(dict(hx=.03 * k, th=1.12, roll=.025 * k, hr=.32 * tw, hp=.05 * tw, hyaw=.05 * math.sin(t / 8 * 4 * PI), jaw=.22 if 5.1 < t < 5.3 else .04,
      legs={'L': (.13, 0, 0, 1), 'R': (-.13, -.02, 0, 1)}, arms={'L': dict(sw=.02 * k), 'R': dict(sw=-.02 * k)}))
  D['stehen'] = (8, True, 0, stehen)
  def gehen(R, H, t, T):
    TT = 1.3; v = 1.2; LL = dict(x=.13, z=.05, off=0, duty=.58, lift=.14); LR = dict(x=-.13, z=.05, off=.5, duty=.58, lift=.14)
    fL = foot(LL, t, TT, v, True); fR = foot(LR, t, TT, v, True); ph = t / TT * 2 * PI; side = math.sin(ph)
    H.pose(dict(hx=.05 * side, th=1.08, roll=.06 * side, yaw=.07 * math.cos(ph), bend=.14, hyaw=-.02 * math.cos(ph), jaw=.05,
      legs={'L': (fL['x'], fL['z'], fL['y'], 1 + .3 * fL['lift']), 'R': (fR['x'], fR['z'], fR['y'], 1 + .3 * fR['lift'])},
      arms={'L': dict(sw=-.16 * math.sin(ph - .6)), 'R': dict(sw=.16 * math.sin(ph - .6))}))
  D['gehen'] = (1.3, True, 1.2, gehen)
  def lauern(R, H, t, T):
    TT = 2.4; v = .55; LL = dict(x=.15, z=.1, off=0, duty=.78, lift=.1); LR = dict(x=-.15, z=.1, off=.5, duty=.78, lift=.1)
    fL = foot(LL, t, TT, v); fR = foot(LR, t, TT, v); ph = t / TT * 2 * PI; side = math.sin(ph)
    H.pose(dict(hx=.04 * side, th=.62, roll=.04 * side, bend=.22, nf=.5, nu=-.02, hp=.12 + .04 * math.sin(ph * 2), jaw=.1, tail=.5, h=H.f0['L'].z + H.hl_off['L'].z + (H.L1 + H.L2) * .78,
      legs={'L': (fL['x'], fL['z'], fL['y'], 1.2 + .3 * fL['lift']), 'R': (fR['x'], fR['z'], fR['y'], 1.2 + .3 * fR['lift'])}, arms={'L': dict(fw=.3, sw=-.06 * side, el=.1), 'R': dict(fw=.3, sw=.06 * side, el=.1)}))
  D['lauern'] = (2.4, True, .55, lauern)
  def beobachten(R, H, t, T):
    step = int(t / 2.0) % 4; hy = (0, .5, -.35, .15)[step]; tick = 1 if (t % 2.0) > 1.92 else 0
    H.pose(dict(th=1.14, bend=.1, hyaw=hy, hp=-.04, jaw=.03, legs={'L': (.13, 0, 0, 1), 'R': (-.13, 0, 0, 1)}, arms={'L': dict(el=.2 * tick), 'R': {}}))
  D['beobachten'] = (8, True, 0, beobachten)
  def schrei(R, H, t, T):
    a = _sm(t / .35) * (1 - _sm((t - 1.6) / .6)); sh = math.sin(t * 38) * .03 * a
    H.pose(dict(th=1.12 + .15 * a, b2=-.15 * a, nf=.42 - .1 * a, nu=.3 + .25 * a, hp=-.7 * a + sh, hr=sh, jaw=.04 + .7 * a, legs={'L': (.13, 0, 0, 1), 'R': (-.13, 0, 0, 1)},
      arms={'L': dict(out=.1 + .6 * a, fw=.12 + .2 * a), 'R': dict(out=.1 + .6 * a, fw=.12 + .2 * a)}))
  D['schrei'] = (2.2, False, 0, schrei)
  def fressen(R, H, t, T):
    j = abs(math.sin(t * 7.0)) ** 3; a = _sm(t / .5)
    H.pose(dict(th=.9, bend=.2 * a, nf=.5, nu=-.55 * a, hp=.8 * a + .15 * j, hyaw=.18 * math.sin(t * 3.1), jaw=.1 + .5 * j, legs={'L': (.13, .05, 0, 1.1), 'R': (-.13, -.05, 0, 1.1)}, arms={'L': dict(fw=.5 * a), 'R': dict(fw=.5 * a)}))
  D['fressen'] = (3.0, True, 0, fressen)
  def sturm(R, H, t, T):
    TT = .62; v = 4.6; ph = t / TT; fl = math.sin(ph * 2 * PI)
    HL = dict(x=.12, z=.0, off=0, duty=.34, lift=.22); HRr = dict(x=-.12, z=.0, off=.06, duty=.34, lift=.22)
    fL = foot(HL, t, TT, v); fR = foot(HRr, t, TT, v)
    H.pose(dict(h=H.f0['L'].z + H.hl_off['L'].z + (H.L1 + H.L2) * .8 + .08 * math.sin(ph * 2 * PI + 1.2), th=.35 + .12 * fl, bend=-.04 - .1 * fl, nf=.55, nu=-.12, hp=.35, jaw=.18, tail=.7 - .3 * fl,
      legs={'L': (fL['x'], fL['z'], fL['y'], 1.3 + .4 * fL['lift']), 'R': (fR['x'], fR['z'], fR['y'], 1.3 + .4 * fR['lift'])}, arms={'L': dict(fw=.8, out=.1), 'R': dict(fw=.8, out=.1)}))
  D['sturm'] = (.62, True, 4.6, sturm)
  def flucht(R, H, t, T):
    TT = .66; v = -3.2; LL = dict(x=.14, z=.05, off=0, duty=.45, lift=.2); LR = dict(x=-.14, z=.05, off=.5, duty=.45, lift=.2)
    fL = foot(LL, t, TT, v); fR = foot(LR, t, TT, v); ph = t / TT * 2 * PI; side = math.sin(ph); jolt = abs(side)
    H.pose(dict(hx=.07 * side, th=.95, roll=.1 * side, b1=-.1, b2=-.15, bend=.05, nf=.2, nu=.38, hp=-.55, hyaw=.25 * side, hr=.2 * side, jaw=.45, tail=.9, h=H.f0['L'].z + H.hl_off['L'].z + (H.L1 + H.L2) * (.82 - .05 * jolt),
      legs={'L': (fL['x'], fL['z'], fL['y'], .7 - .3 * fL['lift']), 'R': (fR['x'], fR['z'], fR['y'], .7 - .3 * fR['lift'])}, arms={'L': dict(sw=.35 * side - .2, out=.35, el=.3), 'R': dict(sw=-.35 * side - .2, out=.35, el=.3)}))
  D['flucht'] = (.66, True, -3.2, flucht)
  def zurueck(R, H, t, T):
    a = _sm(t / .18); up = _sm((t - .05) / .3) * (1 - _sm((t - 1.3) / .5)); st = _sm((t - .25) / .45)
    H.pose(dict(hz=-.12 * a - .2 * st, th=1.12 + .22 * a - .1 * st, b2=-.12 * a, hp=-.2 * a + .25 * up, hyaw=-.5 * up, hr=-.25 * up, jaw=.3 * a * (1 - st * .6), tail=.6,
      legs={'L': (.13, 0, 0, 1), 'R': (-.13, _lerp(.0, -.4, st), .12 * math.sin(PI * _clamp((t - .25) / .45, 0, 1)), 1)}, arms={'L': dict(out=.2, fw=.5 * up, el=.4 * up), 'R': dict(sw=-.2 * a, out=.2)}))
  D['zurueck'] = (1.8, False, 0, zurueck)
  def aufstieg(R, H, t, T):
    a = _sm(t / 1.1); b = _sm((t - .8) / 1.2); c = _sm((t - 1.8) / .9); d = _sm((t - 2.6) / .25)
    base_h = H.f0['L'].z + H.hl_off['L'].z + (H.L1 + H.L2) * .93
    H.pose(dict(h=_lerp(.34, _lerp(base_h * .75, base_h, b), a), hz=_lerp(-.3, 0, b), th=_lerp(-.05, 1.12, b), bend=_lerp(.5, .12, c), nf=_lerp(.2, .42, c), nu=_lerp(-.5, .3, c), hp=_lerp(.9, 0, d), hr=_lerp(.5, 0, d), jaw=_lerp(.3, .04, c),
      legs={'L': (.18, _lerp(.35, 0, a), 0, _lerp(1.8, 1, a)), 'R': (-.18, _lerp(.3, 0, a), 0, _lerp(1.8, 1, a))}, arms={'L': dict(fw=_lerp(.8, .12, c)), 'R': dict(fw=_lerp(.8, .12, c))}))
  D['aufstieg'] = (3.2, False, 0, aufstieg)
  def packen(R, H, t, T):
    a = _sm(t / .25); b = _sm((t - .2) / .3)
    H.pose(dict(hz=.25 * a, th=1.12 - .45 * a, b2=.2 * b, nf=.42 + .25 * b, nu=.3 - .5 * b, hp=.6 * b, jaw=.04 + .6 * a, legs={'L': (.13, .3 * a, 0, 1), 'R': (-.13, 0, 0, 1 + .3 * a)},
      arms={'L': dict(fw=.8 * b, out=.3), 'R': dict(fw=.8 * b, out=.3)}))
  D['packen'] = (1.1, False, 0, packen)
  def uebergang(R, H, t, T):
    k = _sm(t / 3.0); sh = math.sin(t * 31) * .02 * (1 - k) * (1 if t < 2.2 else 0)
    base_h = H.f0['L'].z + H.hl_off['L'].z + (H.L1 + H.L2) * .93
    H.pose(dict(h=_lerp(base_h * .8, base_h, k), th=_lerp(.5, 1.12, k), bend=_lerp(.35, .12, k), nf=_lerp(.3, .42, k), nu=_lerp(-.2, .3, k), hp=_lerp(.5, 0, k) + sh, hr=sh * 2, jaw=.04 + .55 * math.sin(PI * min(1, t / 2.4)) ** 2,
      legs={'L': (.15, 0, 0, _lerp(1.3, 1, k)), 'R': (-.15, 0, 0, _lerp(1.3, 1, k))}))
    g_ = _sm((t - .3) / 2.2)
    for nm in ('AntlerL', 'AntlerR'):
      if nm in R.key: R.scl[R.key[nm]] = Vector((1, 1, 1)) * (.06 + .94 * g_)
    R.fk()
  D['uebergang'] = (3.0, False, 0, uebergang)
  return D

def build_clips(arm):
  R = PRig(arm); H = HD(R); D = clip_defs(); meta = {}
  for name, (dur, loop, speed, fn) in D.items():
    record(R, H, name, dur, lambda R_, H_, t, tt, fn=fn, dur=dur: fn(R_, H_, t, dur), loop=loop); meta[name] = dict(speed=speed, loop=loop, dur=dur)
  R.reset(); R.key_frame(1)
  scn['motion'] = json.dumps(meta)
  return R, H, meta

def record(R, H, name, dur, pose_fn, loop=True, trans=True):
  n = max(2, int(round(dur * FPS)) + 1); arm = R.arm
  if arm.animation_data is None: arm.animation_data_create()
  act = bpy.data.actions.new(name); arm.animation_data.action = act
  for i in range(n):
    t = i / FPS; pose_fn(R, H, (t % dur) if loop else min(t, dur), t); R.key_frame(i + 1)
  for fc in act.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
  scn.frame_start = 1; scn.frame_end = max(scn.frame_end, n)
  tr = arm.animation_data.nla_tracks.new(); tr.name = name; st = tr.strips.new(name, 1, act); st.name = name
  arm.animation_data.action = None
  return act


# ---------------------------------------------------------------- Clips für die Tierformen (Vierbeiner-Ruhepose): Beobachten, Lauern, Brüllen, Fressen, Übergang
def shape_clip(me, name, dur, curves):
  """Shape-Key-Animation als eigener NLA-Streifen gleichen Namens (der glTF-Export führt gleichnamige Spuren zu einer Animation zusammen)."""
  sk = me.data.shape_keys
  if not sk: return
  if sk.animation_data is None: sk.animation_data_create()
  act = bpy.data.actions.new(name + '_' + me.name); sk.animation_data.action = act
  n = int(round(dur * FPS)) + 1
  for kname, fn in curves.items():
    kb = sk.key_blocks.get(kname)
    if not kb: continue
    for i in range(n):
      kb.value = float(fn(i / FPS)); kb.keyframe_insert('value', frame=i + 1)
    kb.value = 0.0
  tr = sk.animation_data.nla_tracks.new(); tr.name = name; tr.strips.new(name, 1, act); sk.animation_data.action = None

def tier_clips(arm, meshes):
  R = PRig(arm); H = HD(R); meta = {}
  def quad(o):
    """Vierbeiner-Haltung: Körper/Beine bleiben in Ruhe, Hals/Kopf/Körperhöhe aus o."""
    R.reset()
    if o.get('drop'): R.set_pos('STAG_', R.pos('STAG_') + Vector((0, 0, -o['drop'])))
    R.turn('Neck', EX, o.get('n0', 0)); R.turn('Neck1', EX, o.get('n1', 0)); R.turn('Neck2', EX, o.get('n2', 0)); R.turn('Head', EX, o.get('h', 0)); R.turn('Neck', EZ, o.get('yaw', 0)); R.turn('Head', EZ, o.get('hyaw', 0))
    if o.get('spine'): R.turn('Spine1', EX, o['spine'])
    if o.get('drop'):
      for s_ in 'LR':
        F = H.f0[s_]; H.hind(s_, F, 1.0 + o.get('flex', 0)); H.front(s_, H.fi0[s_], 1.0 + o.get('flex', 0))
  def rec(name, dur, fn, loop=True):
    record(R, H, name, dur, lambda R_, H_, t, tt: fn(t), loop=loop); meta[name] = dict(speed=0, loop=loop, dur=dur)
  rec('beobachten', 8.0, lambda t: quad(dict(n0=-.22, n1=-.2, h=.15, hyaw=(0, .5, -.4, .15)[int(t / 2) % 4], yaw=(0, .25, -.2, .08)[int(t / 2) % 4] * .6)))
  rec('lauern', 4.0, lambda t: quad(dict(drop=.22 + .02 * math.sin(t * 1.5), n0=.35, n1=.25, n2=.2, h=-.15, spine=.05, flex=.35)))
  rec('bruellen', 2.2, lambda t: quad(dict(n0=-.3 * _sm(t / .3) * (1 - _sm((t - 1.6) / .5)), n1=-.4 * _sm(t / .3) * (1 - _sm((t - 1.6) / .5)), n2=-.3 * _sm(t / .3) * (1 - _sm((t - 1.6) / .5)), h=-.5 * _sm(t / .3) * (1 - _sm((t - 1.6) / .5)))), loop=False)
  rec('fressen', 3.0, lambda t: quad(dict(drop=.1, n0=.4, n1=.5, n2=.4, h=.3 + .25 * abs(math.sin(t * 6)) ** 3, hyaw=.15 * math.sin(t * 3.1))))
  rec('uebergang', 3.0, lambda t: quad(dict(drop=.14 * math.sin(PI * min(1, t / 3)) , n0=.2 * math.sin(t * 25) * .15, h=.15 * math.sin(t * 31) * .2, flex=.2)), loop=False)
  for me in meshes:
    shape_clip(me, 'bruellen', 2.2, {'maul_auf': lambda t: _sm(t / .3) * (1 - _sm((t - 1.6) / .5)), 'kopf_falsch': lambda t: .0})
    shape_clip(me, 'fressen', 3.0, {'maul_auf': lambda t: .25 + .5 * abs(math.sin(t * 6)) ** 3})
    shape_clip(me, 'uebergang', 3.0, {'riss': lambda t: _sm((t - .1) / 1.0), 'knochen': lambda t: _sm((t - .8) / 1.2), 'kopf_falsch': lambda t: _sm((t - 1.0) / 1.4) * (1 - _sm((t - 2.6) / .4)) * .0 + _sm((t - 1.0) / 1.4) * .6,
      'maul_auf': lambda t: math.sin(PI * _clamp((t - 1.2) / 1.2, 0, 1)) * .8, 'geweih_klein': lambda t: 1 - _sm((t - 1.4) / 1.4)})
  R.reset(); R.key_frame(1)
  scn['motion'] = json.dumps(meta)
  return meta
