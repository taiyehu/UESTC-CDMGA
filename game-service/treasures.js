const TREASURES = [
  ['dig','挖宝','停留在收入站点时，可放弃收入，弃任意张手牌并抽等量手牌'],
  ['prototype','原型试样','赛局开始时获得 1 积分'],
  ['riot','暴乱关系','经过厄运站点时，抽 2 张厄运并选择 1 张'],
  ['dividend','即时股息','使用 Arcaea 建筑后返还刚花费的金钱'],
  ['compound','钱生钱','使用 Arcaea 建筑后额外增加 5 点收入'],
  ['cashback','个人返现','支付金钱使用卡牌后，返还支付金额的 10%'],
  ['merchant','老练商人','在 Phigros 出售积分时额外获得 100 金钱'],
  ['move_tax','动起来！','3 次：用移动点数至少 5 的卡牌移动时，经过收税站点不扣钱；骰子步数无效'],
  ['slow_misfortune','停止!','2 次：用移动点数至多 2 的卡牌移动时，可停在厄运站点而不遭遇厄运；骰子步数无效'],
  ['debut','初次亮相','第一次厄运效果不触发'],
  ['archaeology','考古','触发范式起源建筑时，可再掷一次骰子，只有最后一次结果算数']
].map(([id,name,effect],index)=>({id,name,effect,image:`/game-client/assets/treasure${index+1}.${index===10?'JPG':'jpg'}`}));
module.exports={TREASURES};
