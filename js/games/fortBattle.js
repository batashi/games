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

function createBlocks(side) {
  const fortX = side === 'left' ? ARCHERY.LEFT_FORT_X : ARCHERY.RIGHT_FORT_X;
  const bw = ARCHERY.FORT_WIDTH / ARCHERY.BLOCK_COLS;
  const bh = ARCHERY.FORT_HEIGHT / ARCHERY.BLOCK_ROWS;
  const startX = fortX - ARCHERY.FORT_WIDTH / 2;
  const startY = ARCHERY.GROUND_Y - ARCHERY.FORT_HEIGHT;
  const blocks = [];
  for (let r = 0; r < ARCHERY.BLOCK_ROWS; r++) {
    for (let c = 0; c < ARCHERY.BLOCK_COLS; c++) {
      blocks.push({
        x: startX + c * bw,
        y: startY + r * bh,
        w: bw,
        h: bh,
        alive: true
      });
    }
  }
  return blocks;
}

function getAliveBlocks(side) {
  return state.archery.blocks[side].filter(b => b.alive);
}

function updateHealthFromBlocks() {
  const total = ARCHERY.BLOCK_COLS * ARCHERY.BLOCK_ROWS;
  state.archery.leftHealth = Math.round((getAliveBlocks('left').length / total) * 100);
  state.archery.rightHealth = Math.round((getAliveBlocks('right').length / total) * 100);
}

function destroyBlocks(side, count, hitX, hitY) {
  const blocks = state.archery.blocks[side];
  let alive = blocks.filter(b => b.alive);
  if (alive.length === 0) return;

  if (hitX != null && hitY != null) {
    alive.sort((a, b) => {
      const da = (a.x + a.w / 2 - hitX) ** 2 + (a.y + a.h / 2 - hitY) ** 2;
      const db = (b.x + b.w / 2 - hitX) ** 2 + (b.y + b.h / 2 - hitY) ** 2;
      return da - db;
    });
  } else {
    // shuffle
    for (let i = alive.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [alive[i], alive[j]] = [alive[j], alive[i]];
    }
  }

  const toDestroy = Math.min(count, alive.length);
  for (let i = 0; i < toDestroy; i++) {
    alive[i].alive = false;
  }
  updateHealthFromBlocks();
  state.archery.shake = Math.min(state.archery.shake + 10, 20);
}

function getFortHealth(side) {
  return side === 'left' ? state.archery.leftHealth : state.archery.rightHealth;
}

