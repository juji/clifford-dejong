import { useUIStore } from "../../store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";
import type { AttractorParameters } from "@repo/core/types";

export function Menu() {
  const openTab = useUIStore((s: { openTab: string }) => s.openTab);
  const attractorParameters = useAttractorStore((s: { attractorParameters: AttractorParameters }) => s.attractorParameters);
  const setAttractorParams = useAttractorStore((s: { setAttractorParams: (params: AttractorParameters) => void }) => s.setAttractorParams);

  function handleAChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAttractorParams({ ...attractorParameters, a: parseFloat(e.target.value) });
  }

  return (
    <div className="space-y-4">
      {openTab === "attractor" && (
        <div className="bg-muted rounded p-3">
          <div className="mb-2 font-semibold">Attractor Parameters</div>
          <label className="block mb-2">
            a:
            <input
              type="number"
              value={attractorParameters.a}
              onChange={handleAChange}
              className="ml-2 border rounded px-2 py-1 w-24"
            />
          </label>
        </div>
      )}
      {openTab === "color" && (
        <div className="bg-muted rounded p-3">Color tab content goes here.</div>
      )}
      {openTab === "position" && (
        <div className="bg-muted rounded p-3">Position tab content goes here.</div>
      )}
    </div>
  );
}