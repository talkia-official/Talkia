// Group rooms list + create + join logic
window.openCreateGroupRoomModal = function() {
  let modal = document.createElement('div');
  modal.id = 'group-modal';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1150; display:flex; align-items:center; justify-content:center;';
  modal.innerHTML = `
    <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="margin:0; color:#fff; font-size:18px;">🎙️ ${t('g_modal_title')}</h3>
        <button id="grp-close-x" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;" type="button">✕</button>
      </div>
      <div class="field" style="margin-bottom:12px;">
        <label style="color:#8b97b3; font-size:13px; display:block; margin-bottom:4px;">${t('g_room_name_lbl')}</label>
        <input type="text" id="group-room-name" placeholder="${t('g_placeholder')}" style="width:100%; padding:12px; background:#1a2234; border:1px solid #26314a; border-radius:12px; color:#fff; outline:none;">
      </div>
      <button class="btn" id="group-room-submit" style="width:100%;" type="button">${t('g_create')}</button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('grp-close-x').onclick = () => modal.remove();
  
  document.getElementById('group-room-submit').onclick = async () => {
    const name = document.getElementById('group-room-name').value.trim();
    if (!name) { toast('Enter room name'); return; }
    try {
      const { data, error } = await sb.from('group_rooms').insert({ 
        name, 
        creator_id: currentUser.id, 
        post_approval: false,
        cover_url: ''
      }).select().single();
      if (error) throw error;
      
      await sb.from('group_members').insert({ group_id: Number(data.id), user_id: currentUser.id });

      toast(t('g_success'));
      modal.remove();
      if (typeof loadGroupRooms === 'function') loadGroupRooms();
    } catch (err) {
      toast('Error creating room: ' + err.message);
    }
  };
};

window.joinGroupRoom = async function(roomId, roomName) {
  if (!currentUser) return toast(t('login'));
  try {
    const { error } = await sb.from('group_members').insert({ group_id: Number(roomId), user_id: currentUser.id });
    if (error && error.code !== '23505') throw error;
    toast('Room joined!');
    openActiveGroupRoom(roomId, roomName);
  } catch (err) {
    toast('Error joining room: ' + err.message);
  }
};

// Active Group Room with Robust Event Binding
window.openActiveGroupRoom = async function(roomId, roomName) {
  let existingRoom = document.getElementById('active-room-modal');
  if (existingRoom) existingRoom.remove();

  let roomData = {};
  try {
    const { data } = await sb.from('group_rooms').select('*').eq('id', Number(roomId)).single();
    if (data) roomData = data;
  } catch (e) {}

  const currentRoomName = roomData.name || roomName;
  const coverBg = roomData.cover_url 
    ? `url('${roomData.cover_url}') center/cover no-repeat` 
    : 'linear-gradient(135deg, #2b3a55, #121826)';

  let roomModal = document.createElement('div');
  roomModal.id = 'active-room-modal';
  roomModal.style.cssText = 'position:fixed; inset:0; background:#0a0d14; z-index:1200; display:flex; flex-direction:column; overflow-y:auto;';
  
  roomModal.innerHTML = `
    <div id="room-cover-div" style="position:relative; width:100%; height:160px; background:${coverBg};">
      <button id="room-back-btn" style="position:absolute; top:12px; left:12px; background:rgba(0,0,0,0.6); color:#fff; border:0; width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:18px; z-index:10;" type="button">←</button>
      
      <label for="cover-upload-input" style="position:absolute; bottom:12px; right:12px; background:rgba(0,0,0,0.7); color:#fff; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; z-index:10;">
        📷 Change Cover
      </label>
      <input type="file" id="cover-upload-input" accept="image/*" style="display:none;">
    </div>

    <div style="padding:16px; background:#121826; border-bottom:1px solid #26314a;">
      <h2 id="room-title-heading" style="margin:0 0 6px 0; color:#fff; font-size:22px;">${esc(currentRoomName)}</h2>
      <div style="color:#8b97b3; font-size:13px; margin-bottom:14px;">Public group · Active member</div>
      
      <div style="display:flex; gap:10px;">
        <button class="btn" id="btn-manage-group" style="flex:1; background:#26314a; color:#fff; border:0; padding:10px; border-radius:10px; font-weight:600; cursor:pointer;" type="button">⚙️ Manage</button>
        <button class="btn" id="btn-invite-group" style="flex:1; background:var(--accent, #1877f2); color:#fff; border:0; padding:10px; border-radius:10px; font-weight:600; cursor:pointer;" type="button">➕ Invite</button>
      </div>
    </div>

    <div style="display:flex; gap:8px; padding:10px 16px; background:#121826; overflow-x:auto; border-bottom:1px solid #26314a; white-space:nowrap;">
      <button class="g-tab active-tab" data-tab="featured" style="background:#26314a; color:#fff; border:0; padding:8px 16px; border-radius:20px; font-weight:600; cursor:pointer;" type="button">Featured & Posts</button>
      <button class="g-tab" data-tab="photos" style="background:transparent; color:#8b97b3; border:0; padding:8px 16px; border-radius:20px; font-weight:600; cursor:pointer;" type="button">Photos</button>
      <button class="g-tab" data-tab="events" style="background:transparent; color:#8b97b3; border:0; padding:8px 16px; border-radius:20px; font-weight:600; cursor:pointer;" type="button">Events</button>
      <button class="g-tab" data-tab="files" style="background:transparent; color:#8b97b3; border:0; padding:8px 16px; border-radius:20px; font-weight:600; cursor:pointer;" type="button">Files</button>
      <button class="g-tab" data-tab="reels" style="background:transparent; color:#8b97b3; border:0; padding:8px 16px; border-radius:20px; font-weight:600; cursor:pointer;" type="button">Reels / Voice</button>
    </div>

    <div id="room-tab-content" style="flex:1; padding:16px; text-align:center; color:#8b97b3;"></div>
  `;
  
  document.body.appendChild(roomModal);

  // Back button
  document.getElementById('room-back-btn').onclick = () => {
    roomModal.remove();
    if (typeof loadGroupRooms === 'function') loadGroupRooms();
  };

  // Cover photo change
  document.getElementById('cover-upload-input').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    toast('Uploading cover...');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target.result;
      await sb.from('group_rooms').update({ cover_url: base64Url }).eq('id', Number(roomId));
      document.getElementById('room-cover-div').style.background = `url('${base64Url}') center/cover no-repeat`;
      toast('Cover updated!');
    };
    reader.readAsDataURL(file);
  };

  let selectedPhotoBase64 = null;
  let recordedAudioBase64 = null;

  function loadFeaturedTab() {
    const contentArea = document.getElementById('room-tab-content');
    contentArea.innerHTML = `
      <div style="max-width:600px; margin:0 auto; text-align:left;">
        <div style="background:#121826; border:1px solid #26314a; border-radius:14px; padding:14px; margin-bottom:16px;">
          <textarea id="group-post-text" placeholder="Write something..." style="width:100%; background:#1a2234; border:1px solid #26314a; border-radius:10px; padding:12px; color:#fff; resize:none; height:70px; outline:none; font-size:14px;"></textarea>
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
            <div style="display:flex; gap:8px;">
              <button id="attach-photo-btn" style="background:#1a2234; color:#fff; border:1px solid #26314a; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:13px;" type="button">📷 Photo</button>
              <input type="file" id="post-photo-file" accept="image/*" style="display:none;">
              <button id="record-voice-btn" style="background:#1a2234; color:#e74c3c; border:1px solid #26314a; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:13px;" type="button">🎤 Voice</button>
            </div>
            <button id="submit-group-post" class="btn" style="padding:6px 18px; font-size:14px;" type="button">Post</button>
          </div>
          <div id="post-attachment-status" style="margin-top:8px; font-size:12px; color:#10b981;"></div>
        </div>
        <div id="group-posts-feed"><div style="text-align:center; padding:20px;">Loading posts...</div></div>
      </div>
    `;

    fetchGroupPosts(roomId);

    document.getElementById('attach-photo-btn').onclick = () => document.getElementById('post-photo-file').click();
    document.getElementById('post-photo-file').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        selectedPhotoBase64 = ev.target.result;
        document.getElementById('post-attachment-status').innerText = `📷 Photo attached`;
      };
      reader.readAsDataURL(file);
    };

    // Voice Record Modal Trigger
    document.getElementById('record-voice-btn').onclick = () => {
      let vModal = document.createElement('div');
      vModal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1400; display:flex; align-items:center; justify-content:center; padding:20px;';
      vModal.innerHTML = `
        <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:320px; border-radius:20px; padding:20px; color:#fff; text-align:center;">
          <h3 style="margin-top:0;">Record Voice</h3>
          <button id="start-rec" class="btn" style="background:#e74c3c; width:100%; margin-bottom:10px;" type="button">Start Recording</button>
          <button id="stop-rec" class="btn" style="background:#10b981; width:100%; display:none;" type="button">Done & Attach</button>
          <button id="cancel-rec" style="background:none; border:0; color:#8b97b3; margin-top:10px; cursor:pointer;" type="button">Cancel</button>
        </div>
      `;
      document.body.appendChild(vModal);

      let mediaRec, chunks = [];
      document.getElementById('start-rec').onclick = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRec = new MediaRecorder(stream);
        chunks = [];
        mediaRec.ondataavailable = e => chunks.push(e.data);
        mediaRec.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            recordedAudioBase64 = reader.result;
            document.getElementById('post-attachment-status').innerText = `🎤 Voice attached`;
            vModal.remove();
            toast('Voice attached!');
          };
          reader.readAsDataURL(blob);
        };
        mediaRec.start();
        document.getElementById('start-rec').style.display = 'none';
        document.getElementById('stop-rec').style.display = 'block';
      };

      document.getElementById('stop-rec').onclick = () => mediaRec && mediaRec.stop();
      document.getElementById('cancel-rec').onclick = () => vModal.remove();
    };

    // Submit Post
    document.getElementById('submit-group-post').onclick = async () => {
      const text = document.getElementById('group-post-text').value.trim();
      if (!text && !selectedPhotoBase64 && !recordedAudioBase64) {
        toast('Please write or attach something!');
        return;
      }
      try {
        toast('Posting...');
        const { error } = await sb.from('group_posts').insert({
          group_id: Number(roomId),
          user_id: currentUser.id,
          content: text || '',
          media_url: selectedPhotoBase64 || '',
          audio_url: recordedAudioBase64 || '',
          status: 'published',
          created_at: new Date()
        });
        if (error) throw error;

        document.getElementById('group-post-text').value = '';
        selectedPhotoBase64 = null;
        recordedAudioBase64 = null;
        document.getElementById('post-attachment-status').innerText = '';
        toast('Posted successfully!');
        fetchGroupPosts(roomId);
      } catch (err) {
        toast('Post error: ' + err.message);
      }
    };
  }

  async function fetchGroupPosts(gId) {
    const feed = document.getElementById('group-posts-feed');
    if (!feed) return;
    try {
      const { data: posts, error } = await sb.from('group_posts').select('*').eq('group_id', Number(gId)).order('created_at', { ascending: false });
      if (error) throw error;
      if (!posts || posts.length === 0) {
        feed.innerHTML = `<div style="padding:20px; color:#8b97b3;">No posts yet.</div>`;
        return;
      }
      feed.innerHTML = posts.map(p => `
        <div style="background:#121826; border:1px solid #26314a; border-radius:12px; padding:14px; margin-bottom:12px; text-align:left;">
          <p style="margin:0 0 10px 0; color:#fff;">${esc(p.content || '')}</p>
          ${p.media_url ? `<img src="${p.media_url}" style="width:100%; max-height:250px; object-fit:cover; border-radius:8px; margin-bottom:8px;">` : ''}
          ${p.audio_url ? `<audio controls src="${p.audio_url}" style="width:100%;"></audio>` : ''}
        </div>
      `).join('');
    } catch (err) {
      feed.innerHTML = `<div style="color:#e74c3c;">Error loading posts: ${err.message}</div>`;
    }
  }

  loadFeaturedTab();

  // Manage Button Direct Click Handler
  document.getElementById('btn-manage-group').onclick = () => {
    let mModal = document.createElement('div');
    mModal.style.cssText = 'position:fixed; inset:0; background:#0a0d14; z-index:1300; display:flex; flex-direction:column; padding:20px; color:#fff;';
    mModal.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3 style="margin:0;">⚙️ Manage Group</h3>
        <button id="close-m" style="background:none; border:0; color:#fff; font-size:20px; cursor:pointer;" type="button">✕</button>
      </div>
      <div style="background:#121826; padding:15px; border-radius:12px; border:1px solid #26314a; margin-bottom:10px;">Group Settings Active</div>
      <button id="leave-grp" style="background:#e74c3c; color:#fff; border:0; padding:12px; border-radius:8px; cursor:pointer;" type="button">Leave Group</button>
    `;
    document.body.appendChild(mModal);
    document.getElementById('close-m').onclick = () => mModal.remove();
    document.getElementById('leave-grp').onclick = async () => {
      if (!confirm('Leave group?')) return;
      await sb.from('group_members').delete().eq('group_id', Number(roomId)).eq('user_id', currentUser.id);
      mModal.remove();
      roomModal.remove();
      if (typeof loadGroupRooms === 'function') loadGroupRooms();
    };
  };
};

window.loadGroupRooms = async function() {
  const list = document.getElementById('group-rooms-list');
  if (!list) return;
  list.innerHTML = `<div class="empty">Loading...</div>`;
  
  const { data: rooms, error } = await sb.from('group_rooms').select('*').order('created_at', { ascending: false });
  if (error || !rooms || rooms.length === 0) {
    list.innerHTML = `<div class="empty">No rooms found.</div>`;
    return;
  }

  let joinedSet = new Set();
  if (currentUser) {
    const { data: members } = await sb.from('group_members').select('group_id').eq('user_id', currentUser.id);
    if (members) members.forEach(m => joinedSet.add(m.group_id));
  }

  list.innerHTML = rooms.map(room => {
    const isJoined = joinedSet.has(room.id);
    const btnText = isJoined ? 'Enter' : 'Join';
    const action = isJoined ? `openActiveGroupRoom('${room.id}', '${esc(room.name)}')` : `joinGroupRoom('${room.id}', '${esc(room.name)}')`;
    return `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:14px; margin-bottom:10px;">
        <div><b>${esc(room.name)}</b></div>
        <button class="btn" style="width:auto; padding:6px 14px;" onclick="${action}" type="button">${btnText}</button>
      </div>
    `;
  }).join('');
};
