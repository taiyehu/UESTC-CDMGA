const game = require('./game');
const {EVENTS, MISFORTUNES} = require('./catalog');

const who = {role:'team', id:'A'};
const scenes = [
  {title:'认识手牌与路线', start:'R12', cards:['card1'], route:['R1'], steps:['move','reserve-member','end-turn'],
    hints:['从 R12 出发。点开一张 1 步手牌，选择通向 R1 的路线并确认移动。','空白格没有额外效果。选择一名队员留守终点。','点击结束回合，继续旅程。']},
  {title:'收入格', start:'R4', cards:['card1'], route:['R5'], steps:['move','reserve-member','end-turn'],
    hints:['练习转场：已来到 R4。走到 R5 收入格；停在收入格可获得双倍收入。','观察金钱变化，再选择留守队员。','结束回合。']},
  {title:'收税格与使用手牌', start:'R1', cards:['card1','card27'], route:['R2'], steps:['move','reserve-member','use-card','end-turn'],
    hints:['练习转场：已来到 R1。走到 R2 收税格，观察停留时的税额。','选择留守队员。','这次试着使用「找对关系」；移动牌与使用牌是两次不同的操作。','观察卡牌效果，再结束回合。']},
  {title:'事件格', start:'R3', cards:['card6'], route:['R4','P2'], steps:['move','reserve-member','end-turn'],
    hints:['练习转场：已来到 R3。经过 R4 会扣 10 金钱，停在 P2 会翻开事件牌。','查看事件结果并选择留守队员。','结束回合。']},
  {title:'厄运格', start:'R2', cards:['card1'], route:['B'], steps:['move','misfortune-target','reserve-member','end-turn'],
    hints:['练习转场：已来到 R2。走到厄运 B；停在这里会翻两张厄运牌。','指定 B 队替你选一张；教程中的 B 队会自动完成选择。','查看厄运结果，选择留守队员。','结束回合。']},
  {title:'Arcaea 银行', start:'A2', cards:['card1'], route:['Arcaea'], steps:['move','skip-use','house-action','end-turn'],
    hints:['练习转场：已来到 A2。进入 Arcaea；房屋可以提前结束移动，且不会触发战斗。','这回合不使用手牌，先点击「不使用卡牌」。','使用银行效果，支付金钱提高永久收入。','结束回合。']},
  {title:'Phigros 市场', start:'P2', cards:['card1'], route:['Phigros'], steps:['move','skip-use','house-action','end-turn'],
    hints:['练习转场：已来到 P2，并获得 1 分练习积分。进入 Phigros 市场。','点击「不使用卡牌」。','使用市场效果，将 1 积分兑换为金钱。','结束回合。']},
  {title:'范式起源藏宝阁', start:'F3', cards:['card1'], route:['范式起源'], steps:['move','skip-use','house-action','end-turn'],
    hints:['练习转场：已来到 F3。进入范式起源。','点击「不使用卡牌」。','使用建筑效果掷骰，获得对应金钱。','结束回合。']},
  {title:'独立完成一回合', start:'R11', cards:['card1'], route:['R12'], steps:['move','reserve-member','end-turn'],
    hints:['最后转场至 R11。这次不再逐步提示，自行选牌、走到 R12、留守并结束回合。','','']},
];
const cardById = Object.fromEntries(game.HAND.map(card => [card.id, card]));

function card(id, serial) {
  const original=cardById[id];
  if(!original)throw Error(`教程卡牌不存在：${id}`);
  return {...original, id:`tutorial-${serial}`, sourceId:id};
}
function prepareScene(progress) {
  const scene=scenes[progress.scene], room=progress.room, team=room.teams.A;
  team.position=scene.start;
  team.hand=[...scene.cards, ...Array(6-scene.cards.length).fill('card27')].map((id,i)=>card(id,`${progress.scene}-hand-${i}`));
  team.deck=Array.from({length:12},(_,i)=>card('card27',`${progress.scene}-deck-${i}`));
  team.discard=[];
  team.pendingRoll=null;
  team.pendingEvent=false;
  team.pendingChallenge=null;
  team.pendingMisfortuneCard=null;
  team.pendingTarget=null;
  team.awaitingEnd=false;
  team.cardActionDone=false;
  team.houseActionDone=false;
  room.pendingMisfortuneChoice=null;
  room.pendingAuction=null;
  if(progress.scene===6)game.score(room,{role:'host'},'A',1);
  if(progress.scene===3)room.eventDeck=[EVENTS.find(item=>item.id==='event1'),...room.eventDeck.filter(item=>item.id!=='event1')];
  if(progress.scene===4)room.misfortuneDeck=[...['mis2','mis3'].map(id=>MISFORTUNES.find(item=>item.id===id)),...room.misfortuneDeck.filter(item=>!['mis2','mis3'].includes(item.id))];
}
function create(user,resetCount=0) {
  const room=game.createRoom({seed:'cdmga-player-tutorial-v1',initialMoney:500,initialIncome:30});
  room.code='TUTORIAL';
  room.resetCount=resetCount;
  room.teams.A.members=[{id:user.id,account:user.account,avatar:null}];
  for(const team of Object.values(room.teams))team.joined=true;
  const progress={scene:0,step:0,completed:false,room};
  prepareScene(progress);
  return progress;
}
function publicState(progress) {
  const state=game.state(game.hydrate(progress.room),who);
  const scene=scenes[progress.scene];
  return {...state, canAct:!progress.completed, tutorial:{scene:progress.scene+1,total:scenes.length,
    title:progress.completed?'教程完成':scene.title,
    instruction:progress.completed?'你已经体验了全部常见格子和三座建筑，可以开始正式游戏或从头练习。':scene.hints[progress.step],
    completed:progress.completed, finalPractice:progress.scene===scenes.length-1}};
}
function apply(progress,action,payload={}) {
  if(progress.completed)throw Error('教程已完成，可选择重新开始');
  game.hydrate(progress.room);
  const scene=scenes[progress.scene],expected=scene.steps[progress.step];
  if(action!==expected)throw Error(scene.hints[progress.step]||'请先完成当前步骤');
  const team=progress.room.teams.A;
  if(action==='move'){
    const chosen=team.hand.find(item=>item.id===payload.cardId);
    if(!chosen||chosen.move!==scene.route.length||JSON.stringify(payload.route)!==JSON.stringify(scene.route))
      throw Error(`请选择 ${scene.route.length} 步手牌，沿提示路线移动到 ${scene.route.at(-1)}`);
    game.move(progress.room,who,payload.cardId,payload.route);
  }else if(action==='reserve-member')game.reserveMember(progress.room,who,payload.memberId);
  else if(action==='use-card'){
    if(team.hand.find(item=>item.id===payload.cardId)?.sourceId!=='card27')throw Error('请使用「找对关系」');
    game.useCard(progress.room,who,payload.cardId);
  }else if(action==='skip-use')game.skipUse(progress.room,who);
  else if(action==='house-action')game.houseAction(progress.room,who);
  else if(action==='misfortune-target'){
    if(payload.target!=='B')throw Error('请指定 B 队选牌');
    game.misfortuneTarget(progress.room,who,'B');
    game.misfortunePick(progress.room,{role:'team',id:'B'},0);
  }else if(action==='end-turn')game.endTurn(progress.room,who);
  progress.step++;
  if(progress.step===scene.steps.length){
    if(progress.scene===scenes.length-1)progress.completed=true;
    else {progress.scene++;progress.step=0;prepareScene(progress);}
  }
  return progress;
}
module.exports={scenes,create,publicState,apply};
