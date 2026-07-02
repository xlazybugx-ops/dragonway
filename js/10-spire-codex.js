/* ============================================================
   10-spire-codex.js — ШПИЛЬ И КОДЕКС: древо талантов, книга дракона, Восхождение, Кодекс (виды+легенды), вкладки
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ===== ШПИЛЬ МИРОЗДАНИЯ: ДРЕВО ТАЛАНТОВ И КНИГА ===== */
let spireTab='tree'; // 'tree' | 'book'
function renderSpire(){
  const body=$('#spireBody');
  if(!body) return;
  if(!S.dragons.length){ body.innerHTML='<div class="empty">Сначала обзаведись драконом в Гнезде, и его путь раскроется здесь.</div>'; return; }
  // выбираем дракона: тот же, что в Логове
  if(!S.sel || !S.dragons.some(d=>d.uid===S.sel)) S.sel=S.dragons[0].uid;
  const d=S.dragons.find(x=>x.uid===S.sel);
  const sp=speciesById(d.id);
  const need=xpToNext(d.level);
  const xpPct=d.level>=MAX_LEVEL?100:Math.round(d.xp/need*100);
  const pend=pendingForks(d).length;

  // выбор дракона (мини-полоска)
  const chips=S.dragons.map(x=>{
    const xs=speciesById(x.id);
    return `<button class="spire-chip${x.uid===d.uid?' on':''}" data-pick="${x.uid}">
      <span class="chip-art" style="filter:${morphById(x.morph).filter||'none'}">${dragonVisual(x.id, x.level)}</span> ${dragonName(x)}
      <span class="spire-chip-lvl">${x.level}</span>${pendingForks(x).length?'<span class="spire-chip-dot">●</span>':''}</button>`;
  }).join('');

  body.innerHTML=`
    <div class="spire-pick" id="spirePick">${chips}</div>
    <div class="spire-head">
      <div class="spire-hero dragon-wrap" style="filter:${morphById(d.morph).filter||'none'}">${dragonVisual(d.id, d.level)}</div>
      <div class="spire-hero-info">
        <h3>${dragonName(d)} <span class="spire-lvl">ур. ${d.level}/${MAX_LEVEL}</span>${(d.asc||0)?` <span class="asc-stars" title="Звёзды восхождения: +${(d.asc||0)*6}% ко всем статам">${'⭐'.repeat(Math.min(5,d.asc))}${d.asc>5?'×'+d.asc:''}</span>`:''}</h3>
        <div class="spire-xpbar"><i style="width:${xpPct}%"></i></div>
        <div class="dmeta">${d.level>=MAX_LEVEL?'Достигнут вершины Шпиля! 🏆':`до следующего уровня: ${need-d.xp} опыта`}</div>
      </div>
    </div>
    ${d.level>=MAX_LEVEL?`
    <div class="asc-block">
      <div class="asc-title">⭐ Восхождение</div>
      <p class="asc-text">Дракон достиг вершины. Пройдя Восхождение, он возродится на 1 уровне — но обретёт <b>вечную звезду</b>: +6% ко всем статам навсегда. Гены, характер и таланты сохранятся.</p>
      <div class="asc-req">Нужна <b>⭐ Звезда владык</b> (за победу над владыкой мира). У тебя: <b>${S.ascStars||0}</b></div>
      <div class="btnrow" style="justify-content:center;margin-top:10px">
        <button class="btn" id="ascBtn" ${(S.ascStars||0)>0?'':'disabled'}>${(S.ascStars||0)>0?'⭐ Пройти Восхождение':'Победи владыку мира ради звезды'}</button>
      </div>
    </div>`:''}
    <div class="spire-tabs">
      <button class="spire-tab${spireTab==='tree'?' on':''}" data-st="tree">🌳 Древо силы${pend?` <span class="spire-badge">${pend}</span>`:''}</button>
      <button class="spire-tab${spireTab==='book'?' on':''}" data-st="book">📖 Книга дракона</button>
    </div>
    <div id="spireContent"></div>`;

  $$('#spirePick [data-pick]').forEach(b=>b.onclick=()=>{S.sel=+b.dataset.pick;renderSpire();});
  $$('.spire-tab').forEach(b=>b.onclick=()=>{spireTab=b.dataset.st;renderSpire();});
  const ab=$('#ascBtn'); if(ab&&!ab.disabled) ab.onclick=()=>doAscend(d);
  if(spireTab==='tree') renderSpireTree(d); else renderSpireBook(d);
}

