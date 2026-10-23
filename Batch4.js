// Talkia Batch 4: Messenger, Group Chat & Notifications
console.log("Talkia Batch 4 loaded successfully");

// ১. নোটিফিকেশন বেল আইকন ক্লিক হ্যান্ডলার ও লিস্ট রেন্ডার
window.openNotificationsList = async function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-5 max-h-[80vh] flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-white">🔔 নোটিফিকেশন</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      <div id="notif-list-container" class="space-y-3 overflow-y-auto flex-1">
        <p class="text-center text-gray-400 py-4">লোড হচ্ছে...</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const container = document.getElementById('notif-list-container');
    if (error || !data || data.length === 0) {
      container.innerHTML = `<p class="text-center text-gray-500 py-4">কোনো নোটিফিকেশন নেই</p>`;
      return;
    }

    container.innerHTML = data.map(n => {
      let text = 'আপনার পোস্টে কার্যক্রম হয়েছে';
      if (n.type === 'like') text = 'আপনার পোস্টে লাইক পড়েছে ❤️';
      else if (n.type === 'comment') text = 'আপনার পোস্টে একটি কমেন্ট করেছে 💬';
      else if (n.type === 'friend_request') text = 'আপনাকে বন্ধু হওয়ার অনুরোধ পাঠানো হয়েছে 🤝';
      
      const time = new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="bg-gray-800/60 p-3 rounded-xl border border-gray-700/50 flex justify-between items-center">
          <div>
            <p class="text-sm text-white">${text}</p>
            <span class="text-xs text-gray-400">${time}</span>
          </div>
          ${!n.read_at ? '<span class="w-2 h-2 bg-blue-500 rounded-full"></span>' : ''}
        </div>
      `;
    }).join('');

    // Mark as read
    await supabase.from('notifications').update({ read_at: new Date() }).eq('user_id', user.id).is('read_at', null);
  } catch (err) {
    console.error('Error loading notifications:', err);
  }
};

// ২. গ্রুপ চ্যাট তৈরির পপআপ ও লজিক
window.openCreateGroupModal = function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-white">👥 নতুন গ্রুপ চ্যাট তৈরি করুন</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">গ্রুপের নাম</label>
          <input type="text" id="group-name-input" placeholder="যেমন: আড্ডা জোন" class="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500">
        </div>
        <button onclick="createChatGroup()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition">গ্রুপ তৈরি করুন</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.createChatGroup = async function() {
  const nameInput = document.getElementById('group-name-input');
  const name = nameInput.value.trim();
  if (!name) {
    alert('দয়া করে গ্রুপের নাম দিন');
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create group
    const { data: groupData, error: groupErr } = await supabase
      .from('chat_groups')
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (groupErr) throw groupErr;

    // Add creator as member
    await supabase.from('group_members').insert({
      group_id: groupData.id,
      user_id: user.id
    });

    alert('গ্রুপ সফলভাবে তৈরি হয়েছে!');
    document.querySelector('.fixed.inset-0').remove();
    if (typeof loadInbox === 'function') loadInbox();
  } catch (err) {
    console.error('Error creating group:', err);
    alert('গ্রুপ তৈরি করতে সমস্যা হয়েছে: ' + err.message);
  }
};
