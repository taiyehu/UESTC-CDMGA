const crypto = require('node:crypto');
const {NODE_TYPES}=require('./map-data');
const {HAND,EVENTS,MISFORTUNES}=require('./catalog');

const HOUSE = new Set(['Arcaea', 'Phigros', '范式起源']);
const GOAL_SCORE = 20;
const GRAPH = {
  R1:['R2'], R2:['R3','B'], R3:['R4'], R4:['R5','P2'],
  R5:['R6'], R6:['R7'], R7:['R8'], R8:['R9','B'], R9:['R10','F4'],
  R10:['R11'], R11:['R12'], R12:['R1','A2'],
  A2:['Arcaea'], Arcaea:['A1'], A1:['R1'],
  P2:['Phigros'], Phigros:['P1'], P1:['R5'],
  F4:['F3'], F3:['范式起源'], '范式起源':['F1'], F1:['F2'], F2:['R10'],
  B:['R2','R8']
};
const POS = {
  R1:[910.9,1745.9], R2:[294.7,1855.1], R3:[-294.2,1640.6], R4:[-695.9,1160.9], R5:[-805.1,544.7], R6:[-590.6,-44.2],
  R7:[-110.9,-445.9], R8:[505.3,-555.1], R9:[1094.2,-340.6], R10:[1495.9,139.1], R11:[1605.1,755.3], R12:[1390.6,1344.2],
  A1:[1353.6842,2729.4648], Arcaea:[2189.5566,2402.5207], A2:[2056.8090,1514.8534], P2:[-1422.9579,1685.6069], Phigros:[-2096.7734,1093.1334], P1:[-1669.5011,304.1527],
  F4:[1218.7887,-953.7498], F3:[1775.8483,-1238.6350], '范式起源':[2745.9015,-980.7313], F1:[2499.6867,-374.2455], F2:[2121.4004,124.1264], B:[400,650]
};
const randomId = () => crypto.randomBytes(18).toString('base64url');
function hydrate(room) {
  // Older saved rooms have no score history; reveal their existing total only at the team's saved round.
  if(!Array.isArray(room.scoreChanges))room.scoreChanges=Object.values(room.teams||{}).filter(t=>t.score).map(t=>({id:randomId(),team:t.id,amount:t.score,reason:'历史积分',round:t.round,time:Date.now()}));
  for(const t of Object.values(room.teams||{}))if(t.score>=GOAL_SCORE&&t.immuneFromRound==null){t.immuneFromRound=t.round;t.qualifyingRound=t.round;t.qualifiedAt=Date.now();}
  room.exTimeEvents??=[];
  room.diceRolls??=[];
  room.pendingCardReaction??=null;
  for(const t of Object.values(room.teams||{})){
    t.members??=[];t.pendingEvent??=false;
    t.pendingMisfortuneCard??=null;t.skipNextTurn??=false;t.extraCardUsesThisRound??=0;
    t.nextBattleWinBonus??=0;t.chooseNextSteps??=false;t.doubleEvent??=false;
    t.lastResolvedCard??=null;t.lastHouse??=null;
    t.battleRescue??=0;t.freeSongBattle??=t.freeSongChallenge||0;t.linkedTeamId??=null;t.nextBattleDebuff??=0;t.pendingDiscard??=null;t.pendingRedraw??=false;
    if(t.awaitingEnd){const current=room.records?.findLast(r=>r.team===t.id&&r.round===t.round);if(current)delete current.defenderUnavailable;}
  }
  room.result??=null;
  room.randomInt = max => crypto.createHash('sha256').update(`${room.seed}:${room.randomCounter++}`).digest().readUInt32BE(0)%max;
  if((room.catalogVersion??1)<4&&room.teams?.A?.deck){
    for(const t of Object.values(room.teams)){
      const existing=new Set([...t.hand,...t.deck,...t.discard].map(card=>card.sourceId||card.id));
      const added=HAND.filter(card=>!existing.has(card.id)).flatMap(card=>Array.from({length:card.quantity},(_,n)=>({...card,id:`${t.id}-${card.id}-${n+1}`,sourceId:card.id})));
      if(added.length)t.deck=shuffle([...t.deck,...added],room.randomInt);
    }
    for(const [kind,cards] of [['event',EVENTS],['misfortune',MISFORTUNES]]){
      const deck=kind+'Deck',discard=kind+'Discard';
      const existing=new Set([...(room[deck]||[]),...(room[discard]||[])].map(card=>card.id));
      const added=cards.filter(card=>!existing.has(card.id)).flatMap(card=>Array.from({length:card.quantity},()=>card));
      if(added.length)room[deck]=shuffle([...(room[deck]||[]),...added],room.randomInt);
    }
  }
  const latestHand=new Map(HAND.map(card=>[card.id,card]));
  for(const t of Object.values(room.teams||{}))for(const pile of ['hand','deck','discard'])
    if(Array.isArray(t[pile]))t[pile]=t[pile].map(card=>latestHand.has(card.sourceId)?{...card,...latestHand.get(card.sourceId),id:card.id,sourceId:card.sourceId}:card);
  const latestEvents=new Map(EVENTS.map(card=>[card.id,card]));
  for(const pile of ['eventDeck','eventDiscard'])if(Array.isArray(room[pile]))room[pile]=room[pile].map(card=>latestEvents.get(card.id)||card);
  room.catalogVersion=4;
  return room;
}
const shuffle = (cards,randomInt) => {
  const a = [...cards];
  for (let i=a.length-1;i>0;i--) { const j=randomInt(i+1); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
};
function newTeam(id,randomInt,initialMoney,initialIncome,start) {
  const deck = shuffle(HAND.flatMap(card=>Array.from({length:card.quantity},(_,n)=>({...card,id:`${id}-${card.id}-${n+1}`,sourceId:card.id}))),randomInt);
  return {id, joined:false, token:null, score:0, money:initialMoney, income:initialIncome,
    immuneFromRound:null,qualifyingRound:null,qualifiedAt:null,qualificationOrder:null,
    round:1, awaitingEnd:false, cardActionDone:false, position:start, members:[], pendingEvent:false, hand:deck.splice(0,6), deck,
    discard:[], lastArrival:0,pendingRoll:null,eventShield:0,misfortuneShield:0,
    nextBattleWinBonus:0,chooseNextSteps:false,doubleEvent:false,lastResolvedCard:null,lastHouse:null,
    battleRescue:0,freeSongBattle:0,linkedTeamId:null,nextBattleDebuff:0,
    pendingChallenge:null,pendingTeleport:false,pendingExtraMove:false,pendingTarget:null,pendingDiscard:null,pendingRedraw:false,pendingReroll:null,pendingMisfortuneCard:null,
    discardAbility:false,discardedRound:0,houseActionDone:false,debuffs:[],debuffShield:0,nextBattleModifier:0,
    loanActive:false,maxCardUses:1,extraCardUsesThisRound:0,cardUsesThisRound:0,skipNextTurn:false,arcaeaVisitIncome:false,fanshiVisitMoney:0};
}
function makePile(cards,randomInt){return shuffle(cards.flatMap(card=>Array.from({length:card.quantity},()=>card)),randomInt);}
function drawPile(room,kind){
  const deckKey=kind+'Deck',discardKey=kind+'Discard';
  if(!room[deckKey].length){room[deckKey]=shuffle(room[discardKey],room.randomInt);room[discardKey]=[];}
  const card=room[deckKey].shift();if(!card)throw Error(`${kind} 牌库为空`);
  room[discardKey].push(card);return card;
}
function createRoom({seed=null,testMode=false,initialMoney=200,initialIncome=30,deadlineAt=null}={}) {
  if(!Number.isSafeInteger(initialMoney)||initialMoney<0||initialMoney>1_000_000)throw Error('初始金钱必须是 0 到 1000000 的整数');
  if(!Number.isSafeInteger(initialIncome)||initialIncome<0||initialIncome>1_000_000)throw Error('初始收入必须是 0 到 1000000 的整数');
  const room=hydrate({code:'',hostToken:randomId(),seed:seed??randomId(),randomCounter:0,testMode,initialMoney,initialIncome,
    resetCount:0,teams:{},deadlineAt,result:null,catalogVersion:4,
    records:[],battles:[],log:[],effects:[],exTimeEvents:[],diceRolls:[],moneyChanges:[],incomeChanges:[],scoreChanges:[],cardFlows:[],version:0});
  room.starts=shuffle([...HOUSE],room.randomInt);
  for(const [i,id] of [...'ABC'].entries())room.teams[id]=newTeam(id,room.randomInt,initialMoney,initialIncome,room.starts[i]);
  room.eventDeck=makePile(EVENTS,room.randomInt);room.eventDiscard=[];
  room.misfortuneDeck=makePile(MISFORTUNES,room.randomInt);room.misfortuneDiscard=[];
  room.pendingAuction=null;room.pendingMisfortuneChoice=null;room.pendingCardReaction=null;room.auctionQueue=[];
  if(testMode)for(const id of 'ABC'){room.teams[id].joined=true;room.teams[id].token=randomId();}
  return room;
}
function reset(room,who) {
  if(who.role!=='host')throw Error('只有裁判可以重置房间');
  const seats=Object.fromEntries('ABC'.split('').map(id=>[id,{joined:room.teams[id].joined,token:room.teams[id].token,members:room.teams[id].members}]));
  room.randomCounter=0;hydrate(room);
  room.starts=shuffle([...HOUSE],room.randomInt);
  for(const [i,id] of [...'ABC'].entries())room.teams[id]={...newTeam(id,room.randomInt,room.initialMoney,room.initialIncome,room.starts[i]),...seats[id]};
  room.eventDeck=makePile(EVENTS,room.randomInt);room.eventDiscard=[];
  room.misfortuneDeck=makePile(MISFORTUNES,room.randomInt);room.misfortuneDiscard=[];
  room.pendingAuction=null;room.pendingMisfortuneChoice=null;room.pendingCardReaction=null;room.auctionQueue=[];
  room.records=[];room.battles=[];room.log=[];room.effects=[];room.exTimeEvents=[];room.diceRolls=[];room.moneyChanges=[];room.incomeChanges=[];room.scoreChanges=[];room.cardFlows=[];room.result=null;room.resetCount++;
  note(room,'裁判重置了测试房间');
}
function note(room, message) {room.log.unshift({time:Date.now(),message});room.log=room.log.slice(0,60);room.version++;}
function changeMoney(room,t,delta,reason,sourceRound=t.round){
  const before=t.money;t.money=Math.max(0,t.money+delta);
  const amount=t.money-before;
  if(amount)room.moneyChanges.push({id:randomId(),team:t.id,amount,reason,round:sourceRound,time:Date.now()});
  return amount;
}
function changeIncome(room,t,delta,reason,sourceRound=t.round){
  const before=t.income;t.income=Math.max(0,t.income+delta);const amount=t.income-before;
  if(!amount)return;
  room.incomeChanges.push({id:randomId(),team:t.id,amount,reason,round:sourceRound,time:Date.now()});
}
function changeScore(room,t,delta,reason,sourceRound=t.round){
  const before=t.score;t.score=Math.max(0,t.score+delta);
  const amount=t.score-before;
  if(amount)room.scoreChanges.push({id:randomId(),team:t.id,amount,reason,round:sourceRound,time:Date.now()});
  if(before<GOAL_SCORE&&t.score>=GOAL_SCORE){
    if(t.immuneFromRound==null){
      t.immuneFromRound=sourceRound;room.exTimeEvents.push({id:randomId(),team:t.id,round:sourceRound,time:Date.now()});
      room.battles=room.battles.filter(b=>b.round<sourceRound||b.status==='待结算'||b.status==='已结算'||![b.first,b.second].some(id=>room.records.find(r=>r.id===id)?.team===t.id));
      note(room,`${t.id} 队首次达到 ${GOAL_SCORE} 分，进入 EX time`);
    }
    t.qualifyingRound=sourceRound;t.qualifiedAt=Date.now();t.qualificationOrder=room.scoreChanges.length;
  }else if(t.score<GOAL_SCORE){t.qualifyingRound=null;t.qualifiedAt=null;t.qualificationOrder=null;}
  return amount;
}
function finishByScores(room,reason='time_limit',now=Date.now()){
  if(room.result)return room.result;
  const ranking=Object.values(room.teams).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).map((t,i,all)=>({team:t.id,score:t.score,rank:1+all.filter(other=>other.score>t.score).length}));
  room.result={reason,endedAt:now,ranking,winners:ranking.filter(t=>t.rank===1).map(t=>t.team)};
  note(room,`${reason==='time_limit'?'比赛时间到':'裁判结束比赛'}，按积分确定名次：${ranking.map(t=>`${t.team} 队 ${t.score} 分`).join('、')}`);
  return room.result;
}
function evaluateEnd(room,now=Date.now()){
  if(room.result)return room.result;
  if(room.deadlineAt&&now>=room.deadlineAt)return finishByScores(room,'time_limit',now);
  else{
    const candidates=Object.values(room.teams).filter(t=>t.score>=GOAL_SCORE&&t.qualifyingRound!=null).sort((a,b)=>a.qualifyingRound-b.qualifyingRound||a.qualifiedAt-b.qualifiedAt||a.qualificationOrder-b.qualificationOrder);
    const first=candidates[0];
    if(first&&Object.values(room.teams).every(t=>t.round>first.qualifyingRound)&&!room.battles.some(b=>b.status!=='已结算'&&b.round<=first.qualifyingRound))
      room.result={reason:'goal',endedAt:now,winner:first.id,qualifyingRound:first.qualifyingRound,qualifiedAt:first.qualifiedAt};
  }
  if(room.result)note(room,`${room.result.winner} 队第 ${room.result.qualifyingRound} 轮达标，确认获胜`);
  return room.result;
}
function effectNotice(room,kind,team,cards){
  room.effects.push({id:randomId(),kind,team,cards:cards.map(c=>({id:c.id,name:c.name,image:c.image})),time:Date.now()});
  room.effects=room.effects.slice(-80);
}
function join(room,id) {
  const team=room.teams[id];
  if (!team || team.joined) throw Error('该队伍席位不可用');
  team.joined=true;team.token=randomId();note(room,`${id} 队加入房间`);return team.token;
}
function viewer(room,token) {
  if (token===room.hostToken) return {role:'host'};
  for (const id of 'ABC') if (token===room.teams[id].token && room.teams[id].joined) return {role:'team',id};
  throw Error('无效的房间凭证');
}
function visiblePile(cards){
  return cards.map(c=>({id:c.sourceId||c.id,name:c.name,image:c.image})).sort((a,b)=>{
    const aNumber=Number(a.id.match(/\d+$/)?.[0]),bNumber=Number(b.id.match(/\d+$/)?.[0]);
    return aNumber-bNumber||a.id.localeCompare(b.id);
  });
}
function state(room,who) {
  const own=who.role==='team'?room.teams[who.id]:null;
  const visible=room.records.filter(r=>who.role==='host'||(r.round<=own.round && r.time<=Date.now()));
  const visibleMoney=room.moneyChanges.filter(c=>who.role==='host'||c.round<=own.round);
  const visibleIncome=room.incomeChanges.filter(c=>who.role==='host'||c.round<=own.round);
  const visibleScore=room.scoreChanges.filter(c=>who.role==='host'||c.round<=own.round);
  const resource=(t,kind,changes,initial)=>who.role==='host'||t.id===who.id?t[kind]:
    Math.max(0,initial+changes.filter(c=>c.team===t.id).reduce((sum,c)=>sum+c.amount,0));
  const mapView=Object.fromEntries(Object.entries(room.teams).map(([id,t])=>{
    if(who.role==='host'||id===who.id){
      const current=room.records.findLast(r=>r.team===id&&r.round<=t.round);
      return [id,{node:t.position,ghost:false,actualRound:t.round,...(current?.defender?{defender:current.defender}:{})}];
    }
    const current=room.records.find(r=>r.team===id&&r.round===own.round);
    return [id,{node:current?.finalPosition||current?.node||t.position,ghost:!current,actualRound:t.round,...(current?.defender?{defender:current.defender}:{})}];
  }));
  return {code:room.code,version:room.version,role:who.role,teamId:who.id||null,
    endgame:{goalScore:GOAL_SCORE,deadlineAt:room.deadlineAt||null,result:room.result,
      provisional:Object.values(room.teams).filter(t=>t.qualifyingRound!=null&&(who.role==='host'||t.id===who.id)).map(t=>({team:t.id,round:t.qualifyingRound,score:resource(t,'score',visibleScore,0)}))},
    mapView,effects:room.effects,exTimeEvents:room.exTimeEvents.filter(e=>who.role==='host'||e.round<=own.round),diceRolls:room.diceRolls.filter(e=>who.role==='host'||e.round<=own.round),moneyChanges:visibleMoney,incomeChanges:visibleIncome,
    cardFlows:room.cardFlows.filter(flow=>who.role==='host'||flow.team===who.id),
    seed:who.role==='host'?room.seed:undefined,testMode:room.testMode,resetCount:room.resetCount,
    initialMoney:who.role==='host'?room.initialMoney:undefined,initialIncome:who.role==='host'?room.initialIncome:undefined,
    pendingAuction:room.pendingAuction?{card:room.pendingAuction.card,triggerTeam:room.pendingAuction.triggerTeam,
      bids:Object.fromEntries('ABC'.split('').map(id=>[id,who.role==='host'||id===who.id?room.pendingAuction.bids[id]:room.pendingAuction.bids[id]===undefined?undefined:'已提交']))}:null,
    pendingMisfortuneChoice:room.pendingMisfortuneChoice,
    pendingCardReaction:room.pendingCardReaction?{sourceTeam:room.pendingCardReaction.sourceTeam,card:{name:room.pendingCardReaction.card.name,image:room.pendingCardReaction.card.image},responder:room.pendingCardReaction.responders[0]||null,reactor:room.pendingCardReaction.reactor||null}:null,
    challenges:who.role==='host'?Object.fromEntries('ABC'.split('').filter(id=>room.teams[id].pendingChallenge).map(id=>[id,room.teams[id].pendingChallenge])):undefined,
    testTokens:who.role==='host'&&room.testMode?Object.fromEntries('ABC'.split('').map(id=>[id,room.teams[id].token])):undefined,
    teams:Object.fromEntries(Object.entries(room.teams).map(([id,t])=>[id,{joined:t.joined,score:resource(t,'score',visibleScore,0),
      money:resource(t,'money',visibleMoney,room.initialMoney),income:resource(t,'income',visibleIncome,room.initialIncome),round:t.round,
      awaitingEnd:t.awaitingEnd,cardActionDone:t.cardActionDone,houseActionDone:t.houseActionDone,position:mapView[id].node,
      exTime:t.immuneFromRound!=null&&(who.role==='host'||id===who.id||t.immuneFromRound<=own.round),
      ...(who.role==='host'||id===who.id?{members:t.members,eligibleMembers:eligibleMembers(room,t),pendingEvent:t.pendingEvent}:{}),
      deckCount:t.deck.length,discardCount:t.discard.length,handCount:t.hand.length,
      ...(id===who.id?{deckCards:visiblePile(t.deck),discardCards:visiblePile(t.discard)}:{}),
      ...(who.role==='host'||id===who.id?{discardTop:t.discard.at(-1)?{name:t.discard.at(-1).name,image:t.discard.at(-1).image}:null}:{}),
      eventShield:t.eventShield,misfortuneShield:t.misfortuneShield,discardAbility:t.discardAbility,
      debuffs:t.debuffs,debuffShield:t.debuffShield,nextBattleModifier:t.nextBattleModifier,
      nextBattleWinBonus:t.nextBattleWinBonus,chooseNextSteps:t.chooseNextSteps,doubleEvent:t.doubleEvent,
      battleRescue:t.battleRescue,freeSongBattle:t.freeSongBattle,linkedTeamId:t.linkedTeamId,nextBattleDebuff:t.nextBattleDebuff,
      loanActive:t.loanActive,maxCardUses:t.maxCardUses,extraCardUsesThisRound:t.extraCardUsesThisRound,cardUsesThisRound:t.cardUsesThisRound,skipNextTurn:t.skipNextTurn,
      arcaeaVisitIncome:t.arcaeaVisitIncome,fanshiVisitMoney:t.fanshiVisitMoney,
      canDiscard:t.discardAbility&&t.awaitingEnd&&Object.hasOwn(GRAPH,t.position)&&t.discardedRound!==t.round&&
        !t.pendingChallenge&&!t.pendingTeleport&&!t.pendingExtraMove&&!t.pendingTarget&&!t.pendingRedraw&&!t.pendingReroll&&!t.pendingMisfortuneCard&&!room.pendingAuction&&!room.pendingMisfortuneChoice&&!t.hand.some(c=>canUse(t,c)),
      pendingChallenge:who.role==='host'||id===who.id?t.pendingChallenge?{id:t.pendingChallenge.id,card:t.pendingChallenge.card,freeSong:t.pendingChallenge.freeSong}:null:undefined,
      pendingTeleport:id===who.id||who.role==='host'?t.pendingTeleport:undefined,
      pendingExtraMove:id===who.id||who.role==='host'?t.pendingExtraMove:undefined,
      pendingTarget:id===who.id||who.role==='host'?t.pendingTarget:undefined,
      pendingDiscard:id===who.id||who.role==='host'?t.pendingDiscard:undefined,
      pendingRedraw:id===who.id||who.role==='host'?t.pendingRedraw:undefined,
      pendingDiscardCards:id===who.id&&t.pendingDiscard?room.teams[t.pendingDiscard].hand.map(c=>({id:c.id,name:c.name,image:c.image})):undefined,
      pendingReroll:id===who.id||who.role==='host'?t.pendingReroll:undefined,
      pendingMisfortuneCard:id===who.id||who.role==='host'?t.pendingMisfortuneCard:undefined,
      ...(who.role==='host'||id===who.id?{pendingRoll:t.pendingRoll}:{}),
      ...(who.role==='host'||id===who.id?{hand:t.hand}: {})}])),
    records:visible,battles:room.battles.filter(b=>who.role==='host'||visible.some(r=>r.id===b.first||r.id===b.second)),
    log:who.role==='host'?room.log:[],graph:GRAPH,pos:POS,nodeTypes:NODE_TYPES,house:[...HOUSE]};
}
function roll(room,who,cardId,value){
  if(who.role!=='team')throw Error('只有队伍可以掷骰');
  const t=room.teams[who.id],card=t.hand.find(c=>c.id===cardId);
  if(t.awaitingEnd&&!t.pendingExtraMove)throw Error('当前不能掷骰移动');
  if(!card||card.move!==7&&!t.chooseNextSteps)throw Error('只能为问号牌掷骰或选择下一次移动步数');
  if(t.pendingRoll?.cardId===cardId)return t.pendingRoll.value;
  if(t.chooseNextSteps&&(!Number.isInteger(value)||value<1||value>6))throw Error('请选择 1 到 6 步');
  t.pendingRoll={cardId,value:t.chooseNextSteps?value:rollD6(room,t,'问号移动牌')};
  note(room,`${who.id} 队${t.chooseNextSteps?'选择':'掷出'} ${t.pendingRoll.value} 步`);
  return t.pendingRoll.value;
}
function consumeCard(room,t,index){
  const [card]=t.hand.splice(index,1);t.discard.push(card);
  let shuffled=false;
  if(t.deck.length===0){t.deck=shuffle(t.discard,room.randomInt);t.discard=[];shuffled=true;}
  const drawn=t.deck.shift();t.hand.push(drawn);t.pendingRoll=null;
  room.cardFlows.push({id:randomId(),team:t.id,spent:{id:card.id,name:card.name,image:card.image},drawn:{id:drawn.id,name:drawn.name,image:drawn.image},shuffled,time:Date.now()});
  room.cardFlows=room.cardFlows.slice(-120);
  return {card,shuffled};
}
const cardHouse=card=>card.game_type==='fanshi'?'范式起源':card.game_type;
function canUse(t,card){
  if(t.money<card.cost)return false;
  if(card.effect_type==='counter_other_card')return false;
  if(t.pendingMisfortuneCard)return card.effect_type==='redirect_misfortune'||card.effect_type==='clear_debuff_draw_buff';
  if(card.effect_type==='event_cancel_random')return NODE_TYPES[t.position]==='事件格'&&t.pendingEvent;
  if(card.effect_type==='money_extra_use')return NODE_TYPES[t.position]==='事件格';
  if(card.game_type==='all')return true;
  if(card.game_type==='event')return NODE_TYPES[t.position]==='事件格';
  if(card.game_type==='koushui')return NODE_TYPES[t.position]==='收税格'&&
    (!card.effect_type.startsWith('challenge_battle_')||t.immuneFromRound==null||t.immuneFromRound>t.round)&&
    (card.effect_type!=='challenge_battle_low_hand_tax_refund'||t.hand.every(c=>c.move<=3));
  if(card.game_type==='mis')return NODE_TYPES[t.position]==='厄运格';
  return HOUSE.has(t.position)&&(card.game_type==='random'||cardHouse(card)===t.position);
}
function finishCardUse(t){t.cardActionDone=t.cardUsesThisRound>=t.maxCardUses+t.extraCardUsesThisRound;}
function rollD6(room,t,reason){
  const value=room.randomInt(6)+1;
  room.diceRolls.push({id:randomId(),team:t.id,round:t.round,value,reason,time:Date.now()});
  room.diceRolls=room.diceRolls.slice(-120);
  return value;
}
function rollFanshi(room,t,reason,roll){
  roll??=rollD6(room,t,reason);
  const prize=[10,25,50,100,150,200][roll-1];changeMoney(room,t,prize,reason);return {roll,prize};
}
function consumeDebuffs(t){return t.debuffs.splice(0);}
function addDebuff(room,t,card){
  if(t.debuffShield>0){t.debuffShield--;note(room,`${t.id} 队抵消了「${card.name}」的 debuff`);return;}
  t.debuffs.push({id:card.id,name:card.name,effect:card.effect});
}
function chargeLoan(room,t){
  if(!t.loanActive)return;
  if(t.money>=25)changeMoney(room,t,-25,'快速贷款还款');
  else{changeScore(room,t,-3,'快速贷款违约');t.loanActive=false;note(room,`${t.id} 队无法支付快速贷款，−3 分并失去贷款效果`);}
}
function refundFinalTax(room,t,record,reason){
  if(!record||record.taxRefunded)return 0;
  const paid=record.moneyEffects?.findLast(effect=>effect.node===record.node&&effect.amount<0);
  if(!paid)return 0;
  const refund=changeMoney(room,t,-paid.amount,`${reason}免税`);
  record.moneyDelta+=refund;record.taxRefunded=true;
  return refund;
}
function applyCardEffect(room,t,card,record){
  switch(card.effect_type){
    case 'score':case 'score_move_fee':case 'score_skip_if_moved':changeScore(room,t,card.effectValue,card.name);break;
    case 'income':changeIncome(room,t,card.effectValue,card.name);break;
    case 'money':changeMoney(room,t,card.effectValue,card.name);break;
    case 'score_money':changeScore(room,t,card.effectValue,card.name);changeMoney(room,t,card.effectAux,card.name);break;
    case 'shield_misfortune':t.misfortuneShield+=card.effectValue;break;
    case 'teleport':case 'teleport_move_fee_tax':t.pendingTeleport=true;break;
    case 'score_extra_move':changeScore(room,t,card.effectValue,card.name);t.pendingExtraMove=true;break;
    case 'score_optional_discard':changeScore(room,t,card.effectValue,card.name);t.discardAbility=true;break;
    case 'transfer_income':case 'redirect_misfortune':case 'teleport_other_team':t.pendingTarget=card;break;
    case 'extra_use_redraw_one':t.extraCardUsesThisRound++;t.pendingRedraw=true;break;
    case 'extra_use_redraw_all':{
      t.extraCardUsesThisRound++;
      const discarded=t.hand.splice(0);t.discard.push(...discarded);
      for(const spent of discarded){
        let shuffled=false;
        if(!t.deck.length){t.deck=shuffle(t.discard,room.randomInt);t.discard=[];shuffled=true;}
        const drawn=t.deck.shift();t.hand.push(drawn);
        room.cardFlows.push({id:randomId(),team:t.id,spent:{id:spent.id,name:spent.name,image:spent.image},drawn:{id:drawn.id,name:drawn.name,image:drawn.image},shuffled,time:Date.now()});
      }
      room.cardFlows=room.cardFlows.slice(-120);t.pendingRoll=null;
      break;
    }
    case 'challenge_battle_low_hand_tax_refund':case 'challenge_battle_tax_refund':
      refundFinalTax(room,t,record,card.name);t.pendingTarget=card;break;
    case 'income_once_tax_refund':
      changeMoney(room,t,t.income,card.name);refundFinalTax(room,t,record,card.name);break;
    case 'fanshi_reroll':t.pendingReroll={card,firstRoll:rollD6(room,t,`${card.name}首掷`)};break;
    case 'loan':changeMoney(room,t,card.effectValue,card.name);t.loanActive=true;break;
    case 'score_double_use':changeScore(room,t,card.effectValue,card.name);t.maxCardUses=card.effectAux;break;
    case 'score_income':changeScore(room,t,card.effectValue,card.name);changeIncome(room,t,card.effectAux,card.name);break;
    case 'score_income_arcaea_visit':changeScore(room,t,card.effectValue,card.name);changeIncome(room,t,card.effectAux,card.name);t.arcaeaVisitIncome=true;break;
    case 'score_fanshi_visit':changeScore(room,t,card.effectValue,card.name);t.fanshiVisitMoney=card.effectAux;break;
    case 'money_extra_use':changeMoney(room,t,card.effectValue,card.name);t.extraCardUsesThisRound+=card.effectAux;break;
    case 'clear_debuff_draw_buff':{
      const count=t.debuffs.length+(t.nextBattleDebuff<0?1:0);t.debuffs=[];t.nextBattleDebuff=0;
      const buffs=['eventShield','misfortuneShield','debuffShield'];
      for(let i=0;i<count;i++)t[buffs[room.randomInt(buffs.length)]]++;
      note(room,`${t.id} 队清除 ${count} 个 debuff，抽取 ${count} 个抵消类 buff`);break;
    }
    case 'next_battle_win_bonus':t.nextBattleWinBonus+=card.effectValue;break;
    case 'score_choose_next_steps':changeScore(room,t,card.effectValue,card.name);t.chooseNextSteps=true;break;
    case 'double_event':t.doubleEvent=true;break;
    case 'score_battle_rescue':changeScore(room,t,card.effectValue,card.name);t.battleRescue++;break;
    case 'score_free_song':changeScore(room,t,card.effectValue,card.name);t.freeSongBattle++;break;
    case 'score_link_team':changeScore(room,t,card.effectValue,card.name);t.pendingTarget=card;break;
    case 'score_discard_other':changeScore(room,t,card.effectValue,card.name);t.pendingTarget=card;break;
    case 'replay_card_house':{
      const previous=t.lastResolvedCard;
      if(previous?.effect_type==='event_cancel_random'){
        const points=rollD6(room,t,`${card.name}重放${previous.name}`);
        changeScore(room,t,points,card.name);changeMoney(room,t,points*70,card.name);
      }else if(previous&&previous.effect_type!=='replay_card_house')applyCardEffect(room,t,previous,record);
      if(t.lastHouse)performHouseEffect(room,t,t.lastHouse,`${card.name}重放`);
      break;
    }
    default:throw Error(`尚不支持卡牌效果 ${card.effect_type}`);
  }
  if(card.effect_type!=='replay_card_house')t.lastResolvedCard=card;
  if(!t.pendingTeleport&&!t.pendingExtraMove&&!t.pendingTarget&&!t.pendingRedraw&&!t.pendingReroll)finishCardUse(t);
}
function resolvePlayedCard(room,t,card,record){
  if(card.effect_type==='event_cancel_random'){
    const points=rollD6(room,t,card.name);changeScore(room,t,points,card.name);changeMoney(room,t,points*70,card.name);t.pendingEvent=false;
    if(record){record.pendingEvent=false;record.event={id:'cancelled',name:'事件已抵消',image:null};}
    effectNotice(room,'event',t.id,[]);finishCardUse(t);note(room,`${t.id} 队使用「${card.name}」：抵消当前事件，+${points} 分、+${points*70} 金钱`);
    t.lastResolvedCard=card;
    if(record)record.usedCard.result='已生效';
  }else if(card.condition==='无'){
    applyCardEffect(room,t,card,record);
    if(record)record.usedCard.result='已生效';
    note(room,`${t.id} 队使用「${card.name}」：${card.effect}`);
  }else{
    t.pendingChallenge={id:randomId(),card,round:t.round,debuffs:consumeDebuffs(t)};
    note(room,`${t.id} 队使用「${card.name}」，等待裁判判定挑战：${card.condition}`);
  }
  if(t.pendingEvent&&t.cardActionDone){t.pendingEvent=false;if(record)record.pendingEvent=false;resolveEvent(room,t,record);}
  if(card.effect_type==='clear_debuff_draw_buff'&&t.pendingMisfortuneCard){const pending=t.pendingMisfortuneCard;t.pendingMisfortuneCard=null;resolveMisfortuneVisits(room,t,room.records.find(r=>r.id===pending.recordId),pending.visits);}
}
function useCard(room,who,cardId){
  if(who.role!=='team')throw Error('只有队伍可以使用手牌');
  const t=room.teams[who.id];
  if(!t.awaitingEnd||t.cardActionDone||t.pendingChallenge||t.pendingTeleport||t.pendingExtraMove||t.pendingTarget||t.pendingDiscard||t.pendingRedraw||t.pendingReroll||room.pendingAuction||room.pendingMisfortuneChoice||room.pendingCardReaction)throw Error('当前不在使用手牌阶段');
  const index=t.hand.findIndex(c=>c.id===cardId);if(index<0)throw Error('这张牌不在手牌中');
  const card=t.hand[index];if(!canUse(t,card))throw Error('使用地点不匹配或金钱不足');
  if(card.effect_type.startsWith('challenge_battle_')&&!'ABC'.split('').some(id=>id!==t.id&&
    (room.teams[id].immuneFromRound==null||room.teams[id].immuneFromRound>t.round)))throw Error('当前没有可挑战的队伍');
  changeMoney(room,t,-card.cost,`${card.name}使用费用`);consumeCard(room,t,index);t.cardUsesThisRound++;
  const record=room.records.findLast(r=>r.team===t.id&&r.round===t.round);
  if(record){record.usedCard={id:card.sourceId,name:card.name,image:card.image,effect:card.effect,result:'待判定'};(record.usedCards??=[]).push(record.usedCard);}
  resolvePlayedCard(room,t,card,record);
  evaluateEnd(room);
}
function counterResponse(room,who,use,cardId){
  const pending=room.pendingCardReaction;
  if(!pending||typeof use!=='boolean'||pending.reactor)throw Error('当前没有待响应的卡牌');
  const responder=pending.responders[0];
  if(who.role!=='host'&&!(who.role==='team'&&who.id===responder))throw Error('只有当前响应队伍可以选择');
  if(use){
    if(who.role!=='team')throw Error('只有队伍可以使用反制牌');
    const t=room.teams[responder],index=t.hand.findIndex(c=>c.id===cardId&&c.effect_type==='counter_other_card');
    if(index<0||t.money<t.hand[index].cost||t.pendingChallenge)throw Error('当前不能使用反制牌');
    const card=t.hand[index];changeMoney(room,t,-card.cost,`${card.name}使用费用`);consumeCard(room,t,index);
    pending.reactor=responder;pending.responders=[];
    t.pendingChallenge={id:randomId(),card,round:t.round,debuffs:consumeDebuffs(t),reaction:true};
    note(room,`${responder} 队使用「${card.name}」反制 ${pending.sourceTeam} 队的「${pending.card.name}」，等待裁判判定`);
  }else{
    pending.responders.shift();note(room,`${responder} 队放弃反制「${pending.card.name}」`);
    if(!pending.responders.length){room.pendingCardReaction=null;const t=room.teams[pending.sourceTeam],record=room.records.find(r=>r.id===pending.recordId);resolvePlayedCard(room,t,pending.card,record);}
  }
  evaluateEnd(room);
}
function skipUse(room,who){
  if(who.role!=='team')throw Error('只有队伍可以选择');
  if(room.pendingCardReaction)throw Error('请先处理卡牌反制');
  const t=room.teams[who.id];
  if(t.pendingMisfortuneCard&&!t.pendingTarget){
    const pending=t.pendingMisfortuneCard,record=room.records.find(r=>r.id===pending.recordId);
    t.pendingMisfortuneCard=null;resolveMisfortuneVisits(room,t,record,pending.visits);
    t.cardActionDone=!(HOUSE.has(t.position)||t.hand.some(c=>canUse(t,c))||t.pendingEvent);
    if(t.cardActionDone)record.cardSkipped=true;
    note(room,`${t.id} 队不使用「厄运火杆」，正常结算厄运`);evaluateEnd(room);return;
  }
  if(!t.awaitingEnd||t.cardActionDone||t.pendingChallenge||t.pendingTeleport||t.pendingExtraMove||t.pendingTarget||t.pendingDiscard||t.pendingRedraw||t.pendingReroll||room.pendingAuction||room.pendingMisfortuneChoice)throw Error('当前不能跳过手牌');
  t.cardActionDone=true;note(room,`${t.id} 队本回合不使用手牌`);
  const record=room.records.findLast(r=>r.team===t.id&&r.round===t.round);if(record)record.cardSkipped=true;
  if(t.pendingEvent){t.pendingEvent=false;record.pendingEvent=false;resolveEvent(room,t,record);evaluateEnd(room);}
}
function resolveChallenge(room,who,teamId,success){
  if(who.role!=='host'||typeof success!=='boolean')throw Error('只有裁判可以判定挑战');
  const t=room.teams[teamId];if(!t?.pendingChallenge)throw Error('没有待判定的挑战');
  const card=t.pendingChallenge.card;t.pendingChallenge=null;
  if(card.effect_type==='counter_other_card'){
    const pending=room.pendingCardReaction;if(!pending||pending.reactor!==teamId)throw Error('反制目标已失效');
    const source=room.teams[pending.sourceTeam],sourceRecord=room.records.find(r=>r.id===pending.recordId);
    room.pendingCardReaction=null;
    if(success){changeScore(room,t,card.effectValue,card.name);if(sourceRecord?.usedCard)sourceRecord.usedCard.result='已抵消';finishCardUse(source);
      if(source.pendingEvent&&source.cardActionDone){source.pendingEvent=false;if(sourceRecord)sourceRecord.pendingEvent=false;resolveEvent(room,source,sourceRecord);}
    }else resolvePlayedCard(room,source,pending.card,sourceRecord);
    note(room,`${teamId} 队「${card.name}」挑战${success?'成功，抵消了':'失败，未抵消'} ${pending.sourceTeam} 队的「${pending.card.name}」`);
    evaluateEnd(room);return;
  }
  const record=room.records.findLast(r=>r.team===teamId&&r.round===t.round);
  if(record?.usedCard)record.usedCard.result=success?'成功':'失败';
  if(!success){finishCardUse(t);note(room,`${teamId} 队「${card.name}」挑战失败`);
    if(t.pendingEvent&&t.cardActionDone){t.pendingEvent=false;record.pendingEvent=false;resolveEvent(room,t,record);}
    evaluateEnd(room);return;}
  applyCardEffect(room,t,card,record);
  note(room,`${teamId} 队「${card.name}」挑战成功：${card.effect}`);
  if(t.pendingEvent&&t.cardActionDone){t.pendingEvent=false;record.pendingEvent=false;resolveEvent(room,t,record);}
  evaluateEnd(room);
}
function chooseCardTarget(room,who,targetId){
  if(who.role!=='team')throw Error('只有队伍可以指定目标');
  const t=room.teams[who.id],card=t.pendingTarget,target=room.teams[targetId];
  if(!card||!target||targetId===who.id||room.pendingAuction||room.pendingMisfortuneChoice)throw Error('当前不能指定该目标');
  if(card.effect_type==='transfer_income'){
    const paid=-changeMoney(room,target,-card.effectValue,card.name,t.round);
    changeMoney(room,t,paid,card.name);changeIncome(room,target,-card.effectAux,card.name,t.round);changeIncome(room,t,card.effectAux,card.name);
    note(room,`${t.id} 队对 ${targetId} 队使用「${card.name}」：转移 ${paid} 金钱，收入各变化 ${card.effectAux}`);
  }else if(card.effect_type==='redirect_misfortune'){
    const pending=t.pendingMisfortuneCard,record=room.records.find(r=>r.id===pending?.recordId);
    if(!pending||!record)throw Error('没有待转移的厄运');
    resolveMisfortuneVisits(room,t,record,pending.visits,target);
    t.pendingMisfortuneCard=null;
    note(room,`${t.id} 队使用「${card.name}」，将一次厄运转给 ${targetId} 队`);
  }else if(card.effect_type==='score_link_team'){
    t.linkedTeamId=targetId;
    note(room,`${t.id} 队与 ${targetId} 队建立了彼岸双生单向连接`);
  }else if(card.effect_type==='score_discard_other'){
    t.pendingDiscard=targetId;
    note(room,`${t.id} 队选择 ${targetId} 队的一张手牌丢弃`);
  }else if(card.effect_type==='teleport_other_team'){
    const node=teamPositionAtRound(room,target,t.round);
    setExtraPosition(room,t,node);
    note(room,`${t.id} 队瞬移到 ${targetId} 队本回合所在的 ${node}（不触发格子与战斗）`);
  }else if(card.effect_type.startsWith('challenge_battle_')){
    if(t.immuneFromRound!=null&&t.immuneFromRound<=t.round||target.immuneFromRound!=null&&target.immuneFromRound<=t.round)throw Error('EX time 队伍不能发起或参与新战斗');
    const record=room.records.findLast(r=>r.team===t.id&&r.round===t.round);
    if(!record)throw Error('本轮没有移动记录');
    let firstRecord=record,targetRecord=room.records.findLast(r=>r.team===targetId&&r.round===t.round);
    if(card.effect_type==='challenge_battle_low_hand_tax_refund'){
      const makeBattleRecord=(team,round)=>({id:randomId(),team:team.id,round,node:team.position,from:team.position,route:[],moneyDelta:0,card:null,forcedBattleOnly:true,time:Date.now()});
      firstRecord=makeBattleRecord(t,t.round);targetRecord=makeBattleRecord(target,target.round);
      room.records.push(firstRecord,targetRecord);
    }
    room.battles.push({id:randomId(),round:t.round,node:record.node,first:firstRecord.id,second:targetRecord?.id||null,
      targetTeam:targetId,forced:true,card:card.name,status:'待选人',startedAt:null,winner:null});
    activateBattles(room);
    note(room,`${t.id} 队用「${card.name}」向 ${targetId} 队发起第 ${t.round} 轮战斗`);
  }else throw Error(`尚不支持目标效果 ${card.effect_type}`);
  t.pendingTarget=null;finishCardUse(t);
  if(t.pendingEvent&&t.cardActionDone){
    const record=room.records.findLast(r=>r.team===t.id&&r.round===t.round);
    t.pendingEvent=false;record.pendingEvent=false;resolveEvent(room,t,record);
  }
  evaluateEnd(room);
}
function discardTargetCard(room,who,cardId){
  if(who.role!=='team')throw Error('只有队伍可以指定弃牌');
  const t=room.teams[who.id],target=room.teams[t.pendingDiscard];
  if(!target||room.pendingAuction||room.pendingMisfortuneChoice)throw Error('当前没有待弃牌的队伍');
  const index=target.hand.findIndex(c=>c.id===cardId);
  if(index<0)throw Error('这张牌不在目标队伍手牌中');
  const {card}=consumeCard(room,target,index);t.pendingDiscard=null;
  note(room,`${t.id} 队令 ${target.id} 队丢弃「${card.name}」并补牌`);
}
function redrawCard(room,who,cardId){
  if(who.role!=='team')throw Error('只有队伍可以换牌');
  const t=room.teams[who.id],index=t.hand.findIndex(c=>c.id===cardId);
  if(!t.pendingRedraw||index<0||room.pendingAuction||room.pendingMisfortuneChoice)throw Error('当前不能换牌');
  const {card}=consumeCard(room,t,index);t.pendingRedraw=false;finishCardUse(t);
  note(room,`${t.id} 队使用「six seven」弃掉「${card.name}」并重新抽牌`);
}
function resolveReroll(room,who,again){
  if(who.role!=='team'||typeof again!=='boolean')throw Error('只有队伍可以决定是否重掷');
  const t=room.teams[who.id],pending=t.pendingReroll;
  if(!pending||room.pendingAuction||room.pendingMisfortuneChoice)throw Error('当前不能决定重掷');
  const result=rollFanshi(room,t,pending.card.name,again?rollD6(room,t,`${pending.card.name}重掷`):pending.firstRoll);
  t.pendingReroll=null;finishCardUse(t);note(room,`${t.id} 队使用「${pending.card.name}」${again?'重掷后':'保留首掷'}得到 ${result.roll}，获得 ${result.prize} 金钱`);
}
function setExtraPosition(room,t,node){
  t.position=node;
  const record=room.records.findLast(r=>r.team===t.id&&r.round===t.round);
  if(record)record.finalPosition=node;
}
function teamPositionAtRound(room,t,round){
  const record=room.records.findLast(r=>r.team===t.id&&r.round<=round&&!r.forcedBattleOnly);
  if(record)return record.finalPosition||record.node;
  return t.round<=round?t.position:room.starts?.['ABC'.indexOf(t.id)]||t.position;
}
function teleport(room,who,node){
  if(who.role!=='team')throw Error('只有队伍可以传送');
  const t=room.teams[who.id];
  if(!t.pendingTeleport||!Object.hasOwn(GRAPH,node)||room.pendingAuction||room.pendingMisfortuneChoice)throw Error('当前不能传送到该节点');
  setExtraPosition(room,t,node);t.pendingTeleport=false;finishCardUse(t);
  note(room,`${t.id} 队传送到 ${node}（不触发格子与战斗）`);
}
function extraMove(room,who,cardId,route){
  if(who.role!=='team')throw Error('只有队伍可以额外移动');
  const t=room.teams[who.id],index=t.hand.findIndex(c=>c.id===cardId);
  if(!t.pendingExtraMove||index<0||room.pendingAuction||room.pendingMisfortuneChoice)throw Error('当前不能额外移动');
  const card=t.hand[index],steps=t.chooseNextSteps||card.move===7?t.pendingRoll?.cardId===cardId?t.pendingRoll.value:null:card.move;
  if(steps===null)throw Error('问号牌需要先掷骰');
  if(!Array.isArray(route)||route.length<1||route.length>steps)throw Error('额外移动步数不正确');
  const from=t.position;let node=from;for(const next of route){if(!(GRAPH[node]||[]).includes(next))throw Error('路线不符合地图方向');node=next;}
  if(route.length<steps&&!HOUSE.has(node))throw Error('只有进入房屋可以提前结束移动');
  chargeLoan(room,t);consumeCard(room,t,index);if(t.chooseNextSteps)t.chooseNextSteps=false;setExtraPosition(room,t,node);t.pendingExtraMove=false;finishCardUse(t);
  const record=room.records.findLast(r=>r.team===t.id&&r.round===t.round);
  if(record)(record.extraMoves??=[]).push({id:randomId(),team:t.id,from,route:[...route],time:Date.now()});
  note(room,`${t.id} 队额外移动至 ${node}（不触发格子与战斗）`);
}
function discardCard(room,who,cardId){
  if(who.role!=='team')throw Error('只有队伍可以弃牌');
  const t=room.teams[who.id],index=t.hand.findIndex(c=>c.id===cardId);
  if(!t.discardAbility||!t.awaitingEnd||!Object.hasOwn(GRAPH,t.position)||t.discardedRound===t.round||index<0||t.pendingChallenge||t.pendingTeleport||t.pendingExtraMove||t.pendingTarget||t.pendingReroll||room.pendingAuction||room.pendingMisfortuneChoice||t.hand.some(c=>canUse(t,c)))throw Error('当前不能使用机械帮手弃牌');
  consumeCard(room,t,index);t.discardedRound=t.round;note(room,`${t.id} 队使用机械帮手能力弃一张手牌并补牌`);
}
function performHouseEffect(room,t,house,reason=house){
  let detail;
  if(house==='Arcaea'){
    const cost=t.income+10;
    if(t.money<cost)throw Error(`需要 ${cost} 金钱`);
    changeMoney(room,t,-cost,reason);changeIncome(room,t,10,reason);
    detail=`支付 ${cost} 金钱，永久收入 +10`;
  }else if(house==='范式起源'){
    const roll=rollD6(room,t,reason),prize=[10,25,50,100,150,200][roll-1];
    changeMoney(room,t,prize,reason);detail=`掷出 ${roll}，获得 ${prize} 金钱`;
  }else{
    if(t.score<1)throw Error('至少需要 1 积分');
    changeScore(room,t,-1,reason);changeMoney(room,t,200,reason);detail='兑换 1 积分，获得 200 金钱';
  }
  t.lastHouse=house;return detail;
}
function houseAction(room,who){
  if(who.role!=='team')throw Error('只有队伍可以使用建筑效果');
  if(room.pendingCardReaction)throw Error('请先处理卡牌反制');
  const t=room.teams[who.id];
  if(!t.awaitingEnd||!t.cardActionDone||t.houseActionDone||!HOUSE.has(t.position)||room.pendingAuction||room.pendingMisfortuneChoice)throw Error('当前不能使用建筑效果');
  const house=t.position,record=room.records.findLast(r=>r.team===t.id&&r.round===t.round);
  const detail=performHouseEffect(room,t,house,`${house} 建筑效果`);
  t.houseActionDone=true;if(record)record.houseAction={house,detail};
  note(room,`${t.id} 队使用 ${house} 建筑效果：${detail}`);
  evaluateEnd(room);
}
function queueAuction(room,triggerTeam,card,round=room.teams[triggerTeam].round){
  room.auctionQueue.push({id:randomId(),card,triggerTeam,round,bids:{}});
  if(!room.pendingAuction)room.pendingAuction=room.auctionQueue.shift();
  note(room,`${triggerTeam} 队触发厄运「${card.name}」，等待三队出价`);
}
function applyMisfortune(room,t,card,sourceRound=t.round){
  switch(card.effect_type){
    case 'auction_lowest_score':queueAuction(room,t.id,card,sourceRound);return;
    case 'score':changeScore(room,t,card.effectValue,card.name,sourceRound);break;
    case 'half_money':for(const team of Object.values(room.teams))changeMoney(room,team,-Math.floor(team.money*card.effectValue/100),card.name,sourceRound);break;
    case 'debuff_eye':case 'debuff_offset':case 'debuff_mute':addDebuff(room,t,card);break;
    default:throw Error(`尚不支持厄运效果 ${card.effect_type}`);
  }
  note(room,`${t.id} 队承受厄运「${card.name}」：${card.effect}`);
}
function resolveMisfortuneVisits(room,t,record,visits,redirectTarget=null){
  let redirected=false;
  for(const visit of visits){
    if(t.misfortuneShield>0){t.misfortuneShield--;effectNotice(room,'misfortune',t.id,[]);note(room,`${t.id} 队抵消一次厄运`);continue;}
    if(redirectTarget&&!redirected){
      const card=drawPile(room,'misfortune');redirected=true;
      (record.misfortune??=[]).push({id:card.id,name:card.name,image:card.image,effect:card.effect,redirectedTo:redirectTarget.id});
      if(redirectTarget.misfortuneShield>0){redirectTarget.misfortuneShield--;effectNotice(room,'misfortune',redirectTarget.id,[]);note(room,`${redirectTarget.id} 队抵消了转移来的厄运`);}
      else{effectNotice(room,'misfortune',redirectTarget.id,[card]);applyMisfortune(room,redirectTarget,card,t.round);}
      continue;
    }
    const draws=visit.atEnd?[drawPile(room,'misfortune'),drawPile(room,'misfortune')]:[drawPile(room,'misfortune')];
    effectNotice(room,'misfortune',t.id,draws);
    (record.misfortune??=[]).push(...draws.map(c=>({id:c.id,name:c.name,image:c.image,effect:c.effect})));
    if(visit.atEnd){
      room.pendingMisfortuneChoice={triggerTeam:t.id,target:null,cards:draws};
      note(room,`${t.id} 队停在厄运 B，抽两张厄运并指定一队选牌`);
    }else applyMisfortune(room,t,draws[0]);
  }
}
function applyEvent(room,t,card,record){
  switch(card.effect_type){
    case 'money':record.event.moneyDelta=changeMoney(room,t,card.effectValue,card.name);break;
    case 'score':changeScore(room,t,card.effectValue,card.name);break;
    case 'debuff_shield':if(t.debuffs.length)t.debuffs.pop();else t.debuffShield+=card.effectValue;break;
    case 'lowest_score':{
      const lowest=Math.min(...Object.values(room.teams).map(x=>x.score));
      for(const team of Object.values(room.teams))if(team.score===lowest)changeScore(room,team,card.effectValue,card.name,t.round);
      break;
    }
    case 'fanshi_roll':{
      const {roll,prize}=rollFanshi(room,t,card.name);record.event.detail=`掷出 ${roll}，获得 ${prize} 金钱`;break;
    }
    case 'battle_debuff':if(t.debuffShield>0)t.debuffShield--;else t.nextBattleDebuff+=card.effectValue;break;
    case 'income_battle_modifier':changeIncome(room,t,-10,card.name);t.nextBattleModifier+=card.effectValue;break;
    case 'random_teleport':{
      const destinations=Object.keys(GRAPH).filter(node=>node!==t.position);
      const destination=destinations[room.randomInt(destinations.length)];
      setExtraPosition(room,t,destination);
      record.event.detail=`随机移动到 ${destination}（不触发格子与战斗）`;
      break;
    }
    default:throw Error(`尚不支持事件效果 ${card.effect_type}`);
  }
  note(room,`${t.id} 队触发事件「${card.name}」：${record.event.detail||card.effect}`);
}
function resolveEvent(room,t,record){
  if(t.eventShield>0){t.eventShield--;record.event={id:'cancelled',name:'事件已抵消',image:null};effectNotice(room,'event',t.id,[]);note(room,`${t.id} 队抵消了事件格效果`);return;}
  const events=Array.from({length:t.doubleEvent?2:1},()=>drawPile(room,'event'));
  record.events=events.map(event=>({id:event.id,name:event.name,image:event.image,effect:event.effect}));
  record.event=record.events[0];effectNotice(room,'event',t.id,events);
  for(const event of events)applyEvent(room,t,event,record);
}
function eligibleMembers(room,t){
  const group=Math.floor((t.round-1)/3);
  const used=new Set(room.records.filter(r=>r.team===t.id&&Math.floor((r.round-1)/3)===group&&r.defender).map(r=>String(r.defender.id)));
  const unused=t.members.filter(member=>!used.has(String(member.id)));
  return unused.length?unused:t.members;
}
function battleMembers(room,b){return [b.first,b.second].map(id=>room.records.find(r=>r.id===id)?.defender).filter(Boolean);}
function activateBattles(room){
  for(const b of room.battles){
    if(b.status!=='待选人'&&b.status!=='待战')continue;
    if(b.forced&&!b.second)b.second=room.records.findLast(r=>r.team===b.targetTeam&&r.round===b.round)?.id||null;
    const records=[b.first,b.second].map(id=>room.records.find(r=>r.id===id));
    if(b.forced)for(const record of records){
      if(!record||record.defender)continue;
      const team=room.teams[record.team];
      if(team.members.length&&!record.forcedBattleOnly&&(HOUSE.has(record.node)||!team.awaitingEnd)){
        const member=eligibleMembers(room,team)[0];
        record.defender={id:member.id,account:member.account,avatar:member.avatar||null};
        note(room,`${team.id} 队由 ${member.account} 迎战「${b.card}」`);
      }
    }
    if(records.some(r=>!r))continue;
    if(b.forced&&records.some(r=>!room.teams[r.team].members.length)){
      b.status='待结算';b.startedAt=Date.now();b.freeSong={};for(const r of records){const team=room.teams[r.team];if(team.freeSongBattle>0){team.freeSongBattle--;b.freeSong[r.team]=true;}}note(room,`第 ${b.round} 轮「${b.card}」战斗开始`);continue;
    }
    if(records.some(r=>!r?.defender))continue;
    const busy=new Set(room.battles.filter(other=>other.status==='待结算').flatMap(other=>battleMembers(room,other).map(m=>String(m.id))));
    const queuedBefore=room.battles.some(other=>other!==b&&other.status==='待战'&&room.battles.indexOf(other)<room.battles.indexOf(b)&&battleMembers(room,other).some(m=>records.some(r=>String(r.defender.id)===String(m.id))));
    if(records.some(r=>busy.has(String(r.defender.id)))||queuedBefore){b.status='待战';continue;}
    b.status='待结算';b.startedAt=Date.now();b.freeSong={};for(const r of records){const team=room.teams[r.team];if(team.freeSongBattle>0){team.freeSongBattle--;b.freeSong[r.team]=true;}}note(room,`第 ${b.round} 轮 ${b.node} 战斗开始：${records.map(r=>`${r.team} 队 ${r.defender.account}`).join(' 对 ')}`);
  }
}
function reserveMember(room,who,memberId){
  if(who.role!=='team')throw Error('只有队伍可以预定出战人');
  const t=room.teams[who.id],forced=room.battles.find(b=>b.forced&&b.status==='待选人'&&[b.first,b.second].some(id=>room.records.some(r=>r.id===id&&r.team===t.id&&!r.defender)));
  const record=forced?room.records.find(r=>[forced.first,forced.second].includes(r.id)&&r.team===t.id):room.records.findLast(r=>r.team===t.id&&r.round===t.round);
  if(!record||(!t.awaitingEnd&&!record.forcedBattleOnly)||HOUSE.has(record.node)&&!room.battles.some(b=>b.forced&&[b.first,b.second].includes(record.id)))throw Error('当前不能预定出战人');
  if(record.defender)throw Error('本轮已预定出战人');
  const member=eligibleMembers(room,t).find(m=>String(m.id)===String(memberId));
  if(!member)throw Error('本组三轮仍有未留守的队员，请先选择他们');
  record.defender={id:member.id,account:member.account,avatar:member.avatar||null};
  note(room,`${t.id} 队第 ${t.round} 轮预定 ${member.account} 留守 ${record.node}`);
  activateBattles(room);
}
function misfortuneTarget(room,who,target){
  const choice=room.pendingMisfortuneChoice;
  if(!choice||who.role!=='team'||who.id!==choice.triggerTeam)throw Error('当前不能指定厄运选牌队伍');
  if(choice.target)throw Error('已指定选牌队伍');
  if(!'ABC'.includes(target)||target===who.id)throw Error('请选择另一支队伍');
  choice.target=target;note(room,`${who.id} 队指定 ${target} 队选择厄运`);
}
function misfortunePick(room,who,index){
  const choice=room.pendingMisfortuneChoice;
  if(!choice||who.role!=='team'||who.id!==choice.target)throw Error('当前不能选择厄运');
  if(!Number.isInteger(index)||index<0||index>=choice.cards.length)throw Error('厄运选项无效');
  const card=choice.cards[index];room.pendingMisfortuneChoice=null;
  note(room,`${who.id} 队为 ${choice.triggerTeam} 队选中厄运「${card.name}」`);
  const record=room.records.findLast(r=>r.team===choice.triggerTeam&&r.node==='B');
  if(record)record.selectedMisfortune={id:card.id,name:card.name,image:card.image,effect:card.effect};
  applyMisfortune(room,room.teams[choice.triggerTeam],card);
  evaluateEnd(room);
}
function bid(room,who,amount){
  if(who.role!=='team'||!room.pendingAuction)throw Error('当前没有可参与的竞标');
  const t=room.teams[who.id];
  if(room.pendingAuction.bids[who.id]!==undefined)throw Error('本队已经出价');
  if(!Number.isSafeInteger(amount)||amount<0||amount>t.money)throw Error('出价必须是余额内的非负整数');
  room.pendingAuction.bids[who.id]=amount;note(room,`${who.id} 队已提交竞标`);
  if('ABC'.split('').every(id=>room.pendingAuction.bids[id]!==undefined)){
    const bids=room.pendingAuction.bids,min=Math.min(...Object.values(bids));
    for(const id of 'ABC')changeMoney(room,room.teams[id],-bids[id],'社长造访竞标',room.pendingAuction.round);
    const losers='ABC'.split('').filter(id=>bids[id]===min);
    for(const id of losers)changeScore(room,room.teams[id],-2,'社长造访竞标',room.pendingAuction.round);
    note(room,`社长造访竞标结束：${'ABC'.split('').map(id=>`${id} ${bids[id]}`).join('、')}；最低出价 ${losers.join('、')} 队各 −2 分`);
    room.pendingAuction=room.auctionQueue.shift()||null;
    evaluateEnd(room);
  }
}
function move(room,who,cardId,route) {
  if (who.role!=='team') throw Error('只有队伍可以移动');
  if(room.pendingCardReaction)throw Error('请先处理卡牌反制');
  if(room.pendingAuction||room.pendingMisfortuneChoice)throw Error('请先完成厄运结算');
  const t=room.teams[who.id], idx=t.hand.findIndex(c=>c.id===cardId);
  if(t.awaitingEnd)throw Error('请先结束当前回合');
  if(idx<0) throw Error('这张牌不在手牌中');
  const card=t.hand[idx];
  const steps=t.chooseNextSteps||card.move===7?t.pendingRoll?.cardId===cardId?t.pendingRoll.value:null:card.move;
  if(steps===null)throw Error('问号牌需要先掷骰');
  if(!Array.isArray(route)||route.length<1||route.length>steps) throw Error('移动步数不正确');
  let node=t.position;
  for(const next of route) {if(!(GRAPH[node]||[]).includes(next)) throw Error('路线不符合地图方向');node=next;}
  if(route.length<steps&&!HOUSE.has(node)) throw Error('只有进入房屋可以提前结束移动');
  const round=t.round,from=t.position;
  const moneyBefore=t.money,moneyEffects=[];
  chargeLoan(room,t);
  if(card.effect_type==='score_move_fee'||card.effect_type==='teleport_move_fee_tax'){
    moneyEffects.push({node:from,amount:changeMoney(room,t,-card.effectAux,`${card.name}移动费用`)});
  }
  for(const [i,step] of route.entries()){
    const type=NODE_TYPES[step],end=i===route.length-1;
    if(HOUSE.has(step))t.lastHouse=step;
    const amount=type==='收入格'?t.income*(end?2:1):type==='收税格'?-10*(end?2:1):0;
    if(amount)moneyEffects.push({node:step,amount:changeMoney(room,t,amount,type)});
    if(step==='Arcaea'&&t.arcaeaVisitIncome)changeMoney(room,t,t.income,'颁奖典礼造访 Arcaea');
    if(step==='范式起源'&&t.fanshiVisitMoney)changeMoney(room,t,t.fanshiVisitMoney,'萨满的魔杖造访范式起源');
  }
  const {shuffled}=consumeCard(room,t,idx);if(t.chooseNextSteps)t.chooseNextSteps=false;
  if(card.effect_type==='score_skip_if_moved')t.skipNextTurn=true;
  t.position=node;t.lastArrival=Date.now();t.awaitingEnd=true;t.cardUsesThisRound=0;t.extraCardUsesThisRound=0;t.pendingEvent=false;
  t.cardActionDone=!(HOUSE.has(node)||t.hand.some(c=>canUse(t,c)));
  const record={id:randomId(),round,team:t.id,from,route:[...route],node,time:t.lastArrival,
    order:room.records.length+1,moneyDelta:t.money-moneyBefore,moneyEffects,
    card:{id:card.sourceId,name:card.name,image:card.image,steps},usedCard:null,cardSkipped:t.cardActionDone};
  room.records.push(record);
  const misfortuneVisits=route.flatMap((step,i)=>step==='B'?[{atEnd:i===route.length-1}]:[]);
  if(misfortuneVisits.length>t.misfortuneShield&&t.hand.some(c=>['redirect_misfortune','clear_debuff_draw_buff'].includes(c.effect_type)&&t.money>=c.cost)){
    t.pendingMisfortuneCard={recordId:record.id,visits:misfortuneVisits};t.cardActionDone=false;record.cardSkipped=false;
    note(room,`${t.id} 队经过厄运 B，可使用「厄运火杆」转移一次厄运`);
  }else resolveMisfortuneVisits(room,t,record,misfortuneVisits);
  activateBattles(room);
  if(!HOUSE.has(node)) {
    const prior=room.records.find(r=>r.id!==record.id&&r.round===round&&r.node===node);
    if(prior&&!prior.defenderUnavailable && !(room.teams[prior.team].immuneFromRound!=null&&room.teams[prior.team].immuneFromRound<=round) && !(t.immuneFromRound!=null&&t.immuneFromRound<=round) && !room.battles.some(b=>b.round===round&&
      (!b.forced&&b.node===node||b.forced&&b.targetTeam===t.id||b.forced&&[b.first,b.second].includes(prior.id)&&[b.first,b.second].includes(record.id)))) {
      const status=t.members.length&&room.teams[prior.team].members.length?'待选人':'待结算';
      room.battles.push({id:randomId(),round,node,first:prior.id,second:record.id,status,startedAt:status==='待结算'?Date.now():null,winner:null});
      activateBattles(room);
    }
  }
  if(NODE_TYPES[node]==='事件格'){
    if(!t.eventShield&&t.hand.some(c=>(c.effect_type==='event_cancel_random'||c.game_type==='event')&&t.money>=c.cost)){
      t.pendingEvent=true;t.cardActionDone=false;record.pendingEvent=true;record.cardSkipped=false;
      note(room,`${t.id} 队到达事件格，可使用「装腔作势」抵消本次事件`);
    }else resolveEvent(room,t,record);
  }
  note(room,`${t.id} 队第 ${round} 轮：${steps} 步，${route.join(' → ')}；格子金钱 ${record.moneyDelta>=0?'+':''}${record.moneyDelta}${shuffled?'；弃牌洗回牌库':''}`);
  evaluateEnd(room);
  return record;
}
function endTurn(room,who){
  if(who.role!=='team')throw Error('只有队伍可以结束回合');
  if(room.pendingCardReaction)throw Error('请先处理卡牌反制');
  const t=room.teams[who.id];
  if(!t.awaitingEnd)throw Error('请先完成本回合移动');
  if(room.pendingAuction||room.pendingMisfortuneChoice)throw Error('请先完成厄运结算');
  if(!t.cardActionDone||t.pendingChallenge||t.pendingTeleport||t.pendingExtraMove||t.pendingTarget||t.pendingDiscard||t.pendingRedraw||t.pendingReroll||t.pendingMisfortuneCard)throw Error('请先使用手牌或选择不使用');
  const record=room.records.findLast(r=>r.team===t.id&&r.round===t.round);
  if(t.members.length&&record&&!HOUSE.has(record.node)&&!record.defender)throw Error('请先选择一名队员留守');
  const finished=t.round,skipped=t.skipNextTurn;
  t.round+=skipped?2:1;t.awaitingEnd=false;t.pendingRoll=null;t.houseActionDone=false;t.skipNextTurn=false;t.extraCardUsesThisRound=0;
  note(room,`${t.id} 队结束第 ${finished} 回合，${skipped?`跳过第 ${finished+1} 回合，`:''}进入第 ${t.round} 回合`);
  evaluateEnd(room);
}
function forceEndTurn(room,who,id){
  if(who.role!=='host')throw Error('只有裁判可以强制结束回合');
  const t=room.teams[id];
  if(!t)throw Error('队伍无效');
  const finished=t.round;
  const record=room.records.findLast(r=>r.team===id&&r.round===finished);
  if(record)record.pendingEvent=false;
  t.round++;t.awaitingEnd=false;t.cardActionDone=false;t.houseActionDone=false;
  t.pendingRoll=null;t.pendingChallenge=null;t.pendingTeleport=false;t.pendingExtraMove=false;
  t.pendingTarget=null;t.pendingDiscard=null;t.pendingRedraw=false;t.pendingReroll=null;t.pendingMisfortuneCard=null;t.pendingEvent=false;
  t.skipNextTurn=false;t.extraCardUsesThisRound=0;t.cardUsesThisRound=0;
  if(room.pendingMisfortuneChoice?.triggerTeam===id||room.pendingMisfortuneChoice?.target===id)room.pendingMisfortuneChoice=null;
  if(room.pendingAuction?.triggerTeam===id)room.pendingAuction=room.auctionQueue.shift()||null;
  room.auctionQueue=room.auctionQueue.filter(a=>a.triggerTeam!==id);
  const reaction=room.pendingCardReaction;
  if(reaction&&(reaction.sourceTeam===id||reaction.reactor===id||reaction.responders.includes(id)))room.pendingCardReaction=null;
  note(room,`裁判强制结束 ${id} 队第 ${finished} 回合，进入第 ${t.round} 回合`);
  evaluateEnd(room);
}
function money(room,who,id,value){
  if(who.role!=='host')throw Error('只有裁判可以调整金钱');
  const t=room.teams[id];
  if(!t||![100,-100].includes(value))throw Error('金钱调整无效');
  const amount=changeMoney(room,t,value,'裁判调整金钱');
  note(room,`裁判调整 ${id} 队金钱 ${amount>=0?'+':''}${amount}，现为 ${t.money}`);
}
function score(room,who,id,value) {
  if(who.role!=='host') throw Error('只有裁判可以调整分数');
  if(!room.teams[id]||!Number.isInteger(value)||Math.abs(value)>20) throw Error('分数调整无效');
  const t=room.teams[id];changeScore(room,t,value,'裁判调分');note(room,`${id} 队积分 ${value>=0?'+':''}${value}，现为 ${t.score}`);
  evaluateEnd(room);
}
function battle(room,who,battleId,winner) {
  if(who.role!=='host') throw Error('只有裁判可以结算战斗');
  const b=room.battles.find(x=>x.id===battleId);
  if(!b||b.status!=='待结算') throw Error('战斗不可结算');
  const first=room.records.find(r=>r.id===b.first).team,second=room.records.find(r=>r.id===b.second).team;
  if(winner!==first&&winner!==second) throw Error('胜者必须是参战队伍');
  const loser=winner===first?second:first;
  const winTeam=room.teams[winner],loseTeam=room.teams[loser];
  const rescued=loseTeam.battleRescue>0;
  const winPoints=2+winTeam.nextBattleModifier+winTeam.nextBattleWinBonus+winTeam.nextBattleDebuff,losePoints=(rescued?0:-2)+loseTeam.nextBattleModifier+loseTeam.nextBattleDebuff;
  changeScore(room,winTeam,winPoints,'战斗结算',b.round);changeScore(room,loseTeam,losePoints,'战斗结算',b.round);
  if(rescued){loseTeam.battleRescue--;changeMoney(room,loseTeam,30,'复活吧我的爱人',b.round);b.rescued=true;}
  if(loseTeam.linkedTeamId===winner){changeScore(room,winTeam,-4,'彼岸双生',b.round);b.linkedPenalty=-4;}
  winTeam.linkedTeamId=null;loseTeam.linkedTeamId=null;
  b.debuffs={[winner]:consumeDebuffs(winTeam),[loser]:consumeDebuffs(loseTeam)};
  winTeam.nextBattleModifier=0;loseTeam.nextBattleModifier=0;winTeam.nextBattleDebuff=0;loseTeam.nextBattleDebuff=0;winTeam.nextBattleWinBonus=0;loseTeam.nextBattleWinBonus=0;
  b.status='已结算';b.winner=winner;note(room,`第 ${b.round} 轮 ${b.node} 战斗：${winner} 胜，${winPoints>=0?'+':''}${winPoints} 分；${loser} 负，${losePoints>=0?'+':''}${losePoints} 分`);
  activateBattles(room);
  evaluateEnd(room);
}
module.exports={GRAPH,POS,HAND,hydrate,createRoom,reset,join,viewer,state,roll,useCard,counterResponse,skipUse,resolveChallenge,chooseCardTarget,discardTargetCard,redrawCard,resolveReroll,teleport,extraMove,discardCard,houseAction,bid,misfortuneTarget,misfortunePick,move,reserveMember,endTurn,forceEndTurn,money,score,battle,evaluateEnd,finishByScores,eligibleMembers,canUse};
