import { optionStore } from "@/state";

export function mouseWheel() {
  if (window.matchMedia("(any-hover: none)").matches) return;

  const { getState, subscribe } = optionStore;
  const { setScale, setTopLeft, setPaused, options } = getState();

  let scale = options.scale;
  let top = options.top;
  let left = options.left;
  let idle = true;
  const deltaScale = 0.1;

  subscribe(
    (state) => state.options,
    (options) => {
      scale = options.scale;
      if (idle) {
        top = options.top;
        left = options.left;
      }
    },
  );

  let wheeTimeout: ReturnType<typeof setTimeout>;
  window.addEventListener("wheel", (e: WheelEvent) => {
    console.log("wheel start");
    setPaused(true);
    if (e.deltaY > 0) {
      setScale(Math.round((scale + deltaScale) * 1000) / 1000);
    } else {
      setScale(Math.round((scale - deltaScale) * 1000) / 1000);
    }

    if (wheeTimeout) clearTimeout(wheeTimeout);
    wheeTimeout = setTimeout(() => {
      setPaused(false);
    }, 100);
  });

  const main = document.querySelector("main");
  if (!main) return;

  let initMouseDown = { x: 0, y: 0 };
  let mouseDownListener = (e: MouseEvent) => {
    if (e.currentTarget !== main) return;
    e.preventDefault();
    idle = false;
    initMouseDown = { x: e.pageX, y: e.pageY };
    main.addEventListener("mousemove", mouseMoveListener);
    // setPaused(true)
    return false;
  };

  let mouseMoveListener = (e: MouseEvent) => {
    if (e.currentTarget !== main) return;
    e.preventDefault();
    const topDelta = (initMouseDown.y - e.pageY) / window.innerHeight;
    const leftDelta = (initMouseDown.x - e.pageX) / window.innerWidth;
    setTopLeft(top - topDelta, left - leftDelta);
    setPaused(true);
    return false;
  };

  let mouseUpListener = (e: MouseEvent) => {
    if (e.currentTarget !== main) return;
    e.preventDefault();
    main.removeEventListener("mousemove", mouseMoveListener);
    idle = true;
    const topDelta = (initMouseDown.y - e.pageY) / window.innerHeight;
    const leftDelta = (initMouseDown.x - e.pageX) / window.innerWidth;
    if (!topDelta && !leftDelta) return;

    setTopLeft(top - topDelta, left - leftDelta);
    setPaused(false);
    return false;
  };

  main.addEventListener("mousedown", mouseDownListener);
  main.addEventListener("mouseup", mouseUpListener);
}
