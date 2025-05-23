/**
 * Math Ninja - Visual Effects Manager
 * @fileoverview Dynamic visual effects for streak progression and game tension
 */

import { GAME_CONFIG, getStreakTheme } from "./config.js";

export class VisualEffectsManager {
  constructor() {
    this.currentStreak = 0;
    this.currentTheme = null;
    this.particles = [];
    this.animationFrame = null;
    this.canvas = null;
    this.ctx = null;
    this.isActive = false;

    this.init();
  }

  /**
   * Initialize visual effects system
   */
  init() {
    this.createEffectsCanvas();
    this.setupEventListeners();
    console.log("✨ Visual Effects Manager initialized");
  }

  /**
   * Create canvas for particle effects
   */
  createEffectsCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "effectsCanvas";
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "1";
    this.canvas.style.opacity = "0.8";

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    this.resizeCanvas();
  }

  /**
   * Setup event listeners for window resize
   */
  setupEventListeners() {
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  /**
   * Resize canvas to fit window
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Update streak effects based on current streak
   */
  updateStreakEffects(streak) {
    this.currentStreak = streak;
    const newTheme = getStreakTheme(streak);

    // Only update if theme changed
    if (!this.currentTheme || this.currentTheme.name !== newTheme.name) {
      this.currentTheme = newTheme;
      this.applyTheme(newTheme);
      this.updateParticles(newTheme);

      console.log(`🎨 Theme updated: ${newTheme.name} (streak: ${streak})`);
    }
  }

  /**
   * Apply theme to background and UI elements
   */
  applyTheme(theme) {
    const gameContainer = document.querySelector(".game-container");
    if (!gameContainer) return;

    // Update background - only for higher intensity themes
    if (theme.intensity >= 2) {
      document.body.style.background = theme.background;
    } else {
      // For low intensity themes (warming-up), only affect game container
      gameContainer.style.background = theme.background;
    }

    // Apply theme-specific classes
    document.body.className = document.body.className.replace(/theme-\w+/g, "");
    document.body.classList.add(`theme-${theme.name}`);

    // Apply effects
    theme.effects?.forEach((effect) => {
      this.applyEffect(effect, theme.intensity);
    });

    // Add screen shake for high intensity
    if (theme.intensity >= 3) {
      this.addScreenShake(theme.intensity);
    }
  }

  /**
   * Apply specific visual effect
   */
  applyEffect(effect, intensity) {
    const gameContainer = document.querySelector(".game-container");
    if (!gameContainer) return;

    switch (effect) {
      case "glow":
        gameContainer.style.boxShadow = `0 0 ${
          20 + intensity * 10
        }px rgba(255, 255, 255, ${0.3 + intensity * 0.1})`;
        break;

      case "pulse":
        gameContainer.style.animation = `pulse-effect ${
          2 - intensity * 0.2
        }s infinite alternate`;
        break;

      case "shake":
        if (intensity >= 3) {
          gameContainer.style.animation += `, shake-effect ${0.5}s infinite`;
        }
        break;

      case "flames":
        this.createFlameEffect();
        break;

      case "lightning":
        this.createLightningEffect();
        break;
    }
  }

  /**
   * Update particle system based on theme
   */
  updateParticles(theme) {
    if (theme.particles && theme.intensity > 0) {
      this.startParticleSystem(theme);
    } else {
      this.stopParticleSystem();
    }
  }

  /**
   * Start particle system
   */
  startParticleSystem(theme) {
    this.isActive = true;
    this.generateParticles(theme);
    this.animateParticles();
  }

  /**
   * Stop particle system
   */
  stopParticleSystem() {
    this.isActive = false;
    this.particles = [];
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.clearCanvas();
  }

  /**
   * Generate particles based on theme
   */
  generateParticles(theme) {
    const particleCount = Math.min(theme.intensity * 15, 75); // Limit for performance

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle(theme));
    }
  }

  /**
   * Create individual particle
   */
  createParticle(theme) {
    const colors = this.getThemeColors(theme);

    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      decay: Math.random() * 0.02 + 0.005,
      type: this.getParticleType(theme),
    };
  }

  /**
   * Get theme-appropriate colors
   */
  getThemeColors(theme) {
    switch (theme.name) {
      case "warming-up":
        return ["#f093fb", "#f5576c", "#ffffff"];
      case "getting-hot":
        return ["#ff9a9e", "#fecfef", "#ffffff"];
      case "on-fire":
        return ["#fa709a", "#fee140", "#ffffff"];
      case "blazing":
        return ["#ff6b6b", "#ffa500", "#ffff00"];
      case "legendary":
        return ["#ff0000", "#ff4500", "#ffd700", "#ffff00"];
      default:
        return ["#ffffff"];
    }
  }

  /**
   * Get particle type based on theme
   */
  getParticleType(theme) {
    if (theme.intensity >= 5) return "lightning";
    if (theme.intensity >= 4) return "flame";
    if (theme.intensity >= 2) return "spark";
    return "dot";
  }

  /**
   * Animate particles
   */
  animateParticles() {
    if (!this.isActive) return;

    this.clearCanvas();

    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update particle
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;

      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Wrap around screen
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;

      // Draw particle
      this.drawParticle(particle);
    }

    // Add new particles occasionally
    if (
      this.particles.length < this.currentTheme.intensity * 15 &&
      Math.random() < 0.1
    ) {
      this.particles.push(this.createParticle(this.currentTheme));
    }

    this.animationFrame = requestAnimationFrame(() => this.animateParticles());
  }

  /**
   * Draw individual particle
   */
  drawParticle(particle) {
    this.ctx.save();
    this.ctx.globalAlpha = particle.life;

    switch (particle.type) {
      case "lightning":
        this.drawLightning(particle);
        break;
      case "flame":
        this.drawFlame(particle);
        break;
      case "spark":
        this.drawSpark(particle);
        break;
      default:
        this.drawDot(particle);
    }

    this.ctx.restore();
  }

  /**
   * Draw dot particle
   */
  drawDot(particle) {
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Draw spark particle
   */
  drawSpark(particle) {
    this.ctx.strokeStyle = particle.color;
    this.ctx.lineWidth = particle.size;
    this.ctx.beginPath();
    this.ctx.moveTo(particle.x - particle.size, particle.y);
    this.ctx.lineTo(particle.x + particle.size, particle.y);
    this.ctx.moveTo(particle.x, particle.y - particle.size);
    this.ctx.lineTo(particle.x, particle.y + particle.size);
    this.ctx.stroke();
  }

  /**
   * Draw flame particle
   */
  drawFlame(particle) {
    const gradient = this.ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      particle.size * 3
    );
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(1, "transparent");

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Draw lightning particle
   */
  drawLightning(particle) {
    this.ctx.strokeStyle = particle.color;
    this.ctx.lineWidth = particle.size;
    this.ctx.shadowColor = particle.color;
    this.ctx.shadowBlur = 10;

    this.ctx.beginPath();
    this.ctx.moveTo(particle.x, particle.y);
    this.ctx.lineTo(
      particle.x + (Math.random() - 0.5) * 20,
      particle.y + (Math.random() - 0.5) * 20
    );
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
  }

  /**
   * Clear canvas
   */
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Add screen shake effect
   */
  addScreenShake(intensity) {
    const gameContainer = document.querySelector(".game-container");
    if (!gameContainer) return;

    const shakeAmount = intensity * 2;

    // Quick shake animation
    gameContainer.style.transform = `translate(${
      (Math.random() - 0.5) * shakeAmount
    }px, ${(Math.random() - 0.5) * shakeAmount}px)`;

    setTimeout(() => {
      gameContainer.style.transform = "translate(0, 0)";
    }, 150);
  }

  /**
   * Create flame effect around screen edges
   */
  createFlameEffect() {
    // Add flame particles from screen edges
    for (let i = 0; i < 5; i++) {
      const edge = Math.random();
      let x, y;

      if (edge < 0.25) {
        // Top
        x = Math.random() * this.canvas.width;
        y = 0;
      } else if (edge < 0.5) {
        // Right
        x = this.canvas.width;
        y = Math.random() * this.canvas.height;
      } else if (edge < 0.75) {
        // Bottom
        x = Math.random() * this.canvas.width;
        y = this.canvas.height;
      } else {
        // Left
        x = 0;
        y = Math.random() * this.canvas.height;
      }

      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 5 + 2,
        color: "#ff4500",
        life: 1,
        decay: 0.02,
        type: "flame",
      });
    }
  }

  /**
   * Create lightning effect
   */
  createLightningEffect() {
    // Add lightning bolts occasionally
    if (Math.random() < 0.3) {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: 0,
          vy: 0,
          size: Math.random() * 3 + 1,
          color: "#ffffff",
          life: 1,
          decay: 0.05,
          type: "lightning",
        });
      }
    }
  }

  /**
   * Reset effects to default
   */
  resetEffects() {
    this.currentStreak = 0;
    this.currentTheme = null;
    this.stopParticleSystem();

    // Reset background
    document.body.style.background =
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

    // Remove theme classes
    document.body.className = document.body.className.replace(/theme-\w+/g, "");

    // Reset game container styles
    const gameContainer = document.querySelector(".game-container");
    if (gameContainer) {
      gameContainer.style.background = "";
      gameContainer.style.boxShadow = "";
      gameContainer.style.animation = "";
      gameContainer.style.transform = "";
    }

    console.log("🎨 Visual effects reset");
  }

  /**
   * Cleanup visual effects
   */
  cleanup() {
    this.stopParticleSystem();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    window.removeEventListener("resize", this.resizeCanvas);
  }
}
