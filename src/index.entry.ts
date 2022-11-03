import {
  getClassScopeTypes,
  getFunctionScopeTypes,
  getTopTypes
} from './index'
import path from 'path';
// const r = getClassScopeTypes(path.join(__dirname, './index.test.ts'))
const r = getClassScopeTypes(path.join(__dirname, './index.test.ts'), 'ClassContainer')
// const r = getFunctionScopeTypes(path.join(__dirname, './index.test.ts'), 'aa')
console.log('r: ', r);
