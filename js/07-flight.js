/* ============================================================
   07-flight.js — ПОЛЁТ: свободный полёт на канвасе (джойстик/WASD),
   ярусы-экраны с нарисованными картами и порталами между ними,
   сбор находок, звери-логова (реальные бои).
   Механика и карты перенесены из демо «Полёт над Эмберричем».
   Драконис · Кодекс Чешуи
   ============================================================ */
let flight=null; // {region, d, stats, run, ... состояние карты и дракона}
/* ===== ИССЛЕДОВАНИЕ МИРА: хелперы наград/прогресса/кодекса ===== */
function worldRegionKey(){ return (flight&&flight.region&&(flight.region.id||flight.region.worldId))||'?'; }
function worldRegionName(){ return (flight&&flight.region&&(flight.region.name||flight.region.biome))||'Область'; }
function worldSeen(kind,id){ if(!S.worldCodex)S.worldCodex={events:{},biomes:{},weather:{}}; if(!S.worldCodex[kind])S.worldCodex[kind]={}; S.worldCodex[kind][id]=true; }
function worldEventSeen(ev){ if(ev&&ev.name)worldSeen('events',ev.name); }
function exploreProgress(){ if(!flight)return; if(!S.worldExplored)S.worldExplored={};
  const roleB=(flight&&flight.d&&typeof dragonRole==='function'&&dragonRole(flight.d.id)==='Следопыт')?((GB.Eggs&&GB.Eggs.exploreRoleBonus)||1.5):1; // СВЯЗЬ: дракон-Следопыт исследует быстрее
  const k=worldRegionKey(), step=Math.round((((typeof GB!=='undefined'&&GB.World&&GB.World.exploreStep)||4))*roleB);
  const prev=S.worldExplored[k]||0, cur=Math.min(100,prev+step); S.worldExplored[k]=cur;
  const ms=(typeof GB!=='undefined'&&GB.World&&GB.World.exploreMilestones)||[25,50,100];
  for(let i=0;i<ms.length;i++){ if(prev<ms[i]&&cur>=ms[i]){ const g=((GB.World&&GB.World.exploreRewardGold)||60)*(i+1); S.gold+=g; if(typeof toast==='function')toast(`🗺️ ${worldRegionName()} исследован на ${ms[i]}%! +${g}🪙`); } } }
function grantWorldReward(reward){ const f=flight; if(!f)return '…'; const R=f.region; let txt='';
  const rm=(f.run&&f.run.rewardMul)||1; // REWORK: риск выбранного пути ↔ награда
  if(reward==='gold'){const g=Math.round(rnd(R.gold[0],R.gold[1])*rm);S.gold+=g;f.stats.gold+=g;txt='🪙 +'+g;}
  else if(reward==='dust'){const du=Math.round(rnd(8,18)*rm);S.dust+=du;txt='✦ +'+du;}
  else if(reward==='shards'){const sh=Math.round(rnd(2,6)*rm);S.shards=(S.shards||0)+sh;txt='🔮 +'+sh;}
  else if(reward==='scroll'){const scr=grantScroll(R.worldId,R.biomeN);f.cnt.scroll++;txt=scr?'📜 Свиток легенды!':('🪙 +'+((()=>{const g=rnd(R.gold[0],R.gold[1]);S.gold+=g;return g;})()));}
  else if(reward==='chest'){addChest(Math.min(3,R.biomeN||1));txt='🎁 Сундук!';}
  else if(reward==='relic'){ if(featureUnlocked('spire')){const art=biomeArtifact(R);addArtifact(art.id,1);f.stats.relics++;txt=art.icon+' '+art.name+'!';} else {const g=rnd(R.gold[0],R.gold[1]);S.gold+=g;txt='🪙 +'+g;} }
  else if(reward==='egg'){addEgg(R.el,R.biomeN);f.stats.eggs++;txt='🥚 Яйцо!';}
  else if(reward==='egg_rare'){addEgg(R.el,3,3);f.stats.eggs++;txt='🥚 Редкое яйцо!';}
  else if(reward==='egg_epic'){addEgg(R.el,3,4);f.stats.eggs++;txt='🥚 Эпическое яйцо!';}
  else if(reward==='egg_legend'){addEgg(R.el,3,5);f.stats.eggs++;txt='🥚 Легендарное яйцо!';}
  else if(reward==='codex'){worldSeen('events','Древняя запись');txt='📖 Запись Кодекса!';}
  else { txt='🍃'; }
  return txt; }

/* ===== НАРИСОВАННЫЕ КАРТЫ ЯРУСОВ =====
   По мирам: images/fly_{ключ}_{ярус}.webp. Если файла нет —
   игра сама нарисует процедурный фон, ничего не сломается. */
const FLY_ART_KEY={emberreach:'fire',mirelot:'jungle',glacior:'ice',stormpeak:'storm',voidedge:'shade'};
const _denImgCache={}; // ПЕРФ: кэш картинок логова (не грузить одно и то же повторно)
const _flyMapCache={};
function flyArtKey(region){ return FLY_ART_KEY[region.worldId]||region.scene; }
function loadFlyMap(region,tier,cb){
  // Полёт использует отдельную ортографическую карту сверху; панорамный biome_* остаётся обложкой мира.
  const src=`images/flightmap_${flyArtKey(region)}.webp`;
  const cached=_flyMapCache[src];
  if(cached){
    if(cached.complete&&cached.naturalWidth) cb(cached);
    else { cached.addEventListener('load',()=>cb(cached),{once:true}); cached.addEventListener('error',()=>cb(null),{once:true}); }
    return;
  }
  const i=new Image(); _flyMapCache[src]=i;
  i.onload=()=>{ cb(i); preloadNextFlyMap(region); };
  i.onerror=()=>{ delete _flyMapCache[src]; cb(null); };
  i.src=src;
}
function preloadNextFlyMap(region){
  if(typeof WORLDS==='undefined'||!Array.isArray(WORLDS))return;
  const at=WORLDS.findIndex(w=>w.id===region.worldId), next=WORLDS[at+1];
  if(!next)return;
  const src=`images/flightmap_${flyArtKey(next)}.webp`;
  if(_flyMapCache[src])return;
  const warm=()=>{ if(_flyMapCache[src])return; const i=new Image(); _flyMapCache[src]=i; i.onerror=()=>delete _flyMapCache[src]; i.src=src; };
  if('requestIdleCallback' in window) requestIdleCallback(warm,{timeout:1800}); else setTimeout(warm,350);
}

/* ===== ПАЛИТРЫ ПРОЦЕДУРНЫХ ФОНОВ ПО СЦЕНАМ (запасной вариант) ===== */
const FLY_PAL={
  fire:  {base:'#2a1810', land:'#6e3a1e', land2:'#8a4a22', river:'#e0633a', glow:'#ffb46a', speck:'#ffd76a'},
  jungle:{base:'#1a2417', land:'#3f6b34', land2:'#4f7d3e', river:'#2f9d7a', glow:'#9fd47a', speck:'#d4ff8a'},
  ice:   {base:'#1e2a36', land:'#5a7e96', land2:'#6f93aa', river:'#8fc4de', glow:'#cfeaf7', speck:'#eaf7ff'},
  shade: {base:'#180f22', land:'#3f3458', land2:'#514470', river:'#8a4a9e', glow:'#b88adf', speck:'#e8d6ff'},
};

/* фон карты рисуем один раз в офф-скрин канвас — резко и без затрат в кадре */
function flyBackground(scene, W, H, seedStr){
  const P=FLY_PAL[scene]||FLY_PAL.fire;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d');
  const r=seeded((seedStr||scene).split('').reduce((a,ch)=>a+ch.charCodeAt(0),7));
  x.fillStyle=P.base; x.fillRect(0,0,W,H);
  // крупные участки суши
  for(let i=0;i<14;i++){
    const cx=r()*W, cy=r()*H, rad=W*0.10+r()*W*0.16;
    const g=x.createRadialGradient(cx,cy,rad*0.15,cx,cy,rad);
    g.addColorStop(0,i%3?P.land:P.land2); g.addColorStop(1,'rgba(0,0,0,0)');
    x.globalAlpha=.5; x.fillStyle=g; x.beginPath(); x.ellipse(cx,cy,rad,rad*0.72,r()*3,0,7); x.fill();
  }
  x.globalAlpha=1;
  // извилистая река/лава
  x.strokeStyle=P.river; x.lineCap='round'; x.globalAlpha=.6;
  for(const wdt of [W*0.02,W*0.012]){
    x.lineWidth=wdt; x.beginPath();
    let px=W*(0.2+r()*0.6), py=-20;
    x.moveTo(px,py);
    while(py<H+20){ py+=H*0.12; px+=(r()-0.5)*W*0.3; px=Math.max(W*0.1,Math.min(W*0.9,px));
      x.quadraticCurveTo(px+(r()-0.5)*W*0.12, py-H*0.06, px, py); }
    x.stroke(); x.globalAlpha=.35;
  }
  x.globalAlpha=1;
  // искры-точки
  x.fillStyle=P.speck;
  for(let i=0;i<130;i++){ x.globalAlpha=.06+r()*.16;
    x.beginPath(); x.arc(r()*W, r()*H, 1+r()*2.4, 0, 7); x.fill(); }
  // свечение у вершины (зона портала)
  const gg=x.createRadialGradient(W/2,60,20,W/2,60,W*0.5);
  gg.addColorStop(0,P.glow); gg.addColorStop(1,'rgba(0,0,0,0)');
  x.globalAlpha=.22; x.fillStyle=gg; x.fillRect(0,0,W,H*0.3);
  // виньетка
  x.globalAlpha=1;
  const v=x.createRadialGradient(W/2,H/2,Math.min(W,H)*0.45,W/2,H/2,Math.max(W,H)*0.75);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.45)');
  x.fillStyle=v; x.fillRect(0,0,W,H);
  return c;
}

