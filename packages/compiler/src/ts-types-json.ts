import * as ts from "typescript"
import * as tjs from 'typescript-json-schema-pub' 
import tsconfigJSON from '../tsconfig.json'
import path from 'node:path'
import { readFileSync } from "node:fs"

if (tsconfigJSON.extends) {
  tsconfigJSON.compilerOptions = JSON.parse(readFileSync(path.join(__dirname, '../', tsconfigJSON.extends)).toString()).compilerOptions
}

export type VariableAndType = VariableAndFunctionType | VariableAndOtherType

export interface VariableAndOtherType {
  name: string,
  signal?: boolean
  definition: tjs.Definition
}

export enum DefinitionEnum {
  function = 'function',
  object = 'object',
  number = 'number',
  string = 'string',
  boolean = 'boolean',
}

export interface VariableAndFunctionType {
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
    throw new Error('[getJSONTypeOfSymbol] the symbol must be a variable or function.')
  }

  const name = s.getName()

  const type = checker.getTypeOfSymbolAtLocation(s, s.valueDeclaration)
  const signatures = type.getCallSignatures()
  if (signatures.length > 0) {
    const signature = signatures[0]
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

function getReturnFromFunctionLikeNode (node: ts.Node) {
  let body: ts.Node
  let result: ts.ArrayLiteralExpression | ts.ObjectLiteralExpression

  if (ts.isFunctionDeclaration(node)) {
    body = node.body
  } else if (ts.isVariableDeclaration(node)) {
    if (node.initializer && 
        (ts.isFunctionExpression(node.initializer) || 
          ts.isArrowFunction(node.initializer))) {

      body = node.initializer.body
    }
  }

  if (ts.isBlock(body)) {
    ts.forEachChild(body, visitReturn)
  }

  return result

  function isValidReturnExpression (node: ts.Node): node is ts.ArrayLiteralExpression | ts.ObjectLiteralExpression {
    return ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node)
  }

  function matchVaraibleInBody (node: ts.Block, target: ts.Identifier) {
    let found: ts.ArrayLiteralExpression | ts.ObjectLiteralExpression | undefined
    ts.forEachChild(node, n => {
      if ((ts.isVariableDeclaration(n)) && ts.isIdentifier(n.name) && n.name.escapedText === target.escapedText) {
        if (isValidReturnExpression(n.initializer)) {
          found = n.initializer
        }
      }
    })
    return found
  }

  function visitReturn (node: ts.Node) {
    if (ts.isReturnStatement(node)) {
      let returnVariable: ts.ArrayLiteralExpression | ts.ObjectLiteralExpression
      const returnExpression = node.expression
      if (isValidReturnExpression(returnExpression)) {
        returnVariable = returnExpression
      } else if (ts.isIdentifier(node.expression)) {
        returnVariable = matchVaraibleInBody(body as ts.Block, node.expression)
      }
      if (returnVariable) {
        result = returnVariable 
      }
    } else {
      ts.forEachChild(node, visitReturn)
    }
  }
}

function isExport (node: ts.Node) {
  return true
}

