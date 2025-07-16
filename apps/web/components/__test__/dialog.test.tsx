import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

describe("Dialog", () => {
  const user = userEvent.setup();

  // Basic Dialog setup for reuse
  function renderBasicDialog({
    showCloseButton = true,
    title = "Dialog Title", // Always provide a title for accessibility
    description = "Dialog description", // Always provide a description for accessibility
  }: {
    showCloseButton?: boolean;
    title?: string;
    description?: string;
  } = {}) {
    return render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent showCloseButton={showCloseButton} aria-modal="true">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div>Dialog content</div>
          <DialogFooter>
            <button>OK</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
  }

  describe("Basic Open/Close Functionality", () => {
    it("opens when trigger is clicked and closes with close button", async () => {
      renderBasicDialog();

      // Initially dialog should be closed
      expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();

      // Open dialog
      await user.click(screen.getByText("Open Dialog"));
      expect(screen.getByText("Dialog content")).toBeInTheDocument();

      // Close dialog
      await user.click(screen.getByRole("button", { name: "Close dialog" }));
      expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();
    });

    it("closes when Escape key is pressed", async () => {
      renderBasicDialog();

      // Open dialog
      await user.click(screen.getByText("Open Dialog"));
      expect(screen.getByText("Dialog content")).toBeInTheDocument();

      // Close with Escape
      await user.keyboard("{Escape}");
      expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();
    });
  });

  describe("DialogContent - showCloseButton prop", () => {
    it("shows close button by default", async () => {
      renderBasicDialog();
      await user.click(screen.getByText("Open Dialog"));
      expect(
        screen.getByRole("button", { name: "Close dialog" }),
      ).toBeInTheDocument();
    });

    it("hides close button when showCloseButton is false", async () => {
      renderBasicDialog({ showCloseButton: false });
      await user.click(screen.getByText("Open Dialog"));
      expect(
        screen.queryByRole("button", { name: "Close dialog" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Close Button Accessibility and Styling", () => {
    it("has correct accessibility attributes and styling", async () => {
      renderBasicDialog();
      await user.click(screen.getByText("Open Dialog"));

      const closeButton = screen.getByRole("button", { name: "Close dialog" });

      // Test accessibility text
      expect(closeButton).toHaveAttribute("data-slot", "dialog-close");
      expect(closeButton.querySelector(".sr-only")).toHaveTextContent(
        "Close dialog",
      );

      // Test styling classes
      expect(closeButton).toHaveClass(
        "absolute",
        "top-5",
        "right-5",
        "rounded-xs",
        "opacity-70",
        "transition-opacity",
        "hover:opacity-100",
        "focus:ring-2",
        "focus:ring-offset-2",
        "focus:outline-hidden",
        "disabled:pointer-events-none",
        "cursor-pointer",
      );
    });
  });

  describe("DialogOverlay styling", () => {
    it("has correct styling and animation classes", async () => {
      renderBasicDialog();
      await user.click(screen.getByText("Open Dialog"));

      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).toHaveClass(
        "fixed",
        "inset-0",
        "z-50",
        "bg-black/50",
        "data-[state=open]:animate-in",
        "data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0",
        "data-[state=open]:fade-in-0",
      );
      // Animation classes are applied dynamically based on state
      expect(overlay).toHaveAttribute("data-state", "open");
    });
  });

  describe("Focus Management", () => {
    it("traps focus within dialog", async () => {
      renderBasicDialog({ title: "Test Dialog" });
      await user.click(screen.getByText("Open Dialog"));

      // Get the focusable elements
      const closeButton = screen.getByRole("button", { name: /close dialog/i });
      const okButton = screen.getByRole("button", { name: /ok/i });

      // Tab through all elements to verify the focus trap
      await user.tab();
      await user.tab();

      // At this point, we should be on the OK button
      expect(document.activeElement).toBe(okButton);

      // Tab once more should cycle back to the close button
      await user.tab();
      expect(document.activeElement).toBe(closeButton);
    });

    it("returns focus to trigger when closed", async () => {
      renderBasicDialog();
      const trigger = screen.getByText("Open Dialog");
      await user.click(trigger);
      await user.keyboard("{Escape}");
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe("ARIA Attributes", () => {
    it("has correct ARIA attributes when open", async () => {
      renderBasicDialog({
        title: "Test Title",
        description: "Test Description",
      });
      await user.click(screen.getByText("Open Dialog"));

      const dialogContent = document.querySelector(
        '[data-slot="dialog-content"]',
      );
      expect(dialogContent).toHaveAttribute("aria-modal", "true");

      const title = screen.getByText("Test Title");
      const description = screen.getByText("Test Description");

      // RadixUI auto-generates IDs for these elements
      const titleId = title.getAttribute("id");
      const descriptionId = description.getAttribute("id");

      // Check that the generated IDs are being used in aria attributes
      expect(dialogContent).toHaveAttribute("aria-labelledby", titleId);
      expect(dialogContent).toHaveAttribute("aria-describedby", descriptionId);
    });
  });

  describe("Modal Behavior", () => {
    it("prevents interaction with background content", async () => {
      render(
        <div>
          <button>Background Button</button>
          <Dialog>
            <DialogTrigger>Open Dialog</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modal Dialog</DialogTitle>
                <DialogDescription>Modal dialog description</DialogDescription>
              </DialogHeader>
              <div>Dialog content</div>
            </DialogContent>
          </Dialog>
        </div>,
      );

      await user.click(screen.getByText("Open Dialog"));

      // Background button should not be focusable
      await user.tab();
      const backgroundButton = screen.getByText("Background Button");
      expect(document.activeElement).not.toBe(backgroundButton);

      // Background should have aria-hidden
      expect(backgroundButton.closest("[aria-hidden]")).toBeTruthy();
    });
  });

  describe("DialogContent styling", () => {
    it("has correct base styling and animation classes", async () => {
      renderBasicDialog();
      await user.click(screen.getByText("Open Dialog"));

      const dialogContent = document.querySelector(
        '[data-slot="dialog-content"]',
      );
      expect(dialogContent).toHaveClass(
        "bg-background",
        "fixed",
        "top-[50%]",
        "left-[50%]",
        "z-50",
        "grid",
        "w-full",
        "max-w-[calc(100%-2rem)]",
        "translate-x-[-50%]",
        "translate-y-[-50%]",
        "gap-4",
        "rounded-lg",
        "border",
        "p-6",
        "shadow-lg",
        "duration-200",
        "sm:max-w-lg",
        "data-[state=open]:animate-in",
        "data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0",
        "data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95",
        "data-[state=open]:zoom-in-95",
      );
    });
  });

  describe("Sub-component styling", () => {
    it("DialogHeader has correct styling", async () => {
      renderBasicDialog();
      await user.click(screen.getByText("Open Dialog"));

      const header = document.querySelector('[data-slot="dialog-header"]');
      expect(header).toHaveClass(
        "flex",
        "flex-col",
        "gap-2",
        "text-center",
        "sm:text-left",
      );
    });

    it("DialogFooter has correct styling", async () => {
      renderBasicDialog();
      await user.click(screen.getByText("Open Dialog"));

      const footer = document.querySelector('[data-slot="dialog-footer"]');
      expect(footer).toHaveClass(
        "flex",
        "flex-col-reverse",
        "gap-2",
        "sm:flex-row",
        "sm:justify-end",
      );
    });

    it("DialogTitle has correct styling", async () => {
      renderBasicDialog();
      await user.click(screen.getByText("Open Dialog"));

      const title = document.querySelector('[data-slot="dialog-title"]');
      expect(title).toHaveClass("text-lg", "leading-none", "font-semibold");
    });

    it("DialogDescription has correct styling", async () => {
      renderBasicDialog();
      await user.click(screen.getByText("Open Dialog"));

      const description = document.querySelector(
        '[data-slot="dialog-description"]',
      );
      expect(description).toHaveClass("text-sm", "text-muted-foreground");
    });
  });

  describe("className prop propagation", () => {
    it("merges custom classNames with default classes for all components", async () => {
      const customClasses = {
        content: "custom-content",
        overlay: "custom-overlay",
        header: "custom-header",
        footer: "custom-footer",
        title: "custom-title",
        description: "custom-description",
      };

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent className={customClasses.content}>
            <DialogHeader className={customClasses.header}>
              <DialogTitle className={customClasses.title}>
                Test Title
              </DialogTitle>
              <DialogDescription className={customClasses.description}>
                Test Description
              </DialogDescription>
            </DialogHeader>
            <div>Dialog content</div>
            <DialogFooter className={customClasses.footer}>
              <button>OK</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );

      await user.click(screen.getByText("Open Dialog"));

      // Verify custom classes are merged with defaults
      expect(
        document.querySelector('[data-slot="dialog-content"]'),
      ).toHaveClass(customClasses.content);
      expect(document.querySelector('[data-slot="dialog-header"]')).toHaveClass(
        customClasses.header,
      );
      expect(document.querySelector('[data-slot="dialog-footer"]')).toHaveClass(
        customClasses.footer,
      );
      expect(document.querySelector('[data-slot="dialog-title"]')).toHaveClass(
        customClasses.title,
      );
      expect(
        document.querySelector('[data-slot="dialog-description"]'),
      ).toHaveClass(customClasses.description);
    });
  });
});
