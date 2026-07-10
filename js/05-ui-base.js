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
  // пыль как валюта появляется вместе с Кузницей (этап 15–30 мин)
  const dustEl=$('#dust'), dustItem=dustEl&&dustEl.closest?dustEl.closest('.tb-item'):null;
  if(dustItem) dustItem.style.display=featureUnlocked('forge')?'':'none';
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

/* ============================================================
   ЖИВОЕ ЛОГОВО — автономные драконы (канвас, лёгкий ИИ, без влияния на баланс)
   Поведение из характера (nature) + настроения (happy). rAF работает только когда экран Логова открыт.
   ============================================================ */
const LAIR_STATES=['idle','walk','fly','sleep','play','groom','look','roar','seek'];
const LAIR_EMOTE={idle:'',walk:'',fly:'',sleep:'💤',play:'♪',groom:'✨',look:'❔',roar:'❕',seek:'🔎'};
let _lairRAF=0, _lairAgents=null, _lairCtx=null, _lairCv=null, _lairLast=0, _lairEvT=6, _lairFit=null;
function _lairMood(d){ const h=d.happy||0; return h>=4?'радостный':h>=3?'воодушевлённый':h===2?'любопытный':h===1?'уставший':'сонный'; }
function _lairWeights(d){
  const up=(natureById(d.nature)||{}).up, h=d.happy||0;
  const w={idle:3,walk:3,fly:2,sleep:2,play:2,groom:1.4,look:1.6,roar:1,seek:1.4};
  if(up==='spd'){w.fly+=3;w.walk+=2;w.sleep-=1;}
  if(up==='atk'){w.roar+=2;w.play+=2;}
  if(up==='def'){w.groom+=2;w.idle+=2;}
  if(up==='hp'){w.sleep+=3;w.idle+=1;w.fly-=1;}
  if(h>=4){w.play+=2;w.fly+=1;w.seek+=1;} else if(h<=1){w.sleep+=3;w.play-=1;w.roar-=1;}
  return w;
}
function _lairPick(d){ const w=_lairWeights(d); let t=0; for(const k in w)t+=Math.max(0,w[k]);
  let x=Math.random()*t; for(const k in w){ if((x-=Math.max(0,w[k]))<=0) return k; } return 'idle'; }
