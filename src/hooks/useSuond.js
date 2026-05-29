import { useCallback, useRef } from "react";

export function useSound(url) {
  const audioRef = useRef(null);
  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.volume = 0.5;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(e => console.log("Audio play failed:", e));
  }, [url]);
  return play;
}
