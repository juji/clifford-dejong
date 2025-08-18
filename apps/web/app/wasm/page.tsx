import { AttractorWasmCanvas } from "@/components/attractor-wasm-canvas";

export default function Page() {
  return (
    <>
      <p className="fixed top-2 z-10 left-2">Lab: WASM</p>
      <AttractorWasmCanvas />
    </>
  );
}
