import { api } from 'boot/api'

export const ProductsModule = {
  state: () => ({
    products: [],
    pageNumber: 1
  }),
  mutations: {
    updateProductList (state, products) {
      state.products.splice(0, state.products.length)
      for (const product of products) {
        state.products.push(product)
      }
    },
    setPageNumber (state, pageNumber) {
      state.pageNumber = pageNumber
    }
  },
  getters: {
    productsFeedQuery: (state, getters) => {
      return { pageNumber: state.pageNumber }
    }
  },
  actions: {
    loadProductList ({ commit, state }) {
    return api.get('/products/')
      .then(response => {
        commit('updateProductList', response.data)
      })
      .catch(error => {})
    }
  },
  namespaced: true
}
