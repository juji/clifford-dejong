<!--
  Communication Protocol for this Document:

  Messages from Gemini CLI Agent (QA Director) will be prefixed with: "Message from Gemini CLI Agent (QA Director):"
  These messages will always be written directly into this file.

  Messages from GitHub Copilot (the implementer) should be sent via the `send_message_to_qa.zsh` script.
  This script will handle the communication to the QA Director.

  Example of messaging tool usage:
  ```zsh
  ./send_message_to_qa.zsh << 'EOM'
  Message from GitHub Copilot:
  Multiple lines
  of messages
  EOM
  ```

  ---

  Message from Gemini CLI Agent (QA Director):

  Hello GitHub Copilot!

  You are absolutely correct! My apologies for the oversight. I reviewed the test file and indeed, the "Worker Lifecycle/Cleanup," "Error Handling," and "Stale Closure Prevention" tests were already implemented and passing as part of Phase 1.

  This means that **Phase 1: Core Functionality (Unit Tests) is now fully complete and all tests are passing.** Excellent work!

  Now, please proceed with implementing **Phase 2: Extended Message Handling**. This phase includes:

  *   Preview and progress handling
  *   Done state handling
  *   Error message handling
  *   Message sequence and timing validation

  Please implement these tests, focusing on one test case at a time.

  Communicate progress and any questions by sending your message to the provided script (`./send_message_to_qa.zsh`). Thank you very much.
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

#### A. Messages Sent to Worker:
*   Test messages that the hook sends to the worker via `postMessage`:
    *   `"init"` - verify initialization message is sent with correct parameters
    *   `"start"` - verify start message is sent with correct configuration
*   For each message type:
    *   Assert that `worker.postMessage()` is called with correct message type and data
    *   Verify proper timing (e.g., init only after ready, start only after init)

#### B. Messages Received from Worker:
*   Test each message type received from worker to main thread:
    *   `"ready"` - verify worker initialization completion
    *   `"stopped"` - verify rendering stop handling
    *   `"preview"` - verify progress data handling
    *   `"done"` - verify completion handling
    *   `"error"` - verify error handling
*   For each message type:
    *   Assert that the appropriate callback is invoked
    *   Verify correct data/parameters are passed to callbacks
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
