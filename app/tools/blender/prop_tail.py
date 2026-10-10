# Backteil von prop_lib.py (wird per exec ausgeführt; Platzhalter = Teil-Zuordnung aus dem Bauskript)
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
@@TEIL@@  float dents = 0; { point q = p * 4.5; float d = 1e9; point best = q; point fq = floor(q);
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
sel(PARTS); path = os.path.join(OUT, NAME + '.glb')
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_animations=False, export_image_format='AUTO', export_normals=True)
info = dict(typ=TYP, var=VAR, tris=tris, teile=[o.name for o in PARTS], tex=TEX, kb=round(os.path.getsize(path) / 1024), s=round(time.time() - T0, 1))
json.dump(info, open(os.path.join(OUT, NAME + '.json'), 'w')); print('FERTIG', json.dumps(info), flush=True)
