<template>
  <div class="row no-wrap no-scroll q-pa-md">
    <q-list class="col-auto" highlight no-border separator dense>
      <log-link v-for="artifact in tests" :key="artifact.name"
                      :artifact="artifact"
                      :selected="artifact.name===selectedLog"
                      @view="onView(artifact)"
                      @download="onDownload(artifact)"/>
    </q-list>
    <div class="col">
      <q-infinite-scroll
          ref="logContent"
          :style="{height: innerHeight - 150 + 'px'}"
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
import LogLink from 'src/components/LogLink.vue'

export default defineComponent({
  data () {
    return {
      build: null,
      logText: '',
      selectedLog: null,
      tests: [],
      data: null
    }
  },
  props: {
    buildId: String,
    taskId: String,
    revision: String
  },
  created () {
    this.fetchBuild()
    this.loadLogsList()
  },
  computed: {
    innerHeight: function () {
      return window.innerHeight
    },
    task () {
      return this.build.tasks.filter(task => task.id == parseInt(this.taskId))[0]
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
      this.$api.get(`/tests/${this.taskId}/${this.revision}`)
        .then(response => {
          response.data.forEach(test => {
            this.tests = this.tests.concat(test.alts_response.result.logs)
          })
        })
    },
    onDownload (artifact) {
      let artifactUrl = `${window.origin}/pulp/content/test_logs/${this.task.platform.name}-${this.task.arch}-${this.buildId}-artifacts-${this.taskId}/${artifact.name}`
      axios.get(artifactUrl)
        .then(response => {
          exportFile(artifact.name, response.data)
        })
    },
    onView (artifact) {
      let artifactUrl = `${window.origin}/pulp/content/test_logs/${this.task.platform.name}-${this.task.arch}-${this.buildId}-artifacts-${this.taskId}/${artifact.name}`
      this.selectedLog = artifact.name
      axios.get(artifactUrl)
        .then(response => {
          this.logText = response.data
        })
    }
  },
  components: { LogLink }
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
</style>
