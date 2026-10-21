// Authentic PG Soft Mahjong Ways (1) Official Audio Engine
// Uses the genuine extracted PG Soft MP3 audio files and exact Cocos Creator AudioConstant sprite timestamps
(function () {
  const AUDIO_BASE = 'assets/pg_native/audio/';

  // Exact timestamps from PG Soft Mahjong Ways (1) AudioConstant module
  const GENERAL_SPRITES = {
    bgmBigwin:        { from: 0,  to: 20.704208 },
    bgmBigwinEnd:     { from: 21, to: 29.450729 },
    bgmBonusIntro:    { from: 30, to: 32.224187 },
    bgmTotalwin:      { from: 33, to: 35.173938 },
    bgmTotalwinEnd:   { from: 36, to: 40.782625 },
    bonusReelSpin:    { from: 41, to: 41.819313 },
    fastspinEnd:      { from: 42, to: 42.875021 },
    fastspinStart:    { from: 43, to: 48.987333 },
    fastspinSuccess:  { from: 49, to: 51.880979 },
    freespinRemainingUp: { from: 52, to: 52.364604 },
    freespinWon:      { from: 53, to: 54.551729 },
    heartbeatLoop:    { from: 55, to: 55.882375 },
    heartbeatNoise:   { from: 56, to: 58.205896 },
    heartbeatSlowdrop:{ from: 59, to: 59.537021 },
    infoboardTotalwin:{ from: 60, to: 61.145854 },
    infoboardTotalwinBigwin: { from: 62, to: 64.189604 },
    infoboardTotalwinMedwin: { from: 65, to: 66.007292 },
    infoboardTotalwinMedwinEnd: { from: 67, to: 68.118854 },
    multiplierA:      { from: 69, to: 70.475437 },
    multiplierB:      { from: 71, to: 72.426625 },
    multiplierC:      { from: 73, to: 74.7075 },
    multiplierUpUpUp: { from: 75, to: 76.987521 },
    prizeMedwin:      { from: 77, to: 78.918771 },
    prizeSmallwin:    { from: 79, to: 80.703167 },
    reelLoop:         { from: 81, to: 82.489271 },
    reelQuickstop:    { from: 83, to: 83.430333 },
    reelStopSingle:   { from: 84, to: 84.190229 },
    spinBtn:          { from: 85, to: 86.0 },
    symbolCollapse:   { from: 86, to: 86.036979 },
    symbolScatter:    { from: 87, to: 88.767729 },
    symbolShrink:     { from: 89, to: 89.829125 },
    symbolWild:       { from: 90, to: 91.588188 },
    uiClick:          { from: 92, to: 92.091875 },
    uiCollect:        { from: 93, to: 93.789333 },
    uiStart:          { from: 94, to: 94.534396 },
    uiStartOut:       { from: 95, to: 95.454188 }
  };

  const VOX_SPRITES = {
    maJiangHuLe:        { from: 0,  to: 2.273979 },
    multiplierAVox:     { from: 3,  to: 3.625 },
    multiplierBVox:     { from: 4,  to: 4.546354 },
    multiplierBonusAVox:{ from: 5,  to: 5.770854 },
    multiplierBonusBVox:{ from: 6,  to: 6.8125 },
    multiplierBonusCVox:{ from: 7,  to: 7.926563 },
    multiplierCVox:     { from: 8,  to: 8.625 },
    voxPayout2tiao:     { from: 9,  to: 9.835938 },
    voxPayout2tong:     { from: 10, to: 10.835938 },
    voxPayout5tiao:     { from: 11, to: 11.783687 },
    voxPayout5tong:     { from: 12, to: 13.401917 },
    voxPayout8wan:      { from: 14, to: 14.940417 },
    voxPayoutBaiban:    { from: 15, to: 16.097146 },
    voxPayoutFacai:     { from: 17, to: 17.574708 },
    voxPayoutHongzhong: { from: 18, to: 19.149396 },
    voxPayoutMultiSym01:{ from: 20, to: 21.162854 },
    voxPayoutMultiSym02:{ from: 22, to: 23.073708 },
    voxRandom01:        { from: 24, to: 26.585229 },
    voxRandom02:        { from: 27, to: 29.988 },
    voxRandom03:        { from: 30, to: 31.980042 },
    voxRandom04:        { from: 32, to: 33.711021 },
    voxRandom05:        { from: 34, to: 36.769 },
    voxRandom06:        { from: 37, to: 38.589792 },
    voxRandom07:        { from: 39, to: 40.519833 },
    voxRandom08:        { from: 41, to: 42.772708 },
    voxRandom09:        { from: 43, to: 43.966542 },
    voxRandom10:        { from: 44, to: 46.168167 },
    voxRandom11:        { from: 47, to: 49.873479 },
    voxRandom12:        { from: 50, to: 52.769 }
  };

  const UI_SPRITES = {
    btnPress:            { from: 0, to: 0.263375 },
    listItemClick:       { from: 1, to: 1.120979 },
    menuIconPress:       { from: 2, to: 2.263375 },
    sliderEffect:        { from: 3, to: 3.15675 },
    walletCountingAbove: { from: 4, to: 4.546188 }
  };

  class MahjongAudio {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.bgmGain = null;
      this.sfxGain = null;
      this.enabled = true;
      this.bgmFreeSpinMode = false;
      this.buffers = {};
      this.loadingPromises = {};
      this.activeBgmSource = null;
      this.activeLoopSources = {};
      this.idleTimer = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 1.0;
          this.masterGain.connect(this.ctx.destination);

          this.bgmGain = this.ctx.createGain();
          this.bgmGain.gain.value = 0.68;
          this.bgmGain.connect(this.masterGain);

          this.sfxGain = this.ctx.createGain();
          this.sfxGain.gain.value = 1.0;
          this.sfxGain.connect(this.masterGain);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
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
          console.warn('Failed to load audio:', key, err);
          return null;
        }
      })();
      return this.loadingPromises[key];
    }

    playSprite(bankKey, spriteMap, cueName, volume = 1.0, loop = false) {
      if (!this.enabled) return null;
      this.init();
      const buf = this.buffers[bankKey];
      const sprite = spriteMap[cueName];
      if (!buf || !sprite || !this.ctx) return null;

      try {
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        src.connect(gain);
        gain.connect(this.sfxGain);

        const duration = Math.max(0.04, sprite.to - sprite.from);
        if (loop) {
          src.loop = true;
          src.loopStart = sprite.from;
          src.loopEnd = sprite.to;
          src.start(0, sprite.from);
          this.activeLoopSources[cueName] = src;
        } else {
          src.start(0, sprite.from, duration);
        }
        return src;
      } catch (e) {
        return null;
      }
    }

    stopLoopSprite(cueName) {
      const src = this.activeLoopSources[cueName];
      if (src) {
        try { src.stop(); } catch (e) {}
        delete this.activeLoopSources[cueName];
      }
    }

    playGeneral(cueName, volume = 1.0, loop = false) {
      return this.playSprite('general_audio', GENERAL_SPRITES, cueName, volume, loop);
    }

    playVox(cueName, volume = 1.0) {
      return this.playSprite('vox', VOX_SPRITES, cueName, volume, false);
    }

    playUi(cueName = 'btnPress', volume = 0.9) {
      return this.playSprite('ui_audio', UI_SPRITES, cueName, volume, false);
    }

    toggleMute() {
      this.enabled = !this.enabled;
      if (this.masterGain) {
        this.masterGain.gain.value = this.enabled ? 1.0 : 0.0;
      }
      if (!this.enabled) {
        this.stopBgm();
      } else {
        this.startBgm(this.bgmFreeSpinMode);
      }
      return this.enabled;
    }

    async startBgm(freeSpinMode = false) {
      this.bgmFreeSpinMode = freeSpinMode;
      if (!this.enabled) return;
      this.init();

      const key = freeSpinMode ? 'bgm_bonus_loop' : 'bgm_mg';
      let buf = this.buffers[key];
      if (!buf) {
        buf = await this._loadBuffer(
          key,
          AUDIO_BASE + (freeSpinMode
            ? 'b83a99d7-a5a6-4774-8747-9679a8750e7a.55d20.mp3'
            : '707e06bc-e0fd-413c-8403-7ea54c9d9252.930a4.mp3')
        );
      }
      if (!buf || !this.enabled || !this.ctx) return;

      this.stopBgm();
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(this.bgmGain);
        src.start(0);
        this.activeBgmSource = src;
      } catch (e) {}
    }

    stopBgm() {
      if (this.activeBgmSource) {
        try { this.activeBgmSource.stop(); } catch (e) {}
        this.activeBgmSource = null;
      }
    }

    // --- High-level Game Event Hooks ---
    playStartGameButton() {
      this.playGeneral('uiStart', 1.0);
      setTimeout(() => {
        this.playVox('maJiangHuLe', 1.0);
      }, 280);
    }

    playUiClick() {
      this.playUi('btnPress', 0.95);
    }

    playSpinStart() {
      this.playGeneral('spinBtn', 1.0);
      this.stopLoopSprite('reelLoop');
      this.playGeneral('reelLoop', 0.65, true);
    }

    stopSpinLoop() {
      this.stopLoopSprite('reelLoop');
    }

    playReelStop(hasScatter = false, isTurbo = false) {
      if (isTurbo) {
        this.playGeneral('reelQuickstop', 0.95);
        return;
      }
      this.playGeneral('reelStopSingle', 1.0);
      if (hasScatter) {
        this.playGeneral('symbolScatter', 1.0);
      }
    }

    playTileClick(reelIdx = 0) {
      this.playGeneral('reelStopSingle', 1.0);
    }

    playScatterLand(scatterCount = 1) {
      this.playGeneral('symbolScatter', 1.0);
    }

    playAnticipationPulse() {
      this.playGeneral('fastspinStart', 0.95);
    }

    stopAnticipationPulse() {
      this.playGeneral('fastspinEnd', 0.95);
    }

    // Authentic PG Soft MJPrizeState: plays Mandarin voice callout & win chime when winning tiles highlight
    playCascadeWin(stepIndex = 0, voxCue = null, isMultipleSymbols = false) {
      if (stepIndex === 0) {
        this.playGeneral('prizeSmallwin', 1.0);
      } else {
        this.playGeneral('prizeMedwin', 1.0);
      }

      if (isMultipleSymbols) {
        const multiCue = Math.random() < 0.5 ? 'voxPayoutMultiSym01' : 'voxPayoutMultiSym02';
        this.playVox(multiCue, 1.0);
      } else if (voxCue && VOX_SPRITES[voxCue]) {
        this.playVox(voxCue, 1.0);
      }
    }

    // Authentic PG Soft removeSymbols: plays symbolShrink ONLY (not symbolCollapse!)
    playTileShatter() {
      this.playGeneral('symbolShrink', 1.0);
    }

    playGoldToWild() {
      this.playGeneral('symbolWild', 1.0);
    }

    // Authentic PG Soft ShiftSlotHandler: plays symbolCollapse at the exact impact moment tiles hit the bottom!
    playTileCollapseImpact() {
      this.playGeneral('symbolCollapse', 1.0);
    }

    // Authentic PG Soft MultiplierBoardController: plays multiplierA/B/C + Mandarin multiplier voice when multiplier steps up
    playMultiplierUp(stepIndex = 1) {
      if (stepIndex === 1) {
        this.playGeneral('multiplierA', 1.0);
        setTimeout(() => {
          this.playVox(this.bgmFreeSpinMode ? 'multiplierBonusAVox' : 'multiplierAVox', 1.0);
        }, 120);
      } else if (stepIndex === 2) {
        this.playGeneral('multiplierB', 1.0);
        setTimeout(() => {
          this.playVox(this.bgmFreeSpinMode ? 'multiplierBonusBVox' : 'multiplierBVox', 1.0);
        }, 120);
      } else if (stepIndex >= 3) {
        this.playGeneral('multiplierC', 1.0);
        setTimeout(() => {
          this.playVox(this.bgmFreeSpinMode ? 'multiplierBonusCVox' : 'multiplierCVox', 1.0);
        }, 120);
      }
    }

    playCoinTick() {
      this.playUi('walletCountingAbove', 0.6);
    }

    playScatterTrigger(isFreeSpinTrigger = false) {
      if (isFreeSpinTrigger) {
        this.playGeneral('freespinWon', 1.0);
        setTimeout(() => {
          this.playGeneral('bgmBonusIntro', 1.0);
          this.playVox('maJiangHuLe', 1.0);
        }, 450);
      } else {
        this.playGeneral('bgmBigwin', 1.0);
      }
    }

    playBigWinEnd() {
      this.playGeneral('bgmBigwinEnd', 1.0);
    }

    playCollect() {
      this.playGeneral('uiCollect', 1.0);
    }

    playRandomIdleVox() {
      const idx = 1 + Math.floor(Math.random() * 12);
      const cue = 'voxRandom' + String(idx).padStart(2, '0');
      this.playVox(cue, 0.9);
    }
  }

  window.MahjongSound = new MahjongAudio();
})();
