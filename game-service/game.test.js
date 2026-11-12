const test=require('node:test');
const assert=require('node:assert/strict');
const g=require('./game');
const {EVENTS,MISFORTUNES}=require('./catalog');
const {reachable}=require('./public/routes');
const {NODE_TYPES}=require('./map-data');
function arriveWithCard(sourceId,house,initialMoney=1000){
  const room=g.createRoom({seed:`use-${sourceId}`,initialMoney}),t=room.teams.A,who={role:'team',id:'A'};
  const card=t.hand.find(c=>c.sourceId===sourceId)||t.deck.find(c=>c.sourceId===sourceId);
  if(!t.hand.includes(card)){const old=t.hand[0];t.hand[0]=card;t.deck[t.deck.indexOf(card)]=old;}
  const before={Phigros:'P2',Arcaea:'A2','范式起源':'F3'}[house];
  t.position=before;const mover=t.hand.find(c=>c.id!==card.id&&c.move!==7);mover.move=1;
  g.move(room,who,mover.id,[house]);
  return {room,t,who,card};
}

test('裁判设置初始金钱和收入，三队积分始终从 0 开始，重置复原',()=>{
  const defaults=g.createRoom();
  assert.equal(defaults.initialMoney,200);
  assert.equal(defaults.initialIncome,30);
  const room=g.createRoom({seed:'money',initialMoney:500,initialIncome:30});
  for(const id of 'ABC'){
    assert.equal(room.teams[id].money,500);
    assert.equal(room.teams[id].income,30);
    assert.equal(room.teams[id].score,0);
  }
  room.teams.A.money=1;room.teams.A.score=10;
  g.reset(room,{role:'host'});
  assert.equal(room.teams.A.money,500);
  assert.equal(room.teams.A.score,0);
  assert.throws(()=>g.createRoom({initialMoney:-1}),/初始金钱/);
  assert.throws(()=>g.createRoom({initialIncome:1.5}),/初始收入/);
});

test('起点为三个不同建筑，固定种子重置后分配不变',()=>{
  const room=g.createRoom({seed:'starts'});
  const starts='ABC'.split('').map(id=>room.teams[id].position);
  assert.deepEqual(new Set(starts),new Set(['Arcaea','Phigros','范式起源']));
  g.reset(room,{role:'host'});
  assert.deepEqual('ABC'.split('').map(id=>room.teams[id].position),starts);
});

test('移动后必须手动结束回合才能再次移动',()=>{
  const room=g.createRoom({seed:'turn'}),t=room.teams.A,who={role:'team',id:'A'};
  const card=t.hand.find(c=>c.move!==7);let at=t.position;const route=[];
  for(let i=0;i<card.move;i++){at=g.GRAPH[at][0];route.push(at);}
  assert.throws(()=>g.endTurn(room,who),/先完成/);
  g.move(room,who,card.id,route);
  assert.equal(t.round,1);assert.equal(t.awaitingEnd,true);
  assert.throws(()=>g.move(room,who,t.hand[0].id,route),/结束当前回合/);
  g.endTurn(room,who);
  assert.equal(t.round,2);assert.equal(t.awaitingEnd,false);
  assert.equal(g.state(room,who).teams.A.round,2);
});

test('房屋卡牌阶段可跳过，使用时扣费并由裁判判定挑战',()=>{
  const {room,t,who,card}=arriveWithCard('card1','Phigros',500);
  assert.equal(t.cardActionDone,false);
  assert.throws(()=>g.endTurn(room,who),/使用手牌/);
  g.useCard(room,who,card.id);
  assert.equal(t.money,200);assert.ok(t.pendingChallenge);
  assert.equal(room.cardFlows.length,2);
  assert.equal(room.cardFlows[1].spent.name,'回收机');
  assert.throws(()=>g.endTurn(room,who),/使用手牌/);
  g.resolveChallenge(room,{role:'host'},'A',true);
  assert.equal(t.score,4);assert.equal(t.cardActionDone,true);
  g.endTurn(room,who);
  const skipped=arriveWithCard('card1','Phigros',100);
  assert.throws(()=>g.useCard(skipped.room,skipped.who,skipped.card.id),/金钱不足/);
  g.skipUse(skipped.room,skipped.who);g.endTurn(skipped.room,skipped.who);
});

test('战斗表记录移动牌、使用牌及未使用选择',()=>{
  const played=arriveWithCard('card1','Phigros',500),record=played.room.records[0];
  assert.equal(record.card.steps,1);
  g.useCard(played.room,played.who,played.card.id);
  assert.equal(record.usedCard.name,'回收机');
  assert.equal(record.usedCard.result,'待判定');
  g.resolveChallenge(played.room,{role:'host'},'A',true);
  assert.equal(record.usedCard.result,'成功');
  const skipped=arriveWithCard('card1','Phigros');
  g.skipUse(skipped.room,skipped.who);
  assert.equal(skipped.room.records[0].cardSkipped,true);
  assert.equal(skipped.room.records[0].usedCard,null);
});

test('三座建筑每回合各可使用一次，按余额和积分校验',()=>{
  const arcaea=arriveWithCard('card2','Arcaea',100);
  g.skipUse(arcaea.room,arcaea.who);g.houseAction(arcaea.room,arcaea.who);
  assert.equal(arcaea.t.money,60);assert.equal(arcaea.t.income,40);
  assert.equal(arcaea.room.incomeChanges[0].amount,10);
  assert.throws(()=>g.houseAction(arcaea.room,arcaea.who),/不能使用/);
  assert.equal(arcaea.room.records[0].houseAction.house,'Arcaea');
  const fanshi=arriveWithCard('card4','范式起源');fanshi.room.randomInt=()=>5;
  g.skipUse(fanshi.room,fanshi.who);g.houseAction(fanshi.room,fanshi.who);
  assert.equal(fanshi.t.money,1200);assert.match(fanshi.room.records[0].houseAction.detail,/掷出 6/);
  const phigros=arriveWithCard('card1','Phigros',0);g.skipUse(phigros.room,phigros.who);
  assert.throws(()=>g.houseAction(phigros.room,phigros.who),/积分/);
  phigros.t.score=2;g.houseAction(phigros.room,phigros.who);
  assert.equal(phigros.t.score,1);assert.equal(phigros.t.money,200);
});

