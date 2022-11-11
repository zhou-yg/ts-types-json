import { readdirSync, readFileSync } from 'node:fs'
import {
  join
} from 'node:path'

import {
  parseL2VFile
} from '../src/index'

const classDir = join(__dirname, 'programs/single-file')
const classPrograms = readdirSync(classDir)

const SOURCE = 'source.ts'
const RESULT = 'result.json'

function readResult (dir: string, p: string) {
  const json = readFileSync(join(dir, p, RESULT)).toString()
  return JSON.parse(json)
}

const projectRootPath = join(__dirname, '../../')

// make sure that unit test can run in other device
function replaceProjectPathInJSON (json: any) {
  Object.entries(json).forEach(([k, v]) => {
    if (v && typeof v === 'object') {
      replaceProjectPathInJSON(v)
    } else {
      if (typeof v === 'string') {
        json[k] = v.replace(projectRootPath, '')
      }
    }
  })
}

describe('single-file', () => {
  const only = ''; 

  classPrograms.forEach(program => {
    const executor = only === program ? it.only : it

    executor(`${program} unit test`, () => {
      const sourceFile = join(classDir, program, SOURCE)
      const s = parseL2VFile(sourceFile)
      const r = readResult(classDir, program)

      replaceProjectPathInJSON(s)

      expect(s).toEqual(r)
    })
  })
})