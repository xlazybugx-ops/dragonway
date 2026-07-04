/* ============================================================
   01-data-core.js — ДАННЫЕ ЯДРА: стихии, виды драконов, визуал (SVG+фото), древо талантов, миры/биомы/портал
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ======================= ДАННЫЕ ======================= */
const ELEMENTS = {
  fire:{name:'Огонь',cls:'el-fire',color:'#e0633a'},
  frost:{name:'Лёд',cls:'el-frost',color:'#6db4d4'},
  venom:{name:'Яд',cls:'el-venom',color:'#7fb24a'},
  storm:{name:'Буря',cls:'el-storm',color:'#b88adf'},
  shade:{name:'Тень',cls:'el-shade',color:'#cf6e8f'},
};
// Кольцо превосходства: ключ бьёт значение (x1.5)
const ADVANTAGE = {fire:'frost', frost:'storm', storm:'venom', venom:'shade', shade:'fire'};

/* ======================= РИСОВАННЫЕ ДРАКОНЫ (SVG) =======================
   Милые округлые дракончики, нарисованные кодом. Цвет — по стихии,
   набор черт (рога, крылья, гребень, хвост, глаза) — по виду (узнаваемость).
   Окрасы-морфы накладываются CSS-фильтром поверх, как и раньше. */
const DRAGON_COLORS={
  fire:{body:'#e0633a',body2:'#b8431f',belly:'#f5b35a',dark:'#7a2a12',spike:'#ffd86b',eye:'#ffe14a'},
  frost:{body:'#6db4d4',body2:'#3f87a8',belly:'#cfeaf5',dark:'#1f4a60',spike:'#eaf7ff',eye:'#aef0ff'},
  venom:{body:'#7fb24a',body2:'#557d2c',belly:'#c8e89a',dark:'#2f4a18',spike:'#d4ff8a',eye:'#c6ff5a'},
  storm:{body:'#9d6fd0',body2:'#6e44a0',belly:'#d8c4ef',dark:'#3c2458',spike:'#e8d6ff',eye:'#e0b0ff'},
  shade:{body:'#6a5a8a',body2:'#3f3458',belly:'#4a3f66',dark:'#1a1226',spike:'#b89ad8',eye:'#cf6e8f'},
};
// архетип силуэта для каждого вида: 'chinese' (змей), 'lizard' (ящер), 'winged' (крылатый)
const DRAGON_ARCH={
  ember:'lizard', glacier:'winged', sporewing:'chinese', tempest:'winged', umbra:'lizard',
  magma:'lizard', aurora:'winged', voidmaw:'chinese', cinderpup:'lizard', permafrost:'lizard',
  blightfang:'chinese', thundercall:'winged', nightwyrm:'lizard', pyrelord:'winged', worldserpent:'chinese',
};
// корона для легендарных (4) и мифических (5)
function crownSVG(c,x,y){return `<path d='M${x-9} ${y} L${x-9} ${y-9} L${x-4} ${y-4} L${x} ${y-12} L${x+4} ${y-4} L${x+9} ${y-9} L${x+9} ${y}Z' fill='#ffd24a' stroke='#d9a441' stroke-width='0.6'/><circle cx='${x}' cy='${y-14}' r='1.6' fill='#ff5a7a'/>`;}

