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
  if(!S.milestonesClaimed||typeof S.milestonesClaimed!=='object') S.milestonesClaimed={};
  if(typeof S.waveBest!=='number') S.waveBest=0;
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
  // полностью счастливый дракон приносит на 20% больше
  const sumLvl=S.dragons.reduce((a,d)=>a+d.level*(((d.happy||0)>=HAPPY_MAX)?1.2:1),0);
  return sumLvl*IDLE_RATE_PER_DRAGON;
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
}
// продвижение квеста по событию
function questEvent(id, amount=1){
  let changed=false;
  for(const q of S.quests){
    if(q.id===id && !q.done){
      q.prog=Math.min(q.goal, q.prog+amount);
      if(q.prog>=q.goal){q.done=true; toast(`Задание выполнено: <b>${questText(q.id)}</b> — забери награду в Логове.`);}
      changed=true;
    }
  }
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
  q.claimed=true;
  floatText('+ '+rewardText(r),'#d9a441');
  toast(`Награда получена: <b>${rewardText(r)}</b>!`);
  renderLedger(); renderDaily(); persist();
}
// 7-дневный цикл входа: награда растёт, день 7 — легендарная (локально, без реальных таймеров)
const STREAK_REWARDS=[
  {gold:200},                                   // День 1 — золото
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

/* ===== РЕНДЕР ЕЖЕДНЕВНОЙ ПАНЕЛИ (в Логове) ===== */
function renderDaily(){
  const box=$('#dailyPanel');
  if(!box) return;
  const r=chestReward();
  const questHTML=S.quests.map(q=>{
    const def=questDef(q.id);
    const pct=Math.round(q.prog/q.goal*100);
    return `<div class="quest${q.done?' done':''}">
      <div class="quest-ic">${def.icon}</div>
      <div class="quest-main">
        <div class="quest-text">${def.text} <span class="quest-prog">${q.prog}/${q.goal}</span></div>
        <div class="qbar"><i style="width:${pct}%"></i></div>
      </div>
      ${q.claimed
        ? '<span class="quest-claimed">✓</span>'
        : q.done
          ? `<button class="btn quest-claim" data-claim="${q.id}">${rewardText(def.reward)}</button>`
          : `<span class="quest-reward">${rewardText(def.reward)}</span>`}
    </div>`;
  }).join('');

  box.innerHTML=`
    ${progressStripHTML()}
    <div class="daily-top">
      <div class="chest-wrap">
        ${S.chestReady
          ? `<button class="btn chest-btn" id="chestBtn">🎁 Подарок дня ${streakDay()+1}/7 · ${rewardText(r)}${r.legendary?' 🏆':''}</button>`
          : `<div class="chest-done">🎁 Подарок получен! Возвращайся завтра за новым сюрпризом.</div>`}
      </div>
    </div>
    <div class="quests-head">✨ Весёлые дела на сегодня</div>
    <div class="quests">${questHTML||'<span class="hint">Новые дела появятся завтра.</span>'}</div>
    ${store.ok
      ? '<div class="save-row"><span class="save-ok">💾 Игра сохраняется сама</span><button class="save-reset" id="resetBtn">Начать заново</button></div>'
      : '<p class="hint" style="color:var(--ember)">⚠ Чтобы игра запоминалась, скачай файл и открой его на компьютере (двойным щелчком).</p>'}`;

  const cb=$('#chestBtn'); if(cb) cb.onclick=claimChest;
  box.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>claimQuest(b.dataset.claim));
  const rb=$('#resetBtn'); if(rb) rb.onclick=confirmReset;
}
let resetArmed=false;
function confirmReset(){
  const btn=$('#resetBtn');
  if(!resetArmed){
    resetArmed=true;
    if(btn){btn.textContent='Точно? Нажми ещё раз';btn.classList.add('arm');}
    setTimeout(()=>{resetArmed=false;const b=$('#resetBtn');if(b){b.textContent='Начать заново';b.classList.remove('arm');}},3000);
    return;
  }
  store.clear();
  location.reload();
}

/* ===== ИНИЦИАЛИЗАЦИЯ ===== */
/* гнездо рендерится через renderHatch при открытии вкладки */

/* ===== СТАРТОВЫЙ ЭКРАН (онбординг при первом запуске) ===== */
const STARTER_DRAGONS=['ember','glacier','sporewing']; // огонь, лёд, яд
const onboard={dragon:'ember', dragonName:'', settlement:''};

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
  sc.innerHTML=startScreenShell(`
    <div class="start-logo">
      <div class="start-logo-mark">🐉</div>
      <h1 class="start-title">Драконис</h1>
      <div class="start-subtitle">Кодекс Чешуи</div>
    </div>
    <p class="start-lede">Добро пожаловать, драконовод! Тебя ждут земли, полные драконьих яиц, древних реликвий и верных крылатых друзей. Высиживай, выращивай и собери их всех!</p>
    <button class="btn start-cta" id="startBegin">✨ Начать путь</button>`);
  $('#startBegin').onclick=renderStartPickDragon;
}

