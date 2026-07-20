/* ============================================
   لعبة مغامرة جامع اللبان (Endless Runner)
   ============================================ */

import { state, dom } from '../state.js';
import { playSound, setStatus } from '../utils.js';

function resizeRunner() {
  const canvas = dom.runnerCanvas;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  if (state.runner.active) {
    state.runner.groundY = canvas.height * 0.82;
  }
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w - 6 &&
    a.x + a.w > b.x + 6 &&
    a.y < b.y + b.h - 6 &&
    a.y + a.h > b.y + 6
  );
}

function spawnObstacle(canvas) {
  const type = Math.random() < 0.6 ? 'cactus' : 'bird';
  const obs = {
    type,
    x: canvas.width + 30,
    w: type === 'cactus' ? 36 : 48,
    h: type === 'cactus' ? 54 : 32,
    y: 0
  };
  if (type === 'cactus') {
    obs.y = state.runner.groundY - obs.h;
  } else {
    obs.y = state.runner.groundY - obs.h - 55 - Math.random() * 35;
  }
  state.runner.obstacles.push(obs);
}

function updateRunner(dt) {
  const canvas = dom.runnerCanvas;
  const p = state.runner.player;

  p.vy += 2200 * dt;
  p.y += p.vy * dt;

  const targetH = p.ducking ? p.duckH : p.baseH;
  p.h += (targetH - p.h) * 10 * dt;

  const ground = state.runner.groundY;
  if (p.y + p.h >= ground) {
    p.y = ground - p.h;
    p.vy = 0;
    p.jumping = false;
  }

  state.runner.speed += 5 * dt;
  state.runner.score += dt * 15;

  state.runner.spawnTimer -= dt;
  if (state.runner.spawnTimer <= 0) {
    spawnObstacle(canvas);
    const minTime = Math.max(0.55, 1.4 - state.runner.speed / 800);
    state.runner.spawnTimer = minTime + Math.random() * 0.6;
  }

  state.runner.obstacles.forEach(obs => {
    obs.x -= state.runner.speed * dt;
  });

  state.runner.obstacles = state.runner.obstacles.filter(obs => obs.x + obs.w > -50);

  for (const obs of state.runner.obstacles) {
    if (rectsOverlap(p, obs)) {
      runnerGameOver();
      return;
    }
  }
}

