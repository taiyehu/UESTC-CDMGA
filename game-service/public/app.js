const params=new URLSearchParams(location.search),roomCode=params.get('room');
let session=params.has('tutorial')?{tutorial:true}:/^[A-F0-9]{8}$/.test(roomCode||'')?{code:roomCode}:null;
let snapshot=null,selected=null,pendingRoute=null,moving=false,seenRecords=null,introTimer=null;
let preview=null,detailPreview=null,pileView=null,pileScrollTop=0,moveKind='normal',seenEffects=null,seenMoney=null,seenIncome=null,seenExtra=null,seenFlows=null,effectQueue=[],effectActive=false,effectTimer=null;
let resourceQueue=[],resourceActive=false,resourceTimer=null,ghostRevealTeam=null,replayTimer=null,replayBusy=false,liveOtherQueue=[],liveOtherBusy=false;
let seenBattles=null,battleQueue=[],battleActive=false,battleTimer=null;
let seenExTime=null,exTimeQueue=[],exTimeActive=false,exTimeTimer=null;
let seenDice=null,diceQueue=[],diceActive=false,diceTimer=null,diceInterval=null;
let cardFlowQueue=[],cardFlowBusy=false,cardFlowEpoch=0;const drawingCardIds=new Set();
let bidDraft='0',bidAuctionId=null;
let misfortuneDraftId=null,swapSourceId=null,swapOwnId=null,passCardIds=new Set();
let mapZoom=1;
const MAP_BOUNDS={x:-3350,y:-1800,width:7500,height:5000};
const mapPercent=([x,y])=>[(x-MAP_BOUNDS.x)/MAP_BOUNDS.width*100,(y-MAP_BOUNDS.y)/MAP_BOUNDS.height*100];
const animations={},animationTimers={};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=n=>new Date(n).toLocaleTimeString('zh-CN',{hour12:false});
const diceFaceUrls=Array.from({length:6},(_,i)=>`/game-client/dice/${i+1}.svg`);
for(const src of diceFaceUrls){const preload=new Image();preload.src=src;}
const cardUsable=(t,c)=>{
  if(t.money<c.cost)return false;
  if(t.pendingMisfortuneCard)return c.effect_type==='redirect_misfortune'||c.effect_type==='clear_debuff_draw_buff';
  if(c.effect_type==='event_cancel_random')return t.pendingEvent;
  if(c.effect_type==='counter_other_card')return false;
  if(c.effect_type==='money_extra_use')return snapshot.nodeTypes[t.position]==='事件格';
  if(c.game_type==='all')return true;
  if(c.game_type==='event')return snapshot.nodeTypes[t.position]==='事件格';
  if(c.game_type==='koushui')return snapshot.nodeTypes[t.position]==='收税格'&&
    (!c.effect_type.startsWith('challenge_battle_')||!t.exTime&&'ABC'.split('').some(id=>id!==snapshot.teamId&&!snapshot.teams[id].exTime))&&
    (c.effect_type!=='challenge_battle_low_hand_tax_refund'||t.hand.every(card=>card.move<=3));
  if(c.game_type==='mis')return snapshot.nodeTypes[t.position]==='厄运格';
  return snapshot.house.includes(t.position)&&(c.game_type==='random'||(c.game_type==='fanshi'?'范式起源':c.game_type)===t.position);
};
const avatar=(member,label)=>member?.avatar?`<img src="${esc(member.avatar)}" alt="${esc(label)}头像">`:`<span class="avatarFallback" aria-label="${esc(label)}头像">${esc((member?.account||label||'?').slice(0,1))}</span>`;
async function api(method,path,data){
  const r=await fetch('/game-api'+path,{method,credentials:'same-origin',headers:{'content-type':'application/json'},body:data?JSON.stringify(data):undefined});
  const j=await r.json();if(!r.ok)throw Error(j.error||'请求失败');return j;
}
function fail(e){alert(e.message||String(e));}
function save(){}
function showLobby(error=''){document.body.classList.remove('playing');$('battleModal').classList.remove('show');$('handHelp').classList.remove('show');$('defenderModal').classList.remove('show');$('lobby').hidden=false;$('game').hidden=true;$('lobbyError').textContent=error;}
function showGame(){const opening=$('game').hidden;document.body.classList.add('playing');document.body.classList.toggle('tutorial',!!snapshot.tutorial);document.body.dataset.gameView||='map';$('lobby').hidden=true;$('game').hidden=false;$('roomLabel').textContent=session.tutorial?'新手教程':`房间 ${session.code} · ${snapshot.role==='host'?'裁判':snapshot.teamId+' 队'}${snapshot.canAct?'':' · 观战'}`;renderTutorial();if(opening)requestAnimationFrame(fitMap);}
function fitMap(){
  const viewport=document.querySelector('.mapViewport'),map=viewport.querySelector('.mapWrap');
  const availableWidth=viewport.clientWidth,availableHeight=viewport.clientHeight;
  if(!availableWidth||!availableHeight)return;
  const mobile=matchMedia('(max-width:700px), (max-width:950px) and (max-height:520px)').matches;
  const width=Math.floor(mobile?availableWidth*mapZoom:Math.min(availableWidth,availableHeight*MAP_BOUNDS.width/MAP_BOUNDS.height));
  map.style.width=width+'px';map.style.height=Math.floor(width*MAP_BOUNDS.height/MAP_BOUNDS.width)+'px';
}
function setGameView(view){
  document.body.dataset.gameView=view;
  document.querySelectorAll('[data-game-view]').forEach(button=>button.setAttribute('aria-current',button.dataset.gameView===view?'page':'false'));
  requestAnimationFrame(fitMap);
}
function changeMapZoom(next){
  const viewport=document.querySelector('.mapViewport');
  const x=(viewport.scrollLeft+viewport.clientWidth/2)/Math.max(1,viewport.scrollWidth);
  const y=(viewport.scrollTop+viewport.clientHeight/2)/Math.max(1,viewport.scrollHeight);
  mapZoom=Math.max(1,Math.min(2.5,next));fitMap();
  viewport.scrollLeft=x*viewport.scrollWidth-viewport.clientWidth/2;
  viewport.scrollTop=y*viewport.scrollHeight-viewport.clientHeight/2;
}
async function refresh(){
  if(!session)return;
  try {const next=await api('GET',session.tutorial?'/tutorial':`/rooms/${session.code}`);if(!snapshot||snapshot.version!==next.version||snapshot.tutorial?.scene!==next.tutorial?.scene)ingest(next); $('sync').textContent='已同步 '+time(Date.now());}
  catch(e){session=null;showLobby(e.message);}
}
function ingest(next){
  if(snapshot&&snapshot.resetCount!==next.resetCount){
    selected=null;pendingRoute=null;preview=null;detailPreview=null;pileView=null;pileScrollTop=0;moving=false;seenRecords=null;seenEffects=null;seenMoney=null;seenIncome=null;seenExtra=null;seenFlows=null;effectQueue=[];resourceQueue=[];cardFlowQueue=[];cardFlowEpoch++;cardFlowBusy=false;drawingCardIds.clear();$('cardMotion').innerHTML='';$('pileNotice').classList.remove('show');
    if(effectTimer)clearTimeout(effectTimer);effectTimer=null;
    if(resourceTimer)clearTimeout(resourceTimer);resourceTimer=null;resourceActive=false;document.querySelectorAll('.resourceDelta').forEach(el=>el.remove());
    if(battleTimer)clearTimeout(battleTimer);battleTimer=null;battleActive=false;battleQueue=[];seenBattles=null;$('battleIntro').classList.remove('show');
    if(exTimeTimer)clearTimeout(exTimeTimer);exTimeTimer=null;exTimeActive=false;exTimeQueue=[];seenExTime=null;$('exTimeIntro').classList.remove('show');
    if(diceTimer)clearTimeout(diceTimer);if(diceInterval)clearInterval(diceInterval);diceTimer=null;diceInterval=null;diceActive=false;diceQueue=[];seenDice=null;$('diceIntro').classList.remove('show');
    if(replayTimer)clearTimeout(replayTimer);replayTimer=null;ghostRevealTeam=null;replayBusy=false;liveOtherQueue=[];liveOtherBusy=false;
    $('effectIntro').classList.remove('show');effectActive=false;
    for(const id of 'ABC'){if(animationTimers[id])clearTimeout(animationTimers[id]);delete animationTimers[id];delete animations[id];}
  }
  let freshEffects=[],freshResources=[],freshFlows=[],freshBattles=[],freshExTime=[],freshDice=[];
  if(seenEffects===null)seenEffects=new Set(next.effects.map(e=>e.id));
  else for(const event of next.effects)if(!seenEffects.has(event.id)){seenEffects.add(event.id);freshEffects.push(event);}
  if(seenMoney===null)seenMoney=new Set(next.moneyChanges.map(e=>e.id));
  else for(const change of next.moneyChanges)if(!seenMoney.has(change.id)){seenMoney.add(change.id);freshResources.push({...change,kind:'金钱'});}
  if(seenIncome===null)seenIncome=new Set(next.incomeChanges.map(e=>e.id));
  else for(const change of next.incomeChanges)if(!seenIncome.has(change.id)){seenIncome.add(change.id);freshResources.push({...change,kind:'收入'});}
  freshResources.sort((a,b)=>a.time-b.time);
  if(seenFlows===null)seenFlows=new Set(next.cardFlows.map(e=>e.id));
  else for(const flow of next.cardFlows)if(!seenFlows.has(flow.id)){seenFlows.add(flow.id);if(next.role==='team')freshFlows.push(flow);}
  if(seenExTime===null)seenExTime=new Set((next.exTimeEvents||[]).map(e=>e.id));
  else for(const event of next.exTimeEvents||[])if(!seenExTime.has(event.id)){seenExTime.add(event.id);freshExTime.push(event);}
  if(seenDice===null)seenDice=new Set((next.diceRolls||[]).map(e=>e.id));
  else for(const roll of next.diceRolls||[])if(!seenDice.has(roll.id)){seenDice.add(roll.id);freshDice.push(roll);}
  if(seenBattles===null)seenBattles=new Map(next.battles.map(b=>[b.id,b.startedAt||b.status]));
  else for(const battle of next.battles)if(seenBattles.get(battle.id)!==(battle.startedAt||battle.status)){
    seenBattles.set(battle.id,battle.startedAt||battle.status);
    const participants=[battle.first,battle.second].map(id=>next.records.find(r=>r.id===id)?.team);
    if(battle.startedAt||battle.status==='待结算')freshBattles.push({...battle,participants});
  }
  const oldCardRects=Object.fromEntries(freshFlows.map(flow=>[flow.id,rectOf(document.querySelector(`[data-card="${flow.spent.id}"]`))]));
  for(const flow of freshFlows)drawingCardIds.add(flow.drawn.id);
  const introKey=next.role==='team'?`roundIntro:${next.code}:${next.teamId}:${next.resetCount}`:null;
  const introRound=next.role==='team'?next.teams[next.teamId].round:null;
  const newRound=introKey&&sessionStorage.getItem(introKey)!==String(introRound);
  if(newRound)prepareRoundReplay(next,introRound);
  if(seenRecords===null)seenRecords=new Set(next.records.map(r=>r.id));
  else for(const record of next.records){if(!seenRecords.has(record.id)){seenRecords.add(record.id);if(!newRound&&Date.now()-record.time<5000&&record.route){if(next.role==='team'&&record.team!==next.teamId&&record.round===introRound)queueOtherAnimation(record);else animate(record);}}}
  const extras=next.records.flatMap(r=>(r.extraMoves||[]).map(e=>({...e,round:r.round})));
  if(seenExtra===null)seenExtra=new Set(extras.map(e=>e.id));
  else for(const extra of extras)if(!seenExtra.has(extra.id)){seenExtra.add(extra.id);if(Date.now()-extra.time<5000){if(next.role==='team'&&extra.team!==next.teamId&&extra.round===introRound)queueOtherAnimation(extra);else animate(extra);}}
  snapshot=next;render();
  cardFlowQueue.push(...freshFlows.map(flow=>({flow,from:oldCardRects[flow.id]})));
  effectQueue.push(...freshEffects);resourceQueue.push(...freshResources);battleQueue.push(...freshBattles);exTimeQueue.push(...freshExTime);diceQueue.push(...freshDice);
  if(newRound){sessionStorage.setItem(introKey,String(introRound));showRoundIntro(introRound,next.records.filter(r=>r.round===introRound&&r.team!==next.teamId).sort((a,b)=>a.order-b.order));}
  showNextDice();showNextExTime();showNextEffect();showNextResource();showNextBattle();playNextCardFlow();
}
function showNextDice(){
  if(diceActive||exTimeActive||battleActive||effectActive||resourceActive||$('roundIntro').classList.contains('show')||!diceQueue.length)return;
  diceActive=true;const roll=diceQueue.shift(),el=$('diceIntro');
  el.innerHTML=`<div class="diceStage"><small>${esc(roll.team)} 队 · ${esc(roll.reason)}</small><div class="die"><img src="${diceFaceUrls[0]}" alt="掷骰中"></div><strong>掷骰中…</strong></div>`;
  el.classList.add('show');
  const stage=el.querySelector('.diceStage'),face=el.querySelector('.die img');
  const settle=()=>{clearInterval(diceInterval);diceInterval=null;face.src=diceFaceUrls[roll.value-1];face.alt=`骰子 ${roll.value} 点`;stage.classList.add('settled');stage.querySelector('strong').textContent=`${roll.value} 点`;diceTimer=setTimeout(()=>{el.classList.remove('show');diceActive=false;diceTimer=null;showNextDice();showNextExTime();showNextEffect();showNextResource();showNextBattle();playNextCardFlow();},950);};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){settle();return;}
  let faceNumber=1;diceInterval=setInterval(()=>{faceNumber=faceNumber%6+1;face.src=diceFaceUrls[faceNumber-1];},90);
  diceTimer=setTimeout(settle,1100);
}
function showNextExTime(){
  if(exTimeActive||diceActive||battleActive||resourceActive||effectActive||$('roundIntro').classList.contains('show')||!exTimeQueue.length)return;
  exTimeActive=true;const event=exTimeQueue.shift(),el=$('exTimeIntro');
  el.innerHTML=`<div class="exTimeStage"><small>${esc(event.team)} 队 · 第 ${event.round} 回合</small><strong>EX time</strong><span>首次达到 20 分 · 进入免战阶段</span></div>`;
  el.classList.add('show');
  exTimeTimer=setTimeout(()=>{el.classList.remove('show');exTimeActive=false;exTimeTimer=null;showNextDice();showNextExTime();showNextEffect();showNextResource();showNextBattle();playNextCardFlow();},2600);
}
function showNextEffect(){
  if(effectActive||battleActive||resourceActive||exTimeActive||diceActive||$('roundIntro').classList.contains('show')||!effectQueue.length)return;
  effectActive=true;const e=effectQueue.shift(),el=$('effectIntro');
  el.innerHTML=`<div class="effectStage"><div class="effectTitle">${e.kind==='event'?'触发事件':'触发厄运'}</div><p>${esc(e.team)} 队</p><div class="effectCards">${e.cards.length?e.cards.map(c=>`<img src="${c.image}" alt="${esc(c.name)}">`).join(''):`<strong>${e.kind==='event'?'事件':'厄运'}已抵消</strong>`}</div></div>`;
  el.classList.add('show');
  effectTimer=setTimeout(()=>{el.classList.remove('show');effectActive=false;effectTimer=null;showNextDice();showNextExTime();showNextEffect();showNextResource();showNextBattle();playNextCardFlow();},2400);
}
function showNextResource(){
  if(resourceActive||battleActive||effectActive||exTimeActive||diceActive||$('roundIntro').classList.contains('show')||!resourceQueue.length)return;
  resourceActive=true;const change=resourceQueue.shift(),row=document.querySelector(`[data-resource-team="${change.team}"]`);
  const el=document.createElement('span');el.className=`resourceDelta ${change.amount>0?'gain':'loss'}`;
  el.textContent=`${change.kind} ${change.amount>0?'+':''}${change.amount}`;
  el.title=change.reason;
  if(row)row.appendChild(el);
  resourceTimer=setTimeout(()=>{el.remove();resourceActive=false;resourceTimer=null;showNextDice();showNextExTime();showNextEffect();showNextResource();showNextBattle();playNextCardFlow();},1200);
}
function showNextBattle(){
  if(battleActive||resourceActive||effectActive||exTimeActive||diceActive||!battleQueue.length||$('roundIntro').classList.contains('show'))return;
  battleActive=true;const battle=battleQueue.shift(),el=$('battleIntro');
  const members=[battle.first,battle.second].map(id=>snapshot.records.find(r=>r.id===id)?.defender);
  el.innerHTML=`<div class="battleStage"><strong>触发战斗</strong><div class="battleFaces">${members.map((m,i)=>`<div>${avatar(m,battle.participants[i]+' 队')}<span>${esc(battle.participants[i])} 队 · ${esc(m?.account||'待定')}</span></div>`).join('<b>⚔</b>')}</div><small>第 ${battle.round} 回合 · ${esc(battle.node)}</small></div>`;
  el.classList.add('show');
  battleTimer=setTimeout(()=>{el.classList.remove('show');battleActive=false;battleTimer=null;showNextDice();showNextExTime();showNextEffect();showNextResource();showNextBattle();},1800);
}
function showRoundIntro(round,records=[]){
  const el=$('roundIntro');if(introTimer)clearTimeout(introTimer);
  liveOtherQueue=[];liveOtherBusy=false;
  el.textContent=`第 ${round} 回合`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
  introTimer=setTimeout(()=>{el.classList.remove('show');replayOtherTeams(records,round);showNextDice();showNextExTime();showNextEffect();showNextResource();showNextBattle();playNextCardFlow();},1500);
}
function rectOf(el){if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};}
async function flyCard(from,to,image,back=false){
  if(!from||!to||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const el=document.createElement(back?'div':'img');el.className='flyingCard'+(back?' flyingBack':'');
  if(!back){el.src=image;el.alt='';}else el.textContent='✦';
  Object.assign(el.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
  $('cardMotion').appendChild(el);
  const dx=to.left-from.left,dy=to.top-from.top,sx=to.width/Math.max(from.width,1),sy=to.height/Math.max(from.height,1);
  try{await el.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`,opacity:.9}],{duration:620,easing:'cubic-bezier(.22,.7,.2,1)',fill:'forwards'}).finished;}catch{}
  el.remove();
}
async function runCardFlow(item,epoch){
  const {flow,from}=item,deck=$('deckPile'),discard=$('discardPile');
  const deckCard=deck.querySelector('.pileStack'),discardCard=discard.querySelector('.pileStack');
  const start=from||rectOf($('cards').querySelector('.card'))||rectOf(deckCard);
  await flyCard(start,rectOf(discardCard),flow.spent.image);
  if(epoch!==cardFlowEpoch)return;
  discard.classList.remove('pilePulse');void discard.offsetWidth;discard.classList.add('pilePulse');
  if(flow.shuffled){
    $('pileNotice').textContent='洗牌';$('pileNotice').classList.add('show');
    await flyCard(rectOf(discardCard),rectOf(deckCard),null,true);
    $('pileNotice').classList.remove('show');
    if(epoch!==cardFlowEpoch)return;
    deck.classList.remove('pilePulse');void deck.offsetWidth;deck.classList.add('pilePulse');
  }
  const target=document.querySelector(`[data-card="${flow.drawn.id}"]`);
  if(target)await flyCard(rectOf(deckCard),rectOf(target),null,true);
  else deck.classList.add('pilePulse');
  if(epoch!==cardFlowEpoch)return;
  drawingCardIds.delete(flow.drawn.id);renderCards();renderPiles();
}
function playNextCardFlow(){
  if(cardFlowBusy||!cardFlowQueue.length||effectActive||resourceActive||exTimeActive||diceActive||$('roundIntro').classList.contains('show'))return;
  cardFlowBusy=true;const item=cardFlowQueue.shift(),epoch=cardFlowEpoch;
  runCardFlow(item,epoch).catch(e=>{drawingCardIds.delete(item.flow.drawn.id);renderCards();console.error(e);}).finally(()=>{if(epoch!==cardFlowEpoch)return;cardFlowBusy=false;playNextCardFlow();});
}
function prepareRoundReplay(next,round){
  for(const id of 'ABC')if(id!==next.teamId){
    if(animationTimers[id])clearTimeout(animationTimers[id]);delete animationTimers[id];delete animations[id];
    const record=next.records.find(r=>r.round===round&&r.team===id);
    if(record)animations[id]={node:record.from,route:[],index:0};
  }
}
function replayOtherTeams(records,round){
  replayBusy=true;
  const pending=records.flatMap(r=>[r,...(r.extraMoves||[])]).sort((a,b)=>a.time-b.time);
  for(const id of 'ABC')if(id!==snapshot.teamId&&!pending.some(r=>r.team===id))pending.push({team:id,ghost:true});
  const next=()=>{
    const item=pending.shift();if(!item||snapshot.teams[snapshot.teamId].round!==round){ghostRevealTeam=null;replayBusy=false;renderMap();drainOtherAnimations();return;}
    if(item.ghost){if(snapshot.records.some(r=>r.round===round&&r.team===item.team)){next();return;}ghostRevealTeam=item.team;renderMap();replayTimer=setTimeout(()=>{ghostRevealTeam=null;renderMap();next();},950);}
    else animate(item,next,!!item.extraMoves?.length);
  };next();
}
function queueOtherAnimation(record){liveOtherQueue.push(record);drainOtherAnimations();}
function drainOtherAnimations(){if(replayBusy||liveOtherBusy||$('roundIntro').classList.contains('show')||!liveOtherQueue.length)return;liveOtherBusy=true;animate(liveOtherQueue.shift(),()=>{liveOtherBusy=false;drainOtherAnimations();});}
function animate(record,done,holdAtEnd=false){
  const id=record.team;if(animationTimers[id])clearTimeout(animationTimers[id]);
  animations[id]={node:record.from,route:record.route,index:0};
  renderMap();
  const step=()=>{
    const a=animations[id];if(!a)return;
    a.node=a.route[a.index++];renderMap();
    if(a.index<a.route.length)animationTimers[id]=setTimeout(step,520);
    else animationTimers[id]=setTimeout(()=>{if(holdAtEnd)animations[id]={node:a.node,route:[],index:0};else delete animations[id];delete animationTimers[id];renderMap();renderTurnControls();if(done)done();},450);
  };
  animationTimers[id]=setTimeout(step,120);
}
async function action(path,data){try{const next=await api('POST',session.tutorial?`/tutorial/${path}`:`/rooms/${session.code}/${path}`,data);ingest(next);return true;}catch(e){fail(e);return false;}}
function renderTutorial(){
  const panel=$('tutorialPanel'),info=snapshot.tutorial;
  panel.hidden=!info;if(!info)return;
  panel.innerHTML=`<div><span class="tutorialKicker">练习旅程 · ${info.scene}/${info.total} · 操作 A 队</span><h2>${esc(info.title)}</h2><p>${esc(info.instruction)}</p></div><div class="tutorialActions"><a href="/game" target="_top">返回桌游列表</a><button id="restartTutorial" type="button">从头练习</button></div>`;
  $('restartTutorial').onclick=()=>{if(confirm('确定从头练习？当前进度会清除。'))action('reset',{});};
}
function render(){showGame();$('judgePanel').hidden=snapshot.role!=='host';$('cards').hidden=snapshot.role==='host';$('rightTitle').textContent=snapshot.role==='host'?'裁判控制':'手牌';$('openHandHelp').hidden=snapshot.role==='host';document.querySelector('[data-game-view="judge"]').hidden=snapshot.role!=='host';document.querySelector('[data-game-view="hand"]').hidden=snapshot.role==='host';if(snapshot.role==='host'&&document.body.dataset.gameView==='hand'||snapshot.role!=='host'&&document.body.dataset.gameView==='judge')setGameView('map');renderSummary();renderMap();renderEndgame();renderTurnControls();if(!$('chooseDefender')||!snapshot.canAct)$('defenderModal').classList.remove('show');renderCards();renderPiles();renderPreview();renderPending();$('actionDock').hidden=snapshot.role==='host'&&!snapshot.pendingAction;renderHistory();renderTable();renderTestTools();renderLog();if(!snapshot.canAct)document.querySelectorAll('#actionDock button, #cards button, #judgePanel button').forEach(el=>{el.disabled=true;el.title='本队仅指定操作者可操作';});}
function renderEndgame(){
  const banner=$('endgameBanner'),endgame=snapshot.endgame;
  if(!endgame?.result&&!endgame?.provisional?.length){banner.hidden=true;return;}
  banner.hidden=false;
  if(endgame.result?.reason==='goal')banner.textContent=`比赛结束 · ${endgame.result.winner} 队第 ${endgame.result.qualifyingRound} 轮达标获胜`;
  else if(endgame.result?.reason==='time_limit'||endgame.result?.reason==='manual')banner.textContent=`${endgame.result.reason==='time_limit'?'比赛时间到':'裁判结束比赛'} · ${endgame.result.ranking.map(row=>`第 ${row.rank} 名 ${row.team} 队 ${row.score} 分`).join(' · ')}`;
  else banner.textContent=`暂定达标：${endgame.provisional.map(row=>`${row.team} 队第 ${row.round} 轮达到 ${row.score} 分`).join('、')} · 等待相关轮次和战斗结清`;
}
function buffs(t){return [t.eventShield?`事件抵消 ×${t.eventShield}`:'',t.misfortuneShield?`厄运抵消 ×${t.misfortuneShield}`:'',t.debuffShield?`debuff 抵消 ×${t.debuffShield}`:'',t.nextIncomingBattleShield?`握手言和：抵消下次被发起战斗 ×${t.nextIncomingBattleShield}`:'',t.ambushPermanent?'狂战：路过对手占领格可停留开战':'',t.ambushCurrentCharges?`超时空警察：当前所在格伏击 ×${t.ambushCurrentCharges}`:'',t.skipNextTurn?'下一回合跳过':'',t.nextBattleModifier?`下次战斗 ${t.nextBattleModifier} 分`:'',t.nextBattleWinBonus?`下次战斗获胜 +${t.nextBattleWinBonus} 分`:'',t.battleRescue?`战斗落败保护 ×${t.battleRescue}`:'',t.freeSongBattle?`下次对战自选曲 ×${t.freeSongBattle}`:'',t.linkedTeamId?`彼岸双生 → ${t.linkedTeamId} 队（一次）`:'',t.chooseNextSteps?'下次移动自选 1–6 步':'',t.doubleEvent?'事件格抽两张':'',t.loanActive?'快速贷款还款':'',t.maxCardUses>1?'每回合可用 2 张牌':'',t.arcaeaVisitIncome?'造访 Arcaea 获得收入':'',t.fanshiVisitMoney?`造访范式 +${t.fanshiVisitMoney} 金钱`:'',t.discardAbility?'机械帮手弃牌':'',t.nextBattleDebuff?`debuff：下次战斗 ${t.nextBattleDebuff} 分`:'',t.nextTriggeredBattlePenalty?`对手阴招：本队触发的下次战斗本队 -1 分、对方 -100 金钱 ×${t.nextTriggeredBattlePenalty}`:'',...(t.debuffs||[]).map(d=>`debuff：${d.name}`)].filter(Boolean).join(' · ')||'无';}
function activeBattle(id){
  return snapshot.battles.find(b=>['待结算','待战'].includes(b.status)&&(snapshot.role==='host'||b.round===snapshot.teams[snapshot.teamId].round)&&
    [b.first,b.second].some(recordId=>snapshot.records.find(r=>r.id===recordId)?.team===id));
}
function renderSummary(){
  const ranked=[...'ABC'].sort((a,b)=>snapshot.teams[b].score-snapshot.teams[a].score||a.localeCompare(b));
  $('teamRoster').innerHTML=[...'ABC'].map(id=>{const t=snapshot.teams[id],rank=ranked.indexOf(id)+1,battle=activeBattle(id),bot=snapshot.botSeats?.[id];return `<button class="rosterTeam ${id===snapshot.teamId?'own':''} ${battle?'inBattle':''}" data-roster-team="${id}" aria-label="查看 ${id} 队信息"><span class="rosterHeading"><strong class="${id.toLowerCase()}">${id} 队${bot?` · ${bot==='steady'?'稳健人机':'进攻人机'}`:''}</strong><b>${t.score} 分</b></span><span><em class="rankBadge">${['1st','2nd','3rd'][rank-1]}</em> 第 ${t.round} 回合 · ${esc(t.position)}</span>${t.exTime?'<span class="exTimeTag">EX time · 免战中</span>':''}${battle?`<span class="battleFlag">⚔ ${battle.status==='待战'?'待战':'对战中'}</span>`:''}<small>Buff：${esc(buffs(t))}</small></button>`;}).join('');
  document.querySelectorAll('[data-roster-team]').forEach(el=>el.onclick=()=>showTeamInfo(el.dataset.rosterTeam));
}
function renderResourceStatus(){
  const panel=$('resourceStatus');
  for(const id of 'ABC'){
    const t=snapshot.teams[id];
    let row=panel.querySelector(`[data-resource-team="${id}"]`);
    if(!row){row=document.createElement('div');row.className='resourceRow';row.dataset.resourceTeam=id;row.innerHTML=`<b class="${id.toLowerCase()}">${id}</b><span class="resourceValues"></span>`;panel.appendChild(row);}
    row.querySelector('.resourceValues').textContent=`金钱 ${t.money} · 收入 ${t.income}`;
  }
}
function renderHistory(){
  const own=snapshot.role==='team'?snapshot.teamId:null;
  const records=snapshot.records.filter(r=>!own||r.team===own).sort((a,b)=>b.round-a.round||b.order-a.order);
  $('historyTitle').textContent=own?'本队历史':'队伍历史';
  const scroll=$('historyList').scrollTop;
  $('historyList').innerHTML=records.length?records.map(r=>{
    const battles=snapshot.battles.filter(b=>b.first===r.id||b.second===r.id);
    const used=r.usedCards?.length?r.usedCards.map(c=>c.name).join('、'):r.usedCard?.name;
    const events=r.events?.length?r.events:r.event?[r.event]:[];
    return `<div class="historyItem"><strong>${own?'':esc(r.team)+' 队 · '}第 ${r.round} 回合</strong><span>${esc(r.from)} → ${esc(r.node)}</span><small>移动：${esc(r.card?.name||'')} · ${r.card?.steps??'?'} 步</small><small>使用：${used?esc(used):r.cardSkipped?'无':'待选择'}</small>${events.length?`<small>事件：${events.map(c=>esc(c.name)).join('、')}</small>`:''}${r.misfortune?.length?`<small>厄运：${r.misfortune.map(c=>esc(c.name)).join('、')}</small>`:''}${r.houseAction?`<small>建筑：${esc(r.houseAction.detail)}</small>`:''}${battles.map(b=>`<small>战斗：${esc(b.status)}${b.winner?' · '+esc(b.winner)+' 胜':''}</small>`).join('')}</div>`;
  }).join(''):'<p class="notice">暂无历史记录</p>';
  $('historyList').scrollTop=scroll;
}
function renderMap(){
  renderResourceStatus();
  const grouped={};for(const id of 'ABC'){
    const view=snapshot.mapView[id],useAnimation=snapshot.role==='host'||id===snapshot.teamId||!view.ghost;
    const p=useAnimation&&animations[id]?.node||view.node;(grouped[p]??=[]).push(id);
  }
  for(const [node,ids] of Object.entries(grouped))ids.forEach((id,i)=>{
    let el=document.getElementById('marker-'+id);
    if(!el){el=document.createElement('div');el.id='marker-'+id;el.className='marker '+id;$('markers').appendChild(el);}
    const view=snapshot.mapView[id],[x,y]=snapshot.pos[node];
    el.innerHTML=view.defender?`${avatar(view.defender,id+' 队留守队员')}<span class="markerTeamBadge">${id}</span><span class="markerMemberName">${esc(view.defender.account)}</span>`:id;
    el.classList.toggle('ghost',view.ghost);el.classList.toggle('ghostReveal',ghostRevealTeam===id);el.classList.toggle('inBattle',!!activeBattle(id));const [left,top]=mapPercent([x,y]);el.style.left=(left+(i-ids.length/2+.5)*1.5)+'%';el.style.top=top+'%';
    el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label',`查看 ${id} 队信息${view.defender?'，留守 '+view.defender.account:''}`);
    el.onclick=()=>showTeamInfo(id);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showTeamInfo(id);}};
    el.title=(view.ghost?`${id} 队当前第 ${view.actualRound} 回合 · 尚未进行本队第 ${snapshot.teams[snapshot.teamId].round} 回合 · 实时位置 ${node}`:
      snapshot.role==='team'&&id!==snapshot.teamId?`${id} 队第 ${snapshot.teams[snapshot.teamId].round} 回合位置 ${node} · 当前第 ${view.actualRound} 回合`:`${id} 队第 ${view.actualRound} 回合 · ${node}`)+(view.defender?` · 留守：${view.defender.account}`:'');
  });
  const ids=snapshot.role==='host'?[...'ABC']:[...'ABC'].filter(id=>id!==snapshot.teamId);
  $('roundStatus').innerHTML=`<strong>${snapshot.role==='host'?'队伍回合':'其他队伍回合'}</strong>`+ids.map(id=>{const team=snapshot.teams[id];return `<span class="roundTeam${team.awaitingEnd?' waiting':''}" aria-label="${id} 队第 ${team.round} 回合${team.awaitingEnd?'，待结束':''}" title="${id} 队 · 第 ${team.round} 回合${team.awaitingEnd?'（待结束）':''}"><b class="${id.toLowerCase()}">${id} 队</b><span>第 ${team.round} 回合</span></span>`;}).join('');
}
function showTeamInfo(id){
  const t=snapshot.teams[id];
  $('teamInfo').innerHTML=`<div class="teamInfoBody"><button id="closeTeamInfo" aria-label="关闭">×</button><h2 class="${id.toLowerCase()}">${id} 队</h2><p>第 ${t.round} 回合 · ${esc(t.position)}</p><p>积分 ${t.score}${activeBattle(id)?' · 对战中':''}</p><p>已有 Buff：${esc(buffs(t))}</p></div>`;
  $('teamInfo').classList.add('show');$('closeTeamInfo').onclick=()=>{$('teamInfo').classList.remove('show');};
}
function openDefenderPicker(forced,record){
  const members=snapshot.teams[snapshot.teamId].eligibleMembers||[];
  $('defenderModalTitle').textContent=forced?'选择战斗出战队员':'选择留守队员';
  $('defenderModalNote').textContent=forced?`第 ${record.round} 回合 · 可调整留守队员，选择本次出战人。`:`第 ${record.round} 回合 · 留守 ${record.node}`;
  $('defenderModalChoices').innerHTML=members.map(m=>`<button type="button" data-defender="${esc(m.id)}">${avatar(m,m.account)}<span>${esc(m.account)}</span></button>`).join('');
  $('defenderModal').classList.add('show');
  document.querySelectorAll('#defenderModalChoices [data-defender]').forEach(el=>el.onclick=async()=>{
    if(!snapshot.canAct)return;
    document.querySelectorAll('#defenderModalChoices button').forEach(button=>button.disabled=true);
    if(await action('reserve-member',{memberId:el.dataset.defender}))$('defenderModal').classList.remove('show');
    else document.querySelectorAll('#defenderModalChoices button').forEach(button=>button.disabled=false);
  });
  $('defenderModalChoices').querySelector('button')?.focus();
}
function renderTurnControls(){
  if(snapshot.role!=='team'){$('turnControls').innerHTML='';return;}
  const reaction=snapshot.pendingCardReaction;
  if(reaction){
    const own=snapshot.teams[snapshot.teamId];
    if(reaction.responder===snapshot.teamId){
      const counter=own.hand.find(c=>c.effect_type==='counter_other_card'&&own.money>=c.cost);
      $('turnControls').innerHTML=`<div class="turnState">${esc(reaction.sourceTeam)} 队使用「${esc(reaction.card.name)}」，是否用「忘忘队立大功」反制？<div>${counter?'<button id="counterUse">使用反制牌</button> ':''}<button id="counterPass">放弃反制</button></div></div>`;
      if(counter)$('counterUse').onclick=()=>action('counter-response',{use:true,cardId:counter.id});
      $('counterPass').onclick=()=>action('counter-response',{use:false});
    }else $('turnControls').innerHTML=`<div class="turnState">${reaction.reactor?`等待裁判判定 ${esc(reaction.reactor)} 队的反制挑战`:`等待 ${esc(reaction.responder)} 队决定是否反制「${esc(reaction.card.name)}」`}</div>`;
    return;
  }
  if(snapshot.endgame?.result){$('turnControls').innerHTML='<div class="turnState">比赛已结束，房间仅供查看</div>';return;}
  if(snapshot.pendingAction){$('turnControls').innerHTML='<div class="turnState">请先在待处理区完成厄运结算</div>';return;}
  const t=snapshot.teams[snapshot.teamId];
  if(t.pendingDiscard){$('turnControls').innerHTML=`<div class="turnState">选择 ${esc(t.pendingDiscard)} 队要丢弃的手牌<div class="defenderChoices">${(t.pendingDiscardCards||[]).map(c=>`<button data-target-card="${esc(c.id)}"><img src="${esc(c.image)}" alt=""><span>${esc(c.name)}</span></button>`).join('')}</div></div>`;document.querySelectorAll('[data-target-card]').forEach(el=>el.onclick=()=>action('discard-target-card',{cardId:el.dataset.targetCard}));return;}
  if(t.pendingRedraw){$('turnControls').innerHTML=`<div class="turnState">six seven：选择一张手牌丢弃并重新抽取<div class="defenderChoices">${t.hand.map(c=>`<button data-redraw-card="${esc(c.id)}"><img src="${esc(c.image)}" alt=""><span>${esc(c.name)}</span></button>`).join('')}</div></div>`;document.querySelectorAll('[data-redraw-card]').forEach(el=>el.onclick=()=>action('redraw-card',{cardId:el.dataset.redrawCard}));return;}
  const forced=snapshot.battles.find(b=>b.forced&&b.status==='待选人'&&[b.first,b.second].some(id=>snapshot.records.some(r=>r.id===id&&r.team===snapshot.teamId&&!r.defender)));
  if(forced&&t.eligibleMembers?.length){const record=snapshot.records.find(r=>[forced.first,forced.second].includes(r.id)&&r.team===snapshot.teamId);$('turnControls').innerHTML=`<div class="turnState">第 ${forced.round} 回合战斗：选择出战队员 <button id="chooseDefender">选择队员</button></div>`;$('chooseDefender').onclick=()=>openDefenderPicker(true,record);return;}
  if(snapshot.tutorial?.completed){$('turnControls').innerHTML='<div class="turnState">教程完成！你可以返回桌游列表，或从头再练一次。</div>';return;}
  if(!t.awaitingEnd){$('turnControls').innerHTML=`<div class="turnState">第 ${t.round} 回合 · 请选择手牌移动</div>`;return;}
  const record=snapshot.records.findLast(r=>r.team===snapshot.teamId&&r.round===t.round);
  if(t.pendingMisfortuneCard&&!t.pendingTarget){
    $('turnControls').innerHTML='<div class="turnState">经过厄运 B：可使用适用手牌，或正常结算厄运。<button id="skipUse">正常结算厄运</button></div>';
    $('skipUse').onclick=()=>action('skip-use',{});return;
  }
  if(record&&!snapshot.house.includes(record.node)&&!record.defender&&t.eligibleMembers?.length){
    $('turnControls').innerHTML=`<div class="turnState">第 ${t.round} 回合 · 留守 ${esc(record.node)} <button id="chooseDefender">选择留守队员</button></div>`;
    $('chooseDefender').onclick=()=>openDefenderPicker(false,record);return;
  }
  if(t.pendingChallenge){$('turnControls').innerHTML=`<div class="turnState">挑战已提交${t.pendingChallenge.freeSong?' · 本次可自行选曲':''} · 等待裁判判定</div>`;return;}
  if(t.pendingTeleport){
    $('turnControls').innerHTML=`<div class="turnState">选择传送目的地 <select id="teleportNode">${Object.keys(snapshot.graph).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select><button id="teleportNow">传送</button></div>`;
    $('teleportNow').onclick=()=>action('teleport',{node:$('teleportNode').value});return;
  }
  if(t.pendingExtraMove){$('turnControls').innerHTML='<div class="turnState">言而无信：选择一张手牌额外移动（不触发格子与战斗）</div>';return;}
  if(t.pendingTarget){$('turnControls').innerHTML=`<div class="turnState">${esc(t.pendingTarget.name)}：选择另一支队伍<div class="testActions">${'ABC'.split('').filter(id=>id!==snapshot.teamId&&(!t.pendingTarget.effect_type.startsWith('challenge_battle_')||!snapshot.teams[id].exTime)).map(id=>`<button data-card-target="${id}">${id} 队</button>`).join('')}</div></div>`;document.querySelectorAll('[data-card-target]').forEach(el=>el.onclick=()=>action('card-target',{target:el.dataset.cardTarget}));return;}
  if(t.pendingReroll){const prizes=[10,25,50,100,150,200];$('turnControls').innerHTML=`<div class="turnState">魔幻饰品：首次掷出 ${t.pendingReroll.firstRoll}，可获得 ${prizes[t.pendingReroll.firstRoll-1]} 金钱<div class="testActions"><button id="keepRoll">保留</button><button id="rerollCard">重掷一次</button></div></div>`;$('keepRoll').onclick=()=>action('card-reroll',{again:false});$('rerollCard').onclick=()=>action('card-reroll',{again:true});return;}
  if(!t.cardActionDone){
    const blocked=!!animations[snapshot.teamId]||!!snapshot.pendingAuction||!!snapshot.pendingMisfortuneChoice;
    const remaining=t.maxCardUses+t.extraCardUsesThisRound-t.cardUsesThisRound;
    $('turnControls').innerHTML=`<div class="turnState">${t.pendingEvent?'事件格：可使用适用手牌，或翻开事件牌':`第 ${t.round} 回合 · 还可使用 ${remaining} 张适用手牌`} <button id="skipUse" ${blocked?'disabled':''}>${t.pendingEvent?'翻开事件牌':t.cardUsesThisRound?'不再使用':'不使用卡牌'}</button></div>`;
    $('skipUse').onclick=()=>action('skip-use',{});return;
  }
  const blocked=!!animations[snapshot.teamId]||!!snapshot.pendingAuction||!!snapshot.pendingMisfortuneChoice;
  const house=snapshot.house.includes(t.position),effect=t.position==='Arcaea'?`支付 ${t.income+10} 金钱，收入永久 +10`:t.position==='范式起源'?'掷 d6 获得 10/25/50/100/150/200 金钱':'1 积分兑换 200 金钱';
  const canHouse=house&&!t.houseActionDone&&!blocked&&(t.position==='Arcaea'?t.money>=t.income+10:t.position==='Phigros'?t.score>=1:true);
  $('turnControls').innerHTML=`<div class="turnState">第 ${t.round} 回合结算完成${t.skipNextTurn?' · 下一回合将跳过':''} <div>${house?`<button id="houseAction" ${canHouse?'':'disabled'}>${t.houseActionDone?'建筑效果已使用':esc(t.position+'：'+effect)}</button> `:''}<button id="endTurn" ${blocked?'disabled':''}>结束回合</button></div></div>`;
  if($('houseAction'))$('houseAction').onclick=()=>action('house-action',{});
  $('endTurn').onclick=()=>action('end-turn',{});
}
function renderCards(){
  const own=snapshot.role==='team'&&!snapshot.tutorial?.completed?snapshot.teams[snapshot.teamId]:null;
  if(!own){selected=null;pendingRoute=null;$('cards').innerHTML='';clearRouteChoices();return;}
  if(selected&&!own.hand.some(c=>c.id===selected.id)){selected=null;pendingRoute=null;}
  $('cards').innerHTML=own.hand.map(c=>{const playable=own.awaitingEnd&&!own.cardActionDone&&!own.pendingChallenge&&!own.pendingTeleport&&!own.pendingExtraMove&&!own.pendingTarget&&!own.pendingRedraw&&!own.pendingReroll&&!snapshot.pendingAction&&!snapshot.pendingCardReaction&&cardUsable(own,c);return `<div class="card ${selected?.id===c.id?'selected':''} ${playable?'playable':''} ${drawingCardIds.has(c.id)?'drawing':''}" role="button" tabindex="0" data-card="${c.id}" title="${esc(c.name)}：${esc(c.effect)}"><img src="${c.image}" alt="${esc(c.name)}"><span class="cardBadge">${esc(c.name)} · ${c.move===7?'?':c.move} 步</span></div>`;}).join('');
  document.querySelectorAll('[data-card]').forEach(el=>{const choose=()=>{
    if(moving)return;
    const mode=snapshot.pendingCardReaction||snapshot.pendingAction?'view':own.pendingExtraMove?'extra':!own.awaitingEnd?'move':!own.cardActionDone&&!own.pendingChallenge&&!own.pendingTeleport&&!own.pendingTarget&&!own.pendingRedraw&&!own.pendingReroll?'use':own.canDiscard?'discard':'view';
    preview={cardId:el.dataset.card,mode};renderPreview();
  };el.onclick=choose;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};});
  if(snapshot.pendingAction||snapshot.pendingCardReaction){pendingRoute=null;clearRouteChoices();return;}
  if(own.awaitingEnd&&!own.pendingExtraMove){selected=null;pendingRoute=null;clearRouteChoices();return;}
  if(!selected){pendingRoute=null;clearRouteChoices();return;}
  const steps=own.chooseNextSteps||selected.move===7?(own.pendingRoll?.cardId===selected.id?own.pendingRoll.value:null):selected.move;
  if(steps===null){
    pendingRoute=null;renderRoutePreview();$('routeConfirmation').innerHTML='';
    $('route').textContent=own.chooseNextSteps?'零號車輛：为下一次移动选择 1–6 步。':'问号牌：先掷一颗 d6，骰子点数就是本次移动步数。';
    $('choices').innerHTML=own.chooseNextSteps?Array.from({length:6},(_,i)=>`<button data-steps="${i+1}">${i+1} 步</button>`).join('')+'<button id="cancelMove">取消选牌</button>':'<button id="rollCard">掷骰决定步数</button><button id="cancelMove">取消选牌</button>';
    $('destinations').innerHTML='';
    if($('rollCard'))$('rollCard').onclick=()=>action('roll',{cardId:selected.id});
    document.querySelectorAll('[data-steps]').forEach(el=>el.onclick=()=>action('roll',{cardId:selected.id,value:Number(el.dataset.steps)}));
    $('cancelMove').onclick=cancelRouteSelection;return;
  }
  const canAmbush=moveKind!=='extra'&&!own.exTime;
  const occupied=canAmbush&&own.ambushPermanent?snapshot.records.filter(r=>r.team!==snapshot.teamId&&r.round===own.round&&!r.forcedBattleOnly&&!r.defenderUnavailable&&!snapshot.teams[r.team].exTime)
    .map(r=>r.finalPosition||r.node).filter(node=>!snapshot.battles.some(b=>b.round===own.round&&!b.forced&&b.node===node)):[];
  const current=canAmbush&&own.ambushCurrentCharges>0?'ABC'.split('').filter(id=>id!==snapshot.teamId&&!snapshot.teams[id].exTime).map(id=>snapshot.ambushCurrentTargets?.[id]).filter(Boolean):[];
  const earlyStops=[...new Set([...occupied,...current])].filter(node=>!snapshot.house.includes(node));
  const options=window.routes.reachable(snapshot.graph,snapshot.house,own.position,steps,earlyStops);
  if(pendingRoute&&(pendingRoute.cardId!==selected.id||pendingRoute.from!==own.position||!options.some(o=>o.node===pendingRoute.node&&o.route.join('|')===pendingRoute.route.join('|'))))pendingRoute=null;
  renderRoutePreview();
  const counts={};for(const o of options)counts[o.node]=(counts[o.node]||0)+1;
  $('route').textContent=`第 ${own.round} 回合 · ${moveKind==='extra'?'额外移动 · ':''}${steps} 步 · ${Object.keys(counts).length} 个终点、${options.length} 条路线。点击终点或路线预览，确认后移动。`;
  $('routeConfirmation').innerHTML=pendingRoute?`<div><strong>确认沿高亮路线移动到 ${esc(pendingRoute.node)}？</strong><span>${esc(own.position+' → '+pendingRoute.route.join(' → '))}</span></div><div class="routeConfirmActions"><button id="confirmMove" ${moving?'disabled':''}>确认移动</button><button id="cancelRoute" ${moving?'disabled':''}>取消并重新选牌</button></div>`:'';
  $('choices').innerHTML=options.map((o,i)=>`<button data-option="${i}" class="${pendingRoute?.index===i?'routeChoiceActive':''}" ${moving?'disabled':''}>${esc(o.node)} · ${esc(snapshot.nodeTypes[o.node]||'建筑')} <small>经 ${esc(o.route.join(' → '))}</small></button>`).join('')+
    `<button id="cancelMove" ${moving?'disabled':''}>取消选牌</button>`;
  $('destinations').innerHTML=options.map((o,i)=>({...o,index:i})).filter((o,i,all)=>all.findIndex(other=>other.node===o.node)===i).map(o=>{const [x,y]=snapshot.pos[o.node],type=snapshot.nodeTypes[o.node]||'建筑';return `<button class="destination ${pendingRoute?.node===o.node?'routeDestinationActive':''}" data-option="${o.index}" aria-label="终点 ${esc(o.node)}，${esc(type)}，${counts[o.node]} 条路线" title="${esc(o.node)} · ${esc(type)}；${counts[o.node]} 条路线可在下方选择" style="left:${mapPercent([x,y])[0]}%;top:${mapPercent([x,y])[1]}%" ${moving?'disabled':''}><span class="destinationHalo" aria-hidden="true"></span></button>`;}).join('');
  document.querySelectorAll('[data-option]').forEach(el=>el.onclick=()=>{if(moving)return;const index=Number(el.dataset.option),choice=options[index];pendingRoute={cardId:selected.id,from:own.position,node:choice.node,route:[...choice.route],index};renderCards();});
  if($('confirmMove'))$('confirmMove').onclick=async()=>{if(moving||!pendingRoute)return;const {cardId,route}=pendingRoute,kind=moveKind;moving=true;renderCards();const ok=await action(kind==='extra'?'extra-move':'move',{cardId,route});moving=false;if(ok){selected=null;pendingRoute=null;}renderCards();};
  if($('cancelRoute'))$('cancelRoute').onclick=cancelRouteSelection;
  $('cancelMove').onclick=cancelRouteSelection;
}
function cancelRouteSelection(){selected=null;pendingRoute=null;setGameView('hand');renderCards();}
function clearRouteChoices(){$('route').textContent='';$('routeConfirmation').innerHTML='';$('choices').innerHTML='';$('destinations').innerHTML='';renderRoutePreview();}
function renderRoutePreview(){
  const overlay=$('routePreview');if(!pendingRoute){overlay.replaceChildren();return;}
  const points=[pendingRoute.from,...pendingRoute.route].map(node=>snapshot.pos[node]);
  if(points.some(point=>!point)){overlay.replaceChildren();return;}
  const path=points.map(([x,y])=>`${x},${y}`).join(' ');
  overlay.innerHTML=`<polyline class="routeHalo" points="${path}" fill="none" stroke="#ff9929" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/><polyline class="routeLine" points="${path}" fill="none" stroke="#fff2a2" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>${points.map(([x,y],i)=>`<circle class="routeStep" cx="${x}" cy="${y}" r="${i===points.length-1?22:13}" fill="#fff5b9" stroke="#e9821e" stroke-width="8"/>`).join('')}`;
}
function renderPiles(){
  const own=snapshot.role==='team'?snapshot.teams[snapshot.teamId]:null;
  $('piles').hidden=!own;if(!own)return;
  $('deckCount').textContent=own.deckCount;$('discardCount').textContent=own.discardCount;
  $('deckPile').classList.toggle('empty',own.deckCount===0);
  $('discardPile').classList.toggle('empty',own.discardCount===0);
  $('discardFace').innerHTML=own.discardTop?`<img src="${esc(own.discardTop.image)}" alt="${esc(own.discardTop.name)}">`:'—';
  $('deckPile').onclick=()=>{pileView='deck';pileScrollTop=0;preview=null;detailPreview=null;renderPreview();};
  $('discardPile').onclick=()=>{pileView='discard';pileScrollTop=0;preview=null;detailPreview=null;renderPreview();};
}
function renderPreview(){
  if(detailPreview){$('cardPreview').innerHTML=`<div class="previewBody cardOnly"><img src="${esc(detailPreview.image)}" alt="${esc(detailPreview.name)}"><div class="previewActions"><button id="backPreview">取消</button></div></div>`;$('cardPreview').classList.add('show');$('backPreview').onclick=()=>{detailPreview=null;renderPreview();};return;}
  if(pileView&&snapshot?.role==='team'){
    const cards=snapshot.teams[snapshot.teamId][pileView==='deck'?'deckCards':'discardCards']||[];
    const title=pileView==='deck'?'抽牌堆':'弃牌堆';
    pileScrollTop=$('cardPreview').querySelector('.pileViewerGrid')?.scrollTop??pileScrollTop;
    $('cardPreview').innerHTML=`<div class="pileViewerBody" role="dialog" aria-label="${title}"><div class="pileViewerHeader"><h2>${title} · ${cards.length} 张</h2><button id="closePileViewer">取消</button></div>${cards.length?`<div class="pileViewerGrid">${cards.map((card,index)=>`<button data-pile-card="${index}" type="button" aria-label="查看 ${esc(card.id)} ${esc(card.name)}"><img src="${esc(card.image)}" alt=""><span>${esc(card.id)} · ${esc(card.name)}</span></button>`).join('')}</div>`:'<div class="pileViewerEmpty">暂无卡牌</div>'}</div>`;
    $('cardPreview').classList.add('show');$('closePileViewer').onclick=()=>{pileView=null;pileScrollTop=0;renderPreview();};
    if($('cardPreview').querySelector('.pileViewerGrid'))$('cardPreview').querySelector('.pileViewerGrid').scrollTop=pileScrollTop;
    document.querySelectorAll('[data-pile-card]').forEach(el=>el.onclick=()=>{pileScrollTop=$('cardPreview').querySelector('.pileViewerGrid').scrollTop;detailPreview=cards[Number(el.dataset.pileCard)];renderPreview();});
    return;
  }
  if(!preview||snapshot?.role!=='team'){$('cardPreview').classList.remove('show');$('cardPreview').innerHTML='';return;}
  const own=snapshot.teams[snapshot.teamId],card=own.hand.find(c=>c.id===preview.cardId);
  if(!card){preview=null;renderPreview();return;}
  const usable=preview.mode!=='use'||cardUsable(own,card);
  const canPlay=preview.mode!=='view'&&usable&&snapshot.canAct!==false&&!own.pendingTarget&&!own.pendingReroll&&!snapshot.pendingAction;
  $('cardPreview').innerHTML=`<div class="previewBody cardOnly"><img src="${esc(card.image)}" alt="${esc(card.name)}"><div class="previewActions"><button id="playPreview" ${canPlay?'':'disabled'}>打出</button><button id="backPreview">取消</button></div></div>`;
  $('cardPreview').classList.add('show');
  $('backPreview').onclick=()=>{preview=null;renderPreview();};
  $('playPreview').onclick=async()=>{
    if(!canPlay)return;const {cardId,mode}=preview;preview=null;renderPreview();
    if(mode==='move'||mode==='extra'){selected=card;pendingRoute=null;moveKind=mode;setGameView('map');renderCards();return;}
    if(mode==='use'&&await action('use-card',{cardId}))setGameView('map');
    if(mode==='discard')await action('discard-card',{cardId});
  };
}
function renderTable(){
  $('filterNote').textContent=snapshot.role==='host'?'显示所有轮次和到达记录。':`仅显示不晚于本队当前回合（第 ${snapshot.teams[snapshot.teamId].round} 回合）且已到达的记录。`;
  const rounds=[...new Set(snapshot.records.map(r=>r.round))].sort((a,b)=>b-a);
  const previews=[];
  const cardButton=(card,label,detail)=>{if(!card?.image)return `<span>${esc(label)}</span>`;const index=previews.push({image:card.image,name:card.name,effect:detail||card.effect||''})-1;return `<button class="tableCard" data-table-card="${index}"><img src="${esc(card.image)}" alt="${esc(card.name)}"><span>${esc(label)}</span></button>`;};
  $('rows').innerHTML=rounds.length?rounds.map(round=>`<tr><td>第 ${round} 轮</td>${'ABC'.split('').map(id=>{
    const r=snapshot.records.find(x=>x.round===round&&x.team===id);
    if(!r)return '<td><span class="muted">—</span></td>';
    const move=r.card?cardButton(r.card,`移动：${r.card.name} · ${r.card.steps} 步`,`移动 ${r.card.steps} 步`):'<span class="muted">交锋：当场选人</span>';
    const played=r.usedCards?.length?r.usedCards:r.usedCard?[r.usedCard]:[];
    const used=played.length?played.map(c=>`${cardButton(c,`使用：${c.name} · ${c.result}`,c.effect)}<p class="recordEffect">${esc(c.effect)}</p>`).join(''):`<span class="muted">使用：${r.cardSkipped?'无':'待选择'}</span>`;
    const event=(r.events?.length?r.events:r.event?[r.event]:[]).map(c=>`<div>${cardButton(c,`事件：${c.name}`,c.effect||'')}</div>`).join('');
    const mis=(r.misfortune||[]).map(c=>`<div>${cardButton(c,`厄运：${c.name}${c.redirectedTo?' → '+c.redirectedTo+' 队':''}`,c.effect||'')}</div>`).join('');
    const battle=snapshot.battles.find(b=>['待结算','待战','待选人'].includes(b.status)&&(b.first===r.id||b.second===r.id));
    return `<td><b>${esc(r.node)}</b>${battle?`<span class="battleFlag"> ⚔ ${battle.status==='待结算'?'对战中':battle.status}</span>`:''}<br><span class="muted">${time(r.time)} · 格子金钱 ${r.moneyDelta>=0?'+':''}${r.moneyDelta}</span>${r.defender?`<div class="battlePlayer">${avatar(r.defender,r.defender.account)} 留守：${esc(r.defender.account)}</div>`:r.defenderUnavailable?'<div class="muted">本轮无可预定队员</div>':''}<div>${move}</div><div>${used}</div>${r.houseAction?`<p class="recordEffect">建筑：${esc(r.houseAction.detail)}</p>`:''}${event}${mis}</td>`;
  }).join('')}</tr>`).join(''):'<tr><td colspan="4" class="muted">暂无移动记录</td></tr>';
  document.querySelectorAll('[data-table-card]').forEach(el=>el.onclick=()=>{detailPreview=previews[Number(el.dataset.tableCard)];renderPreview();});
  $('battles').innerHTML=snapshot.battles.map(b=>{
    const first=snapshot.records.find(r=>r.id===b.first),second=snapshot.records.find(r=>r.id===b.second),a=first?.team,c=second?.team;
    return `<div class="battle ${b.status==='已结算'?'settled':''}">第 ${b.round} 轮 · ${esc(b.node)} · ${b.status}${b.winner?' · '+b.winner+' 胜':''}<div class="battleLine"><span class="battlePlayer">${avatar(first?.defender,a+' 队')}${esc(a||'?')} 队 · ${esc(first?.defender?.account||'待选人')}</span><b>⚔</b><span class="battlePlayer">${avatar(second?.defender,c+' 队')}${esc(c||'?')} 队 · ${esc(second?.defender?.account||'待选人')}</span></div>${Object.entries(b.freeSong||{}).map(([id])=>`<p class="notice">${esc(id)} 队本次对战可自行选曲</p>`).join('')}${snapshot.role==='host'&&b.status==='待结算'?`<div><button data-battle="${b.id}" data-winner="${a}">${a} 胜</button><button data-battle="${b.id}" data-winner="${c}">${c} 胜</button></div>`:''}</div>`;
  }).join('');
  document.querySelectorAll('[data-battle]').forEach(el=>el.onclick=()=>action('battle',{id:el.dataset.battle,winner:el.dataset.winner}));
  const challenges=snapshot.role==='host'?Object.entries(snapshot.challenges||{}).map(([id,c])=>`<div class="battle"><b>${id} 队使用「${esc(c.card.name)}」</b><p class="notice">挑战条件：${esc(c.card.condition)}${c.freeSong?' · 本次可自行选曲':''}</p>${c.debuffs?.length?`<p class="notice">本次 debuff：${c.debuffs.map(d=>esc(d.effect)).join('；')}</p>`:''}<button data-challenge="${id}" data-success="true">挑战成功</button> <button data-challenge="${id}" data-success="false">挑战失败</button></div>`).join(''):'';
  $('hostTools').innerHTML=snapshot.role==='host'?`<h3>待判定的卡牌挑战</h3>${challenges||'<p class="notice">暂无</p>'}<h3>裁判调分</h3><div class="scoreTools">`+ 'ABC'.split('').map(id=>`<button data-score="${id}" data-value="-2">${id} −2</button><button data-score="${id}" data-value="1">${id} +1</button><button data-score="${id}" data-value="2">${id} +2</button>`).join('')+'</div><h3>裁判调整金钱</h3><div class="scoreTools">'+'ABC'.split('').map(id=>`<button data-money="${id}" data-value="-100">${id} −100</button><button data-money="${id}" data-value="100">${id} +100</button>`).join('')+'</div><h3>强制结束回合</h3><div class="scoreTools">'+'ABC'.split('').map(id=>`<button data-force-end-turn="${id}">${id} 队 · 第 ${snapshot.teams[id].round} 回合</button>`).join('')+'</div>':'';
  document.querySelectorAll('[data-challenge]').forEach(el=>el.onclick=()=>action('resolve-challenge',{team:el.dataset.challenge,success:el.dataset.success==='true'}));
  document.querySelectorAll('[data-score]').forEach(el=>el.onclick=()=>action('score',{team:el.dataset.score,value:Number(el.dataset.value)}));
  document.querySelectorAll('[data-money]').forEach(el=>el.onclick=()=>action('money',{team:el.dataset.money,value:Number(el.dataset.value)}));
  document.querySelectorAll('[data-force-end-turn]').forEach(el=>el.onclick=()=>{const id=el.dataset.forceEndTurn;if(confirm(`强制结束 ${id} 队第 ${snapshot.teams[id].round} 回合并开启下一回合？本回合未完成的操作将取消。`))action('force-end-turn',{team:id});});
}
function renderPending(){
  const reaction=snapshot.pendingCardReaction;
  if(reaction){
    const canPass=snapshot.role==='host'&&reaction.responder;
    $('pendingAction').innerHTML=`<div class="battle"><b>${esc(reaction.sourceTeam)} 队使用「${esc(reaction.card.name)}」</b><p class="notice">${reaction.reactor?`等待裁判判定 ${esc(reaction.reactor)} 队的反制挑战`:`等待 ${esc(reaction.responder)} 队决定是否使用反制牌`}</p>${canPass?'<button id="counterHostPass">裁判代为放弃反制</button>':''}</div>`;
    if(canPass)$('counterHostPass').onclick=()=>action('counter-response',{use:false});
    return;
  }
  const pending=snapshot.pendingAction==='misfortuneEffect'?snapshot.pendingMisfortuneEffect:null;
  if(pending){
    if(misfortuneDraftId!==pending.id){misfortuneDraftId=pending.id;swapSourceId=null;swapOwnId=null;passCardIds=new Set();}
    const id=snapshot.teamId,own=id?snapshot.teams[id]:null;
    let controls='';
    if(pending.kind==='ransom')controls=id===pending.triggerTeam?`<p>选择支付方式：</p><div class="testActions"><button id="ransomMoney" ${own.money>=150?'':'disabled'}>支付 150 金钱</button><button id="ransomScore">扣除 2 积分</button></div>`:`<p class="notice">等待 ${esc(pending.triggerTeam)} 队选择支付方式</p>`;
    if(pending.kind==='swap'){
      if(!pending.targetTeam)controls=id===pending.triggerTeam?`<p>指定另一队查看你的手牌并决定是否交换：</p><div class="testActions">${'ABC'.split('').filter(team=>team!==id).map(team=>`<button data-swap-target="${team}">${team} 队</button>`).join('')}</div>`:`<p class="notice">等待 ${esc(pending.triggerTeam)} 队指定目标</p>`;
      else if(id===pending.targetTeam){
        const choices=(cards,attribute,selected)=>cards.map(card=>`<button class="misfortuneHandChoice ${selected===card.id?'chosen':''}" ${attribute}="${esc(card.id)}" aria-pressed="${selected===card.id}"><img src="${esc(card.image)}" alt=""><span>${esc(card.name)}</span></button>`).join('');
        controls=`<p>你可以选自己的一张牌，交换 ${esc(pending.triggerTeam)} 队的一张牌；也可以放弃。</p><strong>${esc(pending.triggerTeam)} 队手牌</strong><div class="misfortuneHandChoices">${choices(pending.sourceHand||[],'data-swap-source',swapSourceId)}</div><strong>你的手牌</strong><div class="misfortuneHandChoices">${choices(own.hand,'data-swap-own',swapOwnId)}</div><div class="testActions"><button id="confirmMisfortuneSwap" ${swapSourceId&&swapOwnId?'':'disabled'}>确认交换</button><button id="declineMisfortuneSwap">不交换</button></div>`;
      }else controls=`<p class="notice">等待 ${esc(pending.targetTeam)} 队决定是否交换手牌</p>`;
    }
    if(pending.kind==='pass'){
      const submitted=pending.submitted||[];
      controls=`<p>A→B、B→C、C→A，每队各选择两张手牌；三队选定后同时传递。</p><p class="notice">${'ABC'.split('').map(team=>`${team} 队${submitted.includes(team)?'已选好':'待选择'}`).join(' · ')}</p>`;
      if(id&&!submitted.includes(id))controls+=`<div class="misfortuneHandChoices">${own.hand.map(card=>`<button class="misfortuneHandChoice ${passCardIds.has(card.id)?'chosen':''}" data-pass-card="${esc(card.id)}" aria-pressed="${passCardIds.has(card.id)}"><img src="${esc(card.image)}" alt=""><span>${esc(card.name)}</span></button>`).join('')}</div><button id="confirmPassCards" ${passCardIds.size===2?'':'disabled'}>确认传递两张</button>`;
    }
    $('pendingAction').innerHTML=`<div class="battle"><div class="drawnCard"><img src="${esc(pending.card.image)}" alt="${esc(pending.card.name)}"><span><b>厄运：${esc(pending.card.name)}</b><br>${esc(pending.card.effect)}</span></div>${controls}</div>`;
    if($('ransomMoney'))$('ransomMoney').onclick=()=>action('misfortune-ransom',{payment:'money'});
    if($('ransomScore'))$('ransomScore').onclick=()=>action('misfortune-ransom',{payment:'score'});
    document.querySelectorAll('[data-swap-target]').forEach(el=>el.onclick=()=>action('misfortune-swap-target',{target:el.dataset.swapTarget}));
    document.querySelectorAll('[data-swap-source]').forEach(el=>el.onclick=()=>{swapSourceId=el.dataset.swapSource;renderPending();});
    document.querySelectorAll('[data-swap-own]').forEach(el=>el.onclick=()=>{swapOwnId=el.dataset.swapOwn;renderPending();});
    if($('confirmMisfortuneSwap'))$('confirmMisfortuneSwap').onclick=()=>action('misfortune-swap',{accept:true,sourceCardId:swapSourceId,ownCardId:swapOwnId});
    if($('declineMisfortuneSwap'))$('declineMisfortuneSwap').onclick=()=>action('misfortune-swap',{accept:false});
    document.querySelectorAll('[data-pass-card]').forEach(el=>el.onclick=()=>{const cardId=el.dataset.passCard;if(passCardIds.has(cardId))passCardIds.delete(cardId);else if(passCardIds.size<2)passCardIds.add(cardId);renderPending();});
    if($('confirmPassCards'))$('confirmPassCards').onclick=()=>action('misfortune-pass-cards',{cardIds:[...passCardIds]});
    return;
  }
  const choice=snapshot.pendingAction==='misfortuneChoice'?snapshot.pendingMisfortuneChoice:null;
  if(choice){
    const id=snapshot.teamId;
    const cards=choice.cards.map((c,i)=>`<div class="drawnCard"><img src="${c.image}" alt="${esc(c.name)}"><span>${esc(c.name)}${id===choice.target?`<br><button data-misfortune-pick="${i}">选择这张</button>`:''}</span></div>`).join('');
    const targets=id===choice.triggerTeam&&!choice.target?`<div class="testActions">${'ABC'.split('').filter(x=>x!==id).map(x=>`<button data-misfortune-target="${x}">指定 ${x} 队选牌</button>`).join('')}</div>`:'';
    $('pendingAction').innerHTML=`<div class="battle"><b>${esc(choice.triggerTeam)} 队停在厄运 B，抽两张厄运</b><p class="notice">${choice.target?`等待 ${esc(choice.target)} 队选择一张让 ${esc(choice.triggerTeam)} 队承受`:'触发队指定另一队选牌'}</p>${cards}${targets}</div>`;
    document.querySelectorAll('[data-misfortune-target]').forEach(el=>el.onclick=()=>action('misfortune-target',{target:el.dataset.misfortuneTarget}));
    document.querySelectorAll('[data-misfortune-pick]').forEach(el=>el.onclick=()=>action('misfortune-pick',{index:Number(el.dataset.misfortunePick)}));
    return;
  }
  const auction=snapshot.pendingAction==='auction'?snapshot.pendingAuction:null;
  if(!auction){$('pendingAction').innerHTML='';return;}
  if(bidAuctionId!==auction.id){bidAuctionId=auction.id;bidDraft='0';}
  const id=snapshot.teamId,bid=id?auction.bids[id]:undefined;
  const focused=document.activeElement?.id==='bidAmount';
  $('pendingAction').innerHTML=`<div class="battle"><div class="drawnCard"><img src="${auction.card.image}" alt="${esc(auction.card.name)}"><span><b>厄运：${esc(auction.card.name)}</b><br>${esc(auction.card.effect)}<br>${esc(auction.triggerTeam)} 队触发 · ${'ABC'.split('').map(x=>`${x}：${auction.bids[x]===undefined?'待出价':snapshot.role==='host'?auction.bids[x]:'已提交'}`).join(' / ')}</span></div>${id&&bid===undefined?`<div class="bidForm"><input id="bidAmount" type="number" min="0" max="${snapshot.teams[id].money}" step="1" value="${esc(bidDraft)}" aria-label="竞标金额"><button id="submitBid">提交出价</button></div>`:''}</div>`;
  if($('bidAmount')){$('bidAmount').oninput=e=>{bidDraft=e.target.value;};if(focused)$('bidAmount').focus();}
  if($('submitBid'))$('submitBid').onclick=()=>action('bid',{amount:Number($('bidAmount').value)});
}
function renderTestTools(){
  if(snapshot.role!=='host'){$('testTools').innerHTML='';return;}
  $('testTools').innerHTML=`<h3>房间设置</h3><p class="notice">初始金钱 ${snapshot.initialMoney} · 初始收入 ${snapshot.initialIncome}</p><button id="resetRoom">重置本房间</button>`;
  $('resetRoom').onclick=()=>{if(confirm('重置本房间的分数、位置、牌库和战斗记录？'))action('reset',{});};
}
function renderLog(){
  const entries=snapshot.records.flatMap(r=>{
    const lines=[{time:r.time,message:`第 ${r.round} 回合 · ${r.team} 队移动至 ${r.node}（${r.card?.steps??'?'} 步，格子金钱 ${r.moneyDelta>=0?'+':''}${r.moneyDelta}）`}];
    for(const event of r.events?.length?r.events:r.event?[r.event]:[])lines.push({time:r.time,message:`${r.team} 队事件：${event.name}`});
    for(const card of r.misfortune||[])lines.push({time:r.time,message:`${r.team} 队厄运：${card.name}`});
    for(const card of r.usedCards?.length?r.usedCards:r.usedCard?[r.usedCard]:[])lines.push({time:r.time,message:`${r.team} 队使用：${card.name} · ${card.result}`});
    if(r.cardSkipped)lines.push({time:r.time,message:`${r.team} 队本回合未使用手牌`});
    if(r.houseAction)lines.push({time:r.time,message:`${r.team} 队建筑：${r.houseAction.detail}`});
    return lines;
  });
  for(const b of snapshot.battles){
    const teams=[b.first,b.second].map(id=>snapshot.records.find(r=>r.id===id)?.team||'?');
    entries.push({time:snapshot.records.find(r=>r.id===b.second)?.time||0,message:`第 ${b.round} 回合 · ${teams.join(' 对 ')} 战斗${b.winner?` · ${b.winner} 胜`:' · 对战中'}`});
  }
  entries.sort((a,b)=>b.time-a.time);
  $('log').innerHTML=entries.length?entries.map(e=>`<div>${time(e.time)} · ${esc(e.message)}</div>`).join(''):'<p class="notice">暂无记录</p>';
  $('judgeLog').innerHTML=snapshot.role==='host'?snapshot.log.map(e=>`<div>${time(e.time)} · ${esc(e.message)}</div>`).join(''):'';
}
$('openBattleTable').onclick=()=>{$('battleModal').classList.add('show');$('closeBattleTable').focus();};
$('openBattleTableJudge').onclick=$('openBattleTable').onclick;
$('closeBattleTable').onclick=()=>$('battleModal').classList.remove('show');
$('battleModal').onclick=e=>{if(e.target===$('battleModal'))$('battleModal').classList.remove('show');};
$('openHandHelp').onclick=()=>{$('handHelp').classList.add('show');$('closeHandHelp').focus();};
$('closeHandHelp').onclick=()=>$('handHelp').classList.remove('show');
$('handHelp').onclick=e=>{if(e.target===$('handHelp'))$('handHelp').classList.remove('show');};
$('closeDefenderModal').onclick=()=>$('defenderModal').classList.remove('show');
$('defenderModal').onclick=e=>{if(e.target===$('defenderModal'))$('defenderModal').classList.remove('show');};
document.querySelectorAll('[data-game-view]').forEach(button=>button.onclick=()=>setGameView(button.dataset.gameView));
$('zoomOut').onclick=()=>changeMapZoom(mapZoom-.25);
$('zoomReset').onclick=()=>changeMapZoom(1);
$('zoomIn').onclick=()=>changeMapZoom(mapZoom+.25);
setGameView('map');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('battleModal').classList.remove('show');$('handHelp').classList.remove('show');$('defenderModal').classList.remove('show');}});
if('ResizeObserver' in window)new ResizeObserver(fitMap).observe(document.querySelector('.mapViewport'));
else window.addEventListener('resize',fitMap);
if(session)refresh();else showLobby('请从游戏房间页面进入');setInterval(refresh,1000);
