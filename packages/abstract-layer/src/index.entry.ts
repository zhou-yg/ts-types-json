import {
  parseExportDefault,
  parseL2VFile
} from './parse'
import path from 'path';
import { writeFileSync } from 'fs';

// const r = parseExportDefault(path.join(__dirname, './index.test.ts'))
const r = parseL2VFile(path.join(__dirname, './index.test.ts'))

writeFileSync(path.join(__dirname, './index.result.json'), JSON.stringify(r, null, 2))

console.log('r: ', r);
