/**
 * Web版チャットUI
 * セッション管理 + メッセージ送受信
 */
let sessionId = null;
const messagesDiv = document.getElementById('messages');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');

// 初期化: セッション開始
async function init() {
  addMessage('assistant', '接続中...');

  try {
    const res = await fetch('/api/chat/start', { method: 'POST' });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    sessionId = data.sessionId;
    messagesDiv.innerHTML = '';

    for (const msg of data.messages) {
      addMessage(msg.role, msg.content);
    }

    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  } catch (err) {
    messagesDiv.innerHTML = '';
    addMessage(
      'assistant',
      'すみません、接続に失敗しました。ページをリロードしてみてください。'
    );
    console.error('Init error:', err);
  }
}

// メッセージ送信
async function sendMessage() {
  const text = input.value.trim();
  if (!text || !sessionId) return;

  addMessage('user', text);
  input.value = '';
  input.disabled = true;
  sendBtn.disabled = true;

  // タイピング表示
  const typingEl = addMessage('typing', '考え中...');

  try {
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: text }),
    });

    const data = await res.json();
    typingEl.remove();

    if (data.error) {
      addMessage('assistant', 'すみません、エラーが発生しました。もう一度送ってみてください。');
    } else if (data.reply) {
      addMessage('assistant', data.reply);
    }
  } catch (err) {
    typingEl.remove();
    addMessage('assistant', '通信エラーが発生しました。もう一度送ってみてください。');
    console.error('Send error:', err);
  }

  input.disabled = false;
  sendBtn.disabled = false;
  input.focus();
}

// メッセージ表示
function addMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = content;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return div;
}

// Enterで送信
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault();
    sendMessage();
  }
});

// 起動
init();
