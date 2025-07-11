import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ColorWithOpacityPicker } from "../color-with-opacity-picker";
import { ThemeProvider } from "next-themes";

// Mock matchMedia for theme provider
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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
  Input: ({ type, value, onChange, className, style }: any) => (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={className}
      style={style}
      data-testid="color-input"
    />
  ),
}));

vi.mock("../ui/slider", () => ({
  Slider: ({ min, max, value, onValueChange, className }: any) => (
    <div
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value[0]}
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
    </ThemeProvider>
  );
};

describe("ColorWithOpacityPicker", () => {
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
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} className="custom-class" />);
    
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
    expect(screen.getByTestId("opacity-slider")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText(props.color)).toBeInTheDocument();
  });

  it("has selectable combined value display", () => {
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);
    
    const combinedDisplay = screen.getByText("#ff0000 / 75%");
    expect(combinedDisplay).toHaveClass("select-all");
  });

  it("renders correctly in dark mode", () => {
    renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />, { theme: "dark" });
    
    const label = screen.getByText("Test Color");
    expect(label).toHaveClass("text-foreground", "dark:text-foreground");
    
    const colorValue = screen.getByText("#ff0000");
    expect(colorValue).toHaveClass("text-muted-foreground");
  });
});