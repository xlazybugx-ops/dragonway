/* Draconis UI icon system — one visual language instead of platform emoji. */
const GAME_ICON_PATHS={
  coin:'<circle cx="12" cy="12" r="8"/><path d="M9 8h6M9 12h6M10 16h4"/>',
  dust:'<path d="M12 2l2.4 6.2L21 10l-5.4 4.1L17 21l-5-3.3L7 21l1.4-6.9L3 10l6.6-1.8z"/>',
  egg:'<path d="M12 3c-4 0-7 6.1-7 11a7 7 0 0014 0c0-4.9-3-11-7-11z"/><path d="M8 14c2 1 6 1 8 0"/>',
  dragon:'<path d="M5 17c1-6 4-10 9-11l4-3-1 5 3 3-5 1c-1 4-4 7-8 7z"/><path d="M8 13L3 8l6 2m6-1l1 .1"/>',
  fire:'<path d="M13 2c2 5-2 6 1 9 1-2 3-3 4-4 2 6-1 14-7 14-5 0-8-5-5-10 1 2 3 3 4 3-2-5 1-8 3-12z"/>',
  frost:'<path d="M12 2v20M4 7l16 10M20 7L4 17M8 4l4 3 4-3M8 20l4-3 4 3"/>',
  venom:'<path d="M12 3c5 4 7 7 7 11a7 7 0 01-14 0c0-4 2-7 7-11z"/><path d="M9 14c2-2 4-2 6 0m-6 3h6"/>',
  storm:'<path d="M14 2L5 13h6l-1 9 9-12h-6z"/>',
  shade:'<path d="M17 4a8 8 0 10.5 15A7 7 0 0117 4z"/>',
  battle:'<path d="M5 4l14 16M19 4L5 20M4 3l4 1-3 3m15-4l-4 1 3 3"/>',
  shield:'<path d="M12 2l8 3v6c0 5-3 8-8 11-5-3-8-6-8-11V5z"/>',
  heart:'<path d="M12 21S3 15 3 9a5 5 0 019-3 5 5 0 019 3c0 6-9 12-9 12z"/>',
  gift:'<path d="M4 10h16v11H4zM3 6h18v4H3zM12 6v15M12 6c-1-4-6-4-6-1 0 2 3 2 6 1zm0 0c1-4 6-4 6-1 0 2-3 2-6 1z"/>',
  map:'<path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16m6-14v16"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3m-4 4v3"/>',
  book:'<path d="M3 5c4-1 7 0 9 2v14c-2-2-5-3-9-2zm18 0c-4-1-7 0-9 2v14c2-2 5-3 9-2z"/>',
  food:'<path d="M7 14c-3-2-3-7 1-9 4-2 8 1 8 5 0 4-4 7-9 4z"/><path d="M15 14l5 5m-2-5l3 3"/>',
  rest:'<path d="M3 18h18M5 18v-8m0 4h14v4m-9-4v-4h7a2 2 0 012 2v2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10l2 2M19 5l-2 2M7 17l-2 2"/>',
  rune:'<path d="M12 2l8 10-8 10-8-10zM12 7l4 5-4 5-4-5z"/>'
};
function gameIcon(name,label){
  if(name==='coin') return `<span class="game-icon gi-coin game-icon-raster"${label?` aria-label="${label}"`:''}><img src="images/gold_dragon_coins.webp" loading="lazy" decoding="async" alt=""></span>`;
  const n=GAME_ICON_PATHS[name]?name:'rune';
  return `<span class="game-icon gi-${n}"${label?` aria-label="${label}"`:''}><svg viewBox="0 0 24 24" aria-hidden="true">${GAME_ICON_PATHS[n]}</svg></span>`;
}
const EMOJI_ICON_KIND={
  '🪙':'coin','💰':'coin','✦':'dust','✨':'dust','✯':'dust','💫':'dust','💥':'dust',
  '🥚':'egg','🐣':'egg','🪺':'egg','🪹':'egg','🐉':'dragon','🐲':'dragon','🐍':'dragon','🦎':'dragon',
  '🔥':'fire','🌋':'fire','♨️':'fire','🧊':'frost','❄️':'frost','🥶':'frost','🟢':'venom','☣️':'venom','🧪':'venom','🌿':'venom','🍄':'venom',
  '⚡':'storm','⛈️':'storm','🌩️':'storm','🌪️':'storm','🌑':'shade','🌘':'shade','🌗':'shade','🌙':'shade','🌚':'shade',
  '⚔️':'battle','⚔':'battle','🗡️':'battle','🏆':'battle','🏅':'battle','🎯':'battle','🛡️':'shield','🛡':'shield','⛨':'shield',
  '💖':'heart','💗':'heart','❤️':'heart','❤':'heart','💞':'heart','💙':'heart','💚':'heart','💜':'heart','🤍':'heart',
  '🎁':'gift','🎉':'gift','🗺️':'map','🧭':'map','🏔️':'map','⛰️':'map','🏝️':'map','🔒':'lock','🔐':'lock','🔓':'lock','🔑':'lock','🗝️':'lock',
  '📖':'book','📜':'book','📿':'book','🍖':'food','🌶️':'food','🫐':'food','🛌':'rest','💤':'rest','⚙️':'settings','⚙':'settings','🔊':'settings','🔇':'settings',
  '★':'dust','☆':'dust','🌟':'dust','✴️':'dust','☠️':'battle','💀':'battle','👹':'battle','👿':'battle','👾':'battle'
};
const GAME_EMOJI_RE=/[\u2600-\u27BF\u{1F000}-\u{1FAFF}](?:\uFE0F|\u200D[\u2600-\u27BF\u{1F000}-\u{1FAFF}])?/gu;
function hydrateGameIcons(root){
  const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
  const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  for(const node of nodes){
    if(!node.parentElement||node.parentElement.closest('script,style,svg,canvas,.game-icon')) continue;
    const value=node.nodeValue||''; if(!GAME_EMOJI_RE.test(value)){GAME_EMOJI_RE.lastIndex=0;continue;} GAME_EMOJI_RE.lastIndex=0;
    const frag=document.createDocumentFragment(); let last=0;
    value.replace(GAME_EMOJI_RE,(token,offset)=>{if(offset>last)frag.append(value.slice(last,offset));const box=document.createElement('span');box.innerHTML=gameIcon(EMOJI_ICON_KIND[token]||'rune');frag.append(box.firstChild);last=offset+token.length;return token;});
    if(last<value.length)frag.append(value.slice(last)); node.replaceWith(frag);
  }
}
function initGameIconObserver(){
  hydrateGameIcons(document.body);
  const mo=new MutationObserver(list=>{for(const m of list)for(const n of m.addedNodes){if(n.nodeType===1)hydrateGameIcons(n);else if(n.nodeType===3&&n.parentElement)hydrateGameIcons(n.parentElement);}});
  mo.observe(document.body,{childList:true,subtree:true});
  installCanvasIconRenderer();
}
function drawCanvasGameIcon(ctx,kind,x,y,size){
  const col={coin:'#e7b94b',dust:'#f2d889',egg:'#e8d1a6',dragon:'#d68455',fire:'#f07842',frost:'#79c7e7',venom:'#8fc65d',storm:'#bd8bef',shade:'#a98acb',battle:'#e17455',shield:'#8bb8c9',heart:'#dc7185',gift:'#e7b94b',map:'#c9a86a',lock:'#b7a98a',book:'#c9a86a',food:'#d88a55',rest:'#9e8cc3',settings:'#b7a98a'}[kind]||'#d9a441';
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=Math.max(1.5,size*.09);ctx.lineCap='round';ctx.lineJoin='round';
  if(kind==='storm'){ctx.beginPath();ctx.moveTo(size*.12,-size*.48);ctx.lineTo(-size*.28,size*.05);ctx.lineTo(size*.02,size*.05);ctx.lineTo(-size*.12,size*.48);ctx.lineTo(size*.32,-size*.08);ctx.lineTo(size*.03,-size*.08);ctx.closePath();ctx.fill();}
  else if(kind==='heart'){ctx.beginPath();ctx.moveTo(0,size*.38);ctx.bezierCurveTo(-size*.55,0,-size*.45,-size*.38,-size*.18,-size*.38);ctx.bezierCurveTo(0,-size*.38,0,-size*.2,0,-size*.18);ctx.bezierCurveTo(0,-size*.2,0,-size*.38,size*.18,-size*.38);ctx.bezierCurveTo(size*.45,-size*.38,size*.55,0,0,size*.38);ctx.fill();}
  else if(kind==='egg'){ctx.beginPath();ctx.ellipse(0,0,size*.34,size*.47,0,0,Math.PI*2);ctx.fill();}
  else if(kind==='coin'){ctx.beginPath();ctx.arc(0,0,size*.42,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6d4b19';ctx.beginPath();ctx.moveTo(-size*.18,-size*.12);ctx.lineTo(size*.18,-size*.12);ctx.moveTo(-size*.18,size*.1);ctx.lineTo(size*.18,size*.1);ctx.stroke();}
  else if(kind==='frost'){for(let i=0;i<3;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(-size*.43,0);ctx.lineTo(size*.43,0);ctx.stroke();}}
  else if(kind==='fire'){ctx.beginPath();ctx.moveTo(0,-size*.48);ctx.bezierCurveTo(size*.35,-size*.1,size*.36,size*.32,0,size*.46);ctx.bezierCurveTo(-size*.38,size*.25,-size*.3,-size*.06,0,-size*.48);ctx.fill();}
  else{ctx.beginPath();ctx.moveTo(0,-size*.44);ctx.lineTo(size*.4,0);ctx.lineTo(0,size*.44);ctx.lineTo(-size*.4,0);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(24,14,28,.7)';ctx.beginPath();ctx.moveTo(0,-size*.2);ctx.lineTo(size*.18,0);ctx.lineTo(0,size*.2);ctx.lineTo(-size*.18,0);ctx.closePath();ctx.stroke();}
  ctx.restore();
}
function installCanvasIconRenderer(){
  if(typeof CanvasRenderingContext2D==='undefined'||CanvasRenderingContext2D.prototype._draconisFillText)return;
  const proto=CanvasRenderingContext2D.prototype, original=proto.fillText;proto._draconisFillText=original;
  proto.fillText=function(text,x,y,maxWidth){
    const str=String(text), matches=[...str.matchAll(GAME_EMOJI_RE)];GAME_EMOJI_RE.lastIndex=0;
    if(!matches.length)return original.apply(this,arguments);
    const fontPx=Math.max(10,parseFloat(this.font)||16), cleaned=str.replace(GAME_EMOJI_RE,'').trim();GAME_EMOJI_RE.lastIndex=0;
    const token=matches[0][0],kind=EMOJI_ICON_KIND[token]||'rune';
    const shift=cleaned?fontPx*.62:0;drawCanvasGameIcon(this,kind,x-shift,y-fontPx*.32,fontPx*.9);
    if(cleaned)return maxWidth===undefined?original.call(this,cleaned,x+fontPx*.38,y):original.call(this,cleaned,x+fontPx*.38,y,maxWidth);
  };
}
