import { Habit, Tier } from '../models/types';

export function calculateStars(habit: Habit, logValue: number | boolean): number {
  let stars = 0;

  if (habit.type === 'checkbox') {
    if (logValue === true) {
      stars = habit.stars;
    }
  } else if (habit.type === 'numeral') {
    // Flat conversion: every X units = Y stars
    const val = typeof logValue === 'number' ? logValue : 0;
    if (val <= 0) return 0;

    const conv = habit.conversion;
    if (conv && conv.per > 0) {
      stars = Math.floor(val / conv.per) * conv.stars;
    }
  } else if (habit.type === 'tiered') {
    const val = typeof logValue === 'number' ? logValue : 0;
    if (val <= 0) return 0;

    // Walk tiers (sorted ascending by value) to find highest matching
    const tiers = (habit.tiers || []).slice().sort((a, b) => a.value - b.value);
    for (const tier of tiers) {
      if (val >= tier.value) {
        stars = tier.stars;
      }
    }

    // Apply extra rule on top if defined
    if (habit.extraRule && habit.extraRule.per > 0 && tiers.length > 0) {
      const highestTierValue = tiers[tiers.length - 1].value;
      const excess = val - highestTierValue;
      if (excess > 0) {
        const extraStars = Math.floor(excess / habit.extraRule.per) * habit.extraRule.stars;
        stars += extraStars;
      }
    }
  }

  return habit.isGood ? stars : -stars;
}
