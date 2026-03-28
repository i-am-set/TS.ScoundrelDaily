import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GameConfig } from "../data/GameConfig";
import { AudioJuice } from "../utils/AudioJuice";

export class HowToPlayModal extends Container {
  private overlay: Graphics;
  private panel: Graphics;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.zIndex = 2000;
    this.visible = false;

    this.overlay = new Graphics()
      .rect(0, 0, 10000, 10000)
      .fill({ color: 0x000000, alpha: 0.85 });
    this.overlay.eventMode = "static";
    this.overlay.cursor = "pointer";
    this.overlay.on("pointerdown", () => this.handleClose());
    this.addChild(this.overlay);

    this.panel = new Graphics()
      .roundRect(-350, -380, 700, 760, 16)
      .fill({ color: GameConfig.colors.background, alpha: 1 })
      .stroke({ width: 4, color: GameConfig.colors.ui.highlight });
    this.panel.eventMode = "static";
    this.panel.cursor = "pointer";
    this.panel.on("pointerdown", () => this.handleClose());
    this.addChild(this.panel);

    const title = new Text({
      text: "How to Play SCOUNDREL",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 32,
        fontWeight: "900",
        fill: GameConfig.colors.ui.highlight,
        letterSpacing: 1,
      }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(0, -350);
    this.panel.addChild(title);

    const contentContainer = new Container();
    contentContainer.position.set(-310, -280);
    this.panel.addChild(contentContainer);

    const lines = [
      [
        { text: "• You start with " },
        {
          text: "20 Health",
          color: GameConfig.colors.ui.healthGreen,
          bold: true,
        },
        { text: "." },
      ],
      [
        { text: "• Each turn, flip cards until there are " },
        { text: "4 cards face up", bold: true },
        { text: " (this is the Room)." },
      ],
      [
        { text: "• You can " },
        { text: "skip the Room", bold: true },
        { text: ", but " },
        {
          text: "not twice in a row",
          color: GameConfig.colors.ui.healthRed,
          bold: true,
        },
        { text: "." },
      ],
      [
        { text: "• If you play the Room, pick " },
        { text: "3 of the 4 cards", bold: true },
        { text: ", one at a time." },
      ],
      [],
      [
        {
          text: "• Monster (♠ or ♣):",
          color: GameConfig.colors.ui.healthRed,
          bold: true,
        },
      ],
      [{ text: "    No weapon → lose its full value in health." }],
      [
        {
          text: "    With a weapon → lose only the difference (or 0 if weapon is stronger).",
        },
      ],
      [],
      [
        {
          text: "• Weapon (♦):",
          color: GameConfig.colors.ui.avoidActive,
          bold: true,
        },
      ],
      [{ text: "    You must equip it and replace your current weapon." }],
      [],
      [
        {
          text: "• Potion (♥):",
          color: GameConfig.colors.ui.healthGreen,
          bold: true,
        },
      ],
      [
        { text: "    Heals you (max 20 health). You can only use " },
        { text: "one potion per turn", bold: true },
        { text: "." },
      ],
      [],
      [{ text: "• Weapons get weaker over time:", bold: true }],
      [
        { text: "    After using one, it can only fight " },
        { text: "weaker monsters", bold: true },
        { text: " than the last one it hit." },
      ],
      [],
      [
        { text: "• After choosing 3 cards, " },
        { text: "1 card stays", bold: true },
        { text: " for the next turn." },
      ],
      [
        { text: "• You lose if your health hits " },
        { text: "0", color: GameConfig.colors.ui.healthRed, bold: true },
        { text: "." },
      ],
      [
        { text: "• You win if you " },
        {
          text: "finish the deck",
          color: GameConfig.colors.ui.healthGreen,
          bold: true,
        },
        { text: "." },
      ],
      [{ text: "• Your score = remaining health (or negative if you lose)." }],
    ];

    let currentY = 0;
    for (const line of lines) {
      if (line.length === 0) {
        currentY += 15;
        continue;
      }
      const lineContainer = new Container();
      let currentX = 0;
      for (const seg of line) {
        const t = new Text({
          text: seg.text,
          style: new TextStyle({
            fontFamily: "Outfit",
            fontSize: 18,
            fontWeight: seg.bold ? "bold" : "normal",
            fill: seg.color || GameConfig.colors.textLight,
          }),
        });
        t.x = currentX;
        lineContainer.addChild(t);
        currentX += t.width;
      }
      lineContainer.y = currentY;
      contentContainer.addChild(lineContainer);
      currentY += 28;
    }

    const clickToClose = new Text({
      text: "(Click anywhere to close)",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 16,
        fontWeight: "normal",
        fill: GameConfig.colors.ui.healthGray,
        fontStyle: "italic",
      }),
    });
    clickToClose.anchor.set(0.5);
    clickToClose.position.set(0, 340);
    this.panel.addChild(clickToClose);

    this.resize(screenWidth, screenHeight);
  }

  private handleClose(): void {
    if (!this.visible) return;
    AudioJuice.click();
    this.hide();
  }

  public show(): void {
    this.visible = true;
    this.alpha = 0;
    this.panel.scale.set(0.8);

    const animate = () => {
      this.alpha += (1 - this.alpha) * 0.2;
      this.panel.scale.x += (1 - this.panel.scale.x) * 0.2;
      this.panel.scale.y += (1 - this.panel.scale.y) * 0.2;
      if (this.alpha < 0.99) {
        requestAnimationFrame(animate);
      } else {
        this.alpha = 1;
        this.panel.scale.set(1);
      }
    };
    animate();
  }

  public hide(): void {
    const animate = () => {
      this.alpha += (0 - this.alpha) * 0.2;
      this.panel.scale.x += (0.8 - this.panel.scale.x) * 0.2;
      this.panel.scale.y += (0.8 - this.panel.scale.y) * 0.2;
      if (this.alpha > 0.01) {
        requestAnimationFrame(animate);
      } else {
        this.visible = false;
        this.emit("closed");
      }
    };
    animate();
  }

  public resize(width: number, height: number): void {
    this.overlay
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: 0x000000, alpha: 0.85 });
    this.panel.position.set(width / 2, height / 2);
    const scale = Math.min(width / 750, height / 850, 1);
    this.panel.scale.set(scale);
  }
}
