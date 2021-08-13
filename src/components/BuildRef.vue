<template>
  <a :href="buildRef.url" target="blank">
    {{ text }}
  </a>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BuildRef',
  props: {
    buildRef: Object
  },
  computed: {
    text () {
      return this.buildRef.url.split('/').pop()
    }
  },
  methods: {
  }
})
</script>

<style scoped>
</style>
