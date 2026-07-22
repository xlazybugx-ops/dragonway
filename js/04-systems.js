/* ============================================================
   04-systems.js — СИСТЕМЫ: утилиты, типизированные яйца, выдача/дроп артефактов, переработка в пыль
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ======================= УТИЛИТЫ ======================= */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;

/* ===== ЗВУК (WebAudio, синтез — без файлов) =====
   6 коротких эффектов. Включается первым касанием (политика браузеров).
   Тумблер 🔊/🔇 в хабе, состояние в S.soundOn. */
let _actx=null;
function _audio(){ if(!_actx){ try{_actx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} } return _actx; }
function sfx(kind){
  if(S && S.soundOn===false) return;
  const ctx=_audio(); if(!ctx) return;
  if(ctx.state==='suspended'){ ctx.resume().catch(()=>{}); }
  const t=ctx.currentTime;
  const tone=(freq,start,dur,type='square',vol=0.08,slide=0)=>{
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t+start);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+start+dur);
    g.gain.setValueAtTime(vol,t+start);
    g.gain.exponentialRampToValueAtTime(0.001,t+start+dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t+start); o.stop(t+start+dur+0.02);
  };
  switch(kind){
    case 'hit':   tone(180,0,0.08,'square',0.07,-80); break;
    case 'crit':  tone(120,0,0.12,'sawtooth',0.1,-60); tone(240,0.03,0.1,'square',0.07,-120); vibrate(35); break;
    case 'win':   tone(523,0,0.12,'triangle',0.09); tone(659,0.12,0.12,'triangle',0.09); tone(784,0.24,0.2,'triangle',0.1); vibrate([40,60,40]); break;
    case 'lose':  tone(220,0,0.25,'triangle',0.08,-120); break;
    case 'hatch': tone(392,0,0.1,'triangle',0.08); tone(587,0.1,0.16,'triangle',0.09,60); vibrate(30); break;
    case 'chest': tone(330,0,0.09,'square',0.07); tone(494,0.09,0.09,'square',0.08); tone(659,0.18,0.14,'square',0.09); break;
    case 'coin':  tone(880,0,0.06,'square',0.06); tone(1175,0.05,0.09,'square',0.06); break;
  }
}
/* ===== ВИБРАЦИЯ (мобильные) ===== */
function vibrate(pattern){
  if(S && S.a11y && S.a11y.vibrationOff) return;
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}
/* ===== УРОКИ ВЕЛЛЫ: воспроизводимые, завершаются действием ===== */
const TUTORIALS={
  battle:{icon:'⚔️',title:'Первый ход',text:'Выбери подсвеченный приём. Мана растёт после каждого хода.',view:'arena',target:'#moveBox .move:not(:disabled)',action:'Применить любой приём'},
  forge:{icon:'🔨',title:'Улучшение реликвии',text:'Выбери реликвию, посмотри результат и нажми «Ковать».',view:'forge',target:'#forgeBody .btn:not(:disabled)',action:'Улучшить одну реликвию'},
  treasury:{icon:'🗝️',title:'Сокровищница',text:'Ключ открывает мини-игру. Попади в золотой центр для бонуса.',view:'hub',target:'#hubWrap button',action:'Открыть один сундук'},
  portal:{icon:'🗺️',title:'Новые глубины',text:'Уровень портала открывает миры и более редкие находки.',view:'explore',target:'#portalUp',action:'Улучшить портал'},
  flight:{icon:'🪽',title:'Управление полётом',text:'Веди дракона пальцем или клавишами. Лети к светящимся точкам.',view:'explore',target:'#flightFs canvas',action:'Долететь до первой точки'},
  hatch:{icon:'🥚',title:'Вылупление',text:'Выбери яйцо и помоги ему раскрыться. Стихия определяет вид.',view:'hatch',target:'#hatchWrap button:not(:disabled)',action:'Высидеть одно яйцо'},
  lair:{icon:'💖',title:'Забота о драконе',text:'Еда, ласка и отдых помогают дракону быть готовым к приключению.',view:'lair',target:'#w2Plat',action:'Позаботиться о драконе'},
};
const LESSON_FOR_VIEW={arena:'battle',forge:'forge',explore:'flight',hatch:'hatch',lair:'lair'};
let lessonSessionShown=0;
function lessonState(id){ if(!S.lessons)S.lessons={}; return S.lessons[id]||(S.lessons[id]={status:'new',shown:0}); }
function closeLesson(){ const o=$('#lessonOverlay');if(o)o.remove();document.body.classList.remove('lesson-open'); }
function showLesson(id,opts={}){
  const def=TUTORIALS[id];if(!def)return;
  const st=lessonState(id);if(!opts.replay&&st.status!=='new')return;
  if(!opts.replay&&lessonSessionShown>=2)return;
  closeLesson();st.status='shown';st.shown=(st.shown||0)+1;S.hintsSeen=S.hintsSeen||{};S.hintsSeen[id]=true;persist();
  if(!opts.replay)lessonSessionShown++;
  const target=document.querySelector(def.target||'');let mark='';
  if(target){const r=target.getBoundingClientRect();mark=`<div class="lesson-mark" style="left:${Math.max(6,r.left-8)}px;top:${Math.max(6,r.top-8)}px;width:${Math.min(innerWidth-12,r.width+16)}px;height:${r.height+16}px"></div>`;}
  const o=document.createElement('div');o.id='lessonOverlay';o.className='lesson-overlay';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-labelledby','lessonTitle');
  o.innerHTML=`${mark}<div class="lesson-card"><div class="lesson-vella">🐉</div><div class="lesson-copy"><small>Совет Веллы</small><h2 id="lessonTitle">${def.icon} ${def.title}</h2><p>${def.text}</p><em>Попробуй: ${def.action}</em></div><div class="lesson-actions"><button class="btn" id="lessonGo">Понятно</button><button class="btn ghost" id="lessonLater">Позже</button></div></div>`;
  document.body.appendChild(o);document.body.classList.add('lesson-open');
  $('#lessonGo').onclick=closeLesson;$('#lessonLater').onclick=()=>{st.status='skipped';persist();closeLesson();};$('#lessonGo').focus();
}
function completeLesson(id){const st=lessonState(id);if(st.status==='complete')return;st.status='complete';st.completedAt=Date.now();persist();}
function hintOnce(id,html){
  if(!TUTORIALS[id])TUTORIALS[id]={icon:'💡',title:'Подсказка',text:String(html).replace(/<[^>]+>/g,''),view:document.body.dataset.view||'hub',action:'Попробовать подсказку'};
  const st=lessonState(id);
  if(S.hintsSeen&&S.hintsSeen[id]&&st.status==='new'){st.status='shown';st.shown=1;persist();return;}
  showLesson(id);
}
function renderScreenHelp(v){
  let b=$('#screenHelp');if(b)b.remove();const id=LESSON_FOR_VIEW[v];if(!id)return;
  b=document.createElement('button');b.id='screenHelp';b.className='screen-help';b.textContent='?';b.setAttribute('aria-label','Открыть совет Веллы');b.onclick=()=>showLesson(id,{replay:true});document.body.appendChild(b);
}
const pick=a=>a[Math.floor(Math.random()*a.length)];

