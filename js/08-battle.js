/* ============================================================
   08-battle.js — БОЙ: арена, боевой цикл, мана, механики боссов, мини-игры тайминга и двойной ульты
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ===== АРЕНА ===== */
let battle=null;
function arcadeEnabled(){ return S.arcadeOn!==false; } // по умолчанию включено

function renderArenaPicker(){
  const chk=$('#arcadeChk');
  if(chk){ chk.checked=arcadeEnabled(); chk.onchange=()=>{S.arcadeOn=chk.checked;persist();}; }
  const wrap=$('#arenaPicker');
  const ready=S.dragons.filter(d=>d.curHp>0);
  if(!ready.length){wrap.innerHTML='<div class="empty">Нет бойцов в силах. Дай им отдохнуть в Логове.</div>';return;}
  wrap.innerHTML='<p class="hint">Твой чемпион:</p><div class="roster" id="myFighters"></div>';
  const mf=$('#myFighters');
  ready.forEach(d=>{
    const c=dragonCard(d,{onclick:()=>{S.arenaPick=d.uid;renderArenaPicker();}});
    if(S.arenaPick===d.uid)c.classList.add('sel');
    mf.appendChild(c);
  });
  if(S.arenaPick && ready.some(d=>d.uid===S.arenaPick)){
    const me=S.dragons.find(d=>d.uid===S.arenaPick);
    wrap.innerHTML+=`<div class="rule"></div><p class="hint">Выбери противника:</p>`;
    const foes=document.createElement('div');foes.className='roster';
    [-1,0,1].forEach(delta=>{
      let sp=weightedSpecies();
      // «Слабее» — тренировочный бой: стихия врага не контрит чемпиона
      if(delta<0){let g=0;while(ADVANTAGE[sp.el]===speciesById(me.id).el&&g++<8)sp=weightedSpecies();}
      // очень редкий вид заметно сильнее — приходит «Легендой»: ниже уровнем, но награда ×2
      const legend = sp.rarity >= speciesById(me.id).rarity + 2;
      const lvl=Math.max(1, me.level + delta - (legend?3:0));
      const foeMorph=rollMorph();
      // множитель за риск: враг выше твоего уровня — щедрее, слабее — скромнее
      const riskMult = delta>0 ? 1.5 : (delta<0 ? 0.7 : 1.0);
      const reward=Math.round(lvl* (8+sp.rarity*4) * (morphById(foeMorph).id==='common'?1:1.2) * riskMult * (legend?2:1));
      const card=document.createElement('div');
      card.className='dcard';
      const riskTag = delta>0?'<span class="risk-tag hard">⚔️ Сильнее</span>':(delta<0?'<span class="risk-tag easy">Слабее</span>':'<span class="risk-tag even">Равный</span>');
      card.innerHTML=`
        <span class="lvlpill">ур.${lvl}</span>
        <span class="star">${'★'.repeat(sp.rarity)}</span>
        ${sigilHTML(sp,foeMorph,'sigil',lvl)}
        <div class="dname">Дикий ${sp.name}</div>
        ${elTag(sp.el)} ${morphBadge(foeMorph)}
        <div style="margin-top:6px">${legend?'<span class="risk-tag hard">⭐ Легенда</span> ':''}${riskTag}</div>
        <div class="dmeta" style="margin-top:6px;color:var(--gold)">Награда 🪙${reward}</div>`;
      card.onclick=()=>startBattle(me,{id:sp.id,level:lvl,morph:foeMorph},reward);
      foes.appendChild(card);
    });
    wrap.appendChild(foes);
    // испытание волн
    const waveCard=document.createElement('div');
    waveCard.className='wave-entry';
    waveCard.innerHTML=`
      <div class="wave-title">🌊 Испытание волн</div>
      <div class="dmeta">Волны врагов всё сильнее — на одном запасе сил и маны. Между волнами лишь короткая передышка. Уйди вовремя, чтобы забрать всю добычу; падёшь — спасёшь половину.</div>
      <div class="wave-record">Рекорд: <b>${S.waveBest||0}</b> волн</div>
      <button class="btn" id="waveStartBtn">Начать испытание</button>`;
    wrap.appendChild(waveCard);
    $('#waveStartBtn').onclick=()=>startWaveRun(me);
  } else {
    wrap.innerHTML+='<p class="hint">Выбери чемпиона, чтобы вызвать противников.</p>';
  }
}

function makeCombatant(d,isFoe){
  const sp=speciesById(d.id),st=statsOf(d);
  // лучшее открытое заклинание и ультимативка из древа талантов
  const unlocked = unlockedSpells(d);
  const spells = unlocked.filter(n=>n.kind==='spell');
  const ults = unlocked.filter(n=>n.kind==='ult');
  const topSpell = spells.length? spells[spells.length-1] : null;
  const topUlt = ults.length? ults[ults.length-1] : null;
  // мана: «магические» стихии (буря, тень) выносливее; старт — треть
  let fx = isFoe ? {critPct:0,manaMax:0,manaRegen:0,healPct:0,vampPct:0,dmgRedPct:0,dodgePct:0} : equipFx(d);
  if(!isFoe && typeof dragonPassiveFx==='function'){ const pf=dragonPassiveFx(d.id); for(const k in pf) fx[k]=(fx[k]||0)+pf[k]; } // уникальная пассивка вида
  const manaMax = ((sp.el==='storm'||sp.el==='shade') ? 8 : 6) + (fx.manaMax||0);
  return {uid:d.uid,ref:isFoe?null:d,sp,el:sp.el,morph:d.morph||'common',
    level:d.level,maxHp:st.maxHp,hp:isFoe?st.maxHp:d.curHp,
    atk:st.atk,def:st.def,spd:st.spd,isFoe,
    mana:2, manaMax,
    fx, // эффекты от артефактов: critPct, manaRegen, healPct, vampPct
    spell: topSpell? {n:topSpell.name, icon:topSpell.icon, pow:1.45, t:topSpell.desc, isSpell:true, manaCost:3} : null,
    ult: topUlt? {n:topUlt.name, icon:topUlt.icon, pow:2.4, t:topUlt.desc, isUlt:true, heal: topUlt.lvl===100, manaCost:6} : null,
    ultUsed:false, happy5:!isFoe&&(d.happy||0)>=HAPPY_MAX,
    role:(typeof dragonRole==='function')?dragonRole(d.id):'Воин'};
}
const MANA_REGEN_BASIC=1; // мана за обычный удар
const MANA_REGEN_GUARD=2; // мана за защиту (защита копит ману)

