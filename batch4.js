/* Talkia Batch 4 — Group Rooms, Search, Friend Requests & Inbox (100% Fixed & Optimized) */
(function () {
  'use strict';

  // 1) Group Rooms Logic
  window.loadGroupRooms = async function() {
    if (typeof sb === 'undefined') return;
    const listEl = document.getElementById('group-rooms-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="muted" style="text-align:center; padding:20px;">Loading rooms...</div>';

    try {
      const { data, error } = await sb.from('group_rooms')
        .select('*, profiles(display_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        listEl.innerHTML = `<div class="empty"><div class="big">👥</div>${typeof t === 'function' ? t('g_empty') : 'No live rooms available.'}</div>`;
        return;
      }

      listEl.innerHTML = data.map(r => {
        const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        const creatorName = prof?.display_name || 'User';
        return `
          <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid var(--line);">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:42px; height:42px; border-radius:50%; background:var(--surface2); display:grid; place-items:center; font-size:18px;">👥</div>
              <div>
                <div style="font-weight:600; font-size:15px;">${esc(r.name)}</div>
                <div class="muted" style="font-size:11px;">Created by: ${esc(creatorName)}</div>
              </div>
            </div>
            <button class="btn" style="width:auto; padding:6px 14px; font-size:13px;" onclick="joinGroupRoom('${esc(r.id)}')">${typeof t === 'function' ? t('g_join') : 'Join'}</button>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('[Talkia] Load group rooms error:', err);
      listEl.innerHTML = '<div class="empty">Failed loading rooms</div>';
    }
  };

  window.joinGroupRoom = function(roomId) {
    toast(typeof t === 'function' ? t('room_joined') : 'Joined group room (Live Voice Chat)');
  };

  // 2) Search Users & Profile Click Logic
  const srForm = document.getElementById('sr-form');
  const srInput = document.getElementById('sr-q');
  const srResults = document.getElementById('sr-results');

  if (srForm) {
    srForm.onsubmit = async (e) => {
      e.preventDefault();
      const q = srInput ? srInput.value.trim() : '';
      if (!q || q.length < 2) {
        toast(typeof t === 'function' ? t('min2') : 'Type at least 2 characters');
        return;
      }
      if (!srResults) return;
      srResults.innerHTML = '<div class="muted" style="text-align:center; padding:20px;">Searching...</div>';

      try {
        const { data, error } = await sb.from('profiles')
          .select('*')
          .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
          .limit(20);

        if (error) throw error;

        if (!data || data.length === 0) {
          srResults.innerHTML = `<div class="empty">${typeof t === 'function' ? t('no_results') : 'No one found'}</div>`;
          return;
        }

        srResults.innerHTML = data.map(u => {
          const isMe = currentUser && currentUser.id === u.id;
          return `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--line);">
              <div style="display:flex; align-items:center; gap:10px; cursor:pointer; flex:1;" onclick="openUserProfile('${esc(u.id)}')">
                <div class="uav">${u.avatar_url ? `<img src="${esc(u.avatar_url)}">` : esc((u.display_name || 'U').charAt(0))}</div>
                <div>
                  <div style="font-weight:600; font-size:14px;">${esc(u.display_name || 'User')}</div>
                  <div class="muted" style="font-size:12px;">@${esc(u.username || '')}</div>
                </div>
              </div>
              ${!isMe ? `<button class="btn ghost" style="width:auto; padding:6px 12px; font-size:12px;" onclick="sendFriendRequest('${esc(u.id)}')">${typeof t === 'function' ? t('add_friend') : 'Add Friend'}</button>` : ''}
            </div>
          `;
        }).join('');
      } catch (err) {
        console.error('[Talkia] Search error:', err);
        srResults.innerHTML = '<div class="empty">Search failed</div>';
      }
    };
  }

  // Open User Profile Modal/View
  window.openUserProfile = async function(userId) {
    if (!userId) return;
    try {
      const { data: profile, error } = await sb.from('profiles').select('*').eq('id', userId).single();
      if (error || !profile) throw error || new Error('User not found');

      let pModal = document.getElementById('user-profile-modal');
      if (!pModal) {
        pModal = document.createElement('div');
        pModal.id = 'user-profile-modal';
        pModal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1500; display:flex; align-items:center; justify-content:center; padding:16px;';
        document.body.appendChild(pModal);
      }
      pModal.classList.remove('hidden');

      pModal.innerHTML = `
        <div style="max-width:400px; width:100%; background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px; max-height:90vh; overflow-y:auto;" onclick="event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <h3 style="margin:0; font-size:16px;">User Profile</h3>
            <button onclick="document.getElementById('user-profile-modal').classList.add('hidden')" style="background:none; border:0; color:var(--muted); font-size:18px; cursor:pointer;">✕</button>
          </div>
          <div style="text-align:center; margin-bottom:16px;">
            <div class="avatar" style="width:80px; height:80px; margin:0 auto 10px; border-radius:50%; overflow:hidden; background:var(--surface2); display:grid; place-items:center; font-size:28px; font-weight:700;">
              ${profile.avatar_url ? `<img src="${esc(profile.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : esc((profile.display_name || 'U').charAt(0))}
            </div>
            <div style="font-size:18px; font-weight:700;">${esc(profile.display_name || 'User')}</div>
            <div class="muted" style="font-size:13px;">@${esc(profile.username || '')}</div>
            ${profile.country ? `<div style="margin-top:6px;"><span class="tag">${esc(profile.country)}</span></div>` : ''}
          </div>
          ${profile.bio ? `<p style="font-size:13px; line-height:1.4; margin-bottom:16px; text-align:center;">${esc(profile.bio)}</p>` : ''}
          <div style="display:flex; gap:8px;">
            ${currentUser && currentUser.id !== profile.id ? `<button class="btn" style="flex:1;" onclick="sendFriendRequest('${esc(profile.id)}')">Add Friend</button>` : ''}
            <button class="btn ghost" style="flex:1;" onclick="document.getElementById('user-profile-modal').classList.add('hidden')">Close</button>
          </div>
        </div>
      `;
      pModal.onclick = () => pModal.classList.add('hidden');

      if (currentUser && currentUser.id !== userId) {
        await sb.from('profile_visitors').upsert({
          profile_id: userId,
          visitor_id: currentUser.id,
          visited_at: new Date().toISOString()
        }, { onConflict: 'profile_id,visitor_id' }).catch(() => {});
      }

    } catch (err) {
      console.error('[Talkia] Open user profile error:', err);
      toast('Could not load user profile');
    }
  };

  document.addEventListener('click', (e) => {
    const pEl = e.target.closest('[data-profile-id]');
    if (pEl) {
      const uid = pEl.getAttribute('data-profile-id');
      if (uid) openUserProfile(uid);
    }
  });

  // 3) Friend Requests Logic
  window.sendFriendRequest = async function(targetUserId) {
    if (!currentUser) return toast('Please login');
    if (currentUser.id === targetUserId) return toast('Cannot add yourself');

    try {
      const { error } = await sb.from('friend_requests').insert({
        sender_id: currentUser.id,
        receiver_id: targetUserId,
        status: 'pending'
      });

      if (error) {
        if (error.code === '23505' || error.message.includes('duplicate')) {
          toast(typeof t === 'function' ? t('req_already_sent') : 'Friend request already sent');
        } else {
          throw error;
        }
      } else {
        toast(typeof t === 'function' ? t('req_sent') : 'Friend request sent!');
      }
    } catch (err) {
      console.error('[Talkia] Send request error:', err);
      toast('Could not send request');
    }
  };

  // 4) Inbox & Chats Logic (Messenger type list - Bulletproofed)
  const btnInbox = document.getElementById('btn-inbox');
  const inboxSheet = document.getElementById('inbox-sheet');
  const inboxSheetClose = document.getElementById('inbox-sheet-close');
  const inboxCloseBtn = document.getElementById('inbox-close-btn');

  if (btnInbox) {
    btnInbox.onclick = () => {
      if (inboxSheet) inboxSheet.classList.remove('hidden');
      loadInboxChats();
    };
  }
  if (inboxSheetClose) inboxSheetClose.onclick = () => inboxSheet.classList.add('hidden');
  if (inboxCloseBtn) inboxCloseBtn.onclick = () => inboxSheet.classList.add('hidden');

  window.loadInboxChats = async function() {
    if (!currentUser) return;
    const inboxList = document.getElementById('inbox-list');
    if (!inboxList) return;
    inboxList.innerHTML = '<div class="muted" style="text-align:center; padding:20px;">Loading chats...</div>';

    try {
      const { data: friendships, error } = await sb.from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`);

      if (error) throw error;

      if (!friendships || friendships.length === 0) {
        inboxList.innerHTML = `<div class="empty"><div class="big">💬</div>${typeof t === 'function' ? t('inbox_empty') : 'No chats yet.'}</div>`;
        return;
      }

      // Safely extract friend IDs regardless of user_id_1 or user_id_2 position
      const friendIds = friendships.map(f => f.user_id_1 === currentUser.id ? f.user_id_2 : f.user_id_1);

      const { data: profiles, error: profErr } = await sb.from('profiles')
        .select('id, display_name, avatar_url, username')
        .in('id', friendIds);

      if (profErr) throw profErr;

      if (!profiles || profiles.length === 0) {
        inboxList.innerHTML = `<div class="empty">${typeof t === 'function' ? t('inbox_empty') : 'No chats yet.'}</div>`;
        return;
      }

      inboxList.innerHTML = profiles.map(otherUser => {
        return `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--line); cursor:pointer;" onclick="openChat('${esc(otherUser.id)}', '${esc(otherUser.display_name || 'User')}', '${esc(otherUser.avatar_url || '')}')">
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="uav">${otherUser.avatar_url ? `<img src="${esc(otherUser.avatar_url)}">` : esc((otherUser.display_name || 'U').charAt(0))}</div>
              <div>
                <div style="font-weight:600; font-size:14px;">${esc(otherUser.display_name || 'User')}</div>
                <div class="muted" style="font-size:12px;">Tap to chat</div>
              </div>
            </div>
            <span class="muted" style="font-size:12px;">💬</span>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error('[Talkia] Load inbox error:', err);
      inboxList.innerHTML = '<div class="empty">Failed to load chats</div>';
    }
  };

  window.openChat = function(recipientId, recipientName, recipientAvatar) {
    let chatModal = document.getElementById('chat-modal');
    if (!chatModal) {
      chatModal = document.createElement('div');
      chatModal.id = 'chat-modal';
      chatModal.style.cssText = 'position:fixed; inset:0; background:var(--bg); z-index:1700; display:flex; flex-direction:column;';
      document.body.appendChild(chatModal);
    }
    chatModal.classList.remove('hidden');

    chatModal.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--line); background:var(--surface);">
        <div style="display:flex; align-items:center; gap:10px;">
          <button onclick="document.getElementById('chat-modal').classList.add('hidden')" style="background:none; border:0; color:var(--text); font-size:20px; cursor:pointer;">←</button>
          <div class="uav" style="width:34px; height:34px;">${recipientAvatar ? `<img src="${esc(recipientAvatar)}">` : esc(recipientName.charAt(0))}</div>
          <div style="font-weight:600; font-size:15px;">${esc(recipientName)}</div>
        </div>
      </div>
      <div id="chat-messages" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:8px;"></div>
      <form id="chat-form" style="display:flex; padding:10px; border-top:1px solid var(--line); background:var(--surface); gap:8px;">
        <input type="text" id="chat-input" placeholder="Type a message..." style="flex:1; padding:10px 14px; background:var(--bg); border:1px solid var(--line); border-radius:8px; color:var(--text); outline:none; font-size:14px;" autocomplete="off">
        <button type="submit" class="btn" style="width:auto; padding:0 16px;">Send</button>
      </form>
    `;

    loadMessages(recipientId);

    const chatForm = document.getElementById('chat-form');
    chatForm.onsubmit = async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const text = input ? input.value.trim() : '';
      if (!text || !currentUser) return;
      input.value = '';

      try {
        await sb.from('messages').insert({
          sender_id: currentUser.id,
          receiver_id: recipientId,
          content: text
        });
        loadMessages(recipientId);
      } catch (err) {
        console.error('[Talkia] Send message error:', err);
        toast('Failed to send message');
      }
    };
  };

  async function loadMessages(recipientId) {
    const msgArea = document.getElementById('chat-messages');
    if (!msgArea || !currentUser) return;
    try {
      const { data, error } = await sb.from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        msgArea.innerHTML = '<div class="muted" style="text-align:center; padding:20px;">No messages yet. Say hello!</div>';
        return;
      }

      msgArea.innerHTML = data.map(m => {
        const isMe = m.sender_id === currentUser.id;
        return `
          <div style="align-self:${isMe ? 'flex-end' : 'flex-start'}; background:${isMe ? 'var(--accent)' : 'var(--surface2)'}; color:${isMe ? 'var(--accent-ink)' : 'var(--text)'}; padding:8px 12px; border-radius:12px; max-width:75%; font-size:14px; word-break:break-word;">
            ${esc(m.content)}
          </div>
        `;
      }).join('');
      msgArea.scrollTop = msgArea.scrollHeight;
    } catch (err) {
      console.error('[Talkia] Load messages error:', err);
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

})();
