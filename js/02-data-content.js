/* ============================================================
   02-data-content.js — ДАННЫЕ КОНТЕНТА: сундуки/ключи/украшения, свитки легенд, сокровищница, боссы, точки полёта, артефакты, константы кузницы
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ======================= СУНДУКИ, КЛЮЧИ, УКРАШЕНИЯ =======================
   3 уровня сундуков по глубине биома. Открываются ключом (мини-игра подбора)
   или в кузне за ресурсы. Лут: золото, пыль, артефакты, украшения хаба, яйца. */
const CHEST_TYPES=[
  {tier:1, name:'Простой сундук', icon:'📦', zones:1, keyName:'Простой ключ',  keyIcon:'🔑',
   forgeCost:{gold:120, dust:15}},
  {tier:2, name:'Крепкий сундук', icon:'🧰', zones:2, keyName:'Резной ключ',   keyIcon:'🗝️',
   forgeCost:{gold:480, dust:30}},
  {tier:3, name:'Древний сундук', icon:'⚱️', zones:3, keyName:'Древний ключ',  keyIcon:'🔐',
   forgeCost:{gold:1080, dust:45}},
];
const chestType=tier=>CHEST_TYPES.find(c=>c.tier===tier)||CHEST_TYPES[0];

// украшения хаба: ставятся в декоративные слоты на карте поселения
const DECORATIONS=[
  {id:'statue',   name:'Драконья статуя', icon:'🗿', rarity:2, desc:'Каменный страж поселения.'},
  {id:'bonfire',  name:'Вечный костёр',   icon:'🔥', rarity:1, desc:'Тёплый огонь, что не гаснет.'},
  {id:'banner',   name:'Родовое знамя',   icon:'🚩', rarity:1, desc:'Стяг твоего рода драконоводов.'},
  {id:'crystal',  name:'Парящий кристалл',icon:'💎', rarity:3, desc:'Мерцает магией древних миров.'},
  {id:'fountain', name:'Лунный фонтан',   icon:'⛲', rarity:2, desc:'Вода светится в сумерках.'},
  {id:'tree',     name:'Древо жизни',     icon:'🌳', rarity:2, desc:'Древнее дерево, полное силы.'},
  {id:'obelisk',  name:'Рунный обелиск',  icon:'🗼', rarity:3, desc:'Испещрён светящимися рунами.'},
  {id:'lantern',  name:'Звёздный фонарь', icon:'🏮', rarity:1, desc:'Ловит и хранит звёздный свет.'},
  {id:'hoard',    name:'Груда сокровищ',  icon:'💰', rarity:3, desc:'Драконье золото горой.'},
  {id:'shrine',   name:'Древний алтарь',  icon:'⛩️', rarity:3, desc:'Святилище давно ушедших.'},
  // трофеи владык миров (только за победу над боссами)
  {id:'trophy_fire',  name:'Пламенный трофей', icon:'🏆', rarity:4, desc:'Голова Владыки Пламени над воротами.', trophy:true},
  {id:'trophy_venom', name:'Трофей Топей',     icon:'🏆', rarity:4, desc:'Жвала Матери Топей на пьедестале.', trophy:true},
  {id:'trophy_frost', name:'Ледяной трофей',   icon:'🏆', rarity:4, desc:'Нерастающий рог Владыки Стужи.', trophy:true},
  {id:'trophy_storm', name:'Громовой трофей',  icon:'🏆', rarity:4, desc:'Осколок молнии Владыки Бурь.', trophy:true},
  {id:'trophy_shade', name:'Трофей Пустоты',   icon:'🏆', rarity:4, desc:'Беззвёздная чешуя Владыки Пустоты.', trophy:true},
];
const decorById=id=>DECORATIONS.find(d=>d.id===id);
/* ======================= СВИТКИ ЛЕГЕНД =======================
   Лор по мирам и биомам. Собираются в странствиях и из сундуков, хранятся в Кодексе.
   hint — подсказка к боссу/артефакту/механике (мягкая, необязательная). */
