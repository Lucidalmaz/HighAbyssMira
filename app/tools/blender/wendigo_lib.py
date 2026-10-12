# Wendigo-Formen: gemeinsame Werkzeuge für die Blender-Bauskripte (wendigo_hirschding_bau.py, wendigo_tiere_bau.py).
# Aufruf aus den Bauskripten:  exec(open(<ordner>/wendigo_lib.py, encoding='utf8').read())
# Inhalt: Koordinaten (Spielrahmen → Blender), Zahlenrauschen (numpy, vektorisiert), Skin-Modifier-Körper aus Knotengraphen, „Pinsel“ (Wölbung/Mulde), Röhren (Geweih, Zähne),
#         Attribut-Masken, Backen (Cycles: Normal/Albedo/Rauheit/AO von hoher auf niedrige Auflösung), ORM-Packen, Export.
import bpy, bmesh, math, os, sys, json, time
import numpy as np
from mathutils import Vector, Quaternion, Matrix, Euler
T0 = time.time()
LOGF = [None]
def log(*a):
  t = '[%5.0fs] ' % (time.time() - T0) + ' '.join(str(x) for x in a); print(t, flush=True)
  if LOGF[0]:
    with open(LOGF[0], 'a', encoding='utf8') as f: f.write(t + chr(10))
def run_main(fn, logfile):
  import traceback; LOGF[0] = logfile
  open(logfile, 'w').close()
  try: fn()
  except Exception: log('FEHLER' + chr(10) + traceback.format_exc())
scn = bpy.context.scene

# ---------------------------------------------------------------- Rahmen: Spiel (x links, y oben, z vorn) → Blender (x links, y = −vorn, z oben); glTF-Export dreht zurück
def G(x, y, z): return Vector((x, -z, y))
def Gn(P): P = np.asarray(P, dtype=np.float64); return np.stack([P[..., 0], -P[..., 2], P[..., 1]], -1)

# ---------------------------------------------------------------- Rauschen (numpy, ohne Schleifen über Punkte)
def _h(ix, iy, iz, seed=0):
  n = (ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 1274126177) & 0xffffffff
  n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff; n ^= n >> 16
  return (n & 0xffffff).astype(np.float64) / 16777215.0
def vnoise(P, seed=0):  # Wertrauschen 0…1, P: (N,3)
  P = np.asarray(P); i = np.floor(P).astype(np.int64); f = P - i; f = f * f * (3 - 2 * f); x, y, z = i[:, 0], i[:, 1], i[:, 2]
  def L(dx, dy, dz): return _h(x + dx, y + dy, z + dz, seed)
  c00 = L(0, 0, 0) * (1 - f[:, 0]) + L(1, 0, 0) * f[:, 0]; c10 = L(0, 1, 0) * (1 - f[:, 0]) + L(1, 1, 0) * f[:, 0]
  c01 = L(0, 0, 1) * (1 - f[:, 0]) + L(1, 0, 1) * f[:, 0]; c11 = L(0, 1, 1) * (1 - f[:, 0]) + L(1, 1, 1) * f[:, 0]
  c0 = c00 * (1 - f[:, 1]) + c10 * f[:, 1]; c1 = c01 * (1 - f[:, 1]) + c11 * f[:, 1]
  return c0 * (1 - f[:, 2]) + c1 * f[:, 2]
def fbm(P, oct=4, seed=0, lac=2.03, gain=.5):
  s = 0.; a = 1.; tot = 0.
  for o in range(oct): s = s + a * vnoise(P * (lac ** o) + o * 17.3, seed + o); tot += a; a *= gain
  return s / tot
