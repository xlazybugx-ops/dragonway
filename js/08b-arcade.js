/* ============================================================
   08b-arcade.js — АРКАДНЫЙ БОЙ встреч в полёте (top-down)
   Дикий дракон = одиночный бой. Логово = ГРУППОВОЙ бой против стаи.
   Джойстик + tab-target · автоатака · кулдауны · мана · рывок с i-frames · статусы.
   Статы из makeCombatant(); класс = стихия(роль) × телосложение(стиль).
   Возврат: flight.battleWin=win → renderFlight() (существующий контракт).
   ============================================================ */
'use strict';
function rand(a,b){ return a+Math.random()*(b-a); }
function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
function clampN(v,a,b){ return Math.max(a,Math.min(b,v)); }

function physiqueOf(sp){ if(!sp) return 'strazh';
  if(sp.spd<=6) return 'koloss'; if(sp.spd>=11 && sp.def<=8) return 'vihr'; return 'strazh'; }
const AR_PHYS={ koloss:{spd:150,atkCd:1.25,dashCd:5,iframe:0.26}, vihr:{spd:235,atkCd:0.8,dashCd:3,iframe:0.42}, strazh:{spd:190,atkCd:1.0,dashCd:4,iframe:0.34} };
const AR_KITS={
  fire:[ {id:'fclaw',name:'Коготь',icon:'🔥',kind:'melee',cd:3,mana:12,range:145,mul:1.5,burn:{mul:0.45,dur:3}},
         {id:'lava', name:'Лава',  icon:'🟠',kind:'proj', cd:6,mana:22,range:370,mul:2.6,pspd:540},
         {id:'wave', name:'Жар',   icon:'🌋',kind:'self', cd:9,mana:28,aoe:150,mul:1.8,knock:190} ],
  frost:[ {id:'shard',name:'Шип', icon:'🧊',kind:'proj', cd:3,mana:12,range:350,mul:1.8,pspd:480,slow:{mul:0.5,dur:2.5}},
          {id:'field',name:'Поле',icon:'❄️',kind:'ground',cd:9,mana:26,radius:140,dur:5,root:true,dotMul:0.3},
          {id:'shield',name:'Щит',icon:'🛡️',kind:'self', cd:11,mana:24,shieldMul:0.6,dur:6} ],
  venom:[ {id:'vclaw',name:'Коготь',icon:'🟢',kind:'melee',cd:2.6,mana:10,range:140,mul:1.1,poison:{mul:0.32,dur:4}},
          {id:'cloud',name:'Облако',icon:'☁️',kind:'ground',cd:8,mana:24,radius:140,dur:5,dotMul:0.42},
          {id:'vines',name:'Лозы',  icon:'🌿',kind:'proj', cd:9,mana:20,range:330,mul:1.2,pspd:430,rootHit:1.2} ],
  storm:[ {id:'gust', name:'Рывок',icon:'💨',kind:'dash', cd:5,mana:14,range:220,mul:2.0,iframe:0.4},
          {id:'bolt', name:'Молния',icon:'⚡',kind:'proj',cd:3,mana:14,range:410,mul:2.2,pspd:920,chain:2},
          {id:'haste',name:'Ускор.',icon:'🏃',kind:'self',cd:12,mana:24,haste:{atk:0.55,spd:1.4,dur:4}} ],
  shade:[ {id:'sclaw',name:'Коготь',icon:'🦇',kind:'melee',cd:3,mana:12,range:145,mul:1.7,life:0.5},
          {id:'cloak',name:'Покров',icon:'🌑',kind:'self', cd:11,mana:22,stealth:2,iframe:0.5},
          {id:'drain',name:'Поглощ.',icon:'🕳️',kind:'proj',cd:6,mana:20,range:350,mul:2.0,pspd:540,life:0.6} ],
};
const AR_ROLE={fire:'🔥',frost:'🧊',venom:'🟢',storm:'⚡',shade:'🌑'};
function ar_mitig(raw,def){ return Math.max(1, Math.round(raw*(80/(80+(def||0))))); }
function ar_elMul(att,def){ if(ADVANTAGE[att]===def)return 1.28; if(ADVANTAGE[def]===att)return 0.85; return 1; }

let arc=null;

