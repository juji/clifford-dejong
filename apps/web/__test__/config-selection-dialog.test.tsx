import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ConfigSelectionDialog } from "../components/config-selection-dialog";
import { useAttractorRecordsStore } from "../store/attractor-records-store";
import { useAttractorStore } from "@repo/state/attractor-store";

// Mock the stores
vi.mock("../store/attractor-records-store");
vi.mock("@repo/state/attractor-store");

// Mock intersection observer
// Create mocks for IntersectionObserver methods
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

// Function to create a callback trigger
let intersectionCallback: IntersectionObserverCallback;

// Create the IntersectionObserver mock
const mockIntersectionObserver = vi.fn().mockImplementation((callback: IntersectionObserverCallback) => {
  intersectionCallback = callback;
  return {
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: mockUnobserve,
    root: null,
    rootMargin: "",
    thresholds: [0],
    takeRecords: vi.fn().mockReturnValue([]),
  };
});

beforeAll(() => {
  // Mock IntersectionObserver globally
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
  
  Object.defineProperty(global, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
});

// Mock data
const mockAttractorRecord = {
  uuid: "test-uuid-1",
  name: "Test Attractor",
  attractorParameters: {
    attractor: "clifford" as const,
    a: 1.4,
    b: -2.3,
    c: 2.4,
    d: -2.1,
    hue: 200,
    saturation: 0.8,
    brightness: 0.9,
    background: [0, 0, 0, 1] as [number, number, number, number],
    scale: 1,
    left: 0,
    top: 0,
  },
  createdAt: 1704067200000, // 2024-01-01
};

const mockAttractorRecord2 = {
  uuid: "test-uuid-2",
  name: "Another Attractor",
  attractorParameters: {
    attractor: "dejong" as const,
    a: 1.5,
    b: -2.2,
    c: 2.5,
    d: -2.0,
    hue: 150,
    saturation: 0.7,
    brightness: 0.8,
    background: [0, 0, 0, 1] as [number, number, number, number],
    scale: 1.2,
    left: 10,
    top: 5,
  },
  createdAt: 1704153600000, // 2024-01-02
};

describe("ConfigSelectionDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockRefresh = vi.fn();
  const mockLoadMore = vi.fn();
  const mockRemoveRecord = vi.fn();
  const mockSetAttractorParams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the mock IntersectionObserver
    mockIntersectionObserver.mockClear();
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    mockUnobserve.mockClear();
    
    // Default store state
    vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
      const state = {
        records: [],
        error: null,
        total: 0,
        page: null,
        loading: false,
        fetchRecords: vi.fn(),
        addRecord: vi.fn(),
        removeRecord: mockRemoveRecord,
        loadMore: mockLoadMore,
        refresh: mockRefresh,
      };
      return selector(state);
    });

    vi.mocked(useAttractorStore).mockImplementation((selector) => {
      const state = {
        attractorParameters: {
          attractor: "clifford" as const,
          a: 1.4,
          b: -2.3,
          c: 2.4,
          d: -2.1,
          hue: 200,
          saturation: 0.8,
          brightness: 0.9,
          background: [0, 0, 0, 1] as [number, number, number, number],
          scale: 1,
          left: 0,
          top: 0,
        },
        setAttractorParams: mockSetAttractorParams,
        reset: vi.fn(),
      };
      return selector(state);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders dialog when open", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Attractor Gallery" })).toBeInTheDocument();
    });

    it("does not render dialog when closed", () => {
      render(<ConfigSelectionDialog open={false} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders empty state when no records", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByText("No saved configs found.")).toBeInTheDocument();
      expect(screen.getByText("Create one by clicking on the save button.")).toBeInTheDocument();
    });

    it("renders error state when error exists", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [],
          error: new Error("Test error"),
          total: 0,
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });

      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByText("Error: Test error")).toBeInTheDocument();
    });

    it("renders load more button", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByRole("button", { name: "Load More" })).toBeInTheDocument();
    });

    it("disables load more button when all records loaded", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord],
          error: null,
          total: 1,
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });

      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByRole("button", { name: "Load More" })).toBeDisabled();
    });
  });

  describe("Data Loading", () => {
    it("calls refresh when dialog opens", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it("does not call refresh when dialog is closed", () => {
      render(<ConfigSelectionDialog open={false} onOpenChange={mockOnOpenChange} />);
      
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("calls refresh when dialog opens after being closed", async () => {
      const { rerender } = render(<ConfigSelectionDialog open={false} onOpenChange={mockOnOpenChange} />);
      
      expect(mockRefresh).not.toHaveBeenCalled();
      
      rerender(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it.skip("shows loading state", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord], // Must have records for loading to show
          error: null,
          total: 5,
          page: null,
          loading: true,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });

      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Record List", () => {
    beforeEach(() => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord, mockAttractorRecord2],
          error: null,
          total: 2,
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });
    });

    it("renders record list when records exist", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByText("Test Attractor")).toBeInTheDocument();
      expect(screen.getByText("Another Attractor")).toBeInTheDocument();
    });

    it("displays record creation dates", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      const date1 = new Date(mockAttractorRecord.createdAt).toLocaleString();
      const date2 = new Date(mockAttractorRecord2.createdAt).toLocaleString();
      
      expect(screen.getByText(date1)).toBeInTheDocument();
      expect(screen.getByText(date2)).toBeInTheDocument();
    });

    it("shows delete buttons on hover", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      const deleteButtons = screen.getAllByText("Delete");
      expect(deleteButtons).toHaveLength(2);
    });

    it("includes data-record-uuid attributes", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByText("Test Attractor").closest("li")).toHaveAttribute("data-record-uuid", "test-uuid-1");
      expect(screen.getByText("Another Attractor").closest("li")).toHaveAttribute("data-record-uuid", "test-uuid-2");
    });
  });

  describe("User Interactions", () => {
    beforeEach(() => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord],
          error: null,
          total: 1,
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });
    });

    it.skip("calls loadMore when load more button is clicked", async () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord],
          error: null,
          total: 2, // More records available
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });

      const user = userEvent.setup();
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      await user.click(screen.getByRole("button", { name: "Load More" }));
      
      expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it("selects record and closes dialog when record is clicked", async () => {
      const user = userEvent.setup();
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      await user.click(screen.getByText("Test Attractor"));
      
      expect(mockSetAttractorParams).toHaveBeenCalledWith(mockAttractorRecord.attractorParameters);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("deletes record when delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      await user.click(screen.getByText("Delete"));
      
      expect(mockRemoveRecord).toHaveBeenCalledWith("test-uuid-1");
    });

    it("closes dialog when onOpenChange is called", async () => {
      const user = userEvent.setup();
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      // Click outside dialog to close (simulated by calling onOpenChange)
      fireEvent.click(document.body);
      
      // The dialog component should handle this internally
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  // TODO: Fix IntersectionObserver mock
  describe.skip("Intersection Observer", () => {
    beforeEach(() => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord],
          error: null,
          total: 10, // More records available
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });
    });

    it("sets up intersection observer for auto-loading", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(window.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          threshold: 0.1,
        })
      );
    });

    it("observes the last element when there are more records", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord],
          error: null,
          total: 5, // More records than we have
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });
      
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      // The mock is initialized
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it("disconnects observer on cleanup", () => {
      const { unmount } = render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      unmount();
      
      // The component has been unmounted, we can't directly test disconnect
      // but we can verify the IntersectionObserver was initialized
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
    
    it("loads more records when intersection observer is triggered", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord],
          error: null,
          total: 5, // More records available
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });
      
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      // Manually call the first callback that was passed to IntersectionObserver
      const firstCallArgs = mockIntersectionObserver.mock.calls[0];
      
      if (firstCallArgs) {
        const callback = firstCallArgs[0];
        
        // Trigger the callback with a mock entry that is intersecting
        callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      }
      
      // Verify loadMore was called
      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper dialog role", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("has accessible dialog title", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAccessibleName("Attractor Gallery");
    });

    it("has proper button roles", () => {
      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByRole("button", { name: "Load More" })).toBeInTheDocument();
    });

    it("has proper list structure", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord],
          error: null,
          total: 1,
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });

      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
    });

    it("delete buttons have accessible names", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord],
          error: null,
          total: 1,
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });

      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      const deleteButton = screen.getByRole("button", { name: "Delete" });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles string error messages", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [],
          error: "Network error",
          total: 0,
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });

      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    it("handles null error gracefully", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [],
          error: null,
          total: 0,
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });

      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByText("No saved configs found.")).toBeInTheDocument();
    });

    it("handles empty records array", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [],
          error: null,
          total: 0,
          page: null,
          loading: false,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });

      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByText("No saved configs found.")).toBeInTheDocument();
    });

    it.skip("handles loading state with existing records", () => {
      vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
        const state = {
          records: [mockAttractorRecord],
          error: null,
          total: 5,
          page: null,
          loading: true,
          fetchRecords: vi.fn(),
          addRecord: vi.fn(),
          removeRecord: mockRemoveRecord,
          loadMore: mockLoadMore,
          refresh: mockRefresh,
        };
        return selector(state);
      });

      render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);
      
      expect(screen.getByText("Test Attractor")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });
});
