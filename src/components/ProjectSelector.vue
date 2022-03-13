<template>
  <div class="justify-center">
    <q-scroll-area style="height: 36vw;" class="row">
      <div class="row justify-center">
        <table class="q-table">
          <tbody>
          <tr v-for="(buildItem, index) in buildItems" :key="buildItem.uid">
            <td class="no-padding">
              <q-btn @click="onMoveBuildItemUp(buildItem)"
                     v-if="index !== 0"
                     flat class="no-padding">
                <q-icon name="arrow_drop_up"/>
              </q-btn>
            </td>
            <td class="no-padding">
              <q-btn @click="onMoveBuildItemDown(buildItem)"
                     v-if="index !== buildItems.length-1"
                     flat class="no-padding">
                <q-icon name="arrow_drop_down"/>
              </q-btn>
            </td>
            <td v-if="buildItem.modules_yaml">
              <span class="row">
                <b>Module:&nbsp;</b>{{ buildItem.module_name }}<br>
              </span>
              <span class="row">
                <b>Stream:&nbsp;</b>{{ buildItem.module_stream }}
              </span>
              <span v-if="buildItem.module_version" class="row">
                <b>Custom module version:&nbsp;</b>{{ buildItem.module_version }}
              </span>
              <span class="row">
                <b>Distribution:&nbsp;</b>{{ buildItem.module_platform_version }}
              </span>
              <span class="row">
                <b>Packages:</b>
              </span>
              <q-scroll-area style="height: 160px; width: 300px">
                <tr v-for="moduleItem in buildItem.refs" :key="moduleItem.uid">
                  <td :class="moduleItemExist(moduleItem) ? null : 'text-negative'">
                    <build-ref :buildRef="moduleItem"/>
                    <q-tooltip v-if="!moduleItemExist(moduleItem)">
                      Ref does not exist
                    </q-tooltip>
                  </td>
                </tr>
                <tr v-for="excludedComponent in buildItem.excluded_components" :key="excludedComponent">
                  <td class="text-negative">
                    <build-ref :buildRef="excludedComponent"/>
                    <q-tooltip>
                      Package not updated
                    </q-tooltip>
                  </td>
                </tr>
              </q-scroll-area>
            </td>
            <td v-else><build-ref :buildRef="buildItem"/></td>
            <td class="text-tertiary">
              <q-btn v-if="buildItem.modules_yaml" @click="onModuleEditor(buildItem, 'refs')" flat small icon="edit" class="no-padding">
                <q-tooltip>
                  Edit module versions
                </q-tooltip>
              </q-btn>
              <q-btn v-if="buildItem.modules_yaml" @click="onModuleYaml(buildItem)" flat small icon="description" class="no-padding">
                <q-tooltip>
                  View module yaml
                </q-tooltip>
              </q-btn>
              <q-btn @click="onChangeMockOptions(buildItem)" flat small icon="settings" class="no-padding">
                <q-tooltip>
                  Edit mock options
                </q-tooltip>
              </q-btn>
              <q-btn @click="onDeleteBuildItem(buildItem)" flat small icon="delete" class="no-padding">
                <q-tooltip>
                  Delete build item
                </q-tooltip>
              </q-btn>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </q-scroll-area>

    <div class="group row justify-end">
      <q-btn @click="onAddProject" icon="add" color="secondary">
        Add project
      </q-btn>
    </div>

    <module-yaml ref="showModuleYaml"
                  :platformName="platformName"/>
    <module-editor ref="editModuleVersion"/>
    <MockOptionsSelection ref="addMockOptions"
                          :buildMockOpts="selectedMockOptions"
                          @change="mockOptionsSelected"/>
    <ProjectSelectionWindow ref="addProjectWindow"
                            :buildItems="buildItems"
                            :platformName="platformName"
                            :platformArches="platformArches"
                            @projectSelected="addProjectToBuild"/>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import ProjectSelectionWindow from 'components/ProjectSelectionWindow.vue'
import BuildRef from 'components/BuildRef.vue';
import MockOptionsSelection from 'components/MockOptionsSelection.vue'
import ModuleYaml from 'components/ModuleYaml.vue'
import moduleEditor from 'src/components/ModuleEditor.vue'

export default defineComponent({
  model: {
    prop: 'buildItems', event: 'change'
  },
  props: {
    buildItems: Array,
    platformName: String,
    platformArches: Object,
    modularityVersions: Array
  },
  data () {
    return {
      selectedModule: null,
      selectedMockItem: undefined,
      selectedMockOptions: {},
      moduleVersion: '',
    }
  },
  methods: {
    addProjectToBuild (buildItem) {
      if (buildItem.modules_yaml) {
        buildItem.module_platform_version = this.modularityVersions[this.modularityVersions.length - 1]
      }
      this.$emit('change', [...this.buildItems, buildItem])
    },
    onAddProject () {
      this.$refs.addProjectWindow.open()
    },
    onChangeMockOptions (item) {
      let mock_options = {}
      item.modules_yaml ? mock_options = item.refs[0].mock_options : mock_options = item.mock_options
      this.selectedMockItem = item
      this.selectedMockOptions = mock_options
      this.$refs.addMockOptions.open(mock_options)
    },
    mockOptionsSelected (value) {
      const items = this.buildItems
      if (this.selectedMockItem.modules_yaml) {
        this.selectedMockItem.refs.forEach(ref => {
          ref.mock_options = value
        })
      } else {
        this.selectedMockItem.mock_options = value
      }
      this.$emit('change', items)
    },
    onDeleteBuildItem (buildItem) {
      this.$emit('change', this.buildItems.filter(el => {
        // TODO: we need a better way to check ref!
        if (el.modules_yaml) return el.modules_yaml !== buildItem.modules_yaml
        return el.url !== buildItem.url
      }))
    },
    onMoveBuildItemUp (buildItem) {
      this.moveBuildItem(buildItem, -1)
    },
    onMoveBuildItemDown (buildItem) {
      this.moveBuildItem(buildItem, 1)
    },
    moveBuildItem (buildItem, direction) {
      const items = this.buildItems
      const idx = items.indexOf(buildItem)
      items.splice(idx + direction, 0, items.splice(idx, 1)[0])
      this.$emit('change', items)
    },
    onModuleEditor (moduleInfo, tab) {
      this.$refs.editModuleVersion.open(moduleInfo, this.modularityVersions, tab)
    },
    onModuleYaml (moduleInfo) {
      this.$refs.showModuleYaml.open(moduleInfo)
    },
    moduleItemExist (moduleItem){
      if (moduleItem.exist === false) {
        return false
      }
      return true
    }
  },
  components: {
    ProjectSelectionWindow,
    MockOptionsSelection,
    BuildRef,
    ModuleYaml,
    moduleEditor
  }
})
</script>

<style scoped>
</style>
