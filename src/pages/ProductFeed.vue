<template>
  <div class="row justify-center">
    <q-page class="q-px-xl q-pt-md" style="width: 90%">
      <q-toolbar class="shadow-4 q-py-md">
        <q-toolbar-title>Products</q-toolbar-title>
        <q-input
          debounce="500"
          dense
          rounded
          standout="bg-grey-4"
          v-model="search"
          input-class="text-black"
          class="q-ml-md"
          ref="searchField"
          text-color="black"
        >
          <template v-slot:after>
            <div class="q-gutter-sm">
              <q-icon
                v-if="search !== ''"
                name="close"
                color="grey"
                @click="search = ''"
                class="cursor-pointer clr-btn"
              >
                <q-tooltip> Click to clear </q-tooltip>
              </q-icon>
              <q-btn
                round
                unelevated
                icon="search"
                color="primary"
                @click="focusSearch()"
              />
            </div>
          </template>
        </q-input>
      </q-toolbar>
      <template v-if="products.length !== 0">
        <q-list separator class="shadow-1">
          <q-item
            v-for="(product, index) in products"
            :key="product.id"
            clickable
            :class="index % 2 === 0 ? 'bg-grey-2' : 'shadow-1'"
            @click="onProductDetail(product.id)"
          >
            <q-item-section class="col-6">
              <q-item-label overline class="text-dark" style="display: flex">
                <span>
                  {{ product.owner.username }}
                </span>
                <span class="text-weight-bold"> /{{ product.name }} </span>
              </q-item-label>
              <q-item-label>{{ product.title }}</q-item-label>
              <q-item-label caption style="width: 90%">
                <span>
                  {{
                    product.description
                      ? descriptionText(product.description)
                      : "No description"
                  }}
                  <q-tooltip
                    v-if="product.description"
                    :delay="500"
                    :style="
                      product.description.length >= 200
                        ? 'width: 35%'
                        : 'max-width: 35%'
                    "
                  >
                    {{ product.description }}
                  </q-tooltip>
                </span>
              </q-item-label>
            </q-item-section>

            <q-item-section class="text-center">
              <q-item-label caption>Supported platforms:</q-item-label>
              <q-item-label
                v-for="platform in product.platforms"
                :key="platform.id"
              >
                {{ platform.name }}
              </q-item-label>
            </q-item-section>

            <!-- TODO: Add packages insteed of builds -->
            <q-item-section class="text-center col-2">
              <q-item-label caption>Build count:</q-item-label>
              <q-item-label>{{ product.builds.length }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <div class="q-pa-lg flex flex-center">
          <q-pagination
            input
            :max="totalPages"
            v-model="currentPage"
            :disable="loading"
          />
        </div>
      </template>
      <div v-else class="q-pt-md full-width row flex-center q-gutter-sm">
        <q-icon size="2em" name="warning" color="warning" />
        <span> No products found </span>
      </div>
    </q-page>
  </div>
</template>

<script>
  import {Loading} from "quasar"
  import {defineComponent, ref} from "vue"

  const maxLengthDescription = 200

  export default defineComponent({
    data() {
      return {
        loading: false,
        products: [],
        totalPages: ref(1),
        search: "",
      }
    },
    created() {
      this.loadFeedPage()
    },
    computed: {
      productsPageNumber() {
        return this.$store.getters["products/productsPageNumber"]
      },
      currentPage: {
        get() {
          return this.$store.state.products.pageNumber
        },
        set(value) {
          this.$store.commit("products/setPageNumber", value)
          this.loadFeedPage()
        },
      },
    },
    watch: {
      search: "searchProducts",
    },
    methods: {
      focusSearch() {
        this.$refs.searchField.focus()
      },
      searchProducts() {
        this.currentPage = 1
      },
      loadFeedPage() {
        Loading.show()
        let query = {
          search_string: this.search,
          pageNumber: this.productsPageNumber,
        }
        this.$api
          .get(`/products/`, {params: query})
          .then((response) => {
            Loading.hide()
            this.loading = false
            this.products = response.data.products
            this.totalPages = Math.ceil(response.data["total_products"] / 10)
          })
          .catch((error) => {
            Loading.hide()
            Notify.create({
              message: `${error.response.status}: ${error.response.statusText}`,
              type: "negative",
              actions: [{label: "Dismiss", color: "white", handler: () => {}}],
            })
          })
      },
      onProductDetail(productId) {
        this.$router.push(`/product/${productId}`)
      },
      descriptionText(description) {
        return description && description.length >= maxLengthDescription
          ? description.slice(0, 197) + "..."
          : description
      },
    },
  })
</script>

<style scoped>
  .clr-btn:hover {
    color: #ff4649;
  }
</style>
