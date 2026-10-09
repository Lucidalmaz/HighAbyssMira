# HAM-Bau: gemeinsame Werkzeuge für die in Blender gebauten Hard-Surface-Modelle (Kindersitz, Bus-Innenraum, Wrack-Innenraum).
# Eigene Arbeit (bpy). Netze aus Parameterflächen/bmesh, Materialien als prozedurale PBR-Shader, die in Cycles auf einen Atlas gebacken werden
# (Albedo · Rauheit/Metall · Normal · AO), danach GLB-Export mit den gebackenen Bildern. Fotos werden NICHT als Textur verwendet.
import bpy, bmesh, math, random, os, sys, time
import numpy as np
from mathutils import Vector, Matrix, Euler

T0 = time.time()
def log(*a): print('[%5.1fs]' % (time.time() - T0), *a, flush=True)

def reset():
  for c in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.curves, bpy.data.lights, bpy.data.cameras):
    for x in list(c): c.remove(x)
  return bpy.context.scene

def link(o):
  bpy.context.scene.collection.objects.link(o); return o

def obj_bm(bm, name, mat=None):
  me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = link(bpy.data.objects.new(name, me))
  if mat: me.materials.append(mat)
  return o

def grid(P, close_u=False, close_v=False, flip=False):
  # P: Liste von Zeilen (nu × nv) aus Vector → bmesh mit Vierecken
  bm = bmesh.new(); nu, nv = len(P), len(P[0]); V = [[bm.verts.new(P[i][j]) for j in range(nv)] for i in range(nu)]
  for i in range(nu - (0 if close_u else 1)):
    for j in range(nv - (0 if close_v else 1)):
      a, b, c, d = V[i][j], V[(i + 1) % nu][j], V[(i + 1) % nu][(j + 1) % nv], V[i][(j + 1) % nv]
      try: bm.faces.new((a, d, c, b) if flip else (a, b, c, d))
      except ValueError: pass
  return bm

def sweep(pts, ups, prof, closed=False, caps=True):
  # Profil (Liste 2D-Punkte (x quer, y nach „oben“)) entlang Pfad pts mit Aufwärtsvektoren ups ziehen
  bm = bmesh.new(); rows = []; n = len(pts)
  for i in range(n):
    t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized(); u = ups[i] - t * ups[i].dot(t); u.normalize(); s = t.cross(u).normalized()
    rows.append([bm.verts.new(pts[i] + s * px + u * py) for px, py in prof])
  m = len(prof)
  for i in range(n - (0 if closed else 1)):
    for j in range(m):
      a, b = rows[i][j], rows[i][(j + 1) % m]; c, d = rows[(i + 1) % n][(j + 1) % m], rows[(i + 1) % n][j]
      try: bm.faces.new((a, b, c, d))
      except ValueError: pass
  if caps and not closed:
    for r in (rows[0], rows[-1][::-1]):
      try: bm.faces.new(r[::-1] if r is rows[0] else r)
      except ValueError: pass
  return bm

def ribbon(pts, ups, w, th, closed=False): return sweep(pts, ups, [(-w / 2, 0), (w / 2, 0), (w / 2, th), (-w / 2, th)], closed)
def tube(pts, r, seg=8, ups=None, closed=False):
  ups = ups or [Vector((0, 0, 1)) if abs((pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized().z) < .9 else Vector((1, 0, 0)) for i in range(len(pts))]
  return sweep(pts, ups, [(r * math.cos(a * 2 * math.pi / seg), r * math.sin(a * 2 * math.pi / seg)) for a in range(seg)], closed)

def catmull(P, n):
  # glatte Kurve durch Kontrollpunkte (Catmull-Rom), n Punkte
  P = [Vector(p) for p in P]; out = []; m = len(P) - 1
  for k in range(n):
    f = k / (n - 1) * m; i = min(int(f), m - 1); t = f - i
    p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, m)]
    out.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t))
  return out

