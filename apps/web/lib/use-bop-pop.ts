import { useEffect, useRef } from "react";
import { Howl } from "howler";

export function useBopPop( 
  url: string = 'https://clifford-dejong.vercel.app/bop-pop.mp3', 
  volume: number = 1, 
) {

  const sound = useRef<Howl | null>(null);

  function playBop(){
    if (sound.current) {
      sound.current.play('bop');
    } else {
      console.warn("Can't play. Sound not loaded yet");
    }
  }

  function playPop(){
    if (sound.current) {
      sound.current.play('pop');
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

  const vol = useRef(volume)
  useEffect(() => {
    if (sound.current) {
      sound.current.volume(volume);
      vol.current = volume;
    }
  }, [volume]);

  useEffect(() => {
    
    if (sound.current) {
      sound.current.unload();
    } else {
      sound.current = new Howl({
        src: [url],
        sprite: {
          bop: [0, 98],  // start at 0ms, play for 72ms
          pop: [97, 73], // start at 97ms, play for 73ms
        },
        preload: true,
        volume: vol.current ?? 1, // use the current volume or default to 1
      });
    }

    return () => {
      sound.current?.unload();
      sound.current = null;
    };
  },[ url ]);

  return { playBop, playPop, setVolume };

}