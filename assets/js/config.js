/**
 * Math Ninja - Configuration & Constants
 * @fileoverview Game configuration, constants, and default values
 */

export const GAME_CONFIG = {
  // Timer settings
  TIMER_DURATION: 15000, // 15 seconds in milliseconds
  DAILY_CHALLENGE_TIMER: 12000, // 12 seconds for daily challenge
  EXAM_TIMER: 18000, // 18 seconds for exam mode
  TIMER_UPDATE_INTERVAL: 100, // Update timer every 100ms

  // Scoring system
  BASE_POINTS: 10,
  STREAK_BONUS: 5,
  STREAK_THRESHOLD: 3, // Bonus applies every 3 consecutive correct answers

  // Game mechanics
  QUESTIONS_PER_LEVEL: 10,
  EXAM_QUESTIONS_COUNT: 15, // Number of questions in exam mode
  ACCURACY_THRESHOLD: 80, // Minimum accuracy for star completion
  MAX_LEVEL: 10,
  MIN_LEVEL: 1,

  // Answer generation
  WRONG_ANSWERS_COUNT: 3,
  ANSWER_VARIATION_RANGE: 10,

  // UI timing
  FEEDBACK_DURATION: 1000, // 1 second
  NEXT_QUESTION_DELAY: 1500, // 1.5 seconds

  // Audio settings
  BUTTON_HOVER_VOLUME: 0.2, // Quiet hover sounds
  BUTTON_CLICK_VOLUME: 0.3, // Slightly louder click sounds

  // Local storage keys
  STORAGE_KEY: "mathNinjaStats",
  WRONG_ANSWERS_KEY: "mathNinjaWrongAnswers", // Legacy key - will be migrated
  STATISTICS_KEY: "mathNinjaDetailedStats",
  USER_DATA_KEY: "mathNinjaUserData",

  // Operation-specific wrong answer keys
  WRONG_ANSWERS_KEYS: {
    multiplication: "mathNinjaWrongAnswers_multiplication",
    division: "mathNinjaWrongAnswers_division",
    addition: "mathNinjaWrongAnswers_addition",
    subtraction: "mathNinjaWrongAnswers_subtraction",
  },

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

  // New: Multi-Operation Support
  OPERATIONS: {
    MULTIPLICATION: "multiplication",
    DIVISION: "division",
    ADDITION: "addition",
    SUBTRACTION: "subtraction",
    COMBINED: "combined",
  },

  // New: Daily Challenge Types
  DAILY_CHALLENGE_TYPES: {
    MULTIPLICATION: "multiplication",
    DIVISION: "division",
    ADDITION: "addition",
    SUBTRACTION: "subtraction",
    COMBINED: "combined",
    EXAM: "exam",
  },
};

// New: Mathematical Operations Configuration
export const OPERATIONS_CONFIG = {
  [GAME_CONFIG.OPERATIONS.MULTIPLICATION]: {
    name: "Množenje",
    symbol: "×",
    emoji: "✖️",
    description: "Vježbaj tablice množenja",
    color: "#4CAF50",
    levels: Array.from({ length: 10 }, (_, i) => i + 1),
  },
  [GAME_CONFIG.OPERATIONS.DIVISION]: {
    name: "Djeljenje",
    symbol: "÷",
    emoji: "➗",
    description: "Vježbaj djeljenje",
    color: "#2196F3",
    levels: Array.from({ length: 10 }, (_, i) => i + 1),
  },
  [GAME_CONFIG.OPERATIONS.ADDITION]: {
    name: "Zbrajanje",
    symbol: "+",
    emoji: "➕",
    description: "Vježbaj zbrajanje",
    color: "#FF9800",
    levels: Array.from({ length: 10 }, (_, i) => i + 1),
  },
  [GAME_CONFIG.OPERATIONS.SUBTRACTION]: {
    name: "Oduzimanje",
    symbol: "-",
    emoji: "➖",
    description: "Vježbaj oduzimanje",
    color: "#9C27B0",
    levels: Array.from({ length: 10 }, (_, i) => i + 1),
  },
  [GAME_CONFIG.OPERATIONS.COMBINED]: {
    name: "Kombinirano",
    symbol: "±",
    emoji: "🎯",
    description: "Sve računske operacije",
    color: "#E91E63",
    levels: [1], // Only one level for combined mode
  },
};

