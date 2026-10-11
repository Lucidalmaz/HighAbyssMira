#!/bin/bash
# s3.sh N TAG : Schrift-Audit in Kapitel-N-Sitzung
N=$1; TAG=${2:-a}; cd /c/Users/GIGABYTE/_zst; export PYTHONIOENCODING=utf-8
bash /c/Users/GIGABYTE/_live.sh reload > rl_s3.log 2>&1
for i in $(seq 1 300); do grep -q '"state":"bereit"' /c/Users/GIGABYTE/_live/normal1/status.json && break; sleep 3; done
(echo "window.__N=$N;"; cat s1.js) > s1_s3.js
cp /c/Users/GIGABYTE/_fx/qa_c_schrift.js sch_body.js
if [ "$N" = 1 ]; then python mk.py s3$TAG.json -s0 sch=sch_body.js; else python mk.py s3$TAG.json -s0b s1=s1_s3.js sch=sch_body.js; fi
bash /c/Users/GIGABYTE/_live.sh run s3$TAG.json out_s3$TAG > s3$TAG.log 2>&1
python - <<PY
import json
d=json.load(open('C:/Users/GIGABYTE/_zst/out_s3$TAG/steps.json',encoding='utf-8'))['sch']
open('C:/Users/GIGABYTE/_zst/s3$TAG.res.json','w',encoding='utf-8').write(d)
print(len(d), d[:300])
PY
echo done s3$TAG
