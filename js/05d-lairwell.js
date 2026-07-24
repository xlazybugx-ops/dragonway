/* ============================================================
   05d-lairwell.js — ЛОГОВО-КОЛОДЕЦ v2 (v40): рисованный фон + парящая платформа
   Переопределяет renderLair() (грузится после 05-ui-base.js, старые файлы не тронуты).
   Сцена: арт-фон колодца (images/lair_bg.webp) на весь экран; стая статично
   на балконах по бокам — тап даёт эмоцию и облачко с фразой; в центре
   парящая платформа (images/lair_platform.webp) с активным драконом.
   Тап по активному дракону: платформа плавно выезжает на передний план,
   разворачивается на всю ширину, фон затемняется и отключается, снизу
   появляется меню дракона; гены/мутации — в раскрывающемся блоке.
   Нет артов — сцена рисуется CSS-градиентами (ничего не ломается).
   ============================================================ */
'use strict';

let _wellOpen=false, _wellGenes=false; // состояние между рендерами

/* балконы фона lair_bg (в % кадра 768×1408) — 4 слева, 4 справа */
const W2_SPOTS=[
  /* x/y — точка опоры лап на поле балкона, а не центр спрайта. */
  {x:18.5,y:24.5},{x:81.5,y:24.5},
  {x:18.5,y:48.0},{x:81.5,y:48.0},
  {x:18.5,y:71.2},{x:81.5,y:71.2},
  {x:18.5,y:94.0},{x:81.5,y:94.0},
];
const W2_PHRASES=['Привет!','Полетаем?','Я скучал!','Смотри, кристалл!','*урчит*','Возьми меня в бой!','Хррр…','Тут уютно!'];

