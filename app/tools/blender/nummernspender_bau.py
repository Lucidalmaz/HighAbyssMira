# Wartenummern-Spender (Nummernautomat) für High Abyss Mira, Amt Ebene −2 / Tunnel (eigene Arbeit, Blender, Hard-Surface per Skript). Aufruf:
#   blender --background --factory-startup --threads 2 --python nummernspender_bau.py -- <ausgabeordner> [textur]
# Wandgerät: Rückplatte mit Schrauben, Rollenkasten oben mit Fenster zur Papierrolle (Schloss rechts), Emailschild mit erhabener Schrift
# „BITTE EINE NUMMER ZIEHEN“, Chrom-Rand und roter Druckknopf, schwarze Ausgabemulde unten mit Schlitz und gezackter Abrisskante, Kabel zur Abzweigdose.
# Teile: korpus · knopf (Ursprung = Knopfmitte). glTF: Wandseite z = 0, Vorderseite +z, Breite x, Unterkante y = 0. Maße: 0,26 × 0,55 (mit Kabel) × 0,13 m.
import bpy, bmesh, math, os, sys, json, time
import numpy as np
from mathutils import Vector
T0 = time.time()
a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = a[0] if a else os.getcwd(); TEX = int(a[1]) if len(a) > 1 else 1024; TYP = 'spender'; VAR = 'grau'
os.makedirs(OUT, exist_ok=True)
V = dict(paint=(.15, .165, .15), wear=.75, rust=.55, dirt=.95, dent=.6)
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
PARTS = []
K = []   # Korpus-Teile
# Rückplatte mit vier Schrauben
K.append(cube(-.13, .13, -.004, 0, .025, .415, bev=.0025, seg=2))
for sx in (-1, 1):
  for zz in (.05, .39): K.append(cyl(sx * .1225, -.006, zz, .0065, .004, 'Y', teil=2., n=14))
# Gehäuse: unten (Tastenfeld), oben (Rollenkasten)
low = cube(-.115, .115, -.108, -.004, .03, .215, bev=.012, seg=3)
up = cube(-.115, .115, -.125, -.004, .215, .40, bev=.014, seg=3)
cut(up, cube(-.036, .036, -.14, -.04, .275, .375, bev=0))                      # Fenster zur Papierrolle
K += [low, up]
K.append(cube(-.114, .114, -.1255, -.1235, .2125, .2175, bev=0, teil=1.))      # Trennfuge schwarz
roll = cyl(0, -.085, .325, .045, .056, 'X', teil=3., n=40); K.append(roll)
K.append(cyl(0, -.085, .325, .0125, .066, 'X', teil=7., n=20))                  # Pappkern
K.append(cube(-.034, .034, -.0762, -.0742, .277, .373, bev=0, teil=1.))        # Schatten hinter der Rolle
# Ausgabemulde mit Schlitz und Abrisskante
ch = cube(-.05, .05, -.1, -.004, 0., .034, bev=.007, seg=3, teil=1.)
cut(ch, cube(-.034, .034, -.088, -.064, -.01, .016, bev=0)); K.append(ch)
K.append(cube(-.042, .042, -.1015, -.0975, .004, .014, bev=.0008, teil=2.))
for i in range(15):
  bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=.0028, radius2=0, depth=.006, location=(-.0392 + i * .0056, -.0995, .0015), rotation=(math.pi, 0, math.pi / 4)); t_ = bpy.context.object; bpy.ops.object.transform_apply(rotation=True); setteil(t_, 2.); K.append(t_)
# Emailschild mit erhabener Schrift
K.append(cube(-.09, .09, -.111, -.108, .14, .205, bev=.0015, seg=2, teil=5.))
for sx in (-1, 1):
  for zz in (.147, .198): K.append(cyl(sx * .082, -.1115, zz, .0032, .0025, 'Y', teil=2., n=10))
