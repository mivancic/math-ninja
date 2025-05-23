# Math Ninja Refactoring Plan

## Phase 1: Split Monolithic Structure

### Target Architecture

```
public/
├── index.php (minimal HTML structure, includes)
├── assets/
│   ├── css/
│   │   ├── main.css (core styles)
│   │   ├── animations.css (keyframes and animations)
│   │   ├── components.css (UI components)
│   │   └── responsive.css (media queries)
│   ├── js/
│   │   ├── config.js (constants and settings)
│   │   ├── game.js (core game logic)
│   │   ├── ui.js (DOM manipulation)
│   │   ├── stats.js (statistics management)
│   │   ├── screens.js (screen navigation)
│   │   └── app.js (main initialization)
│   └── sounds/ (for upcoming audio features)
│       ├── correct.mp3
│       ├── incorrect.mp3
│       ├── celebration.mp3
│       └── background.mp3
└── README.md (setup instructions)
```

## Step-by-Step Refactoring Process

### Step 1: Extract CSS (Lines 10-350)

**Files to create:**

- `assets/css/main.css` - Core styling and layout
- `assets/css/animations.css` - All @keyframes and animations
- `assets/css/components.css` - Button, card, and component styles
- `assets/css/responsive.css` - Media queries

### Step 2: Extract HTML Structure (Lines 350-450)

**Modifications:**

- Keep minimal HTML in `index.php`
- Add proper `<head>` with meta tags and asset links
- Organize screen sections more clearly

### Step 3: Extract JavaScript Logic (Lines 450-837)

**Files to create:**

- `assets/js/config.js` - Constants, settings, default values
- `assets/js/game.js` - Core game mechanics (questions, scoring, timer)
- `assets/js/ui.js` - DOM manipulation and visual feedback
- `assets/js/stats.js` - Statistics tracking and localStorage
- `assets/js/screens.js` - Screen navigation and state management
- `assets/js/app.js` - Main initialization and event bindings

### Step 4: Improve Code Organization

**Code Quality Improvements:**

- Convert global variables to proper modules
- Add proper error handling
- Implement consistent naming conventions
- Add JSDoc comments for all functions
- Remove code duplication

## Detailed File Structure

### assets/js/config.js

```javascript
// Game configuration and constants
export const GAME_CONFIG = {
  TIMER_DURATION: 10000,
  DAILY_CHALLENGE_TIMER: 8000,
  BASE_POINTS: 10,
  STREAK_BONUS: 5,
  QUESTIONS_PER_LEVEL: 10,
  ACCURACY_THRESHOLD: 80,
};

export const PERFORMANCE_TIERS = [
  { threshold: 95, emoji: "🤩", title: "IZVRSNO!", stars: 3, color: "#4caf50" },
  { threshold: 85, emoji: "😄", title: "Odlično!", stars: 3, color: "#8bc34a" },
  { threshold: 70, emoji: "😊", title: "Super!", stars: 2, color: "#ffc107" },
  { threshold: 50, emoji: "🙂", title: "Dobro!", stars: 1, color: "#ff9800" },
  {
    threshold: 0,
    emoji: "😟",
    title: "Trebamo još vježbati!",
    stars: 0,
    color: "#f44336",
  },
];
```

### assets/js/game.js

```javascript
// Core game mechanics
export class GameEngine {
  constructor() {
    this.currentLevel = 1;
    this.score = 0;
    this.streak = 0;
    // ... other game state
  }

  generateQuestion() {
    /* ... */
  }
  evaluateAnswer(answer) {
    /* ... */
  }
  calculateScore() {
    /* ... */
  }
  // ... other game methods
}
```

### assets/js/ui.js

```javascript
// UI management and DOM manipulation
export class UIManager {
  showFeedback(type, message) {
    /* ... */
  }
  updateDisplay() {
    /* ... */
  }
  switchScreen(screenName) {
    /* ... */
  }
  // ... other UI methods
}
```

### assets/js/stats.js

```javascript
// Statistics and data persistence
export class StatsManager {
  constructor() {
    this.stats = this.loadStats();
  }

  loadStats() {
    /* ... */
  }
  saveStats() {
    /* ... */
  }
  updateStats(gameData) {
    /* ... */
  }
  // ... other stats methods
}
```

## Implementation Timeline

### Day 1-2: CSS Extraction

- Split CSS into logical files
- Test responsive design still works
- Verify all animations work correctly

### Day 3-4: JavaScript Modularization

- Extract core game logic
- Create proper class structure
- Implement module exports/imports

### Day 5: HTML Cleanup

- Simplify index.php structure
- Add proper asset linking
- Test full integration

### Day 6-7: Code Quality & Testing

- Add error handling
- Write documentation
- Manual testing across devices
- Performance verification

## Benefits After Refactoring

### Immediate Benefits

✅ **Maintainability**: Each file has single responsibility
✅ **Scalability**: Easy to add new features without touching existing code
✅ **Debugging**: Easier to isolate and fix issues
✅ **Team Development**: Multiple developers can work on different modules

### Preparation for Audio Features

✅ **Sound Manager**: Ready structure for `assets/js/audio.js`
✅ **Asset Management**: Proper folder for audio files
✅ **Settings**: Framework for volume controls and preferences
✅ **Performance**: Better loading and caching strategies

## Risk Mitigation

### Backward Compatibility

- Keep existing localStorage structure unchanged
- Maintain all current functionality
- Preserve user data and progress

### Testing Strategy

- Test each refactored module individually
- Verify complete game flow works
- Check mobile responsiveness
- Validate cross-browser compatibility

### Rollback Plan

- Keep original index.php as backup
- Implement changes incrementally
- Test after each major change
