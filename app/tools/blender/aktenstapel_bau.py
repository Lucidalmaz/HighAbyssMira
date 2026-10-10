# Aktenstapel (liegende Mappen/Ordner, vergilbte Blätter schauen heraus) für die Schrankoberseiten im Archiv – eigene Arbeit, Blender.
#   blender --background --factory-startup --threads 2 --python run_prop.py -- aktenstapel_bau.py <ausgabeordner> [textur]
# Maße ca. 0,70 × 0,17 × 0,30 m (zwei Stapel nebeneinander). glTF: Unterkante y = 0, Mitte x/z = 0. Ein Teil „stapel“.
import bpy, bmesh, math, os, sys, json, time, random
import numpy as np
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prop_lib.py'), encoding='utf8').read())
OUT_ = a[0] if a else os.getcwd(); TEX_ = int(a[1]) if len(a) > 1 else 512
rnd = random.Random(11)
K = []
def stack(cx, n, w0, d0, seed):
  r = random.Random(seed); y = 0.
  for i in range(n):
    t = r.uniform(.009, .021); w = w0 + r.uniform(-.03, .03); d = d0 + r.uniform(-.02, .02)
    ox = cx + r.uniform(-.022, .022); oz = r.uniform(-.02, .02)
    teil = r.choice((0., 0., 0., 2., 1.)) if i else 0.
    o = cube(ox - w / 2, ox + w / 2, oz - d / 2, oz + d / 2, y, y + t, bev=.0018, seg=1, teil=teil)
    o.rotation_euler = (0, 0, r.uniform(-.035, .035)); o.location.x += 0; K.append(o)
    # Heraushängende Blätter (dünn, heller)
    if r.random() < .55:
      k = r.choice((-1, 1)); pw = r.uniform(.03, .07)
      K.append(cube(ox + k * (w / 2 - .02), ox + k * (w / 2 + pw), oz - d / 2 * .8, oz + d / 2 * .7, y + t * .35, y + t * .35 + .0025, bev=0, teil=1.))
    y += t
  return y
h1 = stack(-.175, 9, .33, .25, 3); h2 = stack(.175, 7, .31, .24, 8)
parts = []
for o in K: parts.append(o)
o = join(K, 'stapel')
# Unterkante auf y = 0 (Mappen starten bei 0; Drehung hebt höchstens Millimeter)
bpy.ops.object.shade_smooth()
PARTS = [o]
TEILE = {1: dict(c=(.46, .44, .36), r=.9, rv=.05, dirt=1.0, var=.2), 2: dict(c=(.13, .17, .14), r=.8, rv=.1, dirt=.6, var=.2)}
finish(PARTS, 'aktenstapel', TEILE, dict(paint=(.24, .185, .105), wear=.2, rust=0., dirt=1.0, dent=0.), TEX_, OUT_)
