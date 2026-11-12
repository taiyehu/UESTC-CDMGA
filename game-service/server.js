const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const game = require('./game');
const bot = require('./bot');

const springJdbcUrl = process.env.SPRING_DATASOURCE_URL || '';
const springDatabase = /^jdbc:mysql:\/\/[^/]+\/([^?]+)/.exec(springJdbcUrl)?.[1];

const pool = mysql.createPool({
  host: process.env.GAME_DB_HOST || '127.0.0.1',
  port: Number(process.env.GAME_DB_PORT || 3306),
  user: process.env.GAME_DB_USER || process.env.SPRING_DATASOURCE_USERNAME,
  password: process.env.GAME_DB_PASSWORD || process.env.SPRING_DATASOURCE_PASSWORD,
  database: process.env.GAME_DB_NAME || springDatabase || 'CDMGA',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+08:00',
});
const spring = process.env.GAME_IDENTITY_URL || 'http://127.0.0.1:8080/api/identity/me';
const send = (res, status, value) => {res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(JSON.stringify(value));};
const fail = (status, message) => Object.assign(new Error(message), {status});
function body(req) { return new Promise((resolve,reject) => {
  let s=''; req.on('data', chunk => {s+=chunk; if(s.length>25000){reject(fail(413,'请求过大'));req.destroy();}});
  req.on('end',()=>{try {resolve(s?JSON.parse(s):{});} catch {reject(fail(400,'JSON 格式错误'));}});
});}
async function identity(req) {
  const cookie=req.headers.cookie || '';
  if(!cookie) throw fail(401,'请先登录');
  const response=await fetch(spring,{headers:{cookie},signal:AbortSignal.timeout(5000)});
  if(!response.ok) throw fail(401,'登录状态已失效');
  const result=await response.json();
  const user=result?.data;
  if(result?.code!==0 || !Number.isInteger(Number(user?.id))) throw fail(401,'请先登录');
  return {id:Number(user.id),role:user.role,account:user.account};
}
const json = value => typeof value==='string'?JSON.parse(value):value;
async function readRoom(code, db=pool) {
  const [rows]=await db.query('SELECT r.*, c.title AS course_title, c.category AS course_category, c.end_time AS course_end_time FROM game_room r JOIN course c ON c.id=r.course_id WHERE r.code=?',[code]);
  if(!rows.length)throw fail(404,'房间不存在');
  const room=rows[0];
  const [seats]=await db.query('SELECT s.seat,s.team_id,s.operator_identity_id,i.account AS operator_account,b.strategy AS bot_strategy FROM game_room_seat s LEFT JOIN identity i ON i.id=s.operator_identity_id LEFT JOIN game_room_bot b ON b.room_id=s.room_id AND b.team_id=s.team_id WHERE s.room_id=? ORDER BY s.seat',[room.id]);
  room.seats=seats;
  return room;
}
async function settleExpired(room){
  if(room.status!=='active'||!room.course_end_time||new Date(room.course_end_time).getTime()>Date.now())return;
  const db=await pool.getConnection();
  try{
    await db.beginTransaction();
    const [locked]=await db.query('SELECT status FROM game_room WHERE id=? FOR UPDATE',[room.id]);
    if(locked[0]?.status!=='active'){await db.rollback();room.status='ended';return;}
    const [rows]=await db.query('SELECT version,state_json FROM game_room_state WHERE room_id=? FOR UPDATE',[room.id]);
    if(!rows.length)throw Error('房间状态缺失');
    const state=game.hydrate(json(rows[0].state_json));
    state.deadlineAt=new Date(room.course_end_time).getTime();
    game.evaluateEnd(state);
    if(!state.result){await db.rollback();return;}
    const version=Number(rows[0].version)+1;
    await db.query('UPDATE game_room_state SET version=?,state_json=? WHERE room_id=?',[version,JSON.stringify(state),room.id]);
    await db.query("UPDATE game_room SET status='ended',ended_at=NOW() WHERE id=?",[room.id]);
    await db.commit();room.status='ended';
  }catch(error){await db.rollback();throw error;}finally{db.release();}
}
async function access(room, user, db=pool) {
  if(user.role==='admin'&&user.id===room.referee_identity_id) return {role:'host',canAct:true};
  const [rows]=await db.query('SELECT t.team_id FROM team t WHERE t.course_id=? AND t.identity_id=? AND t.team_id IS NOT NULL LIMIT 1',[room.course_id,user.id]);
  const seat=room.seats.find(s=>s.team_id===rows[0]?.team_id);
  if(!seat){
    if(room.status==='waiting')return {role:'spectator',canAct:false};
    throw fail(403,'你不是此房间的裁判或参赛队员');
  }
  return {role:'team',id:seat.seat,canAct:seat.operator_identity_id===user.id};
}
async function membership(userId, db=pool) {
  const [rows]=await db.query("SELECT r.code FROM team t JOIN course c ON c.id=t.course_id AND c.category='board_game' AND c.is_deleted=0 JOIN game_room r ON r.course_id=c.id AND r.status IN ('waiting','active') WHERE t.identity_id=? AND t.team_id IS NOT NULL LIMIT 1",[userId]);
  return rows[0]?.code||null;
}
async function waitingTeams(courseId, db=pool) {
  const [rows]=await db.query("SELECT t.id,t.team_id,t.identity_id,i.account,td.name AS titleName,td.tier AS titleTier,td.acquisition_method AS titleAcquisitionMethod,(SELECT pr.avatar FROM profile pr WHERE pr.identity_id=i.id AND pr.status=1 ORDER BY pr.id DESC LIMIT 1) AS avatar FROM team t JOIN identity i ON i.id=t.identity_id AND i.is_deleted=0 LEFT JOIN title_award ta ON ta.identity_id=i.id AND ta.status='approved' AND ta.is_equipped=1 LEFT JOIN title_definition td ON td.id=ta.title_id WHERE t.course_id=? AND t.team_id IS NOT NULL ORDER BY t.team_id,t.id",[courseId]);
  const teams=[];
  for(const row of rows){let team=teams.find(t=>t.teamId===row.team_id);if(!team){team={teamId:row.team_id,members:[]};teams.push(team);}team.members.push({id:row.identity_id,account:row.account,avatar:row.avatar,titleName:row.titleName,titleTier:row.titleTier,titleAcquisitionMethod:row.titleAcquisitionMethod});}
  const [bots]=await db.query('SELECT b.team_id,b.strategy FROM game_room_bot b JOIN game_room r ON r.id=b.room_id WHERE r.course_id=? ORDER BY b.team_id',[courseId]);
  return [...teams,...bots.map(row=>({teamId:row.team_id,botStrategy:row.strategy,members:[]}))].sort((a,b)=>a.teamId-b.teamId);
}
function publicRoom(room,who) {
  return {code:room.code,courseId:room.course_id,courseTitle:room.course_title,status:room.status,
    refereeIdentityId:room.referee_identity_id,initialMoney:room.initial_money,initialIncome:room.initial_income,
    seats:room.seats.map(s=>({seat:s.seat,teamId:s.team_id,operatorIdentityId:s.operator_identity_id,operatorAccount:s.operator_account,botStrategy:s.bot_strategy})),
    role:who.role,teamId:who.id||null,canAct:who.canAct};
}
const operations={roll:(r,w,b)=>game.roll(r,w,b.cardId),
  'use-card':(r,w,b)=>game.useCard(r,w,b.cardId),
  'skip-use':(r,w)=>game.skipUse(r,w),
  'resolve-challenge':(r,w,b)=>game.resolveChallenge(r,w,b.team,b.success),
  'card-target':(r,w,b)=>game.chooseCardTarget(r,w,b.target),
  'card-reroll':(r,w,b)=>game.resolveReroll(r,w,b.again),
  teleport:(r,w,b)=>game.teleport(r,w,b.node),
  'extra-move':(r,w,b)=>game.extraMove(r,w,b.cardId,b.route),
  'discard-card':(r,w,b)=>game.discardCard(r,w,b.cardId),
  'house-action':(r,w)=>game.houseAction(r,w),
  bid:(r,w,b)=>game.bid(r,w,b.amount),
  'misfortune-target':(r,w,b)=>game.misfortuneTarget(r,w,b.target),
  'misfortune-pick':(r,w,b)=>game.misfortunePick(r,w,b.index),
  move:(r,w,b)=>game.move(r,w,b.cardId,b.route),
  'reserve-member':(r,w,b)=>game.reserveMember(r,w,b.memberId),
  'end-turn':(r,w)=>game.endTurn(r,w),
  score:(r,w,b)=>game.score(r,w,b.team,b.value),
  battle:(r,w,b)=>game.battle(r,w,b.id,b.winner),
  reset:(r,w)=>game.reset(r,w)};
