/* Talkia Batch 3 — Post Creation, Voice Recording & Media Upload (Fixed & Optimized) */
(function () {
  'use strict';

  let postType = 'text'; // 'text', 'voice', 'image'
  let mediaRecorder = null, audioChunks = [], audioBlob = null, recordingTimer = null, recSeconds = 0;

  // Switch post types inside rec-sheet
  const ptypeText = document.getElementById('ptype-text');
  const ptypeVoice = document.getElementById('ptype-voice');
  const ptypeImage = document.getElementById('ptype-image');

  const textPostArea = document.getElementById('text-post-area');
  const voiceRecArea = document.getElementById('voice-rec-area');
  const imageUploadArea = document.getElementById('image-upload-area');

  function setPostType(type) {
    postType = type;
    if (ptypeText) {
      ptypeText.style.background = (type === 'text') ? 'var(--surface2)' : 'transparent';
      ptypeText.style.color = (type === 'text') ? 'var(--text)' : 'var(--muted)';
    }
    if (ptypeVoice) {
      ptypeVoice.style.background = (type === 'voice') ? 'var(--surface2)' : 'transparent';
      ptypeVoice.style.color = (type === 'voice') ? 'var(--text)' : 'var(--muted)';
    }
    if (ptypeImage) {
      ptypeImage.style.background = (type === 'image') ? 'var(--surface2)' : 'transparent';
      ptypeImage.style.color = (type === 'image') ? 'var(--text)' : 'var(--muted)';
    }

    if (textPostArea) textPostArea.classList.toggle('hidden', type !== 'text');
    if (voiceRecArea) voiceRecArea.classList.toggle('hidden', type !== 'voice');
    if (imageUploadArea) imageUploadArea.classList.toggle('hidden', type !== 'image');
  }

  if (ptypeText) ptypeText.onclick = () => setPostType('text');
  if (ptypeVoice) ptypeVoice.onclick = () => setPostType('voice');
  if (ptypeImage) ptypeImage.onclick = () => setPostType('image');

  // Voice Recording Logic
  const recBtn = document.getElementById('rec-btn');
  const recTime = document.getElementById('rec-time');
  const recPrev = document.getElementById('rec-prev');

  if (recBtn) {
    recBtn.onclick = async () => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        audioChunks = [];
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
          mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            if (recPrev) {
              recPrev.src = URL.createObjectURL(audioBlob);
              recPrev.classList.remove('hidden');
            }
          };
          mediaRecorder.start();
          recSeconds = 0;
          if (recTime) recTime.textContent = '0:00';
          recordingTimer = setInterval(() => {
            recSeconds++;
            const m = Math.floor(recSeconds / 60);
            const s = recSeconds % 60;
            if (recTime) recTime.textContent = m + ':' + (s < 10 ? '0' : '') + s;
          }, 1000);
          recBtn.textContent = typeof t === 'function' ? t('rec_stop') : 'Stop';
          recBtn.style.background = 'var(--danger)';
        } catch (err) {
          console.error('Mic error:', err);
          toast(typeof t === 'function' ? t('mic_err') : 'Could not use microphone.');
        }
      } else {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        clearInterval(recordingTimer);
        recBtn.textContent = typeof t === 'function' ? t('rec_start') : 'Start recording';
        recBtn.style.background = 'var(--accent)';
      }
    };
  }

  // Populate Categories, Languages, Countries in Record Sheet
  function populateRecordDropdowns() {
    const catSel = document.getElementById('r-cat');
    const langSel = document.getElementById('r-lang');
    const countrySel = document.getElementById('r-country');

    if (catSel && typeof cats !== 'undefined' && cats.length) {
      catSel.innerHTML = cats.map(c => `<option value="${c.id}">${typeof catName === 'function' ? catName(c) : c.slug}</option>`).join('');
    }
    if (langSel) {
      langSel.innerHTML = `<option value="bn">বাংলা</option><option value="en">English</option><option value="ar">العربية</option><option value="hi">हिन्दी</option>`;
    }
    if (countrySel && typeof COUNTRIES !== 'undefined') {
      countrySel.innerHTML = COUNTRIES.map(c => `<option value="${c}">${typeof t === 'function' ? (t('c_' + c) !== 'c_' + c ? t('c_' + c) : c) : c}</option>`).join('');
    }
  }

  // Trigger dropdown population when record sheet opens
  const observer = new MutationObserver(() => {
    const sheet = document.getElementById('rec-sheet');
    if (sheet && !sheet.classList.contains('hidden')) {
      populateRecordDropdowns();
    }
  });
  const recSheetEl = document.getElementById('rec-sheet');
  if (recSheetEl) observer.observe(recSheetEl, { attributes: true, attributeFilter: ['class'] });

  // Post Submission Handler
  const recPostBtn = document.getElementById('rec-post');
  if (recPostBtn) {
    recPostBtn.onclick = async () => {
      if (!currentUser) return toast('Please login');
      const msgEl = document.getElementById('rec-msg');
      if (msgEl) msgEl.textContent = '';

      const category_id = Number(document.getElementById('r-cat')?.value);
      const language = document.getElementById('r-lang')?.value || 'en';
      const country = document.getElementById('r-country')?.value || 'GLOBAL';
      const is_anonymous = document.getElementById('r-anon')?.checked || false;

      let caption = '';
      if (postType === 'text' || postType === 'image') {
        caption = document.getElementById('r-text-content')?.value.trim() || '';
      }

      if (postType === 'text' && !caption) {
        if (msgEl) msgEl.textContent = 'Please write something';
        return;
      }

      recPostBtn.disabled = true;
      if (msgEl) msgEl.textContent = 'Posting...';

      try {
        let audio_url = null;
        let duration_seconds = recSeconds;
        let image_url = null;

        if (postType === 'voice') {
          if (!audioBlob) {
            if (msgEl) msgEl.textContent = 'Please record audio first';
            recPostBtn.disabled = false;
            return;
          }
          const audioFileName = `audio_${currentUser.id}_${Date.now()}.webm`;
          const { error: audioErr } = await sb.storage.from('voice_posts').upload(audioFileName, audioBlob);
          if (audioErr) throw audioErr;
          const { data: pubAudio } = sb.storage.from('voice_posts').getPublicUrl(audioFileName);
          audio_url = pubAudio.publicUrl;
        }

        if (postType === 'image') {
          const imgFile = document.getElementById('post-img-file')?.files[0];
          if (!imgFile) {
            if (msgEl) msgEl.textContent = 'Please select an image';
            recPostBtn.disabled = false;
            return;
          }
          const imgFileName = `img_${currentUser.id}_${Date.now()}`;
          const { error: imgErr } = await sb.storage.from('post_images').upload(imgFileName, imgFile);
          if (imgErr) throw imgErr;
          const { data: pubImg } = sb.storage.from('post_images').getPublicUrl(imgFileName);
          image_url = pubImg.publicUrl;
        }

        const { error: insertErr } = await sb.from('voice_posts').insert({
          user_id: currentUser.id,
          category_id: category_id || 1,
          language,
          country,
          is_anonymous,
          caption,
          audio_url,
          duration_seconds,
          image_url
        });

        if (insertErr) throw insertErr;

        toast(typeof t === 'function' ? t('posted') : 'Posted successfully!');
        document.getElementById('rec-sheet').classList.add('hidden');
        
        // Reset form inputs
        if (document.getElementById('r-text-content')) document.getElementById('r-text-content').value = '';
        audioBlob = null;
        recSeconds = 0;
        if (recPrev) recPrev.classList.add('hidden');

        if (typeof loadFeed === 'function') loadFeed();
        if (typeof loadUserMyPostsAndPhotos === 'function') loadUserMyPostsAndPhotos(currentUser.id);

      } catch (err) {
        console.error('Post creation error:', err);
        if (msgEl) msgEl.textContent = err.message || 'Failed to post';
      } finally {
        recPostBtn.disabled = false;
      }
    };
  }

})();
