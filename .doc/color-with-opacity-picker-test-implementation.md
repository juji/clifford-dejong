# ColorWithOpacityPicker Test Implementation Guide

This document explains the implementation of tests for the `ColorWithOpacityPicker` component, following the test plan outlined in `color-with-opacity-picker-testing-plan.md`.

## Test Infrastructure

### Mock Components

1. **Input Component Mock**
```typescript
vi.mock("../components/ui/input", () => ({
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
```
This mock:
- Simplifies the shadcn/ui Input component
- Preserves all essential props and behavior
- Adds a data-testid for easy querying
- Maintains the same interface as the original component

2. **Slider Component Mock**
```typescript
vi.mock("../components/ui/slider", () => ({
  Slider: ({ min, max, step, value, onValueChange, className }: any) => (
    <div
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value[0]}
      className={className}
      data-testid="opacity-slider"
      onClick={() => onValueChange([50])}
    />
  ),
}));
```
This mock:
- Implements ARIA attributes for accessibility testing
- Simulates slider interaction with a click handler
- Uses a fixed value (50) for predictable testing

### Theme Support

1. **matchMedia Mock**
Required for next-themes to work in tests:
```typescript
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
```

2. **Theme Provider Wrapper**
```typescript
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
```
This utility:
- Wraps components with the theme provider
- Allows testing both light and dark modes
- Disables system theme for predictable tests

## Test Cases

### 1. Basic Rendering
```typescript
it("renders basic component elements", () => {
  renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);
  
  expect(screen.getByText("Test Color")).toBeInTheDocument();
  expect(screen.getByTestId("color-input")).toHaveAttribute("type", "color");
  expect(screen.getByTestId("opacity-slider")).toBeInTheDocument();
  expect(screen.getByText("#ff0000")).toBeInTheDocument();
  expect(screen.getByText("75%")).toBeInTheDocument();
});
```
Verifies:
- Label rendering
- Color input presence and type
- Opacity slider presence
- Initial color and opacity display

### 2. Color Input Interaction
```typescript
it("handles color input changes", () => {
  renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);
  
  const input = screen.getByTestId("color-input");
  fireEvent.change(input, { target: { value: "#00ff00" } });
  
  expect(defaultProps.onColorChange).toHaveBeenCalledWith("#00ff00");
});
```
Tests:
- Color input change events
- Callback invocation with new color

### 3. Opacity Slider Interaction
```typescript
it("handles opacity slider changes", () => {
  renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />);
  
  const slider = screen.getByTestId("opacity-slider");
  fireEvent.click(slider);
  
  expect(defaultProps.onOpacityChange).toHaveBeenCalledWith(0.5);
});
```
Tests:
- Slider interaction
- Value conversion (percentage to decimal)
- Callback invocation

### 4. Edge Cases
```typescript
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
```
Tests:
- Zero opacity handling
- Empty label
- Complex color formats (rgba)

### 5. Dark Mode Support
```typescript
it("renders correctly in dark mode", () => {
  renderWithTheme(<ColorWithOpacityPicker {...defaultProps} />, { theme: "dark" });
  
  const label = screen.getByText("Test Color");
  expect(label).toHaveClass("text-foreground", "dark:text-foreground");
  
  const colorValue = screen.getByText("#ff0000");
  expect(colorValue).toHaveClass("text-muted-foreground");
});
```
Tests:
- Dark mode class application
- Text color classes
- Theme-specific styling

## Test Utilities

### Default Props
```typescript
const defaultProps = {
  label: "Test Color",
  color: "#ff0000",
  opacity: 0.75,
  onColorChange: vi.fn(),
  onOpacityChange: vi.fn(),
};
```
Provides:
- Consistent test data
- Mock callbacks for interaction testing
- Typical usage values

### Cleanup
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```
Ensures:
- Fresh mock functions for each test
- No interference between tests

## Running the Tests

Execute the tests using:
```bash
cd apps/web && pnpm test color-with-opacity-picker.test.tsx
```

The tests validate:
- Component rendering
- User interactions
- Accessibility features
- Theme support
- Edge cases
- Event handling
