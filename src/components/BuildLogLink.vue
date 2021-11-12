<template>
  <q-item class="log-link" :class="{'bg-grey-4': selected}">
    <q-item-section class="cursor-pointer" @click="onView">
      <a class="text-dark">{{ artifact.name }}</a>
    </q-item-section>
    <q-item-section side class="cursor-pointer" @click="onDownload">
      <q-icon name="file_download" color="tertiary" size="1.5em" class="text-dark"/>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    selected: { type: Boolean, default: false },
    artifact: Object
  },
  methods: {
    onView () {
      this.$emit('view', this.artifact)
    },
    onDownload () {
      this.$emit('download', this.artifact)
    }
  },
  components: {}
})
</script>

<style scoped>
  .log-link {
    font-size: small;
    padding-right: 0;
  }
</style>
