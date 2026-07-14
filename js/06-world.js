/* ============================================================
   06-world.js — МИР: сцены биомов, карта странствий, портал, вызов босса, Хаб, украшения, Сокровищница-экран
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ===== СТРАНСТВИЕ ===== */
/* ===== РИСОВАННЫЕ СЦЕНЫ БИОМОВ (SVG) ===== */
// небольшая псевдослучайность, стабильная для каждого региона
function seeded(seed){let s=seed;return ()=>{s=(s*9301+49297)%233280;return s/233280;};}

function sceneSVG(scene, id){
  const W=400,H=220;
  const open=`<svg class="scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">`;
  const close=`</svg>`;
  if(scene==='fire')   return open+fireScene(W,H,id)+close;
  if(scene==='jungle') return open+jungleScene(W,H,id)+close;
  if(scene==='ice')    return open+iceScene(W,H,id)+close;
  return open+shadeScene(W,H,id)+close;
}

/* ===== ПЕРГАМЕНТНАЯ КАРТА МЕСТНОСТИ (для режима полёта) ===== */
function mapSVG(scene, id){
  const W=400,H=240;
  const r=seeded((id||scene).length*131+ (scene.charCodeAt(0)||7));
  const P={
    fire:{paper:'#3a2418',paper2:'#2a1810',ink:'#7a3a1e',land:'#6e3a1e',water:'#b8542a',accent:'#e0633a'},
    jungle:{paper:'#23301f',paper2:'#1a2417',ink:'#3a5a2e',land:'#3f6b34',water:'#2f7d6a',accent:'#7fb24a'},
    ice:{paper:'#2a3744',paper2:'#1e2a36',ink:'#4a6f88',land:'#5a7e96',water:'#6fa8c4',accent:'#6db4d4'},
    shade:{paper:'#241a30',paper2:'#180f22',ink:'#5a4080',land:'#3f3458',water:'#7a3a86',accent:'#b88adf'},
  }[scene]||{paper:'#2a1810',paper2:'#1a100a',ink:'#7a3a1e',land:'#6e3a1e',water:'#b8542a',accent:'#e0633a'};
  let s=`<svg class="scene" viewBox='0 0 ${W} ${H}' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>`;
  s+=`<rect width='${W}' height='${H}' fill='${P.paper}'/>`;
  s+=`<rect width='${W}' height='${H}' fill='${P.paper2}' opacity='0.4'/>`;
  // участки суши
  for(let i=0;i<7;i++){const cx=r()*W,cy=r()*H,rad=30+r()*50;
    s+=`<ellipse cx='${cx.toFixed(0)}' cy='${cy.toFixed(0)}' rx='${rad.toFixed(0)}' ry='${(rad*0.7).toFixed(0)}' fill='${P.land}' opacity='0.45'/>`;}
  // река
  s+=`<path d='M-10 ${(60+r()*40)|0} Q${W*0.3} ${(40+r()*60)|0} ${W*0.5} ${(120+r()*30)|0} T${W+10} ${(150+r()*40)|0}' fill='none' stroke='${P.water}' stroke-width='${(6+r()*4)|0}' opacity='0.55' stroke-linecap='round'/>`;
  // горы
  for(let i=0;i<6;i++){const x=20+i*65+r()*20,y=40+r()*30;
    s+=`<path d='M${x.toFixed(0)} ${y.toFixed(0)} l8 -12 l8 12Z' fill='none' stroke='${P.ink}' stroke-width='1.5'/>`;}
  // деревья
  for(let i=0;i<10;i++){const x=r()*W,y=120+r()*100;
    s+=`<circle cx='${x.toFixed(0)}' cy='${y.toFixed(0)}' r='4' fill='none' stroke='${P.ink}' stroke-width='1.2'/><line x1='${x.toFixed(0)}' y1='${(y+4).toFixed(0)}' x2='${x.toFixed(0)}' y2='${(y+8).toFixed(0)}' stroke='${P.ink}' stroke-width='1.2'/>`;}
  // пунктирная тропа
  s+=`<path d='M40 200 Q120 150 180 170 T340 120' fill='none' stroke='${P.accent}' stroke-width='2.5' stroke-dasharray='2 6' stroke-linecap='round' opacity='0.8'/>`;
  // компас
  s+=`<g transform='translate(360 42)'><circle r='16' fill='none' stroke='${P.ink}' stroke-width='1.5'/><path d='M0 -14 L4 0 L0 14 L-4 0Z' fill='${P.accent}'/><text x='0' y='-19' font-size='8' fill='${P.ink}' text-anchor='middle' font-family='serif'>С</text></g>`;
  // рамка карты
  s+=`<rect x='6' y='6' width='${W-12}' height='${H-12}' fill='none' stroke='${P.ink}' stroke-width='3'/>`;
  s+=`<rect x='11' y='11' width='${W-22}' height='${H-22}' fill='none' stroke='${P.ink}' stroke-width='1' opacity='0.6'/>`;
  s+=`<path d='M6 22 L6 6 L22 6 M${W-22} 6 L${W-6} 6 L${W-6} 22 M6 ${H-22} L6 ${H-6} L22 ${H-6} M${W-22} ${H-6} L${W-6} ${H-6} L${W-6} ${H-22}' fill='none' stroke='${P.accent}' stroke-width='2'/>`;
  s+='</svg>';
  return s;
}

