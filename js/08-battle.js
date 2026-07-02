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
      const lvl=Math.max(1,me.level+delta);
      const sp=weightedSpecies();
      const foeMorph=rollMorph();
      // множитель за риск: враг выше твоего уровня — щедрее, слабее — скромнее
      const riskMult = delta>0 ? 1.5 : (delta<0 ? 0.7 : 1.0);
      const reward=Math.round(lvl* (8+sp.rarity*4) * (morphById(foeMorph).id==='common'?1:1.2) * riskMult);
      const card=document.createElement('div');
      card.className='dcard';
      const riskTag = delta>0?'<span class="risk-tag hard">⚔️ Сильнее</span>':(delta<0?'<span class="risk-tag easy">Слабее</span>':'<span class="risk-tag even">Равный</span>');
      card.innerHTML=`
        <span class="lvlpill">ур.${lvl}</span>
        <span class="star">${'★'.repeat(sp.rarity)}</span>
        ${sigilHTML(sp,foeMorph,'sigil',lvl)}
        <div class="dname">Дикий ${sp.name}</div>
        ${elTag(sp.el)} ${morphBadge(foeMorph)}
        <div style="margin-top:6px">${riskTag}</div>
        <div class="dmeta" style="margin-top:6px;color:var(--gold)">Награда 🪙${reward}</div>`;
      card.onclick=()=>startBattle(me,{id:sp.id,level:lvl,morph:foeMorph},reward);
      foes.appendChild(card);
    });
    wrap.appendChild(foes);
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
  const fx = isFoe ? {critPct:0,manaMax:0,manaRegen:0,healPct:0,vampPct:0} : equipFx(d);
  const manaMax = ((sp.el==='storm'||sp.el==='shade') ? 8 : 6) + (fx.manaMax||0);
  return {uid:d.uid,ref:isFoe?null:d,sp,el:sp.el,morph:d.morph||'common',
    level:d.level,maxHp:st.maxHp,hp:isFoe?st.maxHp:d.curHp,
    atk:st.atk,def:st.def,spd:st.spd,isFoe,
    mana:2, manaMax,
    fx, // эффекты от артефактов: critPct, manaRegen, healPct, vampPct
    spell: topSpell? {n:topSpell.name, icon:topSpell.icon, pow:1.45, t:topSpell.desc, isSpell:true, manaCost:3} : null,
    ult: topUlt? {n:topUlt.name, icon:topUlt.icon, pow:2.4, t:topUlt.desc, isUlt:true, heal: topUlt.lvl===100, manaCost:6} : null,
    ultUsed:false};
}
const MANA_REGEN_BASIC=1; // мана за обычный удар
const MANA_REGEN_GUARD=2; // мана за защиту (защита копит ману)

function startBattle(myDragon,foeSpec,reward,bossDef){
  const foeDragon={id:foeSpec.id,level:foeSpec.level,xp:0,curHp:0,morph:foeSpec.morph||'common'};
  foeDragon.curHp=statsOf(foeDragon).maxHp;
  const foe=makeCombatant(foeDragon,true);
  if(bossDef){
    // усиление босса
    foe.maxHp=Math.round(foe.maxHp*bossDef.hpMult); foe.hp=foe.maxHp;
    foe.atk=Math.round(foe.atk*bossDef.atkMult);
    foe.isBoss=true;
  }
  battle={
    me:makeCombatant(myDragon,false),
    foe,
    reward, log:[], turn:0, over:false,
    boss:bossDef||null, bossHits:0, bossStalled:false
  };
  $('#arenaSetup').style.display='none';
  $('#battleStage').style.display='block';
  renderBattle();
  if(bossDef){
    pushLog(`<span class="gold">⚔️ ${bossDef.icon} <b>${bossDef.name}</b> восстаёт!</span> ${bossDef.lore}`);
  } else {
    pushLog(`<span class="gold">Бой начинается!</span> ${battle.me.sp.name} против дикого ${battle.foe.sp.name}.`);
  }
}

