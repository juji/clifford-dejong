import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAttractorWorker } from '../use-attractor-worker';

// Mock the Worker constructor
const mockWorker = {
  onmessage: null as ((e: MessageEvent) => void) | null,
  onerror: null as ((e: ErrorEvent) => void) | null,
  postMessage: vi.fn(),
  terminate: vi.fn(),
};

// Mock the Worker class
class MockWorker {
  constructor() {
    Object.assign(this, mockWorker);
  }
}

// Mock the URL constructor
const mockURL = {
  toString: () => 'mocked-worker-url',
};
class MockURL {
  constructor() {
    return mockURL;
  }
}

vi.mock('../workers/attractor-worker.ts', () => {
  return {
    default: MockWorker,
  };
});

// Mock the global objects
const originalWorker = global.Worker;
const originalURL = global.URL;

describe('useAttractorWorker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset mock state
    vi.clearAllMocks();
    mockWorker.onmessage = null;
    mockWorker.onerror = null;
    // Install mocks
    global.Worker = vi.fn((url: string | URL, options?: WorkerOptions) => new MockWorker()) as any;
    global.URL = MockURL as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    // Restore original implementations
    global.Worker = originalWorker;
    global.URL = originalURL;
  });

  describe('Worker Initialization and Ready State', () => {
    it('should initialize worker and handle ready message correctly', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      }));

      // Assert that the worker was created with correct options
      expect(global.Worker).toHaveBeenCalledTimes(1);
      expect(global.Worker).toHaveBeenCalledWith(
        expect.objectContaining({ toString: expect.any(Function) }),
        { type: 'module' }
      );

      // Get the worker instance immediately after render
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();
      
      // Simulate the worker sending a ready message before any timers advance
      const readyMessage = new MessageEvent('message', {
        data: { type: 'ready' }
      });
      workerInstance.onmessage?.(readyMessage);

      // Assert that onReady was called with the message
      expect(onReady).toHaveBeenCalledTimes(1);
      expect(onReady).toHaveBeenCalledWith(readyMessage);

      // Since we got the ready message, the timeout should be cleared
      // Advance timers and verify no error is called
      vi.advanceTimersByTime(2000);
      expect(onLoadError).not.toHaveBeenCalled();

      // Verify that we got a worker ref back
      expect(result.current.current).toBeInstanceOf(MockWorker);
    });
  });

  describe('Basic Message Handling', () => {
    it('should send init message with correct parameters', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();
      
      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Get reference to the worker and call init
      const worker = result.current.current;
      expect(worker).toBeDefined();

      // Define test parameters
      const testParams = {
        params: {
          a: 1,
          b: 2,
          c: 3,
          d: 4
        },
        width: 800,
        height: 600,
        points: 1000000,
        progressInterval: 1,
        qualityMode: 'high',
        defaultScale: 1.0
      };

      // Send init message
      worker?.postMessage({ type: 'init', ...testParams });

      // Verify postMessage was called with correct parameters
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'init',
          ...testParams
        })
      );
    });

    it('should send start message to begin rendering', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();
      
      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Get reference to the worker and call start
      const worker = result.current.current;
      expect(worker).toBeDefined();

      // Send start message
      worker?.postMessage({ type: 'start' });

      // Verify postMessage was called with correct parameters
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'start' });
    });

    it('should handle stop message correctly', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onStop = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
        onStop,
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();
      
      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Simulate the worker sending a stop message
      const stopMessage = new MessageEvent('message', {
        data: { type: 'stopped' }
      });
      workerInstance.onmessage?.(stopMessage);

      // Verify that onStop was called with the message
      expect(onStop).toHaveBeenCalledTimes(1);
      expect(onStop).toHaveBeenCalledWith(stopMessage);
    });
  });

  describe('Worker Lifecycle and Cleanup', () => {
    it('should terminate worker and clear timeout on unmount', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();

      // Render the hook with required callbacks
      const { result, unmount } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // Store reference to terminate function to check if it's called
      const terminateSpy = vi.spyOn(workerInstance, 'terminate');
      
      // Unmount the component to trigger cleanup
      unmount();

      // Verify that terminate was called
      expect(terminateSpy).toHaveBeenCalledTimes(1);

      // Verify that no error is called after unmount (timeout was cleared)
      vi.advanceTimersByTime(2000);
      expect(onLoadError).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle worker script load error', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();

      // Render the hook
      renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // Simulate a worker script load error
      const errorEvent = new ErrorEvent('error', {
        message: 'Failed to load worker script',
        error: new Error('Failed to load worker script')
      });
      workerInstance.onerror?.(errorEvent);

      // Verify that onLoadError was called with the error message
      expect(onLoadError).toHaveBeenCalledWith(expect.stringContaining('Failed to load worker script'));

      // Verify onReady was not called
      expect(onReady).not.toHaveBeenCalled();

      // Verify that the loadTimeout was cleared (no timeout error)
      vi.advanceTimersByTime(2000);
      expect(onLoadError).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle worker initialization timeout', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();

      // Render the hook with required callbacks
      renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      }));

      // Advance timers beyond the timeout duration (2000ms) without sending ready message
      vi.advanceTimersByTime(2000);

      // Verify that onLoadError was called with timeout message
      expect(onLoadError).toHaveBeenCalledWith('Worker failed to initialize in a timely manner.');

      // Verify onReady was not called
      expect(onReady).not.toHaveBeenCalled();
    });
  });

  describe('Stale Closure Prevention', () => {
    it('should use latest callback values from optionsRef', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const initialOnPreview = vi.fn();
      const updatedOnPreview = vi.fn();

      type HookProps = {
        onPreview?: typeof initialOnPreview;
      };

      // Render the hook with initial callbacks
      const { rerender } = renderHook(({ onPreview = initialOnPreview }: HookProps = {}) => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview,
        onDone: vi.fn(),
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Verify initial preview callback works
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'preview', progress: 50 }
      }));
      expect(initialOnPreview).toHaveBeenCalledWith(50, expect.any(MessageEvent));
      expect(updatedOnPreview).not.toHaveBeenCalled();

      // Update the preview callback
      rerender({ onPreview: updatedOnPreview });

      // Send another preview message
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'preview', progress: 75 }
      }));

      // Verify the updated callback is used
      expect(updatedOnPreview).toHaveBeenCalledWith(75, expect.any(MessageEvent));
      expect(initialOnPreview).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Preview and Progress Handling', () => {
    it('should handle preview messages with progress updates', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onPreview = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview,
        onDone: vi.fn(),
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Simulate multiple preview messages with different progress values
      const progressValues = [0, 25, 50, 75, 100];
      progressValues.forEach(progress => {
        const previewMessage = new MessageEvent('message', {
          data: { type: 'preview', progress }
        });
        workerInstance.onmessage?.(previewMessage);

        // Verify onPreview was called with correct progress value and message
        expect(onPreview).toHaveBeenLastCalledWith(progress, expect.any(MessageEvent));
        const lastCall = onPreview.mock.lastCall;
        if (lastCall) {
          expect(lastCall[1].data).toEqual({ type: 'preview', progress });
        }
      });

      // Verify total number of preview callbacks
      expect(onPreview).toHaveBeenCalledTimes(progressValues.length);
    });

    it('should handle malformed preview messages gracefully', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onPreview = vi.fn();
      const onError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview,
        onDone: vi.fn(),
        onError,
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Send preview message without progress value
      const malformedMessage = new MessageEvent('message', {
        data: { type: 'preview' }
      });
      workerInstance.onmessage?.(malformedMessage);

      // Verify onPreview was called with undefined progress
      expect(onPreview).toHaveBeenLastCalledWith(undefined, expect.any(MessageEvent));

      // Send preview message with invalid progress value
      const invalidProgressMessage = new MessageEvent('message', {
        data: { type: 'preview', progress: 'not a number' }
      });
      workerInstance.onmessage?.(invalidProgressMessage);

      // Verify onPreview was still called with the invalid value
      expect(onPreview).toHaveBeenLastCalledWith('not a number', expect.any(MessageEvent));
    });
  });

  describe('Done State Handling', () => {
    it('should handle done message with final progress', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onPreview = vi.fn();
      const onDone = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview,
        onDone,
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Simulate a sequence of preview messages followed by done
      const progressValues = [25, 50, 75];
      progressValues.forEach(progress => {
        workerInstance.onmessage?.(new MessageEvent('message', {
          data: { type: 'preview', progress }
        }));
      });

      // Send done message with final progress
      const finalProgress = 100;
      const doneMessage = new MessageEvent('message', {
        data: { type: 'done', progress: finalProgress }
      });
      workerInstance.onmessage?.(doneMessage);

      // Verify onDone was called with correct progress value and message
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledWith(finalProgress, expect.any(MessageEvent));

      // Verify the message data
      const doneCall = onDone.mock.calls[0];
      expect(doneCall).toBeDefined();
      if (doneCall) {
        const [_, message] = doneCall;
        expect(message.data).toEqual({ type: 'done', progress: finalProgress });
      }

      // Verify all preview messages were handled before done
      expect(onPreview).toHaveBeenCalledTimes(progressValues.length);
      progressValues.forEach((progress, index) => {
        const previewCall = onPreview.mock.calls[index];
        expect(previewCall).toBeDefined();
        if (previewCall) {
          const [receivedProgress] = previewCall;
          expect(receivedProgress).toBe(progress);
        }
      });
    });

    it('should handle malformed done messages gracefully', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onDone = vi.fn();
      const onError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone,
        onError,
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Send done message without progress value
      const malformedMessage = new MessageEvent('message', {
        data: { type: 'done' }
      });
      workerInstance.onmessage?.(malformedMessage);

      // Verify onDone was called with undefined progress
      expect(onDone).toHaveBeenLastCalledWith(undefined, expect.any(MessageEvent));

      // Send done message with invalid progress value
      const invalidProgressMessage = new MessageEvent('message', {
        data: { type: 'done', progress: 'not a number' }
      });
      workerInstance.onmessage?.(invalidProgressMessage);

      // Verify onDone was still called with the invalid value
      expect(onDone).toHaveBeenLastCalledWith('not a number', expect.any(MessageEvent));
    });

    it('should handle basic done message with progress value', () => {
      const onDone = vi.fn();
      const onLoadError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady: vi.fn(),
        onLoadError,
        onPreview: vi.fn(),
        onDone,
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // Send done message with progress value
      const doneMessage = new MessageEvent('message', {
        data: { type: 'done', progress: 100 }
      });
      workerInstance.onmessage?.(doneMessage);

      // Verify onDone was called with correct parameters
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledWith(100, doneMessage);
    });

    it('should handle done message without prior start message', () => {
      const onDone = vi.fn();
      const onLoadError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady: vi.fn(),
        onLoadError,
        onPreview: vi.fn(),
        onDone,
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // Send done message without any prior messages
      const doneMessage = new MessageEvent('message', {
        data: { type: 'done', progress: 100 }
      });
      workerInstance.onmessage?.(doneMessage);

      // Verify onDone was called even without prior start
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledWith(100, doneMessage);
    });

    it('should handle multiple done messages', () => {
      const onDone = vi.fn();
      const onLoadError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady: vi.fn(),
        onLoadError,
        onPreview: vi.fn(),
        onDone,
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // Send multiple done messages with different progress values
      const doneMessages = [
        new MessageEvent('message', { data: { type: 'done', progress: 90 } }),
        new MessageEvent('message', { data: { type: 'done', progress: 95 } }),
        new MessageEvent('message', { data: { type: 'done', progress: 100 } })
      ];

      // Send messages in rapid succession
      doneMessages.forEach(msg => workerInstance.onmessage?.(msg));

      // Verify onDone was called for each message
      expect(onDone).toHaveBeenCalledTimes(3);
      expect(onDone).toHaveBeenNthCalledWith(1, 90, doneMessages[0]);
      expect(onDone).toHaveBeenNthCalledWith(2, 95, doneMessages[1]);
      expect(onDone).toHaveBeenNthCalledWith(3, 100, doneMessages[2]);
    });
  });

  describe('Error Message Handling', () => {
    it('should handle error messages from worker', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone: vi.fn(),
        onError,
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Simulate an error during computation
      const errorMessage = 'Failed to compute attractor point';
      const errorEvent = new MessageEvent('message', {
        data: { type: 'error', error: errorMessage }
      });
      workerInstance.onmessage?.(errorEvent);

      // Verify onError was called with the error message
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(errorMessage);

      // Verify onLoadError was not called (this is a runtime error, not a load error)
      expect(onLoadError).not.toHaveBeenCalled();
    });

    it('should handle multiple error messages in sequence', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone: vi.fn(),
        onError,
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Simulate multiple errors during computation
      const errorMessages = [
        'Failed to compute point A',
        'Failed to compute point B',
        'Failed to compute point C'
      ];

      errorMessages.forEach(errorMessage => {
        workerInstance.onmessage?.(new MessageEvent('message', {
          data: { type: 'error', error: errorMessage }
        }));
      });

      // Verify each error was handled
      expect(onError).toHaveBeenCalledTimes(errorMessages.length);
      errorMessages.forEach(errorMessage => {
        expect(onError).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should handle malformed error messages gracefully', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview: vi.fn(),
        onDone: vi.fn(),
        onError,
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // First send ready message to initialize properly
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Send error message without error text
      const malformedMessage = new MessageEvent('message', {
        data: { type: 'error' }
      });
      workerInstance.onmessage?.(malformedMessage);

      // Verify onError was called with undefined
      expect(onError).toHaveBeenLastCalledWith(undefined);

      // Send error message with non-string error
      const invalidErrorMessage = new MessageEvent('message', {
        data: { type: 'error', error: { message: 'nested error' } }
      });
      workerInstance.onmessage?.(invalidErrorMessage);

      // Verify onError was called with the invalid value
      expect(onError).toHaveBeenLastCalledWith({ message: 'nested error' });
    });
  });

  describe('Message Sequence and Timing Validation', () => {
    it('should process messages in the expected sequence', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onPreview = vi.fn();
      const onDone = vi.fn();
      const onError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview,
        onDone,
        onError,
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // Step 1: Ready message
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));
      expect(onReady).toHaveBeenCalledTimes(1);

      // Step 2: Send init message
      const testParams = {
        params: { a: 1, b: 2, c: 3, d: 4 },
        width: 800,
        height: 600,
        points: 1000000,
        progressInterval: 1,
        qualityMode: 'high',
        defaultScale: 1.0
      };
      workerInstance.postMessage({ type: 'init', ...testParams });
      expect(mockWorker.postMessage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: 'init',
          ...testParams
        })
      );

      // Step 3: Send start message
      workerInstance.postMessage({ type: 'start' });
      expect(mockWorker.postMessage).toHaveBeenLastCalledWith({ type: 'start' });

      // Step 4: Multiple preview messages
      const progressValues = [25, 50, 75];
      progressValues.forEach(progress => {
        workerInstance.onmessage?.(new MessageEvent('message', {
          data: { type: 'preview', progress }
        }));
      });
      expect(onPreview).toHaveBeenCalledTimes(progressValues.length);
      progressValues.forEach((progress, index) => {
        const call = onPreview.mock.calls[index];
        expect(call).toBeDefined();
        if (call) {
          expect(call[0]).toBe(progress);
        }
      });

      // Step 5: Done message
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'done', progress: 100 }
      }));
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledWith(100, expect.any(MessageEvent));

      // Verify no errors occurred during the sequence
      expect(onError).not.toHaveBeenCalled();
      expect(onLoadError).not.toHaveBeenCalled();
    });

    it('should continue processing messages after done', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onPreview = vi.fn();
      const onDone = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview,
        onDone,
        onError: vi.fn(),
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // Initialize worker
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));

      // Send done message
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'done', progress: 100 }
      }));
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledWith(100, expect.any(MessageEvent));

      // Send more messages after done (simulating a new rendering session)
      const previewProgress = 50;
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'preview', progress: previewProgress }
      }));
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'done', progress: 100 }
      }));

      // Verify callbacks were called correctly
      expect(onPreview).toHaveBeenCalledTimes(1);
      expect(onPreview).toHaveBeenCalledWith(previewProgress, expect.any(MessageEvent));
      expect(onDone).toHaveBeenCalledTimes(2);
    });

    it('should process all messages regardless of order', () => {
      const onReady = vi.fn();
      const onLoadError = vi.fn();
      const onPreview = vi.fn();
      const onDone = vi.fn();
      const onError = vi.fn();

      // Render the hook with required callbacks
      const { result } = renderHook(() => useAttractorWorker({
        onReady,
        onLoadError,
        onPreview,
        onDone,
        onError,
      }));

      // Get the worker instance
      const mockWorkerFn = global.Worker as ReturnType<typeof vi.fn>;
      const workerInstance = mockWorkerFn.mock.results[0]?.value;
      expect(workerInstance).toBeDefined();

      // Send preview message before ready
      const previewProgress = 50;
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'preview', progress: previewProgress }
      }));
      expect(onPreview).toHaveBeenCalledTimes(1);
      expect(onPreview).toHaveBeenCalledWith(previewProgress, expect.any(MessageEvent));

      // Send ready message after preview
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'ready' }
      }));
      expect(onReady).toHaveBeenCalledTimes(1);

      // Send another preview message
      const nextProgress = 75;
      workerInstance.onmessage?.(new MessageEvent('message', {
        data: { type: 'preview', progress: nextProgress }
      }));
      expect(onPreview).toHaveBeenCalledTimes(2);
      expect(onPreview).toHaveBeenCalledWith(nextProgress, expect.any(MessageEvent));
    });
  });
});