/* ===== ХАБ «ДРАКОНЬИ ЗЕМЛИ» (главный экран) ===== */
function hubSceneSVG(){
  const W=800,H=480;
  return `<svg class="hub-scene" viewBox='0 0 ${W} ${H}' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>
    <defs>
      <linearGradient id='hubsky' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0' stop-color='#3a2450'/><stop offset='0.4' stop-color='#8a4a52'/>
        <stop offset='0.7' stop-color='#d97a42'/><stop offset='1' stop-color='#f0a850'/></linearGradient>
      <radialGradient id='hubsun' cx='0.5' cy='0.5' r='0.5'>
        <stop offset='0' stop-color='#ffe9a0'/><stop offset='0.5' stop-color='#ffce6a' stop-opacity='0.8'/><stop offset='1' stop-color='#ffce6a' stop-opacity='0'/></radialGradient>
      <linearGradient id='hubhill' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0' stop-color='#3a4a2e'/><stop offset='1' stop-color='#24301c'/></linearGradient>
    </defs>
    <rect width='${W}' height='${H}' fill='url(#hubsky)'/>
    <circle cx='400' cy='300' r='180' fill='url(#hubsun)'/><circle cx='400' cy='300' r='55' fill='#ffe9a0' opacity='0.9'/>
    <path d='M0 300 L120 220 L240 290 L360 210 L480 285 L620 215 L800 290 L800 480 L0 480Z' fill='#5a3a5a' opacity='0.55'/>
    <ellipse cx='150' cy='90' rx='40' ry='16' fill='#ffd9b0' opacity='0.28'/><ellipse cx='620' cy='70' rx='50' ry='20' fill='#ffd9b0' opacity='0.28'/>
    <path d='M250 120 q8 -6 16 0 q8 -6 16 0' stroke='#3a2450' stroke-width='2' fill='none'/><path d='M520 150 q6 -5 12 0 q6 -5 12 0' stroke='#3a2450' stroke-width='2' fill='none'/>
    <path d='M0 360 Q200 320 400 350 T800 340 L800 480 L0 480Z' fill='url(#hubhill)'/>
    <path d='M0 420 Q250 390 500 415 T800 405 L800 480 L0 480Z' fill='#1c2614'/>
  </svg>`;
}
// постройки-ссылки: иконка-рисунок, подпись, позиция (% сцены), экран
// Координаты и размеры кликабельных зон (в % от размера фона).
// w/h — ширина/высота невидимой зоны в % (чтобы попадать по зданию).
const HUB_SPOTS=[
  {v:'explore',label:'Странствия', x:18, y:37, w:22, h:16},
  {v:'roost',  label:'Гнездилище', x:48, y:35, w:20, h:15},
  {v:'spire',  label:'Шпиль',      x:82, y:30, w:20, h:24},
  {v:'lair',   label:'Логово',     x:15, y:62, w:24, h:20},
  {v:'forge',  label:'Кузница',    x:47, y:62, w:22, h:18},
  {v:'codex',  label:'Кодекс',     x:80, y:63, w:22, h:18},
  {v:'hatch',  label:'Гнездо',     x:32, y:83, w:20, h:15},
  {v:'arena',  label:'Турнир',     x:72, y:86, w:26, h:16},
];
function hubSpotArt(art){
  switch(art){
    case 'castle': return `<svg viewBox='0 0 60 60'><rect x='8' y='24' width='44' height='34' fill='#4a3a4e'/><rect x='2' y='14' width='14' height='44' fill='#564050'/><rect x='44' y='14' width='14' height='44' fill='#564050'/><path d='M2 14 l7 -10 l7 10Z M44 14 l7 -10 l7 10Z' fill='#7a3a42'/><rect x='24' y='38' width='12' height='20' fill='#2a1f2e'/><rect x='5' y='24' width='6' height='8' fill='#ffce6a'/><rect x='49' y='24' width='6' height='8' fill='#ffce6a'/></svg>`;
    case 'nest': return `<svg viewBox='0 0 60 60'><ellipse cx='30' cy='44' rx='26' ry='12' fill='#5a4326'/><ellipse cx='30' cy='40' rx='20' ry='8' fill='#3a2c18'/><ellipse cx='22' cy='38' rx='7' ry='9' fill='#f0d8b0'/><ellipse cx='36' cy='40' rx='7' ry='9' fill='#e8c8a0'/><ellipse cx='30' cy='34' rx='7' ry='9' fill='#fff0d0'/></svg>`;
    case 'forge': return `<svg viewBox='0 0 60 60'><rect x='8' y='28' width='44' height='28' fill='#3a2c20'/><path d='M5 28 l25 -14 l25 14Z' fill='#5a3a28'/><rect x='40' y='6' width='9' height='24' fill='#4a3424'/><path d='M44 4 q-6 -8 1 -16 q-5 8 4 12' fill='none' stroke='#ccc' stroke-width='2' opacity='0.5'/><rect x='20' y='40' width='18' height='16' fill='#e0633a'/><rect x='24' y='44' width='10' height='10' fill='#ffce6a'/></svg>`;
    case 'tower': return `<svg viewBox='0 0 60 60'><rect x='20' y='14' width='22' height='44' fill='#46506a'/><rect x='16' y='14' width='30' height='8' fill='#566080'/><path d='M16 14 l15 -12 l15 12Z' fill='#6e5aa0'/><rect x='27' y='28' width='8' height='10' fill='#ffce6a'/><rect x='27' y='44' width='8' height='10' fill='#aef0ff'/><circle cx='31' cy='-2' r='3' fill='#aef0ff'/></svg>`;
    case 'arena': return `<svg viewBox='0 0 60 60'><ellipse cx='30' cy='42' rx='28' ry='12' fill='#6a4a2e'/><ellipse cx='30' cy='38' rx='22' ry='9' fill='#8a6038'/><rect x='8' y='20' width='6' height='18' fill='#5a3a22'/><rect x='46' y='20' width='6' height='18' fill='#5a3a22'/><path d='M14 22 l5 -10 M41 22 l5 -10' stroke='#e0633a' stroke-width='2'/></svg>`;
    case 'portal': return `<svg viewBox='0 0 60 60'><ellipse cx='30' cy='34' rx='20' ry='24' fill='#2a1f3a'/><ellipse cx='30' cy='34' rx='20' ry='24' fill='none' stroke='#b88adf' stroke-width='3'/><ellipse cx='30' cy='34' rx='11' ry='15' fill='#6e44a0' opacity='0.7'/><path d='M30 18 l3 8 l-3 -2 l-3 2Z' fill='#e8d6ff'/></svg>`;
    case 'altar': return `<svg viewBox='0 0 60 60'><rect x='18' y='34' width='24' height='20' fill='#4a3a52'/><rect x='14' y='30' width='32' height='6' fill='#5a4660'/><circle cx='30' cy='20' r='10' fill='none' stroke='#7fb24a' stroke-width='3'/><circle cx='30' cy='20' r='4' fill='#c8e89a'/><path d='M30 30 l0 4' stroke='#7fb24a' stroke-width='2'/></svg>`;
    case 'book': return `<svg viewBox='0 0 60 60'><path d='M10 22 L30 28 L30 54 L10 48Z' fill='#7a3a2a'/><path d='M50 22 L30 28 L30 54 L50 48Z' fill='#8a4a32'/><path d='M30 28 L30 54' stroke='#3a1a12' stroke-width='2'/><path d='M14 30 l12 3 M14 38 l12 3 M34 33 l12 -3 M34 41 l12 -3' stroke='#e8d0b0' stroke-width='1.5' opacity='0.6'/><circle cx='30' cy='18' r='4' fill='#ffce6a'/></svg>`;
  }
  return '';
}
// бейджи-уведомления на постройках
function hubBadge(v){
  if(v==='lair' && S.chestReady) return '🎁';
  if(v==='spire'){ const n=S.dragons.reduce((a,d)=>a+pendingForks(d).length,0); if(n) return '●'; }
  if(v==='hatch' && eggCount()>0) return String(eggCount());
  return '';
}
/* ============================================================
   СИСТЕМА «СЛЕДУЮЩИЙ ШАГ»: одна ближайшая цель — что делать, зачем,
   что получишь, что откроется. Никогда не даём игроку потеряться.
   ============================================================ */
