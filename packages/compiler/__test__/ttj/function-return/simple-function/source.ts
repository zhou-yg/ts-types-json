function functionContainer () {
  function simpleFunction (p: string) {
    return parseInt(p)
  }

  return {
    simpleFunction
  }
}