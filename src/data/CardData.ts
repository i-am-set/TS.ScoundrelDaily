export type Suit = "hearts" | "diamonds" | "spades" | "clubs";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";
export type CardType = "monster" | "weapon" | "potion";

export interface CardData {
  readonly id: string;
  readonly suit: Suit;
  readonly rank: Rank;
  readonly type: CardType;
  readonly value: number;
}
