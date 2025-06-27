import { useEffect, useRef } from "react";
import { Howl } from "howler";

const fadeInInterval = 100; // milliseconds
const fadeOutInterval = 100; // milliseconds
const fadeInStep = 0.1; // volume step for fade in
const fadeOutStep = 0.2; // volume step for fade out
const maxVolume = 1; // maximum volume level

export function useWaitingSound( 
  url: string = 'https://clifford-dejong.vercel.app/waiting.mp3'
) {

  const sound = useRef<Howl | null>(null);

  const fadeInRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeOutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  function fadeIn(){
    if (!sound.current) {
      console.warn("Can't play. Sound not loaded yet");
    } else {
      if(fadeInRef.current) {
        clearInterval(fadeInRef.current);
      }
      
      sound.current.volume(0);
      if(!sound.current.playing()) {
        sound.current.play();
      }
      
      fadeInRef.current = setInterval(() => {
        const currentVolume = sound.current?.volume() ?? 0;
        if (currentVolume < maxVolume) {
          sound.current?.volume(Math.min(currentVolume + fadeInStep, maxVolume));
        } else {
          clearInterval(fadeInRef.current!);
          fadeInRef.current = null;
        }
      },fadeInInterval)
    }
  }

  function fadeOut(){
    if (!sound.current) {
      console.warn("Can't play. Sound not loaded yet");
    } else {
      if(fadeOutRef.current) {
        clearInterval(fadeOutRef.current);
      }
      sound.current.volume(0);
      fadeOutRef.current = setInterval(() => {
        const currentVolume = sound.current?.volume() ?? 0;
        if (currentVolume > 0) {
          sound.current?.volume(Math.max(currentVolume - fadeOutStep, 0));
        } else {
          clearInterval(fadeOutRef.current!);
          fadeOutRef.current = null;
          sound.current?.stop(); // Stop the sound when faded out
        }
      }, fadeOutInterval)
    }
  }

  useEffect(() => {
    
    if (sound.current) {
      sound.current.unload();
    } else {
      sound.current = new Howl({
        src: [url],
        preload: true,
        volume: 0,
        loop: true, // Loop the sound
      });
    }

    return () => {
      sound.current?.unload();
      sound.current = null;
    };
  },[ url ]);

  return { fadeIn, fadeOut };

}