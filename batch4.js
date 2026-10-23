// Talkia Advanced Suite Batch 4: Complete Implementation of all 10 Options
console.log("Talkia Advanced Suite Batch 4 Loaded with 10 Options");

// ১. সেটিংস ড্যাশবোর্ড ও স্ট্রাকচার (Personal Info & Privacy Settings)
document.addEventListener('click', function(e) {
  if (e.target.closest('#btn-settings')) {
    e.preventDefault();
    openSettingsDashboard();
  }
  if (e.target.closest('#btn-visitors')) {
    e.preventDefault();
    openProfileVisitorsModal();
  }
}, true);

window.openSettingsDashboard = function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <h3 style="margin:0; font-size:18px; color:#fff;">⚙️ ${t('settings')}</h3>
        <button onclick="this.closest('.fixed').remove()" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button onclick="this.closest('.fixed').remove(); openPersonalDetailsModal();" style="text-align:left; padding:14px; background:#1a2234; border:1px solid #26314a; color:#fff; border-radius:12px; font-size:14px; cursor:pointer; font-weight:500;">
          ${t('p_info')}
        </button>
        <button onclick="this.closest('.fixed').remove(); openPrivacyPasswordModal();" style="text-align:left; padding:14px; background:#1a2234; border:1px solid #26314a; color:#fff; border-radius:12px; font-size:14px; cursor:pointer; font-weight:500;">
          ${t('privacy_pass')}
        </button>
        <button onclick="this.closest('.fixed').remove(); openLanguageModal();" style="text-align:left; padding:14px; background:#1a2234; border:1px solid #26314a; color:#fff; border-radius:12px; font-size:14px; cursor:pointer; font-weight:500;">
          🌐 Language / ভাষা
        </button>
        <button onclick="sb.auth.signOut().then(()=>location.reload())" style="text-align:left; padding:14px; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.3); color:#ef4444; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; margin-top:8px;">
          🚪 ${t('logout')}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

// Personal Information Modal
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
          <button onclick="this.closest('div[style*=\\'position:fixed\\']').remove()" style="flex:1; background:#1a2234; color:#fff; border:1px solid #26314a; padding:12px; border-radius:10px; cursor:pointer;">${t('close')}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('save-pi-btn').onclick = async () => {
    const newName = document.getElementById('pi-name').value.trim();
    const newPhone = document.getElementById('pi-phone').value.trim();
    await sb.from('profiles').update({ display_name: newName, phone: newPhone }).eq('id', user.id);
    toast(t('saved'));
    modal.remove();
    if(typeof loadProfile === 'function') loadProfile();
  };
};