const LORE_SCROLLS=[
  /* ОГНЕННЫЙ МИР */
  {world:'emberreach', biome:1, n:1, title:'Пепел первых дней', text:'Когда мир был молод, драконы Карн-Вулака дышали таким жаром, что камень тёк рекой. Пепельные пустоши помнят их шаги.'},
  {world:'emberreach', biome:1, n:2, title:'Тлеющие клятвы', text:'Огненные драконы клянутся не словом, а искрой: угасшая клятва означает угасшего дракона. Оттого они верны до последнего уголька.'},
  {world:'emberreach', biome:1, n:3, title:'Дар Жароеда', text:'Древний Жароед оставил потомкам клык, что вечно тлеет. Говорят, из таких клыков кузнецы куют оружие, жалящее пламенем.', hint:'Клык Жароеда — оружие, усиливающее атаку.'},
  {world:'emberreach', biome:3, n:1, title:'Сердце спящего вулкана', text:'В самом ядре Карн-Вулака бьётся Магмовое Сердце. Тот, кто носит его, пьёт жизнь врага — но тяжесть его сковывает движения.', hint:'Магмовое Сердце (ядро огня): вампиризм ценой скорости.'},
  {world:'emberreach', biome:3, n:2, title:'Владыка пламени', text:'Глубже всех спит древний огненный владыка. Легенды шепчут: даже вечный огонь боится холода, что старше самого пламени.', hint:'Босс огня уязвим к ледяной стихии.'},

  /* ЯДОВИТЫЙ МИР */
  {world:'mirelot', biome:1, n:1, title:'Шёпот зелёных озёр', text:'Чащоба Зелёных Озёр дышит. Каждый лист, каждая капля тёмной воды знает имя чужака ещё до того, как он ступит под кроны.'},
  {world:'mirelot', biome:1, n:2, title:'Наследие грибницы', text:'Под топями раскинулась единая грибница — древнее любого дракона. Она помнит всё и делится памятью с теми, кто чтит её споры.'},
  {world:'mirelot', biome:1, n:3, title:'Идол гнили', text:'Болотные драконы вырезают идолов, источающих ядовитую дымку. Носящий такой идол становится быстрее и злее в бою.', hint:'Идол Гнили ускоряет и усиливает дракона.'},
  {world:'mirelot', biome:3, n:1, title:'Улей спор', text:'В сердце гнили живёт Корона Спор — живой венец, обостряющий чутьё до смертельной точности. Но он разъедает броню носителя.', hint:'Корона Спор (ядро яда): крит ценой защиты.'},
  {world:'mirelot', biome:3, n:2, title:'Матерь Топей', text:'Исполинская хозяйка болот не терпит огня в своих владениях. Но пламя — единственное, что заставляет её отступить.', hint:'Босс яда уязвим к огненной стихии.'},

  /* ЛЕДЯНОЙ МИР */
  {world:'glacior', biome:1, n:1, title:'Безмолвие пиков', text:'Пики Хладного Безмолвия хранят тишину столь глубокую, что рёв дракона тонет в ней, не родившись. Здесь ценят терпение.'},
  {world:'glacior', biome:1, n:2, title:'Вмёрзшие века', text:'В замёрзших озёрах виднеются тени древних существ. Лёд не убивает — он хранит, ожидая часа пробуждения.'},
  {world:'glacior', biome:1, n:3, title:'Осколок Вечнольда', text:'Льдина, что не тает даже в горне. Кузнецы вставляют её в доспех — и он хранит носителя от любого жара.', hint:'Осколок Вечнольда усиливает защиту и жизнь.'},
  {world:'glacior', biome:3, n:1, title:'Замёрзшая бездна', text:'На дне ледяного мира дремлет Корона Мерзлоты, хранящая бездонный запас маны. Но холод её сковывает прыть носителя.', hint:'Корона Мерзлоты (ядро льда): мана ценой скорости.'},
  {world:'glacior', biome:3, n:2, title:'Владыка стужи', text:'Древний ледяной владыка неуязвим для холода и стали. Лишь ярость пламени способна растопить его вечную броню.', hint:'Босс льда уязвим к огненной стихии.'},

  /* ШТОРМОВОЙ МИР */
  {world:'stormpeak', biome:1, n:1, title:'Песнь грозовых утёсов', text:'Парящие скалы Штормового мира поют под ветром. Драконы бури рождаются в раскате грома и живут, пока звучит их нота.'},
  {world:'stormpeak', biome:1, n:2, title:'Пойманная молния', text:'Умелые драконоводы ловят молнию в гребень-венец. Тот, кто носит Гребень Грозы, двигается стремительнее ветра.', hint:'Гребень Грозы усиливает прыть и атаку.'},
  {world:'stormpeak', biome:1, n:3, title:'Закон неба', text:'В Штормовом мире один закон: кто быстрее, тот и прав. Медлительность здесь равна поражению.'},
  {world:'stormpeak', biome:3, n:1, title:'Громовой трон', text:'На вершине бури стоит трон, а на нём — Клык Грозы. Он дарует сокрушительный крит, но лишает всякой защиты.', hint:'Клык Грозы (ядро бури): крит ценой защиты и жизни.'},
  {world:'stormpeak', biome:3, n:2, title:'Владыка бурь', text:'Повелитель гроз бьёт молнией трижды, а на четвёртый раз замирает, копя силу. В этот миг он беззащитен.', hint:'Босс бури замирает после трёх ударов — момент для ульты.'},

  /* ТЕНЕВОЙ МИР */
  {world:'voidedge', biome:1, n:1, title:'Сумеречный предел', text:'Там, где гаснет последний свет, начинается Беззвёздный Предел. Сюда идут лишь те, кто не боится потерять себя во тьме.'},
  {world:'voidedge', biome:1, n:2, title:'Латы безмолвия', text:'Тень можно соткать, как ткань. Латы Безмолвия глушат удары и скрывают носителя в самой ночи.', hint:'Латы Безмолвия усиливают защиту и жизнь.'},
  {world:'voidedge', biome:1, n:3, title:'Цена тьмы', text:'Тьма даёт силу, но берёт плату. Драконы теней сильнее всех — и одиноки более всех.'},
  {world:'voidedge', biome:3, n:1, title:'Беззвёздное ядро', text:'В сердце пустоты покоится Жнец Пустоты — коса из антисвета. Она пожирает жизнь и бьёт без промаха, но носитель беззащитен.', hint:'Жнец Пустоты (ядро тени): вампиризм и крит ценой защиты.'},
  {world:'voidedge', biome:3, n:2, title:'Владыка пустоты', text:'Древнейший из всех, Владыка Пустоты питается тьмой. Лишь свет чистого пламени способен обжечь того, кто соткан из мрака.', hint:'Босс тени уязвим к огненной стихии.'},
];
function scrollId(s){ return s.world+'_b'+s.biome+'_'+s.n; }
function scrollsFound(){ if(!Array.isArray(S.scrolls))S.scrolls=[]; return S.scrolls; }
function hasScroll(s){ return scrollsFound().includes(scrollId(s)); }
function addScroll(scr){
  const id=scrollId(scr);
  if(!scrollsFound().includes(id)){ scrollsFound().push(id); return true; }
  return false;
}
// выдать случайный ещё не найденный свиток данного мира/биома (или любой из мира)
function grantScroll(worldId, biomeN){
  let pool=LORE_SCROLLS.filter(s=>s.world===worldId && !hasScroll(s));
  if(biomeN){ const exact=pool.filter(s=>s.biome===biomeN); if(exact.length) pool=exact; }
  if(!pool.length) return null; // все собраны
  const scr=pool[rnd(0,pool.length-1)];
  addScroll(scr);
  return scr;
}
// декоративные слоты на карте хаба (координаты в % от сцены)
const DECO_SLOTS=[
  {i:0, x:8,  y:52},
  {i:1, x:38, y:56},
  {i:2, x:60, y:52},
  {i:3, x:90, y:54},
  {i:4, x:24, y:92},
  {i:5, x:56, y:94},
];

