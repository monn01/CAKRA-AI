// Client-side only — import di "use client" component

export class SpeechHandler {
  private recognition: SpeechRecognition | null = null;
  private onChunk: (text: string, isFinal: boolean) => void;
  private onError?: (error: string) => void;
  private stopped = false;

  constructor(
    onChunk: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ) {
    this.onChunk = onChunk;
    this.onError = onError;
  }

  static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  start(lang: string = "id-ID") {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) throw new Error("Browser tidak support Speech Recognition");

    this.stopped = false;
    this.recognition = new SR();
    this.recognition.lang = lang; // "id-ID" Bahasa Indonesia
    this.recognition.continuous = true; // terus rekam
    this.recognition.interimResults = true; // tampil hasil sementara

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        this.onChunk(result[0].transcript, result.isFinal);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("STT error:", event.error);
      this.onError?.(event.error);
      if (event.error === "network" && !this.stopped) {
        setTimeout(() => this.recognition?.start(), 1000);
      }
    };

    // Browser auto-stop setelah silence, restart otomatis
    this.recognition.onend = () => {
      if (!this.stopped) this.recognition?.start();
    };

    this.recognition.start();
  }

  stop() {
    this.stopped = true;
    this.recognition?.stop();
    this.recognition = null;
  }

  pause() {
    this.stopped = true;
    this.recognition?.stop();
  }

  resume() {
    this.stopped = false;
    this.recognition?.start();
  }
}
