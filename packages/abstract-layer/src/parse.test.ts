export default class {

  public name = '1'

  age: string | number = 1

  constructor () {
    this.changeName('2')
  }

  public changeName (n: string) {
    this.name = n
  }
}
