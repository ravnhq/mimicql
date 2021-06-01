/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import gql from 'graphql-tag'
import MockFactory from '../src/MockFactory'
import { schema } from './schema'
import { defaultResolvers } from './resolvers'

const mocker = new MockFactory(schema, { mocks: defaultResolvers })

const query = gql`
  query Rockets {
    rockets {
      id
      name
      type
    }
  }
`

const mockRocketsQuery = mocker.mockQuery(query)

// {
//   rockets: [
//     {
//       id: 'rocket-<uuid>',
//       name: '<rocket-name>',
//       type: '<rocket-type>',
//       __typename: 'Rocket'
//     }
//     {
//       id: 'rocket-<uuid>',
//       name: '<rocket-name>',
//       type: '<rocket-type>',
//       __typename: 'Rocket'
//     }
//   ]
// }
