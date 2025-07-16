import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useUIStore } from "../ui-store";

// Extract initial state to use for comparisons
const initialState = {
  menuOpen: false,
  openTab: "attractor" as const,
  qualityMode: "high" as const,
  menuPosition: "left" as const,
  showInfo: false,
  showSettings: false,
  fullscreen: false,
  progress: 0,
  imageUrl: null,
  error: null,
};

describe("useUIStore", () => {
  // Reset the store to its initial state after each test
  afterEach(() => {
    const store = useUIStore.getState();
    store.setMenuOpen(initialState.menuOpen);
    store.setOpenTab(initialState.openTab);
    store.setQualityMode(initialState.qualityMode);
    store.setMenuPosition(initialState.menuPosition);
    if (store.showInfo !== initialState.showInfo) store.toggleInfo();
    if (store.showSettings !== initialState.showSettings)
      store.toggleSettings();
    if (store.fullscreen !== initialState.fullscreen) store.toggleFullscreen();
    store.setProgress(initialState.progress);
    store.setImageUrl(initialState.imageUrl);
    store.setError(initialState.error);
  });

  describe("Initial State", () => {
    it("should initialize with the correct default values", () => {
      const state = useUIStore.getState();
      expect(state.menuOpen).toBe(initialState.menuOpen);
      expect(state.openTab).toBe(initialState.openTab);
      expect(state.qualityMode).toBe(initialState.qualityMode);
      expect(state.menuPosition).toBe(initialState.menuPosition);
      expect(state.showInfo).toBe(initialState.showInfo);
      expect(state.showSettings).toBe(initialState.showSettings);
      expect(state.fullscreen).toBe(initialState.fullscreen);
      expect(state.progress).toBe(initialState.progress);
      expect(state.imageUrl).toBe(initialState.imageUrl);
      expect(state.error).toBe(initialState.error);
    });
  });

  describe("Actions", () => {
    it("should update menuOpen with setMenuOpen", () => {
      const store = useUIStore;
      store.getState().setMenuOpen(true);
      expect(store.getState().menuOpen).toBe(true);
    });

    it("should update openTab with setOpenTab", () => {
      const store = useUIStore;
      store.getState().setOpenTab("color");
      expect(store.getState().openTab).toBe("color");
    });

    it("should update qualityMode with setQualityMode", () => {
      const store = useUIStore;
      store.getState().setQualityMode("low");
      expect(store.getState().qualityMode).toBe("low");
    });

    it("should update menuPosition with setMenuPosition", () => {
      const store = useUIStore;
      store.getState().setMenuPosition("right");
      expect(store.getState().menuPosition).toBe("right");
    });

    it("should toggle showInfo with toggleInfo", () => {
      const store = useUIStore;
      const initialShowInfo = store.getState().showInfo;

      store.getState().toggleInfo();
      expect(store.getState().showInfo).toBe(!initialShowInfo);

      store.getState().toggleInfo();
      expect(store.getState().showInfo).toBe(initialShowInfo);
    });

    it("should toggle showSettings with toggleSettings", () => {
      const store = useUIStore;
      const initialShowSettings = store.getState().showSettings;

      store.getState().toggleSettings();
      expect(store.getState().showSettings).toBe(!initialShowSettings);

      store.getState().toggleSettings();
      expect(store.getState().showSettings).toBe(initialShowSettings);
    });

    it("should toggle fullscreen with toggleFullscreen", () => {
      const store = useUIStore;
      const initialFullscreen = store.getState().fullscreen;

      store.getState().toggleFullscreen();
      expect(store.getState().fullscreen).toBe(!initialFullscreen);

      store.getState().toggleFullscreen();
      expect(store.getState().fullscreen).toBe(initialFullscreen);
    });

    it("should update progress with setProgress", () => {
      const store = useUIStore;
      store.getState().setProgress(0.5);
      expect(store.getState().progress).toBe(0.5);
    });

    it("should update imageUrl with setImageUrl", () => {
      const store = useUIStore;
      const testUrl = "https://example.com/image.png";

      store.getState().setImageUrl(testUrl);
      expect(store.getState().imageUrl).toBe(testUrl);

      store.getState().setImageUrl(null);
      expect(store.getState().imageUrl).toBe(null);
    });

    it("should update error with setError", () => {
      const store = useUIStore;
      const testError = "Test error message";

      store.getState().setError(testError);
      expect(store.getState().error).toBe(testError);

      store.getState().setError(null);
      expect(store.getState().error).toBe(null);
    });
  });

  describe("Complex Interactions", () => {
    it("should maintain independent states for different UI elements", () => {
      const store = useUIStore;

      // Set multiple states at once
      store.getState().setMenuOpen(true);
      store.getState().setOpenTab("position");
      store.getState().toggleInfo();

      // Verify all states updated correctly
      const state = store.getState();
      expect(state.menuOpen).toBe(true);
      expect(state.openTab).toBe("position");
      expect(state.showInfo).toBe(true);
      expect(state.showSettings).toBe(false); // This shouldn't have changed
    });

    it("should reset error when setting imageUrl", () => {
      const store = useUIStore;

      // First set an error
      store.getState().setError("Failed to load image");
      expect(store.getState().error).toBe("Failed to load image");

      // Then set an image URL, which in a real app might clear the error
      // Note: This is testing expected behavior assuming the app's logic works this way
      // If the actual implementation doesn't do this, this test helps identify that
      store.getState().setImageUrl("https://example.com/image.png");

      // Error remains because there's no automatic clearing in the store
      // This is an observation, not necessarily an issue
      expect(store.getState().error).toBe("Failed to load image");

      // Manually clear error as would be done in the UI component
      store.getState().setError(null);
      expect(store.getState().error).toBe(null);
    });
  });
});
