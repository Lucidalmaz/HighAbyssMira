# Gemeinsame Hilfen für die Blender-Requisiten (Hard-Surface per Skript + Backen von Lack/Abrieb/Rost/Schmutz). Aufruf aus Bauskripten: exec(open(<ordner>/prop_lib.py).read()); der Backteil liegt in prop_tail.py.
import bpy, bmesh, math, os, sys, json, time
import numpy as np
from mathutils import Vector
T0 = time.time()
a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
scn = bpy.context.scene
def sel(objs, act=None):
  bpy.ops.object.select_all(action='DESELECT')
  for o in objs: o.select_set(True)
  bpy.context.view_layer.objects.active = act or objs[0]
def setteil(o, teil):
  at = o.data.attributes.new('teil', 'FLOAT', 'POINT'); at.data.foreach_set('value', [teil] * len(o.data.vertices))
def cube(x0, x1, y0, y1, z0, z1, bev=.0025, seg=2, teil=0.):
  bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); o = bpy.context.object
  o.scale = (x1 - x0, y1 - y0, z1 - z0); bpy.ops.object.transform_apply(scale=True)
  if bev > 0:
    m = o.modifiers.new('bev', 'BEVEL'); m.width = min(bev, (x1 - x0) * .45, (y1 - y0) * .45, (z1 - z0) * .45); m.segments = seg; m.limit_method = 'ANGLE'
    bpy.ops.object.modifier_apply(modifier='bev')
  setteil(o, teil); return o
def cyl(x, y, z, r, d, axis='Y', teil=0., n=20):
  bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=d, location=(x, y, z), rotation=((math.pi / 2, 0, 0) if axis == 'Y' else (0, math.pi / 2, 0) if axis == 'X' else (0, 0, 0)))
  o = bpy.context.object; bpy.ops.object.transform_apply(rotation=True); setteil(o, teil); return o
def cut(o, c):
  m = o.modifiers.new('b', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = c; m.solver = 'EXACT'; sel([o]); bpy.ops.object.modifier_apply(modifier='b'); bpy.data.objects.remove(c, do_unlink=True)
def join(objs, name):
  sel(objs); bpy.ops.object.join(); o = bpy.context.object; o.name = name; o.data.name = name; return o
def origin(o, p):
  scn.cursor.location = p; sel([o]); bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
def text(s, x, y, z, size, teil=6., ext=.0004):
  cu = bpy.data.curves.new('t', 'FONT'); cu.body = s; cu.size = size; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.extrude = ext; cu.space_line = 1.15
  o = bpy.data.objects.new('t', cu); scn.collection.objects.link(o); o.location = (x, y, z); o.rotation_euler = (math.pi / 2, 0, 0)
  sel([o]); bpy.ops.object.convert(target='MESH'); o = bpy.context.object; setteil(o, teil); return o

def teilcode(TEILE):
  out = []
  for k, t in TEILE.items():
    c = t['c']; s = '  if (tl == %d) { c = color(%f, %f, %f) * (%f + %f * n2); r = %f + %f * n1; m = %f;' % (k, c[0], c[1], c[2], 1 - t.get('var', .12) / 2, t.get('var', .12), t.get('r', .6), t.get('rv', .1), t.get('m', 0))
    if t.get('wear'): s += ' c = mix(c, steel, wear * %f);' % t['wear']
    if t.get('dirt'): s += ' c = mix(c, c * color(.5, .46, .4), dirt * %f);' % t['dirt']
    if t.get('cav'): s += ' c = mix(c, c * color(.4, .36, .3), cav * %f);' % t['cav']
    out.append(s + ' }' + chr(10))
  return ''.join(out)
def finish(PARTS_, NAME_, TEILE, V_, TEX_=1024, OUT_=None):
  g = globals(); g['PARTS'] = PARTS_; g['NAME'] = NAME_; g['V'] = V_; g['TEX'] = TEX_; g['OUT'] = OUT_ or (a[0] if a else os.getcwd()); g['TYP'] = NAME_; g['VAR'] = 'x'
  os.makedirs(g['OUT'], exist_ok=True)
  g['tris'] = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in PARTS_)
  tail = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prop_tail.py'), encoding='utf8').read()
  exec(compile(tail.replace('@@TEIL@@', teilcode(TEILE)), 'prop_tail', 'exec'), g)
