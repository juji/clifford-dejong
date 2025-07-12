import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigSaveDialog } from "../config-save-dialog";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock the store hooks
const mockAddRecord = vi.fn();
vi.mock("../../store/attractor-records-store", () => ({
  useAttractorRecordsStore: (selector: any) =>
    selector({ addRecord: mockAddRecord }),
}));

// Mock image URLs
const mockResizedImage = "data:image/png;base64,resized123";

const mockAttractorParameters = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
};

vi.mock("@repo/state/attractor-store", () => ({
  useAttractorStore: (selector: any) =>
    selector({ attractorParameters: mockAttractorParameters }),
}));

// Mock timers for auto-close functionality
vi.useFakeTimers();

describe("ConfigSaveDialog", () => {
  const onOpenChange = vi.fn();
  const onSave = vi.fn();
  // Default mock for waitForImageFn
  const mockWaitForImage = vi.fn().mockResolvedValue(mockResizedImage);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation to default
    mockWaitForImage.mockResolvedValue(mockResizedImage);
  });
  
  afterEach(() => {
    vi.clearAllTimers();
  });
  
  // Suppress expected console errors in tests
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe("Rendering", () => {
    it("renders when open is true", () => {
      const renderingWaitForImage = vi.fn().mockResolvedValue(mockResizedImage);
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} waitForImageFn={renderingWaitForImage} />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Save Config")).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Config name" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      const notRenderingWaitForImage = vi.fn().mockResolvedValue(mockResizedImage);
      render(
        <ConfigSaveDialog open={false} onOpenChange={onOpenChange} onSave={onSave} waitForImageFn={notRenderingWaitForImage} />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Form Submission - Success Path", () => {
    it("handles successful form submission", async () => {
      // Use real timers to ensure console logs and promises work properly
      vi.useRealTimers();
      
      const user = userEvent.setup();
      const successWaitForImage = vi.fn().mockResolvedValue(mockResizedImage);
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} waitForImageFn={successWaitForImage} />
      );
      
      // Fill in the name field
      const nameInput = screen.getByRole("textbox", { name: "Config name" });
      await user.type(nameInput, "My Test Config");
      
      // Click the save button
      const saveButton = screen.getByRole("button", { name: "Save" });
      await user.click(saveButton);
      // Verify that addRecord was called with the right parameters
      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          name: "My Test Config",
          attractorParameters: mockAttractorParameters,
          image: mockResizedImage,
        });
      });
      
      // Verify the button text changes to show the saving state
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Saved!");
      
      // Verify onSave callback was called
      expect(onSave).toHaveBeenCalled();
      
      // Verify dialog auto-closes after success
      // With real timers, we need to wait for the actual timeout to occur and wrap in act()
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      
      // Restore fake timers for other tests
      vi.useFakeTimers();
    });
  });

  describe("Form Submission - Error Path", () => {
    it("handles form submission error", async () => {
      // Need real timers for async operations
      vi.useRealTimers();
      
      const user = userEvent.setup();
      
      // Setup mock to throw an error
      const error = new Error("Failed to save config");
      mockAddRecord.mockRejectedValueOnce(error);
      
      const errorPathWaitForImage = vi.fn().mockResolvedValue(mockResizedImage);
      
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} waitForImageFn={errorPathWaitForImage} />
      );
      
      // Fill in the name field
      const nameInput = screen.getByRole("textbox", { name: "Config name" });
      await user.type(nameInput, "Error Config");
      
      // Click the save button
      const saveButton = screen.getByRole("button", { name: "Save" });
      await user.click(saveButton);
      
      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Error: Failed to save config");
      });
      
      // Verify the save button is still enabled
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
      
      // Verify onSave was not called
      expect(onSave).not.toHaveBeenCalled();
      
      // Restore fake timers for other tests
      vi.useFakeTimers();
    });
  });

  describe("Input Validation", () => {
    it("disables save button when input is empty or whitespace", async () => {
      
      vi.useRealTimers();
      
      const user = userEvent.setup();
      
      // Create a separate mock function for this test
      const inputValidationWaitForImage = vi.fn().mockResolvedValue(mockResizedImage);
      
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} waitForImageFn={inputValidationWaitForImage} />
      );
      const saveButton = screen.getByRole("button", { name: "Save" });
      const nameInput = screen.getByRole("textbox", { name: "Config name" });
      
      // Initial state - button should be disabled
      expect(saveButton).toBeDisabled();
      
      // Type spaces only - button should remain disabled
      await user.type(nameInput, "   ");
      expect(saveButton).toBeDisabled();
      
      // Type valid input - button should be enabled
      await user.clear(nameInput);
      await user.type(nameInput, "Valid Name");
      expect(saveButton).not.toBeDisabled();
      
      // Clear input - button should be disabled again
      await user.clear(nameInput);
      expect(saveButton).toBeDisabled();
    });
  });

  describe("Closing Behavior", () => {
    it("resets state when closed", async () => {
      // Use real timers to ensure console logs and promises work properly
      vi.useRealTimers();
      
      const user = userEvent.setup();
      
      const closingBehaviorWaitForImage = vi.fn().mockResolvedValue(mockResizedImage);
      const { rerender } = render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} waitForImageFn={closingBehaviorWaitForImage} />
      );
      
      // Fill in name field
      const nameInput = screen.getByRole("textbox", { name: "Config name" });
      await user.type(nameInput, "Test Config");
      
      // Submit form to create a success state
      const saveButton = screen.getByRole("button", { name: "Save" });
      await user.click(saveButton);
      
      // Wait for success state - need to wait for the async operation to complete
      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalled();
      });
      
      // Verify that the button text changes to show the saving state
      // and check for the success message like in the "handles successful form submission" test
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Saved!");
      });
      
      // Close and reopen dialog
      await act(async () => {
        rerender(
          <ConfigSaveDialog open={false} onOpenChange={onOpenChange} onSave={onSave} waitForImageFn={closingBehaviorWaitForImage} />
        );
      });
      await act(async () => {
        rerender(
          <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} waitForImageFn={closingBehaviorWaitForImage} />
        );
      });
      
      // Verify state is reset
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Config name" })).toHaveValue("");
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });
  });

  describe("Form Submission - Image Ready", () => {
    it("should wait for the image to be ready", async () => {
      // Need to use real timers for this test with async promises
      vi.useRealTimers();
      
      const user = userEvent.setup();
      
      // Setup a delayed image promise to test waiting state
      let resolveImage!: (value: string) => void;
      const imagePromise = new Promise<string>((resolve) => {
        resolveImage = resolve;
      });
      const delayedWaitForImage = vi.fn().mockReturnValue(imagePromise);
      
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} waitForImageFn={delayedWaitForImage} />
      );
      
      // Fill in name field
      const nameInput = screen.getByRole("textbox", { name: "Config name" });
      await user.type(nameInput, "Wait Test");
      
      // Click save button
      const saveButton = screen.getByRole("button", { name: "Save" });
      await user.click(saveButton);
      
      // Verify waiting state is shown
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Waiting Image..." })).toBeInTheDocument();
      });
      
      // Resolve the image promise
      await act(async () => {
        resolveImage!(mockResizedImage);
      });
      
      // Verify save process continues
      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          name: "Wait Test",
          attractorParameters: mockAttractorParameters,
          image: mockResizedImage,
        });
        expect(screen.getByRole("status")).toHaveTextContent("Saved!");
      });
      
      // Restore fake timers for other tests
      vi.useFakeTimers();
    }, 10000); // Reasonable timeout for waiting on image processing
  });

  describe("Form Submission - Image Error", () => {
    it("handles errors during image waiting", async () => {
      // Need real timers for async operations
      vi.useRealTimers();
      
      const user = userEvent.setup();
      
      // Setup mock to throw an error during image retrieval
      const imageError = new Error("Image retrieval failed");
      const errorWaitForImage = vi.fn().mockRejectedValue(imageError);
      
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} waitForImageFn={errorWaitForImage} />
      );
      
      // Fill in name field
      const nameInput = screen.getByRole("textbox", { name: "Config name" });
      await user.type(nameInput, "Image Error Test");
      
      // Click save button
      const saveButton = screen.getByRole("button", { name: "Save" });
      await user.click(saveButton);
      
      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Error: Image retrieval failed");
      });
      
      // Verify addRecord was not called
      expect(mockAddRecord).not.toHaveBeenCalled();
      
      // Verify onSave was not called
      expect(onSave).not.toHaveBeenCalled();
      
      // Verify save button is re-enabled
      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
      
      // Restore fake timers for other tests
      vi.useFakeTimers();
    });
  });
});
