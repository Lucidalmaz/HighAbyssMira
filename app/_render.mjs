import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';
// node _render.mjs id azimuthDeg elevDeg out.png [hide regex of material names] [zoomHeight]
const [id, az, el, out, hide, only] = [process.argv[2], +process.argv[3], +process.argv[4], process.argv[5], process.argv[6] && new RegExp(process.argv[6], 'i'), process.argv[7] && new RegExp(process.argv[7], 'i')];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const d = await io.read(`game/assets/chars/${id}/model.glb`);
const texCache = new Map();
async function tex(t) { if (!t) return null; if (!texCache.has(t)) { const r = await sharp(Buffer.from(t.getImage())).resize(512, 512, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); texCache.set(t, r); } return texCache.get(t); }
const tris = [];
let head = null;
for (const n of d.getRoot().listNodes()) { const m = n.getMesh(); if (!m) continue; const W = n.getWorldMatrix();
  for (const p of m.listPrimitives()) { const mat = p.getMaterial(), mn = mat ? mat.getName() : ''; if (/eye|tear|cornea|teeth|tongue|occlusion|nails/i.test(mn)) continue; if (hide && hide.test(mn)) continue; if (only && !only.test(mn)) continue;
    const pos = p.getAttribute('POSITION'), uv = p.getAttribute('TEXCOORD_0'), idx = p.getIndices(); const N = idx ? idx.getCount() : pos.getCount();
    const T = mat && await tex(mat.getBaseColorTexture()); const bc = mat ? mat.getBaseColorFactor() : [1,1,1,1]; const mask = mat && mat.getAlphaMode() === 'MASK' ? mat.getAlphaCutoff() : -1;
    const V = k => { const q = pos.getElement(k, []); return [W[0]*q[0]+W[4]*q[1]+W[8]*q[2]+W[12], W[1]*q[0]+W[5]*q[1]+W[9]*q[2]+W[13], W[2]*q[0]+W[6]*q[1]+W[10]*q[2]+W[14]]; };
    for (let i = 0; i < N; i += 3) { const a = [0,1,2].map(k => idx ? idx.getScalar(i+k) : i+k); tris.push({ v: a.map(V), uv: a.map(k => uv ? uv.getElement(k, []) : [0,0]), T, bc, mask, mn }); } } }
// head box: use Std_Skin_Head extents in world
let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9,mnz=1e9,mxz=-1e9;
for (const t of tris) if ((process.env.FOCUS ? new RegExp(process.env.FOCUS,'i') : /skin_head/i).test(t.mn)) for (const v of t.v) { mnx=Math.min(mnx,v[0]);mxx=Math.max(mxx,v[0]);mny=Math.min(mny,v[1]);mxy=Math.max(mxy,v[1]);mnz=Math.min(mnz,v[2]);mxz=Math.max(mxz,v[2]); }
const c = [(mnx+mxx)/2,(mny+mxy)/2,(mnz+mxz)/2], ext = Math.max(mxx-mnx,mxy-mny,mxz-mnz);
// which axis is up? the larger vertical extent of the whole model: assume Y up if head y-range is the biggest and thin in z... use heuristic by model scale
const up = (mxz-mnz) > (mxy-mny) && (mxz-mnz) > (mxx-mnx)*0.9 && id!=='x' ? null : null;
// determine up axis: eyes position vs head center -> just test both: pick axis along which extent is largest (head is taller than wide)
const ex = [mxx-mnx, mxy-mny, mxz-mnz]; const upAxis = ex[1] >= ex[2] ? 1 : 2; const fwdAxis = upAxis === 1 ? 2 : 1;
const S = 900, zb = new Float32Array(S*S).fill(1e9), img = Buffer.alloc(S*S*3, 28); const sc = S / (ext*1.25);
const az_ = az*Math.PI/180, el_ = el*Math.PI/180;
// camera dir in head space: forward axis = face direction. Determine face direction sign by eye position
let faceSign = 1; { for (const n of d.getRoot().listNodes()) { const m=n.getMesh(); if(!m) continue; for (const p of m.listPrimitives()) { const mt=p.getMaterial(); if (mt && /Std_Eye_L/.test(mt.getName())) { const W=n.getWorldMatrix(), q=p.getAttribute('POSITION').getElement(0,[]); const f = W[fwdAxis]*q[0]+W[4+fwdAxis]*q[1]+W[8+fwdAxis]*q[2]+W[12+fwdAxis]; faceSign = f > c[fwdAxis] ? 1 : -1; } } } }
const proj = v => { const p = [v[0]-c[0], v[1]-c[1], v[2]-c[2]]; const u = p[upAxis], f = p[fwdAxis]*faceSign; const side = upAxis===1 ? p[0] : p[0]; // right-handedness ignored
  // rotate around vertical by az (0 = front view)
  const x = side*Math.cos(az_) + f*Math.sin(az_), z = -side*Math.sin(az_) + f*Math.cos(az_); // z toward camera
  const y = u*Math.cos(el_) - z*Math.sin(el_), z2 = u*Math.sin(el_) + z*Math.cos(el_);
  return [S/2 + x*sc, S/2 - y*sc, -z2, x, y, z2]; };
