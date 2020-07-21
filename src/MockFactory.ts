import {
  buildClientSchema,
  DocumentNode,
  GraphQLSchema,
  execute,
  GraphQLObjectType,
  GraphQLInterfaceType,
  print,
  IntrospectionQuery,
} from 'graphql'
import { getMainDefinition, addTypenameToDocument } from 'apollo-utilities'
import {
  addMockFunctionsToSchema,
  transformSchema,
  mergeSchemas,
} from 'graphql-tools'
import gql from 'graphql-tag'
import { ResolverMap } from './types'
import mergeResolvers from './mergeResolvers'

const generateMockSchema = (schemaJson: any) => {
  const originalSchema = buildClientSchema(schemaJson)

  const typeMap = originalSchema.getTypeMap()
  const allTypeFields = Object.keys(typeMap).reduce((fields, typeName) => {
    const type = typeMap[typeName]
    if (
      typeName.startsWith('__') ||
      typeName === 'Query' ||
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
    throw new Error('Async mock resolvers arent supported yet')
  }
  if (result.errors && result.errors.length) {
    throw result.errors[0]
  }

  return result
}

interface Options {
  mocks?: ResolverMap
}

class MockFactory {
  private schema: GraphQLSchema
  private mocks: ResolverMap

  private mockSchema(options: { mocks?: ResolverMap } = {}) {
    const clonedSchema = transformSchema(this.schema, [])
    const mergedMocks = mergeResolvers(options.mocks || {}, this.mocks)
    addMockFunctionsToSchema({ schema: clonedSchema, mocks: mergedMocks })
    return clonedSchema
  }

  constructor(schema: IntrospectionQuery, { mocks }: Options) {
    this.schema = generateMockSchema(schema)
    this.mocks = mocks || {}
  }

  mockFragment = <TData = any>(
    fragment: DocumentNode,
    { mocks }: Options = { mocks: {} },
  ): TData => {
    const mainDefinition = getMainDefinition(fragment)
    const fragmentWithTypename = addTypenameToDocument(fragment)

    if (mainDefinition.kind !== 'FragmentDefinition') {
      throw new Error(
        'MockFactory: mockFragment only accepts fragment documents',
      )
    }

    /* eslint-disable graphql/template-strings */
    const typeName = mainDefinition.typeCondition.name.value
    const fieldName = `mock__${typeName}`
    const query = gql`
      query {
        ${fieldName} {
          ...${mainDefinition.name?.value}
        }
      }
      ${fragmentWithTypename}
    `
    /* eslint-enable graphql/template-strings */

    const mockedSchema = this.mockSchema({ mocks })

    const result = executeOperation(mockedSchema, query)

    if (!result.data || result.data[fieldName] === undefined) {
      throw new Error(
        `Unable to generate mock data for ${mainDefinition.name.value ||
          'fragment'}. This could be a result of missing mock resolvers or an incorrect fragment structure.`,
      )
    }
    return { ...result.data[fieldName] }
  }

  mockQuery = <TData = any, TVariables = any>(
    query: DocumentNode,
    options: { variables?: TVariables; mocks?: ResolverMap } = {},
  ) => {
    const { variables = {}, mocks = {} } = options
    const mainDefinition = getMainDefinition(query)
    const queryWithTypename = addTypenameToDocument(query)

    if (
      mainDefinition.kind !== 'OperationDefinition' ||
      (mainDefinition.kind === 'OperationDefinition' &&
        mainDefinition.operation !== 'query')
    ) {
      throw new Error('MockFactory: mockQuery only accepts query documents')
    }

    const mockedSchema = this.mockSchema({ mocks })

    const result = executeOperation(mockedSchema, queryWithTypename, variables)

    if (!result.data) {
      throw new Error(
        `Unable to generate mock data for ${
          mainDefinition.name?.value
        } query. This could be a result of missing mock resolvers, incorrect query structure, or missing variables.
        
variables: ${JSON.stringify(variables, null, 2)}

${print(query)}`,
      )
    }

    return { ...result.data } as TData
  }

  mockMutation = <TData = any, TVariables = any>(
    mutation: DocumentNode,
    options: { variables?: TVariables; mocks?: ResolverMap } = {},
  ) => {
    const { variables = {}, mocks = {} } = options
    const mainDefinition = getMainDefinition(mutation)
    const mutationWithTypename = addTypenameToDocument(mutation)

    if (
      mainDefinition.kind !== 'OperationDefinition' ||
      (mainDefinition.kind === 'OperationDefinition' &&
        mainDefinition.operation !== 'mutation')
    ) {
      throw new Error(
        'MockFactory: mockMutation only accepts mutation documents',
      )
    }

    const mockedSchema = this.mockSchema({ mocks })

    const result = executeOperation(
      mockedSchema,
      mutationWithTypename,
      variables,
    )

    if (!result.data) {
      throw new Error(
        `Unable to generate mock data for ${
          mainDefinition.name?.value
        } mutation. This could be a result of missing mock resolvers, incorrect mutation structure, or missing variables.
        
variables: ${JSON.stringify(variables, null, 2)}

${print(mutation)}`,
      )
    }

    return { ...result.data } as TData
  }
}

export default MockFactory
