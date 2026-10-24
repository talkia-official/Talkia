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
      const { data, error } = await sb.from('group_rooms').insert({ 
        name, 
        creator_id: currentUser.id, 
        post_approval: false 
      }).select().single();
      if (error) throw error;
      
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
    openActiveGroupRoom(roomId, roomName);
  } catch (err) {
    toast('Error: ' + err.message);
  }
};

// Active Group Room with Voice Changer, Post Approval & Manage System
function openActiveGroupRoom(roomId, roomName) {
  let existingRoom = document.getElementById('active-room-modal');
  if (existingRoom) existingRoom.remove();

  let roomModal = document.createElement('div');
  roomModal.id = 'active-room-modal';
  roomModal.style.cssText = 'position:fixed; inset:0; background:#0a0d14; z-index:1200; display:flex; flex-direction:column; overflow-y:auto;';
  
  roomModal.innerHTML = `
    <!-- Header / Cover Section with Back Button -->
    <div style="position:relative; width:100%; height:160px; background:linear-gradient(135deg, #2b3a55, #121826);">
      <button id="room-back-btn" style="position:absolute; top:12px; left:12px; background:rgba(0,0,0,0.6); color:#fff; border:0; width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center;" title="Back">←</button>
    </div>

    <!-- Group Info Section -->
    <div style="padding:16px; background:#121826; border-bottom:1px solid #26314a;">
      <h2 id="room-title-heading" style="margin:0 0 6px 0; color:#fff; font-size:22px;">${esc(roomName)}</h2>
      <div style="color:#8b97b3; font-size:13px; margin-bottom:14px;">Public group · Active member</div>
      
      <div style="display:flex; gap:10px;">
        <button class="btn" id="btn-manage-group" style="flex:1; background:#26314a; color:#fff; border:0; padding:10px; border-radius:10px; font-weight:600; cursor:pointer;">⚙️ Manage</button>
        <button class="btn" id="btn-invite-group" style="flex:1; background:var(--accent, #1877f2); color:#fff; border:0; padding:10px; border-radius:10px; font-weight:600; cursor:pointer;">➕ Invite</button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div style="display:flex; gap:8px; padding:10px 16px; background:#121826; overflow-x:auto; border-bottom:1px solid #26314a; white-space:nowrap;" id="group-tabs-container">
      <button class="g-tab active-tab" data-tab="featured" style="background:#26314a; color:#fff; border:0; padding:8px 16px; border-radius:20px; font-weight:600; cursor:pointer;">Featured & Posts</button>
      <button class="g-tab" data-tab="photos" style="background:transparent; color:#8b97b3; border:0; padding:8px 16px; border-radius:20px; font-weight:600; cursor:pointer;">Photos</button>
      <button class="g-tab" data-tab="events" style="background:transparent; color:#8b97b3; border:0; padding:8px 16px; border-radius:20px; font-weight:600; cursor:pointer;">Events</button>
      <button class="g-tab" data-tab="files" style="background:transparent; color:#8b97b3; border:0; padding:8px 16px; border-radius:20px; font-weight:600; cursor:pointer;">Files</button>
      <button class="g-tab" data-tab="reels" style="background:transparent; color:#8b97b3; border:0; padding:8px 16px; border-radius:20px; font-weight:600; cursor:pointer;">Reels / Voice</button>
    </div>

    <!-- Room Body / Dynamic Tab Content Area -->
    <div id="room-tab-content" style="flex:1; padding:16px; text-align:center; color:#8b97b3;"></div>
  `;
  
  document.body.appendChild(roomModal);

  let recordedAudioBlob = null;
  let selectedVoiceEffect = 'normal';

  // Load Featured Tab Content (Post Creator + Group Feed)
  function loadFeaturedTab() {
    const contentArea = document.getElementById('room-tab-content');
    contentArea.innerHTML = `
      <div style="max-width:600px; margin:0 auto; text-align:left;">
        <!-- Write Post Box -->
        <div style="background:#121826; border:1px solid #26314a; border-radius:14px; padding:14px; margin-bottom:16px;">
          <textarea id="group-post-text" placeholder="Write something or share your thoughts..." style="width:100%; background:#1a2234; border:1px solid #26314a; border-radius:10px; padding:12px; color:#fff; resize:none; height:70px; outline:none; font-size:14px;"></textarea>
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
            <div style="display:flex; gap:8px;">
              <button id="attach-photo-btn" style="background:#1a2234; color:#fff; border:1px solid #26314a; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:13px;" onclick="toast('Photo attachment ready')">📷 Photo</button>
              <button id="record-voice-btn" style="background:#1a2234; color:#e74c3c; border:1px solid #26314a; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:13px;">🎤 Voice Post</button>
            </div>
            <button id="submit-group-post" class="btn" style="padding:6px 18px; font-size:14px;">Post</button>
          </div>
          <div id="voice-attachment-status" style="margin-top:8px; font-size:12px; color:#10b981;"></div>
        </div>

        <!-- Group Posts Feed Container -->
        <div id="group-posts-feed">
          <div style="text-align:center; padding:20px; color:#8b97b3;">Loading posts...</div>
        </div>
      </div>
    `;

    fetchGroupPosts(roomId);

    // Voice Post Button Action (Opens Voice Changer Modal)
    document.getElementById('record-voice-btn').onclick = () => {
      let voiceModal = document.createElement('div');
      voiceModal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1400; display:flex; align-items:center; justify-content:center; padding:20px;';
      voiceModal.innerHTML = `
        <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:360px; border-radius:20px; padding:20px; color:#fff; text-align:center;">
          <h3 style="margin-top:0; font-size:18px;">🎙️ Voice Changer & Recorder</h3>
          <p style="color:#8b97b3; font-size:13px; margin-bottom:15px;">Select voice effect before recording</p>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:15px;">
            <button class="v-effect-btn" data-effect="normal" style="background:#26314a; color:#fff; border:1px solid #3b82f6; padding:8px; border-radius:8px; cursor:pointer;">Normal</button>
            <button class="v-effect-btn" data-effect="robot" style="background:#1a2234; color:#8b97b3; border:1px solid #26314a; padding:8px; border-radius:8px; cursor:pointer;">Robot</button>
            <button class="v-effect-btn" data-effect="deep" style="background:#1a2234; color:#8b97b3; border:1px solid #26314a; padding:8px; border-radius:8px; cursor:pointer;">Deep Voice</button>
            <button class="v-effect-btn" data-effect="chipmunk" style="background:#1a2234; color:#8b97b3; border:1px solid #26314a; padding:8px; border-radius:8px; cursor:pointer;">Chipmunk</button>
          </div>

          <div style="margin-bottom:15px; font-weight:600; color:#10b981;" id="rec-status-text">Ready to record</div>

          <div style="display:flex; gap:10px;">
            <button id="start-rec-btn" class="btn" style="flex:1; background:#e74c3c;">Start Recording</button>
            <button id="done-rec-btn" class="btn" style="flex:1; background:#10b981; display:none;">Attach Voice</button>
          </div>
          <button id="close-v-modal" style="background:none; border:0; color:#8b97b3; margin-top:15px; cursor:pointer;">Cancel</button>
        </div>
      `;
      document.body.appendChild(voiceModal);

      let mediaRecorder;
      let audioChunks = [];

      voiceModal.querySelectorAll('.v-effect-btn').forEach(btn => {
        btn.onclick = (e) => {
          voiceModal.querySelectorAll('.v-effect-btn').forEach(b => {
            b.style.background = '#1a2234';
            b.style.color = '#8b97b3';
            b.style.borderColor = '#26314a';
          });
          e.target.style.background = '#26314a';
          e.target.style.color = '#fff';
          e.target.style.borderColor = '#3b82f6';
          selectedVoiceEffect = e.target.getAttribute('data-effect');
        };
      });

      document.getElementById('start-rec-btn').onclick = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];

          mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
          };

          mediaRecorder.onstop = () => {
            recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            document.getElementById('voice-attachment-status').innerText = `🎤 Voice attached (${selectedVoiceEffect} effect)`;
            voiceModal.remove();
            toast('Voice recorded successfully!');
          };

          mediaRecorder.start();
          document.getElementById('start-rec-btn').style.display = 'none';
          document.getElementById('done-rec-btn').style.display = 'block';
          document.getElementById('rec-status-text').innerText = '🔴 Recording... Speak now';
        } catch (err) {
          toast('Microphone access denied or error');
          voiceModal.remove();
        }
      };

      document.getElementById('done-rec-btn').onclick = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      document.getElementById('close-v-modal').onclick = () => voiceModal.remove();
    };

    // Post Submit Action with Post Approval Check
    document.getElementById('submit-group-post').onclick = async () => {
      const text = document.getElementById('group-post-text').value.trim();
      if (!text && !recordedAudioBlob) { toast('Please write something or attach voice'); return; }
      
      try {
        // Check if group has post approval enabled
        const { data: roomData } = await sb.from('group_rooms').select('post_approval').eq('id', roomId).single();
        const needsApproval = roomData && roomData.post_approval;

        const { error } = await sb.from('group_posts').insert({
          group_id: roomId,
          user_id: currentUser.id,
          content: text || '[Voice Post]',
          status: needsApproval ? 'pending' : 'published',
          created_at: new Date()
        });
        if (error) throw error;

        document.getElementById('group-post-text').value = '';
        recordedAudioBlob = null;
        document.getElementById('voice-attachment-status').innerText = '';

        if (needsApproval) {
          toast('Post submitted! Waiting for admin approval.');
        } else {
          toast('Post published successfully!');
        }
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
      const { data: posts, error } = await sb.from('group_posts').select('*').eq('group_id', gId).eq('status', 'published').order('created_at', { ascending: false });
      if (error || !posts || posts.length === 0) {
        feed.innerHTML = `<div style="background:#121826; border:1px solid #26314a; border-radius:12px; padding:20px; text-align:center; color:#8b97b3;">No posts yet. Be the first to share something!</div>`;
        return;
      }

      feed.innerHTML = posts.map(p => `
        <div style="background:#121826; border:1px solid #26314a; border-radius:12px; padding:14px; margin-bottom:12px; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-weight:600; color:#fff; font-size:14px;">Member</span>
            ${p.user_id === currentUser.id ? `<button onclick="deleteGroupPost('${p.id}', '${roomId}')" style="background:none; border:0; color:#e74c3c; cursor:pointer; font-size:12px;">Delete</button>` : ''}
          </div>
          <p style="margin:0; color:#cbd5e1; font-size:14px; word-break:break-word;">${esc(p.content)}</p>
        </div>
      `).join('');
    } catch (err) {
      feed.innerHTML = `<div style="color:#e74c3c; text-align:center;">Failed to load posts</div>`;
    }
  }

  window.deleteGroupPost = async function(postId, gId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await sb.from('group_posts').delete().eq('id', postId);
      toast('Post deleted');
      fetchGroupPosts(gId);
    } catch (err) {
      toast('Error deleting post');
    }
  };

  loadFeaturedTab();

  document.getElementById('room-back-btn').onclick = () => {
    roomModal.remove();
    if (typeof loadGroupRooms === 'function') loadGroupRooms();
  };

  // Tab switching logic
  const tabs = roomModal.querySelectorAll('.g-tab');
  tabs.forEach(tab => {
    tab.onclick = (e) => {
      tabs.forEach(t => { t.style.background = 'transparent'; t.style.color = '#8b97b3'; });
      e.target.style.background = '#26314a';
      e.target.style.color = '#fff';
      
      const tabName = e.target.getAttribute('data-tab');
      const contentArea = document.getElementById('room-tab-content');
      
      if (tabName === 'featured') loadFeaturedTab();
      else if (tabName === 'photos') contentArea.innerHTML = `<div style="padding:20px;"><h3 style="color:#fff; margin-bottom:10px;">🖼️ Group Photos</h3><p>Share and view community pictures.</p></div>`;
      else if (tabName === 'events') contentArea.innerHTML = `<div style="padding:20px;"><h3 style="color:#fff; margin-bottom:10px;">📅 Group Events</h3><p>Online and in-person community meetups.</p></div>`;
      else if (tabName === 'files') contentArea.innerHTML = `<div style="padding:20px;"><h3 style="color:#fff; margin-bottom:10px;">📁 Shared Files</h3><p>Documents and community resources.</p></div>`;
      else if (tabName === 'reels') contentArea.innerHTML = `<div style="padding:20px;"><h3 style="color:#fff; margin-bottom:10px;">🎬 Reels & Voice Clips</h3><p>Listen to voice notes and watch short clips.</p></div>`;
    };
  });

  // Invite Button Modal
  document.getElementById('btn-invite-group').onclick = () => {
    let inviteModal = document.createElement('div');
    inviteModal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:1300; display:flex; align-items:center; justify-content:center; padding:20px;';
    inviteModal.innerHTML = `
      <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; color:#fff;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
          <h3 style="margin:0; font-size:18px;">➕ Invite People</h3>
          <button id="close-inv" style="background:none; border:0; color:#8b97b3; font-size:18px; cursor:pointer;">✕</button>
        </div>
        <input type="text" readonly value="${window.location.href}" style="width:100%; padding:10px; background:#1a2234; border:1px solid #26314a; border-radius:8px; color:#fff; margin-bottom:15px; outline:none;">
        <button class="btn" style="width:100%; padding:10px;" onclick="toast('Link copied!'); document.body.lastChild.remove();">Copy Invite Link</button>
      </div>
    `;
    document.body.appendChild(inviteModal);
    document.getElementById('close-inv').onclick = () => inviteModal.remove();
  };

  // Manage Button & Panel with Post Approval Settings & Pending Posts
  document.getElementById('btn-manage-group').onclick = () => {
    let manageModal = document.createElement('div');
    manageModal.style.cssText = 'position:fixed; inset:0; background:#0a0d14; z-index:1300; display:flex; flex-direction:column; overflow-y:auto; padding:20px; color:#fff;';
    
    function renderManageHome() {
      manageModal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #26314a; padding-bottom:12px;">
          <h3 style="margin:0; font-size:18px;">⚙️ Manage Group</h3>
          <button id="close-manage" style="background:none; border:0; color:#8b97b3; font-size:20px; cursor:pointer;">✕</button>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div class="manage-item" data-action="action-items" style="background:#121826; padding:14px; border-radius:12px; border:1px solid #26314a; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <span>📋 Action items (Pending Posts)</span>
            <span style="color:#8b97b3;">›</span>
          </div>
          <div class="manage-item" data-action="people" style="background:#121826; padding:14px; border-radius:12px; border:1px solid #26314a; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <span>👥 People & Community Roles</span>
            <span style="color:#8b97b3;">›</span>
          </div>
          <div class="manage-item" data-action="settings" style="background:#121826; padding:14px; border-radius:12px; border:1px solid #26314a; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <span>🛠️ Group Settings & Post Approval</span>
            <span style="color:#8b97b3;">›</span>
          </div>
          <div class="manage-item" data-action="activity" style="background:#121826; padding:14px; border-radius:12px; border:1px solid #26314a; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <span>📊 Activity Log & Insights</span>
            <span style="color:#8b97b3;">›</span>
          </div>
          
          <hr style="border:0; border-top:1px solid #26314a; margin:10px 0;">
          
          <button id="leave-group-perm-btn" style="background:#e74c3c; color:#fff; border:0; padding:12px; border-radius:12px; font-weight:600; cursor:pointer; text-align:center;">🚪 Leave Group</button>
        </div>
      `;

      document.getElementById('close-manage').onclick = () => manageModal.remove();

      document.getElementById('leave-group-perm-btn').onclick = async () => {
        if (!confirm('Are you sure you want to leave this group?')) return;
        try {
          await sb.from('group_members').delete().eq('group_id', roomId).eq('user_id', currentUser.id);
          toast('You left the group');
          manageModal.remove();
          roomModal.remove();
          if (typeof loadGroupRooms === 'function') loadGroupRooms();
        } catch (err) {
          toast('Error: ' + err.message);
        }
      };

      manageModal.querySelectorAll('.manage-item').forEach(item => {
        item.onclick = async (e) => {
          const action = e.currentTarget.getAttribute('data-action');
          
          if (action === 'settings') {
            // Fetch current room settings
            const { data: roomData } = await sb.from('group_rooms').select('*').eq('id', roomId).single();
            const isApprovalOn = roomData && roomData.post_approval;

            manageModal.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #26314a; padding-bottom:12px;">
                <h3 style="margin:0; font-size:18px;"><button id="back-to-manage" style="background:none; border:0; color:#fff; cursor:pointer; margin-right:10px;">←</button> Group Settings</h3>
              </div>
              <div style="display:flex; flex-direction:column; gap:14px;">
                <div>
                  <label style="color:#8b97b3; font-size:13px; display:block; margin-bottom:6px;">Group Name</label>
                  <input type="text" id="update-group-name" value="${esc(roomName)}" style="width:100%; padding:10px; background:#1a2234; border:1px solid #26314a; border-radius:8px; color:#fff; outline:none;">
                </div>
                <div>
                  <label style="color:#8b97b3; font-size:13px; display:block; margin-bottom:6px;">Post Approval (Admin must approve posts)</label>
                  <select id="update-post-approval" style="width:100%; padding:10px; background:#1a2234; border:1px solid #26314a; border-radius:8px; color:#fff; outline:none;">
                    <option value="false" ${!isApprovalOn ? 'selected' : ''}>Off (Anyone can post directly)</option>
                    <option value="true" ${isApprovalOn ? 'selected' : ''}>On (Admin approval required)</option>
                  </select>
                </div>
                <button id="save-group-settings" class="btn" style="padding:10px;">Save Changes</button>
              </div>
            `;
            document.getElementById('back-to-manage').onclick = renderManageHome;
            
            document.getElementById('save-group-settings').onclick = async () => {
              const newName = document.getElementById('update-group-name').value.trim();
              const newApproval = document.getElementById('update-post-approval').value === 'true';
              if (!newName) { toast('Group name cannot be empty'); return; }
              try {
                const { error } = await sb.from('group_rooms').update({ name: newName, post_approval: newApproval }).eq('id', roomId);
                if (error) throw error;
                document.getElementById('room-title-heading').innerText = newName;
                toast('Group settings updated successfully!');
                manageModal.remove();
              } catch (err) {
                toast('Update error: ' + err.message);
              }
            };
          } 
          else if (action === 'action-items') {
            manageModal.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #26314a; padding-bottom:12px;">
                <h3 style="margin:0; font-size:18px;"><button id="back-to-manage" style="background:none; border:0; color:#fff; cursor:pointer; margin-right:10px;">←</button> Pending Posts</h3>
              </div>
              <div id="pending-posts-list" style="color:#8b97b3; font-size:14px; background:#121826; padding:15px; border-radius:12px; border:1px solid #26314a;">
                Loading pending posts...
              </div>
            `;
            document.getElementById('back-to-manage').onclick = renderManageHome;

            try {
              const { data: pendingPosts } = await sb.from('group_posts').select('*').eq('group_id', roomId).eq('status', 'pending');
              const pContainer = document.getElementById('pending-posts-list');
              if (pendingPosts && pendingPosts.length > 0) {
                pContainer.innerHTML = pendingPosts.map(p => `
                  <div style="background:#1a2234; padding:12px; border-radius:8px; margin-bottom:10px; border:1px solid #26314a;">
                    <p style="margin:0 0 10px 0; color:#fff; font-size:14px;">${esc(p.content)}</p>
                    <div style="display:flex; gap:8px;">
                      <button onclick="approvePost('${p.id}', '${roomId}')" style="background:#10b981; color:#fff; border:0; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px;">Approve</button>
                      <button onclick="rejectPost('${p.id}', '${roomId}')" style="background:#e74c3c; color:#fff; border:0; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px;">Decline</button>
                    </div>
                  </div>
                `).join('');
              } else {
                pContainer.innerHTML = `✨ No pending posts waiting for approval.`;
              }
            } catch (err) {
              document.getElementById('pending-posts-list').innerHTML = `Failed to load pending posts.`;
            }
          }
          else if (action === 'people') {
            manageModal.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #26314a; padding-bottom:12px;">
                <h3 style="margin:0; font-size:18px;"><button id="back-to-manage" style="background:none; border:0; color:#fff; cursor:pointer; margin-right:10px;">←</button> People & Members</h3>
              </div>
              <div id="manage-people-list" style="color:#8b97b3; font-size:14px; background:#121826; padding:15px; border-radius:12px; border:1px solid #26314a;">
                Loading members...
              </div>
            `;
            document.getElementById('back-to-manage').onclick = renderManageHome;

            try {
              const { data: members } = await sb.from('group_members').select('*').eq('group_id', roomId);
              const pList = document.getElementById('manage-people-list');
              if (members && members.length > 0) {
                pList.innerHTML = members.map(m => `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #26314a;">
                    <span>👤 Member ID: ${m.user_id.substring(0, 8)}...</span>
                    <span style="font-size:12px; color:#10b981;">Active</span>
                  </div>
                `).join('');
              } else {
                pList.innerHTML = `No members found.`;
              }
            } catch (err) {
              document.getElementById('manage-people-list').innerHTML = `Failed to load members.`;
            }
          } 
          else {
            manageModal.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #26314a; padding-bottom:12px;">
                <h3 style="margin:0; font-size:18px;"><button id="back-to-manage" style="background:none; border:0; color:#fff; cursor:pointer; margin-right:10px;">←</button> Activity Log</h3>
              </div>
              <div style="color:#8b97b3; font-size:14px; background:#121826; padding:15px; border-radius:12px; border:1px solid #26314a;">
                📊 Group created and activity initialized successfully.
              </div>
            `;
            document.getElementById('back-to-manage').onclick = renderManageHome;
          }
        };
      });
    }

    renderManageHome();
    document.body.appendChild(manageModal);
  };
}

// Global Approve/Reject pending post handlers
window.approvePost = async function(postId, gId) {
  try {
    const { error } = await sb.from('group_posts').update({ status: 'published' }).eq('id', postId);
    if (error) throw error;
    toast('Post approved and published!');
    document.body.lastChild.remove();
  } catch (err) {
    toast('Error approving post');
  }
};

window.rejectPost = async function(postId, gId) {
  try {
    const { error } = await sb.from('group_posts').delete().eq('id', postId);
    if (error) throw error;
    toast('Post rejected and deleted');
    document.body.lastChild.remove();
  } catch (err) {
    toast('Error rejecting post');
  }
};

// Group Rooms List loader with Smart Enter / Join logic
window.loadGroupRooms = async function() {
  const list = document.getElementById('group-rooms-list');
  if (!list) return;
  list.innerHTML = `<div class="empty">${t('loading')}</div>`;
  
  const { data: rooms, error } = await sb.from('group_rooms').select('*').order('created_at', { ascending: false });
  if (error || !rooms || rooms.length === 0) {
    list.innerHTML = `<div class="empty"><div class="big">🎙️</div>${t('g_empty')}</div>`;
    return;
  }

  let joinedRoomIds = new Set();
  if (currentUser) {
    const { data: members } = await sb.from('group_members').select('group_id').eq('user_id', currentUser.id);
    if (members) {
      members.forEach(m => joinedRoomIds.add(m.group_id));
    }
  }

  list.innerHTML = rooms.map(room => {
    const isJoined = joinedRoomIds.has(room.id);
    const buttonText = isJoined ? 'Enter' : t('g_join');
    const buttonAction = isJoined 
      ? `openActiveGroupRoom('${room.id}', '${esc(room.name)}')` 
      : `joinGroupRoom('${room.id}', '${esc(room.name)}')`;

    return `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:14px; margin-bottom:10px; text-align:start;">
        <div>
          <div style="font-weight:600; font-size:16px; color:var(--text);">${esc(room.name)}</div>
          <div class="muted" style="font-size:12px;">${t('member_limit')}</div>
        </div>
        <button class="btn" style="width:auto; padding:8px 16px; font-size:14px;" onclick="${buttonAction}">${buttonText}</button>
      </div>
    `;
  }).join('');
};
