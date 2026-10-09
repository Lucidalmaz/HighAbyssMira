# Vorschau des fertigen Raben-GLB: Clip/Bild wählen, Studio-Licht, EEVEE 800 px, mehrere Winkel + Nahaufnahme Kopf (+ Fuß).
#   blender --background --factory-startup --threads 2 --python rabe_vorschau.py -- <glb> <ausgabe_präfix> <clip> <bild> <ansichten: 34,seite,vorn,hinten,oben,unten,kopf,kopf2,fuss>
import bpy, sys, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT, CLIP, FR, VIEWS = a[0], a[1], a[2], int(a[3]), a[4].split(',')
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=GLB, bone_heuristic='BLENDER')
scn = bpy.context.scene; arm = next(o for o in scn.objects if o.type == 'ARMATURE'); mo = next(o for o in scn.objects if o.type == 'MESH' and o.parent == arm)
for o in scn.objects:
  if o.type == 'MESH' and o is not mo: o.hide_render = True
ad = arm.animation_data
for t in ad.nla_tracks: t.mute = True
ad.action = bpy.data.actions.get(CLIP) or bpy.data.actions.get('ANIM_Crow_' + CLIP)
if CLIP == 'REST':
  ad.action = None
  for pb in arm.pose.bones: pb.matrix_basis.identity()
scn.frame_set(FR); dg = bpy.context.evaluated_depsgraph_get(); e = mo.evaluated_get(dg); m = e.to_mesh()
ps = [mo.matrix_world @ v.co for v in m.vertices]; e.to_mesh_clear()
mn = Vector((min(p.x for p in ps), min(p.y for p in ps), min(p.z for p in ps))); mx = Vector((max(p.x for p in ps), max(p.y for p in ps), max(p.z for p in ps)))
c = (mn + mx) / 2; sz = max(mx - mn)
fly = (mx - mn).x > .3
if not fly:
  bpy.ops.mesh.primitive_plane_add(size=sz * 40, location=(c.x, c.y, mn.z - .0005)); pl = bpy.context.object
  pm = bpy.data.materials.new('boden'); pm.use_nodes = True; bp = pm.node_tree.nodes['Principled BSDF']; bp.inputs['Base Color'].default_value = (.3, .29, .27, 1); bp.inputs['Roughness'].default_value = .85; pl.data.materials.append(pm)
def light(kind, loc, energy, size, col=(1, 1, 1)):
  ld = bpy.data.lights.new('l', kind); ld.energy = energy; ld.color = col
  if kind == 'AREA': ld.size = size
  lo = bpy.data.objects.new('l', ld); scn.collection.objects.link(lo); lo.location = loc; lo.rotation_euler = (c - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
# Licht in festem Abstand (2,2 m) – vorher 0,6–1 m: bei ausgebreiteten Flügeln überstrahlt (auch die alte Krähe wirkte dann weiß)
L2 = lambda v: c + Vector(v).normalized() * 2.2
light('AREA', L2((-1.2, -1.0, 1.6)), 110, .8, (1, .96, .9))
light('AREA', L2((1.5, .8, .6)), 35, 1.0, (.8, .88, 1))
light('AREA', L2((.2, 1.8, 1.0)), 60, .5, (1, 1, 1))
w = scn.world or bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs['Strength'].default_value = .3; bg.inputs['Color'].default_value = (.06, .062, .068, 1)
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
  try: scn.render.engine = eng; break
  except Exception: pass
try: scn.eevee.taa_render_samples = 48
except Exception: pass
scn.render.resolution_x = 800; scn.render.resolution_y = 600; scn.view_settings.view_transform = 'AgX'
for mt in bpy.data.materials:
  try: mt.blend_method = 'CLIP'
  except Exception: pass
if len(a) > 5 and a[5] == 'ohne_normal':  # Prüfung: Normalenkarte abklemmen
  for mt in bpy.data.materials:
    if mt.node_tree:
      for l in list(mt.node_tree.links):
        if l.to_socket.name == 'Normal': mt.node_tree.links.remove(l)
if len(a) > 5 and a[5] == 'schlicht':  # Prüfung: einfaches schwarzes Material
  sm = bpy.data.materials.new('schlicht'); sm.use_nodes = True; bp = sm.node_tree.nodes['Principled BSDF']; bp.inputs['Base Color'].default_value = (.02, .02, .022, 1); bp.inputs['Roughness'].default_value = .7
  mo.data.materials.clear(); mo.data.materials.append(sm)
if len(a) > 5 and a[5] == 'nur_farbe':  # Prüfung: Grundfarbe als Emission
  for mt in bpy.data.materials:
    nt = mt.node_tree
    if not nt: continue
    tx = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and any(l.to_socket.name == 'Base Color' for l in n.outputs[0].links)), None)
    out = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None)
    if tx and out: em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(tx.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], out.inputs[0])
cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); scn.collection.objects.link(cam); scn.camera = cam; cd.lens = 85; cd.clip_start = .002
hb = next(b for b in arm.pose.bones if b.name.endswith('-Head')); hp = arm.matrix_world @ hb.head
fb = next(b for b in arm.pose.bones if b.name.endswith('-L-Foot')); fp = arm.matrix_world @ fb.head
D = {'34': Vector((-1.1, -1.3, .8)), 'seite': Vector((1.6, -.05, .3)), 'vorn': Vector((.15, -1.6, .3)), 'hinten': Vector((-.4, 1.4, .8)), 'oben': Vector((0, .3, 1.6)), 'unten': Vector((.2, -.3, -1.5)),
     'kopf': Vector((1.0, -1.1, .35)), 'kopf2': Vector((-.9, -.9, .15)), 'fuss': Vector((.9, -1.2, .35))}
for VV in VIEWS:
  dv = D[VV].normalized()
  if VV.startswith('kopf'): tgt = hp + Vector((0, -.04, .005)); dist = .42
  elif VV == 'fuss': tgt = fp + Vector((0, -.01, .01)); dist = .3
  else: tgt = c; dist = sz * 2.0 * (85 / 50)
  cam.location = tgt + dv * dist; cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
  scn.render.filepath = OUT + '_' + VV + '.png'; bpy.ops.render.render(write_still=True); print('BILD', scn.render.filepath)
