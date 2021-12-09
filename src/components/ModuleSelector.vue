<template>
  <div class=" justify-center">
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
            <td class="cursor-pointer" @click="onModuleInfo"><build-ref :buildRef="buildItem"/></td>
            <td class="text-tertiary">
              <q-btn @click="onModuleInfo" flat small icon="info" class="no-padding" />
              <q-btn @click="onDeleteBuildItem(buildItem)" flat small icon="delete" class="no-padding" /> 
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </q-scroll-area>

    <div class="group row justify-end">
      <q-btn @click="onAddProject" icon="add" color="secondary">
        Add module
      </q-btn>
    </div>

    <ProjectSelectionWindow ref="addProjectWindow"
                            :buildItems="buildItems" :modularity="true"
                            @projectSelected="addProjectToBuild"/>

    <module-info ref="ModuleInfo"/>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import ProjectSelectionWindow from 'components/ProjectSelectionWindow.vue'
import BuildRef from 'components/BuildRef.vue';
import ModuleInfo from 'components/ModuleInfo.vue'

export default defineComponent({
  model: {
    prop: 'buildItems', event: 'change'
  },
  props: {
    buildItems: Array
  },
  methods: {
    addProjectToBuild (buildItem) {
      this.$emit('change', [...this.buildItems, buildItem])
    },
    onAddProject () {
      this.$refs.addProjectWindow.open()
    },
    onModuleInfo () {
      this.$refs.ModuleInfo.open()
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
    ModuleInfo,
    BuildRef
  }
})
</script>

<style scoped>
</style>
