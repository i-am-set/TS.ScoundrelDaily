export class Random {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  public next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public static getDailySeed(): number {
    const d = new Date();
    const dateString = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    let hash = 2166136261;
    for (let i = 0; i < dateString.length; i++) {
      hash = Math.imul(hash ^ dateString.charCodeAt(i), 16777619);
    }
    return hash >>> 0;
  }

  public static getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  public static getDungeonNumber(): number {
    const start = new Date(2025, 11, 15);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
}
