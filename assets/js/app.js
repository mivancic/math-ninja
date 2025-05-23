/**
 * Math Ninja - Main Application
 * @fileoverview Main application controller that coordinates all modules
 */

import {
  GAME_CONFIG,
  SCREEN_NAMES,
  getPerformanceTier,
  getStreakTheme,
} from "./config.js";
import { GameEngine } from "./game.js";
import { AudioManager } from "./audio.js";
import { StatisticsManager } from "./statistics.js";
import { VisualEffectsManager } from "./visual-effects.js";
import { RetryChallengeSystem } from "./retry-system.js";

class MathNinjaApp {
  constructor() {
    this.gameEngine = new GameEngine();
    this.audioManager = new AudioManager();
    this.statisticsManager = new StatisticsManager();
    this.visualEffects = new VisualEffectsManager();
    this.retrySystem = new RetryChallengeSystem(
      this.statisticsManager,
      this.audioManager,
      this.gameEngine
    );

    this.currentScreen = SCREEN_NAMES.MENU;
    this.timerInterval = null;
    this.pausedGameState = null; // Store paused game state
    this.pausedTimeLeft = null; // Store remaining time when paused

    // Initialize app
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    this.loadStats();
    await this.audioManager.init();
    this.setupAudioControls();
    this.setupButtonAudioFeedback();
    this.showMenu();
    console.log("🥷 Math Ninja initialized with audio and settings!");
  }

  /**
   * Setup audio control UI and event handlers
   */
  setupAudioControls() {
    // Setup for all instances of audio controls (panel, settings screen)
    this.setupAudioControlsForContainer("panel");
    this.setupAudioControlsForContainer("settings");

    console.log("🎛️ Audio controls initialized");
  }

  /**
   * Setup audio controls for a specific container
   */
  setupAudioControlsForContainer(prefix) {
    const masterMuteBtn = document.getElementById(`${prefix}MasterMuteBtn`);
    const effectsMuteBtn = document.getElementById(`${prefix}EffectsMuteBtn`);
    const musicMuteBtn = document.getElementById(`${prefix}MusicMuteBtn`);
    const effectsVolumeSlider = document.getElementById(
      `${prefix}EffectsVolumeSlider`
    );
    const musicVolumeSlider = document.getElementById(
      `${prefix}MusicVolumeSlider`
    );

    if (!masterMuteBtn) return; // Container might not exist

    // Load initial state from audio manager
    const audioState = this.audioManager.getState();
    effectsVolumeSlider.value = audioState.effectsVolume * 100;
    musicVolumeSlider.value = audioState.musicVolume * 100;

    // Update button states
    this.updateAudioButtonStates();

    // Master mute button
    masterMuteBtn.addEventListener("click", () => {
      this.audioManager.playUISound("click");
      this.audioManager.toggleMaster();
      this.updateAudioButtonStates();
    });

    // Effects mute button
    effectsMuteBtn.addEventListener("click", () => {
      this.audioManager.playUISound("click");
      this.audioManager.toggleEffects();
      this.updateAudioButtonStates();
    });

    // Music mute button
    musicMuteBtn.addEventListener("click", () => {
      this.audioManager.playUISound("click");
      this.audioManager.toggleMusic();
      this.updateAudioButtonStates();
    });

    // Effects volume slider
    effectsVolumeSlider.addEventListener("input", (e) => {
      const volume = parseFloat(e.target.value) / 100;
      this.audioManager.setEffectsVolume(volume);
      this.syncVolumeSliders("effects", volume * 100);
      this.updateAudioButtonStates();
      this.updateVolumeDisplays();
    });

    // Music volume slider
    musicVolumeSlider.addEventListener("input", (e) => {
      const volume = parseFloat(e.target.value) / 100;
      this.audioManager.setMusicVolume(volume);
      this.syncVolumeSliders("music", volume * 100);
      this.updateAudioButtonStates();
      this.updateVolumeDisplays();
    });
  }

