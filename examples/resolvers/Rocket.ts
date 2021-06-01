const types = ['rocket', 'flying saucer']
const names = ['New Glenn', 'Vulcan Centaur', 'Neutron', 'Falcon 1']

const Rocket = () => ({
  id: () => `rocket-${Math.floor(Math.random() * 90000) + 10000}`,
  name: () => names[Math.floor(Math.random() * names.length)],
  type: () => types[Math.floor(Math.random() * types.length)],
})

export { Rocket }
