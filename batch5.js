/* Talkia Batch 5 — Profile Tabs, Posts Grid & Photo Grid (100% Fixed & Optimized) */
(function () {
  'use strict';

  // 1) Switch Profile Tabs (Posts / Photos)
  window.switchProfileTab = function(tab) {
    const btnPosts = document.getElementById('ptab-posts-btn');
    const btnPhotos = document.getElementById('ptab-photos-btn');
    const areaPosts = document.getElementById('profile-posts-area');
    const areaPhotos = document.getElementById('profile-photos-area');

    if (!btnPosts || !btnPhotos || !areaPosts || !areaPhotos) return;

    if (tab === 'posts') {
      btnPosts.classList.add('on');
      btnPhotos.classList.remove('on');
      areaPosts.classList.remove('hidden');
      areaPhotos.classList.add('hidden');
    } else {
      btnPhotos.classList.add('on');
      btnPosts.classList.remove('on');
      areaPhotos.classList.remove('hidden');
      areaPosts.classList.add('hidden');
    }
  };

  // 2) Load User's Posts and Photos for Profile Page
  window.loadUserMyPostsAndPhotos = async function(userId) {
    if (!userId) return;
    const postsArea = document.getElementById('profile-posts-area');
    const photosArea = document.getElementById('profile-photos-area');
    const statPosts = document.getElementById('stat-posts');
    const statViews = document.getElementById('stat-views');
    const statFriends = document.getElementById('stat-friends');

    if (postsArea) postsArea.innerHTML = '<div class="muted" style="text-align:center; padding:20px;">Loading posts...</div>';
    if (photosArea) photosArea.innerHTML = '';

    try {
      // Fetch user posts
      const { data: posts, error } = await sb.from('voice_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user friends count & profile views
      const { count: friendsCount } = await sb.from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      const { count: visitorsCount } = await sb.from('profile_visitors')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId);

      if (statFriends) statFriends.textContent = friendsCount || 0;
      if (statViews) statViews.textContent = visitorsCount || 0;
      if (statPosts) statPosts.textContent = posts ? posts.length : 0;

      if (!posts || posts.length === 0) {
        if (postsArea) postsArea.innerHTML = `<div class="empty"><div class="big">📝</div>No posts yet.</div>`;
        if (photosArea) photosArea.innerHTML = `<div class="empty" style="grid-column: span 3;"><div class="big">📷</div>No photos yet.</div>`;
        return;
      }

      // Render posts in profile posts area
      if (postsArea) {
        postsArea.innerHTML = posts.map(p => {
          const postWithProfile = {
            ...p,
            display_name: currentProfile?.display_name,
            avatar_url: currentProfile?.avatar_url
          };
          return typeof cardHtml === 'function' ? cardHtml(postWithProfile) : `<div class="card">${esc(p.caption || 'Voice Post')}</div>`;
        }).join('');
      }

      // Extract photos for photo grid tab
      const photoPosts = posts.filter(p => p.image_url);
      if (photosArea) {
        if (photoPosts.length === 0) {
          photosArea.innerHTML = `<div class="empty" style="grid-column: span 3;"><div class="big">📷</div>No photos yet.</div>`;
        } else {
          photosArea.innerHTML = photoPosts.map(p => `
            <div style="cursor:pointer;" onclick="openMediaViewer('${esc(p.image_url)}')">
              <img src="${esc(p.image_url)}" alt="Photo">
            </div>
          `).join('');
        }
      }

    } catch (err) {
      console.error('[Talkia] Load user posts error:', err);
      if (postsArea) postsArea.innerHTML = '<div class="empty">Failed to load posts</div>';
    }
  };

  // 3) Media Viewer Modal for large photos
  window.openMediaViewer = function(url) {
    if (!url) return;
    let vModal = document.getElementById('media-viewer-modal');
    if (!vModal) {
      vModal = document.createElement('div');
      vModal.id = 'media-viewer-modal';
      vModal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:2000; display:flex; align-items:center; justify-content:center; padding:10px;';
      document.body.appendChild(vModal);
    }
    vModal.classList.remove('hidden');
    vModal.innerHTML = `
      <div style="position:relative; max-width:100%; max-height:100%; display:flex; flex-direction:column; align-items:center;" onclick="event.stopPropagation()">
        <button onclick="document.getElementById('media-viewer-modal').classList.add('hidden')" style="position:absolute; top:-40px; right:0; background:none; border:0; color:#fff; font-size:24px; cursor:pointer;">✕</button>
        <img src="${esc(url)}" style="max-width:100%; max-height:85vh; object-fit:contain; border-radius:8px;">
      </div>
    `;
    vModal.onclick = () => vModal.classList.add('hidden');
  };

})();