// УВЕДОМЛЕНИЯ: очередь с приоритетом (critical/important/info/deco), по одному за раз
const _TOAST_PRIO={critical:0,important:1,info:2,deco:3};
const _toastQ=[]; let _toastBusy=false;
function toast(html,prio){
  _toastQ.push({html, p:(_TOAST_PRIO[prio]!=null?_TOAST_PRIO[prio]:2)});
  _toastQ.sort((a,b)=>a.p-b.p); // критические — вперёд
  if(!_toastBusy) _toastFlush();
}
function _toastFlush(){
  const t=$('#toast'); if(!t){_toastBusy=false;return;}
  if(!_toastQ.length){_toastBusy=false; return;}
  _toastBusy=true; const it=_toastQ.shift();
  t.className=''; t.classList.add('show'); if(it.p===0)t.classList.add('prio-critical'); else if(it.p===1)t.classList.add('prio-important');
  // UI-РЕВИЗИЯ v38: крестик закрытия + закрытие тапом по подсказке
  t.innerHTML='<span class="toast-body">'+it.html+'</span><button class="toast-x" aria-label="Закрыть">✕</button>';
  const _close=()=>{ clearTimeout(t._t); t.classList.remove('show'); setTimeout(_toastFlush,160); };
  const _x=t.querySelector('.toast-x'); if(_x)_x.onpointerdown=e=>{e.stopPropagation();_close();};
  t.onpointerdown=_close;
  clearTimeout(t._t);
  t._t=setTimeout(()=>{ t.classList.remove('show'); setTimeout(_toastFlush,180); }, it.p<=1?3200:2200);
}
// ДОСТУПНОСТЬ: режимы через классы body (высокий контраст, крупный текст, левша, цветовая слепота)
function applyA11y(){ const a=S.a11y||{}, b=document.body; if(!b)return;
  b.classList.toggle('a11y-contrast',!!a.contrast);
  b.classList.toggle('a11y-large',!!a.large);
  b.classList.toggle('a11y-left',!!a.lefthand);
  b.classList.toggle('a11y-cb',!!a.colorblind);
  b.classList.toggle('a11y-motion-off',!!a.motionOff);
}
function toggleA11y(key){ if(!S.a11y)S.a11y={}; S.a11y[key]=!S.a11y[key]; applyA11y(); if(typeof persist==='function')persist(); }
function floatText(txt,color){const f=$('#float');f.textContent=txt;f.style.color=color;f.classList.remove('go');void f.offsetWidth;f.classList.add('go');}
/* Полировка: празднование повышения уровня — вспышка + число + вибро */
function levelUpFx(d){ try{
  if(typeof floatText==='function') floatText('⬆️ Уровень '+d.level+'!','#ffd24a');
  let el=document.getElementById('lvlFlash');
  if(!el){ el=document.createElement('div'); el.id='lvlFlash'; document.body.appendChild(el); }
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  if(typeof vibrate==='function')vibrate([10,40,10]);
}catch(e){} }

