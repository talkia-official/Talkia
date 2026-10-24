// Profile: own profile, edit form, avatar/cover upload, post/photo tabs, other users' profiles
async function loadProfile() {
  const { data } = await sb.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
  currentProfile = data;
  renderProfile();
  loadUserMyPostsAndPhotos(currentUser.id);
}

function renderProfile() {
  if (!currentUser) return;
  const p = currentProfile || {};
  const name = p.display_name || t('user');
  $('p-name').textContent = name;
  $('p-username').textContent = p.username ? '@' + p.username : '';
  $('p-country').innerHTML = p.country ? '<span class="tag">' + esc(p.country) + '</span>' : '';
  $('p-bio').textContent = p.bio || '';
  
  if ($('p-edu')) $('p-edu').textContent = p.education || t('not_added');
  if ($('p-rel')) $('p-rel').textContent = p.marital_status || t('not_added');
  if ($('p-relig')) $('p-relig').textContent = p.religion || t('not_added');
  if ($('p-hobby')) $('p-hobby').textContent = p.hobbies || t('not_added');
  if ($('p-city')) $('p-city').textContent = p.city || t('not_added');

  const av = $('p-avatar');
  if (p.avatar_url) { av.innerHTML = '<img alt="" src="' + esc(p.avatar_url) + '">'; }
  else { av.textContent = name.trim().charAt(0).toUpperCase() || 'T'; }

  if ($('p-cover-img')) {
    if (p.cover_url) {
      $('p-cover-img').src = esc(p.cover_url);
      $('p-cover-img').classList.remove('hidden');
    } else {
      $('p-cover-img').classList.add('hidden');
    }
  }
}


window.switchProfileTab = function (tab) {
  $('profile-posts-area').classList.toggle('hidden', tab !== 'posts');
  $('profile-photos-area').classList.toggle('hidden', tab !== 'photos');
  $('ptab-posts-btn').classList.toggle('on', tab === 'posts');
  $('ptab-photos-btn').classList.toggle('on', tab === 'photos');
};

async function loadUserMyPostsAndPhotos(uid) {
  const [vq, pq] = await Promise.all([sb.from('voice_posts').select('*').eq('user_id', uid), sb.from('photo_posts').select('*').eq('user_id', uid)]);
  const error = vq.error || pq.error;
  const data = (vq.data || []).concat((pq.data || []).map(r => ({ ...r, _photo: true }))).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (error) { $('profile-posts-area').textContent = error.message; return; }
  const rows = (data || []).map(r => ({ ...r, display_name: currentProfile && currentProfile.display_name, avatar_url: currentProfile && currentProfile.avatar_url }));
  $('profile-posts-area').innerHTML = rows.length ? rows.map(r => cardHtml(r).replace(/<\/div>$/,
    '<div style="display:flex;gap:10px;margin-top:8px"><button class="btn ghost" style="width:auto;padding:6px 12px;font-size:13px" onclick="editPost(\'' + esc(r.id) + '\')"' + (r._photo ? ' hidden' : '') + '>✎ ' + esc(t('edit_profile').split(' ')[0]) + '</button>'
    + '<button class="btn danger" style="width:auto;padding:6px 12px;font-size:13px" onclick="deletePost(\'' + esc(r.id) + '\',' + (r._photo ? 1 : 0) + ')">' + esc(t('del_post')) + '</button></div></div>')).join('')
    : '<div class="muted" style="text-align:center">' + esc(t('none_yet')) + '</div>';
  const imgs = rows.filter(r => r.image_url);
  $('profile-photos-area').innerHTML = imgs.length ? imgs.map(r => '<img src="' + esc(r.image_url) + '" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;cursor:pointer" onclick="window.open(this.src)">').join('')
    : '<div class="muted" style="grid-column:1/-1;text-align:center">' + esc(t('no_img')) + '</div>';
}
window.deletePost = async function (id, photo) {
  if (!confirm(t('del_confirm'))) return;
  const { error } = await sb.from(photo ? 'photo_posts' : 'voice_posts').delete().eq('id', id).eq('user_id', currentUser.id);
  if (error) return toast(t('err') + error.message);
  loadUserMyPostsAndPhotos(currentUser.id); if (currentTab === 'home') loadFeed();
};
window.editPost = async function (postId) {
    if (!postId || typeof sb === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
      if (typeof toast === 'function') toast('Please sign in first');
      return;
    }
    try {
      const result = await sb.from('voice_posts')
        .select('caption,user_id')
        .eq('id', postId)
        .maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) throw new Error('Post not found');
      if (result.data.user_id !== currentUser.id) throw new Error('You can only edit your own post');

      const updated = prompt('Edit your post text/caption:', result.data.caption || '');
      if (updated === null) return;
      const { error } = await sb.from('voice_posts')
        .update({ caption: updated })
        .eq('id', postId)
        .eq('user_id', currentUser.id);
      if (error) throw error;

      if (typeof toast === 'function') toast('Post updated successfully!');
      if (typeof loadFeed === 'function') await loadFeed();
      if (typeof currentTab !== 'undefined' && currentTab === 'profile' &&
          typeof loadUserMyPostsAndPhotos === 'function') {
        await loadUserMyPostsAndPhotos(currentUser.id);
      }
    } catch (error) {
      console.error('[Talkia] editPost failed:', error);
      if (typeof toast === 'function') toast(error.message || 'Failed to update post');
    }
  };

  
