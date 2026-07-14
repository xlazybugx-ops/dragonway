/* ============================================================
   03-state.js — СОСТОЯНИЕ: объект S, квесты, генетика (бюджет), характеры, забота о драконах, проводы
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ======================= СОСТОЯНИЕ ======================= */
let S = {
  gold:300, eggs:[{el:'fire',tier:1},{el:'frost',tier:1},{el:'venom',tier:1},{el:'storm',tier:1}], dust:0,
  eggPity:0, eggsSeen:{}, eggStats:{}, eggsUnique:{}, eggsSecret:{}, shards:0, // система яиц v2
  worldExplored:{}, worldCodex:{events:{},biomes:{},weather:{}}, // исследование мира
  bossSeen:{}, bossKills:{}, // кодекс и реванш боссов
  a11y:{}, // доступность: contrast/large/lefthand/colorblind
  settlement:'Драконьи Земли',
  portalLevel:1,
  forgeLevel:3,
  chests:[],       // накопленные сундуки [{tier}]
  keys:{1:0,2:0,3:0}, // ключи по уровням
  decorations:{},  // размещённые украшения {slotIndex: decorId}
  decorOwned:[],   // список полученных id украшений (для инвентаря)
  scrolls:[],      // собранные свитки легенд (id)
  bossesDefeated:{}, // побеждённые владыки {bossId:true}
  ascStars:0,        // звёзды владык (материал Восхождения)
  soundOn:true,      // звук и вибрация
  hintsSeen:{},      // показанные одноразовые подсказки
  marketDust:null,   // дневной лимит обмена пыли на Рынке
  milestonesClaimed:{}, // забранные коллекционные вехи
  waveBest:0,        // рекорд арены волн
  saveVersion:3,     // схема тест-релиза 2.1
  arenaOffers:null,  // фиксированный набор соперников; не позволяет бесплатно искать выгодный ролл
  telemetry:[],      // локальный обезличенный журнал для закрытой беты
  lairLevel:1,       // уровень логова → вместимость активных драконов (ЧАСТЬ 3)
  dragons:[],      // {uid,id,level,xp,curHp,morph,equip,genes,gen,nature}
  discovered:{},   // species id -> true
  morphsSeen:{},   // species id -> {morphId:true}
  artifacts:[],    // {invUid,id,level}  — экземпляры в инвентаре
  artifactsSeen:{},// artifact id -> true
  nextUid:1,
  nextArt:1,
  sel:null,        // выбранный в логове uid
  arenaPick:null,  // выбранный боец uid
  forgeSel:null,   // выбранный артефакт в кузнице (invUid)
  breedA:null,     // первый родитель для скрещивания (uid)
  breedB:null,     // второй родитель (uid)
  farewellSel:{},  // выбранные для проводов {uid:true}
  // === ежедневная петля и idle ===
  lastSeen:0,      // время последнего визита (мс) — для idle-дохода
  lastDaily:'',    // дата последнего входа (YYYY-MM-DD) — для стрика
  streak:0,        // текущая серия дней подряд
  chestReady:false,// готов ли ежедневный сундук к получению
  quests:[],       // [{id,goal,prog,done,claimed}]
  questDay:'',     // дата, на которую сгенерированы квесты
};

