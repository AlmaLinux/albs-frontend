<template>
  <q-card flat bordered>
    <q-card-section class="q-py-sm">
      <div class="text-subtitle1">Queue</div>
    </q-card-section>
    <q-separator />
    <q-markup-table v-if="rows.length" flat dense separator="horizontal">
      <thead>
        <tr>
          <th class="text-left">Arch</th>
          <th class="text-right">Queued tasks</th>
          <th class="text-right">
            Accepting nodes
            <q-icon name="help_outline" size="xs" color="grey-7">
              <q-tooltip>
                Online nodes that take new tasks: enabled, not drained and not
                under maintenance
              </q-tooltip>
            </q-icon>
          </th>
          <th class="text-left" style="min-width: 180px">
            Busy / total slots
            <q-icon name="help_outline" size="xs" color="grey-7">
              <q-tooltip>
                Tasks running on the accepting nodes and their slots. Tasks of
                drained or disabled nodes and of nodes not in the registry are
                not counted here.
              </q-tooltip>
            </q-icon>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.arch" :class="rowClass(row)">
          <td class="text-weight-medium">
            {{ row.arch }}
            <q-icon
              v-if="row.info.level !== 'ok'"
              :name="row.info.level === 'critical' ? 'error' : 'warning'"
              :class="levelClass(row.info.level)"
              class="q-ml-xs"
            >
              <q-tooltip>{{ row.info.hint }}</q-tooltip>
            </q-icon>
          </td>
          <td class="text-right" :class="row.queued_tasks ? 'text-bold' : ''">
            {{ row.queued_tasks }}
          </td>
          <td class="text-right" :class="onlineNodesClass(row)">
            {{ row.online_nodes }}
          </td>
          <td>
            <div class="row items-center no-wrap q-gutter-sm">
              <q-linear-progress
                :value="row.info.ratio"
                :color="row.info.overloaded ? 'negative' : 'primary'"
                track-color="grey-3"
                size="8px"
                rounded
                style="width: 100px"
              />
              <span class="text-no-wrap">
                {{ row.info.busy }} / {{ row.info.total }}
              </span>
              <span
                v-if="row.info.unregistered > 0"
                class="text-caption text-orange-9 text-no-wrap"
              >
                +{{ row.info.unregistered }} on unregistered nodes
                <q-tooltip>
                  {{ row.info.unregistered }} task(s) are built by old nodes
                  that are not in the registry
                </q-tooltip>
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </q-markup-table>
    <q-card-section v-else class="text-grey-7">
      No architectures reported by the queue.
    </q-card-section>
  </q-card>
</template>

<script>
  import {defineComponent} from 'vue'
  import {Level, describeQueueRow, levelClass} from '../buildNodeUtils'

  export default defineComponent({
    name: 'BuildNodeQueueSummary',
    props: {
      queue: {type: Array, default: () => []},
    },
    computed: {
      rows() {
        return (this.queue || [])
          .map((row) => ({...row, info: describeQueueRow(row)}))
          .sort((a, b) => String(a.arch).localeCompare(String(b.arch)))
      },
    },
    methods: {
      levelClass,
      rowClass(row) {
        if (row.info.level === Level.CRITICAL) return 'bg-red-1'
        if (row.info.level === Level.WARNING) return 'bg-orange-1'
        return ''
      },
      onlineNodesClass(row) {
        if (row.online_nodes > 0) return ''
        if (!(row.queued_tasks > 0)) return 'text-grey-6'
        return levelClass(row.info.level)
      },
    },
  })
</script>
