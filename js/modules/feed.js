// Global feed, categories/country filters, likes + emoji reactions, comments, daily prompt
function todayISO() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
async function loadPrompt() {
  const el = $('prompt-text');
  const { data } = await sb.from('daily_prompts').select('*').eq('prompt_date', todayISO()).maybeSingle();
  if (!data) { el.textContent = t('no_prompt'); return; }
  const field = { bn: 'text_bn', en: 'text_en', ar: 'text_ar', hi: 'text_hi' }[lang];
  el.textContent = data[field] || data.text_bn;
}

let cats = [];
async function loadCats() {
  if (cats.length) return;
  const { data } = await sb.from('categories').select('*').order('id');
  cats = data || [];
  populateFilterDropdowns();
}
const catName = c => c['name_' + lang] || c.name_en || c.slug;
const COUNTRIES = ['BD', 'IN', 'SA', 'AE', 'GLOBAL'];

function populateFilterDropdowns() {
  const catSel = $('feed-cat-select');
  if (catSel) {
    catSel.innerHTML = '<option value="">' + t('all_cats') + '</option>' + cats.map(c => `<option value="${c.id}">${catName(c)}</option>`).join('');
  }
  const cSel = $('feed-country-select');
  if (cSel) {
    cSel.innerHTML = '<option value="">' + t('all_countries') + '</option>' + COUNTRIES.map(c => `<option value="${c}">${t('c_' + c)}</option>`).join('');
  }
}

$('feed-cat-select').onchange = () => loadFeed();
$('feed-country-select').onchange = () => loadFeed();

let feedPage = 0; const PAGE = 10;
const playSvg = '<path d="M7 4l13 8-13 8z"/>', pauseSvg = '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';

function emojiBarHtml(id) {
  return '<div class="reaction-bar" id="react-bar-' + esc(id) + '">' + ['❤️', '😂', '😮', '😢', '🔥'].map(e => '<span data-react="' + e + '" data-id="' + esc(id) + '">' + e + '</span>').join('') + '</div>';
}
// voice_feed (view) has no image_url, so fetch it from voice_posts
async function withImages(rows) {
  if (!rows.length) return rows;
  const { data } = await sb.from('voice_posts').select('id,image_url').in('id', rows.map(p => p.id));
  const im = {}; (data || []).forEach(r => im[r.id] = r.image_url);
  rows.forEach(p => { p.image_url = im[p.id] || null; });
  return rows;
}
function cardHtml(p) {
  const c = cats.find(x => x.id === p.category_id);
  const posterId = p.user_id;
  const authorName = p.is_anonymous ? t('anon') : (p.display_name || t('user'));
  const authorAvatar = p.avatar_url;

  const av = p.is_anonymous ? '<div class="uav">?</div>' : `<div class="uav" data-profile-id="${esc(posterId)}" style="cursor:pointer; position:relative;">${authorAvatar ? `<img src="${esc(authorAvatar)}">` : esc((authorName || 'T').charAt(0).toUpperCase())}</div>`;
  
  let mediaHtml = '';
  if (p.audio_url) {
    mediaHtml = `<div class="play"><i data-play="${esc(p.audio_url)}"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></i><div class="wave"><b></b></div><span class="muted" style="font-size:13px">${esc(fmt(p.duration_seconds || 0))}</span></div>`;
  }
  if (p.image_url) {
    mediaHtml += `<div style="margin-top:10px; border-radius:12px; overflow:hidden;"><img src="${esc(p.image_url)}" style="width:100%; max-height:300px; object-fit:cover;"></div>`;
  }

  const views = p.view_count || 0;

  return '<div class="card post" id="post-' + esc(p.id) + '" data-id="' + esc(p.id) + '">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; position:relative;">'
    + '<div class="phead" style="display:flex; align-items:center; gap:10px;">' + av + '<div><div ' + (p.is_anonymous ? '' : 'data-profile-id="' + esc(posterId) + '" ') + 'style="cursor:pointer; font-weight:650;">' + esc(authorName) + '</div><div class="muted" style="font-size:12px">' + esc(timeAgo(p.created_at)) + ' • 👁️ ' + views + ' ' + t('views_count') + '</div></div></div>'
    + '</div>'
    + '<div style="margin-top:6px;">' + (c ? '<span class="tag">' + esc(catName(c)) + '</span>' : '') + (p.country ? '<span class="tag">' + esc(t('c_' + p.country) === 'c_' + p.country ? p.country : t('c_' + p.country)) + '</span>' : '') + (p.language ? '<span class="tag">' + esc(p.language) + '</span>' : '') + '</div>'
    + (p.caption ? '<div style="margin-top:8px">' + esc(p.caption) + '</div>' : '')
    + mediaHtml
    + '<div class="acts" style="position:relative; margin-top:10px; display:flex; gap:14px; align-items:center;"><button data-like="' + esc(p.id) + '" data-kind="' + (p._photo ? 'photo' : 'voice') + '" style="cursor:pointer; background:none; border:0; color:var(--text); position:relative;">❤️ <span>' + Number(p.like_count || 0) + '</span></button><button data-cm="' + esc(p.id) + '" data-kind="' + (p._photo ? 'photo' : 'voice') + '" style="cursor:pointer; background:none; border:0; color:var(--text);">💬 <span>' + Number(p.comment_count || 0) + '</span></button>' + emojiBarHtml(p.id) + '</div></div>';
}