// нормализация состояния (для старых сохранений)
function chestsArr(){ if(!Array.isArray(S.chests))S.chests=[]; return S.chests; }
function keysObj(){ if(!S.keys||typeof S.keys!=='object')S.keys={1:0,2:0,3:0}; return S.keys; }
function addChest(tier){ chestsArr().push({tier:Math.max(1,Math.min(3,tier))}); }
function addKey(tier){ const k=keysObj(); tier=Math.max(1,Math.min(3,tier)); k[tier]=(k[tier]||0)+1; }
function keyCount(tier){ return keysObj()[tier]||0; }
function chestCount(){ return chestsArr().length; }

// выбор украшения по редкости (глубже сундук — выше шанс редких)
function rollDecoration(tier){
  const pool=DECORATIONS.filter(d=>!d.trophy); // трофеи — только за владык
  const bias=[0,0.4,1.0,1.8][tier]||0.4;
  const adj=pool.map(d=>({d, w:Math.pow(bias, d.rarity-1)*100 * (tier>=3?d.rarity:1)}));
  const total=adj.reduce((a,b)=>a+b.w,0);
  let r=Math.random()*total;
  for(const x of adj){ if((r-=x.w)<=0) return x.d; }
  return pool[0];
}

// лут сундука по уровню; perfect=идеальный подбор даёт бонус
function rollChestLoot(tier, perfect){
  const out={gold:0, dust:0, items:[]};
  out.gold = rnd(60,120)*tier*tier;
  out.dust = rnd(10,20)*tier;
  if(perfect){ out.gold=Math.round(out.gold*1.5); out.dust=Math.round(out.dust*1.5); }
  // артефакт: шанс растёт с уровнем
  const artChance=[0,0.35,0.6,0.85][tier];
  if(Math.random()<artChance*(perfect?1.3:1)){
    let art;
    if(tier>=3 && Math.random()<(perfect?0.45:0.3)){
      // ядро: шанс на мировую легендарку
      const legs=ARTIFACTS.filter(a=>a.world);
      art=legs[rnd(0,legs.length-1)];
    } else art=weightedArtifact(Math.min(5,tier+1));
    const inst=addArtifact(art.id,1);
    out.items.push({type:'art', art});
  }
  // украшение: шанс растёт с уровнем
  const decoChance=[0,0.4,0.55,0.75][tier];
  if(Math.random()<decoChance*(perfect?1.25:1)){
    const deco=rollDecoration(tier);
    if(!S.decorOwned) S.decorOwned=[];
    S.decorOwned.push(deco.id);
    out.items.push({type:'deco', deco});
  }
  // ядро: изредка яйцо-ядро
  if(tier>=3 && Math.random()<(perfect?0.5:0.3)){
    const el=ELEMENTS_LIST[rnd(0,4)];
    addEgg(el,3);
    out.items.push({type:'egg', el});
  }
  // свиток легенды: шанс растёт с уровнем сундука
  const scrollChance=[0,0.25,0.4,0.6][tier];
  if(Math.random()<scrollChance*(perfect?1.3:1)){
    // из сундука — свиток случайного мира (сундук мог прийти откуда угодно)
    const worlds=['emberreach','mirelot','glacior','stormpeak','voidedge'];
    const scr=grantScroll(worlds[rnd(0,worlds.length-1)]);
    if(scr) out.items.push({type:'scroll', scr});
  }
  S.gold+=out.gold; S.dust+=out.dust;
  return out;
}

