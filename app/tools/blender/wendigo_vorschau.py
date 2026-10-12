# Wendigo-Formen: Vorschau-Renderings zur Selbstkontrolle (Studio-Licht ODER Nacht/Lampe), mehrere Winkel + Nahaufnahmen.
#   blender -b --factory-startup --threads 4 -P wendigo_vorschau.py -- <glb> <ausgabe_präfix> <modus: studio|nacht> <ansichten,…> [clip] [bild] [shape=wert,…] [px]
# Ansichten: vorn, seite, hinten, 34 (Dreiviertel), oben, kopf, kopf2 (Nahaufnahme Kopf), hand, fuss, brust, geweih, weit (3/4 aus größerem Abstand)
# Modus „nacht“: dunkle Welt, ein warmer Kegel von der Kamera (Taschenlampe), dazu schwaches Blaulicht von oben – so sieht man die Form im Spiel.
# Ausgabe: <präfix>_<ansicht>.jpg (JPEG q85, 960×720) – klein genug zum Einchecken.
import bpy, sys, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT, MODE, VIEWS = a[0], a[1], a[2], a[3].split(',')
CLIP = a[4] if len(a) > 4 and a[4] not in ('', '-', '_') else None
FR = int(a[5]) if len(a) > 5 and a[5] not in ('', '-', '_') else 0
SHAPES = dict(kv.split('=') for kv in a[6].split(',')) if len(a) > 6 and a[6] not in ('', '-', '_') else {}
PX = int(a[7]) if len(a) > 7 else 960
PRUEF = a[8] if len(a) > 8 else ''
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=GLB, bone_heuristic='BLENDER')
scn = bpy.context.scene
arm = next((o for o in scn.objects if o.type == 'ARMATURE'), None)
meshes = [o for o in scn.objects if o.type == 'MESH' and (o.parent == arm or arm is None) and len(o.data.polygons) > 100]
if arm and arm.animation_data:
  for t in arm.animation_data.nla_tracks: t.mute = True
  arm.animation_data.action = bpy.data.actions.get(CLIP) if CLIP else None
  if CLIP and arm.animation_data.action is None:
    print('KEIN CLIP', CLIP, [x.name for x in bpy.data.actions])
if arm and not CLIP:
  for pb in arm.pose.bones: pb.matrix_basis.identity()
for m in meshes:
  sk = m.data.shape_keys
  if sk:
    for k in sk.key_blocks:
      if k.name in SHAPES: k.value = float(SHAPES[k.name])
      elif k.name != 'Basis': k.value = 0.0
    if sk.animation_data: sk.animation_data.action = None
scn.frame_set(FR)
if PRUEF == 'ohne_normal':
  for mt in bpy.data.materials:
    if mt.node_tree:
      for l in list(mt.node_tree.links):
        if l.to_socket.name == 'Normal': mt.node_tree.links.remove(l)
if PRUEF == 'nur_farbe':
  for mt in bpy.data.materials:
    nt = mt.node_tree
    if not nt: continue
    tx = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and any(l.to_socket.name == 'Base Color' for l in n.outputs[0].links)), None)
    out = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None)
    if tx and out: em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(tx.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], out.inputs[0])
dg = bpy.context.evaluated_depsgraph_get()
ps = []
for m in meshes:
  e = m.evaluated_get(dg); me = e.to_mesh(); ps += [m.matrix_world @ v.co for v in me.vertices]; e.to_mesh_clear()