function dealDamage(side, amount, shouldSend) {
  const total = ARCHERY.BLOCK_COLS * ARCHERY.BLOCK_ROWS;
  const blockCount = Math.max(1, Math.round(total * (amount / 100)));
  destroyBlocks(side, blockCount, null, null);

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
    arr.vx += a.wind * dt;
    arr.x += arr.vx * dt;
    arr.y += arr.vy * dt;

    const targetSide = arr.owner === 'left' ? 'right' : 'left';
    const blocks = a.blocks[targetSide];
    let hitBlock = null;
    for (const block of blocks) {
      if (block.alive && rectContainsPoint(block.x, block.y, block.w, block.h, arr.x, arr.y)) {
        hitBlock = block;
        break;
      }
    }

    const offScreen = arr.x < -100 || arr.x > ARCHERY.WIDTH + 100 || arr.y < -100 || arr.y > ARCHERY.HEIGHT + 100;

    if (hitBlock) {
      a.arrows.splice(i, 1);
      const canDealDamage = a.mode === 'single' || arr.owner === a.mySide;
      if (canDealDamage) {
        const shouldSend = a.mode === 'online';
        const total = ARCHERY.BLOCK_COLS * ARCHERY.BLOCK_ROWS;
        const blockCount = Math.max(1, Math.round(total * (ARCHERY.ARROW_DAMAGE / 100)));
        destroyBlocks(targetSide, blockCount, arr.x, arr.y);
        playSound('score');
        if (shouldSend) {
          sendToPeer({ type: 'archeryDamage', side: targetSide, damage: ARCHERY.ARROW_DAMAGE });
        }
        checkArcheryGameOver();
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

  // Foundation shown behind destroyed blocks
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x - ARCHERY.FORT_WIDTH / 2, y, ARCHERY.FORT_WIDTH, ARCHERY.FORT_HEIGHT);

  // Individual blocks
  const blocks = state.archery.blocks[side];
  for (const block of blocks) {
    if (!block.alive) continue;
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(block.x + 1, block.y + 1, block.w - 2, block.h - 2);
    ctx.strokeStyle = '#6d4c41';
    ctx.lineWidth = 2;
    ctx.strokeRect(block.x + 1, block.y + 1, block.w - 2, block.h - 2);
  }

  // Gate
  ctx.fillStyle = '#4e342e';
  ctx.beginPath();
  ctx.arc(x, ARCHERY.GROUND_Y, 24, Math.PI, 0, true);
  ctx.fill();

  // Archer
  const archer = ARCHER_POS[side];
  drawArcher(ctx, archer.x, archer.y, side);
}

function drawArcher(ctx, x, y, side) {
  const faceDir = side === 'left' ? 1 : -1;

  // Body
  ctx.fillStyle = '#1e6f7a';
  ctx.beginPath();
  ctx.arc(x, y - 18, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 10, y - 18, 20, 38);

  // Bow
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (side === 'left') {
    ctx.arc(x + 8, y - 8, 22, -Math.PI / 2, Math.PI / 2, false);
  } else {
    ctx.arc(x - 8, y - 8, 22, Math.PI / 2, 3 * Math.PI / 2, false);
  }
  ctx.stroke();

  // Angry face — eyebrows
  ctx.strokeStyle = '#2f2f2f';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  // left eyebrow
  ctx.moveTo(x - 7 * faceDir, y - 24);
  ctx.lineTo(x - 2 * faceDir, y - 20);
  // right eyebrow
  ctx.moveTo(x + 2 * faceDir, y - 20);
  ctx.lineTo(x + 7 * faceDir, y - 24);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#2f2f2f';
  ctx.beginPath();
  ctx.arc(x - 4 * faceDir, y - 17, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 4 * faceDir, y - 17, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Fierce mouth
  ctx.beginPath();
  ctx.moveTo(x - 4 * faceDir, y - 10);
  ctx.lineTo(x + 4 * faceDir, y - 10);
  ctx.lineTo(x, y - 6);
  ctx.fill();
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

function drawWind(ctx) {
  const wind = state.archery.wind;
  const cx = ARCHERY.WIDTH / 2;
  const y = 40;
  const len = Math.min(60, Math.abs(wind) / 3);
  const dir = wind >= 0 ? 1 : -1;

  ctx.fillStyle = '#2f2f2f';
  ctx.font = 'bold 18px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('الريح', cx, y - 12);

  ctx.strokeStyle = wind === 0 ? '#888' : (wind > 0 ? '#27ae60' : '#c0392b');
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - len * dir, y + 5);
  ctx.lineTo(cx + len * dir, y + 5);
  ctx.stroke();

  // Arrow head
  ctx.beginPath();
  ctx.moveTo(cx + len * dir, y + 5);
  ctx.lineTo(cx + (len - 10) * dir, y - 4);
  ctx.lineTo(cx + (len - 10) * dir, y + 14);
  ctx.fill();
}

function getArcheryOverText() {
  const a = state.archery;
  if (a.mode === 'single') return a.leftHealth > 0 ? 'Victory! 🏆' : 'Defeat! 💥';
  if (a.leftHealth === a.rightHealth) return 'Draw! 🤝';
  return a.mySide === (a.leftHealth > 0 ? 'left' : 'right') ? 'Victory! 🏆' : 'Defeat! 💥';
}

function drawArchery() {
  const ctx = dom.archeryCanvas.getContext('2d');
  const a = state.archery;

  ctx.save();
  if (a.shake > 0) {
    const intensity = a.shake * 0.6;
    ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
    a.shake -= 0.5;
    if (a.shake < 0) a.shake = 0;
  }

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

  drawWind(ctx);

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

  // Danger vignette when player's fort is badly damaged
  const myHealth = a.mySide === 'left' ? a.leftHealth : a.rightHealth;
  if (myHealth <= 30 && !a.over) {
    const pulse = 0.25 + 0.15 * Math.sin(performance.now() / 120);
    const rg = ctx.createRadialGradient(ARCHERY.WIDTH / 2, ARCHERY.HEIGHT / 2, ARCHERY.HEIGHT * 0.35, ARCHERY.WIDTH / 2, ARCHERY.HEIGHT / 2, ARCHERY.HEIGHT);
    rg.addColorStop(0, 'rgba(192, 57, 43, 0)');
    rg.addColorStop(1, `rgba(192, 57, 43, ${pulse})`);
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, ARCHERY.WIDTH, ARCHERY.HEIGHT);
  }

  ctx.restore();
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

function generateWind() {
  return ARCHERY.WIND_MIN + Math.random() * (ARCHERY.WIND_MAX - ARCHERY.WIND_MIN);
}

export function startRound(windValue = null) {
  const a = state.archery;
  a.active = true;
  a.over = false;
  a.wind = windValue !== null ? windValue : generateWind();
  a.blocks.left = createBlocks('left');
  a.blocks.right = createBlocks('right');
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
  a.arrows = [];
  a.blocks.left = createBlocks('left');
  a.blocks.right = createBlocks('right');
  a.leftHealth = 100;
  a.rightHealth = 100;
  a.dragging = false;
  a.aimAngle = a.mySide === 'left' ? 0 : Math.PI;
  a.lastTime = performance.now();
  if (a.aiTimer) clearTimeout(a.aiTimer);
  a.aiTimer = null;

  dom.archeryStartBtn.classList.add('hidden');
  dom.archeryWaiting.classList.add('hidden');

  if (mode === 'online') {
    if (seed !== null && seed !== undefined) {
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
    adjustAim(-0.06);
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    adjustAim(0.06);
  } else if (e.code === 'Space') {
    e.preventDefault();
    if (a.over && a.mode !== 'online') {
      startRound();
    } else {
      shootArcheryArrow();
    }
  }
}

export function adjustAim(delta) {
  const a = state.archery;
  a.aimAngle += delta;
  if (a.mySide === 'left') {
    a.aimAngle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, a.aimAngle));
  } else {
    if (a.aimAngle < Math.PI / 2) a.aimAngle = Math.PI / 2;
    if (a.aimAngle > 3 * Math.PI / 2) a.aimAngle = 3 * Math.PI / 2;
  }
}

export function shoot() {
  shootArcheryArrow();
}

export function startNewBattle() {
  const a = state.archery;
  if (a.mode === 'online') {
    if (state.isHost) {
      const wind = generateWind();
      sendToPeer({ type: 'archeryStart', seed: 0, wind });
      startRound(wind);
    }
  } else {
    startRound();
  }
}

export function onMessage(type, data) {
  const a = state.archery;
  if (type === 'archeryStart') {
    startRound(data.wind != null ? data.wind : 0);
  } else if (type === 'archeryShot') {
    if (data && data.owner != null && data.x != null && data.y != null && data.vx != null && data.vy != null) {
      addArrow(data.owner, data.x, data.y, data.vx, data.vy);
    }
  } else if (type === 'archeryDamage') {
    const total = ARCHERY.BLOCK_COLS * ARCHERY.BLOCK_ROWS;
    const blockCount = Math.max(1, Math.round(total * (data.damage / 100)));
    destroyBlocks(data.side, blockCount, null, null);
    checkArcheryGameOver();
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
  adjustAim,
  shoot,
  onMessage
};
