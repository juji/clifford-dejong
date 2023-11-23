import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

const LSKEY = 'juji-cd-data'

export type Options = {
  attractor: 'clifford'|'dejong',
  a: number
  b: number
  c: number
  d: number
  hue: number
  saturation: number
  brightness: number
  scale: number
  top: number
  left: number
}

const init: Options = {
  attractor: 'clifford',
  a: 2,
  b: -2,
  c: 1,
  d: -1,
  hue: 333,
  saturation: 100,
  brightness: 100,
  scale: 1,
  top: 0,
  left: 0,
}

export type UiStore = {
  
  options: Options
  setOptions: (options: Partial<Options>) => void

  image: string | null
  setImage: (img:string|null) => void

  progress: number
  setProgress: (num: number) => void

  paused: boolean
  setPaused: (paused: boolean) => void
  
}

function getInit(){
  let ls = localStorage.getItem(LSKEY) 
  const savedOpt = ls ? JSON.parse(ls) as Options : {}
  return savedOpt
}

export const optionStore = createStore<UiStore>()(subscribeWithSelector(
  (set) => ({

    options: {
      ...init,
      ...getInit(),
    },

    setOptions:( options: Partial<Options> ) => set(state => {
        
      const nextOptions = {
        ...state.options,
        ...options
      }

      localStorage.setItem(LSKEY, JSON.stringify(nextOptions))

      return { options: nextOptions }

    }),

    image: '',
    setImage: (image: string|null) => set(s => ({ image })),

    progress: 0,
    setProgress: (progress: number) => set(s => ({ progress })),

    paused: false,
    setPaused: (paused: boolean) => set(s => ({ paused })),

  })
  
))