function startBattle(myDragon,foeSpec,reward,bossDef){
  const foeDragon={id:foeSpec.id,level:foeSpec.level,xp:0,curHp:0,morph:foeSpec.morph||'common'};
  foeDragon.curHp=statsOf(foeDragon).maxHp;
  const foe=makeCombatant(foeDragon,true);
  if(bossDef){
    // усиление босса
    const bk=(S.bossKills&&S.bossKills[bossDef.id])||0; const rematch=1+bk*0.15; // реванш: +15% сложности за победу
    foe.maxHp=Math.round(foe.maxHp*bossDef.hpMult*rematch); foe.hp=foe.maxHp;
    foe.atk=Math.round(foe.atk*bossDef.atkMult*rematch);
    foe.isBoss=true;
    if(!S.bossSeen)S.bossSeen={}; S.bossSeen[bossDef.id]=true; // кодекс: встреча
  }
  battle={
    me:makeCombatant(myDragon,false),
    foe,
    reward, log:[], turn:0, over:false,
    guardStreak:0, combo:0,
    boss:bossDef||null, bossHits:0, bossStalled:false
  };
  $('#arenaSetup').style.display='none';
  $('#battleStage').style.display='block';
  renderBattle();
  if(bossDef){
    pushLog(`<span class="gold">⚔️ ${bossDef.icon} <b>${bossDef.name}</b> восстаёт!</span> ${bossDef.lore}`);
  } else {
    pushLog(`<span class="gold">Бой начинается!</span> ${battle.me.sp.name} против дикого ${battle.foe.sp.name}.`);
    hintOnce('battle','Мана 💧 копится каждый ход (защита даёт больше). Накопи её на заклинание и мощную ⭐ ульту!');
  }
}

const MOVES = {
  fire:  [{n:'Огненный плевок',pow:1.0,t:'Базовый урон стихии огня'},{n:'Залп углей',pow:1.7,t:'Сильный удар, ×0.7 шанс попасть'}],
  frost: [{n:'Ледяной шип',pow:1.0,t:'Базовый урон стихии льда'},{n:'Метель',pow:1.7,t:'Сильный удар, ×0.7 шанс попасть'}],
  venom: [{n:'Кислотный укус',pow:1.0,t:'Базовый урон яда'},{n:'Споровая буря',pow:1.7,t:'Сильный удар, ×0.7 шанс попасть'}],
  storm: [{n:'Громовой разряд',pow:1.0,t:'Базовый урон бури'},{n:'Шторм молний',pow:1.7,t:'Сильный удар, ×0.7 шанс попасть'}],
  shade: [{n:'Теневой коготь',pow:1.0,t:'Базовый урон тени'},{n:'Поглощение',pow:1.3,t:'Бьёт и лечит на 40% урона'}],
};
const GUARD={n:'Защита',pow:0,t:'Готовится: следующий удар по тебе слабее, лечит немного'};

function renderBattle(){
  const b=battle;
  const stage=$('#battleStage');
  const hpBar=c=>`<div class="hpwrap"><div class="bar hp"><i style="width:${Math.max(0,c.hp/c.maxHp*100)}%"></i></div></div>
    <div class="dmeta" style="margin-top:3px">${Math.max(0,c.hp)}/${c.maxHp}</div>`;
  const manaBar=c=>`<div class="hpwrap mana"><div class="bar mn"><i style="width:${Math.max(0,c.mana/c.manaMax*100)}%"></i></div></div>
    <div class="dmeta mana-meta">💧 ${c.mana}/${c.manaMax}</div>`;
  const moves = MOVES[b.me.el].map((m,i)=>({...m,key:'m'+i}));
  const elScene={fire:'fire',venom:'jungle',frost:'ice',storm:'ice',shade:'shade'}[b.foe.el]||'shade';
  const canSpell = b.me.spell && b.me.mana>=b.me.spell.manaCost;
  const canUlt = b.me.ult && b.me.mana>=b.me.ult.manaCost;
  // оценка урона приёма по текущим статам (диапазон с учётом стихии)
  const estDmg=(pow)=>{
    const base=GB.Battle.damageK*(b.me.atk*b.me.atk/(b.me.atk+b.foe.def))*pow;
    const mult=advMult(b.me.el,b.foe.el);
    const lo=Math.max(1,Math.round(base*0.85*mult));
    const hi=Math.max(1,Math.round(base*1.15*mult));
    return {lo,hi,mult};
  };
  const dmgTag=(pow,acc)=>{
    const e=estDmg(pow);
    const advIcon = e.mult>1?' <span class="gold">▲</span>':(e.mult<1?' <span class="dim">▽</span>':'');
    const accNote = acc?` <span class="dim">·${Math.round(acc*100)}%</span>`:'';
    return `<span class="mv-dmg">⚔️ ${e.lo}–${e.hi}${advIcon}${accNote}</span>`;
  };
  stage.innerHTML=`
  <div class="arena">
    <div class="arena-bg">${sceneSVG(elScene,'battle')}</div>
    <div class="fighters">
      <div class="fighter" id="fMe">
        ${sigilHTML(b.me.sp,b.me.morph,'fs',b.me.level)}
        <div class="fname">${b.me.sp.name} <span style="color:var(--ink-dim)">ур.${b.me.level}</span></div>
        ${elTag(b.me.el)} ${morphBadge(b.me.morph)}
        ${hpBar(b.me)}
        ${manaBar(b.me)}
      </div>
      <div class="versus">⚔</div>
      <div class="fighter" id="fFoe">
        ${sigilHTML(b.foe.sp,b.foe.morph,'fs',b.foe.level)}
        <div class="fname">Дикий ${b.foe.sp.name} <span style="color:var(--ink-dim)">ур.${b.foe.level}</span></div>
        ${elTag(b.foe.el)} ${morphBadge(b.foe.morph)}
        ${hpBar(b.foe)}
        ${manaBar(b.foe)}
      </div>
    </div>
  </div>
  <div class="panel">
    <h2>Приёмы</h2>
    <div class="moves" id="moveBox">
      ${moves.map(m=>`<button class="move" data-k="${m.key}" ${b.over?'disabled':''}>
        <div class="mn">${m.n}</div><div class="mv-meta">${dmgTag(m.pow, m.pow>=1.5?0.7:0)}</div></button>`).join('')}
      <button class="move move-guard" data-k="guard" ${b.over?'disabled':''}>
        <div class="mn">🛡️ ${GUARD.n}</div><div class="mv-meta"><span class="mv-heal">✚ защита +лечение</span> <span class="mana-gain">+${MANA_REGEN_GUARD}💧 за 1-ю</span></div></button>
      ${b.me.spell?`<button class="move move-spell" data-k="spell" ${b.over||!canSpell?'disabled':''}>
        <div class="mn">${b.me.spell.icon} ${b.me.spell.n}</div><div class="mv-meta">${dmgTag(b.me.spell.pow)} <span class="mana-cost">💧${b.me.spell.manaCost}</span>${!canSpell?' <span class="need-mana">мало</span>':''}</div></button>`:''}
      ${b.me.ult?`<button class="move move-ult" data-k="ult" ${b.over||!canUlt?'disabled':''}>
        <div class="mn">⭐ ${b.me.ult.icon} ${b.me.ult.n}</div><div class="mv-meta">${dmgTag(b.me.ult.pow)} <span class="mana-cost">💧${b.me.ult.manaCost}</span>${!canUlt?' <span class="need-mana">нужно '+b.me.ult.manaCost+'💧</span>':''}</div></button>`:''}
    </div>
    <div class="battle-latest" id="battleLatest">${b.log.length?b.log[b.log.length-1]:''}</div>
    <div class="btnrow" id="battleEnd"></div>
  </div>`;
  $$('#moveBox .move').forEach(btn=>btn.onclick=()=>{
    const k=btn.dataset.k;
    let move;
    if(k==='guard') move=GUARD;
    else if(k==='spell'){ if(b.me.mana<b.me.spell.manaCost)return; move=b.me.spell; }
    else if(k==='ult'){ if(b.me.mana<b.me.ult.manaCost)return; move=b.me.ult; }
    else move=MOVES[b.me.el][+k.slice(1)];
    playerMove(move);
  });
}

