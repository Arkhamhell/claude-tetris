'use strict';

// Local records/high-score table + historical stats, persisted in localStorage.
// Loaded before game.js — game.js calls into this module's functions directly.

const RECORDS_KEY = 'tetris.records';
const STATS_KEY = 'tetris.stats';
const MAX_RECORDS = 5;
const MAX_NAME_LENGTH = 12;

function isValidRecord(r) {
  return (
    r &&
    typeof r === 'object' &&
    typeof r.name === 'string' &&
    typeof r.score === 'number' &&
    Number.isFinite(r.score) &&
    typeof r.lines === 'number' &&
    Number.isFinite(r.lines) &&
    typeof r.level === 'number' &&
    Number.isFinite(r.level)
  );
}

function getRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRecord).slice(0, MAX_RECORDS);
  } catch (e) {
    return [];
  }
}

function persistRecords(records) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    // Storage unavailable/full — fail silently, never break the game.
  }
}

function getStats() {
  const fallback = { bestCombo: 0, maxLines: 0 };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return {
      bestCombo: typeof parsed.bestCombo === 'number' && Number.isFinite(parsed.bestCombo) ? parsed.bestCombo : 0,
      maxLines: typeof parsed.maxLines === 'number' && Number.isFinite(parsed.maxLines) ? parsed.maxLines : 0,
    };
  } catch (e) {
    return fallback;
  }
}

function persistStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    // ignore
  }
}

function qualifiesForTop(score) {
  const s = Number(score) || 0;
  const records = getRecords();
  if (records.length < MAX_RECORDS) return true;
  const minScore = Math.min(...records.map(r => r.score));
  return s > minScore;
}

function saveRecord({ name, score, lines, level }) {
  const records = getRecords();
  const safeName = (typeof name === 'string' && name.trim()) ? name.trim().slice(0, MAX_NAME_LENGTH) : 'ANON';
  const entry = {
    name: safeName,
    score: Number(score) || 0,
    lines: Number(lines) || 0,
    level: Number(level) || 1,
  };
  records.push(entry);
  records.sort((a, b) => b.score - a.score);
  const trimmed = records.slice(0, MAX_RECORDS);
  persistRecords(trimmed);
  return trimmed.indexOf(entry);
}

function resetRecords() {
  if (!confirm('¿Seguro que quieres borrar la tabla de récords y las estadísticas?')) return false;
  try {
    localStorage.removeItem(RECORDS_KEY);
    localStorage.removeItem(STATS_KEY);
  } catch (e) {
    // ignore
  }
  return true;
}

function getBestCombo() {
  return getStats().bestCombo;
}

function getMaxLines() {
  return getStats().maxLines;
}

function updateStats({ combo, lines }) {
  const stats = getStats();
  const bestCombo = Math.max(stats.bestCombo, Number(combo) || 0);
  const maxLines = Math.max(stats.maxLines, Number(lines) || 0);
  persistStats({ bestCombo, maxLines });
}

function renderRecords(containerEl, highlightIndex) {
  if (!containerEl) return;
  containerEl.textContent = '';

  const records = getRecords();
  if (records.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'records-empty';
    empty.textContent = 'Sin récords todavía';
    containerEl.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'records-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['#', 'Nombre', 'Score', 'Líneas', 'Nivel'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  records.forEach((r, i) => {
    const tr = document.createElement('tr');
    if (i === highlightIndex) tr.classList.add('highlight');
    [String(i + 1), r.name, r.score.toLocaleString(), String(r.lines), String(r.level)].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  containerEl.appendChild(table);
}
