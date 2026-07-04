/* ============================================================
   07-flight.js — ПОЛЁТ: свободный полёт на канвасе (джойстик/WASD),
   ярусы-экраны с нарисованными картами и порталами между ними,
   сбор находок, звери-логова (реальные бои).
   Механика и карты перенесены из демо «Полёт над Эмберричем».
   Драконис · Кодекс Чешуи
   ============================================================ */
let flight=null; // {region, d, stats, ... состояние карты и дракона}

/* ===== НАРИСОВАННЫЕ КАРТЫ ЯРУСОВ (из демо) =====
   Имена: images/fly_{scene}_{ярус}.webp. Если файла нет —
   игра сама нарисует процедурный фон, ничего не сломается. */
const FLY_MAPS={
  fire:['images/fly_fire_1.webp','images/fly_fire_2.webp','images/fly_fire_3.webp'],
};
function loadFlyMap(scene,tier,cb){
  const list=FLY_MAPS[scene], src=list&&list[tier-1];
  if(!src)return cb(null);
  const i=new Image(); i.onload=()=>cb(i); i.onerror=()=>cb(null); i.src=src;
}

/* ===== ПАЛИТРЫ ПРОЦЕДУРНЫХ ФОНОВ ПО СЦЕНАМ (запасной вариант) ===== */
const FLY_PAL={
  fire:  {base:'#2a1810', land:'#6e3a1e', land2:'#8a4a22', river:'#e0633a', glow:'#ffb46a', speck:'#ffd76a'},
  jungle:{base:'#1a2417', land:'#3f6b34', land2:'#4f7d3e', river:'#2f9d7a', glow:'#9fd47a', speck:'#d4ff8a'},
  ice:   {base:'#1e2a36', land:'#5a7e96', land2:'#6f93aa', river:'#8fc4de', glow:'#cfeaf7', speck:'#eaf7ff'},
  shade: {base:'#180f22', land:'#3f3458', land2:'#514470', river:'#8a4a9e', glow:'#b88adf', speck:'#e8d6ff'},
};

/* фон карты рисуем один раз в офф-скрин канвас — резко и без затрат в кадре */
function flyBackground(scene, W, H, seedStr){
  const P=FLY_PAL[scene]||FLY_PAL.fire;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d');
  const r=seeded((seedStr||scene).split('').reduce((a,ch)=>a+ch.charCodeAt(0),7));
  x.fillStyle=P.base; x.fillRect(0,0,W,H);
  // крупные участки суши
  for(let i=0;i<14;i++){
    const cx=r()*W, cy=r()*H, rad=W*0.10+r()*W*0.16;
    const g=x.createRadialGradient(cx,cy,rad*0.15,cx,cy,rad);
    g.addColorStop(0,i%3?P.land:P.land2); g.addColorStop(1,'rgba(0,0,0,0)');
    x.globalAlpha=.5; x.fillStyle=g; x.beginPath(); x.ellipse(cx,cy,rad,rad*0.72,r()*3,0,7); x.fill();
  }
  x.globalAlpha=1;
  // извилистая река/лава
  x.strokeStyle=P.river; x.lineCap='round'; x.globalAlpha=.6;
  for(const wdt of [W*0.02,W*0.012]){
    x.lineWidth=wdt; x.beginPath();
    let px=W*(0.2+r()*0.6), py=-20;
    x.moveTo(px,py);
    while(py<H+20){ py+=H*0.12; px+=(r()-0.5)*W*0.3; px=Math.max(W*0.1,Math.min(W*0.9,px));
      x.quadraticCurveTo(px+(r()-0.5)*W*0.12, py-H*0.06, px, py); }
    x.stroke(); x.globalAlpha=.35;
  }
  x.globalAlpha=1;
  // искры-точки
  x.fillStyle=P.speck;
  for(let i=0;i<130;i++){ x.globalAlpha=.06+r()*.16;
    x.beginPath(); x.arc(r()*W, r()*H, 1+r()*2.4, 0, 7); x.fill(); }
  // свечение у вершины (зона портала)
  const gg=x.createRadialGradient(W/2,60,20,W/2,60,W*0.5);
  gg.addColorStop(0,P.glow); gg.addColorStop(1,'rgba(0,0,0,0)');
  x.globalAlpha=.22; x.fillStyle=gg; x.fillRect(0,0,W,H*0.3);
  // виньетка
  x.globalAlpha=1;
  const v=x.createRadialGradient(W/2,H/2,Math.min(W,H)*0.45,W/2,H/2,Math.max(W,H)*0.75);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.45)');
  x.fillStyle=v; x.fillRect(0,0,W,H);
  return c;
}

