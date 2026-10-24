/* Talkia Batch 6 — Home Feed, Filtering & Pagination (100% Fixed & Optimized) */
(function () {
  'use strict';

  window.loadFeed = async function(append = false) {
    if (typeof sb === 'undefined') return;
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;

    if (!append) {
      if (typeof feedPage !== 'undefined') feedPage = 0;
      feedList.innerHTML = '<div class="muted" style="text-align:center; padding:30px;">Loading feed...</div>';
    }

    const catId = document.getElementById('feed-cat-select')?.value || '';
    const country = document.getElementById('feed-country-select')?.value || '';
    const currentPage = typeof feedPage !== 'undefined' ? feedPage : 0;
    const pageSize = typeof PAGE !== 'undefined' ? PAGE : 10;

    try {
      let query = sb.from('voice_posts')
        .select('*, profiles(display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      if (catId) {
        query = query.eq('category_id', Number(catId));
      }
      if (country) {
        query = query.eq('country', country);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!append && (!data || data.length === 0)) {
        feedList.innerHTML = `<div class="empty"><div class="big">🎙️</div>${typeof t === 'function' ? t('feed_empty') : 'No posts yet. Be the first voice!'}</div>`;
        return;
      }

      const postsHtml = (data || []).map(p => {
        const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
        const postObj = {
          ...p,
          display_name: p.is_anonymous ? (typeof t === 'function' ? t('anon') : 'Anonymous') : (prof?.display_name || 'User'),
          avatar_url: p.is_anonymous ? null : (prof?.avatar_url || null)
        };
        return typeof cardHtml === 'function' ? cardHtml(postObj) : `<div class="card">${esc(p.caption || 'Post')}</div>`;
      }).join('');

      if (append) {
        const moreBtn = document.getElementById('feed-more');
        if (moreBtn) moreBtn.remove();
        feedList.insertAdjacentHTML('beforeend', postsHtml);
      } else {
        feedList.innerHTML = postsHtml;
      }

      // Add Load More button if data length matches page size
      if (data && data.length === pageSize) {
        feedList.insertAdjacentHTML('beforeend', `
          <div style="padding:16px; text-align:center;">
            <button class="btn ghost" id="feed-more" style="width:100%; padding:10px;">Load More</button>
          </div>
        `);
      }

    } catch (err) {
      console.error('[Talkia] Load feed error:', err);
      if (!append) feedList.innerHTML = '<div class="empty">Failed to load feed</div>';
    }
  };

})();
