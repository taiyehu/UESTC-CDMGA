const fs=require('node:fs');
const path=require('node:path');
const base=process.env.GAME_CONTENT_DIR || path.join(__dirname,'content');

function parseCsv(text){
  const rows=[];let row=[],value='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){
      if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;
    }else if(c===','&&!quoted){row.push(value);value='';}
    else if((c==='\n'||c==='\r')&&!quoted){
      if(c==='\r'&&text[i+1]==='\n')i++;
      row.push(value);if(row.some(x=>x!==''))rows.push(row);row=[];value='';
    }else value+=c;
  }
  if(quoted)throw Error('CSV 引号未闭合');
  if(value||row.length){row.push(value);rows.push(row);}
  const headers=rows.shift();
  return rows.map((values,index)=>{
    if(values.length!==headers.length)throw Error(`CSV 第 ${index+2} 行列数不匹配`);
    return Object.fromEntries(headers.map((h,i)=>[h,values[i]]));
  });
}
function load(name,kind){
  const rows=parseCsv(fs.readFileSync(path.join(base,name),'utf8').replace(/^\uFEFF/,''));
  const ids=new Set();
  return rows.map(row=>{
    if(!/^[a-zA-Z0-9_-]+$/.test(row.id)||ids.has(row.id))throw Error(`${name}: 卡牌编号无效或重复 ${row.id}`);
    ids.add(row.id);
    const file=path.join(base,'output',`${row.id}.png`);
    if(!fs.existsSync(file))throw Error(`${name}: 缺少成品卡 ${row.id}.png`);
    const move=kind==='hand'?Number(row.move):undefined,quantity=Number(row.quantity||1),effectValue=Number(row.effect_value||0),effectAux=Number(row.effect_aux||0);
    if(kind==='hand'&&(!Number.isInteger(move)||move<1||move>7))throw Error(`${name}: 移动点数无效 ${row.id}`);
    if(!Number.isInteger(quantity)||quantity<1||quantity>50||!Number.isFinite(effectValue)||!Number.isFinite(effectAux))throw Error(`${name}: 数值无效 ${row.id}`);
    return {...row,move,cost:kind==='hand'?Number(row.cost):undefined,
      effectValue,effectAux,quantity,image:`/game-assets/cards/output/${row.id}.png`};
  });
}
const HAND=load('hand.csv','hand'),EVENTS=load('events.csv','event'),MISFORTUNES=load('misfortunes.csv','misfortune');
module.exports={HAND,EVENTS,MISFORTUNES,parseCsv};
