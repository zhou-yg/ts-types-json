
declare function signal<T>(v: T): [
  () => T,
  (v: T) => void
]