def cells(P, seed=0):  # Zellrauschen (Voronoi): liefert F1, F2−F1 (Kante), Zellkennung 0…1
  P = np.asarray(P); i = np.floor(P).astype(np.int64); f1 = np.full(len(P), 9.); f2 = np.full(len(P), 9.); cid = np.zeros(len(P))
  for dx in (-1, 0, 1):
    for dy in (-1, 0, 1):
      for dz in (-1, 0, 1):
        cx, cy, cz = i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz
        px = cx + _h(cx, cy, cz, seed + 1); py = cy + _h(cx, cy, cz, seed + 2); pz = cz + _h(cx, cy, cz, seed + 3)
        d = np.sqrt((P[:, 0] - px) ** 2 + (P[:, 1] - py) ** 2 + (P[:, 2] - pz) ** 2)
        m = d < f1; f2 = np.where(m, f1, np.minimum(f2, d)); cid = np.where(m, _h(cx, cy, cz, seed + 9), cid); f1 = np.where(m, d, f1)
  return f1, f2 - f1, cid
def sstep(a, b, x): t = np.clip((x - a) / (b - a + 1e-12), 0, 1); return t * t * (3 - 2 * t)

# ---------------------------------------------------------------- Netze
def clear_scene():
  for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
  for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)
def sel(objs, act=None):
  bpy.ops.object.select_all(action='DESELECT')
  for o in objs: o.select_set(True)
  bpy.context.view_layer.objects.active = act or objs[0]
def verts_np(o, world=True):
  n = len(o.data.vertices); a = np.empty(n * 3); o.data.vertices.foreach_get('co', a); a = a.reshape(n, 3)
  if world: M = np.array(o.matrix_world); a = a @ M[:3, :3].T + M[:3, 3]
  return a
def set_verts(o, a):
  o.data.vertices.foreach_set('co', np.asarray(a, dtype=np.float32).ravel()); o.data.update()
def normals_np(o):
  o.data.update(); n = len(o.data.vertices); a = np.empty(n * 3); o.data.vertex_normals.foreach_get('vector', a); return a.reshape(n, 3)
def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
def smooth(o):
  for p in o.data.polygons: p.use_smooth = True
def apply_mods(o):
  sel([o]); dg = bpy.context.evaluated_depsgraph_get(); ev = o.evaluated_get(dg); me = bpy.data.meshes.new_from_object(ev); old = o.data
  for m in list(o.modifiers): o.modifiers.remove(m)
  o.data = me; bpy.data.meshes.remove(old); return o

def skin_body(name, nodes, edges, level=2, branch=.55):
  """nodes: {key: ((x, y, z) Spielrahmen, r)} oder (…, (rx, ry)); edges: [(keyA, keyB)] → Netz mit Skin-Modifier + Unterteilung (angewendet)."""
  keys = list(nodes); idx = {k: i for i, k in enumerate(keys)}
  me = bpy.data.meshes.new(name); me.from_pydata([G(*nodes[k][0]) for k in keys], [(idx[a], idx[b]) for a, b in edges], []); me.update()
  o = bpy.data.objects.new(name, me); scn.collection.objects.link(o); sel([o])
  m = o.modifiers.new('skin', 'SKIN'); m.branch_smoothing = branch; m.use_smooth_shade = True
  sv = me.skin_vertices[0].data
  for k in keys:
    r = nodes[k][1]; sv[idx[k]].radius = (r, r) if not isinstance(r, (tuple, list)) else tuple(r)
  sv[0].use_root = True
  s = o.modifiers.new('sub', 'SUBSURF'); s.levels = level; s.render_levels = level; s.subdivision_type = 'CATMULL_CLARK'
  apply_mods(o); smooth(o); return o

def brush(P, N, c, r, amt, falloff=2.0, dirv=None):
  """Wölbung (amt>0) oder Mulde (amt<0) um Punkt c (Blender-Rahmen) mit Radius r entlang der Normalen (oder dirv)."""
  d = np.linalg.norm(P - c, axis=1); w = np.clip(1 - d / r, 0, 1) ** falloff * (3 - 2 * np.clip(1 - d / r, 0, 1))
  w = np.clip(1 - d / r, 0, 1); w = w * w * (3 - 2 * w)
  if dirv is None: P += N * (amt * w)[:, None]
  else: P += np.asarray(dirv)[None, :] * (amt * w)[:, None]
  return w