/* ===== ОТКРЫТИЕ СУНДУКОВ ===== */
// открыть сундук ключом через мини-игру подбора (N зон по уровню)
function openChestWithKey(chestIdx){
  const chest=chestsArr()[chestIdx]; if(!chest) return;
  const tier=chest.tier;
  if(keyCount(tier)<1){ toast('Нет подходящего ключа.'); return; }
  startLockpick(tier, (result)=>{
    // result: 'perfect' | 'ok' | 'jam'
    keysObj()[tier]--; // ключ расходуется
    chestsArr().splice(chestIdx,1);
    const perfect = result==='perfect';
    const loot=rollChestLoot(tier, perfect);
    showChestResult(tier, loot, result);
    persist(); renderLedger();
  });
}
// открыть сундук в кузне за ресурсы (без мини-игры, гарантированный базовый лут)
function openChestWithForge(chestIdx){
  const chest=chestsArr()[chestIdx]; if(!chest) return;
  const tier=chest.tier;
  const cost=chestType(tier).forgeCost;
  if(S.gold<cost.gold || S.dust<cost.dust){ toast(`Нужно ${cost.gold}🪙 и ${cost.dust}✦, чтобы вскрыть сундук в кузне.`); return; }
  S.gold-=cost.gold; S.dust-=cost.dust;
  chestsArr().splice(chestIdx,1);
  const loot=rollChestLoot(tier, false);
  showChestResult(tier, loot, 'forge');
  persist(); renderLedger();
}

