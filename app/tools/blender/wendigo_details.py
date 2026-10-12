# Wendigo · Detailteile (Rippen, Wirbel, Zähne, Augen, Sehnenstränge) – wird von wendigo_tiere_bau.py per exec geladen (teilt den Namensraum).
# Alle Teile entstehen als eigene Netze (niedrige + hohe Fassung) und übernehmen die Hautgewichte des nächsten Körperpunktes (skin_like), damit sie Clips und Morphs folgen.
from mathutils import kdtree

def cone(foot, tip, r, sides=5, name='zahn'):
  foot = Vector(foot); tip = Vector(tip); ax = (tip - foot); L = ax.length
  if L < 1e-6: return None
  t = ax / L; ref = Vector((0, 0, 1)) if abs(t.z) < .9 else Vector((1, 0, 0)); u = t.cross(ref).normalized(); w = t.cross(u).normalized()
  V = [foot + (u * math.cos(2 * math.pi * i / sides) + w * math.sin(2 * math.pi * i / sides)) * r for i in range(sides)] + [tip, foot - t * r * .5]
  F = [(i, (i + 1) % sides, sides) for i in range(sides)] + [((i + 1) % sides, i, sides + 1) for i in range(sides)]
  return mesh_from(name, V, F)

def skin_like(parts, body, fallback=None):
  """Gewichte der Teile = Gewichte des nächsten Körperpunktes (Namen der Vertexgruppen des Körpers)."""
  me = body.data; kd = kdtree.KDTree(len(me.vertices))
  for v in me.vertices: kd.insert(v.co, v.index)
  kd.balance(); gname = {g.index: g.name for g in body.vertex_groups}
  for o in parts:
    cache = {}
    for v in o.data.vertices:
      i = kd.find(v.co)[1]
      for g in me.vertices[i].groups:
        n = gname.get(g.group)
        if n is None or g.weight < .01: continue
        vg = o.vertex_groups.get(n) or o.vertex_groups.new(name=n); vg.add([v.index], g.weight, 'REPLACE')

def rib_parts(body, arm, n=9, offset=.006, rad=.011, hi_sides=10, flat=1.0):
  """Rippenbögen + Dornfortsätze als Geometrie entlang der Rumpfflächen. Rückgabe (low_objects, hi_objects)."""
  P = verts_np(body, False); nk = bone_pos(arm, '-Neck'); sp = bone_pos(arm, '-Spine'); hip = bone_pos(arm, 'Pelvis')
  y0 = nk[1] + .10; y1 = sp[1] + .02; low = []; hi = []
  for i in range(n):
    y = y0 + (y1 - y0) * i / (n - 1)
    sl = P[(np.abs(P[:, 1] - y) < .05) & (np.abs(P[:, 0]) < .4) & (P[:, 2] > hip[2] * .55)]
    if len(sl) < 12: continue
    zc = (np.percentile(sl[:, 2], 97) + np.percentile(sl[:, 2], 3)) / 2; c = np.array([0, y, zc])
    for s in (1, -1):
      side = sl[sl[:, 0] * s > 0.005]
      if len(side) < 6: continue
      ang = np.arctan2(side[:, 2] - zc, s * side[:, 0]); rr = np.hypot(side[:, 2] - zc, side[:, 0])
      pts = []; angs = np.radians(np.linspace(-70, 65, 9))
      rs = []
      for a_ in angs:
        m = np.abs(ang - a_) < .24
        rs.append(np.percentile(rr[m], 85) if m.sum() >= 2 else np.nan)
      rs = np.array(rs)
      if np.isnan(rs).all(): continue
      ok = ~np.isnan(rs); rs = np.interp(np.arange(len(rs)), np.nonzero(ok)[0], rs[ok])
      for a_, r_ in zip(angs, rs):
        d = np.array([s * math.cos(a_), 0, math.sin(a_)]); pts.append(c + d * (r_ + offset))
      R = [rad * (.45 + .55 * math.sin(math.pi * (j + .5) / len(pts))) * (1 + .12 * math.sin(i * 2.1 + j)) for j in range(len(pts))]
      V, F = tube(pts, R, sides=5, cap=True); low.append(mesh_from('rippe', V, F))
      V, F = tube(pts, R, sides=hi_sides, cap=True); hi.append(mesh_from('rippe_h', V, F))
  # Dornfortsätze: kleine gestauchte Kugeln auf der Rückenlinie
  for y in np.linspace(hip[1] - .12, nk[1] + .05, 12):
    sl = P[(np.abs(P[:, 1] - y) < .02) & (np.abs(P[:, 0]) < .035)]
    if len(sl) < 3: continue
    zt = sl[:, 2].max(); r = .017 + .004 * math.sin(y * 30)
    for sides, out in ((5, low), (9, hi)):
      V = []; F = []; rings = 3
      for j in range(rings + 1):
        for k in range(sides):
          a = 2 * math.pi * k / sides; t = j / rings; rr = r * math.sin(math.pi * t + .3) * 1.0
          V.append((rr * math.cos(a), y + rr * math.sin(a) * 1.4, zt - .006 + r * 1.5 * t))
      V.append((0, y, zt - .008)); V.append((0, y, zt - .006 + r * 1.7)); b = len(V) - 2; t_ = len(V) - 1
      for k in range(sides): F.append((b, (k + 1) % sides, k))
      for j in range(rings):
        for k in range(sides): F.append((j * sides + k, j * sides + (k + 1) % sides, (j + 1) * sides + (k + 1) % sides, (j + 1) * sides + k))
      for k in range(sides): F.append((rings * sides + k, rings * sides + (k + 1) % sides, t_))
      out.append(mesh_from('wirbel', V, F))
  return low, hi