def seg_dist(P, a, b):
  a = np.asarray(a, float); b = np.asarray(b, float); ab = b - a; t = np.clip(((P - a) @ ab) / (ab @ ab + 1e-12), 0, 1); q = a + t[:, None] * ab
  return np.linalg.norm(P - q, axis=1), t
def capsule_mask(P, a, b, r0, r1=None, soft=.35):
  """Maske 0…1 um die Strecke a–b (Blender-Rahmen) mit Radius r0 (bei a) → r1 (bei b)."""
  d, t = seg_dist(P, a, b); r = r0 + ((r1 if r1 is not None else r0) - r0) * t; return 1 - sstep(r * (1 - soft), r * (1 + soft * .0 + soft), d)

def tube(points, radii, sides=6, cap=True, seed=0, twist=0.):
  """Röhre entlang Punkten (Blender-Rahmen) mit Radien → (verts, faces). Parallel-Transport-Rahmen, Spitze geschlossen."""
  pts = [Vector(p) for p in points]; n = len(pts); V = []; F = []
  tan = [(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(n)]
  ref = Vector((0, 0, 1)) if abs(tan[0].z) < .9 else Vector((1, 0, 0)); u = tan[0].cross(ref).normalized(); w = tan[0].cross(u).normalized()
  for i in range(n):
    if i > 0:  # Rahmen mitführen
      q = tan[i - 1].rotation_difference(tan[i]); u = (q @ u).normalized(); w = (q @ w).normalized()
    for s in range(sides):
      a = 2 * math.pi * s / sides + twist * i; V.append(pts[i] + (u * math.cos(a) + w * math.sin(a)) * radii[i])
  for i in range(n - 1):
    for s in range(sides): F.append((i * sides + s, i * sides + (s + 1) % sides, (i + 1) * sides + (s + 1) % sides, (i + 1) * sides + s))
  if cap:
    V.append(pts[-1] + tan[-1] * radii[-1] * .6); e = len(V) - 1
    for s in range(sides): F.append(((n - 1) * sides + s, (n - 1) * sides + (s + 1) % sides, e))
    V.append(pts[0] - tan[0] * radii[0] * .3); b = len(V) - 1
    for s in range(sides): F.append((s, b, (s + 1) % sides))
  return V, F
def mesh_from(name, V, F, coll=None):
  me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in V], [], F); me.update(); o = bpy.data.objects.new(name, me); (coll or scn.collection).objects.link(o); smooth(o); return o
def merge(objs, name):
  sel(objs); bpy.ops.object.join(); o = bpy.context.object; o.name = name; o.data.name = name; return o
def subsurf(o, level, simple=False):
  s = o.modifiers.new('s', 'SUBSURF'); s.levels = level; s.render_levels = level; s.subdivision_type = 'SIMPLE' if simple else 'CATMULL_CLARK'; apply_mods(o); smooth(o); return o
def add_attr(o, name, arr, typ='FLOAT'):
  at = o.data.attributes.get(name) or o.data.attributes.new(name, typ, 'POINT'); at.data.foreach_set('value', np.asarray(arr, dtype=np.float32))
def vgroup(o, name, idx=None, w=1.0):
  g = o.vertex_groups.get(name) or o.vertex_groups.new(name = name)
  g.add(list(range(len(o.data.vertices))) if idx is None else list(idx), w, 'REPLACE'); return g

# ---------------------------------------------------------------- Materialien (nur zum Backen und für die Vorschau)
def new_mat(name):
  m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree.nodes, m.node_tree.links
def attr_node(nt, name):
  n = nt.nodes.new('ShaderNodeAttribute'); n.attribute_name = name; n.attribute_type = 'GEOMETRY'; return n
def ramp(nt, stops, inp=None):
  r = nt.nodes.new('ShaderNodeValToRGB'); e = r.color_ramp.elements
  while len(e) < len(stops): e.new(.5)
  for el, (p, c) in zip(e, stops): el.position = p; el.color = c
  if inp is not None: nt.links.new(inp, r.inputs[0])
  return r

