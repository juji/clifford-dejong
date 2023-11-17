const colors = [
  {
    bg: '#000',
    fg: '#fff'
  },
  {
    bg: '#4834d4',
    fg: '#fff'
  },
  {
    bg: '#3742fa',
    fg: '#fff'
  },
  {
    bg: '#20bf6b',
    fg: '#fff'
  },
  {
    bg: '#218c74',
    fg: '#fff'
  },
  {
    bg: '#eb3b5a',
    fg: '#fff'
  },
  {
    bg: '#ff793f',
    fg: '#fff'
  },
  {
    bg: '#3c40c6',
    fg: '#fff'
  },
  {
    bg: '#f53b57',
    fg: '#fff'
  },
]

// prevent getting the same index in a row, by chance
let currentIndex: number|null = null
const getIndex: () => number = () => {
  let index = Math.round(Math.random() * (colors.length-1))
  return currentIndex === index ? getIndex() : index
}

export function setLogoColor(){

  let index = getIndex()
  currentIndex = index
  const color = colors.at(index)
  if(!color) return;
    
  const header = document.querySelector('header')
  if(!header) return;

  header.style.setProperty('--logo-bg', color.bg)
  header.style.setProperty('--logo-fg', color.fg)

}