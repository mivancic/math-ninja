/**
 * Math Ninja - Retry Challenge System
 * @fileoverview System for offering retry challenges after wrong answers
 */

import { GAME_CONFIG, FEEDBACK_TYPES } from "./config.js";

export class RetryChallengeSystem {
  constructor(statisticsManager, audioManager, gameEngine) {
    this.statisticsManager = statisticsManager;
    this.audioManager = audioManager;
    this.gameEngine = gameEngine;
    this.pendingRetries = []; // Queue of wrong answers to retry (current session only)
    this.correctAnswersCount = 0; // Counter for triggering retries
    this.isRetryMode = false;
    this.currentRetryQuestion = null;
    this.retryCallback = null;

    console.log("🔄 Retry Challenge System initialized");
  }

  /**
   * Track a wrong answer in statistics only (no longer used for retry queue)
   */
  trackWrongAnswer(level, question, wrongAnswer, correctAnswer) {
    // Add to statistics tracking only with operation
    this.statisticsManager.trackWrongAnswer(
      level,
      question,
      wrongAnswer,
      correctAnswer,
      question.operation
    );

    console.log(
      `📊 Wrong answer tracked in statistics: ${
        question.question || `${question.num1} × ${question.num2}`
      }`
    );
  }

  /**
   * Track a correct answer and check if retry should be offered
   */
  trackCorrectAnswer() {
    this.correctAnswersCount++;

    // Don't automatically offer retry challenge here - let app.js handle the timing
    console.log(
      `🔄 Correct answer tracked. Count: ${this.correctAnswersCount}`
    );
  }

  /**
   * Offer a retry challenge to the user
   */
  offerRetryChallenge() {
    // Get current session wrong answers
    const currentSessionWrongAnswers =
      this.gameEngine?.getCurrentSessionWrongAnswers() || [];

    if (currentSessionWrongAnswers.length === 0) {
      console.log("🔄 No current session wrong answers available for retry");
      return;
    }

    // Get the most recent wrong answer from current session
    const retryData =
      currentSessionWrongAnswers[currentSessionWrongAnswers.length - 1];

    if (retryData && retryData.num1 != null && retryData.num2 != null) {
      console.log(
        `🔄 Offering retry for: ${retryData.num1} × ${retryData.num2} (${currentSessionWrongAnswers.length} available)`
      );
    } else {
      console.log(`🔄 Offering retry for a previous question`);
    }

    // Convert to expected format
    // Build formatted data with safe fallbacks, and reconstruct for division
    const formattedRetryData = {
      level: this.gameEngine?.currentLevel || 1,
      question: {
        num1: retryData.num1,
        num2: retryData.num2,
        correctAnswer: retryData.correctAnswer,
        operation: retryData.operation,
        dividend: retryData.dividend,
        divisor: retryData.divisor,
        question: retryData.question, // Display question string
      },
      wrongAnswer: retryData.wrongAnswer,
      timestamp: retryData.timestamp,
      attempts: 0,
    };

    // If num1/num2 were not present (e.g., earlier bug) but we have division parts on the currentQuestion
    if (
      (formattedRetryData.question.num1 == null ||
        formattedRetryData.question.num2 == null) &&
      this.gameEngine?.currentQuestionData
    ) {
      const qd = this.gameEngine.currentQuestionData;
      if (qd.num1 != null && qd.num2 != null) {
        formattedRetryData.question.num1 = qd.num1;
        formattedRetryData.question.num2 = qd.num2;
      } else if (qd.dividend != null && qd.divisor != null) {
        // Reconstruct divisor × quotient for division
        formattedRetryData.question.num1 = qd.divisor;
        formattedRetryData.question.num2 = Math.round(qd.dividend / qd.divisor);
      }
    }

    // Show retry challenge notification
    this.showRetryNotification(formattedRetryData);
  }

