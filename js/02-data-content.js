/* ============================================================
   02-data-content.js — ДАННЫЕ КОНТЕНТА: сундуки/ключи/украшения, свитки легенд, сокровищница, боссы, точки полёта, артефакты, константы кузницы
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ======================= СУНДУКИ, КЛЮЧИ, УКРАШЕНИЯ =======================
   3 уровня сундуков по глубине биома. Открываются ключом (мини-игра подбора)
   или в кузне за ресурсы. Лут: золото, пыль, артефакты, украшения хаба, яйца. */
const CHEST_TYPES=[
  {tier:1, name:'Простой сундук', icon:'<img class="loot-icon chest-tier-icon" src="images/chest_tier1.png" alt="Простой сундук">', zones:1, keyName:'Простой ключ',  keyIcon:'🔑',
   forgeCost:{gold:120, dust:15}},
  {tier:2, name:'Крепкий сундук', icon:'<img class="loot-icon chest-tier-icon" src="images/chest_tier2.png" alt="Крепкий сундук">', zones:2, keyName:'Резной ключ',   keyIcon:'🗝️',
   forgeCost:{gold:480, dust:30}},
  {tier:3, name:'Древний сундук', icon:'<img class="loot-icon chest-tier-icon" src="images/chest_tier3.png" alt="Древний сундук">', zones:3, keyName:'Древний ключ',  keyIcon:'🔐',
   forgeCost:{gold:1080, dust:45}},
];
const chestType=tier=>CHEST_TYPES.find(c=>c.tier===tier)||CHEST_TYPES[0];

/* ============================================================
   EGG_CATALOG — КАТАЛОГ ЯИЦ (данные отдельно от логики)
   Поля: id, name, desc, rarity(1-6), el, drop(отн. шанс), source, cond(условие),
   look{emoji}, cost{dust/shards при переработке}, dragons[] (возможные виды),
   unique(один раз, фикс. дракон), secret(скрыто до условия), fixed(фикс. вид).
   Тип яйца определяет ПУЛ возможных драконов; редкость влияет на уклон к редким видам.
   ============================================================ */
const EGG_CATALOG = [
  // — базовые стихийные (основной источник — бои/исследование) —
  {id:'egg_fire',  name:'Огненное яйцо',  el:'fire',  rarity:1, source:'battle',  drop:1.0, look:{emoji:'🔥'}, dragons:['ember','cinderpup','magma','pyrelord'],   desc:'Тёплое на ощупь — внутри тлеет искра.'},
  {id:'egg_frost', name:'Ледяное яйцо',   el:'frost', rarity:1, source:'battle',  drop:1.0, look:{emoji:'🧊'}, dragons:['glacier','permafrost','aurora'],          desc:'Покрыто вечным инеем.'},
  {id:'egg_venom', name:'Ядовитое яйцо',  el:'venom', rarity:1, source:'battle',  drop:1.0, look:{emoji:'🟢'}, dragons:['sporewing','blightfang','worldserpent'],   desc:'Пахнет болотными спорами.'},
  {id:'egg_storm', name:'Грозовое яйцо',  el:'storm', rarity:1, source:'battle',  drop:1.0, look:{emoji:'⚡'}, dragons:['tempest','thundercall'],                  desc:'Потрескивает статикой.'},
  {id:'egg_shade', name:'Теневое яйцо',   el:'shade', rarity:1, source:'battle',  drop:1.0, look:{emoji:'🌑'}, dragons:['umbra','nightwyrm','voidmaw'],             desc:'Ускользает от взгляда.'},
  // — тематические типы (свои источники) —
  {id:'egg_forest',  name:'Лесное яйцо',      el:'venom', rarity:3, source:'explore', drop:0.30, look:{emoji:'🌿'}, dragons:['sporewing','blightfang','worldserpent'], desc:'Оплетено живыми лозами, тёплое от жизни.'},
  {id:'egg_crystal', name:'Кристальное яйцо', el:'frost', rarity:4, source:'chest',   drop:0.15, look:{emoji:'💎'}, dragons:['glacier','aurora','permafrost'],        desc:'Грани сияют внутренним светом.'},
  {id:'egg_royal',   name:'Королевское яйцо', el:'any',   rarity:5, source:'streak',  drop:0.08, look:{emoji:'👑'}, dragons:['pyrelord','aurora','voidmaw'],           desc:'Награда за долгую череду побед.'},
  {id:'egg_ancient', name:'Древнее яйцо',     el:'shade', rarity:6, source:'boss',    drop:0.05, look:{emoji:'🥚'}, dragons:['voidmaw','worldserpent'],               desc:'Старше самих гор.'},
  {id:'egg_primord', name:'Первозданное яйцо',el:'any',   rarity:6, source:'tower',   drop:0.03, look:{emoji:'✴️'}, dragons:['voidmaw','worldserpent','pyrelord'],     desc:'Из времён до времён.'},
  // — уникальные (фиксированный дракон, один раз за игру) —
  {id:'egg_ashking',    name:'Яйцо Пепельного Короля',  el:'fire',  rarity:6, source:'unique', unique:true, fixed:'pyrelord',    look:{emoji:'♔'}, dragons:['pyrelord'],    desc:'В нём дремлет владыка вулканов.'},
  {id:'egg_northward',  name:'Яйцо Северного Хранителя',el:'frost', rarity:6, source:'unique', unique:true, fixed:'aurora',      look:{emoji:'❄️'},dragons:['aurora'],      desc:'Хранит стужу полюса.'},
  {id:'egg_emerald',    name:'Яйцо Изумрудного Леса',   el:'venom', rarity:6, source:'unique', unique:true, fixed:'worldserpent',look:{emoji:'🐍'},dragons:['worldserpent'],desc:'Сердце древнего леса.'},
  // — секретные (скрыты до выполнения условия) —
  {id:'egg_eclipse',    name:'Яйцо Затмения',        el:'shade', rarity:6, source:'secret', secret:true, fixed:'voidmaw', cond:'Победи босса без единого лечения',   look:{emoji:'🌘'}, dragons:['voidmaw'],            desc:'Тьма, что помнит свет.'},
  {id:'egg_stormcrown', name:'Яйцо Грозовой Короны',  el:'storm', rarity:5, source:'secret', secret:true,                  cond:'Открой все сундуки региона',         look:{emoji:'🌩️'}, dragons:['thundercall','tempest'], desc:'Гремит, когда рядом гроза.'},
  {id:'egg_purity',     name:'Яйцо Первой Стихии',    el:'any',   rarity:6, source:'secret', secret:true,                  cond:'Пройди бой одной стихией без потерь', look:{emoji:'⭐'}, dragons:['voidmaw','pyrelord','aurora','worldserpent'], desc:'Отклик на верность одной стихии.'},
];
const eggCatalogById = id => EGG_CATALOG.find(e=>e.id===id);
function eggTypesForSource(src){ return EGG_CATALOG.filter(e=>e.source===src && !e.unique && !e.secret); }

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
  {id:'well',     name:'Колодец желаний', icon:'🪣', rarity:1, desc:'Брось монетку — загадай желание.'},
  {id:'scarecrow',name:'Пугало-дракончик',icon:'🎭', rarity:1, desc:'Отпугивает ворон и скуку.'},
  {id:'bell',     name:'Бронзовый колокол',icon:'🔔', rarity:2, desc:'Звонит к обеду и к приключениям.'},
  {id:'totem',    name:'Тотем пяти стихий',icon:'🪬', rarity:2, desc:'Пять граней — пять миров.'},
  {id:'pond',     name:'Пруд с карпами',  icon:'🐟', rarity:2, desc:'Карпы мечтают стать драконами.'},
  {id:'garden',   name:'Грядка огнецвета',icon:'🌺', rarity:2, desc:'Цветы, тёплые на ощупь.'},
  {id:'sundial',  name:'Солнечные часы',  icon:'🕰️', rarity:3, desc:'Показывают время всех миров разом.'},
  {id:'gate_arch',name:'Арка странников', icon:'⛩',  rarity:3, desc:'Пройди под ней перед дальней дорогой.'},
  // трофеи владык миров (только за победу над боссами)
  {id:'trophy_fire',  name:'Пламенный трофей', icon:'🏆', rarity:4, desc:'Голова Владыки Пламени над воротами.', trophy:true},
  {id:'trophy_venom', name:'Трофей Топей',     icon:'🏆', rarity:4, desc:'Жвала Матери Топей на пьедестале.', trophy:true},
  {id:'trophy_frost', name:'Ледяной трофей',   icon:'🏆', rarity:4, desc:'Нерастающий рог Владыки Стужи.', trophy:true},
  {id:'trophy_storm', name:'Громовой трофей',  icon:'🏆', rarity:4, desc:'Осколок молнии Владыки Бурь.', trophy:true},
  {id:'trophy_shade', name:'Трофей Пустоты',   icon:'🏆', rarity:4, desc:'Беззвёздная чешуя Владыки Пустоты.', trophy:true},
  // премиум-украшения (покупаются на Рынке за золото)
  {id:'camp_lanterns',name:'Походные фонари',       icon:'🏮', rarity:2, desc:'Тёплая дорожка к логову.', premium:true, price:1000},
  {id:'small_hoard',  name:'Малый драконий клад',   icon:'🪙', rarity:2, desc:'Первое собственное сокровище.', premium:true, price:1800},
  {id:'wind_chimes',  name:'Колокольчики ветра',    icon:'🔔', rarity:3, desc:'Поют, когда стая возвращается.', premium:true, price:3000},
  {id:'gold_statue', name:'Золотая статуя дракона', icon:'✨', rarity:4, desc:'Сияет на всё поселение.', premium:true, price:8000},
  {id:'beacon',      name:'Радужный маяк',          icon:'🌈', rarity:4, desc:'Виден из всех пяти миров.', premium:true, price:12000},
  {id:'gem_garden',  name:'Сад самоцветов',         icon:'💠', rarity:4, desc:'Цветы из живых кристаллов.', premium:true, price:18000},
  {id:'sky_swing',   name:'Небесные качели',        icon:'🎠', rarity:5, desc:'Качели для маленьких драконят.', premium:true, price:25000},
  {id:'throne',      name:'Тронный камень',         icon:'👑', rarity:5, desc:'Трон истинного драконовода.', premium:true, price:40000},
];
const decorById=id=>DECORATIONS.find(d=>d.id===id);

