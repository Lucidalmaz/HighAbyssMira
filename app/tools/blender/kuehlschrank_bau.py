# Kühlschrank im Stil der 1950er/60er (QA M-14): Emaille-Korpus mit großem Eckradius, Gefrierfach-Tür oben, Fugen, Chromgriffe, Scharniere,
# Sockelblende, Typenschild ohne Schrift, Abplatzer/Flecken als flache Geometrie. Eigenbau nach üblicher Bauform, keine Texturen.
# Ursprung: Mitte der Bodenfläche, Front +z (glTF), Höhe +y. Maße in Metern.
#   blender --background --factory-startup --threads 2 --python kuehlschrank_bau.py -- <ausgabe.glb> <breite> <hoehe> <tiefe> <gefrierfach-anteil> <griffseite +1|-1> [seed]
import bpy, sys, math, random
a = sys.argv[sys.argv.index('--') + 1:]
OUT = a[0]; W, H, D = float(a[1]), float(a[2]), float(a[3]); FR = float(a[4]); HS = int(a[5]); SEED = int(a[6]) if len(a) > 6 else 3
rnd = random.Random(SEED)
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
def mat(name, col, rough, metal=0.):
  m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
  b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
M_E = mat('M_Email', (.66, .63, .54), .26); M_C = mat('M_Chrom', (.55, .55, .53), .22, 1.); M_G = mat('M_Gummi', (.02, .02, .02), .8); M_D = mat('M_Dreck', (.55, .51, .42), .7); M_R = mat('M_Rost', (.20, .10, .05), .85)
parts = []
def link(o, m): o.data.materials.clear(); o.data.materials.append(m); parts.append(o); return o
def box(name, x, y, z, sx, sy, sz, m, bevel=0., seg=3):
  bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.name = name; o.scale = (sx, sy, sz); o.location = (x, y, z); bpy.ops.object.transform_apply(scale=True)
  if bevel:
    bv = o.modifiers.new('b', 'BEVEL'); bv.width = bevel; bv.segments = seg; bv.limit_method = 'NONE'; bpy.ops.object.modifier_apply(modifier='b')
  return link(o, m)
def cyl(name, x, y, z, r, L, m, axis='Z', v=14):
  bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=L, location=(x, y, z)); o = bpy.context.object; o.name = name
  if axis == 'Y': o.rotation_euler.x = math.pi / 2
  if axis == 'X': o.rotation_euler.y = math.pi / 2
  bpy.ops.object.transform_apply(rotation=True); return link(o, m)
yF = -D / 2  # Frontebene (Blender −y = glTF +z)
sockel = .075; sp = sockel + (H - sockel) * (1 - FR)  # Trennfuge Gefrierfach
# Korpus (Eckradius ~4,5 cm), dahinter etwas zurückgesetzt
box('Korpus', 0, 0, sockel + (H - sockel) / 2, W, D - .012, H - sockel, M_E, bevel=.06, seg=7)
box('Sockel', 0, .012, sockel / 2, W - .06, D - .06, sockel, M_G, bevel=.004)
# Türen (leicht erhaben, Radius ~3 cm), Gummifuge dazwischen
dz0 = sockel + .006; dz1 = sp - .004; fz0 = sp + .004; fz1 = H - .004
box('Tuer_unten', 0, yF + .004, (dz0 + dz1) / 2, W - .018, .016, dz1 - dz0, M_E, bevel=.04, seg=6)
box('Tuer_oben', 0, yF + .004, (fz0 + fz1) / 2, W - .018, .016, fz1 - fz0, M_E, bevel=.04, seg=6)
box('Fuge', 0, yF + .012, sp, W - .02, .006, .008, M_G)
# Griffe (Chrom, senkrecht, auf zwei Stützen) auf der Griffseite
gx = HS * (W / 2 - .05)
def griff(zc, L):
  cyl('griff', gx, yF - .026, zc, .0115, L, M_C, 'Z'); cyl('st', gx, yF - .011, zc + L / 2 - .022, .006, .026, M_C, 'Y', 10); cyl('st', gx, yF - .011, zc - L / 2 + .022, .006, .026, M_C, 'Y', 10)
griff(dz1 - .17 - .12, .30); griff((fz0 + fz1) / 2, min(.12, (fz1 - fz0) * .55))
# Scharniere gegenüber (außen sichtbare Chromzylinder)
hx = -HS * (W / 2 - .006)
for zc in (dz0 + .07, dz1 - .07, fz0 + .05, fz1 - .05): cyl('scharnier', hx, yF + .004, zc, .0075, .045, M_C, 'Z', 10)
# Typenschild ohne Schrift (kleine Chromoval) oben auf der Tür
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.5, location=(0, yF - .002, fz1 - .045)); o = bpy.context.object; o.scale = (.075, .006, .018); bpy.ops.object.transform_apply(scale=True); link(o, M_C)
# Alterung: Rost an den Sockelkanten und der Türunterkante, flache Flecken und Abplatzer auf Email
def fleck(m, x, z, r, h=.0006, n=12, sx=1., sy=1.):
  bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=h, location=(x, yF - .0048, z)); o = bpy.context.object; o.rotation_euler.x = math.pi / 2; o.rotation_euler.y = rnd.uniform(0, 6.28)
  o.scale = (sx, 1, sy); bpy.ops.object.transform_apply(rotation=True, scale=True); return link(o, m)
for i in range(7): fleck(M_R, rnd.uniform(-W / 2 + .03, W / 2 - .03), dz0 + rnd.uniform(.0, .06), rnd.uniform(.006, .02), n=7, sx=rnd.uniform(1, 2.2), sy=rnd.uniform(.4, .9))
for i in range(5): fleck(M_D, rnd.uniform(-W / 2 + .06, W / 2 - .06), rnd.uniform(dz0 + .1, fz1 - .1), rnd.uniform(.03, .09), h=.0003, n=28, sx=rnd.uniform(.5, 1.4), sy=rnd.uniform(.8, 2.2))
for i in range(10):
  side = rnd.choice((-1, 1)); fleck(M_R if rnd.random() < .5 else M_G, side * (W / 2 - .02 - rnd.uniform(0, .015)), rnd.uniform(dz0 + .05, fz1 - .03), rnd.uniform(.003, .008), n=6)
bpy.ops.object.select_all(action='DESELECT')
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = 'Kuehlschrank'
me = o.data; bpy.ops.object.shade_auto_smooth(angle=math.radians(35))  # Fasen weich, flache Scheiben (Abplatzer) bleiben flach
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
print('INFO kuehl', len(me.polygons), OUT)
