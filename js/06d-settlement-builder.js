/* Draconis 3.0 — развивающееся поселение: размещение, таймеры и уровни. */
'use strict';

const HUB2_PLOTS=[
  {id:'p01',x:20.5,y:23.8},{id:'p02',x:50,y:23.8},{id:'p03',x:79.5,y:23.8},
  {id:'p04',x:20.5,y:39.2},{id:'p05',x:50,y:39.2},{id:'p06',x:79.5,y:39.2},
  {id:'p07',x:20.5,y:56.7,starter:true},{id:'p08',x:50,y:56.7,starter:true},{id:'p09',x:79.5,y:56.7,starter:true},
  {id:'p10',x:20.5,y:74.7},{id:'p11',x:50,y:74.7},{id:'p12',x:79.5,y:74.7}
];
const HUB2_DECO=[
  {i:0,x:38,y:30},{i:1,x:62,y:30},{i:2,x:38,y:47},{i:3,x:62,y:47},
  {i:4,x:38,y:65},{i:5,x:62,y:65},{i:6,x:38,y:82.5,reserve:true},{i:7,x:62,y:82.5,reserve:true}
];
const HUB2_BUILDINGS={
  lair:{name:'Логово',desc:'Дом и место отдыха твоей стаи.',icon:'hub_lair',view:'lair',max:5,build:10,cost:{gold:0,dust:0}},
  hatch:{name:'Гнездо',desc:'Тёплое место для драконьих яиц.',icon:'hub_hatch',view:'hatch',max:5,build:15,cost:{gold:50,dust:0}},
  explore:{name:'Портал странствий',desc:'Открывает новые миры и глубины.',icon:'hub_explore',view:'explore',max:8,build:20,cost:{gold:100,dust:0}},
  forge:{name:'Кузница',desc:'Ковка и усиление реликвий.',icon:'hub_forge',view:'forge',max:5,build:30,cost:{gold:300,dust:5}},
  spire:{name:'Шпиль Мироздания',desc:'Древо способностей дракона.',icon:'hub_spire',view:'spire',max:5,build:60,cost:{gold:500,dust:10}},
  roost:{name:'Гнездилище рода',desc:'Наследование и разведение.',icon:'hub_roost',view:'roost',max:5,build:60,cost:{gold:700,dust:15}},
  codex:{name:'Кодекс',desc:'История открытий и легенд.',icon:'hub_codex',view:'codex',max:5,build:30,cost:{gold:150,dust:0}},
  arena:{name:'Турнирная арена',desc:'Дружеские бои и испытания.',icon:'hub_arena',view:'arena',max:5,build:30,cost:{gold:200,dust:0}},
  treasury:{name:'Сокровищница',desc:'Сундуки, подарки и коллекции.',icon:'hub_treasury',view:'treasury',max:5,build:60,cost:{gold:400,dust:5}},
  market:{name:'Рынок',desc:'Ключи, обмен и редкий декор.',icon:'hub_market',view:'market',max:5,build:120,cost:{gold:1000,dust:0}},
  decor:{name:'Мастерская украшений',desc:'Оформление острова.',icon:'hub_decor',view:'decor',max:5,build:60,cost:{gold:350,dust:5}},
  profile:{name:'Зал хранителя',desc:'Профиль, достижения и сохранение.',icon:'hub_profile',view:'profile',max:5,build:180,cost:{gold:1200,dust:20}}
};
const HUB2_UPGRADE_SECONDS=[0,0,30,60,180,300,600,600,600];
let hub2SelectedPlot=null,hub2SelectedBuilding=null,hub2Tick=null,hub2TasksOpen=false;
const HUB2_ART_BUILDINGS=new Set(['lair','hatch','explore','forge','spire','roost','codex','arena','treasury','market','decor','profile']);

function hub2VisualTier(id,level){
  if(id==='explore')return level>=8?5:level>=6?4:level>=4?3:level>=2?2:1;
  return Math.max(1,Math.min(5,level||1));
}
function hub2BuildingArt(d,b){
  const marker=`images/ui/hub/${d.icon}.webp`;
  if(!HUB2_ART_BUILDINGS.has(b.buildingId))return `<img class="hub2-marker" src="${marker}" alt="">`;
  const tier=hub2VisualTier(b.buildingId,b.level);
  const art=`images/hub/buildings/building_${b.buildingId}_l${tier}.webp`;
  const construction=(b.state==='building'||b.state==='upgrading')
    ?'<img class="hub2-construction" src="images/hub/buildings/construction_overlay.webp" alt="">':'';
  return `<img class="hub2-building-art" src="${art}" alt="" onerror="this.onerror=null;this.className='hub2-marker';this.src='${marker}'">${construction}`;
}

