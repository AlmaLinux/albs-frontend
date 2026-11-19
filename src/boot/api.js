import {boot} from 'quasar/wrappers'
import axios from 'axios'
import store from '../store/index'
import router from '../router/index'
import {LocalStorage, Notify} from 'quasar'
import {makeResponseErrorHandler} from '../apiErrors'

const api = axios.create({baseURL: '/api/v1'})

api.interceptors.request.use(
  (config) => {
    if (!config.headers['authorization']) {
      config.headers['authorization'] = `Bearer ${store.getters.accessToken}`
    }
    return config
  },
  null,
  {synchronous: true}
)

const notifyError = (message) => {
  Notify.create({
    message,
    type: 'negative',
    actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
  })
}

api.interceptors.response.use(
  (response) => {
    return response
  },
  makeResponseErrorHandler({
    notify: notifyError,
    onUnauthorized: () => {
      LocalStorage.set('redirectPath', router.currentRoute._value.href)
      store.commit('users/onLogout')
      router.push('/auth/login')
    },
  })
)

export default boot(({app}) => {
  app.config.globalProperties.$api = api
})

export {api}