function weightedSpecies(){
  // вес обратно растёт с редкостью
  const weights=SPECIES.map(s=>({s,w:Math.pow(0.34, s.rarity-1)*100}));
  const total=weights.reduce((a,b)=>a+b.w,0);
  let r=Math.random()*total;
  for(const x of weights){if((r-=x.w)<=0)return x.s;}
  return SPECIES[0];
}

/* ===== ТИПИЗИРОВАННЫЕ ЯЙЦА =====
   Яйцо хранит стихию (el) и глубину биома (tier 1..3).
   Вид дракона выбирается из пула этой стихии; глубже биом — выше шанс редких. */
// нормализуем S.eggs: раньше было число, теперь массив {el,tier}
function eggsArray(){
  if(Array.isArray(S.eggs)) return S.eggs;
  // миграция: старое число → столько же «нейтральных» яиц случайных стихий
  const n=(typeof S.eggs==='number')?S.eggs:0;
  const arr=[];
  for(let i=0;i<n;i++) arr.push({el:ELEMENTS_LIST[rnd(0,ELEMENTS_LIST.length-1)], tier:1});
  S.eggs=arr;
  return arr;
}
const ELEMENTS_LIST=['fire','frost','venom','storm','shade'];
function eggCount(){ return eggsArray().length; }
// ===== ПОЛУЧЕНИЕ ЯЙЦА =====
// катим редкость яйца по тиру биома + ГАРАНТИЯ (пити): чем дольше без эпического+, тем выше шанс
function rollEggRarity(tier){
  tier=tier||1;
  const base = tier>=3 ? GB.Eggs.rollBase.t3 : tier===2 ? GB.Eggs.rollBase.t2 : GB.Eggs.rollBase.t1;
  const pity = Math.min(GB.Eggs.pityCap,(S.eggPity||0)*GB.Eggs.pityStep);
  const w = base.map((x,r)=> r>=3 ? x*(1+pity/GB.Eggs.pityDiv) : x); // гарантия усиливает band r>=3, сохраняя порядок редкостей
  const total=w.reduce((a,b)=>a+b,0); let x=Math.random()*total;
  for(let r=1;r<=6;r++){ if((x-=w[r])<=0){ if(r>=3)S.eggPity=0; else S.eggPity=(S.eggPity||0)+1; return r; } }
  return 1;
}
function markEggSeen(el,r){ if(!S.eggsSeen)S.eggsSeen={}; S.eggsSeen[el+':'+r]=true; }
// addEgg(el, tier, rarity?) — обратно совместимо; новые яйца получают редкость, инкубацию и метку в кодекс
function addEgg(el, tier=1, rarity, opts){
  el = el||ELEMENTS_LIST[rnd(0,ELEMENTS_LIST.length-1)];
  const r = rarity || rollEggRarity(tier);
  const def = EGG_RARITY[Math.max(1,Math.min(6,r))];
  const egg = { el, tier:tier||1, rarity:r, inc:0, incNeed:def.incNeed||0 };
  eggsArray().push(egg);
  markEggSeen(el,r);
  if(!(opts&&opts.silent) && typeof eggCeremony==='function') eggCeremony(egg); // ЦЕРЕМОНИЯ получения
  return egg;
}

