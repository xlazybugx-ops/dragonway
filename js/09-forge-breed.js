/* ============================================================
   09-forge-breed.js — КУЗНИЦА И СЕЛЕКЦИЯ: визуализация генома, Гнездилище (скрещивание), рендер кузницы, ковка
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ===== ГЕНОМ: ВИЗУАЛИЗАЦИЯ ===== */
// компактная полоска генов (для карточек)
function genomeBar(genes, compact){
  if(!genes) return '';
  const dots=GENE_KEYS.map(k=>{
    const v=genes[k]||0;
    const pips=Array.from({length:GENE_MAX},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('');
    return `<span class="gene" title="${GENE_LABEL[k]} ${v}/${GENE_MAX}"><b>${GENE_ICON[k]}</b><span class="pips">${pips}</span></span>`;
  }).join('');
  const score=genomeScore(genes);
  const spark=genes.spark?`<span class="gene-spark" title="Искра рода: +8% ко всем статам">✦</span>`:'';
  return `<div class="genome${compact?' compact':''}">${dots}${spark}
    <span class="gene-score" title="Чистота генома">${score}%</span></div>`;
}

/* ===== ГНЕЗДИЛИЩЕ РОДА (СКРЕЩИВАНИЕ) ===== */
function renderRoost(){
  const body=$('#roostBody');
  if(S.dragons.length<2){
    body.innerHTML=`<div class="empty">Для селекции нужно хотя бы два дракона одного вида. Высиди ещё яйца в Гнезде.</div>`;
    return;
  }
  const A=S.breedA?S.dragons.find(d=>d.uid===S.breedA):null;
  const B=S.breedB?S.dragons.find(d=>d.uid===S.breedB):null;
  const ready=canBreed(A,B);
  const sameSpeciesHint = A&&B&&A.id!==B.id;

  // прогноз: лучший из родителей по каждому гену
  let forecast='';
  if(A&&B){
    forecast=GENE_KEYS.map(k=>{
      const lo=Math.min(A.genes[k],B.genes[k]), hi=Math.max(A.genes[k],B.genes[k]);
      return `<div class="forge-stat"><span>${GENE_ICON[k]} ${GENE_LABEL[k]}</span><b>${lo===hi?lo:lo+'–'+hi} <span class="up">±мут.</span></b></div>`;
    }).join('');
  }

  body.innerHTML=`
    <div class="breed-stage">
      <div class="breed-parent" id="slotA">
        <div class="breed-slot-label">Родитель I</div>
        ${A?breedParentCard(A):'<div class="breed-empty">Выбери дракона ниже</div>'}
      </div>
      <div class="breed-mid">
        <div class="breed-cross">✕</div>
        <div class="breed-forecast">
          ${A&&B?`<div class="forge-sub">Прогноз потомка</div>${forecast}
             <div class="hint" style="margin-top:6px">Искра: ${A.genes.spark||B.genes.spark?'<b style="color:var(--gold)">вероятна</b>':'редкий шанс'}</div>`
            :'<div class="hint">Выбери двух родителей одного вида.</div>'}
        </div>
        <button class="btn" id="breedBtn" ${ready&&S.gold>=BREED_GOLD&&S.dust>=BREED_DUST?'':'disabled'}>
          Скрестить&nbsp;·&nbsp;🪙${BREED_GOLD} ✦${BREED_DUST}</button>
        ${sameSpeciesHint?'<p class="hint" style="color:var(--ember);text-align:center">Родители должны быть одного вида.</p>':''}
        ${ready&&(S.gold<BREED_GOLD||S.dust<BREED_DUST)?'<p class="hint" style="text-align:center">Не хватает золота или пыли.</p>':''}
      </div>
      <div class="breed-parent" id="slotB">
        <div class="breed-slot-label">Родитель II</div>
        ${B?breedParentCard(B):'<div class="breed-empty">Выбери дракона ниже</div>'}
      </div>
    </div>
    <h3 class="forge-sub" style="margin-top:18px">Стая <span class="dmeta">(нажми, чтобы назначить родителем)</span></h3>
    <div class="roster" id="roostRoster"></div>
    <p class="hint">Пыль ✦ добывается переработкой реликвий в Кузнице. Чем чище геном родителей, тем мощнее потомство — но мутации могут как улучшить, так и подпортить гены.</p>`;

  const rr=$('#roostRoster');
  S.dragons.forEach(d=>{
    const card=dragonCard(d,{onclick:dd=>assignBreed(dd)});
    if(d.uid===S.breedA||d.uid===S.breedB) card.classList.add('sel');
    // мини-геном на карточке
    const gw=document.createElement('div'); gw.innerHTML=genomeBar(d.genes,true);
    card.appendChild(gw.firstElementChild);
    rr.appendChild(card);
  });

  const bb=$('#breedBtn');
  if(bb) bb.onclick=()=>{
    const child=breedDragons(A,B);
    if(child){
      const perfect=isPerfect(child.genes);
      floatText(perfect?'✦ ИДЕАЛ ✦':'🥚 потомок','#d9a441');
      toast(`Вылупился потомок <b>${speciesById(child.id).name}</b> (поколение ${child.gen}) — чистота генома <b>${genomeScore(child.genes)}%</b>.${perfect?' <span style="color:var(--gold)">Это идеальный дракон!</span>':''}`);
      S.breedA=child.uid; S.breedB=null;
      renderAll(); renderRoost();
    }
  };
}
function breedParentCard(d){
  const sp=speciesById(d.id), st=statsOf(d);
  return `<div class="breed-card">
    ${sigilHTML(sp,d.morph,'sigil',d.level)}
    <div class="dname">${sp.name}</div>
    <div class="dmeta">ур.${d.level} · поколение ${d.gen||1}</div>
    ${genomeBar(d.genes)}
  </div>`;
}
function assignBreed(d){
  // назначаем в первый свободный слот; повторный клик снимает
  if(S.breedA===d.uid){S.breedA=null;}
  else if(S.breedB===d.uid){S.breedB=null;}
  else if(!S.breedA){S.breedA=d.uid;}
  else if(!S.breedB){S.breedB=d.uid;}
  else {S.breedB=d.uid;} // заменяем второго
  renderRoost();
}

/* ===== КУЗНИЦА И АРТЕФАКТЫ ===== */
function artChip(inst,{selectable,onclick,showWearer}={}){
  const art=artifactById(inst.id);
  const b=artifactBonus(inst);
  const wearer=showWearer?wearerOf(inst.invUid):null;
  const div=document.createElement('div');
  div.className='artcard'+(selectable&&S.forgeSel===inst.invUid?' sel':'');
  div.innerHTML=`
    <span class="art-lvl">+${inst.level}</span>
    <span class="art-star">${'★'.repeat(art.rarity)}</span>
    <div class="art-icon">${art.icon}</div>
    <div class="art-name">${art.name}</div>
    <div class="art-slot">${SLOT_ICON[art.slot]} ${SLOT_NAME[art.slot]} ${elTag(art.el)}</div>
    <div class="art-bonus">${artFullText(inst)}</div>
    ${wearer?`<div class="art-wearer">носит: ${speciesById(wearer.id).name}</div>`:''}`;
  if(onclick) div.onclick=()=>onclick(inst);
  return div;
}

function renderForge(){
  hintOnce('forge','Ковка усиливает артефакт за золото. Ненужные реликвии распыляй в ✦ пыль — она нужна для мутаций и селекции!');
  const body=$('#forgeBody');
  const noArt=!S.artifacts.length;
  // выбранный по умолчанию — первый (если есть артефакты)
  if(!noArt && (!S.forgeSel || !artInst(S.forgeSel))) S.forgeSel=S.artifacts[0].invUid;
  const inst=noArt?null:artInst(S.forgeSel);

  const fl=forgeLevel();
  const smithyHeader=`<div class="smithy-header">
    <div class="smithy-info">
      <span class="smithy-lvl">⚒️ Кузня ур. ${fl}/${SMITHY_MAX}</span>
      <span class="smithy-sub">Куёт до: ${SMITHY_RARITY_NAME[fl]} ${'★'.repeat(fl)}</span>
    </div>
    ${fl<SMITHY_MAX?`<button class="btn" id="smithyUpBtn">Улучшить кузню</button>`:'<span class="smithy-max">Мастерская мастеров ✦</span>'}
  </div>`;

  // артефактная часть (только если есть артефакты)
  let artLayout='';
  if(noArt){
    artLayout=`<div class="empty">Сундук реликвий пуст. Артефакты находят в странствиях, роняют враги, и они лежат в сундуках.</div>`;
  } else {
    const art=artifactById(inst.id);
    const curB=artifactBonus(inst);
    const atMax=inst.level>=FORGE_MAX;
    const nextB = atMax?null:artifactBonus({...inst,level:inst.level+1});
    const cost = atMax?0:forgeCost(art,inst.level);
    const dustCost = atMax?0:forgeDustCost(inst.level);
    const rarityLocked = !canForgeRarity(art.rarity);
    const canForge = !atMax && !rarityLocked && S.gold>=cost && S.dust>=dustCost;
    const wearer=wearerOf(inst.invUid);
    const diffRows=['atk','def','hp','spd'].filter(k=>curB[k]||(nextB&&nextB[k])).map(k=>{
      const lab={atk:'⚔️ Атака',def:'🛡️ Защита',hp:'❤️ Жизнь',spd:'💨 Прыть'}[k];
      const cur=curB[k]||0, nxt=nextB?(nextB[k]||0):cur;
      const cls=cur<0?'malus':'';
      return `<div class="forge-stat ${cls}"><span>${lab}</span><b>${cur>0?'+':''}${cur}${nxt!==cur?` <span class="up">→ ${nxt>0?'+':''}${nxt}</span>`:''}</b></div>`;
    }).join('');
    const curFx=artifactFx(inst), nextFx=atMax?null:artifactFx({...inst,level:inst.level+1});
    const fxRows=FX_KEYS.filter(k=>curFx[k]||(nextFx&&nextFx[k])).map(k=>{
      const cur=curFx[k]||0, nxt=nextFx?(nextFx[k]||0):cur;
      const cls=cur<0?'malus':'';
      return `<div class="forge-stat ${cls}"><span>${FX_ICON[k]} ${FX_LABEL[k]}</span><b>${cur>0?'+':''}${cur}${FX_SUFFIX[k]}${nxt!==cur?` <span class="up">→ ${nxt>0?'+':''}${nxt}${FX_SUFFIX[k]}</span>`:''}</b></div>`;
    }).join('');
    artLayout=`
    <div class="forge-layout">
      <div class="forge-anvil">
        <div class="anvil-art" id="anvilArt">
          <div class="anvil-glow"></div>
          <div class="art-icon-big">${art.icon}</div>
        </div>
        <div class="forge-title">${art.name} <span class="art-lvl-inline">+${inst.level}</span></div>
        <div class="art-slot" style="justify-content:center">${SLOT_ICON[art.slot]} ${SLOT_NAME[art.slot]} ${elTag(art.el)} <span class="art-star">${RARITY_STAR(art.rarity)}</span></div>
        <p class="lede" style="text-align:center;margin:10px 0">${art.lore}</p>
        <div class="forge-stats">${diffRows}${fxRows}</div>
        ${wearer?`<div class="hint" style="text-align:center">Сейчас носит: <b>${speciesById(wearer.id).name}</b></div>`:''}
        <div class="btnrow" style="justify-content:center">
          ${atMax
            ? `<button class="btn" disabled>Выкован до предела (+${FORGE_MAX})</button>`
            : rarityLocked
              ? `<button class="btn" disabled>🔒 Нужна кузня ур.${art.rarity}</button>`
              : `<button class="btn" id="forgeBtn" ${canForge?'':'disabled'}>Ковать&nbsp;·&nbsp;🪙${cost}${dustCost?`&nbsp;+&nbsp;✦${dustCost}`:''}</button>`}
          <button class="btn ghost" id="recycleBtn">Распылить&nbsp;·&nbsp;+${recycleYield(inst)}✦</button>
        </div>
        ${rarityLocked?`<p class="hint" style="text-align:center;color:#e08a7a">Кузня ур.${forgeLevel()} куёт только до ${SMITHY_RARITY_NAME[forgeLevel()]} (${'★'.repeat(forgeLevel())}). Улучши кузню, чтобы ковать ${SMITHY_RARITY_NAME[art.rarity]}.</p>`:''}
        ${!atMax&&!canForge&&!rarityLocked?`<p class="hint" style="text-align:center">Не хватает ресурсов: нужно ${cost}🪙${dustCost?` + ${dustCost}✦`:''}</p>`:''}
        <p class="hint" style="text-align:center">Распыление обращает реликвию в ✦ пыль для селекции драконов.</p>
      </div>
      <div class="forge-stock">
        <h3 class="forge-sub">Сундук реликвий <span class="dmeta">(${S.artifacts.length})</span></h3>
        <div class="carousel">
          <button class="carousel-arrow prev" id="artPrev" aria-label="Назад">‹</button>
          <div class="carousel-track" id="artGrid"></div>
          <button class="carousel-arrow next" id="artNext" aria-label="Вперёд">›</button>
        </div>
        <p class="hint">Выбери реликвию, чтобы рассмотреть, ковать или распылить. Надеть артефакт на дракона можно в его свитке в Логове.</p>
      </div>
    </div>`;
  }

  body.innerHTML=`
    ${smithyHeader}
    ${artLayout}`;

  if(!noArt){
    const grid=$('#artGrid');
    S.artifacts.forEach(a=>{
      const chip=artChip(a,{selectable:true,showWearer:true,onclick:i=>{S.forgeSel=i.invUid;renderForge();}});
      chip.classList.add('carousel-card');
      if(a.invUid===S.forgeSel) chip.classList.add('sel');
      grid.appendChild(chip);
    });
    const ap=$('#artPrev'), an=$('#artNext');
    if(ap&&an){
      const amt=()=>Math.max(grid.clientWidth*0.8,180);
      ap.onclick=()=>grid.scrollBy({left:-amt(),behavior:'smooth'});
      an.onclick=()=>grid.scrollBy({left:amt(),behavior:'smooth'});
      const upd=()=>{ap.classList.toggle('hidden',grid.scrollLeft<=4);an.classList.toggle('hidden',grid.scrollLeft+grid.clientWidth>=grid.scrollWidth-4);};
      grid.addEventListener('scroll',upd,{passive:true}); setTimeout(upd,50);
      const selCard=[...grid.children].find(c=>c.classList.contains('sel'));
      if(selCard) setTimeout(()=>selCard.scrollIntoView({inline:'center',block:'nearest'}),30);
    }
    const fb=$('#forgeBtn');
    if(fb) fb.onclick=()=>doForge(inst);
    const rb=$('#recycleBtn');
    if(rb) rb.onclick=()=>recycleArtifact(inst.invUid);
  }
  const sb=$('#smithyUpBtn');
  if(sb) sb.onclick=openSmithyUpgrade;
}

// экран улучшения кузни
function openSmithyUpgrade(){
  const lvl=forgeLevel();
  if(lvl>=SMITHY_MAX) return;
  const cost=smithyCost(lvl);
  const canPay=S.gold>=cost.gold && S.dust>=cost.dust;
  const body=$('#forgeBody');
  body.innerHTML=`<div class="panel" style="margin:0">
    <h2>⚒️ Улучшение кузни</h2>
    <p class="lede">Кузня ур. ${lvl} → <b>${lvl+1}</b></p>
    <p>Позволит ковать <b>${SMITHY_RARITY_NAME[lvl+1]}</b> артефакты (${'★'.repeat(lvl+1)}) — их сила раскроется полностью.</p>
    <div class="portal-cost">Стоимость: <b>🪙 ${cost.gold}</b> + <b>✦ ${cost.dust}</b></div>
    <div class="btnrow" style="margin-top:14px">
      <button class="btn" id="doSmithyUp" ${canPay?'':'disabled'}>${canPay?'Улучшить кузню':'Недостаёт ресурсов'}</button>
      <button class="btn ghost" id="smithyBack">← Назад</button>
    </div>
    ${!canPay?`<p class="hint" style="text-align:center;color:#e08a7a">Нужно ${cost.gold}🪙 и ${cost.dust}✦</p>`:''}
  </div>`;
  $('#smithyBack').onclick=renderForge;
  if(canPay) $('#doSmithyUp').onclick=()=>{
    S.gold-=cost.gold; S.dust-=cost.dust;
    trackEconomy('sink','smithy_upgrade',{gold:-cost.gold,dust:-cost.dust});
    S.forgeLevel=lvl+1;
    persist(); renderLedger();
    toast(`<b>Кузня улучшена до ур.${S.forgeLevel}!</b> Теперь куёт ${SMITHY_RARITY_NAME[S.forgeLevel]} артефакты ${'★'.repeat(S.forgeLevel)}.`);
    renderForge();
  };
}

function doForge(inst){
  const art=artifactById(inst.id);
  if(inst.level>=FORGE_MAX) return;
  if(!canForgeRarity(art.rarity)){
    toast(`Кузня ур.${forgeLevel()} не может ковать ${SMITHY_RARITY_NAME[art.rarity]} артефакты (${'★'.repeat(art.rarity)}). Улучши кузню!`);
    return;
  }
  const cost=forgeCost(art,inst.level);
  const dustCost=forgeDustCost(inst.level);
  if(S.gold<cost){toast('Недостаёт золота для ковки.');return;}
  if(dustCost>0 && S.dust<dustCost){toast(`Для этой ковки нужно ещё ${dustCost}✦ пыли.`);return;}
  const apply=(quality)=>{
    S.gold-=cost;
    if(dustCost>0) S.dust-=dustCost;
    trackEconomy('sink','artifact_forge',{gold:-cost,dust:-dustCost});
    let bonusTxt='';
    if(quality==='perfect'){ // мастерская ковка: возврат четверти золота
      const back=Math.round(cost*0.25);
      S.gold+=back; bonusTxt=` <span style="color:var(--gold)">🔥 Мастерская ковка! Возврат ${back}🪙</span>`;
    }
    inst.level++;
    const anvil=$('#anvilArt');
    if(anvil){anvil.classList.remove('forging');void anvil.offsetWidth;anvil.classList.add('forging');}
    floatText('+1 ковка',art && ELEMENTS[art.el]?ELEMENTS[art.el].color:'#d9a441');
    toast(`<b>${art.name}</b> выкован до +${inst.level}!${bonusTxt} ${inst.level>=FORGE_MAX?'Достигнут предел.':''}`);
    questEvent('forge'); persist();
    renderLedger();renderForge();renderLair();
  };
  if(typeof arcadeEnabled==='function'&&arcadeEnabled()) startForgeHeat(apply);
  else apply('good');
}

/* ===== МИНИ-ИГРА: ЖАР ГОРНА =====
   Ударь молотом, когда стрелка в раскалённой зоне. Идеально — возврат золота. */
function startForgeHeat(done){
  const box=document.createElement('div');
  box.className='rhythm-overlay';
  box.innerHTML=`<div class="enc-card">
    <div class="enc-icon">🔨</div>
    <div class="enc-name">Жар горна</div>
    <div class="enc-sub">Бей молотом, когда стрелка в раскалённой середине!</div>
    <div class="timing-bar forge-bar">
      <div class="timing-zone good" style="left:30%;width:40%"></div>
      <div class="timing-zone perfect" style="left:45%;width:10%"></div>
      <div class="timing-marker" id="fhMarker"></div>
    </div>
    <button id="fhHit">⚒️ КУЙ!</button>
    <button class="ghost" id="fhSkip">Ковать спокойно</button>
  </div>`;
  document.body.appendChild(box);
  let pos=0,dir=1,raf=0;const speed=1.9;
  const m=box.querySelector('#fhMarker');
  function tick(){pos+=dir*speed;if(pos>=100){pos=100;dir=-1;}if(pos<=0){pos=0;dir=1;}
    m.style.left=pos+'%';raf=requestAnimationFrame(tick);}
  tick();
  function finish(q,txt,col){cancelAnimationFrame(raf);box.remove();if(txt)floatText(txt,col);done(q);}
  box.querySelector('#fhHit').onclick=()=>{
    if(pos>=45&&pos<=55)finish('perfect','🔥 ИДЕАЛЬНО!','#ffd24a');
    else if(pos>=30&&pos<=70)finish('good','✯ Хороший удар!','#7fb24a');
    else finish('good','дзынь…','#c5544a');
  };
  box.querySelector('#fhSkip').onclick=()=>finish('good',null,null);
}

/* экипировка артефакта на дракона */
function equipArtifact(d, invUid){
  const inst=artInst(invUid); if(!inst) return;
  const art=artifactById(inst.id);
  d.equip=d.equip||{};
  // снять у прежнего владельца
  const prev=wearerOf(invUid);
  if(prev && prev!==d){ for(const s in prev.equip){ if(prev.equip[s]===invUid) delete prev.equip[s]; } }
  d.equip[art.slot]=invUid;
  // здоровье не превышает новый максимум
  d.curHp=Math.min(d.curHp,statsOf(d).maxHp);
  renderLair();persist();
}
function unequipArtifact(d, slot){
  if(d.equip){ delete d.equip[slot]; d.curHp=Math.min(d.curHp,statsOf(d).maxHp); }
  renderLair();persist();
}
