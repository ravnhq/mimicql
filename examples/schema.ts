import gql from 'graphql-tag'
import { buildASTSchema, introspectionFromSchema } from 'graphql'

const schemaDoc = gql`
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

  input RocketInput {
    name: String
    type: String
  }

  type Mutation {
    createRocket(rocket: RocketInput!): Rocket
    bookTrips(launchIds: [ID]!): TripUpdateResponse!
    cancelTrip(launchId: ID!): TripUpdateResponse!
    login(email: String): String
  }
`

const schema = introspectionFromSchema(buildASTSchema(schemaDoc))

export { schema }
