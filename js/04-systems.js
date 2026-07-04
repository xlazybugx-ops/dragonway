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
  if(S && S.soundOn===false) return; // общий тумблер эффектов
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}
/* ===== ОДНОРАЗОВЫЕ ПОДСКАЗКИ (туториал) ===== */
function hintOnce(id, html){
  if(!S.hintsSeen) S.hintsSeen={};
  if(S.hintsSeen[id]) return;
  S.hintsSeen[id]=true;
  toast('💡 '+html);
  persist();
}
const pick=a=>a[Math.floor(Math.random()*a.length)];

function toast(html){const t=$('#toast');t.innerHTML=html;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600);}
function floatText(txt,color){const f=$('#float');f.textContent=txt;f.style.color=color;f.classList.remove('go');void f.offsetWidth;f.classList.add('go');}

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
function addEgg(el, tier=1){
  eggsArray().push({el:el||ELEMENTS_LIST[rnd(0,ELEMENTS_LIST.length-1)], tier:tier||1});
}
// выбрать вид дракона из яйца: стихия фиксирована, редкость зависит от глубины
function speciesFromEgg(egg){
  const el=egg.el, tier=egg.tier||1;
  const pool=SPECIES.filter(s=>s.el===el);
  if(!pool.length) return weightedSpecies();
  // глубже биом → сильнее уклон к редким видам этой стихии
  const adj=pool.map(s=>{
    let w;
    if(tier>=3) w=Math.pow(1.6, s.rarity);        // ядро: редкие частые
    else if(tier===2) w=Math.pow(1.15, s.rarity); // глубина: чуть чаще редкие
    else w=Math.pow(0.4, s.rarity-1);             // поверхность: обычные
    return {s, w:w*100};
  });
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
  const n=d.mutations||0;
  return MUTATE_DUST + n*6; // 8,14,20,26,...
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
  const growChance=0.15; // редкий рост бюджета
  const canGrow = sum<GENE_BUDGET_MAX;
  const doGrow = canGrow && Math.random()<growChance;

  if(doGrow){
    // редкая удача: бюджет растёт, выбранный стат +1 без штрафа
    d.genes[key]=Math.min(GENE_MAX,(d.genes[key]||0)+1);
    floatText(`✦ Бюджет генома вырос!`, '#ffd24a');
    toast(`<b>Редкая мутация!</b> Геном окреп — <b>${GENE_LABEL[key]}</b> вырос до ${d.genes[key]}/${GENE_MAX}, а общая мощь дракона поднялась.`);
  } else {
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
  if(Math.random()<0.55){
    d.genes.spark=true;
    d.curHp=Math.min(d.curHp,statsOf(d).maxHp);
    floatText('✦ ИСКРА ✦','#ffd27a');
    toast(`В <b>${speciesById(d.id).name}</b> вспыхнула <span style="color:var(--gold)">искра рода</span>! +8% ко всем статам.`);
  } else {
    floatText('искра угасла','#a8987a');
    toast('Искра не прижилась. Пыль развеяна. Попробуй снова.');
  }
  renderLedger();renderLair();persist();
}

