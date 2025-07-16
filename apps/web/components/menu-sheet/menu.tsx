import { useUIStore } from "@/store/ui-store";
import { useAttractorStore, paramRanges } from "@repo/state/attractor-store";
import type { AttractorParameters } from "@repo/core/types";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ColorWithOpacityPicker } from "@/components/color-with-opacity-picker";
import { useRef } from "react";

// --- Extracted Components ---

type AttractorParamControlProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};
function AttractorParamControl({
  label,
  value,
  onChange,
}: AttractorParamControlProps) {
  // Get min/max from paramRanges for this parameter
  const [min, max] = paramRanges.attractor[
    label as keyof typeof paramRanges.attractor
  ] || [-5, 5];

  return (
    <div className="mb-4 w-full menu-item">
      <div className="flex items-center gap-2 w-full mb-5">
        <label className="font-semibold text-lg w-4 flex-shrink-0">
          {label}
        </label>
        <div className="flex-1 flex justify-end">
          <Input
            type="number"
            step="0.01"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-20 text-right flex-shrink-0"
          />
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={0.01}
        value={[value]}
        onValueChange={([v]) => onChange(parseFloat((v ?? 0).toFixed(2)))}
        className="flex-1"
      />
    </div>
  );
}

type ColorControlProps = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
};
function ColorControl({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: ColorControlProps) {
  return (
    <div className="mb-4 w-full menu-item">
      <div className="flex items-center gap-2 w-full mb-5">
        <label className="font-semibold text-lg w-24 flex-shrink-0">
          {label}
        </label>
        <div className="flex-1 flex justify-end">
          <Input
            type="number"
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-20 text-right flex-shrink-0"
          />
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(parseInt((v ?? 0).toFixed(0)))}
        className="flex-1"
      />
    </div>
  );
}

type PositionControlProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};
function PositionControl({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: PositionControlProps) {
  return (
    <div className="mb-4 w-full menu-item">
      <div className="flex items-center gap-2 w-full mb-5">
        <label className="font-semibold text-lg w-16 flex-shrink-0">
          {label}
        </label>
        <div className="flex-1 flex justify-end">
          <Input
            type="number"
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-24 text-right flex-shrink-0"
          />
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(parseFloat((v ?? 0).toFixed(3)))}
        className="flex-1"
      />
    </div>
  );
}

export function Menu() {
  const openTab = useUIStore((s: { openTab: string }) => s.openTab);
  const attractorParameters = useAttractorStore(
    (s: { attractorParameters: AttractorParameters }) => s.attractorParameters,
  );
  const setAttractorParams = useAttractorStore(
    (s: { setAttractorParams: (params: AttractorParameters) => void }) =>
      s.setAttractorParams,
  );

  // Set quality mode to low initially, then high after 4 seconds
  // This is to ensure the render is fast when we change the value,
  // then we can switch to high quality
  const setQualityMode = useUIStore((s) => s.setQualityMode);
  const qualityMode = useUIStore((s) => s.qualityMode);

  // Wrapper function for attractor parameters
  const qualityModeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  function updateAttractorParams(params: Partial<AttractorParameters>) {
    setAttractorParams({ ...attractorParameters, ...params });
    if (qualityMode === "high") setQualityMode("low");
    if (qualityModeTimeoutRef.current) {
      clearTimeout(qualityModeTimeoutRef.current);
    }
    qualityModeTimeoutRef.current = setTimeout(() => {
      setQualityMode("high");
    }, 2000);
  }

  return (
    <div className="space-y-4">
      {openTab === "attractor" && (
        <div className="rounded p-3">
          <div className="mb-4 font-semibold">Attractor Type</div>
          <Select
            value={attractorParameters.attractor}
            onValueChange={(value) =>
              updateAttractorParams({
                attractor: value as AttractorParameters["attractor"],
              })
            }
          >
            <SelectTrigger className="w-full mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clifford">Clifford</SelectItem>
              <SelectItem value="dejong">De Jong</SelectItem>
            </SelectContent>
          </Select>
          <div className="mb-4 font-semibold">Attractor Parameters</div>
          <AttractorParamControl
            label="a"
            value={attractorParameters.a}
            onChange={(v) => updateAttractorParams({ a: v })}
          />
          <AttractorParamControl
            label="b"
            value={attractorParameters.b}
            onChange={(v) => updateAttractorParams({ b: v })}
          />
          <AttractorParamControl
            label="c"
            value={attractorParameters.c}
            onChange={(v) => updateAttractorParams({ c: v })}
          />
          <AttractorParamControl
            label="d"
            value={attractorParameters.d}
            onChange={(v) => updateAttractorParams({ d: v })}
          />
        </div>
      )}
      {openTab === "color" && (
        <div className="rounded p-3">
          <div className="mb-4 font-semibold">Color Options</div>
          <ColorControl
            label="Hue"
            min={paramRanges.color.hue[0] as number}
            max={paramRanges.color.hue[1] as number}
            step={1}
            value={attractorParameters.hue}
            onChange={(v) => updateAttractorParams({ hue: v })}
          />
          <ColorControl
            label="Saturation"
            min={paramRanges.color.saturation[0] as number}
            max={paramRanges.color.saturation[1] as number}
            step={1}
            value={attractorParameters.saturation}
            onChange={(v) => updateAttractorParams({ saturation: v })}
          />
          <ColorControl
            label="Brightness"
            min={paramRanges.color.brightness[0] as number}
            max={paramRanges.color.brightness[1] as number}
            step={1}
            value={attractorParameters.brightness}
            onChange={(v) => updateAttractorParams({ brightness: v })}
          />
          <ColorWithOpacityPicker
            label="Background"
            color={`#${attractorParameters.background
              .slice(0, 3)
              .map((x) => x.toString(16).padStart(2, "0"))
              .join("")}`}
            opacity={attractorParameters.background[3] / 255}
            onColorChange={(color) => {
              const rgb = color
                .match(/#(..)(..)(..)/)
                ?.slice(1)
                .map((x) => parseInt(x, 16)) || [0, 0, 0];
              updateAttractorParams({
                background: [
                  rgb[0] ?? 0,
                  rgb[1] ?? 0,
                  rgb[2] ?? 0,
                  attractorParameters.background[3],
                ],
              });
            }}
            onOpacityChange={(opacity) => {
              updateAttractorParams({
                background: [
                  attractorParameters.background[0],
                  attractorParameters.background[1],
                  attractorParameters.background[2],
                  Math.round(opacity * 255),
                ],
              });
            }}
            className="mt-6"
          />
        </div>
      )}
      {openTab === "position" && (
        <div className="rounded p-3">
          <div className="mb-4 font-semibold">Position Options</div>
          <PositionControl
            label="Top"
            min={paramRanges.position.top[0] as number}
            max={paramRanges.position.top[1] as number}
            step={0.001}
            value={attractorParameters.top}
            onChange={(v) => updateAttractorParams({ top: v })}
          />
          <PositionControl
            label="Left"
            min={paramRanges.position.left[0] as number}
            max={paramRanges.position.left[1] as number}
            step={0.001}
            value={attractorParameters.left}
            onChange={(v) => updateAttractorParams({ left: v })}
          />
          <PositionControl
            label="Scale"
            min={paramRanges.position.scale[0] as number}
            max={paramRanges.position.scale[1] as number}
            step={0.001}
            value={attractorParameters.scale}
            onChange={(v) => updateAttractorParams({ scale: v })}
          />
        </div>
      )}
    </div>
  );
}
