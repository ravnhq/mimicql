import { ResolverMap } from './types'

const mergeResolvers = (target: ResolverMap, input: ResolverMap) => {
  const inputTypenames = Object.keys(input)
  const merged: ResolverMap = inputTypenames.reduce(
    (accum, key) => {
      const inputResolver = input[key]
      if (target.hasOwnProperty(key)) {
        const targetResolver = target[key]
        const resolvedInput = inputResolver()
        const resolvedTarget = targetResolver()
        if (
          !!resolvedTarget &&
          !!resolvedInput &&
          typeof resolvedTarget === 'object' &&
          typeof resolvedInput === 'object' &&
          !Array.isArray(resolvedTarget) &&
          !Array.isArray(resolvedInput)
        ) {
          const newValue = { ...resolvedTarget, ...resolvedInput }
          return {
            ...accum,
            [key]: () => newValue,
          }
        }
      }
      return { ...accum, [key]: inputResolver }
    },
    { ...target },
  )
  return merged
}

export default mergeResolvers