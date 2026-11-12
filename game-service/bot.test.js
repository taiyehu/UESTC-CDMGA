const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('./game');
const bot = require('./bot');

test('稳健路线偏向持续收入，进攻路线追击同轮对手', () => {
  const room = game.createRoom({ seed: 'bot-routes' });
  room.teams.A.position = 'R4';
  room.records.push({ id: 'human-move', team: 'B', round: 1, node: 'R5' });
  const route = ['R5'];
  assert.ok(bot.routeValue(room, 'A', 'aggressive', route) > bot.routeValue(room, 'A', 'steady', route));
  room.records.length = 0;
  assert.ok(bot.routeValue(room, 'A', 'steady', route) > bot.routeValue(room, 'A', 'aggressive', route));
  room.teams.A.position = 'R9';
  room.teams.A.hand = [{ id: 'single-step', move: 1, game_type: 'random' }];
  room.records.push({ id: 'human-at-f4', team: 'B', round: 1, node: 'F4' });
  assert.deepEqual(bot.choose(room, 'A', 'steady', ['B']).payload.route, ['R10']);
  assert.deepEqual(bot.choose(room, 'A', 'aggressive', ['B']).payload.route, ['F4']);
});

test('人机最多领先真人一回合，竞标仍可在等待期间响应', () => {
  const room = game.createRoom({ seed: 'bot-pace' });
  room.teams.A.round = 2;
  room.teams.B.round = 1;
  assert.equal(bot.choose(room, 'A', 'steady', ['B']), null);
  room.pendingAuction = { bids: {}, card: { name: '竞标' }, triggerTeam: 'B', round: 1 };
  assert.equal(bot.choose(room, 'A', 'steady', ['B']).type, 'bid');
});

test('挑战交给裁判，待判战斗期间队伍继续行动', () => {
  const room = game.createRoom({ seed: 'bot-referee' });
  room.teams.A.pendingChallenge = { card: { name: '挑战' } };
  assert.equal(bot.choose(room, 'A', 'aggressive', ['B']), null);
  room.teams.A.pendingChallenge = null;
  room.records.push({ id: 'a', team: 'A', round: 1, node: 'R5' }, { id: 'b', team: 'B', round: 1, node: 'R5' });
  room.battles.push({ first: 'a', second: 'b', status: '待结算' });
  assert.equal(bot.choose(room, 'A', 'aggressive', ['B'])?.type,'move');
});

test('人机抵达普通格后选择本组三轮尚未预定的队员',()=>{
  const room=game.createRoom({seed:'bot-defender'}),team=room.teams.A;
  team.members=[1,2,3].map(n=>({id:`bot-A-${n}`,account:`人机 ${n}`}));
  team.position='R1';team.hand[0].move=1;
  game.move(room,{role:'team',id:'A'},team.hand[0].id,['R2']);
  const choice=bot.choose(room,'A','steady',['B']);
  assert.deepEqual(choice,{type:'reserve-member',payload:{memberId:'bot-A-1'}});
  game.reserveMember(room,{role:'team',id:'A'},choice.payload.memberId);
  assert.equal(room.records[0].defender.account,'人机 1');
});

test('人机获得机械帮手后会在普通站点弃一张不能使用的牌', () => {
  const room = game.createRoom({ seed: 'bot-helper' }), team = room.teams.A;
  team.discardAbility = true;
  team.position = 'R2';
  team.awaitingEnd = true;
  team.cardActionDone = true;
  const action = bot.choose(room, 'A', 'steady', ['B']);
  assert.equal(action.type, 'discard-card');
  game.discardCard(room, { role: 'team', id: 'A' }, action.payload.cardId);
  assert.equal(bot.choose(room, 'A', 'steady', ['B']).type, 'end-turn');
});

test('两种策略都能通过规则引擎完成一整个回合', () => {
  const operations = {
    roll: (r, w, p) => game.roll(r, w, p.cardId),
    move: (r, w, p) => game.move(r, w, p.cardId, p.route),
    'use-card': (r, w, p) => game.useCard(r, w, p.cardId),
    'skip-use': (r, w) => game.skipUse(r, w),
    'house-action': (r, w) => game.houseAction(r, w),
    'end-turn': (r, w) => game.endTurn(r, w),
    'card-target': (r, w, p) => game.chooseCardTarget(r, w, p.target),
    'card-reroll': (r, w, p) => game.resolveReroll(r, w, p.again),
    teleport: (r, w, p) => game.teleport(r, w, p.node),
    'extra-move': (r, w, p) => game.extraMove(r, w, p.cardId, p.route),
    'discard-card': (r, w, p) => game.discardCard(r, w, p.cardId),
    'misfortune-target': (r, w, p) => game.misfortuneTarget(r, w, p.target),
    'misfortune-pick': (r, w, p) => game.misfortunePick(r, w, p.index),
    bid: (r, w, p) => game.bid(r, w, p.amount),
  };
  for (const strategy of ['steady', 'aggressive']) {
    const room = game.createRoom({ seed: `bot-turn-${strategy}` });
    for (let step = 0; step < 50 && room.teams.A.round === 1; step++) {
      if (room.teams.A.pendingChallenge) game.resolveChallenge(room, { role: 'host' }, 'A', false);
      for (const battle of room.battles.filter(item => item.status === '待结算')) game.battle(room, { role: 'host' }, battle.id, 'A');
      if (room.pendingMisfortuneChoice?.target === 'B') game.misfortunePick(room, { role: 'team', id: 'B' }, 0);
      if (room.pendingMisfortuneChoice?.target === 'C') game.misfortunePick(room, { role: 'team', id: 'C' }, 0);
      if (room.pendingAuction) for (const id of 'BC') if (room.pendingAuction?.bids[id] === undefined) game.bid(room, { role: 'team', id }, 0);
      const action = bot.choose(room, 'A', strategy, ['B']);
      if (action) operations[action.type](room, { role: 'team', id: 'A' }, action.payload);
    }
    assert.equal(room.teams.A.round, 2, `${strategy} stalled in its first round`);
  }
});
