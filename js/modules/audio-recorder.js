// New post: text / voice (MediaRecorder + free voice changer) / image
async function uploadMedia(file, folder) {
  const ext = (file.name && file.name.split('.').pop()) || (file.type.split('/')[1] || 'bin').split(';')[0];
  const path = currentUser.id + '/' + folder + '-' + Date.now() + '.' + ext;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
(function () {
  let type = 'text', rec = null, stream = null, raw = null, out = null, secs = 0, tick = null, stopViz = null;
  const sheet = $('rec-sheet'), msg = m => { $('rec-msg').textContent = m || ''; };
  function setType(x) {
    type = x;
    ['text', 'voice', 'image'].forEach(k => { const b = $('ptype-' + k); b.style.background = k === x ? 'var(--accent)' : 'none'; b.style.color = k === x ? '#fff' : 'var(--muted)'; });
    $('voice-rec-area').classList.toggle('hidden', x !== 'voice'); $('image-upload-area').classList.toggle('hidden', x !== 'image');
  }
  function reset() { raw = out = null; secs = 0; $('rec-time').textContent = '0:00'; $('rec-prev').classList.add('hidden'); $('rec-btn').textContent = t('rec_start'); $('r-text-content').value = ''; $('post-img-file').value = ''; msg(); }
  async function refreshPreview() {
    if (!raw) return;
    try { out = await AudioFX.apply(raw, $('v-filter').value); $('rec-prev').src = URL.createObjectURL(out); $('rec-prev').classList.remove('hidden'); }
    catch (e) { out = raw; msg(t('err') + e.message); }
  }
  async function toggleRec() {
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return msg(t('mic_err')); }
    const chunks = []; rec = new MediaRecorder(stream);
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = async () => {
      clearInterval(tick); if (stopViz) stopViz(); stream.getTracks().forEach(x => x.stop());
      raw = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); $('rec-btn').textContent = t('rec_again'); await refreshPreview();
    };
    rec.start(); secs = 0; $('rec-btn').textContent = t('rec_stop'); stopViz = AudioFX.visualize(stream, $('rec-wave'));
    tick = setInterval(() => { secs++; $('rec-time').textContent = fmt(secs); if (secs >= 120) rec.stop(); }, 1000);
  }
  async function post() {
    if (!currentUser) return;
    const caption = $('r-text-content').value.trim(), row = { user_id: currentUser.id, caption, category_id: Number($('r-cat').value) || null,
      language: $('r-lang').value, country: $('r-country').value || null, is_anonymous: $('r-anon').checked };
    $('rec-post').disabled = true;
    try {
      if (type === 'voice') {
        if (!out || secs < 3) throw new Error(t('too_short'));
        if (out.size > 8e6) throw new Error(t('too_big'));
        row.audio_url = await uploadMedia(out, 'voice'); row.duration_seconds = Math.round(secs / (AudioFX.RATE[$('v-filter').value] || 1));
      } else if (type === 'image') {
        const f = $('post-img-file').files[0]; if (!f) throw new Error(t('no_img'));
        msg(t('uploading')); row.image_url = await uploadMedia(f, 'img');
      } else if (!caption) throw new Error(t('post_ph'));
      const photoRow = { user_id: row.user_id, image_url: row.image_url, caption, category_id: row.category_id, language: row.language, country: row.country };
      const { error } = type === 'image' ? await sb.from('photo_posts').insert(photoRow) : await sb.from('voice_posts').insert(row);
      if (error) throw error;
      toast(t('posted')); reset(); sheet.classList.add('hidden'); showTab('home');
    } catch (e) { msg(e.message); }
    $('rec-post').disabled = false;
  }
  window.openRecorder = async function (opts) {
    opts = opts || {}; await loadCats();
    $('r-cat').innerHTML = '<option value="">' + esc(t('all_cats')) + '</option>' + cats.map(c => '<option value="' + c.id + '">' + esc(catName(c)) + '</option>').join('');
    $('r-lang').innerHTML = ['bn', 'en', 'ar', 'hi'].map(l => '<option value="' + l + '"' + (l === lang ? ' selected' : '') + '>' + esc(t('l_' + l)) + '</option>').join('');
    $('r-country').innerHTML = '<option value="">' + esc(t('all_countries')) + '</option>' + COUNTRIES.map(c => '<option value="' + c + '">' + esc(t('c_' + c)) + '</option>').join('');
    $('v-filter').innerHTML = AudioFX.FILTERS.map(f => '<option value="' + f + '">' + esc(f === 'normal' ? t('vf_normal') : t('vf_' + f)) + '</option>').join('');
    reset(); $('post-choose').innerHTML = [['voice', '🎙️', 'lbl_voice'], ['image', '🖼️', 'lbl_image'], ['text', '✍️', 'lbl_text']].map(c =>
      '<button type="button" class="btn ghost" data-pick="' + c[0] + '" style="display:flex;align-items:center;gap:14px;font-size:17px;padding:18px;margin-bottom:10px"><span style="font-size:28px">' + c[1] + '</span>' + esc(t(c[2])) + '</button>').join('');
    if (opts.type) { setType(opts.type); step('form'); } else step('choose');
    if (opts.caption) $('r-text-content').value = opts.caption; sheet.classList.remove('hidden');
  };
  // Step 1: choose post type (voice / image / text). Step 2: the form for that type only.
  $('ptype-text').parentNode.classList.add('hidden');
  $('rec-sheet').querySelector('h3').insertAdjacentHTML('afterend', '<div id="post-choose"></div><button type="button" class="btn ghost sm hidden" id="post-back" style="margin-bottom:10px">←</button>');
  function step(s) {
    const form = s === 'form';
    $('post-choose').classList.toggle('hidden', form); $('post-back').classList.toggle('hidden', !form);
    $('text-post-area').classList.toggle('hidden', !form); $('rec-form').classList.toggle('hidden', !form);
    if (!form) { $('voice-rec-area').classList.add('hidden'); $('image-upload-area').classList.add('hidden'); }
  }
  $('post-choose').onclick = e => { const b = e.target.closest('[data-pick]'); if (b) { setType(b.dataset.pick); step('form'); } };
  $('post-back').onclick = () => { if (rec && rec.state === 'recording') rec.stop(); reset(); step('choose'); };
  // one-time UI wiring
  $('voice-rec-area').insertAdjacentHTML('afterbegin', '<canvas id="rec-wave" width="300" height="50"></canvas>');
  $('voice-rec-area').insertAdjacentHTML('beforeend', '<div class="muted" style="margin-top:10px;font-size:13px"><span data-i18n="v_filter"></span>: <select class="voice-filter-select" id="v-filter"></select></div>');
  $('v-filter').onchange = refreshPreview;
  ['text', 'voice', 'image'].forEach(k => $('ptype-' + k).onclick = () => setType(k));
  $('rec-btn').onclick = toggleRec; $('rec-post').onclick = post; $('btn-record').onclick = () => openRecorder();
  $('rec-close').onclick = () => { if (rec && rec.state === 'recording') rec.stop(); sheet.classList.add('hidden'); };
})();
