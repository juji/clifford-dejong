export function yuv2rgb(
  // Y:number, U:number, V:number
  y: number,
  u: number,
  v: number,
) {
  // let r = Y + 1.4075 * (V - 128)
  // let g = Y - 0.3455 * (U - 128) - (0.7169 * (V - 128))
  // let b = Y + 1.7790 * (U - 128)

  let r = y + (1.0 / 0.877) * v;
  let g = y - 0.39393 * u - 0.58081 * v;
  let b = y + (1.0 / 0.493) * u;

  return [r, g, b];
}