/* ===== ЕЖЕДНЕВНЫЕ КВЕСТЫ ===== */
// шаблоны дейликов; goal масштабируется, выдаём 3 случайных в день
const QUEST_POOL = [
  {id:'win_arena', icon:'⚔️', text:'Победи в дружеском поединке', goalBase:2,  unit:'побед',  reward:{gold:120}},
  {id:'explore',   icon:'🗺️', text:'Сходи в путешествие', goalBase:2, unit:'походов', reward:{gold:120}},
  {id:'hatch',     icon:'🥚', text:'Высиди яйцо', goalBase:1, unit:'яиц', reward:{eggs:2}},
  {id:'forge',     icon:'🔨', text:'Улучши реликвию в кузнице', goalBase:2, unit:'ковок', reward:{dust:30}},
  {id:'recycle',   icon:'✦',  text:'Преврати реликвию в пыль', goalBase:1, unit:'шт.', reward:{dust:30}},
  {id:'breed',     icon:'🥚', text:'Выведи дракончика', goalBase:1, unit:'раз', reward:{gold:150}},
  {id:'mutate',    icon:'⟳',  text:'Поколдуй над геном', goalBase:2, unit:'мутаций', reward:{dust:30}},
  {id:'feed',      icon:'🍖', text:'Покорми дракона', goalBase:2, unit:'раз', reward:{gold:90}},
  {id:'pet',       icon:'💖', text:'Погладь дракона', goalBase:2, unit:'раз', reward:{gold:90}},
];
const IDLE_RATE_PER_DRAGON = 0.32; // legacy-константа; новая кривая задаётся GB.Economy
const IDLE_CAP_HOURS = 5;         // максимум накопления offline

/* ===== ГЕНЕТИКА =====
   У каждого дракона геном из 4 статовых генов (атка/защ/жизнь/прыть).
   Аллель — целое 0..6: чем выше, тем мощнее множитель к этому стату.
   Плюс редкий ген «искра» (spark): true даёт +8% ко всем статам и сияние.
   Идеальный дракон — все гены 6 и активная искра. */
const GENE_KEYS=['atk','def','hp','spd'];
const GENE_LABEL={atk:'Сила',def:'Стойкость',hp:'Живучесть',spd:'Резвость'};
const GENE_ICON={atk:'⚔️',def:'🛡️',hp:'❤️',spd:'💨'};
const GENE_MAX=6;
// множитель стата от аллели: 0 -> 0.85, 3 -> 1.0, 6 -> 1.15
const geneMult=allele=>0.85 + allele*0.05;
const SPARK_BONUS=0.08;

/* ===== ХАРАКТЕРЫ (natures): врождённая черта, задаёт роль ===== */
// up усиливает стат, down ослабляет; по мощности сумма = 0 (кроме balanced)
const NATURE_AMT=0.12;
const NATURES=[
  {id:'balanced', name:'Уравновешенный', icon:'☯️', up:null,  down:null,  desc:'Ровный во всём'},
  {id:'fierce',   name:'Яростный',       icon:'🔥', up:'atk', down:'def', desc:'Бьёт сильнее, но хрупче'},
  {id:'stalwart', name:'Стойкий',        icon:'🛡️', up:'def', down:'atk', desc:'Держит удар, бьёт слабее'},
  {id:'vital',    name:'Живучий',        icon:'❤️', up:'hp',  down:'spd', desc:'Много жизни, медлителен'},
  {id:'swift',    name:'Стремительный',  icon:'💨', up:'spd', down:'hp',  desc:'Быстрый, но хрупкий'},
  {id:'savage',   name:'Свирепый',       icon:'⚔️', up:'atk', down:'hp',  desc:'Урон ценой живучести'},
  {id:'tough',    name:'Крепкий',        icon:'🪨', up:'hp',  down:'atk', desc:'Живучий, но бьёт мягче'},
  {id:'nimble',   name:'Юркий',          icon:'🌀', up:'spd', down:'def', desc:'Резвый, но незащищённый'},
  {id:'guarded',  name:'Осторожный',     icon:'⛨',  up:'def', down:'spd', desc:'Защита ценой скорости'},
];
const natureById=id=>NATURES.find(n=>n.id===id)||NATURES[0];
// любимая еда по стихии вида (косметика/доверие, на баланс не влияет)
const FAVFOOD={fire:'🌶️ огнецвет', frost:'🐟 ледяная рыба', venom:'🍄 споровый гриб', storm:'⚡ грозовой плод', shade:'🫐 сумеречная ягода'};
function favFood(d){ const sp=speciesById(d.id); return (sp&&FAVFOOD[sp.el])||'🍖 мясо'; }
function rollNature(){ return NATURES[rnd(0,NATURES.length-1)].id; }
// множитель характера для конкретного стата (в долях, +/-)
function natureMod(natureId,key){
  const n=natureById(natureId);
  if(n.up===key) return NATURE_AMT;
  if(n.down===key) return -NATURE_AMT;
  return 0;
}

