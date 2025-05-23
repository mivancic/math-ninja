/**
 * Math Ninja - Statistics Manager
 * @fileoverview Advanced statistics tracking for detailed game analytics
 */

import { GAME_CONFIG } from "./config.js";

export class StatisticsManager {
  constructor() {
    this.currentSessionStart = null;
    this.playtimeInterval = null;
    this.wrongAnswers = this.loadWrongAnswers();
    this.detailedStats = this.loadDetailedStats();
    this.dailyStreak = this.calculateDailyStreak();

    // Start session tracking
    this.startSession();
  }

  /**
   * Load detailed statistics from localStorage
   */
  loadDetailedStats() {
    try {
      const saved = localStorage.getItem(GAME_CONFIG.STATISTICS_KEY);
      if (saved) {
        return { ...this.getDefaultDetailedStats(), ...JSON.parse(saved) };
      }
    } catch (e) {
      console.log("No detailed statistics found");
    }
    return this.getDefaultDetailedStats();
  }

  /**
   * Save detailed statistics to localStorage
   */
  saveDetailedStats() {
    try {
      localStorage.setItem(
        GAME_CONFIG.STATISTICS_KEY,
        JSON.stringify(this.detailedStats)
      );
    } catch (e) {
      console.error("Failed to save detailed statistics");
    }
  }

  /**
   * Get default detailed statistics structure
   */
  getDefaultDetailedStats() {
    return {
      totalPlaytimeMinutes: 0,
      dailyLaunches: {}, // date -> count
      dailyPlaytime: {}, // date -> minutes
      dailyChallengeStreak: 0,
      dailyChallengeHistory: [], // array of dates when played
      lastDailyChallengeDate: null,
      longestDailyStreak: 0,
      sessionCount: 0,
      averageSessionLength: 0,
      createdDate: new Date().toISOString(),
    };
  }

  /**
   * Load wrong answers tracking from localStorage
   */
  loadWrongAnswers() {
    try {
      const saved = localStorage.getItem(GAME_CONFIG.WRONG_ANSWERS_KEY);
      if (saved) {
        const wrongAnswers = JSON.parse(saved);

        // Migrate old data structure to include allWrongAnswers
        Object.keys(wrongAnswers).forEach((levelKey) => {
          wrongAnswers[levelKey].forEach((wrongAnswer) => {
            if (
              !wrongAnswer.allWrongAnswers &&
              wrongAnswer.wrongAnswer !== undefined
            ) {
              wrongAnswer.allWrongAnswers = [wrongAnswer.wrongAnswer];
              console.log(
                `🔄 Migrated wrong answer for ${wrongAnswer.question}: ${wrongAnswer.wrongAnswer}`
              );
            }
          });
        });

        return wrongAnswers;
      }
    } catch (e) {
      console.log("No wrong answers data found");
    }
    return {};
  }

  /**
   * Save wrong answers to localStorage
   */
  saveWrongAnswers() {
    try {
      localStorage.setItem(
        GAME_CONFIG.WRONG_ANSWERS_KEY,
        JSON.stringify(this.wrongAnswers)
      );
    } catch (e) {
      console.error("Failed to save wrong answers");
    }
  }

  /**
   * Start a new session
   */
  startSession() {
    this.currentSessionStart = Date.now();

    // Track daily launch
    const today = new Date().toDateString();
    if (!this.detailedStats.dailyLaunches[today]) {
      this.detailedStats.dailyLaunches[today] = 0;
    }
    this.detailedStats.dailyLaunches[today]++;
    this.detailedStats.sessionCount++;

    // Start playtime tracking
    this.startPlaytimeTracking();

    this.saveDetailedStats();
    console.log("📊 Statistics session started");
  }

  /**
   * End current session
   */
  endSession() {
    if (this.currentSessionStart) {
      const sessionLength = (Date.now() - this.currentSessionStart) / 1000 / 60; // minutes
      const today = new Date().toDateString();

      if (!this.detailedStats.dailyPlaytime[today]) {
        this.detailedStats.dailyPlaytime[today] = 0;
      }
      this.detailedStats.dailyPlaytime[today] += sessionLength;
      this.detailedStats.totalPlaytimeMinutes += sessionLength;

      // Update average session length
      this.detailedStats.averageSessionLength =
        this.detailedStats.totalPlaytimeMinutes /
        this.detailedStats.sessionCount;

      this.stopPlaytimeTracking();
      this.saveDetailedStats();

      console.log(`📊 Session ended: ${sessionLength.toFixed(1)} minutes`);
    }
  }

