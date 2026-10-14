"use strict";
/* =====================================================================
   MENÜ-UI
   ===================================================================== */
function showScreen(id){ ['menu','hud'].forEach(s=>$('#'+s).hidden=s!==id); if(id==='menu'){ $('#slotGarage').appendChild($('#garage')); $('#slotSettings').appendChild($('#settings')); refreshShowCar(); } }
function optButtons(container, items, cur, onPick){ const c=$(container); [...c.querySelectorAll('button')].forEach(b=>b.remove());
  items.forEach(([v,label])=>{ const b=document.createElement('button'); b.textContent=label; if(v===cur) b.classList.add('sel'); b.onclick=()=>onPick(v); c.appendChild(b); }); }
function renderOpts(){
  const loc=(k,v)=>{ cfg[k]=v; store.set(k,v); renderOpts(); updateTouchUI(); };
  optButtons('#gfxOpts',[['potato','Potato'],['normal','Normal'],['ultra','Ultra']],cfg.gfx,v=>{ if(v===cfg.gfx) return; const wasPotato=activeGfx==='potato'; loc('gfx',v);
    if(game.mode==='menu'){ applyGfx(); if(HAS_TOUCH && wasPotato) toast('Für volle Kantenglättung die Seite einmal neu laden.'); } else toast('Gilt beim nächsten Betreten des Festivals.'); });
  optButtons('#navOpts',[[1,'An'],[0,'Aus']],cfg.navline,v=>loc('navline',v));
  optButtons('#radioOpts',[[1,'An'],[0,'Aus']],RADIO.on,v=>{ if(v!==RADIO.on) radioToggle(); });
  optButtons('#todOpts',[['cycle','Zyklus'],['day','Tag'],['dusk','Abend'],['night','Nacht']],cfg.tod,v=>loc('tod',v));
  optButtons('#sndOpts',[[1,'An'],[0,'Aus']],cfg.sound,v=>{ loc('sound',v); initAudio(); if(AU.master) AU.master.gain.value=v?.55:0; });
  optButtons('#steerOpts',[['buttons','Tasten'],['tilt','Neigen']],cfg.steer,async v=>{ if(v==='tilt' && !(await enableTilt())) return; loc('steer',v); });
  optButtons('#invOpts',[[0,'Normal'],[1,'Umgekehrt']],cfg.inv,v=>loc('inv',v));
  optButtons('#gasOpts',[[0,'Aus'],[1,'An']],cfg.autogas,v=>loc('autogas',v));
}
function renderGarage(){
  const d=carById(gView), own=owned(d.id), [price,rk]=SHOP[d.id]||[0,1], lvl=levelOf(save.xp); $('#carName').textContent=d.name; $('#carCls').textContent=own?d.cls:d.cls+' · gesperrt';
  $('#shopRow').hidden=own; $('#swatchRow').hidden=!own;
  if(!own){ $('#shopTxt').textContent = lvl<rk ? `Ab Festival-Rang ${rk} · ${fmtN(price)} CR` : `${fmtN(price)} CR · du hast ${fmtN(save.cr)} CR`; $('#btnBuy').disabled = lvl<rk || save.cr<price; }
  const stats=[['Tempo',d.maxSpeed/80],['Beschl.',d.accel/26],['Grip',d.grip/10],['Lenkung',d.turn/3.1],['Gelände',d.offroad]];
  $('#carStats').innerHTML=stats.map(([n,v])=>`<div class="stat"><span>${n}</span><div class="bar"><i style="width:${Math.round(v*100)}%"></i></div></div>`).join('');
  $('#swatches').innerHTML=''; PAINTS.forEach(p=>{ const b=document.createElement('button'); b.className='sw'+(p===cfg.paint?' sel':''); b.style.background=p; b.setAttribute('aria-label','Farbe '+p); b.onclick=()=>{ cfg.paint=p; store.set('paint',p); onGarageChange(); }; $('#swatches').appendChild(b); });
}
function onGarageChange(){ renderGarage();
  if(game.mode==='menu'){ refreshShowCar(); return; }
  if(game.me && game.me.inRace){ toast('Autowechsel nach dem Rennen.'); return; }
  const me=game.me; if(me) rebuildMesh(me, myEntry());
  if(isAuthority()){ const e=game.roster.find(x=>x.id===net.myId); if(e) Object.assign(e,myEntry()); sendRoster(); } else if(net.host && net.host.open) net.host.send({t:'pick',...myEntry()}); }
