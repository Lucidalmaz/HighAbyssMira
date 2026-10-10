# Item-Modelle fuer das Inventar (Nutzerauftrag 10.10.2026): Kleinteile, die es nirgends frei gibt (Umschlag, Brief, Fahrkarte, Muenze, Murmel, Ring, Glocke, Kreide, Halsband,
# Handy, Autoschluessel, Folie, Plombe, Kronkorken, Riemen, Schnalle, Riegel, Dienstnadel, Polaroid, Kiffen-Zubehoer). Alle ohne Schrift/Aufkleber (nur Material).
#   blend_run.ps1 item_bau.py "<Ausgabeordner> [name ...]" <log>
# Materialien: Principled BSDF; Papier-/Leder-/Metallmaserung als kleine Rauschtexturen (numpy), eingebettet im GLB; Groesse jeweils in Metern.
import bpy, bmesh, sys, os, math, random
import numpy as np
from mathutils import Vector, Matrix

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = ARGS[0] if ARGS else os.path.abspath('.')
ONLY = set(ARGS[1:])
rng = np.random.default_rng(7)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

# ---------------------------------------------------------------- Texturen (kleine Rauschkarten, keine Schrift)
def noise(w, h, scale, octaves=4):
    out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0
    for o in range(octaves):
        g = max(2, int(scale * (2 ** o)))
        base = rng.random((g + 1, g + 1)).astype(np.float32)
        xs = np.linspace(0, g, w, endpoint=False); ys = np.linspace(0, g, h, endpoint=False)
        x0 = xs.astype(int); y0 = ys.astype(int); fx = (xs - x0)[None, :]; fy = (ys - y0)[:, None]
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
        a = base[y0][:, x0]; b = base[y0][:, x0 + 1]; c = base[y0 + 1][:, x0]; d = base[y0 + 1][:, x0 + 1]
        out += amp * (a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy); tot += amp; amp *= .5
    return out / tot

def make_image(name, arr, srgb=True):
    h, w = arr.shape[:2]
    img = bpy.data.images.new(name, w, h, alpha=False)
    rgba = np.ones((h, w, 4), np.float32)
    if arr.ndim == 2: rgba[..., 0] = rgba[..., 1] = rgba[..., 2] = arr
    else: rgba[..., :3] = arr[..., :3]
    img.pixels.foreach_set(np.clip(rgba, 0, 1).ravel()); img.pack()
    img.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'
    return img

def normal_from_height(h, strength=2.0):
    gx = np.roll(h, -1, 1) - np.roll(h, 1, 1); gy = np.roll(h, -1, 0) - np.roll(h, 1, 0)
    nx = -gx * strength; ny = -gy * strength; nz = np.ones_like(h)
    l = np.sqrt(nx * nx + ny * ny + nz * nz); return np.stack([nx / l * .5 + .5, ny / l * .5 + .5, nz / l * .5 + .5], -1)

def tex_paper(name, tint=(0.86, 0.80, 0.66), stain=.5, fibre=1.0, size=512):
    n1 = noise(size, size, 6); n2 = noise(size, size, 40, 3); n3 = noise(size, size, 3)
    v = .90 + .10 * (n2 - .5) * fibre + .16 * (n1 - .5) * stain - .12 * np.clip(n3 - .62, 0, 1) * 2 * stain
    col = np.stack([tint[0] * v, tint[1] * v, tint[2] * v * (1 - .05 * stain * (n1 - .5))], -1)
    return make_image(name, col), make_image(name + '_n', normal_from_height(n2 * .6 + n1 * .4, 6.0), False)

def tex_leather(name, tint=(.28, .16, .09), size=512):
    n1 = noise(size, size, 14, 3); n2 = noise(size, size, 70, 2); n3 = noise(size, size, 4)
    v = .75 + .35 * n1 * (.6 + .4 * n2) + .15 * (n3 - .5)
    col = np.stack([tint[0] * v, tint[1] * v, tint[2] * v], -1)
    return make_image(name, col), make_image(name + '_n', normal_from_height(n1 * (.5 + n2), 10.0), False)

def tex_metal(name, tint=(.62, .52, .30), wear=.5, size=512):
    n1 = noise(size, size, 8, 4); n2 = noise(size, size, 60, 2); n3 = noise(size, size, 3)
    v = .85 + .2 * (n1 - .5) * wear + .08 * (n2 - .5) - .25 * np.clip(n3 - .6, 0, 1) * wear
    col = np.stack([tint[0] * v, tint[1] * v, tint[2] * v], -1)
    r = np.clip(.35 + .4 * wear * n1 + .1 * n2, .15, .95)
    return make_image(name, col), make_image(name + '_r', r, False)