function pushLog(html){battle.log.push(html);const lt=$('#battleLatest');if(lt){lt.innerHTML=html;lt.classList.remove('flash');void lt.offsetWidth;lt.classList.add('flash');}}

function advMult(attEl,defEl){
  if(ADVANTAGE[attEl]===defEl)return GB.Battle.elementAdv;
  if(ADVANTAGE[defEl]===attEl)return GB.Battle.elementWeak;
  return 1;
}

function doStrike(att,def,move,labelClass,accMult){
  accMult = accMult||1;
  // ультимативка и заклинания не промахиваются; сильные обычные приёмы — могут
  if(move.pow>=1.5 && !move.isUlt && !move.isSpell && Math.random()>GB.Battle.strongMoveHit){
    pushLog(`<span>${att.sp.name} промахнулся «${move.n}».</span>`);
    return {dmg:0,miss:true};
  }
  // уклонение — пассивка защищающегося (Следопыт/Стрелок)
  if(def.fx && def.fx.dodgePct>0 && Math.random()*100 < def.fx.dodgePct){
    pushLog(`<span class="gold">${def.sp.name} уклоняется от «${move.n}»!</span>`);
    sfx('hit'); return {dmg:0,dodge:true};
  }
  const raw = GB.Battle.damageK*(att.atk*att.atk/(att.atk+def.def));
  const base = raw*move.pow;
  let dmg = Math.max(1, Math.round(base * (rnd(85,115)/100)));
  dmg=Math.round(dmg*accMult); // бонус/штраф от мини-игры тайминга
  let mult=advMult(att.el,def.el);
  // босс: явная слабость из свитков (переопределяет стихийную таблицу)
  if(def.isBoss && battle && battle.boss){
    if(battle.boss.weakTo){ mult = att.el===battle.boss.weakTo ? GB.Battle.bossWeakMult : Math.min(mult,1.0); }
    if(battle.bossStalled){ mult*=GB.Battle.bossStallMult; } // застывший босс беззащитен
  }
  dmg=Math.round(dmg*mult);
  if(!att.isFoe && att.happy5) dmg=Math.round(dmg*GB.Battle.happyBonus); // счастливый дракон старается (+5%)
  if(def.guarding){dmg=Math.round(dmg*GB.Battle.guardReduce);def.guarding=false;}
  if(def.parryMult){dmg=Math.round(dmg*def.parryMult);def.parryMult=0;}
  if(def.fx && def.fx.dmgRedPct>0) dmg=Math.max(1,Math.round(dmg*(1-def.fx.dmgRedPct/100))); // пассивка Защитника
  if(def.isBoss && battle && battle.bossShield>0){ dmg=Math.max(1,Math.round(dmg*0.65)); battle.bossShield--; if(battle.bossShield===0)pushLog(`<span class="gold">Щит ${battle.boss?battle.boss.name:'босса'} разрушен!</span>`); } // контрмеханика: пробей щит
  // КРИТ отделён от идеального тайминга: базовый шанс + резвость(скорость) + реликвии; урон ×1.5
  const spdCrit = Math.max(GB.Battle.spdCritMin, Math.min(GB.Battle.spdCritMax, (att.spd - def.spd)*GB.Battle.spdCritScale));
  const critChance = att.isFoe ? (GB.Battle.critBaseFoe + spdCrit) : (GB.Battle.critBasePlayer + spdCrit + ((att.fx&&att.fx.critPct)||0)/100);
  const crit = Math.random() < critChance;
  if(crit)dmg=Math.round(dmg*GB.Battle.critMult);
  sfx(crit?'crit':'hit');
  def.hp-=dmg;
  if(S.tutorialGuard && battle && def===battle.me && def.hp<1) def.hp=1; // обучение без поражения
  let extra='';
  if(mult>1)extra=' <span class="gold">(стихия превосходит!)</span>';
  else if(mult<1)extra=' <span style="color:var(--ink-dim)">(стихия слаба)</span>';
  const label = move.isUlt?'⭐ применяет УЛЬТУ':(move.isSpell?'колдует':'применяет');
  pushLog(`${att.sp.name} ${label} <b>${move.n}</b> — <span class="dmg">${dmg} урона</span>${crit?' <span class="crit">КРИТ!</span>':''}${extra}`);
  // вампиризм от артефактов: лечит атакующего на % нанесённого урона
  const vamp=(att.fx&&att.fx.vampPct)||0;
  if(vamp>0 && dmg>0){const heal=Math.max(1,Math.round(dmg*vamp/100));att.hp=Math.min(att.maxHp,att.hp+heal);if(!att.isFoe&&battle)battle.usedHeal=true;pushLog(`<span class="heal">🩸 ${att.sp.name} впитывает ${heal} жизни (вампиризм).</span>`);}
  // лечение от тени/поглощения и от лечащих ульт
  if(move.n==='Поглощение'){const heal=Math.round(dmg*0.25);att.hp=Math.min(att.maxHp,att.hp+heal);if(!att.isFoe&&battle)battle.usedHeal=true;pushLog(`<span class="heal">${att.sp.name} впитывает ${heal} жизни.</span>`);}
  if(move.heal){const heal=Math.round(att.maxHp*0.5);att.hp=Math.min(att.maxHp,att.hp+heal);if(!att.isFoe&&battle)battle.usedHeal=true;pushLog(`<span class="heal">${att.sp.name} исцеляется на ${heal}!</span>`);}
  return {dmg,crit,mult};
}

