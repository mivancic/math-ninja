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
    this.selectedOp = null; // 'add', 'sub', 'mul', 'div', 'mixed'

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

      // Resume Modal Handlers
      document.getElementById('btnResumeYes').addEventListener('click', () => {
          this.resumeGame();
          document.getElementById('resumeModal').style.display = 'none';
      });

      document.getElementById('btnResumeNo').addEventListener('click', () => {
          this.statisticsManager.clearGameState(this.selectedOp);
          // If we came from Level Select, we don't have levelId context here for "New Game"
          // unless we store pendingLevelId.
          // Better UX: "New Game" just closes modal and lets user pick level (if in level select)
          // or starts specific level if we have context.
          // Since resume check is usually before level select or after clicking an op?
          // Let's implement Resume Check when clicking Op Button.
          // If resume accepted -> game. If not -> show level select.

          document.getElementById('resumeModal').style.display = 'none';
          this.showLevelSelect();
      });
  }

  /**
   * Handle UI actions
   */
  handleAction(action, target) {
      switch(action) {
          case 'select-op':
              this.selectedOp = target.dataset.op;
              this.checkResumeAndNavigate();
              break;
          case 'start-mixed':
              this.selectedOp = 'mixed';
              this.checkResumeAndNavigate();
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
   * Check for saved game and prompt resume or show level select
   */
  checkResumeAndNavigate() {
      const savedState = this.statisticsManager.loadGameState(this.selectedOp);

      if (savedState) {
          // Show Resume Modal
          document.getElementById('resumeModal').style.display = 'flex';
      } else {
          // If Mixed, start immediately (no level select)
          if (this.selectedOp === 'mixed') {
              this.startGame('mixed');
          } else {
              this.showLevelSelect();
          }
      }
  }

  resumeGame() {
      const savedState = this.statisticsManager.loadGameState(this.selectedOp);
      if (!savedState) return;

      this.switchScreen(SCREEN_NAMES.GAME);
      this.visualEffects.resetEffects();

      const currentQuestion = this.gameEngine.restoreGame(savedState);

      // Update UI
      if (this.selectedOp === 'mixed') {
          document.getElementById("currentLevelDisplay").textContent = "Dnevni Izazov (Mix)";
      } else {
          const levels = LEVELS_BY_OPERATION[this.selectedOp];
          const levelConfig = levels.find(l => l.id === this.gameEngine.currentLevelId);
          document.getElementById("currentLevelDisplay").textContent = levelConfig ? levelConfig.label : this.gameEngine.currentLevelId;
      }

      this.updateStrikesDisplay(savedState.strikes);
      this.updateGameDisplay();
      this.displayQuestion(currentQuestion);
      this.startTimer();
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

    // Update Global Stats on Home Screen
    // Assuming we have total score in detailed stats? Yes, I added logic. But wait, `detailedStats` in `StatisticsManager` didn't have `totalScore`.
    // It has `opsProgress`. I need to sum it up.
    // Or I can use `this.statisticsManager.getComprehensiveStats()` if I update it to include score.
    // Let's calculate on the fly.

    const stats = this.statisticsManager.detailedStats;
    let totalScore = 0;
    Object.values(stats.opsProgress).forEach(op => {
        Object.values(op).forEach(l => {
            totalScore += l.bestScore || 0; // Simplified total score logic (sum of best scores)
            // Or should we track cumulative total score separately?
            // V1 had `stats.totalScore`.
            // Let's use `stats.totalScore` if available, or just calculate.
            // My previous refactor of stats manager might have missed explicit totalScore accumulator for V2 actions.
            // `updateLevelProgress` updates `bestScore`.
            // Let's just sum best scores for now as "Total Score".
        });
    });

    document.getElementById("globalTotalScore").textContent = totalScore;

    // Best Badge
    const badges = stats.badges || [];
    const bestBadgeId = badges.length > 0 ? badges[badges.length - 1] : null;
    const bestBadge = bestBadgeId ? Object.values(BADGES).find(b => b.id === bestBadgeId) : null;
    document.getElementById("globalBestBadge").textContent = bestBadge ? bestBadge.icon : "-";

    // Update Op Progress Indicators
    this.updateOpProgress("add");
    this.updateOpProgress("sub");
    this.updateOpProgress("mul");
    this.updateOpProgress("div");
  }

  updateOpProgress(op) {
      const el = document.getElementById(`progress-${op}`);
      if (!el) return;

      const opStats = this.statisticsManager.detailedStats.opsProgress[op] || {};
      const levels = LEVELS_BY_OPERATION[op];

      // Calculate current level (highest completed + 1)
      let highestCompletedIndex = -1;
      let totalStars = 0;

      levels.forEach((l, idx) => {
          const lStats = opStats[l.id];
          if (lStats && lStats.completed) {
              highestCompletedIndex = idx;
          }
          if (lStats) totalStars += lStats.stars;
      });

      const currentLevelIndex = Math.min(highestCompletedIndex + 1, levels.length - 1);
      const currentLevelLabel = levels[currentLevelIndex].label; // e.g. "Do 20"

      // Display: "L2 - 5⭐" or similar
      el.textContent = `L${currentLevelIndex + 1} • ${totalStars}⭐`;
  }

  /**
   * Show Level Select
   */
  showLevelSelect() {
    if (!this.selectedOp || this.selectedOp === 'mixed') {
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

    // Clear any previous saved game for this op since we are starting fresh
    this.statisticsManager.clearGameState(this.selectedOp);

    // Get unlearned wrong answers for review injection
    // For V2: We can pass all unlearned for this OP, or specific to level
    // PRD says "Mistake learning tracking errors... re-introducing them".
    // We'll pass relevant unlearned questions.
    let unlearned = [];
    if (levelId === 'mixed') {
        unlearned = this.statisticsManager.getAllUnlearnedWrongAnswers();
    } else {
        unlearned = this.statisticsManager.getUnlearnedWrongAnswers(levelId);
    }

    console.log(`🎯 Starting ${this.selectedOp} ${levelId} with ${unlearned.length} review items`);

    const question = this.gameEngine.startGame(
      this.selectedOp,
      levelId,
      unlearned
    );

    // Update UI
    if (levelId === 'mixed') {
        document.getElementById("currentLevelDisplay").textContent = "Dnevni Izazov (Mix)";
    } else {
        const levels = LEVELS_BY_OPERATION[this.selectedOp];
        const levelConfig = levels.find(l => l.id === levelId);
        document.getElementById("currentLevelDisplay").textContent = levelConfig ? levelConfig.label : levelId;
    }

    // Inject Hearts
    this.updateStrikesDisplay(0);

    // Start first question
    this.displayQuestion(question);
    this.updateGameDisplay();
    this.startTimer();
  }

  /**
   * Display question
   */
  displayQuestion(question) {
    if (!question) return;

    let text = question.text;
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

    // Save State on every move
    this.saveCurrentGameState();

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

  saveCurrentGameState() {
      // Don't save if game over
      if (!this.gameEngine.isGameActive) {
          this.statisticsManager.clearGameState(this.selectedOp);
          return;
      }
      this.statisticsManager.saveGameState(this.selectedOp, this.gameEngine.getGameStats());
  }

  /**
   * Trigger Mini Break
   */
  triggerMiniBreak() {
      const overlay = document.getElementById('miniBreakOverlay');
      overlay.style.display = 'flex';
      this.gameEngine.resetStrikes(); // Reset logic strikes
      this.saveCurrentGameState(); // Save state with reset strikes
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
      const result = this.gameEngine.evaluateAnswer(-999); // Invalid answer
      const currentQuestion = this.gameEngine.currentQuestion;

      this.audioManager.playGameEvent("timeout");
      this.showFeedback("⏰", "incorrect");

      this.statisticsManager.trackWrongAnswer(currentQuestion, -1);

      const allButtons = document.querySelectorAll(".answer-button");
      allButtons.forEach(btn => {
           if(parseInt(btn.textContent) === result.correctAnswer) {
               btn.classList.add("correct-answer");
           }
      });

      this.updateGameDisplay();
      this.updateStrikesDisplay(result.strikes);

      this.saveCurrentGameState();

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

    // Clear saved game
    this.statisticsManager.clearGameState(this.selectedOp);

    // Check Badges
    const newBadges = this.badgeSystem.checkBadges(gameStats);

    // Update Level Progress (only if not mixed, or maybe we track mixed scores separate?)
    // Currently tracking per levelId. If levelId='mixed', we might need to handle it.
    // Let's assume we don't track 'stars' for Mixed mode in the same way, or just don't save progress map for 'mixed'.
    // Or we can save it under 'mixed' op.
    if (gameStats.op !== 'mixed') {
        const performance = getPerformanceTier(gameStats.accuracy);
        this.statisticsManager.updateLevelProgress(
            gameStats.op,
            gameStats.levelId,
            performance.stars,
            gameStats.score
        );
        this.showLevelComplete(gameStats, performance, newBadges);
    } else {
        // Just show results for mixed
        const performance = getPerformanceTier(gameStats.accuracy);
        this.showLevelComplete(gameStats, performance, newBadges);
    }
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
      // If mixed, just start new mixed
      if (this.gameEngine.currentOp === 'mixed') {
          this.startGame('mixed');
      } else {
          this.startGame(this.gameEngine.currentLevelId);
      }
  }

  showStats() {
      this.switchScreen(SCREEN_NAMES.STATS);
      const statsContent = document.getElementById("statsContent");
      const stats = this.statisticsManager.detailedStats;
      
      // Calculate total stats
      let totalStars = 0;
      let completedLevels = 0;
      let bestMixedScore = 0;

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

        <h3 style="margin-top:20px;">Napredak po Operacijama</h3>
        ${this.renderOpStats('add', 'Zbrajanje')}
        ${this.renderOpStats('sub', 'Oduzimanje')}
        ${this.renderOpStats('mul', 'Množenje')}
        ${this.renderOpStats('div', 'Dijeljenje')}
      `;
  }

  renderOpStats(op, label) {
      const stats = this.statisticsManager.detailedStats.opsProgress[op] || {};
      const levels = LEVELS_BY_OPERATION[op];
      let html = `<div class="stats-section"><h4>${label}</h4><div class="level-progress-grid">`;

      levels.forEach(l => {
          const lStat = stats[l.id] || { stars: 0 };
          html += `
            <div class="level-progress-item">
                <h5>${l.label}</h5>
                <div class="level-progress-stars">
                    ${'⭐'.repeat(lStat.stars)}${'☆'.repeat(3 - lStat.stars)}
                </div>
            </div>
          `;
      });

      html += `</div></div>`;
      return html;
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
      this.saveCurrentGameState();
      this.showHome();
  }

}

// Initialize and expose global instance
const mathNinja = new MathNinjaApp();
window.mathNinja = mathNinja;

export default mathNinja;
