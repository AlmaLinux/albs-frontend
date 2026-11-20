// Unit tests of the superuser access helpers: npm test
import {describe, test} from 'node:test'
import assert from 'node:assert/strict'

import {enterAdminOnly, isLinkAllowed} from '../src/adminAccess.js'

describe('isLinkAllowed', () => {
  const adminLink = {title: 'Build nodes', adminOnly: true}

  test('shows an admin link to an authenticated superuser', () => {
    assert.equal(
      isLinkAllowed(adminLink, {isAuthenticated: true, isAdmin: true}),
      true
    )
  })

  test('hides an admin link from everybody else', () => {
    for (const access of [
      {isAuthenticated: true, isAdmin: false},
      {isAuthenticated: false, isAdmin: true},
      {isAuthenticated: false, isAdmin: false},
      // A missing or broken value in localStorage is not a superuser
      {isAuthenticated: true, isAdmin: null},
      {isAuthenticated: true, isAdmin: undefined},
      {isAuthenticated: true, isAdmin: 'undefined'},
    ]) {
      assert.equal(isLinkAllowed(adminLink, access), false, access)
    }
  })

  test('keeps the own allow of any other link', () => {
    const access = {isAuthenticated: true, isAdmin: true}
    assert.equal(isLinkAllowed({title: 'Feed', allow: true}, access), true)
    assert.equal(isLinkAllowed({title: 'Teams', allow: false}, access), false)
    assert.equal(
      isLinkAllowed(
        {title: 'Teams', allow: true},
        {isAuthenticated: true, isAdmin: false}
      ),
      true
    )
  })
})

// A store double: setIsAdmin answers with `isAdmin`, or fails
function fakeStore({isAdmin, fails = false}) {
  const store = {
    dispatched: [],
    getters: {isAdmin: 'stale'},
    dispatch(action) {
      store.dispatched.push(action)
      if (fails) return Promise.reject(new Error('users list failed'))
      store.getters.isAdmin = isAdmin
      return Promise.resolve(isAdmin)
    },
  }
  return store
}

// The argument enterAdminOnly passes to next()
function runGuard(store, redirectTo) {
  return new Promise((resolve) => enterAdminOnly(store, resolve, redirectTo))
}

describe('enterAdminOnly', () => {
  test('lets a superuser in after refreshing isAdmin', async () => {
    const store = fakeStore({isAdmin: true})
    assert.equal(await runGuard(store), undefined)
    assert.deepEqual(store.dispatched, ['users/setIsAdmin'])
  })

  test('sends a user who is not a superuser to the feed', async () => {
    const store = fakeStore({isAdmin: false})
    assert.equal(await runGuard(store), '/')
  })

  test('trusts the server, not a stale value in the store', async () => {
    // isAdmin was true in localStorage, the server says it is not
    const store = fakeStore({isAdmin: false})
    store.getters.isAdmin = true
    assert.equal(await runGuard(store), '/')
  })

  test('denies access when the check fails', async () => {
    const store = fakeStore({fails: true})
    assert.equal(await runGuard(store), '/')
  })

  test('denies access when setIsAdmin throws right away', async () => {
    const store = {
      getters: {isAdmin: true},
      dispatch() {
        throw new TypeError('no users list')
      },
    }
    assert.equal(await runGuard(store), '/')
  })

  test('redirects to the given path', async () => {
    const store = fakeStore({isAdmin: false})
    assert.equal(await runGuard(store, '/login'), '/login')
  })
})
