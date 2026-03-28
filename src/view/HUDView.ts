import { Container, Text, TextStyle, Graphics, Ticker } from "pixi.js";
import { GameConfig } from "../data/GameConfig";

export class HUDView extends Container {
  private skipContainer: Container;
  private skipBtnBg: Graphics;
  private skipText: Text;
  private roomText: Text;
  private skipStrikethrough: Graphics;
  private helpBtn: Container;

  private isSkipEnabled: boolean = false;
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;

  constructor() {
    super();

    this.skipContainer = new Container();

    this.roomText = new Text({
      text: "ROOM: 1",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 20,
        fontWeight: "bold",
        fill: GameConfig.colors.textLight,
        letterSpacing: 2,
        stroke: { color: 0x000000, width: 4 },
      }),
    });
    this.roomText.anchor.set(0.5, 1);
    this.roomText.y = -35;
    this.skipContainer.addChild(this.roomText);

    this.skipBtnBg = new Graphics()
      .roundRect(-100, -25, 200, 50, 8)
      .fill({ color: GameConfig.colors.ui.buttonBg, alpha: 1 })
      .stroke({ width: 2, color: GameConfig.colors.ui.avoidActive });
    this.skipBtnBg.eventMode = "static";
    this.skipBtnBg.cursor = "pointer";

    this.skipBtnBg.on("pointerdown", () => this.emit("skipClicked"));
    this.skipBtnBg.on("pointerenter", () => {
      if (this.skipBtnBg.eventMode === "static") {
        this.skipBtnBg
          .clear()
          .roundRect(-100, -25, 200, 50, 8)
          .fill({ color: GameConfig.colors.ui.buttonHover, alpha: 1 })
          .stroke({ width: 2, color: GameConfig.colors.ui.avoidActive });
      }
    });
    this.skipBtnBg.on("pointerleave", () => {
      if (this.skipBtnBg.eventMode === "static") {
        this.skipBtnBg
          .clear()
          .roundRect(-100, -25, 200, 50, 8)
          .fill({ color: GameConfig.colors.ui.buttonBg, alpha: 1 })
          .stroke({ width: 2, color: GameConfig.colors.ui.avoidActive });
      }
    });
    this.skipContainer.addChild(this.skipBtnBg);

    this.skipText = new Text({
      text: "SKIP ROOM",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 20,
        fontWeight: "900",
        fill: GameConfig.colors.ui.avoidActive,
        letterSpacing: 2,
        stroke: { color: 0x000000, width: 4 },
      }),
    });
    this.skipText.anchor.set(0.5);
    this.skipContainer.addChild(this.skipText);

    this.skipStrikethrough = new Graphics()
      .moveTo(-80, 0)
      .lineTo(80, 0)
      .stroke({ width: 4, color: GameConfig.colors.ui.avoidDisabled });
    this.skipStrikethrough.visible = false;
    this.skipContainer.addChild(this.skipStrikethrough);

    this.addChild(this.skipContainer);

    this.helpBtn = new Container();
    const helpBg = new Graphics()
      .circle(0, 0, 24)
      .fill({ color: GameConfig.colors.ui.buttonBg })
      .stroke({ width: 2, color: GameConfig.colors.textLight });
    this.helpBtn.addChild(helpBg);

    const helpText = new Text({
      text: "?",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 28,
        fontWeight: "bold",
        fill: GameConfig.colors.textLight,
      }),
    });
    helpText.anchor.set(0.5);
    this.helpBtn.addChild(helpText);

    this.helpBtn.eventMode = "static";
    this.helpBtn.cursor = "pointer";
    this.helpBtn.zIndex = 1000;
    this.helpBtn.on("pointerdown", () => this.emit("helpClicked"));
    this.addChild(this.helpBtn);

    Ticker.shared.add(this.update, this);
  }

  public updateRoom(roomCount: number): void {
    this.roomText.text = `ROOM: ${roomCount}`;
  }

  public setSkipEnabled(isEnabled: boolean): void {
    if (isEnabled && !this.isSkipEnabled) {
      this.shakeTimer = 500;
      this.shakeIntensity = 12;
    }
    this.isSkipEnabled = isEnabled;

    this.skipBtnBg.eventMode = isEnabled ? "static" : "none";
    this.skipBtnBg.cursor = isEnabled ? "pointer" : "default";

    this.skipBtnBg
      .clear()
      .roundRect(-100, -25, 200, 50, 8)
      .fill({ color: GameConfig.colors.ui.buttonBg, alpha: 1 })
      .stroke({
        width: 2,
        color: isEnabled
          ? GameConfig.colors.ui.avoidActive
          : GameConfig.colors.ui.avoidDisabled,
      });

    this.skipText.style.fill = isEnabled
      ? GameConfig.colors.ui.avoidActive
      : GameConfig.colors.ui.avoidDisabled;
    this.skipStrikethrough.visible = !isEnabled;
  }

  public resize(
    width: number,
    height: number,
    globalScale: number,
    skipX: number,
    skipY: number,
  ): void {
    this.skipContainer.position.set(skipX, skipY);
    this.skipContainer.scale.set(globalScale);
    this.helpBtn.position.set(width - 60, height - 60);
  }

  private update(ticker: Ticker): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= ticker.deltaMS;
      const progress = Math.max(0, this.shakeTimer) / 500;
      const mag = this.shakeIntensity * progress;
      this.skipContainer.pivot.x = Math.sin(this.shakeTimer * 0.05) * mag;
      if (this.shakeTimer <= 0) {
        this.skipContainer.pivot.x = 0;
      }
    }
  }

  public destroy(options?: any): void {
    Ticker.shared.remove(this.update, this);
    super.destroy(options);
  }
}
