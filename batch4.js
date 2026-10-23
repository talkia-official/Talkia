// Talkia Advanced Suite Batch 4: Upgraded Direct Messaging, Voice & Suite Features
console.log("Talkia Advanced Suite Batch 4 Loaded Correctly");

document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .post-header img, .feed-item img:not(.post-main-img), .friend-item img, .search-user-item img, .notif-item img, img.avatar-small {
      width: 40px !important; height: 40px !important; min-width: 40px !important; min-height: 40px !important;
      border-radius: 50% !important; object-fit: cover !important; flex-shrink: 0 !important;
    }
    .post-content img, .uploaded-feed-img, .post img:not(.author-avatar) {
      width: 100% !important; max-height: 350px !important; object-fit: cover !important;
      border-radius: 12px !important; display: block; margin: 8px auto;
    }
    .chat-bubble { max-width: 75%; padding: 10px 14px; border-radius: 16px; margin-bottom: 8px; font-size: 14px; word-break: break-word; }
    .chat-me { background: #2f6bff; color: #fff; margin-left: auto; border-bottom-right-radius: 4px; }
    .chat-them { background: #1a2234; color: #eef2fb; margin-right: auto; border-bottom-left-radius: 4px; border: 1px solid #26314a; }
  `;
  document.head.appendChild(style);

  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) btnSettings.onclick = (e) => { e.preventDefault(); openSettingsDashboard(); };

  const btnVisitors = document.getElementById('btn-visitors');
  if (btnVisitors) btnVisitors.onclick = (e) => { e.preventDefault(); openProfileVisitorsModal(); };

  const btnSearch = document.getElementById('btn-search');
  if (btnSearch) btnSearch.onclick = (e) => { e.preventDefault(); const s = document.getElementById('search'); if (s) s.classList.remove('hidden'); };

  const btnInbox = document.getElementById('btn-inbox');
  if (btnInbox) btnInbox.onclick = (e) => { e.preventDefault(); openInboxModal(); };

  const btnBell = document.getElementById('btn-bell');
  if (btnBell) btnBell.onclick = (e) => { e.preventDefault(); openNotificationsModal(); };

  const btnCreateRoom = document.getElementById('btn-create-room');
  if (btnCreateRoom) btnCreateRoom.onclick = (e) => { e.preventDefault(); openCreateGroupRoomModal(); };
});

// Full Inbox & Direct Voice Message Implementation
window.openInboxModal = async function() {
  const inboxSheet = document.getElementById('inbox-sheet');
  const inboxList = document.getElementById('inbox-list');
  if (!inboxSheet || !inboxList) return;

  inboxSheet.classList.remove('hidden');
  inboxList.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:20px;">${t('loading')}</p>`;

  document.getElementById('inbox-sheet-close').onclick = () => inboxSheet.classList.add('hidden');
  document.getElementById('inbox-close-btn').onclick = () => inboxSheet.classList.add('hidden');

  if (!currentUser) return;
  const me = currentUser.id;

  const { data: friendships } = await sb.from('friendships').select('*').or(`requester_id.eq.${me},addressee_id.eq.${me}`).eq('status', 'accepted');
  if (!friendships || friendships.length === 0) {
    inboxList.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">${t('inbox_empty')}</p>`;
    return;
  }

  const fIds = friendships.map(f => f.requester_id === me ? f.addressee_id : f.requester_id);
  const { data: friends } = await sb.from('profiles').select('*').in('id', fIds);

  inboxList.innerHTML = (friends || []).map(f => `
    <div class="inbox-friend-item" data-id="${f.id}" style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #26314a; cursor:pointer;">
      <div style="width:44px; height:44px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
        ${f.avatar_url ? `<img src="${esc(f.avatar_url)}" class="avatar-small">` : esc((f.display_name || 'U').charAt(0).toUpperCase())}
      </div>
      <div style="flex:1;">
        <div style="color:#fff; font-weight:600; font-size:15px;">${esc(f.display_name)}</div>
        <div style="color:#8b97b3; font-size:12px;">💬 ${t('start_chat_hint')}</div>
      </div>
    </div>
  `).join('');

  inboxList.querySelectorAll('.inbox-friend-item').forEach(item => {
    item.onclick = () => {
      const fid = item.dataset.id;
      const fr = friends.find(x => x.id === fid);
      openDirectChat(fr);
    };
  });
};

// Real-Time Direct Voice & Text Chat Modal with Database Sync
window.openDirectChat = async function(friend) {
  let chatModal = document.getElementById('direct-chat-modal');
  if (!chatModal) {
    chatModal = document.createElement('div');
    chatModal.id = 'direct-chat-modal';
    chatModal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:1100; display:flex; flex-direction:column;';
    document.body.appendChild(chatModal);
  }

  chatModal.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:16px; background:#121826; border-bottom:1px solid #26314a;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:36px; height:36px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
          ${friend.avatar_url ? `<img src="${esc(friend.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((friend.display_name || 'U').charAt(0).toUpperCase())}
        </div>
        <div style="color:#fff; font-weight:bold; font-size:16px;">${esc(friend.display_name)}</div>
      </div>
      <button id="close-chat-btn" style="color:#8b97b3; font-size:22px; border:0; background:none; cursor:pointer;">✕</button>
    </div>
    <div id="chat-messages-box" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column;">
      <p style="text-align:center; color:#8b97b3;">${t('loading')}</p>
    </div>
    <div style="padding:12px; background:#121826; border-top:1px solid #26314a; display:flex; gap:8px; align-items:center;">
      <input type="text" id="chat-text-input" placeholder="মেসেজ লিখুন..." style="flex:1; background:#1a2234; border:1px solid #26314a; border-radius:20px; padding:10px 16px; color:#fff; outline:none;">
      <button id="chat-send-btn" style="background:#2f6bff; color:#fff; border:0; padding:10px 16px; border-radius:20px; font-weight:bold; cursor:pointer;">পাঠান</button>
      <button id="chat-voice-btn" style="background:#ef4444; color:#fff; border:0; padding:10px 14px; border-radius:50%; font-size:16px; cursor:pointer;" title="ভয়েস রেকর্ড">🎙️</button>
    </div>
  `;

  document.getElementById('close-chat-btn').onclick = () => chatModal.remove();

  const msgBox = document.getElementById('chat-messages-box');
  const txtInput = document.getElementById('chat-text-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const voiceBtn = document.getElementById('chat-voice-btn');

  // Load existing messages between currentUser and friend
  const me = currentUser.id;
  const other = friend.id;

  async function fetchMessages() {
    const { data, error } = await sb.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`)
      .order('created_at', { ascending: true });

    if (error) {
      msgBox.innerHTML = `<p style="text-align:center; color:var(--danger);">মেসেজ লোড করতে সমস্যা হয়েছে</p>`;
      return;
    }

    if (!data || data.length === 0) {
      msgBox.innerHTML = `<p style="text-align:center; color:#8b97b3;">💬 ${esc(friend.display_name)}-এর সাথে আপনার চ্যাট শুরু করুন</p>`;
      return;
    }

    msgBox.innerHTML = data.map(m => {
      const isMe = m.sender_id === me;
      if (m.audio_url) {
        return `<div class="chat-bubble ${isMe ? 'chat-me' : 'chat-them'}"><button onclick="new Audio('${esc(m.audio_url)}').play()" style="background:none; border:0; color:#fff; font-size:15px; cursor:pointer;">▶️ ভয়েস মেসেজ শুনুন</button></div>`;
      }
      return `<div class="chat-bubble ${isMe ? 'chat-me' : 'chat-them'}">${esc(m.body)}</div>`;
    }).join('');
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  await fetchMessages();

  const sendMsgPayload = async (payload) => {
    const { error } = await sb.from('messages').insert({
      sender_id: me,
      receiver_id: other,
      ...payload
    });
    if (error) {
      toast('মেসেজ পাঠানো যায়নি!');
    } else {
      await fetchMessages();
    }
  };

  sendBtn.onclick = async () => {
    const txt = txtInput.value.trim();
    if (txt) {
      txtInput.value = '';
      await sendMsgPayload({ body: txt });
    }
  };

  // Direct Voice Recording & DB Save
  let mediaRec = null, audioChunks = [];
  voiceBtn.onclick = async () => {
    if (mediaRec && mediaRec.state === 'recording') {
      mediaRec.stop();
      voiceBtn.textContent = '🎙️';
      voiceBtn.style.background = '#ef4444';
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRec = new MediaRecorder(stream);
      audioChunks = [];
      mediaRec.ondataavailable = e => audioChunks.push(e.data);
      mediaRec.onstop = async () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const path = `${currentUser.id}/chat-${Date.now()}.webm`;
        toast('ভয়েস আপলোড হচ্ছে...');
        const { data, error } = await sb.storage.from('audio').upload(path, blob);
        if (!error) {
          const url = sb.storage.from('audio').getPublicUrl(path).data.publicUrl;
          await sendMsgPayload({ audio_url: url });
          toast('ভয়েস পাঠানো হয়েছে!');
        }
      };
      mediaRec.start();
      voiceBtn.textContent = '⏹️';
      voiceBtn.style.background = '#10b981';
    } catch (e) {
      toast('মাইক্রোফোন পারমিশন প্রয়োজন');
    }
  };
};

window.openNotificationsModal = async function() {
  const notifSheet = document.getElementById('notif-sheet');
  if (notifSheet) notifSheet.classList.remove('hidden');
  document.getElementById('notif-sheet-close').onclick = () => notifSheet.classList.add('hidden');
  document.getElementById('notif-close-btn').onclick = () => notifSheet.classList.add('hidden');
};

window.openSettingsDashboard = function() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';
  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <h3 style="margin:0; font-size:18px; color:#fff;">⚙️ ${t('settings')}</h3>
        <button id="set-close-x" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button id="set-logout-btn" style="text-align:left; padding:14px; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.3); color:#ef4444; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer;">🚪 ${t('logout')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('set-close-x').onclick = () => modal.remove();
  document.getElementById('set-logout-btn').onclick = () => sb.auth.signOut().then(() => location.reload());
};