function ar_makeEnemy(sp,lvl,role,cx,cy){
  const fd={id:sp.id,level:Math.max(1,lvl),xp:0,curHp:0,morph:rollMorph()};
  const foe=makeCombatant(fd,true);
  // role: 'wild' (одиночка), 'leader' (вожак стаи), 'add' (рядовой)
  const hpMul = role==='wild'?2.6 : role==='leader'?1.9 : 1.25;
  const dmgMul = role==='wild'?1.9 : 1.55;
  const rar=sp.rarity||1;
  const hp=Math.round(foe.maxHp*hpMul*(1+(rar-1)*0.12));
  return { sp, el:foe.el, role, x:cx, y:cy, r: role==='add'?18:(rar>=4||role==='leader'?26:20),
    color:(ELEMENTS[foe.el]||{}).color||'#c25b3a', icon:sp.sigil||'👹',
    hp, maxHp:hp, atk:Math.round(foe.atk*dmgMul), def:foe.def,
    speed:clampN(60+foe.spd*5,70,160), aggro:520, atkRange: role==='add'?50:(role==='leader'?76:60),
    atkCd:2.0, t:rand(0,1.6), tele: physiqueOf(sp)==='koloss'?1.0:0.72, telegraph:0,
    slow:0, slowMul:1, burns:[], poisons:[], root:0, flash:0, dead:false };
}

function startArcadeFight(dragon, ent, opts){
  opts=opts||{};
  const me=makeCombatant(dragon,false);
  const sp=ent.sp, lvl=opts.lvl||dragon.level;
  const phys=AR_PHYS[physiqueOf(me.sp)];
  const kit=(AR_KITS[me.el]||AR_KITS.fire).map(s=>({...s,_t:0}));
  const bn=(typeof flight!=='undefined'&&flight&&flight.region&&flight.region.biomeN)||1;

  // overlay
  let fsA=document.getElementById('arcadeFs');
  if(!fsA){ fsA=document.createElement('div'); fsA.id='arcadeFs'; fsA.className='arcade-fs'; document.body.appendChild(fsA); }
  fsA.style.display='block'; document.body.classList.add('flight-active');

  const Wv=innerWidth,Hv=innerHeight;
  const WORLD={w:Math.max(1300,Wv*1.7), h:Math.max(1300,Hv*1.7)};
  const cx=WORLD.w/2, cy=WORLD.h/2;
  const P={ el:me.el, x:cx, y:WORLD.h-320, r:20, color:(ELEMENTS[me.el]||{}).color||'#f4b942',
    icon:me.sp.sigil||'🐲', baseSpeed:phys.spd, hp:Math.max(1,me.hp), maxHp:me.maxHp,
    atk:me.atk, def:me.def, mana:60, maxMana:100, manaRegen:11,
    target:null, globalCd:0, iframe:0, hurt:0, facing:-Math.PI/2, shield:0, haste:0, hasteAtk:1, hasteSpd:1, stealth:0,
    autoBase:phys.atkCd, autoT:0, autoRange:150, dashCd:phys.dashCd, dashT:0, dashIf:phys.iframe, kit };

  // стая или одиночка
  const enemies=[];
  const isDen = opts.kind==='den';
  if(isDen){
    enemies.push(ar_makeEnemy(sp, lvl, 'leader', cx, cy-140));
    const adds = clampN(1+bn, 2, 4); // ярус биома → размер стаи (всего 3–5)
    for(let i=0;i<adds;i++){ const asp=(typeof weightedSpecies==='function')?weightedSpecies():sp;
      const ang=(i/adds)*6.283, rad=110+rand(0,70);
      enemies.push(ar_makeEnemy(asp, Math.max(1,lvl-1), 'add', cx+Math.cos(ang)*rad, cy-140+Math.sin(ang)*rad*0.7)); }
  } else {
    enemies.push(ar_makeEnemy(sp, lvl, 'wild', cx, cy-120));
  }

  const title = isDen ? ('🏴 Логово: '+sp.name+' · стая '+enemies.length)
                      : (AR_ROLE[me.el]||'')+' '+dragonName(dragon)+' против '+sp.name;
  fsA.innerHTML=`
    <canvas id="acv"></canvas>
    <div class="ac-top">
      <div class="ac-name">${title}</div>
      <div class="ac-bars"><div class="ac-bar"><i id="acHp"></i><span id="acSh"></span></div><div class="ac-bar sm"><i id="acMana"></i></div></div>
      <button class="ac-exit" id="acExit">🏳 Уйти</button>
    </div>
    <div class="ac-foehp" id="acFoe"></div>
    <div class="ac-stick" id="acStick"><div class="ac-knob" id="acKnob"></div></div>
    <div class="ac-ab" id="acAb"></div>`;

  const cv=document.getElementById('acv'), ctx=cv.getContext('2d');
  const resize=()=>{const dpr=Math.min(2,devicePixelRatio||1);cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0);};
  window.addEventListener('resize',resize); resize();

  P.target = enemies[0];
  arc={fsA,ctx,cv,resize,WORLD,P,enemies,dragon,ent,opts,isDen,
    proj:[],zones:[],floats:[],parts:[],cam:{x:0,y:0},shake:0,over:false,raf:0,last:performance.now()};

  buildArcAbilities();
  bindArcInput();
  document.getElementById('acExit').onclick=()=>arcFinish(false);
  arc.raf=requestAnimationFrame(t=>{arc.last=t;arcFrame(t);});
}
function ar_alive(){ return arc.enemies.filter(e=>!e.dead); }
function ar_nearest(mr){ let b=null,bd=mr||Infinity; for(const e of arc.enemies){if(e.dead)continue;const d=dist(arc.P,e);if(d<bd){b=e;bd=d;}} return b; }

