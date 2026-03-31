export type HabitType = 'checkbox' | 'numeral' | 'tiered' | 'time-based';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

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

/** Time-of-day frame: if logged between startHour and endHour, earn stars */
export interface TimeFrame {
  startHour: number; // 0-23
  endHour: number;   // 0-23
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
  /** Optional extra star rule for tiered/numeral habits */
  extraRule?: ExtraRule | null;
  /** Time-of-day frames for time-based habits */
  timeFrames?: TimeFrame[];
  /** Stars earned just for starting (before any extra calculation) */
  startingStars?: number;
  /** Units to skip before extra rule kicks in */
  extraThreshold?: number;
  /** Habit frequency: daily, weekly, monthly, yearly */
  frequency?: Frequency;
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number | boolean;
  starsEarned: number;
  /** ISO timestamp of when the log was created/updated */
  loggedAt?: string;
}

export interface DayEntry {
  date: string;
  totalStars: number;
}

export interface Task {
  id: string;
  name: string;
  stars: number;
  completed: boolean;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
}
