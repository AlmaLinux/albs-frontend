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
            v-for="target of buildTargets"
            :name="target.key"
            :label="target.key"
            :key="target.key"
        />
      </q-tabs>

      <q-tab-panels v-model="tab">
        <q-tab-panel name="summary">
           <table class="text-left q-table horizontal-separator build-info-table">
            <thead>
              <tr>
                <th><td/></th>
                <template v-for="platform in buildPlatforms">
                  <th v-for="arch in platform.arch_list" :key="arch" class="platform-name">
                    {{ platform.name }} {{ arch }}
                  </th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr v-for="task in buildTasks" :key="task.id">
                <td>
                  <buildRef :buildRef="task.ref"/>
                </td>
                <td v-for="target in getTaskTargets(task)" :key=target.id>
                  <BuildStatusCircle :status="target.status" @click="openTaskLogs(task)"/>
                </td>
              </tr>
            </tbody>
          </table>
        </q-tab-panel>

        <q-tab-panel
            v-for="target of buildTargets"
            :name="target.key"
            :label="target.key"
            :key="target.key"
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
              <tr v-for="task in buildTasks" :key="task.id">
                <td>
                  <buildRef :buildRef="task.ref"/>
                </td>
                <td :class="getTaskCSS(task)">
                  {{ getTextStatus(task) }}
                </td>
                <td>
                  <div
                    v-for="pkg in getTaskPackages(task, target.arch)"
                    :key="pkg.name"
                  >
                    <a class="text-tertiary" :href="pkg.downloadUrl">
                      {{ pkg.name }}
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </q-tab-panel>
      </q-tab-panels>

    </q-card-section>

    </q-card>
  </div>
</template>

<script>

import { defineComponent } from 'vue'
import { exportFile } from 'quasar'
import BuildRef from 'components/BuildRef.vue'
import BuildStatusCircle from 'components/BuildStatusCircle.vue'
import { BuildStatus } from '../constants.js'

export default defineComponent({
  props: {
    buildId: Number
  },
  data () {
    return {
      tab: 'summary',
      build: null,
      reload: true,
      refreshTimer: null
    }
  },
  computed: {
    buildPlatforms () {
      let platformsNames = new Set()
      let platforms = []
      for (const task of this.build.tasks) {
        if (!platformsNames.has(task.platform.name)) {
          platformsNames.add(task.platform.name)
          platforms.push(task.platform)
        }
      }
      return platforms
    },
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
    sortedTasks () {
      return JSON.parse(JSON.stringify(this.build.tasks)).sort((a, b) => (a.id > b.id) ? 1 : -1)
    },
    buildTasks () {
      let taskSet = new Set()
      let tasks = []
      for (const task of this.sortedTasks) {
        if (taskSet.has(task.index)) {
          continue
        }
        taskSet.add(task.index)
        tasks.push(task)
      }
      return tasks
    },
    buildCreatedTime () {
      return new Date(this.build.created_at).toLocaleString()
    }
  },
  created () {
    this.loadBuildInfo()
    // update the build state every minute
    this.refreshTimer = setInterval(() => {
      if (this.reload) {
        this.loadBuildInfo()
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
    loadBuildInfo () {
      this.reload = false
      this.$api.get(`/builds/${this.buildId}/`)
        .then(response => {
          this.build = response.data
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
    getTaskPackages (task, arch) {
      for (const buildTask of this.build.tasks) {
        if (buildTask.arch === arch && buildTask.index === task.index) {
          return buildTask.artifacts.filter(item => item.type === 'rpm').map(item => {
            let arch = buildTask.arch
            if (item.name.includes('.src.')) {
              arch = 'src'
            }
            item.downloadUrl = `${window.origin}/pulp/content/builds/${buildTask.platform.name}-${arch}-${this.buildId}-br/${item.name}`
            return item
          })
        }
      }
    },
    getTaskLogs (task, arch) {
      for (const buildTask of this.build.tasks) {
        if (buildTask.arch === arch && buildTask.index === task.index) {
          return buildTask.artifacts.filter(item => item.type === 'build_log')
        }
      }
    },
    getTaskTargets(task) {
      return this.sortedTasks.filter(item => item.index === task.index)
    },
    getTaskCSS (task) {
        let css = []
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
