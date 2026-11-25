const test=require('node:test');
const assert=require('node:assert/strict');
const game=require('./game');
const {HAND}=require('./catalog');

const who={role:'team',id:'A'};
const host={role:'host'};
function arrive(cardId,house){
  const room=game.createRoom({seed:`update-${cardId}-${house}`}),team=room.teams.A;
  const index=team.hand.findIndex(card=>card.sourceId===cardId);
  if(index<0){
    const deckIndex=team.deck.findIndex(card=>card.sourceId===cardId);
    assert.ok(deckIndex>=0);
    [team.hand[0],team.deck[deckIndex]]=[team.deck[deckIndex],team.hand[0]];
  }
  const card=team.hand.find(item=>item.sourceId===cardId);
  team.position=house==='Phigros'?'P2':'F3';
  const mover=team.hand.find(item=>item.id!==card.id&&item.move!==7);
  assert.ok(mover);mover.move=1;
  game.move(room,who,mover.id,[house]);
  return {room,team,card};
}

test('三张旧牌的使用条件与成品卡保持对应',()=>{
  assert.equal(HAND.find(card=>card.id==='card1').condition,'游玩Rubbish Sorting IN难度达到full combo');
  assert.equal(HAND.find(card=>card.id==='card5').condition,'游玩Breach of Faith BYD难度达到980w分');
  assert.equal(HAND.find(card=>card.id==='card6').condition,'游玩Turning Point MSV难度达到1007500');
  for(const id of ['card1','card5','card6','card9','card44'])assert.match(HAND.find(card=>card.id===id).image,new RegExp(`${id}\\.png`));
});

test('魔幻饰品挑战成功后结算卡牌骰子，并跳过本次范式起源建筑效果',()=>{
  const {room,team,card}=arrive('card9','范式起源');
  game.useCard(room,who,card.id);
  assert.equal(team.houseActionDone,false);
  game.resolveChallenge(room,host,'A',true);
  assert.equal(team.houseActionDone,true);
  assert.equal(room.records.at(-1).houseActionSkipped,true);
  assert.ok(team.pendingReroll);
  game.resolveReroll(room,who,false);
  assert.equal(team.pendingReroll,null);
  assert.throws(()=>game.houseAction(room,who),/不能使用建筑效果/);
  const failed=arrive('card9','范式起源');
  game.useCard(failed.room,who,failed.card.id);
  game.resolveChallenge(failed.room,host,'A',false);
  assert.equal(failed.team.houseActionDone,false);
  game.houseAction(failed.room,who);
  assert.equal(failed.team.houseActionDone,true);
});

test('双人成行挑战成功后可选择手牌复制到牌堆顶部，下一次抽牌得到副本',()=>{
  const {room,team,card}=arrive('card44','Phigros');
  assert.equal(card.move,2);assert.equal(card.cost,200);
  game.useCard(room,who,card.id);
  assert.equal(team.money,0);
  assert.equal(team.pendingCopy,false);
  game.resolveChallenge(room,host,'A',true);
  assert.equal(team.pendingCopy,true);
  const selected=team.hand[0],deckCount=team.deck.length;
  assert.throws(()=>game.endTurn(room,who),/请先使用手牌/);
  assert.throws(()=>game.copyHandCard(room,who,'missing'),/不能复制/);
  game.copyHandCard(room,who,selected.id);
  const duplicate=team.deck[0];
  assert.equal(team.deck.length,deckCount+1);
  assert.equal(duplicate.sourceId,selected.sourceId);
  assert.notEqual(duplicate.id,selected.id);
  assert.equal(team.pendingCopy,false);
  game.endTurn(room,who);
  const mover=team.hand.find(item=>item.id!==selected.id&&item.move!==7);
  assert.ok(mover);mover.move=1;
  game.move(room,who,mover.id,['P1']);
  assert.ok(team.hand.some(item=>item.id===duplicate.id));
  const failed=arrive('card44','Phigros');
  game.useCard(failed.room,who,failed.card.id);
  game.resolveChallenge(failed.room,host,'A',false);
  assert.equal(failed.team.pendingCopy,false);
});
