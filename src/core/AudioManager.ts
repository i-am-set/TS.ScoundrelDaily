import { sound } from "@pixi/sound";

export class AudioManager {
  private static lastPlayed: Record<string, number> = {};

  public static async init(): Promise<void> {
    const ctx = sound.context as any;

    if (ctx.audioContext && ctx.compressor) {
      const compressor = ctx.compressor as DynamicsCompressorNode;
      compressor.threshold.value = -12;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
    }

    const sfxList = [
      "hover",
      "click",
      "discard",
      "draw",
      "deck_return",
      "skip",
      "heal_full",
      "heal_partial",
      "heal_zero",
      "damage",
      "damage_reduced",
      "die",
      "defeat",
      "victory",
      "enemy_die",
      "new_room",
      "equip",
      "weapon_discard",
      "score_tick",
      "impact",
    ];

    for (const sfx of sfxList) {
      sound.add(sfx, `/sfx/${sfx}.ogg`);
    }
  }

  public static play(name: string, throttleMs: number = 0): void {
    const now = performance.now();
    if (throttleMs > 0) {
      const last = this.lastPlayed[name] || 0;
      if (now - last < throttleMs) return;
    }
    this.lastPlayed[name] = now;

    const speed = 0.8 + Math.random() * 0.4;
    sound.play(name, { speed });
  }
}
