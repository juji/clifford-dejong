import './full-screen.css'

export function fullScreenButton(){
  
  const fullScreenButton = document.querySelector('button.full-screen') as HTMLElement
  const footer = document.querySelector('footer') as HTMLElement
  if(!fullScreenButton) return;

  fullScreenButton.addEventListener('click',() => {
    fullScreenButton.classList.toggle('on')
    footer.classList.toggle('full-screen')

    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen();
    }else{
      document.exitFullscreen();
    }
  })

}