function drawRunner(ctx, canvas) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#87ceeb');
  gradient.addColorStop(0.65, '#e6d5b8');
  gradient.addColorStop(1, '#d9c39e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f4b942';
  ctx.beginPath();
  ctx.arc(canvas.width * 0.85, canvas.height * 0.15, 35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#15565e';
  ctx.beginPath();
  ctx.moveTo(0, state.runner.groundY);
  ctx.lineTo(canvas.width * 0.2, state.runner.groundY - 70);
  ctx.lineTo(canvas.width * 0.45, state.runner.groundY - 20);
  ctx.lineTo(canvas.width * 0.7, state.runner.groundY - 90);
  ctx.lineTo(canvas.width, state.runner.groundY - 30);
  ctx.lineTo(canvas.width, state.runner.groundY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#cbb593';
  ctx.fillRect(0, state.runner.groundY, canvas.width, canvas.height - state.runner.groundY);
  ctx.strokeStyle = '#a8906d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, state.runner.groundY);
  ctx.lineTo(canvas.width, state.runner.groundY);
  ctx.stroke();

  const p = state.runner.player;
  ctx.fillStyle = '#1e6f7a';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(p.x + p.w * 0.35, p.y + p.h * 0.25, 4, 0, Math.PI * 2);
  ctx.arc(p.x + p.w * 0.65, p.y + p.h * 0.25, 4, 0, Math.PI * 2);
  ctx.fill();

  state.runner.obstacles.forEach(obs => {
    if (obs.type === 'cactus') {
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.fillStyle = '#1e8449';
      ctx.fillRect(obs.x + 6, obs.y + 8, 6, obs.h - 16);
      ctx.fillRect(obs.x + obs.w - 12, obs.y + 8, 6, obs.h - 16);
    } else {
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.w * 0.2, obs.y + obs.h * 0.5);
      ctx.lineTo(obs.x - 10, obs.y - 5);
      ctx.lineTo(obs.x + obs.w * 0.2, obs.y + obs.h * 0.2);
      ctx.fill();
    }
  });

  ctx.fillStyle = '#2f2f2f';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('النقاط: ' + Math.floor(state.runner.score), canvas.width - 20, 40);

  if (state.runner.over) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Cairo, sans-serif';
    ctx.fillText('انتهت اللعبة!', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '22px Cairo, sans-serif';
    ctx.fillText('النقاط: ' + Math.floor(state.runner.score), canvas.width / 2, canvas.height / 2 + 20);
    ctx.font = '18px Cairo, sans-serif';
    ctx.fillText('اضغط المسافة أو على الشاشة للإعادة', canvas.width / 2, canvas.height / 2 + 55);
  }
}

function runnerLoop(timestamp) {
  if (!state.runner.active) return;
  const canvas = dom.runnerCanvas;
  const ctx = canvas.getContext('2d');
  const dt = Math.min((timestamp - state.runner.lastTime) / 1000, 0.05);
  state.runner.lastTime = timestamp;

  if (!state.runner.over) {
    updateRunner(dt);
  }
  drawRunner(ctx, canvas);

  state.runner.animId = requestAnimationFrame(runnerLoop);
}

function runnerJump() {
  if (state.runner.over) {
    runnerRestart();
    return;
  }
  const p = state.runner.player;
  if (!p.jumping) {
    p.vy = -820;
    p.jumping = true;
    playSound('jump');
  }
}

function runnerDuck(active) {
  if (state.runner.over) return;
  state.runner.player.ducking = active;
}

function runnerGameOver() {
  state.runner.over = true;
  playSound('over');
  setStatus('انتهت اللعبة! النقاط: ' + Math.floor(state.runner.score));
}

function runnerRestart() {
  if (!state.runner.active) return;
  state.runner.over = false;
  state.runner.score = 0;
  state.runner.speed = 280;
  state.runner.obstacles = [];
  state.runner.spawnTimer = 1.2;
  const p = state.runner.player;
  p.y = state.runner.groundY - p.baseH;
  p.vy = 0;
  p.jumping = false;
  p.ducking = false;
  p.h = p.baseH;
  setStatus('لنبدأ من جديد!');
}

function initRunner() {
  const canvas = dom.runnerCanvas;
  resizeRunner();

  state.runner.active = true;
  state.runner.over = false;
  state.runner.score = 0;
  state.runner.speed = 280;
  state.runner.groundY = canvas.height * 0.82;
  state.runner.obstacles = [];
  state.runner.spawnTimer = 1.2;
  state.runner.lastTime = performance.now();

  state.runner.player = {
    x: canvas.width * 0.12,
    y: state.runner.groundY - 65,
    w: 45,
    h: 65,
    baseH: 65,
    duckH: 30,
    vy: 0,
    jumping: false,
    ducking: false
  };

  if (state.runner.animId) cancelAnimationFrame(state.runner.animId);
  state.runner.animId = requestAnimationFrame(runnerLoop);
  setStatus('اضغط السهم الأعلى أو المسافة للقفز، والأسفل للانحناء');
}

function cleanupRunner() {
  if (state.runner.animId) {
    cancelAnimationFrame(state.runner.animId);
    state.runner.animId = null;
  }
  state.runner.active = false;
  dom.runnerContainer.classList.add('hidden');
}

export const RunnerGame = {
  init(mode) {
    dom.runnerContainer.classList.remove('hidden');
    initRunner();
  },
  cleanup() {
    cleanupRunner();
  },
  jump: runnerJump,
  duck: runnerDuck,
  setDucking(active) {
    runnerDuck(active);
  },
  restart() {
    runnerRestart();
  },
  resize() {
    resizeRunner();
  },
  isOver() {
    return state.runner.over;
  }
};
