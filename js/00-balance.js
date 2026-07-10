/* ============================================================
   00-balance.js — ЕДИНЫЙ КОНФИГ БАЛАНСА (GAME_BALANCE / GB)
   Все игровые коэффициенты и «магические числа» баланса собраны здесь,
   отдельно от игровой логики. Меняя значения тут, тюним игру без правки кода.
   ЗАГРУЖАЕТСЯ ПЕРВЫМ (до всех остальных модулей).
   ВНИМАНИЕ: значения РОВНО те же, что были в коде — баланс не изменён.
   ============================================================ */
const GAME_BALANCE = {
  // ——— БОЙ (пошаговый, 08-battle.js) ———
  Battle: {
    damageK: 0.58,              // множитель нелинейной формулы урона atk²/(atk+def)
    elementAdv: 1.28,           // преимущество стихии
    elementWeak: 0.85,          // недостаток стихии
    critMult: 1.5,              // множитель крита
    critBasePlayer: 0.08,       // базовый шанс крита игрока
    critBaseFoe: 0.05,          // базовый шанс крита врага
    spdCritScale: 0.006,        // вклад разницы скорости в шанс крита
    spdCritMin: -0.04, spdCritMax: 0.14,
    timing: { perfect: 1.25, good: 1.10, miss: 0.85, none: 1.0 }, // мини-игра тайминга
    ult: { perfect: 1.30, one: 1.15, good: 1.0, fail: 0.65 },     // двойная мини-игра ульты
    combo: { threshold: 1.25, perStack: 0.05, max: 3 },
    guardReduce: 0.55,          // множитель урона по защищающемуся
    strongMoveHit: 0.7,         // шанс попадания сильного приёма (pow>=1.5)
    happyBonus: 1.05,           // бонус счастливого дракона
    bossWeakMult: 1.28,         // урон по слабости босса
    bossStallMult: 1.6,         // урон по застывшему боссу
    foeSpellPow: 1.6,           // сила «усиленного» удара врага
  },
  // ——— ОПЫТ (03-state.js) ———
  Experience: { xpBase: 45, xpExp: 1.15 }, // xpToNext = xpBase * lvl^xpExp
  // ——— ЭКОНОМИКА (02-data-content.js, 08-battle.js) ———
  Economy: {
    forgeBase: 15, forgeRarityMul: 8, forgeGrowth: 1.5, // ковка артефакта
    forgeDustFrom: 5, forgeDustStep: 10,
    smithyBase: 600, smithyGrowth: 1.85, smithyDustStep: 30, // уровень кузни
    solaceGoldPct: 0.15, solaceXpPer: 3,   // утешительная награда за поражение
  },
  // ——— ЯЙЦА (03/04/05) ———
  Eggs: {
    incNeed: [0, 3, 6, 10, 16, 24],                 // инкубация по редкости
    bias:    [0.45, 1.00, 1.45, 1.90, 2.35, 2.80],  // уклон пула видов к редким
    rollBase: {                                     // веса редкости по ярусу биома
      t1: [0, 64, 26, 7, 2, 1, 0],
      t2: [0, 42, 32, 17, 6, 2, 1],
      t3: [0, 20, 34, 26, 13, 5, 2],
    },
    pityStep: 4, pityCap: 60, pityDiv: 30, // гарантия
    recycleBase: 5, recyclePerRarity: 5,   // переработка в пыль
    incBattle: 2, incExplore: 1,           // прирост инкубации за действия
    morphK: 0.35, morphRef: 46,            // наследование окраса по редкости
    // источники получения (каждый тип яйца — свой источник, без единой таблицы)
    sources: {
      battle:  { rarityFloor:1, weightBoost:0 },   // обычные враги
      elite:   { rarityFloor:2, weightBoost:1 },   // элитные враги
      boss:    { rarityFloor:4, weightBoost:2 },   // боссы
      tower:   { rarityFloor:5, weightBoost:3 },   // башня
      daily:   { rarityFloor:2, weightBoost:1 },   // ежедневные задания
      streak:  { rarityFloor:3, weightBoost:2 },   // серии побед
      explore: { rarityFloor:1, weightBoost:0 },   // исследование
      chest:   { rarityFloor:3, weightBoost:2 },   // редкие сундуки
      secret:  { rarityFloor:5, weightBoost:4 },   // секретные события
    },
    shardsFromRarity: 3,                    // осколков при переработке = rarity*этого (с 4+)
  },
  // ——— ИССЛЕДОВАНИЕ МИРА (02/07) ———
  World: {
    eventRarity: { common:60, uncommon:25, rare:10, epic:4, legendary:1 }, // таблица событий (%)
    exploreMilestones: [25, 50, 100],   // пороги исследования области (%)
    exploreRewardGold: 60,              // золото за порог (×номер порога)
    exploreStep: 4,                     // % за одну находку
  },
  // ——— АРКАДНЫЙ БОЙ (08b-arcade.js) ———
  Arcade: {
    mitigConst: 80, elementAdv: 1.28, elementWeak: 0.85,
    hpMulWild: 2.6, hpMulLeader: 1.9, hpMulAdd: 1.25,
    dmgMulWild: 1.9, dmgMulPack: 1.55, rarityHpBonus: 0.12,
  },
};
const GB = GAME_BALANCE; // короткий алиас
