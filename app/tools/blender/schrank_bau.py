# Metall-Aktenschränke für High Abyss Mira (eigene Arbeit, Blender, Hard-Surface per Skript). Aufruf (niedrige Priorität, 2 Threads):
#   blender --background --factory-startup --threads 2 --python schrank_bau.py -- <akte|archiv> <variante> <ausgabeordner> [textur]
# akte   = Hängeregistratur-Schrank, 4 Schubladen: B 0,47 × T 0,62 × H 1,32 m. Teile: korpus · schublade_1..4 (Ursprung = Mitte der Frontfläche, Zug nach +z)
# archiv = hoher Archivschrank mit Flügeltüren: B 0,90 × T 0,45 × H 1,95 m. Teile: korpus (mit 4 Fachböden) · tuer_links · tuer_rechts (Ursprung = Scharnierachse)
# glTF-Achsen: Vorderseite +z, Breite entlang x, Unterkante y = 0, Mitte x/z = 0 (in Blender: Vorderseite −Y).
# Varianten: grau · oliv · beige · gruen (Lackfarbe, Abrieb, Rost, Dellen verschieden). Keine Schrift: Schilderhalter leer.
# Texturen aus Blender gebacken: Kanten (Bevel) und Hohlräume (AO) als Masken, darauf ein OSL-Muster (Lack, Orangenhaut, Abplatzer bis aufs Blech, Rost, Schmutz, Dellen).
import bpy, bmesh, math, os, sys, json, time
import numpy as np
from mathutils import Vector
T0 = time.time()
a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
TYP = a[0] if a else 'akte'; VAR = a[1] if len(a) > 1 else 'grau'; OUT = a[2] if len(a) > 2 else os.getcwd(); TEX = int(a[3]) if len(a) > 3 else 1024
os.makedirs(OUT, exist_ok=True)
VARS = {  # Lack (linear), Abrieb, Rost, Schmutz, Dellen
  'grau':  dict(paint=(.30, .31, .30), wear=.55, rust=.35, dirt=.5, dent=.6),
  'oliv':  dict(paint=(.14, .16, .09), wear=.7, rust=.55, dirt=.6, dent=.8),
  'beige': dict(paint=(.52, .46, .33), wear=.45, rust=.3, dirt=.65, dent=.5),
  'gruen': dict(paint=(.17, .24, .20), wear=.8, rust=.75, dirt=.7, dent=1.0)}
V = VARS[VAR]
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
scn = bpy.context.scene
def sel(objs, act=None):
  bpy.ops.object.select_all(action='DESELECT')
  for o in objs: o.select_set(True)
  bpy.context.view_layer.objects.active = act or objs[0]
def cube(x0, x1, y0, y1, z0, z1, bev=.0025, seg=2, teil=0.):
  bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); o = bpy.context.object
  o.scale = (x1 - x0, y1 - y0, z1 - z0); bpy.ops.object.transform_apply(scale=True)
  if bev > 0:
    m = o.modifiers.new('bev', 'BEVEL'); m.width = min(bev, (x1 - x0) * .45, (y1 - y0) * .45, (z1 - z0) * .45); m.segments = seg; m.limit_method = 'ANGLE'
    bpy.ops.object.modifier_apply(modifier='bev')
  at = o.data.attributes.new('teil', 'FLOAT', 'POINT'); at.data.foreach_set('value', [teil] * len(o.data.vertices)); return o
def cyl(x, y, z, r, d, axis='Y', teil=0., n=16):
  bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=d, location=(x, y, z), rotation=((math.pi / 2, 0, 0) if axis == 'Y' else (0, math.pi / 2, 0) if axis == 'X' else (0, 0, 0)))
  o = bpy.context.object; bpy.ops.object.transform_apply(rotation=True); at = o.data.attributes.new('teil', 'FLOAT', 'POINT'); at.data.foreach_set('value', [teil] * len(o.data.vertices)); return o
