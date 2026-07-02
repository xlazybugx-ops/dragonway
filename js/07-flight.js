/* ============================================================
   07-flight.js — ПОЛЁТ: экспедиция по точкам интереса, мини-игра «поймай добычу»
   Драконис · Кодекс Чешуи
   ============================================================ */
/* ===== ПОЛЁТ-ИССЛЕДОВАНИЕ ===== */
let flight=null; // {region, d, pois:[{x,y,kind,icon,label,done}], busy}

function rollPOIs(region){
  const n=rnd(3,4);
  const pois=[];
  // позиции точек: распределяем по сцене, избегая краёв и зоны старта
  const slots=[[22,38],[44,30],[66,42],[80,62],[34,64],[58,66]];
  // перемешиваем слоты
  for(let i=slots.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]];}
  for(let i=0;i<n;i++){
    // взвешенный выбор типа
    const total=POI_TYPES.reduce((a,t)=>a+t.weight,0);
    let r=Math.random()*total, pick=POI_TYPES[0];
    for(const t of POI_TYPES){ if((r-=t.weight)<=0){pick=t;break;} }
    const [x,y]=slots[i];
    pois.push({x,y,kind:pick.kind,icon:pick.icon,label:pick.label,done:false});
  }
  return pois;
}

function startFlight(region,d){
  flight={region, d, pois:rollPOIs(region), busy:false, stats:{gold:0,eggs:0,relics:0,xp:0,caught:0,beasts:0}};
  document.body.classList.add('flight-active');
  const fs=$('#flightFs'); if(fs) fs.style.display='block';
  renderFlight();
}

function renderFlight(){
  const f=flight;
  const fs=$('#flightFs');
  if(!fs){ return; }
  const region=f.region;
  const left=f.pois.filter(p=>!p.done).length;
  fs.innerHTML=`
    <div class="flight-stage" id="flightStage">
      ${mapSVG(region.scene, region.id+'-fly')}
      <div class="flight-dragon topdragon" id="flightDragon" style="filter:${morphById(f.d.morph).filter||'none'}">${topDragonSVG(f.d.id)}</div>
      ${f.pois.map((p,i)=>`<button class="poi${p.done?' poi-done':''}" data-poi="${i}"
          style="left:${p.x}%;top:${p.y}%" ${f.busy||p.done?'disabled':''}>
          <span class="poi-ic">${p.done?'✓':p.icon}</span>
          <span class="poi-ring"></span></button>`).join('')}
      <div class="flight-hud-top">
        <div class="flight-title">${region.biome} · ${dragonName(f.d)}</div>
        <div class="flight-left">Осталось точек: ${left}</div>
      </div>
      <div class="flight-hud-bottom">
        <div class="flight-tip" id="flightTip">${left? '✨ Нажми на светящуюся точку — дракон подлетит и исследует её!' : '🏁 Все точки исследованы!'}</div>
        <button class="btn ghost" id="flightDone">${left?'Закончить полёт':'Завершить'}</button>
      </div>
    </div>`;
  positionDragon(50, 60, true);
  $$('#flightStage .poi').forEach(btn=>btn.onclick=()=>flyTo(+btn.dataset.poi));
  $('#flightDone').onclick=()=>finishFlight();
}

// мгновенно/плавно поставить дракона в координаты (% сцены)
function positionDragon(xPct, yPct, instant){
  const dr=$('#flightDragon'); if(!dr) return;
  // вид сверху: разворачиваем дракона носом по направлению движения
  const prevX=parseFloat(dr.dataset.x||'50'), prevY=parseFloat(dr.dataset.y||'60');
  const angle=Math.atan2(yPct-prevY, xPct-prevX)*180/Math.PI + 90; // +90: дракон нарисован носом вверх
  dr.dataset.x=xPct; dr.dataset.y=yPct;
  if(instant) dr.style.transition='none'; else dr.style.transition='left 1s ease, top 1s ease, transform .4s ease';
  dr.style.left=xPct+'%'; dr.style.top=yPct+'%';
  dr.style.transform=`translate(-50%,-50%) rotate(${instant?0:angle}deg)`;
  if(instant){ void dr.offsetWidth; dr.style.transition='left 1s ease, top 1s ease, transform .4s ease'; }
}

function flyTo(idx){
  const f=flight; if(f.busy) return;
  const p=f.pois[idx]; if(p.done) return;
  f.busy=true;
  $$('#flightStage .poi').forEach(b=>b.disabled=true);
  const tip=$('#flightTip'); if(tip) tip.textContent='🐉 Дракон летит...';
  positionDragon(p.x, p.y);
  setTimeout(()=>resolvePOI(idx), 1050);
}

