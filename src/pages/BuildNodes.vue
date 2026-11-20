<template>
  <q-page class="q-px-xl q-pt-md q-pb-xl">
    <div class="row items-center q-gutter-sm q-mb-md">
      <div class="text-h5">Build nodes</div>
      <q-space />
      <span v-if="loadedAt" class="text-caption text-grey-7">
        Updated {{ updatedText }}
      </span>
      <q-toggle
        v-model="autoRefreshEnabled"
        dense
        label="Auto-refresh"
        id="bns-qt-auto-refresh"
      >
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
        id="bns-qb-refresh"
      >
        <q-tooltip>Refresh now</q-tooltip>
      </q-btn>
    </div>

    <q-banner
      v-if="error"
      rounded
      class="q-mb-md"
      :class="nodes === null ? 'bg-red-1' : 'bg-orange-1'"
    >
      <template v-slot:avatar>
        <q-icon
          :name="error.kind === 'not_found' ? 'cloud_off' : 'error_outline'"
          :color="nodes === null ? 'negative' : 'orange-9'"
        />
      </template>
      {{ error.message }}
      <span v-if="nodes !== null">
        Showing the data received {{ updatedText }}.
      </span>
      <span v-if="isAuthError(error) && !autoRefreshEnabled">
        Auto-refresh is turned off.
      </span>
      <template v-slot:action>
        <q-btn flat no-caps label="Retry" @click="refreshNow()" />
      </template>
    </q-banner>

    <div v-if="nodes === null && loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <template v-if="nodes !== null">
      <build-node-queue-summary
        v-if="queue !== null"
        :queue="queue"
        class="q-mb-md"
      />
      <q-banner v-if="queueError" rounded dense class="bg-orange-1 q-mb-md">
        <template v-slot:avatar>
          <q-icon name="error_outline" color="orange-9" />
        </template>
        Cannot load the queue summary: {{ queueError.message }}
      </q-banner>

      <q-table
        flat
        bordered
        dense
        :rows="nodes"
        :columns="columns"
        row-key="id"
        v-model:expanded="expanded"
        :filter="filter"
        :filter-method="filterNodes"
        v-model:pagination="pagination"
        :rows-per-page-options="[0]"
        hide-pagination
        :no-data-label="
          nodes.length ? 'No node matches the filter' : 'No build nodes yet'
        "
      >
        <template v-slot:top>
          <div class="row items-center q-gutter-sm full-width">
            <div class="text-subtitle1">Nodes</div>
            <q-chip
              v-for="counter in counters"
              :key="counter.label"
              dense
              square
              :color="counter.color"
              :text-color="counter.textColor"
            >
              {{ counter.value }} {{ counter.label }}
              <q-tooltip v-if="counter.tooltip" max-width="320px">
                {{ counter.tooltip }}
              </q-tooltip>
            </q-chip>
            <q-space />
            <q-input
              v-model="filter"
              dense
              outlined
              clearable
              debounce="200"
              placeholder="Filter by name, arch, status, version"
              style="min-width: 300px"
              id="bns-qi-filter"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </template>

        <template #header-cell-version="props">
          <q-th :props="props">
            {{ props.col.label }}
            <q-icon name="help_outline" size="xs" color="grey-7">
              <q-tooltip>{{ nodeVersionHint }}</q-tooltip>
            </q-icon>
          </q-th>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="expand" :props="props" auto-width>
              <q-btn
                flat
                round
                dense
                size="sm"
                :icon="props.expand ? 'expand_less' : 'expand_more'"
                @click="props.expand = !props.expand"
              >
                <q-tooltip>
                  {{ props.expand ? 'Hide tasks' : 'Show tasks' }}
                </q-tooltip>
              </q-btn>
            </q-td>
            <q-td key="name" :props="props">
              <router-link
                :to="`/build-nodes/${props.row.id}`"
                class="text-weight-medium"
              >
                {{ props.row.name }}
              </router-link>
            </q-td>
            <q-td key="status" :props="props">
              <build-node-status-badges stacked :node="props.row" :now="now" />
            </q-td>
            <q-td key="arches" :props="props">
              <span class="text-caption">
                {{ (props.row.supported_arches || []).join(', ') || '—' }}
              </span>
            </q-td>
            <q-td key="slots" :props="props">
              <build-node-slots :node="props.row" bar-width="60px" />
            </q-td>
            <template v-if="resourcesOf(props.row).missing">
              <q-td key="load" :props="props" class="text-grey-6">—</q-td>
              <q-td key="mem" :props="props" class="text-grey-6">—</q-td>
              <q-td key="disk" :props="props" class="text-grey-6">
                —
                <q-tooltip>The node has sent no host metrics</q-tooltip>
              </q-td>
            </template>
            <template v-else>
              <q-td
                key="load"
                :props="props"
                :class="metricClass(props.row, 'load')"
              >
                {{ resourcesOf(props.row).load.text }}
                <span class="text-caption">
                  {{ resourcesOf(props.row).load.sub }}
                </span>
                <q-tooltip>
                  {{ resourcesOf(props.row).load.tooltip }}
                  <template v-if="resourcesOf(props.row).stale">
                    <br />{{ resourcesOf(props.row).staleText }}
                  </template>
                </q-tooltip>
              </q-td>
              <q-td
                key="mem"
                :props="props"
                :class="metricClass(props.row, 'mem')"
              >
                {{ resourcesOf(props.row).mem.text }}
                <q-tooltip>
                  {{ resourcesOf(props.row).mem.tooltip }}
                  <template v-if="resourcesOf(props.row).stale">
                    <br />{{ resourcesOf(props.row).staleText }}
                  </template>
                </q-tooltip>
              </q-td>
              <q-td
                key="disk"
                :props="props"
                :class="metricClass(props.row, 'disk')"
              >
                <span class="text-no-wrap">
                  {{ resourcesOf(props.row).disk.text }}
                  <span class="text-caption">
                    ({{ resourcesOf(props.row).disk.sub }})
                  </span>
                </span>
                <q-icon
                  v-if="resourcesOf(props.row).stale"
                  name="history"
                  color="grey-7"
                  class="q-ml-xs"
                />
                <q-tooltip>
                  {{ resourcesOf(props.row).disk.tooltip }}
                  <template v-if="resourcesOf(props.row).stale">
                    <br />{{ resourcesOf(props.row).staleText }}
                  </template>
                </q-tooltip>
              </q-td>
            </template>
            <q-td key="version" :props="props">
              <span
                :class="
                  versionOf(props.row).commit
                    ? 'build-node-mono'
                    : 'text-grey-7'
                "
              >
                {{ versionOf(props.row).text }}
              </span>
              <q-tooltip>{{ versionOf(props.row).hint }}</q-tooltip>
            </q-td>
            <q-td key="last_seen" :props="props">
              <span class="text-no-wrap">
                {{ timeAgo(props.row.last_seen) }}
              </span>
              <q-tooltip v-if="props.row.last_seen">
                {{ dateTime(props.row.last_seen) }}
              </q-tooltip>
            </q-td>
            <q-td v-if="canManage" key="actions" :props="props">
              <build-node-actions
                compact
                :node="props.row"
                @updated="onNodeUpdated"
              />
            </q-td>
          </q-tr>
          <q-tr v-if="props.expand" :props="props" no-hover>
            <q-td colspan="100%" class="bg-grey-1">
              <div class="row q-col-gutter-md q-py-sm">
                <div class="col-12 col-lg-9">
                  <div class="text-subtitle2 q-mb-xs">
                    Active tasks ({{ (props.row.active_tasks || []).length }})
                  </div>
                  <build-node-tasks-table
                    :tasks="props.row.active_tasks || []"
                    :now="now"
                    empty-text="The node runs no tasks"
                  />
                </div>
                <div class="col-12 col-lg-3">
                  <div class="text-subtitle2 q-mb-xs">Last 24 hours</div>
                  <build-node-stats :stats="props.row.stats_24h" />
                  <div class="text-caption text-grey-8 q-mt-sm">
                    <div>Type: {{ props.row.node_type || '—' }}</div>
                    <div>
                      PESign: {{ props.row.pesign_support ? 'yes' : 'no' }}
                    </div>
                    <div v-if="!resourcesOf(props.row).missing">
                      Metrics updated
                      {{ resourcesOf(props.row).updatedText }}
                    </div>
                  </div>
                  <q-btn
                    flat
                    dense
                    no-caps
                    color="primary"
                    icon-right="arrow_forward"
                    label="Details and recent tasks"
                    class="q-mt-sm"
                    :to="`/build-nodes/${props.row.id}`"
                  />
                </div>
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </template>
  </q-page>
