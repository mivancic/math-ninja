# System Patterns - Math Ninja

## Application Architecture

### Enhanced Screen-Based Navigation Pattern

The application uses an advanced single-page application (SPA) pattern with coordinated screen switching:

```
Menu Screen (active by default)
├── Level Select Screen
│   └── Game Screen (with dynamic visual effects)
│       ├── Retry Challenge Overlay (session-aware)
│       ├── Settings Panel (sliding)
│       └── Level Complete Screen
│           └── (back to Menu or Retry)
└── Stats Screen (enhanced analytics)
    └── (back to Menu)
└── Daily Challenge
    └── Game Screen (level 0 with wrong answer integration)
```

### Advanced State Management Pattern

**Module-Based State Management:**

```javascript
// GameEngine State
currentLevel, score, streak, maxStreak, questionsAnswered, correctAnswers
unlearnedWrongAnswers, wrongAnswersUsed, currentQuestionData
currentSessionWrongAnswers

// StatisticsManager State (11 metrics)
detailedStats = {
  totalPlaytimeMinutes, dailyLaunches, dailyPlaytime,
  dailyChallengeStreak, dailyChallengeHistory, sessionCount,
  averageSessionLength, longestDailyStreak
}
wrongAnswers = { level_1: [...], level_2: [...] }

// VisualEffectsManager State
currentTheme, particleSystem, streakLevel, canvas, animationFrame

// AudioManager State
audioContext, sounds, musicVolume, effectsVolume, masterMuted

// RetryChallengeSystem State
pendingRetries, isRetryMode, currentRetryQuestion, correctAnswersCount
```

### Enhanced Game Flow Pattern

```
Start Game → Load Unlearned Wrong Answers → Generate Question (40% chance for review) →
Start Timer → Wait for Answer → Evaluate → Update Visual Effects →
Play Audio Feedback → Update Statistics → Check Retry Trigger →
[Retry Challenge] OR [Continue: Next Question] OR [End: Show Results]
```

## Advanced Component Patterns

### 1. Modular Architecture Pattern

**ES6 Module Structure:**

- **Single Responsibility**: Each module handles one major concern
- **Loose Coupling**: Modules communicate through defined interfaces
- **Event Coordination**: App controller manages cross-module communication
- **State Isolation**: Each module manages its own state with shared coordination

### 2. Enhanced Game Engine Pattern

**GameEngine Enhancements:**

- **Wrong Answer Integration**: 40% chance to use unlearned wrong answers
- **Session Tracking**: Current vs historical wrong answer distinction
- **Question Generation**: Smart mix of random and review questions
- **Learning Progress**: Automatic cleanup of resolved learning items

### 3. Visual Effects System Pattern

**Canvas-Based Rendering:**

- **Performance Tiers**: Adaptive quality based on device capabilities
- **Progressive Themes**: 5-tier visual progression (default → legendary)
- **Particle System**: Real-time particles with proper lifecycle management
- **Screen Effects**: Dynamic backgrounds, glow, pulse, shake, rainbow borders

### 4. Advanced Statistics Pattern

**Comprehensive Analytics:**

- **Real-time Tracking**: Continuous monitoring with interval-based updates
- **Data Migration**: Automatic localStorage structure upgrades
- **Session Management**: Proper session start/end with cleanup
- **Metric Aggregation**: 11 different statistics with formatted display

### 5. Smart Retry Challenge Pattern

**Session-Aware Retry Logic:**

- **Current Session**: Immediate retry opportunities for fresh mistakes
- **Historical Review**: Book emoji integration for previous session mistakes
- **Smart Timing**: Triggered after 1 correct answer threshold
- **Interactive UI**: 20-second timer with beautiful notification interface

### 6. Professional Audio Pattern

**Multi-Layer Audio System:**

- **Web Audio API**: Primary system with advanced controls
- **Fallback Strategy**: HTML5 Audio for compatibility
- **Resource Management**: Proper loading, caching, and cleanup
- **Mobile Optimization**: Touch unlock and performance considerations

## Data Patterns

### Enhanced Question Generation Algorithm

```javascript
// Smart question selection with learning integration
generateQuestion() {
  const shouldUseWrongAnswer = unlearnedWrongAnswers.length > 0 &&
                              wrongAnswersUsed.size < unlearnedWrongAnswers.length &&
                              Math.random() < 0.4;

  if (shouldUseWrongAnswer) {
    return generateWrongAnswerQuestion(); // Review question with 📚 emoji
  } else {
    return generateRandomQuestion(); // Regular question
  }
}
```

### Advanced Wrong Answer Storage Pattern

