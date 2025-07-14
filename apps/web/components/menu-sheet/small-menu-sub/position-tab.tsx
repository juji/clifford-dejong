import { Button } from "../../ui/button"
import { Slider } from "../../ui/slider"
import { Input } from "../../ui/input"
import { ChevronLeft } from "lucide-react"
import { paramRanges } from "@repo/state/attractor-store"
import { TabProps } from "./utils"

const PositionTab = ({ 
  attractorParameters, 
  // setAttractorParams not used directly in this component, but required by TabProps
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAttractorParams,
  editingParam,
  setEditingParam,
  handleSliderChange
}: TabProps) => {
  // Get current parameter value
  const getParamValue = (param: string): number => {
    if (param === "scale" || param === "left" || param === "top") {
      return attractorParameters[param];
    }
    return 0;
  }

  return (
    <div className="w-full">
      {editingParam === null ? (
        <div className="flex overflow-x-auto gap-2 pb-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="whitespace-nowrap flex-shrink-0 flex gap-1 flex-col items-center py-8 px-4"
            onClick={() => setEditingParam('scale')}
          >
            <span>Scale</span>
            <span className="font-semibold">{attractorParameters.scale.toFixed(2)}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="whitespace-nowrap flex-shrink-0 flex gap-1 flex-col items-center py-8 px-4"
            onClick={() => setEditingParam('left')}
          >
            <span>Left</span>
            <span className="font-semibold">{attractorParameters.left.toFixed(2)}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="whitespace-nowrap flex-shrink-0 flex gap-1 flex-col items-center py-8 px-4"
            onClick={() => setEditingParam('top')}
          >
            <span>Top</span>
            <span className="font-semibold">{attractorParameters.top.toFixed(2)}</span>
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
              <span>
                {editingParam === 'scale' ? 'Scale' : 
                editingParam === 'left' ? 'Left' : 
                editingParam === 'top' ? 'Top' : editingParam}:
              </span>
              <Input
                type="number"
                value={getParamValue(editingParam).toFixed(2)}
                onChange={e => {
                  const newValue = parseFloat(e.target.value);
                  if (!isNaN(newValue)) {
                    handleSliderChange([newValue], editingParam);
                  }
                }}
                step={0.01}
                min={paramRanges.position[editingParam as keyof typeof paramRanges.position][0]}
                max={paramRanges.position[editingParam as keyof typeof paramRanges.position][1]}
                className="w-full h-8 text-right"
              />
            </div>
          </div>
          
          <Slider 
            min={paramRanges.position[editingParam as keyof typeof paramRanges.position][0]}
            max={paramRanges.position[editingParam as keyof typeof paramRanges.position][1]}
            step={0.01}
            value={[getParamValue(editingParam)]}
            onValueChange={(values) => handleSliderChange(values, editingParam)}
            className="my-4"
          />
        </div>
      )}
    </div>
  );
};

export default PositionTab;
