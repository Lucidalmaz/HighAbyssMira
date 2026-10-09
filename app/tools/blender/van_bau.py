# Transporter (Kapitel 1, strasse.js): Fab „PostVan“ (3D SHOP, CC-BY) – nur die Form wird übernommen. Der Atlas (2048², flach blau/gelb mit Postaufdruck) wird umgefärbt
# (Lack silbergrau, kein Aufdruck) und zu einem vollständigen 2K-PBR-Satz ausgebaut: Albedo (mit Schmutzschleiern), Normal (Fugen, Sicken), ORM (AO, Rauheit, Metall).
# Scheiben getönt. Vorderseite +z (glTF), Meter.
#   blender --background --factory-startup --threads 2 --python van_bau.py -- <postvan.fbx> <ausgabe.glb>
import bpy, sys, numpy as np
SRC, DST = sys.argv[sys.argv.index('--') + 1:][:2]
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.fbx(filepath=SRC)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in meshes: mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
for o in [o for o in bpy.context.scene.objects if o.type != 'MESH']: bpy.data.objects.remove(o, do_unlink=True)
for o in meshes:
  o.data.polygons.foreach_set('use_smooth', [True] * len(o.data.polygons))
src = bpy.data.images['postvan_baseColor'] if 'postvan_baseColor' in bpy.data.images else next(i for i in bpy.data.images if i.size[0] == 2048)
N = src.size[0]; a = np.empty(N * N * 4, dtype=np.float32); src.pixels.foreach_get(a); a = a.reshape(N, N, 4)
r, g, b = a[..., 0], a[..., 1], a[..., 2]; L = .2126 * r + .7152 * g + .0722 * b
blue = (b > r * 1.7) & (b > g * 1.25) & (b > .02); yel = (r > .35) & (g > .25) & (b < r * .45)
paint = blue | yel
# weiche Maske, damit die Ränder nicht ausfransen
def blur(x, k=2):
  y = x.astype(np.float32)
  for _ in range(k): y = (y + np.roll(y, 1, 0) + np.roll(y, -1, 0) + np.roll(y, 1, 1) + np.roll(y, -1, 1)) / 5
  return y
pm = np.clip(blur(paint, 2) * 1.6 - .1, 0, 1)
ref = np.median(L[blue]) if blue.any() else .05
shade = np.clip(L / ref, .18, 1.0)  # Fugen/Sicken bleiben dunkel
shade = np.where(yel, 1.0, shade)
def vnoise(n, seed, octs=((8, .5), (32, .3), (128, .2))):
  rng = np.random.default_rng(seed); out = np.zeros((n, n), np.float32)
  for gs, w in octs:
    gr = rng.random((gs + 1, gs + 1)).astype(np.float32); xs = np.linspace(0, gs, n, endpoint=False); i = xs.astype(int); f = (xs - i).astype(np.float32); f = f * f * (3 - 2 * f)
    row = gr[i] * (1 - f)[:, None] + gr[i + 1] * f[:, None]; out += w * (row[:, i] * (1 - f)[None, :] + row[:, i + 1] * f[None, :])
  return out
n1 = vnoise(N, 1); n2 = vnoise(N, 2, ((4, .6), (16, .4)))
streak = vnoise(N, 3, ((6, .5), (24, .5)))  # Wasserläufer: in die Länge gezogen
yy = np.linspace(0, 1, N)[:, None]
grime = np.clip((n1 - .35) * 1.6, 0, 1) * .5 + np.clip((n2 - .5) * 2, 0, 1) * .35
paintcol = np.array([.52, .53, .52], np.float32)  # linear ≈ sRGB 0,66: silbergrauer Lack, gealtert
alb = a[..., :3].copy()
base = paintcol[None, None, :] * (shade * (.92 + .16 * n1))[..., None]
dirt = np.array([.10, .085, .065], np.float32)
base = base * (1 - grime[..., None] * .55) + dirt * grime[..., None] * .55
alb = alb * (1 - pm[..., None]) + base * pm[..., None]
# alle Teile leicht verstaubt
alb = alb * (1 - .12 * grime[..., None]) + dirt * .12 * grime[..., None]
# Rauheit/Metall/AO
dark = np.clip(1 - L / .35, 0, 1)
rough = np.where(pm > .5, .34 + grime * .45, np.clip(.88 - L * .6, .3, .92)).astype(np.float32)
metal = np.where(pm > .5, .18, 0.0).astype(np.float32)
ao = np.where(pm > .5, np.clip(.25 + .75 * shade, 0, 1), 1.0).astype(np.float32)
# Höhe für die Normalmap: Fugenlinien tief, sonst leichte Unruhe im Lack (Orangenhaut)
H = np.where(pm > .5, shade * 1.0, 1.0) + .02 * vnoise(N, 5, ((256, 1.0),))
H = blur(H, 1)
dx = (np.roll(H, -1, 1) - np.roll(H, 1, 1)) * 4.0; dy = (np.roll(H, -1, 0) - np.roll(H, 1, 0)) * 4.0
nz = np.ones_like(H); ln = np.sqrt(dx * dx + dy * dy + 1); nrm = np.stack([-dx / ln, -dy / ln, nz / ln], -1) * .5 + .5
def mk(name, rgb, colorspace):
  im = bpy.data.images.new(name, N, N, alpha=False, float_buffer=False); out = np.ones((N, N, 4), np.float32); out[..., :3] = np.clip(rgb, 0, 1)
  im.colorspace_settings.name = colorspace; im.pixels.foreach_set(out.ravel()); im.pack(); return im
iA = mk('van_albedo', alb, 'sRGB'); iN = mk('van_normal', nrm, 'Non-Color'); iO = mk('van_orm', np.stack([ao, rough, metal], -1), 'Non-Color')
mat = bpy.data.materials['postvan']; nt = mat.node_tree; nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputMaterial'); bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(bsdf.outputs[0], out.inputs[0])
def tex(im, x, y):
  t = nt.nodes.new('ShaderNodeTexImage'); t.image = im; t.location = (x, y); return t
ta = tex(iA, -600, 300); nt.links.new(ta.outputs[0], bsdf.inputs['Base Color'])
tn = tex(iN, -600, 0); nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.0; nt.links.new(tn.outputs[0], nm.inputs['Color']); nt.links.new(nm.outputs[0], bsdf.inputs['Normal'])
to = tex(iO, -600, -300); sp = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(to.outputs[0], sp.inputs[0]); nt.links.new(sp.outputs[1], bsdf.inputs['Roughness']); nt.links.new(sp.outputs[2], bsdf.inputs['Metallic'])
grp = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree'); grp.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
gn = nt.nodes.new('ShaderNodeGroup'); gn.node_tree = grp; nt.links.new(sp.outputs[0], gn.inputs['Occlusion'])
# Scheiben: getönt, glatt
w = bpy.data.materials['window']; w.use_nodes = True; wb = w.node_tree.nodes['Principled BSDF']; wb.inputs['Base Color'].default_value = (.012, .018, .02, 1); wb.inputs['Alpha'].default_value = .66; wb.inputs['Roughness'].default_value = .03
w.blend_method = 'BLEND'
print('INFO paint px', int(paint.sum()), 'ref', ref)
bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB', export_apply=True, export_yup=True, export_image_format='JPEG', export_jpeg_quality=92)
