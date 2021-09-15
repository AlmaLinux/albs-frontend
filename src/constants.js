const BuildStatus = {
  IDLE: 0,
  EXCLUDED: 1,
  STARTED: 2,
  COMPLETED: 3,
  FAILED: 4,
  text: {
    0: 'idle',
    1: 'excluded',
    2: 'build started',
    3: 'build done',
    4: 'build failed'
  },
  color: {
    0: 'faded',
    1: 'faded',
    2: 'faded',
    3: 'light-blue-9',
    4: 'negative'
  }
}

export { BuildStatus }
