# Aus Fab-Fahrzeug-GLBs (CC-BY, siehe CREDITS.md) ein schlankes Spielmodell machen: Innenleben/Motor raus, Lack als eigenes Material (Farbe im Spiel),
# Tür als eigenes Teil 'CDoor_FL' (Fahrertür schwenkt), Lichter als eigene Materialien, ausdünnen, Texturen verkleinern.
#   blender --background --factory-startup --threads 2 --python auto_bau.py -- <sedan|hatch> <eingabe.glb> <ausgabe.glb>
import bpy, sys, math
from mathutils import Vector, Matrix
KIND, SRC, DST = sys.argv[sys.argv.index('--') + 1:][:3]
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=SRC)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in meshes: o['pn'] = (o.parent.name if o.parent else o.name).lower()
def pname(o): return o.get('pn', o.name.lower())
for o in meshes:
  mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
for o in [o for o in bpy.context.scene.objects if o.type != 'MESH']: bpy.data.objects.remove(o, do_unlink=True)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
def decimate(o, r):
  bpy.context.view_layer.objects.active = o
  for s in bpy.context.selected_objects: s.select_set(False)
  o.select_set(True); m = o.modifiers.new('d', 'DECIMATE'); m.ratio = r; bpy.ops.object.modifier_apply(modifier='d')
def mat_new(name, col, metal, rough, coat=0.0, emit=None, alpha=1.0):
  m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
  b.inputs['Base Color'].default_value = col; b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
  if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = .04
  if emit: b.inputs['Emission Color'].default_value = emit; b.inputs['Emission Strength'].default_value = 0.0
  if alpha < 1: b.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND'
  return m
def setmat(o, old, new):
  for s in o.material_slots:
    if s.material and s.material.name == old: s.material = new

if KIND == 'sedan':
  DROP = ('engine-', 'radiator', 'spring', 'shock-absorber', 'windshield wiper - left - arm', 'windshield wiper - left - main', 'windshield wiper - left - pegs', 'windshield wiper - left - rubber',
          'frame-front', 'suspension-front', 'suspension-rear', 'wheel-fender', 'brake-caliper')
  for o in list(meshes):
    if pname(o).startswith(DROP): bpy.data.objects.remove(o, do_unlink=True)
  meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
  # Fahrertür (links, +x) mit Scheibe, Innenverkleidung, Spiegel zu einem Teil
  door = [o for o in meshes if pname(o).startswith(('door-front-l', 'door-front-window-glass-l', 'door-front-interior-panel-l'))]
  for s in bpy.context.selected_objects: s.select_set(False)
  for o in door: o.select_set(True)
  bpy.context.view_layer.objects.active = next(o for o in door if pname(o).startswith('door-front-l_'))
  bpy.ops.object.join(); bpy.context.object.name = 'CDoor_FL'
  for o in bpy.context.scene.objects:
    if o.type == 'MESH' and o.name != 'CDoor_FL': o.name = pname(o)
  paint = mat_new('Car_base_color', (.16, .17, .18, 1), .6, .3, coat=1.0)
  fw = mat_new('Car_LightForward', (.8, .8, .76, 1), 0, .1, emit=(1, .94, .8, 1)); sl = mat_new('Car_stopLight', (.5, .02, .02, 1), 0, .2, emit=(1, .05, .02, 1))
  meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
  for o in meshes:
    p = pname(o); setmat(o, 'Car_Paint_-_All_Colors', paint)
    if p.startswith(('headlights-led', 'headlights-drl')): [setattr(s, 'material', fw) for s in o.material_slots]
    if p.startswith(('taillight-led', 'taillight-trim')): [setattr(s, 'material', sl) for s in o.material_slots]
    for s in o.material_slots:
      if s.material and s.material.name in ('Glass_ext-tinted',): 
        s.material.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = .72
    n = tris(o)
    if n > 3000: decimate(o, .55 if n < 8000 else .4)
else:  # hatch
  for o in list(meshes):
    if o.material_slots and o.material_slots[0].material and o.material_slots[0].material.name.startswith('Concrete'): bpy.data.objects.remove(o, do_unlink=True)
  meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
  rot = Matrix.Rotation(-math.pi / 2, 4, 'Z')  # Front (+x) nach -y (glTF +z)
  for o in meshes: o.matrix_world = rot @ o.matrix_world
# Texturen auf höchstens 1024 (Karosserie/Details), nur genutzte
for im in bpy.data.images:
  if im.users and im.size[0] > 1024 and im.name.startswith('Image'):
    k = 1024 / max(im.size[0], im.size[1]); im.scale(max(8, int(im.size[0] * k)), max(8, int(im.size[1] * k)))
for im in bpy.data.images:
  if im.users and im.type == 'IMAGE' and im.size[0] > 0 and not im.packed_file: im.pack()
print('TRIS', sum(tris(o) for o in bpy.context.scene.objects if o.type == 'MESH'))
bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB', export_apply=True, export_yup=True, export_image_format='JPEG', export_jpeg_quality=88, export_cameras=False, export_lights=False)
