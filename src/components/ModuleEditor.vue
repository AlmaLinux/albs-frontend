<template>
  <q-dialog position="top"
            :content-css="{minWidth: '35vw'}"
            v-model="opened">          
    <q-card style="width: 400px; max-height: 750px; max-width: 80vw;">
      <q-card-section>
        <div class="text-h6">{{ moduleInfo.module_name }}-{{ moduleInfo.module_stream }}</div>
      </q-card-section>
        <div>
          <q-tabs
            v-model="tab"
            class="text-primary"
          >
            <q-tab name="refs" label="Refs" />
            <q-tab name="versions" label="Versions" />
          </q-tabs>

          <q-tab-panels v-model="tab">
            <q-tab-panel name="refs">
              <q-card-section class="q-pt-none">
                <div class="row justify-center">
                  <table class="q-table">
                    <tbody>
                    <q-scroll-area style="height: 27vw;" class="row">
                      <tr v-for="(moduleItem, index) in moduleInfo.refs" :key="moduleItem.uid">
                        <td class="no-padding">
                          <q-btn @click="onMoveModuleItemUp(moduleItem)"
                                v-if="index !== 0"
                                flat class="no-padding">
                            <q-icon name="arrow_drop_up"/>
                          </q-btn>
                        </td>
                        <td class="no-padding">
                          <q-btn @click="onMoveModuletemDown(moduleItem)"
                                v-if="index !== moduleInfo.refs.length-1"
                                flat class="no-padding">
                            <q-icon name="arrow_drop_down"/>
                          </q-btn>
                        </td>
                        <td :class="moduleItemExist(moduleItem) ? null : 'text-negative'">
                          <build-ref :buildRef="moduleItem"/>
                          <q-tooltip v-if="!moduleItemExist(moduleItem)">
                            Package does not exist
                          </q-tooltip>
                        </td>
                        <td class="text-tertiary">
                          <q-btn @click="onDeleteModuleItem(moduleItem)" flat small icon="delete" class="no-padding">
                            <q-tooltip>
                              Delete build item
                            </q-tooltip>
                          </q-btn>
                        </td>
                      </tr>
                    </q-scroll-area>
                  </tbody>
                </table>
              </div>
              <div class="group row justify-end">
                <q-btn @click="onAddRef" icon="add" color="secondary">
                  Add ref
                </q-btn>
              </div>
            </q-card-section>

            <project-selection-window ref="addRefWindow"
                                :buildItems="moduleInfo.refs"
                                :platformName="platformName"
                                :moduleRefs="true"
                                @projectSelected="addProjectToModule"/>
          </q-tab-panel>

          <q-tab-panel name="versions">
            <q-card-section class="q-pt-none">
              <div>
                <q-input v-model="moduleInfo.module_version" label="Module version" />
                <q-select v-model="moduleInfo.module_platform_version" :options="options" label="Module platform version" />
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
</template>

<script>
import { defineComponent } from 'vue'
import BuildRef from 'components/BuildRef.vue';
import ProjectSelectionWindow from 'components/ProjectSelectionWindow.vue'

export default defineComponent({
  props: {
    platformName: String
  },
  data () {
    return {
      opened: false,
      moduleInfo: undefined,
      options: [],
      tab: 'refs'
    }
  },
  methods: {
    open (moduleInfo, modularityVersions, tab) {
      this.tab = tab
      this.opened = true
      this.moduleInfo = moduleInfo
      this.options = modularityVersions
    },
    close () {
      this.opened = false
    },
    onAddRef () {
      this.$refs.addRefWindow.open()
    },
    addProjectToModule (moduleItem) {
      this.moduleInfo.refs.push(moduleItem)
    },
    onDeleteModuleItem (moduleItem) {
      this.moduleInfo.refs = this.moduleInfo.refs.filter(el => {
        // TODO: we need a better way to check ref!
        return el.url !== moduleItem.url
      })
      //if (!items.refs.length) this.onDeleteBuildItem(items)
    },
    onMoveModuleItemUp (moduleItem) {
      this.moveModuleItem(moduleItem, -1)
    },
    onMoveModuletemDown (moduleItem) {
      this.moveModuleItem(moduleItem, 1)
    },
    moveModuleItem (moduleItem, direction) {
      const idx = this.moduleInfo.refs.indexOf(moduleItem)
      this.moduleInfo.refs.splice(idx + direction, 0, this.moduleInfo.refs.splice(idx, 1)[0])
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
    BuildRef
  }
})
</script>
