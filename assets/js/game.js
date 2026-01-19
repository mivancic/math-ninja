/**
 * Math Ninja - Game Engine
 * @fileoverview Core game mechanics, question generation, and scoring
 */

import { GAME_CONFIG, FEEDBACK_TYPES, LEVELS_BY_OPERATION } from "./config.js";
import { Generators } from "./domain/generators.js";
import { OPS } from "./domain/question.js";
import { createReviewQuestion } from "./domain/review.js";

export class GameEngine {
  constructor() {
    this.reset();
  }

  /**
   * Reset game state to initial values
   */
  reset() {
    this.currentLevelId = null;
    this.currentOp = null;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.strikes = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.currentQuestion = null;
    this.isGameActive = false;
    this.questionHistory = [];
    this.reviewQueue = []; // Persistent review items (long term)
    this.immediateRetryQueue = []; // Immediate re-serve of wrong answers
    this.isReviewActive = false;
    this.unlockedLevels = []; // For Mixed Mode (Op specific)

    // Mixed mode support
    this.isMixedMode = false;
  }

  /**
   * Start a new game
   * @param {string} op - Operation (add, sub, mul, div) or 'mixed'
   * @param {string} levelId - Level ID or 'mixed'
   * @param {Array} reviewQuestions - Optional array of unlearned wrong answers
   * @param {Array} unlockedLevels - Optional list of unlocked level IDs (for mixed mode)
   */
  startGame(op, levelId, reviewQuestions = [], unlockedLevels = []) {
    this.reset();
    this.unlockedLevels = unlockedLevels;

    if (op === 'mixed' || levelId === 'mixed') {
        this.isMixedMode = true;
        this.currentOp = (op === 'mixed') ? 'mixed' : op; // Keep op if specific (e.g. 'add' mixed)
        this.currentLevelId = 'mixed';
    } else {
        this.currentOp = op;
        this.currentLevelId = levelId;
    }

    this.isGameActive = true;
    this.reviewQueue = reviewQuestions;

    console.log(
      `🎮 Starting game: ${this.currentOp} - ${this.currentLevelId} (Mixed: ${this.isMixedMode}) with ${this.reviewQueue.length} review items`
    );

    return this.generateQuestion();
  }

  /**
   * Restore game from saved state
   */
  restoreGame(state) {
      this.reset();
      this.currentOp = state.op;
      this.currentLevelId = state.levelId;
      this.score = state.score;
      this.streak = state.streak;
      this.strikes = state.strikes;
      this.questionsAnswered = state.questionsAnswered;
      this.correctAnswers = state.correctAnswers;
      this.reviewQueue = state.reviewQueue || [];
      this.immediateRetryQueue = state.immediateRetryQueue || [];
      this.isMixedMode = state.isMixedMode || false;
      this.unlockedLevels = state.unlockedLevels || [];
      this.isGameActive = true;

      if (state.currentQuestion) {
          this.currentQuestion = state.currentQuestion;
      } else {
          this.generateQuestion();
      }

      console.log("🎮 Game restored");
      return this.currentQuestion;
  }

  /**
   * Generate a new question
   */
  generateQuestion() {
    if (!this.isGameActive) return null;

    // 1. Check Immediate Retry Queue (High Priority)
    // Only serve if streak > 0 (meaning last answer was correct) OR if queue is full?
    // User requirement: "Repeat that wrongly answered question after next correct answer."
    // Also: "Not show same wrongly answered question couple of times in a row."
    // If I answer Wrong, streak is 0. So we skip this block. We serve random Q.
    // If I answer Correct, streak is > 0. We serve Retry.
    if (this.streak > 0 && this.immediateRetryQueue.length > 0) {
        const retryQuestion = this.immediateRetryQueue.shift();
        // Tag as retry to handle logic (maybe no points?)
        retryQuestion.meta = retryQuestion.meta || {};
        retryQuestion.meta.isRetry = true;
        this.currentQuestion = retryQuestion;
        console.log("🔄 Serving immediate retry:", retryQuestion.text);
        return retryQuestion;
    }

    // 2. Check Review Injection (Long Term Learning)
    const shouldReview =
        this.reviewQueue.length > 0 &&
        Math.random() < GAME_CONFIG.REVIEW_CHANCE;

    if (shouldReview) {
        const index = Math.floor(Math.random() * this.reviewQueue.length);
        const reviewRecord = this.reviewQueue[index];

        try {
            const question = createReviewQuestion(reviewRecord);
            this.currentQuestion = question;
            console.log("📚 Review question injected:", question.text);
            return question;
        } catch (e) {
            console.error("Failed to create review question", e);
        }
    }

    // 3. Generate Normal Question
    if (this.isMixedMode) {
        return this.generateMixedQuestion();
    }

    return this.generateRandomQuestion();
  }

