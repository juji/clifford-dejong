import { useEffect, useState } from "react";
import { Howl, HowlOptions } from "howler";

export function useHowl(options: HowlOptions) {
  const [sound, setSound] = useState<Howl | null>(null);

  useEffect(() => {
    const newSound = new Howl(options);
    setSound(newSound);

    return () => {
      newSound.unload();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options)]);

  return sound;
}
