import { createObservable } from "./create-observable";
import type { ObservableAttractorData } from "./type";
import { lowQualityMode } from "./low-quality";
import { highQualityMode } from "./high-quality";

const paramsObservable = createObservable<ObservableAttractorData>({
  canvas: null,
  canvasSize: null,
  attractorParameters: null,
  qualityMode: null,
});

const state = {
  stopFunction: () => {},
};

const paramsUnsub = paramsObservable.subscribe(
  async (data: ObservableAttractorData) => {
    if (data.qualityMode === "low") {
      state.stopFunction = lowQualityMode(data, (percentComplete) => {
        self.postMessage({
          type: "progress",
          data: { progress: percentComplete },
        });
        // Update the image URL when done
        if (percentComplete === 100) {
          self.postMessage({ type: "done", data: { highQuality: false } });
        }
      });
    } else {
      state.stopFunction = highQualityMode(data, (percentComplete) => {
        self.postMessage({
          type: "progress",
          data: { progress: percentComplete },
        });
        if (percentComplete === 100) {
          self.postMessage({ type: "done", data: { highQuality: true } });
        }
      });
    }
  },
);

// Subscribe to parameter changes
self.onmessage = (event) => {
  const { type, data } = event.data;
  console.log("worker received", event.data);

  if (type === "init") {
    state.stopFunction();
    paramsObservable.notify(data);
  }

  if (type === "size") {
    state.stopFunction();
    paramsObservable.notify(data);
  }

  if (type === "update") {
    state.stopFunction();
    paramsObservable.notify(data);
  }

  if (type === "stop") {
    state.stopFunction();
    state.stopFunction = () => {};
  }

  if (type === "terminate") {
    state.stopFunction();
    paramsUnsub();
    self.close();
  }
};

// on initialization
self.postMessage({ type: "ready" });
