// Free client-side voice changer + waveform (Web Audio API, zero server cost)
const AudioFX = (() => {
  const FILTERS = ['normal', 'chipmunk', 'deep', 'robot', 'slowed', 'denoise'];
  const RATE = { chipmunk: 1.45, deep: 0.78, slowed: 0.85 };
  function wav(b) {
    const d = b.getChannelData(0), n = d.length, a = new ArrayBuffer(44 + n * 2), v = new DataView(a);
    const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, b.sampleRate, true); v.setUint32(28, b.sampleRate * 2, true); v.setUint16(32, 2, true);
    v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
    return a;
  }
  async function apply(blob, type) {
    if (!type || type === 'normal') return blob;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = await ctx.decodeAudioData(await blob.arrayBuffer()); ctx.close();
    const rate = RATE[type] || 1, extra = type === 'slowed' ? Math.floor(src.sampleRate * 1.5) : 0;
    const off = new OfflineAudioContext(1, Math.ceil(src.length / rate) + extra, src.sampleRate);
    const s = off.createBufferSource(); s.buffer = src; s.playbackRate.value = rate;
    let node = s; const chain = n => { node.connect(n); node = n; };
    if (type === 'deep') { const f = off.createBiquadFilter(); f.type = 'lowshelf'; f.frequency.value = 200; f.gain.value = 9; chain(f); }
    if (type === 'denoise') { const f = off.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 180; chain(f); }
    if (type === 'robot') { const g = off.createGain(); g.gain.value = 0; const o = off.createOscillator(); o.type = 'square'; o.frequency.value = 50; o.connect(g.gain); o.start(); chain(g); }
    if (type === 'slowed') { const d = off.createDelay(); d.delayTime.value = 0.18; const fb = off.createGain(); fb.gain.value = 0.4; node.connect(d); d.connect(fb); fb.connect(d); d.connect(off.destination); }
    node.connect(off.destination); s.start();
    return new Blob([wav(await off.startRendering())], { type: 'audio/wav' });
  }
  function visualize(stream, canvas) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)(), an = ctx.createAnalyser(); an.fftSize = 128;
    ctx.createMediaStreamSource(stream).connect(an);
    const g = canvas.getContext('2d'), buf = new Uint8Array(an.frequencyBinCount); let raf;
    (function draw() {
      raf = requestAnimationFrame(draw); an.getByteFrequencyData(buf);
      g.clearRect(0, 0, canvas.width, canvas.height); g.fillStyle = '#2f6bff';
      const w = canvas.width / buf.length;
      buf.forEach((v, i) => { const h = v / 255 * canvas.height; g.fillRect(i * w, (canvas.height - h) / 2, w - 2, h || 2); });
    })();
    return () => { cancelAnimationFrame(raf); ctx.close(); };
  }
  return { FILTERS, RATE, apply, visualize };
})();
