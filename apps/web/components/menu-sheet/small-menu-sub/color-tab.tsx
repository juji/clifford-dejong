import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { paramRanges } from "@repo/state/attractor-store";
import { TabProps } from "./utils";

const ColorTab = ({
  attractorParameters,
  setAttractorParams,
  editingParam,
  setEditingParam,
  handleSliderChange,
}: TabProps) => {
  // Get current parameter value
  const getParamValue = (param: string): number => {
    if (param === "hue" || param === "saturation" || param === "brightness") {
      return attractorParameters[param];
    }
    return 0;
  };

  return (
    <div className="w-full min-w-[250px]">
      {editingParam === null ? (
        <div className="grid grid-cols-2 gap-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap flex gap-2 items-center py-2 px-4"
            onClick={() => setEditingParam("hue")}
          >
            <span>Hue:</span>
            <span className="font-semibold">{attractorParameters.hue}°</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap flex gap-2 items-center py-2 px-4"
            onClick={() => setEditingParam("saturation")}
          >
            <span>Sat:</span>
            <span className="font-semibold">
              {attractorParameters.saturation}%
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap flex gap-2 items-center py-2 px-4"
            onClick={() => setEditingParam("brightness")}
          >
            <span>Bright:</span>
            <span className="font-semibold">
              {attractorParameters.brightness}%
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap flex gap-2 items-center py-2 px-4"
            onClick={() => setEditingParam("background")}
          >
            <span>BG:</span>
            <div
              className="w-4 h-4 rounded-full border border-white/30"
              style={{
                backgroundColor: `rgba(${attractorParameters.background[0]}, ${attractorParameters.background[1]}, ${attractorParameters.background[2]}, ${attractorParameters.background[3] / 255})`,
              }}
            ></div>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setEditingParam(null)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold flex items-center gap-2">
              {editingParam === "background" ? (
                <>
                  <span>Background</span>
                </>
              ) : (
                <>
                  <span>
                    {editingParam === "hue"
                      ? "Hue"
                      : editingParam === "saturation"
                        ? "Saturation"
                        : editingParam === "brightness"
                          ? "Brightness"
                          : editingParam}
                    :
                  </span>
                  <Input
                    type="number"
                    value={getParamValue(editingParam).toFixed(0)}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value);
                      if (!isNaN(newValue)) {
                        handleSliderChange([newValue], editingParam);
                      }
                    }}
                    step={1}
                    min={
                      paramRanges.color[
                        editingParam as keyof typeof paramRanges.color
                      ]?.[0]
                    }
                    max={
                      paramRanges.color[
                        editingParam as keyof typeof paramRanges.color
                      ]?.[1]
                    }
                    className="w-full h-8 text-right"
                  />
                  <span className="flex-shrink-0">
                    {editingParam === "hue" ? "°" : "%"}
                  </span>
                </>
              )}
            </div>
          </div>

          {editingParam === "background" ? (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Color:</span>
                <input
                  type="color"
                  value={`#${attractorParameters.background
                    .slice(0, 3)
                    .map((x) => x.toString(16).padStart(2, "0"))
                    .join("")}`}
                  onChange={(e) => {
                    const hexValue = e.target.value.substring(1); // Remove the #
                    const r = parseInt(hexValue.substring(0, 2), 16);
                    const g = parseInt(hexValue.substring(2, 4), 16);
                    const b = parseInt(hexValue.substring(4, 6), 16);

                    setAttractorParams({
                      ...attractorParameters,
                      background: [r, g, b, attractorParameters.background[3]],
                    });
                  }}
                  className="w-16 h-8"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">Opacity:</span>
                <Input
                  type="number"
                  value={(
                    (attractorParameters.background[3] / 255) *
                    100
                  ).toFixed(0)}
                  onChange={(e) => {
                    const opacityPercent = parseFloat(e.target.value);
                    if (!isNaN(opacityPercent)) {
                      const opacity = Math.round((opacityPercent / 100) * 255);
                      setAttractorParams({
                        ...attractorParameters,
                        background: [
                          attractorParameters.background[0],
                          attractorParameters.background[1],
                          attractorParameters.background[2],
                          opacity,
                        ],
                      });
                    }
                  }}
                  min={0}
                  max={100}
                  step={1}
                  className="w-20 h-8 text-right"
                />
                <span className="flex-shrink-0">%</span>
              </div>
            </div>
          ) : (
            <Slider
              min={
                paramRanges.color[
                  editingParam as keyof typeof paramRanges.color
                ]?.[0]
              }
              max={
                paramRanges.color[
                  editingParam as keyof typeof paramRanges.color
                ]?.[1]
              }
              step={1}
              value={[getParamValue(editingParam)]}
              onValueChange={(values) =>
                handleSliderChange(values, editingParam)
              }
              className="my-4"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ColorTab;