test('成品手牌的收入、传送、厄运抵消、额外移动与机械帮手能力',()=>{
  const host={role:'host'};
  const income=arriveWithCard('card2','Arcaea');g.useCard(income.room,income.who,income.card.id);
  g.resolveChallenge(income.room,host,'A',true);assert.equal(income.t.income,40);
  const teleport=arriveWithCard('card3','Phigros');g.useCard(teleport.room,teleport.who,teleport.card.id);
  g.resolveChallenge(teleport.room,host,'A',true);assert.equal(teleport.t.pendingTeleport,true);
  g.teleport(teleport.room,teleport.who,'R12');assert.equal(teleport.t.position,'R12');
  assert.equal(teleport.room.records[0].node,'Phigros');assert.equal(teleport.room.records[0].finalPosition,'R12');
  const shield=arriveWithCard('card4','范式起源');g.useCard(shield.room,shield.who,shield.card.id);
  g.resolveChallenge(shield.room,host,'A',true);assert.equal(shield.t.misfortuneShield,1);
  g.endTurn(shield.room,shield.who);shield.t.position='R2';const shieldMover=shield.t.hand.find(c=>c.move!==7);shieldMover.move=1;
  g.move(shield.room,shield.who,shieldMover.id,['B']);
  assert.equal(shield.t.misfortuneShield,0);assert.equal(shield.room.pendingAuction,null);
  const extra=arriveWithCard('card5','Arcaea');g.useCard(extra.room,extra.who,extra.card.id);
  g.resolveChallenge(extra.room,host,'A',true);assert.equal(extra.t.score,1);
  const extraCard=extra.t.hand.find(c=>c.move!==7);extraCard.move=1;
  g.extraMove(extra.room,extra.who,extraCard.id,['A1']);
  assert.equal(extra.t.position,'A1');assert.equal(extra.room.records.length,1);
  assert.equal(extra.room.cardFlows.length,3);
  assert.deepEqual(extra.room.records[0].extraMoves[0].route,['A1']);
  assert.equal(extra.room.records[0].event,undefined);
  const helper=arriveWithCard('card6','范式起源');g.useCard(helper.room,helper.who,helper.card.id);
  g.resolveChallenge(helper.room,host,'A',true);assert.equal(helper.t.score,9);assert.equal(helper.t.discardAbility,true);
  for(const card of helper.t.hand)card.game_type='Phigros';
  const toDiscard=helper.t.hand[0].id;
  g.discardCard(helper.room,helper.who,toDiscard);assert.equal(helper.t.hand.length,6);
  assert.throws(()=>g.discardCard(helper.room,helper.who,helper.t.hand[0].id),/不能使用/);
});

test('机械帮手允许在普通站点无法使用卡牌时弃牌',()=>{
  const {room,t,who,card}=arriveWithCard('card6','范式起源');
  g.useCard(room,who,card.id);g.resolveChallenge(room,{role:'host'},'A',true);
  g.endTurn(room,who);
  t.position='R1';const mover=t.hand.find(c=>c.move!==7);mover.move=1;
  g.move(room,who,mover.id,['R2']);
  assert.equal(g.state(room,who).teams.A.canDiscard,true);
  const discarded=t.hand[0].id;
  g.discardCard(room,who,discarded);
  assert.equal(t.hand.length,6);
  assert.equal(g.state(room,who).teams.A.canDiscard,false);
  assert.throws(()=>g.discardCard(room,who,t.hand[0].id),/不能使用/);
});

test('两张小额积分手牌按配置加分和扣费',()=>{
  for(const [id,house,points,cost] of [['card12','Phigros',1,50],['card13','Phigros',2,150]]){
    const {room,t,who,card}=arriveWithCard(id,house,500),before=t.money;
    g.useCard(room,who,card.id);
    assert.equal(t.money,before-cost);
    g.resolveChallenge(room,{role:'host'},'A',true);
    assert.equal(t.score,points);
  }
});

