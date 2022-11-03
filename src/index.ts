import * as ts from "typescript"
import * as tjs from 'typescript-json-schema-pub' 
import tsconfigJSON from '../tsconfig.json'

type VariableAndType = VariableAndFunctionType | VariableAndOtherType

interface VariableAndOtherType {
  name: string,
  definition: tjs.Definition
}

export enum DefinitionEnum {
  function = 'function'
}

interface VariableAndFunctionType {
  name: string,
  definition: {
    type: DefinitionEnum.function,
    parameters: VariableAndType[],
    returnType: tjs.Definition
  }
}


/**
 * all symbol is belong to varaible symbol
 */
function getJSONTypeOfSymbol (checker: ts.TypeChecker, s: ts.Symbol, gen: tjs.JsonSchemaGenerator): VariableAndType {
  if (!(s.flags & (
    ts.SymbolFlags.Variable |
    ts.SymbolFlags.Function |
    ts.SymbolFlags.Property |
    ts.SymbolFlags.Method
  ))) {
    throw new Error('[getJSONTypeOfSymbol] the symbol must be a variable or function')
  }

  const name = s.getName()

  if (s.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Method)) {
    const type = checker.getTypeOfSymbolAtLocation(s, s.valueDeclaration)
    const signature = type.getCallSignatures()[0]
    const parameters = signature.getParameters()
    const returnType = signature.getReturnType()

    return {
      name,
      definition: {
        type: DefinitionEnum.function,
        parameters: parameters.map(p => getJSONTypeOfSymbol(checker, p, gen)),
        returnType: gen.getTypeDefinition(returnType),
      }
    }
  }

  const type = checker.getTypeOfSymbolAtLocation(s, s.valueDeclaration)
  const r = gen.getTypeDefinition(type)
  let result: VariableAndType = {
    name,
    definition: r,
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
   * all variables in the file, there are 2 formation
   *  1.var
   *  2.const/let
   */
  const variableSymbols: Set<ts.Symbol> = new Set()

  ts.forEachChild(sourceFile, firstVisit)

  return [...variableSymbols]

  function deepthVisitVariable (node: ts.Node) {
    const symbol = checker.getSymbolAtLocation(node)
    if (symbol && (symbol.flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.Function))) {
      variableSymbols.add(symbol)
      return true
    } else {
      let found = false
      ts.forEachChild(node, n => {
        if (!found) {
          found = found || deepthVisitVariable(n)
        }
      })
    }
  }

  function firstVisit (node: ts.Node) {
    // console.log('node kind', ts.SyntaxKind[node.kind], ts.SyntaxKind[node.parent.kind])
    switch (scope) {
      case 'module':
        if (ts.isSourceFile(node.parent) && (
          ts.isVariableStatement(node) ||
          ts.isFunctionDeclaration(node)
        )) {
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

function isPublicProperty (node: ts.PropertyDeclaration | ts.MethodDeclaration) {
  return node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.PublicKeyword)
}

// include members and methods from class
function getClassProperties (node: ts.Node, checker: ts.TypeChecker, className: string): ts.Symbol[] {

  const memberSymbols: Set<ts.Symbol> = new Set()

  ts.forEachChild(node, topVisitNode)

  return [...memberSymbols]

  function topVisitNode (node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      if (ts.isIdentifier(node.name) && node.name.escapedText === className) {
        node.members.forEach(member => {
          if(ts.isPropertyDeclaration(member) || ts.isMethodDeclaration(member)) {
            if (isPublicProperty(member)) {
              const symbol = checker.getSymbolAtLocation(member.name)
              if (symbol) {
                memberSymbols.add(symbol)
              }
            }
          }
        })
      }
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

    /**
     * @TODO tjs need refactor or rewrite
     */
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

export function getClassScopeTypes (file: string, className: string) {
  const {
    program,
    checker,
    sourceFile
  } = initializeProgram(file)

  if (sourceFile) {
    const symbols = getClassProperties(sourceFile, checker, className)

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