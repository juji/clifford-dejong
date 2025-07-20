import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ColorWithOpacityPicker } from "../color-with-opacity-picker";
import { ThemeProvider } from "next-themes";
import { itHasNoA11yViolations } from "@/lib/test-utils/a11y-test-helpers";

// Mock matchMedia for theme provider
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock the shadcn/ui components
vi.mock("../ui/input", () => ({
  Input: ({
    type,
    value,
    onChange,
    className,
    style,
    id,
    "aria-label": ariaLabel,
    "aria-description": ariaDescription,
  }: any) => (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={className}
      style={style}
      id={id}
      aria-label={ariaLabel}
      aria-description={ariaDescription}
      data-testid="color-input"
    />
  ),
}));

vi.mock("../ui/slider", () => ({
  Slider: ({
    min,
    max,
    value,
    onValueChange,
    className,
    id,
    "aria-labelledby": ariaLabelledby,
    "aria-valuetext": ariaValuetext,
    "aria-describedby": ariaDescribedby,
  }: any) => (
    <div
      id={id}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value[0]}
      aria-labelledby={ariaLabelledby}
      aria-valuetext={ariaValuetext}
      aria-describedby={ariaDescribedby}
      className={className}
      data-testid="opacity-slider"
      onClick={() => onValueChange([50])} // Simulate click to 50%
    />
  ),
}));

const defaultProps = {
  label: "Test Color",
  color: "#ff0000",
  opacity: 0.75,
  onColorChange: vi.fn(),
  onOpacityChange: vi.fn(),
};

const renderWithTheme = (ui: React.ReactElement, { theme = "light" } = {}) => {
  return render(
    <ThemeProvider
      attribute="class"
      defaultTheme={theme}
      enableSystem={false}
      themes={["light", "dark"]}
    >
      {ui}
    </ThemeProvider>,
  );
};

describe("ColorWithOpacityPicker", () => {
  // Accessibility test - using renderWithTheme helper
  itHasNoA11yViolations(() => {
    return renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders basic component elements", () => {
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);

    expect(screen.getByText("Test Color")).toBeInTheDocument();
    expect(screen.getByTestId("color-input")).toHaveAttribute("type", "color");
    expect(screen.getByTestId("opacity-slider")).toBeInTheDocument();
    expect(screen.getByText("#ff0000")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("handles color input changes", () => {
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);

    const input = screen.getByTestId("color-input");
    fireEvent.change(input, { target: { value: "#00ff00" } });

    expect(defaultProps.onColorChange).toHaveBeenCalledWith("#00ff00");
  });

  it("handles opacity slider changes", () => {
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);

    const slider = screen.getByTestId("opacity-slider");
    fireEvent.click(slider); // Will trigger change to 50% based on our mock

    expect(defaultProps.onOpacityChange).toHaveBeenCalledWith(0.5);
  });

  it("applies custom className", () => {
    renderWithTheme(
      <ColorWithOpacityPicker {...defaultProps} className="custom-class" />,
    );

    const container = screen.getByText("Test Color").parentElement;
    expect(container).toHaveClass("custom-class");
  });

  it("handles edge cases", () => {
    const props = {
      ...defaultProps,
      opacity: 0,
      label: "",
      color: "rgba(255, 0, 0, 0.5)",
    };

    renderWithTheme(<ColorWithOpacityPicker {...props} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByTestId("opacity-slider")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.getByText(props.color)).toBeInTheDocument();
  });

  it("has selectable combined value display", () => {
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);

    const combinedDisplay = screen.getByText("#ff0000 / 75%");
    expect(combinedDisplay).toHaveClass("select-all");
  });

  it("renders correctly in dark mode", () => {
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />, {
      theme: "dark",
    });

    const label = screen.getByText("Test Color");
    expect(label).toHaveClass("text-foreground", "dark:text-foreground");

    const colorValue = screen.getByText("#ff0000");
    expect(colorValue).toHaveClass("text-muted-foreground");
  });

  it("has proper ARIA attributes for accessibility", () => {
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);

    // Check for proper ARIA role on the container
    const container = screen.getByRole("group");
    expect(container).toBeInTheDocument();

    // Check that the color input has appropriate ARIA labels
    const colorInput = screen.getByTestId("color-input");
    expect(colorInput).toHaveAttribute(
      "aria-label",
      "Color picker for Test Color, currently #ff0000",
    );
    expect(colorInput).toHaveAttribute("aria-description");

    // Check that the opacity slider has appropriate ARIA attributes
    const opacitySlider = screen.getByTestId("opacity-slider");
    expect(opacitySlider).toHaveAttribute("aria-valuetext", "75 percent");
    expect(opacitySlider).toHaveAttribute("aria-labelledby");
    expect(opacitySlider).toHaveAttribute("aria-describedby");
  });

  it("has proper keyboard accessibility", () => {
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);

    const colorInput = screen.getByTestId("color-input");

    // Color inputs are natively keyboard accessible with Enter/Space keys
    // No need for extra handlers as they trigger the onChange event natively
    expect(colorInput).toHaveAttribute("type", "color");
    expect(colorInput).toHaveAttribute("id");

    // Make sure it has an associated label for screen readers
    const label = screen.getByText(`Select Test Color color`);
    expect(label).toHaveClass("sr-only");
  });

  it("announces changes via aria-live regions", () => {
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);

    // Check that color value updates are announced via aria-live
    const colorValue = screen.getByText("#ff0000");
    expect(colorValue).toHaveAttribute("aria-live", "polite");
    expect(colorValue).toHaveAttribute("aria-atomic", "true");

    // Check that opacity value updates are announced via aria-live
    const opacityValue = screen.getByText("75%");
    expect(opacityValue).toHaveAttribute("aria-live", "polite");
  });
});
