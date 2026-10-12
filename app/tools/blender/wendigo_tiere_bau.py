# Wendigo-Formen auf Basis der Spieltiere animal_deerdoe / animal_deerstag (gleiches 31-Knochen-Skelett, Clips bleiben erhalten):
#   fleisch    geschältes Reh: Fell weg, rohe Muskulatur, Sehnen, Rippen, Wunde, Nässe (gebackene Texturen, kein Laufzeit-Shader nötig)
#   haut       haarlose, graue, nasse Haut, lose Falten, grobe Bauchnaht
#   reh        Reh in Fell + falsche Details (Morphs kopf_falsch, riss, knochen, maul_auf; Blutflecken als Vertexfarbe; Fleischschicht darunter)
#   hirsch     Hirsch mit Geweih + Baststreifen (Morphs wie reh + geweih_klein)
#   hirschding originale Wendigo-Hirsch-Gruselform (aufrecht, gestreckte Glieder, eigenes Geweih) – siehe wendigo_hirschding_bau.py
# Aufruf: blender -b --factory-startup --threads 4 -P wendigo_tiere_bau.py -- <arbeitsordner> <form> [auflösung=2048] [ausgabeordner]
import bpy, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'wendigo_lib.py'), encoding='utf8').read())
a = sys.argv[sys.argv.index('--') + 1:]
W = a[0].rstrip('/\\') + '/'; FORM = a[1]; RES = int(a[2]) if len(a) > 2 else 2048
OUTDIR = (a[3] if len(a) > 3 else 'C:/Users/GIGABYTE/HighAbyssMira-Repo/game/assets/ms/wendigo_' + FORM).rstrip('/\\') + '/'
os.makedirs(W, exist_ok=True); os.makedirs(OUTDIR, exist_ok=True)
HI_LEVEL = 3 if RES >= 2048 else 2
rs = np.random.RandomState(11)

# ================================================================ Geometrie-Anpassung (Pinsel, Spiegel im Blender-Rahmen: −Y vorn, Z oben)
def doe_features(arm):
  """Pinsel für das geschälte Reh: eingefallene Flanken, Wirbelknoten, Beckenspitzen, Gelenke. Rückgabe Liste (Mitte, Radius, Stärke, Richtung|None)."""
  hip = bone_pos(arm, 'Pelvis'); sp = bone_pos(arm, '-Spine'); sp1 = bone_pos(arm, '-Spine1'); nk = bone_pos(arm, '-Neck'); hd = bone_pos(arm, '-Head')
  F = []
  def f(p, r, amt, mir=True, d=None):
    F.append((np.array(p, float), r, amt, d))
    if mir and abs(p[0]) > 1e-4: F.append((np.array((-p[0], p[1], p[2]), float), r, amt, d))
  up = (0, 0, 1)
  # Rückgrat: Dornfortsätze (nach oben) vom Becken bis zum Widerrist, am Hals schwächer
  for y in np.linspace(hip[1] + .1, nk[1] + .05, 9): f((0, y, hip[2] + .10), .045, .012, False, up)
  for y in np.linspace(nk[1], hd[1] + .1, 5): f((0, y, nk[2] + .12 + (nk[1] - y) * .45), .035, .008, False, up)
  # Beckenschaufeln, Kreuzbein, Sitzbeinhöcker
  f((.11, hip[1] - .02, hip[2] + .08), .07, .028); f((.09, hip[1] + .17, hip[2] - .22), .05, .018)
  # Flanke eingefallen, Bauch hochgezogen (hinter dem Brustkorb)
  f((.12, sp[1], sp[2] - .02), .16, -.035); f((0, sp[1] + .05, sp[2] - .36), .2, .04, False, (0, 0, 1))
  # Brustkorb sichtbar (leichte Wölbung als Ganzes), Schulterblatt
  f((.14, sp1[1] - .12, sp1[2] - .12), .14, .015); f((.13, nk[1] + .12, nk[2] - .02), .09, .012)
  return F
def apply_feats(P, N, F):
  for c, r, amt, d in F: brush(P, N, c, r, amt, dirv=d)
def weld(o, dist=.0006):
  sel([o]); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=dist); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')

