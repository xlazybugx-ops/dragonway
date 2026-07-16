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
    elementAdv: 1.22,           // преимущество заметно, но не решает бой автоматически
    elementWeak: 0.88,          // мягкий штраф для небольшой стартовой коллекции
    critMult: 1.5,              // множитель крита
    critBasePlayer: 0.08,       // базовый шанс крита игрока
    critBaseFoe: 0.05,          // базовый шанс крита врага
    spdCritScale: 0.003,        // скорость задаёт темп, но не должна давать двойное преимущество
    spdCritMin: -0.02, spdCritMax: 0.07,
    timing: { perfect: 1.25, good: 1.10, miss: 0.85, none: 1.0 }, // мини-игра тайминга
    ult: { perfect: 1.30, one: 1.15, good: 1.0, fail: 0.65 },     // двойная мини-игра ульты
    combo: { threshold: 1.25, perStack: 0.05, max: 3 },
    guardReduce: 0.55,          // множитель урона по защищающемуся
    strongMoveHit: 0.62,        // сильный приём — риск, базовый удар — стабильный темп и мана
    happyBonus: 1.05,           // бонус счастливого дракона
    bossWeakMult: 1.28,         // урон по слабости босса
    bossStallMult: 1.6,         // урон по застывшему боссу
    foeSpellPow: 1.6,           // сила «усиленного» удара врага
    matchmaking: {
      cpBands: [0.82, 1.0, 1.18],
      rewardBands: [0.90, 1.0, 1.12],
      lossAssistAfter: 2, lossAssistRatio: 0.72,
      refreshCooldownMs: 60000,
    },
  },
  // ——— ОПЫТ (03-state.js) ———
  Experience: { xpBase: 45, xpExp: 1.15 }, // xpToNext = xpBase * lvl^xpExp
  // ——— ЭКОНОМИКА (02-data-content.js, 08-battle.js) ———
  Economy: {
    startingGold: 300, startingDust: 60, startingEggs: 1,
    forgeBase: 15, forgeRarityMul: 8, forgeGrowth: 1.5, // ковка артефакта
    forgeDustFrom: 5, forgeDustStep: 10,
    smithyBase: 600, smithyGrowth: 1.85, smithyDustStep: 30, // уровень кузни
    solaceGoldPct: 0.15, solaceXpPer: 3,   // утешительная награда за поражение
    battleGoldPerLevel: 14,                // редкость больше не умножает награду
    idleBasePerMinute: 0.55, idleLevelScale: 0.42, idleActiveDragons: 3,
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
    warmCostPerRarity: 2,                   // осколков за «согреть» = rarity*этого
    warmProgressFrac: 0.4,                  // сколько инкубации добавляет «согреть»
    exploreRoleBonus: 1.5,                  // множитель прогресса исследования для роли Следопыт
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
    mitigConst: 80, elementAdv: 1.22, elementWeak: 0.88,
    hpMulWild: 2.6, hpMulLeader: 1.9, hpMulAdd: 1.25,
    dmgMulWild: 1.9, dmgMulPack: 1.55, rarityHpBonus: 0.12,
    // REWORK: снаряды и зоны поражения
    autoProjSpd: 660, autoProjR: 7,          // автоатака игрока — летящий снаряд
    meleeRange: 100, leaderRange: 120,       // ближний бой врагов (было 50/76)
    rangedRange: 320, rangedProjSpd: 340,    // дальнобойные враги
    rangedShare: 0.4,                        // доля дальнобойных в стае
    enemyAggro: 640,
    // REWORK: анти-кайтинг
    kite: { detectT: 1.2,                    // сек. отступления до «погони»
            speedMul: 1.5,                   // ускорение преследователей
            lungeCd: 3.2, lungeDist: 200, lungeSpd: 640, // рывок к игроку
            surroundR: 150 },                // окружение: точки вокруг игрока
    // REWORK: рост сложности с глубиной забега (за каждый пройденный ярус)
    depth: { hp: 0.12, dmg: 0.10, spd: 8, extraAddPer: 1 },
    elite: { hp: 1.7, dmg: 1.35, spd: 20 }, // элитные враги
    trial: { hp: 2.4, dmg: 1.2 },           // испытание региона (страж портала)
  },
  // ——— ЗАБЕГ-РОГЛАЙТ (07-flight.js) ———
  Run: {
    boonChoices: 3,                          // вариантов усиления после победы
    riskMul: { safe: 0.8, risky: 1.25, deadly: 1.7 },   // сложность пути
    rewardMul: { safe: 0.8, risky: 1.3, deadly: 2.0 },  // награда пути
    mapScale: 2.4,                           // плотный маршрут: площадь 5.76× вместо 9.61×
    denCount: 4, wildCount: 4, eliteCount: 2,// плотность угроз на ярусе
    secretCount: 2, dangerPockets: 2,        // секретные зоны и опасные карманы
    windLanes: 3, windBoost: 1.8,            // воздушные потоки — быстрое перемещение
    staminaMax: 200,
  },
  Release: {
    version: '3.0.0',
    advancedWaveLevel: 25,
    marketLevel: 20,
    decorLevel: 12,
  },
};
const GB = GAME_BALANCE; // короткий алиас
