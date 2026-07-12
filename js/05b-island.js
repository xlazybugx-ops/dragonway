/* ============================================================
   05b-island.js — ЖИВОЙ ОСТРОВ ЛОГОВА (v36, HOME REWORK)
   Переопределяет mountLivingLair() из 05-ui-base.js (загружается позже),
   не меняя существующие файлы. Логово = второй игровой цикл:
   камера к дракону · живой остров · поведение и характер · любимые места ·
   зона инкубации · интерактив · время суток · погода · доверие ·
   социальное поведение · мини-истории · рост острова с прогрессом.
   Баланс боя НЕ меняется. Все данные — в объектах драконов (persist как раньше).
   ============================================================ */
'use strict';

/* ---------- конфиг острова (тюнинг без правки логики) ---------- */
const ISL={
  H: Math.max(300, Math.min(430, Math.round(innerHeight*0.5))), // высота сцены
  WORLD_K: 2.6,          // ширина мира = K × ширина экрана сцены
  CAM_EASE: 2.6,         // сглаживание камеры
  TRUST:{ tapCd: 20, tapGain: 1, storyGain: 3, eggGain: 1, lvls:[10,25,50,80,100] },
  STORY_T:[38,70],       // интервал мини-историй, сек
  SOCIAL_T:[9,16],       // интервал социальных сцен
  POOLS:{ rain:70, leaves:14, fireflies:22, birds:4, butterflies:6, fish:3, sparks:40 },
};

/* зоны острова: открываются с прогрессом (progLevel) — остров растёт с игроком */
const ISL_ZONES=[
  {id:'glade',  lvl:1,   name:'Родная поляна',      icon:'🌿'},
  {id:'pond',   lvl:5,   name:'Тихий пруд',          icon:'🐟'},
  {id:'falls',  lvl:10,  name:'Водопад и мостик',    icon:'💦'},
  {id:'crystal',lvl:20,  name:'Кристальный сад',     icon:'💎'},
  {id:'ruins',  lvl:35,  name:'Древние руины',       icon:'🏛️'},
  {id:'springs',lvl:50,  name:'Горячие источники',   icon:'♨️'},
  {id:'cliff',  lvl:70,  name:'Высокий утёс',        icon:'⛰️'},
  {id:'shrine', lvl:100, name:'Святилище Предков',   icon:'⛩️'},
];

/* реплики по уровню доверия (открываются постепенно) */
const ISL_PHRASES=[
  ['…','*принюхивается*','?'],
  ['Привет!','Ты вернулся!','*рад видеть*'],
  ['Полетаем?','Я ждал тебя!','Смотри, что нашёл!'],
  ['Ты мой лучший друг','Вместе — хоть в Бездну!','*мурлычет*'],
  ['Я верю тебе безгранично','Моё пламя — твоё','*сияет от счастья*'],
];
/* характер → слово для пузыря (только атмосфера, баланс не тронут) */
const ISL_CHAR_WORD={fierce:'смелый',stalwart:'спокойный',vital:'ленивый',swift:'игривый',
  savage:'упрямый',tough:'добрый',nimble:'любознательный',guarded:'осторожный',balanced:'уравновешенный'};

/* мини-истории: бытовые события, награды — только косметика/коллекция/доверие */
const ISL_STORIES=[
  {icon:'💎', t:'нашёл красивый камень и хочет показать тебе!', codex:'Красивый камень'},
  {icon:'🧸', t:'потерял любимую игрушку. Помоги поискать в кустах!', codex:'Потерянная игрушка'},
  {icon:'🥚', t:'заметил в скалах что-то похожее на старое яйцо…', codex:'Старая скорлупа'},
  {icon:'🕳️', t:'просит исследовать новую пещеру на краю острова.', codex:'Новая пещера'},
  {icon:'🗿', t:'откопал древний тотем! Вся стая сбежалась смотреть.', codex:'Древний тотем'},
  {icon:'🦴', t:'зарыл что-то у костра и очень доволен собой.', codex:'Тайник у костра'},
];

let isl=null; // всё состояние сцены (создаётся на входе, живёт пока экран открыт)

