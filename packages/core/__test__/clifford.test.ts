import { describe, it, expect } from 'vitest';
import { clifford } from "../index";

describe("clifford attractor", () => {
  it("should return a pair of numbers", () => {
    const result = clifford(0, 0, 1.7, 1.7, 0.6, 1.2);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(typeof result[0]).toBe("number");
    expect(typeof result[1]).toBe("number");
  });
  
  it("should produce expected output for known inputs", () => {
    // Test case 1: Classic Clifford parameters
    const result1 = clifford(0, 0, 1.7, 1.7, 0.6, 1.2);
    expect(result1).toEqual([0.6, 1.2]);
    
    // Test case 2: Another set of parameters
    const result2 = clifford(0.1, 0.2, -1.4, 1.6, 1.0, 0.7);
    expect(result2).toEqual([
      Math.sin(-1.4 * 0.2) + 1.0 * Math.cos(-1.4 * 0.1),
      Math.sin(1.6 * 0.1) + 0.7 * Math.cos(1.6 * 0.2),
    ]);
    
    // Test case 3: Calculate a sequence of iterations to verify stability
    let x = 0.1;
    let y = 0.1;
    const iterations = 10;
    const sequence: number[][] = [];
    
    for (let i = 0; i < iterations; i++) {
      [x, y] = clifford(x, y, 1.5, -1.8, 1.6, 0.9);
      sequence.push([x, y]);
    }
    
    // Verify the final point in the sequence
    expect(sequence[sequence.length - 1]).toMatchSnapshot('Clifford 10th iteration');
  });
});
