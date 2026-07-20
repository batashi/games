/* ============================================
   واجهة المستخدم - عرض الألعاب والنوافذ المنبثقة
   ============================================ */

import { state, dom } from './state.js';
import { GAMES } from './config.js';
import { playSound, findGame } from './utils.js';

export function renderGames(onSelectGameCallback) {
  dom.grid.innerHTML = '';
  GAMES.forEach(game => {
    const card = document.createElement('article');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="game-icon">${game.icon}</div>
      <h3>${game.name}</h3>
      <p>${game.desc}</p>
    `;

    if (game.supportsSingle || game.supportsOnline) {
      const btn = document.createElement('button');
      btn.className = 'primary-btn';
      btn.textContent = 'ابدأ اللعب';
      btn.style.width = '100%';
      btn.addEventListener('click', () => {
        playSound('click');
        onSelectGameCallback(game.id);
      });
      card.appendChild(btn);
    } else {
      const badge = document.createElement('span');
      badge.className = 'coming-soon-badge';
      badge.textContent = 'قريباً';
      card.appendChild(badge);
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        playSound('click');
        openSoonModal();
      });
    }

    dom.grid.appendChild(card);
  });
}

export function openModeModal(gameId) {
  const game = findGame(gameId);
  if (!game) return;
  state.pendingGameId = gameId;
  dom.modeGameName.textContent = game.name;
  dom.modeButtons.classList.remove('hidden');
  dom.onlineSetup.classList.add('hidden');
  dom.onlineMsg.textContent = '';
  dom.roomInput.value = '';
  dom.modeModal.classList.remove('hidden');
  playSound('click');
}

export function closeModeModal() {
  dom.modeModal.classList.add('hidden');
  dom.onlineSetup.classList.add('hidden');
  dom.modeButtons.classList.remove('hidden');
  dom.onlineMsg.textContent = '';
}

export function openSoonModal() {
  dom.soonModal.classList.remove('hidden');
}

export function closeSoonModal() {
  dom.soonModal.classList.add('hidden');
}

export function showHome() {
  dom.gameView.classList.remove('active');
  dom.homeView.classList.add('active');
  dom.backBtn.classList.add('hidden');
  dom.gameTitle.textContent = '';
}

export function showGame(gameId) {
  const game = findGame(gameId);
  if (!game) return;
  dom.homeView.classList.remove('active');
  dom.gameView.classList.add('active');
  dom.backBtn.classList.remove('hidden');
  dom.gameTitle.textContent = game.name;
}