  /**
   * Start playtime tracking interval
   */
  startPlaytimeTracking() {
    this.stopPlaytimeTracking(); // Clear any existing interval

    this.playtimeInterval = setInterval(() => {
      const today = new Date().toDateString();
      const minutesToAdd = GAME_CONFIG.PLAYTIME_UPDATE_INTERVAL / 1000 / 60;

      if (!this.detailedStats.dailyPlaytime[today]) {
        this.detailedStats.dailyPlaytime[today] = 0;
      }
      this.detailedStats.dailyPlaytime[today] += minutesToAdd;
      this.detailedStats.totalPlaytimeMinutes += minutesToAdd;

      // Update average session length
      this.detailedStats.averageSessionLength =
        this.detailedStats.totalPlaytimeMinutes /
        Math.max(this.detailedStats.sessionCount, 1);
    }, GAME_CONFIG.PLAYTIME_UPDATE_INTERVAL);
  }

  /**
   * Stop playtime tracking
   */
  stopPlaytimeTracking() {
    if (this.playtimeInterval) {
      clearInterval(this.playtimeInterval);
      this.playtimeInterval = null;
    }
  }

  /**
   * Track daily challenge completion
   */
  trackDailyChallenge() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // Check if already played today
    if (this.detailedStats.lastDailyChallengeDate === today) {
      return; // Already tracked today
    }

    // Add to history
    if (!this.detailedStats.dailyChallengeHistory.includes(today)) {
      this.detailedStats.dailyChallengeHistory.push(today);
    }

    // Update streak
    if (this.detailedStats.lastDailyChallengeDate === yesterday) {
      this.detailedStats.dailyChallengeStreak++;
    } else {
      this.detailedStats.dailyChallengeStreak = 1; // Reset streak
    }

    // Update longest streak
    if (
      this.detailedStats.dailyChallengeStreak >
      this.detailedStats.longestDailyStreak
    ) {
      this.detailedStats.longestDailyStreak =
        this.detailedStats.dailyChallengeStreak;
    }

    this.detailedStats.lastDailyChallengeDate = today;
    this.saveDetailedStats();

