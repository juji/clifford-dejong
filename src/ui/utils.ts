import { type Options } from "@/state"

export function getHsl(options: Options, minBrightness:number = 40){
  return `hsl(${options.hue}deg,${options.saturation}%,${Math.max(
    minBrightness,options.brightness/2
  )}%)`
}
