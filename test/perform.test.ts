import {
  getTopTypes
}  from '../src/'

import { readdirSync,readFileSync } from 'fs'
import { join } from 'path'

const programsDir = join(__dirname, './programs')

const programs = readdirSync(programsDir)

function readResult (p: string) {
  const json = readFileSync(join(programsDir, `${p}/result.json`)).toString()
  return JSON.parse(json)
}

describe('ts-types-json', () => {

  const only = ''; 

  programs.forEach((program) => {

    const executor = only === program ? it.only : it

    executor(`${program} unit test`, () => {
      const s = getTopTypes(join(programsDir, `${program}/source.ts`))

      const r = readResult(program)

      expect(r).toEqual(s)
    })
  })
})

