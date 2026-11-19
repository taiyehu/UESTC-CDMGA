const test=require('node:test');
const assert=require('node:assert/strict');
const game=require('./game');
const {HAND,MISFORTUNES}=require('./catalog');

const teamWho=id=>({role:'team',id});
function putCard(team,sourceId,slot=0){
  const held=team.hand.find(card=>card.sourceId===sourceId);
  if(held)return held;
  const index=team.deck.findIndex(card=>card.sourceId===sourceId);
  assert.ok(index>=0,`${sourceId} should be in the deck`);
  const card=team.deck[index];
  team.deck[index]=team.hand[slot];team.hand[slot]=card;
  return card;
}
function arrive(sourceId,house,initialMoney=1000){
  const room=game.createRoom({seed:`new-${sourceId}`,initialMoney}),team=room.teams.A,who=teamWho('A');
  const card=putCard(team,sourceId);
  team.position={Arcaea:'A2',Phigros:'P2','范式起源':'F3'}[house];
  const mover=team.hand.find(other=>other.id!==card.id&&other.move!==7&&
    !['score_move_fee','teleport_move_fee_tax','score_skip_if_moved'].includes(other.effect_type));
  assert.ok(mover);mover.move=1;
  game.move(room,who,mover.id,[house]);
  return {room,team,who,card};
}

test('新卡牌和卡面完整入库',()=>{
  assert.equal(HAND.length,27);
  for(let n=17;n<=27;n++){
    const card=HAND.find(row=>row.id===`card${n}`);
    assert.ok(card?.name);
    assert.equal(card.image,`/game-assets/cards/output/card${n}.png`);
  }
});

test('交锋和与我一战在税格免税并发起本轮定向战斗',()=>{
  for(const sourceId of ['card17','card18']){
    const room=game.createRoom({seed:sourceId,initialMoney:1000}),a=room.teams.A,who=teamWho('A');
    const card=putCard(a,sourceId);
    a.position='R1';
    for(const held of a.hand)held.move=Math.min(held.move,3);
    const mover=a.hand.find(held=>held.id!==card.id&&!['score_move_fee','teleport_move_fee_tax','score_skip_if_moved'].includes(held.effect_type));mover.move=1;
    const record=game.move(room,who,mover.id,['R2']);
    assert.equal(a.money,980);
    assert.equal(game.canUse(a,card),true);
    if(sourceId==='card17'){
      a.hand.find(held=>held.id!==card.id).move=4;
      assert.equal(game.canUse(a,card),false);
      a.hand.find(held=>held.id!==card.id).move=2;
    }
    game.useCard(room,who,card.id);
    assert.equal(a.money,sourceId==='card17'?1000:900);
    assert.equal(record.taxRefunded,true);
    game.chooseCardTarget(room,who,'B');
    const battle=room.battles.find(item=>item.forced);
    assert.equal(battle.targetTeam,'B');assert.equal(battle.round,1);
    assert.equal(battle.status,'待选人');
    const b=room.teams.B;b.position=sourceId==='card17'?'R1':'R3';b.hand[0].move=1;
    game.move(room,teamWho('B'),b.hand[0].id,[sourceId==='card17'?'R2':'R4']);
    assert.equal(battle.status,'待结算');
    assert.equal(room.battles.length,1);
    game.battle(room,{role:'host'},battle.id,'A');
    assert.equal(battle.winner,'A');
  }
});

