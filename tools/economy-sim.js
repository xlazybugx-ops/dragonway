/* Reproducible economy/progression Monte Carlo model for Draconis.
   Assumptions are explicit below; game coefficients are loaded from js/00-balance.js. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(root,'js/00-balance.js'),'utf8')+';this.GB=GAME_BALANCE',box);
const LIVE=box.GB;
const N=1000,BASE_SEED=22022230;
const profiles={
  cautious:{minutes:15,baseWin:.58,questRate:.55,eff:.78},
  active:{minutes:30,baseWin:.68,questRate:.82,eff:1},
  efficient:{minutes:45,baseWin:.78,questRate:.95,eff:1.18},
};
const modes={
  before:{startEggs:4,hatchQuestEggs:2,dailyDust0:0,mapScale:3.1,emptyFlight:.34,strand:.13,elementAdv:1.28,elementWeak:.85,earlyDecor:false},
  after:{startEggs:1,hatchQuestEggs:0,dailyDust0:15,mapScale:2.4,emptyFlight:.22,strand:.07,elementAdv:1.22,elementWeak:.88,earlyDecor:true},
};
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function q(a,p){a=[...a].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor((a.length-1)*p))]}
function sim(modeName,pname,i){
  const C=modes[modeName],P=profiles[pname],R=rng(BASE_SEED+i*97+(modeName==='after'?17:0)+pname.length*1009);
  let level=2,xp=0,gold=300,dust=60,eggs=C.startEggs,dragons=1,upgrades=0,portal=1;
  let firstVictory=null,firstHatch=null,secondBiome=null,wins=0,fights=0,first5Wins=0,battleTurns=0,blocked=0,bothZero=0,stranded=0;
  const levels={};
  for(let day=1;day<=14;day++){
    const minutes=P.minutes*(.85+R()*.3), actions=Math.max(2,Math.round(minutes/3.2*P.eff));
    // Seven-day login rewards from the real table, with candidate guaranteed day-one dust.
    const streak=(day-1)%7, chestGold=[200,260,320,420,560,760,1400][streak];
    const chestDust=[C.dailyDust0,30,0,50,50,90,180][streak];
    const chestEgg=[0,0,1,0,1,0,2][streak]; gold+=chestGold;dust+=chestDust;eggs+=chestEgg;
    // Three daily quests: completion probability by profile. Hatch quest no longer self-replicates in candidate.
    if(R()<P.questRate){gold+=120;dust+=15;if(C.hatchQuestEggs&&eggs>0)eggs+=C.hatchQuestEggs;}
    for(let a=0;a<actions;a++){
      fights++;
      const matchup=R()<.2?-1:R()<.4?1:0;
      const elemDelta=matchup>0?(C.elementAdv-1)*.34:matchup<0?-(1-C.elementWeak)*.42:0;
      const win=Math.min(.94,Math.max(.25,P.baseWin+elemDelta+(day===1&&a===0?.22:0)));
      const won=R()<win;if(won){wins++;if(fights<=5)first5Wins++;if(firstVictory===null)firstVictory=(day-1)*P.minutes+a*3.2+2.2;}
      const foeLevel=Math.max(1,level+Math.round((R()-.5)*2));
      gold+=won?Math.round(foeLevel*LIVE.Economy.battleGoldPerLevel):Math.max(5,Math.round(foeLevel*LIVE.Economy.battleGoldPerLevel*LIVE.Economy.solaceGoldPct));
      const gain=won?Math.round(foeLevel*LIVE.Economy.battleGoldPerLevel*.9+foeLevel*6):Math.max(4,Math.round(foeLevel*LIVE.Economy.solaceXpPer));
      xp+=gain;battleTurns+=won?Math.round(5+R()*3):Math.round(6+R()*4);
      while(level<100&&xp>=Math.round(LIVE.Experience.xpBase*Math.pow(level,LIVE.Experience.xpExp))){xp-=Math.round(LIVE.Experience.xpBase*Math.pow(level,LIVE.Experience.xpExp));level++;}
      if(won&&R()<.30)eggs++;
      if(eggs>0&&(a+1)%2===0){eggs--;dragons++;if(firstHatch===null)firstHatch=(day-1)*P.minutes+(a+1)*3.2;}
    }
    // One run per session: exploration rewards, map friction and stamina failure.
    const runGold=Math.round((65+R()*55)*P.eff*(1-C.emptyFlight));gold+=runGold;
    if(R()<.24)eggs++; if(R()<C.strand)stranded++;
    // Unlock the second world/biome through the first portal upgrade.
    if(portal===1&&gold>=200){gold-=200;portal=2;upgrades++;secondBiome=(day-1)*P.minutes+Math.min(minutes,12);}
    // Capacity upgrade is mandatory once the active roster exceeds four.
    if(dragons>4&&upgrades<2){if(gold>=800&&dust>=15){gold-=800;dust-=15;upgrades++;}else blocked++;}
    // Light forge use after level 3; optional early decoration is bought only from surplus.
    if(level>=3&&R()<.45){const cost=35+upgrades*20;if(gold>=cost){gold-=cost;upgrades++;}else blocked++;}
    if(C.earlyDecor&&day>=3&&gold>1800&&R()<.18){gold-=1000;upgrades++;}
    if(gold<=0&&dust<=0)bothZero++;
    if([1,3,7,14].includes(day))levels[day]=level;
  }
  return {mode:modeName,profile:pname,run:i,first_victory_min:firstVictory??999,first_hatch_min:firstHatch??999,second_biome_min:secondBiome??999,level_d1:levels[1],level_d3:levels[3],level_d7:levels[7],level_d14:levels[14],gold:Math.round(gold),dust:Math.round(dust),eggs,dragons,upgrades,win_rate:wins/Math.max(1,fights),first5_win_rate:first5Wins/5,avg_battle_turns:battleTurns/Math.max(1,fights),empty_flight:C.emptyFlight,stranded_runs:stranded,blocked,both_zero_days:bothZero,tutorial_complete:firstVictory<5&&firstHatch<10?1:0};
}
const rows=[];for(const m of Object.keys(modes))for(const p of Object.keys(profiles))for(let i=0;i<N;i++)rows.push(sim(m,p,i));
const metrics=['first_victory_min','first_hatch_min','second_biome_min','level_d1','level_d3','level_d7','level_d14','gold','dust','eggs','dragons','upgrades','win_rate','first5_win_rate','avg_battle_turns','empty_flight','stranded_runs','blocked','both_zero_days','tutorial_complete'];
const summary={seed:BASE_SEED,runs_per_profile:N,assumptions:{session_minutes:Object.fromEntries(Object.entries(profiles).map(([k,v])=>[k,v.minutes])),fight_or_action_every_minutes:3.2,one_exploration_run_per_session:true,login_reward_claimed_daily:true,quest_completion_is_profile_probability:true},groups:{}};
for(const m of Object.keys(modes))for(const p of Object.keys(profiles)){
  const a=rows.filter(x=>x.mode===m&&x.profile===p);const key=m+'_'+p;summary.groups[key]={};
  for(const k of metrics){const v=a.map(x=>x[k]);summary.groups[key][k]={p10:q(v,.1),median:q(v,.5),p90:q(v,.9),mean:v.reduce((s,n)=>s+n,0)/v.length};}
}
const out=path.join(root,'output','simulation');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'economy_simulation_2.3.0.json'),JSON.stringify(summary,null,2));
const cols=Object.keys(rows[0]);fs.writeFileSync(path.join(out,'economy_simulation_2.3.0.csv'),cols.join(',')+'\n'+rows.map(r=>cols.map(c=>r[c]).join(',')).join('\n'));
console.log(JSON.stringify(summary,null,2));