test('新手牌按 CSV 执行转移、重掷、贷款和双牌效果',()=>{
  const host={role:'host'};
  const trade=arriveWithCard('card8','Arcaea',1000);
  trade.room.teams.B.money=60;trade.room.teams.B.income=3;
  g.useCard(trade.room,trade.who,trade.card.id);
  g.resolveChallenge(trade.room,host,'A',true);
  assert.ok(trade.t.pendingTarget);
  assert.throws(()=>g.endTurn(trade.room,trade.who),/使用手牌/);
  g.chooseCardTarget(trade.room,trade.who,'B');
  assert.equal(trade.room.teams.B.money,0);
  assert.equal(trade.room.teams.B.income,0);
  assert.equal(trade.t.income,35);
  assert.equal(trade.t.cardActionDone,true);

  const reroll=arriveWithCard('card9','范式起源');
  reroll.room.randomInt=()=>5;
  g.useCard(reroll.room,reroll.who,reroll.card.id);
  g.resolveChallenge(reroll.room,host,'A',true);
  assert.ok(reroll.t.pendingReroll);
  const before=reroll.t.money;
  g.resolveReroll(reroll.room,reroll.who,true);
  assert.equal(reroll.t.money,before+200);

  const loan=arriveWithCard('card10','Arcaea');
  g.useCard(loan.room,loan.who,loan.card.id);
  g.resolveChallenge(loan.room,host,'A',true);
  assert.equal(loan.t.loanActive,true);
  assert.equal(loan.t.money,1400);
  g.endTurn(loan.room,loan.who);
  loan.t.position='R1';const moveCard=loan.t.hand.find(c=>c.move!==7);moveCard.move=1;
  g.move(loan.room,loan.who,moveCard.id,['R2']);
  assert.equal(loan.t.money,1355);
  assert.ok(loan.room.moneyChanges.some(x=>x.reason==='快速贷款还款'&&x.amount===-25));

  const double=arriveWithCard('card11','Arcaea',2000);
  g.useCard(double.room,double.who,double.card.id);
  g.resolveChallenge(double.room,host,'A',true);
  assert.equal(double.t.maxCardUses,2);
  assert.equal(double.t.cardActionDone,false);
  const second=double.t.hand.find(c=>g.canUse(double.t,c))||double.t.deck.find(c=>c.game_type==='Arcaea'||c.game_type==='random'&&c.effect_type!=='event_cancel_random');
  if(!double.t.hand.includes(second)){const old=double.t.hand[0];double.t.hand[0]=second;double.t.deck[double.t.deck.indexOf(second)]=old;}
  g.useCard(double.room,double.who,second.id);
  if(double.t.pendingChallenge)g.resolveChallenge(double.room,host,'A',false);
  assert.equal(double.t.cardActionDone,true);
  assert.equal(double.room.records[0].usedCards.length,2);
});

test('新永久手牌效果在经过对应建筑时生效',()=>{
  const host={role:'host'};
  const accountant=arriveWithCard('card14','Arcaea');
  g.useCard(accountant.room,accountant.who,accountant.card.id);g.resolveChallenge(accountant.room,host,'A',true);
  assert.equal(accountant.t.score,4);assert.equal(accountant.t.income,50);
  const arcaea=arriveWithCard('card15','Arcaea');
  g.useCard(arcaea.room,arcaea.who,arcaea.card.id);g.resolveChallenge(arcaea.room,host,'A',true);
  assert.equal(arcaea.t.score,3);assert.equal(arcaea.t.income,40);
  g.endTurn(arcaea.room,arcaea.who);
  arcaea.t.position='A2';const aCard=arcaea.t.hand.find(c=>c.move!==7);aCard.move=1;
  const aMoney=arcaea.t.money;g.move(arcaea.room,arcaea.who,aCard.id,['Arcaea']);
  assert.equal(arcaea.t.money,aMoney+40);
  const fanshi=arriveWithCard('card16','范式起源');
  g.useCard(fanshi.room,fanshi.who,fanshi.card.id);g.resolveChallenge(fanshi.room,host,'A',true);
  assert.equal(fanshi.t.score,6);
  g.endTurn(fanshi.room,fanshi.who);
  fanshi.t.position='F3';const fCard=fanshi.t.hand.find(c=>c.move!==7);fCard.move=1;
  const fMoney=fanshi.t.money;g.move(fanshi.room,fanshi.who,fCard.id,['范式起源']);
  assert.equal(fanshi.t.money,fMoney+70);
});

test('队伍地图按自身当前回合显示领先队伍快照，未行动队伍虚化实时位置',()=>{
  const room=g.createRoom({seed:'map-snapshot'}),b=room.teams.B,whoB={role:'team',id:'B'};
  b.position='R1';
  for(const node of ['R2','R3','R4']){
    b.hand[0].move=1;g.move(room,whoB,b.hand[0].id,[node]);
    if(node!=='R4'){if(b.pendingEvent)g.skipUse(room,whoB);g.endTurn(room,whoB);}
  }
  const aView=g.state(room,{role:'team',id:'A'});
  assert.deepEqual(aView.mapView.B,{node:'R2',ghost:false,actualRound:3});
  assert.equal(aView.teams.B.position,'R2');
  assert.equal(aView.mapView.C.node,room.teams.C.position);
  assert.equal(aView.mapView.C.ghost,true);
  const hostView=g.state(room,{role:'host'});
  assert.equal(hostView.mapView.B.node,'R4');
  const a=room.teams.A;a.hand[0].move=1;g.move(room,{role:'team',id:'A'},a.hand[0].id,[g.GRAPH[a.position][0]]);
  if(!a.cardActionDone)g.skipUse(room,{role:'team',id:'A'});
  g.endTurn(room,{role:'team',id:'A'});
  assert.equal(g.state(room,{role:'team',id:'A'}).mapView.B.node,'R3');
});

test('队伍资源只显示不晚于本队当前回合的变化，裁判始终看到实时值',()=>{
  const room=g.createRoom({seed:'resource-rounds'});
  const a=room.teams.A,b=room.teams.B;
  b.position='R1';b.hand[0].move=1;
  g.move(room,{role:'team',id:'B'},b.hand[0].id,['R2']);
  assert.equal(g.state(room,{role:'team',id:'A'}).teams.B.money,180);
  g.endTurn(room,{role:'team',id:'B'});
  b.position='A2';b.hand[0].move=1;
  g.move(room,{role:'team',id:'B'},b.hand[0].id,['Arcaea']);
  g.skipUse(room,{role:'team',id:'B'});g.houseAction(room,{role:'team',id:'B'});
  assert.equal(b.money,140);assert.equal(b.income,40);
  const behind=g.state(room,{role:'team',id:'A'});
  assert.equal(behind.teams.B.money,180);
  assert.equal(behind.teams.B.income,30);
  assert.ok(behind.moneyChanges.every(x=>x.round<=1));
  assert.equal(g.state(room,{role:'host'}).teams.B.money,140);
  a.position='R1';a.hand[0].move=1;
  g.move(room,{role:'team',id:'A'},a.hand[0].id,['R2']);
  g.endTurn(room,{role:'team',id:'A'});
  const caughtUp=g.state(room,{role:'team',id:'A'});
  assert.equal(caughtUp.teams.B.money,140);
  assert.equal(caughtUp.teams.B.income,40);
});

