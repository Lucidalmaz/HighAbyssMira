# Wendigo-Formen: Morphs (Shape Keys), Blutflecken (Vertexfarbe), bekleidete Formen (Reh/Hirsch mit Fleischschicht darunter).
# Wird von wendigo_tiere_bau.py per exec geladen (teilt dessen Namensraum: build_fleisch, bake_set, final_material, load_base, weld …).

def add_shape(me, name, P_new):
  if not me.data.shape_keys: me.shape_key_add(name='Basis', from_mix=False)
  k = me.shape_key_add(name=name, from_mix=False); k.data.foreach_set('co', np.asarray(P_new, dtype=np.float32).ravel()); k.value = 0; return k

def rot_about(P, pivot, axis, ang):
  """Rotation je Punkt mit eigenem Winkel (ang: (N,))."""
  ax = np.asarray(axis, float); ax = ax / np.linalg.norm(ax); v = P - pivot; c = np.cos(ang)[:, None]; s_ = np.sin(ang)[:, None]
  return pivot + v * c + np.cross(ax, v) * s_ + ax[None, :] * (v @ ax)[:, None] * (1 - c)

def morphs(me, arm, kind, antler_ids=None, riss=True):
  P0 = np.empty(len(me.data.vertices) * 3); me.data.vertices.foreach_get('co', P0); P0 = P0.reshape(-1, 3)
  N0 = normals_np(me)
  hd = bone_pos(arm, '-Head'); n1 = bone_pos(arm, '-Neck1'); nk = bone_pos(arm, '-Neck'); sp = bone_pos(arm, '-Spine'); hip = bone_pos(arm, 'Pelvis')
  wN = np.clip(group_weight(me, ['-Neck1']) * .35 + group_weight(me, ['-Neck2']) * .7 + group_weight(me, ['-Head', 'Ponytail1']), 0, 1)
  # Kopf falsch: Hals dehnt sich, Kopf kippt zur Seite und dreht zu weit (der Kopf „sitzt nie richtig“)
  P = rot_about(P0, n1, (0, 0, 1), 1.1 * wN); P = rot_about(P, hd, (0, 1, 0), .62 * wN); P = rot_about(P, hd, (1, 0, 0), .25 * wN); P = P + np.array([0, -.2, .04]) * wN[:, None]
  add_shape(me, 'kopf_falsch', P)
  # Maul auf: Punkte des Kopfes unterhalb der Mundlinie klappen um das Kiefergelenk
  y = P0[:, 1]; z = P0[:, 2]; wH = group_weight(me, ['-Head', 'Ponytail1'])
  jaw = (wH > .5) & (y < hd[1] - .08) & (z < hd[2] - .055 + (hd[1] - y) * .05)
  hinge = np.array([0, hd[1] - .05, hd[2] - .02]); ang = np.where(jaw, .55, 0.)
  add_shape(me, 'maul_auf', rot_about(P0, hinge, (1, 0, 0), ang))
  # Knochen schieben: Rippen, Wirbel, Beckenspitzen quellen heraus
  ry, rx, rz = P0[:, 1], np.abs(P0[:, 0]), P0[:, 2]
  rib = sstep(sp[1] - .25, sp[1] - .1, ry) * (1 - sstep(nk[1] + .05, nk[1] + .15, ry)) * sstep(.05, .12, rx) * sstep(hip[2] - .4, hip[2] - .3, rz) * (1 - sstep(hip[2] + .03, hip[2] + .12, rz))
  spine = sstep(.05, .0, rx) * sstep(hip[2] + .02, hip[2] + .12, rz) * sstep(hd[1] + .1, hd[1] + .4, ry)
  add_shape(me, 'knochen', P0 + N0 * ((rib * .028 + spine * .035)[:, None]))
  if riss:  # Haut reißt: entlang der Rückenlinie klaffen die Schalen auf, das Fleisch darunter wird sichtbar
    prof = sstep(.2, .0, rx) * (1 - sstep(hip[1] + .3, hip[1] + .5, ry)) * sstep(hd[1] + .1, hd[1] + .45, ry) * sstep(hip[2] - .45, hip[2] - .1, rz)
    sg = np.sign(P0[:, 0] + 1e-6); R_ = np.zeros_like(P0); R_[:, 0] += sg * .13 * prof; R_[:, 2] -= .03 * prof
    # Bauchnaht: unterer Rumpf klafft nach beiden Seiten
    bm = sstep(.16, .0, rx) * sstep(hip[2] * .78, hip[2] * .55, rz) * sstep(hip[2] * .35, hip[2] * .5, rz) * (1 - sstep(sp[1] + .0, sp[1] + .12, ry)) * sstep(nk[1] + .1, nk[1] + .25, ry) * sstep(-.15, -.55, N0[:, 2])   # nur Bauchunterseite (Normale nach unten), nicht die Läufe
    B_ = np.zeros_like(P0); B_[:, 0] += sg * .15 * bm; B_[:, 2] += .05 * bm
    # Flankenschlitz: Fläche seitlich, oberer Rand hebt, unterer senkt, Mitte schwillt nach außen
    fc = np.array([.2, sp[1] - .08, hip[2] * .84]); fd = np.linalg.norm((P0 - fc) * np.array([1, .6, 1.2]), axis=1); fm = sstep(.28, .0, fd) * sstep(.04, .2, rx)
    F_ = np.zeros_like(P0); F_ += N0 * (.03 * fm)[:, None]; F_[:, 2] += np.sign(rz - fc[2]) * .075 * fm
    # Halsriss: seitlich entlang des Halses
    hm = sstep(.11, .0, rx - .0) * sstep(hd[1] + .12, hd[1] + .3, ry) * (1 - sstep(nk[1] - .0, nk[1] + .12, ry)) * sstep(hip[2] * .7, hip[2] * .95, rz)
    H_ = np.zeros_like(P0); H_[:, 0] += sg * .1 * hm
    add_shape(me, 'riss_ruecken', P0 + R_); add_shape(me, 'riss_bauch', P0 + B_); add_shape(me, 'riss_flanke', P0 + F_); add_shape(me, 'riss_hals', P0 + H_)
    add_shape(me, 'riss', P0 + R_ + B_ + F_ + H_)
  if antler_ids is not None:  # Geweih „wächst“: Schlüssel = klein (Wert 1), 0 = voll
    base = np.array([0, hd[1] + .03, hd[2] + .22]); Q = P0.copy(); m = antler_ids; Q[m] = base + (P0[m] - base) * .18
    add_shape(me, 'geweih_klein', Q)

