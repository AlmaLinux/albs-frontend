import { api } from 'boot/api'

export const PlatformFlavorsModule = {
  state: () => ({
    flavors: []
  }),
  mutations: {
    updateFlavorsList (state, flavors) {
      state.flavors.splice(0, state.flavors.length)
      for (const flavor of flavors) {
        state.flavors.push(flavor)
      }
    }
  },
  getters: {
  },
  actions: {
    loadFlavorsList ({ commit, state }) {
    return api.get('/platform_flavors/')
      .then(response => {
        commit('updateFlavorsList', response.data)
      })
      .catch(error => {})
    }
  },
  namespaced: true
}
