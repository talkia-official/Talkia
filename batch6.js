/* Talkia Batch 6 — Home Feed, Filtering & Pagination (Bulletproof & Safe) */
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
      // Safe query without complex joins to prevent crashing
      let query = sb.from('voice_posts')
        .select('*')
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

      if (!data || data.length === 0) {
        if (!append) {
          feedList.innerHTML = `<div class="empty"><div class="big">🎙️</div>${typeof t === 'function' ? t('feed_empty') : 'No posts yet. Be the first voice!'}</div>`;
        } else {
          const moreBtn = document.getElementById('feed-more');
          if (moreBtn) moreBtn.remove();
        }
        return;
      }

      // Fetch profiles separately for 100% safety
      const userIds = [...new Set(data.map(p => p.user_id))];
      let profileMap = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await sb.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
        if (profilesData) {
          profilesData.forEach(pr => { profileMap[pr.id] = pr; });
        }
      }

      const postsHtml = data.map(p => {
        const prof = profileMap[p.user_id] || {};
        const postObj = {
          ...p,
          display_name: p.is_anonymous ? (typeof t === 'function' ? t('anon') : 'Anonymous') : (prof.display_name || 'User'),
          avatar_url: p.is_anonymous ? null : (prof.avatar_url || null)
        };

        if (typeof cardHtml === 'function') {
          return cardHtml(postObj);
        } else {
          // Fallback UI if cardHtml is not defined
          return `
            <div style="background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:16px; margin-bottom:12px;">
              <div style="font-weight:600; margin-bottom:6px;">${esc(postObj.display_name)}</div>
              <div style="font-size:14px; margin-bottom:10px;">${esc(p.caption || '')}</div>
              ${p.audio_url ? `<audio controls src="${esc(p.audio_url)}" style="width:100%; margin-top:8px;"></audio>` : ''}
              ${p.image_url ? `<img src="${esc(p.image_url)}" style="width:100%; max-height:300px; object-fit:cover; border-radius:8px; margin-top:8px;">` : ''}
            </div>
          `;
        }
      }).join('');

      if (append) {
        const moreBtn = document.getElementById('feed-more');
        if (moreBtn) moreBtn.remove();
        feedList.insertAdjacentHTML('beforeend', postsHtml);
      } else {
        feedList.innerHTML = postsHtml;
      }

      if (data.length === pageSize) {
        feedList.insertAdjacentHTML('beforeend', `
          <div style="padding:16px; text-align:center;">
            <button class="btn ghost" id="feed-more" style="width:100%; padding:10px;" onclick="feedPage = (typeof feedPage !== 'undefined' ? feedPage + 1 : 1); loadFeed(true);">Load More</button>
          </div>
        `);
      }

    } catch (err) {
      console.error('[Talkia] Load feed error:', err);
      feedList.innerHTML = `<div class="empty" style="padding:20px; color:var(--danger);">Failed to load feed. Please refresh.</div>`;
    }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

})();