/* ===== БЮДЖЕТНАЯ ГЕНЕТИКА =====
   Сумма очков генома фиксирована (GENE_BUDGET). Профиль распределён неравномерно:
   усилил один стат — просел другой. Мощность у всех драконов ровная,
   различается только СТИЛЬ. Мутация перераспределяет; редко растит бюджет. */
const GENE_BUDGET=12;      // базовая сумма очков (4 стата × 3)
const GENE_BUDGET_MAX=20;  // потолок бюджета при редких «ростовых» мутациях

// случайное распределение заданного бюджета по 4 статам (каждый 0..GENE_MAX)
function distributeBudget(budget){
  const g={atk:0,def:0,hp:0,spd:0};
  let pts=budget;
  while(pts>0){
    const avail=GENE_KEYS.filter(k=>g[k]<GENE_MAX);
    if(!avail.length)break;
    const k=avail[rnd(0,avail.length-1)];
    g[k]++; pts--;
  }
  return g;
}
function randomGenes(floorUnused=0,ceilUnused=3){
  // небольшой разброс бюджета на старте, чтобы даже новорождённые различались
  const budget=GENE_BUDGET + rnd(-1,1);
  const g=distributeBudget(Math.max(8,budget));
  g.spark = Math.random()<0.04; // 4% дикая искра
  return g;
}
// текущая сумма очков генома
const geneSum=genes=>GENE_KEYS.reduce((a,k)=>a+(genes[k]||0),0);

// оценка «редкости/силы» генома 0..100 — теперь по бюджету, а не по «все на макс»
function genomeScore(genes){
  if(!genes) return 0;
  const sum=geneSum(genes);
  let pct = (sum-8)/(GENE_BUDGET_MAX-8)*100; // 8 очков=0%, макс бюджет=100%
  pct=Math.max(0,Math.min(100,pct));
  if(genes.spark) pct=Math.min(100,pct+8);
  return Math.round(pct);
}
function isPerfect(genes){
  // «идеал» = редкий, с высоким бюджетом и искрой
  return genes && genes.spark && geneSum(genes)>=GENE_BUDGET_MAX;
}
// средний множитель генома (для краткой подписи)
function genomeAvgMult(genes){
  if(!genes) return 1;
  let m=GENE_KEYS.reduce((a,k)=>a+geneMult(genes[k]||0),0)/GENE_KEYS.length;
  if(genes.spark) m*=1+SPARK_BONUS;
  return m;
}

// пологая кривая: до ур.100 реально дойти (~линейный рост требований)
const xpToNext = lvl => Math.round(GB.Experience.xpBase * Math.pow(lvl, GB.Experience.xpExp)); // плавная степенная кривая ≈ 1 уровень / 8–12 мин

// ===== ПОЭТАПНОЕ ОТКРЫТИЕ МЕХАНИК (по уровню сильнейшего дракона) =====
const FEATURE_MIN  = { forge:3, spire:5, roost:8 };
const FEATURE_NAME = { forge:'Кузница', spire:'Шпиль Мироздания', roost:'Гнездилище Рода' };
function progLevel(){ return (S.dragons&&S.dragons.length) ? Math.max.apply(null,S.dragons.map(d=>d.level||1)) : 1; }
function featureUnlocked(key){ const m=FEATURE_MIN[key]; return !m || progLevel()>=m; }

