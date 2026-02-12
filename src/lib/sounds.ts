export const playBing = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  audio.play().catch(e => console.log("Audio blocked", e));
};

export const playFinalTada = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3");
  audio.play().catch(e => console.log("Audio blocked", e));
};

export const playStepAlert = () => {
  // Loud, long alarm/bell sound - audible over shower noise
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  audio.volume = 1.0;
  audio.play().catch(e => console.log("Audio blocked", e));
  // Play a second time after 1.5s for emphasis
  setTimeout(() => {
    const audio2 = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio2.volume = 1.0;
    audio2.play().catch(e => console.log("Audio blocked", e));
  }, 1500);
};