<template>
  <q-page>
    <div>
      <BuildFeedItem
        v-for="build in builds"
        :key="build._id"
        :build="build"
        :loading="loading"
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
import { BuildStatus, SignStatus, TestStatus } from 'src/constants'

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
    loadSignInfo (build) {
      this.$api.get(`sign-tasks/?build_id=${build.id}`)
        .then(response => {
          if (response.data.length) {
            let signs = response.data
            build.releaseStatus = SignStatus.text[signs[signs.length - 1].status]
          }
        })
        .catch(error =>{})
    },
    loadTestsInfo (task) {
      this.$api.get(`tests/${task.id}/latest`)
        .then(response => {
          task["test_tasks"] = response.data
          let count_failed = 0
          let tests_failed = false
          let test_started = false
          task.test_tasks.forEach(test => {
            switch (test.status) {
              case TestStatus.STARTED:
                test_started = true
                break;
              case TestStatus.FAILED:
                count_failed += 1
                tests_failed = true
                break;
              case TestStatus.COMPLETED:
                task.status = BuildStatus.TEST_COMPLETED
                break;
            }
          })
          if (tests_failed) {
             if (count_failed === task.test_tasks.length) {
              task.status = BuildStatus.ALL_TESTS_FAILED
             } else {
              task.status = BuildStatus.TEST_FAILED
             }
          }
          if (test_started) task.status = BuildStatus.TEST_STARTED
        })
    },
    loadFeedPage () {
      this.loading = true
      Loading.show()
      this.$api.get(`/builds/`, {params: this.buildFeedQuery})
        .then(response => {
          setTimeout(() => {
            Loading.hide()
            this.loading = false
          }, 2000)
          this.builds = response.data['builds']
          this.builds.forEach( build => {
            this.loadSignInfo(build)
            build.tasks.forEach(task => {
              if (task.status === BuildStatus.COMPLETED) {
                this.loadTestsInfo(task)
              }
            })
          })
          this.totalPages = Math.ceil(response.data['total_builds'] / 10)
        })
        .catch(error => {
          this.loading = false
          Loading.hide()
          // TODO: add error here
        })
    }
  },
  components: {
    BuildFeedItem
  }
})
</script>
