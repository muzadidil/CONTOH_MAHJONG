// Web Audio API Synthesizer for PG Soft Mahjong Ways (1)
(function () {
  class MahjongAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.bgmPlaying = false;
      this.bgmTimer = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.enabled = !this.enabled;
      if (!this.enabled) {
        this.stopBgm();
      } else {
        this.startBgm();
      }
      return this.enabled;
    }

    // Crisp Mahjong ivory tile click ("tak!")
    playTileClick(pitchOffset = 0) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620 + pitchOffset * 65, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.055);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    }

    // Spin button press sound
    playSpinStart() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [330, 440, 587, 659];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.035);
        gain.gain.setValueAtTime(0.16, now + i * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.035);
        osc.stop(now + i * 0.035 + 0.13);
      });
    }

    // Cascade win chord + multiplier rising pitch
    playCascadeWin(stepIndex = 0) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const baseScale = [523.25, 659.25, 783.99, 1046.5];
      const multShift = 1 + stepIndex * 0.15;

      baseScale.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * multShift, now + idx * 0.055);
        gain.gain.setValueAtTime(0.22, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.3);
      });
    }

    // Gold tile morphing into Wild Ingot sound
    playGoldToWild() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.22);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    // Scatter (胡) land / Free Spin trigger celebratory gong
    playScatterTrigger() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const chord = [293.66, 440, 587.33, 880, 1174.66];
      chord.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.14, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + 1.15);
      });
    }

    // Subtle Chinese Pentatonic Guzheng loop
    startBgm() {
      if (!this.enabled || this.bgmPlaying) return;
      this.init();
      if (!this.ctx) return;
      this.bgmPlaying = true;

      // D Major Pentatonic (D, E, F#, A, B)
      const pentatonic = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25];
      let step = 0;
      const pattern = [0, 2, 3, 5, 4, 3, 1, 2];

      this.bgmTimer = setInterval(() => {
        if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const note = pentatonic[pattern[step % pattern.length]];
        step++;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.42);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      }, 480);
    }

    stopBgm() {
      this.bgmPlaying = false;
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  }

  window.MahjongSound = new MahjongAudio();
})();
