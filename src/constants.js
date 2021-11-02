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

const TestStatus = {
  CREATED: 1,
  STARTED: 2,
  COMPLETED: 3,
  FAILED: 4,
  text: {
    1: 'tests created',
    2: 'tests started',
    2: 'tests completed',
    3: 'tests failed'
  },
  color: {
    1: 'faded',
    2: 'faded',
    3: 'light-blue-9',
    4: 'negative'
  }
}

export { BuildStatus, TestStatus }
