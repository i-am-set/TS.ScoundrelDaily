import { Container, Text, TextStyle, Graphics, Ticker } from "pixi.js";
import { GameConfig } from "../data/GameConfig";
import { Random } from "../utils/Random";

export class HUDView extends Container {
  private skipContainer: Container;
  private skipBtnBg: Graphics;
  private skipText: Text;
  private roomText: Text;
  private dateText: Text;
  private skipStrikethrough: Graphics;

  private helpBtn: Container;
  private modeBtn: Container;
  private modeText: Text;
  private resetBtn: Container;

  private isSkipEnabled: boolean = false;
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;

  constructor() {
    super();

    this.skipContainer = new Container();

    this.dateText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 16,
        fontWeight: "bold",
        fill: GameConfig.colors.ui.healthGray,
        letterSpacing: 2,
      }),
    });
    this.dateText.anchor.set(0.5, 1);
    this.dateText.y = -60;
    this.skipContainer.addChild(this.dateText);

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

    this.modeBtn = new Container();
    const modeBg = new Graphics()
      .circle(0, 0, 24)
      .fill({ color: GameConfig.colors.ui.buttonBg })
      .stroke({ width: 2, color: GameConfig.colors.textLight });
    this.modeBtn.addChild(modeBg);

    this.modeText = new Text({
      text: "∞",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 28,
        fontWeight: "bold",
        fill: GameConfig.colors.textLight,
      }),
    });
    this.modeText.anchor.set(0.5);
    this.modeBtn.addChild(this.modeText);

    this.modeBtn.eventMode = "static";
    this.modeBtn.cursor = "pointer";
    this.modeBtn.zIndex = 1000;
    this.modeBtn.on("pointerdown", () => this.emit("modeClicked"));
    this.addChild(this.modeBtn);

    this.resetBtn = new Container();
    const resetBg = new Graphics()
      .circle(0, 0, 24)
      .fill({ color: GameConfig.colors.ui.buttonBg })
      .stroke({ width: 2, color: GameConfig.colors.textLight });
    this.resetBtn.addChild(resetBg);

    const resetText = new Text({
      text: "↻",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 28,
        fontWeight: "bold",
        fill: GameConfig.colors.textLight,
      }),
    });
    resetText.anchor.set(0.5);
    this.resetBtn.addChild(resetText);

    this.resetBtn.eventMode = "static";
    this.resetBtn.cursor = "pointer";
    this.resetBtn.zIndex = 1000;
    this.resetBtn.on("pointerdown", () => this.emit("resetClicked"));
    this.addChild(this.resetBtn);

    Ticker.shared.add(this.update, this);
  }

  public setMode(mode: "daily" | "infinity"): void {
    this.modeText.text = mode === "daily" ? "∞" : "📅";
    this.resetBtn.visible = mode === "infinity";

    if (mode === "daily") {
      const d = new Date();
      this.dateText.text = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } else {
      this.dateText.text = "INFINITE";
    }
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

  public hideGameControls(): void {
    this.skipContainer.visible = false;
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

    const safeRight = width - 40;
    this.helpBtn.position.set(safeRight, height - 40);
    this.modeBtn.position.set(safeRight, 40);
    this.resetBtn.position.set(safeRight, 100);
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
