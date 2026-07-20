/* ============================================
   منصة ألعاب عُمانية للأطفال - تنسيق التطبيق
   ============================================ */

import { state, dom } from './state.js';
import { GAMES } from './config.js';
import {
  playSound, toggleMute, toggleFullscreen, updateFullscreenIcon,
  resizeConfetti, setStatus, showEmoji, findGame
} from './utils.js';
import * as network from './network.js';
import * as ui from './ui.js';
import { RunnerGame } from './games/runner.js';
import { TicTacToeGame } from './games/tictactoe.js';
import { FortBattleGame } from './games/fortBattle.js';

function stopCurrentGame() {
  RunnerGame.cleanup();
  TicTacToeGame.cleanup();
  FortBattleGame.cleanup();
  dom.onlinePanel.classList.add('hidden');
  state.currentGame = null;
}

function startGame(gameId, mode, seed = null) {
  const game = findGame(gameId);
  if (!game) return;

  stopCurrentGame();
  state.currentGame = gameId;
  playSound('click');
  ui.showGame(gameId);
  setStatus('');

  if (gameId === 'frankincense') {
    RunnerGame.init(mode);
  } else if (gameId === 'tictactoe') {
    if (mode === 'online') dom.onlinePanel.classList.remove('hidden');
    TicTacToeGame.init(mode);
  } else if (gameId === 'archery') {
    if (mode === 'online') dom.onlinePanel.classList.remove('hidden');
    FortBattleGame.init(mode, seed);
  }
}

function goHome() {
  playSound('click');
  stopCurrentGame();
  network.resetPeer();
  ui.showHome();
  setStatus('');
}

function setupEventListeners() {
  dom.backBtn.addEventListener('click', goHome);
  dom.muteBtn.addEventListener('click', toggleMute);
  dom.fullscreenBtn.addEventListener('click', () => {
    playSound('click');
    toggleFullscreen();
  });
  document.addEventListener('fullscreenchange', updateFullscreenIcon);

  dom.modalCloses.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      if (btn.closest('#mode-modal')) ui.closeModeModal();
      if (btn.closest('#soon-modal')) ui.closeSoonModal();
    });
  });
  document.querySelector('#soon-modal .modal-close-btn')?.addEventListener('click', ui.closeSoonModal);

  dom.btnSingle.addEventListener('click', () => {
    playSound('click');
    startGame(state.pendingGameId, 'single');
    ui.closeModeModal();
  });

  dom.btnOnline.addEventListener('click', () => {
    playSound('click');
    dom.modeButtons.classList.add('hidden');
    dom.onlineSetup.classList.remove('hidden');
    dom.onlineMsg.textContent = '';
  });

  dom.btnHost.addEventListener('click', () => {
    playSound('click');
    network.hostRoom(state.pendingGameId);
  });

  dom.btnJoin.addEventListener('click', () => {
    playSound('click');
    const code = dom.roomInput.value.trim();
    network.joinRoom(state.pendingGameId, code);
  });

  dom.roomInput.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  });

  dom.emojiPanel.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      showEmoji(emoji);
      network.sendToPeer({ type: 'emoji', emoji });
      playSound('click');
    });
  });

  dom.tttReset.addEventListener('click', () => {
    playSound('click');
    TicTacToeGame.reset(false);
  });

  document.addEventListener('keydown', e => {
    if (state.currentGame === 'frankincense') {
      if (e.code === 'ArrowUp' || e.code === 'Space') {
        e.preventDefault();
        RunnerGame.jump();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        RunnerGame.setDucking(true);
      }
    } else if (state.currentGame === 'archery') {
      FortBattleGame.handleKey(e);
    }
  });

  document.addEventListener('keyup', e => {
    if (state.currentGame !== 'frankincense') return;
    if (e.code === 'ArrowDown') {
      RunnerGame.setDucking(false);
    }
  });

  dom.runnerJumpBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    RunnerGame.jump();
  });
  dom.runnerJumpBtn.addEventListener('click', () => RunnerGame.jump());

  const startDuck = e => {
    e.preventDefault();
    RunnerGame.setDucking(true);
  };
  const endDuck = e => {
    e.preventDefault();
    RunnerGame.setDucking(false);
  };
  dom.runnerDuckBtn.addEventListener('touchstart', startDuck);
  dom.runnerDuckBtn.addEventListener('touchend', endDuck);
  dom.runnerDuckBtn.addEventListener('mousedown', startDuck);
  dom.runnerDuckBtn.addEventListener('mouseup', endDuck);
  dom.runnerDuckBtn.addEventListener('mouseleave', endDuck);

  dom.runnerCanvas.addEventListener('click', () => {
    if (RunnerGame.isOver()) RunnerGame.restart();
  });

  dom.archeryStartBtn.addEventListener('click', () => {
    playSound('click');
    FortBattleGame.startNewBattle();
  });

  dom.archeryAngleUp.addEventListener('click', () => FortBattleGame.adjustAim(-0.06));
  dom.archeryAngleDown.addEventListener('click', () => FortBattleGame.adjustAim(0.06));
  dom.archeryShootBtn.addEventListener('click', () => FortBattleGame.shoot());

  const onArcheryMouseMove = e => {
    FortBattleGame.handlePointerMove(e.clientX, e.clientY);
  };
  const onArcheryMouseUp = () => {
    window.removeEventListener('mousemove', onArcheryMouseMove);
    window.removeEventListener('mouseup', onArcheryMouseUp);
    FortBattleGame.handlePointerUp();
  };

  dom.archeryCanvas.addEventListener('mousedown', e => {
    FortBattleGame.handlePointerDown(e.clientX, e.clientY);
    window.addEventListener('mousemove', onArcheryMouseMove);
    window.addEventListener('mouseup', onArcheryMouseUp);
  });

  const onArcheryTouchMove = e => {
    e.preventDefault();
    FortBattleGame.handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onArcheryTouchEnd = e => {
    if (e.cancelable) e.preventDefault();
    window.removeEventListener('touchmove', onArcheryTouchMove);
    window.removeEventListener('touchend', onArcheryTouchEnd);
    window.removeEventListener('touchcancel', onArcheryTouchEnd);
    FortBattleGame.handlePointerUp();
  };

  dom.archeryCanvas.addEventListener('touchstart', e => {
    e.preventDefault();
    FortBattleGame.handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    window.addEventListener('touchmove', onArcheryTouchMove, { passive: false });
    window.addEventListener('touchend', onArcheryTouchEnd);
    window.addEventListener('touchcancel', onArcheryTouchEnd);
  }, { passive: false });

  dom.archeryCanvas.addEventListener('click', () => {
    if (state.archery.over && state.archery.mode !== 'online') {
      FortBattleGame.startNewBattle();
    }
  });

  window.addEventListener('resize', () => {
    resizeConfetti();
    if (state.currentGame === 'frankincense') RunnerGame.resize();
  });
}