function dragonChinese(c,royal){
  return `<path d='M18 78 Q14 58 30 54 Q48 50 44 36 Q41 24 56 22 Q72 20 74 34' fill='none' stroke='${c.body2}' stroke-width='15' stroke-linecap='round'/>
  <path d='M18 78 Q14 58 30 54 Q48 50 44 36 Q41 24 56 22 Q72 20 74 34' fill='none' stroke='${c.body}' stroke-width='10' stroke-linecap='round'/>
  <path d='M30 47 l-3 -7 l6 1 M42 44 l-3 -7 l6 1 M44 28 l-3 -7 l6 1 M58 22 l-2 -7 l6 2' fill='${c.spike}'/>
  <path d='M18 78 l-7 5 l3 -8 l-7 1' fill='${c.spike}'/>
  <path d='M26 64 l-6 6 m6 -6 l-2 8 m2 -8 l4 7' stroke='${c.dark}' stroke-width='2' fill='none' stroke-linecap='round'/>
  <ellipse cx='76' cy='34' rx='13' ry='10' fill='${c.body}'/>
  ${royal?crownSVG(c,76,22):`<path d='M70 28 Q66 18 74 16 Q72 24 78 28Z' fill='${c.spike}'/><path d='M82 28 Q86 18 80 16 Q82 24 80 28Z' fill='${c.spike}'/>`}
  <path d='M84 38 Q96 36 92 48' fill='none' stroke='${c.spike}' stroke-width='1.6'/>
  <path d='M84 40 Q94 44 88 54' fill='none' stroke='${c.spike}' stroke-width='1.6'/>
  <ellipse cx='80' cy='32' rx='3' ry='3.5' fill='#fff'/><circle cx='81' cy='32' r='1.8' fill='#111'/>`;
}
function dragonLizard(c,royal){
  return `<path d='M22 64 Q6 64 4 50 Q12 58 22 56Z' fill='${c.body2}'/>
  <ellipse cx='48' cy='62' rx='30' ry='18' fill='${c.body}'/>
  <ellipse cx='48' cy='66' rx='22' ry='11' fill='${c.belly}'/>
  <path d='M30 48 l-3 -8 l7 3 M40 44 l-2 -9 l7 4 M52 44 l0 -9 l6 5 M64 48 l3 -8 l5 6' fill='${c.spike}'/>
  <path d='M36 78 l-1 7 m-3 -2 l4 2 l3 -2 M58 78 l1 7 m-3 -1 l3 1 l3 -2' stroke='${c.dark}' stroke-width='2.4' fill='none' stroke-linecap='round'/>
  <ellipse cx='76' cy='56' rx='16' ry='13' fill='${c.body}'/>
  <path d='M86 50 Q92 44 96 50 Q90 52 88 56Z' fill='${c.body}'/>
  ${royal?crownSVG(c,76,44):`<path d='M70 46 l-3 -10 l6 6Z' fill='${c.spike}'/><path d='M80 45 l1 -11 l5 8Z' fill='${c.spike}'/>`}
  <ellipse cx='80' cy='54' rx='4' ry='4.5' fill='${c.eye}'/><ellipse cx='81' cy='54' rx='1.4' ry='3' fill='#111'/>
  <path d='M74 49 l9 2' stroke='${c.dark}' stroke-width='1.5'/>
  <path d='M88 58 Q92 60 88 62' stroke='${c.dark}' stroke-width='1.4' fill='none'/>`;
}
function dragonWinged(c,royal){
  return `<path d='M50 46 Q16 26 8 46 L19 47 Q13 39 24 43 L21 52 Q22 45 33 50 L29 59 Q34 50 50 54Z' fill='${c.body2}'/>
  <path d='M50 46 Q84 26 92 46 L81 47 Q87 39 76 43 L79 52 Q78 45 67 50 L71 59 Q66 50 50 54Z' fill='${c.body2}'/>
  <path d='M50 70 Q56 92 70 88 Q60 84 58 70Z' fill='${c.body}'/>
  <path d='M70 88 l8 3 l-4 -7Z' fill='${c.spike}'/>
  <ellipse cx='50' cy='60' rx='15' ry='22' fill='${c.body}'/>
  <ellipse cx='50' cy='64' rx='9' ry='15' fill='${c.belly}'/>
  <path d='M50 40 l-4 -8 l8 0Z M50 50 l-3 -6 l6 0Z' fill='${c.spike}'/>
  <path d='M44 80 l-2 6 m-2 0 l2 1 l2 -1 M56 80 l2 6 m-2 1 l2 0 l2 -1' stroke='${c.dark}' stroke-width='2.2' fill='none' stroke-linecap='round'/>
  <path d='M50 44 Q50 32 58 26' stroke='${c.body}' stroke-width='9' fill='none' stroke-linecap='round'/>
  <ellipse cx='60' cy='24' rx='10' ry='8' fill='${c.body}'/>
  ${royal?crownSVG(c,60,14):`<path d='M66 20 l4 -8 l1 8Z' fill='${c.spike}'/><path d='M58 18 l1 -8 l4 7Z' fill='${c.spike}'/>`}
  <ellipse cx='63' cy='23' rx='3' ry='3.5' fill='${c.eye}'/><circle cx='64' cy='23' r='1.5' fill='#111'/>`;
}
function dragonArt(speciesId){
  const sp=speciesById(speciesId);
  const c=DRAGON_COLORS[sp.el];
  const arch=DRAGON_ARCH[speciesId]||'lizard';
  const royal=sp.rarity>=4;
  let inner;
  if(arch==='chinese') inner=dragonChinese(c,royal);
  else if(arch==='winged') inner=dragonWinged(c,royal);
  else inner=dragonLizard(c,royal);
  return `<svg class="dragon-art" viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>${inner}</svg>`;
}

