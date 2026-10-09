# Vorschau des Bus-/Wrack-Innenraums mit Außenhülle (EEVEE, 800 px). Blicke in Spielkoordinaten (x, y, z) → Blender (x, −z, y).
#   blender -b --factory-startup --threads 2 --python bus_vorschau.py -- <bus|wrack> <innen.glb> <ausgabe_praefix> [kindersitz.glb]
import bpy, sys, os, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; ART, GLB, OUT = a[0], a[1], a[2]; KS = a[3] if len(a) > 3 else None
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'game', 'assets', 'ms')
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
scn = bpy.context.scene
def G(x, y, z): return Vector((x, -z, y))
def apply(o):
  bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
hull = []
if ART == 'bus':
  bpy.ops.import_scene.fbx(filepath=os.path.join(ROOT, 'vans', 'model.fbx'))
  for o in list(scn.objects):
    if o.name != 'Object017': bpy.data.objects.remove(o, do_unlink=True)
  h = scn.objects['Object017']; apply(h); K = 5.3 / 377.9; S = K / .0254
  for v in h.data.vertices: v.co = Vector((v.co.x * S, v.co.y * S - 3.05 * K, v.co.z * S - .79 * K))
  # Heck- und Frontscheibe wie im Spiel herausnehmen
  import bmesh
  bm = bmesh.new(); bm.from_mesh(h.data)
  def inWin(p):
    x, y, z = p.x / K, p.z / K + .79, -p.y / K - 3.05
    return (abs(x) < 55.5 and 91.5 < y < 133.5 and z < -165) or (abs(x) < 57 and 93.5 < y < 133 and 90 < z < 145)
  bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(inWin(v.co) for v in f.verts)], context='FACES'); bm.to_mesh(h.data); bm.free()
  m = bpy.data.materials.new('van'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
  def img(n, col=True):
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(ROOT, 'vans', n))
    if not col: t.image.colorspace_settings.name = 'Non-Color'
    return t
  nt.links.new(img('van_damaged_d.jpg').outputs[0], b.inputs['Base Color']); nt.links.new(img('van_damaged_roughness.jpg', False).outputs[0], b.inputs['Roughness'])
  nt.links.new(img('van_damaged_metallic.jpg', False).outputs[0], b.inputs['Metallic'])
  h.data.materials.clear(); h.data.materials.append(m); m.use_backface_culling = False; hull = [h]
else:
  bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'car_rusty', 'model.glb'))
  def under(o, n):
    p = o
    while p:
      if p.name == n: return True
      p = p.parent
    return False
  keep = [o for o in scn.objects if o.type == 'MESH' and under(o, 'Group002')]
  for o in list(scn.objects):
    if o.type == 'MESH' and o not in keep: bpy.data.objects.remove(o, do_unlink=True)
  K2 = 4.3 / 4.059
  for o in keep:
    M = o.matrix_world.copy(); o.parent = None; o.matrix_world = M; apply(o)
    for v in o.data.vertices: v.co = Vector(((v.co.x + 2.662) * K2, v.co.y * K2, (v.co.z + .044) * K2))
  hull = keep
for o in list(scn.objects):
  if o.type == 'EMPTY': bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=GLB)
if KS:
  bpy.ops.import_scene.gltf(filepath=KS); src = {o.name[-1]: o for o in scn.objects if o.name.startswith('kindersitz_')}
  emp = sorted([o for o in scn.objects if o.type == 'EMPTY' and o.name.startswith('p_sitz')], key=lambda o: o.name)
  for i, e in enumerate(emp):
    s = src['bacabca'[i]].copy(); scn.collection.objects.link(s); s.location = e.location; s.rotation_euler = (0, 0, 0)
    if i == 5: s.rotation_euler = (-1.45, 0, -.3); s.location = e.location + G(0, .2, .3)
  for o in src.values(): o.hide_render = True
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -.001)); pl = bpy.context.object
pm = bpy.data.materials.new('boden'); pm.use_nodes = True; pm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.08, .07, .05, 1); pl.data.materials.append(pm)
w = bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (.55, .6, .65, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = .8
ld = bpy.data.lights.new('sun', 'SUN'); ld.energy = 2.5; lo = bpy.data.objects.new('sun', ld); scn.collection.objects.link(lo); lo.rotation_euler = (math.radians(50), 0, math.radians(30))
inner = []
def pt(loc, e):
  l = bpy.data.lights.new('p', 'POINT'); l.energy = e; l.shadow_soft_size = .3; o = bpy.data.objects.new('p', l); scn.collection.objects.link(o); o.location = loc; inner.append(o)
if ART == 'bus': pt(G(0, 1.5, -1.2), 60); pt(G(0, 1.4, .9), 35)
else: pt(G(0, .95, -.1), 25)
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
  try: scn.render.engine = eng; break
  except Exception: pass
try: scn.eevee.taa_render_samples = 48; scn.eevee.use_raytracing = True
except Exception: pass
scn.render.resolution_x = 800; scn.render.resolution_y = 600
scn.view_settings.view_transform = 'AgX' if 'AgX' in [i.identifier for i in scn.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
cd = bpy.data.cameras.new('c'); cam = bpy.data.objects.new('c', cd); scn.collection.objects.link(cam); scn.camera = cam
if ART == 'bus':
  V = [('heck', G(-.1, 1.62, -3.25), G(0, .9, -1.0), 30, False), ('front', G(.2, 1.7, 3.3), G(0, 1.0, 1.0), 30, False), ('innen', G(-.3, 1.5, -2.1), G(.1, .95, 1.4), 18, False),
       ('fahrer', G(-.2, 1.45, -.1), G(.3, 1.0, 1.7), 24, False), ('schnitt', G(-3.5, 2.6, -.8), G(0, .8, -.6), 24, True), ('sitze', G(-.2, 1.5, .3), G(0, .7, -1.6), 22, False)]
else:
  V = [('tuer', G(-1.9, 1.5, -.3), G(-.1, .6, .1), 26, False), ('front', G(.3, 1.5, 2.6), G(0, .7, -.1), 30, False), ('innen', G(.05, 1.0, -.45), G(-.1, .6, .6), 18, False),
       ('schnitt', G(-2.6, 2.4, .1), G(0, .55, 0), 26, True), ('fahrer', G(1.6, 1.3, -.4), G(.2, .7, .2), 24, False)]
for name, loc, tgt, lens, cut in V:
  for h in hull: h.hide_render = cut
  cam.location = loc; cam.rotation_euler = (tgt - loc).to_track_quat('-Z', 'Y').to_euler(); cd.lens = lens; cd.clip_start = .03
  scn.render.filepath = OUT + '_' + name + '.png'; bpy.ops.render.render(write_still=True); print('VORSCHAU', scn.render.filepath)
