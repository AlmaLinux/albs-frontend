// Unit tests for src/apiErrors.js
// test runner: npm test
import {describe, test} from 'node:test'
import assert from 'node:assert/strict'
import axios, {AxiosError, CanceledError} from 'axios'

import {makeResponseErrorHandler, noResponseMessage} from '../src/apiErrors.js'

// An axios instance wired like the one of src/boot/api.js, whose
// adapter fails every request with the error made by `fail`.
function setup(fail) {
  const calls = {notify: [], unauthorized: 0}
  const api = axios.create({
    baseURL: '/api/v1',
    adapter: (config) => Promise.reject(fail(config)),
  })
  api.interceptors.response.use(
    (response) => response,
    makeResponseErrorHandler({
      notify: (message) => calls.notify.push(message),
      onUnauthorized: () => calls.unauthorized++,
    })
  )
  return {api, calls}
}

function httpError(status, config) {
  const response = {status, statusText: '', data: {detail: 'x'}, headers: {}}
  return new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_REQUEST,
    config,
    {},
    {...response, config}
  )
}

// Run a request that must fail and return the error it rejects with.
async function rejection(api) {
  try {
    await api.get('/builds/')
  } catch (error) {
    return error
  }
  assert.fail('the request did not fail')
}

describe('requests without a response', () => {
  test('a network error notifies and rejects with the same error', async () => {
    let thrown
    const {api, calls} = setup((config) => {
      thrown = new AxiosError('Network Error', 'ERR_NETWORK', config, {})
      return thrown
    })
    const error = await rejection(api)
    assert.equal(error, thrown)
    assert.deepEqual(calls.notify, [
      'Cannot reach the server. Check your connection and try again.',
    ])
    assert.equal(calls.unauthorized, 0)
  })

  test('a timeout notifies that the server did not answer', async () => {
    const {api, calls} = setup(
      (config) =>
        new AxiosError('timeout of 1000ms exceeded', 'ECONNABORTED', config)
    )
    await rejection(api)
    assert.deepEqual(calls.notify, [
      'The server did not answer in time. Please try again.',
    ])
  })

  test('a clarified timeout (ETIMEDOUT) is a timeout too', () => {
    assert.match(
      noResponseMessage({code: 'ETIMEDOUT', message: 'timeout exceeded'}),
      /did not answer in time/
    )
  })

  test('a cancelled request rejects without a notification', async () => {
    const {api, calls} = setup(() => new CanceledError())
    const error = await rejection(api)
    assert.ok(axios.isCancel(error))
    assert.deepEqual(calls.notify, [])
  })

  test('a request aborted by the browser is not reported', () => {
    assert.equal(
      noResponseMessage({code: 'ECONNABORTED', message: 'Request aborted'}),
      null
    )
  })

  test('other errors show their message', () => {
    assert.equal(
      noResponseMessage(new Error('Invalid URL')),
      'The request failed: Invalid URL'
    )
    assert.equal(noResponseMessage(undefined), 'The request failed.')
  })

  test('a non-axios error without a response does not throw', async () => {
    const handler = makeResponseErrorHandler({
      notify: () => {},
      onUnauthorized: () => {},
    })
    await assert.rejects(handler(undefined), (error) => error === undefined)
  })
})

describe('responses with an error status', () => {
  test('401 logs the user out without a notification', async () => {
    const {api, calls} = setup((config) => httpError(401, config))
    const error = await rejection(api)
    assert.equal(error.response.status, 401)
    assert.equal(calls.unauthorized, 1)
    assert.deepEqual(calls.notify, [])
  })

  test('403 notifies that access is denied', async () => {
    const {api, calls} = setup((config) => httpError(403, config))
    const error = await rejection(api)
    assert.equal(error.response.status, 403)
    assert.deepEqual(calls.notify, ['Access Denied'])
    assert.equal(calls.unauthorized, 0)
  })

  test('other statuses are left to the caller', async () => {
    for (const status of [400, 404, 422, 500, 502]) {
      const {api, calls} = setup((config) => httpError(status, config))
      const error = await rejection(api)
      assert.equal(error.response.status, status)
      assert.deepEqual(calls.notify, [])
      assert.equal(calls.unauthorized, 0)
    }
  })
})