function resolvePOI(idx){
  const f=flight, p=f.pois[idx], d=f.d, region=f.region;
  // у точки появляется вспышка
  floatText(p.icon, '#d9a441');
  if(p.kind==='beast'){
    p.done=true; f.busy=false;
    const lvl=Math.max(1, d.level + rnd(-1,1));
    const sp=weightedSpecies();
    const foeMorph=rollMorph();
    const reward=Math.round(lvl*(10+sp.rarity*4));
    toast(`👹 Из логова выходит дикий ${sp.name}! Защити себя в бою.`);
    grantXp(d, rnd(region.xp[0],region.xp[1])/2|0);
    // прячем полноэкранный полёт на время боя, после боя — возвращаемся
    const fs=$('#flightFs'); if(fs) fs.style.display='none';
    document.body.classList.remove('flight-active');
    setTimeout(()=>{ S.arenaPick=d.uid; switchView('arena'); battle && (battle.fromFlight=true); startBattle(d,{id:sp.id,level:lvl,morph:foeMorph},reward); if(battle) battle.fromFlight=true; }, 600);
    return;
  }
  if(p.kind==='choice'){
    showPOIChoice(idx);
    return; // выбор продолжит f.busy до решения
  }
  // обычные находки
  let msg='';
  const xp=rnd(region.xp[0],region.xp[1])/2|0;
  const leveled=grantXp(d,xp);
  f.stats.xp+=xp;
  if(p.kind==='treasure'){
    const g=rnd(region.gold[0],region.gold[1]);
    S.gold+=g; f.stats.gold+=g; msg=`Найдено <b>${g}🪙</b>!`;
  } else if(p.kind==='egg'){
    addEgg(region.el,region.biomeN); f.stats.eggs++; msg='Найдено <b>🥚 яйцо '+ELEMENTS[region.el].name+'</b>!';
  } else if(p.kind==='relic'){
    const art=biomeArtifact(region);
    addArtifact(art.id,1); f.stats.relics++; msg=`Внутри реликвия <b>${art.icon} ${art.name}</b>!`;
  } else if(p.kind==='chest'){
    const tier=region.biomeN||1;
    addChest(tier);
    const ct=chestType(tier);
    msg=`Найден <b>${ct.icon} ${ct.name}</b>! Открой его в поселении ключом или в кузне.`;
  } else if(p.kind==='key'){
    const tier=region.biomeN||1;
    addKey(tier);
    const ct=chestType(tier);
    msg=`Найден <b>${ct.keyIcon} ${ct.keyName}</b>! Им можно открыть ${ct.name.toLowerCase()}.`;
  } else if(p.kind==='scroll'){
    const scr=grantScroll(region.worldId, region.biomeN);
    if(scr){
      msg=`Найден свиток «<b>${scr.title}</b>»! ${scr.hint?'📜 Он хранит подсказку.':'Прочти его в Кодексе.'}`;
    } else {
      const g=rnd(region.gold[0],region.gold[1]);
      S.gold+=g; f.stats.gold+=g;
      msg=`Свиток этого мира уже собран. Вместо него — <b>${g}🪙</b>.`;
    }
  } else if(p.kind==='friend'){
    const g=rnd(region.gold[0],region.gold[1])/2|0;
    S.gold+=g; f.stats.gold+=g; if(Math.random()<0.4){addEgg(region.el,region.biomeN);f.stats.eggs++;}
    d.happy=Math.min(HAPPY_MAX,(d.happy||0)+1);
    msg=`Зверёк подружился с драконом! +${g}🪙 и капелька радости 💖`;
  }
  const sub=`+${xp} опыта`+(leveled?' · <span style="color:var(--gold)">новый уровень!</span>':'');
  // мини-игра «поймай добычу» (если включена) — даёт бонусное золото
  if(arcadeEnabled()){
    startCatchGame(region, (bonus)=>{
      if(bonus>0){ S.gold+=bonus; f.stats.gold+=bonus; f.stats.caught++; msg+=` <span style="color:var(--gold)">+${bonus}🪙 за ловкость!</span>`; }
      finishPOI(idx, msg, sub);
    });
  } else {
    finishPOI(idx, msg, sub);
  }
}

/* ===== МИНИ-ИГРА: ПОЙМАЙ ДОБЫЧУ ===== */
function startCatchGame(region, done){
  const stage=$('#flightStage'); if(!stage){done(0);return;}
  const overlay=document.createElement('div');
  overlay.className='catch-overlay';
  const total=rnd(4,6);
  let caught=0, spawned=0, remaining=total;
  const perSpark=Math.max(3, Math.round((region.gold[0]+region.gold[1])/2/6));
  overlay.innerHTML=`
    <div class="catch-head"><div class="catch-title">✨ Лови добычу!</div><div class="catch-count" id="catchCount">Поймано: 0</div></div>
    <div class="catch-foot"><button class="btn ghost" id="catchSkip">Пропустить</button></div>`;
  stage.appendChild(overlay);
  function finishGame(){
    overlay.remove();
    done(caught*perSpark);
  }
  $('#catchSkip').onclick=()=>finishGame();
  function spawnSpark(){
    if(spawned>=total) return;
    spawned++;
    const sp=document.createElement('div');
    sp.className='catch-spark';
    const icons=['💎','🪙','✨','⭐','🟡'];
    sp.textContent=icons[Math.floor(Math.random()*icons.length)];
    const x=10+Math.random()*78, y=24+Math.random()*56;
    sp.style.left=x+'%'; sp.style.top=y+'%';
    let alive=true;
    const ttl=setTimeout(()=>{ if(alive){alive=false;sp.remove();checkDone();} }, 1100+Math.random()*700);
    sp.onclick=()=>{
      if(!alive)return; alive=false; clearTimeout(ttl);
      caught++;
      floatText('+'+perSpark+'🪙','#ffd24a');
      const cc=$('#catchCount'); if(cc)cc.textContent='Поймано: '+caught;
      sp.remove(); checkDone();
    };
    overlay.appendChild(sp);
    if(spawned<total) setTimeout(spawnSpark, 350+Math.random()*350);
  }
  function checkDone(){
    remaining--;
    if(remaining<=0) setTimeout(finishGame, 250);
  }
  spawnSpark();
}