function getAllVaraiblesTypes (
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  scope: 'module',
  options?: GetPropertiesOptions
): ts.Symbol[]
function getAllVaraiblesTypes (
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  scope: 'function',
  options: GetPropertiesOptions
): ts.Symbol[]
function getAllVaraiblesTypes (
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  scope: 'module' | 'function',
  options?: GetPropertiesOptions,
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

  function pickSymbolFromExpression (node: ts.ArrayLiteralExpression | ts.ObjectLiteralExpression) {
    if (ts.isArrayLiteralExpression(node)) {
      node.elements.forEach(e => {
        if (ts.isIdentifier(e)){
          const symbol = checker.getSymbolAtLocation(e) 
          if (symbol) {
            variableSymbols.add(symbol)
          }
          
        } else {
          /**
           * can't directly define function in return expression, so we don't know it means
           * invalid eg: 
           *   return { fn: () => {} }
           */
          throw new Error('[pickSymbolFromExpression] the element of function return expression must be identifier.')
        }
      })  
    } else if (ts.isObjectLiteralExpression(node)) {
      node.properties.forEach(p => {
        const symbol = checker.getSymbolAtLocation(p.name)
        variableSymbols.add(symbol)
      })
    }
  }

  function firstVisit (node: ts.Node) {
    // console.log('node kind', ts.SyntaxKind[node.kind], ts.SyntaxKind[node.parent.kind])
    switch (scope) {
      case 'module':
        if (
          ts.isSourceFile(node.parent) && isExport(node) && 
          (
            ts.isVariableStatement(node) ||
            ts.isFunctionDeclaration(node)
          )
        ) {
          deepthVisitVariable(node)
        }
        break
      case 'function':
        const name = getNameFromFunctionLikeNode(node)
        if (
          !name && !options.name ||
          name && ts.isIdentifier(name) && name.escapedText === options.name) 
        {
          // treat "function return" as public modifers
          if (options.onlyPublic) {
            const returnExpression = getReturnFromFunctionLikeNode(node)
            if (returnExpression) {
              pickSymbolFromExpression(returnExpression)
            }
          } else {
            const body = getBodyFromFunctionLikeNode(node)
            if (body) {
              deepthVisitVariable(body)
            }
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


interface GetPropertiesOptions {
  name?: string
  onlyPublic?: boolean
  exportFlag?: boolean // @TODO
}

// include members and methods from class
function getClassProperties (
  node: ts.Node, checker: ts.TypeChecker,
  options: GetPropertiesOptions
): ts.Symbol[] {

  const memberSymbols: Set<ts.Symbol> = new Set()

  ts.forEachChild(node, topVisitNode)

  return [...memberSymbols]

  function topVisitNode (node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      if (
        !node.name && !options.name ||
        ts.isIdentifier(node.name) && node.name.escapedText === options.name) {
        node.members.forEach(member => {
          if(ts.isPropertyDeclaration(member) || ts.isMethodDeclaration(member)) {
            if (isPublicProperty(member) && options?.onlyPublic || !options?.onlyPublic) {
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

function getExportDefaultNode (node: ts.Node) {

  let defaultNode: {
    identifier?: ts.Identifier | undefined
    type?: 'class' | 'function'
  }

  ts.forEachChild(node, visit);

  return defaultNode

  function visit (node: ts.Node) {
    if (ts.isSourceFile(node.parent)) {
      if (ts.isExportAssignment(node)) {
        if (ts.isIdentifier(node.expression)) {
          defaultNode = {
            identifier: node.expression
          }
        }
      } else if (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) {
        if (node.modifiers) {
          const r = node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
          if (r) {
            defaultNode = {
              identifier: node.name,
              type: ts.isClassDeclaration(node) ? 'class' : 'function'
            }
          }
        }
      }
    }
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

function getFunctionScopeTypesWithProgram (
  program: ts.Program,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  options: {
    name?: string,
    onlyPublic?: boolean
  },
) {
  const symbols = getAllVaraiblesTypes(sourceFile, checker, 'function', {
    ...options
  })

  const generate = tjs.buildGenerator(program, {
    required: true
  })

  const types = symbols.map(s => {
    const t = getJSONTypeOfSymbol(checker, s, generate)
    return t
  })
    
  return types
}

export function getFunctionScopeTypes (file: string, functionName: string, options?: GetPropertiesOptions) {
  const {
    program,
    checker,
    sourceFile
  } = initializeProgram(file)

  if (sourceFile) {
    return getFunctionScopeTypesWithProgram(program, checker, sourceFile, {
      ...options,
      name: functionName,
    })
  }
  return []
}

function getClassScopeTypesWithProgram (program: ts.Program, checker: ts.TypeChecker, sourceFile: ts.SourceFile, options: GetPropertiesOptions) {
  const symbols = getClassProperties(sourceFile, checker, options)

  const generate = tjs.buildGenerator(program, {
    required: true
  })

  const types = symbols.map(s => {
    const t = getJSONTypeOfSymbol(checker, s, generate)
    return t
  })
    
  return types   

}

export function getClassScopeTypes (file: string, className: string, options?: GetPropertiesOptions) {
  const {
    program,
    checker,
    sourceFile
  } = initializeProgram(file)

  if (sourceFile) {
    return getClassScopeTypesWithProgram(program, checker, sourceFile, {
      ...options,
      name: className,
    })
  }
  return []
}

export function getExportDefaultScopeTypes (file: string, options?: GetPropertiesOptions) {
  const {
    program,
    checker,
    sourceFile
  } = initializeProgram(file)

  if (sourceFile) {
    const exportDefault = getExportDefaultNode(sourceFile)

    const name = exportDefault.identifier?.escapedText as string

    switch (exportDefault.type) {
      case 'class':
        return getClassScopeTypesWithProgram(program, checker, sourceFile, {...options, name,})
      case 'function':
        return getFunctionScopeTypesWithProgram(program, checker, sourceFile, {...options, name})
      default:
        {
          let types = getClassScopeTypesWithProgram(program, checker, sourceFile, {...options, name})
          if (!types.length)  {
            types = getFunctionScopeTypesWithProgram(program, checker, sourceFile, {...options, name})
          }
          return types    
        }        
    }
  }
  return [] 
}