function _qReward(q){ try{ const d=questDef(q.id); return d?rewardText(d.reward):'награда'; }catch(e){ return 'награда'; } }
function nextStep(){
  const lvl=(typeof progLevel==='function')?progLevel():1;
  const eggs=(typeof eggsArray==='function')?eggsArray():[];
  // 1) подарок дня
  if(S.chestReady) return {icon:'🎁',title:'Забери подарок дня',why:'Ежедневная награда растёт с серией входов',
    reward:'золото · пыль · яйцо',unlock:'серия продолжится',label:'В Логово',
    fn:()=>{ switchView('lair'); const dp=$('#dailyPanel'); if(dp)setTimeout(()=>dp.scrollIntoView({behavior:'smooth',block:'center'}),60); }};
  // 2) готовое яйцо
  if(eggs.some(e=>e.incNeed&&(e.inc||0)>=e.incNeed)) return {icon:'🐣',title:'Высиди готовое яйцо',
    why:'Инкубация завершена',reward:'новый дракон',unlock:'сильнее стая',label:'В Гнездо',fn:()=>switchView('hatch')};
  // 3) готовая веха
  if(typeof MILESTONES!=='undefined'){ const m=MILESTONES.find(x=>!milestoneClaimed(x.id)&&x.check());
    if(m) return {icon:m.icon||'🏅',title:'Забери награду: '+m.name,why:'Цель достигнута',
      reward:(m.reward.gold||0)+'🪙'+(m.reward.dust?' +'+m.reward.dust+'✦':''),unlock:'',label:'В Кодекс',
      fn:()=>{ switchView('codex'); if(typeof showCodexTab==='function')showCodexTab('miles'); }}; }
  // 4) ближайшая механика
  const feats=[['forge','Кузница'],['spire','Шпиль Мироздания'],['roost','Гнездилище Рода']];
  for(const f of feats){ if(typeof featureUnlocked==='function'&&!featureUnlocked(f[0])){ const need=FEATURE_MIN[f[0]];
    return {icon:'🔓',title:`Подними дракона до ур.${need}`,why:`Осталось ${Math.max(1,need-lvl)} ур.`,
      reward:'опыт в боях и странствиях',unlock:f[1],label:'В бой',fn:()=>switchView('arena')}; } }
  // 5) задание дня
  const q=(S.quests||[]).find(x=>!x.claimed);
  if(q && q.done) return {icon:'✨',title:'Забери награду задания',why:questText(q.id),reward:_qReward(q),unlock:'',
    label:'В Логово',fn:()=>switchView('lair')};
  if(q) return {icon:q.icon||'✨',title:questText(q.id),why:`Прогресс ${q.prog||0}/${q.goal}`,reward:_qReward(q),unlock:'',
    label:'Погнали',fn:()=>switchView('explore')};
  // 6) инкубация идёт
  const inc=eggs.find(e=>e.incNeed&&(e.inc||0)<e.incNeed);
  if(inc) return {icon:'🥚',title:'Продвинь инкубацию',why:`Яйцо на ${Math.round((inc.inc||0)/inc.incNeed*100)}% — бои и странствия его греют`,
    reward:'скоро новый дракон',unlock:'',label:'В странствие',fn:()=>switchView('explore')};
  // 7) ворота биома (крупные цели середины игры)
  if(typeof BIOME_MIN_LEVEL!=='undefined'){ for(let b=2;b<=3;b++){ if(lvl<BIOME_MIN_LEVEL[b])
    return {icon:'⛰️',title:`Подними дракона до ур.${BIOME_MIN_LEVEL[b]}`,why:`Откроется глубина мира`,
      reward:'редкие виды и добыча',unlock:BIOME_TIERLABEL[b],label:'В бой',fn:()=>switchView('arena')}; } }
  // 8) улучшение логова
  if(typeof lairUpgradeCheck==='function'){ const c=lairUpgradeCheck(); if(c&&c.ok)
    return {icon:'🏰',title:'Улучши логово',why:'Хватает ресурсов',reward:'+вместимость стаи',unlock:'',
      label:'В Логово',fn:()=>switchView('lair')}; }
  // 9) владыка мира
  if(typeof WORLD_BOSSES!=='undefined'){ const bo=WORLD_BOSSES.find(x=>!bossDefeated(x.id));
    if(bo && lvl>=100) return {icon:'☠️',title:'Брось вызов владыке',why:bo.name+' ждёт',
      reward:'уникальное яйцо',unlock:'легенда в Кодексе',label:'К владыке',fn:()=>switchView('explore')}; }
  // по умолчанию
  return {icon:'🗺️',title:'Отправься в странствие',why:'Золото, опыт и находки',reward:'ресурсы и яйца',
    unlock:'новые области',label:'В странствие',fn:()=>switchView('explore')};
}
function nextStepCardHTML(){
  const ns=nextStep(); const meta=[];
  if(ns.reward) meta.push(`🎁 ${ns.reward}`);
  if(ns.unlock) meta.push(`🔓 ${ns.unlock}`);
  return `<div class="nextstep">
    <div class="ns-head">Следующий шаг</div>
    <div class="ns-main"><span class="ns-ic">${ns.icon}</span>
      <div class="ns-txt"><div class="ns-title">${ns.title}</div>${ns.why?`<div class="ns-why">${ns.why}</div>`:''}</div></div>
    ${meta.length?`<div class="ns-meta">${meta.join(' · ')}</div>`:''}
    <button class="ns-cta tap" id="nextStepBtn">${ns.label||'Вперёд'} →</button>
    <details class="ns-more"><summary>Все цели</summary>${hubGoalsHTML()}</details>
  </div>`;
}
// UX: инфо-строка главного экрана — цель, инкубация, задания, коллекция, подарок
function hubGoalsHTML(){
  const parts=[];
  let next=null; for(const k of ['forge','spire','roost']){ if(typeof featureUnlocked==='function'&&!featureUnlocked(k)){ next={k,min:FEATURE_MIN[k]}; break; } }
  if(next) parts.push(`🔓 До «${FEATURE_NAME[next.k]}»: <b>${Math.max(1,next.min-progLevel())} ур.</b>`);
  const eggs=(typeof eggsArray==='function')?eggsArray():[];
  const inc=eggs.find(e=>e.incNeed&&(e.inc||0)<e.incNeed);
  if(inc) parts.push(`🥚 Инкубация: <b>${Math.round((inc.inc||0)/inc.incNeed*100)}%</b>`);
  else if(eggs.length) parts.push(`🥚 К высиживанию: <b>${eggs.length}</b>`);
  const q=(S.quests||[]).filter(x=>!x.claimed).length; if(q) parts.push(`✨ Задания: <b>${q}</b>`);
  const disc=(typeof SPECIES!=='undefined')?SPECIES.filter(sp=>S.discovered&&S.discovered[sp.id]).length:0;
  parts.push(`🐉 Виды: <b>${disc}/${(typeof SPECIES!=='undefined'?SPECIES.length:15)}</b>`);
  const eggT=Object.keys(S.eggStats||{}).length, eggTot=(typeof EGG_CATALOG!=='undefined'?EGG_CATALOG.length:16);
  const biomes=Object.keys(((S.worldCodex||{}).biomes)||{}).length;
  const bossesB=(typeof WORLD_BOSSES!=='undefined')?WORLD_BOSSES.filter(b=>bossDefeated(b.id)).length:0;
  const knowPct=Math.round(((disc/((typeof SPECIES!=='undefined')?SPECIES.length:15))+(eggT/eggTot)+(biomes/5)+(bossesB/5))/4*100);
  parts.push(`📖 Знания: <b>${knowPct}%</b>`); // СВЯЗЬ: Кодекс агрегирует все системы
  if(S.chestReady) parts.push('🎁 <b>Подарок дня</b>');
  return `<div class="hub-goals"><div class="hg-row">${parts.join(' · ')}</div></div>`;
}
// UX: панель доступности (модальный оверлей)
function openA11y(){
  const a=S.a11y||{};
  let sc=document.getElementById('a11yOverlay');
  if(!sc){ sc=document.createElement('div'); sc.id='a11yOverlay'; sc.className='screen'; document.body.appendChild(sc); }
  sc.style.display='flex';
  const opt=(k,l)=>`<button class="a11y-btn ${a[k]?'on':''}" data-a11y="${k}">${l}</button>`;
  sc.innerHTML=`<h1 style="font-size:22px">♿ Доступность</h1><p style="opacity:.8;font-size:13px;max-width:320px">Настрой интерфейс под себя. Изменения сохраняются.</p><div class="a11y-panel">${opt('contrast','🌗 Высокий контраст')}${opt('large','🔎 Крупный текст')}${opt('lefthand','🤚 Для левшей')}${opt('colorblind','🎨 Без опоры на цвет')}</div><button class="btn" id="a11yClose" style="min-height:44px">Готово</button>`;
  sc.querySelectorAll('[data-a11y]').forEach(b=>b.onclick=()=>{ if(typeof toggleA11y==='function')toggleA11y(b.dataset.a11y); b.classList.toggle('on'); });
  const cl=document.getElementById('a11yClose'); if(cl)cl.onclick=()=>{ sc.style.display='none'; };
}
function renderHub(){
  S._treasuryOpen=false;
  const wrap=$('#hubWrap');
  if(!wrap) return;
  const spots=HUB_SPOTS.map(sp=>{
    const badge=hubBadge(sp.v);
    return `<button class="hub-zone" data-go="${sp.v}"
        style="left:${sp.x}%;top:${sp.y}%;width:${sp.w}%;height:${sp.h}%">
      <span class="hub-zone-label">${sp.label}</span>
      ${badge?`<span class="hub-zone-badge">${badge}</span>`:''}
    </button>`;
  }).join('');
  // размещённые украшения на карте хаба
  const decos=(S.decorations&&typeof S.decorations==='object')?S.decorations:{};
  const decoEls=DECO_SLOTS.map(slot=>{
    const decoId=decos[slot.i];
    if(!decoId) return '';
    const deco=decorById(decoId); if(!deco) return '';
    return `<div class="hub-deco" style="left:${slot.x}%;top:${slot.y}%" title="${deco.name}">${deco.icon}</div>`;
  }).join('');
  const ownedCount=(S.decorOwned||[]).length;
  wrap.innerHTML=`
    ${nextStepCardHTML()}
    <div class="hub-stage hub-stage-photo">
      <img class="hub-bg" src="images/hub_bg.webp" decoding="async" alt=""
        onerror="this.style.display='none';this.parentNode.classList.add('hub-bg-fallback')">
      ${decoEls}
      ${spots}
    </div>
    <div class="hub-hint-row">
      <p class="hub-hint">Нажми на любое строение, чтобы отправиться туда.</p>
      <div class="hub-btns">
        <button class="btn ghost hub-deco-btn" id="treasBtn">🎁 Сокровищница${chestCount()?` (${chestCount()})`:''}</button>
        <button class="btn ghost hub-deco-btn" id="marketBtn">🛒 Рынок</button>
        ${ownedCount?`<button class="btn ghost hub-deco-btn" id="decoBtn">🎨 Украшения (${ownedCount})</button>`:''}
      </div>
    </div>`;
  wrap.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>switchView(b.dataset.go));
  const db=$('#decoBtn'); if(db) db.onclick=openDecorManager;
  const tb=$('#treasBtn'); if(tb) tb.onclick=openTreasury;
  const mk=$('#marketBtn'); if(mk) mk.onclick=openMarket;
  const nsb=$('#nextStepBtn'); if(nsb) nsb.onclick=()=>{ const ns=nextStep(); if(ns&&ns.fn)ns.fn(); };
}