  /**
   * Generate Mixed Question
   */
  generateMixedQuestion() {
      let op = this.currentOp;
      let levelConfig;

      // Global Mixed Mode (Daily Challenge Mix) or Op-Specific
      // In both cases, if `unlockedLevels` are provided, we MUST use them.

      if (this.unlockedLevels && this.unlockedLevels.length > 0) {
          // Pick a random Level ID from unlocked levels
          const levelId = this.unlockedLevels[Math.floor(Math.random() * this.unlockedLevels.length)];

          // Decode ID to find Op and Config
          // Format: 'add_L1' or 'mul_T1'
          // We can iterate LEVELS_BY_OPERATION to find it.

          let found = false;
          // Optimization: Infer op from prefix
          if (levelId.startsWith('add')) op = 'add';
          else if (levelId.startsWith('sub')) op = 'sub';
          else if (levelId.startsWith('mul')) op = 'mul';
          else if (levelId.startsWith('div')) op = 'div';

          if (op) {
              const levels = LEVELS_BY_OPERATION[op];
              levelConfig = levels.find(l => l.id === levelId);
              if (levelConfig) found = true;
          }

          // Fallback if ID parsing fails (shouldn't happen)
          if (!found) {
              console.warn("Could not parse mixed level ID:", levelId);
              // Fallback to random
              const ops = Object.values(OPS);
              op = ops[Math.floor(Math.random() * ops.length)];
              const levels = LEVELS_BY_OPERATION[op];
              levelConfig = levels[Math.floor(Math.random() * levels.length)];
          }
      } else {
          // Default Random Logic (if no unlocked list provided - unlikely now)
          if (op === 'mixed') {
              const ops = Object.values(OPS);
              op = ops[Math.floor(Math.random() * ops.length)];
              const levels = LEVELS_BY_OPERATION[op];
              levelConfig = levels[Math.floor(Math.random() * levels.length)];
          } else {
              // Should have been filtered in startGame, but fallback just in case
              const levels = LEVELS_BY_OPERATION[op];
              levelConfig = levels[Math.floor(Math.random() * levels.length)];
          }
      }

      const generator = Generators[op];
      const question = generator(levelConfig);

      question.meta.isMixed = true;
      this.currentQuestion = question;
      return question;
  }

  /**
   * Generate a random question based on current config
   */
  generateRandomQuestion() {
      const opsLevels = LEVELS_BY_OPERATION[this.currentOp];
      const levelConfig = opsLevels.find(l => l.id === this.currentLevelId);

      if (!levelConfig) return null;

      const generator = Generators[this.currentOp];
      const question = generator(levelConfig);
      this.currentQuestion = question;

      this.questionHistory.push(question.id);
      if (this.questionHistory.length > 5) this.questionHistory.shift();

      return question;
  }

