#!/bin/bash
# chain.sh N : frische Sitzung (Kapitelwahl N bzw. Neues Spiel bei 1), Item-Kette per E
N=$1; cd /c/Users/GIGABYTE/_zst; export PYTHONIOENCODING=utf-8
bash /c/Users/GIGABYTE/_live.sh reload > rl_c$N.log 2>&1
for i in $(seq 1 300); do grep -q '"state":"bereit"' /c/Users/GIGABYTE/_live/normal1/status.json && break; sleep 3; done
(cat chain_$N.js; cat chain.js) > chain_run_$N.js
if [ "$N" = 1 ]; then python mk.py c$N.json -s0 obs=obs.js obsfix=obsfix.js ch=chain_run_$N.js
else (echo "window.__N=$N;"; cat s1.js) > s1_c$N.js; python mk.py c$N.json -s0b obs=obs.js obsfix=obsfix.js s1=s1_c$N.js ch=chain_run_$N.js; fi
bash /c/Users/GIGABYTE/_live.sh run c$N.json out_c$N > c$N.log 2>&1
python show.py out_c$N ch > c${N}_res.txt 2>&1
echo done c$N
