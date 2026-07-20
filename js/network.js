/* ============================================
   إدارة الاتصال عبر PeerJS
   ============================================ */

import { state, dom } from './state.js';
import { PEER_CONFIG } from './config.js';
import { randomCode } from './utils.js';

const messageHandlers = {};
const connectHandlers = [];
const disconnectHandlers = [];

export function onMessage(type, handler) {
  messageHandlers[type] = handler;
}

export function onConnect(handler) {
  connectHandlers.push(handler);
}

export function onDisconnect(handler) {
  disconnectHandlers.push(handler);
}

export function sendToPeer(data) {
  if (state.conn && state.conn.open) {
    state.conn.send(data);
  }
}

export function resetPeer() {
  if (state.peer) {
    try { state.peer.destroy(); } catch (e) {}
  }
  state.peer = null;
  state.conn = null;
  state.isHost = false;
  state.mySymbol = null;
  state.roomCode = null;
  updateOnlineBadge(false);
  dom.roomCodeDisplay.textContent = '';
}

function updateOnlineBadge(connected) {
  if (connected) {
    dom.onlineBadge.textContent = 'متصل';
    dom.onlineBadge.classList.add('connected');
  } else {
    dom.onlineBadge.textContent = 'غير متصل';
    dom.onlineBadge.classList.remove('connected');
  }
}

export function hostRoom(gameId) {
  resetPeer();
  state.isHost = true;
  state.mySymbol = 'X';
  state.pendingGameId = gameId;
  state.roomCode = randomCode();
  dom.onlineMsg.textContent = 'جارٍ إنشاء الغرفة...';

  state.peer = new Peer(state.roomCode, PEER_CONFIG);

  state.peer.on('open', id => {
    dom.onlineMsg.textContent = `رمز الغرفة: ${id} — شاركه مع صديقك`;
    dom.roomCodeDisplay.textContent = `رمز الغرفة: ${id}`;
  });

  state.peer.on('connection', conn => {
    if (state.conn) {
      conn.close();
      return;
    }
    setupConnection(conn);
  });

  state.peer.on('error', err => {
    console.error(err);
    if (err.type === 'unavailable-id') {
      dom.onlineMsg.textContent = 'الرمز مستخدم، جارٍ إنشاء رمز جديد...';
      setTimeout(() => hostRoom(gameId), 500);
    } else {
      dom.onlineMsg.textContent = 'تعذر الاتصال بالوسيط، حاول مرة أخرى.';
    }
  });
}

export function joinRoom(gameId, code) {
  if (!code || code.length !== 4) {
    dom.onlineMsg.textContent = 'أدخل رمز الغرفة المكون من 4 أرقام';
    return;
  }
  resetPeer();
  state.isHost = false;
  state.mySymbol = 'O';
  state.pendingGameId = gameId;
  state.roomCode = code;
  dom.onlineMsg.textContent = 'جارٍ الاتصال بالغرفة...';

  state.peer = new Peer(PEER_CONFIG);

  state.peer.on('open', () => {
    const conn = state.peer.connect(code, { reliable: true });
    setupConnection(conn);
  });

  state.peer.on('error', err => {
    console.error(err);
    dom.onlineMsg.textContent = 'تعذر الاتصال، تأكد من الرمز وحاول مجدداً.';
  });
}

function setupConnection(conn) {
  state.conn = conn;

  conn.on('open', () => {
    updateOnlineBadge(true);
    sendToPeer({ type: 'handshake', symbol: state.mySymbol });
    connectHandlers.forEach(h => h());
  });

  conn.on('data', data => {
    if (!data || !data.type) return;
    const handler = messageHandlers[data.type];
    if (handler) handler(data);
  });

  conn.on('close', () => {
    updateOnlineBadge(false);
    disconnectHandlers.forEach(h => h());
  });

  conn.on('error', err => {
    console.error(err);
    dom.onlineMsg.textContent = 'حدث خطأ في الاتصال.';
  });
}
