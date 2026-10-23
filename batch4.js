// Talkia Advanced Suite Batch 4: Complete & Fully Functional Features
console.log("Talkia Advanced Suite Batch 4 Loaded Correctly");

document.addEventListener('DOMContentLoaded', () => {
  // পারফেক্ট CSS ফিক্স: লেখকের অবতার ছোট ও গোল থাকবে, কিন্তু মূল ফটো পোস্ট বড় ও সুন্দর দেখাবে
  const style = document.createElement('style');
  style.innerHTML = `
    /* ১. শুধু পোস্টের হেডার বা লিস্টে থাকা ইউজার/প্রোফাইল পিকচারগুলো ছোট ও গোল হবে */
    .post-header img, .feed-item img:not(.post-main-img), .friend-item img, .search-user-item img, .notif-item img, img.avatar-small {
      width: 40px !important;
      height: 40px !important;
      min-width: 40px !important;
      min-height: 40px !important;
      border-radius: 50% !important;
      object-fit: cover !important;
    }

    /* ২. মূল ফটো পোস্ট বা আপলোড করা ছবিগুলো বড় ও সুন্দর ফিটিংয়ে থাকবে (গোল হবে না) */
    .post-content img, .uploaded-feed-img, .post img:not(.author-avatar) {
      width: 100% !important;
      max-height: 350px !important;
      object-fit: cover !important;
      border-radius: 12px !important;
      display: block;
      margin: 8px auto;
    }
  `;
  document.head.appendChild(style);

  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.onclick = (e) => {
      e.preventDefault();
      openSettingsDashboard();
    };
  }

  const btnVisitors = document.getElementById('btn-visitors');
  if (btnVisitors) {
    btnVisitors.onclick = (e) => {
      e.preventDefault();
      openProfileVisitorsModal();
    };
  }

  const btnSearch = document.getElementById('btn-search');
  if (btnSearch) {
    btnSearch.onclick = (e) => {
      e.preventDefault();
      const searchModal = document.getElementById('search');
      if (searchModal) searchModal.classList.remove('hidden');
    };
  }

  const btnInbox = document.getElementById('btn-inbox');
  if (btnInbox) {
    btnInbox.onclick = (e) => {
      e.preventDefault();
      openInboxModal();
    };
  }

  const btnBell = document.getElementById('btn-bell');
  if (btnBell) {
    btnBell.onclick = (e) => {
      e.preventDefault();
      openNotificationsModal();
    };
  }

  const btnCreateRoom = document.getElementById('btn-create-room');
  if (btnCreateRoom) {
    btnCreateRoom.onclick = (e) => {
      e.preventDefault();
      openCreateGroupRoomModal();
    };
  }
});

