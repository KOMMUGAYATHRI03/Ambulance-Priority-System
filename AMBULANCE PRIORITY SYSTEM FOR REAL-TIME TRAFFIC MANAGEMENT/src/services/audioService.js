// Web Audio API Sound Synthesizer for Emergency Siren & Signals

class AudioService {
  constructor() {
    this.audioCtx = null;
    this.sirenOsc1 = null;
    this.sirenOsc2 = null;
    this.sirenGain = null;
    this.isPlayingSiren = false;
    this.sirenInterval = null;
    this.sirenMode = 'wail'; // 'wail', 'yelp', 'hi-lo'
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSiren(enabled, mode = 'wail') {
    this.initContext();
    if (!this.audioCtx) return;

    if (!enabled) {
      this.stopSiren();
      return;
    }

    if (this.isPlayingSiren && this.sirenMode === mode) return;

    this.stopSiren();
    this.sirenMode = mode;
    this.isPlayingSiren = true;

    try {
      this.sirenGain = this.audioCtx.createGain();
      this.sirenGain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      this.sirenGain.connect(this.audioCtx.destination);

      this.sirenOsc1 = this.audioCtx.createOscillator();
      this.sirenOsc1.type = 'sawtooth';
      this.sirenOsc1.connect(this.sirenGain);
      this.sirenOsc1.start();

      let freqLow = 650;
      let freqHigh = 950;
      let stepTime = 1200; // ms

      if (mode === 'yelp') {
        freqLow = 700;
        freqHigh = 1200;
        stepTime = 300;
      } else if (mode === 'hi-lo') {
        stepTime = 500;
      }

      let toggle = false;

      const updatePitch = () => {
        if (!this.isPlayingSiren || !this.sirenOsc1) return;
        const now = this.audioCtx.currentTime;

        if (mode === 'hi-lo') {
          this.sirenOsc1.frequency.setValueAtTime(toggle ? 900 : 700, now);
        } else {
          // Wail or Yelp sweep
          this.sirenOsc1.frequency.cancelScheduledValues(now);
          this.sirenOsc1.frequency.setValueAtTime(toggle ? freqLow : freqHigh, now);
          this.sirenOsc1.frequency.linearRampToValueAtTime(
            toggle ? freqHigh : freqLow,
            now + stepTime / 1000
          );
        }
        toggle = !toggle;
      };

      updatePitch();
      this.sirenInterval = setInterval(updatePitch, stepTime);
    } catch (err) {
      console.warn('Audio siren error:', err);
    }
  }

  stopSiren() {
    this.isPlayingSiren = false;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc1) {
      try {
        this.sirenOsc1.stop();
        this.sirenOsc1.disconnect();
      } catch (e) {}
      this.sirenOsc1 = null;
    }
  }

  playPreemptionChime() {
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (err) {
      console.warn('Chime audio error:', err);
    }
  }

  playEmergencyAlertSound() {
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (err) {}
  }
}

export const audioService = new AudioService();
