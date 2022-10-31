import {
  getFunctionScopeTypes,
  getTopTypes
} from './index'
import path from 'path';
const r = getTopTypes(path.join(__dirname, './index.test.ts'))
// const r = getFunctionScopeTypes(path.join(__dirname, './index.test.ts'), 'aa')
console.log('r: ', r);
