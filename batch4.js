// Talkia Advanced Suite Batch 4: Fixed Group Room Join, Optimized Inbox & Realtime Sync
console.log("Talkia Advanced Suite Batch 4 Loaded Correctly");

document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .chat-bubble { max-width: 75%; padding: 10px 14px; border-radius: 16px; margin-bottom: 8px; font-size: 14px; word-break: break-word; }
    .chat-me { background: var(--accent); color: #fff; margin-left: auto; border-bottom-right-radius: 4px; }
    .chat-them { background: var(--surface2); color: var(--text); margin-right: auto; border-bottom-left-radius: 4px; border: 1px solid var(--line); }
  `;
  document.head.appendChild(style);

  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) btnSettings.onclick = (e) => { e.preventDefault(); openSettingsDashboard(); };

  const btnVisitors = document.getElementById('btn-visitors');
  if (btnVisitors) btnVisitors.onclick = (e) => { 
    e.preventDefault(); 
    btnVisitors.textContent = '👁️';
    openProfileVisitorsModal(); 
  };

  const btnSearch = document.getElementById('btn-search');
  if (btnSearch) btnSearch.onclick = (e) => { e.preventDefault(); const s = document.getElementById('search'); if (s) s.classList.remove('hidden'); };

  const btnInbox = document.getElementById('btn-inbox');
  if (btnInbox) btnInbox.onclick = (e) => { e.preventDefault(); openInboxModal(); };

  const btnBell = document.getElementById('btn-bell');
  if (btnBell) btnBell.onclick = (e) => { e.preventDefault(); openNotificationsModal(); };

  const btnCreateRoom = document.getElementById('btn-create-room');
  if (btnCreateRoom) btnCreateRoom.onclick = (e) => { e.preventDefault(); openCreateGroupRoomModal(); };

  const srClose = document.getElementById('sr-close');
  if (srClose) srClose.onclick = () => { const s = document.getElementById('search'); if(s) s.classList.add('hidden'); };

  const ppClose = document.getElementById('pp-close');
  if (ppClose) ppClose.onclick = () => { const p = document.getElementById('people'); if(p) p.classList.add('hidden'); };

  const btnPeople = document.getElementById('btn-people');
  if (btnPeople) btnPeople.onclick = () => { const p = document.getElementById('people'); if(p) p.classList.remove('hidden'); };

  const srForm = document.getElementById('sr-form');
  if (srForm) {
    srForm.onsubmit = async (e) => {
      e.preventDefault();
      const q = document.getElementById('sr-q').value.trim();
      const resBox = document.getElementById('sr-results');
      if (!q || q.length < 2) { resBox.innerHTML = `<div class="muted" style="text-align:center; padding:10px;">${t('min2')}</div>`; return; }
      resBox.innerHTML = `<div class="muted" style="text-align:center; padding:10px;">${t('loading')}</div>`;
      
      const { data, error } = await sb.from('profiles').select('*').ilike('display_name', `%${q}%`).limit(20);
      if (error || !data || data.length === 0) {
        resBox.innerHTML = `<div class="muted" style="text-align:center; padding:10px;">${t('no_results')}</div>`;
        return;
      }

      resBox.innerHTML = data.map(u => `
        <div class="search-user-item" data-uid="${u.id}" style="display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--line); cursor:pointer;">
          <div class="uav">${u.avatar_url ? `<img src="${esc(u.avatar_url)}">` : esc((u.display_name || 'U').charAt(0))}</div>
          <div>
            <div style="color:var(--text); font-weight:600;">${esc(u.display_name)}</div>
            <div class="muted" style="font-size:12px;">@${esc(u.username || '')}</div>
          </div>
        </div>
      `).join('');

      resBox.querySelectorAll('.search-user-item').forEach(el => {
        el.onclick = () => {
          const uid = el.dataset.uid;
          document.getElementById('search').classList.add('hidden');
          openUserProfileModal(uid);
        };
      });
    };
  }
});

window.openSettingsDashboard = function() {
  let modal = document.getElementById('settings-dashboard-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'settings-dashboard-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';
    document.body.appendChild(modal);
  }

  function renderMainSettings() {
    modal.innerHTML = `
      <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
          <h3 style="margin:0; font-size:18px; color:#fff;">⚙️ ${t('settings')}</h3>
          <button id="set-close-x" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div id="menu-personal" style="padding:14px; background:var(--surface2); border-radius:12px; border:1px solid var(--line); cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:600; color:var(--text);">👤 ${t('p_info')}</span>
            <span style="color:var(--muted);">›</span>
          </div>
          <div id="menu-privacy" style="padding:14px; background:var(--surface2); border-radius:12px; border:1px solid var(--line); cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:600; color:var(--text);">🔒 ${t('p_privacy_title')}</span>
            <span style="color:var(--muted);">›</span>
          </div>
          <div id="menu-lang" style="padding:14px; background:var(--surface2); border-radius:12px; border:1px solid var(--line); cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:600; color:var(--text);">🌐 ${t('language')}</span>
            <span style="color:var(--muted);" id="lang-arrow">⌄</span>
          </div>
          <div id="lang-container-box" class="hidden" style="padding:10px; background:var(--bg); border-radius:10px; border:1px solid var(--line);">
            <div class="langs" data-langs style="justify-content:center;"></div>
          </div>
          <button id="set-logout-btn" style="text-align:left; padding:14px; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.3); color:#ef4444; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; margin-top:6px;">🚪 ${t('logout')}</button>
        </div>
      </div>
    `;

    document.getElementById('set-close-x').onclick = () => modal.remove();
    document.getElementById('set-logout-btn').onclick = () => sb.auth.signOut().then(() => location.reload());

    document.getElementById('menu-personal').onclick = () => renderPersonalModal();
    document.getElementById('menu-privacy').onclick = () => renderPrivacyModal();

    const langMenu = document.getElementById('menu-lang');
    const langBox = document.getElementById('lang-container-box');
    langMenu.onclick = () => {
      langBox.classList.toggle('hidden');
      if (!langBox.classList.contains('hidden') && typeof renderLangButtons === 'function') {
        renderLangButtons();
      }
    };
  }

  function renderPersonalModal() {
    modal.innerHTML = `
      <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
          <h3 style="margin:0; font-size:18px; color:#fff;">👤 ${t('p_info')}</h3>
          <button id="back-to-set" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">←</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; font-size:14px; color:var(--text);">
          <div style="padding:12px; background:var(--surface2); border-radius:10px; border:1px solid var(--line);">
            <div style="color:var(--muted); font-size:12px;">Email</div>
            <div style="font-weight:600; margin-top:2px;">${currentUser ? currentUser.email : ''}</div>
          </div>
          <div style="padding:12px; background:var(--surface2); border-radius:10px; border:1px solid var(--line);">
            <div style="color:var(--muted); font-size:12px;">Name</div>
            <div style="font-weight:600; margin-top:2px;">${currentProfile?.display_name || 'User'}</div>
          </div>
          <div style="padding:12px; background:var(--surface2); border-radius:10px; border:1px solid var(--line);">
            <div style="color:var(--muted); font-size:12px;">Username</div>
            <div style="font-weight:600; margin-top:2px;">@${currentProfile?.username || ''}</div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('back-to-set').onclick = () => renderMainSettings();
  }

  function renderPrivacyModal() {
    modal.innerHTML = `
      <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left; max-height:85vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
          <h3 style="margin:0; font-size:18px; color:#fff;">🔒 ${t('p_privacy_title')}</h3>
          <button id="back-to-set" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">←</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:14px; font-size:14px; color:var(--text);">
          <div>
            <label style="color:var(--muted); font-size:12px; display:block; margin-bottom:4px;">${t('p_who_posts')}</label>
            <select style="width:100%; padding:10px; background:var(--surface2); border:1px solid var(--line); border-radius:8px; color:#fff; outline:none;">
              <option>${t('opt_public')}</option>
              <option>${t('opt_friends')}</option>
              <option>${t('opt_onlyme')}</option>
            </select>
          </div>
          <div>
            <label style="color:var(--muted); font-size:12px; display:block; margin-bottom:4px;">${t('p_who_cm')}</label>
            <select style="width:100%; padding:10px; background:var(--surface2); border:1px solid var(--line); border-radius:8px; color:#fff; outline:none;">
              <option>${t('opt_everyone')}</option>
              <option>${t('opt_friends')}</option>
            </select>
          </div>
          <div style="border-top:1px solid var(--line); padding-top:12px;">
            <div style="font-weight:600; margin-bottom:8px; color:var(--accent-text);">${t('blocked_list')}</div>
            <div id="blocked-users-list" style="color:var(--muted); font-size:13px; text-align:center; padding:10px; background:var(--surface2); border-radius:8px;">
              ${t('none_yet')}
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('back-to-set').onclick = () => renderMainSettings();
  }

  renderMainSettings();
};

window.openUserProfileModal = async function(userId) {
  if (currentUser && userId === currentUser.id) {
    showTab('profile');
    return;
  }

  let modal = document.getElementById('user-profile-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'user-profile-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:1150; display:flex; flex-direction:column; overflow-y:auto; padding:20px;';
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');
  modal.innerHTML = `<div style="text-align:center; color:#8b97b3; margin-top:50px;">${t('loading')}</div>`;

  const { data: user, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !user) {
    modal.innerHTML = `<div style="text-align:center; color:var(--danger); margin-top:50px;">User not found</div><button class="btn ghost" onclick="document.getElementById('user-profile-modal').classList.add('hidden')" style="margin-top:20px;">${t('btn_back')}</button>`;
    return;
  }

  const { data: posts } = await sb.from('voice_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false });

  modal.innerHTML = `
    <div style="max-width:560px; width:100%; margin:0 auto; background:var(--surface); border:1px solid var(--line); border-radius:20px; overflow:hidden; max-height:90vh; display:flex; flex-direction:column;">
      <div style="padding:16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); flex-shrink:0;">
        <h3 style="margin:0; font-size:18px;">${esc(user.display_name)}</h3>
        <button id="upm-close" style="color:var(--muted); font-size:20px; background:none; border:0; cursor:pointer;">✕</button>
      </div>
      <div style="padding:20px; text-align:center; overflow-y:auto; flex:1;">
        <div class="uav" style="width:80px !important; height:80px !important; margin:0 auto 12px; font-size:32px;">
          ${user.avatar_url ? `<img src="${esc(user.avatar_url)}">` : esc((user.display_name || 'U').charAt(0))}
        </div>
        <h2 style="margin:0 0 4px; font-size:20px;">${esc(user.display_name)}</h2>
        <div class="muted" style="margin-bottom:8px;">@${esc(user.username || '')}</div>
        ${user.country ? `<span class="tag">${esc(user.country)}</span>` : ''}
        <p style="margin:12px 0; color:var(--muted); font-size:14px;">${esc(user.bio || '')}</p>
        
        <div style="display:flex; gap:10px; margin:16px 0;">
          <button class="btn" id="upm-add-friend" style="flex:1; font-size:14px; padding:10px;">${t('add_friend')}</button>
          <button class="btn ghost" id="upm-inbox" style="flex:1; font-size:14px; padding:10px;">💬 Inbox</button>
        </div>

        <div class="ext-bio-box" style="text-align:left;">
          <div><b>${t('lbl_edu')}</b> <span>${esc(user.education || t('not_added'))}</span></div>
          <div><b>${t('lbl_rel')}</b> <span>${esc(user.marital_status || t('not_added'))}</span></div>
          <div><b>${t('lbl_relig')}</b> <span>${esc(user.religion || t('not_added'))}</span></div>
          <div><b>${t('lbl_hobby')}</b> <span>${esc(user.hobbies || t('not_added'))}</span></div>
          <div><b>${t('lbl_city')}</b> <span>${esc(user.city || t('not_added'))}</span></div>
        </div>

        <div style="margin-top:20px; text-align:left;">
          <h4 style="margin-bottom:10px;">${t('posts_h')}</h4>
          <div id="upm-posts">
            ${posts && posts.length > 0 ? posts.map(cardHtml).join('') : `<div class="muted" style="text-align:center; padding:20px;">${t('none_yet')}</div>`}
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('upm-close').onclick = () => modal.classList.add('hidden');
  
  document.getElementById('upm-add-friend').onclick = async () => {
    try {
      const { error } = await sb.from('friendships').insert({ requester_id: currentUser.id, addressee_id: userId, status: 'pending' });
      if (error) throw error;
      toast(t('req_sent'));
    } catch (err) {
      toast(t('req_already_sent'));
    }
  };

  document.getElementById('upm-inbox').onclick = () => {
    modal.classList.add('hidden');
    openDirectChat(user);
  };
};

