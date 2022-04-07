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
                  <th v-for="targetName of Object.keys(buildTasks)" :key="targetName" class="platform-name text-center">
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
                    <td class="text-center" v-for="task in buildTasks[targetName][tasks[0].index]" :key=task.id>
                      <q-skeleton style="margin-left: auto; margin-right: auto;" size="23px" type="circle" v-if="buildLoad"/>
                      <build-status-circle v-else :status="task.status" @click="openTaskLogs(task)"/>
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
                  <th>Actions</th>
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
                        v-for="pkg in sortTaskPackage(getTaskPackages(task))"
                        :key="pkg.name"
                      >
                        <div v-if="pkgNameSrc(pkg.name)" class="q-pb-sm q-pt-md">
                          <a class="text-tertiary" :href="pkg.downloadUrl">
                            {{ pkg.name }}
                          </a>
                          <q-separator/>
                        </div>
                        <a v-else class="text-tertiary" :href="pkg.downloadUrl">
                          {{ pkg.name }}
                        </a>
                      </div>
                    </td>
                    <td>
                      <q-btn
                        round
                        color="primary"
                        icon="restart_alt"
                        size="sm"
                        title="Restart build task tests"
                        @click="RestartTestTask(task.id)"/>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-card-section v-if="build.tasks[0].is_secure_boot">
        <q-chip>
          <q-avatar icon="shield" color="primary" text-color="white"/>
          Secure boot build
        </q-chip>
      </q-card-section>

      <q-card-section>
        <q-expansion-item label="Sign" expand-separator
                          icon="lock" v-if="signs.length">
          <q-card>
            <q-card-section>
              <q-item v-for="sign in this.signs" :key="sign.id">
                <q-item-section lines="1">
                  {{ signatureText(sign) }}
                </q-item-section>
                <q-item-section side lines="1">
                  <div class="text-grey-8 q-gutter-xs">
                    <q-btn v-if="sign.status === signStatus.FAILED" @click="showSignLog(sign)" icon="info" color="faded"
                            round flat>
                      <q-tooltip anchor="bottom right" self="top middle">
                        Sign Log
                      </q-tooltip>
                    </q-btn>
                    <q-btn v-if="sign.status === signStatus.FAILED" icon="cached" color="faded"
                      round flat @click="repeatSign(sign)">
                      <q-tooltip anchor="bottom right" self="top middle">
                      Re-sign
                      </q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>
      <q-card-section>
        <q-expansion-item label="Linked builds" expand-separator
                          icon="link" v-if="linked_builds">
          <q-card>
            <q-card-section v-for="linked_build in linked_builds" :key="linked_build">
              <q-item>
                 <router-link :to="`/build/${linked_build}`">
                  Build {{ linked_build }}
                 </router-link>
              </q-item>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>
      <q-card-section>
        <q-expansion-item label="Mock Options" expand-separator
                          icon="settings" v-if="mock_options">
          <q-card>
            <q-card-section>
              <q-item-section v-if="mock_options.with" style="font-size: 10pt; letter-spacing: 1pt;">
                --with '{{ mock_options.with.join(' ') }}'
              </q-item-section>
              <q-item-section v-if="mock_options.without" style="font-size: 10pt; letter-spacing: 1pt;">
                --without '{{ mock_options.without.join(' ') }}'
              </q-item-section>
              <q-item-section v-if="mock_options.target_arch" style="font-size: 10pt; letter-spacing: 1pt;">
                --target '{{ mock_options.target_arch }}'
              </q-item-section>
              <q-item-section v-if="mock_options.yum_exclude" style="font-size: 10pt; letter-spacing: 1pt;">
                -x '{{ mock_options.yum_exclude.join(' ') }}'
              </q-item-section>
              <q-item-section v-if="mock_options.definitions" style="font-size: 10pt; letter-spacing: 1pt;">
                <q-item-section v-for="name in Object.keys(mock_options.definitions)" :key="name">
                  --define '{{ name }} {{ mock_options.definitions[name] }}'
                </q-item-section>
              </q-item-section>
              <q-item-section v-if="mock_options.module_enable" style="font-size: 10pt; letter-spacing: 1pt;">
                enabled modules : {{ mock_options.module_enable.join(' ') }}
              </q-item-section>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn-dropdown label="Other Actions" color="primary" dropdown-icon="change_history"
                        style="width: 200px; height: 40px;">
          <q-list>
            <q-item clickable v-close-popup @click="sign_build = true" v-if="allowSignBuild">
              <q-item-section avatar>
                <q-avatar icon="lock"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Sign</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="onRebuildFailedItems" v-if="failedItems">
              <q-item-section avatar>
                <q-avatar icon="repeat"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Rebuild failed build items</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="add_to_distro = true" v-if="allowDistroModify">
              <q-item-section avatar>
                <q-avatar icon="playlist_add_check"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Add to a distribution</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="remove_from_distro = true" v-if="allowDistroModify">
              <q-item-section avatar>
                <q-avatar icon="delete_sweep"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Remove from a distribution</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="RestartBuildTests()" v-if="testingCompleted">
              <q-item-section avatar>
                <q-avatar icon="restart_alt"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Restart build tests</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="delete_build = true" v-if="allowDeleteBuild">
              <q-item-section avatar>
                <q-avatar icon="delete"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Delete build</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-card-actions>

    </q-card>
    <q-dialog v-model="add_to_distro">
      <q-card style="width: 400px;">
        <q-card-section>
          <div class="text-h6">Add to a distribution</div>
        </q-card-section>
        <q-card-section>
          <q-select v-model="current_distro" label="Choose distribution to add"
                    :options="existingDistros"/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat text-color="primary" label="Add" style="width: 150px"
                 :loading="loading"
                 @click="AddToDistribution">
          </q-btn>
          <q-btn :loading="loading" flat text-color="negative" label="Cancel"
                 v-close-popup @click="current_distro = []"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="remove_from_distro">
      <q-card style="width: 400px;">
        <q-card-section>
          <div class="text-h6">Remove from a distribution</div>
        </q-card-section>
        <q-card-section>
          <q-select v-model="current_distro" label="Choose distribution to add"
                    :options="existingDistros"/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat text-color="primary" label="Remove" style="width: 150px"
                 :loading="loading"
                 @click="RemoveFromDistribution"/>
          <q-btn flat text-color="negative" label="Cancel" :loading="loading"
                 v-close-popup @click="current_distro = []"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="delete_build">
      <q-card style="width: 400px;">
        <q-card-section>
          <div class="text-h6">Warning</div>
        </q-card-section>
        <q-card-section>
          You are going to delete build {{build.id}}, are you sure ?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat text-color="primary" label="Ok" style="width: 150px"
                 :loading="loading"
                 @click="deleteBuild"/>
          <q-btn flat text-color="negative" label="Cancel" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="sign_build">
      <q-card style="width: 400px;">
        <q-card-section>
          <div class="text-h6">Sign build</div>
        </q-card-section>
        <q-form @submit="signBuild">
          <q-card-section>
            <q-select v-model="current_sign" label="Choose PGP key"
                      :rules="[val => !!val || 'PGP key is required']"
                      :options="existingKeys"/>
          <span v-if="!testingCompleted" class="text-negative">
          <br/>
          <b>Warning:</b> the build testing is not finished yet. Are you sure you
          want to sign it?
        </span>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat text-color="primary" label="Sign" style="width: 150px"
                  :loading="loading"
                  type="submit">
            </q-btn>
            <q-btn flat text-color="negative" label="Cancel"
                  v-close-popup @click="current_sign = null"/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="sign_log">
      <q-card style="width: 400px;">
        <q-card-section>
          <div class="text-h6">Sign log</div>
        </q-card-section>
          <q-infinite-scroll
              ref="logContent"
              :style="{height: innerHeight - 150 + 'px'}"
              class="log-container" inline
          >
          <pre>{{ signLogText }}</pre>
          </q-infinite-scroll>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>