def cut(o, c):
  m = o.modifiers.new('b', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = c; m.solver = 'EXACT'; sel([o]); bpy.ops.object.modifier_apply(modifier='b'); bpy.data.objects.remove(c, do_unlink=True)
def join(objs, name):
  sel(objs); bpy.ops.object.join(); o = bpy.context.object; o.name = name; o.data.name = name; return o
def origin(o, p):
  scn.cursor.location = p; sel([o]); bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
PARTS = []
t = .012   # Blechkante (sichtbare Stärke der Kanten)
if TYP == 'akte':
  W, D, H = .47, .62, 1.32; f0 = -D / 2; zb = .016   # Front bei y = −D/2, Füße 16 mm
  k = [cube(-W / 2, -W / 2 + t, f0, D / 2, zb, H), cube(W / 2 - t, W / 2, f0, D / 2, zb, H), cube(-W / 2, W / 2, f0, D / 2, H - t, H, bev=.004, seg=3),
       cube(-W / 2, W / 2, D / 2 - t, D / 2, zb, H), cube(-W / 2, W / 2, f0 + .02, D / 2, zb, zb + .03)]
  k.append(cube(-W / 2 + t, W / 2 - t, f0, f0 + .015, zb, zb + .035, bev=.002))            # Sockelblende
  k.append(cube(-W / 2 + t, W / 2 - t, f0, f0 + .02, H - .045, H - t, bev=.002))            # obere Blende mit Schloss
  inner_top, inner_bot = H - .045, zb + .035; hd = (inner_top - inner_bot) / 4
  for i in range(1, 4): k.append(cube(-W / 2 + t, W / 2 - t, f0, f0 + .02, inner_bot + i * hd - .004, inner_bot + i * hd + .004, bev=.0015))  # Querriegel
  for sx in (-1, 1):
    for sy in (-1, 1): k.append(cyl(sx * (W / 2 - .03), sy * (D / 2 - .04), zb / 2, .016, zb, axis='Z', teil=1., n=12))  # Gummifüße
  lock = cyl(W / 2 - .05, f0 - .002, H - .028, .0095, .012, teil=2.); k.append(lock)
  slot = cube(W / 2 - .0465, W / 2 - .0435, f0 - .012, f0 - .009, H - .036, H - .024, bev=0, teil=2.); cut(lock, slot) if False else bpy.data.objects.remove(slot, do_unlink=True)
  PARTS.append(join(k, 'korpus'))
  for i in range(4):
    z0 = inner_bot + i * hd + .0045; z1 = inner_bot + (i + 1) * hd - .0045; zc = (z0 + z1) / 2; fy = f0 - .0015; fw = W - .006
    fr = cube(-fw / 2, fw / 2, fy - .018, fy, z0, z1, bev=.003, seg=3)
    mu = cube(-.065, .065, fy - .03, fy - .006, zc + .01, zc + .046, bev=.006, seg=3)           # Griffmulde
    cut(fr, mu)
    lip = cube(-.06, .06, fy - .016, fy - .004, zc + .006, zc + .012, bev=.002, teil=0.)          # Griffkante innen
    sh = [cube(-.048, .048, fy - .0215, fy - .018, zc - .036, zc - .033, bev=.0006, teil=3.), cube(-.048, -.045, fy - .0215, fy - .018, zc - .036, zc - .006, bev=.0006, teil=3.),
          cube(.045, .048, fy - .0215, fy - .018, zc - .036, zc - .006, bev=.0006, teil=3.), cube(-.045, .045, fy - .0212, fy - .0195, zc - .034, zc - .008, bev=0, teil=4.)]  # Schilderhalter (leer)
    bx = [cube(-W / 2 + t + .006, -W / 2 + t + .012, fy, D / 2 - .03, z0 + .01, z1 - .03, bev=0), cube(W / 2 - t - .012, W / 2 - t - .006, fy, D / 2 - .03, z0 + .01, z1 - .03, bev=0),
          cube(-W / 2 + t + .006, W / 2 - t - .006, D / 2 - .036, D / 2 - .03, z0 + .01, z1 - .03, bev=0), cube(-W / 2 + t + .006, W / 2 - t - .006, fy, D / 2 - .03, z0 + .01, z0 + .016, bev=0)]
    o = join([fr, lip] + sh + bx, 'schublade_%d' % (i + 1)); origin(o, (0, fy - .018, zc)); PARTS.append(o)
else:
  W, D, H = .90, .45, 1.95; f0 = -D / 2; zb = .012; pl = .07
  k = [cube(-W / 2, -W / 2 + t, f0, D / 2, zb, H), cube(W / 2 - t, W / 2, f0, D / 2, zb, H), cube(-W / 2, W / 2, f0, D / 2, H - t * 1.5, H, bev=.004, seg=3),
       cube(-W / 2, W / 2, D / 2 - t, D / 2, zb, H), cube(-W / 2 + t, W / 2 - t, f0 + .03, D / 2, zb, pl, bev=.002), cube(-W / 2 + t, W / 2 - t, f0, f0 + .03, zb, pl - .004, bev=.002)]
  for i in range(4):                                                                              # Fachböden mit gekantetem Rand
    zz = pl + (H - pl) * (i + 1) / 5
    k += [cube(-W / 2 + t, W / 2 - t, f0 + .03, D / 2 - t, zz - .002, zz + .002, bev=0), cube(-W / 2 + t, W / 2 - t, f0 + .028, f0 + .034, zz - .03, zz + .002, bev=.001)]
  for sx in (-1, 1):
    for sy in (-1, 1): k.append(cyl(sx * (W / 2 - .04), sy * (D / 2 - .04), zb / 2, .018, zb, axis='Z', teil=1., n=12))
  for sx in (-1, 1):
    for zz in (pl + .15, H - .2): k.append(cyl(sx * (W / 2 - .002), f0 - .012, zz, .007, .07, axis='Z', teil=0., n=10))   # Scharniere
  PARTS.append(join(k, 'korpus'))
  dh0, dh1 = pl + .004, H - t * 1.5 - .004; dw = W / 2 - .004
  for s, nm in ((-1, 'tuer_links'), (1, 'tuer_rechts')):
    xa, xb = (-W / 2 + .002, -.002) if s < 0 else (.002, W / 2 - .002)
    dr = cube(xa, xb, f0 - .022, f0 - .002, dh0, dh1, bev=.003, seg=3)
    parts = [dr]
    for zz in (dh0 + .35, (dh0 + dh1) / 2, dh1 - .35): parts.append(cube(xa + .04, xb - .04, f0 - .0235, f0 - .021, zz - .012, zz + .012, bev=.004, seg=2))  # Sicken (gepresst)
    if s > 0:
      zc = (dh0 + dh1) / 2 + .05
      parts += [cube(.03, .055, f0 - .03, f0 - .021, zc - .09, zc + .09, bev=.004, seg=2, teil=2.), cyl(.0425, f0 - .046, zc, .009, .03, axis='Y', teil=2.),   # Drehgriff-Rosette + Griff
                cube(.034, .051, f0 - .062, f0 - .052, zc - .07, zc + .02, bev=.004, seg=2, teil=2.), cyl(.0425, f0 - .026, zc + .13, .0095, .012, teil=2.)]       # Hebel, Schloss
    o = join(parts, nm); origin(o, (s * (W / 2 - .002), f0 - .012, dh0)); PARTS.append(o)
for o in PARTS: o.data.polygons.foreach_set('use_smooth', [False] * len(o.data.polygons))
for o in PARTS:  # glatt schattieren bis 35°, darüber kantig (Blech)
  sel([o]);
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
  if (tl == 1) { c = color(.025, .024, .023); r = .78; m = 0; }
  if (tl == 2) { c = color(.55, .55, .53) * (.8 + .2 * n1); r = .25 + .1 * n2; m = 1; c = mix(c, color(.2, .18, .15), cav * .6); }
  if (tl == 3) { c = color(.5, .5, .48); r = .3; m = 1; }
  if (tl == 4) { c = color(.45, .42, .36) * (.9 + .1 * n1); r = .7; m = 0; }   // leeres Schildfenster (Pappe hinter Zelluloid, ohne Schrift)
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
sel(PARTS); path = os.path.join(OUT, '%s_%s.glb' % (TYP, VAR))
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_animations=False, export_image_format='AUTO', export_normals=True)
info = dict(typ=TYP, var=VAR, tris=tris, teile=[o.name for o in PARTS], tex=TEX, kb=round(os.path.getsize(path) / 1024), s=round(time.time() - T0, 1))
json.dump(info, open(os.path.join(OUT, '%s_%s.json' % (TYP, VAR)), 'w')); print('FERTIG', json.dumps(info), flush=True)