/* спрайт дракона (вид сверху) из SVG → Image */
function flySprite(speciesId){
  const img=new Image();
  img.src='data:image/svg+xml;utf8,'+encodeURIComponent(topDragonSVG(speciesId).replace(/class="[^"]*"/g,''));
  return img;
}
/* нарисованный PNG-спрайт полёта, если есть (images/{вид}_fly.png) */
function flySpritePng(speciesId){
  const img=new Image(); img.src=`images/${speciesId}_fly.png`; return img;
}

/* ===== СТАРТ ПОЛЁТА ===== */
function startFlight(region,d){
  flight={
    region, d,
    worldObj:(typeof WORLDS!=='undefined'&&WORLDS.find(w=>w.id===region.worldId))||null,
    stats:{gold:0,eggs:0,relics:0,xp:0,caught:0,beasts:0}, // накапливается по всем ярусам
    cnt:{treasure:0,scroll:0}, beasts:0,                    // цели текущего яруса
    W:0,H:0,items:[],storms:[],dens:[],wilds:[],floats:[],clouds:[],
    drag:null, stam:140, portal:null, paused:true, ended:false,
    raf:0, ac:null, _pend:null, battleWin:undefined, bg:null,
    sprPng:flySpritePng(d.id), sprSvg:flySprite(d.id),
  };
  document.body.classList.add('flight-active');
  const fs=$('#flightFs');
  if(fs){ fs.style.display='block'; fs.innerHTML='<div class="fcv-load">Разжигаем миры…</div>'; }
  buildFlightTier(region);
}

/* ===== ПОСТРОИТЬ ЯРУС (вызывается на старте и при переходе через портал) ===== */
function buildFlightTier(region){
  const f=flight; if(!f)return;
  f.region=region;
  const bn=region.biomeN||1;
  loadFlyMap(region.scene,bn,img=>{
    if(!flight||flight!==f)return;
    let W,H;
    if(img){ // нарисованная карта: нативное разрешение, резко и без апскейла
      const SC=Math.max(1.4,(innerWidth*1.35)/img.width);
      W=img.width*SC; H=img.height*SC; f.bg=img;
    } else {  // процедурный фон
      W=Math.max(innerWidth*1.5,900); H=Math.max(innerHeight*2.2,1400);
      f.bg=flyBackground(region.scene,Math.round(W),Math.round(H),region.id);
    }
    f.W=W; f.H=H;
    f.beasts=0; f.cnt={treasure:0,scroll:0};
    f.items=[];f.storms=[];f.dens=[];f.wilds=[];f.floats=[];f.clouds=[];
    f.drag={x:W/2,y:H-100,vx:0,vy:0,heading:-Math.PI/2,flap:0,hurt:0,bank:0,trail:[]};
    f.stam=140; f.paused=false; f._pend=null; f.battleWin=undefined;

    const coinVal=Math.max(2,Math.round((region.gold[0]+region.gold[1])/20));
    const put=(icon,type,n,val)=>{for(let i=0;i<n;i++)f.items.push({icon,type,val:val||0,
      x:90+Math.random()*(W-180),y:170+Math.random()*(H-340),r:16,taken:false,pulse:Math.random()*6});};
    put('🪙','coin',18+bn*3,coinVal);
    put('💎','gem',4+bn*2,coinVal*3);
    put('🥚','egg',3);
    put('🎁','chest',2);
    put('🔑','key',1+(bn>1?1:0));
    put('📜','scroll',1+(bn>1?1:0));
    put('❓','choice',2);
    for(let i=0;i<1+bn*2;i++)f.storms.push({x:120+Math.random()*(W-240),y:240+Math.random()*(H-480),
      r:60+Math.random()*40,a:Math.random()*6,va:.3+Math.random()*.5,vx:(Math.random()-.5)*40,vy:(Math.random()-.5)*40});
    // логова зверей — реальные бои
    const denAt=(fx,fy)=>{const sp=weightedSpecies();
      return {x:W*fx,y:H*fy,icon:pick(['🐗','🦊','👹','🦎','🕷️','🦂']),name:'Логово: '+sp.name,sp,
        beast:{x:W*fx+40,y:H*fy,tx:W*fx,ty:H*fy,wait:0},patrolR:150,aggro:185,speedMul:.72,defeated:false,cool:0};};
    f.dens=[denAt(0.3,0.55+Math.random()*0.12), denAt(0.7,0.35+Math.random()*0.12)];
    // дикие драконы — победа в бою даёт яйцо
    const wildAt=(fx,rare)=>{const sp=weightedSpecies();
      return {sp,rare:!!rare,name:rare?'✨ Мерцающий беглец':'Дикий дракон: '+sp.name,
        col:(TOPDRAGON_COLORS[sp.el]||TOPDRAGON_COLORS.fire).body,img:flySprite(sp.id),
        x:W*fx,y:H*(0.3+Math.random()*0.35),tx:0,ty:0,wait:0,heading:0,
        speed:rare?150:110+Math.random()*40,defeated:false,cool:0};};
    f.wilds=[wildAt(0.3), wildAt(0.7)];
    if(bn>=2)f.wilds.push(wildAt(0.5,true));
    for(let i=0;i<5;i++)f.clouds.push({x:Math.random()*W,y:Math.random()*H,r:240+Math.random()*220,
      vx:6+Math.random()*10,vy:(Math.random()-.5)*5});

    // портал: на ярусы 1-2 — переход выше, на последнем — возвращение домой
    const nextN=(bn<3 && f.worldObj && f.worldObj.biomes[bn])?bn+1:null;
    const goals=[
      {icon:'⚔️',label:'Победи зверей',cur:()=>f.beasts,need:2},
      {icon:'💰',label:'Собери находок',cur:()=>f.cnt.treasure,need:8+2*bn},
    ];
    if(bn>=2)goals.push({icon:'📜',label:'Найди свиток',cur:()=>f.cnt.scroll,need:1});
    f.portal={x:W/2,y:70,goals,next:nextN,
      name:nextN?('Портал: '+f.worldObj.biomes[nextN-1].name):'Портал возвращения'};

    renderFlight();
  });
}

function flyPortalReady(){const f=flight;return f&&f.portal&&f.portal.goals.every(g=>g.cur()>=g.need);}

/* ===== РЕНДЕР DOM + ИГРОВОЙ ЦИКЛ (вызывается и при возврате из боя) ===== */
function renderFlight(){
  const f=flight; if(!f)return;
  const fs=$('#flightFs'); if(!fs)return;
  if(f.raf)cancelAnimationFrame(f.raf);
  if(f.ac)f.ac.abort();
  f.ac=new AbortController();
  const sig={signal:f.ac.signal};
  const bn=f.region.biomeN||1;
  const tierRoman=['I','II','III'][bn-1]||bn;

  fs.innerHTML=`
    <canvas id="fcv"></canvas>
    <div class="fcv-top">
      <div class="fcv-title">Ярус ${tierRoman} · ${f.region.biome} · ${dragonName(f.d)}</div>
      <span id="fcvScore"></span>
      <div class="fcv-stam"><div id="fcvStamFill"></div></div>
      <button class="fcv-exit" id="fcvExit">🏁 Закончить</button>
    </div>
    <div class="fcv-goals" id="fcvGoals"></div>
    <div class="fcv-stick" id="fcvStick"><div class="fcv-knob" id="fcvKnob"></div></div>
    <div class="fcv-enc" id="fcvEnc"></div>
    <div class="fcv-fade" id="fcvFade"></div>`;

  const cv=$('#fcv'), ctx=cv.getContext('2d');
  let vw,vh,dpr;
  const resize=()=>{dpr=Math.min(2,window.devicePixelRatio||1);vw=innerWidth;vh=innerHeight;
    cv.width=vw*dpr;cv.height=vh*dpr;cv.style.width=vw+'px';cv.style.height=vh+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);};
  addEventListener('resize',resize,sig); resize();

  // возврат из боя: применяем итог
  if(f._pend!==null && f._pend!==undefined && f.battleWin!==undefined){
    const p=f._pend, ent=p.ent, win=f.battleWin;
    f._pend=null; f.battleWin=undefined;
    if(win){
      ent.defeated=true;
      if(p.kind==='den'){f.beasts++; questEvent('explore');}
      if(p.kind==='wild'){
        f.beasts++;
        const tier=ent.rare?3:Math.min(3,f.region.biomeN||1);
        addEgg(ent.sp.el,tier); f.stats.eggs++;
        f.floats.push({x:f.drag.x,y:f.drag.y,t:0,txt:ent.rare?'✨ РЕДКОЕ ЯЙЦО!':'🥚 Яйцо!'});
      } else {
        f.floats.push({x:f.drag.x,y:f.drag.y,t:0,txt:'⚔️ Победа!'});
      }
      // рассыпать монеты вокруг логова
      const ox=ent.beast?ent.x:ent.x, oy=ent.beast?ent.y:ent.y;
      const coinVal=Math.max(2,Math.round((f.region.gold[0]+f.region.gold[1])/20));
      for(let i=0;i<5;i++){const a=Math.random()*6.28,r2=30+Math.random()*80;
        f.items.push({icon:'🪙',type:'coin',val:coinVal,x:ox+Math.cos(a)*r2,y:oy+Math.sin(a)*r2,r:16,taken:false,pulse:Math.random()*6});}
      persist(); renderLedger();
    } else {
      ent.cool=4;
    }
  }

  /* --- управление: джойстик под пальцем + WASD/стрелки --- */
  const stickEl=$('#fcvStick'), knobEl=$('#fcvKnob');
  const joy={active:false,cx:0,cy:0,dx:0,dy:0,id:null};
  const keys=new Set();
  fs.addEventListener('pointerdown',e=>{
    if(e.target.closest('#fcvExit,#fcvEnc,.fcv-top,.fcv-goals'))return;
    joy.active=true;joy.id=e.pointerId;joy.cx=e.clientX;joy.cy=e.clientY;joy.dx=joy.dy=0;
    stickEl.style.display='block';stickEl.style.left=(e.clientX-60)+'px';stickEl.style.top=(e.clientY-60)+'px';
  },sig);
  fs.addEventListener('pointermove',e=>{if(!joy.active||e.pointerId!==joy.id)return;
    let dx=e.clientX-joy.cx,dy=e.clientY-joy.cy;const len=Math.hypot(dx,dy),max=60;
    if(len>max){dx*=max/len;dy*=max/len;}joy.dx=dx/max;joy.dy=dy/max;
    knobEl.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;},sig);
  const je=e=>{if(e.pointerId!==joy.id)return;joy.active=false;joy.dx=joy.dy=0;
    stickEl.style.display='none';knobEl.style.transform='translate(-50%,-50%)';};
  fs.addEventListener('pointerup',je,sig);fs.addEventListener('pointercancel',je,sig);
  addEventListener('keydown',e=>keys.add(e.code),sig);
  addEventListener('keyup',e=>keys.delete(e.code),sig);
  $('#fcvExit').onclick=()=>finishFlight(false);

  /* --- встреча со зверем/диким драконом --- */
  const encEl=$('#fcvEnc');
  function encounter(kind,ent){
    f.paused=true;
    const isWild=kind==='wild';
    encEl.style.display='flex';
    encEl.innerHTML=`<div class="enc-card">
      <div class="enc-icon">${isWild?'🐉':ent.icon}</div>
      <div class="enc-name">${ent.name}</div>
      <div class="enc-sub">${isWild?(ent.rare?'Редчайший дракон! Победа принесёт редкое яйцо.':'Победа над диким драконом — яйцо для Гнезда.')
        :'Из логова выходит зверь. Защити себя в честном бою!'}</div>
      <button id="fcvFight">⚔️ В бой</button><button class="ghost" id="fcvFlee">🛫 Улететь</button></div>`;
    $('#fcvFight').onpointerdown=()=>{
      encEl.style.display='none';
      f._pend={kind,ent}; f.battleWin=undefined;
      const sp=ent.sp;
      const lvl=Math.max(1,f.d.level+rnd(-1,1));
      const reward=Math.round(lvl*(10+sp.rarity*4));
      // спрятать полёт, запустить настоящий бой; вернёмся через renderFlight()
      if(f.raf)cancelAnimationFrame(f.raf); f.raf=0;
      fs.style.display='none';
      document.body.classList.remove('flight-active');
      S.arenaPick=f.d.uid; switchView('arena');
      startBattle(f.d,{id:sp.id,level:lvl,morph:rollMorph()},reward);
      if(battle)battle.fromFlight=true;
    };
    $('#fcvFlee').onpointerdown=()=>{
      encEl.style.display='none';f.paused=false;ent.cool=3;
      const bx=ent.beast?ent.beast.x:ent.x,by=ent.beast?ent.beast.y:ent.y;
      const a=Math.atan2(f.drag.y-by,f.drag.x-bx);f.drag.vx+=Math.cos(a)*380;f.drag.vy+=Math.sin(a)*380;
    };
  }

  /* --- загадочное место (❓) --- */
  function choiceCard(item){
    f.paused=true;
    const ch=pick(POI_CHOICES);
    encEl.style.display='flex';
    encEl.innerHTML=`<div class="enc-card">
      <div class="enc-icon">❓</div><div class="enc-name">Загадочное место</div>
      <div class="enc-sub">${ch.q}</div>
      <button data-c="a">${ch.a.t}</button><button class="ghost" data-c="b">${ch.b.t}</button></div>`;
    encEl.querySelectorAll('[data-c]').forEach(b=>b.onpointerdown=()=>{
      const opt=b.dataset.c==='a'?ch.a:ch.b;
      encEl.style.display='none';f.paused=false;
      let txt='';
      if(opt.reward==='gold'){const g=rnd(f.region.gold[0],f.region.gold[1]);S.gold+=g;f.stats.gold+=g;txt=`🪙 +${g}`;}
      else if(opt.reward==='dust'){const du=rnd(8,18);S.dust+=du;txt=`✦ +${du} пыли`;}
      else if(opt.reward==='egg'){addEgg(f.region.el,f.region.biomeN);f.stats.eggs++;txt='🥚 Яйцо!';}
      else if(opt.reward==='relic'){const art=biomeArtifact(f.region);addArtifact(art.id,1);f.stats.relics++;txt=`${art.icon} ${art.name}!`;}
      f.floats.push({x:item.x,y:item.y,t:0,txt});
      f.cnt.treasure++; renderLedger();
    });
  }

  /* --- сбор предмета --- */
  function pickup(it){
    it.taken=true;
    const R=f.region;let txt=it.icon+' +1';
    if(it.type==='coin'||it.type==='gem'){S.gold+=it.val;f.stats.gold+=it.val;f.cnt.treasure++;txt=`${it.icon} +${it.val}`;}
    else if(it.type==='egg'){addEgg(R.el,R.biomeN);f.stats.eggs++;f.cnt.treasure++;txt='🥚 Яйцо!';}
    else if(it.type==='chest'){addChest(Math.min(3,R.biomeN||1));f.cnt.treasure++;txt='🎁 Сундук!';}
    else if(it.type==='key'){addKey(Math.min(3,R.biomeN||1));f.cnt.treasure++;txt='🔑 Ключ!';}
    else if(it.type==='scroll'){const scr=grantScroll(R.worldId,R.biomeN);f.cnt.scroll++;f.cnt.treasure++;
      txt=scr?`📜 «${scr.title}»!`:'📜 Уже собран';
      if(!scr){const g=rnd(R.gold[0],R.gold[1]);S.gold+=g;f.stats.gold+=g;txt+=` +${g}🪙`;}}
    else if(it.type==='choice'){choiceCard(it);return;}
    f.floats.push({x:it.x,y:it.y,t:0,txt});
    renderLedger();
  }

  function renderGoals(){
    const g=$('#fcvGoals'); if(!g)return;
    const rdy=flyPortalReady();
    g.innerHTML=`<span class="g-title">⛩️ ${f.portal.name}</span><br>`+f.portal.goals.map(go=>{
      const c=Math.min(go.need,go.cur());
      return `<span class="${c>=go.need?'done':''}">${c>=go.need?'✔':go.icon} ${go.label}: <b>${c}/${go.need}</b></span>`;}).join('<br>')
      +(rdy?'<br><span class="done">▲ Портал открыт! Лети вверх ⬆</span>':'');
  }

  /* --- отрисовка дракона-спрайта (учитывает пропорции PNG) --- */
  function drawSprite(img,wx,wy,heading,sx,sy,size,now,dref,glow){
    const px=wx-sx,py=wy-sy,t=now/1000;
    const flap=Math.sin(t*8+px*0.01),lift=flap*0.5+0.5;
    if(glow){ctx.save();ctx.globalAlpha=.45+Math.sin(now/200)*.25;ctx.fillStyle='#ffd76a';
      ctx.beginPath();ctx.arc(px,py,size*0.6,0,7);ctx.fill();ctx.restore();}
    let dw=size,dh=size;
    if(img&&img.naturalWidth&&img.naturalHeight){
      const r=img.naturalHeight/img.naturalWidth;
      if(r<0.8){dw=size*1.8;dh=dw*r;} else {dw=size;dh=size*r;}
    }
    ctx.save();ctx.translate(px+7,py+11);ctx.rotate(heading+Math.PI/2);
    ctx.globalAlpha=.24;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(0,0,dw*0.36*(1-lift*0.15),dh*0.34,0,0,7);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(px,py-lift*4);
    ctx.rotate(heading+Math.PI/2+(dref?dref.bank*0.5:0));
    ctx.scale(1+flap*0.09,1-flap*0.05);
    if(dref&&dref.hurt>0&&Math.floor(now/90)%2===0)ctx.globalAlpha=.45;
    if(img&&img.complete&&img.naturalWidth)ctx.drawImage(img,-dw/2,-dh/2,dw,dh);
    else{ctx.font=(size*0.7)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🐉',0,0);}
    ctx.restore();ctx.globalAlpha=1;
  }

  /* --- главный цикл --- */
  const cam={x:0,y:0};let last=performance.now();
  const P={speed:240,inertia:.88},STAM_MAX=140;
  const trailCol=(TOPDRAGON_COLORS[speciesById(f.d.id).el]||TOPDRAGON_COLORS.fire).edge;
  function frame(now){
    if(!flight||flight!==f)return;
    const dt=f.paused||f.ended?0:Math.min(.05,(now-last)/1000);last=now;
    const dg=f.drag,W=f.W,H=f.H;
    // ввод: джойстик или клавиши
    let jx=joy.dx,jy=joy.dy;
    if(!joy.active){
      jx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
      jy=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
      const l=Math.hypot(jx,jy);if(l>1){jx/=l;jy/=l;}
    }
    const tired=f.stam<=0,spdCap=P.speed*(tired?.4:1);
    const k=1-Math.pow(P.inertia,dt*60);
    dg.vx+=(jx*spdCap-dg.vx)*k;dg.vy+=(jy*spdCap-dg.vy)*k;
    const spd=Math.hypot(dg.vx,dg.vy);
    if(spd>8){const tgt=Math.atan2(dg.vy,dg.vx);
      let diff=((tgt-dg.heading+Math.PI*3)%(Math.PI*2))-Math.PI;
      dg.heading+=diff*Math.min(1,dt*6);dg.bank+=(diff-dg.bank)*Math.min(1,dt*5);}
    else dg.bank*=(1-Math.min(1,dt*4));
    dg.x=Math.max(30,Math.min(W-30,dg.x+dg.vx*dt));
    dg.y=Math.max(30,Math.min(H-30,dg.y+dg.vy*dt));
    dg.flap+=dt*(6+spd*0.02);if(dg.hurt>0)dg.hurt-=dt;
    if(spd>40&&!f.paused)dg.trail.push({x:dg.x,y:dg.y,t:0});
    dg.trail.forEach(p=>p.t+=dt);dg.trail=dg.trail.filter(p=>p.t<0.5);

    // портал: переход на следующий ярус или возвращение
    if(!f.ended&&!f.paused){
      if(flyPortalReady()&&dg.y<110&&Math.abs(dg.x-f.portal.x)<W*0.5){
        if(f.portal.next&&f.worldObj){
          f.paused=true;
          f.floats.push({x:f.portal.x,y:90,t:0,txt:'⛩️ ПЕРЕХОД!'});
          const fd=$('#fcvFade'); if(fd)fd.style.opacity='1';
          const nr=makeRegion(f.worldObj,f.portal.next);
          setTimeout(()=>buildFlightTier(nr),380);
        } else {
          f.floats.push({x:f.portal.x,y:90,t:0,txt:'⛩️ ДОМОЙ!'});
          finishFlight(true);
        }
      } else if(!flyPortalReady()&&dg.y<95){
        dg.y=95;dg.vy=Math.abs(dg.vy)*.5+40;
        if(dg.hurt<=0){dg.hurt=.4;f.floats.push({x:dg.x,y:dg.y,t:0,txt:'⛩️ Портал запечатан'});}
      }
    }

    // выносливость
    const zoneMul=1+((f.region.biomeN||1)-1)*0.2,moving=spd>30;
    if(moving)f.stam=Math.max(0,f.stam-dt*zoneMul);else f.stam=Math.min(STAM_MAX,f.stam+dt*4);
    const sf=$('#fcvStamFill');if(sf)sf.style.width=(f.stam/STAM_MAX*100)+'%';

    // грозы
    f.storms.forEach(s=>{s.a+=s.va*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
      if(s.x<s.r||s.x>W-s.r)s.vx*=-1;if(s.y<s.r||s.y>H-s.r)s.vy*=-1;
      if(!f.paused&&!f.ended&&dg.hurt<=0&&Math.hypot(s.x-dg.x,s.y-dg.y)<s.r*.65){
        dg.hurt=1;f.floats.push({x:dg.x,y:dg.y,t:0,txt:'⚡!'});
        const a=Math.atan2(dg.y-s.y,dg.x-s.x);dg.vx+=Math.cos(a)*260;dg.vy+=Math.sin(a)*260;f.stam=Math.max(0,f.stam-8);}});

    // логова
    f.dens.forEach(dd=>{if(dd.defeated)return;const b=dd.beast;if(dd.cool>0)dd.cool-=dt;
      const dp=Math.hypot(dg.x-b.x,dg.y-b.y);
      if(dd.cool<=0&&dp<dd.aggro){const a=Math.atan2(dg.y-b.y,dg.x-b.x),sp2=P.speed*dd.speedMul;
        b.x+=Math.cos(a)*sp2*dt;b.y+=Math.sin(a)*sp2*dt;if(dp<44&&!f.paused&&!f.ended)encounter('den',dd);}
      else{const dst=Math.hypot(b.tx-b.x,b.ty-b.y);
        if(dst<10){b.wait-=dt;if(b.wait<=0){const a=Math.random()*6.28,r2=Math.random()*dd.patrolR;
          b.tx=dd.x+Math.cos(a)*r2;b.ty=dd.y+Math.sin(a)*r2;b.wait=1+Math.random()*2;}}
        else{const a=Math.atan2(b.ty-b.y,b.tx-b.x);b.x+=Math.cos(a)*60*dt;b.y+=Math.sin(a)*60*dt;}}});

    // дикие драконы
    f.wilds.forEach(wd=>{if(wd.defeated)return;if(wd.cool>0)wd.cool-=dt;
      const dp=Math.hypot(dg.x-wd.x,dg.y-wd.y);let mvx=0,mvy=0;
      if(wd.rare&&wd.cool<=0&&dp<330){const a=Math.atan2(wd.y-dg.y,wd.x-dg.x);
        mvx=Math.cos(a)*P.speed*.95;mvy=Math.sin(a)*P.speed*.95;
        wd.x=Math.max(50,Math.min(W-50,wd.x+mvx*dt));wd.y=Math.max(50,Math.min(H-50,wd.y+mvy*dt));}
      else{const dst=Math.hypot(wd.tx-wd.x,wd.ty-wd.y);
        if(dst<14){wd.wait-=dt;if(wd.wait<=0){wd.tx=120+Math.random()*(W-240);wd.ty=150+Math.random()*(H-300);wd.wait=1+Math.random()*3;}}
        else{const a=Math.atan2(wd.ty-wd.y,wd.tx-wd.x);mvx=Math.cos(a)*wd.speed;mvy=Math.sin(a)*wd.speed;wd.x+=mvx*dt;wd.y+=mvy*dt;}}
      if(mvx||mvy)wd.heading=Math.atan2(mvy,mvx);
      if(wd.cool<=0&&dp<46&&!f.paused&&!f.ended)encounter('wild',wd);});

    // сбор
    f.items.forEach(it=>{if(!it.taken&&!f.paused&&Math.hypot(it.x-dg.x,it.y-dg.y)<it.r+30)pickup(it);});
    const sc=$('#fcvScore');
    if(sc)sc.textContent=`🪙${f.stats.gold} 🥚${f.stats.eggs} 💰${f.cnt.treasure} 📜${f.cnt.scroll}`;
    renderGoals();
    f.clouds.forEach(c=>{c.x+=c.vx*dt;c.y+=c.vy*dt;if(c.x>W+c.r)c.x=-c.r;if(c.y>H+c.r)c.y=-c.r;if(c.y<-c.r)c.y=H+c.r;});

    // камера + фон
    cam.x=Math.max(0,Math.min(Math.max(0,W-vw),dg.x-vw/2));
    cam.y=Math.max(0,Math.min(Math.max(0,H-vh),dg.y-vh/2));
    const shake=dg.hurt>0?dg.hurt*6:0;
    const sx=cam.x+(Math.random()-.5)*shake,sy=cam.y+(Math.random()-.5)*shake;
    ctx.clearRect(0,0,vw,vh);
    if(f.bg)ctx.drawImage(f.bg,0,0,f.bg.width,f.bg.height,-sx,-sy,W,H);

    f.clouds.forEach(c=>{const px=c.x-sx,py=c.y-sy;if(px<-c.r||py<-c.r||px>vw+c.r||py>vh+c.r)return;
      const g=ctx.createRadialGradient(px,py,c.r*.2,px,py,c.r);
      g.addColorStop(0,'rgba(10,8,6,.14)');g.addColorStop(1,'rgba(10,8,6,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,c.r,0,7);ctx.fill();});
    ctx.textAlign='center';ctx.textBaseline='middle';

    // предметы
    f.items.forEach(it=>{if(it.taken)return;const px=it.x-sx,py=it.y-sy;
      if(px<-30||py<-30||px>vw+30||py>vh+30)return;it.pulse+=dt*3;
      ctx.fillStyle='rgba(255,215,106,.22)';ctx.beginPath();ctx.arc(px,py+2,15,0,7);ctx.fill();
      ctx.font='24px serif';ctx.fillText(it.icon,px,py+Math.sin(it.pulse)*3);});

    // портал
    {const px=f.portal.x-sx,py=f.portal.y-sy,rdy=flyPortalReady(),pulse=1+Math.sin(now/300)*0.08;
      ctx.save();ctx.translate(px,py);
      if(rdy){const g=ctx.createRadialGradient(0,0,10,0,0,70*pulse);
        g.addColorStop(0,'rgba(255,220,120,.9)');g.addColorStop(.6,'rgba(255,160,60,.4)');g.addColorStop(1,'rgba(255,160,60,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,70*pulse,0,7);ctx.fill();
        ctx.font='46px serif';ctx.fillText('⛩️',0,0);
        ctx.font='italic 14px Georgia';ctx.fillStyle='#ffe';ctx.fillText('портал открыт ⬆',0,44);
      }else{ctx.globalAlpha=.55;ctx.font='42px serif';ctx.fillText('⛩️',0,0);ctx.globalAlpha=1;
        ctx.font='22px serif';ctx.fillText('🔒',0,4);}
      ctx.restore();}

    // логова
    f.dens.forEach(dd=>{const px=dd.x-sx,py=dd.y-sy;
      if(px>-200&&py>-200&&px<vw+200&&py<vh+200){
        ctx.font='34px serif';ctx.fillText('🕳️',px,py);
        ctx.font='italic 12px Georgia';ctx.fillStyle='rgba(255,230,200,.92)';ctx.fillText(dd.name,px,py+30);
        if(!dd.defeated){ctx.font='30px serif';ctx.fillText(dd.icon,dd.beast.x-sx,dd.beast.y-sy);
          ctx.strokeStyle='rgba(255,120,80,.22)';ctx.setLineDash([6,6]);ctx.beginPath();
          ctx.arc(dd.beast.x-sx,dd.beast.y-sy,dd.aggro,0,7);ctx.stroke();ctx.setLineDash([]);}
        else{ctx.font='20px serif';ctx.fillText('✔️',px,py-30);}}});

    // дикие
    f.wilds.forEach(wd=>{if(wd.defeated)return;const px=wd.x-sx,py=wd.y-sy;
      if(px<-90||py<-90||px>vw+90||py>vh+90)return;
      drawSprite(wd.img,wd.x,wd.y,wd.heading,sx,sy,wd.rare?64:54,now,null,wd.rare);});

    // грозы
    f.storms.forEach(s=>{const px=s.x-sx,py=s.y-sy;if(px<-120||py<-120||px>vw+120||py>vh+120)return;
      ctx.save();ctx.translate(px,py);ctx.rotate(Math.sin(s.a)*.15);ctx.globalAlpha=.85;
      ctx.font=(s.r*1.1)+'px serif';ctx.fillText('⛈️',0,0);ctx.restore();ctx.globalAlpha=1;});

    // след
    dg.trail.forEach(p=>{const px=p.x-sx,py=p.y-sy,a=(1-p.t/0.5);
      ctx.globalAlpha=a*.5;ctx.fillStyle=trailCol;
      ctx.beginPath();ctx.arc(px,py,7*a+2,0,7);ctx.fill();});
    ctx.globalAlpha=1;

    // игрок: нарисованный PNG-спрайт, если загрузился, иначе SVG
    const pimg=(f.sprPng&&f.sprPng.complete&&f.sprPng.naturalWidth)?f.sprPng:f.sprSvg;
    const mf=morphById(f.d.morph).filter;
    if(mf&&mf!=='none'&&'filter' in ctx)ctx.filter=mf;
    drawSprite(pimg,dg.x,dg.y,dg.heading,sx,sy,74,now,dg,false);
    if('filter' in ctx)ctx.filter='none';

    // всплывашки
    ctx.font='bold 17px Georgia';ctx.textAlign='center';
    f.floats=f.floats.filter(fl=>(fl.t+=dt)<1.4);
    f.floats.forEach(fl=>{ctx.globalAlpha=1-fl.t/1.4;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=3;ctx.fillStyle='#fff';
      ctx.strokeText(fl.txt,fl.x-sx,fl.y-sy-30-fl.t*28);ctx.fillText(fl.txt,fl.x-sx,fl.y-sy-30-fl.t*28);});
    ctx.globalAlpha=1;

    f.raf=requestAnimationFrame(frame);
  }
  f.raf=requestAnimationFrame(t=>{last=t;frame(t);});
}

/* ===== ЗАВЕРШЕНИЕ ПОЛЁТА ===== */
function finishFlight(portalDone){
  const f=flight; if(!f||f.ended)return;
  f.ended=true; f.paused=true;
  const fs=$('#flightFs'); if(!fs){exitFlight();return;}
  // финальный опыт (+ бонус за портал)
  let xp=rnd(f.region.xp[0],f.region.xp[1]);
  let bonus=0;
  if(portalDone){
    xp=Math.round(xp*1.5);
    bonus=rnd(f.region.gold[0],f.region.gold[1])*2;
    S.gold+=bonus;f.stats.gold+=bonus;
    f.d.happy=Math.min(HAPPY_MAX,(f.d.happy||0)+1);
  }
  const leveled=grantXp(f.d,xp);f.stats.xp+=xp;
  questEvent('explore',3);persist();renderLedger();
  const s=f.stats;
  const rows=[
    ['🪙','Золота добыто',s.gold+(bonus?` <span style="color:var(--gold)">(+${bonus} за портал)</span>`:'')],
    ['🥚','Яиц найдено',s.eggs],
    ['📿','Реликвий найдено',s.relics],
    ['⚔️','Побед в стычках',s.beasts],
    ['⭐','Опыта получено',s.xp+(leveled?' · <span style="color:var(--gold)">новый уровень!</span>':'')],
  ];
  const overlay=document.createElement('div');
  overlay.className='flight-end';
  overlay.innerHTML=`
    <div class="flight-end-card">
      <div class="flight-end-title">${portalDone?'⛩️ Странствие пройдено!':'🏁 Полёт завершён!'}</div>
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
  $('#feMap').onclick=()=>{exitFlight();switchView('explore');};
  $('#feHub').onclick=()=>{exitFlight();switchView('hub');};
}

/* выход из полноэкранного полёта */
function exitFlight(){
  const f=flight;
  if(f){if(f.raf)cancelAnimationFrame(f.raf);if(f.ac)f.ac.abort();}
  flight=null;
  document.body.classList.remove('flight-active');
  const fs=$('#flightFs');if(fs){fs.style.display='none';fs.innerHTML='';}
  renderAll();
  renderMap();
}
