#!/bin/bash
cd /c/Users/GIGABYTE/_qa_bew
L=/c/Users/GIGABYTE/_live/normal1
for k in 1 2 3 4 5 6; do
  bash /c/Users/GIGABYTE/_live.sh reload >> runI.log 2>&1
  rm -rf $L/out/chainI_k$k
  cp chainI_k$k.json $L/in/chainI_k$k.tmp && mv $L/in/chainI_k$k.tmp $L/in/chainI_k$k.json
  until [ -f $L/out/chainI_k$k/result.json ]; do sleep 8; done
  echo "Kap $k fertig $(date +%H:%M)" >> runI.log
done
echo ALLE >> runI.log