// Fully Interactive Notifications Modal Implementation
window.openNotificationsModal = async function() {
  const notifSheet = document.getElementById('notif-sheet');
  const notifList = document.getElementById('notif-list');
  if (!notifSheet || !notifList) return;

  notifSheet.classList.remove('hidden');
  notifList.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:20px;">${t('loading')}</p>`;

  document.getElementById('notif-sheet-close').onclick = () => notifSheet.classList.add('hidden');
  document.getElementById('notif-close-btn').onclick = () => notifSheet.classList.add('hidden');

  if (!currentUser) return;
  const me = currentUser.id;

  const { data: reqs } = await sb.from('friendships').select('*').eq('addressee_id', me).eq('status', 'pending');
  
  if (!reqs || reqs.length === 0) {
    notifList.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">${t('notif_empty')}</p>`;
    return;
  }

  const sIds = reqs.map(r => r.requester_id);
  const { data: senders } = await sb.from('profiles').select('*').in('id', sIds);

  if (!senders || senders.length === 0) {
    notifList.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">${t('notif_empty')}</p>`;
    return;
  }

  notifList.innerHTML = reqs.map(r => {
    const s = senders.find(p => p.id === r.requester_id);
    if (!s) return '';
    return `
      <div style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #26314a;">
        <div style="width:40px; height:40px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden; flex-shrink:0;">
          ${s.avatar_url ? `<img src="${esc(s.avatar_url)}" class="avatar-small" style="width:100%; height:100%; object-fit:cover;">` : esc((s.display_name || 'U').charAt(0).toUpperCase())}
        </div>
        <div style="flex:1; min-width:0;">
          <div style="color:#fff; font-weight:600; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(s.display_name)}</div>
          <div style="color:#8b97b3; font-size:11px;">${t('requests')}</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn sm accept-notif-btn" data-id="${r.id}" style="padding:6px 10px; font-size:12px; width:auto;">${t('accept')}</button>
          <button class="btn ghost sm decline-notif-btn" data-id="${r.id}" style="padding:6px 10px; font-size:12px; width:auto; background:transparent; color:#ef4444; border-color:rgba(239,68,68,0.3);">${t('decline')}</button>
        </div>
      </div>
    `;
  }).join('');

  notifList.querySelectorAll('.accept-notif-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await sb.from('friendships').update({ status: 'accepted' }).eq('id', id);
      toast(t('saved'));
      openNotificationsModal();
    };
  });

  notifList.querySelectorAll('.decline-notif-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await sb.from('friendships').delete().eq('id', id);
      toast(t('saved'));
      openNotificationsModal();
    };
  });
};

// Inbox Modal Implementation
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

  if (!friends || friends.length === 0) {
    inboxList.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">${t('inbox_empty')}</p>`;
    return;
  }

  inboxList.innerHTML = friends.map(f => `
    <div class="inbox-friend-item" data-id="${f.id}" style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #26314a; cursor:pointer;">
      <div style="width:44px; height:44px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
        ${f.avatar_url ? `<img src="${esc(f.avatar_url)}" class="avatar-small" style="width:100%; height:100%; object-fit:cover;">` : esc((f.display_name || 'U').charAt(0).toUpperCase())}
      </div>
      <div style="flex:1;">
        <div style="color:#fff; font-weight:600; font-size:15px;">${esc(f.display_name)}</div>
        <div style="color:#8b97b3; font-size:12px;">@${esc(f.username || '')} ${t('start_chat_hint')}</div>
      </div>
    </div>
  `).join('');

  inboxList.querySelectorAll('.inbox-friend-item').forEach(item => {
    item.onclick = () => {
      const fid = item.dataset.id;
      const fr = friends.find(x => x.id === fid);
      toast(fr ? `${fr.display_name}...` : t('loading'));
    };
  });
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
        <button id="set-pi-btn" style="text-align:left; padding:14px; background:#1a2234; border:1px solid #26314a; color:#fff; border-radius:12px; font-size:14px; cursor:pointer; font-weight:500;">
          ${t('p_info')}
        </button>
        <button id="set-priv-btn" style="text-align:left; padding:14px; background:#1a2234; border:1px solid #26314a; color:#fff; border-radius:12px; font-size:14px; cursor:pointer; font-weight:500;">
          ${t('privacy_pass')}
        </button>
        <button id="set-lang-btn" style="text-align:left; padding:14px; background:#1a2234; border:1px solid #26314a; color:#fff; border-radius:12px; font-size:14px; cursor:pointer; font-weight:500;">
          🌐 Language / ভাষা
        </button>
        <button id="set-logout-btn" style="text-align:left; padding:14px; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.3); color:#ef4444; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; margin-top:8px;">
          🚪 ${t('logout')}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('set-close-x').onclick = () => modal.remove();
  document.getElementById('set-pi-btn').onclick = () => { modal.remove(); openPersonalDetailsModal(); };
  document.getElementById('set-priv-btn').onclick = () => { modal.remove(); openPrivacyPasswordModal(); };
  document.getElementById('set-lang-btn').onclick = () => { modal.remove(); openLanguageModal(); };
  document.getElementById('set-logout-btn').onclick = () => sb.auth.signOut().then(() => location.reload());
};

