<template>
  <q-page>
    <div>
      <BuildFeedItem
        v-for="build in builds"
        :key="build._id"
        :build="build"
        style="margin-top: 1vw;"
      />
    </div>
    <div class="q-pa-lg flex flex-center">
      <q-pagination input :max="totalPages" v-model="currentPage" :disable="loading"/>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import BuildFeedItem from 'components/BuildFeedItem.vue'
import { Loading } from 'quasar'

export default defineComponent({
  name: 'BuildFeed',
  data () {
    return {
      builds: [],
      totalPages: ref(1),
      loading: false
    }
  },
  created () {
    this.loadFeedPage()
  },
  computed: {
    buildFeedQuery () {
      return this.$store.getters['buildsFeed/buildFeedQuery']
    },
    currentPage: {
      get () { return this.$store.state.buildsFeed.pageNumber },
      set (value) {
        this.loading = true
        this.$store.commit('buildsFeed/setPageNumber', value)
        this.loadFeedPage()
      }
    }
  },
  methods: {
    loadFeedPage () {
      this.loading = true
      Loading.show()
      this.$api.get(`/builds/`, {params: this.buildFeedQuery})
        .then(response => {
          this.loading = false
          Loading.hide()
          this.builds = response.data['builds']
          this.totalPages = Math.ceil(response.data['total_builds'] / 10)
        })
        .catch(error => {
          this.loading = false
          Loading.hide()
          if (error.response.status === 403) {
            this.$router.push('/auth/login')
          }
          // TODO: add error here
        })
    }
  },
  components: {
    BuildFeedItem
  }
})
</script>