test('其他队伍后续回合的积分在本队追上前不可见',()=>{
  const room=g.createRoom({seed:'score-rounds'}),a=room.teams.A,b=room.teams.B;
  g.score(room,{role:'host'},'B',2);
  assert.equal(g.state(room,{role:'team',id:'A'}).teams.B.score,2);
  b.position='R1';b.hand[0].move=1;
  g.move(room,{role:'team',id:'B'},b.hand[0].id,['R2']);
  g.endTurn(room,{role:'team',id:'B'});
  g.score(room,{role:'host'},'B',4);
  assert.equal(b.score,6);
  assert.equal(g.state(room,{role:'team',id:'A'}).teams.B.score,2);
  assert.equal(g.state(room,{role:'host'}).teams.B.score,6);
  assert.equal(g.state(room,{role:'team',id:'B'}).teams.B.score,6);
  a.position='R1';a.hand[0].move=1;
  g.move(room,{role:'team',id:'A'},a.hand[0].id,['R2']);
  g.endTurn(room,{role:'team',id:'A'});
  assert.equal(g.state(room,{role:'team',id:'A'}).teams.B.score,6);
  const restored=g.hydrate(JSON.parse(JSON.stringify(room)));
  assert.equal(g.state(restored,{role:'team',id:'A'}).teams.B.score,6);
  const legacy=g.createRoom({seed:'legacy-score'});
  legacy.teams.B.round=3;legacy.teams.B.score=7;delete legacy.scoreChanges;
  g.hydrate(legacy);
  assert.equal(g.state(legacy,{role:'team',id:'A'}).teams.B.score,0);
  assert.equal(g.state(legacy,{role:'host'}).teams.B.score,7);
});

test('20 分暂定达标后免战，早期战斗可使其跌落并在再次达标时确认',()=>{
  const room=g.createRoom({seed:'endgame-requalify'}),host={role:'host'};
  room.teams.A.round=5;
  g.score(room,host,'A',20);
  assert.equal(room.teams.A.immuneFromRound,5);
  assert.equal(room.teams.A.qualifyingRound,5);
  assert.equal(room.result,null);
  assert.equal(g.state(room,{role:'team',id:'B'}).endgame.provisional.length,0);
  assert.equal(g.state(room,{role:'host'}).endgame.provisional.length,1);
  room.records.push({id:'old-a',team:'A',round:4,node:'R2'},{id:'old-b',team:'B',round:4,node:'R2'});
  room.battles.push({id:'old-battle',round:4,node:'R2',first:'old-a',second:'old-b',status:'待结算',winner:null});
  for(const team of Object.values(room.teams))team.round=6;
  g.evaluateEnd(room);
  assert.equal(room.result,null);
  g.battle(room,host,'old-battle','B');
  assert.equal(room.teams.A.score,18);
  assert.equal(room.teams.A.qualifyingRound,null);
  assert.equal(room.teams.A.immuneFromRound,5);
  for(const id of 'AB'){
    const team=room.teams[id];team.position='R1';team.hand[0].move=1;
    g.move(room,{role:'team',id},team.hand[0].id,['R2']);
  }
  assert.equal(room.battles.length,1);
  room.teams.A.round=7;
  g.score(room,host,'A',2);
  assert.equal(room.teams.A.qualifyingRound,7);
  for(const team of Object.values(room.teams))team.round=8;
  g.evaluateEnd(room);
  assert.equal(room.result?.winner,'A');
  assert.equal(room.result?.qualifyingRound,7);
});

test('三队完成达标轮次后自动确认胜者，免战队不触发新战斗',()=>{
  const room=g.createRoom({seed:'endgame-auto'});
  g.score(room,{role:'host'},'A',20);
  for(const id of 'ABC'){
    const team=room.teams[id];team.position='R1';team.hand[0].move=1;
    g.move(room,{role:'team',id},team.hand[0].id,['R2']);
    g.endTurn(room,{role:'team',id});
  }
  assert.equal(room.battles.length,0);
  assert.equal(room.result?.winner,'A');
  assert.equal(g.hydrate(JSON.parse(JSON.stringify(room))).result?.winner,'A');
});

test('同轮达标按时间顺序决胜，时间上限按积分并列排名',()=>{
  const room=g.createRoom({seed:'endgame-tie'}),host={role:'host'};
  for(const team of Object.values(room.teams))team.round=2;
  g.score(room,host,'A',20);g.score(room,host,'B',20);
  for(const team of Object.values(room.teams))team.round=3;
  g.evaluateEnd(room);
  assert.equal(room.result?.winner,'A');
  const deadlineAt=Date.now()+3600000,limited=g.createRoom({seed:'endgame-deadline',deadlineAt});
  g.score(limited,host,'A',3);g.score(limited,host,'B',5);g.score(limited,host,'C',5);
  g.evaluateEnd(limited,deadlineAt);
  assert.deepEqual(limited.result?.winners,['B','C']);
  assert.deepEqual(limited.result?.ranking.map(row=>row.rank),[1,1,3]);
  const manual=g.createRoom({seed:'endgame-manual'});
  g.score(manual,host,'A',3);g.finishByScores(manual,'manual');
  assert.equal(manual.result?.reason,'manual');
  assert.deepEqual(manual.result?.winners,['A']);
});

