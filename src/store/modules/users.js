import { LocalStorage } from 'quasar'
import router from '../../router/index'


export const UsersModule = {
  state: () => ({
    self: LocalStorage.getItem('user')
  }),
  mutations: {
    updateSelf (state, self) {
      state.self = { ...self }
      LocalStorage.set('user', self)
    },
    onLogout (state) {
      LocalStorage.remove('user')
      state.self = null
      router.push('/auth/login')
    }
  },
  getters: {
  },
  actions: {
  },
  namespaced: true
}
