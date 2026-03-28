import { Application } from "pixi.js";
import { CardView } from "../view/CardView";
import { BoardView } from "../view/BoardView";
import { GameConfig } from "../data/GameConfig";
import { AudioJuice } from "../utils/AudioJuice";
import type { CardData, Suit, Rank } from "../data/CardData";

export class GameApp {
  public app: Application;
  private board!: BoardView;

  constructor() {
    this.app = new Application();
  }

  public async init(): Promise<void> {
    try {
      await document.fonts.load('10pt "Outfit"');
      await document.fonts.load('bold 10pt "Outfit"');
      await document.fonts.load('900 10pt "Outfit"');
    } catch (e) {
      console.warn("Font loading failed or timed out, proceeding anyway.", e);
    }

    await this.app.init({
      resizeTo: window,
      resolution: Math.max(window.devicePixelRatio, 2),
      autoDensity: true,
      backgroundColor: GameConfig.colors.background,
      preference: "webgpu",
    });

    document.body.appendChild(this.app.canvas);
    this.app.stage.sortableChildren = true;

    window.addEventListener(
      "pointerdown",
      () => {
        AudioJuice.init();
      },
      { once: true },
    );

    this.createScoundrelGame();
  }

  private createScoundrelGame(): void {
    const deck = this.generateScoundrelDeck();

    this.board = new BoardView();
    this.app.stage.addChild(this.board);

    const cardViews = deck.map((data) => new CardView(data));
    this.board.initCards(cardViews);

    this.board.resize(window.innerWidth, window.innerHeight);

    window.addEventListener("resize", () => {
      this.board.resize(window.innerWidth, window.innerHeight);
    });
  }

  private generateScoundrelDeck(): CardData[] {
    const deck: CardData[] = [];
    const ranks: Rank[] = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ];

    const getRankValue = (rank: Rank): number => {
      if (rank === "J") return 11;
      if (rank === "Q") return 12;
      if (rank === "K") return 13;
      if (rank === "A") return 14;
      return parseInt(rank);
    };

    ["clubs", "spades"].forEach((suit) => {
      ranks.forEach((rank) => {
        deck.push({
          id: `${suit}_${rank}`,
          suit: suit as Suit,
          rank,
          type: "monster",
          value: getRankValue(rank),
        });
      });
    });

    const redRanks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10"];

    redRanks.forEach((rank) => {
      deck.push({
        id: `diamonds_${rank}`,
        suit: "diamonds",
        rank,
        type: "weapon",
        value: getRankValue(rank),
      });
      deck.push({
        id: `hearts_${rank}`,
        suit: "hearts",
        rank,
        type: "potion",
        value: getRankValue(rank),
      });
    });

    return deck;
  }
}
