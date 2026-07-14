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
  const extras=hubExtraSpots().map(sp=>
    `<button class="hub-zone hub-zone-svc" data-act="${sp.act}"
        style="left:${sp.x}%;top:${sp.y}%;width:${sp.w}%;height:${sp.h}%">
      <span class="hub-zone-label">${sp.icon} ${sp.label}</span>
      ${sp.badge?`<span class="hub-zone-badge">${sp.badge}</span>`:''}
    </button>`).join('');
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

  wrap.innerHTML=`
    <div class="hub-stage hub-stage-photo hub-full">
      <img class="hub-bg" src="images/hub_bg.webp" decoding="async" alt=""
        onerror="this.style.display='none';this.parentNode.classList.add('hub-bg-fallback')">
      ${decoEls}
      ${spots}
      ${extras}
      ${chip}
    </div>`;
  wrap.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>switchView(b.dataset.go));
  wrap.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{
    if(b.dataset.act==='treasury'&&typeof openTreasury==='function')openTreasury();
    if(b.dataset.act==='market'&&typeof openMarket==='function')openMarket();
    if(b.dataset.act==='deco'&&typeof openDecorManager==='function')openDecorManager();
  });
  const nsb=$('#nextStepBtn'); if(nsb) nsb.onclick=()=>{ const n=nextStep(); if(n&&n.fn)n.fn(); };
}
