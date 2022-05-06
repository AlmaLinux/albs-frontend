import store from '../store/index'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { 
        path: '',
        name: 'BuildFeed',
        component: () => import('pages/BuildFeed.vue'),
        beforeEnter (to, from, next) {
          store.dispatch('users/loadUsersList')
            .then(next())
            .catch(next())
          store.dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
        },
        children: [
          {
            path: '/search/:query',
            name: 'BuildFeedSearch',
            component: () => import('pages/BuildFeed.vue'),
            props: true
          }
        ]
      },
      { path: 'build/:buildId', component: () => import('pages/Build.vue'), props: true,
        beforeEnter (to, from, next) {
          if (store.getters.isAuthenticated) {
            store.dispatch('distributions/loadDistributionsList')
              .then(next())
              .catch(next())
            store.dispatch('keys/loadKeysList')
              .then(next())
              .catch(next())
          } else {
            next()
          }
        }
      },
      {
        path: 'build/create',
        component: () => import('pages/BuildPlanner.vue'),
        meta: { requiresAuth: true },
        beforeEnter (to, from, next) {
          store.dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
            store.dispatch('platform_flavors/loadFlavorsList')
            .then(next())
            .catch(next())
        }
      },
      {
        path: 'errata',
        component: () => import('pages/ErrataFeed.vue'),
        beforeEnter (to, from, next) {
          store.dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
        }
      },
      {
        path: 'release-feed',
        meta: { requiresAuth: true },
        component: () => import('pages/ReleaseFeed.vue')
      },
      {
        path: 'release/create',
        meta: { requiresAuth: true },
        component: () => import('pages/CreateRelease.vue'),
        beforeEnter (to, from, next) {
          store.dispatch('platforms/loadPlatformList')
          .then(next())
          .catch(next())
        }
      },
      { path: '/build/:buildId/logs/:taskId', component: () => import('pages/BuildItemInfo.vue'), props: true},
      {
        path: '/distro/new/',
        meta: { requiresAuth: true },
        component: () => import('pages/CreateDistro'),
        beforeEnter (to, from, next) {
          store.dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
          store.dispatch('distributions/loadDistributionsList')
            .then(next())
            .catch(next())
        }
      }
    ]
  },
  // TODO: make this children
  { path: '/auth/login', component: () => import('pages/Login.vue') },
  {
    path: '/auth/login/github',
    props: route => ({ code: route.query.code }),
    component: () => import('pages/Github.vue')
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
