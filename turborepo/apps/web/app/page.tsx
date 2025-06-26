import { AttractorCanvas } from "../components/attractor-canvas";

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <AttractorCanvas />
    </div>
  );
}
