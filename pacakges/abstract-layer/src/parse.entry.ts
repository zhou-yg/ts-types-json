import {
} from './parse'
import path from 'path';

const r = getClassScopeTypes(path.join(__dirname, './index.test.ts'), 'ClassContainer')

console.log('r: ', r);
