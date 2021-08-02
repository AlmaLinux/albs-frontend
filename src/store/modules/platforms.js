import { api } from 'boot/api'

export const PlatformsModule = {
  state: () => ({
    platforms: []
  }),
  mutations: {
    updatePlatformList (state, platforms) {
      state.platforms.splice(0, state.platforms.length)
      for (const platform of platforms) {
        state.platforms.push(platform)
      }
    }
  },
  getters: {
  },
  actions: {
    loadPlatformList ({ commit, state }) {
    return api.get('/platforms/')
      .then(response => {
        commit('updatePlatformList', response.data)
      })
      .catch(error => {})
    }
  },
  namespaced: true
}