test('战斗只在可见回合出现，双方与第三队进入该回合后均可看到对战状态',()=>{
  const room=g.createRoom({seed:'battle-visibility'});
  for(const id of 'AB'){
    const t=room.teams[id];t.position='R1';t.hand[0].move=1;
    g.move(room,{role:'team',id},t.hand[0].id,['R2']);
    g.endTurn(room,{role:'team',id});
    t.position='R1';t.hand[0].move=1;
  }
  for(const id of 'AB')g.move(room,{role:'team',id},room.teams[id].hand[0].id,['R2']);
  const battle=room.battles.find(b=>b.round===2);
  assert.equal(battle.status,'待结算');
  assert.equal(g.state(room,{role:'team',id:'C'}).battles.some(b=>b.id===battle.id),false);
  g.battle(room,{role:'host'},battle.id,'A');
  assert.equal(g.state(room,{role:'team',id:'C'}).teams.A.score,0);
  const c=room.teams.C;c.position='R1';c.hand[0].move=1;
  g.move(room,{role:'team',id:'C'},c.hand[0].id,['R2']);
  g.endTurn(room,{role:'team',id:'C'});
  assert.equal(g.state(room,{role:'team',id:'C'}).battles.some(b=>b.id===battle.id),true);
  assert.equal(g.state(room,{role:'team',id:'C'}).teams.A.score,2);
  for(const id of 'AB')assert.equal(g.state(room,{role:'team',id}).battles.some(b=>b.id===battle.id),true);
});

test('经过与停留收入税格按规则结算，金钱不会低于零',()=>{
  assert.equal(NODE_TYPES.R5,'收入格');assert.equal(NODE_TYPES.R6,'收税格');
  const room=g.createRoom({seed:'economy',initialMoney:0,initialIncome:30});
  const team=room.teams.A,who={role:'team',id:'A'};
  team.position='R4';team.hand[0].move=1;
  const landed=g.move(room,who,team.hand[0].id,['R5']);
  assert.equal(team.money,60);assert.equal(landed.moneyDelta,60);
  g.endTurn(room,who);
  team.position='R4';team.hand[0].move=2;
  const crossed=g.move(room,who,team.hand[0].id,['R5','R6']);
  assert.equal(crossed.moneyDelta,10);
  assert.deepEqual(crossed.moneyEffects.map(e=>e.amount),[30,-20]);
  assert.equal(team.money,70);
  g.endTurn(room,who);
  team.money=0;team.position='R1';team.hand[0].move=1;
  const taxed=g.move(room,who,team.hand[0].id,['R2']);
  assert.equal(team.money,0);assert.equal(taxed.moneyDelta,0);
});

test('十六张成品手牌独立抽弃洗牌，数量始终守恒',()=>{
  const room=g.createRoom();const token=g.join(room,'A');g.join(room,'B');const who=g.viewer(room,token);
  const bBefore=JSON.stringify(room.teams.B);
  for(let i=0;i<11;i++){
    const team=room.teams.A,card=team.hand.find(c=>c.move!==7);
    team.position='R1';card.move=1;
    g.move(room,who,card.id,['R2']);
    g.endTurn(room,who);
    assert.equal(team.hand.length,6);
    assert.equal(team.hand.length+team.deck.length+team.discard.length,16);
  }
  assert.equal(room.teams.A.deck.length+room.teams.A.discard.length,10);
  assert.equal(JSON.stringify(room.teams.B),bBefore);
  assert.equal(room.records.length,11);
  assert.equal(room.records[0].from,'R1');
  assert.equal(room.records[0].route.at(-1),room.records[0].node);
  assert.equal(room.cardFlows.length,11);
  assert.ok(room.cardFlows.some(flow=>flow.shuffled));
  assert.ok(room.cardFlows.every(flow=>flow.team==='A'&&flow.spent.image&&flow.drawn.image));
  assert.equal(g.state(room,who).cardFlows.length,11);
  assert.equal(g.state(room,{role:'team',id:'B'}).cardFlows.length,0);
  g.reset(room,{role:'host'});
  assert.equal(room.cardFlows.length,0);
});

test('成品手牌按 CSV 点数移动，问号牌由服务器掷骰',()=>{
  const room=g.createRoom({seed:'question'}),t=room.teams.A,who={role:'team',id:'A'};
  const card7=t.hand.find(c=>c.sourceId==='card7')||t.deck.find(c=>c.sourceId==='card7');
  if(!t.hand.includes(card7)){const old=t.hand[0];t.hand[0]=card7;t.deck[t.deck.indexOf(card7)]=old;}
  assert.equal(card7.move,7);assert.match(card7.image,/card7\.png$/);
  assert.throws(()=>g.move(room,who,card7.id,['R1']),/掷骰/);
  const steps=g.roll(room,who,card7.id);assert.ok(steps>=1&&steps<=6);
  let at=t.position;const route=[];for(let i=0;i<steps;i++){at=g.GRAPH[at][0];route.push(at);}
  const record=g.move(room,who,card7.id,route);
  assert.equal(record.card.steps,steps);assert.equal(record.card.name,'装腔作势');
  assert.equal(t.pendingRoll,null);
});

