import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

const LSKEY = 'juji-cd-data'

export type Options = {
  attractor: 'clifford'|'dejong',
  renderMethod: 'original' | 'direct2d' | 'modernWebGL'; // <-- Renamed from points2d
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
  attractor: ['clifford', 'dejong'],
  renderMethod: ['original', 'direct2d', 'modernWebGL'], // <-- Renamed from points2d
  a: [-5,5],
  b: [-5,5],
  c: [-5,5],
  d: [-5,5],
  background: [], // ??
  hue: [0, 360],
  saturation: [0, 100],
  brightness: [0, 100],
  scale: [0.001, 5],
  top: [-1, 1],
  left: [-1, 1],
}

const init: Options = {
  attractor: 'clifford',
  renderMethod: 'modernWebGL', // Default remains modernWebGL
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
  const urlParams = new URLSearchParams(window.location.search);
  const methodFromUrl = urlParams.get('renderMethod') as Options['renderMethod'] | null;

  let baseOptions = init; // Start with defaults

  // 1. Load from localStorage first (to get other settings)
  let ls = localStorage.getItem(LSKEY)
  if (ls) {
    try {
      const savedOpt = JSON.parse(ls) as Partial<Options>; // Load as partial
      console.log('Loaded state from localStorage:', savedOpt);
      baseOptions = { ...baseOptions, ...savedOpt }; // Merge defaults with saved
    } catch (e) {
      console.error('Failed to parse localStorage state:', e);
      localStorage.removeItem(LSKEY);
    }
  }

  // 2. Override renderMethod if present in URL
  if (methodFromUrl && VALUELIMIT.renderMethod.includes(methodFromUrl)) {
    console.log('Overriding renderMethod from URL parameter:', methodFromUrl);
    baseOptions.renderMethod = methodFromUrl;
  } else {
    console.log('No valid renderMethod in URL, using value from localStorage or default:', baseOptions.renderMethod);
  }

  console.log('Final initial options:', baseOptions);
  return baseOptions;
}

export const optionStore = createStore<UiStore>()(subscribeWithSelector(
  (set, get) => ({

    options: getInit(), // Use the updated getInit function

    setOptions:( options: Partial<Options> ) => set(state => {
      // IMPORTANT: Do not reload page here. Only save to localStorage.
      const nextOptions = {
        ...state.options,
        ...options
      };
      console.log('[State] setOptions saving to localStorage:', nextOptions);
      localStorage.setItem(LSKEY, JSON.stringify(nextOptions));
      return { options: nextOptions };
    }),

    // setScale, setTopLeft, etc. should just call setOptions
    setScale: (scale:number) => {
      const currentOptions = get().options;
      const newScale = Math.max(
        VALUELIMIT.scale[0],
        Math.min(scale, VALUELIMIT.scale[1])
      );
      if (currentOptions.scale !== newScale) {
        get().setOptions({ scale: newScale });
      }
    },

    setTopLeft: (top:number, left: number) => {
      const currentOptions = get().options;
      const newTop = Math.max(
        VALUELIMIT.top[0],
        Math.min(top, VALUELIMIT.top[1])
      );
      const newLeft = Math.max(
        VALUELIMIT.left[0],
        Math.min(left, VALUELIMIT.left[1])
      );
      if (currentOptions.top !== newTop || currentOptions.left !== newLeft) {
        get().setOptions({ top: newTop, left: newLeft });
      }
    },

    resetOptions: () => {
      localStorage.removeItem(LSKEY);
      // Reload the page without the query parameter
      window.location.href = window.location.pathname + window.location.search.replace(/[?&]renderMethod=[^&]+/, '').replace(/^&/, '?');
      // No need to call setOptions here as the page reloads with defaults
      console.log('resetOptions: Reloading page to defaults.');
    },

    // ... other methods (setImage, setProgress, setPaused) remain the same ...
    image: '',
    setImage: (image: string|null) => set(() => ({ image })),

    progress: 0,
    setProgress: (progress: number) => set(() => ({ progress })),

    paused: false,
    setPaused: (paused: boolean) => {
      return set(() => ({ paused }))
    },

  })

));