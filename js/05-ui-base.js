/* ============================================================
   05-ui-base.js — БАЗОВЫЙ UI: полоса ресурсов, карточки драконов, Логово, экипировка, Гнездо (карусель яиц)
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ======================= РЕНДЕР ======================= */
function renderLedger(){
  $('#gold').textContent=S.gold;
  $('#eggs').textContent=eggCount();
  $('#count').textContent=S.dragons.length;
  $('#dust').textContent=S.dust;
  const pl=$('#tbPlace'); if(pl) pl.textContent=S.settlement||'Драконьи Земли';
}

function elTag(el){const e=ELEMENTS[el];return `<span class="elem-tag ${e.cls}">${e.name}</span>`;}

// окрашенный рисованный дракон согласно морфу
function sigilHTML(sp, morphId, cls, level){
  const m=morphById(morphId);
  const sh=m.shiny?' shiny':'';
  return `<div class="${cls} dragon-wrap${sh}" style="filter:${m.filter||'none'}">${dragonVisual(sp.id, level)}</div>`;
}
function morphBadge(morphId){
  const m=morphById(morphId);
  if(m.id==='common') return '';
  return `<span class="morph-pill"${m.shiny?' data-shiny="1"':''}><i style="background:${m.swatch}"></i>${m.name}</span>`;
}

function dragonCard(d,{selectable,onclick}={}){
  const sp=speciesById(d.id), st=statsOf(d);
  const hpPct=Math.max(0,Math.round(d.curHp/st.maxHp*100));
  const div=document.createElement('div');
  div.className='dcard'+(selectable&&S.sel===d.uid?' sel':'');
  div.innerHTML=`
    <span class="lvlpill">ур.${d.level}</span>
    <span class="star">${'★'.repeat(sp.rarity)}</span>
    ${sigilHTML(sp, d.morph, 'sigil', d.level)}
    <div class="dname">${dragonName(d)}</div>
    ${d.name?`<div class="dmeta dspecies">${sp.name}</div>`:''}
    ${elTag(sp.el)} ${morphBadge(d.morph)}
    <div class="bar hp" style="margin-top:8px"><i style="width:${hpPct}%"></i></div>
    <div class="dmeta">${d.curHp}/${st.maxHp} жизни · ${'💖'.repeat(d.happy||0)||'🤍'}</div>`;
  if(onclick) div.onclick=()=>onclick(d);
  return div;
}

function lairSorted(){
  const mode=S.lairSort||'level-desc';
  const arr=[...S.dragons];
  const byName=(a,b)=>dragonName(a).localeCompare(dragonName(b),'ru');
  if(mode==='level-desc') arr.sort((a,b)=>b.level-a.level || byName(a,b));
  else if(mode==='level-asc') arr.sort((a,b)=>a.level-b.level || byName(a,b));
  else if(mode==='rarity') arr.sort((a,b)=>(speciesById(b.id).rarity-speciesById(a.id).rarity) || b.level-a.level);
  else if(mode==='name') arr.sort(byName);
  return arr;
}