function showPOIChoice(idx){
  const f=flight, region=f.region;
  const ch=pick(POI_CHOICES);
  f._choice={idx, ch};
  const stage=$('#flightStage');
  const box=document.createElement('div');
  box.className='poi-choice';
  box.innerHTML=`<div class="poi-choice-card">
    <div class="poi-choice-q">${ch.q}</div>
    <div class="poi-choice-opts">
      <button class="btn" data-c="a">${ch.a.t}</button>
      <button class="btn" data-c="b">${ch.b.t}</button>
    </div></div>`;
  stage.appendChild(box);
  box.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{
    const opt = b.dataset.c==='a'?ch.a:ch.b;
    box.remove();
    applyChoiceReward(idx, opt.reward);
  });
}

function applyChoiceReward(idx, reward){
  const f=flight, region=f.region, d=f.d;
  let msg='';
  const xp=rnd(region.xp[0],region.xp[1])/2|0;
  const leveled=grantXp(d,xp); f.stats.xp+=xp;
  if(reward==='gold'){const g=rnd(region.gold[0],region.gold[1]);S.gold+=g;f.stats.gold+=g;msg=`+<b>${g}🪙</b>!`;}
  else if(reward==='dust'){const du=rnd(8,18);S.dust+=du;msg=`+<b>${du}✦ пыли</b>!`;}
  else if(reward==='egg'){addEgg(region.el,region.biomeN);f.stats.eggs++;msg='Найдено <b>🥚 яйцо</b>!';}
  else if(reward==='relic'){const art=biomeArtifact(region);addArtifact(art.id,1);f.stats.relics++;msg=`Реликвия <b>${art.icon} ${art.name}</b>!`;}
  finishPOI(idx, msg, `+${xp} опыта`+(leveled?' · <span style="color:var(--gold)">новый уровень!</span>':''));
}

function finishPOI(idx, msg, sub){
  const f=flight;
  f.pois[idx].done=true;
  f.busy=false;
  floatText('+'+'🪙','#d9a441');
  toast(`${msg} <span style="color:var(--ink-dim)">${sub}</span>`);
  questEvent('explore'); persist();
  renderFlight();
  // если всё исследовано — мягко подсветим завершение
  const left=f.pois.filter(p=>!p.done).length;
  if(left===0){ setTimeout(()=>{ const t=$('#flightTip'); if(t) t.textContent='🏁 Молодец! Все точки исследованы.'; }, 100); }
}

// показать статистику полёта поверх карты + кнопки навигации
function finishFlight(){
  const f=flight;
  const fs=$('#flightFs');
  if(!fs || !f){ exitFlight(); return; }
  const s=f.stats;
  const explored=f.pois.filter(p=>p.done).length;
  const rows=[
    ['🗺️','Исследовано точек', explored+' / '+f.pois.length],
    ['🪙','Золота добыто', s.gold],
    ['🥚','Яиц найдено', s.eggs],
    ['📿','Реликвий найдено', s.relics],
    ['👹','Побед в стычках', s.beasts],
    ['✨','Поймано добычи', s.caught],
    ['⭐','Опыта получено', s.xp],
  ];
  const overlay=document.createElement('div');
  overlay.className='flight-end';
  overlay.innerHTML=`
    <div class="flight-end-card">
      <div class="flight-end-title">🏁 Полёт завершён!</div>
      <div class="flight-end-sub">${dragonName(f.d)} вернулся из странствия по землям «${f.region.biome}»</div>
      <div class="flight-end-stats">
        ${rows.map(r=>`<div class="fe-row"><span class="fe-ic">${r[0]}</span><span class="fe-label">${r[1]}</span><span class="fe-val">${r[2]}</span></div>`).join('')}
      </div>
      <div class="flight-end-btns">
        <button class="btn" id="feMap">🗺️ К выбору земель</button>
        <button class="btn ghost" id="feHub">🏠 На главную</button>
      </div>
    </div>`;
  fs.appendChild(overlay);
  $('#feMap').onclick=()=>{ exitFlight(); switchView('explore'); };
  $('#feHub').onclick=()=>{ exitFlight(); switchView('hub'); };
}

// выход из полноэкранного полёта
function exitFlight(){
  flight=null;
  document.body.classList.remove('flight-active');
  const fs=$('#flightFs'); if(fs){ fs.style.display='none'; fs.innerHTML=''; }
  renderAll();
  renderMap();
}

