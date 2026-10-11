#!/bin/bash
cd /c/Users/GIGABYTE/_qa_bew
L=/c/Users/GIGABYTE/_live/normal1
for k in ${KAPS:-1 2 3 4 5 6}; do
  if [ "${RELOAD:-1}" = 1 ]; then bash /c/Users/GIGABYTE/_live.sh reload >> runall2.log 2>&1; fi
  rm -rf $L/out/chain2_k$k
  cp chain2_k$k.json $L/in/chain2_k$k.tmp && mv $L/in/chain2_k$k.tmp $L/in/chain2_k$k.json
  until [ -f $L/out/chain2_k$k/result.json ]; do sleep 10; done
  echo "Kap $k fertig $(date +%H:%M)" >> runall2.log
done
echo ALLE >> runall2.log