function renderLair(){
  if(typeof renderDaily==='function' && $('#dailyPanel')) renderDaily();
  const wrap=$('#lairRoster'); wrap.innerHTML='';
  if(!S.dragons.length){wrap.innerHTML='<div class="empty">Логово пустует. Высиди яйцо в Гнезде, чтобы обрести первого дракона.</div>';$('#detailPanel').style.display='none';return;}
  const sorted=lairSorted();
  // панель сортировки
  const sortBar=document.createElement('div'); sortBar.className='lair-sort';
  const mode=S.lairSort||'level-desc';
  sortBar.innerHTML=`<span class="lair-sort-label">Сортировка:</span>
    <select id="lairSortSel" class="lair-sort-sel">
      <option value="level-desc"${mode==='level-desc'?' selected':''}>По уровню ↓</option>
      <option value="level-asc"${mode==='level-asc'?' selected':''}>По уровню ↑</option>
      <option value="rarity"${mode==='rarity'?' selected':''}>По редкости</option>
      <option value="name"${mode==='name'?' selected':''}>По имени</option>
    </select>
    <span class="lair-count">🐉 ${S.dragons.length}</span>`;
  wrap.appendChild(sortBar);
  // карусель: стрелки + горизонтальная лента карточек
  const car=document.createElement('div'); car.className='carousel';
  const prev=document.createElement('button'); prev.className='carousel-arrow prev'; prev.innerHTML='‹'; prev.setAttribute('aria-label','Назад');
  const next=document.createElement('button'); next.className='carousel-arrow next'; next.innerHTML='›'; next.setAttribute('aria-label','Вперёд');
  const track=document.createElement('div'); track.className='carousel-track'; track.id='lairTrack';
  sorted.forEach(d=>{
    const card=dragonCard(d,{selectable:true,onclick:selectDragon});
    card.classList.add('carousel-card');
    card.dataset.uid=d.uid;
    track.appendChild(card);
  });
  car.appendChild(prev); car.appendChild(track); car.appendChild(next);
  wrap.appendChild(car);
  // обработчик сортировки
  $('#lairSortSel').onchange=(e)=>{ S.lairSort=e.target.value; persist(); renderLair(); };
  // прокрутка стрелками на ширину видимой области
  const scrollAmt=()=>Math.max(track.clientWidth*0.8, 200);
  prev.onclick=()=>track.scrollBy({left:-scrollAmt(),behavior:'smooth'});
  next.onclick=()=>track.scrollBy({left: scrollAmt(),behavior:'smooth'});
  // прятать стрелки на краях
  const updateArrows=()=>{
    prev.classList.toggle('hidden', track.scrollLeft<=4);
    next.classList.toggle('hidden', track.scrollLeft+track.clientWidth>=track.scrollWidth-4);
  };
  track.addEventListener('scroll', updateArrows, {passive:true});
  setTimeout(updateArrows, 50);
  // прокрутить к выбранному дракону
  if(S.sel){
    const c=[...track.children].find(ch=>ch.dataset.uid===S.sel);
    if(c) setTimeout(()=>{ c.scrollIntoView({inline:'center',block:'nearest',behavior:'auto'}); updateArrows(); },0);
  }
  if(S.sel && S.dragons.some(d=>d.uid===S.sel)) renderDetail(S.dragons.find(d=>d.uid===S.sel));
  else $('#detailPanel').style.display='none';
}

function selectDragon(d){
  S.sel=d.uid;
  // обновляем подсветку карточек без пересборки карусели (чтобы не сбивать прокрутку)
  const track=$('#lairTrack');
  if(track){
    [...track.children].forEach(c=>c.classList.toggle('sel', c.dataset.uid===d.uid));
    renderDetail(d);
  } else {
    renderLair();
  }
}

