<template>
  <q-dialog position="top" v-model="opened">
    <q-card style="min-width: 50%">
      <q-card-section>
        <div class="text-h6">
          {{ moduleInfo.module_name }}-{{ moduleInfo.module_stream }}
        </div>
      </q-card-section>
      <div>
        <q-tabs v-model="tab" class="text-primary">
          <q-tab name="modules" label="Modules" />
          <q-tab name="refs" label="Refs" />
          <q-tab name="versions" label="Versions" />
        </q-tabs>

        <q-tab-panels v-model="tab">
          <q-tab-panel name="modules">
            <q-card-section class="q-pt-none">
              <div class="row justify-center">
                <div class="row justify-center">
                  <q-input
                    v-model="module_enable_input"
                    label="Add Enable Modules"
                    clearable
                    @keydown.enter.prevent="
                      addModuleEnable(module_enable_input)
                    "
                    style="width: 50%"
                    ref="addModule"
                    lazy-rules="ondemand"
                    :rules="[
                      (val) =>
                        validateModule(val) ||
                        'Module must be of the form NAME:STREAM',
                    ]"
                  >
                    <template v-slot:after>
                      <q-btn
                        round
                        dense
                        flat
                        color="primary"
                        icon="add"
                        @click="addModuleEnable(module_enable_input)"
                      />
                    </template>
                    <q-tooltip
                      anchor="bottom middle"
                      self="top middle"
                      :delay="1000"
                    >
                      Enable specified modules (only for CL8 and later). The
                      following forms are supported:<br />
                      <ul>
                        <li>NAME</li>
                        <li>NAME:STREAM</li>
                      </ul>
                    </q-tooltip>
                  </q-input>
                  <q-markup-table flat>
                    <thead>
                      <tr>
                        <th class="text-left">Dependency</th>
                        <th>Mock</th>
                        <th>Buildtime</th>
                        <th>Runtime</th>
                        <th class="text-left" style="min-width: 70px" />
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="enable_module of moduleInfo.enabled_modules_table"
                        :key="enable_module.name"
                      >
                        <td style="min-width: 250px">
                          <q-icon size="sm" :name="iconName(enable_module)">
                            <q-tooltip>
                              <span v-if="enable_module.mock"
                                >From mock options</span
                              >
                              <span v-else-if="enable_module.main">Module</span>
                              <span v-else>From template</span>
                            </q-tooltip>
                          </q-icon>
                          {{ enable_module.name }}:{{ enable_module.stream }}
                          <q-icon
                            name="dangerous"
                            dense
                            color="negative"
                            size="xs"
                            v-if="enable_module.no_stream"
                          >
                            <q-tooltip class="bg-red-8 text-bold">
                              This module does not have stream
                            </q-tooltip>
                          </q-icon>
                        </td>

                        <td
                          class="text-center"
                          :class="
                            enable_module.main
                              ? 'cursor-not-allowed'
                              : 'cursor-pointer'
                          "
                          @click="clickMock(enable_module)"
                        >
                          <q-icon
                            v-if="enable_module.enable"
                            name="circle"
                            :color="
                              enable_module.no_stream ? 'warning' : 'primary'
                            "
                          >
                            <q-tooltip v-if="enable_module.main">
                              Main and Devel modules can't be disabled
                            </q-tooltip>
                            <q-tooltip
                              class="bg-orange-8 text-bold"
                              v-if="
                                enable_module.enable && enable_module.no_stream
                              "
                            >
                              This module will be without stream in mock_options
                            </q-tooltip>
                          </q-icon>
                          <q-tooltip
                            anchor="center middle"
                            self="center middle"
                            :class="
                              tipColor(
                                enable_module.enable,
                                enable_module.no_stream
                              )
                            "
                            transition-show="scale"
                            transition-hide="scale"
                          >
                            Mock
                          </q-tooltip>
                        </td>

                        <td
                          class="text-center"
                          :class="
                            enable_module.main || !enable_module.buildtime
                              ? 'cursor-not-allowed'
                              : 'cursor-pointer'
                          "
                          @click="clickBuildtime(enable_module)"
                        >
                          <q-icon
                            v-if="enable_module.add_to_buildtime"
                            name="circle"
                            :color="
                              enable_module.no_stream ? 'warning' : 'primary'
                            "
                          >
                            <q-tooltip
                              class="bg-orange-8 text-bold"
                              v-if="
                                enable_module.add_to_buildtime &&
                                enable_module.no_stream
                              "
                            >
                              This module will be without stream in
                              buildrequires
                            </q-tooltip>
                          </q-icon>
                          <q-tooltip
                            anchor="center middle"
                            self="center middle"
                            :class="
                              tipColor(
                                enable_module.add_to_buildtime,
                                enable_module.no_stream
                              )
                            "
                            transition-show="scale"
                            transition-hide="scale"
                          >
                            Build
                          </q-tooltip>
                          <q-tooltip v-if="enable_module.main">
                            Main and Devel modules can't be added to
                            buildrequires
                          </q-tooltip>
                          <q-icon
                            v-if="!enable_module.buildtime"
                            name="horizontal_rule"
                          />
                        </td>

                        <td
                          class="text-center"
                          :class="
                            enable_module.main || !enable_module.runtime
                              ? 'cursor-not-allowed'
                              : 'cursor-pointer'
                          "
                          @click="clickRuntime(enable_module)"
                        >
                          <q-icon
                            v-if="enable_module.add_to_runtime"
                            name="circle"
                            :color="
                              enable_module.no_stream ? 'warning' : 'primary'
                            "
                          >
                            <q-tooltip
                              class="bg-orange-8 text-bold"
                              v-if="
                                enable_module.add_to_runtime &&
                                enable_module.no_stream
                              "
                            >
                              This module will be without stream in requires
                            </q-tooltip>
                          </q-icon>
                          <q-tooltip
                            anchor="center middle"
                            self="center middle"
                            :class="
                              tipColor(
                                enable_module.add_to_runtime,
                                enable_module.no_stream
                              )
                            "
                            transition-show="scale"
                            transition-hide="scale"
                          >
                            Run
                          </q-tooltip>
                          <q-tooltip v-if="enable_module.main">
                            Main and Devel modules can't be added to requires
                          </q-tooltip>
                          <q-icon
                            v-if="!enable_module.runtime"
                            name="horizontal_rule"
                          />
                        </td>

                        <td class="text-left">
                          <q-icon
                            name="warning"
                            dense
                            color="warning"
                            size="sm"
                            class="q-pl-xs"
                            v-if="
                              enable_module.no_stream &&
                              (enable_module.enable ||
                                enable_module.add_to_runtime ||
                                enable_module.add_to_buildtime)
                            "
                          >
                            <q-tooltip class="bg-orange-8 text-bold">
                              This module will be without stream ( module [] )
                            </q-tooltip>
                          </q-icon>
                        </td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>
              </div>
            </q-card-section>
          </q-tab-panel>

          <q-tab-panel name="refs">
            <q-card-section class="q-pt-none">
              <div class="row justify-center">
                <q-markup-table flat>
                  <tbody>
                    <tr
                      v-for="(moduleItem, index) in moduleInfo.refs"
                      :key="moduleItem.uid"
                    >
                      <td class="no-padding">
                        <q-btn
                          @click="onMoveModuleItemUp(moduleItem)"
                          v-if="index !== 0"
                          flat
                          class="no-padding"
                        >
                          <q-icon name="arrow_drop_up" />
                        </q-btn>
                      </td>
                      <td class="no-padding">
                        <q-btn
                          @click="onMoveModuletemDown(moduleItem)"
                          v-if="index !== moduleInfo.refs.length - 1"
                          flat
                          class="no-padding"
                        >
                          <q-icon name="arrow_drop_down" />
                        </q-btn>
                      </td>
                      <td
                        style="min-width: 350px"
                        :class="
                          moduleItemExist(moduleItem) ? null : 'text-negative'
                        "
                      >
                        <build-ref :buildRef="moduleItem" />
                        <q-tooltip v-if="!moduleItemExist(moduleItem)">
                          Package does not exist
                        </q-tooltip>
                      </td>
                      <td v-if="!moduleItem.enabled">
                        <q-btn
                          @click="addItemToBuild(moduleItem)"
                          flat
                          small
                          icon="add"
                          class="no-padding"
                        >
                          <q-tooltip>Add item to build</q-tooltip>
                        </q-btn>
                      </td>
                      <td class="text-tertiary">
                        <q-btn
                          @click="onDeleteModuleItem(moduleItem)"
                          flat
                          small
                          icon="delete"
                          class="no-padding text-right"
                        >
                          <q-tooltip> Delete build item </q-tooltip>
                        </q-btn>
                      </td>
                    </tr>
                  </tbody>
                </q-markup-table>
              </div>
              <div class="group row justify-end q-pt-md">
                <q-btn @click="onAddRef" icon="add" color="secondary">
                  Add ref
                </q-btn>
              </div>
            </q-card-section>

            <project-selection-window
              ref="addRefWindow"
              :buildItems="moduleInfo.refs"
              :platformName="platformName"
              :moduleRefs="true"
              @projectSelected="addProjectToModule"
            />
          </q-tab-panel>

          <q-tab-panel name="versions">
            <q-card-section class="q-pt-none">
              <div>
                <q-input
                  v-model="moduleInfo.module_version"
                  label="Module version"
                />
                <q-select
                  v-model="moduleInfo.module_platform_version"
                  :options="options"
                  label="Module platform version"
                />
              </div>
            </q-card-section>
          </q-tab-panel>
        </q-tab-panels>
      </div>
      <q-card-actions align="right">
        <q-btn label="ok" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="confirm_add" persistent>
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section>
        Are you sure you want to add module with <b> empty stream </b> ?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          label="Yes"
          color="primary"
          @click="changeDep(selectedDepTime, selectedEnableModule)"
        />
        <q-btn flat text-color="negative" label="No" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="confirm_remove" persistent>
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section>
        Are you sure you want to remove
        <b>{{ selectedEnableModule.name }}:{{ selectedEnableModule.stream }}</b>
        from modules.yaml ?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          label="Yes"
          color="primary"
          @click="changeDep(selectedDepTime, selectedEnableModule)"
        />
        <q-btn flat text-color="negative" label="No" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
  import {defineComponent} from 'vue'
  import BuildRef from 'components/BuildRef.vue'
  import ProjectSelectionWindow from 'components/ProjectSelectionWindow.vue'
  import {Notify} from 'quasar'

  export default defineComponent({
    props: {
      platformName: String,
    },
    data() {
      return {
        opened: false,
        moduleInfo: undefined,
        options: [],
        tab: 'modules',
        module_enable_input: '',
        confirm_add: false,
        confirm_remove: false,
        selectedDepTime: '',
        selectedEnableModule: {},
      }
    },
    methods: {
      open(moduleInfo, modularityVersions) {
        this.opened = true
        this.moduleInfo = moduleInfo
        this.options = modularityVersions
      },
      close() {
        this.opened = false
      },
      onAddRef() {
        this.$refs.addRefWindow.open()
      },
      addProjectToModule(moduleItem) {
        this.moduleInfo.refs.push(moduleItem)
      },
      addItemToBuild(moduleItem) {
        moduleItem.enabled = !moduleItem.enabled
      },
      onDeleteModuleItem(moduleItem) {
        this.moduleInfo.refs = this.moduleInfo.refs.filter((el) => {
          // TODO: we need a better way to check ref!
          return el.url !== moduleItem.url
        })
        //if (!items.refs.length) this.onDeleteBuildItem(items)
      },
      onMoveModuleItemUp(moduleItem) {
        this.moveModuleItem(moduleItem, -1)
      },
      onMoveModuletemDown(moduleItem) {
        this.moveModuleItem(moduleItem, 1)
      },
      moveModuleItem(moduleItem, direction) {
        const idx = this.moduleInfo.refs.indexOf(moduleItem)
        this.moduleInfo.refs.splice(
          idx + direction,
          0,
          this.moduleInfo.refs.splice(idx, 1)[0]
        )
      },
      moduleItemExist(moduleItem) {
        if (moduleItem.exist === false) {
          return false
        }
        return true
      },
      validateModule(enable_module) {
        return enable_module.includes(':')
          ? enable_module.split(':').length === 2
          : true
      },
      addModuleEnable(enable_module) {
        if (!enable_module) return

        if (!this.$refs.addModule.validate()) return

        enable_module = enable_module.trim()

        if (!enable_module.includes(':')) {
          enable_module = enable_module.concat(':')
        }
        if (this.moduleInfo.selectedModules.has(enable_module)) {
          Notify.create({
            type: 'negative',
            message: `Module ${enable_module} is alredy in dependencies`,
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
          return
        }

        let [name, stream] = enable_module.split(':')
        let mock_module = {
          name: name,
          stream: stream,
          enable: true,
          no_stream: !stream,
          mock: true,
        }
        this.moduleInfo.enabled_modules_table.forEach((m) => {
          if (m.name === name) {
            mock_module.buildtime = !!m.buildtime
            mock_module.add_to_buildtime =
              !!m.buildtime && !mock_module.no_stream
            mock_module.runtime = !!m.runtime
            mock_module.add_to_runtime = !!m.runtime && !mock_module.no_stream
            if (m.no_stream) {
              m.add_to_buildtime = false
              m.add_to_runtime = false
              m.enable = false
            }
          }
        })
        this.moduleInfo.enabled_modules_table.push(mock_module)
        this.moduleInfo.selectedModules.add(`${name}:${stream}`)
        this.module_enable_input = ''
      },
      tipColor(selected, no_stream) {
        let color = null
        if (selected) {
          color = no_stream ? 'bg-warning' : 'bg-primary'
        }
        return color
      },
      clickMock(enable_module) {
        if (enable_module.main) return

        enable_module.enable = !enable_module.enable
      },
      changeDep(dep_time, enable_module) {
        enable_module[dep_time] = !enable_module[dep_time]
        this.moduleInfo.enabled_modules_table.forEach((m) => {
          if (
            m.name === enable_module.name &&
            m.stream !== enable_module.stream
          ) {
            if (enable_module.no_stream || m.no_stream) {
              m[dep_time] = false
            }
          }
        })
        this.confirm_add = false
        this.confirm_remove = false
      },
      clickBuildtime(enable_module) {
        if (enable_module.main) return

        if (!enable_module.buildtime) return

        this.selectedDepTime = 'add_to_buildtime'
        this.selectedEnableModule = enable_module

        if (!enable_module.add_to_buildtime && enable_module.no_stream) {
          this.confirm_add = true
        } else if (enable_module.add_to_buildtime && !enable_module.mock) {
          this.confirm_remove = true
        } else {
          this.changeDep('add_to_buildtime', enable_module)
        }
      },
      clickRuntime(enable_module) {
        if (enable_module.main) return

        if (!enable_module.runtime) return

        this.selectedDepTime = 'add_to_runtime'
        this.selectedEnableModule = enable_module

        if (!enable_module.add_to_runtime && enable_module.no_stream) {
          this.confirm_add = true
        } else if (enable_module.add_to_runtime && !enable_module.mock) {
          this.confirm_remove = true
        } else {
          this.changeDep('add_to_runtime', enable_module)
        }
      },
      iconName(enable_module) {
        if (enable_module.mock) return 'settings_suggest'
        if (enable_module.main) return 'view_module'
        return 'description'
      },
    },
    components: {
      ProjectSelectionWindow,
      BuildRef,
    },
  })
</script>
