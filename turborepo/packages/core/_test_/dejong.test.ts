import { dejong } from "../index";

describe("dejong attractor", () => {
  it("should return a pair of numbers", () => {
    const result = dejong(0, 0, 1.4, -2.3, 2.1, 0.7);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(typeof result[0]).toBe("number");
    expect(typeof result[1]).toBe("number");
  });
});