// Шаг 2: выбор первого дракона
function renderStartPickDragon(){
  const sc=$('#startScreen');
  const cards=STARTER_DRAGONS.map(id=>{
    const sp=speciesById(id);
    const sel=onboard.dragon===id?' sel':'';
    return `<button class="start-dcard${sel}" data-pick="${id}">
      <div class="start-dcard-art">${dragonVisual(id,1)}</div>
      <div class="start-dcard-name">${sp.name}</div>
      ${elTag(sp.el)}
      <div class="start-dcard-lore">${sp.lore}</div>
    </button>`;
  }).join('');
  sc.innerHTML=startScreenShell(`
    <div class="start-step">Шаг 1 из 3</div>
    <h2 class="start-h2">Выбери первого дракона</h2>
    <p class="start-hint">С ним начнётся твоё странствие. Не волнуйся — позже ты сможешь приручить и остальных!</p>
    <div class="start-dragons">${cards}</div>
    <div class="start-nav">
      <button class="btn ghost" id="startBack">← Назад</button>
      <button class="btn" id="startNext">Далее →</button>
    </div>`);
  sc.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{ onboard.dragon=b.dataset.pick; renderStartPickDragon(); });
  $('#startBack').onclick=renderStartWelcome;
  $('#startNext').onclick=renderStartNameDragon;
}

// Шаг 3: имя дракона
function renderStartNameDragon(){
  const sc=$('#startScreen');
  const sp=speciesById(onboard.dragon);
  sc.innerHTML=startScreenShell(`
    <div class="start-step">Шаг 2 из 3</div>
    <h2 class="start-h2">Как зовут твоего дракона?</h2>
    <div class="start-chosen">${dragonVisual(onboard.dragon,1)}<div class="start-chosen-name">${sp.name}</div></div>
    <input type="text" class="start-input" id="startDragonName" maxlength="20" placeholder="Придумай имя (или пропусти)" value="${onboard.dragonName}">
    <div class="start-nav">
      <button class="btn ghost" id="startBack">← Назад</button>
      <button class="btn" id="startNext">Далее →</button>
    </div>`);
  const inp=$('#startDragonName'); setTimeout(()=>inp&&inp.focus(),50);
  $('#startBack').onclick=renderStartPickDragon;
  $('#startNext').onclick=()=>{ onboard.dragonName=inp.value.trim(); renderStartNameSettlement(); };
}

// Шаг 4: имя поселения
function renderStartNameSettlement(){
  const sc=$('#startScreen');
  sc.innerHTML=startScreenShell(`
    <div class="start-step">Шаг 3 из 3</div>
    <h2 class="start-h2">Назови свои земли</h2>
    <p class="start-hint">Как будет называться твоё драконье поселение?</p>
    <div class="start-settlement-ic">🏰</div>
    <input type="text" class="start-input" id="startSettlement" maxlength="24" placeholder="Например: Драконьи Земли" value="${onboard.settlement}">
    <div class="start-nav">
      <button class="btn ghost" id="startBack">← Назад</button>
      <button class="btn start-cta" id="startFinish">🐉 Начать игру!</button>
    </div>`);
  const inp=$('#startSettlement'); setTimeout(()=>inp&&inp.focus(),50);
  $('#startBack').onclick=renderStartNameDragon;
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
  addDragon(onboard.dragon,2,'common',{atk:2,def:2,hp:2,spd:2,spark:false},1);
  const d=S.dragons[0];
  if(onboard.dragonName) d.name=onboard.dragonName;
  // стартовая реликвия под стихию дракона (или базовая)
  addArtifact('emberfang',1);
  S.dust=60;
  S.sel=d.uid;
  S.settlement=onboard.settlement||'Драконьи Земли';
  S.tutorialGuard=true; // первый бой — гарантированная победа
}

function newGame(){
  addDragon('ember',2,'common',{atk:2,def:2,hp:2,spd:2,spark:false},1);
  addArtifact('emberfang',1);
  S.dust=60;
  S.sel=S.dragons[0].uid;
  S.settlement='Драконьи Земли';
  S.tutorialGuard=true;
}

const loaded=loadGame();
// idle-доход за время отсутствия (только при загрузке сохранения)
let idleGold=0;
if(loaded){ idleGold=collectIdle(); }

if(loaded){
  runDaily();
  renderAll();
  renderDaily();
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
  const wrap=$('#hubWrap'); if(!wrap) return;
  wrap.innerHTML=`<div class="panel" style="margin:0">
    <div class="screen-bar" style="margin-top:0"><button class="home-btn" id="svBack">← Поселение</button>
      <span class="screen-bar-title">💾 Сохранение</span></div>
    <p class="lede">Выгрузи сейв в файл, чтобы не потерять прогресс или перенести игру на другое устройство.</p>
    <div class="btnrow" style="flex-direction:column;gap:10px">
      <button class="btn" id="svExport">⬇️ Выгрузить сейв в файл</button>
      <label class="btn ghost" style="text-align:center;cursor:pointer">⬆️ Загрузить сейв из файла
        <input type="file" id="svImport" accept=".json,application/json" style="display:none">
      </label>
    </div>
    <p class="hint">Загрузка файла <b>заменит</b> текущий прогресс. Сначала выгрузи текущий сейв, если он дорог.</p>
  </div>`;
  $('#svBack').onclick=renderHub;
  $('#svExport').onclick=exportSave;
  $('#svImport').addEventListener('change',(e)=>{
    const f=e.target.files&&e.target.files[0];
    if(f) importSaveFromFile(f);
  });
}
