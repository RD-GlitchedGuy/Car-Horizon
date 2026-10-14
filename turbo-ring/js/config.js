"use strict";
/* =====================================================================
   AUTOS — hier kommen später eigene Modelle dazu.
   Felder: id, name, cls, type (Ersatz-Bauform), paint, Fahrwerte
   (maxSpeed m/s, accel, grip, turn, offroad 0..1).
   Eigenes 3D-Modell (.glb/.gltf):
     model: 'models/meinauto.glb', modelScale: 1, modelRotY: 0, modelY: 0
   Das Modell muss nach +Z schauen (sonst modelRotY anpassen).
   Materialien mit "paint" im Namen bekommen die gewählte Lackfarbe.
   ===================================================================== */
const CARS = [   // pack = Name im Autopaket models/cars.glb (Leerzeichen → _)
  { id:'viper',   name:'Kaze GT',     cls:'Sportwagen',    type:'sport',   pack:'Sport_body',     paint:'#e8322a', maxSpeed:64, accel:21, grip:7.5, turn:2.3, offroad:.55 },
  { id:'bulldog', name:'Raijin',      cls:'Coupé',         type:'muscle',  pack:'Coupe_Body',     paint:'#2a6fe8', maxSpeed:66, accel:18, grip:6.4, turn:2.1, offroad:.55 },
  { id:'dune',    name:'Tora',        cls:'Pickup',        type:'truck',   pack:'Pickup_Body',    paint:'#f0a020', maxSpeed:55, accel:17, grip:6.3, turn:2.0, offroad:.9 },
  { id:'pfeil',   name:'Pfeil F1',    cls:'Formel',        type:'formula', paint:'#e6e6e6', maxSpeed:76, accel:24, grip:9.0, turn:2.4, offroad:.45 },
  { id:'mops',    name:'Mochi',       cls:'Kleinwagen',    type:'mini',    pack:'Compact_Body',   paint:'#4fd18b', maxSpeed:52, accel:20, grip:8.0, turn:2.9, offroad:.6 },
  { id:'yama',    name:'Yama 4x4',    cls:'Geländewagen',  type:'truck',   pack:'Offroad_Body',   paint:'#5d7a3a', maxSpeed:52, accel:17, grip:6.5, turn:2.1, offroad:.95 },
  { id:'shogun',  name:'Shogun',      cls:'Limousine',     type:'sport',   pack:'Sedan_Body',     paint:'#1b1d22', maxSpeed:60, accel:18, grip:7.0, turn:2.2, offroad:.5 },
  { id:'kitsune', name:'Kitsune',     cls:'SUV',           type:'truck',   pack:'SUV_Body',       paint:'#e6e6e6', maxSpeed:56, accel:17, grip:6.8, turn:2.1, offroad:.8 },
  { id:'tabi',    name:'Tabi',        cls:'Kombi',         type:'mini',    pack:'Wagon_Body',     paint:'#2a6fe8', maxSpeed:56, accel:18, grip:7.2, turn:2.3, offroad:.6 },
  { id:'hana',    name:'Hana',        cls:'Fließheck',     type:'mini',    pack:'Hatchback_Body', paint:'#ff2e88', maxSpeed:55, accel:20, grip:7.8, turn:2.7, offroad:.6 },
  { id:'fujivan', name:'Fuji Van',    cls:'Van',           type:'truck',   pack:'minivan_body',   paint:'#f4f4f4', maxSpeed:50, accel:15, grip:6.0, turn:2.0, offroad:.65 },
];
const PAINTS = ['#e8322a','#2a6fe8','#f0a020','#e6e6e6','#4fd18b','#9b4fe8','#1b1d22','#ff2e88'];

