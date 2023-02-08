<template>
  <div class="row no-wrap no-scroll q-pa-md" v-if="build">
    <q-list class="col-auto" highlight no-border separator dense>
      <q-item-section v-if="buildSystemLogs.length">
        build system logs:
      </q-item-section>
      <build-log-link v-for="artifact in buildSystemLogs" :key="artifact.name"
                      :artifact="artifact"
                      :selected="artifact.name===selectedLog"
                      @view="onView(artifact)"
                      @download="onDownload(artifact)"/>

      <q-item-section v-if="mockBinaryLogs.length">
        mock RPM logs:
      </q-item-section>
      <build-log-link v-for="artifact in mockBinaryLogs" :key="artifact.name"
                      :artifact="artifact"
                      :selected="artifact.name===selectedLog"
                      @view="onView(artifact)"
                      @download="onDownload(artifact)"/>

      <q-item-section v-if="mockSrpmLogs.length">
        mock src-RPM logs:
      </q-item-section>
      <build-log-link v-for="artifact in mockSrpmLogs" :key="artifact.name"
                      :artifact="artifact"
                      :selected="artifact.name===selectedLog"
                      @view="onView(artifact)"
                      @download="onDownload(artifact)"/>

      <q-item-section v-if="buildArtifacts.length">
        Build artifacts:
      </q-item-section>
      <build-log-link v-for="artifact in buildArtifacts" :key="artifact.name"
                      :artifact="artifact"
                      :selected="artifact.name===selectedLog"
                      @view="onView(artifact)"
                      @download="onDownload(artifact)"/>

      <q-item-section v-if="pbuilderLogs.length">
        pbuilder logs:
      </q-item-section>
      <build-log-link v-for="artifact in pbuilderLogs" :key="artifact.name"
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
import BuildLogLink from 'components/BuildLogLink.vue'
import { Loading } from 'quasar'

export default defineComponent({
  data () {
    return {
      build: null,
      logText: '',
      selectedLog: null
    }
  },
  props: {
    buildId: String,
    taskId: String
  },
  created () {
    this.loadLogsList()
  },
  computed: {
    buildSystemLogs () {
      return this.filterLogs(/albs[.\w|\d]*?\.log$/)
    },
    pbuilderLogs () {
      return this.filterLogs(/(apt|build)-[\w.]+\.(cfg|conf|log)$/)
    },
    mockBinaryLogs () {
      return this.filterLogs(/mock((-*\w)*?(?!srpm)\.\d+\.log|\.\d+\.cfg)$/)
    },
    mockSrpmLogs () {
      return this.filterLogs(/mock(_\w+\.srpm\..*?\.log|\.srpm\.\d+\.cfg)$/)
    },
    buildArtifacts () {
      return this.filterLogs(/modules/)
    },
    innerHeight: function () {
      return window.innerHeight
    },
    logs () {
      return this.task.artifacts.filter(artifact => artifact.type == 'build_log')
    },
    task () {
      return this.build.tasks.filter(task => task.id == parseInt(this.taskId))[0]
    }
  },
  methods: {
    filterLogs (regex) {
      return this.logs.filter(artifact => regex.test(artifact.name)).sort((a,b) => {
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
      })
    },
    loadLogsList () {
      Loading.show()
      this.$api.get(`/builds/${this.buildId}/`)
        .then(response => {
          this.build = response.data
          if (this.task.error) {
            this.task.artifacts.push({type: 'build_log', name: 'albs_internal_error.log', text: this.task.error})
          }
          Loading.hide()
        })
    },
    onDownload (artifact) {
      let artifactUrl = `${window.origin}/pulp/content/build_logs/build-${this.buildId}-build_log/${artifact.name}`
      axios.get(artifactUrl)
        .then(response => {
          exportFile(artifact.name, response.data)
        })
    },
    onView (artifact) {
      let artifactUrl = `${window.origin}/pulp/content/build_logs/build-${this.buildId}-build_log/${artifact.name}`
      this.selectedLog = artifact.name
      if (artifact.text) {
        this.logText = artifact.text
        return
      }
      axios.get(artifactUrl)
        .then(response => {
          this.logText = response.data
        })
    }
  },
  components: { BuildLogLink }
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
