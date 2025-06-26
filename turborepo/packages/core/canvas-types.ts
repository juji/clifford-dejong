// Types for attractor options and canvas props
export type AttractorType = "clifford" | "dejong";

export interface CanvasOptions {
  attractor: AttractorType;
  a: number;
  b: number;
  c: number;
  d: number;
  hue: number;
  saturation: number;
  brightness: number;
  background: [number, number, number, number]; // RGBA format
  scale: number;
  left: number;
  top: number;
}

export interface CanvasProps {
  options: CanvasOptions;
  width: number;
  height: number;
  onProgress?: (progress: number) => void;
  onImageReady?: (img: string) => void;
}
