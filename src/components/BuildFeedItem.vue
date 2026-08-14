<template>
  <q-card square class="shadow-1">
    <q-card-section class="no-padding row">
      <div style="overflow-x: auto; min-width: 0" class="col-10">
        <div class="q-pt-sm q-pl-md" v-if="rpm_module">
          <span>
            <b>Built modules:&nbsp;</b>
          </span>
          <span>
            <b class="text-body2"> {{ nsvca(rpm_module) }} </b>
          </span>
        </div>
        <table class="text-left q-table horizontal-separator build-info-table">
          <thead>
            <tr>
              <th>
                <div class="row items-center no-wrap">
                  <q-checkbox
                    v-if="selectable"
                    size="xs"
                    class="q-ml-xs"
                    :model-value="selected"
                    :disable="!releasable"
                    :id="`bfi-qc-release-${build.id}`"
                    @update:model-value="$emit('toggleSelect', build)"
                  >
                    <q-tooltip> {{ selectionTooltip }} </q-tooltip>
                  </q-checkbox>
                  <q-btn
                    color="tertiary"
                    small
                    flat
                    class="q-pl-sm no-margin"
                    icon="info"
                    :to="{path: `/build/${build.id}`}"
                    label="details"
                    :id="`bfi-qb-details-${build.id}`"
                  />
                </div>
              </th>
              <template v-for="platform in buildPlatforms">
                <th
                  v-for="arch in platformArches[platform.name]"
                  :key="arch"
                  class="platform-name"
                >
                  {{ platform.name }} {{ arch }}
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in buildTasks" :key="task.id">
              <td>
                <buildRef
                  :buildRef="task.ref"
                  :show_cas="true"
                  :is_cas_authenticated="task.is_cas_authenticated"
                  :cas_hash="task.alma_commit_cas_hash"
                />
              </td>
              <td
                v-for="target in getTaskTargets(task)"
                :key="target.id"
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
        Created by
        <a :href="`mailto:${build.owner.email}`">{{ build.owner.username }}</a>
        <br />
        at {{ buildCreatedTime }}
      </div>
    </q-card-section>
    <q-card-section
      v-if="build.releaseStatus || showSignButton"
      class="no-padding row items-center"
    >
      <div class="col q-pt-sm q-pl-md q-pb-md">
        <q-skeleton
          style="width: 100px"
          v-if="loading && build.releaseStatus"
          type="text"
        />
        <div v-else-if="build.releaseStatus">
          <span class="text-bold"> Release status: </span>
          <span> {{ build.releaseStatus }} </span>
        </div>
      </div>
      <div
        class="col-auto row items-center q-pt-sm q-pr-md q-pb-md"
        v-if="showSignButton"
      >
        <q-btn
          dense
          no-caps
          size="sm"
          color="primary"
          icon="lock"
          label="Sign"
          class="q-px-sm"
          :id="`bfi-qb-sign-${build.id}`"
          @click="$emit('sign', build)"
        >
          <q-tooltip> {{ signTooltip }} </q-tooltip>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
  import {defineComponent} from 'vue'
  import {BuildStatus} from '../constants.js'
  import BuildRef from 'components/BuildRef.vue'
  import {
    getTaskCSS,
    isBuildFinished,
    isBuildSignable,
    isBuildSigned,
    lastSignStatus,
    nsvca,
    sortByArches,
  } from '../utils'
  import {SignStatus} from '../constants.js'

  export default defineComponent({
    name: 'BuildFeedItem',
    props: {
      build: Object,
      loading: Boolean,
      selected: Boolean,
      selectable: Boolean,
    },
    emits: ['sign', 'toggleSelect'],
    computed: {
      buildFinished() {
        return isBuildFinished(this.build)
      },
      buildSigned() {
        return isBuildSigned(this.build)
      },
      // Signing is only offered for builds that still need it: never signed,
      // or the previous attempt failed. Signed, released and currently
      // being signed builds have nothing left to do.
      showSignButton() {
        return (
          this.$store.getters.isAuthenticated && isBuildSignable(this.build)
        )
      },
      // A build can only be put into a release once it is built and signed,
      // the very same conditions the release build selector enforces.
      releasable() {
        return this.buildFinished && this.buildSigned
      },
      signTooltip() {
        return lastSignStatus(this.build) === SignStatus.FAILED
          ? `Signing of build ${this.build.id} failed, click to sign it again`
          : `Sign build ${this.build.id}`
      },
      selectionTooltip() {
        if (!this.buildFinished) {
          return `Build ${this.build.id} is not finished yet and cannot be released`
        }
        if (!this.buildSigned) {
          return `Build ${this.build.id} is not signed and cannot be released`
        }
        return `Select build ${this.build.id} for a release`
      },
      buildPlatforms() {
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
      platformArches() {
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
          platforms[platform] = Array.from(platforms[platform]).sort(
            this.sortByArches
          )
        }

        return platforms
      },
      sortedTasks() {
        return JSON.parse(JSON.stringify(this.build.tasks)).sort((a, b) =>
          a.id > b.id ? 1 : -1
        )
      },
      sortedLines() {
        return JSON.parse(JSON.stringify(this.build.tasks)).sort((a, b) =>
          `${a.platform.name} ${a.arch}` > `${b.platform.name} ${b.arch}`
            ? 1
            : -1
        )
      },
      buildTasks() {
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
      buildCreatedTime() {
        return new Date(this.build.created_at).toLocaleString()
      },
      rpm_module() {
        for (const task of this.build.tasks) {
          if (task.arch === 'src') continue
          if (task.rpm_modules) {
            return task.rpm_modules[0]
          }
        }
        return false
      },
    },
    methods: {
      sortByArches: sortByArches,
      getTaskCSS: getTaskCSS,
      nsvca: nsvca,
      getTaskTargets(task) {
        let targets = []
        for (const buildTask of this.sortedLines) {
          if (task.index === buildTask.index) {
            targets.push(
              Object.assign({}, buildTask, {
                textStatus: BuildStatus.text[buildTask.status],
              })
            )
          }
        }
        let platformTargets = {}
        for (let target of targets) {
          if (!platformTargets[target.platform.name]) {
            platformTargets[target.platform.name] = []
          }
          platformTargets[target.platform.name].push(target)
        }
        targets = []
        for (let platform of Object.keys(platformTargets)) {
          targets = targets.concat(
            platformTargets[platform].sort((a, b) => {
              return this.sortByArches(a.arch, b.arch)
            })
          )
        }
        return targets
      },
    },
    components: {
      BuildRef,
    },
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
