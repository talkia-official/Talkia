/* Talkia Batch 3 — Audio Recording & Voice Filters (Optimized & Conflict-Free) */
(function () {
  'use strict';

  let mediaRecorder = null;
  let audioChunks = [];
  let audioBlob = null;
  let recordingTimer = null;
  let secondsElapsed = 0;

  // 1) Post Type Switcher (Text vs Voice vs Image)
  function setPostType(type) {
    const ptypeText = document.getElementById('ptype-text');
    const ptypeVoice = document.getElementById('ptype-voice');
    const ptypeImage = document.getElementById('ptype-image');

    const textPostArea = document.getElementById('text-post-area');
    const voiceRecArea = document.getElementById('voice-rec-area');
    const imageUploadArea = document.getElementById('image-upload-area');

    if (ptypeText) {
      ptypeText.style.background = type === 'text' ? 'var(--surface2)' : 'transparent';
      ptypeText.style.color = type === 'text' ? 'var(--text)' : 'var(--muted)';
    }
    if (ptypeVoice) {
      ptypeVoice.style.background = type === 'voice' ? 'var(--surface2)' : 'transparent';
      ptypeVoice.style.color = type === 'voice' ? 'var(--text)' : 'var(--muted)';
    }
    if (ptypeImage) {
      ptypeImage.style.background = type === 'image' ? 'var(--surface2)' : 'transparent';
      ptypeImage.style.color = type === 'image' ? 'var(--text)' : 'var(--muted)';
    }

    if (textPostArea) textPostArea.classList.toggle('hidden', type !== 'text');
    if (voiceRecArea) voiceRecArea.classList.toggle('hidden', type !== 'voice');
    if (imageUploadArea) imageUploadArea.classList.toggle('hidden', type !== 'image');
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('#ptype-text')) setPostType('text');
    if (e.target.closest('#ptype-voice')) setPostType('voice');
    if (e.target.closest('#ptype-image')) setPostType('image');
  });

  // 2) Voice Recording Logic
  const recBtn = document.getElementById('rec-btn');
  const recTime = document.getElementById('rec-time');
  const recPrev = document.getElementById('rec-prev');

  if (recBtn) {
    recBtn.onclick = async () => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioChunks = [];
          mediaRecorder = new MediaRecorder(stream);

          mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) audioChunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            if (recPrev) {
              recPrev.src = audioUrl;
              recPrev.classList.remove('hidden');
            }
          };

          mediaRecorder.start();
          secondsElapsed = 0;
          if (recTime) recTime.textContent = '0:00';
          recBtn.textContent = typeof t === 'function' ? t('rec_stop') : 'Stop Recording';
          recBtn.style.background = 'var(--danger)';

          recordingTimer = setInterval(() => {
            secondsElapsed++;
            const mins = Math.floor(secondsElapsed / 60);
            const secs = secondsElapsed % 60;
            if (recTime) recTime.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
          }, 1000);

        } catch (err) {
          console.error('[Talkia] Microphone error:', err);
          if (typeof toast === 'function') toast(typeof t === 'function' ? t('mic_err') : 'Could not access microphone.');
        }
      } else {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        clearInterval(recordingTimer);
        recBtn.textContent = typeof t === 'function' ? t('rec_start') : 'Start Recording';
        recBtn.style.background = 'var(--accent)';
      }
    };
  }

  // 3) Categories, Languages, and Countries population
  async function populatePostDropdowns() {
    if (typeof sb === 'undefined') return;

    const rCat = document.getElementById('r-cat');
    if (rCat && rCat.options.length <= 1) {
      const { data: cats } = await sb.from('categories').select('*').order('id');
      if (cats) {
        rCat.innerHTML = cats.map(c => `<option value="${c.id}">${c.name_en || c.slug}</option>`).join('');
      }
    }

    const rLang = document.getElementById('r-lang');
    if (rLang && rLang.options.length <= 1) {
      rLang.innerHTML = `
        <option value="bn">বাংলা (Bengali)</option>
        <option value="en">English</option>
        <option value="ar">العربية (Arabic)</option>
        <option value="hi">हिन्दी (Hindi)</option>
      `;
    }

    const rCountry = document.getElementById('r-country');
    if (rCountry && rCountry.options.length <= 1) {
      rCountry.innerHTML = `
        <option value="BD">Bangladesh</option>
        <option value="IN">India</option>
        <option value="SA">Saudi Arabia</option>
        <option value="AE">UAE</option>
        <option value="GLOBAL">Global</option>
      `;
    }
  }

  // Unified Record Button Handler (Opens Sheet + Populates Dropdowns Safely)
  const setupRecordButton = () => {
    const btnRecord = document.getElementById('btn-record');
    if (btnRecord) {
      btnRecord.onclick = (e) => {
        e.preventDefault();
        const recSheet = document.getElementById('rec-sheet');
        if (recSheet) recSheet.classList.remove('hidden');
        populatePostDropdowns();
        setPostType('text');
      };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRecordButton);
  } else {
    setupRecordButton();
  }

  // 4) Submit Post Handler
  const recPostBtn = document.getElementById('rec-post');
  if (recPostBtn) {
    recPostBtn.onclick = async () => {
      if (typeof currentUser === 'undefined' || !currentUser) {
        if (typeof toast === 'function') toast('Please sign in first');
        return;
      }

      const msgEl = document.getElementById('rec-msg');
      if (msgEl) msgEl.textContent = '';

      const categoryId = document.getElementById('r-cat')?.value;
      const langVal = document.getElementById('r-lang')?.value || 'en';
      const countryVal = document.getElementById('r-country')?.value || 'GLOBAL';
      const isAnon = document.getElementById('r-anon')?.checked || false;

      let activePostType = 'text';
      if (!document.getElementById('voice-rec-area')?.classList.contains('hidden')) activePostType = 'voice';
      else if (!document.getElementById('image-upload-area')?.classList.contains('hidden')) activePostType = 'image';

      try {
        recPostBtn.disabled = true;
        let audioUrl = null;
        let imageUrl = null;
        let captionText = '';

        if (activePostType === 'text') {
          captionText = document.getElementById('r-text-content')?.value.trim() || '';
          if (!captionText) throw new Error('Please write something for your post');
        } else if (activePostType === 'image') {
          const imgFile = document.getElementById('post-img-file')?.files[0];
          captionText = document.getElementById('r-text-content')?.value.trim() || '';
          if (imgFile) {
            if (typeof toast === 'function') toast('Uploading image...');
            const fileName = `post_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const { error: uploadErr } = await sb.storage.from('post_images').upload(fileName, imgFile);
            if (uploadErr) throw uploadErr;
            const { data: publicURL } = sb.storage.from('post_images').getPublicUrl(fileName);
            imageUrl = publicURL.publicUrl;
          }
        } else if (activePostType === 'voice') {
          if (!audioBlob) throw new Error('Please record an audio first');
          if (secondsElapsed < 3) throw new Error(typeof t === 'function' ? t('too_short') : 'Record at least 3 seconds.');
          
          if (typeof toast === 'function') toast('Uploading voice recording...');
          const fileName = `voice_${Date.now()}_${Math.random().toString(36.substring(2, 7))}.webm`;
          const { error: uploadErr } = await sb.storage.from('voice_posts').upload(fileName, audioBlob);
          if (uploadErr) throw uploadErr;
          const { data: publicURL } = sb.storage.from('voice_posts').getPublicUrl(fileName);
          audioUrl = publicURL.publicUrl;
          captionText = document.getElementById('r-text-content')?.value.trim() || '';
        }

        const { error: insertErr } = await sb.from('voice_posts').insert({
          user_id: currentUser.id,
          category_id: categoryId ? Number(categoryId) : null,
          language: langVal,
          country: countryVal,
          is_anonymous: isAnon,
          caption: captionText,
          audio_url: audioUrl,
          image_url: imageUrl,
          duration_seconds: secondsElapsed
        });

        if (insertErr) throw insertErr;

        if (typeof toast === 'function') toast(typeof t === 'function' ? t('posted') : 'Posted successfully!');
        
        document.getElementById('rec-sheet')?.classList.add('hidden');
        if (typeof loadFeed === 'function') loadFeed(false);

      } catch (err) {
        console.error('[Talkia] Post submission failed:', err);
        if (msgEl) msgEl.textContent = err.message || 'Failed to create post';
      } finally {
        recPostBtn.disabled = false;
      }
    };
  }

  window.fmt = function (secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

})();
