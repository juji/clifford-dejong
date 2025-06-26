import { clifford } from "../index";

describe("clifford attractor", () => {
  it("should return a pair of numbers", () => {
    const result = clifford(0, 0, 1.7, 1.7, 0.6, 1.2);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(typeof result[0]).toBe("number");
    expect(typeof result[1]).toBe("number");
  });
});
