<template>
  <q-page class="q-px-xl q-pt-md">
      <div >
        <q-markup-table>
            <thead>
                <tr>
                    <th class="text-left">Name</th>
                    <th class="text-center">Builds</th>
                    <th class="text-left">Repositories</th>
                    <th class="text-left">Owner</th>
                    <th/>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(product, index) in products" :key="product.id" :class="index % 2 == 0 ? 'bg-grey-2' : null">
                    <td class="text-left">
                        {{ product.name }}
                    </td>
                    <td class="text-center">
                        {{ product.builds.length }}
                    </td>
                    <td class="text-left">
                        <template v-for="repo in product.repositories" :key="repo.id">
                            <a :href="repo.url" target="_blank"> {{repo.name}} </a>
                            <br/>
                        </template>
                    </td>
                    <td class="text-left">
                        <a :href="`mailto:${product.owner.email}`">{{ product.owner.username }}</a>
                    </td>
                    <td class="text-right">
                        <q-btn class="gt-xs" flat dense round icon="info" />
                    </td>
                </tr>
            </tbody>
        </q-markup-table>
    </div>
    <div class="q-pa-lg flex flex-center">
      <q-pagination input :max="totalPages" v-model="currentPage" :disable="loading"/>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
    data() {
        return {
            loading: false,
            products: [],
            totalPages: ref(1),
        }
    },
    created () {
        this.loadFeedPage()
    },
    computed: {
        productsFeedQuery () {
            return this.$store.getters['products/productsFeedQuery']
        },
        currentPage: {
            get () { return this.$store.state.products.pageNumber },
            set (value) {
                this.loading = true
                this.$store.commit('products/setPageNumber', value)
                this.loadFeedPage()
            }
        }
    },
    methods: {
        loadFeedPage () {
            this.loading = true
            console.log(this.productsFeedQuery)
            this.$api.get(`/products/`, {params: this.productsFeedQuery})
                .then(response => {
                    this.loading = false
                    this.products = response.data.products
                    this.totalPages = Math.ceil(response.data['total_products'] / 10)
                })
            .catch(error => {
                this.loading = false
                // TODO: add error here
            })
        },
    }
})
</script>
