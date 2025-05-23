/**
 * Math Ninja - Audio Manager
 * @fileoverview Comprehensive audio system for sound effects and background music
 */

import { GAME_CONFIG } from "./config.js";

export class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.volume = 0.5; // Default 50%
    this.effectsVolume = 0.5;
    this.musicVolume = 0.3; // Background music quieter
    this.muted = false;
    this.musicMuted = false;
    this.masterMuted = false; // Separate master mute state
    this.savedMuteStates = {
      // Store previous states when master mute is engaged
      effectsMuted: false,
      musicMuted: false,
    };
    this.audioContext = null;
    this.backgroundMusic = null;
    this.isBackgroundMusicPlaying = false;
    this.preferencesLoaded = false;

    // Don't auto-initialize, let app control this
    this.loadPreferences();
  }

  /**
   * Initialize audio system
   */
  async init() {
    await this.setupAudioContext();
    await this.preloadSounds();
    this.preferencesLoaded = true;
    console.log("🔊 AudioManager initialized");
  }

  /**
   * Setup audio context with fallbacks
   */
  async setupAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();

        // Handle iOS audio unlock
        if (this.audioContext.state === "suspended") {
          this.setupMobileAudioUnlock();
        }
      }
    } catch (e) {
      console.log("Web Audio API not supported, using HTML5 Audio");
    }
  }

  /**
   * Setup mobile audio unlock on first user interaction
   */
  setupMobileAudioUnlock() {
    const unlockAudio = async () => {
      if (this.audioContext && this.audioContext.state === "suspended") {
        await this.audioContext.resume();
        console.log("🔓 Audio unlocked for mobile");
      }

      // Remove listeners after first unlock
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("click", unlockAudio);
    };

    document.addEventListener("touchstart", unlockAudio, { once: true });
    document.addEventListener("click", unlockAudio, { once: true });
  }

  /**
   * Preload all sound assets
   */
  async preloadSounds() {
    const soundAssets = {
      // Core game sounds
      correct: "assets/sounds/correct.wav",
      incorrect: "assets/sounds/incorrect.wav",
      timeout: "assets/sounds/timeout.wav",

      // Streak celebrations
      "streak-3": "assets/sounds/streak-3.wav",
      "streak-5": "assets/sounds/streak-5.wav",
      "streak-10": "assets/sounds/streak-10.wav",

      // Game completion
      "level-complete": "assets/sounds/level-complete.wav",
      "new-record": "assets/sounds/new-record.wav",

      // Background music
      "background-music": "assets/sounds/background-music.wav",

      // UI interaction sounds (generated dynamically)
      "button-hover": null, // Will be generated
      "button-click": null, // Will be generated
    };

    const loadPromises = Object.entries(soundAssets).map(([name, url]) =>
      url ? this.loadSound(name, url) : this.generateUISound(name)
    );

    try {
      await Promise.all(loadPromises);
      console.log("🎵 All sounds preloaded successfully");
    } catch (error) {
      console.log("⚠️ Some sounds failed to load:", error);
    }
  }

  /**
   * Load individual sound
   */
  async loadSound(name, url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.addEventListener("canplaythrough", () => {
        this.sounds.set(name, audio);
        resolve();
      });

      audio.addEventListener("error", () => {
        console.log(`Failed to load sound: ${name}`);
        resolve(); // Don't reject, allow graceful degradation
      });

      audio.preload = "auto";
      audio.src = url;
    });
  }

  /**
   * Generate UI interaction sounds using Web Audio API
   */
  async generateUISound(soundName) {
    if (!this.audioContext) return;

    try {
      let buffer;

      switch (soundName) {
        case "button-hover":
          buffer = this.generateTone(800, 0.1, 0.1); // Short, soft high tone
          break;
        case "button-click":
          buffer = this.generateClickSound(); // Quick click sound
          break;
      }

      if (buffer) {
        // Convert Web Audio buffer to HTML5 Audio
        const wavData = this.bufferToWav(buffer);
        const blob = new Blob([wavData], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        this.sounds.set(soundName, audio);
      }
    } catch (error) {
      console.log(`Failed to generate UI sound: ${soundName}`, error);
    }
  }

  /**
   * Generate a simple tone
   */
  generateTone(frequency, duration, volume) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = Math.sin(2 * Math.PI * frequency * t);

      // Apply envelope
      const fadeLength = Math.min(sampleRate * 0.01, length / 4); // 10ms fade or quarter length
      if (i < fadeLength) {
        sample *= i / fadeLength;
      } else if (i > length - fadeLength) {
        sample *= (length - i) / fadeLength;
      }

      data[i] = sample * volume;
    }

    return buffer;
  }

  /**
   * Generate click sound (quick frequency sweep)
   */
  generateClickSound() {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.05; // Very short click
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;

      // Quick frequency sweep from 1200Hz to 600Hz
      const frequency = 1200 - 600 * progress;
      let sample = Math.sin(2 * Math.PI * frequency * t);

      // Sharp attack, quick decay
      const envelope = Math.exp(-progress * 8);
      data[i] = sample * envelope * 0.2;
    }

    return buffer;
  }

  /**
   * Convert AudioBuffer to WAV
   */
  bufferToWav(buffer) {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    const data = buffer.getChannelData(0);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, this.audioContext.sampleRate, true);
    view.setUint32(28, this.audioContext.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length * 2, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }

    return arrayBuffer;
  }

  /**
   * Play sound effect
   */
  play(soundName, options = {}) {
    if (this.masterMuted || this.muted || !this.sounds.has(soundName)) {
      return;
    }

    try {
      const audio = this.sounds.get(soundName);
      const audioClone = audio.cloneNode();

      // Apply volume settings
      const volume = options.volume || this.effectsVolume;
      audioClone.volume = Math.max(0, Math.min(1, volume));

      // Handle loop option
      if (options.loop) {
        audioClone.loop = true;
      }

      // Play with promise handling for better browser support
      const playPromise = audioClone.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Audio play failed:", error);
        });
      }

      return audioClone;
    } catch (error) {
      console.log("Error playing sound:", soundName, error);
    }
  }

  /**
   * Start background music
   */
  startBackgroundMusic() {
    if (
      this.masterMuted ||
      this.musicMuted ||
      this.isBackgroundMusicPlaying ||
      !this.sounds.has("background-music")
    ) {
      return;
    }

    try {
      this.backgroundMusic = this.sounds.get("background-music").cloneNode();
      this.backgroundMusic.volume = this.musicVolume;
      this.backgroundMusic.loop = true;

      const playPromise = this.backgroundMusic.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isBackgroundMusicPlaying = true;
            console.log("🎵 Background music started");
          })
          .catch((error) => {
            console.log("Background music play failed:", error);
          });
      }
    } catch (error) {
      console.log("Error starting background music:", error);
    }
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.isBackgroundMusicPlaying = false;
      console.log("🎵 Background music stopped");
    }
  }

  /**
   * Set effects volume (0.0 - 1.0)
   */
  setEffectsVolume(level) {
    this.effectsVolume = Math.max(0, Math.min(1, level));
    this.savePreferences();
  }

  /**
   * Set music volume (0.0 - 1.0)
   */
  setMusicVolume(level) {
    this.musicVolume = Math.max(0, Math.min(1, level));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
    this.savePreferences();
  }

  /**
   * Toggle sound effects mute
   */
  toggleEffects() {
    this.muted = !this.muted;
    this.savePreferences();
    return this.muted;
  }

  /**
   * Toggle background music mute
   */
  toggleMusic() {
    this.musicMuted = !this.musicMuted;

    if (this.musicMuted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }

    this.savePreferences();
    return this.musicMuted;
  }

  /**
   * Master mute toggle
   */
  toggleMaster() {
    this.masterMuted = !this.masterMuted;

    if (this.masterMuted) {
      // Save current states
      this.savedMuteStates.effectsMuted = this.muted;
      this.savedMuteStates.musicMuted = this.musicMuted;

      // Stop background music if playing
      this.stopBackgroundMusic();
    } else {
      // Restore previous states
      this.muted = this.savedMuteStates.effectsMuted;
      this.musicMuted = this.savedMuteStates.musicMuted;

      // Start background music if it should be playing
      if (!this.musicMuted) {
        this.startBackgroundMusic();
      }
    }

    this.savePreferences();
    return this.masterMuted;
  }

  /**
   * Get current audio state
   */
  getState() {
    return {
      effectsVolume: this.effectsVolume,
      musicVolume: this.musicVolume,
      effectsMuted: this.muted,
      musicMuted: this.musicMuted,
      masterMuted: this.masterMuted,
      isBackgroundMusicPlaying: this.isBackgroundMusicPlaying,
    };
  }

  /**
   * Load audio preferences from localStorage
   */
  loadPreferences() {
    try {
      const prefs = localStorage.getItem("mathNinjaAudioPrefs");
      if (prefs) {
        const settings = JSON.parse(prefs);
        this.effectsVolume = settings.effectsVolume || 0.5;
        this.musicVolume = settings.musicVolume || 0.3;
        this.muted = settings.effectsMuted || false;
        this.musicMuted = settings.musicMuted || false;
        this.masterMuted = settings.masterMuted || false;
        this.savedMuteStates = settings.savedMuteStates || {
          effectsMuted: false,
          musicMuted: false,
        };
      }
    } catch (e) {
      console.log("Could not load audio preferences");
    }
  }

  /**
   * Save audio preferences to localStorage
   */
  savePreferences() {
    if (!this.preferencesLoaded) return;

    try {
      const prefs = {
        effectsVolume: this.effectsVolume,
        musicVolume: this.musicVolume,
        effectsMuted: this.muted,
        musicMuted: this.musicMuted,
        masterMuted: this.masterMuted,
        savedMuteStates: this.savedMuteStates,
      };
      localStorage.setItem("mathNinjaAudioPrefs", JSON.stringify(prefs));
    } catch (e) {
      console.log("Could not save audio preferences");
    }
  }

  /**
   * Play sound based on game events
   */
  playGameEvent(eventType, data = {}) {
    switch (eventType) {
      case "correct":
        this.play("correct");
        break;

      case "incorrect":
        this.play("incorrect");
        break;

      case "timeout":
        this.play("timeout");
        break;

      case "streak":
        if (data.streak >= 10) {
          this.play("streak-10");
        } else if (data.streak >= 5) {
          this.play("streak-5");
        } else if (data.streak >= 3) {
          this.play("streak-3");
        }
        break;

      case "level-complete":
        this.play("level-complete");
        break;

      case "new-record":
        this.play("new-record");
        break;

      default:
        console.log("Unknown game event:", eventType);
    }
  }

  /**
   * Play UI interaction sound
   * @param {string} interactionType - 'hover' or 'click'
   * @param {Object} options - Audio options
   */
  playUISound(interactionType, options = {}) {
    if (this.masterMuted || this.muted) return;

    const soundName = `button-${interactionType}`;
    if (!this.sounds.has(soundName)) return;

    try {
      const audio = this.sounds.get(soundName);
      const audioClone = audio.cloneNode();

      // UI sounds are always quieter
      const baseVolume = interactionType === "hover" ? 0.15 : 0.25;
      const volume = (options.volume || baseVolume) * this.effectsVolume;
      audioClone.volume = Math.max(0, Math.min(1, volume));

      const playPromise = audioClone.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Silently handle UI sound failures
        });
      }
    } catch (error) {
      // Silently handle UI sound errors
    }
  }
}