function mountLivingLair(wrap){
  // канвас-сцена сверху ростера (не заменяет карточки — они остаются ниже для управления)
  const box=document.createElement('div'); box.className='living-lair';
  const cv=document.createElement('canvas'); cv.className='lair-canvas'; cv.id='lairCanvas';
  const cap=document.createElement('div'); cap.className='living-lair-cap'; cap.textContent='🏡 Логово живёт своей жизнью — коснись дракона';
  box.appendChild(cv); box.appendChild(cap); wrap.appendChild(box);
  _lairCv=cv; _lairCtx=cv.getContext('2d');
  const list=S.dragons.filter(d=>!d.reserve).slice(0,12); // ДОМ СТАИ: только активная стая (резерв — в Заповеднике)
  const W=cv.clientWidth||Math.min(360,innerWidth-32), H=200;
  _lairAgents=list.map((d,i)=>({ d, x:30+Math.random()*(W-60), y:70+Math.random()*(H-90),
    vx:0, vy:0, st:'idle', t:1+Math.random()*2, face:Math.random()<.5?1:-1, bob:Math.random()*6, emote:0 }));
  const dpr=Math.min(2,devicePixelRatio||1);
  const fit=()=>{ const w=cv.clientWidth||W; cv.width=w*dpr; cv.height=H*dpr; cv.style.height=H+'px'; _lairCtx.setTransform(dpr,0,0,dpr,0,0); cv._w=w; cv._h=H; };
  if(_lairFit)removeEventListener('resize',_lairFit); _lairFit=fit; addEventListener('resize',fit); // ПЕРФ: без накопления слушателей
  cv.onpointerdown=(e)=>{ const r=cv.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
    let best=null,bd=44; for(const a of _lairAgents){ const dd=Math.hypot(a.x-px,a.y-py); if(dd<bd){bd=dd;best=a;} }
    if(best){ best.emote=1.2; best.st='look'; best.t=2; best.bob+=3;
      _lairSpawnEmote(best, ['❤','💖','🎵','✨'][Math.floor(Math.random()*4)]);
      S.sel=best.d.uid; // тап по дракону открывает его свиток
      if(typeof renderDetail==='function'){ renderDetail(best.d); const dp=$('#detailPanel'); if(dp) setTimeout(()=>dp.scrollIntoView({behavior:'smooth',block:'nearest'}),40); } } };
  _lairLast=performance.now(); _lairEvT=5+Math.random()*5;
  if(_lairRAF)cancelAnimationFrame(_lairRAF);
  _lairRAF=requestAnimationFrame(_lairFrame);
}
const _lairEmotes=[];
function _lairSpawnEmote(a,txt){ _lairEmotes.push({x:a.x,y:a.y-24,txt,t:0}); }
function _lairFrame(now){
  // сам останавливается, когда Логово не на экране — экономия FPS
  const lairOn=$('#lair')&&$('#lair').classList.contains('on');
  if(!lairOn||!_lairCv||!_lairCtx||!_lairAgents){ _lairRAF=0; if(_lairFit){removeEventListener('resize',_lairFit);_lairFit=null;} return; } // ПЕРФ: снять слушатель при остановке
  const dt=Math.min(0.05,(now-_lairLast)/1000); _lairLast=now;
  const W=_lairCv._w||320, H=_lairCv._h||180, ctx=_lairCtx;
  try{ _lairUpdate(dt,W,H); _lairDraw(W,H); }catch(e){ /* никогда не роняем UI */ }
  _lairRAF=requestAnimationFrame(_lairFrame);
}
function _lairUpdate(dt,W,H){
  // редкие мини-события (косметические)
  _lairEvT-=dt;
  if(_lairEvT<=0 && _lairAgents.length){ _lairEvT=8+Math.random()*10;
    const a=_lairAgents[Math.floor(Math.random()*_lairAgents.length)];
    const find=['✨ кристалл','🌸 цветок','🦋 бабочка','🍄 гриб','🥚 яйцо?'][Math.floor(Math.random()*5)];
    a.st='seek'; a.t=2.5; _lairSpawnEmote(a, find.split(' ')[0]);
    if(typeof toast==='function' && Math.random()<0.5) toast(`${dragonName(a.d)} нашёл(ла) ${find} в логове!`);
  }
  for(const a of _lairAgents){
    a.t-=dt; a.bob+=dt*(a.st==='fly'?9:5); if(a.emote>0)a.emote-=dt;
    if(a.t<=0){ a.st=_lairPick(a.d); a.t=1.6+Math.random()*3;
      if(a.st==='walk'||a.st==='seek'){ a.tx=30+Math.random()*(W-60); a.ty=70+Math.random()*(H-90); }
      if(a.st==='fly'){ a.tx=30+Math.random()*(W-60); a.ty=24+Math.random()*(H-120); } }
    let sp=0;
    if(a.st==='walk'||a.st==='seek') sp=26;
    else if(a.st==='fly') sp=60;
    if(sp&&a.tx!=null){ const dx=a.tx-a.x, dy=a.ty-a.y, dl=Math.hypot(dx,dy)||1;
      if(dl>4){ a.x+=dx/dl*sp*dt; a.y+=dy/dl*sp*dt; a.face=dx<0?-1:1; } else a.t=Math.min(a.t,0.2); }
    // мягкое разведение соседей (чтобы «садились рядом», но не слипались)
    for(const b of _lairAgents){ if(b===a)continue; const dx=a.x-b.x,dy=a.y-b.y,dd=Math.hypot(dx,dy);
      if(dd<26&&dd>0){ a.x+=dx/dd*6*dt; a.y+=dy/dd*6*dt; if(a.st==='play'||b.st==='play'){ if(Math.random()<0.01)_lairSpawnEmote(a,'♪'); } } }
    a.x=Math.max(22,Math.min(W-22,a.x)); a.y=Math.max(40,Math.min(H-16,a.y));
  }
  for(const e of _lairEmotes){ e.t+=dt; e.y-=14*dt; } 
  for(let i=_lairEmotes.length-1;i>=0;i--) if(_lairEmotes[i].t>1.1)_lairEmotes.splice(i,1);
}
function _lairDraw(W,H){
  const ctx=_lairCtx; ctx.clearRect(0,0,W,H);
  // мягкий пол логова
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'rgba(60,48,96,.0)'); g.addColorStop(1,'rgba(40,30,70,.25)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const order=[..._lairAgents].sort((a,b)=>a.y-b.y);
  for(const a of order){
    const st=stageForLevel(a.d.level||1)||1;
    const size = st>=100?30: st>=60?26: st>=25?22:18; // стадия роста → размер
    const bobY = a.st==='sleep'?0 : Math.sin(a.bob)*(a.st==='fly'?5:2.5);
    const yy=a.y+bobY;
    // тень
    ctx.beginPath(); ctx.ellipse(a.x, a.y+size*0.55, size*0.7, size*0.24, 0,0,6.283); ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fill();
    // дракон (эмодзи-силуэт вида), отражение по направлению
    ctx.save(); ctx.translate(a.x,yy); ctx.scale(a.face,1);
    ctx.font=size+'px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha=a.st==='sleep'?0.85:1;
    ctx.fillText((speciesById(a.d.id).sigil)||'🐉',0,0); ctx.restore();
    ctx.globalAlpha=1;
    // эмоция состояния
    const em=(a.emote>0?'💗':LAIR_EMOTE[a.st])||'';
    if(em){ ctx.font='13px system-ui'; ctx.textAlign='center'; ctx.fillText(em, a.x+size*0.5, yy-size*0.6); }
  }
  ctx.textAlign='center'; ctx.font='bold 13px system-ui';
  for(const e of _lairEmotes){ ctx.globalAlpha=Math.max(0,1-e.t/1.1); ctx.fillText(e.txt,e.x,e.y); }
  ctx.globalAlpha=1;
}

