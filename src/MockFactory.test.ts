import gql from 'graphql-tag'
import { schema } from '../examples/schema'
import MockFactory from './MockFactory'

test('can mock a fragment that contains variables', () => {
  const mocker = new MockFactory(schema)
  const mockMap = {
    Mission: () => ({
      missionPatch: (_, missionPatchArgs) => {
        return missionPatchArgs.size
      },
    }),
  }
  const fragmentWithVariables = gql`
    query($patchSize: String!) {
      mock__Mission {
        ...MissionPatch
      }
    }

    fragment MissionPatch on Mission {
      missionPatch(size: $patchSize)
    }
  `

  const variables = { patchSize: 'SMALL' }
  const mockMissionPatch = mocker.mockQuery(fragmentWithVariables, {
    mocks: mockMap,
    variables,
    addTypename: false,
  })

  expect(mockMissionPatch).toMatchInlineSnapshot(`
    Object {
      "mock__Mission": Object {
        "missionPatch": "SMALL",
      },
    }
  `)
})

describe('addTypename', () => {
  const fragment = gql`
    fragment Rocket on Rocket {
      name
    }
  `
  const query = gql`
    query Me {
      me {
        id
      }
    }
  `
  const mutation = gql`
    mutation BookTrips {
      bookTrips(launchIds: ["1"]) {
        success
      }
    }
  `

  const mockedFragmentTypename = (mocker: MockFactory) =>
    mocker.mockFragment(fragment).__typename

  const mockedQueryTypename = (mocker: MockFactory) =>
    mocker.mockQuery(query).me.__typename

  const mockedMutationTypename = (mocker: MockFactory) =>
    mocker.mockMutation(mutation).bookTrips.__typename

  const mockedDataTypenames = (mocker: MockFactory) => {
    return {
      fragmentTypename: mockedFragmentTypename(mocker),
      queryTypename: mockedQueryTypename(mocker),
      mutationTypename: mockedMutationTypename(mocker),
    }
  }

  test('globally defaults to true', () => {
    const defaultMocker = new MockFactory(schema)

    const {
      fragmentTypename,
      queryTypename,
      mutationTypename,
    } = mockedDataTypenames(defaultMocker)

    expect(fragmentTypename).toBe('Rocket')
    expect(queryTypename).toBe('User')
    expect(mutationTypename).toBe('TripUpdateResponse')
  })

  test('globally override to true', () => {
    const mockerWithTypenameExplicit = new MockFactory(schema, {
      addTypename: true,
    })

    const {
      fragmentTypename,
      queryTypename,
      mutationTypename,
    } = mockedDataTypenames(mockerWithTypenameExplicit)

    expect(fragmentTypename).toBe('Rocket')
    expect(queryTypename).toBe('User')
    expect(mutationTypename).toBe('TripUpdateResponse')
  })

  test('globally override to false', () => {
    const mockerWithoutTypenameExplicit = new MockFactory(schema, {
      addTypename: false,
    })

    const {
      fragmentTypename,
      queryTypename,
      mutationTypename,
    } = mockedDataTypenames(mockerWithoutTypenameExplicit)

    expect(fragmentTypename).toBeUndefined()
    expect(queryTypename).toBeUndefined()
    expect(mutationTypename).toBeUndefined()
  })
})