def box(sx, sy, sz, loc=(0, 0, 0), rot=(0, 0, 0), bev=0.0, seg=2, name='box', mat=None):
  bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1); bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
  o = obj_bm(bm, name, mat); o.location = loc; o.rotation_euler = rot
  if bev > 0: m = o.modifiers.new('b', 'BEVEL'); m.width = bev; m.segments = seg; m.limit_method = 'ANGLE'; m.harden_normals = False
  return o

def cyl(r, h, loc=(0, 0, 0), rot=(0, 0, 0), seg=16, bev=0.0, name='cyl', mat=None, r2=None):
  bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
  o = obj_bm(bm, name, mat); o.location = loc; o.rotation_euler = rot
  if bev > 0: m = o.modifiers.new('b', 'BEVEL'); m.width = bev; m.segments = 2; m.limit_method = 'ANGLE'
  return o

def mod(o, kind, **kw):
  m = o.modifiers.new(kind.lower(), kind)
  for k, v in kw.items(): setattr(m, k, v)
  return m

def apply_all(o):
  bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
  for m in list(o.modifiers):
    try: bpy.ops.object.modifier_apply(modifier=m.name)
    except Exception as e: log('modifier', o.name, m.name, e); o.modifiers.remove(m)
  if o.rotation_euler != Euler((0, 0, 0)) or o.location.length > 0 or o.scale != Vector((1, 1, 1)):
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
  return o

def join(objs, name):
  objs = [o for o in objs if o]
  for o in objs: apply_all(o)
  bpy.ops.object.select_all(action='DESELECT')
  for o in objs: o.select_set(True)
  bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = name; o.data.name = name; return o

def smooth(o, ang=35):
  bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
  try: bpy.ops.object.shade_smooth_by_angle(angle=math.radians(ang), keep_sharp_edges=True)
  except Exception:
    bpy.ops.object.shade_smooth()
    try: o.data.set_sharp_from_angle(angle=math.radians(ang))
    except Exception: pass
  for m in list(o.modifiers):
    if m.type == 'NODES':
      try: bpy.ops.object.modifier_apply(modifier=m.name)
      except Exception: pass

def tris(objs):
  n = 0
  for o in objs:
    if o.type != 'MESH': continue
    for p in o.data.polygons: n += len(p.vertices) - 2
  return n

def uv_smart(o, margin=.004, angle=60):
  bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
  bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
  bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=margin, area_weight=1.0, correct_aspect=True, scale_to_bounds=False)
  try: bpy.ops.uv.pack_islands(rotate=True, margin=margin)
  except Exception as e: log('pack', e)
  bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------- Knoten-Baukasten
