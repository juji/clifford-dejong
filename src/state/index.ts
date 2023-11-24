import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

const LSKEY = 'juji-cd-data'

export type Options = {
  attractor: 'clifford'|'dejong',
  a: number
  b: number
  c: number
  d: number
  background: number[]
  hue: number
  saturation: number
  brightness: number
  scale: number
  top: number
  left: number
}

export const VALUELIMIT = {
  scale: [0.001, 5],
  top: [-1, 1],
  left: [-1, 1],
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
  background: [0,0,0],
  scale: 1,
  top: 0,
  left: 0,
}

export type UiStore = {
  
  options: Options
  setOptions: (options: Partial<Options>) => void
  setScale: (scale:number) => void
  setTopLeft: (top:number, left: number) => void

  resetOptions: () => void

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

    setScale: (scale:number) => set(state => ({
      options: {
        ...state.options,
        scale: Math.max(
          VALUELIMIT.scale[0],
          Math.min(scale, VALUELIMIT.scale[1])
        )
      }
    })),

    setTopLeft: (top:number, left: number) => set(state => ({
      options: {
        ...state.options,
        top: Math.max(
          VALUELIMIT.top[0],
          Math.min(top, VALUELIMIT.top[1])
        ),
        left: Math.max(
          VALUELIMIT.left[0],
          Math.min(left, VALUELIMIT.left[1])
        )
      }
    })),

    resetOptions: () => set(() => {
      localStorage.setItem(LSKEY, JSON.stringify(init))
      console.log('resetOptions')
      return { options: init }
    }),

    image: '',
    setImage: (image: string|null) => set(() => ({ image })),

    progress: 0,
    setProgress: (progress: number) => set(() => ({ progress })),

    paused: false,
    setPaused: (paused: boolean) => {
      // console.trace();
      // console.log('set paused', paused)
      return set(() => ({ paused }))
    },

  })
  
))