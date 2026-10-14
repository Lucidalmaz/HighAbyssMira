// =====================================================================  OBERFLÄCHE 2 (Modul „ui2“, Auftrag 14.10.2026): ein Stil für alle Anzeigen – „Akte & Blech“
// Echte Texturen (lokal, assets/ui: Blech- und Betonscan aus den Spiel-Oberflächen; assets/ms/papier: Papierfaser), echte Schriften (OFL, lokal), nichts gemalt.
// Nur Aussehen: eigene Stilregeln NACH allen anderen Modulen, keine Ids/Handler der Basis werden verändert.
// Zusätzlich zwei kleine Verhalten: (1) Gefahr – steigt die Furcht-Vignette, zittert die Anzeige kaum merklich (Klasse u2-gefahr),
// (2) Todesbildschirm – Kreide-Strichliste der Tode (Fünfergruppen, wie die Kinder zählen).
const U2_CSS = `/* ====================================================================  OBERFLÄCHE 2 – „Akte & Blech“ (Modul ui2)
   Ein Stil für alles: rostiges Blech (echte Textur), Aktenpapier (echter Scan), Kreide, Ruß, Blutrot sparsam.
   Schriften: IM Fell English (SC) Titel · Special Elite Schreibmaschine · Alegreya Sans (SC) Beschriftung · Cormorant Garamond Fließtext · Covered By Your Grace Kreide. */
:root {
  --u-blech: url(assets/ui/blech.jpg);
  --u-beton: url(assets/ui/beton.jpg);
  --u-faser: url(assets/ms/papier/faser.jpg);
  --u-bein: #e4dac3; --u-bein2: #b9ad92; --u-asche: #8f846e;
  --u-blut: #8e1d15; --u-blut2: #b3261a; --u-oche: #b8a47c;
  --u-titel: "IM Fell English SC", "IM Fell English", Georgia, serif;
  --u-schreib: "Special Elite", "Courier Prime", monospace;
  --u-kreide: "Covered By Your Grace", "Caveat", cursive;
  --u-ui: var(--f-ui-sc, "Alegreya Sans SC", "Alegreya Sans", Georgia, serif);
  --u-ui2: var(--f-ui, "Alegreya Sans", Georgia, serif);
  --gold: #c2ad84; --gold2: #7d6c4c; --line: rgba(214,200,168,.2);
}

/* ---------------------------------------------------------------- Tastenkappe (überall gleich)  */
.hint kbd, kbd.k, #prompt kbd, #fsTipp kbd, #hudHint kbd {
  display: inline-block; min-width: 1.25em; padding: .18em .55em .1em; margin: 0 .35em 0 0; font: 600 .86em var(--u-ui); letter-spacing: .06em; text-align: center; color: #1b140d;
  background: linear-gradient(180deg, #efe6d0 0%, #d3c6a6 55%, #b3a584 100%); border: 0; border-radius: 3px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.7), inset 0 -2px 0 rgba(70,52,28,.45), 0 1px 0 #2a2218, 0 3px 6px rgba(0,0,0,.65); text-shadow: 0 1px 0 rgba(255,255,255,.4); }

/* ---------------------------------------------------------------- Platten: Blech, Nieten, Gebrauchsspuren  */
.panel { position: relative; background:
    linear-gradient(180deg, rgba(10,8,6,.55), rgba(5,4,3,.82)),
    radial-gradient(90% 60% at 50% 0%, rgba(120,92,60,.16), transparent 70%),
    var(--u-blech) 0 0 / 520px 520px;
  background-blend-mode: normal, normal, normal; border: 1px solid #000; border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(255,236,200,.07), inset 0 0 0 6px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,236,200,.1), inset 0 0 90px rgba(0,0,0,.75), 0 40px 120px rgba(0,0,0,.9); }
.panel::before { content: ''; position: absolute; inset: 0; width: auto; height: auto; border: 0; transform: none; opacity: 1; pointer-events: none; border-radius: inherit;
  background:
    radial-gradient(circle at 38% 32%, #a49b88 0 14%, #5c564a 40%, #17140f 66%, transparent 70%) left 11px top 11px / 13px 13px no-repeat,
    radial-gradient(circle at 38% 32%, #a49b88 0 14%, #5c564a 40%, #17140f 66%, transparent 70%) right 11px top 11px / 13px 13px no-repeat,
    radial-gradient(circle at 38% 32%, #a49b88 0 14%, #5c564a 40%, #17140f 66%, transparent 70%) left 11px bottom 11px / 13px 13px no-repeat,
    radial-gradient(circle at 38% 32%, #a49b88 0 14%, #5c564a 40%, #17140f 66%, transparent 70%) right 11px bottom 11px / 13px 13px no-repeat,
    linear-gradient(180deg, rgba(0,0,0,0) 85%, rgba(60,18,10,.16)); }
.panel::after { content: none; }
.ptitle, #pause .t { font: 400 clamp(16px, 1.15vw, 22px) var(--u-titel); letter-spacing: .5em; text-indent: .5em; color: var(--u-bein); text-shadow: 0 1px 0 #000, 0 0 18px rgba(0,0,0,.8); margin: 4px 0 24px; padding-bottom: 15px;
  background: linear-gradient(90deg, transparent, rgba(228,218,195,.34) 18%, rgba(228,218,195,.34) 82%, transparent) bottom / 100% 1px no-repeat; }
#pause .t { font-size: clamp(26px, 2.1vw, 40px); letter-spacing: .42em; margin-bottom: 26px; }

/* ---------------------------------------------------------------- Schalter (Pause, Unterfenster, Aktenfälle)  */
#subPanel .close button, #pause .pbtns button, .case button, #todScreen button {
  position: relative; background: linear-gradient(180deg, rgba(255,240,205,.045), rgba(0,0,0,.34)); border: 1px solid rgba(214,200,168,.2); border-radius: 1px; color: #d9cfb7;
  font: 600 clamp(13px, .95vw, 17px) var(--u-ui); letter-spacing: .34em; text-indent: .34em; padding: 11px 30px; cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,240,205,.07), inset 0 -6px 14px rgba(0,0,0,.35), 0 2px 5px rgba(0,0,0,.6); transition: color .2s, border-color .2s, background .25s, transform .12s; }
#subPanel .close button:hover, #pause .pbtns button:hover, .case button:hover, #todScreen button:hover, #todScreen button:focus-visible, #pause .pbtns button:focus-visible {
  color: #fff7e4; border-color: rgba(190,60,44,.7); background: linear-gradient(180deg, rgba(142,29,21,.22), rgba(40,6,4,.45)); box-shadow: inset 3px 0 0 var(--u-blut2), inset 0 -6px 14px rgba(0,0,0,.35), 0 0 22px rgba(142,29,21,.28); outline: none; }
#subPanel .close button:active, #pause .pbtns button:active { transform: translateY(1px); }
#pause .pbtns { gap: 9px; }
#pause .panel label { color: #b9ad92; font: 500 clamp(14px, 1vw, 18px) var(--u-ui2); letter-spacing: .04em; }
#pause .panel .t:not(:first-child), #pause .panel > div[style] { color: #7f7461 !important; font-family: var(--u-schreib) !important; letter-spacing: .14em; }

/* Regler: rostiger Schieber statt Messing-Raute */
input[type=range]::-webkit-slider-runnable-track { height: 3px; background: linear-gradient(90deg, #a8321f var(--p, 50%), rgba(214,200,168,.16) var(--p, 50%)); box-shadow: inset 0 1px 0 rgba(0,0,0,.6); border-radius: 2px; }
input[type=range]::-webkit-slider-thumb { width: 10px; height: 20px; margin-top: -8.5px; transform: none; border-radius: 1px; background: linear-gradient(90deg, #8d8472, #d5ccb6 45%, #7b7362); box-shadow: 0 0 0 1px #000, 0 3px 6px rgba(0,0,0,.7); }
input[type=range]:hover::-webkit-slider-thumb { box-shadow: 0 0 0 1px #000, 0 0 14px rgba(190,60,44,.6); }
input[type=checkbox] { border-color: rgba(214,200,168,.45); border-radius: 1px; }
input[type=checkbox]:checked { border-color: var(--u-blut2); }

/* ---------------------------------------------------------------- HUD  */
#hud { text-rendering: optimizeLegibility; }
#objective { top: clamp(18px, 2.4vh, 30px); left: clamp(22px, 2.2vw, 40px); max-width: min(30vw, 520px); padding: 4px 0 4px 16px; border-left: 1px solid rgba(214,200,168,.22); }
#objective::before { content: ''; position: absolute; inset: -22px -60px -22px -30px; z-index: -1; pointer-events: none; background: radial-gradient(closest-side, rgba(0,0,0,.5), transparent); }
#objective > b { font: 400 clamp(12px, .8vw, 15px) var(--u-schreib); letter-spacing: .38em; color: #b4a688; text-shadow: 0 1px 2px #000, 0 0 10px #000; margin-bottom: 4px; }
#objective > b::before { content: ''; position: absolute; left: -1px; top: 6px; width: 3px; height: 14px; background: var(--u-blut2); box-shadow: 0 0 8px rgba(190,40,30,.6); }
#objPhase { font: 500 clamp(11px, .75vw, 14px) var(--u-ui) !important; letter-spacing: .26em; color: #8d826b !important; }
#objText { color: #ece3cd; text-shadow: 0 1px 3px #000, 0 0 14px #000; }
#sideInfo { color: #8f846e; }
#prompt { top: 58%; font: 500 clamp(17px, 1.2vw, 23px) var(--u-ui2); letter-spacing: .08em; color: #ece3cd; text-shadow: 0 1px 3px #000, 0 0 16px #000; padding: 6px 18px; }
#prompt::before { content: ''; position: absolute; inset: -6px -26px; z-index: -1; background: radial-gradient(closest-side, rgba(0,0,0,.5), transparent); }
#prompt kbd { font-size: .8em; }
#subtitle { text-shadow: 0 1px 3px #000, 0 0 12px #000; }
#subtitle::before { content: ''; position: absolute; inset: -28px -9vw -20px; z-index: -1; pointer-events: none; background: radial-gradient(closest-side, rgba(0,0,0,.6), rgba(0,0,0,.3) 60%, transparent); }
#toast { top: 66%; text-shadow: 0 1px 3px #000, 0 0 14px #000; }
#toast:not(:empty)::before { content: ''; position: absolute; inset: -22px -7vw; z-index: -1; pointer-events: none; background: radial-gradient(closest-side, rgba(0,0,0,.55), transparent); }
#questPop { top: clamp(18px, 2.4vh, 30px); right: clamp(22px, 2.2vw, 40px); padding: 4px 16px 4px 0; border-right: 1px solid rgba(214,200,168,.22); }
#questPop::before { content: ''; position: absolute; inset: -22px -30px -22px -60px; z-index: -1; pointer-events: none; background: radial-gradient(closest-side, rgba(0,0,0,.5), transparent); }
#questPop small { font: 400 clamp(12px, .8vw, 15px) var(--u-schreib); letter-spacing: .3em; color: #c2ad84; }
#questPop span { text-shadow: 0 1px 3px #000, 0 0 14px #000; }
#crosshair { width: 3px; height: 3px; margin: -1.5px; background: rgba(236,226,200,.55); box-shadow: 0 0 0 1px rgba(0,0,0,.45); }
#crosshair.on { width: 16px; height: 16px; margin: -8px; background: radial-gradient(circle, rgba(255,244,215,.95) 0 1.4px, transparent 1.9px); border: 1px solid rgba(236,226,200,.62); box-shadow: 0 0 0 1px rgba(0,0,0,.35), 0 0 10px rgba(255,220,160,.18); }
#hudHint { font: 400 clamp(10px, .72vw, 13px) var(--u-schreib); letter-spacing: .3em; color: #8f846e; }

/* Gefahr: die Anzeige zittert kaum merklich (Klasse u2-gefahr setzt ui2.js nach der Furcht-Vignette) */
@keyframes u2Zit { 0% { transform: translate(0, 0); } 25% { transform: translate(.6px, -.5px); } 50% { transform: translate(-.5px, .4px); } 75% { transform: translate(.4px, .6px); } 100% { transform: translate(0, 0); } }
body.u2-gefahr #objective, body.u2-gefahr #questPop { animation: u2Zit .16s steps(1) infinite; }
body.u2-gefahr #objText, body.u2-gefahr #subtitle { text-shadow: 0 1px 3px #000, 1px 0 0 rgba(160,20,12,.45), -1px 0 0 rgba(30,60,110,.35), 0 0 14px #000; }

/* ---------------------------------------------------------------- Zettel: Klebeband mit Faser und gerissener Kante  */
#note .paper::before { width: 118px; height: 34px; margin-left: -59px; top: 4px; background: var(--u-faser) center / 300px, linear-gradient(90deg, rgba(120,100,60,.2), rgba(255,250,225,.12) 40%, rgba(120,100,60,.2));
  background-blend-mode: multiply; background-color: rgba(214,200,150,.74); box-shadow: 0 1px 2px rgba(0,0,0,.35); -webkit-mask: none; mask: none;
  clip-path: polygon(0 8%, 3% 0, 6% 10%, 10% 2%, 14% 9%, 20% 0, 30% 8%, 40% 1%, 52% 9%, 63% 0, 74% 8%, 86% 1%, 94% 9%, 100% 2%, 99% 92%, 95% 100%, 88% 91%, 78% 100%, 66% 92%, 55% 100%, 44% 91%, 33% 100%, 22% 92%, 12% 100%, 5% 92%, 0 100%); }

/* ---------------------------------------------------------------- Kapitelkarte, Ortsmarke, Tipp  */
#fsKarte { background: radial-gradient(ellipse at 50% 48%, rgba(0,0,0,.84), rgba(0,0,0,.72) 55%, rgba(0,0,0,.5)); }
#fsKarte::before, #todScreen::before { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: var(--u-beton) center / cover; mix-blend-mode: overlay; opacity: .5; }
#fsKarte .k { max-width: min(1000px, 88vw); position: relative; padding: 42px 0 38px; }
#fsKarte .k::before, #fsKarte .k::after { content: ''; position: absolute; left: 50%; width: min(520px, 60vw); height: 1px; margin-left: calc(min(520px, 60vw) / -2); background: linear-gradient(90deg, transparent, rgba(214,200,168,.45), transparent); }
#fsKarte .k::before { top: 0; } #fsKarte .k::after { bottom: 0; }
#fsKarte small { font: 400 clamp(20px, 1.9vw, 38px) var(--u-titel); letter-spacing: .34em; text-indent: .34em; color: var(--u-bein); margin-bottom: 22px; text-shadow: 0 2px 0 #000, 0 0 30px rgba(0,0,0,.9); }
#fsKarte b { font: 400 clamp(16px, 1.2vw, 23px) var(--u-schreib); letter-spacing: .1em; color: #b9ad92; margin-bottom: 22px; }
#fsKarte .bi i { font-size: clamp(19px, 1.4vw, 27px); color: #d6ccb4; opacity: .9; }
#fsKarte em { font: 600 clamp(15px, 1.05vw, 21px) var(--u-ui); letter-spacing: .2em; color: #e4dac3; margin-top: 14px; display: inline-block; padding: 7px 18px 6px; border: 1px solid rgba(190,60,44,.55); background: rgba(80,12,8,.28); }
#fsKarte u { font: 400 clamp(11px, .78vw, 14px) var(--u-schreib); letter-spacing: .3em; color: #756b58; }

#fsOrt { left: clamp(26px, 2.4vw, 46px); padding-left: 16px; border-left: 2px solid var(--u-blut); }
#fsOrt::before { content: ''; position: absolute; inset: -20px -50px -20px -30px; z-index: -1; background: radial-gradient(closest-side, rgba(0,0,0,.5), transparent); }
#fsOrt b { font: 400 clamp(19px, 1.45vw, 29px) var(--u-titel); letter-spacing: .3em; color: var(--u-bein); }
#fsOrt span { font: 400 clamp(15px, 1.05vw, 20px) var(--u-schreib); letter-spacing: .1em; color: #a89c82; margin-top: 6px; }

#fsTipp { left: clamp(26px, 2.4vw, 46px); padding: 6px 0 6px 16px; border-left: 2px solid rgba(214,200,168,.3); }
#fsTipp::before { content: ''; position: absolute; inset: -18px -40px -14px -26px; z-index: -1; background: radial-gradient(closest-side, rgba(0,0,0,.5), transparent); }
#fsTipp kbd { font-size: clamp(13px, .92vw, 17px); }
#fsTipp p { color: #e0d6bd; }

/* ---------------------------------------------------------------- Todesbildschirm: Kreide-Strichliste statt Zierrat  */
#todScreen { background: radial-gradient(ellipse at 50% 46%, rgba(46,6,4,.5), rgba(0,0,0,.95) 72%); isolation: isolate; }
#todScreen .tt { font: 400 clamp(12px, .9vw, 16px) var(--u-schreib); letter-spacing: .5em; color: #7d705b; }
#todScreen h1 { font: 400 clamp(40px, 5.6vw, 88px) "IM Fell English", Georgia, serif; letter-spacing: .16em; color: #a3211a; text-shadow: 0 0 40px rgba(150,10,6,.55), 0 3px 0 #000; }
#todScreen .orn { background: none; width: auto; height: auto; margin: 26px 0 22px; font: 400 clamp(30px, 2.6vw, 48px)/1 var(--u-kreide); letter-spacing: .12em; color: #e4dac3; opacity: 0; text-shadow: 0 0 10px rgba(255,255,255,.2); }
#todScreen .orn s { text-decoration: none; position: relative; display: inline-block; margin-right: .5em; }
#todScreen .orn s::after { content: ''; position: absolute; left: -.2em; right: -.1em; top: 52%; height: 3px; background: currentColor; transform: rotate(-24deg); opacity: .9; border-radius: 2px; }
#todScreen .line { font: italic clamp(20px, 1.5vw, 28px)/1.5 "Cormorant Garamond", Georgia, serif; color: #cfc4aa; }
#todScreen .cp { font-family: var(--u-schreib); color: #7d705b; }
#todScreen button { font-size: clamp(12px, .9vw, 16px); }
#todScreen button.sec { color: #8f846e; border-color: rgba(214,200,168,.12); }
#todScreen .keys { font-family: var(--u-schreib); }

/* ---------------------------------------------------------------- Fibel: Lederdeckel aus Blech-Scan, Papier mit Faser, Platz für die Taste unten  */
#journal .book { max-height: 83vh; background: linear-gradient(180deg, rgba(58,36,20,.78), rgba(26,15,8,.9)), var(--u-blech) 0 0 / 600px; box-shadow: 0 0 0 1px #000, inset 0 0 40px rgba(0,0,0,.6), 0 40px 100px #000; }
#jBody { max-height: calc(83vh - 96px); }
#journal .book::after { content: ''; position: absolute; left: 18px; right: 18px; bottom: 18px; top: 58px; pointer-events: none; background: var(--u-faser) center / 480px; mix-blend-mode: multiply; opacity: .32; border-radius: 2px; }

/* ---------------------------------------------------------------- Hauptmenü: passt in jede Höhe ab 720 px  */
@media (max-height: 940px) {
  #menu { padding: 12px 0 44px; }
  #start h1 { font-size: clamp(26px, min(5.4vw, 6.4vh), 70px); }
  #start .orn { margin: 1.1vh 0 .5vh; }
  #start .sub { margin-bottom: 2vh; }
  #start #menu .dir { margin: 0 0 calc(1.4vh + 24px) !important; }
  #mainMenu button { font-size: clamp(17px, 3.1vh, 25px); padding-top: .55vh; padding-bottom: .55vh; }
  #mainMenu button small { font-size: clamp(10px, 1.3vh, 12px); margin-top: 0; }
}

/* ---------------------------------------------------------------- Rätsel-Fenster (Klavier, Uhr, Funk, Reihenfolge …): Blechplatte statt Messingschild  */
#puzzle .box { position: relative; background: linear-gradient(180deg, rgba(10,8,6,.55), rgba(5,4,3,.82)), radial-gradient(90% 60% at 50% 0%, rgba(120,92,60,.16), transparent 70%), var(--u-blech) 0 0 / 520px 520px;
  border: 1px solid #000; border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(255,236,200,.07), inset 0 0 0 6px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,236,200,.1), inset 0 0 90px rgba(0,0,0,.75), 0 40px 120px rgba(0,0,0,.9); }
#puzzle .box::before { content: ''; position: absolute; inset: 0; width: auto; height: auto; border: 0; transform: none; pointer-events: none; border-radius: inherit; opacity: 1;
  background:
    radial-gradient(circle at 38% 32%, #a49b88 0 14%, #5c564a 40%, #17140f 66%, transparent 70%) left 11px top 11px / 13px 13px no-repeat,
    radial-gradient(circle at 38% 32%, #a49b88 0 14%, #5c564a 40%, #17140f 66%, transparent 70%) right 11px top 11px / 13px 13px no-repeat,
    radial-gradient(circle at 38% 32%, #a49b88 0 14%, #5c564a 40%, #17140f 66%, transparent 70%) left 11px bottom 11px / 13px 13px no-repeat,
    radial-gradient(circle at 38% 32%, #a49b88 0 14%, #5c564a 40%, #17140f 66%, transparent 70%) right 11px bottom 11px / 13px 13px no-repeat; }
#puzzle .box::after { content: none; }
#puzzle h3 { display: block; width: auto; background: linear-gradient(90deg, transparent, rgba(228,218,195,.34) 18%, rgba(228,218,195,.34) 82%, transparent) bottom / 100% 1px no-repeat; box-shadow: none; border: 0; border-radius: 0;
  font: 400 clamp(17px, 1.2vw, 23px) var(--u-titel); letter-spacing: .46em; text-indent: .46em; color: var(--u-bein); text-shadow: 0 1px 0 #000, 0 0 18px rgba(0,0,0,.8); margin: 4px 0 22px; padding: 0 0 15px; }
#puzzle p { color: #cfc5ab; }
#puzzle .row button { background: linear-gradient(180deg, rgba(255,240,205,.045), rgba(0,0,0,.34)); border: 1px solid rgba(214,200,168,.2); border-radius: 1px; color: #d9cfb7; font: 600 clamp(12px, .9vw, 16px) var(--u-ui); letter-spacing: .3em; text-indent: .3em;
  box-shadow: inset 0 1px 0 rgba(255,240,205,.07), inset 0 -6px 14px rgba(0,0,0,.35), 0 2px 5px rgba(0,0,0,.6); }
#puzzle .row button:hover { color: #fff7e4; border-color: rgba(190,60,44,.7); background: linear-gradient(180deg, rgba(142,29,21,.22), rgba(40,6,4,.45)); box-shadow: inset 3px 0 0 var(--u-blut2), inset 0 -6px 14px rgba(0,0,0,.35), 0 0 22px rgba(142,29,21,.28); }
#journal .book { min-height: min(60vh, 600px); }
#jBody { min-height: calc(min(60vh, 600px) - 96px); }
#samReiter button { filter: saturate(.5) brightness(.8); } #samReiter button:hover, #samReiter button.on { filter: saturate(.7) brightness(1); }
`;
const U2 = { gef: false, iv: 0 };
function u2_strich(n) { // Strichliste: je fünf = vier Striche und einer quer; Rest einzeln; zuletzt höchstens vier Gruppen
  const g = Math.floor(n / 5), r = n % 5, von = Math.max(0, g - 4); let h = von > 0 ? '<span class="mehr">…</span> ' : '';
  for (let i = von; i < g; i++) h += '<s>||||</s>';
  if (r) h += '<span>' + '|'.repeat(r) + '</span>';
  return h;
}
function u2_start() {
  try {
    if (document.getElementById('u2Stil')) return;
    const st = document.createElement('style'); st.id = 'u2Stil'; st.textContent = U2_CSS; document.head.appendChild(st);
    const fv = document.getElementById('fearVig');
    if (fv) U2.iv = setInterval(() => { const an = (parseFloat(fv.style.opacity) || 0) > .3; if (an !== U2.gef) { U2.gef = an; document.body.classList.toggle('u2-gefahr', an); } }, 250);
    const ts = document.getElementById('todScreen');
    if (ts && window.MutationObserver) new MutationObserver(() => { if (!ts.classList.contains('show')) return; const o = ts.querySelector('.orn'), n = (typeof tod_S !== 'undefined' && tod_S.deaths) || 1; if (o) o.innerHTML = u2_strich(Math.max(1, n)); }).observe(ts, { attributes: true, attributeFilter: ['class'] });
  } catch (e) { console.warn('ui2', e); }
}
u2_start();
