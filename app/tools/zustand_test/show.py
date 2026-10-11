import json,sys
d=json.load(open(sys.argv[1]+'/steps.json',encoding='utf-8'))
for k,v in d.items():
    if len(sys.argv)>2 and k not in sys.argv[2:]: continue
    print('==',k); print(v if isinstance(v,str) else json.dumps(v,ensure_ascii=False)[:8000])
