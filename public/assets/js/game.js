/**
 * Math Ninja - Game Engine
 * @fileoverview Core game mechanics, question generation, and scoring
 */

import { GAME_CONFIG, FEEDBACK_TYPES } from "./config.js";

export class GameEngine {
  constructor() {
    this.reset();
  }

  /**
   * Reset game state to initial values
   */
  reset() {
    this.currentLevel = 1;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.currentAnswer = 0;
    this.timerInterval = null;
    this.timeLimit = GAME_CONFIG.TIMER_DURATION;
    this.isGameActive = false;
    this.usedQuestions = new Set(); // Track used questions to prevent immediate duplicates
    this.questionHistory = []; // Keep history of recent questions
    this.currentSessionWrongAnswers = []; // Track wrong answers from current session only
    this.unlearnedWrongAnswers = []; // Store unlearned wrong answers for this level
    this.wrongAnswersUsed = new Set(); // Track which wrong answers we've already used
    this.currentQuestionData = null; // Store current question with all metadata
  }

  /**
   * Start a new game with specified level
   * @param {number} level - Game level (1-10, or 0 for daily challenge)
   * @param {Array} unlearnedWrongAnswers - Optional array of unlearned wrong answers for this level
   */
  startGame(level, unlearnedWrongAnswers = []) {
    this.reset();
    this.currentLevel = level;
    this.timeLimit =
      level === 0
        ? GAME_CONFIG.DAILY_CHALLENGE_TIMER
        : GAME_CONFIG.TIMER_DURATION;
    this.isGameActive = true;

    // Store unlearned wrong answers for integration into gameplay
    this.unlearnedWrongAnswers = unlearnedWrongAnswers || [];

    console.log(
      `🎮 Starting level ${level} with ${this.unlearnedWrongAnswers.length} unlearned wrong answers to review`
    );

    // Track today's play session
    this.trackDailyPlay();

    return this.generateQuestion();
  }

  /**
   * Generate a new multiplication question
   * @returns {Object} Question data with numbers and correct answer
   */
  generateQuestion() {
    if (!this.isGameActive) return null;

    // 40% chance to use unlearned wrong answer if available and not all used
    const shouldUseWrongAnswer =
      this.unlearnedWrongAnswers.length > 0 &&
      this.wrongAnswersUsed.size < this.unlearnedWrongAnswers.length &&
      Math.random() < 0.4;

    if (shouldUseWrongAnswer) {
      return this.generateWrongAnswerQuestion();
    } else {
      return this.generateRandomQuestion();
    }
  }

  /**
   * Generate a question from unlearned wrong answers
   * @returns {Object} Question data from wrong answer
   */
  generateWrongAnswerQuestion() {
    // Find an unlearned wrong answer we haven't used yet
    const availableWrongAnswers = this.unlearnedWrongAnswers.filter(
      (wrongAnswer) => {
        const key = `${wrongAnswer.num1}x${wrongAnswer.num2}`;
        return (
          !this.wrongAnswersUsed.has(key) && !this.questionHistory.includes(key)
        );
      }
    );

    if (availableWrongAnswers.length === 0) {
      // No available wrong answers, generate random question
      return this.generateRandomQuestion();
    }

    // Pick a random wrong answer from available ones
    const wrongAnswer =
      availableWrongAnswers[
        Math.floor(Math.random() * availableWrongAnswers.length)
      ];
    const questionKey = `${wrongAnswer.num1}x${wrongAnswer.num2}`;

    // Mark as used
    this.wrongAnswersUsed.add(questionKey);

    // Set current answer
    this.currentAnswer = wrongAnswer.num1 * wrongAnswer.num2;

    // Add to question history (keep last 3-4 questions to prevent immediate repeats)
    this.questionHistory.push(questionKey);
    if (this.questionHistory.length > 4) {
      this.questionHistory.shift(); // Remove oldest
    }

    console.log(
      `📚 Presenting unlearned wrong answer: ${wrongAnswer.num1} × ${wrongAnswer.num2}`
    );

    const questionData = {
      num1: wrongAnswer.num1,
      num2: wrongAnswer.num2,
      correctAnswer: this.currentAnswer,
      answers: this.generateAnswerOptions(),
      isFromWrongAnswers: true, // Flag to identify this as a review question
    };

    // Store current question data
    this.currentQuestionData = questionData;

    return questionData;
  }

