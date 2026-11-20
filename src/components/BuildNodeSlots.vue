<template>
  <div class="row items-center no-wrap q-gutter-sm">
    <q-linear-progress
      :value="usage.ratio"
      :color="usage.overloaded ? 'negative' : 'primary'"
      track-color="grey-3"
      size="8px"
      rounded
      :style="{width: barWidth}"
    />
    <span
      class="text-no-wrap"
      :class="usage.overloaded ? 'text-negative text-weight-bold' : ''"
    >
      {{ usage.active }} / {{ usage.capacity }}
    </span>
    <q-icon v-if="usage.limited" name="tune" color="primary">
      <q-tooltip>{{ limitTooltip }}</q-tooltip>
    </q-icon>
    <q-tooltip v-if="usage.overloaded">
      More tasks are running than the node has slots
    </q-tooltip>
  </div>
</template>

<script>
  import {defineComponent} from 'vue'
  import {capacityLimitInfo, slotUsage} from '../buildNodeUtils'

  export default defineComponent({
    name: 'BuildNodeSlots',
    props: {
      node: {type: Object, required: true},
      barWidth: {type: String, default: '80px'},
    },
    computed: {
      usage() {
        return slotUsage(this.node)
      },
      limitTooltip() {
        return capacityLimitInfo(this.node).tooltip
      },
    },
  })
</script>