# ================================================================ Maskenfelder auf der hohen Fassung (numpy)
def flesh_fields(P, N, arm, style):
  """liefert dict der Punktattribute und die Verschiebung entlang der Normalen (m)."""
  S = 11.0  # Zellgröße ~ 9 cm, in Faserrichtung gestreckt (Rumpf: y, Läufe: z)
  torso = sstep(.5, .62, P[:, 2])
  stretch = np.stack([np.ones(len(P)), 1 - .68 * torso, 1 - .68 * (1 - torso)], 1)
  PS = P * stretch
  # Gebietsverzerrung: Zellgrenzen laufen organisch statt als gerade Facetten
  wv = np.stack([fbm(P * 3.1 + k * 7.7, 3, 20 + k) for k in range(3)], 1) - .5
  PS = PS + wv * .075
  f1, edge, cid = cells(PS * S, 3)
  f1b, edgeb, cidb = cells(PS * 31.0, 8)
  f1c, edgec, cidc = cells(PS * 55.0 + 4, 5)
  fb = fbm(P * 5.0, 4, 1); fn = fbm(P * 38.0, 3, 2); fv = fbm(P * 9.0, 3, 4)
  kante = 1 - sstep(.0, .09, edge)                                # Faszienlinien zwischen Muskelbündeln
  kante2 = 1 - sstep(.0, .10, edgeb)
  ader = (1 - sstep(0, .07, edgec)) * sstep(.42, .62, fv)         # feine Adern
  lobus = 1 - np.clip(f1 * 1.4, 0, 1)                             # Wölbung je Zelle
  hip = bone_pos(arm, 'Pelvis'); hd = bone_pos(arm, '-Head'); nk = bone_pos(arm, '-Neck'); sp = bone_pos(arm, '-Spine'); sp1 = bone_pos(arm, '-Spine1')
  # Rippen: Streifen quer zur Länge (y) am Brustkorb, seitlich
  ry = P[:, 1]; rz = P[:, 2]; rx = np.abs(P[:, 0])
  rib_zone = sstep(sp[1] - .05, sp[1] - .02, ry) * (1 - sstep(nk[1] + .08, nk[1] + .12, ry)) * sstep(.04, .11, rx) * sstep(hip[2] - .4, hip[2] - .3, rz) * (1 - sstep(hip[2] + .02, hip[2] + .12, rz))
  rib = (.5 + .5 * np.cos((ry - sp[1]) / .052 * 2 * np.pi + .6 * fb)) ** 3
  # Knochenmaske: Rippenkämme, Wirbelsäule, Beckenspitzen, Gelenke, Schädel vorn
  spine = sstep(.035, .012, rx) * sstep(hip[2] + .02, hip[2] + .10, rz) * sstep(hd[1] + .1, hd[1] + .4, ry)
  skull = sstep(hd[1] + .15, hd[1] + .02, ry) * sstep(hd[2] - .12, hd[2] + .05, rz) * .28 * sstep(.4, .7, fn)
  pelvic = np.exp(-(((rx - .11) / .06) ** 2 + ((ry - hip[1]) / .08) ** 2 + ((rz - hip[2] - .08) / .08) ** 2))
  low = sstep(.12, .03, rz)  # Hufe/Fesseln unten
  joint = sstep(.06, .0, np.abs(rz - .47)) * .0
  knochen = np.clip(rib_zone * sstep(.55, .85, rib) * .9 + spine * .8 + skull + pelvic * .8 + low * .5, 0, 1) * (.6 + .4 * sstep(.3, .7, fn))
  blut = np.clip(sstep(.52, .78, fb) * .8 + sstep(.7, .9, fv) * .3, 0, 1)
  lower_head = sstep(hd[1] + .2, hd[1] - .0, ry) * sstep(hd[2] + .0, hd[2] - .2, rz)
  blut = np.clip(blut + lower_head * .7 + sstep(.5, 0, rz - .6) * .15, 0, 1)
  headm = sstep(hd[1] + .18, hd[1] - .02, ry) * sstep(hd[2] - .35, hd[2] - .1, rz)
  fett = sstep(.72, .85, fbm(P * 3.2 + 9, 3, 6)) * (1 - knochen) * .8
  F = dict(zell=cid, kante=np.clip((kante * .55 + kante2 * .35) * (1 - .6 * headm), 0, 1), ader=ader, knochen=knochen, blut=blut, fett=fett, mott=fb)
  if style == 'haut':
    # Haut: weniger Zellen, Falten (lange Wellen), Adern deutlich
    wr = .5 + .5 * np.sin(P[:, 2] * 38 + fb * 7 + P[:, 1] * 9)
    d = (.007 * wr - .003 * kante2 + .002 * fn + .003 * (fb - .5)) * (1 - .5 * headm)
    F['kante'] = np.clip((sstep(.62, .2, wr) * .55 + kante2 * .35) * (1 - .6 * headm), 0, 1); F['ader'] = np.clip(ader * 2.2, 0, 1); F['blut'] = np.clip(sstep(.55, .72, fb) * .9 + F['blut'] * .4, 0, 1)
  else:
    d = .0055 * lobus - .004 * kante - .0022 * kante2 + .0015 * (fn - .5) + (.0085 * rib * rib_zone) * (1 - .0) - .003 * ader
    d += .006 * spine * (.5 + .5 * np.cos(P[:, 1] / .08 * 6.2832)) + .01 * pelvic
    d = d * (1 - .62 * headm)
  return F, d

