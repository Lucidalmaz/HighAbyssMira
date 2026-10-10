# Küchenkühlschrank 1950er (Haus Nr. 4) MIT schwenkbarer Tür – eigene Arbeit, Blender. Teile: korpus (hohl, Innenfächer, Gemüsefach, Dichtung) · tuer (Ursprung = Scharnierachse rechts).
#   blender -b --factory-startup --python run_prop.py -- kuehlschrank_tuer_bau.py <ausgabeordner> [textur]
# Maße 0,66 × 1,62 × 0,64 m; glTF: Vorderseite +z, Unterkante y = 0, Mitte x/z = 0; Tür 4,5 cm dick, Scharnier bei x = +0,33, öffnet nach −x.
import bpy, bmesh, math, os, sys, json, time
import numpy as np
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prop_lib.py'), encoding='utf8').read())
OUT_ = a[0] if a else os.getcwd(); TEX_ = int(a[1]) if len(a) > 1 else 1024
W, H, D, t, TD = .66, 1.62, .64, .02, .045
yb = D / 2                  # Rückseite (Blender +y)
yf = -(D / 2 - TD)          # Vorderkante des Korpus; davor die Tür (bis −D/2)
K = []
K.append(cube(-W / 2, -W / 2 + t, yf, yb, .06, H, bev=.004))                       # linke Seite
K.append(cube(W / 2 - t, W / 2, yf, yb, .06, H, bev=.004))                         # rechte Seite
K.append(cube(-W / 2, W / 2, yb - t, yb, .06, H, bev=.004))                        # Rückwand
K.append(cube(-W / 2, W / 2, yf, yb, H - t, H, bev=.006, seg=3))                   # Decke
K.append(cube(-W / 2, W / 2, yf, yb, .06, .06 + t, bev=.004))                      # Boden
K.append(cube(-W / 2 + .03, W / 2 - .03, yf + .03, yb - .03, 0, .06, bev=.004, teil=1.))   # Sockel schwarz
# Innen: helle Auskleidung, drei Rosthaltete Glasböden, Gemüsefach, Dichtungsrahmen vorn
K.append(cube(-W / 2 + t, W / 2 - t, yb - t - .004, yb - t, .06 + t, H - t, bev=0, teil=7.))
for z in (.62, .95, 1.28):
  K.append(cube(-W / 2 + t + .005, W / 2 - t - .005, yf + .03, yb - t - .01, z - .004, z + .004, bev=.001, teil=3.))
  K.append(cube(-W / 2 + t + .005, W / 2 - t - .005, yf + .025, yf + .031, z - .004, z + .018, bev=.001, teil=2.))   # Chromkante
fach = cube(-W / 2 + t + .03, W / 2 - t - .03, yf + .04, yb - t - .03, .13, .30, bev=.006, seg=2, teil=5.)
cut(fach, cube(-W / 2 + t + .045, W / 2 - t - .045, yf + .055, yb - t - .045, .14, .32, bev=0)); K.append(fach)
K.append(cube(-W / 2 + t + .01, W / 2 - t - .01, yf - .004, yf + .008, .06 + t, H - t, bev=0, teil=1.))      # Dichtung: Rahmen …
# … als Rahmen: Mitte freischneiden
rahmen = K.pop()
cut(rahmen, cube(-W / 2 + t + .035, W / 2 - t - .035, yf - .02, yf + .02, .06 + t + .035, H - t - .035, bev=0)); K.append(rahmen)
K.append(cyl(0, yb - t - .01, H - .15, .02, .008, 'Y', teil=6., n=16))          # Innenlicht-Fassung
PARTS = [join(K, 'korpus')]
# Tür: Platte (außen Email), Innenseite mit Dichtung, drei Flaschen-/Eierfächer, Chromgriff links, Scharniere rechts
yd0, yd1 = -D / 2, yf           # Außen/innen (Blender −y = vorn)
d = [cube(-W / 2, W / 2, yd0, yd1, .06, H - .02, bev=.012, seg=4)]
d.append(cube(-W / 2 + .03, W / 2 - .03, yd1 - .002, yd1 + .006, .09, H - .05, bev=.004, teil=1.))     # Dichtungslippe innen
for z in (.5, .85, 1.2):
  d.append(cube(-W / 2 + .05, W / 2 - .05, yd1 + .004, yd1 + .06, z - .008, z + .008, bev=.002, teil=5.))   # Ablage
  d.append(cube(-W / 2 + .05, W / 2 - .05, yd1 + .056, yd1 + .062, z, z + .075, bev=.002, teil=5.))        # Bügel
gx = -W / 2 + .06
d.append(cyl(gx, yd0 - .028, 1.12, .0115, .36, 'Z', teil=2., n=16))                               # Griffstange
for zz in (.97, 1.27): d.append(cyl(gx, yd0 - .012, zz, .007, .03, 'Y', teil=2., n=12))
d.append(cube(-.07, .07, yd0 - .004, yd0 + .002, H - .17, H - .12, bev=.002, teil=2.))             # Chrom-Emblem
for zz in (.15, .8, 1.45): d.append(cyl(W / 2 + .004, yd0 + .03, zz, .008, .06, 'Z', teil=2., n=12))     # Scharnierhülsen
t_ = join(d, 'tuer'); origin(t_, (W / 2, -(D / 2 - TD / 2), 0)); PARTS.append(t_)
for o in PARTS: o.data.polygons.foreach_set('use_smooth', [False] * len(o.data.polygons))
for o in PARTS:
  sel([o])
  try: bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
  except Exception: bpy.ops.object.shade_smooth(); o.data.use_auto_smooth = True
TEILE = {1: dict(c=(.02, .02, .019), r=.8, rv=.1, dirt=.5), 2: dict(c=(.55, .55, .53), r=.22, rv=.1, m=1, cav=.6), 3: dict(c=(.74, .8, .78), r=.15, rv=.05, dirt=.3),
         5: dict(c=(.78, .86, .82), r=.2, rv=.1, dirt=.4), 6: dict(c=(.7, .68, .6), r=.4), 7: dict(c=(.86, .85, .8), r=.45, rv=.1, dirt=.5)}
finish(PARTS, 'kuehlschrank_tuer', TEILE, dict(paint=(.62, .6, .5), wear=.55, rust=.35, dirt=.9, dent=.4), TEX_, OUT_)