K.append(text('BITTE EINE\nNUMMER ZIEHEN', 0, -.1114, .1725, .0115, teil=6., ext=.00035))
# Knopf-Einfassung (Chrom) + Schloss
K.append(cyl(0, -.112, .092, .029, .008, 'Y', teil=2., n=36))
K.append(cyl(0, -.1132, .092, .0235, .006, 'Y', teil=1., n=36))
K.append(cyl(.086, -.1265, .245, .0095, .006, 'Y', teil=2., n=20)); K.append(cube(.0845, .0875, -.1298, -.1272, .238, .252, bev=0, teil=1.))
# Kabel + Abzweigdose
cu = bpy.data.curves.new('kabel', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = .0035; cu.bevel_resolution = 3; cu.use_fill_caps = True
sp = cu.splines.new('POLY'); pts = [(.07, -.065, .40), (.07, -.065, .43), (.07, -.055, .452), (.07, -.035, .47), (.07, -.015, .482), (.07, -.008, .495)]
sp.points.add(len(pts) - 1)
for p_, c_ in zip(sp.points, pts): p_.co = (c_[0], c_[1], c_[2], 1)
ko = bpy.data.objects.new('kabel', cu); scn.collection.objects.link(ko); sel([ko]); bpy.ops.object.convert(target='MESH'); ko = bpy.context.object; setteil(ko, 1.); K.append(ko)
K.append(cube(.045, .095, -.026, -.004, .49, .535, bev=.004, seg=2, teil=7.))
K.append(cyl(.07, -.0265, .512, .0035, .002, 'Y', teil=2., n=10))
PARTS.append(join(K, 'korpus'))
# Knopf (eigenes Teil, Ursprung = Mitte)
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=.0225, location=(0, -.1165, .092)); kn = bpy.context.object; kn.scale = (1, .55, 1); bpy.ops.object.transform_apply(scale=True)
setteil(kn, 4.); kn.name = 'knopf'; kn.data.name = 'knopf'; origin(kn, (0, -.112, .092)); PARTS.append(kn)
for o in PARTS: o.data.polygons.foreach_set('use_smooth', [False] * len(o.data.polygons))
for o in PARTS:
  sel([o])
  try: bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
  except Exception: bpy.ops.object.shade_smooth(); o.data.use_auto_smooth = True
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in PARTS)
print('Bau', TYP, VAR, 'Dreiecke', tris, '%.1fs' % (time.time() - T0), flush=True)

# ---------------------------------------------------------------- UV (alle Teile in einen Atlas)
for o in PARTS: o.data.uv_layers.new(name='UVMap')
sel(PARTS); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(50), island_margin=.003, area_weight=0., scale_to_bounds=False)
try: bpy.ops.uv.pack_islands(rotate=True, margin=.003)
except Exception as e: print('pack', e)
bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------- Backen: 1) Masken Kante/AO (SVM)  2) Muster (OSL)
scn.render.engine = 'CYCLES'; scn.cycles.device = 'CPU'; scn.render.threads_mode = 'FIXED'; scn.render.threads = 2; scn.cycles.use_denoising = False
def img(n, srgb=False): i = bpy.data.images.new(n, TEX, TEX, alpha=False); i.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'; return i
I = {k: img('%s_%s_%s' % (TYP, VAR, k), k == 'albedo') for k in ('kante', 'ao', 'albedo', 'rough', 'metal', 'normal')}
mat = bpy.data.materials.new('schrank_%s_%s' % (TYP, VAR)); mat.use_nodes = True; nt = mat.node_tree; N = nt.nodes; L = nt.links
for o in PARTS: o.data.materials.clear(); o.data.materials.append(mat)
def reset():
  for n in list(N): N.remove(n)
  return N.new('ShaderNodeOutputMaterial')
def bake(image, kind='EMIT', samples=1):
  tn = N.new('ShaderNodeTexImage'); tn.image = image; N.active = tn; scn.cycles.samples = samples; sel(PARTS); t = time.time()
  if kind == 'EMIT': bpy.ops.object.bake(type='EMIT', margin=4, use_clear=True)
  else: bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', margin=4, use_clear=True)
  N.remove(tn); print('gebacken', image.name, '%.1fs' % (time.time() - t), flush=True)
scn.cycles.shading_system = False
out = reset(); em = N.new('ShaderNodeEmission'); L.new(em.outputs[0], out.inputs['Surface'])
bv = N.new('ShaderNodeBevel'); bv.inputs['Radius'].default_value = .0035; bv.samples = 8
ge = N.new('ShaderNodeNewGeometry'); dp = N.new('ShaderNodeVectorMath'); dp.operation = 'DOT_PRODUCT'; L.new(bv.outputs['Normal'], dp.inputs[0]); L.new(ge.outputs['Normal'], dp.inputs[1])
mk = N.new('ShaderNodeMath'); mk.operation = 'MULTIPLY_ADD'; mk.use_clamp = True; L.new(dp.outputs['Value'], mk.inputs[0]); mk.inputs[1].default_value = -18; mk.inputs[2].default_value = 18
L.new(mk.outputs[0], em.inputs['Color']); bake(I['kante'], samples=8)
for l in list(em.inputs['Color'].links): L.remove(l)
ao = N.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = .05; ao.samples = 12; L.new(ao.outputs['AO'], em.inputs['Color']); bake(I['ao'], samples=8)

