import {
  getTopTypes
} from './index'
import path from 'path';
const r = getTopTypes(path.join(__dirname, './indexTestFile.ts'))
console.log('r: ', r);