function renderDetail(d){
  const sp=speciesById(d.id), st=statsOf(d);
  const need=xpToNext(d.level);
  const xpPct=Math.round(d.xp/need*100);
  const hpPct=Math.round(d.curHp/st.maxHp*100);
  const adv=ELEMENTS[ADVANTAGE[sp.el]].name;
  const m=morphById(d.morph);
  const morphLine = m.id==='common'
    ? '<span style="color:var(--ink-dim)">Окрас: обычный.</span>'
    : `<span style="color:var(--ink-dim)">Окрас: <b style="color:${m.swatch}">${m.name}</b> (${m.gloss||''})${m.shiny?' ✨':''}.</span>`;
  const modBits=Object.entries(m.mods||{}).map(([k,v])=>{
    const lab={hp:'жизнь',atk:'атака',def:'защита',spd:'прыть'}[k];
    return `+${v} ${lab}`;
  }).join(', ');
  const p=$('#detailPanel'); p.style.display='block';
  p.innerHTML=`
    <div class="detail">
      <div>
        ${sigilHTML(sp, d.morph, 'bigsigil', d.level)}
        <div style="text-align:center">${elTag(sp.el)}</div>
        <div style="text-align:center;margin-top:6px">${morphBadge(d.morph)||'<span class="morph-pill plain"><i style="background:#9c8b6a"></i>Обычный</span>'}</div>
        <div style="text-align:center;color:var(--gold);font-family:Cinzel;font-size:13px;margin-top:6px">${RARITY_STAR(sp.rarity)}</div>
      </div>
      <div>
        <h2 style="margin-bottom:2px">${dragonName(d)}
          <button class="rename-btn" id="renameBtn" title="Дать имя">✏️</button>
          <span style="color:var(--ink-dim);font-size:13px;font-family:Spectral">· ур. ${d.level}</span>
        </h2>
        <div class="care-row">
          <span class="happy-hearts" title="Настроение">${'💖'.repeat(d.happy||0)}${'🤍'.repeat(HAPPY_MAX-(d.happy||0))}</span>
          <button class="btn care-btn" id="feedBtn">🍖 Покормить · 🪙${FOOD_COST}</button>
          <button class="btn care-btn" id="petBtn">💖 Погладить</button>
        </div>
        <p class="lede" style="margin-bottom:10px">${d.name?`<b>${d.name}</b> — это ${sp.name.toLowerCase()}. `:''}${sp.lore} <br>${morphLine}${modBits?` <span style="color:var(--gold)">(${modBits})</span>`:''}<br><span style="color:var(--ink-dim)">Сильнее против стихии: <b style="color:${ELEMENTS[ADVANTAGE[sp.el]].color}">${adv}</b>.</span></p>
        <div class="statline"><span>Жизнь</span><b>${d.curHp} / ${st.maxHp}</b></div>
        <div class="bar hp"><i style="width:${hpPct}%"></i></div>
        <div class="statline"><span>Опыт</span><b>${d.xp} / ${need}</b></div>
        <div class="bar xp"><i style="width:${xpPct}%"></i></div>
        <div class="statline" style="margin-top:12px">
          <span>⚔️ Атака <b>${st.atk}</b></span>
          <span>🛡️ Защита <b>${st.def}</b></span>
          <span>💨 Прыть <b>${st.spd}</b></span>
        </div>
        <div class="traits">${sp.traits.map(t=>`<span class="trait">${t}</span>`).join('')}</div>
        <div class="equip-block">
          <div class="equip-head">Реликвии ${equipBonus(d).atk||equipBonus(d).def||equipBonus(d).hp||equipBonus(d).spd?`<span class="equip-sum">${bonusText(equipBonus(d))}</span>`:''}</div>
          <div class="equip-slots">${['weapon','armor','charm'].map(slot=>{
            const invUid=d.equip&&d.equip[slot];
            const inst=invUid?artInst(invUid):null;
            if(inst){
              const art=artifactById(inst.id);
              return `<div class="eslot filled" data-slot="${slot}" title="${art.name} +${inst.level}">
                <div class="eslot-ic">${art.icon}</div>
                <div class="eslot-lvl">+${inst.level}</div>
                <button class="eslot-x" data-unequip="${slot}" title="Снять">✕</button></div>`;
            }
            return `<div class="eslot empty" data-slot="${slot}" title="${SLOT_NAME[slot]}">
              <div class="eslot-ic">${SLOT_ICON[slot]}</div><div class="eslot-lbl">${SLOT_NAME[slot]}</div></div>`;
          }).join('')}</div>
          <div id="equipPicker"></div>
        </div>
        <div class="gene-block">
          <div class="nature-line">
            <span class="nature-badge">${natureById(d.nature).icon} ${natureById(d.nature).name}</span>
            <span class="nature-desc">${natureById(d.nature).desc}${natureById(d.nature).up?` (${GENE_ICON[natureById(d.nature).up]}+ / ${GENE_ICON[natureById(d.nature).down]}−)`:''}</span>
          </div>
          <details class="gene-details">
            <summary class="gene-summary">
              <span>🧬 Геном <span class="gene-gen">поколение ${d.gen||1}</span></span>
              <span class="equip-sum">бюджет ${geneSum(d.genes)}/${GENE_BUDGET_MAX}${d.genes.spark?' · ✦':''}${isPerfect(d.genes)?' <b style="color:var(--gold)">ИДЕАЛ</b>':''}</span>
            </summary>
            <div class="gene-hint-mut">Мутация усиливает выбранный стат ценой другого. Изредка — растит общий бюджет.</div>
            <div class="gene-rows">
              ${GENE_KEYS.map(k=>{
                const v=d.genes[k]||0;
                const pips=Array.from({length:GENE_MAX},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('');
                const mcost=mutateCost(d);
                return `<div class="gene-row">
                  <span class="gene-name">${GENE_ICON[k]} ${GENE_LABEL[k]}</span>
                  <span class="pips big">${pips}</span>
                  <span class="gene-val">${v}/${GENE_MAX}</span>
                  <button class="gene-mut" data-mut="${k}" ${S.dust<mcost||v>=GENE_MAX?'disabled':''} title="Усилить ${GENE_LABEL[k]} за ${mcost} пыли (ценой другого стата)">⟳ ${mcost}✦</button>
                </div>`;
              }).join('')}
            </div>
            <div class="gene-foot">
              ${d.genes.spark
                ? '<span class="gene-spark-line">✦ Искра рода горит — +8% ко всем статам</span>'
                : `<button class="btn ghost gene-spark-btn" id="sparkBtn" ${S.dust<SPARK_DUST?'disabled':''}>Зажечь искру&nbsp;·&nbsp;${SPARK_DUST}✦</button>`}
              <button class="btn ghost" id="toRoostBtn">В Гнездилище →</button>
            </div>
          </details>
        </div>
        <div class="btnrow">
          <button class="btn ghost" id="restBtn" ${d.curHp>=st.maxHp?'disabled':''}>Отдых&nbsp;·&nbsp;🪙${restCost(d)}</button>
          <button class="btn ghost" id="toArenaBtn">На турнир →</button>
          <button class="btn ghost" id="toSpireBtn">🗼 Шпиль${pendingForks(d).length?` <span class="spire-badge">${pendingForks(d).length}</span>`:''}</button>
        </div>
        ${S.dragons.length>1?`<div class="release-row"><button class="btn ghost release-btn" id="releaseBtn">Отпустить на волю 🕊️</button></div>`:''}
        <p class="hint">Уровень растёт в боях и странствиях. В 🗼 Шпиле дракон открывает заклинания и таланты — у каждого свой путь!</p>
      </div>
    </div>`;
  $('#restBtn').onclick=()=>restDragon(d);
  $('#toArenaBtn').onclick=()=>{S.arenaPick=d.uid;switchView('arena');};
  $('#toRoostBtn').onclick=()=>{S.breedA=d.uid;switchView('roost');};
  $('#renameBtn').onclick=()=>renameDragon(d);
  $('#feedBtn').onclick=()=>feedDragon(d);
  $('#petBtn').onclick=()=>petDragon(d);
  $('#toSpireBtn').onclick=()=>{S.sel=d.uid;spireTab='tree';switchView('spire');};
  const relb=$('#releaseBtn'); if(relb) relb.onclick=()=>confirmReleaseOne(d);
  const sb=$('#sparkBtn'); if(sb) sb.onclick=()=>igniteSpark(d);
  p.querySelectorAll('[data-mut]').forEach(btn=>btn.onclick=()=>mutateGene(d, btn.dataset.mut));
  // снятие
  p.querySelectorAll('[data-unequip]').forEach(btn=>btn.onclick=e=>{
    e.stopPropagation(); unequipArtifact(d, btn.dataset.unequip);
  });
  // открыть выбор артефакта для гнезда
  p.querySelectorAll('.eslot').forEach(el=>el.onclick=e=>{
    if(e.target.closest('[data-unequip]'))return;
    openEquipPicker(d, el.dataset.slot);
  });
}

