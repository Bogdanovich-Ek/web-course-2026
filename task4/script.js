'use strict';

let secretNumber = '';   
let attempts = [];       
let isGameOver = false;  

function generateSecretNumber() {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }

  return digits.slice(0, 4).join('');
}

function validateInput(value) {
  const guess = value.trim();

  if (!/^\d{4}$/.test(guess)) {
    return { ok: false, message: 'Ошибка: введите ровно 4 цифры, без букв и других символов' };
  }

  if (new Set(guess).size !== 4) {
    return { ok: false, message: 'Ошибка: все 4 цифры должны быть разными' };
  }

  return { ok: true, message: '' };
}

function countBullsAndCows(secret, guess) {
  let bulls = 0;
  let cows = 0;

  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) {
      bulls++;
    } else if (secret.includes(guess[i])) {
      cows++;
    }
  }

  return { bulls, cows };
}

function plural(n, one, few, many) {
  const lastTwo = n % 100;
  const lastOne = n % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (lastOne === 1) return one;
  if (lastOne >= 2 && lastOne <= 4) return few;
  return many;
}

function formatResult(bulls, cows) {
  return `${bulls} ${plural(bulls, 'бык', 'быка', 'быков')}, ${cows} ${plural(cows, 'корова', 'коровы', 'коров')}`;
}

const guessForm = document.getElementById('guess-form');
const guessInput = document.getElementById('guess-input');
const checkButton = document.getElementById('check-button');
const newGameButton = document.getElementById('new-game-button');
const messageEl = document.getElementById('message');
const attemptsCountEl = document.getElementById('attempts-count');
const historyListEl = document.getElementById('history-list');

function render() {
  attemptsCountEl.textContent = attempts.length;

  const items = attempts.map((attempt, index) => `
    <li class="history-item">
      <span class="attempt-number">${index + 1})</span>
      <span class="attempt-guess">${attempt.guess}</span>
      <span class="attempt-result">→ ${formatResult(attempt.bulls, attempt.cows)}</span>
    </li>
  `);

  historyListEl.innerHTML = items.length
    ? items.join('')
    : '<li class="history-empty">Попыток пока нет — сделайте первую!</li>';

  guessInput.disabled = isGameOver;
  checkButton.disabled = isGameOver;
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = type ? `message ${type}` : 'message';
}

function handleGuess() {
  if (isGameOver) return;

  const validation = validateInput(guessInput.value);
  if (!validation.ok) {
    showMessage(validation.message, 'error');
    return;
  }

  const guess = guessInput.value.trim();
  const { bulls, cows } = countBullsAndCows(secretNumber, guess);

  attempts.push({ guess, bulls, cows });
  guessInput.value = '';

  if (bulls === 4) {
    isGameOver = true;
    showMessage(`Победа! Угадано за ${attempts.length} ${plural(attempts.length, 'попытку', 'попытки', 'попыток')}`, 'win');
  } else {
    showMessage('');
  }

  render();
}

function startNewGame() {
  secretNumber = generateSecretNumber();
  attempts = [];
  isGameOver = false;
  guessInput.value = '';
  showMessage('');
  render();
  guessInput.focus();
}

guessForm.addEventListener('submit', (event) => {
  event.preventDefault();
  handleGuess();
});

guessInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleGuess();
  }
});

newGameButton.addEventListener('click', startNewGame);

startNewGame();
