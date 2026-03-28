export class AudioJuice {
  private static ctx: AudioContext | null = null;

  public static init(): void {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  private static playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    vol: number = 0.1,
    slideFreq?: number,
    slideTime?: number,
  ): void {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        slideFreq,
        this.ctx.currentTime + (slideTime || duration),
      );
    }

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.ctx.currentTime + duration,
    );

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public static hover(): void {
    this.playTone(800, "sine", 0.03, 0.01);
  }

  public static click(): void {
    this.playTone(600, "triangle", 0.05, 0.03, 400);
  }

  public static discard(): void {
    this.playTone(200, "square", 0.1, 0.02, 100);
  }

  public static draw(): void {
    this.playTone(300, "sine", 0.08, 0.02, 600);
  }

  public static deckReturn(): void {
    this.playTone(500, "sine", 0.1, 0.02, 200);
  }

  public static skipRoom(): void {
    this.playTone(300, "triangle", 0.2, 0.03, 150);
  }

  public static healFull(): void {
    this.playTone(400, "sine", 0.1, 0.05);
    setTimeout(() => this.playTone(600, "sine", 0.1, 0.05), 100);
    setTimeout(() => this.playTone(800, "sine", 0.2, 0.05), 200);
  }

  public static healPartial(): void {
    this.playTone(400, "sine", 0.1, 0.05);
    setTimeout(() => this.playTone(600, "sine", 0.2, 0.05), 100);
  }

  public static healZero(): void {
    this.playTone(250, "sine", 0.15, 0.04, 200);
  }

  public static damage(): void {
    this.playTone(150, "sawtooth", 0.3, 0.08, 50);
  }

  public static dying(): void {
    this.playTone(100, "sawtooth", 1.0, 0.1, 20);
  }

  public static defeat(): void {
    this.playTone(300, "triangle", 0.3, 0.05);
    setTimeout(() => this.playTone(250, "triangle", 0.3, 0.05), 300);
    setTimeout(() => this.playTone(200, "triangle", 0.6, 0.05), 600);
  }

  public static victory(): void {
    this.playTone(400, "square", 0.2, 0.04);
    setTimeout(() => this.playTone(500, "square", 0.2, 0.04), 200);
    setTimeout(() => this.playTone(600, "square", 0.2, 0.04), 400);
    setTimeout(() => this.playTone(800, "square", 0.6, 0.04), 600);
  }

  public static enemyDying(): void {
    this.playTone(100, "square", 0.15, 0.05, 50);
  }

  public static newRoom(): void {
    this.playTone(400, "sine", 0.3, 0.03);
    this.playTone(600, "sine", 0.3, 0.03);
  }

  public static equipWeapon(): void {
    this.playTone(800, "square", 0.1, 0.03, 1200);
  }

  public static discardWeapon(): void {
    this.playTone(200, "square", 0.15, 0.03, 100);
  }

  public static scoreTick(): void {
    this.playTone(1200, "sine", 0.02, 0.01);
  }

  public static scoreSlam(): void {
    this.playTone(100, "square", 0.4, 0.1, 20);
  }

  public static error(): void {
    this.playTone(200, "square", 0.15, 0.05, 150);
  }
}