  /**
   * Show retry challenge notification
   */
  showRetryNotification(retryData) {
    const notification = document.createElement("div");
    notification.className = "retry-notification";
    const isDivision =
      retryData.question.operation === GAME_CONFIG.OPERATIONS.DIVISION &&
      Number.isFinite(retryData.question.dividend) &&
      Number.isFinite(retryData.question.divisor);

    let taskText;
    if (isDivision) {
      taskText = `${retryData.question.dividend} ÷ ${retryData.question.divisor}`;
    } else if (retryData.question.question) {
      // Use the formatted question text for addition/subtraction/other operations
      taskText = retryData.question.question;
    } else {
      // Fallback to multiplication format
      taskText = `${retryData.question.num1} × ${retryData.question.num2}`;
    }
    notification.innerHTML = `
      <div class="retry-content">
        <h3>🎯 Pokušaj ponovno!</h3>
        <p>Želiš li ponovno pokušati riješiti:<br><strong>${taskText}</strong>?</p>
        <div class="retry-buttons">
          <button class="retry-btn retry-accept" onclick="window.mathNinja.retrySystem.acceptRetryChallenge()">
            ✓ Da, pokušat ću!
          </button>
          <button class="retry-btn retry-decline" onclick="window.mathNinja.retrySystem.declineRetryChallenge()">
            ✗ Ne, nastavi igru
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Play notification sound
    this.audioManager?.playUISound("notification");

    // Store current retry question
    this.currentRetryQuestion = retryData;

    // Auto-decline after 8 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        this.declineRetryChallenge();
      }
    }, 8000);

    console.log("🔄 Retry challenge notification shown");
  }

  /**
   * Accept retry challenge
   */
  acceptRetryChallenge() {
    if (!this.currentRetryQuestion) return;

    this.removeRetryNotification();
    this.audioManager?.playUISound("accept");

    // Start retry mode
    this.isRetryMode = true;
    this.currentRetryQuestion.attempts++;

    // Generate retry question with answer options
    const retryQuestion = this.generateRetryQuestion(this.currentRetryQuestion);

    // Show retry challenge interface
    this.showRetryChallenge(retryQuestion);

    console.log("🔄 Retry challenge accepted");
  }

  /**
   * Decline retry challenge
   */
  declineRetryChallenge() {
    this.removeRetryNotification();
    this.currentRetryQuestion = null;
    this.correctAnswersCount = 0; // Reset counter

    // Continue with normal game flow
    if (this.retryCallback) {
      this.retryCallback();
      this.retryCallback = null;
    }

    console.log("🔄 Retry challenge declined");
  }

  /**
   * Remove retry notification from DOM
   */
  removeRetryNotification() {
    const notification = document.querySelector(".retry-notification");
    if (notification) {
      notification.remove();
    }
  }

  /**
   * Generate retry question with answer options
   */
  generateRetryQuestion(retryData) {
    const { question } = retryData;
    const correctAnswer = question.correctAnswer;

    // Generate 3 wrong answers
    const answers = [correctAnswer];

    while (answers.length < 4) {
      let wrongAnswer;
      const variation = Math.floor(Math.random() * 3);

      switch (variation) {
        case 0:
          // Plus/minus variation
          wrongAnswer =
            correctAnswer +
            (Math.random() > 0.5 ? 1 : -1) *
              (Math.floor(Math.random() * GAME_CONFIG.ANSWER_VARIATION_RANGE) +
                1);
          break;
        case 1:
          // Multiplication table error
          wrongAnswer =
            question.num1 * (question.num2 + (Math.random() > 0.5 ? 1 : -1));
          break;
        case 2:
          // Random within range
          wrongAnswer = Math.floor(Math.random() * (correctAnswer * 2)) + 1;
          break;
      }

      if (wrongAnswer > 0 && !answers.includes(wrongAnswer)) {
        answers.push(wrongAnswer);
      }
    }

    // Shuffle answers and return payload
    const shuffled = answers.sort(() => Math.random() - 0.5);
    const isDivisionQ =
      question.operation === GAME_CONFIG.OPERATIONS.DIVISION &&
      Number.isFinite(question.dividend) &&
      Number.isFinite(question.divisor);

    if (isDivisionQ) {
      return {
        dividend: question.dividend,
        divisor: question.divisor,
        correctAnswer,
        answers: shuffled,
        isRetry: true,
        operation: GAME_CONFIG.OPERATIONS.DIVISION,
      };
    } else if (
      question.operation === GAME_CONFIG.OPERATIONS.ADDITION ||
      question.operation === GAME_CONFIG.OPERATIONS.SUBTRACTION
    ) {
      return {
        question: question.question,
        correctAnswer,
        answers: shuffled,
        isRetry: true,
        operation: question.operation,
      };
    } else {
      // Multiplication or other operations
      return {
        num1: question.num1,
        num2: question.num2,
        correctAnswer,
        answers: shuffled,
        isRetry: true,
        operation: question.operation || GAME_CONFIG.OPERATIONS.MULTIPLICATION,
      };
    }
  }

  /**
   * Show retry challenge interface
   */
  showRetryChallenge(retryQuestion) {
    // Create retry overlay
    const overlay = document.createElement("div");
    overlay.className = "retry-overlay";
    const isDivisionUI =
      retryQuestion.operation === GAME_CONFIG.OPERATIONS.DIVISION;

    let displayMath;
    if (isDivisionUI) {
      displayMath = `${retryQuestion.dividend} ÷ ${retryQuestion.divisor}`;
    } else if (retryQuestion.question) {
      // Use the formatted question text for addition/subtraction/other operations
      displayMath = retryQuestion.question;
    } else {
      // Fallback to multiplication format
      displayMath = `${retryQuestion.num1} × ${retryQuestion.num2}`;
    }
    overlay.innerHTML = `
      <div class="retry-challenge">
        <div class="retry-header">
          <h2>🎯 Izazov Ponavljanja</h2>
          <p>Pokušaj riješiti ovaj zadatak koji si prije pogriješio!</p>
        </div>
        
        <div class="retry-question">
          <span class="retry-math">${displayMath} = </span>
        </div>
        
        <div class="retry-answers" id="retryAnswers">
          ${retryQuestion.answers
            .map(
              (answer) =>
                `<button class="retry-answer-btn" onclick="window.mathNinja.retrySystem.selectRetryAnswer(${answer})">${answer}</button>`
            )
            .join("")}
        </div>
        
        <div class="retry-timer">
          <div class="retry-timer-fill" id="retryTimerFill"></div>
        </div>
        
        <button class="retry-skip-btn" onclick="window.mathNinja.retrySystem.skipRetryChallenge()">
          Preskoči izazov
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Start retry timer (20 seconds)
    this.startRetryTimer(20000);

    console.log("🔄 Retry challenge interface shown");
  }

