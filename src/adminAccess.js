// Access to the parts of the UI meant for superusers only: the
// "Administration" section and the build nodes pages.
//
// The flag comes from `is_superuser` of /users/all_users, which the
// `users/setIsAdmin` action stores as `isAdmin`. The server checks the
// rights again on every request, this only hides what a user cannot use.

// Whether the user may see a menu link. A link marked `adminOnly` is
// shown to superusers only; any other link keeps its own `allow`.
export function isLinkAllowed(link, {isAuthenticated, isAdmin}) {
  if (link.adminOnly) {
    return Boolean(isAuthenticated) && isAdmin === true
  }
  return Boolean(link.allow)
}

// Route guard for the superuser pages, to call from `beforeEnter`:
// refreshes `isAdmin` from the server, so a value tampered with in
// localStorage does not open the page, and sends everybody else to the
// build feed. A failed check denies access as well.
//
// The store is passed on every navigation rather than bound when the
// routes are defined: routes.js is evaluated inside the import cycle
// router -> routes -> store -> boot/api -> router, before the store
// exists.
export function enterAdminOnly(store, next, redirectTo = '/') {
  return Promise.resolve()
    .then(() => store.dispatch('users/setIsAdmin'))
    .then(() => {
      if (store.getters.isAdmin === true) {
        next()
      } else {
        next(redirectTo)
      }
    })
    .catch(() => next(redirectTo))
}
