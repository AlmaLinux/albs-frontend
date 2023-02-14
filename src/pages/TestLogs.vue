<template>
  <div class="row no-wrap no-scroll q-pa-md">
    <table class="q-table horizontal-separator full-width col-lg-12 col-xl-10">
      <tr>
        <td colspan="2">
          <q-input placeholder="Search" v-model="search" debounce="300">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </td>
        <td>
          <q-select
            v-model="statusFilter"
            label="Status filter"
            radio
            :options="testsStatusFilterLabels"
          />
        </td>
      </tr>
      <tbody v-for="test in tests" :key="test.id">
        <tr class="bg-grey-2">
          <td colspan="3" class="text-blue-grey-7">
            <strong>
              <span>
                {{test.full_package_name}}
              </span>
            </strong>
          </td>
          <td class="text-center">
            <span> Status </span>
          </td>
        </tr>
        <template v-if="test.running">
          <tr>
            <td colspan="4" class="text-center text-blue-7">
              <h6>Test is still running</h6>
            </td>
          </tr>
        </template>
        <template v-else>
          <template
            v-for="log in testsStatusFilter(testsFilter(test.result, search), statusFilter)"
            :key="log"
          >
            <tr>
              <td :colspan="log.tap && !search ? 2 : 3">
                <strong>
                  {{ log.short_name }}
                </strong>
              </td>
              <td
                v-if="log.tap && !search"
                class="text-right q-gutter-xs"
                style="padding: 0.3rem 0.7rem;"
              >
                <q-btn
                  color="grey"
                  :flat="log.tapFilter != 'total'"
                  @click="log.tapFilter = 'total'"
                  small
                >
                  {{ log.tap.total.length }}
                  <q-tooltip anchor="bottom middle" self="top middle">
                    Total
                  </q-tooltip>
                </q-btn>
                <q-btn
                  color="negative"
                  :flat="log.tapFilter != 'failed'"
                  @click="log.tapFilter = 'failed'"
                  small
                >
                  {{ log.tap.failed.length }}
                  <q-tooltip anchor="bottom middle" self="top middle">
                    Failed
                  </q-tooltip>
                </q-btn>
                <q-btn
                  color="green"
                  :flat="log.tapFilter != 'done'"
                  @click="log.tapFilter = 'done'"
                  small
                >
                  {{ log.tap.done.length }}
                  <q-tooltip anchor="bottom middle" self="top middle">
                    Done
                  </q-tooltip>
                </q-btn>
                <q-btn
                  color="primary"
                  :flat="log.tapFilter != 'todo'"
                  @click="log.tapFilter = 'todo'"
                  small
                >
                  {{ log.tap.todo.length }}
                  <q-tooltip anchor="bottom middle" self="top middle">
                    ToDo
                  </q-tooltip>
                </q-btn>
                <q-btn
                  color="warning"
                  :flat="log.tapFilter != 'skipped'"
                  @click="log.tapFilter = 'skipped'"
                  small
                >
                  {{ log.tap.skipped.length }}
                  <q-tooltip anchor="bottom middle" self="top middle">
                    Skipped
                  </q-tooltip>
                </q-btn>
              </td>
              <td class="text-center" width="15%" @click="onView(log)">
                <q-chip
                  :color="log.success ? 'green' : 'negative'"
                  text-color="white"
                  dense
                  class="text-weight-bolder text-capitalize cursor-pointer"
                  square
                >
                  {{ log.success ? 'done' : 'failed' }}
                </q-chip>
              </td>
            </tr>
            <template v-if="log.tap">
              <tr v-for="tap in tapFilter(log, search)" :key="tap.test_name">
                <td
                  colspan="3"
                  style="padding-left: 3rem; word-break: break-all;"
                >
                  {{ tap.test_name }}
                </td>
                <td class="text-center">
                  <q-chip
                    :color="testTapStatus.color[tap.status]"
                    text-color="white"
                    dense
                    class="text-weight-bolder text-capitalize"
                    square
                  >
                    {{ testTapStatus.text[tap.status] }}
                  </q-chip>
                </td>
              </tr>
            </template>
          </template>
        </template>
      </tbody>
      <tr v-if="!tests || tests.length == 0">
        <td colspan="4" class="text-center text-blue-7">
          <h6>Nothing here yet</h6>
        </td>
      </tr>
    </table>
  </div>

  <log-view ref="openLogView" :logText="logText" />
