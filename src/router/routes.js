import store from '../store/index'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    // is_superuser workaround
    // This is required to prevent showing the admin
    // section in the navbar if the user tampers with
    // localStorage
    beforeEnter(to, from, next) {
      if (store.getters.isAuthenticated) {
        store
          .dispatch('users/setIsAdmin')
          .then((isAdmin) => {
            store.commit('users/updateIsAdmin', isAdmin)
            next()
          })
          .catch(next())
      } else {
        next()
      }
    },
    children: [
      {
        path: '',
        name: 'BuildFeed',
        component: () => import('pages/BuildFeed.vue'),
        beforeEnter(to, from, next) {
          Promise.all([
            store.dispatch('users/loadUsersList'),
            store.dispatch('platforms/loadPlatformList'),
          ]).finally(next)
        },
        children: [
          {
            path: '/search',
            name: 'BuildFeedSearch',
            component: () => import('pages/BuildFeed.vue'),
          },
        ],
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('pages/AdminUsers.vue'),
        meta: {requiresAuth: true},
        // Guard direct navigation to users admin page
        beforeEnter(to, from, next) {
          store.dispatch('users/setIsAdmin').then((res) => {
            if (!store.getters.isAdmin) {
              // Maybe take the user to 404?
              next('/')
            } else {
              next()
            }
          })
        },
      },
      {
        path: 'build/:buildId',
        component: () => import('pages/Build.vue'),
        props: true,
        beforeEnter(to, from, next) {
          if (store.getters.isUserValid) {
            store
              .dispatch('products/loadProductList')
              .then(next())
              .catch(next())
            store.dispatch('keys/loadKeysList').then(next()).catch(next())
          } else {
            next()
          }
        },
      },
      {
        path: 'build/create',
        component: () => import('pages/BuildPlanner.vue'),
        meta: {requiresAuth: true},
        beforeEnter(to, from, next) {
          store
            .dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
          store
            .dispatch('platform_flavors/loadFlavorsList')
            .then(next())
            .catch(next())
          store.dispatch('products/loadProductList').then(next()).catch(next())
          store
            .dispatch('testRepositories/loadTestRepositoriesList')
            .then(next())
            .catch(next())
        },
      },
      {
        path: 'errata',
        component: () => import('pages/ErrataFeed.vue'),
        beforeEnter(to, from, next) {
          store.dispatch('platforms/loadPlatformList').then(next)
        },
      },
      {
        path: 'errata/create',
        name: 'CreateErrata',
        component: () => import('pages/CreateErrata.vue'),
        beforeEnter(to, from, next) {
          store
            .dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
        },
      },
      {
        path: 'errata/:id',
        component: () => import('pages/ErrataFeed.vue'),
        props: true,
        beforeEnter(to, from, next) {
          store
            .dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
          store.dispatch('users/loadUsersList').then(next()).catch(next())
        },
      },
      {
        path: 'errata/release',
        name: 'ErrataRelease',
        meta: {requiresAuth: true},
        component: () => import('pages/ErrataRelease.vue'),
      },
      {
        path: 'release-feed',
        component: () => import('pages/ReleaseFeed.vue'),
        beforeEnter(to, from, next) {
          store
            .dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
          store.dispatch('products/loadProductList').then(next()).catch(next())
        },
      },
      {
        path: '/release/:releaseId',
        component: () => import('pages/ReleaseDetails.vue'),
        props: true,
      },
      {
        path: '/release/:releaseId/update',
        meta: {requiresAuth: true},
        component: () => import('pages/CreateRelease.vue'),
        props: true,
      },
      {
        path: 'release/create',
        meta: {requiresAuth: true},
        component: () => import('pages/CreateRelease.vue'),
        beforeEnter(to, from, next) {
          store
            .dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
          store.dispatch('products/loadProductList').then(next()).catch(next())
        },
      },
      {
        path: '/build/:buildId/logs/:taskId',
        component: () => import('pages/BuildItemInfo.vue'),
        props: true,
      },
      {
        path: 'product-feed',
        component: () => import('pages/ProductFeed'),
      },
      {
        path: '/product/:productId',
        component: () => import('pages/ProductDetails.vue'),
        props: true,
        beforeEnter(to, from, next) {
          store
            .dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
        },
      },
      {
        path: '/product/new/',
        meta: {requiresAuth: true},
        component: () => import('pages/CreateProduct.vue'),
        beforeEnter(to, from, next) {
          store
            .dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
        },
      },
      {
        path: 'team-feed',
        meta: {requiresAuth: true},
        component: () => import('pages/TeamFeed'),
      },
      {
        path: '/teams/:teamId',
        component: () => import('pages/TeamInfo.vue'),
        props: true,
        beforeEnter(to, from, next) {
          store.dispatch('users/loadUsersList').then(next()).catch(next())
        },
      },
      {
        path: 'test-repositories-feed',
        name: 'TestRepositoriesFeed',
        meta: {requiresAuth: true},
        component: () => import('pages/TestRepositoryFeed'),
      },
      {
        path: 'test-repositories/:testRepoId',
        name: 'TestRepository',
        meta: {requiresAuth: true},
        props: true,
        component: () => import('pages/TestRepositoryConfigurator'),
      },
      {
        path: '/documentation/:chapter/:article/',
        component: () => import('pages/DocumentationViewer.vue'),
        props: true,
      },
    ],
  },
  // TODO: make this children
  {path: '/auth/login', component: () => import('pages/Login.vue')},
  {
    path: '/auth/login/finished',
    props: (route) => ({code: route.query.code}),
    component: () => import('pages/LoginFinished.vue'),
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
]

export default routes
