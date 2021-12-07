import { isEqual } from 'lodash'

export const BuildsFeedModule = {
  state: () => ({
    filter: undefined,
    pageNumber: 1
  }),
  mutations: {
    setFilter (state, filter) {
      state.filter = filter
    },
    setPageNumber (state, pageNumber) {
      state.pageNumber = pageNumber
    }
  },
  getters: {
    buildFeedQuery: (state, getters, rootState) => {
      const query = { pageNumber: state.pageNumber }
      const filter = state.filter
      if (filter) {
        if (filter.authorId) { query.created_by = filter.authorId }
        if (filter.projectName) { query.project = filter.projectName }
        if (filter.buildRef) { query.ref = filter.buildRef }
        if (filter.rpmName) { query.rpm_name = filter.rpmName }
        if (filter.rpmEpoch) { query.rpm_epoch = filter.rpmEpoch }
        if (filter.rpmVersion) { query.rpm_version = filter.rpmVersion }
        if (filter.rpmRelease) { query.rpm_release = filter.rpmRelease }
        if (filter.rpmArch) { query.rpm_arch = filter.rpmArch }
        if (filter.released) { query.released = filter.released }
        if (filter.signed) { query.signed = filter.signed }
        if (filter.platformId) { query.platform_id = filter.platformId }
        if (filter.buildTaskArch) { query.build_task_arch = filter.buildTaskArch }
      }
      return query
    }
  },
  actions: {
    updateFilter ({ commit, state }, filter) {
      const changed = !isEqual(state.filter, filter)
      commit('setFilter', filter)
      if (changed) {
        commit('setPageNumber', 1)
      }
    }
  },
  namespaced: true
}
