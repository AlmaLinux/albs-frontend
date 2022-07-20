import { api } from 'boot/api'

export const TeamsModule = {
  state: () => ({
    teams: []
  }),
  mutations: {
    updateTeamsList (state, teams) {
      state.teams.splice(0, state.teams.length)
      for (const team of teams) {
        state.teams.push(team)
      }
    }
  },
  getters: {},
  actions: {
    loadTeamsList ({ commit, state }) {
    return api.get('/teams/')
      .then(response => {
        commit('updateTeamsList', response.data)
      })
      .catch(error => {})
    }
  },
  namespaced: true
}
