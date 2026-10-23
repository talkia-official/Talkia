/* Talkia batch3: Photos, Voice Filters, Emoji Reactions Bar */
(function () {
  const st = document.createElement('style');
  st.textContent = '.b3row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);text-align:start}'
    + '.b3p{width:38px;height:38px;border-radius:50%;background:var(--accent);color:#fff;flex:none}'
    + '.b3i{flex:1;min-width:0;overflow-wrap:anywhere}.b3d{flex:none;padding:6px 10px;color:var(--danger)}'
    + '.b3img{width:100%;max-height:350px;object-fit:cover;border-radius:12px;margin-top:10px;display:block}'
    + '.voice-filter-select { background:#1a2234; color:#fff; border:1px solid #26314a; padding:6px; border-radius:8px; margin-left:8px; font-size:12px; outline:none; }'
    + '.reaction-bar { display: none; position: absolute; bottom: 35px; left: 0; background: #121826; border: 1px solid #26314a; border-radius: 30px; padding: 4px 10px; gap: 8px; z-index: 20; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }'
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
    pa.play().then(() => { b.textContent = '⏸'; }).catch(() => toast('Audio error'));
  }

  window.emojiBarHtml = function(postId) {
    return `
      <div class="reaction-bar" id="react-bar-${postId}">
        <span data-react="❤️" data-id="${postId}" title="Love">❤️</span>
        <span data-react="😂" data-id="${postId}" title="Haha">😂</span>
        <span data-react="😮" data-id="${postId}" title="Wow">😮</span>
        <span data-react="😢" data-id="${postId}" title="Sad">😢</span>
        <span data-react="🔥" data-id="${postId}" title="Fire">🔥</span>
      </div>
    `;
  };

  document.addEventListener('click', async e => {
    const g = s => e.target.closest(s);
    let b;
    if ((b = g('.b3p'))) return playBtn(b);

    if (e.target.dataset.react) {
      e.stopPropagation();
      const emoji = e.target.dataset.react;
      const id = e.target.dataset.id;
      const bar = document.getElementById('react-bar-' + id);
      if (bar) bar.style.display = 'none';
      
      const btn = document.querySelector(`[data-like="${id}"]`);
      if (btn) {
        const span = btn.querySelector('span');
        let cnt = Number(span.textContent || 0) + 1;
        btn.classList.add('on');
        btn.innerHTML = `${emoji} <span>${cnt}</span>`;
        toast('Reaction: ' + emoji);
      }
      return;
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const recContainer = document.getElementById('voice-rec-area');
    if (recContainer && !document.getElementById('v-filter')) {
      recContainer.insertAdjacentHTML('beforeend', `
        <div style="margin-top:10px; font-size:13px; color:#8b97b3;">
          <span id="vf-label-text">Voice Filter</span>: 
          <select class="voice-filter-select" id="v-filter">
            <option value="normal" id="opt-normal">Normal</option>
            <option value="deep" id="opt-deep">Deep Voice</option>
            <option value="echo" id="opt-echo">Echo</option>
          </select>
        </div>
      `);
    }
  });
})();
