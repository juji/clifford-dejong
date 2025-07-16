import { optionStore } from "@/state";

export function touchEvents() {
  const main = document.querySelector("main");
  if (!main) return;

  if (!window.matchMedia("(any-hover: none)").matches) return;

  const { getState } = optionStore;
  const { setScale, setTopLeft, setPaused, options } = getState();

  let { scale, top, left } = options;

  let initX = 0;
  let initY = 0;
  function onTouchStart(e: TouchEvent) {
    if (e.touches.length > 1) return;
    e.preventDefault();
    setPaused(true);
    initX = e.touches[0].pageX;
    initY = e.touches[0].pageY;
    main && main.addEventListener("touchmove", onTouchMove);
    return false;
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length > 1) return;
    e.preventDefault();
    setPaused(true);
    const topDelta = (initY - e.touches[0].pageY) / window.innerHeight;
    const leftDelta = (initX - e.touches[0].pageX) / window.innerWidth;
    setTopLeft(top - topDelta, left - leftDelta);
    return false;
  }

  // pinch
  function calcDistance(e: TouchEvent) {
    return Math.hypot(
      e.touches[0].pageX - e.touches[1].pageX,
      e.touches[0].pageY - e.touches[1].pageY,
    );
  }

  let distance = 0;
  function onPinchStart(e: TouchEvent) {
    if (e.touches.length < 2) return;
    e.preventDefault();
    setPaused(true);
    distance = calcDistance(e);
    main && main.addEventListener("touchmove", onPinchMove);
  }

  function onPinchMove(e: TouchEvent) {
    if (e.touches.length < 2) return;
    e.preventDefault();
    setPaused(true);
    const deltaDistance = calcDistance(e);
    let touchScale = deltaDistance / distance;
    setScale(Math.max(scale * touchScale, 0.01));
  }

  function onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    setPaused(false);
    const { options } = getState();
    top = options.top;
    left = options.left;
    scale = options.scale;
    main && main.removeEventListener("touchmove", onTouchMove);
    main && main.removeEventListener("touchmove", onPinchMove);
    return false;
  }

  main.addEventListener("touchstart", onTouchStart);
  main.addEventListener("touchstart", onPinchStart);
  main.addEventListener("touchend", onTouchEnd);
}