  /**
   * Start retry timer
   */
  startRetryTimer(duration) {
    const timerFill = document.getElementById("retryTimerFill");
    if (!timerFill) return;

    let timeLeft = duration;
    timerFill.style.width = "100%";

    this.retryTimerInterval = setInterval(() => {
      timeLeft -= 100;
      const percentage = (timeLeft / duration) * 100;
      timerFill.style.width = Math.max(0, percentage) + "%";

      if (timeLeft <= 0) {
        this.handleRetryTimeout();
      }
    }, 100);
  }

  /**
   * Handle retry timer timeout
   */
  handleRetryTimeout() {
    this.clearRetryTimer();
    this.audioManager?.playGameEvent("timeout");

    // Track timeout as wrong answer in statistics
    if (this.currentRetryQuestion) {
      this.statisticsManager.trackWrongAnswer(
        this.currentRetryQuestion.level,
        this.currentRetryQuestion.question,
        -1, // Timeout indicator
        this.currentRetryQuestion.question.correctAnswer,
        this.currentRetryQuestion.question.operation
      );

      console.log(
        `⏰ Retry challenge timeout tracked: ${
          this.currentRetryQuestion.question.question ||
          `${this.currentRetryQuestion.question.num1} × ${this.currentRetryQuestion.question.num2}`
        } (timeout)`
      );
    }

    // Show correct answer and end retry
    this.showRetryResult(
      false,
      this.currentRetryQuestion.question.correctAnswer
    );

    setTimeout(() => {
      this.endRetryChallenge(false, -1); // -1 indicates timeout
    }, 2000);
  }

  /**
   * Clear retry timer
   */
  clearRetryTimer() {
    if (this.retryTimerInterval) {
      clearInterval(this.retryTimerInterval);
      this.retryTimerInterval = null;
    }
  }

  /**
   * Handle retry answer selection
   */
  selectRetryAnswer(selectedAnswer) {
    this.clearRetryTimer();

    const isCorrect =
      selectedAnswer === this.currentRetryQuestion.question.correctAnswer;

    // Track wrong answer in statistics if incorrect
    if (!isCorrect && this.currentRetryQuestion) {
      this.statisticsManager.trackWrongAnswer(
        this.currentRetryQuestion.level,
        this.currentRetryQuestion.question,
        selectedAnswer,
        this.currentRetryQuestion.question.correctAnswer,
        this.currentRetryQuestion.question.operation
      );

      console.log(
        `📝 Retry challenge wrong answer tracked: ${
          this.currentRetryQuestion.question.question ||
          `${this.currentRetryQuestion.question.num1} × ${this.currentRetryQuestion.question.num2}`
        } = ${selectedAnswer} (correct: ${
          this.currentRetryQuestion.question.correctAnswer
        })`
      );
    }

    // Disable all buttons
    const buttons = document.querySelectorAll(".retry-answer-btn");
    buttons.forEach((btn) => {
      btn.disabled = true;
      if (parseInt(btn.textContent) === selectedAnswer) {
        btn.classList.add(isCorrect ? "correct" : "wrong");
      }
      if (
        parseInt(btn.textContent) ===
        this.currentRetryQuestion.question.correctAnswer
      ) {
        btn.classList.add("correct");
      }
    });

    // Play sound and show result
    this.audioManager?.playGameEvent(isCorrect ? "correct" : "incorrect");
    this.showRetryResult(
      isCorrect,
      this.currentRetryQuestion.question.correctAnswer
    );

    // End retry challenge after delay
    setTimeout(() => {
      this.endRetryChallenge(isCorrect, selectedAnswer);
    }, 2000);
  }