class NB:
  def __init__(s, mat):
    s.m = mat; s.nt = mat.node_tree; s.N = s.nt.nodes; s.L = s.nt.links
  def n(s, kind, **kw):
    nd = s.N.new(kind)
    for k, v in kw.items():
      if k.startswith('_'): setattr(nd, k[1:], v); continue
      s.inp(nd, k, v)
    return nd
  def inp(s, nd, k, v):
    key = k.replace('_', ' ')
    sock = None
    if isinstance(k, int): sock = nd.inputs[k]
    else:
      for i in nd.inputs:
        if i.name == key and i.enabled: sock = i; break
      if sock is None:
        for i in nd.inputs:
          if i.name == key: sock = i; break
    if sock is None: raise KeyError(nd.bl_idname + ':' + key)
    s.put(sock, v)
  def put(s, sock, v):
    if isinstance(v, bpy.types.NodeSocket): s.L.new(v, sock)
    elif isinstance(v, bpy.types.Node): s.L.new(v.outputs[0], sock)
    elif isinstance(v, (tuple, list)) and len(v) == 3 and sock.type == 'RGBA': sock.default_value = (*v, 1)
    elif isinstance(v, (int, float)) and sock.type == 'RGBA': sock.default_value = (v, v, v, 1)
    elif isinstance(v, (int, float)) and sock.type == 'VECTOR': sock.default_value = (v, v, v)
    else: sock.default_value = v
  def coord(s, kind='Object'): return s.n('ShaderNodeTexCoord').outputs[kind]
  def vec(s, v, scale=(1, 1, 1), rot=(0, 0, 0), loc=(0, 0, 0)):
    return s.n('ShaderNodeMapping', Vector=v, Scale=scale, Rotation=rot, Location=loc).outputs[0]
  def noise(s, v, scale, detail=4, rough=.55, dist=0., out='Fac', dim='3D'):
    return s.n('ShaderNodeTexNoise', _noise_dimensions=dim, Vector=v, Scale=scale, Detail=detail, Roughness=rough, Distortion=dist).outputs[out]
  def vor(s, v, scale, out='Distance', feat='F1', rand=1.):
    return s.n('ShaderNodeTexVoronoi', _feature=feat, Vector=v, Scale=scale, Randomness=rand).outputs[out]
  def wave(s, v, scale, dist=0, detail=0, kind='BANDS', prof='SIN', axis='X', out='Color'):
    w = s.n('ShaderNodeTexWave', _wave_type=kind, _wave_profile=prof, _bands_direction=axis, Vector=v, Scale=scale, Distortion=dist, Detail=detail)
    return w.outputs[out]
  def math(s, op, a, b=0., clamp=False):
    nd = s.N.new('ShaderNodeMath'); nd.operation = op; nd.use_clamp = clamp; s.put(nd.inputs[0], a); s.put(nd.inputs[1], b); return nd.outputs[0]
  def mr(s, a, lo, hi, tlo=0., thi=1., clamp=True):  # map range
    nd = s.N.new('ShaderNodeMapRange'); nd.clamp = clamp; s.put(nd.inputs['Value'], a); nd.inputs['From Min'].default_value = lo; nd.inputs['From Max'].default_value = hi
    s.put(nd.inputs['To Min'], tlo); s.put(nd.inputs['To Max'], thi); return nd.outputs[0]
  def mix(s, fac, a, b, blend='MIX', kind='RGBA', clamp=True):
    nd = s.N.new('ShaderNodeMix'); nd.data_type = kind; nd.blend_type = blend; nd.clamp_result = clamp
    if kind == 'RGBA': s.put(nd.inputs[0], fac); s.put(nd.inputs[6], a); s.put(nd.inputs[7], b); return nd.outputs[2]
    if kind == 'VECTOR': s.put(nd.inputs[0], fac); s.put(nd.inputs[4], a); s.put(nd.inputs[5], b); return nd.outputs[1]
    s.put(nd.inputs[0], fac); s.put(nd.inputs[2], a); s.put(nd.inputs[3], b); return nd.outputs[0]
  def ramp(s, fac, stops, interp='LINEAR'):
    nd = s.N.new('ShaderNodeValToRGB'); s.put(nd.inputs[0], fac); cr = nd.color_ramp; cr.interpolation = interp
    while len(cr.elements) > len(stops): cr.elements.remove(cr.elements[-1])
    while len(cr.elements) < len(stops): cr.elements.new(0)
    for el, (p, c) in zip(cr.elements, stops): el.position = p; el.color = (*c, 1) if len(c) == 3 else c
    return nd.outputs[0]
  def ao(s, dist=.05, inside=False, local=True):
    return s.n('ShaderNodeAmbientOcclusion', _inside=inside, _only_local=local, Distance=dist).outputs['AO']
  def geo(s, out): return s.n('ShaderNodeNewGeometry').outputs[out]
  def sep(s, v):
    nd = s.n('ShaderNodeSeparateXYZ', Vector=v); return nd.outputs
  def hsv(s, col, h=.5, sat=1., val=1.): return s.n('ShaderNodeHueSaturation', Color=col, Hue=h, Saturation=sat, Value=val).outputs[0]
  def attr(s, name, out='Fac'): return s.n('ShaderNodeAttribute', _attribute_name=name).outputs[out]

