import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { paramRanges } from "@repo/state/attractor-store";
import { TabProps } from "./utils";

const AttractorTab = ({
  attractorParameters,
  setAttractorParams,
  editingParam,
  setEditingParam,
  handleSliderChange,
}: TabProps) => {
  // Get current parameter value
  const getParamValue = (param: string): number => {
    if (param === "a" || param === "b" || param === "c" || param === "d") {
      return attractorParameters[param];
    }
    return 0;
  };

  return (
    <div className="mb-2 w-full">
      {editingParam === null ? (
        <>
          <Select
            value={attractorParameters.attractor}
            onValueChange={(value) =>
              setAttractorParams({
                ...attractorParameters,
                attractor: value as "clifford" | "dejong",
              })
            }
          >
            <SelectTrigger className="w-full mb-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="top"
              sideOffset={5}
              align="center"
              className="z-[300]" // Higher z-index to ensure it appears above other elements
            >
              <SelectItem value="clifford">Clifford</SelectItem>
              <SelectItem value="dejong">De Jong</SelectItem>
            </SelectContent>
          </Select>

          {/* Parameter buttons - responsive layout (grid below 400px, row above) */}
          <div className="grid grid-cols-2 min-[400px]:flex min-[400px]:flex-row overflow-x-auto gap-2 pb-2">
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap flex gap-2 items-center justify-center py-2 px-4"
              onClick={() => setEditingParam("a")}
            >
              <span>a:</span>
              <span className="font-semibold">
                {attractorParameters.a.toFixed(1)}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap flex gap-2 items-center justify-center py-2 px-4"
              onClick={() => setEditingParam("b")}
            >
              <span>b:</span>
              <span className="font-semibold">
                {attractorParameters.b.toFixed(1)}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap flex gap-2 items-center justify-center py-2 px-4"
              onClick={() => setEditingParam("c")}
            >
              <span>c:</span>
              <span className="font-semibold">
                {attractorParameters.c.toFixed(1)}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap flex gap-2 items-center justify-center py-2 px-4"
              onClick={() => setEditingParam("d")}
            >
              <span>d:</span>
              <span className="font-semibold">
                {attractorParameters.d.toFixed(1)}
              </span>
            </Button>
          </div>
        </>
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
              <span>{editingParam}:</span>
              <Input
                type="number"
                value={getParamValue(editingParam).toFixed(1)}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  if (!isNaN(newValue)) {
                    handleSliderChange([newValue], editingParam);
                  }
                }}
                step={0.1}
                min={
                  paramRanges.attractor[
                    editingParam as keyof typeof paramRanges.attractor
                  ][0]
                }
                max={
                  paramRanges.attractor[
                    editingParam as keyof typeof paramRanges.attractor
                  ][1]
                }
                className="w-full h-8 text-right"
              />
            </div>
          </div>

          <Slider
            min={
              paramRanges.attractor[
                editingParam as keyof typeof paramRanges.attractor
              ][0]
            }
            max={
              paramRanges.attractor[
                editingParam as keyof typeof paramRanges.attractor
              ][1]
            }
            step={0.1}
            value={[getParamValue(editingParam)]}
            onValueChange={(values) => handleSliderChange(values, editingParam)}
            className="my-4"
          />
        </div>
      )}
    </div>
  );
};

export default AttractorTab;
