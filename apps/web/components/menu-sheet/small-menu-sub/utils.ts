import type { AttractorParameters } from "@repo/core/types"

export interface TabProps {
  attractorParameters: AttractorParameters;
  setAttractorParams: (params: AttractorParameters) => void;
  editingParam: string | null;
  setEditingParam: (param: string | null) => void;
  handleSliderChange: (values: number[], param: string) => void;
}

// Get current parameter value
export const getParamValue = (param: string, attractorParameters: AttractorParameters, tab: "attractor" | "color" | "position"): number => {
  if (tab === "attractor" && (param === "a" || param === "b" || param === "c" || param === "d")) {
    return attractorParameters[param];
  } else if (tab === "color" && (param === "hue" || param === "saturation" || param === "brightness")) {
    return attractorParameters[param];
  } else if (tab === "position" && (param === "scale" || param === "left" || param === "top")) {
    return attractorParameters[param];
  }
  return 0;
}