def material(name, build):
  # build(nb) → dict(col=, rough=, metal=, height=, hs=) ; Ergebnis als Principled (+ Bump); Kanäle für das Backen gemerkt
  m = bpy.data.materials.new(name); m.use_nodes = True; nb = NB(m); nb.N.clear()
  ch = build(nb); out = nb.n('ShaderNodeOutputMaterial'); out.name = 'OUT'
  bs = nb.n('ShaderNodeBsdfPrincipled'); bs.name = 'BSDF'
  nb.put(bs.inputs['Base Color'], ch.get('col', (.5, .5, .5))); nb.put(bs.inputs['Roughness'], ch.get('rough', .6)); nb.put(bs.inputs['Metallic'], ch.get('metal', 0.))
  if 'height' in ch:
    bu = nb.n('ShaderNodeBump', Strength=ch.get('hs', 1.), Distance=ch.get('hd', .002), Height=ch['height']); nb.put(bs.inputs['Normal'], bu.outputs[0])
  nb.L.new(bs.outputs[0], out.inputs[0]); m['_ch'] = 1; m['_chans'] = {}
  # Kanalknoten (Emission) für das Backen vorbereiten
  for k in ('col', 'rough', 'metal'):
    v = ch.get(k, {'col': (.5, .5, .5), 'rough': .6, 'metal': 0.}[k]); em = nb.n('ShaderNodeEmission'); em.name = 'EM_' + k; nb.put(em.inputs['Color'], v); em.inputs['Strength'].default_value = 1
  return m

def _target(objs, img):
  for o in objs:
    for sl in o.material_slots:
      nt = sl.material.node_tree; t = nt.nodes.get('BAKE_T') or nt.nodes.new('ShaderNodeTexImage'); t.name = 'BAKE_T'; t.image = img; nt.nodes.active = t
      for nd in nt.nodes: nd.select = False
      t.select = True

def _route(objs, k):
  for o in objs:
    for sl in o.material_slots:
      nt = sl.material.node_tree; out = nt.nodes['OUT']
      src = nt.nodes['BSDF'] if k is None else nt.nodes['EM_' + k]
      nt.links.new(src.outputs[0], out.inputs[0])

