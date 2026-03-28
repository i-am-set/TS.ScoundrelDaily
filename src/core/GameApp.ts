import { Application } from "pixi.js";
import { CardView } from "../view/CardView";
import { BoardView } from "../view/BoardView";
import { GameConfig } from "../data/GameConfig";
import { AudioJuice } from "../utils/AudioJuice";
import { Random } from "../utils/Random";
import { DailyTracker } from "../utils/DailyTracker";
import type { CardData, Suit, Rank } from "../data/CardData";

export class GameApp {
  public app: Application;
  private board!: BoardView;
  private currentMode: "daily" | "infinity" = "daily";

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

    window.addEventListener("resize", () => {
      if (this.board) {
        this.board.resize(window.innerWidth, window.innerHeight);
      }
    });

    this.startGame("daily");
  }

  private startGame(mode: "daily" | "infinity"): void {
    if (this.board) {
      this.board.destroy({ children: true });
      this.app.stage.removeChild(this.board);
    }

    this.currentMode = mode;
    let rng: () => number;

    if (mode === "daily") {
      const random = new Random(Random.getDailySeed());
      rng = () => random.next();
    } else {
      rng = () => Math.random();
    }

    this.board = new BoardView(rng);
    this.board.setMode(mode);
    this.app.stage.addChild(this.board);

    this.board.on("modeToggle", () => {
      AudioJuice.click();
      this.startGame(this.currentMode === "daily" ? "infinity" : "daily");
    });

    this.board.on("resetGame", () => {
      AudioJuice.click();
      if (this.currentMode === "infinity") this.startGame("infinity");
    });

    this.board.on("gameEnd", (data) => {
      if (this.currentMode === "daily") {
        DailyTracker.saveResult(data.result, data.score);
        const save = DailyTracker.load();
        this.board.showStats(save.streak, save.highScore);
      }
    });

    const deck = this.generateScoundrelDeck();
    const cardViews = deck.map((data) => new CardView(data));

    let skipModal = false;
    if (mode === "daily") {
      const save = DailyTracker.load();
      if (save.todayResult) {
        skipModal = true;
      }
    }

    this.board.initCards(cardViews, skipModal);
    this.board.resize(window.innerWidth, window.innerHeight);

    if (mode === "daily" && skipModal) {
      const save = DailyTracker.load();
      this.board.showAlreadyPlayed(
        save.todayResult!,
        save.todayScore!,
        save.streak,
        save.highScore,
      );
    }
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