function setupNetworkRouting() {
  network.onConnect(() => {
    ui.closeModeModal();
    startGame(state.pendingGameId, 'online');
  });

  network.onDisconnect(() => {
    setStatus('انقطع الاتصال بالخصم');
  });

  network.onMessage('move', data => {
    if (state.currentGame === 'tictactoe') {
      TicTacToeGame.onMessage('move', data);
    }
  });

  network.onMessage('reset', data => {
    if (state.currentGame === 'tictactoe') {
      TicTacToeGame.onMessage('reset', data);
    }
  });

  network.onMessage('emoji', data => {
    if (data && data.emoji) showEmoji(data.emoji);
  });

  network.onMessage('archeryStart', data => {
    if (state.currentGame !== 'archery') {
      startGame('archery', 'online', data.seed || 0);
    } else {
      FortBattleGame.onMessage('archeryStart', data);
    }
  });

  network.onMessage('archeryShot', data => {
    if (state.currentGame === 'archery') {
      FortBattleGame.onMessage('archeryShot', data);
    }
  });

  network.onMessage('archeryDamage', data => {
    if (state.currentGame === 'archery') {
      FortBattleGame.onMessage('archeryDamage', data);
    }
  });

  network.onMessage('archeryEnd', data => {
    if (state.currentGame === 'archery') {
      FortBattleGame.onMessage('archeryEnd', data);
    }
  });
}

function init() {
  resizeConfetti();
  ui.renderGames(gameId => {
    const game = findGame(gameId);
    if (!game) return;
    if (game.supportsOnline) ui.openModeModal(gameId);
    else startGame(gameId, 'single');
  });
  setupEventListeners();
  setupNetworkRouting();
  updateFullscreenIcon();
  goHome();
}

init();