function buildArcAbilities(){
  const box=document.getElementById('acAb'); box.innerHTML='';
  arc.P.kit.forEach((sk,i)=>{ const el=document.createElement('div'); el.className='ac-btn';
    el.innerHTML=sk.icon+'<span class="ac-cd"></span><span class="ac-nm">'+sk.name+'</span>';
    const f=e=>{e.preventDefault();arcUse(i);};
    el.addEventListener('touchstart',f,{passive:false}); el.addEventListener('mousedown',f); box.appendChild(el); });
  const d=document.createElement('div'); d.className='ac-btn dash';
  d.innerHTML='⚡<span class="ac-cd"></span><span class="ac-nm">Рывок</span>';
  const fd=e=>{e.preventDefault();arcDash();};
  d.addEventListener('touchstart',fd,{passive:false}); d.addEventListener('mousedown',fd); box.appendChild(d);
}

const arcJoy={active:false,id:null,cx:0,cy:0,dx:0,dy:0,max:52};
const arcKeys=new Set();
function bindArcInput(){
  const cv=arc.cv, stick=document.getElementById('acStick'), knob=document.getElementById('acKnob');
  const uiZone=(x,y)=>x>innerWidth-92&&y>innerHeight-330;
  const s2w=(sx,sy)=>({x:sx+arc.cam.x,y:sy+arc.cam.y});
  const jStart=(x,y,id)=>{arcJoy.active=true;arcJoy.id=id;arcJoy.cx=x;arcJoy.cy=y;arcJoy.dx=arcJoy.dy=0;stick.style.display='block';stick.style.left=(x-60)+'px';stick.style.top=(y-60)+'px';knob.style.left='50%';knob.style.top='50%';};
  const jMove=(x,y)=>{let vx=x-arcJoy.cx,vy=y-arcJoy.cy;const l=Math.hypot(vx,vy)||1;const cl=Math.min(l,arcJoy.max);arcJoy.dx=(vx/l)*(cl/arcJoy.max);arcJoy.dy=(vy/l)*(cl/arcJoy.max);knob.style.left=(50+arcJoy.dx*40)+'%';knob.style.top=(50+arcJoy.dy*40)+'%';};
  const jEnd=()=>{arcJoy.active=false;arcJoy.id=null;arcJoy.dx=arcJoy.dy=0;stick.style.display='none';};
  const pick=(x,y)=>{const w=s2w(x,y);let best=null,bd=52;for(const e of arc.enemies){if(e.dead)continue;const d=Math.hypot(e.x-w.x,e.y-w.y);if(d<e.r+46&&d<bd){best=e;bd=d;}}if(best)arc.P.target=best;};
  const pdown=(x,y,id)=>{ if(arc.over)return; if(x<innerWidth*0.5&&!uiZone(x,y)){ if(!arcJoy.active)jStart(x,y,id); } else pick(x,y); };
  cv.addEventListener('touchstart',e=>{e.preventDefault();for(const t of e.changedTouches)pdown(t.clientX,t.clientY,t.identifier);},{passive:false});
  cv.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===arcJoy.id)jMove(t.clientX,t.clientY);},{passive:false});
  cv.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===arcJoy.id)jEnd();});
  cv.addEventListener('touchcancel',jEnd);
  let md=false;
  cv.addEventListener('mousedown',e=>{md=true;pdown(e.clientX,e.clientY,'m');});
  window.addEventListener('mousemove',arc._mm=e=>{if(md&&arcJoy.id==='m')jMove(e.clientX,e.clientY);});
  window.addEventListener('mouseup',arc._mu=()=>{md=false;if(arcJoy.id==='m')jEnd();});
  window.addEventListener('keydown',arc._kd=e=>{arcKeys.add(e.code);if(e.code==='Digit1')arcUse(0);if(e.code==='Digit2')arcUse(1);if(e.code==='Digit3')arcUse(2);if(e.code==='Space'||e.code==='ShiftLeft')arcDash();});
  window.addEventListener('keyup',arc._ku=e=>arcKeys.delete(e.code));
}
function arcMoveVec(){ let mx=arcJoy.dx,my=arcJoy.dy;
  if(!arcJoy.active){ mx=(arcKeys.has('KeyD')||arcKeys.has('ArrowRight')?1:0)-(arcKeys.has('KeyA')||arcKeys.has('ArrowLeft')?1:0);
    my=(arcKeys.has('KeyS')||arcKeys.has('ArrowDown')?1:0)-(arcKeys.has('KeyW')||arcKeys.has('ArrowUp')?1:0);
    const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l;} } return {mx,my}; }

