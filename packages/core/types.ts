export type AttractorParameters = {
  attractor: "clifford" | "dejong";
  a: number;
  b: number;
  c: number;
  d: number;
  hue: number;
  saturation: number;
  brightness: number;
  background: [number, number, number, number];
  scale: number;
  left: number;
  top: number;
};