/* ===== ФОТО-ДРАКОНЫ С ЭВОЛЮЦИЕЙ ПО УРОВНЮ =====
   Картинки лежат в папке images/ рядом с HTML, имена вида {id}_{стадия}.png
   (стадии 1/25/60/100). Если файла нет — показываем рисованного SVG-дракона.
   Чтобы отключить фото целиком, поставь USE_PHOTO_DRAGONS=false. */
const USE_PHOTO_DRAGONS=true;
const DRAGON_STAGES=[1,25,60,100];
// какая стадия соответствует уровню
function stageForLevel(level){
  let st=DRAGON_STAGES[0];
  for(const s of DRAGON_STAGES){ if(level>=s) st=s; }
  return st;
}
// визуал дракона: <img> фото с авто-фолбэком на SVG, либо сразу SVG
function dragonVisual(speciesId, level){
  const svg=dragonArt(speciesId);
  if(!USE_PHOTO_DRAGONS) return svg;
  const stage=stageForLevel(level||1);
  const src=`images/${speciesId}_${stage}.webp`;
  // если картинка не загрузится — onerror подменит контейнер на SVG
  const svgEsc=svg.replace(/"/g,'&quot;');
  return `<img class="dragon-art dragon-photo" src="${src}" alt="" loading="lazy" decoding="async"
     onerror="this.outerHTML=this.getAttribute('data-fallback')"
     data-fallback="${svgEsc}">`;
}



// ЛЕТЯЩИЙ ДРАКОН ВИД СВЕРХУ (для карты странствий), цвет по стихии
const TOPDRAGON_COLORS={
  fire:{body:'#e0633a',wing:'#b8431f',edge:'#ffd86b'},
  frost:{body:'#6db4d4',wing:'#3f87a8',edge:'#eaf7ff'},
  venom:{body:'#7fb24a',wing:'#557d2c',edge:'#d4ff8a'},
  storm:{body:'#9d6fd0',wing:'#6e44a0',edge:'#e8d6ff'},
  shade:{body:'#6a5a8a',wing:'#3f3458',edge:'#b89ad8'},
};
function topDragonSVG(speciesId){
  const sp=speciesById(speciesId);
  const c=TOPDRAGON_COLORS[sp.el]||TOPDRAGON_COLORS.fire;
  return `<svg class="topdragon-art" viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
    <ellipse class="td-shadow" cx='50' cy='88' rx='22' ry='5' fill='#000' opacity='0.22'/>
    <g class="td-wing td-wing-l">
      <path d='M48 44 Q14 22 4 38 Q12 46 9 56 Q24 48 30 55 Q34 48 44 52 Z' fill='${c.wing}'/>
      <path d='M48 44 Q20 28 8 38' fill='none' stroke='${c.edge}' stroke-width='1' opacity='0.6'/>
    </g>
    <g class="td-wing td-wing-r">
      <path d='M52 44 Q86 22 96 38 Q88 46 91 56 Q76 48 70 55 Q66 48 56 52 Z' fill='${c.wing}'/>
      <path d='M52 44 Q80 28 92 38' fill='none' stroke='${c.edge}' stroke-width='1' opacity='0.6'/>
    </g>
    <path d='M50 64 Q47 80 50 94 Q53 80 50 64 Z' fill='${c.body}'/>
    <path d='M50 94 l-3 -5 l3 1 l3 -1 Z' fill='${c.edge}'/>
    <ellipse cx='50' cy='52' rx='10' ry='20' fill='${c.body}'/>
    <path d='M50 33 L48 45 L50 41 L52 45 Z' fill='${c.edge}'/>
    <ellipse cx='50' cy='30' rx='7' ry='9' fill='${c.body}'/>
    <path d='M46 24 l-3 -6 M54 24 l3 -6' stroke='${c.edge}' stroke-width='2' stroke-linecap='round'/>
    <circle cx='47' cy='28' r='1.5' fill='#111'/><circle cx='53' cy='28' r='1.5' fill='#111'/>
  </svg>`;
}

// Виды драконов: базовые статы на 1 уровне
const SPECIES = [
  {id:'ember',  name:'Эмберлинг',  sigil:'🐲', el:'fire',  rarity:1, hp:48, atk:12, def:6,  spd:9,  traits:['Тёплая чешуя','Дитя углей'], lore:'Малый дракон-искра, что греет кузни деревень.'},
  {id:'glacier',name:'Гляциар',    sigil:'🐉', el:'frost', rarity:2, hp:60, atk:11, def:10, spd:6,  traits:['Ледяной панцирь','Дыхание метели'], lore:'Парит над замёрзшими пиками, оставляя иней.'},
  {id:'sporewing',name:'Спорокрыл',sigil:'🦎', el:'venom', rarity:1, hp:52, atk:13, def:5,  spd:11, traits:['Споровый шлейф','Болотный охотник'], lore:'Скользит сквозь топи, сея ядовитую пыльцу.'},
  {id:'tempest',name:'Темпестар',  sigil:'🐦‍⬛',el:'storm', rarity:2, hp:50, atk:14, def:6,  spd:13, traits:['Громовое сердце','Седлок ветров'], lore:'Седлает грозовые фронты и бьёт молнией.'},
  {id:'umbra',  name:'Умбракс',    sigil:'🦇', el:'shade', rarity:3, hp:55, atk:16, def:7,  spd:12, traits:['Тенеход','Пожиратель света'], lore:'Скользит меж теней, его почти не видно днём.'},
  {id:'magma',  name:'Магмарок',   sigil:'🦖', el:'fire',  rarity:3, hp:78, atk:18, def:12, spd:5,  traits:['Лавовое нутро','Сокрушитель скал'], lore:'Древний колосс, ступающий по расплавленным жилам.'},
  {id:'aurora', name:'Аврорин',    sigil:'🌀', el:'frost', rarity:4, hp:70, atk:17, def:11, spd:10, traits:['Северное сияние','Хладный венец'], lore:'Легендарный страж полюса, чьё дыхание — северный свет.'},
  {id:'voidmaw',name:'Бездномор',  sigil:'🌑', el:'shade', rarity:5, hp:92, atk:22, def:13, spd:11, traits:['Беззвёздная пасть','Эхо пустоты'], lore:'Миф из мифов. Говорят, он старше самих гор.'},
  {id:'cinderpup',name:'Жарёныш',  sigil:'🔥', el:'fire',  rarity:1, hp:44, atk:14, def:4,  spd:12, traits:['Шустрый','Хвост-факел'], lore:'Юркий выводок углей, что носится по кузням и поджигает солому.'},
  {id:'permafrost',name:'Вечнолёд',sigil:'❄️', el:'frost', rarity:3, hp:74, atk:14, def:14, spd:5,  traits:['Несокрушимый','Стужа веков'], lore:'Дремлет в ледниках столетиями, пробуждаясь лишь в самые лютые зимы.'},
  {id:'blightfang',name:'Гнилоклык',sigil:'🐍',el:'venom', rarity:2, hp:58, atk:15, def:7,  spd:10, traits:['Гнилое дыхание','Терпеливый'], lore:'Прячется под палой листвой, отравляя всё, к чему прикоснётся.'},
  {id:'thundercall',name:'Громозов',sigil:'⚡', el:'storm', rarity:3, hp:62, atk:19, def:8,  spd:14, traits:['Скорость молнии','Раскат грома'], lore:'Голос его — гроза; крылья рассекают воздух с громовым треском.'},
  {id:'nightwyrm',name:'Сумрачник',sigil:'🐈‍⬛',el:'shade', rarity:2, hp:54, atk:15, def:8,  spd:13, traits:['Бесшумный','Глаза-уголья'], lore:'Охотится в новолуние, и жертва не слышит его до последнего мига.'},
  {id:'pyrelord',name:'Пламевластец',sigil:'☄️',el:'fire', rarity:4, hp:80, atk:20, def:12, spd:9,  traits:['Венец пламени','Испепеляющий'], lore:'Древний владыка вулканов, чей рёв плавит сталь на расстоянии.'},
  {id:'worldserpent',name:'Мирозмей',sigil:'🐉', el:'venom', rarity:5, hp:96, atk:21, def:15, spd:8,  traits:['Кольца мира','Яд первотворения'], lore:'Сказывают, его тело опоясывает корни всех земель.'},
];
const RARITY_NAME = {1:'Обычный',2:'Необычный',3:'Редкий',4:'Легендарный',5:'Мифический'};
const RARITY_STAR = r => '★'.repeat(r)+'☆'.repeat(5-r);

/* ======================= ШПИЛЬ МИРОЗДАНИЯ: ДРЕВО ТАЛАНТОВ =======================
   Уникальное дерево для каждого вида, до 100 уровня, генерируется детерминированно.
   - Заклинания: на 10,20,...,100 (10 шт.) — новые боевые приёмы.
   - Ультимативки: на 50 и 100 — мощные особые удары.
   - Перки/пассивки: на каждом 5-м уровне (5,15,25,...) — бонусы к статам/эффекты.
   - Развилки: некоторые узлы предлагают выбор A/B (даёт уникальность каждому дракону). */

// Тематические заклинания по стихиям (имена/иконки/описания берутся по индексу прогрессии)
const SPELL_POOLS = {
  fire:  [['Искра','✨','лёгкий ожог'],['Огненный коготь','🔥','жжёт врага'],['Жар-волна','🌋','опаляет всё вокруг'],['Пепельный вихрь','🌀','слепит врага пеплом'],['Лавовый плевок','🟠','тяжёлый урон'],['Огненный шторм','☄️','шквал пламени'],['Пламенный щит','🛡️','жжёт того, кто бьёт'],['Жар недр','🟥','растёт с каждым ходом'],['Фениксов жар','🦅','лечит и жжёт'],['Солнечный взрыв','💥','ослепительный удар']],
  frost: [['Снежинка','❄️','лёгкий холод'],['Ледяной коготь','🧊','морозит врага'],['Стужа','🥶','замедляет врага'],['Иней','💎','покрывает льдом'],['Ледяной шип','🔹','пронзает броню'],['Метельный вихрь','🌬️','буря снега'],['Морозный панцирь','🛡️','твёрдая защита'],['Хрустальный взор','👁️','точный удар'],['Сердце зимы','💙','лечит на холоде'],['Вечная мерзлота','🏔️','сковывает врага']],
  venom: [['Брызги','💧','лёгкий яд'],['Ядовитый коготь','🟢','отравляет'],['Спора','🍄','яд растёт со временем'],['Кислота','🧪','разъедает броню'],['Гнилое облако','☁️','травит каждый ход'],['Лозы','🌿','опутывают врага'],['Шипастый покров','🌵','колет атакующего'],['Зелёная кровь','💚','лечит ядом'],['Тлен','🟩','усиливает весь яд'],['Цветение бездны','🌺','взрыв спор']],
  storm: [['Искорка','⚡','лёгкий разряд'],['Грозовой коготь','🌩️','бьёт током'],['Порыв','💨','быстрый удар'],['Раскат','🔊','оглушает врага'],['Молния','⚡','точный сильный удар'],['Шквал','🌪️','буря ветра'],['Громовой щит','🛡️','бьёт током в ответ'],['Скорость бури','🏃','лишний ход'],['Сердце грозы','💜','лечит молнией'],['Небесный гнев','🌠','удар с небес']],
  shade: [['Тенька','🌑','лёгкая тень'],['Тёмный коготь','🦇','ранит из тьмы'],['Морок','😶‍🌫️','сбивает врага'],['Тень-двойник','👥','уклоняется'],['Поглощение','🕳️','бьёт и лечит'],['Сумрак','🌚','скрывает дракона'],['Покров ночи','🛡️','прячет от ударов'],['Пожиратель света','⚫','растёт во тьме'],['Сердце тьмы','💜','лечит тенью'],['Затмение','🌘','гасит силы врага']],
};
// Ультимативки по стихиям (на 50 и 100)
const ULT_POOLS = {
  fire:  [['Извержение','🌋','Чудовищный огненный взрыв по врагу'],['Гнев Солнца','☀️','Сжигает врага дотла, лечит дракона']],
  frost: [['Ледниковый раскол','🏔️','Сковывает врага вечным льдом'],['Сердце Зимы','💙','Замораживает поле, мощно лечит']],
  venom: [['Чумной шторм','☣️','Накрывает врага облаком яда'],['Древо Жизни','🌳','Яд врагу, исцеление дракону']],
  storm: [['Буря Тысячи Молний','⚡','Шквал молний по врагу'],['Длань Небес','🌩️','Громовой удар и второй ход']],
  shade: [['Беззвёздная Ночь','🌑','Поглощает врага тьмой'],['Сердце Пустоты','🕳️','Урон врагу, полное исцеление']],
};
// Перки/пассивки (общий пул, иконка+название+что даёт). delta — бонус к статам в %.
const PERK_POOLS = [
  ['Крепкая чешуя','🛡️',{def:0.10},'защита +10%'],
  ['Острый коготь','⚔️',{atk:0.10},'атака +10%'],
  ['Большое сердце','❤️',{hp:0.12},'здоровье +12%'],
  ['Быстрые крылья','💨',{spd:0.12},'прыть +12%'],
  ['Боевой дух','🔥',{atk:0.08,hp:0.06},'атака и здоровье'],
  ['Толстокожесть','🪨',{def:0.12,hp:0.06},'защита и здоровье'],
  ['Хищник','🐾',{atk:0.10,spd:0.06},'атака и прыть'],
  ['Живучесть','🌟',{hp:0.10,def:0.06},'здоровье и защита'],
  ['Ярость','😤',{atk:0.14},'атака +14%'],
  ['Гранитная шкура','⛰️',{def:0.14},'защита +14%'],
];

// детерминированный «случайный» выбор по строке-семени
function hashSeed(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0);}
function seededPick(arr, seedNum){ return arr[seedNum % arr.length]; }

