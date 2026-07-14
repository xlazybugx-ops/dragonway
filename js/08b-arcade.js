/* ============================================================
   08b-arcade.js — АРКАДНЫЙ БОЙ встреч в полёте (top-down)
   Дикий дракон = одиночный бой. Логово = ГРУППОВОЙ бой против стаи.
   Джойстик + tab-target · автоатака · кулдауны · мана · рывок с i-frames · статусы.
   Статы из makeCombatant(); класс = стихия(роль) × телосложение(стиль).
   Возврат: flight.battleWin=win → renderFlight() (существующий контракт).
   ============================================================ */
'use strict';
/* v35: rework */
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
const ARCADE_SPRITE_SRC={fire:'images/arcade_fire.webp',frost:'images/arcade_frost.webp',venom:'images/arcade_venom.webp',storm:'images/arcade_storm.webp',shade:'images/arcade_shade.webp'};
const ARCADE_SPRITES={};
function arcadeClassSprite(el){
  if(ARCADE_SPRITES[el])return ARCADE_SPRITES[el];
  const img=new Image(); img.src=ARCADE_SPRITE_SRC[el]||ARCADE_SPRITE_SRC.fire; ARCADE_SPRITES[el]=img; return img;
}
function ar_mitig(raw,def){ return Math.max(1, Math.round(raw*(GB.Arcade.mitigConst/(GB.Arcade.mitigConst+(def||0))))); }
function ar_elMul(att,def){ if(ADVANTAGE[att]===def)return GB.Arcade.elementAdv; if(ADVANTAGE[def]===att)return GB.Arcade.elementWeak; return 1; }

let arc=null;

