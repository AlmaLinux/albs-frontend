<template>
  <div class="justify-center">
    <q-scroll-area style="height: 36vw" class="row">
      <div class="row justify-center">
        <table class="q-table" style="border-collapse: collapse">
          <thead>
            <tr style="height: auto">
              <th />
              <th />
              <th class="no-padding" />
              <th class="no-padding" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(buildItem, index) in buildItems"
              :key="buildItem.uid"
              style="border-top: 1pt solid rgba(0, 0, 0, 0.12)"
            >
              <td class="no-padding">
                <q-btn
                  @click="onMoveBuildItemUp(buildItem)"
                  v-if="index !== 0"
                  flat
                  class="no-padding"
                >
                  <q-icon name="arrow_drop_up" />
                </q-btn>
              </td>
              <td class="no-padding">
                <q-btn
                  @click="onMoveBuildItemDown(buildItem)"
                  v-if="index !== buildItems.length - 1"
                  flat
                  class="no-padding"
                >
                  <q-icon name="arrow_drop_down" />
                </q-btn>
              </td>
              <td v-if="buildItem.modules_yaml">
                <span class="row">
                  <b>Name:&nbsp;</b>{{ buildItem.module_name }}<br />
                </span>
                <span class="row">
                  <b>Stream:&nbsp;</b>{{ buildItem.module_stream }}
                </span>
                <span v-if="buildItem.module_version" class="row">
                  <b>Custom module version:&nbsp;</b
                  >{{ buildItem.module_version }}
                </span>
                <span class="row">
                  <b>Distribution:&nbsp;</b
                  >{{ buildItem.module_platform_version }}
                </span>
                <span class="row">
                  <b>Enabled modules:</b>
                </span>
                <div class="q-pl-md">
                  <span
                    v-for="enabled_module of enabledModules(buildItem)"
                    :key="enabled_module.name"
                  >
                    {{ enabled_module.name }}:{{ enabled_module.stream }}<br />
                  </span>
                </div>
                <span class="row">
                  <b>Packages:</b>
                </span>
                <q-scroll-area style="height: 160px; width: 300px">
                  <tr
                    v-for="moduleItem in buildItem.refs"
                    :key="moduleItem.uid"
                  >
                    <td
                      :class="
                        moduleItemExist(moduleItem) ? null : 'text-negative'
                      "
                    >
                      <build-ref
                        :buildRef="moduleItem"
                        :class="!moduleItem.enabled ? 'text-grey' : null"
                      />
                      <q-tooltip v-if="!moduleItemExist(moduleItem)">
                        Ref does not exist
                      </q-tooltip>
                      <q-tooltip v-if="!moduleItem.enabled">
                        Package not updated
                      </q-tooltip>
                    </td>
                  </tr>
                </q-scroll-area>
              </td>
              <td v-else>
                <build-ref :buildRef="buildItem" />
              </td>
              <td class="text-tertiary text-center">
                <q-icon
                  v-if="buildItem.modules_yaml && depsWithoutStream(buildItem)"
                  name="warning"
                  color="orange"
                  style="float: left"
                >
                  <q-tooltip>
                    This module has dependencies without stream
                  </q-tooltip>
                </q-icon>
                <q-btn
                  v-if="buildItem.modules_yaml"
                  @click="onModuleEditor(buildItem)"
                  flat
                  small
                  icon="edit"
                  class="no-padding"
                >
                  <q-tooltip> Edit module </q-tooltip>
                </q-btn>
                <q-btn
                  v-if="buildItem.modules_yaml"
                  @click="onModuleYaml(buildItem)"
                  flat
                  small
                  icon="description"
                  class="no-padding info-btn"
                >
                  <q-tooltip> View module yaml </q-tooltip>
                </q-btn>
                <q-btn
                  @click="onChangeMockOptions(buildItem)"
                  flat
                  small
                  icon="settings"
                  class="no-padding info-btn"
                >
                  <q-tooltip> Edit mock options </q-tooltip>
                </q-btn>
                <q-btn
                  @click="onDeleteBuildItem(buildItem)"
                  flat
                  small
                  icon="delete"
                  class="no-padding del-btn"
                >
                  <q-tooltip> Delete build item </q-tooltip>
                </q-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </q-scroll-area>

    <div class="group row justify-end">
      <q-btn
        @click="onAddProject"
        icon="add"
        color="secondary"
        id="pse-qb-add-project"
      >
        Add project
      </q-btn>
    </div>

    <module-yaml ref="showModuleYaml" :platformName="platformName" />
    <module-editor ref="editModuleVersion" />
    <MockOptionsSelection
      ref="addMockOptions"
      :buildMockOpts="selectedMockOptions"
      @change="mockOptionsSelected"
    />
    <ProjectSelectionWindow
      ref="addProjectWindow"
      :buildItems="buildItems"
      :platformName="platformName"
      :platformArches="platformArches"
      :flavors="flavors"
      @projectSelected="addProjectToBuild"
    />
  </div>
</template>

