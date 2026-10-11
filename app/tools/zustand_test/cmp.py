import json,sys
def load(p):
    d=json.load(open(p,encoding='utf-8'))
    s=d.get(sys.argv[3]) if len(sys.argv)>3 else None
    return d
a=json.load(open(sys.argv[1],encoding='utf-8')); b=json.load(open(sys.argv[2],encoding='utf-8'))
def flat(o,p=''):
    out={}
    if isinstance(o,dict):
        for k,v in o.items(): out.update(flat(v,p+'/'+k))
    elif isinstance(o,list):
        if all(not isinstance(x,(dict,list)) for x in o): out[p]=sorted(map(str,o)) if len(o)>1 and p.split('/')[-1] not in ('seq',) else o
        else:
            for i,v in enumerate(o): out.update(flat(v,p+'/'+str(i)))
    else: out[p]=o
    return out
A,B=flat(a),flat(b)
skip=('/t','/at','/obj')
n=0
for k in sorted(set(A)|set(B)):
    if k.endswith('/t') or k=='/t' or '/at' in k: continue
    if A.get(k)!=B.get(k):
        n+=1; print('DIFF',k,'|',str(A.get(k))[:90],'->',str(B.get(k))[:90])
print('differenzen',n,'von',len(set(A)|set(B)))
