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
  }

  /**
   * Load and play audio with fade in
   * @param {string} theme - Theme identifier
   * @param {string} audioUrl - URL of the audio file
   * @param {number} fadeDuration - Fade in duration in ms (default: 2000)
   */
  async play(theme, audioUrl, fadeDuration = 2000) {
    try {
      // Stop current audio if playing
      if (this.currentAudio) {
        await this.stop(1000);
      }

      this.currentTheme = theme;
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.loop = true;
      this.currentAudio.volume = 0;

      // Preload audio
      this.currentAudio.preload = 'auto';

      // Add error handling
      this.currentAudio.addEventListener('error', this.handleError.bind(this));
      
      // Add ended event (in case loop fails)
      this.currentAudio.addEventListener('ended', this.handleEnded.bind(this));

      // Try to play
      await this.currentAudio.play();
      this.isPlaying = true;

      // Fade in
      await this.fadeIn(fadeDuration);

      this.retryCount = 0; // Reset retry count on success
      
      console.log(`[AudioManager] Playing theme: ${theme}`);
    } catch (error) {
      console.error('[AudioManager] Failed to play audio:', error);
      this.handleError(error);
    }
  }

  /**
   * Stop audio with fade out
   * @param {number} fadeDuration - Fade out duration in ms (default: 1000)
   */
  async stop(fadeDuration = 1000) {
    if (!this.currentAudio) return;

    try {
      await this.fadeOut(fadeDuration);
      
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentTheme = null;
      this.isPlaying = false;

      console.log('[AudioManager] Audio stopped');
    } catch (error) {
      console.error('[AudioManager] Error stopping audio:', error);
    }
  }

  /**
   * Pause audio with fade out
   */
  async pause(fadeDuration = 500) {
    if (!this.currentAudio || !this.isPlaying) return;

    try {
      await this.fadeOut(fadeDuration);
      this.currentAudio.pause();
      this.isPlaying = false;
      
      console.log('[AudioManager] Audio paused');
    } catch (error) {
      console.error('[AudioManager] Error pausing audio:', error);
    }
  }

  /**
   * Resume audio with fade in
   */
  async resume(fadeDuration = 500) {
    if (!this.currentAudio || this.isPlaying) return;

    try {
      await this.currentAudio.play();
      this.isPlaying = true;
      await this.fadeIn(fadeDuration);
      
      console.log('[AudioManager] Audio resumed');
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
    
    console.log(`[AudioManager] Muted: ${this.isMuted}`);
    return this.isMuted;
  }

  /**
   * Set volume
   * @param {number} vol - Volume level (0.0 to 1.0)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    
    if (this.currentAudio && !this.isMuted) {
      this.currentAudio.volume = this.volume;
    }
    
    console.log(`[AudioManager] Volume set to: ${this.volume}`);
  }

  /**
   * Fade in audio
   * @param {number} duration - Fade duration in ms
   */
  fadeIn(duration) {
    return new Promise((resolve) => {
      if (!this.currentAudio) {
        resolve();
        return;
      }

      const steps = 50;
      const stepDuration = duration / steps;
      const volumeIncrement = this.volume / steps;
      let currentStep = 0;

      this.clearFade();

      this.fadeInterval = setInterval(() => {
        currentStep++;
        
        if (currentStep >= steps) {
          this.currentAudio.volume = this.isMuted ? 0 : this.volume;
          this.clearFade();
          resolve();
        } else {
          const newVolume = volumeIncrement * currentStep;
          this.currentAudio.volume = this.isMuted ? 0 : newVolume;
        }
      }, stepDuration);
    });
  }

  /**
   * Fade out audio
   * @param {number} duration - Fade duration in ms
   */
  fadeOut(duration) {
    return new Promise((resolve) => {
      if (!this.currentAudio) {
        resolve();
        return;
      }

      const steps = 50;
      const stepDuration = duration / steps;
      const currentVolume = this.currentAudio.volume;
      const volumeDecrement = currentVolume / steps;
      let currentStep = 0;

      this.clearFade();

      this.fadeInterval = setInterval(() => {
        currentStep++;
        
        if (currentStep >= steps) {
          this.currentAudio.volume = 0;
          this.clearFade();
          resolve();
        } else {
          const newVolume = currentVolume - (volumeDecrement * currentStep);
          this.currentAudio.volume = Math.max(0, newVolume);
        }
      }, stepDuration);
    });
  }

  /**
   * Clear fade interval
   */
  clearFade() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  /**
   * Handle audio errors
   */
  handleError(error) {
    console.error('[AudioManager] Audio error:', error);
    
    // Retry logic
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`[AudioManager] Retrying... (${this.retryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        if (this.currentAudio && this.currentTheme) {
          this.currentAudio.play().catch(err => {
            console.error('[AudioManager] Retry failed:', err);
          });
        }
      }, 1000 * this.retryCount);
    } else {
      console.error('[AudioManager] Max retries reached. Audio playback failed.');
      this.isPlaying = false;
    }
  }

  /**
   * Handle audio ended (shouldn't happen with loop, but as fallback)
   */
  handleEnded() {
    if (this.currentAudio && this.isPlaying) {
      console.log('[AudioManager] Audio ended unexpectedly, restarting...');
      this.currentAudio.currentTime = 0;
      this.currentAudio.play().catch(error => {
        console.error('[AudioManager] Failed to restart audio:', error);
      });
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      theme: this.currentTheme,
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
    };
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.clearFade();
    
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    this.currentTheme = null;
    this.isPlaying = false;
    
    console.log('[AudioManager] Cleaned up');
  }
}

// Export singleton instance
export default new AudioManager();