window.openPersonalDetailsModal = async function() {
  const { data: { user } } = await sb.auth.getUser();
  if(!user) return;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:20px;';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left;">
      <h3 style="margin:0 0 16px; font-size:18px; color:#fff;">👤 Personal Information</h3>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label style="font-size:12px; color:#8b97b3; display:block; margin-bottom:4px;">Display Name:</label>
          <input type="text" id="pi-name" value="${profile?.display_name || ''}" style="width:100%; padding:12px; border-radius:10px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:14px; outline:none;">
        </div>
        <div>
          <label style="font-size:12px; color:#8b97b3; display:block; margin-bottom:4px;">Email Address:</label>
          <input type="email" id="pi-email" value="${user.email || ''}" style="width:100%; padding:12px; border-radius:10px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:14px; outline:none;" readonly>
        </div>
        <div>
          <label style="font-size:12px; color:#8b97b3; display:block; margin-bottom:4px;">Phone Number:</label>
          <input type="text" id="pi-phone" value="${profile?.phone || ''}" placeholder="+8801xxxxxxxxx" style="width:100%; padding:12px; border-radius:10px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:14px; outline:none;">
        </div>
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button id="save-pi-btn" style="flex:1; background:#2f6bff; color:#fff; border:0; padding:12px; border-radius:10px; font-weight:600; cursor:pointer;">${t('save')}</button>
          <button id="pi-close-btn" style="flex:1; background:#1a2234; color:#fff; border:1px solid #26314a; padding:12px; border-radius:10px; cursor:pointer;">${t('btn_back')}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('pi-close-btn').onclick = () => modal.remove();
  document.getElementById('save-pi-btn').onclick = async () => {
    const newName = document.getElementById('pi-name').value.trim();
    const newPhone = document.getElementById('pi-phone').value.trim();
    await sb.from('profiles').update({ display_name: newName, phone: newPhone }).eq('id', user.id);
    toast(t('saved'));
    modal.remove();
    if(typeof loadProfile === 'function') loadProfile();
  };
};

