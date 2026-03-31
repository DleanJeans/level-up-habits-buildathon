export type HabitType = 'checkbox' | 'numeral' | 'tiered';

export interface Tier {
  value: number;
  stars: number;
}

export interface ExtraRule {
  per: number;
  stars: number;
}

/** Flat conversion: every `per` units = `stars` stars */
export interface ConversionRule {
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
  /** Unit label for numeral/tiered habits (e.g. "mins", "sets") */
  unit?: string;
  /** Flat conversion rule for numeral habits (e.g. 15 mins = 1 star) */
  conversion?: ConversionRule | null;
  /** Up to 3 tiers for tiered habits */
  tiers?: Tier[];
  /** Optional extra star rule for tiered habits */
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