/* ЕДИНЫЙ ПРОГРЕСС-БАР: уровень/инкубация/логово/биомы/репутация/исследование */
function pbarHTML(cur,max,kind,showCap){
  const pct=max>0?Math.max(0,Math.min(100,Math.round(cur/max*100))):0;
  return '<div class="pbar" data-kind="'+(kind||'')+'"><i style="width:'+pct+'%"></i>'
    +(showCap?'<span class="pbar-cap">'+cur+' / '+max+'</span>':'')+'</div>';
}

/* ЦЕРЕМОНИЯ ЯЙЦА — нижняя карточка, не модалка, короткая анимация */
function eggCeremony(egg, def){ try{
  if(typeof document==='undefined')return;
  let el=document.getElementById('eggCeremony');
  if(!el){ el=document.createElement('div'); el.id='eggCeremony'; document.body.appendChild(el);
    el.addEventListener('click',()=>el.classList.remove('show')); }
  const r=Math.max(1,Math.min(6,(egg&&egg.rarity)||1));
  const rd=(typeof EGG_RARITY!=='undefined'&&EGG_RARITY[r])||{name:'',color:'#d9a441'};
  const emo=(def&&def.look&&def.look.emoji)||((egg&&egg.el)&&({fire:'\uD83D\uDD25',frost:'\uD83E\uDDCA',venom:'\uD83D\uDFE2',storm:'\u26A1',shade:'\uD83C\uDF11'})[egg.el])||'\uD83E\uDD5A';
  const nm=(def&&def.name)||(rd.name?rd.name+' яйцо':'Яйцо');
  el.innerHTML='<div class="ec-egg">'+emo+'</div><div class="ec-txt"><div class="ec-title">🥚 Новое яйцо!</div>'
    +'<div class="ec-name" style="color:'+(rd.color||'#d9a441')+'">'+nm+'</div>'
    +'<div class="ec-sub">Отнеси в Гнездо, чтобы высидеть</div></div>';
  el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),2600);
  if(typeof vibrate==='function')vibrate(16);
}catch(e){} }
// инкубация: любое игровое действие (бой/находка) продвигает ВСЕ яйца. Без реальных таймеров.
// наследование окраса: чем выше редкость ЯЙЦА, тем вероятнее редкий морф у дракона
function rollMorphByEggRarity(r){
  const pool=(typeof MORPHS!=='undefined'?MORPHS:[{id:'common',weight:1}]).filter(m=> r>=4 ? m.id!=='common' : true);
  const k=(r-1)*GB.Eggs.morphK;
  const adj=pool.map(m=>({m, w:(m.weight||1)*Math.pow(GB.Eggs.morphRef/(m.weight||1), k)}));
  const tot=adj.reduce((a,b)=>a+b.w,0); let x=Math.random()*tot;
  for(const a of adj){ if((x-=a.w)<=0) return a.m.id; }
  return pool[0].id;
}
function incubateEggs(n=1){
  let any=false;
  for(const e of eggsArray()){ if(e.incNeed && (e.inc||0)<e.incNeed){ e.inc=Math.min(e.incNeed,(e.inc||0)+n); any=true; } }
  return any;
}
// ===== ЯЙЦА V2: получение по КАТАЛОГУ и ИСТОЧНИКАМ =====
function addCatalogEgg(id){
  const def=(typeof eggCatalogById==='function')?eggCatalogById(id):null; if(!def) return addEgg();
  if(def.unique){ if(!S.eggsUnique)S.eggsUnique={}; if(S.eggsUnique[id]) return null; S.eggsUnique[id]=true; }
  if(def.secret){ if(!S.eggsSecret)S.eggsSecret={}; S.eggsSecret[id]=true; }
  const el = def.el==='any' ? ELEMENTS_LIST[rnd(0,ELEMENTS_LIST.length-1)] : def.el;
  const egg=addEgg(el, Math.min(3,def.rarity), def.rarity, {silent:true});
  egg.catId=id; if(def.fixed) egg.fixed=def.fixed;
  if(typeof eggCeremony==='function') eggCeremony(egg, def);
  if(!S.eggStats)S.eggStats={}; S.eggStats[id]=(S.eggStats[id]||0)+1;
  return egg;
}
// ролл яйца из конкретного источника (у каждого источника — свой пул, без единой таблицы)
function rollEggFromSource(src, tier){
  const cfg=((typeof GB!=='undefined'&&GB.Eggs.sources)||{})[src]||{rarityFloor:1};
  const typed=(typeof eggTypesForSource==='function')?eggTypesForSource(src):[];
  for(const t of typed){ if(Math.random()<(t.drop||0)*0.5) return addCatalogEgg(t.id); }
  const r=Math.max(cfg.rarityFloor||1, rollEggRarity(tier||1));
  const el=ELEMENTS_LIST[rnd(0,ELEMENTS_LIST.length-1)];
  const egg=addEgg(el, Math.min(3,r), r); egg.catId='egg_'+el;
  if(!S.eggStats)S.eggStats={}; S.eggStats['egg_'+el]=(S.eggStats['egg_'+el]||0)+1;
  return egg;
}
// разблокировать/выдать секретное яйцо по выполнению условия
function unlockSecretEgg(id){
  const d=(typeof eggCatalogById==='function')?eggCatalogById(id):null; if(!d||!d.secret) return;
  const first=!(S.eggsSecret&&S.eggsSecret[id]);
  const egg=addCatalogEgg(id);
  if(first && typeof toast==='function') toast(`🕵️ Тайна раскрыта — <b>${d.name}</b>! Загляни в Кодекс Яиц.`);
  return egg;
}
// выбрать вид дракона из яйца: стихия фиксирована, редкость ВИДА зависит от РЕДКОСТИ ЯЙЦА
function speciesFromEgg(egg){
  const el=egg.el;
  const pool=SPECIES.filter(s=>s.el===el);
  if(!pool.length) return weightedSpecies();
  const bias=(eggDef(egg).bias)||0.45;
  const adj=pool.map(s=>({s, w:Math.pow(bias, s.rarity-1)*100}));
  const total=adj.reduce((a,b)=>a+b.w,0);
  let r=Math.random()*total;
  for(const x of adj){ if((r-=x.w)<=0) return x.s; }
  return pool[0];
}

