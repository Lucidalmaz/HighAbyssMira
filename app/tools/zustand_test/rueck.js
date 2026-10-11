// Rueck-Teleport: Orte frueherer Kapitel besuchen; es darf nichts Erledigtes wiederkommen
__OBS.reset();
const pts=[['Nr.7 Kueche',28,-16],['Nr.7 Wohnzimmer',25,-13],['Nr.7 Keller',302,297],['Kreuzung',2,0],['Telefonzelle',8,6],['Lucys Auto',2,-36],['Nr.5 Asche',-13,-10],['Nr.1 Kinderzimmer',-52,-20],['Nr.3 Vegas',-28,-11],
 ['Amt Tunnel',603,-2600],['Amt Archiv',628,-2600],['Amt Zimmer 7',633,-2602],['Amt Messraum',715,-2597],['Kap3 Weiss',-600,-2600],['Kanal',-1400,1400],['Villa Tor',-125,56],['Tankstelle',112,24],['Friedhof',-45,72]];
const out=[];
for(const [n,x,z] of pts){ const k0=__OBS.log.length; const y=ev('solidGround')(x,1,z); T.tp(x,isFinite(y)?y:0,z); G.state.talking=false; await W(4200); const ev_=__OBS.log.slice(k0).map(o=>o.f+':'+o.s.slice(0,70)); out.push(n+' @'+x+','+z+' -> '+(ev_.length?ev_.join(' || '):'(nichts)')); }
for(const l of out) lg(l);
lg('kap='+ev('kap()')+' ch3.callDone='+G.ch3.callDone+' items='+G.story.items.length+' lore='+G.story.lore.length);