// управление украшениями: разместить/убрать по слотам
/* ===== РЫНОК: золотые стоки (ключи, премиум-украшения, обмен пыли) ===== */
function marketDustState(){
  const today=new Date().toDateString();
  if(!S.marketDust || S.marketDust.day!==today) S.marketDust={day:today, bought:0};
  return S.marketDust;
}
function openMarket(){
  const wrap=$('#hubWrap'); if(!wrap) return;
  // ключи
  const keyRows=[1,2,3].map(t=>{
    const ct=chestType(t); const price=MARKET_KEY_PRICE[t];
    const can=S.gold>=price;
    return `<div class="chest-row">
      <span class="chest-ic">${ct.keyIcon}</span>
      <span class="chest-name">${ct.keyName}<br><span class="chest-sub">открывает: ${ct.name.toLowerCase()} · у тебя: ${keyCount(t)}</span></span>
      <button class="btn ${can?'':'ghost'}" data-buykey="${t}" ${can?'':'disabled'}>🪙 ${price}</button>
    </div>`;
  }).join('');
  // премиум-украшения
  const premRows=DECORATIONS.filter(d=>d.premium).map(d=>{
    const owned=(S.decorOwned||[]).includes(d.id);
    const can=!owned && S.gold>=d.price;
    return `<div class="chest-row">
      <span class="chest-ic">${d.icon}</span>
      <span class="chest-name">${d.name} ${'★'.repeat(d.rarity)}<br><span class="chest-sub">${d.desc}</span></span>
      ${owned?'<span class="boss-done">✔ куплено</span>':`<button class="btn ${can?'':'ghost'}" data-buydeco="${d.id}" ${can?'':'disabled'}>🪙 ${d.price}</button>`}
    </div>`;
  }).join('');
  // обмен пыли
  const md=marketDustState();
  const left=MARKET_DUST.dailyCap-md.bought;
  const canDust=left>=MARKET_DUST.dust && S.gold>=MARKET_DUST.gold;
  wrap.innerHTML=`<div class="panel" style="margin:0">
    <div class="screen-bar" style="margin-top:0"><button class="home-btn" id="mkBack">← Поселение</button>
      <span class="screen-bar-title">🛒 Рынок</span></div>
    <p class="lede">Торговец скупает золото драконоводов. Трать излишки с умом!</p>
    <h3 class="forge-sub">🗝️ Ключи</h3>
    <div class="chest-list">${keyRows}</div>
    <h3 class="forge-sub" style="margin-top:14px">✨ Премиум-украшения</h3>
    <div class="chest-list">${premRows}</div>
    <h3 class="forge-sub" style="margin-top:14px">✦ Обмен на пыль</h3>
    <div class="chest-row">
      <span class="chest-ic">✦</span>
      <span class="chest-name">${MARKET_DUST.gold}🪙 → ${MARKET_DUST.dust}✦<br><span class="chest-sub">сегодня осталось: ${left}✦ из ${MARKET_DUST.dailyCap}</span></span>
      <button class="btn ${canDust?'':'ghost'}" id="mkDust" ${canDust?'':'disabled'}>Обменять</button>
    </div>
  </div>`;
  $('#mkBack').onclick=renderHub;
  wrap.querySelectorAll('[data-buykey]').forEach(b=>b.onclick=()=>{
    const t=+b.dataset.buykey, price=MARKET_KEY_PRICE[t];
    if(S.gold<price) return;
    S.gold-=price; addKey(t);
    sfx('coin'); persist(); renderLedger();
    toast(`${chestType(t).keyIcon} <b>${chestType(t).keyName}</b> куплен!`);
    openMarket();
  });
  wrap.querySelectorAll('[data-buydeco]').forEach(b=>b.onclick=()=>{
    const d=decorById(b.dataset.buydeco);
    if(!d || S.gold<d.price || (S.decorOwned||[]).includes(d.id)) return;
    S.gold-=d.price;
    if(!S.decorOwned)S.decorOwned=[];
    S.decorOwned.push(d.id);
    sfx('coin'); persist(); renderLedger();
    toast(`${d.icon} <b>${d.name}</b> — твоё! Размести его через «🎨 Украшения».`);
    openMarket();
  });
  const dustBtn=$('#mkDust');
  if(dustBtn&&!dustBtn.disabled) dustBtn.onclick=()=>{
    const md=marketDustState();
    if(md.bought+MARKET_DUST.dust>MARKET_DUST.dailyCap || S.gold<MARKET_DUST.gold) return;
    S.gold-=MARKET_DUST.gold; S.dust+=MARKET_DUST.dust; md.bought+=MARKET_DUST.dust;
    sfx('coin'); persist(); renderLedger();
    openMarket();
  };
}

