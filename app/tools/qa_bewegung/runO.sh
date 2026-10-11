#!/bin/bash
cd /c/Users/GIGABYTE/_qa_bew
L=/c/Users/GIGABYTE/_live/normal1
for k in ${KAPS:-2 3 4 5 1 6}; do
  bash /c/Users/GIGABYTE/_live.sh reload >> runO.log 2>&1
  rm -rf $L/out/chainO_k$k
  cp chainO_k$k.json $L/in/chainO_k$k.tmp && mv $L/in/chainO_k$k.tmp $L/in/chainO_k$k.json
  until [ -f $L/out/chainO_k$k/result.json ]; do sleep 10; done
  echo "Kap $k fertig $(date +%H:%M)" >> runO.log
done
echo ALLE >> runO.log