// —— навыки ——
function arcNeedTarget(sk){ return sk.kind==='melee'||sk.kind==='proj'||sk.kind==='dash'; }
function arcUse(i){ if(!arc||arc.over)return; const P=arc.P, sk=P.kit[i]; if(!sk)return;
  if(sk._t>0||P.globalCd>0)return;
  if(P.mana<sk.mana){arcWarn('нет маны','#7cd6ff');return;}
  let t=P.target; if(t&&t.dead)t=P.target=ar_nearest();
  if(arcNeedTarget(sk)){ if(!t){arcWarn('нет цели','#ffd36b');return;} if(dist(P,t)>sk.range){arcWarn('далеко','#ffd36b');return;} }
  P.mana-=sk.mana; sk._t=sk.cd; P.globalCd=0.8; if(t)P.facing=Math.atan2(t.y-P.y,t.x-P.x);
  if(sk.kind==='melee'){ arcHitE(t,sk.mul,sk); arcSlash(P,t); }
  else if(sk.kind==='proj'){ const a=Math.atan2(t.y-P.y,t.x-P.x);
    arc.proj.push({x:P.x,y:P.y,vx:Math.cos(a)*sk.pspd,vy:Math.sin(a)*sk.pspd,r:9,sk,life:1.4}); }
  else if(sk.kind==='self'){
    if(sk.shieldMul){P.shield=Math.round(P.maxHp*sk.shieldMul);arcBurst(P.x,P.y,'#bcdcff',16);arcWarn('щит!','#bcdcff');}
    if(sk.haste){P.haste=sk.haste.dur;P.hasteAtk=sk.haste.atk;P.hasteSpd=sk.haste.spd;arcWarn('ускорение!','#d8b4ff');}
    if(sk.stealth){P.iframe=Math.max(P.iframe,sk.iframe);P.stealth=sk.stealth;arcWarn('покров тьмы','#9a7bd0');}
    if(sk.aoe){ for(const e of arc.enemies){ if(e.dead)continue; if(dist(P,e)<=sk.aoe){ arcHitE(e,sk.mul,sk);
      if(sk.knock){const a=Math.atan2(e.y-P.y,e.x-P.x);e.x+=Math.cos(a)*sk.knock*0.1;e.y+=Math.sin(a)*sk.knock*0.1;} } }
      arcBurst(P.x,P.y,'#ff8a3d',22);arc.shake=Math.min(arc.shake+7,11); } }
  else if(sk.kind==='ground'){ arc.zones.push({x:t?t.x:P.x,y:t?t.y:P.y,r:sk.radius,dur:sk.dur,sk,tick:0}); arcWarn('поле!','#9fe6ff'); }
  else if(sk.kind==='dash'){ const a=Math.atan2(t.y-P.y,t.x-P.x),d=Math.min(sk.range,dist(P,t));
    P.x=clampN(P.x+Math.cos(a)*d,20,arc.WORLD.w-20);P.y=clampN(P.y+Math.sin(a)*d,20,arc.WORLD.h-20);
    P.iframe=Math.max(P.iframe,sk.iframe); arcHitE(t,sk.mul,sk); arcBurst(P.x,P.y,'#d8b4ff',14); }
}
function arcDash(){ if(!arc||arc.over)return; const P=arc.P; if(P.dashT>0)return;
  let {mx,my}=arcMoveVec(); if(!mx&&!my){mx=Math.cos(P.facing);my=Math.sin(P.facing);}
  const l=Math.hypot(mx,my)||1;mx/=l;my/=l;
  P.x=clampN(P.x+mx*150,20,arc.WORLD.w-20);P.y=clampN(P.y+my*150,20,arc.WORLD.h-20);
  P.iframe=Math.max(P.iframe,P.dashIf);P.dashT=P.dashCd;arcBurst(P.x,P.y,'#fff0b4',12); }
