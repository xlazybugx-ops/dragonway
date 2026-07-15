const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(root,'js/00-balance.js'),'utf8')+';this.GB=GAME_BALANCE',box);
const G=box.GB,ok=(v,m)=>{if(!v)throw new Error(m)};

// XP must be positive and strictly increasing through the cap.
let prev=0;for(let lvl=1;lvl<=100;lvl++){const x=Math.round(G.Experience.xpBase*Math.pow(lvl,G.Experience.xpExp));ok(x>prev,'XP curve is not monotonic at '+lvl);prev=x;}

// Prices and rewards are finite, non-negative and bounded for test-release progression.
for(let lvl=1;lvl<=8;lvl++){const portal=Math.round(200*Math.pow(1.7,lvl-1));ok(portal>=0&&portal<=10000,'portal price out of bound');}
for(let lvl=1;lvl<=8;lvl++){const forge=Math.round((G.Economy.forgeBase+5*G.Economy.forgeRarityMul)*Math.pow(G.Economy.forgeGrowth,lvl-1));ok(forge>=0&&forge<5000,'forge price out of bound');}

ok(G.Battle.elementAdv<=1.25&&G.Battle.elementWeak>=.87,'elemental spread too punitive');
ok(G.Run.rewardMul.deadly/G.Run.riskMul.deadly>G.Run.rewardMul.safe/G.Run.riskMul.safe,'deadly route must pay a risk premium');
ok(G.Eggs.pityStep>0&&G.Eggs.pityCap<=100&&G.Eggs.pityDiv>0,'pity bounds invalid');
ok(G.Economy.startingEggs===1,'new player must start with one focused egg');

const state=fs.readFileSync(path.join(root,'js/03-state.js'),'utf8');
const daily=fs.readFileSync(path.join(root,'js/11-save-init.js'),'utf8');
ok(/id:'hatch'[\s\S]{0,160}reward:\{gold:100,dust:10\}/.test(state),'hatch quest must not reward eggs');
ok(/\{gold:200, dust:15\}/.test(daily),'daily dust source missing');
ok(/saveVersion:3/.test(state),'save schema compatibility changed unexpectedly');
ok(/if\(!Array\.isArray\(S\.eggs\)\) S\.eggs=\[\]/.test(daily),'legacy egg migration missing');

// The Monte Carlo model must be reproducible with a fixed seed.
const sim=path.join(root,'tools','economy-sim.js'),out=path.join(root,'output','simulation','economy_simulation_2.3.0.json');
cp.execFileSync(process.execPath,[sim],{stdio:'ignore'});const a=crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex');
cp.execFileSync(process.execPath,[sim],{stdio:'ignore'});const b=crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex');
ok(a===b,'simulation is not reproducible');

const result=JSON.parse(fs.readFileSync(out,'utf8'));
for(const p of ['cautious','active','efficient']){
  const r=result.groups['after_'+p];
  ok(r.tutorial_complete.mean>=.8,'tutorial completion below gate: '+p);
  ok(r.first_hatch_min.median<=10,'first hatch too late: '+p);
  ok(r.first5_win_rate.median>=.55&&r.first5_win_rate.median<=.8,'first five win rate outside target: '+p);
  ok(r.both_zero_days.p90===0,'simultaneous gold/dust starvation: '+p);
  ok(r.stranded_runs.median<=1,'too many stamina strandings: '+p);
}
console.log('Draconis 2.3.0 economy tests: OK');