function renderLair(){
  const sec=$('#lair'); if(!sec) return;
  const dragons=S.dragons.filter(d=>!d.reserve);
  const cap=(typeof lairCap==='function')?lairCap():4;
  const nxt=(typeof lairNext==='function')?lairNext():null;
  const eggsN=(typeof eggCount==='function')?eggCount():0;

  if(!dragons.length){
    sec.innerHTML=`<div class="well2 noimg"><div class="w2-empty"><div style="font-size:44px">🥚</div>
      Логово пустует.<br>Высиди яйцо в Гнезде!
      <button class="btn" onclick="switchView('hatch')" style="margin-top:12px">В Гнездо ›</button></div></div>`;
    return;
  }
  if(!S.sel||!dragons.some(d=>d.uid===S.sel)) S.sel=dragons[0].uid;
  const hero=dragons.find(d=>d.uid===S.sel);
  const others=dragons.filter(d=>d.uid!==S.sel);
  const sp=speciesById(hero.id), st=statsOf(hero);
  const hpPct=Math.max(0,Math.round(hero.curHp/st.maxHp*100));
  const need=xpToNext(hero.level), xpPct=Math.min(100,Math.round(hero.xp/need*100));
  const nat=natureById(hero.nature);
  const mood=(typeof _lairMood==='function')?_lairMood(hero):((hero.happy||0)>=4?'радостный':'ждёт заботы');

  /* стая на балконах: статично, тап = эмоция + облачко */
  const side=others.slice(0,W2_SPOTS.length).map((d,i)=>{
    const p=W2_SPOTS[i], s2=speciesById(d.id);
    return `<button class="w2-d" data-uid="${d.uid}" aria-label="${dragonName(d)}, уровень ${d.level}. Коснуться, чтобы поговорить" style="left:${p.x}%;top:${p.y}%">
      ${sigilHTML(s2,d.morph,'w2d-vis',d.level,true)}
      <span class="w2d-lvl">${d.level}</span>
      <span class="w2d-bubble" style="display:none"></span>
      <span class="w2d-pick" style="display:none">⭐ выбрать</span>
    </button>`;
  }).join('');

  /* верхние чипы */
  const gift=S.chestReady?'<span class="wc-badge">!</span>':'';
  const top=`<div class="well-top">
      <button class="well-chip" id="wcUp" ${nxt?'':'disabled'}>🏰 ур.${S.lairLevel||1}${nxt?' ⬆️':''}</button>
      <span class="well-chip pass">${dragons.length}/${cap}🐉</span>
      <button class="well-chip" id="wcFlock">⚙️</button>
      <button class="well-chip" id="wcGift">🎁${gift}</button>
      <button class="well-chip" id="wcEggs">🥚${eggsN?'<span class="wc-badge">'+eggsN+'</span>':''}</button>
    </div>`;

  /* экип-слоты и гены */
  const eq=equipBonus(hero);
  const slots=['weapon','armor','charm'].map(slot=>{
    const invUid=hero.equip&&hero.equip[slot];
    const inst=invUid?artInst(invUid):null;
    if(inst){ const art=artifactById(inst.id);
      return `<button class="ws-slot filled" data-slot="${slot}"><span>${art.icon}</span><i>+${inst.level}</i></button>`; }
    return `<button class="ws-slot" data-slot="${slot}"><span>${SLOT_ICON[slot]}</span></button>`;
  }).join('');
  const geneRows=GENE_KEYS.map(k=>{
    const v=hero.genes&&hero.genes[k]||0;
    const pips=Array.from({length:GENE_MAX},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('');
    const mcost=mutateCost(hero);
    return `<div class="gene-row">
      <span class="gene-name">${GENE_ICON[k]} ${GENE_LABEL[k]}</span>
      <span class="pips big">${pips}</span>
      <button class="gene-mut" data-mut="${k}" ${S.dust<mcost||v>=GENE_MAX?'disabled':''}>⟳ ${mcost}✦</button>
    </div>`;
  }).join('');
  const genes=`<details class="w2-genes" id="w2Genes" ${_wellGenes?'open':''}>
      <summary>🧬 Гены и мутации <span class="w2g-sum">поколение ${hero.gen||1} · бюджет ${geneSum(hero.genes)}/${GENE_BUDGET_MAX}${hero.genes&&hero.genes.spark?' · ✦':''}</span></summary>
      <div class="gene-rows">${geneRows}</div>
      <div class="w2g-foot">${hero.genes&&hero.genes.spark
        ?'<span class="gene-spark-line">✦ Искра рода — +8% ко всем статам</span>'
        :`<button class="ws-big" id="w2Spark" ${S.dust<SPARK_DUST?'disabled':''}>Зажечь искру · ${SPARK_DUST}✦</button>`}
      </div>
    </details>`;

  /* меню дракона (появляется под платформой в развернутом виде) */
  const menu=`<div class="w2-menu">
      <button class="w2-close" id="w2Close">⌄ свернуть</button>
      <div class="ws-head">
        <button class="ws-ren" id="wsRen">${dragonName(hero)} ✏️</button>
        ${elTag(sp.el)} ${morphBadge(hero.morph)||''}
        <span class="ws-stars">${'★'.repeat(sp.rarity)} · ${nat.icon} ${nat.name}</span>
      </div>
      <div class="ws-bars">
        <div class="ws-barrow"><span>❤️</span><div class="bar hp"><i style="width:${hpPct}%"></i></div><b>${hero.curHp}/${st.maxHp}</b></div>
        <div class="ws-barrow"><span>⭐</span><div class="bar xp"><i style="width:${xpPct}%"></i></div><b>${hero.xp}/${need}</b></div>
      </div>
      <div class="ws-chips">
        <span class="ws-chip">⚔️ ${st.atk}</span><span class="ws-chip">🛡️ ${st.def}</span><span class="ws-chip">💨 ${st.spd}</span>
      </div>
      <div class="ws-care">
        <span class="ws-mood mood-${Math.min(5,hero.happy||0)}">${(hero.happy||0)>=4?'✨':(hero.happy||0)>=2?'👀':'🌙'} ${mood}</span>
        <span class="ws-hearts big">${'💖'.repeat(hero.happy||0)}${'🤍'.repeat(HAPPY_MAX-(hero.happy||0))}</span>
        <button class="ws-act" id="wsFeed">🍖<i>${FOOD_COST}🪙</i></button>
        <button class="ws-act" id="wsPet">💖<i>ласка</i></button>
        <button class="ws-act" id="wsRest" ${hero.curHp>=st.maxHp?'disabled':''}>🛌<i>${restCost(hero)}🪙</i></button>
        <span class="ws-eq-inline">${slots}</span>
      </div>
      ${genes}
      <div class="ws-primary">
        <button class="ws-big" id="wsArena">⚔️ В турнир</button>
        <button class="ws-big" id="wsDossier">📜 Открыть досье</button>
      </div>
      <details class="ws-more"><summary>Ещё действия</summary><div class="ws-grid">
        <button class="ws-big" id="wsSpire">🗼 Шпиль${(typeof pendingForks==='function'&&pendingForks(hero).length)?' <b class="wc-badge">'+pendingForks(hero).length+'</b>':''}</button>
        <button class="ws-big" id="wsRoost">🧬 Гнездилище</button>
        <button class="ws-big" id="wsReserve">💤 В резерв</button>
        <button class="ws-big warn" id="wsFree" ${S.dragons.length>1?'':'disabled'}>🕊️ Отпустить</button>
      </div></details>
    </div>`;

  sec.innerHTML=`<div class="well2 ${_wellOpen?'open':''}" id="well2">
    <img class="w2-bg" src="images/lair_bg.webp?v=311" decoding="async" alt=""
      onerror="this.style.display='none';this.closest('.well2').classList.add('noimg');">
    <div class="w2-dim"></div>
    ${top}
    <div class="w2-scene">${side}</div>
    <div class="w2-plat" id="w2Plat" role="button" tabindex="0" aria-label="Открыть меню дракона ${dragonName(hero)}" aria-expanded="${_wellOpen?'true':'false'}">
      <img class="w2-plat-img" src="images/lair_platform_v2.webp" decoding="async" alt=""
        onerror="if(!this._p){this._p=1;this.src='images/lair_platform.webp';}else{this.style.display='none';this.closest('.w2-plat').classList.add('noimg');}">
      <div class="w2-hero" id="w2Hero">
        <div class="wh-vis dragon-wrap" style="filter:${morphById(hero.morph).filter||'none'}">${dragonVisual(sp.id,hero.level,true)}</div>
        <div class="wh-plate">${dragonName(hero)} · ур.${hero.level}</div>
      </div>
    </div>
    ${menu}
    <div class="well-ov" id="wellOv" style="display:none">
      <div class="well-ov-in">
        <button class="well-ov-x" id="wellOvX">✕</button>
        <div id="dailyPanel" style="display:none"></div>
        <div id="detailPanel" style="display:none"></div>
      </div>
    </div>
  </div>`;

  /* ---------- проводка ---------- */
  const well=$('#well2');
  const setOpen=v=>{ _wellOpen=v; well.classList.toggle('open',v); $('#w2Plat').setAttribute('aria-expanded',String(v)); };
  // повторный тап по активному дракону возвращает общий план
  $('#w2Plat').onclick=()=>setOpen(!_wellOpen);
  $('#w2Plat').onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); setOpen(!_wellOpen); } };
  $('#w2Close').onclick=e=>{ e.stopPropagation(); setOpen(false); };
  well.querySelector('.w2-dim').onclick=()=>setOpen(false);
  // стая: эмоция + облачко с фразой + чип «выбрать»
  well.querySelectorAll('.w2-d').forEach(b=>{
    b.onclick=()=>{
      const bub=b.querySelector('.w2d-bubble'), pick=b.querySelector('.w2d-pick');
      bub.textContent=['💗 ','✨ ','🎵 '][Math.floor(Math.random()*3)]+W2_PHRASES[Math.floor(Math.random()*W2_PHRASES.length)];
      b.setAttribute('aria-label',bub.textContent);
      bub.style.display='block'; pick.style.display='block';
      b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop');
      clearTimeout(b._t); b._t=setTimeout(()=>{bub.style.display='none';pick.style.display='none';},2200);
      pick.onclick=e=>{ e.stopPropagation(); S.sel=+b.dataset.uid; renderLair(); };
    };
  });
  const ov=$('#wellOv'), ovShow=which=>{ ov.style.display='flex';
    $('#dailyPanel').style.display=which==='daily'?'block':'none';
    $('#detailPanel').style.display=which==='detail'?'block':'none'; };
  $('#wellOvX').onclick=()=>{ ov.style.display='none'; };
  ov.onclick=e=>{ if(e.target===ov) ov.style.display='none'; };
  const wcUp=$('#wcUp'); if(wcUp&&nxt) wcUp.onclick=()=>upgradeLair();
  $('#wcFlock').onclick=()=>{ if(typeof openFlockManager==='function')openFlockManager(); };
  const giftBtn=$('#wcGift');
  if(giftBtn) giftBtn.onclick=e=>{
    e.preventDefault();
    e.stopPropagation();
    ovShow('daily');
    if(typeof renderDaily==='function') renderDaily();
    requestAnimationFrame(()=>{
      const panel=$('#dailyPanel');
      if(panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
      const claim=$('#chestBtn');
      if(claim) claim.focus({preventScroll:true});
    });
  };
  $('#wcEggs').onclick=()=>switchView('hatch');
  $('#wsRen').onclick=()=>renameDragon(hero);
  $('#wsFeed').onclick=()=>feedDragon(hero);
  $('#wsPet').onclick=()=>petDragon(hero);
  $('#wsRest').onclick=()=>restDragon(hero);
  $('#wsArena').onclick=()=>{S.arenaPick=hero.uid;switchView('arena');};
  $('#wsSpire').onclick=()=>{S.sel=hero.uid;if(typeof spireTab!=='undefined')spireTab='tree';switchView('spire');};
  $('#wsRoost').onclick=()=>{S.breedA=hero.uid;switchView('roost');};
  $('#wsDossier').onclick=()=>{ ovShow('detail'); renderDetail(hero); };
  $('#wsReserve').onclick=()=>toggleReserve(hero.uid);
  const fr=$('#wsFree'); if(fr&&!fr.disabled) fr.onclick=()=>confirmReleaseOne(hero);
  // мутации: раскрывающийся блок, обработчики существующей системы
  const gd=$('#w2Genes'); if(gd) gd.ontoggle=()=>{ _wellGenes=gd.open; };
  well.querySelectorAll('[data-mut]').forEach(btn=>btn.onclick=e=>{ e.stopPropagation(); mutateGene(hero,btn.dataset.mut); });
  const sb=$('#w2Spark'); if(sb) sb.onclick=()=>igniteSpark(hero);
  // экип-слоты → досье (существующий поток экипировки)
  well.querySelectorAll('.ws-slot').forEach(b=>b.onclick=()=>{ ovShow('detail'); renderDetail(hero);
    setTimeout(()=>{ const es=$('#detailPanel .equip-slots'); if(es)es.scrollIntoView({block:'center'}); },60); });
}