    console.log(
      `🗓️ Daily challenge tracked. Streak: ${this.detailedStats.dailyChallengeStreak}`
    );
  }

  /**
   * Calculate current daily challenge streak
   */
  calculateDailyStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (this.detailedStats.lastDailyChallengeDate === today) {
      return this.detailedStats.dailyChallengeStreak;
    } else if (this.detailedStats.lastDailyChallengeDate === yesterday) {
      return this.detailedStats.dailyChallengeStreak; // Can still continue today
    } else {
      return 0; // Streak broken
    }
  }

  /**
   * Track a wrong answer for learning system
   */
  trackWrongAnswer(level, question, wrongAnswer, correctAnswer) {
    const levelKey = `level_${level}`;

    if (!this.wrongAnswers[levelKey]) {
      this.wrongAnswers[levelKey] = [];
    }

    // Find existing wrong answer for this question
    const existing = this.wrongAnswers[levelKey].find(
      (w) => w.num1 === question.num1 && w.num2 === question.num2
    );

    if (existing) {
      // Update existing entry
      // Store ALL wrong answers, not just the latest one
      if (!existing.allWrongAnswers) {
        existing.allWrongAnswers = [existing.wrongAnswer]; // Convert old single value to array
      }
      existing.allWrongAnswers.push(wrongAnswer); // Add new wrong answer to collection

      existing.wrongAnswer = wrongAnswer; // Keep for backward compatibility
      existing.timestamp = Date.now();

      // If it was previously learned, reset status and increment attempts
      if (existing.learned) {
        existing.learned = false;
        existing.totalAttempts = (existing.totalAttempts || 1) + 1;
        existing.correctAttempts = existing.correctAttempts || 0; // Keep track of correct attempts
        console.log(
          `🔄 Previously learned question failed again: ${question.num1} × ${
            question.num2
          } (attempt ${
            existing.totalAttempts
          }, wrong answers: [${existing.allWrongAnswers.join(", ")}])`
        );
      } else {
        existing.totalAttempts = (existing.totalAttempts || 1) + 1;
        console.log(
          `❌ Updated wrong answer: ${question.num1} × ${
            question.num2
          } (attempt ${
            existing.totalAttempts
          }, wrong answers: [${existing.allWrongAnswers.join(", ")}])`
        );
      }
    } else {
      // Create new wrong answer entry
      const wrongData = {
        question: `${question.num1} × ${question.num2}`,
        num1: question.num1,
        num2: question.num2,
        wrongAnswer,
        allWrongAnswers: [wrongAnswer], // Start collection of all wrong answers
        correctAnswer,
        timestamp: Date.now(),
        retryCount: 0,
        learned: false,
        totalAttempts: 1,
        correctAttempts: 0,
      };

      this.wrongAnswers[levelKey].push(wrongData);
      console.log(
        `❌ New wrong answer tracked: ${wrongData.question} = ${wrongData.correctAnswer}`
      );
    }

    // Limit number of tracked wrong answers per level
    if (
      this.wrongAnswers[levelKey].length > GAME_CONFIG.MAX_WRONG_ANSWERS_TRACKED
    ) {
      this.wrongAnswers[levelKey] = this.wrongAnswers[levelKey]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, GAME_CONFIG.MAX_WRONG_ANSWERS_TRACKED);
    }

    this.saveWrongAnswers();
  }

  /**
   * Mark a wrong answer as learned
   */
  markAsLearned(level, num1, num2) {
    const levelKey = `level_${level}`;

    if (this.wrongAnswers[levelKey]) {
      const wrongAnswer = this.wrongAnswers[levelKey].find(
        (w) => w.num1 === num1 && w.num2 === num2
      );

      if (wrongAnswer) {
        wrongAnswer.learned = true;
        wrongAnswer.retryCount++;
        wrongAnswer.correctAttempts = (wrongAnswer.correctAttempts || 0) + 1;
        wrongAnswer.totalAttempts = wrongAnswer.totalAttempts || 1;

        // Calculate accuracy for this specific question
        const accuracy = Math.round(
          (wrongAnswer.correctAttempts / wrongAnswer.totalAttempts) * 100
        );

        this.saveWrongAnswers();
        console.log(
          `✅ Marked as learned: ${num1} × ${num2} (accuracy: ${accuracy}%, attempts: ${wrongAnswer.totalAttempts})`
        );
      }
    }
  }

  /**
   * Get unlearned wrong answers for a level
   */
  getUnlearnedWrongAnswers(level) {
    const levelKey = `level_${level}`;

    if (!this.wrongAnswers[levelKey]) {
      return [];
    }

    return this.wrongAnswers[levelKey]
      .filter((w) => !w.learned)
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }

  /**
   * Get all wrong answers for daily challenge mix
   */
  getAllUnlearnedWrongAnswers() {
    const allWrong = [];

    Object.keys(this.wrongAnswers).forEach((levelKey) => {
      const levelWrong = this.wrongAnswers[levelKey].filter((w) => !w.learned);
      allWrong.push(...levelWrong);
    });

    return allWrong.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get today's playtime in minutes
   */
  getTodayPlaytime() {
    const today = new Date().toDateString();
    return this.detailedStats.dailyPlaytime[today] || 0;
  }

  /**
   * Get today's launch count
   */
  getTodayLaunches() {
    const today = new Date().toDateString();
    return this.detailedStats.dailyLaunches[today] || 0;
  }

  /**
   * Get comprehensive statistics for display
   */
  getComprehensiveStats() {
    return {
      totalPlaytimeMinutes: this.detailedStats.totalPlaytimeMinutes,
      totalPlaytimeFormatted: this.formatPlaytime(
        this.detailedStats.totalPlaytimeMinutes
      ),
      dailyChallengeStreak: this.calculateDailyStreak(),
      longestDailyStreak: this.detailedStats.longestDailyStreak,
      todayPlaytime: this.getTodayPlaytime(),
      todayPlaytimeFormatted: this.formatPlaytime(this.getTodayPlaytime()),
      todayLaunches: this.getTodayLaunches(),
      averageSessionLength: this.detailedStats.averageSessionLength,
      averageSessionFormatted: this.formatPlaytime(
        this.detailedStats.averageSessionLength
      ),
      sessionCount: this.detailedStats.sessionCount,
      totalWrongAnswers: this.getTotalWrongAnswersCount(),
      unlearnedWrongAnswers: this.getTotalUnlearnedCount(),
    };
  }

  /**
   * Format playtime in minutes to readable format
   */
  formatPlaytime(minutes) {
    if (minutes < 1) {
      return "< 1 min";
    } else if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
  }

  /**
   * Get total wrong answers count
   */
  getTotalWrongAnswersCount() {
    let total = 0;
    Object.values(this.wrongAnswers).forEach((levelWrong) => {
      total += levelWrong.length;
    });
    return total;
  }

  /**
   * Get total unlearned wrong answers count
   */
  getTotalUnlearnedCount() {
    let total = 0;
    Object.values(this.wrongAnswers).forEach((levelWrong) => {
      total += levelWrong.filter((w) => !w.learned).length;
    });
    return total;
  }

  /**
   * Clean up when app closes
   */
  cleanup() {
    this.endSession();
    this.stopPlaytimeTracking();
  }
}