function ar_makeEnemy(sp,lvl,role,cx,cy,mods){
  mods=mods||{};
  const fd={id:sp.id,level:Math.max(1,lvl),xp:0,curHp:0,morph:rollMorph()};
  const foe=makeCombatant(fd,true);
  const A=GB.Arcade;
  // role: 'wild' (одиночка), 'leader' (вожак стаи), 'add' (рядовой)
  const hpMul = role==='wild'?A.hpMulWild : role==='leader'?A.hpMulLeader : A.hpMulAdd;
  const dmgMul = role==='wild'?A.dmgMulWild : A.dmgMulPack;
  const rar=sp.rarity||1;
  // REWORK: масштаб сложности — глубина забега (ярусы) и риск выбранного пути
  const depth=mods.depth||0, risk=mods.riskMul||1;
  let hp=Math.round(foe.maxHp*hpMul*(1+(rar-1)*A.rarityHpBonus)*(1+depth*A.depth.hp)*risk);
  let atk=Math.round(foe.atk*dmgMul*(1+depth*A.depth.dmg)*Math.sqrt(risk));
  let spd=clampN(60+foe.spd*5,70,160)+depth*A.depth.spd;
  if(mods.elite){hp=Math.round(hp*A.elite.hp);atk=Math.round(atk*A.elite.dmg);spd+=A.elite.spd;}
  if(mods.trial){hp=Math.round(hp*A.trial.hp);atk=Math.round(atk*A.trial.dmg);}
  // REWORK: дальнобойные враги — «магические» стихии стреляют, зона поражения сопоставима с игроком
  const ranged = mods.ranged!==undefined ? !!mods.ranged
    : (role!=='leader'&&!mods.trial&&Math.random()<A.rangedShare);
  return { sp, el:foe.el, role, x:cx, y:cy, r: role==='add'?18:(rar>=4||role==='leader'?26:20),
    color:(ELEMENTS[foe.el]||{}).color||'#c25b3a', icon:sp.sigil||'👹', sprite:arcadeClassSprite(foe.el),
    hp, maxHp:hp, atk, def:foe.def,
    speed:clampN(spd,70,215), aggro:A.enemyAggro,
    ranged, atkRange: ranged?A.rangedRange:(role==='leader'?A.leaderRange:A.meleeRange),
    atkCd: ranged?2.4:2.0, t:rand(0,1.6), tele: physiqueOf(sp)==='koloss'?1.0:0.72, telegraph:0,
    lungeT:rand(1,3), lunge:0, lungeVx:0, lungeVy:0, slot:rand(0,6.283),
    elite:!!mods.elite, trial:!!mods.trial,
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
    icon:me.sp.sigil||'🐲', sprite:arcadeClassSprite(me.el), baseSpeed:phys.spd, hp:Math.max(1,me.hp), maxHp:me.maxHp,
    atk:me.atk, def:me.def, mana:60, maxMana:100, manaRegen:11,
    target:null, globalCd:0, iframe:0, hurt:0, facing:-Math.PI/2, shield:0, haste:0, hasteAtk:1, hasteSpd:1, stealth:0,
    autoBase:phys.atkCd, autoT:0, autoRange:170, dashCd:phys.dashCd, dashT:0, dashIf:phys.iframe, kit };

  // REWORK: усиления текущего забега (roguelite-баффы, сбрасываются после странствия)
  const runFx=(typeof flight!=='undefined'&&flight&&flight.run&&flight.run.fx)||{};
  P.atk=Math.round(P.atk*(1+(runFx.atkPct||0)/100));
  P.def=Math.round(P.def*(1+(runFx.defPct||0)/100));
  P.maxHp=Math.round(P.maxHp*(1+(runFx.hpPct||0)/100));
  P.hp=Math.min(P.maxHp,Math.round(P.hp*(1+(runFx.hpPct||0)/100)));
  P.baseSpeed=Math.round(P.baseSpeed*(1+(runFx.spdPct||0)/100));
  P.manaRegen=P.manaRegen*(1+(runFx.manaPct||0)/100);
  P.crit=0.05+(runFx.critPct||0)/100;
  P.elBoost=1+(runFx.elPct||0)/100;
  P.vamp=(runFx.vampPct||0)/100;
  P.dashCd=P.dashCd*(1-(runFx.dashPct||0)/100);

  // REWORK: параметры сложности от забега: глубина + риск выбранного пути
  const mods={depth:opts.depth||0, riskMul:opts.riskMul||1};

  // стая, одиночка, элитка или испытание региона
  const enemies=[];
  const isDen = opts.kind==='den';
  const isTrial = opts.kind==='trial';
  let trialDef=null;
  if(isTrial){
    trialDef=(typeof REGION_TRIALS!=='undefined'&&REGION_TRIALS[opts.scene])||{icon:'☠️',name:'Испытание',mech:'swarm',adds:2,hint:''};
    enemies.push(ar_makeEnemy(sp, lvl+1, 'leader', cx, cy-140, {...mods, trial:true, ranged:false}));
    const adds=trialDef.adds+Math.floor((opts.depth||0)/2);
    for(let i=0;i<adds;i++){ const asp=(typeof weightedSpecies==='function')?weightedSpecies():sp;
      const ang=(i/Math.max(1,adds))*6.283, rad=130+rand(0,80);
      enemies.push(ar_makeEnemy(asp, Math.max(1,lvl-1), 'add', cx+Math.cos(ang)*rad, cy-140+Math.sin(ang)*rad*0.7, mods)); }
  } else if(isDen){
    enemies.push(ar_makeEnemy(sp, lvl, 'leader', cx, cy-140, mods));
    const adds = clampN(1+bn+Math.floor((opts.depth||0)*GB.Arcade.depth.extraAddPer/2), 2, 5); // глубже забег → больше стая
    for(let i=0;i<adds;i++){ const asp=(typeof weightedSpecies==='function')?weightedSpecies():sp;
      const ang=(i/adds)*6.283, rad=110+rand(0,70);
      enemies.push(ar_makeEnemy(asp, Math.max(1,lvl-1), 'add', cx+Math.cos(ang)*rad, cy-140+Math.sin(ang)*rad*0.7, mods)); }
  } else {
    enemies.push(ar_makeEnemy(sp, lvl, 'wild', cx, cy-120, {...mods, elite:!!opts.elite}));
  }

  const title = isTrial ? (trialDef.icon+' '+trialDef.name+' · '+trialDef.hint)
              : isDen ? ('🏴 Логово: '+sp.name+' · стая '+enemies.length)
              : (opts.elite?'👿 Элита: '+sp.name : (AR_ROLE[me.el]||'')+' '+dragonName(dragon)+' против '+sp.name);
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
  const bgKey=(typeof flight!=='undefined'&&flight&&flight.region&&typeof flyArtKey==='function')
    ?flyArtKey(flight.region):flightElementKey(sp.el);
  const bgImg=new Image(); bgImg.src=`images/flightmap_${bgKey}.webp`;
  const resize=()=>{const dpr=Math.min(2,devicePixelRatio||1);cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0);};
  window.addEventListener('resize',resize); resize();

  P.target = enemies[0];
  arc={fsA,ctx,cv,resize,WORLD,P,enemies,dragon,ent,opts,isDen,isTrial,bgImg,
    trial:isTrial?{mech:trialDef.mech,t:0,boss:enemies[0]}:null,
    stat:{taken:0,dealt:0,dur:0,maxHit:0}, kiteT:0, chaseWarned:false,
    proj:[],eproj:[],hazards:[],zones:[],fx:[],floats:[],parts:[],cam:{x:0,y:0},shake:0,over:false,raf:0,last:performance.now()};

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
    // ЧАСТЬ БОЙ: нажал → предпросмотр (зона/траектория/цели), отпустил → подтверждение и удар
    const dn=e=>{e.preventDefault();arcAimStart(i);};
    const up=e=>{e.preventDefault();arcAimCommit();};
    el.addEventListener('touchstart',dn,{passive:false}); el.addEventListener('touchend',up,{passive:false});
    el.addEventListener('touchcancel',arcAimCancel);
    el.addEventListener('mousedown',dn); el.addEventListener('mouseup',up); el.addEventListener('mouseleave',arcAimCancel);
    box.appendChild(el); });
  const d=document.createElement('div'); d.className='ac-btn dash';
  d.innerHTML='⚡<span class="ac-cd"></span><span class="ac-nm">Рывок</span>';
  const fd=e=>{e.preventDefault();arcDash();};
  d.addEventListener('touchstart',fd,{passive:false}); d.addEventListener('mousedown',fd); box.appendChild(d);
  arc._abBtns=box.querySelectorAll('.ac-btn'); // ПЕРФ: кэш кнопок (не querySelectorAll каждый кадр)
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
  if(sk.kind==='melee'){ arcZoneFx(t.x,t.y,t.r+14,'#ffd36b',true); arcHitE(t,sk.mul,sk); arcSlash(P,t); }
  else if(sk.kind==='proj'){ const a=Math.atan2(t.y-P.y,t.x-P.x);
    arc.proj.push({x:P.x,y:P.y,vx:Math.cos(a)*sk.pspd,vy:Math.sin(a)*sk.pspd,r:9,sk,life:1.4}); }
  else if(sk.kind==='self'){
    if(sk.shieldMul){P.shield=Math.round(P.maxHp*sk.shieldMul);arcBurst(P.x,P.y,'#bcdcff',16);arcWarn('щит!','#bcdcff');}
    if(sk.haste){P.haste=sk.haste.dur;P.hasteAtk=sk.haste.atk;P.hasteSpd=sk.haste.spd;arcWarn('ускорение!','#d8b4ff');}
    if(sk.stealth){P.iframe=Math.max(P.iframe,sk.iframe);P.stealth=sk.stealth;arcWarn('покров тьмы','#9a7bd0');}
    if(sk.aoe){ arcZoneFx(P.x,P.y,sk.aoe,'#ff8a3d'); for(const e of arc.enemies){ if(e.dead)continue; if(dist(P,e)<=sk.aoe){ arcHitE(e,sk.mul,sk);
      if(sk.knock){const a=Math.atan2(e.y-P.y,e.x-P.x);e.x+=Math.cos(a)*sk.knock*0.1;e.y+=Math.sin(a)*sk.knock*0.1;} } }
      arcBurst(P.x,P.y,'#ff8a3d',22);arc.shake=Math.min(arc.shake+7,11); } }
  else if(sk.kind==='ground'){ const zx=t?t.x:P.x, zy=t?t.y:P.y; arcZoneFx(zx,zy,sk.radius,'#9fe6ff'); arc.zones.push({x:zx,y:zy,r:sk.radius,dur:sk.dur,sk,tick:0}); arcWarn('поле!','#9fe6ff'); }
  else if(sk.kind==='dash'){ const a=Math.atan2(t.y-P.y,t.x-P.x),d=Math.min(sk.range,dist(P,t));
    P.x=clampN(P.x+Math.cos(a)*d,20,arc.WORLD.w-20);P.y=clampN(P.y+Math.sin(a)*d,20,arc.WORLD.h-20);
    P.iframe=Math.max(P.iframe,sk.iframe); arcZoneFx(t.x,t.y,t.r+14,'#d8b4ff',true); arcHitE(t,sk.mul,sk); arcBurst(P.x,P.y,'#d8b4ff',14); }
}
function arcAimStart(i){ if(!arc||arc.over)return; const sk=arc.P.kit[i]; if(!sk)return; arc.aim={i,sk}; }
function arcAimCommit(){ if(!arc||arc.over){ if(arc)arc.aim=null; return; } const a=arc.aim; arc.aim=null; if(a) arcUse(a.i); }
function arcAimCancel(){ if(arc) arc.aim=null; }
function arcPreviewInfo(){ if(!arc||!arc.aim)return null; const P=arc.P, sk=arc.aim.sk; if(!sk)return null;
  let t=P.target; if(t&&t.dead)t=ar_nearest();
  if(sk.kind==='self'&&sk.aoe){ let n=0; for(const e of arc.enemies)if(!e.dead&&dist(P,e)<=sk.aoe)n++;
    return {type:'circle',x:P.x,y:P.y,r:sk.aoe,col:'#ff8a3d',count:n}; }
  if(sk.kind==='ground'){ const x=t?t.x:P.x,y=t?t.y:P.y; let n=0; for(const e of arc.enemies)if(!e.dead&&Math.hypot(e.x-x,e.y-y)<=sk.radius)n++;
    return {type:'circle',x,y,r:sk.radius,col:'#9fe6ff',count:n}; }
  if(t && sk.chain){ // ЦЕПОЧКА: предсказать перескоки молнии
    const pts=[{x:t.x,y:t.y}]; const seen=new Set([t]); let src=t;
    for(let j=0;j<sk.chain;j++){ let nx=null,nd=260; for(const e of arc.enemies){ if(e.dead||seen.has(e))continue; const dd=dist(src,e); if(dd<nd){nx=e;nd=dd;} } if(!nx)break; pts.push({x:nx.x,y:nx.y}); seen.add(nx); src=nx; }
    const rng=sk.range||9999; return {type:'chain',x:t.x,y:t.y,r:t.r+14,col:'#bfe0ff',pts,count:pts.length,inrange:dist(P,t)<=rng}; }
  if(t){ const rng=sk.range||9999; return {type:'single',x:t.x,y:t.y,r:t.r+14,col:'#ffd36b',tx:t.x,ty:t.y,count:1,inrange:dist(P,t)<=rng}; }
  return {type:'none',count:0};
}
function arcDash(){ if(!arc||arc.over)return; const P=arc.P; if(P.dashT>0)return;
  let {mx,my}=arcMoveVec(); if(!mx&&!my){mx=Math.cos(P.facing);my=Math.sin(P.facing);}
  const l=Math.hypot(mx,my)||1;mx/=l;my/=l;
  P.x=clampN(P.x+mx*150,20,arc.WORLD.w-20);P.y=clampN(P.y+my*150,20,arc.WORLD.h-20);
  P.iframe=Math.max(P.iframe,P.dashIf);P.dashT=P.dashCd;arcBurst(P.x,P.y,'#fff0b4',12); }
