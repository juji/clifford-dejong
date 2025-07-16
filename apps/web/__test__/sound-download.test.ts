import { expect, test } from "vitest";

async function downloadSound(url: string) {
  // This function simulates downloading a sound file.
  const start = Date.now();
  const response = await fetch(url);
  expect(response.ok).toBe(true);
  await response.arrayBuffer(); // Download the file
  // elapsed
  return Date.now() - start;
}

// This test downloads a sound file and measures elapsed time.
// just to let me know how long it takes to download the sound file
test("sound download: downloads a file and measures elapsed time", async () => {
  // 72
  const bobpop = "https://clifford-dejong.vercel.app/bop-pop.mp3";
  const elapsed = await downloadSound(bobpop);

  expect(elapsed).toBeLessThan(2000);
});
