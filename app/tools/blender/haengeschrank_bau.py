# Küchen-Hängeschrank (Holz, gestrichen, zwei Füllungstüren, Porzellanknöpfe, Kranzleiste) für Haus Nr. 1 – eigene Arbeit, Blender.
#   blender --background --factory-startup --threads 2 --python run_prop.py -- haengeschrank_bau.py <ausgabeordner> [textur]
# Maße 0,80 × 0,70 × 0,33 m. glTF: Rückseite z = −0,165 (Wand), Vorderseite +z, Unterkante y = 0, Mitte x = 0.
import bpy, bmesh, math, os, sys, json, time
import numpy as np
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prop_lib.py'), encoding='utf8').read())
OUT_ = a[0] if a else os.getcwd(); TEX_ = int(a[1]) if len(a) > 1 else 1024
W, H, D = .80, .70, .33
f0 = -D / 2   # Vorderseite bei Blender −y
K = []
# Korpus: Seiten, Boden, Deckel, Rückwand
t = .018
K.append(cube(-W / 2, -W / 2 + t, f0 + .02, D / 2, 0, H, bev=.002))
K.append(cube(W / 2 - t, W / 2, f0 + .02, D / 2, 0, H, bev=.002))
K.append(cube(-W / 2, W / 2, f0 + .02, D / 2, 0, t, bev=.002))
K.append(cube(-W / 2 - .012, W / 2 + .012, f0 - .004, D / 2, H - t - .012, H + .004, bev=.004, seg=2))   # Kranzleiste/Deckplatte
K.append(cube(-W / 2 + t, W / 2 - t, D / 2 - .008, D / 2, t, H - t, bev=0))
K.append(cube(-W / 2 + t, W / 2 - t, f0 + .03, D / 2 - .01, H * .5 - .009, H * .5 + .009, bev=0))      # Fachboden
K.append(cube(-.003, .003, f0 + .004, f0 + .03, t + .002, H - t - .014, bev=0, teil=0.))                  # Mittelsteg
# zwei Türen mit Füllung
dw = (W - 2 * t) / 2 - .002; dh = H - t - .014 - t - .004; dz0 = t + .003
for s in (-1, 1):
  x0 = (.002 if s > 0 else -dw - .002 + .0); xa, xb = (.002, .002 + dw) if s > 0 else (-.002 - dw, -.002)
  K.append(cube(xa, xb, f0 - .022, f0 + .004, dz0, dz0 + dh, bev=.0025, seg=2))                         # Türblatt
  # Füllung (eingesetzt, leicht zurück) mit Profilrahmen
  K.append(cube(xa + .052, xb - .052, f0 - .0225, f0 - .012, dz0 + .052, dz0 + dh - .052, bev=.003, seg=2))
  K.append(cube(xa + .075, xb - .075, f0 - .0235, f0 - .0215, dz0 + .075, dz0 + dh - .075, bev=.002, seg=1))
  kx = (xa + .045) if s > 0 else (xb - .045)
  K.append(cyl(kx, f0 - .033, dz0 + .08, .0125, .016, 'Y', teil=5., n=20))                                  # Porzellanknopf
  K.append(cyl(kx, f0 - .0225, dz0 + .08, .0055, .006, 'Y', teil=2., n=12))
  for zz in (dz0 + .09, dz0 + dh - .09):                                                                      # Bandscharniere außen
    hx = (xb - .003) if s > 0 else (xa + .003)
    K.append(cube(hx - .0035 if s > 0 else hx - .0035, hx + .0035, f0 - .024, f0 - .0215, zz - .03, zz + .03, bev=0, teil=2.))
PARTS = [join(K, 'schrank')]
bpy.ops.object.shade_smooth()
TEILE = {2: dict(c=(.45, .43, .37), r=.4, rv=.15, m=1, cav=.5), 5: dict(c=(.62, .6, .52), r=.25, rv=.1, dirt=.7)}
finish(PARTS, 'haengeschrank', TEILE, dict(paint=(.2, .3, .38), wear=.7, rust=0., dirt=1.0, dent=.4), TEX_, OUT_)