// Построить полное дерево для вида (массив узлов по уровням 5..100)
function buildTalentTree(sp){
  const el=sp.el;
  const spells=SPELL_POOLS[el], ults=ULT_POOLS[el];
  const nodes=[];
  let spellIdx=0;
  for(let lvl=5; lvl<=100; lvl+=5){
    const seed=hashSeed(sp.id+'_'+lvl);
    if(lvl===50 || lvl===100){
      // ультимативка
      const u=ults[lvl===50?0:1];
      nodes.push({lvl, kind:'ult', icon:u[1], name:u[0], desc:u[2]});
    } else if(lvl%10===0){
      // заклинание (10,20,30,40,60,70,80,90)
      const s=spells[spellIdx % spells.length];
      nodes.push({lvl, kind:'spell', icon:s[1], name:s[0], desc:s[2]});
      spellIdx++;
    } else {
      // перк на каждом 5-м; иногда развилка (выбор A/B)
      const isFork = (lvl%15===0) || (seed%3===0);
      if(isFork){
        const a=seededPick(PERK_POOLS, seed);
        const b=seededPick(PERK_POOLS, seed+7+ (a===PERK_POOLS[(seed+7)%PERK_POOLS.length]?3:0));
        const bb = (b===a)? PERK_POOLS[(seed+11)%PERK_POOLS.length] : b;
        nodes.push({lvl, kind:'fork', options:[
          {icon:a[1],name:a[0],mods:a[2],desc:a[3]},
          {icon:bb[1],name:bb[0],mods:bb[2],desc:bb[3]},
        ]});
      } else {
        const p=seededPick(PERK_POOLS, seed);
        nodes.push({lvl, kind:'perk', icon:p[1], name:p[0], mods:p[2], desc:p[3]});
      }
    }
    // ранний бонусный заклин на 10-м уже учтён; добавим первый заклин-узел на ур.10
  }
  return nodes;
}
// кэш деревьев по виду
const TREE_CACHE={};
function treeOf(speciesId){
  if(!TREE_CACHE[speciesId]) TREE_CACHE[speciesId]=buildTalentTree(speciesById(speciesId));
  return TREE_CACHE[speciesId];
}
// суммарный множитель статов от выбранных перков дракона
function talentMods(d){
  const out={atk:0,def:0,hp:0,spd:0};
  const tree=treeOf(d.id);
  const picks=d.talentPicks||{};
  for(const node of tree){
    if(node.lvl>d.level) continue;
    if(node.kind==='perk'){
      for(const k in node.mods) out[k]+=node.mods[k];
    } else if(node.kind==='fork'){
      const choice=picks[node.lvl];
      const opt = choice!=null ? node.options[choice] : null;
      if(opt) for(const k in opt.mods) out[k]+=opt.mods[k];
    }
  }
  return out;
}
// список открытых заклинаний/ультимативок дракона (для боя и книги)
function unlockedSpells(d){
  const tree=treeOf(d.id);
  return tree.filter(n=>(n.kind==='spell'||n.kind==='ult') && n.lvl<=d.level);
}
// есть ли неразобранные развилки (узлы выбора, доступные по уровню, но ещё не выбраны)
function pendingForks(d){
  const tree=treeOf(d.id);
  const picks=d.talentPicks||{};
  return tree.filter(n=>n.kind==='fork' && n.lvl<=d.level && picks[n.lvl]==null);
}

