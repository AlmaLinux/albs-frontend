<template>
  <div class="q-pa-md q-gutter-sm">
    <q-dialog
      v-model="opened"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card>
        <q-bar class="bg-primary">
          <q-space />
          <q-btn dense color="white" flat icon="close" v-close-popup>
            <q-tooltip class="bg-primary text-white">Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="q-pt-none log-container">
            <pre>
                {{ logText }}
            </pre>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        logText: String
    },
    data() {
        return {
            opened: false
        }
    },
    methods: {
        open(){
            this.opened = true
        }
    }
})
</script>

<style scoped>
  .log-container {
    font-size: small;
    overflow-y: auto;
    padding-left: 2em;
  }

  .log-container pre {
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>