/* ============================================
   لعبة تيك تاك تو العمانية (X-O)
   ============================================ */

import { state, dom } from '../state.js';
import { playSound, setStatus, fireConfetti } from '../utils.js';
import { sendToPeer } from '../network.js';

const lines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function renderTicTacToe() {
  dom.tictactoeBoard.innerHTML = '';
  state.ttt.board.forEach((cell, index) => {
    const div = document.createElement('div');
    div.className = 'tictactoe-cell';
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', `خلية ${index + 1}`);
    if (cell) div.classList.add('taken');
    if (state.ttt.winLine.includes(index)) div.classList.add('win');
    div.textContent = cell || '';
    div.addEventListener('click', () => handleTttCellClick(index));
    dom.tictactoeBoard.appendChild(div);
  });
}

function checkTttWinner() {
  for (const line of lines) {
    const [a, b, c] = line;
    if (state.ttt.board[a] && state.ttt.board[a] === state.ttt.board[b] && state.ttt.board[a] === state.ttt.board[c]) {
      state.ttt.winner = state.ttt.board[a];
      state.ttt.winLine = line;
      state.ttt.active = false;
      renderTicTacToe();
      setStatus(`فاز ${state.ttt.winner === 'X' ? 'X' : 'O'}! 🎉`);
      playSound('win');
      fireConfetti();
      return;
    }
  }

  if (state.ttt.board.every(cell => cell !== null)) {
    state.ttt.active = false;
    state.ttt.winner = 'draw';
    setStatus('تعادل! 🤝');
    return;
  }
}

function findBestMove(symbol) {
  for (const [a, b, c] of lines) {
    const cells = [state.ttt.board[a], state.ttt.board[b], state.ttt.board[c]];
    const count = cells.filter(v => v === symbol).length;
    const empty = cells.filter(v => v === null).length;
    if (count === 2 && empty === 1) {
      if (state.ttt.board[a] === null) return a;
      if (state.ttt.board[b] === null) return b;
      return c;
    }
  }
  return -1;
}

function aiMove() {
  if (!state.ttt.active || state.ttt.mode !== 'single') return;

  const winMove = findBestMove(state.ttt.opponentSymbol);
  if (winMove !== -1) {
    makeMove(winMove, state.ttt.opponentSymbol);
    return;
  }
  const blockMove = findBestMove(state.ttt.mySymbol);
  if (blockMove !== -1) {
    makeMove(blockMove, state.ttt.opponentSymbol);
    return;
  }
  const empties = state.ttt.board.map((c, i) => (c === null ? i : null)).filter(i => i !== null);
  if (empties.length > 0) {
    const pick = empties[Math.floor(Math.random() * empties.length)];
    makeMove(pick, state.ttt.opponentSymbol);
  }
}

function handleTttCellClick(index) {
  if (!state.ttt.active || state.ttt.board[index]) return;
  if (state.ttt.mode === 'online' && state.ttt.turn !== state.ttt.mySymbol) return;

  makeMove(index, state.ttt.mySymbol);

  if (state.ttt.mode === 'online') {
    sendToPeer({ type: 'move', index, symbol: state.ttt.mySymbol });
  } else if (state.ttt.active && state.ttt.turn === state.ttt.opponentSymbol) {
    setTimeout(aiMove, 450);
  }
}

export function makeMove(index, symbol, remote = false) {
  if (!state.ttt.active || state.ttt.board[index]) return;
  state.ttt.board[index] = symbol;
  state.ttt.turn = state.ttt.turn === 'X' ? 'O' : 'X';
  playSound('move');
  renderTicTacToe();
  checkTttWinner();

  if (!state.ttt.active) return;

  if (state.ttt.mode === 'online') {
    setStatus(state.ttt.turn === state.ttt.mySymbol ? 'دورك!' : 'دور الخصم');
  } else {
    setStatus(state.ttt.turn === 'X' ? 'دورك!' : 'دور الجهاز');
  }
}

export function reset(remote = false) {
  if (!remote && state.ttt.mode === 'online') {
    sendToPeer({ type: 'reset' });
  }
  init(state.ttt.mode);
}

function init(mode) {
  state.ttt.mode = mode;
  state.ttt.board = Array(9).fill(null);
  state.ttt.winner = null;
  state.ttt.winLine = [];
  state.ttt.active = true;

  if (mode === 'online') {
    state.ttt.mySymbol = state.mySymbol || 'X';
    state.ttt.opponentSymbol = state.ttt.mySymbol === 'X' ? 'O' : 'X';
    state.ttt.turn = 'X';
    setStatus(state.ttt.mySymbol === 'X' ? 'دورك! ضع X' : 'في انتظار الخصم...');
  } else {
    state.ttt.mySymbol = 'X';
    state.ttt.opponentSymbol = 'O';
    state.ttt.turn = 'X';
    setStatus('دورك! ضع X');
  }

  renderTicTacToe();
}

function cleanup() {
  dom.tictactoeContainer.classList.add('hidden');
}

export function onMessage(type, data) {
  if (type === 'move') {
    makeMove(data.index, data.symbol, true);
  } else if (type === 'reset') {
    reset(true);
  }
}

export const TicTacToeGame = {
  init(mode) {
    dom.tictactoeContainer.classList.remove('hidden');
    init(mode);
  },
  cleanup,
  reset,
  makeMove,
  onMessage
};