def vertex_color_blut(me, arm):
  hd = bone_pos(arm, '-Head'); P = verts_np(me, False); y, z = P[:, 1], P[:, 2]
  m = np.clip(sstep(hd[1] - .12, hd[1] - .32, y) * sstep(hd[2] + .05, hd[2] - .1, z) + sstep(.55, .0, z) * .35, 0, 1)
  m = np.clip(m * (.55 + .45 * fbm(P * 14, 3, 9)) * 1.4, 0, 1)
  ca = me.data.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
  col = np.stack([1 - m * .55, 1 - m * .93, 1 - m * .93, np.ones_like(m)], 1).astype(np.float32); ca.data.foreach_set('color', col.ravel())
  me.data.color_attributes.active_color = ca

def antler_mask(me):
  """Punkte der Geweihinseln (Hirsch): Insel mit z_min > 1.4 und y_max > −.85."""
  bm = bmesh.new(); bm.from_mesh(me.data); bm.verts.ensure_lookup_table(); seen = set(); ids = np.zeros(len(bm.verts), bool)
  for v in bm.verts:
    if v.index in seen: continue
    st = [v]; comp = []; seen.add(v.index)
    while st:
      x = st.pop(); comp.append(x)
      for e in x.link_edges:
        y = e.other_vert(x)
        if y.index not in seen: seen.add(y.index); st.append(y)
    if min(c.co.z for c in comp) > 1.4 and max(c.co.y for c in comp) > -.85:
      for c in comp: ids[c.index] = True
  bm.free(); return ids

def build_dressed(kind, tag):
  # 1) Fleischschicht (gebackene Textur) auf dem Körper ohne Fell/Geweih
  arm_f, me_f, hi = build_fleisch(kind, 'fleisch', 'innen')
  c, n, orm = bake_set(me_f, hi, 'innen'); bpy.data.objects.remove(hi, do_unlink=True)
  final_material(me_f, c, n, orm, 'innen')
  # 2) bekleidetes Tier laden, Fleischschicht darunterhängen
  arm, me = load_base(kind, clear=False)
  for md in list(me_f.modifiers):
    if md.type == 'ARMATURE': md.object = arm
  me_f.parent = arm; me_f.matrix_parent_inverse = Matrix.Identity(4)
  bpy.data.objects.remove(arm_f, do_unlink=True)
  P = verts_np(me_f, False); Nn = normals_np(me_f); set_verts(me_f, P - Nn * .014); me_f.name = 'fleisch_innen'
  # 3) Details
  vertex_color_blut(me, arm)
  # milchige Augen (blassblau-weiße Kugeln in den Höhlen, nass, kein Glühen – das Tier ist „nicht mehr da“)
  hd = bone_pos(arm, '-Head'); sc_ = 1.0 if kind == 'doe' else 1.12
  eyes = eye_parts(arm, hd, .062 * sc_, -.085 * sc_, .045 * sc_, .017 * sc_, False)
  for e_ in eyes:
    e_.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.62, .66, .66, 1)
    vg = e_.vertex_groups.new(name=[g.name for g in me.vertex_groups if g.name.endswith('-Head')][0]); vg.add(list(range(len(e_.data.vertices))), 1.0, 'REPLACE')
  me = merge([me] + eyes, me.name); me.parent = arm; me.matrix_parent_inverse = Matrix.Identity(4)
  if not any(m_.type == 'ARMATURE' for m_ in me.modifiers):
    m_ = me.modifiers.new('Armature', 'ARMATURE'); m_.object = arm
  ids = antler_mask(me) if kind == 'stag' else None
  morphs(me, arm, kind, ids)
  morphs(me_f, arm, kind, None, riss=False)
  return arm, me, me_f
