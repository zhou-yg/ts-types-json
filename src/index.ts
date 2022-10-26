import ts from "typescript"

type JsonType = ObjectType | FunctionType | PrimitiveType | UnionOrIntersectionType

interface FunctionType {
  type: 'function',
  paramters: JsonType[],
  returnType: JsonType
}
interface ObjectType {
  type: 'object',
  members: {
    [key: string]: JsonType
  }
}
interface PrimitiveType<T = number | string | boolean> {
  type: T extends number ? 'number' : T extends string ? 'string' : T extends boolean ? 'boolean' : never,
  enum?: T[] 
}

interface UnionOrIntersectionType {
  type: 'union' | 'intersection',
  types: JsonType[]
}

function getAllVaraiblesTypes (sourceFiles: ts.SourceFile[], checker: ts.TypeChecker) {

}

export function getTypes (files: string[]) {
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2015,
  })

  const checker = program.getTypeChecker()

  const sourceFiles = program.getSourceFiles().filter(s => s.hasNoDefaultLib)

  const types = getAllVaraiblesTypes(sourceFiles, checker)
}
