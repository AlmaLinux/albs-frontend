import { api } from 'boot/api'

export const TeamsModule = {
  state: () => ({
    teams: [],
    pageNumber: 1
  }),
  mutations: {
    updateTeamsList (state, teams) {
      state.teams.splice(0, state.teams.length)
      for (const team of teams) {
        state.teams.push(team)
      }
    },
    setPageNumber (state, pageNumber) {
      state.pageNumber = pageNumber
    }
  },
  getters: {
    teamsPageNumber: (state, getters) => {
      return state.pageNumber
    }
  },
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
