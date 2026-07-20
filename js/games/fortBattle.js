/* ============================================
   لعبة معركة قلاع الرماة (Fort Battle)
   ============================================ */

import { state, dom } from '../state.js';
import { ARCHERY, ARCHER_POS } from '../config.js';
import { playSound, setStatus, fireConfetti, toCanvasPos } from '../utils.js';
import { sendToPeer } from '../network.js';

function rectContainsPoint(rx, ry, rw, rh, px, py) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function addArrow(owner, x, y, vx, vy) {
  state.archery.arrows.push({ owner, x, y, vx, vy });
}

function dealDamage(side, amount, shouldSend) {
  const a = state.archery;
  if (side === 'left') a.leftHealth = Math.max(0, a.leftHealth - amount);
  else a.rightHealth = Math.max(0, a.rightHealth - amount);

  playSound('score');
  if (shouldSend) {
    sendToPeer({ type: 'archeryDamage', side, damage: amount });
  }
  checkArcheryGameOver();
}

function checkArcheryGameOver() {
  const a = state.archery;
  if (a.leftHealth <= 0 || a.rightHealth <= 0) {
    let winner = null;
    if (a.leftHealth <= 0 && a.rightHealth <= 0) winner = 'draw';
    else winner = a.leftHealth <= 0 ? 'right' : 'left';
    endArcheryBattle(winner);
  }
}

function endArcheryBattle(winnerSide) {
  const a = state.archery;
  if (a.over) return;
  a.active = false;
  a.over = true;
  if (a.aiTimer) clearTimeout(a.aiTimer);
  if (a.animId) { cancelAnimationFrame(a.animId); a.animId = null; }
  playSound('over');

  let resultText = '';
  if (a.mode === 'single') {
    resultText = winnerSide === 'left' ? 'فزت! 🏆' : 'خسرت! حاول مجدداً';
    if (winnerSide === 'left') fireConfetti();
  } else {
    const myWin = winnerSide === 'draw' ? false : winnerSide === a.mySide;
    resultText = winnerSide === 'draw' ? 'تعادل! 🤝' : (myWin ? 'فزت! 🏆' : 'خسرت! حاول مجدداً');
    if (myWin) fireConfetti();
    sendToPeer({ type: 'archeryEnd', winner: winnerSide });
    if (state.isHost) {
      dom.archeryStartBtn.classList.remove('hidden');
      dom.archeryStartBtn.textContent = 'معركة جديدة';
    }
  }
  setStatus(resultText);
}

function updateArchery(dt) {
  const a = state.archery;
  const gravity = 900;

  for (let i = a.arrows.length - 1; i >= 0; i--) {
    const arr = a.arrows[i];
    arr.vy += gravity * dt;
    arr.x += arr.vx * dt;
    arr.y += arr.vy * dt;

    const targetSide = arr.owner === 'left' ? 'right' : 'left';
    const fortX = targetSide === 'left' ? ARCHERY.LEFT_FORT_X : ARCHERY.RIGHT_FORT_X;
    const hit = rectContainsPoint(fortX - ARCHERY.FORT_WIDTH / 2, ARCHERY.GROUND_Y - ARCHERY.FORT_HEIGHT, ARCHERY.FORT_WIDTH, ARCHERY.FORT_HEIGHT, arr.x, arr.y);
    const offScreen = arr.x < -100 || arr.x > ARCHERY.WIDTH + 100 || arr.y < -100 || arr.y > ARCHERY.HEIGHT + 100;

    if (hit) {
      a.arrows.splice(i, 1);
      const canDealDamage = a.mode === 'single' || arr.owner === a.mySide;
      if (canDealDamage) {
        const shouldSend = a.mode === 'online';
        dealDamage(targetSide, ARCHERY.ARROW_DAMAGE, shouldSend);
      }
      continue;
    }
    if (offScreen) {
      a.arrows.splice(i, 1);
    }
  }
}

