/* ============================================================
   11-save-init.js — СОХРАНЕНИЕ И ЗАПУСК: localStorage, миграции, idle-доход, ежедневная петля, онбординг, инициализация
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ======================= СОХРАНЕНИЕ ======================= */
const SAVE_KEY='draconis_save_v1';
// безопасная обёртка над localStorage (в песочнице может быть недоступен)
const store={
  ok:(()=>{try{const k='__t';localStorage.setItem(k,'1');localStorage.removeItem(k);return true;}catch(e){return false;}})(),
  get(){try{return localStorage.getItem(SAVE_KEY);}catch(e){return null;}},
  set(v){try{localStorage.setItem(SAVE_KEY,v);return true;}catch(e){return false;}},
  clear(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
};
let saveTimer=null;
function saveGame(now){
  S.lastSeen=Date.now();
  const ok=store.set(JSON.stringify(S));
  return ok;
}
// дебаунс-сохранение после действий
function persist(){
  if(!store.ok) return;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(saveGame,400);
}
function loadGame(){
  if(!store.ok) return false;
  const raw=store.get();
  if(!raw) return false;
  try{
    const data=JSON.parse(raw);
    if(!data||!Array.isArray(data.dragons)) return false;
    // мягкое слияние: берём сохранённое поверх дефолтов (на случай новых полей)
    S=Object.assign({},S,data);
    migrateDragons();
    return true;
  }catch(e){return false;}
}

// приведение старых сохранений к новой системе (бюджет генов + характеры)
function migrateDragons(){
  // яйца: старое число → массив типизированных (случайные стихии, поверхность)
  if(typeof S.eggs==='number'){
    const n=S.eggs; S.eggs=[];
    for(let i=0;i<n;i++) S.eggs.push({el:ELEMENTS_LIST[rnd(0,ELEMENTS_LIST.length-1)], tier:1});
  }
  if(!Array.isArray(S.eggs)) S.eggs=[];
  if(!Array.isArray(S.chests)) S.chests=[];
  if(!S.keys||typeof S.keys!=='object') S.keys={1:0,2:0,3:0};
  if(!S.decorations||typeof S.decorations!=='object') S.decorations={};
  if(!Array.isArray(S.decorOwned)) S.decorOwned=[];
  if(!Array.isArray(S.scrolls)) S.scrolls=[];
  if(!S.bossesDefeated||typeof S.bossesDefeated!=='object') S.bossesDefeated={};
  if(typeof S.ascStars!=='number') S.ascStars=0;
  if(typeof S.soundOn!=='boolean') S.soundOn=true;
  if(!S.hintsSeen||typeof S.hintsSeen!=='object') S.hintsSeen={};
  if(!S.lessons||typeof S.lessons!=='object')S.lessons={};
  if(typeof S.streak!=='number'||S.streak<1)S.streak=1;
  if(typeof S.streakShield!=='number')S.streakShield=1;
  if(!S.milestonesClaimed||typeof S.milestonesClaimed!=='object') S.milestonesClaimed={};
  if(typeof S.waveBest!=='number') S.waveBest=0;
  if(typeof S.saveVersion!=='number') S.saveVersion=1;
  if(!Array.isArray(S.telemetry)) S.telemetry=[];
  if(S.saveVersion<3){ S.arenaOffers=null; S.saveVersion=3; }
  let migrated=0;
  for(const d of S.dragons){
    // характер: назначить, если нет
    if(!d.nature){ d.nature=rollNature(); migrated++; }
    // геном: если сумма превышает потолок бюджета (старые 6/6/6/6=24) — ужать до бюджета,
    // сохранив «профиль» (пропорции), чтобы дракон не потерял индивидуальность
    if(d.genes){
      const sum=geneSum(d.genes);
      if(sum>GENE_BUDGET_MAX){
        const keys=GENE_KEYS.slice();
        // масштабируем пропорционально к целевому бюджету
        const target=GENE_BUDGET_MAX;
        const scaled={};
        keys.forEach(k=>{ scaled[k]=Math.round((d.genes[k]||0)/sum*target); });
        // подгоняем сумму точно под target
        let s=geneSum(scaled);
        while(s>target){ const k=keys.filter(k=>scaled[k]>0).sort((a,b)=>scaled[b]-scaled[a])[0]; scaled[k]--; s--; }
        while(s<target){ const k=keys.filter(k=>scaled[k]<GENE_MAX).sort((a,b)=>scaled[a]-scaled[b])[0]; scaled[k]++; s++; }
        scaled.spark=d.genes.spark;
        d.genes=scaled;
        d.curHp=Math.min(d.curHp||statsOf(d).maxHp, statsOf(d).maxHp);
      }
    } else {
      d.genes=randomGenes();
    }
  }
  if(migrated>0) persist();
}

/* ======================= IDLE-ДОХОД ======================= */
// доход в минуту: сумма уровней всех драконов × ставка
function idleRate(){
  // Работают только три наиболее развитых дракона; корневая кривая не вытесняет активную игру.
  const active=S.dragons.filter(d=>!d.reserve).sort((a,b)=>b.level-a.level).slice(0,GB.Economy.idleActiveDragons);
  return active.reduce((sum,d)=>{
    const happy=((d.happy||0)>=HAPPY_MAX)?1.15:1;
    return sum+GB.Economy.idleBasePerMinute*Math.sqrt(Math.max(1,d.level))*GB.Economy.idleLevelScale*happy;
  },0);
}
// начислить накопленное за время отсутствия (с потолком)
function collectIdle(){
  if(!S.lastSeen) return 0;
  const mins=(Date.now()-S.lastSeen)/60000;
  const capped=Math.min(mins, IDLE_CAP_HOURS*60);
  const gold=Math.floor(idleRate()*capped);
  if(gold>0) S.gold+=gold;
  return gold;
}

/* ======================= ЕЖЕДНЕВНАЯ ПЕТЛЯ ======================= */
function todayStr(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function daysBetween(a,b){
  if(!a||!b) return 999;
  return Math.round((new Date(b)-new Date(a))/86400000);
}
function weekKey(){
  const d=new Date(),start=new Date(d.getFullYear(),0,1),day=Math.floor((d-start)/86400000);
  return `${d.getFullYear()}-W${String(Math.ceil((day+start.getDay()+1)/7)).padStart(2,'0')}`;
}
const WEEKLY_STEPS=[
  {name:'Разведать окрестности',goal:3,reward:{gold:180}},
  {name:'Помочь своему дракону',goal:3,reward:{dust:35}},
  {name:'Найти след древнего пути',goal:3,reward:{gold:260,dust:20}},
  {name:'Подготовиться к открытию',goal:3,reward:{gold:320}},
  {name:'Открыть страницу легенды',goal:3,reward:{gold:450,dust:60},final:true},
];
function ensureWeekly(){
  const key=weekKey();
  if(!S.weekly||S.weekly.key!==key)S.weekly={key,step:0,progress:0,claimed:false,complete:false};
  return S.weekly;
}
function weeklyDef(){const w=ensureWeekly();return WEEKLY_STEPS[Math.min(w.step,WEEKLY_STEPS.length-1)];}
function weeklyProgress(amount=1){const w=ensureWeekly();if(w.complete||w.claimed)return;const d=weeklyDef();w.progress=Math.min(d.goal,w.progress+amount);persist();}
function claimWeekly(){
  const w=ensureWeekly(),d=weeklyDef();if(w.complete||w.claimed||w.progress<d.goal)return;
  const r=d.reward;if(r.gold)S.gold+=r.gold;if(r.dust)S.dust+=r.dust;
  if(d.final){
    const free=(typeof DECORATIONS!=='undefined')?DECORATIONS.filter(x=>!x.premium&&!(S.decorOwned||[]).includes(x.id)):[];
    if(free.length){S.decorOwned=S.decorOwned||[];S.decorOwned.push(free[0].id);}
    if(typeof addChest==='function')addChest(2);
    w.complete=true;toast('📖 Недельная легенда открыта! Получены декор и сундук.');
  }else{w.step++;w.progress=0;toast(`📖 Этап пройден: <b>${d.name}</b>. ${rewardText(r)}`);}
  renderLedger();persist();
}
// задание доступно, только если его механика уже открыта (не даём невыполнимых)
function questAvailable(id){
  if(id==='forge'||id==='recycle') return featureUnlocked('forge');
  if(id==='breed'||id==='mutate')  return featureUnlocked('roost');
  return true;
}
function rollDailyQuests(){
  const pool=[...QUEST_POOL].filter(q=>questAvailable(q.id));
  const out=[];
  for(let i=0;i<3 && pool.length;i++){
    const idx=Math.floor(Math.random()*pool.length);
    const q=pool.splice(idx,1)[0];
    // цели всегда маленькие и достижимые — никакого гринда
    out.push({id:q.id, goal:q.goalBase, prog:0, done:false, claimed:false});
  }
  return out;
}
// вызвать при входе: новый день — новый подарок и новые весёлые задания (без наказаний за пропуск)
function runDaily(){
  const today=todayStr();
  if(S.lastDaily!==today){
    const gap=daysBetween(S.lastDaily,today);
    if(!S.lastDaily)S.streak=1;
    else if(gap<=1)S.streak=(S.streak||0)+1;
    else if(gap===2&&(S.streakShield||0)>0){S.streakShield--;S.streak=(S.streak||1)+1;}
    else S.streak=Math.max(1,(S.streak||1)-1); // мягкий откат вместо полного обнуления
    // считаем, сколько дней играли всего (для приятной статистики, без давления)
    S.daysPlayed=(S.daysPlayed||0)+1;
    S.loginDay=(S.loginDay||0)+1; // позиция в 7-дневном цикле входа
    S.lastDaily=today;
    S.chestReady=true;
    // сердечки за ночь чуть остывают — драконы ждут заботы (мягко, по одному)
    S.dragons.forEach(d=>{ d.happy=Math.max(1,(d.happy||0)-1); });
  }
  if(S.questDay!==today){
    S.questDay=today;
    S.quests=rollDailyQuests();
  }
  ensureWeekly();
}
// продвижение квеста по событию
function questEvent(id, amount=1){
  let changed=false;
  for(const q of S.quests){
    if(q.id===id && !q.done){
      q.prog=Math.min(q.goal, q.prog+amount);
      if(q.prog>=q.goal){q.done=true; toast(`Задание выполнено: <b>${questText(q.id)}</b> — забери награду в поселении.`);}
      changed=true;
    }
  }
  weeklyProgress(Math.max(1,Math.min(3,amount)));
  if(changed){ renderDaily(); persist(); }
}
function questDef(id){return QUEST_POOL.find(q=>q.id===id);}
function questText(id){const d=questDef(id);return d?d.text:id;}
function rewardText(r){
  const parts=[];
  if(r.gold) parts.push(`🪙${r.gold}`);
  if(r.eggs) parts.push(`🥚${r.eggs}`);
  if(r.dust) parts.push(`✦${r.dust}`);
  return parts.join(' ');
}
function claimQuest(id){
  const q=S.quests.find(x=>x.id===id);
  if(!q||!q.done||q.claimed) return;
  const r=questDef(id).reward;
  if(r.gold) S.gold+=r.gold;
  if(r.eggs){for(let i=0;i<r.eggs;i++)addEgg(ELEMENTS_LIST[rnd(0,4)],1);}
  if(r.dust) S.dust+=r.dust;
  trackEconomy('source','quest_'+id,r);
  q.claimed=true;
  if(S.quests.length&&S.quests.every(x=>x.claimed))S.streakShield=Math.min(1,(S.streakShield||0)+1);
  floatText('+ '+rewardText(r),'#d9a441');
  toast(`Награда получена: <b>${rewardText(r)}</b>!`);
  renderLedger(); renderDaily(); persist();
}
// 7-дневный цикл входа: награда растёт, день 7 — легендарная (локально, без реальных таймеров)
const STREAK_REWARDS=[
  {gold:200, dust:15},                          // День 1 — гарантированный источник пыли
  {gold:260, dust:30},                          // День 2 — золото + пыль
  {gold:320, eggs:1},                           // День 3 — редкий ресурс (яйцо)
  {gold:420, dust:50},                          // День 4
  {gold:560, eggs:1, dust:50},                  // День 5
  {gold:760, dust:90},                          // День 6
  {gold:1400, eggs:2, dust:180, legendary:true} // День 7 — легендарная награда
];
function streakDay(){ return (((S.loginDay||1)-1)%7); } // 0..6
function chestReward(){ return STREAK_REWARDS[streakDay()]; }
function claimChest(){
  if(!S.chestReady) return;
  const r=chestReward();
  if(r.gold) S.gold+=r.gold;
  if(r.eggs){for(let i=0;i<r.eggs;i++)addEgg(ELEMENTS_LIST[rnd(0,4)], r.legendary?3:1);}
  if(r.dust) S.dust+=r.dust;
  trackEconomy('source','login_chest',r);
  if(r.legendary && typeof addChest==='function') addChest(3); // легендарный сундук в награду
  S.chestReady=false;
  floatText('ПОДАРОК ОТКРЫТ','#d9a441');
  toast(`🎁 Подарок дня ${streakDay()+1}/7: <b>${rewardText(r)}</b>${r.legendary?' 🏆 <b>ЛЕГЕНДАРНЫЙ ДЕНЬ!</b>':''}! Загляни завтра за новым.`);
  renderLedger(); renderDaily(); persist();
}

// полоса прогресса «к чему идёшь»: ближайшая разблокировка, коллекции
function progressStripHTML(){
  const lvl=(typeof progLevel==='function')?progLevel():1;
  let next=null;
  for(const k of ['forge','spire','roost']){ if(typeof featureUnlocked==='function' && !featureUnlocked(k)){ next={k,min:FEATURE_MIN[k]}; break; } }
  const unlockTxt = next ? `🔓 До «${FEATURE_NAME[next.k]}»: <b>${Math.max(1,next.min-lvl)} ур.</b>` : '🔓 Все механики открыты';
  const disc=(typeof SPECIES!=='undefined')?SPECIES.filter(sp=>S.discovered&&S.discovered[sp.id]).length:0;
  const specTot=(typeof SPECIES!=='undefined')?SPECIES.length:15;
  const seen=S.eggsSeen?Object.keys(S.eggsSeen).length:0;
  const eggPct=Math.round(seen/((typeof ELEMENTS_LIST!=='undefined'?ELEMENTS_LIST.length:5)*6)*100);
  return `<div class="progress-strip">${unlockTxt} · 🐉 Виды <b>${disc}/${specTot}</b> · 🥚 Кодекс <b>${eggPct}%</b></div>`;
}

/* ===== ПОДАРОК В ЛОГОВЕ: задачи и общий прогресс живут только в шторке поселения ===== */
function renderDaily(){
  const box=$('#dailyPanel');
  if(!box) return;
  const r=chestReward();
  box.innerHTML=`
    <div class="daily-top">
      <div class="chest-wrap">
        ${S.chestReady
          ? `<button class="btn chest-btn" id="chestBtn">🎁 Подарок дня ${streakDay()+1}/7 · ${rewardText(r)}${r.legendary?' 🏆':''}</button>`
          : `<div class="chest-done">🎁 Подарок получен! Возвращайся завтра за новым сюрпризом.</div>`}
      </div>
    </div><button class="btn ghost daily-to-hub" id="dailyToHub">Посмотреть дела в поселении</button>`;

  const cb=$('#chestBtn'); if(cb) cb.onclick=claimChest;
  const go=$('#dailyToHub'); if(go)go.onclick=()=>{switchView('hub');setTimeout(()=>setHubTasksOpen(true),50);};
}
function closeResetDialog(){ const el=$('#resetDialog'); if(el)el.remove(); }
function confirmReset(){
  closeResetDialog();
  const settlement=(S.settlement||'твоё поселение');
  const modal=document.createElement('div');
  modal.id='resetDialog'; modal.className='reset-dialog';
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','resetTitle');
  modal.innerHTML=`<div class="reset-card">
    <h2 id="resetTitle">Начать игру заново?</h2>
    <p>Будут удалены поселение <b>«${settlement}»</b>, все драконы и награды на этом устройстве.</p>
    <p class="hint">Сначала сохрани копию — её можно будет загрузить позже.</p>
    <div class="reset-actions">
      <button class="btn" id="resetExport">⬇️ Сохранить копию</button>
      <button class="btn ghost" id="resetCancel">Отмена</button>
    </div>
    <button class="danger-hold" id="resetHold" aria-describedby="resetHoldHelp"><span></span><b>Удерживай 2 секунды</b></button>
    <small id="resetHoldHelp">Отпусти кнопку, чтобы отменить удаление.</small>
  </div>`;
  document.body.appendChild(modal);
  const hold=$('#resetHold'); let timer=0;
  const cancel=()=>{ clearTimeout(timer); timer=0; hold.classList.remove('holding'); };
  const start=e=>{ e.preventDefault(); if(timer)return; hold.classList.add('holding'); timer=setTimeout(()=>{ store.clear(); location.reload(); },2000); };
  hold.addEventListener('pointerdown',start); hold.addEventListener('pointerup',cancel);
  hold.addEventListener('pointercancel',cancel); hold.addEventListener('pointerleave',cancel);
  $('#resetCancel').onclick=closeResetDialog;
  $('#resetExport').onclick=exportSave;
  modal.addEventListener('click',e=>{if(e.target===modal)closeResetDialog();});
  modal.addEventListener('keydown',e=>{if(e.key==='Escape')closeResetDialog();});
  $('#resetCancel').focus();
}

/* ===== ИНИЦИАЛИЗАЦИЯ ===== */
/* гнездо рендерится через renderHatch при открытии вкладки */

/* ===== СТАРТОВЫЙ ЭКРАН (онбординг при первом запуске) ===== */
const STARTER_DRAGONS=['ember','glacier','sporewing']; // огонь, лёд, яд
const onboard={dragon:'ember', dragonName:'', settlement:'', crack:0};
const STARTER_NAMES={ember:['Искорка','Уголёк','Рыжик'],glacier:['Снежок','Льдинка','Хрустик'],sporewing:['Листик','Спора','Мох']};
const SETTLEMENT_NAMES=['Драконьи Земли','Долина Крыльев','Тёплое Гнездо','Изумрудный Берег'];
const STARTER_ELEMENT_ICON={fire:'🔥',frost:'❄️',venom:'🍃'};
function suggestedDragonName(){const a=STARTER_NAMES[onboard.dragon]||['Дружок'];return a[Math.floor(Math.random()*a.length)];}
function starterEggHTML(id,crack=0){const sp=speciesById(id),el=sp.el;return `<div class="starter-egg egg-${el} crack-${crack}" aria-label="Яйцо стихии ${ELEMENTS[el].name}"><img src="images/eggs/egg_${el}.webp" alt=""><i></i></div>`;}

function showStartScreen(){
  const sc=$('#startScreen'); if(!sc) return;
  document.body.classList.add('start-active');
  sc.style.display='block';
  renderStartWelcome();
}

function startScreenShell(inner){
  return `<div class="start-bg">${hubSceneSVG()}</div>
    <div class="start-content">${inner}</div>`;
}

// Шаг 1: приветствие
function renderStartWelcome(){
  const sc=$('#startScreen');
  sc.dataset.step='welcome';
  sc.innerHTML=startScreenShell(`
    <div class="start-logo">
    <div class="start-logo-mark start-wake-egg">🥚</div>
      <h1 class="start-title">Драконис</h1>
      <div class="start-subtitle">Кодекс Чешуи</div>
    </div>
    <p class="start-lede">В древнем гнезде кто-то просыпается. Разбудишь его?</p>
    <button class="btn start-cta" id="startBegin">Разбудить яйцо</button>`);
  $('#startBegin').onclick=renderStartPickDragon;
}

// Шаг 2: выбор стартового яйца — без характеристик взрослого дракона
function renderStartPickDragon(){
  const sc=$('#startScreen');
  sc.dataset.step='dragon-pick';
  const cards=STARTER_DRAGONS.map(id=>{
    const sp=speciesById(id);
    const sel=onboard.dragon===id?' sel':'';
    const mood=sp.el==='fire'?'Смелое и тёплое':sp.el==='frost'?'Спокойное и верное':'Любопытное и хитрое';
    return `<button class="start-dcard egg-card${sel}" data-pick="${id}">
      <div class="start-dcard-art">${starterEggHTML(id)}</div>
      <div class="start-dcard-name">${STARTER_ELEMENT_ICON[sp.el]||'✦'} ${ELEMENTS[sp.el].name}</div>
      <div class="start-dcard-lore">${mood}</div>
    </button>`;
  }).join('');
  sc.innerHTML=startScreenShell(`
    <div class="start-step">Шаг 1 из 3</div>
    <h2 class="start-h2">Какое яйцо тебя зовёт?</h2>
    <p class="start-hint">Выбирай сердцем. Остальных драконов встретишь позже.</p>
    <div class="start-dragons">${cards}</div>
    <div class="start-nav">
      <button class="btn ghost" id="startBack">← Назад</button>
      <button class="btn" id="startNext">Далее →</button>
    </div>`);
  sc.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{ onboard.dragon=b.dataset.pick; renderStartPickDragon(); });
  $('#startBack').onclick=renderStartWelcome;
  $('#startNext').onclick=()=>{onboard.crack=0;renderStartEggHatch();};
}

function renderStartEggHatch(){
  const sc=$('#startScreen');sc.dataset.step='egg-hatch';
  const ready=onboard.crack>=3;
  sc.innerHTML=startScreenShell(`<div class="start-step">Пробуждение</div><h2 class="start-h2">${ready?'Он проснулся!':'Коснись яйца'}</h2>
    <button class="starter-hatch${ready?' ready':''}" id="starterHatch">${ready?dragonVisual(onboard.dragon,1):starterEggHTML(onboard.dragon,onboard.crack)}</button>
    <p class="start-hint">${ready?'Твой новый друг готов познакомиться.':'Каждое касание помогает малышу выбраться.'}</p>
    ${ready?'<button class="btn start-cta" id="starterMeet">Познакомиться</button>':'<div class="crack-progress">'+[1,2,3].map(n=>`<i class="${onboard.crack>=n?'on':''}"></i>`).join('')+'</div>'}`);
  $('#starterHatch').onclick=()=>{if(ready)return;onboard.crack++;renderStartEggHatch();};
  const meet=$('#starterMeet');if(meet)meet.onclick=renderStartNameDragon;
}

// Шаг 3: имя дракона
function renderStartNameDragon(){
  const sc=$('#startScreen');
  sc.dataset.step='dragon-name';
  const sp=speciesById(onboard.dragon);
  sc.innerHTML=startScreenShell(`
    <div class="start-step">Шаг 2 из 3</div>
    <h2 class="start-h2">Как зовут твоего дракона?</h2>
    <div class="start-chosen">${dragonVisual(onboard.dragon,1)}<div class="start-chosen-name">${sp.name}</div></div>
    <input type="text" class="start-input" id="startDragonName" maxlength="20" placeholder="Имя можно изменить позже" value="${onboard.dragonName||suggestedDragonName()}">
    <div class="start-nav">
      <button class="btn ghost" id="startBack">← Назад</button>
      <button class="btn" id="startNext">Далее →</button>
    </div>`);
  const inp=$('#startDragonName'); setTimeout(()=>inp&&inp.focus(),50);
  $('#startBack').onclick=renderStartEggHatch;
  $('#startNext').onclick=()=>{ onboard.dragonName=inp.value.trim(); renderStartNameSettlement(); };
}

// Шаг 4: имя поселения
function renderStartNameSettlement(){
  const sc=$('#startScreen');
  sc.dataset.step='settlement-name';
  sc.innerHTML=startScreenShell(`
    <div class="start-step">Шаг 3 из 3</div>
    <h2 class="start-h2">Назови свои земли</h2>
    <p class="start-hint">Как будет называться твоё драконье поселение?</p>
    <div class="start-settlement-ic">🏰</div>
    <input type="text" class="start-input" id="startSettlement" maxlength="24" placeholder="Название можно изменить позже" value="${onboard.settlement||SETTLEMENT_NAMES[0]}">
    <button class="btn ghost" id="randomSettlement">↻ Другое название</button>
    <div class="start-nav">
      <button class="btn ghost" id="startBack">← Назад</button>
      <button class="btn start-cta" id="startFinish">🐉 Начать игру!</button>
    </div>`);
  const inp=$('#startSettlement'); setTimeout(()=>inp&&inp.focus(),50);
  $('#startBack').onclick=renderStartNameDragon;
  $('#randomSettlement').onclick=()=>{inp.value=SETTLEMENT_NAMES[Math.floor(Math.random()*SETTLEMENT_NAMES.length)];};
  $('#startFinish').onclick=()=>{ onboard.settlement=inp.value.trim(); finishOnboarding(); };
}

// Завершение: создаём игру с выбором игрока
function finishOnboarding(){
  newGameFromOnboard();
  document.body.classList.remove('start-active');
  const sc=$('#startScreen'); if(sc){ sc.style.display='none'; sc.innerHTML=''; }
  runDaily();
  renderAll();
  renderDaily();
  switchView('hub');
  const dn=onboard.dragonName||speciesById(onboard.dragon).name;
  toast(`Добро пожаловать в ${S.settlement||'Драконьи Земли'}! ${dn} рад начать путь с тобой 🐉`);
}

function newGameFromOnboard(){
  S.gold=GB.Economy.startingGold; S.dust=GB.Economy.startingDust; S.eggs=[];
  addDragon(onboard.dragon,2,'common',{atk:2,def:2,hp:2,spd:2,spark:false},1);
  const d=S.dragons[0];
  if(onboard.dragonName) d.name=onboard.dragonName;
  // стартовая реликвия под стихию дракона (или базовая)
  addArtifact('emberfang',1);
  addEgg(speciesById(onboard.dragon).el,1,1,{silent:true});
  S.sel=d.uid;
  S.settlement=onboard.settlement||'Драконьи Земли';
  S.tutorialGuard=true; // первый бой — гарантированная победа
  S.firstHour={phase:'first_flight',timingAssists:2,safeFlight:true};
  S.arcadeOn=true;
  trackEvent('onboarding_complete',{starter:onboard.dragon});
}

function newGame(){
  S.gold=GB.Economy.startingGold; S.dust=GB.Economy.startingDust; S.eggs=[];
  addDragon('ember',2,'common',{atk:2,def:2,hp:2,spd:2,spark:false},1);
  addArtifact('emberfang',1);
  addEgg('fire',1,1,{silent:true});
  S.sel=S.dragons[0].uid;
  S.settlement='Драконьи Земли';
  S.tutorialGuard=true;
  S.arcadeOn=true;
}

const loaded=loadGame();
if(typeof initGameIconObserver==='function') initGameIconObserver();
// idle-доход за время отсутствия (только при загрузке сохранения)
let idleGold=0;
if(loaded){ idleGold=collectIdle(); }

if(loaded){
  runDaily();
  renderAll();
  renderDaily();
  if(typeof applyA11y==='function')applyA11y();
  renderHub(); // игра открывается на главном экране
  let msg='С возвращением! Драконы скучали по тебе 🐉';
  if(idleGold>0) msg+=` Пока тебя не было, в логове накопилось <b>${idleGold}🪙</b>.`;
  toast(msg);
} else {
  // первый запуск — приветственный экран с выбором дракона
  showStartScreen();
}

// автосохранение при уходе со страницы и периодически.
// На мобильных (особенно iOS Safari) beforeunload часто НЕ срабатывает —
// поэтому дублируем на pagehide и на сворачивание вкладки (visibilitychange).
window.addEventListener('beforeunload', saveGame);
window.addEventListener('pagehide', saveGame);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') saveGame(); });
setInterval(()=>{ if(store.ok) saveGame(); }, 30000);

/* ===== ЭКСПОРТ / ИМПОРТ СЕЙВА =====
   Страховка от потери localStorage и перенос между устройствами. */
function exportSave(){
  saveGame(); // зафиксировать актуальное состояние
  const data=JSON.stringify(S);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const d=new Date();
  const stamp=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  a.href=url; a.download='draconis-save-'+stamp+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('💾 Сейв выгружен в файл. Храни его как сокровище!');
}
function importSaveFromFile(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(!data || !Array.isArray(data.dragons)) throw new Error('не похоже на сейв Дракониса');
      S=Object.assign({},S,data);
      migrateDragons();
      saveGame();
      toast('<b>💾 Сейв загружен!</b> Добро пожаловать обратно.');
      renderLedger(); switchView('hub');
    }catch(e){
      toast('⚠ Не удалось прочитать файл: '+e.message);
    }
  };
  reader.readAsText(file);
}
function openSaveManager(){
  const box=$('#profileBody'); if(!box) return;
  box.innerHTML=`<div class="panel save-manager" style="margin:0">
    <div class="screen-bar" style="margin-top:0"><button class="home-btn" id="svBack">← Профиль</button>
      <span class="screen-bar-title">💾 Сохранение</span></div>
    <p class="lede">Выгрузи сейв в файл, чтобы не потерять прогресс или перенести игру на другое устройство.</p>
    <div class="btnrow" style="flex-direction:column;gap:10px">
      <button class="btn" id="svExport">⬇️ Выгрузить сейв в файл</button>
      <label class="btn ghost" style="text-align:center;cursor:pointer">⬆️ Загрузить сейв из файла
        <input type="file" id="svImport" accept=".json,application/json" style="display:none">
      </label>
    </div>
    <p class="hint">Загрузка файла <b>заменит</b> текущий прогресс. Сначала выгрузи текущий сейв, если он дорог.</p>
    <div class="danger-zone">
      <h3>Для взрослого</h3>
      <p>Удаление полностью начинает игру заново на этом устройстве.</p>
      <button class="btn danger" id="svReset">Начать игру заново</button>
    </div>
  </div>`;
  $('#svBack').onclick=renderProfile;
  $('#svExport').onclick=exportSave;
  $('#svImport').addEventListener('change',(e)=>{
    const f=e.target.files&&e.target.files[0];
    if(f) importSaveFromFile(f);
  });
  $('#svReset').onclick=confirmReset;
}
