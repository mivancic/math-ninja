/**
 * Math Ninja - Statistics Manager
 * @fileoverview Advanced statistics tracking for detailed game analytics
 */

import { GAME_CONFIG, FEEDBACK_TYPES, LEVELS_BY_OPERATION } from "./config.js";

export class StatisticsManager {
  constructor() {
    this.currentSessionStart = null;
    this.playtimeInterval = null;
    this.wrongAnswers = this.loadWrongAnswers();
    this.detailedStats = this.loadDetailedStats();

    // Migrations
    this.migrateData();

    // Start session tracking
    this.startSession();
  }

  /**
   * Migrate old data to new format
   */
  migrateData() {
    // Migrate wrong answers
    let migrated = false;
    Object.keys(this.wrongAnswers).forEach(key => {
        // Old keys were "level_1", "level_10" etc. (multiplication only)
        if (key.startsWith('level_')) {
           const levelNum = key.split('_')[1];
           // New format expects keys like "mul_T1"
           // Old level 1 (Tablica 1) -> mul_T1
           const newKey = `mul_T${levelNum}`;

           if (!this.wrongAnswers[newKey]) {
               this.wrongAnswers[newKey] = this.wrongAnswers[key].map(item => {
                   // Ensure item has op and levelId
                   if (!item.op) {
                       item.op = 'mul';
                       item.levelId = newKey;
                       // Old item structure: { question: "2 x 3", num1: 2, num2: 3, ... }
                       // New canonical needs: op, a, b, ...
                       // We can map num1->a, num2->b
                       item.a = item.num1;
                       item.b = item.num2;
                       item.questionText = item.question;
                   }
                   return item;
               });
               delete this.wrongAnswers[key];
               migrated = true;
           }
        }
    });

    if (migrated) {
        console.log("🔄 Migrated wrong answers to V2 format");
        this.saveWrongAnswers();
    }
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
      playerName: null, // New: Player Name
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

      // Saved active games for "Resume" functionality
      activeGames: {}, // { 'add': gameState, 'mul': gameState... }

      // V2 Stats
      opsProgress: {
          add: {}, // levelId -> { stars: 0, completed: false, bestScore: 0 }
          sub: {},
          mul: {},
          div: {}
      },
      badges: [] // Awarded badge IDs
    };
  }

  /**
   * Load wrong answers tracking from localStorage
   */
  loadWrongAnswers() {
    try {
      const saved = localStorage.getItem(GAME_CONFIG.WRONG_ANSWERS_KEY);
      if (saved) {
        return JSON.parse(saved);
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
    this.resetDailyRuns();

    const today = new Date().toDateString();
    if (!this.detailedStats.dailyLaunches[today]) {
      this.detailedStats.dailyLaunches[today] = 0;
    }
    this.detailedStats.dailyLaunches[today]++;
    this.detailedStats.sessionCount++;

    this.startPlaytimeTracking();
    this.saveDetailedStats();
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

      this.detailedStats.averageSessionLength =
        this.detailedStats.totalPlaytimeMinutes /
        this.detailedStats.sessionCount;

      this.stopPlaytimeTracking();
      this.saveDetailedStats();
    }
  }

  /**
   * Start playtime tracking interval
   */
  startPlaytimeTracking() {
    this.stopPlaytimeTracking();
    this.playtimeInterval = setInterval(() => {
      const today = new Date().toDateString();
      const minutesToAdd = GAME_CONFIG.PLAYTIME_UPDATE_INTERVAL / 1000 / 60;

      if (!this.detailedStats.dailyPlaytime[today]) {
        this.detailedStats.dailyPlaytime[today] = 0;
      }
      this.detailedStats.dailyPlaytime[today] += minutesToAdd;
      this.detailedStats.totalPlaytimeMinutes += minutesToAdd;

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

  // Player Name Management
  setPlayerName(name) {
      this.detailedStats.playerName = name;
      this.saveDetailedStats();
  }

  getPlayerName() {
      return this.detailedStats.playerName;
  }

  /**
   * Track daily challenge completion
   */
  trackDailyChallenge() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (this.detailedStats.lastDailyChallengeDate === today) {
      return;
    }

    if (!this.detailedStats.dailyChallengeHistory.includes(today)) {
      this.detailedStats.dailyChallengeHistory.push(today);
    }

    if (this.detailedStats.lastDailyChallengeDate === yesterday) {
      this.detailedStats.dailyChallengeStreak++;
    } else {
      this.detailedStats.dailyChallengeStreak = 1;
    }

    if (
      this.detailedStats.dailyChallengeStreak >
      this.detailedStats.longestDailyStreak
    ) {
      this.detailedStats.longestDailyStreak =
        this.detailedStats.dailyChallengeStreak;
    }

    this.detailedStats.lastDailyChallengeDate = today;
    this.saveDetailedStats();
  }

  /**
   * Calculate daily streak
   */
  calculateDailyStreak() {
      // Logic to check if streak is active (today or yesterday played)
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

      if (this.detailedStats.lastDailyChallengeDate === today ||
          this.detailedStats.lastDailyChallengeDate === yesterday) {
          return this.detailedStats.dailyChallengeStreak;
      }
      return 0;
  }


  /**
   * Track a wrong answer for learning system (V2: Canonical format)
   * With ENHANCED learning tracking (consecutive successes needed)
   */
  trackWrongAnswer(question, wrongAnswer) {
    const { op, meta, a, b } = question;
    const levelId = meta.levelId || 'unknown';
    const key = levelId;

    if (!this.wrongAnswers[key]) {
      this.wrongAnswers[key] = [];
    }

    const existing = this.wrongAnswers[key].find(
      (w) => w.op === op && w.a === a && w.b === b
    );

    if (existing) {
      if (!existing.allWrongAnswers) {
        existing.allWrongAnswers = [existing.wrongAnswer].filter(x => x !== undefined);
      }
      existing.allWrongAnswers.push(wrongAnswer);

      existing.wrongAnswer = wrongAnswer;
      existing.timestamp = Date.now();

      // Reset learning progress
      existing.learned = false;
      existing.consecutiveCorrect = 0; // Reset consecutive correct answers

      existing.totalAttempts = (existing.totalAttempts || 0) + 1;

    } else {
      const wrongData = {
        op,
        levelId,
        a,
        b,
        questionText: question.text,
        correctAnswer: question.correct,
        wrongAnswer,
        allWrongAnswers: [wrongAnswer],
        timestamp: Date.now(),
        retryCount: 0,
        learned: false,
        consecutiveCorrect: 0, // New: Tracking consecutive correct answers
        totalAttempts: 1,
        correctAttempts: 0,
      };

      this.wrongAnswers[key].push(wrongData);
    }

    if (this.wrongAnswers[key].length > GAME_CONFIG.MAX_WRONG_ANSWERS_TRACKED) {
      this.wrongAnswers[key] = this.wrongAnswers[key]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, GAME_CONFIG.MAX_WRONG_ANSWERS_TRACKED);
    }

    this.saveWrongAnswers();
  }

  /**
   * Mark a wrong answer as learned (or progress towards learning)
   */
  markAsLearned(question) {
    const { op, a, b } = question;
    let markedCount = 0;

    // Config: How many times to answer correctly to be "learned"?
    const REQUIRED_CONSECUTIVE = 3; // Updated to 3 based on user request

    Object.keys(this.wrongAnswers).forEach((key) => {
      const wrongAnswer = this.wrongAnswers[key].find(
        (w) => w.op === op && w.a === a && w.b === b
      );

      if (wrongAnswer && !wrongAnswer.learned) {
        wrongAnswer.correctAttempts = (wrongAnswer.correctAttempts || 0) + 1;
        wrongAnswer.consecutiveCorrect = (wrongAnswer.consecutiveCorrect || 0) + 1;

        // Mark as learned ONLY if threshold met
        if (wrongAnswer.consecutiveCorrect >= REQUIRED_CONSECUTIVE) {
             wrongAnswer.learned = true;
             markedCount++;
        }
      }
    });

    if (markedCount > 0) {
      this.saveWrongAnswers();
      console.log(`📚 Marked as learned (mastered): ${question.text}`);
    } else {
       // Save progress
       this.saveWrongAnswers();
    }
  }

  getUnlearnedWrongAnswers(levelId) {
    if (this.wrongAnswers[levelId]) {
      return this.wrongAnswers[levelId]
        .filter((w) => !w.learned)
        .sort((a, b) => b.timestamp - a.timestamp);
    }
    return [];
  }

  getAllUnlearnedWrongAnswers() {
      let all = [];
      Object.keys(this.wrongAnswers).forEach(key => {
          all = all.concat(this.getUnlearnedWrongAnswers(key));
      });
      return all;
  }

  updateLevelProgress(op, levelId, stars, score) {
      if (!this.detailedStats.opsProgress[op]) {
          this.detailedStats.opsProgress[op] = {};
      }

      const current = this.detailedStats.opsProgress[op][levelId] || { stars: 0, completed: false, bestScore: 0 };

      if (stars > current.stars) current.stars = stars;
      if (score > current.bestScore) current.bestScore = score;
      if (stars > 0) current.completed = true;

      this.detailedStats.opsProgress[op][levelId] = current;
      this.saveDetailedStats();
  }

  /**
   * Check if level is unlocked
   */
  isLevelUnlocked(op, levelId) {
      const levels = LEVELS_BY_OPERATION[op];
      const index = levels.findIndex(l => l.id === levelId);

      // First level is always unlocked
      if (index <= 0) return true;

      // Check if previous level has at least 1 star
      const prevLevelId = levels[index - 1].id;
      const prevStats = this.detailedStats.opsProgress[op][prevLevelId];

      return prevStats && prevStats.stars >= 1;
  }

  /**
   * Get total stars for an operation
   */
  getStarsForOp(op) {
      let stars = 0;
      if (this.detailedStats.opsProgress[op]) {
          Object.values(this.detailedStats.opsProgress[op]).forEach(s => stars += s.stars);
      }
      return stars;
  }

  // Game State Saving (Resume)
  saveGameState(op, state) {
      if (!this.detailedStats.activeGames) this.detailedStats.activeGames = {};
      this.detailedStats.activeGames[op] = state;
      this.saveDetailedStats();
  }

  loadGameState(op) {
      if (!this.detailedStats.activeGames) return null;
      return this.detailedStats.activeGames[op];
  }

  clearGameState(op) {
      if (this.detailedStats.activeGames && this.detailedStats.activeGames[op]) {
          delete this.detailedStats.activeGames[op];
          this.saveDetailedStats();
      }
  }

  // ... (Other existing methods: getTodayPlaytime, getTodayLaunches, trackDailyChallengeRun, etc.)

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
