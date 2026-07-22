const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const imageRoot=path.join(root,'images');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);e.isDirectory()?walk(p):files.push(p);}}
walk(imageRoot);
const bytes=files.reduce((n,p)=>n+fs.statSync(p).size,0);
const mb=bytes/1024/1024;
const png=files.filter(p=>path.extname(p).toLowerCase()==='.png');
const backups=files.filter(p=>/(^|[-_.])(backup|old|unused)([-_.]|$)/i.test(path.basename(p)));
if(mb>50)throw new Error(`image budget exceeded: ${mb.toFixed(1)} MB > 50 MB`);
if(png.length)throw new Error(`release contains unoptimized PNG: ${png.map(p=>path.relative(root,p)).join(', ')}`);
if(backups.length)throw new Error(`release contains backup assets: ${backups.map(p=>path.relative(root,p)).join(', ')}`);
console.log(`Image performance budget: OK (${files.length} files, ${mb.toFixed(1)} MB)`);
