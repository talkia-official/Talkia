// Direct messages (text + voice), inbox, friends list, notifications
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
      <div class="uav">
        ${f.avatar_url ? `<img src="${esc(f.avatar_url)}">` : esc((f.display_name || 'U').charAt(0).toUpperCase())}
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
        <div class="uav" style="width:36px !important; height:36px !important;">
          ${friend.avatar_url ? `<img src="${esc(friend.avatar_url)}">` : esc((friend.display_name || 'U').charAt(0).toUpperCase())}
        </div>
        <div style="color:#fff; font-weight:bold; font-size:16px;">${esc(friend.display_name)}</div>
      </div>
      <button id="close-chat-btn" style="color:#8b97b3; font-size:22px; border:0; background:none; cursor:pointer;">✕</button>
    </div>
    <div id="chat-messages-box" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column;">
      <p style="text-align:center; color:#8b97b3;">${t('loading')}</p>
    </div>
    <div style="padding:12px; background:#121826; border-top:1px solid #26314a; display:flex; gap:8px; align-items:center;">
      <input type="text" id="chat-text-input" placeholder="${t('cm_ph')}" style="flex:1; background:#1a2234; border:1px solid #26314a; border-radius:20px; padding:10px 16px; color:#fff; outline:none;">
      <button id="chat-send-btn" style="background:var(--accent); color:#fff; border:0; padding:10px 16px; border-radius:20px; font-weight:bold; cursor:pointer;">${t('send')}</button>
      <button id="chat-voice-btn" style="background:#ef4444; color:#fff; border:0; padding:10px 14px; border-radius:50%; font-size:16px; cursor:pointer;" title="Voice">🎙️</button>
    </div>
  `;

  document.getElementById('close-chat-btn').onclick = () => chatModal.remove();

  const msgBox = document.getElementById('chat-messages-box');
  const txtInput = document.getElementById('chat-text-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const voiceBtn = document.getElementById('chat-voice-btn');

  const me = currentUser.id;
  const other = friend.id;

  async function fetchMessages() {
    const { data, error } = await sb.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`)
      .order('created_at', { ascending: true });

    if (error) {
      msgBox.innerHTML = `<p style="text-align:center; color:var(--danger);">Error loading messages</p>`;
      return;
    }

    if (!data || data.length === 0) {
      msgBox.innerHTML = `<p style="text-align:center; color:#8b97b3;">💬 Start chatting with ${esc(friend.display_name)}</p>`;
      return;
    }

    msgBox.innerHTML = data.map(m => {
      const isMe = m.sender_id === me;
      const avatarHtml = !isMe ? `<div class="uav" style="width:28px !important; height:28px !important; font-size:12px;">${friend.avatar_url ? `<img src="${esc(friend.avatar_url)}">` : esc((friend.display_name || 'U').charAt(0))}</div>` : '';
      const content = m.audio_url ? `<button onclick="new Audio('${esc(m.audio_url)}').play()" style="background:none; border:0; color:#fff; font-size:14px; cursor:pointer;">▶️ Voice Message</button>` : esc(m.body);
      
      return `
        <div style="display:flex; align-items:flex-end; gap:6px; margin-bottom:8px; ${isMe ? 'flex-direction:row-reverse;' : ''}">
          ${avatarHtml}
          <div class="chat-bubble ${isMe ? 'chat-me' : 'chat-them'}">${content}</div>
        </div>
      `;
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
      toast('Failed to send');
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
        toast('Uploading voice...');
        const { data, error } = await sb.storage.from('audio').upload(path, blob);
        if (!error) {
          const url = sb.storage.from('audio').getPublicUrl(path).data.publicUrl;
          await sendMsgPayload({ audio_url: url });
          toast('Voice sent!');
        }
      };
      mediaRec.start();
      voiceBtn.textContent = '⏹️';
      voiceBtn.style.background = '#10b981';
    } catch (e) {
      toast('Microphone permission required');
    }
  };
};


