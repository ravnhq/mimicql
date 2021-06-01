import gql from "graphql-tag"
import MockFactory from "../src/mock-factory"
import { schema } from "./schema"
import { defaultResolvers } from "./resolvers"

const mocker = new MockFactory(schema, { mocks: defaultResolvers })

const fragment = gql`
  fragment Rocket on Rocket {
    id
    name
    type
  }
`

const mockRocket = mocker.mockFragment(fragment)

console.log(mockRocket)

// {
//   id: 'rocket-<uuid>',
//   name: '<rocket-name>',
//   type: '<rocket-type>',
//   __typename: 'Rocket'
// }