function openDecorManager(){
  const owned=S.decorOwned||[];
  if(!owned.length){ toast('Украшений пока нет. Их находят в сундуках!'); return; }
  const decos=S.decorations||{};
  // подсчёт: сколько каждого типа есть и сколько размещено
  const placedCount={};
  Object.values(decos).forEach(id=>{placedCount[id]=(placedCount[id]||0)+1;});
  const ownedCount={};
  owned.forEach(id=>{ownedCount[id]=(ownedCount[id]||0)+1;});
  const wrap=$('#hubWrap');
  const slotRows=DECO_SLOTS.map(slot=>{
    const cur=decos[slot.i];
    const curDeco=cur?decorById(cur):null;
    return `<div class="deco-slot-row">
      <span class="deco-slot-label">Место ${slot.i+1}</span>
      <span class="deco-slot-cur">${curDeco?`${curDeco.icon} ${curDeco.name}`:'— пусто —'}</span>
      <button class="btn ghost deco-place" data-slot="${slot.i}">Выбрать</button>
      ${cur?`<button class="btn ghost deco-clear" data-clear="${slot.i}">Убрать</button>`:''}
    </div>`;
  }).join('');
  const invRows=Object.keys(ownedCount).map(id=>{
    const d=decorById(id); if(!d) return '';
    const placed=placedCount[id]||0;
    return `<div class="deco-inv-item"><span>${d.icon} ${d.name} ${'★'.repeat(d.rarity)}</span><span class="dmeta">${placed}/${ownedCount[id]} размещено</span></div>`;
  }).join('');
  wrap.innerHTML=`<div class="panel" style="margin:0">
    <h2>🎨 Украшения поселения</h2>
    <p class="lede">Расставь найденные украшения по местам на карте поселения.</p>
    <div class="deco-slots">${slotRows}</div>
    <h3 class="forge-sub" style="margin-top:16px">Коллекция украшений</h3>
    <div class="deco-inv">${invRows}</div>
    <div class="btnrow" style="margin-top:14px"><button class="btn" id="decoBack">← К поселению</button></div>
  </div>`;
  $('#decoBack').onclick=renderHub;
  wrap.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>pickDecorForSlot(+b.dataset.slot));
  wrap.querySelectorAll('[data-clear]').forEach(b=>b.onclick=()=>{
    delete S.decorations[+b.dataset.clear]; persist(); openDecorManager();
  });
}
function pickDecorForSlot(slotIdx){
  const owned=S.decorOwned||[];
  const decos=S.decorations||{};
  const placedCount={};
  Object.entries(decos).forEach(([s,id])=>{ if(+s!==slotIdx) placedCount[id]=(placedCount[id]||0)+1; });
  const ownedCount={};
  owned.forEach(id=>{ownedCount[id]=(ownedCount[id]||0)+1;});
  // доступные (ещё не все размещены в других слотах)
  const avail=Object.keys(ownedCount).filter(id=>(placedCount[id]||0)<ownedCount[id]);
  if(!avail.length){ toast('Все украшения этого типа уже размещены.'); return; }
  const wrap=$('#hubWrap');
  const opts=avail.map(id=>{const d=decorById(id);return `<button class="btn ghost deco-opt" data-pick="${id}">${d.icon} ${d.name}</button>`;}).join('');
  wrap.innerHTML=`<div class="panel" style="margin:0">
    <h2>Выбор украшения для места ${slotIdx+1}</h2>
    <div class="deco-opts">${opts}</div>
    <div class="btnrow" style="margin-top:14px"><button class="btn ghost" id="decoCancel">← Назад</button></div>
  </div>`;
  $('#decoCancel').onclick=openDecorManager;
  wrap.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{
    S.decorations=S.decorations||{}; S.decorations[slotIdx]=b.dataset.pick;
    persist(); toast(`${decorById(b.dataset.pick).icon} <b>${decorById(b.dataset.pick).name}</b> установлено!`);
    openDecorManager();
  });
}

/* ОГНЕННАЯ: вулканы, потоки лавы, искры */
function fireScene(W,H,id){
  const r=seeded(101);
  let s=`<defs>
    <linearGradient id="fsky${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a1410"/><stop offset="0.55" stop-color="#702016"/><stop offset="1" stop-color="#c23c1e"/>
    </linearGradient>
    <radialGradient id="fglow${id}" cx="0.5" cy="1" r="0.9">
      <stop offset="0" stop-color="#ffb23e" stop-opacity="0.9"/><stop offset="0.5" stop-color="#e0633a" stop-opacity="0.35"/><stop offset="1" stop-color="#e0633a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="flava${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffd86b"/><stop offset="0.5" stop-color="#ff7a2e"/><stop offset="1" stop-color="#d8341a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#fsky${id})"/>
  <ellipse cx="200" cy="220" rx="240" ry="120" fill="url(#fglow${id})"/>`;
  // дальние вулканы
  s+=`<path d="M0,150 L70,80 L120,150 Z" fill="#2a1410"/>
      <path d="M300,150 L360,70 L400,120 L400,150 Z" fill="#33180f"/>`;
  // главный вулкан
  s+=`<path d="M120,165 L200,55 L290,165 Z" fill="#1c0d08"/>
      <path d="M170,100 L200,55 L235,100 L218,118 L200,108 L182,118 Z" fill="#ff7a2e"/>
      <path d="M186,95 Q200,80 216,95 L210,118 L200,110 L192,118 Z" fill="#ffd86b"/>`;
  // извержение-искры
  for(let i=0;i<14;i++){const x=200+(r()-0.5)*70,y=70-r()*46,rad=1+r()*2.4;
    s+=`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(1)}" fill="${r()>0.5?'#ffd86b':'#ff7a2e'}" opacity="${(0.5+r()*0.5).toFixed(2)}"/>`;}
  // потоки лавы вниз по склону
  s+=`<path d="M200,108 Q205,135 196,165 L210,165 Q214,135 208,108 Z" fill="url(#flava${id})"/>`;
  // передний план — растрескавшаяся корка с лавовыми жилами
  s+=`<path d="M0,170 Q100,160 200,172 T400,168 L400,220 L0,220 Z" fill="#160b07"/>`;
  // лавовые озёра/жилы
  s+=`<path d="M-10,196 Q80,186 150,198 Q220,210 320,196 Q380,189 410,198 L410,206 Q330,212 250,204 Q160,196 60,206 Q10,210 -10,204 Z" fill="url(#flava${id})" opacity="0.95"/>`;
  for(let i=0;i<5;i++){const x=30+i*80+r()*30;
    s+=`<path d="M${x},172 q4,14 -2,28 q-5,12 3,20" stroke="#ff7a2e" stroke-width="${(1+r()*1.5).toFixed(1)}" fill="none" opacity="0.8"/>`;}
  // тлеющие угольки в воздухе
  for(let i=0;i<10;i++){s+=`<circle cx="${(r()*W).toFixed(0)}" cy="${(40+r()*120).toFixed(0)}" r="${(0.6+r()*1).toFixed(1)}" fill="#ffb23e" opacity="${(0.3+r()*0.5).toFixed(2)}"/>`;}
  return s;
}

