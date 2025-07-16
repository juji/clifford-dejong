import "./lil-gui.css";
import GUI from "lil-gui";

import { optionStore, type Options, VALUELIMIT } from "@/state";

export default function optionPanel() {
  const gui = new GUI();

  const { getState, subscribe } = optionStore;
  const { setOptions, options, setPaused } = getState();

  gui.add(options, "attractor", VALUELIMIT.attractor);

  gui.add(options, "a", VALUELIMIT.a[0], VALUELIMIT.a[1]);
  gui.add(options, "b", VALUELIMIT.b[0], VALUELIMIT.b[1]);
  gui.add(options, "c", VALUELIMIT.c[0], VALUELIMIT.c[1]);
  gui.add(options, "d", VALUELIMIT.d[0], VALUELIMIT.d[1]);

  gui.add(options, "hue", VALUELIMIT.hue[0], VALUELIMIT.hue[1]);
  gui.add(
    options,
    "saturation",
    VALUELIMIT.saturation[0],
    VALUELIMIT.saturation[1],
  );
  gui.add(
    options,
    "brightness",
    VALUELIMIT.brightness[0],
    VALUELIMIT.brightness[1],
  );
  // gui.addColor( options, 'background', 255);

  gui.add(options, "scale", VALUELIMIT.scale[0], VALUELIMIT.scale[1]);
  gui.add(options, "top", VALUELIMIT.top[0], VALUELIMIT.top[1]);
  gui.add(options, "left", VALUELIMIT.left[0], VALUELIMIT.left[1]);

  let updateFromOutside = false;
  gui.onChange((event) => {
    if (updateFromOutside) return;
    setPaused(true);
    setOptions(event.object as Partial<Options>);
  });

  gui.onFinishChange((event) => {
    if (updateFromOutside) return;
    setPaused(false);
    setOptions(event.object as Partial<Options>);
  });

  // gui.controllers

  subscribe(
    (state) => state.options,
    (opt) => {
      gui.controllers.forEach((controller) => {
        const key = controller._name as keyof typeof opt;
        if (opt[key] !== controller.getValue()) {
          updateFromOutside = true;
          controller.setValue(opt[key]);
        }
      });

      if (updateFromOutside)
        setTimeout(() => {
          updateFromOutside = false;
        }, 100);
    },
  );

  // add button to gui
  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset";
  resetButton.classList.add("button");
  resetButton.classList.add("reset-button");
  gui.$children.appendChild(resetButton);

  // Close GUI by default on small screens (phones)
  if (window.innerWidth <= 768) {
    gui.close();
  }
}
