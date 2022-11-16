import {
  getClassScopeTypes,
  getExportDefaultScopeTypes,
  getFunctionScopeTypes,
  getTopTypes
}  from '../src'

import { readdirSync,readFileSync } from 'fs'
import { join } from 'path'

const moduleProgramsDir = join(__dirname, './ttj/module-top')
const modulePrograms = readdirSync(moduleProgramsDir)

const functionProgramsDir = join(__dirname, './ttj/function-return')
const functionPrograms = readdirSync(functionProgramsDir)

const functionAllDir = join(__dirname, './ttj/function-all')
const functionAllPrograms = readdirSync(functionAllDir)

const classProgramsDir = join(__dirname, './ttj/class-public')
const classPrograms = readdirSync(classProgramsDir)

const defaultProgramsDir = join(__dirname, './ttj/default')
const defaultPrograms = readdirSync(defaultProgramsDir)

const only: string[] = [
  // 'export-var-function'
]; 

function readResult (dir: string, p: string) {
  const json = readFileSync(join(dir, `${p}/result.json`)).toString()
  return JSON.parse(json)
}

describe('ttj scope=module onlyPublic', () => {

  modulePrograms.forEach((program) => {

    const executor = only.includes(program) ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getTopTypes(join(moduleProgramsDir, `${program}/source.ts`))

      const r = readResult(moduleProgramsDir, program)

      expect(r).toEqual(s)
    })
  })
})
describe('ttj scope=function onlyPublic', () => {


  functionPrograms.forEach((program) => {

    const executor = only.includes(program) ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getFunctionScopeTypes(join(functionProgramsDir, `${program}/source.ts`), 'functionContainer', { onlyPublic: true })

      const r = readResult(functionProgramsDir, program)

      expect(r).toEqual(s)
    })
  })
})

describe('ttj scope=function all', () => {


  functionAllPrograms.forEach((program) => {

    const executor = only.includes(program) ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getFunctionScopeTypes(join(functionAllDir, `${program}/source.ts`), 'functionContainer')

      const r = readResult(functionAllDir, program)

      expect(r).toEqual(s)
    })
  })
})
describe('ttj scope=class onlyPublic', () => {

  classPrograms.forEach((program) => {

    const executor = only.includes(program) ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getClassScopeTypes(join(classProgramsDir, `${program}/source.ts`), 'ClassContainer', { onlyPublic: true })

      const r = readResult(classProgramsDir, program)

      expect(r).toEqual(s)
    })
  })
})

describe('ttj target is default onlyPublic', () => {

  defaultPrograms.forEach((program) => {

    const executor = only.includes(program) ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getExportDefaultScopeTypes(join(defaultProgramsDir, `${program}/source.ts`), { onlyPublic: true })

      const r = readResult(defaultProgramsDir, program)

      expect(r).toEqual(s)
    })
  })
})


