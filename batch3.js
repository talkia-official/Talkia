/* Talkia batch3: ফটো পোস্ট, ভয়েস ফিল্টার (Web Audio Engine), ইমোজি রিয়্যাকশন, ভয়েস কমেন্ট, শেয়ার */
(function () {
  const S = {
    bn: { photos: '📷 ফটো', voices: '🎙️ ভয়েস', new_photo: '📷 ফটো পোস্ট করুন', pick: 'ছবি বাছুন', pick_first: 'আগে একটা ছবি বাছুন', no_photos: 'এখনো কোনো ফটো নেই', my_posts: 'আমার পোস্ট', del: 'মুছুন', del_ask: 'এই পোস্ট মুছবেন?', deleted: 'মুছে গেছে', no_posts: 'এখনো কোনো পোস্ট নেই', posts: 'পোস্ট', no_perm: 'মোছা যায়নি' },
    en: { photos: '📷 Photos', voices: '🎙️ Voices', new_photo: '📷 Post a photo', pick: 'Choose photo', pick_first: 'Choose a photo first', no_photos: 'No photos yet', my_posts: 'My posts', del: 'Delete', del_ask: 'Delete this post?', deleted: 'Deleted', no_posts: 'No posts yet', posts: 'Posts', no_perm: 'Could not delete' }
  };
  const T = k => (S[lang] || S.en)[k] || S.en[k] || k;
  const st = document.createElement('style');
  st.textContent = '.b3row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);text-align:start}'
    + '.b3p{width:38px;height:38px;border-radius:50%;background:var(--accent);color:#fff;flex:none}'
    + '.b3i{flex:1;min-width:0;overflow-wrap:anywhere}.b3d{flex:none;padding:6px 10px;color:var(--danger)}'
    + '.b3img{width:100%;max-height:350px;object-fit:cover;border-radius:12px;margin-top:10px;display:block}'
    + '.phead img, .uav img, .card .phead > img, div[class*="avatar"] img {width:40px !important;height:40px !important;min-width:40px !important;min-height:40px !important;border-radius:50% !important;object-fit:cover !important;flex-shrink:0 !important;}'
    + '.card > img:not(.phead img), .post-img, .post > img {width:100% !important;max-height:350px !important;object-fit:cover !important;border-radius:12px !important;margin:8px 0 !important;display:block !important;}'
    + '.voice-filter-select { background:#1a2234; color:#fff; border:1px solid #26314a; padding:6px; border-radius:8px; margin-left:8px; font-size:12px; outline:none; }'
    + '.reaction-bar { display: none; position: absolute; top: -45px; left: 10px; background: #121826; border: 1px solid #26314a; border-radius: 30px; padding: 4px 8px; gap: 8px; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }'
    + '.reaction-bar span { font-size: 20px; cursor: pointer; transition: transform 0.2s; }'
    + '.reaction-bar span:hover { transform: scale(1.3); }';
  document.head.appendChild(st);

  const pa = new Audio(); let pBtn = null;
  pa.onended = () => { if (pBtn) pBtn.textContent = '▶'; };
  function playBtn(b) {
    try { if (typeof audio !== 'undefined') audio.pause(); } catch (e) {}
    if (pBtn === b && !pa.paused) { pa.pause(); b.textContent = '▶'; return; }
    if (pBtn) pBtn.textContent = '▶';
    pBtn = b; pa.src = b.dataset.src;
    pa.play().then(() => { b.textContent = '⏸'; }).catch(() => toast(t('err') + 'audio'));
  }

  /* ---- Emoji Reaction Bar HTML Builder ---- */
  window.emojiBarHtml = function(postId) {
    return `
      <div class="reaction-bar" id="react-bar-${postId}">
        <span data-react="❤️" data-id="${postId}">❤️</span>
        <span data-react="😂" data-id="${postId}">😂</span>
        <span data-react="😮" data-id="${postId}">😮</span>
        <span data-react="😢" data-id="${postId}">😢</span>
        <span data-react="🔥" data-id="${postId}">🔥</span>
      </div>
    `;
  };

  /* ---- Clicks & Reactions Handler ---- */
  document.addEventListener('click', async e => {
    const g = s => e.target.closest(s);
    let b;
    if ((b = g('.b3p'))) return playBtn(b);
    
    // Toggle Emoji Reaction Bar
    if ((b = g('[data-like]')) || (b = g('[data-plike]'))) {
      const id = b.dataset.like || b.dataset.plike;
      const bar = document.getElementById('react-bar-' + id);
      if (bar) {
        bar.style.display = bar.style.display === 'flex' ? 'none' : 'flex';
      }
      return;
    }

    // Handle Reaction Select
    if (e.target.dataset.react) {
      const emoji = e.target.dataset.react;
      const id = e.target.dataset.id;
      const bar = document.getElementById('react-bar-' + id);
      if (bar) bar.style.display = 'none';
      
      const btn = document.querySelector(`[data-like="${id}"], [data-plike="${id}"]`);
      if (btn) {
        btn.firstChild.textContent = emoji + ' ';
        toast('রিয়্যাকশন দেওয়া হয়েছে ' + emoji);
      }
      return;
    }
  });

  // Inject Voice Filter Selection to Post Sheet
  document.addEventListener('DOMContentLoaded', () => {
    const recContainer = document.getElementById('voice-rec-area');
    if (recContainer && !document.getElementById('v-filter')) {
      recContainer.insertAdjacentHTML('beforeend', `
        <div style="margin-top:10px; font-size:13px; color:#8b97b3;">
          🎭 ভয়েস ফিল্টার: 
          <select class="voice-filter-select" id="v-filter">
            <option value="normal">Normal (স্বাভাবিক)</option>
            <option value="deep">Deep Voice (গম্ভীর)</option>
            <option value="echo">Echo (প্রতিধ্বনি)</option>
          </select>
        </div>
      `);
    }
  });
})();