// показать список доступных артефактов нужного типа
function openEquipPicker(d, slot){
  const box=$('#equipPicker'); if(!box) return;
  const options=S.artifacts.filter(a=>artifactById(a.id).slot===slot);
  const equippedHere = d.equip&&d.equip[slot];
  if(!options.length){
    box.innerHTML=`<div class="equip-picker"><p class="hint" style="margin:0">Нет реликвий типа «${SLOT_NAME[slot]}». Ищи их в странствиях и боях.</p></div>`;
    return;
  }
  box.innerHTML=`<div class="equip-picker">
    <div class="equip-picker-head">Выбери ${SLOT_NAME[slot].toLowerCase()}:</div>
    <div class="carousel">
      <button class="carousel-arrow prev" id="pickPrev" aria-label="Назад">‹</button>
      <div class="carousel-track" id="pickGrid"></div>
      <button class="carousel-arrow next" id="pickNext" aria-label="Вперёд">›</button>
    </div>
  </div>`;
  const grid=$('#pickGrid');
  options.forEach(a=>{
    const chip=artChip(a,{showWearer:true,onclick:i=>{equipArtifact(d,i.invUid);}});
    chip.classList.add('carousel-card');
    if(equippedHere===a.invUid) chip.classList.add('sel');
    grid.appendChild(chip);
  });
  const pp=$('#pickPrev'), pn=$('#pickNext');
  if(pp&&pn){
    const amt=()=>Math.max(grid.clientWidth*0.8,180);
    pp.onclick=()=>grid.scrollBy({left:-amt(),behavior:'smooth'});
    pn.onclick=()=>grid.scrollBy({left:amt(),behavior:'smooth'});
    const upd=()=>{pp.classList.toggle('hidden',grid.scrollLeft<=4);pn.classList.toggle('hidden',grid.scrollLeft+grid.clientWidth>=grid.scrollWidth-4);};
    grid.addEventListener('scroll',upd,{passive:true}); setTimeout(upd,50);
  }
}