/* ===== АРТЕФАКТЫ: выдача и дроп ===== */
function addArtifact(artId, level=1){
  const inst={invUid:S.nextArt++, id:artId, level};
  S.artifacts.push(inst);
  S.artifactsSeen[artId]=true;
  return inst;
}
function weightedArtifact(maxRarity){
  // общий пул исключает мировые легендарки (они падают только в биоме III своего мира)
  const pool=ARTIFACTS.filter(a=>a.rarity<=maxRarity && !a.world);
  const weights=pool.map(a=>({a,w:Math.pow(0.45, a.rarity-1)*100}));
  const total=weights.reduce((s,x)=>s+x.w,0);
  let r=Math.random()*total;
  for(const x of weights){if((r-=x.w)<=0)return x.a;}
  return pool[0];
}
// артефакт-находка с учётом биома: в ядре (биом III) есть шанс на мировую легендарку
function biomeArtifact(region){
  const maxR=Math.min(5, (region.tier||1)+1);
  if(region.biomeN>=3 && region.worldId){
    const worldLegs=ARTIFACTS.filter(a=>a.world===region.worldId);
    if(worldLegs.length && Math.random()<0.45){
      return worldLegs[rnd(0,worldLegs.length-1)];
    }
  }
  // в биоме II изредка тоже проскакивает мировая легендарка
  if(region.biomeN>=2 && region.worldId && Math.random()<0.12){
    const worldLegs=ARTIFACTS.filter(a=>a.world===region.worldId);
    if(worldLegs.length) return worldLegs[rnd(0,worldLegs.length-1)];
  }
  return weightedArtifact(maxR);
}
function bonusText(b){
  const lab={hp:'жизни',atk:'атк',def:'защ',spd:'прыть'};
  return Object.entries(b).filter(([k,v])=>v).map(([k,v])=>`${v>0?'+':''}${v} ${lab[k]}`).join(' · ');
}
// текст спец-эффектов артефакта (крит/мана/лечение/вампиризм)
function fxText(fx){
  return FX_KEYS.filter(k=>fx[k]).map(k=>`${FX_ICON[k]} ${fx[k]>0?'+':''}${fx[k]}${FX_SUFFIX[k]} ${FX_LABEL[k]}`).join(' · ');
}
// полное описание экземпляра: статы, эффекты, дебаф
function artFullText(inst){
  const art=artifactById(inst.id);
  const b=artifactBonus(inst), fx=artifactFx(inst);
  const parts=[];
  const pos={}, neg={};
  for(const k in b){ if(b[k]>0)pos[k]=b[k]; else if(b[k]<0)neg[k]=b[k]; }
  const posFx={}, negFx={};
  for(const k in fx){ if(fx[k]>0)posFx[k]=fx[k]; else if(fx[k]<0)negFx[k]=fx[k]; }
  let html='';
  const goodStat=bonusText(pos), goodFx=fxText(posFx);
  const good=[goodStat,goodFx].filter(Boolean).join(' · ');
  if(good) html+=`<div class="art-good">${good}</div>`;
  const badStat=bonusText(neg), badFx=fxText(negFx);
  const bad=[badStat,badFx].filter(Boolean).join(' · ');
  if(bad) html+=`<div class="art-malus">⚠ ${bad}</div>`;
  return html;
}