(function () {
  const av = p => '<div class="uav">' + (p.avatar_url ? '<img alt="" src="' + esc(p.avatar_url) + '">' : esc((p.display_name || 'U').trim().charAt(0).toUpperCase())) + '</div>';
/* ---- বন্ধু তালিকা ---- */
  const sbtn = (a, k, attrs, ghost) => '<button class="btn' + (ghost ? ' ghost' : '') + '" data-fa="' + a + '" ' + attrs + ' style="width:auto;padding:6px 12px;font-size:13px;margin-inline-start:6px">' + esc(t(k)) + '</button>';
  const prow = (p, btns) => '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">' + av(p) + '<div style="flex:1;min-width:0"><div>' + esc(p.display_name || t('user')) + '</div><div class="muted" style="font-size:12px">' + (p.username ? '@' + esc(p.username) : '') + '</div></div>' + btns + '</div>';
  async function loadPeople() {
    const me = currentUser.id;
    const [a, b] = await Promise.all([sb.from('friendships').select('*').or('requester_id.eq.' + me + ',addressee_id.eq.' + me), sb.from('blocks').select('blocked_id').eq('blocker_id', me)]);
    const fr = a.data || [], bl = (b.data || []).map(x => x.blocked_id), ids = new Set(bl);
    fr.forEach(f => { ids.add(f.requester_id); ids.add(f.addressee_id); }); ids.delete(me);
    const pm = {};
    if (ids.size) ((await sb.from('profiles').select('id,display_name,avatar_url,username').in('id', [...ids])).data || []).forEach(p => pm[p.id] = p);
    const other = f => pm[f.requester_id === me ? f.addressee_id : f.requester_id];
    const none = '<div class="muted">' + esc(t('none_yet')) + '</div>';
    $('pp-req').innerHTML = fr.filter(f => f.status === 'pending' && f.addressee_id === me).map(f => { const p = other(f); return p ? prow(p, sbtn('acc', 'accept', 'data-fid="' + f.id + '"') + sbtn('dec', 'decline', 'data-fid="' + f.id + '"', 1)) : ''; }).join('') || none;
    $('pp-friends').innerHTML = fr.filter(f => f.status === 'accepted').map(f => { const p = other(f); return p ? prow(p, sbtn('unf', 'unfriend', 'data-fid="' + f.id + '"', 1)) : ''; }).join('') || none;
    $('pp-blocked').innerHTML = bl.map(id => pm[id] ? prow(pm[id], sbtn('unb', 'unblock', 'data-uid="' + id + '"', 1)) : '').join('') || none;
  }
  $('people').addEventListener('click', async e => {
    const b = e.target.closest('[data-fa]'); if (!b) return;
    const a = b.dataset.fa, me = currentUser.id; let r;
    if (a === 'acc') r = await sb.from('friendships').update({ status: 'accepted' }).eq('id', b.dataset.fid);
    else if (a === 'dec') r = await sb.from('friendships').update({ status: 'declined' }).eq('id', b.dataset.fid);
    else if (a === 'unf') r = await sb.from('friendships').delete().eq('id', b.dataset.fid);
    else if (a === 'unb') r = await sb.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', b.dataset.uid);
    if (r && r.error) { toast(t('err') + r.error.message); return; }
    loadPeople();
  });
  document.addEventListener('DOMContentLoaded', () => {
    $('btn-people').onclick = () => { $('people').classList.remove('hidden'); loadPeople(); };
  });

  /* ---- নোটিফিকেশন ---- */
  const NT = {
    bn: { like: 'আপনার পোস্টে রিঅ্যাক্ট করেছেন', comment: 'আপনার পোস্টে কমেন্ট করেছেন', friend_request: 'আপনাকে ফ্রেন্ড রিকোয়েস্ট পাঠিয়েছেন', friend_accepted: 'আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করেছেন' },
    en: { like: 'reacted to your post', comment: 'commented on your post', friend_request: 'sent you a friend request', friend_accepted: 'accepted your friend request' }
  };
  window.openNotificationsModal = async function () {
    const sh = $('notif-sheet'); sh.classList.remove('hidden');
    $('notif-sheet-close').onclick = $('notif-close-btn').onclick = () => sh.classList.add('hidden');
    const box = $('notif-list'); box.innerHTML = '<div class="muted" style="text-align:center">' + esc(t('loading')) + '</div>';
    const { data, error } = await sb.from('notifications').select('id,actor_id,type,created_at,read_at').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(30);
    if (error) { box.textContent = error.message; return; }
    if (!data.length) { box.innerHTML = '<div class="muted" style="text-align:center;padding:20px">' + esc(t('notif_empty')) + '</div>'; return; }
    const ids = [...new Set(data.map(n => n.actor_id).filter(Boolean))], pm = {};
    if (ids.length) ((await sb.from('profiles').select('id,display_name,avatar_url').in('id', ids)).data || []).forEach(p => pm[p.id] = p);
    const T = NT[lang] || NT.en;
    box.innerHTML = data.map(n => { const p = pm[n.actor_id] || {}; return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)' + (n.read_at ? '' : ';background:rgba(47,107,255,.08)') + '">' + av(p) + '<div style="flex:1"><b>' + esc(p.display_name || t('user')) + '</b> ' + esc(T[n.type] || n.type) + '<div class="muted" style="font-size:12px">' + esc(timeAgo(n.created_at)) + '</div></div></div>'; }).join('');
    sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', currentUser.id).is('read_at', null).then(() => {});
  };

  })();
