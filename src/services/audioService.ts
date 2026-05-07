
class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playAtk() {
    this.playTone(150, 'square', 0.1, 0.1);
    setTimeout(() => this.playTone(100, 'square', 0.1, 0.05), 50);
  }

  playHit() {
    this.playTone(80, 'sawtooth', 0.2, 0.2);
  }

  playSkill() {
    this.playTone(400, 'sine', 0.3, 0.1);
    this.playTone(600, 'sine', 0.3, 0.1);
  }

  playPickup() {
    this.playTone(800, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(1200, 'sine', 0.1, 0.1), 50);
  }

  playLevelUp() {
    const tones = [440, 554.37, 659.25, 880];
    tones.forEach((t, i) => {
      setTimeout(() => this.playTone(t, 'square', 0.2, 0.1), i * 100);
    });
  }

  playArise() {
    this.playTone(50, 'sawtooth', 1.0, 0.3);
    this.playTone(100, 'sine', 1.0, 0.2);
  }
}

export const audio = new AudioService();