// Восхождение: сброс уровня, вечная звезда (+6% статов), гены/характер/таланты сохраняются
function doAscend(d){
  if(d.level<MAX_LEVEL){toast('Восхождение доступно только дракону 100 уровня.');return;}
  if((S.ascStars||0)<1){toast('Нужна ⭐ Звезда владык — победи владыку мира.');return;}
  S.ascStars--;
  d.asc=(d.asc||0)+1;
  d.level=1; d.xp=0;
  d.curHp=statsOf(d).maxHp;
  persist(); renderLedger();
  floatText('⭐ ВОСХОЖДЕНИЕ!','#ffd24a');
  toast(`<b>⭐ ${dragonName(d)} прошёл Восхождение!</b> Он возродился на 1 уровне с вечной звездой: <b>+${d.asc*6}%</b> ко всем статам. Путь наверх начинается вновь — но теперь дракон сильнее.`);
  renderSpire();
}

function renderSpireTree(d){
  const c=$('#spireContent');
  const tree=treeOf(d.id);
  const picks=d.talentPicks||{};
  const rows=tree.map(node=>{
    const open = node.lvl<=d.level;
    const lockCls = open?'':' locked';
    let inner='';
    if(node.kind==='spell'||node.kind==='ult'){
      const cls = node.kind==='ult'?'tnode ult':'tnode spell';
      inner=`<div class="${cls}${lockCls}">
        <div class="tnode-ic">${open?node.icon:'🔒'}</div>
        <div class="tnode-body"><div class="tnode-name">${node.name} ${node.kind==='ult'?'<span class="ult-tag">УЛЬТА</span>':'<span class="spell-tag">заклинание</span>'}</div>
        <div class="tnode-desc">${open?node.desc:'откроется на ур. '+node.lvl}</div></div></div>`;
    } else if(node.kind==='perk'){
      inner=`<div class="tnode perk${lockCls}">
        <div class="tnode-ic">${open?node.icon:'🔒'}</div>
        <div class="tnode-body"><div class="tnode-name">${node.name}</div>
        <div class="tnode-desc">${open?node.desc:'откроется на ур. '+node.lvl}</div></div></div>`;
    } else if(node.kind==='fork'){
      const chosen=picks[node.lvl];
      inner=`<div class="tnode fork${lockCls}${(open&&chosen==null)?' choose':''}">
        <div class="tnode-ic">${open?'🔀':'🔒'}</div>
        <div class="tnode-body">
          <div class="tnode-name">Выбери талант ${(open&&chosen==null)?'<span class="choose-tag">нужен выбор!</span>':''}</div>
          <div class="fork-opts">
            ${node.options.map((o,i)=>`<button class="fork-opt${chosen===i?' picked':''}" data-fork="${node.lvl}" data-opt="${i}" ${open?'':'disabled'}>
              <span class="fo-ic">${o.icon}</span><span class="fo-name">${o.name}</span><span class="fo-desc">${o.desc}</span></button>`).join('')}
          </div>
        </div></div>`;
    }
    return `<div class="trow${lockCls}"><div class="trow-lvl">${node.lvl}</div><div class="trow-node">${inner}</div></div>`;
  }).join('');
  c.innerHTML=`<div class="ttree">${rows}</div>`;
  c.querySelectorAll('[data-fork]').forEach(btn=>btn.onclick=()=>{
    const lvl=+btn.dataset.fork, opt=+btn.dataset.opt;
    chooseFork(d, lvl, opt);
  });
}

function chooseFork(d, lvl, opt){
  d.talentPicks=d.talentPicks||{};
  const already=d.talentPicks[lvl]!=null;
  d.talentPicks[lvl]=opt;
  d.curHp=Math.min(d.curHp,statsOf(d).maxHp);
  const tree=treeOf(d.id);
  const node=tree.find(n=>n.lvl===lvl);
  const o=node.options[opt];
  floatText(o.icon+' '+o.name,'#d9a441');
  if(!already) toast(`<b>${dragonName(d)}</b> выбрал талант <b>${o.name}</b> (${o.desc})!`);
  persist(); renderSpire(); renderLair();
}

