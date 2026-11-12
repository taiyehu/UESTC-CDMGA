const roomCode=new URLSearchParams(location.search).get('room');
let session=/^[A-F0-9]{8}$/.test(roomCode||'')?{code:roomCode}:null;
let snapshot=null,selected=null,moving=false,seenRecords=null,introTimer=null;
let preview=null,detailPreview=null,moveKind='normal',seenEffects=null,seenMoney=null,seenIncome=null,seenExtra=null,seenFlows=null,effectQueue=[],effectActive=false,effectTimer=null;
let resourceQueue=[],resourceActive=false,resourceTimer=null,ghostRevealTeam=null,replayTimer=null,replayBusy=false,liveOtherQueue=[],liveOtherBusy=false;
let seenBattles=null,battleQueue=[],battleActive=false,battleTimer=null;
let cardFlowQueue=[],cardFlowBusy=false,cardFlowEpoch=0;const drawingCardIds=new Set();
let bidDraft='0',bidAuctionId=null;
let mapZoom=1;
const animations={},animationTimers={};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=n=>new Date(n).toLocaleTimeString('zh-CN',{hour12:false});
async function api(method,path,data){
  const r=await fetch('/game-api'+path,{method,credentials:'same-origin',headers:{'content-type':'application/json'},body:data?JSON.stringify(data):undefined});
  const j=await r.json();if(!r.ok)throw Error(j.error||'请求失败');return j;
}
function fail(e){alert(e.message||String(e));}
function save(){}
function showLobby(error=''){document.body.classList.remove('playing');$('battleModal').classList.remove('show');$('handHelp').classList.remove('show');$('lobby').hidden=false;$('game').hidden=true;$('lobbyError').textContent=error;}
function showGame(){const opening=$('game').hidden;document.body.classList.add('playing');document.body.dataset.gameView||='map';$('lobby').hidden=true;$('game').hidden=false;$('roomLabel').textContent=`房间 ${session.code} · ${snapshot.role==='host'?'裁判':snapshot.teamId+' 队'}${snapshot.canAct?'':' · 观战'}`;if(opening)requestAnimationFrame(fitMap);}
function fitMap(){
  const viewport=document.querySelector('.mapViewport'),map=viewport.querySelector('.mapWrap');
  const availableWidth=viewport.clientWidth,availableHeight=viewport.clientHeight;
  if(!availableWidth||!availableHeight)return;
  const mobile=matchMedia('(max-width:700px), (max-width:950px) and (max-height:520px)').matches;
  const width=Math.floor(mobile?availableWidth*mapZoom:Math.min(availableWidth,availableHeight*1640/1510));
  map.style.width=width+'px';map.style.height=Math.floor(width*1510/1640)+'px';
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
  try {const next=await api('GET',`/rooms/${session.code}`);if(!snapshot||snapshot.version!==next.version)ingest(next); $('sync').textContent='已同步 '+time(Date.now());}
  catch(e){session=null;showLobby(e.message);}
}
function ingest(next){
  if(snapshot&&snapshot.resetCount!==next.resetCount){
    selected=null;preview=null;detailPreview=null;moving=false;seenRecords=null;seenEffects=null;seenMoney=null;seenIncome=null;seenExtra=null;seenFlows=null;effectQueue=[];resourceQueue=[];cardFlowQueue=[];cardFlowEpoch++;cardFlowBusy=false;drawingCardIds.clear();$('cardMotion').innerHTML='';$('pileNotice').classList.remove('show');
    if(effectTimer)clearTimeout(effectTimer);effectTimer=null;
    if(resourceTimer)clearTimeout(resourceTimer);resourceTimer=null;resourceActive=false;document.querySelectorAll('.resourceDelta').forEach(el=>el.remove());
    if(battleTimer)clearTimeout(battleTimer);battleTimer=null;battleActive=false;battleQueue=[];seenBattles=null;$('battleIntro').classList.remove('show');
    if(replayTimer)clearTimeout(replayTimer);replayTimer=null;ghostRevealTeam=null;replayBusy=false;liveOtherQueue=[];liveOtherBusy=false;
    $('effectIntro').classList.remove('show');effectActive=false;
    for(const id of 'ABC'){if(animationTimers[id])clearTimeout(animationTimers[id]);delete animationTimers[id];delete animations[id];}
  }
  let freshEffects=[],freshResources=[],freshFlows=[],freshBattles=[];
  if(seenEffects===null)seenEffects=new Set(next.effects.map(e=>e.id));
  else for(const event of next.effects)if(!seenEffects.has(event.id)){seenEffects.add(event.id);freshEffects.push(event);}
  if(seenMoney===null)seenMoney=new Set(next.moneyChanges.map(e=>e.id));
  else for(const change of next.moneyChanges)if(!seenMoney.has(change.id)){seenMoney.add(change.id);freshResources.push({...change,kind:'金钱'});}
  if(seenIncome===null)seenIncome=new Set(next.incomeChanges.map(e=>e.id));
  else for(const change of next.incomeChanges)if(!seenIncome.has(change.id)){seenIncome.add(change.id);freshResources.push({...change,kind:'收入'});}
  freshResources.sort((a,b)=>a.time-b.time);
  if(seenFlows===null)seenFlows=new Set(next.cardFlows.map(e=>e.id));
  else for(const flow of next.cardFlows)if(!seenFlows.has(flow.id)){seenFlows.add(flow.id);if(next.role==='team')freshFlows.push(flow);}
  if(seenBattles===null)seenBattles=new Set(next.battles.map(b=>b.id));
  else for(const battle of next.battles)if(!seenBattles.has(battle.id)){
    seenBattles.add(battle.id);
    const participants=[battle.first,battle.second].map(id=>next.records.find(r=>r.id===id)?.team);
    if(next.role==='team'&&participants.includes(next.teamId))freshBattles.push({...battle,participants});
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
  effectQueue.push(...freshEffects);resourceQueue.push(...freshResources);battleQueue.push(...freshBattles);
  if(newRound){sessionStorage.setItem(introKey,String(introRound));showRoundIntro(introRound,next.records.filter(r=>r.round===introRound&&r.team!==next.teamId).sort((a,b)=>a.order-b.order));}
  showNextEffect();showNextResource();showNextBattle();playNextCardFlow();
}
function showNextEffect(){
  if(effectActive||battleActive||resourceActive||$('roundIntro').classList.contains('show')||!effectQueue.length)return;
  effectActive=true;const e=effectQueue.shift(),el=$('effectIntro');
  el.innerHTML=`<div class="effectStage"><div class="effectTitle">${e.kind==='event'?'触发事件':'触发厄运'}</div><p>${esc(e.team)} 队</p><div class="effectCards">${e.cards.length?e.cards.map(c=>`<img src="${c.image}" alt="${esc(c.name)}">`).join(''):`<strong>${e.kind==='event'?'事件':'厄运'}已抵消</strong>`}</div></div>`;
  el.classList.add('show');
  effectTimer=setTimeout(()=>{el.classList.remove('show');effectActive=false;effectTimer=null;showNextEffect();showNextResource();showNextBattle();playNextCardFlow();},2400);
}
function showNextResource(){
  if(resourceActive||battleActive||effectActive||$('roundIntro').classList.contains('show')||!resourceQueue.length)return;
  resourceActive=true;const change=resourceQueue.shift(),row=document.querySelector(`[data-resource-team="${change.team}"]`);
  const el=document.createElement('span');el.className=`resourceDelta ${change.amount>0?'gain':'loss'}`;
  el.textContent=`${change.kind} ${change.amount>0?'+':''}${change.amount}`;
  el.title=change.reason;
  if(row)row.appendChild(el);
  resourceTimer=setTimeout(()=>{el.remove();resourceActive=false;resourceTimer=null;showNextEffect();showNextResource();showNextBattle();playNextCardFlow();},1200);
}
function showNextBattle(){
  if(battleActive||resourceActive||effectActive||!battleQueue.length||$('roundIntro').classList.contains('show'))return;
  battleActive=true;const battle=battleQueue.shift(),el=$('battleIntro');
  el.innerHTML=`<div class="battleStage"><strong>触发战斗</strong><span>${esc(battle.participants[0])} 队 ⚔ ${esc(battle.participants[1])} 队</span><small>第 ${battle.round} 回合 · ${esc(battle.node)}</small></div>`;
  el.classList.add('show');
  battleTimer=setTimeout(()=>{el.classList.remove('show');battleActive=false;battleTimer=null;showNextEffect();showNextResource();showNextBattle();},1800);
}
function showRoundIntro(round,records=[]){
  const el=$('roundIntro');if(introTimer)clearTimeout(introTimer);
  liveOtherQueue=[];liveOtherBusy=false;
  el.textContent=`第 ${round} 回合`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
  introTimer=setTimeout(()=>{el.classList.remove('show');replayOtherTeams(records,round);showNextEffect();showNextResource();showNextBattle();playNextCardFlow();},1500);
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
  if(cardFlowBusy||!cardFlowQueue.length||effectActive||resourceActive||$('roundIntro').classList.contains('show'))return;
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
async function action(path,data){try{const next=await api('POST',`/rooms/${session.code}/${path}`,data);ingest(next);return true;}catch(e){fail(e);return false;}}
function render(){showGame();$('judgePanel').hidden=snapshot.role!=='host';$('cards').hidden=snapshot.role==='host';$('rightTitle').textContent=snapshot.role==='host'?'裁判控制':'手牌';$('openHandHelp').hidden=snapshot.role==='host';document.querySelector('[data-game-view="judge"]').hidden=snapshot.role!=='host';document.querySelector('[data-game-view="hand"]').hidden=snapshot.role==='host';if(snapshot.role==='host'&&document.body.dataset.gameView==='hand'||snapshot.role!=='host'&&document.body.dataset.gameView==='judge')setGameView('map');renderSummary();renderMap();renderEndgame();renderTurnControls();renderCards();renderPiles();renderPreview();renderPending();$('actionDock').hidden=snapshot.role==='host'&&!snapshot.pendingAuction&&!snapshot.pendingMisfortuneChoice;renderHistory();renderTable();renderTestTools();renderLog();if(!snapshot.canAct)document.querySelectorAll('#actionDock button, #cards button, #judgePanel button').forEach(el=>{el.disabled=true;el.title='本队仅指定操作者可操作';});}
function renderEndgame(){
  const banner=$('endgameBanner'),endgame=snapshot.endgame;
  if(!endgame?.result&&!endgame?.provisional?.length){banner.hidden=true;return;}
  banner.hidden=false;
  if(endgame.result?.reason==='goal')banner.textContent=`比赛结束 · ${endgame.result.winner} 队第 ${endgame.result.qualifyingRound} 轮达标获胜`;
  else if(endgame.result?.reason==='time_limit'||endgame.result?.reason==='manual')banner.textContent=`${endgame.result.reason==='time_limit'?'比赛时间到':'裁判结束比赛'} · ${endgame.result.ranking.map(row=>`第 ${row.rank} 名 ${row.team} 队 ${row.score} 分`).join(' · ')}`;
  else banner.textContent=`暂定达标：${endgame.provisional.map(row=>`${row.team} 队第 ${row.round} 轮达到 ${row.score} 分`).join('、')} · 等待相关轮次和战斗结清`;
}
function buffs(t){return [t.eventShield?`事件抵消 ×${t.eventShield}`:'',t.misfortuneShield?`厄运抵消 ×${t.misfortuneShield}`:'',t.debuffShield?`debuff 抵消 ×${t.debuffShield}`:'',t.nextBattleModifier?`下次战斗 ${t.nextBattleModifier} 分`:'',t.loanActive?'快速贷款还款':'',t.maxCardUses>1?'每回合可用 2 张牌':'',t.arcaeaVisitIncome?'造访 Arcaea 获得收入':'',t.fanshiVisitMoney?`造访范式 +${t.fanshiVisitMoney} 金钱`:'',t.discardAbility?'机械帮手弃牌':'',...(t.debuffs||[]).map(d=>`debuff：${d.name}`)].filter(Boolean).join(' · ')||'无';}
function activeBattle(id){
  return snapshot.battles.find(b=>b.status==='待结算'&&(snapshot.role==='host'||b.round===snapshot.teams[snapshot.teamId].round)&&
    [b.first,b.second].some(recordId=>snapshot.records.find(r=>r.id===recordId)?.team===id));
}
function renderSummary(){
  const ranked=[...'ABC'].sort((a,b)=>snapshot.teams[b].score-snapshot.teams[a].score||a.localeCompare(b));
  $('teamRoster').innerHTML=[...'ABC'].map(id=>{const t=snapshot.teams[id],rank=ranked.indexOf(id)+1,battle=activeBattle(id),bot=snapshot.botSeats?.[id];return `<button class="rosterTeam ${id===snapshot.teamId?'own':''} ${battle?'inBattle':''}" data-roster-team="${id}" aria-label="查看 ${id} 队信息"><span class="rosterHeading"><strong class="${id.toLowerCase()}">${id} 队${bot?` · ${bot==='steady'?'稳健人机':'进攻人机'}`:''}</strong><b>${t.score} 分</b></span><span><em class="rankBadge">${['1st','2nd','3rd'][rank-1]}</em> 第 ${t.round} 回合 · ${esc(t.position)}</span>${battle?'<span class="battleFlag">⚔ 对战中</span>':''}<small>Buff：${esc(buffs(t))}</small></button>`;}).join('');
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
    return `<div class="historyItem"><strong>${own?'':esc(r.team)+' 队 · '}第 ${r.round} 回合</strong><span>${esc(r.from)} → ${esc(r.node)}</span><small>移动：${esc(r.card?.name||'')} · ${r.card?.steps??'?'} 步</small><small>使用：${used?esc(used):r.cardSkipped?'无':'待选择'}</small>${r.event?`<small>事件：${esc(r.event.name)}</small>`:''}${r.misfortune?.length?`<small>厄运：${r.misfortune.map(c=>esc(c.name)).join('、')}</small>`:''}${r.houseAction?`<small>建筑：${esc(r.houseAction.detail)}</small>`:''}${battles.map(b=>`<small>战斗：${esc(b.status)}${b.winner?' · '+esc(b.winner)+' 胜':''}</small>`).join('')}</div>`;
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
    if(!el){el=document.createElement('div');el.id='marker-'+id;el.className='marker '+id;el.textContent=id;$('markers').appendChild(el);}
    const view=snapshot.mapView[id],[x,y]=snapshot.pos[node];
    el.classList.toggle('ghost',view.ghost);el.classList.toggle('ghostReveal',ghostRevealTeam===id);el.classList.toggle('inBattle',!!activeBattle(id));el.style.left=(x/16.4+(i-ids.length/2+.5)*1.5)+'%';el.style.top=y/15.1+'%';
    el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label',`查看 ${id} 队信息`);
    el.onclick=()=>showTeamInfo(id);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showTeamInfo(id);}};
    el.title=view.ghost?`${id} 队当前第 ${view.actualRound} 回合 · 尚未进行本队第 ${snapshot.teams[snapshot.teamId].round} 回合 · 实时位置 ${node}`:
      snapshot.role==='team'&&id!==snapshot.teamId?`${id} 队第 ${snapshot.teams[snapshot.teamId].round} 回合位置 ${node} · 当前第 ${view.actualRound} 回合`:`${id} 队第 ${view.actualRound} 回合 · ${node}`;
  });
  const ids=snapshot.role==='host'?[...'ABC']:[...'ABC'].filter(id=>id!==snapshot.teamId);
  $('roundStatus').innerHTML=`<strong>${snapshot.role==='host'?'队伍回合':'其他队伍回合'}</strong>`+ids.map(id=>`<span>${id} 队 · 第 ${snapshot.teams[id].round} 回合${snapshot.teams[id].awaitingEnd?'（待结束）':''}</span>`).join('');
}
function showTeamInfo(id){
  const t=snapshot.teams[id];
  $('teamInfo').innerHTML=`<div class="teamInfoBody"><button id="closeTeamInfo" aria-label="关闭">×</button><h2 class="${id.toLowerCase()}">${id} 队</h2><p>第 ${t.round} 回合 · ${esc(t.position)}</p><p>积分 ${t.score}${activeBattle(id)?' · 对战中':''}</p><p>已有 Buff：${esc(buffs(t))}</p></div>`;
  $('teamInfo').classList.add('show');$('closeTeamInfo').onclick=()=>{$('teamInfo').classList.remove('show');};
}
function renderTurnControls(){
  if(snapshot.role!=='team'){$('turnControls').innerHTML='';return;}
  if(snapshot.endgame?.result){$('turnControls').innerHTML='<div class="turnState">比赛已结束，房间仅供查看</div>';return;}
  const t=snapshot.teams[snapshot.teamId];
  if(!t.awaitingEnd){$('turnControls').innerHTML=`<div class="turnState">第 ${t.round} 回合 · 请选择手牌移动</div>`;return;}
  if(t.pendingChallenge){$('turnControls').innerHTML='<div class="turnState">挑战已提交 · 等待裁判判定</div>';return;}
  if(t.pendingTeleport){
    $('turnControls').innerHTML=`<div class="turnState">巧夺先机：选择传送目的地 <select id="teleportNode">${Object.keys(snapshot.graph).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select><button id="teleportNow">传送</button></div>`;
    $('teleportNow').onclick=()=>action('teleport',{node:$('teleportNode').value});return;
  }
  if(t.pendingExtraMove){$('turnControls').innerHTML='<div class="turnState">言而无信：选择一张手牌额外移动（不触发格子与战斗）</div>';return;}
  if(t.pendingTarget){$('turnControls').innerHTML=`<div class="turnState">诈骗交易：选择另一支队伍<div class="testActions">${'ABC'.split('').filter(id=>id!==snapshot.teamId).map(id=>`<button data-card-target="${id}">${id} 队</button>`).join('')}</div></div>`;document.querySelectorAll('[data-card-target]').forEach(el=>el.onclick=()=>action('card-target',{target:el.dataset.cardTarget}));return;}
  if(t.pendingReroll){const prizes=[10,25,50,100,150,200];$('turnControls').innerHTML=`<div class="turnState">魔幻饰品：首次掷出 ${t.pendingReroll.firstRoll}，可获得 ${prizes[t.pendingReroll.firstRoll-1]} 金钱<div class="testActions"><button id="keepRoll">保留</button><button id="rerollCard">重掷一次</button></div></div>`;$('keepRoll').onclick=()=>action('card-reroll',{again:false});$('rerollCard').onclick=()=>action('card-reroll',{again:true});return;}
  if(!t.cardActionDone){
    const blocked=!!animations[snapshot.teamId]||!!snapshot.pendingAuction||!!snapshot.pendingMisfortuneChoice;
    const remaining=t.maxCardUses-t.cardUsesThisRound;
    $('turnControls').innerHTML=`<div class="turnState">第 ${t.round} 回合 · 还可使用 ${remaining} 张适用手牌 <button id="skipUse" ${blocked?'disabled':''}>${t.cardUsesThisRound?'不再使用':'不使用卡牌'}</button></div>`;
    $('skipUse').onclick=()=>action('skip-use',{});return;
  }
  const blocked=!!animations[snapshot.teamId]||!!snapshot.pendingAuction||!!snapshot.pendingMisfortuneChoice;
  const house=snapshot.house.includes(t.position),effect=t.position==='Arcaea'?`支付 ${t.income+10} 金钱，收入永久 +10`:t.position==='范式起源'?'掷 d6 获得 10/25/50/100/150/200 金钱':'1 积分兑换 200 金钱';
  const canHouse=house&&!t.houseActionDone&&!blocked&&(t.position==='Arcaea'?t.money>=t.income+10:t.position==='Phigros'?t.score>=1:true);
  $('turnControls').innerHTML=`<div class="turnState">第 ${t.round} 回合结算完成 <div>${house?`<button id="houseAction" ${canHouse?'':'disabled'}>${t.houseActionDone?'建筑效果已使用':esc(t.position+'：'+effect)}</button> `:''}<button id="endTurn" ${blocked?'disabled':''}>结束回合</button></div></div>`;
  if($('houseAction'))$('houseAction').onclick=()=>action('house-action',{});
  $('endTurn').onclick=()=>action('end-turn',{});
}
function renderCards(){
  const own=snapshot.role==='team'?snapshot.teams[snapshot.teamId]:null;
  if(!own){$('cards').innerHTML='';$('route').textContent='';$('choices').innerHTML='';$('destinations').innerHTML='';return;}
  if(selected&&!own.hand.some(c=>c.id===selected.id))selected=null;
  $('cards').innerHTML=own.hand.map(c=>{const house=c.game_type==='fanshi'?'范式起源':c.game_type;const playable=own.awaitingEnd&&!own.cardActionDone&&!own.pendingChallenge&&!own.pendingTeleport&&!own.pendingExtraMove&&!own.pendingTarget&&!own.pendingReroll&&!snapshot.pendingAuction&&!snapshot.pendingMisfortuneChoice&&snapshot.house.includes(own.position)&&(c.game_type==='random'||house===own.position)&&own.money>=c.cost;return `<div class="card ${selected?.id===c.id?'selected':''} ${playable?'playable':''} ${drawingCardIds.has(c.id)?'drawing':''}" role="button" tabindex="0" data-card="${c.id}" title="${esc(c.name)}：${esc(c.effect)}"><img src="${c.image}" alt="${esc(c.name)}"><span class="cardBadge">${esc(c.name)} · ${c.move===7?'?':c.move} 步</span></div>`;}).join('');
  document.querySelectorAll('[data-card]').forEach(el=>{const choose=()=>{
    if(moving)return;
    const mode=own.pendingExtraMove?'extra':!own.awaitingEnd?'move':!own.cardActionDone&&!own.pendingChallenge&&!own.pendingTeleport&&!own.pendingTarget&&!own.pendingReroll?'use':own.canDiscard?'discard':'view';
    preview={cardId:el.dataset.card,mode};renderPreview();
  };el.onclick=choose;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};});
  if(snapshot.pendingAuction||snapshot.pendingMisfortuneChoice){$('route').textContent='';$('choices').innerHTML='';$('destinations').innerHTML='';return;}
  if(own.awaitingEnd&&!own.pendingExtraMove){selected=null;$('route').textContent='';$('choices').innerHTML='';$('destinations').innerHTML='';return;}
  if(!selected){$('route').textContent='';$('choices').innerHTML='';$('destinations').innerHTML='';return;}
  const steps=selected.move===7?(own.pendingRoll?.cardId===selected.id?own.pendingRoll.value:null):selected.move;
  if(steps===null){
    $('route').textContent='问号牌：先掷一颗 d6，骰子点数就是本次移动步数。';
    $('choices').innerHTML='<button id="rollCard">掷骰决定步数</button><button id="cancelMove">取消选牌</button>';
    $('destinations').innerHTML='';
    $('rollCard').onclick=()=>action('roll',{cardId:selected.id});
    $('cancelMove').onclick=()=>{selected=null;renderCards();};return;
  }
  const options=window.routes.reachable(snapshot.graph,snapshot.house,own.position,steps);
  const counts={};for(const o of options)counts[o.node]=(counts[o.node]||0)+1;
  const seen={};
  $('route').textContent=`第 ${own.round} 回合 · ${moveKind==='extra'?'额外移动 · ':''}${steps} 步 · ${Object.keys(counts).length} 个终点、${options.length} 条路线。`;
  $('choices').innerHTML=options.map((o,i)=>`<button data-option="${i}" ${moving?'disabled':''}>${esc(o.node)} <small>经 ${esc(o.route.join(' → '))}</small></button>`).join('')+
    `<button id="cancelMove" ${moving?'disabled':''}>取消选牌</button>`;
  $('destinations').innerHTML=options.map((o,i)=>{const [x,y]=snapshot.pos[o.node],n=seen[o.node]||0;seen[o.node]=n+1;const offset=n-(counts[o.node]-1)/2;return `<button class="destination" data-option="${i}" title="路线：${esc(own.position+' → '+o.route.join(' → '))}" style="left:${x/16.4+offset*3}%;top:${y/15.1+offset*2}%" ${moving?'disabled':''}>${esc(o.node)}${counts[o.node]>1?` ${n+1}`:''}</button>`;}).join('');
  document.querySelectorAll('[data-option]').forEach(el=>el.onclick=async()=>{
    if(moving)return;moving=true;renderCards();
    const choice=options[Number(el.dataset.option)];const cardId=selected.id;
    const ok=await action(moveKind==='extra'?'extra-move':'move',{cardId,route:choice.route});moving=false;
    if(ok)selected=null;renderCards();
  });
  $('cancelMove').onclick=()=>{selected=null;renderCards();};
}
function renderPiles(){
  const own=snapshot.role==='team'?snapshot.teams[snapshot.teamId]:null;
  $('piles').hidden=!own;if(!own)return;
  $('deckCount').textContent=own.deckCount;$('discardCount').textContent=own.discardCount;
  $('deckPile').classList.toggle('empty',own.deckCount===0);
  $('discardPile').classList.toggle('empty',own.discardCount===0);
  $('discardFace').innerHTML=own.discardTop?`<img src="${esc(own.discardTop.image)}" alt="${esc(own.discardTop.name)}">`:'—';
}
function renderPreview(){
  if(detailPreview){$('cardPreview').innerHTML=`<div class="previewBody"><img src="${esc(detailPreview.image)}" alt="${esc(detailPreview.name)}"><div><h2>${esc(detailPreview.name)}</h2><p>${esc(detailPreview.effect||'')}</p><div class="previewActions"><button id="backPreview">返回</button></div></div></div>`;$('cardPreview').classList.add('show');$('backPreview').onclick=()=>{detailPreview=null;renderPreview();};return;}
  if(!preview||snapshot?.role!=='team'){$('cardPreview').classList.remove('show');$('cardPreview').innerHTML='';return;}
  const own=snapshot.teams[snapshot.teamId],card=own.hand.find(c=>c.id===preview.cardId);
  if(!card){preview=null;renderPreview();return;}
  const house=card.game_type==='fanshi'?'范式起源':card.game_type;
  const usable=preview.mode!=='use'||(snapshot.house.includes(own.position)&&(card.game_type==='random'||house===own.position)&&own.money>=card.cost);
  const canPlay=preview.mode!=='view'&&usable&&!own.pendingTarget&&!own.pendingReroll&&!snapshot.pendingAuction&&!snapshot.pendingMisfortuneChoice;
  $('cardPreview').innerHTML=`<div class="previewBody"><img src="${card.image}" alt="${esc(card.name)}"><div><h2>${esc(card.name)}</h2><p>${esc(card.effect)}</p><p>条件：${esc(card.condition)}</p><p>费用：${card.cost} 金钱 · ${preview.mode==='move'?'移动':preview.mode==='extra'?'额外移动':preview.mode==='discard'?'弃牌':'使用'}${!usable?'（房屋不匹配或金钱不足）':''}</p><div class="previewActions"><button id="playPreview" ${canPlay?'':'disabled'}>打出</button><button id="backPreview">返回</button></div></div></div>`;
  $('cardPreview').classList.add('show');
  $('backPreview').onclick=()=>{preview=null;renderPreview();};
  $('playPreview').onclick=async()=>{
    if(!canPlay)return;const {cardId,mode}=preview;preview=null;renderPreview();
    if(mode==='move'||mode==='extra'){selected=card;moveKind=mode;setGameView('map');renderCards();return;}
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
    const move=cardButton(r.card,`移动：${r.card.name} · ${r.card.steps} 步`,`移动 ${r.card.steps} 步`);
    const played=r.usedCards?.length?r.usedCards:r.usedCard?[r.usedCard]:[];
    const used=played.length?played.map(c=>`${cardButton(c,`使用：${c.name} · ${c.result}`,c.effect)}<p class="recordEffect">${esc(c.effect)}</p>`).join(''):`<span class="muted">使用：${r.cardSkipped?'无':'待选择'}</span>`;
    const event=r.event?`<div>${cardButton(r.event,`事件：${r.event.name}`,r.event.effect||'')}</div>`:'';
    const mis=(r.misfortune||[]).map(c=>`<div>${cardButton(c,`厄运：${c.name}`,c.effect||'')}</div>`).join('');
    return `<td><b>${esc(r.node)}</b>${snapshot.battles.some(b=>b.status==='待结算'&&(b.first===r.id||b.second===r.id))?'<span class="battleFlag"> ⚔ 对战中</span>':''}<br><span class="muted">${time(r.time)} · 格子金钱 ${r.moneyDelta>=0?'+':''}${r.moneyDelta}</span><div>${move}</div><div>${used}</div>${r.houseAction?`<p class="recordEffect">建筑：${esc(r.houseAction.detail)}</p>`:''}${event}${mis}</td>`;
  }).join('')}</tr>`).join(''):'<tr><td colspan="4" class="muted">暂无移动记录</td></tr>';
  document.querySelectorAll('[data-table-card]').forEach(el=>el.onclick=()=>{detailPreview=previews[Number(el.dataset.tableCard)];renderPreview();});
  $('battles').innerHTML=snapshot.battles.map(b=>{
    const a=snapshot.records.find(r=>r.id===b.first)?.team, c=snapshot.records.find(r=>r.id===b.second)?.team;
    return `<div class="battle ${b.status==='已结算'?'settled':''}">第 ${b.round} 轮 · ${esc(b.node)} · ${a||'?'} 对 ${c||'?'} · ${b.status}${b.winner?' · '+b.winner+' 胜':''}${snapshot.role==='host'&&b.status==='待结算'?`<div><button data-battle="${b.id}" data-winner="${a}">${a} 胜</button><button data-battle="${b.id}" data-winner="${c}">${c} 胜</button></div>`:''}</div>`;
  }).join('');
  document.querySelectorAll('[data-battle]').forEach(el=>el.onclick=()=>action('battle',{id:el.dataset.battle,winner:el.dataset.winner}));
  const challenges=snapshot.role==='host'?Object.entries(snapshot.challenges||{}).map(([id,c])=>`<div class="battle"><b>${id} 队使用「${esc(c.card.name)}」</b><p class="notice">挑战条件：${esc(c.card.condition)}</p>${c.debuffs?.length?`<p class="notice">本次 debuff：${c.debuffs.map(d=>esc(d.effect)).join('；')}</p>`:''}<button data-challenge="${id}" data-success="true">挑战成功</button> <button data-challenge="${id}" data-success="false">挑战失败</button></div>`).join(''):'';
  $('hostTools').innerHTML=snapshot.role==='host'?`<h3>待判定的卡牌挑战</h3>${challenges||'<p class="notice">暂无</p>'}<h3>裁判调分</h3><div class="scoreTools">`+ 'ABC'.split('').map(id=>`<button data-score="${id}" data-value="-2">${id} −2</button><button data-score="${id}" data-value="1">${id} +1</button><button data-score="${id}" data-value="2">${id} +2</button>`).join('')+'</div>':'';
  document.querySelectorAll('[data-challenge]').forEach(el=>el.onclick=()=>action('resolve-challenge',{team:el.dataset.challenge,success:el.dataset.success==='true'}));
  document.querySelectorAll('[data-score]').forEach(el=>el.onclick=()=>action('score',{team:el.dataset.score,value:Number(el.dataset.value)}));
}
function renderPending(){
  const choice=snapshot.pendingMisfortuneChoice;
  if(choice){
    const id=snapshot.teamId;
    const cards=choice.cards.map((c,i)=>`<div class="drawnCard"><img src="${c.image}" alt="${esc(c.name)}"><span>${esc(c.name)}${id===choice.target?`<br><button data-misfortune-pick="${i}">选择这张</button>`:''}</span></div>`).join('');
    const targets=id===choice.triggerTeam&&!choice.target?`<div class="testActions">${'ABC'.split('').filter(x=>x!==id).map(x=>`<button data-misfortune-target="${x}">指定 ${x} 队选牌</button>`).join('')}</div>`:'';
    $('pendingAction').innerHTML=`<div class="battle"><b>${esc(choice.triggerTeam)} 队停在厄运 B，抽两张厄运</b><p class="notice">${choice.target?`等待 ${esc(choice.target)} 队选择一张让 ${esc(choice.triggerTeam)} 队承受`:'触发队指定另一队选牌'}</p>${cards}${targets}</div>`;
    document.querySelectorAll('[data-misfortune-target]').forEach(el=>el.onclick=()=>action('misfortune-target',{target:el.dataset.misfortuneTarget}));
    document.querySelectorAll('[data-misfortune-pick]').forEach(el=>el.onclick=()=>action('misfortune-pick',{index:Number(el.dataset.misfortunePick)}));
    return;
  }
  const auction=snapshot.pendingAuction;
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
    if(r.event)lines.push({time:r.time,message:`${r.team} 队事件：${r.event.name}`});
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
document.querySelectorAll('[data-game-view]').forEach(button=>button.onclick=()=>setGameView(button.dataset.gameView));
$('zoomOut').onclick=()=>changeMapZoom(mapZoom-.25);
$('zoomReset').onclick=()=>changeMapZoom(1);
$('zoomIn').onclick=()=>changeMapZoom(mapZoom+.25);
setGameView('map');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('battleModal').classList.remove('show');$('handHelp').classList.remove('show');}});
if('ResizeObserver' in window)new ResizeObserver(fitMap).observe(document.querySelector('.mapViewport'));
else window.addEventListener('resize',fitMap);
if(session)refresh();else showLobby('请从游戏房间页面进入');setInterval(refresh,1000);