/* спрайт дракона (вид сверху) из SVG → Image */
function flySprite(speciesId){
  const img=new Image();
  img.src='data:image/svg+xml;utf8,'+encodeURIComponent(topDragonSVG(speciesId).replace(/class="[^"]*"/g,''));
  return img;
}
/* нарисованный PNG-спрайт полёта с учётом возраста: images/{вид}_fly_{стадия}.png
   (стадии 1/25/60/100, как у портретов). Нет нужной стадии — берём ближайшую
   имеющуюся; нет ни одной — останется векторный дракон. */
function flySpritePng(speciesId, level){
  const img=new Image();
  const want=stageForLevel(level||1);
  const order=[want,...[100,60,25,1].filter(st=>st!==want)];
  let i=0;
  img.onerror=()=>{ if(i<order.length) img.src=`images/${speciesId}_fly_${order[i++]}.png`; };
  img.src=`images/${speciesId}_fly_${order[i++]}.png`;
  return img;
}

/* ===== СТАРТ ПОЛЁТА ===== */
function startFlight(region,d){
  flight={
    region, d,
    worldObj:(typeof WORLDS!=='undefined'&&WORLDS.find(w=>w.id===region.worldId))||null,
    stats:{gold:0,eggs:0,relics:0,xp:0,caught:0,beasts:0}, // накапливается по всем ярусам
    cnt:{treasure:0,scroll:0}, beasts:0,                    // цели текущего яруса
    W:0,H:0,items:[],storms:[],dens:[],wilds:[],elites:[],secrets:[],pockets:[],winds:[],floats:[],clouds:[],
    drag:null, stam:(GB.Run&&GB.Run.staminaMax)||140, portal:null, paused:true, ended:false,
    raf:0, ac:null, _pend:null, battleWin:undefined, bg:null,
    // REWORK: состояние забега-роглайта — усиления, глубина, риск пути (сбрасывается после странствия)
    run:{fx:{}, boons:[], depth:0, riskMul:1, rewardMul:1, gate:null, t0:Date.now()},
    trialEnt:null, trialDone:false, lastDefeat:null,
    sprPng:flySpritePng(d.id,d.level), sprSvg:flySprite(d.id),
  };
  document.body.classList.add('flight-active');
  const fs=$('#flightFs');
  if(fs){ fs.style.display='block'; fs.innerHTML='<div class="fcv-load">Разжигаем миры… <span style="opacity:.55;font-size:12px">сборка v12</span></div>'; }
  buildFlightTier(region);
}

/* REWORK: применить усиление забега (действует только до конца странствия) */
function runAddBoon(b){
  const f=flight; if(!f||!f.run)return;
  f.run.boons.push(b.icon);
  for(const k in b.fx){
    if(k==='healNow'){ const st=statsOf(f.d);
      f.d.curHp=Math.min(st.maxHp,Math.round((f.d.curHp||0)+st.maxHp*b.fx[k]/100)); }
    else f.run.fx[k]=(f.run.fx[k]||0)+b.fx[k];
  }
}
/* REWORK: фон увеличенной карты из нарисованной картинки — зеркальная мозаика
   (не растягиваем одну карту, а собираем большую территорию; рендер в полразрешения) */
function flyTiledBg(img,W,H){
  const sc=0.5, c=document.createElement('canvas');
  c.width=Math.max(64,Math.round(W*sc)); c.height=Math.max(64,Math.round(H*sc));
  const x=c.getContext('2d');
  const cols=2, rows=3, tw=c.width/cols, th=c.height/rows;
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    x.save();
    x.translate(i*tw+(i%2?tw:0), j*th+(j%2?th:0));
    x.scale(i%2?-1:1, j%2?-1:1);
    x.drawImage(img,0,0,tw,th);
    x.restore();
  }
  const v=x.createRadialGradient(c.width/2,c.height/2,Math.min(c.width,c.height)*0.4,c.width/2,c.height/2,Math.max(c.width,c.height)*0.72);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.42)');
  x.fillStyle=v; x.fillRect(0,0,c.width,c.height);
  return c;
}

/* ===== ПОСТРОИТЬ ЯРУС (вызывается на старте и при переходе через портал) ===== */
function buildFlightTier(region){
  const f=flight; if(!f)return;
  f.region=region;
  const bn=region.biomeN||1;
  // картинка логова этого мира (если есть)
  const _dik=flyArtKey(region); // ПЕРФ: переиспользуем Image(), не грузим повторно
  if(_denImgCache[_dik]!==undefined){ f.denImg=_denImgCache[_dik]; }
  else { const _im=new Image(); _im.onerror=()=>{_denImgCache[_dik]=null; if(flight)flight.denImg=null;}; _im.onload=()=>{_denImgCache[_dik]=_im;}; _im.src=`images/den_${_dik}.png`; f.denImg=_im; }
  loadFlyMap(region,bn,img=>{
    if(!flight||flight!==f)return;
    // REWORK: карта ~10× больше — не растянутая, а собранная из новых участков
    const MS=(GB.Run&&GB.Run.mapScale)||3.1;
    let W,H;
    if(img){ // нарисованная карта → зеркальная мозаика на большую территорию
      const SC=Math.max(1.4,(innerWidth*1.35)/img.width);
      W=Math.round(img.width*SC*MS); H=Math.round(img.height*SC*MS);
      f.bg=flyTiledBg(img,W,H);
    } else {  // процедурный фон (в полразрешения — экономия памяти, рисуем растянуто)
      W=Math.round(Math.max(innerWidth*1.5,900)*MS); H=Math.round(Math.max(innerHeight*2.2,1400)*MS);
      f.bg=flyBackground(region.scene,Math.round(W*0.42),Math.round(H*0.42),region.id);
    }
    f.W=W; f.H=H;
    f.weather=(typeof rollWeather==='function')?rollWeather(region):null; worldSeen('biomes',region.scene); if(f.weather)worldSeen('weather',f.weather.id);
    f.beasts=0; f.cnt={treasure:0,scroll:0};
    f.items=[];f.storms=[];f.dens=[];f.wilds=[];f.elites=[];f.secrets=[];f.pockets=[];f.winds=[];f.floats=[];f.clouds=[];
    f.trialEnt=null; f.trialDone=false;
    f.drag={x:W/2,y:H-140,vx:0,vy:0,heading:-Math.PI/2,flap:0,hurt:0,bank:0,trail:[]};
    f.stam=(GB.Run&&GB.Run.staminaMax)||140; f.paused=false; f.warp=false; f._pend=null; f.battleWin=undefined;
    // REWORK: туман миникарты — сетка исследованных клеток
    f.mgN=18; f.mgrid=new Uint8Array(f.mgN*f.mgN); f._miniT=0;

    const RN=GB.Run||{};
    const riskMul=f.run?f.run.riskMul:1, rewardMul=f.run?f.run.rewardMul:1;
    const coinVal=Math.max(2,Math.round((region.gold[0]+region.gold[1])/20*rewardMul));
    const put=(icon,type,n,val,zone)=>{for(let i=0;i<n;i++){
      const zx=zone?zone.x+(Math.random()-.5)*zone.r*1.6:90+Math.random()*(W-180);
      const zy=zone?zone.y+(Math.random()-.5)*zone.r*1.6:170+Math.random()*(H-340);
      f.items.push({icon,type,val:val||0,x:Math.max(60,Math.min(W-60,zx)),y:Math.max(120,Math.min(H-80,zy)),r:16,taken:false,pulse:Math.random()*6});}};
    put('🪙','coin',Math.round((18+bn*3)*2.4),coinVal);
    put('💎','gem',(4+bn*2)*2,coinVal*3);
    // яйца НЕ разбросаны по карте — редкая награда за победы/события/испытания
    put('🎁','chest',3);
    put('🔑','key',2);
    put('📜','scroll',2);
    put('❓','choice',4+bn); // события-решения — чаще: игрок выбирает почти постоянно
    put('🍖','food',(2+bn)*2);
    // REWORK: опасные карманы — богатая добыча под охраной элиты (риск ↔ награда)
    for(let i=0;i<(RN.dangerPockets||2);i++){
      const pk={x:W*(0.15+Math.random()*0.7), y:H*(0.18+i*0.3+Math.random()*0.2), r:280};
      f.pockets.push(pk);
      put('🎁','chest',1,0,pk); put('💎','gem',3,coinVal*4,pk); put('🔑','key',1,0,pk);
    }
    // REWORK: секретные зоны — невидимы, открываются при подлёте
    for(let i=0;i<(RN.secretCount||2);i++)
      f.secrets.push({x:W*(0.1+Math.random()*0.8), y:H*(0.15+Math.random()*0.65), r:130, found:false});
    // REWORK: воздушные потоки — быстрые маршруты через большую карту
    for(let i=0;i<(RN.windLanes||3);i++){
      const x1=W*(0.15+Math.random()*0.7), y1=H*(0.9-i*0.28);
      const x2=Math.max(W*0.1,Math.min(W*0.9,x1+(Math.random()-.5)*W*0.5)), y2=Math.max(H*0.08,y1-H*0.3);
      f.winds.push({x1,y1,x2,y2,w:95});
    }
    // трасса из колец: пролети все 5 подряд — гарантированный сундук
    f.rings=[];f.ringIdx=0;f.ringTimer=0;f.ringDone=false;
    {let rx=W*(0.25+Math.random()*0.5), ry=H*0.85;
     for(let i=0;i<5;i++){f.rings.push({x:Math.max(90,Math.min(W-90,rx)),y:ry,r:64});
       rx+=(Math.random()-0.5)*W*0.3; ry-=H*0.14;}}
    for(let i=0;i<(1+bn*2)*3;i++)f.storms.push({x:120+Math.random()*(W-240),y:240+Math.random()*(H-480),
      r:60+Math.random()*40,a:Math.random()*6,va:.3+Math.random()*.5,vx:(Math.random()-.5)*40,vy:(Math.random()-.5)*40,
      ph:Math.random()*4}); // фаза цикла: затишье → предупреждение → разряд
    // логова зверей — реальные бои
    const denAt=(fx,fy)=>{const sp=weightedSpecies();
      return {x:W*fx,y:H*fy,icon:pick(['🐗','🦊','👹','🦎','🕷️','🦂']),name:'Логово: '+sp.name,sp,
        beast:{x:W*fx+40,y:H*fy,tx:W*fx,ty:H*fy,wait:0},patrolR:150,aggro:200,speedMul:.78,defeated:false,cool:0};};
    f.dens=[];
    for(let i=0;i<(RN.denCount||4);i++)
      f.dens.push(denAt(0.18+Math.random()*0.64, 0.2+i*(0.6/((RN.denCount||4)))+Math.random()*0.08));
    // дикие драконы — победа в бою даёт яйцо
    const wildAt=(fx,fy,rare)=>{const sp=weightedSpecies();
      return {sp,rare:!!rare,name:rare?'✨ Мерцающий беглец':'Дикий дракон: '+sp.name,
        col:(TOPDRAGON_COLORS[sp.el]||TOPDRAGON_COLORS.fire).body,img:flySprite(sp.id),
        x:W*fx,y:H*fy,tx:0,ty:0,wait:0,heading:0,
        speed:rare?150:110+Math.random()*40,defeated:false,cool:0};};
    f.wilds=[];
    for(let i=0;i<(RN.wildCount||4);i++)
      f.wilds.push(wildAt(0.2+Math.random()*0.6, 0.25+Math.random()*0.5));
    if(bn>=2)f.wilds.push(wildAt(0.5,0.4,true));
    // REWORK: элитные стражи опасных карманов
    f.pockets.forEach((pk,i)=>{ if(i>=(RN.eliteCount||2))return;
      const sp=weightedSpecies();
      f.elites.push({sp,elite:true,name:'👿 Элита: '+sp.name,img:flySprite(sp.id),
        x:pk.x,y:pk.y,tx:pk.x,ty:pk.y,wait:0,heading:0,home:pk,speed:135,defeated:false,cool:0});});
    for(let i=0;i<3;i++)f.clouds.push({x:Math.random()*W,y:Math.random()*H,r:240+Math.random()*220,
      vx:6+Math.random()*10,vy:(Math.random()-.5)*5});

    // REWORK: испытание региона — страж у портала, проверка механики биома
    const trialKey=region.el==='storm'?'storm':region.scene;
    const trialDef=(typeof REGION_TRIALS!=='undefined'&&REGION_TRIALS[trialKey])||null;
    if(trialDef){ const sp=weightedSpecies();
      f.trialEnt={sp,trial:true,scene:trialKey,icon:trialDef.icon,
        name:trialDef.name,hint:trialDef.hint,x:W/2,y:H*0.08+120,defeated:false,cool:0}; }

    // портал: на ярусы 1-2 — переход выше, на последнем — возвращение домой
    const nextN=(bn<3 && f.worldObj && f.worldObj.biomes[bn])?bn+1:null;
    const goals=[
      {icon:'⚔️',label:'Победи зверей',cur:()=>f.beasts,need:2},
      {icon:'💰',label:'Собери находок',cur:()=>f.cnt.treasure,need:8+2*bn},
    ];
    if(bn>=2)goals.push({icon:'📜',label:'Найди свиток',cur:()=>f.cnt.scroll,need:1});
    if(f.trialEnt)goals.push({icon:trialDef.icon,label:trialDef.name,cur:()=>f.trialDone?1:0,need:1});
    f.portal={x:W/2,y:70,goals,next:nextN,
      name:nextN?('Портал: '+f.worldObj.biomes[nextN-1].name):'Портал возвращения'};

    renderFlight();
  });
}

