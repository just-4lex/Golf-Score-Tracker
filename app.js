const STORAGE_KEY = 'golf-score-tracker';
const HOLES = 18;

function getStoredScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === HOLES) return parsed;
    }
  } catch (_) {}
  return Array(HOLES).fill(0);
}

function saveScores(scores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

let scores = getStoredScores();

function updateTotal() {
  const total = scores.reduce((a, b) => a + b, 0);
  const el = document.getElementById('total');
  if (el) el.textContent = total;
}

function renderHoles() {
  const list = document.getElementById('holes-list');
  if (!list) return;

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

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.hole-btn');
    if (!btn) return;
    const index = parseInt(btn.dataset.hole, 10);
    const delta = parseInt(btn.dataset.delta, 10);
    if (Number.isNaN(index) || Number.isNaN(delta)) return;
    const next = scores[index] + delta;
    scores[index] = Math.max(0, next);
    saveScores(scores);
    const scoreEl = list.querySelector(`.hole-score[data-hole="${index}"]`);
    if (scoreEl) scoreEl.textContent = scores[index];
    const minusBtn = list.querySelector(`.hole-btn-minus[data-hole="${index}"]`);
    if (minusBtn) minusBtn.disabled = scores[index] === 0;
    updateTotal();
  });
}

function initNewRound() {
  document.getElementById('new-round')?.addEventListener('click', () => {
    if (confirm('Start a new round? All scores for this round will be reset.')) {
      scores = Array(HOLES).fill(0);
      saveScores(scores);
      renderHoles();
      updateTotal();
    }
  });
}

// Disable minus when score is 0 (after render)
function updateMinusButtons() {
  document.querySelectorAll('.hole-btn-minus').forEach((btn) => {
    const index = parseInt(btn.dataset.hole, 10);
    btn.disabled = scores[index] === 0;
  });
}

function registerSw() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function init() {
  registerSw();
  renderHoles();
  updateTotal();
  updateMinusButtons();
  initNewRound();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
