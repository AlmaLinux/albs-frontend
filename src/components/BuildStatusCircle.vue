<template>
  <q-icon :name="statusIcon" :color="statusColor" :class="statusClass"
          @click="onClick">
    <q-tooltip anchor="bottom middle" self="top middle">
      {{ statusText }}
    </q-tooltip>
  </q-icon>
</template>

<script>
import { defineComponent } from 'vue'
import { BuildStatus } from '../constants'

export default defineComponent({
  name: 'build-status-circle',
  props: {
    status: { type: Number, required: true }
  },
  computed: {
    statusIcon () {
      switch (this.status) {
        case BuildStatus.IDLE:
          return 'panorama_fish_eye'
        case BuildStatus.FAILED:
          return 'remove_circle'
        default:
          return 'brightness_1'
      }
    },
    statusColor () {
      return BuildStatus.color[this.status]
    },
    statusClass () {
      let cls = 'cursor-pointer status-circle'
      if (this.status === BuildStatus.STARTED) {
        cls = `${cls} status-circle-blink`
      }
      return cls
    },
    statusText () {
      return BuildStatus.text[this.status]
    }
  },
  methods: {
    onClick () {
      this.$emit('click')
    }
  },
  components: {}
})
</script>

<style scoped>
  .status-circle {
    font-size: 1.5em;
  }

  .status-circle-blink {
    animation: blinker 1.5s cubic-bezier(.5, 0, 1, 1) infinite alternate;
  }

  @keyframes blinker {
    from { opacity: 1; }
    to { opacity: 0; }
  }
</style>

