/* Talkia Batch 6 — Home Feed, Filtering, Pagination & Profile Visitors (Optimized) */
(function () {
  'use strict';

  let feedPage = 0;
  const PAGE_SIZE = 10;

  // 1) Load Home Feed with Filters & Pagination
  window.loadFeed = async function (append = false) {
    if (typeof sb === 'undefined') return;
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;

    if (!append) {
      feedPage = 0;
      feedList.innerHTML = '<div class="muted" style="text-align:center; padding:30px;">Loading feed...</div>';
    }

    try {
      const catId = document.getElementById('feed-cat-select')?.value;
      const countryVal = document.getElementById('feed-country-select')?.value;

      let query = sb.from('voice_posts')
        .select('*, profiles(display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(feedPage * PAGE_SIZE, (feedPage + 1) * PAGE_SIZE - 1);

      if (catId) query = query.eq('category_id', Number(catId));
      if (countryVal) query = query.eq('country', countryVal);

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        if (!append) {
          feedList.innerHTML = `<div class="empty"><div class="big">🎙️</div>${typeof t === 'function' ? t('feed_empty') : 'No posts yet.'}</div>`;
        }
        return;
      }

      let html = '';
      data.forEach(p => {
        const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
        p.display_name = prof?.display_name;
        p.avatar_url = prof?.avatar_url;
        html += (typeof cardHtml === 'function' ? cardHtml(p) : '');
      });

      if (append) {
        const moreBtn = document.getElementById('feed-more');
        if (moreBtn) moreBtn.remove();
        feedList.insertAdjacentHTML('beforeend', html);
      } else {
        feedList.innerHTML = html;
      }

      if (data.length === PAGE_SIZE) {
        feedList.insertAdjacentHTML('beforeend', `<div style="padding:16px; text-align:center;"><button id="feed-more" class="btn ghost" style="width:auto; padding:8px 20px; font-size:13px;" onclick="feedPage++; loadFeed(true);">Load More</button></div>`);
      }

    } catch (err) {
      console.error('[Talkia] Load feed error:', err);
      if (!append) feedList.innerHTML = '<div class="empty">Failed to load feed</div>';
    }
  };

  // 2) Profile Visitors Modal Logic
  const btnVisitors = document.getElementById('btn-visitors');
  if (btnVisitors) {
    btnVisitors.onclick = async () => {
      if (!currentUser) return toast('Please login');
      let vModal = document.getElementById('visitors-modal');
      if (!vModal) {
        vModal = document.createElement('div');
        vModal.id = 'visitors-modal';
        vModal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1400; display:flex; align-items:center; justify-content:center; padding:16px;';
        document.body.appendChild(vModal);
      }
      vModal.classList.remove('hidden');
      vModal.innerHTML = `
        <div style="max-width:400px; width:100%; background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px;" onclick="event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <h3 style="margin:0; font-size:16px;">Profile Visitors</h3>
            <button onclick="document.getElementById('visitors-modal').classList.add('hidden')" style="background:none; border:0; color:var(--muted); font-size:18px; cursor:pointer;">✕</button>
          </div>
          <div id="visitors-list" style="max-height:250px; overflow-y:auto;">Loading visitors...</div>
        </div>
      `;
      vModal.onclick = () => vModal.classList.add('hidden');

      try {
        const { data: visitors, error } = await sb.from('profile_visitors')
          .select('visited_at, profiles(display_name, avatar_url, username)')
          .eq('profile_id', currentUser.id)
          .order('visited_at', { ascending: false })
          .limit(30);

        const vList = document.getElementById('visitors-list');
        if (vList) {
          if (error || !visitors || visitors.length === 0) {
            vList.innerHTML = '<div class="muted" style="font-size:12px;">No visitors today.</div>';
          } else {
            vList.innerHTML = visitors.map(v => {
              const prof = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
              return `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--line);">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div class="uav">${prof?.avatar_url ? `<img src="${esc(prof.avatar_url)}">` : esc((prof?.display_name || 'U').charAt(0))}</div>
                    <div>
                      <div style="font-size:13px; font-weight:600;">${esc(prof?.display_name || 'User')}</div>
                      <div class="muted" style="font-size:11px;">@${esc(prof?.username || '')}</div>
                    </div>
                  </div>
                  <span class="muted" style="font-size:11px;">${new Date(v.visited_at).toLocaleDateString()}</span>
                </div>
              `;
            }).join('');
          }
        }
      } catch (e) {
        console.error('[Talkia] Visitors error:', e);
        const vList = document.getElementById('visitors-list');
        if (vList) vList.innerHTML = '<div class="muted" style="font-size:12px;">No visitors yet.</div>';
      }
    };
  }

  // Initial load triggers
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof loadCats === 'function') loadCats();
    if (typeof loadFeed === 'function') loadFeed();
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

})();
