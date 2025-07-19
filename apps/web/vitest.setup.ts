import "@testing-library/jest-dom";
import { vi } from "vitest";
import { toHaveNoViolations } from "jest-axe";

// Add jest-axe matchers to Vitest
expect.extend(toHaveNoViolations);

// Mock ResizeObserver for tests
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Add to global
global.ResizeObserver = ResizeObserverMock;
