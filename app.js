const STORAGE_KEY = 'golf-score-tracker';
const HOLES = 18;
const NUM_PLAYERS = 4;

function getStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.players)) {
        const current = Math.min(Math.max(0, parseInt(parsed.currentPlayer, 10) || 0), NUM_PLAYERS - 1);
        const players = parsed.players
          .slice(0, NUM_PLAYERS)
          .map((p) => Array.isArray(p) && p.length === HOLES ? p : Array(HOLES).fill(0));
        while (players.length < NUM_PLAYERS) players.push(Array(HOLES).fill(0));
        return { currentPlayer: current, players };
      }
    }
  } catch (_) {}
  return {
    currentPlayer: 0,
    players: Array.from({ length: NUM_PLAYERS }, () => Array(HOLES).fill(0)),
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentPlayer: state.currentPlayer,
    players: state.players,
  }));
}

const state = getStoredState();

function getScores() {
  return state.players[state.currentPlayer];
}

function updateTotal() {
  const scores = getScores();
  const total = scores.reduce((a, b) => a + b, 0);
  const el = document.getElementById('total');
  if (el) el.textContent = total;
}

function renderHoles() {
  const list = document.getElementById('holes-list');
  if (!list) return;

  const scores = getScores();
  list.innerHTML = '';

  for (let i = 0; i < HOLES; i++) {
    const hole = i + 1;
    const value = scores[i];
    const card = document.createElement('div');
    card.className = 'hole-card';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `Hole ${hole}, ${value} shots`);

    card.innerHTML = `
      <span class="hole-number">Hole ${hole}</span>
      <span class="hole-score" data-hole="${i}" aria-live="polite">${value}</span>
      <div class="hole-actions">
        <button type="button" class="hole-btn hole-btn-minus" data-hole="${i}" data-delta="-1" aria-label="One less shot on hole ${hole}">−</button>
        <button type="button" class="hole-btn hole-btn-plus" data-hole="${i}" data-delta="1" aria-label="One more shot on hole ${hole}">+</button>
      </div>
    `;

    list.appendChild(card);
  }
}

function onHoleListClick(e) {
  const list = document.getElementById('holes-list');
  const btn = e.target.closest('.hole-btn');
  if (!btn || !list) return;
  const index = parseInt(btn.dataset.hole, 10);
  const delta = parseInt(btn.dataset.delta, 10);
  if (Number.isNaN(index) || Number.isNaN(delta)) return;
  const scores = getScores();
  const next = scores[index] + delta;
  scores[index] = Math.max(0, next);
  saveState();
  const scoreEl = list.querySelector(`.hole-score[data-hole="${index}"]`);
  if (scoreEl) scoreEl.textContent = scores[index];
  const minusBtn = list.querySelector(`.hole-btn-minus[data-hole="${index}"]`);
  if (minusBtn) minusBtn.disabled = scores[index] === 0;
  updateTotal();
}

function initNewRound() {
  document.getElementById('new-round')?.addEventListener('click', () => {
    if (confirm('Start a new round? All scores for all players will be reset.')) {
      state.players = Array.from({ length: NUM_PLAYERS }, () => Array(HOLES).fill(0));
      saveState();
      renderHoles();
      updateTotal();
      updateMinusButtons();
    }
  });
}

// Disable minus when score is 0 (after render)
function updateMinusButtons() {
  const scores = getScores();
  document.querySelectorAll('.hole-btn-minus').forEach((btn) => {
    const index = parseInt(btn.dataset.hole, 10);
    btn.disabled = scores[index] === 0;
  });
}

function setPlayer(index) {
  state.currentPlayer = Math.max(0, Math.min(NUM_PLAYERS - 1, index));
  saveState();
  const header = document.getElementById('header');
  const label = document.getElementById('player-label');
  const app = document.getElementById('app');
  if (header) header.className = 'header header-player-' + state.currentPlayer;
  if (label) label.textContent = 'Player ' + (state.currentPlayer + 1);
  if (app) app.setAttribute('data-player', String(state.currentPlayer));
  renderHoles();
  updateTotal();
  updateMinusButtons();
}

function initPlayerSwitcher() {
  document.getElementById('player-prev')?.addEventListener('click', () => {
    setPlayer(state.currentPlayer - 1);
  });
  document.getElementById('player-next')?.addEventListener('click', () => {
    setPlayer(state.currentPlayer + 1);
  });
}

function buildCsv() {
  const header = ['Hole', 'Player 1', 'Player 2', 'Player 3', 'Player 4'];
  const rows = [header.join(',')];
  for (let h = 0; h < HOLES; h++) {
    const row = [
      h + 1,
      state.players[0][h],
      state.players[1][h],
      state.players[2][h],
      state.players[3][h],
    ].join(',');
    rows.push(row);
  }
  return rows.join('\n');
}

function exportEmailCsv() {
  const input = document.getElementById('export-email');
  const email = (input?.value || '').trim();
  if (!email) {
    alert('Please enter an email address.');
    input?.focus();
    return;
  }
  const csv = buildCsv();
  const subject = encodeURIComponent('Golf score export');
  const body = encodeURIComponent(
    'Golf score export (one row per hole, one column per player).\n\n' + csv
  );
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  window.location.href = mailto;
}

function exportDownloadCsv() {
  const csv = buildCsv();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `golf-scores-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function initExport() {
  document.getElementById('email-csv')?.addEventListener('click', exportEmailCsv);
  document.getElementById('download-csv')?.addEventListener('click', exportDownloadCsv);
}

function registerSw() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function init() {
  registerSw();
  const header = document.getElementById('header');
  const label = document.getElementById('player-label');
  if (header) header.className = 'header header-player-' + state.currentPlayer;
  if (label) label.textContent = 'Player ' + (state.currentPlayer + 1);
  const app = document.getElementById('app');
  if (app) app.setAttribute('data-player', String(state.currentPlayer));
  initPlayerSwitcher();
  document.getElementById('holes-list')?.addEventListener('click', onHoleListClick);
  renderHoles();
  updateTotal();
  updateMinusButtons();
  initNewRound();
  initExport();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