function flyPortalReady(){const f=flight;return f&&f.portal&&f.portal.goals.every(g=>g.cur()>=g.need);}

/* ===== РЕНДЕР DOM + ИГРОВОЙ ЦИКЛ (вызывается и при возврате из боя) ===== */
function renderFlight(){
  const f=flight; if(!f)return;
  const fs=$('#flightFs'); if(!fs)return;
  if(f.raf)cancelAnimationFrame(f.raf);
  if(f.ac)f.ac.abort();
  f.ac=new AbortController();
  const sig={signal:f.ac.signal};
  const bn=f.region.biomeN||1;
  const tierRoman=['I','II','III'][bn-1]||bn;

  fs.innerHTML=`
    <canvas id="fcv"></canvas>
    <div class="fcv-top">
      <div class="fcv-title">Ярус ${tierRoman} · ${f.region.biome}${f.weather?' · '+f.weather.emoji+' '+f.weather.name:''} · ${dragonName(f.d)}</div>
      <span id="fcvScore"></span>
      <div class="fcv-stam"><div id="fcvStamFill"></div></div>
      <button class="fcv-exit" id="fcvExit">🏁 Закончить</button>
    </div>
    <div class="fcv-goals" id="fcvGoals"></div>
    <canvas class="fcv-mini" id="fcvMini"></canvas>
    <div class="fcv-stick" id="fcvStick"><div class="fcv-knob" id="fcvKnob"></div></div>
    <div class="fcv-enc" id="fcvEnc"></div>
    <div class="fcv-fade" id="fcvFade"></div>`;
  f._score=$('#fcvScore'); f._stam=$('#fcvStamFill'); f._goals=$('#fcvGoals'); // ПЕРФ: кэш ссылок HUD (не $() каждый кадр)
  // REWORK: миникарта — игрок, туман, точки интереса; не перегружает экран
  const mini=$('#fcvMini'), mtx=mini?mini.getContext('2d'):null;
  if(mini){ const mw=104, mh=Math.max(84,Math.min(170,Math.round(mw*f.H/f.W)));
    mini.width=mw*2; mini.height=mh*2; mini.style.width=mw+'px'; mini.style.height=mh+'px';
    mtx.setTransform(2,0,0,2,0,0); }
  function drawMini(){
    if(!mtx)return; const mw=mini.width/2, mh=mini.height/2, kx=mw/f.W, ky=mh/f.H;
    mtx.clearRect(0,0,mw,mh);
    mtx.fillStyle='rgba(10,8,18,.82)'; mtx.fillRect(0,0,mw,mh);
    // исследованные клетки
    const n=f.mgN, cw=mw/n, ch=mh/n;
    mtx.fillStyle='rgba(180,160,220,.16)';
    for(let i=0;i<n*n;i++){ if(f.mgrid[i]) mtx.fillRect((i%n)*cw,((i/n)|0)*ch,cw+0.5,ch+0.5); }
    // опасные карманы (после обнаружения клетки)
    mtx.strokeStyle='rgba(255,90,80,.55)'; mtx.lineWidth=1;
    for(const pk of f.pockets){ if(!miniSeen(pk))continue;
      mtx.beginPath(); mtx.arc(pk.x*kx,pk.y*ky,Math.max(4,pk.r*kx),0,7); mtx.stroke(); }
    // точки интереса
    const dot=(x,y,c,r2)=>{mtx.fillStyle=c;mtx.beginPath();mtx.arc(x*kx,y*ky,r2||2,0,7);mtx.fill();};
    for(const it of f.items){ if(it.taken)continue;
      if(it.type==='chest'&&miniSeen(it))dot(it.x,it.y,'#ffd76a',2.4);
      else if(it.type==='choice'&&miniSeen(it))dot(it.x,it.y,'#9fe6ff',2); }
    for(const dd of f.dens){ if(!dd.defeated&&miniSeen(dd))dot(dd.x,dd.y,'#ff7a5c',2.6); }
    for(const wd of f.wilds){ if(!wd.defeated&&miniSeen(wd))dot(wd.x,wd.y,'#ffb46a',2.2); }
    for(const el2 of f.elites){ if(!el2.defeated&&miniSeen(el2))dot(el2.x,el2.y,'#d8b4ff',3); }
    for(const s2 of f.secrets){ if(s2.found)dot(s2.x,s2.y,'#7ce8d0',2.6); }
    if(f.trialEnt&&!f.trialEnt.defeated&&miniSeen(f.trialEnt))dot(f.trialEnt.x,f.trialEnt.y,'#ff5d52',3.4);
    // портал
    mtx.fillStyle=flyPortalReady()?'#ffd76a':'rgba(255,215,106,.45)';
    mtx.beginPath(); const px2=f.portal.x*kx, py2=f.portal.y*ky;
    mtx.moveTo(px2,py2-4); mtx.lineTo(px2+3.5,py2+2.5); mtx.lineTo(px2-3.5,py2+2.5); mtx.closePath(); mtx.fill();
    // игрок
    dot(f.drag.x,f.drag.y,'#ffffff',2.8);
    mtx.strokeStyle='rgba(255,255,255,.6)'; mtx.strokeRect(0.5,0.5,mw-1,mh-1);
  }
  function miniSeen(o){ const n=f.mgN, gx=Math.min(n-1,Math.max(0,(o.x/f.W*n)|0)), gy=Math.min(n-1,Math.max(0,(o.y/f.H*n)|0));
    return !!f.mgrid[gy*n+gx]; }

  const cv=$('#fcv'), ctx=cv.getContext('2d');
  let vw,vh,dpr;
  const resize=()=>{dpr=Math.min(2,window.devicePixelRatio||1);vw=innerWidth;vh=innerHeight;
    cv.width=vw*dpr;cv.height=vh*dpr;cv.style.width=vw+'px';cv.style.height=vh+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);};
  addEventListener('resize',resize,sig); resize();

  // REWORK: выбор усиления после победы (мини-роглайт: усиление → следующее решение)
  function showBoonChoice(){
    const enc=$('#fcvEnc'); if(!enc||typeof RUN_BOONS==='undefined')return;
    f.paused=true;
    const pool=RUN_BOONS.slice();
    const picks=[]; for(let i=0;i<((GB.Run&&GB.Run.boonChoices)||3)&&pool.length;i++)
      picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
    enc.style.display='flex';
    enc.innerHTML=`<div class="enc-card"><div class="enc-icon">🔮</div>
      <div class="enc-name">Выбери усиление</div>
      <div class="enc-sub">Действует до конца этого странствия${f.run.boons.length?` · уже взято: ${f.run.boons.join('')}`:''}</div>
      ${picks.map((b,i)=>`<button ${i?'class="ghost"':''} data-boon="${b.id}">${b.icon} ${b.name} — ${b.desc}</button>`).join('')}</div>`;
    enc.querySelectorAll('[data-boon]').forEach(btn=>btn.onpointerdown=()=>{
      const b=picks.find(x=>x.id===btn.dataset.boon);
      enc.style.display='none'; f.paused=false;
      if(b){ runAddBoon(b); f.floats.push({x:f.drag.x,y:f.drag.y,t:0,txt:b.icon+' '+b.name+'!'}); }
    });
  }
  // REWORK: разбор поражения — понятная причина и цель развития
  function showDefeatCard(){
    const enc=$('#fcvEnc'), r=f.lastDefeat; if(!enc||!r)return;
    f.lastDefeat=null; f.paused=true;
    enc.style.display='flex';
    enc.innerHTML=`<div class="enc-card"><div class="enc-icon">${r.icon}</div>
      <div class="enc-name">Поражение: ${r.title}</div>
      <div class="enc-sub">${r.why}</div>
      <div class="enc-sub" style="color:var(--gold,#ffd76a)">🎯 Что делать: ${r.goal}</div>
      <button id="fcvDefOk">Продолжить путь</button>`;
    const ok=$('#fcvDefOk'); if(ok)ok.onpointerdown=()=>{enc.style.display='none';f.paused=false;};
  }
  // возврат из боя: применяем итог (защищено от любых сбоев)
  try{
    if(f._pend!==null && f._pend!==undefined && f.battleWin!==undefined){
      const p=f._pend, ent=p.ent, win=f.battleWin;
      f._pend=null; f.battleWin=undefined;
      if(win){
        ent.defeated=true;
        if(p.kind==='den'){f.beasts++; questEvent('explore');}
        if(p.kind==='wild'){
          f.beasts++;
          const tier=ent.rare?3:Math.min(3,f.region.biomeN||1);
          addEgg(ent.sp.el,tier); f.stats.eggs++;
          f.floats.push({x:f.drag.x,y:f.drag.y,t:0,txt:ent.rare?'✨ РЕДКОЕ ЯЙЦО!':'🥚 Яйцо!'});
        } else if(p.kind==='elite'){
          // REWORK: элита охраняет богатство — сундук и ключ
          f.beasts++; addChest(Math.min(3,(f.region.biomeN||1)+1)); addKey(Math.min(3,f.region.biomeN||1));
          f.cnt.treasure++; f.floats.push({x:f.drag.x,y:f.drag.y,t:0,txt:'👿 Элита пала! 🎁+🔑'});
        } else if(p.kind==='trial'){
          // REWORK: испытание региона пройдено — портал открыт, редкая награда
          f.trialDone=true; f.beasts++;
          const tier=Math.min(3,(f.region.biomeN||1)+1);
          addEgg(f.region.el,tier,Math.min(4,2+(f.region.biomeN||1))); f.stats.eggs++;
          f.floats.push({x:f.drag.x,y:f.drag.y,t:0,txt:'🏆 Испытание пройдено! Редкое яйцо!'});
        } else {
          f.floats.push({x:f.drag.x,y:f.drag.y,t:0,txt:'⚔️ Победа!'});
        }
        // рассыпать монеты вокруг логова (награда растёт с риском пути)
        const ox=ent.x, oy=ent.y;
        const rm=(f.run&&f.run.rewardMul)||1;
        const coinVal=Math.max(2,Math.round((f.region.gold[0]+f.region.gold[1])/20*rm));
        const nCoins=Math.round(5*rm)+(p.kind==='elite'||p.kind==='trial'?3:0);
        for(let i=0;i<nCoins;i++){const a=Math.random()*6.28,r2=30+Math.random()*80;
          f.items.push({icon:'🪙',type:'coin',val:coinVal,x:ox+Math.cos(a)*r2,y:oy+Math.sin(a)*r2,r:16,taken:false,pulse:Math.random()*6});}
        persist(); renderLedger();
        // REWORK: после победы — выбор усиления забега
        setTimeout(showBoonChoice,350);
      } else {
        ent.cool=4;
        // дракон обессилел — переводит дух и продолжает путь
        if((f.d.curHp||0)<=0){
          const st=statsOf(f.d);
          f.d.curHp=Math.max(1,Math.round(st.maxHp*0.25));
          persist();
        }
        // REWORK: показать причину поражения и цель развития
        if(f.lastDefeat) setTimeout(showDefeatCard,250);
      }
    }
  }catch(e){ console.warn('[flight] возврат из боя:',e); f._pend=null; f.battleWin=undefined; }
  // полёт продолжается после возврата из боя
  if(!f.ended) f.paused=false;

  /* --- управление: джойстик под пальцем + WASD/стрелки --- */
  const stickEl=$('#fcvStick'), knobEl=$('#fcvKnob');
  const joy={active:false,cx:0,cy:0,dx:0,dy:0,id:null};
  const keys=new Set();
  fs.onpointerdown=e=>{
    if(e.target.closest('#fcvExit,#fcvEnc,.fcv-top,.fcv-goals'))return;
    joy.active=true;joy.id=e.pointerId;joy.cx=e.clientX;joy.cy=e.clientY;joy.dx=joy.dy=0;
    stickEl.style.display='block';stickEl.style.left=(e.clientX-60)+'px';stickEl.style.top=(e.clientY-60)+'px';
  };
  fs.onpointermove=e=>{if(!joy.active||e.pointerId!==joy.id)return;
    let dx=e.clientX-joy.cx,dy=e.clientY-joy.cy;const len=Math.hypot(dx,dy),max=60;
    if(len>max){dx*=max/len;dy*=max/len;}joy.dx=dx/max;joy.dy=dy/max;
    knobEl.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;};
  const je=e=>{if(e.pointerId!==joy.id)return;joy.active=false;joy.dx=joy.dy=0;
    stickEl.style.display='none';knobEl.style.transform='translate(-50%,-50%)';};
  fs.onpointerup=je;fs.onpointercancel=je;
  // старые iOS Safari без Pointer Events: дублируем через touch-события
  if(!window.PointerEvent){
    fs.ontouchstart=e=>{const t=e.touches[0];if(!t)return;
      if(e.target.closest('#fcvExit,#fcvEnc,.fcv-top,.fcv-goals'))return;
      e.preventDefault();
      joy.active=true;joy.id='t';joy.cx=t.clientX;joy.cy=t.clientY;joy.dx=joy.dy=0;
      stickEl.style.display='block';stickEl.style.left=(t.clientX-60)+'px';stickEl.style.top=(t.clientY-60)+'px';};
    fs.ontouchmove=e=>{const t=e.touches[0];if(!joy.active||!t)return;e.preventDefault();
      let dx=t.clientX-joy.cx,dy=t.clientY-joy.cy;const len=Math.hypot(dx,dy),max=60;
      if(len>max){dx*=max/len;dy*=max/len;}joy.dx=dx/max;joy.dy=dy/max;
      knobEl.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;};
    fs.ontouchend=fs.ontouchcancel=()=>{joy.active=false;joy.dx=joy.dy=0;
      stickEl.style.display='none';knobEl.style.transform='translate(-50%,-50%)';};
  }
  addEventListener('keydown',e=>keys.add(e.code),sig);
  addEventListener('keyup',e=>keys.delete(e.code),sig);
  $('#fcvExit').onclick=()=>finishFlight(false);

  /* --- встреча со зверем/диким драконом --- */
  const encEl=$('#fcvEnc');
  function encounter(kind,ent){
    f.paused=true;
    const isWild=kind==='wild', isElite=kind==='elite', isTrial=kind==='trial';
    // REWORK: игрок видит риск и награду ДО решения
    const sub = isTrial?`${ent.hint} Победа откроет портал и принесёт редкое яйцо. <b>Риск: высокий</b>`
      : isElite?'Страж сокровищ. Победа: сундук + ключ. <b>Риск: высокий</b>'
      : isWild?(ent.rare?'Редчайший дракон! Победа принесёт редкое яйцо. <b>Риск: средний</b>':'Победа над диким драконом — яйцо для Гнезда. <b>Риск: средний</b>')
      :'Из логова выходит стая. Победа: золото и прогресс. <b>Риск: обычный</b>';
    encEl.style.display='flex';
    encEl.innerHTML=`<div class="enc-card">
      <div class="enc-icon">${isTrial?ent.icon:isElite?'👿':isWild?'🐉':ent.icon}</div>
      <div class="enc-name">${ent.sp&&ent.sp.rarity>=speciesById(f.d.id).rarity+2?'⭐ ':''}${ent.name}</div>
      <div class="enc-sub">${sub}</div>
      <button id="fcvFight">⚔️ В бой</button><button class="ghost" id="fcvFlee">🛫 Улететь</button></div>`;
    $('#fcvFight').onpointerdown=()=>{
      encEl.style.display='none';
      f._pend={kind,ent}; f.battleWin=undefined;
      const sp=ent.sp;
      const legend=sp.rarity>=speciesById(f.d.id).rarity+2;
      const lvl=Math.max(1,f.d.level+rnd(-1,1)-(legend?3:0)+(isTrial||isElite?1:0));
      const reward=Math.round(lvl*(10+sp.rarity*4)*(legend?2:1));
      // спрятать полёт; вернёмся через renderFlight() (общий контракт для обоих боёв)
      if(f.raf)cancelAnimationFrame(f.raf); f.raf=0;
      fs.style.display='none';
      // АРКАДНЫЙ бой (реальное время). Fallback — старый пошаговый, если модуль недоступен/упал.
      if(typeof startArcadeFight==='function'){
        try{ startArcadeFight(f.d, ent, {lvl, reward, kind,
          elite:isElite, scene:ent.scene, depth:(f.run&&f.run.depth)||0, riskMul:(f.run&&f.run.riskMul)||1}); return; }
        catch(e){ console.warn('[Драконис] аркада не стартовала, пошаговый fallback:',e); }
      }
      document.body.classList.remove('flight-active');
      S.arenaPick=f.d.uid; switchView('arena');
      startBattle(f.d,{id:sp.id,level:lvl,morph:rollMorph()},reward);
      if(battle)battle.fromFlight=true;
    };
    $('#fcvFlee').onpointerdown=()=>{
      encEl.style.display='none';f.paused=false;ent.cool=3;
      const bx=ent.beast?ent.beast.x:ent.x,by=ent.beast?ent.beast.y:ent.y;
      const a=Math.atan2(f.drag.y-by,f.drag.x-bx);f.drag.vx+=Math.cos(a)*380;f.drag.vy+=Math.sin(a)*380;
    };
  }

  /* --- загадочное место (❓) --- */
  function choiceCard(item){
    f.paused=true;
    const ev=(typeof rollWorldEvent==='function')?rollWorldEvent():null;
    if(!ev){ f.paused=false; return; }
    worldEventSeen(ev);
    encEl.style.display='flex';
    // REWORK: у каждого исхода видно ожидаемую ценность — осознанное решение, а не лотерея
    const riskTag=o=>{const rr=(typeof REWARD_RISK!=='undefined')&&REWARD_RISK[o.reward];
      return rr&&o.reward!=='none'?`<span style="opacity:.65;font-size:11px"> · ${rr.v}</span>`:'';};
    encEl.innerHTML=`<div class="enc-card"><div class="enc-icon">${ev.icon}</div><div class="enc-name">${ev.name}</div><div class="enc-sub">${ev.q}</div>`
      + ev.opts.map((o,i)=>`<button ${i?'class="ghost"':''} data-c="${i}">${o.t}${riskTag(o)}</button>`).join('') + `</div>`;
    encEl.querySelectorAll('[data-c]').forEach(btn=>btn.onpointerdown=()=>{
      const opt=ev.opts[+btn.dataset.c];
      encEl.style.display='none';f.paused=false;
      const txt=grantWorldReward(opt.reward);
      if(opt.reward!=='none'){ f.cnt.treasure++; exploreProgress(); }
      f.floats.push({x:item.x,y:item.y,t:0,txt});
      renderLedger();
    });
  }

  /* --- сбор предмета --- */
  function pickup(it){
    it.taken=true;
    if(typeof incubateEggs==='function') incubateEggs(GB.Eggs.incExplore); // исследование инкубирует яйца
    const R=f.region;let txt=it.icon+' +1';
    if(it.type==='coin'||it.type==='gem'){S.gold+=it.val;f.stats.gold+=it.val;f.cnt.treasure++;txt=`${it.icon} +${it.val}`;}
    else if(it.type==='egg'){addEgg(R.el,R.biomeN);f.stats.eggs++;f.cnt.treasure++;txt='🥚 Яйцо!';}
    else if(it.type==='chest'){addChest(Math.min(3,R.biomeN||1));f.cnt.treasure++;txt='🎁 Сундук!';}
    else if(it.type==='key'){addKey(Math.min(3,R.biomeN||1));f.cnt.treasure++;txt='🔑 Ключ!';}
    else if(it.type==='scroll'){const scr=grantScroll(R.worldId,R.biomeN);f.cnt.scroll++;f.cnt.treasure++;
      txt=scr?`📜 «${scr.title}»!`:'📜 Уже собран';
      if(!scr){const g=rnd(R.gold[0],R.gold[1]);S.gold+=g;f.stats.gold+=g;txt+=` +${g}🪙`;}}
    else if(it.type==='food'){const st=statsOf(f.d);
      const heal=Math.max(4,Math.round(st.maxHp*0.2));
      f.d.curHp=Math.min(st.maxHp,Math.round((f.d.curHp||0)+heal));
      txt=`🍖 +${heal} здоровья`;}
    else if(it.type==='choice'){choiceCard(it);return;}
    f.floats.push({x:it.x,y:it.y,t:0,txt});
    renderLedger();
  }

  function renderGoals(){
    const g=f._goals; if(!g)return;
    const rdy=flyPortalReady();
    g.innerHTML=`<span class="g-title">⛩️ ${f.portal.name}</span><br>`+f.portal.goals.map(go=>{
      const c=Math.min(go.need,go.cur());
      return `<span class="${c>=go.need?'done':''}">${c>=go.need?'✔':go.icon} ${go.label}: <b>${c}/${go.need}</b></span>`;}).join('<br>')
      +(rdy?'<br><span class="done">▲ Портал открыт! Лети вверх ⬆</span>':'');
  }

  /* --- отрисовка дракона-спрайта (учитывает пропорции PNG) --- */
  function drawSprite(img,wx,wy,heading,sx,sy,size,now,dref,glow){
    const px=wx-sx,py=wy-sy,t=now/1000;
    const flap=Math.sin(t*8+px*0.01),lift=flap*0.5+0.5;
    if(glow){ctx.save();ctx.globalAlpha=.45+Math.sin(now/200)*.25;ctx.fillStyle='#ffd76a';
      ctx.beginPath();ctx.arc(px,py,size*0.6,0,7);ctx.fill();ctx.restore();}
    let dw=size,dh=size;
    if(img&&img.naturalWidth&&img.naturalHeight){
      const r=img.naturalHeight/img.naturalWidth;
      if(r<0.8){dw=size*1.8;dh=dw*r;} else {dw=size;dh=size*r;}
    }
    ctx.save();ctx.translate(px+7,py+11);ctx.rotate(heading+Math.PI/2);
    ctx.globalAlpha=.24;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(0,0,dw*0.36*(1-lift*0.15),dh*0.34,0,0,7);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(px,py-lift*4);
    ctx.rotate(heading+Math.PI/2+(dref?dref.bank*0.5:0));
    ctx.scale(1+flap*0.09,1-flap*0.05);
    if(dref&&dref.hurt>0&&Math.floor(now/90)%2===0)ctx.globalAlpha=.45;
    if(img&&img.complete&&img.naturalWidth)ctx.drawImage(img,-dw/2,-dh/2,dw,dh);
    else{ctx.font=(size*0.7)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🐉',0,0);}
    ctx.restore();ctx.globalAlpha=1;
  }

  /* --- главный цикл --- */
  const cam={x:0,y:0};let last=performance.now();
  const P={speed:240,inertia:.88},STAM_MAX=(GB.Run&&GB.Run.staminaMax)||140;
  const trailCol=(TOPDRAGON_COLORS[speciesById(f.d.id).el]||TOPDRAGON_COLORS.fire).edge;
  function frame(now){
    if(!flight||flight!==f)return;
    try{ frameBody(now); }catch(e){ console.warn('[Драконис] сбой кадра полёта:',e); }
    f.raf=requestAnimationFrame(frame);
  }
  function frameBody(now){
    const dt=f.paused||f.ended?0:Math.min(.05,(now-last)/1000);last=now;
    const dg=f.drag,W=f.W,H=f.H;
    // самовосстановление: пауза висит, а карточки на экране нет — снимаем
    if(f.paused&&!f.ended&&!f.warp){
      const encO=$('#fcvEnc');
      if(!encO||encO.style.display!=='flex')f.paused=false;
    }
    // ввод: джойстик или клавиши
    let jx=joy.dx,jy=joy.dy;
    if(!joy.active){
      jx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
      jy=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
      const l=Math.hypot(jx,jy);if(l>1){jx/=l;jy/=l;}
    }
    const tired=f.stam<=0,spdCap=P.speed*(tired?.4:1);
    const k=1-Math.pow(P.inertia,dt*60);
    dg.vx+=(jx*spdCap-dg.vx)*k;dg.vy+=(jy*spdCap-dg.vy)*k;
    const spd=Math.hypot(dg.vx,dg.vy);
    if(spd>8){const tgt=Math.atan2(dg.vy,dg.vx);
      let diff=((tgt-dg.heading+Math.PI*3)%(Math.PI*2))-Math.PI;
      dg.heading+=diff*Math.min(1,dt*6);dg.bank+=(diff-dg.bank)*Math.min(1,dt*5);}
    else dg.bank*=(1-Math.min(1,dt*4));
    dg.x=Math.max(30,Math.min(W-30,dg.x+dg.vx*dt));
    dg.y=Math.max(30,Math.min(H-30,dg.y+dg.vy*dt));
    dg.flap+=dt*(6+spd*0.02);if(dg.hurt>0)dg.hurt-=dt;
    if(spd>40&&!f.paused)dg.trail.push({x:dg.x,y:dg.y,t:0});
    dg.trail.forEach(p=>p.t+=dt);dg.trail=dg.trail.filter(p=>p.t<0.5);

    // портал: переход на следующий ярус или возвращение
    if(!f.ended&&!f.paused){
      if(flyPortalReady()&&dg.y<110&&Math.abs(dg.x-f.portal.x)<W*0.5){
        // мягкая посадка: подлетел медленно — бонус
        if(Math.hypot(dg.vx,dg.vy)<80){
          const cv=Math.max(2,Math.round((f.region.gold[0]+f.region.gold[1])/20))*5;
          S.gold+=cv;f.stats.gold+=cv;
          f.floats.push({x:dg.x,y:dg.y,t:0,txt:'🪶 Мягкая посадка! +'+cv+'🪙'});
        }
        if(f.portal.next&&f.worldObj){
          // REWORK: выбор пути — риск ↔ награда следующего яруса (решение игрока)
          f.paused=true;f.warp=true;
          const gates=(typeof ROUTE_GATES!=='undefined')?ROUTE_GATES:[{id:'risky',icon:'⛩️',name:'Дальше',desc:''}];
          encEl.style.display='flex';
          encEl.innerHTML=`<div class="enc-card"><div class="enc-icon">⛩️</div>
            <div class="enc-name">Три пути ведут выше</div>
            <div class="enc-sub">Выбери дорогу к ярусу «${f.worldObj.biomes[f.portal.next-1].name}»</div>
            ${gates.map((g,i)=>`<button ${i?'class="ghost"':''} data-gate="${g.id}">${g.icon} ${g.name}<br><span style="opacity:.7;font-size:11px">${g.desc}</span></button>`).join('')}</div>`;
          encEl.querySelectorAll('[data-gate]').forEach(btn=>btn.onpointerdown=()=>{
            const gid=btn.dataset.gate;
            f.run.gate=gid;
            f.run.riskMul=(GB.Run&&GB.Run.riskMul&&GB.Run.riskMul[gid])||1;
            f.run.rewardMul=(GB.Run&&GB.Run.rewardMul&&GB.Run.rewardMul[gid])||1;
            f.run.depth=(f.run.depth||0)+1;
            encEl.style.display='none';
            f.floats.push({x:f.portal.x,y:90,t:0,txt:'⛩️ ПЕРЕХОД!'});
            const fd=$('#fcvFade'); if(fd)fd.style.opacity='1';
            const nr=makeRegion(f.worldObj,f.portal.next);
            setTimeout(()=>buildFlightTier(nr),380);
          });
        } else {
          f.floats.push({x:f.portal.x,y:90,t:0,txt:'⛩️ ДОМОЙ!'});
          finishFlight(true);
        }
      } else if(!flyPortalReady()&&dg.y<95){
        dg.y=95;dg.vy=Math.abs(dg.vy)*.5+40;
        if(dg.hurt<=0){dg.hurt=.4;f.floats.push({x:dg.x,y:dg.y,t:0,txt:'⛩️ Портал запечатан'});}
      }
    }

    // выносливость
    const zoneMul=1+((f.region.biomeN||1)-1)*0.2,moving=spd>30;
    if(moving)f.stam=Math.max(0,f.stam-dt*zoneMul);else f.stam=Math.min(STAM_MAX,f.stam+dt*4);
    const sf=f._stam;if(sf)sf.style.width=(f.stam/STAM_MAX*100)+'%';

    // REWORK: воздушные потоки — попутный ветер разгоняет вдоль русла (быстрые маршруты)
    if(!f.paused&&!f.ended)for(const wl of f.winds){
      const lx=wl.x2-wl.x1, ly=wl.y2-wl.y1, ll=lx*lx+ly*ly||1;
      let tproj=((dg.x-wl.x1)*lx+(dg.y-wl.y1)*ly)/ll; tproj=Math.max(0,Math.min(1,tproj));
      const cxp=wl.x1+lx*tproj, cyp=wl.y1+ly*tproj;
      if(Math.hypot(dg.x-cxp,dg.y-cyp)<wl.w){
        const il=Math.sqrt(ll), push=P.speed*(((GB.Run&&GB.Run.windBoost)||1.8)-1);
        dg.vx+=lx/il*push*dt*3; dg.vy+=ly/il*push*dt*3;
        f.stam=Math.min(STAM_MAX,f.stam+dt*2); // поток бережёт силы
      }
    }
    // REWORK: секретные зоны — открываются при подлёте, дарят карман наград
    if(!f.paused&&!f.ended)for(const sz of f.secrets){
      if(sz.found)continue;
      if(Math.hypot(dg.x-sz.x,dg.y-sz.y)<sz.r){
        sz.found=true;
        const cv2=Math.max(3,Math.round((f.region.gold[0]+f.region.gold[1])/14*((f.run&&f.run.rewardMul)||1)));
        for(let i=0;i<5;i++){const a=Math.random()*6.28,r2=40+Math.random()*90;
          f.items.push({icon:i?'💎':'🎁',type:i?'gem':'chest',val:cv2,x:sz.x+Math.cos(a)*r2,y:sz.y+Math.sin(a)*r2,r:16,taken:false,pulse:Math.random()*6});}
        f.floats.push({x:sz.x,y:sz.y,t:0,txt:'✨ СЕКРЕТНАЯ ЗОНА!'});
        exploreProgress(); worldSeen('events','Секретная зона');
      }
    }
    // REWORK: элитные стражи — патрулируют опасный карман, бросаются при вторжении
    f.elites.forEach(ee=>{if(ee.defeated)return;if(ee.cool>0)ee.cool-=dt;
      const dp=Math.hypot(dg.x-ee.x,dg.y-ee.y);let mvx=0,mvy=0;
      const inPocket=Math.hypot(dg.x-ee.home.x,dg.y-ee.home.y)<ee.home.r;
      if(ee.cool<=0&&(inPocket||dp<260)){const a=Math.atan2(dg.y-ee.y,dg.x-ee.x);
        mvx=Math.cos(a)*ee.speed*1.25;mvy=Math.sin(a)*ee.speed*1.25;
        ee.x+=mvx*dt;ee.y+=mvy*dt;
        if(dp<50&&!f.paused&&!f.ended)encounter('elite',ee);}
      else{const dst=Math.hypot(ee.tx-ee.x,ee.ty-ee.y);
        if(dst<12){ee.wait-=dt;if(ee.wait<=0){const a=Math.random()*6.28,r2=Math.random()*ee.home.r*0.7;
          ee.tx=ee.home.x+Math.cos(a)*r2;ee.ty=ee.home.y+Math.sin(a)*r2;ee.wait=1+Math.random()*2;}}
        else{const a=Math.atan2(ee.ty-ee.y,ee.tx-ee.x);mvx=Math.cos(a)*70;mvy=Math.sin(a)*70;ee.x+=mvx*dt;ee.y+=mvy*dt;}}
      if(mvx||mvy)ee.heading=Math.atan2(mvy,mvx);});
    // REWORK: страж испытания — ждёт у портала, бой по касанию
    if(f.trialEnt&&!f.trialEnt.defeated&&!f.paused&&!f.ended){
      const te=f.trialEnt; if(te.cool>0)te.cool-=dt;
      if(te.cool<=0&&Math.hypot(dg.x-te.x,dg.y-te.y)<70)encounter('trial',te);
    }

    // грозы: цикл 4с — затишье 2.6с, предупреждение 1с, разряд 0.4с
    f.storms.forEach(s=>{s.a+=s.va*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.ph=(s.ph+dt)%4;
      if(s.x<s.r||s.x>W-s.r)s.vx*=-1;if(s.y<s.r||s.y>H-s.r)s.vy*=-1;
      const striking=s.ph>3.6;
      if(striking&&!f.paused&&!f.ended&&dg.hurt<=0&&Math.hypot(s.x-dg.x,s.y-dg.y)<s.r*.8){
        dg.hurt=1;f.floats.push({x:dg.x,y:dg.y,t:0,txt:'⚡!'});
        const a=Math.atan2(dg.y-s.y,dg.x-s.x);dg.vx+=Math.cos(a)*260;dg.vy+=Math.sin(a)*260;f.stam=Math.max(0,f.stam-8);}});

    // логова
    f.dens.forEach(dd=>{if(dd.defeated)return;const b=dd.beast;if(dd.cool>0)dd.cool-=dt;
      const dp=Math.hypot(dg.x-b.x,dg.y-b.y);
      if(dd.cool<=0&&dp<dd.aggro){const a=Math.atan2(dg.y-b.y,dg.x-b.x),sp2=P.speed*dd.speedMul;
        b.x+=Math.cos(a)*sp2*dt;b.y+=Math.sin(a)*sp2*dt;if(dp<44&&!f.paused&&!f.ended)encounter('den',dd);}
      else{const dst=Math.hypot(b.tx-b.x,b.ty-b.y);
        if(dst<10){b.wait-=dt;if(b.wait<=0){const a=Math.random()*6.28,r2=Math.random()*dd.patrolR;
          b.tx=dd.x+Math.cos(a)*r2;b.ty=dd.y+Math.sin(a)*r2;b.wait=1+Math.random()*2;}}
        else{const a=Math.atan2(b.ty-b.y,b.tx-b.x);b.x+=Math.cos(a)*60*dt;b.y+=Math.sin(a)*60*dt;}}});

    // дикие драконы
    f.wilds.forEach(wd=>{if(wd.defeated)return;if(wd.cool>0)wd.cool-=dt;
      const dp=Math.hypot(dg.x-wd.x,dg.y-wd.y);let mvx=0,mvy=0;
      if(wd.rare&&wd.cool<=0&&dp<330){const a=Math.atan2(wd.y-dg.y,wd.x-dg.x);
        mvx=Math.cos(a)*P.speed*.95;mvy=Math.sin(a)*P.speed*.95;
        wd.x=Math.max(50,Math.min(W-50,wd.x+mvx*dt));wd.y=Math.max(50,Math.min(H-50,wd.y+mvy*dt));}
      else{const dst=Math.hypot(wd.tx-wd.x,wd.ty-wd.y);
        if(dst<14){wd.wait-=dt;if(wd.wait<=0){wd.tx=120+Math.random()*(W-240);wd.ty=150+Math.random()*(H-300);wd.wait=1+Math.random()*3;}}
        else{const a=Math.atan2(wd.ty-wd.y,wd.tx-wd.x);mvx=Math.cos(a)*wd.speed;mvy=Math.sin(a)*wd.speed;wd.x+=mvx*dt;wd.y+=mvy*dt;}}
      if(mvx||mvy)wd.heading=Math.atan2(mvy,mvx);
      if(wd.rare){ // беглеца надо догнать: слипстрим — держись рядом 3 секунды
        if(wd.cool<=0&&!f.paused&&!f.ended){
          if(dp<180){wd.slip=(wd.slip||0)+dt;if(wd.slip>=3){wd.slip=0;encounter('wild',wd);}}
          else wd.slip=Math.max(0,(wd.slip||0)-dt*1.5);
        }
      } else if(wd.cool<=0&&dp<46&&!f.paused&&!f.ended)encounter('wild',wd);});

    // сбор
    f.items.forEach(it=>{if(!it.taken&&!f.paused&&Math.hypot(it.x-dg.x,it.y-dg.y)<it.r+30)pickup(it);});
    // кольца-трасса
    if(!f.ringDone&&f.rings&&f.rings.length&&!f.paused){
      const ring=f.rings[f.ringIdx];
      if(ring&&Math.hypot(ring.x-dg.x,ring.y-dg.y)<ring.r){
        f.ringIdx++;f.ringTimer=6;
        if(f.ringIdx>=f.rings.length){
          f.ringDone=true;
          addChest(Math.min(3,f.region.biomeN||1));
          f.cnt.treasure++;renderLedger();
          f.floats.push({x:ring.x,y:ring.y,t:0,txt:'🎁 Трасса пройдена! Сундук!'});
        } else f.floats.push({x:ring.x,y:ring.y,t:0,txt:'⭕ '+f.ringIdx+'/'+f.rings.length});
      } else if(f.ringIdx>0){
        f.ringTimer-=dt;
        if(f.ringTimer<=0){f.ringIdx=0;f.floats.push({x:dg.x,y:dg.y,t:0,txt:'⭕ трасса сброшена'});}
      }
    }
    const sc=f._score;
    if(sc)sc.textContent=`🪙${f.stats.gold} 🥚${f.stats.eggs} 💰${f.cnt.treasure} 📜${f.cnt.scroll}`;
    renderGoals();
    f.clouds.forEach(c=>{c.x+=c.vx*dt;c.y+=c.vy*dt;if(c.x>W+c.r)c.x=-c.r;if(c.y>H+c.r)c.y=-c.r;if(c.y<-c.r)c.y=H+c.r;});

    // камера + фон
    cam.x=Math.max(0,Math.min(Math.max(0,W-vw),dg.x-vw/2));
    cam.y=Math.max(0,Math.min(Math.max(0,H-vh),dg.y-vh/2));
    const shake=dg.hurt>0?dg.hurt*6:0;
    const sx=cam.x+(Math.random()-.5)*shake,sy=cam.y+(Math.random()-.5)*shake;
    ctx.clearRect(0,0,vw,vh);
    if(f.bg)ctx.drawImage(f.bg,0,0,f.bg.width,f.bg.height,-sx,-sy,W,H);
    if(f.weather&&f.weather.tint){ctx.fillStyle=f.weather.tint;ctx.fillRect(0,0,vw,vh);} // погода (визуал)

    f.clouds.forEach(c=>{const px=c.x-sx,py=c.y-sy;if(px<-c.r||py<-c.r||px>vw+c.r||py>vh+c.r)return;
      const g=ctx.createRadialGradient(px,py,c.r*.2,px,py,c.r);
      g.addColorStop(0,'rgba(10,8,6,.14)');g.addColorStop(1,'rgba(10,8,6,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,c.r,0,7);ctx.fill();});
    ctx.textAlign='center';ctx.textBaseline='middle';

    // кольца трассы
    if(!f.ringDone&&f.rings)f.rings.forEach((rg,i)=>{
      if(i<f.ringIdx)return;const px=rg.x-sx,py=rg.y-sy;
      if(px<-90||py<-90||px>vw+90||py>vh+90)return;
      const active=i===f.ringIdx, pulse=active?1+Math.sin(now/200)*0.08:1;
      ctx.save();ctx.globalAlpha=active?.95:.35;
      ctx.strokeStyle=active?'#ffd76a':'#c9a24a';ctx.lineWidth=active?6:3;
      ctx.beginPath();ctx.arc(px,py,rg.r*pulse,0,7);ctx.stroke();
      if(active){ctx.font='bold 15px Georgia';ctx.fillStyle='#ffd76a';
        ctx.fillText((i+1)+'/'+f.rings.length,px,py);}
      ctx.restore();});
    // предметы
    f.items.forEach(it=>{if(it.taken)return;const px=it.x-sx,py=it.y-sy;
      if(px<-30||py<-30||px>vw+30||py>vh+30)return;it.pulse+=dt*3;
      ctx.fillStyle='rgba(255,215,106,.22)';ctx.beginPath();ctx.arc(px,py+2,15,0,7);ctx.fill();
      ctx.font='24px serif';ctx.fillText(it.icon,px,py+Math.sin(it.pulse)*3);});

    // портал
    {const px=f.portal.x-sx,py=f.portal.y-sy,rdy=flyPortalReady(),pulse=1+Math.sin(now/300)*0.08;
      ctx.save();ctx.translate(px,py);
      if(rdy){const g=ctx.createRadialGradient(0,0,10,0,0,70*pulse);
        g.addColorStop(0,'rgba(255,220,120,.9)');g.addColorStop(.6,'rgba(255,160,60,.4)');g.addColorStop(1,'rgba(255,160,60,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,70*pulse,0,7);ctx.fill();
        ctx.font='46px serif';ctx.fillText('⛩️',0,0);
        ctx.font='italic 14px Georgia';ctx.fillStyle='#ffe';ctx.fillText('портал открыт ⬆',0,44);
      }else{ctx.globalAlpha=.55;ctx.font='42px serif';ctx.fillText('⛩️',0,0);ctx.globalAlpha=1;
        ctx.font='22px serif';ctx.fillText('🔒',0,4);}
      ctx.restore();}

    // логова
    f.dens.forEach(dd=>{const px=dd.x-sx,py=dd.y-sy;
      if(px>-200&&py>-200&&px<vw+200&&py<vh+200){
        if(f.denImg&&f.denImg.complete&&f.denImg.naturalWidth){
          const dw2=180,dh2=dw2*f.denImg.naturalHeight/f.denImg.naturalWidth;
          const bob=Math.sin(now/700+dd.x*0.01)*5;
          const lift=(bob+5)/10;
          ctx.save();ctx.globalAlpha=.3-lift*.12;ctx.fillStyle='#000';
          ctx.beginPath();ctx.ellipse(px,py+dh2*0.62,dw2*0.34*(1-lift*.12),dh2*0.15*(1-lift*.12),0,0,7);ctx.fill();ctx.restore();
          ctx.drawImage(f.denImg,px-dw2/2,py-dh2/2-bob,dw2,dh2);
        } else {ctx.font='34px serif';ctx.fillText('🕳️',px,py);}
        ctx.font='italic 12px Georgia';ctx.fillStyle='rgba(255,230,200,.92)';ctx.fillText(dd.name,px,py+58);
        if(!dd.defeated){ctx.font='30px serif';ctx.fillText(dd.icon,dd.beast.x-sx,dd.beast.y-sy);
          ctx.strokeStyle='rgba(255,120,80,.22)';ctx.setLineDash([6,6]);ctx.beginPath();
          ctx.arc(dd.beast.x-sx,dd.beast.y-sy,dd.aggro,0,7);ctx.stroke();ctx.setLineDash([]);}
        else{ctx.font='20px serif';ctx.fillText('✔️',px,py-30);}}});

    // дикие
    f.wilds.forEach(wd=>{if(wd.defeated)return;const px=wd.x-sx,py=wd.y-sy;
      if(px<-90||py<-90||px>vw+90||py>vh+90)return;
      drawSprite(wd.img,wd.x,wd.y,wd.heading,sx,sy,wd.rare?64:54,now,null,wd.rare);
      if(wd.rare&&(wd.slip||0)>0){ // прогресс слипстрима
        ctx.save();ctx.strokeStyle='#ffd76a';ctx.lineWidth=5;
        ctx.beginPath();ctx.arc(px,py,44,-Math.PI/2,-Math.PI/2+6.283*Math.min(1,wd.slip/3));ctx.stroke();
        ctx.font='italic 12px Georgia';ctx.fillStyle='#ffe9c0';ctx.fillText('держись рядом!',px,py+58);
        ctx.restore();}});

    // REWORK: опасные карманы — красноватое кольцо угрозы
    for(const pk of f.pockets){ const px=pk.x-sx,py=pk.y-sy;
      if(px<-pk.r-40||py<-pk.r-40||px>vw+pk.r+40||py>vh+pk.r+40)continue;
      ctx.save();ctx.setLineDash([10,10]);ctx.lineWidth=2.5;ctx.strokeStyle='rgba(255,90,70,.4)';
      ctx.beginPath();ctx.arc(px,py,pk.r,0,7);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.05;ctx.fillStyle='#ff5a46';ctx.fill();ctx.restore(); }
    // REWORK: воздушные потоки — пунктирное русло со стрелками
    for(const wl of f.winds){ const x1=wl.x1-sx,y1=wl.y1-sy,x2=wl.x2-sx,y2=wl.y2-sy;
      if(Math.max(x1,x2)<-100||Math.max(y1,y2)<-100||Math.min(x1,x2)>vw+100||Math.min(y1,y2)>vh+100)continue;
      ctx.save();ctx.globalAlpha=.35;ctx.strokeStyle='#bfe8ff';ctx.lineWidth=wl.w*0.5;
      ctx.lineCap='round';ctx.setLineDash([26,34]);ctx.lineDashOffset=-(now/28)%60;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.8;ctx.font='20px serif';
      ctx.fillText('💨',(x1+x2)/2,(y1+y2)/2);ctx.restore(); }
    // REWORK: найденные секретные зоны — мягкое свечение
    for(const sz of f.secrets){ if(!sz.found)continue; const px=sz.x-sx,py=sz.y-sy;
      if(px<-160||py<-160||px>vw+160||py>vh+160)continue;
      ctx.save();ctx.globalAlpha=.25+Math.sin(now/400)*.08;
      const g2=ctx.createRadialGradient(px,py,10,px,py,sz.r);
      g2.addColorStop(0,'#7ce8d0');g2.addColorStop(1,'rgba(124,232,208,0)');
      ctx.fillStyle=g2;ctx.beginPath();ctx.arc(px,py,sz.r,0,7);ctx.fill();ctx.restore(); }
    // REWORK: элитные стражи
    f.elites.forEach(ee=>{if(ee.defeated)return;const px=ee.x-sx,py=ee.y-sy;
      if(px<-90||py<-90||px>vw+90||py>vh+90)return;
      drawSprite(ee.img,ee.x,ee.y,ee.heading,sx,sy,62,now,null,true);
      ctx.save();ctx.strokeStyle='rgba(216,180,255,.75)';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.arc(px,py,40,0,7);ctx.stroke();
      ctx.font='italic 12px Georgia';ctx.fillStyle='#e8d6ff';ctx.fillText(ee.name,px,py+56);ctx.restore();});
    // REWORK: страж испытания у портала
    if(f.trialEnt){ const te=f.trialEnt, px=te.x-sx, py=te.y-sy;
      if(px>-120&&py>-120&&px<vw+120&&py<vh+120){
        if(te.defeated){ctx.font='26px serif';ctx.fillText('🏆',px,py);}
        else{ const pulse=1+Math.sin(now/260)*0.1;
          ctx.save();ctx.globalAlpha=.85;ctx.font=(46*pulse)+'px serif';ctx.fillText(te.icon,px,py);
          ctx.font='italic 13px Georgia';ctx.fillStyle='#ffd9b0';ctx.fillText(te.name+' — страж портала',px,py+42);
          ctx.strokeStyle='rgba(255,120,80,.35)';ctx.setLineDash([6,6]);ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(px,py,60,0,7);ctx.stroke();ctx.setLineDash([]);ctx.restore(); } } }

    // грозы: видимые фазы
    f.storms.forEach(s=>{const px=s.x-sx,py=s.y-sy;if(px<-140||py<-140||px>vw+140||py>vh+140)return;
      const warn=s.ph>2.6&&s.ph<=3.6, strike=s.ph>3.6;
      ctx.save();ctx.translate(px,py);ctx.rotate(Math.sin(s.a)*.15);
      ctx.globalAlpha=strike?1:(warn?.9:.55);
      ctx.font=(s.r*1.1)+'px serif';ctx.fillText('⛈️',0,0);ctx.restore();
      if(warn){ // предупреждение: пунктирное кольцо растёт
        const k=(s.ph-2.6);
        ctx.save();ctx.strokeStyle='rgba(255,230,120,'+(0.4+k*0.5)+')';ctx.lineWidth=3;
        ctx.setLineDash([8,8]);ctx.beginPath();ctx.arc(px,py,s.r*.8,0,7);ctx.stroke();ctx.setLineDash([]);ctx.restore();
      } else if(strike){ // разряд!
        ctx.save();ctx.globalAlpha=.75;ctx.fillStyle='rgba(255,240,150,.35)';
        ctx.beginPath();ctx.arc(px,py,s.r*.8,0,7);ctx.fill();
        ctx.font=(s.r*.9)+'px serif';ctx.fillText('⚡',px,py);ctx.restore();
      }
      ctx.globalAlpha=1;});

    // след
    dg.trail.forEach(p=>{const px=p.x-sx,py=p.y-sy,a=(1-p.t/0.5);
      ctx.globalAlpha=a*.5;ctx.fillStyle=trailCol;
      ctx.beginPath();ctx.arc(px,py,7*a+2,0,7);ctx.fill();});
    ctx.globalAlpha=1;

    // игрок: нарисованный PNG-спрайт, если загрузился, иначе SVG
    const pimg=(f.sprPng&&f.sprPng.complete&&f.sprPng.naturalWidth)?f.sprPng:f.sprSvg;
    const mf=morphById(f.d.morph).filter;
    if(mf&&mf!=='none'&&'filter' in ctx)ctx.filter=mf;
    drawSprite(pimg,dg.x,dg.y,dg.heading,sx,sy,74,now,dg,false);
    if('filter' in ctx)ctx.filter='none';

    // всплывашки
    ctx.font='bold 17px Georgia';ctx.textAlign='center';
    f.floats=f.floats.filter(fl=>(fl.t+=dt)<1.4);
    f.floats.forEach(fl=>{ctx.globalAlpha=1-fl.t/1.4;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=3;ctx.fillStyle='#fff';
      ctx.strokeText(fl.txt,fl.x-sx,fl.y-sy-30-fl.t*28);ctx.fillText(fl.txt,fl.x-sx,fl.y-sy-30-fl.t*28);});
    ctx.globalAlpha=1;

    // REWORK: миникарта — отметить исследованную клетку, перерисовать раз в 0.2с (перф)
    {const n=f.mgN, gx=Math.min(n-1,Math.max(0,(dg.x/W*n)|0)), gy=Math.min(n-1,Math.max(0,(dg.y/H*n)|0));
     f.mgrid[gy*n+gx]=1;
     if(gx>0)f.mgrid[gy*n+gx-1]=1; if(gx<n-1)f.mgrid[gy*n+gx+1]=1;
     if(gy>0)f.mgrid[(gy-1)*n+gx]=1; if(gy<n-1)f.mgrid[(gy+1)*n+gx]=1;
     f._miniT-=dt; if(f._miniT<=0){f._miniT=0.2;drawMini();}}
  }
  f.raf=requestAnimationFrame(t=>{last=t;frame(t);});
}

/* ===== ЗАВЕРШЕНИЕ ПОЛЁТА ===== */
function finishFlight(portalDone){
  const f=flight; if(!f||f.ended)return;
  f.ended=true; f.paused=true;
  const fs=$('#flightFs'); if(!fs){exitFlight();return;}
  // финальный опыт (+ бонус за портал)
  let xp=rnd(f.region.xp[0],f.region.xp[1]);
  let bonus=0;
  if(portalDone){
    xp=Math.round(xp*1.5);
    bonus=rnd(f.region.gold[0],f.region.gold[1])*2;
    S.gold+=bonus;f.stats.gold+=bonus;
    f.d.happy=Math.min(HAPPY_MAX,(f.d.happy||0)+1);
  }
  const leveled=grantXp(f.d,xp);f.stats.xp+=xp;
  questEvent('explore',3);persist();renderLedger();
  const s=f.stats;
  // REWORK: сводка забега — время, глубина, взятые усиления (сбрасываются)
  const runDur=f.run?Math.round((Date.now()-f.run.t0)/1000):0;
  const durTxt=Math.floor(runDur/60)+':'+String(runDur%60).padStart(2,'0');
  const rows=[
    ['🪙','Золота добыто',s.gold+(bonus?` <span style="color:var(--gold)">(+${bonus} за портал)</span>`:'')],
    ['🥚','Яиц найдено',s.eggs],
    ['📿','Реликвий найдено',s.relics],
    ['⚔️','Побед в стычках',s.beasts],
    ['⭐','Опыта получено',s.xp+(leveled?' · <span style="color:var(--gold)">новый уровень!</span>':'')],
    ['⏱️','Длительность забега',durTxt],
  ];
  if(f.run&&f.run.boons.length)rows.push(['🔮','Усиления забега',f.run.boons.join(' ')+' <span style="opacity:.6">(истекли)</span>']);
  const overlay=document.createElement('div');
  overlay.className='flight-end';
  overlay.innerHTML=`
    <div class="flight-end-card">
      <div class="flight-end-title">${portalDone?'⛩️ Странствие пройдено!':'🏁 Полёт завершён!'}</div>
      <div class="flight-end-sub">${dragonName(f.d)} вернулся из странствия по землям «${f.region.biome}»</div>
      <div class="flight-end-stats">
        ${rows.map(r=>`<div class="fe-row"><span class="fe-ic">${r[0]}</span><span class="fe-label">${r[1]}</span><span class="fe-val">${r[2]}</span></div>`).join('')}
      </div>
      <div class="flight-end-btns">
        <button class="btn" id="feMap">🗺️ К выбору земель</button>
        <button class="btn ghost" id="feHub">🏠 На главную</button>
      </div>
    </div>`;
  fs.appendChild(overlay);
  $('#feMap').onclick=()=>{exitFlight();switchView('explore');};
  $('#feHub').onclick=()=>{exitFlight();switchView('hub');};
}

/* выход из полноэкранного полёта */
function exitFlight(){
  const f=flight;
  if(f){if(f.raf)cancelAnimationFrame(f.raf);if(f.ac)f.ac.abort();}
  flight=null;
  document.body.classList.remove('flight-active');
  const fs=$('#flightFs');if(fs){fs.style.display='none';fs.innerHTML='';}
  renderAll();
  renderMap();
}