/* ===== КОЛЛЕКЦИОННЫЕ ВЕХИ =====
   Большие цели коллекционера. Проверяются на лету, награда забирается один раз. */
const MILESTONES=[
  {id:'gold_10k', icon:'🪙', name:'Драконий клад', desc:'Накопи 10 000 золота',
   check:()=>S.gold>=10000, progress:()=>[Math.min(10000,S.gold),10000], reward:{gold:500}},
  {id:'all_elements', icon:'🌈', name:'Пять стихий', desc:'Владей драконом каждой стихии',
   check:()=>ELEMENTS_LIST.every(el=>S.dragons.some(d=>speciesById(d.id).el===el)), progress:()=>[ELEMENTS_LIST.filter(el=>S.dragons.some(d=>speciesById(d.id).el===el)).length,5], reward:{gold:600,dust:20}},
  {id:'first_boss', icon:'👑', name:'Первый владыка', desc:'Победи первого владыку мира',
   check:()=>WORLD_BOSSES.some(b=>bossDefeated(b.id)), progress:()=>[WORLD_BOSSES.some(b=>bossDefeated(b.id))?1:0,1], reward:{gold:800,dust:30}},
  {id:'first_legend', icon:'✨', name:'Легендарный питомец', desc:'Получи легендарного дракона (★4+)',
   check:()=>S.dragons.some(d=>speciesById(d.id).rarity>=4), progress:()=>[S.dragons.some(d=>speciesById(d.id).rarity>=4)?1:0,1], reward:{gold:700,dust:25}},
  // — кросс-системные (связывают несколько систем) —
  {id:'sys_cartographer', icon:'🗺️', name:'Картограф', desc:'Исследуй любой регион на 100% (исследование → награды)',
   check:()=>Object.values(S.worldExplored||{}).some(v=>v>=100), progress:()=>[Math.min(100,Math.max(0,...Object.values(S.worldExplored||{}),0)),100], reward:{gold:1000,dust:40}},
  {id:'sys_clutch', icon:'🥚', name:'Хранитель кладки', desc:'Открой 8 типов яиц в Кодексе (бои/боссы/исследование)',
   check:()=>Object.keys(S.eggStats||{}).length>=8, progress:()=>[Math.min(8,Object.keys(S.eggStats||{}).length),8], reward:{gold:900,dust:35}},
  {id:'sys_worldlore', icon:'📖', name:'Знаток мира', desc:'Открой 8 событий мира (исследование → Кодекс)',
   check:()=>Object.keys((S.worldCodex||{}).events||{}).length>=8, progress:()=>[Math.min(8,Object.keys((S.worldCodex||{}).events||{}).length),8], reward:{gold:900,dust:35}},
  {id:'sys_twotriumph', icon:'☠️', name:'Двойной триумф', desc:'Победи 2 владык (боссы → яйца, легенды, материалы)',
   check:()=>(typeof WORLD_BOSSES!=='undefined')&&WORLD_BOSSES.filter(b=>bossDefeated(b.id)).length>=2, progress:()=>[(typeof WORLD_BOSSES!=='undefined')?WORLD_BOSSES.filter(b=>bossDefeated(b.id)).length:0,2], reward:{gold:1500,dust:60}},
  {id:'all_species',  icon:'🐉', name:'Собиратель видов',    desc:'Открой всех 15 видов драконов',
   check:()=>SPECIES.every(sp=>S.discovered[sp.id]), progress:()=>[SPECIES.filter(sp=>S.discovered[sp.id]).length,SPECIES.length], reward:{gold:2000,dust:100}},
  {id:'lore_ember',   icon:'📜', name:'Летописец Огня',      desc:'Собери все свитки Огненного мира',
   check:()=>LORE_SCROLLS.filter(s=>s.world==='emberreach').every(hasScroll), progress:()=>[LORE_SCROLLS.filter(s=>s.world==='emberreach'&&hasScroll(s)).length,LORE_SCROLLS.filter(s=>s.world==='emberreach').length], reward:{gold:800,dust:25}},
  {id:'lore_mire',    icon:'📜', name:'Летописец Топей',     desc:'Собери все свитки Ядовитого мира',
   check:()=>LORE_SCROLLS.filter(s=>s.world==='mirelot').every(hasScroll), progress:()=>[LORE_SCROLLS.filter(s=>s.world==='mirelot'&&hasScroll(s)).length,LORE_SCROLLS.filter(s=>s.world==='mirelot').length], reward:{gold:800,dust:25}},
  {id:'lore_glacior', icon:'📜', name:'Летописец Стужи',     desc:'Собери все свитки Ледяного мира',
   check:()=>LORE_SCROLLS.filter(s=>s.world==='glacior').every(hasScroll), progress:()=>[LORE_SCROLLS.filter(s=>s.world==='glacior'&&hasScroll(s)).length,LORE_SCROLLS.filter(s=>s.world==='glacior').length], reward:{gold:800,dust:25}},
  {id:'lore_storm',   icon:'📜', name:'Летописец Бурь',      desc:'Собери все свитки Штормового мира',
   check:()=>LORE_SCROLLS.filter(s=>s.world==='stormpeak').every(hasScroll), progress:()=>[LORE_SCROLLS.filter(s=>s.world==='stormpeak'&&hasScroll(s)).length,LORE_SCROLLS.filter(s=>s.world==='stormpeak').length], reward:{gold:800,dust:25}},
  {id:'lore_void',    icon:'📜', name:'Летописец Пустоты',   desc:'Собери все свитки Теневого мира',
   check:()=>LORE_SCROLLS.filter(s=>s.world==='voidedge').every(hasScroll), progress:()=>[LORE_SCROLLS.filter(s=>s.world==='voidedge'&&hasScroll(s)).length,LORE_SCROLLS.filter(s=>s.world==='voidedge').length], reward:{gold:800,dust:25}},
  {id:'all_bosses',   icon:'☠️', name:'Гроза владык',        desc:'Победи всех 5 владык миров',
   check:()=>WORLD_BOSSES.every(b=>bossDefeated(b.id)), progress:()=>[WORLD_BOSSES.filter(b=>bossDefeated(b.id)).length,WORLD_BOSSES.length], reward:{gold:5000,dust:150}},
  {id:'first_asc',    icon:'⭐', name:'Первое Восхождение',  desc:'Проведи дракона через Восхождение',
   check:()=>S.dragons.some(d=>(d.asc||0)>0), progress:()=>[S.dragons.some(d=>(d.asc||0)>0)?1:0,1], reward:{gold:1500,dust:50}},
  {id:'perfect_gene', icon:'🧬', name:'Идеальная чешуя',     desc:'Выведи дракона с идеальным геномом',
   check:()=>S.dragons.some(d=>isPerfect(d.genes)), progress:()=>[S.dragons.some(d=>isPerfect(d.genes))?1:0,1], reward:{gold:1500,dust:60}},
  {id:'forge_max',    icon:'⚒️', name:'Легенда наковальни',  desc:'Выкуй артефакт до предела (+8)',
   check:()=>S.artifacts.some(a=>a.level>=FORGE_MAX), progress:()=>[S.artifacts.some(a=>a.level>=FORGE_MAX)?1:0,1], reward:{gold:1200,dust:40}},
  {id:'deco_six',     icon:'🎨', name:'Уютное гнездо',       desc:'Заполни все 6 мест украшениями',
   check:()=>Object.keys(S.decorations||{}).length>=6, progress:()=>[Object.keys(S.decorations||{}).length,6], reward:{gold:1000,dust:30}},
  {id:'five_100',     icon:'🏔️', name:'Пять вершин',         desc:'Вырасти 5 драконов до 100 уровня',
   check:()=>S.dragons.filter(d=>d.level>=100).length>=5, progress:()=>[Math.min(5,S.dragons.filter(d=>d.level>=100).length),5], reward:{gold:4000,dust:120}},
];
function milestoneClaimed(id){ if(!S.milestonesClaimed)S.milestonesClaimed={}; return !!S.milestonesClaimed[id]; }
function claimMilestone(id){
  const m=MILESTONES.find(x=>x.id===id);
  if(!m || milestoneClaimed(id) || !m.check()) return;
  S.milestonesClaimed[id]=true;
  S.gold+=m.reward.gold; S.dust+=m.reward.dust;
  sfx('win'); persist(); renderLedger();
  toast(`${m.icon} <b>Веха «${m.name}» взята!</b> +${m.reward.gold}🪙 +${m.reward.dust}✦`);
}