```javascript
// Comprehensive wrong answer tracking
trackWrongAnswer(level, question, wrongAnswer, correctAnswer) {
  if (existing) {
    // Store ALL wrong answers, not just latest
    if (!existing.allWrongAnswers) {
      existing.allWrongAnswers = [existing.wrongAnswer];
    }
    existing.allWrongAnswers.push(wrongAnswer);
    existing.totalAttempts++;
  } else {
    // Create new entry with collection structure
    const wrongData = {
      allWrongAnswers: [wrongAnswer],
      totalAttempts: 1,
      correctAttempts: 0,
      learned: false
    };
  }
}
```

### Progressive Visual Effects Algorithm

```javascript
// Dynamic theme progression based on streak
updateStreakEffects(streak) {
  const theme = getStreakTheme(streak);

  if (theme.intensity >= 1) {
    this.applyParticleEffects(theme);
  }
  if (theme.intensity >= 2) {
    this.applyScreenEffects(theme);
  }
  if (theme.intensity >= 3) {
    this.applyAdvancedEffects(theme);
  }
}
```

## Advanced Animation & UI Patterns

### Canvas Animation Strategy

**Performance-Optimized Rendering:**

- **RequestAnimationFrame**: Smooth 60fps particle updates
- **Performance Tiers**: Adaptive particle counts based on device
- **GPU Acceleration**: Hardware-accelerated canvas operations
- **Memory Management**: Proper particle lifecycle and cleanup

### Enhanced Responsive Design Pattern

**Multi-Device Optimization:**

- **Mobile-First**: Base styles optimized for touch devices
- **Progressive Enhancement**: Desktop features layered on mobile foundation
- **Touch-Friendly**: Large button targets with audio feedback
- **Accessibility**: Screen reader support and reduced motion options

### Audio Feedback Pattern

**Multi-Sensory Experience:**

```javascript
// Coordinated audio-visual feedback
selectAnswer(answer) {
  const result = evaluateAnswer(answer);

  // Visual feedback
  this.visualEffects.updateStreakEffects(result.gameStats.streak);

  // Audio feedback
  if (result.feedbackType === 'correct') {
    if (result.gameStats.streak >= 3) {
      this.audioManager.playGameEvent('streak', { streak: result.gameStats.streak });
    } else {
      this.audioManager.playGameEvent('correct');
    }
  }
}
```

## Error Handling & Recovery Patterns

### Graceful Degradation Strategy

**Audio System:**

```javascript
// Comprehensive error handling with fallbacks
async initAudio() {
  try {
    // Try Web Audio API first
    this.audioContext = new AudioContext();
  } catch (e) {
    // Fall back to HTML5 Audio
    this.useHTML5Audio = true;
  }
}
```

### Data Migration Pattern

**Automatic localStorage Upgrades:**

```javascript
// Seamless data structure evolution
loadWrongAnswers() {
  const wrongAnswers = JSON.parse(saved);

  // Migrate old data structure
  Object.keys(wrongAnswers).forEach(levelKey => {
    wrongAnswers[levelKey].forEach(wrongAnswer => {
      if (!wrongAnswer.allWrongAnswers) {
        wrongAnswer.allWrongAnswers = [wrongAnswer.wrongAnswer];
      }
    });
  });
}
```

### Canvas Error Recovery

**Robust Canvas Handling:**

```javascript
// Canvas initialization with error handling
initCanvas() {
  try {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  } catch (e) {
    // Fall back to CSS animations only
    this.useCanvasEffects = false;
  }
}
```

## Performance Optimization Patterns

### Efficient Resource Management

**Audio Loading Strategy:**

- **Preloading**: All audio files loaded at initialization
- **Caching**: Loaded audio stored for reuse
- **Cleanup**: Proper resource disposal on app close

**Canvas Optimization:**

- **Performance Tiers**: Adaptive particle counts
- **Efficient Rendering**: Minimized draw calls and state changes
- **Memory Management**: Proper particle pool management

### Mobile Performance Pattern

**Touch-Optimized Experience:**

- **Audio Unlock**: iOS-specific touch unlock implementation
- **Performance Adaptation**: Reduced effects on lower-end devices
- **Touch Events**: Optimized touch handling with proper preventDefault

## Cross-Module Communication Patterns

### Event-Driven Architecture

**Module Coordination:**

```javascript
// Clean module communication
class MathNinjaApp {
  selectAnswer(answer) {
    const result = this.gameEngine.evaluateAnswer(answer);

    // Update all systems
    this.visualEffects.updateStreakEffects(result.gameStats.streak);
    this.audioManager.playGameEvent(result.feedbackType);
    this.statisticsManager.trackAnswer(result);

    // Check retry system
    if (this.retrySystem.shouldOfferRetry()) {
      this.retrySystem.offerRetryChallenge();
    }
  }
}
```

### State Synchronization Pattern

**Coordinated State Updates:**

- **Centralized Coordination**: App controller manages state flow
- **Event Propagation**: Changes propagated to relevant modules
- **Data Consistency**: Synchronized updates across all systems
- **Conflict Resolution**: Clear precedence rules for state conflicts
