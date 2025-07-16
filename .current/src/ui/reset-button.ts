import "./reset-button.css";
import { optionStore } from "@/state";

export function resetButton() {
  const { getState } = optionStore;
  const { resetOptions, setPaused } = getState();

  const reset = document.querySelector(".reset-button");
  if (!reset) return;

  reset.addEventListener("click", () => {
    resetOptions();
    setPaused(false);
  });
}
