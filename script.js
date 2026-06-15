/* ============================================
   CHATWAVE — script.js
   Front-end only: simulated real-time chat
   ============================================ */

/* ── State ─────────────────────────────────── */
let currentUser  = '';
let currentRoom  = 'general';
let typingTimer  = null;
let emojiOpen    = false;
let searchOpen   = false;

const AVATAR_COLORS = [
  '#ff5c35','#ffb830','#39e98e','#4fa3ff','#c084fc','#f472b6','#34d399','#fb923c'
];

// Pre-seeded messages per room
const messageStore = {
  general: [
    { id: 1, author: 'Alex',  text: 'hey everyone 👋',              time: '09:01', color: '#4fa3ff' },
    { id: 2, author: 'Priya', text: 'What\'s up! Ready to ship?',   time: '09:03', color: '#c084fc' },
    { id: 3, author: 'Sam',   text: '🚀 always. Push it to prod',   time: '09:05', color: '#39e98e' },
  ],
  random: [
    { id: 1, author: 'Sam',   text: 'anyone seen the new CSS :has() tricks?', time: '08:40', color: '#39e98e' },
    { id: 2, author: 'Alex',  text: 'yes!! so powerful for parent selectors', time: '08:42', color: '#4fa3ff' },
  ],
  'dev-talk': [
    { id: 1, author: 'Priya', text: 'WebSockets vs SSE — thoughts?',         time: '08:00', color: '#c084fc' },
    { id: 2, author: 'Alex',  text: 'SSE for one-way, WS for full-duplex 💯', time: '08:05', color: '#4fa3ff' },
  ]
};

const unreadCounts = { general: 0, random: 2, 'dev-talk': 1 };

// Simulated bot replies
const botReplies = [
  'Interesting point! 🤔',
  'Totally agree with that.',
  'Can you elaborate a bit more?',
  'That\'s exactly what I was thinking!',
  'Nice one 👍',
  'Haha yes!! 😂',
  'Let me check and get back to you.',
  '🔥🔥🔥',
  'On it!',
  'Makes sense to me!',
  'Hmm, good question.',
  'Great idea!',
];
const botUsers = [
  { name: 'Alex',  color: '#4fa3ff' },
  { name: 'Priya', color: '#c084fc' },
  { name: 'Sam',   color: '#39e98e' },
];

/* ── Helpers ───────────────────────────────── */
function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getAvatarLetter(name) {
  return name.charAt(0).toUpperCase();
}

function pickColor(name) {
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/* ── Render messages ──────────────────────── */
function renderMessages(filter = '') {
  const container = document.getElementById('messagesContainer');
  const msgs = messageStore[currentRoom] || [];
  const welcome = document.getElementById('welcomeMsg');

  // Remove old messages (keep welcome)
  [...container.querySelectorAll('.message, .date-separator')].forEach(el => el.remove());

  const filtered = filter
    ? msgs.filter(m => m.text.toLowerCase().includes(filter.toLowerCase()) ||
                       m.author.toLowerCase().includes(filter.toLowerCase()))
    : msgs;

  if (filtered.length === 0 && !filter) {
    welcome.style.display = 'block';
    return;
  }
  welcome.style.display = filtered.length ? 'none' : 'block';

  let lastDate = null;

  filtered.forEach(msg => {
    const msgDate = msg.date || 'Today';
    if (msgDate !== lastDate) {
      const sep = document.createElement('div');
      sep.className = 'date-separator';
      sep.textContent = msgDate;
      container.appendChild(sep);
      lastDate = msgDate;
    }

    const isOwn = msg.author === currentUser;
    const div = document.createElement('div');
    div.className = 'message' + (isOwn ? ' own' : '');
    div.dataset.id = msg.id;

    const color = isOwn ? '#ff5c35' : (msg.color || pickColor(msg.author));

    div.innerHTML = `
      <div class="msg-avatar" style="background:${color}">
        ${getAvatarLetter(msg.author)}
      </div>
      <div class="msg-content">
        <div class="msg-header">
          <span class="msg-author" style="color:${color}">${escapeHtml(msg.author)}</span>
          <span class="msg-time">${msg.time}</span>
        </div>
        <div class="msg-bubble">${escapeHtml(msg.text)}</div>
      </div>
    `;

    container.appendChild(div);
  });

  scrollToBottom();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;');
}

function scrollToBottom() {
  const c = document.getElementById('messagesContainer');
  c.scrollTop = c.scrollHeight;
}

/* ── Send message ─────────────────────────── */
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text  = input.value.trim();
  if (!text) return;

  const msg = {
    id:     Date.now(),
    author: currentUser,
    text,
    time:   getTime(),
    date:   'Today',
    color:  '#ff5c35',
  };

  messageStore[currentRoom].push(msg);
  input.value = '';
  autoResize(input);
  renderMessages();

  // Simulate typing + bot reply
  simulateBotTyping();
}

/* ── Simulated bot reply ──────────────────── */
function simulateBotTyping() {
  const indicator = document.getElementById('typingIndicator');
  const bot       = botUsers[Math.floor(Math.random() * botUsers.length)];
  const delay     = 1200 + Math.random() * 1800;

  indicator.style.display = 'flex';

  setTimeout(() => {
    indicator.style.display = 'none';
    const replyText = botReplies[Math.floor(Math.random() * botReplies.length)];
    const reply = {
      id:     Date.now(),
      author: bot.name,
      text:   replyText,
      time:   getTime(),
      date:   'Today',
      color:  bot.color,
    };
    messageStore[currentRoom].push(reply);
    renderMessages();
  }, delay);
}