function renderLair(){
  if(typeof renderDaily==='function' && $('#dailyPanel')) renderDaily();
  const wrap=$('#lairRoster'); wrap.innerHTML='';
  if(!S.dragons.length){ wrap.innerHTML='<div class="empty">Логово пустует. Высиди яйцо в Гнезде, чтобы обрести первого дракона.</div>'; $('#detailPanel').style.display='none'; return; }
  const activeList=S.dragons.filter(d=>!d.reserve);
  // 1) ДОМ СТАИ — живая сцена (только активная стая); тап по дракону открывает свиток
  mountLivingLair(wrap);
  // 2) УРОВЕНЬ ЛОГОВА + вход в управление стаей/Заповедником
  const _cap=(typeof lairCap==='function')?lairCap():4, _act=activeList.length;
  const _nx=(typeof lairNext==='function')?lairNext():null;
  const lvlBar=document.createElement('div'); lvlBar.className='lair-level';
  lvlBar.innerHTML=`<span class="ll-badge">🏰<b>ур.${S.lairLevel||1}</b></span>`
    +`<span class="ll-cap${_act>=_cap?' full':''}">${_act}/${_cap}🐉</span>`
    +`<button class="flock-open-btn tap" id="flockMgrBtn" title="Стая и Заповедник">⚙️ Стая</button>`
    +(_nx?`<button class="ll-up tap" id="lairUpBtn">⬆️ ${_nx.cap}🐉</button>`:`<span class="ll-max">макс</span>`);
  wrap.appendChild(lvlBar);
  // 3) ИНКУБАТОР — компактная полоса
  const incHtml=lairIncubatorHTML();
  if(incHtml){ const box=document.createElement('div'); box.className='lair-incub tap'; box.innerHTML=incHtml;
    box.onclick=()=>switchView('hatch'); wrap.appendChild(box); }
  // 4) ОДНО СЛЕДУЮЩЕЕ ДЕЙСТВИЕ
  const act=lairNextAction();
  if(act){ const b=document.createElement('button'); b.className='lair-next tap'; b.innerHTML=act.label; b.onclick=act.fn; wrap.appendChild(b); }
  // проводка
  const _upBtn=$('#lairUpBtn'); if(_upBtn) _upBtn.onclick=()=>upgradeLair();
  const _mgrBtn=$('#flockMgrBtn'); if(_mgrBtn) _mgrBtn.onclick=()=>openFlockManager();
  // свиток выбранного (управление — в бот-шите ⚙️ Стая; детали — тапом по дракону)
  if(S.sel && S.dragons.some(d=>d.uid===S.sel)) renderDetail(S.dragons.find(d=>d.uid===S.sel));
  else $('#detailPanel').style.display='none';
}

/* Инкубатор: компактный статус ближайшего яйца */
function lairIncubatorHTML(){
  const eggs=(typeof eggsArray==='function')?eggsArray():[];
  if(!eggs.length) return '';
  const readyN=eggs.filter(e=>e.incNeed&&(e.inc||0)>=e.incNeed).length;
  const inc=eggs.find(e=>e.incNeed&&(e.inc||0)<e.incNeed);
  if(readyN) return `<span class="li-ic">🐣</span><span class="li-body"><b>${readyN}</b> ${readyN===1?'яйцо готово':'яиц готовы'} к вылуплению</span><span class="li-go">Гнездо ›</span>`;
  if(inc){ const pct=Math.round((inc.inc||0)/inc.incNeed*100);
    const bar=(typeof pbarHTML==='function')?pbarHTML(inc.inc||0,inc.incNeed,'inc',false):'';
    return `<span class="li-ic">🥚</span><span class="li-body">Инкубация · <b>${pct}%</b>${bar}</span><span class="li-go">Гнездо ›</span>`; }
  return `<span class="li-ic">🥚</span><span class="li-body"><b>${eggs.length}</b> ${eggs.length===1?'яйцо ждёт':'яиц ждут'} своего часа</span><span class="li-go">Гнездо ›</span>`;
}

