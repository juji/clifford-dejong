import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUIStore } from "@/store/ui-store";
import type { UITab } from "@/store/ui-store";

export function AttractorMenu() {
  const openTab = useUIStore((s) => s.openTab);
  const setOpenTab = useUIStore((s) => s.setOpenTab);

  return (
    <Tabs value={openTab} onValueChange={(value) => setOpenTab(value as UITab)}>
      <TabsList>
        <TabsTrigger value="attractor">Attractor</TabsTrigger>
        <TabsTrigger value="color">Color</TabsTrigger>
        <TabsTrigger value="position">Position</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
