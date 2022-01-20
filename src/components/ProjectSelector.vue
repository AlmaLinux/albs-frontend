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
              {{ buildItem.module_name }}-{{ buildItem.module_stream }}
              <q-scroll-area style="height: 200px; width: 300px">
                <tr v-for="(moduleItem, i) in buildItem.refs" :key="moduleItem.uid">
                  <td class="no-padding">
                    <q-btn @click="onMoveModuleItemUp(moduleItem, buildItem.refs, index)"
                      v-if="i !== 0"
                      flat class="no-padding">
                      <q-icon name="arrow_drop_up"/>
                    </q-btn>
                  </td>
                  <td class="no-padding">
                    <q-btn @click="onMoveModuletemDown(moduleItem, buildItem.refs, index)"
                          v-if="i !== buildItem.refs.length-1"
                          flat class="no-padding">
                      <q-icon name="arrow_drop_down"/>
                    </q-btn>
                  </td>
                  <td style="width:200px" :class="moduleItem.exist ? null : 'text-negative'">
                    <build-ref :buildRef="moduleItem"/>
                    <q-tooltip v-if="!moduleItem.exist">
                      Package does not exist
                    </q-tooltip>
                  </td>
                  <td class="text-tertiary">
                    <q-btn @click="buildItem.refs = onDeleteModuleItem(moduleItem, buildItem)" flat small icon="close" class="no-padding" />
                  </td>
                </tr>
              </q-scroll-area>
            </td>
            <td v-else><build-ref :buildRef="buildItem"/></td>
            <td class="text-tertiary">
              <q-btn @click="onChangeMockOptions(buildItem,index)" flat small icon="settings" class="no-padding">
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

    <MockOptionsSelection ref="addMockOptions"
                          :buildMockOpts="selectedMockOptions"
                          @change="mockOptionsSelected"/>
    <ProjectSelectionWindow ref="addProjectWindow"
                            :buildItems="buildItems"
                            :platformName="platformName"
                            @projectSelected="addProjectToBuild"/>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import ProjectSelectionWindow from 'components/ProjectSelectionWindow.vue'
import BuildRef from 'components/BuildRef.vue';
import MockOptionsSelection from 'components/MockOptionsSelection.vue'

export default defineComponent({
  model: {
    prop: 'buildItems', event: 'change'
  },
  props: {
    buildItems: Array,
    platformName: String
  },
  data () {
    return {
      selectedModule: null,
      selectedMockItem: undefined,
      selectedMockOptions: {}
    }
  },
  methods: {
    addProjectToBuild (buildItem) {
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
    onDeleteModuleItem (moduleItem, items) {
      items.refs = items.refs.filter(el => {
        // TODO: we need a better way to check ref!
        return el.url !== moduleItem.url
      })
      if (!items.refs.length) this.onDeleteBuildItem(items)
      return items.refs
    },
    onMoveModuleItemUp (moduleItem, buildItem, index) {
      this.moveModuleItem(moduleItem, -1, buildItem, index)
    },
    onMoveModuletemDown (moduleItem, buildItem, index) {
      this.moveModuleItem(moduleItem, 1, buildItem, index)
    },
    moveModuleItem (moduleItem, direction, items, indexModule) {
      const buildItems = this.buildItems
      const idx = items.indexOf(moduleItem)
      items.splice(idx + direction, 0, items.splice(idx, 1)[0])
      buildItems[indexModule].refs = items
      this.$emit('change', buildItems)
    }
  },
  components: {
    ProjectSelectionWindow,
    MockOptionsSelection,
    BuildRef
  }
})
</script>

<style scoped>
</style>
