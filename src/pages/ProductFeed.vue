<template>
  <q-page class="q-px-xl q-pt-md">
    <q-toolbar class="bg-primary text-white shadow-2">
        <q-toolbar-title>Products</q-toolbar-title>
        <q-input dark dense standout
               v-model="search"
               clearable
               class="q-ml-md q-bg-primary"
               @keydown.enter.prevent="searchProducts()">
            <template v-slot:append>
                <q-icon name="search" class="cursor-pointer" @click="searchProducts()"/>
            </template>
        </q-input>
    </q-toolbar>
    <template v-if="products.length !== 0">
        <q-list  separator>
            <q-item v-for="(product, index) in products" :key="product.id"
                    clickable :class="index % 2 == 0 ? 'bg-grey-2' : null"
                    @click="onProductDetail(product.id)">
                <q-item-section class="col-6">
                    <q-item-label overline>
                        <span class="text-weight-bold">
                            {{ product.name }}
                        </span>
                    </q-item-label>
                    <q-item-label>{{ product.title }}</q-item-label>
                    <q-item-label caption style="width: 90%">
                        <span>
                            {{ product.description ? descriptionText(product.description)  : 'No description'  }}
                            <q-tooltip v-if="product.description"
                                    :delay="500"
                                    :style="product.description.length >= 200 ? 'width: 25%' : 'max-width: 25%'">
                                {{ product.description }}
                            </q-tooltip>
                        </span> 
                    </q-item-label>
                </q-item-section>
                
                <q-item-section class="text-center">
                    <q-item-label caption>Supported platforms:</q-item-label>
                    <q-item-label v-for="platform in product.platforms" :key="platform.id">
                        {{ platform.name }}
                    </q-item-label>
                </q-item-section>

                <q-item-section class="text-center col-2">
                    <q-item-label caption>Build count:</q-item-label>
                    <q-item-label>{{ product.builds.length }}</q-item-label>
                </q-item-section>

                <q-item-section side top class="text-left col-2">
                    <q-item-label caption>Created by
                        <span class="text-weight-bold">{{ product.owner.username }}</span>
                    </q-item-label>
                </q-item-section>
            </q-item>
        </q-list>
        <div class="q-pa-lg flex flex-center">
        <q-pagination input :max="totalPages" v-model="currentPage" :disable="loading"/>
        </div>
    </template>
    <div v-else class="q-pt-md full-width row flex-center q-gutter-sm">
          <q-icon size="2em" name="warning" color="warning"/>
          <span>
            No data available
          </span>
    </div>
  </q-page>
</template>

<script>
import { Loading } from 'quasar';
import { defineComponent, ref } from 'vue'

const maxLengthDescription = 200;

export default defineComponent({
    data() {
        return {
            loading: false,
            products: [],
            totalPages: ref(1),
            search: ''
        }
    },
    created () {
        this.loadFeedPage()
    },
    computed: {
        productsPageNumber () {
            return this.$store.getters['products/productsPageNumber']
        },
        currentPage: {
            get () { return this.$store.state.products.pageNumber },
            set (value) {
                this.$store.commit('products/setPageNumber', value)
                this.loadFeedPage()
            }
        }
    },
    methods: {
        searchProducts () {
            this.currentPage = 1
        },
        loadFeedPage () {
            Loading.show()
            let query = {
                search_string: this.search,
                pageNumber: this.productsPageNumber
            }
            this.$api.get(`/products/`, { params: query })
                .then(response => {
                    Loading.hide()
                    this.loading = false
                    this.products = response.data.products
                    this.totalPages = Math.ceil(response.data['total_products'] / 10)
                })
                .catch(error => {
                    Loading.hide()
                    Notify.create({
                        message: `${error.response.status}: ${error.response.statusText}`,
                        type: 'negative',
                        actions: [
                            { label: 'Dismiss', color: 'white', handler: () => {} }
                        ]
                    })
                })
        },
        onProductDetail(productId){
            this.$router.push(`/product/${productId}`)
        },
        descriptionText (description) { 
            return description && description.length >= maxLengthDescription ? description.slice(0, 197) + "..." : description 
        },
    }
})
</script>
