#!/bin/bash
# loadtest.sh NAME : Neuladen, Weiterspielen, Snapshot NAME (liegt nach out_NAME/steps.json)
cd /c/Users/GIGABYTE/_zst; export PYTHONIOENCODING=utf-8
bash /c/Users/GIGABYTE/_live.sh reload > rl_$1.log 2>&1
for i in $(seq 1 240); do grep -q '"state":"bereit"' /c/Users/GIGABYTE/_live/normal1/status.json && break; sleep 3; done
python mk.py $1.json -s0b obs=obs.js obsfix=obsfix.js cont=cont.js
bash /c/Users/GIGABYTE/_live.sh run $1.json out_$1 > $1.log 2>&1
python - <<PY
import json,re
d=json.load(open('C:/Users/GIGABYTE/_zst/out_$1/steps.json',encoding='utf-8'))['cont']
m=re.search(r'SNAPBEGIN(.*)SNAPEND',d,re.S)
open('C:/Users/GIGABYTE/_zst/$1_snap.json','w',encoding='utf-8').write(m.group(1) if m else '{}')
print(d[:200])
PY
python cmp.py ${2:-snapB.json} $1_snap.json > $1_cmp.txt
echo done $1
