import * as ts from "typescript"
import * as tjs from 'typescript-json-schema-pub' 
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


interface VariableAndType {
  name: string,
  type: tjs.Definition
}

/**
 * all symbol is belong to varaible symbol
 */
function getJSONTypeOfSymbol (checker: ts.TypeChecker, s: ts.Symbol, gen: tjs.JsonSchemaGenerator) {
  if (!(s.flags & ts.SymbolFlags.Variable)) {
    throw new Error('[getJSONTypeOfSymbol] the symbol must be a variable')
  }

  const type = checker.getTypeOfSymbolAtLocation(s, s.valueDeclaration)

  const r = gen.getTypeDefinition(type)

  let result: VariableAndType = {
    name: s.getName(),
    type: r,
  }

  return result
}

/**
 * get name of function like node, there are 2 ways:
 * 1. by function declaration
 * 2. by variable declaration and the type is function
 */
function getNameFromFunctionLikeNode (node: ts.Node): ts.Identifier | undefined {
  if (ts.isFunctionDeclaration(node)) {
    return node.name
  } else if (ts.isVariableDeclaration(node)) {
    if (node.initializer && 
        (ts.isFunctionExpression(node.initializer) || 
          ts.isArrowFunction(node.initializer))) {

      if (ts.isIdentifier(node.name)) {
        return node.name
      }
    }
  }

  return undefined
}

function getBodyFromFunctionLikeNode (node: ts.Node) {
  if (ts.isFunctionDeclaration(node)) {
    return node.body
  } else if (ts.isVariableDeclaration(node)) {
    if (node.initializer && 
        (ts.isFunctionExpression(node.initializer) || 
          ts.isArrowFunction(node.initializer))) {

      return node.initializer.body
    }
  }

  return undefined
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
    // console.log('node kind', ts.SyntaxKind[node.kind], ts.SyntaxKind[node.parent.kind])
    switch (scope) {
      case 'module':
        if (ts.isSourceFile(node.parent) && ts.isVariableStatement(node)) {
          deepthVisitVariable(node)
        }
        break
      case 'function':
        const name = getNameFromFunctionLikeNode(node)
        if (name && ts.isIdentifier(name) && name.escapedText === scopeName) {
          const body = getBodyFromFunctionLikeNode(node)
          if (body) {
            deepthVisitVariable(body)
          }
        } else {
          ts.forEachChild(node, firstVisit)
        }
        break
    }
  }
}

function initializeProgram (file: string) {
  const program = ts.createProgram([file], {
    ...tsconfigJSON.compilerOptions as any,
  })

  const checker = program.getTypeChecker()

  const sourceFile = program.getSourceFiles().find(f => {
    if (!f.isDeclarationFile) {
      return f.fileName === file
    }
  })

  return {
    program,
    sourceFile,
    checker,
  }
}

export function getTopTypes (file: string) {
  const {
    program,
    checker,
    sourceFile
  } = initializeProgram(file)

  if (sourceFile) {
    const symbols = getAllVaraiblesTypes(sourceFile, checker, 'module')

    const generate = tjs.buildGenerator(program, {
      required: true
    })

    const types = symbols.map(s => {
      const t = getJSONTypeOfSymbol(checker, s, generate)
      return t
    })
      
    return types
  }

  return []
}

export function getFunctionScopeTypes (file: string, functionName: string) {
  const {
    program,
    checker,
    sourceFile
  } = initializeProgram(file)

  if (sourceFile) {
    const symbols = getAllVaraiblesTypes(sourceFile, checker, 'function', functionName)

    const generate = tjs.buildGenerator(program, {
      required: true
    })

    const types = symbols.map(s => {
      const t = getJSONTypeOfSymbol(checker, s, generate)
      return t
    })
      
    return types
  }
  return []
}