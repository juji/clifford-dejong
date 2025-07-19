"use client";

import { BigMenu } from "./big-menu";
import { SmallMenu } from "./small-menu";
import { useDynamicMenuLayout } from "@/hooks/use-dynamic-menu-layout";

export function MenuSheet() {
  const [menuType] = useDynamicMenuLayout();
  return (
    <div id="menu-sheet">
      {menuType === "small" ? <SmallMenu /> : <BigMenu />}
    </div>
  );
}