function arcWarn(t,c){ arc.floats.push({x:arc.P.x,y:arc.P.y-30,txt:t,col:c,t:0,life:0.9}); }
function arcHitE(e,mul,sk){ const P=arc.P; if(!e||e.dead)return;
  let raw=P.atk*mul*ar_elMul(P.el,e.el)*(P.elBoost||1);
  const isCrit=Math.random()<(P.crit||0);
  let d=ar_mitig(raw*rand(0.9,1.1),e.def);
  if(isCrit)d=Math.round(d*1.5); // REWORK: криты игрока (баф забега «Меткость»)
  e.hp-=d; e.flash=0.12; arcBurst(e.x,e.y,'#ffca7a',6); arc.shake=Math.min(arc.shake+1.5,7);
  arc.stat.dealt+=d;
  arc.floats.push({x:e.x,y:e.y-e.r-6,txt:(isCrit?'💥':'')+d,col:isCrit?'#ffd36b':'#fff',t:0,life:0.85});
  if(P.vamp){const hv=Math.round(d*P.vamp);if(hv>0){P.hp=Math.min(P.maxHp,P.hp+hv);}}
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
  arc.stat.taken+=dmg; if(dmg>arc.stat.maxHit)arc.stat.maxHit=dmg; // REWORK: статистика для разбора поражения
  P.hp-=dmg;P.iframe=0.5;P.hurt=0.35;arc.shake=Math.min(arc.shake+5,11);arcBurst(P.x,P.y,'#ff5d52',12);
  arc.floats.push({x:P.x,y:P.y-P.r-6,txt:'-'+dmg,col:'#ff8a8a',t:0,life:0.9});
  if(typeof S!=='undefined' && S.tutorialGuard && P.hp<1)P.hp=1; // обучение без поражения
  if(P.hp<=0){P.hp=0;arcFinish(false);} }
