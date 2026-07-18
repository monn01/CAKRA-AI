// Browser lama (WebView Android jadul di sekolah 3T) masih pakai prefix webkit.
type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

class SoundManager {
  private isMuted: boolean = false;
  // SATU AudioContext dipakai ulang untuk semua suara. Chrome membatasi
  // ±6 AudioContext per halaman — kalau bikin context baru tiap play
  // (playCorrect saja butuh 4 nada), limit kelewat setelah 1-2 soal kuis
  // dan semua suara mati diam-diam karena constructor-nya throw.
  private ctx: AudioContext | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("sibi-ai:muted") === "true";
    }
  }

  getMuteStatus() {
    return this.isMuted;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("sibi-ai:muted", String(muted));
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    // Autoplay policy bisa menaruh context di state "suspended" sampai ada
    // gesture user — resume di sini (dipanggil dari handler klik) membangunkannya.
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    startTimeOffset: number = 0,
    volume: number = 0.1
  ) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);

      gain.gain.setValueAtTime(volume, ctx.currentTime + startTimeOffset);
      // Exponential decay
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + startTimeOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTimeOffset);
      osc.stop(ctx.currentTime + startTimeOffset + duration);
      // Lepas node setelah selesai supaya graph audio tidak numpuk.
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Best-effort
    }
  }

  playPop() {
    // Bubble pop: fast frequency sweep upwards
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Best-effort
    }
  }

  playCorrect() {
    // Correct chime: ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 -> E5 -> G5 -> C6
    notes.forEach((freq, idx) => {
      this.playTone(freq, "triangle", 0.25, idx * 0.06, 0.1);
    });
  }

  playIncorrect() {
    // Incorrect: descending buzz
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Best-effort
    }
  }

  playWin() {
    // Winner fanfare
    const notes = [523.25, 523.25, 523.25, 659.25, 523.25, 783.99];
    const timings = [0, 0.08, 0.16, 0.24, 0.36, 0.48];
    notes.forEach((freq, idx) => {
      this.playTone(freq, "triangle", 0.35, timings[idx], 0.1);
    });
  }
}

export const playSound = new SoundManager();
