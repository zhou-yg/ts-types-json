import type {
  Signal, CoreLogic
} from './single-entry'
import type {
  VariableAndOtherType
} from './ts-types-json'
import {
  DefinitionEnum,
} from './ts-types-json'

const VALUE_KEY_WORD = 'value'

export interface CoreVisionComponent {
  type: ComponentType;
  attributes: Record<string, CoreVisionComponent['value']>
  value: ValueExpression | ValueStatic
}
type ValueExpression = {
  type: 'referrence',
  target: string // 一个字符串表达式, eg: "obj.xxx"
};
type ValueStatic = {
  type: 'static',
  value: number | string // 一个字符串表达式, eg: "obj.xxx"
};

enum ComponentType {
	label = 'label',
	input = 'input',
	action = 'action',
}

function signalToComponent (path: string, signal: Signal): CoreVisionComponent | undefined {

  const withPath = (name: string) => `${path}#${name}`

  const rules = [
    {
      name: 'basicTypeSignal',
      guarding (input: Signal) {
        const types: string[] = [
          DefinitionEnum.number,
          DefinitionEnum.string,
          DefinitionEnum.boolean,
        ]
        if (typeof input.definition.type === 'string') {
          return types.includes(input.definition.type)
        }
        return input.definition.type.every((type: string) => types.includes(type))
      },
      toComponent (input: Signal): CoreVisionComponent {
        return {
          type: input.readonly ? ComponentType.label : ComponentType.input,
          attributes: {},
          value: {
            type: 'referrence',
            target: withPath(input.name)
          }
        }
      }
    },
    {
      name: 'objectTypeSignal',
      guarding (input: Signal) {
        return input.definition.type === DefinitionEnum.function
      },
      toComponent (input: Signal): CoreVisionComponent {
        /** 问题：如何正确的识别出，在function returnType 中的 值 是由 signal 组成的，不是真的类型
         * return { obj: { v1: signal1 } } == 现在转换成 ==> { obj: { v1: { type: 'number' } } }
         * 应该预期是 { obj: v1: { $refToSignal: 'signal1'  }, $signals: { signal1: { type: 'number' } } }
         */
        const inputDefinition = input.definition as VariableAndOtherType['definition']
        const componentType = input.readonly ? ComponentType.label : ComponentType.input

        /** TOOD: use simple way */
        if (inputDefinition.properties?.[VALUE_KEY_WORD]) {

          const attributes: CoreVisionComponent['attributes'] = Object.entries(
            inputDefinition.properties
          ).map(([k, v]) => {
            if (k !== VALUE_KEY_WORD) {
              return {
                [k]: {
                  type: 'referrence',
                  target: withPath(`${input.name}.${k}`)
                } as CoreVisionComponent['value']
              }
            }
          }).filter(Boolean).reduce((acc, cur) => ({ ...acc, ...cur }), {})

          return {
            type: componentType,
            attributes,
            value: {
              type: 'referrence',
              target: withPath(`${input.name}.value`)
            },
          }
        }
        return {
          type: componentType,
          attributes: {},
          value: {
            type: 'referrence',
            target: withPath(`${input.name}`)
          }
        }
      }
    },
    {
      name: 'functionTypeAction',
      guarding (input: Signal) {
        return input.definition.type === DefinitionEnum.function
      },
      toComponent (input: Signal): CoreVisionComponent {
        return {
          type: ComponentType.action,
          attributes: {},
          value: {
            type: 'referrence',
            target: withPath(input.name)
          }
        }
      }
    },
  ]
  
  let component: CoreVisionComponent | undefined

  for (const rule of rules) {
    if (rule.guarding(signal)) {
      component = rule.toComponent(signal)
      break
    }
  }

  return component
}

export function toVisualComponents (logic: CoreLogic) {
  const { exports, path } = logic

  if (exports.length > 0) {
    const coreComponents = exports.map((signal) => {
      return signalToComponent(path, signal)
    }).filter(Boolean)

    return coreComponents
  }
  return []
}