# ---------------------------------------------------------------- Backen (Cycles, Hoch → Niedrig, Objektraum-unabhängig durch Attribute)
def uv_unwrap(o, angle=82, margin=.003):
  sel([o]); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
  bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=margin, area_weight=.6, correct_aspect=True, scale_to_bounds=True)
  bpy.ops.object.mode_set(mode='OBJECT')
  uv = np.empty(len(o.data.loops) * 2); o.data.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
  log('UV', uv.min(0).round(3), uv.max(0).round(3))
def bake_pass(low, hi_objs, kind, size, path, ray=.05, cage=.02, margin=10, samples=8, pass_filter=None, normal=False):
  """Backt `kind` (NORMAL/DIFFUSE/ROUGHNESS/AO) von hi_objs auf low in ein Bild und speichert es als PNG. low braucht ein Material mit aktivem Bild-Knoten."""
  scn.render.engine = 'CYCLES'; scn.cycles.device = 'CPU'; scn.cycles.samples = samples; scn.cycles.use_denoising = False
  img = bpy.data.images.new('bake_' + kind, size, size, alpha=False, float_buffer=False)
  if kind == 'NORMAL': img.colorspace_settings.name = 'Non-Color'
  elif kind in ('ROUGHNESS', 'AO'): img.colorspace_settings.name = 'Non-Color'
  mat = low.data.materials[0]; nt = mat.node_tree
  for n in list(nt.nodes):
    if n.type == 'TEX_IMAGE': nt.nodes.remove(n)
  tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = img; nt.nodes.active = tx; tx.select = True
  for o in scn.objects: o.select_set(False)
  for h in hi_objs: h.select_set(True)
  low.select_set(True); bpy.context.view_layer.objects.active = low
  kw = dict(type=kind, margin=margin, margin_type='EXTEND', use_selected_to_active=True, max_ray_distance=ray, cage_extrusion=cage, use_clear=True)
  if kind == 'NORMAL': kw.update(normal_space='TANGENT')
  if kind == 'DIFFUSE': kw.update(pass_filter={'COLOR'})
  t = time.time(); bpy.ops.object.bake(**kw); log('Backen', kind, '%.0fs' % (time.time() - t))
  img.filepath_raw = path; img.file_format = 'PNG'; img.save(); return img
def img_np(img):
  a = np.empty(img.size[0] * img.size[1] * 4, dtype=np.float32); img.pixels.foreach_get(a); return a.reshape(img.size[1], img.size[0], 4)
def save_np(arr, path, fmt='JPEG', q=90):
  from PIL import Image  # nur wenn vorhanden (System-Python); sonst über Blender-Bild
  Image.fromarray(arr).save(path, quality=q)
def save_np_blender(a, path, size, color='sRGB', fmt='JPEG', q=90):
  """a: (h, w, 3|4) float 0…1 → Datei (über Blender, ohne PIL)."""
  h, w = a.shape[:2]; img = bpy.data.images.new('tmp', w, h, alpha=False); img.colorspace_settings.name = color
  if a.shape[2] == 3: a = np.concatenate([a, np.ones((h, w, 1), a.dtype)], 2)
  img.pixels.foreach_set(np.clip(a, 0, 1).astype(np.float32).ravel()); img.filepath_raw = path; img.file_format = fmt
  scn.render.image_settings.quality = q; img.save(); bpy.data.images.remove(img)

