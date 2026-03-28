import { Container, Text, TextStyle, Graphics, Ticker } from "pixi.js";
import { CardView } from "./CardView";
import { HealthView } from "./HealthView";
import { HUDView } from "./HUDView";
import { GameConfig } from "../data/GameConfig";
import { AudioJuice } from "../utils/AudioJuice";
import { HowToPlayModal } from "./HowToPlayModal";

export class BoardView extends Container {
  private deck: CardView[] = [];
  private room: CardView[] = [];
  private discard: CardView[] = [];
  private weapon: CardView | null = null;
  private slain: CardView[] = [];
  private scoringMonsters: CardView[] = [];

  private health: number = 20;
  private roomCount: number = 0;
  private cardsPlayedThisTurn: number = 0;
  private potionsUsedThisTurn: number = 0;
  private canAvoid: boolean = true;
  private lastSlainValue: number = 99;
  private gameState: "playing" | "scoring" | "gameover" | "dealing" = "dealing";
  private isGameOverAnimating: boolean = false;

  private screenWidth: number = 0;
  private screenHeight: number = 0;
  private globalScale: number = 1;

  private healthView: HealthView;
  private hudView: HUDView;

  private overlay: Graphics;
  private focusedCard: CardView | null = null;
  private hoveredWeapon: CardView | null = null;
  private fistsZone: Container;
  private weaponGhost: Container;
  private weaponDiscardIcon: Graphics;

  private deckCountText: Text;
  private discardCountText: Text;

  private damageFlashOverlay: Graphics;
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;

  private helpModal: HowToPlayModal;