/* ДЖУНГЛИ: исполинские деревья, озёра, лианы, туман */
function jungleScene(W,H,id){
  const r=seeded(202);
  let s=`<defs>
    <linearGradient id="jsky${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16352a"/><stop offset="0.6" stop-color="#1d4634"/><stop offset="1" stop-color="#26543b"/>
    </linearGradient>
    <radialGradient id="jbeam${id}" cx="0.35" cy="0" r="0.9">
      <stop offset="0" stop-color="#c8e89a" stop-opacity="0.4"/><stop offset="1" stop-color="#c8e89a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="jlake${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a7d6a"/><stop offset="1" stop-color="#1c4a3c"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#jsky${id})"/>
  <polygon points="120,0 200,0 90,220 -10,220" fill="url(#jbeam${id})"/>`;
  // дальняя стена листвы
  let canopy='<path d="M0,90';
  for(let x=0;x<=W;x+=28){canopy+=` Q${x+14},${56+r()*40} ${x+28},${78+r()*26}`;}
  s+=canopy+` L${W},0 L0,0 Z" fill="#0f2a1f"/>`;
  // второй ярус листвы
  let canopy2='<path d="M0,108';
  for(let x=0;x<=W;x+=34){canopy2+=` Q${x+17},${82+r()*30} ${x+34},${100+r()*20}`;}
  s+=canopy2+` L${W},40 L0,40 Z" fill="#1a3d2c" opacity="0.85"/>`;
  // крупные деревья-стволы
  const trunks=[40,150,300,370];
  trunks.forEach(tx=>{
    const lean=(r()-0.5)*16;
    s+=`<path d="M${tx-9},220 Q${tx-4+lean},120 ${tx+lean},40 L${tx+10+lean},40 Q${tx+6+lean},120 ${tx+9},220 Z" fill="#2e2016"/>`;
    s+=`<path d="M${tx-9},220 Q${tx-4+lean},120 ${tx+lean},40" stroke="#3f2c1d" stroke-width="2" fill="none" opacity="0.7"/>`;
    // кроны
    for(let k=0;k<3;k++){const cx=tx+lean+(r()-0.5)*30,cy=40-k*14+r()*10;
      s+=`<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${(30+r()*16).toFixed(0)}" ry="${(16+r()*8).toFixed(0)}" fill="${k%2?'#2c6b45':'#357a4f'}" opacity="0.95"/>`;}
  });
  // лианы
  for(let i=0;i<4;i++){const x=30+i*100+r()*30;
    s+=`<path d="M${x},42 q6,40 -3,80 q-6,28 4,60" stroke="#3d6b3a" stroke-width="2" fill="none" opacity="0.7"/>
        <circle cx="${x-2}" cy="${(120+r()*40).toFixed(0)}" r="2.5" fill="#7fb24a"/>`;}
  // озеро на переднем плане
  s+=`<path d="M0,200 L400,200 L400,220 L0,220 Z" fill="#143027"/>`;
  s+=`<ellipse cx="200" cy="206" rx="210" ry="20" fill="url(#jlake${id})"/>`;
  // блики на воде
  for(let i=0;i<6;i++){const x=40+i*60+r()*30;
    s+=`<ellipse cx="${x}" cy="${(204+r()*6).toFixed(0)}" rx="${(8+r()*10).toFixed(0)}" ry="1.6" fill="#a7e0c6" opacity="0.35"/>`;}
  // кувшинки
  for(let i=0;i<4;i++){const x=70+i*80+r()*20,y=205+r()*6;
    s+=`<circle cx="${x}" cy="${y}" r="5" fill="#357a4f"/><circle cx="${x+1}" cy="${y-1}" r="1.8" fill="#cf6e8f"/>`;}
  // туман
  s+=`<ellipse cx="120" cy="150" rx="120" ry="18" fill="#bfe0c8" opacity="0.06"/>
      <ellipse cx="300" cy="170" rx="140" ry="20" fill="#bfe0c8" opacity="0.05"/>`;
  return s;
}

/* ЛЕДЯНАЯ: пики, замёрзшие озёра, северное сияние, снег */
function iceScene(W,H,id){
  const r=seeded(303);
  let s=`<defs>
    <linearGradient id="isky${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0d2436"/><stop offset="0.5" stop-color="#234a63"/><stop offset="1" stop-color="#5e8fa8"/>
    </linearGradient>
    <linearGradient id="ipeak${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eaf4fb"/><stop offset="1" stop-color="#9cc2d8"/>
    </linearGradient>
    <linearGradient id="ilake${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#bfe3f0"/><stop offset="1" stop-color="#6fa8c4"/>
    </linearGradient>
    <linearGradient id="iaur${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6db4d4" stop-opacity="0"/><stop offset="0.5" stop-color="#8fe6c4" stop-opacity="0.5"/><stop offset="1" stop-color="#b88adf" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#isky${id})"/>`;
  // северное сияние
  s+=`<path d="M0,60 Q120,20 200,55 T400,40 L400,90 Q260,70 180,95 T0,95 Z" fill="url(#iaur${id})" opacity="0.7"/>
      <path d="M0,80 Q140,50 220,80 T400,70" stroke="#8fe6c4" stroke-width="2" fill="none" opacity="0.4"/>`;
  // звёзды
  for(let i=0;i<22;i++){s+=`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*70).toFixed(0)}" r="${(0.5+r()*0.9).toFixed(1)}" fill="#dff0f8" opacity="${(0.4+r()*0.6).toFixed(2)}"/>`;}
  // дальние пики
  s+=`<path d="M0,150 L60,80 L110,150 Z" fill="#3c637c" opacity="0.8"/>
      <path d="M250,150 L320,70 L400,150 Z" fill="#3c637c" opacity="0.8"/>`;
  // главные ледяные пики
  s+=`<path d="M40,165 L130,55 L210,165 Z" fill="url(#ipeak${id})"/>
      <path d="M130,55 L150,90 L130,100 L115,86 Z" fill="#cfe5f2"/>
      <path d="M190,165 L280,75 L370,165 Z" fill="url(#ipeak${id})"/>
      <path d="M280,75 L298,108 L280,116 L266,100 Z" fill="#cfe5f2"/>`;
  // снежные шапки-блики
  s+=`<path d="M130,55 L160,98 L130,90 L108,100 Z" fill="#ffffff" opacity="0.6"/>`;
  // замёрзшее озеро
  s+=`<path d="M0,180 L400,180 L400,220 L0,220 Z" fill="#3f6f88"/>`;
  s+=`<ellipse cx="200" cy="200" rx="210" ry="22" fill="url(#ilake${id})"/>`;
  // трещины во льду
  for(let i=0;i<4;i++){const x=60+i*90+r()*20;
    s+=`<path d="M${x},190 l${(8+r()*14).toFixed(0)},${(4+r()*8).toFixed(0)} l${(-6-r()*8).toFixed(0)},${(6+r()*6).toFixed(0)}" stroke="#dff0f8" stroke-width="1" fill="none" opacity="0.55"/>`;}
  // вмёрзшие глыбы льда
  for(let i=0;i<3;i++){const x=90+i*110+r()*20,y=198+r()*6;
    s+=`<path d="M${x},${y} l8,-8 l8,8 l-4,7 l-8,0 Z" fill="#cfe5f2" opacity="0.85"/>`;}
  // падающий снег
  for(let i=0;i<24;i++){s+=`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(0.7+r()*1.1).toFixed(1)}" fill="#eaf4fb" opacity="${(0.3+r()*0.5).toFixed(2)}"/>`;}
  return s;
}

/* ТЕНЕВАЯ: бездна, разломы, тёмные шпили */
function shadeScene(W,H,id){
  const r=seeded(404);
  let s=`<defs>
    <radialGradient id="ssky${id}" cx="0.5" cy="0.4" r="0.8">
      <stop offset="0" stop-color="#2a1830"/><stop offset="0.6" stop-color="#160d1c"/><stop offset="1" stop-color="#0a060d"/>
    </radialGradient>
    <linearGradient id="srift${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#cf6e8f"/><stop offset="0.5" stop-color="#7a3a86"/><stop offset="1" stop-color="#2a1830"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#ssky${id})"/>`;
  // далёкое кольцо-портал
  s+=`<circle cx="200" cy="92" r="46" fill="none" stroke="#b88adf" stroke-width="1.5" opacity="0.35"/>
      <circle cx="200" cy="92" r="30" fill="none" stroke="#cf6e8f" stroke-width="1" opacity="0.3"/>`;
  // тёмные шпили
  s+=`<path d="M30,180 L60,60 L90,180 Z" fill="#0d0712"/>
      <path d="M300,180 L340,50 L380,180 Z" fill="#0d0712"/>
      <path d="M150,185 L185,90 L210,185 Z" fill="#120a18"/>`;
  // разлом-озеро света внизу
  s+=`<path d="M0,182 Q120,172 200,184 T400,180 L400,220 L0,220 Z" fill="#0a060d"/>`;
  s+=`<path d="M30,200 Q200,186 370,202 Q200,214 30,200 Z" fill="url(#srift${id})" opacity="0.8"/>`;
  // парящие осколки
  for(let i=0;i<10;i++){const x=r()*W,y=40+r()*150;
    s+=`<path d="M${x.toFixed(0)},${y.toFixed(0)} l4,-2 l2,4 l-4,2 Z" fill="#b88adf" opacity="${(0.25+r()*0.5).toFixed(2)}"/>`;}
  // звёздная пыль
  for(let i=0;i<18;i++){s+=`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(0.5+r()*0.8).toFixed(1)}" fill="#e0c8ef" opacity="${(0.2+r()*0.5).toFixed(2)}"/>`;}
  return s;
}

