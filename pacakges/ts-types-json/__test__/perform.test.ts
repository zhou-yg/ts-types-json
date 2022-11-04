import {
  getClassScopeTypes,
  getExportDefaultScopeTypes,
  getFunctionScopeTypes,
  getTopTypes
}  from '../src'

import { readdirSync,readFileSync } from 'fs'
import { join } from 'path'

const moduleProgramsDir = join(__dirname, './module-Programs')
const modulePrograms = readdirSync(moduleProgramsDir)

const functionProgramsDir = join(__dirname, './function-Programs')
const functionPrograms = readdirSync(moduleProgramsDir)

const classProgramsDir = join(__dirname, './class')
const classPrograms = readdirSync(classProgramsDir)

const defaultProgramsDir = join(__dirname, './default')
const defaultPrograms = readdirSync(defaultProgramsDir)

const only: string[] = []; 

function readResult (dir: string, p: string) {
  const json = readFileSync(join(dir, `${p}/result.json`)).toString()
  return JSON.parse(json)
}

describe('ttj scope=module', () => {

  modulePrograms.forEach((program) => {

    const executor = only.includes(program) ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getTopTypes(join(moduleProgramsDir, `${program}/source.ts`))

      const r = readResult(moduleProgramsDir, program)

      expect(r).toEqual(s)
    })
  })
})
describe('ttj scope=function', () => {


  functionPrograms.forEach((program) => {

    const executor = only.includes(program) ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getFunctionScopeTypes(join(functionProgramsDir, `${program}/source.ts`), 'functionContainer')

      const r = readResult(functionProgramsDir, program)

      expect(r).toEqual(s)
    })
  })
})
describe('ttj scope=class', () => {

  classPrograms.forEach((program) => {

    const executor = only.includes(program) ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getClassScopeTypes(join(classProgramsDir, `${program}/source.ts`), 'ClassContainer')

      const r = readResult(classProgramsDir, program)

      expect(r).toEqual(s)
    })
  })
})

describe('ttj target is default', () => {

  defaultPrograms.forEach((program) => {

    const executor = only.includes(program) ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getExportDefaultScopeTypes(join(defaultProgramsDir, `${program}/source.ts`))

      const r = readResult(defaultProgramsDir, program)

      expect(r).toEqual(s)
    })
  })
})