function animate(which,kind){
  const id=which==='me'?'#fMe':'#fFoe';
  const el=$(id);if(!el)return;
  el.classList.add(kind);setTimeout(()=>el.classList.remove(kind),360);
}

function playerMove(move){
  const b=battle;if(b.over)return;
  $$('#moveBox .move').forEach(x=>x.disabled=true);

  if(move===GUARD){
    b.combo=0;
    b.guardStreak=(b.guardStreak||0)+1;
    b.me.guarding=true;
    // каждая защита подряд лечит вдвое слабее, четвёртая и дальше — не лечит
    const healPct=[0.08,0.04,0.02][b.guardStreak-1]||0;
    const heal=Math.round(b.me.maxHp*healPct);
    if(heal>0){b.me.hp=Math.min(b.me.maxHp,b.me.hp+heal); b.usedHeal=true;}
    let manaTxt='';
    if(b.guardStreak===1){
      b.me.mana=Math.min(b.me.manaMax, b.me.mana+MANA_REGEN_GUARD);
      manaTxt=` <span class="mana-log">+${MANA_REGEN_GUARD}💧</span>`;
    }
    animate('me','cast');
    if(heal>0){
      pushLog(`${b.me.sp.name} <b>встаёт в защиту</b> и восстанавливает <span class="heal">${heal}</span> жизни.${manaTxt}${b.guardStreak===2?' <span class="dim">Щит слабеет…</span>':''}`);
    } else {
      pushLog(`${b.me.sp.name} держит щит, но <b>лапы устали</b> — лечение иссякло. Пора атаковать!`);
    }
    afterPlayerMove();
    return;
  }
  b.guardStreak=0; // любая атака возвращает щиту силу
  // трата/восстановление маны
  if(move.manaCost){
    b.me.mana=Math.max(0, b.me.mana - move.manaCost);
  } else {
    // обычный удар восстанавливает ману
    b.me.mana=Math.min(b.me.manaMax, b.me.mana+MANA_REGEN_BASIC);
  }
  // ультимативный приём — двойная мини-игра (если аркада включена)
  if(move.isUlt && arcadeEnabled()){
    startUltMinigame(move);
    return;
  }
  // атакующий приём — запускаем мини-игру тайминга (если включена)
  if(arcadeEnabled()){
    startTimingStrike(move);
  } else {
    // без мини-игры — скрытая компенсация точности
    resolvePlayerStrike(move, GB.Battle.timing.none);
  }
}
// выполнить удар игрока с множителем точности из мини-игры
function resolvePlayerStrike(move, accMult){
  const b=battle;
  // комбо: точные попадания подряд наращивают урон (×1.1 → ×1.2 → ×1.3)
  if(accMult>=GB.Battle.combo.threshold){ b.combo=Math.min(GB.Battle.combo.max,(b.combo||0)+1); if(b.combo>1)floatText('Комбо ×'+(1+b.combo*GB.Battle.combo.perStack).toFixed(2),'#ffd24a'); }
  else if(accMult<1.0){ b.combo=0; }
  const comboMult=1+(b.combo||0)*GB.Battle.combo.perStack;
  animate('me','cast');animate('foe','hit');
  const r=doStrike(b.me,b.foe,move,null,accMult*comboMult);
  if(r.dmg&&r.mult>1)floatText('стихия!',ELEMENTS[b.me.el].color);
  afterPlayerMove();
}
function afterPlayerMove(){
  const b=battle;
  // эффекты артефактов игрока в конце его хода: лечение/ход и доп. реген маны
  const fx=b.me.fx||{};
  if(fx.healPct>0 && b.me.hp>0){
    const heal=Math.max(1,Math.round(b.me.maxHp*fx.healPct/100));
    b.me.hp=Math.min(b.me.maxHp,b.me.hp+heal); b.usedHeal=true;
    pushLog(`<span class="heal">✚ Реликвия исцеляет ${b.me.sp.name} на ${heal}.</span>`);
  }
  if(fx.manaRegen>0){ b.me.mana=Math.min(b.me.manaMax, b.me.mana+fx.manaRegen); }
  renderHpOnly();
  if(b.foe.hp<=0){return endBattle(true);}
  setTimeout(foeTurn,650);
}

