/* Talkia Batch 6 — Ultimate Production-Ready Version */
(function () {
  'use strict';

  // 1) Tab State Management & Persistence on Refresh
  try {
    if (!localStorage.getItem('talkia_tab')) {
      window.currentTab = 'home';
      localStorage.setItem('talkia_tab', 'home');
    } else {
      window.currentTab = localStorage.getItem('talkia_tab');
    }
  } catch (_) {}

  // Hook into showTab to continuously sync active tab with localStorage for smooth refresh
  if (typeof window.showTab !== 'undefined' || typeof showTab !== 'undefined') {
    const targetShowTab = window.showTab || showTab;
    window.showTab = function (tabName) {
      if (typeof targetShowTab === 'function') {
        targetShowTab.apply(this, arguments);
      }
      try {
        window.currentTab = tabName;
        localStorage.setItem('talkia_tab', tabName);
      } catch (_) {}
    };
  }

  // 2) Robust RenderProfile Fix (Bulletproof against script loading order & return safety)
  let _originalRenderProfile = window.renderProfile;
  Object.defineProperty(window, 'renderProfile', {
    get: function() {
      return function() {
        let result;
        if (typeof _originalRenderProfile === 'function') {
          result = _originalRenderProfile.apply(this, arguments);
        }
        const relationship = document.getElementById('p-rel');
        if (relationship) {
          const profile = typeof currentProfile !== 'undefined' && currentProfile ? currentProfile : {};
          const missing = typeof t === 'function' ? t('not_added') : 'Not added yet';
          relationship.textContent = profile.marital_status || missing;
        }
        return result;
      };
    },
    set: function(fn) {
      _originalRenderProfile = fn;
    },
    configurable: true
  });

  // 3) Move Profile Actions above tabs safely
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

  // 4) Safe Edit Post Logic
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

  // 5) Safe Global Profile Click Delegator
  document.addEventListener('click', function (event) {
    const target = event.target && event.target.closest ? event.target.closest('[data-profile-id]') : null;
    if (!target) return;
    const userId = target.dataset.profileId;
    if (!userId || typeof window.openUserProfileModal !== 'function') return;
    
    event.preventDefault();
    event.stopPropagation();
    window.openUserProfileModal(userId);
  }, false);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', moveProfileActions, { once: true });
  } else {
    moveProfileActions();
  }
})();
