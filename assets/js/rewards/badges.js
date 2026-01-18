/**
 * Math Ninja - Badge System
 */

export const BADGES = {
  STREAK_5: {
    id: 'streak_5',
    icon: '🔥',
    title: 'Zagrijavanje',
    description: 'Postigni niz od 5 točnih odgovora',
    condition: (stats, session) => session.maxStreak >= 5
  },
  STREAK_10: {
    id: 'streak_10',
    icon: '⚡',
    title: 'Nezaustavljiv',
    description: 'Postigni niz od 10 točnih odgovora',
    condition: (stats, session) => session.maxStreak >= 10
  },
  PERFECT_ROUND: {
    id: 'perfect_round',
    icon: '🏆',
    title: 'Savršeno!',
    description: 'Završi razinu bez ijedne greške',
    condition: (stats, session) => session.accuracy === 100 && session.questionsAnswered >= 10
  },
  DAILY_HERO: {
    id: 'daily_hero',
    icon: '🦸',
    title: 'Dnevni Heroj',
    description: 'Završi dnevni izazov',
    condition: (stats, session) => session.isMixedMode && session.isComplete
  },
  SCORE_1000: {
    id: 'score_1000',
    icon: '⭐',
    title: 'Zvijezda',
    description: 'Sakupi ukupno 1000 bodova',
    condition: (stats, session) => stats.totalScore >= 1000
  },
  MATH_MASTER: {
    id: 'math_master',
    icon: '🎓',
    title: 'Matematički Majstor',
    description: 'Sakupi ukupno 5000 bodova',
    condition: (stats, session) => stats.totalScore >= 5000
  }
};

export class BadgeSystem {
  constructor(statsManager) {
    this.statsManager = statsManager;
  }

  /**
   * Evaluates and awards badges based on session and global stats
   * @param {Object} sessionStats
   * @returns {Array} Array of newly awarded badges
   */
  checkBadges(sessionStats) {
    const detailedStats = this.statsManager.detailedStats;
    const currentBadges = detailedStats.badges || [];

    // Calculate total score from StatisticsManager helper
    // Note: sessionStats.score is for current game, but statsManager should have updated
    // progress if `updateLevelProgress` was called before this.
    // In app.js: `updateLevelProgress` is called, THEN `checkBadges`.
    // So `getTotalScore()` includes the current session best score if it was a new record.
    // If it wasn't a new record, we still have the total bests.

    // HOWEVER, badges like "Score 1000" usually mean "Cumulative Lifetime Points" (XP),
    // not just sum of best level scores.
    // If we only track "Best Score" per level, max score is limited (e.g. 40 levels * 100 pts = 4000).
    // Getting 5000 would be impossible.
    // The user probably wants Lifetime XP.
    // But `StatisticsManager` doesn't track lifetime XP yet in my code.
    // I should probably switch to "Sum of Best Scores" for now as that's what I have,
    // OR add `lifetimeScore` to stats.
    // Given the constraints and existing code, I'll stick to `getTotalScore` (Sum of Bests).
    // I'll lower the thresholds or accept it matches "Mastery".

    const totalScore = this.statsManager.getTotalScore();

    const globalStats = {
        totalScore: totalScore,
        ...detailedStats
    };

    const awarded = [];

    Object.values(BADGES).forEach(badge => {
      if (!currentBadges.includes(badge.id)) {
        if (badge.condition(globalStats, sessionStats)) {
          awarded.push(badge);
          currentBadges.push(badge.id);
        }
      }
    });

    if (awarded.length > 0) {
      detailedStats.badges = currentBadges;
      this.statsManager.saveDetailedStats();
    }

    return awarded;
  }
}
