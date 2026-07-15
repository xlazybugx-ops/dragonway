/* ============================================================
   06c-hubmap.js — ХАБ = ТОЛЬКО КАРТА (v37, UI-ревизия «игра, не сайт»)
   Переопределяет renderHub() из 06-world.js (грузится позже, старые файлы
   не тронуты). Экран хаба: карта поселения на весь экран между баром
   ресурсов (сверху) и навигацией (снизу). Никаких панелей и карточек —
   Сокровищница, Рынок и Украшения стали точками на самой карте,
   «следующий шаг» — тонкая плашка поверх карты.
   ============================================================ */
'use strict';

/* дополнительные точки на карте (проценты, как HUB_SPOTS) */
function hubExtraSpots(){
  const ex=[
    {act:'treasury', label:'Сокровищница', icon:'🎁', x:12, y:8,  w:22, h:9,
      badge:(S.chestReady?'!':(typeof chestCount==='function'&&chestCount()?chestCount():''))},
    {act:'market',   label:'Рынок',        icon:'🛒', x:88, y:8,  w:20, h:9, badge:''},
  ];
  if((S.decorOwned||[]).length)
    ex.push({act:'deco', label:'Украшения', icon:'🎨', x:50, y:8, w:20, h:9, badge:''});
  return ex;
}

function hubQuestRows(){
  const list=Array.isArray(S.quests)?S.quests:[];
  return list.map(q=>{
    const def=questDef(q.id), pct=Math.min(100,Math.round((q.prog||0)/Math.max(1,q.goal)*100));
    return `<div class="hub-task-row${q.done?' done':''}"><span class="htr-icon">${def.icon}</span><span class="htr-main"><b>${def.text}</b><i><span style="width:${pct}%"></span></i><small>${q.prog}/${q.goal} · ${rewardText(def.reward)}</small></span>${q.claimed?'<span class="htr-ok">✓</span>':q.done?`<button data-hub-claim="${q.id}">Забрать</button>`:''}</div>`;
  }).join('')||'<div class="hub-task-empty">Новые задачи появятся завтра.</div>';
}
function hubBonusRows(){
  const happy=(S.dragons||[]).filter(d=>(d.happy||0)>=HAPPY_MAX).length;
  const equipped=(S.dragons||[]).filter(d=>d.equip&&Object.values(d.equip).some(Boolean)).length;
  const rows=[];
  if(S.chestReady)rows.push('🎁 Подарок дня готов');
  if(happy)rows.push(`💖 Максимальная забота: ${happy}`);
  if(equipped)rows.push(`🧿 С артефактами: ${equipped}`);
  return rows.length?rows.map(x=>`<span>${x}</span>`).join(''):'<span>Активных временных бонусов нет</span>';
}
function setHubTasksOpen(open){
  const d=$('#hubTaskDrawer');if(!d)return;d.classList.toggle('open',open);d.setAttribute('aria-expanded',String(open));
}
function bindHubTaskDrawer(){
  const wrap=$('#hubWrap'),drawer=$('#hubTaskDrawer'),handle=$('#hubTaskHandle');if(!wrap||!drawer||!handle)return;
  handle.onclick=()=>setHubTasksOpen(!drawer.classList.contains('open'));
  drawer.querySelectorAll('[data-hub-claim]').forEach(b=>b.onclick=()=>{claimQuest(b.dataset.hubClaim);renderHub();setTimeout(()=>setHubTasksOpen(true),0);});
  let sy=0,sx=0,tracking=false;
  wrap.addEventListener('pointerdown',e=>{sy=e.clientY;sx=e.clientX;tracking=true;},{passive:true});
  wrap.addEventListener('pointerup',e=>{if(!tracking)return;tracking=false;const dy=e.clientY-sy,dx=e.clientX-sx;
    if(Math.abs(dy)<55||Math.abs(dy)<Math.abs(dx)*1.2)return;
    if(dy>0&&sy<180)setHubTasksOpen(true);else if(dy<0&&drawer.classList.contains('open'))setHubTasksOpen(false);
  },{passive:true});
}