def bake(o, res, kinds=('col', 'rough', 'metal', 'normal', 'ao'), samples=None, margin=6, ao_dist=.25):
  # backt die Kanäle des (einzigen) Objekts o auf res×res; gibt dict name→ np.array (H,W,4) float zurück
  scn = bpy.context.scene; scn.render.engine = 'CYCLES'; scn.cycles.device = 'CPU'
  try: scn.render.threads_mode = 'FIXED'; scn.render.threads = 2
  except Exception: pass
  scn.render.bake.margin = margin; scn.render.bake.use_clear = True
  bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
  R = {}
  for k in kinds:
    r = res // 2 if (k == 'ao' and res > 1024) else res  # AO halb so groß backen (weich, spart Minuten), danach hochrechnen
    img = bpy.data.images.new('bk_' + k, r, r, alpha=False, float_buffer=(k in ('normal', 'ao', 'rough', 'metal')))
    img.colorspace_settings.name = 'sRGB' if k == 'col' else 'Non-Color'
    _target([o], img)
    if k in ('col', 'rough', 'metal'):
      _route([o], k); scn.cycles.samples = samples or 1; bpy.ops.object.bake(type='EMIT')
    elif k == 'normal':
      _route([o], None); scn.cycles.samples = samples or 4; bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT')
    elif k == 'ao':
      _route([o], None); scn.cycles.samples = 32; scn.world.light_settings.distance = ao_dist; bpy.ops.object.bake(type='AO')
    R[k] = np.array(img.pixels[:], dtype=np.float32).reshape(r, r, 4); log('gebacken', o.name, k, r)
    if r != res: R[k] = R[k].repeat(res // r, 0).repeat(res // r, 1)
    bpy.data.images.remove(img)
  _route([o], None); return R

def save_img(name, arr, path, srgb=True, jpg=True):
  # gebackene Karten als JPEG (Export „AUTO“ übernimmt das Format; PNG nur für Bilder mit Alpha)
  h, w = arr.shape[:2]; img = bpy.data.images.new(name, w, h, alpha=False); img.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'
  a = np.clip(arr, 0, 1).astype(np.float32)
  if a.shape[2] == 3: a = np.concatenate([a, np.ones((h, w, 1), np.float32)], 2)
  img.pixels[:] = a.ravel()
  if jpg: path = os.path.splitext(path)[0] + '.jpg'
  img.filepath_raw = path; img.file_format = 'JPEG' if jpg else 'PNG'
  try: img.save(quality=93)
  except TypeError: img.save()
  img.reload(); return img

def final_material(name, alb, orm, nrm, alpha=None):
  # glTF-taugliches Material: Basisfarbe, ORM (G Rauheit, B Metall), Normal
  m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes['Principled BSDF']
  ta = nt.nodes.new('ShaderNodeTexImage'); ta.image = alb; nt.links.new(ta.outputs[0], bs.inputs['Base Color'])
  if alpha: nt.links.new(ta.outputs['Alpha'], bs.inputs['Alpha']); m.blend_method = 'CLIP' if hasattr(m, 'blend_method') else None
  to = nt.nodes.new('ShaderNodeTexImage'); to.image = orm; orm.colorspace_settings.name = 'Non-Color'; sp = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(to.outputs[0], sp.inputs[0])
  nt.links.new(sp.outputs[1], bs.inputs['Roughness']); nt.links.new(sp.outputs[2], bs.inputs['Metallic'])
  tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = nrm; nrm.colorspace_settings.name = 'Non-Color'; nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(tn.outputs[0], nm.inputs['Color']); nt.links.new(nm.outputs[0], bs.inputs['Normal'])
  return m

def blur(a, r=2, it=2):
  # einfacher Kastenfilter (trennbar), entrauscht die gebackene AO-Karte
  for _ in range(it):
    for ax in (0, 1):
      c = np.cumsum(np.pad(a, [(r + 1, r) if k == ax else (0, 0) for k in range(a.ndim)], mode='edge'), axis=ax)
      a = (np.take(c, range(2 * r + 1, c.shape[ax]), axis=ax) - np.take(c, range(0, c.shape[ax] - 2 * r - 1), axis=ax)) / (2 * r + 1)
  return a

def compose(R, ao_k=.65, ao_gamma=1.0, ao_blur=2):
  ao = (blur(R['ao'][:, :, :1], ao_blur) if ao_blur else R['ao'][:, :, :1]) ** ao_gamma if 'ao' in R else 1
  alb = R['col'][:, :, :3] * (1 - ao_k + ao_k * ao)
  orm = np.concatenate([np.ones_like(R['rough'][:, :, :1]), R['rough'][:, :, :1], R['metal'][:, :, :1]], 2)
  return alb, orm, R['normal'][:, :, :3]

def set_mat(o, m):
  o.data.materials.clear(); o.data.materials.append(m)
  for p in o.data.polygons: p.material_index = 0

def export(path, objs):
  os.makedirs(os.path.dirname(path), exist_ok=True)
  bpy.ops.object.select_all(action='DESELECT')
  for o in objs: o.select_set(True)
  bpy.context.view_layer.objects.active = objs[0]
  kw = dict(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_texcoords=True, export_normals=True, export_tangents=False,
            export_materials='EXPORT', export_image_format='AUTO', export_animations=False, export_extras=False)
  try: bpy.ops.export_scene.gltf(**kw)
  except TypeError:
    kw.pop('export_jpeg_quality', None); bpy.ops.export_scene.gltf(**kw)
  log('GLB', path, '%.2f MB' % (os.path.getsize(path) / 1e6), 'Dreiecke', tris(objs))

def world(strength=1.0):
  scn = bpy.context.scene; w = scn.world or bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True
  w.node_tree.nodes['Background'].inputs['Strength'].default_value = strength; return w