test('移动代价、跳过回合、传送和收入免税按卡面生效',()=>{
  const mighty=game.createRoom({seed:'mighty',initialMoney:2000}),a=mighty.teams.A;
  const mightyCard=putCard(a,'card19');a.position='A2';
  game.move(mighty,teamWho('A'),mightyCard.id,['Arcaea']);
  assert.equal(a.money,1980);
  const score=arrive('card19','Arcaea',2000);
  game.useCard(score.room,score.who,score.card.id);
  game.resolveChallenge(score.room,{role:'host'},'A',true);
  assert.equal(score.team.score,15);

  const sword=game.createRoom({seed:'sword',initialMoney:1000}),s=sword.teams.A;
  const swordCard=putCard(s,'card21');s.position='F3';
  game.move(sword,teamWho('A'),swordCard.id,['范式起源']);
  game.skipUse(sword,teamWho('A'));game.endTurn(sword,teamWho('A'));
  assert.equal(s.round,3);assert.equal(s.skipNextTurn,false);

  const bribe=game.createRoom({seed:'bribe',initialMoney:1000}),b=bribe.teams.A;
  const bribeCard=putCard(b,'card26');b.position='R1';
  game.move(bribe,teamWho('A'),bribeCard.id,['R2','R3','R4','R5','R6']);
  assert.equal(b.money,1000-20-10-10+30-20);
  const used=game.createRoom({seed:'bribe-used',initialMoney:1000}),u=used.teams.A;
  const usedCard=putCard(u,'card26');u.position='R1';
  const mover=u.hand.find(card=>card.id!==usedCard.id&&!['score_move_fee','teleport_move_fee_tax','score_skip_if_moved'].includes(card.effect_type));mover.move=1;
  game.move(used,teamWho('A'),mover.id,['R2']);
  game.useCard(used,teamWho('A'),usedCard.id);
  assert.equal(u.money,930);
  game.teleport(used,teamWho('A'),'P2');assert.equal(u.position,'P2');

  const relation=game.createRoom({seed:'relation',initialMoney:1000}),r=relation.teams.A;
  const relationCard=putCard(r,'card27');r.position='R1';
  const relationMover=r.hand.find(card=>card.id!==relationCard.id&&!['score_move_fee','teleport_move_fee_tax','score_skip_if_moved'].includes(card.effect_type));relationMover.move=1;
  game.move(relation,teamWho('A'),relationMover.id,['R2']);
  game.useCard(relation,teamWho('A'),relationCard.id);
  assert.equal(r.money,1030);
});

test('新建筑卡结算金钱、积分和额外用牌',()=>{
  for(const [id,house,score,money] of [
    ['card20','Phigros',0,150],['card23','Arcaea',7,-400],['card24','Arcaea',1,50]
  ]){
    const {room,team,who,card}=arrive(id,house);
    const before=team.money;
    game.useCard(room,who,card.id);
    game.resolveChallenge(room,{role:'host'},'A',true);
    assert.equal(team.score,score);assert.equal(team.money,before+money);
  }
  const extra=arrive('card25','范式起源');
  const second=putCard(extra.team,'card9',1);
  game.useCard(extra.room,extra.who,extra.card.id);
  game.resolveChallenge(extra.room,{role:'host'},'A',true);
  assert.equal(extra.team.cardActionDone,false);
  assert.equal(extra.team.extraCardUsesThisRound,1);
  game.useCard(extra.room,extra.who,second.id);
  game.resolveChallenge(extra.room,{role:'host'},'A',false);
  assert.equal(extra.team.cardActionDone,true);
  assert.equal(extra.room.records[0].usedCards.length,2);
});

test('厄运火杆可将一次厄运转给另一队，也可放弃使用',()=>{
  for(const redirect of [true,false]){
    const room=game.createRoom({seed:`mis-${redirect}`,initialMoney:1000}),a=room.teams.A,who=teamWho('A');
    const card=putCard(a,'card22');a.position='R2';
    const mover=a.hand.find(held=>held.id!==card.id);mover.move=2;
    room.misfortuneDeck=[MISFORTUNES.find(item=>item.id==='mis2')];
    game.move(room,who,mover.id,['B','R8']);
    assert.ok(a.pendingMisfortuneCard);
    if(redirect){
      game.useCard(room,who,card.id);
      game.chooseCardTarget(room,who,'B');
      assert.equal(a.debuffs.length,0);
      assert.equal(room.teams.B.debuffs[0].id,'mis2');
      assert.equal(room.records[0].misfortune[0].redirectedTo,'B');
    }else{
      game.skipUse(room,who);
      assert.equal(a.debuffs[0].id,'mis2');
    }
    assert.equal(a.pendingMisfortuneCard,null);
  }
});
