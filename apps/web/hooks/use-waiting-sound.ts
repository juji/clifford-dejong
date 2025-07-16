import { useCallback } from "react";
import { useHowl } from "./use-howl";

const FADE_DURATION = 1000; // 1 second

export function useWaitingSound(
  url: string = "https://clifford-dejong.vercel.app/waiting.mp3",
) {
  const sound = useHowl({
    src: [url],
    preload: true,
    volume: 0,
    loop: true,
  });

  const fadeIn = useCallback(() => {
    if (!sound) return;

    if (!sound.playing()) {
      sound.play();
    }
    sound.fade(sound.volume(), 1, FADE_DURATION);
  }, [sound]);

  const fadeOut = useCallback(() => {
    if (!sound) return;

    sound.fade(sound.volume(), 0, FADE_DURATION);
    // Howler doesn't stop the sound on fade to 0, so we listen for the
    // fade event to complete and then stop it manually.
    sound.once("fade", (id) => {
      // Check if volume is 0 before stopping
      if (sound.volume(id) === 0) {
        sound.stop(id);
      }
    });
  }, [sound]);

  return { fadeIn, fadeOut };
}
