import type { CanvasSize, QualityMode } from "@/store/ui-store";
import type { AttractorParameters } from "@repo/core/types";

export type ObservableAttractorData = {
  canvas: OffscreenCanvas | null;
  canvasSize: CanvasSize | null;
  attractorParameters: AttractorParameters | null;
  qualityMode: QualityMode | null;
};
