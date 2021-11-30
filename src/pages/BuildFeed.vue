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
    this.updateFilter()
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
  watch: {
    buildFeedQuery () {
      this.loadFeedPage()
    },
    'query': 'updateFilter'
  },
  methods: {
    updateFilter () {
      this.$store.dispatch('buildsFeed/updateFilter', this.queryToFilter(this.query))
    },
    queryToFilter (query) {
      if (!query) {
        return undefined
      }
      var filter = {}
      for (let item of query.split('&')) {
        const name = item.split('=')[0]
        const value = item.split('=')[1]
        switch (name) {
          case 'author':
            filter.authorId = value
            break
          case 'tag':
            filter.buildTag = value
            break
          case 'project_name':
            filter.projectName = value
            break
          case 'ref':
            filter.buildRef = value
            break
          case 'package':
            filter.package = value
            break
        }
      }
      return filter
    },
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
