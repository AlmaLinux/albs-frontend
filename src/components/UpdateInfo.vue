<template>
  <q-dialog position="top" :content-css="{minWidth: '35vw'}" v-model="opened">
    <q-card style="width: 700px; max-height: 700px;  max-width: 80vw;">
      <q-card-section>
        <div class="text-h6">
          {{ contentInfo.record_id }}
        </div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="contentInfo.content"
          input-style="height: 500px;"
          type="textarea"
          class="log-container"
          readonly
        />
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
        content: undefined
      }
    },
    methods: {
      open (contentInfo) {
        this.opened = true
        this.contentInfo = contentInfo
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
  .log-container {
    font-size: small;
    overflow-y: auto;
    padding-left: 2em;
    background-color: #f5f8fa !important;
    white-space: pre-line;
    word-break: break-all;
    color: #0c5176 !important;
    font-family: Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace;
    text-align: left;
  }
</style>
