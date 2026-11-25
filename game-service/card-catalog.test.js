const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');

const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const close=server=>new Promise(resolve=>server.close(resolve));

test('登录用户可以查看完整卡牌百科，未登录用户不能读取目录',async()=>{
  const identity=http.createServer((req,res)=>{
    res.writeHead(200,{'content-type':'application/json'});
    res.end(JSON.stringify({code:0,data:{id:1,role:'user',account:'tester'}}));
  });
  await listen(identity);
  process.env.GAME_IDENTITY_URL=`http://127.0.0.1:${identity.address().port}/api/identity/me`;
  const {server,pool}=require('./server');
  await listen(server);
  try{
    const url=`http://127.0.0.1:${server.address().port}/game-api/cards`;
    assert.equal((await fetch(url)).status,401);
    const response=await fetch(url,{headers:{cookie:'session=test'}});
    assert.equal(response.status,200);
    const cards=await response.json();
    assert.deepEqual([cards.hand.length,cards.events.length,cards.misfortunes.length],[44,11,14]);
    for(const pile of [cards.hand,cards.events,cards.misfortunes])for(const card of pile){
      assert.ok(card.id&&card.name&&card.effect&&card.image);
      assert.match(card.image,/^\/game-assets\/cards\/output\/[a-zA-Z0-9_-]+\.png/);
    }
    assert.equal(cards.hand.find(card=>card.id==='card22').cost,50);
    assert.equal(cards.events.find(card=>card.id==='event2').effect,'本队-1积分');
  }finally{
    await close(server);
    await pool.end();
    await close(identity);
  }
});
