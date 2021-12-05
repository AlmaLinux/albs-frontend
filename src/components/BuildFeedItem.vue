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
              <th v-for="arch in platformArches[platform.name]" :key="arch" class="platform-name">
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
            <td
                v-for="target in getTaskTargets(task)"
                :key=target.id
                :class="getTaskCSS(target)"
            >
              <q-skeleton v-if="loading" width="25%" type="text" />
              <span v-else> {{ target.textStatus }} </span>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      <div class="col-2 text-tertiary creation-info">
        Created by <a :href="`mailto:${build.user.email}`">{{ build.user.username }}</a>
        <br/>
        at {{ buildCreatedTime }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent } from 'vue';
import { BuildStatus } from '../constants.js'
import BuildRef from 'components/BuildRef.vue';

export default defineComponent({
  name: 'BuildFeedItem',
  props: {
    build: Object,
    loading: Boolean
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
    platformArches () {
      let platforms = {}
      for (const task of this.build.tasks) {
        if (!platforms[task.platform.name]) {
          platforms[task.platform.name] = new Set()
        }
        if (!platforms[task.platform.name].has(task.arch)) {
          platforms[task.platform.name].add(task.arch)
        }
      }
      for (let platform of Object.keys(platforms)) {
        platforms[platform] = Array.from(platforms[platform]).sort()
      }
      return platforms
    },
    sortedTasks () {
      return JSON.parse(JSON.stringify(this.build.tasks)).sort((a, b) => (`${a.platform.name} ${a.arch}` > `${b.platform.name} ${b.arch}`) ? 1 : -1)
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
  methods: {
    getTaskCSS (task) {
        let css = []
        switch (task.status) {
          case BuildStatus.FAILED:
            css.push('text-negative', 'bg-red-1')
            break;
          case BuildStatus.IDLE:
            css.push('text-grey-6')
            break;
          case BuildStatus.STARTED:
            css.push('text-black-6')
            break;
          case BuildStatus.EXCLUDED:
            css.push('text-black-6')
            break;
          case BuildStatus.COMPLETED:
            css.push('text-green-7')
            break;
          case BuildStatus.TEST_FAILED:
            css.push('text-negative')
            break;
          case BuildStatus.ALL_TESTS_FAILED:
            css.push('text-negative')
            break;
          case BuildStatus.TEST_COMPLETED:
            css.push('text-green-7')
            break;
        }        
        return css
    },
    getTaskTargets (task) {
      let targets = []
      for (const buildTask of this.sortedTasks) {
        if (task.index === buildTask.index) {
            targets.push(Object.assign({}, buildTask, {textStatus: BuildStatus.text[buildTask.status]}))
        }
      }
      return targets
    }
  },
  components: {
    BuildRef
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

  /* First table header cell which contains "Show details" link */
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
