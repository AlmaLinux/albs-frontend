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
    releaseFeedQuery: (state, getters) => {
      return { pageNumber: state.pageNumber }
    }
  },
  namespaced: true
}
