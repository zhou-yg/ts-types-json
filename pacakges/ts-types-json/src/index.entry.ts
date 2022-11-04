import {
  getExportDefaultScopeTypes,
  getClassScopeTypes,
  getFunctionScopeTypes,
  getTopTypes
} from './index'
import path from 'path';
// const r = getClassScopeTypes(path.join(__dirname, './index.test.ts'))
// const r = getExportDefaultScopeTypes(path.join(__dirname, './index.test.ts'), '')
const r = getExportDefaultScopeTypes(path.join(__dirname, './index.test.ts'))
// const r = getFunctionScopeTypes(path.join(__dirname, './index.test.ts'), 'aa')
console.log('r: ', r);
