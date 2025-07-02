import { useCallback } from "react";
import { useHowl } from "./use-howl";

export function useBopPopSound(
  url: string = "https://clifford-dejong.vercel.app/bop-pop.mp3",
  volume: number = 1
) {
  const sound = useHowl({
    src: [url],
    sprite: {
      bop: [0, 98],
      pop: [97, 73],
    },
    preload: true,
    volume: volume,
  });

  const playBop = useCallback(() => {
    sound?.play("bop");
  }, [sound]);

  const playPop = useCallback(() => {
    sound?.play("pop");
  }, [sound]);

  const setVolume = useCallback(
    (newVolume: number) => {
      sound?.volume(newVolume);
    },
    [sound]
  );

  return { playBop, playPop, setVolume };
}