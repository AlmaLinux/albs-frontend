export const ErrataFeedModule = {
    state: () => ({
      pageNumber: 1
    }),
    mutations: {
      setPageNumber (state, pageNumber) {
        state.pageNumber = pageNumber
      }
    },
    getters: {
      errataPageNumber: (state, getters) => {
        return state.pageNumber
      }
    },
    namespaced: true
  }
  