# Cancellation Mechanism Plan

## Problem Analysis

The core issue is a race condition between the JavaScript `setTimeout` calling `cancel()` and the C++ background thread finishing its work. The console logs show the entire calculation completes before the cancellation is even attempted.

1.  **JS Timing:** The `setTimeout(cancel, 500)` in `calculate-attractor-native.ts` correctly schedules the cancellation.
2.  **C++ Execution Flow:** The current C++ implementation uses `jsInvoker_->invokeAsync` to schedule the *entire* calculation block. This block runs on the JS thread. Inside this block, we were trying to use `std::thread`, which was causing confusion. The fundamental problem is that the JS thread is occupied by the calculation loop, so the `setTimeout` callback for `cancel()` can't execute until the loop is finished.

## Proposed Solution

The correct approach is to perform the heavy lifting on a separate C++ thread and use the `jsInvoker_` only to communicate results back to the JavaScript thread. This prevents the JS thread from being blocked and allows the `cancel` function to be called promptly.

Here is the step-by-step implementation plan:

1.  **`apps/chaoscanvas/shared/NativeAttractorCalc.cpp`:**
    *   The main `calculateAttractor` function will still create the promise and the `cancel` function.
    *   Inside the promise's executor, we will spawn a `std::thread`. This thread will be responsible for the heavy calculation loop (`for (int i = 0; i < 10; i++)`).
    *   The `sleep_for` will happen on this **background thread**, which is crucial.
    *   Inside the loop on the background thread, we will check the `cancelled` flag at the beginning of each iteration.
    *   If `cancelled` is true, we will use `jsInvoker_->invokeAsync` to schedule a `rejectFunc` call on the JS thread and then exit the background thread.
    *   For progress updates, we will use `jsInvoker_->invokeAsync` to schedule calls to `onProgressCopy` and `onUpdateCopy` on the JS thread. This keeps the UI responsive.
    *   The `std::thread` will be detached to allow the `calculateAttractor` function to return immediately.

This plan ensures that the calculation is truly asynchronous, the UI thread remains unblocked, and the cancellation can be triggered and acted upon immediately.

