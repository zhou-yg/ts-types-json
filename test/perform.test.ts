import {
  getTypes
}  from '../src/'

import { readdirSync,readFileSync } from 'fs'
import { join } from 'path'

const programsDir = join(__dirname, './programs')

const programs = readdirSync(programsDir)

function readResult (p: string) {
  const json = readFileSync(join(programsDir, `${p}/result.json`)).toString()
  return JSON.parse(json)
}

describe('default', () => {
  it('placeholder', () => {
    
  })
})

describe('ts-types-json', () => {

  programs.forEach((program) => {
    it (`${program} unit test`, () => {
      const s = getTypes([join(programsDir, `${program}/source.ts`)])
      console.log(s)

      const r = readResult(program)

      expect(r).toEqual(s)
    })
  })
})