  /**
   * Setup button audio feedback for all interactive elements
   */
  setupButtonAudioFeedback() {
    // Get all buttons and interactive elements (except audio control buttons to avoid conflicts)
    const buttons = document.querySelectorAll(
      'button:not([id*="Mute"]):not([class*="audio-button"]), .level-button'
    );

    buttons.forEach((button) => {
      // Skip if already processed
      if (button.hasAttribute("data-audio-enabled")) return;

      // Add hover sound
      button.addEventListener("mouseenter", () => {
        this.audioManager.playUISound("hover");
      });

      // For buttons with onclick attributes, we need to be more careful
      const onclickAttr = button.getAttribute("onclick");
      if (onclickAttr) {
        // Replace the onclick with our enhanced version
        button.removeAttribute("onclick");
        button.addEventListener("click", (e) => {
          this.audioManager.playUISound("click");
          // Execute the original onclick function
          try {
            eval(onclickAttr);
          } catch (error) {
            console.log("Error executing onclick:", error);
          }
        });
      } else {
        // Add click sound for buttons without existing onclick
        button.addEventListener("click", () => {
          this.audioManager.playUISound("click");
        });
      }

      // Mark as processed
      button.setAttribute("data-audio-enabled", "true");
    });

    console.log("🔊 Button audio feedback enabled");
  }

  /**
   * Update audio button visual states
   */
  updateAudioButtonStates() {
    const audioState = this.audioManager.getState();

    // Update for all audio control containers
    ["panel", "settings"].forEach((prefix) => {
      const masterMuteBtn = document.getElementById(`${prefix}MasterMuteBtn`);
      const effectsMuteBtn = document.getElementById(`${prefix}EffectsMuteBtn`);
      const musicMuteBtn = document.getElementById(`${prefix}MusicMuteBtn`);

      if (!masterMuteBtn) return;

      // Master mute button
      if (audioState.masterMuted) {
        masterMuteBtn.textContent = "🔇";
        masterMuteBtn.classList.add("muted");
      } else {
        masterMuteBtn.textContent = "🔊";
        masterMuteBtn.classList.remove("muted");
      }

      // Effects mute button (show real state, but may be overridden by master)
      if (audioState.effectsMuted) {
        effectsMuteBtn.textContent = "🔇";
        effectsMuteBtn.classList.add("muted");
      } else {
        effectsMuteBtn.textContent = "🔊";
        effectsMuteBtn.classList.remove("muted");
      }

      // Disable effects/music controls when master is muted
      effectsMuteBtn.style.opacity = audioState.masterMuted ? "0.5" : "1";
      musicMuteBtn.style.opacity = audioState.masterMuted ? "0.5" : "1";

      // Music mute button (show real state, but may be overridden by master)
      if (audioState.musicMuted) {
        musicMuteBtn.textContent = "🎵";
        musicMuteBtn.classList.add("muted");
      } else {
        musicMuteBtn.textContent = "🎵";
        musicMuteBtn.classList.remove("muted");
      }
    });
  }