mn = Vector((min(p.x for p in ps), min(p.y for p in ps), min(p.z for p in ps))); mx = Vector((max(p.x for p in ps), max(p.y for p in ps), max(p.z for p in ps)))
c = (mn + mx) / 2; sz = max(mx - mn) * 1.18  # etwas Rand
print('BOUNDS', [round(v, 3) for v in mn], [round(v, 3) for v in mx])
bpy.ops.mesh.primitive_plane_add(size=sz * 30, location=(c.x, c.y, mn.z - .001)); pl = bpy.context.object
pm = bpy.data.materials.new('boden'); pm.use_nodes = True; bp = pm.node_tree.nodes['Principled BSDF']
bp.inputs['Base Color'].default_value = (.12, .105, .085, 1) if MODE == 'nacht' else (.32, .31, .29, 1); bp.inputs['Roughness'].default_value = .9; pl.data.materials.append(pm)
w = scn.world or bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']
def light(kind, loc, energy, size=1., col=(1, 1, 1), tgt=None, spot=None):
  ld = bpy.data.lights.new('l', kind); ld.energy = energy; ld.color = col
  if kind == 'AREA': ld.size = size
  if kind == 'SPOT': ld.spot_size = spot or math.radians(40); ld.spot_blend = .6; ld.shadow_soft_size = .05
  lo = bpy.data.objects.new('l', ld); scn.collection.objects.link(lo); lo.location = loc
  lo.rotation_euler = ((tgt or c) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return lo
cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); scn.collection.objects.link(cam); scn.camera = cam; cd.lens = 70; cd.clip_start = .005
if MODE == 'studio':
  bg.inputs['Strength'].default_value = .35; bg.inputs['Color'].default_value = (.07, .072, .08, 1)
  L2 = lambda v: c + Vector(v).normalized() * sz * 1.6
  E = 55 * (sz * 1.6) ** 2  # Leistung wächst mit dem Quadrat des Abstands, damit Bilder aller Größen gleich hell sind
  light('AREA', L2((-1.2, -1.0, 1.0)), E, sz * .5, (1, .96, .9))
  light('AREA', L2((1.5, .8, .5)), E * .3, sz * .6, (.8, .88, 1))
  light('AREA', L2((.2, 1.8, 1.2)), E * .4, sz * .4, (1, 1, 1))
else:
  bg.inputs['Strength'].default_value = .05; bg.inputs['Color'].default_value = (.02, .03, .05, 1)
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
  try: scn.render.engine = eng; break
  except Exception: pass
try: scn.eevee.taa_render_samples = 40; scn.eevee.use_raytracing = False
except Exception: pass
scn.render.resolution_x = PX; scn.render.resolution_y = int(PX * .75); scn.view_settings.view_transform = 'AgX'
scn.render.image_settings.file_format = 'JPEG'; scn.render.image_settings.quality = 85
def pbone(rx):
  if not arm: return None
  import re
  for b in arm.pose.bones:
    if re.search(rx, b.name, re.I): return arm.matrix_world @ b.head
  return None
HEAD = pbone(r'(^|[-_])head$') or Vector((c.x, c.y, mx.z - sz * .1))
D = {'vorn': Vector((.15, -1., .22)), 'seite': Vector((1., -.08, .22)), 'hinten': Vector((-.3, 1., .3)), '34': Vector((-.75, -.8, .3)), 'oben': Vector((0, -.25, 1.4)),
     'kopf': Vector((.7, -.9, .15)), 'kopf2': Vector((-.8, -.7, .1)), 'hand': Vector((.7, -.9, .3)), 'fuss': Vector((.8, -.8, .2)), 'brust': Vector((-.5, -.9, .1)), 'geweih': Vector((.35, -.9, .6)), 'weit': Vector((-.6, -1., .25))}
# Blickrichtung „vorn“ des Modells = −Y (glTF +Z); Kamera steht davor
for VV in VIEWS:
  dv = D[VV].normalized(); tgt = c; dist = sz * 1.9
  if VV in ('kopf', 'kopf2'): tgt = HEAD + Vector((0, -.12 * sz / 2.8, 0)); dist = sz * .42
  elif VV == 'geweih': tgt = HEAD + Vector((0, 0, .25 * sz / 2.8)); dist = sz * .75
  elif VV == 'brust': tgt = c + Vector((0, 0, sz * .12)); dist = sz * .62
  elif VV == 'hand': tgt = Vector((c.x, c.y, mn.z + sz * .35)); dist = sz * .55
  elif VV == 'fuss': tgt = Vector((c.x, c.y, mn.z + sz * .08)); dist = sz * .45
  elif VV == 'weit': dist = sz * 2.8
  cam.location = tgt + dv * dist; cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
  if MODE == 'nacht':
    for o in [x for x in scn.objects if x.type == 'LIGHT']: bpy.data.objects.remove(o, do_unlink=True)
    sp = light('SPOT', cam.location + Vector((0, 0, .15)), 9000 * max(1, (dist / 3)) ** 2 * .35, 1, (1, .86, .62), tgt=tgt, spot=math.radians(36))
    light('AREA', tgt + Vector((0, 2, 4)) * (sz / 2.8), 120 * sz * sz, sz, (.5, .6, .9))
  scn.render.filepath = OUT + '_' + VV + '.jpg'; bpy.ops.render.render(write_still=True); print('BILD', scn.render.filepath)
