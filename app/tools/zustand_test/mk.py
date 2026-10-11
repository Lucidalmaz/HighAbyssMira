import json,sys
# python mk.py out.json [-s0] name=file.js ...
out=sys.argv[1]; steps=[]
args=sys.argv[2:]
if args and args[0]=='-s0b':
    d=json.load(open('C:/Users/GIGABYTE/_abn56/barn.json',encoding='utf8'))[0]
    d['js']=d['js'].replace("G.beginGame && G.beginGame(); await W(5000);","await W(500);")
    steps.append(d); args=args[1:]
if args and args[0]=='-s0':
    steps.append(json.load(open('C:/Users/GIGABYTE/_abn56/barn.json',encoding='utf8'))[0]); args=args[1:]
steps.append(json.load(open('C:/Users/GIGABYTE/_abn56/n_lib_step.json',encoding='utf8')))
for a in args:
    n,f=a.split('=',1); body=open(f,encoding='utf8').read()
    js="Promise.race([ (async()=>{ const NL=String.fromCharCode(10),T=__T56,W=T.W,P=T.P,ev=T.ev,K=T.K,L=[],t0=performance.now(),lg=m=>L.push(((performance.now()-t0)/1000).toFixed(0)+'s '+m),F=T.fmt; try{\n"+body+"\n}catch(e){ lg('FEHLER '+e.stack.slice(0,500)); } return L.join(NL); })(), new Promise(r=>setTimeout(()=>r('STEP-TIMEOUT'), 580000)) ])"
    steps.append({"name":n,"shot":False,"wait":150,"timeout":600000,"js":js})
json.dump(steps,open(out,'w',encoding='utf8'))
