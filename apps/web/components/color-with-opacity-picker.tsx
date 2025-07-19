import * as React from "react";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { useId } from "react";

interface ColorWithOpacityPickerProps {
  label?: string;
  color: string;
  opacity: number; // 0-1
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
  className?: string;
}

export function ColorWithOpacityPicker({
  label = "Color",
  color,
  opacity,
  onColorChange,
  onOpacityChange,
  className,
}: ColorWithOpacityPickerProps) {
  // Convert opacity (0-1) to 0-100 for slider
  const opacityPercent = Math.round(opacity * 100);

  // Generate unique IDs for form elements
  const colorInputId = useId();
  const opacitySliderLabelId = useId();
  const opacityValueId = useId();

  return (
    <div
      className={"w-full " + (className ?? "")}
      role="group"
      aria-labelledby={`${colorInputId}-group-label`}
    >
      <div
        id={`${colorInputId}-group-label`}
        className="mb-2 font-semibold text-base text-foreground dark:text-foreground"
      >
        {label}
      </div>
      <div className="flex items-center gap-4 mb-2">
        <label
          htmlFor={colorInputId}
          className="sr-only"
        >{`Select ${label} color`}</label>
        <Input
          id={colorInputId}
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer rounded-md shadow"
          style={{ background: "none" }}
          aria-label={`Color picker for ${label}, currently ${color}`}
          aria-description="Use arrow keys to navigate color grid, space or enter to confirm selection"
        />
        <span
          className="text-xs text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {color}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <label
          id={opacitySliderLabelId}
          htmlFor={opacitySliderLabelId}
          className="text-xs text-muted-foreground w-16"
        >
          Opacity
        </label>
        <Slider
          id={opacitySliderLabelId}
          min={0}
          max={100}
          step={1}
          value={[opacityPercent]}
          onValueChange={([v]) => onOpacityChange((v ?? 0) / 100)}
          className="flex-1"
          aria-labelledby={opacitySliderLabelId}
          aria-valuetext={`${opacityPercent} percent`}
          aria-describedby={opacityValueId}
        />
        <span
          id={opacityValueId}
          className="text-xs text-muted-foreground w-8 text-right"
          aria-live="polite"
        >
          {opacityPercent}%
        </span>
      </div>
      <div
        className="text-xs text-muted-foreground select-all"
        aria-hidden="true"
      >
        {color} / {opacityPercent}%
      </div>
    </div>
  );
}
