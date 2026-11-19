// Handling of failed API requests for the axios instance of
// src/boot/api.js. It takes Quasar, the store and the router as
// callbacks, so that the unit tests in test/ can load it without them.

// Message for a request that got no HTTP response at all, or null when
// the user should not be told about it: the request was cancelled on
// purpose, or the browser aborted it, e.g. when leaving the page.
export function noResponseMessage(error) {
  const code = error && error.code
  const text = (error && error.message) || ''
  if (code === 'ERR_CANCELED') {
    return null
  }
  if (
    code === 'ETIMEDOUT' ||
    (code === 'ECONNABORTED' && /timeout/i.test(text))
  ) {
    return 'The server did not answer in time. Please try again.'
  }
  if (code === 'ECONNABORTED') {
    return null
  }
  if (code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check your connection and try again.'
  }
  return text ? `The request failed: ${text}` : 'The request failed.'
}

// Rejection handler for api.interceptors.response.use(). It always
// rejects with the original error, so that callers can handle it too.
export function makeResponseErrorHandler({notify, onUnauthorized}) {
  return (error) => {
    const response = error && error.response
    if (!response) {
      const message = noResponseMessage(error)
      if (message) {
        notify(message)
      }
    } else if (response.status === 401) {
      onUnauthorized()
    } else if (response.status === 403) {
      notify('Access Denied')
    }
    return Promise.reject(error)
  }
}
