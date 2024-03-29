import { 
  LocalStorage,
  Notify,
} from 'quasar'
import { api } from 'boot/api'


export const UsersModule = {
  state: () => ({
    self: LocalStorage.getItem('user'),
    users: [],
    isAdmin: LocalStorage.getItem('isAdmin')
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
    updateIsAdmin (state, isAdmin) {
      state.isAdmin = isAdmin
      LocalStorage.set('isAdmin', isAdmin)
    },
    onLogout (state) {
      LocalStorage.remove('user')
      LocalStorage.remove('isAdmin')
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
          return response.data
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
    },
    async setIsAdmin ({ dispatch, commit, state }) {
      if (state.self != null) {
        let users = await dispatch('loadUsersList')
        let currentUser = users.find(u => u.id == state.self.user_id)
        // ALBS-653: Ensure isAdmin is either false or true
        // If for whatever reason, is_superuser is undefined,
        // we must return false. Because if we pass undefined to
        // updateIsAdmin, the string 'undefined' is stored as the
        // value of isAdmin in localStorage, which evaluates to true
        let isAdmin = currentUser.is_superuser !== undefined?
          currentUser.is_superuser:
          false
        commit('updateIsAdmin', isAdmin)
        return isAdmin
      }
    }
  },
  namespaced: true
}
