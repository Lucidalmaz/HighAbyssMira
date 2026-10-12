# Wendigo · originale Hirsch-Gruselform (wird von wendigo_tiere_bau.py mit FORM = hirschding geladen; teilt den Namensraum).
# Kanon (story_final.md 1.8): „Ein aufrechtes Hirschding, zu groß, zu gerade, aus Knochen und rohem Fleisch, mit einem Schädel, der auf dem Hals sitzt wie aufgesteckt,
# Geweihstangen, die schief nachgewachsen sind, Augen wie Glut hinter Milchglas. Es hat keine Haut, weil ihm nie eine gewachsen ist.“
# Verfahren: Basis = animal_deerstag (realistische Hirschanatomie, 31 Knochen). Fell und Original-Geweih entfernt, Körper in Läufen und Hals gestreckt, Läufe und Rumpf abgemagert,
# Kopf größer und „aufgesteckt“, Augenhöhlen/Jochbögen/Gelenke durch Pinsel, eigene Zähne, eigenes asymmetrisches Geweih (Röhren mit Verzweigung, Basisring, Bast-Streifen),
# Fleisch-/Knochen-Textur aus hohem Netz gebacken, zusätzliche Knochen (Kiefer, Geweih), Clips (aufrecht auf zwei Hinterläufen).

def drop_antlers(me):
  ids = antler_mask(me); bm = bmesh.new(); bm.from_mesh(me.data); bm.verts.ensure_lookup_table()
  bmesh.ops.delete(bm, geom=[v for v in bm.verts if ids[v.index]], context='VERTS'); bm.to_mesh(me.data); bm.free(); me.data.update()

# ---------------------------------------------------------------- Verformung (alles im Blender-Rahmen des Stags; Z oben, −Y vorn)
class Warp:
  def __init__(self, arm, me):
    self.zc = 1.0; self.a = 1.42; self.neck_k = .36; self.head_s = 1.12
    self.n0 = bone_pos(arm, '-Neck'); self.hd = bone_pos(arm, '-Head'); self.dir = (self.hd - self.n0); self.L = np.linalg.norm(self.dir); self.dir /= self.L
    P = verts_np(me, False); self.leg_centers = {}
    # Läufe: Gruppen nach (Seite, vorn/hinten) für Radialverschlankung
    self.legs = []
    for sx in (1, -1):
      for front in (True, False):
        self.legs.append((sx, front))
    self.cent = {}
    for (sx, front) in self.legs:
      m = self._leg_mask(P, sx, front)
      zs = P[m][:, 2]; xs = P[m][:, 0]; ys = P[m][:, 1]
      bins = np.arange(0, 1.0, .05); cx = np.interp(bins, *self._binmean(zs, xs, bins)); cy = np.interp(bins, *self._binmean(zs, ys, bins))
      self.cent[(sx, front)] = (bins, cx, cy)
  def _leg_mask(self, P, sx, front):
    return (np.sign(P[:, 0]) == sx) & (np.abs(P[:, 0]) > .035) & (P[:, 2] < .95) & ((P[:, 1] < .1) if front else (P[:, 1] > .25))
  def _binmean(self, z, v, bins):
    out_z = []; out_v = []
    for b in bins:
      m = (z >= b) & (z < b + .05)
      if m.sum() > 0: out_z.append(b); out_v.append(v[m].mean())
    return (np.array(out_z) if len(out_z) else bins[:1]), (np.array(out_v) if len(out_v) else np.array([0.]))
  def points(self, P, thin=True):
    Q = P.copy()
    if thin:
      for (sx, front) in self.legs:
        m = self._leg_mask(P, sx, front)
        if not m.any(): continue
        bins, cx, cy = self.cent[(sx, front)]
        c = np.stack([np.interp(P[m][:, 2], bins, cx), np.interp(P[m][:, 2], bins, cy)], 1)
        k = .74 + .1 * sstep(.1, .5, P[m][:, 2])
        Q[m, 0] = c[:, 0] + (P[m][:, 0] - c[:, 0]) * k; Q[m, 1] = c[:, 1] + (P[m][:, 1] - c[:, 1]) * k
      # Rumpf schmal (Brustkorb tief, Flanke eingefallen)
      tor = sstep(.5, .62, P[:, 2]) * (1 - sstep(.78, 1.0, np.abs(P[:, 1] - .15) * 0 + P[:, 2]) * 0)
      Q[:, 0] *= 1 - .16 * tor
    # Kopf größer um Kopfmitte
    t = (P - self.n0) @ self.dir / self.L
    wh = sstep(.82, 1.0, t)
    c = self.hd + np.array([0, -.1, .02]); Q = Q + (Q - c) * (self.head_s - 1) * wh[:, None]
    # Läufe strecken (Hufe bleiben)
    z = P[:, 2]; z2 = np.where(z < .10, z, np.where(z < self.zc, .10 + (z - .10) * self.a, z + (self.zc - .10) * (self.a - 1)))
    Q[:, 2] = Q[:, 2] - z + z2
    # Hals strecken (Kopf wandert mit)
    s = sstep(0, 1, np.clip(t, 0, 1.0)) * self.neck_k
    s = np.where(t > 1.0, self.neck_k, s) * (P[:, 1] < self.n0[1] + .12)  # nur vor dem Brustbein
    Q += self.dir[None, :] * s[:, None]
    # Schnauze länger (wirkt weniger „niedlich“): Streckung entlang der Kopfachse vor der Kopfmitte
    hdir = np.array([0, -.97, -.24]); hc = self.hd + self.dir * self.neck_k + np.array([0, 0, 0])
    pr = (Q - hc) @ hdir; Q = Q + hdir[None, :] * (.4 * np.clip(pr - .12, 0, .5) * (t > .85))[:, None]
    return Q
  def pt(self, p): return self.points(np.asarray(p, float)[None, :], thin=False)[0]