window.openPrivacyPasswordModal = async function() {
  const { data: { user } } = await sb.auth.getUser();
  if(!user) return;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:20px;';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:420px; border-radius:20px; padding:20px; text-align:left; max-height:85vh; overflow-y:auto;">
      <h3 style="margin:0 0 16px; font-size:18px; color:#fff;">${t('p_privacy_title')}</h3>
      <div style="display:flex; flex-direction:column; gap:12px;">
        
        <div>
          <label style="font-size:12px; color:#7aa5ff; display:block; margin-bottom:4px; font-weight:600;">${t('p_who_posts')}</label>
          <select id="pr-post" style="width:100%; padding:10px; border-radius:8px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:13px;">
            <option value="public" ${profile?.post_privacy === 'public' ? 'selected' : ''}>${t('opt_public')}</option>
            <option value="friends" ${profile?.post_privacy === 'friends' ? 'selected' : ''}>${t('opt_friends')}</option>
            <option value="only_me" ${profile?.post_privacy === 'only_me' ? 'selected' : ''}>${t('opt_onlyme')}</option>
          </select>
        </div>

        <div>
          <label style="font-size:12px; color:#7aa5ff; display:block; margin-bottom:4px; font-weight:600;">${t('p_who_sms')}</label>
          <select id="pr-sms" style="width:100%; padding:10px; border-radius:8px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:13px;">
            <option value="everyone" ${profile?.sms_privacy === 'everyone' ? 'selected' : ''}>${t('opt_everyone')}</option>
            <option value="friends" ${profile?.sms_privacy === 'friends' ? 'selected' : ''}>${t('opt_friends')}</option>
          </select>
        </div>

        <div>
          <label style="font-size:12px; color:#7aa5ff; display:block; margin-bottom:4px; font-weight:600;">${t('p_who_wall')}</label>
          <select id="pr-wall" style="width:100%; padding:10px; border-radius:8px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:13px;">
            <option value="friends" ${profile?.wall_privacy === 'friends' ? 'selected' : ''}>${t('opt_friends')}</option>
            <option value="only_me" ${profile?.wall_privacy === 'only_me' ? 'selected' : ''}>${t('opt_onlyme')}</option>
          </select>
        </div>

        <div>
          <label style="font-size:12px; color:#7aa5ff; display:block; margin-bottom:4px; font-weight:600;">${t('p_who_cm')}</label>
          <select id="pr-comment" style="width:100%; padding:10px; border-radius:8px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:13px;">
            <option value="everyone" ${profile?.comment_privacy === 'everyone' ? 'selected' : ''}>${t('opt_everyone')}</option>
            <option value="friends" ${profile?.comment_privacy === 'friends' ? 'selected' : ''}>${t('opt_friends')}</option>
          </select>
        </div>

        <div>
          <label style="font-size:12px; color:#7aa5ff; display:block; margin-bottom:4px; font-weight:600;">${t('p_who_like')}</label>
          <select id="pr-like" style="width:100%; padding:10px; border-radius:8px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:13px;">
            <option value="everyone" ${profile?.like_privacy === 'everyone' ? 'selected' : ''}>${t('opt_everyone')}</option>
            <option value="friends" ${profile?.like_privacy === 'friends' ? 'selected' : ''}>${t('opt_friends')}</option>
          </select>
        </div>

        <div style="display:flex; gap:10px; margin-top:8px;">
          <button id="save-priv-btn" style="flex:1; background:#2f6bff; color:#fff; border:0; padding:12px; border-radius:10px; font-weight:600; cursor:pointer;">${t('save')}</button>
          <button id="priv-close-btn" style="flex:1; background:#1a2234; color:#fff; border:1px solid #26314a; padding:12px; border-radius:10px; cursor:pointer;">${t('btn_back')}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('priv-close-btn').onclick = () => modal.remove();
  document.getElementById('save-priv-btn').onclick = async () => {
    const privData = {
      post_privacy: document.getElementById('pr-post').value,
      sms_privacy: document.getElementById('pr-sms').value,
      wall_privacy: document.getElementById('pr-wall').value,
      comment_privacy: document.getElementById('pr-comment').value,
      like_privacy: document.getElementById('pr-like').value
    };
    await sb.from('profiles').update(privData).eq('id', user.id);
    toast(t('saved'));
    modal.remove();
  };
};