OSL = r'''
#define PAINT color(%(p0)f, %(p1)f, %(p2)f)
#define WEAR %(wear)f
#define RUST %(rust)f
#define DIRT %(dirt)f
#define DENT %(dent)f
float fbm(point p, int o) { float s = 0, a = .5; point q = p; for (int i = 0; i < o; i++) { s += a * noise("perlin", q); q = q * 2.03 + point(3.1, 7.7, 1.3); a *= .5; } return s; }
shader schrank(float kante = 0, float ao = 1, float teil = 0, output color Col = 0, output float Rough = .5, output float Metal = 0, output float Height = 0) {
  point p = transform("object", P); vector n = normalize(transform("object", N)); int tl = (int)floor(teil + .5);
  float n1 = fbm(p * 22, 5), n2 = fbm(p * 5.5 + point(4, 1, 7), 5), n3 = fbm(point(p[0] * 9, p[1] * 9, p[2] * 1.2), 4), fine = noise("perlin", p * 900);
  float cav = clamp((1 - ao) * 1.6, 0, 1), low = 1 - smoothstep(.0, .35, p[2]);
  float wear = smoothstep(.28, .46, kante * (.7 + .6 * (n1 * .5 + .5)) * WEAR + n1 * .25 * WEAR) + smoothstep(.72, .8, n2 * .5 + .5) * .25 * WEAR * smoothstep(.2, .6, n1 + .3);
  wear = clamp(wear, 0, 1);
  float rust = clamp(smoothstep(.55, .75, (kante * .5 + cav * .5 + low * .35) * RUST + n2 * .45 * RUST + n1 * .1), 0, 1) * (tl == 0 ? 1 : 0);
  float streak = smoothstep(.1, .6, n3) * DIRT * .55; float scratch = smoothstep(.93, .99, noise("perlin", point(p[0] * 300, p[1] * 300, p[2] * 25) + n1 * 2)) * WEAR;
  color paint = PAINT * (.9 + .16 * n2 + .05 * fine); paint = mix(paint, paint * .75, smoothstep(.0, .8, p[2] / 2.0) * .0);
  color steel = color(.42, .42, .41) * (.85 + .2 * n1); color rustc = mix(color(.16, .055, .02), color(.32, .13, .04), n1 * .5 + .5);
  wear = clamp(wear + scratch * .8, 0, 1); color c = mix(paint, steel, wear); float r = mix(.42 + .1 * n2, .32 + .1 * n1, wear); float m = wear;
  c = mix(c, rustc, rust); r = mix(r, .82 + .1 * n1, rust); m = mix(m, 0, rust);
  float dirt = clamp(cav * DIRT * .9 + streak + low * DIRT * .25, 0, 1); c = mix(c, c * color(.45, .42, .38), dirt); r = mix(r, .78, dirt * .6);
  if (tl == 1) { c = color(.022, .021, .02) * (.8 + .4 * n1); r = .62 + .15 * n2; m = 0; c = mix(c, color(.12, .115, .105), dirt * .5); }
  if (tl == 2) { c = color(.55, .55, .53) * (.8 + .2 * n1); r = .25 + .1 * n2; m = 1; c = mix(c, color(.2, .18, .15), cav * .6); }
  if (tl == 3) { c = color(.66, .63, .55) * (.88 + .12 * n2); r = .92; m = 0; c = mix(c, color(.35, .31, .25), cav * .5); }
  if (tl == 4) { c = color(.42, .028, .02) * (.85 + .3 * n2); r = .32 + .15 * n1; m = 0; c = mix(c, color(.3, .12, .09), dirt * .35); }
  if (tl == 5) { c = color(.66, .62, .5) * (.9 + .1 * n2); r = .28 + .1 * n1; m = 0; c = mix(c, steel, wear * .7); c = mix(c, c * color(.55, .5, .42), dirt * .6); }
  if (tl == 6) { c = color(.025, .024, .022); r = .5; m = 0; }
  if (tl == 7) { c = color(.58, .56, .5) * (.88 + .12 * n2); r = .5 + .1 * n1; m = 0; c = mix(c, color(.34, .3, .22), dirt * .7); }
  float dents = 0; { point q = p * 4.5; float d = 1e9; point best = q; point fq = floor(q);
    for (int ix = -1; ix <= 1; ix++) for (int iy = -1; iy <= 1; iy++) for (int iz = -1; iz <= 1; iz++) { point cc = fq + point(ix, iy, iz); vector rnd = cellnoise(cc); point cp = cc + rnd; float dd = distance(q, cp); if (dd < d) { d = dd; best = cc; } }
    float pick = cellnoise(best + point(9, 9, 9)); dents = (pick < .25 * DENT) ? -(1 - smoothstep(0, .55, d)) : 0; }
  Col = clamp(c, color(0), color(1)); Rough = clamp(r, .05, 1); Metal = clamp(m, 0, 1);
  Height = dents * .6 + fine * .015 * (1 - wear) + (1 - wear) * .08 + rust * n1 * .25 + n1 * .02;
}
'''
src = OSL % dict(p0=V['paint'][0], p1=V['paint'][1], p2=V['paint'][2], wear=V['wear'], rust=V['rust'], dirt=V['dirt'], dent=V['dent'])
txt = bpy.data.texts.new('schrank.osl'); txt.from_string(src)
scn.cycles.shading_system = True
out = reset(); em = N.new('ShaderNodeEmission'); L.new(em.outputs[0], out.inputs['Surface'])
scr = N.new('ShaderNodeScript'); scr.mode = 'INTERNAL'; scr.script = txt
ik = N.new('ShaderNodeTexImage'); ik.image = I['kante']; ia = N.new('ShaderNodeTexImage'); ia.image = I['ao']; at = N.new('ShaderNodeAttribute'); at.attribute_name = 'teil'
L.new(ik.outputs['Color'], scr.inputs['kante']); L.new(ia.outputs['Color'], scr.inputs['ao']); L.new(at.outputs['Fac'], scr.inputs['teil'])
for key, sock in (('albedo', 'Col'), ('rough', 'Rough'), ('metal', 'Metal')):
  for l in list(em.inputs['Color'].links): L.remove(l)
  L.new(scr.outputs[sock], em.inputs['Color']); bake(I[key])
