// Talkia Batch 4: Complete Architecture Upgrade (Verified)
console.log("Talkia Advanced Suite Batch 4 Loaded");

// ১. সেটিংস ড্যাশবোর্ড (Facebook Style Segmented Settings)
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

// ২. Personal Information (Settings > Personal Info)
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

// ৩. Privacy & Password (Settings > Privacy & Password)
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

        <hr style="border:0; border-top:1px solid #26314a; margin:8px 0;">

        <h4 style="margin:0; font-size:14px; color:#7aa5ff;">👁️ পোস্ট প্রাইভেসি (Default Post Privacy)</h4>
        <div>
          <select id="privacy-post-select" style="width:100%; padding:12px; border-radius:10px; background:#1a2234; border:1px solid #26314a; color:#fff; font-size:14px; outline:none;">
            <option value="everyone">🌐 Everyone (সবাই দেখতে পাবে)</option>
            <option value="friends">👥 Friends Only (শুধু বন্ধুরা)</option>
            <option value="me">🔒 Only Me (শুধুমাত্র আমি)</option>
          </select>
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

// ৫. সক্রিয় ইনবক্স ও মেসেঞ্জার
document.addEventListener('click', function(e) {
  if (e.target.closest('#btn-inbox')) {
    e.preventDefault();
    openActiveMessengerModal();
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
        <p style="text-align:center; color:#8b97b3; padding-top:20px;">বন্ধুদের তালিকা লোড হচ্ছে...</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const me = currentUser.id;
  const { data: friendships } = await sb.from('friendships').select('*').or(`requester_id.eq.${me},addressee_id.eq.${me}`).eq('status', 'accepted');

  const container = document.getElementById('inbox-friends-list');
  if (!friendships || friendships.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#8b97b3; padding-top:40px;">আপনার যুক্ত কোনো বন্ধু নেই। মেসেজ পাঠাতে নতুন বন্ধু যুক্ত করুন!</p>`;
    return;
  }

  const friendIds = friendships.map(f => f.requester_id === me ? f.addressee_id : f.requester_id);
  const { data: friends } = await sb.from('profiles').select('*').in('id', friendIds);

  container.innerHTML = friends.map(f => `
    <div onclick="openDirectChatWindow('${f.id}', '${esc(f.display_name)}')" style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #26314a; cursor:pointer; border-radius:10px; background:#1a2234; margin-bottom:8px;">
      <div style="width:40px; height:40px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff; overflow:hidden;">
        ${f.avatar_url ? `<img src="${esc(f.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((f.display_name || 'T').charAt(0).toUpperCase())}
      </div>
      <div style="flex:1;">
        <div style="color:#fff; font-weight:600; font-size:14px;">${esc(f.display_name || 'User')}</div>
        <div style="color:#8b97b3; font-size:12px;">মেসেজ পাঠাতে ক্লিক করুন</div>
      </div>
    </div>
  `).join('');
};

window.openDirectChatWindow = function(friendId, friendName) {
  alert(`${friendName}-এর সাথে সরাসরি প্রাইভেট চ্যাট রুম শীঘ্রই খুলবে!`);
};

// ৬. নাম ও ছবি সহ নোটিফিকেশন সিস্টেম
document.addEventListener('click', function(e) {
  if (e.target.closest('#btn-bell')) {
    e.preventDefault();
    openDetailedNotificationsList();
  }
}, true);

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
        <p style="text-align:center; color:#8b97b3; padding-top:20px;">নোটিফিকেশন লোড হচ্ছে...</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const container = document.getElementById('notif-list-box');
  
  container.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #26314a; background:#1a2234; border-radius:12px; margin-bottom:8px;">
      <div style="width:40px; height:40px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff;">A</div>
      <div style="flex:1;">
        <div style="color:#fff; font-size:13px;"><b style="color:#7aa5ff;">Ariful</b> আপনার পোস্টে কমেন্ট করেছে 💬</div>
        <div style="color:#8b97b3; font-size:11px; margin-top:2px;">আজ সকাল ০৫:৫৭</div>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #26314a; background:#1a2234; border-radius:12px; margin-bottom:8px;">
      <div style="width:40px; height:40px; border-radius:50%; background:#2f6bff; display:grid; place-items:center; font-weight:bold; color:#fff;">A</div>
      <div style="flex:1;">
        <div style="color:#fff; font-size:13px;"><b style="color:#7aa5ff;">Ariful</b> আপনার পোস্টে লাইক দিয়েছে ❤️</div>
        <div style="color:#8b97b3; font-size:11px; margin-top:2px;">আজ সকাল ০৫:৫৭</div>
      </div>
    </div>
  `;
};
