/**
 * Math Ninja - Configuration & Constants
 * @fileoverview Game configuration, constants, and default values
 */

export const GAME_CONFIG = {
  // Timer settings
  TIMER_DURATION: 15000, // 15 seconds in milliseconds
  DAILY_CHALLENGE_TIMER: 12000, // 12 seconds for daily challenge
  TIMER_UPDATE_INTERVAL: 100, // Update timer every 100ms

  // Scoring system
  BASE_POINTS: 10,
  STREAK_BONUS: 5,
  STREAK_THRESHOLD: 3, // Bonus applies every 3 consecutive correct answers

  // Game mechanics
  QUESTIONS_PER_LEVEL: 10,
  ACCURACY_THRESHOLD: 80, // Minimum accuracy for star completion
  STRIKES_ALLOWED: 3, // Number of strikes before a mini-break

  // Answer generation
  WRONG_ANSWERS_COUNT: 3, // Total options = 1 correct + 3 wrong = 4

  // UI timing
  FEEDBACK_DURATION: 1000, // 1 second
  NEXT_QUESTION_DELAY: 1500, // 1.5 seconds

  // Audio settings
  BUTTON_HOVER_VOLUME: 0.2, // Quiet hover sounds
  BUTTON_CLICK_VOLUME: 0.3, // Slightly louder click sounds

  // Local storage keys
  STORAGE_KEY: "mathNinjaStats",
  WRONG_ANSWERS_KEY: "mathNinjaWrongAnswers",
  STATISTICS_KEY: "mathNinjaDetailedStats",
  BADGES_KEY: "mathNinjaBadges",
  STORAGE_VERSION: 2,

  // New: Streak Visual Effects
  STREAK_EFFECT_LEVELS: {
    LEVEL_1: 3, // First visual change
    LEVEL_2: 5, // Moderate intensity
    LEVEL_3: 8, // High intensity
    LEVEL_4: 12, // Maximum intensity
    LEVEL_5: 15, // Epic level
  },

  // New: Statistics Tracking
  PLAYTIME_UPDATE_INTERVAL: 1000, // Update playtime every second
  DAILY_STREAK_THRESHOLD: 1, // Days to maintain daily streak

  // New: Wrong Answer Learning
  WRONG_ANSWER_RETRY_DELAY: 2000, // Delay before retry offer
  MAX_WRONG_ANSWERS_TRACKED: 50, // Maximum wrong answers to track per level
  RETRY_TRIGGER_THRESHOLD: 2, // Correct answers needed before retry offer
  REVIEW_CHANCE: 0.35, // 35% chance to show a review question
};

export const OPERATIONS = {
  ADD: { id: 'add', label: 'Zbrajanje', symbol: '+' },
  SUB: { id: 'sub', label: 'Oduzimanje', symbol: '−' },
  MUL: { id: 'mul', label: 'Množenje', symbol: '×' },
  DIV: { id: 'div', label: 'Dijeljenje', symbol: '÷' }
};

export const LEVELS_BY_OPERATION = {
  add: [
    { id: 'add_L1', label: 'Do 10', hint: '0 - 10', range: [0, 10], allowCarry: false },
    { id: 'add_L2', label: 'Do 20', hint: '0 - 20', range: [0, 20], allowCarry: true },
    { id: 'add_L3', label: 'Do 50', hint: '0 - 50', range: [0, 50], allowCarry: true },
    { id: 'add_L4', label: 'Do 100', hint: '0 - 100', range: [0, 100], allowCarry: true }
  ],
  sub: [
    { id: 'sub_L1', label: 'Do 10', hint: '0 - 10', range: [0, 10], allowNegative: false },
    { id: 'sub_L2', label: 'Do 20', hint: '0 - 20', range: [0, 20], allowNegative: false },
    { id: 'sub_L3', label: 'Do 50', hint: '0 - 50', range: [0, 50], allowNegative: false },
    { id: 'sub_L4', label: 'Do 100', hint: '0 - 100', range: [0, 100], allowNegative: false }
  ],
  mul: Array.from({ length: 10 }, (_, i) => ({
    id: `mul_T${i + 1}`,
    label: `Broj ${i + 1}`,
    hint: `Tablica broja ${i + 1}`,
    table: i + 1,
    range: [1, 10]
  })),
  div: Array.from({ length: 9 }, (_, i) => ({
    id: `div_T${i + 2}`,
    label: `S brojem ${i + 2}`,
    hint: `Dijeljenje s ${i + 2}`,
    divisor: i + 2,
    range: [1, 10] // Quotient range (result)
  }))
};