window.openLanguageModal = function() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:20px;';

  const langs = [
    { code: 'bn', name: '🇧🇩 বাংলা (Bengali)' },
    { code: 'en', name: '🇺🇸 English' },
    { code: 'ar', name: '🇸🇦 العربية (Arabic)' },
    { code: 'hi', name: '🇮🇳 हिन्दी (Hindi)' }
  ];

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:360px; border-radius:20px; padding:20px; text-align:left;">
      <h3 style="margin:0 0 16px; font-size:18px; color:#fff;">🌐 Select Language / ভাষা</h3>
      <div style="display:flex; flex-direction:column; gap:8px;" id="lang-list-btns"></div>
      <button id="lang-close-btn" style="width:100%; margin-top:14px; background:#1a2234; color:#fff; border:1px solid #26314a; padding:10px; border-radius:10px; cursor:pointer;">${t('btn_back')}</button>
    </div>
  `;
  document.body.appendChild(modal);

  const container = document.getElementById('lang-list-btns');
  container.innerHTML = langs.map(l => `
    <button data-code="${l.code}" style="display:flex; justify-content:space-between; align-items:center; text-align:left; padding:12px; background:${lang === l.code ? '#2f6bff' : '#1a2234'}; border:1px solid #26314a; color:#fff; border-radius:10px; cursor:pointer; font-weight:${lang === l.code ? 'bold' : 'normal'};">
      <span>${l.name}</span>
      <span>${lang === l.code ? '✓' : ''}</span>
    </button>
  `).join('');

  container.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      setLang(btn.dataset.code);
      modal.remove();
    };
  });

  document.getElementById('lang-close-btn').onclick = () => modal.remove();
};

const srClose = document.getElementById('sr-close');
if (srClose) {
  srClose.onclick = () => document.getElementById('search').classList.add('hidden');
}

const srForm = document.getElementById('sr-form');
if (srForm) {
  srForm.onsubmit = async e => {
    e.preventDefault();
    const q = document.getElementById('sr-q').value.trim();
    const resBox = document.getElementById('sr-results');
    if (!q || q.length < 2) { resBox.innerHTML = `<div class="muted" style="padding:10px;">${t('min2')}</div>`; return; }
    
    resBox.innerHTML = `<div class="muted" style="padding:10px;">${t('loading')}</div>`;
    const { data, error } = await sb.from('profiles').select('*').or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).limit(20);
    
    if (error) { resBox.innerHTML = `<div class="muted" style="padding:10px;">${error.message}</div>`; return; }
    if (!data || data.length === 0) { resBox.innerHTML = `<div class="muted" style="padding:10px;">${t('no_results')}</div>`; return; }

    resBox.innerHTML = data.map(u => `
      <div class="search-user-item" data-id="${u.id}" style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #26314a; cursor:pointer;">
        <div style="width:40px; height:40px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
          ${u.avatar_url ? `<img src="${esc(u.avatar_url)}" class="avatar-small" style="width:100%; height:100%; object-fit:cover;">` : esc((u.display_name || 'U').charAt(0).toUpperCase())}
        </div>
        <div style="flex:1;">
          <div style="color:#fff; font-weight:600; font-size:14px;">${esc(u.display_name || 'User')}</div>
          <div style="color:#8b97b3; font-size:12px;">@${esc(u.username || 'username')}</div>
        </div>
      </div>
    `).join('');

    resBox.querySelectorAll('.search-user-item').forEach(item => {
      item.onclick = () => openVisitedUserProfile(item.dataset.id);
    });
  };
}

window.openVisitedUserProfile = async function(userId) {
  const searchModal = document.getElementById('search');
  if (searchModal) searchModal.classList.add('hidden');
  
  const { data: u } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if(!u) return;

  if (currentUser && currentUser.id !== userId) {
    await sb.from('profile_visitors').insert({ profile_id: userId, visitor_id: currentUser.id }).catch(()=>{});
  }

  const sheet = document.getElementById('user-sheet');
  const container = document.getElementById('user-in');
  if (sheet) sheet.classList.remove('hidden');

  if (container) {
    container.innerHTML = `
      <div style="text-align:right;"><button id="user-sheet-close" style="color:#8b97b3; font-size:20px; cursor:pointer; background:none; border:0;">✕</button></div>
      <div style="text-align:center;">
        <div style="width:80px; height:80px; border-radius:50%; background:#2f6bff; margin:0 auto 10px; display:grid; place-items:center; font-size:32px; font-weight:bold; color:#fff; overflow:hidden;">
          ${u.avatar_url ? `<img src="${esc(u.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((u.display_name || 'U').charAt(0).toUpperCase())}
        </div>
        <h3 style="margin:0; color:#fff;">${esc(u.display_name)}</h3>
        <div style="color:#8b97b3; font-size:13px;">@${esc(u.username || '')}</div>
        <p style="color:#eef2fb; font-size:14px; margin-top:8px;">${esc(u.bio || '')}</p>
        <button id="send-req-btn" style="background:#2f6bff; color:#fff; border:0; padding:10px 20px; border-radius:10px; font-weight:bold; margin-top:10px; cursor:pointer;">${t('send_friend_req')}</button>
      </div>
    `;
    document.getElementById('user-sheet-close').onclick = () => sheet.classList.add('hidden');
    document.getElementById('send-req-btn').onclick = () => sendFriendRequestTo(u.id);
  }
};

