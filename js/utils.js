/* ============================================
   أدوات مساعدة مشتركة
   ============================================ */

import { state, dom } from './state.js';
import { GAMES, ARCHERY } from './config.js';

/* ---------- الأصوات ---------- */
let audioCtx = null;

export function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function playSound(type) {
  if (state.soundMuted) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  switch (type) {
    case 'jump':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    case 'score':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'win':
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, now + i * 0.12);
        g.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.18);
        o.start(now + i * 0.12);
        o.stop(now + i * 0.12 + 0.2);
      });
      break;
    case 'move':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
      break;
    case 'over':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    default:
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
  }
}

export function toggleMute() {
  state.soundMuted = !state.soundMuted;
  dom.muteBtn.textContent = state.soundMuted ? '🔇' : '🔊';
}

/* ---------- ملء الشاشة ---------- */
export function toggleFullscreen() {
  if (!document.fullscreenEnabled) {
    setStatus('ملء الشاشة غير مدعوم في هذا المتصفح');
    return;
  }
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => console.error(err));
  } else {
    document.documentElement.requestFullscreen().catch(err => console.error(err));
  }
}

export function updateFullscreenIcon() {
  dom.fullscreenBtn.textContent = document.fullscreenElement ? '🔳' : '⛶';
}

/* ---------- كونفيتي ---------- */
const confettiCtx = dom.confettiCanvas.getContext('2d');
let confettiParticles = [];

export function resizeConfetti() {
  dom.confettiCanvas.width = window.innerWidth;
  dom.confettiCanvas.height = window.innerHeight;
}

function updateConfetti() {
  confettiCtx.clearRect(0, 0, dom.confettiCanvas.width, dom.confettiCanvas.height);
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.25;
    p.rotation += p.rotSpeed;
    p.life -= 0.01;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.globalAlpha = Math.max(0, p.life);
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    confettiCtx.restore();
    if (p.life <= 0) confettiParticles.splice(i, 1);
  }
  if (confettiParticles.length > 0) {
    requestAnimationFrame(updateConfetti);
  }
}

export function fireConfetti() {
  const colors = ['#f4b942', '#1e6f7a', '#e6d5b8', '#27ae60', '#c0392b'];
  for (let i = 0; i < 80; i++) {
    confettiParticles.push({
      x: dom.confettiCanvas.width / 2,
      y: dom.confettiCanvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 1) * 12 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      life: 1
    });
  }
  if (confettiParticles.length <= 80) {
    requestAnimationFrame(updateConfetti);
  }
}

/* ---------- أدوات عامة ---------- */
export function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function setStatus(msg) {
  dom.gameStatus.textContent = msg;
}

let emojiTimeout = null;
export function showEmoji(emoji) {
  const original = dom.gameStatus.textContent;
  dom.gameStatus.textContent = emoji + ' ' + original;
  if (emojiTimeout) clearTimeout(emojiTimeout);
  emojiTimeout = setTimeout(() => {
    dom.gameStatus.textContent = original;
  }, 1500);
}

export function findGame(id) {
  return GAMES.find(g => g.id === id);
}

export function toCanvasPos(clientX, clientY) {
  const rect = dom.archeryCanvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (ARCHERY.WIDTH / rect.width),
    y: (clientY - rect.top) * (ARCHERY.HEIGHT / rect.height)
  };
}