for l in list(out.inputs['Surface'].links): L.remove(l)
bs = N.new('ShaderNodeBsdfPrincipled'); bu = N.new('ShaderNodeBump'); bu.inputs['Strength'].default_value = .5; bu.inputs['Distance'].default_value = .003
L.new(scr.outputs['Height'], bu.inputs['Height']); L.new(bu.outputs['Normal'], bs.inputs['Normal']); L.new(bs.outputs['BSDF'], out.inputs['Surface']); bake(I['normal'], 'NORMAL', 4)
# ORM packen: R = AO, G = Rauheit, B = Metall
px = lambda im: np.array(im.pixels[:], np.float32).reshape(-1, 4)
orm = np.ones((TEX * TEX, 4), np.float32); orm[:, 0] = px(I['ao'])[:, 0]; orm[:, 1] = px(I['rough'])[:, 0]; orm[:, 2] = px(I['metal'])[:, 0]
IO = img('%s_%s_orm' % (TYP, VAR)); IO.pixels.foreach_set(orm.ravel())
for k_, im in (('albedo', I['albedo']), ('normal', I['normal']), ('orm', IO)):
  im.filepath_raw = os.path.join(OUT, im.name + '.png'); im.file_format = 'PNG'; im.save()
scn.cycles.shading_system = False
out = reset(); bs = N.new('ShaderNodeBsdfPrincipled'); L.new(bs.outputs['BSDF'], out.inputs['Surface'])
ta = N.new('ShaderNodeTexImage'); ta.image = I['albedo']; L.new(ta.outputs['Color'], bs.inputs['Base Color'])
to = N.new('ShaderNodeTexImage'); to.image = IO; sp = N.new('ShaderNodeSeparateColor'); L.new(to.outputs['Color'], sp.inputs['Color']); L.new(sp.outputs['Green'], bs.inputs['Roughness']); L.new(sp.outputs['Blue'], bs.inputs['Metallic'])
tn = N.new('ShaderNodeTexImage'); tn.image = I['normal']; nm = N.new('ShaderNodeNormalMap'); L.new(tn.outputs['Color'], nm.inputs['Color']); L.new(nm.outputs['Normal'], bs.inputs['Normal'])
for o in PARTS:
  if 'teil' in o.data.attributes: o.data.attributes.remove(o.data.attributes['teil'])
sel(PARTS); path = os.path.join(OUT, 'nummernspender.glb')
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_animations=False, export_image_format='AUTO', export_normals=True)
info = dict(typ=TYP, var=VAR, tris=tris, teile=[o.name for o in PARTS], tex=TEX, kb=round(os.path.getsize(path) / 1024), s=round(time.time() - T0, 1))
json.dump(info, open(os.path.join(OUT, '%s_%s.json' % (TYP, VAR)), 'w')); print('FERTIG', json.dumps(info), flush=True)
