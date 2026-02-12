export const playBing = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  audio.play().catch(e => console.log("Audio blocked", e));
};

export const playFinalTada = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3");
  audio.play().catch(e => console.log("Audio blocked", e));
};

export const playStepAlert = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
  audio.volume = 0.8;
  audio.play().catch(e => console.log("Audio blocked", e));
};