window.sendFriendRequestTo = async function(targetId) {
  if (!currentUser) return;
  const { error } = await sb.from('friendships').insert({ requester_id: currentUser.id, addressee_id: targetId, status: 'pending' });
  if (error) { toast(t('req_already_sent')); return; }
  toast(t('req_sent'));
};

window.openProfileVisitorsModal = async function() {
  if (!currentUser) return;
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:20px;';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; height:70vh; display:flex; flex-direction:column; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="margin:0; font-size:18px; color:#fff;">👁️ ${t('pv_title')}</h3>
        <button id="vis-close-x" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
      </div>
      <div id="visitors-list" style="overflow-y:auto; flex:1;">
        <p style="text-align:center; color:#8b97b3; padding-top:20px;">${t('loading')}</p>
      </div>
      <button class="btn ghost sm" id="vis-close-btn" style="margin-top:12px;">${t('btn_back')}</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('vis-close-x').onclick = () => modal.remove();
  document.getElementById('vis-close-btn').onclick = () => modal.remove();

  const { data: visits } = await sb.from('profile_visitors').select('*').eq('profile_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
  const container = document.getElementById('visitors-list');

  if (!visits || visits.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">${t('no_visitors')}</p>`;
    return;
  }

  const vIds = [...new Set(visits.map(v => v.visitor_id))];
  const { data: vProfiles } = await sb.from('profiles').select('*').in('id', vIds);

  container.innerHTML = visits.map(v => {
    const vp = vProfiles?.find(p => p.id === v.visitor_id);
    if (!vp) return '';
    return `
      <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #26314a;">
        <div style="width:40px; height:40px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
          ${vp.avatar_url ? `<img src="${esc(vp.avatar_url)}" class="avatar-small" style="width:100%; height:100%; object-fit:cover;">` : esc((vp.display_name || 'U').charAt(0).toUpperCase())}
        </div>
        <div style="flex:1;">
          <div style="color:#fff; font-weight:600; font-size:14px;">${esc(vp.display_name)}</div>
          <div style="color:#8b97b3; font-size:11px;">${t('visited_at')}${new Date(v.created_at).toLocaleTimeString()}</div>
        </div>
      </div>
    `;
  }).join('');
};

window.loadGroupRooms = async function() {
  const box = document.getElementById('group-rooms-list');
  if(!box) return;
  box.innerHTML = `<div class="card muted" style="text-align:center;">${t('loading')}</div>`;
  
  const { data, error } = await sb.from('group_rooms').select('*').order('created_at', { ascending: false });
  if (error || !data || data.length === 0) {
    box.innerHTML = `<div class="card muted" style="text-align:center;">${t('g_empty')}</div>`;
    return;
  }

  box.innerHTML = data.map(r => `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h4 style="margin:0 0 4px; color:#fff;">🎙️ ${esc(r.room_name)}</h4>
        <div style="font-size:12px; color:#8b97b3;">${t('member_limit')}</div>
      </div>
      <button class="btn ghost sm join-room-btn" data-id="${r.id}" style="width:auto; padding:8px 16px;">${t('g_join')}</button>
    </div>
  `).join('');

  box.querySelectorAll('.join-room-btn').forEach(btn => {
    btn.onclick = () => toast(t('room_joined'));
  });
};

window.openCreateGroupRoomModal = function() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:20px;';
  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:380px; border-radius:20px; padding:20px; text-align:left;">
      <h3 style="margin:0 0 14px; font-size:18px; color:#fff;">🎙️ ${t('g_modal_title')}</h3>
      <div class="field"><label>${t('g_room_name_lbl')}</label><input type="text" id="g-name" placeholder="${t('g_placeholder')}" style="width:100%; padding:12px; border-radius:10px; background:#1a2234; border:1px solid #26314a; color:#fff; outline:none;"></div>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button id="create-g-btn" style="flex:1; background:#2f6bff; color:#fff; border:0; padding:12px; border-radius:10px; font-weight:600; cursor:pointer;">${t('g_create')}</button>
        <button id="g-close-btn" style="flex:1; background:#1a2234; color:#fff; border:1px solid #26314a; padding:12px; border-radius:10px; cursor:pointer;">${t('btn_back')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('g-close-btn').onclick = () => modal.remove();
  document.getElementById('create-g-btn').onclick = async () => {
    const name = document.getElementById('g-name').value.trim();
    if(!name) return;
    const { error } = await sb.from('group_rooms').insert({ room_name: name, host_id: currentUser.id });
    if (error) { toast(error.message); return; }
    toast(t('room_created'));
    modal.remove();
    loadGroupRooms();
  };
};

document.addEventListener('click', function(e) {
  if (e.target.closest('#btn-people')) {
    e.preventDefault();
    const peopleModal = document.getElementById('people');
    if (peopleModal) { peopleModal.classList.remove('hidden'); renderPeople(); }
  }
  if (e.target.closest('#pp-close')) {
    document.getElementById('people').classList.add('hidden');
  }
}, true);

window.renderPeople = async function() {
  const reqBox = document.getElementById('pp-req');
  const friendBox = document.getElementById('pp-friends');
  const blockedBox = document.getElementById('pp-blocked');
  
  if (reqBox) reqBox.innerHTML = `<div class="muted" style="font-size:13px;">${t('none_yet')}</div>`;
  if (friendBox) friendBox.innerHTML = `<div class="muted" style="font-size:13px;">${t('none_yet')}</div>`;
  if (blockedBox) blockedBox.innerHTML = `<div class="muted" style="font-size:13px;">${t('none_yet')}</div>`;

  if (!currentUser) return;
  const me = currentUser.id;

  const { data: friendships } = await sb.from('friendships').select('*').or(`requester_id.eq.${me},addressee_id.eq.${me}`);
  if (!friendships || friendships.length === 0) return;

  const accepted = friendships.filter(f => f.status === 'accepted');
  const pending = friendships.filter(f => f.status === 'pending' && f.addressee_id === me);

  if (pending.length > 0 && reqBox) {
    const senderIds = pending.map(f => f.requester_id);
    const { data: senders } = await sb.from('profiles').select('*').in('id', senderIds);
    if (senders) {
      reqBox.innerHTML = senders.map(s => `
        <div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #26314a;">
          <div style="width:36px; height:36px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
            ${s.avatar_url ? `<img src="${esc(s.avatar_url)}" class="avatar-small" style="width:100%; height:100%; object-fit:cover;">` : esc((s.display_name || 'U').charAt(0).toUpperCase())}
          </div>
          <div style="flex:1; font-size:14px; color:#fff;">${esc(s.display_name)}</div>
        </div>
      `).join('');
    }
  }

  if (accepted.length > 0 && friendBox) {
    const fIds = accepted.map(f => f.requester_id === me ? f.addressee_id : f.requester_id);
    const { data: friends } = await sb.from('profiles').select('*').in('id', fIds);
    if (friends) {
      friendBox.innerHTML = friends.map(f => `
        <div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #26314a;">
          <div style="width:36px; height:36px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
            ${f.avatar_url ? `<img src="${esc(f.avatar_url)}" class="avatar-small" style="width:100%; height:100%; object-fit:cover;">` : esc((f.display_name || 'T').charAt(0).toUpperCase())}
          </div>
          <div style="flex:1; font-size:14px; color:#fff;">${esc(f.display_name)}</div>
        </div>
      `).join('');
    }
  }
};