import { defineComponent } from 'vue'
import {exportFile, Loading, Notify} from 'quasar'
import BuildRef from 'components/BuildRef.vue'
import BuildStatusCircle from 'components/BuildStatusCircle.vue'
import { BuildStatus, TestStatus, SignStatus } from '../constants.js'
import axios from 'axios'

export default defineComponent({
  name: 'build-page',
  props: {
    buildId: String
  },
  data () {
    return {
      tab: 'summary',
      build: null,
      signs: [],
      reload: true,
      refreshTimer: null,
      linked_builds: null,
      sign_build: false,
      sign_log: false,
      add_to_distro: false,
      remove_from_distro: false,
      delete_build: false,
      loading: false,
      buildLoad: false,
      current_sign: null,
      current_distro: [],
      mock_options: null,
      signLogText: '',
      signStatus: SignStatus 
    }
  },
  watch: {
    $route (to, from) {
      this.loadBuildInfo(to.params.buildId)
    }
  },
  computed: {
    allowDistroModify () {
      let allow_modify = true
      for (let i=0; i < this.build.tasks.length; i++) {
        if (this.build.tasks[i].status < 2) {
          allow_modify = false
        }
      }
      return allow_modify
    },
    existingDistros () {
      return this.$store.state.distributions.distributions.map(distribution => {
        return {label: distribution.name, value: distribution.name}
      })
    },
    existingKeys () {
      return this.$store.state.keys.keys.map(key => {
        return {label: key.name, value: key.id}
      })
    },
    failedItems () {
      let rebuilt = false
      for (let task of this.build.tasks) {
        if (task.status < BuildStatus.COMPLETED) {
          rebuilt = false
          break
        }
        else if (task.status === BuildStatus.FAILED) {
          rebuilt = true
        }
      }
      return rebuilt
    },
    allowDeleteBuild () {
      let allow_delete = true
      for (let task of this.build.tasks) {
        if (task.status < BuildStatus.COMPLETED) {
          allow_delete = false
          break
        }
      }
      return allow_delete
    },
    testingCompleted () {
      let testing_completed = true
      for (let task of this.build.tasks) {
        if (task.status < BuildStatus.TEST_COMPLETED) {
          testing_completed = false
          break
        }
      }
      return testing_completed
    },
    allowSignBuild () {
      let allow_sign = true
      for (let task of this.build.tasks) {
        if (task.status < BuildStatus.COMPLETED) {
          allow_sign = false
          break
        }
      }
      return allow_sign
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
    changeStatus (task, status) {
      if (task.status < status) task.status = status
    },
    AddToDistribution () {
      this.loading = true
      this.$api.post(`/distro/add/${this.buildId}/${this.current_distro.label}/`)
        .then(() => {
          this.loading = false
          Notify.create({
            message: `Packages of build ${this.buildId} has been added to ${this.current_distro.label} distribution`,
            type: 'positive',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
          this.current_distro = []
        })
        .catch(error => {
          this.loading = false
          Notify.create({
            message: error.response.data.detail,
            type: 'negative',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
        })
    },
    RemoveFromDistribution () {
      this.loading = true
      this.$api.post(`/distro/remove/${this.buildId}/${this.current_distro.label}/`)
        .then(() => {
          this.loading = false
          Notify.create({
            message: `Packages of build ${this.buildId} has been removed to ${this.current_distro.label} distribution`,
            type: 'positive',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
          this.current_distro = []
        })
        .catch(error => {
          this.loading = false
          Notify.create({
            message: error.response.data.detail, type: 'negative',
            actions: [
                { label: 'Dismiss', color: 'white', handler: () => {} }
              ]})
        })
    },
    deleteBuild () {
      this.loading = true
      this.$api.delete(`/builds/${this.buildId}/remove`)
        .then(() => {
          this.loading = false
          Notify.create({
            message: `Build ${this.buildId} has been deleted`,
            type: 'positive',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
          this.$router.push('/')
        })
        .catch(error => {
          this.loading = false
          Notify.create({
            message: error.response.data.detail,
            type: 'negative',
            actions: [
                { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
        })
    },
    onRebuildFailedItems () {
      Loading.show()
      this.$api.patch(`/builds/${this.buildId}/restart-failed`, {})
        .then(() => {
          Loading.hide()
          Notify.create({
            message: `Failed build items scheduled for rebuilding`,
            type: 'positive',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
          this.loadBuildInfo(this.buildId)
        })
        .catch(error => {
          Loading.hide()
          Notify.create({
            message: error.response.data.detail,
            type: 'negative',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
          this.reload = true
        })
    },
    RestartBuildTests () {
      this.$api.put(`/tests/build/${this.buildId}/restart`)
        .then(() =>{
          Notify.create({
            message: `Build tests for build ${this.buildId} has been restarted`,
            type: 'positive',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
        })
    },
    RestartTestTask (taskId) {
      this.$api.put(`/tests/build_task/${taskId}/restart`)
        .then(() =>{
          Notify.create({
            message: `Build tests for build task ${taskId} has been restarted`,
            type: 'positive',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
        })
    },
    signBuild () {
      this.loading = true
      let request_body = { build_id: this.buildId, sign_key_id: this.current_sign.value }
      this.$api.post('/sign-tasks/', request_body)
        .then(response => {
          this.loading = false
          this.signs = [response.data]
          this.sign_build = false
          Notify.create({
            message: `Build ${this.buildId} is queued for signing`,
            type: 'positive',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
        })
        .catch(error => {
          this.loading = false
          Notify.create({
            message: error.response.data.detail,
            type: 'negative',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
        })      
    },
    showSignLog (sign){
      this.sign_log = true
      axios.get(sign.log_href)
        .then(response => {
          this.signLogText = response.data
        })
    },
    repeatSign (sign){
      this.loading = true
      let request_body = { build_id: this.buildId, sign_key_id: sign.sign_key.id }
      this.$api.post('/sign-tasks/', request_body)
        .then(response => {
          this.loading = false
          this.signs.push(response.data)
          Notify.create({
            message: `Build ${this.buildId} is queued for signing`,
            type: 'positive',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
        })
        .catch(error => {
          this.loading = false
          Notify.create({
            message: error.response.data.detail,
            type: 'negative',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
        })
    },
    loadBuildInfo (buildId) {
      this.reload = false
      this.linked_builds = null
      this.mock_options = null
      this.buildLoad = true
      Loading.show()
      this.$api.get(`/builds/${buildId}/`)
        .then(response => {
          this.build = response.data
          this.build.tasks.forEach(task => {
            if (task.status === BuildStatus.COMPLETED) {
              this.loadTestsInfo(task)
            }
          })
          this.loadSignInfo(buildId)
          if (this.build.mock_options) {
            this.mock_options = this.build.mock_options
          }
          if (this.build.linked_builds.length) {
            this.linked_builds = this.build.linked_builds
          }
          Loading.hide()
          this.buildLoad = false
          this.reload = true
        })
        .catch(error => {
          Loading.hide()
          this.buildLoad = false
          this.reload = true
        })
    },
    loadTestsInfo (task) {
      let count_failed = 0
      let tests_failed = false
      let test_started = false
      task.test_tasks.forEach(test => {
        switch (test.status) {
          case TestStatus.STARTED:
            test_started = true
            break;
          case TestStatus.FAILED:
            count_failed += 1
            tests_failed = true
            break;
          case TestStatus.COMPLETED:
            task.status = BuildStatus.TEST_COMPLETED
            break;
        }
      })
      if (tests_failed) {
         if (count_failed === task.test_tasks.length) {
          task.status = BuildStatus.ALL_TESTS_FAILED
         } else {
          task.status = BuildStatus.TEST_FAILED
         }
      }
      if (test_started) task.status = BuildStatus.TEST_STARTED
    },
    loadSignInfo (buildId) {
      this.$api.get(`sign-tasks/?build_id=${buildId}`)
        .then(response => {
          if (response.data.length) this.signs = response.data
        })
        .catch(error =>{})
    },
    signatureText (sign) {
      let status = SignStatus.text[sign.status]
      return `The build is ${status} with ${sign.sign_key.keyid} PGP key (${sign.sign_key.name})`
    },
    getTextStatus (task) {
      return BuildStatus.text[task.status]
    },
    getTaskCSS (task) {
        let css = ['cursor-pointer']
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
    downloadArtifact (artifact) {
      this.$api.get(`/artifacts/${artifact.id}/`)
        .then((response) => {
          exportFile(artifact.name, response.data.content)
        })
    },
    getProjectName(task){
      return task.ref.url.split('/').pop().split('.').shift()
    },
    openTaskLogs (task) {
      this.$router.push({ path:`/build/${this.buildId}/logs/${task.id}`,
                          query: { 
                                  project_name: this.getProjectName(task),
                                  arch: task.arch
                                  }})
    },
    openTestTaskLogs (buildId, taskId, revision) {
      this.$router.push(`/build/${buildId}/test_logs/${taskId}/${revision}`)
    },
    getTaskPackages (task) {
      return task.artifacts.filter(item => item.type === 'rpm').map(item => {
        let arch = task.arch
        if (item.name.includes('.src.')) {
          arch = 'src'
        }
        let debugSuffix = '-debug'
        if (!item.name.match(/-debug(info|source)/)) {
          debugSuffix = ''
        }
        item.downloadUrl = `${window.origin}/pulp/content/builds/${task.platform.name}-${arch}-${this.buildId}${debugSuffix}-br/Packages/${item.name[0].toLowerCase()}/${item.name}`
        return item
      })
    },
    sortTaskPackage (tasks) {
      tasks.sort((x,y) => { 
        return x.name.indexOf('src.rpm') !== -1 ? -1 : y.name.indexOf('src.rpm') !== -1 ? 1 : 0; 
      })
      return tasks
    },
    pkgNameSrc(name) {
      if (name.indexOf('src.rpm') === -1){
        return false
      }
      return true
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