/* ===== РЫНОК (золотые стоки) ===== */
const MARKET_KEY_PRICE={1:400, 2:1200, 3:3000};
const MARKET_DUST={gold:150, dust:5, dailyCap:30}; // обмен 150🪙→5✦, максимум 30✦ в день
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

  /* ===== ДОПОЛНЕНИЕ: ОГНЕННЫЙ МИР ===== */
  {world:'emberreach', biome:1, n:4, title:'Песня углей', text:'Ночами пустоши поют: это остывающие угли трещат в лад. Драконята-огоньки засыпают только под эту песню.'},
  {world:'emberreach', biome:1, n:5, title:'Стихийный круг', text:'Огонь силён против яда, но вода бури гасит пламя. Мудрый драконовод помнит круг стихий и выбирает бойца по врагу.', hint:'Стихия-противовес даёт ×1.4 урона — смотри значок ▲ на приёмах.'},
  {world:'emberreach', biome:2, n:1, title:'Кузни лавовых рек', text:'Во втором поясе Карн-Вулака лава течёт медленно, как мёд. Древние ковали здесь оружие, окуная заготовки прямо в огненные реки.'},
  {world:'emberreach', biome:2, n:2, title:'Пасть Инферно', text:'Оружие берсерков лавовых рек. Кто держит Пасть Инферно, бьёт без промаха в самое сердце — но забывает о собственной защите.', hint:'Пасть Инферно (огонь): высокий крит ценой защиты.'},
  {world:'emberreach', biome:2, n:3, title:'Саламандровы тропы', text:'По берегам лавовых рек бегают огненные саламандры. Они показывают путникам броды — если угостить их углём.'},
  {world:'emberreach', biome:2, n:4, title:'Закалка характера', text:'«Каким вылупился — таким и вырастет», — говорят о характерах драконов. Задиру не переделать в невозмутимого, но любить можно всякого.', hint:'Характер дракона постоянен: смотри, какие статы он усиливает.'},
  {world:'emberreach', biome:2, n:5, title:'Пепельные врата', text:'Между вторым поясом и Сердцем Вулкана стоят врата из спёкшегося пепла. Открываются лишь тем, чей портал напитан силой.'},
  {world:'emberreach', biome:3, n:3, title:'Венец Пепла', text:'Корона древних огненных королей. Жар её заживляет раны носителя каждый вздох — но остужает ярость его ударов.', hint:'Венец Пепла (огонь): лечение каждый ход ценой атаки.'},
  {world:'emberreach', biome:3, n:4, title:'Искра рода', text:'В каждом роду драконов дремлет искра. Зажжённая пылью селекционера, она горит вечно, умножая силу всех чешуек.', hint:'Искра рода: +8% ко всем статам навсегда, зажигается за ✦ в Логове.'},
  {world:'emberreach', biome:3, n:5, title:'Сердце не остывает', text:'Говорят, если приложить ухо к скале в Сердце Вулкана, услышишь стук. Мир-вулкан жив, и он слушает тех, кто ходит по нему.'},

  /* ===== ДОПОЛНЕНИЕ: ЯДОВИТЫЙ МИР ===== */
  {world:'mirelot', biome:1, n:4, title:'Светляки трясины', text:'Болотные огоньки — не души утопших, как пугают малышей, а светляки-великаны. Они любят драконов и вьются за ними хороводом.'},
  {world:'mirelot', biome:1, n:5, title:'Тропа терпеливых', text:'В топях спешка тонет первой. Кто идёт медленно и смотрит под ноги, находит то, что спрятала трясина.'},
  {world:'mirelot', biome:2, n:1, title:'Грибные чертоги', text:'Во втором поясе грибы вырастают выше деревьев. Под их шляпками драконы пережидают ядовитые дожди.'},
  {world:'mirelot', biome:2, n:2, title:'Клык Мора', text:'Отравленный клык болотного змея. Каждая рана врага возвращает носителю жизнь — но сам он становится хрупок, как сухой лист.', hint:'Клык Мора (яд): сильный вампиризм ценой запаса жизни.'},
  {world:'mirelot', biome:2, n:3, title:'Обмен у трясины', text:'Болотные торговцы скупают золото охотно: в топях оно не ржавеет. За звонкую монету дают и ключи, и мерцающую пыль.', hint:'На Рынке в поселении можно купить ключи и обменять золото на ✦.'},
  {world:'mirelot', biome:2, n:4, title:'Мутная вода', text:'В мутной воде отражение честнее зеркала: оно показывает не чешую, а нрав. Загляни — узнаешь своего дракона лучше.'},
  {world:'mirelot', biome:2, n:5, title:'Корни-письмена', text:'Корни древних мангров сплетаются в письмена. Учёные драконоводы читают их веками — и всё ещё в начале первой строки.'},
  {world:'mirelot', biome:3, n:3, title:'Оплот Топей', text:'Панцирь исполинской черепахи, что спит под Ульем Спор. Носитель почти неуязвим и раны его затягиваются — но шаг его тяжёл.', hint:'Оплот Топей (яд): броня и лечение ценой прыти.'},
  {world:'mirelot', biome:3, n:4, title:'Перекройка жил', text:'Мастера селекции умеют перекраивать силу дракона: убавить в одном, прибавить в другом. Изредка жила растёт сама — это великая удача.', hint:'Мутация перераспределяет гены; изредка растит общий бюджет.'},
  {world:'mirelot', biome:3, n:5, title:'Сон Матери', text:'Матерь Топей спит на дне Улья тысячу лет из тысячи и одного года. Горе миру в год, когда она просыпается голодной.'},

  /* ===== ДОПОЛНЕНИЕ: ЛЕДЯНОЙ МИР ===== */
  {world:'glacior', biome:1, n:4, title:'Снежные фонари', text:'Ледяные драконы дышат на снежинки, и те застывают светящимися шарами. Так зажигают фонари в Хладном Безмолвии.'},
  {world:'glacior', biome:1, n:5, title:'Узоры на льду', text:'Каждый мороз рисует на льду свой узор. Старые драконы читают в них погоду на сто лет вперёд.'},
  {world:'glacior', biome:2, n:1, title:'Хрустальные гроты', text:'Во втором поясе льды становятся прозрачными, как стекло. В гротах здесь звенит эхо — само по себе, без голоса.'},
  {world:'glacior', biome:2, n:2, title:'Грань Ледника', text:'Клинок, отколотый от сердца древнего ледника. Рубит наверняка, точно в цель — но холод его сковывает ноги носителя.', hint:'Грань Ледника (лёд): крит ценой прыти.'},
  {world:'glacior', biome:2, n:3, title:'Ледяная вежливость', text:'В гротах не кричат: от громкого слова падают сосульки-копья. Ледяные драконы оттого немногословны и точны.'},
  {world:'glacior', biome:2, n:4, title:'Замок с секретом', text:'Ледяные сундуки хранят замки-загадки. Тот, кто попадёт отмычкой в самое сердце механизма, получает больше, чем ждал.', hint:'Идеальный подбор замка (золотой центр) даёт лут ×1.5.'},
  {world:'glacior', biome:2, n:5, title:'Спящие великаны', text:'Горы второго пояса — не горы вовсе, а свернувшиеся ледяные исполины. Не буди их громкой ковкой.'},
  {world:'glacior', biome:3, n:3, title:'Сердце Инея', text:'Льдинка в форме сердца, что бьётся. Стужа её затягивает раны носителя каждый вздох — но остужает и его удары.', hint:'Сердце Инея (лёд): лечение каждый ход ценой атаки.'},
  {world:'glacior', biome:3, n:4, title:'Вершина и новый путь', text:'Дракон, достигший вершины Шпиля, может начать путь заново — и каждый новый путь делает его сильнее прежнего.', hint:'Восхождение: дракон 100 ур. + ⭐ звезда владыки = вечные +6% к статам.'},
  {world:'glacior', biome:3, n:5, title:'Бездна помнит', text:'Замёрзшая Бездна помнит всех, кто спускался. Имена их проступают инеем на стенах — и твоё однажды проступит.'},

  /* ===== ДОПОЛНЕНИЕ: ШТОРМОВОЙ МИР ===== */
  {world:'stormpeak', biome:1, n:4, title:'Гнёзда на ветру', text:'Буревестники вьют гнёзда прямо в потоках ветра. Яйца их парят, не падая, — пока не придёт время вылупиться.'},
  {world:'stormpeak', biome:1, n:5, title:'Считалка грома', text:'«Раз — сверкнуло, два — гремит, три — дракончик в небо мчит!» Так штормовые малыши учатся не бояться грозы.'},
  {world:'stormpeak', biome:2, n:1, title:'Лестница молний', text:'Во втором поясе молнии бьют по одним и тем же местам — будто ступени. Смелые драконы взлетают по ним, как по лестнице.'},
  {world:'stormpeak', biome:2, n:2, title:'Око Бури', text:'В центре всякой бури есть тихое око. Заключённое в талисман, оно дарит носителю бездонную ману — но истончает его тело.', hint:'Око Бури (буря): большой запас и приток маны ценой жизни.'},
  {world:'stormpeak', biome:2, n:3, title:'Двойной раскат', text:'Настоящая ульта — как двойной раскат грома: попади в ритм дважды, и удар сокрушит любого.', hint:'В мини-игре ульты два точных попадания дают двойной крит ×2.25.'},
  {world:'stormpeak', biome:2, n:4, title:'Ветряные письма', text:'Штормовые драконы пишут письма прямо на ветре. Дойдёт ли письмо — зависит от почерка и погоды.'},
  {world:'stormpeak', biome:2, n:5, title:'Тихая примета', text:'Если буря вдруг стихла — не радуйся, а считай до трёх. На счёт «три» она вернётся вдвое злее.'},
  {world:'stormpeak', biome:3, n:3, title:'Доспех Вихря', text:'Броня, сотканная из сгустков ветра. Носитель стремителен и меток — но сам почти невесом и хрупок.', hint:'Доспех Вихря (буря): прыть и крит ценой жизни.'},
  {world:'stormpeak', biome:3, n:4, title:'Мастерская мастеров', text:'Лучшие кузни куют даже мифическую чешую. Но растить кузню надо загодя: великая находка бесполезна без великого горна.', hint:'Кузня ур.5 нужна, чтобы ковать мифические артефакты ★★★★★.'},
  {world:'stormpeak', biome:3, n:5, title:'Трон без хозяина', text:'Громовой Трон пустует между бурями. Говорят, он ждёт дракона, который переживёт тысячу молний. Пока не дождался.'},

  /* ===== ДОПОЛНЕНИЕ: ТЕНЕВОЙ МИР ===== */
  {world:'voidedge', biome:1, n:4, title:'Мягкие шаги', text:'В Пределе не слышно шагов: тьма подкладывает под лапы бархат. Оттого теневые драконы ходят бесшумно даже по гравию.'},
  {world:'voidedge', biome:1, n:5, title:'Глаза привыкают', text:'Первый час во тьме страшно. Второй — любопытно. К третьему часу ты видишь то, чего при свете не бывает.'},
  {world:'voidedge', biome:2, n:1, title:'Сумеречный сад', text:'Во втором поясе растут цветы, что распускаются только в темноте. Сорванные, они светятся неделю — а потом просятся обратно.'},
  {world:'voidedge', biome:2, n:2, title:'Беззвёздная Сфера', text:'Шар чистой пустоты. Носитель черпает из него бездонную ману и бьёт без промаха — но пустота съедает его защиту.', hint:'Беззвёздная Сфера (тень): мана и крит ценой всей защиты.'},
  {world:'voidedge', biome:2, n:3, title:'Эхо наоборот', text:'В сумеречном саду эхо отвечает раньше, чем крикнешь. Привыкнуть можно, подружиться — сложнее.'},
  {world:'voidedge', biome:2, n:4, title:'Идеальная чешуя', text:'Раз в сто поколений рождается дракон с идеальным геномом. Селекционеры всей жизни кладут ради одной такой кладки.', hint:'Идеальный геном 5/5/5/5 — вершина селекции в Гнездилище.'},
  {world:'voidedge', biome:2, n:5, title:'Договор с тенью', text:'Тень не служит — тень сотрудничает. Она отдаёт силу ровно в ту меру, в какую ты готов отдать что-то ей.'},
  {world:'voidedge', biome:3, n:3, title:'Мантия Мрака', text:'Плащ из сгущённой ночи. Латает раны носителя и пьёт жизнь врага — но глушит его собственные удары, как подушка.', hint:'Мантия Мрака (тень): лечение и вампиризм ценой атаки.'},
  {world:'voidedge', biome:3, n:4, title:'Последняя дверь', text:'В Беззвёздном Ядре есть дверь, которую никто не открывал. На ней нет замка — только надпись: «Ещё рано».'},
  {world:'voidedge', biome:3, n:5, title:'Свет внутри', text:'Дракон, прошедший все пять миров, несёт в себе искры каждого. Тьма расступается перед тем, кто сам стал светом.'},
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
  const pool=DECORATIONS.filter(d=>!d.trophy && !d.premium); // трофеи — за владык, премиум — на Рынке
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
        <button class="btn ghost" id="lpSkip">Взломать грубо</button>
        <button class="btn" id="lpHit">Подобрать!</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  // ширина/скорость зависят от уровня: глубже — уже и быстрее
  const goodW=[0,36,28,22][tier], perfW=[0,10,8,6][tier];
  const goodStart=50-goodW/2, goodEnd=50+goodW/2, perfStart=50-perfW/2, perfEnd=50+perfW/2;
  const SPEED=[0,96,126,156][tier]; // %/сек — по времени, не по кадрам
  let pos=0,dir=1,raf=null,zone=0,perfectAll=true,anyHit=true,last=performance.now();
  const marker=overlay.querySelector('#lpMarker');
  function tick(now){ const dt=Math.min(0.05,(now-last)/1000); last=now;
    pos+=dir*SPEED*dt; if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;} marker.style.left=pos+'%'; raf=requestAnimationFrame(tick); }
  raf=requestAnimationFrame(t2=>{last=t2;tick(t2);});
  function cleanup(){ cancelAnimationFrame(raf); overlay.remove(); }
  overlay.querySelector('#lpHit').onpointerdown=(e)=>{
    e.preventDefault();
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
  overlay.querySelector('#lpSkip').onpointerdown=(e)=>{ e.preventDefault(); cleanup(); done('jam'); };
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
  sfx('chest');
  toast(`<b>${ct.icon} ${ct.name} открыт!</b> ${resultLabel}<br>+${loot.gold}🪙 +${loot.dust}✦${items?'<br>'+items:''}`);
  // обновить открытую сокровищницу или хаб
  if(S._treasuryOpen) renderTreasury();
  else if($('#hub')&&$('#hub').classList.contains('on')) renderHub();
}