const MOVES = {
  fire:  [{n:'Огненный плевок',pow:1.0,t:'Базовый урон стихии огня'},{n:'Залп углей',pow:1.5,t:'Сильный удар, ×0.7 шанс попасть'}],
  frost: [{n:'Ледяной шип',pow:1.0,t:'Базовый урон стихии льда'},{n:'Метель',pow:1.5,t:'Сильный удар, ×0.7 шанс попасть'}],
  venom: [{n:'Кислотный укус',pow:1.0,t:'Базовый урон яда'},{n:'Споровая буря',pow:1.5,t:'Сильный удар, ×0.7 шанс попасть'}],
  storm: [{n:'Громовой разряд',pow:1.0,t:'Базовый урон бури'},{n:'Шторм молний',pow:1.5,t:'Сильный удар, ×0.7 шанс попасть'}],
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
    const base=b.me.atk*pow*0.7 - b.foe.def*0.6;
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
        <div class="mn">🛡️ ${GUARD.n}</div><div class="mv-meta"><span class="mv-heal">✚ защита +лечение</span> <span class="mana-gain">+${MANA_REGEN_GUARD}💧</span></div></button>
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
  if(ADVANTAGE[attEl]===defEl)return 1.4;
  if(ADVANTAGE[defEl]===attEl)return 0.7;
  return 1;
}

