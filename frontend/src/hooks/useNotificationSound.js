import { useState, useEffect, useCallback } from 'react';
import { Howl, Howler } from 'howler';

const useNotificationSound = () => {
  // Store sound settings in localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('sound_volume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });

  // Create Howl instances
  const [sounds] = useState({
    notification: new Howl({ src: ['/sounds/notification.ogg'], html5: true, volume }),
    alert: new Howl({ src: ['/sounds/alert.ogg'], html5: true, volume }),
    success: new Howl({ src: ['/sounds/success.ogg'], html5: true, volume }),
    error: new Howl({ src: ['/sounds/error.ogg'], html5: true, volume }),
  });

  // Update volume for all sounds when it changes
  useEffect(() => {
    localStorage.setItem('sound_volume', volume.toString());
    Howler.volume(volume);
  }, [volume]);

  // Save enabled state
  useEffect(() => {
    localStorage.setItem('sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // iOS / Android Autoplay Unlock
  // Browsers block audio until the first user interaction.
  useEffect(() => {
    const unlockAudio = () => {
      // Create empty buffer to unlock audio context
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      
      // Clean up after first interaction
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };

    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
  }, []);

  const playSound = useCallback((type) => {
    if (!soundEnabled) return;
    
    // Check if document is hidden or user has not interacted (fallback logic can go here)
    if (sounds[type]) {
      sounds[type].play();
    }
  }, [soundEnabled, sounds]);

  return {
    playSound,
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume,
    playNotification: () => playSound('notification'),
    playAlert: () => playSound('alert'),
    playSuccess: () => playSound('success'),
    playError: () => playSound('error')
  };
};

export default useNotificationSound;