function arcWarn(t,c){ arc.floats.push({x:arc.P.x,y:arc.P.y-30,txt:t,col:c,t:0,life:0.9}); }
function arcHitE(e,mul,sk){ const P=arc.P; if(!e||e.dead)return;
  let raw=P.atk*mul*ar_elMul(P.el,e.el); const d=ar_mitig(raw*rand(0.9,1.1),e.def);
  e.hp-=d; e.flash=0.12; arcBurst(e.x,e.y,'#ffca7a',6); arc.shake=Math.min(arc.shake+1.5,7);
  arc.floats.push({x:e.x,y:e.y-e.r-6,txt:''+d,col:'#fff',t:0,life:0.85});
  if(sk&&sk.life){const heal=Math.round(d*sk.life);P.hp=Math.min(P.maxHp,P.hp+heal);arc.floats.push({x:P.x,y:P.y-30,txt:'+'+heal,col:'#7CFF9E',t:0,life:0.9});}
  if(sk&&sk.burn)e.burns.push({dps:P.atk*sk.burn.mul,t:sk.burn.dur});
  if(sk&&sk.poison)e.poisons.push({dps:P.atk*sk.poison.mul,t:sk.poison.dur});
  if(sk&&sk.slow){e.slow=Math.max(e.slow,sk.slow.dur);e.slowMul=sk.slow.mul;}
  if(sk&&sk.rootHit)e.root=Math.max(e.root,sk.rootHit);
  if(sk&&sk.chain)arcChain(e,P.atk*mul,sk,sk.chain);
  if(e.hp<=0)arcKillE(e);
}
function arcChain(from,base,sk,jumps){ let src=from,seen=new Set([from]);
  for(let j=0;j<jumps;j++){ let nx=null,nd=260; for(const e of arc.enemies){if(e.dead||seen.has(e))continue;const dd=dist(src,e);if(dd<nd){nx=e;nd=dd;}} if(!nx)break;
    const d=ar_mitig(base*0.6*ar_elMul(arc.P.el,nx.el),nx.def); nx.hp-=d; nx.flash=0.12;
    arc.floats.push({x:nx.x,y:nx.y-nx.r-6,txt:''+d,col:'#bfe0ff',t:0,life:0.8}); seen.add(nx); src=nx; if(nx.hp<=0)arcKillE(nx); }
}
function arcKillE(e){ if(e.dead)return; e.dead=true;e.hp=0; arcBurst(e.x,e.y,e.color,22);
  arc.floats.push({x:e.x,y:e.y-10,txt:'✦',col:'#ffd36b',t:0,life:1});
  if(arc.P.target===e)arc.P.target=ar_nearest(600);
  if(ar_alive().length===0)arcFinish(true);
}
function arcHitP(rawDmg,el){ const P=arc.P; if(P.iframe>0)return;
  let dmg=ar_mitig(rawDmg*ar_elMul(el,P.el), P.def);
  if(P.shield>0){const ab=Math.min(P.shield,dmg);P.shield-=ab;dmg-=ab;arc.floats.push({x:P.x,y:P.y-P.r-6,txt:'🛡'+ab,col:'#bcdcff',t:0,life:0.9});if(dmg<=0){P.iframe=0.28;return;}}
  P.hp-=dmg;P.iframe=0.5;P.hurt=0.35;arc.shake=Math.min(arc.shake+5,11);arcBurst(P.x,P.y,'#ff5d52',12);
  arc.floats.push({x:P.x,y:P.y-P.r-6,txt:'-'+dmg,col:'#ff8a8a',t:0,life:0.9});
  if(typeof S!=='undefined' && S.tutorialGuard && P.hp<1)P.hp=1; // обучение без поражения
  if(P.hp<=0){P.hp=0;arcFinish(false);} }
