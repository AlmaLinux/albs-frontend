import { api } from 'boot/api'

export const KeysModule = {
  state: () => ({
    keys: []
  }),
  mutations: {
    updateKeysList (state, keys) {
      state.keys.splice(0, state.keys.length)
      for (const key of keys) {
        state.keys.push(key)
      }
    }
  },
  getters: {},
  actions: {
    loadKeysList ({ commit, state }) {
    return api.get('/sign-keys/')
        .then(response => {
          commit('updateKeysList', response.data)
        })
        .catch(error => {})
    }
  },
  namespaced: true
}