function drawFort(ctx, side) {
  const x = side === 'left' ? ARCHERY.LEFT_FORT_X : ARCHERY.RIGHT_FORT_X;
  const y = ARCHERY.GROUND_Y - ARCHERY.FORT_HEIGHT;

  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(x - ARCHERY.FORT_WIDTH / 2, y, ARCHERY.FORT_WIDTH, ARCHERY.FORT_HEIGHT);

  ctx.fillStyle = '#6d4c41';
  const cw = ARCHERY.FORT_WIDTH / 3;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x - ARCHERY.FORT_WIDTH / 2 + i * cw, y - 15, cw - 4, 15);
  }

  ctx.fillStyle = '#4e342e';
  ctx.beginPath();
  ctx.arc(x, ARCHERY.GROUND_Y, 24, Math.PI, 0, true);
  ctx.fill();

  const archer = ARCHER_POS[side];
  drawArcher(ctx, archer.x, archer.y, side);
}

function drawArcher(ctx, x, y, side) {
  ctx.fillStyle = '#1e6f7a';
  ctx.beginPath();
  ctx.arc(x, y - 18, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 10, y - 18, 20, 38);

  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (side === 'left') {
    ctx.arc(x + 8, y - 8, 22, -Math.PI / 2, Math.PI / 2, false);
  } else {
    ctx.arc(x - 8, y - 8, 22, Math.PI / 2, 3 * Math.PI / 2, false);
  }
  ctx.stroke();
}

function drawArrow(ctx, arr) {
  const angle = Math.atan2(arr.vy, arr.vx);
  ctx.save();
  ctx.translate(arr.x, arr.y);
  ctx.rotate(angle);
  ctx.fillStyle = '#2f2f2f';
  ctx.fillRect(-18, -2, 36, 4);
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(18, -5);
  ctx.lineTo(30, 0);
  ctx.lineTo(18, 5);
  ctx.fill();
  ctx.restore();
}

function drawHealthBar(ctx, side) {
  const x = side === 'left' ? ARCHERY.LEFT_FORT_X : ARCHERY.RIGHT_FORT_X;
  const y = ARCHERY.GROUND_Y - ARCHERY.FORT_HEIGHT - 70;
  const health = side === 'left' ? state.archery.leftHealth : state.archery.rightHealth;
  const width = 130;
  const height = 20;

  ctx.fillStyle = '#ddd';
  ctx.fillRect(x - width / 2, y, width, height);

  ctx.fillStyle = health > 50 ? '#27ae60' : (health > 25 ? '#f4b942' : '#c0392b');
  ctx.fillRect(x - width / 2, y, width * (health / 100), height);

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - width / 2, y, width, height);

  ctx.fillStyle = '#2f2f2f';
  ctx.font = 'bold 18px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(health + '%', x, y - 8);
}

function getArcheryOverText() {
  const a = state.archery;
  if (a.mode === 'single') return a.leftHealth > 0 ? 'Victory! 🏆' : 'Defeat! 💥';
  if (a.leftHealth === a.rightHealth) return 'Draw! 🤝';
  return a.mySide === (a.leftHealth > 0 ? 'left' : 'right') ? 'Victory! 🏆' : 'Defeat! 💥';
}

