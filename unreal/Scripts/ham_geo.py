"""Geometrie-Werkstatt: baut per Geometry Script zusammengeführte Meshes (Einheiten: cm)."""
import math, random, unreal

GP = unreal.GeometryScript_Primitives
EAL = unreal.EditorAssetLibrary
OPTS = unreal.GeometryScriptPrimitiveOptions()
BASE = unreal.GeometryScriptPrimitiveOriginMode.BASE
CENTER = unreal.GeometryScriptPrimitiveOriginMode.CENTER
_new_asset = None
for cn in ('GeometryScript_NewAssetUtils', 'GeometryScript_AssetUtils', 'GeometryScript_CreateNewAssetUtils'):
    c = getattr(unreal, cn, None)
    if c and hasattr(c, 'create_new_static_mesh_asset_from_mesh'): _new_asset = c.create_new_static_mesh_asset_from_mesh; break

def xf(x=0., y=0., z=0., yaw=0., pitch=0., roll=0., s=(1, 1, 1)):
    return unreal.Transform(location=unreal.Vector(x, y, z), rotation=unreal.Rotator(roll=roll, pitch=pitch, yaw=yaw), scale=unreal.Vector(*s))

def bx(m, x, y, z, dx, dy, dz, yaw=0., pitch=0., roll=0., origin=CENTER, mat=0):
    o = unreal.GeometryScriptPrimitiveOptions(); o.set_editor_property('material_id', mat)
    GP.append_box(m, o, xf(x, y, z, yaw, pitch, roll), dx, dy, dz, 0, 0, 0, origin)

def sph(m, x, y, z, r, sx=1., sy=1., sz=1., steps=10, mat=0):
    o = unreal.GeometryScriptPrimitiveOptions(); o.set_editor_property('material_id', mat)
    GP.append_sphere_lat_long(m, o, xf(x, y, z, s=(sx, sy, sz)), r, steps, steps, CENTER)

def cap(m, x, y, z, r, h, yaw=0., pitch=0., roll=0., mat=0):
    o = unreal.GeometryScriptPrimitiveOptions(); o.set_editor_property('material_id', mat)
    GP.append_capsule(m, o, xf(x, y, z, yaw, pitch, roll), r, h, 6, 8, 0, CENTER)

def cyl(m, x, y, z, r, h, yaw=0., pitch=0., roll=0., steps=10, mat=0):
    o = unreal.GeometryScriptPrimitiveOptions(); o.set_editor_property('material_id', mat)
    GP.append_cylinder(m, o, xf(x, y, z, yaw, pitch, roll), r, h, steps, 0, True, BASE)

def save(m, path, nanite=False, collision=False):
    if EAL.does_asset_exist(path): EAL.delete_asset(path)
    o = unreal.GeometryScriptCreateNewStaticMeshAssetOptions()
    o.set_editor_property('enable_nanite', nanite); o.set_editor_property('enable_collision', collision)
    o.set_editor_property('enable_recompute_normals', True); o.set_editor_property('enable_recompute_tangents', True)
    r = _new_asset(m, path, o)
    sm = r[0] if isinstance(r, tuple) else r
    if not sm: sm = unreal.load_asset(path)
    return sm

def segment(m, a, b, t, mat=0):
    """Dünner Balken von Punkt a nach b (Liste x,y,z), Dicke t."""
    dx, dy, dz = b[0] - a[0], b[1] - a[1], b[2] - a[2]; L = math.sqrt(dx * dx + dy * dy + dz * dz)
    if L < .01: return
    yaw = math.degrees(math.atan2(dy, dx)); pitch = math.degrees(math.atan2(dz, math.hypot(dx, dy)))
    bx(m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, L, t, t, yaw, pitch, 0, CENTER, mat)

