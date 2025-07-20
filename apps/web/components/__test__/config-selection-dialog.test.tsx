import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ConfigSelectionDialog } from "../config-selection-dialog";
import { useAttractorRecordsStore } from "@/store/attractor-records-store";
import { useAttractorStore } from "@repo/state/attractor-store";
import { itHasNoA11yViolations } from "@/lib/test-utils/a11y-test-helpers";

// Mock IntersectionObserver which isn't available in the test environment
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor() {}
}

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
  // Accessibility test
  itHasNoA11yViolations(() => {
    return render(
      <ConfigSelectionDialog open={true} onOpenChange={() => {}} />,
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock IntersectionObserver
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver,
    });

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
    expect(
      screen.getByRole("heading", { name: "Attractor Gallery" }),
    ).toBeInTheDocument();
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
        image: "data:image/png;base64,testimagedlg1",
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
      },
      {
        uuid: "2",
        name: "Second Record",
        createdAt: Date.now(),
        image: "data:image/png;base64,testimagedlg2",
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
        },
      },
    ];

    vi.mocked(useAttractorRecordsStore).mockImplementation((selector) =>
      selector({
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
      }),
    );

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
      image: "data:image/png;base64,testimagedlgclick",
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

    vi.mocked(useAttractorRecordsStore).mockImplementation((selector) =>
      selector({
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
      }),
    );

    render(
      <ConfigSelectionDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    // Act
    const recordElement = screen.getByText("Clickable Record");
    await user.click(recordElement);

    // Assert
    expect(mockSetAttractorParams).toHaveBeenCalledWith(
      mockRecord.attractorParameters,
    );
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  // Test for aria-label including configuration name
  it("should have descriptive aria-labels on delete buttons", async () => {
    // Arrange
    const mockRecords = [
      {
        uuid: "123",
        name: "My Awesome Attractor",
        createdAt: Date.now(), // Using a number timestamp instead of string
        attractorParameters: {
          attractor: "clifford" as const,
          a: 1.7,
          b: 1.7,
          c: 0.6,
          d: 1.2,
          hue: 200,
          saturation: 80,
          brightness: 90,
          background: [0, 0, 0, 255] as [number, number, number, number],
          scale: 1,
          left: 0,
          top: 0,
        },
        image: "data:image/png;base64,abc123",
      },
    ];

    vi.mocked(useAttractorRecordsStore).mockImplementation((selector) =>
      selector({
        records: mockRecords,
        error: null,
        loading: false,
        refresh: mockRefresh,
        removeRecord: mockRemoveRecord,
        total: 1,
        loadMore: vi.fn(),
        page: 0,
        fetchRecords: vi.fn(),
        addRecord: vi.fn(),
      }),
    );

    render(<ConfigSelectionDialog open={true} onOpenChange={() => {}} />);

    // Assert
    const deleteButton = screen.getByRole("button", {
      name: /delete configuration 'My Awesome Attractor'/i,
    });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveAttribute(
      "aria-label",
      "Delete configuration 'My Awesome Attractor'",
    );
  });

  // Test for aria-disabled on Load More button
  it("should have aria-disabled attribute on Load More button when all records are loaded", () => {
    // Arrange
    const mockRecords = [
      {
        uuid: "123",
        name: "Test Attractor",
        createdAt: Date.now(),
        attractorParameters: {
          attractor: "clifford" as const,
          a: 1.7,
          b: 1.7,
          c: 0.6,
          d: 1.2,
          hue: 200,
          saturation: 80,
          brightness: 90,
          background: [0, 0, 0, 255] as [number, number, number, number],
          scale: 1,
          left: 0,
          top: 0,
        },
        image: "data:image/png;base64,abc123",
      },
    ];

    vi.mocked(useAttractorRecordsStore).mockImplementation((selector) =>
      selector({
        records: mockRecords,
        error: null,
        loading: false,
        refresh: mockRefresh,
        removeRecord: mockRemoveRecord,
        total: 1, // Total equals records length, so no more to load
        loadMore: vi.fn(),
        page: 0,
        fetchRecords: vi.fn(),
        addRecord: vi.fn(),
      }),
    );

    render(<ConfigSelectionDialog open={true} onOpenChange={() => {}} />);

    // Assert
    const loadMoreButton = screen.getByRole("button", { name: /load more/i });
    expect(loadMoreButton).toBeInTheDocument();
    expect(loadMoreButton).toBeDisabled();
    expect(loadMoreButton).toHaveAttribute("aria-disabled", "true");
  });

  // Test when more records are available
  it("should not have aria-disabled on Load More button when more records are available", () => {
    // Arrange
    const mockRecords = [
      {
        uuid: "123",
        name: "Test Attractor",
        createdAt: Date.now(),
        attractorParameters: {
          attractor: "clifford" as const,
          a: 1.7,
          b: 1.7,
          c: 0.6,
          d: 1.2,
          hue: 200,
          saturation: 80,
          brightness: 90,
          background: [0, 0, 0, 255] as [number, number, number, number],
          scale: 1,
          left: 0,
          top: 0,
        },
        image: "data:image/png;base64,abc123",
      },
    ];

    vi.mocked(useAttractorRecordsStore).mockImplementation((selector) =>
      selector({
        records: mockRecords,
        error: null,
        loading: false,
        refresh: mockRefresh,
        removeRecord: mockRemoveRecord,
        total: 2, // Total is more than records length, so more to load
        loadMore: vi.fn(),
        page: 0,
        fetchRecords: vi.fn(),
        addRecord: vi.fn(),
      }),
    );

    render(<ConfigSelectionDialog open={true} onOpenChange={() => {}} />);

    // Assert
    const loadMoreButton = screen.getByRole("button", { name: /load more/i });
    expect(loadMoreButton).toBeInTheDocument();
    expect(loadMoreButton).not.toBeDisabled();
    expect(loadMoreButton).toHaveAttribute("aria-disabled", "false");
  });
});
