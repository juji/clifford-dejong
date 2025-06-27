import { useEffect, useRef } from "react";
import { Howl } from "howler";

export function useSound( url: string, volume: number = 1 ) {

  const sound = useRef<Howl | null>(null);

  function play(){
    if (sound.current) {
      sound.current.play();
    } else {
      console.warn("Sound not loaded yet");
    }
  }

  function setVolume( newVolume: number ) {
    if (sound.current) {
      sound.current.volume(newVolume);
    } else {
      console.warn("Sound not loaded yet");
    }
  }

  useEffect(() => {
    if (sound.current) {
      sound.current.unload();
    } else {
      sound.current = new Howl({
        src: [url],
        preload: true,
        volume,
      });
    }

    return () => {
      sound.current?.unload();
      sound.current = null;
    };
  },[ url, volume ]);

  return [ play, setVolume ];

}