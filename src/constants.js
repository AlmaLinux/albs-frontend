const BuildStatus = {
  IDLE: 0,
  STARTED: 1,
  COMPLETED: 2,
  FAILED: 3,
  text: {
    0: 'idle',
    1: 'build started',
    2: 'build done',
    3: 'build failed'
  },
  color: {
    0: 'faded',
    1: 'faded',
    2: 'light-blue-9',
    3: 'negative'
  }
}

export { BuildStatus }
