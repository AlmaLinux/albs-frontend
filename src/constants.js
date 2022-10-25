const BuildStatus = {
  IDLE: 0,
  STARTED: 1,
  COMPLETED: 2,
  FAILED: 3,
  EXCLUDED: 4,
  TEST_CREATED: 5,
  TEST_STARTED: 6,
  TEST_COMPLETED: 7,
  TEST_FAILED: 8,
  ALL_TESTS_FAILED: 9,
  text: {
    0: 'idle',
    1: 'build started',
    2: 'build done',
    3: 'build failed',
    4: 'excluded',
    5: 'tests created',
    6: 'tests started',
    7: 'tests completed',
    8: 'some tests failed',
    9: 'all tests failed'
  },
  color: {
    0: 'faded',
    1: 'primary',
    2: 'primary',
    3: 'negative',
    4: 'dark',
    5: 'primary',
    6: 'primary',
    7: 'positive',
    8: 'warning',
    9: 'negative'
  }
}

const BuildTaskRefType = {
  GIT_BRANCH: 1,
  GIT_TAG: 2,
  SRPM_URL: 3,
  GIT_REF: 4,
  text: {
    1: 'git_branch',
    2: 'git_tag',
    3: 'srpm_url',
    4: 'git_ref'
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
    3: 'tests completed',
    4: 'tests failed'
  },
  color: {
    1: 'faded',
    2: 'faded',
    3: 'positive',
    4: 'negative'
  }
}

const TestTapStatus = {
  FAILED: 1,
  DONE: 2,
  TODO: 3,
  SKIPPED: 4,
  text: {
    1: 'failed',
    2: 'done',
    3: 'todo',
    4: 'skipped'
  },
  color: {
    1: 'negative',
    2: 'green',
    3: 'primary',
    4: 'warning'
  }
}

const SignStatus = {
  QUEUED: 1,
  STARTED: 2,
  DONE: 3,
  FAILED: 4,
  text: {
    1: 'queued for sign',
    2: 'being signed',
    3: 'signed',
    4: 'failed to be signed'
  }
}

const ReleaseStatus = {
  SCHEDULED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  FAILED: 4,
  text: {
    1: 'release scheduled',
    2: 'release in progress',
    3: 'release completed',
    4: 'release failed'
  },
  color: {
    1: 'faded',
    2: 'faded',
    3: 'primary',
    4: 'negative'
  }
}

const ErrataReleaseStatus = {
  NOT_RELEASED: 'not released',
  IN_PROGRESS: 'in progress',
  RELEASED: 'released',
  FAILED: 'failed',
  text: {
    NOT_RELEASED: 'not released',
    IN_PROGRESS: 'in progress',
    RELEASED: 'released',
    FAILED: 'failed'
  },
  color: {
    NOT_RELEASED: 'faded',
    IN_PROGRESS: 'faded',
    RELEASED: 'primary',
    FAILED: 'negative'
  }
}

export {
  BuildStatus,
  BuildTaskRefType,
  TestStatus,
  TestTapStatus,
  SignStatus,
  ReleaseStatus,
  ErrataReleaseStatus,
}