/* ── Room switching ───────────────────────── */
function switchRoom(room) {
  currentRoom = room;
  document.getElementById('currentRoom').textContent = room;
  document.getElementById('messageInput').placeholder = `Message #${room}…`;

  // Active state
  document.querySelectorAll('.room-item').forEach(li => {
    li.classList.toggle('active', li.dataset.room === room);
  });

  // Clear unread for this room
  unreadCounts[room] = 0;
  updateUnreadBadges();

  renderMessages();
}

function updateUnreadBadges() {
  document.querySelectorAll('.room-item').forEach(li => {
    const room  = li.dataset.room;
    const badge = li.querySelector('.unread-badge');
    const count = unreadCounts[room] || 0;
    badge.textContent   = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

/* ── Emoji picker ─────────────────────────── */
function toggleEmoji() {
  emojiOpen = !emojiOpen;
  document.getElementById('emojiPicker').style.display = emojiOpen ? 'grid' : 'none';
}

document.getElementById('emojiPicker').addEventListener('click', e => {
  if (e.target.tagName === 'SPAN') {
    const input = document.getElementById('messageInput');
    const pos   = input.selectionStart;
    const val   = input.value;
    input.value = val.slice(0, pos) + e.target.textContent + val.slice(pos);
    input.focus();
    // Move cursor after emoji
    const newPos = pos + e.target.textContent.length;
    input.setSelectionRange(newPos, newPos);
    autoResize(input);
    toggleEmoji();
  }
});

/* ── Search ───────────────────────────────── */
function toggleSearch() {
  searchOpen = !searchOpen;
  const bar = document.getElementById('searchBar');
  bar.style.display = searchOpen ? 'flex' : 'none';
  if (searchOpen) document.getElementById('searchInput').focus();
  else {
    document.getElementById('searchInput').value = '';
    renderMessages();
  }
}

/* ── Modal / join ─────────────────────────── */
function showModal() {
  document.getElementById('nameModal').style.display = 'flex';
  document.getElementById('usernameInput').focus();
}

function joinChat() {
  const val = document.getElementById('usernameInput').value.trim();
  if (!val) return;
  currentUser = val.slice(0, 20);

  document.getElementById('nameModal').style.display = 'none';
  document.getElementById('displayName').textContent = currentUser;
  document.getElementById('userAvatar').textContent  = getAvatarLetter(currentUser);
  document.getElementById('userAvatar').style.background = pickColor(currentUser);

  updateUnreadBadges();
  renderMessages();
}

/* ── Simulated incoming messages ─────────── */
function startIncomingSimulation() {
  const otherRooms = ['random', 'dev-talk'];
  setInterval(() => {
    const room = otherRooms[Math.floor(Math.random() * otherRooms.length)];
    if (room === currentRoom) return;

    const bot  = botUsers[Math.floor(Math.random() * botUsers.length)];
    const text = botReplies[Math.floor(Math.random() * botReplies.length)];
    messageStore[room].push({
      id: Date.now(), author: bot.name, text,
      time: getTime(), date: 'Today', color: bot.color,
    });
    unreadCounts[room] = (unreadCounts[room] || 0) + 1;
    updateUnreadBadges();
  }, 12000);
}

/* ── Event listeners ──────────────────────── */
// Send on click
document.getElementById('sendBtn').addEventListener('click', sendMessage);

// Send on Enter (Shift+Enter = newline)
document.getElementById('messageInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
document.getElementById('messageInput').addEventListener('input', function () {
  autoResize(this);
});

// Room switching
document.getElementById('roomList').addEventListener('click', e => {
  const li = e.target.closest('.room-item');
  if (li) switchRoom(li.dataset.room);
});

// Emoji toggle
document.getElementById('emojiBtn').addEventListener('click', toggleEmoji);

// Close emoji on outside click
document.addEventListener('click', e => {
  if (emojiOpen &&
      !e.target.closest('#emojiPicker') &&
      !e.target.closest('#emojiBtn')) {
    emojiOpen = false;
    document.getElementById('emojiPicker').style.display = 'none';
  }
});

// Search
document.getElementById('searchToggle').addEventListener('click', toggleSearch);
document.getElementById('searchClose').addEventListener('click', toggleSearch);
document.getElementById('searchInput').addEventListener('input', function () {
  renderMessages(this.value);
});

// Modal join
document.getElementById('joinBtn').addEventListener('click', joinChat);
document.getElementById('usernameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') joinChat();
});

// Settings btn (stub)
document.getElementById('settingsBtn').addEventListener('click', () => {
  alert('Settings coming soon!');
});

// New chat btn (stub)
document.getElementById('newChatBtn').addEventListener('click', () => {
  const name = prompt('New room name:');
  if (!name) return;
  const slug = name.toLowerCase().replace(/\s+/g, '-').slice(0, 20);
  messageStore[slug]  = [];
  unreadCounts[slug]  = 0;

  const li = document.createElement('li');
  li.className   = 'room-item';
  li.dataset.room = slug;
  li.innerHTML   = `<span class="room-hash">#</span><span>${slug}</span><span class="unread-badge" style="display:none">0</span>`;
  document.getElementById('roomList').appendChild(li);
  switchRoom(slug);
});

/* ── Init ─────────────────────────────────── */
showModal();
startIncomingSimulation();