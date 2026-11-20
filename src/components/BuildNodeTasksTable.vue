<template>
  <q-markup-table flat bordered dense separator="horizontal">
    <thead>
      <tr>
        <th class="text-left">Task</th>
        <th class="text-left">Build</th>
        <th class="text-left">Package</th>
        <th class="text-left">Arch</th>
        <th v-if="recent" class="text-left">Status</th>
        <th class="text-left">Claimed</th>
        <th v-if="recent" class="text-left">Finished</th>
        <th class="text-right">{{ recent ? 'Duration' : 'Running for' }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="!tasks || !tasks.length">
        <td :colspan="recent ? 8 : 6" class="text-center text-grey-7">
          {{ emptyText }}
        </td>
      </tr>
      <tr
        v-for="task in tasks"
        :key="task.id"
        :class="isLong(task) ? 'bg-orange-1' : ''"
      >
        <td>
          <router-link
            v-if="task.build_id"
            :to="`/build/${task.build_id}/logs/${task.id}`"
          >
            {{ task.id }}
            <q-tooltip>Open the task logs</q-tooltip>
          </router-link>
          <span v-else>{{ task.id }}</span>
        </td>
        <td>
          <router-link v-if="task.build_id" :to="`/build/${task.build_id}`">
            {{ task.build_id }}
          </router-link>
          <span v-else>—</span>
        </td>
        <td class="ellipsis" style="max-width: 280px">
          <a
            v-if="task.ref_url"
            :href="task.ref_url"
            target="_blank"
            rel="noopener"
          >
            {{ packageName(task) }}
          </a>
          <span v-else>—</span>
          <q-tooltip v-if="task.ref_url">{{ task.ref_url }}</q-tooltip>
        </td>
        <td>{{ task.arch }}</td>
        <td v-if="recent">
          <q-badge
            :color="statusInfo(task).color"
            :label="statusInfo(task).text"
          />
        </td>
        <td>
          {{ timeAgo(task.claimed_at) }}
          <q-tooltip>{{ dateTime(task.claimed_at) }}</q-tooltip>
        </td>
        <td v-if="recent">
          {{ task.finished_at ? timeAgo(task.finished_at) : '—' }}
          <q-tooltip v-if="task.finished_at">
            {{ dateTime(task.finished_at) }}
          </q-tooltip>
        </td>
        <td
          class="text-right"
          :class="isLong(task) ? 'text-orange-9 text-weight-bold' : ''"
        >
          <q-icon v-if="isLong(task)" name="schedule" class="q-mr-xs">
            <q-tooltip>
              Running for longer than {{ longRunningText }}
            </q-tooltip>
          </q-icon>
          {{ duration(task) }}
        </td>
      </tr>
    </tbody>
  </q-markup-table>
</template>

<script>
  import {defineComponent} from 'vue'
  import {
    LONG_RUNNING_TASK_MS,
    formatDateTime,
    formatDuration,
    formatTimeAgo,
    isLongRunningTask,
    packageNameFromRef,
    taskDurationMs,
    taskStatusInfo,
  } from '../buildNodeUtils'

  export default defineComponent({
    name: 'BuildNodeTasksTable',
    props: {
      tasks: {type: Array, default: () => []},
      now: {type: Number, required: true},
      // finished tasks with a status instead of the active ones
      recent: {type: Boolean, default: false},
      emptyText: {type: String, default: 'No tasks'},
    },
    computed: {
      longRunningText() {
        return formatDuration(LONG_RUNNING_TASK_MS)
      },
    },
    methods: {
      packageName(task) {
        return packageNameFromRef(task.ref_url) || task.ref_url
      },
      statusInfo(task) {
        return taskStatusInfo(task.status)
      },
      timeAgo(value) {
        return formatTimeAgo(value, this.now, '—')
      },
      dateTime(value) {
        return formatDateTime(value)
      },
      duration(task) {
        return formatDuration(taskDurationMs(task, this.now))
      },
      isLong(task) {
        return !this.recent && isLongRunningTask(task, this.now)
      },
    },
  })
</script>
