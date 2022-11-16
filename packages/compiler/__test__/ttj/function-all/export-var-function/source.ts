export const functionContainer = () => {
  function simpleFunction (p: string) {
    return parseInt(p)
  }

  const internalVariable: number = 1

  return {
    simpleFunction
  }
}