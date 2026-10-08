import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const id = process.argv[2], meshName = process.argv[3], u0=+process.argv[4], u1=+process.argv[5], v0=+process.argv[6], v1=+process.argv[7];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const d = await io.read(`game/assets/chars/${id}/model.glb`);
for (const n of d.getRoot().listNodes()) { if (n.getName()!==meshName) continue; const p = n.getMesh().listPrimitives()[0];
  const pos = p.getAttribute('POSITION'), uv = p.getAttribute('TEXCOORD_0'), idx = p.getIndices();
  const N = idx ? idx.getCount() : pos.getCount(); let cnt=0, tot=0; const mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9]; const cl=[];
  for (let i=0;i<N;i+=3){ tot++; const a=[0,1,2].map(k=>idx?idx.getScalar(i+k):i+k); const us=a.map(k=>uv.getElement(k,[])); 
    if (us.every(u=>u[0]>=u0&&u[0]<=u1&&u[1]>=v0&&u[1]<=v1)) { cnt++; const c=[0,0,0]; for (const k of a){ const q=pos.getElement(k,[]); for(let j=0;j<3;j++){c[j]+=q[j]/3; mn[j]=Math.min(mn[j],q[j]); mx[j]=Math.max(mx[j],q[j]);} } cl.push(c);} }
  console.log(meshName, 'tris', tot, 'in-region', cnt, 'min', mn.map(x=>x.toFixed(1)), 'max', mx.map(x=>x.toFixed(1)));
  // coarse histogram of centroids by x/z
  const h={}; for(const c of cl){ const k=Math.round(c[0]/3)*3+','+Math.round(c[2]/3)*3; h[k]=(h[k]||0)+1;} console.log(Object.entries(h).sort((a,b)=>b[1]-a[1]).slice(0,12).join(' | '));
}
