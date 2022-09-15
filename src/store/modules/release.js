export const ReleaseFeedModule = {
  state: () => ({
    pageNumber: 1
  }),
  mutations: {
    setPageNumber (state, pageNumber) {
      state.pageNumber = pageNumber
    }
  },
  getters: {
    releasePageNumber: (state, getters) => {
      return state.pageNumber
    }
  },
  namespaced: true
}