function doStrike(att,def,move,labelClass,accMult){
  accMult = accMult||1;
  // ультимативка и заклинания не промахиваются; сильные обычные приёмы — могут
  if(move.pow>=1.5 && !move.isUlt && !move.isSpell && Math.random()>0.7){
    pushLog(`<span>${att.sp.name} промахнулся «${move.n}».</span>`);
    return {dmg:0,miss:true};
  }
  const base = att.atk*move.pow*0.7 - def.def*0.6;
  let dmg = Math.max(1, Math.round(base * (rnd(85,115)/100)));
  dmg=Math.round(dmg*accMult); // бонус/штраф от мини-игры тайминга
  let mult=advMult(att.el,def.el);
  // босс: явная слабость из свитков (переопределяет стихийную таблицу)
  if(def.isBoss && battle && battle.boss){
    if(battle.boss.weakTo){ mult = att.el===battle.boss.weakTo ? 1.4 : Math.min(mult,1.0); }
    if(battle.bossStalled){ mult*=1.6; } // застывший босс беззащитен
  }
  dmg=Math.round(dmg*mult);
  if(def.guarding){dmg=Math.round(dmg*0.55);def.guarding=false;}
  const critChance = 0.06 + ((att.fx&&att.fx.critPct)||0)/100;
  const crit=(accMult>=2)|| Math.random()<critChance;
  if(crit && accMult<2)dmg=Math.round(dmg*1.6);
  def.hp-=dmg;
  let extra='';
  if(mult>1)extra=' <span class="gold">(стихия превосходит!)</span>';
  else if(mult<1)extra=' <span style="color:var(--ink-dim)">(стихия слаба)</span>';
  const label = move.isUlt?'⭐ применяет УЛЬТУ':(move.isSpell?'колдует':'применяет');
  pushLog(`${att.sp.name} ${label} <b>${move.n}</b> — <span class="dmg">${dmg} урона</span>${crit?' <span class="crit">КРИТ!</span>':''}${extra}`);
  // вампиризм от артефактов: лечит атакующего на % нанесённого урона
  const vamp=(att.fx&&att.fx.vampPct)||0;
  if(vamp>0 && dmg>0){const heal=Math.max(1,Math.round(dmg*vamp/100));att.hp=Math.min(att.maxHp,att.hp+heal);pushLog(`<span class="heal">🩸 ${att.sp.name} впитывает ${heal} жизни (вампиризм).</span>`);}
  // лечение от тени/поглощения и от лечащих ульт
  if(move.n==='Поглощение'){const heal=Math.round(dmg*0.4);att.hp=Math.min(att.maxHp,att.hp+heal);pushLog(`<span class="heal">${att.sp.name} впитывает ${heal} жизни.</span>`);}
  if(move.heal){const heal=Math.round(att.maxHp*0.5);att.hp=Math.min(att.maxHp,att.hp+heal);pushLog(`<span class="heal">${att.sp.name} исцеляется на ${heal}!</span>`);}
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
    b.me.guarding=true;
    b.me.mana=Math.min(b.me.manaMax, b.me.mana+MANA_REGEN_GUARD);
    const heal=Math.round(b.me.maxHp*0.08);
    b.me.hp=Math.min(b.me.maxHp,b.me.hp+heal);
    animate('me','cast');
    pushLog(`${b.me.sp.name} <b>встаёт в защиту</b> и восстанавливает <span class="heal">${heal}</span> жизни. <span class="mana-log">+${MANA_REGEN_GUARD}💧</span>`);
    afterPlayerMove();
    return;
  }
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
    resolvePlayerStrike(move, 1);
  }
}
// выполнить удар игрока с множителем точности из мини-игры
function resolvePlayerStrike(move, accMult){
  const b=battle;
  animate('me','cast');animate('foe','hit');
  const r=doStrike(b.me,b.foe,move,null,accMult);
  if(r.dmg&&r.mult>1)floatText('стихия!',ELEMENTS[b.me.el].color);
  afterPlayerMove();
}
function afterPlayerMove(){
  const b=battle;
  // эффекты артефактов игрока в конце его хода: лечение/ход и доп. реген маны
  const fx=b.me.fx||{};
  if(fx.healPct>0 && b.me.hp>0){
    const heal=Math.max(1,Math.round(b.me.maxHp*fx.healPct/100));
    b.me.hp=Math.min(b.me.maxHp,b.me.hp+heal);
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
        <button class="btn" id="timingHit">БЕЙ!</button>
        <button class="btn ghost" id="timingSkip">Пропустить</button>
      </div>
    </div>`;
  stage.appendChild(box);
  // позиции зон (в % ширины)
  const perfStart=46, perfEnd=54, goodStart=34, goodEnd=66;
  let pos=0, dir=1, raf=null, speed=1.7;
  const marker=box.querySelector('#timingMarker');
  function tick(){
    pos+=dir*speed;
    if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;}
    marker.style.left=pos+'%';
    raf=requestAnimationFrame(tick);
  }
  tick();
  function finish(accMult,label,color){
    cancelAnimationFrame(raf);
    box.remove();
    if(label) floatText(label,color);
    resolvePlayerStrike(move, accMult);
  }
  box.querySelector('#timingHit').onclick=()=>{
    if(pos>=perfStart&&pos<=perfEnd) finish(2.0,'⭐ ИДЕАЛЬНО!','#ffd24a');
    else if(pos>=goodStart&&pos<=goodEnd) finish(1.4,'✯ Точно!','#7fb24a');
    else finish(0.8,'промах…','#c5544a');
  };
  box.querySelector('#timingSkip').onclick=()=>finish(1.0,null,null);
}

/* ===== ДВОЙНАЯ МИНИ-ИГРА ДЛЯ УЛЬТЫ =====
   Два поля подряд. Активация только при попадании в обе области.
   Крит по центру каждой: обе в центр → сокрушительный ×2.25. */
function startUltMinigame(move){
  const stage=$('#battleStage'); if(!stage){resolvePlayerStrike(move,1.5);return;}
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
        <button class="btn" id="ultHit">ФОКУС!</button>
        <button class="btn ghost" id="ultSkip">Пропустить</button>
      </div>
    </div>`;
  stage.appendChild(box);
  const perfStart=45, perfEnd=55, goodStart=32, goodEnd=68;
  let phase=1; // 1 → бьём первую зону, 2 → вторую
  let pos=0, dir=1, raf=null, speed=2.0;
  let hit1=null; // 'crit' | 'good' | null(промах)
  const m1=box.querySelector('#ultMarker1'), m2=box.querySelector('#ultMarker2');
  function tick(){
    pos+=dir*speed;
    if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;}
    (phase===1?m1:m2).style.left=pos+'%';
    raf=requestAnimationFrame(tick);
  }
  tick();
  function zoneResult(){
    if(pos>=perfStart&&pos<=perfEnd) return 'crit';
    if(pos>=goodStart&&pos<=goodEnd) return 'good';
    return null;
  }
  function finishUlt(accMult,label,color){
    cancelAnimationFrame(raf);
    box.remove();
    if(label) floatText(label,color);
    resolvePlayerStrike(move, accMult);
  }
  box.querySelector('#ultHit').onclick=()=>{
    if(phase===1){
      hit1=zoneResult();
      // отметим результат первой зоны
      const badge=box.querySelector('#ultBadge1');
      badge.classList.add(hit1==='crit'?'ok-crit':(hit1==='good'?'ok':'miss'));
      m1.classList.add('locked');
      if(hit1===null){
        // промах по первой — ульта срывается, бьёт ослабленно, мана уже потрачена
        return finishUlt(0.6,'ульта сорвалась…','#c5544a');
      }
      phase=2; pos=0; dir=1;
    } else {
      const hit2=zoneResult();
      const badge=box.querySelector('#ultBadge2');
      badge.classList.add(hit2==='crit'?'ok-crit':(hit2==='good'?'ok':'miss'));
      if(hit2===null){
        return finishUlt(0.6,'вторая зона мимо…','#c5544a');
      }
      // обе зоны поражены → сила по сумме
      if(hit1==='crit'&&hit2==='crit') finishUlt(2.25,'💥 СОКРУШИТЕЛЬНО!','#ffd24a');
      else if(hit1==='crit'||hit2==='crit') finishUlt(1.9,'⭐ Мощно!','#ffd24a');
      else finishUlt(1.5,'✯ Ульта прошла!','#7fb24a');
    }
  };
  box.querySelector('#ultSkip').onclick=()=>finishUlt(1.0,null,null);
}

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
  // враг тоже владеет маной: копит на заклинание, тратит с умом
  const hpFrac=f.hp/f.maxHp;
  let move=null, isSpell=false;
  // 1) на грани — иногда защищается и копит ману
  if(hpFrac<0.22 && Math.random()<0.35 && !f.isBoss){
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
  if(f.mana>=foeSpellCost && Math.random()<0.5){
    f.mana-=foeSpellCost;
    move={...MOVES[f.el][0], n:'усиленный '+MOVES[f.el][0].n, pow:1.6};
    isSpell=true;
  } else {
    move = Math.random()<0.4?MOVES[f.el][1]:MOVES[f.el][0];
    f.mana=Math.min(f.manaMax,f.mana+MANA_REGEN_BASIC);
  }
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
  if(b.me.hp<=0){return endBattle(false);}
  $$('#moveBox .move').forEach(x=>x.disabled=false);
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

function endBattle(win){
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
    if(Math.random()<0.22){
      const maxR=Math.min(5, Math.max(1, Math.ceil(b.foe.level/3)+1));
      const art=weightedArtifact(maxR);
      addArtifact(art.id,1);
      artMsg=` Среди добычи — реликвия <b>${art.icon} ${art.name}</b>!`;
    }
    pushLog(`<span class="gold">Победа!</span> +${gold}🪙 · +${xp} опыта.${eggMsg}${artMsg}${leveled?' <span class="crit">Новый уровень!</span>':''}`);
    floatText('ПОБЕДА',' #d9a441');
    questEvent('win_arena');
    // === ПОБЕДА НАД ВЛАДЫКОЙ ===
    if(b.boss){
      const first=!bossDefeated(b.boss.id);
      if(!S.bossesDefeated)S.bossesDefeated={};
      S.bossesDefeated[b.boss.id]=true;
      if(first){
        // трофей-украшение (в каталоге DECORATIONS статически)
        if(!S.decorOwned)S.decorOwned=[];
        S.decorOwned.push(b.boss.trophy.id);
        // звезда владык — материал восхождения
        S.ascStars=(S.ascStars||0)+1;
        const bonus=Math.round(b.reward*1.5);
        S.gold+=bonus; S.dust+=50;
        pushLog(`<span class="gold">☠️ ${b.boss.icon} <b>${b.boss.name} повержен впервые!</b></span>`);
        pushLog(`🏆 Трофей «<b>${b.boss.trophy.name}</b>» — укрась им поселение! · ⭐ <b>Звезда владык</b> (для Восхождения) · +${bonus}🪙 +50✦`);
      } else {
        S.gold+=Math.round(b.reward*0.5); S.dust+=15;
        pushLog(`${b.boss.icon} ${b.boss.name} вновь пал. Слава и добыча: +${Math.round(b.reward*0.5)}🪙 +15✦`);
      }
    }
  } else {
    pushLog(`<span class="dmg">Ох!</span> ${dragonName(b.me.ref)} устал и сдался. Покорми его и дай отдохнуть в Логове — и снова в бой!`);
    floatText('УВЫ…','#c5544a');
  }
  const end=$('#battleEnd');
  // после боя — показать полную историю сражения
  const latest=$('#battleLatest');
  if(latest){
    latest.classList.add('battle-history');
    latest.innerHTML=`<div class="bh-title">📜 Ход сражения</div>`+b.log.map(l=>`<p>${l}</p>`).join('');
  }
  if(b.fromFlight && flight){
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
  end.innerHTML=`<button class="btn" id="againBtn">К арене</button>
    <button class="btn ghost" id="lairBtn">В Логово</button>`;
  $('#againBtn').onclick=()=>{battle=null;$('#battleStage').style.display='none';$('#arenaSetup').style.display='block';renderArenaPicker();renderAll();};
  $('#lairBtn').onclick=()=>{battle=null;$('#battleStage').style.display='none';$('#arenaSetup').style.display='block';switchView('lair');renderAll();};
  renderLedger(); persist();
}

