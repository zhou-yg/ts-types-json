import * as path from 'node:path';
import type { CoreVisionComponent } from './l2v'
import { toComponents } from './l2v'
import type { VariableAndType } from 'ts-types-json'
import { getExportDefaultScopeTypes } from 'ts-types-json' 

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
  type: VariableAndType['definition'];
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

function constructCoreLogicByExportDefault (
  file: string
): CoreLogic {
  const resolvedFile = path.resolve(file)
  const scopeTypes = getExportDefaultScopeTypes(resolvedFile)
  const exportTypes = getExportDefaultScopeTypes(resolvedFile, { onlyPublic: true })
  console.log('scopeTypes1:', scopeTypes)
  console.log('scopeTypes2:', exportTypes)

  function toSignal(types: VariableAndType) {
    return {
      id: `${resolvedFile}#${types.name}`,
      name: types.name,
      type: types.definition
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
  
  const coreLogic = constructCoreLogicByExportDefault(file)

  const coreComponents = toComponents(coreLogic)

  const result: AbstractLayer = {
    imports: [],
    coreLogic,
    coreVision: {
      components: coreComponents
    }
  }

  return result
}