function hub2Theme(){
  if(['forest','lava','frost'].includes(S.settlementTheme))return S.settlementTheme;
  const d=(S.dragons||[])[0],el=d&&speciesById(d.id).el;
  return S.settlementTheme=el==='fire'?'lava':el==='frost'?'frost':'forest';
}
function hub2Ensure(){
  if(!S.hubBuildings||typeof S.hubBuildings!=='object')S.hubBuildings={};
  if(!S.hubDecorations||typeof S.hubDecorations!=='object')S.hubDecorations=Object.assign({},S.decorations||{});
  hub2Theme(); hub2RefreshQueue();
}
function hub2Has(id){return Object.values(S.hubBuildings||{}).some(b=>b&&b.buildingId===id);}
function hub2MaxLevel(){return (S.dragons||[]).reduce((m,d)=>Math.max(m,d.level||1),1);}
function hub2Unlock(id){
  if(id==='lair')return {ok:true};
  if(!hub2Has('lair'))return {ok:false,why:'Сначала построй Логово'};
  if(id==='hatch')return (typeof eggCount==='function'?eggCount():0)>0?{ok:true}:{ok:false,why:'Получи первое яйцо'};
  if(id==='explore')return {ok:true};
  if(id==='forge')return hub2MaxLevel()>=3?{ok:true}:{ok:false,why:'Дракон 3-го уровня'};
  if(id==='spire')return hub2MaxLevel()>=5?{ok:true}:{ok:false,why:'Дракон 5-го уровня'};
  if(id==='roost')return hub2MaxLevel()>=8?{ok:true}:{ok:false,why:'Дракон 8-го уровня'};
  if(id==='codex')return Object.keys(S.discovered||{}).length?{ok:true}:{ok:false,why:'Сделай первое открытие'};
  if(id==='arena')return S.firstHour&&S.firstHour.phase==='first_flight'?{ok:false,why:'Заверши первое странствие'}:{ok:true};
  if(id==='treasury')return (S.chestReady||(typeof chestCount==='function'&&chestCount()>0))?{ok:true}:{ok:false,why:'Получи сундук или подарок'};
  if(id==='market')return (hub2MaxLevel()>=12||(S.gold||0)>=1000)?{ok:true}:{ok:false,why:'Дракон 12-го уровня или 1 000 золота'};
  if(id==='decor')return (S.decorOwned||[]).length?{ok:true}:{ok:false,why:'Получи первое украшение'};
  return {ok:(S.dragons||[]).length>0,why:'Заверши знакомство с драконом'};
}
function hub2Available(){
  return Object.keys(HUB2_BUILDINGS).filter(id=>!hub2Has(id)&&hub2Unlock(id).ok);
}
function hub2Format(ms){
  const s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60),r=s%60;
  return m?`${m}:${String(r).padStart(2,'0')}`:`${r} сек`;
}
function hub2RefreshQueue(){
  const q=S.hubBuildQueue;if(!q)return;
  const b=S.hubBuildings[q.plotId];if(!b){S.hubBuildQueue=null;return;}
  if(Date.now()>=(q.completesAt||0)&&b.state!=='ready')b.state='ready';
}
function hub2StartBuild(plotId,id){
  const d=HUB2_BUILDINGS[id],u=hub2Unlock(id);
  if(!d||!u.ok||S.hubBuildQueue||S.hubBuildings[plotId])return;
  if((S.gold||0)<d.cost.gold||(S.dust||0)<d.cost.dust){toast('Не хватает ресурсов для строительства.');return;}
  S.gold-=d.cost.gold;S.dust-=d.cost.dust;
  const now=Date.now(),end=now+d.build*1000;
  const level=id==='forge'?3:1;
  S.hubBuildings[plotId]={buildingId:id,level,state:'building',startedAt:now,completesAt:end};
  S.hubBuildQueue={plotId,buildingId:id,action:'build',startedAt:now,completesAt:end};
  hub2SelectedPlot=hub2SelectedBuilding=null;persist();renderLedger();renderHub();
}
function hub2UpgradeData(plotId){
  const b=S.hubBuildings[plotId],d=b&&HUB2_BUILDINGS[b.buildingId];if(!b||!d)return null;
  let level=b.level||1,next=level+1,cost={gold:Math.round(250*Math.pow(2,Math.max(0,level-1))),dust:level>=2?(level-1)*15:0},boss=0;
  if(b.buildingId==='lair'){const row=typeof LAIR_LEVELS!=='undefined'&&LAIR_LEVELS.find(x=>x.lvl===next);if(!row)return null;cost=row.cost;boss=cost.boss||0;}
  if(b.buildingId==='explore'){if(level>=PORTAL_MAX)return null;cost=portalCost(level);}
  if(b.buildingId==='forge'){if(level>=SMITHY_MAX)return null;cost=smithyCost(level);}
  if(next>d.max)return null;
  const ok=(S.gold||0)>=cost.gold&&(S.dust||0)>=(cost.dust||0)&&(!boss||bossesBeatenCount()>=boss);
  return {level,next,cost,boss,ok,seconds:HUB2_UPGRADE_SECONDS[Math.min(next,HUB2_UPGRADE_SECONDS.length-1)]||600};
}
function hub2StartUpgrade(plotId){
  if(S.hubBuildQueue)return;
  const b=S.hubBuildings[plotId],up=hub2UpgradeData(plotId);if(!b||!up||!up.ok)return;
  S.gold-=up.cost.gold;S.dust-=(up.cost.dust||0);
  const now=Date.now(),end=now+up.seconds*1000;
  b.state='upgrading';b.startedAt=now;b.completesAt=end;
  S.hubBuildQueue={plotId,buildingId:b.buildingId,action:'upgrade',targetLevel:up.next,startedAt:now,completesAt:end};
  persist();renderLedger();renderHub();
}
function hub2Claim(plotId){
  const q=S.hubBuildQueue,b=S.hubBuildings[plotId];if(!q||q.plotId!==plotId||!b||b.state!=='ready')return;
  if(q.action==='upgrade'){
    b.level=q.targetLevel;
    if(b.buildingId==='lair')S.lairLevel=b.level;
    if(b.buildingId==='explore')S.portalLevel=b.level;
    if(b.buildingId==='forge')S.forgeLevel=b.level;
  }
  b.state='active';b.startedAt=0;b.completesAt=0;S.hubBuildQueue=null;
  if(q.action==='build'&&q.buildingId==='lair')toast('🏡 Логово готово! Теперь у дракона есть дом.');
  else toast(q.action==='build'?'✨ Постройка готова!':'⬆️ Улучшение завершено!');
  persist();renderLedger();renderHub();
}
function hub2Open(id){
  const d=HUB2_BUILDINGS[id];if(!d)return;
  if(id==='treasury'&&typeof openTreasury==='function')return openTreasury();
  if(id==='market'&&typeof openMarket==='function')return openMarket();
  if(id==='decor'&&typeof openDecorManager==='function')return openDecorManager();
  if(typeof switchView==='function')switchView(d.view);
}
function hub2Sheet(){
  if(!hub2SelectedPlot)return '';
  const occupied=S.hubBuildings[hub2SelectedPlot];
  if(occupied){
    const d=HUB2_BUILDINGS[occupied.buildingId],up=hub2UpgradeData(hub2SelectedPlot);
    if(occupied.state==='ready')return `<section class="hub2-sheet"><b>${d.name} готово</b><p>Строители закончили работу.</p><button data-hub2-claim="${hub2SelectedPlot}">✓ Открыть</button><button class="ghost" data-hub2-close>Закрыть</button></section>`;
    if(occupied.state==='building'||occupied.state==='upgrading')return `<section class="hub2-sheet"><b>${occupied.state==='building'?'Строится':'Улучшается'}: ${d.name}</b><p>Осталось <span data-hub2-time>${hub2Format(occupied.completesAt-Date.now())}</span></p><button class="ghost" data-hub2-close>Закрыть</button></section>`;
    return `<section class="hub2-sheet"><b>${d.name} · ур.${occupied.level}</b><p>${d.desc}</p><div class="hub2-sheet-actions"><button data-hub2-open="${occupied.buildingId}">Войти</button>${up?`<button ${up.ok&&!S.hubBuildQueue?'':'disabled'} data-hub2-up="${hub2SelectedPlot}">⬆ Улучшить · ${up.cost.gold}🪙${up.cost.dust?' + '+up.cost.dust+'✦':''}</button>`:''}<button class="ghost" data-hub2-close>Закрыть</button></div>${up&&up.boss?`<small>Требуется побед: ${up.boss}</small>`:''}</section>`;
  }
  const ids=hub2Available();
  if(!hub2Has('lair')&&!HUB2_PLOTS.find(p=>p.id===hub2SelectedPlot).starter)return `<section class="hub2-sheet"><b>Первое Логово</b><p>Выбери одну из трёх подсвеченных площадок.</p><button class="ghost" data-hub2-close>Понятно</button></section>`;
  if(hub2SelectedBuilding){
    const d=HUB2_BUILDINGS[hub2SelectedBuilding];
    return `<section class="hub2-sheet"><b>${d.name}</b><p>${d.desc}</p><p>${d.cost.gold?d.cost.gold+' 🪙':'Бесплатно'}${d.cost.dust?' + '+d.cost.dust+' ✦':''} · ${d.build} сек</p><div class="hub2-sheet-actions"><button data-hub2-build="${hub2SelectedBuilding}">Построить здесь</button><button class="ghost" data-hub2-other>Другое здание</button><button class="ghost" data-hub2-close>Другое место</button></div></section>`;
  }
  const locked=Object.keys(HUB2_BUILDINGS).filter(id=>!hub2Has(id)&&!hub2Unlock(id).ok).slice(0,3);
  return `<section class="hub2-sheet"><b>Что построить?</b><div class="hub2-choices">${ids.map(id=>{const d=HUB2_BUILDINGS[id];return `<button data-hub2-pick="${id}"><img src="images/ui/hub/${d.icon}.webp" alt=""><span><b>${d.name}</b><small>${d.build} сек</small></span></button>`;}).join('')||'<p>Сейчас нет доступных построек.</p>'}</div>${locked.length?`<div class="hub2-locks">${locked.map(id=>`<small>🔒 ${HUB2_BUILDINGS[id].name}: ${hub2Unlock(id).why}</small>`).join('')}</div>`:''}<button class="ghost" data-hub2-close>Закрыть</button></section>`;
}
function hub2Tasks(){
  if(!hub2TasksOpen)return '';
  const reward=typeof chestReward==='function'?chestReward():null;
  const weekly=typeof ensureWeekly==='function'?ensureWeekly():null;
  const wd=weekly&&typeof weeklyDef==='function'?weeklyDef():null;
  return `<aside class="hub2-tasks"><header><b>Сегодня</b><button data-hub2-tasks-close aria-label="Закрыть">×</button></header>
    <section><h3>🎁 Подарок дня</h3>${S.chestReady?`<button id="hubDailyClaim">Забрать${reward?' · '+rewardText(reward):''}</button>`:'<p>✓ Подарок уже получен.</p>'}</section>
    ${weekly&&wd?`<section><h3>🗺️ Недельная экспедиция</h3><p>${weekly.step+1}/5 · ${wd.name} · ${weekly.progress}/${wd.goal}</p>${weekly.progress>=wd.goal?'<button id="hubWeeklyClaim">Завершить этап</button>':''}</section>`:''}
    <section><h3>✨ Три дела</h3>${typeof hubQuestRows==='function'?hubQuestRows():''}</section>
  </aside>`;
}
function renderHub(){
  hub2Ensure();
  const wrap=$('#hubWrap');if(!wrap)return;
  const theme=hub2Theme(),first=!hub2Has('lair');
  const plots=HUB2_PLOTS.map(p=>{
    const b=S.hubBuildings[p.id],d=b&&HUB2_BUILDINGS[b.buildingId],selected=hub2SelectedPlot===p.id;
    const starter=first&&p.starter,blocked=first&&!p.starter;
    let inner='<span class="hub2-plus">＋</span>',cls='free',label='Свободная строительная площадка';
    if(blocked){inner='<span class="hub2-lock">🔒</span>';cls='locked';label='Сначала выбери место для Логова';}
    if(b){
      cls=b.state;label=d.name;
      const q=S.hubBuildQueue&&S.hubBuildQueue.plotId===p.id?S.hubBuildQueue:null;
      const up=b.state==='active'&&hub2UpgradeData(p.id);
      inner=`${hub2BuildingArt(d,b)}<span class="hub2-level">ур.${b.level}</span>${q?`<span class="hub2-status">${b.state==='ready'?'✓':`⌛ <i data-hub2-time>${hub2Format(q.completesAt-Date.now())}</i>`}</span>`:up&&up.ok&&!S.hubBuildQueue?'<span class="hub2-up">⬆</span>':''}`;
    }
    return `<button class="hub2-plot ${cls}${selected?' selected':''}${starter?' starter':''}" data-hub2-plot="${p.id}" style="left:${p.x}%;top:${p.y}%" aria-label="${label}">${inner}</button>`;
  }).join('');
  const placed=S.hubDecorations||{};
  const decos=HUB2_DECO.filter(x=>!x.reserve||Object.keys(placed).length>=6).map(s=>{
    const id=placed[s.i]||((S.decorations||{})[s.i]),d=id&&decorById(id);
    return `<button class="hub2-deco${d?' filled':''}" data-hub2-deco="${s.i}" style="left:${s.x}%;top:${s.y}%" aria-label="${d?d.name:'Место для украшения'}">${d?d.icon:'◇'}</button>`;
  }).join('');
  wrap.innerHTML=`<div class="hub2-stage theme-${theme}">
    <img class="hub2-bg" src="images/hub/hub_${theme}.webp?v=311" alt="Остров поселения">
    <header class="hub2-title"><span>${theme==='lava'?'🔥':theme==='frost'?'❄️':'🍃'}</span><b>${S.settlement||'Драконьи земли'}</b></header>
    ${plots}${decos}
    <button class="hub2-tasks-btn" id="hub2TasksBtn">Сегодня${(S.quests||[]).some(q=>q.done&&!q.claimed)||S.chestReady?' •':''}</button>
    ${first?'<div class="hub2-vella"><b>Велла</b><span>Выбери место для первого Логова</span></div>':''}
    ${hub2Sheet()}
    ${hub2Tasks()}
  </div>`;
  wrap.querySelectorAll('[data-hub2-plot]').forEach(el=>el.onclick=()=>{const id=el.dataset.hub2Plot,b=S.hubBuildings[id];if(first&&!HUB2_PLOTS.find(p=>p.id===id).starter){toast('Выбери одну из трёх подсвеченных площадок.');return;}hub2SelectedPlot=id;hub2SelectedBuilding=first?'lair':null;if(b&&b.state==='ready')hub2Claim(id);else renderHub();});
  wrap.querySelectorAll('[data-hub2-pick]').forEach(el=>el.onclick=()=>{hub2SelectedBuilding=el.dataset.hub2Pick;renderHub();});
  wrap.querySelectorAll('[data-hub2-build]').forEach(el=>el.onclick=()=>hub2StartBuild(hub2SelectedPlot,el.dataset.hub2Build));
  wrap.querySelectorAll('[data-hub2-up]').forEach(el=>el.onclick=()=>hub2StartUpgrade(el.dataset.hub2Up));
  wrap.querySelectorAll('[data-hub2-claim]').forEach(el=>el.onclick=()=>hub2Claim(el.dataset.hub2Claim));
  wrap.querySelectorAll('[data-hub2-open]').forEach(el=>el.onclick=()=>hub2Open(el.dataset.hub2Open));
  wrap.querySelectorAll('[data-hub2-other]').forEach(el=>el.onclick=()=>{hub2SelectedBuilding=null;renderHub();});
  wrap.querySelectorAll('[data-hub2-close]').forEach(el=>el.onclick=()=>{hub2SelectedPlot=hub2SelectedBuilding=null;renderHub();});
  wrap.querySelectorAll('[data-hub2-deco]').forEach(el=>el.onclick=()=>{S.decoSlot=+el.dataset.hub2Deco;if(typeof openDecorManager==='function')openDecorManager();});
  const tb=$('#hub2TasksBtn');if(tb)tb.onclick=()=>{hub2TasksOpen=!hub2TasksOpen;renderHub();};
  wrap.querySelectorAll('[data-hub2-tasks-close]').forEach(el=>el.onclick=()=>{hub2TasksOpen=false;renderHub();});
  const daily=$('#hubDailyClaim');if(daily)daily.onclick=()=>{claimChest();renderHub();};
  const weekly=$('#hubWeeklyClaim');if(weekly)weekly.onclick=()=>{claimWeekly();renderHub();};
  wrap.querySelectorAll('[data-hub-claim]').forEach(el=>el.onclick=()=>{claimQuest(el.dataset.hubClaim);renderHub();});
  clearTimeout(hub2Tick);
  if(S.hubBuildQueue)hub2Tick=setTimeout(()=>{hub2RefreshQueue();renderHub();},1000);
}
