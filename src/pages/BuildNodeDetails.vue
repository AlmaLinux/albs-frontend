<template>
  <q-page class="q-px-xl q-pt-md q-pb-xl">
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-btn flat round icon="arrow_back" to="/build-nodes" id="bnd-qb-back">
        <q-tooltip>All build nodes</q-tooltip>
      </q-btn>
      <div class="text-h5">
        {{ node ? node.name : `Build node #${nodeId}` }}
      </div>
      <build-node-status-badges v-if="node" :node="node" :now="now" />
      <q-space />
      <build-node-actions
        v-if="node && canManage"
        :node="node"
        @updated="onNodeUpdated"
      />
      <span v-if="loadedAt" class="text-caption text-grey-7">
        Updated {{ updatedText }}
      </span>
      <q-toggle v-model="autoRefreshEnabled" dense label="Auto-refresh">
        <q-tooltip>
          Refresh every {{ refreshSeconds }} s while the tab is visible
        </q-tooltip>
      </q-toggle>
      <q-btn
        round
        flat
        icon="refresh"
        :loading="loading"
        @click="refreshNow()"
        id="bnd-qb-refresh"
      >
        <q-tooltip>Refresh now</q-tooltip>
      </q-btn>
    </div>

    <q-banner
      v-if="error"
      rounded
      class="q-mb-md"
      :class="node === null ? 'bg-red-1' : 'bg-orange-1'"
    >
      <template v-slot:avatar>
        <q-icon
          :name="error.kind === 'not_found' ? 'cloud_off' : 'error_outline'"
          :color="node === null ? 'negative' : 'orange-9'"
        />
      </template>
      {{ errorMessage }}
      <span v-if="node !== null">
        Showing the data received {{ updatedText }}.
      </span>
      <span v-if="isAuthError(error) && !autoRefreshEnabled">
        Auto-refresh is turned off.
      </span>
      <template v-slot:action>
        <q-btn flat no-caps label="Retry" @click="refreshNow()" />
        <q-btn flat no-caps label="All build nodes" to="/build-nodes" />
      </template>
    </q-banner>

    <div v-if="node === null && loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-if="node" class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="q-py-sm">
            <div class="text-subtitle1">Node</div>
          </q-card-section>
          <q-separator />
          <q-markup-table flat dense separator="none">
            <tbody>
              <tr>
                <td class="text-grey-8 text-no-wrap">
                  Version
                  <q-icon name="help_outline" size="xs" color="grey-7">
                    <q-tooltip>{{ nodeVersionHint }}</q-tooltip>
                  </q-icon>
                </td>
                <td>
                  <span v-if="version.commit" class="build-node-mono">
                    {{ version.text }}
                  </span>
                  <span v-else>{{ version.text }}</span>
                  <div class="text-caption text-grey-7">
                    {{ version.commit ? 'albs-node commit' : 'not reported' }}
                  </div>
                  <q-tooltip>{{ version.hint }}</q-tooltip>
                </td>
              </tr>
              <tr>
                <td class="text-grey-8">Instance ID</td>
                <td>
                  <span v-if="node.instance_id" class="build-node-mono">
                    {{ node.instance_id }}
                  </span>
                  <span v-else>—</span>
                </td>
              </tr>
              <tr>
                <td class="text-grey-8">Type</td>
                <td>{{ node.node_type || '—' }}</td>
              </tr>
              <tr>
                <td class="text-grey-8">Arches</td>
                <td>{{ (node.supported_arches || []).join(', ') || '—' }}</td>
              </tr>
              <tr>
                <td class="text-grey-8">PESign</td>
                <td>{{ node.pesign_support ? 'yes' : 'no' }}</td>
              </tr>
              <tr>
                <td class="text-grey-8">Enabled</td>
                <td>{{ node.enabled ? 'yes' : 'no' }}</td>
              </tr>
              <tr>
                <td class="text-grey-8">Drain</td>
                <td>{{ node.drain ? 'yes' : 'no' }}</td>
              </tr>
              <tr>
                <td class="text-grey-8">Maintenance</td>
                <td>{{ node.maintenance ? 'yes' : 'no' }}</td>
              </tr>
              <tr>
                <td class="text-grey-8">Last seen</td>
                <td>
                  {{ timeAgo(node.last_seen) }}
                  <span v-if="node.last_seen" class="text-caption text-grey-7">
                    ({{ dateTime(node.last_seen) }})
                  </span>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="q-py-sm">
            <div class="text-subtitle1">Slots</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <build-node-slots :node="node" bar-width="160px" />
          </q-card-section>
          <q-markup-table flat dense separator="none">
            <tbody>
              <tr>
                <td class="text-grey-8">Running tasks</td>
                <td>{{ node.active_tasks_count }}</td>
              </tr>
              <tr>
                <td class="text-grey-8">Effective capacity</td>
                <td>{{ node.effective_capacity }}</td>
              </tr>
              <tr>
                <td class="text-grey-8">Reported by the node</td>
                <td>
                  {{ node.capacity > 0 ? node.capacity : 'not reported' }}
                </td>
              </tr>
              <tr>
                <td class="text-grey-8">Manual limit</td>
                <td>
                  {{ hasOverride ? node.capacity_override : 'not set' }}
                </td>
              </tr>
            </tbody>
          </q-markup-table>
          <q-card-section>
            <div class="text-subtitle2 q-mb-xs">Last 24 hours</div>
            <build-node-stats :stats="node.stats_24h" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="q-py-sm row items-center">
            <div class="text-subtitle1">Host</div>
            <q-space />
            <q-badge
              v-if="resources.stale"
              color="grey-6"
              label="stale"
              class="q-ml-sm"
            >
              <q-tooltip>{{ resources.staleText }}</q-tooltip>
            </q-badge>
          </q-card-section>
          <q-separator />
          <q-card-section v-if="resources.missing" class="text-grey-7">
            The node has sent no host metrics yet.
          </q-card-section>
          <q-markup-table
            v-else
            flat
            dense
            separator="none"
            :class="resources.stale ? 'build-node-stale' : ''"
          >
            <tbody>
              <tr>
                <td class="text-grey-8">CPUs</td>
                <td>{{ node.resources.cpu_count }}</td>
              </tr>
              <tr>
                <td class="text-grey-8">Load average</td>
                <td :class="levelClass(resources.load.level)">
                  {{ loadAvgText }}
                  <q-tooltip>{{ resources.load.tooltip }}</q-tooltip>
                </td>
              </tr>
              <tr>
                <td class="text-grey-8">RAM used</td>
                <td :class="levelClass(resources.mem.level)">
                  {{ resources.mem.text }}
                  <div class="text-caption">{{ resources.mem.tooltip }}</div>
                </td>
              </tr>
              <tr>
                <td class="text-grey-8">Disk free</td>
                <td :class="levelClass(resources.disk.level)">
                  {{ resources.disk.text }} ({{ resources.disk.sub }})
                  <div class="text-caption">{{ resources.disk.tooltip }}</div>
                </td>
              </tr>
              <tr>
                <td class="text-grey-8">Updated</td>
                <td>
                  {{ resources.updatedText }}
                  <span
                    v-if="node.resources_updated_at"
                    class="text-caption text-grey-7"
                  >
                    ({{ dateTime(node.resources_updated_at) }})
                  </span>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>

      <div class="col-12">
        <div class="text-subtitle1 q-mb-xs">
          Active tasks ({{ (node.active_tasks || []).length }})
        </div>
        <build-node-tasks-table
          :tasks="node.active_tasks || []"
          :now="now"
          empty-text="The node runs no tasks"
        />
      </div>

      <div class="col-12">
        <div class="text-subtitle1 q-mb-xs">Recent tasks</div>
        <build-node-tasks-table
          recent
          :tasks="node.recent_tasks || []"
          :now="now"
          empty-text="No recent tasks"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
  import {defineComponent} from 'vue'
  import BuildNodeActions from 'components/BuildNodeActions.vue'
  import BuildNodeSlots from 'components/BuildNodeSlots.vue'
  import BuildNodeStats from 'components/BuildNodeStats.vue'
  import BuildNodeStatusBadges from 'components/BuildNodeStatusBadges.vue'
  import BuildNodeTasksTable from 'components/BuildNodeTasksTable.vue'
  import {autoRefreshMixin} from '../mixins/autoRefresh'
  import {
    BUILD_NODES_REFRESH_INTERVAL_MS,
    NODE_VERSION_HINT,
    describeApiError,
    describeNodeVersion,
    describeResources,
    formatDateTime,
    formatLoadAvg,
    formatTimeAgo,
    isAuthError,
    levelClass,
  } from '../buildNodeUtils'

  export default defineComponent({
    name: 'BuildNodeDetails',
    components: {
      BuildNodeActions,
      BuildNodeSlots,
      BuildNodeStats,
      BuildNodeStatusBadges,
      BuildNodeTasksTable,
    },
    mixins: [autoRefreshMixin(BUILD_NODES_REFRESH_INTERVAL_MS)],
    props: {
      nodeId: {type: [String, Number], required: true},
    },
    data() {
      return {
        nodeVersionHint: NODE_VERSION_HINT,
        node: null,
        error: null,
        loading: false,
        loadedAt: null,
        // bumped by every PATCH and node change so that responses
        // requested before it are dropped
        generation: 0,
      }
    },
    computed: {
      version() {
        return describeNodeVersion(this.node && this.node.version)
      },
      canManage() {
        return (
          this.$store.getters.isAuthenticated &&
          this.$store.getters.isAdmin === true
        )
      },
      refreshSeconds() {
        return Math.round(BUILD_NODES_REFRESH_INTERVAL_MS / 1000)
      },
      updatedText() {
        return formatTimeAgo(this.loadedAt, this.now)
      },
      hasOverride() {
        return (
          this.node.capacity_override !== null &&
          this.node.capacity_override !== undefined
        )
      },
      resources() {
        return describeResources(this.node, this.now)
      },
      loadAvgText() {
        let resources = this.node.resources
        return `${formatLoadAvg(resources)} on ${resources.cpu_count} CPUs`
      },
      errorMessage() {
        if (!this.error) {
          return ''
        }
        if (this.error.kind === 'not_found') {
          return (
            `Build node #${this.nodeId} was not found, or the build nodes ` +
            'API is not available on this server yet (HTTP 404).'
          )
        }
        return this.error.message
      },
    },
    watch: {
      nodeId() {
        this.generation++
        this.node = null
        this.error = null
        this.loadedAt = null
        // a refresh of the previous node may still be running: its result
        // is dropped, so start a new one once it is over
        Promise.resolve(this.autoRefreshInFlight).finally(() => {
          this.refreshNow()
        })
      },
    },
    methods: {
      isAuthError,
      levelClass,
      refresh() {
        let generation = this.generation
        this.loading = true
        return this.$api
          .get(`/build_nodes/${this.nodeId}`)
          .then((response) => {
            if (generation !== this.generation) {
              return
            }
            this.node = response.data
            this.loadedAt = Date.now()
            this.error = null
          })
          .catch((error) => {
            if (generation !== this.generation) {
              return
            }
            this.error = describeApiError(error)
            // the API interceptor shows a toast on every 401 and 403, so
            // polling on would flood the page with them
            if (isAuthError(this.error)) {
              this.autoRefreshEnabled = false
            }
          })
          .finally(() => {
            this.loading = false
          })
      },
      onNodeUpdated(updated) {
        if (!updated || !this.node) {
          return
        }
        this.generation++
        // PATCH returns the node without its recent tasks
        this.node = {...this.node, ...updated}
      },
      timeAgo(value) {
        return formatTimeAgo(value, this.now)
      },
      dateTime(value) {
        return formatDateTime(value)
      },
    },
  })
</script>

<style scoped>
  .build-node-stale {
    opacity: 0.55;
    font-style: italic;
  }

  .build-node-mono {
    font-family: monospace;
    word-break: break-all;
  }
</style>
