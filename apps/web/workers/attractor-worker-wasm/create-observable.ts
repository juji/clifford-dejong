export type ObservableType<T> = {
  subscribe: (fn: (data: T) => void) => () => void;
  notify: (data: T | Partial<T>) => void;
  destroy: () => void;
};

export function createObservable<T>(initialData: T): ObservableType<T> {
  let observers: ((data: T) => void)[] = [];
  let state = initialData;

  function subscribe(fn: (data: T) => void) {
    observers.push(fn);
    return () => unsubscribe(fn);
  }

  function unsubscribe(fn: (data: T) => void) {
    const idx = observers.indexOf(fn);
    if (idx > -1) observers.splice(idx, 1);
  }

  function notify(data: T | Partial<T>) {
    state = { ...state, ...data };
    observers.forEach((fn) => fn(state));
  }

  function destroy() {
    observers = [];
  }

  return {
    subscribe,
    notify,
    destroy,
  };
}
