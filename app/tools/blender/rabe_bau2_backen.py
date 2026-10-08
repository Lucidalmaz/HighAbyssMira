# Rabe, Stufe 2: Farbe und Normalen vom Scan (hoch) auf die reduzierte Fassung backen (Cycles, ausgewählt → aktiv).
#   blender --background --factory-startup --threads 2 --python rabe_bau2_backen.py -- <werk> <whiskey|kraehe> <px>
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]; W = a[0].rstrip('/\\') + '/'; NAME = a[1]; PX = int(a[2])
bpy.ops.wm.open_mainfile(filepath=W + 'koerper.blend')
scn = bpy.context.scene; scn.render.engine = 'CYCLES'; scn.cycles.device = 'CPU'; scn.cycles.samples = 1
hi = bpy.data.objects['hoch']; lo = bpy.data.objects[NAME]
for o in scn.objects: o.hide_render = o.hide_viewport = o not in (hi, lo); o.select_set(False)
for o in (hi, lo):
  for p in o.data.polygons: p.use_smooth = True
mat = bpy.data.materials.new('bake_' + NAME); mat.use_nodes = True; lo.data.materials.clear(); lo.data.materials.append(mat)
nt = mat.node_tree; tn = nt.nodes.new('ShaderNodeTexImage'); nt.nodes.active = tn
def bake(kind, fn, cs):
  img = bpy.data.images.new(NAME + '_' + kind, PX, PX, alpha=False, float_buffer=False); img.colorspace_settings.name = cs; tn.image = img
  hi.select_set(True); lo.select_set(True); bpy.context.view_layer.objects.active = lo
  bk = scn.render.bake; bk.use_selected_to_active = True; bk.cage_extrusion = .006; bk.max_ray_distance = .02; bk.margin = 6; bk.margin_type = 'EXTEND'
  if kind == 'farbe': bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_clear=True)
  else: bk.normal_space = 'TANGENT'; bpy.ops.object.bake(type='NORMAL', use_clear=True)
  img.filepath_raw = W + fn; img.file_format = 'PNG'; img.save(); print('INFO gebacken', fn)
bake('farbe', NAME + '_farbe.png', 'sRGB')
bake('normal', NAME + '_normal.png', 'Non-Color')
