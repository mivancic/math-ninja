/**
 * Math Ninja - Operation Manager
 * @fileoverview Manages different mathematical operations and question generation
 */

import { GAME_CONFIG } from "./config.js";

// Define OPERATIONS_CONFIG locally to avoid import issues
const OPERATIONS_CONFIG = {
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
    levels: [1],
  },
};

export class OperationManager {
  constructor() {
    this.currentOperation = GAME_CONFIG.OPERATIONS.MULTIPLICATION;
    this.currentLevel = 1;
  }

  /**
   * Set current operation and level
   * @param {string} operation - Operation type
   * @param {number} level - Level number
   */
  setOperation(operation, level = 1) {
    this.currentOperation = operation;
    this.currentLevel = level;
  }

  /**
   * Get current operation configuration
   * @returns {Object} Operation configuration
   */
  getCurrentOperationConfig() {
    return OPERATIONS_CONFIG[this.currentOperation];
  }

  /**
   * Generate a question based on current operation and level
   * @returns {Object} Question object with question, correct answer, and wrong answers
   */
  generateQuestion() {
    switch (this.currentOperation) {
      case GAME_CONFIG.OPERATIONS.MULTIPLICATION:
        return this.generateMultiplicationQuestion();
      case GAME_CONFIG.OPERATIONS.DIVISION:
        return this.generateDivisionQuestion();
      case GAME_CONFIG.OPERATIONS.ADDITION:
        return this.generateAdditionQuestion();
      case GAME_CONFIG.OPERATIONS.SUBTRACTION:
        return this.generateSubtractionQuestion();
      case GAME_CONFIG.OPERATIONS.COMBINED:
        return this.generateCombinedQuestion();
      default:
        return this.generateMultiplicationQuestion();
    }
  }

  /**
   * Generate multiplication question
   * @returns {Object} Question object
   */
  generateMultiplicationQuestion() {
    const multiplier = this.currentLevel;
    const multiplicand = Math.floor(Math.random() * 10) + 1;
    const correctAnswer = multiplier * multiplicand;

    const question = `${multiplier} × ${multiplicand}`;
    const wrongAnswers = this.generateWrongAnswers(correctAnswer, 3);

    return {
      // For tracking and retry (multiplicative pair)
      num1: multiplier,
      num2: multiplicand,
      question,
      correctAnswer,
      wrongAnswers,
      operation: GAME_CONFIG.OPERATIONS.MULTIPLICATION,
      level: this.currentLevel,
    };
  }

  /**
   * Generate division question
   * @returns {Object} Question object
   */
  generateDivisionQuestion() {
    const divisor = this.currentLevel;
    const quotient = Math.floor(Math.random() * 10) + 1;
    const dividend = divisor * quotient; // Ensure clean division

    const question = `${dividend} ÷ ${divisor}`;
    const correctAnswer = quotient;
    const wrongAnswers = this.generateWrongAnswers(correctAnswer, 3);

    return {
      // Keep explicit division values
      dividend,
      divisor,
      quotient,
      // For tracking and retry, convert to multiplicative pair
      num1: divisor,
      num2: quotient,
      question,
      correctAnswer,
      wrongAnswers,
      operation: GAME_CONFIG.OPERATIONS.DIVISION,
      level: this.currentLevel,
    };
  }

  /**
   * Generate addition question
   * @returns {Object} Question object
   */
  generateAdditionQuestion() {
    const baseNumber = this.currentLevel * 10; // Level 1: 10, Level 2: 20, etc.
    const addend1 = Math.floor(Math.random() * baseNumber) + 1;
    const addend2 = Math.floor(Math.random() * (baseNumber - addend1)) + 1;

    const question = `${addend1} + ${addend2}`;
    const correctAnswer = addend1 + addend2;
    const wrongAnswers = this.generateWrongAnswers(correctAnswer, 3);

    return {
      question,
      correctAnswer,
      wrongAnswers,
      operation: GAME_CONFIG.OPERATIONS.ADDITION,
      level: this.currentLevel,
    };
  }

  /**
   * Generate subtraction question
   * @returns {Object} Question object
   */
  generateSubtractionQuestion() {
    const baseNumber = this.currentLevel * 10; // Level 1: 10, Level 2: 20, etc.
    const minuend = Math.floor(Math.random() * baseNumber) + baseNumber; // Ensure positive result
    const subtrahend = Math.floor(Math.random() * minuend) + 1;

    const question = `${minuend} - ${subtrahend}`;
    const correctAnswer = minuend - subtrahend;
    const wrongAnswers = this.generateWrongAnswers(correctAnswer, 3);

    return {
      question,
      correctAnswer,
      wrongAnswers,
      operation: GAME_CONFIG.OPERATIONS.SUBTRACTION,
      level: this.currentLevel,
    };
  }

