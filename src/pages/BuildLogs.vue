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
import { defineComponent } from 'vue'
import { exportFile } from 'quasar'
import BuildLogLink from 'components/BuildLogLink.vue'

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
      return this.filterLogs(/albs\.log$/)
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
      return this.build.tasks.filter(task => task.id === parseInt(this.taskId))[0].artifacts.filter(artifact => artifact.type == 'build_log')
    }
  },
  methods: {
    filterLogs (regex) {
      return this.logs.filter(artifact => regex.test(artifact.name))
    },
    loadLogsList () {
      this.$api.get(`/builds/${this.buildId}/`)
        .then(response => {
          this.build = response.data
        })
    },
    onDownload (artifact) {
      this.$api.get(`/artifacts/${artifact.id}/`)
        .then((response) => {
          exportFile(artifact.name, response.data.content)
        })
    },
    onView (artifact) {
      this.selectedLog = artifact.name
      this.$api.get(`/artifacts/${artifact.id}/`)
        .then((response) => {
          this.logText = response.data.content
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