# ---------------------------------------------------------------- Material
def mat(name, color=(.8, .8, .8), rough=.6, metal=0.0, base=None, normal=None, rmap=None, alpha=None, ior=1.45, spec=.5, trans=0.0, scale=(1, 1)):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (*color, 1); bs.inputs['Roughness'].default_value = rough; bs.inputs['Metallic'].default_value = metal
    try: bs.inputs['Transmission Weight'].default_value = trans
    except Exception: pass
    if base is not None:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = base; nt.links.new(t.outputs['Color'], bs.inputs['Base Color'])
    if normal is not None:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = normal; nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = .6
        nt.links.new(t.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], bs.inputs['Normal'])
    if rmap is not None:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = rmap; nt.links.new(t.outputs['Color'], bs.inputs['Roughness'])
    return m

def set_mat(o, m):
    o.data.materials.clear(); o.data.materials.append(m)

def finish(o, m, smooth=True, bevel=None):
    set_mat(o, m)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    if smooth: bpy.ops.object.shade_smooth()
    return o

def uv_box(o, scale=1.0):
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.cube_project(cube_size=scale); bpy.ops.object.mode_set(mode='OBJECT')

def prim_cube(name, size, loc=(0, 0, 0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.active_object; o.name = name; o.scale = size; bpy.ops.object.transform_apply(scale=True)
    if bevel: add_bevel(o, bevel)
    return o

def add_bevel(o, w, seg=3):
    m = o.modifiers.new('bev', 'BEVEL'); m.width = w; m.segments = seg; m.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='bev')

def prim_cyl(name, r, h, loc=(0, 0, 0), seg=48, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=seg, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name; return o

def prim_torus(name, R, r, loc=(0, 0, 0), rot=(0, 0, 0), ms=48, mi=16):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=ms, minor_segments=mi, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name; return o

def prim_sphere(name, r, loc=(0, 0, 0), seg=48, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=rings, location=loc); o = bpy.context.active_object; o.name = name; return o

def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join(); o = bpy.context.active_object; o.name = name; return o

def boolean(a, b, op='DIFFERENCE'):
    m = a.modifiers.new('b', 'BOOLEAN'); m.operation = op; m.object = b; m.solver = 'EXACT'
    bpy.context.view_layer.objects.active = a; bpy.ops.object.modifier_apply(modifier='b'); bpy.data.objects.remove(b, do_unlink=True)

def export(name, objs=None):
    d = os.path.join(OUT, 'it_' + name); os.makedirs(d, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    objs = objs or [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in objs: o.select_set(True)
    tris = 0
    for o in objs:
        tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
    bpy.ops.export_scene.gltf(filepath=os.path.join(d, 'model.glb'), export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_image_format='JPEG', export_jpeg_quality=88)
    print('MODELL', name, 'Dreiecke', tris)

def wob(o, amt=.002, scale=3, seed=1):
    """leichte Unregelmaessigkeit der Oberflaeche (Handarbeit, Alter)"""
    rs = np.random.default_rng(seed)
    for v in o.data.vertices:
        v.co += Vector(rs.normal(0, amt, 3))

# ---------------------------------------------------------------- Modelle
def build_umschlag():
    """brauner Umschlag, DIN lang gefaltet, Klappe geschlossen, leicht abgegriffen"""
    reset(); W, H = .22, .11
    bm = bmesh.new()
    # Koerper als flache Schachtel mit minimaler Dicke, Rueckklappe als abgesetzte Dreiecksflaeche
    bmesh.ops.create_cube(bm, size=1); bmesh.ops.scale(bm, vec=(W, H, .004), verts=bm.verts)
    me = bpy.data.meshes.new('umschlag'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('umschlag', me); bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    # Klappe: Prisma (Dreieck) auf der Vorderseite
    bm2 = bmesh.new()
    pts = [(-W / 2, H / 2, .0035), (W / 2, H / 2, .0035), (0, -.012, .0035)]
    v = [bm2.verts.new(p) for p in pts] + [bm2.verts.new((p[0], p[1], p[2] + .0016)) for p in pts]
    bm2.faces.new(v[:3][::-1]); bm2.faces.new(v[3:])
    for i in range(3): bm2.faces.new((v[i], v[(i + 1) % 3], v[3 + (i + 1) % 3], v[3 + i]))
    me2 = bpy.data.meshes.new('klappe'); bm2.to_mesh(me2); bm2.free()
    k = bpy.data.objects.new('klappe', me2); bpy.context.scene.collection.objects.link(k)
    o = join([o, k], 'umschlag'); add_bevel(o, .0012, 2); uv_box(o, .3)
    base, nrm = tex_paper('um', (.68, .52, .34), stain=.9, fibre=1.2)
    finish(o, mat('Umschlag', (.7, .55, .36), .9, 0, base, nrm)); o.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True); export('umschlag')

def build_brief():
    """gefaltetes Blatt (Dreifachfalz), vergilbt"""
    reset(); W, H = .21, .099; segs = 3
    objs = []
    for i in range(segs):
        o = prim_cube('f%d' % i, (W, H, .0009), (0, 0, .0009 * i * 1.5)); add_bevel(o, .0004, 1); objs.append(o)
    base, nrm = tex_paper('br', (.86, .79, .62), stain=1.0)
    for i, o in enumerate(objs): o.rotation_euler = (0, 0, math.radians((i - 1) * 1.8)); o.location.y = (i - 1) * .0006
    o = join(objs, 'brief'); uv_box(o, .25); finish(o, mat('Brief', (.85, .78, .6), .95, 0, base, nrm), smooth=False)
    o.rotation_euler = (math.radians(90), 0, 0); bpy.ops.object.transform_apply(rotation=True); export('brief')

def build_blatt():
    """gefaltetes Blatt: zwei Lagen, zerknittert - Zettel / Notiz"""
    reset(); bpy.ops.mesh.primitive_grid_add(x_subdivisions=10, y_subdivisions=14, size=1); o = bpy.context.active_object; o.name = 'blatt'
    o.scale = (.148, .21, 1); bpy.ops.object.transform_apply(scale=True)
    rs = np.random.default_rng(3)
    for v in o.data.vertices:
        x, y = v.co.x, v.co.y
        v.co.z = .0015 * math.sin(x * 38 + y * 11) + .0012 * math.sin(y * 52 - x * 19) + (rs.random() - .5) * .0006 + .004 * (abs(x) / .074) ** 3
    sol = o.modifiers.new('s', 'SOLIDIFY'); sol.thickness = .0003; bpy.ops.object.modifier_apply(modifier='s')
    base, nrm = tex_paper('bl', (.88, .84, .72), stain=.8); uv_box(o, .3)
    finish(o, mat('Blatt', (.88, .84, .72), .92, 0, base, nrm)); o.rotation_euler = (math.radians(90), 0, 0); bpy.ops.object.transform_apply(rotation=True)
    export('blatt')

def build_fahrkarte():
    """Kartonfahrkarte (Edmondson-Format 57 x 30,5 mm), Ecken leicht gestossen"""
    reset(); o = prim_cube('ticket', (.057, .0305, .0007)); add_bevel(o, .0003, 1)
    base, nrm = tex_paper('ft', (.80, .72, .50), stain=.9, fibre=.7); uv_box(o, .06)
    finish(o, mat('Karton', (.8, .72, .5), .85, 0, base, nrm), smooth=False); wob(o, .00012); o.rotation_euler = (math.radians(90), 0, 0); bpy.ops.object.transform_apply(rotation=True); export('fahrkarte')

def build_muenze():
    """Euro-Muenze (1 EUR: 23,25 mm, Zweifarbigkeit Kern/Ring), ohne Praegung"""
    reset(); o1 = prim_cyl('ring', .01163, .00233, seg=64, rot=(math.radians(90), 0, 0)); o2 = prim_cyl('kern', .0085, .00240, seg=64, rot=(math.radians(90), 0, 0))
    for o in (o1, o2): add_bevel(o, .0003, 2); bpy.ops.object.shade_smooth()
    t1, r1 = tex_metal('mr', (.82, .82, .84), .6); t2, r2 = tex_metal('mk', (.80, .66, .30), .6)
    set_mat(o1, mat('Muenze_Ring', (.8, .8, .82), .35, 1, t1, None, r1)); set_mat(o2, mat('Muenze_Kern', (.8, .66, .3), .3, 1, t2, None, r2))
    for o in (o1, o2): uv_box(o, .03)
    export('muenze')

def build_murmel():
    """milchweisse Glasmurmel: glatt, schwach durchscheinend"""
    reset(); o = prim_sphere('murmel', .0085, seg=64, rings=32); bpy.ops.object.shade_smooth()
    m = mat('Glas', (.93, .93, .90), .16, 0)
    set_mat(o, m); export('murmel')

def build_ring():
    """schlichter Ring, Gold, leicht abgetragen"""
    reset(); o = prim_torus('ring', .0095, .0016, ms=64, mi=24, rot=(math.radians(90), 0, 0)); o.scale = (1, 1, 1.15)
    bpy.ops.object.transform_apply(scale=True); bpy.ops.object.shade_smooth(); wob(o, .00004)
    t, r = tex_metal('rg', (.86, .68, .27), .5); uv_box(o, .03); set_mat(o, mat('Gold', (.88, .70, .28), .22, 1, t, None, r)); export('ring')

def build_glocke():
    """kleine Handglocke aus Messing mit Holzgriff"""
    reset()
    prof = [(0, .068), (.012, .066), (.030, .058), (.052, .045), (.066, .032), (.076, .024), (.084, .0), ]
    bm = bmesh.new(); seg = 56; rings = []
    pts = [(.0, .092), (.008, .090), (.024, .084), (.044, .070), (.062, .052), (.074, .038), (.080, .030), (.083, .026)]  # (r, y) Aussenprofil von oben (Kuppe) nach unten
    pts = [(r, y) for r, y in pts]
    outer = [(.0, .092), (.012, .090), (.026, .082), (.04, .066), (.052, .046), (.062, .026), (.070, .006), (.0745, -.004), (.074, -.008)]
    inner = [(r - .003, y - .001) for r, y in reversed(outer[1:])]
    prof = outer + inner[:-1] + [(.0, .088)] if False else outer + [(r - .0035, y) for r, y in reversed(outer[2:])] + [(.0, .084)]
    verts = []
    for ring in prof:
        row = []
        for i in range(seg):
            a = 2 * math.pi * i / seg; row.append(bm.verts.new((ring[0] * math.cos(a), ring[0] * math.sin(a), ring[1])))
        verts.append(row)
    for j in range(len(prof) - 1):
        for i in range(seg):
            try: bm.faces.new((verts[j][i], verts[j][(i + 1) % seg], verts[j + 1][(i + 1) % seg], verts[j + 1][i]))
            except ValueError: pass
    me = bpy.data.meshes.new('glocke'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('glocke', me); bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; bpy.ops.object.shade_smooth()
    g = prim_cyl('griff', .011, .07, (0, 0, .125), seg=24); add_bevel(g, .003, 2)
    kn = prim_sphere('knopf', .016, (0, 0, .165), 24, 12)
    kl = prim_sphere('klöppel', .012, (0, 0, -.002), 24, 12)
    t, r = tex_metal('gl', (.80, .62, .24), .7); tw, rw = tex_leather('gw', (.30, .17, .08))
    set_mat(o, mat('Messing', (.82, .64, .26), .28, 1, t, None, r)); set_mat(kl, mat('Messing2', (.82, .64, .26), .3, 1))
    for q in (g, kn): set_mat(q, mat('Holz', (.28, .17, .09), .6, 0, tw, None))
    for q in (o, g, kn, kl): uv_box(q, .2)
    export('glocke')

def build_kreide():
    """Stueck weisse Strassenkreide, angebrochen"""
    reset(); o = prim_cyl('kreide', .0075, .075, seg=24, rot=(math.radians(90), 0, 0)); add_bevel(o, .001, 2); bpy.ops.object.shade_smooth()
    wob(o, .0003, seed=4)
    base = make_image('kr', np.stack([np.clip(.9 + .08 * noise(256, 256, 20, 3), 0, 1)] * 3, -1))
    uv_box(o, .1); set_mat(o, mat('Kreide', (.92, .92, .9), .95, 0, base, None)); export('kreide')

def build_halsband():
    """Lederhalsband mit Messingschnalle und Marke"""
    reset(); R = .085
    bm = bmesh.new(); seg = 96; w = .028; t = .004
    top, bot = [], []
    for i in range(seg):
        a = 2 * math.pi * i / seg; x, y = R * math.cos(a), R * math.sin(a)
        top.append(bm.verts.new((x, y, w / 2))); bot.append(bm.verts.new((x, y, -w / 2)))
    outer_t, outer_b = [], []
    for i in range(seg):
        a = 2 * math.pi * i / seg; x, y = (R + t) * math.cos(a), (R + t) * math.sin(a)
        outer_t.append(bm.verts.new((x, y, w / 2))); outer_b.append(bm.verts.new((x, y, -w / 2)))
    for i in range(seg):
        j = (i + 1) % seg
        for quad in ((top[i], top[j], outer_t[j], outer_t[i]), (bot[j], bot[i], outer_b[i], outer_b[j]), (top[j], top[i], bot[i], bot[j]), (outer_t[i], outer_t[j], outer_b[j], outer_b[i])):
            bm.faces.new(quad)
    me = bpy.data.meshes.new('band'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('band', me); bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; add_bevel(o, .0012, 2); bpy.ops.object.shade_smooth()
    # Schnalle
    sn = prim_torus('schnalle', .014, .0018, (R + .006, 0, 0), rot=(0, math.radians(90), 0)); sn.scale = (1, 1.15, 1); bpy.ops.object.transform_apply(scale=True)
    # Marke
    mk = prim_cyl('marke', .016, .0025, (-R - .008, 0, -.012), seg=48, rot=(0, math.radians(90), 0)); add_bevel(mk, .0005, 2)
    ose = prim_torus('oese', .005, .0013, (-R - .004, 0, .004), rot=(math.radians(90), 0, 0))
    tl, nl = tex_leather('hb', (.42, .08, .06)); tm, rm = tex_metal('hm', (.82, .64, .26), .6)
    uv_box(o, .2); set_mat(o, mat('Leder', (.42, .08, .06), .55, 0, tl, nl))
    for q in (sn, mk, ose): uv_box(q, .06); set_mat(q, mat('Messing', (.82, .64, .26), .3, 1, tm, None, rm))
    export('halsband')

def build_handy():
    """aelteres Smartphone, schwarz, Display dunkel (kein Inhalt)"""
    reset(); o = prim_cube('korpus', (.067, .139, .0078)); add_bevel(o, .006, 4); bpy.ops.object.shade_smooth()
    disp = prim_cube('display', (.0615, .128, .0004), (0, 0, .0040)); add_bevel(disp, .004, 3)
    cam = prim_cyl('kamera', .0028, .0006, (.02, .058, -.0040), seg=24)
    set_mat(o, mat('Gehaeuse', (.05, .05, .055), .35, .6)); set_mat(disp, mat('Glas', (.012, .014, .02), .06, .0)); set_mat(cam, mat('Linse', (.02, .02, .03), .1, 0))
    for q in (o, disp, cam): uv_box(q, .15)
    bpy.ops.object.select_all(action='DESELECT'); export('handy')

def build_autoschluessel():
    """Autoschluessel mit Kunststoffgriff, Stahlbart, Ring"""
    reset()
    g = prim_cube('griff', (.032, .056, .0095), (0, .028, 0)); add_bevel(g, .006, 4); bpy.ops.object.shade_smooth()
    bart = prim_cube('bart', (.0075, .05, .0022), (0, -.025, 0)); add_bevel(bart, .0006, 2)
    for i in range(6): z = prim_cube('z%d' % i, (.0035, .004, .0024), (.0045 if i % 2 else -.0045, -.012 - i * .0065, 0)); bart = join([bart, z], 'bart')
    ring = prim_torus('ring', .011, .0009, (0, .066, 0), rot=(math.radians(90), 0, 0), mi=12)
    set_mat(g, mat('Kunststoff', (.04, .04, .05), .42, 0)); tm, rm = tex_metal('as', (.7, .7, .72), .6)
    for q in (bart, ring): uv_box(q, .1); set_mat(q, mat('Stahl', (.72, .72, .74), .28, 1, tm, None, rm))
    uv_box(g, .1); export('autoschluessel')

def build_folie():
    """zerknuelltes Stueck Alufolie / Kaugummipapier"""
    reset(); bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=.022); o = bpy.context.active_object; o.name = 'folie'
    rs = np.random.default_rng(11)
    nz = noise(64, 64, 6, 3)
    for v in o.data.vertices:
        d = v.co.normalized(); k = .55 + .9 * nz[int((d.y * .5 + .5) * 63), int((d.x * .5 + .5) * 63)] + (rs.random() - .5) * .35
        v.co = d * (.022 * k)
    bpy.ops.object.shade_flat(); t, r = tex_metal('fo', (.78, .78, .80), .8); uv_box(o, .08)
    set_mat(o, mat('Folie', (.8, .8, .82), .3, 1, t, None, r)); export('folie')

def build_plombe():
    """Bleiplombe: flache Scheibe, zwei Kanaele, Drahtschlaufe"""
    reset(); o = prim_cyl('plombe', .0105, .0035, seg=48, rot=(math.radians(90), 0, 0)); add_bevel(o, .0007, 2); bpy.ops.object.shade_smooth()
    d = prim_cyl('draht', .0006, .05, (0, 0, -.001), seg=8); dr = prim_torus('drahtring', .014, .0006, (0, 0, .02), rot=(math.radians(90), 0, 0), mi=8)
    tm, rm = tex_metal('pl', (.46, .47, .5), .9); uv_box(o, .03)
    set_mat(o, mat('Blei', (.5, .5, .53), .55, .9, tm, None, rm))
    for q in (d, dr): set_mat(q, mat('Draht', (.6, .6, .62), .4, 1))
    export('plombe')

def build_kronkorken():
    """gebuerteter Kronkorken, leicht verbeult"""
    reset(); bm = bmesh.new(); n = 21; r0, r1 = .0129, .0147
    top = []
    for i in range(n * 2):
        a = math.pi * i / n; r = r1 if i % 2 else r0; top.append((r * math.cos(a), r * math.sin(a), .0))
    ring_t = [bm.verts.new((x, y, .006)) for x, y, z in top]; ring_b = [bm.verts.new((x * 1.0, y * 1.0, 0)) for x, y, z in top]
    c = bm.verts.new((0, 0, .0062))
    for i in range(len(ring_t)):
        j = (i + 1) % len(ring_t)
        bm.faces.new((ring_b[i], ring_b[j], ring_t[j], ring_t[i])); bm.faces.new((ring_t[i], ring_t[j], c))
    me = bpy.data.meshes.new('kk'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('kronkorken', me); bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; add_bevel(o, .0004, 2); bpy.ops.object.shade_smooth(); wob(o, .00012, seed=3)
    tm, rm = tex_metal('kk', (.62, .12, .10), .8); uv_box(o, .04); set_mat(o, mat('Blech', (.6, .12, .1), .4, .8, tm, None, rm))
    o.rotation_euler = (math.radians(90), 0, 0); bpy.ops.object.transform_apply(rotation=True); export('kronkorken')

def build_riemen():
    """Ranzenriemen: Lederriemen mit Schnalle"""
    reset(); r = prim_cube('riemen', (.26, .028, .0036), (0, 0, 0)); add_bevel(r, .0012, 2)
    sn = prim_torus('schnalle', .018, .0022, (.095, 0, 0), rot=(0, 0, 0)); sn.scale = (.75, 1.15, 1); bpy.ops.object.transform_apply(scale=True)
    st = prim_cube('dorn', (.003, .028, .003), (.095, 0, .0035));
    for i in range(5): h = prim_cyl('loch%d' % i, .0025, .005, (-.06 - i * .02, 0, 0), seg=16); boolean(r, h)
    tl, nl = tex_leather('rm', (.24, .14, .08)); tm, rm = tex_metal('rs', (.7, .7, .72), .7)
    uv_box(r, .2); set_mat(r, mat('Leder', (.3, .17, .1), .6, 0, tl, nl))
    for q in (sn, st): uv_box(q, .06); set_mat(q, mat('Stahl', (.7, .7, .72), .35, 1, tm, None, rm))
    bpy.ops.object.shade_smooth(); export('riemen')

def build_riegel():
    """halber Eisenriegel (Tuerriegel, abgebrochen)"""
    reset(); st = prim_cyl('stange', .007, .17, seg=24, rot=(0, math.radians(90), 0)); add_bevel(st, .001, 2); bpy.ops.object.shade_smooth()
    gr = prim_cyl('knauf', .011, .02, (-.095, 0, 0), seg=24, rot=(0, math.radians(90), 0)); wob(st, .0004, seed=9)
    br = prim_cube('bruch', (.002, .0141, .0141), (.086, 0, 0))
    tm, rm = tex_metal('rv', (.30, .27, .25), 1.0)
    for q in (st, gr, br): uv_box(q, .12); set_mat(q, mat('Eisen', (.34, .3, .27), .7, .85, tm, None, rm))
    export('riegel')

def build_schnalle():
    """Schnalle vom Turm: rechteckige Messingschnalle mit Dorn"""
    reset(); a = prim_cube('r1', (.05, .006, .005), (0, .021, 0)); b = prim_cube('r2', (.05, .006, .005), (0, -.021, 0)); c = prim_cube('r3', (.006, .048, .005), (.022, 0, 0)); d = prim_cube('r4', (.006, .048, .005), (-.022, 0, 0))
    dorn = prim_cube('dorn', (.003, .044, .0038), (0, 0, .0006)); dorn.rotation_euler = (0, 0, math.radians(8))
    o = join([a, b, c, d, dorn], 'schnalle'); add_bevel(o, .0007, 2); bpy.ops.object.shade_smooth(); wob(o, .0002, seed=5)
    tm, rm = tex_metal('sn', (.74, .58, .26), .9); uv_box(o, .08); set_mat(o, mat('Messing', (.76, .6, .26), .38, 1, tm, None, rm)); export('schnalle')

def build_dienstnadel():
    """Dienstnadel: runde Anstecknadel, Messing, Nadel"""
    reset(); k = prim_cyl('kopf', .0095, .0025, seg=48, rot=(math.radians(90), 0, 0)); add_bevel(k, .0006, 2)
    r = prim_torus('rand', .0095, .0012, (0, 0, 0), rot=(math.radians(90), 0, 0))
    n = prim_cyl('nadel', .0005, .035, (0, 0, -.019), seg=8, rot=(math.radians(90), 0, 0)); n.rotation_euler = (math.radians(90), 0, 0); n.location = (0, .0, 0)
    n.location = (0, 0.0015, -.0); n.rotation_euler = (0, math.radians(90), 0); n.location = (0, .003, -.002)
    tm, rm = tex_metal('dn', (.78, .62, .28), .8); uv_box(k, .03)
    for q in (k, r, n): set_mat(q, mat('Messing', (.8, .64, .28), .3, 1, tm, None, rm))
    bpy.ops.object.shade_smooth(); export('dienstnadel')

def build_polaroid():
    """Sofortbild: Rahmen mit Bildflaeche (Foto wird im Spiel als Textur gesetzt, hier neutral-grau)"""
    reset(); W, H, T = .0885, .1075, .0008
    r = prim_cube('rahmen', (W, H, T)); add_bevel(r, .0005, 1)
    f = prim_cube('foto', (.0775, .0785, .0002), (0, .0105, T / 2 + .0001))
    base, nrm = tex_paper('po', (.93, .92, .88), stain=.3); gray = make_image('pofoto', np.stack([np.clip(.35 + .25 * noise(256, 256, 4, 3), 0, 1)] * 3, -1))
    uv_box(r, .12); uv_box(f, .08)
    set_mat(r, mat('Rahmen', (.93, .92, .88), .55, 0, base, nrm)); set_mat(f, mat('Foto', (.4, .4, .4), .35, 0, gray))
    export('polaroid')

def build_grinder():
    """Grinder: Aluminium-Puck mit Zaehnen, zweiteilig"""
    reset(); a = prim_cyl('teil1', .0215, .0125, (0, 0, .0063), seg=64); b = prim_cyl('teil2', .0215, .0125, (0, 0, -.0063), seg=64)
    for o in (a, b): add_bevel(o, .0012, 2); bpy.ops.object.shade_smooth()
    for k in range(20):
        ang = 2 * math.pi * k / 20; z = prim_cube('zahn', (.0015, .0015, .0016), (.016 * math.cos(ang), .016 * math.sin(ang), .0126))
    tm, rm = tex_metal('gr', (.30, .32, .36), .5)
    for o in (a, b): uv_box(o, .06); set_mat(o, mat('Alu', (.32, .34, .38), .35, 1, tm, None, rm))
    export('grinder')

def build_papes():
    """kleines Heft Zigarettenpapier (Blaettchen), gefaltet"""
    reset(); o = prim_cube('heft', (.068, .036, .0045)); add_bevel(o, .0006, 1)
    tp, np_ = tex_paper('pp', (.92, .90, .80), stain=.2, fibre=.6); uv_box(o, .08); set_mat(o, mat('Papier', (.92, .9, .8), .9, 0, tp, np_)); export('papes')

def build_knolle():
    """kleine getrocknete Knolle (Blueten-Klumpen), dunkelgruen"""
    reset(); bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=.012); o = bpy.context.active_object; o.name = 'knolle'
    rs = np.random.default_rng(21); nz = noise(64, 64, 8, 3)
    for v in o.data.vertices:
        d = v.co.normalized(); k = .65 + .7 * nz[int((d.y * .5 + .5) * 63), int((d.x * .5 + .5) * 63)] + (rs.random() - .5) * .25; v.co = d * (.012 * k)
    bpy.ops.object.shade_smooth(); base = make_image('kn', np.stack([.16 + .12 * noise(128, 128, 20, 3), .26 + .14 * noise(128, 128, 20, 3), .10 + .08 * noise(128, 128, 20, 3)], -1))
    uv_box(o, .04); set_mat(o, mat('Knolle', (.2, .3, .12), .85, 0, base, None)); export('knolle')

def build_tips():
    """aufgerollter Pappfilter (Tip), Karton"""
    reset(); o = prim_cyl('tip', .0035, .02, seg=24, rot=(math.radians(90), 0, 0)); hole = prim_cyl('h', .0022, .021, seg=24, rot=(math.radians(90), 0, 0)); boolean(o, hole)
    bpy.ops.object.shade_smooth(); tp, np_ = tex_paper('tp', (.78, .66, .46), stain=.5); uv_box(o, .03); set_mat(o, mat('Karton', (.78, .66, .46), .9, 0, tp, np_)); export('tips')

def loft(name, secs, ncirc=24, close_ends=True):
    """secs: Liste (x, halbbreite, hoehe, z0, huelle) -> Halbellipsen-Querschnitte (oben gewoelbt, unten flach) entlang x"""
    bm = bmesh.new(); rows = []
    for (x, w, h, z0, ex) in secs:
        row = []
        for i in range(ncirc + 1):
            t = math.pi * i / ncirc  # 0..pi: von +y ueber oben nach -y
            y = w * math.cos(t); z = z0 + h * (math.sin(t) ** ex)
            row.append(bm.verts.new((x, y, z)))
        rows.append(row)
    for j in range(len(rows) - 1):
        for i in range(ncirc):
            bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))
    # Boden (flach) und Stirnflaechen
    for j in range(len(rows) - 1):
        bm.faces.new((rows[j][ncirc], rows[j + 1][ncirc], rows[j + 1][0], rows[j][0]))
    if close_ends:
        for r in (rows[0], rows[-1]):
            try: bm.faces.new(r if r is rows[0] else r[::-1])
            except ValueError: pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o); bpy.context.view_layer.objects.active = o; o.select_set(True)
    return o

def build_schuh():
    """Kinderschuh, rechts: Lederschuh mit dunkler Gummisohle (Laenge 16 cm), Schaft offen am Knoechel, Zunge, Naht-Kante"""
    reset()
    # Sohle: flacher Umriss, 8 mm hoch, leicht ueberstehend
    sol = loft('sohle', [(-.080, .022, .000, 0, 1), (-.070, .029, .004, 0, 1), (-.040, .030, .008, 0, 1), (0, .027, .008, 0, 1), (.040, .030, .008, 0, 1), (.070, .029, .005, 0, 1), (.082, .018, .000, 0, 1)])
    sol.scale = (1, 1, 1); add_bevel(sol, .0015, 2)
    # Obermaterial: Ferse hoch, Spann niedrig, Kappe gerundet
    up = loft('schaft', [(-.078, .018, .026, .008, .8), (-.072, .026, .050, .008, .7), (-.050, .029, .064, .008, .65), (-.020, .027, .046, .008, .7), (.010, .024, .033, .008, .8), (.040, .024, .030, .008, .9), (.064, .021, .025, .008, 1.0), (.078, .013, .013, .008, 1.1)])
    # Oeffnung am Knoechel: Flaechen im Bereich entfernen, dann Wandstaerke
    bm = bmesh.new(); bm.from_mesh(up.data)
    dele = [f for f in bm.faces if ((f.calc_center_median().x + .050) / .032) ** 2 + (f.calc_center_median().y / .021) ** 2 < 1 and f.calc_center_median().z > .045]
    bmesh.ops.delete(bm, geom=dele, context='FACES'); bm.to_mesh(up.data); bm.free()
    sm = up.modifiers.new('s', 'SOLIDIFY'); sm.thickness = .0028; sm.offset = -1; bpy.context.view_layer.objects.active = up; bpy.ops.object.modifier_apply(modifier='s')
    add_bevel(up, .001, 2)
    # Zunge
    zu = prim_cube('zunge', (.016, .026, .0035), (-.010, 0, .043)); zu.rotation_euler = (0, math.radians(-30), 0); add_bevel(zu, .0012, 2)
    # Sohlenrand-Absatz (Ferse)
    ab = prim_cube('absatz', (.024, .046, .008), (-.066, 0, .0)); add_bevel(ab, .003, 2)
    tl, nl = tex_leather('sh', (.40, .26, .15)); tg, ng = tex_leather('sg', (.10, .10, .10))
    for q, m_ in ((up, mat('Leder', (.42, .28, .16), .5, 0, tl, None)), (zu, mat('Leder2', (.44, .30, .18), .5, 0, tl, None)), (sol, mat('Gummi', (.1, .1, .1), .8, 0, tg, ng)), (ab, mat('Gummi2', (.1, .1, .1), .8, 0, tg, ng))):
        uv_box(q, .2); set_mat(q, m_); bpy.context.view_layer.objects.active = q; bpy.ops.object.shade_smooth()
    export('schuh')

BUILD = [build_umschlag, build_brief, build_blatt, build_fahrkarte, build_muenze, build_murmel, build_ring, build_glocke, build_kreide, build_halsband, build_handy, build_autoschluessel,
         build_folie, build_plombe, build_kronkorken, build_riemen, build_riegel, build_schnalle, build_dienstnadel, build_polaroid, build_grinder, build_papes, build_knolle, build_tips, build_schuh]
for fn in BUILD:
    nm = fn.__name__[6:]
    if ONLY and nm not in ONLY: continue
    try: fn()
    except Exception as e:
        import traceback; print('FEHLER', nm, e); traceback.print_exc()
