import { readdirSync } from 'node:fs'
import {
  join
} from 'node:path'

import {
  parseL2VFile
} from '../src/index'

const classDir = join(__dirname, 'examples/classe')
const classPrograms = readdirSync(classDir)

describe('class abtract', () => {
  const only = ''; 

  classPrograms.forEach(program => {
    const executor = only === program ? it.only : it

    executor(`${program} unit test`, () => {
      
    })
  })
})