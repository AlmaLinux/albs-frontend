<template>
  <div class="q-pa-md row items-start q-gutter-md justify-center" v-if="build">
    <span>
    </span>
    <!--<deploy-tool-link-window ref="deployToolWindow" :build_id="build_id"/>-->

    <q-card flat bordered class="my-card">
      <q-card-section class="text-h6 text-center">
        <router-link :to="{path: `/build/${build.id}`}">
        Build {{ build.id }}
        </router-link>
          created by
          <a :href="`mailto:${build.user.email}`">{{ build.user.username }}</a>
          at {{ build.created_at.split('T')[0] }}
      </q-card-section>

      <q-card-section>
        <!--TODO: fix this table!-->
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
              <b>{{ task.id }}</b>
        <!--      <b>{{ project.name }}</b> --->
        <!--      <build-reference :buildRef="project.build_ref" class='no-overflow'/>-->
            </td>
            <td v-for="target in getTaskTargets(task)" :key=target.id>
              {{ target.textStatus }}
        <!--    <td v-for="target in project.build_targets"-->
        <!--        v-if="target.architecture !== 'src'"-->
        <!--        :class="generateItemCSS(project, target)"-->
        <!--        :key="target.id">-->
        <!--      {{ formatItemStatus(project, target) }}-->
            </td>
          </tr>
        </tbody>
      </table>
      </q-card-section>

    </q-card>
  </div>
</template>

<script>

import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    buildId: Number
  },
  data () {
    return {
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
    getTaskTargets(task) {
      let targets = []
      // TODO: move to constants.js
      let statusMapping = {
        0: 'idle',
        1: 'build started',
        2: 'build done',
        3: 'build failed'
      }
      for (const buildTask of this.sortedTasks) {
        if (task.index === buildTask.index) {
            targets.push(Object.assign({}, buildTask, {textStatus: statusMapping[buildTask.status]}))
        }
      }
      return targets
    }
  },
  components: {
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
</style>
