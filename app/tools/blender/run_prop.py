# Startet ein Bauskript und schreibt Ausgabe/Fehler in <ausgabeordner>/blender.log (der Store-Starter liefert keine Konsole).
#   blender -b --factory-startup --python run_prop.py -- <skript.py> <ausgabeordner> [weitere Argumente]
import sys, os, traceback, io, runpy
a = sys.argv[sys.argv.index('--') + 1:]
script, out = a[0], a[1]
os.makedirs(out, exist_ok=True)
log = open(os.path.join(out, 'blender.log'), 'w', encoding='utf8')
sys.stdout = log; sys.stderr = log
sys.argv = [script, '--'] + a[1:]
try:
  runpy.run_path(script, run_name='__main__')
  print('ENDE OK')
except BaseException:
  traceback.print_exc(file=log)
log.flush()
