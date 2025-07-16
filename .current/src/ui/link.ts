import { optionStore } from "@/state";
import { getHsl } from "./utils";

export function link() {
  const { subscribe } = optionStore;
  const html = document.querySelector("html") as HTMLElement;

  subscribe(
    (state) => state.options,
    (options) => {
      html && html.style.setProperty("--link-color", getHsl(options));
    },
    {
      fireImmediately: true,
    },
  );
}
