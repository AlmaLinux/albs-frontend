import { boot } from 'quasar/wrappers'
import axios from 'axios'
import store from '../store/index'
import router from '../router/index'
import { LocalStorage } from 'quasar'

const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use(config => {
  if (!config.headers['authorization']) {
    config.headers['authorization'] = `Bearer ${store.getters.accessToken}`;
  }
  return config;
}, null, { synchronous: true })

api.interceptors.response.use(response => {
  return response
}, error => {
  if (error.response.status === 403 || error.response.status === 401) {
    LocalStorage.set('redirectPath', router.currentRoute._value.href)
    store.commit('users/onLogout')
    router.push('/auth/login')
  }
  return Promise.reject(error);
});

export default boot(({ app }) => {
  app.config.globalProperties.$api = api
})

export { api }
