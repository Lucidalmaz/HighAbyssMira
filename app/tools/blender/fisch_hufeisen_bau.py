# Fab-Scans für Kleinteile aufbereiten: Goldfisch (Karolina Renkiewicz, CC-BY) und Hufeisen (Quixel Megascans "Old Horseshoe").
#   blender --background --factory-startup --threads 2 --python fisch_hufeisen_bau.py -- <fisch|hufeisen> <eingabe.glb|gltf> <ausgabe.glb>
import bpy, sys, math
from mathutils import Vector, Matrix
KIND, SRC, DST = sys.argv[sys.argv.index('--') + 1:][:3]
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=SRC)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in ms: mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
for o in [o for o in bpy.context.scene.objects if o.type != 'MESH']: bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for o in ms: o.select_set(True)
bpy.context.view_layer.objects.active = ms[0]
if len(ms) > 1: bpy.ops.object.join()
o = bpy.context.object; me = o.data
def bounds():
  vs = [o.matrix_world @ v.co for v in me.vertices]
  return Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))), Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs))), vs
def apply(M):
  me.transform(M); o.matrix_world = Matrix.Identity(4)
o.matrix_world = o.matrix_world  # Welt-Transform einbacken
me.transform(o.matrix_world); o.matrix_world = Matrix.Identity(4)
mn, mx, vs = bounds(); ext = mx - mn
if KIND == 'fisch':
  # Länge liegt auf Y (Kopf bei +Y, siehe Vorschau) -> Kopf nach +X; Zielgröße 6 cm lang (ohne Schwanzflosse zählt der Körper ~ 4 cm)
  apply(Matrix.Rotation(-math.pi / 2, 4, 'Z')); mn, mx, vs = bounds(); ext = mx - mn
  k = 0.06 / ext.x; apply(Matrix.Scale(k, 4)); mn, mx, vs = bounds(); c = (mn + mx) / 2; apply(Matrix.Translation(-c))
  lim = 1024
else:
  # Hufeisen: liegt flach (Blender XY, Dicke Z) -> aufrecht in XY-Ebene belassen (Dicke Z bleibt), Öffnung nach oben (+Y): Schwerpunkt unter der Mitte
  mn, mx, vs = bounds(); cen = sum(vs, Vector()) / len(vs); mid = (mn + mx) / 2
  d = Vector((cen.x - mid.x, cen.y - mid.y)); ang = math.atan2(d.y, d.x)  # Richtung zum geschlossenen Ende
  apply(Matrix.Rotation(-math.pi / 2 - ang, 4, 'Z'))  # geschlossenes Ende nach -Y
  apply(Matrix.Rotation(math.pi / 2, 4, 'X'))  # aufrichten: glTF-Y = oben, Öffnung nach oben, Dicke auf Z
  mn, mx, vs = bounds(); c = (mn + mx) / 2; apply(Matrix.Translation(-c))
  lim = 1024
for im in bpy.data.images:
  if im.users and im.size[0] > lim:
    k = lim / im.size[0]; im.scale(lim, int(im.size[1] * k))
for im in bpy.data.images:
  if im.users and im.type == 'IMAGE' and im.size[0] > 0 and not im.packed_file: im.pack()
print('TRIS', sum(len(p.vertices) - 2 for p in me.polygons), [round(x, 3) for x in (mx - mn)])
bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB', export_apply=True, export_yup=True, export_image_format='AUTO')