  /**
   * Generate combined question (random operation)
   * @returns {Object} Question object
   */
  generateCombinedQuestion() {
    const operations = [
      GAME_CONFIG.OPERATIONS.MULTIPLICATION,
      GAME_CONFIG.OPERATIONS.DIVISION,
      GAME_CONFIG.OPERATIONS.ADDITION,
      GAME_CONFIG.OPERATIONS.SUBTRACTION,
    ];

    const randomOperation =
      operations[Math.floor(Math.random() * operations.length)];
    const randomLevel = Math.floor(Math.random() * 10) + 1;

    // Temporarily set operation and level for question generation
    const originalOperation = this.currentOperation;
    const originalLevel = this.currentLevel;

    this.currentOperation = randomOperation;
    this.currentLevel = randomLevel;

    const question = this.generateQuestion();

    // Restore original operation and level
    this.currentOperation = originalOperation;
    this.currentLevel = originalLevel;

    return question;
  }

  /**
   * Generate wrong answers for a given correct answer
   * @param {number} correctAnswer - Correct answer
   * @param {number} count - Number of wrong answers to generate
   * @returns {Array} Array of wrong answers
   */
  generateWrongAnswers(correctAnswer, count) {
    const wrongAnswers = [];
    const range = Math.max(5, Math.floor(correctAnswer * 0.3)); // 30% of correct answer, minimum 5

    while (wrongAnswers.length < count) {
      const variation = Math.floor(Math.random() * range * 2) - range;
      const wrongAnswer = correctAnswer + variation;

      // Ensure wrong answer is positive and different from correct answer
      if (
        wrongAnswer > 0 &&
        wrongAnswer !== correctAnswer &&
        !wrongAnswers.includes(wrongAnswer)
      ) {
        wrongAnswers.push(wrongAnswer);
      }
    }

    return wrongAnswers;
  }

  /**
   * Get all answers (correct + wrong) in random order
   * @param {Object} questionData - Question data object
   * @returns {Array} Array of answers in random order
   */
  getAllAnswers(questionData) {
    const allAnswers = [
      questionData.correctAnswer,
      ...questionData.wrongAnswers,
    ];
    return this.shuffleArray(allAnswers);
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Check if answer is correct
   * @param {number} userAnswer - User's answer
   * @param {number} correctAnswer - Correct answer
   * @returns {boolean} True if answer is correct
   */
  checkAnswer(userAnswer, correctAnswer) {
    return parseInt(userAnswer) === correctAnswer;
  }

  /**
   * Get operation symbol
   * @param {string} operation - Operation type
   * @returns {string} Operation symbol
   */
  getOperationSymbol(operation) {
    const config = OPERATIONS_CONFIG[operation];
    return config ? config.symbol : "×";
  }

  /**
   * Get operation emoji
   * @param {string} operation - Operation type
   * @returns {string} Operation emoji
   */
  getOperationEmoji(operation) {
    const config = OPERATIONS_CONFIG[operation];
    return config ? config.emoji : "✖️";
  }

  /**
   * Get operation name
   * @param {string} operation - Operation type
   * @returns {string} Operation name
   */
  getOperationName(operation) {
    const config = OPERATIONS_CONFIG[operation];
    return config ? config.name : "Množenje";
  }

  /**
   * Get operation color
   * @param {string} operation - Operation type
   * @returns {string} Operation color
   */
  getOperationColor(operation) {
    const config = OPERATIONS_CONFIG[operation];
    return config ? config.color : "#4CAF50";
  }

  /**
   * Get available levels for operation
   * @param {string} operation - Operation type
   * @returns {Array} Array of available levels
   */
  getAvailableLevels(operation) {
    const config = OPERATIONS_CONFIG[operation];
    return config ? config.levels : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  /**
   * Get question display text with operation symbol
   * @param {Object} questionData - Question data object
   * @returns {string} Formatted question text
   */
  getQuestionDisplayText(questionData) {
    const symbol = this.getOperationSymbol(questionData.operation);
    return questionData.question.replace(/[×÷+\-]/, symbol);
  }

  /**
   * Get operation description for UI
   * @param {string} operation - Operation type
   * @returns {string} Operation description
   */
  getOperationDescription(operation) {
    const config = OPERATIONS_CONFIG[operation];
    return config ? config.description : "Vježbaj matematiku";
  }
}