function arcBurst(x,y,col,n){for(let i=0;i<n;i++){const a=rand(0,6.28),s=rand(40,180);arc.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.3,.6),t:0,col,r:rand(2,4)});}}
function arcSlash(P,t){const a=Math.atan2(t.y-P.y,t.x-P.x);for(let i=0;i<6;i++)arc.parts.push({x:P.x+Math.cos(a)*30,y:P.y+Math.sin(a)*30,vx:Math.cos(a)*rand(60,160),vy:Math.sin(a)*rand(60,160),life:.3,t:0,col:'#fff',r:3});}

// —— цикл ——
function arcFrame(now){ if(!arc)return; const dt=Math.min(0.05,(now-arc.last)/1000); arc.last=now;
  try{ if(!arc.over) arcUpdate(dt); arcRender(); }catch(e){ console.warn('[Драконис] аркада: сбой кадра',e); }
  if(arc&&!arc.over) arc.raf=requestAnimationFrame(arcFrame);
}
function arcUpdate(dt){ const P=arc.P,WORLD=arc.WORLD;
  const {mx,my}=arcMoveVec(); const spd=P.baseSpeed*(P.haste>0?P.hasteSpd:1);
  P.x=clampN(P.x+mx*spd*dt,20,WORLD.w-20);P.y=clampN(P.y+my*spd*dt,20,WORLD.h-20);
  if(mx||my)P.facing=Math.atan2(my,mx);
  P.mana=Math.min(P.maxMana,P.mana+P.manaRegen*dt);
  P.globalCd=Math.max(0,P.globalCd-dt);P.iframe=Math.max(0,P.iframe-dt);P.hurt=Math.max(0,P.hurt-dt);
  P.haste=Math.max(0,P.haste-dt);P.dashT=Math.max(0,P.dashT-dt);if(P.stealth)P.stealth=Math.max(0,P.stealth-dt);
  const atkCd=P.autoBase*(P.haste>0?P.hasteAtk:1);P.autoT=Math.max(0,P.autoT-dt);
  for(const sk of P.kit)sk._t=Math.max(0,sk._t-dt);
  let t=P.target; if(t&&t.dead)t=P.target=ar_nearest(600);
  if(t&&dist(P,t)<=P.autoRange&&P.autoT<=0){ arcHitE(t,1.0,null); P.autoT=atkCd; P.facing=Math.atan2(t.y-P.y,t.x-P.x); }
  // снаряды игрока — по любому врагу
  for(const pr of arc.proj){ pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.life-=dt;
    for(const e of arc.enemies){ if(e.dead)continue; if(Math.hypot(e.x-pr.x,e.y-pr.y)<e.r+pr.r){ arcHitE(e,pr.sk.mul,pr.sk); pr.life=0; break; } } }
  arc.proj=arc.proj.filter(pr=>pr.life>0&&pr.x>-60&&pr.x<WORLD.w+60&&pr.y>-60&&pr.y<WORLD.h+60);
  // зоны — по всем в радиусе
  for(const z of arc.zones){ z.dur-=dt;
    for(const e of arc.enemies){ if(e.dead)continue; if(dist(z,e)<=z.r){ e.slow=Math.max(e.slow,0.3); e.slowMul=z.sk.root?0.1:0.4; } }
    if(z.sk.dotMul){ z.tick+=dt; if(z.tick>=0.5){ z.tick=0; for(const e of arc.enemies){ if(!e.dead&&dist(z,e)<=z.r){ e.hp-=Math.round(P.atk*z.sk.dotMul*0.5); if(e.hp<=0)arcKillE(e); } } } } }
  arc.zones=arc.zones.filter(z=>z.dur>0);
  // AI стаи
  for(const e of arc.enemies){ if(e.dead)continue; e.flash=Math.max(0,e.flash-dt);
    for(const b of e.burns){b.t-=dt;e.hp-=b.dps*dt;} e.burns=e.burns.filter(b=>b.t>0);
    for(const q of e.poisons){q.t-=dt;e.hp-=q.dps*dt;} e.poisons=e.poisons.filter(q=>q.t>0);
    if(e.hp<=0){arcKillE(e);continue;}
    const em=e.slow>0?(e.slowMul||0.5):1; e.slow=Math.max(0,e.slow-dt); e.root=Math.max(0,e.root-dt);
    const d=dist(e,P), hidden=P.stealth>0;
    if(e.telegraph>0){ e.telegraph-=dt; if(e.telegraph<=0&&dist(e,P)<=e.atkRange+10&&!hidden)arcHitP(e.atk,e.el); continue; }
    if(e.root>0)continue;
    e.t=Math.max(0,e.t-dt);
    if(!hidden){ if(d>e.atkRange){const a=Math.atan2(P.y-e.y,P.x-e.x);e.x+=Math.cos(a)*e.speed*em*dt;e.y+=Math.sin(a)*e.speed*em*dt;}
      else if(e.t<=0){e.telegraph=e.tele;e.t=e.atkCd;} }
  }
  for(const f of arc.floats){f.t+=dt;f.y-=26*dt;} arc.floats=arc.floats.filter(f=>f.t<f.life);
  for(const p of arc.parts){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.92;p.vy*=0.92;} arc.parts=arc.parts.filter(p=>p.t<p.life);
  arc.shake*=0.86;
  arc.cam.x=clampN(P.x-innerWidth/2,0,Math.max(0,WORLD.w-innerWidth));
  arc.cam.y=clampN(P.y-innerHeight/2,0,Math.max(0,WORLD.h-innerHeight));
  arcHUD();
}

