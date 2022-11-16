import * as path from 'node:path';
import type { CoreVisionComponent } from './l2v'
import { toVisualComponents } from './l2v'
import { getFunctionScopeTypes, VariableAndType } from './ts-types-json'
import { getExportDefaultScopeTypes } from './ts-types-json' 

interface AbstractLayer {
  imports: AbstractLayer[];
  coreLogic: CoreLogic;
  coreVision: CoreVision
  incrementUI?: any;
  styleLogic?: any;
}

export interface CoreLogic {
  path: string;
  signals: Signal[] // including actions
  exports: Signal[]
}

export interface Signal {
  id: string; // path + name, unique and stable
  name: string;
  definition: VariableAndType['definition'];
  readonly?: boolean
  dependecies?: {
    signal: Signal;
    import?: string // referrence to AbstractLayer['imports']
  }
  runtimeSnapshot?: any;
}

export interface CoreVision {
  components: CoreVisionComponent[]
}

function constructCoreLogic (
  file: string,
  getTypes: (file: string, options?: { onlyPublic: boolean  }) => VariableAndType[]
): CoreLogic {
  const resolvedFile = file
  const scopeTypes = getTypes(resolvedFile)
  const exportTypes = getTypes(resolvedFile, { onlyPublic: true })

  function toSignal(types: VariableAndType) {
    return {
      id: `${resolvedFile}#${types.name}`,
      name: types.name,
      definition: types.definition
    }
  }  

  const signals = scopeTypes.map(toSignal)
  const exports = exportTypes.map(toSignal)

  const coreLogic: CoreLogic = {
    path: resolvedFile,
    signals,
    exports
  }
  return coreLogic
}

/**
 * not support dependency relation cross different file
 */
export function parseExportDefault (file: string) {
  
  const coreLogic = constructCoreLogic(file, getExportDefaultScopeTypes)

  const coreComponents = toVisualComponents(coreLogic)

  const result: AbstractLayer = {
    imports: [],
    coreLogic,
    coreVision: {
      components: coreComponents
    }
  }

  return result
}

enum L2VFileExports {
  logic = 'logic',
  vision = 'vision',
  incrementUI = 'incrementUI',
  sstyleRules = 'styleRules'
}

/**
 * 
 */
export function parseL2VFile (file: string) {
 
  const coreLogic = constructCoreLogic(file, (f, op) => {
    const types = getFunctionScopeTypes(f, L2VFileExports.logic, {
      onlyPublic: op?.onlyPublic,
    })
    return types
  })

  const coreComponents = toVisualComponents(coreLogic)

  const result: AbstractLayer = {
    imports: [],
    coreLogic,
    coreVision: {
      components: coreComponents
    }
  }

  return result
}
