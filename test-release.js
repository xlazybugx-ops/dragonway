const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const files=['js/00-balance.js','js/00-icons.js','js/01-data-core.js','js/02-data-content.js','js/03-state.js','js/04-systems.js','js/08-battle.js'];
const source=files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n')+`
globalThis.__test={GB,BIOME_MIN_LEVEL,geneMult,combatPower,combatRisk,mutateCost,battleRewardFor,arenaOfferDragon};`;
const sandbox={console,Math,Date,setTimeout:()=>0,clearTimeout:()=>{},navigator:{},document:{},window:{}};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'draconis-test-bundle.js'});
const T=sandbox.__test;
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};

assert(T.GB.Release.version==='2.1.3-test','release version');
assert(JSON.stringify(Array.from(T.BIOME_MIN_LEVEL))===JSON.stringify([0,1,22,55]),'biome progression');
assert(Math.abs(T.geneMult(3)-1)<1e-9,'neutral gene must be 1.0');
assert(Math.abs(T.geneMult(6)-1.15)<1e-9,'max gene must be bounded');

const base={id:'ember',level:20,xp:0,curHp:999,morph:'common',genes:{atk:3,def:3,hp:3,spd:3},nature:'balanced'};
const stronger={...base,level:22};
assert(T.combatPower(stronger)>T.combatPower(base),'combat power must grow with stats');
assert(T.combatRisk(base,stronger).ratio>1,'risk must use combat power');

const common={id:'ember',level:20,morph:'common'};
const rare={id:'voidmaw',level:20,morph:'common'};
const commonReward=T.battleRewardFor(base,common);
const rareReward=T.battleRewardFor(base,rare);
assert(rareReward/commonReward<1.3,'rarity must not directly multiply reward');

assert(T.mutateCost({mutations:99,geneGrowth:0})===8,'failed mutations must not inflate cost');
assert(T.mutateCost({geneGrowth:99})===40,'mutation cost must be capped');
assert(T.GB.Battle.matchmaking.rewardBands[2]<=1.12,'danger reward must not dominate');

const oldIdle=.32*100*300;
const newIdle=T.GB.Economy.idleBasePerMinute*Math.sqrt(100)*T.GB.Economy.idleLevelScale*300;
assert(newIdle<oldIdle*.15,'late idle income must be bounded');

console.log('Draconis 2.1 balance tests: OK');
