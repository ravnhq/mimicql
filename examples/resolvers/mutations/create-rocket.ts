const createRocket = (_parent, args) => {
  const { rocket } = args
  return {
    name: rocket.name,
    type: rocket.type,
  }
}

export { createRocket }
