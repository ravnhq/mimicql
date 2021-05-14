import { buildASTSchema, introspectionFromSchema } from "graphql"
import gql from "graphql-tag"
import MockFactory from "./mock-factory"

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

test("can mock a fragment that contains variables", () => {
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

  const variables = { patchSize: "SMALL" }
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

describe("addTypename", () => {
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

  test("globally defaults to true", () => {
    const defaultMocker = new MockFactory(jsonSchema)

    const {
      fragmentTypename,
      queryTypename,
      mutationTypename,
    } = mockedDataTypenames(defaultMocker)

    expect(fragmentTypename).toBe("Rocket")
    expect(queryTypename).toBe("User")
    expect(mutationTypename).toBe("TripUpdateResponse")
  })

  test("globally override to true", () => {
    const mockerWithTypenameExplicit = new MockFactory(jsonSchema, {
      addTypename: true,
    })

    const {
      fragmentTypename,
      queryTypename,
      mutationTypename,
    } = mockedDataTypenames(mockerWithTypenameExplicit)

    expect(fragmentTypename).toBe("Rocket")
    expect(queryTypename).toBe("User")
    expect(mutationTypename).toBe("TripUpdateResponse")
  })

  test("globally override to false", () => {
    const mockerWithoutTypenameExplicit = new MockFactory(jsonSchema, {
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