/* Одно следующее действие — приоритет по состоянию логова */
function lairNextAction(){
  const eggs=(typeof eggsArray==='function')?eggsArray():[];
  if(S.chestReady) return {label:'🎁 Забрать подарок дня', fn:()=>{ const dp=$('#dailyPanel'); if(dp)dp.scrollIntoView({behavior:'smooth',block:'center'}); }};
  if(eggs.some(e=>e.incNeed&&(e.inc||0)>=e.incNeed)) return {label:'🐣 Высиди готовое яйцо', fn:()=>switchView('hatch')};
  if(typeof lairUpgradeCheck==='function'){ const c=lairUpgradeCheck(); if(c&&c.ok) return {label:'⬆️ Улучши логово', fn:()=>upgradeLair()}; }
  if(eggs.length) return {label:'🥚 Загляни в Гнездо', fn:()=>switchView('hatch')};
  return {label:'🗺️ Отправься в странствие', fn:()=>switchView('explore')};
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
          <button class="btn care-btn" onclick="toggleReserve(${d.uid})" title="Отправить в резерв">💤 В резерв</button>
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
function eggSVG(el, tier, rarity){
  const c=EGG_COLORS[el]||EGG_COLORS.fire;
  const rd=(typeof EGG_RARITY!=='undefined'?(EGG_RARITY[Math.max(1,Math.min(6,rarity||1))]):null)||{r:rarity||1,frame:c.dark,glow:c.light};
  const spots = el==='shade'
    ? `<circle cx="46" cy="52" r="4" fill="${c.spot}" opacity=".8"/><circle cx="60" cy="70" r="3" fill="${c.spot}" opacity=".7"/><circle cx="52" cy="86" r="3.5" fill="${c.spot}" opacity=".7"/>`
    : `<ellipse cx="44" cy="54" rx="4" ry="5" fill="${c.spot}" opacity=".75"/><ellipse cx="62" cy="66" rx="3.5" ry="4.5" fill="${c.spot}" opacity=".7"/><ellipse cx="50" cy="82" rx="4" ry="5" fill="${c.spot}" opacity=".7"/><ellipse cx="66" cy="86" rx="3" ry="4" fill="${c.spot}" opacity=".6"/>`;
  // свечение и рамка по РЕДКОСТИ яйца
  const glow = `<ellipse cx="54" cy="64" rx="42" ry="48" fill="${rd.glow}" opacity="${rd.r>=4?0.30:rd.r>=2?0.16:0.06}"/>`;
  const frame = rd.r>=2 ? `<ellipse cx="54" cy="64" rx="37" ry="47" fill="none" stroke="${rd.frame}" stroke-width="${rd.r>=4?3:2}" opacity=".9"/>` : '';
  const crown = rd.r>=3 ? `<path d="M54 16 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 Z" fill="${rd.frame}" opacity=".95"/>` : '';
  const sparks = rd.r>=4 ? `<circle cx="33" cy="40" r="2.2" fill="${rd.glow}"/><circle cx="77" cy="52" r="1.8" fill="${rd.glow}"/><circle cx="70" cy="94" r="2" fill="${rd.glow}"/>` : '';
  return `<svg viewBox="0 0 108 128" xmlns="http://www.w3.org/2000/svg">
    ${glow}
    <defs><radialGradient id="eg${el}${tier}${rd.r}" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="${c.light}"/><stop offset="60%" stop-color="${c.base}"/><stop offset="100%" stop-color="${c.dark}"/>
    </radialGradient></defs>
    <ellipse cx="54" cy="64" rx="34" ry="44" fill="url(#eg${el}${tier}${rd.r})" stroke="${c.dark}" stroke-width="2"/>
    <ellipse cx="44" cy="44" rx="10" ry="14" fill="#fff" opacity=".22"/>
    ${spots}${frame}${crown}${sparks}
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
// Кодекс Яиц: 5 стихий × 6 редкостей, найдено/неизвестно, % коллекции
const SRC_LABEL={battle:'обычные бои',elite:'элитные враги',boss:'боссы',tower:'башня',daily:'ежедневные задания',streak:'серии побед',explore:'исследование',chest:'редкие сундуки',secret:'секретное событие',unique:'уникальное'};
// Кодекс Яиц V2 — по каталогу EGG_CATALOG (изображение/описание/редкость/источник/драконы/статистика)
function eggCodexHTML(){
  const stats=S.eggStats||{}, seen=S.eggsSeen||{}, secret=S.eggsSecret||{};
  const baseOpened=(id)=>{ const m=/^egg_(fire|frost|venom|storm|shade)$/.exec(id); if(!m)return false; const el=m[1]; return Object.keys(seen).some(k=>k.indexOf(el+':')===0); };
  const list=(typeof EGG_CATALOG!=='undefined')?EGG_CATALOG:[];
  let cells='',found=0;
  for(const e of list){
    const rd=EGG_RARITY[e.rarity]||EGG_RARITY[1];
    const cnt=stats[e.id]||0;
    const opened = cnt>0 || baseOpened(e.id);
    const hiddenSecret = e.secret && !secret[e.id] && !opened;
    if(opened)found++;
    if(hiddenSecret){ cells+='<div class="egg-codex-cell unknown" title="Секретное яйцо — откроется особым условием"><div class="egg-codex-q">🔒</div></div>'; continue; }
    const dr=e.dragons.map(id=>((typeof speciesById==='function'&&speciesById(id))||{}).name||id).join(', ');
    const tip=(e.name+' · '+rd.name+' — '+e.desc+' · Источник: '+(SRC_LABEL[e.source]||e.source)+(e.cond?' · Условие: '+e.cond:'')+' · Виды: '+dr+(cnt?' · Получено '+cnt+'×':'')).replace(/"/g,'&quot;');
    cells+='<div class="egg-codex-cell '+(opened?'found':'unknown')+'" style="box-shadow:inset 0 0 0 2px '+(opened?rd.frame:'rgba(255,255,255,.08)')+'" title="'+tip+'">'
      + (opened?('<div class="egg-codex-vis">'+eggSVG(e.el==='any'?'shade':e.el, e.rarity>=3?3:1, e.rarity)+'</div><span class="egg-codex-em">'+e.look.emoji+'</span>'):'<div class="egg-codex-q">?</div>')
      + '</div>';
  }
  const pct=Math.round(found/(list.length||1)*100);
  return '<div class="egg-codex"><div class="egg-codex-head">📖 Кодекс Яиц — открыто <b>'+found+'/'+list.length+'</b> · '+pct+'%</div><div class="egg-codex-grid catalog">'+cells+'</div><div class="egg-codex-foot">🔒 — секретные яйца открываются особыми условиями</div></div>';
}
// СВЯЗЬ: осколки (из исследования/переработки) → ускорение инкубации яиц
function warmEgg(idx){
  const eggs=eggsArray(); if(idx<0||idx>=eggs.length)return; const egg=eggs[idx];
  const need=egg.incNeed||0; if(!need || (egg.inc||0)>=need) return;
  const cost=(egg.rarity||1)*GB.Eggs.warmCostPerRarity;
  if((S.shards||0)<cost){ toast('Нужно больше 🔮 осколков — добудь их в странствиях или переработай яйца.'); return; }
  S.shards-=cost; egg.inc=Math.min(need,(egg.inc||0)+Math.ceil(need*GB.Eggs.warmProgressFrac));
  floatText('🔮 Согрето!','#c9b8ff'); toast(`Яйцо согрето осколками (−🔮${cost}). Инкубация ускорена!`);
  persist(); renderLedger(); renderHatch();
}
// переработка яйца в пыль (яйца НЕ продаются — только переработка)
function recycleEgg(idx){
  const eggs=eggsArray(); if(idx<0||idx>=eggs.length)return;
  const egg=eggs[idx], gain=GB.Eggs.recycleBase+(egg.rarity||1)*GB.Eggs.recyclePerRarity;
  const shards=(egg.rarity||1)>=4 ? (egg.rarity||1)*GB.Eggs.shardsFromRarity : 0;
  eggs.splice(idx,1); S.dust=(S.dust||0)+gain; if(shards)S.shards=(S.shards||0)+shards;
  floatText('♻ +✦'+gain+(shards?' +🔮'+shards:''),'#9fd0ff');
  toast(`Яйцо переработано: <b>✦${gain} пыли</b>${shards?` и <b>🔮${shards} осколков</b>`:''}. Яйца не продаются — только переработка.`);
  if(hatchSel>=eggs.length)hatchSel=Math.max(0,eggs.length-1);
  persist(); renderLedger(); renderHatch();
}
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
    const rd=eggDef(egg), ready=eggIncReady(egg);
    const need=(egg.incNeed!=null)?egg.incNeed:0, cur=Math.min(need,egg.inc||0);
    const incBar = need>0
      ? `<div class="egg-inc"><div class="egg-inc-bar"><i style="width:${Math.round(cur/need*100)}%;background:${rd.frame}"></i></div><span class="egg-inc-t">${ready?'🐣 Готово к вылуплению!':'🥚 Инкубация '+cur+' / '+need}</span></div>`
      : `<div class="egg-tier">${el.name}</div>`;
    return `<div class="carousel-card egg-card" data-idx="${i}">
      <div class="egg-pit">
        <div class="egg-visual" id="eggVis${i}">${eggSVG(egg.el, egg.tier, egg.rarity)}</div>
      </div>
      <div class="egg-info">
        <div class="egg-el" style="color:${rd.frame};font-weight:700">${rd.name} · ${el.name}</div>
        ${incBar}
      </div>
      <button class="btn hatch-one" data-hatch="${i}" ${ready?'':'disabled'}>${ready?'Высидеть 🥚':'🔒 Дозревает'}</button>
      <button class="btn ghost egg-recycle" data-recycle="${i}">♻ +✦${GB.Eggs.recycleBase+(egg.rarity||1)*GB.Eggs.recyclePerRarity}</button>
      ${(need>0 && !ready)?`<button class="btn ghost egg-warm" data-warm="${i}" ${((S.shards||0)>=(egg.rarity||1)*GB.Eggs.warmCostPerRarity)?"":"disabled"}>🔮 Согреть · ${(egg.rarity||1)*GB.Eggs.warmCostPerRarity}</button>`:""}
    </div>`;
  }).join('');
  wrap.innerHTML=`
    <div class="nest-count">В гнезде яиц: <b>${eggs.length}</b></div>
    <div class="carousel">
      <button class="carousel-arrow" id="eggPrev">‹</button>
      <div class="carousel-track" id="eggTrack">${cards}</div>
      <button class="carousel-arrow" id="eggNext">›</button>
    </div>
    <p class="hint" style="text-align:center;margin-top:10px">Редкие яйца дозревают в бою и странствиях — <b>играй, а не жди</b>. Чем выше редкость яйца, тем ценнее окрас и вид дракона.</p>
    ${eggCodexHTML()}`;
  const track=$('#eggTrack');
  const scrollTo=i=>{const card=track.children[i];if(card)card.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});};
  $('#eggPrev').onclick=()=>{hatchSel=Math.max(0,hatchSel-1);scrollTo(hatchSel);};
  $('#eggNext').onclick=()=>{hatchSel=Math.min(eggs.length-1,hatchSel+1);scrollTo(hatchSel);};
  wrap.querySelectorAll('[data-hatch]').forEach(b=>b.onclick=()=>{
    if(arcadeEnabled&&arcadeEnabled())startHatchRhythm(+b.dataset.hatch);
    else hatchEggAt(+b.dataset.hatch,false);
  });
  wrap.querySelectorAll('[data-recycle]').forEach(b=>b.onclick=()=>recycleEgg(+b.dataset.recycle));
  wrap.querySelectorAll('[data-warm]').forEach(b=>b.onclick=()=>warmEgg(+b.dataset.warm));
  setTimeout(()=>scrollTo(hatchSel),30);
}

// высиживание конкретного яйца по индексу; после — гнездо обновляется, показывая остаток
/* ===== МИНИ-ИГРА: РИТМ СЕРДЦА ЯЙЦА =====
   Тапай в такт, когда яйцо «вздувается». 3 точных тапа — идеальный ритм:
   дракончик рождается со всеми сердечками и подарком золота. */
function startHatchRhythm(idx){
  const box=document.createElement('div');
  box.className='rhythm-overlay';
  box.innerHTML=`<div class="enc-card">
    <div class="rhythm-egg" id="rhEgg">🥚</div>
    <div class="enc-name">Слушай сердечко!</div>
    <div class="enc-sub">Нажимай <b>ТУК</b>, когда яйцо раздувается. Три точных тука — идеальный ритм!</div>
    <div class="rhythm-hits" id="rhHits">🤍🤍🤍</div>
    <button id="rhTap">ТУК!</button>
    <button class="ghost" id="rhSkip">Просто высидеть</button>
  </div>`;
  document.body.appendChild(box);
  const egg=box.querySelector('#rhEgg'), hitsEl=box.querySelector('#rhHits');
  let hits=0, tries=0, raf=0;
  const t0=performance.now(), PERIOD=900;
  function phase(now){ return Math.sin((now-t0)/PERIOD*Math.PI*2); }
  function tick(now){
    const k=1+Math.max(0,phase(now))*0.35;
    egg.style.transform='scale('+k.toFixed(3)+')';
    raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
  function finish(perfect){ cancelAnimationFrame(raf); box.remove(); hatchEggAt(idx,perfect); }
  box.querySelector('#rhSkip').onclick=()=>finish(false);
  box.querySelector('#rhTap').onclick=()=>{
    tries++;
    if(phase(performance.now())>0.6){
      hits++; hitsEl.textContent='💖'.repeat(hits)+'🤍'.repeat(Math.max(0,3-hits));
      if(hits>=3) return finish(true);
    } else {
      egg.style.filter='grayscale(.5)'; setTimeout(()=>{egg.style.filter='';},200);
    }
    if(tries>=8) finish(hits>=3);
  };
}

function hatchEggAt(idx,perfectRhythm){
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
    // наследование: редкость яйца → окрас и титул дракона
    const egRar=(typeof eggRarity==='function')?eggRarity(egg):1;
    if(egRar>=2){ if(typeof rollMorphByEggRarity==='function') d.morph=rollMorphByEggRarity(egRar);
      d.eggRarity=egRar; const _rd=EGG_RARITY[egRar]; if(_rd&&_rd.title) d.title=_rd.title; }
    const m=morphById(d.morph);
    floatText('🎉',ELEMENTS[sp.el].color);
    const morphTxt = m.id==='common' ? '' : ` <span style="color:${m.swatch}">· окрас «${m.name}»${m.shiny?' ✨':''}</span>`;
    sfx('hatch');
    if(perfectRhythm){ d.happy=HAPPY_MAX; S.gold+=25; floatText('💖 Идеальный ритм!','#cf6e8f'); }
    toast(`Вылупился <b>${sp.name}</b>! ${RARITY_STAR(sp.rarity)}${morphTxt} · характер «${natureById(d.nature).name}» ${perfectRhythm?'<span style="color:#cf6e8f">· 💖 идеальный ритм: +25🪙 и полное счастье!</span>':''} ${wasNew?'<span style="color:var(--gold)">· новый вид!</span>':''}`);
    questEvent('hatch');
    // курсор карусели остаётся на месте (следующее яйцо из остатка)
    if(hatchSel>=eggs.length) hatchSel=Math.max(0,eggs.length-1);
    persist();
    renderLedger();
    renderHatch(); // гнездо обновляется: остаток яиц или пустое гнездо
  },500);
}


/* ============================================================
   GAME FEEL v2 — Активная стая + Заповедник: один экран, быстрая замена
   ============================================================ */
const _flockFilter={el:null,fav:false,onlyNew:false,sort:'level'};
function openFlockManager(){
  let sh=document.getElementById('flockSheet');
  if(!sh){ sh=document.createElement('div'); sh.id='flockSheet';
    sh.innerHTML='<div class="fs-panel" id="flockPanel"></div>';
    document.body.appendChild(sh);
    sh.addEventListener('click',e=>{ if(e.target===sh) closeFlockManager(); }); }
  sh.classList.add('show'); renderFlockSheet();
}
function closeFlockManager(){ const sh=document.getElementById('flockSheet'); if(sh) sh.classList.remove('show'); }
function _flockCell(d,inFlock){ const sp=speciesById(d.id);
  const em=(sp&&sp.sigil)||'🐉';
  const star=d.fav?'⭐':'';
  const nw=d.isNew?'<span class="fc-badge">🆕</span>':'';
  return `<button class="${inFlock?'flock-slot':'sanc-cell'} tap${d.fav?' fav':''}" data-uid="${d.uid}">`
    +`${inFlock?'':nw}<span class="fc-em">${em}</span>`
    +`<span class="fc-nm">${star}${dragonName(d)}</span>`
    +`<span class="fc-lv">ур.${d.level} ${RARITY_STAR?('· '+RARITY_STAR(sp.rarity)):''}</span>`
    +`<span class="fc-act">${inFlock?'→ заповедник':'↩ в стаю'}</span></button>`;
}
function _sancFiltered(){
  let list=S.dragons.filter(d=>d.reserve);
  if(_flockFilter.el) list=list.filter(d=>speciesById(d.id).el===_flockFilter.el);
  if(_flockFilter.fav) list=list.filter(d=>d.fav);
  if(_flockFilter.onlyNew) list=list.filter(d=>d.isNew);
  const sp=id=>speciesById(id);
  if(_flockFilter.sort==='level') list.sort((a,b)=>b.level-a.level);
  else if(_flockFilter.sort==='rarity') list.sort((a,b)=>sp(b.id).rarity-sp(a.id).rarity);
  return list;
}
function renderFlockSheet(){
  const panel=document.getElementById('flockPanel'); if(!panel)return;
  const cap=(typeof lairCap==='function')?lairCap():4;
  const flock=S.dragons.filter(d=>!d.reserve);
  const els=[['fire','🔥'],['frost','🧊'],['venom','🟢'],['storm','⚡'],['shade','🌑']];
  let slots='';
  flock.forEach(d=>slots+=_flockCell(d,true));
  for(let i=flock.length;i<cap;i++) slots+='<div class="flock-empty">＋</div>';
  const chips=`<div class="filter-row">`
    +`<button class="filter-chip tap${!_flockFilter.el?' on':''}" data-el="">Все</button>`
    +els.map(([e,ic])=>`<button class="filter-chip tap${_flockFilter.el===e?' on':''}" data-el="${e}">${ic}</button>`).join('')
    +`<button class="filter-chip tap${_flockFilter.fav?' on':''}" data-t="fav">⭐</button>`
    +`<button class="filter-chip tap${_flockFilter.onlyNew?' on':''}" data-t="new">🆕</button>`
    +`<button class="filter-chip tap${_flockFilter.sort==='rarity'?' on':''}" data-t="sort">↕${_flockFilter.sort==='rarity'?'редк.':'ур.'}</button>`
    +`</div>`;
  const sanc=_sancFiltered();
  panel.innerHTML=`
    <div class="fs-head"><h3>Стая и Заповедник</h3><button class="fs-close tap" id="fsClose">✕</button></div>
    <div class="fs-section-t">🏰 Активная стая · ${flock.length}/${cap}</div>
    <div class="flock-strip" id="fsFlock">${slots}</div>
    <div class="fs-section-t">🌿 Заповедник · ${sanc.length}</div>
    ${chips}
    <div class="sanc-grid" id="fsSanc">${sanc.length?sanc.map(d=>_flockCell(d,false)).join(''):'<div class="empty" style="grid-column:1/-1">Пусто по фильтру.</div>'}</div>`;
  panel.querySelector('#fsClose').onclick=closeFlockManager;
  // клики по стае → в заповедник
  panel.querySelectorAll('#fsFlock .flock-slot').forEach(b=>b.onclick=()=>{ toggleReserve(+b.dataset.uid); renderFlockSheet(); });
  // клики по заповеднику → в стаю (+снять «новый»)
  panel.querySelectorAll('#fsSanc .sanc-cell').forEach(b=>{
    let hold=null;
    b.onclick=()=>{ const d=S.dragons.find(x=>x.uid===+b.dataset.uid); if(d)d.isNew=false; toggleReserve(+b.dataset.uid); renderFlockSheet(); };
    // долгое нажатие — избранное
    b.addEventListener('touchstart',()=>{ hold=setTimeout(()=>{ _toggleFav(+b.dataset.uid); },500); },{passive:true});
    b.addEventListener('touchend',()=>clearTimeout(hold));
    b.oncontextmenu=(e)=>{ e.preventDefault(); _toggleFav(+b.dataset.uid); };
  });
  // фильтры
  panel.querySelectorAll('.filter-chip').forEach(c=>c.onclick=()=>{
    if(c.dataset.el!==undefined && c.dataset.el!==null && c.hasAttribute('data-el')) _flockFilter.el=c.dataset.el||null;
    else if(c.dataset.t==='fav') _flockFilter.fav=!_flockFilter.fav;
    else if(c.dataset.t==='new') _flockFilter.onlyNew=!_flockFilter.onlyNew;
    else if(c.dataset.t==='sort') _flockFilter.sort=_flockFilter.sort==='level'?'rarity':'level';
    renderFlockSheet();
  });
}
function _toggleFav(uid){ const d=S.dragons.find(x=>x.uid===uid); if(!d)return; d.fav=!d.fav;
  if(typeof toast==='function')toast(d.fav?'⭐ В избранном':'Убрано из избранного'); if(typeof persist==='function')persist(); renderFlockSheet(); }
