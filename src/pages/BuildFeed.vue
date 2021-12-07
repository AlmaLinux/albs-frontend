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
import { BuildStatus, TestStatus } from 'src/constants'

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