// ===== РЕДКОСТЬ ЯИЦ =====
// 6 тиров. incNeed — сколько игровых действий (бой/находка) нужно на инкубацию (0 = сразу).
// bias — уклон пула видов к редким (выше = чаще редкие виды). frame/glow — визуал рамки.
const EGG_RARITY = [
  null,
  {r:1, key:'common',    name:'Обычное',     frame:'#9c8b6a', glow:'#e7d9b4', incNeed:0,  bias:0.45, title:''},
  {r:2, key:'uncommon',  name:'Необычное',   frame:'#4fae6a', glow:'#c6f0cf', incNeed:3,  bias:1.00, title:'из Необычного яйца'},
  {r:3, key:'rare',      name:'Редкое',      frame:'#3f8fd6', glow:'#bfe0ff', incNeed:6,  bias:1.45, title:'из Редкого яйца'},
  {r:4, key:'epic',      name:'Эпическое',   frame:'#a861d8', glow:'#e2c4ff', incNeed:10, bias:1.90, title:'из Эпического яйца'},
  {r:5, key:'legendary', name:'Легендарное', frame:'#e7b53b', glow:'#ffe9a6', incNeed:16, bias:2.35, title:'Легендарнорождённый'},
  {r:6, key:'ancient',   name:'Древнее',     frame:'#2fb8a8', glow:'#b8fff2', incNeed:24, bias:2.80, title:'Древнерождённый'},
];
function eggRarity(egg){ return (egg&&egg.rarity) ? egg.rarity : (egg&&egg.tier?Math.min(3,egg.tier):1); }
function eggDef(egg){ return EGG_RARITY[Math.max(1,Math.min(6,eggRarity(egg)))]; }
// готово ли яйцо: у старых яиц (без incNeed) инкубация не требуется — обратная совместимость
function eggIncReady(egg){ if(egg.incNeed==null) return true; return (egg.inc||0)>=egg.incNeed; }
const speciesById = id => SPECIES.find(s=>s.id===id);

// найти экземпляр артефакта в инвентаре по invUid
const artInst = invUid => S.artifacts.find(a=>a.invUid===invUid);
// какой дракон носит данный артефакт (или null)
function wearerOf(invUid){
  return S.dragons.find(d=>d.equip && Object.values(d.equip).includes(invUid)) || null;
}
// суммарные бонусы всех надетых на дракона артефактов
function equipBonus(d){
  const out={hp:0,atk:0,def:0,spd:0};
  if(!d.equip) return out;
  for(const invUid of Object.values(d.equip)){
    const inst=artInst(invUid); if(!inst) continue;
    const b=artifactBonus(inst);
    for(const k in b) out[k]+=b[k];
  }
  return out;
}

function statsOf(d){
  const sp = speciesById(d.id);
  const m = morphById(d.morph).mods || {};
  const eq = equipBonus(d);
  const gn = d.genes || {};
  const spark = gn.spark ? (1+SPARK_BONUS) : 1;
  const tal = talentMods(d); // множители от древа талантов (в долях)
  const nat = d.nature || 'balanced'; // характер
  const asc = 1 + (d.asc||0)*0.06;    // восхождение: +6% ко всем статам за звезду
  const g = (lvl,base,grow)=> base + (lvl-1)*grow;
  // геном, характер и таланты множат "природную" часть стата, затем добавляются окрас и реликвии
  const natural=(lvl,base,grow,key)=> Math.round( g(lvl,base,grow) * geneMult(gn[key]!=null?gn[key]:3) * spark * (1+(tal[key]||0)) * (1+natureMod(nat,key)) * asc );
  return {
    maxHp: natural(d.level, sp.hp, sp.hp*0.16, 'hp') + (m.hp||0) + eq.hp,
    atk:   natural(d.level, sp.atk, sp.atk*0.14, 'atk') + (m.atk||0) + eq.atk,
    def:   natural(d.level, sp.def, sp.def*0.12, 'def') + (m.def||0) + eq.def,
    spd:   natural(d.level, sp.spd, sp.spd*0.08, 'spd') + (m.spd||0) + eq.spd,
  };
}