  /**
   * Update volume displays in settings
   */
  updateVolumeDisplays() {
    const audioState = this.audioManager.getState();

    const effectsDisplay = document.getElementById("effectsVolumeDisplay");
    const musicDisplay = document.getElementById("musicVolumeDisplay");

    if (effectsDisplay) {
      effectsDisplay.textContent = Math.round(audioState.effectsVolume * 100);
    }
    if (musicDisplay) {
      musicDisplay.textContent = Math.round(audioState.musicVolume * 100);
    }
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
      console.log("No saved statistics found");
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
      console.error("Failed to save statistics");
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
      completedLevels: [], // Still keep for backward compatibility
      levelStars: {}, // New: Store stars per level (level: stars)
      lastPlayed: null,
      daysPlayed: [],
    };
  }

  /**
   * Switch to specific screen
   */
  switchScreen(screenName) {
    // Hide all screens
    Object.values(SCREEN_NAMES).forEach((screen) => {
      const element = document.querySelector(`.${screen}`);
      if (element) {
        element.classList.remove("active");
        if (screen === SCREEN_NAMES.LEVEL_SELECT) {
          element.style.display = "none";
        }
      }
    });

    // Show target screen
    const targetElement = document.querySelector(`.${screenName}`);
    if (targetElement) {
      targetElement.classList.add("active");
      if (screenName === SCREEN_NAMES.LEVEL_SELECT) {
        targetElement.style.display = "block";
      }
    }

    this.currentScreen = screenName;
    this.clearTimer();

    // Show/hide in-game settings toggle
    const settingsToggle = document.getElementById("settingsToggle");
    if (screenName === SCREEN_NAMES.GAME) {
      settingsToggle.style.display = "block";
    } else {
      settingsToggle.style.display = "none";
      // Also close settings panel if open
      this.closeInGameSettings();
    }
  }

  /**
   * Show main menu
   */
  showMenu() {
    // Reset visual effects when returning to menu
    this.visualEffects.resetEffects();

    this.switchScreen(SCREEN_NAMES.MENU);

    // Check if there's a paused game and show/hide the continue button
    const continueBtn = document.getElementById("continueGameBtn");
    if (this.pausedGameState) {
      continueBtn.style.display = "block";
    } else {
      continueBtn.style.display = "none";
    }

    // Update progress indicator
    this.updateProgressIndicator();

    // Start background music on menu
    this.audioManager.startBackgroundMusic();
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
    const selector = document.getElementById("levelSelector");
    selector.innerHTML = "";

    for (let i = 1; i <= GAME_CONFIG.MAX_LEVEL; i++) {
      const button = document.createElement("button");
      button.className = "level-button";

      const stars = this.stats.levelStars[i] || 0;
      const isCompleted = this.stats.completedLevels.includes(i) || stars > 0;

      if (isCompleted) {
        button.classList.add("completed");
      }

      button.innerHTML = i;

      // Add stars if level has been completed
      if (stars > 0) {
        const starsContainer = document.createElement("div");
        starsContainer.className = "level-stars";

        for (let s = 0; s < 3; s++) {
          const star = document.createElement("span");
          star.textContent = s < stars ? "⭐" : "☆";
          starsContainer.appendChild(star);
        }

        button.appendChild(starsContainer);
      }

      button.onclick = () => this.startGame(i);
      selector.appendChild(button);
    }
  }

  /**
   * Start a new game
   */
  startGame(level) {
    // Clear any paused game
    this.clearPausedGame();

    // Reset retry system for new game
    this.retrySystem.reset();

    // Reset visual effects
    this.visualEffects.resetEffects();

    this.switchScreen(SCREEN_NAMES.GAME);

    // Track daily play
    this.trackDailyPlay();

    // Track daily challenge if level 0
    if (level === 0) {
      this.statisticsManager.trackDailyChallenge();
    }

    // Get unlearned wrong answers for this level
    let unlearnedWrongAnswers = [];
    if (level === 0) {
      // For daily challenge, get mix of all unlearned wrong answers
      unlearnedWrongAnswers =
        this.statisticsManager.getAllUnlearnedWrongAnswers();
    } else {
      // For specific level, get unlearned wrong answers for that level
      unlearnedWrongAnswers =
        this.statisticsManager.getUnlearnedWrongAnswers(level);
    }

    console.log(
      `🎯 Starting level ${level} with ${unlearnedWrongAnswers.length} unlearned wrong answers`
    );

    // Start game engine with unlearned wrong answers
    const questionData = this.gameEngine.startGame(
      level,
      unlearnedWrongAnswers
    );

    // Update UI
    const levelText = level === 0 ? "Dnevni Izazov" : level.toString();
    document.getElementById("currentLevel").textContent = levelText;

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

    // Show question with optional review indicator
    let questionText = `${questionData.num1} × ${questionData.num2} = `;
    if (questionData.isFromWrongAnswers) {
      questionText = `📚 ${questionText}`; // Add book emoji to indicate review question
    }

    document.getElementById("question").textContent = questionText;

    const answersContainer = document.getElementById("answerButtons");
    answersContainer.innerHTML = "";

    questionData.answers.forEach((answer) => {
      const button = document.createElement("button");
      button.className = "answer-button";
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
    const allButtons = document.querySelectorAll(".answer-button");
    allButtons.forEach((btn) => {
      btn.onclick = null;
      btn.style.cursor = "default";
    });

    // Get current question before evaluation (to preserve isFromWrongAnswers flag)
    const currentQuestion = this.gameEngine.getCurrentQuestion();

    // Evaluate answer
    const result = this.gameEngine.evaluateAnswer(selectedAnswer);

    // Track answer in retry system
    if (result.feedbackType === "correct") {
      this.retrySystem.trackCorrectAnswer();

      // If this was a review question from unlearned wrong answers, mark it as learned
      if (currentQuestion.isFromWrongAnswers) {
        this.statisticsManager.markAsLearned(
          this.gameEngine.currentLevel,
          currentQuestion.num1,
          currentQuestion.num2
        );

        // Also remove from current session if it exists there
        this.gameEngine.removeCurrentSessionWrongAnswer(
          currentQuestion.num1,
          currentQuestion.num2
        );

        console.log(
          `✅ Marked as learned during gameplay: ${currentQuestion.num1} × ${currentQuestion.num2}`
        );
      }
    } else {
      // Track wrong answer in statistics (for persistence)
      this.retrySystem.trackWrongAnswer(
        this.gameEngine.currentLevel,
        currentQuestion,
        selectedAnswer,
        result.correctAnswer
      );

      // Track wrong answer in current session (for retry system)
      this.gameEngine.trackCurrentSessionWrongAnswer(
        currentQuestion,
        selectedAnswer,
        result.correctAnswer
      );

      // Reset visual effects streak when wrong answer breaks streak
      this.visualEffects.updateStreakEffects(0);
    }

    // Update visual effects based on streak
    this.visualEffects.updateStreakEffects(result.gameStats.streak);

    // Add streak highlight to display
    if (result.gameStats.streak > 0) {
      const streakDisplay = document.getElementById("streak");
      if (streakDisplay) {
        streakDisplay.classList.add("streak-active");
        setTimeout(() => {
          streakDisplay.classList.remove("streak-active");
        }, 500);
      }
    }

    // Play audio feedback
    if (result.feedbackType === "correct") {
      // Play streak sound if applicable, otherwise play correct sound
      if (result.gameStats.streak >= 3) {
        this.audioManager.playGameEvent("streak", {
          streak: result.gameStats.streak,
        });
      } else {
        this.audioManager.playGameEvent("correct");
      }
    } else {
      this.audioManager.playGameEvent("incorrect");
    }

    // Show visual feedback
    if (result.feedbackType === "correct") {
      buttonElement.classList.add("correct-answer");
      this.showFeedback("✓", "correct");
    } else {
      buttonElement.classList.add("wrong-answer");
      this.showFeedback("✗", "incorrect");

      // Highlight correct answer
      allButtons.forEach((btn) => {
        if (parseInt(btn.textContent) === result.correctAnswer) {
          btn.classList.add("correct-answer");
        }
      });
    }

    this.updateGameDisplay();

    // Continue game or end
    if (result.isGameComplete) {
      setTimeout(
        () => this.endGame(result.gameStats),
        GAME_CONFIG.NEXT_QUESTION_DELAY
      );
    } else {
      // Check if retry challenge should be offered
      if (this.retrySystem.shouldOfferRetry()) {
        this.retrySystem.setRetryCallback(() => {
          const nextQuestion = this.gameEngine.generateQuestion();
          this.displayQuestion(nextQuestion);
          this.startTimer();
        });
        // Offer retry challenge immediately after delay
        setTimeout(() => {
          this.retrySystem.offerRetryChallenge();
        }, GAME_CONFIG.WRONG_ANSWER_RETRY_DELAY);
      } else {
        setTimeout(() => {
          const nextQuestion = this.gameEngine.generateQuestion();
          this.displayQuestion(nextQuestion);
          this.startTimer();
        }, GAME_CONFIG.NEXT_QUESTION_DELAY);
      }
    }
  }

  /**
   * Handle timer timeout
   */
  handleTimeout() {
    const result = this.gameEngine.handleTimeout();
    const currentQuestion = this.gameEngine.getCurrentQuestion();

    // Track timeout as wrong answer in statistics
    this.retrySystem.trackWrongAnswer(
      this.gameEngine.currentLevel,
      currentQuestion,
      -1, // Timeout indicator
      result.correctAnswer
    );

    // Track timeout in current session (for retry system)
    this.gameEngine.trackCurrentSessionWrongAnswer(
      currentQuestion,
      -1, // Timeout indicator
      result.correctAnswer
    );

    // Reset visual effects streak (timeout breaks streak)
    this.visualEffects.updateStreakEffects(0);

    // Play timeout audio
    this.audioManager.playGameEvent("timeout");

    this.showFeedback("⏰", "incorrect");

    // Highlight correct answer
    const allButtons = document.querySelectorAll(".answer-button");
    allButtons.forEach((btn) => {
      btn.onclick = null;
      if (parseInt(btn.textContent) === result.correctAnswer) {
        btn.classList.add("correct-answer");
      }
    });

    this.updateGameDisplay();

    if (result.isGameComplete) {
      setTimeout(
        () => this.endGame(result.gameStats),
        GAME_CONFIG.NEXT_QUESTION_DELAY
      );
    } else {
      // Check if retry challenge should be offered for timeout too
      if (this.retrySystem.shouldOfferRetry()) {
        this.retrySystem.setRetryCallback(() => {
          const nextQuestion = this.gameEngine.generateQuestion();
          this.displayQuestion(nextQuestion);
          this.startTimer();
        });
        // Offer retry challenge immediately after delay
        setTimeout(() => {
          this.retrySystem.offerRetryChallenge();
        }, GAME_CONFIG.WRONG_ANSWER_RETRY_DELAY);
      } else {
        setTimeout(() => {
          const nextQuestion = this.gameEngine.generateQuestion();
          this.displayQuestion(nextQuestion);
          this.startTimer();
        }, GAME_CONFIG.NEXT_QUESTION_DELAY);
      }
    }
  }

  /**
   * Start game timer
   */
  startTimer() {
    this.clearTimer();

    let timeLeft = this.gameEngine.getTimerDuration();
    const timerFill = document.getElementById("timerFill");
    timerFill.style.width = "100%";

    this.timerInterval = setInterval(() => {
      timeLeft -= GAME_CONFIG.TIMER_UPDATE_INTERVAL;
      const percentage = (timeLeft / this.gameEngine.getTimerDuration()) * 100;
      timerFill.style.width = Math.max(0, percentage) + "%";

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
    document.getElementById("score").textContent = stats.score;
    document.getElementById("accuracy").textContent = stats.accuracy;
    document.getElementById("streak").textContent = stats.streak;
  }

  /**
   * Show visual feedback
   */
  showFeedback(text, type) {
    const feedback = document.createElement("div");
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

    // Clear paused game state since game is completed
    this.clearPausedGame();

    // Play level complete sound
    this.audioManager.playGameEvent("level-complete");

    // Check for new records
    const isNewBestStreak = gameStats.maxStreak > this.stats.bestStreak;
    const isNewHighScore =
      gameStats.score > 0 &&
      gameStats.score > this.getPersonalBest(gameStats.level);

    if (isNewBestStreak || isNewHighScore) {
      setTimeout(() => {
        this.audioManager.playGameEvent("new-record");
      }, 1000); // Delay for dramatic effect
    }

    // Update global statistics
    this.stats.totalScore += gameStats.score;
    this.stats.gamesPlayed++;
    this.stats.totalQuestions += gameStats.questionsAnswered;
    this.stats.totalCorrect += gameStats.correctAnswers;

    if (gameStats.maxStreak > this.stats.bestStreak) {
      this.stats.bestStreak = gameStats.maxStreak;
    }

    // Check level completion
    if (
      gameStats.accuracy >= GAME_CONFIG.ACCURACY_THRESHOLD &&
      gameStats.level !== 0 &&
      !this.stats.completedLevels.includes(gameStats.level)
    ) {
      this.stats.completedLevels.push(gameStats.level);
    }

    // Save star rating for level (if not daily challenge)
    if (gameStats.level !== 0) {
      const performanceData = getPerformanceTier(gameStats.accuracy);
      const currentStars = this.stats.levelStars[gameStats.level] || 0;
      // Only update if new star rating is better
      if (performanceData.stars > currentStars) {
        this.stats.levelStars[gameStats.level] = performanceData.stars;
      }
    }

    this.saveStats();
    this.showLevelComplete(gameStats);
  }

  /**
   * Get personal best score for a level
   */
  getPersonalBest(level) {
    // Simple implementation - can be enhanced later
    return Math.floor(
      this.stats.totalScore / Math.max(this.stats.gamesPlayed, 1)
    );
  }

  /**
   * Show level completion screen
   */
  showLevelComplete(gameStats) {
    this.switchScreen(SCREEN_NAMES.LEVEL_COMPLETE);

    const performanceData = getPerformanceTier(gameStats.accuracy);

    document.getElementById("performanceImage").textContent =
      performanceData.emoji;
    document.getElementById("performanceTitle").textContent =
      performanceData.title;
    document.getElementById("performanceTitle").style.color =
      performanceData.color;

    document.getElementById("finalScore").textContent = gameStats.score;
    document.getElementById("finalAccuracy").textContent =
      gameStats.accuracy + "%";
    document.getElementById("finalStreak").textContent = gameStats.maxStreak;

    // Update stars
    const starsContainer = document.getElementById("starsContainer");
    starsContainer.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.textContent = i < performanceData.stars ? "⭐" : "☆";
      starsContainer.appendChild(star);
    }

    // Update action buttons based on level and performance
    this.updateLevelCompleteActions(gameStats, performanceData);
  }

  /**
   * Retry current level
   */
  retryLevel() {
    // Reset visual effects before starting new game
    this.visualEffects.resetEffects();

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

    // Basic stats
    document.getElementById("totalScore").textContent = this.stats.totalScore;
    document.getElementById("avgAccuracy").textContent =
      Math.round(
        (this.stats.totalCorrect / Math.max(this.stats.totalQuestions, 1)) * 100
      ) + "%";
    document.getElementById("bestStreak").textContent = this.stats.bestStreak;
    document.getElementById("daysPlayed").textContent =
      this.stats.daysPlayed.length;

    // Enhanced stats from statistics manager
    const detailedStats = this.statisticsManager.getComprehensiveStats();

    // Update detailed statistics if elements exist
    const totalPlaytimeEl = document.getElementById("totalPlaytime");
    if (totalPlaytimeEl) {
      totalPlaytimeEl.textContent = detailedStats.totalPlaytimeFormatted;
    }

    const dailyChallengeStreakEl = document.getElementById(
      "dailyChallengeStreak"
    );
    if (dailyChallengeStreakEl) {
      dailyChallengeStreakEl.textContent = detailedStats.dailyChallengeStreak;
    }

    const longestDailyStreakEl = document.getElementById("longestDailyStreak");
    if (longestDailyStreakEl) {
      longestDailyStreakEl.textContent = detailedStats.longestDailyStreak;
    }

    const todayPlaytimeEl = document.getElementById("todayPlaytime");
    if (todayPlaytimeEl) {
      todayPlaytimeEl.textContent = detailedStats.todayPlaytimeFormatted;
    }

    const todayLaunchesEl = document.getElementById("todayLaunches");
    if (todayLaunchesEl) {
      todayLaunchesEl.textContent = detailedStats.todayLaunches;
    }

    const averageSessionEl = document.getElementById("averageSession");
    if (averageSessionEl) {
      averageSessionEl.textContent = detailedStats.averageSessionFormatted;
    }

    const wrongAnswersEl = document.getElementById("wrongAnswersCount");
    if (wrongAnswersEl) {
      wrongAnswersEl.textContent = detailedStats.unlearnedWrongAnswers;
    }
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

  /**
   * Show settings screen
   */
  showSettings() {
    this.switchScreen(SCREEN_NAMES.SETTINGS);
    this.updateVolumeDisplays();
  }

  /**
   * Toggle in-game settings panel
   */
  toggleInGameSettings() {
    const settingsPanel = document.getElementById("settingsPanel");
    const isOpen = settingsPanel.classList.contains("open");

    if (isOpen) {
      this.closeInGameSettings();
    } else {
      this.openInGameSettings();
    }
  }

  /**
   * Open in-game settings panel
   */
  openInGameSettings() {
    const settingsPanel = document.getElementById("settingsPanel");
    settingsPanel.classList.add("open");
    this.updateAudioButtonStates();
  }

  /**
   * Close in-game settings panel
   */
  closeInGameSettings() {
    const settingsPanel = document.getElementById("settingsPanel");
    settingsPanel.classList.remove("open");
  }

  /**
   * Sync volume sliders across all containers
   */
  syncVolumeSliders(type, value) {
    ["panel", "settings"].forEach((prefix) => {
      const slider = document.getElementById(
        `${prefix}${type === "effects" ? "Effects" : "Music"}VolumeSlider`
      );
      if (slider && Math.abs(slider.value - value) > 0.1) {
        slider.value = value;
      }
    });
  }

  /**
   * Pause current game and return to menu
   */
  pauseAndExit() {
    if (this.currentScreen !== SCREEN_NAMES.GAME) return;

    // Save current game state
    this.pausedGameState = {
      gameStats: this.gameEngine.getGameStats(),
      currentQuestion: this.gameEngine.getCurrentQuestion(),
      level: this.gameEngine.currentLevel,
      questionsRemaining: this.gameEngine.getQuestionsRemaining(),
      unlearnedWrongAnswers: this.gameEngine.unlearnedWrongAnswers,
      wrongAnswersUsed: Array.from(this.gameEngine.wrongAnswersUsed),
    };

    // Save current timer state
    const timerFill = document.getElementById("timerFill");
    const currentWidth = parseFloat(timerFill.style.width) || 100;
    const timerDuration = this.gameEngine.getTimerDuration();
    this.pausedTimeLeft = (currentWidth / 100) * timerDuration;

    // Clear timer and return to menu
    this.clearTimer();
    this.showMenu();

    console.log("🎮 Game paused and saved");
  }

  /**
   * Resume paused game
   */
  resumeGame() {
    if (!this.pausedGameState) return;

    // Switch to game screen
    this.switchScreen(SCREEN_NAMES.GAME);

    // Restore game state
    this.gameEngine.restoreGameState(this.pausedGameState);

    // Update UI
    const levelText =
      this.pausedGameState.level === 0
        ? "Dnevni Izazov"
        : this.pausedGameState.level.toString();
    document.getElementById("currentLevel").textContent = levelText;

    // Display current question
    this.displayQuestion(this.pausedGameState.currentQuestion);

    // Update game display
    this.updateGameDisplay();

    // Resume timer with remaining time
    this.resumeTimer();

    console.log("🎮 Game resumed from pause");
  }

  /**
   * Resume timer with remaining time from pause
   */
  resumeTimer() {
    if (!this.pausedTimeLeft) {
      this.startTimer();
      return;
    }

    this.clearTimer();

    let timeLeft = this.pausedTimeLeft;
    const timerDuration = this.gameEngine.getTimerDuration();
    const timerFill = document.getElementById("timerFill");

    // Set initial timer fill based on remaining time
    timerFill.style.width = (timeLeft / timerDuration) * 100 + "%";

    this.timerInterval = setInterval(() => {
      timeLeft -= GAME_CONFIG.TIMER_UPDATE_INTERVAL;
      const percentage = (timeLeft / timerDuration) * 100;
      timerFill.style.width = Math.max(0, percentage) + "%";

      if (timeLeft <= 0) {
        this.clearTimer();
        this.handleTimeout();
      }
    }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);
  }

  /**
   * Clear paused game state (called when game completes or new game starts)
   */
  clearPausedGame() {
    this.pausedGameState = null;
    this.pausedTimeLeft = null;

    // Hide continue button
    const continueBtn = document.getElementById("continueGameBtn");
    if (continueBtn) {
      continueBtn.style.display = "none";
    }
  }

  /**
   * Update progress indicator on menu screen
   */
  updateProgressIndicator() {
    const completedLevels = this.stats.completedLevels.length;
    const totalLevels = GAME_CONFIG.MAX_LEVEL;
    const progressPercentage = Math.round(
      (completedLevels / totalLevels) * 100
    );

    // Update stats text
    document.getElementById(
      "progressStats"
    ).textContent = `${completedLevels}/${totalLevels}`;

    // Update progress bar
    const progressBar = document.getElementById("progressBar");
    progressBar.style.width = `${progressPercentage}%`;

    // Update percentage text
    document.getElementById(
      "progressPercentage"
    ).textContent = `${progressPercentage}%`;

    // Calculate overall accuracy based on stars
    const totalStars = Object.values(this.stats.levelStars).reduce(
      (sum, stars) => sum + stars,
      0
    );
    const maxPossibleStars = completedLevels * 3;

    // Update star progress indicators
    const starElements = [
      document.getElementById("starProgress1"),
      document.getElementById("starProgress2"),
      document.getElementById("starProgress3"),
    ];

    if (maxPossibleStars > 0) {
      const starAccuracy = (totalStars / maxPossibleStars) * 3;

      starElements.forEach((star, index) => {
        if (index < Math.floor(starAccuracy)) {
          star.textContent = "⭐";
          star.classList.add("filled");
        } else if (index < starAccuracy) {
          // Partial star
          star.textContent = "⭐";
          star.classList.add("filled");
          star.style.opacity = "0.5";
        } else {
          star.textContent = "☆";
          star.classList.remove("filled");
          star.style.opacity = "1";
        }
      });
    } else {
      // No levels completed yet
      starElements.forEach((star) => {
        star.textContent = "☆";
        star.classList.remove("filled");
        star.style.opacity = "1";
      });
    }
  }

  /**
   * Update level complete action buttons
   */
  updateLevelCompleteActions(gameStats, performanceData) {
    const currentLevel = this.gameEngine.currentLevel;
    const nextLevelBtn = document.getElementById("nextLevelBtn");
    const retryLevelBtn = document.getElementById("retryLevelBtn");

    // Show next level button if not on max level and current level is not daily challenge
    if (currentLevel > 0 && currentLevel < GAME_CONFIG.MAX_LEVEL) {
      nextLevelBtn.style.display = "block";
    } else {
      nextLevelBtn.style.display = "none";
    }

    // Show retry button only if less than 3 stars
    if (currentLevel > 0 && performanceData.stars < 3) {
      retryLevelBtn.style.display = "block";
    } else {
      retryLevelBtn.style.display = "none";
    }
  }

  /**
   * Go to next level
   */
  goToNextLevel() {
    const currentLevel = this.gameEngine.currentLevel;
    if (currentLevel > 0 && currentLevel < GAME_CONFIG.MAX_LEVEL) {
      this.startGame(currentLevel + 1);
    }
  }
}

// Initialize and expose global instance
const mathNinja = new MathNinjaApp();
window.mathNinja = mathNinja;

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  mathNinja.statisticsManager?.cleanup();
  mathNinja.visualEffects?.cleanup();
  mathNinja.retrySystem?.reset();
});

export default mathNinja;
