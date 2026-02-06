const STORAGE_KEY = 'golf-score-tracker';
const MAX_HOLES = 18;
const MAX_PLAYERS = 8;
const HOLE_OPTIONS = [9, 18];

function getStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.players)) {
        const numHoles = HOLE_OPTIONS.includes(parsed.numHoles) ? parsed.numHoles : MAX_HOLES;
        const numPlayers = Math.min(MAX_PLAYERS, Math.max(1, parseInt(parsed.numPlayers, 10) || 4));
        const playerNames = Array.isArray(parsed.playerNames)
          ? parsed.playerNames.slice(0, numPlayers)
          : [];
        while (playerNames.length < numPlayers) {
          playerNames.push('Player ' + (playerNames.length + 1));
        }
        const current = Math.min(
          Math.max(0, parseInt(parsed.currentPlayer, 10) || 0),
          numPlayers - 1
        );
        const players = parsed.players.slice(0, numPlayers).map((p) => {
          const arr = Array.isArray(p) ? p.slice(0, numHoles) : [];
          while (arr.length < numHoles) arr.push(0);
          return arr;
        });
        while (players.length < numPlayers) {
          players.push(Array(numHoles).fill(0));
        }
        return {
          currentPlayer: current,
          players,
          numHoles,
          numPlayers,
          playerNames,
        };
      }
    }
  } catch (_) {}
  return {
    currentPlayer: 0,
    players: Array.from({ length: 4 }, () => Array(18).fill(0)),
    numHoles: 18,
    numPlayers: 4,
    playerNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentPlayer: state.currentPlayer,
    players: state.players,
    numHoles: state.numHoles,
    numPlayers: state.numPlayers,
    playerNames: state.playerNames,
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
  const numHoles = state.numHoles;
  list.innerHTML = '';

  for (let i = 0; i < numHoles; i++) {
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
      state.players = Array.from({ length: state.numPlayers }, () =>
        Array(state.numHoles).fill(0)
      );
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
  state.currentPlayer = Math.max(0, Math.min(state.numPlayers - 1, index));
  saveState();
  const header = document.getElementById('header');
  const label = document.getElementById('player-label');
  const app = document.getElementById('app');
  if (header) header.className = 'header header-player-' + Math.min(state.currentPlayer, 3);
  if (label) label.textContent = state.playerNames[state.currentPlayer] || ('Player ' + (state.currentPlayer + 1));
  if (app) {
    app.setAttribute('data-player', String(Math.min(state.currentPlayer, 3)));
    app.setAttribute('data-num-players', String(state.numPlayers));
  }
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
  const names = state.playerNames.slice(0, state.numPlayers);
  const header = ['Hole', ...names];
  const rows = [header.join(',')];
  for (let h = 0; h < state.numHoles; h++) {
    const row = [h + 1, ...state.players.slice(0, state.numPlayers).map((p) => p[h] ?? 0)].join(',');
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

function applyRoundConfig(numHoles, numPlayers, playerNames) {
  const oldHoles = state.numHoles;
  const oldPlayers = state.numPlayers;
  state.numHoles = numHoles;
  state.numPlayers = numPlayers;
  state.playerNames = playerNames.slice(0, numPlayers);
  while (state.playerNames.length < numPlayers) {
    state.playerNames.push('Player ' + (state.playerNames.length + 1));
  }
  state.players = state.players.slice(0, numPlayers).map((p) => {
    const arr = (p || []).slice(0, numHoles);
    while (arr.length < numHoles) arr.push(0);
    return arr;
  });
  while (state.players.length < numPlayers) {
    state.players.push(Array(numHoles).fill(0));
  }
  state.currentPlayer = Math.min(state.currentPlayer, numPlayers - 1);
  saveState();
  renderHoles();
  updateTotal();
  updateMinusButtons();
  setPlayer(state.currentPlayer);
}

function openConfigModal() {
  const modal = document.getElementById('config-modal');
  const holesSelect = document.getElementById('config-holes');
  const playersSelect = document.getElementById('config-players');
  const namesContainer = document.getElementById('config-player-names');
  if (!modal || !holesSelect || !playersSelect || !namesContainer) return;

  holesSelect.value = String(state.numHoles);
  playersSelect.value = String(state.numPlayers);
  namesContainer.innerHTML = '';
  for (let i = 0; i < state.numPlayers; i++) {
    const label = document.createElement('label');
    label.className = 'config-name-label';
    label.textContent = 'Player ' + (i + 1);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'config-name-input';
    input.placeholder = 'Player ' + (i + 1);
    input.value = state.playerNames[i] || '';
    input.dataset.index = String(i);
    namesContainer.appendChild(label);
    namesContainer.appendChild(input);
  }
  modal.classList.add('config-modal-visible');
}

function closeConfigModal() {
  document.getElementById('config-modal')?.classList.remove('config-modal-visible');
}

function saveConfig() {
  const holesSelect = document.getElementById('config-holes');
  const playersSelect = document.getElementById('config-players');
  const nameInputs = document.querySelectorAll('.config-name-input');
  if (!holesSelect || !playersSelect) return;

  const numHoles = parseInt(holesSelect.value, 10) || 18;
  const numPlayers = Math.min(MAX_PLAYERS, Math.max(1, parseInt(playersSelect.value, 10) || 4));
  const playerNames = Array.from(nameInputs)
    .slice(0, numPlayers)
    .map((input) => (input.value || '').trim() || ('Player ' + (parseInt(input.dataset.index, 10) + 1)));
  while (playerNames.length < numPlayers) {
    playerNames.push('Player ' + (playerNames.length + 1));
  }
  applyRoundConfig(numHoles, numPlayers, playerNames);
  closeConfigModal();
}

function renderConfigPlayerNames() {
  const playersSelect = document.getElementById('config-players');
  const namesContainer = document.getElementById('config-player-names');
  if (!playersSelect || !namesContainer) return;
  const numPlayers = Math.min(MAX_PLAYERS, Math.max(1, parseInt(playersSelect.value, 10) || 4));
  namesContainer.innerHTML = '';
  for (let i = 0; i < numPlayers; i++) {
    const label = document.createElement('label');
    label.className = 'config-name-label';
    label.textContent = 'Player ' + (i + 1);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'config-name-input';
    input.placeholder = 'Player ' + (i + 1);
    input.value = (state.playerNames[i] || '').trim() || '';
    input.dataset.index = String(i);
    namesContainer.appendChild(label);
    namesContainer.appendChild(input);
  }
}

function initConfig() {
  document.getElementById('configure-round')?.addEventListener('click', openConfigModal);
  document.getElementById('config-cancel')?.addEventListener('click', closeConfigModal);
  document.getElementById('config-save')?.addEventListener('click', saveConfig);
  document.getElementById('config-backdrop')?.addEventListener('click', closeConfigModal);
  document.getElementById('config-players')?.addEventListener('change', renderConfigPlayerNames);
}

function init() {
  registerSw();
  const header = document.getElementById('header');
  const label = document.getElementById('player-label');
  if (header) header.className = 'header header-player-' + Math.min(state.currentPlayer, 3);
  if (label) label.textContent = state.playerNames[state.currentPlayer] || ('Player ' + (state.currentPlayer + 1));
  const app = document.getElementById('app');
  if (app) {
    app.setAttribute('data-player', String(Math.min(state.currentPlayer, 3)));
    app.setAttribute('data-num-players', String(state.numPlayers));
  }
  initPlayerSwitcher();
  initConfig();
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