// мини-игра подбора замка: N зон подряд (обобщение движка зон)
let lockpickState=null;
function startLockpick(tier, done){
  if(!arcadeEnabled()){ done('ok'); return; } // без аркады — обычное открытие
  const zones=chestType(tier).zones;
  const overlay=document.createElement('div');
  overlay.className='timing-overlay';
  overlay.innerHTML=`
    <div class="timing-card lockpick-card">
      <div class="timing-title">${chestType(tier).keyIcon} Подбор замка</div>
      <div class="timing-sub">Попади в зону в каждом из <b>${zones}</b> положений. Центр = идеальный подбор!</div>
      <div class="timing-bar" id="lpBar">
        <div class="timing-zone good"></div>
        <div class="timing-zone perfect"></div>
        <div class="timing-marker" id="lpMarker"></div>
      </div>
      <div class="lp-pins" id="lpPins">${Array.from({length:zones},(_,i)=>`<span class="lp-pin" id="lpPin${i}">🔒</span>`).join('')}</div>
      <div class="timing-btns">
        <button class="btn" id="lpHit">Подобрать!</button>
        <button class="btn ghost" id="lpSkip">Взломать грубо</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  // ширина/скорость зависят от уровня: глубже — уже и быстрее
  const goodW=[0,36,28,22][tier], perfW=[0,10,8,6][tier];
  const goodStart=50-goodW/2, goodEnd=50+goodW/2, perfStart=50-perfW/2, perfEnd=50+perfW/2;
  const speed=[0,1.6,2.1,2.6][tier];
  let pos=0,dir=1,raf=null,zone=0,perfectAll=true,anyHit=true;
  const marker=overlay.querySelector('#lpMarker');
  function tick(){ pos+=dir*speed; if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;} marker.style.left=pos+'%'; raf=requestAnimationFrame(tick); }
  tick();
  function cleanup(){ cancelAnimationFrame(raf); overlay.remove(); }
  overlay.querySelector('#lpHit').onclick=()=>{
    const pin=overlay.querySelector('#lpPin'+zone);
    if(pos>=perfStart&&pos<=perfEnd){ if(pin){pin.textContent='🔓';pin.classList.add('perfect');} }
    else if(pos>=goodStart&&pos<=goodEnd){ if(pin){pin.textContent='🔓';pin.classList.add('ok');} perfectAll=false; }
    else { if(pin){pin.textContent='🔒';pin.classList.add('miss');} perfectAll=false; anyHit=false; }
    zone++;
    if(zone>=zones){
      cleanup();
      done(perfectAll?'perfect':(anyHit?'ok':'jam'));
    } else { pos=0; dir=1; }
  };
  overlay.querySelector('#lpSkip').onclick=()=>{ cleanup(); done('jam'); };
}

// показать результат открытия сундука
function showChestResult(tier, loot, result){
  const ct=chestType(tier);
  const resultLabel = result==='perfect' ? '<span style="color:var(--gold)">💎 Идеальный подбор! Бонусный лут!</span>'
    : result==='jam' ? '<span style="color:var(--ink-dim)">Замок заело — открыт с базовым лутом.</span>'
    : result==='forge' ? '<span style="color:var(--ink-dim)">Вскрыт в кузне.</span>'
    : '<span style="color:var(--gold-soft)">Замок поддался!</span>';
  let items='';
  loot.items.forEach(it=>{
    if(it.type==='art') items+=`<div class="chest-item">${it.art.icon} <b>${it.art.name}</b> ${'★'.repeat(it.art.rarity)}</div>`;
    if(it.type==='deco') items+=`<div class="chest-item">${it.deco.icon} украшение <b>${it.deco.name}</b></div>`;
    if(it.type==='egg') items+=`<div class="chest-item">🥚 яйцо-ядро (${ELEMENTS[it.el].name})</div>`;
    if(it.type==='scroll') items+=`<div class="chest-item">📜 свиток «${it.scr.title}»</div>`;
  });
  toast(`<b>${ct.icon} ${ct.name} открыт!</b> ${resultLabel}<br>+${loot.gold}🪙 +${loot.dust}✦${items?'<br>'+items:''}`);
  // обновить открытую сокровищницу или хаб
  if(S._treasuryOpen) renderTreasury();
  else if($('#hub')&&$('#hub').classList.contains('on')) renderHub();
}

/* ===== СОКРОВИЩНИЦА (отдельный экран для сундуков) ===== */
function openTreasury(){ S._treasuryOpen=true; renderTreasury(); }
function closeTreasury(){ S._treasuryOpen=false; renderHub(); }
function renderTreasury(){
  const wrap=$('#hubWrap'); if(!wrap) return;
  const chests=chestsArr();
  const keyInv=[1,2,3].map(t=>`${chestType(t).keyIcon} ${chestType(t).keyName.split(' ')[0]}: <b>${keyCount(t)}</b>`).join(' · ');
  let list;
  if(!chests.length){
    list=`<div class="empty">Сундуков нет. Их находят в странствиях по мирам — чем глубже биом, тем богаче сундук.</div>`;
  } else {
    const rows=chests.map((c,i)=>{
      const ct=chestType(c.tier);
      const haveKey=keyCount(c.tier)>0;
      const fc=ct.forgeCost;
      const canForgeOpen=S.gold>=fc.gold&&S.dust>=fc.dust;
      return `<div class="chest-row">
        <span class="chest-ic">${ct.icon}</span>
        <span class="chest-name">${ct.name}<br><span class="chest-sub">${ct.zones} ${ct.zones===1?'замок':'замка'} · ${BIOME_TIERLABEL[c.tier].split(' · ')[0]}</span></span>
        <button class="btn ${haveKey?'':'ghost'} chest-key" data-open="${i}" ${haveKey?'':'disabled'}>${ct.keyIcon} Ключ${haveKey?` (${keyCount(c.tier)})`:' нет'}</button>
        <button class="btn ghost chest-forge" data-forge="${i}" ${canForgeOpen?'':'disabled'}>⚒️ ${fc.gold}🪙+${fc.dust}✦</button>
      </div>`;
    }).join('');
    list=`<div class="chest-list">${rows}</div>`;
  }
  wrap.innerHTML=`<div class="panel" style="margin:0">
    <div class="screen-bar" style="margin-top:0"><button class="home-btn" id="treasBack">← Поселение</button>
      <span class="screen-bar-title">🎁 Сокровищница</span></div>
    <p class="lede">Сундуки, добытые в странствиях. Открой ключом (подбор замка → лучший лут) или в кузне за ресурсы (наверняка).</p>
    <div class="chest-keys-inv">Ключи: ${keyInv}</div>
    ${list}
  </div>`;
  $('#treasBack').onclick=closeTreasury;
  wrap.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openChestWithKey(+b.dataset.open));
  wrap.querySelectorAll('[data-forge]').forEach(b=>b.onclick=()=>openChestWithForge(+b.dataset.forge));
}
/* ======================= БОССЫ МИРОВ (ЭНДГЕЙМ) =======================
   В ядре каждого мира (биом III) ждёт владыка. Требует дракона 100 ур.
   Слабость и механика подсказаны в свитках легенд. Победа = трофей + материал восхождения. */
const WORLD_BOSSES=[
  {world:'emberreach', id:'boss_fire',  name:'Владыка Пламени',   icon:'🔥', speciesBase:'pyrelord',
   weakTo:'frost', hpMult:2.2, atkMult:1.15,
   mech:null,
   trophyId:'trophy_fire',
   lore:'Даже вечный огонь боится холода, что старше самого пламени.'},
  {world:'mirelot', id:'boss_venom', name:'Матерь Топей',      icon:'🕸️', speciesBase:'blightfang',
   weakTo:'fire', hpMult:2.2, atkMult:1.15,
   mech:null,
   trophyId:'trophy_venom',
   lore:'Пламя — единственное, что заставляет её отступить.'},
  {world:'glacior', id:'boss_frost', name:'Владыка Стужи',     icon:'❄️', speciesBase:'permafrost',
   weakTo:'fire', hpMult:2.3, atkMult:1.1,
   mech:null,
   trophyId:'trophy_frost',
   lore:'Лишь ярость пламени способна растопить его вечную броню.'},
  {world:'stormpeak', id:'boss_storm', name:'Владыка Бурь',      icon:'⚡', speciesBase:'thundercall',
   weakTo:null, hpMult:2.4, atkMult:1.2,
   mech:'stall3',
   trophyId:'trophy_storm',
   lore:'Он бьёт трижды, а на четвёртый раз замирает — в этот миг он беззащитен.'},
  {world:'voidedge', id:'boss_shade', name:'Владыка Пустоты',   icon:'🌑', speciesBase:'worldserpent',
   weakTo:'fire', hpMult:2.5, atkMult:1.2,
   mech:'vamp',
   trophyId:'trophy_shade',
   lore:'Лишь свет чистого пламени способен обжечь того, кто соткан из мрака.'},
];
const bossByWorld=w=>WORLD_BOSSES.find(b=>b.world===w);
function bossDefeated(bossId){ if(!S.bossesDefeated)S.bossesDefeated={}; return !!S.bossesDefeated[bossId]; }

/* ======================= ТОЧКИ ИНТЕРЕСА (ПОЛЁТ-ИССЛЕДОВАНИЕ) =======================
   При каждом заходе на карте биома появляется 3-4 случайные точки. */
const POI_TYPES = [
  {kind:'treasure', icon:'💎', label:'Блестящая находка', weight:22},
  {kind:'treasure', icon:'🪙', label:'Мешочек золота',    weight:18},
  {kind:'egg',      icon:'🥚', label:'Брошенное яйцо',    weight:14},
  {kind:'relic',    icon:'📦', label:'Старый сундучок',   weight:12},
  {kind:'choice',   icon:'❓', label:'Загадочное место',  weight:14},
  {kind:'beast',    icon:'👹', label:'Чьё-то логово',     weight:11},
  {kind:'friend',   icon:'🐣', label:'Дружелюбный зверёк',weight:10},
  {kind:'chest',    icon:'🎁', label:'Запертый сундук',   weight:10},
  {kind:'key',      icon:'🔑', label:'Забытый ключ',      weight:9},
  {kind:'scroll',   icon:'📜', label:'Древний свиток',     weight:9},
];
// добрые выборы для точек kind:'choice' (две опции с разными наградами)
const POI_CHOICES = [
  {q:'Тёмная пещера манит вглубь. Что сделать?',
   a:{t:'🔦 Осмотреть пещеру', reward:'gold'}, b:{t:'💎 Поискать кристаллы', reward:'dust'}},
  {q:'У ручья лежит что-то блестящее.',
   a:{t:'🪙 Взять монетки', reward:'gold'}, b:{t:'🥚 Заглянуть в гнездо рядом', reward:'egg'}},
  {q:'Старое дерево с дуплом.',
   a:{t:'🍯 Достать сладость', reward:'gold'}, b:{t:'📦 Пошарить в дупле', reward:'relic'}},
  {q:'Странный светящийся гриб.',
   a:{t:'✨ Собрать спор', reward:'dust'}, b:{t:'🪙 Обойти и найти клад', reward:'gold'}},
];

/* ======================= АРТЕФАКТЫ =======================
   base — бонус на 1 уровне; per — прибавка за уровень ковки.
   Новые поля (для легендарных/мифических):
   - fx: спец-эффекты {critPct, manaMax, manaRegen, healPct, vampPct} на 1 ур
   - fxPer: прирост эффектов за уровень ковки
   - malus: дебаф (отрицательные статы/эффекты), фиксированный (трейд-офф)
   - world: к какому миру привязан (добывается в биоме III этого мира) */
const ARTIFACTS = [
  // — базовые (обычные, чистые бонусы) —
  {id:'emberfang',  name:'Клык Жароеда',     icon:'🦷', slot:'weapon', rarity:1, el:'fire',
   base:{atk:3}, per:{atk:2}, lore:'Клык древнего дракона, что вечно тлеет изнутри.'},
  {id:'frostshard', name:'Осколок Вечнольда', icon:'🔹', slot:'armor', rarity:2, el:'frost',
   base:{def:3,hp:6}, per:{def:2,hp:4}, lore:'Льдина, не тающая даже в пламени горна.'},
  {id:'venomidol',  name:'Идол Гнили',        icon:'🗿', slot:'charm', rarity:2, el:'venom',
   base:{atk:2,spd:2}, per:{atk:1,spd:2}, lore:'Каменный истукан, источающий ядовитую дымку.'},
  {id:'stormcrest', name:'Гребень Грозы',     icon:'⚜️', slot:'charm', rarity:3, el:'storm',
   base:{spd:4,atk:2}, per:{spd:3,atk:1}, lore:'Венец, в котором заперта пойманная молния.'},
  {id:'shadeplate', name:'Латы Безмолвия',    icon:'🛡️', slot:'armor', rarity:3, el:'shade',
   base:{def:5,hp:8}, per:{def:3,hp:6}, lore:'Доспех, сотканный из самой ночной тьмы.'},
  {id:'pyreblade',  name:'Клинок Пламевластца',icon:'🗡️', slot:'weapon', rarity:4, el:'fire',
   base:{atk:6,spd:1}, per:{atk:3,spd:1}, lore:'Меч, выкованный в жерле спящего вулкана.'},
  {id:'worldheart', name:'Сердце Мироздания', icon:'💠', slot:'charm', rarity:5, el:'venom',
   base:{hp:14,atk:3,def:3,spd:2}, per:{hp:8,atk:2,def:2,spd:1}, lore:'Осколок первотворения. Дарует силу всем чешуйкам разом.'},

  /* ===== ОГНЕННЫЙ МИР (биом III: Сердце Вулкана) ===== */
  {id:'infernomaw', name:'Пасть Инферно', icon:'🌋', slot:'weapon', rarity:4, el:'fire', world:'emberreach',
   base:{atk:10}, per:{atk:4}, fx:{critPct:8}, fxPer:{critPct:2}, malus:{def:-6},
   lore:'Оружие берсерка: испепеляет врага, но открывает носителя ударам.'},
  {id:'magmaheart', name:'Магмовое Сердце', icon:'🔥', slot:'charm', rarity:5, el:'fire', world:'emberreach',
   base:{atk:8,hp:20}, per:{atk:3,hp:10}, fx:{vampPct:6}, fxPer:{vampPct:1}, malus:{spd:-8},
   lore:'Пульсирующее ядро вулкана: выпивает жизнь врага, но тяжело носить.'},
  {id:'cindercrown',name:'Венец Пепла', icon:'👑', slot:'armor', rarity:4, el:'fire', world:'emberreach',
   base:{def:8,hp:14}, per:{def:3,hp:8}, fx:{healPct:5}, fxPer:{healPct:1}, malus:{atk:-5},
   lore:'Корона, что заживляет раны носителя жаром, притупляя его ярость.'},

  /* ===== ЯДОВИТЫЙ МИР (биом III: Улей Спор) ===== */
  {id:'plaguefang', name:'Клык Мора', icon:'🦠', slot:'weapon', rarity:4, el:'venom', world:'mirelot',
   base:{atk:8,spd:4}, per:{atk:3,spd:2}, fx:{vampPct:8}, fxPer:{vampPct:1}, malus:{hp:-18},
   lore:'Отравленный клык: возвращает здоровье с каждой раной, но носитель хрупок.'},
  {id:'sporecrown', name:'Корона Спор', icon:'🍄', slot:'charm', rarity:5, el:'venom', world:'mirelot',
   base:{spd:8,atk:5}, per:{spd:4,atk:2}, fx:{critPct:10,manaRegen:1}, fxPer:{critPct:2}, malus:{def:-12},
   lore:'Живой венец грибницы: обостряет чутьё до смертельной точности ценой брони.'},
  {id:'mirebulwark',name:'Оплот Топей', icon:'🐢', slot:'armor', rarity:4, el:'venom', world:'mirelot',
   base:{def:12,hp:22}, per:{def:4,hp:12}, fx:{healPct:6}, fxPer:{healPct:1}, malus:{spd:-10},
   lore:'Панцирь болотного исполина: почти непробиваем, но неповоротлив.'},

  /* ===== ЛЕДЯНОЙ МИР (биом III: Замёрзшая Бездна) ===== */
  {id:'frostcrown', name:'Корона Мерзлоты', icon:'❄️', slot:'charm', rarity:5, el:'frost', world:'glacior',
   base:{def:6,hp:16}, per:{def:3,hp:8}, fx:{manaMax:3,manaRegen:1}, fxPer:{}, malus:{spd:-8},
   lore:'Ледяной венец, хранящий бездонный резерв маны — но сковывающий движения.'},
  {id:'glacialedge',name:'Грань Ледника', icon:'🧊', slot:'weapon', rarity:4, el:'frost', world:'glacior',
   base:{atk:9,def:4}, per:{atk:3,def:2}, fx:{critPct:7}, fxPer:{critPct:2}, malus:{spd:-6},
   lore:'Клинок из вечного льда: рубит наверняка, но тяжёл и холоден.'},
  {id:'rimeheart',  name:'Сердце Инея', icon:'💙', slot:'armor', rarity:4, el:'frost', world:'glacior',
   base:{hp:26,def:8}, per:{hp:14,def:3}, fx:{healPct:7}, fxPer:{healPct:1}, malus:{atk:-6},
   lore:'Ледяное сердце медленно затягивает раны стужей, охлаждая и пыл атаки.'},

  /* ===== ШТОРМОВОЙ МИР (биом III: Громовой Трон) ===== */
  {id:'thunderfang',name:'Клык Грозы', icon:'⚡', slot:'weapon', rarity:5, el:'storm', world:'stormpeak',
   base:{atk:11,spd:6}, per:{atk:4,spd:3}, fx:{critPct:12}, fxPer:{critPct:2}, malus:{def:-10,hp:-10},
   lore:'Молния, скованная в клинок: сокрушительный крит ценой всякой защиты.'},
  {id:'stormeye',   name:'Око Бури', icon:'🌀', slot:'charm', rarity:5, el:'storm', world:'stormpeak',
   base:{spd:10}, per:{spd:4}, fx:{manaMax:4,manaRegen:2}, fxPer:{}, malus:{hp:-14},
   lore:'Взор урагана: неиссякаемый поток маны для заклинателя, но тело истончается.'},
  {id:'galeplate',  name:'Доспех Вихря', icon:'🌫️', slot:'armor', rarity:4, el:'storm', world:'stormpeak',
   base:{def:7,spd:6}, per:{def:3,spd:3}, fx:{critPct:5}, fxPer:{critPct:1}, malus:{hp:-8},
   lore:'Лёгкая броня из сгустков ветра — стремительна, но почти невесома.'},

  /* ===== ТЕНЕВОЙ МИР (биом III: Беззвёздное Ядро) ===== */
  {id:'voidreaper', name:'Жнец Пустоты', icon:'🌑', slot:'weapon', rarity:5, el:'shade', world:'voidedge',
   base:{atk:13}, per:{atk:5}, fx:{vampPct:10,critPct:6}, fxPer:{vampPct:1,critPct:1}, malus:{def:-14,spd:-6},
   lore:'Коса из антисвета: пожирает жизнь и бьёт без промаха, но носитель беззащитен.'},
  {id:'starlessorb',name:'Беззвёздная Сфера', icon:'⚫', slot:'charm', rarity:5, el:'shade', world:'voidedge',
   base:{atk:4,hp:18}, per:{atk:2,hp:10}, fx:{manaMax:5,manaRegen:2,critPct:6}, fxPer:{}, malus:{def:-16},
   lore:'Сфера чистой пустоты: бездонная мана и острый ум ценой всякой защиты.'},
  {id:'shroudmantle',name:'Мантия Мрака', icon:'🕸️', slot:'armor', rarity:5, el:'shade', world:'voidedge',
   base:{def:14,hp:30}, per:{def:5,hp:16}, fx:{healPct:8,vampPct:4}, fxPer:{healPct:1}, malus:{atk:-10},
   lore:'Плащ из сгущённой ночи: затягивает раны и питает тьмой, но глушит удары носителя.'},
];
// эффекты, которые не являются базовыми статами
const FX_KEYS=['critPct','manaMax','manaRegen','healPct','vampPct'];
const FX_LABEL={critPct:'крит', manaMax:'макс. мана', manaRegen:'реген маны', healPct:'лечение/ход', vampPct:'вампиризм'};
const FX_ICON={critPct:'🎯', manaMax:'💧', manaRegen:'♒', healPct:'✚', vampPct:'🩸'};
const FX_SUFFIX={critPct:'%', manaMax:'', manaRegen:'/ход', healPct:'%', vampPct:'%'};
const SLOT_NAME = {weapon:'Оружие', armor:'Броня', charm:'Талисман'};
const SLOT_ICON = {weapon:'⚔️', armor:'🛡️', charm:'🔮'};
const artifactById = id => ARTIFACTS.find(a=>a.id===id);

// стоимость ковки артефакта со своего текущего уровня на следующий (мягкая, без долгого гринда)
function forgeCost(art, level){
  return Math.round((15 + art.rarity*8) * Math.pow(1.5, level-1));
}
// доп. расход пыли на высоких уровнях ковки (с 5-го): делает пыль дефицитной
function forgeDustCost(level){
  return level>=5 ? (level-4)*10 : 0;
}
const FORGE_MAX = 8;

/* ===== УРОВНИ КУЗНИЦЫ =====
   Уровень кузни (S.forgeLevel 3..5) = потолок редкости, которую можно ковать.
   Старт на ур.3 (редкие доступны). Улучшение до 4/5 открывает ковку легендарных/мифических. */
const SMITHY_MIN=3, SMITHY_MAX=5;
const SMITHY_RARITY_NAME=['','обычные','необычные','редкие','легендарные','мифические'];
function forgeLevel(){ return Math.max(SMITHY_MIN, Math.min(SMITHY_MAX, S.forgeLevel||SMITHY_MIN)); }
// можно ли ковать артефакт данной редкости при текущем уровне кузни
function canForgeRarity(rarity){ return rarity <= forgeLevel(); }
// стоимость улучшения кузни с уровня lvl на lvl+1
function smithyCost(lvl){ return {gold:Math.round(600*Math.pow(2.0,lvl-3)), dust:(lvl-2)*30}; }

// суммарные бонусы к статам конкретного экземпляра (с учётом уровня ковки и дебафов)
function artifactBonus(inst){
  const art=artifactById(inst.id); if(!art) return {};
  const lvl=inst.level;
  const out={};
  for(const k of ['hp','atk','def','spd']){
    let b=(art.base[k]||0) + (art.per[k]||0)*(lvl-1);
    if(art.malus && art.malus[k]) b += art.malus[k]; // дебаф к стату (фиксированный)
    if(b) out[k]=b;
  }
  return out;
}
// спец-эффекты экземпляра (крит/мана/лечение/вампиризм) с учётом ковки и дебафов
function artifactFx(inst){
  const art=artifactById(inst.id); if(!art) return {};
  const lvl=inst.level;
  const out={};
  for(const k of FX_KEYS){
    let v=((art.fx&&art.fx[k])||0) + ((art.fxPer&&art.fxPer[k])||0)*(lvl-1);
    if(art.malus && art.malus[k]) v += art.malus[k];
    if(v) out[k]=v;
  }
  return out;
}
// суммарные эффекты всех надетых артефактов дракона
function equipFx(d){
  const out={critPct:0,manaMax:0,manaRegen:0,healPct:0,vampPct:0};
  if(!d.equip) return out;
  for(const invUid of Object.values(d.equip)){
    const inst=artInst(invUid); if(!inst) continue;
    const fx=artifactFx(inst);
    for(const k in fx) out[k]+=fx[k];
  }
  return out;
}

