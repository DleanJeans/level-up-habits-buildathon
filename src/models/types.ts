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

export type CueType = 'location' | 'mood' | 'time' | 'habit';

export interface Cue {
  type: CueType;
  /** Descriptive value: place name, mood label, time string, or linked habit name */
  value: string;
  /** If type === 'habit', the ID of the triggering habit */
  habitId?: string;
}

export interface Reminder {
  /** The habit whose completion triggers this reminder */
  afterHabitId?: string;
  /** Delay in minutes after the triggering habit is logged */
  delayMinutes?: number;
  /** Custom reminder message */
  message?: string;
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
  /** Cues that trigger this habit */
  cues?: Cue[];
  /** Reminders linked to other habits */
  reminders?: Reminder[];
  /** Auto-habits are automatically tracked (e.g., app check-in) */
  isAutoHabit?: boolean;
  /** Cooldown period in minutes for auto-habits */
  cooldownMinutes?: number;
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

export interface MoodLog {
  id: string;
  date: string; // YYYY-MM-DD
  cue: string;
  cueType: CueType;
  routineChosen?: string;
  outcomeEmotions?: string[];
  createdAt: string; // ISO timestamp
}
