import * as ts from "typescript"
import * as tjs from 'typescript-json-schema' 
import tsconfigJSON from '../tsconfig.json'

type JSONType = ObjectType | FunctionType | PrimitiveType | UnionOrIntersectionType

interface FunctionType {
  type: 'function',
  paramters: JSONType[],
  returnType: JSONType
}
interface ObjectType {
  type: 'object',
  members: {
    [key: string]: JSONType
  }
}
interface PrimitiveType<T = number | string | boolean> {
  type: T extends number ? 'number' : T extends string ? 'string' : T extends boolean ? 'boolean' : never,
  enum?: T[] 
}

interface UnionOrIntersectionType {
  type: 'union' | 'intersection',
  types: JSONType[]
}

/**
 * all symbol is belong to varaible symbol
 */
function getJSONTypeOfSymbol (checker: ts.TypeChecker, s: ts.Symbol) {
  // if (!(s.flags & ts.SymbolFlags.Variable)) {
  //   throw new Error('[getJSONTypeOfSymbol] the symbol must be a variable')
  // }

  let result: JSONType

  const type = checker.getTypeOfSymbolAtLocation(s, s.valueDeclaration)

  const typeSymbol = type.getSymbol()

  if (type.flags & ts.TypeFlags.Object) {
    const objectType = type as ts.ObjectType

    switch (typeSymbol.escapedName) {
      case 'Array':
        {
          const str = checker.typeToString(type)
          console.log('str: ', str);
        }
        break
      case '__object':
        {
          const members = objectType.getProperties()
          const membersJSONType = members.map(m => {
            return { n: m.getName(), v: getJSONTypeOfSymbol(checker, m)}
          }).reduce((p, n) => Object.assign(p, { [n.n]: n.v }), {});
    
          result = {
            type: 'object',
            members: membersJSONType
          }    
        }
        break
    }
  } else if (type.flags & (ts.TypeFlags.String | ts.TypeFlags.Number | ts.TypeFlags.Boolean)) {
    const typeName = checker.typeToString(type)
    result = {
      type: typeName as 'string' | 'number' | 'boolean',
    }
  } else if (type.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral | ts.TypeFlags.BooleanLiteral)) {
    const literalNameMap = {
      [ts.TypeFlags.StringLiteral]: 'string',
      [ts.TypeFlags.NumberLiteral]: 'number',
      [ts.TypeFlags.BooleanLiteral]: 'boolean'
    }
    result = {
      type: literalNameMap[type.flags],
      enum: [(type as ts.NumberLiteralType).value]
    }
  } else {

  }

  return result
}

function getAllVaraiblesTypes (
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  scope: 'module'
): ts.Symbol[]
function getAllVaraiblesTypes (
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  scope: 'function',
  scopeName: string
): ts.Symbol[]
function getAllVaraiblesTypes (
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  scope: 'module' | 'function',
  scopeName?: string
): ts.Symbol[] {
  /**
   * 当前文件内所有变量，主要有2类
   *  1.var
   *  2.const/let
   */
  const variableSymbols: Set<ts.Symbol> = new Set()

  ts.forEachChild(sourceFile, firstVisit)

  return [...variableSymbols]

  function deepthVisitVariable (node: ts.Node) {
    const symbol = checker.getSymbolAtLocation(node)
    if (symbol && (symbol.flags & ts.SymbolFlags.Variable)) {
      variableSymbols.add(symbol)
    }
    ts.forEachChild(node, deepthVisitVariable)
  }

  function firstVisit (node: ts.Node) {
    console.log('node kind', ts.SyntaxKind[node.kind], ts.SyntaxKind[node.parent.kind])
    switch (scope) {
      case 'module':
        if (ts.isSourceFile(node.parent) && ts.isVariableStatement(node)) {
          deepthVisitVariable(node)
        }
        break
      case 'function':

        break
    }
  }
}

export function getTopTypes (file: string) {
  const program = ts.createProgram([file], {
    ...tsconfigJSON.compilerOptions as any,
  })

  const checker = program.getTypeChecker()

  const sourceFile = program.getSourceFiles().find(f => {
    if (!f.isDeclarationFile) {
      return f.fileName === file
    }
  })
  if (sourceFile) {
    const symbols = getAllVaraiblesTypes(sourceFile, checker, 'module')

    const types = symbols.map(s => {
      const t = getJSONTypeOfSymbol(checker, s)
      return t
    })
      
    return types
    // const generate = tjs.buildGenerator(program, {
    //   required: true
    // })

    // const s2 = generate.getSchemaForSymbol('c')

    // console.log('s2: ', s2);

  }

  return []
}
