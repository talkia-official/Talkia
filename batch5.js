/* Talkia batch5: Fully Optimized & Error-Free Version */
(function () {
  const add = {
    bn: { p_privacy_title: 'প্রাইভেসি সেটিংস', p_who_posts: 'কে আপনার পোস্ট দেখবে', p_who_cm: 'কে কমেন্ট করবে', opt_public: 'সবাই', opt_friends: 'শুধু বন্ধু', opt_onlyme: 'শুধু আমি', opt_everyone: 'সবাই', more: 'আরও দেখুন', err: 'সমস্যা: ' },
    en: { p_privacy_title: 'Privacy Settings', p_who_posts: 'Who can see your posts', p_who_cm: 'Who can comment', opt_public: 'Public', opt_friends: 'Friends only', opt_onlyme: 'Only me', opt_everyone: 'Everyone', more: 'Show more', err: 'Problem: ' }
  };
  for (const l in add) if (typeof I18N !== 'undefined' && I18N[l]) Object.assign(I18N[l], add[l]);

  const av = p => '<div class="uav">' + (p.avatar_url ? '<img alt="" src="' + esc(p.avatar_url) + '">' : esc((p.display_name || 'U').trim().charAt(0).toUpperCase())) + '</div>';

  async function withImages(rows) {
    if (!rows || !rows.length) return rows;
    const { data } = await sb.from('voice_posts').select('id,image_url').in('id', rows.map(p => p.id));
    const im = {}; (data || []).forEach(r => im[r.id] = r.image_url);
    rows.forEach(p => { p.image_url = im[p.id] || null; if (p.is_mine && !p.user_id) p.user_id = currentUser.id; });
    return rows;
  }

  /* ---- হোম ফিড (ভিউ থেকে সরাসরি, জোড়া ছাড়া) ---- */
  if (typeof loadFeed === 'undefined') {
    loadFeed = async function (more) {
      if (typeof loadCats === 'function') await loadCats();
      const box = $('feed-list');
      if (!box) return;
      if (!more) { feedPage = 0; box.innerHTML = '<div class="empty">' + esc(t('loading')) + '</div>'; }
      const cat = $('feed-cat-select')?.value || '', ctry = $('feed-country-select')?.value || '';
      let q = sb.from('voice_feed').select('*').order('created_at', { ascending: false }).range(feedPage * PAGE, feedPage * PAGE + PAGE - 1);
      if (cat) q = q.eq('category_id', Number(cat));
      if (ctry) q = q.eq('country', ctry);
      const { data, error } = await q;
      const old = $('feed-more'); if (old) old.remove();
      if (error) { box.innerHTML = '<div class="empty">' + esc(error.message) + '</div>'; return; }
      if (!more) box.innerHTML = '';
      if (!data || (!data.length && !more)) { box.innerHTML = '<div class="empty"><div class="big">🎙️</div>' + esc(t('feed_empty')) + '</div>'; return; }
      await withImages(data);
      box.insertAdjacentHTML('beforeend', data.map(cardHtml).join(''));
      if (data.length === PAGE) box.insertAdjacentHTML('beforeend', '<button class="btn ghost sm" id="feed-more">' + esc(t('more')) + '</button>');
    };
  }

  /* ---- লাইক/রিঅ্যাকশন ডাটাবেসে সেভ ---- */
  async function like(id, on, emoji) {
    const bar = $('react-bar-' + id); if (bar) bar.style.display = 'none';
    const btn = document.querySelector('[data-like="' + id + '"]'), sp = btn && btn.querySelector('span');
    const r = on ? await sb.from('likes').insert({ user_id: currentUser.id, voice_post_id: id }) : await sb.from('likes').delete().eq('user_id', currentUser.id).eq('voice_post_id', id);
    if (r.error && !(on && r.error.code === '23505')) { toast(t('err') + r.error.message); return; }
    if (btn && sp) { const n = Math.max(0, Number(sp.textContent) + (on ? 1 : -1)); btn.classList.toggle('on', on); btn.innerHTML = (on ? (emoji || '❤️') : '♡') + ' <span>' + n + '</span>'; }
  }

  const fl = $('feed-list');
  if (fl) {
    const oldClick = fl.onclick;
    fl.onclick = async function (e) {
      const rc = e.target.closest('[data-react]');
      if (rc) { e.stopPropagation(); await like(rc.dataset.id, true, rc.dataset.react); return; }
      const lk = e.target.closest('[data-like]');
      if (lk) {
        const id = lk.dataset.like;
        if (lk.classList.contains('on')) await like(id, false);
        else { const bar = $('react-bar-' + id); if (bar) bar.style.display = bar.style.display === 'flex' ? 'none' : 'flex'; }
        return;
      }
      if (typeof oldClick === 'function') return oldClick.call(this, e);
    };
  }

  /* ---- অন্যের প্রোফাইল: বেনামী পোস্ট বাদ ---- */
  const _up = window.openUserProfileModal;
  window.openUserProfileModal = async function (uid) {
    if (typeof _up === 'function') await _up(uid);
    if (currentUser && uid === currentUser.id) return;
    const box = $('upm-posts'); if (!box) return;
    box.style.visibility = 'hidden';
    const { data } = await sb.from('voice_feed').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    const rows = await withImages(data || []);
    box.innerHTML = rows.length ? rows.map(cardHtml).join('') : '<div class="muted" style="text-align:center;padding:20px">' + esc(t('none_yet')) + '</div>';
    box.style.visibility = 'visible';
  };

  /* ---- বন্ধু তালিকা ---- */
  const sbtn = (a, k, attrs, ghost) => '<button class="btn' + (ghost ? ' ghost' : '') + '" data-fa="' + a + '" ' + attrs + ' style="width:auto;padding:6px 12px;font-size:13px;margin-inline-start:6px">' + esc(t(k)) + '</button>';
  const prow = (p, btns) => '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">' + av(p) + '<div style="flex:1;min-width:0"><div>' + esc(p.display_name || t('user')) + '</div><div class="muted" style="font-size:12px">' + (p.username ? '@' + esc(p.username) : '') + '</div></div>' + btns + '</div>';
  
  async function loadPeople() {
    if (!currentUser) return;
    const me = currentUser.id;
    const [a, b] = await Promise.all([sb.from('friendships').select('*').or('requester_id.eq.' + me + ',addressee_id.eq.' + me), sb.from('blocks').select('blocked_id').eq('blocker_id', me)]);
    const fr = a.data || [], bl = (b.data || []).map(x => x.blocked_id), ids = new Set(bl);
    fr.forEach(f => { ids.add(f.requester_id); ids.add(f.addressee_id); }); ids.delete(me);
    const pm = {};
    if (ids.size) ((await sb.from('profiles').select('id,display_name,avatar_url,username').in('id', [...ids])).data || []).forEach(p => pm[p.id] = p);
    const other = f => pm[f.requester_id === me ? f.addressee_id : f.requester_id];
    const none = '<div class="muted">' + esc(t('none_yet')) + '</div>';
    
    const reqEl = $('pp-req');
    if (reqEl) reqEl.innerHTML = fr.filter(f => f.status === 'pending' && f.addressee_id === me).map(f => { const p = other(f); return p ? prow(p, sbtn('acc', 'accept', 'data-fid="' + f.id + '"') + sbtn('dec', 'decline', 'data-fid="' + f.id + '"', 1)) : ''; }).join('') || none;
    
    const friEl = $('pp-friends');
    if (friEl) friEl.innerHTML = fr.filter(f => f.status === 'accepted').map(f => { const p = other(f); return p ? prow(p, sbtn('unf', 'unfriend', 'data-fid="' + f.id + '"', 1)) : ''; }).join('') || none;
    
    const blkEl = $('pp-blocked');
    if (blkEl) blkEl.innerHTML = bl.map(id => pm[id] ? prow(pm[id], sbtn('unb', 'unblock', 'data-uid="' + id + '"', 1)) : '').join('') || none;
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
      if (r && r.error) { toast(t('err') + r.error.message); return; }
      loadPeople();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btnPeople = $('btn-people');
    if (btnPeople) btnPeople.onclick = () => { const p = $('people'); if(p) p.classList.remove('hidden'); loadPeople(); };
  });

  /* ---- নোটিফিকেশন ---- */
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
    box.innerHTML = '<div class="muted" style="text-align:center">' + esc(t('loading')) + '</div>';
    const { data, error } = await sb.from('notifications').select('id,actor_id,type,created_at,read_at').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(30);
    if (error) { box.textContent = error.message; return; }
    if (!data.length) { box.innerHTML = '<div class="muted" style="text-align:center;padding:20px">' + esc(t('notif_empty')) + '</div>'; return; }
    const ids = [...new Set(data.map(n => n.actor_id).filter(Boolean))], pm = {};
    if (ids.length) ((await sb.from('profiles').select('id,display_name,avatar_url').in('id', ids)).data || []).forEach(p => pm[p.id] = p);
    const T = NT[lang] || NT.en;
    box.innerHTML = data.map(n => { const p = pm[n.actor_id] || {}; return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)' + (n.read_at ? '' : ';background:rgba(47,107,255,.08)') + '">' + av(p) + '<div style="flex:1"><b>' + esc(p.display_name || t('user')) + '</b> ' + esc(T[n.type] || n.type) + '<div class="muted" style="font-size:12px">' + esc(timeAgo(n.created_at)) + '</div></div></div>'; }).join('');
    sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', currentUser.id).is('read_at', null).then(() => {});
  };

  /* ---- গ্রুপ ট্যাব খুললে রুম লোড ---- */
  if (typeof showTab !== 'undefined') {
    const _sh = showTab;
    showTab = function (n) { _sh(n); if (n === 'groups' && window.loadGroupRooms) window.loadGroupRooms(); };
  }
})();
