const test=require('node:test');
const assert=require('node:assert/strict');
const game=require('./game');
const {HAND,EVENTS,MISFORTUNES}=require('./catalog');

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
  assert.equal(HAND.length,37);
  for(let n=17;n<=37;n++){
    const card=HAND.find(row=>row.id===`card${n}`);
    assert.ok(card?.name);
    assert.equal(card.image,`/game-assets/cards/output/card${n}.png`);
  }
  assert.equal(EVENTS.length,8);assert.equal(MISFORTUNES.length,6);
});

test('旧房间加载时补入新牌且不会重复添加',()=>{
  const room=game.createRoom({seed:'catalog-upgrade'});
  delete room.catalogVersion;
  for(const team of Object.values(room.teams)){
    team.hand=team.hand.filter(card=>Number(card.sourceId.slice(4))<=27);
    team.deck=team.deck.filter(card=>Number(card.sourceId.slice(4))<=27);
    team.discard=[];
  }
  room.eventDeck=room.eventDeck.filter(card=>Number(card.id.slice(5))<=6);
  room.misfortuneDeck=room.misfortuneDeck.filter(card=>Number(card.id.slice(3))<=5);
  game.hydrate(room);
  for(const team of Object.values(room.teams))assert.equal(team.hand.length+team.deck.length+team.discard.length,37);
  assert.equal(room.eventDeck.length+room.eventDiscard.length,8);
  assert.equal(room.misfortuneDeck.length+room.misfortuneDiscard.length,6);
  game.hydrate(room);
  assert.equal(room.teams.A.hand.length+room.teams.A.deck.length,37);
});

test('反转了清除 debuff 并抽等量 buff，燃起来了奖励下一次战斗胜利',()=>{
  const clear=arrive('card28','Phigros');
  clear.team.debuffs=[{name:'甲',effect:'甲'},{name:'乙',effect:'乙'}];
  game.useCard(clear.room,clear.who,clear.card.id);
  assert.equal(clear.team.debuffs.length,0);
  assert.equal(clear.team.eventShield+clear.team.misfortuneShield+clear.team.debuffShield,2);
  const battle=arrive('card29','Phigros');
  game.useCard(battle.room,battle.who,battle.card.id);
  game.resolveChallenge(battle.room,{role:'host'},'A',true);
  assert.equal(battle.team.nextBattleWinBonus,2);
});

test('记忆工厂重放卡牌和建筑效果，零號車輛允许自选下次步数',()=>{
  const replay=arrive('card30','Arcaea');
  replay.team.lastResolvedCard=HAND.find(card=>card.id==='card2');
  replay.team.lastHouse='范式起源';
  const income=replay.team.income,money=replay.team.money;
  game.useCard(replay.room,replay.who,replay.card.id);
  game.resolveChallenge(replay.room,{role:'host'},'A',true);
  assert.equal(replay.team.income,income+10);
  assert.ok(replay.team.money>money-150);
  const choice=arrive('card31','Phigros');
  game.useCard(choice.room,choice.who,choice.card.id);
  game.resolveChallenge(choice.room,{role:'host'},'A',true);
  assert.equal(choice.team.chooseNextSteps,true);
  game.endTurn(choice.room,choice.who);
  choice.team.position='R1';
  const mover=choice.team.hand.find(card=>card.move!==7);
  assert.equal(game.roll(choice.room,choice.who,mover.id,2),2);
  const record=game.move(choice.room,choice.who,mover.id,['R2','R3']);
  assert.equal(record.card.steps,2);
  assert.equal(choice.team.chooseNextSteps,false);
});

test('创造性AI在事件格抽两张，大炮发射允许选择目的地',()=>{
  const room=game.createRoom({seed:'double-event',initialMoney:1000}),team=room.teams.A,who=teamWho('A');
  const card=putCard(team,'card32');
  const mover=team.hand.find(held=>held.id!==card.id&&held.move!==7);mover.move=1;
  team.position='R4';room.eventDeck=['event1','event8'].map(id=>EVENTS.find(event=>event.id===id));
  const record=game.move(room,who,mover.id,['P2']);
  game.useCard(room,who,card.id);
  assert.equal(record.events.length,2);
  assert.equal(team.doubleEvent,true);
  assert.equal(team.pendingTeleport,true);
  game.teleport(room,who,'R7');
  assert.equal(team.position,'R7');
});

test('海神九考保护一次战斗落败，挖到宝了允许下次挑战自行选曲',()=>{
  const rescue=arrive('card34','Phigros');
  game.useCard(rescue.room,rescue.who,rescue.card.id);
  game.resolveChallenge(rescue.room,{role:'host'},'A',true);
  assert.equal(rescue.team.score,1);assert.equal(rescue.team.battleRescue,1);
  const own=rescue.room.records.at(-1);
  rescue.room.records.push({id:'opponent',team:'B',round:own.round,node:own.node});
  rescue.room.battles.push({id:'rescue-battle',first:own.id,second:'opponent',round:own.round,node:own.node,status:'待结算'});
  const money=rescue.team.money;
  game.battle(rescue.room,{role:'host'},'rescue-battle','B');
  assert.equal(rescue.team.score,1);assert.equal(rescue.team.money,money+30);assert.equal(rescue.team.battleRescue,0);
  const song=arrive('card35','Phigros');
  game.useCard(song.room,song.who,song.card.id);
  game.resolveChallenge(song.room,{role:'host'},'A',true);
  assert.equal(song.team.score,2);assert.equal(song.team.freeSongChallenge,1);
  const next=putCard(song.team,'card1');song.team.cardActionDone=false;song.team.cardUsesThisRound=0;
  game.useCard(song.room,song.who,next.id);
  assert.equal(song.team.pendingChallenge.freeSong,true);
  assert.equal(song.team.freeSongChallenge,0);
});

