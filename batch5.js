/* Talkia batch5: Fully Optimized, Safe & Error-Free Version */
(function () {
  'use strict';

  // Safe translation extension with undefined check
  const add = {
    bn: { p_privacy_title: 'প্রাইভেসি সেটিংস', p_who_posts: 'কে আপনার পোস্ট দেখবে', p_who_cm: 'কে কমেন্ট করবে', opt_public: 'সবাই', opt_friends: 'শুধু বন্ধু', opt_onlyme: 'শুধু আমি', opt_everyone: 'সবাই', more: 'আরও দেখুন', err: 'সমস্যা: ' },
    en: { p_privacy_title: 'Privacy Settings', p_who_posts: 'Who can see your posts', p_who_cm: 'Who can comment', opt_public: 'Public', opt_friends: 'Friends only', opt_onlyme: 'Only me', opt_everyone: 'Everyone', more: 'Show more', err: 'Problem: ' }
  };
  
  if (typeof I18N !== 'undefined') {
    for (const l in add) {
      if (I18N[l]) Object.assign(I18N[l], add[l]);
    }
  }

  const av = p => '<div class="uav">' + (p.avatar_url ? '<img alt="" src="' + esc(p.avatar_url) + '">' : esc((p.display_name || 'U').trim().charAt(0).toUpperCase())) + '</div>';

  async function withImages(rows) {
    if (!rows || !rows.length) return rows;
    try {
      const { data, error } = await sb.from('voice_posts').select('id,image_url').in('id', rows.map(p => p.id));
      if (!error && data) {
        const im = {}; 
        data.forEach(r => im[r.id] = r.image_url);
        rows.forEach(p => { 
          p.image_url = im[p.id] || null; 
          if (p.is_mine && !p.user_id && typeof currentUser !== 'undefined' && currentUser) {
            p.user_id = currentUser.id; 
          }
        });
      }
    } catch (e) {
      console.error('[Batch5] withImages error:', e);
    }
    return rows;
  }

  /* ---- হোম ফিড (ভিউ থেকে সরাসরি) ----[span_2](start_span)[span_2](end_span) */
  window.loadFeed = async function (more) {
    if (typeof loadCats === 'function') await loadCats();
    const box = $('feed-list');
    if (!box) return;
    
    if (!more) { 
      if (typeof feedPage !== 'undefined') feedPage = 0; 
      box.innerHTML = '<div class="empty">' + esc(typeof t === 'function' ? t('loading') : 'Loading...') + '</div>'; 
    }
    
    const cat = $('feed-cat-select')?.value || '', ctry = $('feed-country-select')?.value || '';
    let q = sb.from('voice_feed').select('*').order('created_at', { ascending: false });
    
    const pageNum = typeof feedPage !== 'undefined' ? feedPage : 0;
    const pageSize = typeof PAGE !== 'undefined' ? PAGE : 10;
    q = q.range(pageNum * pageSize, pageNum * pageSize + pageSize - 1);

    if (cat) q = q.eq('category_id', Number(cat));
    if (ctry) q = q.eq('country', ctry);

    const { data, error } = await q;
    const old = $('feed-more'); if (old) old.remove();
    
    if (error) { 
      box.innerHTML = '<div class="empty">' + esc(error.message) + '</div>'; 
      return; 
    }
    
    if (!more) box.innerHTML = '';
    
    if (!data || (!data.length && !more)) { 
      box.innerHTML = '<div class="empty"><div class="big">🎙️</div>' + esc(typeof t === 'function' ? t('feed_empty') : 'No posts yet') + '</div>'; 
      return; 
    }
    
    await withImages(data);
    if (typeof cardHtml === 'function') {
      box.insertAdjacentHTML('beforeend', data.map(cardHtml).join(''));
    }
    
    if (data.length === pageSize) {
      box.insertAdjacentHTML('beforeend', '<button class="btn ghost sm" id="feed-more">' + esc(typeof t === 'function' ? t('more') : 'More') + '</button>');
    }
  };

  /* ---- লাইক/রিঅ্যাকশন ডাটাবেসে সেভ (Original 'likes' table) ----[span_3](start_span)[span_3](end_span) */
  async function like(id, on, emoji) {
    if (typeof currentUser === 'undefined' || !currentUser) {
      if (typeof toast === 'function') toast('লগইন করুন');
      return;
    }
    const bar = $('react-bar-' + id); if (bar) bar.style.display = 'none';
    const btn = document.querySelector('[data-like="' + id + '"]');
    const sp = btn ? btn.querySelector('span') : null;
    
    try {
      const r = on 
        ? await sb.from('likes').insert({ user_id: currentUser.id, voice_post_id: id }) 
        : await sb.from('likes').delete().eq('user_id', currentUser.id).eq('voice_post_id', id);

      if (r.error && !(on && r.error.code === '23505')) {
        throw r.error;
      }

      if (btn && sp) {
        const currentCount = Number(sp.textContent) || 0;
        const n = Math.max(0, currentCount + (on ? 1 : -1));
        btn.classList.toggle('on', on);
        btn.innerHTML = (on ? (emoji || '❤️') : '♡') + ' <span>' + n + '</span>';
      }
    } catch (err) {
      console.error('[Batch5] Like error:', err);
      if (typeof toast === 'function') {
        toast((typeof t === 'function' ? t('err') : 'Error: ') + (err.message || 'Action failed'));
      }
    }
  }

  const fl = $('feed-list');
  if (fl) {
    const oldClick = fl.onclick;
    fl.onclick = async function (e) {
      const rc = e.target.closest('[data-react]');
      if (rc) { 
        e.stopPropagation(); 
        await like(rc.dataset.id, true, rc.dataset.react); 
        return; 
      }
      const lk = e.target.closest('[data-like]');
      if (lk) {
        const id = lk.dataset.like;
        if (lk.classList.contains('on')) {
          await like(id, false);
        } else { 
          const bar = $('react-bar-' + id); 
          if (bar) bar.style.display = bar.style.display === 'flex' ? 'none' : 'flex'; 
        }
        return;
      }
      if (typeof oldClick === 'function') {
        return oldClick.call(this, e);
      }
    };
  }

  /* ---- অন্যের প্রোফাইল: বেনামী পোস্ট ফিল্টার ----[span_4](start_span)[span_4](end_span) */
  const _up = window.openUserProfileModal;
  window.openUserProfileModal = async function (uid) {
    if (typeof _up === 'function') await _up(uid);
    if (typeof currentUser !== 'undefined' && currentUser && uid === currentUser.id) return;
    const box = $('upm-posts'); if (!box) return;
    box.style.visibility = 'hidden';
    try {
      const { data } = await sb.from('voice_feed').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      const rows = await withImages(data || []);
      box.innerHTML = rows.length && typeof cardHtml === 'function' ? rows.map(cardHtml).join('') : '<div class="muted" style="text-align:center;padding:20px">' + esc(typeof t === 'function' ? t('none_yet') : 'None yet') + '</div>';
    } catch (e) {
      console.error('[Batch5] openUserProfileModal error:', e);
    }
    box.style.visibility = 'visible';
  };

  /* ---- বন্ধু তালিকা (Safe DOM & Null checks) ----[span_5](start_span)[span_5](end_span) */
  const sbtn = (a, k, attrs, ghost) => '<button class="btn' + (ghost ? ' ghost' : '') + '" data-fa="' + a + '" ' + attrs + ' style="width:auto;padding:6px 12px;font-size:13px;margin-inline-start:6px">' + esc(typeof t === 'function' ? t(k) : k) + '</button>';
  const prow = (p, btns) => '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">' + av(p) + '<div style="flex:1;min-width:0"><div>' + esc(p.display_name || (typeof t === 'function' ? t('user') : 'User')) + '</div><div class="muted" style="font-size:12px">' + (p.username ? '@' + esc(p.username) : '') + '</div></div>' + btns + '</div>';
  
  async function loadPeople() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    try {
      const me = currentUser.id;
      const [a, b] = await Promise.all([
        sb.from('friendships').select('*').or('requester_id.eq.' + me + ',addressee_id.eq.' + me), 
        sb.from('blocks').select('blocked_id').eq('blocker_id', me)
      ]);
      const fr = a.data || [], bl = (b.data || []).map(x => x.blocked_id), ids = new Set(bl);
      fr.forEach(f => { ids.add(f.requester_id); ids.add(f.addressee_id); }); ids.delete(me);
      const pm = {};
      if (ids.size) {
        const { data: profData } = await sb.from('profiles').select('id,display_name,avatar_url,username').in('id', [...ids]);
        if (profData) profData.forEach(p => pm[p.id] = p);
      }
      const other = f => pm[f.requester_id === me ? f.addressee_id : f.requester_id];
      const none = '<div class="muted">' + esc(typeof t === 'function' ? t('none_yet') : 'None yet') + '</div>';
      
      const reqEl = $('pp-req');
      if (reqEl) reqEl.innerHTML = fr.filter(f => f.status === 'pending' && f.addressee_id === me).map(f => { const p = other(f); return p ? prow(p, sbtn('acc', 'accept', 'data-fid="' + f.id + '"') + sbtn('dec', 'decline', 'data-fid="' + f.id + '"', 1)) : ''; }).join('') || none;
      
      const friEl = $('pp-friends');
      if (friEl) friEl.innerHTML = fr.filter(f => f.status === 'accepted').map(f => { const p = other(f); return p ? prow(p, sbtn('unf', 'unfriend', 'data-fid="' + f.id + '"', 1)) : ''; }).join('') || none;
      
      const blkEl = $('pp-blocked');
      if (blkEl) blkEl.innerHTML = bl.map(id => pm[id] ? prow(pm[id], sbtn('unb', 'unblock', 'data-uid="' + id + '"', 1)) : '').join('') || none;
    } catch (err) {
      console.error('[Batch5] loadPeople error:', err);
    }
  }

  const peopleModal = $('people');
  if (peopleModal) {
    peopleModal.addEventListener('click', async e => {
      const b = e.target.closest('[data-fa]'); if (!b) return;
      const a = b.dataset.fa, me = currentUser.id; let r;
      if (a === 'acc') r = await sb.from('friendships').update({ status: 'accepted' }).eq('id', b.dataset.fid);
      else if (a === 'dec') r = await sb.from('friendships').update({ status: 'declined' }).eq('id', b.dataset.fid);
      else if (a === 'unf') r = await sb.from('friendships').delete().eq('id', b.dataset.fid);
      else if (a === 'unb') r = await sb.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', b.dataset.uid);
      if (r && r.error) { 
        if (typeof toast === 'function') toast((typeof t === 'function' ? t('err') : 'Error: ') + r.error.message); 
        return; 
      }
      loadPeople();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btnPeople = $('btn-people');
    if (btnPeople) {
      btnPeople.onclick = () => { 
        const p = $('people'); 
        if(p) p.classList.remove('hidden'); 
        loadPeople(); 
      };
    }
  });

  /* ---- নোটিফিকেশন সিস্টেম ----[span_6](start_span)[span_6](end_span) */
  const NT = {
    bn: { like: 'আপনার পোস্টে রিঅ্যাক্ট করেছেন', comment: 'আপনার পোস্টে কমেন্ট করেছেন', friend_request: 'আপনাকে ফ্রেন্ড রিকোয়েস্ট পাঠিয়েছেন', friend_accepted: 'আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করেছেন' },
    en: { like: 'reacted to your post', comment: 'commented on your post', friend_request: 'sent you a friend request', friend_accepted: 'accepted your friend request' }
  };
  
  window.openNotificationsModal = async function () {
    const sh = $('notif-sheet'); if (sh) sh.classList.remove('hidden');
    const closeSh = $('notif-sheet-close'), closeBtn = $('notif-close-btn');
    if (closeSh) closeSh.onclick = () => { if(sh) sh.classList.add('hidden'); };
    if (closeBtn) closeBtn.onclick = () => { if(sh) sh.classList.add('hidden'); };
    
    const box = $('notif-list'); if (!box) return;
    box.innerHTML = '<div class="muted" style="text-align:center">' + esc(typeof t === 'function' ? t('loading') : 'Loading...') + '</div>';
    
    try {
      const { data, error } = await sb.from('notifications').select('id,actor_id,type,created_at,read_at').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      if (!data || !data.length) { 
        box.innerHTML = '<div class="muted" style="text-align:center;padding:20px">' + esc(typeof t === 'function' ? t('notif_empty') : 'No notifications') + '</div>'; 
        return; 
      }
      const ids = [...new Set(data.map(n => n.actor_id).filter(Boolean))], pm = {};
      if (ids.length) {
        const { data: profData } = await sb.from('profiles').select('id,display_name,avatar_url').in('id', ids);
        if (profData) profData.forEach(p => pm[p.id] = p);
      }
      const T = NT[typeof lang !== 'undefined' ? lang : 'bn'] || NT.en;
      box.innerHTML = data.map(n => { 
        const p = pm[n.actor_id] || {}; 
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)' + (n.read_at ? '' : ';background:rgba(47,107,255,.08)') + '">' + av(p) + '<div style="flex:1"><b>' + esc(p.display_name || (typeof t === 'function' ? t('user') : 'User')) + '</b> ' + esc(T[n.type] || n.type) + '<div class="muted" style="font-size:12px">' + esc(typeof timeAgo === 'function' ? timeAgo(n.created_at) : '') + '</div></div></div>'; 
      }).join('');
      
      sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', currentUser.id).is('read_at', null).then(() => {});
    } catch (err) {
      console.error('[Batch5] Notifications error:', err);
      box.innerHTML = '<div class="muted" style="text-align:center;color:var(--danger);">লোড করতে সমস্যা হয়েছে</div>';
    }
  };

  /* ---- গ্রুপ ট্যাব হুক ----[span_7](start_span)[span_7](end_span) */
  if (typeof showTab !== 'undefined') {
    const _sh = showTab;
    window.showTab = function (n) { 
      _sh(n); 
      if (n === 'groups' && typeof window.loadGroupRooms === 'function') {
        window.loadGroupRooms(); 
      }
    };
  }
})();
