# car_rusty (Fab OlegVerenko, CC-BY): nur das Coupé samt Efeu (Gruppe 'Group002', so nutzt es das Spiel) behalten, Efeukarten ausdünnen.
#   blender --background --factory-startup --threads 2 --python rusty_duenn.py -- <eingabe.glb> <ausgabe.glb>
import bpy, sys
SRC, DST = sys.argv[sys.argv.index('--') + 1:][:2]
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=SRC)
def under(o, n):
  p = o
  while p:
    if p.name == n: return True
    p = p.parent
  return False
def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH' and not under(o, 'Group002')]: bpy.data.objects.remove(o, do_unlink=True)
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
  n = tris(o)
  if n > 60000:
    # Efeukarten sind lose Inseln: Zusammenfassen geht nicht, also jede vierte Insel behalten (deterministisch)
    import bmesh, random
    bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table(); seen = set(); dele = []; rnd = random.Random(7)
    for f in bm.faces:
      if f.index in seen: continue
      isl = [f]; seen.add(f.index); k = 0
      while k < len(isl):
        for e in isl[k].edges:
          for g in e.link_faces:
            if g.index not in seen: seen.add(g.index); isl.append(g)
        k += 1
      if rnd.random() > .19: dele += isl
    bmesh.ops.delete(bm, geom=dele, context='FACES'); bm.to_mesh(o.data); bm.free()
  elif n > 15000:
    bpy.context.view_layer.objects.active = o; m = o.modifiers.new('d', 'DECIMATE'); m.ratio = .8; bpy.ops.object.modifier_apply(modifier='d')
for im in bpy.data.images:
  if im.users and not im.packed_file and im.size[0] > 0: im.pack()
print('TRIS', sum(tris(o) for o in bpy.context.scene.objects if o.type == 'MESH'))
bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB', export_apply=True, export_image_format='JPEG', export_jpeg_quality=88)
