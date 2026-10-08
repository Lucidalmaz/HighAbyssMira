# Rabe, Stufe 1: Körper aus dem Museumsscan (CC0, „Common raven“, Virtuelle Museen Kleinpolens) vorbereiten.
# Eingabe: <werk>/scan_aus.blend (Scan ohne Ast, Blick nach -Y, Füße auf z=0). Ausgabe: <werk>/koerper.blend mit
#   „hoch“ (Quelle fürs Backen, im Raum der alten Krähe) und „whiskey“/„kraehe“ (reduziert, mit UV im Körperbereich des Atlas).
# Schritte: Schwanz + Flügelspitzen hinter dem Rumpf weg (kommen als einzelne Federn), Beine unter dem Federhöschen weg
# (kommen gebaut mit Schuppen/Krallen), Löcher schließen, Kopf mittig rücken, in den Raum der alten Krähe (Maßstab, Neigung, Becken).
#   blender --background --factory-startup --threads 2 --python rabe_bau1_koerper.py -- <werk>
import bpy, bmesh, sys, math, numpy as np
from mathutils import Vector, Matrix
a = sys.argv[sys.argv.index('--') + 1:]; W = a[0].rstrip('/\\') + '/'
bpy.ops.wm.open_mainfile(filepath=W + 'scan_aus.blend')
ob = next(o for o in bpy.context.scene.objects if o.type == 'MESH'); ob.name = 'hoch'; me = ob.data
bpy.context.view_layer.objects.active = ob; ob.select_set(True)

# ---- Schnitte (Scan-Koordinaten)
bm = bmesh.new(); bm.from_mesh(me)
cut = [v for v in bm.verts if v.co.y > .22 or (v.co.z < .225 and -.15 < v.co.y < .17)]
bmesh.ops.delete(bm, geom=cut, context='VERTS')
# lose Reste weg
seen = set(); small = []
for v in bm.verts:
  if v in seen: continue
  st = [v]; isl = [v]; seen.add(v)
  while st:
    q = st.pop()
    for e in q.link_edges:
      b = e.other_vert(q)
      if b not in seen: seen.add(b); st.append(b); isl.append(b)
  if len(isl) < 2000: small += isl
bmesh.ops.delete(bm, geom=small, context='VERTS')
# Kopf mittig (der Scan hat ihn 1,7 cm zur rechten Seite verschoben)
for v in bm.verts:
  y = v.co.y
  if y < -.08: k = min(1, (-.08 - y) / .08); k = k * k * (3 - 2 * k); v.co.x += .017 * k
bm.to_mesh(me); bm.free()
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.fill_holes(sides=0)
bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.mesh.select_non_manifold(); bpy.ops.mesh.delete(type='VERT')
bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.fill_holes(sides=0)
bpy.ops.object.mode_set(mode='OBJECT')
print('INFO hoch', len(me.vertices), len(me.polygons))

# ---- Bereiche markieren (vor der Umrechnung, Scan-Koordinaten): Unterschnabel, Oberschnabel, Kehle
def zline(y): return .54 + (y + .215) * .376
g_jaw = ob.vertex_groups.new(name='JAW'); g_ub = ob.vertex_groups.new(name='OBERSCHNABEL')
for v in me.vertices:
  y, z = v.co.y, v.co.z
  if z < .45 or y > -.15: continue
  if -.297 <= y <= -.212 and z < zline(y) - .001: g_jaw.add([v.index], 1, 'REPLACE')
  elif -.212 < y < -.17 and z < zline(y) - .004 and z > .44: g_jaw.add([v.index], max(0, (-.17 - y) / .042) * .85, 'REPLACE')
  if y < -.222 and z >= zline(y) - .001: g_ub.add([v.index], 1, 'REPLACE')
  elif y < -.298: g_ub.add([v.index], 1, 'REPLACE')

# ---- In den Raum der alten Krähe: p' = s·R(p − H_s) + H_c
s = .53; th = math.radians(9.6); Hs = Vector((0, .07, .31)); Hc = Vector((0, .032, .129))
M = Matrix.Translation(Hc) @ Matrix.Rotation(th, 4, 'X') @ Matrix.Scale(s, 4) @ Matrix.Translation(-Hs)
me.transform(M); me.update()
co = np.zeros(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
print('INFO bbox krähe', co.min(0).round(3), co.max(0).round(3))
# Augen (Scan → Krähe) für Stufe 3
for n, p in (('L', Vector((.0406, -.191, .558))), ('R', Vector((-.040, -.19, .562)))):
  q = M @ p; print('INFO auge', n, tuple(round(x, 4) for x in q)); ob['auge_' + n] = list(q)
ob['M_scan'] = [list(r) for r in M]

# ---- Reduzierte Fassungen
def reduziert(name, tris):
  bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
  bpy.ops.object.duplicate(); lo = bpy.context.view_layer.objects.active; lo.name = name
  md = lo.modifiers.new('dec', 'DECIMATE'); md.ratio = tris / len(lo.data.polygons); md.use_collapse_triangulate = True
  md.vertex_group_factor = 1.0
  bpy.ops.object.modifier_apply(modifier='dec')
  # UV neu: Inseln in den Körperbereich (u 0..1, v 0..0,75) des Atlas
  bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
  bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=.004, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
  bpy.ops.object.mode_set(mode='OBJECT')
  uv = lo.data.uv_layers.active.data; n = len(uv); arr = np.zeros(n * 2, np.float32); uv.foreach_get('uv', arr); arr = arr.reshape(-1, 2)
  mn, mx = arr.min(0), arr.max(0); arr = (arr - mn) / (mx - mn); arr[:, 1] *= .745; uv.foreach_set('uv', arr.ravel())
  bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.select_all(action='SELECT')
  try: bpy.ops.uv.pack_islands(udim_source='ORIGINAL_AABB', rotate=True, margin=.003, shape_method='CONCAVE')
  except TypeError: bpy.ops.uv.pack_islands(rotate=True, margin=.003)
  bpy.ops.object.mode_set(mode='OBJECT')
  uv.foreach_get('uv', arr.ravel()); print('INFO', name, len(lo.data.polygons), 'uv', arr.reshape(-1, 2).min(0).round(3), arr.reshape(-1, 2).max(0).round(3))
  return lo
for o in [o for o in bpy.data.objects if o.type == 'MESH']: o.data.uv_layers.active_index = 0
# alte UV des Scans behalten (zum Backen), die neuen bekommen eigene Ebene
reduziert('whiskey', 26000); reduziert('kraehe', 4300)
bpy.ops.wm.save_as_mainfile(filepath=W + 'koerper.blend')
print('INFO fertig')
