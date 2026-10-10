# Küchenherd (Standgerät der 1950er/60er, Email, vier Kochplatten, Backofen mit Fenster, Wärmefach) für High Abyss Mira – eigene Arbeit, Blender, Hard-Surface per Skript.
#   blender --background --factory-startup --threads 2 --python herd_bau.py -- <ausgabeordner> [textur]
# Maße 0,60 × 0,88 × 0,60 m. glTF: Vorderseite +z, Unterkante y = 0, Mitte x/z = 0. Teile: korpus (alles Feste) · tuer (Backofentür, Ursprung = untere Scharnierachse).
import bpy, bmesh, math, os, sys, json, time
import numpy as np
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prop_lib.py'), encoding='utf8').read())
OUT_ = a[0] if a else os.getcwd(); TEX_ = int(a[1]) if len(a) > 1 else 1024
W, D, H = .60, .60, .88
f0 = -D / 2                       # Frontebene (Blender −y)
K = []
sock = .07
K.append(cube(-W / 2 + .02, W / 2 - .02, f0 + .03, D / 2 - .02, 0, sock, bev=.003, teil=1.))           # Sockel schwarz
K.append(cube(-W / 2, W / 2, f0 + .004, D / 2, sock, H - .05, bev=.012, seg=3))                         # Korpus Email
K.append(cube(-W / 2 - .002, W / 2 + .002, f0, D / 2 + .002, H - .05, H - .035, bev=.004, seg=2, teil=2.))  # Zierleiste Chrom
K.append(cube(-W / 2 + .004, W / 2 - .004, f0 + .006, D / 2 - .004, H - .035, H - .02, bev=.005, seg=2, teil=3.))   # Kochfeldplatte (Gusseisen/Email dunkel)
# Rückwand-Aufsatz mit Uhr und Signallampe
K.append(cube(-W / 2 + .01, W / 2 - .01, D / 2 - .06, D / 2 - .004, H - .02, H + .11, bev=.006, seg=2))
K.append(cyl(-.12, D / 2 - .066, H + .065, .028, .008, 'Y', teil=2.)); K.append(cyl(-.12, D / 2 - .0715, H + .065, .022, .004, 'Y', teil=5.))   # Uhr
K.append(cyl(.2, D / 2 - .066, H + .065, .008, .006, 'Y', teil=4.))                                         # Signallampe
# vier Kochplatten (Gusseisen mit Ring und Mittelkappe)
for (px, pz, r) in ((-.14, .13, .088), (.14, .13, .088), (-.14, -.115, .075), (.14, -.115, .075)):
  K.append(cyl(px, pz, H - .0125, r, .015, 'Z', teil=3., n=36)); K.append(cyl(px, pz, H - .0045, r * .72, .004, 'Z', teil=3., n=36)); K.append(cyl(px, pz, H - .0035, r * .22, .006, 'Z', teil=2., n=20))
# Bedienblende (vorn oben): vier Drehknöpfe mit Zeigerstrich, ein Schalter
K.append(cube(-W / 2 + .02, W / 2 - .02, f0 - .004, f0 + .006, H - .125, H - .062, bev=.003, teil=2.))
for i, px in enumerate((-.205, -.07, .07, .205)):
  K.append(cyl(px, f0 - .0155, H - .0935, .0215, .022, 'Y', teil=1., n=28)); K.append(cyl(px, f0 - .0275, H - .0935, .0155, .004, 'Y', teil=1., n=24))
  K.append(cube(px - .0016, px + .0016, f0 - .0295, f0 - .0265, H - .0935, H - .0935 + .016, bev=0, teil=6.))
# Backofenfenster-Rahmen, Wärmefach unten, Griffe
K.append(cube(-.255, .255, f0 - .006, f0 + .004, .26, .56, bev=.004, teil=2.))                          # Rahmen um die Backofentür (Chrom)
dr0, dr1 = .27, .55
K.append(cube(-.215, .215, f0 - .026, f0 - .002, sock + .01, .205, bev=.007, seg=2))                  # Wärmefach/Schublade
K.append(cyl(0, f0 - .045, .18, .0085, .26, 'X', teil=2.));
for sx in (-1, 1): K.append(cyl(sx * .12, f0 - .03, .18, .0065, .035, 'Y', teil=2., n=12))
K.append(cube(-W / 2 + .03, W / 2 - .03, f0 - .0035, f0 + .0005, .205 + .01, dr0 - .012, bev=.001, teil=1.))   # Fuge unter der Tür
PARTS = [join(K, 'korpus')]
# Backofentür: Rahmen Email, Fenster, Griffstange
d = [cube(-.245, .245, f0 - .03, f0 - .003, dr0, dr1, bev=.01, seg=3)]
d.append(cube(-.17, .17, f0 - .0305, f0 - .0285, dr0 + .07, dr1 - .06, bev=0, teil=4.))                  # Fenster dunkel
d.append(cube(-.18, .18, f0 - .0295, f0 - .0275, dr0 + .063, dr1 - .053, bev=.002, teil=2.))             # Fensterrahmen
for sx in (-1, 1): d.append(cyl(sx * .2, f0 - .052, dr1 - .035, .0065, .045, 'Y', teil=2., n=12))
d.append(cyl(0, f0 - .072, dr1 - .035, .0095, .43, 'X', teil=2.))                                           # Griffstange
t = join(d, 'tuer'); origin(t, (0, f0 - .03, dr0)); PARTS.append(t)
for o in PARTS: o.data.polygons.foreach_set('use_smooth', [False] * len(o.data.polygons))
for o in PARTS:
  sel([o])
  try: bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
  except Exception: bpy.ops.object.shade_smooth(); o.data.use_auto_smooth = True
TEILE = {1: dict(c=(.02, .02, .019), r=.7, rv=.15, dirt=.5), 2: dict(c=(.56, .56, .54), r=.22, rv=.1, m=1, cav=.6),
         3: dict(c=(.045, .045, .043), r=.55, rv=.2, dirt=.6, m=.4), 4: dict(c=(.012, .014, .014), r=.12, rv=.05),
         5: dict(c=(.62, .6, .5), r=.4), 6: dict(c=(.82, .8, .7), r=.5), }
finish(PARTS, 'herd', TEILE, dict(paint=(.5, .48, .4), wear=.6, rust=.45, dirt=.8, dent=.5), TEX_, OUT_)
