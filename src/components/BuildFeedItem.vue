<template>
  <q-card square class="shadow-1">
    <q-card-section class="no-padding row">
      <div style="overflow: auto;" class="col-10">
       <table class="text-left q-table horizontal-separator build-info-table">
        <thead>
          <tr>
            <th>
              <q-btn
                  color="tertiary"
                  small flat
                  class="no-padding no-margin"
                  icon="info"
                  :to="{path: `/build/${build.id}`}"
                  label="details"
              />
            </th>
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
      </div>
      <div class="col-2 text-tertiary creation-info">
        Created by <a :href="`mailto:${build.user.email}`">{{ build.user.username }}</a>
        <br/>
        <!-- TODO: Format timestamp-->
        at {{ build.created_at }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BuildFeedItem',
  props: {
    build: Object
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
  methods: {
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
  }
})
</script>

<style scoped>
  div.creation-info {
    font-size: small;
    text-align: center;
    padding: 0.5em;
    overflow-wrap: break-word;
  }

  .build-info-btn {
    padding: 0 0.5em 0 0.5em;
  }

  span.build-info-channel {
    font-family: monospace;
    font-size: small;
  }

  .build-info-tag {
    text-overflow: ellipsis;
    overflow: hidden !important;
    white-space: nowrap;
    width: 100px;
    display: block;
  }

  span.build-info-tag {
    font-weight: normal;
    margin-left: 0.2em;
  }

  table.build-info-table {
    min-width: 100%;
    table-layout: fixed;
  }

  /* First table header cell which contains "Show details" link and channel */
  table.build-info-table tr:first-child th:first-child {
    padding: 0.3em;
    width: 25%;
  }

  td.build-info-table {
    padding: 0 0 0 1em !important;
    margin: 0;
  }

  th.build-info-table {
    padding-left: 1em !important;
  }

  table.build-info-table tr:last-child td {
    border: none !important;
  }

  .no-overflow {
    text-overflow: ellipsis;
    overflow: hidden !important;
    white-space: nowrap;
    width: 100px;
    display: block;
  }

  .no-overflow:hover {
    background-color: ghostwhite;
    width: fit-content;
    overflow: visible;
    position: relative;
    z-index: 1;
  }

  th.platform-name {
    text-overflow: ellipsis;
    overflow: hidden !important;
    width: 60px;
  }
</style>