async function loadFeed(more) {
  await loadCats();
  const box = $('feed-list');
  if (!more) { feedPage = 0; box.innerHTML = '<div class="empty">' + esc(t('loading')) + '</div>'; }
  const cat = $('feed-cat-select').value, ctry = $('feed-country-select').value, from = feedPage * PAGE;
  const mk = v => { let q = sb.from(v).select('*').order('created_at', { ascending: false }).range(from, from + PAGE - 1); if (cat) q = q.eq('category_id', Number(cat)); if (ctry) q = q.eq('country', ctry); return q; };
  const [vr, pr] = await Promise.all([mk('voice_feed'), mk('photo_feed')]);   // voice/text posts + photo posts, merged by time
  const old = $('feed-more'); if (old) old.remove();
  const error = vr.error || pr.error;
  if (error) { box.innerHTML = '<div class="empty">' + esc(error.message) + '</div>'; return; }
  if (!more) box.innerHTML = '';
  const voice = await withImages(vr.data || []), photos = (pr.data || []).map(p => ({ ...p, _photo: true }));
  const data = voice.concat(photos).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (!data.length && !more) { box.innerHTML = '<div class="empty"><div class="big">🎙️</div>' + esc(t('feed_empty')) + '</div>'; return; }
  box.insertAdjacentHTML('beforeend', data.map(cardHtml).join(''));
  if (vr.data.length === PAGE || pr.data.length === PAGE) box.insertAdjacentHTML('beforeend', '<button class="btn ghost sm" id="feed-more">' + esc(t('more')) + '</button>');
}

// like = row in `likes`; tapping an un-liked post opens the emoji bar, tapping a liked one removes it
async function setLike(id, on, emoji) {
  if (!currentUser) return toast(t('login'));
  const bar = $('react-bar-' + id); if (bar) bar.style.display = 'none';
  const btn = document.querySelector('[data-like="' + id + '"]'), sp = btn && btn.querySelector('span');
  const kb = document.querySelector('[data-like="' + id + '"]'), col = kb && kb.dataset.kind === 'photo' ? 'photo_post_id' : 'voice_post_id';
  const r = on ? await sb.from('likes').insert({ user_id: currentUser.id, [col]: id }) : await sb.from('likes').delete().eq('user_id', currentUser.id).eq(col, id);
  if (r.error && !(on && r.error.code === '23505')) return toast(t('err') + r.error.message);
  if (btn && sp) { const n = Math.max(0, Number(sp.textContent) + (on ? 1 : -1)); btn.classList.toggle('on', on); btn.innerHTML = (on ? (emoji || '❤️') : '❤️') + ' <span>' + n + '</span>'; }
}
const audio = new Audio(); let activeIcon = null, activeBar = null;
function stopIcon() { if (activeIcon) activeIcon.querySelector('svg').innerHTML = playSvg; }
audio.ontimeupdate = () => { if (activeBar && audio.duration) activeBar.style.width = (audio.currentTime / audio.duration * 100) + '%'; };
audio.onended = () => { stopIcon(); if (activeBar) activeBar.style.width = '0'; };

function onFeedClick(e) {
  if (e.target.closest('#feed-more')) { feedPage++; loadFeed(true); return; }
  const pl = e.target.closest('[data-play]');
  if (pl) {
    if (activeIcon === pl && !audio.paused) { audio.pause(); stopIcon(); return; }
    if (activeIcon !== pl) { stopIcon(); if (activeBar) activeBar.style.width = '0'; activeIcon = pl; activeBar = pl.parentNode.querySelector('.wave b'); audio.src = pl.dataset.play; }
    audio.play().then(() => { pl.querySelector('svg').innerHTML = pauseSvg; }).catch(() => toast('Audio play error'));
    return;
  }
  const rc = e.target.closest('[data-react]'); if (rc) { setLike(rc.dataset.id, true, rc.dataset.react); return; }
  const lk = e.target.closest('[data-like]');
  if (lk) { const id = lk.dataset.like; if (lk.classList.contains('on')) setLike(id, false); else { const bar = $('react-bar-' + id); if (bar) bar.style.display = bar.style.display === 'flex' ? 'none' : 'flex'; } return; }
  const cm = e.target.closest('[data-cm]'); if (cm) openComments(cm.dataset.cm, cm.querySelector('span'), cm.dataset.kind);
}
$('feed-list').onclick = onFeedClick;
$('prompt-answer').onclick = () => openRecorder({ type: 'voice', caption: $('prompt-text').textContent });
let cmPost = null, cmSpan = null, cmKind = 'voice';
const cmCol = () => cmKind === 'photo' ? 'photo_post_id' : 'voice_post_id';
async function loadComments() {
  const { data, error } = await sb.from('comment_feed').select('*').eq(cmCol(), cmPost).order('created_at', { ascending: true }).limit(50);
  $('cm-list').innerHTML = error ? esc(error.message) : (data.length ? data.map(c => '<div class="cm" style="display:flex; gap:10px; margin-bottom:10px; align-items:flex-start;"><div class="uav">' + (c.avatar_url ? `<img src="${esc(c.avatar_url)}">` : esc((c.display_name || 'U').charAt(0))) + '</div><div><b>' + esc(c.display_name || t('user')) + '</b><div>' + esc(c.body || '') + '</div></div></div>').join('') : '<div class="muted">' + esc(t('none_yet')) + '</div>');
}
function openComments(id, span, kind) { cmPost = id; cmSpan = span; cmKind = kind || 'voice'; $('cm-list').innerHTML = ''; $('cm-sheet').classList.remove('hidden'); loadComments(); }
$('cm-close').onclick = () => $('cm-sheet').classList.add('hidden');

$('cm-form').onsubmit = async e => {
  e.preventDefault();
  const body = $('cm-in').value.trim(); if (!body) return;
  const { error } = await sb.from('comments').insert({ user_id: currentUser.id, [cmCol()]: cmPost, body });
  if (error) { toast(error.message); return; }
  $('cm-in').value = ''; if (cmSpan) cmSpan.textContent = Number(cmSpan.textContent) + 1;
  loadComments();
};

