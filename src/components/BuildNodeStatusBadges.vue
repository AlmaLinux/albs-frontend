<template>
  <div :class="stacked ? 'column items-start' : 'row items-center no-wrap'">
    <div class="row items-center q-gutter-xs no-wrap">
      <q-badge
        v-for="badge in badges"
        :key="badge.key"
        :color="badge.color"
        :text-color="badge.textColor"
        :label="badge.label"
        class="text-weight-medium"
      >
        <q-tooltip>{{ badge.description }}</q-tooltip>
      </q-badge>
    </div>
    <span
      v-if="showLastSeen && offline"
      class="text-caption text-grey-7 text-no-wrap"
      :class="stacked ? 'q-mt-xs' : 'q-ml-sm'"
    >
      {{ lastSeenText }}
    </span>
  </div>
</template>

<script>
  import {defineComponent} from 'vue'
  import {NodeStatus, formatTimeAgo, nodeStatusBadges} from '../buildNodeUtils'

  export default defineComponent({
    name: 'BuildNodeStatusBadges',
    props: {
      node: {type: Object, required: true},
      now: {type: Number, required: true},
      showLastSeen: {type: Boolean, default: true},
      // "last seen" under the badges instead of next to them
      stacked: {type: Boolean, default: false},
    },
    computed: {
      badges() {
        return nodeStatusBadges(this.node, this.now)
      },
      offline() {
        return this.badges.some((badge) => badge.key === NodeStatus.OFFLINE)
      },
      lastSeenText() {
        return this.node.last_seen
          ? `last seen ${formatTimeAgo(this.node.last_seen, this.now)}`
          : 'never seen'
      },
    },
  })
</script>