function drawArchery() {
  const ctx = dom.archeryCanvas.getContext('2d');
  ctx.clearRect(0, 0, ARCHERY.WIDTH, ARCHERY.HEIGHT);

  const grad = ctx.createLinearGradient(0, 0, 0, ARCHERY.HEIGHT);
  grad.addColorStop(0, '#dff6f9');
  grad.addColorStop(0.6, '#fff8e7');
  grad.addColorStop(1, '#e6d5b8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ARCHERY.WIDTH, ARCHERY.HEIGHT);

  ctx.fillStyle = '#a8906d';
  ctx.fillRect(0, ARCHERY.GROUND_Y, ARCHERY.WIDTH, ARCHERY.HEIGHT - ARCHERY.GROUND_Y);

  drawFort(ctx, 'left');
  drawFort(ctx, 'right');

  const a = state.archery;
  if (a.active && !a.over) {
    const archer = ARCHER_POS[a.mySide];
    if (a.dragging) {
      ctx.strokeStyle = 'rgba(192, 57, 43, 0.7)';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(archer.x, archer.y);
      ctx.lineTo(a.pointer.x, a.pointer.y);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(30, 111, 122, 0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(archer.x, archer.y);
      ctx.lineTo(archer.x + Math.cos(a.aimAngle) * 90, archer.y + Math.sin(a.aimAngle) * 90);
      ctx.stroke();
    }
  }

  a.arrows.forEach(arr => drawArrow(ctx, arr));

  drawHealthBar(ctx, 'left');
  drawHealthBar(ctx, 'right');

  if (a.over) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, ARCHERY.WIDTH, ARCHERY.HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 56px Cairo, sans-serif';
    ctx.fillText(getArcheryOverText(), ARCHERY.WIDTH / 2, ARCHERY.HEIGHT / 2);
    ctx.font = '22px Cairo, sans-serif';
    if (a.mode !== 'online') {
      ctx.fillText('Click or press Space to play again', ARCHERY.WIDTH / 2, ARCHERY.HEIGHT / 2 + 50);
    } else if (!state.isHost) {
      ctx.fillText('Waiting for host to start a new battle...', ARCHERY.WIDTH / 2, ARCHERY.HEIGHT / 2 + 50);
    }
  }
}

function archeryLoop(timestamp) {
  const a = state.archery;
  if (!a.active) return;
  const dt = Math.min((timestamp - a.lastTime) / 1000, 0.05);
  a.lastTime = timestamp;
  updateArchery(dt);
  drawArchery();
  a.animId = requestAnimationFrame(archeryLoop);
}

function fireAiArrow() {
  const a = state.archery;
  if (!a.active || a.over) return;
  const archer = ARCHER_POS.right;
  const target = ARCHER_POS.left;
  const dx = target.x - archer.x + (Math.random() - 0.5) * 300;
  const dy = target.y - archer.y + (Math.random() - 0.5) * 150;
  const angle = Math.atan2(dy, dx);
  const power = ARCHERY.MIN_ARROW_POWER + Math.random() * (ARCHERY.MAX_ARROW_POWER - ARCHERY.MIN_ARROW_POWER);
  addArrow('right', archer.x, archer.y, Math.cos(angle) * power, Math.sin(angle) * power);
}

function startAiLoop() {
  const a = state.archery;
  if (a.mode !== 'single') return;
  const shootAi = () => {
    if (!a.active || a.over) return;
    fireAiArrow();
    a.aiTimer = setTimeout(shootAi, 2000 + Math.random() * 2000);
  };
  a.aiTimer = setTimeout(shootAi, 1500);
}

export function startRound() {
  const a = state.archery;
  a.active = true;
  a.over = false;
  a.leftHealth = 100;
  a.rightHealth = 100;
  a.arrows = [];
  a.lastTime = performance.now();
  if (a.aiTimer) clearTimeout(a.aiTimer);
  dom.archeryStartBtn.classList.add('hidden');
  dom.archeryWaiting.classList.add('hidden');

  if (a.animId) cancelAnimationFrame(a.animId);
  a.animId = requestAnimationFrame(archeryLoop);

  if (a.mode === 'single') {
    startAiLoop();
    setStatus('اسحب من قلعتك نحو قلعة العدو واطلق السهام!');
  } else {
    setStatus('اسحب من قلعتك نحو قلعة الخصم واطلق!');
  }
}

function init(mode, seed = null) {
  dom.archeryCanvas.width = ARCHERY.WIDTH;
  dom.archeryCanvas.height = ARCHERY.HEIGHT;

  const a = state.archery;
  a.mode = mode;
  a.active = false;
  a.over = false;
  a.mySide = mode === 'online' ? (state.isHost ? 'left' : 'right') : 'left';
  a.leftHealth = 100;
  a.rightHealth = 100;
  a.arrows = [];
  a.dragging = false;
  a.aimAngle = a.mySide === 'left' ? 0 : Math.PI;
  a.lastTime = performance.now();
  if (a.aiTimer) clearTimeout(a.aiTimer);
  a.aiTimer = null;

  dom.archeryStartBtn.classList.add('hidden');
  dom.archeryWaiting.classList.add('hidden');

  if (mode === 'online') {
    if (seed) {
      startRound();
      return;
    }
    if (state.isHost) {
      dom.archeryStartBtn.classList.remove('hidden');
      dom.archeryStartBtn.textContent = 'ابدأ المعركة';
      setStatus('انقر لبدء المعركة عندما يكون صديقك جاهزاً');
    } else {
      dom.archeryWaiting.classList.remove('hidden');
      setStatus('في انتظار المضيف لبدء المعركة...');
    }
  } else {
    startRound();
  }
  drawArchery();
}

function cleanup() {
  const a = state.archery;
  if (a.animId) {
    cancelAnimationFrame(a.animId);
    a.animId = null;
  }
  if (a.aiTimer) {
    clearTimeout(a.aiTimer);
    a.aiTimer = null;
  }
  a.active = false;
  dom.archeryContainer.classList.add('hidden');
}

function shootArcheryArrow() {
  const a = state.archery;
  if (!a.active || a.over) return;
  const archer = ARCHER_POS[a.mySide];
  let dx, dy, power;

  if (a.dragging) {
    dx = a.pointer.x - archer.x;
    dy = a.pointer.y - archer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const scale = Math.min(dist, 200) / 200;
    power = ARCHERY.MIN_ARROW_POWER + scale * (ARCHERY.MAX_ARROW_POWER - ARCHERY.MIN_ARROW_POWER);
    const angle = Math.atan2(dy, dx);
    dx = Math.cos(angle);
    dy = Math.sin(angle);
    a.dragging = false;
  } else {
    dx = Math.cos(a.aimAngle);
    dy = Math.sin(a.aimAngle);
    power = 1000;
  }

  const vx = dx * power;
  const vy = dy * power;
  addArrow(a.mySide, archer.x, archer.y, vx, vy);
  if (a.mode === 'online') {
    sendToPeer({ type: 'archeryShot', owner: a.mySide, x: archer.x, y: archer.y, vx, vy });
  }
  playSound('move');
}

export function handlePointerDown(clientX, clientY) {
  if (!state.archery.active || state.archery.over) return;
  const p = toCanvasPos(clientX, clientY);
  state.archery.dragging = true;
  state.archery.pointer = { x: p.x, y: p.y };
}

export function handlePointerMove(clientX, clientY) {
  if (state.archery.dragging) {
    const p = toCanvasPos(clientX, clientY);
    state.archery.pointer = { x: p.x, y: p.y };
  }
}

export function handlePointerUp() {
  if (state.archery.dragging) {
    shootArcheryArrow();
  }
}

export function handleKey(e) {
  if (state.archery.dragging) return;
  const a = state.archery;
  if (e.code === 'ArrowLeft') {
    e.preventDefault();
    a.aimAngle -= 0.06;
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    a.aimAngle += 0.06;
  } else if (e.code === 'Space') {
    e.preventDefault();
    if (a.over && a.mode !== 'online') {
      startRound();
    } else {
      shootArcheryArrow();
    }
  }
}

export function startNewBattle() {
  const a = state.archery;
  if (a.mode === 'online') {
    if (state.isHost) {
      sendToPeer({ type: 'archeryStart', seed: 0 });
      startRound();
    }
  } else {
    startRound();
  }
}

export function onMessage(type, data) {
  const a = state.archery;
  if (type === 'archeryStart') {
    startRound();
  } else if (type === 'archeryShot') {
    if (data && data.owner && data.x != null && data.y != null && data.vx != null && data.vy != null) {
      addArrow(data.owner, data.x, data.y, data.vx, data.vy);
    }
  } else if (type === 'archeryDamage') {
    dealDamage(data.side, data.damage, false);
  } else if (type === 'archeryEnd') {
    if (!a.over && data.winner) {
      endArcheryBattle(data.winner);
    }
  }
}

export const FortBattleGame = {
  init(mode, seed = null) {
    dom.archeryContainer.classList.remove('hidden');
    init(mode, seed);
  },
  cleanup,
  startRound,
  startNewBattle,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleKey,
  onMessage
};