/* ЧАСТЬ 4 — читаемость: краткая зона поражения (плавно появляется, гаснет сразу после удара) */
function arcZoneFx(x,y,r,col,ring){ if(!arc)return; arc.fx.push({x,y,r,col:col||'#ffd36b',ring:!!ring,t:0,ttl:0.40}); }
function arcBurst(x,y,col,n){for(let i=0;i<n;i++){const a=rand(0,6.28),s=rand(40,180);arc.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.3,.6),t:0,col,r:rand(2,4)});}}
function arcSlash(P,t){const a=Math.atan2(t.y-P.y,t.x-P.x);for(let i=0;i<6;i++)arc.parts.push({x:P.x+Math.cos(a)*30,y:P.y+Math.sin(a)*30,vx:Math.cos(a)*rand(60,160),vy:Math.sin(a)*rand(60,160),life:.3,t:0,col:'#fff',r:3});}

// —— цикл ——
function arcFrame(now){ if(!arc)return; const dt=Math.min(0.05,(now-arc.last)/1000); arc.last=now;
  try{ if(!arc.over) arcUpdate(dt); arcRender(); }catch(e){ console.warn('[Драконис] аркада: сбой кадра',e); }
  if(arc&&!arc.over) arc.raf=requestAnimationFrame(arcFrame);
}
function arcUpdate(dt){ const P=arc.P,WORLD=arc.WORLD;
  const {mx,my}=arcMoveVec(); const spd=P.baseSpeed*(P.haste>0?P.hasteSpd:1)*(P.chill||1);
  P.x=clampN(P.x+mx*spd*dt,20,WORLD.w-20);P.y=clampN(P.y+my*spd*dt,20,WORLD.h-20);
  if(mx||my)P.facing=Math.atan2(my,mx);
  P.mana=Math.min(P.maxMana,P.mana+P.manaRegen*dt);
  P.globalCd=Math.max(0,P.globalCd-dt);P.iframe=Math.max(0,P.iframe-dt);P.hurt=Math.max(0,P.hurt-dt);
  P.haste=Math.max(0,P.haste-dt);P.dashT=Math.max(0,P.dashT-dt);if(P.stealth)P.stealth=Math.max(0,P.stealth-dt);
  const atkCd=P.autoBase*(P.haste>0?P.hasteAtk:1);P.autoT=Math.max(0,P.autoT-dt);
  for(const sk of P.kit)sk._t=Math.max(0,sk._t-dt);
  arc.stat.dur+=dt;
  let t=P.target; if(t&&t.dead)t=P.target=ar_nearest(600);
  // REWORK: автоатака — полноценный летящий снаряд (траектория, скорость, попадание/промах)
  if(t&&dist(P,t)<=P.autoRange&&P.autoT<=0){
    const a=Math.atan2(t.y-P.y,t.x-P.x), ps=GB.Arcade.autoProjSpd;
    arc.proj.push({x:P.x+Math.cos(a)*(P.r+6),y:P.y+Math.sin(a)*(P.r+6),
      vx:Math.cos(a)*ps,vy:Math.sin(a)*ps,r:GB.Arcade.autoProjR,sk:{mul:1.0},life:0.6,auto:true});
    P.autoT=atkCd; P.facing=a;
  }
  // снаряды игрока — по любому врагу; промах — снаряд гаснет с эффектом
  for(const pr of arc.proj){ pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.life-=dt;
    for(const e of arc.enemies){ if(e.dead)continue; if(Math.hypot(e.x-pr.x,e.y-pr.y)<e.r+pr.r){ arcHitE(e,pr.sk.mul,pr.sk.mul===1?null:pr.sk); pr.life=0; pr.hit=true; break; } }
    if(pr.life<=0&&!pr.hit)arcBurst(pr.x,pr.y,'#9a90b8',4); } // эффект промаха
  arc.proj=arc.proj.filter(pr=>pr.life>0&&pr.x>-60&&pr.x<WORLD.w+60&&pr.y>-60&&pr.y<WORLD.h+60);
  // REWORK: снаряды врагов — можно увернуться рывком или манёвром
  for(const pr of arc.eproj){ pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.life-=dt;
    if(Math.hypot(P.x-pr.x,P.y-pr.y)<P.r+pr.r&&P.stealth<=0){ arcHitP(pr.atk,pr.el); pr.life=0; pr.hit=true; }
    if(pr.life<=0&&!pr.hit)arcBurst(pr.x,pr.y,'#8890a8',4); }
  arc.eproj=arc.eproj.filter(pr=>pr.life>0);
  // REWORK: опасные зоны (испытания регионов): предупреждение → удар
  for(const hz of arc.hazards){
    if(hz.warn>0){ hz.warn-=dt; }
    else { hz.dur-=dt;
      if(hz.dps){ if(dist(hz,P)<=hz.r&&P.iframe<=0&&P.stealth<=0){ hz.tick=(hz.tick||0)+dt;
        if(hz.tick>=0.45){hz.tick=0;arcHitP(hz.dps,hz.el||'fire');} } }
      else if(hz.dmg&&!hz.hitDone){ hz.hitDone=true;
        if(dist(hz,P)<=hz.r&&P.stealth<=0)arcHitP(hz.dmg,hz.el||'storm');
        arcBurst(hz.x,hz.y,hz.col||'#ffe08a',14); arc.shake=Math.min(arc.shake+4,10); } } }
  arc.hazards=arc.hazards.filter(hz=>hz.warn>0||hz.dur>0);
  // REWORK: механики испытаний региона
  if(arc.trial&&!arc.trial.boss.dead){ const T=arc.trial; T.t+=dt; const B=T.boss;
    if(T.mech==='burn'&&T.t>2.4){ T.t=0; arc.hazards.push({x:P.x,y:P.y,r:110,warn:0.8,dur:2.6,dps:B.atk*0.55,el:'fire',col:'#ff8a3d'}); }
    if(T.mech==='bolts'&&T.t>2.8){ T.t=0; for(let i=0;i<2;i++)arc.hazards.push({x:P.x+rand(-90,90),y:P.y+rand(-90,90),r:80,warn:0.9,dur:0.25,dmg:B.atk*1.1,el:'storm',col:'#ffe08a'}); }
    if(T.mech==='chill'){ P.chill=dist(P,B)<300?0.72:1; } else P.chill=1;
    if(T.mech==='veil'&&T.t>5){ T.t=0; B.veil=1.4; const a=rand(0,6.283);
      B.x=clampN(P.x+Math.cos(a)*240,40,WORLD.w-40); B.y=clampN(P.y+Math.sin(a)*240,40,WORLD.h-40);
      arcBurst(B.x,B.y,'#9a7bd0',16); }
    if(B.veil)B.veil=Math.max(0,B.veil-dt);
  } else if(P.chill!==1) P.chill=1;
  // зоны — по всем в радиусе
  for(const z of arc.zones){ z.dur-=dt;
    for(const e of arc.enemies){ if(e.dead)continue; if(dist(z,e)<=z.r){ e.slow=Math.max(e.slow,0.3); e.slowMul=z.sk.root?0.1:0.4; } }
    if(z.sk.dotMul){ z.tick+=dt; if(z.tick>=0.5){ z.tick=0; for(const e of arc.enemies){ if(!e.dead&&dist(z,e)<=z.r){ e.hp-=Math.round(P.atk*z.sk.dotMul*0.5); if(e.hp<=0)arcKillE(e); } } } } }
  arc.zones=arc.zones.filter(z=>z.dur>0);
  // REWORK: детекция кайтинга — игрок бьёт и постоянно отступает → стая переходит в погоню
  const K=GB.Arcade.kite;
  {const ne=ar_nearest(900);
   if(ne){ const ax=ne.x-P.x, ay=ne.y-P.y, al=Math.hypot(ax,ay)||1;
     const away=-((mx*ax+my*ay)/al); // >0 — движение прочь от врага
     if((mx||my)&&away>0.35&&dist(P,ne)>110) arc.kiteT=Math.min(4,arc.kiteT+dt);
     else arc.kiteT=Math.max(0,arc.kiteT-dt*1.8); }
   else arc.kiteT=0;}
  const chase=arc.kiteT>K.detectT;
  if(chase&&!arc.chaseWarned){arc.chaseWarned=true;arcWarn('⚡ ПОГОНЯ!','#ff9a6b');}
  if(!chase&&arc.chaseWarned&&arc.kiteT<=0)arc.chaseWarned=false;

  // AI стаи: окружение, рывки, перекрытие пути, дальние атаки
  for(const e of arc.enemies){ if(e.dead)continue; e.flash=Math.max(0,e.flash-dt);
    for(const b of e.burns){b.t-=dt;e.hp-=b.dps*dt;} e.burns=e.burns.filter(b=>b.t>0);
    for(const q of e.poisons){q.t-=dt;e.hp-=q.dps*dt;} e.poisons=e.poisons.filter(q=>q.t>0);
    if(e.hp<=0){arcKillE(e);continue;}
    const em=e.slow>0?(e.slowMul||0.5):1; e.slow=Math.max(0,e.slow-dt); e.root=Math.max(0,e.root-dt);
    const d=dist(e,P), hidden=P.stealth>0;
    // рывок-перехват в процессе
    if(e.lunge>0){ e.lunge-=dt;
      e.x=clampN(e.x+e.lungeVx*dt,20,WORLD.w-20); e.y=clampN(e.y+e.lungeVy*dt,20,WORLD.h-20);
      if(dist(e,P)<=e.atkRange*0.8&&!hidden){e.lunge=0;e.telegraph=e.tele*0.6;e.t=e.atkCd;}
      continue; }
    if(e.telegraph>0){ e.telegraph-=dt;
      if(e.telegraph<=0&&!hidden){
        if(e.ranged){ // выстрел в игрока с упреждением
          const lead=0.25, tx=P.x+(mx*spd)*lead, ty=P.y+(my*spd)*lead;
          const a=Math.atan2(ty-e.y,tx-e.x), ps=GB.Arcade.rangedProjSpd;
          arc.eproj.push({x:e.x,y:e.y,vx:Math.cos(a)*ps,vy:Math.sin(a)*ps,r:8,atk:e.atk,el:e.el,col:e.color,life:1.8});
        } else if(dist(e,P)<=e.atkRange+30) arcHitP(e.atk,e.el);
      } continue; }
    if(e.root>0)continue;
    e.t=Math.max(0,e.t-dt); e.lungeT=Math.max(0,e.lungeT-dt);
    if(hidden)continue;
    const chaseMul=chase?K.speedMul:1;
    if(e.ranged){
      // дальнобойный: держит дистанцию, стреляет; при погоне — чаще
      if(d>e.atkRange*0.92){const a=Math.atan2(P.y-e.y,P.x-e.x);e.x+=Math.cos(a)*e.speed*em*chaseMul*dt;e.y+=Math.sin(a)*e.speed*em*chaseMul*dt;}
      else if(d<e.atkRange*0.5){const a=Math.atan2(e.y-P.y,e.x-P.x);e.x+=Math.cos(a)*e.speed*em*0.7*dt;e.y+=Math.sin(a)*e.speed*em*0.7*dt;}
      if(d<=e.atkRange&&e.t<=0){e.telegraph=e.tele;e.t=e.atkCd*(chase?0.75:1);}
    } else {
      // ближний: при погоне — рывок-перехват наперерез
      if(chase&&e.lungeT<=0&&d>e.atkRange&&d<K.lungeDist+e.atkRange+120){
        const lead=Math.min(0.5,d/K.lungeSpd), tx=P.x+mx*spd*lead*1.4, ty=P.y+my*spd*lead*1.4;
        const a=Math.atan2(ty-e.y,tx-e.x);
        e.lunge=Math.min(0.45,d/K.lungeSpd+0.12); e.lungeVx=Math.cos(a)*K.lungeSpd; e.lungeVy=Math.sin(a)*K.lungeSpd;
        e.lungeT=K.lungeCd; arcZoneFx(e.x,e.y,e.r+10,'#ff9a6b',true);
        continue; }
      if(d>e.atkRange){
        // окружение: каждый заходит со своей стороны, а не толпой по прямой
        const sx2=P.x+Math.cos(e.slot)*Math.min(K.surroundR,d*0.5), sy2=P.y+Math.sin(e.slot)*Math.min(K.surroundR,d*0.5);
        const goStraight=d<e.atkRange*1.6;
        const a=goStraight?Math.atan2(P.y-e.y,P.x-e.x):Math.atan2(sy2-e.y,sx2-e.x);
        e.x+=Math.cos(a)*e.speed*em*chaseMul*dt; e.y+=Math.sin(a)*e.speed*em*chaseMul*dt;
      } else if(e.t<=0){e.telegraph=e.tele;e.t=e.atkCd;}
    }
  }
  for(const f of arc.floats){f.t+=dt;f.y-=26*dt;} arc.floats=arc.floats.filter(f=>f.t<f.life);
  for(const p of arc.parts){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.92;p.vy*=0.92;} arc.parts=arc.parts.filter(p=>p.t<p.life);
  arc.shake*=0.86;
  for(const z of arc.fx)z.t+=dt; arc.fx=arc.fx.filter(z=>z.t<z.ttl);
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
  if(arc.bgImg&&arc.bgImg.complete&&arc.bgImg.naturalWidth){
    ctx.save();ctx.globalAlpha=.82;ctx.drawImage(arc.bgImg,0,0,arc.WORLD.w,arc.WORLD.h);ctx.restore();
  }
  ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
  for(let x=0;x<=arc.WORLD.w;x+=70){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,arc.WORLD.h);ctx.stroke();}
  for(let y=0;y<=arc.WORLD.h;y+=70){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(arc.WORLD.w,y);ctx.stroke();}
  ctx.strokeStyle='rgba(120,90,220,.4)';ctx.lineWidth=4;ctx.strokeRect(4,4,arc.WORLD.w-8,arc.WORLD.h-8);
  for(const z of arc.zones){ ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,6.283);
    ctx.fillStyle=z.sk.dotMul&&!z.sk.root?'rgba(120,220,120,.15)':'rgba(120,200,255,.15)';ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle='rgba(150,220,255,.5)';ctx.stroke(); }
  // ЧАСТЬ 4: транзиентные зоны поражения (fade-in → fade-out)
  for(const z of arc.fx){ const k=z.t/z.ttl, a=(k<0.3?k/0.3:1-(k-0.3)/0.7);
    ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,6.283);
    if(z.ring){ ctx.globalAlpha=Math.max(0,a);ctx.lineWidth=4;ctx.strokeStyle=z.col;ctx.stroke();ctx.globalAlpha=1; }
    else { ctx.globalAlpha=Math.max(0,a*0.28);ctx.fillStyle=z.col;ctx.fill();
      ctx.globalAlpha=Math.max(0,a*0.8);ctx.lineWidth=3;ctx.strokeStyle=z.col;ctx.stroke();ctx.globalAlpha=1; } }
  // ЧАСТЬ 4: линия атаки к текущей цели — исключает двусмысленность одиночного удара
  if(P.target&&!P.target.dead){ ctx.save();ctx.setLineDash([4,9]);ctx.lineWidth=2;ctx.strokeStyle='rgba(255,211,107,.32)';
    ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(P.target.x,P.target.y);ctx.stroke();ctx.restore(); }
  for(const e of arc.enemies){ if(e.dead||e.telegraph<=0)continue; const prog=1-e.telegraph/e.tele;
    ctx.beginPath();ctx.arc(e.x,e.y,e.atkRange,0,6.283);
    ctx.fillStyle='rgba(255,70,60,'+(0.12+prog*0.28)+')';ctx.fill();
    ctx.lineWidth=3;ctx.strokeStyle='rgba(255,90,80,'+(0.4+prog*0.5)+')';ctx.stroke(); }
  // REWORK: опасные зоны испытаний — предупреждение (кольцо) → зона удара
  for(const hz of arc.hazards){ ctx.beginPath();ctx.arc(hz.x,hz.y,hz.r,0,6.283);
    if(hz.warn>0){ ctx.globalAlpha=0.55;ctx.setLineDash([7,7]);ctx.lineWidth=3;ctx.strokeStyle=hz.col||'#ffe08a';ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1; }
    else { ctx.globalAlpha=0.24;ctx.fillStyle=hz.col||'#ff8a3d';ctx.fill();ctx.globalAlpha=0.8;ctx.lineWidth=2;ctx.strokeStyle=hz.col||'#ff8a3d';ctx.stroke();ctx.globalAlpha=1; } }
  for(const pr of arc.proj){ ctx.beginPath();ctx.arc(pr.x,pr.y,pr.r,0,6.283);
    ctx.fillStyle='#ff9a3d';ctx.shadowColor='#ff5d52';ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0; }
  // REWORK: снаряды врагов — читаемые, со свечением цвета стихии
  for(const pr of arc.eproj){ ctx.beginPath();ctx.arc(pr.x,pr.y,pr.r,0,6.283);
    ctx.fillStyle=pr.col||'#c25b3a';ctx.shadowColor=pr.col||'#c25b3a';ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(pr.x,pr.y,pr.r+3,0,6.283);ctx.lineWidth=1.5;ctx.strokeStyle='rgba(255,255,255,.5)';ctx.stroke(); }
  for(const e of arc.enemies){ if(e.dead)continue;
    if(P.target===e){ ctx.beginPath();ctx.arc(e.x,e.y,e.r+9,0,6.283);ctx.lineWidth=3;ctx.strokeStyle='#ffd36b';ctx.setLineDash([6,6]);ctx.stroke();ctx.setLineDash([]); }
    if(e.veil)ctx.globalAlpha=0.16; // испытание Тьмы: страж уходит в вуаль
    arcEnemySprite(e);
    ctx.globalAlpha=1;
    if(e.elite){ctx.beginPath();ctx.arc(e.x,e.y,e.r+6,0,6.283);ctx.lineWidth=2.5;ctx.strokeStyle='#d8b4ff';ctx.stroke();
      ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText('👿',e.x,e.y-e.r-16);}
    if(e.trial){ctx.font='13px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffd36b';ctx.fillText('☠️',e.x,e.y-e.r-18);}
    if(e.role==='leader'&&!e.trial){ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffd36b';ctx.fillText('👑',e.x,e.y-e.r-16);}
    const bw=e.r*2.2;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(e.x-bw/2,e.y-e.r-13,bw,4);ctx.fillStyle='#ff5d52';ctx.fillRect(e.x-bw/2,e.y-e.r-13,bw*Math.max(0,e.hp/e.maxHp),4);
    if(e.burns.length){ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText('🔥',e.x-10,e.y-e.r-18);}
    if(e.poisons.length){ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText('🟢',e.x,e.y-e.r-18);}
    if(e.slow>0){ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText('❄️',e.x+10,e.y-e.r-18);} }
  // ПРЕДПРОСМОТР способности до подтверждения: траектория, зона, задетые цели, счётчик
  const _aim=arcPreviewInfo();
  if(_aim){
    if(_aim.type==='circle'){ ctx.beginPath();ctx.arc(_aim.x,_aim.y,_aim.r,0,6.283);
      ctx.globalAlpha=0.18;ctx.fillStyle=_aim.col;ctx.fill();ctx.globalAlpha=0.95;
      ctx.setLineDash([9,6]);ctx.lineWidth=3;ctx.strokeStyle=_aim.col;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
      for(const e of arc.enemies){ if(e.dead)continue; if(Math.hypot(e.x-_aim.x,e.y-_aim.y)<=_aim.r){ ctx.beginPath();ctx.arc(e.x,e.y,e.r+6,0,6.283);ctx.lineWidth=3;ctx.strokeStyle=_aim.col;ctx.stroke(); } }
      ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.fillStyle='#fff';
      ctx.strokeText('🎯 '+_aim.count,_aim.x,_aim.y-_aim.r-8);ctx.fillText('🎯 '+_aim.count,_aim.x,_aim.y-_aim.r-8);
    } else if(_aim.type==='single'){
      ctx.save();ctx.setLineDash([6,7]);ctx.lineWidth=3;ctx.strokeStyle=_aim.inrange?'rgba(255,211,107,.85)':'rgba(255,90,80,.6)';
      ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(_aim.tx,_aim.ty);ctx.stroke();ctx.restore();
      ctx.beginPath();ctx.arc(_aim.x,_aim.y,_aim.r,0,6.283);ctx.lineWidth=3;ctx.strokeStyle=_aim.inrange?'#ffd36b':'#ff5a50';ctx.stroke();
      ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.fillStyle=_aim.inrange?'#fff':'#ffb3ad';
      ctx.strokeText(_aim.inrange?'🎯 1':'вне зоны',_aim.x,_aim.y-_aim.r-8);ctx.fillText(_aim.inrange?'🎯 1':'вне зоны',_aim.x,_aim.y-_aim.r-8);
    } else if(_aim.type==='chain'){
      ctx.save();ctx.setLineDash([5,6]);ctx.lineWidth=3;ctx.strokeStyle=_aim.inrange?'rgba(191,224,255,.9)':'rgba(255,90,80,.6)';
      ctx.beginPath();ctx.moveTo(P.x,P.y); for(const pt of _aim.pts)ctx.lineTo(pt.x,pt.y); ctx.stroke();ctx.restore();
      for(const pt of _aim.pts){ ctx.beginPath();ctx.arc(pt.x,pt.y,16,0,6.283);ctx.lineWidth=3;ctx.strokeStyle=_aim.col;ctx.stroke(); }
      ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.fillStyle='#fff';
      ctx.strokeText('🎯 '+_aim.count,_aim.x,_aim.y-_aim.r-8);ctx.fillText('🎯 '+_aim.count,_aim.x,_aim.y-_aim.r-8);
    }
  }
  const blink=P.iframe>0&&Math.floor(P.iframe*20)%2===0;
  if(!blink){ ctx.globalAlpha=P.stealth>0?0.5:1; arcPlayerSprite(P); ctx.globalAlpha=1;
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
function arcEnemySprite(e){ const ctx=arc.ctx,img=e.sprite;
  if(!img||!img.complete||!img.naturalWidth){arcUnit(e.x,e.y,e.r,e.color,e.icon,e.flash>0);return;}
  const now=performance.now()/1000, flap=Math.sin(now*9+(e.slot||0)), lift=(flap+1)*2.2;
  const size=e.r*(e.elite||e.trial?5.1:(e.role==='leader'?4.8:4.25));
  const face=Math.atan2(arc.P.y-e.y,arc.P.x-e.x);
  ctx.save();ctx.translate(e.x,e.y-lift);ctx.rotate(face+Math.PI/2);ctx.scale(1+flap*.12,1-flap*.045);
  ctx.shadowColor=e.flash>0?'#fff':e.color;ctx.shadowBlur=e.flash>0?20:9;
  ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();
}
function arcPlayerSprite(P){ const ctx=arc.ctx,img=P.sprite;
  if(!img||!img.complete||!img.naturalWidth){arcUnit(P.x,P.y,P.r,P.hurt>0?'#ff8a8a':P.color,P.icon,P.hurt>0);return;}
  const size=P.r*4.2, now=performance.now()/1000, flap=Math.sin(now*10), lift=(flap+1)*2.8;
  ctx.save();ctx.translate(P.x,P.y-lift);ctx.rotate(P.facing+Math.PI/2);
  ctx.scale(1+flap*.13,1-flap*.05);
  ctx.shadowColor=P.hurt>0?'#ff6a6a':P.color;ctx.shadowBlur=P.hurt>0?18:8;
  ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();
}
function arcHUD(){ const P=arc.P;
  if(!arc._hud) arc._hud={hp:document.getElementById('acHp'),sh:document.getElementById('acSh'),mana:document.getElementById('acMana'),foe:document.getElementById('acFoe')}; // ПЕРФ: кэш ссылок HUD
  const h=arc._hud, prevAl=arc._prevAl;
  if(h.hp)h.hp.style.width=(P.hp/P.maxHp*100)+'%';
  if(h.sh)h.sh.style.width=(Math.min(1,(P.shield||0)/P.maxHp)*100)+'%';
  if(h.mana)h.mana.style.width=(P.mana/P.maxMana*100)+'%';
  if(h.foe && arc.isDen){ let al=0; for(const e of arc.enemies) if(!e.dead)al++; if(al!==prevAl){ arc._prevAl=al; h.foe.innerHTML='👾 Врагов: <b>'+al+'</b> / '+arc.enemies.length; } } // ПЕРФ: счётчик без аллокации + обновление текста только при изменении
  const btns=arc._abBtns||(arc._abBtns=document.querySelectorAll('#acAb .ac-btn'));
  P.kit.forEach((sk,i)=>{const el=btns[i];if(!el)return;el.querySelector('.ac-cd').style.transform='scaleY('+(sk._t/sk.cd)+')';el.classList.toggle('nomana',P.mana<sk.mana);});
  const dEl=btns[P.kit.length]; if(dEl)dEl.querySelector('.ac-cd').style.transform='scaleY('+(P.dashT/P.dashCd)+')';
}
/* REWORK: РАЗБОР ПОРАЖЕНИЯ — понятная причина и цель развития (стена прогресса) */
function arcDefeatReason(){
  const P=arc.P, st=arc.stat;
  let top=null; for(const e of arc.enemies){ if(!top||e.atk>top.atk)top=e; }
  const foeLvl=arc.opts.lvl||arc.dragon.level;
  const elName=el=>((typeof ELEMENTS!=='undefined'&&ELEMENTS[el])||{}).name||el;
  const counter=el=>{ for(const k in ADVANTAGE){ if(ADVANTAGE[k]===el) return k; } return null; };
  // 1) стихийное невыгодное противостояние
  if(top&&ADVANTAGE[top.el]===P.el){ const c=counter(top.el);
    return {icon:'🌀',title:'Неудачная стихия',why:`${elName(top.el)} сильна против твоей (${elName(P.el)})`,
      goal:c?`Возьми дракона стихии «${elName(c)}» — он бьёт ${elName(top.el)} на +28%`:'Смени стихию дракона'}; }
  // 2) слишком большие входящие удары — мало защиты/HP
  if(st.maxHit>=P.maxHp*0.3)
    return {icon:'🛡️',title:'Мало защиты',why:`Один удар снимал до ${Math.round(st.maxHit/P.maxHp*100)}% здоровья`,
      goal:'Прокуй броню в Кузнице или выбирай усиления «Чешуя»/«Крепость» в забеге'};
  // 3) не хватает урона — бой затянулся
  const dps=st.dur>3?st.dealt/st.dur:999;
  if(top&&dps>0&&(top.maxHp/Math.max(1,dps))>30)
    return {icon:'⚔️',title:'Не хватает урона',why:'Бой затянулся — враг успел измотать тебя',
      goal:`Подними уровень (враг ур.${foeLvl}) или прокуй оружие; в забеге бери «Ярость»/«Меткость»`};
  // 4) уровень
  if(foeLvl>arc.dragon.level+1)
    return {icon:'⭐',title:'Недостаточно уровня',why:`Враг ур.${foeLvl}, твой дракон ур.${arc.dragon.level}`,
      goal:'Набери опыт в верхних ярусах или на арене, затем возвращайся'};
  // 5) по умолчанию — тактика
  return {icon:'💨',title:'Зажали в бою',why:'Слишком долго стоял под ударами стаи',
    goal:'Уворачивайся рывком от красных зон и снарядов, не дай себя окружить'};
}

// —— завершение: возврат в полёт ——
function arcFinish(win){ if(!arc||arc.over)return; arc.over=true;
  // REWORK: передаём итог боя забегу — причина поражения / данные для наград и бустов
  try{ if(typeof flight!=='undefined'&&flight){
    flight.lastDefeat = win?null:arcDefeatReason();
    flight.lastFightKind = arc.opts.kind||'wild';
  } }catch(e){}
  if(win && typeof incubateEggs==='function') incubateEggs(GB.Eggs.incBattle); // инкубация за победу в полёте
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