</template>

<script>
  import axios from 'axios'
  import { defineComponent } from 'vue'
  import { TestStatus, TestTapStatus } from '../constants.js'
  import logView from 'components/LogView.vue'
  import { Loading } from 'quasar'

  export default defineComponent({
    data () {
      return {
        logText: '',
        selectedLog: null,
        tests: [],
        taps: null,
        testTapStatus: TestTapStatus,
        testsStatusFilterLabels: [
          {label: 'All', value: 'all'},
          {label: 'Done', value: true},
          {label: 'Fail', value: false}],
        statusFilter: {label: 'All', value: 'all'},
        search: '',
        test_options: [
          'initialize_terraform',
          'start_environment',
          'initial_provision',
          'install_package',
          'tests',
          'uninstall_package',
          'stop_environment'
        ]
      }
    },
    props: {
      taskId: String,
      buildId: String
    },
    created () {
      this.loadLogsList()
    },
    methods: {
      filterLogs (regex) {
        return this.logs.filter(artifact => regex.test(artifact.name))
      },
      getTaps (id) {
        let tap_results = this.taps.filter(tap => tap.id === id)[0].tap_results
        return {
          total: tap_results,
          failed: tap_results.filter(res => res.status === TestTapStatus.FAILED),
          done: tap_results.filter(res => res.status === TestTapStatus.DONE),
          todo: tap_results.filter(res => res.status === TestTapStatus.TODO),
          skipped: tap_results.filter(res => res.status === TestTapStatus.SKIPPED)
        }
      },
      loadLogsList () {
        Loading.show()
        this.$api.get(`/tests/${this.taskId}/latest`)
          .then(response => {
            this.$api.get(`/tests/${this.taskId}/logs`)
              .then(logs => {
                Loading.hide()
                this.taps = logs.data
              response.data.forEach(test => {
                let parsed_test = {
                  full_package_name: `${test.package_name}-${test.package_version}-${test.package_release}`,
                  status: test.status,
                  revision: test.revision,
                  result: []
                }
                let test_logs = {}
                if (parsed_test.status < TestStatus.COMPLETED) {
                  parsed_test.running = true
                  this.tests.push(parsed_test)
                  return
                }
                test.alts_response.result.logs.forEach(log => {
                  test_logs[this.shortTestName(log.name)] = log
                })
                this.test_options.filter(opt => test.alts_response.result[opt]).forEach(opt => {
                  let res = {}
                  if (opt === 'tests') {
                    for (const item in test.alts_response.result[opt]) {
                      res.success = test.alts_response.result[opt][item].success
                      res.short_name = item
                      res.name = test_logs[item].name
                      res.tapFilter = 'failed'
                      res.tap = this.getTaps(test.id)
                      parsed_test.result.push(res)
                    }
                  } else {
                    res.success = test.alts_response.result[opt].success
                    res.short_name = opt
                    res.name = test_logs[opt].name
                    parsed_test.result.push(res)
                  }
                })
                this.tests.push(parsed_test)
              })
            })
          })
      },
      shortTestName (name) {
        let n = name.split('_')
        n.pop()
        if (n[0] === 'tests'){
          n.shift()
        }
        return n.join('_')
      },
      testsStatusFilter (tests, status) {
        if (status.value === 'all') return tests

        return tests.filter(test => test.success === status.value)
      },
      testsFilter (tests, searchQuery) {
        let re = new RegExp(searchQuery, 'i')
        return tests.filter(test => {
          if (test.tap) {
            let tap = test.tap.total.filter(tap => tap.test_name.match(re))
            if (tap.length) return tap
          }
          return test.short_name.match(re)
        })
      },
      tapFilter (log, searchQuery){
        let re = new RegExp(searchQuery, 'i')
        if (searchQuery){
          return log.tap.total.filter(tap => tap.test_name.match(re))
        } else {
          return log.tap[log.tapFilter]
        }
      },
      onView (log, revision) {
        let logUrl = `${window.origin}/pulp/content/test_logs/build-${this.buildId}-test_log/${log.name}`
        this.selectedLog = log.name
        axios.get(logUrl)
          .then(response => {
            this.logText = response.data
            this.$refs.openLogView.open()
          })
      }
    },
    components: {
      logView
    }
  })
</script>
