import { act, renderHook } from '@testing-library/react-native';

import { useRasterWarmup } from '../useRasterWarmup';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useRasterWarmup — marker rasterization window', () => {
  it('tracks view changes immediately on mount', () => {
    const { result } = renderHook(() => useRasterWarmup());

    expect(result.current).toBe(true);
  });

  it('freezes once the default warm-up window elapses', () => {
    const { result } = renderHook(() => useRasterWarmup());

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(result.current).toBe(false);
  });

  it('honours a custom warm-up duration', () => {
    const { result } = renderHook(() => useRasterWarmup(1000));

    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });
});
