const BuildStatus = {
  IDLE: 0,
  STARTED: 1,
  COMPLETED: 2,
  FAILED: 3,
  EXCLUDED: 4,
  CANCELLED: 5,
  TEST_CREATED: 6,
  TEST_STARTED: 7,
  TEST_COMPLETED: 8,
  TEST_FAILED: 9,
  ALL_TESTS_FAILED: 10,
  text: {
    0: 'idle',
    1: 'started',
    2: 'done',
    3: 'failed',
    4: 'excluded',
    5: 'cancelled',
    6: 'tests created',
    7: 'tests started',
    8: 'tests completed',
    9: 'some tests failed',
    10: 'all tests failed',
  },
  color: {
    0: 'faded',
    1: 'primary',
    2: 'primary',
    3: 'negative',
    4: 'dark',
    5: 'grey-7',
    6: 'primary',
    7: 'primary',
    8: 'positive',
    9: 'warning',
    10: 'negative',
  },
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
    4: 'git_ref',
  },
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
    4: 'tests failed',
  },
  color: {
    1: 'faded',
    2: 'faded',
    3: 'positive',
    4: 'negative',
  },
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
    4: 'skipped',
  },
  color: {
    1: 'negative',
    2: 'green',
    3: 'primary',
    4: 'warning',
  },
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
    4: 'failed to be signed',
  },
}

const ReleasePackageMatched = {
  EXACT: 'exact',
  CLOSEST: 'closest',
  NAME_VERSION: 'name_version',
  NAME_ONLY: 'name_only',
}

const ReleasePackageTrustness = {
  UNKNOWN_TRUSTNESS: 0,
  MAXIMUM: 1,
  MEDIUM: 2,
  LOWEST: 10,
  color: {
    0: 'grey',
    1: 'green',
    2: 'yellow',
    10: 'red',
  },
}

const ReleaseStatus = {
  SCHEDULED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  FAILED: 4,
  REVERTED: 5,
  text: {
    1: 'scheduled',
    2: 'in progress',
    3: 'completed',
    4: 'failed',
    5: 'reverted',
  },
  color: {
    1: 'grey',
    2: 'primary',
    3: 'green',
    4: 'negative',
    5: 'grey-7',
  },
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
    FAILED: 'failed',
  },
  color: {
    NOT_RELEASED: 'faded',
    IN_PROGRESS: 'faded',
    RELEASED: 'primary',
    FAILED: 'negative',
  },
}

export {
  BuildStatus,
  BuildTaskRefType,
  TestStatus,
  TestTapStatus,
  SignStatus,
  ReleaseStatus,
  ReleasePackageTrustness,
  ReleasePackageMatched,
  ErrataReleaseStatus,
}
