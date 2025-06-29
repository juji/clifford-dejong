import { AttractorCanvas } from "../components/attractor-canvas";
import AttractorWebGLCanvas from "../components/attractor-webgl-canvas";
import { Footer } from "../components/footer";
import { ProgressIndicator } from "../components/progress-indicator";
import { DarkModeToggle } from "../components/dark-mode-toggle";
import { FullScreenButton } from "../components/full-screen-button";
import { MenuToggleButton } from "../components/menu-toggle-button";
import { MenuSheet } from "../components/menu-sheet";

export default function Home() {
  return (
    <>
      <ProgressIndicator />
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
        {/* WebGL version for comparison */}
        <div style={{ marginTop: 32 }}>
          <AttractorWebGLCanvas width={512} height={512} />
        </div>
      </div>
      <Footer />
    </>
  );
}