// New: Daily Challenge Configuration
export const DAILY_CHALLENGE_CONFIG = {
  [GAME_CONFIG.DAILY_CHALLENGE_TYPES.MULTIPLICATION]: {
    name: "Dnevni Izazov - Množenje",
    description: "10 pitanja iz tablice množenja",
    questions: 10,
    timer: GAME_CONFIG.DAILY_CHALLENGE_TIMER,
    operation: GAME_CONFIG.OPERATIONS.MULTIPLICATION,
  },
  [GAME_CONFIG.DAILY_CHALLENGE_TYPES.DIVISION]: {
    name: "Dnevni Izazov - Djeljenje",
    description: "10 pitanja iz djeljenja",
    questions: 10,
    timer: GAME_CONFIG.DAILY_CHALLENGE_TIMER,
    operation: GAME_CONFIG.OPERATIONS.DIVISION,
  },
  [GAME_CONFIG.DAILY_CHALLENGE_TYPES.ADDITION]: {
    name: "Dnevni Izazov - Zbrajanje",
    description: "10 pitanja iz zbrajanja",
    questions: 10,
    timer: GAME_CONFIG.DAILY_CHALLENGE_TIMER,
    operation: GAME_CONFIG.OPERATIONS.ADDITION,
  },
  [GAME_CONFIG.DAILY_CHALLENGE_TYPES.SUBTRACTION]: {
    name: "Dnevni Izazov - Oduzimanje",
    description: "10 pitanja iz oduzimanja",
    questions: 10,
    timer: GAME_CONFIG.DAILY_CHALLENGE_TIMER,
    operation: GAME_CONFIG.OPERATIONS.SUBTRACTION,
  },
  [GAME_CONFIG.DAILY_CHALLENGE_TYPES.COMBINED]: {
    name: "Dnevni Izazov - Kombinirano",
    description: "10 pitanja iz svih operacija",
    questions: 10,
    timer: GAME_CONFIG.DAILY_CHALLENGE_TIMER,
    operation: GAME_CONFIG.OPERATIONS.COMBINED,
  },
  [GAME_CONFIG.DAILY_CHALLENGE_TYPES.EXAM]: {
    name: "Dnevni Ispit",
    description: "15 pitanja iz svih operacija",
    questions: 15,
    timer: GAME_CONFIG.EXAM_TIMER,
    operation: GAME_CONFIG.OPERATIONS.COMBINED,
  },
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
  MENU: "menu-screen",
  OPERATION_SELECT: "operation-select-screen", // New screen
  LEVEL_SELECT: "level-select-screen",
  GAME: "game-screen",
  STATS: "stats-screen",
  SETTINGS: "settings-screen",
  LEVEL_COMPLETE: "level-complete-screen",
  LOGIN: "login-screen", // New screen
  ADMIN: "admin-screen", // New screen
  LEADERBOARD: "leaderboard-screen", // New screen
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

export const DEFAULT_STATS = {
  totalScore: 0,
  gamesPlayed: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  bestStreak: 0,
  completedLevels: [],
  lastPlayed: null,
  daysPlayed: [],
};

// New: Enhanced Statistics Structure for Multiple Operations
export const DEFAULT_OPERATION_STATS = {
  [GAME_CONFIG.OPERATIONS.MULTIPLICATION]: {
    totalScore: 0,
    gamesPlayed: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    bestStreak: 0,
    completedLevels: [],
    levelStars: {},
    lastPlayed: null,
    daysPlayed: [],
    wrongAnswers: {},
  },
  [GAME_CONFIG.OPERATIONS.DIVISION]: {
    totalScore: 0,
    gamesPlayed: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    bestStreak: 0,
    completedLevels: [],
    levelStars: {},
    lastPlayed: null,
    daysPlayed: [],
    wrongAnswers: {},
  },
  [GAME_CONFIG.OPERATIONS.ADDITION]: {
    totalScore: 0,
    gamesPlayed: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    bestStreak: 0,
    completedLevels: [],
    levelStars: {},
    lastPlayed: null,
    daysPlayed: [],
    wrongAnswers: {},
  },
  [GAME_CONFIG.OPERATIONS.SUBTRACTION]: {
    totalScore: 0,
    gamesPlayed: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    bestStreak: 0,
    completedLevels: [],
    levelStars: {},
    lastPlayed: null,
    daysPlayed: [],
    wrongAnswers: {},
  },
  [GAME_CONFIG.OPERATIONS.COMBINED]: {
    totalScore: 0,
    gamesPlayed: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    bestStreak: 0,
    completedLevels: [],
    levelStars: {},
    lastPlayed: null,
    daysPlayed: [],
    wrongAnswers: {},
  },
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

/**
 * Get operation configuration by operation type
 * @param {string} operation - Operation type
 * @returns {Object} Operation configuration
 */
export function getOperationConfig(operation) {
  return (
    OPERATIONS_CONFIG[operation] ||
    OPERATIONS_CONFIG[GAME_CONFIG.OPERATIONS.MULTIPLICATION]
  );
}

/**
 * Get all available operations
 * @returns {Array} Array of operation types
 */
export function getAvailableOperations() {
  return Object.keys(OPERATIONS_CONFIG);
}

/**
 * Get daily challenge configuration by type
 * @param {string} challengeType - Challenge type
 * @returns {Object} Challenge configuration
 */
export function getDailyChallengeConfig(challengeType) {
  return (
    DAILY_CHALLENGE_CONFIG[challengeType] ||
    DAILY_CHALLENGE_CONFIG[GAME_CONFIG.DAILY_CHALLENGE_TYPES.MULTIPLICATION]
  );
}

/**
 * Get all available daily challenge types
 * @returns {Array} Array of challenge types
 */
export function getAvailableDailyChallenges() {
  return Object.keys(DAILY_CHALLENGE_CONFIG);
}
