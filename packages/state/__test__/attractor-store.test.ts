import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useAttractorStore, defaultState } from "../attractor-store";
import * as zustandStorageModule from "../zustand-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Mock the zustandStorage
vi.mock("../zustand-storage", () => {
  const mockStorage: Record<string, string> = {};

  return {
    zustandStorage: {
      getItem: vi.fn((name: string) => {
        return mockStorage[name] ? JSON.parse(mockStorage[name]) : null;
      }),
      setItem: vi.fn((name: string, value: unknown) => {
        mockStorage[name] = JSON.stringify(value);
      }),
      removeItem: vi.fn((name: string) => {
        delete mockStorage[name];
      }),
    },
  };
});

// Helper function to create a fresh store for persistence testing
const createTestStore = () => {
  // This directly uses the same setup as the real store
  return create()(
    persist(
      (set) => ({
        ...defaultState,
        setAttractorParams: (params) =>
          set((state) => ({ ...state, attractorParameters: params })),
        reset: () => set({ ...defaultState }),
      }),
      {
        name: "attractor-store",
        storage: zustandStorageModule.zustandStorage,
      },
    ),
  );
};

describe("useAttractorStore", () => {
  // Reset mocks and clear storage before each test
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear our mock storage
    const mockZustandStorage = zustandStorageModule.zustandStorage;
    mockZustandStorage.removeItem("attractor-store");
  });

  afterEach(() => {
    // Reset the actual store state
    useAttractorStore.getState().reset();
  });

  describe("Initial State", () => {
    it("should initialize with default parameters", () => {
      const state = useAttractorStore.getState();
      expect(state.attractorParameters).toEqual(
        defaultState.attractorParameters,
      );
    });

    it("should have the correct default values", () => {
      const { attractorParameters } = useAttractorStore.getState();
      expect(attractorParameters.attractor).toBe("clifford");
      expect(attractorParameters.a).toBe(2);
      expect(attractorParameters.b).toBe(-2);
      expect(attractorParameters.c).toBe(1);
      expect(attractorParameters.d).toBe(-1);
      expect(attractorParameters.hue).toBe(333);
    });
  });

  describe("Actions", () => {
    it("should update parameters with setAttractorParams", () => {
      const store = useAttractorStore;
      const newParams = {
        ...defaultState.attractorParameters,
        attractor: "dejong" as const,
        a: 3.5,
        hue: 180,
      };

      store.getState().setAttractorParams(newParams);

      const updatedState = store.getState();
      expect(updatedState.attractorParameters.attractor).toBe("dejong");
      expect(updatedState.attractorParameters.a).toBe(3.5);
      expect(updatedState.attractorParameters.hue).toBe(180);
    });

    it("should update only the provided parameters", () => {
      const store = useAttractorStore;
      const initialState = store.getState();

      // Only update a single parameter
      store.getState().setAttractorParams({
        ...initialState.attractorParameters,
        hue: 220,
      });

      const updatedState = store.getState();
      expect(updatedState.attractorParameters.hue).toBe(220);
      expect(updatedState.attractorParameters.attractor).toBe(
        initialState.attractorParameters.attractor,
      );
      expect(updatedState.attractorParameters.a).toBe(
        initialState.attractorParameters.a,
      );
    });

    it("should reset state to default values", () => {
      const store = useAttractorStore;

      // First change the state
      store.getState().setAttractorParams({
        ...defaultState.attractorParameters,
        attractor: "dejong" as const,
        a: 5,
        hue: 100,
      });

      // Verify state changed
      let state = store.getState();
      expect(state.attractorParameters.attractor).toBe("dejong");

      // Then reset it
      store.getState().reset();

      // Verify reset worked
      state = store.getState();
      expect(state.attractorParameters).toEqual(
        defaultState.attractorParameters,
      );
    });
  });

  describe("Persistence", () => {
    it("should persist state to storage", () => {
      const store = useAttractorStore;
      const mockZustandStorage = zustandStorageModule.zustandStorage;

      // Update store
      store.getState().setAttractorParams({
        ...defaultState.attractorParameters,
        attractor: "dejong" as const,
      });

      // Check if setItem was called with the correct store name
      expect(mockZustandStorage.setItem).toHaveBeenCalledWith(
        "attractor-store",
        expect.anything(),
      );

      // Extract the saved state from the mock call
      const setItemCalls = vi.mocked(mockZustandStorage.setItem).mock.calls;
      const savedState = JSON.parse(
        JSON.stringify(setItemCalls[setItemCalls.length - 1][1]),
      );

      // Verify the state was correctly saved
      expect(savedState.state.attractorParameters.attractor).toBe("dejong");
    });

    it("should hydrate state from storage", () => {
      // First, set some data in storage
      const mockZustandStorage = zustandStorageModule.zustandStorage;
      mockZustandStorage.setItem("attractor-store", {
        state: {
          attractorParameters: {
            ...defaultState.attractorParameters,
            attractor: "dejong" as const,
            hue: 180,
          },
        },
        version: 0,
      });

      // Create a new store instance that should hydrate from storage
      const newStore = createTestStore();

      // Check if storage was read
      expect(mockZustandStorage.getItem).toHaveBeenCalledWith(
        "attractor-store",
      );

      // Verify the state was hydrated
      const state = newStore.getState() as typeof defaultState & {
        setAttractorParams: any;
        reset: any;
      };
      expect(state.attractorParameters.attractor).toBe("dejong");
      expect(state.attractorParameters.hue).toBe(180);
    });
  });
});
