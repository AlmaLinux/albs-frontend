export const BuildsFeedModule = {
  state: () => ({
    pageNumber: 1
  }),
  mutations: {
    setPageNumber (state, pageNumber) {
      state.pageNumber = pageNumber
    }
  },
  getters: {
    buildFeedQuery: (state, getters) => {
      return { pageNumber: state.pageNumber }
    }
  },
  namespaced: true
}