/* WELT — Straßen als Splines (x,z). loop:true = Rundkurs mit Event. In Japan wird links gefahren. */
const ROAD_W = 16;
const HALF = 2000;   // halbe Kartengröße in Metern (Karte = 4 km)
// Serpentine: 2¼ Umrundungen um den Fuji bis kurz unter den Gipfel
function fujiSpiral(){ const out=[]; for(let t=.35;t<=2.25*Math.PI*2;t+=.25){ const r=600-490*t/(2.25*Math.PI*2); out.push([150+r*Math.sin(t), -1400+r*Math.cos(t)]); } return out; }
const ROADS = [
  { id:'hwy',  name:'Küsten-Schnellstraße', loop:true, laps:1, pts:[[-650,-100],[-620,-420],[-420,-560],[-150,-520],[120,-560],[420,-600],[650,-420],[720,-100],[700,200],[740,520],[520,700],[200,660],[-100,720],[-420,640],[-640,420],[-700,150]] },
  { id:'pass', name:'Kaze-Pass',            loop:true, laps:2, pts:[[-250,-300],[-120,-260],[-40,-330],[40,-280],[140,-330],[230,-280],[300,-380],[230,-470],[100,-430],[0,-480],[-110,-420],[-220,-470],[-320,-400]] },
  { id:'city', name:'Neon-City Circuit',    loop:true, laps:3, pts:[[450,260],[600,270],[615,420],[600,580],[450,595],[300,580],[285,420],[300,270]] },
  { id:'fest', name:'Festival-Rundkurs',    loop:true, laps:3, pts:[[-200,-60],[-60,-140],[120,-120],[230,-20],[200,120],[60,170],[-80,130],[-230,90]] },
  { id:'c1', loop:false, pts:[[-230,90],[-400,80],[-560,100],[-700,150]] },
  { id:'c2', loop:false, pts:[[200,120],[250,190],[300,270]] },
  { id:'c3', loop:false, pts:[[615,420],[665,410],[716,380]] },
  { id:'c4', loop:false, pts:[[-60,-140],[-50,-230],[-40,-330]] },
  { id:'c5', loop:false, pts:[[-320,-400],[-380,-480],[-420,-560]] },
  { id:'inaka',   name:'Inaka-Landstraße',   loop:true, laps:1, pts:[[-780,-320],[-1000,-430],[-1240,-320],[-1350,0],[-1300,350],[-1150,650],[-900,820],[-720,720],[-800,420],[-900,150],[-860,-110]] },
  { id:'minami',  name:'Minami-Küstenroute', loop:true, laps:1, pts:[[200,900],[600,880],[1000,950],[1260,1150],[1100,1360],[600,1390],[100,1350],[-300,1260],[-460,1010],[-200,880]] },
  { id:'higashi', name:'Higashi-Hügelring',  loop:true, laps:1, pts:[[1150,-500],[1420,-650],[1640,-350],[1620,100],[1680,500],[1420,760],[1170,520],[1120,0]] },
  { id:'c6', loop:false, pts:[[-700,150],[-800,150],[-900,150]] },
  { id:'c7', loop:false, pts:[[200,660],[200,780],[200,900]] },
  { id:'c8', loop:false, pts:[[650,-420],[900,-470],[1150,-500]] },
  { id:'c9', loop:false, pts:[[-460,1010],[-700,950],[-900,820]] },
  { id:'fuji', name:'Fuji-Bergstraße', loop:false, grade:.12, pts:[[230,-470],[205,-620]].concat(fujiSpiral()) },
];
/* PR-Stunts: Blitzer (km/h), Driftzonen (Punkte), Gefahrenschilder (Sprungweite m) */
const STUNTS = [
  { id:'t1', type:'trap',  name:'Blitzer Kaiblick',     road:'hwy',  at:.06,  stars:[170,210,250] },
  { id:'t2', type:'trap',  name:'Blitzer Neonmeile',    road:'city', at:.08,  stars:[140,175,205] },
  { id:'t3', type:'trap',  name:'Blitzer Talbrücke',    road:'hwy',  at:.56,  stars:[170,210,250] },
  { id:'d1', type:'drift', name:'Driftzone Kaze',       road:'pass', from:.1, to:.3,  stars:[6000,12000,20000] },
  { id:'d2', type:'drift', name:'Driftzone Hafen',      road:'hwy',  from:.82,to:.9,  stars:[5000,10000,18000] },
  { id:'j1', type:'jump',  name:'Gefahrenschild Klippe',road:'hwy',  at:.32,  stars:[45,70,95] },
  { id:'t4', type:'trap',  name:'Blitzer Minami',       road:'minami', at:.3, stars:[170,210,250] },
  { id:'d3', type:'drift', name:'Driftzone Fuji',       road:'fuji', from:.35, to:.6, stars:[8000,16000,26000] },
  { id:'j2', type:'jump',  name:'Gefahrenschild Reisfeld',road:'c1', at:.5,   stars:[40,62,85] },
];
const DRIVATARS = ['Haruto','Yuki','Kenji','Mika','Sora','Ren','Aoi','Daichi','Hana','Takumi','Emi','Riku','Nao','Kaito'];

