import { Habit, Tier } from '../models/types';

/** Round to nearest 0.05 */
function roundToStep(value: number): number {
  return Math.round(value / 0.05) * 0.05;
}

/**
 * Calculate stars earned for a habit log.
 * @param habit     The habit definition
 * @param logValue  The logged value (boolean for checkbox, number for others)
 * @param loggedAt  Optional ISO timestamp — used for time-based habits
 */
export function calculateStars(
  habit: Habit,
  logValue: number | boolean,
  loggedAt?: string,
): number {
  let stars = 0;

  if (habit.type === 'checkbox') {
    if (logValue === true) {
      stars = habit.stars;
    }
  } else if (habit.type === 'numeral') {
    const val = typeof logValue === 'number' ? logValue : 0;
    if (val <= 0) return 0;

    // Starting stars (earned just for doing the habit)
    const starting = habit.startingStars ?? 0;
    stars += starting;

    const conv = habit.conversion;
    if (conv && conv.per > 0) {
      // If extraThreshold is set, skip that many units before counting extras
      const threshold = habit.extraThreshold ?? 0;
      const effectiveVal = Math.max(0, val - threshold);
      stars += Math.floor(effectiveVal / conv.per) * conv.stars;
    }
  } else if (habit.type === 'tiered') {
    const val = typeof logValue === 'number' ? logValue : 0;
    if (val <= 0) return 0;

    // Starting stars
    const starting = habit.startingStars ?? 0;
    stars += starting;

    // Walk tiers (sorted ascending by value) to find highest matching
    const tiers = (habit.tiers || []).slice().sort((a, b) => a.value - b.value);
    for (const tier of tiers) {
      if (val >= tier.value) {
        stars = starting + tier.stars;
      }
    }

    // Apply extra rule on top if defined
    if (habit.extraRule && habit.extraRule.per > 0 && tiers.length > 0) {
      const highestTierValue = tiers[tiers.length - 1].value;
      const threshold = habit.extraThreshold ?? 0;
      const excess = val - highestTierValue - threshold;
      if (excess > 0) {
        const extraStars = Math.floor(excess / habit.extraRule.per) * habit.extraRule.stars;
        stars += extraStars;
      }
    }
  } else if (habit.type === 'time-based') {
    // Time-based: stars depend on what time the habit was logged
    if (logValue !== true) return 0;

    const frames = habit.timeFrames || [];
    if (frames.length === 0) {
      stars = habit.stars; // fallback to fixed stars
    } else {
      const now = loggedAt ? new Date(loggedAt) : new Date();
      const hour = now.getHours();

      // Find best matching frame. Frames can wrap around midnight (e.g. 22-6).
      let matched = false;
      for (const frame of frames) {
        const inRange =
          frame.startHour <= frame.endHour
            ? hour >= frame.startHour && hour < frame.endHour
            : hour >= frame.startHour || hour < frame.endHour;
        if (inRange) {
          stars = frame.stars;
          matched = true;
          break;
        }
      }
      // If no frame matched, give minimum stars (1) or fallback
      if (!matched) {
        stars = habit.stars || 1;
      }
    }
  }

  stars = roundToStep(stars);

  // Neutral habits earn 0 stars (tracking only)
  if (habit.category === 'neutral') {
    return 0;
  }

  // Good habits earn positive stars, bad habits earn negative stars
  // For backwards compatibility with old data
  const category = habit.category || (habit.isGood ? 'good' : 'bad');
  return category === 'good' ? stars : -stars;
}
