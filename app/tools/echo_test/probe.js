(async () => { const W = ms => new Promise(r => setTimeout(r, ms)); const out = {};
 const ground = (x, y, z) => { let g = -Infinity; for (const c of G.colliders) if (c.minX > -9000 && c.top < 90 && c.top > g && c.top <= y + .6 && c.top >= y - .5 && x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) g = c.top; return g === -Infinity ? null : +g.toFixed(2); };
 const sg = (x, y, z) => { try { const v = G.solidGround(x, y, z); return v === -Infinity ? null : +v.toFixed(2); } catch (e) { return 'E'; } };
 const wall = (x, z) => G.colliders.some(c => c.minX > -9000 && c.top > 90 && x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) ? 1 : 0;
 const grid = (name, x0, x1, z0, z1, dx, dz, y) => { G.player.pos.set((x0 + x1) / 2 + 2, y, (z0 + z1) / 2 + 2); const rows = []; for (let z = z0; z <= z1 + 1e-6; z += dz) { const r = []; for (let x = x0; x <= x1 + 1e-6; x += dx) r.push((wall(x, z) ? 'W' : '') + (ground(x, y + .1, z) ?? '.') + '/' + (sg(x, y + .5, z) ?? '.')); rows.push('z' + z.toFixed(2) + ': ' + r.join(' ')); } out[name] = rows; };
 G.player.pos.set(24, 0, 10); await W(1200);
 grid('treppe6 x20..24', 20.5, 23.5, 11.8, 13.0, .5, .2, 0);
 out.cols_treppe = G.colliders.filter(c => c.minX > -9000 && c.maxX > 19 && c.minX < 25 && c.maxZ > 11.4 && c.minZ < 13.6).map(c => [c.minX, c.maxX, c.minZ, c.maxZ, c.top, c.base].map(n => +n.toFixed(2)));
 G.player.pos.set(36, 0, 66); await W(1200);
 grid('karussell', 32.4, 35.4, 68.8, 71.2, .5, .4, 0);
 out.cols_karussell = G.colliders.filter(c => c.minX > -9000 && c.maxX > 31 && c.minX < 37 && c.maxZ > 67 && c.minZ < 73).map(c => [c.minX, c.maxX, c.minZ, c.maxZ, c.top, c.base].map(n => +n.toFixed(2)));
 G.player.pos.set(27, .43, -12); await W(1200);
 grid('kueche', 26.8, 31.2, -17.4, -14.2, .6, .4, .43);
 out.cols_kueche = G.colliders.filter(c => c.minX > -9000 && c.maxX > 26 && c.minX < 32 && c.maxZ > -18 && c.minZ < -13.5 && c.top < 90).map(c => [c.minX, c.maxX, c.minZ, c.maxZ, c.top, c.base].map(n => +n.toFixed(2)));
 G.player.pos.set(-48, .43, -17); await W(1200);
 grid('kinderzimmer', -53.4, -50.4, -20.8, -18.8, .4, .4, .43);
 return JSON.stringify(out, null, 1);
})()