# ================================================================ Material der hohen Fassung (liest nur Attribute) und Backen
def hi_material(style):
  m, nodes, links = new_mat('hi_' + style); nt = m.node_tree; bsdf = nodes['Principled BSDF']
  A = {k: attr_node(nt, k) for k in ('zell', 'kante', 'ader', 'knochen', 'blut', 'fett', 'mott')}
  def mix(a, b, fac):
    n = nt.nodes.new('ShaderNodeMixRGB'); n.blend_type = 'MIX'
    if isinstance(a, tuple): n.inputs[1].default_value = a
    else: links.new(a, n.inputs[1])
    if isinstance(b, tuple): n.inputs[2].default_value = b
    else: links.new(b, n.inputs[2])
    links.new(fac, n.inputs[0]); return n.outputs[0]
  noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 60; noise.inputs['Detail'].default_value = 6
  tc = nt.nodes.new('ShaderNodeTexCoord'); links.new(tc.outputs['Object'], noise.inputs['Vector'])
  if style == 'haut':
    base = ramp(nt, [(0, (.13, .105, .10, 1)), (.5, (.21, .17, .155, 1)), (1, (.31, .25, .22, 1))], A['zell'].outputs['Fac']).outputs[0]
    col = mix(base, (.13, .03, .035, 1), A['blut'].outputs['Fac'])
    col = mix(col, (.08, .05, .09, 1), A['ader'].outputs['Fac'])
    col = mix(col, (.07, .05, .05, 1), A['kante'].outputs['Fac'])
    col = mix(col, (.36, .30, .24, 1), A['knochen'].outputs['Fac'])
    rough = .5
  else:
    base = ramp(nt, [(0, (.05, .004, .004, 1)), (.5, (.11, .008, .007, 1)), (1, (.2, .02, .015, 1))], A['zell'].outputs['Fac']).outputs[0]
    col = mix(base, (.04, .003, .004, 1), A['blut'].outputs['Fac'])
    col = mix(col, (.12, .03, .06, 1), A['ader'].outputs['Fac'])
    col = mix(col, (.17, .07, .06, 1), A['kante'].outputs['Fac'])
    col = mix(col, (.42, .30, .20, 1), A['fett'].outputs['Fac'])
    col = mix(col, (.40, .31, .21, 1), A['knochen'].outputs['Fac'])
    rough = .4
  # Marmorierung durch feines Rauschen: Grundfarbe × (0,8 … 1,2)
  mm = nt.nodes.new('ShaderNodeMixRGB'); mm.blend_type = 'MULTIPLY'; mm.inputs[0].default_value = 1.0; links.new(col, mm.inputs[1])
  mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = .65; mr.inputs['To Max'].default_value = 1.1; links.new(noise.outputs['Fac'], mr.inputs['Value'])
  cc = nt.nodes.new('ShaderNodeCombineColor'); [links.new(mr.outputs['Result'], cc.inputs[i]) for i in range(3)]; links.new(cc.outputs['Color'], mm.inputs[2]); col = mm.outputs[0]
  links.new(col, bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value = rough
  return m
def lo_material(name):
  m, nodes, links = new_mat(name); return m

def make_hi(low, arm, style, level):
  hi = low.copy(); hi.data = low.data.copy(); hi.name = 'hi'; scn.collection.objects.link(hi)
  hi.parent = None; hi.matrix_world = low.matrix_world.copy()
  for m_ in list(hi.modifiers): hi.modifiers.remove(m_)
  hi.vertex_groups.clear()
  subsurf(hi, level)
  P = verts_np(hi); N = normals_np(hi)
  F, d = flesh_fields(P, N, arm, style)
  P = P + N * d[:, None]; set_verts(hi, P)
  for k, v in F.items(): add_attr(hi, k, v)
  hi.data.materials.clear(); hi.data.materials.append(hi_material(style))
  return hi

def bake_set(low, hi, tag):
  """Normal + Grundfarbe + Rauheit + AO → drei Texturen (BaseColor, Normal, ORM)."""
  lo_mat = lo_material('wd_' + tag); low.data.materials.clear(); low.data.materials.append(lo_mat)
  p = lambda n: W + tag + '_' + n + '.png'
  n_img = bake_pass(low, [hi], 'NORMAL', RES, p('normal'), ray=.18, cage=.07, samples=4)
  c_img = bake_pass(low, [hi], 'DIFFUSE', RES, p('color'), ray=.18, cage=.07, samples=6)
  r_img = bake_pass(low, [hi], 'ROUGHNESS', RES, p('rough'), ray=.18, cage=.07, samples=4)
  o_img = None
  R = img_np(r_img)[..., 0]
  orm = np.zeros((RES, RES, 3), np.float32); orm[..., 0] = 1.0; orm[..., 1] = np.clip(R * 1.0 + .05, .3, 1); orm[..., 2] = 0
  return c_img, n_img, orm

def final_material(low, c_img, n_img, orm, tag, quality=90):
  scn.view_settings.view_transform = 'Standard'; scn.view_settings.look = 'None'; scn.view_settings.exposure = 0; scn.view_settings.gamma = 1
  base = W + tag + '_'
  # Bilder als JPEG (Spiel komprimiert später zu KTX2)
  c_path = OUTDIR + tag + '_farbe.jpg'; n_path = OUTDIR + tag + '_normal.jpg'; o_path = OUTDIR + tag + '_orm.jpg'
  for src, path, cs in ((W + tag + '_color.png', c_path, 'sRGB'), (W + tag + '_normal.png', n_path, 'Non-Color')):
    img = bpy.data.images.load(src); img.colorspace_settings.name = cs; _ = img.pixels[0]
    scn.render.image_settings.file_format = 'JPEG'; scn.render.image_settings.quality = quality; scn.render.image_settings.color_mode = 'RGB'
    img.save_render(path, scene=scn)
  oi = bpy.data.images.new('orm', RES, RES); oi.colorspace_settings.name = 'Non-Color'
  oi.pixels.foreach_set(np.concatenate([orm, np.ones((RES, RES, 1), np.float32)], 2).ravel()); scn.render.image_settings.file_format = 'JPEG'; scn.render.image_settings.color_mode = 'RGB'; oi.save_render(o_path, scene=scn)
  m = bpy.data.materials.new('wd_' + tag); m.use_nodes = True; nt = m.node_tree; nodes = nt.nodes; links = nt.links; bsdf = nodes['Principled BSDF']
  def img_node(path, cs):
    n = nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(path); n.image.colorspace_settings.name = cs; return n
  c = img_node(c_path, 'sRGB'); links.new(c.outputs['Color'], bsdf.inputs['Base Color'])
  nn = img_node(n_path, 'Non-Color'); nm = nodes.new('ShaderNodeNormalMap'); links.new(nn.outputs['Color'], nm.inputs['Color']); links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
  o = img_node(o_path, 'Non-Color'); sep = nodes.new('ShaderNodeSeparateColor'); links.new(o.outputs['Color'], sep.inputs['Color'])
  links.new(sep.outputs['Green'], bsdf.inputs['Roughness']); bsdf.inputs['Metallic'].default_value = 0
  bsdf.inputs['Specular IOR Level'].default_value = .35
  gt = bpy.data.node_groups.get('glTF Material Output') or bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
  if 'Occlusion' not in [i.name for i in gt.interface.items_tree]: gt.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
  gn = nodes.new('ShaderNodeGroup'); gn.node_tree = gt; links.new(sep.outputs['Red'], gn.inputs['Occlusion'])
  low.data.materials.clear(); low.data.materials.append(m); return m

# ================================================================ Skelett-Hilfen
def retarget_vertex_groups_ok(low): return len(low.vertex_groups) > 0

def export_glb(path, objs):
  for o in objs:
    if o.type == 'ARMATURE': o.data.pose_position = 'POSE'
  sel(objs)
  bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=False, export_animations=True, export_animation_mode='NLA_TRACKS',
    export_skins=True, export_morph=True, export_morph_normal=False, export_image_format='JPEG', export_jpeg_quality=90, export_cameras=False, export_lights=False, export_extras=True,
    export_vertex_color='ACTIVE', export_optimize_animation_size=True)
  log('GLB', path, '%.1f MB' % (os.path.getsize(path) / 1e6))

