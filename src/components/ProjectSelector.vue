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
            <td>{{ buildItem.url }}</td>
            <td class="text-tertiary">
            <!--  <build-reference :build-ref="buildItem.buildRef"/>-->
            <!--</td>-->
            <!--<td>-->
              <q-btn @click="onDeleteBuildItem(buildItem)" flat small class="no-padding">
                <q-icon name="delete"/>
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

    <ProjectSelectionWindow ref="addProjectWindow"
                            :buildItems="buildItems"
                            @projectSelected="addProjectToBuild"/>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import ProjectSelectionWindow from 'components/ProjectSelectionWindow.vue'

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
    ProjectSelectionWindow
  }
})
</script>

<style scoped>
</style>
