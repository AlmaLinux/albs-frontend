<template>
  <q-dialog :content-css="{minWidth: '35vw'}"
            v-model="opened">
    <q-card style="width: 700px; height: 250px; max-width: 80vw;">
      <q-card-section>
        <div class="text-h6">{{ moduleInfo.module_name }}-{{ moduleInfo.module_stream }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div>
          <q-input v-model="moduleInfo.module_version" label="Module version" />
          <q-select v-model="moduleInfo.module_platform_version" :options="options" label="Module platform version" />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="ok" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  data () {
    return {
      opened: false,
      moduleInfo: undefined,
      options: []
    }
  },
  methods: {
    open (moduleInfo, modularityVersions) {
      this.opened = true
      this.moduleInfo = moduleInfo
      this.options = []
      modularityVersions.forEach(version => {
        this.options.push(version.name)
      });
    },
    close () {
      this.opened = false
    }
   }
})
</script>