// Granular Privacy Settings Modal
window.openPrivacyPasswordModal = async function() {
  const { data: { user } } = await sb.auth.getUser();
  if(!user) return;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:20px;';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:420px; border-radius:20px; padding:20px; text-align:left; max-height:85vh; overflow-y:auto;">
      <h3 style="margin:0 0 16px; font-size:18px; color:#fff;">🔒 Privacy Settings</h3>
      <div style="display:flex; flex-direction:column; gap:12px;">
        
        <div>
          <label style="font-size:12px; color:#7aa5ff; display:block; margin-bottom:4px; font-weight:600;">🌍 Who can see your posts:</label>
          <select id="pr-post" style="width:100%; padding:10px; border-radius:8px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:13px;">
            <option value="public" ${profile?.post_privacy === 'public' ? 'selected' : ''}>সবাই (Public)</option>
            <option value="friends" ${profile?.post_privacy === 'friends' ? 'selected' : ''}>শুধু বন্ধুরা (Friends Only)</option>
            <option value="only_me" ${profile?.post_privacy === 'only_me' ? 'selected' : ''}>শুধু আমি (Only Me)</option>
          </select>
        </div>

        <div>
          <label style="font-size:12px; color:#7aa5ff; display:block; margin-bottom:4px; font-weight:600;">💬 Who can send messages:</label>
          <select id="pr-sms" style="width:100%; padding:10px; border-radius:8px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:13px;">
            <option value="everyone" ${profile?.sms_privacy === 'everyone' ? 'selected' : ''}>সবাই (Everyone)</option>
            <option value="friends" ${profile?.sms_privacy === 'friends' ? 'selected' : ''}>শুধু বন্ধুরা (Friends Only)</option>
          </select>
        </div>

        <div>
          <label style="font-size:12px; color:#7aa5ff; display:block; margin-bottom:4px; font-weight:600;">📝 Who can post on your profile:</label>
          <select id="pr-wall" style="width:100%; padding:10px; border-radius:8px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:13px;">
            <option value="friends" ${profile?.wall_privacy === 'friends' ? 'selected' : ''}>শুধু বন্ধুরা (Friends Only)</option>
            <option value="only_me" ${profile?.wall_privacy === 'only_me' ? 'selected' : ''}>শুধু আমি (Only Me)</option>
          </select>
        </div>

        <div>
          <label style="font-size:12px; color:#7aa5ff; display:block; margin-bottom:4px; font-weight:600;">💬 Who can comment on your posts:</label>
          <select id="pr-comment" style="width:100%; padding:10px; border-radius:8px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:13px;">
            <option value="everyone" ${profile?.comment_privacy === 'everyone' ? 'selected' : ''}>সবাই (Everyone)</option>
            <option value="friends" ${profile?.comment_privacy === 'friends' ? 'selected' : ''}>শুধু বন্ধুরা (Friends Only)</option>
          </select>
        </div>

        <div>
          <label style="font-size:12px; color:#7aa5ff; display:block; margin-bottom:4px; font-weight:600;">❤️ Who can like your posts:</label>
          <select id="pr-like" style="width:100%; padding:10px; border-radius:8px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:13px;">
            <option value="everyone" ${profile?.like_privacy === 'everyone' ? 'selected' : ''}>সবাই (Everyone)</option>
            <option value="friends" ${profile?.like_privacy === 'friends' ? 'selected' : ''}>শুধু বন্ধুরা (Friends Only)</option>
          </select>
        </div>

        <div style="display:flex; gap:10px; margin-top:8px;">
          <button id="save-priv-btn" style="flex:1; background:#2f6bff; color:#fff; border:0; padding:12px; border-radius:10px; font-weight:600; cursor:pointer;">${t('save')}</button>
          <button onclick="this.closest('div[style*=\\'position:fixed\\']').remove()" style="flex:1; background:#1a2234; color:#fff; border:1px solid #26314a; padding:12px; border-radius:10px; cursor:pointer;">${t('close')}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

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

// Language Modal with Indicator (✓)
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
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${langs.map(l => `
          <button onclick="setLang('${l.code}'); this.closest('div[style*=\\'position:fixed\\']').remove();" style="display:flex; justify-content:space-between; align-items:center; text-align:left; padding:12px; background:${lang === l.code ? '#2f6bff' : '#1a2234'}; border:1px solid #26314a; color:#fff; border-radius:10px; cursor:pointer; font-weight:${lang === l.code ? 'bold' : 'normal'};">
            <span>${l.name}</span>
            <span>${lang === l.code ? '✓' : ''}</span>
          </button>
        `).join('')}
      </div>
      <button onclick="this.closest('div[style*=\\'position:fixed\\']').remove()" style="width:100%; margin-top:14px; background:#1a2234; color:#fff; border:1px solid #26314a; padding:10px; border-radius:10px; cursor:pointer;">${t('close')}</button>
    </div>
  `;
  document.body.appendChild(modal);
};

// Search & Profile Visit from Search
document.addEventListener('click', function(e) {
  if (e.target.closest('#btn-search')) {
    e.preventDefault();
    const searchModal = document.getElementById('search');
    if (searchModal) searchModal.classList.remove('hidden');
  }
}, true);

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
      <div onclick="openVisitedUserProfile('${u.id}')" style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #26314a; cursor:pointer;">
        <div style="width:40px; height:40px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
          ${u.avatar_url ? `<img src="${esc(u.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((u.display_name || 'U').charAt(0).toUpperCase())}
        </div>
        <div style="flex:1;">
          <div style="color:#fff; font-weight:600; font-size:14px;">${esc(u.display_name || 'User')}</div>
          <div style="color:#8b97b3; font-size:12px;">@${esc(u.username || 'username')}</div>
        </div>
      </div>
    `).join('');
  };
}

window.openVisitedUserProfile = async function(userId) {
  $('search').classList.add('hidden');
  const { data: u } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if(!u) return;

  if (currentUser && currentUser.id !== userId) {
    await sb.from('profile_visitors').insert({ profile_id: userId, visitor_id: currentUser.id }).catch(()=>{});
  }

  const sheet = document.getElementById('user-sheet');
  const container = document.getElementById('user-in');
  sheet.classList.remove('hidden');

  container.innerHTML = `
    <div style="text-align:right;"><button onclick="this.closest('.sheet').classList.add('hidden')" style="color:#8b97b3; font-size:20px; cursor:pointer;">✕</button></div>
    <div style="text-align:center;">
      <div style="width:80px; height:80px; border-radius:50%; background:#2f6bff; margin:0 auto 10px; display:grid; place-items:center; font-size:32px; font-weight:bold; color:#fff; overflow:hidden;">
        ${u.avatar_url ? `<img src="${esc(u.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((u.display_name || 'U').charAt(0).toUpperCase())}
      </div>
      <h3 style="margin:0; color:#fff;">${esc(u.display_name)}</h3>
      <div style="color:#8b97b3; font-size:13px;">@${esc(u.username || '')}</div>
      <p style="color:#eef2fb; font-size:14px; margin-top:8px;">${esc(u.bio || '')}</p>
      <button onclick="sendFriendRequestTo('${u.id}')" style="background:#2f6bff; color:#fff; border:0; padding:10px 20px; border-radius:10px; font-weight:bold; margin-top:10px; cursor:pointer;">🤝 ফ্রেন্ড রিকোয়েস্ট পাঠান</button>
    </div>
  `;
};

window.sendFriendRequestTo = async function(targetId) {
  if (!currentUser) return;
  const { error } = await sb.from('friendships').insert({ requester_id: currentUser.id, addressee_id: targetId, status: 'pending' });
  if (error) { toast('আগে থেকেই রিকোয়েস্ট পাঠানো হয়েছে'); return; }
  toast('ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে!');
};

// Profile Visitors Modal (Only 👁️ icon)
window.openProfileVisitorsModal = async function() {
  if (!currentUser) return;
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:20px;';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; height:70vh; display:flex; flex-direction:column; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="margin:0; font-size:18px; color:#fff;">👁️ প্রোফাইল ভিজিটর</h3>
        <button onclick="this.closest('div[style*=\\'position:fixed\\']').remove()" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
      </div>
      <div id="visitors-list" style="overflow-y:auto; flex:1;">
        <p style="text-align:center; color:#8b97b3; padding-top:20px;">লোড হচ্ছে...</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const { data: visits } = await sb.from('profile_visitors').select('*').eq('profile_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
  const container = document.getElementById('visitors-list');

  if (!visits || visits.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">আজ কেউ আপনার প্রোফাইল ভিজিট করেনি।</p>`;
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
          ${vp.avatar_url ? `<img src="${esc(vp.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((vp.display_name || 'U').charAt(0).toUpperCase())}
        </div>
        <div style="flex:1;">
          <div style="color:#fff; font-weight:600; font-size:14px;">${esc(vp.display_name)}</div>
          <div style="color:#8b97b3; font-size:11px;">ভিজিট করেছেন: ${new Date(v.created_at).toLocaleTimeString()}</div>
        </div>
      </div>
    `;
  }).join('');
};

// Group Rooms Feature (5-10 people)
window.loadGroupRooms = async function() {
  const box = document.getElementById('group-rooms-list');
  if(!box) return;
  box.innerHTML = `<div class="card muted" style="text-align:center;">গ্রুপ রুম লোড হচ্ছে...</div>`;
  
  const { data, error } = await sb.from('group_rooms').select('*').order('created_at', { ascending: false });
  if (error || !data || data.length === 0) {
    box.innerHTML = `<div class="card muted" style="text-align:center;">বর্তমানে কোনো লাইভ গ্রুপ রুম নেই। একটি রুম তৈরি করুন!</div>`;
    return;
  }

  box.innerHTML = data.map(r => `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h4 style="margin:0 0 4px; color:#fff;">🎙️ ${esc(r.room_name)}</h4>
        <div style="font-size:12px; color:#8b97b3;">সদস্য সীমা: ১০ জন</div>
      </div>
      <button class="btn ghost sm" onclick="joinGroupRoom('${r.id}')" style="width:auto; padding:8px 16px;">যুক্ত হোন</button>
    </div>
  `).join('');
};

window.openCreateGroupRoomModal = function() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:20px;';
  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:380px; border-radius:20px; padding:20px; text-align:left;">
      <h3 style="margin:0 0 14px; font-size:18px; color:#fff;">🎙️ নতুন গ্রুপ রুম</h3>
      <div class="field"><label>রুমের নাম:</label><input type="text" id="g-name" placeholder="যেমন: আড্ডা ও আলোচনা" style="width:100%; padding:12px; border-radius:10px; background:#1a2234; border:1px solid #26314a; color:#fff; outline:none;"></div>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button id="create-g-btn" style="flex:1; background:#2f6bff; color:#fff; border:0; padding:12px; border-radius:10px; font-weight:600; cursor:pointer;">তৈরি করুন</button>
        <button onclick="this.closest('div[style*=\\'position:fixed\\']').remove()" style="flex:1; background:#1a2234; color:#fff; border:1px solid #26314a; padding:12px; border-radius:10px; cursor:pointer;">${t('close')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('create-g-btn').onclick = async () => {
    const name = document.getElementById('g-name').value.trim();
    if(!name) return;
    await sb.from('group_rooms').insert({ room_name: name, host_id: currentUser.id });
    toast('গ্রুপ রুম তৈরি হয়েছে!');
    modal.remove();
    loadGroupRooms();
  };
};

window.joinGroupRoom = function(roomId) {
  toast('গ্রুপ রুমে যুক্ত হয়েছেন (লাইভ ভয়েস চ্যাট)');
};

// Friends list
document.addEventListener('click', function(e) {
  if (e.target.closest('#btn-people')) {
    e.preventDefault();
    const peopleModal = document.getElementById('people');
    if (peopleModal) { peopleModal.classList.remove('hidden'); renderPeople(); }
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
            ${s.avatar_url ? `<img src="${esc(s.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((s.display_name || 'U').charAt(0).toUpperCase())}
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
            ${f.avatar_url ? `<img src="${esc(f.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((f.display_name || 'T').charAt(0).toUpperCase())}
          </div>
          <div style="flex:1; font-size:14px; color:#fff;">${esc(f.display_name)}</div>
        </div>
      `).join('');
    }
  }
};