function renderSpireBook(d){
  const c=$('#spireContent');
  const sp=speciesById(d.id);
  const spells=unlockedSpells(d).filter(n=>n.kind==='spell');
  const ults=unlockedSpells(d).filter(n=>n.kind==='ult');
  const tree=treeOf(d.id);
  const tal=talentMods(d);
  // активные перки
  const activePerks=[];
  for(const n of tree){
    if(n.lvl>d.level) continue;
    if(n.kind==='perk') activePerks.push(n);
    else if(n.kind==='fork' && d.talentPicks && d.talentPicks[n.lvl]!=null) activePerks.push({...n.options[d.talentPicks[n.lvl]]});
  }
  const nextNode=tree.find(n=>n.lvl>d.level);
  const talLine=Object.entries(tal).filter(([k,v])=>v>0).map(([k,v])=>`+${Math.round(v*100)}% ${{atk:'атаки',def:'защиты',hp:'здоровья',spd:'прыти'}[k]}`).join(' · ');

  c.innerHTML=`
    <div class="book">
      <div class="book-section">
        <h4>📜 О драконе</h4>
        <p class="book-lore">${d.name?`<b>${d.name}</b> — это ${sp.name.toLowerCase()}. `:''}${sp.lore}</p>
        <p class="book-meta">Стихия: <b style="color:${ELEMENTS[sp.el].color}">${ELEMENTS[sp.el].name}</b> · сильнее против <b style="color:${ELEMENTS[ADVANTAGE[sp.el]].color}">${ELEMENTS[ADVANTAGE[sp.el]].name}</b></p>
        ${talLine?`<p class="book-meta">Бонусы от талантов: <b style="color:var(--venom)">${talLine}</b></p>`:''}
      </div>
      <div class="book-section">
        <h4>✨ Заклинания (${spells.length})</h4>
        ${spells.length?spells.map(s=>`<div class="book-spell"><span class="bs-ic">${s.icon}</span><span class="bs-name">${s.name}</span><span class="bs-lvl">ур.${s.lvl}</span><span class="bs-desc">${s.desc}</span></div>`).join(''):'<p class="hint">Первое заклинание откроется на 10-м уровне.</p>'}
      </div>
      ${ults.length?`<div class="book-section">
        <h4>⭐ Ультимативные способности (${ults.length})</h4>
        ${ults.map(u=>`<div class="book-spell ult"><span class="bs-ic">${u.icon}</span><span class="bs-name">${u.name}</span><span class="bs-lvl">ур.${u.lvl}</span><span class="bs-desc">${u.desc}</span></div>`).join('')}
      </div>`:''}
      <div class="book-section">
        <h4>🌟 Таланты и перки (${activePerks.length})</h4>
        ${activePerks.length?activePerks.map(p=>`<div class="book-perk"><span class="bs-ic">${p.icon}</span><span class="bs-name">${p.name}</span><span class="bs-desc">${p.desc}</span></div>`).join(''):'<p class="hint">Первый перк откроется на 5-м уровне.</p>'}
      </div>
      ${nextNode?`<div class="book-next">Дальше на ур. ${nextNode.lvl}: ${nextNode.kind==='ult'?'⭐ ультимативная способность':nextNode.kind==='spell'?'✨ новое заклинание':nextNode.kind==='fork'?'🔀 талант на выбор':'🌟 новый перк'}</div>`:'<div class="book-next">🏆 Все таланты открыты — это вершина Шпиля!</div>'}
    </div>`;
}

/* ===== ОТПУСКАНИЕ ДРАКОНА (теперь из свитка в Логове) ===== */
let farewellArmed=null;
function confirmReleaseOne(d){
  if(S.dragons.length<=1){ toast('Это твой единственный дракон — его не отпускаем! 🐉'); return; }
  const btn=$('#releaseBtn');
  if(farewellArmed!==d.uid){
    farewellArmed=d.uid;
    const g=farewellGift(d);
    if(btn){btn.textContent=`Точно отпустить ${dragonName(d)}? (получишь ${g.gold}🪙)`;btn.classList.add('arm');}
    setTimeout(()=>{farewellArmed=null;const b=$('#releaseBtn');if(b){b.textContent='Отпустить на волю 🕊️';b.classList.remove('arm');}},3500);
    return;
  }
  farewellArmed=null;
  releaseDragons([d.uid]);
}

