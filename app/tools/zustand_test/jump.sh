#!/bin/bash
# jump.sh N : Neuladen, Kapitelwahl N, 60 s beobachten, Zustand ausgeben
N=$1; cd /c/Users/GIGABYTE/_zst
[ "$2" = noreload ] || bash /c/Users/GIGABYTE/_live.sh reload > rl_$N.log 2>&1
for i in $(seq 1 240); do grep -q '"state":"bereit"' /c/Users/GIGABYTE/_live/normal1/status.json && break; sleep 3; done
(echo "window.__N=$N;"; cat s1.js) > s1_$N.js
python mk.py j$N.json -s0b obs=obs.js obsfix=obsfix.js s1=s1_$N.js chk=chk.js
bash /c/Users/GIGABYTE/_live.sh run j$N.json out_j$N > j$N.log 2>&1
python ev.py out_j$N s1 > j${N}_ev.txt 2>&1
python show.py out_j$N chk > j${N}_chk.txt 2>&1
echo done $N
