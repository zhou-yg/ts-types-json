import {
  parseExportDefault
} from './parse'
import path from 'path';

const r = parseExportDefault(path.join(__dirname, './parse.test.ts'))

console.log('r: ', r);
