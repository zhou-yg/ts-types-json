import {
  getExportDefaultScopeTypes
} from 'ts-types-json'
import path from 'path';

const r = getExportDefaultScopeTypes(path.join(__dirname, './index.test.ts'))

console.log('r: ', r);
