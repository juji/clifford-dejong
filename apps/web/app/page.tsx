import { AttractorCanvas } from "../components/attractor-canvas";
import { Footer } from "../components/footer";
import { ProgressIndicator } from "../components/progress-indicator";
import { DarkModeToggle } from "../components/dark-mode-toggle";
import { FullScreenButton } from "../components/full-screen-button";
import { MenuToggleButton } from "../components/menu-toggle-button";
import { MenuSheet } from "../components/menu-sheet";

export default function Home() {
  return (
    <>
      <MenuSheet />
      <DarkModeToggle />
      <FullScreenButton />
      <MenuToggleButton />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <AttractorCanvas />
        <ProgressIndicator />
      </div>
      <Footer />
    </>
  );
}