function cycleCar(dir){ const i=CARS.findIndex(c=>c.id===gView), n=CARS[(i+dir+CARS.length)%CARS.length]; gView=n.id;
  if(owned(n.id)){ cfg.car=n.id; cfg.paint=n.paint; store.set('car',n.id); store.set('paint',n.paint); onGarageChange(); } else { renderGarage(); if(game.mode==='menu') refreshShowCar(); } }
$('#btnBuy').onclick=()=>{ const [price,rk]=SHOP[gView]||[0,1]; if(owned(gView) || save.cr<price || levelOf(save.xp)<rk) return;
  save.cr-=price; save.owned.push(gView); persist(); cfg.car=gView; cfg.paint=carById(gView).paint; store.set('car',cfg.car); store.set('paint',cfg.paint); jingle(); toast(carById(gView).name+' gekauft!'); updateRank(); onGarageChange(); };
$('#carPrev').onclick=()=>cycleCar(-1); $('#carNext').onclick=()=>cycleCar(1);
$('#name').value=cfg.name; $('#name').oninput=e=>{ cfg.name=e.target.value.trim()||'Fahrer'; store.set('name',cfg.name); };
$('#btnSolo').onclick=()=>{ initAudio(); leaveNet(); enterWorld(); };
$('#btnHost').onclick=()=>{ initAudio(); hostGame(); };
$('#btnJoin').onclick=()=>{ initAudio(); joinGame($('#joinCode').value); };
$('#joinCode').addEventListener('keydown',e=>{ if(e.key==='Enter') joinGame(e.target.value); });
$('#btnBack').onclick=()=>leaveRaceLocal();
$('#btnPause').onclick=()=>openPause();
$('#pResume').onclick=()=>closePause();
$('#pMap').onclick=()=>openMap();
$('#pReset').onclick=()=>{ closePause(); resetToRoad(game.me,true); };
$('#pQuit').onclick=()=>leaveWorld();
$('#mapClose').onclick=()=>closeMap();
$('#btnBinds').onclick=()=>openBinds(); $('#bindClose').onclick=()=>closeBinds();
$('#bindReset').onclick=()=>{ BINDS=JSON.parse(JSON.stringify(DEF_BINDS)); store.set('binds',BINDS); rebind=null; renderBinds(); toast('Standardbelegung wiederhergestellt'); };
{ const de=document.documentElement, rq=de.requestFullscreen||de.webkitRequestFullscreen;
  if(rq){ $('#btnFull').hidden=false; $('#btnFull').onclick=()=>{ const fe=document.fullscreenElement||document.webkitFullscreenElement;
    try{ if(fe) (document.exitFullscreen||document.webkitExitFullscreen).call(document); else { const r=rq.call(de); if(r&&r.catch) r.catch(()=>toast('Vollbild wird hier nicht unterstützt.')); } }catch(e){ toast('Vollbild wird hier nicht unterstützt.'); }
    setTimeout(resize,300); }; } }
if(cfg.steer==='tilt' && window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission==='function'){ addEventListener('pointerdown', function once(){ removeEventListener('pointerdown', once, true); enableTilt(); }, true); }
renderGarage(); renderOpts(); updateRank(); updateTouchUI(); showScreen('menu');
// Beim Öffnen: Titelbild → Kino-Eröffnung (mit Ton) → Hauptmenü
let bootWait=true; $('#menu').hidden=true; $('#boot').hidden=false;
function startBoot(){ if(!bootWait) return; bootWait=false; $('#boot').hidden=true; initAudio(); radioPrime(); playMusic(); if(AU.master) AU.master.gain.value=cfg.sound?.35:0; enterWorld(true); }
if(/^#[A-Z]{4}$/i.test(location.hash)) $('#joinCode').value=location.hash.slice(1).toUpperCase();

// Lautstärkeregler (Gesamt & Radio), wird gespeichert
[['#volAll','vol'],['#volCar','cvol'],['#volFx','fvol'],['#volRadio','rvol'],['#volMusic','mvol']].forEach(([id,k])=>{ const el=$(id), out=$(id+'V'); el.value=cfg[k]; out.textContent=cfg[k]+'%';
  el.addEventListener('input',()=>{ cfg[k]=+el.value; out.textContent=el.value+'%'; store.set(k,cfg[k]); applyVolume(); }); });