# ================================================================ Formen
def build_fleisch(kind='doe', style='fleisch', tag='fleisch', apply_to_arm=True):
  arm, me = load_base(kind); strip_fur(me)
  if kind == 'stag':
    bm = bmesh.new(); bm.from_mesh(me.data); bm.verts.ensure_lookup_table()
    # Geweih entfernen: Inseln mit ymax > −.85 und zmin > 1.4
    seen = set(); kill = []
    for v in bm.verts:
      if v.index in seen: continue
      st = [v]; comp = []; seen.add(v.index)
      while st:
        x = st.pop(); comp.append(x)
        for e in x.link_edges:
          y = e.other_vert(x)
          if y.index not in seen: seen.add(y.index); st.append(y)
      if min(c.co.z for c in comp) > 1.4 and max(c.co.y for c in comp) > -.85: kill += comp
    bmesh.ops.delete(bm, geom=kill, context='VERTS'); bm.to_mesh(me.data); bm.free(); me.data.update()
  weld(me)
  P = verts_np(me, False); Nn = normals_np(me); apply_feats(P, Nn, doe_features(arm)); set_verts(me, P); smooth(me)
  uv_unwrap(me)
  log(tag, 'Körper', tris(me), 'Dreiecke')
  hi = make_hi(me, arm, style, HI_LEVEL)
  return arm, me, hi

