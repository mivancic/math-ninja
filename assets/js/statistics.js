/**
 * Math Ninja - Statistics Manager
 * @fileoverview Advanced statistics tracking for detailed game analytics
 */

import { GAME_CONFIG } from "./config.js";

export class StatisticsManager {
  constructor() {
    this.currentSessionStart = null;
    this.playtimeInterval = null;

    // Operation-specific wrong answers storage
    this.wrongAnswersByOperation = {
      [GAME_CONFIG.OPERATIONS.MULTIPLICATION]:
        this.loadWrongAnswersForOperation(
          GAME_CONFIG.OPERATIONS.MULTIPLICATION
        ),
      [GAME_CONFIG.OPERATIONS.DIVISION]: this.loadWrongAnswersForOperation(
        GAME_CONFIG.OPERATIONS.DIVISION
      ),
      [GAME_CONFIG.OPERATIONS.ADDITION]: this.loadWrongAnswersForOperation(
        GAME_CONFIG.OPERATIONS.ADDITION
      ),
      [GAME_CONFIG.OPERATIONS.SUBTRACTION]: this.loadWrongAnswersForOperation(
        GAME_CONFIG.OPERATIONS.SUBTRACTION
      ),
    };

    // Legacy support for combined access
    this.wrongAnswers = this.getCombinedWrongAnswers();

    this.detailedStats = this.loadDetailedStats();
    this.dailyStreak = this.calculateDailyStreak();

    // Legacy: Migrate old wrong answers if they exist
    this.migrateLegacyWrongAnswers();

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
      // Enhanced Daily Challenge Statistics
      dailyChallengeRuns: [], // array of { date, runNumber, score, mistakes, accuracy, completedTime }
      dailyChallengeToday: 0, // number of runs today
    };
  }

  /**
   * Load wrong answers for a specific operation from localStorage
   */
  loadWrongAnswersForOperation(operation) {
    try {
      const storageKey = GAME_CONFIG.WRONG_ANSWERS_KEYS[operation];
      if (!storageKey) {
        console.warn(`No storage key defined for operation: ${operation}`);
        return {};
      }

      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const wrongAnswers = JSON.parse(saved);

        // Migration: Convert single wrongAnswer to allWrongAnswers array
        Object.keys(wrongAnswers).forEach((levelKey) => {
          wrongAnswers[levelKey].forEach((wrongAnswer) => {
            if (
              !wrongAnswer.allWrongAnswers &&
              wrongAnswer.wrongAnswer !== undefined
            ) {
              wrongAnswer.allWrongAnswers = [wrongAnswer.wrongAnswer];
              console.log(
                `🔄 Migrated ${operation} wrong answer for ${wrongAnswer.question}: ${wrongAnswer.wrongAnswer}`
              );
            }
          });
        });

        // Clean invalid entries for multiplication/division (need num1/num2)
        if (
          operation === GAME_CONFIG.OPERATIONS.MULTIPLICATION ||
          operation === GAME_CONFIG.OPERATIONS.DIVISION
        ) {
          Object.keys(wrongAnswers).forEach((levelKey) => {
            const original = wrongAnswers[levelKey] || [];
            const cleaned = original.filter(
              (w) => Number.isFinite(w.num1) && Number.isFinite(w.num2)
            );
            if (cleaned.length !== original.length) {
              console.log(
                `🧹 Cleaned ${
                  original.length - cleaned.length
                } invalid ${operation} wrong-answer entries from ${levelKey}`
              );
            }
            wrongAnswers[levelKey] = cleaned;
          });
        }

        return wrongAnswers;
      }
    } catch (e) {
      console.log(`No ${operation} wrong answers data found`);
    }
    return {};
  }

  /**
   * Get combined wrong answers from all operations (for legacy compatibility)
   */
  getCombinedWrongAnswers() {
    const combined = {};

    // Merge all operation-specific wrong answers
    Object.values(GAME_CONFIG.OPERATIONS).forEach((operation) => {
      if (operation === GAME_CONFIG.OPERATIONS.COMBINED) return; // Skip combined itself

      const operationWrongAnswers =
        this.wrongAnswersByOperation[operation] || {};
      Object.keys(operationWrongAnswers).forEach((levelKey) => {
        if (!combined[levelKey]) {
          combined[levelKey] = [];
        }
        combined[levelKey].push(...operationWrongAnswers[levelKey]);
      });
    });

    return combined;
  }

  /**
   * Migrate legacy wrong answers to operation-specific storage
   */
  migrateLegacyWrongAnswers() {
    try {
      const legacyData = localStorage.getItem(GAME_CONFIG.WRONG_ANSWERS_KEY);
      if (!legacyData) return;

      const legacyWrongAnswers = JSON.parse(legacyData);
      let migratedCount = 0;

      Object.keys(legacyWrongAnswers).forEach((levelKey) => {
        legacyWrongAnswers[levelKey].forEach((wrongAnswer) => {
          // Try to determine operation from the question format
          let operation = GAME_CONFIG.OPERATIONS.MULTIPLICATION; // Default fallback

          if (wrongAnswer.operation) {
            operation = wrongAnswer.operation;
          } else if (
            wrongAnswer.question &&
            wrongAnswer.question.includes("÷")
          ) {
            operation = GAME_CONFIG.OPERATIONS.DIVISION;
          } else if (
            wrongAnswer.question &&
            wrongAnswer.question.includes("+")
          ) {
            operation = GAME_CONFIG.OPERATIONS.ADDITION;
          } else if (
            wrongAnswer.question &&
            wrongAnswer.question.includes("-")
          ) {
            operation = GAME_CONFIG.OPERATIONS.SUBTRACTION;
          }

          // Add to operation-specific storage
          if (!this.wrongAnswersByOperation[operation][levelKey]) {
            this.wrongAnswersByOperation[operation][levelKey] = [];
          }

          // Check if already exists to avoid duplicates
          const exists = this.wrongAnswersByOperation[operation][levelKey].find(
            (w) =>
              w.num1 === wrongAnswer.num1 &&
              w.num2 === wrongAnswer.num2 &&
              w.question === wrongAnswer.question
          );

          if (!exists) {
            this.wrongAnswersByOperation[operation][levelKey].push(wrongAnswer);
            migratedCount++;
          }
        });
      });

      if (migratedCount > 0) {
        console.log(
          `🔄 Migrated ${migratedCount} legacy wrong answers to operation-specific storage`
        );

        // Save the migrated data
        this.saveAllWrongAnswers();

        // Remove legacy data
        localStorage.removeItem(GAME_CONFIG.WRONG_ANSWERS_KEY);
        console.log(`🗑️ Removed legacy wrong answers storage`);
      }
    } catch (e) {
      console.warn("Failed to migrate legacy wrong answers:", e);
    }
  }

  /**
   * Save wrong answers for a specific operation to localStorage
   */
  saveWrongAnswersForOperation(operation) {
    try {
      const storageKey = GAME_CONFIG.WRONG_ANSWERS_KEYS[operation];
      if (!storageKey) {
        console.warn(`No storage key defined for operation: ${operation}`);
        return;
      }

      localStorage.setItem(
        storageKey,
        JSON.stringify(this.wrongAnswersByOperation[operation] || {})
      );
    } catch (e) {
      console.error(`Failed to save ${operation} wrong answers:`, e);
    }
  }

  /**
   * Save all wrong answers for all operations to localStorage
   */
  saveAllWrongAnswers() {
    Object.values(GAME_CONFIG.OPERATIONS).forEach((operation) => {
      if (operation !== GAME_CONFIG.OPERATIONS.COMBINED) {
        this.saveWrongAnswersForOperation(operation);
      }
    });

    // Update legacy combined view
    this.wrongAnswers = this.getCombinedWrongAnswers();
  }

  /**
   * Legacy save method - now saves all operations
   */
  saveWrongAnswers() {
    this.saveAllWrongAnswers();
  }

  /**
   * Start a new session
   */
  startSession() {
    this.currentSessionStart = Date.now();

    // Reset daily challenge runs if new day
    this.resetDailyRuns();

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
  trackWrongAnswer(
    level,
    question,
    wrongAnswer,
    correctAnswer,
    operation = null
  ) {
    // Determine operation if not provided
    if (!operation) {
      operation = question.operation || GAME_CONFIG.OPERATIONS.MULTIPLICATION;
    }

    // Validation based on operation type
    if (
      operation === GAME_CONFIG.OPERATIONS.MULTIPLICATION ||
      operation === GAME_CONFIG.OPERATIONS.DIVISION
    ) {
      // Multiplication/Division require num1 and num2
      if (!Number.isFinite(question.num1) || !Number.isFinite(question.num2)) {
        return; // skip invalid entries
      }
    }

    const levelKey = `level_${level}`;

    // Ensure operation storage exists
    if (!this.wrongAnswersByOperation[operation]) {
      this.wrongAnswersByOperation[operation] = {};
    }

    if (!this.wrongAnswersByOperation[operation][levelKey]) {
      this.wrongAnswersByOperation[operation][levelKey] = [];
    }

    // Find existing wrong answer for this question
    let existing;
    if (
      operation === GAME_CONFIG.OPERATIONS.MULTIPLICATION ||
      operation === GAME_CONFIG.OPERATIONS.DIVISION
    ) {
      existing = this.wrongAnswersByOperation[operation][levelKey].find(
        (w) => w.num1 === question.num1 && w.num2 === question.num2
      );
    } else {
      // For addition/subtraction, match by question text
      existing = this.wrongAnswersByOperation[operation][levelKey].find(
        (w) => w.question === question.question
      );
    }

    if (existing) {
      // Update existing entry
      if (!existing.allWrongAnswers) {
        existing.allWrongAnswers = [existing.wrongAnswer];
      }
      existing.allWrongAnswers.push(wrongAnswer);
      existing.wrongAnswer = wrongAnswer;
      existing.timestamp = Date.now();

      if (existing.learned) {
        existing.learned = false;
        existing.totalAttempts = (existing.totalAttempts || 1) + 1;
        existing.correctAttempts = existing.correctAttempts || 0;
        console.log(
          `🔄 Previously learned ${operation} question failed again: ${
            existing.question
          } (attempt ${
            existing.totalAttempts
          }, wrong answers: [${existing.allWrongAnswers.join(", ")}])`
        );
      } else {
        existing.totalAttempts = (existing.totalAttempts || 1) + 1;
        console.log(
          `❌ Updated ${operation} wrong answer: ${
            existing.question
          } (attempt ${
            existing.totalAttempts
          }, wrong answers: [${existing.allWrongAnswers.join(", ")}])`
        );
      }
    } else {
      // Create new wrong answer entry
      const wrongData = {
        question: question.question || `${question.num1} × ${question.num2}`,
        num1: question.num1,
        num2: question.num2,
        wrongAnswer,
        allWrongAnswers: [wrongAnswer],
        correctAnswer,
        operation,
        timestamp: Date.now(),
        retryCount: 0,
        learned: false,
        totalAttempts: 1,
        correctAttempts: 0,
      };

      // Add operation-specific data for division
      if (operation === GAME_CONFIG.OPERATIONS.DIVISION) {
        wrongData.dividend = question.dividend;
        wrongData.divisor = question.divisor;
        wrongData.quotient = question.quotient;
      }

      this.wrongAnswersByOperation[operation][levelKey].push(wrongData);
      console.log(
        `❌ New ${operation} wrong answer tracked: ${wrongData.question} = ${wrongData.correctAnswer}`
      );
    }

    // Limit number of tracked wrong answers per level
    if (
      this.wrongAnswersByOperation[operation][levelKey].length >
      GAME_CONFIG.MAX_WRONG_ANSWERS_TRACKED
    ) {
      this.wrongAnswersByOperation[operation][levelKey] =
        this.wrongAnswersByOperation[operation][levelKey]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, GAME_CONFIG.MAX_WRONG_ANSWERS_TRACKED);
    }

    // Save operation-specific wrong answers
    this.saveWrongAnswersForOperation(operation);

    // Update combined view for legacy compatibility
    this.wrongAnswers = this.getCombinedWrongAnswers();
  }

  /**
   * Mark a wrong answer as learned (marks in ALL levels where it exists)
   */
  markAsLearned(level, num1, num2, operation = null) {
    let markedCount = 0;

    // If no operation provided, try to find it in any operation
    const operationsToCheck = operation
      ? [operation]
      : Object.keys(this.wrongAnswersByOperation);

    operationsToCheck.forEach((op) => {
      if (!this.wrongAnswersByOperation[op]) return;

      // Mark as learned in ALL levels where this question exists
      Object.keys(this.wrongAnswersByOperation[op]).forEach((levelKey) => {
        const wrongAnswer = this.wrongAnswersByOperation[op][levelKey].find(
          (w) => w.num1 === num1 && w.num2 === num2
        );

        if (wrongAnswer && !wrongAnswer.learned) {
          wrongAnswer.learned = true;
          wrongAnswer.retryCount++;
          wrongAnswer.correctAttempts = (wrongAnswer.correctAttempts || 0) + 1;
          wrongAnswer.totalAttempts = wrongAnswer.totalAttempts || 1;

          // Calculate accuracy for this specific question
          const accuracy = Math.round(
            (wrongAnswer.correctAttempts / wrongAnswer.totalAttempts) * 100
          );

          markedCount++;
          console.log(
            `✅ ${op} marked as learned in ${levelKey}: ${wrongAnswer.question} (accuracy: ${accuracy}%, attempts: ${wrongAnswer.totalAttempts})`
          );
        }
      });
    });

    if (markedCount > 0) {
      this.saveAllWrongAnswers();
      console.log(
        `📚 Total marked as learned: ${markedCount} instances of ${num1} × ${num2}`
      );
    }
  }

  /**
   * Mark a wrong answer as learned by question text (for addition/subtraction)
   */
  markAsLearnedByQuestion(level, questionText, operation) {
    let markedCount = 0;

    if (!this.wrongAnswersByOperation[operation]) return markedCount;

    // Mark as learned in ALL levels where this question exists
    Object.keys(this.wrongAnswersByOperation[operation]).forEach((levelKey) => {
      const wrongAnswer = this.wrongAnswersByOperation[operation][
        levelKey
      ].find((w) => w.question === questionText);

      if (wrongAnswer && !wrongAnswer.learned) {
        wrongAnswer.learned = true;
        wrongAnswer.retryCount++;
        wrongAnswer.correctAttempts = (wrongAnswer.correctAttempts || 0) + 1;
        wrongAnswer.totalAttempts = wrongAnswer.totalAttempts || 1;

        // Calculate accuracy for this specific question
        const accuracy = Math.round(
          (wrongAnswer.correctAttempts / wrongAnswer.totalAttempts) * 100
        );

        markedCount++;
        console.log(
          `✅ ${operation} marked as learned in ${levelKey}: ${wrongAnswer.question} (accuracy: ${accuracy}%, attempts: ${wrongAnswer.totalAttempts})`
        );
      }
    });

    if (markedCount > 0) {
      this.saveAllWrongAnswers();
      console.log(
        `📚 Total marked as learned: ${markedCount} instances of "${questionText}"`
      );
    }

    return markedCount;
  }

  /**
   * Get unlearned wrong answers for a level and operation
   */
  getUnlearnedWrongAnswers(level, operation = null) {
    const levelKey = `level_${level}`;
    let unlearnedAnswers = [];

    if (operation && operation !== GAME_CONFIG.OPERATIONS.COMBINED) {
      // Get unlearned wrong answers for specific operation
      if (
        this.wrongAnswersByOperation[operation] &&
        this.wrongAnswersByOperation[operation][levelKey]
      ) {
        unlearnedAnswers = this.wrongAnswersByOperation[operation][levelKey]
          .filter((w) => !w.learned)
          .sort((a, b) => b.timestamp - a.timestamp);
      }

      // For non-daily challenge levels, also include level_0 questions that match this table
      if (
        level !== 0 &&
        this.wrongAnswersByOperation[operation] &&
        this.wrongAnswersByOperation[operation]["level_0"]
      ) {
        const dailyChallengeQuestions = this.wrongAnswersByOperation[operation][
          "level_0"
        ]
          .filter((w) => !w.learned && (w.num1 === level || w.num2 === level))
          .sort((a, b) => b.timestamp - a.timestamp);

        unlearnedAnswers = [...unlearnedAnswers, ...dailyChallengeQuestions];
      }
    } else {
      // Combined operation or legacy - get from all operations
      Object.keys(this.wrongAnswersByOperation).forEach((op) => {
        if (this.wrongAnswersByOperation[op][levelKey]) {
          const opUnlearned = this.wrongAnswersByOperation[op][levelKey]
            .filter((w) => !w.learned)
            .sort((a, b) => b.timestamp - a.timestamp);
          unlearnedAnswers.push(...opUnlearned);
        }

        // Include level_0 questions for non-daily challenge levels
        if (level !== 0 && this.wrongAnswersByOperation[op]["level_0"]) {
          const dailyChallengeQuestions = this.wrongAnswersByOperation[op][
            "level_0"
          ]
            .filter((w) => !w.learned && (w.num1 === level || w.num2 === level))
            .sort((a, b) => b.timestamp - a.timestamp);
          unlearnedAnswers.push(...dailyChallengeQuestions);
        }
      });
    }

    return unlearnedAnswers.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all wrong answers for daily challenge mix (from all levels 0-10) for specific operation or combined
   */
  getAllUnlearnedWrongAnswers(operation = null) {
    const allWrong = [];

    if (operation && operation !== GAME_CONFIG.OPERATIONS.COMBINED) {
      // Get unlearned wrong answers from specific operation only
      if (this.wrongAnswersByOperation[operation]) {
        for (let level = 0; level <= 10; level++) {
          const levelKey = `level_${level}`;
          if (this.wrongAnswersByOperation[operation][levelKey]) {
            const levelWrong = this.wrongAnswersByOperation[operation][
              levelKey
            ].filter((w) => !w.learned);
            allWrong.push(...levelWrong);
          }
        }
      }
    } else {
      // Combined operation - get from all operations
      Object.keys(this.wrongAnswersByOperation).forEach((op) => {
        if (this.wrongAnswersByOperation[op]) {
          for (let level = 0; level <= 10; level++) {
            const levelKey = `level_${level}`;
            if (this.wrongAnswersByOperation[op][levelKey]) {
              const levelWrong = this.wrongAnswersByOperation[op][
                levelKey
              ].filter((w) => !w.learned);
              allWrong.push(...levelWrong);
            }
          }
        }
      });
    }

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
   * Track daily challenge run completion
   */
  trackDailyChallengeRun(gameStats) {
    const today = new Date().toDateString();

    // Increment today's run count
    this.detailedStats.dailyChallengeToday++;

    // Calculate mistakes count
    const mistakes = gameStats.questionsAnswered - gameStats.correctAnswers;

    // Create run record
    const runRecord = {
      date: today,
      runNumber: this.detailedStats.dailyChallengeToday,
      score: gameStats.score,
      mistakes: mistakes,
      accuracy: gameStats.accuracy,
      completedTime: new Date().toISOString(),
      questionsAnswered: gameStats.questionsAnswered,
      correctAnswers: gameStats.correctAnswers,
      maxStreak: gameStats.maxStreak,
    };

    // Add to runs history
    this.detailedStats.dailyChallengeRuns.push(runRecord);

    // Limit history to last 100 runs to prevent excessive storage
    if (this.detailedStats.dailyChallengeRuns.length > 100) {
      this.detailedStats.dailyChallengeRuns =
        this.detailedStats.dailyChallengeRuns
          .sort((a, b) => new Date(b.completedTime) - new Date(a.completedTime))
          .slice(0, 100);
    }

    this.saveDetailedStats();

    console.log(
      `📊 Daily challenge run tracked: ${runRecord.runNumber} today, Score: ${runRecord.score}, Mistakes: ${runRecord.mistakes}`
    );

    return runRecord;
  }

  /**
   * Get today's daily challenge statistics
   */
  getTodayDailyChallengeStats() {
    const today = new Date().toDateString();
    const todayRuns = this.detailedStats.dailyChallengeRuns.filter(
      (run) => run.date === today
    );

    if (todayRuns.length === 0) {
      return {
        runsToday: 0,
        bestScore: 0,
        totalMistakes: 0,
        averageAccuracy: 0,
      };
    }

    const bestScore = Math.max(...todayRuns.map((run) => run.score));
    const totalMistakes = todayRuns.reduce((sum, run) => sum + run.mistakes, 0);
    const averageAccuracy = Math.round(
      todayRuns.reduce((sum, run) => sum + run.accuracy, 0) / todayRuns.length
    );

    return {
      runsToday: todayRuns.length,
      bestScore,
      totalMistakes,
      averageAccuracy,
    };
  }

  /**
   * Reset daily challenge run counter (called at start of new day)
   */
  resetDailyRuns() {
    const today = new Date().toDateString();
    const lastRunDate =
      this.detailedStats.dailyChallengeRuns.length > 0
        ? this.detailedStats.dailyChallengeRuns[
            this.detailedStats.dailyChallengeRuns.length - 1
          ].date
        : null;

    if (lastRunDate !== today) {
      this.detailedStats.dailyChallengeToday = 0;
      this.saveDetailedStats();
    }
  }

  /**
   * Clean up when app closes
   */
  cleanup() {
    this.endSession();
    this.stopPlaytimeTracking();
  }
}
