// Settings: personal info, privacy, blocked users, language, theme, data export
(function () {
  let box = null;
  const row = (label, inner) => '<div class="field"><label>' + label + '</label>' + inner + '</div>';
  const sel = (id, cur, opts) => '<select id="' + id + '">' + opts.map(o => '<option value="' + o + '"' + (cur === o ? ' selected' : '') + '>' + esc(t('opt_' + o)) + '</option>').join('') + '</select>';
  function show(title, back, inner) {
    if (!box) { box = document.createElement('div'); box.id = 'settings-sheet'; box.className = 'sheet'; box.onclick = e => { if (e.target === box) box.classList.add('hidden'); }; document.body.appendChild(box); }
    box.classList.remove('hidden');
    box.innerHTML = '<div class="sheet-in" style="text-align:start"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h3 style="margin:0">' + (back ? '<button id="st-back" style="font-size:20px;margin-inline-end:8px">←</button>' : '') + title + '</h3><button id="st-x" style="font-size:20px;color:var(--muted)">✕</button></div>' + inner + '</div>';
    $('st-x').onclick = () => box.classList.add('hidden'); if (back) $('st-back').onclick = openSettings;
    renderLangButtons();
  }
  window.openSettings = function () {
    show('⚙️ ' + esc(t('settings')), false,
      '<button class="btn ghost" id="st-pi" style="margin-bottom:8px">👤 ' + esc(t('p_info')) + '</button><button class="btn ghost" id="st-pv" style="margin-bottom:8px">🔒 ' + esc(t('privacy_pass')) + '</button>'
      + '<button class="btn ghost" id="st-th" style="margin-bottom:8px">🌓 ' + esc(t('theme')) + '</button><button class="btn ghost" id="st-ex" style="margin-bottom:8px">⬇️ ' + esc(t('export_data')) + '</button>'
      + '<div class="langs" data-langs></div><button class="btn danger" id="st-lo" style="margin-top:16px">' + esc(t('logout')) + '</button>');
    $('st-pi').onclick = personal; $('st-pv').onclick = privacy; $('st-lo').onclick = logout; $('st-ex').onclick = exportData;
    $('st-th').onclick = () => { const l = document.documentElement.dataset.theme !== 'light'; document.documentElement.dataset.theme = l ? 'light' : 'dark'; try { localStorage.setItem('talkia_theme', l ? 'light' : 'dark'); } catch (e) {} };
  };
  function personal() {
    const p = currentProfile || {};
    show(esc(t('p_info')), true, row('Email', '<input disabled value="' + esc(currentUser.email) + '">') + row(esc(t('name')), '<input id="pi-name" maxlength="40" value="' + esc(p.display_name) + '">')
      + '<button class="btn" id="pi-save">' + esc(t('save')) + '</button>');
    $('pi-save').onclick = async () => {
      const u = { display_name: $('pi-name').value.trim() || t('user') };
      const { error } = await sb.from('profiles').update(u).eq('id', currentUser.id);
      if (error) return toast(t('err') + error.message);
      Object.assign(currentProfile, u); renderProfile(); toast(t('saved'));
    };
  }
  async function privacy() {
    const { data } = await sb.from('profiles').select('privacy_comments,privacy_messages,online_status_visible').eq('id', currentUser.id).maybeSingle(); const p = data || {};
    show(esc(t('privacy_pass')), true, row(esc(t('privacy_comments')), sel('pv-c', p.privacy_comments || 'everyone', ['everyone', 'friends'])) + row(esc(t('privacy_messages')), sel('pv-m', p.privacy_messages || 'everyone', ['everyone', 'friends', 'nobody']))
      + '<label style="display:flex;gap:10px;align-items:center;margin:8px 0 14px"><input type="checkbox" id="pv-o"' + (p.online_status_visible !== false ? ' checked' : '') + '>' + esc(t('show_online')) + '</label>'
      + '<button class="btn" id="pv-save">' + esc(t('save')) + '</button><h4>' + esc(t('blocked_list')) + '</h4><div id="pv-bl" class="muted">' + esc(t('loading')) + '</div>');
    $('pv-save').onclick = async () => {
      const { error } = await sb.from('profiles').update({ privacy_comments: $('pv-c').value, privacy_messages: $('pv-m').value, online_status_visible: $('pv-o').checked }).eq('id', currentUser.id);
      toast(error ? t('err') + error.message : t('saved'));
    };
    const { data: bl } = await sb.from('blocks').select('blocked_id').eq('blocker_id', currentUser.id), ids = (bl || []).map(x => x.blocked_id);
    const { data: ps } = ids.length ? await sb.from('profiles').select('id,display_name').in('id', ids) : { data: [] };
    $('pv-bl').innerHTML = (ps || []).map(u => '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0"><span style="color:var(--text)">' + esc(u.display_name) + '</span><button class="btn ghost" data-ub="' + esc(u.id) + '" style="width:auto;padding:4px 10px;font-size:13px">' + esc(t('unblock')) + '</button></div>').join('') || esc(t('none_yet'));
    $('pv-bl').onclick = async e => { const b = e.target.closest('[data-ub]'); if (!b) return; await sb.from('blocks').delete().eq('blocker_id', currentUser.id).eq('blocked_id', b.dataset.ub); privacy(); };
  }
  async function exportData() {
    const [pr, po, cm] = await Promise.all([sb.from('profiles').select('*').eq('id', currentUser.id), sb.from('voice_posts').select('*').eq('user_id', currentUser.id), sb.from('comments').select('*').eq('user_id', currentUser.id)]);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ profile: pr.data, posts: po.data, comments: cm.data }, null, 2)], { type: 'application/json' }));
    a.download = 'talkia-my-data.json'; a.click();
  }
})();