exec(open(os.path.join(HERE, 'wendigo_morphs.py'), encoding='utf8').read())
exec(open(os.path.join(HERE, 'wendigo_hirschding_bau.py'), encoding='utf8').read())
exec(open(os.path.join(HERE, 'wendigo_clips.py'), encoding='utf8').read())

def main():
  if FORM in ('fleisch', 'haut'):
    arm, me, hi = build_fleisch('doe', FORM, FORM)
    c, n, orm = bake_set(me, hi, FORM)
    bpy.data.objects.remove(hi, do_unlink=True)
    final_material(me, c, n, orm, FORM)
    morphs(me, arm, 'doe', None, riss=False)
    me.name = 'wendigo_' + FORM
    arm.data.pose_position = 'POSE'; tier_clips(arm, [me])
    bpy.ops.wm.save_as_mainfile(filepath=W + FORM + '.blend')
    export_glb(OUTDIR + 'model.glb', [arm, me])
  elif FORM in ('reh', 'hirsch'):
    arm, me, mf = build_dressed('doe' if FORM == 'reh' else 'stag', FORM)
    me.name = 'wendigo_' + FORM; arm.data.pose_position = 'POSE'; tier_clips(arm, [me, mf])
    bpy.ops.wm.save_as_mainfile(filepath=W + FORM + '.blend')
    export_glb(OUTDIR + 'model.glb', [arm, me, mf])
  elif FORM in ('hd_form', 'hirschding'):
    arm, me, W_ = build_hirschding()
    hib = make_hi(me, arm, 'fleisch', HI_LEVEL) if FORM == 'hirschding' else None   # Körper getrennt hochrechnen (vor der Verdichtung)
    densify(me, .5)
    low_parts, hi_parts = finish_hirschding(arm, me, W_)
    zm, ab = jaw_and_bones(arm, me, low_parts)
    assign_parts(low_parts, arm, ab, zm)
    log('Körper', tris(me), 'Dreiecke; Teile', sum(tris(o) for o in low_parts))
    if FORM == 'hd_form':
      bpy.ops.wm.save_as_mainfile(filepath=W + 'hd_form.blend')
      quick_render([me] + low_parts, W + 'q_hd', ('seite', 'vorn', '34', 'kopf', 'kopfv', 'hinten')); return
    low = merge([me] + low_parts, 'wendigo_hirschding'); smooth(low)
    low.parent = arm; low.matrix_parent_inverse = Matrix.Identity(4)
    for md_ in list(low.modifiers): low.modifiers.remove(md_)
    md_ = low.modifiers.new('Armature', 'ARMATURE'); md_.object = arm
    uv_unwrap(low)
    log('gesamt', tris(low), 'Dreiecke')
    for o in hi_parts:
      o.data.materials.clear(); o.data.materials.append(hib.data.materials[0])
    hi_all = merge([hib] + hi_parts, 'hi_all')
    c, n, orm = bake_set(low, hi_all, 'hirschding'); bpy.data.objects.remove(hi_all, do_unlink=True)
    final_material(low, c, n, orm, 'hirschding')
    arm.data.pose_position = 'POSE'; R, Hh, meta = build_clips(arm)
    log('Clips', list(meta))
    bpy.ops.wm.save_as_mainfile(filepath=W + 'hirschding.blend')
    export_glb(OUTDIR + 'model.glb', [arm, low])
run_main(main, W + 'build_' + FORM + '.log')
