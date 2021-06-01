/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const createRocket = (_parent, args) => {
  const { rocket } = args
  return {
    name: rocket.name,
    type: rocket.type,
  }
}

export { createRocket }
