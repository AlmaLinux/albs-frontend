<template>
  <q-dialog position="top"
            :content-css="{minWidth: '35vw'}"
            v-model="opened">
    <q-card style="width: 700px; max-height: 700px;  max-width: 80vw;">
      <q-card-section>
        <div class="text-h6">{{ moduleInfo.module_name }}-{{ moduleInfo.module_stream }}</div>
      </q-card-section>
      <q-card-section >
            <q-input v-model="moduleInfo.modules_yaml" input-style="height: 500px;"
                         type="textarea" class="command-text" readonly/>
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
      moduleInfo: undefined
    }
  },
  methods: {
    open (moduleInfo) {
      this.opened = true
      this.moduleInfo = moduleInfo
    },
    close () {
      this.opened = false
    }
   }
})
</script>

<style scoped>
  .q-input {
    height: 700px;
  }
</style>