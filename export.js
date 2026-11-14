/* ThemeFlow shared exporter.
   MP4: every frame is drawn at its exact time (frame i = i / fps) and encoded with WebCodecs,
   so nothing is dropped or repeated, even on slow machines. The browser's speed never changes the video.
   WebM: MediaRecorder fallback that records in real time (can stutter on slow devices). */
(() => {
  'use strict';
  const MUXER_URL = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5/+esm';
  const AVC_LEVELS = ['avc1.640034', 'avc1.64002A', 'avc1.640028']; // H.264 High @ 5.2, 4.2, 4.0
  const pause = () => new Promise(r => setTimeout(r, 0));

  const canMp4 = () => typeof VideoEncoder === 'function' && typeof VideoFrame === 'function';

  async function pickCodec(W, H, fps, bitrate) {
    for (const codec of AVC_LEVELS) {
      const cfg = { codec, width: W, height: H, bitrate, framerate: fps, avc: { format: 'avc' } };
      try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return cfg; } catch { /* try next level */ }
    }
    throw new Error(`This browser cannot encode H.264 at ${W}×${H} ${fps}fps. Try a lower resolution or fps.`);
  }

  async function renderMp4({ W, H, fps, dur, draw, onProgress }) {
    let Muxer, ArrayBufferTarget;
    try { ({ Muxer, ArrayBufferTarget } = await import(MUXER_URL)); }
    catch { throw new Error('Could not load the MP4 muxer. Check your internet connection.'); }

    const cfg = await pickCodec(W, H, fps, Math.min(40e6, Math.round(W * H * fps * 0.1)));
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({ target, video: { codec: 'avc', width: W, height: H, frameRate: fps }, fastStart: 'in-memory' });
    let encError = null;
    const enc = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: e => { encError = e; },
    });
    enc.configure(cfg);

    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const total = Math.round(dur * fps), us = 1e6 / fps;
    try {
      for (let i = 0; i < total; i++) {
        if (encError) throw encError;
        draw(i / fps, ctx);                              // exact time for this frame
        const frame = new VideoFrame(cv, { timestamp: Math.round(i * us), duration: Math.round(us) });
        enc.encode(frame, { keyFrame: i % (fps * 2) === 0 });  // keyframe every 2s so seeking is smooth
        frame.close();
        while (enc.encodeQueueSize > 4) await pause();
        if (i % 4 === 0) { onProgress(i / total); await pause(); }
      }
      await enc.flush();
    } finally {
      if (enc.state !== 'closed') enc.close();
    }
    muxer.finalize();
    onProgress(1);
    return new Blob([target.buffer], { type: 'video/mp4' });
  }

  function renderWebm({ W, H, fps, dur, draw, onProgress }) {
    return new Promise((resolve, reject) => {
      if (!window.MediaRecorder) return reject(new Error('No video encoder is available in this browser.'));
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      const mime = ['video/webm;codecs=vp9', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(cv.captureStream(fps), { mimeType: mime, videoBitsPerSecond: 8e6 });
      const chunks = [];
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      rec.start(250);
      const t0 = performance.now();
      const step = () => {
        const el = Math.min((performance.now() - t0) / 1000, dur);
        draw(el, ctx);
        onProgress(el / dur);
        if (el < dur) requestAnimationFrame(step); else rec.stop();
      };
      step();
    });
  }

  window.TFExport = {
    canMp4,
    run({ format, W, H, fps, dur, draw, onProgress = () => {} }) {
      return format === 'mp4'
        ? renderMp4({ W, H, fps, dur, draw, onProgress })
        : renderWebm({ W, H, fps, dur, draw, onProgress });
    },
  };
})();
