/**
 * Math Ninja - Main Application
 * @fileoverview Main application controller that coordinates all modules
 */

import {
  GAME_CONFIG,
  SCREEN_NAMES,
  getPerformanceTier,
  LEVELS_BY_OPERATION,
  OPERATIONS
} from "./config.js";
import { GameEngine } from "./game.js";
import { AudioManager } from "./audio.js";
import { StatisticsManager } from "./statistics.js";
import { VisualEffectsManager } from "./visual-effects.js";
import { BadgeSystem, BADGES } from "./rewards/badges.js";

class MathNinjaApp {
  constructor() {
    this.gameEngine = new GameEngine();
    this.audioManager = new AudioManager();
    this.statisticsManager = new StatisticsManager();
    this.visualEffects = new VisualEffectsManager();
    this.badgeSystem = new BadgeSystem(this.statisticsManager);

    this.currentScreen = SCREEN_NAMES.HOME;
    this.timerInterval = null;
    this.pausedGameState = null;

    // UI State
    this.selectedOp = null; // 'add', 'sub', 'mul', 'div'

    // Initialize app
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    await this.audioManager.init();
    this.setupAudioControls();
    this.setupEventListeners();
    this.showHome();
    console.log("🥷 Math Ninja 2.0 initialized!");
  }

  /**
   * Setup global event listeners (Event Delegation)
   */
  setupEventListeners() {
      document.addEventListener('click', (e) => {
          // Find closest element with data-action
          const target = e.target.closest('[data-action]');
          if (!target) return;

          const action = target.dataset.action;
          this.handleAction(action, target);
      });

      // Setup audio for all buttons
      document.addEventListener('click', (e) => {
         if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
             this.audioManager.playUISound("click");
         }
      });
  }

  /**
   * Handle UI actions
   */
  handleAction(action, target) {
      switch(action) {
          case 'select-op':
              this.selectedOp = target.dataset.op;
              this.showLevelSelect();
              break;
          case 'show-home':
              this.showHome();
              break;
          case 'show-stats':
              this.showStats();
              break;
          case 'show-badges':
              this.showBadges();
              break;
          case 'show-settings':
              this.showSettings();
              break;
          case 'toggle-settings':
              this.toggleInGameSettings();
              break;
          case 'exit-game':
              this.pauseAndExit();
              break;
          case 'show-level-select':
              this.showLevelSelect();
              break;
          case 'retry-level':
              this.retryLevel();
              break;
          case 'resume-after-break':
              this.resumeAfterBreak();
              break;
          case 'start-game':
              const levelId = target.dataset.levelId;
              this.startGame(levelId);
              break;
      }
  }

  /**
   * Setup audio control UI
   */
  setupAudioControls() {
    const toggleMuteBtn = document.getElementById('toggleMute');
    if (toggleMuteBtn) {
        toggleMuteBtn.addEventListener('click', () => {
            this.audioManager.toggleMaster();
            this.updateAudioButtonStates();
        });
    }
    this.updateAudioButtonStates();
  }

  updateAudioButtonStates() {
      const audioState = this.audioManager.getState();
      const btn = document.getElementById('toggleMute');
      if (btn) {
          btn.textContent = audioState.masterMuted ? '🔇 Zvuk' : '🔊 Zvuk';
          btn.classList.toggle('muted', audioState.masterMuted);
      }
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

    // Handle specific screen setup
    const settingsToggle = document.getElementById("settingsToggle");
    if (screenName === SCREEN_NAMES.GAME) {
      if(settingsToggle) settingsToggle.style.display = "block";
    } else {
      if(settingsToggle) settingsToggle.style.display = "none";
      this.closeInGameSettings();
    }
  }

  /**
   * Show Home
   */
  showHome() {
    this.visualEffects.resetEffects();
    this.switchScreen(SCREEN_NAMES.HOME);
    this.audioManager.startBackgroundMusic();
  }

  /**
   * Show Level Select
   */
  showLevelSelect() {
    if (!this.selectedOp) {
        this.showHome();
        return;
    }

    this.switchScreen(SCREEN_NAMES.LEVEL_SELECT);

    // Update Title
    const opConfig = OPERATIONS[this.selectedOp.toUpperCase()];
    document.getElementById('levelSelectTitle').textContent = `${opConfig.label} - Razine`;

    // Generate Level Buttons
    this.generateLevelButtons();
  }

  /**
   * Generate level selection buttons
   */
  generateLevelButtons() {
    const selector = document.getElementById("levelSelector");
    selector.innerHTML = "";

    const levels = LEVELS_BY_OPERATION[this.selectedOp];
    const opProgress = this.statisticsManager.detailedStats.opsProgress[this.selectedOp] || {};

    levels.forEach(level => {
      const button = document.createElement("button");
      button.className = "level-button";
      button.dataset.action = "start-game";
      button.dataset.levelId = level.id;

      const levelStats = opProgress[level.id] || { stars: 0 };

      if (levelStats.stars > 0) {
          button.classList.add("completed");
      }

      button.innerHTML = `<div>${level.label}</div><small>${level.hint}</small>`;

      // Add stars
      if (levelStats.stars > 0) {
        const starsContainer = document.createElement("div");
        starsContainer.className = "level-stars";
        for (let s = 0; s < 3; s++) {
          const star = document.createElement("span");
          star.textContent = s < levelStats.stars ? "⭐" : "☆";
          starsContainer.appendChild(star);
        }
        button.appendChild(starsContainer);
      }

      selector.appendChild(button);
    });
  }

  /**
   * Start a new game
   */
  startGame(levelId) {
    this.pausedGameState = null;
    this.visualEffects.resetEffects();
    this.switchScreen(SCREEN_NAMES.GAME);

    // Get unlearned wrong answers for review injection
    // For V2: We can pass all unlearned for this OP, or specific to level
    // PRD says "Mistake learning tracking errors... re-introducing them".
    // We'll pass relevant unlearned questions.
    const unlearned = this.statisticsManager.getUnlearnedWrongAnswers(levelId);

    console.log(`🎯 Starting ${this.selectedOp} ${levelId} with ${unlearned.length} review items`);

    const question = this.gameEngine.startGame(
      this.selectedOp,
      levelId,
      unlearned
    );

    // Update UI
    const levels = LEVELS_BY_OPERATION[this.selectedOp];
    const levelConfig = levels.find(l => l.id === levelId);
    document.getElementById("currentLevelDisplay").textContent = levelConfig ? levelConfig.label : levelId;

    // Inject Hearts
    this.updateStrikesDisplay(0);

    // Start first question
    this.displayQuestion(question);
    this.updateGameDisplay();
    // this.startTimer(); // Optional per question or total? PRD says "Odgovori u zadanom vremenu".
    // I will implement per-question timer or total game timer? V1 had total game timer (15s).
    // PRD mentions "Timer bar (fills down)".
    // Let's stick to total timer for a "Round" of 10 questions for now, or per question?
    // "After X questions -> results".
    // V1 had 15s timer per GAME? Or per question?
    // V1 Config: TIMER_DURATION: 15000. It seems it was per game or reset per question?
    // V1 GameEngine had `handleTimeout`.
    // Let's implement Per-Question Timer for V2 as it makes more sense for "10 questions round".
    // Wait, V1 had `TIMER_DURATION` and `startTimer`. It seems it was a global timer for the round?
    // But `evaluateAnswer` checks `isGameComplete` (questions >= 10).
    // If timer runs out, `handleTimeout` is called.
    // Let's assume Per-Question timer for better UX in V2 (since kids need time to think, but not infinite).
    // Actually, "Score + bonus for streak" usually implies speed.
    // Let's stick to a generous Per-Question timer (e.g. 15s) reset on each question.
    this.startTimer();
  }

  /**
   * Display question
   */
  displayQuestion(question) {
    if (!question) return;

    let text = question.text;
    // Check if it's a review (not easily flagged in canonical unless meta has it)
    // Engine generates it. If engine injected review, it should be in meta?
    // I didn't add `isReview` flag to return of `generateQuestion` in GameEngine explicitly.
    // But GameEngine uses random gen mostly now.

    document.getElementById("questionText").textContent = text;

    const answersContainer = document.getElementById("answerButtons");
    answersContainer.innerHTML = "";

    question.options.forEach((answer) => {
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

    // Disable buttons
    const allButtons = document.querySelectorAll(".answer-button");
    allButtons.forEach((btn) => {
      btn.onclick = null;
      btn.style.cursor = "default";
    });

    const result = this.gameEngine.evaluateAnswer(selectedAnswer);
    const currentQuestion = this.gameEngine.currentQuestion;

    // Track result
    if (result.feedbackType === "correct") {
       this.audioManager.playGameEvent(result.gameStats.streak >= 3 ? "streak" : "correct");
       buttonElement.classList.add("correct-answer");
       this.showFeedback("✓", "correct");

       // Mark learned if applicable
       // If this was a review question (we need to know), we call markAsLearned.
       // Since we didn't explicitly flag review questions in this iteration,
       // we can just call markAsLearned for ANY correct answer?
       // No, that might mark random questions as learned (which is fine, they are learned).
       // But `markAsLearned` only affects existing WrongAnswer entries.
       // So it's safe to call it always on correct answer!
       this.statisticsManager.markAsLearned(currentQuestion);

    } else {
       this.audioManager.playGameEvent("incorrect");
       buttonElement.classList.add("wrong-answer");
       this.showFeedback("✗", "incorrect");

       // Track wrong answer
       this.statisticsManager.trackWrongAnswer(currentQuestion, selectedAnswer);

       // Highlight correct
       allButtons.forEach(btn => {
           if(parseInt(btn.textContent) === result.correctAnswer) {
               btn.classList.add("correct-answer");
           }
       });
    }

    this.updateGameDisplay();
    this.updateStrikesDisplay(result.strikes);
    this.visualEffects.updateStreakEffects(result.gameStats.streak);

    // Check Strikes
    if (result.strikes >= GAME_CONFIG.STRIKES_ALLOWED) {
        setTimeout(() => this.triggerMiniBreak(), 1000);
        return;
    }

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
   * Trigger Mini Break
   */
  triggerMiniBreak() {
      const overlay = document.getElementById('miniBreakOverlay');
      overlay.style.display = 'flex';
      this.gameEngine.resetStrikes(); // Reset logic strikes
      // Note: We might want to inject a review question here as per PRD "optionally inject 1 review question".
      // For now, just a pause.
  }

  /**
   * Resume after break
   */
  resumeAfterBreak() {
      const overlay = document.getElementById('miniBreakOverlay');
      overlay.style.display = 'none';

      this.updateStrikesDisplay(0);

      const nextQuestion = this.gameEngine.generateQuestion();
      this.displayQuestion(nextQuestion);
      this.startTimer();
  }

  /**
   * Update Strikes UI (Hearts)
   */
  updateStrikesDisplay(strikes) {
      const container = document.getElementById('strikesContainer');
      const max = GAME_CONFIG.STRIKES_ALLOWED;
      const remaining = max - strikes;

      let html = '';
      for(let i=0; i<max; i++) {
          if (i < remaining) html += '❤️ ';
          else html += '🖤 ';
      }
      container.innerHTML = html;
  }

  handleTimeout() {
      // Treat as incorrect
      // Reuse logic from selectAnswer but no button
      // Mock logic
      const result = this.gameEngine.evaluateAnswer(-999); // Invalid answer
      const currentQuestion = this.gameEngine.currentQuestion;

      this.audioManager.playGameEvent("timeout");
      this.showFeedback("⏰", "incorrect");

      this.statisticsManager.trackWrongAnswer(currentQuestion, -1);

      // Highlight correct
      const allButtons = document.querySelectorAll(".answer-button");
      allButtons.forEach(btn => {
           if(parseInt(btn.textContent) === result.correctAnswer) {
               btn.classList.add("correct-answer");
           }
      });

      this.updateGameDisplay();
      this.updateStrikesDisplay(result.strikes);

      if (result.strikes >= GAME_CONFIG.STRIKES_ALLOWED) {
        setTimeout(() => this.triggerMiniBreak(), 1000);
        return;
      }

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

  startTimer() {
    this.clearTimer();
    let timeLeft = GAME_CONFIG.TIMER_DURATION;
    const timerFill = document.getElementById("timerFill");
    timerFill.style.width = "100%";

    this.timerInterval = setInterval(() => {
      timeLeft -= GAME_CONFIG.TIMER_UPDATE_INTERVAL;
      const percentage = (timeLeft / GAME_CONFIG.TIMER_DURATION) * 100;
      timerFill.style.width = Math.max(0, percentage) + "%";

      if (timeLeft <= 0) {
        this.clearTimer();
        this.handleTimeout();
      }
    }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateGameDisplay() {
    const stats = this.gameEngine.getGameStats();
    document.getElementById("score").textContent = stats.score;
    document.getElementById("streak").textContent = stats.streak;
  }

  showFeedback(text, type) {
    const feedback = document.createElement("div");
    feedback.className = `feedback ${type}`;
    feedback.textContent = text;
    document.body.appendChild(feedback);

    setTimeout(() => {
      if (feedback.parentNode) feedback.remove();
    }, 1000);
  }

  endGame(gameStats) {
    this.clearTimer();
    this.audioManager.playGameEvent("level-complete");

    // Check Badges
    const newBadges = this.badgeSystem.checkBadges(gameStats);

    // Update Level Progress
    const performance = getPerformanceTier(gameStats.accuracy);
    this.statisticsManager.updateLevelProgress(
        gameStats.op,
        gameStats.levelId,
        performance.stars,
        gameStats.score
    );

    this.showLevelComplete(gameStats, performance, newBadges);
  }

  showLevelComplete(gameStats, performance, newBadges) {
    this.switchScreen(SCREEN_NAMES.LEVEL_COMPLETE);

    document.getElementById("resultEmoji").textContent = performance.emoji;
    document.getElementById("resultTitle").textContent = performance.title;
    document.getElementById("resultTitle").style.color = performance.color;

    document.getElementById("finalScore").textContent = gameStats.score;
    document.getElementById("finalAccuracy").textContent = gameStats.accuracy + "%";
    document.getElementById("finalMistakes").textContent = gameStats.questionsAnswered - gameStats.correctAnswers;

    // Stars
    const starsContainer = document.getElementById("resultStars");
    starsContainer.innerHTML = "";
    for(let i=0; i<3; i++) {
        const star = document.createElement("span");
        star.className = "star";
        star.textContent = i < performance.stars ? "⭐" : "☆";
        starsContainer.appendChild(star);
    }

    // Badges
    const badgesContainer = document.getElementById("newBadgesContainer");
    if (newBadges.length > 0) {
        badgesContainer.innerHTML = `🏆 Osvojeni bedževi: ${newBadges.map(b => b.icon).join(" ")}`;
        this.audioManager.playGameEvent("new-record");
    } else {
        badgesContainer.innerHTML = "";
    }
  }

  retryLevel() {
      this.startGame(this.gameEngine.currentLevelId);
  }

  showStats() {
      this.switchScreen(SCREEN_NAMES.STATS);
      const statsContent = document.getElementById("statsContent");
      const stats = this.statisticsManager.detailedStats;
      
      // Calculate total stats
      let totalStars = 0;
      let completedLevels = 0;
      Object.values(stats.opsProgress).forEach(op => {
          Object.values(op).forEach(l => {
              totalStars += l.stars;
              if (l.completed) completedLevels++;
          });
      });
      
      statsContent.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h4>⭐ Ukupno Zvjezdica</h4>
                <p>${totalStars}</p>
            </div>
            <div class="stat-card">
                <h4>✅ Završeni Leveli</h4>
                <p>${completedLevels}</p>
            </div>
             <div class="stat-card">
                <h4>⏱️ Vrijeme Igranja</h4>
                <p>${Math.round(stats.totalPlaytimeMinutes)} min</p>
            </div>
            <div class="stat-card">
                <h4>📚 Za Vježbu</h4>
                <p>${this.statisticsManager.getTotalUnlearnedCount()}</p>
            </div>
        </div>
      `;
  }

  showBadges() {
      this.switchScreen(SCREEN_NAMES.BADGES);
      const grid = document.getElementById("badgesGrid");
      grid.innerHTML = "";
      
      const unlocked = this.statisticsManager.detailedStats.badges || [];
      
      Object.values(BADGES).forEach(badge => {
          const isUnlocked = unlocked.includes(badge.id);
          const el = document.createElement("div");
          el.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
          el.innerHTML = `
              <div class="badge-icon">${badge.icon}</div>
              <div class="badge-title">${badge.title}</div>
          `;
          grid.appendChild(el);
      });
  }

  showSettings() {
      this.switchScreen(SCREEN_NAMES.SETTINGS);
  }

  toggleInGameSettings() {
      const panel = document.getElementById("settingsPanel");
      if (panel) panel.classList.toggle("open");
  }

  closeInGameSettings() {
      const panel = document.getElementById("settingsPanel");
      if (panel) panel.classList.remove("open");
  }

  pauseAndExit() {
      this.showHome();
  }

}

// Initialize and expose global instance
const mathNinja = new MathNinjaApp();
window.mathNinja = mathNinja;

export default mathNinja;
