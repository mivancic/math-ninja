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
    this.activeTimeouts = []; // Timeout Manager
    this.pausedGameState = null;

    // UI State
    this.selectedOp = null; // 'add', 'sub', 'mul', 'div', 'mixed'
    this.isBattleMode = false; // Flag for battle mode
    this.battleTargetScore = 0; // Target score for battle
    this.battleChallenger = ""; // Name of challenger

    // Initialize app
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    await this.audioManager.init();
    this.checkPlayerName();
    this.setupAudioControls();
    this.setupEventListeners();
    this.checkBattleMode(); // Check if launched with battle challenge
    this.showHome();
    console.log("🥷 Math Ninja 2.0 initialized!");
  }

  // --- TIMEOUT MANAGER ---
  setTimeoutManaged(callback, delay) {
      const id = setTimeout(callback, delay);
      this.activeTimeouts.push(id);
      return id;
  }

  clearAllTimeouts() {
      this.activeTimeouts.forEach(id => clearTimeout(id));
      this.activeTimeouts = [];
  }
  // -----------------------

  checkPlayerName() {
      const name = this.statisticsManager.getPlayerName();
      const nameDisplay = document.getElementById("playerNameDisplay");
      if (nameDisplay) {
          nameDisplay.textContent = name || "Mali Ninja";
      }
  }

  checkBattleMode() {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'battle') {
          const scoreToBeat = parseInt(urlParams.get('score'));
          const op = urlParams.get('op');
          const levelId = urlParams.get('level');
          const challenger = urlParams.get('challenger') || 'Ninja';

          if (scoreToBeat && op && levelId) {
              this.battleTargetScore = scoreToBeat;
              this.battleChallenger = challenger;

              // Prepare modal content
              document.getElementById("battleChallengerName").textContent = challenger;
              document.getElementById("battleTargetScore").textContent = scoreToBeat;

              const opName = OPERATIONS[op.toUpperCase()] ? OPERATIONS[op.toUpperCase()].label : op;
              const levelLabel = levelId; // Ideally look up label, but ID is fine for now
              document.getElementById("battleDetails").textContent = `${opName} - ${levelLabel}`;

              // Show Modal
              document.getElementById("battleStartModal").style.display = "flex";

              // Setup Start Button
              const startBtn = document.getElementById("btnBattleStart");
              startBtn.onclick = () => {
                  this.selectedOp = op;
                  this.isBattleMode = true;
                  document.getElementById("battleStartModal").style.display = "none";
                  this.startGame(levelId);
              };
          }
      }
  }

  /**
   * Setup global event listeners (Event Delegation)
   */
  setupEventListeners() {
      document.addEventListener('click', (e) => {
          const target = e.target.closest('[data-action]');
          if (!target) return;

          const action = target.dataset.action;
          this.handleAction(action, target);
      });

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
          document.getElementById('resumeModal').style.display = 'none';
          this.showLevelSelect();
      });

      // Battle Modal Close (Cancel)
      // If we want a cancel button? User can just close tab or navigate away.
      // But let's assume they might want to decline.

      // Name Edit
      const nameDisplay = document.getElementById("playerNameDisplay");
      if (nameDisplay) {
          nameDisplay.addEventListener('click', () => {
              const newName = prompt("Unesi svoje ime:", this.statisticsManager.getPlayerName() || "");
              if (newName) {
                  this.statisticsManager.setPlayerName(newName);
                  nameDisplay.textContent = newName;
              }
          });
      }
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
              this.startMainDailyChallenge();
              break;
          case 'start-op-challenge':
              this.startOpDailyChallenge();
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
          case 'challenge-friend':
              this.shareChallenge();
              break;
          case 'start-game':
              const levelId = target.dataset.levelId;
              if (target.classList.contains('locked')) return;
              this.startGame(levelId);
              break;
          case 'close-modal':
              const modalId = target.dataset.target;
              if (modalId) document.getElementById(modalId).style.display = 'none';
              break;
      }
  }

  /**
   * Check for saved game and prompt resume or show level select
   */
  checkResumeAndNavigate() {
      const savedState = this.statisticsManager.loadGameState(this.selectedOp);

      if (savedState) {
          document.getElementById('resumeModal').style.display = 'flex';
      } else {
          if (this.selectedOp === 'mixed') {
               // This case should be handled by startMainDailyChallenge usually
              this.startMainDailyChallenge();
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

      this.updateGameHeader();
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
    // FIX: Clear timer AND timeouts when navigating away
    if (screenName !== SCREEN_NAMES.GAME) {
        this.clearTimer();
        this.clearAllTimeouts();
    }

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
    this.isBattleMode = false;

    this.switchScreen(SCREEN_NAMES.HOME);
    this.audioManager.startBackgroundMusic();
    this.checkPlayerName();

    // Update Stats
    const stats = this.statisticsManager.detailedStats;
    let totalScore = 0;
    Object.values(stats.opsProgress).forEach(op => {
        Object.values(op).forEach(l => {
            totalScore += l.bestScore || 0;
        });
    });

    document.getElementById("globalTotalScore").textContent = totalScore;

    const badges = stats.badges || [];
    const bestBadgeId = badges.length > 0 ? badges[badges.length - 1] : null;
    const bestBadge = bestBadgeId ? Object.values(BADGES).find(b => b.id === bestBadgeId) : null;
    document.getElementById("globalBestBadge").textContent = bestBadge ? bestBadge.icon : "-";

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

    this.isBattleMode = false;

    this.switchScreen(SCREEN_NAMES.LEVEL_SELECT);

    const opConfig = OPERATIONS[this.selectedOp.toUpperCase()];
    document.getElementById('levelSelectTitle').textContent = `${opConfig.label}`;

    // Op Daily Challenge: Show if unlockedCount > 0
    const unlockedCount = LEVELS_BY_OPERATION[this.selectedOp].filter(l => this.statisticsManager.isLevelUnlocked(this.selectedOp, l.id)).length;

    const challengeBtn = document.getElementById("opDailyChallengeBtn");
    if (challengeBtn) {
        if (unlockedCount > 0) {
             challengeBtn.style.display = 'block';
             challengeBtn.innerHTML = `📅 Dnevni Izazov (${opConfig.label})`;
        } else {
             challengeBtn.style.display = 'none';
        }
    }

    this.generateLevelButtons();
  }

  // --- DAILY CHALLENGES ---

  startOpDailyChallenge() {
      // 1. Filter: "smiju biti samo prijeđeni leveli iz te operacije (min jedna zvjezdica)"
      //    User Requirement: "Only Passed Levels".
      const opProgress = this.statisticsManager.detailedStats.opsProgress[this.selectedOp] || {};

      const passedLevels = LEVELS_BY_OPERATION[this.selectedOp]
          .filter(l => {
              const stats = opProgress[l.id];
              return stats && stats.stars >= 1; // Completed/Passed
          })
          .map(l => l.id);

      if (passedLevels.length === 0) {
          // Warning Modal if no levels passed
          alert("Moraš proći barem jedan level (minimalno 1 zvjezdica) da bi otključao Dnevni Izazov!");
          return;
      }

      this.startGame('mixed', passedLevels);
  }

  startMainDailyChallenge() {
      this.selectedOp = 'mixed';
      // 2. Filter: "mix pitanja iz svih operacija ali samo iz otkljucanih levela"
      //    User Requirement: "Only Unlocked Levels" (from all ops).

      let allUnlocked = [];

      Object.values(OPERATIONS).forEach(opConfig => {
          const op = opConfig.id;
          const unlocked = LEVELS_BY_OPERATION[op]
              .filter(l => this.statisticsManager.isLevelUnlocked(op, l.id))
              .map(l => l.id);
          allUnlocked = allUnlocked.concat(unlocked);
      });

      if (allUnlocked.length === 0) {
           // Should ideally not happen as L1 is unlocked by default
           alert("Nema otključanih levela!");
           return;
      }

      this.startGame('mixed', allUnlocked);
  }

  // -------------------------

  /**
   * Generate level selection buttons
   */
  generateLevelButtons() {
    const selector = document.getElementById("levelSelector");
    selector.innerHTML = "";

    const levels = LEVELS_BY_OPERATION[this.selectedOp];
    const opProgress = this.statisticsManager.detailedStats.opsProgress[this.selectedOp] || {};

    levels.forEach(level => {
      const isUnlocked = this.statisticsManager.isLevelUnlocked(this.selectedOp, level.id);

      const button = document.createElement("button");
      button.className = `level-button ${isUnlocked ? '' : 'locked'}`;

      if (isUnlocked) {
          button.dataset.action = "start-game";
          button.dataset.levelId = level.id;
      }

      const levelStats = opProgress[level.id] || { stars: 0 };

      if (levelStats.completed) {
          button.classList.add("completed");
      }

      let content = `<div>${level.label}</div><small>${level.hint}</small>`;

      if (!isUnlocked) {
          content += `<div class="lock-icon">🔒</div>`;
      } else if (levelStats.stars > 0) {
        content += `<div class="level-stars">`;
        for (let s = 0; s < 3; s++) {
          content += s < levelStats.stars ? "<span>⭐</span>" : "<span>☆</span>";
        }
        content += `</div>`;
      } else {
         content += `<div class="level-stars">☆☆☆</div>`;
      }

      button.innerHTML = content;
      selector.appendChild(button);
    });
  }

  /**
   * Start a new game
   */
  startGame(levelId, unlockedLevels = []) {
    this.pausedGameState = null;
    this.visualEffects.resetEffects();
    this.switchScreen(SCREEN_NAMES.GAME);

    this.statisticsManager.clearGameState(this.selectedOp);

    let unlearned = [];
    if (levelId === 'mixed') {
        unlearned = this.statisticsManager.getAllUnlearnedWrongAnswers();
    } else {
        unlearned = this.statisticsManager.getUnlearnedWrongAnswers(levelId);
    }

    console.log(`🎯 Starting ${this.selectedOp} ${levelId}`);

    const question = this.gameEngine.startGame(
      this.selectedOp,
      levelId,
      unlearned,
      unlockedLevels
    );

    this.updateGameHeader(levelId);
    this.updateStrikesDisplay(0);
    this.displayQuestion(question);
    this.updateGameDisplay();
    this.startTimer();
  }

  updateGameHeader(levelId) {
    const headerEl = document.getElementById("currentLevelDisplay");

    if (this.isBattleMode) {
        // Battle Mode Indicator
        headerEl.innerHTML = `<span style="color:#ff4500;">⚔️ BATTLE MODE</span>`;
    } else if (this.gameEngine.currentLevelId === 'mixed') {
        const opLabel = (this.selectedOp === 'mixed') ? 'Mix' : OPERATIONS[this.selectedOp.toUpperCase()].label;
        headerEl.textContent = `Izazov (${opLabel})`;
    } else {
        const levels = LEVELS_BY_OPERATION[this.selectedOp];
        const levelConfig = levels.find(l => l.id === this.gameEngine.currentLevelId);
        headerEl.textContent = levelConfig ? levelConfig.label : this.gameEngine.currentLevelId;
    }
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

    if (result.feedbackType === "correct") {
       this.audioManager.playGameEvent(result.gameStats.streak >= 3 ? "streak" : "correct");
       buttonElement.classList.add("correct-answer");

       if (result.isRetry) {
           this.showFeedback("Točno! (Ispravak)", "correct");
       } else {
           this.showFeedback("✓", "correct");
       }

       if (!result.isRetry) {
           this.statisticsManager.markAsLearned(currentQuestion);
       }

    } else {
       this.audioManager.playGameEvent("incorrect");
       buttonElement.classList.add("wrong-answer");
       this.showFeedback("✗", "incorrect");

       this.statisticsManager.trackWrongAnswer(currentQuestion, selectedAnswer);

       allButtons.forEach(btn => {
           if(parseInt(btn.textContent) === result.correctAnswer) {
               btn.classList.add("correct-answer");
           }
       });
    }

    this.updateGameDisplay();
    this.updateStrikesDisplay(result.strikes);
    this.visualEffects.updateStreakEffects(result.gameStats.streak);
    this.saveCurrentGameState();

    if (result.strikes >= GAME_CONFIG.STRIKES_ALLOWED) {
        // Use Managed Timeout
        this.setTimeoutManaged(() => this.triggerMiniBreak(), 1000);
        return;
    }

    if (result.isGameComplete) {
      // Use Managed Timeout
      this.setTimeoutManaged(() => this.endGame(result.gameStats), GAME_CONFIG.NEXT_QUESTION_DELAY);
    } else {
      // Use Managed Timeout
      this.setTimeoutManaged(() => {
        const nextQuestion = this.gameEngine.generateQuestion();
        this.displayQuestion(nextQuestion);
        this.startTimer();
      }, GAME_CONFIG.NEXT_QUESTION_DELAY);
    }
  }

  saveCurrentGameState() {
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
      this.gameEngine.resetStrikes();
      this.saveCurrentGameState();
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
        this.setTimeoutManaged(() => this.triggerMiniBreak(), 1000);
        return;
      }

      if (result.isGameComplete) {
        this.setTimeoutManaged(() => this.endGame(result.gameStats), GAME_CONFIG.NEXT_QUESTION_DELAY);
      } else {
        this.setTimeoutManaged(() => {
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

    // Add Battle Target Display
    if (this.isBattleMode) {
        const scoreEl = document.getElementById("score");
        scoreEl.innerHTML = `${stats.score} <small>(Cilj: ${this.battleTargetScore})</small>`;
    }
  }

  showFeedback(text, type) {
    const feedback = document.createElement("div");
    feedback.className = `feedback ${type}`;
    feedback.textContent = text;
    document.body.appendChild(feedback);

    this.setTimeoutManaged(() => {
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

    // BATTLE MODE END
    if (this.isBattleMode) {
        this.showBattleResult(gameStats);
        // Reset Battle Mode Flag handled inside showBattleResult cleanup or navigation
        return;
    }

    // Standard End Game
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
        const performance = getPerformanceTier(gameStats.accuracy);
        this.showLevelComplete(gameStats, performance, newBadges);
    }
  }

  showBattleResult(gameStats) {
      const won = gameStats.score > this.battleTargetScore;

      document.getElementById("battleResultTitle").textContent = won ? "POBJEDA! 🎉" : "PORAZ 😔";
      document.getElementById("battleResultTitle").style.color = won ? "#4caf50" : "#f44336";

      document.getElementById("battleResultScore").textContent = `Tvoj rezultat: ${gameStats.score}`;
      document.getElementById("battleTargetScoreDisplay").textContent = `Cilj (${this.battleChallenger}): ${this.battleTargetScore}`;

      document.getElementById("battleResultModal").style.display = 'flex';

      // Setup Share Revenge Button
      const shareBtn = document.getElementById("btnShareRevenge");
      shareBtn.onclick = () => {
          this.lastGameStats = gameStats;
          this.shareChallenge();
      };

      // Cleanup on close handled by navigation actions
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

    // Add "Challenge Friend" button
    const actionContainer = document.querySelector(".level-complete-actions");
    if (!document.getElementById("btnChallenge")) {
        const btn = document.createElement("button");
        btn.id = "btnChallenge";
        btn.className = "action-button secondary";
        btn.innerHTML = "⚔️ Izazovi Prijatelja";
        btn.dataset.action = "challenge-friend";
        actionContainer.insertBefore(btn, actionContainer.lastElementChild);
    }

    this.lastGameStats = gameStats;
  }

  shareChallenge() {
      if (!this.lastGameStats) return;

      const stats = this.lastGameStats;
      const name = this.statisticsManager.getPlayerName() || "Ninja";
      const baseUrl = window.location.origin + window.location.pathname;
      const params = new URLSearchParams({
          mode: 'battle',
          score: stats.score,
          op: stats.op,
          level: stats.levelId,
          challenger: name
      });

      const url = `${baseUrl}?${params.toString()}`;

      navigator.clipboard.writeText(url).then(() => {
          alert("Link za izazov kopiran! Pošalji ga prijatelju.");
      }).catch(err => {
          console.error('Could not copy text: ', err);
          prompt("Kopiraj ovaj link i pošalji prijatelju:", url);
      });
  }

  retryLevel() {
      if (this.gameEngine.currentOp === 'mixed') {
          if (this.gameEngine.currentLevelId === 'mixed') {
             // Re-run the appropriate challenge type
             // Since startGame sets currentOp='mixed' for both, we need to know source.
             // But we don't track source type easily.
             // HOWEVER, we can just restart with the SAME unlockedLevels/list.
             // `gameEngine.unlockedLevels` has the list.
             // So we call startGame with it.
             this.startGame('mixed', this.gameEngine.unlockedLevels);
          } else {
             this.startGame(this.gameEngine.currentLevelId);
          }
      } else {
          this.startGame(this.gameEngine.currentLevelId);
      }
  }

  showStats() {
      this.switchScreen(SCREEN_NAMES.STATS);
      const statsContent = document.getElementById("statsContent");
      const stats = this.statisticsManager.detailedStats;
      
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
          const isUnlocked = this.statisticsManager.isLevelUnlocked(op, l.id);
          const lockedClass = isUnlocked ? '' : 'locked-stat';
          const icon = isUnlocked ? '' : '🔒';

          html += `
            <div class="level-progress-item ${lockedClass}">
                <h5>${l.label} ${icon}</h5>
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
      this.clearTimer();
      this.clearAllTimeouts(); // CRITICAL FIX
      this.saveCurrentGameState();
      this.showHome();
  }

}

// Initialize and expose global instance
const mathNinja = new MathNinjaApp();
window.mathNinja = mathNinja;

export default mathNinja;
