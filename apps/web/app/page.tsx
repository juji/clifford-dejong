import { AttractorCanvas } from "@/components/attractor-canvas";
import { Footer } from "@/components/footer";
import { ProgressIndicator } from "@/components/progress-indicator";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { FullScreenButton } from "@/components/full-screen-button";
import { MenuToggleButton } from "@/components/menu-toggle-button";
import { MenuSheet } from "@/components/menu-sheet";
import { DownloadButton } from "@/components/download-button";

export default function Home() {
  return (
    <>
      <ProgressIndicator />
      <MenuSheet />
      <DarkModeToggle />
      <FullScreenButton />
      <MenuToggleButton />
      <AttractorCanvas />
      <DownloadButton />
      <Footer />
    </>
  );
}
