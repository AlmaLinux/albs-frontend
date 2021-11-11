<template>
  <div class="row no-wrap no-scroll q-pa-md">
    <template v-if="testRunning()">
      <p> Tests is still running </p>     
    </template>
    <template v-else>
      <q-list  class="col-auto" highlight no-border separator dense>
        <q-item-section v-for="task in tests" :key="task.package_name">
          <q-item-label :set="this.task = task" header>
            {{`${task.package_name}-${task.package_version}-${task.package_release}`}}
          </q-item-label>
          <div v-for="log in task.alts_response.result.logs" :key="log">
            <q-item class="log-link" :class="{'bg-grey-4': log.name == this.selectedLog}">
              <q-item-section class="cursor-pointer" @click="onView(log)">
                <a class="text-dark">{{ log.name }} </a>
              </q-item-section>
              <q-item-section side class="cursor-pointer" @click="onDownload(log)">
                <q-icon name="file_download" color="tertiary" size="1.5em" class="text-dark"/>
              </q-item-section>
            </q-item>
             <q-separator inset />
          </div>
        </q-item-section>
      </q-list>
    </template>
      
    <div class="col">
      <q-infinite-scroll
          ref="logContent"
          :style="{height: innerHeight + 'px'}"
          class="log-container" inline
      >
        <pre v-if="selectedLog">{{ logText }}</pre>
      </q-infinite-scroll>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { exportFile } from 'quasar'
import { defineComponent } from 'vue'
import { TestStatus } from '../constants.js'

export default defineComponent({
  data () {
    return {
      build: null,
      logText: '',
      selectedLog: null,
      tests: [],
      data: null,
      task: null
    }
  },
  props: {
    buildId: String,
    taskId: String
  },
  created () {
    this.fetchBuild()
    this.loadLogsList()
  },
  computed: {
    innerHeight: function () {
      return window.innerHeight
    }
  },
  methods: {
    fetchBuild() {
      this.$api.get(`/builds/${this.buildId}/`)
        .then(response => {
          this.build = response.data
        })
    },
    filterLogs (regex) {
      return this.logs.filter(artifact => regex.test(artifact.name))
    },
    loadLogsList () {
      this.$api.get(`/tests/${this.taskId}/latest`)
        .then(response => {
          response.data.forEach(test => {
            this.tests.push(test)
          })
        })
    },
    testRunning () {
      let tests_running = false
      this.tests.forEach(test => {
        if (test.status <= TestStatus.STARTED) {
          tests_running = true
        }
      })
      return tests_running
    },
    onDownload (log) {
      let logUrl = `${window.origin}/pulp/content/test_logs/test_logs-btid-${this.taskId}-tr-${this.task.revision}/${log.name}`
      axios.get(logUrl)
        .then(response => {
          exportFile(log.name, response.data)
        })
    },
    onView (log) {
      let logUrl = `${window.origin}/pulp/content/test_logs/test_logs-btid-${this.taskId}-tr-${this.task.revision}/${log.name}`
      this.selectedLog = log.name
      axios.get(logUrl)
        .then(response => {
          this.logText = response.data
        })
    }
  }
})
</script>

<style scoped>
  .log-container {
    font-size: small;
    overflow-y: auto;
    padding-left: 2em;
  }

  .log-container pre {
    white-space: pre-wrap;
    word-break: break-all;
  }

  .log-link {
    font-size: small;
    padding-right: 0;
  }
</style>