// Единая оценка силы учитывает всё, что реально входит в бой, а не только уровень.
// HP имеет меньший вес, чтобы защитные сборки не получали завышенный рейтинг.
function combatPower(d){
  const s=statsOf(d);
  return Math.max(1,Math.round(s.atk*4.2+s.def*3.4+s.spd*2.2+Math.sqrt(s.maxHp)*11));
}
function combatRisk(myDragon, foeDragon){
  const ratio=combatPower(foeDragon)/Math.max(1,combatPower(myDragon));
  if(ratio<0.91) return {key:'easy',label:'Тренировка',ratio};
  if(ratio>1.09) return {key:'hard',label:'Опасный',ratio};
  return {key:'even',label:'Равный',ratio};
}
function trackEvent(type,data){
  if(!Array.isArray(S.telemetry)) S.telemetry=[];
  S.telemetry.push({type,at:Date.now(),data:data||{}});
  if(S.telemetry.length>300) S.telemetry.splice(0,S.telemetry.length-300);
}

function addDragon(speciesId, level=1, morph=null, genes=null, gen=1, nature=null){
  const sp=speciesById(speciesId);
  const d={uid:S.nextUid++, id:speciesId, level, xp:0, curHp:0,
           morph: morph || rollMorph(), genes: genes || randomGenes(0,3), gen,
           nature: nature || rollNature(),
           name:null, happy:5, lastFed:0, talentPicks:{}};
  d.curHp=statsOf(d).maxHp;
  // ЧАСТЬ 3: если в логове нет места — новый дракон уходит в резерв (не пропадает)
  if(typeof lairCap==='function' && S.dragons.filter(x=>!x.reserve).length>=lairCap()) d.reserve=true;
  d.isNew=true; // для фильтра «новые» в Заповеднике
  S.dragons.push(d);
  if(!S.discovered[speciesId]){S.discovered[speciesId]=true;}
  S.morphsSeen[speciesId] = S.morphsSeen[speciesId] || {};
  S.morphsSeen[speciesId][d.morph] = true;
  return d;
}
// отображаемое имя дракона: данное ребёнком или название вида
function dragonName(d){ return d.name || speciesById(d.id).name; }

/* ===== ЗАБОТА О ДРАКОНАХ ===== */
const HAPPY_MAX=5;
const FOOD_COST=10;
// случайные ласковые реакции
const PET_REACTIONS=['довольно урчит','прижимается к тебе','машет крылышками','пускает колечко дыма','щурится от удовольствия','тихонько мурлычет'];
const FEED_REACTIONS=['с аппетитом уплетает','довольно облизывается','просит добавки','счастливо рычит','машет хвостом'];

function feedDragon(d){
  if(S.gold<FOOD_COST){toast('Нужно немного золота на угощение. Сходи в путешествие!');return;}
  S.gold-=FOOD_COST;
  d.happy=Math.min(HAPPY_MAX,(d.happy||0)+1);
  // сытый дракон чуть подлечивается
  d.curHp=Math.min(statsOf(d).maxHp, d.curHp+Math.round(statsOf(d).maxHp*0.2));
  floatText('🍖 ням!','#7fb24a');
  toast(`<b>${dragonName(d)}</b> ${pick(FEED_REACTIONS)}! ${'💖'.repeat(d.happy)}`);
  questEvent('feed'); persist();
  renderLedger(); renderLair();
}
function petDragon(d){
  d.happy=Math.min(HAPPY_MAX,(d.happy||0)+1);
  floatText('💖','#cf6e8f');
  toast(`<b>${dragonName(d)}</b> ${pick(PET_REACTIONS)}! ${'💖'.repeat(d.happy)}`);
  questEvent('pet'); persist();
  renderLair();
}
function renameDragon(d){
  const cur=d.name||'';
  const name=prompt(`Как назвать твоего дракона (${speciesById(d.id).name})?`, cur);
  if(name===null) return;
  const clean=name.trim().slice(0,18);
  d.name = clean || null;
  if(clean) toast(`Теперь этого дракона зовут <b>${clean}</b>! 🐉`);
  persist(); renderLair();
}