def teeth_from_boundary(me, arm, zm, tip, jaw_w, rnd):
  """Unregelmäßiges Gebiss an der Mundlinie (Grenzpunkte zwischen Kopf und Kiefergewichten); Lücken, schiefe/abgebrochene Zähne."""
  P = verts_np(me, False); idx = np.nonzero((jaw_w > .25) & (jaw_w < .75))[0]
  if len(idx) < 6: return [], []
  low = []; hi = []
  for s in (1, -1):
    B = P[idx][np.sign(P[idx][:, 0]) == s]
    if len(B) < 3: continue
    B = B[np.argsort(B[:, 1])]
    last = -9
    for k in range(0, len(B)):
      if rnd.rand() < .3 or B[k, 1] - last < .03: continue
      last = B[k, 1]; p = B[k].copy(); p[0] *= .93
      L = rnd.choice([.03, .045, .06, .075], p=[.2, .35, .3, .15]); r = .009 + rnd.rand() * .005
      up = rnd.rand() < .5; jit = np.array([(rnd.rand() - .5) * .012, (rnd.rand() - .5) * .014, 0])
      tipv = p + jit + np.array([0, 0, -L if up else L]); foot = p + np.array([0, 0, .006 if up else -.006])
      c1 = cone(foot, tipv, r, 5, 'zahn'); c2 = cone(foot, tipv, r, 8, 'zahn_h')
      if c1: low.append(c1)
      if c2: hi.append(c2)
  return low, hi

def eye_parts(arm, hd, sx_off, dy, dz, r=.02, emissive=True):
  """Augäpfel in den Höhlen: Kugel mit eigenem Material (milchig, Glut dahinter)."""
  objs = []; m = bpy.data.materials.new('wd_auge'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
  b.inputs['Base Color'].default_value = (.10, .08, .07, 1) if emissive else (.72, .70, .62, 1); b.inputs['Roughness'].default_value = .12
  if emissive: b.inputs['Emission Color'].default_value = (1.0, .22, .04, 1); b.inputs['Emission Strength'].default_value = 2.4
  for s in (1, -1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=7, radius=r, location=(hd[0] + s * sx_off, hd[1] + dy, hd[2] + dz))
    o = bpy.context.object; o.name = 'auge'; smooth(o); o.data.materials.append(m); objs.append(o)
  return objs

def cord_parts(pairs, rad=.0065, sides=5, bow=.012):
  """Sehnenstränge: gebogene dünne Röhren zwischen Punktpaaren (Blender-Rahmen)."""
  low = []; hi = []
  for a, b, out in pairs:
    a = np.array(a); b = np.array(b); m = (a + b) / 2 + np.array(out) * bow
    pts = [a, (a + m) / 2 + np.array(out) * bow * .4, m, (m + b) / 2 + np.array(out) * bow * .4, b]
    R = [rad * (.9 + .4 * math.sin(math.pi * j / 4)) for j in range(5)]
    V, F = tube(pts, R, sides=sides, cap=True); low.append(mesh_from('strang', V, F))
    V, F = tube(pts, R, sides=9, cap=True); hi.append(mesh_from('strang_h', V, F))
  return low, hi