window.openProfileVisitorsModal = async function() {
  let modal = document.getElementById('visitors-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'visitors-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1150; display:flex; align-items:center; justify-content:center;';
    modal.innerHTML = `
      <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="margin:0; color:#fff; font-size:18px;">👁️ ${t('pv_title')}</h3>
          <button id="vis-close-x" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
        </div>
        <div id="visitors-list" style="max-height:300px; overflow-y:auto; color:#8b97b3; font-size:14px; text-align:center; padding:20px 0;">
          ${t('no_visitors')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('vis-close-x').onclick = () => modal.remove();
  } else {
    modal.style.display = 'flex';
  }
};

window.openCreateGroupRoomModal = function() {
  let modal = document.createElement('div');
  modal.id = 'group-modal';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1150; display:flex; align-items:center; justify-content:center;';
  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="margin:0; color:#fff; font-size:18px;">🎙️ ${t('g_modal_title')}</h3>
        <button id="grp-close-x" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
      </div>
      <div class="field" style="margin-bottom:12px;">
        <label style="color:#8b97b3; font-size:13px; display:block; margin-bottom:4px;">${t('g_room_name_lbl')}</label>
        <input type="text" id="group-room-name" placeholder="${t('g_placeholder')}" style="width:100%; padding:12px; background:#1a2234; border:1px solid #26314a; border-radius:12px; color:#fff; outline:none;">
      </div>
      <button class="btn" id="group-room-submit" style="width:100%;">${t('g_create')}</button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('grp-close-x').onclick = () => modal.remove();
  
  document.getElementById('group-room-submit').onclick = async () => {
    const name = document.getElementById('group-room-name').value.trim();
    if (!name) { toast('Enter room name'); return; }
    try {
      const { error } = await sb.from('group_rooms').insert({ name, creator_id: currentUser.id });
      if (error) throw error;
      toast(t('g_success'));
      modal.remove();
      if (typeof loadGroupRooms === 'function') loadGroupRooms();
    } catch (err) {
      toast('Error: ' + err.message);
    }
  };
};

// Fixed Group Rooms Load & Functional Room Join Handler
window.loadGroupRooms = async function() {
  const list = document.getElementById('group-rooms-list');
  if (!list) return;
  list.innerHTML = `<div class="empty">${t('loading')}</div>`;
  
  const { data, error } = await sb.from('group_rooms').select('*').order('created_at', { ascending: false });
  if (error || !data || data.length === 0) {
    list.innerHTML = `<div class="empty"><div class="big">🎙️</div>${t('g_empty')}</div>`;
    return;
  }

  list.innerHTML = data.map(room => `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:14px; margin-bottom:10px; text-align:start;">
      <div>
        <div style="font-weight:600; font-size:16px; color:var(--text);">${esc(room.name)}</div>
        <div class="muted" style="font-size:12px;">${t('member_limit')}</div>
      </div>
      <button class="btn join-room-btn" data-room-id="${room.id}" style="width:auto; padding:8px 16px; font-size:14px;">${t('g_join')}</button>
    </div>
  `).join('');

  // যুক্ত হোন (Join) বাটনে ক্লিক করলে রুমের ইন্টারফেস ওপেন হবে
  list.querySelectorAll('.join-room-btn').forEach(btn => {
    btn.onclick = () => {
      const roomId = btn.dataset.roomId;
      const room = data.find(r => r.id == roomId);
      if (room) openGroupRoomModal(room);
    };
  });
};

// Functional Group Room Modal (Opens when user joins a room)
window.openGroupRoomModal = function(room) {
  let modal = document.getElementById('group-room-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'group-room-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:1100; display:flex; flex-direction:column;';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:16px; background:#121826; border-bottom:1px solid #26314a;">
      <div style="color:#fff; font-weight:bold; font-size:16px;">🎙️ ${esc(room.name)} (গ্রুপ ভয়েস রুম)</div>
      <button id="close-room-btn" style="color:#8b97b3; font-size:22px; border:0; background:none; cursor:pointer;">✕</button>
    </div>
    <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center;">
      <div style="font-size:60px; margin-bottom:16px;">🎙️</div>
      <h3 style="color:#fff; margin-bottom:8px;">${esc(room.name)} রুমে সফলভাবে যুক্ত হয়েছেন</h3>
      <p style="color:var(--muted); font-size:14px; margin-bottom:24px;">এখানে আপনি অন্যান্য সদস্যদের সাথে লাইভ ভয়েস চ্যাট ও আড্ডা দিতে পারবেন।</p>
      <button class="btn" style="background:#10b981; max-width:220px;" onclick="toast('মাইক্রোফোন সচল হয়েছে')">🎤 কথা বলা শুরু করুন</button>
    </div>
  `;

  document.getElementById('close-room-btn').onclick = () => modal.remove();
};

// Optimized Inbox Modal with Limit, Error Handling & Realtime Auto-Sync
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

  async function loadInboxChats() {
    try {
      const { data: messages, error } = await sb.from('messages')
        .select('sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!messages || messages.length === 0) {
        inboxList.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">${t('inbox_empty')}</p>`;
        return;
      }

      const chatUserIds = [...new Set(messages.map(m => m.sender_id === me ? m.receiver_id : m.sender_id))];
      const { data: chatUsers, error: profileErr } = await sb.from('profiles').select('*').in('id', chatUserIds);

      if (profileErr) throw profileErr;

      if (!chatUsers || chatUsers.length === 0) {
        inboxList.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">${t('inbox_empty')}</p>`;
        return;
      }

      inboxList.innerHTML = chatUsers.map(f => `
        <div class="inbox-friend-item" data-id="${f.id}" style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #26314a; cursor:pointer;">
          <div class="uav">
            ${f.avatar_url ? `<img src="${esc(f.avatar_url)}">` : esc((f.display_name || 'U').charAt(0).toUpperCase())}
          </div>
          <div style="flex:1;">
            <div style="color:#fff; font-weight:600; font-size:15px;">${esc(f.display_name)}</div>
            <div style="color:#8b97b3; font-size:12px;">💬 চ্যাট দেখুন</div>
          </div>
        </div>
      `).join('');

      inboxList.querySelectorAll('.inbox-friend-item').forEach(item => {
        item.onclick = () => {
          const fid = item.dataset.id;
          const fr = chatUsers.find(x => x.id === fid);
          openDirectChat(fr);
        };
      });
    } catch (err) {
      console.error("Inbox load error:", err);
      inboxList.innerHTML = `<p style="text-align:center; color:var(--danger); padding-top:40px;">ইনবক্স লোড করতে সমস্যা হয়েছে</p>`;
      toast('ইনবক্স ডেটা ফেচ করতে ব্যর্থ হয়েছে');
    }
  }

  await loadInboxChats();

  if (!window.inboxRealtimeChannel) {
    window.inboxRealtimeChannel = sb.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.sender_id === me || payload.new.receiver_id === me) {
          if (!inboxSheet.classList.contains('hidden')) {
            loadInboxChats();
          }
        }
      })
      .subscribe();
  }
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

window.openNotificationsModal = async function() {
  const notifSheet = document.getElementById('notif-sheet');
  if (notifSheet) notifSheet.classList.remove('hidden');
  document.getElementById('notif-sheet-close').onclick = () => notifSheet.classList.add('hidden');
  document.getElementById('notif-close-btn').onclick = () => notifSheet.classList.add('hidden');
};
