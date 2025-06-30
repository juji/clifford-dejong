import * as React from "react";
import { Slider } from "./slider";
import { Input } from "./input";

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

  return (
    <div className={"w-full " + (className ?? "") }>
      <div className="mb-2 font-semibold text-base text-foreground dark:text-foreground">{label}</div>
      <div className="flex items-center gap-4 mb-2">
        <Input
          type="color"
          value={color}
          onChange={e => onColorChange(e.target.value)}
          className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer rounded-md shadow"
          style={{ background: "none" }}
        />
        <span className="text-xs text-muted-foreground">{color}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted-foreground w-16">Opacity</span>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[opacityPercent]}
          onValueChange={([v]) => onOpacityChange((v ?? 0) / 100)}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">{opacityPercent}%</span>
      </div>
      <div className="text-xs text-muted-foreground select-all">{color} / {opacityPercent}%</div>
    </div>
  );
}
