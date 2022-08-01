import { 
  LocalStorage,
  Notify,
} from 'quasar'
import { api } from 'boot/api'


export const UsersModule = {
  state: () => ({
    self: LocalStorage.getItem('user'),
    users: []
  }),
  mutations: {
    updateSelf (state, self) {
      state.self = { ...self }
      LocalStorage.set('user', self)
    },
    updateUsersList (state, users) {
      state.users.splice(0, state.users.length)
      for (let user of users) {
        state.users.push(user)
      }
    },
    onLogout (state) {
      LocalStorage.remove('user')
      state.self = null
    }
  },
  getters: {
  },
  actions: {
    loadUsersList ({ commit, state }) {
      return api.get('/users/all_users')
        .then(response => {
          commit('updateUsersList', response.data)
        })
        .catch(error => {
          Notify.create({
            message: 'Cannot load users list',
            type: 'negative',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
        })
    }
  },
  namespaced: true
}