/* Расцветки (морфы). Каждый дракон рождается в одном из окрасов.
   weight — вероятность, mods — небольшие бонусы к статам, hue/sat/bri — окрашивание силуэта. */
const MORPHS = [
  {id:'common', name:'Обычный',    weight:46, swatch:'#9c8b6a', filter:'',                                              mods:{}},
  {id:'crimson',name:'Багряный',   weight:11, swatch:'#d23b2e', filter:'hue-rotate(-18deg) saturate(1.8) brightness(1.05)', mods:{atk:2}, gloss:'огненно-красный'},
  {id:'emerald',name:'Изумрудный', weight:11, swatch:'#3bb24a', filter:'hue-rotate(75deg) saturate(1.7)', mods:{def:2}, gloss:'ядовито-зелёный'},
  {id:'azure',  name:'Лазурный',   weight:11, swatch:'#3f8fd6', filter:'hue-rotate(165deg) saturate(1.7) brightness(1.05)', mods:{spd:2}, gloss:'голубой'},
  {id:'frostwhite',name:'Белоснежный',weight:8, swatch:'#e8eef2', filter:'saturate(0.25) brightness(1.45)',            mods:{hp:6}, gloss:'ледяной белый'},
  {id:'obsidian',name:'Обсидиановый',weight:6, swatch:'#2c2630', filter:'saturate(0.5) brightness(0.62) contrast(1.2)', mods:{def:3}, gloss:'чёрный'},
  {id:'amethyst',name:'Аметистовый',weight:5, swatch:'#a861d8', filter:'hue-rotate(230deg) saturate(1.6) brightness(1.1)', mods:{atk:2,spd:1}, gloss:'фиолетовый'},
  {id:'golden', name:'Золотой',    weight:2, swatch:'#e7b53b', filter:'hue-rotate(20deg) saturate(2) brightness(1.2) drop-shadow(0 0 6px rgba(231,181,59,.7))', mods:{atk:2,def:2,hp:4}, gloss:'сияюще-золотой', shiny:true},
];
const morphById = id => MORPHS.find(m=>m.id===id) || MORPHS[0];
function rollMorph(){
  const total=MORPHS.reduce((a,m)=>a+m.weight,0);
  let r=Math.random()*total;
  for(const m of MORPHS){if((r-=m.weight)<=0)return m.id;}
  return 'common';
}

