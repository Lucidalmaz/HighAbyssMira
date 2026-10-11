const st=()=>'main='+G.story.main+' inB='+G.state.inBasement+' ch2='+G.ch2.on+' kap='+ev('kap()')+' talking='+G.state.talking+' ov='+G.ui.overlay+' pos='+F(P.toArray())+' items='+JSON.stringify(G.story.items);
G.state.talking=false; G.setScripted(null);
lg(await __USE(/Werkbank durchsuchen/,[26,-21],3,{wait:2500})); await W(1500); lg(st());
lg(await __USE(/Wand aufbrechen|Wand klingt hohl/,[298,296],4,{wait:3000})); await W(6000); lg(st());
lg('uebergang open='+ev('uebergang_S.open'));
