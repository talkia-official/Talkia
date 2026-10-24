/* Talkia Batch 5 — Instagram Style Profile & Feeds (Optimized) */
(function () {
  'use strict';

  // 1) Load User Posts & Photos in Instagram Grid Style
  window.loadUserMyPostsAndPhotos = async function (userId) {
    if (!userId || typeof sb === 'undefined') return;

    try {
      // Fetch user posts count & list
      const { data: posts, error } = await sb.from('voice_feed')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Update Post Count Stat
      const statPosts = document.getElementById('stat-posts');
      if (statPosts) statPosts.textContent = posts ? posts.length : 0;

      const postsArea = document.getElementById('profile-posts-area');
      const photosArea = document.getElementById('profile-photos-area');

      let photoItems = [];
      let postHtml = '';

      if (posts && posts.length > 0) {
        posts.forEach(p => {
          if (p.image_url) {
            photoItems.push(`<img src="${esc(p.image_url)}" alt="Post Image" onclick="openMediaViewer('${esc(p.image_url)}')">`);
          }
          if (typeof cardHtml === 'function') {
            postHtml += cardHtml(p);
          }
        });
      } else {
        postHtml = '<div class="empty"><div class="big">📷</div>No posts yet</div>';
      }

      if (postsArea) postsArea.innerHTML = postHtml;
      if (photosArea) {
        photosArea.innerHTML = photoItems.length > 0 ? photoItems.join('') : '<div class="empty" style="grid-column: span 3;"><div class="big">🖼️</div>No photos yet</div>';
      }

      // Fetch Friends Count Stat safely
      const { count: friendsCount, error: friendError } = await sb.from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      const statFriends = document.getElementById('stat-friends');
      if (statFriends) statFriends.textContent = (!friendError && friendsCount !== null) ? friendsCount : 0;

      // Fetch Total Views Stat for User Posts
      let totalViews = 0;
      if (posts && posts.length > 0) {
        totalViews = posts.reduce((acc, curr) => acc + (curr.view_count || 0), 0);
      }
      const statViews = document.getElementById('stat-views');
      if (statViews) statViews.textContent = totalViews;

    } catch (err) {
      console.error('[Talkia] loadUserMyPostsAndPhotos failed:', err);
    }
  };

  // 2) Profile Tab Switcher (Posts vs Photos Grid)
  window.switchProfileTab = function (tabType) {
    const pPostsBtn = document.getElementById('ptab-posts-btn');
    const pPhotosBtn = document.getElementById('ptab-photos-btn');
    const postsArea = document.getElementById('profile-posts-area');
    const photosArea = document.getElementById('profile-photos-area');

    if (tabType === 'posts') {
      if (pPostsBtn) pPostsBtn.classList.add('on');
      if (pPhotosBtn) pPhotosBtn.classList.remove('on');
      if (postsArea) postsArea.classList.remove('hidden');
      if (photosArea) photosArea.classList.add('hidden');
    } else {
      if (pPhotosBtn) pPhotosBtn.classList.add('on');
      if (pPostsBtn) pPostsBtn.classList.remove('on');
      if (photosArea) photosArea.classList.remove('hidden');
      if (postsArea) postsArea.classList.add('hidden');
    }
  };

  // 3) Media Viewer Helper for Grid Photos
  window.openMediaViewer = function (imgUrl) {
    if (!imgUrl) return;
    let viewer = document.getElementById('media-viewer-modal');
    if (!viewer) {
      viewer = document.createElement('div');
      viewer.id = 'media-viewer-modal';
      viewer.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:1500; display:flex; align-items:center; justify-content:center; padding:10px;';
      document.body.appendChild(viewer);
    }
    viewer.classList.remove('hidden');
    viewer.innerHTML = `
      <div style="position:relative; max-width:100%; max-height:100%; text-align:center;" onclick="event.stopPropagation()">
        <button onclick="document.getElementById('media-viewer-modal').classList.add('hidden')" style="position:absolute; top:-40px; right:0; background:none; border:0; color:#fff; font-size:24px; cursor:pointer;">✕</button>
        <img src="${imgUrl}" style="max-width:100%; max-height:85vh; object-fit:contain; border-radius:8px;">
      </div>
    `;
    viewer.onclick = () => viewer.classList.add('hidden');
  };

  // Helper Esc Function
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

})();
