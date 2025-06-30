import { useUIStore } from "../../store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";
import type { AttractorParameters } from "@repo/core/types";
import { Slider } from "../ui/slider";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";
import { ColorWithOpacityPicker } from "../ui/color-with-opacity-picker";
import { useEffect, useRef } from "react";

// --- Extracted Components ---

type AttractorParamControlProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};
function AttractorParamControl({ label, value, onChange }: AttractorParamControlProps) {
  return (
    <div className="mb-4 w-full menu-item">
      <div className="flex items-center gap-2 w-full mb-5">
        <label className="font-semibold text-lg w-4 flex-shrink-0">{label}</label>
        <div className="flex-1 flex justify-end">
          <Input
            type="number"
            step="0.01"
            min={-5}
            max={5}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-20 text-right flex-shrink-0"
          />
        </div>
      </div>
      <Slider
        min={-5}
        max={5}
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
function ColorControl({ label, min, max, step = 1, value, onChange }: ColorControlProps) {
  return (
    <div className="mb-4 w-full menu-item">
      <div className="flex items-center gap-2 w-full mb-5">
        <label className="font-semibold text-lg w-24 flex-shrink-0">{label}</label>
        <div className="flex-1 flex justify-end">
          <Input
            type="number"
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={e => onChange(parseInt(e.target.value))}
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
function PositionControl({ label, min, max, step, value, onChange }: PositionControlProps) {
  return (
    <div className="mb-4 w-full menu-item">
      <div className="flex items-center gap-2 w-full mb-5">
        <label className="font-semibold text-lg w-16 flex-shrink-0">{label}</label>
        <div className="flex-1 flex justify-end">
          <Input
            type="number"
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
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
  const attractorParameters = useAttractorStore((s: { attractorParameters: AttractorParameters }) => s.attractorParameters);
  const setAttractorParams = useAttractorStore((s: { setAttractorParams: (params: AttractorParameters) => void }) => s.setAttractorParams);

  const menuOpen = useUIStore((s) => s.menuOpen)
  
  // Set quality mode to low initially, then high after 4 seconds
  // This is to ensure the render is fast when we change the value, 
  // then we can switch to high quality
  const setQualityMode = useUIStore((s => s.setQualityMode));
  const qualityMode = useUIStore((s => s.qualityMode));
  const initRef = useRef(false);

  useEffect(() => {
    if (menuOpen) {
      initRef.current = false; // reset initRef when menu opens
    }
  }, [menuOpen]);
  useEffect(() => {
    // prevent this from executing on initial render
    if (!initRef.current) {
      initRef.current = true;
      return;
    }
    setQualityMode("low");
  }, 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [attractorParameters, initRef])

  const qualityModeTimeoutRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(() => {
    if(qualityMode === "high") return; 
    if(qualityModeTimeoutRef.current){
      clearTimeout(qualityModeTimeoutRef.current);
    }
    // only set to high after 3 seconds
    qualityModeTimeoutRef.current = setTimeout(() => {
      setQualityMode("high");
    }, 3000);
    
    return () => {
      if (qualityModeTimeoutRef.current) clearTimeout(qualityModeTimeoutRef.current);
    };
  }, 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [ qualityMode ])

  function handleParamChange(param: keyof Pick<AttractorParameters, 'a' | 'b' | 'c' | 'd'>, value: number) {
    setAttractorParams({ ...attractorParameters, [param]: value });
  }

  function handleTypeChange(value: string) {
    setAttractorParams({ ...attractorParameters, attractor: value as AttractorParameters['attractor'] });
  }

  return (
    <div className="space-y-4">
      {openTab === "attractor" && (
        <div className="rounded p-3">
          <div className="mb-4 font-semibold">Attractor Type</div>
          <Select value={attractorParameters.attractor} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clifford">Clifford</SelectItem>
              <SelectItem value="dejong">De Jong</SelectItem>
            </SelectContent>
          </Select>
          <div className="mb-4 font-semibold">Attractor Parameters</div>
          <AttractorParamControl label="a" value={attractorParameters.a} onChange={v => handleParamChange('a', v)} />
          <AttractorParamControl label="b" value={attractorParameters.b} onChange={v => handleParamChange('b', v)} />
          <AttractorParamControl label="c" value={attractorParameters.c} onChange={v => handleParamChange('c', v)} />
          <AttractorParamControl label="d" value={attractorParameters.d} onChange={v => handleParamChange('d', v)} />
        </div>
      )}
      {openTab === "color" && (
        <div className="rounded p-3">
          <div className="mb-4 font-semibold">Color Options</div>
          <ColorControl label="Hue" min={0} max={360} step={1} value={attractorParameters.hue} onChange={v => setAttractorParams({ ...attractorParameters, hue: v })} />
          <ColorControl label="Saturation" min={0} max={100} step={1} value={attractorParameters.saturation} onChange={v => setAttractorParams({ ...attractorParameters, saturation: v })} />
          <ColorControl label="Brightness" min={0} max={100} step={1} value={attractorParameters.brightness} onChange={v => setAttractorParams({ ...attractorParameters, brightness: v })} />
          <ColorWithOpacityPicker
            label="Background"
            color={`#${attractorParameters.background.slice(0,3).map(x=>x.toString(16).padStart(2,"0")).join("")}`}
            opacity={attractorParameters.background[3] / 255}
            onColorChange={color => {
              const rgb = color.match(/#(..)(..)(..)/)?.slice(1).map(x => parseInt(x, 16)) || [0,0,0];
              setAttractorParams({
                ...attractorParameters,
                background: [
                  rgb[0] ?? 0,
                  rgb[1] ?? 0,
                  rgb[2] ?? 0,
                  attractorParameters.background[3]
                ]
              });
            }}
            onOpacityChange={opacity => {
              setAttractorParams({
                ...attractorParameters,
                background: [
                  attractorParameters.background[0],
                  attractorParameters.background[1],
                  attractorParameters.background[2],
                  Math.round(opacity * 255)
                ]
              });
            }}
            className="mt-6"
          />
        </div>
      )}
      {openTab === "position" && (
        <div className="rounded p-3">
          <div className="mb-4 font-semibold">Position Options</div>
          <PositionControl label="Top" min={-1} max={1} step={0.001} value={attractorParameters.top} onChange={v => setAttractorParams({ ...attractorParameters, top: v })} />
          <PositionControl label="Left" min={-1} max={1} step={0.001} value={attractorParameters.left} onChange={v => setAttractorParams({ ...attractorParameters, left: v })} />
          <PositionControl label="Scale" min={0.001} max={5} step={0.001} value={attractorParameters.scale} onChange={v => setAttractorParams({ ...attractorParameters, scale: v })} />
        </div>
      )}
    </div>
  );
}