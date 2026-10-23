// Talkia Advanced Suite Batch 4: Complete Architecture Upgrade (Final Fixed)
console.log("Talkia Advanced Suite Batch 4 Loaded");

// ১. সেটিংস ড্যাশবোর্ড
document.addEventListener('click', function(e) {
  if (e.target.closest('#btn-settings')) {
    e.preventDefault();
    openSettingsDashboard();
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
          🌐 Language (ভাষা পরিবর্তন)
        </button>
        <button onclick="sb.auth.signOut().then(()=>location.reload())" style="text-align:left; padding:14px; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.3); color:#ef4444; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; margin-top:8px;">
          🚪 ${t('logout')}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

// ২. Personal Information
window.openPersonalDetailsModal = async function() {
  const { data: { user } } = await sb.auth.getUser();
  if(!user) return;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';

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
          <button onclick="this.closest('.fixed').remove()" style="flex:1; background:#1a2234; color:#fff; border:1px solid #26314a; padding:12px; border-radius:10px; cursor:pointer;">${t('close')}</button>
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

// ৩. Privacy & Password
window.openPrivacyPasswordModal = function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left;">
      <h3 style="margin:0 0 16px; font-size:18px; color:#fff;">🔒 Privacy & Password</h3>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <h4 style="margin:0; font-size:14px; color:#7aa5ff;">🔑 পাসওয়ার্ড পরিবর্তন</h4>
        <div>
          <label style="font-size:12px; color:#8b97b3; display:block; margin-bottom:4px;">নতুন পাসওয়ার্ড:</label>
          <input type="password" id="pass-new" placeholder="কমপক্ষে ৬ অক্ষর" style="width:100%; padding:12px; border-radius:10px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:14px; outline:none;">
        </div>
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button id="save-priv-btn" style="flex:1; background:#2f6bff; color:#fff; border:0; padding:12px; border-radius:10px; font-weight:600; cursor:pointer;">${t('save')}</button>
          <button onclick="this.closest('.fixed').remove()" style="flex:1; background:#1a2234; color:#fff; border:1px solid #26314a; padding:12px; border-radius:10px; cursor:pointer;">${t('close')}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('save-priv-btn').onclick = async () => {
    const newPass = document.getElementById('pass-new').value;
    if (newPass) {
      if (newPass.length < 6) { alert('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে'); return; }
      const { error } = await sb.auth.updateUser({ password: newPass });
      if (error) { alert('পাসওয়ার্ড আপডেট করা যায়নি: ' + error.message); return; }
    }
    toast(t('saved'));
    modal.remove();
  };
};

// ৪. Language Modal
window.openLanguageModal = function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:360px; border-radius:20px; padding:20px; text-align:left;">
      <h3 style="margin:0 0 16px; font-size:18px; color:#fff;">🌐 Select Language / ভাষা</h3>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button onclick="setLang('bn'); this.closest('.fixed').remove();" style="text-align:left; padding:12px; background:#1a2234; border:1px solid #26314a; color:#fff; border-radius:10px; cursor:pointer;">🇧🇩 বাংলা (Bengali)</button>
        <button onclick="setLang('en'); this.closest('.fixed').remove();" style="text-align:left; padding:12px; background:#1a2234; border:1px solid #26314a; color:#fff; border-radius:10px; cursor:pointer;">🇺🇸 English</button>
        <button onclick="setLang('ar'); this.closest('.fixed').remove();" style="text-align:left; padding:12px; background:#1a2234; border:1px solid #26314a; color:#fff; border-radius:10px; cursor:pointer;">🇸🇦 العربية (Arabic)</button>
        <button onclick="setLang('hi'); this.closest('.fixed').remove();" style="text-align:left; padding:12px; background:#1a2234; border:1px solid #26314a; color:#fff; border-radius:10px; cursor:pointer;">🇮🇳 हिन्दी (Hindi)</button>
      </div>
      <button onclick="this.closest('.fixed').remove()" style="width:100%; margin-top:14px; background:#1a2234; color:#fff; border:1px solid #26314a; padding:10px; border-radius:10px; cursor:pointer;">${t('close')}</button>
    </div>
  `;
  document.body.appendChild(modal);
};

// ৫. সার্চ ইঞ্জিন লজিক
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
      <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #26314a;">
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

// ৬. মাই ফ্রেন্ডস (People Modal) লজিক
document.addEventListener('click', function(e) {
  if (e.target.closest('#btn-people')) {
    e.preventDefault();
    const peopleModal = document.getElementById('people');
    if (peopleModal) {
      peopleModal.classList.remove('hidden');
      renderPeople();
    }
  }
}, true);

const ppClose = document.getElementById('pp-close');
if (ppClose) {
  ppClose.onclick = () => document.getElementById('people').classList.add('hidden');
}

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
            ${f.avatar_url ? `<img src="${esc(f.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((f.display_name || 'U').charAt(0).toUpperCase())}
          </div>
          <div style="flex:1; font-size:14px; color:#fff;">${esc(f.display_name)}</div>
        </div>
      `).join('');
    }
  }
};

// ৭. সক্রিয় মেসেঞ্জার চ্যাট উইন্ডো (Fixed: Real Chat Modal instead of alert)
document.addEventListener('click', function(e) {
  if (e.target.closest('#btn-inbox')) {
    e.preventDefault();
    openActiveMessengerModal();
  }
  if (e.target.closest('#btn-bell')) {
    e.preventDefault();
    openDetailedNotificationsList();
  }
}, true);

window.openActiveMessengerModal = async function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:420px; border-radius:20px; padding:20px; height:80vh; display:flex; flex-direction:column; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="margin:0; font-size:18px; color:#fff;">💬 মেসেঞ্জার & ইনবক্স</h3>
        <button onclick="this.closest('.fixed').remove()" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
      </div>
      <div id="inbox-friends-list" style="overflow-y:auto; flex:1;">
        <p style="text-align:center; color:#8b97b3; padding-top:20px;">${t('loading')}</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const me = currentUser.id;
  const { data: friendships } = await sb.from('friendships').select('*').or(`requester_id.eq.${me},addressee_id.eq.${me}`).eq('status', 'accepted');
  const container = document.getElementById('inbox-friends-list');

  if (!friendships || friendships.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">${t('none_yet')}</p>`;
    return;
  }

  const friendIds = friendships.map(f => f.requester_id === me ? f.addressee_id : f.requester_id);
  const { data: friends } = await sb.from('profiles').select('*').in('id', friendIds);

  container.innerHTML = friends.map(f => `
    <div onclick="openRealChatBox('${f.id}', '${esc(f.display_name)}')" style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #26314a; cursor:pointer; border-radius:10px; background:#1a2234; margin-bottom:8px;">
      <div style="width:40px; height:40px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
        ${f.avatar_url ? `<img src="${esc(f.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((f.display_name || 'T').charAt(0).toUpperCase())}
      </div>
      <div style="flex:1;">
        <div style="color:#fff; font-weight:600; font-size:14px;">${esc(f.display_name || 'User')}</div>
        <div style="color:#8b97b3; font-size:12px;">চ্যাট করতে ক্লিক করুন</div>
      </div>
    </div>
  `).join('');
};

window.openRealChatBox = function(friendId, friendName) {
  const chatModal = document.createElement('div');
  chatModal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:1100; display:flex; flex-direction:column; padding:16px;';
  chatModal.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #26314a; padding-bottom:10px; margin-bottom:10px;">
      <h3 style="margin:0; font-size:16px; color:#fff;">💬 ${friendName}</h3>
      <button onclick="this.closest('div[style*=\\'position:fixed\\']').remove()" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
    </div>
    <div style="flex:1; overflow-y:auto; padding:10px; color:#8b97b3; text-align:center;">চ্যাট হিস্ট্রি লোড হচ্ছে...</div>
    <div style="display:flex; gap:8px; padding-top:10px;">
      <input type="text" placeholder="মেসেজ লিখুন..." style="flex:1; padding:12px; border-radius:10px; background:#1a2234; border:1px solid #26314a; color:#fff; outline:none;">
      <button style="background:#2f6bff; color:#fff; border:0; padding:0 16px; border-radius:10px; font-weight:bold; cursor:pointer;">পাঠান</button>
    </div>
  `;
  document.body.appendChild(chatModal);
};

// ৮. ডাইনামিক নোটিফিকেশন সিস্টেম (Fixed: No more static 'Ariful' dummy names)
window.openDetailedNotificationsList = async function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:420px; border-radius:20px; padding:20px; height:75vh; display:flex; flex-direction:column; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="margin:0; font-size:18px; color:#fff;">🔔 নোটিফিকেশন</h3>
        <button onclick="this.closest('.fixed').remove()" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
      </div>
      <div id="notif-list-box" style="overflow-y:auto; flex:1;">
        <p style="text-align:center; color:#8b97b3; padding-top:20px;">${t('loading')}</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const container = document.getElementById('notif-list-box');
  if (!currentUser) return;

  // ফেচ রিয়েল কমেন্টস ও লাইক নোটিফিকেশন ফ্রম ডেটাবেজ
  const { data: myPosts } = await sb.from('voice_posts').select('id').eq('user_id', currentUser.id);
  if (!myPosts || myPosts.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">${t('none_yet')}</p>`;
    return;
  }

  const postIds = myPosts.map(p => p.id);
  const { data: comments } = await sb.from('comment_feed').select('*').in('voice_post_id', postIds).order('created_at', { ascending: false }).limit(10);

  if (!comments || comments.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">${t('none_yet')}</p>`;
    return;
  }

  container.innerHTML = comments.map(c => `
    <div style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #26314a; background:#1a2234; border-radius:12px; margin-bottom:8px;">
      <div style="width:40px; height:40px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
        ${c.avatar_url ? `<img src="${esc(c.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((c.display_name || 'U').charAt(0).toUpperCase())}
      </div>
      <div style="flex:1;">
        <div style="color:#fff; font-size:13px;"><b style="color:#7aa5ff;">${esc(c.display_name || 'User')}</b> আপনার পোস্টে কমেন্ট করেছে 💬</div>
        <div style="color:#8b97b3; font-size:11px; margin-top:2px;">${new Date(c.created_at).toLocaleString()}</div>
      </div>
    </div>
  `).join('');
};
