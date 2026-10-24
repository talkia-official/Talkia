/* Talkia Batch 6 — Stable Fixes */
(function () {
  'use strict';

  // হোম পেজে ফিড রেন্ডারিং সুরক্ষিত রাখা
  window.loadFeed = async function (more) {
    if (typeof loadCats === 'function') await loadCats();
    const box = document.getElementById('feed-list');
    if (!box) return;

    if (!more) { 
      if (typeof feedPage !== 'undefined') feedPage = 0; 
      box.innerHTML = '<div class="empty">' + (typeof t === 'function' ? t('loading') : 'Loading...') + '</div>'; 
    }
    
    const feedCat = document.getElementById('feed-cat-select')?.value || '';
    const feedCountry = document.getElementById('feed-country-select')?.value || '';

    let q = sb.from('voice_feed').select('*').order('created_at', { ascending: false }).range((typeof feedPage !== 'undefined' ? feedPage : 0) * (typeof PAGE !== 'undefined' ? PAGE : 10), ((typeof feedPage !== 'undefined' ? feedPage : 0) + 1) * (typeof PAGE !== 'undefined' ? PAGE : 10) - 1);
    
    if (feedCat) q = q.eq('category_id', Number(feedCat));
    if (feedCountry) q = q.eq('country', feedCountry);

    const { data, error } = await q;
    const old = document.getElementById('feed-more'); 
    if (old) old.remove();
    
    if (error) { 
      box.innerHTML = '<div class="empty">' + esc(error.message) + '</div>'; 
      return; 
    }
    
    if ((!data || data.length === 0) && !more) { 
      box.innerHTML = '<div class="empty"><div class="big">🎙️</div>' + (typeof t === 'function' ? t('feed_empty') : 'No posts yet.') + '</div>'; 
      return; 
    }
    
    if (!more) box.innerHTML = '';
    if (data && data.length > 0) {
      box.insertAdjacentHTML('beforeend', data.map(p => typeof cardHtml === 'function' ? cardHtml(p) : '').join(''));
      if (data.length === (typeof PAGE !== 'undefined' ? PAGE : 10)) {
        box.insertAdjacentHTML('beforeend', '<button class="btn ghost sm" id="feed-more" onclick="feedPage++; loadFeed(true);">More</button>');
      }
    }
  };
})();
