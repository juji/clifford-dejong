import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigSaveDialog } from "../components/config-save-dialog";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the store hooks
const mockAddRecord = vi.fn();
vi.mock("../store/attractor-records-store", () => ({
  useAttractorRecordsStore: (selector: any) =>
    selector({ addRecord: mockAddRecord }),
}));

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

describe("ConfigSaveDialog", () => {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders when open is true", () => {
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Save Config")).toBeInTheDocument();
      expect(screen.getByTestId("config-name-input")).toBeInTheDocument();
      expect(screen.getByTestId("save-button")).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      render(
        <ConfigSaveDialog open={false} onOpenChange={onOpenChange} onSave={onSave} />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Form Submission - Success Path", () => {
    it("handles successful form submission", async () => {
      mockAddRecord.mockResolvedValueOnce(undefined);

      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} />
      );

      const input = screen.getByTestId("config-name-input");
      const saveButton = screen.getByTestId("save-button");

      // Initial state
      expect(saveButton).toBeDisabled();

      // Enter name
      await user.type(input, "Test Config");
      expect(saveButton).toBeEnabled();

      // Click save and verify saving state
      await user.click(saveButton);
      await waitFor(() => {
        expect(screen.getByTestId("saving-button")).toBeInTheDocument();
      });
      
      // Wait for save to complete
      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          name: "Test Config",
          attractorParameters: mockAttractorParameters,
        });
      });

      // Verify addRecord was called with correct params
      expect(mockAddRecord).toHaveBeenCalledWith({
        name: "Test Config",
        attractorParameters: mockAttractorParameters,
      });

      // Success state
      await waitFor(() => {
        expect(screen.getByText("Saved!")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(onSave).toHaveBeenCalled();
      expect(input).toHaveValue("");
    });
  });

  describe("Form Submission - Error Path", () => {
    it("handles form submission error", async () => {
      const error = new Error("Failed to save");
      mockAddRecord.mockRejectedValueOnce(error);

      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} />
      );

      const input = screen.getByPlaceholderText("Config name");
      await user.type(input, "Test Config");

      const saveButton = screen.getByRole("button", { name: "Save" });
      await user.click(saveButton);

      // Error state
      await waitFor(() => {
        expect(screen.getByText(error.toString())).toBeInTheDocument();
      });
      expect(screen.getByTestId("save-button")).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("Input Validation", () => {
    it("disables save button when input is empty or whitespace", async () => {
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} />
      );

      const input = screen.getByPlaceholderText("Config name");
      const saveButton = screen.getByRole("button", { name: "Save" });

      // Empty input
      expect(saveButton).toBeDisabled();

      // Whitespace only
      await user.type(input, "   ");
      expect(saveButton).toBeDisabled();

      // Valid input
      await user.clear(input);
      await user.type(input, "Test Config");
      expect(saveButton).toBeEnabled();
    });
  });

  describe("Closing Behavior", () => {
    it("resets state when closed", async () => {
      mockAddRecord.mockResolvedValueOnce(undefined);

      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} />
      );

      // Submit form successfully
      const input = screen.getByPlaceholderText("Config name");
      await user.type(input, "Test Config");
      await user.click(screen.getByRole("button", { name: "Save" }));

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText("Saved!")).toBeInTheDocument();
      });

      // Close dialog
      const closeButton = screen.getByTestId("close-button");
      await user.click(closeButton); // Click the main button, not the X button
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      // Verify onOpenChange called
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // Rerender to verify reset state
      cleanup();
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} />
      );

      // Verify state is reset
      expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText("Config name")).toHaveValue("");
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });
  });
});
