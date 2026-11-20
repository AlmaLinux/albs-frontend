<template>
  <div class="row items-center q-gutter-xs">
    <q-chip dense square color="green-1" text-color="green-9" icon="check">
      {{ value('done') }} done
    </q-chip>
    <q-chip
      dense
      square
      :color="value('failed') ? 'red-1' : 'grey-2'"
      :text-color="value('failed') ? 'negative' : 'grey-8'"
      icon="close"
    >
      {{ value('failed') }} failed
    </q-chip>
    <q-chip dense square color="grey-2" text-color="grey-8" icon="block">
      {{ value('excluded') }} excluded
    </q-chip>
  </div>
</template>

<script>
  import {defineComponent} from 'vue'

  export default defineComponent({
    name: 'BuildNodeStats',
    props: {
      // stats_24h of a BuildNode
      stats: {type: Object, default: null},
    },
    methods: {
      value(key) {
        return (this.stats && this.stats[key]) || 0
      },
    },
  })
</script>