function renderMap(){
  const m=$('#map');m.innerHTML='';
  const ps=portalState();
  // шапка с уровнем портала
  const header=document.createElement('div');
  header.className='portal-header';
  header.style.gridColumn='1/-1';
  header.innerHTML=`
    <div class="portal-info">
      <span class="portal-lvl">🌀 Портал ур. ${S.portalLevel||1}/${PORTAL_MAX}</span>
      <span class="portal-sub">Открыто миров: ${ps.worlds}/5 · глубина биомов: ${['','I','II','III'][ps.maxBiome]}${(()=>{const w=S.worldCodex||{};const b=Object.keys(w.biomes||{}).length,e=Object.keys(w.events||{}).length;return (b||e)?` · 📖 мир: ${b} биом., ${e} событ.`:'';})()}</span>
    </div>
    ${(S.portalLevel||1)<PORTAL_MAX?`<button class="btn" id="portalUpBtn">Улучшить портал</button>`:'<span class="portal-max">Портал раскрыт полностью ✦</span>'}`;
  m.appendChild(header);
  if((S.portalLevel||1)<PORTAL_MAX){
    header.querySelector('#portalUpBtn').onclick=openPortalUpgrade;
  }
  // список миров
  WORLDS.forEach(w=>{
    const wUnlocked=worldUnlocked(w);
    const div=document.createElement('div');
    div.className='region region--'+w.scene+(wUnlocked?'':' locked');
    const biomeRows=w.biomes.map(b=>{
      const u=biomeUnlocked(w,b.n);
      let status='';
      if(u.ok) status=`<span class="biome-go" data-w="${w.id}" data-b="${b.n}">Странствовать →</span>`;
      else if(u.reason==='level') status=`<span class="biome-lock">🔒 нужен дракон ур. ${u.need}+</span>`;
      else status=`<span class="biome-lock">🔒 улучши портал</span>`;
      return `<div class="biome-row ${u.ok?'':'off'}">
        <span class="biome-tier">${BIOME_TIERLABEL[b.n]}</span>
        <span class="biome-name">${b.name}</span>
        <span class="biome-meta">🪙${b.gold[0]}–${b.gold[1]} · 🥚${Math.round(b.eggChance*100)}%${(S.worldExplored&&S.worldExplored[w.id+'_b'+b.n])?` · 🗺️${S.worldExplored[w.id+'_b'+b.n]}%`:''}</span>
        ${status}
      </div>`;
    }).join('');
    // владыка мира: доступен когда открыт биом III
    const boss=bossByWorld(w.id);
    let bossRow='';
    if(boss){
      const coreOpen=biomeUnlocked(w,3).ok;
      const beaten=bossDefeated(boss.id);
      bossRow=`<div class="biome-row boss-row ${coreOpen?'':'off'}">
        <span class="biome-tier">☠️ Владыка</span>
        <span class="biome-name">${boss.icon} ${boss.name}${beaten?' <span class="boss-done">✔ повержен</span>':''}</span>
        <span class="biome-meta">${beaten?'🏆 трофей получен':'🏆 трофей + ⭐ звезда'}</span>
        ${coreOpen
          ? `<span class="biome-go boss-go" data-boss="${w.id}">${beaten?'Бросить вызов вновь →':'⚔️ Бросить вызов →'}</span>`
          : `<span class="biome-lock">🔒 открой Ядро (биом III)</span>`}
      </div>`;
    }
    div.innerHTML=`
      <div class="region-art">${sceneSVG(w.scene, w.id)}
        ${wUnlocked?'':'<div class="region-lock">🔒</div>'}
        <div class="region-biome">${w.name}</div>
      </div>
      <div class="region-body">
        <h3>${w.name} ${elTag(w.el)}</h3>
        <p>${w.desc}</p>
        ${wUnlocked ? `<div class="biome-list">${biomeRows}${bossRow}</div>`
          : `<div class="btnrow"><span class="hint">Откроется при улучшении портала (ур. ${w.worldIdx})</span></div>`}
      </div>`;
    if(wUnlocked){
      div.querySelectorAll('.biome-go:not(.boss-go)').forEach(el=>el.onclick=()=>{
        const world=WORLDS.find(x=>x.id===el.dataset.w);
        openExpedition(makeRegion(world, +el.dataset.b));
      });
      div.querySelectorAll('.boss-go').forEach(el=>el.onclick=()=>openBossChallenge(el.dataset.boss));
    }
    m.appendChild(div);
  });
}

// экран вызова владыки мира: выбор дракона 100 ур + подсказки из свитков
function openBossChallenge(worldId){
  const boss=bossByWorld(worldId);
  const world=WORLDS.find(w=>w.id===worldId);
  if(!boss||!world) return;
  const ready=S.dragons.filter(d=>d.level>=100);
  const m=$('#map');
  // подсказки из собранных свитков этого мира
  const hints=LORE_SCROLLS.filter(s=>s.world===worldId && s.hint && hasScroll(s)).map(s=>`<div class="lore-hint">💡 ${s.hint}</div>`).join('');
  const beaten=bossDefeated(boss.id);
  let picker='';
  if(!ready.length){
    picker=`<div class="empty">Нужен дракон <b>100 уровня</b>, чтобы бросить вызов владыке. Расти своих драконов в странствиях и на арене!</div>`;
  } else {
    picker=`<p class="hint" style="text-align:center">Выбери бойца (только драконы 100 ур.):</p><div class="roster" style="justify-content:center">`+
      ready.map(d=>{
        const sp=speciesById(d.id);
        return `<div class="dcard boss-pick" data-uid="${d.uid}">
          <span class="lvlpill">ур.${d.level}</span>
          ${sigilHTML(sp,d.morph,'sigil',d.level)}
          <div class="dname">${d.name||sp.name}</div>
          ${elTag(sp.el)}
        </div>`;
      }).join('')+`</div>`;
  }
  m.innerHTML=`<div class="panel" style="grid-column:1/-1">
    <div class="screen-bar" style="margin-top:0"><button class="home-btn" id="bossBack">← Странствия</button>
      <span class="screen-bar-title">${boss.icon} ${boss.name}</span></div>
    <p class="lede" style="text-align:center">«${boss.lore}»</p>
    <div class="boss-info">
      <div class="boss-stat-line">${beaten?'<span class="boss-done">✔ Уже повержен — можно бросить вызов вновь ради славы</span>':'🏆 Награда: трофей-украшение + ⭐ звезда владык + щедрая добыча'}</div>
      ${hints||'<div class="hint" style="text-align:center">Собери свитки легенд этого мира — в них скрыты подсказки о владыке.</div>'}
    </div>
    ${picker}
  </div>`;
  $('#bossBack').onclick=renderMap;
  m.querySelectorAll('.boss-pick').forEach(card=>card.onclick=()=>{
    const d=S.dragons.find(x=>x.uid===+card.dataset.uid);
    if(!d) return;
    d.curHp=statsOf(d).maxHp; // владыка ждёт честного боя — дракон отдохнувший
    switchView('arena');
    startBattle(d,{id:boss.speciesBase,level:100,morph:'common'},Math.round(100*(8+5*4)*1.6),boss);
  });
}

