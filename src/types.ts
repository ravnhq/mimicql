import { GraphQLResolveInfo } from 'graphql'

type ResolvedScalar = string | number | boolean | null
type ResolvedValue =
  | ResolvedScalar
  | Array<ResolvedValue>
  | { [key: string]: ResolvedValue }
export type ResolverFunction = (...args: any[]) => ResolvedValue

type NonRecord = string | boolean | number | null | undefined | Date

type ScalarPropertyKeys<T> = {
  [P in keyof T]: Exclude<T[P], NonRecord> extends never ? P : never
}[keyof T]

type WithoutTypename<T> = Exclude<T, '__typename'>

export type ShallowProperties<T> = {
  [K in WithoutTypename<ScalarPropertyKeys<T>>]: Exclude<T[K], undefined>
}

export type MockResolvedValue<T> = {
  [K in keyof T]: T[K] | ((root: any, args: any) => MockResolvedValue<T[K]>)
}

export type ShallowResolvedValue<T> = MockResolvedValue<ShallowProperties<T>>

export type MockResolver<
  TData,
  TSource = any,
  TContext = any,
  TArgs = { [argName: string]: any }
> = (
  source?: TSource,
  args?: TArgs,
  context?: TContext,
  info?: GraphQLResolveInfo,
) => MockResolvedValue<TData> | ResolvedScalar

export type ResolverMap<> = {
  [key: string]: MockResolver<any>
}
