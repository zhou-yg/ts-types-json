import {
  getFunctionScopeTypes,
  getTopTypes
}  from '../src/'

import { readdirSync,readFileSync } from 'fs'
import { join } from 'path'

const moduleProgramsDir = join(__dirname, './module-Programs')
const modulePrograms = readdirSync(moduleProgramsDir)

const functionProgramsDir = join(__dirname, './function-Programs')
const functionPrograms = readdirSync(moduleProgramsDir)

function readResult (dir: string, p: string) {
  const json = readFileSync(join(dir, `${p}/result.json`)).toString()
  return JSON.parse(json)
}

describe('ttj scope=module', () => {

  const only = ''; 

  modulePrograms.forEach((program) => {

    const executor = only === program ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getTopTypes(join(moduleProgramsDir, `${program}/source.ts`))

      const r = readResult(moduleProgramsDir, program)

      expect(r).toEqual(s)
    })
  })
})
describe('ttj scope=function', () => {

  const only = ''; 

  functionPrograms.forEach((program) => {

    const executor = only === program ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getFunctionScopeTypes(join(functionProgramsDir, `${program}/source.ts`), 'functionContainer')

      const r = readResult(functionProgramsDir, program)

      expect(r).toEqual(s)
    })
  })
})

