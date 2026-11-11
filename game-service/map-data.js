const fs=require('node:fs');
const path=require('node:path');

const rows=fs.readFileSync(path.join(__dirname,'node-types.csv'),'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/);
const NODE_TYPES=Object.fromEntries(rows.slice(1).map(line=>{
  const [name,type]=line.split(',');return [name,type];
}));

module.exports={NODE_TYPES};
