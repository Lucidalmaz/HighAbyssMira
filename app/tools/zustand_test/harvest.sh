#!/bin/bash
# harvest.sh N : frische Sitzung in Kapitel N, jede Interaktion einmal ausloesen, Funde sammeln
N=$1; cd /c/Users/GIGABYTE/_zst; export PYTHONIOENCODING=utf-8
bash /c/Users/GIGABYTE/_live.sh reload > rl_h$N.log 2>&1
for i in $(seq 1 300); do grep -q '"state":"bereit"' /c/Users/GIGABYTE/_live/normal1/status.json && break; sleep 3; done
(echo "const MAXMS=900000;"; cat ia_sweep.js) > ia_sweep_run.js
if [ "$N" = 1 ]; then
  python mk.py h$N.json -s0 obs=obs.js obsfix=obsfix.js sw=ia_sweep_run.js
else
  (echo "window.__N=$N;"; cat s1.js) > s1_h$N.js
  python mk.py h$N.json -s0b obs=obs.js obsfix=obsfix.js s1=s1_h$N.js sw=ia_sweep_run.js
fi
bash /c/Users/GIGABYTE/_live.sh run h$N.json out_h$N > h$N.log 2>&1
python - <<PY
import json,re
d=json.load(open('C:/Users/GIGABYTE/_zst/out_h$N/steps.json',encoding='utf-8'))['sw']
m=re.search(r'JSONBEGIN(.*)JSONEND',d,re.S)
open('C:/Users/GIGABYTE/_zst/harvest_$N.json','w',encoding='utf-8').write(m.group(1) if m else '[]')
print(d[:300])
PY
echo done $N
