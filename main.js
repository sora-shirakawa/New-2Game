const KEY = 'alchemy_shop_save_v1';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MATERIALS = {
  herb: { name: '🌿薬草' }, water: { name: '💧清水' }, ore: { name: '🪨鉱石' }, fireHerb: { name: '🔥火薬草' }, crystal: { name: '🔮魔晶' },
};
const ORDER_SETS = [
  { id: 'herbSet', name: '薬草セット', cost: 300, items: { herb: 4, water: 3 } },
  { id: 'oreSet', name: '鉱石セット', cost: 400, items: { ore: 3, fireHerb: 3 } },
  { id: 'crystalSet', name: '魔晶セット', cost: 600, items: { crystal: 3, herb: 2, water: 2 } },
  { id: 'balanceSet', name: 'バランスセット', cost: 500, items: { herb: 2, water: 2, ore: 2, fireHerb: 1, crystal: 1 } },
];
const RECIPES = [
  { id: 'healPotion', name: '🧪回復薬', materials: { herb: 1, water: 1 }, price: 180, success: 0.9, category: '回復' },
  { id: 'highHealPotion', name: '🧪高級回復薬', materials: { herb: 2, water: 1, crystal: 1 }, price: 450, success: 0.7, category: '回復' },
  { id: 'smallBomb', name: '💣小型爆薬', materials: { ore: 1, fireHerb: 1 }, price: 260, success: 0.8, category: '道具' },
  { id: 'manaPotion', name: '🧪魔力ポーション', materials: { crystal: 1, water: 1 }, price: 380, success: 0.75, category: '魔法' },
  { id: 'panacea', name: '✨万能薬', materials: { herb: 1, water: 1, crystal: 1 }, price: 520, success: 0.6, category: '高級' },
];
const MARKET_TYPES = [
  { name: '通常市場', mod: {} },
  { name: '回復薬ブーム', mod: { '回復': 1.3 } },
  { name: '道具需要増加', mod: { '道具': 1.3 } },
  { name: '魔法薬人気', mod: { '魔法': 1.3 } },
  { name: '高級品需要', mod: { '高級': 1.4 } },
  { name: '不況', mod: { ALL: 0.8 } },
];

let state;
const el = (id) => document.getElementById(id);

