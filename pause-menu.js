'use strict';

const START_LEVEL_KEY = 'tetris.startLevel';
const MIN_START_LEVEL = 1;
const MAX_START_LEVEL = 15;

let pauseMenuOpen = false;
let pauseMenuView = 'main'; // 'main' | 'controls'

const pauseMenuEl = document.getElementById('pause-menu');
const pauseMenuMainEl = document.getElementById('pause-menu-main');
const pauseMenuControlsEl = document.getElementById('pause-menu-controls');
const startLevelSelect = document.getElementById('start-level');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const controlsBtn = document.getElementById('controls-btn');
const backBtn = document.getElementById('back-btn');

function getStartLevel() {
  const raw = parseInt(localStorage.getItem(START_LEVEL_KEY), 10);
  if (Number.isNaN(raw) || raw < MIN_START_LEVEL || raw > MAX_START_LEVEL) return 1;
  return raw;
}

function setStartLevel(n) {
  const clamped = Math.min(MAX_START_LEVEL, Math.max(MIN_START_LEVEL, Math.floor(n)));
  localStorage.setItem(START_LEVEL_KEY, String(clamped));
  return clamped;
}

function showMainView() {
  pauseMenuView = 'main';
  pauseMenuMainEl.classList.remove('hidden');
  pauseMenuControlsEl.classList.add('hidden');
}

function showControlsView() {
  pauseMenuView = 'controls';
  pauseMenuMainEl.classList.add('hidden');
  pauseMenuControlsEl.classList.remove('hidden');
}

function openPauseMenu() {
  pauseMenuOpen = true;
  showMainView();
  startLevelSelect.value = String(getStartLevel());
  pauseMenuEl.classList.remove('hidden');
}

function closePauseMenu() {
  pauseMenuOpen = false;
  pauseMenuEl.classList.add('hidden');
}

resumeBtn.addEventListener('click', () => {
  togglePause();
});

pauseRestartBtn.addEventListener('click', () => {
  init();
  closePauseMenu();
});

controlsBtn.addEventListener('click', () => {
  showControlsView();
});

backBtn.addEventListener('click', () => {
  showMainView();
});

startLevelSelect.addEventListener('change', () => {
  setStartLevel(parseInt(startLevelSelect.value, 10));
});