/* ===== ПЕРЕРАБОТКА АРТЕФАКТОВ В ПЫЛЬ ===== */
// сколько пыли даёт распыление: зависит от редкости и вложенной ковки
function recycleYield(inst){
  const art=artifactById(inst.id);
  const base=4 + art.rarity*4;
  const forged=(inst.level-1)*3;          // часть вложенного золота возвращается пылью
  return base+forged;
}
function recycleArtifact(invUid){
  const idx=S.artifacts.findIndex(a=>a.invUid===invUid);
  if(idx<0) return;
  const inst=S.artifacts[idx];
  // снять с дракона, если надет
  const w=wearerOf(invUid);
  if(w){ for(const s in w.equip){ if(w.equip[s]===invUid) delete w.equip[s]; } }
  const gain=recycleYield(inst);
  S.dust+=gain;
  S.artifacts.splice(idx,1);
  if(S.forgeSel===invUid) S.forgeSel=null;
  const art=artifactById(inst.id);
  floatText('+'+gain+' пыли','#b88adf');
  toast(`<b>${art.name}</b> распылён в прах. +${gain} ✦ пыли.`);
  questEvent('recycle'); persist();
  renderLedger();renderForge();renderLair();
}

/* ===== СЕЛЕКЦИЯ: СКРЕЩИВАНИЕ И МУТАЦИЯ ===== */
const BREED_GOLD=40;      // золота за скрещивание (по карману ребёнку)
const BREED_DUST=10;      // пыли за скрещивание
const MUTATE_DUST=8;      // пыли за точечную мутацию одного гена

