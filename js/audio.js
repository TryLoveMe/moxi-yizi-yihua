/* 声音：Karplus-Strong 拨弦（古筝）+ 雨声 + 落墨沙沙 */
(function (global) {
  'use strict';
  var M = MoDraw;
  var ac = null, master = null, wet = null, rainNode = null, rainGain = null, enabled = true;
  // 五声音阶 宫商角徵羽，两个八度
  var PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

  function ensure() {
    if (ac) return ac;
    var Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return null;
    ac = new Ctx();
    master = ac.createGain();
    master.gain.value = 0.5;
    var comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 5;
    master.connect(comp);
    comp.connect(ac.destination);
    return ac;
  }

  function resume() {
    if (ensure() && ac.state === 'suspended') ac.resume();
  }

  function toneFor(tone, initial) {
    // 一声高而稳，二声上扬，三声先降后升，四声干脆下行；浊声母偏低音区
    var i = Math.floor(Math.random() * 6) + (initial === 'y' || initial === 'w' ? 3 : 0);
    var map = [ [0, 4], [2, 7], [1, 5], [6, 3] ];
    var pick = map[(tone || 1) - 1] || map[0];
    var idx = pick[Math.random() < 0.5 ? 0 : 1] + (i % 4);
    return PENTA[M.clamp(idx, 0, PENTA.length - 1)];
  }

  /** 拨一根弦：噪声激励 + 延迟反馈 */
  function pluck(freq, when, dur, gainAmt) {
    if (!enabled) return;
    resume();
    if (!ac) return;
    when = when || ac.currentTime;
    dur = dur || 1.9;
    var sr = ac.sampleRate;
    var n = Math.max(2, Math.round(sr / freq));
    var buf = ac.createBuffer(1, n + Math.round(sr * dur), sr);
    var d = buf.getChannelData(0);
    var ring = new Float32Array(n);
    for (var i = 0; i < n; i++) ring[i] = Math.random() * 2 - 1;
    // 基音修正：轻微梳状滤波让音高更准
    var damp = 0.996 - 0.28 * (freq / 1200);
    for (var t0 = 0; t0 < d.length; t0++) {
      var a = ring[t0 % n];
      var b = ring[(t0 + 1) % n];
      var v = (a + b) * 0.5 * damp;
      ring[t0 % n] = v;
      d[t0] = v;
    }
    var src = ac.createBufferSource();
    src.buffer = buf;
    var g = ac.createGain();
    var amp = (gainAmt === undefined ? 0.5 : gainAmt);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    var body = ac.createBiquadFilter();
    body.type = 'peaking'; body.frequency.value = freq * 2.02; body.Q.value = 0.9; body.gain.value = 7;
    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, freq * 9);
    src.connect(body); body.connect(lp); lp.connect(g);
    if (!wet) {
      wet = ac.createConvolver();
      wet.buffer = hall(2.1);
      var wg = ac.createGain(); wg.gain.value = 0.24;
      wet.connect(wg); wg.connect(master);
      wet._g = wg;
    }
    g.connect(master); g.connect(wet);
    src.start(when);
    src.stop(when + dur + 0.05);
  }

  function hall(seconds) {
    var sr = ac.sampleRate, len = Math.round(sr * seconds);
    var b = ac.createBuffer(2, len, sr);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c);
      for (var i = 0; i < len; i++) {
        var f = (1 - i / len);
        d[i] = (Math.random() * 2 - 1) * Math.pow(f, 2.6) * (i < sr * 0.02 ? i / (sr * 0.02) : 1);
      }
    }
    return b;
  }

  /* 一声拨弦 + 相邻弦泛音，像古筝的“抹挑” */
  function strike(tone, initial) {
    var f = toneFor(tone, initial);
    var t0 = ac ? ac.currentTime : 0;
    pluck(f, t0, 2.3, 0.55);
    pluck(f * 1.5, t0 + 0.07, 1.6, 0.2);
    if (Math.random() < 0.35) pluck(f * 2, t0 + 0.16, 1.2, 0.12);
  }

  function sweep(tone) {
    if (!enabled || !ensure()) return;
    var start = Math.floor(Math.random() * 5);
    for (var i = 0; i < 4; i++) pluck(PENTA[start + i], ac.currentTime + i * 0.06, 1.4, 0.3);
  }

  /* 落墨的沙沙：短促滤波噪声 */
  function rustle(amount) {
    if (!enabled) return;
    resume();
    if (!ac) return;
    var dur = 0.28 + Math.random() * 0.25;
    var len = Math.round(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
    }
    var src = ac.createBufferSource(); src.buffer = buf;
    var bp = ac.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 1400 + Math.random() * 1600; bp.Q.value = 0.7;
    var g = ac.createGain(); g.gain.value = 0.16 * (amount === undefined ? 1 : amount);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start();
  }

  /* 持续雨声 */
  function rain(on) {
    if (!ensure()) return;
    if (on) {
      if (rainNode) return;
      var len = ac.sampleRate * 2;
      var buf = ac.createBuffer(1, len, ac.sampleRate);
      var d = buf.getChannelData(0);
      var last = 0;
      for (var i = 0; i < len; i++) {
        var w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.2 + w * 0.25;
      }
      rainNode = ac.createBufferSource();
      rainNode.buffer = buf; rainNode.loop = true;
      var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
      rainGain = ac.createGain(); rainGain.gain.value = 0;
      rainNode.connect(hp); hp.connect(rainGain); rainGain.connect(master);
      rainNode.start();
      rainGain.gain.linearRampToValueAtTime(0.16, ac.currentTime + 1.2);
    } else if (rainNode) {
      var rn = rainNode, rg = rainGain;
      rg.gain.linearRampToValueAtTime(0, ac.currentTime + 0.8);
      setTimeout(function () { try { rn.stop(); } catch (e) {} }, 1200);
      rainNode = null; rainGain = null;
    }
  }

  function setEnabled(on) {
    enabled = !!on;
    if (!on) {
      if (master) master.gain.value = 0;
      rain(false);
    } else {
      resume();
      if (master) master.gain.value = 0.5;
    }
  }

  global.MoAudio = {
    resume: resume,
    strike: strike,
    sweep: sweep,
    pluck: pluck,
    rustle: rustle,
    rain: rain,
    setEnabled: setEnabled,
    get on() { return enabled; }
  };
})(window);
