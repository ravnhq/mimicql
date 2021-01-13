import {
  buildClientSchema,
  DocumentNode,
  GraphQLSchema,
  execute,
  GraphQLObjectType,
  GraphQLInterfaceType,
  print,
  IntrospectionQuery,
  parse,
} from 'graphql'
import { getMainDefinition, addTypenameToDocument } from 'apollo-utilities'
import {
  addMockFunctionsToSchema,
  transformSchema,
  mergeSchemas,
} from 'graphql-tools'
import { ResolverMap } from './types'
import mergeResolvers from './mergeResolvers'

const buildMockSchema = (schemaJson: IntrospectionQuery) => {
  const originalSchema = buildClientSchema(schemaJson)

  const typeMap = originalSchema.getTypeMap()
  const allTypeFields = Object.keys(typeMap).reduce((fields, typeName) => {
    const type = typeMap[typeName]
    if (
      typeName.startsWith('__') ||
      typeName === 'Query' ||
      typeName === 'Mutation' ||
      (!(type instanceof GraphQLObjectType) &&
        !(type instanceof GraphQLInterfaceType))
    ) {
      return fields
    }
    return {
      ...fields,
      [`mock__${typeName}`]: { type: typeMap[typeName] },
    }
  }, {})

  const mockSchema = new GraphQLSchema({
    query: new GraphQLObjectType({ name: 'Query', fields: allTypeFields }),
  })

  return mergeSchemas({ schemas: [originalSchema, mockSchema] })
}

const executeOperation = (
  schema: GraphQLSchema,
  operationDocument: DocumentNode,
  variables?: { [key: string]: any },
) => {
  const result = execute(schema, operationDocument, undefined, {}, variables)

  if (result instanceof Promise) {
    throw new Error("Async mock resolvers aren't supported yet")
  }
  if (result.errors?.length) {
    throw result.errors[0]
  }

  return result
}

interface Options {
  mocks?: ResolverMap
  addTypename?: Boolean
}

interface MockOptions<TVariables> {
  variables?: TVariables
  mocks?: ResolverMap
  addTypename?: Boolean
}

class MockFactory {
  private schema: GraphQLSchema
  private mocks: ResolverMap
  private addTypename: Boolean

  private mockSchema(options: { mocks?: ResolverMap } = {}) {
    const clonedSchema = transformSchema(this.schema, [])
    const mergedMocks = mergeResolvers(this.mocks, options.mocks ?? {})
    addMockFunctionsToSchema({ schema: clonedSchema, mocks: mergedMocks })
    return clonedSchema
  }

  private maybeAddTypenameToDocument = (
    document: DocumentNode,
    overrideAddTypename: Boolean | undefined,
  ) => {
    const addTypename = overrideAddTypename ?? this.addTypename
    return addTypename ? addTypenameToDocument(document) : document
  }

  constructor(
    schema: IntrospectionQuery,
    { mocks, addTypename = true }: Options = {},
  ) {
    this.schema = buildMockSchema(schema)
    this.mocks = mocks ?? {}
    this.addTypename = addTypename
  }

  mockFragment = <TData = any>(
    fragment: DocumentNode,
    options: Pick<MockOptions<{}>, 'addTypename' | 'mocks'> = {},
  ): TData => {
    const { mocks = {}, addTypename } = options

    const fragmentDocument = this.maybeAddTypenameToDocument(
      fragment,
      addTypename,
    )
    const mainDefinition = getMainDefinition(fragmentDocument)

    if (mainDefinition.kind !== 'FragmentDefinition') {
      throw new Error(
        'MockFactory: mockFragment only accepts fragment documents',
      )
    }

    const typeName = mainDefinition.typeCondition.name.value
    const fieldName = `mock__${typeName}`
    const query = parse(/* GraphQL */ `
      query {
        ${fieldName} {
          ...${mainDefinition.name.value}
        }
      }
      ${print(fragmentDocument)}
    `)

    const mockedSchema = this.mockSchema({ mocks })

    const result = executeOperation(mockedSchema, query)

    if (!result.data || result.data[fieldName] === undefined) {
      throw new Error(
        [
          `Unable to generate mock data for ${
            mainDefinition.name.value || 'fragment'
          }. This could be a result of missing mock resolvers or an incorrect fragment structure.`,
          print(fragment),
        ].join('\n'),
      )
    }

    return JSON.parse(JSON.stringify(result.data[fieldName])) as TData
  }

  mockQuery = <TData = any, TVariables = any>(
    query: DocumentNode,
    options: MockOptions<TVariables> = {},
  ) => {
    const { variables = {}, mocks = {}, addTypename } = options

    const queryDocument = this.maybeAddTypenameToDocument(query, addTypename)
    const mainDefinition = getMainDefinition(queryDocument)

    if (
      mainDefinition.kind !== 'OperationDefinition' ||
      mainDefinition.operation !== 'query'
    ) {
      throw new Error('MockFactory: mockQuery only accepts query documents')
    }

    const mockedSchema = this.mockSchema({ mocks })

    const result = executeOperation(mockedSchema, queryDocument, variables)

    if (!result.data) {
      throw new Error(
        [
          `Unable to generate mock data for ${
            mainDefinition.name?.value ?? 'unnamed'
          } query. This could be a result of missing mock resolvers, incorrect query structure, or missing variables.`,
          `variables: ${JSON.stringify(variables, null, 2)}`,
          print(query),
        ].join('\n'),
      )
    }

    return JSON.parse(JSON.stringify(result.data)) as TData
  }

  mockMutation = <TData = any, TVariables = any>(
    mutation: DocumentNode,
    options: MockOptions<TVariables> = {},
  ) => {
    const { variables = {}, mocks = {}, addTypename } = options

    const mutationDocument = this.maybeAddTypenameToDocument(
      mutation,
      addTypename,
    )
    const mainDefinition = getMainDefinition(mutationDocument)

    if (
      mainDefinition.kind !== 'OperationDefinition' ||
      mainDefinition.operation !== 'mutation'
    ) {
      throw new Error(
        'MockFactory: mockMutation only accepts mutation documents',
      )
    }

    const mockedSchema = this.mockSchema({ mocks })

    const result = executeOperation(mockedSchema, mutationDocument, variables)

    if (!result.data) {
      throw new Error(
        [
          `Unable to generate mock data for ${
            mainDefinition.name?.value ?? 'unnamed'
          } mutation. This could be a result of missing mock resolvers, incorrect mutation structure, or missing variables.`,
          `variables: ${JSON.stringify(variables, null, 2)}`,
          print(mutation),
        ].join('\n'),
      )
    }

    return JSON.parse(JSON.stringify(result.data)) as TData
  }
}

export default MockFactory
