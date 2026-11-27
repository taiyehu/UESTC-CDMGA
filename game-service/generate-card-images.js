const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {imageNames}=require('./card-image-paths');

const dir=path.join(__dirname,'content','output');
const sources=fs.readdirSync(dir).filter(name=>/^(?:card|event|mis)\d+\.png$/.test(name));
for(const name of sources){
  const source=path.join(dir,name),id=name.slice(0,-4),names=imageNames(id,fs.readFileSync(source));
  for(const [suffix,quality,filter] of [['',82,null],['.thumb',80,'scale=400:-1']]){
    const output=path.join(dir,suffix?names.thumb:names.full);
    if(fs.existsSync(output))continue;
    const args=['-hide_banner','-loglevel','error','-y','-i',source];
    if(filter)args.push('-vf',filter);
    args.push('-frames:v','1','-c:v','libwebp','-q:v',String(quality),output);
    execFileSync('ffmpeg',args,{stdio:'inherit'});
  }
}
console.log(`Generated WebP variants for ${sources.length} cards`);