// экран улучшения портала
function openPortalUpgrade(){
  hintOnce('portal','Каждый уровень портала открывает новые миры и глубины. В глубоких биомах — редкие яйца, легендарные реликвии и владыки!');
  const lvl=S.portalLevel||1;
  if(lvl>=PORTAL_MAX)return;
  const cost=portalCost(lvl);
  const next=PORTAL_TABLE[lvl+1];
  const cur=PORTAL_TABLE[lvl];
  let unlockNote='';
  if(next.worlds>cur.worlds) unlockNote=`Откроется новый мир: <b>${WORLDS[next.worlds-1].name}</b>`;
  else if(next.maxBiome>cur.maxBiome) unlockNote=`Откроется глубина: <b>биом ${['','I','II','III'][next.maxBiome]}</b> (нужен дракон ур. ${BIOME_MIN_LEVEL[next.maxBiome]}+)`;
  else unlockNote='Усилит награды странствий';
  const canPay=S.gold>=cost.gold && S.dust>=(cost.dust||0);
  const m=$('#map');
  m.innerHTML=`<div class="panel" style="grid-column:1/-1">
    <h2>🌀 Улучшение портала</h2>
    <p class="lede">Портал ур. ${lvl} → <b>${lvl+1}</b></p>
    <p>${unlockNote}</p>
    <div class="portal-cost">Стоимость: <b>🪙 ${cost.gold}</b>${cost.dust?` + <b>✦ ${cost.dust}</b>`:''}</div>
    <div class="btnrow" style="margin-top:14px">
      <button class="btn" id="doPortalUp" ${canPay?'':'disabled'}>${canPay?'Улучшить':'Недостаёт ресурсов'}</button>
      <button class="btn ghost" id="portalBack">← Назад</button>
    </div>
  </div>`;
  $('#portalBack').onclick=renderMap;
  if(canPay) $('#doPortalUp').onclick=()=>{
    S.gold-=cost.gold; if(cost.dust)S.dust-=cost.dust;
    S.portalLevel=lvl+1;
    persist(); renderLedger();
    toast(`<b>Портал улучшен до ур. ${S.portalLevel}!</b> ${unlockNote}`);
    renderMap();
  };
}
function maxLevel(){return S.dragons.reduce((a,d)=>Math.max(a,d.level),0);}
function highestDragonLevel(){return maxLevel();}

function openExpedition(region){
  const avail=S.dragons.filter(d=>d.curHp>0);
  if(!avail.length){toast('Нет драконов в силах странствовать.');return;}
  switchView('explore');
  const m=$('#map');
  m.innerHTML=`<div class="panel exp-panel" style="grid-column:1/-1;padding:0;overflow:hidden">
    <div class="exp-banner">${sceneSVG(region.scene, region.id+'-exp')}
      <div class="exp-banner-text">
        <div class="exp-biome">${region.biome}</div>
        <h2>${region.name}</h2>
        <p>${region.desc}</p>
      </div>
    </div>
    <div style="padding:16px">
      <p class="lede" style="margin-top:0">Кого отправишь в путь? Сильный дракон вернётся с большей добычей, слабого ждут раны.</p>
      <div class="roster" id="expRoster"></div>
      <div class="btnrow"><button class="btn ghost" id="backMap">← Назад к карте</button></div>
    </div>
  </div>`;
  const rr=$('#expRoster');
  avail.forEach(d=>rr.appendChild(dragonCard(d,{onclick:()=>startFlight(region,d)})));
  $('#backMap').onclick=renderMap;
}


/* ============================================================
   ЕДИНАЯ НАВИГАЦИЯ — 5 разделов (нижняя панель). Прочие функции — внутри.
   ============================================================ */
const TAB_OF={hub:'hub',explore:'explore',lair:'lair',codex:'codex',profile:'profile'};
// вторичные экраны подсвечивают ближайший раздел
const TAB_PARENT={hatch:'lair',roost:'lair',spire:'lair',arena:'explore',forge:'hub'};
function renderTabbar(active){
  const bar=document.getElementById('tabbar'); if(!bar)return;
  const cur=TAB_OF[active]||TAB_PARENT[active]||'hub';
  bar.querySelectorAll('.tabbtn').forEach(b=>{
    const on=b.dataset.tab===cur; b.classList.toggle('on',on);
    if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
    // бейдж на «Команде» — готовый подарок/яйца, на «Кодексе» — новые виды
    let badge='';
    if(b.dataset.tab==='lair' && (S.chestReady||eggCount()>0)) badge=S.chestReady?'🎁':String(eggCount());
    if(b.dataset.tab==='profile'){ const q=(S.quests||[]).filter(x=>!x.claimed&&x.done).length; if(q)badge='●'; }
    let el=b.querySelector('.tb-badge');
    if(badge){ if(!el){el=document.createElement('span');el.className='tb-badge';b.appendChild(el);} el.textContent=badge; }
    else if(el){ el.remove(); }
  });
}
function bindTabbar(){
  const bar=document.getElementById('tabbar'); if(!bar||bar._bound)return; bar._bound=true;
  bar.querySelectorAll('.tabbtn').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.tab)));
}

/* ===== ПРОФИЛЬ: прогресс игрока + служебное (звук/сейв/доступность/рынок) ===== */
function renderProfile(){
  const box=$('#profileBody'); if(!box)return;
  const lvl=progLevel(), dn=S.dragons.length, disc=(typeof SPECIES!=='undefined')?SPECIES.filter(sp=>S.discovered&&S.discovered[sp.id]).length:0;
  const spTot=(typeof SPECIES!=='undefined')?SPECIES.length:15;
  const milesDone=(typeof MILESTONES!=='undefined')?MILESTONES.filter(m=>milestoneClaimed(m.id)).length:0;
  const milesTot=(typeof MILESTONES!=='undefined')?MILESTONES.length:0;
  const bossesB=(typeof WORLD_BOSSES!=='undefined')?WORLD_BOSSES.filter(b=>bossDefeated(b.id)).length:0;
  const pb=(typeof pbarHTML==='function')?pbarHTML:(c,m)=>`<div class="bar"><i style="width:${m?Math.round(c/m*100):0}%"></i></div>`;
  box.innerHTML=`
    <div class="prof-hero">
      <div class="prof-badge">🐲</div>
      <div class="prof-main">
        <div class="prof-title">Драконовод · ур. ${lvl}</div>
        <div class="prof-sub">🔥 Серия входов: <b>${S.streak||0}</b> дн.</div>
      </div>
    </div>
    <div class="prof-stats">
      <div class="stat-card"><span class="sc-ic">🐉</span><b>${dn}</b><small>драконов</small></div>
      <div class="stat-card"><span class="sc-ic">📖</span><b>${disc}/${spTot}</b><small>видов</small></div>
      <div class="stat-card"><span class="sc-ic">🏅</span><b>${milesDone}/${milesTot}</b><small>вех</small></div>
      <div class="stat-card"><span class="sc-ic">☠️</span><b>${bossesB}</b><small>владык</small></div>
    </div>
    <div class="prof-sec-t">Достижения</div>
    ${pb(milesDone,milesTot||1,'rep',false)}
    <button class="prof-row tap" id="pfMiles"><span>🏅 Вехи и награды</span><span class="pf-arrow">›</span></button>
    <div class="prof-sec-t">Настройки</div>
    <div class="prof-grid">
      <button class="prof-tile tap" id="pfSound"><span class="pt-ic">${S.soundOn===false?'🔇':'🔊'}</span><span>Звук</span></button>
      <button class="prof-tile tap" id="pfA11y"><span class="pt-ic">♿</span><span>Доступность</span></button>
      <button class="prof-tile tap" id="pfMarket"><span class="pt-ic">🛒</span><span>Рынок</span></button>
      <button class="prof-tile tap" id="pfSave"><span class="pt-ic">💾</span><span>Сейв</span></button>
    </div>`;
  const go=(id,fn)=>{ const el=$('#'+id); if(el&&fn) el.onclick=fn; };
  go('pfMiles',()=>{ switchView('codex'); if(typeof showCodexTab==='function')showCodexTab('miles'); });
  go('pfSound',()=>{ S.soundOn=S.soundOn===false?true:false; if(typeof persist==='function')persist(); renderProfile(); });
  go('pfA11y', ()=> (typeof openA11y==='function')&&openA11y());
  go('pfMarket',()=>{ switchView('hub'); if(typeof openMarket==='function')openMarket(); });
  go('pfSave', ()=> (typeof openSaveManager==='function')&&openSaveManager());
}