/* ---------- вспомогательное ---------- */
function islRand(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function islLerp(a,b,k){ return a+(b-a)*k; }
function islMix(c1,c2,k){ // смешение hex-цветов для неба
  const p=(c,i)=>parseInt(c.substr(i,2),16);
  const r=Math.round(islLerp(p(c1,1),p(c2,1),k)), g=Math.round(islLerp(p(c1,3),p(c2,3),k)), b=Math.round(islLerp(p(c1,5),p(c2,5),k));
  return 'rgb('+r+','+g+','+b+')';
}
function islTrust(d){ return d.trust||0; }
function islTrustLvl(d){ const t=islTrust(d), L=ISL.TRUST.lvls; let n=0; for(const x of L){ if(t>=x)n++; } return n; }
function islGainTrust(d,amt,why){
  d.trust=Math.min(100,(d.trust||0)+amt);
  const L=ISL.TRUST.lvls, prev=d._trustSeen||0, now=islTrustLvl(d);
  d._trustSeen=now;
  if(now>prev){ // новый уровень доверия: эмоции, реплики, запись Кодекса, украшение
    if(typeof toast==='function') toast(`💞 <b>${dragonName(d)}</b> доверяет тебе сильнее! Открыто: новые эмоции и реплики.`);
    if(typeof worldSeen==='function') worldSeen('events','Доверие: '+dragonName(d)+' ур.'+now);
    if(now>=5 && typeof DECORATIONS!=='undefined' && S.decorOwned){
      const free=DECORATIONS.filter(x=>!x.premium && !(S.decorOwned||[]).includes(x.id));
      if(free.length){ S.decorOwned.push(free[0].id);
        if(typeof toast==='function') toast(`🎁 ${dragonName(d)} принёс украшение: <b>${free[0].name}</b>!`); }
    }
  }
  if(typeof persist==='function') persist();
}

/* ---------- время суток и погода (только атмосфера) ---------- */
function islDayPhase(){ // 0..1 по суткам, плавно
  const d=new Date(); return (d.getHours()*3600+d.getMinutes()*60+d.getSeconds())/86400;
}
/* фазы: ночь 0-0.2 · утро 0.2-0.33 · день 0.33-0.7 · вечер 0.7-0.85 · ночь 0.85-1 */
function islSky(ph){
  const stops=[ // [фаза, верх, низ, свет]
    [0.00,'#0b1026','#1c1440',0.25],[0.20,'#0b1026','#1c1440',0.25],
    [0.27,'#7a4a63','#e8a06a',0.75],[0.40,'#69a8d8','#cfe8f2',1.0],
    [0.62,'#69a8d8','#cfe8f2',1.0],[0.76,'#a05a4e','#f0b060',0.8],
    [0.86,'#0b1026','#1c1440',0.25],[1.00,'#0b1026','#1c1440',0.25]];
  for(let i=0;i<stops.length-1;i++){ const a=stops[i],b=stops[i+1];
    if(ph>=a[0]&&ph<=b[0]){ const k=(ph-a[0])/Math.max(0.0001,b[0]-a[0]);
      return {top:islMix(a[1],b[1],k), bot:islMix(a[2],b[2],k), light:islLerp(a[3],b[3],k)}; } }
  return {top:'#69a8d8',bot:'#cfe8f2',light:1};
}
function islIsNight(ph){ return ph<0.22||ph>0.84; }
function islWeather(){ // погода дня: детерминирована датой, меняется в полночь
  const day=new Date(); const seed=day.getFullYear()*372+ (day.getMonth()+1)*31 + day.getDate();
  const r=islRand(seed)();
  if(r<0.34) return 'sun'; if(r<0.5) return 'wind'; if(r<0.66) return 'rain';
  if(r<0.78) return 'fog'; if(r<0.9) return 'storm'; return 'clear';
}

/* ---------- построение острова ---------- */
function islBuild(cvW){
  const plvl=(typeof progLevel==='function')?progLevel():1;
  const zones=ISL_ZONES.map(z=>({...z, open:plvl>=z.lvl}));
  const openN=zones.filter(z=>z.open).length;
  const W=Math.round(cvW*Math.min(ISL.WORLD_K,1.2+openN*0.28)); // остров растёт с зонами
  const H=ISL.H, ground=H*0.72;
  const r=islRand(777+openN*13);
  const props=[]; // {x,y,e,s,zone,sway,tapT,kind}
  const seg=W/zones.length;
  const put=(zi,e,n,kind,yOff,sz)=>{ for(let i=0;i<n;i++){
    props.push({x:seg*zi+20+r()*(seg-40), y:ground+(yOff||0)+ (r()-0.5)*26, e, s:(sz||20)+r()*8,
      zone:zi, sway:r()*6.28, tapT:0, kind:kind||'deco'}); } };
  zones.forEach((z,i)=>{
    if(!z.open) return;
    // базовая растительность в каждой открытой зоне
    put(i,'🌲',2,'tree',-16,26); put(i,'🌳',1,'tree',-14,24); put(i,'🌿',2,'bush',2,14);
    put(i,'🌸',2,'flower',6,11); put(i,'🍄',1,'shroom',6,12);
    if(z.id==='glade'){ put(i,'🏡',1,'home',-24,34); put(i,'🔥',1,'fire',4,18); put(i,'🪵',1,'rest',8,14); put(i,'🏮',1,'lantern',-6,14); }
    if(z.id==='pond'){ put(i,'🪷',2,'pond',14,13); put(i,'🌾',2,'grass',8,13); }
    if(z.id==='falls'){ put(i,'🌉',1,'bridge',-6,30); put(i,'🪨',2,'rock',4,15); }
    if(z.id==='crystal'){ put(i,'💎',3,'crystal',2,15); put(i,'🔮',1,'crystal',-4,14); put(i,'🏮',1,'lantern',-6,13); }
    if(z.id==='ruins'){ put(i,'🏛️',1,'ruin',-14,30); put(i,'🗿',1,'totem',0,20); put(i,'🕯️',1,'lantern',4,11); }
    if(z.id==='springs'){ put(i,'♨️',2,'spring',6,17); put(i,'🪨',1,'rock',4,14); }
    if(z.id==='cliff'){ put(i,'⛰️',1,'cliff',-22,36); put(i,'🦅',1,'deco',-40,14); put(i,'🪜',1,'deco',0,13); }
    if(z.id==='shrine'){ put(i,'⛩️',1,'shrine',-16,32); put(i,'🕊️',1,'deco',-34,12); put(i,'🏮',2,'lantern',-4,13); }
  });
  // тропинка-точки вдоль земли
  const path=[]; for(let x=24;x<W-24;x+=34) path.push({x, y:ground+18+Math.sin(x*0.02)*6});
  // гнездо-инкубатор: в первой зоне, чуть правее дома
  const nest={x:seg*0.62, y:ground-2, r:46};
  // вода: пруд (зона pond) и водопад (falls)
  const pond=zones[1]&&zones[1].open?{x:seg*1.5,y:ground+16,rx:seg*0.32,ry:16}:null;
  const falls=zones[2]&&zones[2].open?{x:seg*2.5,y:ground}:null;
  const springs=zones[5]&&zones[5].open?{x:seg*5.5,y:ground}:null;
  const fire=props.find(p=>p.kind==='fire')||null;
  return {zones,W,H,ground,props,path,nest,pond,falls,springs,fire,seg,openN,plvl};
}

/* ---------- пулы фоновой жизни (Object Pool: аллокация один раз) ---------- */
function islPools(world){
  const P=ISL.POOLS, r=islRand(42);
  const mk=(n,init)=>{ const a=new Array(n); for(let i=0;i<n;i++){ a[i]={on:false}; init(a[i],i); } return a; };
  return {
    rain: mk(P.rain,o=>{o.x=0;o.y=0;o.v=0;}),
    leaves: mk(P.leaves,o=>{o.x=r()*world.W;o.y=r()*world.ground;o.ph=r()*6;o.on=true;}),
    fireflies: mk(P.fireflies,o=>{o.x=r()*world.W;o.y=world.ground-20-r()*80;o.ph=r()*6;}),
    birds: mk(P.birds,o=>{o.x=-50-r()*300;o.y=40+r()*60;o.v=26+r()*18;o.on=true;}),
    butterflies: mk(P.butterflies,o=>{o.x=r()*world.W;o.y=world.ground-14-r()*40;o.ph=r()*6;o.on=true;}),
    fish: mk(P.fish,o=>{o.t=r()*6;}),
    sparks: mk(P.sparks,o=>{o.t=9;}),
  };
}
function islSpark(x,y,col){ // из пула, без аллокаций
  for(const s of isl.pools.sparks){ if(s.t>=0.8){ s.t=0; s.x=x; s.y=y; s.vx=(Math.random()-.5)*60; s.vy=-30-Math.random()*50; s.col=col||'#ffd76a'; return; } }
}

/* ---------- агенты-драконы ---------- */
const ISL_STATES_X=['idle','walk','fly','sleep','play','groom','look','roar','seek','eat','sitWater','warm','watch','explore','fav','nest','build'];
function islMakeAgents(world){
  const list=S.dragons.filter(d=>!d.reserve).slice(0,12);
  const r=islRand(9001);
  return list.map((d)=>{
    const openProps=world.props.filter(p=>p.kind!=='deco');
    const fav=openProps.length?openProps[(d.uid*7)%openProps.length]:null; // любимое место — своё у каждого
    return { d, x:60+r()*(world.W-120), y:world.ground-8-(r()*30),
      vx:0,vy:0, st:'idle', t:1+r()*2, face:r()<.5?1:-1, bob:r()*6, emote:0,
      fav, favT:20+r()*30, bubble:null, bubbleT:0, sayCd:6+r()*10, tapCd:0 };
  });
}
function islWeights(d,night){
  const w=(typeof _lairWeights==='function')?_lairWeights(d):{idle:3,walk:3,fly:2,sleep:2,play:2,groom:1.4,look:1.6,roar:1,seek:1.4};
  // новые состояния острова
  w.eat=1.2; w.sitWater=isl.world.pond?1.4:0; w.warm=isl.world.fire?1.3:0;
  w.watch=1.2; w.explore=1.6; w.nest=(typeof eggsArray==='function'&&eggsArray().length)?1.1:0;
  if(night){ w.sleep=(w.sleep||2)+4; w.warm+=2; w.fly=Math.max(0,(w.fly||0)-1.5); w.play=Math.max(0,(w.play||0)-1); }
  return w;
}
function islPickState(a,night){
  const w=islWeights(a.d,night); let t=0; for(const k in w)t+=Math.max(0,w[k]);
  let x=Math.random()*t; for(const k in w){ if((x-=Math.max(0,w[k]))<=0) return k; } return 'idle';
}
function islSay(a,txt,dur){ a.bubble=txt; a.bubbleT=dur||2.2; }
function islPhrase(d){ const lvl=islTrustLvl(d); const set=ISL_PHRASES[Math.min(lvl,ISL_PHRASES.length-1)];
  return set[Math.floor(Math.random()*set.length)]; }

/* ---------- ПЕРЕОПРЕДЕЛЕНИЕ: mountLivingLair → живой остров ---------- */
function mountLivingLair(wrap){
  const box=document.createElement('div'); box.className='living-lair island';
  const cv=document.createElement('canvas'); cv.className='lair-canvas island-canvas'; cv.id='lairCanvas';
  const cap=document.createElement('div'); cap.className='living-lair-cap';
  box.appendChild(cv); box.appendChild(cap); wrap.appendChild(box);

  const cvW=box.clientWidth||Math.min(430,innerWidth-32);
  const world=islBuild(cvW);
  const agents=islMakeAgents(world);
  const weather=islWeather();
  cap.textContent={sun:'☀️',wind:'🍃',rain:'🌧️',fog:'🌫️',storm:'⛈️',clear:'✨'}[weather]+' Остров живёт своей жизнью — коснись всего, что видишь';

  isl={box,cv,ctx:cv.getContext('2d'),world,agents,weather,
    cam:{x:0,tx:0,drag:null}, pools:null, storyT:ISL.STORY_T[0]+Math.random()*(ISL.STORY_T[1]-ISL.STORY_T[0]),
    socialT:10, story:null, last:performance.now(), raf:0, vw:cvW, skyCache:null, skyKey:-1,
    unlockFx:0, greetDone:false};
  isl.pools=islPools(world);

  // рост острова: празднуем новые зоны (достижение видно в мире)
  const seen=S.islandLvlSeen||1;
  const fresh=world.zones.filter(z=>z.open&&z.lvl>seen);
  if(fresh.length){ isl.unlockFx=3.5; isl.unlockZone=fresh[fresh.length-1];
    S.islandLvlSeen=world.plvl; if(typeof persist==='function')persist();
    for(const a of agents){ if(Math.random()<0.5){ a.st='build'; a.t=3; a.tx=isl.unlockZone?world.seg*(world.zones.indexOf(isl.unlockZone)+0.5):a.x; a.ty=world.ground-10; } }
    if(typeof toast==='function') toast(`🏝️ Остров вырос! Открыто: <b>${fresh.map(z=>z.icon+' '+z.name).join(', ')}</b>`);
  } else if(!S.islandLvlSeen){ S.islandLvlSeen=world.plvl; }

  // DPR и размеры
  const dpr=Math.min(2,devicePixelRatio||1);
  const fit=()=>{ const w=box.clientWidth||cvW; cv.width=w*dpr; cv.height=world.H*dpr;
    cv.style.height=world.H+'px'; isl.ctx.setTransform(dpr,0,0,dpr,0,0); isl.vw=w; };
  if(_lairFit)removeEventListener('resize',_lairFit); _lairFit=fit; addEventListener('resize',fit); fit();

  // КАМЕРА: мягкий перелёт к активному дракону, он приветствует игрока
  const act=agents.find(a=>a.d.uid===S.sel)||agents[0];
  if(act){ isl.cam.x=Math.max(0,Math.min(world.W-isl.vw, act.x-isl.vw*1.2)); // старт чуть в стороне
    isl.cam.tx=Math.max(0,Math.min(world.W-isl.vw, act.x-isl.vw/2));
    act.emote=2; setTimeout(()=>{ if(isl){ islSay(act, islPhrase(act.d)); act.st='look'; act.t=2.2; } },600); }

  // ввод: тап по дракону/яйцу/объекту, перетаскивание камеры
  cv.onpointerdown=(e)=>{ const rc=cv.getBoundingClientRect(); islTap(e.clientX-rc.left, e.clientY-rc.top, e); };
  cv.onpointermove=(e)=>{ const c=isl&&isl.cam; if(c&&c.drag!=null){ const rc=cv.getBoundingClientRect();
    const nx=e.clientX-rc.left; c.tx=Math.max(0,Math.min(isl.world.W-isl.vw, c.drag.cx-(nx-c.drag.px))); } };
  cv.onpointerup=cv.onpointercancel=()=>{ if(isl)isl.cam.drag=null; };

  if(_lairRAF)cancelAnimationFrame(_lairRAF);
  isl.last=performance.now();
  _lairRAF=requestAnimationFrame(islFrame);
}

/* ---------- ввод ---------- */
function islTap(px,py,e){
  const wx=px+isl.cam.x, wy=py, w=isl.world;
  // 1) дракон?
  let best=null,bd=46;
  for(const a of isl.agents){ const dd=Math.hypot(a.x-wx,a.y-wy); if(dd<bd){bd=dd;best=a;} }
  if(best){
    best.emote=1.4; best.st='look'; best.t=2; best.bob+=3;
    islSay(best, islPhrase(best.d));
    islSpark(best.x,best.y-14,'#ff9ab8');
    if(best.tapCd<=0){ best.tapCd=ISL.TRUST.tapCd; islGainTrust(best.d,ISL.TRUST.tapGain,'ласка'); }
    S.sel=best.d.uid; isl.cam.tx=Math.max(0,Math.min(w.W-isl.vw,best.x-isl.vw/2)); // камера плавно к нему
    if(typeof renderDetail==='function'){ renderDetail(best.d); }
    return;
  }
  // 2) яйцо в гнезде?
  const eggs=(typeof eggsArray==='function')?eggsArray():[];
  if(eggs.length&&Math.hypot(w.nest.x-wx,w.nest.y-wy)<w.nest.r){
    const i=Math.min(eggs.length-1, Math.max(0,Math.floor((wx-(w.nest.x-w.nest.r))/(w.nest.r*2/eggs.length))));
    islEggCard(eggs[i]); islSpark(wx,wy-10,'#ffe6a0');
    for(const a of isl.agents){ if(Math.random()<0.35){ a.st='nest'; a.t=3; a.tx=w.nest.x+(Math.random()-.5)*90; a.ty=w.ground-6; } }
    return;
  }
  // 3) мини-история (маркер «!»)
  if(isl.story&&Math.hypot(isl.story.x-wx,isl.story.y-wy)<40){ islStoryCard(); return; }
  // 4) объект острова? — отклик даже без награды
  let bp=null,bpd=38;
  for(const p of w.props){ const dd=Math.hypot(p.x-wx,(p.y-p.s*0.5)-wy); if(dd<bpd){bpd=dd;bp=p;} }
  if(bp){ bp.tapT=0.5; islSpark(bp.x,bp.y-bp.s*0.6,bp.kind==='crystal'?'#a0e8ff':'#ffd76a');
    if(bp.kind==='fire')islSpark(bp.x,bp.y-20,'#ff8a3d');
    return; }
  // 5) пусто → перетаскивание камеры
  isl.cam.drag={px:px,cx:isl.cam.tx};
}

/* карточка яйца: происхождение, прогресс — прямо в мире */
function islEggCard(egg){
  const elN=(typeof ELEMENTS!=='undefined'&&ELEMENTS[egg.el])?ELEMENTS[egg.el].name:egg.el;
  const pct=egg.incNeed?Math.round((egg.inc||0)/egg.incNeed*100):0;
  const ready=egg.incNeed&&(egg.inc||0)>=egg.incNeed;
  islCard(`<div class="enc-icon">🥚</div>
    <div class="enc-name">Яйцо · ${elN}</div>
    <div class="enc-sub">Происхождение: биом ${'I'.repeat(egg.tier||1)} · стихия «${elN}»<br>
    Инкубация: <b>${ready?'готово к вылуплению! 🐣':pct+'%'}</b><br>
    <span style="opacity:.7">Бои и странствия согревают яйцо</span></div>
    <button data-a="hatch">${ready?'🐣 Высидеть':'В Гнездо ›'}</button>
    <button class="ghost" data-a="x">Позже</button>`,
    a=>{ if(a==='hatch')switchView('hatch'); });
  for(const ag of isl.agents){ if(Math.random()<0.3) islSay(ag,'🥚?',1.5); }
}

/* мини-история: карточка с косметической наградой */
function islStoryCard(){
  const st=isl.story; if(!st)return;
  islCard(`<div class="enc-icon">${st.def.icon}</div>
    <div class="enc-name">${dragonName(st.a.d)}</div>
    <div class="enc-sub">${st.def.t}</div>
    <button data-a="ok">💞 Разделить радость</button>`,
    a=>{ if(a==='ok'){ islGainTrust(st.a.d,ISL.TRUST.storyGain,'история');
      if(typeof worldSeen==='function')worldSeen('events','Быт: '+st.def.codex);
      islSpark(st.a.x,st.a.y-20,'#ffd76a'); islSay(st.a,'💖',2);
      if(typeof toast==='function')toast(`📖 Запись Кодекса: «${st.def.codex}»`); } });
  isl.story=null;
}

/* лёгкая карточка поверх сцены (минимум интерфейса) */
function islCard(html,onAct){
  let ov=document.getElementById('islCard');
  if(!ov){ ov=document.createElement('div'); ov.id='islCard'; ov.className='fcv-enc'; ov.style.position='absolute'; isl.box.appendChild(ov); }
  ov.style.display='flex';
  ov.innerHTML=`<div class="enc-card">${html}</div>`;
  ov.querySelectorAll('button').forEach(b=>b.onpointerdown=()=>{ ov.style.display='none'; if(onAct)onAct(b.dataset.a); });
}

/* ---------- цикл ---------- */
function islFrame(now){
  const on=$('#lair')&&$('#lair').classList.contains('on');
  if(!on||!isl){ _lairRAF=0; if(_lairFit){removeEventListener('resize',_lairFit);_lairFit=null;} isl=null; return; }
  const dt=Math.min(0.05,(now-isl.last)/1000); isl.last=now;
  try{ islUpdate(dt,now); islDraw(now); }catch(e){ /* не роняем UI */ }
  _lairRAF=requestAnimationFrame(islFrame);
}

function islUpdate(dt,now){
  const w=isl.world, ph=islDayPhase(), night=islIsNight(ph);
  // камера: плавное сглаживание, без скачков
  isl.cam.x+=(isl.cam.tx-isl.cam.x)*Math.min(1,dt*ISL.CAM_EASE);
  if(isl.unlockFx>0)isl.unlockFx-=dt;

  // мини-истории
  isl.storyT-=dt;
  if(isl.storyT<=0&&!isl.story&&isl.agents.length){
    isl.storyT=ISL.STORY_T[0]+Math.random()*(ISL.STORY_T[1]-ISL.STORY_T[0]);
    const a=isl.agents[Math.floor(Math.random()*isl.agents.length)];
    const def=ISL_STORIES[Math.floor(Math.random()*ISL_STORIES.length)];
    isl.story={a,def,x:a.x,y:a.y-34}; islSay(a,def.icon+'!',3);
  }
  if(isl.story){ isl.story.x=isl.story.a.x; isl.story.y=isl.story.a.y-34; }

  // социальные сцены: пары здороваются, играют, спорят, летают вместе
  isl.socialT-=dt;
  if(isl.socialT<=0&&isl.agents.length>1){
    isl.socialT=ISL.SOCIAL_T[0]+Math.random()*(ISL.SOCIAL_T[1]-ISL.SOCIAL_T[0]);
    const i=Math.floor(Math.random()*isl.agents.length);
    let j=Math.floor(Math.random()*isl.agents.length); if(j===i)j=(j+1)%isl.agents.length;
    const A=isl.agents[i],B=isl.agents[j];
    const kind=['greet','play','rest','argue','flyTogether','watch'][Math.floor(Math.random()*6)];
    if(kind==='greet'){ A.tx=B.x-30;A.ty=B.y;A.st='walk';A.t=3; islSay(A,'👋',1.6); setTimeout(()=>{if(isl)islSay(B,'👋',1.4);},900); }
    if(kind==='play'){ A.st=B.st='play'; A.t=B.t=3; A.tx=B.x;A.ty=B.y; islSay(A,'♪');islSay(B,'♪'); }
    if(kind==='rest'){ A.st=B.st='idle'; A.tx=B.x-26;A.ty=B.y; A.t=B.t=4; }
    if(kind==='argue'){ A.st=B.st='roar'; A.t=B.t=1.6; islSay(A,'❕');islSay(B,'❕'); }
    if(kind==='flyTogether'){ A.st=B.st='fly'; A.t=B.t=3.4; const fx=60+Math.random()*(w.W-120),fy=w.ground-120;
      A.tx=fx-24;A.ty=fy; B.tx=fx+24;B.ty=fy+8; }
    if(kind==='watch'){ A.st='watch'; A.t=3; A.face=B.x<A.x?-1:1; islSay(A,'👀',1.4); }
  }

  // агенты
  for(const a of isl.agents){
    a.t-=dt; a.bob+=dt*(a.st==='fly'?9:5); if(a.emote>0)a.emote-=dt;
    if(a.tapCd>0)a.tapCd-=dt; if(a.bubbleT>0){a.bubbleT-=dt; if(a.bubbleT<=0)a.bubble=null;}
    a.favT-=dt;
    if(a.favT<=0&&a.fav){ a.favT=25+Math.random()*35; a.st='fav'; a.t=5; a.tx=a.fav.x+(Math.random()-.5)*30; a.ty=w.ground-8; }
    if(a.t<=0){
      a.st=islPickState(a,night); a.t=1.8+Math.random()*3;
      if(a.st==='walk'||a.st==='seek'||a.st==='explore'){ a.tx=40+Math.random()*(w.W-80); a.ty=w.ground-6-Math.random()*26; if(a.st==='explore')a.t=4; }
      if(a.st==='fly'){ a.tx=40+Math.random()*(w.W-80); a.ty=w.ground-90-Math.random()*90; }
      if(a.st==='eat'){ a.tx=w.nest.x-60; a.ty=w.ground; islSay(a,(typeof favFood==='function')?favFood(a.d).split(' ')[0]:'🍖',1.6); }
      if(a.st==='sitWater'&&w.pond){ a.tx=w.pond.x+(Math.random()-.5)*w.pond.rx; a.ty=w.pond.y-16; a.t=4; }
      if(a.st==='warm'&&w.fire){ a.tx=w.fire.x+(Math.random()<.5?-24:24); a.ty=w.fire.y-6; a.t=4; }
      if(a.st==='nest'){ a.tx=w.nest.x+(Math.random()-.5)*80; a.ty=w.ground-4; }
      if(a.st==='watch'){ const o=isl.agents[Math.floor(Math.random()*isl.agents.length)]; if(o!==a)a.face=o.x<a.x?-1:1; }
    }
    let sp=0;
    if(a.st==='walk'||a.st==='seek'||a.st==='eat'||a.st==='nest') sp=26;
    else if(a.st==='explore'||a.st==='fav'||a.st==='build') sp=34;
    else if(a.st==='fly') sp=62;
    else if(a.st==='play') sp=40;
    if(sp&&a.tx!=null){ const dx=a.tx-a.x, dy=a.ty-a.y, dl=Math.hypot(dx,dy)||1;
      if(dl>5){ a.x+=dx/dl*sp*dt; a.y+=dy/dl*sp*dt; a.face=dx<0?-1:1; } else if(a.st==='fly'&&Math.random()<0.02){ a.tx=40+Math.random()*(w.W-80); } }
    // не слипаться
    for(const b of isl.agents){ if(b===a)continue; const dx=a.x-b.x,dy=a.y-b.y,dd=Math.hypot(dx,dy);
      if(dd<24&&dd>0){ a.x+=dx/dd*7*dt; a.y+=dy/dd*7*dt; } }
    a.x=Math.max(24,Math.min(w.W-24,a.x));
    a.y=Math.max(w.ground-170,Math.min(w.ground+20,a.y));
    if(a.st!=='fly'&&a.st!=='sleep') a.y=Math.min(Math.max(a.y,w.ground-40),w.ground+18);
  }

  // фоновая жизнь (пулы, без аллокаций)
  const pl=isl.pools;
  for(const b of pl.birds){ if(!b.on)continue; b.x+=b.v*dt; if(b.x>w.W+60){ b.x=-60-Math.random()*200; b.y=30+Math.random()*70; } }
  for(const f of pl.butterflies){ f.ph+=dt*3; f.x+=Math.sin(f.ph)*18*dt; f.y+=Math.cos(f.ph*1.3)*10*dt; }
  for(const l of pl.leaves){ l.ph+=dt; l.y+=(14+Math.sin(l.ph*2)*6)*dt*(isl.weather==='wind'?2.2:1); l.x+=Math.sin(l.ph*1.7)*22*dt+(isl.weather==='wind'?26*dt:0);
    if(l.y>w.ground+16){ l.y=-10; l.x=Math.random()*w.W; } }
  if(night)for(const ff of pl.fireflies){ ff.ph+=dt*2; ff.x+=Math.sin(ff.ph)*8*dt; ff.y+=Math.cos(ff.ph*0.8)*6*dt; }
  if(w.pond)for(const fs of pl.fish){ fs.t-=dt; if(fs.t<=0)fs.t=4+Math.random()*7; }
  if(isl.weather==='rain'||isl.weather==='storm'){
    for(const r2 of pl.rain){ if(!r2.on){ r2.on=true; r2.x=isl.cam.x+Math.random()*isl.vw; r2.y=-10-Math.random()*w.H; r2.v=380+Math.random()*140; }
      r2.y+=r2.v*dt; r2.x+=40*dt; if(r2.y>w.ground+14){ r2.on=false; } } }
  for(const s of pl.sparks){ if(s.t<0.8){ s.t+=dt; s.x+=s.vx*dt; s.y+=s.vy*dt; s.vy+=60*dt; } }
  for(const p of w.props){ if(p.tapT>0)p.tapT-=dt; p.sway+=dt; }
}

/* ---------- отрисовка ---------- */
function islDraw(now){
  const ctx=isl.ctx, w=isl.world, vw=isl.vw, H=w.H;
  const ph=islDayPhase(), night=islIsNight(ph);
  // небо: градиент кэшируется по «ведру» времени (раз в ~3 мин) — ПЕРФ
  const key=Math.floor(ph*480);
  if(key!==isl.skyKey){ isl.skyKey=key; const sk=islSky(ph);
    const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,sk.top); g.addColorStop(1,sk.bot);
    isl.skyCache=g; isl.light=sk.light; }
  ctx.fillStyle=isl.skyCache; ctx.fillRect(0,0,vw,H);
  const L=isl.light;

  // солнце/луна и звёзды
  const sunA=(ph-0.25)*Math.PI*2;
  const sx=vw*0.5+Math.cos(sunA)*vw*0.42, sy=H*0.62-Math.sin(sunA)*H*0.5;
  ctx.globalAlpha=0.9; ctx.font='26px serif'; ctx.textAlign='center';
  ctx.fillText(night?'🌙':'☀️', night?vw-46:sx, night?40:Math.max(26,sy));
  ctx.globalAlpha=1;
  if(night||isl.weather==='clear'){ ctx.fillStyle='rgba(255,255,255,.8)';
    for(let i=0;i<26;i++){ const rr=islRand(i*97); const x2=rr()*vw, y2=rr()*H*0.5;
      ctx.globalAlpha=0.3+0.5*Math.abs(Math.sin(now/900+i)); ctx.fillRect(x2,y2,1.6,1.6); } ctx.globalAlpha=1; }

  // облака-параллакс
  ctx.font='30px serif'; ctx.globalAlpha=0.5*L+0.15;
  for(let i=0;i<4;i++){ const cx2=((i*260+now*0.008*(12+i*4))% (vw+160))-80; ctx.fillText('☁️',cx2,44+i*26); }
  ctx.globalAlpha=1;

  ctx.save(); ctx.translate(-isl.cam.x,0);

  // земля острова
  const gg=ctx.createLinearGradient(0,w.ground-30,0,H);
  gg.addColorStop(0,night?'#1e2b1a':'#3f6b34'); gg.addColorStop(1,night?'#101a10':'#24401e');
  ctx.fillStyle=gg;
  ctx.beginPath(); ctx.moveTo(0,H);
  for(let x=0;x<=w.W;x+=48) ctx.lineTo(x, w.ground-10+Math.sin(x*0.013)*12);
  ctx.lineTo(w.W,H); ctx.closePath(); ctx.fill();
  // край острова — обрыв в небо (парящий остров)
  ctx.fillStyle=night?'#26180f':'#4a3016';
  ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(0,w.ground+30);
  for(let x=0;x<=w.W;x+=64) ctx.lineTo(x, H-10-Math.abs(Math.sin(x*0.021))*26);
  ctx.lineTo(w.W,w.ground+30); ctx.lineTo(w.W,H); ctx.closePath(); ctx.fill();

  // тропинка
  ctx.fillStyle='rgba(220,190,140,'+(0.25+0.2*L)+')';
  for(const p of w.path){ ctx.beginPath(); ctx.ellipse(p.x,p.y,7,3,0,0,6.283); ctx.fill(); }

  // пруд + рыбы
  if(w.pond){ ctx.save(); ctx.globalAlpha=0.85;
    const pg=ctx.createLinearGradient(0,w.pond.y-w.pond.ry,0,w.pond.y+w.pond.ry);
    pg.addColorStop(0,night?'#20405a':'#4a90b8'); pg.addColorStop(1,night?'#12283a':'#2a6088');
    ctx.fillStyle=pg; ctx.beginPath(); ctx.ellipse(w.pond.x,w.pond.y,w.pond.rx,w.pond.ry,0,0,6.283); ctx.fill();
    ctx.globalAlpha=0.4; ctx.strokeStyle='#bfe8ff'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.ellipse(w.pond.x,w.pond.y,w.pond.rx*(0.6+0.1*Math.sin(now/700)),w.pond.ry*0.6,0,0,6.283); ctx.stroke();
    ctx.restore();
    for(const fs of isl.pools.fish){ if(fs.t<0.8){ const k=fs.t/0.8;
      ctx.globalAlpha=1-Math.abs(k-0.5)*2; ctx.font='15px serif';
      ctx.fillText('🐟', w.pond.x+(k-0.5)*60, w.pond.y-Math.sin(k*Math.PI)*26); ctx.globalAlpha=1; } } }
  // водопад и ручей
  if(w.falls){ const fx=w.falls.x;
    ctx.globalAlpha=0.75; ctx.fillStyle=night?'#4a7a9a':'#9fd6f0';
    for(let i=0;i<4;i++){ const yy=(now*0.18+i*40)%120; ctx.fillRect(fx-8+i*4, w.ground-96+yy, 3, 22); }
    ctx.fillRect(fx-12,w.ground-100,24,8);
    ctx.globalAlpha=0.5; ctx.beginPath(); ctx.moveTo(fx,w.ground);
    ctx.quadraticCurveTo(fx+60,w.ground+8,fx+140,w.ground+4); ctx.lineWidth=5; ctx.strokeStyle=night?'#4a7a9a':'#9fd6f0'; ctx.stroke();
    ctx.globalAlpha=1; }
  // горячие источники — пар
  if(w.springs){ ctx.globalAlpha=0.35; ctx.font='16px serif';
    for(let i=0;i<3;i++){ const yy=(now*0.02+i*30)%60; ctx.fillText('💨', w.springs.x+i*26-26, w.ground-8-yy); }
    ctx.globalAlpha=1; }

  // объекты острова (эмодзи; лёгкое покачивание, отклик на тап)
  for(const p of w.props){
    const px=p.x, vis=px>isl.cam.x-60&&px<isl.cam.x+vw+60; if(!vis)continue;
    const sway=(p.kind==='tree'||p.kind==='bush'||p.kind==='flower'||p.kind==='grass')?Math.sin(p.sway+(isl.weather==='wind'?now/300:now/900))*(isl.weather==='wind'?0.09:0.03):0;
    const pop=p.tapT>0?1+Math.sin(p.tapT*12)*0.14:1;
    ctx.save(); ctx.translate(px,p.y); ctx.rotate(sway); ctx.scale(pop,pop);
    ctx.font=p.s+'px serif'; ctx.textAlign='center';
    if(night&&(p.kind==='lantern'||p.kind==='crystal'||p.kind==='fire')){ ctx.shadowColor=p.kind==='crystal'?'#7cd6ff':'#ffb050'; ctx.shadowBlur=14; }
    ctx.globalAlpha=p.kind==='deco'?0.92:1;
    ctx.fillText(p.e,0,0); ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.restore();
  }

  // ЗАКРЫТЫЕ зоны: туманные силуэты с подписью — видно, куда расти
  ctx.textAlign='center';
  w.zones.forEach((z,i)=>{ if(z.open)return; const zx=w.seg*(i+0.5);
    if(zx<isl.cam.x-w.seg||zx>isl.cam.x+vw+w.seg)return;
    ctx.globalAlpha=0.28; ctx.font='34px serif'; ctx.fillText(z.icon,zx,w.ground-18);
    ctx.globalAlpha=0.6; ctx.font='11px Georgia'; ctx.fillStyle='#fff';
    ctx.fillText('🔒 '+z.name+' · ур.'+z.lvl, zx, w.ground+4); ctx.globalAlpha=1; });

  // празднование роста острова
  if(isl.unlockFx>0&&isl.unlockZone){ const i=w.zones.indexOf(isl.unlockZone), zx=w.seg*(i+0.5);
    ctx.globalAlpha=Math.min(1,isl.unlockFx); ctx.font='bold 15px Georgia'; ctx.fillStyle='#ffd76a';
    ctx.fillText('✨ '+isl.unlockZone.name+' открыт!', zx, w.ground-70-Math.sin(now/300)*4); ctx.globalAlpha=1; }

  // гнездо-инкубатор
  {const n=w.nest; const eggs=(typeof eggsArray==='function')?eggsArray():[];
   ctx.font='30px serif'; ctx.fillText('🪺',n.x,n.y+8);
   if(eggs.length){ const gap=Math.min(26,n.r*2/eggs.length);
     eggs.slice(0,5).forEach((eg,i)=>{ const ex=n.x-((Math.min(eggs.length,5)-1)*gap)/2+i*gap;
       const ready=eg.incNeed&&(eg.inc||0)>=eg.incNeed;
       const wob=ready?Math.sin(now/90)*2:0;
       ctx.save(); ctx.translate(ex,n.y-6+wob);
       const col=(typeof ELEMENTS!=='undefined'&&ELEMENTS[eg.el])?ELEMENTS[eg.el].color:'#fff';
       ctx.font='17px serif'; ctx.fillText('🥚',0,0);
       const pct=eg.incNeed?Math.min(1,(eg.inc||0)/eg.incNeed):0;
       ctx.strokeStyle=col; ctx.lineWidth=2; ctx.globalAlpha=0.9;
       ctx.beginPath(); ctx.arc(0,-2,11,-Math.PI/2,-Math.PI/2+pct*6.283); ctx.stroke();
       ctx.restore(); ctx.globalAlpha=1;
       if(ready){ ctx.font='10px system-ui'; ctx.fillStyle='#ffd76a'; ctx.fillText('готово!',ex,n.y-24); ctx.fillStyle='#fff'; } }); } }

  // светлячки (ночь)
  if(night){ ctx.fillStyle='#d8ffa0';
    for(const ff of isl.pools.fireflies){ if(ff.x<isl.cam.x-20||ff.x>isl.cam.x+vw+20)continue;
      ctx.globalAlpha=0.3+0.5*Math.abs(Math.sin(ff.ph*2)); ctx.beginPath(); ctx.arc(ff.x,ff.y,1.8,0,6.283); ctx.fill(); }
    ctx.globalAlpha=1; }
  // бабочки (день), птицы
  ctx.font='12px serif';
  if(!night)for(const f of isl.pools.butterflies){ if(f.x<isl.cam.x-20||f.x>isl.cam.x+vw+20)continue; ctx.fillText('🦋',f.x,f.y); }
  for(const b of isl.pools.birds){ if(!b.on)continue; const bx=b.x; if(bx<isl.cam.x-30||bx>isl.cam.x+vw+30)continue;
    ctx.fillText(night?'🦇':'🐦',bx,b.y+Math.sin(now/200+bx)*4); }
  // листья
  ctx.font='13px serif'; ctx.globalAlpha=0.8;
  for(const l of isl.pools.leaves){ if(l.x<isl.cam.x-20||l.x>isl.cam.x+vw+20)continue; ctx.fillText('🍃',l.x,l.y); }
  ctx.globalAlpha=1;

  // ДРАКОНЫ — главные герои: поверх окружения, с пузырями и эмоциями
  const order=[...isl.agents].sort((a,b)=>a.y-b.y);
  for(const a of order){
    if(a.x<isl.cam.x-60||a.x>isl.cam.x+vw+60)continue;
    const stg=(typeof stageForLevel==='function')?(stageForLevel(a.d.level||1)||1):1;
    const size= stg>=100?34: stg>=60?29: stg>=25?24:19;
    const bobY=a.st==='sleep'?0:Math.sin(a.bob)*(a.st==='fly'?5:2.5);
    const yy=a.y+bobY;
    ctx.beginPath(); ctx.ellipse(a.x,a.y+size*0.55,size*0.7,size*0.24,0,0,6.283);
    ctx.fillStyle='rgba(0,0,0,'+(0.2+0.12*L)+')'; ctx.fill();
    ctx.save(); ctx.translate(a.x,yy); ctx.scale(a.face,1);
    ctx.font=size+'px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha=a.st==='sleep'?0.85:1;
    if(a.d.uid===S.sel){ ctx.shadowColor='#ffd76a'; ctx.shadowBlur=12; }
    ctx.fillText((speciesById(a.d.id).sigil)||'🐉',0,0);
    ctx.shadowBlur=0; ctx.restore(); ctx.globalAlpha=1;
    // эмоция состояния (+доверие расширяет набор)
    const tl=islTrustLvl(a.d);
    const em=a.emote>0?(tl>=2?'💞':'💗'):({sleep:'💤',play:'♪',groom:'✨',look:'❔',roar:'❕',seek:'🔎',eat:'😋',sitWater:'🐟',warm:'🔥',watch:'👀',explore:'🧭',fav:'🏡',nest:'🥚',build:'🔨'}[a.st]||'');
    if(em){ ctx.font='12px system-ui'; ctx.textAlign='center'; ctx.fillText(em,a.x+size*0.55,yy-size*0.62); }
    // пузырь-реплика
    if(a.bubble){ ctx.font='11px Georgia'; const tw=ctx.measureText(a.bubble).width+12;
      ctx.fillStyle='rgba(20,14,30,.8)'; ctx.strokeStyle='rgba(255,215,106,.5)'; ctx.lineWidth=1;
      const bx=a.x, by=yy-size-16;
      ctx.beginPath(); ctx.roundRect?ctx.roundRect(bx-tw/2,by-14,tw,18,7):ctx.rect(bx-tw/2,by-14,tw,18); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#ffe9c0'; ctx.fillText(a.bubble,bx,by-1); }
    // подпись активного: имя + характер + доверие
    if(a.d.uid===S.sel){ ctx.font='10px Georgia'; ctx.fillStyle='rgba(255,233,192,.85)';
      const nat=ISL_CHAR_WORD[(a.d.nature||'balanced')]||'';
      ctx.fillText(dragonName(a.d)+' · '+nat+' · 💞'+islTrust(a.d), a.x, a.y+size*0.55+13); }
  }

  // маркер мини-истории
  if(isl.story){ ctx.font='bold 17px system-ui'; ctx.fillStyle='#ffd76a';
    ctx.fillText('❗', isl.story.x, isl.story.y-Math.abs(Math.sin(now/250))*6); }

  // искры (пул)
  for(const s of isl.pools.sparks){ if(s.t<0.8){ ctx.globalAlpha=1-s.t/0.8; ctx.fillStyle=s.col;
    ctx.beginPath(); ctx.arc(s.x,s.y,2.2,0,6.283); ctx.fill(); } }
  ctx.globalAlpha=1;

  ctx.restore(); // конец мира

  // погодные слои поверх (экранные координаты)
  if(isl.weather==='rain'||isl.weather==='storm'){ ctx.strokeStyle='rgba(160,200,255,.5)'; ctx.lineWidth=1.4;
    ctx.beginPath();
    for(const r2 of isl.pools.rain){ if(!r2.on)continue; const rx=r2.x-isl.cam.x; if(rx<-5||rx>vw+5)continue;
      ctx.moveTo(rx,r2.y); ctx.lineTo(rx-3,r2.y+10); }
    ctx.stroke(); }
  if(isl.weather==='storm'&&Math.random()<0.004){ ctx.fillStyle='rgba(255,255,240,.25)'; ctx.fillRect(0,0,vw,H); }
  if(isl.weather==='fog'){ const fg=ctx.createLinearGradient(0,H*0.5,0,H);
    fg.addColorStop(0,'rgba(200,205,215,0)'); fg.addColorStop(1,'rgba(200,205,215,.34)');
    ctx.fillStyle=fg; ctx.fillRect(0,H*0.5,vw,H*0.5); }
  ctx.globalAlpha=1;
}
