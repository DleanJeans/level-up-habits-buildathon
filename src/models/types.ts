export type HabitType = 'checkbox' | 'numeral';

export interface Tier {
  value: number;
  stars: number;
}

export interface ExtraRule {
  per: number;
  stars: number;
}

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  isGood: boolean;
  /** Fixed stars for checkbox habits */
  stars: number;
  /** Unit label for numeral habits (e.g. "mins", "sets") */
  unit?: string;
  /** Up to 3 tiers for numeral habits */
  tiers?: Tier[];
  /** Optional extra star rule for numeral habits */
  extraRule?: ExtraRule | null;
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number | boolean;
  starsEarned: number;
}

export interface DayEntry {
  date: string;
  totalStars: number;
}
