import { useCallback } from "react";
import { useHowl } from "./use-howl";

export function useDoneSound(
  url: string = 'https://clifford-dejong.vercel.app/done.mp3',
  volume: number = 1
) {
  const sound = useHowl({
    src: [url],
    preload: true,
    volume: volume,
  });

  const playDone = useCallback(() => {
    sound?.play();
  }, [sound]);

  return { playDone };
}