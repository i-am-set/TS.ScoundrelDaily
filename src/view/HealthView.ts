import { Container, Text, TextStyle, Ticker } from "pixi.js";
import { GameConfig } from "../data/GameConfig";

interface FloatingText {
  text: Text;
  life: number;
  maxLife: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class HealthView extends Container {
  private hpLabelText: Text;
  private hpValueText: Text;
  private hpPreviewText: Text;

  private hpSpringV: number = 0;
  private hpScale: number = 1;
  private hpRotV: number = 0;
  private hpRot: number = 0;
  private hpEffectTimer: number = 0;
  private hpEffectType: "damage" | "heal" | "none" = "none";
  private baseHpColor: number = GameConfig.colors.ui.healthGreen;
  private floatingTexts: FloatingText[] = [];

  constructor() {
    super();
    this.sortableChildren = true;

    this.hpLabelText = new Text({
      text: "HP",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 48,
        fontWeight: "bold",
        fill: GameConfig.colors.textLight,
        letterSpacing: 2,
        stroke: { color: 0x000000, width: 6 },
      }),
    });
    this.hpLabelText.anchor.set(0.5, 1);
    this.hpLabelText.y = -65;
    this.addChild(this.hpLabelText);

    this.hpValueText = new Text({
      text: "20",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 128,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 8 },
      }),
    });
    this.hpValueText.tint = GameConfig.colors.ui.healthGreen;
    this.hpValueText.anchor.set(0.5, 0.5);
    this.addChild(this.hpValueText);

    this.hpPreviewText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 40,
        fontWeight: "bold",
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 5 },
      }),
    });
    this.hpPreviewText.anchor.set(0.5, 0);
    this.hpPreviewText.y = 65;
    this.addChild(this.hpPreviewText);

    Ticker.shared.add(this.update, this);
  }

  public setHealth(health: number): void {
    this.hpValueText.text = `${health}`;
    if (health > 13) {
      this.baseHpColor = GameConfig.colors.ui.healthGreen;
    } else if (health > 6) {
      this.baseHpColor = GameConfig.colors.ui.healthOrange;
    } else {
      this.baseHpColor = GameConfig.colors.ui.healthRed;
    }

    if (this.hpEffectTimer <= 0) {
      this.hpValueText.tint = this.baseHpColor;
    }
  }

  public setPreview(text: string, color: number): void {
    this.hpPreviewText.text = text;
    this.hpPreviewText.tint = color;
  }

  public playDamage(amount: number): void {
    this.hpScale = 1.5;
    this.hpRot = (Math.random() > 0.5 ? 1 : -1) * 0.2;
    this.hpEffectTimer = 300;
    this.hpEffectType = "damage";
    this.spawnFloatingText(
      `-${amount}`,
      0x000000,
      GameConfig.colors.ui.healthRed,
    );
  }

  public playHeal(amount: number): void {
    this.hpScale = 1.3;
    this.hpRot = (Math.random() > 0.5 ? 1 : -1) * 0.1;
    this.hpEffectTimer = 300;
    this.hpEffectType = "heal";
    this.spawnFloatingText(
      `+${amount}`,
      0x000000,
      GameConfig.colors.ui.healthGreen,
    );
  }

  public hideLabels(): void {
    this.hpLabelText.visible = false;
    this.hpPreviewText.visible = false;
  }

  private spawnFloatingText(
    str: string,
    strokeColor: number,
    fillColor: number,
  ): void {
    const text = new Text({
      text: str,
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 64,
        fontWeight: "900",
        fill: fillColor,
        stroke: { color: strokeColor, width: 6 },
        dropShadow: { alpha: 0.3, blur: 4, color: 0x000000, distance: 4 },
      }),
    });
    text.anchor.set(0.5);
    text.zIndex = 850;

    const startX = (Math.random() - 0.5) * 40;
    const startY = -60;
    text.position.set(startX, startY);

    this.addChild(text);

    this.floatingTexts.push({
      text,
      life: 1200,
      maxLife: 1200,
      x: startX,
      y: startY,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -2.5 - Math.random() * 1.5,
    });
  }

  private update(ticker: Ticker): void {
    const dt = ticker.deltaTime;
    const tension = 0.15;
    const dampening = 0.75;

    this.hpSpringV += (1 - this.hpScale) * tension;
    this.hpSpringV *= dampening;
    this.hpScale += this.hpSpringV;
    this.hpValueText.scale.set(this.hpScale);

    this.hpRotV += (0 - this.hpRot) * tension;
    this.hpRotV *= dampening;
    this.hpRot += this.hpRotV;
    this.hpValueText.rotation = this.hpRot;

    if (this.hpEffectTimer > 0) {
      this.hpEffectTimer -= ticker.deltaMS;
      const isWhite = Math.floor(this.hpEffectTimer / 50) % 2 === 0;
      if (this.hpEffectType === "damage") {
        this.hpValueText.tint = isWhite ? 0xffffff : 0xff0000;
      } else if (this.hpEffectType === "heal") {
        this.hpValueText.tint = isWhite ? 0xffffff : 0x00ff00;
      }
    } else {
      this.hpValueText.tint = this.baseHpColor;
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= ticker.deltaMS;
      ft.x += ft.vx * dt;
      ft.y += ft.vy * dt;
      ft.text.position.set(ft.x, ft.y);
      ft.text.alpha = Math.max(0, ft.life / ft.maxLife);
      if (ft.life <= 0) {
        ft.text.destroy();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public destroy(options?: any): void {
    Ticker.shared.remove(this.update, this);
    super.destroy(options);
  }
}
