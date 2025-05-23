/**
 * Math Ninja - Main Application
 * @fileoverview Main application controller that coordinates all modules
 */

import { GAME_CONFIG, SCREEN_NAMES, getPerformanceTier } from './config.js';
import { GameEngine } from './game.js';

class MathNinjaApp {
    constructor() {
        this.gameEngine = new GameEngine();
        this.currentScreen = SCREEN_NAMES.MENU;
        this.timerInterval = null;
        
        // Initialize app
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.loadStats();
        this.showMenu();
        console.log('🥷 Math Ninja initialized!');
    }

    /**
     * Load statistics from localStorage
     */
    loadStats() {
        try {
            const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEY);
            if (saved) {
                this.stats = { ...this.getDefaultStats(), ...JSON.parse(saved) };
            } else {
                this.stats = this.getDefaultStats();
            }
        } catch (e) {
            console.log('No saved statistics found');
            this.stats = this.getDefaultStats();
        }
    }

    /**
     * Save statistics to localStorage
     */
    saveStats() {
        try {
            localStorage.setItem(GAME_CONFIG.STORAGE_KEY, JSON.stringify(this.stats));
        } catch (e) {
            console.error('Failed to save statistics');
        }
    }

    /**
     * Get default statistics structure
     */
    getDefaultStats() {
        return {
            totalScore: 0,
            gamesPlayed: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            bestStreak: 0,
            completedLevels: [],
            lastPlayed: null,
            daysPlayed: []
        };
    }

    /**
     * Switch to specific screen
     */
    switchScreen(screenName) {
        // Hide all screens
        Object.values(SCREEN_NAMES).forEach(screen => {
            const element = document.querySelector(`.${screen}`);
            if (element) {
                element.classList.remove('active');
                if (screen === SCREEN_NAMES.LEVEL_SELECT) {
                    element.style.display = 'none';
                }
            }
        });

        // Show target screen
        const targetElement = document.querySelector(`.${screenName}`);
        if (targetElement) {
            targetElement.classList.add('active');
            if (screenName === SCREEN_NAMES.LEVEL_SELECT) {
                targetElement.style.display = 'block';
            }
        }

        this.currentScreen = screenName;
        this.clearTimer();
    }

    /**
     * Show main menu
     */
    showMenu() {
        this.switchScreen(SCREEN_NAMES.MENU);
    }

    /**
     * Show level selection screen
     */
    showLevelSelect() {
        this.switchScreen(SCREEN_NAMES.LEVEL_SELECT);
        this.generateLevelButtons();
    }

    /**
     * Generate level selection buttons
     */
    generateLevelButtons() {
        const selector = document.getElementById('levelSelector');
        selector.innerHTML = '';
        
        for (let i = 1; i <= GAME_CONFIG.MAX_LEVEL; i++) {
            const button = document.createElement('button');
            button.className = 'level-button';
            if (this.stats.completedLevels.includes(i)) {
                button.classList.add('completed');
            }
            button.textContent = i;
            button.onclick = () => this.startGame(i);
            selector.appendChild(button);
        }
    }

    /**
     * Start a new game
     */
    startGame(level) {
        this.switchScreen(SCREEN_NAMES.GAME);
        
        // Track daily play
        this.trackDailyPlay();
        
        // Start game engine
        const questionData = this.gameEngine.startGame(level);
        
        // Update UI
        const levelText = level === 0 ? 'Dnevni Izazov' : level.toString();
        document.getElementById('currentLevel').textContent = levelText;
        
        // Start first question
        this.displayQuestion(questionData);
        this.updateGameDisplay();
        this.startTimer();
    }

    /**
     * Start daily challenge
     */
    startDailyChallenge() {
        this.startGame(0);
    }

    /**
     * Display question and answer options
     */
    displayQuestion(questionData) {
        if (!questionData) return;

        document.getElementById('question').textContent = 
            `${questionData.num1} × ${questionData.num2} = `;
        
        const answersContainer = document.getElementById('answerButtons');
        answersContainer.innerHTML = '';
        
        questionData.answers.forEach(answer => {
            const button = document.createElement('button');
            button.className = 'answer-button';
            button.textContent = answer;
            button.onclick = () => this.selectAnswer(answer, button);
            answersContainer.appendChild(button);
        });
    }

    /**
     * Handle answer selection
     */
    selectAnswer(selectedAnswer, buttonElement) {
        this.clearTimer();
        
        // Disable all buttons
        const allButtons = document.querySelectorAll('.answer-button');
        allButtons.forEach(btn => {
            btn.onclick = null;
            btn.style.cursor = 'default';
        });
        
        // Evaluate answer
        const result = this.gameEngine.evaluateAnswer(selectedAnswer);
        
        // Show visual feedback
        if (result.feedbackType === 'correct') {
            buttonElement.classList.add('correct-answer');
            this.showFeedback('✓', 'correct');
        } else {
            buttonElement.classList.add('wrong-answer');
            this.showFeedback('✗', 'incorrect');
            
            // Highlight correct answer
            allButtons.forEach(btn => {
                if (parseInt(btn.textContent) === result.correctAnswer) {
                    btn.classList.add('correct-answer');
                }
            });
        }
        
        this.updateGameDisplay();
        
        // Continue game or end
        if (result.isGameComplete) {
            setTimeout(() => this.endGame(result.gameStats), GAME_CONFIG.NEXT_QUESTION_DELAY);
        } else {
            setTimeout(() => {
                const nextQuestion = this.gameEngine.generateQuestion();
                this.displayQuestion(nextQuestion);
                this.startTimer();
            }, GAME_CONFIG.NEXT_QUESTION_DELAY);
        }
    }

    /**
     * Handle timer timeout
     */
    handleTimeout() {
        const result = this.gameEngine.handleTimeout();
        
        this.showFeedback('⏰', 'incorrect');
        
        // Highlight correct answer
        const allButtons = document.querySelectorAll('.answer-button');
        allButtons.forEach(btn => {
            btn.onclick = null;
            if (parseInt(btn.textContent) === result.correctAnswer) {
                btn.classList.add('correct-answer');
            }
        });
        
        this.updateGameDisplay();
        
        if (result.isGameComplete) {
            setTimeout(() => this.endGame(result.gameStats), GAME_CONFIG.NEXT_QUESTION_DELAY);
        } else {
            setTimeout(() => {
                const nextQuestion = this.gameEngine.generateQuestion();
                this.displayQuestion(nextQuestion);
                this.startTimer();
            }, GAME_CONFIG.NEXT_QUESTION_DELAY);
        }
    }

    /**
     * Start game timer
     */
    startTimer() {
        this.clearTimer();
        
        let timeLeft = this.gameEngine.getTimerDuration();
        const timerFill = document.getElementById('timerFill');
        timerFill.style.width = '100%';
        
        this.timerInterval = setInterval(() => {
            timeLeft -= GAME_CONFIG.TIMER_UPDATE_INTERVAL;
            const percentage = (timeLeft / this.gameEngine.getTimerDuration()) * 100;
            timerFill.style.width = Math.max(0, percentage) + '%';
            
            if (timeLeft <= 0) {
                this.clearTimer();
                this.handleTimeout();
            }
        }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);
    }

    /**
     * Clear timer interval
     */
    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Update game display
     */
    updateGameDisplay() {
        const stats = this.gameEngine.getGameStats();
        document.getElementById('score').textContent = stats.score;
        document.getElementById('accuracy').textContent = stats.accuracy;
        document.getElementById('streak').textContent = stats.streak;
    }

    /**
     * Show visual feedback
     */
    showFeedback(text, type) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = text;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, GAME_CONFIG.FEEDBACK_DURATION);
    }

    /**
     * End game and show results
     */
    endGame(gameStats) {
        this.clearTimer();
        
        // Update global statistics
        this.stats.totalScore += gameStats.score;
        this.stats.gamesPlayed++;
        this.stats.totalQuestions += gameStats.questionsAnswered;
        this.stats.totalCorrect += gameStats.correctAnswers;
        
        if (gameStats.maxStreak > this.stats.bestStreak) {
            this.stats.bestStreak = gameStats.maxStreak;
        }
        
        // Check level completion
        if (gameStats.accuracy >= GAME_CONFIG.ACCURACY_THRESHOLD && 
            gameStats.level !== 0 && 
            !this.stats.completedLevels.includes(gameStats.level)) {
            this.stats.completedLevels.push(gameStats.level);
        }
        
        this.saveStats();
        this.showLevelComplete(gameStats);
    }

    /**
     * Show level completion screen
     */
    showLevelComplete(gameStats) {
        this.switchScreen(SCREEN_NAMES.LEVEL_COMPLETE);
        
        const performanceData = getPerformanceTier(gameStats.accuracy);
        
        document.getElementById('performanceImage').textContent = performanceData.emoji;
        document.getElementById('performanceTitle').textContent = performanceData.title;
        document.getElementById('performanceTitle').style.color = performanceData.color;
        
        document.getElementById('finalScore').textContent = gameStats.score;
        document.getElementById('finalAccuracy').textContent = gameStats.accuracy + '%';
        document.getElementById('finalStreak').textContent = gameStats.maxStreak;
        
        // Update stars
        const starsContainer = document.getElementById('starsContainer');
        starsContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = i < performanceData.stars ? '⭐' : '☆';
            starsContainer.appendChild(star);
        }
    }

    /**
     * Retry current level
     */
    retryLevel() {
        const currentLevel = this.gameEngine.currentLevel;
        if (currentLevel === 0) {
            this.startDailyChallenge();
        } else {
            this.startGame(currentLevel);
        }
    }

    /**
     * Show statistics screen
     */
    showStats() {
        this.switchScreen(SCREEN_NAMES.STATS);
        
        document.getElementById('totalScore').textContent = this.stats.totalScore;
        document.getElementById('avgAccuracy').textContent = 
            Math.round((this.stats.totalCorrect / Math.max(this.stats.totalQuestions, 1)) * 100) + '%';
        document.getElementById('bestStreak').textContent = this.stats.bestStreak;
        document.getElementById('daysPlayed').textContent = this.stats.daysPlayed.length;
    }

    /**
     * Track daily play for streaks
     */
    trackDailyPlay() {
        const today = new Date().toDateString();
        if (!this.stats.daysPlayed.includes(today)) {
            this.stats.daysPlayed.push(today);
        }
        this.stats.lastPlayed = today;
        this.saveStats();
    }
}

// Initialize and expose global instance
const mathNinja = new MathNinjaApp();
window.mathNinja = mathNinja;

export default mathNinja; 