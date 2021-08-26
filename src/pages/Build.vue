<template>
  <div class="q-pa-md row items-start q-gutter-md justify-center" v-if="build">
    <span>
    </span>
    <!--<deploy-tool-link-window ref="deployToolWindow" :build_id="build_id"/>-->

    <q-card flat>
      <q-card-section class="text-h6 text-center">
        <router-link :to="{path: `/build/${build.id}`}">
        Build {{ build.id }}
        </router-link>
          created by
          <a :href="`mailto:${build.user.email}`">{{ build.user.username }}</a>
          at {{ buildCreatedTime }}
      </q-card-section>

      <q-card-section>

        <q-tabs v-model="tab">
         <q-tab name="summary" label="Summary"/>
          <q-tab
              v-for="target of Object.keys(buildTasks)"
              :name="target"
              :label="target"
              :key="target"
          />
        </q-tabs>

        <q-tab-panels v-model="tab">
          <q-tab-panel name="summary">
             <table class="text-left q-table horizontal-separator build-info-table">
              <thead>
                <tr>
                  <th><td/></th>
                  <th v-for="targetName of Object.keys(buildTasks)" :key="targetName" class="platform-name">
                    {{ targetName }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tasks in buildTasksByIndex" :key="tasks[0].index">
                  <td>
                    <buildRef :buildRef="tasks[0].ref"/>
                  </td>
                  <template v-for="targetName of Object.keys(buildTasks)" :key="targetName">
                    <td v-for="task in buildTasks[targetName][tasks[0].index]" :key=task.id>
                      <BuildStatusCircle :status="task.status" @click="openTaskLogs(task)"/>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </q-tab-panel>

          <q-tab-panel
              v-for="target of Object.keys(buildTasks)"
              :name="target"
              :label="target"
              :key="target"
          >
             <table class="text-left q-table horizontal-separator build-info-table">
              <thead>
                <tr>
                  <th><td/></th>
                  <th>Status</th>
                  <th>Packages</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tasks in buildTasksByIndex" :key="tasks[0].index">
                  <td>
                    <buildRef :buildRef="tasks[0].ref"/>
                  </td>
                  <template v-for="task in buildTasks[target][tasks[0].index]" :key=task.id>
                    <td :class="getTaskCSS(task)"
                        @click="openTaskLogs(task)"
                    >
                      {{ getTextStatus(task) }}
                    </td>
                    <td>
                      <div
                        v-for="pkg in getTaskPackages(task)"
                        :key="pkg.name"
                      >
                        <a class="text-tertiary" :href="pkg.downloadUrl">
                          {{ pkg.name }}
                        </a>
                      </div>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </q-tab-panel>
        </q-tab-panels>

      </q-card-section>

      <q-card-section>
        <q-expansion-item label="Linked builds" expand-separator
                          icon="link" v-if="linked_builds">
          <q-card>
            <q-card-section v-for="linked_build in linked_builds" :key="linked_build">
              <q-item :to="`/build/${linked_build}`">
                <q-item-section>
                  {{ linked_build }}
                </q-item-section>
              </q-item>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>

    </q-card>
  </div>
</template>

<script>

import { defineComponent } from 'vue'
import { exportFile , Loading} from 'quasar'
import BuildRef from 'components/BuildRef.vue'
import BuildStatusCircle from 'components/BuildStatusCircle.vue'
import { BuildStatus } from '../constants.js'

export default defineComponent({
  props: {
    buildId: String
  },
  data () {
    return {
      tab: 'summary',
      build: null,
      reload: true,
      refreshTimer: null,
      linked_builds: null
    }
  },
  watch: {
    $route (to, from) {
      this.loadBuildInfo(to.params.buildId)
    }
  },
  computed: {
    buildTargets () {
      let targetsSet = new Set()
      let targets = []
      for (const task of this.build.tasks) {
        const targetKey = `${task.platform.name}.${task.arch}`
        if (targetsSet.has(targetKey)) {
          continue
        }
        targetsSet.add(targetKey)
        targets.push({name: task.platform.name, arch: task.arch, key: targetKey})
      }
      return targets
    },
    buildTasks () {
      let response = {}
      for (let task of this.build.tasks) {
        const x = `${task.platform.name}.${task.arch}`
        if (!response.hasOwnProperty(x)) {
          response[x] = {}
        }
        const y = task.index
        if (!response[x].hasOwnProperty(y)) {
          response[x][y] = []
        }
        response[x][y].push(task)
      }
      for (let sortX in response) {
        for (let sortY in response[sortX]) {
          response[sortX][sortY].sort((a, b) => (a.id > b.id) ? 1: -1)
        }
      }
      // TODO: sort here should use platform arch build order, instead
      //       of alphabetical.
      const ordered = Object.keys(response).sort().reduce(
        (obj, key) => {
          obj[key] = response[key];
          return obj;
        },
        {}
      )
      return ordered
    },
    buildTasksByIndex () {
      return this.buildTasks[Object.keys(this.buildTasks)[0]]
    },
    buildCreatedTime () {
      return new Date(this.build.created_at).toLocaleString()
    }
  },
  created () {
    this.loadBuildInfo(this.buildId)
    // update the build state every minute
    this.refreshTimer = setInterval(() => {
      if (this.reload) {
        this.loadBuildInfo(this.buildId)
      }
    }, 60000)
    // don't forget clear the timer while leaving the page
  },
  beforeUnmount () {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  },
  methods: {
    loadBuildInfo (buildId) {
      this.reload = false
      this.linked_builds = null
      Loading.show()
      this.$api.get(`/builds/${buildId}/`)
        .then(response => {
          Loading.hide()
          this.build = response.data
          if (this.build.linked_builds.length) {
            this.linked_builds = this.build.linked_builds
          }
          this.reload = true
        })
        .catch(error => {
          Loading.hide()
          this.reload = true
        })
    },
    getTextStatus (task) {
      return BuildStatus.text[task.status]
    },
    getTaskCSS (task) {
        let css = ['cursor-pointer']
        if (task.status === BuildStatus.FAILED) {
          css.push('text-negative', 'bg-red-1')
        }
        else if (task.status === BuildStatus.IDLE) {
          css.push('text-grey-6')
        }
        else if (task.status === BuildStatus.STARTED) {
          css.push('text-black-6')
        }
        else if (task.status === BuildStatus.COMPLETED) {
          css.push('text-green-7')
        }
        return css
    },
    downloadArtifact (artifact) {
      this.$api.get(`/artifacts/${artifact.id}/`)
        .then((response) => {
          exportFile(artifact.name, response.data.content)
        })
    },
    openTaskLogs (task) {
      this.$router.push(`/build/${this.buildId}/logs/${task.id}`)
    },
    getTaskPackages (task) {
      return task.artifacts.filter(item => item.type === 'rpm').map(item => {
        let arch = task.arch
        if (item.name.includes('.src.')) {
          arch = 'src'
        }
        item.downloadUrl = `${window.origin}/pulp/content/builds/${task.platform.name}-${arch}-${this.buildId}-br/${item.name}`
        return item
      })
    }
  },
  components: {
    BuildRef,
    BuildStatusCircle
  }
})
</script>

<style scoped>
  .q-tab {
    text-transform: none !important;
  }

  table.build-info-table tr:last-child td {
    border: none !important;
  }

  .mock-options dd {
    font-family: monospace;
    font-size: medium;
    padding: 0.5em 0 1em 1em;
    width: 30vw;
  }

  .mock-options dd:last-child {
    padding-bottom: 0;
  }

  th.platform-name {
    text-overflow: ellipsis;
    overflow: hidden !important;
    width: 60px;
  }
</style>
