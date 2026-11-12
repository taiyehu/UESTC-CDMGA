const game = require('./game');
const { NODE_TYPES } = require('./map-data');

const HOUSES = new Set(['Arcaea', 'Phigros', '范式起源']);
const houseFor = card => card.game_type === 'fanshi' ? '范式起源' : card.game_type;
const act = (type, payload = {}) => ({ type, payload });

function routes(from, steps) {
  const result = [];
  function walk(node, route) {
    if (route.length === steps || HOUSES.has(node) && route.length) result.push(route);
    if (route.length === steps) return;
    for (const next of game.GRAPH[node] || []) walk(next, [...route, next]);
  }
  walk(from, []);
  return result;
}

function routeValue(room, seat, strategy, route, extra = false) {
  const team = room.teams[seat], end = route.at(-1);
  let value = 0;
  if (!extra) for (const [index, node] of route.entries()) {
    const multiplier = index === route.length - 1 ? 2 : 1;
    if (NODE_TYPES[node] === '收入格') value += multiplier * team.income * (strategy === 'steady' ? .028 : .012);
    if (NODE_TYPES[node] === '收税格') value -= multiplier * (strategy === 'steady' ? .3 : .16);
    if (node === 'B') value -= strategy === 'steady' ? 5 : 2;
  }
  if (end === 'Arcaea') value += strategy === 'steady' ? (team.round < 6 ? 8 : 4) : 2;
  if (end === '范式起源') value += strategy === 'steady' ? 4 : 1.5;
  if (end === 'Phigros') value += strategy === 'steady' ? 1 : 3;
  if (!extra && NODE_TYPES[end] === '事件格') value += strategy === 'steady' ? 1 : 4;
  if (!extra && !HOUSES.has(end) && !room.battles.some(battle => battle.round === team.round && battle.node === end) &&
    room.records.some(record => record.team !== seat && record.round === team.round && record.node === end))
    value += strategy === 'aggressive' ? 10 : -2;
  if (HOUSES.has(end) && team.hand.some(card => card.game_type === 'random' || houseFor(card) === end))
    value += strategy === 'steady' ? 2 : 3;
  return value;
}

function bestMovement(room, seat, strategy, extra = false) {
  const team = room.teams[seat];
  let best = null;
  for (const card of team.hand) {
    if (team.pendingRoll && card.id !== team.pendingRoll.cardId) continue;
    const steps = card.move === 7 ? team.pendingRoll?.cardId === card.id ? team.pendingRoll.value : 3 : card.move;
    for (const route of routes(team.position, steps)) {
      const value = routeValue(room, seat, strategy, route, extra) - (card.move === 7 && team.pendingRoll?.cardId !== card.id ? .5 : 0);
      if (!best || value > best.value) best = { card, route, value };
    }
  }
  if (!best) return null;
  if (best.card.move === 7 && team.pendingRoll?.cardId !== best.card.id) return act('roll', { cardId: best.card.id });
  return act(extra ? 'extra-move' : 'move', { cardId: best.card.id, route: best.route });
}

function cardValue(card, strategy) {
  const score = Number(card.effectValue || 0), income = Number(card.effectAux || card.effectValue || 0);
  const kind = card.effect_type;
  if (kind.startsWith('score')) return (strategy === 'aggressive' ? 3 : 1.5) * score + (kind.includes('income') ? income * .25 : 0);
  if (kind === 'income' || kind === 'transfer_income') return income * (strategy === 'steady' ? .7 : .25);
  if (kind === 'loan') return strategy === 'steady' ? 3 : 1;
  if (kind === 'teleport') return strategy === 'steady' ? 3 : 4;
  if (kind === 'shield_misfortune') return strategy === 'steady' ? 3 : 1;
  return 2;
}

function choose(room, seat, strategy, humanSeats) {
  const team = room.teams[seat];
  const opponents = 'ABC'.split('').filter(id => id !== seat);
  const leader = opponents.sort((a, b) => room.teams[b].score - room.teams[a].score)[0];
  const choice = room.pendingMisfortuneChoice;
  if (choice) {
    if (choice.triggerTeam === seat && !choice.target) return act('misfortune-target', { target: leader });
    if (choice.target === seat) {
      const severity = card => card.effect_type === 'half_money' ? 4 : card.effect_type === 'score' ? -Number(card.effectValue) : card.effect_type?.startsWith('debuff') ? 2 : 1;
      return act('misfortune-pick', { index: choice.cards.length > 1 && severity(choice.cards[1]) > severity(choice.cards[0]) ? 1 : 0 });
    }
    return null;
  }
  if (room.pendingAuction) {
    if (room.pendingAuction.bids[seat] !== undefined) return null;
    return act('bid', { amount: Math.min(team.money, Math.min(strategy === 'aggressive' ? 60 : 25, Math.floor(team.money * (strategy === 'aggressive' ? .14 : .06)))) });
  }
  if (team.pendingChallenge) return null;
  if (team.pendingTarget) return act('card-target', { target: leader });
  if (team.pendingReroll) return act('card-reroll', { again: team.pendingReroll.firstRoll <= 3 });
  if (team.pendingTeleport) return act('teleport', { node: strategy === 'steady' ? 'Arcaea' : 'Phigros' });
  if (team.pendingExtraMove) return bestMovement(room, seat, strategy, true);
  if (team.awaitingEnd) {
    const record=room.records.findLast(r=>r.team===seat&&r.round===team.round);
    if(record&&!HOUSES.has(record.node)&&!record.defender){
      const member=game.eligibleMembers(room,team)[0];
      if(member)return act('reserve-member',{memberId:member.id});
    }
    if (!team.cardActionDone) {
      const usable = team.hand.filter(card => game.canUse(team,card));
      usable.sort((a, b) => cardValue(b, strategy) - cardValue(a, strategy));
      return usable.length ? act('use-card', { cardId: usable[0].id }) : act('skip-use');
    }
    if (team.discardAbility && team.discardedRound !== team.round &&
        !team.hand.some(card => game.canUse(team,card))) {
      const discard = [...team.hand].sort((a, b) => cardValue(a, strategy) - cardValue(b, strategy))[0];
      if (discard) return act('discard-card', { cardId: discard.id });
    }
    if (!team.houseActionDone && HOUSES.has(team.position) && (
      team.position === '范式起源' || team.position === 'Arcaea' && team.money >= team.income + 10 && (strategy === 'steady' || team.round < 5) ||
      team.position === 'Phigros' && team.score > 0 && team.money < (strategy === 'steady' ? 100 : 40)
    )) return act('house-action');
    return act('end-turn');
  }
  if (humanSeats.length && team.round > Math.min(...humanSeats.map(id => room.teams[id].round))) return null;
  return bestMovement(room, seat, strategy);
}

module.exports = { choose, routes, routeValue };
