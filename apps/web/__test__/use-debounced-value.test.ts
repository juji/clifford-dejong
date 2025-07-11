import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useDebouncedValue } from '../hooks/use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initially return the provided value', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should update the value after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Initial value
    expect(result.current).toBe('initial');

    // Change the value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be the initial one before the delay
    expect(result.current).toBe('initial');

    // Fast forward time by the delay amount
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should be updated after the delay
    expect(result.current).toBe('updated');
  });

  it('should only use the latest value when changed multiple times within the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Change the value multiple times within the delay period
    rerender({ value: 'change1', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200); // Not enough time to trigger update
    });

    rerender({ value: 'change2', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200); // Still not enough time for change2
    });

    rerender({ value: 'final', delay: 500 });
    
    // Value should still be the initial one
    expect(result.current).toBe('initial');

    // Fast forward to complete the delay for the final change
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Only the last value should be used
    expect(result.current).toBe('final');
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Change both value and delay
    rerender({ value: 'updated', delay: 200 });
    
    // Fast forward by the new delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Value should be updated with the shorter delay
    expect(result.current).toBe('updated');
  });

  it('should clear timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Change the value to set up a timeout
    rerender({ value: 'updated', delay: 500 });
    
    // Unmount to trigger cleanup
    unmount();
    
    // clearTimeout should have been called during cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
