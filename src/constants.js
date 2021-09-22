const BuildStatus = {
  IDLE: 0,
  STARTED: 1,
  COMPLETED: 2,
  FAILED: 3,
  EXCLUDED: 4,
  text: {
    0: 'idle',
    1: 'build started',
    2: 'build done',
    3: 'build failed',
    4: 'excluded'
  },
  color: {
    0: 'faded',
    1: 'faded',
    2: 'light-blue-9',
    3: 'negative',
    4: 'dark'
  }
}

export { BuildStatus }
