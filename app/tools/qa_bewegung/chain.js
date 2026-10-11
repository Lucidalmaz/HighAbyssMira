// chain.js <kap> : baut chain_k<kap>.json = Kapitel wechseln, Fahrzeug-/Objekt-/Interaktionstests
const fs=require('fs');const kap=+process.argv[2];
const src=f=>fs.readFileSync(f,'utf8');
const MECH='tür|tuer|tor\b|tore\b|pforte|schublade|schrank|kommode|kühl|kuehl|herd|ofen|klappe|deckel|truhe|kiste|koffer|briefkasten|gully|luke|fenster|spind|kofferraum|handschuh|transporter|bus\b|auto|wagen|riegel|schloss|hebel|schalter|knopf|taste|regler|radio|telefon|hörer|fernseher|tonband|kassette|rekorder|funk|sicherung|kasten|tresor|safe|regal|vorhang|jalousie|laden|brunnen|kette|seil|leiter|tonne|container|fass|eimer|sarg|urne|bett|vitrine|schaukasten|uhr|spieluhr|lampe|laterne|kerze|fackel|gitter|tisch|stuhl|sessel|sofa|wanne|dusche|waschbecken|spüle|spuele|klo|toilette|ventil|kurbel|winde|rad\b|pumpe|zelt|schuppen|garage|hütte|huette|kapelle|glocke|orgel|klavier|piano|altar|kanzel|beichtstuhl|kreuz|tafel|schild|karte|regal|ordner|akte|archiv|zahlenschloss|code';
const steps=JSON.parse(fs.readFileSync('mk_'+kap+'.json','utf8'));
const add=(name,js,t)=>steps.push({name,shot:false,wait:100,timeout:t||900000,js});
add('cfgveh',`(() => { window.__BWCFG = { name: 'veh_k${kap}' }; return 'c'; })()`);
add('veh_test',src('veh_test.js'));
add('cfgobj',`(() => { window.__BWCFG = { kap: ${kap}, name: 'obj_k${kap}', budget: 100, max: 500 }; window.__BWOBJ = null; return 'c'; })()`);
for(let i=0;i<7;i++) add('obj_test',src('obj_test.js'));
add('cfgia',`(() => { window.__BWCFG = { kap: ${kap}, name: 'ia_k${kap}', budget: 85, reset: true, rx: ${JSON.stringify(MECH)} }; window.__IAINV = null; return 'c'; })()`);
add('ia_inv',src('ia_inv.js'));
add('cfgia2',`(() => { window.__BWCFG.reset = false; return 'c'; })()`);
for(let i=0;i<5;i++) add('ia_inv',src('ia_inv.js'));
add('cfgia3',`(() => { window.__BWCFG.dumpAlways = true; return 'c'; })()`);
add('ia_inv',src('ia_inv.js'));
add('hohl',src('hohl_stat.js').replace("out/hohl.json","out/hohl_k"+kap+".json"));
fs.writeFileSync('chain_k'+kap+'.json',JSON.stringify(steps));console.log('chain_k'+kap,steps.length);