  /**
   * Generate a random multiplication question
   * @returns {Object} Question data with numbers and correct answer
   */
  generateRandomQuestion() {
    let num1, num2, questionKey;
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite loops

    do {
      num1 =
        this.currentLevel === 0
          ? Math.floor(Math.random() * GAME_CONFIG.MAX_LEVEL) + 1
          : this.currentLevel;

      num2 = Math.floor(Math.random() * GAME_CONFIG.MAX_LEVEL) + 1;
      questionKey = `${num1}x${num2}`;
      attempts++;

      // If we've tried many times, clear recent history to avoid being stuck
      if (attempts > maxAttempts / 2) {
        this.questionHistory = this.questionHistory.slice(-2); // Keep only last 2
      }
    } while (
      this.questionHistory.includes(questionKey) &&
      attempts < maxAttempts
    );

    this.currentAnswer = num1 * num2;

    // Add to question history (keep last 3-4 questions to prevent immediate repeats)
    this.questionHistory.push(questionKey);
    if (this.questionHistory.length > 4) {
      this.questionHistory.shift(); // Remove oldest
    }

    const questionData = {
      num1,
      num2,
      correctAnswer: this.currentAnswer,
      answers: this.generateAnswerOptions(),
      isFromWrongAnswers: false,
    };

    // Store current question data
    this.currentQuestionData = questionData;

    return questionData;
  }

  /**
   * Generate answer options (1 correct + 3 incorrect)
   * @returns {Array} Array of 4 answer options, shuffled
   */
  generateAnswerOptions() {
    const answers = [this.currentAnswer];

    while (answers.length < 4) {
      let wrongAnswer;
      const variation = Math.floor(Math.random() * 3);

      switch (variation) {
        case 0:
          // Plus/minus variation
          wrongAnswer =
            this.currentAnswer +
            (Math.random() > 0.5 ? 1 : -1) *
              (Math.floor(Math.random() * GAME_CONFIG.ANSWER_VARIATION_RANGE) +
                1);
          break;
        case 1:
          // Different multiplicand variation
          const divisor =
            Math.floor(this.currentAnswer / (this.currentLevel || 1)) || 1;
          wrongAnswer =
            (this.currentLevel || 1) *
            (divisor + (Math.random() > 0.5 ? 1 : -1));
          break;
        case 2:
          // Random within range variation
          wrongAnswer =
            Math.floor(Math.random() * (this.currentAnswer * 2)) + 1;
          break;
      }

      if (wrongAnswer > 0 && !answers.includes(wrongAnswer)) {
        answers.push(wrongAnswer);
      }
    }

    // Shuffle answers
    return answers.sort(() => Math.random() - 0.5);
  }

  /**
   * Evaluate the selected answer
   * @param {number} selectedAnswer - The answer chosen by the user
   * @returns {Object} Result with feedback type, points earned, and game state
   */
  evaluateAnswer(selectedAnswer) {
    if (!this.isGameActive) return null;

    this.questionsAnswered++;
    let feedbackType;
    let pointsEarned = 0;

    if (selectedAnswer === this.currentAnswer) {
      this.correctAnswers++;
      this.streak++;
      if (this.streak > this.maxStreak) {
        this.maxStreak = this.streak;
      }

      pointsEarned = this.calculatePoints();
      this.score += pointsEarned;
      feedbackType = FEEDBACK_TYPES.CORRECT;
    } else {
      this.streak = 0;
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
      correctAnswer: this.currentAnswer,
      isGameComplete,
      gameStats: this.getGameStats(),
    };
  }

  /**
   * Handle timeout scenario
   * @returns {Object} Result with timeout feedback and game state
   */
  handleTimeout() {
    return this.evaluateAnswer(-1); // Invalid answer triggers incorrect logic
  }

  /**
   * Calculate points for current answer including streak bonus
   * @returns {number} Points earned for this answer
   */
  calculatePoints() {
    const streakBonus =
      Math.floor(this.streak / GAME_CONFIG.STREAK_THRESHOLD) *
      GAME_CONFIG.STREAK_BONUS;
    return GAME_CONFIG.BASE_POINTS + streakBonus;
  }

  /**
   * Track wrong answer in current session
   * @param {Object} question - Question data
   * @param {number} wrongAnswer - Wrong answer provided
   * @param {number} correctAnswer - Correct answer
   */
  trackCurrentSessionWrongAnswer(question, wrongAnswer, correctAnswer) {
    const wrongData = {
      question: `${question.num1} × ${question.num2}`,
      num1: question.num1,
      num2: question.num2,
      wrongAnswer,
      correctAnswer,
      timestamp: Date.now(),
    };

    this.currentSessionWrongAnswers.push(wrongData);
    console.log(
      `📝 Current session wrong answer tracked: ${wrongData.question}`
    );
  }

  /**
   * Get current session wrong answers
   * @returns {Array} Array of wrong answers from current session
   */
  getCurrentSessionWrongAnswers() {
    return this.currentSessionWrongAnswers || [];
  }

