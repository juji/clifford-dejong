// create something awesome!!

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

import "./index.css";
import "./button.css";

import { optionStore } from "@/state";

import Renderer from "./renderer";
import { ui } from "./ui";
const canvas = document.querySelector("canvas");

if (canvas) {
  const footer = document.querySelector("footer") as HTMLElement;
  const footerDim = footer.getBoundingClientRect();
  const { subscribe } = optionStore;
  const { options, setProgress, setImage } = optionStore.getState();

  ui();

  const renderer = new Renderer(
    canvas,
    window.innerWidth,
    window.innerHeight - footerDim.height,
    options,
    setProgress,
    setImage,
  );

  subscribe(
    (state) => state.options,
    (s) => {
      renderer.onUpdate(s);
    },
  );

  subscribe(
    (state) => state.paused,
    (paused) => {
      paused ? renderer.onPaused() : renderer.onPlay();
    },
  );

  // renderer.onProgress(onProgress)
  // renderer.onFinish(onImageReady)

  window.addEventListener("resize", () => {
    const footerDim = footer.getBoundingClientRect();
    renderer.onResize(window.innerWidth, window.innerHeight - footerDim.height);
  });
}
