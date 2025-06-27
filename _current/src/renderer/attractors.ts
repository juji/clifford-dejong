

export function clifford(
  x: number, y: number,
  a: number, b: number,
  c: number, d: number
){

  return [
    Math.sin(a * y) + c * Math.cos(a * x),
    Math.sin(b * x) + d * Math.cos(b * y)
  ]

}

export function dejong(
  x: number, y: number,
  a: number, b: number,
  c: number, d: number
){

  return [
    Math.sin(a * y) - c * Math.cos(b * x),
    Math.sin(c * x) - d * Math.cos(d * y)
  ]

}