  /**
   * Remove a wrong answer from current session (when successfully resolved via retry)
   * @param {number} num1 - First number
   * @param {number} num2 - Second number
   */
  removeCurrentSessionWrongAnswer(num1, num2) {
    this.currentSessionWrongAnswers = this.currentSessionWrongAnswers.filter(
      (wrongAnswer) => !(wrongAnswer.num1 === num1 && wrongAnswer.num2 === num2)
    );

    console.log(
      `✅ Removed resolved wrong answer from current session: ${num1} × ${num2}`
    );
  }

  /**
   * Get current game statistics
   * @returns {Object} Current game stats
   */
  getGameStats() {
    const accuracy =
      this.questionsAnswered > 0
        ? Math.round((this.correctAnswers / this.questionsAnswered) * 100)
        : 0;

    return {
      level: this.currentLevel,
      score: this.score,
      streak: this.streak,
      maxStreak: this.maxStreak,
      questionsAnswered: this.questionsAnswered,
      correctAnswers: this.correctAnswers,
      accuracy,
      isComplete: this.questionsAnswered >= GAME_CONFIG.QUESTIONS_PER_LEVEL,
    };
  }

  /**
   * Check if level is completed with star rating
   * @returns {boolean} True if level completed with 80%+ accuracy
   */
  isLevelCompleted() {
    const stats = this.getGameStats();
    return stats.accuracy >= GAME_CONFIG.ACCURACY_THRESHOLD;
  }

  /**
   * Track today's play session for streak counting
   */
  trackDailyPlay() {
    // This will be handled by StatsManager, but we mark the session
    this.sessionDate = new Date().toDateString();
  }

  /**
   * Get timer configuration for current level
   * @returns {number} Timer duration in milliseconds
   */
  getTimerDuration() {
    return this.timeLimit;
  }

  /**
   * Get current question data (for pause/resume)
   * @returns {Object|null} Current question data
   */
  getCurrentQuestion() {
    if (!this.isGameActive || this.currentAnswer === 0) return null;

    // Return stored current question if available
    if (this.currentQuestionData) {
      return this.currentQuestionData;
    }

    // Try to reconstruct the question from current answer
    let bestMatch = null;

    // For regular levels, we know num1 is the level
    if (this.currentLevel !== 0) {
      const num2 = Math.floor(this.currentAnswer / this.currentLevel);
      if (this.currentLevel * num2 === this.currentAnswer) {
        bestMatch = {
          num1: this.currentLevel,
          num2: num2,
          correctAnswer: this.currentAnswer,
          isFromWrongAnswers: false,
        };
      }
    } else {
      // For daily challenge, find any valid combination
      for (let num1 = 1; num1 <= GAME_CONFIG.MAX_LEVEL; num1++) {
        const num2 = Math.floor(this.currentAnswer / num1);
        if (
          num1 * num2 === this.currentAnswer &&
          num2 <= GAME_CONFIG.MAX_LEVEL
        ) {
          bestMatch = {
            num1: num1,
            num2: num2,
            correctAnswer: this.currentAnswer,
            isFromWrongAnswers: false,
          };
          break;
        }
      }
    }

    return (
      bestMatch || {
        num1: this.currentLevel || 1,
        num2: 1,
        correctAnswer: this.currentAnswer,
        isFromWrongAnswers: false,
      }
    );
  }

  /**
   * Get remaining questions in current game
   * @returns {number} Number of questions remaining
   */
  getQuestionsRemaining() {
    return Math.max(
      0,
      GAME_CONFIG.QUESTIONS_PER_LEVEL - this.questionsAnswered
    );
  }

  /**
   * Restore game state from paused data
   * @param {Object} pausedState - Saved game state
   */
  restoreGameState(pausedState) {
    this.currentLevel = pausedState.level;
    this.score = pausedState.gameStats.score;
    this.streak = pausedState.gameStats.streak;
    this.maxStreak = pausedState.gameStats.maxStreak;
    this.questionsAnswered = pausedState.gameStats.questionsAnswered;
    this.correctAnswers = pausedState.gameStats.correctAnswers;
    this.timeLimit =
      pausedState.level === 0
        ? GAME_CONFIG.DAILY_CHALLENGE_TIMER
        : GAME_CONFIG.TIMER_DURATION;
    this.isGameActive = true;

    // Restore unlearned wrong answers if available
    this.unlearnedWrongAnswers = pausedState.unlearnedWrongAnswers || [];
    this.wrongAnswersUsed = new Set(pausedState.wrongAnswersUsed || []);

    // Set current answer for the current question
    if (pausedState.currentQuestion) {
      this.currentAnswer = pausedState.currentQuestion.correctAnswer;
      this.currentQuestionData = pausedState.currentQuestion;
      // Add current question to history to prevent immediate repeat
      const questionKey = `${pausedState.currentQuestion.num1}x${pausedState.currentQuestion.num2}`;
      this.questionHistory = [questionKey];
    }

    console.log("🎮 GameEngine state restored");
  }
}
