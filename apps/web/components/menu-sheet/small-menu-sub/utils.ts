import type { AttractorParameters } from "@repo/core/types"

export interface TabProps {
  attractorParameters: AttractorParameters;
  setAttractorParams: (params: AttractorParameters) => void;
  editingParam: string | null;
  setEditingParam: (param: string | null) => void;
  handleSliderChange: (values: number[], param: string) => void;
}

// Min and max values for different parameter types
export const paramRanges = {
  attractor: {
    a: [-3, 3],
    b: [-3, 3],
    c: [-3, 3],
    d: [-3, 3]
  },
  color: {
    hue: [0, 360],
    saturation: [0, 100],
    brightness: [0, 100]
  },
  position: {
    scale: [0.1, 3],
    left: [-2, 2],
    top: [-2, 2]
  }
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
