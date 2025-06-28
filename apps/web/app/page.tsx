import { AttractorCanvas } from "../components/attractor-canvas";
import { Footer } from "../components/footer";
import { ProgressIndicator } from "../components/progress-indicator";
import { DarkModeToggle } from "../components/dark-mode-toggle";
import { FullScreenButton } from "../components/full-screen-button";

export default function Home() {
  return (
    <>
      <DarkModeToggle />
      <FullScreenButton />
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
