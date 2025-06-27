import { AttractorCanvas } from "../components/attractor-canvas";
import { FooterTamagui } from "../components/footer-tamagui";
import { ProgressIndicator } from "../components/progress-indicator";

export default function Home() {
  return (
    <>
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
      <FooterTamagui />
    </>
  );
}
