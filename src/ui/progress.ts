import './progress.css'

export function progressReport(){

  const progress = document.querySelector('.progress') as HTMLDivElement

  return {
    setProgress: (n: number) => {
      progress && progress.style.setProperty('--progress', n+'%')
    },
    setColor: (hsl: string) => {
      progress && progress.style.setProperty('--color', hsl)
    }
  }

}