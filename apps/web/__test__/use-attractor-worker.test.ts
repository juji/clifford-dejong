import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAttractorWorker } from '../hooks/use-attractor-worker';

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
});
