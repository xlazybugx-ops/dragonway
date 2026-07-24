const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/06d-settlement-builder.js'),'utf8')+`
globalThis.__hub={HUB2_PLOTS,HUB2_DECO,HUB2_BUILDINGS,hub2Theme,hub2StartBuild,hub2RefreshQueue,hub2Unlock,hub2Claim,hub2VisualTier};`;
const species={ember:{el:'fire'},glacier:{el:'frost'},sporewing:{el:'venom'}};
const sandbox={
  console,Date,setTimeout:()=>0,clearTimeout:()=>{},
  S:{settlementTheme:null,hubBuildings:{},hubBuildQueue:null,hubDecorations:{},decorations:{},decorOwned:[],
    dragons:[{id:'glacier',level:2}],gold:10000,dust:100,eggs:[{}],discovered:{},firstHour:{phase:'first_flight'}},
  speciesById:id=>species[id],eggCount:()=>1,persist:()=>{},renderLedger:()=>{},toast:()=>{},
  $:()=>null,PORTAL_MAX:8,SMITHY_MAX:5,LAIR_LEVELS:[],portalCost:()=>({gold:1,dust:0}),
  smithyCost:()=>({gold:1,dust:0}),bossesBeatenCount:()=>0
};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'06d-settlement-builder.js'});
const H=sandbox.__hub;
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};

assert(H.HUB2_PLOTS.length===12,'settlement must expose exactly 12 building plots');
assert(H.HUB2_PLOTS.filter(p=>p.starter).length===3,'first lair must have three starter plots');
assert(H.HUB2_DECO.length===8&&H.HUB2_DECO.filter(p=>!p.reserve).length===6,'six decoration slots plus two reserve slots');
assert(H.hub2VisualTier('explore',1)===1&&H.hub2VisualTier('explore',3)===2&&H.hub2VisualTier('explore',8)===5,'portal levels must map to five visual tiers');
assert(H.hub2VisualTier('lair',5)===5,'five-level buildings must use their direct visual tier');
assert(H.hub2Theme()==='frost','starter frost dragon must select frost settlement');
assert(H.hub2Unlock('lair').ok,'first lair must be available');
assert(!H.hub2Unlock('forge').ok,'forge must remain locked below dragon level 3');

H.hub2StartBuild('p07','lair');
assert(sandbox.S.hubBuildings.p07.state==='building','lair construction must start on selected plot');
assert(sandbox.S.hubBuildQueue&&sandbox.S.hubBuildQueue.action==='build','construction must persist in one build queue');
sandbox.S.hubBuildQueue.completesAt=Date.now()-1;
sandbox.S.hubBuildings.p07.completesAt=Date.now()-1;
H.hub2RefreshQueue();
assert(sandbox.S.hubBuildings.p07.state==='ready','offline timer must turn completed construction ready');
H.hub2Claim('p07');
assert(sandbox.S.hubBuildings.p07.state==='active'&&!sandbox.S.hubBuildQueue,'claim must activate building and clear queue');

const saveSource=fs.readFileSync(path.join(root,'js/11-save-init.js'),'utf8');
assert(saveSource.includes('if(S.saveVersion<4)')&&saveSource.includes("S.hubBuildings[slots[i]]"),'legacy saves must migrate to placed buildings');
console.log('Settlement builder tests: OK');