/* ===== МИРЫ И БИОМЫ =====
   5 миров (по стихиям), у каждого 3 биома-подуровня:
   I поверхность (ур.1+), II глубина (ур.60+), III ядро (ур.100).
   Доступ гейтится уровнем портала (S.portalLevel) и уровнем дракона. */
const BIOME_MIN_LEVEL=[0,1,60,100]; // индекс = номер биома (1..3)
const BIOME_TIERLABEL=['','I · Поверхность','II · Глубина','III · Ядро'];

const WORLDS = [
  {id:'emberreach', scene:'fire',  el:'fire',  name:'Огненный мир', worldIdx:1,
   desc:'Земли вечного жара, где реки лавы прорезают чёрный камень.',
   biomes:[
     {n:1, name:'Пепельные пустоши', gold:[18,34],  xp:[14,26], eggChance:.28, biome:'Вулканы и лава'},
     {n:2, name:'Лавовые каверны',   gold:[42,70],  xp:[40,64], eggChance:.34, biome:'Раскалённые пещеры'},
     {n:3, name:'Сердце Вулкана',    gold:[90,150], xp:[85,130],eggChance:.44, biome:'Ядро огня'},
   ]},
  {id:'mirelot', scene:'jungle', el:'venom', name:'Ядовитый мир', worldIdx:2,
   desc:'Исполинские чащи над тёмной водой, где сама зелень дышит ядом.',
   biomes:[
     {n:1, name:'Зелёные озёра',     gold:[24,44],  xp:[18,32], eggChance:.30, biome:'Деревья и озёра'},
     {n:2, name:'Гнилые топи',       gold:[52,84],  xp:[46,72], eggChance:.36, biome:'Ядовитые болота'},
     {n:3, name:'Улей Спор',         gold:[105,170],xp:[95,145],eggChance:.46, biome:'Сердце гнили'},
   ]},
  {id:'glacior', scene:'ice', el:'frost', name:'Ледяной мир', worldIdx:3,
   desc:'Ледяные пики режут небо, а замёрзшие озёра хранят древние тайны.',
   biomes:[
     {n:1, name:'Снежные склоны',    gold:[30,54],  xp:[24,40], eggChance:.32, biome:'Ледяные пики'},
     {n:2, name:'Ледяные пещеры',    gold:[64,100], xp:[54,84], eggChance:.38, biome:'Хрустальные гроты'},
     {n:3, name:'Замёрзшая Бездна',  gold:[120,195],xp:[105,160],eggChance:.48, biome:'Вечная мерзлота'},
   ]},
  {id:'stormpeak', scene:'ice', el:'storm', name:'Штормовой мир', worldIdx:4,
   desc:'Небо, разорванное вечной грозой; молнии пляшут меж парящих скал.',
   biomes:[
     {n:1, name:'Грозовые утёсы',    gold:[36,62],  xp:[28,46], eggChance:.32, biome:'Парящие скалы'},
     {n:2, name:'Око Бури',          gold:[74,116], xp:[62,96], eggChance:.40, biome:'Сердце грозы'},
     {n:3, name:'Громовой Трон',     gold:[135,215],xp:[118,175],eggChance:.50, biome:'Обитель молний'},
   ]},
  {id:'voidedge', scene:'shade', el:'shade', name:'Теневой мир', worldIdx:5,
   desc:'Там, где гаснет последний свет. Сюда идут лишь бесстрашные.',
   biomes:[
     {n:1, name:'Сумеречный предел', gold:[44,74],  xp:[34,56], eggChance:.34, biome:'Бездна и тени'},
     {n:2, name:'Провал Теней',      gold:[88,138], xp:[74,114],eggChance:.42, biome:'Тёмные глубины'},
     {n:3, name:'Беззвёздное Ядро',  gold:[155,250],xp:[135,205],eggChance:.52, biome:'Сердце пустоты'},
   ]},
];

