<template>
  <div class="justify-center">

    <q-scroll-area style="height: 21vw;" class="row">
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
            <td><build-ref :buildRef="buildItem"/></td>
            <td class="text-tertiary">
              <q-btn @click="onChangeMockOptions(index)" flat small icon="settings" class="no-padding"/>
              <q-btn @click="onDeleteBuildItem(buildItem)" flat small icon="delete" class="no-padding" /> 
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
      selectedMockItem: undefined,
      selectedMockOptions: {}
    }
  },
  methods: {
    addProjectToBuild (buildItem) {
      if (buildItem.constructor.name !== 'Array') {
        buildItem = [buildItem]
      }
      this.$emit('change', this.buildItems.concat(buildItem))
    },
    onAddProject () {
      this.$refs.addProjectWindow.open()
    },
    onChangeMockOptions (index) {
      this.selectedMockItem = index
      this.selectedMockOptions = this.buildItems[index].mock_options
      console.log(this.selectedMockOptions)
      this.$refs.addMockOptions.open(this.selectedMockOptions)
    },
    mockOptionsSelected (value) {
      const items = this.buildItems
      items[this.selectedMockItem].mock_options = value
      this.$emit('change', items)
    },
    onDeleteBuildItem (buildItem) {
      this.$emit('change', this.buildItems.filter(el => {
        // TODO: we need a better way to check ref!
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
