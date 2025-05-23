/**
 * Math Ninja - Configuration & Constants
 * @fileoverview Game configuration, constants, and default values
 */

export const GAME_CONFIG = {
    // Timer settings
    TIMER_DURATION: 10000, // 10 seconds in milliseconds
    DAILY_CHALLENGE_TIMER: 8000, // 8 seconds for daily challenge
    TIMER_UPDATE_INTERVAL: 100, // Update timer every 100ms
    
    // Scoring system
    BASE_POINTS: 10,
    STREAK_BONUS: 5,
    STREAK_THRESHOLD: 3, // Bonus applies every 3 consecutive correct answers
    
    // Game mechanics
    QUESTIONS_PER_LEVEL: 10,
    ACCURACY_THRESHOLD: 80, // Minimum accuracy for star completion
    MAX_LEVEL: 10,
    MIN_LEVEL: 1,
    
    // Answer generation
    WRONG_ANSWERS_COUNT: 3,
    ANSWER_VARIATION_RANGE: 3,
    
    // UI timing
    FEEDBACK_DURATION: 1000, // 1 second
    NEXT_QUESTION_DELAY: 1500, // 1.5 seconds
    
    // Local storage keys
    STORAGE_KEY: 'mathNinjaStats'
};

export const PERFORMANCE_TIERS = [
    { 
        threshold: 95, 
        emoji: '🤩', 
        title: 'IZVRSNO!', 
        stars: 3, 
        color: '#4caf50' 
    },
    { 
        threshold: 85, 
        emoji: '😄', 
        title: 'Odlično!', 
        stars: 3, 
        color: '#8bc34a' 
    },
    { 
        threshold: 70, 
        emoji: '😊', 
        title: 'Super!', 
        stars: 2, 
        color: '#ffc107' 
    },
    { 
        threshold: 50, 
        emoji: '🙂', 
        title: 'Dobro!', 
        stars: 1, 
        color: '#ff9800' 
    },
    { 
        threshold: 0, 
        emoji: '😟', 
        title: 'Trebamo još vježbati!', 
        stars: 0, 
        color: '#f44336' 
    }
];

export const SCREEN_NAMES = {
    MENU: 'menu-screen',
    LEVEL_SELECT: 'level-select-screen',
    GAME: 'game-screen',
    STATS: 'stats-screen',
    LEVEL_COMPLETE: 'level-complete-screen'
};

export const FEEDBACK_TYPES = {
    CORRECT: 'correct',
    INCORRECT: 'incorrect',
    TIMEOUT: 'timeout'
};

export const FEEDBACK_MESSAGES = {
    [FEEDBACK_TYPES.CORRECT]: '✓',
    [FEEDBACK_TYPES.INCORRECT]: '✗',
    [FEEDBACK_TYPES.TIMEOUT]: '⏰'
};

export const DEFAULT_STATS = {
    totalScore: 0,
    gamesPlayed: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    bestStreak: 0,
    completedLevels: [],
    lastPlayed: null,
    daysPlayed: []
};

/**
 * Get performance tier based on accuracy percentage
 * @param {number} accuracy - Accuracy percentage (0-100)
 * @returns {Object} Performance tier object
 */
export function getPerformanceTier(accuracy) {
    return PERFORMANCE_TIERS.find(tier => accuracy >= tier.threshold) || PERFORMANCE_TIERS[PERFORMANCE_TIERS.length - 1];
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