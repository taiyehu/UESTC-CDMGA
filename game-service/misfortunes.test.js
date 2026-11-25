const test=require('node:test');
const assert=require('node:assert/strict');
const game=require('./game');
const {MISFORTUNES}=require('./catalog');

const who=id=>({role:'team',id});
function trigger(id,{initialMoney=200,score=0,roll}={}){
  const room=game.createRoom({seed:`new-${id}-${roll||0}`,initialMoney}),team=room.teams.A;
  room.misfortuneDeck=[MISFORTUNES.find(card=>card.id===id)];
  team.score=score;team.position='R2';
  const mover=team.hand.find(card=>card.sourceId!=='card22'&&card.move!==7&&!['score_move_fee','teleport_move_fee_tax','score_skip_if_moved'].includes(card.effect_type));
  mover.move=2;
  if(roll)room.randomInt=()=>roll-1;
  game.move(room,who('A'),mover.id,['B','R8']);
  if(team.pendingMisfortuneCard)game.skipUse(room,who('A'));
  return {room,team};
}

test('七张新厄运均入库并使用提供的成品卡面',()=>{
  for(const id of ['mis7','mis9','mis10','mis11','mis12','mis13','mis14']){
    const card=MISFORTUNES.find(item=>item.id===id);
    assert.ok(card?.effect);
    assert.match(card.image,new RegExp(`/output/${id}\\.png$`));
  }
});

test('抽奖按骰点调整金钱；收入与其他队伍金钱效果按卡面结算',()=>{
  for(const [roll,delta] of [[1,-100],[2,-70],[3,-50],[4,-30],[5,-10],[6,10]]){
    const {room,team}=trigger('mis7',{roll});
    assert.equal(team.money,180+delta);
    assert.equal(room.diceRolls.at(-1).value,roll);
  }
  assert.equal(trigger('mis11').team.income,20);
  const others=trigger('mis12').room;
  assert.equal(others.teams.A.money,180);
  assert.equal(others.teams.B.money,250);
  assert.equal(others.teams.C.money,250);
  const attendance=trigger('mis14').room;
  for(const team of Object.values(attendance.teams))assert.equal(team.income,20);
});

test('赎金可以选择金钱或积分，余额不足时只能扣积分',()=>{
  const cash=trigger('mis9',{score:5});
  assert.equal(cash.room.pendingMisfortuneEffect.kind,'ransom');
  game.misfortuneRansom(cash.room,who('A'),'money');
  assert.equal(cash.team.money,30);assert.equal(cash.team.score,5);
  assert.equal(cash.room.pendingMisfortuneEffect,null);
  const points=trigger('mis9',{score:5});
  game.misfortuneRansom(points.room,who('A'),'score');
  assert.equal(points.team.money,180);assert.equal(points.team.score,3);
  const poor=trigger('mis9',{initialMoney:100,score:5});
  assert.equal(poor.room.pendingMisfortuneEffect,null);
  assert.equal(poor.team.score,3);
});

test('命运共享只向目标展示手牌，目标可交换或放弃',()=>{
  const {room,team}=trigger('mis10'),sourceCard=team.hand[0],targetCard=room.teams.B.hand[0];
  game.misfortuneSwapTarget(room,who('A'),'B');
  assert.equal(game.state(room,who('B')).pendingMisfortuneEffect.sourceHand.length,6);
  assert.equal(game.state(room,who('C')).pendingMisfortuneEffect.sourceHand,undefined);
  game.misfortuneSwap(room,who('B'),true,sourceCard.id,targetCard.id);
  assert.ok(room.teams.A.hand.some(card=>card.id===targetCard.id));
  assert.ok(room.teams.B.hand.some(card=>card.id===sourceCard.id));
  assert.equal(room.teams.A.hand.length,6);assert.equal(room.teams.B.hand.length,6);
  const declined=trigger('mis10');
  game.misfortuneSwapTarget(declined.room,who('A'),'C');
  game.misfortuneSwap(declined.room,who('C'),false);
  assert.equal(declined.room.pendingMisfortuneEffect,null);
});

test('握握双手等待三队选好，再同时沿 A→B→C→A 传递两张',()=>{
  const {room}=trigger('mis13');
  const original=Object.fromEntries('ABC'.split('').map(id=>[id,room.teams[id].hand.map(card=>card.id)]));
  assert.throws(()=>game.misfortunePassCards(room,who('A'),[original.A[0],original.A[0]]),/两张不同/);
  game.misfortunePassCards(room,who('A'),original.A.slice(0,2));
  game.misfortunePassCards(room,who('B'),original.B.slice(0,2));
  for(const id of 'ABC')assert.deepEqual(room.teams[id].hand.map(card=>card.id),original[id]);
  game.misfortunePassCards(room,who('C'),original.C.slice(0,2));
  assert.equal(room.pendingMisfortuneEffect,null);
  for(const id of 'ABC')assert.equal(room.teams[id].hand.length,6);
  for(const [from,to] of [['A','B'],['B','C'],['C','A']])for(const cardId of original[from].slice(0,2))assert.ok(room.teams[to].hand.some(card=>card.id===cardId));
});

test('多张厄运的待操作结算遵循抽取先后',()=>{
  const room=game.createRoom({seed:'misfortune-order',initialMoney:200}),a=room.teams.A;
  room.misfortuneDeck=['mis9','mis1'].map(id=>MISFORTUNES.find(card=>card.id===id));
  a.position='R8';const mover=a.hand.find(card=>card.sourceId!=='card22'&&!['score_move_fee','teleport_move_fee_tax','score_skip_if_moved'].includes(card.effect_type));mover.move=4;
  game.move(room,who('A'),mover.id,['B','R2','B','R8']);
  assert.equal(game.currentPendingKind(room),'misfortuneEffect');
  game.misfortuneRansom(room,who('A'),'score');
  assert.equal(game.currentPendingKind(room),'auction');
});
