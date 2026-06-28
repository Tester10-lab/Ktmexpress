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

  // Create Howl instances - only keeping success sound as requested
  const [sounds] = useState({
    success: new Howl({ src: ['/sounds/success.ogg'], volume }),
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

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    
    // Always play the success sound regardless of type
    if (sounds.success) {
      sounds.success.play();
    }
  }, [soundEnabled, sounds]);

  return {
    playSound,
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume,
    playNotification: playSound,
    playAlert: playSound,
    playSuccess: playSound,
    playError: playSound
  };
};

export default useNotificationSound;