function staticFile(req,res,url) {
  let file;
  if(url.pathname==='/game-client/' || url.pathname==='/game-client')file=path.join(__dirname,'public/index.html');
  else if(/^\/game-client\/(app\.js|routes\.js|style\.css|movement\.css|map\.svg)$/.test(url.pathname))file=path.join(__dirname,'public',url.pathname.slice('/game-client/'.length));
  else if(/^\/game-assets\/cards\/output\/[a-zA-Z0-9_-]+\.png$/.test(url.pathname))file=path.join(process.env.GAME_CONTENT_DIR || path.join(__dirname,'content'),'output',path.basename(url.pathname));
  else return false;
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':types[path.extname(file)],'cache-control':file.endsWith('.html')?'no-store':'public, max-age=3600'});res.end(data);});
  return true;
}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(staticFile(req,res,url))return;
  if(!url.pathname.startsWith('/game-api/')){res.writeHead(404);res.end();return;}
  try {
    if(req.method==='GET'&&url.pathname==='/game-api/health') {
      await pool.query('SELECT 1 FROM game_room_bot LIMIT 0');
      await pool.query('SELECT actor_type FROM game_action_log LIMIT 0');
      return send(res,200,{status:'ok'});
    }
    const user=await identity(req);
    if(req.method==='GET'&&url.pathname==='/game-api/catalog') {
      const [courses]=await pool.query("SELECT id,title,description,image,referee_identity_id FROM course WHERE category='board_game' AND is_deleted=0 ORDER BY id DESC");
      if(user.role!=='admin')return send(res,200,{courses});
      const [teams]=await pool.query("SELECT t.course_id,t.team_id,t.identity_id,i.account FROM team t JOIN identity i ON i.id=t.identity_id WHERE t.team_id IS NOT NULL AND i.is_deleted=0 AND t.course_id IN (SELECT id FROM course WHERE category='board_game' AND is_deleted=0) ORDER BY t.course_id,t.team_id,t.identity_id");
      return send(res,200,{courses,teams});
    }
    if(req.method==='GET'&&url.pathname==='/game-api/rooms') {
      const [rows]=await pool.query("SELECT r.id,r.code,r.course_id,r.status,c.title AS course_title,c.description AS course_description,c.image AS course_image,r.referee_identity_id,(SELECT COUNT(DISTINCT t.team_id) FROM team t WHERE t.course_id=r.course_id AND t.team_id IS NOT NULL)+(SELECT COUNT(*) FROM game_room_bot b WHERE b.room_id=r.id) AS team_count FROM game_room r JOIN course c ON c.id=r.course_id WHERE c.category='board_game' AND c.is_deleted=0 ORDER BY r.id DESC");
      return send(res,200,{rooms:rows,myRoomCode:await membership(user.id)});
    }
    if(req.method==='POST'&&url.pathname==='/game-api/rooms') {
      throw fail(405,'房间在发布桌游课题时自动创建');
    }
    const match=url.pathname.match(/^\/game-api\/rooms\/([A-F0-9]{8})(?:\/(start|[a-z-]+))?$/);
    if(!match)throw fail(404,'接口不存在');
    const room=await readRoom(match[1]);
    const who=await access(room,user);
    await settleExpired(room);
    if(req.method==='GET'&&match[2]==='details'){
      const other=await membership(user.id);
      if(other&&other!==room.code&&who.role!=='host')throw fail(409,`已于房间${other}中存在队伍`);
      const teams=room.status==='waiting'?await waitingTeams(room.course_id):[];
      return send(res,200,{...publicRoom(room,who),teams,myIdentityId:user.id,myTeamId:teams.find(t=>t.members.some(m=>m.id===user.id))?.teamId||null});
    }
    if(req.method==='POST'&&match[2]==='settings'){
      if(who.role!=='host')throw fail(403,'只有裁判可以设置房间');
      const b=await body(req),money=Number(b.initialMoney),income=Number(b.initialIncome);
      if(!Number.isSafeInteger(money)||money<0||money>1_000_000||!Number.isSafeInteger(income)||income<0||income>1_000_000)throw fail(400,'初始金钱和收入必须是 0 到 1000000 的整数');
      const db=await pool.getConnection();
      try{await db.beginTransaction();const [locked]=await db.query('SELECT status FROM game_room WHERE id=? FOR UPDATE',[room.id]);
        if(locked[0].status!=='waiting')throw fail(409,'游戏开始后不能修改房间设置');
        await db.query('UPDATE game_room SET initial_money=?,initial_income=? WHERE id=?',[money,income,room.id]);
        await db.commit();return send(res,200,{initialMoney:money,initialIncome:income});
      }catch(e){await db.rollback();throw e;}finally{db.release();}
    }
    if(req.method==='POST'&&match[2]==='add-bot'){
      if(who.role!=='host')throw fail(403,'只有裁判可以添加人机');
      const b=await body(req);
      if(!['steady','aggressive'].includes(b.strategy))throw fail(400,'请选择稳健或进攻人机');
      const db=await pool.getConnection();
      try{await db.beginTransaction();
        const [locked]=await db.query('SELECT status FROM game_room WHERE id=? FOR UPDATE',[room.id]);
        if(locked[0].status!=='waiting')throw fail(409,'游戏开始后不能添加人机');
        const teams=await waitingTeams(room.course_id,db);
        if(teams.length>=3||teams.filter(t=>t.botStrategy).length>=2)throw fail(409,'最多三支队伍，其中至多两支人机');
        const teamId=Math.max(0,...teams.map(t=>t.teamId))+1;
        await db.query('INSERT INTO game_room_bot(room_id,team_id,strategy) VALUES(?,?,?)',[room.id,teamId,b.strategy]);
        await db.commit();return send(res,200,{teams:await waitingTeams(room.course_id)});
      }catch(e){await db.rollback();throw e;}finally{db.release();}
    }
    if(req.method==='POST'&&['create-team','join-team','leave-team','disband-team'].includes(match[2])){
      const b=await body(req),db=await pool.getConnection();
      try{
        await db.beginTransaction();
        const [identityRows]=await db.query('SELECT id FROM identity WHERE id=? FOR UPDATE',[user.id]);
        if(!identityRows.length)throw fail(401,'登录状态已失效');
        const [locked]=await db.query('SELECT status FROM game_room WHERE id=? FOR UPDATE',[room.id]);
        if(locked[0].status!=='waiting')throw fail(409,'游戏开始后不能修改队伍');
        const teams=await waitingTeams(room.course_id,db);
        const mine=teams.find(t=>t.members.some(m=>m.id===user.id));
        const targetId=Number(b.teamId);
        if(match[2]==='create-team'||match[2]==='join-team'){
          if(user.id===room.referee_identity_id)throw fail(403,'裁判不能加入参赛队伍');
          if(mine)throw fail(409,'你已加入本房间的队伍');
          const other=await membership(user.id,db);
          if(other&&other!==room.code)throw fail(409,`已于房间${other}中存在队伍`);
          const teamId=match[2]==='create-team'?Math.max(0,...teams.map(t=>t.teamId))+1:targetId;
          if(match[2]==='create-team'&&teams.length>=3)throw fail(409,'房间最多有三个未解散的队伍');
          const target=teams.find(t=>t.teamId===teamId);
          if(match[2]==='join-team'&&(!target||target.botStrategy||target.members.length>=3))throw fail(400,'目标队伍不存在或已满');
          const [existing]=await db.query('SELECT id FROM team WHERE course_id=? AND identity_id=? LIMIT 1',[room.course_id,user.id]);
          if(existing.length)await db.query('UPDATE team SET team_id=?,is_touched=0 WHERE id=?',[teamId,existing[0].id]);
          else await db.query('INSERT INTO team(course_id,team_id,identity_id,is_touched) VALUES(?,?,?,0)',[room.course_id,teamId,user.id]);
        }else if(match[2]==='leave-team'){
          if(!mine)throw fail(400,'你当前不在任何队伍中');
          await db.query('UPDATE team SET team_id=NULL WHERE course_id=? AND identity_id=?',[room.course_id,user.id]);
        }else{
          const target=teams.find(t=>t.teamId===targetId);
          if(!target)throw fail(400,'队伍不存在');
          if(target.botStrategy){
            if(who.role!=='host')throw fail(403,'只有裁判可以移除人机');
            await db.query('DELETE FROM game_room_bot WHERE room_id=? AND team_id=?',[room.id,targetId]);
          }else{
          if(who.role!=='host'&&target.members[0].id!==user.id)throw fail(403,'只有队长或裁判可以解散队伍');
          await db.query('UPDATE team SET team_id=NULL WHERE course_id=? AND team_id=?',[room.course_id,targetId]);
          }
        }
        const updated=await waitingTeams(room.course_id,db);
        await db.commit();return send(res,200,{teams:updated,myTeamId:updated.find(t=>t.members.some(m=>m.id===user.id))?.teamId||null});
      }catch(e){await db.rollback();throw e;}finally{db.release();}
    }
    if(req.method==='POST'&&match[2]==='start') {
      if(who.role!=='host')throw fail(403,'只有裁判可以开始房间');
      const db=await pool.getConnection();
      try {await db.beginTransaction();const [locked]=await db.query('SELECT status FROM game_room WHERE id=? FOR UPDATE',[room.id]);
        if(locked[0].status!=='waiting')throw fail(409,'房间已经开始');
        const teams=await waitingTeams(room.course_id,db);
        if(teams.length!==3||teams.every(t=>t.botStrategy))throw fail(409,'需要三支队伍，且至少一支真人队伍才能开始游戏');
        if(teams.some(t=>t.members.some(m=>m.id===room.referee_identity_id)))throw fail(409,'裁判不能属于参赛队伍');
        const state=game.createRoom({initialMoney:room.initial_money,initialIncome:room.initial_income,deadlineAt:room.course_end_time?new Date(room.course_end_time).getTime():null});state.code=room.code;
        for(const [index,team] of teams.entries()){
          const seat='ABC'[index];
          await db.query('INSERT INTO game_room_seat(room_id,seat,team_id,operator_identity_id) VALUES(?,?,?,?)',[room.id,seat,team.teamId,team.botStrategy?null:team.members[0].id]);
          state.teams[seat].joined=true;
          state.teams[seat].members=team.botStrategy?Array.from({length:3},(_,i)=>({id:`bot-${seat}-${i+1}`,account:`${team.botStrategy==='steady'?'稳健':'进攻'}人机 ${i+1}`,avatar:null})):team.members.map(m=>({id:m.id,account:m.account,avatar:m.avatar}));
        }
        await db.query('INSERT INTO game_room_state(room_id,version,state_json) VALUES(?,?,?)',[room.id,state.version,JSON.stringify(state)]);
        await db.query("UPDATE game_room SET status='active',started_at=NOW() WHERE id=?",[room.id]);
        await db.commit();return send(res,200,{status:'active'});
      } catch(e){await db.rollback();throw e;} finally {db.release();}
    }
    if(req.method==='POST'&&match[2]==='end') {
      if(who.role!=='host')throw fail(403,'只有裁判可以结束房间');
      const db=await pool.getConnection();
      try {await db.beginTransaction();const [locked]=await db.query('SELECT status FROM game_room WHERE id=? FOR UPDATE',[room.id]);
        if(locked[0].status!=='active')throw fail(409,'房间不在进行中');
        const [states]=await db.query('SELECT version,state_json FROM game_room_state WHERE room_id=? FOR UPDATE',[room.id]);
        const state=game.hydrate(json(states[0].state_json));game.finishByScores(state,'manual');
        const version=Number(states[0].version)+1;
        await db.query('UPDATE game_room_state SET version=?,state_json=? WHERE room_id=?',[version,JSON.stringify(state),room.id]);
        await db.query('INSERT INTO game_action_log(room_id,seq,actor_identity_id,seat,action_type,payload_json,result_version) VALUES(?,?,?,NULL,?,?,?)',[room.id,version,user.id,'end','{}',version]);
        await db.query("UPDATE game_room SET status='ended',ended_at=NOW() WHERE id=?",[room.id]);
        await db.commit();return send(res,200,{status:'ended'});
      } catch(e){await db.rollback();throw e;} finally {db.release();}
    }
    if(room.status==='waiting')throw fail(409,'房间尚未开始');
    if(req.method==='GET'&&!match[2]) {
      const [rows]=await pool.query('SELECT state_json FROM game_room_state WHERE room_id=?',[room.id]);
      if(!rows.length)throw fail(500,'房间状态缺失');
      const state=game.state(game.hydrate(json(rows[0].state_json)),who);
      return send(res,200,{...state,botSeats:Object.fromEntries(room.seats.filter(s=>s.bot_strategy).map(s=>[s.seat,s.bot_strategy])),canAct:who.canAct&&room.status==='active'});
    }
    if(req.method==='POST'&&operations[match[2]]) {
      if(room.status!=='active')throw fail(409,'房间已结束');
      if(!who.canAct)throw fail(403,'本队只有指定操作者可以操作');
      const b=await body(req),db=await pool.getConnection();
      try {await db.beginTransaction();
        const [rows]=await db.query('SELECT version,state_json FROM game_room_state WHERE room_id=? FOR UPDATE',[room.id]);
        if(!rows.length)throw fail(500,'房间状态缺失');
        const state=game.hydrate(json(rows[0].state_json));
        state.deadlineAt=room.course_end_time?new Date(room.course_end_time).getTime():null;
        try {operations[match[2]](state,who,b);game.evaluateEnd(state);} catch(e){throw fail(400,e.message);}
        const version=Number(rows[0].version)+1;
        await db.query('UPDATE game_room_state SET version=?,state_json=? WHERE room_id=?',[version,JSON.stringify(state),room.id]);
        await db.query('INSERT INTO game_action_log(room_id,seq,actor_identity_id,seat,action_type,payload_json,result_version) VALUES(?,?,?,?,?,?,?)',[room.id,version,user.id,who.id||null,match[2],JSON.stringify(b),version]);
        if(state.result)await db.query("UPDATE game_room SET status='ended',ended_at=NOW() WHERE id=?",[room.id]);
        await db.commit();return send(res,200,{...game.state(state,who),botSeats:Object.fromEntries(room.seats.filter(s=>s.bot_strategy).map(s=>[s.seat,s.bot_strategy])),canAct:who.canAct&&!state.result});
      } catch(e){await db.rollback();throw e;} finally {db.release();}
    }
    throw fail(404,'接口不存在');
  } catch(e){send(res,e.status||500,{error:e.status?e.message:'服务器处理失败'});if(!e.status)console.error(e);}
});
let botTickRunning=false;
async function advanceBots(){
  if(botTickRunning)return;
  botTickRunning=true;
  try{
    const [expired]=await pool.query("SELECT r.id,c.end_time AS course_end_time,r.status FROM game_room r JOIN course c ON c.id=r.course_id WHERE r.status='active' AND c.end_time<=NOW()");
    for(const room of expired)await settleExpired(room);
    const [rooms]=await pool.query("SELECT DISTINCT r.id,c.end_time AS course_end_time FROM game_room r JOIN game_room_bot b ON b.room_id=r.id JOIN course c ON c.id=r.course_id WHERE r.status='active'");
    for(const room of rooms){
      const db=await pool.getConnection();
      try{await db.beginTransaction();
        const [states]=await db.query('SELECT version,state_json FROM game_room_state WHERE room_id=? FOR UPDATE',[room.id]);
        if(!states.length){await db.rollback();continue;}
        const [status]=await db.query('SELECT status FROM game_room WHERE id=? FOR UPDATE',[room.id]);
        if(status[0]?.status!=='active'){await db.rollback();continue;}
        const [seats]=await db.query('SELECT s.seat,s.operator_identity_id,b.strategy FROM game_room_seat s LEFT JOIN game_room_bot b ON b.room_id=s.room_id AND b.team_id=s.team_id WHERE s.room_id=? ORDER BY s.seat',[room.id]);
        const state=game.hydrate(json(states[0].state_json));
        state.deadlineAt=room.course_end_time?new Date(room.course_end_time).getTime():null;
        const humanSeats=seats.filter(s=>s.operator_identity_id!==null).map(s=>s.seat);
        let action,seat;
        for(const candidate of seats.filter(s=>s.strategy)){
          action=bot.choose(state,candidate.seat,candidate.strategy,humanSeats);
          if(action){seat=candidate.seat;break;}
        }
        if(!action){await db.rollback();continue;}
        operations[action.type](state,{role:'team',id:seat},action.payload);
        game.evaluateEnd(state);
        const version=Number(states[0].version)+1;
        await db.query('UPDATE game_room_state SET version=?,state_json=? WHERE room_id=?',[version,JSON.stringify(state),room.id]);
        await db.query("INSERT INTO game_action_log(room_id,seq,actor_identity_id,actor_type,seat,action_type,payload_json,result_version) VALUES(?,?,NULL,'bot',?,?,?,?)",[room.id,version,seat,action.type,JSON.stringify(action.payload),version]);
        if(state.result)await db.query("UPDATE game_room SET status='ended',ended_at=NOW() WHERE id=?",[room.id]);
        await db.commit();
      }catch(error){await db.rollback();console.error('Bot action failed for room',room.id,error);}finally{db.release();}
    }
  }catch(error){console.error('Bot scheduler failed',error);}finally{botTickRunning=false;}
}
if(require.main===module)server.listen(Number(process.env.GAME_PORT||3001),process.env.GAME_HOST||'127.0.0.1',()=>{
  console.log('Board game service ready');
  setInterval(advanceBots,3000).unref();
});
module.exports={server,pool};
