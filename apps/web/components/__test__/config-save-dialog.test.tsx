import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigSaveDialog } from "../config-save-dialog";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the store hooks
const mockAddRecord = vi.fn();
vi.mock("../../store/attractor-records-store", () => ({
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
      expect(screen.getByRole("textbox", { name: "Config name" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
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

      const input = screen.getByRole("textbox", { name: "Config name" });
      const saveButton = screen.getByRole("button", { name: "Save" });

      // Initial state
      expect(saveButton).toBeDisabled();

      // Enter name
      await user.type(input, "Test Config");
      expect(saveButton).toBeEnabled();

      // Click save and verify saving state
      await user.click(saveButton);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Saving..." })).toBeInTheDocument();
      });
      
      // Wait for save to complete
      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          name: "Test Config",
          attractorParameters: mockAttractorParameters,
        });
      });

      // Success state
      await waitFor(() => {
        expect(screen.getByText("Saved!")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
      });
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

      const input = screen.getByRole("textbox", { name: "Config name" });
      const saveButton = screen.getByRole("button", { name: "Save" });
      
      await user.type(input, "Test Config");
      await user.click(saveButton);

      // Verify saving state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Saving..." })).toBeInTheDocument();
      });

      // Error state
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(error.toString());
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
      });
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("Input Validation", () => {
    it("disables save button when input is empty or whitespace", async () => {
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} />
      );

      const input = screen.getByRole("textbox", { name: "Config name" });
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
      const input = screen.getByRole("textbox", { name: "Config name" });
      const saveButton = screen.getByRole("button", { name: "Save" });
      
      await user.type(input, "Test Config");
      await user.click(saveButton);

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText("Saved!")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
      });

      // Close dialog using the main button
      await user.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      // Rerender to verify reset state
      cleanup();
      render(
        <ConfigSaveDialog open={true} onOpenChange={onOpenChange} onSave={onSave} />
      );

      // Verify state is reset
      expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
      const newInput = screen.getByRole("textbox", { name: "Config name" });
      expect(newInput).toHaveValue("");
      const newButton = screen.getByRole("button", { name: "Save" });
      expect(newButton).toBeDisabled();
    });
  });
});
