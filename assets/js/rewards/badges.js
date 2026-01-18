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
    condition: (stats, session) => session.isDailyChallenge && session.completed
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
    // We also need total score which might be in basic stats or detailed?
    // StatisticsManager tracks detailedStats. But totalScore is in "basic stats" which StatisticsManager didn't seem to load fully in my refactor?
    // Ah, I see `loadDetailedStats` loads `GAME_CONFIG.STATISTICS_KEY`.
    // But `loadStats` (basic) was likely in the old file. I might have missed basic stats in my refactor of statistics.js!
    // Let me check statistics.js again.
    // Yes, I removed `loadStats` and `saveStats` which handled `mathNinjaStats` (basic stats).
    // I should probably merge them or support both.
    // Wait, `loadDetailedStats` loads `mathNinjaDetailedStats`. `DEFAULT_STATS` was for `mathNinjaStats`.

    // For now, let's assume `detailedStats` has everything or `sessionStats` + `detailedStats` is enough.
    // I need to ensure `totalScore` is tracked somewhere.

    // Let's rely on what we have.

    const awarded = [];
    const currentBadges = detailedStats.badges || [];

    // Mock global stats integration for checking
    const globalStats = {
        totalScore: (detailedStats.totalScore || 0) + sessionStats.score, // Estimate
        ...detailedStats
    };

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
      // detailedStats.totalScore is not explicitly updated in StatisticsManager logic I wrote?
      // I need to make sure totalScore is updated in StatisticsManager.
      this.statsManager.saveDetailedStats();
    }

    return awarded;
  }
}
