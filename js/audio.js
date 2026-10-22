// Authentic PG Soft Mahjong Ways (1) Official Audio Engine
// Genuine PG Soft MP3 audio files with dynamic mixing, voice ducking & smooth continuous BGM
(function () {
  const AUDIO_BASE = 'assets/pg_native/audio/';

  // Precise sprite timestamps for PG Soft Mahjong Ways general_audio
  const GENERAL_SPRITES = {
    bgmBigwin:                  { from: 0.0,  to: 20.75 },
    bgmBigwinEnd:               { from: 21.0, to: 27.70 },
    bgmBonusIntro:              { from: 30.0, to: 32.10 },
    bgmTotalwin:                { from: 33.0, to: 35.20 },
    bgmTotalwinEnd:             { from: 36.0, to: 40.70 },
    bonusReelSpin:              { from: 41.0, to: 41.80 },
    fastspinEnd:                { from: 42.0, to: 42.85 },
    fastspinStart:              { from: 43.0, to: 48.60 },
    fastspinSuccess:            { from: 49.0, to: 51.60 },
    freespinRemainingUp:        { from: 52.0, to: 52.35 },
    freespinWon:                { from: 53.0, to: 54.40 },
    heartbeatLoop:              { from: 55.0, to: 55.85 },
    heartbeatNoise:             { from: 56.0, to: 58.10 },
    heartbeatSlowdrop:          { from: 59.0, to: 59.50 },
    infoboardTotalwin:          { from: 60.0, to: 60.90 },
    infoboardTotalwinBigwin:    { from: 62.0, to: 63.80 },
    infoboardTotalwinMedwin:    { from: 65.0, to: 66.10 },
    infoboardTotalwinMedwinEnd: { from: 67.0, to: 68.05 },
    multiplierA:                { from: 69.0, to: 70.30 },
    multiplierB:                { from: 71.0, to: 72.30 },
    multiplierC:                { from: 73.0, to: 74.50 },
    multiplierUpUpUp:           { from: 75.0, to: 76.90 },
    prizeMedwin:                { from: 77.0, to: 78.70 },
    prizeSmallwin:              { from: 79.0, to: 80.50 },
    reelLoop:                   { from: 81.0, to: 82.50 },
    reelQuickstop:              { from: 83.0, to: 83.35 },
    reelStopSingle:             { from: 84.0, to: 84.18 },
    spinBtn:                    { from: 85.0, to: 85.45 },
    symbolCollapse:             { from: 86.0, to: 86.35 }, // Full crisp impact thud (not 36ms glitch)
    symbolScatter:              { from: 87.2, to: 88.30 },
    symbolShrink:               { from: 89.2, to: 89.80 },
    symbolWild:                 { from: 90.2, to: 91.30 },
    uiClick:                    { from: 92.0, to: 92.20 },
    uiCollect:                  { from: 93.0, to: 93.80 },
    uiStart:                    { from: 94.0, to: 94.45 },
    uiStartOut:                 { from: 95.1, to: 95.45 }
  };

  // Mandarin Voice callouts (monophonic channel)
  const VOX_SPRITES = {
    maJiangHuLe:         { from: 0.0,  to: 2.27 },
    multiplierAVox:      { from: 3.0,  to: 3.65 },
    multiplierBVox:      { from: 4.0,  to: 4.55 },
    multiplierBonusAVox: { from: 5.0,  to: 5.77 },
    multiplierBonusBVox: { from: 6.0,  to: 6.81 },
    multiplierBonusCVox: { from: 7.0,  to: 7.93 },
    multiplierCVox:      { from: 8.0,  to: 8.63 },
    voxPayout2tiao:      { from: 9.0,  to: 9.85 },
    voxPayout2tong:      { from: 10.0, to: 10.85 },
    voxPayout5tiao:      { from: 11.0, to: 11.80 },
    voxPayout5tong:      { from: 12.0, to: 13.40 },
    voxPayout8wan:       { from: 14.0, to: 14.95 },
    voxPayoutBaiban:     { from: 15.0, to: 16.10 },
    voxPayoutFacai:      { from: 17.0, to: 17.60 },
    voxPayoutHongzhong:  { from: 18.0, to: 19.15 },
    voxPayoutMultiSym01: { from: 20.0, to: 21.20 },
    voxPayoutMultiSym02: { from: 22.0, to: 23.10 },
    voxRandom01:         { from: 24.0, to: 26.60 },
    voxRandom02:         { from: 27.0, to: 30.00 },
    voxRandom03:         { from: 30.0, to: 32.00 },
    voxRandom04:         { from: 32.0, to: 33.75 },
    voxRandom05:         { from: 34.0, to: 36.80 },
    voxRandom06:         { from: 37.0, to: 38.60 },
    voxRandom07:         { from: 39.0, to: 40.55 },
    voxRandom08:         { from: 41.0, to: 42.80 },
    voxRandom09:         { from: 43.0, to: 44.00 },
    voxRandom10:         { from: 44.0, to: 46.20 },
    voxRandom11:         { from: 47.0, to: 49.90 },
    voxRandom12:         { from: 50.0, to: 52.80 }
  };

  const UI_SPRITES = {
    btnPress:            { from: 0.0, to: 0.28 },
    listItemClick:       { from: 1.0, to: 1.15 },
    menuIconPress:       { from: 2.0, to: 2.30 },
    sliderEffect:        { from: 3.0, to: 3.20 },
    walletCountingAbove: { from: 4.0, to: 4.55 }
  };

  // One-shot cues that share a channel: a new cue fades out the one still ringing in the same group,
  // so long tails (win chimes, multiplier stingers, big-win music) never pile up on top of each other.
  // Any cue not listed here is its own group (retriggering it cuts its previous instance).
  const CUE_GROUPS = {
    prizeSmallwin:           'win',
    prizeMedwin:             'win',
    infoboardTotalwin:       'win',
    multiplierA:             'multiplier',
    multiplierB:             'multiplier',
    multiplierC:             'multiplier',
    multiplierUpUpUp:        'multiplier',
    bgmBigwin:               'bigwin',
    bgmBigwinEnd:            'bigwin',
    fastspinStart:           'anticipation',
    fastspinEnd:             'anticipation'
  };

  // Rhythmic ticks that are already rate-limited and are meant to overlap
  const NO_CHOKE_CUES = new Set(['walletCountingAbove']);

  class MahjongAudio {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.compressor = null;
      this.bgmGain = null;
      this.sfxGain = null;
      this.voxGain = null;

      this.enabled = true;
      this.currentBgmKey = null;
      this.bgmFreeSpinMode = false;

      this.buffers = {};
      this.loadingPromises = {};

      this.activeBgmSource = null;
      this.activeBgmGain = null;
      this.activeLoopSources = {};
      this.activeShots = {};
      this.activeVoxSource = null;
      this.activeVoxGain = null;

      this._lastCoinTick = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();

          // Master Bus with Studio Dynamics Compressor (prevents distortion & clipping)
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 1.0;

          this.compressor = this.ctx.createDynamicsCompressor();
          this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
          this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
          this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
          this.compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
          this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

          this.masterGain.connect(this.compressor);
          this.compressor.connect(this.ctx.destination);

          // Sub-busses
          this.bgmGain = this.ctx.createGain();
          this.bgmGain.gain.value = 0.50; // Balanced atmospheric background
          this.bgmGain.connect(this.masterGain);

          this.sfxGain = this.ctx.createGain();
          this.sfxGain.gain.value = 0.85;
          this.sfxGain.connect(this.masterGain);

          this.voxGain = this.ctx.createGain();
          this.voxGain.gain.value = 0.90; // Clear, punchy voice callouts
          this.voxGain.connect(this.masterGain);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.preloadAll();
    }

    async preloadAll() {
      const files = {
        bgm_mg: '707e06bc-e0fd-413c-8403-7ea54c9d9252.930a4.mp3',
        bgm_bonus_loop: 'b83a99d7-a5a6-4774-8747-9679a8750e7a.55d20.mp3',
        general_audio: '671c5bc3-bbee-4aa1-b8dc-d32047af93f1.6dc1c.mp3',
        vox: '35f37ba4-b805-4315-b9cd-37491e61ee25.54563.mp3',
        ui_audio: 'aef67769-4c48-42ea-b7cc-df63b14b6d8f.7dba1.mp3'
      };

      const promises = Object.entries(files).map(([key, filename]) =>
        this._loadBuffer(key, AUDIO_BASE + filename)
      );
      return Promise.allSettled(promises);
    }

    async _loadBuffer(key, url) {
      if (this.buffers[key]) return this.buffers[key];
      if (this.loadingPromises[key]) return this.loadingPromises[key];

      this.loadingPromises[key] = (async () => {
        try {
          const resp = await fetch(url);
          const arr = await resp.arrayBuffer();
          if (!this.ctx) this.init();
          const decoded = await this.ctx.decodeAudioData(arr);
          this.buffers[key] = decoded;
          return decoded;
        } catch (err) {
          console.warn('Failed to load audio bank:', key, err);
          return null;
        }
      })();
      return this.loadingPromises[key];
    }

    // Play SFX Sprite with micro-fade envelope (no audio clicks)
    playSprite(bankKey, spriteMap, cueName, volume = 1.0, loop = false, outputBus = null) {
      if (!this.enabled) return null;
      this.init();
      const buf = this.buffers[bankKey];
      const sprite = spriteMap[cueName];
      if (!buf || !sprite || !this.ctx) return null;

      // Cut the previous instance of this cue (or its group) before the new one starts
      const shotKey = (loop || NO_CHOKE_CUES.has(cueName))
        ? null
        : (CUE_GROUPS[cueName] || bankKey + ':' + cueName);
      if (shotKey) this.stopGroup(shotKey, 0.04);

      try {
        const src = this.ctx.createBufferSource();
        src.buffer = buf;

        const gainNode = this.ctx.createGain();
        const bus = outputBus || this.sfxGain;
        src.connect(gainNode);
        gainNode.connect(bus);

        const duration = Math.max(0.06, sprite.to - sprite.from);
        const now = this.ctx.currentTime;

        // Soft anti-pop attack
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.008);

        if (loop) {
          src.loop = true;
          src.loopStart = sprite.from;
          src.loopEnd = sprite.to;
          src.start(0, sprite.from);
          this.activeLoopSources[cueName] = { src, gain: gainNode };
        } else {
          // Soft anti-pop release before cutoff
          gainNode.gain.setValueAtTime(volume, now + duration - 0.015);
          gainNode.gain.linearRampToValueAtTime(0.001, now + duration);
          src.start(0, sprite.from, duration);

          if (shotKey) {
            const shot = { src, gain: gainNode };
            this.activeShots[shotKey] = shot;
            src.onended = () => {
              if (this.activeShots[shotKey] === shot) delete this.activeShots[shotKey];
            };
          }
        }
        return src;
      } catch (e) {
        return null;
      }
    }

    // Fade a one-shot out and schedule its stop on the audio clock (no pop, no setTimeout drift)
    _fadeOutShot(shot, fadeSec) {
      if (!shot || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const param = shot.gain.gain;
        const current = param.value;
        param.cancelScheduledValues(now);
        param.setValueAtTime(current, now);
        param.linearRampToValueAtTime(0.001, now + fadeSec);
        shot.src.stop(now + fadeSec + 0.01);
      } catch (e) {
        try { shot.src.stop(); } catch (e2) {}
      }
    }

    // Fade out whatever one-shot is still ringing in this group
    stopGroup(groupKey, fadeSec = 0.04) {
      const shot = this.activeShots[groupKey];
      if (!shot) return;
      delete this.activeShots[groupKey];
      this._fadeOutShot(shot, fadeSec);
    }

    // Big-win music is a 20s sprite played as a one-shot: it must end with the celebration, not outlive it
    stopBigWin(fadeSec = 0.35) {
      this.stopGroup('bigwin', fadeSec);
    }

    // Stop looping sound cleanly without popping/clicking
    stopLoopSprite(cueName) {
      const item = this.activeLoopSources[cueName];
      if (item) {
        try {
          const now = this.ctx.currentTime;
          item.gain.gain.setValueAtTime(item.gain.gain.value, now);
          item.gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
          setTimeout(() => {
            try { item.src.stop(); } catch (e) {}
          }, 45);
        } catch (e) {}
        delete this.activeLoopSources[cueName];
      }
    }

    playGeneral(cueName, volume = 0.85, loop = false) {
      return this.playSprite('general_audio', GENERAL_SPRITES, cueName, volume, loop, this.sfxGain);
    }

    playUi(cueName = 'btnPress', volume = 0.85) {
      return this.playSprite('ui_audio', UI_SPRITES, cueName, volume, false, this.sfxGain);
    }

    // Monophonic Voice Channel: ducks previous voice so callouts never talk over each other
    playVox(cueName, volume = 0.88) {
      if (!this.enabled || !VOX_SPRITES[cueName]) return null;
      this.init();
      const buf = this.buffers['vox'];
      const sprite = VOX_SPRITES[cueName];
      if (!buf || !sprite || !this.ctx) return null;

      // Duck / fade out previous active voice
      if (this.activeVoxSource && this.activeVoxGain) {
        try {
          const now = this.ctx.currentTime;
          this.activeVoxGain.gain.setValueAtTime(this.activeVoxGain.gain.value, now);
          this.activeVoxGain.gain.linearRampToValueAtTime(0.001, now + 0.035);
          const oldSrc = this.activeVoxSource;
          setTimeout(() => {
            try { oldSrc.stop(); } catch (e) {}
          }, 40);
        } catch (e) {}
      }

      try {
        const src = this.ctx.createBufferSource();
        src.buffer = buf;

        const gainNode = this.ctx.createGain();
        src.connect(gainNode);
        gainNode.connect(this.voxGain);

        const duration = Math.max(0.1, sprite.to - sprite.from);
        const now = this.ctx.currentTime;

        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.015);
        gainNode.gain.setValueAtTime(volume, now + duration - 0.03);
        gainNode.gain.linearRampToValueAtTime(0.001, now + duration);

        src.start(0, sprite.from, duration);
        this.activeVoxSource = src;
        this.activeVoxGain = gainNode;

        src.onended = () => {
          if (this.activeVoxSource === src) {
            this.activeVoxSource = null;
            this.activeVoxGain = null;
          }
        };
        return src;
      } catch (e) {
        return null;
      }
    }

    // Continuous, Seamless BGM: only switches on mode change; never restarts needlessly
    async startBgm(freeSpinMode = false) {
      if (!this.enabled) return;
      this.init();

      const targetKey = freeSpinMode ? 'bgm_bonus_loop' : 'bgm_mg';

      // If this exact BGM is ALREADY actively playing, keep it playing seamlessly!
      if (this.currentBgmKey === targetKey && this.activeBgmSource) {
        return;
      }

      this.currentBgmKey = targetKey;
      this.bgmFreeSpinMode = freeSpinMode;

      let buf = this.buffers[targetKey];
      if (!buf) {
        buf = await this._loadBuffer(
          targetKey,
          AUDIO_BASE + (freeSpinMode
            ? 'b83a99d7-a5a6-4774-8747-9679a8750e7a.55d20.mp3'
            : '707e06bc-e0fd-413c-8403-7ea54c9d9252.930a4.mp3')
        );
      }
      if (!buf || !this.enabled || !this.ctx) return;

      // Smooth crossfade: fade out previous BGM over 250ms
      this.stopBgm(0.25);

      try {
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;

        const trackGain = this.ctx.createGain();
        const targetVol = freeSpinMode ? 0.65 : 0.52;
        const now = this.ctx.currentTime;

        trackGain.gain.setValueAtTime(0.001, now);
        trackGain.gain.linearRampToValueAtTime(targetVol, now + 0.35);

        src.connect(trackGain);
        trackGain.connect(this.bgmGain);
        src.start(0);

        this.activeBgmSource = src;
        this.activeBgmGain = trackGain;
      } catch (e) {}
    }

    stopBgm(fadeSec = 0.20) {
      if (this.activeBgmSource) {
        const oldSrc = this.activeBgmSource;
        const oldGain = this.activeBgmGain;
        this.activeBgmSource = null;
        this.activeBgmGain = null;
        this.currentBgmKey = null;

        if (oldGain && this.ctx) {
          try {
            const now = this.ctx.currentTime;
            oldGain.gain.setValueAtTime(oldGain.gain.value, now);
            oldGain.gain.linearRampToValueAtTime(0.001, now + fadeSec);
            setTimeout(() => {
              try { oldSrc.stop(); } catch (e) {}
            }, fadeSec * 1000 + 20);
            return;
          } catch (e) {}
        }
        try { oldSrc.stop(); } catch (e) {}
      }
    }

    toggleMute() {
      this.enabled = !this.enabled;
      if (this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(this.enabled ? 1.0 : 0.001, now + 0.08);
      }
      if (!this.enabled) {
        this.stopBgm(0.1);
      } else {
        this.startBgm(this.bgmFreeSpinMode);
      }
      return this.enabled;
    }

    // --- Clean Game Event Audio Hooks ---

    // Clean Start Game: crisp button tap & starts background music (NO premature voice shout!)
    playStartGameButton() {
      this.playGeneral('uiStart', 0.95);
    }

    playUiClick() {
      this.playUi('btnPress', 0.85);
    }

    playSpinStart() {
      // A new spin starts with clean win layers: nothing from the previous spin may ring into it
      ['win', 'multiplier', 'bigwin', 'anticipation'].forEach(group => this.stopGroup(group, 0.12));
      this.playGeneral('spinBtn', 0.85);
      this.stopLoopSprite('reelLoop');
      this.playGeneral('reelLoop', 0.38, true);
    }

    stopSpinLoop() {
      this.stopLoopSprite('reelLoop');
    }

    playReelStop(hasScatter = false, isTurbo = false) {
      if (isTurbo) {
        this.playGeneral('reelQuickstop', 0.80);
      } else {
        this.playGeneral('reelStopSingle', 0.65);
      }
      if (hasScatter) {
        setTimeout(() => this.playGeneral('symbolScatter', 0.95), 40);
      }
    }

    playTileClick() {
      this.playGeneral('reelStopSingle', 0.60);
    }

    playScatterLand() {
      this.playGeneral('symbolScatter', 0.95);
    }

    playAnticipationPulse() {
      this.playGeneral('fastspinStart', 0.85);
    }

    // fastspinEnd shares the 'anticipation' group with fastspinStart (5.6s), so playing it cuts the pulse off
    stopAnticipationPulse() {
      this.playGeneral('fastspinEnd', 0.85);
    }

    // Authentic PG Soft Win Chime & Voice
    playCascadeWin(stepIndex = 0, voxCue = null, isMultipleSymbols = false) {
      if (stepIndex === 0) {
        this.playGeneral('prizeSmallwin', 0.85);
      } else {
        this.playGeneral('prizeMedwin', 0.90);
      }

      // Voice callout with subtle delay so win chime attack is heard clearly
      setTimeout(() => {
        if (isMultipleSymbols) {
          const multiCue = Math.random() < 0.5 ? 'voxPayoutMultiSym01' : 'voxPayoutMultiSym02';
          this.playVox(multiCue, 0.85);
        } else if (voxCue && VOX_SPRITES[voxCue]) {
          this.playVox(voxCue, 0.85);
        }
      }, 100);
    }

    playTileShatter() {
      this.playGeneral('symbolShrink', 0.85);
    }

    playGoldToWild() {
      this.playGeneral('symbolWild', 0.95);
    }

    playTileCollapseImpact() {
      this.playGeneral('symbolCollapse', 0.85);
    }

    // Step up Multiplier (voice triggers on big milestone steps x3/x5/x10)
    playMultiplierUp(stepIndex = 1) {
      if (stepIndex === 1) {
        this.playGeneral('multiplierA', 0.85);
      } else if (stepIndex === 2) {
        this.playGeneral('multiplierB', 0.90);
        setTimeout(() => {
          this.playVox(this.bgmFreeSpinMode ? 'multiplierBonusAVox' : 'multiplierAVox', 0.85);
        }, 160);
      } else if (stepIndex >= 3) {
        this.playGeneral('multiplierC', 0.95);
        setTimeout(() => {
          this.playVox(this.bgmFreeSpinMode ? 'multiplierBonusCVox' : 'multiplierCVox', 0.90);
        }, 160);
      }
    }

    // Throttled Coin Tick: rhythmic ~9 ticks/sec maximum, eliminating machine gun buzz distortion
    playCoinTick() {
      const now = performance.now();
      if (now - this._lastCoinTick < 115) return;
      this._lastCoinTick = now;
      this.playUi('walletCountingAbove', 0.45);
    }

    playScatterTrigger(isFreeSpinTrigger = false) {
      if (isFreeSpinTrigger) {
        this.playGeneral('freespinWon', 0.95);
        setTimeout(() => {
          this.playGeneral('bgmBonusIntro', 0.95);
          this.playVox('maJiangHuLe', 0.95);
        }, 400);
      } else {
        this.playGeneral('bgmBigwin', 0.95);
      }
    }

    playBigWinEnd() {
      this.playGeneral('bgmBigwinEnd', 0.90);
    }

    playCollect() {
      this.playGeneral('uiCollect', 0.85);
    }

    playRandomIdleVox() {
      const idx = 1 + Math.floor(Math.random() * 12);
      const cue = 'voxRandom' + String(idx).padStart(2, '0');
      this.playVox(cue, 0.80);
    }
  }

  window.MahjongSound = new MahjongAudio();
})();
