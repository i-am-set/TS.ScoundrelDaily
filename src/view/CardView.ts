import {
  Container,
  Graphics,
  Text,
  TextStyle,
  Ticker,
  Rectangle,
  FederatedPointerEvent,
} from "pixi.js";
import { GameConfig } from "../data/GameConfig";
import type { CardData } from "../data/CardData";

export class CardView extends Container {
  public readonly data: CardData;
  public targetX: number = 0;
  public targetY: number = 0;
  public targetRotation: number = 0;
  public globalScale: number = 1;

  private readonly cardShadow: Graphics;
  private readonly faceContainer: Container;
  private readonly backContainer: Container;
  private readonly highlightGlow: Graphics;
  private readonly hoverGlow: Graphics;
  private readonly disabledOverlay: Graphics;
  private readonly previewText: Text;

  private targetScale: number = GameConfig.juice.scaleNormal ?? 1.0;
  private targetShadowY: number = GameConfig.juice.shadowYNormal ?? 8;
  private targetShadowAlpha: number = GameConfig.juice.shadowAlphaNormal ?? 0.4;

  private isFaceUp: boolean = false;
  private isFlipping: boolean = false;
  private isFocused: boolean = false;
  private isSelectable: boolean = true;

  constructor(data: CardData) {
    super();
    this.data = data;

    const { width, height, radius } = GameConfig.card;

    this.hitArea = new Rectangle(-width / 2, -height / 2, width, height);

    this.highlightGlow = new Graphics()
      .roundRect(
        -width / 2 - 6,
        -height / 2 - 6,
        width + 12,
        height + 12,
        radius + 4,
      )
      .fill({ color: 0xffffff, alpha: 1 });
    this.highlightGlow.tint = GameConfig.colors.ui.highlight;
    this.highlightGlow.visible = false;
    this.addChild(this.highlightGlow);

    this.hoverGlow = new Graphics()
      .roundRect(
        -width / 2 - 6,
        -height / 2 - 6,
        width + 12,
        height + 12,
        radius + 4,
      )
      .fill({ color: GameConfig.colors.ui.hoverHighlight, alpha: 1 });
    this.hoverGlow.visible = false;
    this.addChild(this.hoverGlow);

    this.cardShadow = new Graphics()
      .roundRect(-width / 2, -height / 2, width, height, radius)
      .fill({ color: GameConfig.colors.cardShadow, alpha: 1 });
    this.cardShadow.y = this.targetShadowY;
    this.cardShadow.alpha = this.targetShadowAlpha;
    this.addChild(this.cardShadow);

    this.faceContainer = this.createFace();
    this.backContainer = this.createBack();

    this.faceContainer.visible = false;
    this.backContainer.visible = true;

    this.addChild(this.backContainer);
    this.addChild(this.faceContainer);

    this.disabledOverlay = new Graphics()
      .roundRect(-width / 2, -height / 2, width, height, radius)
      .fill({ color: GameConfig.colors.background, alpha: 0.55 });
    this.disabledOverlay.visible = false;
    this.addChild(this.disabledOverlay);

    this.previewText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 36,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 5 },
      }),
    });
    this.previewText.anchor.set(0.5, 1);
    this.previewText.position.set(0, -height / 2 - 10);
    this.previewText.visible = false;
    this.addChild(this.previewText);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.interactiveChildren = false;

    this.on("pointerdown", (e: FederatedPointerEvent) => {
      e.stopPropagation();
      if (this.isSelectable) {
        this.emit("cardClicked", this);
      }
    });

    this.on("pointerenter", this.onPointerEnter, this);
    this.on("pointerleave", this.onPointerLeave, this);

    Ticker.shared.add(this.update, this);
  }

  private createFace(): Container {
    const { width, height, radius } = GameConfig.card;
    const suitColor = GameConfig.colors.suits[this.data.suit];
    const container = new Container();

    const background = new Graphics()
      .roundRect(-width / 2, -height / 2, width, height, radius)
      .fill({ color: GameConfig.colors.cardBackground, alpha: 1 })
      .stroke({ width: 3, color: GameConfig.colors.cardStroke });
    container.addChild(background);

    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 24,
      fontWeight: "bold",
      fill: suitColor,
    });

    const rankText = new Text({ text: this.data.rank, style: textStyle });
    rankText.anchor.set(0.5);
    rankText.position.set(-width / 2 + 24, -height / 2 + 24);
    container.addChild(rankText);

    const suitSymbols: Record<string, string> = {
      hearts: "♥",
      diamonds: "♦",
      spades: "♠",
      clubs: "♣",
    };

    const suitText = new Text({
      text: suitSymbols[this.data.suit],
      style: textStyle,
    });
    suitText.anchor.set(0.5);
    suitText.position.set(-width / 2 + 24, -height / 2 + 54);
    container.addChild(suitText);

    const centerStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 64,
      fill: suitColor,
    });

    const centerSuit = new Text({
      text: suitSymbols[this.data.suit],
      style: centerStyle,
    });
    centerSuit.anchor.set(0.5);
    container.addChild(centerSuit);

    return container;
  }

  private createBack(): Container {
    const { width, height, radius } = GameConfig.card;
    const container = new Container();

    const background = new Graphics()
      .roundRect(-width / 2, -height / 2, width, height, radius)
      .fill({ color: GameConfig.colors.cardBack, alpha: 1 })
      .stroke({ width: 6, color: GameConfig.colors.cardBackground });
    container.addChild(background);

    const pattern = new Graphics()
      .circle(0, 0, 30)
      .fill({ color: GameConfig.colors.cardBackground, alpha: 0.15 });
    container.addChild(pattern);

    return container;
  }

  public flip(faceUp: boolean): void {
    if (this.isFaceUp === faceUp) return;
    this.isFaceUp = faceUp;
    this.isFlipping = true;
  }

  public setHighlight(
    visible: boolean,
    color: number = GameConfig.colors.ui.highlight,
  ): void {
    this.highlightGlow.visible = visible;
    this.highlightGlow.tint = color;
  }

  public setPreview(text: string, color: number): void {
    if (!text) {
      this.previewText.visible = false;
      return;
    }
    this.previewText.text = text;
    this.previewText.style.fill = color;
    this.previewText.visible = true;
  }

  public setShadowVisible(visible: boolean): void {
    this.cardShadow.visible = visible;
  }

  public setSelectable(selectable: boolean): void {
    this.isSelectable = selectable;
    this.disabledOverlay.visible = !selectable;
    this.cursor = selectable ? "pointer" : "default";

    if (!selectable) {
      this.hoverGlow.visible = false;
      this.targetScale = GameConfig.juice.scaleNormal ?? 1.0;
      this.targetShadowY = GameConfig.juice.shadowYNormal ?? 8;
      this.targetShadowAlpha = GameConfig.juice.shadowAlphaNormal ?? 0.4;
    }
  }

  public setFocused(focused: boolean): void {
    this.isFocused = focused;
    this.hoverGlow.visible = false;
    if (focused) {
      this.targetScale = GameConfig.juice.scaleFocus ?? 1.1;
      this.targetShadowY = GameConfig.juice.shadowYFocus ?? 20;
      this.targetShadowAlpha = GameConfig.juice.shadowAlphaFocus ?? 0.15;
    } else {
      this.targetScale = GameConfig.juice.scaleNormal ?? 1.0;
      this.targetShadowY = GameConfig.juice.shadowYNormal ?? 8;
      this.targetShadowAlpha = GameConfig.juice.shadowAlphaNormal ?? 0.4;
    }
  }

  private onPointerEnter(): void {
    if (!this.isSelectable || this.isFocused) return;
    this.hoverGlow.visible = true;
    this.targetScale = GameConfig.juice.scaleHover ?? 1.05;
    this.targetShadowY = GameConfig.juice.shadowYHover ?? 16;
    this.targetShadowAlpha = GameConfig.juice.shadowAlphaHover ?? 0.2;
    this.emit("hoverEnter", this);
  }

  private onPointerLeave(): void {
    this.hoverGlow.visible = false;
    if (!this.isSelectable || this.isFocused) return;
    this.targetScale = GameConfig.juice.scaleNormal ?? 1.0;
    this.targetShadowY = GameConfig.juice.shadowYNormal ?? 8;
    this.targetShadowAlpha = GameConfig.juice.shadowAlphaNormal ?? 0.4;
    this.emit("hoverLeave", this);
  }

  private update(ticker: Ticker): void {
    const dt = ticker.deltaTime;
    const lerpFactor = (GameConfig.juice.lerpSpeed ?? 0.2) * dt;

    const finalTargetScale = this.targetScale * this.globalScale;

    if (this.isFlipping) {
      this.scale.x +=
        (0 - this.scale.x) * (GameConfig.juice.flipSpeed ?? 0.3) * dt;
      if (Math.abs(this.scale.x) < 0.05) {
        this.faceContainer.visible = this.isFaceUp;
        this.backContainer.visible = !this.isFaceUp;
        this.isFlipping = false;
      }
    } else {
      this.scale.x += (finalTargetScale - this.scale.x) * lerpFactor;
    }

    this.scale.y += (finalTargetScale - this.scale.y) * lerpFactor;

    this.cardShadow.y += (this.targetShadowY - this.cardShadow.y) * lerpFactor;
    this.cardShadow.alpha +=
      (this.targetShadowAlpha - this.cardShadow.alpha) * lerpFactor;

    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;
    this.rotation += (this.targetRotation - this.rotation) * lerpFactor;
  }

  public destroy(options?: any): void {
    Ticker.shared.remove(this.update, this);
    super.destroy(options);
  }
}
