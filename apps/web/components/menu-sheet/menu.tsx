import { useUIStore } from "../../store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";
import type { AttractorParameters } from "@repo/core/types";
import { Slider } from "../ui/slider";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";

export function Menu() {
  const openTab = useUIStore((s: { openTab: string }) => s.openTab);
  const attractorParameters = useAttractorStore((s: { attractorParameters: AttractorParameters }) => s.attractorParameters);
  const setAttractorParams = useAttractorStore((s: { setAttractorParams: (params: AttractorParameters) => void }) => s.setAttractorParams);

  function handleParamChange(param: keyof Pick<AttractorParameters, 'a' | 'b' | 'c' | 'd'>, value: number) {
    setAttractorParams({ ...attractorParameters, [param]: value });
  }

  function handleTypeChange(value: string) {
    setAttractorParams({ ...attractorParameters, attractor: value as AttractorParameters['attractor'] });
  }

  function renderAttractorParamControl(param: keyof Pick<AttractorParameters, 'a' | 'b' | 'c' | 'd'>, label: string) {
    return (
      <div className="mb-4 w-full menu-item">
        <div className="flex items-center gap-2 w-full mb-1">
          <label className="font-semibold text-lg w-4 flex-shrink-0">{label}</label>
          <div className="flex-1 flex justify-end">
            <Input
              type="number"
              step="0.01"
              min={-5}
              max={5}
              value={attractorParameters[param]}
              onChange={e => handleParamChange(param, parseFloat(e.target.value))}
              className="w-20 text-right flex-shrink-0"
            />
          </div>
        </div>
        <Slider
          min={-5}
          max={5}
          step={0.01}
          value={[attractorParameters[param]]}
          onValueChange={([v]) => handleParamChange(param, parseFloat((v ?? 0).toFixed(2)))}
          className="flex-1"
        />
      </div>
    );
  }

  function renderColorControl(param: keyof Pick<AttractorParameters, 'hue' | 'saturation' | 'brightness'>, label: string, min: number, max: number, step: number = 1) {
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
              value={attractorParameters[param]}
              onChange={e => setAttractorParams({ ...attractorParameters, [param]: parseInt(e.target.value) })}
              className="w-20 text-right flex-shrink-0"
            />
          </div>
        </div>
        <Slider
          min={min}
          max={max}
          step={step}
          value={[attractorParameters[param]]}
          onValueChange={([v]) => setAttractorParams({ ...attractorParameters, [param]: parseInt((v ?? 0).toFixed(0)) })}
          className="flex-1"
        />
      </div>
    );
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
          {renderAttractorParamControl('a', 'a')}
          {renderAttractorParamControl('b', 'b')}
          {renderAttractorParamControl('c', 'c')}
          {renderAttractorParamControl('d', 'd')}
        </div>
      )}
      {openTab === "color" && (
        <div className="rounded p-3">
          <div className="mb-4 font-semibold">Color Options</div>
          {renderColorControl('hue', 'Hue', 0, 360, 1)}
          {renderColorControl('saturation', 'Saturation', 0, 100, 1)}
          {renderColorControl('brightness', 'Brightness', 0, 100, 1)}
        </div>
      )}
      {openTab === "position" && (
        <div className="rounded p-3">Position tab content goes here.</div>
      )}
    </div>
  );
}