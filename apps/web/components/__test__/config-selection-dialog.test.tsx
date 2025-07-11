import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ConfigSelectionDialog } from "../config-selection-dialog";
import { useAttractorRecordsStore } from "../../store/attractor-records-store";
import { useAttractorStore } from "@repo/state/attractor-store";

// Mock the stores
vi.mock("../../store/attractor-records-store", () => ({
  useAttractorRecordsStore: vi.fn(),
}));
vi.mock("@repo/state/attractor-store", () => ({
  useAttractorStore: vi.fn(),
}));

const mockSetAttractorParams = vi.fn();
const mockRefresh = vi.fn();
const mockRemoveRecord = vi.fn();

describe("ConfigSelectionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for the records store
    vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => {
      const state = {
        records: [],
        error: null,
        loading: false,
        refresh: mockRefresh,
        removeRecord: mockRemoveRecord,
        total: 0,
        loadMore: vi.fn(),
        page: 0,
        fetchRecords: vi.fn(),
        addRecord: vi.fn(),
      };
      return selector(state);
    });

    // Default mock implementation for the attractor store
    vi.mocked(useAttractorStore).mockImplementation((selector) => {
      const state = {
        setAttractorParams: mockSetAttractorParams,
        attractorParameters: {
          attractor: "clifford" as const,
          a: 2,
          b: -2,
          c: 1,
          d: -1,
          hue: 333,
          saturation: 100,
          brightness: 100,
          background: [0, 0, 0, 255] as [number, number, number, number],
          scale: 1,
          left: 0,
          top: 0,
        },
        reset: vi.fn(),
      };
      return selector(state);
    });
  });

  // Test 1: Basic rendering
  it("should show the dialog when the 'open' prop is true", () => {
    // Arrange
    render(<ConfigSelectionDialog open={true} onOpenChange={() => {}} />);

    // Assert
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Attractor Gallery" })).toBeInTheDocument();
  });

  // Test 2: Empty state
  it("should show an empty state message when there are no records", () => {
    // Arrange
    render(<ConfigSelectionDialog open={true} onOpenChange={() => {}} />);

    // Assert
    expect(screen.getByText("No saved configs found.")).toBeInTheDocument();
  });

  // Test 3: Displaying records
  it("should display a list of records when data is provided", () => {
    // Arrange
    const mockRecords = [
      { 
        uuid: "1", 
        name: "First Record", 
        createdAt: Date.now(),
        attractorParameters: {
          attractor: "clifford" as const,
          a: 2,
          b: -2,
          c: 1,
          d: -1,
          hue: 333,
          saturation: 100,
          brightness: 100,
          background: [0, 0, 0, 255] as [number, number, number, number],
          scale: 1,
          left: 0,
          top: 0,
        }
      },
      { 
        uuid: "2", 
        name: "Second Record", 
        createdAt: Date.now(),
        attractorParameters: {
          attractor: "dejong" as const,
          a: 1,
          b: 1,
          c: 2,
          d: 2,
          hue: 240,
          saturation: 80,
          brightness: 90,
          background: [0, 0, 0, 255] as [number, number, number, number],
          scale: 1,
          left: 0,
          top: 0,
        }
      },
    ];

    vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => selector({ 
      records: mockRecords, 
      error: null, 
      loading: false, 
      refresh: mockRefresh,
      removeRecord: mockRemoveRecord,
      total: mockRecords.length,
      loadMore: vi.fn(),
      page: 0,
      fetchRecords: vi.fn(),
      addRecord: vi.fn(),
    }));

    render(<ConfigSelectionDialog open={true} onOpenChange={() => {}} />);

    // Assert
    expect(screen.getByText("First Record")).toBeInTheDocument();
    expect(screen.getByText("Second Record")).toBeInTheDocument();
  });

  // Test 4: User interaction
  it("should call setAttractorParams and close the dialog when a record is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();
    const mockRecord = {
      uuid: "1",
      name: "Clickable Record",
      createdAt: Date.now(),
      attractorParameters: {
        attractor: "clifford" as const,
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        hue: 200,
        saturation: 70,
        brightness: 80,
        background: [10, 20, 30, 255] as [number, number, number, number],
        scale: 1.5,
        left: 0,
        top: 0,
      },
    };

    vi.mocked(useAttractorRecordsStore).mockImplementation((selector) => selector({ 
      records: [mockRecord], 
      error: null, 
      loading: false, 
      refresh: mockRefresh,
      removeRecord: mockRemoveRecord,
      total: 1,
      loadMore: vi.fn(),
      page: 0,
      fetchRecords: vi.fn(),
      addRecord: vi.fn(),
    }));

    render(<ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />);

    // Act
    const recordElement = screen.getByText("Clickable Record");
    await user.click(recordElement);

    // Assert
    expect(mockSetAttractorParams).toHaveBeenCalledWith(mockRecord.attractorParameters);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