const $ = s => document.querySelector(s);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t) => a+(b-a)*t;
const sstep = (a,b,x) => { const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
const wrapA = a => { while(a>Math.PI) a-=2*Math.PI; while(a<-Math.PI) a+=2*Math.PI; return a; };
const carById = id => CARS.find(c=>c.id===id) || CARS[0];
const esc = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rnd = (a,b) => a+Math.random()*(b-a);
const pick = a => a[Math.random()*a.length|0];
const store = { get(k,d){ try{ const v=localStorage.getItem('tr2_'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} }, set(k,v){ try{localStorage.setItem('tr2_'+k,JSON.stringify(v));}catch(e){} } };
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.hidden=false; clearTimeout(toast.h); toast.h=setTimeout(()=>t.hidden=true,3200); }
const fmt = t => { if(t==null) return '–'; const m=Math.floor(t/60), s=t-m*60; return m+':'+(s<10?'0':'')+s.toFixed(1); };
const fmtN = n => Math.round(n).toLocaleString('de-DE');

/* ---------- Einstellungen & Spielstand ---------- */
const cfg = { name: store.get('name','Fahrer'+Math.floor(Math.random()*90+10)), car: store.get('car','viper'), paint: store.get('paint',null),
  gfx: store.get('gfx', (('ontouchstart' in window)||navigator.maxTouchPoints>0)?'normal':'ultra'), steer: store.get('steer','buttons'), autogas: store.get('autogas',0), inv: store.get('inv',0),
  tod: store.get('tod','cycle'), sound: store.get('sound',1), vol: store.get('vol',80), rvol: store.get('rvol',70), cvol: store.get('cvol',100), fvol: store.get('fvol',100), mvol: store.get('mvol',100), cam: store.get('cam',0) };
const VOL=()=>cfg.vol/100, RVOL=()=>cfg.rvol/100, CVOL=()=>cfg.cvol/100, FVOL=()=>cfg.fvol/100, MVOL=()=>cfg.mvol/100;
if(!cfg.paint) cfg.paint = carById(cfg.car).paint;
const save = store.get('save', { xp:0, pr:{}, wins:0 });
if(save.cr==null) save.cr=0; if(!Array.isArray(save.owned)) save.owned=['viper','mops']; if(!save.owned.includes(cfg.car)) save.owned.push(cfg.car);
const SHOP={ viper:[0,1], mops:[0,1], fujivan:[12000,1], hana:[15000,1], tabi:[20000,1], dune:[30000,2], shogun:[35000,2], kitsune:[38000,2], yama:[40000,3], bulldog:[45000,3], pfeil:[120000,5] };   // [Preis in CR, ab Festival-Rang]
const owned=id=>save.owned.includes(id);
let gView=cfg.car;
const persist = () => store.set('save', save);
const levelOf = xp => 1+Math.floor(Math.sqrt(xp/1500));
const xpFor = l => 1500*(l-1)*(l-1);
