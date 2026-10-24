// Group rooms list + create + join logic
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
      const { data, error } = await sb.from('group_rooms').insert({ name, creator_id: currentUser.id }).select().single();
      if (error) throw error;
      
      // Auto creator ke group_members e add korar jonno
      await sb.from('group_members').insert({ group_id: data.id, user_id: currentUser.id });

      toast(t('g_success'));
      modal.remove();
      if (typeof loadGroupRooms === 'function') loadGroupRooms();
    } catch (err) {
      toast('Error: ' + err.message);
    }
  };
};

window.joinGroupRoom = async function(roomId, roomName) {
  if (!currentUser) return toast(t('login'));
  try {
    const { error } = await sb.from('group_members').insert({ group_id: roomId, user_id: currentUser.id });
    if (error && error.code !== '23505') {
      throw error;
    }
    toast(t('room_joined'));
    
    // রুমের ভেতরে যাওয়ার জন্য এই ফাংশনটি কল করা হলো
    openActiveGroupRoom(roomId, roomName);
  } catch (err) {
    toast('Error: ' + err.message);
  }
};
function openActiveGroupRoom(roomId, roomName) {
  let existingRoom = document.getElementById('active-room-modal');
  if (existingRoom) existingRoom.remove();

  let roomModal = document.createElement('div');
  roomModal.id = 'active-room-modal';
  roomModal.style.cssText = 'position:fixed; inset:0; background:#0a0d14; z-index:1200; display:flex; flex-direction:column; padding:20px;';
  roomModal.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <h2 style="margin:0; color:#fff; font-size:20px;">🎙️ ${esc(roomName)}</h2>
      <button id="leave-room-btn" style="background:#e74c3c; color:#fff; border:0; padding:8px 16px; border-radius:10px; cursor:pointer; font-weight:600;">Leave Room</button>
    </div>
    <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
      <div style="font-size:60px; margin-bottom:20px;">🎧</div>
      <p style="color:#8b97b3; font-size:16px;">You are in the live voice room.</p>
      <p style="color:#fff; font-size:14px; margin-top:5px;">(Live audio & speaking features coming soon)</p>
    </div>
  `;
  document.body.appendChild(roomModal);

  document.getElementById('leave-room-btn').onclick = () => {
    roomModal.remove();
    if (typeof loadGroupRooms === 'function') loadGroupRooms();
  };
}

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
      <button class="btn" style="width:auto; padding:8px 16px; font-size:14px;" onclick="joinGroupRoom('${room.id}', '${esc(room.name)}')">${t('g_join')}</button>
    </div>
  `).join('');
};