function openEditProfile() {
  const p = currentProfile || {};
  const map = { 'e-name': p.display_name, 'e-username': p.username, 'e-bio': p.bio, 'e-edu': p.education, 'e-rel': p.marital_status, 'e-relig': p.religion, 'e-hobby': p.hobbies, 'e-city': p.city, 'e-country': p.country };
  for (const k in map) $(k).value = map[k] || '';
  $('edit-msg').textContent = ''; $('edit-sheet').classList.remove('hidden');
}
async function saveEditProfile(e) {
  e.preventDefault();
  const username = $('e-username').value.trim().toLowerCase();
  if (username && !/^[a-z0-9_]{3,20}$/.test(username)) { $('edit-msg').textContent = t('bad_username'); return; }
  const upd = { display_name: $('e-name').value.trim() || t('user'), username: username || null, bio: $('e-bio').value.trim(), education: $('e-edu').value.trim(),
    marital_status: $('e-rel').value.trim(), religion: $('e-relig').value.trim(), hobbies: $('e-hobby').value.trim(), city: $('e-city').value.trim(), country: $('e-country').value.trim() };
  const { error } = await sb.from('profiles').update(upd).eq('id', currentUser.id);
  if (error) { $('edit-msg').textContent = error.code === '23505' ? t('taken') : error.message; return; }
  Object.assign(currentProfile, upd); renderProfile(); toast(t('saved')); $('edit-sheet').classList.add('hidden');
}
async function uploadProfileImage(file, field) {
  if (!file) return; toast(t('uploading'));
  try {
    const url = await uploadMedia(file, field);
    const { error } = await sb.from('profiles').update({ [field]: url }).eq('id', currentUser.id);
    if (error) throw error; currentProfile[field] = url; renderProfile();
  } catch (err) { toast(t('upload_fail') + err.message); }
}
function initProfileUI() {
  $('btn-edit').onclick = openEditProfile; $('edit-form').onsubmit = saveEditProfile;
  $('edit-cancel').onclick = () => $('edit-sheet').classList.add('hidden');
  $('p-avatar').onclick = () => $('avatar-input').click(); $('avatar-input').onchange = e => uploadProfileImage(e.target.files[0], 'avatar_url');
  $('p-cover-img').onclick = () => $('cover-input').click();
  $('cover-input').onchange = e => uploadProfileImage(e.target.files[0], 'cover_url');
  $('btn-visitors').onclick = openProfileVisitorsModal;
}
window.openUserProfileModal = async function(userId) {
  if (currentUser && userId === currentUser.id) {
    showTab('profile');
    return;
  }

  let modal = document.getElementById('user-profile-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'user-profile-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:1150; display:flex; flex-direction:column; overflow-y:auto; padding:20px;';
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');
  modal.innerHTML = `<div style="text-align:center; color:#8b97b3; margin-top:50px;">${t('loading')}</div>`;

  const { data: user, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !user) {
    modal.innerHTML = `<div style="text-align:center; color:var(--danger); margin-top:50px;">User not found</div><button class="btn ghost" onclick="document.getElementById('user-profile-modal').classList.add('hidden')" style="margin-top:20px;">${t('btn_back')}</button>`;
    return;
  }

  let { data: posts } = await sb.from('voice_feed').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  posts = await withImages(posts || []);  // voice_feed hides anonymous posts
  const { data: ph } = await sb.from('photo_feed').select('*').eq('user_id', userId);
  posts = posts.concat((ph || []).map(p => ({ ...p, _photo: true }))).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  modal.innerHTML = `
    <div style="max-width:560px; width:100%; margin:0 auto; background:var(--surface); border:1px solid var(--line); border-radius:20px; overflow:hidden; max-height:90vh; display:flex; flex-direction:column;">
      <div style="padding:16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); flex-shrink:0;">
        <h3 style="margin:0; font-size:18px;">${esc(user.display_name)}</h3>
        <button id="upm-close" style="color:var(--muted); font-size:20px; background:none; border:0; cursor:pointer;">✕</button>
      </div>
      <div style="padding:20px; text-align:center; overflow-y:auto; flex:1;">
        <div class="uav" style="width:80px !important; height:80px !important; margin:0 auto 12px; font-size:32px;">
          ${user.avatar_url ? `<img src="${esc(user.avatar_url)}">` : esc((user.display_name || 'U').charAt(0))}
        </div>
        <h2 style="margin:0 0 4px; font-size:20px;">${esc(user.display_name)}</h2>
        <div class="muted" style="margin-bottom:8px;">@${esc(user.username || '')}</div>
        ${user.country ? `<span class="tag">${esc(user.country)}</span>` : ''}
        <p style="margin:12px 0; color:var(--muted); font-size:14px;">${esc(user.bio || '')}</p>
        
        <div style="display:flex; gap:10px; margin:16px 0;">
          <button class="btn" id="upm-add-friend" style="flex:1; font-size:14px; padding:10px;">${t('add_friend')}</button>
          <button class="btn ghost" id="upm-inbox" style="flex:1; font-size:14px; padding:10px;">💬 Inbox</button>
        </div>

        <div class="ext-bio-box" style="text-align:left;">
          <div><b>${t('lbl_edu')}</b> <span>${esc(user.education || t('not_added'))}</span></div>
          <div><b>${t('lbl_rel')}</b> <span>${esc(user.marital_status || t('not_added'))}</span></div>
          <div><b>${t('lbl_relig')}</b> <span>${esc(user.religion || t('not_added'))}</span></div>
          <div><b>${t('lbl_hobby')}</b> <span>${esc(user.hobbies || t('not_added'))}</span></div>
          <div><b>${t('lbl_city')}</b> <span>${esc(user.city || t('not_added'))}</span></div>
        </div>

        <div style="margin-top:20px; text-align:left;">
          <h4 style="margin-bottom:10px;">${t('posts_h')}</h4>
          <div id="upm-posts">
            ${posts && posts.length > 0 ? posts.map(cardHtml).join('') : `<div class="muted" style="text-align:center; padding:20px;">${t('none_yet')}</div>`}
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('upm-close').onclick = () => modal.classList.add('hidden');
  
  document.getElementById('upm-add-friend').onclick = async () => {
    try {
      const { error } = await sb.from('friendships').insert({ requester_id: currentUser.id, addressee_id: userId, status: 'pending' });
      if (error) throw error;
      toast(t('req_sent'));
    } catch (err) {
      toast(t('req_already_sent'));
    }
  };

  document.getElementById('upm-inbox').onclick = () => {
    modal.classList.add('hidden');
    openDirectChat(user);
  };
};

window.openProfileVisitorsModal = async function() {
  let modal = document.getElementById('visitors-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'visitors-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1150; display:flex; align-items:center; justify-content:center;';
    modal.innerHTML = `
      <div style="background:#121826; border:1px solid #26314a; width:100%; max-width:400px; border-radius:20px; padding:20px; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="margin:0; color:#fff; font-size:18px;">👁️ ${t('pv_title')}</h3>
          <button id="vis-close-x" style="color:#8b97b3; font-size:20px; border:0; background:none; cursor:pointer;">✕</button>
        </div>
        <div id="visitors-list" style="max-height:300px; overflow-y:auto; color:#8b97b3; font-size:14px; text-align:center; padding:20px 0;">
          ${t('no_visitors')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('vis-close-x').onclick = () => modal.remove();
  } else {
    modal.style.display = 'flex';
  }
};

