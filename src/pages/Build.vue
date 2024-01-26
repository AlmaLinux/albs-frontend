<template>
  <div class="q-pa-md row items-start q-gutter-md justify-center" v-if="build">
    <span> </span>
    <!--<deploy-tool-link-window ref="deployToolWindow" :build_id="build_id"/>-->

    <q-card flat>
      <q-card-section class="text-h6 text-center">
        <router-link :to="{path: `/build/${build.id}`}">
          Build {{ build.id }}
        </router-link>
        created by
        <a :href="`mailto:${build.owner.email}`">{{ build.owner.username }}</a>
        at {{ buildCreatedTime }}
      </q-card-section>

      <q-card-section>
        <q-tabs v-model="tab" id="bui-qt-tab-menu">
          <q-tab name="summary" label="Summary" />
          <q-tab
            v-for="target of Object.keys(buildTasks)"
            :name="target"
            :label="target"
            :key="target"
          />
        </q-tabs>
        <q-tab-panels v-model="tab">
          <q-tab-panel name="summary">
            <div
              class="q-pl-md"
              v-if="rpm_module && Object.keys(rpm_module).length !== 0"
            >
              <span class="row">
                <b>Built modules:&nbsp;</b>
              </span>
              <span class="row q-pl-sm">
                <b class="text-body2">
                  {{ nsvca(rpm_module[Object.keys(rpm_module)[0]]) }}
                </b>
              </span>
            </div>
            <table
              class="text-left q-table horizontal-separator build-info-table"
            >
              <thead>
                <tr>
                  <th />
                  <th
                    v-for="targetName of Object.keys(buildTasks)"
                    :key="targetName"
                    class="platform-name text-center"
                  >
                    {{ targetName }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tasks in buildTasksByIndex" :key="tasks[0].index">
                  <td>
                    <buildRef
                      :buildRef="tasks[0].ref"
                      :show_cas="true"
                      :is_cas_authenticated="tasks[0].is_cas_authenticated"
                      :cas_hash="tasks[0].alma_commit_cas_hash"
                    />
                  </td>
                  <template
                    v-for="targetName of Object.keys(buildTasks)"
                    :key="targetName"
                  >
                    <td
                      class="text-center"
                      v-for="task in buildTasks[targetName][tasks[0].index]"
                      :key="task.id"
                    >
                      <q-skeleton
                        style="margin-left: auto; margin-right: auto"
                        size="23px"
                        type="circle"
                        v-if="buildLoad"
                      />
                      <build-status-circle
                        v-else
                        :status="task.status"
                        @click="openTaskLogs(task)"
                      />
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
            <div
              class="q-pl-md"
              v-if="rpm_module && Object.keys(rpm_module).length !== 0"
            >
              <span class="row">
                <b>Built modules:&nbsp;</b>
              </span>
              <span class="row q-pl-sm">
                <b class="text-body2">
                  {{ nsvca(rpm_module[target], target.split('.')[1]) }}
                </b>
              </span>
            </div>
            <table
              class="text-left q-table horizontal-separator build-info-table"
            >
              <thead>
                <tr>
                  <th />
                  <th>Status</th>
                  <th>Packages</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tasks in buildTasksByIndex" :key="tasks[0].index">
                  <td>
                    <buildRef
                      :buildRef="tasks[0].ref"
                      :show_cas="true"
                      :is_cas_authenticated="tasks[0].is_cas_authenticated"
                      :cas_hash="tasks[0].alma_commit_cas_hash"
                    />
                  </td>
                  <template
                    v-for="task in buildTasks[target][tasks[0].index]"
                    :key="task.id"
                  >
                    <td
                      :class="getTaskCSS(task)"
                      @click="openTaskLogs(task)"
                      :id="`bui-tm-task-${task.id}-status`"
                    >
                      {{ getTextStatus(task) }}
                    </td>
                    <td>
                      <div
                        v-for="pkg in sortTaskPackage(getTaskPackages(task))"
                        :key="pkg.name"
                        class="row"
                      >
                        <div
                          v-if="pkgNameSrc(pkg.name)"
                          class="q-pb-sm q-pt-md"
                        >
                          <a class="text-tertiary" :href="pkg.downloadUrl">
                            {{ pkg.name }}
                          </a>
                          <q-separator />
                        </div>
                        <a v-else class="text-tertiary" :href="pkg.downloadUrl">
                          {{ pkg.name }}
                        </a>
                        <q-badge
                          color="white"
                          align="bottom"
                          class="cursor-pointer"
                        >
                          <q-icon
                            v-if="pkg.cas_hash"
                            size="xs"
                            name="key"
                            color="primary"
                            @click="copyToClipboard(pkg.cas_hash)"
                          >
                            <q-tooltip class="text-center">
                              {{ pkg.cas_hash }} <br />
                              (click to copy)
                            </q-tooltip>
                          </q-icon>
                          <q-icon
                            v-else
                            size="xs"
                            name="key_off"
                            color="negative"
                          >
                            <q-tooltip> Package is not notarized </q-tooltip>
                          </q-icon>
                        </q-badge>
                      </div>
                    </td>
                    <td class="text-center">
                      <div class="q-gutter-xs">
                        <q-btn
                          round
                          color="primary"
                          icon="settings"
                          size="sm"
                          title="Show mock options"
                          v-if="checkMockOptions(task)"
                          @click="showMock(task)"
                        />
                        <q-btn
                          round
                          color="primary"
                          icon="restart_alt"
                          size="sm"
                          title="Restart build task tests"
                          v-if="buildFinished && userAuthenticated()"
                          @click="restartTestTask(task.id)"
                        />
                      </div>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
            <q-card-section class="no-padding">
              <q-expansion-item
                label="Repositories"
                expand-separator
                icon="storage"
                id="bui-qe-exp-repos"
              >
                <q-card>
                  <q-card-section
                    v-for="repo in buildRepos(target)"
                    :key="repo"
                    class="no-padding"
                  >
                    <q-item dense>
                      <a :href="repo" target="_blank" class="q-pl-md">
                        {{ repo }}
                      </a>
                    </q-item>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </q-card-section>

            <q-btn
              color="primary"
              icon="description"
              label="Modules yaml"
              v-if="rpm_module && Object.keys(rpm_module).length !== 0"
              :loading="moduleYamlLoad"
              @click="onModuleYaml(target)"
            >
            </q-btn>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-card-section>
        <q-chip v-if="build.tasks[0].is_secure_boot">
          <q-avatar icon="shield" color="primary" text-color="white" />
          Secure boot build
        </q-chip>
        <q-chip v-if="build.released">
          <q-avatar
            icon="cloud"
            color="green-8"
            text-color="white"
            :class="build.release_id ? 'cursor-pointer' : ''"
            @click="goToRelease()"
          />
          Released
          <q-tooltip v-if="build.release_id">
            Click to the cloud to see last release
          </q-tooltip>
        </q-chip>
      </q-card-section>

      <q-card-section v-if="build.products.length">
        <q-expansion-item label="Products" expand-separator icon="list">
          <q-item v-for="product in build.products" :key="product.id">
            <router-link :to="`/product/${product.id}`">
              {{ product.name }}
            </router-link>
          </q-item>
        </q-expansion-item>
      </q-card-section>

      <q-card-section v-if="signs.length">
        <q-expansion-item label="Sign" expand-separator icon="lock">
          <q-card>
            <q-card-section>
              <q-item v-for="sign in this.signs" :key="sign.id">
                <q-item-section lines="1">
                  {{ signatureText(sign) }}
                </q-item-section>
                <q-item-section side lines="1">
                  <div class="text-grey-8 q-gutter-xs">
                    <q-btn
                      v-if="sign.status === signStatus.FAILED"
                      @click="showSignLog(sign)"
                      icon="info"
                      color="faded"
                      round
                      flat
                    >
                      <q-tooltip anchor="bottom right" self="top middle">
                        Sign Log
                      </q-tooltip>
                    </q-btn>
                    <q-btn
                      v-if="
                        sign.status === signStatus.FAILED && userAuthenticated()
                      "
                      icon="cached"
                      color="faded"
                      round
                      flat
                      @click="repeatSign(sign)"
                    >
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
      <q-card-section v-if="linked_builds">
        <q-expansion-item label="Linked builds" expand-separator icon="link">
          <q-card>
            <q-card-section
              v-for="linked_build in linked_builds"
              :key="linked_build"
            >
              <q-item>
                <router-link :to="`/build/${linked_build}`">
                  Build {{ linked_build }}
                </router-link>
              </q-item>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>
      <q-card-section
        v-if="mock_options && Object.keys(mock_options).length !== 0"
      >
        <q-expansion-item
          label="Global Mock Options"
          expand-separator
          icon="settings"
        >
          <q-card class="mock-options">
            <q-card-section>
              <q-item-section v-if="mock_options.with">
                --with '{{ mock_options.with.join(' ') }}'
              </q-item-section>
              <q-item-section v-if="mock_options.without">
                --without '{{ mock_options.without.join(' ') }}'
              </q-item-section>
              <q-item-section v-if="mock_options.target_arch">
                --target '{{ mock_options.target_arch }}'
              </q-item-section>
              <q-item-section v-if="mock_options.yum_exclude">
                -x '{{ mock_options.yum_exclude.join(' ') }}'
              </q-item-section>
              <q-item-section v-if="mock_options.definitions">
                <q-item-section
                  v-for="name in Object.keys(mock_options.definitions)"
                  :key="name"
                >
                  --define '{{ name }} {{ mock_options.definitions[name] }}'
                </q-item-section>
              </q-item-section>
              <q-item-section v-if="mock_options.module_enable">
                enabled modules : {{ mock_options.module_enable.join(' ') }}
              </q-item-section>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>
      <q-card-actions align="right" v-if="userAuthenticated()">
        <q-btn-dropdown
          label="Other Actions"
          color="primary"
          dropdown-icon="change_history"
          style="width: 200px; height: 40px"
        >
          <q-list>
            <q-item
              clickable
              v-close-popup
              @click="sign_build = true"
              v-if="buildFinished"
            >
              <q-item-section avatar>
                <q-avatar icon="lock" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Sign</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="onRebuildFailedItems(false)"
              v-if="failedItems"
            >
              <q-item-section avatar>
                <q-avatar icon="repeat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Rebuild failed build items</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="onRebuildFailedItems(true)"
              v-if="failedItems"
            >
              <q-item-section avatar>
                <q-avatar icon="repeat" />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  >Rebuild failed build items in parallel</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="add_to_product = true"
              v-if="allowProductModify"
            >
              <q-item-section avatar>
                <q-avatar icon="playlist_add_check" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Add to a product</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="remove_from_product = true"
              v-if="allowProductModify"
            >
              <q-item-section avatar>
                <q-avatar icon="delete_sweep" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Remove from a product</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="restartBuildTests()"
              v-if="testingCompleted"
            >
              <q-item-section avatar>
                <q-avatar icon="restart_alt" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Restart build tests</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="stop_build = true"
              v-if="!buildFinished"
            >
              <q-item-section avatar>
                <q-avatar icon="stop" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stop build</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="cancel_testing = true"
              v-if="!testingCompleted && !build.cancel_testing"
            >
              <q-item-section avatar>
                <q-avatar icon="cancel" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Cancel testing</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="delete_build = true"
              v-if="buildFinished"
            >
              <q-item-section avatar>
                <q-avatar icon="delete" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Delete build</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-card-actions>
    </q-card>
    <q-dialog v-model="taskMock">
      <q-card style="showMockStyle()" v-if="selectedTask">
        <q-card-section class="bg-primary shadow-2">
          <div class="text-h6 text-white text-center ref-link-white">
            <buildRef :buildRef="selectedTask.ref" cssClass="ref-link-white" />
          </div>
        </q-card-section>
        <mock-options-show :mock_options="selectedTask.mock_options" />
        <q-card-actions align="right">
          <!-- prettier-ignore -->
          <q-btn
            flat
            text-color="negative"
            label="Close"
            @click="selectedTask = null; taskMock = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="add_to_product">
      <q-card style="width: 400px">
        <q-card-section>
          <div class="text-h6">Add to a product</div>
        </q-card-section>
        <q-form @submit="addToProduct">
          <q-card-section>
            <q-select
              v-model="current_product"
              label="Choose product to add to"
              :rules="[(val) => !!val || 'Product name is required']"
              :options="addableProducts"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              flat
              text-color="primary"
              label="Add"
              style="width: 150px"
              :loading="loading"
              type="submit"
            >
            </q-btn>
            <q-btn
              flat
              text-color="negative"
              label="Cancel"
              v-close-popup
              @click="current_product = null"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog v-model="remove_from_product">
      <q-card style="width: 400px">
        <q-card-section>
          <div class="text-h6">Remove from a product</div>
        </q-card-section>
        <q-form @submit="removeFromProduct">
          <q-card-section>
            <q-select
              v-model="current_product"
              label="Choose product to remove from"
              :rules="[(val) => !!val || 'Product name is required']"
              :options="removableProducts"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              flat
              text-color="primary"
              label="Remove"
              style="width: 150px"
              :loading="loading"
              type="submit"
            />
            <q-btn
              flat
              text-color="negative"
              label="Cancel"
              v-close-popup
              @click="current_product = null"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog v-model="delete_build">
      <q-card style="width: 400px">
        <q-card-section>
          <div class="text-h6">Warning</div>
        </q-card-section>
        <q-card-section>
          You are going to delete build {{ build.id }}, are you sure ?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            text-color="primary"
            label="Ok"
            style="width: 150px"
            :loading="loading"
            @click="deleteBuild"
          />
          <q-btn flat text-color="negative" label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="stop_build">
      <q-card style="width: 400px">
        <q-card-section>
          <div class="text-h6">Warning</div>
        </q-card-section>
        <q-card-section>
          You are going to stop build {{ build.id }}, are you sure ?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            text-color="primary"
            label="Ok"
            style="width: 150px"
            :loading="loading"
            @click="stopBuild"
          />
          <q-btn flat text-color="negative" label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="cancel_testing">
      <q-card style="width: 400px">
        <q-card-section>
          <div class="text-h6">Warning</div>
        </q-card-section>
        <q-card-section>
          You are about to cancel the testing of build {{ build.id }}. All tests
          will be cancelled, including currently running ones, are you sure?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            text-color="primary"
            label="Ok"
            style="width: 150px"
            :loading="loading"
            @click="cancelTesting"
          />
          <q-btn flat text-color="negative" label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="sign_build">
      <q-card style="width: 400px">
        <q-card-section>
          <div class="text-h6">Sign build</div>
        </q-card-section>
        <q-form @submit="signBuild">
          <q-card-section>
            <q-select
              v-model="current_sign"
              label="Choose PGP key"
              :rules="[(val) => !!val || 'PGP key is required']"
              :options="existingKeys"
            />
            <span v-if="!testingCompleted" class="text-negative">
              <br />
              <b>Warning:</b> the build testing is not finished yet. Are you
              sure you want to sign it?
            </span>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              flat
              text-color="primary"
              label="Sign"
              style="width: 150px"
              :loading="loading"
              type="submit"
            >
            </q-btn>
            <q-btn
              flat
              text-color="negative"
              label="Cancel"
              v-close-popup
              @click="current_sign = null"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="sign_log">
      <q-card style="max-width: 900px">
        <q-card-section>
          <div class="text-h6">Sign log</div>
        </q-card-section>
        <q-card-section>
          <div class="row justify-center q-pt-none log-container">
            <q-infinite-scroll
              :style="{height: innerHeight - 350 + 'px'}"
              inline
            >
              <pre>{{ signLogText }}</pre>
            </q-infinite-scroll>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            text-color="primary"
            label="Ok"
            style="width: 150px"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <module-yaml ref="showModuleYaml" />
  </div>
</template>

<script>
  import {defineComponent} from 'vue'
  import {exportFile, Loading, Notify} from 'quasar'
  import BuildRef from 'components/BuildRef.vue'
  import BuildStatusCircle from 'components/BuildStatusCircle.vue'
  import ModuleYaml from 'components/ModuleYaml.vue'
  import MockOptionsShow from 'components/MockOptionsShow.vue'
  import {BuildStatus, TestStatus, SignStatus} from '../constants.js'
  import {
    getTaskCSS,
    nsvca,
    copyToClipboard,
    deepDiff,
    isEmptyObject,
  } from '../utils'
  import axios from 'axios'

  export default defineComponent({
    name: 'build-page',
    props: {
      buildId: String,
    },
    data() {
      return {
        tab: 'summary',
        build: null,
        rpm_module: {},
        signs: [],
        reload: true,
        refreshTimer: null,
        linked_builds: null,
        sign_build: false,
        sign_log: false,
        add_to_product: false,
        remove_from_product: false,
        delete_build: false,
        stop_build: false,
        cancel_testing: false,
        loading: false,
        buildLoad: false,
        moduleYamlLoad: false,
        current_sign: null,
        current_product: null,
        mock_options: null,
        selectedTask: null,
        taskMock: false,
        signLogText: '',
        signStatus: SignStatus,
        previousBuildInfo: null,
        previousProducts: null,
      }
    },
    computed: {
      innerHeight: function () {
        return window.innerHeight
      },
      allowProductModify() {
        let allow_modify = true
        for (let i = 0; i < this.build.tasks.length; i++) {
          if (this.build.tasks[i].status < 2) {
            allow_modify = false
          }
        }
        return allow_modify
      },
      existingProducts() {
        return this.$store.state.products.products.map((product) => {
          return {label: product.name, value: product.name}
        })
      },
      addableProducts() {
        return this.existingProducts.filter((product) => {
          return !this.build.products.find((p) => p.name === product.label)
        })
      },
      removableProducts() {
        return this.existingProducts.filter((product) => {
          return this.build.products.find((p) => p.name === product.label)
        })
      },
      existingKeys() {
        return this.$store.state.keys.keys.map((key) => {
          return {label: key.name, value: key.id}
        })
      },
      failedItems() {
        let rebuilt = false
        for (let task of this.build.tasks) {
          if (task.status < BuildStatus.COMPLETED) {
            rebuilt = false
            break
          } else if (task.status === BuildStatus.FAILED) {
            rebuilt = true
          }
        }
        return rebuilt
      },
      testingCompleted() {
        let testing_completed = true
        for (let task of this.build.tasks) {
          if (task.status < BuildStatus.TEST_COMPLETED) {
            testing_completed = false
            break
          }
        }
        return testing_completed
      },
      buildFinished() {
        let build_finished = true
        for (let task of this.build.tasks) {
          if (task.status < BuildStatus.COMPLETED) {
            build_finished = false
          }
        }
        return build_finished
      },
      buildTargets() {
        let targetsSet = new Set()
        let targets = []
        for (const task of this.build.tasks) {
          const targetKey = `${task.platform.name}.${task.arch}`
          if (targetsSet.has(targetKey)) {
            continue
          }
          targetsSet.add(targetKey)
          targets.push({
            name: task.platform.name,
            arch: task.arch,
            key: targetKey,
          })
        }
        return targets
      },
      buildTasks() {
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
            response[sortX][sortY].sort((a, b) => (a.id > b.id ? 1 : -1))
          }
        }
        // TODO: sort here should use platform arch build order, instead
        //       of alphabetical.
        const ordered = Object.keys(response)
          .sort()
          .reduce((obj, key) => {
            obj[key] = response[key]
            return obj
          }, {})
        return ordered
      },
      buildTasksByIndex() {
        return this.buildTasks[Object.keys(this.buildTasks)[0]]
      },
      buildCreatedTime() {
        return new Date(this.build.created_at).toLocaleString()
      },
    },
    created() {
      this.loadBuildInfo(this.buildId)
      // update the build state every minute
      this.refreshTimer = setInterval(() => {
        if (this.reload) {
          this.previousProducts = this.build.products
          this.loadBuildInfo(this.buildId)
        }
      }, 60000)
      // don't forget clear the timer while leaving the page
    },
    beforeUnmount() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    watch: {
      '$route.params': 'loadLinkedBuildInfo',
    },
    methods: {
      loadLinkedBuildInfo(params) {
        this.loadBuildInfo(params.buildId)
      },
      copyToClipboard: copyToClipboard,
      getTaskCSS: getTaskCSS,
      nsvca: nsvca,
      userAuthenticated() {
        return this.$store.getters.isAuthenticated
      },
      addToProduct() {
        this.loading = true
        this.$api
          .post(`/products/add/${this.buildId}/${this.current_product.label}/`)
          .then((res) => {
            this.loading = false
            this.add_to_product = false
            Notify.create({
              message: res.data.message,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
            this.current_product = null
          })
          .catch((error) => {
            this.loading = false
            Notify.create({
              message: error.response.data.detail,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
      removeFromProduct() {
        this.loading = true
        this.$api
          .post(
            `/products/remove/${this.buildId}/${this.current_product.label}/`
          )
          .then((res) => {
            this.loading = false
            this.remove_from_product = false
            Notify.create({
              message: res.data.message,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
            this.current_product = null
          })
          .catch((error) => {
            this.loading = false
            Notify.create({
              message: error.response.data.detail,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
      deleteBuild() {
        this.loading = true
        this.$api
          .delete(`/builds/${this.buildId}/remove`)
          .then(() => {
            this.loading = false
            Notify.create({
              message: `Build ${this.buildId} has been deleted`,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
            this.$router.push('/')
          })
          .catch((error) => {
            this.loading = false
            Notify.create({
              message: error.response.data.detail,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
      stopBuild() {
        this.loading = true
        this.stop_build = false
        this.$api
          .patch(`/builds/${this.buildId}/cancel`)
          .then(() => {
            this.loading = false
            Notify.create({
              message: `Build ${this.buildId} has been stopped`,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
          .catch((error) => {
            this.loading = false
            Notify.create({
              message: error.response.data.detail,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
      cancelTesting() {
        this.loading = true
        this.cancel_testing = false
        this.$api
          .put(`/tests/build/${this.buildId}/cancel`)
          .then(() => {
            this.loading = false
            Notify.create({
              message: `Test tasks for build ${this.buildId} have been cancelled`,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
            this.build.cancel_testing = true
          })
          .catch((error) => {
            this.loading = false
            Notify.create({
              message: error.response.data.detail,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
      onRebuildFailedItems(parallelMode) {
        Loading.show()
        let endpoint = parallelMode
          ? `/builds/${this.buildId}/parallel-restart-failed`
          : `/builds/${this.buildId}/restart-failed`
        this.$api
          .patch(endpoint, {})
          .then(() => {
            Loading.hide()
            Notify.create({
              message: `Failed build items scheduled for rebuilding`,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
            this.loadBuildInfo(this.buildId)
          })
          .catch((error) => {
            Loading.hide()
            Notify.create({
              message: error.response.data.detail,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
            this.reload = true
          })
      },
      restartBuildTests() {
        this.$api.put(`/tests/build/${this.buildId}/restart`).then(() => {
          Notify.create({
            message: `Build tests for build ${this.buildId} has been restarted`,
            type: 'positive',
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
        })
      },
      restartTestTask(taskId) {
        this.$api.put(`/tests/build_task/${taskId}/restart`).then(() => {
          Notify.create({
            message: `Build tests for build task ${taskId} has been restarted`,
            type: 'positive',
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
        })
      },
      signBuild() {
        this.loading = true
        let request_body = {
          build_id: this.buildId,
          sign_key_id: this.current_sign.value,
        }
        this.$api
          .post('/sign-tasks/', request_body)
          .then((response) => {
            this.loading = false
            this.signs = [response.data]
            this.sign_build = false
            Notify.create({
              message: `Build ${this.buildId} is queued for signing`,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
          .catch((error) => {
            this.loading = false
            Notify.create({
              message: error.response.data.detail,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
      showSignLog(sign) {
        this.sign_log = true
        if (sign.log_href) {
          axios.get(sign.log_href).then((response) => {
            this.signLogText = response.data
          })
        } else {
          this.signLogText = sign.error_message
        }
      },
      repeatSign(sign) {
        this.loading = true
        let request_body = {
          build_id: this.buildId,
          sign_key_id: sign.sign_key.id,
        }
        this.$api
          .post('/sign-tasks/', request_body)
          .then((response) => {
            this.loading = false
            this.signs.push(response.data)
            Notify.create({
              message: `Build ${this.buildId} is queued for signing`,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
          .catch((error) => {
            this.loading = false
            Notify.create({
              message: error.response.data.detail,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
      renderBuildInfo() {
        this.reload = false
        this.linked_builds = null
        this.mock_options = null
        this.buildLoad = true
        Loading.show()

        this.build.tasks.forEach((task) => {
          if (task.rpm_module) {
            this.rpm_module[`${task.platform.name}.${task.arch}`] =
              task.rpm_module
          }
          if (task.status === BuildStatus.COMPLETED) {
            this.loadTestsInfo(task)
          }
        })
        this.loadSignInfo(this.build.id)
        if (this.build.mock_options) {
          this.mock_options = this.build.mock_options
        }
        if (this.build.linked_builds.length) {
          this.linked_builds = this.build.linked_builds
        }
        Loading.hide()
        this.buildLoad = false
        this.reload = true
        if (this.previousProducts) {
          if (this.previousProducts.length != this.build.products.length) {
            let previousProducts = this.previousProducts.map((p) => p.name)
            let currentProducts = this.build.products.map((p) => p.name)
            let addedProducts = currentProducts.filter(
              (p) => !previousProducts.includes(p)
            )
            let removedProducts = previousProducts.filter(
              (p) => !currentProducts.includes(p)
            )
            if (addedProducts.length) {
              let msg = `Build successfully added to ${addedProducts.join(', ')} product(s)`
              Notify.create({
                message: msg,
                type: 'positive',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            }
            if (removedProducts.length) {
              let msg = `Build successfully removed from ${removedProducts.join(', ')} product(s)`
              Notify.create({
                message: msg,
                type: 'positive',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            }
          }
        }
      },
      loadBuildInfo(buildId) {
        this.reload = false
        if (!this.build) Loading.show()
        this.$api
          .get(`/builds/${buildId}/`)
          .then((response) => {
            this.reload = true
            let buildInfo = response.data
            if (!this.previousBuildInfo) {
              this.build = buildInfo
              this.previousBuildInfo = JSON.parse(JSON.stringify(buildInfo))
              this.renderBuildInfo()
            } else {
              let changes = deepDiff(
                JSON.parse(JSON.stringify(buildInfo)),
                JSON.parse(JSON.stringify(this.previousBuildInfo))
              )
              // This can be handled in a more fine grained way, because not all
              // the changes mean that we need to reload. In any case, this
              // approach already saves the user from waiting for unnecessary
              // build page reloads
              if (!isEmptyObject(changes)) {
                this.build = buildInfo
                this.previousBuildInfo = JSON.parse(JSON.stringify(buildInfo))
                this.renderBuildInfo()
              }
            }
          })
          .catch((error) => {
            Loading.hide()
            this.buildLoad = false
            this.reload = true
          })
      },
      loadTestsInfo(task) {
        let count_failed = 0
        let tests_failed = false
        let test_started = false
        let latest_revision = Math.max(
          ...task.test_tasks.map((t) => t.revision)
        )
        let latest_test_tasks = task.test_tasks.filter(
          (t) => t.revision === latest_revision
        )
        latest_test_tasks.forEach((test) => {
          switch (test.status) {
            case TestStatus.STARTED:
              test_started = true
              break
            case TestStatus.FAILED:
              count_failed += 1
              tests_failed = true
              break
            case TestStatus.COMPLETED:
              task.status = BuildStatus.TEST_COMPLETED
              break
            case TestStatus.CANCELLED:
              task.status = BuildStatus.TEST_CANCELLED
              break
          }
        })
        if (tests_failed) {
          if (count_failed === latest_test_tasks.length) {
            task.status = BuildStatus.ALL_TESTS_FAILED
          } else {
            task.status = BuildStatus.TEST_FAILED
          }
        }
        if (test_started) task.status = BuildStatus.TEST_STARTED
      },
      loadSignInfo(buildId) {
        this.$api
          .get(`sign-tasks/?build_id=${buildId}`)
          .then((response) => {
            if (response.data.length) this.signs = response.data
          })
          .catch((error) => {
            Notify.create({
              message: `Failed to load sign info`,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
      signatureText(sign) {
        let status = SignStatus.text[sign.status]
        return `The build is ${status} with ${sign.sign_key.keyid} PGP key (${sign.sign_key.name})`
      },
      getTextStatus(task) {
        return BuildStatus.text[task.status]
      },
      buildRepos(platform) {
        let [platformName, arch] = platform.split('.')
        let repos = [
          `${window.origin}/pulp/content/builds/${platformName}-src-${this.buildId}-br/`,
          `${window.origin}/pulp/content/builds/${platformName}-${arch}-${this.buildId}-br/`,
          `${window.origin}/pulp/content/builds/${platformName}-${arch}-${this.buildId}-debug-br/`,
        ]
        return repos
      },
      downloadArtifact(artifact) {
        this.$api.get(`/artifacts/${artifact.id}/`).then((response) => {
          exportFile(artifact.name, response.data.content)
        })
      },
      getProjectName(task) {
        return task.ref.url.split('/').pop().split('.').shift()
      },
      openTaskLogs(task) {
        this.$router.push({
          path: `/build/${this.buildId}/logs/${task.id}`,
          query: {
            project_name: this.getProjectName(task),
            arch: task.arch,
          },
        })
      },
      openTestTaskLogs(buildId, taskId, revision) {
        this.$router.push(`/build/${buildId}/test_logs/${taskId}/${revision}`)
      },
      getTaskPackages(task) {
        return task.artifacts
          .filter((item) => item.type === 'rpm')
          .map((item) => {
            let arch = task.arch
            if (item.name.includes('.src.')) {
              arch = 'src'
            }
            let debugSuffix = '-debug'
            if (!item.name.match(/-debug(info|source)-/)) {
              debugSuffix = ''
            }
            item.downloadUrl = `${window.origin}/pulp/content/builds/${task.platform.name}-${arch}-${this.buildId}${debugSuffix}-br/Packages/${item.name[0].toLowerCase()}/${item.name}`
            return item
          })
      },
      sortTaskPackage(tasks) {
        tasks.sort((x, y) => {
          return x.name.indexOf('src.rpm') !== -1
            ? -1
            : y.name.indexOf('src.rpm') !== -1
              ? 1
              : 0
        })
        return tasks
      },
      pkgNameSrc(name) {
        if (name.indexOf('src.rpm') === -1) {
          return false
        }
        return true
      },
      onModuleYaml(target) {
        this.moduleYamlLoad = true
        let platform = target.split('.')[0]
        let modules_url = `${window.origin}/pulp/content/builds/${platform}-${this.rpm_module[target].arch}-${this.buildId}-br/repodata/${this.rpm_module[target].sha256}-modules.yaml`
        axios
          .get(modules_url)
          .then((response) => {
            this.moduleYamlLoad = false
            this.$refs.showModuleYaml.open({
              modules_yaml: response.data,
              module_name: this.rpm_module[target].name,
              module_stream: this.rpm_module[target].stream,
            })
          })
          .catch((error) => {
            this.moduleYamlLoad = false
            if (error.response.status === 404) {
              Notify.create({
                message: `Failed to find modules.yaml`,
                type: 'negative',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            }
          })
      },
      goToRelease() {
        if (this.build.release_id) {
          this.$router.push(`/release/${this.build.release_id}`)
        }
      },
      checkMockOptions(task) {
        if (!task.mock_options || Object.keys(task.mock_options).length === 0)
          return false

        if (
          Object.keys(task.mock_options).length === 1 &&
          task.mock_options.definitions &&
          Object.keys(task.mock_options.definitions).length === 0
        )
          return false

        return true
      },
      showMock(task) {
        if (task.mock_options && Object.keys(task.mock_options).length !== 0) {
          this.selectedTask = task
          this.taskMock = true
        }
      },
      showMockStyle() {
        return `max-height: ${innerHeight - 250}px; width: 600px`
      },
    },
    components: {
      BuildRef,
      BuildStatusCircle,
      ModuleYaml,
      MockOptionsShow,
    },
  })
</script>

<style scoped>
  .q-tab {
    text-transform: none !important;
  }

  table.build-info-table tr:last-child td {
    border: none !important;
  }

  .mock-options {
    font-family: monospace;
    font-size: 10pt;
    letter-spacing: 1pt;
    padding: 0.5em 0 1em 1em;
    width: 30vw;
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
    padding-right: 2em;
    background-color: #f5f8fa !important;
  }

  .log-container pre {
    white-space: pre-line;
    word-break: break-all;
    color: #0c5176 !important;
    font-family:
      Consolas,
      Monaco,
      Andale Mono,
      Ubuntu Mono,
      monospace;
    text-align: left;
  }
</style>
