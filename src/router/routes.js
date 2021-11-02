import store from '../store/index'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/BuildFeed.vue') },
      { path: 'build/:buildId', component: () => import('pages/Build.vue'), props: true,
        beforeEnter (to, from, next) {
          store.dispatch('distributions/loadDistributionsList')
            .then(next())
            .catch(next())
        }
      },
      {
        path: 'build/create',
        component: () => import('pages/BuildPlanner.vue'),
        beforeEnter (to, from, next) {
          store.dispatch('platforms/loadPlatformList')
            .then(next())
            .catch(next())
        }
      },
      { path: '/build/:buildId/logs/:taskId', component: () => import('pages/BuildLogs.vue'), props: true},
      { path: '/build/:buildId/test_logs/:taskId/:revision', component: () => import('pages/TestLogs.vue'), props: true},
      {
        path: '/distro/new/',
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
