import * as tjs from 'typescript-json-schema-pub';
declare type VariableAndType = VariableAndFunctionType | VariableAndOtherType;
interface VariableAndOtherType {
    name: string;
    type: tjs.Definition;
}
interface VariableAndFunctionType {
    name: string;
    type: 'function';
    parameters: VariableAndType[];
    returnType: tjs.Definition;
}
export declare function getTopTypes(file: string): VariableAndType[];
export declare function getFunctionScopeTypes(file: string, functionName: string): VariableAndType[];
export {};