export const PERFORMANCE_TIERS = [
  {
    threshold: 95,
    emoji: "🤩",
    title: "IZVRSNO!",
    stars: 3,
    color: "#4caf50",
  },
  {
    threshold: 85,
    emoji: "😄",
    title: "Odlično!",
    stars: 3,
    color: "#8bc34a",
  },
  {
    threshold: 70,
    emoji: "😊",
    title: "Super!",
    stars: 2,
    color: "#ffc107",
  },
  {
    threshold: 50,
    emoji: "🙂",
    title: "Dobro!",
    stars: 1,
    color: "#ff9800",
  },
  {
    threshold: 0,
    emoji: "😟",
    title: "Trebamo još vježbati!",
    stars: 0,
    color: "#f44336",
  },
];

export const SCREEN_NAMES = {
  HOME: "home-screen", // New Home/Op Select
  LEVEL_SELECT: "level-select-screen",
  GAME: "game-screen",
  STATS: "stats-screen",
  SETTINGS: "settings-screen",
  LEVEL_COMPLETE: "level-complete-screen",
  BADGES: "badges-screen" // New Badges screen
};

export const FEEDBACK_TYPES = {
  CORRECT: "correct",
  INCORRECT: "incorrect",
  TIMEOUT: "timeout",
  STREAK: "streak",
};

export const FEEDBACK_MESSAGES = {
  [FEEDBACK_TYPES.CORRECT]: "✓",
  [FEEDBACK_TYPES.INCORRECT]: "✗",
  [FEEDBACK_TYPES.TIMEOUT]: "⏰",
};

// New: Streak Visual Themes
export const STREAK_THEMES = {
  DEFAULT: {
    name: "default",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    particles: false,
    intensity: 0,
  },
  LEVEL_1: {
    name: "warming-up",
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    particles: true,
    intensity: 1,
    effects: ["glow"],
  },
  LEVEL_2: {
    name: "getting-hot",
    background:
      "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
    particles: true,
    intensity: 2,
    effects: ["glow", "pulse"],
  },
  LEVEL_3: {
    name: "on-fire",
    background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    particles: true,
    intensity: 3,
    effects: ["glow", "pulse", "shake"],
  },
  LEVEL_4: {
    name: "blazing",
    background:
      "linear-gradient(135deg, #ff6b6b 0%, #ffa500 50%, #ffff00 100%)",
    particles: true,
    intensity: 4,
    effects: ["glow", "pulse", "shake", "flames"],
  },
  LEVEL_5: {
    name: "legendary",
    background:
      "linear-gradient(135deg, #ff0000 0%, #ff4500 25%, #ffd700 50%, #ffff00 75%, #ff0000 100%)",
    particles: true,
    intensity: 5,
    effects: ["glow", "pulse", "shake", "flames", "lightning"],
  },
};

/**
 * Get performance tier based on accuracy percentage
 * @param {number} accuracy - Accuracy percentage (0-100)
 * @returns {Object} Performance tier object
 */
export function getPerformanceTier(accuracy) {
  if (accuracy >= 95) {
    return { stars: 3, title: "Savršeno!", color: "#4CAF50", emoji: "🥷" };
  } else if (accuracy >= 85) {
    return { stars: 2, title: "Odlično!", color: "#FF9800", emoji: "✨" };
  } else if (accuracy >= 70) {
    return { stars: 1, title: "Dobro!", color: "#2196F3", emoji: "👍" };
  } else {
    return {
      stars: 0,
      title: "Pokušaj ponovno!",
      color: "#F44336",
      emoji: "💪",
    };
  }
}

/**
 * Calculate star rating based on accuracy
 * @param {number} accuracy - Accuracy percentage (0-100)
 * @returns {number} Number of stars (0-3)
 */
export function calculateStars(accuracy) {
  if (accuracy >= 95) return 3;
  if (accuracy >= 85) return 3;
  if (accuracy >= 70) return 2;
  if (accuracy >= 50) return 1;
  return 0;
}

/**
 * Get streak theme based on current streak
 * @param {number} streak - Current streak count
 * @returns {Object} Streak theme configuration
 */
export function getStreakTheme(streak) {
  if (streak >= GAME_CONFIG.STREAK_EFFECT_LEVELS.LEVEL_5) {
    return STREAK_THEMES.LEVEL_5;
  } else if (streak >= GAME_CONFIG.STREAK_EFFECT_LEVELS.LEVEL_4) {
    return STREAK_THEMES.LEVEL_4;
  } else if (streak >= GAME_CONFIG.STREAK_EFFECT_LEVELS.LEVEL_3) {
    return STREAK_THEMES.LEVEL_3;
  } else if (streak >= GAME_CONFIG.STREAK_EFFECT_LEVELS.LEVEL_2) {
    return STREAK_THEMES.LEVEL_2;
  } else if (streak >= GAME_CONFIG.STREAK_EFFECT_LEVELS.LEVEL_1) {
    return STREAK_THEMES.LEVEL_1;
  } else {
    return STREAK_THEMES.DEFAULT;
  }
}
