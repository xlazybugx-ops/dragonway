const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const sourceFiles=['index.html',...walk('css'),...walk('js')];
const missing=[];
const checked=new Set();

function walk(dir){
  return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>
    e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
}

for(const file of sourceFiles){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  const matches=text.matchAll(/(?:src=|url\(|['"`])(\.\.\/)?images\/([A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|gif))/gi);
  for(const m of matches){
    const rel=path.join('images',m[2]).replace(/\\/g,'/');
    if(checked.has(rel))continue;
    checked.add(rel);
    if(!fs.existsSync(path.join(root,rel)))missing.push(`${file}: ${rel}`);
  }
}

if(missing.length){
  console.error('Missing static image assets:\n'+missing.join('\n'));
  process.exit(1);
}
console.log(`Static asset references: OK (${checked.size} checked)`);