// таблица разблокировки по уровню портала: {worlds, maxBiome}
const PORTAL_TABLE=[
  null, // индекс 0 не используется
  {worlds:1, maxBiome:1}, // ур.1
  {worlds:2, maxBiome:1}, // ур.2
  {worlds:2, maxBiome:2}, // ур.3 — открыта глубина (биом II)
  {worlds:3, maxBiome:2}, // ур.4
  {worlds:4, maxBiome:2}, // ур.5
  {worlds:5, maxBiome:2}, // ур.6
  {worlds:5, maxBiome:3}, // ур.7 — открыто ядро (биом III)
  {worlds:5, maxBiome:3}, // ур.8 — полный доступ
];
const PORTAL_MAX=8;
function portalState(){ return PORTAL_TABLE[Math.max(1,Math.min(PORTAL_MAX,S.portalLevel||1))]; }
function portalCost(lvl){ return {gold:Math.round(200*Math.pow(1.7,lvl-1)), dust: lvl>=3?(lvl-2)*15:0}; }

// доступен ли мир по уровню портала
function worldUnlocked(world){ return world.worldIdx <= portalState().worlds; }
// доступен ли биом: по порталу (глубина) И по наличию дракона нужного уровня
function biomeUnlocked(world, biomeN){
  if(!worldUnlocked(world)) return {ok:false, reason:'world'};
  if(biomeN > portalState().maxBiome) return {ok:false, reason:'portal'};
  const need=BIOME_MIN_LEVEL[biomeN];
  if(maxLevel()<need) return {ok:false, reason:'level', need};
  return {ok:true};
}
// собрать «регион» для полёта из мира+биома (совместимо со старым кодом полёта)
function makeRegion(world, biomeN){
  const b=world.biomes[biomeN-1];
  return {id:world.id+'_b'+biomeN, worldId:world.id, scene:world.scene, el:world.el,
    name:world.name+' · '+b.name, biome:b.biome, desc:world.desc,
    tier:biomeN + (world.worldIdx-1), // растущая опасность для наград/POI
    biomeN, gold:b.gold, xp:b.xp, eggChance:b.eggChance};
}