/* ===== ПРОВОДЫ: ОТПУСТИТЬ ДРАКОНА НА ВОЛЮ ===== */
// Дракон улетает в родные земли и в благодарность оставляет золото и пыль.
// Награда тем больше, чем выше уровень, реже окрас и чище геном.
function farewellGift(d){
  const sp=speciesById(d.id);
  const m=morphById(d.morph);
  const morphBonus = m.id==='common' ? 1 : (m.shiny ? 2.2 : 1.5);
  const gene = 1 + genomeScore(d.genes)/100;       // 1.0 .. 2.0
  const gold = Math.round((20 + d.level*8 + sp.rarity*10) * morphBonus * gene);
  const dust = Math.round((6 + d.level*1.5 + sp.rarity*3) * (m.shiny?1.6:1) * gene);
  return {gold, dust};
}
// можно ли отпустить: нельзя оставить логово пустым
function canRelease(uids){
  return S.dragons.length - uids.length >= 1;
}
function releaseDragons(uids){
  if(!uids.length) return;
  if(!canRelease(uids)){ toast('Нельзя отпустить всех — хотя бы один дракон должен остаться в логове 🐉'); return; }
  doRelease(uids);
}
function doRelease(uids){
  let gold=0, dust=0, names=[];
  uids.forEach(uid=>{
    const d=S.dragons.find(x=>x.uid===uid); if(!d) return;
    const g=farewellGift(d); gold+=g.gold; dust+=g.dust; names.push(dragonName(d));
    if(d.equip){ d.equip={}; }
    if(S.sel===uid) S.sel=null;
    if(S.breedA===uid) S.breedA=null;
    if(S.breedB===uid) S.breedB=null;
  });
  S.dragons = S.dragons.filter(d=>!uids.includes(d.uid));
  if(!S.sel && S.dragons.length) S.sel=S.dragons[0].uid;
  S.gold+=gold; S.dust+=dust;
  floatText('🕊️ +'+gold+'🪙','#d9a441');
  const who = names.length===1 ? `<b>${names[0]}</b> улетел` : `<b>${names.length} драконов</b> улетели`;
  toast(`${who} на волю и оставил${names.length===1?'':'и'} в благодарность <b>${gold}🪙</b> и <b>${dust}✦</b> 🕊️`);
  persist();
  renderAll();
}

const MAX_LEVEL=100;
function grantXp(d, amount){
  if(d.level>=MAX_LEVEL){ d.xp=0; return false; }
  d.xp += amount;
  let leveled=false;
  const before=d.level;
  while(d.level<MAX_LEVEL && d.xp >= xpToNext(d.level)){
    d.xp -= xpToNext(d.level);
    d.level++; leveled=true;
    d.curHp = statsOf(d).maxHp; // на новом уровне исцеляется
  }
  if(d.level>=MAX_LEVEL) d.xp=0;
  if(leveled && typeof levelUpFx==='function') levelUpFx(d); // празднование уровня
  // оповестить об открытии новых талантов в Шпиле
  if(leveled){
    const tree=treeOf(d.id);
    const fresh=tree.filter(n=>n.lvl>before && n.lvl<=d.level);
    if(fresh.length){
      const hasUlt=fresh.some(n=>n.kind==='ult');
      const hasSpell=fresh.some(n=>n.kind==='spell');
      const hasFork=fresh.some(n=>n.kind==='fork');
      let what = hasUlt?'⭐ Ультимативная сила!':hasSpell?'✨ Новое заклинание!':hasFork?'🌟 Новый талант на выбор!':'🌟 Новый талант!';
      setTimeout(()=>toast(`<b>${dragonName(d)}</b> поднялся в Шпиле Мироздания — ${what} Загляни в его развитие.`), 400);
    }
  }
  return leveled;
}