test('彼岸双生连接对方并在己方落败时惩罚对方',()=>{
  const {room,team,who,card}=arrive('card36','Arcaea');
  game.useCard(room,who,card.id);game.resolveChallenge(room,{role:'host'},'A',true);
  game.chooseCardTarget(room,who,'B');
  assert.equal(team.score,2);assert.equal(team.linkedTeamId,'B');
  const own=room.records.at(-1);room.records.push({id:'linked-opponent',team:'B',round:own.round,node:own.node});
  room.teams.B.score=10;
  room.battles.push({id:'linked-battle',first:own.id,second:'linked-opponent',round:own.round,node:own.node,status:'待结算'});
  game.battle(room,{role:'host'},'linked-battle','B');
  assert.equal(room.teams.B.score,8);
});

test('忘忘队立大功可在别队出牌时成功抵消或挑战失败后放行',()=>{
  for(const counterSuccess of [true,false]){
    const {room,team,who,card}=arrive('card2','Arcaea');
    room.teams.B.joined=true;room.teams.B.money=1000;
    const counter=putCard(room.teams.B,'card37');
    const income=team.income;
    game.useCard(room,who,card.id);
    assert.equal(room.pendingCardReaction.responders[0],'B');
    game.counterResponse(room,teamWho('B'),true,counter.id);
    game.resolveChallenge(room,{role:'host'},'B',counterSuccess);
    assert.equal(room.pendingCardReaction,null);
    if(counterSuccess){assert.equal(team.income,income);assert.equal(room.teams.B.score,1);}
    else{assert.ok(team.pendingChallenge);game.resolveChallenge(room,{role:'host'},'A',true);assert.equal(team.income,income+10);}
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
    for(const held of a.hand)held.move=Math.min(held.move,3);
    a.cardActionDone=false;
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

test('新建筑卡结算金钱与积分',()=>{
  for(const [id,house,score,money] of [
    ['card20','Phigros',0,150],['card23','Arcaea',7,-400],['card24','Arcaea',1,50]
  ]){
    const {room,team,who,card}=arrive(id,house);
    const before=team.money;
    game.useCard(room,who,card.id);
    game.resolveChallenge(room,{role:'host'},'A',true);
    assert.equal(team.score,score);assert.equal(team.money,before+money);
  }
});

test('二手货只在事件格出牌，成功后可再用一张卡',()=>{
  const building=arrive('card25','范式起源');
  assert.equal(game.canUse(building.team,building.card),false);
  building.card.game_type='fanshi'; // 已保存房间可能仍持有旧的卡牌元数据
  assert.equal(game.canUse(building.team,building.card),false);
  assert.throws(()=>game.useCard(building.room,building.who,building.card.id),/使用地点/);

  const room=game.createRoom({seed:'secondhand-event',initialMoney:1000}),team=room.teams.A,who=teamWho('A');
  const card=putCard(team,'card25');
  const bluff=putCard(team,'card7',team.hand.indexOf(card)===0?1:0);
  team.position='R4';
  const mover=team.hand.find(held=>held.id!==card.id&&held.id!==bluff.id&&held.move!==7&&
    !['score_move_fee','teleport_move_fee_tax','score_skip_if_moved'].includes(held.effect_type));
  mover.move=1;game.move(room,who,mover.id,['P2']);
  assert.equal(team.pendingEvent,true);
  assert.equal(game.canUse(team,card),true);
  game.useCard(room,who,card.id);
  game.resolveChallenge(room,{role:'host'},'A',true);
  assert.equal(team.money,1060);
  assert.equal(team.extraCardUsesThisRound,1);
  assert.equal(team.cardActionDone,false);
  game.useCard(room,who,bluff.id);
  assert.equal(room.records[0].event.id,'cancelled');
  assert.equal(team.pendingEvent,false);
  assert.equal(team.cardActionDone,true);

  const solo=game.createRoom({seed:'secondhand-solo'}),soloTeam=solo.teams.A,soloWho=teamWho('A');
  const soloCard=putCard(soloTeam,'card25');soloTeam.eventShield=1;soloTeam.position='R4';
  const soloMover=soloTeam.hand.find(held=>held.id!==soloCard.id&&held.move!==7);soloMover.move=1;
  game.move(solo,soloWho,soloMover.id,['P2']);
  assert.equal(soloTeam.pendingEvent,false);
  assert.equal(soloTeam.cardActionDone,false);
  game.useCard(solo,soloWho,soloCard.id);
  game.resolveChallenge(solo,{role:'host'},'A',true);
  assert.equal(soloTeam.cardActionDone,false);
  game.skipUse(solo,soloWho);
  game.endTurn(solo,soloWho);
});

test('二手货挑战失败后仍会翻开待结算的事件牌',()=>{
  const room=game.createRoom({seed:'secondhand-fail'}),team=room.teams.A,who=teamWho('A');
  const card=putCard(team,'card25');
  putCard(team,'card7',team.hand.indexOf(card)===0?1:0);
  room.eventDeck=[EVENTS.find(event=>event.id==='event1')];
  team.position='R4';
  const mover=team.hand.find(held=>held.id!==card.id&&held.effect_type!=='event_cancel_random'&&held.move!==7);
  mover.move=1;game.move(room,who,mover.id,['P2']);
  game.useCard(room,who,card.id);
  game.resolveChallenge(room,{role:'host'},'A',false);
  assert.equal(team.pendingEvent,false);
  assert.equal(team.cardActionDone,true);
  assert.equal(room.records[0].event.id,'event1');
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
