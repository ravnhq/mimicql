# Mock GraphQL Data Generator

Takes a valid GraphQL Schema + Data Resolvers and generates valid query and mutation responses

## Usage

### Define Resolvers

```ts
// resolvers/Rocket.ts

import { MockResolvedValue, ShallowProperties } from 'mgdg'
import { Rocket } from '../../api'
import faker from 'faker'

const MockRocket = (
  _parent,
  args,
): MockResolvedValue<ShallowProperties<Rocket>> => {
  return {
    id: () => faker.random.uuid(),
    name: () => faker.random.word(),
    type: () => faker.random.word(),
  }
}

export default MockRocket
```

### Setup Mock Server

```ts
// mocker.ts

import MockFactory from 'mgdg'

// Valid GraphQL Schema
import schemaJson from './schema'

import Rocket from './resolvers/Rocket'

export default new MockFactory(
  schemaJson as any,
  { mocks: { Rocket }
)
```

### Execute Query

```ts
import gql from 'graphql-tag'

import mocker from './mocker'

const query = gql`
  query Rocket($id: ID!) {
    rocket(id: $id) {
      id
      name
      type
    }
  }
`

const rocketResults = mocker.mockQuery(query, { variables: { id: 'rocket-1' } })

console.log(rocketResults)
```
