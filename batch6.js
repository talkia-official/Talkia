/* Talkia Batch 6 — safe front-end fixes based on the supplied source.
 * Load this AFTER batch5.js. Database-dependent features are intentionally
 * not guessed here; they need the actual Supabase schema/RLS definitions.
 */
(function () {
  'use strict';

  // 1) Always start on Home instead of restoring the previously selected tab.
  // This runs before the async Supabase session lookup normally completes.
  try {
    if (typeof currentTab !== 'undefined') currentTab = 'home';
    localStorage.setItem('talkia_tab', 'home');
  } catch (_) {}

  // 2) Fix the relationship field. The original renderProfile used
  // $('p-rel>span'), but $() is getElementById(), not querySelector().
  const originalRenderProfile = window.renderProfile;
  if (typeof originalRenderProfile === 'function') {
    window.renderProfile = function () {
      originalRenderProfile.apply(this, arguments);
      const relationship = document.getElementById('p-rel');
      if (relationship) {
        const profile = typeof currentProfile !== 'undefined' && currentProfile
          ? currentProfile : {};
        const missing = typeof t === 'function' ? t('not_added') : 'Not added yet';
        relationship.textContent = profile.marital_status || missing;
      }
    };
  }

  // 3) Put Edit Profile and My Friends above the Posts / Photo Gallery tabs.
  function moveProfileActions() {
    const edit = document.getElementById('btn-edit');
    const friends = document.getElementById('btn-people');
    const tabs = document.querySelector('.profile-tabs');
    if (!edit || !friends || !tabs || !tabs.parentNode) return;

    let actions = document.getElementById('profile-action-buttons');
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'profile-action-buttons';
      actions.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin:12px 0;';
    }
    actions.append(edit, friends);
    tabs.parentNode.insertBefore(actions, tabs);
  }

  // 4) Edit Post should preload the existing caption instead of an empty prompt.
  // Keep the existing table/column and refresh behavior used by the original code.
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

  // 5) Make profile avatars carrying data-profile-id open profiles consistently
  // across the page, not only inside the feed's click handler.
  document.addEventListener('click', function (event) {
    const target = event.target && event.target.closest
      ? event.target.closest('[data-profile-id]') : null;
    if (!target) return;
    const userId = target.dataset.profileId;
    if (!userId || typeof window.openUserProfileModal !== 'function') return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    window.openUserProfileModal(userId);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', moveProfileActions, { once: true });
  } else {
    moveProfileActions();
  }
})();
