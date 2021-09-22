import { api } from 'boot/api'

export const DistributionsModule = {
  state: () => ({
    distributions: []
  }),
  mutations: {
    updateDistributionsList (state, distributions) {
      state.distributions.splice(0, state.distributions.length)
      for (const distribution of distributions) {
        state.distributions.push(distribution)
      }
    }
  },
  getters: {},
  actions: {
    loadDistributionsList ({ commit, state }) {
    return api.get('/distro/')
      .then(response => {
        commit('updateDistributionsList', response.data)
      })
      .catch(error => {})
    }
  },
  namespaced: true
}