// —— отрисовка ——
function arcRender(){ const ctx=arc.ctx,P=arc.P,cam=arc.cam;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  const sx=arc.shake?rand(-arc.shake,arc.shake):0, sy=arc.shake?rand(-arc.shake,arc.shake):0;
  ctx.save(); ctx.translate(-cam.x+sx,-cam.y+sy);
  ctx.fillStyle='#141029';ctx.fillRect(0,0,arc.WORLD.w,arc.WORLD.h);
  ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
  for(let x=0;x<=arc.WORLD.w;x+=70){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,arc.WORLD.h);ctx.stroke();}
  for(let y=0;y<=arc.WORLD.h;y+=70){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(arc.WORLD.w,y);ctx.stroke();}
  ctx.strokeStyle='rgba(120,90,220,.4)';ctx.lineWidth=4;ctx.strokeRect(4,4,arc.WORLD.w-8,arc.WORLD.h-8);
  for(const z of arc.zones){ ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,6.283);
    ctx.fillStyle=z.sk.dotMul&&!z.sk.root?'rgba(120,220,120,.15)':'rgba(120,200,255,.15)';ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle='rgba(150,220,255,.5)';ctx.stroke(); }
  for(const e of arc.enemies){ if(e.dead||e.telegraph<=0)continue; const prog=1-e.telegraph/e.tele;
    ctx.beginPath();ctx.arc(e.x,e.y,e.atkRange,0,6.283);
    ctx.fillStyle='rgba(255,70,60,'+(0.12+prog*0.28)+')';ctx.fill();
    ctx.lineWidth=3;ctx.strokeStyle='rgba(255,90,80,'+(0.4+prog*0.5)+')';ctx.stroke(); }
  for(const pr of arc.proj){ ctx.beginPath();ctx.arc(pr.x,pr.y,pr.r,0,6.283);
    ctx.fillStyle='#ff9a3d';ctx.shadowColor='#ff5d52';ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0; }
  for(const e of arc.enemies){ if(e.dead)continue;
    if(P.target===e){ ctx.beginPath();ctx.arc(e.x,e.y,e.r+9,0,6.283);ctx.lineWidth=3;ctx.strokeStyle='#ffd36b';ctx.setLineDash([6,6]);ctx.stroke();ctx.setLineDash([]); }
    arcUnit(e.x,e.y,e.r,e.color,e.icon,e.flash>0);
    if(e.role==='leader'){ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffd36b';ctx.fillText('👑',e.x,e.y-e.r-16);}
    const bw=e.r*2.2;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(e.x-bw/2,e.y-e.r-13,bw,4);ctx.fillStyle='#ff5d52';ctx.fillRect(e.x-bw/2,e.y-e.r-13,bw*Math.max(0,e.hp/e.maxHp),4);
    if(e.burns.length){ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText('🔥',e.x-10,e.y-e.r-18);}
    if(e.poisons.length){ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText('🟢',e.x,e.y-e.r-18);}
    if(e.slow>0){ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText('❄️',e.x+10,e.y-e.r-18);} }
  const blink=P.iframe>0&&Math.floor(P.iframe*20)%2===0;
  if(!blink){ ctx.globalAlpha=P.stealth>0?0.5:1; arcUnit(P.x,P.y,P.r,P.hurt>0?'#ff8a8a':P.color,P.icon,P.hurt>0); ctx.globalAlpha=1;
    if(P.shield>0){ctx.beginPath();ctx.arc(P.x,P.y,P.r+7,0,6.283);ctx.lineWidth=3;ctx.strokeStyle='rgba(180,220,255,.8)';ctx.stroke();}
    if(P.haste>0){ctx.beginPath();ctx.arc(P.x,P.y,P.r+11,0,6.283);ctx.lineWidth=2;ctx.strokeStyle='rgba(216,180,255,.7)';ctx.stroke();}
    ctx.save();ctx.translate(P.x,P.y);ctx.rotate(P.facing);ctx.beginPath();ctx.moveTo(P.r-2,0);ctx.lineTo(P.r+12,-5);ctx.lineTo(P.r+12,5);ctx.closePath();ctx.fillStyle='#ffe08a';ctx.fill();ctx.restore(); }
  for(const p of arc.parts){ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();}ctx.globalAlpha=1;
  ctx.textAlign='center';ctx.font='bold 16px system-ui';
  for(const f of arc.floats){ctx.globalAlpha=Math.max(0,1-f.t/f.life);ctx.fillStyle=f.col;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=3;ctx.strokeText(f.txt,f.x,f.y);ctx.fillText(f.txt,f.x,f.y);}
  ctx.globalAlpha=1; ctx.restore();
}
function arcUnit(x,y,r,col,icon,flash){ const ctx=arc.ctx;
  ctx.beginPath();ctx.ellipse(x,y+r*0.8,r*0.9,r*0.35,0,0,6.283);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fill();
  ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fillStyle=flash?'#fff':col;ctx.shadowColor=col;ctx.shadowBlur=flash?20:8;ctx.fill();ctx.shadowBlur=0;
  ctx.font=(r*1.3)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(icon,x,y+1);ctx.textBaseline='alphabetic'; }
