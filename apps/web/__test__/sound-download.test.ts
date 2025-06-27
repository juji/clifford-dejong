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
test("sound download: downloads a file and measures elapsed time", async () => {

  const bob = "https://clifford-dejong.vercel.app/bob-small.mp3";
  const pop = "https://clifford-dejong.vercel.app/pop-small.mp3";

  const [ elapsedBob, elapsedPop ] = await Promise.all(
    [
      downloadSound(bob),
      downloadSound(pop)
    ]
  )
  
  expect(elapsedBob).toBeLessThan(500);
  expect(elapsedPop).toBeLessThan(500);

});