  /**
   * Show retry result feedback
   */
  showRetryResult(isCorrect, correctAnswer) {
    const resultDiv = document.createElement("div");
    resultDiv.className = `retry-result ${
      isCorrect ? "retry-success" : "retry-failure"
    }`;

    if (isCorrect) {
      resultDiv.innerHTML = `
        <div class="retry-result-icon">✅</div>
        <div class="retry-result-text">Bravo! Naučio si!</div>
      `;
    } else {
      resultDiv.innerHTML = `
        <div class="retry-result-icon">📚</div>
        <div class="retry-result-text">Nastavi vježbati!<br>Odgovor je: ${correctAnswer}</div>
      `;
    }

    const retryChallenge = document.querySelector(".retry-challenge");
    if (retryChallenge) {
      retryChallenge.appendChild(resultDiv);
    }
  }

  /**
   * Skip retry challenge
   */
  skipRetryChallenge() {
    this.clearRetryTimer();

    // Track skip as wrong answer in statistics
    if (this.currentRetryQuestion) {
      this.statisticsManager.trackWrongAnswer(
        this.currentRetryQuestion.level,
        this.currentRetryQuestion.question,
        -2, // Skip indicator
        this.currentRetryQuestion.question.correctAnswer,
        this.currentRetryQuestion.question.operation
      );

      console.log(
        `⏭️ Retry challenge skip tracked: ${
          this.currentRetryQuestion.question.question ||
          `${this.currentRetryQuestion.question.num1} × ${this.currentRetryQuestion.question.num2}`
        } (skipped)`
      );
    }

    this.endRetryChallenge(false, -2); // -2 indicates skip
  }

  /**
   * End retry challenge
   */
  endRetryChallenge(wasCorrect, wrongAnswer = null) {
    // Remove retry overlay
    const overlay = document.querySelector(".retry-overlay");
    if (overlay) {
      overlay.remove();
    }

    // Update statistics
    if (wasCorrect && this.currentRetryQuestion) {
      this.statisticsManager.markAsLearned(
        this.currentRetryQuestion.level,
        this.currentRetryQuestion.question.num1,
        this.currentRetryQuestion.question.num2
      );

      // Remove from current session wrong answers (NEW: prevents re-offering in same session)
      if (this.gameEngine) {
        this.gameEngine.removeCurrentSessionWrongAnswer(
          this.currentRetryQuestion.question.num1,
          this.currentRetryQuestion.question.num2
        );
      }

      // Remove from pending retries (legacy, no longer used but keep for safety)
      this.pendingRetries = this.pendingRetries.filter(
        (retry) =>
          !(
            retry.question.num1 === this.currentRetryQuestion.question.num1 &&
            retry.question.num2 === this.currentRetryQuestion.question.num2
          )
      );
    }

    // Reset retry mode
    this.isRetryMode = false;
    this.currentRetryQuestion = null;
    this.correctAnswersCount = 0; // Reset counter

    // Continue with normal game flow
    if (this.retryCallback) {
      this.retryCallback();
      this.retryCallback = null;
    }

    console.log("🔄 Retry challenge ended");
  }

  /**
   * Check if retry challenge should be offered
   */
  shouldOfferRetry() {
    // Only offer retry for current session wrong answers
    const currentSessionWrongAnswers =
      this.gameEngine?.getCurrentSessionWrongAnswers() || [];

    return (
      this.correctAnswersCount >= GAME_CONFIG.RETRY_TRIGGER_THRESHOLD &&
      currentSessionWrongAnswers.length > 0 &&
      !this.isRetryMode
    );
  }

  /**
   * Set callback for continuing game after retry
   */
  setRetryCallback(callback) {
    this.retryCallback = callback;
  }

  /**
   * Reset retry system (for new game)
   */
  reset() {
    this.correctAnswersCount = 0;
    this.isRetryMode = false;
    this.currentRetryQuestion = null;
    this.retryCallback = null;
    this.pendingRetries = []; // Clear old retry queue (no longer used but keep for safety)
    this.clearRetryTimer();

    // Remove any active retry UI
    this.removeRetryNotification();
    const overlay = document.querySelector(".retry-overlay");
    if (overlay) {
      overlay.remove();
    }

    console.log("🔄 Retry system reset");
  }

  /**
   * Get retry statistics
   */
  getRetryStats() {
    return {
      pendingRetries: this.pendingRetries.length,
      isRetryMode: this.isRetryMode,
      correctAnswersCount: this.correctAnswersCount,
    };
  }
}