/* ===== КОДЕКС ===== */
function renderCodex(){
  // вкладки
  const tabs=$$('#codex .codex-tab');
  tabs.forEach(t=>t.onclick=()=>{
    tabs.forEach(x=>x.classList.toggle('on',x===t));
    const isLore=t.dataset.ctab==='lore';
    $('#codexSpecies').style.display=isLore?'none':'block';
    $('#codexLore').style.display=isLore?'block':'none';
    if(isLore) renderLore();
  });
  const g=$('#codexGrid');g.innerHTML='';
  SPECIES.forEach(sp=>{
    const found=S.discovered[sp.id];
    const owned=S.dragons.filter(d=>d.id===sp.id).length;
    const seen=S.morphsSeen[sp.id]||{};
    let displayMorph='common';
    if(found){
      const ownedMorphs=MORPHS.filter(m=>seen[m.id]);
      if(ownedMorphs.length) displayMorph=ownedMorphs.sort((a,b)=>a.weight-b.weight)[0].id;
    }
    const morphDots=MORPHS.map(m=>{
      const got=seen[m.id];
      return `<span class="mdot${got?'':' off'}${m.shiny?' shiny':''}" title="${m.name}${got?'':' — не найден'}" style="background:${got?m.swatch:'transparent'};border-color:${m.swatch}"></span>`;
    }).join('');
    const div=document.createElement('div');
    div.className='dcard'+(found?'':' locked');
    div.style.cursor='default';
    div.innerHTML=`
      <span class="star">${RARITY_STAR(sp.rarity)}</span>
      ${found?sigilHTML(sp,displayMorph,'sigil'):'<div class="sigil">❔</div>'}
      <div class="dname">${found?sp.name:'???'}</div>
      ${found?elTag(sp.el):'<span class="dmeta">Не открыт</span>'}
      <div class="dmeta" style="margin-top:8px">${found?`${RARITY_NAME[sp.rarity]} · в логове: ${owned}`:'Поймай, чтобы открыть'}</div>
      ${found?`<div class="mdots" title="Собранные окрасы">${morphDots}</div>`:''}`;
    g.appendChild(div);
  });
}

// вкладка «Легенды»: свитки лора по мирам
function renderLore(){
  const box=$('#codexLore'); if(!box) return;
  const total=LORE_SCROLLS.length, found=scrollsFound().length;
  let html=`<p class="lede">Свитки легенд, собранные в странствиях. Собрано: <b>${found}/${total}</b>. В некоторых скрыты подсказки к артефактам и владыкам миров.</p>`;
  WORLDS.forEach(w=>{
    const worldScrolls=LORE_SCROLLS.filter(s=>s.world===w.id);
    const gotCount=worldScrolls.filter(s=>hasScroll(s)).length;
    html+=`<div class="lore-world">
      <div class="lore-world-head">${elTag(w.el)} <b>${w.name}</b> <span class="dmeta">${gotCount}/${worldScrolls.length}</span></div>
      <div class="lore-scrolls">`;
    worldScrolls.forEach(s=>{
      const got=hasScroll(s);
      if(got){
        html+=`<div class="lore-scroll got">
          <div class="lore-scroll-title">📜 ${s.title} <span class="lore-biome">${BIOME_TIERLABEL[s.biome].split(' · ')[0]}</span></div>
          <div class="lore-scroll-text">${s.text}</div>
          ${s.hint?`<div class="lore-hint">💡 ${s.hint}</div>`:''}
        </div>`;
      } else {
        html+=`<div class="lore-scroll locked">
          <div class="lore-scroll-title">🔒 Неизвестный свиток <span class="lore-biome">${BIOME_TIERLABEL[s.biome].split(' · ')[0]}</span></div>
          <div class="lore-scroll-text">Найди этот свиток в странствиях по миру «${w.name}».</div>
        </div>`;
      }
    });
    html+=`</div></div>`;
  });
  box.innerHTML=html;
}

/* ===== ВКЛАДКИ ===== */
const VIEW_TITLES={lair:'Логово',hatch:'Гнездо',explore:'Странствие',arena:'Турнир',roost:'Гнездилище Рода',forge:'Кузница',spire:'Шпиль Мироздания',codex:'Кодекс видов'};
function ensureScreenBar(v){
  if(v==='hub') return;
  const sec=$('#'+v); if(!sec) return;
  if(sec.querySelector(':scope > .screen-bar')) return;
  const bar=document.createElement('div');
  bar.className='screen-bar';
  bar.innerHTML=`<button class="home-btn" onclick="switchView('hub')">🏠 На главную</button>
    <span class="screen-bar-title">${VIEW_TITLES[v]||''}</span>`;
  sec.insertBefore(bar, sec.firstChild);
}
function switchView(v){
  if(v!=='hub') S._treasuryOpen=false;
  $$('.view').forEach(s=>s.classList.toggle('on',s.id===v));
  ensureScreenBar(v);
  if(v==='hub')renderHub();
  if(v==='explore'){ renderMap(); }
  if(v==='arena'){if(!battle){$('#arenaSetup').style.display='block';$('#battleStage').style.display='none';renderArenaPicker();}}
  if(v==='codex')renderCodex();
  if(v==='forge')renderForge();
  if(v==='roost')renderRoost();
  if(v==='spire')renderSpire();
  if(v==='lair')renderLair();
  if(v==='hatch')renderHatch();
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderAll(){renderLedger();renderLair();renderCodex();
  if($('#forge').classList.contains('on'))renderForge();
  if($('#roost').classList.contains('on'))renderRoost();
  if($('#spire').classList.contains('on'))renderSpire();}