/* ===== МИНИ-ИГРА: УДАР ПО ТАЙМИНГУ ===== */
let timingState=null;
function startTimingStrike(move){
  const stage=$('#battleStage'); if(!stage){resolvePlayerStrike(move,1);return;}
  const box=document.createElement('div');
  box.className='timing-overlay';
  box.innerHTML=`
    <div class="timing-card">
      <div class="timing-title">⚡ Удар по таймингу!</div>
      <div class="timing-sub">Нажми, когда стрелка в золотой зоне</div>
      <div class="timing-bar" id="timingBar">
        <div class="timing-zone good"></div>
        <div class="timing-zone perfect"></div>
        <div class="timing-marker" id="timingMarker"></div>
      </div>
      <div class="timing-btns">
        <button class="btn ghost" id="timingSkip">Пропустить</button>
        <button class="btn" id="timingHit">БЕЙ!</button>
      </div>
    </div>`;
  stage.appendChild(box);
  // позиции зон (в % ширины)
  const perfStart=46, perfEnd=54, goodStart=34, goodEnd=66;
  // скорость по ВРЕМЕНИ (%/сек), а не по кадрам — иначе на 120Гц экранах бегунок летит вдвое быстрее
  const SPEED=100;
  let pos=0, dir=1, raf=null, last=performance.now(), doneFlag=false;
  const marker=box.querySelector('#timingMarker');
  function tick(now){
    const dt=Math.min(0.05,(now-last)/1000); last=now;
    pos+=dir*SPEED*dt;
    if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;}
    marker.style.left=pos+'%';
    raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(t=>{last=t;tick(t);});
  function finish(accMult,label,color){
    if(doneFlag) return; doneFlag=true;
    cancelAnimationFrame(raf);
    box.remove();
    if(label) floatText(label,color);
    resolvePlayerStrike(move, accMult);
  }
  // pointerdown = мгновенный отклик на касание (click на мобильных запаздывает и глотается жестами)
  box.querySelector('#timingHit').onpointerdown=(e)=>{
    e.preventDefault();
    if(pos>=perfStart&&pos<=perfEnd) finish(GB.Battle.timing.perfect,'⭐ ИДЕАЛЬНО!','#ffd24a');
    else if(pos>=goodStart&&pos<=goodEnd) finish(GB.Battle.timing.good,'✯ Точно!','#7fb24a');
    else finish(GB.Battle.timing.miss,'промах…','#c5544a');
  };
  box.querySelector('#timingSkip').onpointerdown=(e)=>{e.preventDefault();finish(1.0,null,null);};
}

/* ===== ДВОЙНАЯ МИНИ-ИГРА ДЛЯ УЛЬТЫ =====
   Два поля подряд. Активация только при попадании в обе области.
   Крит по центру каждой: обе в центр → сокрушительный ×2.25. */
function startUltMinigame(move){
  const stage=$('#battleStage'); if(!stage){resolvePlayerStrike(move,GB.Battle.timing.none);return;}
  const box=document.createElement('div');
  box.className='timing-overlay';
  box.innerHTML=`
    <div class="timing-card ult-card">
      <div class="timing-title">⭐ УЛЬТА: Двойной фокус!</div>
      <div class="timing-sub">Попади в <b>обе</b> золотые зоны. Центр = крит!</div>
      <div class="timing-bar" id="ultBar1">
        <div class="timing-zone good"></div>
        <div class="timing-zone perfect"></div>
        <div class="timing-marker" id="ultMarker1"></div>
        <div class="ult-badge" id="ultBadge1">1</div>
      </div>
      <div class="timing-bar" id="ultBar2">
        <div class="timing-zone good"></div>
        <div class="timing-zone perfect"></div>
        <div class="timing-marker" id="ultMarker2" style="left:0%"></div>
        <div class="ult-badge" id="ultBadge2">2</div>
      </div>
      <div class="timing-btns">
        <button class="btn ghost" id="ultSkip">Пропустить</button>
        <button class="btn" id="ultHit">ФОКУС!</button>
      </div>
    </div>`;
  stage.appendChild(box);
  const perfStart=45, perfEnd=55, goodStart=32, goodEnd=68;
  let phase=1; // 1 → бьём первую зону, 2 → вторую
  const SPEED=118; // %/сек (по времени, не по кадрам)
  let pos=0, dir=1, raf=null, last=performance.now(), doneFlag=false;
  let hit1=null; // 'crit' | 'good' | null(промах)
  const m1=box.querySelector('#ultMarker1'), m2=box.querySelector('#ultMarker2');
  function tick(now){
    const dt=Math.min(0.05,(now-last)/1000); last=now;
    pos+=dir*SPEED*dt;
    if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;}
    (phase===1?m1:m2).style.left=pos+'%';
    raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(t=>{last=t;tick(t);});
  function zoneResult(){
    if(pos>=perfStart&&pos<=perfEnd) return 'crit';
    if(pos>=goodStart&&pos<=goodEnd) return 'good';
    return null;
  }
  function finishUlt(accMult,label,color){
    if(doneFlag) return; doneFlag=true;
    cancelAnimationFrame(raf);
    box.remove();
    if(label) floatText(label,color);
    resolvePlayerStrike(move, accMult);
  }
  box.querySelector('#ultHit').onpointerdown=(e)=>{
    e.preventDefault();
    if(phase===1){
      hit1=zoneResult();
      // отметим результат первой зоны
      const badge=box.querySelector('#ultBadge1');
      badge.classList.add(hit1==='crit'?'ok-crit':(hit1==='good'?'ok':'miss'));
      m1.classList.add('locked');
      if(hit1===null){
        // промах по первой — ульта срывается, бьёт ослабленно, мана уже потрачена
        return finishUlt(GB.Battle.ult.fail,'ульта сорвалась…','#c5544a');
      }
      phase=2; pos=0; dir=1;
    } else {
      const hit2=zoneResult();
      const badge=box.querySelector('#ultBadge2');
      badge.classList.add(hit2==='crit'?'ok-crit':(hit2==='good'?'ok':'miss'));
      if(hit2===null){
        return finishUlt(GB.Battle.ult.fail,'вторая зона мимо…','#c5544a');
      }
      // обе зоны поражены → сила по сумме
      if(hit1==='crit'&&hit2==='crit') finishUlt(GB.Battle.ult.perfect,'💥 СОКРУШИТЕЛЬНО!','#ffd24a');
      else if(hit1==='crit'||hit2==='crit') finishUlt(GB.Battle.ult.one,'⭐ Мощно!','#ffd24a');
      else finishUlt(GB.Battle.ult.good,'✯ Ульта прошла!','#7fb24a');
    }
  };
  box.querySelector('#ultSkip').onpointerdown=(e)=>{e.preventDefault();finishUlt(1.0,null,null);};
}

