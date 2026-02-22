/**
 * Audio Manager for Immersive Reading Sessions
 * Handles background music playback with smooth transitions, volume control, and error recovery
 */

class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.currentTheme = null;
    this.volume = 0.3;
    this.isMuted = false;
    this.isPlaying = false;
    this.fadeInterval = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.cache = new Map(); // theme identifier -> Audio object
  }

  /**
   * Preload audio without playing
   */
  preload(theme, audioUrl) {
    if (this.cache.has(theme)) return;
    try {
      const audio = new Audio(audioUrl);
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = 0;
      this.cache.set(theme, audio);
    } catch (error) {
      console.error('[AudioManager] Preload failed:', error);
    }
  }

  /**
   * Load and play audio with fade in.
   * Uses a fast crossfade: old audio cuts immediately, new audio fades in.
   * Does NOT block the caller for the full fade duration — returns quickly.
   * @param {string} theme - Theme identifier
   * @param {string} audioUrl - URL of the audio file
   * @param {number} fadeDuration - Fade in duration in ms (default: 800)
   */
  async play(theme, audioUrl, fadeDuration = 800) {
    try {
      // Already playing this theme — just unmute if needed
      if (this.currentTheme === theme && this.currentAudio && !this.currentAudio.paused) {
        if (this.isMuted) this.toggleMute();
        return;
      }

      // Instantly cut the old audio (no blocking await)
      if (this.currentAudio) {
        this.clearFade();
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      }
      this.isPlaying = false;
      this.currentTheme = theme;

      // Grab from cache or create new
      let audio;
      if (this.cache.has(theme)) {
        audio = this.cache.get(theme);
        audio.currentTime = 0;
      } else {
        audio = new Audio(audioUrl);
        audio.loop = true;
        audio.preload = 'auto';
        this.cache.set(theme, audio);
      }

      audio.volume = 0;
      this.currentAudio = audio;

      // Wire up error/ended handlers (remove old ones first to avoid stacking)
      audio.onerror = this.handleError.bind(this);
      audio.onended = this.handleEnded.bind(this);

      // Start playback
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      this.isPlaying = true;

      // Fade in — don't await this, let it run in background
      this._fadeIn(fadeDuration);

      this.retryCount = 0;
    } catch (error) {
      console.error('[AudioManager] Failed to play audio:', error);
      // Don't call handleError recursively for AbortError (happens when quickly switching themes)
      if (error.name !== 'AbortError') {
        this.handleError(error);
      }
    }
  }

  /**
   * Stop audio with fade out (awaitable, used for deliberate stops like exiting session)
   * @param {number} fadeDuration - Fade out duration in ms (default: 600)
   */
  async stop(fadeDuration = 600) {
    if (!this.currentAudio) return;
    try {
      await this._fadeOut(fadeDuration);
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentTheme = null;
      this.isPlaying = false;
    } catch (error) {
      console.error('[AudioManager] Error stopping audio:', error);
    }
  }

  /**
   * Instantly stop without any fade — used for preview cleanup when dialog closes
   */
  stopImmediate() {
    this.clearFade();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.currentTheme = null;
    this.isPlaying = false;
  }

  /**
   * Pause audio with fade out
   */
  async pause(fadeDuration = 400) {
    if (!this.currentAudio || !this.isPlaying) return;
    try {
      await this._fadeOut(fadeDuration);
      this.currentAudio.pause();
      this.isPlaying = false;
    } catch (error) {
      console.error('[AudioManager] Error pausing audio:', error);
    }
  }

  /**
   * Resume audio with fade in
   */
  async resume(fadeDuration = 400) {
    if (!this.currentAudio || this.isPlaying) return;
    try {
      await this.currentAudio.play();
      this.isPlaying = true;
      this._fadeIn(fadeDuration);
    } catch (error) {
      console.error('[AudioManager] Error resuming audio:', error);
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    if (!this.currentAudio) return;
    this.isMuted = !this.isMuted;
    this.currentAudio.volume = this.isMuted ? 0 : this.volume;

    if (!this.isMuted && this.currentAudio.paused) {
      this.currentAudio.play().then(() => {
        this.isPlaying = true;
      }).catch(e => console.error('[AudioManager] toggleMute play fallback failed:', e));
    }
    return this.isMuted;
  }

  /**
   * Set volume
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentAudio && !this.isMuted) {
      this.currentAudio.volume = this.volume;
      if (this.volume > 0 && this.currentAudio.paused) {
        this.currentAudio.play().then(() => {
          this.isPlaying = true;
        }).catch(e => console.error('[AudioManager] setVolume play fallback failed:', e));
      }
    }
  }

  /**
   * Fade in — fires and returns immediately (non-blocking for callers)
   * @param {number} duration - Fade duration in ms
   */
  _fadeIn(duration) {
    if (!this.currentAudio) return;
    const steps = 20; // Reduced from 50 — still smooth, 2.5x faster
    const stepDuration = duration / steps;
    const volumeIncrement = this.volume / steps;
    let currentStep = 0;
    this.clearFade();

    this.fadeInterval = setInterval(() => {
      currentStep++;
      if (!this.currentAudio) { this.clearFade(); return; }
      if (currentStep >= steps) {
        this.currentAudio.volume = this.isMuted ? 0 : this.volume;
        this.clearFade();
      } else {
        this.currentAudio.volume = this.isMuted ? 0 : volumeIncrement * currentStep;
      }
    }, stepDuration);
  }

  /**
   * Fade out — awaitable, used when caller needs to wait for silence
   * @param {number} duration - Fade duration in ms
   */
  _fadeOut(duration) {
    return new Promise((resolve) => {
      if (!this.currentAudio) { resolve(); return; }
      const steps = 20;
      const stepDuration = duration / steps;
      const startVolume = this.currentAudio.volume;
      const volumeDecrement = startVolume / steps;
      let currentStep = 0;
      this.clearFade();

      this.fadeInterval = setInterval(() => {
        currentStep++;
        if (!this.currentAudio) { this.clearFade(); resolve(); return; }
        if (currentStep >= steps) {
          this.currentAudio.volume = 0;
          this.clearFade();
          resolve();
        } else {
          this.currentAudio.volume = Math.max(0, startVolume - volumeDecrement * currentStep);
        }
      }, stepDuration);
    });
  }

  /** @deprecated Use _fadeIn / _fadeOut */
  fadeIn(duration) { this._fadeIn(duration); return Promise.resolve(); }
  /** @deprecated Use _fadeIn / _fadeOut */
  fadeOut(duration) { return this._fadeOut(duration); }

  clearFade() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  handleError(error) {
    console.error('[AudioManager] Audio error:', error);
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        if (this.currentAudio && this.currentTheme) {
          this.currentAudio.play().catch(err => {
            console.error('[AudioManager] Retry failed:', err);
          });
        }
      }, 1000 * this.retryCount);
    } else {
      this.isPlaying = false;
    }
  }

  handleEnded() {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.currentTime = 0;
      this.currentAudio.play().catch(error => {
        console.error('[AudioManager] Failed to restart audio:', error);
      });
    }
  }

  getState() {
    return {
      theme: this.currentTheme,
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
    };
  }

  cleanup() {
    this.clearFade();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.currentTheme = null;
    this.isPlaying = false;
  }
}

// Export singleton instance
export default new AudioManager();