def tooth_rows(me, arm):
  """Zähne (Kegel) in der Mundspalte an der Seite des Kopfes; Mundlinie aus den tiefsten Punkten der Kopfseite abgeleitet."""
  P = verts_np(me, False); w = group_weight(me, ['-Head', 'Ponytail1']); H = P[w > .5]
  tip = H[:, 1].min(); up = []; lo = []; n = 7
  for sx in (1, -1):
    for i in range(n):
      t = i / (n - 1); y = tip + .06 + t * .22
      band = H[(np.abs(H[:, 1] - y) < .02) & (np.sign(H[:, 0]) == sx) & (np.abs(H[:, 0]) > .012)]
      if len(band) < 3: continue
      zlow = np.sort(band[:, 2])[max(0, len(band) // 6)]          # untere Lippen-/Kieferkante
      zline = zlow + .028 + .01 * t
      half = np.abs(band[:, 0]).max() * .78
      x = sx * half
      r = .0055 + .0012 * ((i * 5) % 3)
      up.append(((x, y, zline + .004), (x * .99, y - .002, zline - .022 - .004 * ((i * 5) % 3)), r))
      lo.append(((x * .97, y + .006, zline - .026), (x * .98, y + .002, zline + .004 + .005 * ((i * 3) % 2)), r * .9))
  return up, lo

def antler_paths(base, side, S=1.0, asym=True, seed=0):
  """Geweih einer Seite als Liste von (Punkte, Radien); Rahmen = Stag-Original (vor der Verformung). side = +1 links, −1 rechts."""
  r = np.random.RandomState(seed + (0 if side > 0 else 7)); B = np.array(base, float)
  def P(dx, dy, dz): return B + np.array([side * dx, dy, dz]) * S
  def curve(pts, rad, n=14, wob=.012):
    pts = np.array(pts); t = np.linspace(0, 1, len(pts)); tt = np.linspace(0, 1, n)
    C = np.stack([np.interp(tt, t, pts[:, k]) for k in range(3)], 1)
    # Glättung durch gleitendes Mittel + organisches Wackeln
    for k in range(3):
      C[:, k] = np.convolve(np.pad(C[:, k], 2, mode='edge'), np.ones(5) / 5, mode='valid')
    C += (np.stack([fbm(C * 9 + k * 5.3, 2, k) for k in range(3)], 1) - .5) * wob * 2
    R = np.interp(tt, np.linspace(0, 1, len(rad)), rad)
    return C, R
  out = []
  beam = [P(0, 0, 0), P(.05, .06, .20), P(.13, .13, .42), P(.20, .17, .66), P(.24, .14, .90), P(.20, .04, 1.12), P(.13, -.10, 1.27), P(.08, -.22, 1.30)]
  C, R = curve(beam, [.052, .042, .036, .032, .027, .02, .012, .006], n=20); out.append((C, R))
  def branch(i, pts, rad, n=9, wob=.009):
    o = C[i]; pp = [o] + [o + np.array([side * q[0], q[1], q[2]]) * S for q in pts]; return curve(pp, rad, n=n, wob=wob)
  out.append(branch(3, [(.06, -.07, .12), (.12, -.17, .22), (.16, -.30, .27)], [.028, .022, .016, .006]))   # Augsprosse: nach vorn
  out.append(branch(6, [(.08, -.03, .10), (.17, -.05, .20), (.27, -.08, .26)], [.026, .02, .013, .005]))     # Eissprosse
  out.append(branch(10, [(.10, .02, .14), (.22, .05, .24), (.34, .08, .30)], [.024, .019, .013, .005]))       # Mittelsprosse
  out.append(branch(14, [(.03, .08, .12), (.0, .15, .24), (-.06, .20, .32)], [.02, .015, .01, .004]))       # Krone hinten
  out.append(branch(16, [(-.04, -.05, .10), (-.12, -.10, .18), (-.2, -.16, .22)], [.018, .013, .008, .003]))   # Krone innen
  if asym and side < 0:  # rechte Stange: eine Sprosse wächst nach unten quer über die Wange („schief nachgewachsen“)
    out.append(branch(4, [(.10, -.12, -.02), (.12, -.22, -.24), (.06, -.30, -.50)], [.028, .023, .017, .007], n=12, wob=.014))
    out.append(branch(8, [(.12, .08, .08), (.24, .16, .12)], [.019, .014, .005]))
  if asym and side > 0:  # linke Stange: abgebrochene Spitze mit Zacken, zusätzliche kurze Sprosse
    out[0] = (out[0][0][:17], out[0][1][:17])
    out.append(branch(7, [(.02, .14, .02), (.0, .26, .0)], [.02, .015, .006], n=7))
  return out

def build_antler_mesh(paths, sides, name):
  parts = []
  for C, R in paths:
    Pn = Gn_blender = C  # schon im Blender-Rahmen
    V, F = tube(Pn, R, sides=sides, cap=True); parts.append(mesh_from(name, V, F))
  # Basisring (Rosenstock): Wulst am Ansatz
  C0, R0 = paths[0]; V, F = tube([C0[0] - (C0[1] - C0[0]) * .6, C0[0], C0[0] + (C0[1] - C0[0]) * .8], [.03, .042, .036], sides=sides, cap=True); parts.append(mesh_from(name, V, F))
  return merge(parts, name)

def bast_strips(paths, rs_):
  """Hängende Baststreifen als schmale Bänder an den Stangen (Blender-Rahmen) → Netz."""
  V = []; F = []
  for C, R in paths[:3]:
    for k in range(3):
      i = rs_.randint(3, len(C) - 2); p = C[i] + np.array([0, 0, -.004]); w = .012 + rs_.rand() * .012; L = .16 + rs_.rand() * .22; n = 6
      d = np.array([rs_.randn() * .1, rs_.randn() * .1, -1.0]); d /= np.linalg.norm(d); side = np.cross(d, [0, 1, 0]); side /= np.linalg.norm(side) + 1e-9
      b = len(V)
      for j in range(n):
        t = j / (n - 1); q = p + d * L * t + np.array([0, 0, 0]) + np.array([np.sin(t * 5 + i) * .015, np.cos(t * 4) * .012, 0]) * t
        ww = w * (1 - .55 * t) * (.7 + .5 * np.sin(j * 2.1 + i))
        V.append(q - side * ww); V.append(q + side * ww)
      for j in range(n - 1): F.append((b + 2 * j, b + 2 * j + 1, b + 2 * j + 3, b + 2 * j + 2))
  return mesh_from('bast', V, F)

def build_hirschding():
  arm, me = load_base('stag'); strip_fur(me); drop_antlers(me); weld(me)
  densify(me, .55)   # mehr Fläche für Kopf-/Rippenpinsel (vor Verformung und Pinseln)
  W_ = Warp(arm, me)
  P0 = verts_np(me, False); P = W_.points(P0); set_verts(me, P)
  # Knochen verformen (Edit-Modus): Köpfe/Schwänze mit derselben Abbildung
  sel([arm]); bpy.ops.object.mode_set(mode='EDIT')
  for eb in arm.data.edit_bones:
    h = W_.pt(np.array(eb.head)); t = W_.pt(np.array(eb.tail)); eb.head = Vector(h); eb.tail = Vector(t)
  bpy.ops.object.mode_set(mode='OBJECT')
  # Pinsel (Augenhöhlen, Jochbein, Nase, Gelenke, Wirbel, Becken)
  hd = bone_pos(arm, '-Head'); Nn = normals_np(me); P = verts_np(me, False); F = doe_features(arm)
  def f(p, r, amt, mir=True, d=None):
    F.append((np.array(p, float), r, amt, d))
    if mir and abs(p[0]) > 1e-4: F.append((np.array((-p[0], p[1], p[2]), float), r, amt, d))
  f((hd[0] + .082, hd[1] - .13, hd[2] + .035), .075, -.085); f((hd[0] + .076, hd[1] - .125, hd[2] + .03), .04, -.06)       # Augenhöhlen (tief)
  f((hd[0] + .085, hd[1] - .12, hd[2] + .085), .05, .016); f((hd[0] + .09, hd[1] - .22, hd[2] - .03), .06, .015)            # Brauen, Jochbein
  f((hd[0] + .075, hd[1] - .22, hd[2] - .075), .06, -.03)                                                                  # Wangenmulde
  f((hd[0] + .03, hd[1] - .44, hd[2] - .14), .05, -.055); f((hd[0], hd[1] - .47, hd[2] - .12), .05, -.04, False)         # Nasenöffnung (aufgerissen)
  f((hd[0] + .07, hd[1] - .30, hd[2] - .045), .05, -.03)                                                                   # Schnauzenseite eingefallen
  f((hd[0], hd[1] - .26, hd[2] + .04), .05, .012, False)                                                                  # Nasenrücken
  # Gelenke nach der Streckung: Knie, Sprunggelenk, Ellbogen, Handwurzel
  for nm, amt, r in (('-L-Calf', .025, .06), ('-L-HorseLink', .03, .05), ('-L-Forearm', .02, .05), ('-L-Hand', .022, .045)):
    b = bone_pos(arm, nm); f((b[0], b[1], b[2]), r, amt, False); f((-b[0], b[1], b[2]), r, amt, False)
  apply_feats(P, Nn, F); set_verts(me, P); smooth(me)
  return arm, me, W_

def hi_part(o, knochen=1., blut=.1, fett=0., disp=.0, seed=0, kante=0.):
  """Teil für die hohe Fassung: Attribute wie make_hi, Rauhigkeit (Rinde/Riefen) als Verschiebung."""
  P = verts_np(o); N = normals_np(o)
  if disp: P = P + N * ((fbm(P * 55, 3, seed) - .5) * disp + (np.sin(P[:, 2] * 140 + fbm(P * 8, 2, seed) * 9) * .5 + .5) * disp * .5)[:, None]; set_verts(o, P)
  n = len(P); fb = fbm(P * 5, 3, 1); ev = lambda a: a(P) if callable(a) else np.full(n, a)
  for k, v in dict(zell=fbm(P * 9, 2, 3), kante=ev(kante), ader=np.zeros(n), knochen=ev(knochen) * (.8 + .2 * fb), blut=ev(blut) * (.4 + .9 * fb), fett=ev(fett), mott=fb).items(): add_attr(o, k, np.clip(v, 0, 1))
  return o

def finish_hirschding(arm, me, W_):
  hd = bone_pos(arm, '-Head'); S = .62
  base_o = np.array([.095, -.86, 1.50])   # Ansatz im Original-Rahmen des Stags (links), Rechte spiegelt x
  low = []; hi = []
  for side in (1, -1):
    paths = antler_paths(base_o * np.array([side, 1, 1]), side, S, True, 3)
    paths = [(W_.points(C, thin=False), R) for C, R in paths]
    g = build_antler_mesh(paths, 6, 'geweih'); low.append(g)
    gh = build_antler_mesh(paths, 12, 'geweih_hi'); subsurf(gh, 1)
    # Farbvariation: Knochenweiß, braune Trockenblut-Schlieren (kante), frisches Blut an Spitzen und Ansatz, gelblicher Bast-Rest (fett) am Ansatz
    hi.append(hi_part(gh, 1., lambda P_: .75 * sstep(.45, .8, fbm(P_ * 14, 3, 21)) + .6 * sstep(P_[:, 2].max() - .25, P_[:, 2].max(), P_[:, 2]), lambda P_: .6 * sstep(P_[:, 2].min() + .35, P_[:, 2].min(), P_[:, 2]), .0035, 3 + side, kante=lambda P_: .85 * sstep(.5, .75, fbm(P_ * 6 + 3, 3, 17))))
    bl = bast_strips(paths, np.random.RandomState(5 + side)); low.append(bl)
    bh = bast_strips(paths, np.random.RandomState(5 + side)); subsurf(bh, 1); hi.append(hi_part(bh, 0., .45, .8, .002, 9))
  up, lo = [], []; tl = []; th = []
  for (a_, b_, r) in up + lo:
    V, F_ = tube([a_, b_], [r * 1.5, r * .25], sides=5, cap=False); tl.append(mesh_from('zahn', V, F_))
    V, F_ = tube([a_, b_], [r * 1.5, r * .25], sides=8, cap=False); th.append(mesh_from('zahn_h', V, F_))
  for o in tl + th: bpy.data.objects.remove(o, do_unlink=True)  # Zähne: siehe Offenes (Platzierung an der Mundspalte noch nicht sauber)
  return low, hi

def jaw_and_bones(arm, me, parts):
  """Kieferknochen + Geweihknochen anlegen, Gewichte für Anbauteile setzen."""
  hd = bone_pos(arm, '-Head'); P = verts_np(me, False); wH = group_weight(me, ['-Head', 'Ponytail1']); H = P[wH > .5]
  tip = H[:, 1].min(); near = H[H[:, 1] < tip + .05]; zm = near[:, 2].min() + .30 * (near[:, 2].max() - near[:, 2].min())
  sel([arm]); bpy.ops.object.mode_set(mode='EDIT'); E = arm.data.edit_bones
  headb = next(b for b in E if b.name.endswith('-Head'))
  hinge = Vector((0, hd[1] + .02, zm - .02)); jb = E.new('STAG_-Jaw'); jb.head = hinge; jb.tail = Vector((0, tip + .1, zm - .035)); jb.parent = headb
  ab = {}
  for side, nm in ((1, 'L'), (-1, 'R')):
    b = E.new('STAG_-Antler' + nm); b.head = Vector((side * .09, hd[1] + .02, hd[2] + .12)); b.tail = b.head + Vector((side * .06, .06, .5)); b.parent = headb; ab[nm] = b.head.copy()
  bpy.ops.object.mode_set(mode='OBJECT')
  # Unterkiefer-Gewichte am Körper: Kopfpunkte unter der Mundlinie → Jaw (weich über 2,5 cm)
  jw = np.where(wH > .5, sstep(zm + .012, zm - .02, P[:, 2]) * sstep(hd[1] - .08, hd[1] - .16, P[:, 1]) * (1 - sstep(P[:, 2].min() + 0.0, P[:, 2].min() + .0, P[:, 2]) * 0), 0.)
  idx = np.nonzero(jw > .02)[0]
  gJ = me.vertex_groups.new(name='STAG_-Jaw'); gH = next(g for g in me.vertex_groups if g.name.endswith('-Head'))
  for i in idx:
    wv = float(jw[i]); gJ.add([int(i)], wv, 'REPLACE'); cur = [g.weight for g in me.data.vertices[i].groups if g.group == gH.index]
    if cur: gH.add([int(i)], max(0., cur[0] * (1 - wv)), 'REPLACE')
  return zm, ab, jw, tip

def assign_parts(parts, arm, ab, zm):
  for o in parts:
    P = verts_np(o, False)
    if o.name.startswith('zaehne'):
      gJ = o.vertex_groups.new(name='STAG_-Jaw'); gH = o.vertex_groups.new(name='STAG_-Head')
      for v in o.data.vertices:
        (gJ if v.co.z < zm - .0 else gH).add([v.index], 1.0, 'REPLACE')
    else:
      gH = o.vertex_groups.new(name='STAG_-Head'); side = 'L' if P[:, 0].mean() > 0 else 'R'; gA = o.vertex_groups.new(name='STAG_-Antler' + side)
      d = np.linalg.norm(P - np.array(ab[side]), axis=1)
      for v in o.data.vertices:
        k = float(sstep(.1, .35, d[v.index])); gA.add([v.index], k, 'REPLACE'); gH.add([v.index], 1 - k, 'REPLACE')
