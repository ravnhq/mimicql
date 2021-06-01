import { Rocket } from './Rocket'
import { createRocket } from './mutations/create-rocket'

const defaultResolvers = {
  // Object
  Rocket,

  //Mutations
  Mutation: () => ({
    createRocket,
  }),
}

export { defaultResolvers }