# ---------------------------------------------------------------- Schnellvorschau (Workbench, graue Form) für die Formsuche
def quick_render(objs, out, views=('seite', 'vorn', '34'), res=720, target=None, dist=None, shading='SOLID'):
  ps = np.concatenate([verts_np(o) for o in objs]); mn, mx = ps.min(0), ps.max(0); c = Vector((mn + mx) / 2); sz = float((mx - mn).max())
  if target is not None: c = Vector(target)
  old = scn.camera; cd = bpy.data.cameras.new('qc'); cam = bpy.data.objects.new('qc', cd); scn.collection.objects.link(cam); scn.camera = cam; cd.lens = 70
  scn.render.engine = 'BLENDER_WORKBENCH'; sh = scn.display.shading; sh.light = 'STUDIO'; sh.color_type = 'MATERIAL' if shading == 'MAT' else 'SINGLE'; sh.single_color = (.72, .6, .55)
  sh.show_cavity = True; sh.cavity_type = 'BOTH'; sh.cavity_ridge_factor = 1.2; sh.cavity_valley_factor = 1.5; sh.show_shadows = True; sh.shadow_intensity = .6
  scn.display.render_aa = '8'; scn.render.resolution_x = res; scn.render.resolution_y = int(res * .75)
  scn.render.image_settings.file_format = 'JPEG'; scn.render.image_settings.quality = 85; scn.view_settings.view_transform = 'Standard'
  D = {'seite': (1, -.05, .18), 'vorn': (.1, -1, .2), 'hinten': (-.2, 1, .25), '34': (-.75, -.8, .3), 'oben': (0, -.2, 1.5), '34r': (.8, -.7, .25), 'kopf': (.75, -.85, .15), 'kopf2': (-.8, -.7, .12), 'kopfv': (.05, -1, .1)}
  for v in views:
    d = Vector(D[v]).normalized(); cc = c if not v.startswith('kopf') else Vector(G(0, 2.0, 2.15))
    dd = (dist or sz * 2.7) if not v.startswith('kopf') else (dist or sz * .62)
    cam.location = cc + d * dd; cam.rotation_euler = (cc - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scn.render.filepath = out + '_' + v + '.jpg'; bpy.ops.render.render(write_still=True)
  scn.camera = old; bpy.data.objects.remove(cam, do_unlink=True)

# ================================================================ Tierbasis (animal_deerdoe / animal_deerstag): Laden, Fell entfernen, Maße
GAME = 'C:/Users/GIGABYTE/HighAbyssMira-Repo/game/assets/ms/'
def load_base(kind, clear=True):
  """kind: 'doe' | 'stag' → (Armature, Körpernetz). Netz hat 2 Materialien: 0 Körper, 1 Fellschale."""
  if clear: clear_scene()
  before = set(scn.objects)
  bpy.ops.import_scene.gltf(filepath=GAME + ('animal_deerdoe' if kind == 'doe' else 'animal_deerstag') + '/model.glb', bone_heuristic='BLENDER')
  new = [o for o in scn.objects if o not in before]
  arm = next(o for o in new if o.type == 'ARMATURE'); arm.data.pose_position = 'REST'
  me = max((o for o in new if o.type == 'MESH'), key=lambda o: len(o.data.polygons))
  for o in new:
    if o.type == 'MESH' and o is not me: bpy.data.objects.remove(o, do_unlink=True)
  return arm, me
def strip_fur(me):
  bm = bmesh.new(); bm.from_mesh(me.data)
  bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index == 1], context='FACES')
  bm.verts.ensure_lookup_table(); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
  bm.to_mesh(me.data); bm.free(); me.data.update()
def bone_pos(arm, key):
  b = next(b for b in arm.data.bones if b.name.endswith(key)); return np.array(arm.matrix_world @ b.head_local)
def group_weight(me, names):
  """Summe der Gewichte je Punkt für Knochen, deren Name auf eines der Suffixe endet."""
  idx = [g.index for g in me.vertex_groups if any(g.name.endswith(n) for n in names)]
  w = np.zeros(len(me.data.vertices))
  for v in me.data.vertices:
    for g in v.groups:
      if g.group in idx: w[v.index] += g.weight
  return np.clip(w, 0, 1)

def densify(me, ratio=.5):
  """Unterteilung (Catmull-Clark) + Kollaps-Reduktion: glattere Silhouette bei kontrollierter Dreieckszahl; Gewichte bleiben."""
  sel([me]); s_ = me.modifiers.new('s', 'SUBSURF'); s_.levels = 1; s_.render_levels = 1
  d = me.modifiers.new('d', 'DECIMATE'); d.ratio = ratio; d.use_collapse_triangulate = True
  apply_mods(me); smooth(me); return me
