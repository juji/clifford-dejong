import "./progress.css";
import { optionStore } from "@/state";
import { getHsl } from "./utils";

export function progressReport() {
  const { subscribe } = optionStore;
  const progress = document.querySelector(".progress") as HTMLDivElement;

  subscribe(
    (state) => state.options,
    (options) => {
      progress && progress.style.setProperty("--color", getHsl(options));
    },
    {
      fireImmediately: true,
    },
  );

  subscribe(
    (state) => state.progress,
    (n) => {
      progress && progress.style.setProperty("--progress", n + "%");
    },
  );
}