  /**
   * Evaluate the selected answer
   */
  evaluateAnswer(selectedAnswer) {
    if (!this.isGameActive || !this.currentQuestion) return null;

    const isRetry = this.currentQuestion.meta && this.currentQuestion.meta.isRetry;

    // Only increment questionsAnswered if it's NOT a retry (to avoid messing up stats)
    // OR: User wants to enforce it. Maybe we count it but don't give points?
    // Decision: If retry, we don't increment "questionsAnswered" for the *level progress* (10 questions),
    // but we do process it.
    // Actually, "questionsAnswered" tracks progress to completion (10 Qs).
    // If we insert retries, the game becomes longer than 10 Qs. This is desired.
    // So we SHOULD NOT increment questionsAnswered if it is a retry that was just added.
    // Wait, if I answer wrong, it adds a retry.
    // Question 1: Wrong. (Count = 1). Queue Retry.
    // Question 2: Correct. (Count = 2).
    // Question 3 (Retry Q1): Correct. (Count = ?).
    // If we count retry, total Qs = 11.

    // User said: "If we show that questions three times... do not enforce it".
    // "Enforce that questions to be correctly answered."

    // Let's count all attempts as part of the session stats, but for "Level Completion" (10 Qs),
    // maybe we only count "Fresh" questions?
    // Simpler: Just count everything. The level ends when 10 questions are *served and answered*.
    // If retries are added, it effectively extends the level.

    // However, if I fail Q1, and Q1 is re-added. Then I have to answer 11 Qs to finish?
    // Yes, that makes sense for "Enforcement".

    if (!isRetry) {
         this.questionsAnswered++;
    }

    let feedbackType;
    let pointsEarned = 0;
    const isCorrect = selectedAnswer === this.currentQuestion.correct;

    if (isCorrect) {
      if (!isRetry) {
          this.correctAnswers++;
      }
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      pointsEarned = this.calculatePoints(); // Give points even for retries? Maybe reduced?
      if (isRetry) pointsEarned = Math.floor(pointsEarned / 2); // Half points for retries

      this.score += pointsEarned;
      feedbackType = FEEDBACK_TYPES.CORRECT;

    } else {
      this.streak = 0;
      this.strikes++;
      feedbackType = FEEDBACK_TYPES.INCORRECT;

      // IMMEDIATE RETRY LOGIC
      // Add current question to immediate queue
      // We clone it to ensure it's a fresh instance if needed, but same data
      // We want to serve it "after next correct answer".
      // My generateQuestion checks immediateQueue first.
      // So if I answer Wrong, it goes to Queue.
      // Next Q is served. If Correct -> Next is Queue.
      // Perfect.

      // Prevent infinite loop if they keep getting the SAME retry wrong.
      // If it's already a retry, do we add it back? Yes, "Enforce".
      this.immediateRetryQueue.push(this.currentQuestion);
    }

    const isGameComplete =
      this.questionsAnswered >= GAME_CONFIG.QUESTIONS_PER_LEVEL &&
      this.immediateRetryQueue.length === 0; // Don't end if retries pending!

    if (isGameComplete) {
      this.isGameActive = false;
    }

    return {
      feedbackType,
      pointsEarned,
      correctAnswer: this.currentQuestion.correct,
      isGameComplete,
      strikes: this.strikes,
      gameStats: this.getGameStats(),
      isRetry
    };
  }

  calculatePoints() {
      const streakBonus = Math.floor(this.streak / GAME_CONFIG.STREAK_THRESHOLD) * GAME_CONFIG.STREAK_BONUS;
      return GAME_CONFIG.BASE_POINTS + streakBonus;
  }

  getGameStats() {
    // Accuracy calculation: unique questions or total attempts?
    // Standard is Total Correct / Total Attempts.
    // But here questionsAnswered only counts "Fresh" ones?
    // Let's adjust accuracy to be purely (Correct / (QuestionsAnswered + Retries))?
    // Ideally we track totalAttempts separately.
    // For now, simple approximation.

    const accuracy =
      this.questionsAnswered > 0
        ? Math.round((this.correctAnswers / this.questionsAnswered) * 100)
        : 0;

    return {
      op: this.currentOp,
      levelId: this.currentLevelId,
      score: this.score,
      streak: this.streak,
      maxStreak: this.maxStreak,
      strikes: this.strikes,
      questionsAnswered: this.questionsAnswered,
      correctAnswers: this.correctAnswers,
      accuracy,
      isComplete: !this.isGameActive,
      isMixedMode: this.isMixedMode,
      // Current State for saving
      reviewQueue: this.reviewQueue,
      immediateRetryQueue: this.immediateRetryQueue,
      currentQuestion: this.currentQuestion,
      unlockedLevels: this.unlockedLevels
    };
  }

  resetStrikes() {
      this.strikes = 0;
  }
}