// === ФАЗА БОССА: применить эффект при пересечении порога HP (FSM) ===
function applyBossPhase(b,ph){
  const f=b.foe; if(!f)return;
  pushLog(`<span class="gold">${b.boss.icon} <b>${b.boss.name}</b> ${ph.msg}</span>`); animate('foe','cast');
  if(ph.kind==='rage'){ f.atk=Math.round(f.atk*1.25); }
  else if(ph.kind==='shield'){ b.bossShield=(b.bossShield||0)+2; }
  else if(ph.kind==='enrage'){ b.bossEnrage=true; }
  else if(ph.kind==='final'){ f.atk=Math.round(f.atk*1.15); b.bossEnrage=true; }
}
// ИИ врага/босса — конечный автомат по правилам (не случайный выбор)
function foeTurn(){
  const b=battle;if(b.over)return;
  const f=b.foe;
  // === МЕХАНИКИ БОССА ===
  if(b.boss && b.boss.mech==='stall3' && b.bossStalled){
    // босс застыл — пропускает атаку, окно закрывается
    b.bossStalled=false; b.bossHits=0;
    pushLog(`<span class="gold">⚡ ${b.boss.name} приходит в себя после застывания.</span>`);
    renderHpOnly();
    $$('#moveBox .move').forEach(x=>x.disabled=false);
    return;
  }
  // === ФАЗЫ БОССА (FSM по HP): смена поведения на порогах ===
  if(b.boss && b.boss.phases){ const frac=f.hp/f.maxHp; if(!b._ph)b._ph={};
    for(const ph of b.boss.phases){ if(frac<=ph.at && !b._ph[ph.at]){ b._ph[ph.at]=true; applyBossPhase(b,ph); } } }
  // === ПРАВИЛО: игрок готовит ульту → босс защищается ===
  if(f.isBoss && b.me.ult && b.me.mana>=(b.me.ult.manaCost-1) && !f.guarding && Math.random()<0.4){
    f.guarding=true; f.mana=Math.min(f.manaMax,f.mana+1); animate('foe','cast');
    pushLog(`<span class="gold">${b.boss?b.boss.name:f.sp.name} готовится к обороне — чует твою мощь!</span>`);
    renderHpOnly(); $$('#moveBox .move').forEach(x=>x.disabled=false); return;
  }
  // враг тоже владеет маной: копит на заклинание, тратит с умом
  const hpFrac=f.hp/f.maxHp;
  let move=null, isSpell=false;
  // 1) на грани — иногда защищается и копит ману
  const roleGuard={'Защитник':1.7,'Поддержка':1.3,'Контроллер':1.1}[f.role]||0.6; // ИИ по роли: кто чаще защищается
  if(hpFrac<0.22 && Math.random()<0.35*roleGuard && !f.isBoss){
    f.guarding=true;
    f.mana=Math.min(f.manaMax,f.mana+1);
    const heal=Math.round(f.maxHp*0.07);f.hp=Math.min(f.maxHp,f.hp+heal);
    animate('foe','cast');
    pushLog(`Дикий ${f.sp.name} <b>защищается</b> (+${heal} жизни).`);
    renderHpOnly();
    if(b.me.hp<=0){return endBattle(false);}
    $$('#moveBox .move').forEach(x=>x.disabled=false);
    return;
  }
  // 2) есть спелл-мана и достаточно (симулируем сильный удар стихии) — бьёт сильнее
  const foeSpellCost=3;
  const roleZeal={'Маг':1.5,'Стрелок':1.4,'Контроллер':1.2,'Поддержка':1.2}[f.role]||1.0;
  const foeZeal = (f.level>b.me.level ? 0.5 : (f.level<b.me.level ? 0.12 : 0.3)) * roleZeal * (b.bossEnrage?1.5:1); // сильный колдует чаще; роль и ярость влияют
  if(f.mana>=foeSpellCost && Math.random()<foeZeal){
    f.mana-=foeSpellCost;
    move={...MOVES[f.el][0], n:'усиленный '+MOVES[f.el][0].n, pow:GB.Battle.foeSpellPow};
    isSpell=true;
  } else {
    const strongChance={'Берсерк':0.7,'Воин':0.55}[f.role]||0.4; // берсерк/воин чаще бьют сильно
    move = Math.random()<strongChance?MOVES[f.el][1]:MOVES[f.el][0];
    f.mana=Math.min(f.manaMax,f.mana+MANA_REGEN_BASIC);
  }
  const deliver=()=>{
    animate('foe','cast');animate('me','hit');
    const res=doStrike(f,b.me,move);
    // босс-механики после его удара
    if(b.boss){
      if(b.boss.mech==='vamp' && res && res.dmg>0){
        const heal=Math.max(1,Math.round(res.dmg*0.15));
        f.hp=Math.min(f.maxHp,f.hp+heal);
        pushLog(`<span style="color:#c08">🌑 ${b.boss.name} впитывает ${heal} жизни из тьмы.</span>`);
      }
      if(b.boss.mech==='stall3'){
        b.bossHits=(b.bossHits||0)+1;
        if(b.bossHits>=3){
          b.bossStalled=true;
          pushLog(`<span class="gold">⚡ ${b.boss.name} замирает, копя силу — он беззащитен! Бей сейчас!</span>`);
        }
      }
    }
    renderHpOnly();
    if(b.me.hp<=0){endBattle(false);return;}
    $$('#moveBox .move').forEach(x=>x.disabled=false);
  };
  // сильный удар телеграфируется: окно парирования (если аркада включена)
  if(arcadeEnabled() && move.pow>=1.5){
    pushLog(`⚠️ ${f.sp.name} <b>замахивается</b> для мощного удара!`);
    startParry(ok=>{
      if(ok){ b.me.parryMult=0.6; floatText('🛡️ Парировано!','#7fb24a'); }
      deliver();
    });
  } else deliver();
}

