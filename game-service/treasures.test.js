const test=require('node:test');
const assert=require('node:assert/strict');
const game=require('./game');
const {MISFORTUNES}=require('./catalog');
const fs=require('node:fs');
const path=require('node:path');
const who={role:'team',id:'A'};
test('十一件宝物的图片路径对应可读取的 JPEG 资源',()=>{
  assert.equal(game.TREASURES.length,11);
  game.TREASURES.forEach((treasure,index)=>{
    assert.match(treasure.image,new RegExp(`treasure${index+1}\\.(?:jpg|JPG)$`));
    const file=path.join(__dirname,'public','assets',path.basename(treasure.image));
    const bytes=fs.readFileSync(file);assert.ok(bytes.length>1000);assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);
  });
});
function setup(id,from='R4',money=500){
  const room=game.createRoom({seed:`treasure-${id}-${from}`,initialMoney:money}),team=room.teams.A;
  team.treasureChoices=[id];game.chooseTreasure(room,who,id);team.position=from;
  return {room,team};
}
function travel(room,team,route,steps=route.length){const card=team.hand.find(c=>c.move!==7);card.move=steps;game.move(room,who,card.id,route);return card;}
test('开局三选一、原型积分与重置',()=>{
  const room=game.createRoom({seed:'treasure-options'}),team=room.teams.A;
  assert.equal(team.treasureChoices.length,3);assert.equal(new Set(team.treasureChoices).size,3);
  assert.throws(()=>game.chooseTreasure(room,who,'missing'),/无效/);
  team.treasureChoices=['prototype'];game.chooseTreasure(room,who,'prototype');assert.equal(team.score,1);
  assert.throws(()=>game.chooseTreasure(room,who,'prototype'),/无效/);
  game.reset(room,{role:'host'});assert.equal(room.teams.A.treasure,null);assert.equal(room.teams.A.treasureChoices.length,3);
});
test('挖宝可放弃双倍收入换牌，或领取收入',()=>{
  const {room,team}=setup('dig');travel(room,team,['R5']);assert.equal(team.money,500);
  assert.equal(team.pendingTreasureDig,true);const old=team.hand[0].id;
  game.resolveTreasureDig(room,who,[old]);assert.equal(team.hand.length,6);assert.equal(team.hand.some(c=>c.id===old),false);
  if(!team.cardActionDone)game.skipUse(room,who);game.endTurn(room,who);team.position='R4';travel(room,team,['R5']);
  game.resolveTreasureDig(room,who,[]);assert.equal(team.money,560);
});
test('银行、市场与付费卡的宝物奖励',()=>{
  for(const [id,expectedMoney,expectedIncome] of [['dividend',500,40],['compound',460,45]]){
    const {room,team}=setup(id,'A2');travel(room,team,['Arcaea']);game.skipUse(room,who);game.houseAction(room,who);
    assert.equal(team.money,expectedMoney);assert.equal(team.income,expectedIncome);
  }
  const market=setup('merchant','P2');market.team.score=2;travel(market.room,market.team,['Phigros']);game.skipUse(market.room,who);game.houseAction(market.room,who);assert.equal(market.team.money,800);
  const cashback=setup('cashback','A2');travel(cashback.room,cashback.team,['Arcaea']);const card=cashback.team.hand[0];card.cost=100;card.game_type='all';card.condition='无';card.effect_type='money';card.effectValue=0;
  game.useCard(cashback.room,who,card.id);assert.equal(cashback.team.money,410);
});
test('高点移动免税次数、低点停在厄运与首次厄运保护',()=>{
  const tax=setup('move_tax','R9');travel(tax.room,tax.team,['F4','F3','范式起源'],5);assert.equal(tax.team.money,500);assert.equal(tax.team.treasureCharges,2);
  const slow=setup('slow_misfortune','R2');travel(slow.room,slow.team,['B'],2);assert.equal(slow.team.treasureCharges,1);assert.equal(slow.room.pendingMisfortuneChoice,null);
  const debut=setup('debut','R2');debut.room.misfortuneDeck=[MISFORTUNES.find(c=>c.effect_type==='score')];travel(debut.room,debut.team,['B','R8']);assert.equal(debut.team.firstMisfortuneProtected,false);assert.equal(debut.team.score,0);
});
test('暴乱关系自行二选一，考古只结算最后骰点',()=>{
  const riot=setup('riot','R2');riot.room.misfortuneDeck=[MISFORTUNES.find(c=>c.effect_type==='score'),MISFORTUNES.find(c=>c.effect_type==='income')];travel(riot.room,riot.team,['B','R8']);assert.equal(riot.room.pendingMisfortuneChoice.target,'A');game.misfortunePick(riot.room,who,1);assert.equal(riot.room.pendingMisfortuneChoice,null);
  const dig=setup('archaeology','F3');travel(dig.room,dig.team,['范式起源']);game.skipUse(dig.room,who);
  dig.room.randomInt=()=>0;game.houseAction(dig.room,who);assert.equal(dig.team.money,500);assert.equal(dig.team.pendingTreasureReroll.firstRoll,1);
  dig.room.randomInt=()=>5;game.treasureReroll(dig.room,who,true);assert.equal(dig.team.money,700);
});
