import {api} from 'boot/api'

export const TestRepositoriesModule = {
  state: () => ({
    testRepositories: [],
    pageNumber: 1,
  }),
  mutations: {
    updateTestRepositoriesList(state, testRepositories) {
      state.testRepositories.splice(0, state.testRepositories.length)
      for (const team of testRepositories) {
        state.testRepositories.push(team)
      }
    },
    setPageNumber(state, pageNumber) {
      state.pageNumber = pageNumber
    },
  },
  getters: {
    testRepositoriesPageNumber: (state, getters) => {
      return state.pageNumber
    },
  },
  actions: {
    loadTestRepositoriesList({commit, state}) {
      return api
        .get('/testRepositories/')
        .then((response) => {
          commit('updateTestRepositoriesList', response.data)
        })
        .catch((error) => {})
    },
  },
  namespaced: true,
}
