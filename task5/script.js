'use strict';

const board = document.getElementById('board');
const pads = Array.from(board.querySelectorAll('.pad'));
const startButton = document.getElementById('start-btn');
const levelLabel = document.getElementById('level');
const statusLabel = document.getElementById('status');
const soundToggle = document.getElementById('sound-toggle');

const gameState = {
  sequence: [], 
  playerStep: 0,
  level: 0,     
  phase: 'idle', 
  gameId: 0,    
};

const PAD_LIGHT_MS = 500; 
const PAUSE_MS = 250;     

const PAD_FREQUENCIES = [329.63, 277.18, 220, 164.81];
const ERROR_FREQUENCY = 98;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let audioContext = null;

function playTone(frequency, duration = 0.4) {
  if (!soundToggle.checked) {
    return;
  }
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
  }
}

function getRandomPadIndex() {
  return Math.floor(Math.random() * pads.length);
}

async function lightPad(index, duration) {
  pads[index].classList.add('active');
  playTone(PAD_FREQUENCIES[index]);
  await sleep(duration);
  pads[index].classList.remove('active');
}

async function showSequence() {
  const id = gameState.gameId;

  gameState.phase = 'showing';
  board.classList.add('locked');
  statusLabel.textContent = 'Смотрите внимательно…';
  await sleep(600);

  for (const index of gameState.sequence) {
    if (gameState.gameId !== id) {
      return; 
    }
    await lightPad(index, PAD_LIGHT_MS);
    if (gameState.gameId !== id) {
      return;
    }
    await sleep(PAUSE_MS);
  }

  if (gameState.gameId !== id) {
    return;
  }

  gameState.playerStep = 0;
  gameState.phase = 'input';
  board.classList.remove('locked');
  statusLabel.textContent = 'Ваш ход — повторите последовательность';
}

function nextRound() {
  gameState.sequence.push(getRandomPadIndex());
  gameState.level = gameState.sequence.length;
  levelLabel.textContent = gameState.level;
  showSequence();
}

function startGame() {
  gameState.gameId += 1;
  gameState.sequence = [];
  gameState.playerStep = 0;
  gameState.level = 0;
  gameState.phase = 'idle';
  pads.forEach((pad) => pad.classList.remove('active'));

  startButton.disabled = true;
  nextRound();
}

function handlePadClick(index) {
  if (gameState.phase !== 'input') {
    return;
  }

  lightPad(index, 200); 

  if (index !== gameState.sequence[gameState.playerStep]) {
    gameOver();
    return;
  }

  gameState.playerStep += 1;

  if (gameState.playerStep === gameState.sequence.length) {
    gameState.phase = 'between';
    board.classList.add('locked');
    statusLabel.textContent = 'Верно! Готовлю следующий раунд…';
    const id = gameState.gameId;
    setTimeout(() => {
      if (gameState.gameId === id) {
        nextRound();
      }
    }, 900);
  }
}

function gameOver() {
  gameState.phase = 'over';
  board.classList.add('locked');
  startButton.disabled = false;
  playTone(ERROR_FREQUENCY, 0.6);
  statusLabel.textContent = `Ошибка! Вы дошли до уровня ${gameState.level}. Нажмите «Старт», чтобы сыграть ещё раз`;
}

startButton.addEventListener('click', startGame);
pads.forEach((pad, index) => {
  pad.addEventListener('click', () => handlePadClick(index));
});
