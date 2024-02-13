<template>
  <q-page class="q-px-lg q-pt-lg">
    <div>
      <BuildFeedItem
        v-for="build in builds"
        :key="build._id"
        :build="build"
        :loading="loading"
        style="margin-top: 1vw"
      />
    </div>
    <div class="q-pa-lg flex flex-center">
      <q-pagination
        input
        :max="totalPages"
        v-model="currentPage"
        :disable="loading"
        id="bfe-qp-pagination"
      />
    </div>
  </q-page>
</template>

<script>
  import {defineComponent, ref} from 'vue'
  import BuildFeedItem from 'components/BuildFeedItem.vue'
  import {Loading, LocalStorage} from 'quasar'
  import {BuildStatus, SignStatus, TestStatus} from 'src/constants'
  import {parseJwt} from 'src/utils'

  export default defineComponent({
    name: 'BuildFeed',
    data() {
      return {
        builds: [],
        totalPages: ref(1),
        loading: false,
      }
    },
    created() {
      this.updateFilter()
      this.loadFeedPage()
      this.checkAuthorize()
    },
    computed: {
      buildFeedQuery() {
        return this.$store.getters['buildsFeed/buildFeedQuery']
      },
      currentPage: {
        get() {
          return this.$store.state.buildsFeed.pageNumber
        },
        set(value) {
          this.loading = true
          this.$store.commit('buildsFeed/setPageNumber', value)
        },
      },
    },
    watch: {
      buildFeedQuery() {
        this.loadFeedPage()
      },
      '$route.query': 'updateFilter',
    },
    methods: {
      checkAuthorize() {
        let user = LocalStorage.getItem('user')
        if (user) {
          let token = parseJwt(user.jwt_token)
          let tokenExpired = new Date(token.exp * 1000) <= Date.now()
          if (tokenExpired) {
            this.$store.commit('users/onLogout')
            this.$router.go()
          }
        }
      },
      updateFilter() {
        this.$store.dispatch(
          'buildsFeed/updateFilter',
          this.queryToFilter(this.$route.query)
        )
      },
      toBoolOrNull(value) {
        let bool = null
        if (value === 'true') bool = true
        if (value === 'false') bool = false
        return bool
      },
      queryToFilter(query) {
        if (!query) {
          return undefined
        }
        let filter = JSON.parse(JSON.stringify(query))
        for (let item in filter) {
          switch (item) {
            case 'signed':
              filter.signed = this.toBoolOrNull(filter.signed)
              break
            case 'released':
              filter.released = this.toBoolOrNull(filter.released)
              break
          }
        }
        return filter
      },
      getReleaseStatus(build) {
        if (build.released) {
          build.releaseStatus = 'released'
          return
        }

        if (build.sign_tasks.length) {
          let signs = build.sign_tasks
          build.releaseStatus = SignStatus.text[signs[signs.length - 1].status]
        }
      },
      loadTestsInfo(task) {
        let count_failed = 0
        let tests_failed = false
        let test_started = false
        let latest_revision = Math.max(
          ...task.test_tasks.map((t) => t.revision)
        )
        let latest_test_tasks = task.test_tasks.filter(
          (t) => t.revision === latest_revision
        )
        latest_test_tasks.forEach((test) => {
          switch (test.status) {
            case TestStatus.STARTED:
              test_started = true
              break
            case TestStatus.FAILED:
              count_failed += 1
              tests_failed = true
              break
            case TestStatus.COMPLETED:
              task.status = BuildStatus.TEST_COMPLETED
              break
            case TestStatus.CANCELLED:
              task.status = BuildStatus.TEST_CANCELLED
              break
          }
        })
        if (tests_failed) {
          if (count_failed === latest_test_tasks.length) {
            task.status = BuildStatus.ALL_TESTS_FAILED
          } else {
            task.status = BuildStatus.TEST_FAILED
          }
        }
        if (test_started) task.status = BuildStatus.TEST_STARTED
      },
      loadFeedPage() {
        this.loading = true
        Loading.show()
        this.$api
          .get(`/builds/`, {params: this.buildFeedQuery})
          .then((response) => {
            this.builds = response.data['builds']
            this.builds.forEach((build) => {
              this.getReleaseStatus(build)
              build.tasks.forEach((task) => {
                if (task.status === BuildStatus.COMPLETED) {
                  this.loadTestsInfo(task)
                }
              })
            })
            this.totalPages = Math.ceil(response.data['total_builds'] / 10)
            Loading.hide()
            this.loading = false
          })
          .catch((error) => {
            this.loading = false
            Loading.hide()
            // TODO: add error here
          })
      },
    },
    components: {
      BuildFeedItem,
    },
  })
</script>