</template>

<script>
  import {defineComponent} from 'vue'
  import BuildNodeActions from 'components/BuildNodeActions.vue'
  import BuildNodeQueueSummary from 'components/BuildNodeQueueSummary.vue'
  import BuildNodeSlots from 'components/BuildNodeSlots.vue'
  import BuildNodeStats from 'components/BuildNodeStats.vue'
  import BuildNodeStatusBadges from 'components/BuildNodeStatusBadges.vue'
  import BuildNodeTasksTable from 'components/BuildNodeTasksTable.vue'
  import {autoRefreshMixin} from '../mixins/autoRefresh'
  import {
    BUILD_NODES_REFRESH_INTERVAL_MS,
    NODE_VERSION_HINT,
    NodeStatus,
    describeApiError,
    describeNodeVersion,
    describeResources,
    diskFreePercent,
    formatDateTime,
    formatTimeAgo,
    isAuthError,
    levelClass,
    loadPerCpu,
    memUsedPercent,
    nodeStatusKeys,
    nodeStatusRank,
    parseApiDate,
    slotTotals,
    slotUsage,
  } from '../buildNodeUtils'

  function orMinusOne(value) {
    return value === null || value === undefined ? -1 : value
  }

  export default defineComponent({
    name: 'BuildNodes',
    components: {
      BuildNodeActions,
      BuildNodeQueueSummary,
      BuildNodeSlots,
      BuildNodeStats,
      BuildNodeStatusBadges,
      BuildNodeTasksTable,
    },
    mixins: [autoRefreshMixin(BUILD_NODES_REFRESH_INTERVAL_MS)],
    data() {
      return {
        nodeVersionHint: NODE_VERSION_HINT,
        nodes: null,
        queue: null,
        error: null,
        queueError: null,
        loading: false,
        loadedAt: null,
        // bumped by every PATCH so that responses requested before it are
        // dropped instead of overwriting the updated node
        generation: 0,
        expanded: [],
        filter: '',
        pagination: {sortBy: 'name', descending: false, rowsPerPage: 0},
      }
    },
    computed: {
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
      resourcesById() {
        let result = {}
        for (let node of this.nodes || []) {
          result[node.id] = describeResources(node, this.now)
        }
        return result
      },
      counters() {
        let nodes = this.nodes || []
        let count = (status) =>
          nodes.filter((node) => nodeStatusKeys(node).includes(status)).length
        let slots = slotTotals(nodes)
        let busyTooltip =
          'Tasks running on the nodes that take new tasks (online, enabled, ' +
          'not drained, not under maintenance) and their slots'
        if (slots.otherBusy) {
          busyTooltip +=
            `. ${slots.otherBusy} more task(s) run on drained, disabled ` +
            'or offline nodes'
        }
        return [
          {
            label: 'online',
            value: count(NodeStatus.ONLINE),
            color: 'green-1',
            textColor: 'green-9',
          },
          {
            label: 'offline',
            value: count(NodeStatus.OFFLINE),
            color: count(NodeStatus.OFFLINE) ? 'red-1' : 'grey-2',
            textColor: count(NodeStatus.OFFLINE) ? 'negative' : 'grey-8',
          },
          {
            label: 'drain',
            value: count(NodeStatus.DRAIN),
            color: 'grey-2',
            textColor: 'grey-8',
          },
          {
            label: 'disabled',
            value: count(NodeStatus.DISABLED),
            color: 'grey-2',
            textColor: 'grey-8',
          },
          {
            label: 'busy slots',
            value: `${slots.busy} / ${slots.slots}`,
            color: 'blue-1',
            textColor: 'primary',
            tooltip: busyTooltip,
          },
        ]
      },
      columns() {
        let columns = [
          {name: 'expand', label: '', field: 'id', align: 'left'},
          {
            name: 'name',
            label: 'Name',
            field: 'name',
            align: 'left',
            sortable: true,
          },
          {
            name: 'status',
            label: 'Status',
            field: (row) => nodeStatusRank(row),
            align: 'left',
            sortable: true,
          },
          {
            name: 'arches',
            label: 'Arches',
            field: (row) => (row.supported_arches || []).join(', '),
            align: 'left',
          },
          {
            name: 'slots',
            label: 'Slots',
            field: (row) => slotUsage(row).percent,
            align: 'left',
            sortable: true,
          },
          {
            name: 'load',
            label: 'Load',
            field: (row) => orMinusOne(loadPerCpu(row.resources)),
            align: 'left',
            sortable: true,
          },
          {
            name: 'mem',
            label: 'RAM used',
            field: (row) => orMinusOne(memUsedPercent(row.resources)),
            align: 'left',
            sortable: true,
          },
          {
            name: 'disk',
            label: 'Disk free',
            field: (row) => orMinusOne(diskFreePercent(row.resources)),
            align: 'left',
            sortable: true,
          },
          {
            name: 'version',
            label: 'Version',
            field: (row) => row.version || '',
            align: 'left',
            sortable: true,
          },
          {
            name: 'last_seen',
            label: 'Last seen',
            field: (row) => {
              let date = parseApiDate(row.last_seen)
              return date ? date.getTime() : 0
            },
            align: 'left',
            sortable: true,
          },
        ]
        if (this.canManage) {
          columns.push({
            name: 'actions',
            label: 'Actions',
            field: 'id',
            align: 'left',
          })
        }
        return columns
      },
    },
    methods: {
      isAuthError,
      versionOf(node) {
        return describeNodeVersion(node.version)
      },
      refresh() {
        let generation = this.generation
        this.loading = true
        return Promise.allSettled([
          this.$api.get('/build_nodes/'),
          this.$api.get('/build_nodes/queue'),
        ])
          .then(([nodesResult, queueResult]) => {
            if (generation !== this.generation) {
              return
            }
            let failures = []
            if (nodesResult.status === 'fulfilled') {
              let data = nodesResult.value.data
              this.nodes = Array.isArray(data) ? data : []
              this.loadedAt = Date.now()
              this.error = null
            } else {
              this.error = describeApiError(nodesResult.reason)
              failures.push(this.error)
            }
            if (queueResult.status === 'fulfilled') {
              let data = queueResult.value.data
              this.queue = Array.isArray(data) ? data : []
              this.queueError = null
            } else {
              let queueError = describeApiError(queueResult.reason)
              failures.push(queueError)
              if (nodesResult.status === 'fulfilled') {
                this.queueError = queueError
              }
            }
            // the API interceptor shows a toast on every 401 and 403, so
            // polling on would flood the page with them
            if (failures.some(isAuthError)) {
              this.autoRefreshEnabled = false
            }
          })
          .finally(() => {
            this.loading = false
          })
      },
      onNodeUpdated(updated) {
        if (!updated || !this.nodes) {
          return
        }
        this.generation++
        let index = this.nodes.findIndex((node) => node.id === updated.id)
        if (index !== -1) {
          this.nodes.splice(index, 1, {...this.nodes[index], ...updated})
        }
      },
      resourcesOf(node) {
        return this.resourcesById[node.id] || describeResources(node, this.now)
      },
      metricClass(node, metric) {
        let info = this.resourcesOf(node)
        let classes = [levelClass(info[metric].level)]
        if (info.stale) {
          classes.push('build-node-stale')
        }
        return classes.join(' ')
      },
      timeAgo(value) {
        return formatTimeAgo(value, this.now)
      },
      dateTime(value) {
        return formatDateTime(value)
      },
      filterNodes(rows, terms) {
        let needle = (terms || '').trim().toLowerCase()
        if (!needle) {
          return rows
        }
        return rows.filter((node) =>
          [
            node.name,
            node.version,
            node.node_type,
            ...(node.supported_arches || []),
            ...nodeStatusKeys(node),
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(needle))
        )
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
    white-space: nowrap;
  }
</style>