test('装腔作势仅在事件格可用，并抵消当前事件',()=>{
  const room=g.createRoom({seed:'question-reward',initialMoney:100}),t=room.teams.A,who={role:'team',id:'A'};
  const card7=t.hand.find(c=>c.sourceId==='card7')||t.deck.find(c=>c.sourceId==='card7');
  if(!t.hand.includes(card7)){const old=t.hand[0];t.hand[0]=card7;t.deck[t.deck.indexOf(card7)]=old;}
  t.position='R12';const mover=t.hand.find(c=>c.id!==card7.id&&c.move!==7);mover.move=2;
  g.move(room,who,mover.id,['A2','Arcaea']);
  assert.throws(()=>g.useCard(room,who,card7.id),/使用地点/);
  g.skipUse(room,who);g.endTurn(room,who);
  t.position='R4';const next=t.hand.find(c=>c.id!==card7.id&&c.move!==7);next.move=1;
  const record=g.move(room,who,next.id,['P2']);
  assert.equal(record.pendingEvent,true);assert.equal(record.event,undefined);
  const before=t.money;g.useCard(room,who,card7.id);
  const points=t.score;
  assert.ok(points>=1&&points<=6);assert.equal(t.money,before+points*70);assert.equal(t.eventShield,0);
  assert.equal(record.event.name,'事件已抵消');
  assert.equal(record.pendingEvent,false);
});

test('事件格抽成品事件卡并加钱，厄运格触发三队竞标',()=>{
  const room=g.createRoom({seed:'special',initialMoney:100,initialIncome:10});
  room.eventDeck=[EVENTS.find(c=>c.id==='event1')];
  room.misfortuneDeck=[MISFORTUNES.find(c=>c.id==='mis1'),MISFORTUNES.find(c=>c.id==='mis3')];
  const a=room.teams.A;a.position='R4';a.hand[0].move=1;
  const event=g.move(room,{role:'team',id:'A'},a.hand[0].id,['P2']);
  if(a.pendingEvent)g.skipUse(room,{role:'team',id:'A'});
  assert.equal(event.event.name,'社团赞助');assert.equal(a.money,300);
  g.endTurn(room,{role:'team',id:'A'});
  a.position='R2';a.hand[0].move=1;a.score=3;
  const bad=g.move(room,{role:'team',id:'A'},a.hand[0].id,['B']);
  assert.equal(bad.misfortune.length,2);
  assert.equal(room.pendingMisfortuneChoice.triggerTeam,'A');
  assert.throws(()=>g.misfortuneTarget(room,{role:'team',id:'B'},'C'),/指定/);
  g.misfortuneTarget(room,{role:'team',id:'A'},'B');
  g.misfortunePick(room,{role:'team',id:'B'},0);
  assert.equal(room.pendingAuction.card.name,'社长造访');
  assert.throws(()=>g.move(room,{role:'team',id:'B'},room.teams.B.hand[0].id,['R1']),/厄运/);
  g.bid(room,{role:'team',id:'A'},0);
  g.bid(room,{role:'team',id:'B'},10);
  g.bid(room,{role:'team',id:'C'},20);
  assert.equal(room.pendingAuction,null);
  assert.equal(a.score,1);assert.equal(room.teams.B.money,90);assert.equal(room.teams.C.money,80);
});

test('新事件牌结算积分、debuff 防护、范式奖励与战斗修正',()=>{
  const trigger=(id,setup=()=>{})=>{
    const room=g.createRoom({initialMoney:100}),t=room.teams.A;
    room.eventDeck=[EVENTS.find(c=>c.id===id)];
    setup(room,t);
    t.position='R4';t.hand[0].move=1;
    g.move(room,{role:'team',id:'A'},t.hand[0].id,['P2']);
    if(t.pendingEvent)g.skipUse(room,{role:'team',id:'A'});
    return {room,t};
  };
  assert.equal(trigger('event2',(_,t)=>{t.score=5;}).t.score,3);
  const shield=trigger('event3');
  assert.equal(shield.t.debuffShield,1);
  const lowest=trigger('event4',room=>{room.teams.A.score=2;room.teams.B.score=0;room.teams.C.score=0;});
  assert.equal(lowest.room.teams.B.score,1);
  assert.equal(lowest.room.teams.C.score,1);
  assert.equal(lowest.t.score,2);
  const treasure=trigger('event5');
  assert.ok(treasure.t.money>=110&&treasure.t.money<=300);
  assert.match(treasure.room.records[0].event.detail,/掷出/);
  const battle=trigger('event6');
  assert.equal(battle.t.nextBattleModifier,-1);
  battle.room.eventDeck=[EVENTS.find(c=>c.id==='event1')];
  const opponent=battle.room.teams.B;opponent.position='R4';opponent.hand[0].move=1;
  g.move(battle.room,{role:'team',id:'B'},opponent.hand[0].id,['P2']);
  g.battle(battle.room,{role:'host'},battle.room.battles[0].id,'A');
  assert.equal(battle.t.score,1);
  assert.equal(battle.t.nextBattleModifier,0);
});

test('新厄运牌结算全队金钱与下次挑战的 debuff',()=>{
  const pass=id=>{
    const room=g.createRoom({initialMoney:101}),t=room.teams.A;
    room.misfortuneDeck=[MISFORTUNES.find(c=>c.id===id)];
    t.position='R2';t.hand[0].move=2;
    g.move(room,{role:'team',id:'A'},t.hand[0].id,['B','R8']);
    return {room,t};
  };
  const half=pass('mis4');
  assert.equal(half.t.money,41);
  assert.equal(half.room.teams.B.money,51);
  assert.equal(half.room.teams.C.money,51);
  const eye=pass('mis2');
  assert.equal(eye.t.debuffs[0].id,'mis2');
  eye.t.position='Phigros';
  eye.t.cardActionDone=false;
  eye.t.money=1000;
  const challengeCard=[...eye.t.hand,...eye.t.deck].find(c=>c.game_type==='Phigros');
  if(!eye.t.hand.includes(challengeCard)){const old=eye.t.hand[0];eye.t.hand[0]=challengeCard;eye.t.deck[eye.t.deck.indexOf(challengeCard)]=old;}
  g.useCard(eye.room,{role:'team',id:'A'},challengeCard.id);
  assert.equal(eye.t.pendingChallenge.debuffs[0].id,'mis2');
  assert.equal(eye.t.debuffs.length,0);
  const offset=pass('mis5');
  assert.equal(offset.t.debuffs[0].id,'mis5');
  const cold=pass('mis3');
  assert.equal(cold.t.score,0);
});