function initGame() {
  state = { currentWeek: 1, currentDay: 'Monday', money: 1000, reputation: 50, totalSales: 0, successCount: 0, failCount: 0, materials: { herb: 0, water: 0, ore: 0, fireHerb: 0, crystal: 0 }, products: {}, pendingOrder: null, market: randomMarket(), logs: [] };
  addLog('新規ゲームを開始しました。');
  updateUI();
}
function saveGame() { localStorage.setItem(KEY, JSON.stringify(state)); addLog('セーブしました。'); updateUI(); }
function loadGame() { const raw = localStorage.getItem(KEY); if (!raw) return false; state = JSON.parse(raw); addLog('セーブデータを読み込みました。'); updateUI(); return true; }
function resetSave() { localStorage.removeItem(KEY); }
function nextDay() {
  if (state.currentDay === 'Monday' && !state.pendingOrder) return addLog('月曜日は素材依頼が必要です。');
  const idx = DAYS.indexOf(state.currentDay);
  if (idx < 6) state.currentDay = DAYS[idx + 1];
  else { state.currentDay = 'Monday'; state.currentWeek += 1; sellProducts(); state.market = randomMarket(); }
  if (state.currentDay === 'Friday') deliverMaterials();
  checkGameEnd(); updateUI();
}
function orderMaterials(setId) {
  if (state.currentDay !== 'Monday') return;
  if (state.pendingOrder) return addLog('今週の依頼は既に完了しています。');
  const set = ORDER_SETS.find((s) => s.id === setId);
  if (state.money < set.cost) return addLog('所持金不足で依頼できません。');
  state.money -= set.cost; state.pendingOrder = set.items; addLog(`${set.name}を依頼しました（-${set.cost}G）`); updateUI();
}
function deliverMaterials() {
  if (!state.pendingOrder) return addLog('今週の納品はありません。');
  Object.entries(state.pendingOrder).forEach(([k, v]) => { state.materials[k] += v; });
  addLog('素材が納品されました。'); state.pendingOrder = null;
}
function craftItem(recipeId) {
  if (!['Saturday', 'Sunday'].includes(state.currentDay)) return;
  const recipe = RECIPES.find((r) => r.id === recipeId);
  for (const [m, n] of Object.entries(recipe.materials)) if (state.materials[m] < n) return addLog('素材不足です。');
  for (const [m, n] of Object.entries(recipe.materials)) state.materials[m] -= n;
  if (Math.random() <= recipe.success) { state.products[recipe.id] = (state.products[recipe.id] || 0) + 1; state.successCount += 1; addLog(`${recipe.name}の錬金に成功！`); beep(660); }
  else { state.failCount += 1; state.reputation -= 1; addLog(`${recipe.name}の錬金に失敗…`); beep(220); }
  updateUI(); checkGameEnd();
}
function sellProducts() {
  let total = 0;
  for (const r of RECIPES) {
    const qty = state.products[r.id] || 0;
    if (!qty) continue;
    const mul = state.market.mod.ALL ?? state.market.mod[r.category] ?? 1;
    const price = Math.floor(r.price * mul);
    total += price * qty;
  }
  state.products = {};
  state.money += total;
  state.totalSales += total;
  addLog(`販売結果: +${total}G (${state.market.name})`);
  if (total > 0) beep(880);
}
function checkGameEnd() {
  if (state.money < 0 || state.reputation <= 0) return showResult(false);
  if (state.currentWeek > 4) return showResult(state.money >= 3000);
}
function rank(m) { if (m >= 5000) return 'S'; if (m >= 4000) return 'A'; if (m >= 3000) return 'B'; if (m >= 2000) return 'C'; return 'D'; }
function showResult(success) {
  screen('resultScreen');
  el('resultBody').innerHTML = `<p>${success ? '目標達成！' : '経営失敗…'}</p><ul><li>最終所持金: ${state.money}G</li><li>最終評判: ${state.reputation}</li><li>累計売上: ${state.totalSales}G</li><li>成功回数: ${state.successCount}</li><li>失敗回数: ${state.failCount}</li><li>評価ランク: ${rank(state.money)}</li></ul>`;
}
function randomMarket() { return MARKET_TYPES[Math.floor(Math.random() * MARKET_TYPES.length)]; }
function addLog(msg) { state?.logs?.unshift(`[W${state.currentWeek} ${state.currentDay}] ${msg}`); if (state.logs.length > 10) state.logs.pop(); }
function screen(id) { ['titleScreen', 'gameScreen', 'resultScreen'].forEach((x) => el(x).classList.remove('active')); el(id).classList.add('active'); }
function updateUI() {
  if (!state) return;
  el('weekText').textContent = state.currentWeek;
  el('dayText').textContent = state.currentDay;
  el('moneyText').textContent = state.money;
  el('repText').textContent = state.reputation;
  el('marketText').textContent = state.market.name;
  el('materialList').innerHTML = Object.entries(state.materials).map(([k, v]) => `<li>${MATERIALS[k].name}: ${v}</li>`).join('');
  el('productList').innerHTML = RECIPES.map((r) => `<li>${r.name}: ${state.products[r.id] || 0}</li>`).join('');
  el('logList').innerHTML = state.logs.map((l) => `<li>${l}</li>`).join('');
  renderActions();
}
function renderActions() {
  const p = el('actionPanel');
  if (state.currentDay === 'Monday') {
    p.innerHTML = `<h3>素材依頼</h3>${ORDER_SETS.map((s) => `<div class='set-card'><strong>${s.name}</strong> (${s.cost}G)<div class='small'>${Object.entries(s.items).map(([k,v])=>`${MATERIALS[k].name}×${v}`).join('、')}</div><button data-order='${s.id}'>依頼する</button></div>`).join('')}`;
    p.querySelectorAll('[data-order]').forEach((b) => b.onclick = () => orderMaterials(b.dataset.order));
  } else if (['Saturday', 'Sunday'].includes(state.currentDay)) {
    p.innerHTML = `<h3>錬金</h3>${RECIPES.map((r) => `<div class='recipe-card'><strong>${r.name}</strong> 売価:${r.price}G 成功率:${Math.floor(r.success*100)}%<div class='small'>${Object.entries(r.materials).map(([k,v])=>`${MATERIALS[k].name}×${v}`).join('、')}</div><button data-craft='${r.id}'>作成する</button></div>`).join('')}`;
    p.querySelectorAll('[data-craft]').forEach((b) => b.onclick = () => craftItem(b.dataset.craft));
  } else { p.innerHTML = '<h3>進行中</h3><p>本日は自動進行日です。次の日へ進んでください。</p>'; }
}
function beep(freq=440){const a=new(window.AudioContext||window.webkitAudioContext)();const o=a.createOscillator();const g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=freq;g.gain.value=0.03;o.start();o.stop(a.currentTime+0.08);} 

el('newGameBtn').onclick = () => { initGame(); screen('gameScreen'); };
el('continueBtn').onclick = () => { if (loadGame()) screen('gameScreen'); else alert('セーブデータがありません。'); };
el('resetBtn').onclick = () => { resetSave(); alert('セーブデータを削除しました。'); };
el('nextDayBtn').onclick = nextDay;
el('saveBtn').onclick = saveGame;
el('backTitleBtn').onclick = () => screen('titleScreen');
el('replayBtn').onclick = () => { initGame(); screen('gameScreen'); };
el('resultTitleBtn').onclick = () => screen('titleScreen');
