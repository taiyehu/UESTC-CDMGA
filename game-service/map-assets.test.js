const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {POS}=require('./game');
const {server,pool}=require('./server');

const publicDir=path.join(__dirname,'public');
const svg=fs.readFileSync(path.join(publicDir,'map.svg'),'utf8');

test('地图资源和节点位置与游戏坐标一致',()=>{
  assert.match(svg,/viewBox="-3350 -1800 7500 5000"/);
  assert.match(fs.readFileSync(path.join(publicDir,'index.html'),'utf8'),/<object data="\/game-client\/map\.svg/);
  const assets=[...svg.matchAll(/href="(assets\/asset-\d{3}\.(?:png|jpg))(?:\?[^\"]+)?"/g)].map(match=>match[1]);
  assert.equal(assets.length,12);
  for(const asset of assets)assert.ok(fs.statSync(path.join(publicDir,asset)).size>0,asset);
  for(const [id,[x,y]] of Object.entries(POS)){
    const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const label=id.startsWith('R')?`<g aria-label="${escaped}"`:`<g class="node(?: [^"]+)?" aria-label="${escaped}`;
    const match=new RegExp(`${label}[^>]*transform="translate\\(([-\\d.]+) ([-\\d.]+)\\)`).exec(svg);
    assert.ok(match,`${id} 缺少地图节点`);
    assert.deepEqual([Number(match[1]),Number(match[2])],[x,y],`${id} 标记坐标不匹配`);
  }
});

test('服务端能提供外部化地图及全部图片',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const base=`http://127.0.0.1:${server.address().port}`;
    for(const asset of ['map.svg',...[...svg.matchAll(/href="(assets\/asset-\d{3}\.(?:png|jpg))(?:\?[^\"]+)?"/g)].map(match=>match[1])]){
      const response=await fetch(`${base}/game-client/${asset}`);
      assert.equal(response.status,200,asset);
      assert.match(response.headers.get('content-type'),asset.endsWith('.svg')?/image\/svg\+xml/:/image\/(?:png|jpeg)/);
      assert.ok((await response.arrayBuffer()).byteLength>0,asset);
    }
  }finally{
    await new Promise(resolve=>server.close(resolve));
    await pool.end();
  }
});
