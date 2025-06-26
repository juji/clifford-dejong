import { AttractorCanvas } from "../components/AttractorCanvas";

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