function arcHUD(){ const P=arc.P;
  const hp=document.getElementById('acHp'); if(hp)hp.style.width=(P.hp/P.maxHp*100)+'%';
  const sh=document.getElementById('acSh'); if(sh)sh.style.width=(Math.min(1,(P.shield||0)/P.maxHp)*100)+'%';
  const mn=document.getElementById('acMana'); if(mn)mn.style.width=(P.mana/P.maxMana*100)+'%';
  const foe=document.getElementById('acFoe'); if(foe){ const al=ar_alive().length;
    foe.innerHTML = arc.isDen ? ('👾 Врагов: <b>'+al+'</b> / '+arc.enemies.length) : ''; }
  const btns=document.querySelectorAll('#acAb .ac-btn');
  P.kit.forEach((sk,i)=>{const el=btns[i];if(!el)return;el.querySelector('.ac-cd').style.transform='scaleY('+(sk._t/sk.cd)+')';el.classList.toggle('nomana',P.mana<sk.mana);});
  const dEl=btns[P.kit.length]; if(dEl)dEl.querySelector('.ac-cd').style.transform='scaleY('+(P.dashT/P.dashCd)+')';
}
// —— завершение: возврат в полёт ——
function arcFinish(win){ if(!arc||arc.over)return; arc.over=true;
  if(win && typeof incubateEggs==='function') incubateEggs(2); // инкубация за победу в полёте
  if(win && typeof S!=='undefined') S.tutorialGuard=false;
  cancelAnimationFrame(arc.raf);
  window.removeEventListener('resize',arc.resize);
  window.removeEventListener('mousemove',arc._mm); window.removeEventListener('mouseup',arc._mu);
  window.removeEventListener('keydown',arc._kd); window.removeEventListener('keyup',arc._ku);
  arcJoy.active=false;arcJoy.id=null; arcKeys.clear();
  try{ arc.dragon.curHp = win ? Math.max(1,Math.round(arc.P.hp)) : Math.round(arc.P.hp); }catch(e){}
  const fsA=arc.fsA; if(fsA)fsA.style.display='none';
  if(typeof flight!=='undefined' && flight){ flight.battleWin=win;
    const fs=document.getElementById('flightFs'); if(fs)fs.style.display='block';
    document.body.classList.add('flight-active');
    try{ renderFlight(); }catch(e){ console.warn('[Драконис] аркада→полёт:',e); }
    if(typeof renderAll==='function') renderAll();
  }
  arc=null;
}
