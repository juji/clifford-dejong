import { describe, it, expect } from "vitest";
import { dejong } from "../index";

describe("dejong attractor", () => {
  it("should return a pair of numbers", () => {
    const result = dejong(0, 0, 1.4, -2.3, 2.1, 0.7);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(typeof result[0]).toBe("number");
    expect(typeof result[1]).toBe("number");
  });

  it("should produce expected output for known inputs", () => {
    // Test case 1: Basic de Jong parameters
    const result1 = dejong(0, 0, 1.4, -2.3, 2.1, 0.7);
    expect(result1).toEqual([
      Math.sin(1.4 * 0) - 2.1 * Math.cos(-2.3 * 0),
      Math.sin(2.1 * 0) - 0.7 * Math.cos(0.7 * 0),
    ]);

    // Test case 2: Another set of parameters
    const result2 = dejong(0.1, 0.2, -1.8, 1.9, 0.8, -1.2);
    expect(result2).toEqual([
      Math.sin(-1.8 * 0.2) - 0.8 * Math.cos(1.9 * 0.1),
      Math.sin(0.8 * 0.1) - -1.2 * Math.cos(-1.2 * 0.2),
    ]);

    // Test case 3: Calculate a sequence of iterations to verify stability
    let x = 0.1;
    let y = 0.1;
    const iterations = 10;
    const sequence: number[][] = [];

    for (let i = 0; i < iterations; i++) {
      [x, y] = dejong(x, y, -2.0, 1.6, -0.5, 1.8);
      sequence.push([x, y]);
    }

    // Verify the final point in the sequence
    expect(sequence[sequence.length - 1]).toMatchSnapshot(
      "de Jong 10th iteration",
    );
  });
});