/* ===== МИНИ-ИГРА: ПАРИРОВАНИЕ ===== */
function startParry(done){
  const stage=$('#battleStage'); if(!stage){done(false);return;}
  const box=document.createElement('div');
  box.className='timing-overlay';
  box.innerHTML=`
    <div class="timing-card">
      <div class="timing-title">🛡️ Мощный удар летит!</div>
      <div class="timing-sub">Нажми, когда стрелка в золотой зоне — щит примет удар</div>
      <div class="timing-bar">
        <div class="timing-zone good" style="left:36%;width:28%"></div>
        <div class="timing-marker" id="parryMarker"></div>
      </div>
      <div class="timing-btns"><button class="btn" id="parryBtn">ЩИТ!</button></div>
    </div>`;
  stage.appendChild(box);
  let pos=0, raf=null;
  const t0=performance.now(), DUR=1300;
  const m=box.querySelector('#parryMarker');
  function tick(now){
    pos=Math.min(100,(now-t0)/DUR*100);
    m.style.left=pos+'%';
    if(pos>=100){cleanup(false);return;}
    raf=requestAnimationFrame(tick);
  }
  function cleanup(ok){cancelAnimationFrame(raf);box.remove();done(ok);}
  box.querySelector('#parryBtn').onclick=()=>cleanup(pos>=36&&pos<=64);
  raf=requestAnimationFrame(tick);
}

function renderHpOnly(){
  const b=battle;
  // у каждого бойца две полосы: [0]=hp me, [1]=mana me, [2]=hp foe, [3]=mana foe
  const fighters=$$('#battleStage .fighter');
  const upd=(fighterEl,c)=>{
    if(!fighterEl)return;
    const hpI=fighterEl.querySelector('.bar.hp i'); if(hpI)hpI.style.width=Math.max(0,c.hp/c.maxHp*100)+'%';
    const mnI=fighterEl.querySelector('.bar.mn i'); if(mnI)mnI.style.width=Math.max(0,c.mana/c.manaMax*100)+'%';
    const hpMeta=fighterEl.querySelector('.dmeta:not(.mana-meta)'); if(hpMeta)hpMeta.textContent=`${Math.max(0,Math.round(c.hp))}/${c.maxHp}`;
    const mnMeta=fighterEl.querySelector('.mana-meta'); if(mnMeta)mnMeta.textContent=`💧 ${c.mana}/${c.manaMax}`;
  };
  upd(fighters[0],b.me);
  upd(fighters[1],b.foe);
}

/* ===== АРЕНА ВОЛН =====
   Бесконечное испытание: волны врагов всё сильнее на одном запасе сил.
   Добыча копится в банке: уйди вовремя — заберёшь всё; падёшь — половину. */
let waveRun=null;
function waveFoeSpec(d,wave){
  const lvl=Math.max(2,Math.round(d.level*(0.55+0.12*wave)));
  const sp=weightedSpecies();
  return {id:sp.id,level:lvl,morph:rollMorph()};
}
function startWaveRun(d){
  waveRun={d, wave:1, bank:{gold:0,dust:0}, mana:2};
  startWaveBattle();
}
function startWaveBattle(){
  const run=waveRun; if(!run) return;
  startBattle(run.d, waveFoeSpec(run.d,run.wave), 0);
  battle.waveCtx=run;
  battle.me.mana=run.mana;
  renderBattle();
  pushLog(`<span class="gold">🌊 Волна ${run.wave}!</span> Против тебя — дикий ${battle.foe.sp.name} ур.${battle.foe.level}.`);
}
function finishWaveRun(){
  const run=waveRun; if(!run) return;
  S.gold+=run.bank.gold; S.dust+=run.bank.dust;
  sfx('win');
  toast(`🌊 <b>Испытание волн:</b> пройдено волн — ${run.wave}! Добыча: +${run.bank.gold}🪙${run.bank.dust?' +'+run.bank.dust+'✦':''}${run.wave>=(S.waveBest||0)&&run.wave>0?' · <span style="color:var(--gold)">РЕКОРД!</span>':''}`);
  waveRun=null; battle=null;
  $('#battleStage').style.display='none';
  $('#arenaSetup').style.display='block';
  renderArenaPicker(); renderLedger(); persist(); renderAll();
}

