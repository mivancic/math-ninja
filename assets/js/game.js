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
    this.reviewQueue = [];
    this.isReviewActive = false;

    // Mixed mode support
    this.isMixedMode = false;
  }

  /**
   * Start a new game
   * @param {string} op - Operation (add, sub, mul, div) or 'mixed'
   * @param {string} levelId - Level ID or 'mixed'
   * @param {Array} reviewQuestions - Optional array of unlearned wrong answers
   */
  startGame(op, levelId, reviewQuestions = []) {
    this.reset();

    if (op === 'mixed' || levelId === 'mixed') {
        this.isMixedMode = true;
        this.currentOp = 'mixed';
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
      this.isMixedMode = state.isMixedMode || false;
      this.isGameActive = true;

      // We don't restore the EXACT current question object usually unless we serialized it fully.
      // Ideally caller calls generateQuestion immediately after restore if currentQuestion is null.
      // But if we want to resume exactly at the question:
      if (state.currentQuestion) {
          this.currentQuestion = state.currentQuestion;
      } else {
          // If no question saved, generate one
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

    // Check review injection
    const shouldReview =
        this.reviewQueue.length > 0 &&
        Math.random() < GAME_CONFIG.REVIEW_CHANCE;

    if (shouldReview) {
        // Pick random review item
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

    if (this.isMixedMode) {
        return this.generateMixedQuestion();
    }

    // Standard Generation
    return this.generateRandomQuestion();
  }

  /**
   * Generate Mixed Question
   */
  generateMixedQuestion() {
      // Pick random op
      const ops = Object.values(OPS);
      const op = ops[Math.floor(Math.random() * ops.length)];

      // Pick random level config for that op
      // Simplified: Just pick a random level from 1 to 4 (or available)
      const levels = LEVELS_BY_OPERATION[op];
      const levelConfig = levels[Math.floor(Math.random() * levels.length)];

      const generator = Generators[op];
      const question = generator(levelConfig);

      // Tag it as mixed
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

    this.questionsAnswered++;
    let feedbackType;
    let pointsEarned = 0;
    const isCorrect = selectedAnswer === this.currentQuestion.correct;

    if (isCorrect) {
      this.correctAnswers++;
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      pointsEarned = this.calculatePoints();
      this.score += pointsEarned;
      feedbackType = FEEDBACK_TYPES.CORRECT;

    } else {
      this.streak = 0;
      this.strikes++;
      feedbackType = FEEDBACK_TYPES.INCORRECT;
    }

    const isGameComplete =
      this.questionsAnswered >= GAME_CONFIG.QUESTIONS_PER_LEVEL;

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
    };
  }

  calculatePoints() {
      const streakBonus = Math.floor(this.streak / GAME_CONFIG.STREAK_THRESHOLD) * GAME_CONFIG.STREAK_BONUS;
      return GAME_CONFIG.BASE_POINTS + streakBonus;
  }

  getGameStats() {
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
      currentQuestion: this.currentQuestion
    };
  }

  resetStrikes() {
      this.strikes = 0;
  }
}
