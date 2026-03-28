import { Random } from "./Random";

export interface DailySave {
  lastPlayedDate: string;
  streak: number;
  highScore: number;
  todayScore: number | null;
  todayResult: "VICTORY" | "DEFEAT" | null;
}

export class DailyTracker {
  private static readonly KEY = "scoundrel_daily_save";

  public static load(): DailySave {
    const defaultSave: DailySave = {
      lastPlayedDate: "",
      streak: 0,
      highScore: -999,
      todayScore: null,
      todayResult: null,
    };

    try {
      const data = localStorage.getItem(this.KEY);
      if (data) {
        const parsed = JSON.parse(data) as DailySave;
        const today = Random.getTodayString();

        if (parsed.lastPlayedDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

          if (parsed.lastPlayedDate !== yStr) {
            parsed.streak = 0;
          }
          parsed.todayScore = null;
          parsed.todayResult = null;
        }
        return { ...defaultSave, ...parsed };
      }
    } catch (e) {
      console.warn("Failed to load save", e);
    }
    return defaultSave;
  }

  public static saveResult(result: "VICTORY" | "DEFEAT", score: number): void {
    const save = this.load();
    const today = Random.getTodayString();

    if (save.lastPlayedDate === today && save.todayResult !== null) {
      return;
    }

    save.lastPlayedDate = today;
    save.todayResult = result;
    save.todayScore = score;

    if (result === "VICTORY") {
      save.streak += 1;
    } else {
      save.streak = 0;
    }

    if (score > save.highScore) {
      save.highScore = score;
    }

    localStorage.setItem(this.KEY, JSON.stringify(save));
  }
}