function restCost(d){const st=statsOf(d);const missing=st.maxHp-d.curHp;return Math.max(5,Math.ceil(missing*1.2));}
function restDragon(d){
  const cost=restCost(d);
  if(S.gold<cost){toast('Недостаёт золота на лекарей.');return;}
  S.gold-=cost; d.curHp=statsOf(d).maxHp;
  toast(`<b>${speciesById(d.id).name}</b> полностью восстановлен.`);
  renderLedger();renderLair();persist();
}

/* ===== ГНЕЗДО ===== */
/* ===== ГНЕЗДО: карусель яиц-ям ===== */
// отдельный дизайн яйца для каждой стихии (SVG)
function eggSVG(el, tier){
  const c=EGG_COLORS[el]||EGG_COLORS.fire;
  const spots = el==='shade'
    ? `<circle cx="46" cy="52" r="4" fill="${c.spot}" opacity=".8"/><circle cx="60" cy="70" r="3" fill="${c.spot}" opacity=".7"/><circle cx="52" cy="86" r="3.5" fill="${c.spot}" opacity=".7"/>`
    : `<ellipse cx="44" cy="54" rx="4" ry="5" fill="${c.spot}" opacity=".75"/><ellipse cx="62" cy="66" rx="3.5" ry="4.5" fill="${c.spot}" opacity=".7"/><ellipse cx="50" cy="82" rx="4" ry="5" fill="${c.spot}" opacity=".7"/><ellipse cx="66" cy="86" rx="3" ry="4" fill="${c.spot}" opacity=".6"/>`;
  // тир-корона: чем глубже биом, тем «богаче» яйцо (сияние)
  const glow = tier>=3 ? `<ellipse cx="54" cy="64" rx="40" ry="46" fill="${c.light}" opacity=".18"/>` : (tier===2?`<ellipse cx="54" cy="64" rx="36" ry="42" fill="${c.light}" opacity=".1"/>`:'');
  return `<svg viewBox="0 0 108 128" xmlns="http://www.w3.org/2000/svg">
    ${glow}
    <defs><radialGradient id="eg${el}${tier}" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="${c.light}"/><stop offset="60%" stop-color="${c.base}"/><stop offset="100%" stop-color="${c.dark}"/>
    </radialGradient></defs>
    <ellipse cx="54" cy="64" rx="34" ry="44" fill="url(#eg${el}${tier})" stroke="${c.dark}" stroke-width="2"/>
    <ellipse cx="44" cy="44" rx="10" ry="14" fill="#fff" opacity=".22"/>
    ${spots}
    ${tier>=3?`<path d="M54 20 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 Z" fill="${c.light}" opacity=".9"/>`:''}
  </svg>`;
}
const EGG_COLORS={
  fire:  {base:'#c0392b', dark:'#7a1e12', light:'#ff9a6b', spot:'#5a1408'},
  frost: {base:'#5aa0c8', dark:'#2c5f80', light:'#bfe6ff', spot:'#1e4258'},
  venom: {base:'#6ba83a', dark:'#3d6420', light:'#c5e88a', spot:'#2a4514'},
  storm: {base:'#8a6fc8', dark:'#4e3a80', light:'#c9b8ff', spot:'#33245a'},
  shade: {base:'#5a4a6e', dark:'#2e2440', light:'#a890c8', spot:'#1a1428'},
};