function endBattle(win){
  if(win && typeof incubateEggs==='function') incubateEggs(GB.Eggs.incBattle); // инкубация яиц за победу
  if(win) S.tutorialGuard=false;
  const b=battle;b.over=true;
  const me=b.me.ref; // настоящий дракон
  me.curHp=Math.max(0,Math.round(b.me.hp));
  $$('#moveBox .move').forEach(x=>x.disabled=true);
  if(win){
    const gold=b.reward;
    const xp=Math.round(b.reward*0.9 + b.foe.level*6);
    S.gold+=gold;
    const leveled=grantXp(me,xp);
    let eggMsg='';
    if(Math.random()<0.3){const bt=(battle.fromFlight&&flight)?flight.region.biomeN:1; addEgg(b.foe.el,bt); eggMsg=' Враг обронил <b>🥚 яйцо</b>!';}
    let artMsg='';
    if(Math.random()<0.22 && featureUnlocked('spire')){
      const maxR=Math.min(5, Math.max(1, Math.ceil(b.foe.level/3)+1));
      const art=weightedArtifact(maxR);
      addArtifact(art.id,1);
      artMsg=` Среди добычи — реликвия <b>${art.icon} ${art.name}</b>!`;
    }
    pushLog(`<span class="gold">Победа!</span> +${gold}🪙 · +${xp} опыта.${eggMsg}${artMsg}${leveled?' <span class="crit">Новый уровень!</span>':''}`);
    floatText('ПОБЕДА',' #d9a441');
    sfx('win');
    questEvent('win_arena');
    // === ПОБЕДА НАД ВЛАДЫКОЙ ===
    if(b.boss){
      const first=!bossDefeated(b.boss.id);
      if(!S.bossesDefeated)S.bossesDefeated={};
      S.bossesDefeated[b.boss.id]=true;
      // источник «boss»: победа над владыкой даёт яйцо повышенной редкости (V2)
      if(typeof rollEggFromSource==='function') rollEggFromSource('boss');
      if(!S.bossKills)S.bossKills={}; S.bossKills[b.boss.id]=(S.bossKills[b.boss.id]||0)+1; // реванш-счётчик
      if(first && b.boss.rewardEgg && typeof addCatalogEgg==='function'){ const e=addCatalogEgg(b.boss.rewardEgg); if(e)pushLog(`<span class="gold">🥚 Уникальная награда владыки — редкое яйцо!</span>`); }
      // секретное яйцо Затмения — босс повержен без единого лечения
      if(!b.usedHeal && typeof unlockSecretEgg==='function') unlockSecretEgg('egg_eclipse');
      if(first){
        // трофей-украшение (в каталоге DECORATIONS статически)
        if(!S.decorOwned)S.decorOwned=[];
        const trophy=decorById(b.boss.trophyId);
        S.decorOwned.push(b.boss.trophyId);
        // звезда владык — материал восхождения
        S.ascStars=(S.ascStars||0)+1;
        const bonus=Math.round(b.reward*1.5);
        S.gold+=bonus; S.dust+=50;
        pushLog(`<span class="gold">☠️ ${b.boss.icon} <b>${b.boss.name} повержен впервые!</b></span>`);
        pushLog(`🏆 Трофей «<b>${trophy.name}</b>» — укрась им поселение! · ⭐ <b>Звезда владык</b> (для Восхождения) · +${bonus}🪙 +50✦`);
      } else {
        S.gold+=Math.round(b.reward*0.5); S.dust+=15;
        pushLog(`${b.boss.icon} ${b.boss.name} вновь пал. Слава и добыча: +${Math.round(b.reward*0.5)}🪙 +15✦`);
      }
    }
  } else {
    // ни один бой не заканчивается без награды — утешительные золото и опыт
    const solaceGold=Math.max(5,Math.round((b.reward||20)*GB.Economy.solaceGoldPct));
    const solaceXp=Math.max(4,Math.round((b.foe.level||1)*GB.Economy.solaceXpPer));
    S.gold+=solaceGold; if(b.me.ref)grantXp(b.me.ref,solaceXp);
    pushLog(`<span class="dmg">Ох!</span> ${dragonName(b.me.ref)} устал и сдался, но набрался опыта: <span class="gold">+${solaceGold}🪙</span> и <span class="gold">+${solaceXp} опыта</span>.`);
    floatText('+'+solaceGold+'🪙','#d9a441');
    sfx('lose');
  }
  const end=$('#battleEnd');
  // после боя — показать полную историю сражения
  const latest=$('#battleLatest');
  if(latest){
    latest.classList.add('battle-history');
    latest.innerHTML=`<div class="bh-title">📜 Ход сражения</div>`+b.log.map(l=>`<p>${l}</p>`).join('');
  }
  if(b.fromFlight && flight){
    flight.battleWin=win; // итог заберёт renderFlight() при возврате
    if(win){ flight.stats.beasts++; }
    end.innerHTML=`<button class="btn" id="backFlightBtn">↩ Вернуться в полёт</button>`;
    $('#backFlightBtn').onclick=()=>{
      battle=null;
      $('#battleStage').style.display='none';
      $('#arenaSetup').style.display='block';
      // вернуться в полноэкранный полёт
      document.body.classList.add('flight-active');
      const fs=$('#flightFs'); if(fs) fs.style.display='block';
      renderFlight();
      renderAll();
    };
    renderLedger(); persist();
    return;
  }
  // === АРЕНА ВОЛН ===
  if(b.waveCtx){
    const run=b.waveCtx;
    if(win){
      const w=run.wave;
      const g=Math.round(b.foe.level*(12+w*5));
      const du=w>=3?(w-2)*3:0;
      run.bank.gold+=g; run.bank.dust+=du;
      if(w>(S.waveBest||0)) S.waveBest=w;
      // передышка: подлечка и перенос маны на следующую волну
      run.mana=Math.min(b.me.manaMax, b.me.mana+1);
      const heal=Math.round(b.me.maxHp*0.12);
      me.curHp=Math.min(statsOf(me).maxHp, me.curHp+heal);
      pushLog(`<span class="gold">🌊 Волна ${w} пройдена!</span> В копилке: <b>${run.bank.gold}🪙${run.bank.dust?' + '+run.bank.dust+'✦':''}</b>. Передышка: +${heal} жизни, +1💧.`);
      end.innerHTML=`<button class="btn" id="waveNextBtn">🌊 Волна ${w+1} →</button>
        <button class="btn ghost" id="waveLeaveBtn">Уйти с добычей</button>`;
      $('#waveNextBtn').onclick=()=>{run.wave++;battle=null;startWaveBattle();};
      $('#waveLeaveBtn').onclick=finishWaveRun;
      renderLedger(); persist();
      return;
    } else {
      const kg=Math.round(run.bank.gold*0.5), kd=Math.round(run.bank.dust*0.5);
      S.gold+=kg; S.dust+=kd;
      pushLog(`🌊 Испытание оборвалось на волне ${run.wave}. Спасена половина добычи: <b>+${kg}🪙${kd?' +'+kd+'✦':''}</b>.`);
      waveRun=null;
      // дальше — стандартные кнопки конца боя
    }
  }
  end.innerHTML=`<button class="btn" id="againBtn">К арене</button>
    <button class="btn ghost" id="lairBtn">В Логово</button>`;
  $('#againBtn').onclick=()=>{battle=null;$('#battleStage').style.display='none';$('#arenaSetup').style.display='block';renderArenaPicker();renderAll();};
  $('#lairBtn').onclick=()=>{battle=null;$('#battleStage').style.display='none';$('#arenaSetup').style.display='block';switchView('lair');renderAll();};
  renderLedger(); persist();
}
