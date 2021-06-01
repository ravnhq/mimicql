import gql from "graphql-tag"
import MockFactory from "../src/mock-factory"
import { schema } from "./schema"
import { defaultResolvers } from "./resolvers"

const mocker = new MockFactory(schema, { mocks: defaultResolvers })

const mutation = gql`
  mutation CreateRocket($rocket: RocketInput) {
    createRocket(rocket: $rocket) {
      id
      name
      type
    }
  }
`

const createRocketResponse = mocker.mockMutation(mutation, {
  variables: { rocket: { name: "Falcon 1", type: "rocket" } },
})

console.log(createRocketResponse)

// {
//   createRocket: {
//     id: 'rocket-<uuid>',
//     name: 'Falcon 1',
//     type: 'rocket',
//     __typename: 'Rocket'
//   }
// }