# ------------------------------------------------------------------ Bauteile
def picket_fence(path, length_cm, seed=1):
    random.seed(seed); m = unreal.DynamicMesh()
    step = 14.
    n = int(length_cm // step)
    for i in range(n):
        if random.random() < .04: continue                      # fehlende Latte
        h = 92 + random.uniform(-4, 3); tilt = random.uniform(-2.5, 2.5) + (random.uniform(-7, 7) if random.random() < .06 else 0)
        x = i * step + step / 2
        bx(m, x, 0, 0, 9, 2, h, 0, 0, tilt, BASE)
        bx(m, x, 0, h - 1.5, 6.4, 2, 6.4, 0, 0, 45 + tilt, CENTER)       # Spitze
    for z in (24, 70): bx(m, length_cm / 2, -2.5, z, length_cm, 3.5, 7, 0, 0, 0, CENTER)
    for x in range(0, int(length_cm) + 1, 240): bx(m, min(x, length_cm - 5), -3, 0, 9, 9, 108, 0, 0, 0, BASE)
    return save(m, path, nanite=True, collision=True)

def wire_span(m, a, b, sag, t=1.4, segs=18, mat=0):
    pts = []
    for i in range(segs + 1):
        u = i / segs; pts.append((a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u - sag * 4 * u * (1 - u)))
    for i in range(segs): segment(m, pts[i], pts[i + 1], t, mat)

def power_line(path, xs, y, top=820.):
    m = unreal.DynamicMesh()
    for x in xs:
        cyl(m, x, y, 0, 13, top + 40, steps=10, mat=0)
        bx(m, x, y, top, 12, 220, 12, 0, 0, 0, CENTER, 0)
        for o in (-90, 0, 90): cyl(m, x, y + o, top + 6, 4, 14, steps=8, mat=1)
    for i in range(len(xs) - 1):
        for o in (-90, 0, 90): wire_span(m, (xs[i], y + o, top + 20), (xs[i + 1], y + o, top + 20), 85, mat=2)
    return save(m, path, nanite=False, collision=False)

def crow(path, spread=False, radius=0.):
    m = unreal.DynamicMesh(); X = radius
    if spread:
        cap(m, X, 0, 0, 5.5, 16, 0, 0, 90)              # Körper entlang Y (Flugrichtung)
        sph(m, X, 11, 3, 4.5); segment(m, (X, 15, 3), (X, 22, 2), 2.2)
        bx(m, X, -13, -1, 7, 10, 1)
        for s in (-1, 1): bx(m, X + s * 17, 0, 1, 26, 11, .8, 0, 0, s * 6)
    else:
        cap(m, -7, 0, 2, 6, 16, 0, 78, 0)                # Körper, leicht schräg
        sph(m, 0, 0, 11, 4.8); segment(m, (3.5, 0, 11), (10, 0, 10), 2.4)
        bx(m, -19, 0, -2, 12, 6, 1.2, 0, -18, 0)
        for s in (-1, 1): segment(m, (-5, s * 2, -3), (-5, s * 2, -11), .8)
    return save(m, path)

def rat(path):
    m = unreal.DynamicMesh()
    sph(m, 0, 0, 5, 7, 1.6, 1., .8)
    sph(m, 10, 0, 5, 4, 1.4, .9, .9); segment(m, (14, 0, 5), (17.5, 0, 4), 2)
    for s in (-1, 1): sph(m, 9, s * 3, 9, 1.8, .5, 1, 1)
    segment(m, (-10, 0, 4), (-24, 3, 1.5), 1.1); segment(m, (-24, 3, 1.5), (-34, -2, .8), .8)
    for x in (-5, 6):
        for s in (-1, 1): segment(m, (x, s * 4, 2), (x + 1, s * 5, 0), 1.2)
    return save(m, path)

def spider(path, size=1.):
    m = unreal.DynamicMesh(); k = size
    sph(m, -1.5 * k, 0, 1.4 * k, 1.5 * k, 1.3, 1, .9); sph(m, .8 * k, 0, 1.2 * k, .9 * k)
    for s in (-1, 1):
        for i in range(4):
            a = math.radians(-60 + i * 38)
            kx, ky = math.sin(a) * 2.6 * k, s * math.cos(a) * 2.6 * k
            fx, fy = math.sin(a) * 5.2 * k, s * math.cos(a) * 5.4 * k
            segment(m, (.3 * k, 0, 1.3 * k), (kx, ky, 2.6 * k), .22 * k); segment(m, (kx, ky, 2.6 * k), (fx, fy, 0), .18 * k)
    return save(m, path)

def cobweb(path, size=60., spokes=11, rings=7, seed=3):
    """Flaches Netz in der XZ-Ebene, Ursprung in der Ecke."""
    random.seed(seed); m = unreal.DynamicMesh(); t = .12
    ang = [math.radians(5 + i * (80 / (spokes - 1)) + random.uniform(-3, 3)) for i in range(spokes)]
    tips = [(math.cos(a) * size * random.uniform(.85, 1.05), 0, math.sin(a) * size * random.uniform(.85, 1.05)) for a in ang]
    for p in tips: segment(m, (0, 0, 0), p, t)
    for r in range(1, rings + 1):
        f = r / (rings + 1) * random.uniform(.93, 1.05)
        for i in range(spokes - 1):
            a, b = tips[i], tips[i + 1]
            segment(m, (a[0] * f, random.uniform(-.4, .4), a[2] * f), (b[0] * f * random.uniform(.96, 1.02), random.uniform(-.4, .4), b[2] * f), t * .8)
    for _ in range(3):  # lose Fäden
        a = random.choice(tips); segment(m, a, (a[0] * .5 + random.uniform(-8, 8), 0, a[2] * .5 - random.uniform(10, 25)), t * .7)
    return save(m, path)

def figure(path, height=186., thin=1.):
    m = unreal.DynamicMesh(); k = height / 186.
    for s in (-1, 1): cap(m, 0, s * 9 * k, 46 * k, 6.5 * k * thin, 86 * k, 0, 0, s * 2)
    cap(m, 0, 0, 118 * k, 16 * k * thin, 62 * k)
    for s in (-1, 1): cap(m, 1, s * 22 * k, 104 * k, 4.5 * k * thin, 86 * k, 0, -4, s * 5)
    cyl(m, 0, 0, 148 * k, 5 * k, 12 * k)
    sph(m, 2 * k, 1.5 * k, 170 * k, 10.5 * k, 1, .9, 1.2)
    return save(m, path)

def moth_swarm(path, count=16, seed=5):
    random.seed(seed); m = unreal.DynamicMesh()
    for i in range(count):
        r = 32 + i * 4.3 + random.uniform(-.6, .6)   # je Motte eigener Radius (4-cm-Raster im Shader)
        a = random.uniform(0, math.tau); z = random.uniform(-45, 35)
        x, y = math.cos(a) * r, math.sin(a) * r; yaw = math.degrees(a) + 90
        for s in (-1, 1): bx(m, x + math.cos(math.radians(yaw + 90)) * s * 1.1, y + math.sin(math.radians(yaw + 90)) * s * 1.1, z, 1.8, 2.4, .15, yaw, 0, s * 25)
    return save(m, path)

def rain_tile(path, size=4000., drops=3200, seed=9):
    random.seed(seed); m = unreal.DynamicMesh()
    for _ in range(drops):
        bx(m, random.uniform(0, size), random.uniform(0, size), 0, .35, .35, random.uniform(22, 38), 0, 0, 0, BASE)
    return save(m, path)

def leaf_strip(path, length=2400., width=900., n=420, seed=11):
    random.seed(seed); m = unreal.DynamicMesh()
    for _ in range(n): bx(m, random.uniform(0, 400), random.uniform(0, width), .6, 7, 6, .2, random.uniform(0, 360), random.uniform(-15, 15), random.uniform(-15, 15))
    return save(m, path)

def mailbox(path):
    m = unreal.DynamicMesh()
    bx(m, 0, 0, 0, 9, 9, 108, 0, 0, 0, BASE, 0)
    bx(m, 0, 0, 120, 48, 24, 26, 0, 0, 0, CENTER, 1)
    cyl(m, 0, -12.5, 120, 12, 48, 0, 0, 90, 12, 1)
    bx(m, 6, 13, 128, 2, 2, 18, 0, 0, 0, CENTER, 2)
    return save(m, path, collision=True)

def gutter(m, x0, x1, y, z):
    segment(m, (x0, y, z), (x1, y, z), 9)

def town_sign(path):
    m = unreal.DynamicMesh()
    for s in (-1, 1): cyl(m, 0, s * 75, 0, 4, 250, steps=8, mat=0)
    bx(m, 0, 0, 205, 3, 170, 85, 0, 0, 0, CENTER, 1)
    return save(m, path, collision=True)
