<p align="center">
    <img width="200" src="./assets/logo.png">
</p>

<h1 align="center">MimicQL</h1>

<div align="center">

Mimic your graphql API by quickly and easily generating mock graphql data in the
browser and node.js

[![CI status][circle-ci-image]][circle-ci-url] [![codecov][codecov-image]][codecov-url] ![semantic-release][semantic-release-image] [![NPM version][npm-image]][npm-url] [![NPM downloads][download-image]][download-url]

[circle-ci-image]: https://circleci.com/gh/ravnhq/mimicql.svg?style=shield
[circle-ci-url]: https://github.com/ravnhq/mimicql/actions/workflows/validate.yml?query=branch%3Amaster
[codecov-image]: https://img.shields.io/codecov/c/github/ravnhq/mimicql/master.svg?style=flat
[codecov-url]: https://codecov.io/gh/ravnhq/mimicql/branch/master
[semantic-release-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[npm-image]: https://img.shields.io/npm/v/mimicql?style=flat
[npm-url]: http://npmjs.org/package/mimicql
[download-image]: https://img.shields.io/npm/dw/mimicql?style=flat
[download-url]: https://npmjs.org/package/mimicql

</div>

## The problem

You want to write maintainable tests in a codebase that interacts with a graphql
API and you need mock data. You need mocked data to match the structure of your
document which can be a pain given the dynamic and nested nature of graphql
queries. You want to have sensible data generated for you by default and the
ability to customize on a case by case basis.

## The solution

`MimicQL` is a small but robust solution for generating mocked graphql data. It
provides functions for generating mock data that will match your query,
mutation, and fragment definition structures. It gives you the ability to define
the way your graphql schema should resolve and execute queries, mutations, AND
fragments against it.

## Getting Started

### Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `devDependencies`:

```
npm install --save-dev mimicQL
```

or

for installation via [yarn][yarn]

```
yarn add --dev mimicQL
```

### Create Mocker

First create a file where your mocker instance will live. To initialize your
mocker you need to pass a JSON schema into the mock factory generator exposed
from mimicQL.

```js
// mocker.js
import MockFactory from "mimicQL"
import schemaJson from "path/to/schema.json"

export default new MockFactory(schemaJson)
```

At this point you can generate mock data but without supplying default mock
resolvers but your data will consist of only default values for each type. You
will more than likely want to have some sensible defaults.

### Create Default Mock Resolvers

To do that we'll want to define mock resolvers. The documentation on what
constitutes a mock resolver can be found
[here](https://www.graphql-tools.com/docs/resolvers).

```js
// resolvers/Rocket.js
import faker from "faker"

const MockRocket = () => {
  return {
    id: () => `rocket-${faker.random.uuid()}`,
    name: () => `rocket-${faker.random.word()}`,
    type: () => `rocket-${faker.random.word()}`,
  }
}

export default MockRocket
```

Generally you only want to define values for the shallow properties on an
object. You'll leave value definition for nested types to the resolver in charge
of that type. For example if a `Launch` has a `rocket: Rocket` field you should
leave the definition for `rocket` to the `Rocket` resolver.

### Setup Mock Server

Head back to the mocker and add the new mock `Rocket` resolver so it can use it
for its defaults.

```js
// mocker.js
import MockFactory from 'mimicQL'
import schemaJson from 'path/to/schema.json'
import Rocket from './resolvers/Rocket'

export default new MockFactory(
  schemaJson,
  { mocks: { Rocket }
)
```

### Execute Query

Now with a valid graphql document we can generate some sensible mock data.

```ts
import gql from "graphql-tag"
import mocker from "./mocker"

const query = gql`
  query Rockets($id: ID!) {
    rockets {
      id
      name
      type
    }
  }
`

const mockedRocketsQuery = mocker.mockQuery(query)
/**
 * [
 *   {
 *     id: 'rocket-<uuid>',
 *     name: 'rocket-<word>',
 *     type: 'rocket-<word>',
 *     __typename: 'Rocket'
 *   },
 *   {
 *     id: 'rocket-<uuid>',
 *     name: 'rocket-<word>',
 *     type: 'rocket-<word>',
 *     __typename: 'Rocket'
 *   },
 * ]
 */
```

### Using variables

## Recipes & Examples

TODO

[npm]: https://www.npmjs.com/
[yarn]: https://classic.yarnpkg.com
[node]: https://nodejs.org