test('路过厄运 B 只抽一张并直接开始竞标',()=>{
  const room=g.createRoom({seed:'pass-b'}),t=room.teams.A;t.position='R2';t.hand[0].move=2;
  room.misfortuneDeck=[MISFORTUNES.find(c=>c.id==='mis1')];
  const record=g.move(room,{role:'team',id:'A'},t.hand[0].id,['B','R8']);
  assert.equal(record.misfortune.length,1);
  assert.equal(room.pendingMisfortuneChoice,null);
  assert.equal(room.pendingAuction.card.id,'mis1');
});

test('同一次移动多次进入厄运 B 时每次都抽牌',()=>{
  const room=g.createRoom({seed:'loop-b'}),t=room.teams.A;t.position='R2';t.hand[0].move=3;
  room.misfortuneDeck=['mis1','mis2','mis3'].map(id=>MISFORTUNES.find(c=>c.id===id));
  const record=g.move(room,{role:'team',id:'A'},t.hand[0].id,['B','R2','B']);
  assert.equal(record.misfortune.length,3);
  assert.ok(room.pendingAuction);
  assert.ok(room.pendingMisfortuneChoice);
});

test('服务端拒绝越过步数及不符合方向的路线',()=>{
  const room=g.createRoom();const who=g.viewer(room,g.join(room,'A'));const card=room.teams.A.hand.find(c=>c.move!==7);
  assert.throws(()=>g.move(room,who,card.id,['R8']),/方向/);
  assert.throws(()=>g.move(room,who,card.id,[]),/步数/);
  assert.equal(room.teams.A.hand.length,6);
});

test('Arcaea 支线与地图箭头一致，终点计算包含房屋提前停留',()=>{
  assert.deepEqual(g.GRAPH.R12,['R1','A2']);
  assert.deepEqual(g.GRAPH.A2,['Arcaea']);
  assert.deepEqual(g.GRAPH.Arcaea,['A1']);
  assert.deepEqual(g.GRAPH.A1,['R1']);
  const options=reachable(g.GRAPH,['Arcaea','Phigros','范式起源'],'R12',4);
  assert.deepEqual(options.find(x=>x.node==='Arcaea').route,['A2','Arcaea']);
  assert.deepEqual(options.find(x=>x.node==='R1').route,['A2','Arcaea','A1','R1']);
  const alternatives=reachable(g.GRAPH,['Arcaea','Phigros','范式起源'],'R1',4).filter(x=>x.node==='B');
  assert.equal(alternatives.length,2);
  assert.notDeepEqual(alternatives[0].route,alternatives[1].route);
});

test('固定种子产生相同牌序；重置后复现牌序并保留四个席位',()=>{
  const a=g.createRoom({seed:'demo-01',testMode:true});
  const b=g.createRoom({seed:'demo-01',testMode:true});
  const initial=Object.fromEntries('ABC'.split('').map(id=>[id,a.teams[id].hand.map(c=>c.id)]));
  for(const id of 'ABC')assert.deepEqual(a.teams[id].hand,b.teams[id].hand);
  const tokens=Object.fromEntries('ABC'.split('').map(id=>[id,a.teams[id].token]));
  const card=a.teams.A.hand[0];let node=a.teams.A.position;const route=[];
  for(let i=0;i<card.move;i++){node=g.GRAPH[node][0];route.push(node);}
  g.move(a,{role:'team',id:'A'},card.id,route);
  assert.throws(()=>g.reset(a,{role:'team',id:'A'}),/裁判/);
  g.reset(a,{role:'host'});
  assert.equal(a.records.length,0);
  assert.equal(a.resetCount,1);
  for(const id of 'ABC'){
    assert.deepEqual(a.teams[id].hand.map(c=>c.id),initial[id]);
    assert.equal(a.teams[id].token,tokens[id]);
    assert.equal(a.teams[id].joined,true);
  }
});

test('同轮同格由先到的两队开战，第三队不补位；队伍看不到超前轮次',()=>{
  const room=g.createRoom();const who={};
  for(const id of 'ABC'){g.join(room,id);room.teams[id].position='R1';room.teams[id].hand[0].move=1;who[id]={role:'team',id};}
  for(const id of 'ABC')g.move(room,who[id],room.teams[id].hand[0].id,['R2']);
  assert.equal(room.battles.length,1);
  const b=room.battles[0];
  assert.equal(room.records.find(r=>r.id===b.first).team,'A');
  assert.equal(room.records.find(r=>r.id===b.second).team,'B');
  g.endTurn(room,who.A);
  room.teams.A.hand[0].move=1;g.move(room,who.A,room.teams.A.hand[0].id,['R3']);
  g.endTurn(room,who.A);
  room.teams.A.hand[0].move=1;g.move(room,who.A,room.teams.A.hand[0].id,['R4']);
  assert.equal(g.state(room,who.B).records.some(r=>r.round===3),false);
  assert.equal(g.state(room,{role:'host'}).records.length,5);
  g.battle(room,{role:'host'},b.id,'B');
  assert.equal(room.teams.B.score,2);
  assert.equal(room.teams.A.score,0);
});


