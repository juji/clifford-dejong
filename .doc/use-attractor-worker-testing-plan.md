<!--
  Message from Gemini CLI Agent (QA Director).

  Excellent work, GitHub Copilot! The "Worker Initialization and Ready State" test case is well-implemented and passing.

  Please proceed with implementing the "Basic Message Handling" tests as outlined in Phase 1 of the plan.
  Communicate progress and any questions by updating this comment block.
-->

# Testing Plan for `useAttractorWorker` Hook

This document outlines the unit testing strategy for the `useAttractorWorker` hook, focusing on its Web Worker lifecycle management, message handling, and error handling within the Vitest environment.

## Implementation Phases

To ensure a practical and manageable implementation within our "one test at a time" workflow, we'll implement these tests in phases:

### Phase 1: Core Functionality (Unit Tests)
Priority: High
Focus: Essential hook behavior and core functionality
Tests to implement:
- Worker Initialization and Ready State
- Basic Message Handling (ready, init, start, stop)
- Worker Lifecycle/Cleanup
- Error Handling (load errors, timeouts)
- Stale Closure Prevention

### Phase 2: Extended Message Handling
Priority: Medium
Focus: Comprehensive message type coverage
Tests to implement:
- Additional message types (pause, resume, clear)
- Preview and progress handling
- Done state handling
- Error message handling
- Message sequence and timing validation

## File Locations:
- Unit Tests: `apps/web/__test__/use-attractor-worker.test.ts`

## Tools:
*   Vitest
*   React Testing Library (`renderHook` from `@testing-library/react-hooks` or similar for testing hooks)
*   `vi.mock` for `Worker` and `URL`

## Mocks:

*   **`Worker` Global Object:** We need to mock the global `Worker` constructor to control the behavior of the Web Worker. This mock will allow us to:
    *   Intercept `new Worker()` calls.
    *   Simulate `postMessage` calls from the main thread to the worker.
    *   Manually trigger `onmessage` and `onerror` events on the mocked worker instance to simulate messages from the worker back to the main thread.
    *   Verify `terminate()` calls.
*   **`URL` Global Object:** The `new URL(...)` call within the hook needs to be mocked to prevent actual file system access during tests.

## Test Cases:

### 1. Worker Initialization and Ready State:
*   Render the hook.
*   Assert that `new Worker()` is called with the correct URL and options (`{ type: "module" }`).
*   Simulate the worker sending a `"ready"` message.
*   Assert that the `onReady` callback is invoked.
*   Assert that the `loadTimeout` is cleared.

### 2. Worker Message Handling:
*   Test each message type from worker to main thread:
    *   `"init"` - verify initialization parameters are processed
    *   `"start"` - verify rendering begins
    *   `"stop"` - verify rendering stops
    *   `"pause"` - verify rendering pauses
    *   `"resume"` - verify rendering resumes
    *   `"clear"` - verify canvas clearing
    *   `"preview"` - verify progress data handling
    *   `"done"` - verify completion handling
    *   `"error"` - verify error handling
*   For each message type:
    *   Assert that the appropriate callback is invoked
    *   Verify correct data/parameters are passed
    *   Test error cases (malformed data, unexpected timing)

### 3. Worker Lifecycle and Cleanup:
*   Render the hook.
*   Unmount the component (or trigger cleanup).
*   Assert that `worker.terminate()` is called.
*   Assert that `loadTimeout` is cleared during cleanup.

### 4. Error Handling (`onLoadError`):
*   **Worker Script Load Error:**
    *   Mock `Worker` constructor to throw an error during instantiation.
    *   Assert that `onLoadError` is called with an appropriate error message.
    *   Assert that `loadTimeout` is cleared.
*   **Worker Initialization Timeout:**
    *   Render the hook.
    *   Advance timers beyond the `loadTimeout` duration (2000ms) without the worker sending a `"ready"` message.
    *   Assert that `onLoadError` is called with the timeout message.
    *   Assert that `loadTimeout` is cleared.

### 5. Stale Closure Prevention (`optionsRef`):
*   Render the hook with initial callbacks.
*   Update the callbacks (e.g., change `onPreview` to a new function).
*   Simulate the worker sending a message (e.g., `"preview"`).
*   Assert that the *latest* version of the callback (from `optionsRef.current`) is invoked, not the initial one.

## Implementation Details:
*   Use `renderHook` from `@testing-library/react-hooks` (or a similar utility if not using that specific library) to test the hook in isolation.
*   Manually control the mocked `Worker` instance's `onmessage` and `onerror` properties to simulate worker events.
*   Use `vi.useFakeTimers()` and `vi.runAllTimers()` to control the `setTimeout` and `clearTimeout` calls within the hook.
*   Use `vi.spyOn` to assert that callbacks are called.