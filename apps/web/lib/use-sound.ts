import { useEffect, useRef } from "react";
import { Howl } from "howler";

export function useSound( 
  url: string, 
  volume: number = 1, 
  onload?: () => void
) {

  const sound = useRef<Howl | null>(null);

  function play(){
    if (sound.current) {
      sound.current.play();
    } else {
      console.warn("Can't play. Sound not loaded yet");
    }
  }

  function setVolume( newVolume: number ) {
    if (sound.current) {
      sound.current.volume(newVolume);
    } else {
      console.warn("Can't set volume. Sound not loaded yet");
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
        onload,
      });
    }

    return () => {
      sound.current?.unload();
      sound.current = null;
    };
  },[ url, volume, onload ]);

  return { play, setVolume };

}