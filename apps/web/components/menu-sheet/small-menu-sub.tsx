import { type UITab, useUIStore } from "@/store/ui-store"
import { Button } from "../ui/button"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAttractorStore } from "@repo/state/attractor-store"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select"
import { Slider } from "../ui/slider"
import { Input } from "../ui/input"
import { useState, useRef } from "react"

export function SmallMenuSub({ tab, onTabClose }:{ tab: UITab, onTabClose: () => void }) {
  const attractorParameters = useAttractorStore((s) => s.attractorParameters)
  const setAttractorParams = useAttractorStore((s) => s.setAttractorParams)
  
  // Quality mode management
  const setQualityMode = useUIStore((s) => s.setQualityMode)
  const qualityMode = useUIStore((s) => s.qualityMode)
  const qualityModeTimeoutRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  
  // State to track which parameter is being edited
  const [editingParam, setEditingParam] = useState<string | null>(null)
  
  // Min and max values for different parameter types
  const paramRanges = {
    attractor: {
      a: [-3, 3],
      b: [-3, 3],
      c: [-3, 3],
      d: [-3, 3]
    },
    color: {
      hue: [0, 360],
      saturation: [0, 100],
      brightness: [0, 100]
    },
    position: {
      scale: [0.1, 3],
      left: [-2, 2],
      top: [-2, 2]
    }
  }

  // Get display name for the tab
  const getTabDisplayName = () => {
    switch(tab) {
      case "attractor": return "Attractor";
      case "color": return "Color";
      case "position": return "Position";
      default: return tab;
    }
  }
  
  // Handle parameter value changes with quality mode handling
  const handleSliderChange = (values: number[], param: string) => {
    const value = values[0];
    
    // Set quality mode to low during parameter changes
    if (qualityMode === 'high') setQualityMode("low");
    
    // Clear any existing timeout
    if (qualityModeTimeoutRef.current) {
      clearTimeout(qualityModeTimeoutRef.current);
    }
    
    // Set a timeout to switch back to high quality after 2 seconds
    qualityModeTimeoutRef.current = setTimeout(() => {
      setQualityMode("high");
    }, 2000);
    
    switch(tab) {
      case "attractor":
        setAttractorParams({
          ...attractorParameters,
          [param]: value
        });
        break;
      case "color":
        if (param === "hue" || param === "saturation" || param === "brightness") {
          setAttractorParams({
            ...attractorParameters,
            [param]: value
          });
        }
        break;
      case "position":
        if (param === "scale" || param === "left" || param === "top") {
          setAttractorParams({
            ...attractorParameters,
            [param]: value
          });
        }
        break;
    }
  }
  
  // Get current parameter value
  const getParamValue = (param: string): number => {
    if (tab === "attractor" && (param === "a" || param === "b" || param === "c" || param === "d")) {
      return attractorParameters[param];
    } else if (tab === "color" && (param === "hue" || param === "saturation" || param === "brightness")) {
      return attractorParameters[param];
    } else if (tab === "position" && (param === "scale" || param === "left" || param === "top")) {
      return attractorParameters[param];
    }
    return 0;
  }

  return (
    <div className={cn(
      "fixed bottom-[42px] left-1/2 -translate-x-1/2 z-[202] flex flex-col items-center gap-2 pb-3",
      editingParam === null ? "w-auto max-w-[400px]" : "w-[95%] sm:w-[80%] md:w-[70%] max-w-[800px]"
    )}>
      {/* Header with back button */}
      <div 
        className={cn(
          "flex justify-start items-center gap-2 w-full rounded-md p-2 bg-black/70 border border-white/10 shadow-md"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onTabClose}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center font-semibold px-2">
          {getTabDisplayName()}
        </div>
      </div>
      
      {/* Parameters as buttons - horizontal layout */}
      <div className={cn(
        "w-full rounded-md p-3 bg-black/50 shadow-md",
        editingParam === null ? "max-w-[400px]" : "max-w-[800px]"
      )}>
        {/* Type selector (attractor tab only) */}
        {tab === "attractor" && (
          <div className="mb-2 w-full">
            {editingParam === null ? (
              <>
                <Select 
                  value={attractorParameters.attractor} 
                  onValueChange={value => setAttractorParams({
                    ...attractorParameters,
                    attractor: value as "clifford" | "dejong"
                  })}
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
                    onClick={() => setEditingParam('a')}
                  >
                    <span>a:</span>
                    <span className="font-semibold">{attractorParameters.a.toFixed(1)}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="whitespace-nowrap flex gap-2 items-center justify-center py-2 px-4"
                    onClick={() => setEditingParam('b')}
                  >
                    <span>b:</span>
                    <span className="font-semibold">{attractorParameters.b.toFixed(1)}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="whitespace-nowrap flex gap-2 items-center justify-center py-2 px-4"
                    onClick={() => setEditingParam('c')}
                  >
                    <span>c:</span>
                    <span className="font-semibold">{attractorParameters.c.toFixed(1)}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="whitespace-nowrap flex gap-2 items-center justify-center py-2 px-4"
                    onClick={() => setEditingParam('d')}
                  >
                    <span>d:</span>
                    <span className="font-semibold">{attractorParameters.d.toFixed(1)}</span>
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
                      onChange={e => {
                        const newValue = parseFloat(e.target.value);
                        if (!isNaN(newValue)) {
                          handleSliderChange([newValue], editingParam);
                        }
                      }}
                      step={0.1}
                      min={paramRanges.attractor[editingParam as keyof typeof paramRanges.attractor][0]}
                      max={paramRanges.attractor[editingParam as keyof typeof paramRanges.attractor][1]}
                      className="w-full h-8 text-right"
                    />
                  </div>
                </div>
                
                <Slider 
                  min={paramRanges.attractor[editingParam as keyof typeof paramRanges.attractor][0]}
                  max={paramRanges.attractor[editingParam as keyof typeof paramRanges.attractor][1]}
                  step={0.1}
                  value={[getParamValue(editingParam)]}
                  onValueChange={(values) => handleSliderChange(values, editingParam)}
                  className="my-4"
                />
              </div>
            )}
          </div>
        )}
        
        {tab === "color" && (
          <div className="w-full min-w-[250px]">
            {editingParam === null ? (
              <div className="grid grid-cols-2 gap-2 pb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="whitespace-nowrap flex gap-2 items-center py-2 px-4"
                  onClick={() => setEditingParam('hue')}
                >
                  <span>Hue:</span>
                  <span className="font-semibold">{attractorParameters.hue}°</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="whitespace-nowrap flex gap-2 items-center py-2 px-4"
                  onClick={() => setEditingParam('saturation')}
                >
                  <span>Sat:</span>
                  <span className="font-semibold">{attractorParameters.saturation}%</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="whitespace-nowrap flex gap-2 items-center py-2 px-4"
                  onClick={() => setEditingParam('brightness')}
                >
                  <span>Bright:</span>
                  <span className="font-semibold">{attractorParameters.brightness}%</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="whitespace-nowrap flex gap-2 items-center py-2 px-4"
                  onClick={() => setEditingParam('background')}
                >
                  <span>BG:</span>
                  <div 
                    className="w-4 h-4 rounded-full border border-white/30" 
                    style={{
                      backgroundColor: `rgba(${attractorParameters.background[0]}, ${attractorParameters.background[1]}, ${attractorParameters.background[2]}, ${attractorParameters.background[3]/255})`
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
                    {editingParam === 'background' ? (
                      <>
                        <span>Background</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {editingParam === 'hue' ? 'Hue' : 
                          editingParam === 'saturation' ? 'Saturation' : 
                          editingParam === 'brightness' ? 'Brightness' : editingParam}:
                        </span>
                        <Input
                          type="number"
                          value={getParamValue(editingParam).toFixed(0)}
                          onChange={e => {
                            const newValue = parseFloat(e.target.value);
                            if (!isNaN(newValue)) {
                              handleSliderChange([newValue], editingParam);
                            }
                          }}
                          step={1}
                          min={paramRanges.color[editingParam as keyof typeof paramRanges.color][0]}
                          max={paramRanges.color[editingParam as keyof typeof paramRanges.color][1]}
                          className="w-full h-8 text-right"
                        />
                        <span className="flex-shrink-0">
                          {editingParam === 'hue' ? '°' : '%'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {editingParam === 'background' ? (
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Color:</span>
                      <input
                        type="color"
                        value={`#${attractorParameters.background.slice(0,3).map(x=>x.toString(16).padStart(2,"0")).join("")}`}
                        onChange={e => {
                          const hexValue = e.target.value.substring(1); // Remove the #
                          const r = parseInt(hexValue.substring(0, 2), 16);
                          const g = parseInt(hexValue.substring(2, 4), 16);
                          const b = parseInt(hexValue.substring(4, 6), 16);
                          
                          setAttractorParams({
                            ...attractorParameters,
                            background: [
                              r,
                              g,
                              b,
                              attractorParameters.background[3]
                            ]
                          });
                        }}
                        className="w-16 h-8"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Opacity:</span>
                      <Input
                        type="number"
                        value={(attractorParameters.background[3] / 255 * 100).toFixed(0)}
                        onChange={e => {
                          const opacityPercent = parseFloat(e.target.value);
                          if (!isNaN(opacityPercent)) {
                            const opacity = Math.round((opacityPercent / 100) * 255);
                            setAttractorParams({
                              ...attractorParameters,
                              background: [
                                attractorParameters.background[0],
                                attractorParameters.background[1],
                                attractorParameters.background[2],
                                opacity
                              ]
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
                    min={paramRanges.color[editingParam as keyof typeof paramRanges.color][0]}
                    max={paramRanges.color[editingParam as keyof typeof paramRanges.color][1]}
                    step={1}
                    value={[getParamValue(editingParam)]}
                    onValueChange={(values) => handleSliderChange(values, editingParam)}
                    className="my-4"
                  />
                )}
              </div>
            )}
          </div>
        )}
        
        {tab === "position" && (
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
        )}
      </div>
    </div>
  )
}