// можно ли скрестить двух драконов: один вид (для чистой линии)
function canBreed(a,b){
  return a&&b&&a.uid!==b.uid&&a.id===b.id;
}
// наследование генома: для каждого гена берём аллель одного из родителей,
// затем шанс мутации (±1, редко +2). Искра наследуется или вспыхивает мутацией.
function breedGenes(ga,gb){
  const child={};
  for(const k of GENE_KEYS){
    // наследуем «склонность» стата от одного из родителей, с лёгким уклоном к лучшему
    let v = Math.random()<0.5 ? (ga[k]||0) : (gb[k]||0);
    if(Math.random()<0.25) v=Math.max(ga[k]||0,gb[k]||0);
    child[k]=Math.max(0,Math.min(GENE_MAX,v));
  }
  // целевой бюджет = средний бюджет родителей ± небольшой разброс, с редким «ростом рода»
  const parentBudget=Math.round((geneSum(ga)+geneSum(gb))/2);
  let target=Math.max(8, Math.min(GENE_BUDGET_MAX, parentBudget + rnd(-1,1)));
  if(Math.random()<0.08) target=Math.min(GENE_BUDGET_MAX, target+1); // редкое улучшение рода
  // подгоняем сумму профиля под target, сохраняя пропорции (профиль наследуется, мощность нормируется)
  let s=geneSum(child);
  while(s>target){ const k=GENE_KEYS.filter(k=>child[k]>0).sort((a,b)=>child[b]-child[a])[0]; child[k]--; s--; }
  while(s<target){ const k=GENE_KEYS.filter(k=>child[k]<GENE_MAX).sort((a,b)=>child[a]-child[b])[0]; child[k]++; s++; }
  // искра: наследуется если есть у родителя; иначе редкий шанс вспыхнуть
  if(ga.spark||gb.spark) child.spark = Math.random()<0.6;
  else child.spark = Math.random()<0.05;
  return child;
}
function breedDragons(a,b){
  if(!canBreed(a,b)){toast('Скрещивать можно лишь двух разных драконов одного вида.');return null;}
  if(S.gold<BREED_GOLD){toast('Недостаёт золота для ритуала селекции.');return null;}
  if(S.dust<BREED_DUST){toast('Недостаёт пыли для ритуала. Распыли лишние реликвии.');return null;}
  S.gold-=BREED_GOLD; S.dust-=BREED_DUST;
  const childGenes=breedGenes(a.genes,b.genes);
  // окрас потомка: чаще от одного из родителей, иногда новый бросок
  const childMorph = Math.random()<0.7 ? (Math.random()<0.5?a.morph:b.morph) : rollMorph();
  const gen=Math.max(a.gen||1,b.gen||1)+1;
  // характер потомка: чаще от родителя, иногда новый
  const childNature = Math.random()<0.75 ? (Math.random()<0.5?a.nature:b.nature) : rollNature();
  const child=addDragon(a.id,1,childMorph,childGenes,gen,childNature);
  questEvent('breed'); persist();
  return child;
}
// стоимость следующей мутации растёт с числом уже сделанных этому дракону
function mutateCost(d){
  const growth=d.geneGrowth||0;
  return Math.min(40, MUTATE_DUST + growth*4); // цена растёт только после реального усиления и имеет потолок
}
// точечная мутация: усиливает выбранный стат за счёт другого (перераспределение),
// с редким шансом вырастить общий бюджет генома (без потери другого стата).
function mutateGene(d,key){
  const cost=mutateCost(d);
  if(S.dust<cost){toast(`Недостаёт пыли для мутации (нужно ${cost}✦).`);return;}
  if((d.genes[key]||0)>=GENE_MAX){toast(`<b>${GENE_LABEL[key]}</b> уже на максимуме (${GENE_MAX}/${GENE_MAX}).`);return;}
  S.dust-=cost;
  d.mutations=(d.mutations||0)+1;

  const sum=geneSum(d.genes);
  d.mutationPity=d.mutationPity||0;
  const growChance=0.22; // рост достижим в рамках обычной игры
  const canGrow = sum<GENE_BUDGET_MAX;
  const doGrow = canGrow && (d.mutationPity>=3 || Math.random()<growChance);

  if(doGrow){
    // редкая удача: бюджет растёт, выбранный стат +1 без штрафа
    d.genes[key]=Math.min(GENE_MAX,(d.genes[key]||0)+1);
    d.mutationPity=0;
    d.geneGrowth=(d.geneGrowth||0)+1;
    floatText(`✦ Бюджет генома вырос!`, '#ffd24a');
    toast(`<b>Редкая мутация!</b> Геном окреп — <b>${GENE_LABEL[key]}</b> вырос до ${d.genes[key]}/${GENE_MAX}, а общая мощь дракона поднялась.`);
  } else {
    if(canGrow) d.mutationPity++;
    // обычная: +1 выбранному, −1 самому «богатому» из остальных (перераспределение)
    const donors=GENE_KEYS.filter(k=>k!==key && (d.genes[k]||0)>0);
    if(!donors.length){
      // некому отдать очко — просто вернём пыль-эффект как «устоял»
      toast(`Другим статам нечего отдать — <b>${GENE_LABEL[key]}</b> не изменился.`);
      questEvent('mutate'); persist(); renderLedger(); renderLair(); return;
    }
    donors.sort((a,b)=>(d.genes[b]||0)-(d.genes[a]||0));
    const donor=donors[0];
    d.genes[key]=Math.min(GENE_MAX,(d.genes[key]||0)+1);
    d.genes[donor]=Math.max(0,(d.genes[donor]||0)-1);
    floatText(`${GENE_LABEL[key]} ↑ · ${GENE_LABEL[donor]} ↓`, '#d9a441');
    toast(`Перераспределение: <b>${GENE_LABEL[key]}</b> ↑ до ${d.genes[key]}/${GENE_MAX} ценой <b>${GENE_LABEL[donor]}</b> ↓ до ${d.genes[donor]}/${GENE_MAX}.`);
  }
  d.curHp=Math.min(d.curHp,statsOf(d).maxHp);
  questEvent('mutate'); persist();
  renderLedger();renderLair();
}
// редкая искусственная искра за много пыли
const SPARK_DUST=70;
function igniteSpark(d){
  if(d.genes.spark){toast('Искра уже горит в этом драконе.');return;}
  if(S.dust<SPARK_DUST){toast(`Нужно ${SPARK_DUST} ✦ пыли, чтобы зажечь искру.`);return;}
  S.dust-=SPARK_DUST;
  d.sparkPity=d.sparkPity||0;
  if(d.sparkPity>=1 || Math.random()<0.55){
    d.genes.spark=true;
    d.sparkPity=0;
    d.curHp=Math.min(d.curHp,statsOf(d).maxHp);
    floatText('✦ ИСКРА ✦','#ffd27a');
    toast(`В <b>${speciesById(d.id).name}</b> вспыхнула <span style="color:var(--gold)">искра рода</span>! +8% ко всем статам.`);
  } else {
    d.sparkPity++;
    floatText('искра угасла','#a8987a');
    toast('Искра не прижилась, но ритуал запомнил дракона. Следующая попытка гарантирована.');
  }
  renderLedger();renderLair();persist();
}
