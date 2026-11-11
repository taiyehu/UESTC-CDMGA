const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const mysql=require('mysql2/promise');
const {reachable}=require('./public/routes');

const base='http://127.0.0.1:3001';
const spring='http://127.0.0.1:8080';
const pool=mysql.createPool({host:'127.0.0.1',user:process.env.SPRING_DATASOURCE_USERNAME,password:process.env.SPRING_DATASOURCE_PASSWORD,database:'cdmga_dev'});
const suffix=crypto.randomBytes(4).toString('hex');
const password=crypto.randomBytes(16).toString('base64url');
const users=[];let courseId=null,roomCode=null,secondary=null;

async function http(root,path,method='GET',data,cookie){
  const res=await fetch(root+path,{method,headers:{...(data!==undefined?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:data===undefined?undefined:JSON.stringify(data)});
  const raw=await res.text();let value;try{value=JSON.parse(raw)}catch{value=raw}
  return {status:res.status,value,cookie:res.headers.get('set-cookie')?.split(';')[0]};
}
async function account(name){
  const loginName=`bg_${suffix}_${name}`;
  const registered=await http(spring,'/api/identity/register','POST',{account:loginName,password});
  assert.equal(registered.value.code,0,JSON.stringify(registered.value));
  const id=registered.value.data.id;users.push(id);
  return {id,name:loginName};
}
async function login(user){
  const result=await http(spring,'/api/identity/login','POST',{account:user.name,password});
  assert.equal(result.value.code,0,JSON.stringify(result.value));
  assert.ok(result.cookie?.startsWith('JSESSIONID='));
  user.cookie=result.cookie;
}
async function game(path,method,data,user,root=base){return http(root,path,method,data,user?.cookie)}
async function waitForServer(root, user){let last='';for(let i=0;i<30;i++){try{const r=await game('/game-api/rooms','GET',undefined,user,root);if(r.status===200)return;last=JSON.stringify(r)}catch(e){last=String(e)}await new Promise(r=>setTimeout(r,150));}throw Error('second service did not start: '+last)}
async function main(){
  try{
    const [admin,referee,a,b,c,observer]=await Promise.all(['admin','ref','a','b','c','observer'].map(account));
    await pool.query("UPDATE identity SET role='admin' WHERE id=?",[admin.id]);
    await pool.query("UPDATE identity SET role='admin' WHERE id=?",[referee.id]);
    await Promise.all([admin,referee,a,b,c,observer].map(login));
    const published=await http(spring,'/api/course/post','POST',{
      title:`Board game test ${suffix}`,category:'board_game',refereeIdentityId:referee.id,
      startTime:new Date(Date.now()-86400000).toISOString().slice(0,19),
      endTime:new Date(Date.now()+86400000).toISOString().slice(0,19),
      description:'local integration fixture',image:'/images/test.png'
    },admin.cookie);
    assert.equal(published.value.code,0,JSON.stringify(published.value));courseId=published.value.data.id;
    const [createdRooms]=await pool.query('SELECT code FROM game_room WHERE course_id=?',[courseId]);
    assert.equal(createdRooms.length,1);roomCode=createdRooms[0].code;
    assert.equal((await game('/game-api/rooms')).status,401);
    const cat=await game('/game-api/catalog','GET',undefined,admin);
    assert.equal(cat.status,200,JSON.stringify(cat.value));
    assert.ok(cat.value.courses.some(x=>x.id===courseId));
    const teamEndpoint=await http(spring,`/api/team/course/${courseId}`,'GET',undefined,admin.cookie);
    assert.equal(teamEndpoint.status,200,JSON.stringify(teamEndpoint.value));
    assert.equal((await game('/game-api/rooms','POST',{},admin)).status,405);
    const url=`/game-api/rooms/${roomCode}`;
    assert.equal((await game(url+'/details','GET',undefined,a)).value.role,'spectator');
    assert.equal((await game(url+'/start','POST',{},referee)).status,409);
    assert.equal((await game(url+'/create-team','POST',{},a)).status,200);
    assert.equal((await game(url+'/join-team','POST',{teamId:1},observer)).status,200);
    assert.equal((await game(url+'/leave-team','POST',{},observer)).status,200);
    assert.equal((await game(url+'/join-team','POST',{teamId:1},observer)).status,200);
    assert.equal((await game(url+'/disband-team','POST',{teamId:1},referee)).status,200);
    assert.equal((await game(url+'/create-team','POST',{},a)).status,200);
    assert.equal((await game(url+'/join-team','POST',{teamId:1},observer)).status,200);
    assert.equal((await game(url+'/create-team','POST',{},b)).status,200);
    assert.equal((await game(url+'/create-team','POST',{},c)).status,200);
    assert.equal((await game(url+'/create-team','POST',{},admin)).status,409);
    assert.equal((await game(url+'/details','GET',undefined,a)).value.myTeamId,1);
    assert.equal((await game(url+'/details','GET',undefined,referee)).value.role,'host');
    assert.equal((await game(url+'/settings','POST',{initialMoney:200,initialIncome:30},referee)).status,200);
    assert.equal((await game(url+'/start','POST',{},a)).status,403);
    assert.equal((await game(url+'/start','POST',{},referee)).status,200);
    assert.equal((await game(url+'/details','GET',undefined,a)).value.teamId,'A');
    assert.equal((await game(url+'/details','GET',undefined,observer)).value.canAct,false);
    const state=(await game(url,'GET',undefined,a)).value;
    assert.equal(state.teams.A.money,200);
    assert.equal(state.teams.A.income,30);
    assert.equal(state.teams.A.hand.length,6);
    assert.equal(state.teams.B.hand,undefined);
    assert.equal((await game(url,'GET',undefined,observer)).value.canAct,false);
    const card=state.teams.A.hand.find(x=>x.move<7);
    const route=reachable(state.graph,state.house,state.teams.A.position,card.move)[0].route;
    assert.equal((await game(url+'/move','POST',{cardId:card.id,route},observer)).status,403);
    assert.equal((await game(url+'/move','POST',{cardId:card.id,route:['not-a-node']},a)).status,400);
    const moved=await game(url+'/move','POST',{cardId:card.id,route},a);
    assert.equal(moved.status,200,JSON.stringify(moved.value));
    assert.equal(moved.value.records.length,1);
    const [log]=await pool.query('SELECT COUNT(*) AS n FROM game_action_log WHERE room_id=(SELECT id FROM game_room WHERE code=?)',[roomCode]);
    assert.equal(log[0].n,1);
    secondary=spawn(process.execPath,['server.js'],{cwd:__dirname,env:{...process.env,GAME_PORT:'3002',GAME_DB_NAME:'cdmga_dev'},stdio:'ignore'});
    await waitForServer('http://127.0.0.1:3002',a);
    const recovered=await game(url,'GET',undefined,a,'http://127.0.0.1:3002');
    assert.equal(recovered.status,200);
    assert.equal(recovered.value.records.length,1);
    assert.equal(recovered.value.teams.A.position,moved.value.teams.A.position);
    assert.equal((await game('/game-client/','GET',undefined,a)).status,200);
    assert.equal((await game('/game-assets/cards/output/'+card.sourceId+'.png','GET',undefined,a)).status,200);
    assert.equal((await game(url+'/end','POST',{},a)).status,403);
    assert.equal((await game(url+'/end','POST',{},referee)).status,200);
    assert.equal((await game(url,'GET',undefined,a)).value.canAct,false);
    assert.equal((await game(url+'/end-turn','POST',{},a)).status,409);
    console.log('PASS: account sessions, course/team reuse, room lifecycle, referee/operator/observer access, move, MySQL log, second-process recovery, client assets');
  } finally {
    if(secondary)secondary.kill();
    if(roomCode)await pool.query('DELETE FROM game_room WHERE code=?',[roomCode]);
    if(courseId){await pool.query("DELETE FROM mail_message WHERE source_type='course_published' AND source_id=?",[courseId]);await pool.query('DELETE FROM team WHERE course_id=?',[courseId]);await pool.query('DELETE FROM course WHERE id=?',[courseId]);}
    if(users.length){
      try {await pool.query('DELETE FROM identity_session WHERE identity_id IN (?)',[users]);await pool.query('DELETE FROM title_award WHERE identity_id IN (?)',[users]);await pool.query('DELETE FROM title_definition WHERE identity_id IN (?)',[users]);await pool.query('DELETE FROM identity_extra_profile WHERE identity_id IN (?)',[users]);await pool.query('DELETE FROM identity WHERE id IN (?)',[users]);}
      catch(e){console.error('Fixture identity cleanup required:',users.join(','),e.code);}
    }
    await pool.end();
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
