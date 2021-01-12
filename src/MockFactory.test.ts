import { buildASTSchema, introspectionFromSchema } from 'graphql'
import MockFactory from 'src/MockFactory'
import gql from 'graphql-tag'

const schema = gql`
  type Rocket {
    id: ID!
    name: String
    type: String
  }

  type Launch {
    id: ID!
    site: String
    mission: Mission
    rocket: Rocket
    isBooked: Boolean!
  }

  type TripsEdge {
    node: Launch
  }

  type TripsConnection {
    edges: [TripsEdge]
  }

  type User {
    id: ID!
    email: String!
    trips: [Launch]!
    tripsConnection: TripsConnection
  }

  enum PatchSize {
    SMALL
    LARGE
  }

  type Mission {
    name: String
    missionPatch(size: PatchSize!): String
  }

  type TripUpdateResponse {
    success: Boolean!
    message: String
    launches: [Launch]
  }

  type Query {
    rockets: [Rocket]!
    launches: [Launch]!
    launch(id: ID!): Launch
    me: User
  }

  type Mutation {
    bookTrips(launchIds: [ID]!): TripUpdateResponse!
    cancelTrip(launchId: ID!): TripUpdateResponse!
    login(email: String): String
  }
`

const jsonSchema = introspectionFromSchema(buildASTSchema(schema))

test('can mock a fragment that contains variables', () => {
  const mocker = new MockFactory(jsonSchema)
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

  test('can set addTypename globally for MockFactory', () => {
    // defaults to false
    const mockerWithoutTypename = new MockFactory(jsonSchema)

    expect(
      mockerWithoutTypename.mockFragment(fragment).__typename,
    ).toBeUndefined()
    expect(mockerWithoutTypename.mockQuery(query).me.__typename).toBeUndefined()
    expect(
      mockerWithoutTypename.mockMutation(mutation).bookTrips.__typename,
    ).toBeUndefined()

    const mockerWithTypename = new MockFactory(jsonSchema, {
      addTypename: true,
    })

    expect(mockerWithTypename.mockFragment(fragment).__typename).toBe('Rocket')
    expect(mockerWithTypename.mockQuery(query).me.__typename).toBe('User')
    expect(mockerWithTypename.mockMutation(mutation).bookTrips.__typename).toBe(
      'TripUpdateResponse',
    )
  })

  test('can override addTypename', () => {
    const mockerWithoutTypename = new MockFactory(jsonSchema)

    const options = {
      addTypename: true,
    }

    expect(
      mockerWithoutTypename.mockFragment(fragment, options).__typename,
    ).toBe('Rocket')
    expect(mockerWithoutTypename.mockQuery(query, options).me.__typename).toBe(
      'User',
    )
    expect(
      mockerWithoutTypename.mockMutation(mutation, options).bookTrips
        .__typename,
    ).toBe('TripUpdateResponse')
  })
})
