// Talkia Batch 4: Messenger, Group Chat & Notifications
console.log("Talkia Batch 4 loaded successfully");

// ১. নোটিফিকেশন বেল আইকন ক্লিক হ্যান্ডলার ও লিস্ট রেন্ডার
window.openNotificationsList = async function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.8)';
  modal.style.zIndex = '999';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.padding = '16px';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:16px; padding:20px; max-height:80vh; display:flex; flex-direction:column;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="margin:0; font-size:18px; color:#fff;">🔔 নোটিফিকেশন</h3>
        <button onclick="this.closest('.fixed').remove()" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
      </div>
      <div id="notif-list-container" style="overflow-y:auto; flex:1;">
        <p style="text-align:center; color:#8b97b3; padding:16px 0;">লোড হচ্ছে...</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data, error } = await sb
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const container = document.getElementById('notif-list-container');
    if (error || !data || data.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:#8b97b3; padding:16px 0;">কোনো নোটিফিকেশন নেই</p>`;
      return;
    }

    container.innerHTML = data.map(n => {
      let text = 'আপনার পোস্টে কার্যক্রম হয়েছে';
      if (n.type === 'like') text = 'আপনার পোস্টে লাইক পড়েছে ❤️';
      else if (n.type === 'comment') text = 'আপনার পোস্টে একটি কমেন্ট করেছে 💬';
      else if (n.type === 'friend_request') text = 'আপনাকে বন্ধু হওয়ার অনুরোধ পাঠানো হয়েছে 🤝';
      
      const time = new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div style="background:#1a2234; padding:12px; border-radius:12px; border:1px solid #26314a; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <p style="margin:0; text-align:start; font-size:14px; color:#fff;">${text}</p>
            <span style="font-size:12px; color:#8b97b3;">${time}</span>
          </div>
          ${!n.read_at ? '<span style="width:8px; height:8px; background:#2f6bff; border-radius:50%; display:inline-block;"></span>' : ''}
        </div>
      `;
    }).join('');

    await sb.from('notifications').update({ read_at: new Date() }).eq('user_id', user.id).is('read_at', null);
  } catch (err) {
    console.error('Error loading notifications:', err);
  }
};

// ২. ইনবক্স / চ্যাট উইন্ডো খোলার হ্যান্ডলার (Messenger & Group Chat)
window.openCreateGroupModal = function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.8)';
  modal.style.zIndex = '999';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.padding = '16px';

  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:16px; padding:20px; max-height:80vh; display:flex; flex-direction:column; text-align:center;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="margin:0; font-size:18px; color:#fff;">💬 ইনবক্স ও চ্যাট</h3>
        <button onclick="this.closest('.fixed').remove()" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
      </div>
      <div style="padding:30px 10px; color:#8b97b3;">
        <p style="font-size:38px; margin:0 0 10px;">📨</p>
        <p style="margin:0; font-size:15px; color:#eef2fb;">আপনার মেসেজ ও গ্রুপ চ্যাট লিস্ট শীঘ্রই এখানে দেখা যাবে।</p>
      </div>
      <button onclick="this.closest('.fixed').remove()" style="margin-top:10px; padding:12px; background:#2f6bff; color:#fff; border-radius:10px; font-weight:600; border:0; cursor:pointer;">বন্ধ করুন</button>
    </div>
  `;
  document.body.appendChild(modal);
};

// ৩. গ্লোবাল ক্লিক ইন্টারসেপ্টর (ক্যাশ করা পুরনো ইনবক্স বা বেল বাটন ক্লিক ওভাররাইড করতে)
document.addEventListener('click', function(e) {
  const inboxBtn = e.target.closest('#btn-inbox');
  if (inboxBtn) {
    e.stopImmediatePropagation();
    e.preventDefault();
    window.openCreateGroupModal();
    return;
  }

  const bellBtn = e.target.closest('#btn-bell');
  if (bellBtn) {
    e.stopImmediatePropagation();
    e.preventDefault();
    window.openNotificationsList();
    return;
  }
}, true);
