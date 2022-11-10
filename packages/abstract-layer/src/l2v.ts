import type { CoreVisionComponent, Signal, CoreLogic } from './parse'

function signalToComponent (signal: Signal) {

  const rules = [
    {
      name: 'basicTypeSignal',
      guarding (input: Signal) {
        const types = [
          'number',
          'string',
          'boolean'
        ]
        if (typeof input.type.type === 'string') {
          return types.includes(input.type.type)
        }
        return input.type.type.every((type: string) => types.includes(type))
      },
      toComponent (input: Signal): CoreVisionComponent {
        return {
          type: input.readonly ? 'label' : 'input',
          attribute: {},
          value: input
        }
      }
    },
    {
      name: 'objectTypeSignal',
      guarding (input: Signal) {
      },
      toComponent (input: Signal): CoreVisionComponent {
      }
    },
  ]
  
}

export function l2v (logic: CoreLogic) {
  const { exports } = logic

  if (exports.length > 0) {
    

  }
}