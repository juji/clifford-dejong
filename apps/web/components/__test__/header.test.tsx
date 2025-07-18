import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../header';

// Make useEffect a no-op in tests
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useEffect: () => {},
  };
});

// Mock the font utilities
vi.mock('@/lib/font-utils', () => ({
  getRandomFont: () => 'Nunito',
}));

// Simplify the test by completely mocking the dynamic font loading
describe('Header', () => {
  // Store the original createElement function
  const originalCreateElement = document.createElement;
  const originalAppendChild = document.head.appendChild;
  
  beforeEach(() => {
    // Mock document methods
    global.document.createElement = vi.fn().mockImplementation((tagName) => {
      if (tagName === 'link') {
        // For link elements, return a simple object that can be safely used in tests
        return { href: '', rel: '' } as unknown as HTMLLinkElement;
      }
      // For other elements, use the original implementation
      return originalCreateElement.call(document, tagName);
    });
    
    // Mock appendChild to be a no-op
    document.head.appendChild = vi.fn();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original document methods
    global.document.createElement = originalCreateElement;
    document.head.appendChild = originalAppendChild;
  });

  it('renders a heading with Chaos Canvas text', () => {
    render(<Header />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('Chaos Canvas');
  });

  it('contains a link to the homepage', () => {
    render(<Header />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
    expect(link.textContent).toBe('Chaos Canvas');
  });
});