let hatchSel=0; // индекс выбранного яйца в карусели
function renderHatch(){
  const wrap=$('#hatchWrap'); if(!wrap) return;
  const eggs=eggsArray();
  if(!eggs.length){
    wrap.innerHTML=`<div class="nest-empty">
      <div class="nest-empty-art">🪹</div>
      <p class="hint">Гнездо пусто. Отправляйся в <b>Странствия</b> — там, в биомах разных миров, находят драконьи яйца. Стихия биома определяет, чьё яйцо ты найдёшь.</p>
    </div>`;
    return;
  }
  if(hatchSel>=eggs.length) hatchSel=eggs.length-1;
  if(hatchSel<0) hatchSel=0;
  const cards=eggs.map((egg,i)=>{
    const el=ELEMENTS[egg.el];
    return `<div class="carousel-card egg-card" data-idx="${i}">
      <div class="egg-pit">
        <div class="egg-visual" id="eggVis${i}">${eggSVG(egg.el, egg.tier)}</div>
      </div>
      <div class="egg-info">
        <div class="egg-el">${el.name}</div>
        <div class="egg-tier">${BIOME_TIERLABEL[egg.tier||1].split(' · ')[1]||'Поверхность'}</div>
      </div>
      <button class="btn hatch-one" data-hatch="${i}">Высидеть 🥚</button>
    </div>`;
  }).join('');
  wrap.innerHTML=`
    <div class="nest-count">В гнезде яиц: <b>${eggs.length}</b></div>
    <div class="carousel">
      <button class="carousel-arrow" id="eggPrev">‹</button>
      <div class="carousel-track" id="eggTrack">${cards}</div>
      <button class="carousel-arrow" id="eggNext">›</button>
    </div>
    <p class="hint" style="text-align:center;margin-top:10px">Из яйца дракон рождается в случайном окрасе и с уникальным характером. Глубокие биомы дарят редкие виды.</p>`;
  const track=$('#eggTrack');
  const scrollTo=i=>{const card=track.children[i];if(card)card.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});};
  $('#eggPrev').onclick=()=>{hatchSel=Math.max(0,hatchSel-1);scrollTo(hatchSel);};
  $('#eggNext').onclick=()=>{hatchSel=Math.min(eggs.length-1,hatchSel+1);scrollTo(hatchSel);};
  wrap.querySelectorAll('[data-hatch]').forEach(b=>b.onclick=()=>hatchEggAt(+b.dataset.hatch));
  setTimeout(()=>scrollTo(hatchSel),30);
}

// высиживание конкретного яйца по индексу; после — гнездо обновляется, показывая остаток
function hatchEggAt(idx){
  const eggs=eggsArray();
  if(idx<0||idx>=eggs.length) return;
  const egg=eggs[idx];
  const sp=speciesFromEgg(egg);
  const visEl=$('#eggVis'+idx);
  if(visEl){ visEl.style.animation='shake .4s 2'; }
  setTimeout(()=>{
    // удаляем высиженное яйцо
    eggs.splice(idx,1);
    const wasNew=!S.discovered[sp.id];
    const d=addDragon(sp.id,1);
    const m=morphById(d.morph);
    floatText('🎉',ELEMENTS[sp.el].color);
    const morphTxt = m.id==='common' ? '' : ` <span style="color:${m.swatch}">· окрас «${m.name}»${m.shiny?' ✨':''}</span>`;
    toast(`Вылупился <b>${sp.name}</b>! ${RARITY_STAR(sp.rarity)}${morphTxt} · характер «${natureById(d.nature).name}» ${wasNew?'<span style="color:var(--gold)">· новый вид!</span>':''}`);
    questEvent('hatch');
    // курсор карусели остаётся на месте (следующее яйцо из остатка)
    if(hatchSel>=eggs.length) hatchSel=Math.max(0,eggs.length-1);
    persist();
    renderLedger();
    renderHatch(); // гнездо обновляется: остаток яиц или пустое гнездо
  },500);
}