const L = [0.4, 0.5, 0.75]; 
for (const t of tris) { const P = t.v.map(proj); const [a,b,cc] = P; const minx=Math.max(0,Math.floor(Math.min(a[0],b[0],cc[0]))), maxx=Math.min(S-1,Math.ceil(Math.max(a[0],b[0],cc[0]))), miny=Math.max(0,Math.floor(Math.min(a[1],b[1],cc[1]))), maxy=Math.min(S-1,Math.ceil(Math.max(a[1],b[1],cc[1])));
  const den = (b[1]-cc[1])*(a[0]-cc[0]) + (cc[0]-b[0])*(a[1]-cc[1]); if (Math.abs(den) < 1e-9) continue;
  // normal in view space for shading
  const e1=[b[3]-a[3],b[4]-a[4],b[5]-a[5]], e2=[cc[3]-a[3],cc[4]-a[4],cc[5]-a[5]]; let nn=[e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]]; const nl=Math.hypot(...nn)||1; nn=nn.map(x=>x/nl); const ndl = Math.abs(nn[0]*L[0]+nn[1]*L[1]+nn[2]*L[2]);
  for (let y=miny;y<=maxy;y++) for (let x=minx;x<=maxx;x++) { const l1=((b[1]-cc[1])*(x+.5-cc[0])+(cc[0]-b[0])*(y+.5-cc[1]))/den, l2=((cc[1]-a[1])*(x+.5-cc[0])+(a[0]-cc[0])*(y+.5-cc[1]))/den, l3=1-l1-l2; if (l1<0||l2<0||l3<0) continue;
    const z = l1*a[2]+l2*b[2]+l3*cc[2]; if (z >= zb[y*S+x]) continue; let r=t.bc[0]*255,g=t.bc[1]*255,bl=t.bc[2]*255,al=t.bc[3];
    if (t.T) { const u = l1*t.uv[0][0]+l2*t.uv[1][0]+l3*t.uv[2][0], v = l1*t.uv[0][1]+l2*t.uv[1][1]+l3*t.uv[2][1]; const tx=Math.min(511,Math.max(0,Math.floor((u%1+1)%1*512))), ty=Math.min(511,Math.max(0,Math.floor((v%1+1)%1*512))), o=(ty*512+tx)*4; const D=t.T.data; r*=D[o]/255; g*=D[o+1]/255; bl*=D[o+2]/255; al*=D[o+3]/255; }
    if (t.mask >= 0 && al < t.mask) continue; if (process.env.HL2 && /_0$/.test(t.mn)) { r=40; g=80; bl=255; } if (process.env.HL && t.T && t.mask>=0) { const u=l1*t.uv[0][0]+l2*t.uv[1][0]+l3*t.uv[2][0]; if (u>0.97 && u<1.0 && !/_0$/.test(t.mn)) { r=255; g=0; bl=0; } } zb[y*S+x]=z; const sh=.35+.65*ndl; const o3=(y*S+x)*3; img[o3]=Math.min(255,r*sh); img[o3+1]=Math.min(255,g*sh); img[o3+2]=Math.min(255,bl*sh); } }
await sharp(img, { raw: { width: S, height: S, channels: 3 } }).png().toFile(out);
console.log('ok up', upAxis, 'fwd', fwdAxis, faceSign, 'tris', tris.length);
