import { useEffect, useRef } from 'react';
import { Howl } from 'howler';


export function useDoneSound(
  url: string = 'https://clifford-dejong.vercel.app/done.mp3',
  volume: number = 1,
){

  const sound = useRef<Howl | null>(null);

  function playDone() {
    if (sound.current) {
      sound.current.play();
    } else {
      console.warn("Can't play. Sound not loaded yet");
    }
  }

  useEffect(() => {
    if (sound.current) {
      sound.current.unload();
    } else {
      sound.current = new Howl({
        src: [url],
        preload: true,
        volume: volume,
      });
    }

    return () => {
      sound.current?.unload();
      sound.current = null;
    };
  }, [url, volume]);

  return { playDone };

}