/* ===== СОКРОВИЩНИЦА (отдельный экран для сундуков) ===== */
function openTreasury(){ S._treasuryOpen=true; hintOnce('treasury','Ключ запускает подбор замка — попади в золотой центр для бонусного лута! Кузня вскрывает наверняка, но за ресурсы.'); renderTreasury(); }
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
   weakTo:'frost', weakness:'Уязвим к льду. Береги ману на ульту в фазе ярости.', hpMult:2.2, atkMult:1.15,
   mech:null, rewardEgg:'egg_ashking',
   phases:[{at:0.7,kind:'enrage',msg:'разгорается — удары чаще!'},{at:0.4,kind:'rage',msg:'впадает в ЯРОСТЬ! (+урон)'},{at:0.15,kind:'final',msg:'копит Испепеляющий удар — берегись!'}],
   trophyId:'trophy_fire',
   lore:'Даже вечный огонь боится холода, что старше самого пламени.'},
  {world:'mirelot', id:'boss_venom', name:'Матерь Топей',      icon:'🕸️', speciesBase:'blightfang',
   weakTo:'fire', weakness:'Уязвима к огню. В фазе щита пробивай броню сильными приёмами.', hpMult:2.2, atkMult:1.15,
   mech:null, rewardEgg:'egg_emerald',
   phases:[{at:0.7,kind:'shield',msg:'оплетает себя коконом (щит)'},{at:0.4,kind:'rage',msg:'приходит в ЯРОСТЬ! (+урон)'},{at:0.15,kind:'final',msg:'готовит Чумной шквал!'}],
   trophyId:'trophy_venom',
   lore:'Пламя — единственное, что заставляет её отступить.'},
  {world:'glacior', id:'boss_frost', name:'Владыка Стужи',     icon:'❄️', speciesBase:'permafrost',
   weakTo:'fire', weakness:'Уязвим к огню. Щит держится 2 удара — бей сильным приёмом.', hpMult:2.3, atkMult:1.1,
   mech:null, rewardEgg:'egg_northward',
   phases:[{at:0.7,kind:'shield',msg:'воздвигает ледяной панцирь (щит)'},{at:0.4,kind:'rage',msg:'трещит от ЯРОСТИ! (+урон)'},{at:0.15,kind:'final',msg:'копит Вечную мерзлоту!'}],
   trophyId:'trophy_frost',
   lore:'Лишь ярость пламени способна растопить его вечную броню.'},
  {world:'stormpeak', id:'boss_storm', name:'Владыка Бурь',      icon:'⚡', speciesBase:'thundercall',
   weakTo:null, weakness:'Бьёт трижды и замирает — в этот миг он беззащитен, бей сильнейшим.', hpMult:2.4, atkMult:1.2,
   mech:'stall3', rewardEgg:'egg_royal',
   phases:[{at:0.4,kind:'enrage',msg:'ускоряется — удары чаще!'},{at:0.15,kind:'final',msg:'копит Небесный гнев!'}],
   trophyId:'trophy_storm',
   lore:'Он бьёт трижды, а на четвёртый раз замирает — в этот миг он беззащитен.'},
  {world:'voidedge', id:'boss_shade', name:'Владыка Пустоты',   icon:'🌑', speciesBase:'worldserpent',
   weakTo:'fire', weakness:'Уязвим к огню и впитывает жизнь — дави быстро, не давай лечиться.', hpMult:2.5, atkMult:1.2,
   mech:'vamp', rewardEgg:'egg_ancient',
   phases:[{at:0.7,kind:'enrage',msg:'жаждет тьмы — вампиризм усилен!'},{at:0.4,kind:'rage',msg:'впадает в ЯРОСТЬ! (+урон)'},{at:0.15,kind:'final',msg:'готовит Беззвёздную ночь!'}],
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

/* ============================================================
   ИССЛЕДОВАНИЕ МИРА (данные отдельно от логики)
   WEATHER — погода (визуал), BIOME_META — атмосфера биома,
   WORLD_EVENTS — события по редкости с несколькими исходами.
   ============================================================ */
const WEATHER = [
  {id:'clear', name:'Ясно',   emoji:'☀️', tint:'rgba(255,240,190,0.05)', weight:34},
  {id:'rain',  name:'Дождь',  emoji:'🌧️', tint:'rgba(60,90,140,0.16)',  weight:20},
  {id:'snow',  name:'Снег',   emoji:'❄️', tint:'rgba(200,225,255,0.14)', weight:16},
  {id:'storm', name:'Гроза',  emoji:'⛈️', tint:'rgba(40,40,80,0.22)',   weight:12},
  {id:'fog',   name:'Туман',  emoji:'🌫️', tint:'rgba(200,200,210,0.20)', weight:18},
];
function rollWeather(region){
  // биом слегка влияет: лёд → чаще снег, буря → чаще гроза
  const w=WEATHER.map(x=>({x, w:x.weight
    + (region&&region.scene==='ice'&&x.id==='snow'?18:0)
    + (region&&region.el==='storm'&&x.id==='storm'?16:0)
    + (region&&region.scene==='jungle'&&x.id==='rain'?12:0)}));
  const tot=w.reduce((a,b)=>a+b.w,0); let r=Math.random()*tot;
  for(const e of w){ if((r-=e.w)<=0) return e.x; } return WEATHER[0];
}
const BIOME_META = {
  fire:  {name:'Огненный мир',  atmo:'Реки лавы и пепельные ветра.', emoji:'🌋'},
  jungle:{name:'Ядовитый мир',  atmo:'Топи, споры и хищные лозы.',   emoji:'🌿'},
  ice:   {name:'Ледяной мир',   atmo:'Вечная стужа и хрустальный наст.', emoji:'🏔️'},
  storm: {name:'Штормовой мир', atmo:'Грозовые фронты и парящие острова.', emoji:'⛰️'},
  shade: {name:'Теневой мир',   atmo:'Беззвёздная мгла и древние руины.', emoji:'🌑'},
};
// события: rarity common/uncommon/rare/epic/legendary; opts — исходы (осмотреть/обойти/исследовать/уйти)
const WORLD_EVENTS = [
  // — обычные —
  {rarity:'common', icon:'🪺', name:'Заброшенное гнездо', q:'Пустое гнездо на скале. Заглянуть?',
   opts:[{t:'🔎 Осмотреть', reward:'egg'},{t:'🪙 Обойти', reward:'gold'},{t:'🚪 Уйти', reward:'none'}]},
  {rarity:'common', icon:'💧', name:'Тихий водопад', q:'За водопадом что-то поблёскивает.',
   opts:[{t:'🔦 Заглянуть', reward:'dust'},{t:'🪙 Собрать монеты', reward:'gold'},{t:'🚪 Уйти', reward:'none'}]},
  {rarity:'common', icon:'🗿', name:'Древняя статуя', q:'Каменный страж смотрит вдаль.',
   opts:[{t:'✨ Изучить руны', reward:'codex'},{t:'🪙 Поискать клад', reward:'gold'},{t:'🚪 Уйти', reward:'none'}]},
  {rarity:'common', icon:'🏕️', name:'Старый лагерь', q:'Погасший костёр странников.',
   opts:[{t:'📦 Обыскать', reward:'dust'},{t:'🍖 Найти припасы', reward:'gold'},{t:'🚪 Уйти', reward:'none'}]},
  // — необычные —
  {rarity:'uncommon', icon:'🏚️', name:'Разрушенная башня', q:'Обвалившаяся башня магов.',
   opts:[{t:'🧗 Подняться', reward:'relic'},{t:'🔮 Искать свиток', reward:'scroll'},{t:'🚪 Уйти', reward:'none'}]},
  {rarity:'uncommon', icon:'⛩️', name:'Старый храм', q:'Забытое святилище в тумане.',
   opts:[{t:'🙏 Помолиться', reward:'egg'},{t:'💎 Обыскать алтарь', reward:'dust'},{t:'🚪 Уйти', reward:'none'}]},
  {rarity:'uncommon', icon:'🪵', name:'Магическое дерево', q:'Дерево гудит от древней силы.',
   opts:[{t:'🌿 Коснуться', reward:'scroll'},{t:'🪙 Собрать плоды', reward:'gold'},{t:'🚪 Уйти', reward:'none'}]},
  // — редкие —
  {rarity:'rare', icon:'🐉', name:'Редкий дракон', q:'Вдали мелькнул невиданный силуэт!',
   opts:[{t:'🔎 Проследить', reward:'egg_rare'},{t:'🪙 Не рисковать', reward:'gold'},{t:'🚪 Уйти', reward:'none'}]},
  {rarity:'rare', icon:'🌫️', name:'Таинственный туман', q:'Мгла скрывает что-то ценное.',
   opts:[{t:'🌫️ Войти', reward:'relic'},{t:'🔮 Позвать эхо', reward:'scroll'},{t:'🚪 Уйти', reward:'none'}]},
  {rarity:'rare', icon:'🕳️', name:'Кристальная пещера', q:'Своды сияют самоцветами.',
   opts:[{t:'⛏️ Добыть', reward:'shards'},{t:'🥚 Искать кладку', reward:'egg_rare'},{t:'🚪 Уйти', reward:'none'}]},
  // — эпические —
  {rarity:'epic', icon:'🌀', name:'Древний портал', q:'Кольцо портала пульсирует силой.',
   opts:[{t:'🌀 Шагнуть', reward:'egg_epic'},{t:'💠 Собрать эссенцию', reward:'shards'},{t:'🚪 Уйти', reward:'none'}]},
  {rarity:'epic', icon:'🏝️', name:'Неизвестный остров', q:'Парящий остров вне карт.',
   opts:[{t:'🗺️ Исследовать', reward:'chest'},{t:'🥚 Искать гнездо', reward:'egg_epic'},{t:'🚪 Уйти', reward:'none'}]},
  // — легендарные —
  {rarity:'legendary', icon:'🐾', name:'Следы исполина', q:'Гигантские следы уходят к горизонту…',
   opts:[{t:'👣 Идти по следу', reward:'egg_legend'},{t:'💰 Забрать оброненное', reward:'chest'},{t:'🚪 Уйти', reward:'none'}]},
];
function rollWorldEventRarity(){
  const t=(typeof GB!=='undefined'&&GB.World&&GB.World.eventRarity)||{common:60,uncommon:25,rare:10,epic:4,legendary:1};
  const order=['legendary','epic','rare','uncommon','common']; const tot=Object.values(t).reduce((a,b)=>a+b,0);
  let r=Math.random()*tot; for(const k of order.slice().reverse()){ if((r-=t[k])<=0) return k; } return 'common';
}
function rollWorldEvent(){
  const order=['common','uncommon','rare','epic','legendary'];
  let rr=rollWorldEventRarity();
  for(let i=order.indexOf(rr);i>=0;i--){ const pool=WORLD_EVENTS.filter(e=>e.rarity===order[i]); if(pool.length) return pool[Math.floor(Math.random()*pool.length)]; }
  return WORLD_EVENTS[0];
}

/* ============================================================
   REWORK: ЗАБЕГ-РОГЛАЙТ (данные отдельно от логики)
   RUN_BOONS — усиления на один забег (выбор после побед).
   ROUTE_GATES — выбор пути между ярусами: риск ↔ награда.
   REGION_TRIALS — испытание региона у портала (проверка механик).
   REWARD_RISK — подписи риска/ценности для исходов событий.
   ============================================================ */
const RUN_BOONS=[
  {id:'atk',   icon:'⚔️', name:'Ярость',        desc:'+12% атаки',              fx:{atkPct:12}},
  {id:'hp',    icon:'❤️', name:'Крепость',      desc:'+16% здоровья',           fx:{hpPct:16}},
  {id:'crit',  icon:'🎯', name:'Меткость',      desc:'+6% шанс крита',          fx:{critPct:6}},
  {id:'mana',  icon:'🔮', name:'Родник маны',   desc:'+35% восстановления маны',fx:{manaPct:35}},
  {id:'el',    icon:'✨', name:'Стихийный дар', desc:'+15% урона своей стихией',fx:{elPct:15}},
  {id:'def',   icon:'🛡️', name:'Чешуя',         desc:'+14% защиты',             fx:{defPct:14}},
  {id:'spd',   icon:'💨', name:'Порыв',         desc:'+10% скорости',           fx:{spdPct:10}},
  {id:'vamp',  icon:'🩸', name:'Жажда',         desc:'5% урона лечит',          fx:{vampPct:5}},
  {id:'dash',  icon:'⚡', name:'Лёгкие крылья', desc:'−25% перезарядки рывка',  fx:{dashPct:25}},
  {id:'heal',  icon:'🌿', name:'Второе дыхание',desc:'+20% здоровья сейчас',    fx:{healNow:20}},
];
const ROUTE_GATES=[
  {id:'safe',   icon:'🌿', name:'Тихая тропа',   desc:'Минимальный риск · скромная добыча'},
  {id:'risky',  icon:'🏚️', name:'Древние руины', desc:'Средний риск · артефакты и свитки'},
  {id:'deadly', icon:'💀', name:'Гиблое место',  desc:'Высокий риск · редкие яйца и сундуки'},
];
// испытание региона: страж у портала, проверяющий механику биома
const REGION_TRIALS={
  fire:  {icon:'🌋', name:'Испытание Жара',   mech:'burn',  adds:1, hint:'Пол горит — не стой на месте!'},
  jungle:{icon:'🕸️', name:'Испытание Роя',    mech:'swarm', adds:4, hint:'Массовый бой — бей по площади!'},
  ice:   {icon:'❄️', name:'Испытание Стужи',  mech:'chill', adds:1, hint:'Холод замедляет — держи темп!'},
  storm: {icon:'⚡', name:'Испытание Бури',   mech:'bolts', adds:2, hint:'Уворачивайся от молний!'},
  shade: {icon:'🌑', name:'Испытание Тьмы',   mech:'veil',  adds:2, hint:'Страж исчезает — следи за тенью!'},
};
// ценность наград событий (честное «риск ↔ награда» в карточках)
const REWARD_RISK={
  none:{r:'—',v:'ничего'}, gold:{r:'низкий',v:'золото'}, dust:{r:'низкий',v:'пыль'},
  shards:{r:'средний',v:'осколки'}, scroll:{r:'средний',v:'свиток'}, codex:{r:'низкий',v:'запись'},
  relic:{r:'средний',v:'артефакт'}, chest:{r:'высокий',v:'сундук'}, egg:{r:'средний',v:'яйцо'},
  egg_rare:{r:'высокий',v:'редкое яйцо'}, egg_epic:{r:'высокий',v:'эпич. яйцо'}, egg_legend:{r:'высочайший',v:'легенд. яйцо'},
};

/* ======================= АРТЕФАКТЫ =======================
   base — бонус на 1 уровне; per — прибавка за уровень ковки.
   Новые поля (для легендарных/мифических):
   - fx: спец-эффекты {critPct, manaMax, manaRegen, healPct, vampPct} на 1 ур
   - fxPer: прирост эффектов за уровень ковки
   - malus: дебаф (отрицательные статы/эффекты), фиксированный (трейд-офф)
   - world: к какому миру привязан (добывается в биоме III этого мира) */
const ARTIFACTS = [
  // — базовые (обычные, чистые бонусы) —
  {id:'emberfang',  name:'Клык Жароеда',     icon:'<img class="artifact-game-icon" src="images/artifact_emberfang.webp" alt="Клык Жароеда">', slot:'weapon', rarity:1, el:'fire',
   base:{atk:3}, per:{atk:2}, lore:'Клык древнего дракона, что вечно тлеет изнутри.'},
  {id:'frostshard', name:'Осколок Вечнольда', icon:'<img class="artifact-game-icon" src="images/artifact_frostshard.webp" alt="Осколок Вечнольда">', slot:'armor', rarity:2, el:'frost',
   base:{def:3,hp:6}, per:{def:2,hp:4}, lore:'Льдина, не тающая даже в пламени горна.'},
  {id:'venomidol',  name:'Идол Гнили',        icon:'<img class="artifact-game-icon" src="images/artifact_venomidol.webp" alt="Идол Гнили">', slot:'charm', rarity:2, el:'venom',
   base:{atk:2,spd:2}, per:{atk:1,spd:2}, lore:'Каменный истукан, источающий ядовитую дымку.'},
  {id:'stormcrest', name:'Гребень Грозы',     icon:'<img class="artifact-game-icon" src="images/artifact_stormcrest.webp" alt="Гребень Грозы">', slot:'charm', rarity:3, el:'storm',
   base:{spd:4,atk:2}, per:{spd:3,atk:1}, lore:'Венец, в котором заперта пойманная молния.'},
  {id:'shadeplate', name:'Латы Безмолвия',    icon:'<img class="artifact-game-icon" src="images/artifact_shadeplate.webp" alt="Латы Безмолвия">', slot:'armor', rarity:3, el:'shade',
   base:{def:5,hp:8}, per:{def:3,hp:6}, lore:'Доспех, сотканный из самой ночной тьмы.'},
  {id:'pyreblade',  name:'Клинок Пламевластца',icon:'<img class="artifact-game-icon" src="images/artifact_pyreblade.webp" alt="Клинок Пламевластца">', slot:'weapon', rarity:4, el:'fire',
   base:{atk:6,spd:1}, per:{atk:3,spd:1}, lore:'Меч, выкованный в жерле спящего вулкана.'},
  {id:'worldheart', name:'Сердце Мироздания', icon:'<img class="artifact-game-icon" src="images/artifact_worldheart.webp" alt="Сердце Мироздания">', slot:'charm', rarity:5, el:'venom',
   base:{hp:14,atk:3,def:3,spd:2}, per:{hp:8,atk:2,def:2,spd:1}, lore:'Осколок первотворения. Дарует силу всем чешуйкам разом.'},
  {id:'galewing',   name:'Перо Вихрекрыла',  icon:'<img class="artifact-game-icon" src="images/artifact_galewing.webp" alt="Перо Вихрекрыла">', slot:'charm', rarity:2, el:'storm',
   base:{spd:5}, per:{spd:3}, lore:'Перо птицы, обгонявшей собственный крик.'},
  {id:'ironhide',   name:'Шкура Железноспина',icon:'<img class="artifact-game-icon" src="images/artifact_ironhide.webp" alt="Шкура Железноспина">', slot:'armor', rarity:2, el:'fire',
   base:{def:4,hp:4}, per:{def:2,hp:3}, lore:'Обрезок шкуры дракона, что спал в кузнечном горне.'},
  {id:'fangblade',  name:'Зуб-Кинжал',        icon:'<img class="artifact-game-icon" src="images/artifact_fangblade.webp" alt="Зуб-Кинжал">', slot:'weapon', rarity:2, el:'shade',
   base:{atk:4,spd:1}, per:{atk:2,spd:1}, lore:'Молочный зуб теневого дракона. Малыш вырос — зуб остался.'},
  {id:'tidecharm',  name:'Оберег Приливов',   icon:'<img class="artifact-game-icon" src="images/artifact_tidecharm.webp" alt="Оберег Приливов">', slot:'charm', rarity:3, el:'frost',
   base:{hp:10,def:2}, per:{hp:6,def:2}, lore:'Ракушка, в которой шумит море всех пяти миров.'},
  {id:'runeblade',  name:'Рунный Резак',      icon:'<img class="artifact-game-icon" src="images/artifact_runeblade.webp" alt="Рунный Резак">', slot:'weapon', rarity:3, el:'storm',
   base:{atk:5,spd:2}, per:{atk:2,spd:2}, lore:'По лезвию бегут руны — быстрее, чем успеваешь прочесть.'},

  /* ===== ОГНЕННЫЙ МИР (биом III: Сердце Вулкана) ===== */
  {id:'infernomaw', name:'Пасть Инферно', icon:'<img class="artifact-game-icon" src="images/artifact_infernomaw.webp" alt="Пасть Инферно">', slot:'weapon', rarity:4, el:'fire', world:'emberreach',
   base:{atk:10}, per:{atk:4}, fx:{critPct:8}, fxPer:{critPct:2}, malus:{def:-6},
   lore:'Оружие берсерка: испепеляет врага, но открывает носителя ударам.'},
  {id:'magmaheart', name:'Магмовое Сердце', icon:'<img class="artifact-game-icon" src="images/artifact_magmaheart.webp" alt="Магмовое Сердце">', slot:'charm', rarity:5, el:'fire', world:'emberreach',
   base:{atk:8,hp:20}, per:{atk:3,hp:10}, fx:{vampPct:6}, fxPer:{vampPct:1}, malus:{spd:-8},
   lore:'Пульсирующее ядро вулкана: выпивает жизнь врага, но тяжело носить.'},
  {id:'cindercrown',name:'Венец Пепла', icon:'<img class="artifact-game-icon" src="images/artifact_cindercrown.webp" alt="Венец Пепла">', slot:'armor', rarity:4, el:'fire', world:'emberreach',
   base:{def:8,hp:14}, per:{def:3,hp:8}, fx:{healPct:5}, fxPer:{healPct:1}, malus:{atk:-5},
   lore:'Корона, что заживляет раны носителя жаром, притупляя его ярость.'},

  /* ===== ЯДОВИТЫЙ МИР (биом III: Улей Спор) ===== */
  {id:'plaguefang', name:'Клык Мора', icon:'<img class="artifact-game-icon" src="images/artifact_plaguefang.webp" alt="Клык Мора">', slot:'weapon', rarity:4, el:'venom', world:'mirelot',
   base:{atk:8,spd:4}, per:{atk:3,spd:2}, fx:{vampPct:8}, fxPer:{vampPct:1}, malus:{hp:-18},
   lore:'Отравленный клык: возвращает здоровье с каждой раной, но носитель хрупок.'},
  {id:'sporecrown', name:'Корона Спор', icon:'<img class="artifact-game-icon" src="images/artifact_sporecrown.webp" alt="Корона Спор">', slot:'charm', rarity:5, el:'venom', world:'mirelot',
   base:{spd:8,atk:5}, per:{spd:4,atk:2}, fx:{critPct:10,manaRegen:1}, fxPer:{critPct:2}, malus:{def:-12},
   lore:'Живой венец грибницы: обостряет чутьё до смертельной точности ценой брони.'},
  {id:'mirebulwark',name:'Оплот Топей', icon:'<img class="artifact-game-icon" src="images/artifact_mirebulwark.webp" alt="Оплот Топей">', slot:'armor', rarity:4, el:'venom', world:'mirelot',
   base:{def:12,hp:22}, per:{def:4,hp:12}, fx:{healPct:6}, fxPer:{healPct:1}, malus:{spd:-10},
   lore:'Панцирь болотного исполина: почти непробиваем, но неповоротлив.'},

  /* ===== ЛЕДЯНОЙ МИР (биом III: Замёрзшая Бездна) ===== */
  {id:'frostcrown', name:'Корона Мерзлоты', icon:'<img class="artifact-game-icon" src="images/artifact_frostcrown.webp" alt="Корона Мерзлоты">', slot:'charm', rarity:5, el:'frost', world:'glacior',
   base:{def:6,hp:16}, per:{def:3,hp:8}, fx:{manaMax:3,manaRegen:1}, fxPer:{}, malus:{spd:-8},
   lore:'Ледяной венец, хранящий бездонный резерв маны — но сковывающий движения.'},
  {id:'glacialedge',name:'Грань Ледника', icon:'<img class="artifact-game-icon" src="images/artifact_glacialedge.webp" alt="Грань Ледника">', slot:'weapon', rarity:4, el:'frost', world:'glacior',
   base:{atk:9,def:4}, per:{atk:3,def:2}, fx:{critPct:7}, fxPer:{critPct:2}, malus:{spd:-6},
   lore:'Клинок из вечного льда: рубит наверняка, но тяжёл и холоден.'},
  {id:'rimeheart',  name:'Сердце Инея', icon:'<img class="artifact-game-icon" src="images/artifact_rimeheart.webp" alt="Сердце Инея">', slot:'armor', rarity:4, el:'frost', world:'glacior',
   base:{hp:26,def:8}, per:{hp:14,def:3}, fx:{healPct:7}, fxPer:{healPct:1}, malus:{atk:-6},
   lore:'Ледяное сердце медленно затягивает раны стужей, охлаждая и пыл атаки.'},

  /* ===== ШТОРМОВОЙ МИР (биом III: Громовой Трон) ===== */
  {id:'thunderfang',name:'Клык Грозы', icon:'<img class="artifact-game-icon" src="images/artifact_thunderfang.webp" alt="Клык Грозы">', slot:'weapon', rarity:5, el:'storm', world:'stormpeak',
   base:{atk:11,spd:6}, per:{atk:4,spd:3}, fx:{critPct:12}, fxPer:{critPct:2}, malus:{def:-10,hp:-10},
   lore:'Молния, скованная в клинок: сокрушительный крит ценой всякой защиты.'},
  {id:'stormeye',   name:'Око Бури', icon:'<img class="artifact-game-icon" src="images/artifact_stormeye.webp" alt="Око Бури">', slot:'charm', rarity:5, el:'storm', world:'stormpeak',
   base:{spd:10}, per:{spd:4}, fx:{manaMax:4,manaRegen:2}, fxPer:{}, malus:{hp:-14},
   lore:'Взор урагана: неиссякаемый поток маны для заклинателя, но тело истончается.'},
  {id:'galeplate',  name:'Доспех Вихря', icon:'<img class="artifact-game-icon" src="images/artifact_galeplate.webp" alt="Доспех Вихря">', slot:'armor', rarity:4, el:'storm', world:'stormpeak',
   base:{def:7,spd:6}, per:{def:3,spd:3}, fx:{critPct:5}, fxPer:{critPct:1}, malus:{hp:-8},
   lore:'Лёгкая броня из сгустков ветра — стремительна, но почти невесома.'},

  /* ===== ТЕНЕВОЙ МИР (биом III: Беззвёздное Ядро) ===== */
  {id:'voidreaper', name:'Жнец Пустоты', icon:'<img class="artifact-game-icon" src="images/artifact_voidreaper.webp" alt="Жнец Пустоты">', slot:'weapon', rarity:5, el:'shade', world:'voidedge',
   base:{atk:13}, per:{atk:5}, fx:{vampPct:10,critPct:6}, fxPer:{vampPct:1,critPct:1}, malus:{def:-14,spd:-6},
   lore:'Коса из антисвета: пожирает жизнь и бьёт без промаха, но носитель беззащитен.'},
  {id:'starlessorb',name:'Беззвёздная Сфера', icon:'<img class="artifact-game-icon" src="images/artifact_starlessorb.webp" alt="Беззвёздная Сфера">', slot:'charm', rarity:5, el:'shade', world:'voidedge',
   base:{atk:4,hp:18}, per:{atk:2,hp:10}, fx:{manaMax:5,manaRegen:2,critPct:6}, fxPer:{}, malus:{def:-16},
   lore:'Сфера чистой пустоты: бездонная мана и острый ум ценой всякой защиты.'},
  {id:'shroudmantle',name:'Мантия Мрака', icon:'<img class="artifact-game-icon" src="images/artifact_shroudmantle.webp" alt="Мантия Мрака">', slot:'armor', rarity:5, el:'shade', world:'voidedge',
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
  return Math.round((GB.Economy.forgeBase + art.rarity*GB.Economy.forgeRarityMul) * Math.pow(GB.Economy.forgeGrowth, level-1));
}
// доп. расход пыли на высоких уровнях ковки (с 5-го): делает пыль дефицитной
function forgeDustCost(level){
  return level>=GB.Economy.forgeDustFrom ? (level-(GB.Economy.forgeDustFrom-1))*GB.Economy.forgeDustStep : 0;
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
function smithyCost(lvl){ return {gold:Math.round(GB.Economy.smithyBase*Math.pow(GB.Economy.smithyGrowth,lvl-3)), dust:(lvl-2)*GB.Economy.smithyDustStep}; }

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
/* ============================================================
   DRAGON_META — РОЛИ, УНИКАЛЬНЫЕ ПАССИВКИ, ДАННЫЕ КОЛЛЕКЦИИ (данные отдельно от логики)
   role — боевой архетип. passive.fx — бонусы (используют боевые хуки: critPct, vampPct,
   healPct, manaRegen, dmgRedPct, dodgePct). Все пассивки УНИКАЛЬНЫ. Концепция видов не меняется.
   ============================================================ */
const DRAGON_META = {
  ember:      {role:'Воин',       passive:{name:'Тёплая кровь',   fx:{manaRegen:1},           desc:'Быстрее копит ману в бою.'},              habitat:'Кузни деревень Эмберрича', fact:'Греет руки кузнецам холодной ночью.'},
  cinderpup:  {role:'Берсерк',    passive:{name:'Хвост-факел',    fx:{critPct:10},            desc:'+10% к шансу критического удара.'},        habitat:'Соломенные крыши и сеновалы', fact:'Носится по кузням и поджигает всё подряд.'},
  magma:      {role:'Защитник',   passive:{name:'Лавовое нутро',  fx:{dmgRedPct:12},          desc:'−12% получаемого урона.'},                 habitat:'Расплавленные жилы вулканов', fact:'Ступает по лаве как по тропинке.'},
  pyrelord:   {role:'Воин',       passive:{name:'Венец пламени',  fx:{critPct:6,healPct:3},   desc:'+6% крит и лёгкое самолечение.'},          habitat:'Жерла древних вулканов', fact:'Его рёв плавит сталь на расстоянии.'},
  glacier:    {role:'Защитник',   passive:{name:'Ледяной панцирь',fx:{dmgRedPct:10},          desc:'−10% получаемого урона.'},                 habitat:'Замёрзшие горные пики', fact:'Оставляет за собой дорожку инея.'},
  permafrost: {role:'Защитник',   passive:{name:'Несокрушимый',   fx:{dmgRedPct:15},          desc:'−15% получаемого урона.'},                 habitat:'Ледники, спящие столетиями', fact:'Пробуждается лишь в самые лютые зимы.'},
  aurora:     {role:'Поддержка',  passive:{name:'Северное сияние',fx:{healPct:4,manaRegen:1}, desc:'Лечится каждый ход и копит ману.'},        habitat:'Полярные небеса', fact:'Её дыхание — северный свет.'},
  sporewing:  {role:'Следопыт',   passive:{name:'Споровый шлейф', fx:{vampPct:8},             desc:'Впитывает 8% нанесённого урона.'},         habitat:'Ядовитые топи Мирелота', fact:'Сеет пыльцу, скользя над болотом.'},
  blightfang: {role:'Контроллер', passive:{name:'Гнилое дыхание', fx:{vampPct:5,dmgRedPct:4}, desc:'Вампиризм и лёгкая стойкость.'},           habitat:'Палая листва и коряги', fact:'Отравляет всё, к чему прикоснётся.'},
  worldserpent:{role:'Контроллер',passive:{name:'Кольца мира',    fx:{dmgRedPct:8,healPct:3}, desc:'Стойкость и самолечение.'},                habitat:'Корни всех земель', fact:'Говорят, его тело опоясывает мир.'},
  tempest:    {role:'Стрелок',    passive:{name:'Седлок ветров',  fx:{dodgePct:10},           desc:'10% шанс уклониться от удара.'},            habitat:'Грозовые фронты', fact:'Седлает молнии как скакунов.'},
  thundercall:{role:'Стрелок',    passive:{name:'Скорость молнии',fx:{critPct:8,dodgePct:5},  desc:'Крит и уклонение.'},                       habitat:'Штормовые вершины', fact:'Крылья рассекают воздух с громом.'},
  umbra:      {role:'Берсерк',    passive:{name:'Тенеход',        fx:{critPct:12},            desc:'+12% к шансу крита.'},                     habitat:'Тени полуденных скал', fact:'Днём его почти не видно.'},
  nightwyrm:  {role:'Следопыт',   passive:{name:'Бесшумный',      fx:{dodgePct:8,vampPct:4},  desc:'Уклонение и вампиризм.'},                  habitat:'Новолунные чащи', fact:'Жертва не слышит его до последнего мига.'},
  voidmaw:    {role:'Берсерк',    passive:{name:'Эхо пустоты',    fx:{vampPct:10,critPct:5},  desc:'Мощный вампиризм и крит.'},                habitat:'Беззвёздная бездна', fact:'Старше самих гор.'},
};
function dragonRole(id){ return (DRAGON_META[id]&&DRAGON_META[id].role)||'Воин'; }
function dragonPassive(id){ return DRAGON_META[id]&&DRAGON_META[id].passive; }
function dragonPassiveFx(id){ const p=dragonPassive(id); return (p&&p.fx)||{}; }
function dragonMeta(id){ return DRAGON_META[id]||{}; }

function equipFx(d){
  const out={critPct:0,manaMax:0,manaRegen:0,healPct:0,vampPct:0,dmgRedPct:0,dodgePct:0};
  if(!d.equip) return out;
  for(const invUid of Object.values(d.equip)){
    const inst=artInst(invUid); if(!inst) continue;
    const fx=artifactFx(inst);
    for(const k in fx) out[k]+=fx[k];
  }
  return out;
}


/* ============================================================
   ЧАСТЬ 3 — ЛОГОВО: декларативная таблица уровней вместимости.
   Добавить уровень = добавить строку. Логика ниже её просто читает.
   cost: {gold, dust, boss?} — boss = сколько владык мира надо победить.
   ============================================================ */
const LAIR_LEVELS=[
  {lvl:1, cap:4,  cost:null},
  {lvl:2, cap:6,  cost:{gold:800,   dust:15}},
  {lvl:3, cap:8,  cost:{gold:2600,  dust:40}},
  {lvl:4, cap:10, cost:{gold:6500,  dust:80,  boss:1}},
  {lvl:5, cap:12, cost:{gold:15000, dust:150, boss:2}},
];
function lairRow(lvl){ lvl=lvl||(S&&S.lairLevel)||1; return LAIR_LEVELS.find(r=>r.lvl===lvl)||LAIR_LEVELS[0]; }
function lairCap(){ return lairRow().cap; }
function lairNext(){ return LAIR_LEVELS.find(r=>r.lvl===((S&&S.lairLevel)||1)+1)||null; }
function lairActiveCount(){ return (S&&S.dragons?S.dragons.filter(d=>!d.reserve).length:0); }
function bossesBeatenCount(){ return (typeof WORLD_BOSSES!=='undefined')?WORLD_BOSSES.filter(b=>bossDefeated(b.id)).length:0; }
function lairUpgradeCheck(){ const nx=lairNext(); if(!nx) return {ok:false,reason:'max'};
  const c=nx.cost;
  if((S.gold||0)<c.gold) return {ok:false,reason:'gold', next:nx};
  if((S.dust||0)<(c.dust||0)) return {ok:false,reason:'dust', next:nx};
  if(c.boss&&bossesBeatenCount()<c.boss) return {ok:false,reason:'boss', next:nx};
  return {ok:true, next:nx}; }
function upgradeLair(){ const chk=lairUpgradeCheck();
  if(!chk.ok){ if(typeof toast==='function'){
      if(chk.reason==='max')toast('Логово уже максимального уровня.');
      else if(chk.reason==='gold')toast('Не хватает 🪙 золота на улучшение логова.');
      else if(chk.reason==='dust')toast('Не хватает ✦ пыли на улучшение логова.');
      else if(chk.reason==='boss')toast('Сначала одолей владыку мира ('+chk.next.cost.boss+').'); }
    return; }
  const c=chk.next.cost; S.gold-=c.gold; S.dust-=(c.dust||0); S.lairLevel=chk.next.lvl;
  if(typeof trackEconomy==='function')trackEconomy('sink','lair_upgrade',{gold:-c.gold,dust:-(c.dust||0)});
  if(typeof toast==='function')toast('🏰 Логово улучшено до ур. '+chk.next.lvl+' · вместимость '+chk.next.cap+' 🐉');
  if(typeof questEvent==='function')questEvent('lair');
  if(typeof persist==='function')persist(); if(typeof renderLair==='function')renderLair(); }
function toggleReserve(uid){ const d=S.dragons.find(x=>x.uid===uid); if(!d)return;
  if(d.reserve){ if(lairActiveCount()>=lairCap()){ if(typeof toast==='function')toast('В логове нет места — улучши логово или освободи слот.'); return; } d.reserve=false; }
  else { if(lairActiveCount()<=1){ if(typeof toast==='function')toast('В логове должен остаться хотя бы один дракон.'); return; } d.reserve=true; }
  if(typeof persist==='function')persist(); if(typeof renderLair==='function')renderLair(); }
