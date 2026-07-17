// Client-side only — import di "use client" component

// Tiap guru punya intonasi & ritme bicara beda-beda, jadi browser bisa saja
// menandai `isFinal` di tengah kalimat (kadang sepenggal kata doang). Kalau
// tiap hasil `isFinal` langsung ditampilkan sebagai baris sendiri, subtitle
// jadi patah-patah per kata. Solusinya: tunggu jeda bicara sungguhan (bukan
// sinyal `isFinal` mentah dari browser) sebelum satu kalimat dianggap selesai.
const SENTENCE_PAUSE_MS = 1300;
const SENTENCE_END_PUNCTUATION = /[.!?]\s*$/;

export class SpeechHandler {
  private recognition: SpeechRecognition | null = null;
  private onChunk: (text: string, isFinal: boolean) => void;
  private onError?: (error: string) => void;
  private stopped = false;

  private sentenceBuffer = "";
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.sentenceBuffer = "";
    this.clearFlushTimer();
    this.recognition = new SR();
    this.recognition.lang = lang; // "id-ID" Bahasa Indonesia
    this.recognition.continuous = true; // terus rekam
    this.recognition.interimResults = true; // tampil hasil sementara

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          this.appendToSentence(result[0].transcript);
        } else {
          // Preview tetap tampil live per kata, tapi digabung dengan sisa
          // kalimat yang sudah difinalkan supaya keliatan nyambung utuh.
          const preview = `${this.sentenceBuffer} ${result[0].transcript}`.trim();
          this.onChunk(preview, false);
        }
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

  private appendToSentence(text: string) {
    this.sentenceBuffer = `${this.sentenceBuffer} ${text}`.trim();
    if (!this.sentenceBuffer) return;

    if (SENTENCE_END_PUNCTUATION.test(this.sentenceBuffer)) {
      this.flushSentence();
      return;
    }

    this.clearFlushTimer();
    this.flushTimer = setTimeout(() => this.flushSentence(), SENTENCE_PAUSE_MS);
  }

  private flushSentence() {
    this.clearFlushTimer();
    if (!this.sentenceBuffer) return;
    const text = this.sentenceBuffer;
    this.sentenceBuffer = "";
    this.onChunk(text, true);
  }

  private clearFlushTimer() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  stop() {
    this.stopped = true;
    this.flushSentence();
    this.recognition?.stop();
    this.recognition = null;
  }

  pause() {
    this.stopped = true;
    this.flushSentence();
    this.recognition?.stop();
  }

  resume() {
    this.stopped = false;
    this.recognition?.start();
  }
}
