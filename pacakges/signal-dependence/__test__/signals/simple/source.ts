import { signal } from 'atomic-signal'

export default () => {
  const foo = signal('foo')

  const foo2 = signal(() => {
    return foo() + 'bar'
  })

  return {
    foo,
    foo2
  }
}