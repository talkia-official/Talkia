/* Talkia batch3: ফটো পোস্ট, ভয়েস কমেন্ট, ভয়েস পরিচয়, কভার ছবি, বন্ধুর প্রোফাইলে পোস্ট, আমার পোস্ট, মুছা, শেয়ার */
(function () {
  const S = {
    bn: { photos: '📷 ফটো', voices: '🎙️ ভয়েস', new_photo: '📷 ফটো পোস্ট করুন', pick: 'ছবি বাছুন', pick_first: 'আগে একটা ছবি বাছুন', no_photos: 'এখনো কোনো ফটো নেই', my_posts: 'আমার পোস্ট', del: 'মুছুন', del_ask: 'এই পোস্ট মুছবেন?', deleted: 'মুছে গেছে', no_posts: 'এখনো কোনো পোস্ট নেই', posts: 'পোস্ট', no_perm: 'মোছা যায়নি (SQL পলিসি লাগবে)', intro: '🎙️ ভয়েস পরিচয় (১০ সেকেন্ড)', cover: '🖼️ কভার ছবি', copied: 'লিংক কপি হয়েছে', intro_h: 'ভয়েস পরিচয়' },
    en: { photos: '📷 Photos', voices: '🎙️ Voices', new_photo: '📷 Post a photo', pick: 'Choose photo', pick_first: 'Choose a photo first', no_photos: 'No photos yet', my_posts: 'My posts', del: 'Delete', del_ask: 'Delete this post?', deleted: 'Deleted', no_posts: 'No posts yet', posts: 'Posts', no_perm: 'Could not delete (SQL policy needed)', intro: '🎙️ Voice intro (10s)', cover: '🖼️ Cover photo', copied: 'Link copied', intro_h: 'Voice intro' }
  };
  const T = k => (S[lang] || S.en)[k] || S.en[k] || k;
  const st = document.createElement('style');
  st.textContent = '.b3row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);text-align:start}'
    + '.b3p{width:38px;height:38px;border-radius:50%;background:var(--accent);color:#fff;flex:none}'
    + '.b3i{flex:1;min-width:0;overflow-wrap:anywhere}.b3d{flex:none;padding:6px 10px;color:var(--danger)}'
    + '.b3img{width:100%;max-height:350px;object-fit:cover;border-radius:12px;margin-top:10px;display:block}'
    + '.b3th{width:46px;height:46px;border-radius:8px;object-fit:cover;flex:none}'
    + '.b3cov{width:100%;height:120px;object-fit:cover;border-radius:14px;margin-bottom:12px;display:block}'
    /* ১. পোস্টের উপরের লেখকের প্রোফাইল পিকচার ছোট (40px) ও গোল করার রুল */
    + '.phead img, .uav img, .card .phead > img, div[class*="avatar"] img {width:40px !important;height:40px !important;min-width:40px !important;min-height:40px !important;border-radius:50% !important;object-fit:cover !important;flex-shrink:0 !important;}'
    /* ২. পোস্টের ভেতরের মূল পিকচার যেন কেটে না যায় এবং সুন্দর ৩৫০ পিক্সেল মাপে দেখায় */
    + '.card > img:not(.phead img), .post-img, .post > img {width:100% !important;max-height:350px !important;object-fit:cover !important;border-radius:12px !important;margin:8px 0 !important;display:block !important;}';
  document.head.appendChild(st);

  /* ---- helpers ---- */
  const pa = new Audio(); let pBtn = null;
  pa.onended = () => { if (pBtn) pBtn.textContent = '▶'; };
  function playBtn(b) {
    try { audio.pause(); } catch (e) {}
    if (pBtn === b && !pa.paused) { pa.pause(); b.textContent = '▶'; return; }
    if (pBtn) pBtn.textContent = '▶';
    pBtn = b; pa.src = b.dataset.src;
    pa.play().then(() => { b.textContent = '⏸'; }).catch(() => toast(t('err') + 'audio'));
  }
  const pBtnHtml = u => '<button class="b3p" data-src="' + esc(u) + '">▶</button>';
  let R = null;
  async function recToggle(btn, max, done) {
    if (R && R.state === 'recording') { R.stop(); return; }
    let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { toast(t('mic_err')); return; }
    const mime = pickMime(), mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream), ch = []; let s = 0;
    const label = btn.textContent; R = mr;
    mr.ondataavailable = e => { if (e.data && e.data.size) ch.push(e.data); };
    const tm = setInterval(() => { s++; btn.textContent = '⏹ ' + s + 's'; if (s >= max) mr.stop(); }, 1000);
    mr.onstop = () => {
      clearInterval(tm); stream.getTracks().forEach(x => x.stop()); btn.textContent = label; R = null;
      const ty = (mr.mimeType || mime || 'audio/webm').split(';')[0];
      done(new Blob(ch, { type: ty }), Math.min(max, Math.max(1, s)));
    };
    mr.start(); btn.textContent = '⏹ 0s';
  }
  const ext = ty => ty.includes('mp4') ? 'm4a' : ty.includes('aac') ? 'aac' : 'webm';
  async function upAudio(blob, pre) {
    const path = currentUser.id + '/' + pre + Date.now() + '.' + ext(blob.type);
    const r = await sb.storage.from('audio').upload(path, blob, { contentType: blob.type });
    if (r.error) throw r.error;
    return sb.storage.from('audio').getPublicUrl(path).data.publicUrl;
  }
  async function upImage(blob, name, upsert) {
    const path = currentUser.id + '/' + name;
    const r = await sb.storage.from('images').upload(path, blob, { contentType: 'image/jpeg', upsert: !!upsert });
    if (r.error) throw r.error;
    return sb.storage.from('images').getPublicUrl(path).data.publicUrl;
  }
  function shrink(file, maxW, ratio) {
    return new Promise((ok, no) => {
      const im = new Image(), u = URL.createObjectURL(file);
      im.onload = () => {
        let sx = 0, sy = 0, sw = im.width, sh = im.height;
        if (ratio) { if (sw / sh > ratio) { const nw = sh * ratio; sx = (sw - nw) / 2; sw = nw; } else { const nh = sw / ratio; sy = (sh - nh) / 2; sh = nh; } }
        const ow = Math.min(maxW, sw), oh = Math.round(ow * sh / sw), c = document.createElement('canvas');
        c.width = ow; c.height = oh; c.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, ow, oh);
        URL.revokeObjectURL(u); c.toBlob(b => b ? ok(b) : no(new Error('img')), 'image/jpeg', 0.82);
      };
      im.onerror = () => { URL.revokeObjectURL(u); no(new Error('img')); };
      im.src = u;
    });
  }
  function pickImg(cb) {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
    i.onchange = () => { if (i.files && i.files[0]) cb(i.files[0]); }; i.click();
  }
  const dt = s => new Date(s).toLocaleDateString();
  const nameOf = p => p ? (p.display_name || t('user')) : t('user');

  /* ---- delete ---- */
  async function del(kind, id, url) {
    if (!confirm(T('del_ask'))) return;
    const tb = kind === 'p' ? 'photo_posts' : 'voice_posts';
    const { data, error } = await sb.from(tb).delete().eq('id', id).eq('user_id', currentUser.id).select('id');
    if (error) { toast(t('err') + error.message); return; }
    if (!data || !data.length) { toast(T('no_perm')); return; }
    try {
      const bk = kind === 'p' ? 'images' : 'audio', path = decodeURIComponent((url.split('/' + bk + '/')[1] || '').split('?')[0]);
      if (path) await sb.storage.from(bk).remove([path]);
    } catch (e) {}
    toast(T('deleted'));
    document.querySelectorAll('[data-id="' + id + '"],[data-pid="' + id + '"]').forEach(e => e.remove());
    loadMine();
  }

  /* ---- post lists (my posts / friend profile) ---- */
  const vrow = (p, mine) => '<div class="b3row">' + pBtnHtml(p.audio_url) + '<div class="b3i"><div>' + esc(p.caption || '🎙️') + '</div><div class="muted" style="font-size:12px">' + esc(fmt(p.duration_seconds || 0)) + ' · ' + dt(p.created_at) + (p.is_anonymous ? ' · ' + esc(t('anon')) : '') + '</div></div>'
    + (mine ? '<button class="b3d" data-del="' + esc(p.id) + '" data-url="' + esc(p.audio_url) + '">🗑</button>' : '') + '</div>';
  const prow = (p, mine) => '<div class="b3row"><img class="b3th" src="' + esc(p.image_url) + '" alt=""><div class="b3i"><div>' + esc(p.caption || '📷') + '</div><div class="muted" style="font-size:12px">' + dt(p.created_at) + '</div></div>'
    + (mine ? '<button class="b3d" data-pdel="' + esc(p.id) + '" data-url="' + esc(p.image_url) + '">🗑</button>' : '') + '</div>';
  async function postsHtml(uid, mine) {
    let vq = sb.from('voice_posts').select('id,audio_url,duration_seconds,caption,is_anonymous,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(20);
    if (!mine) vq = vq.eq('is_anonymous', false);
    const [v, p] = await Promise.all([vq, sb.from('photo_posts').select('id,image_url,caption,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(20)]);
    const a = (v.data || []).map(x => vrow(x, mine)).join(''), b = (p.data || []).map(x => prow(x, mine)).join('');
    return '<div class="sec-h">' + esc(mine ? T('my_posts') : T('posts')) + '</div>' + (a + b || '<div class="muted">' + esc(T('no_posts')) + '</div>');
  }
  async function loadMine() {
    let box = $('b3-mine');
    if (!box) { box = document.createElement('div'); box.id = 'b3-mine'; box.style.textAlign = 'start'; $('tab-profile').appendChild(box); }
    box.innerHTML = await postsHtml(currentUser.id, true);
  }

  /* ---- profile: cover + voice intro ---- */
  const prof = $('tab-profile').querySelector('.profile-top');
  prof.insertAdjacentHTML('afterbegin', '<div id="b3-cover"></div>');
  $('btn-people').insertAdjacentHTML('afterend', '<div style="margin-top:10px"><button class="btn ghost" id="b3-intro">' + esc(T('intro')) + '</button> <button class="btn ghost" id="b3-covbtn">' + esc(T('cover')) + '</button></div><div id="b3-introplay" style="margin-top:10px"></div>');
  function paintMe() {
    const p = currentProfile || {};
    $('b3-cover').innerHTML = p.cover_url ? '<img class="b3cov" alt="" src="' + esc(p.cover_url) + '">' : '';
    $('b3-introplay').innerHTML = p.voice_intro_url ? pBtnHtml(p.voice_intro_url) + ' <span class="muted">' + esc(T('intro_h')) + ' · ' + Number(p.voice_intro_seconds || 0) + 's</span>' : '';
  }
  const _rp = renderProfile; renderProfile = function () { _rp(); paintMe(); };
  $('b3-intro').onclick = e => recToggle(e.currentTarget, 10, async (blob, s) => {
    try {
      const url = await upAudio(blob, 'intro-');
      const { error } = await sb.from('profiles').update({ voice_intro_url: url, voice_intro_seconds: s }).eq('id', currentUser.id);
      if (error) throw error; await loadProfile(); toast(t('saved'));
    } catch (err) { toast(t('err') + (err.message || err)); }
  });
  $('b3-covbtn').onclick = () => pickImg(async f => {
    toast(t('uploading'));
    try {
      const url = await upImage(await shrink(f, 1200, 3), 'cover.jpg', true) + '?v=' + Date.now();
      const { error } = await sb.from('profiles').update({ cover_url: url }).eq('id', currentUser.id);
      if (error) throw error; await loadProfile(); toast(t('saved'));
    } catch (err) { toast(t('upload_fail') + (err.message || err)); }
  });

  /* ---- friend profile ---- */
  const _ou = openUser;
  openUser = async function (uid) {
    await _ou(uid);
    if (typeof relOf === 'function' && relOf(uid).s === 'blocked') return;
    const c = $('user-close'); if (!c) return;
    const ex = await sb.from('profiles').select('cover_url,voice_intro_url,voice_intro_seconds').eq('id', uid).maybeSingle();
    const x = ex.data || {}, d = document.createElement('div'); d.style.textAlign = 'start';
    d.innerHTML = (x.voice_intro_url ? '<div class="b3row">' + pBtnHtml(x.voice_intro_url) + '<div class="b3i">' + esc(T('intro_h')) + '</div></div>' : '') + await postsHtml(uid, false);
    c.before(d);
    if (x.cover_url) $('user-in').insertAdjacentHTML('afterbegin', '<img class="b3cov" alt="" src="' + esc(x.cover_url) + '">');
  };

  /* ---- feed: share + delete on voice cards ---- */
  const _ch = cardHtml;
  cardHtml = function (p) {
    const h = _ch(p), i = h.lastIndexOf('</div></div>');
    const extra = '<button data-share="' + esc(p.caption || '') + '">🔗</button>' + (p.is_mine ? '<button data-del="' + esc(p.id) + '" data-url="' + esc(p.audio_url) + '">🗑</button>' : '');
    return h.slice(0, i) + extra + h.slice(i);
  };

  /* ---- photo feed ---- */
  let fm = 'v';
  $('tab-feed').querySelector('h2').insertAdjacentHTML('afterend', '<div class="chips"><button class="chip on" data-m="v">' + esc(T('voices')) + '</button><button class="chip" data-m="p">' + esc(T('photos')) + '</button></div><div id="b3-ph" class="hidden"><button class="btn ghost sm" id="b3-newp">' + esc(T('new_photo')) + '</button><div id="b3-phl"></div></div>');
  function setMode(m) {
    fm = m;
    document.querySelectorAll('[data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === m));
    $('feed-filters').classList.toggle('hidden', m === 'p'); $('feed-list').classList.toggle('hidden', m === 'p'); $('b3-ph').classList.toggle('hidden', m !== 'p');
    if (m === 'p') loadPhotos();
  }
  const phCard = (p, pr, lk, cm) => {
    const liked = lk.some(l => l.user_id === currentUser.id);
    return '<div class="card post" data-pid="' + esc(p.id) + '"><div class="phead">' + uav(pr || {}) + '<div><div>' + esc(nameOf(pr)) + '</div><div class="muted" style="font-size:12px">' + dt(p.created_at) + '</div></div></div>'
      + (p.caption ? '<div>' + esc(p.caption) + '</div>' : '') + '<img class="b3img" loading="lazy" alt="" src="' + esc(p.image_url) + '">'
      + '<div class="acts"><button data-plike="' + esc(p.id) + '" class="' + (liked ? 'on' : '') + '">' + (liked ? '♥' : '♡') + ' <span>' + lk.length + '</span></button><button data-pcm="' + esc(p.id) + '">💬 <span>' + cm + '</span></button><button data-share="' + esc(p.caption || '') + '">🔗</button>'
      + (p.user_id === currentUser.id ? '<button data-pdel="' + esc(p.id) + '" data-url="' + esc(p.image_url) + '">🗑</button>' : '') + '</div></div>';
  };
  async function loadPhotos() {
    const box = $('b3-phl'); box.innerHTML = '<div class="empty">' + esc(t('loading')) + '</div>';
    try { await loadRelations(); } catch (e) {}
    const { data, error } = await sb.from('photo_posts').select('id,user_id,image_url,caption,created_at').order('created_at', { ascending: false }).limit(30);
    if (error) { box.textContent = error.message; return; }
    const bl = new Set(rel.blocks.map(b => b.blocked_id)), ps = (data || []).filter(p => !bl.has(p.user_id));
    if (!ps.length) { box.innerHTML = '<div class="empty"><div class="big">📷</div>' + esc(T('no_photos')) + '</div>'; return; }
    const ids = ps.map(p => p.id), uids = [...new Set(ps.map(p => p.user_id))];
    const [a, b, c] = await Promise.all([sb.from('profiles').select('id,display_name,avatar_url').in('id', uids), sb.from('likes').select('photo_post_id,user_id').in('photo_post_id', ids), sb.from('comments').select('photo_post_id').in('photo_post_id', ids)]);
    const pm = {}; (a.data || []).forEach(p => pm[p.id] = p);
    box.innerHTML = ps.map(p => phCard(p, pm[p.user_id], (b.data || []).filter(l => l.photo_post_id === p.id), (c.data || []).filter(x => x.photo_post_id === p.id).length)).join('');
  }
  const _st = showTab;
  showTab = function (n) { _st(n); if (n === 'feed' && fm === 'p') loadPhotos(); if (n === 'profile') loadMine(); };

  /* ---- new photo sheet ---- */
  let pf = null;
  const sh = document.createElement('div'); sh.id = 'b3-psheet'; sh.className = 'sheet hidden';
  sh.innerHTML = '<div class="sheet-in" style="text-align:start"><h3 style="text-align:center">' + esc(T('new_photo')) + '</h3><button class="btn ghost" id="b3-pick" type="button">' + esc(T('pick')) + '</button><img id="b3-prev" class="b3img hidden" alt="">'
    + '<div class="field" style="margin-top:12px"><input id="b3-cap" type="text" maxlength="120" placeholder="' + esc(t('rec_cap')) + '"></div><div class="field"><select id="b3-cat"></select></div><div class="field"><select id="b3-ctry"></select></div>'
    + '<div id="b3-msg" class="msg"></div><button class="btn" id="b3-post" type="button">' + esc(t('rec_post')) + '</button><button class="btn ghost sm" id="b3-pclose" type="button">' + esc(t('close')) + '</button></div>';
  document.body.appendChild(sh);
  $('b3-newp').onclick = async () => {
    await loadCats(); pf = null; $('b3-prev').classList.add('hidden'); $('b3-cap').value = ''; $('b3-msg').textContent = '';
    $('b3-cat').innerHTML = opts(cats, c => c.id, catName); $('b3-ctry').innerHTML = opts(COUNTRIES, x => x, x => t('c_' + x)); $('b3-ctry').value = 'BD';
    sh.classList.remove('hidden');
  };
  $('b3-pclose').onclick = () => sh.classList.add('hidden');
  $('b3-pick').onclick = () => pickImg(f => { pf = f; const p = $('b3-prev'); p.src = URL.createObjectURL(f); p.classList.remove('hidden'); });
  $('b3-post').onclick = async () => {
    const m = $('b3-msg'); m.textContent = '';
    if (!pf) { m.textContent = T('pick_first'); return; }
    $('b3-post').disabled = true;
    try {
      const url = await upImage(await shrink(pf, 1080, 0), 'post-' + Date.now() + '.jpg', false);
      const { error } = await sb.from('photo_posts').insert({ user_id: currentUser.id, image_url: url, caption: $('b3-cap').value.trim() || null, category_id: Number($('b3-cat').value) || null, language: lang, country: $('b3-ctry').value });
      if (error) throw error;
      sh.classList.add('hidden'); toast(t('posted')); loadPhotos();
    } catch (err) { m.textContent = err.message || String(err); }
    finally { $('b3-post').disabled = false; }
  };

  /* ---- comments (text + voice, voice & photo posts) ---- */
  let ck = 'v';
  const _oc = openComments;
  openComments = function (id, span) { ck = 'v'; _oc(id, span); };
  loadComments = async function () {
    try { await loadRelations(); } catch (e) {}
    const { data, error } = await sb.from('comments').select('id,user_id,body,audio_url,created_at').eq(ck === 'p' ? 'photo_post_id' : 'voice_post_id', cmPost).order('created_at', { ascending: true }).limit(50);
    if (error) { $('cm-list').textContent = error.message; return; }
    const bl = new Set(rel.blocks.map(b => b.blocked_id)), cs = (data || []).filter(c => !bl.has(c.user_id));
    const uids = [...new Set(cs.map(c => c.user_id))], pm = {};
    if (uids.length) ((await sb.from('profiles').select('id,display_name').in('id', uids)).data || []).forEach(p => pm[p.id] = p);
    $('cm-list').innerHTML = cs.length ? cs.map(c => '<div class="cm"><b>' + esc(nameOf(pm[c.user_id])) + '</b><div>' + (c.audio_url ? pBtnHtml(c.audio_url) : esc(c.body || '')) + '</div></div>').join('') : '<div class="muted">' + esc(t('none_yet')) + '</div>';
  };
  async function addComment(x) {
    const row = Object.assign({ user_id: currentUser.id }, ck === 'p' ? { photo_post_id: cmPost } : { voice_post_id: cmPost }, x);
    const { error } = await sb.from('comments').insert(row);
    if (error) { toast(t('err') + error.message); return; }
    $('cm-in').value = ''; if (cmSpan) cmSpan.textContent = Number(cmSpan.textContent) + 1; loadComments();
  }
  $('cm-form').onsubmit = async e => { e.preventDefault(); const b = $('cm-in').value.trim(); if (b) await addComment({ body: b }); };
  $('cm-form').lastElementChild.insertAdjacentHTML('beforebegin', '<button type="button" id="b3-cmic" class="btn ghost" style="width:auto;padding:0 14px;font-size:15px">🎤</button>');
  $('b3-cmic').onclick = e => recToggle(e.currentTarget, 30, async (blob, s) => {
    try { await addComment({ body: '🎤', audio_url: await upAudio(blob, 'c-'), duration_seconds: s }); } catch (err) { toast(t('err') + (err.message || err)); }
  });

  /* ---- clicks ---- */
  document.addEventListener('click', async e => {
    const g = s => e.target.closest(s);
    let b;
    if ((b = g('.b3p'))) return playBtn(b);
    if ((b = g('[data-m]'))) return setMode(b.dataset.m);
    if ((b = g('[data-del]'))) return del('v', b.dataset.del, b.dataset.url);
    if ((b = g('[data-pdel]'))) return del('p', b.dataset.pdel, b.dataset.url);
    if ((b = g('[data-pcm]'))) { ck = 'p'; cmPost = b.dataset.pcm; cmSpan = b.querySelector('span'); $('cm-list').innerHTML = ''; $('cm-sheet').classList.remove('hidden'); loadComments(); return; }
    if ((b = g('[data-share]'))) {
      const u = location.origin + location.pathname;
      if (navigator.share) navigator.share({ title: 'Talkia', text: b.dataset.share || 'Talkia', url: u }).catch(() => {});
      else { try { await navigator.clipboard.writeText(u); toast(T('copied')); } catch (x) {} }
      return;
    }
    if ((b = g('[data-plike]'))) {
      const id = b.dataset.plike, on = b.classList.contains('on'), sp = b.querySelector('span');
      const r = on ? await sb.from('likes').delete().eq('user_id', currentUser.id).eq('photo_post_id', id) : await sb.from('likes').insert({ user_id: currentUser.id, photo_post_id: id });
      if (r.error) { toast(t('err') + r.error.message); return; }
      b.classList.toggle('on', !on); sp.textContent = Math.max(0, Number(sp.textContent) + (on ? -1 : 1)); b.firstChild.textContent = (on ? '♡' : '♥') + ' ';
    }
  });
})();