test('MySQL JSON 恢复后继续使用同一随机序列',()=>{
  const first=g.createRoom({seed:'persist-me'});
  const second=g.hydrate(JSON.parse(JSON.stringify(first)));
  assert.equal(second.randomInt(6),first.randomInt(6));
  assert.equal(second.randomInt(6),first.randomInt(6));
  assert.equal(second.randomCounter,first.randomCounter);
});

test('非房屋格预定队员受三轮分组限制，战斗展示头像并在占用时待战',()=>{
  const room=g.createRoom({seed:'reserved-members'}),host={role:'host'};
  for(const id of 'AB'){
    const t=room.teams[id];t.position='R1';t.members=[1,2,3].map(n=>({id:`${id}-${n}`,account:`${id} 队员 ${n}`,avatar:`/${id}${n}.png`}));t.hand[0].move=1;
  }
  const a={role:'team',id:'A'},b={role:'team',id:'B'};
  g.move(room,a,room.teams.A.hand[0].id,['R2']);
  assert.throws(()=>g.endTurn(room,a),/选择一名队员/);
  g.reserveMember(room,a,'A-1');g.endTurn(room,a);
  room.teams.A.position='R1';room.teams.A.hand[0].move=1;
  g.move(room,a,room.teams.A.hand[0].id,['R2']);
  assert.throws(()=>g.reserveMember(room,a,'A-1'),/本组三轮/);
  g.reserveMember(room,a,'A-2');
  g.move(room,b,room.teams.B.hand[0].id,['R2']);
  assert.equal(room.battles[0].status,'待选人');
  g.reserveMember(room,b,'B-1');
  assert.equal(room.battles[0].status,'待结算');
  assert.equal(g.state(room,host).records[0].defender.avatar,'/A1.png');
  for(const id of 'AB'){
    const t=room.teams[id];t.round=4;t.awaitingEnd=false;t.position='R1';t.hand[0].move=1;
    g.move(room,{role:'team',id},t.hand[0].id,['R2']);
    g.reserveMember(room,{role:'team',id},`${id}-1`);
  }
  assert.equal(room.battles[1].status,'待战');
  g.battle(room,host,room.battles[0].id,'A');
  assert.equal(room.battles[1].status,'待结算');
});

test('首次达到 20 分只产生一次 EX time 事件，并保持免战',()=>{
  const room=g.createRoom({seed:'ex-time'}),host={role:'host'};
  for(const id of 'AB'){
    const t=room.teams[id];t.round=5;t.position='R1';t.members=[{id:`${id}-1`,account:`${id} 队员`}];t.hand[0].move=1;
    g.move(room,{role:'team',id},t.hand[0].id,['R2']);
  }
  assert.equal(room.battles[0].status,'待选人');
  g.score(room,host,'A',20);
  assert.equal(room.battles.length,0);
  assert.equal(room.exTimeEvents.length,1);
  assert.equal(g.state(room,{role:'team',id:'A'}).teams.A.exTime,true);
  g.score(room,host,'A',-2);room.teams.A.round=7;g.score(room,host,'A',2);
  assert.equal(room.exTimeEvents.length,1);
  assert.equal(room.teams.A.immuneFromRound,5);
  assert.equal(room.teams.A.qualifyingRound,7);
});

test('一人队伍每轮由同一人留守，且仍能参与新战斗',()=>{
  const room=g.createRoom({seed:'one-member'}),a={role:'team',id:'A'},b={role:'team',id:'B'};
  room.teams.A.members=[{id:'A-1',account:'A 队员'}];
  room.teams.B.members=[{id:'B-1',account:'B 队员'}];
  room.teams.A.position='R1';room.teams.A.hand[0].move=1;
  g.move(room,a,room.teams.A.hand[0].id,['R2']);g.reserveMember(room,a,'A-1');g.endTurn(room,a);
  room.teams.A.position='R1';room.teams.A.hand[0].move=1;
  const record=g.move(room,a,room.teams.A.hand[0].id,['R2']);
  assert.deepEqual(g.eligibleMembers(room,room.teams.A).map(m=>m.id),['A-1']);
  assert.throws(()=>g.endTurn(room,a),/选择一名队员/);
  g.reserveMember(room,a,'A-1');
  assert.equal(record.defender.id,'A-1');
  g.endTurn(room,a);
  room.teams.B.round=2;room.teams.B.position='R1';room.teams.B.hand[0].move=1;
  g.move(room,b,room.teams.B.hand[0].id,['R2']);
  assert.equal(room.battles[0].status,'待选人');
  g.reserveMember(room,b,'B-1');
  assert.equal(room.battles[0].status,'待结算');
  room.teams.A.position='R1';room.teams.A.hand[0].move=1;
  g.move(room,a,room.teams.A.hand[0].id,['R2']);
  assert.equal(g.eligibleMembers(room,room.teams.A)[0].id,'A-1');
});

test('两人队伍先轮换，第三轮才允许重复留守',()=>{
  const room=g.createRoom({seed:'two-members'}),t=room.teams.A,who={role:'team',id:'A'};
  t.members=[{id:'A-1',account:'队员 1'},{id:'A-2',account:'队员 2'}];
  for(const [round,expected] of [[1,'A-1'],[2,'A-2'],[3,'A-1']]){
    t.position='R1';t.hand[0].move=1;
    g.move(room,who,t.hand[0].id,['R2']);
    if(round===2)assert.throws(()=>g.reserveMember(room,who,'A-1'),/未留守/);
    assert.equal(g.eligibleMembers(room,t).some(m=>m.id===expected),true);
    g.reserveMember(room,who,expected);
    if(round<3)g.endTurn(room,who);
  }
});
