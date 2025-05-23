/**
 * Math Ninja - Game Engine
 * @fileoverview Core game mechanics, question generation, and scoring
 */

import { GAME_CONFIG, FEEDBACK_TYPES } from './config.js';

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
    }

    /**
     * Start a new game with specified level
     * @param {number} level - Game level (1-10, or 0 for daily challenge)
     */
    startGame(level) {
        this.reset();
        this.currentLevel = level;
        this.timeLimit = level === 0 ? GAME_CONFIG.DAILY_CHALLENGE_TIMER : GAME_CONFIG.TIMER_DURATION;
        this.isGameActive = true;
        
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

        const num1 = this.currentLevel === 0 
            ? Math.floor(Math.random() * GAME_CONFIG.MAX_LEVEL) + 1 
            : this.currentLevel;
        
        const num2 = Math.floor(Math.random() * GAME_CONFIG.MAX_LEVEL) + 1;
        this.currentAnswer = num1 * num2;

        return {
            num1,
            num2,
            correctAnswer: this.currentAnswer,
            answers: this.generateAnswerOptions()
        };
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
            
            switch(variation) {
                case 0:
                    // Plus/minus variation
                    wrongAnswer = this.currentAnswer + 
                        (Math.random() > 0.5 ? 1 : -1) * 
                        (Math.floor(Math.random() * GAME_CONFIG.ANSWER_VARIATION_RANGE) + 1);
                    break;
                case 1:
                    // Different multiplicand variation
                    const divisor = Math.floor(this.currentAnswer / (this.currentLevel || 1)) || 1;
                    wrongAnswer = (this.currentLevel || 1) * 
                        (divisor + (Math.random() > 0.5 ? 1 : -1));
                    break;
                case 2:
                    // Random within range variation
                    wrongAnswer = Math.floor(Math.random() * (this.currentAnswer * 2)) + 1;
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

        const isGameComplete = this.questionsAnswered >= GAME_CONFIG.QUESTIONS_PER_LEVEL;
        
        if (isGameComplete) {
            this.isGameActive = false;
        }

        return {
            feedbackType,
            pointsEarned,
            correctAnswer: this.currentAnswer,
            isGameComplete,
            gameStats: this.getGameStats()
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
        const streakBonus = Math.floor(this.streak / GAME_CONFIG.STREAK_THRESHOLD) * GAME_CONFIG.STREAK_BONUS;
        return GAME_CONFIG.BASE_POINTS + streakBonus;
    }

    /**
     * Get current game statistics
     * @returns {Object} Current game stats
     */
    getGameStats() {
        const accuracy = this.questionsAnswered > 0 
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
            isComplete: this.questionsAnswered >= GAME_CONFIG.QUESTIONS_PER_LEVEL
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
} 