<script>
  import {defineComponent} from 'vue'
  import ProjectSelectionWindow from 'components/ProjectSelectionWindow.vue'
  import BuildRef from 'components/BuildRef.vue'
  import MockOptionsSelection from 'components/MockOptionsSelection.vue'
  import ModuleYaml from 'components/ModuleYaml.vue'
  import moduleEditor from 'src/components/ModuleEditor.vue'

  export default defineComponent({
    model: {
      prop: 'buildItems',
      event: 'change',
    },
    props: {
      buildItems: Array,
      platformName: String,
      platformArches: Object,
      modularityVersions: Array,
      flavors: Array,
    },
    data() {
      return {
        selectedMockItem: null,
        selectedMockOptions: {},
        moduleVersion: '',
      }
    },
    methods: {
      addProjectToBuild(buildItem) {
        if (buildItem.modules_yaml) {
          buildItem.module_platform_version =
            this.modularityVersions[this.modularityVersions.length - 1]
          this.enabledModule(buildItem)
        }
        for (let flavorId of this.flavors) {
          let flavor = this.$store.state.platform_flavors.flavors.filter(
            (item) => item.id == flavorId.id
          )[0]
          if (flavor.modularity && flavor.data.versions) {
            buildItem.module_platform_version =
              flavor.data.versions[flavor.data.versions.length - 1].name
          }
        }
        this.$emit('change', [...this.buildItems, buildItem])
      },
      onAddProject() {
        this.$refs.addProjectWindow.open()
      },
      onChangeMockOptions(item) {
        let mock_options = item.modules_yaml
          ? item.refs[0].mock_options
          : item.mock_options
        this.selectedMockItem = item
        this.selectedMockOptions = mock_options
        this.$refs.addMockOptions.open(mock_options, !!item.modules_yaml)
      },
      mockOptionsSelected(value) {
        const items = this.buildItems
        if (this.selectedMockItem.modules_yaml) {
          this.selectedMockItem.refs.forEach((ref) => {
            ref.mock_options = value
          })
        } else {
          this.selectedMockItem.mock_options = value
        }
        this.$emit('change', items)
      },
      onDeleteBuildItem(buildItem) {
        this.$emit(
          'change',
          this.buildItems.filter((el) => {
            if (el.modules_yaml)
              return (
                `${el.module_name}${el.git_ref}` !==
                `${buildItem.module_name}${buildItem.git_ref}`
              )
            return (
              `${el.url}${el.git_ref}` !==
              `${buildItem.url}${buildItem.git_ref}`
            )
          })
        )
      },
      onMoveBuildItemUp(buildItem) {
        this.moveBuildItem(buildItem, -1)
      },
      onMoveBuildItemDown(buildItem) {
        this.moveBuildItem(buildItem, 1)
      },
      moveBuildItem(buildItem, direction) {
        const items = this.buildItems
        const idx = items.indexOf(buildItem)
        items.splice(idx + direction, 0, items.splice(idx, 1)[0])
        this.$emit('change', items)
      },
      onModuleEditor(moduleInfo) {
        this.$refs.editModuleVersion.open(moduleInfo, this.modularityVersions)
      },
      onModuleYaml(moduleInfo) {
        this.$refs.showModuleYaml.open(moduleInfo)
      },
      moduleItemExist(moduleItem) {
        if (moduleItem.exist === false) {
          return false
        }
        return true
      },
      depsWithoutStream(moduleInfo) {
        let flag = false
        moduleInfo.enabled_modules_table.forEach((m) => {
          if (m.no_stream) flag = true
        })
        return flag
      },
      enabledModules(moduleInfo) {
        return moduleInfo.enabled_modules_table.filter(
          (enabled_module) => enabled_module.enable
        )
      },
      enabledModule(moduleInfo) {
        moduleInfo.enabled_modules_table = []
        moduleInfo.selectedModules = new Set()

        let main_modules = [moduleInfo.module_name]
        if (!moduleInfo.module_name.includes('-devel')) {
          main_modules.push(`${moduleInfo.module_name}-devel`)
        }

        main_modules.forEach((main_module) => {
          moduleInfo.enabled_modules_table.push({
            name: main_module,
            stream: moduleInfo.module_stream,
            main: true,
            enable: true,
          })
          moduleInfo.selectedModules.add(
            `${main_module}:${moduleInfo.module_stream}`
          )
        })

        moduleInfo.enabled_modules.buildtime.forEach((dep) => {
          let [name, stream] = dep.split(':')
          let enable_module = {
            name: name,
            stream: stream,
            enable: !!stream,
            buildtime: true,
            add_to_buildtime: !!stream,
            no_stream: !stream,
          }
          moduleInfo.enabled_modules.runtime.forEach((m) => {
            if (m.includes(name)) {
              enable_module.runtime = true
              let mStream = m.split(':')[1]
              enable_module.add_to_runtime = mStream
                ? mStream === stream
                : !!stream
            }
          })
          moduleInfo.selectedModules.add(`${name}:${stream}`)
          moduleInfo.enabled_modules_table.push(enable_module)
        })

        moduleInfo.enabled_modules.runtime.forEach((dep) => {
          let [name, stream] = dep.split(':')
          if (!moduleInfo.selectedModules.has(`${name}:${stream}`)) {
            let enable_module = {
              name: name,
              stream: stream,
              enable: !!stream,
              no_stream: !stream,
              runtime: true,
              add_to_runtime: false,
            }
            moduleInfo.enabled_modules.buildtime.forEach((m) => {
              if (m.includes(name)) {
                enable_module.buildtime = true
                enable_module.add_to_buildtime = false
              }
            })
            moduleInfo.enabled_modules_table.push(enable_module)
          }
        })
      },
    },
    components: {
      ProjectSelectionWindow,
      MockOptionsSelection,
      BuildRef,
      ModuleYaml,
      moduleEditor,
    },
  })
</script>

<style scoped>
  .del-btn:hover {
    color: #ff4649;
  }
  .info-btn:hover {
    color: #0069da;
  }
</style>
