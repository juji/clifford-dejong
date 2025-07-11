// Mock ResizeObserver for tests
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Add to global
global.ResizeObserver = ResizeObserverMock;