function renderHub(){
  S._treasuryOpen=false;
  const wrap=$('#hubWrap'); if(!wrap) return;
  // основные постройки (существующие HUB_SPOTS + бейджи)
  const spots=HUB_SPOTS.map(sp=>{
    const badge=hubBadge(sp.v);
    return `<button class="hub-zone" data-go="${sp.v}"
        style="left:${sp.x}%;top:${sp.y}%;width:${sp.w}%;height:${sp.h}%">
      <span class="hub-zone-label">${sp.label}</span>
      ${badge?`<span class="hub-zone-badge">${badge}</span>`:''}
    </button>`;
  }).join('');
  // сервисные точки — теперь часть карты, а не кнопки-панели
  // размещённые украшения
  const decos=(S.decorations&&typeof S.decorations==='object')?S.decorations:{};
  const decoEls=DECO_SLOTS.map(slot=>{
    const decoId=decos[slot.i]; if(!decoId) return '';
    const deco=decorById(decoId); if(!deco) return '';
    return `<div class="hub-deco" style="left:${slot.x}%;top:${slot.y}%" title="${deco.name}">${deco.icon}</div>`;
  }).join('');
  // одна тонкая плашка-подсказка вместо карточки «Следующий шаг»
  const ns=(typeof nextStep==='function')?nextStep():null;
  const chip=ns?`<button class="hub-next-chip tap" id="nextStepBtn" aria-label="Следующий шаг: ${ns.title}">
    <span class="hn-icon">${ns.icon}</span><span class="hn-copy"><small>Следующий шаг</small><b>${ns.title}</b>${ns.why?`<em>${ns.why}</em>`:''}</span><span class="hn-arrow">›</span>
  </button>`:'';
  const taskDrawer=`<aside class="hub-task-drawer" id="hubTaskDrawer" aria-expanded="false">
    <button class="hub-task-handle" id="hubTaskHandle" aria-label="Открыть или закрыть задачи"><span></span><b>Задачи и бонусы</b><em>${(S.quests||[]).filter(q=>q.done&&!q.claimed).length||''}</em></button>
    <div class="hub-task-body"><section><h3>Квестовые задачи</h3>${hubQuestRows()}</section><section><h3>Активные бонусы</h3><div class="hub-bonus-list">${hubBonusRows()}</div></section><section><h3>Подсказка</h3><p>${ns?(ns.icon+' '+ns.title+(ns.why?' — '+ns.why:'')):'Исследуй мир и развивай свою стаю.'}</p></section></div>
  </aside>`;
  const serviceBar=`<div class="hub-service-bar" aria-label="Сервисы поселения">
    <button data-act="treasury">🎁<span>Сокровища</span>${S.chestReady?'<b>!</b>':''}</button>
    <button data-act="deco">◇<span>Украшения</span></button>
    <button data-act="market">◈<span>Рынок</span></button>
  </div>`;
  const isNewTasks=S.questDay&&S.hubQuestSeenDay!==S.questDay;
  const peek=isNewTasks?`<div class="hub-task-peek" id="hubTaskPeek"><b>Новые задачи</b>${(S.quests||[]).slice(0,3).map(q=>`<span>${questDef(q.id).icon} ${questText(q.id)}</span>`).join('')}<small>Свайпни вниз, чтобы открыть список</small></div>`:'';

  wrap.innerHTML=`
    <div class="hub-stage hub-stage-photo hub-full">
      <img class="hub-bg" src="images/hub_bg.webp" decoding="async" alt=""
        onerror="this.style.display='none';this.parentNode.classList.add('hub-bg-fallback')">
      ${decoEls}
      ${spots}
      ${taskDrawer}
      ${peek}
      ${chip}
      ${serviceBar}
    </div>`;
  wrap.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>switchView(b.dataset.go));
  wrap.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{
    if(b.dataset.act==='treasury'&&typeof openTreasury==='function')openTreasury();
    if(b.dataset.act==='market'&&typeof openMarket==='function')openMarket();
    if(b.dataset.act==='deco'&&typeof openDecorManager==='function')openDecorManager();
  });
  const nsb=$('#nextStepBtn'); if(nsb) nsb.onclick=()=>{ const n=nextStep(); if(n&&n.fn)n.fn(); };
  bindHubTaskDrawer();
  if(isNewTasks){S.hubQuestSeenDay=S.questDay;persist();setTimeout(()=>{const p=$('#hubTaskPeek');if(p)p.classList.add('hide');},4200);}
}
