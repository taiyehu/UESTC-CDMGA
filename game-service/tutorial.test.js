const test=require('node:test');
const assert=require('node:assert/strict');
const tutorial=require('./tutorial');

const user={id:7,account:'新玩家'};
function payload(progress,scene,action){
  const team=progress.room.teams.A;
  if(action==='move')return {cardId:team.hand.find(card=>card.move===scene.route.length).id,route:scene.route};
  if(action==='reserve-member')return {memberId:user.id};
  if(action==='use-card')return {cardId:team.hand.find(card=>card.sourceId==='card27').id};
  if(action==='misfortune-target')return {target:'B'};
  return {};
}

test('player can finish every tutorial scene with the live rules',()=>{
  const progress=tutorial.create(user);
  const start=tutorial.publicState(progress);
  assert.equal(start.tutorial.scene,1);
  assert.equal(start.canAct,true);
  for(const [index,scene] of tutorial.scenes.entries()){
    for(const action of scene.steps)tutorial.apply(progress,action,payload(progress,scene,action));
    const record=progress.room.records.at(-1);
    assert.equal(record.node,scene.route.at(-1));
    if(index===1)assert.equal(record.moneyDelta,60);
    if(index===2)assert.equal(record.moneyEffects.at(-1).amount,-20);
    if(index===3)assert.equal(record.event.name,'社团赞助');
    if(index===4)assert.equal(record.selectedMisfortune.name,'风沙入眼');
    if(index===5)assert.equal(record.houseAction.house,'Arcaea');
    if(index===6)assert.equal(record.houseAction.house,'Phigros');
    if(index===7)assert.equal(record.houseAction.house,'范式起源');
  }
  assert.equal(progress.completed,true);
  assert.equal(progress.room.teams.A.round,tutorial.scenes.length+1);
  assert.equal(tutorial.publicState(progress).tutorial.completed,true);
  assert.throws(()=>tutorial.apply(progress,'move',{}),/教程已完成/);
});

test('wrong action and route leave tutorial progress untouched',()=>{
  const progress=tutorial.create(user);
  assert.throws(()=>tutorial.apply(progress,'end-turn',{}),/手牌/);
  assert.equal(progress.step,0);
  assert.throws(()=>tutorial.apply(progress,'move',{cardId:progress.room.teams.A.hand[0].id,route:['R2']}),/提示路线/);
  assert.equal(progress.room.records.length,0);
  assert.equal(progress.step,0);
});

test('saved progress can resume and a new run starts from scene one',()=>{
  const progress=tutorial.create(user);
  tutorial.apply(progress,'move',payload(progress,tutorial.scenes[0],'move'));
  const saved=JSON.parse(JSON.stringify(progress));
  tutorial.apply(saved,'reserve-member',{memberId:user.id});
  assert.equal(saved.step,2);
  assert.equal(tutorial.create(user).step,0);
});