  constructor() {
    super();
    this.sortableChildren = true;

    this.damageFlashOverlay = new Graphics()
      .rect(0, 0, 10000, 10000)
      .fill({ color: 0xffffff, alpha: 1 });
    this.damageFlashOverlay.alpha = 0;
    this.damageFlashOverlay.visible = false;
    this.damageFlashOverlay.zIndex = 450;
    this.damageFlashOverlay.eventMode = "none";
    this.addChild(this.damageFlashOverlay);

    this.overlay = new Graphics()
      .rect(0, 0, 10000, 10000)
      .fill({ color: GameConfig.colors.ui.overlay, alpha: 0.7 });
    this.overlay.eventMode = "static";
    this.overlay.visible = false;
    this.overlay.on("pointerdown", () => this.clearFocus());
    this.addChild(this.overlay);

    this.healthView = new HealthView();
    this.healthView.zIndex = 500;
    this.addChild(this.healthView);

    this.hudView = new HUDView();
    this.hudView.on("skipClicked", () => this.onAvoidClicked());
    this.hudView.on("helpClicked", () => {
      AudioJuice.click();
      this.helpModal.show();
    });
    this.addChild(this.hudView);

    this.fistsZone = this.createTargetZone("FISTS");
    this.fistsZone.on("pointerdown", () => this.onFistsZoneClicked());
    this.fistsZone.on("pointerenter", () => this.onFistsHoverEnter());
    this.fistsZone.on("pointerleave", () => this.onFistsHoverLeave());
    this.addChild(this.fistsZone);

    this.weaponGhost = this.createWeaponGhost();
    this.addChild(this.weaponGhost);

    this.weaponDiscardIcon = new Graphics()
      .moveTo(-24, -24)
      .lineTo(24, 24)
      .moveTo(24, -24)
      .lineTo(-24, 24)
      .stroke({
        width: 8,
        color: GameConfig.colors.ui.healthRed,
        cap: "round",
      });
    this.weaponDiscardIcon.visible = false;
    this.weaponDiscardIcon.zIndex = 600;
    this.addChild(this.weaponDiscardIcon);

    this.deckCountText = new Text({
      text: "0",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 24,
        fontWeight: "bold",
        fill: GameConfig.colors.textLight,
        stroke: { color: 0x000000, width: 4 },
      }),
    });
    this.deckCountText.anchor.set(0.5, 0);
    this.addChild(this.deckCountText);

    this.discardCountText = new Text({
      text: "0",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 24,
        fontWeight: "bold",
        fill: GameConfig.colors.textLight,
        stroke: { color: 0x000000, width: 4 },
      }),
    });
    this.discardCountText.anchor.set(0.5, 0);
    this.addChild(this.discardCountText);

    this.helpModal = new HowToPlayModal(window.innerWidth, window.innerHeight);
    this.addChild(this.helpModal);

    Ticker.shared.add(this.update, this);
  }

  private update(ticker: Ticker): void {
    const dt = ticker.deltaTime;

    if (this.shakeTimer > 0) {
      this.shakeTimer -= ticker.deltaMS;
      const mag = this.shakeIntensity * (Math.max(0, this.shakeTimer) / 150);
      this.pivot.set((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
      if (this.shakeTimer <= 0) this.pivot.set(0, 0);
    }

    if (this.damageFlashOverlay.alpha > 0) {
      this.damageFlashOverlay.alpha -= 0.01 * dt;
      if (this.damageFlashOverlay.alpha <= 0) {
        this.damageFlashOverlay.visible = false;
        this.damageFlashOverlay.alpha = 0;
      }
    }

    if (this.weaponDiscardIcon.visible && this.weapon) {
      this.weaponDiscardIcon.position.set(this.weapon.x, this.weapon.y);
    }
  }

  private takeDamage(amount: number): void {
    if (amount <= 0) return;
    this.health -= amount;

    if (this.health <= 0) {
      AudioJuice.dying();
    } else {
      AudioJuice.damage();
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }

    this.shakeTimer = 150;
    this.shakeIntensity = Math.min(amount + 2, 10);

    this.damageFlashOverlay.alpha = 0.3;
    this.damageFlashOverlay.visible = true;

    this.healthView.playDamage(amount);
    this.healthView.setHealth(this.health);
  }

  private heal(amount: number, isFull: boolean): void {
    if (amount <= 0) return;
    this.health = Math.min(20, this.health + amount);

    if (isFull) {
      AudioJuice.healFull();
    } else {
      AudioJuice.healPartial();
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }

    this.healthView.playHeal(amount);
    this.healthView.setHealth(this.health);
  }

  private createTargetZone(label: string): Container {
    const container = new Container();
    const g = new Graphics();
    const w = GameConfig.card.width;
    const h = GameConfig.card.height;
    const dash = 12;
    const gap = 8;

    g.moveTo(-w / 2, -h / 2);
    for (let x = -w / 2; x < w / 2; x += dash + gap) {
      g.lineTo(Math.min(x + dash, w / 2), -h / 2);
      g.moveTo(Math.min(x + dash + gap, w / 2), -h / 2);
    }
    for (let y = -h / 2; y < h / 2; y += dash + gap) {
      g.lineTo(w / 2, Math.min(y + dash, h / 2));
      g.moveTo(w / 2, Math.min(y + dash + gap, h / 2));
    }
    for (let x = w / 2; x > -w / 2; x -= dash + gap) {
      g.lineTo(Math.max(x - dash, -w / 2), h / 2);
      g.moveTo(Math.max(x - dash - gap, -w / 2), h / 2);
    }
    for (let y = h / 2; y > -h / 2; y -= dash + gap) {
      g.lineTo(-w / 2, Math.max(y - dash, -h / 2));
      g.moveTo(-w / 2, Math.max(y - dash - gap, -h / 2));
    }
    g.stroke({ width: 4, color: GameConfig.colors.ui.highlight, alpha: 1 });
    container.addChild(g);

    if (label) {
      const text = new Text({
        text: label,
        style: new TextStyle({
          fontFamily: "Outfit",
          fontSize: 24,
          fontWeight: "bold",
          fill: GameConfig.colors.ui.highlight,
          stroke: { color: 0x000000, width: 4 },
        }),
      });
      text.anchor.set(0.5);
      container.addChild(text);
    }

    container.visible = false;
    container.eventMode = "static";
    container.cursor = "pointer";

    const hitArea = new Graphics()
      .rect(-w / 2, -h / 2, w, h)
      .fill({ color: 0xffffff, alpha: 0.001 });
    container.addChild(hitArea);

    return container;
  }

  private createWeaponGhost(): Container {
    const container = new Container();
    const g = new Graphics();
    const w = GameConfig.card.width;
    const h = GameConfig.card.height;
    const dash = 12;
    const gap = 8;

    g.moveTo(-w / 2, -h / 2);
    for (let x = -w / 2; x < w / 2; x += dash + gap) {
      g.lineTo(Math.min(x + dash, w / 2), -h / 2);
      g.moveTo(Math.min(x + dash + gap, w / 2), -h / 2);
    }
    for (let y = -h / 2; y < h / 2; y += dash + gap) {
      g.lineTo(w / 2, Math.min(y + dash, h / 2));
      g.moveTo(w / 2, Math.min(y + dash + gap, h / 2));
    }
    for (let x = w / 2; x > -w / 2; x -= dash + gap) {
      g.lineTo(Math.max(x - dash, -w / 2), h / 2);
      g.moveTo(Math.max(x - dash - gap, -w / 2), h / 2);
    }
    for (let y = h / 2; y > -h / 2; y -= dash + gap) {
      g.lineTo(-w / 2, Math.max(y - dash, -h / 2));
      g.moveTo(-w / 2, Math.max(y - dash - gap, -h / 2));
    }
    g.stroke({
      width: 4,
      color: GameConfig.colors.ui.hoverHighlight,
      alpha: 0.5,
    });
    container.addChild(g);

    container.visible = false;
    return container;
  }

  public initCards(cards: CardView[]): void {
    this.deck = cards;

    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }

    this.deck.forEach((card) => {
      this.addChild(card);
      card.on("cardClicked", () => this.onCardClicked(card));
      card.on("hoverEnter", () => this.onCardHoverEnter(card));
      card.on("hoverLeave", () => this.onCardHoverLeave(card));
      card.position.set(-500, -500);
    });

    this.helpModal.once("closed", () => {
      this.dealRoom();
    });
    this.helpModal.show();
  }

  public resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    const baseWidth = 1200;
    const baseHeight = 800;
    this.globalScale = Math.min(width / baseWidth, height / baseHeight, 1.5);

    this.helpModal.resize(width, height);
    this.updateLayout();
  }

  private async dealRoom(): Promise<void> {
    this.gameState = "dealing";
    this.updateSelectableStates();
    this.updateAvoidButtonState();

    let dealt = false;
    while (this.room.length < 4 && this.deck.length > 0) {
      const card = this.deck.pop()!;
      this.room.push(card);

      this.updateLayout();
      card.flip(true);
      AudioJuice.draw();
      dealt = true;

      await new Promise((r) => setTimeout(r, 150));
    }

    if (dealt && this.roomCount > 0) {
      setTimeout(() => AudioJuice.newRoom(), 200);
    }

    this.roomCount++;
    this.hudView.updateRoom(this.roomCount);
    this.cardsPlayedThisTurn = 0;
    this.potionsUsedThisTurn = 0;

    this.gameState = "playing";
    this.updateAvoidButtonState();
    this.updateSelectableStates();
    this.updateLayout();
  }

  private updateAvoidButtonState(): void {
    const isFullRoom = this.room.length === 4;
    const hasNotPlayed = this.cardsPlayedThisTurn === 0;
    const isEnabled =
      this.gameState === "playing" &&
      this.canAvoid &&
      isFullRoom &&
      hasNotPlayed;
    this.hudView.setSkipEnabled(isEnabled);
  }

  private updateSelectableStates(): void {
    this.deck.forEach((c) => c.setSelectable(false));
    this.discard.forEach((c) => c.setSelectable(false));
    this.slain.forEach((c) => c.setSelectable(false));

    if (this.gameState !== "playing") {
      this.room.forEach((c) => c.setSelectable(false));
      if (this.weapon) this.weapon.setSelectable(false);
      return;
    }

    if (this.weapon) {
      if (
        this.focusedCard &&
        this.focusedCard.data.type === "monster" &&
        this.focusedCard.data.value < this.lastSlainValue
      ) {
        this.weapon.setSelectable(true);
      } else {
        this.weapon.setSelectable(false);
      }
    }

    this.room.forEach((c) => {
      if (this.focusedCard) {
        c.setSelectable(c === this.focusedCard);
      } else {
        c.setSelectable(true);
      }
    });
  }

  private async onAvoidClicked(): Promise<void> {
    if (
      this.gameState !== "playing" ||
      !this.canAvoid ||
      this.room.length < 4 ||
      this.cardsPlayedThisTurn > 0
    ) {
      AudioJuice.error();
      return;
    }

    this.gameState = "dealing";
    this.updateSelectableStates();
    this.updateAvoidButtonState();

    AudioJuice.skipRoom();
    setTimeout(() => AudioJuice.deckReturn(), 150);

    this.canAvoid = false;

    for (let i = this.room.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.room[i], this.room[j]] = [this.room[j], this.room[i]];
    }

    this.room.forEach((c) => c.flip(false));
    this.deck.unshift(...this.room);
    this.room = [];

    this.updateLayout();

    await new Promise((r) => setTimeout(r, 400));

    this.dealRoom();
  }

  private onFistsHoverEnter(): void {
    if (!this.focusedCard || this.focusedCard.data.type !== "monster") return;
    const damage = this.focusedCard.data.value;
    this.focusedCard.setPreview(`-${damage}`, GameConfig.colors.ui.healthRed);
    this.healthView.setPreview(`-${damage}`, GameConfig.colors.ui.healthRed);
  }

  private onFistsHoverLeave(): void {
    if (!this.focusedCard) return;
    this.focusedCard.setPreview("", 0xffffff);
    this.healthView.setPreview("", 0xffffff);
  }

  private onCardHoverEnter(card: CardView): void {
    if (this.gameState !== "playing") return;

    if (this.focusedCard && card === this.weapon) {
      if (
        this.focusedCard.data.type === "monster" &&
        this.focusedCard.data.value < this.lastSlainValue
      ) {
        const damage = Math.max(
          0,
          this.focusedCard.data.value - this.weapon.data.value,
        );
        const color =
          damage > 0
            ? GameConfig.colors.ui.healthRed
            : GameConfig.colors.ui.healthGray;
        this.focusedCard.setPreview(`-${damage}`, color);
        this.healthView.setPreview(`-${damage}`, color);
      }
      return;
    }

    if (this.focusedCard) return;
    if (!this.room.includes(card)) return;

    AudioJuice.hover();

    if (card.data.type === "monster") {
      card.setPreview(`-${card.data.value}`, GameConfig.colors.ui.healthRed);
      this.healthView.setPreview(
        `-${card.data.value}`,
        GameConfig.colors.ui.healthRed,
      );

      if (this.weapon && !this.focusedCard) {
        if (card.data.value < this.lastSlainValue) {
          this.weapon.setHighlight(true, GameConfig.colors.ui.healthGreen);
        } else {
          this.weapon.setHighlight(true, GameConfig.colors.ui.healthRed);
        }
      }
    } else if (card.data.type === "potion") {
      if (this.potionsUsedThisTurn >= 1) {
        card.setPreview(`+0`, GameConfig.colors.ui.healthGray);
        this.healthView.setPreview(`+0`, GameConfig.colors.ui.healthGray);
      } else {
        const gained = Math.min(card.data.value, 20 - this.health);
        if (gained === 0) {
          card.setPreview(`+0`, GameConfig.colors.ui.healthGray);
          this.healthView.setPreview(`+0`, GameConfig.colors.ui.healthGray);
        } else if (gained < card.data.value) {
          card.setPreview(`+${gained}`, GameConfig.colors.ui.healthOrange);
          this.healthView.setPreview(
            `+${gained}`,
            GameConfig.colors.ui.healthOrange,
          );
        } else {
          card.setPreview(`+${gained}`, GameConfig.colors.ui.healthGreen);
          this.healthView.setPreview(
            `+${gained}`,
            GameConfig.colors.ui.healthGreen,
          );
        }
      }
    } else if (card.data.type === "weapon") {
      this.hoveredWeapon = card;
      card.setPreview("EQUIP", GameConfig.colors.ui.hoverHighlight);
      this.healthView.setPreview("EQUIP", GameConfig.colors.ui.hoverHighlight);
      this.updateLayout();
    }
  }

  private onCardHoverLeave(card: CardView): void {
    if (this.focusedCard && card === this.weapon) {
      this.focusedCard.setPreview("", 0xffffff);
      this.healthView.setPreview("", 0xffffff);
      return;
    }

    if (this.focusedCard) return;

    card.setPreview("", 0xffffff);
    this.healthView.setPreview("", 0xffffff);

    if (this.weapon && !this.focusedCard) {
      this.weapon.setHighlight(false);
    }

    if (card.data.type === "weapon" && this.hoveredWeapon === card) {
      this.hoveredWeapon = null;
      this.updateLayout();
    }
  }

  private onCardClicked(card: CardView): void {
    if (this.gameState !== "playing") return;

    if (this.room.includes(card)) {
      if (this.focusedCard === card) {
        AudioJuice.click();
        this.clearFocus();
        return;
      }

      if (card.data.type === "potion") {
        this.usePotion(card);
      } else if (card.data.type === "weapon") {
        this.equipWeapon(card);
      } else if (card.data.type === "monster") {
        if (!this.weapon || card.data.value >= this.lastSlainValue) {
          this.fightBarehanded(card);
        } else {
          AudioJuice.click();
          this.focusCard(card);
        }
      }
      return;
    }

    if (this.focusedCard && this.weapon === card) {
      if (
        this.focusedCard.data.type === "monster" &&
        this.focusedCard.data.value < this.lastSlainValue
      ) {
        this.fightWithWeapon(this.focusedCard);
      }
    }
  }

  private focusCard(card: CardView): void {
    if (this.focusedCard) {
      const old = this.focusedCard;
      this.focusedCard = null;
      this.onCardHoverLeave(old);
      old.setFocused(false);
    }

    this.focusedCard = card;
    this.focusedCard.setFocused(true);

    card.setPreview("", 0xffffff);
    this.healthView.setPreview("", 0xffffff);

    this.overlay.visible = true;
    this.overlay.zIndex = 200;

    this.fistsZone.visible = true;
    if (this.weapon && card.data.value < this.lastSlainValue) {
      this.weapon.setHighlight(true, GameConfig.colors.ui.highlight);
    }

    this.updateSelectableStates();
    this.updateLayout();
  }

  private clearFocus(): void {
    if (!this.focusedCard) return;

    const old = this.focusedCard;
    this.focusedCard = null;
    this.onCardHoverLeave(old);
    old.setFocused(false);

    this.overlay.visible = false;
    this.fistsZone.visible = false;

    if (this.weapon) {
      this.weapon.setHighlight(false);
    }

    this.updateSelectableStates();
    this.updateLayout();
  }

  private onFistsZoneClicked(): void {
    if (!this.focusedCard) return;

    if (this.focusedCard.data.type === "monster") {
      this.fightBarehanded(this.focusedCard);
    }
  }

  private usePotion(card: CardView): void {
    if (this.potionsUsedThisTurn < 1) {
      const gained = Math.min(20 - this.health, card.data.value);
      if (gained === card.data.value) {
        this.heal(gained, true);
      } else if (gained > 0) {
        this.heal(gained, false);
      } else {
        AudioJuice.healZero();
      }
      this.potionsUsedThisTurn++;
    } else {
      AudioJuice.error();
    }
    this.discardCard(card);
    this.advanceTurn();
  }

  private equipWeapon(card: CardView): void {
    AudioJuice.equipWeapon();
    if (this.weapon) {
      AudioJuice.discardWeapon();
      this.weapon.setHighlight(false);
      this.discard.push(this.weapon, ...this.slain);
      this.slain = [];
    }
    this.room = this.room.filter((c) => c !== card);
    card.setPreview("", 0xffffff);
    this.healthView.setPreview("", 0xffffff);
    this.weapon = card;
    this.lastSlainValue = 99;

    this.hoveredWeapon = null;
    this.weaponGhost.visible = false;
    this.weaponDiscardIcon.visible = false;

    this.advanceTurn();
  }

  private fightBarehanded(card: CardView): void {
    this.takeDamage(card.data.value);
    this.discardCard(card);
    this.advanceTurn();
  }

  private fightWithWeapon(card: CardView): void {
    if (!this.weapon || card.data.value >= this.lastSlainValue) return;

    const damage = Math.max(0, card.data.value - this.weapon.data.value);
    if (damage > 0) {
      this.takeDamage(damage);
    } else {
      AudioJuice.enemyDying();
    }
    this.lastSlainValue = card.data.value;

    this.room = this.room.filter((c) => c !== card);
    card.setPreview("", 0xffffff);
    this.healthView.setPreview("", 0xffffff);
    this.slain.push(card);

    if (card.data.value === 2) {
      AudioJuice.discardWeapon();
      this.weapon.setHighlight(false);
      this.discard.push(this.weapon, ...this.slain);
      this.weapon = null;
      this.slain = [];
    }

    this.advanceTurn();
  }

  private discardCard(card: CardView): void {
    AudioJuice.discard();
    this.room = this.room.filter((c) => c !== card);
    card.setPreview("", 0xffffff);
    this.healthView.setPreview("", 0xffffff);
    this.discard.push(card);
  }

  private hasMonstersLeft(): boolean {
    return [...this.deck, ...this.room].some((c) => c.data.type === "monster");
  }

  private advanceTurn(): void {
    if (this.gameState !== "playing") return;

    this.clearFocus();
    this.cardsPlayedThisTurn++;
    this.canAvoid = true;
    this.updateAvoidButtonState();

    if (this.health <= 0) {
      this.triggerDefeat();
    } else if (!this.hasMonstersLeft()) {
      this.triggerVictory();
    } else if (this.room.length === 1 && this.deck.length > 0) {
      this.dealRoom();
    } else {
      this.updateSelectableStates();
      this.updateLayout();
    }
  }

  private async triggerDefeat(): Promise<void> {
    this.gameState = "scoring";
    this.room.forEach((c) => c.setSelectable(false));
    this.deck.forEach((c) => c.setSelectable(false));
    this.hudView.visible = false;

    if (this.weapon) {
      this.weapon.setHighlight(false);
      this.discard.push(this.weapon, ...this.slain);
      this.weapon = null;
      this.slain = [];
    }

    this.room.forEach((c) => c.flip(false));
    this.deck.unshift(...this.room);
    this.room = [];

    this.updateLayout();

    await new Promise((r) =>
      setTimeout(r, GameConfig.juice.scoringDelayStart ?? 125),
    );

    let finalScore = this.health;

    while (this.deck.length > 0) {
      const card = this.deck.pop()!;
      if (card.data.type === "monster") {
        this.scoringMonsters.push(card);
        card.flip(true);
        AudioJuice.draw();
        finalScore -= card.data.value;
        this.updateLayout();
        await new Promise((r) =>
          setTimeout(r, GameConfig.juice.scoringDelayMonster ?? 75),
        );
      } else {
        this.discard.push(card);
        AudioJuice.discard();
        this.updateLayout();
        await new Promise((r) =>
          setTimeout(r, GameConfig.juice.scoringDelayDiscard ?? 25),
        );
      }
    }

    this.playGameOverAnimation("DEFEAT", this.health, finalScore);
  }

  private triggerVictory(): void {
    this.gameState = "scoring";
    this.room.forEach((c) => c.setSelectable(false));
    this.hudView.visible = false;

    let finalScore = this.health;
    if (this.health === 20) {
      const potions = this.room.filter((c) => c.data.type === "potion");
      if (potions.length > 0) {
        finalScore += Math.max(...potions.map((p) => p.data.value));
      }
    }

    if (this.weapon) {
      this.weapon.setHighlight(false);
      this.discard.push(this.weapon, ...this.slain);
      this.weapon = null;
      this.slain = [];
    }

    this.room.forEach((c) => c.flip(false));
    this.deck.unshift(...this.room);
    this.room = [];

    this.updateLayout();

    this.playGameOverAnimation("VICTORY", this.health, finalScore);
  }

  private async tween(
    target: any,
    props: Record<string, number>,
    duration: number,
    easing: (t: number) => number = (t) => t,
    onUpdate?: () => void,
  ): Promise<void> {
    return new Promise((resolve) => {
      const startProps: Record<string, number> = {};
      for (const key in props) startProps[key] = target[key];
      const startTime = performance.now();

      const update = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const e = easing(t);

        for (const key in props) {
          target[key] = startProps[key] + (props[key] - startProps[key]) * e;
        }

        if (onUpdate) onUpdate();

        if (t < 1) {
          requestAnimationFrame(update);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(update);
    });
  }

  private async playGameOverAnimation(
    result: string,
    startScore: number,
    finalScore: number,
  ): Promise<void> {
    this.gameState = "gameover";
    this.isGameOverAnimating = true;

    this.healthView.hideLabels();
    this.healthView.zIndex = 1000;

    const cx = this.screenWidth / 2;
    const cy = this.screenHeight / 2;

    const easeOutQuad = (t: number) => t * (2 - t);
    const easeInExpo = (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10));
    const easeOutBack = (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    const scoreObj = { val: startScore };
    const totalDuration = 600 + 400 + 150;
    let lastScoreInt = Math.round(startScore);

    this.tween(
      scoreObj,
      { val: finalScore },
      totalDuration,
      (t) => t,
      () => {
        const currentScore = Math.round(scoreObj.val);
        if (currentScore !== lastScoreInt) {
          AudioJuice.scoreTick();
          lastScoreInt = currentScore;
        }
        this.healthView.setHealth(currentScore);
      },
    );

    await this.tween(this.healthView, { x: cx, y: cy }, 600, easeOutQuad);

    await this.tween(
      this.healthView.scale,
      { x: this.globalScale * 2.5, y: this.globalScale * 2.5 },
      400,
      easeOutQuad,
    );

    this.overlay
      .clear()
      .rect(0, 0, 10000, 10000)
      .fill({ color: GameConfig.colors.ui.overlay, alpha: 1 });
    this.overlay.alpha = 0;
    this.overlay.visible = true;
    this.overlay.zIndex = 900;

    const slamPromise = this.tween(
      this.healthView.scale,
      { x: this.globalScale * 0.7, y: this.globalScale * 0.7 },
      150,
      easeInExpo,
    );

    const overlayPromise = this.tween(
      this.overlay,
      { alpha: 0.95 },
      200,
      easeOutQuad,
    );

    await Promise.all([slamPromise, overlayPromise]);

    AudioJuice.scoreSlam();

    if (result === "VICTORY") {
      setTimeout(() => AudioJuice.victory(), 200);
    } else {
      setTimeout(() => AudioJuice.defeat(), 200);
    }

    const scoreLabel = new Text({
      text: "SCORE",
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 32,
        fontWeight: "bold",
        fill: 0xffffff,
        letterSpacing: 4,
        stroke: { color: 0x000000, width: 6 },
      }),
    });
    scoreLabel.anchor.set(0.5);
    scoreLabel.position.set(cx, cy - 100 * this.globalScale);
    scoreLabel.zIndex = 1000;
    this.addChild(scoreLabel);

    const resultText = new Text({
      text: result,
      style: new TextStyle({
        fontFamily: "Outfit",
        fontSize: 80,
        fontWeight: "900",
        fill:
          result === "VICTORY"
            ? GameConfig.colors.ui.healthGreen
            : GameConfig.colors.ui.healthRed,
        align: "center",
        stroke: { color: 0x000000, width: 8 },
        dropShadow: { alpha: 0.5, blur: 4, color: 0x000000, distance: 4 },
        letterSpacing: 8,
      }),
    });
    resultText.anchor.set(0.5);
    resultText.position.set(cx, cy - 180 * this.globalScale);
    resultText.zIndex = 1000;
    this.addChild(resultText);

    await this.tween(
      this.healthView.scale,
      { x: this.globalScale * 1.2, y: this.globalScale * 1.2 },
      800,
      easeOutBack,
    );
  }

  private updateLayout(): void {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    const spacing = (GameConfig.card.width + 20) * this.globalScale;

    const sideOffset = Math.max(
      spacing * 2.5,
      this.screenWidth / 2 - GameConfig.card.width * this.globalScale * 1.2,
    );

    if (!this.isGameOverAnimating) {
      this.healthView.position.set(
        160 * this.globalScale,
        this.screenHeight - 160 * this.globalScale,
      );
      this.healthView.scale.set(this.globalScale);
    }

    this.hudView.resize(
      this.screenWidth,
      this.screenHeight,
      this.globalScale,
      centerX,
      centerY - spacing * 1.8,
    );

    let z = 10;

    this.deck.forEach((card, i) => {
      card.globalScale = this.globalScale;
      card.targetX = centerX - sideOffset;
      card.targetY = centerY - spacing * 1.5 - i * 0.5;
      card.targetRotation = 0;
      card.zIndex = z++;
      card.setShadowVisible(i === 0);
    });

    const discardX = centerX + sideOffset;
    const discardY = centerY - spacing * 1.5;

    this.discard.forEach((card, i) => {
      card.globalScale = this.globalScale;
      card.targetX = discardX;
      card.targetY = discardY - i * 0.5;
      card.targetRotation = 0;
      card.zIndex = z++;
      card.setShadowVisible(i === 0);
    });

    this.deckCountText.text = `${this.deck.length}`;
    this.deckCountText.visible = this.deck.length > 0;
    this.deckCountText.position.set(
      centerX - sideOffset,
      centerY -
        spacing * 1.5 +
        (GameConfig.card.height / 2) * this.globalScale +
        10,
    );
    this.deckCountText.scale.set(this.globalScale);

    this.discardCountText.text = `${this.discard.length}`;
    this.discardCountText.visible = this.discard.length > 0;
    this.discardCountText.position.set(
      discardX,
      discardY + (GameConfig.card.height / 2) * this.globalScale + 10,
    );
    this.discardCountText.scale.set(this.globalScale);

    const roomStartX = centerX - spacing * 1.5;
    this.room.forEach((card, i) => {
      card.globalScale = this.globalScale;
      card.targetX = roomStartX + i * spacing;
      card.targetY = centerY - spacing * 0.5;
      card.targetRotation = 0;
      card.zIndex = card === this.focusedCard ? 300 : z++;
      card.setShadowVisible(true);
    });

    const weaponBaseX = centerX;
    const weaponBaseY = centerY + spacing * 1.2;

    this.fistsZone.position.set(weaponBaseX + spacing * 1.5, weaponBaseY);
    this.fistsZone.scale.set(this.globalScale);
    this.fistsZone.zIndex = 300;

    if (this.hoveredWeapon) {
      this.weaponGhost.visible = true;
      this.weaponGhost.position.set(weaponBaseX, weaponBaseY);
      this.weaponGhost.scale.set(this.globalScale);
      this.weaponGhost.zIndex = 200;
    } else {
      this.weaponGhost.visible = false;
      this.weaponDiscardIcon.visible = false;
    }

    if (this.weapon) {
      let targetWeaponX = weaponBaseX;

      if (this.hoveredWeapon) {
        targetWeaponX = weaponBaseX - spacing * 1.2;
        this.weaponDiscardIcon.visible = true;
        this.weaponDiscardIcon.scale.set(this.globalScale);
      }

      this.slain.forEach((card, i) => {
        card.globalScale = this.globalScale;
        card.targetX =
          targetWeaponX +
          ((GameConfig.card.height - GameConfig.card.width) / 2) *
            this.globalScale;
        card.targetY = weaponBaseY;
        card.targetRotation = Math.PI / 2;
        card.zIndex = z++;
        card.setShadowVisible(i === 0);
      });

      this.weapon.globalScale = this.globalScale;
      this.weapon.targetX = targetWeaponX;
      this.weapon.targetY = weaponBaseY;
      this.weapon.targetRotation = 0;

      const isWeaponTargetable =
        this.focusedCard &&
        this.focusedCard.data.type === "monster" &&
        this.focusedCard.data.value < this.lastSlainValue;
      this.weapon.zIndex = isWeaponTargetable ? 300 : z + 100;
      this.weapon.setShadowVisible(true);
    }

    if (this.scoringMonsters.length > 0) {
      const total = this.scoringMonsters.length;
      const cardW = GameConfig.card.width * this.globalScale;
      const maxW = this.screenWidth * 0.8;
      const overlapSpacing = Math.min(
        cardW + 10,
        maxW / Math.max(1, total - 1),
      );
      const startX = centerX - (overlapSpacing * (total - 1)) / 2;

      this.scoringMonsters.forEach((card, i) => {
        card.globalScale = this.globalScale;
        card.targetX = startX + i * overlapSpacing;
        card.targetY = centerY;
        card.targetRotation = 0;
        card.zIndex = 400 + i;
        card.setShadowVisible(true);
      });
    }
  }

  public destroy(options?: any): void {
    Ticker.shared.remove(this.update, this);
    super.destroy(options);
  }
}
